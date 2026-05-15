function registerAnalyticsRoutes(app, {
  prisma,
  authRequired,
  crypto,
  fetch,
  pythonServiceUrl,
  buildAnalysisOptionsPayload,
  buildAccountStatePayload,
  storedTradeToJournalEntry,
  buildJournalEntryMatchKey,
  createFailedAnalysisRun,
  assertMlAnalysisAccess,
  getPreferredBrokerAccountId,
  parseCsvTradesFromPython,
  persistTradesToMemory,
  loadStoredTradesForAnalysis,
  deriveTradeDateRange,
  estimateAnalysisCost,
  buildTradeFingerprint,
  buildTradeIdentity,
  waitForFreshHistoryExports,
  getLatestHistoryExports,
  dedupeTrades,
  extractTradesFromEvents,
  reportMlRunUsageToStripe,
  buildSnapshotReport,
  analysisJobContext,
  analysisDataDeletedMarker,
}) {
  function normalizeTradeIdentityList(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    return values.filter((value) => typeof value === "string" && value.trim());
  }

  function toFiniteNumberOrNull(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  function normalizeAnalysisJobContext(rawContext, fallback = {}) {
    const source = rawContext && typeof rawContext === "object" ? rawContext : {};
    const normalized = {
      userId:
        typeof source.userId === "string" && source.userId.trim()
          ? source.userId
          : typeof fallback.userId === "string"
            ? fallback.userId
            : null,
      analysisRunId:
        typeof source.analysisRunId === "string" && source.analysisRunId.trim()
          ? source.analysisRunId
          : typeof fallback.analysisRunId === "string"
            ? fallback.analysisRunId
            : null,
      tradeFingerprint:
        typeof source.tradeFingerprint === "string" && source.tradeFingerprint.trim()
          ? source.tradeFingerprint
          : null,
      allTradeIdentities: normalizeTradeIdentityList(source.allTradeIdentities),
      tradeIdentities: normalizeTradeIdentityList(source.tradeIdentities),
      requestedTradeCount:
        Number.isInteger(source.requestedTradeCount) ? source.requestedTradeCount : null,
      uniqueTradeCount:
        Number.isInteger(source.uniqueTradeCount) ? source.uniqueTradeCount : null,
      availableTradeCount:
        Number.isInteger(source.availableTradeCount) ? source.availableTradeCount : null,
      duplicateTradeCount:
        Number.isInteger(source.duplicateTradeCount) ? source.duplicateTradeCount : 0,
      mode: typeof source.mode === "string" && source.mode.trim() ? source.mode : null,
    };

    return normalized;
  }

  async function persistAnalysisJobContext(jobId, jobContext) {
    if (!jobContext?.analysisRunId || !jobId) {
      return;
    }

    const normalizedContext = normalizeAnalysisJobContext(jobContext);
    await prisma.analysisRun.update({
      where: { id: normalizedContext.analysisRunId },
      data: {
        pythonJobId: jobId,
        jobContext: normalizedContext,
      },
    });
  }

  async function loadAnalysisJobContext(userId, jobId) {
    const persistedRun = await prisma.analysisRun.findFirst({
      where: {
        userId,
        pythonJobId: jobId,
      },
      select: {
        id: true,
        cost: true,
        jobContext: true,
      },
    });

    if (!persistedRun) {
      return { jobContext: null, analysisRunSummary: null };
    }

    const jobContext = normalizeAnalysisJobContext(persistedRun.jobContext, {
      userId,
      analysisRunId: persistedRun.id,
    });

    return {
      jobContext,
      analysisRunSummary: {
        id: persistedRun.id,
        cost: toFiniteNumberOrNull(persistedRun.cost),
      },
    };
  }

  async function handleAnalysisStateRequest(req, res, next) {
    try {
      return res.json({ ok: true, ...(await buildAccountStatePayload(req.user.id)) });
    } catch (err) {
      return next(err);
    }
  }

  app.get("/api/analyse/options", authRequired, async (req, res, next) => {
    try {
      return res.json({
        ok: true,
        ...(await buildAnalysisOptionsPayload(req.user.id, {
          requestFresh: true,
          syncStoredTrades: true,
        })),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/account/analysis-state", authRequired, handleAnalysisStateRequest);

  // Compatibility alias for older clients. Use /api/account/analysis-state going forward.
  app.get("/api/account/state", authRequired, handleAnalysisStateRequest);

  app.get("/api/analyse/latest", authRequired, async (req, res, next) => {
    try {
      const { latestAnalysis } = await buildAccountStatePayload(req.user.id);
      return res.json({ ok: true, latestAnalysis });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/analyse/history", authRequired, async (req, res, next) => {
    try {
      const { history } = await buildAccountStatePayload(req.user.id);
      return res.json({ ok: true, history });
    } catch (err) {
      return next(err);
    }
  });

  app.delete("/api/analyse/history/:runId", authRequired, async (req, res, next) => {
    try {
      const runId = String(req.params.runId || "").trim();
      const deleteJournalData = req.body?.deleteJournalData === true;
      if (!runId) {
        return res.status(400).json({ ok: false, error: "Analysis run id is required." });
      }

      const run = await prisma.analysisRun.findFirst({
        where: { id: runId, userId: req.user.id },
        select: {
          id: true,
          status: true,
          analysisSnapshotId: true,
          cost: true,
          analysisSnapshot: {
            select: {
              report: true,
            },
          },
        },
      });

      if (!run) {
        return res.status(404).json({ ok: false, error: "Analysis run not found." });
      }

      if (run.status === "RUNNING") {
        return res.status(400).json({ ok: false, error: "A running analysis cannot be deleted." });
      }

      const snapshotMetadata =
        run.analysisSnapshot?.report &&
        typeof run.analysisSnapshot.report === "object" &&
        run.analysisSnapshot.report.metadata &&
        typeof run.analysisSnapshot.report.metadata === "object"
          ? run.analysisSnapshot.report.metadata
          : null;
      const snapshotTradeIdentities = Array.isArray(snapshotMetadata?.trade_identities)
        ? snapshotMetadata.trade_identities.filter((value) => typeof value === "string" && value.trim())
        : [];

      if (deleteJournalData && snapshotTradeIdentities.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "This run does not contain linked journal trade identities, so only ML data can be deleted.",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.analysisRun.update({
          where: { id: run.id },
          data: {
            analysisSnapshotId: null,
            error: analysisDataDeletedMarker,
          },
        });

        if (run.analysisSnapshotId) {
          const remainingLinkedRuns = await tx.analysisRun.count({
            where: {
              analysisSnapshotId: run.analysisSnapshotId,
              id: { not: run.id },
            },
          });

          if (remainingLinkedRuns === 0) {
            await tx.analysisSnapshot.deleteMany({
              where: { id: run.analysisSnapshotId, userId: req.user.id },
            });
          }
        }

        if (deleteJournalData) {
          await tx.storedTrade.deleteMany({
            where: {
              userId: req.user.id,
              tradeIdentity: { in: snapshotTradeIdentities },
            },
          });
        }
      });

      return res.json({
        ok: true,
        runId: run.id,
        cost: run.cost ?? null,
        deletedData: true,
        deletedJournalData: deleteJournalData,
        message: deleteJournalData
          ? "Saved analysis data for this run was deleted and the linked journal trades for that run were cleared. The billed run record was kept."
          : "Saved analysis data was deleted for this run, but the billed run record was kept.",
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/trades", authRequired, async (req, res, next) => {
    try {
      const { trades, pnlMeta } = await buildAccountStatePayload(req.user.id);
      return res.json({ ok: true, trades, pnlMeta });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/trades/fetch", authRequired, async (req, res, next) => {
    try {
      const brokerAccounts = await prisma.brokerAccount.findMany({
        where: { userId: req.user.id, isActive: true },
        select: { id: true },
      });
      const brokerAccountIds = brokerAccounts.map((account) => account.id);

      if (brokerAccountIds.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "No active MetaTrader account is connected yet. Add your broker account in Settings before fetching trade data.",
        });
      }

      const tradeCountBefore = await prisma.storedTrade.count({
        where: { userId: req.user.id },
      });

      const analysisOptions = await buildAnalysisOptionsPayload(req.user.id, {
        requestFresh: true,
        syncStoredTrades: true,
      });
      const accountState = await buildAccountStatePayload(req.user.id);
      const tradeCountAfter = Array.isArray(accountState.trades) ? accountState.trades.length : tradeCountBefore;
      const importedTradeCount = Math.max(0, tradeCountAfter - tradeCountBefore);

      return res.json({
        ok: true,
        importedTradeCount,
        message:
          importedTradeCount > 0
            ? `Fetched ${importedTradeCount} new trade${importedTradeCount === 1 ? "" : "s"} into your journal.`
            : "No new closed trades were available from MetaTrader right now, but your journal has been refreshed.",
        analysisOptions,
        trades: accountState.trades,
        pnlMeta: accountState.pnlMeta,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/trades/import-csv", authRequired, async (req, res, next) => {
    try {
      const replaceDataset =
        req.query.replace === "1" ||
        req.query.replace === "true" ||
        req.query.replace === "yes";
      const brokerAccountId = await getPreferredBrokerAccountId(req.user.id);
      const parsedTrades = await parseCsvTradesFromPython(req);

      if (replaceDataset) {
        await prisma.$transaction(async (tx) => {
          await tx.analysisRun.deleteMany({
            where: { userId: req.user.id },
          });

          await tx.analysisSnapshot.deleteMany({
            where: { userId: req.user.id },
          });

          await tx.storedTrade.deleteMany({
            where: { userId: req.user.id },
          });
        });
      }

      const persistSummary = await persistTradesToMemory(req.user.id, parsedTrades, {
        brokerAccountId,
        source: "csv_import",
        seenAt: new Date(),
      });
      const analysisOptions = await buildAnalysisOptionsPayload(req.user.id, {
        requestFresh: false,
        syncStoredTrades: false,
      });
      const accountState = await buildAccountStatePayload(req.user.id);

      return res.json({
        ok: true,
        importedTradeCount: persistSummary.stored,
        duplicateTradeCount: persistSummary.updated,
        invalidTradeCount: persistSummary.invalid,
        message:
          persistSummary.stored > 0
            ? `Imported ${persistSummary.stored} new trade${persistSummary.stored === 1 ? "" : "s"} into your journal.`
            : "This CSV did not add any new trades, but your journal has been refreshed.",
        analysisOptions,
        trades: accountState.trades,
        pnlMeta: accountState.pnlMeta,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.patch("/api/trades/:tradeIdentity/journal", authRequired, async (req, res, next) => {
    try {
      const tradeIdentity = decodeURIComponent(req.params.tradeIdentity || "");
      if (!tradeIdentity) {
        return res.status(400).json({ ok: false, error: "Trade identity is required." });
      }

      const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
      const emotions = typeof req.body?.emotions === "string" ? req.body.emotions.trim() : "";
      const lessonsLearned =
        typeof req.body?.lessonsLearned === "string" ? req.body.lessonsLearned.trim() : "";

      let storedTrade = await prisma.storedTrade.findUnique({
        where: {
          userId_tradeIdentity: {
            userId: req.user.id,
            tradeIdentity,
          },
        },
      });

      if (!storedTrade) {
        const requestedMatchKey = buildJournalEntryMatchKey({
          pair: req.body?.pair,
          direction: req.body?.direction,
          date: req.body?.date,
          entryTime: req.body?.entryTime,
          exitTime: req.body?.exitTime,
          entryPrice: req.body?.entryPrice,
          exitPrice: req.body?.exitPrice,
        });

        const candidateTrades = await prisma.storedTrade.findMany({
          where: { userId: req.user.id },
          orderBy: [{ exitTime: "desc" }, { updatedAt: "desc" }],
        });

        storedTrade =
          candidateTrades.find(
            (candidate) =>
              buildJournalEntryMatchKey(storedTradeToJournalEntry(candidate)) === requestedMatchKey
          ) || null;
      }

      if (!storedTrade) {
        return res.status(404).json({ ok: false, error: "Trade not found." });
      }

      const updatedTrade = await prisma.storedTrade.update({
        where: { id: storedTrade.id },
        data: {
          notes: notes || null,
          emotions: emotions || null,
          lessonsLearned: lessonsLearned || null,
        },
      });

      return res.json({
        ok: true,
        trade: storedTradeToJournalEntry(updatedTrade),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.delete("/api/account/analysis-data", authRequired, async (req, res, next) => {
    try {
      await prisma.$transaction(async (tx) => {
        const brokerAccounts = await tx.brokerAccount.findMany({
          where: { userId: req.user.id },
          select: { id: true },
        });
        const brokerAccountIds = brokerAccounts.map((account) => account.id);

        if (brokerAccountIds.length > 0) {
          await tx.eaEvent.deleteMany({
            where: {
              brokerAccountId: { in: brokerAccountIds },
            },
          });
        }

        await tx.analysisRun.deleteMany({
          where: { userId: req.user.id },
        });

        await tx.analysisSnapshot.deleteMany({
          where: { userId: req.user.id },
        });

        await tx.storedTrade.deleteMany({
          where: { userId: req.user.id },
        });
      });

      return res.json({
        ok: true,
        message: "Saved analysis runs, snapshots, stored trade history, and MetaTrader event history were cleared for this account.",
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/analyse/csv", authRequired, async (req, res, next) => {
    let analysisRun = null;
    try {
      await assertMlAnalysisAccess(req.user.id);

      const tradeCount = 500;
      const mode = "trades";
      const replaceDataset =
        req.query.replace === "1" ||
        req.query.replace === "true" ||
        req.query.replace === "yes";
      const brokerAccountId = await getPreferredBrokerAccountId(req.user.id);
      const parsedTrades = await parseCsvTradesFromPython(req);

      if (replaceDataset) {
        await prisma.$transaction(async (tx) => {
          await tx.analysisRun.deleteMany({
            where: { userId: req.user.id },
          });

          await tx.analysisSnapshot.deleteMany({
            where: { userId: req.user.id },
          });

          await tx.storedTrade.deleteMany({
            where: { userId: req.user.id },
          });
        });
      }

      const persistSummary = await persistTradesToMemory(req.user.id, parsedTrades, {
        brokerAccountId,
        source: "csv_import",
        seenAt: new Date(),
      });
      const pendingTrades = await loadStoredTradesForAnalysis(req.user.id, {
        mode,
        tradeCount,
        pendingOnly: true,
      });

      if (pendingTrades.length === 0) {
        analysisRun = await createFailedAnalysisRun(req.user.id, {
          mode,
          requestedTrades: parsedTrades.length,
          tradesAnalysed: 0,
          cost: 0,
          periodDescription: replaceDataset ? "CSV import (replaced account dataset)" : "CSV import",
          error: "This CSV did not add any new trades that still need analysing.",
        });
        return res.status(400).json({
          ok: false,
          error: "This CSV did not add any new trades that still need analysing.",
          analysisRunId: analysisRun.id,
        });
      }

      const allTrades = await loadStoredTradesForAnalysis(req.user.id, {
        mode,
        tradeCount,
        pendingOnly: false,
      });

      const csvDateRange = deriveTradeDateRange(allTrades);
      const estimatedCost = await estimateAnalysisCost(req.user.id, pendingTrades.length);
      analysisRun = await prisma.analysisRun.create({
        data: {
          userId: req.user.id,
          status: "RUNNING",
          mode: "csv",
          requestedTrades: parsedTrades.length,
          tradesAnalysed: allTrades.length,
          cost: estimatedCost,
          periodDescription: replaceDataset ? "CSV import (replaced account dataset)" : "CSV import",
          dateRangeStart: csvDateRange.start,
          dateRangeEnd: csvDateRange.end,
        },
      });

      const tradeFingerprint = buildTradeFingerprint(allTrades, req.user.id);
      const pythonRes = await fetch(`${pythonServiceUrl}/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trades: allTrades,
          run_optimisation: true,
          run_survival: true,
          run_clustering: true,
          n_clusters: 4,
        }),
      });

      if (!pythonRes.ok) {
        const err = await pythonRes.text();
        await prisma.analysisRun.update({
          where: { id: analysisRun.id },
          data: {
            status: "FAILED",
            error: "Analysis service error: " + err,
            completedAt: new Date(),
          },
        });
        return res.status(502).json({ ok: false, error: "Analysis service error: " + err });
      }

      const { job_id } = await pythonRes.json();
      const jobContext = {
        userId: req.user.id,
        analysisRunId: analysisRun.id,
        tradeFingerprint,
        allTradeIdentities: allTrades
          .map((trade) => buildTradeIdentity(trade, req.user.id))
          .filter(Boolean),
        tradeIdentities: pendingTrades
          .map((trade) => buildTradeIdentity(trade, req.user.id))
          .filter(Boolean),
        requestedTradeCount: tradeCount,
        uniqueTradeCount: allTrades.length,
        availableTradeCount: allTrades.length,
        duplicateTradeCount: persistSummary.updated,
        mode,
      };
      analysisJobContext.set(job_id, jobContext);
      await persistAnalysisJobContext(job_id, jobContext);

      return res.json({
        ok: true,
        jobId: job_id,
        analysisRunId: analysisRun.id,
        estimatedCost,
        availableTradeCount: allTrades.length,
        pendingTradeCount: pendingTrades.length,
        duplicateTradeCount: persistSummary.updated,
        importedTradeCount: parsedTrades.length,
        storedTradeCount: persistSummary.stored,
      });
    } catch (err) {
      if (analysisRun?.id) {
        await prisma.analysisRun.update({
          where: { id: analysisRun.id },
          data: {
            status: "FAILED",
            error: err instanceof Error ? err.message : "Analysis failed to start",
            completedAt: new Date(),
          },
        }).catch(() => {});
      }
      return next(err);
    }
  });

  app.post("/api/analyse/mt5", authRequired, async (req, res, next) => {
    let analysisRun = null;
    try {
      await assertMlAnalysisAccess(req.user.id);

      const { login, password, server, days = 90, symbol } = req.body || {};
      const parsedDays = Number.parseInt(String(days), 10);
      const lookbackDays = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 90;

      analysisRun = await prisma.analysisRun.create({
        data: {
          userId: req.user.id,
          status: "RUNNING",
          mode: "mt5",
          requestedTrades: null,
          tradesAnalysed: null,
          cost: 0,
          periodDescription: `MetaTrader import (${lookbackDays} day${lookbackDays === 1 ? "" : "s"})`,
          dateRangeStart: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000),
          dateRangeEnd: new Date(),
        },
      });

      const pythonRes = await fetch(`${pythonServiceUrl}/analyse/mt5`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: login ? Number.parseInt(String(login), 10) : null,
          password: password || null,
          server: server || null,
          days: lookbackDays,
          symbol: symbol || null,
        }),
      });

      const data = await pythonRes.json().catch(() => ({}));

      if (!pythonRes.ok) {
        await prisma.analysisRun.update({
          where: { id: analysisRun.id },
          data: {
            status: "FAILED",
            error: data.detail || data.error || "Analysis service error",
            completedAt: new Date(),
          },
        });
        return res.status(502).json({ ok: false, error: data.detail || data.error || "Analysis service error" });
      }

      const jobId = data.job_id;
      const jobContext = {
        userId: req.user.id,
        analysisRunId: analysisRun.id,
        tradeFingerprint: null,
        allTradeIdentities: [],
        tradeIdentities: [],
        requestedTradeCount: null,
        uniqueTradeCount: null,
        availableTradeCount: null,
        duplicateTradeCount: 0,
        mode: "mt5",
      };
      analysisJobContext.set(jobId, jobContext);
      await persistAnalysisJobContext(jobId, jobContext);

      return res.json({
        ok: true,
        jobId,
        analysisRunId: analysisRun.id,
        estimatedCost: 0,
      });
    } catch (err) {
      if (analysisRun?.id) {
        await prisma.analysisRun.update({
          where: { id: analysisRun.id },
          data: {
            status: "FAILED",
            error: err instanceof Error ? err.message : "Analysis failed to start",
            completedAt: new Date(),
          },
        }).catch(() => {});
      }
      return next(err);
    }
  });

  app.post("/api/analyse", authRequired, async (req, res, next) => {
    let analysisRun = null;
    try {
      await assertMlAnalysisAccess(req.user.id);

      const { tradeCount = 500, months = 12, mode = "trades" } = req.body || {};

      const brokerAccounts = await prisma.brokerAccount.findMany({
        where: { userId: req.user.id, isActive: true },
        select: { id: true },
      });
      const brokerAccountIds = brokerAccounts.map((b) => b.id);
      let persistSummary = { stored: 0, updated: 0, invalid: 0 };
      let pendingTrades = await loadStoredTradesForAnalysis(req.user.id, {
        mode,
        tradeCount,
        months,
        pendingOnly: true,
      });

      if (brokerAccountIds.length > 0 && pendingTrades.length === 0) {
        const exportRequestToken = crypto.randomUUID();
        const exportRequestedAt = new Date();

        await prisma.eaEvent.createMany({
          data: brokerAccountIds.map((brokerAccountId) => ({
            brokerAccountId,
            type: "EXPORT_REQUEST",
            payload: {
              requestToken: exportRequestToken,
              requestedByUserId: req.user.id,
              requestedAt: exportRequestedAt.toISOString(),
            },
            receivedAt: exportRequestedAt,
          })),
        });

        const freshExportEvents = await waitForFreshHistoryExports(
          brokerAccountIds,
          {
            receivedAt: exportRequestedAt,
            requestToken: exportRequestToken,
          },
          15000
        );

        let events =
          freshExportEvents.length > 0
            ? freshExportEvents
            : await getLatestHistoryExports(brokerAccountIds, {
                since: { requestToken: exportRequestToken },
              });
        if (events.length === 0) {
          events = await getLatestHistoryExports(brokerAccountIds);
        }
        const freshRows = dedupeTrades(extractTradesFromEvents(events));
        const tradesByBrokerAccount = new Map();

        for (const row of freshRows) {
          const rows = tradesByBrokerAccount.get(row.brokerAccountId) || [];
          rows.push(row.trade);
          tradesByBrokerAccount.set(row.brokerAccountId, rows);
        }

        for (const [brokerAccountId, trades] of tradesByBrokerAccount.entries()) {
          const summary = await persistTradesToMemory(req.user.id, trades, {
            brokerAccountId,
            source: "ea_history_export",
            seenAt: exportRequestedAt,
          });
          persistSummary.stored += summary.stored;
          persistSummary.updated += summary.updated;
          persistSummary.invalid += summary.invalid;
        }

        pendingTrades = await loadStoredTradesForAnalysis(req.user.id, {
          mode,
          tradeCount,
          months,
          pendingOnly: true,
        });
      }

      if (pendingTrades.length === 0) {
        analysisRun = await createFailedAnalysisRun(req.user.id, {
          mode,
          requestedTrades: mode === "trades" ? tradeCount : null,
          tradesAnalysed: 0,
          cost: 0,
          periodDescription:
            mode === "months"
              ? `Last ${months} month${months === 1 ? "" : "s"}`
              : "No new trades pending analysis",
          error:
            brokerAccountIds.length > 0
              ? "No new closed trades were received from MetaTrader for analysis. Keep the terminal open, make sure the latest EA is attached, or wait for new trades before running again."
              : "No stored trades found yet. Upload a CSV or connect the MetaTrader EA before running analysis.",
        });
        return res.status(400).json({
          ok: false,
          error:
            brokerAccountIds.length > 0
              ? "No new closed trades were received from MetaTrader for analysis. Keep the terminal open, make sure the latest EA is attached, or wait for new trades before running again."
              : "No stored trades found yet. Upload a CSV or connect the MetaTrader EA before running analysis.",
          analysisRunId: analysisRun.id,
        });
      }

      const allTrades = await loadStoredTradesForAnalysis(req.user.id, {
        mode,
        tradeCount,
        months,
        pendingOnly: false,
      });

      const analysisDateRange = deriveTradeDateRange(allTrades);
      const periodDescription =
        mode === "months"
          ? `Last ${months} month${months === 1 ? "" : "s"}`
          : `${pendingTrades.length} new trade${pendingTrades.length === 1 ? "" : "s"} added to ${allTrades.length} total`;
      const estimatedCost = await estimateAnalysisCost(req.user.id, pendingTrades.length);
      analysisRun = await prisma.analysisRun.create({
        data: {
          userId: req.user.id,
          status: "RUNNING",
          mode,
          requestedTrades: mode === "trades" ? tradeCount : null,
          tradesAnalysed: allTrades.length,
          cost: estimatedCost,
          periodDescription,
          dateRangeStart: analysisDateRange.start,
          dateRangeEnd: analysisDateRange.end,
        },
      });

      const uniqueTradeCount = allTrades.length;
      const duplicateTradeCount = persistSummary.updated;
      const tradeFingerprint = buildTradeFingerprint(allTrades, req.user.id);

      const pythonRes = await fetch(`${pythonServiceUrl}/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trades: allTrades,
          run_optimisation: true,
          run_survival: true,
          run_clustering: true,
          n_clusters: 4,
        }),
      });

      if (!pythonRes.ok) {
        const err = await pythonRes.text();
        console.error("Python service error:", err);
        await prisma.analysisRun.update({
          where: { id: analysisRun.id },
          data: {
            status: "FAILED",
            error: "Analysis service error: " + err,
            completedAt: new Date(),
          },
        });
        return res.status(502).json({ ok: false, error: "Analysis service error: " + err });
      }

      const { job_id } = await pythonRes.json();
      const jobContext = {
        userId: req.user.id,
        analysisRunId: analysisRun.id,
        tradeFingerprint,
        allTradeIdentities: allTrades
          .map((trade) => buildTradeIdentity(trade, req.user.id))
          .filter(Boolean),
        tradeIdentities: pendingTrades
          .map((trade) => buildTradeIdentity(trade, req.user.id))
          .filter(Boolean),
        requestedTradeCount: mode === "trades" ? tradeCount : null,
        uniqueTradeCount: allTrades.length,
        availableTradeCount: uniqueTradeCount,
        duplicateTradeCount,
        mode,
      };
      analysisJobContext.set(job_id, jobContext);
      await persistAnalysisJobContext(job_id, jobContext);
      return res.json({
        ok: true,
        jobId: job_id,
        analysisRunId: analysisRun.id,
        estimatedCost,
        availableTradeCount: uniqueTradeCount,
        pendingTradeCount: pendingTrades.length,
        duplicateTradeCount,
        dedupedTradeCount: allTrades.length,
        storedTradeCount: persistSummary.stored,
      });
    } catch (err) {
      if (analysisRun?.id) {
        await prisma.analysisRun.update({
          where: { id: analysisRun.id },
          data: {
            status: "FAILED",
            error: err instanceof Error ? err.message : "Analysis failed to start",
            completedAt: new Date(),
          },
        }).catch(() => {});
      }
      return next(err);
    }
  });

  app.get("/api/analyse/:jobId", authRequired, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      let jobContext = analysisJobContext.get(jobId) || null;
      let analysisRunSummary = null;

      if (!jobContext) {
        const persistedContext = await loadAnalysisJobContext(req.user.id, jobId);
        jobContext = persistedContext.jobContext;
        analysisRunSummary = persistedContext.analysisRunSummary;
        if (jobContext) {
          analysisJobContext.set(jobId, jobContext);
        }
      }

      if (jobContext?.userId && jobContext.userId !== req.user.id) {
        return res.status(404).json({ ok: false, error: "Job not found" });
      }

      if (!analysisRunSummary && jobContext?.analysisRunId) {
        analysisRunSummary = await prisma.analysisRun.findUnique({
          where: { id: jobContext.analysisRunId },
          select: { cost: true },
        });
      }

      const pythonRes = await fetch(`${pythonServiceUrl}/results/${jobId}`);

      if (pythonRes.status === 404) {
        return res.status(404).json({ ok: false, error: "Job not found" });
      }

      if (!pythonRes.ok) {
        if (jobContext?.analysisRunId) {
          await prisma.analysisRun.update({
            where: { id: jobContext.analysisRunId },
            data: {
              status: "FAILED",
              error: "Analysis service unavailable",
              completedAt: new Date(),
            },
          });
        }
        return res.status(502).json({ ok: false, error: "Analysis service unavailable" });
      }

      const data = await pythonRes.json();

      if (data.status === "complete" && data.report) {
        const originalPerformance = data.report.summary?.original_performance ?? {};
        const riskMetrics = data.report.risk_recommendations?.risk_metrics ?? {};

        const snapshotReport = buildSnapshotReport(data.report, {
          trade_fingerprint: jobContext?.tradeFingerprint ?? null,
          trade_identities: Array.isArray(jobContext?.allTradeIdentities) ? jobContext.allTradeIdentities : [],
          unique_trade_count: jobContext?.uniqueTradeCount ?? data.trades_analysed ?? originalPerformance.n_trades ?? null,
          duplicate_trade_count: jobContext?.duplicateTradeCount ?? 0,
          available_trade_count: jobContext?.availableTradeCount ?? null,
          simulations_run: data.simulations_run ?? null,
          regimes_found: data.regimes_found ?? null,
        });

        let existingSnapshot = null;
        if (jobContext?.tradeFingerprint) {
          existingSnapshot = await prisma.analysisSnapshot.findFirst({
            where: {
              userId: req.user.id,
              report: {
                path: ["metadata", "trade_fingerprint"],
                equals: jobContext.tradeFingerprint,
              },
            },
            orderBy: { updatedAt: "desc" },
          });
        }

        const snapshotData = {
          userId: req.user.id,
          report: snapshotReport,
          tradesAnalysed: data.trades_analysed ?? jobContext?.uniqueTradeCount ?? originalPerformance.n_trades ?? null,
          avgRMultiple: data.avg_r_multiple ?? originalPerformance.avg_r ?? null,
          winRate: originalPerformance.win_rate ?? null,
          sharpeRatio: originalPerformance.sharpe_ratio ?? null,
          maxDrawdownR: riskMetrics.max_drawdown_r ?? null,
          totalR: originalPerformance.total_r ?? null,
        };

        let snapshotId = existingSnapshot?.id || null;
        if (existingSnapshot) {
          await prisma.analysisSnapshot.update({
            where: { id: existingSnapshot.id },
            data: snapshotData,
          });
        } else {
          const createdSnapshot = await prisma.analysisSnapshot.create({ data: snapshotData });
          snapshotId = createdSnapshot.id;
        }

        if (jobContext?.userId && Array.isArray(jobContext.tradeIdentities) && jobContext.tradeIdentities.length > 0) {
          await prisma.storedTrade.updateMany({
            where: {
              userId: jobContext.userId,
              tradeIdentity: { in: jobContext.tradeIdentities },
            },
            data: {
              lastAnalysedAt: new Date(),
              analysisCount: { increment: 1 },
            },
          });
        }

        if (jobContext?.analysisRunId) {
          await prisma.analysisRun.update({
            where: { id: jobContext.analysisRunId },
            data: {
              status: "COMPLETED",
              analysisSnapshotId: snapshotId,
              tradesAnalysed: data.trades_analysed ?? jobContext?.uniqueTradeCount ?? null,
              completedAt: new Date(),
              error: null,
            },
          });

          await reportMlRunUsageToStripe(jobContext.analysisRunId);
        }
      } else if (data.status === "error") {
        if (jobContext?.analysisRunId) {
          await prisma.analysisRun.update({
            where: { id: jobContext.analysisRunId },
            data: {
              status: "FAILED",
              error: data.error || "Analysis failed",
              completedAt: new Date(),
            },
          });
        }
      }

      return res.json({
        ok: true,
        status: data.status,
        error: data.error || null,
        tradesAnalysed: data.trades_analysed,
        simulationsRun: data.simulations_run,
        regimesFound: data.regimes_found,
        avgRMultiple: data.avg_r_multiple,
        cost: analysisRunSummary?.cost ?? null,
        report: data.report || null,
      });
    } catch (err) {
      return next(err);
    }
  });
}

module.exports = {
  registerAnalyticsRoutes,
};
