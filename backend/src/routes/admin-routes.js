function registerAdminRoutes(app, {
  prisma,
  bcrypt,
  crypto,
  Stripe,
  sendEmail,
  env,
  authRequired,
  adminRequired,
  staffWriteRequired,
  superAdminRequired,
  staffPortalRoles,
  applicationStatuses,
  internalCompanyEmails,
  buildAdminStaffMember,
  getNonDeletedUserWhere,
  getTraderAnalysisStatus,
  wipeTraderSideDataForUser,
  getUserDisplayName,
  isBillingExemptUser,
  buildStripeAccountDiscountConfig,
  getBillingEventRevenueBreakdown,
  getStripeInvoiceRevenueBreakdown,
  getInternalCompanyEmailGroup,
}) {
  const signupReviewStatuses = new Set(["ACTIVE", "SUSPECT", "INVALID"]);

  function normalizeSignupEmail(email) {
    return typeof email === "string" ? email.trim().toLowerCase() : "";
  }

  function buildGroupedSignupItems(items, reviewsByEmail) {
    return Array.from(
      items.reduce((map, item) => {
        const emailKey = normalizeSignupEmail(item.email);
        const existing = map.get(emailKey);
        const normalizedDetail = item.detail?.trim() || "";
        const normalizedStatus = item.status.trim();
        const normalizedName = item.name?.trim() || null;

        if (!existing) {
          const review = reviewsByEmail.get(emailKey) || null;
          map.set(emailKey, {
            id: item.id,
            email: emailKey,
            name: normalizedName,
            sourceTypes: [item.sourceType],
            statuses: [normalizedStatus],
            details: normalizedDetail ? [normalizedDetail] : [],
            submittedAt: item.submittedAt,
            entryCount: 1,
            reviewStatus: review?.status || "ACTIVE",
            doNotContact: Boolean(review?.doNotContact),
            reviewReason: review?.reason || null,
            reviewNotes: review?.notes || null,
            reviewedAt: review?.reviewedAt?.toISOString?.() || null,
          });
          return map;
        }

        existing.entryCount += 1;
        if (normalizedName && !existing.name) {
          existing.name = normalizedName;
        }
        if (!existing.sourceTypes.includes(item.sourceType)) {
          existing.sourceTypes.push(item.sourceType);
        }
        if (!existing.statuses.includes(normalizedStatus)) {
          existing.statuses.push(normalizedStatus);
        }
        if (normalizedDetail && !existing.details.includes(normalizedDetail)) {
          existing.details.push(normalizedDetail);
        }
        if (new Date(item.submittedAt).getTime() > new Date(existing.submittedAt).getTime()) {
          existing.submittedAt = item.submittedAt;
          existing.id = item.id;
        }

        return map;
      }, new Map()).values()
    ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  function buildTestTraderStaffMember(user) {
    const firstName = user.profile?.firstName?.trim() || "";
    const lastName = user.profile?.lastName?.trim() || "";
    const profileName = `${firstName} ${lastName}`.trim();

    return {
      id: user.id,
      name: profileName || user.email.split("@")[0],
      email: user.email,
      role: "test_trader",
      status: user.status,
      joinDate: user.createdAt.toISOString(),
      lastActive: user.updatedAt?.toISOString?.() || null,
      source: "test_trader",
      billingExemptReason: user.billingExemptReason || null,
    };
  }

  function isInternalTestTraderUser(user) {
    const reason = typeof user?.billingExemptReason === "string" ? user.billingExemptReason.toLowerCase() : "";
    return reason.includes("internal test user");
  }

  function resolveTraderPlan(user) {
    if (typeof user?.plan === "string" && user.plan.trim()) {
      return user.plan.trim().toLowerCase() === "free" ? "free" : "payg";
    }

    if (typeof user?.stripeSubscriptionId === "string" && user.stripeSubscriptionId.trim()) {
      return "payg";
    }

    return "free";
  }

  function calculateTradeRMultiple(trade) {
    const riskPerTrade =
      typeof trade.entryPrice === "number" && typeof trade.stopLoss === "number"
        ? Math.abs(trade.entryPrice - trade.stopLoss)
        : 0;

    if (!(riskPerTrade > 0) || typeof trade.exitPrice !== "number") {
      return 0;
    }

    return trade.side === "SHORT"
      ? (trade.entryPrice - trade.exitPrice) / riskPerTrade
      : (trade.exitPrice - trade.entryPrice) / riskPerTrade;
  }

  function normalizeSnapshotWinRate(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }

    return value <= 1 ? value * 100 : value;
  }

  function calculateFallbackTradeMetrics(trades) {
    if (!Array.isArray(trades) || trades.length === 0) {
      return {
        tradesAnalysed: 0,
        avgRMultiple: null,
        winRate: null,
        sharpeRatio: null,
        maxDrawdownR: null,
        totalR: null,
      };
    }

    const rValues = trades
      .map((trade) => calculateTradeRMultiple(trade))
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    if (!rValues.length) {
      return {
        tradesAnalysed: trades.length,
        avgRMultiple: null,
        winRate: null,
        sharpeRatio: null,
        maxDrawdownR: null,
        totalR: null,
      };
    }

    const tradesAnalysed = trades.length;
    const totalR = rValues.reduce((sum, value) => sum + value, 0);
    const avgRMultiple = totalR / tradesAnalysed;
    const winRate = (rValues.filter((value) => value > 0).length / tradesAnalysed) * 100;

    let runningTotal = 0;
    let peak = 0;
    let maxDrawdownR = 0;
    for (const value of rValues) {
      runningTotal += value;
      peak = Math.max(peak, runningTotal);
      maxDrawdownR = Math.min(maxDrawdownR, runningTotal - peak);
    }

    const mean = avgRMultiple;
    const variance = rValues.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / tradesAnalysed;
    const standardDeviation = Math.sqrt(variance);
    const sharpeRatio =
      standardDeviation > 0
        ? (mean / standardDeviation) * Math.sqrt(tradesAnalysed)
        : null;

    return {
      tradesAnalysed,
      avgRMultiple,
      winRate,
      sharpeRatio,
      maxDrawdownR,
      totalR,
    };
  }

  app.get("/api/admin/trader-applications", authRequired, adminRequired, async (req, res, next) => {
    try {
      const { status } = req.query;

      if (status && (typeof status !== "string" || !applicationStatuses.has(status))) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }

      const applications = await prisma.traderApplication.findMany({
        where: status ? { status } : undefined,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          country: true,
          platform: true,
          experienceLevel: true,
          status: true,
          submittedAt: true,
        },
      });

      return res.json({ ok: true, items: applications });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/trader-applications/:id/approve", authRequired, adminRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      const updated = await prisma.traderApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      return res.json({ ok: true, status: updated.status });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/trader-applications/:id/reject", authRequired, adminRequired, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      if (!reason || typeof reason !== "string") {
        return res.status(400).json({ ok: false, error: "Rejection reason is required" });
      }

      const updated = await prisma.traderApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          rejectionReason: reason.trim(),
        },
      });

      return res.json({ ok: true, status: updated.status });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/traders", authRequired, adminRequired, async (req, res, next) => {
    try {
      const [allUsers, applications] = await Promise.all([
        prisma.user.findMany({
          where: { role: "TRADER", ...getNonDeletedUserWhere() },
          orderBy: { createdAt: "desc" },
          include: {
            profile: true,
            analysisSnapshots: {
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
            brokerAccounts: {
              select: {
                id: true,
                isActive: true,
                eaEvents: {
                  select: {
                    type: true,
                    receivedAt: true,
                  },
                },
              },
            },
            _count: {
              select: {
                apiKeys: true,
                storedTrades: true,
                analysisRuns: true,
              },
            },
            storedTrades: {
              orderBy: {
                exitTime: "desc",
              },
              select: {
                side: true,
                entryPrice: true,
                exitPrice: true,
                stopLoss: true,
                updatedAt: true,
              },
            },
          },
        }),
        prisma.traderApplication.findMany({
          orderBy: { submittedAt: "desc" },
        }),
      ]);

      const users = allUsers.filter((user) => !isInternalTestTraderUser(user));

      const usersByEmail = new Map(
        users.map((user) => [user.email.trim().toLowerCase(), user])
      );
      const applicationsByEmail = new Map(
        applications.map((application) => [application.email.trim().toLowerCase(), application])
      );

      const emails = Array.from(
        new Set([...usersByEmail.keys(), ...applicationsByEmail.keys()])
      );

      const items = emails
        .map((email) => {
          const user = usersByEmail.get(email) || null;
          const application = applicationsByEmail.get(email) || null;
          const brokerAccounts = user?.brokerAccounts || [];
          const latestSnapshot = user?.analysisSnapshots?.[0] || null;
          const storedTrades = user?.storedTrades || [];
          const storedTradeCount = user?._count?.storedTrades || 0;
          const fallbackMetrics = calculateFallbackTradeMetrics(storedTrades);
          const eaEvents = brokerAccounts.flatMap((account) => account.eaEvents);
          const tradeEventCount = eaEvents.filter((event) => event.type === "TRADE_EVENT").length;
          const historyExportCount = eaEvents.filter((event) => event.type === "HISTORY_EXPORT").length;
          const lastEaSyncAt = eaEvents.reduce((latest, event) => {
            if (!latest || event.receivedAt > latest) {
              return event.receivedAt;
            }
            return latest;
          }, null);

          const firstName = user?.profile?.firstName?.trim() || "";
          const lastName = user?.profile?.lastName?.trim() || "";
          const profileName = `${firstName} ${lastName}`.trim();
          const applicationName = application?.fullName?.trim() || "";
          const latestBrokerAccount = brokerAccounts.find((account) => account.isActive) || brokerAccounts[0] || null;
          const derivedName = profileName || applicationName || email.split("@")[0];
          const latestStoredTradeAt = storedTrades[0]?.updatedAt || null;
          const resolvedPlan = resolveTraderPlan(user);

          return {
            id: user?.id || application?.id,
            name: derivedName,
            email,
            billingExempt: Boolean(user?.billingExempt),
            billingExemptReason: user?.billingExemptReason || null,
            platformComped: Boolean(user?.platformComped),
            platformCompedReason: user?.platformCompedReason || null,
            accountStatus: user ? user.status : "NO_ACCOUNT",
            applicationStatus: application ? application.status : "NONE",
            plan: resolvedPlan,
            joinedAt: (user?.createdAt || application?.submittedAt || new Date()).toISOString(),
            country: application?.country || null,
            platform: application?.platform || latestBrokerAccount?.platform || null,
            experienceLevel: application?.experienceLevel || null,
            brokerAccountsCount: brokerAccounts.length,
            activeBrokerAccountsCount: brokerAccounts.filter((account) => account.isActive).length,
            apiKeysCount: user?._count?.apiKeys || 0,
            analysisRunCount: user?._count?.analysisRuns || 0,
            tradeEventCount: storedTradeCount,
            historyExportCount,
            lastEaSyncAt: (lastEaSyncAt || latestStoredTradeAt) ? (lastEaSyncAt || latestStoredTradeAt).toISOString() : null,
            hasAccount: Boolean(user),
            hasApplication: Boolean(application),
            analysisStatus:
              resolvedPlan === "free"
                ? "NO_ACCESS"
                : getTraderAnalysisStatus({
                    latestSnapshot,
                    tradeEventCount: storedTradeCount,
                    historyExportCount,
                  }),
            latestAnalysisAt: latestSnapshot?.updatedAt
              ? latestSnapshot.updatedAt.toISOString()
              : latestStoredTradeAt
                ? latestStoredTradeAt.toISOString()
                : null,
            latestAnalysisReport: latestSnapshot ? latestSnapshot.report : null,
            metrics: {
              tradesAnalysed: latestSnapshot?.tradesAnalysed ?? fallbackMetrics.tradesAnalysed,
              avgRMultiple: latestSnapshot?.avgRMultiple ?? fallbackMetrics.avgRMultiple,
              winRate: normalizeSnapshotWinRate(latestSnapshot?.winRate) ?? fallbackMetrics.winRate,
              sharpeRatio: latestSnapshot?.sharpeRatio ?? fallbackMetrics.sharpeRatio,
              maxDrawdownR: latestSnapshot?.maxDrawdownR ?? fallbackMetrics.maxDrawdownR,
              totalR: latestSnapshot?.totalR ?? fallbackMetrics.totalR,
            },
          };
        })
        .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

      return res.json({ ok: true, items });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/staff", authRequired, adminRequired, async (req, res, next) => {
    try {
      const [adminUsers, testUsers] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: {
              in: Array.from(staffPortalRoles),
            },
          },
          orderBy: { createdAt: "desc" },
          include: {
            profile: true,
          },
        }),
        prisma.user.findMany({
          where: {
            billingExempt: true,
            ...getNonDeletedUserWhere(),
          },
          orderBy: { createdAt: "desc" },
          include: {
            profile: true,
          },
        }),
      ]);

      const items = [
        ...adminUsers.map(buildAdminStaffMember),
        ...testUsers
          .filter((user) => user.role === "TRADER" || isInternalTestTraderUser(user))
          .map(buildTestTraderStaffMember),
      ];

      const envEmail = (env.ADMIN_EMAIL || "greenturtlrtraders26@gmail.com").trim().toLowerCase();
      if (envEmail && !items.some((item) => item.email === envEmail)) {
        items.unshift({
          id: "env-admin",
          name: envEmail.split("@")[0],
          email: envEmail,
          role: "super_admin",
          status: "ACTIVE",
          joinDate: new Date(0).toISOString(),
          lastActive: null,
          source: "environment",
        });
      }

      return res.json({ ok: true, items });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/staff/:id/wipe-trader-side", authRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      if (id === "env-admin") {
        return res.status(400).json({ ok: false, error: "Env admin trader data cannot be managed here" });
      }

      const existing = await prisma.user.findUnique({
        where: { id },
        include: { profile: true },
      });

      if (!existing || existing.role !== "ADMIN") {
        return res.status(404).json({ ok: false, error: "Admin account not found" });
      }

      await wipeTraderSideDataForUser(existing.id);

      const updated = await prisma.user.findUnique({
        where: { id: existing.id },
        include: { profile: true },
      });

      return res.json({
        ok: true,
        staffMember: buildAdminStaffMember(updated),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/staff/:id/promote-super-admin", authRequired, superAdminRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      if (id === "env-admin") {
        return res.status(400).json({ ok: false, error: "Env admin is already super admin" });
      }

      const existing = await prisma.user.findUnique({
        where: { id },
        include: { profile: true },
      });

      if (!existing || existing.role !== "ADMIN") {
        return res.status(404).json({ ok: false, error: "Admin account not found" });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isSuperAdmin: true },
        include: { profile: true },
      });

      return res.json({
        ok: true,
        staffMember: buildAdminStaffMember(updated),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.delete("/api/admin/staff/:id", authRequired, superAdminRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      if (id === "env-admin") {
        return res.status(400).json({ ok: false, error: "Env admin access cannot be removed here" });
      }

      if (req.user?.id === id) {
        return res.status(400).json({ ok: false, error: "You cannot remove your own admin access" });
      }

      const existing = await prisma.user.findUnique({
        where: { id },
        include: { profile: true },
      });

      if (!existing || existing.role !== "ADMIN") {
        return res.status(404).json({ ok: false, error: "Admin account not found" });
      }

      if (existing.billingExempt) {
        const updated = await prisma.user.update({
          where: { id },
          data: {
            role: "TRADER",
            isSuperAdmin: false,
          },
          include: { profile: true },
        });

        return res.json({
          ok: true,
          mode: "demoted_to_trader",
          staffMember: buildTestTraderStaffMember(updated),
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.json({ ok: true, mode: "deleted" });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/test-traders/:id/access", authRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body || {};

      if (typeof enabled !== "boolean") {
        return res.status(400).json({ ok: false, error: "enabled must be a boolean" });
      }

      const existing = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          billingExempt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          email: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          billingExemptReason: true,
        },
      });

      if (!existing || existing.role !== "TRADER" || !existing.billingExempt) {
        return res.status(404).json({ ok: false, error: "Test trader not found" });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          status: enabled ? "ACTIVE" : "DISABLED",
        },
        include: {
          profile: true,
        },
      });

      return res.json({
        ok: true,
        staffMember: buildTestTraderStaffMember(updated),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.patch("/api/admin/traders/:id/status", authRequired, adminRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body || {};

      if (!["ACTIVE", "DISABLED"].includes(status)) {
        return res.status(400).json({ ok: false, error: "Status must be ACTIVE or DISABLED" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true },
      });

      if (!user || user.role !== "TRADER") {
        return res.status(404).json({ ok: false, error: "Trader not found" });
      }

      await prisma.user.update({
        where: { id },
        data: { status },
      });

      return res.json({ ok: true, status });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/traders/:id/sync-stripe", authRequired, adminRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      const stripeSecretKey = env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ ok: false, error: "Stripe not configured" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true, stripeCustomerId: true, stripeSubscriptionId: true },
      });

      if (!user || user.role !== "TRADER") {
        return res.status(404).json({ ok: false, error: "Trader not found" });
      }

      if (!user.stripeCustomerId) {
        return res.status(400).json({ ok: false, error: "No Stripe customer ID on this account — user has not started checkout" });
      }

      const stripe = Stripe(stripeSecretKey);
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 5,
      });

      const active = subscriptions.data.find((s) =>
        ["active", "trialing", "past_due"].includes(s.status)
      );

      if (!active) {
        return res.status(404).json({ ok: false, error: "No active subscription found in Stripe for this customer" });
      }

      await prisma.user.update({
        where: { id },
        data: { stripeSubscriptionId: active.id },
      });

      return res.json({ ok: true, stripeSubscriptionId: active.id, stripeStatus: active.status });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/traders/:id/platform-comp", authRequired, adminRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const enabled = req.body?.enabled !== false;
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          email: true,
          role: true,
          billingExempt: true,
          billingExemptReason: true,
          platformComped: true,
          platformCompedReason: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          appliedReferralCode: { select: { code: true } },
          accountDiscountPercent: true,
          mlRunDiscountPercent: true,
          referralDiscountExpiresAt: true,
        },
      });

      if (!user || user.role !== "TRADER") {
        return res.status(404).json({ ok: false, error: "Trader not found" });
      }

      if (isBillingExemptUser(user)) {
        return res.status(400).json({ ok: false, error: "Billing-exempt internal accounts already bypass platform billing" });
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          platformComped: enabled,
          platformCompedReason: enabled ? "Manual complimentary platform access" : null,
        },
        select: {
          id: true,
          platformComped: true,
          platformCompedReason: true,
          stripeSubscriptionId: true,
          appliedReferralCode: { select: { code: true } },
          accountDiscountPercent: true,
          mlRunDiscountPercent: true,
          referralDiscountExpiresAt: true,
          email: true,
        },
      });

      if (env.STRIPE_SECRET_KEY && updated.stripeSubscriptionId) {
        const stripe = Stripe(env.STRIPE_SECRET_KEY);
        const monthlyPriceId = env.STRIPE_PRICE_MONTHLY;
        if (!monthlyPriceId) {
          return res.status(500).json({ ok: false, error: "Stripe monthly price not configured" });
        }

        const { discountsPayload } = await buildStripeAccountDiscountConfig({
          stripe,
          user: updated,
          monthlyPriceId,
        });

        await stripe.subscriptions.update(updated.stripeSubscriptionId, {
          discounts: discountsPayload && discountsPayload.length > 0 ? discountsPayload : "",
        });
      }

      return res.json({
        ok: true,
        platformComped: updated.platformComped,
        platformCompedReason: updated.platformCompedReason,
        email: updated.email,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/traders/:id/reset-password", authRequired, adminRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true },
      });

      if (!user || user.role !== "TRADER") {
        return res.status(404).json({ ok: false, error: "Trader not found" });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: tokenHash, passwordResetExpiresAt: expiresAt },
      });

      const appUrl = env.APP_URL || "http://localhost:5173";
      const resetUrl = `${appUrl}?reset=${rawToken}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your Green Turtle Trades password",
        html: `
          <p>Hi,</p>
          <p>An administrator has requested a password reset for your account. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link expires in 24 hours.</p>
          <p>Green Turtle Trades</p>
        `,
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 24 hours.`,
      });

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  app.delete("/api/admin/test-traders/:id", authRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { id } = req.params;

      const existing = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
        },
      });

      if (!existing || existing.role !== "TRADER" || !existing.billingExempt) {
        return res.status(404).json({ ok: false, error: "Test trader not found" });
      }

      await prisma.user.delete({
        where: { id },
      });

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/churn-feedback", authRequired, adminRequired, async (req, res, next) => {
    try {
      const items = await prisma.churnFeedback.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      const normalizedReasons = new Map();
      for (const item of items) {
        const key = item.reason;
        const current = normalizedReasons.get(key) || 0;
        normalizedReasons.set(key, current + 1);
      }

      const reasonSummary = Array.from(normalizedReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      const payload = items.map((item) => {
        const firstName = item.user.profile?.firstName?.trim() || "";
        const lastName = item.user.profile?.lastName?.trim() || "";
        const profileName = `${firstName} ${lastName}`.trim();
        const fallbackEmail =
          typeof item.userEmailSnapshot === "string" && item.userEmailSnapshot.trim()
            ? item.userEmailSnapshot.trim()
            : item.user.email;
        const fallbackName =
          typeof item.userNameSnapshot === "string" && item.userNameSnapshot.trim()
            ? item.userNameSnapshot.trim()
            : profileName || fallbackEmail.split("@")[0];

        return {
          id: item.id,
          userId: item.userId,
          userName: fallbackName,
          email: fallbackEmail,
          plan: item.plan || "unknown",
          reason: item.reason,
          feedback: item.feedback,
          createdAt: item.createdAt.toISOString(),
        };
      });

      return res.json({
        ok: true,
        items: payload,
        summary: reasonSummary,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/account-deletion-audits", authRequired, adminRequired, async (req, res, next) => {
    try {
      const audits = await prisma.accountDeletionAudit.findMany({
        orderBy: { deletedAt: "desc" },
        take: 100,
        include: {
          user: {
            include: { profile: true },
          },
        },
      });

      const items = audits.map((audit) => {
        const firstName = audit.user?.profile?.firstName?.trim() || "";
        const lastName = audit.user?.profile?.lastName?.trim() || "";
        const profileName = `${firstName} ${lastName}`.trim();

        return {
          id: audit.id,
          userId: audit.userId,
          userName: profileName || audit.previousEmail.split("@")[0],
          previousEmail: audit.previousEmail,
          deletedEmail: audit.deletedEmail,
          deletedAt: audit.deletedAt.toISOString(),
          stripeCustomerId: audit.stripeCustomerId,
          stripeSubscriptionId: audit.stripeSubscriptionId,
          hadBillingHistory: audit.hadBillingHistory,
          hadBrokerAccounts: audit.hadBrokerAccounts,
          hadApiKeys: audit.hadApiKeys,
          metadata: audit.metadata,
        };
      });

      return res.json({ ok: true, items });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/staff/invite", authRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { email, temporaryCode, accessLevel } = req.body || {};

      if (!email || typeof email !== "string") {
        return res.status(400).json({ ok: false, error: "Email is required" });
      }

      if (!temporaryCode || typeof temporaryCode !== "string" || temporaryCode.trim().length < 8) {
        return res.status(400).json({ ok: false, error: "Temporary code must be at least 8 characters" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedAccessLevel = accessLevel === "super_admin" ? "super_admin" : "admin";

      if (normalizedAccessLevel === "super_admin" && !req.user?.isSuperAdmin) {
        return res.status(403).json({ ok: false, error: "Only super admins can invite super admins" });
      }

      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { profile: true },
      });

      if (existing && existing.role !== "ADMIN") {
        return res.status(409).json({ ok: false, error: "A non-admin user already exists with that email" });
      }

      const passwordHash = await bcrypt.hash(temporaryCode.trim(), 10);

      const adminUser = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              passwordHash,
              role: "ADMIN",
              isSuperAdmin: normalizedAccessLevel === "super_admin",
              status: "PENDING",
            },
            include: { profile: true },
          })
        : await prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash,
              role: "ADMIN",
              isSuperAdmin: normalizedAccessLevel === "super_admin",
              status: "PENDING",
            },
            include: { profile: true },
          });

      const appUrl = env.APP_URL || "http://localhost:5173";

      sendEmail({
        to: normalizedEmail,
        subject: "Green Turtle Trades admin invite",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
            <div style="padding: 24px 0 12px;">
              <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
              <p style="margin-top: 0;">You have been invited to the Green Turtle Trades admin portal.</p>
              <p>Use the email below and the one-time code to sign in. You will be asked to change it after login.</p>
              <div style="margin: 24px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${normalizedEmail}</p>
                <p style="margin: 0 0 8px;"><strong>Access level:</strong> ${normalizedAccessLevel === "super_admin" ? "Super Admin" : "Admin"}</p>
                <p style="margin: 0;"><strong>One-time code:</strong> ${temporaryCode.trim()}</p>
              </div>
              <p style="margin: 0 0 8px;"><strong>Admin portal:</strong> ${appUrl}/admin</p>
              <p style="margin-bottom: 0;">If you were not expecting this invite, please ignore this email.</p>
            </div>
          </div>
        `,
        text: [
          "You have been invited to the Green Turtle Trades admin portal.",
          "Use the details below to sign in, then change your password immediately.",
          "",
          `Email: ${normalizedEmail}`,
          `Access level: ${normalizedAccessLevel === "super_admin" ? "Super Admin" : "Admin"}`,
          `One-time code: ${temporaryCode.trim()}`,
          `Admin portal: ${appUrl}/admin`,
        ].join("\n"),
      }).catch((e) => console.error("Admin invite email failed:", e));

      return res.json({ ok: true, staffMember: buildAdminStaffMember(adminUser) });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/traders/create-test-user", authRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const { email, password, fullName, metaTraderUsername, brokerName } = req.body || {};

      if (!email || typeof email !== "string") {
        return res.status(400).json({ ok: false, error: "Email is required" });
      }

      if (!password || typeof password !== "string" || password.trim().length < 8) {
        return res.status(400).json({ ok: false, error: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const internalEmailGroup = getInternalCompanyEmailGroup(normalizedEmail);

      if (internalEmailGroup) {
        const existingInternalCompanyAccount = await prisma.user.findFirst({
          where: {
            billingExempt: true,
            email: {
              in: Array.from(internalCompanyEmails),
            },
          },
          select: { id: true, email: true },
        });

        if (existingInternalCompanyAccount) {
          return res.status(409).json({
            ok: false,
            error: `Internal company account already exists for ${existingInternalCompanyAccount.email}`,
          });
        }
      }

      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          profile: true,
          brokerAccounts: {
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      if (existing) {
        if (existing.role !== "ADMIN") {
          return res.status(409).json({ ok: false, error: "Email already exists" });
        }

        const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
        const [firstName, ...restName] = trimmedName ? trimmedName.split(/\s+/) : [];
        const lastName = restName.join(" ");
        const normalizedMetaTraderUsername =
          typeof metaTraderUsername === "string" && metaTraderUsername.trim()
            ? metaTraderUsername.trim()
            : null;
        const normalizedBrokerName =
          typeof brokerName === "string" && brokerName.trim()
            ? brokerName.trim()
            : null;

        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            billingExempt: true,
            billingExemptReason: "Internal test user enabled on admin account",
            passwordHash: await bcrypt.hash(password.trim(), 10),
            profile:
              trimmedName && !existing.profile
                ? {
                    create: {
                      firstName: firstName || null,
                      lastName: lastName || null,
                    },
                  }
                : trimmedName
                  ? {
                      update: {
                        firstName: firstName || null,
                        lastName: lastName || null,
                      },
                    }
                  : undefined,
            brokerAccounts:
              normalizedMetaTraderUsername && existing.brokerAccounts.length === 0
                ? {
                    create: {
                      platform: "MT5",
                      brokerName: normalizedBrokerName,
                      accountNumber: normalizedMetaTraderUsername,
                      label: "Primary MetaTrader",
                      isActive: true,
                    },
                  }
                : undefined,
          },
          include: { profile: true },
        });

        return res.json({
          ok: true,
          staffMember: buildTestTraderStaffMember(updated),
        });
      }

      const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
      const [firstName, ...restName] = trimmedName ? trimmedName.split(/\s+/) : [];
      const lastName = restName.join(" ");
      const normalizedMetaTraderUsername =
        typeof metaTraderUsername === "string" && metaTraderUsername.trim()
          ? metaTraderUsername.trim()
          : null;
      const normalizedBrokerName =
        typeof brokerName === "string" && brokerName.trim()
          ? brokerName.trim()
          : null;

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: await bcrypt.hash(password.trim(), 10),
          role: "TRADER",
          status: "ACTIVE",
          billingExempt: true,
          billingExemptReason: "Internal test user created from admin panel",
          profile: trimmedName
            ? {
                create: {
                  firstName: firstName || null,
                  lastName: lastName || null,
                },
              }
            : undefined,
          brokerAccounts: normalizedMetaTraderUsername
            ? {
                create: {
                  platform: "MT5",
                  brokerName: normalizedBrokerName,
                  accountNumber: normalizedMetaTraderUsername,
                  label: "Primary MetaTrader",
                  isActive: true,
                },
              }
            : undefined,
        },
        include: { profile: true },
      });

      return res.json({
        ok: true,
        staffMember: buildTestTraderStaffMember(user),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/signups", authRequired, adminRequired, async (req, res, next) => {
    try {
      const [waitlistEntries, traderApplications, allTraderUsers, signupReviews] = await Promise.all([
        prisma.waitlistEntry.findMany({
          orderBy: { createdAt: "desc" },
        }),
        prisma.traderApplication.findMany({
          orderBy: { submittedAt: "desc" },
        }),
        prisma.user.findMany({
          where: { role: "TRADER", ...getNonDeletedUserWhere() },
          orderBy: { createdAt: "desc" },
          include: { profile: true },
        }),
        prisma.signupReview.findMany({
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      const traderUsers = allTraderUsers.filter((user) => !isInternalTestTraderUser(user));

      const rawItems = [
        ...waitlistEntries.map((entry) => ({
          id: `waitlist-${entry.id}`,
          email: entry.email,
          sourceType: entry.source === "landing" ? "landing_waitlist" : "investor_waitlist",
          status: "SUBMITTED",
          submittedAt: entry.createdAt.toISOString(),
          name: null,
          detail: entry.source || "unknown",
        })),
        ...traderApplications.map((application) => ({
          id: `application-${application.id}`,
          email: application.email,
          sourceType: "trader_application",
          status: application.status,
          submittedAt: application.submittedAt.toISOString(),
          name: application.fullName,
          detail: `${application.country} · ${application.platform}`,
        })),
        ...traderUsers.map((user) => {
          const firstName = user.profile?.firstName?.trim() || "";
          const lastName = user.profile?.lastName?.trim() || "";
          const profileName = `${firstName} ${lastName}`.trim();
          return {
            id: `user-${user.id}`,
            email: user.email,
            sourceType: "trader_account",
            status: user.status,
            submittedAt: user.createdAt.toISOString(),
            name: profileName || null,
            detail: user.stripeSubscriptionId ? "Premium" : "PAYG",
          };
        }),
      ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      const reviewsByEmail = new Map(
        signupReviews.map((review) => [normalizeSignupEmail(review.email), review])
      );
      const items = buildGroupedSignupItems(rawItems, reviewsByEmail);
      const validItems = items.filter((item) => item.reviewStatus !== "INVALID");
      const contactableItems = validItems.filter((item) => !item.doNotContact);

      return res.json({
        ok: true,
        items,
        summary: {
          totalUniqueEmails: items.length,
          validUniqueEmails: validItems.length,
          contactableUniqueEmails: contactableItems.length,
          suspectUniqueEmails: items.filter((item) => item.reviewStatus === "SUSPECT").length,
          invalidUniqueEmails: items.filter((item) => item.reviewStatus === "INVALID").length,
          landingSignupCount: validItems.filter((item) => item.sourceTypes.includes("landing_waitlist")).length,
          investorSignupCount: validItems.filter((item) => item.sourceTypes.includes("investor_waitlist")).length,
          traderApplicationSignupCount: validItems.filter((item) => item.sourceTypes.includes("trader_application")).length,
          traderAccountSignupCount: validItems.filter((item) => item.sourceTypes.includes("trader_account")).length,
        },
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/signups/review", authRequired, adminRequired, async (req, res, next) => {
    try {
      const normalizedEmail = normalizeSignupEmail(req.body?.email);
      const status = typeof req.body?.status === "string" ? req.body.status.trim().toUpperCase() : "";
      const doNotContact = req.body?.doNotContact === true;
      const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
      const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";

      if (!normalizedEmail) {
        return res.status(400).json({ ok: false, error: "Email is required." });
      }

      if (!signupReviewStatuses.has(status)) {
        return res.status(400).json({ ok: false, error: "A valid review status is required." });
      }

      const review = await prisma.signupReview.upsert({
        where: { email: normalizedEmail },
        update: {
          status,
          doNotContact,
          reason: reason || null,
          notes: notes || null,
          reviewedAt: new Date(),
          reviewedByUserId: req.user.id,
        },
        create: {
          email: normalizedEmail,
          status,
          doNotContact,
          reason: reason || null,
          notes: notes || null,
          reviewedAt: new Date(),
          reviewedByUserId: req.user.id,
        },
      });

      return res.json({
        ok: true,
        review: {
          email: review.email,
          status: review.status,
          doNotContact: review.doNotContact,
          reason: review.reason,
          notes: review.notes,
          reviewedAt: review.reviewedAt?.toISOString?.() || null,
        },
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/finance", authRequired, adminRequired, async (req, res, next) => {
    try {
      const allTraders = await prisma.user.findMany({
        where: {
          role: "TRADER",
          status: { in: ["ACTIVE", "PENDING", "DISABLED"] },
          ...getNonDeletedUserWhere(),
        },
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          analysisRuns: {
            where: { status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            select: {
              cost: true,
              completedAt: true,
            },
          },
          billingEvents: {
            where: {
              eventType: "invoice.paid",
              status: "PAID",
            },
            orderBy: { occurredAt: "desc" },
            select: {
              category: true,
              amountPaid: true,
              occurredAt: true,
              periodStart: true,
              periodEnd: true,
              stripeInvoiceId: true,
              payload: true,
            },
          },
        },
      });
      const traders = allTraders.filter((user) => !isInternalTestTraderUser(user));

      const traderAccounts = traders.length;
      const stripeSecretKey = env.STRIPE_SECRET_KEY;
      const linkedCustomerIds = Array.from(
        new Set(
          traders
            .map((user) => user.stripeCustomerId)
            .filter((value) => typeof value === "string" && value.trim()),
        ),
      );
      const linkedSubscriptionIds = Array.from(
        new Set(
          traders
            .map((user) => user.stripeSubscriptionId)
            .filter((value) => typeof value === "string" && value.trim()),
        ),
      );

      let liveStripeCustomerIds = new Set(linkedCustomerIds);
      let liveActiveSubscriptionIds = new Set(linkedSubscriptionIds);
      let liveInvoiceRows = [];

      if (stripeSecretKey) {
        const stripe = Stripe(stripeSecretKey);
        const [liveCustomers, liveSubscriptions, invoiceLists] = await Promise.all([
          Promise.all(
            linkedCustomerIds.map(async (customerId) => {
              try {
                const customer = await stripe.customers.retrieve(customerId);
                if (customer && !customer.deleted) return customerId;
              } catch (error) {
                console.error("Unable to load Stripe customer for admin finance", customerId, error);
              }
              return null;
            }),
          ),
          Promise.all(
            linkedSubscriptionIds.map(async (subscriptionId) => {
              try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                if (subscription && subscription.status !== "canceled") return subscriptionId;
              } catch (error) {
                console.error("Unable to load Stripe subscription for admin finance", subscriptionId, error);
              }
              return null;
            }),
          ),
          Promise.all(
            linkedCustomerIds.map(async (customerId) => {
              try {
                const invoices = await stripe.invoices.list({
                  customer: customerId,
                  status: "paid",
                  limit: 100,
                  expand: ["data.lines.data.price"],
                });
                return invoices.data.map((invoice) => ({
                  customerId,
                  invoiceId: invoice.id,
                  occurredAt: new Date(
                    ((invoice.status_transitions && invoice.status_transitions.paid_at) || invoice.created) * 1000,
                  ),
                  breakdown: getStripeInvoiceRevenueBreakdown(invoice),
                }));
              } catch (error) {
                console.error("Unable to load Stripe invoices for admin finance", customerId, error);
                return [];
              }
            }),
          ),
        ]);

        liveStripeCustomerIds = new Set(liveCustomers.filter(Boolean));
        liveActiveSubscriptionIds = new Set(liveSubscriptions.filter(Boolean));
        liveInvoiceRows = invoiceLists.flat();
      }

      const freeAccounts = traders.filter(
        (user) => resolveTraderPlan(user) === "free",
      ).length;
      const paygAccounts = traders.filter(
        (user) => resolveTraderPlan(user) === "payg",
      ).length;
      const stripeCustomers = liveStripeCustomerIds.size;
      const activeSubscriptions = liveActiveSubscriptionIds.size;

      const allCompletedRuns = traders.flatMap((user) => user.analysisRuns);
      const completedAnalysisRuns = allCompletedRuns.length;
      const fallbackInvoiceRows = traders.flatMap((user) =>
        user.billingEvents.map((invoice) => ({
          customerId: user.stripeCustomerId || null,
          invoiceId: invoice.stripeInvoiceId || null,
          occurredAt: invoice.occurredAt,
          breakdown: getBillingEventRevenueBreakdown(invoice),
        })),
      );
      const invoiceRows = liveInvoiceRows.length > 0 ? liveInvoiceRows : fallbackInvoiceRows;
      const estimatedAnalysisRevenue = invoiceRows.reduce(
        (sum, entry) => sum + entry.breakdown.mlRevenue,
        0,
      );
      const paidSubscriptionInvoices = invoiceRows.length;
      const recognizedSubscriptionRevenue = invoiceRows.reduce(
        (sum, entry) => sum + entry.breakdown.subscriptionRevenue,
        0,
      );
      const totalRecognizedRevenue = recognizedSubscriptionRevenue + estimatedAnalysisRevenue;
      const averageRevenuePerRun =
        completedAnalysisRuns > 0 ? estimatedAnalysisRevenue / completedAnalysisRuns : 0;

      const now = new Date();
      const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        const monthRuns = allCompletedRuns.filter((run) => {
          if (!run.completedAt) return false;
          return run.completedAt >= monthDate && run.completedAt < nextMonth;
        });
        const monthInvoiceBreakdowns = invoiceRows.filter((entry) => {
          return entry.occurredAt >= monthDate && entry.occurredAt < nextMonth;
        });
        const analysisRevenue = monthInvoiceBreakdowns.reduce(
          (sum, entry) => sum + entry.breakdown.mlRevenue,
          0,
        );
        const subscriptionRevenue = monthInvoiceBreakdowns.reduce(
          (sum, entry) => sum + entry.breakdown.subscriptionRevenue,
          0,
        );

        return {
          month: monthDate.toLocaleDateString(undefined, { month: "short" }),
          analysisRevenue: Number(analysisRevenue.toFixed(2)),
          subscriptionRevenue: Number(subscriptionRevenue.toFixed(2)),
          revenue: Number((analysisRevenue + subscriptionRevenue).toFixed(2)),
          runs: monthRuns.length,
          invoices: monthInvoiceBreakdowns.length,
        };
      });

      const planMix = [
        { name: "Free", value: freeAccounts },
        { name: "PAYG", value: paygAccounts },
      ];

      const accounts = traders
        .map((user) => {
          const firstName = user.profile?.firstName?.trim() || "";
          const lastName = user.profile?.lastName?.trim() || "";
          const profileName = `${firstName} ${lastName}`.trim();
          const userInvoiceBreakdowns = invoiceRows.filter(
            (entry) => entry.customerId && entry.customerId === user.stripeCustomerId,
          );
          const estimatedRevenue = userInvoiceBreakdowns.reduce(
            (sum, entry) => sum + entry.breakdown.mlRevenue,
            0,
          );
          const subscriptionRevenue = userInvoiceBreakdowns.reduce(
            (sum, entry) => sum + entry.breakdown.subscriptionRevenue,
            0,
          );
          return {
            userId: user.id,
            email: user.email,
            name: profileName || user.email.split("@")[0],
            plan: resolveTraderPlan(user),
            stripeCustomerLinked: Boolean(user.stripeCustomerId && liveStripeCustomerIds.has(user.stripeCustomerId)),
            stripeSubscriptionLinked: Boolean(
              user.stripeSubscriptionId && liveActiveSubscriptionIds.has(user.stripeSubscriptionId),
            ),
            completedRuns: user.analysisRuns.length,
            estimatedRevenue: Number(estimatedRevenue.toFixed(2)),
            subscriptionRevenue: Number(subscriptionRevenue.toFixed(2)),
            totalRevenue: Number((estimatedRevenue + subscriptionRevenue).toFixed(2)),
            paidSubscriptionInvoices: userInvoiceBreakdowns.length,
            latestPaymentAt: userInvoiceBreakdowns[0]?.occurredAt ? userInvoiceBreakdowns[0].occurredAt.toISOString() : null,
            latestRunAt: user.analysisRuns[0]?.completedAt ? user.analysisRuns[0].completedAt.toISOString() : null,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      return res.json({
        ok: true,
        finance: {
          summary: {
            traderAccounts,
            freeAccounts,
            paygAccounts,
            stripeCustomers,
            activeSubscriptions,
            paidSubscriptionInvoices,
            recognizedSubscriptionRevenue: Number(recognizedSubscriptionRevenue.toFixed(2)),
            completedAnalysisRuns,
            estimatedAnalysisRevenue: Number(estimatedAnalysisRevenue.toFixed(2)),
            totalRecognizedRevenue: Number(totalRecognizedRevenue.toFixed(2)),
            averageRevenuePerRun: Number(averageRevenuePerRun.toFixed(2)),
          },
          monthlyRevenue,
          planMix,
          accounts,
        },
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/metrics", authRequired, adminRequired, async (req, res, next) => {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [waitlistCount, contactCount, createdTodayWaitlistCount] =
        await Promise.all([
          prisma.waitlistEntry.count(),
          prisma.contactMessage.count(),
          prisma.waitlistEntry.count({
            where: {
              createdAt: {
                gte: startOfToday,
              },
            },
          }),
        ]);

      return res.json({
        waitlistCount,
        contactCount,
        createdTodayWaitlistCount,
      });
    } catch (err) {
      return next(err);
    }
  });
}

module.exports = {
  registerAdminRoutes,
};
