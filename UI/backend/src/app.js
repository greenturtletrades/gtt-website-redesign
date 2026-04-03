const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const { prisma } = require("./prisma");
const { sendEmail } = require("./email");

const app = express();

const brokerPlatforms = new Set(["MT4", "MT5", "CTRADER"]);
const experienceLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const applicationStatuses = new Set(["PENDING", "APPROVED", "REJECTED"]);
const staffPortalRoles = new Set(["ADMIN"]);
const staffWriteRoles = new Set(["ADMIN"]);
const rateLimitStore = new Map();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing in .env");
  }
  return secret;
}

function signToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), { expiresIn });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
}

function adminRequired(req, res, next) {
  if (!req.user || !staffPortalRoles.has(req.user.role)) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }
  return next();
}

function staffWriteRequired(req, res, next) {
  if (!req.user || !staffWriteRoles.has(req.user.role)) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }
  return next();
}

function getHeaderValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

function getClientIp(req) {
  const forwarded = getHeaderValue(req.headers["x-forwarded-for"]);
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function rateLimit({ windowMs, max, keyPrefix, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const entry = rateLimitStore.get(key);

    if (!entry || entry.expiresAt <= now) {
      rateLimitStore.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ ok: false, error: message });
    }

    entry.count += 1;
    rateLimitStore.set(key, entry);
    return next();
  };
}

function buildAdminStaffMember(user) {
  const firstName = user.profile?.firstName?.trim() || "";
  const lastName = user.profile?.lastName?.trim() || "";
  const profileName = `${firstName} ${lastName}`.trim();
  const derivedName = profileName || user.email.split("@")[0];

  return {
    id: user.id,
    name: derivedName,
    email: user.email,
    role: "admin",
    status: user.status,
    joinDate: user.createdAt.toISOString(),
    lastActive: user.updatedAt ? user.updatedAt.toISOString() : null,
    source: "database",
  };
}

function getTraderAnalysisStatus({ latestSnapshot, tradeEventCount, historyExportCount }) {
  if (latestSnapshot) {
    return "ANALYSIS_READY";
  }
  if (tradeEventCount > 0 || historyExportCount > 0) {
    return "NEEDS_ANALYSIS";
  }
  return "NO_TRADE_DATA";
}

function getPublicApiBaseUrl(req) {
  const configured =
    process.env.PUBLIC_API_BASE_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.BACKEND_PUBLIC_URL;

  if (configured && typeof configured === "string") {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_API_BASE_URL must be configured in production");
  }

  const proto = req.protocol || "http";
  const host = req.get("host") || `localhost:${process.env.PORT || 3001}`;

  return `${proto}://${host}`.replace(/\/+$/, "");
}

async function getOrCreateEaBrokerAccount(userId, platform) {
  let brokerAccount = await prisma.brokerAccount.findFirst({
    where: { userId, isActive: true, platform },
    orderBy: { createdAt: "desc" },
  });

  if (!brokerAccount) {
    brokerAccount = await prisma.brokerAccount.findFirst({
      where: { userId, isActive: true, platform: { in: ["MT4", "MT5"] } },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!brokerAccount) {
    brokerAccount = await prisma.brokerAccount.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!brokerAccount) {
    brokerAccount = await prisma.brokerAccount.create({
      data: {
        userId,
        platform,
        accountNumber: "PENDING",
        label: "Primary MetaTrader",
        isActive: true,
      },
    });
  }

  return brokerAccount;
}

async function issueManagedEaApiKey(userId) {
  await prisma.apiKey.updateMany({
    where: {
      userId,
      name: "MetaTrader EA",
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const rawKey = `gt_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = await bcrypt.hash(rawKey, 10);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name: "MetaTrader EA",
      keyHash,
      last4: rawKey.slice(-4),
    },
  });

  return { apiKey, rawKey };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toIsoOrNull(dateLike) {
  if (!dateLike) return null;
  const value = new Date(dateLike);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function buildEaConnectionStatus(events) {
  const latestHeartbeat = events.find((event) => event.type === "HEARTBEAT") || null;
  const latestHistoryExport = events.find((event) => event.type === "HISTORY_EXPORT") || null;
  const latestSeenEvent = latestHeartbeat || latestHistoryExport || null;
  const onlineWindowMinutes = 15;
  const latestSeenAt = latestSeenEvent?.receivedAt || null;
  const latestSeenTs = latestSeenAt ? new Date(latestSeenAt).getTime() : 0;
  const eaConnected =
    latestSeenTs > 0 && Date.now() - latestSeenTs <= onlineWindowMinutes * 60 * 1000;

  return {
    eaConnected,
    eaLastSeenAt: toIsoOrNull(latestSeenAt),
    eaLastHeartbeatAt: toIsoOrNull(latestHeartbeat?.receivedAt || null),
    eaLastExportAt: toIsoOrNull(latestHistoryExport?.receivedAt || null),
    onlineWindowMinutes,
  };
}

function parseTradeTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) {
    return 0;
  }
  const trimmed = value.trim();
  const normalizedDate = trimmed.replace(
    /^(\d{4})\.(\d{2})\.(\d{2})/,
    "$1-$2-$3"
  );
  const normalized = normalizedDate.includes("T")
    ? normalizedDate
    : normalizedDate.replace(" ", "T");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTradeTimestampText(value) {
  const timestamp = parseTradeTimestamp(value);
  if (!timestamp) {
    return typeof value === "string" ? value.trim() : "";
  }
  return new Date(timestamp).toISOString();
}

function sortTradesByRecency(trades) {
  return trades.slice().sort((a, b) => {
    const exitDiff = parseTradeTimestamp(b?.exit_time) - parseTradeTimestamp(a?.exit_time);
    if (exitDiff !== 0) return exitDiff;
    return parseTradeTimestamp(b?.entry_time) - parseTradeTimestamp(a?.entry_time);
  });
}

function buildTradeIdentity(trade, brokerAccountId = "account") {
  if (!trade || typeof trade !== "object") {
    return null;
  }

  const explicitId =
    typeof trade.trade_id === "string" && trade.trade_id.trim()
      ? trade.trade_id.trim()
      : typeof trade.ticket === "string" && trade.ticket.trim()
        ? trade.ticket.trim()
        : null;

  if (explicitId) {
    return [brokerAccountId, explicitId].join("|");
  }

  const parts = [
    brokerAccountId,
    trade.symbol || "",
    trade.side || "",
    normalizeTradeTimestampText(trade.entry_time),
    normalizeTradeTimestampText(trade.exit_time),
    trade.entry_price ?? "",
    trade.exit_price ?? "",
    trade.volume ?? "",
  ];

  return parts.join("|");
}

function dedupeTrades(tradeRows) {
  const latestByIdentity = new Map();

  for (const row of tradeRows) {
    const identity = buildTradeIdentity(row.trade, row.brokerAccountId);
    if (!identity) continue;

    const existing = latestByIdentity.get(identity);
    if (!existing || row.receivedAt > existing.receivedAt) {
      latestByIdentity.set(identity, { ...row, identity });
    }
  }

  const deduped = Array.from(latestByIdentity.values());
  deduped.sort((a, b) => {
    const exitDiff = parseTradeTimestamp(b.trade?.exit_time) - parseTradeTimestamp(a.trade?.exit_time);
    if (exitDiff !== 0) return exitDiff;
    return b.receivedAt.getTime() - a.receivedAt.getTime();
  });

  return deduped;
}

function buildTradeFingerprint(trades, brokerAccountId = "account") {
  const identities = sortTradesByRecency(trades)
    .map((trade) => buildTradeIdentity(trade, brokerAccountId))
    .filter(Boolean);

  return crypto.createHash("sha1").update(JSON.stringify(identities)).digest("hex");
}

function extractTradesFromEvents(events) {
  const tradeRows = [];

  for (const event of events) {
    const payload = event?.payload;
    const trades = Array.isArray(payload) ? payload : Array.isArray(payload?.trades) ? payload.trades : [];

    for (const trade of trades) {
      if (!trade || typeof trade !== "object") continue;
      tradeRows.push({
        brokerAccountId: event.brokerAccountId,
        receivedAt: new Date(event.receivedAt),
        trade,
      });
    }
  }

  return tradeRows;
}

function buildSnapshotReport(report, metadataPatch) {
  const existingMetadata =
    report && typeof report === "object" && report.metadata && typeof report.metadata === "object"
      ? report.metadata
      : {};

  return {
    ...(report && typeof report === "object" ? report : {}),
    metadata: {
      ...existingMetadata,
      ...metadataPatch,
    },
  };
}

const analysisJobContext = new Map();

function normalizeStoredTradeValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeStoredTradeDate(value) {
  const timestamp = parseTradeTimestamp(value);
  if (!timestamp) return null;
  return new Date(timestamp);
}

function normalizeTradeForStorage(trade) {
  if (!trade || typeof trade !== "object") return null;

  const entryTime = normalizeStoredTradeDate(trade.entry_time);
  const exitTime = normalizeStoredTradeDate(trade.exit_time);
  const entryPrice = normalizeStoredTradeValue(trade.entry_price);
  const exitPrice = normalizeStoredTradeValue(trade.exit_price);
  const stopLoss = normalizeStoredTradeValue(trade.stop_loss);
  const takeProfit = normalizeStoredTradeValue(trade.take_profit);
  const side = typeof trade.side === "string" ? trade.side.toUpperCase() : "";

  if (
    !entryTime ||
    !exitTime ||
    entryPrice === null ||
    exitPrice === null ||
    stopLoss === null ||
    takeProfit === null ||
    !side
  ) {
    return null;
  }

  return {
    externalTradeId:
      typeof trade.trade_id === "string" && trade.trade_id.trim() ? trade.trade_id.trim() : null,
    symbol: typeof trade.symbol === "string" && trade.symbol.trim() ? trade.symbol.trim() : null,
    side,
    entryTime,
    exitTime,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    mfe: normalizeStoredTradeValue(trade.mfe),
    mae: normalizeStoredTradeValue(trade.mae),
    session: typeof trade.session === "string" && trade.session.trim() ? trade.session.trim() : null,
    spread: normalizeStoredTradeValue(trade.spread),
    volatility: normalizeStoredTradeValue(trade.volatility),
    volume: normalizeStoredTradeValue(trade.volume),
    profit: normalizeStoredTradeValue(trade.profit),
    commission: normalizeStoredTradeValue(trade.commission),
    swap: normalizeStoredTradeValue(trade.swap),
    rawTrade: trade,
  };
}

function storedTradeToAnalysisTrade(storedTrade) {
  return {
    trade_id: storedTrade.externalTradeId,
    entry_time: storedTrade.entryTime.toISOString(),
    exit_time: storedTrade.exitTime.toISOString(),
    side: storedTrade.side,
    entry_price: storedTrade.entryPrice,
    exit_price: storedTrade.exitPrice,
    stop_loss: storedTrade.stopLoss,
    take_profit: storedTrade.takeProfit,
    symbol: storedTrade.symbol,
    mfe: storedTrade.mfe,
    mae: storedTrade.mae,
    session: storedTrade.session,
    spread: storedTrade.spread,
    volatility: storedTrade.volatility,
    volume: storedTrade.volume,
    profit: storedTrade.profit,
    commission: storedTrade.commission,
    swap: storedTrade.swap,
  };
}

function storedTradeToJournalEntry(storedTrade) {
  const result =
    typeof storedTrade.profit === "number" ||
    typeof storedTrade.commission === "number" ||
    typeof storedTrade.swap === "number"
      ? (storedTrade.profit ?? 0) + (storedTrade.commission ?? 0) + (storedTrade.swap ?? 0)
      : null;
  const riskPerTrade =
    typeof storedTrade.entryPrice === "number" && typeof storedTrade.stopLoss === "number"
      ? Math.abs(storedTrade.entryPrice - storedTrade.stopLoss)
      : 0;
  const rMultiple =
    riskPerTrade > 0 && typeof storedTrade.exitPrice === "number"
      ? (storedTrade.side === "SHORT"
          ? (storedTrade.entryPrice - storedTrade.exitPrice) / riskPerTrade
          : (storedTrade.exitPrice - storedTrade.entryPrice) / riskPerTrade)
      : 0;
  const durationMinutes = Math.max(
    0,
    Math.round((storedTrade.exitTime.getTime() - storedTrade.entryTime.getTime()) / 60000)
  );
  const tolerance = 1e-9;
  const exitType =
    Math.abs(storedTrade.exitPrice - storedTrade.takeProfit) <= tolerance
      ? "TP"
      : Math.abs(storedTrade.exitPrice - storedTrade.stopLoss) <= tolerance
        ? "SL"
        : "Manual";

  return {
    id: storedTrade.tradeIdentity,
    date: storedTrade.exitTime.toISOString().slice(0, 10),
    pair: storedTrade.symbol || "Trade",
    direction: storedTrade.side === "SHORT" ? "short" : "long",
    entryPrice: storedTrade.entryPrice,
    exitPrice: storedTrade.exitPrice,
    stopLoss: storedTrade.stopLoss,
    takeProfit: storedTrade.takeProfit,
    entryTime: storedTrade.entryTime.toISOString(),
    exitTime: storedTrade.exitTime.toISOString(),
    duration: durationMinutes,
    exitType,
    result,
    rMultiple,
    notes: "",
    emotions: "",
    lessonsLearned: "",
    marketConditions: storedTrade.session || "",
  };
}

function formatAnalysisRun(run) {
  return {
    id: run.id,
    status: run.status,
    mode: run.mode,
    requestedTrades: run.requestedTrades,
    tradesAnalysed: run.tradesAnalysed,
    cost: run.cost,
    periodDescription: run.periodDescription,
    dateRangeStart: run.dateRangeStart ? run.dateRangeStart.toISOString() : null,
    dateRangeEnd: run.dateRangeEnd ? run.dateRangeEnd.toISOString() : null,
    error: run.error || null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
  };
}

async function estimateAnalysisCost(userId, tradesAnalysed) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (user?.stripeSubscriptionId) {
    return 0;
  }
  return Math.max(0, Number(tradesAnalysed) || 0) * 0.2;
}

async function getPreferredBrokerAccountId(userId) {
  const brokerAccount = await prisma.brokerAccount.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return brokerAccount?.id || null;
}

async function persistTradesToMemory(userId, trades, { brokerAccountId = null, source = "unknown", seenAt = new Date() } = {}) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return { stored: 0, updated: 0, invalid: 0 };
  }

  let stored = 0;
  let updated = 0;
  let invalid = 0;

  for (const trade of trades) {
    const normalizedTrade = normalizeTradeForStorage(trade);
    const tradeIdentity = buildTradeIdentity(trade, brokerAccountId || source);
    if (!normalizedTrade || !tradeIdentity) {
      invalid += 1;
      continue;
    }

    const existing = await prisma.storedTrade.findUnique({
      where: {
        userId_tradeIdentity: {
          userId,
          tradeIdentity,
        },
      },
      select: { id: true, lastSeenAt: true },
    });

    const effectiveSeenAt =
      existing?.lastSeenAt && existing.lastSeenAt > seenAt ? existing.lastSeenAt : seenAt;

    await prisma.storedTrade.upsert({
      where: {
        userId_tradeIdentity: {
          userId,
          tradeIdentity,
        },
      },
      create: {
        userId,
        brokerAccountId,
        source,
        tradeIdentity,
        ...normalizedTrade,
        firstSeenAt: effectiveSeenAt,
        lastSeenAt: effectiveSeenAt,
      },
      update: {
        brokerAccountId,
        source,
        ...normalizedTrade,
        lastSeenAt: effectiveSeenAt,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      stored += 1;
    }
  }

  return { stored, updated, invalid };
}

async function loadStoredTradesForAnalysis(
  userId,
  { mode = "trades", tradeCount = 500, months = 12, pendingOnly = false } = {}
) {
  const now = new Date();
  const where = { userId };

  if (mode === "months") {
    where.exitTime = {
      gte: new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000),
    };
  }

  const storedRows = await prisma.storedTrade.findMany({
    where,
    orderBy: [{ exitTime: "desc" }, { updatedAt: "desc" }],
  });

  const eligibleRows = pendingOnly
    ? storedRows.filter((trade) => !trade.lastAnalysedAt || trade.lastSeenAt > trade.lastAnalysedAt)
    : storedRows;
  const limitedRows =
    mode === "trades" ? eligibleRows.slice(0, Math.max(10, Number(tradeCount) || 500)) : eligibleRows;

  return limitedRows.map(storedTradeToAnalysisTrade);
}

async function getPendingStoredTradeCount(userId) {
  const rows = await prisma.storedTrade.findMany({
    where: { userId },
    select: {
      id: true,
      lastSeenAt: true,
      lastAnalysedAt: true,
    },
  });

  return rows.filter(
    (trade) => !trade.lastAnalysedAt || trade.lastSeenAt > trade.lastAnalysedAt
  ).length;
}

async function syncStoredTradesFromMt(userId, brokerAccountIds, { requestFresh = false, timeoutMs = 8000 } = {}) {
  if (!Array.isArray(brokerAccountIds) || brokerAccountIds.length === 0) {
    return [];
  }

  let events = [];

  if (requestFresh) {
    const exportRequestToken = crypto.randomUUID();
    const exportRequestedAt = new Date();

    await prisma.eaEvent.createMany({
      data: brokerAccountIds.map((brokerAccountId) => ({
        brokerAccountId,
        type: "EXPORT_REQUEST",
        payload: {
          requestToken: exportRequestToken,
          requestedByUserId: userId,
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
      timeoutMs
    );

    events =
      freshExportEvents.length > 0
        ? freshExportEvents
        : await getLatestHistoryExports(brokerAccountIds, {
            since: { requestToken: exportRequestToken },
          });
  }

  if (events.length === 0) {
    events = await getLatestHistoryExports(brokerAccountIds);
  }

  for (const event of events) {
    const payload = event?.payload;
    const trades = Array.isArray(payload) ? payload : Array.isArray(payload?.trades) ? payload.trades : [];
    if (!Array.isArray(trades) || trades.length === 0) continue;
    await persistTradesToMemory(userId, trades, {
      brokerAccountId: event.brokerAccountId,
      source: "ea_history_export",
      seenAt: new Date(event.receivedAt),
    });
  }

  return events;
}

async function buildAnalysisOptionsPayload(userId, { requestFresh = false } = {}) {
  const brokerAccounts = await prisma.brokerAccount.findMany({
    where: { userId, isActive: true },
    select: { id: true },
  });

  const brokerAccountIds = brokerAccounts.map((account) => account.id);
  await syncStoredTradesFromMt(userId, brokerAccountIds, { requestFresh, timeoutMs: 8000 });

  const pendingStoredTradeCount = await getPendingStoredTradeCount(userId);
  const latestSnapshot = await prisma.analysisSnapshot.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      tradesAnalysed: true,
      report: true,
    },
  });

  const latestMetadata =
    latestSnapshot?.report &&
    typeof latestSnapshot.report === "object" &&
    latestSnapshot.report.metadata &&
    typeof latestSnapshot.report.metadata === "object"
      ? latestSnapshot.report.metadata
      : null;

  return {
    availableTradeCount: pendingStoredTradeCount,
    minimumTradeCount: 10,
    recommendedTradeCount: Math.min(200, pendingStoredTradeCount || 200),
    latestAnalysis: latestSnapshot
      ? {
          id: latestSnapshot.id,
          updatedAt: latestSnapshot.updatedAt.toISOString(),
          tradesAnalysed: latestSnapshot.tradesAnalysed ?? latestMetadata?.unique_trade_count ?? null,
          tradeFingerprint: latestMetadata?.trade_fingerprint ?? null,
        }
      : null,
  };
}

async function buildAccountStatePayload(userId) {
  const [analysisOptions, latestSnapshot, runs, storedTrades] = await Promise.all([
    buildAnalysisOptionsPayload(userId),
    prisma.analysisSnapshot.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
        tradesAnalysed: true,
        avgRMultiple: true,
        report: true,
      },
    }),
    prisma.analysisRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.storedTrade.findMany({
      where: { userId },
      orderBy: [{ exitTime: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  const hasCurrencyPnl = storedTrades.some(
    (trade) =>
      typeof trade.profit === "number" ||
      typeof trade.commission === "number" ||
      typeof trade.swap === "number"
  );

  return {
    analysisOptions,
    latestAnalysis: latestSnapshot
      ? {
          id: latestSnapshot.id,
          updatedAt: latestSnapshot.updatedAt.toISOString(),
          tradesAnalysed: latestSnapshot.tradesAnalysed,
          avgRMultiple: latestSnapshot.avgRMultiple,
          report: latestSnapshot.report,
        }
      : null,
    history: runs.map(formatAnalysisRun),
    trades: storedTrades.map(storedTradeToJournalEntry),
    pnlMeta: {
      currency_pnl_available: hasCurrencyPnl,
      message: hasCurrencyPnl
        ? null
        : "These stored trades do not include realised profit/loss fields yet, so the journal is shown in R-multiples until richer trade data is synced.",
    },
  };
}

async function createFailedAnalysisRun(userId, {
  mode = "trades",
  requestedTrades = null,
  tradesAnalysed = 0,
  cost = 0,
  periodDescription = "Analysis run",
  dateRangeStart = null,
  dateRangeEnd = null,
  error = "Analysis could not be started",
} = {}) {
  return prisma.analysisRun.create({
    data: {
      userId,
      status: "FAILED",
      mode,
      requestedTrades,
      tradesAnalysed,
      cost,
      periodDescription,
      dateRangeStart,
      dateRangeEnd,
      error,
      completedAt: new Date(),
    },
  });
}

function mergeTradesForAnalysis(...tradeGroups) {
  const latestByIdentity = new Map();

  for (const trades of tradeGroups) {
    if (!Array.isArray(trades)) continue;

    for (const trade of trades) {
      const identity = buildTradeIdentity(trade);
      if (!identity) continue;

      const existing = latestByIdentity.get(identity);
      const existingExit = existing ? parseTradeTimestamp(existing.exit_time) : 0;
      const nextExit = parseTradeTimestamp(trade.exit_time);

      if (!existing || nextExit >= existingExit) {
        latestByIdentity.set(identity, trade);
      }
    }
  }

  return sortTradesByRecency(Array.from(latestByIdentity.values()));
}

function deriveTradeDateRange(trades) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return { start: null, end: null };
  }

  const entryTimes = trades
    .map((trade) => normalizeStoredTradeDate(trade.entry_time))
    .filter(Boolean);
  const exitTimes = trades
    .map((trade) => normalizeStoredTradeDate(trade.exit_time))
    .filter(Boolean);

  if (entryTimes.length === 0 && exitTimes.length === 0) {
    return { start: null, end: null };
  }

  const start = entryTimes.length > 0 ? new Date(Math.min(...entryTimes.map((date) => date.getTime()))) : null;
  const end = exitTimes.length > 0 ? new Date(Math.max(...exitTimes.map((date) => date.getTime()))) : null;
  return { start, end };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function parseCsvTradesFromPython(req) {
  const pythonUrl = new URL(`${PYTHON_SERVICE_URL}/parse/csv`);
  const contentType = req.headers["content-type"];

  if (!contentType) {
    throw new Error("CSV upload is missing a content-type header");
  }

  const body = await readRequestBody(req);
  const pythonRes = await fetch(pythonUrl, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "content-length": String(body.length),
    },
    body,
  });

  const text = await pythonRes.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error("Invalid response from analysis service");
  }

  if (!pythonRes.ok) {
    throw new Error(parsed?.detail || parsed?.error || "Analysis service error");
  }

  return Array.isArray(parsed?.trades) ? parsed.trades : [];
}

async function createHistoryExportRequests(brokerAccountIds) {
  const requestedAt = new Date();

  if (!Array.isArray(brokerAccountIds) || brokerAccountIds.length === 0) {
    return requestedAt;
  }

  await prisma.eaEvent.createMany({
    data: brokerAccountIds.map((brokerAccountId) => ({
      brokerAccountId,
      type: "EXPORT_REQUEST",
      payload: { requestedAt: requestedAt.toISOString() },
      receivedAt: requestedAt,
    })),
  });

  return requestedAt;
}

async function getLatestHistoryExports(brokerAccountIds, { since } = {}) {
  if (!Array.isArray(brokerAccountIds) || brokerAccountIds.length === 0) {
    return [];
  }

  const where = {
    brokerAccountId: { in: brokerAccountIds },
    type: "HISTORY_EXPORT",
  };

  if (typeof since?.requestToken === "string" && since.requestToken.trim()) {
    where.payload = {
      path: ["requestToken"],
      equals: since.requestToken.trim(),
    };
  }

  if (since instanceof Date) {
    where.receivedAt = { gte: since };
  } else if (since && since.receivedAt instanceof Date) {
    where.receivedAt = { gte: since.receivedAt };
  }

  const rows = await prisma.eaEvent.findMany({
    where,
    orderBy: [{ brokerAccountId: "asc" }, { receivedAt: "desc" }],
    take: Math.max(20, brokerAccountIds.length * 10),
  });

  const latestByAccount = new Map();
  for (const row of rows) {
    if (!latestByAccount.has(row.brokerAccountId)) {
      latestByAccount.set(row.brokerAccountId, row);
    }
  }

  return Array.from(latestByAccount.values());
}

async function waitForFreshHistoryExports(brokerAccountIds, requestedAt, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const freshEvents = await getLatestHistoryExports(brokerAccountIds, {
      since: {
        receivedAt: requestedAt.receivedAt,
        requestToken: requestedAt.requestToken,
      },
    });
    if (freshEvents.length === brokerAccountIds.length) {
      return freshEvents;
    }
    await sleep(1500);
  }

  return [];
}

function buildMt4EaSource({ apiBaseUrl, apiKey, brokerAccountId }) {
  return `//+------------------------------------------------------------------+
//|                          GreenTurtleTradesEA.mq4                 |
//+------------------------------------------------------------------+
#property strict

input string API_BASE_URL = "${apiBaseUrl}";
input string API_KEY = "${apiKey}";
input string BROKER_ACCOUNT_ID = "${brokerAccountId}";
input int EXPORT_POLL_SECONDS = 10;
input int HEARTBEAT_SECONDS = 60;
input int HISTORY_LOOKBACK_DAYS = 3650;
input int MAX_TRADES_PER_EXPORT = 5000;

datetime lastPollTime = 0;
datetime lastHeartbeatTime = 0;
string lastRequestToken = "";

int OnInit()
{
   if(StringLen(API_KEY) < 12 || StringLen(BROKER_ACCOUNT_ID) < 6)
   {
      Alert("Green Turtle Trades EA is missing account credentials.");
      return(INIT_FAILED);
   }

   if(!TestConnection())
   {
      Alert("Unable to reach the Green Turtle Trades API.");
      return(INIT_FAILED);
   }

   EventSetTimer(MathMax(5, EXPORT_POLL_SECONDS));
   Print("Green Turtle Trades EA connected. Historical exports will run when requested from Turtle Analytics.");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

bool TestConnection()
{
   string url = API_BASE_URL + "/health";
   string headers = "Content-Type: application/json\\r\\n";
   char post[];
   char result[];
   string responseHeaders;
   int status = WebRequest("GET", url, headers, 5000, post, result, responseHeaders);
   return(status == 200);
}

void SendHeartbeat()
{
   if(lastHeartbeatTime != 0 && TimeCurrent() - lastHeartbeatTime < MathMax(15, HEARTBEAT_SECONDS))
   {
      return;
   }

   string body = "{";
   body += "\\"source\\":\\"mt4_ea\\",";
   body += "\\"heartbeatAt\\":\\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\\"";
   body += "}";

   if(SendJson("/v1/ea/heartbeat", body))
   {
      lastHeartbeatTime = TimeCurrent();
   }
}

bool FetchPendingExportToken(string &requestToken)
{
   string url = API_BASE_URL + "/v1/ea/export-request";
   string headers = "Content-Type: application/json\\r\\n";
   headers += "x-api-key: " + API_KEY + "\\r\\n";
   headers += "x-broker-account-id: " + BROKER_ACCOUNT_ID + "\\r\\n";

   char post[];
   char result[];
   string responseHeaders;
   int status = WebRequest("GET", url, headers, 5000, post, result, responseHeaders);
   if(status != 200)
   {
      return(false);
   }

   string body = CharArrayToString(result, 0, -1);
   if(StringFind(body, "\\"pending\\":true") == -1)
   {
      return(false);
   }

   int tokenKey = StringFind(body, "\\"requestToken\\":\\"");
   if(tokenKey == -1)
   {
      return(false);
   }

   int start = tokenKey + StringLen("\\"requestToken\\":\\"");
   int end = StringFind(body, "\\"", start);
   if(end == -1)
   {
      return(false);
   }

   requestToken = StringSubstr(body, start, end - start);
   return(StringLen(requestToken) > 0);
}

bool ComputeTradeExcursions(string symbol, datetime entryTime, datetime exitTime, bool isLong, double entryPrice, double &mfe, double &mae)
{
   mfe = 0.0;
   mae = 0.0;

   int entryShift = iBarShift(symbol, PERIOD_M1, entryTime, false);
   int exitShift = iBarShift(symbol, PERIOD_M1, exitTime, false);
   if(entryShift < 0 || exitShift < 0)
   {
      return(false);
   }

   int firstShift = MathMin(entryShift, exitShift);
   int lastShift = MathMax(entryShift, exitShift);
   double maxHigh = entryPrice;
   double minLow = entryPrice;

   for(int shift = firstShift; shift <= lastShift; shift++)
   {
      double barHigh = iHigh(symbol, PERIOD_M1, shift);
      double barLow = iLow(symbol, PERIOD_M1, shift);
      if(barHigh > maxHigh) maxHigh = barHigh;
      if(barLow < minLow) minLow = barLow;
   }

   if(isLong)
   {
      mfe = MathMax(0.0, maxHigh - entryPrice);
      mae = MathMax(0.0, entryPrice - minLow);
   }
   else
   {
      mfe = MathMax(0.0, entryPrice - minLow);
      mae = MathMax(0.0, maxHigh - entryPrice);
   }

   return(true);
}

void ExportClosedTrades(string requestToken)
{
   int totalOrders = OrdersHistoryTotal();
   int exported = 0;
   string body = "{\\"trades\\":[";
   datetime minCloseTime = TimeCurrent() - (HISTORY_LOOKBACK_DAYS * 24 * 60 * 60);

   for(int i = totalOrders - 1; i >= 0 && exported < MAX_TRADES_PER_EXPORT; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderType() != OP_BUY && OrderType() != OP_SELL) continue;
      if(OrderCloseTime() <= 0) continue;
      if(HISTORY_LOOKBACK_DAYS > 0 && OrderCloseTime() < minCloseTime) continue;

      if(exported > 0) body += ",";

      int digits = (int)MarketInfo(OrderSymbol(), MODE_DIGITS);
      bool isLong = OrderType() == OP_BUY;
      double mfe = 0.0;
      double mae = 0.0;
      ComputeTradeExcursions(OrderSymbol(), OrderOpenTime(), OrderCloseTime(), isLong, OrderOpenPrice(), mfe, mae);
      body += "{";
      body += "\\"trade_id\\":\\"" + IntegerToString(OrderTicket()) + "\\",";
      body += "\\"entry_time\\":\\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\\",";
      body += "\\"exit_time\\":\\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\\",";
      body += "\\"side\\":\\"" + (isLong ? "LONG" : "SHORT") + "\\",";
      body += "\\"entry_price\\":" + DoubleToString(OrderOpenPrice(), digits) + ",";
      body += "\\"exit_price\\":" + DoubleToString(OrderClosePrice(), digits) + ",";
      body += "\\"stop_loss\\":" + DoubleToString(OrderStopLoss(), digits) + ",";
      body += "\\"take_profit\\":" + DoubleToString(OrderTakeProfit(), digits) + ",";
      body += "\\"mfe\\":" + DoubleToString(mfe, digits) + ",";
      body += "\\"mae\\":" + DoubleToString(mae, digits) + ",";
      body += "\\"symbol\\":\\"" + OrderSymbol() + "\\",";
      body += "\\"volume\\":" + DoubleToString(OrderLots(), 2) + ",";
      body += "\\"profit\\":" + DoubleToString(OrderProfit(), 2) + ",";
      body += "\\"commission\\":" + DoubleToString(OrderCommission(), 2) + ",";
      body += "\\"swap\\":" + DoubleToString(OrderSwap(), 2);
      body += "}";
      exported++;
   }

   body += "],";
   body += "\\"requestToken\\":\\"" + requestToken + "\\",";
   body += "\\"source\\":\\"mt4_ea_history\\"";
   body += "}";

   if(exported == 0) return;
   if(SendJson("/v1/ea/history/export", body))
   {
      Print("Green Turtle Trades EA exported ", exported, " historical trades.");
   }
}

bool SendJson(string path, string jsonBody)
{
   string url = API_BASE_URL + path;
   string headers = "Content-Type: application/json\\r\\n";
   headers += "x-api-key: " + API_KEY + "\\r\\n";
   headers += "x-broker-account-id: " + BROKER_ACCOUNT_ID + "\\r\\n";

   char post[];
   char result[];
   string responseHeaders;
   StringToCharArray(jsonBody, post, 0, StringLen(jsonBody));
   int status = WebRequest("POST", url, headers, 10000, post, result, responseHeaders);
   if(status != 200)
   {
      Print("Green Turtle Trades EA request failed: ", status);
      return(false);
   }
   return(true);
}

void CheckForRequestedExport()
{
   string requestToken = "";
   if(!FetchPendingExportToken(requestToken))
   {
      return;
   }

   if(StringLen(requestToken) == 0 || requestToken == lastRequestToken)
   {
      return;
   }

   lastRequestToken = requestToken;
   ExportClosedTrades(requestToken);
}

void OnTimer()
{
   SendHeartbeat();
   CheckForRequestedExport();
}

void OnTick()
{
   SendHeartbeat();
   if(TimeCurrent() - lastPollTime < MathMax(5, EXPORT_POLL_SECONDS))
   {
      return;
   }

   lastPollTime = TimeCurrent();
   CheckForRequestedExport();
}
//+------------------------------------------------------------------+`;
}

function buildMt5EaSource({ apiBaseUrl, apiKey, brokerAccountId }) {
  return `//+------------------------------------------------------------------+
//|                          GreenTurtleTradesEA.mq5                 |
//+------------------------------------------------------------------+
#property version   "1.00"

input string API_BASE_URL = "${apiBaseUrl}";
input string API_KEY = "${apiKey}";
input string BROKER_ACCOUNT_ID = "${brokerAccountId}";
input int EXPORT_POLL_SECONDS = 10;
input int HEARTBEAT_SECONDS = 60;
input int HISTORY_LOOKBACK_DAYS = 3650;
input int MAX_TRADES_PER_EXPORT = 5000;

datetime lastPollTime = 0;
datetime lastHeartbeatTime = 0;
string lastRequestToken = "";

int OnInit()
{
   if(StringLen(API_KEY) < 12 || StringLen(BROKER_ACCOUNT_ID) < 6)
   {
      Alert("Green Turtle Trades EA is missing account credentials.");
      return(INIT_FAILED);
   }

   if(!TestConnection())
   {
      Alert("Unable to reach the Green Turtle Trades API.");
      return(INIT_FAILED);
   }

   EventSetTimer(MathMax(5, EXPORT_POLL_SECONDS));
   Print("Green Turtle Trades EA connected. Historical exports will run when requested from Turtle Analytics.");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

bool TestConnection()
{
   string url = API_BASE_URL + "/health";
   string headers = "Content-Type: application/json\\r\\n";
   char post[];
   char result[];
   string responseHeaders;
   int status = WebRequest("GET", url, headers, 5000, post, result, responseHeaders);
   return(status == 200);
}

void SendHeartbeat()
{
   if(lastHeartbeatTime != 0 && TimeCurrent() - lastHeartbeatTime < MathMax(15, HEARTBEAT_SECONDS))
   {
      return;
   }

   string body = "{";
   body += "\\"source\\":\\"mt5_ea\\",";
   body += "\\"heartbeatAt\\":\\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\\"";
   body += "}";

   if(SendJson("/v1/ea/heartbeat", body))
   {
      lastHeartbeatTime = TimeCurrent();
   }
}

bool FetchPendingExportToken(string &requestToken)
{
   string url = API_BASE_URL + "/v1/ea/export-request";
   string headers = "Content-Type: application/json\\r\\n";
   headers += "x-api-key: " + API_KEY + "\\r\\n";
   headers += "x-broker-account-id: " + BROKER_ACCOUNT_ID + "\\r\\n";

   char post[];
   char result[];
   string responseHeaders;
   int status = WebRequest("GET", url, headers, 5000, post, result, responseHeaders);
   if(status != 200)
   {
      return(false);
   }

   string body = CharArrayToString(result, 0, -1);
   if(StringFind(body, "\\"pending\\":true") == -1)
   {
      return(false);
   }

   int tokenKey = StringFind(body, "\\"requestToken\\":\\"");
   if(tokenKey == -1)
   {
      return(false);
   }

   int start = tokenKey + StringLen("\\"requestToken\\":\\"");
   int end = StringFind(body, "\\"", start);
   if(end == -1)
   {
      return(false);
   }

   requestToken = StringSubstr(body, start, end - start);
   return(StringLen(requestToken) > 0);
}

ulong FindEntryDeal(ulong positionId, datetime exitTime)
{
   int totalDeals = HistoryDealsTotal();
   for(int i = totalDeals - 1; i >= 0; i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      if((ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != positionId) continue;

      ENUM_DEAL_ENTRY entryType = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      if((entryType == DEAL_ENTRY_IN || entryType == DEAL_ENTRY_INOUT) && dealTime <= exitTime)
      {
         return(ticket);
      }
   }
   return(0);
}

ulong FindLatestOrderForPosition(ulong positionId, datetime exitTime)
{
   int totalOrders = HistoryOrdersTotal();
   ulong latestTicket = 0;
   datetime latestTime = 0;

   for(int i = totalOrders - 1; i >= 0; i--)
   {
      ulong ticket = HistoryOrderGetTicket(i);
      if(ticket == 0) continue;
      if((ulong)HistoryOrderGetInteger(ticket, ORDER_POSITION_ID) != positionId) continue;

      datetime orderTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_DONE);
      if(orderTime == 0)
      {
         orderTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_SETUP);
      }
      if(orderTime > exitTime) continue;
      if(orderTime >= latestTime)
      {
         latestTime = orderTime;
         latestTicket = ticket;
      }
   }

   return(latestTicket);
}

bool ComputeTradeExcursions(string symbol, datetime entryTime, datetime exitTime, bool isLong, double entryPrice, double &mfe, double &mae)
{
   mfe = 0.0;
   mae = 0.0;

   MqlRates rates[];
   int copied = CopyRates(symbol, PERIOD_M1, entryTime, exitTime, rates);
   if(copied <= 0)
   {
      return(false);
   }

   double maxHigh = entryPrice;
   double minLow = entryPrice;
   for(int i = 0; i < copied; i++)
   {
      if(rates[i].high > maxHigh) maxHigh = rates[i].high;
      if(rates[i].low < minLow) minLow = rates[i].low;
   }

   if(isLong)
   {
      mfe = MathMax(0.0, maxHigh - entryPrice);
      mae = MathMax(0.0, entryPrice - minLow);
   }
   else
   {
      mfe = MathMax(0.0, entryPrice - minLow);
      mae = MathMax(0.0, maxHigh - entryPrice);
   }

   return(true);
}

void ExportClosedTrades(string requestToken)
{
   if(!HistorySelect(0, TimeCurrent())) return;

   int totalDeals = HistoryDealsTotal();
   int exported = 0;
   string body = "{\\"trades\\":[";
   datetime minCloseTime = TimeCurrent() - (HISTORY_LOOKBACK_DAYS * 24 * 60 * 60);

   for(int i = totalDeals - 1; i >= 0 && exported < MAX_TRADES_PER_EXPORT; i--)
   {
      ulong exitTicket = HistoryDealGetTicket(i);
      if(exitTicket == 0) continue;

      ENUM_DEAL_ENTRY exitEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(exitTicket, DEAL_ENTRY);
      ENUM_DEAL_TYPE exitType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(exitTicket, DEAL_TYPE);
      if(exitEntry != DEAL_ENTRY_OUT) continue;
      if(exitType != DEAL_TYPE_BUY && exitType != DEAL_TYPE_SELL) continue;

      datetime exitTime = (datetime)HistoryDealGetInteger(exitTicket, DEAL_TIME);
      if(exitTime <= 0) continue;
      if(HISTORY_LOOKBACK_DAYS > 0 && exitTime < minCloseTime) continue;

      ulong positionId = (ulong)HistoryDealGetInteger(exitTicket, DEAL_POSITION_ID);
      ulong entryTicket = FindEntryDeal(positionId, exitTime);
      if(entryTicket == 0) continue;

      ulong orderTicket = (ulong)HistoryDealGetInteger(entryTicket, DEAL_ORDER);
      ulong latestOrderTicket = FindLatestOrderForPosition(positionId, exitTime);
      ulong slTpOrderTicket = latestOrderTicket != 0 ? latestOrderTicket : orderTicket;
      HistoryOrderSelect(slTpOrderTicket);
      string symbol = HistoryDealGetString(exitTicket, DEAL_SYMBOL);
      int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
      bool isLong = HistoryDealGetInteger(entryTicket, DEAL_TYPE) == DEAL_TYPE_BUY;
      double mfe = 0.0;
      double mae = 0.0;
      ComputeTradeExcursions(symbol, (datetime)HistoryDealGetInteger(entryTicket, DEAL_TIME), exitTime, isLong, HistoryDealGetDouble(entryTicket, DEAL_PRICE), mfe, mae);

      if(exported > 0) body += ",";

      body += "{";
      body += "\\"trade_id\\":\\"" + IntegerToString((int)exitTicket) + "\\",";
      body += "\\"entry_time\\":\\"" + TimeToString((datetime)HistoryDealGetInteger(entryTicket, DEAL_TIME), TIME_DATE|TIME_SECONDS) + "\\",";
      body += "\\"exit_time\\":\\"" + TimeToString(exitTime, TIME_DATE|TIME_SECONDS) + "\\",";
      body += "\\"side\\":\\"" + (isLong ? "LONG" : "SHORT") + "\\",";
      body += "\\"entry_price\\":" + DoubleToString(HistoryDealGetDouble(entryTicket, DEAL_PRICE), digits) + ",";
      body += "\\"exit_price\\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_PRICE), digits) + ",";
      body += "\\"stop_loss\\":" + DoubleToString(HistoryOrderGetDouble(slTpOrderTicket, ORDER_SL), digits) + ",";
      body += "\\"take_profit\\":" + DoubleToString(HistoryOrderGetDouble(slTpOrderTicket, ORDER_TP), digits) + ",";
      body += "\\"mfe\\":" + DoubleToString(mfe, digits) + ",";
      body += "\\"mae\\":" + DoubleToString(mae, digits) + ",";
      body += "\\"symbol\\":\\"" + symbol + "\\",";
      body += "\\"volume\\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_VOLUME), 2) + ",";
      body += "\\"profit\\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_PROFIT), 2) + ",";
      body += "\\"commission\\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_COMMISSION), 2) + ",";
      body += "\\"swap\\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_SWAP), 2);
      body += "}";
      exported++;
   }

   body += "],";
   body += "\\"requestToken\\":\\"" + requestToken + "\\",";
   body += "\\"source\\":\\"mt5_ea_history\\"";
   body += "}";

   if(exported == 0) return;
   if(SendJson("/v1/ea/history/export", body))
   {
      Print("Green Turtle Trades EA exported ", exported, " historical trades.");
   }
}

bool SendJson(string path, string jsonBody)
{
   string url = API_BASE_URL + path;
   string headers = "Content-Type: application/json\\r\\n";
   headers += "x-api-key: " + API_KEY + "\\r\\n";
   headers += "x-broker-account-id: " + BROKER_ACCOUNT_ID + "\\r\\n";

   char post[];
   char result[];
   string responseHeaders;
   StringToCharArray(jsonBody, post, 0, StringLen(jsonBody));
   int status = WebRequest("POST", url, headers, 10000, post, result, responseHeaders);
   if(status != 200)
   {
      Print("Green Turtle Trades EA request failed: ", status);
      return(false);
   }
   return(true);
}

void CheckForRequestedExport()
{
   string requestToken = "";
   if(!FetchPendingExportToken(requestToken))
   {
      return;
   }

   if(StringLen(requestToken) == 0 || requestToken == lastRequestToken)
   {
      return;
   }

   lastRequestToken = requestToken;
   ExportClosedTrades(requestToken);
}

void OnTimer()
{
   SendHeartbeat();
   CheckForRequestedExport();
}

void OnTick()
{
   SendHeartbeat();
   if(TimeCurrent() - lastPollTime < MathMax(5, EXPORT_POLL_SECONDS))
   {
      return;
   }

   lastPollTime = TimeCurrent();
   CheckForRequestedExport();
}
//+------------------------------------------------------------------+`;
}

function buildEaSource({ platform, apiBaseUrl, apiKey, brokerAccountId }) {
  if (platform === "MT4") {
    return buildMt4EaSource({ apiBaseUrl, apiKey, brokerAccountId });
  }
  return buildMt5EaSource({ apiBaseUrl, apiKey, brokerAccountId });
}

async function apiKeyRequired(req, res, next) {
  try {
    const headerKey = getHeaderValue(req.headers["x-api-key"]);
    const bodyKey =
      req.body && typeof req.body.apiKey === "string" ? req.body.apiKey : null;
    const rawKey = headerKey && headerKey.trim() ? headerKey.trim() : null;
    const rawKeyFromBody = bodyKey && bodyKey.trim() ? bodyKey.trim() : null;
    const apiKeyValue = rawKey || rawKeyFromBody;

    if (!apiKeyValue) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const headerBrokerAccountId = getHeaderValue(
      req.headers["x-broker-account-id"]
    );
    const bodyBrokerAccountId =
      req.body && typeof req.body.brokerAccountId === "string"
        ? req.body.brokerAccountId
        : null;
    const rawBrokerAccountId =
      headerBrokerAccountId && headerBrokerAccountId.trim()
        ? headerBrokerAccountId.trim()
        : null;
    const rawBrokerAccountIdFromBody =
      bodyBrokerAccountId && bodyBrokerAccountId.trim()
        ? bodyBrokerAccountId.trim()
        : null;
    const brokerAccountId = rawBrokerAccountId || rawBrokerAccountIdFromBody;

    if (!brokerAccountId) {
      return res
        .status(400)
        .json({ ok: false, error: "Broker account is required" });
    }

    const candidates = await prisma.apiKey.findMany({
      where: { last4: apiKeyValue.slice(-4), revokedAt: null },
      select: { id: true, userId: true, keyHash: true },
    });

    if (!candidates.length) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    let matchedKey = null;

    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(apiKeyValue, candidate.keyHash);
      if (isMatch) {
        matchedKey = candidate;
        break;
      }
    }

    if (!matchedKey) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const brokerAccount = await prisma.brokerAccount.findFirst({
      where: { id: brokerAccountId, userId: matchedKey.userId },
      select: { id: true },
    });

    if (!brokerAccount) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    req.apiKey = { id: matchedKey.id, userId: matchedKey.userId };
    req.brokerAccountId = brokerAccount.id;

    return next();
  } catch (err) {
    return next(err);
  }
}

function eaEventHandler(type) {
  return async (req, res, next) => {
    try {
      const event = await prisma.eaEvent.create({
        data: {
          brokerAccountId: req.brokerAccountId,
          type,
          payload: req.body ?? {},
          receivedAt: new Date(),
        },
      });

      return res.json({ ok: true, id: event.id });
    } catch (err) {
      return next(err);
    }
  };
}

// Request logging
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });
  next();
});

const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.APP_URL,
      process.env.FRONTEND_URL,
      process.env.PUBLIC_FRONTEND_URL,
    ].filter((value) => typeof value === "string" && value.trim())
  )
);

// CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

// Parse JSON bodies
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Trader application (public)
app.post("/api/trader/apply", async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      country,
      brokerName,
      platform,
      accountNumber,
      experienceLevel,
      riskDisclosureAccepted,
      yearsTrading,
      usesMetaTrader,
    } = req.body || {};

    if (!fullName || typeof fullName !== "string") {
      return res.status(400).json({ ok: false, error: "Full name is required" });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (!country || typeof country !== "string") {
      return res.status(400).json({ ok: false, error: "Country is required" });
    }

    const hasLegacyFields =
      typeof platform === "string" &&
      brokerPlatforms.has(platform) &&
      typeof accountNumber === "string" &&
      typeof experienceLevel === "string" &&
      experienceLevels.has(experienceLevel) &&
      riskDisclosureAccepted === true;

    const hasSimplifiedFields =
      typeof yearsTrading === "number" &&
      Number.isFinite(yearsTrading) &&
      yearsTrading >= 0 &&
      typeof usesMetaTrader === "boolean";

    if (!hasLegacyFields && !hasSimplifiedFields) {
      return res.status(400).json({
        ok: false,
        error:
          "Application requires name, email, country, broker, years trading experience, and MetaTrader usage.",
      });
    }

    const resolvedPlatform = hasLegacyFields
      ? platform
      : usesMetaTrader
        ? "MT5"
        : "CTRADER";

    const resolvedAccountNumber =
      hasLegacyFields && typeof accountNumber === "string" && accountNumber.trim()
        ? accountNumber.trim()
        : "PENDING";

    const resolvedExperienceLevel = hasLegacyFields
      ? experienceLevel
      : yearsTrading >= 5
        ? "ADVANCED"
        : yearsTrading >= 2
          ? "INTERMEDIATE"
          : "BEGINNER";

    const normalizedEmail = email.trim().toLowerCase();

    const application = await prisma.traderApplication.upsert({
      where: { email: normalizedEmail },
      update: {
        fullName: fullName.trim(),
        country: country.trim(),
        brokerName:
          typeof brokerName === "string" && brokerName.trim()
            ? brokerName.trim()
            : null,
        platform: resolvedPlatform,
        accountNumber: resolvedAccountNumber,
        experienceLevel: resolvedExperienceLevel,
        status: "PENDING",
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
      },
      create: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        country: country.trim(),
        brokerName:
          typeof brokerName === "string" && brokerName.trim()
            ? brokerName.trim()
            : null,
        platform: resolvedPlatform,
        accountNumber: resolvedAccountNumber,
        experienceLevel: resolvedExperienceLevel,
        status: "PENDING",
      },
    });

    sendEmail({
      to: normalizedEmail,
      replyTo: process.env.EMAIL_NOTIFY_TO || process.env.EMAIL_FROM,
      subject: "Your trader application has been received",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
          <div style="padding: 24px 0 12px;">
            <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
            <p style="margin-top: 0;">Hi ${fullName.trim()},</p>
            <p>Thank you for applying to join Green Turtle Trades as a trader.</p>
            <p>We have received your application and will review it internally.</p>
            <p>We will reach out to you when the platform is ready, or sooner if we need any additional information.</p>
            <div style="margin: 24px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
              <p style="margin: 0 0 8px;"><strong>Name:</strong> ${fullName.trim()}</p>
              <p style="margin: 0 0 8px;"><strong>Email:</strong> ${normalizedEmail}</p>
              <p style="margin: 0 0 8px;"><strong>Country:</strong> ${country.trim()}</p>
              <p style="margin: 0;"><strong>Broker:</strong> ${
                typeof brokerName === "string" && brokerName.trim()
                  ? brokerName.trim()
                  : "Not provided"
              }</p>
            </div>
            <p style="margin-bottom: 0;">Best regards,<br />Green Turtle Trades</p>
          </div>
        </div>
      `,
      text: [
        `Hi ${fullName.trim()},`,
        "",
        "Thank you for applying to join Green Turtle Trades as a trader.",
        "We have received your application and will review it internally.",
        "We will reach out to you when the platform is ready, or sooner if we need any additional information.",
        "",
        "Best regards,",
        "Green Turtle Trades",
      ].join("\n"),
    }).catch((e) => console.error("Trader application confirmation email failed:", e));

    const notifyTo = process.env.EMAIL_NOTIFY_TO;

    if (notifyTo) {
      sendEmail({
        to: notifyTo,
        subject: "New trader application received",
        replyTo: normalizedEmail,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
            <div style="padding: 24px 0 12px;">
              <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
              <p style="margin-top: 0;">A new trader application has been submitted.</p>
              <div style="margin: 20px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <p style="margin: 0 0 8px;"><strong>Name:</strong> ${fullName.trim()}</p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${normalizedEmail}</p>
                <p style="margin: 0 0 8px;"><strong>Country:</strong> ${country.trim()}</p>
                <p style="margin: 0 0 8px;"><strong>Broker:</strong> ${
                  typeof brokerName === "string" && brokerName.trim()
                    ? brokerName.trim()
                    : "Not provided"
                }</p>
                <p style="margin: 0 0 8px;"><strong>Years Trading:</strong> ${
                  hasSimplifiedFields ? yearsTrading : "Not provided"
                }</p>
                <p style="margin: 0;"><strong>Uses MetaTrader:</strong> ${
                  hasSimplifiedFields ? (usesMetaTrader ? "Yes" : "No") : "Not provided"
                }</p>
              </div>
            </div>
          </div>
        `,
        text: [
          "A new trader application has been submitted.",
          "",
          `Name: ${fullName.trim()}`,
          `Email: ${normalizedEmail}`,
          `Country: ${country.trim()}`,
          `Broker: ${
            typeof brokerName === "string" && brokerName.trim()
              ? brokerName.trim()
              : "Not provided"
          }`,
          `Years Trading: ${hasSimplifiedFields ? yearsTrading : "Not provided"}`,
          `Uses MetaTrader: ${
            hasSimplifiedFields ? (usesMetaTrader ? "Yes" : "No") : "Not provided"
          }`,
        ].join("\n"),
      }).catch((e) => console.error("Trader application notify email failed:", e));
    }

    return res.json({ ok: true, id: application.id, status: application.status });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/trader/application", async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    const application = await prisma.traderApplication.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { status: true, rejectionReason: true },
    });

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, error: "Application not found" });
    }

    return res.json({
      ok: true,
      status: application.status,
      rejectionReason: application.rejectionReason,
    });
  } catch (err) {
    return next(err);
  }
});

// Auth
app.post("/api/auth/register", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "auth-register",
  message: "Too many registration attempts. Please try again later.",
}), async (req, res) => {
  try {
    const { email, password, name, metaTraderUsername, brokerName } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ ok: false, error: "Password is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const trimmedName = typeof name === "string" ? name.trim() : "";
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
        passwordHash,
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
    });

    const token = signToken(user);

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

app.post("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "auth-login",
  message: "Too many login attempts. Please try again later.",
}), async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ ok: false, error: "Password is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ ok: false, error: "Account disabled" });
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

app.post("/api/admin/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "admin-login",
  message: "Too many admin login attempts. Please try again later.",
}), async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ ok: false, error: "Password is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const envEmail = process.env.ADMIN_EMAIL || "greenturtlrtraders26@gmail.com";
    const envPassword = process.env.ADMIN_PASSWORD;

    const allowEnvAdminLogin =
      process.env.ENABLE_ENV_ADMIN_LOGIN === "true";

    if (
      allowEnvAdminLogin &&
      envEmail &&
      envPassword &&
      normalizedEmail === envEmail.trim().toLowerCase() &&
      password === envPassword
    ) {
      const token = signToken({ id: "env-admin", role: "ADMIN" });

      return res.json({
        ok: true,
        token,
        user: {
          id: "env-admin",
          email: normalizedEmail,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
    }

    const adminUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: {
          in: Array.from(staffPortalRoles),
        },
      },
    });

    if (adminUser) {
      const passwordValid = await bcrypt.compare(password, adminUser.passwordHash);

      if (!passwordValid) {
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
      }

      if (adminUser.status === "DISABLED") {
        return res.status(403).json({ ok: false, error: "Account disabled" });
      }

      const token = signToken(adminUser);

      return res.json({
        ok: true,
        token,
        mustChangePassword: adminUser.status === "PENDING",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          status: adminUser.status,
        },
      });
    }

    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

app.post("/api/admin/change-password", authRequired, adminRequired, async (req, res, next) => {
  try {
    if (!req.user || req.user.id === "env-admin") {
      return res.status(400).json({ ok: false, error: "Environment admin password cannot be changed here" });
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({ ok: false, error: "Current password is required" });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 8) {
      return res.status(400).json({ ok: false, error: "New password must be at least 8 characters" });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!adminUser || !staffPortalRoles.has(adminUser.role)) {
      return res.status(404).json({ ok: false, error: "Staff user not found" });
    }

    const passwordValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ ok: false, error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash,
        status: "ACTIVE",
      },
    });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

app.post("/api/subscription/churn-feedback", authRequired, async (req, res, next) => {
  try {
    const { reason, feedback, plan } = req.body || {};

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ ok: false, error: "Cancellation reason is required" });
    }

    const entry = await prisma.churnFeedback.create({
      data: {
        userId: req.user.id,
        reason: reason.trim(),
        feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : null,
        plan: typeof plan === "string" && plan.trim() ? plan.trim() : null,
      },
    });

    return res.json({ ok: true, id: entry.id });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/me", authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
    });
  } catch (err) {
    return next(err);
  }
});

app.patch("/api/me/profile", authRequired, async (req, res, next) => {
  try {
    const { fullName, email } = req.body || {};

    if (fullName !== undefined && typeof fullName !== "string") {
      return res.status(400).json({ ok: false, error: "Full name must be a string" });
    }

    if (email !== undefined && typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email must be a string" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const data = {};
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ ok: false, error: "Email cannot be empty" });
      }

      if (normalizedEmail !== user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (existing && existing.id !== user.id) {
          return res.status(409).json({ ok: false, error: "Email already exists" });
        }
        data.email = normalizedEmail;
      }
    }

    const trimmedName = fullName !== undefined ? fullName.trim() : null;
    const [firstName, ...restName] = trimmedName ? trimmedName.split(/\s+/) : [];
    const lastName = restName.join(" ");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...data,
        ...(fullName !== undefined
          ? user.profile
            ? {
                profile: {
                  update: {
                    firstName: firstName || null,
                    lastName: lastName || null,
                  },
                },
              }
            : {
                profile: {
                  create: {
                    firstName: firstName || null,
                    lastName: lastName || null,
                  },
                },
              }
          : {}),
      },
      include: { profile: true },
    });

    return res.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        profile: updated.profile,
      },
    });
  } catch (err) {
    return next(err);
  }
});

app.post("/api/me/change-password", authRequired, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({ ok: false, error: "Current password is required" });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 8) {
      return res.status(400).json({ ok: false, error: "New password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ ok: false, error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

app.delete("/api/me", authRequired, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// Create waitlist entry
app.post("/api/waitlist", async (req, res) => {
  try {
    const { email, source } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await prisma.waitlistEntry.upsert({
      where: { email: normalizedEmail },
      update: { source: source || undefined },
      create: { email: normalizedEmail, source: source || null },
    });

    // Fire-and-forget emails (don’t block response)
    const notifyTo = process.env.EMAIL_NOTIFY_TO;

    sendEmail({
      to: normalizedEmail,
      replyTo: notifyTo || process.env.EMAIL_FROM,
      subject: "Your early access request has been received",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
          <div style="padding: 24px 0 12px;">
            <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
            <p style="margin-top: 0;">Thank you for requesting early access to Green Turtle Trades.</p>
            <p>We have received your request and added you to our investor waitlist.</p>
            <p>We will reach out to you as soon as access becomes available and the platform is ready.</p>
            <div style="margin: 24px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
              <p style="margin: 0;"><strong>Email:</strong> ${normalizedEmail}</p>
            </div>
            <p style="margin-bottom: 0;">Best regards,<br />Green Turtle Trades</p>
          </div>
        </div>
      `,
      text: [
        "Thank you for requesting early access to Green Turtle Trades.",
        "We have received your request and added you to our investor waitlist.",
        "We will reach out to you as soon as access becomes available and the platform is ready.",
        "",
        `Email: ${normalizedEmail}`,
        "",
        "Best regards,",
        "Green Turtle Trades",
      ].join("\n"),
    }).catch((e) => console.error("Waitlist confirmation email failed:", e));

    if (notifyTo) {
      sendEmail({
        to: notifyTo,
        replyTo: normalizedEmail,
        subject: "New waitlist signup",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
            <div style="padding: 24px 0 12px;">
              <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
              <p style="margin-top: 0;">A new investor waitlist request has been submitted.</p>
              <div style="margin: 20px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${normalizedEmail}</p>
                <p style="margin: 0;"><strong>Source:</strong> ${source || "unknown"}</p>
              </div>
            </div>
          </div>
        `,
        text: [
          "A new investor waitlist request has been submitted.",
          "",
          `Email: ${normalizedEmail}`,
          `Source: ${source || "unknown"}`,
        ].join("\n"),
      }).catch((e) => console.error("Waitlist notify email failed:", e));
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// Create contact message
app.post("/api/contact", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (name !== undefined && name !== null && typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "Name must be a string" });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (subject !== undefined && subject !== null && typeof subject !== "string") {
      return res.status(400).json({ ok: false, error: "Subject must be a string" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ ok: false, error: "Message is required" });
    }

    const normalizedName =
      typeof name === "string" && name.trim() ? name.trim() : null;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedSubject =
      typeof subject === "string" && subject.trim() ? subject.trim() : null;
    const normalizedMessage = message.trim();

    // Store only fields that exist in your Prisma model
    await prisma.contactMessage.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        message: normalizedMessage,
      },
    });

    const notifyTo = process.env.EMAIL_NOTIFY_TO;

    if (notifyTo) {
      sendEmail({
        to: notifyTo,
        subject: "New contact message",
        replyTo: normalizedEmail,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h3>New contact message</h3>
            <p><b>Name:</b> ${normalizedName || "—"}</p>
            <p><b>Email:</b> ${normalizedEmail}</p>
            <p><b>Subject:</b> ${normalizedSubject || "—"}</p>
            <p><b>Message:</b></p>
            <pre style="white-space: pre-wrap; background:#f8fafc; padding:12px; border-radius:8px;">${normalizedMessage}</pre>
          </div>
        `,
      }).catch((e) => console.error("Contact notify email failed:", e));
    }

    sendEmail({
      to: normalizedEmail,
      subject: "We received your message",
      replyTo: notifyTo || process.env.EMAIL_FROM,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto;">
          <div style="padding: 24px 0 12px;">
            <h2 style="margin: 0; color: #0f766e;">Green Turtle Trades</h2>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
            <p style="margin-top: 0;">Hi ${normalizedName || "there"},</p>
            <p>Thank you for contacting Green Turtle Trades. We've received your message and will get back to you as soon as possible.</p>
            <p>Our usual response time is within 24 hours during business days.</p>
            <div style="margin: 24px 0; padding: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
              <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${normalizedSubject || "General enquiry"}</p>
              <p style="margin: 0 0 8px;"><strong>Email:</strong> ${normalizedEmail}</p>
              <p style="margin: 0;"><strong>Message received:</strong></p>
              <pre style="white-space: pre-wrap; margin: 12px 0 0; font-family: Arial, sans-serif; background: #f8fafc; padding: 12px; border-radius: 8px;">${normalizedMessage}</pre>
            </div>
            <p style="margin-bottom: 0;">Best regards,<br />Green Turtle Trades Support</p>
          </div>
        </div>
      `,
      text: [
        `Hi ${normalizedName || "there"},`,
        "",
        "Thank you for contacting Green Turtle Trades.",
        "We've received your message and will get back to you as soon as possible.",
        "Our usual response time is within 24 hours during business days.",
        "",
        `Subject: ${normalizedSubject || "General enquiry"}`,
        `Email: ${normalizedEmail}`,
        "",
        "Message received:",
        normalizedMessage,
        "",
        "Best regards,",
        "Green Turtle Trades Support",
      ].join("\n"),
    }).catch((e) => console.error("Contact confirmation email failed:", e));

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// Admin trader application review
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
      return res
        .status(400)
        .json({ ok: false, error: "Rejection reason is required" });
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
    const [users, applications] = await Promise.all([
      prisma.user.findMany({
        where: { role: "TRADER" },
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
            },
          },
        },
      }),
      prisma.traderApplication.findMany({
        orderBy: { submittedAt: "desc" },
      }),
    ]);

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
        const derivedName =
          profileName ||
          applicationName ||
          email.split("@")[0];

        return {
          id: user?.id || application?.id,
          name: derivedName,
          email,
          accountStatus: user ? user.status : "NO_ACCOUNT",
          applicationStatus: application ? application.status : "NONE",
          plan: user?.stripeSubscriptionId ? "premium" : "payg",
          joinedAt: (user?.createdAt || application?.submittedAt || new Date()).toISOString(),
          country: application?.country || null,
          platform: application?.platform || null,
          experienceLevel: application?.experienceLevel || null,
          brokerAccountsCount: brokerAccounts.length,
          activeBrokerAccountsCount: brokerAccounts.filter((account) => account.isActive).length,
          apiKeysCount: user?._count?.apiKeys || 0,
          tradeEventCount,
          historyExportCount,
          lastEaSyncAt: lastEaSyncAt ? lastEaSyncAt.toISOString() : null,
          hasAccount: Boolean(user),
          hasApplication: Boolean(application),
          analysisStatus: getTraderAnalysisStatus({
            latestSnapshot,
            tradeEventCount,
            historyExportCount,
          }),
          latestAnalysisAt: latestSnapshot ? latestSnapshot.updatedAt.toISOString() : null,
          latestAnalysisReport: latestSnapshot ? latestSnapshot.report : null,
          metrics: {
            tradesAnalysed: latestSnapshot?.tradesAnalysed ?? null,
            avgRMultiple: latestSnapshot?.avgRMultiple ?? null,
            winRate: latestSnapshot?.winRate ?? null,
            sharpeRatio: latestSnapshot?.sharpeRatio ?? null,
            maxDrawdownR: latestSnapshot?.maxDrawdownR ?? null,
            totalR: latestSnapshot?.totalR ?? null,
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
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: Array.from(staffPortalRoles),
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
      },
    });

    const items = adminUsers.map(buildAdminStaffMember);

    const envEmail = (process.env.ADMIN_EMAIL || "greenturtlrtraders26@gmail.com").trim().toLowerCase();
    if (envEmail && !items.some((item) => item.email === envEmail)) {
      items.unshift({
        id: "env-admin",
        name: envEmail.split("@")[0],
        email: envEmail,
        role: "admin",
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

      return {
        id: item.id,
        userId: item.userId,
        userName: profileName || item.user.email.split("@")[0],
        email: item.user.email,
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

app.post("/api/admin/staff/invite", authRequired, staffWriteRequired, async (req, res, next) => {
  try {
    const { email, temporaryCode } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (
      !temporaryCode ||
      typeof temporaryCode !== "string" ||
      temporaryCode.trim().length < 8
    ) {
      return res.status(400).json({ ok: false, error: "Temporary code must be at least 8 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
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
            status: "PENDING",
          },
          include: { profile: true },
        })
      : await prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            role: "ADMIN",
            status: "PENDING",
          },
          include: { profile: true },
        });

    const appUrl = process.env.APP_URL || "http://localhost:5173";

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
        `One-time code: ${temporaryCode.trim()}`,
        `Admin portal: ${appUrl}/admin`,
      ].join("\n"),
    }).catch((e) => console.error("Admin invite email failed:", e));

    return res.json({ ok: true, staffMember: buildAdminStaffMember(adminUser) });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/admin/signups", authRequired, adminRequired, async (req, res, next) => {
  try {
    const [waitlistEntries, traderApplications, traderUsers] = await Promise.all([
      prisma.waitlistEntry.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.traderApplication.findMany({
        orderBy: { submittedAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "TRADER" },
        orderBy: { createdAt: "desc" },
        include: { profile: true },
      }),
    ]);

    const items = [
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

    return res.json({ ok: true, items });
  } catch (err) {
    return next(err);
  }
});

// Broker accounts
app.post("/api/broker-accounts", authRequired, async (req, res, next) => {
  try {
    const { platform, brokerName, accountNumber, label, isActive } =
      req.body || {};

    if (!platform || typeof platform !== "string") {
      return res.status(400).json({ ok: false, error: "Platform is required" });
    }

    if (!brokerPlatforms.has(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform" });
    }

    if (!accountNumber || typeof accountNumber !== "string") {
      return res
        .status(400)
        .json({ ok: false, error: "Account number is required" });
    }

    const brokerAccount = await prisma.brokerAccount.create({
      data: {
        userId: req.user.id,
        platform,
        brokerName:
          typeof brokerName === "string" && brokerName.trim()
            ? brokerName.trim()
            : null,
        accountNumber: accountNumber.trim(),
        label:
          typeof label === "string" && label.trim() ? label.trim() : null,
        isActive: isActive === undefined ? true : Boolean(isActive),
      },
    });

    return res.json({ ok: true, brokerAccount });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/broker-accounts", authRequired, async (req, res, next) => {
  try {
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ ok: true, brokerAccounts });
  } catch (err) {
    return next(err);
  }
});

app.patch("/api/broker-accounts/:id", authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform, brokerName, accountNumber, label, isActive } =
      req.body || {};

    const brokerAccount = await prisma.brokerAccount.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!brokerAccount) {
      return res
        .status(404)
        .json({ ok: false, error: "Broker account not found" });
    }

    const data = {};

    if (platform !== undefined) {
      if (typeof platform !== "string" || !brokerPlatforms.has(platform)) {
        return res.status(400).json({ ok: false, error: "Invalid platform" });
      }
      data.platform = platform;
    }

    if (brokerName !== undefined) {
      if (brokerName !== null && typeof brokerName !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Broker name must be a string" });
      }
      data.brokerName =
        typeof brokerName === "string" && brokerName.trim()
          ? brokerName.trim()
          : null;
    }

    if (accountNumber !== undefined) {
      if (typeof accountNumber !== "string" || !accountNumber.trim()) {
        return res
          .status(400)
          .json({ ok: false, error: "Account number must be a string" });
      }
      data.accountNumber = accountNumber.trim();
    }

    if (label !== undefined) {
      if (label !== null && typeof label !== "string") {
        return res.status(400).json({ ok: false, error: "Label must be a string" });
      }
      data.label =
        typeof label === "string" && label.trim() ? label.trim() : null;
    }

    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "No fields to update" });
    }

    const updated = await prisma.brokerAccount.update({
      where: { id: brokerAccount.id },
      data,
    });

    return res.json({ ok: true, brokerAccount: updated });
  } catch (err) {
    return next(err);
  }
});

// API keys
app.post("/api/api-keys", authRequired, async (req, res, next) => {
  try {
    const { name } = req.body || {};

    if (name !== undefined && name !== null && typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "Name must be a string" });
    }

    const normalizedName =
      typeof name === "string" && name.trim() ? name.trim() : "Default";

    const rawKey = `gt_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: req.user.id,
        name: normalizedName,
        keyHash,
        last4: rawKey.slice(-4),
      },
    });

    return res.json({
      ok: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        last4: apiKey.last4,
        createdAt: apiKey.createdAt,
        key: rawKey,
      },
    });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/api-keys", authRequired, async (req, res, next) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        last4: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return res.json({ ok: true, apiKeys });
  } catch (err) {
    return next(err);
  }
});

app.delete("/api/api-keys/:id", authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true, revokedAt: true },
    });

    if (!apiKey) {
      return res.status(404).json({ ok: false, error: "API key not found" });
    }

    if (!apiKey.revokedAt) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { revokedAt: new Date() },
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

app.post("/api/ea/download", authRequired, async (req, res, next) => {
  try {
    const requestedPlatform = req.body?.platform;
    if (requestedPlatform !== "MT4" && requestedPlatform !== "MT5") {
      return res.status(400).json({ ok: false, error: "Platform must be MT4 or MT5" });
    }

    const brokerAccount = await getOrCreateEaBrokerAccount(req.user.id, requestedPlatform);
    const { apiKey, rawKey } = await issueManagedEaApiKey(req.user.id);
    const apiBaseUrl = getPublicApiBaseUrl(req);
    const filename = requestedPlatform === "MT4"
      ? "GreenTurtleTradesEA.mq4"
      : "GreenTurtleTradesEA.mq5";

    const content = buildEaSource({
      platform: requestedPlatform,
      apiBaseUrl,
      apiKey: rawKey,
      brokerAccountId: brokerAccount.id,
    });

    return res.json({
      ok: true,
      filename,
      content,
      apiKeyLast4: apiKey.last4,
      brokerAccountId: brokerAccount.id,
      brokerAccountNumber: brokerAccount.accountNumber,
      platform: requestedPlatform,
    });
  } catch (err) {
    return next(err);
  }
});

// EA ingestion
app.get("/v1/ea/export-request", apiKeyRequired, async (req, res, next) => {
  try {
    const [latestRequest, latestExport] = await Promise.all([
      prisma.eaEvent.findFirst({
        where: {
          brokerAccountId: req.brokerAccountId,
          type: "EXPORT_REQUEST",
        },
        orderBy: { receivedAt: "desc" },
      }),
      prisma.eaEvent.findFirst({
        where: {
          brokerAccountId: req.brokerAccountId,
          type: "HISTORY_EXPORT",
        },
        orderBy: { receivedAt: "desc" },
      }),
    ]);

    const requestToken =
      typeof latestRequest?.payload?.requestToken === "string"
        ? latestRequest.payload.requestToken
        : latestRequest?.id || "";
    const pending =
      !!latestRequest &&
      (!latestExport || latestExport.receivedAt < latestRequest.receivedAt);

    return res.json({
      ok: true,
      pending,
      requestToken: pending ? requestToken : null,
      requestedAt: pending ? latestRequest.receivedAt.toISOString() : null,
    });
  } catch (err) {
    return next(err);
  }
});

app.post(
  "/v1/ea/market/batch",
  apiKeyRequired,
  eaEventHandler("MARKET_BATCH")
);
app.post(
  "/v1/ea/heartbeat",
  apiKeyRequired,
  eaEventHandler("HEARTBEAT")
);
app.post(
  "/v1/ea/trades/event",
  apiKeyRequired,
  eaEventHandler("TRADE_EVENT")
);
app.post(
  "/v1/ea/history/export",
  apiKeyRequired,
  eaEventHandler("HISTORY_EXPORT")
);

app.get("/api/ea/status", authRequired, async (req, res, next) => {
  try {
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        platform: true,
        accountNumber: true,
        brokerName: true,
        eaEvents: {
          where: { type: { in: ["HEARTBEAT", "HISTORY_EXPORT"] } },
          orderBy: { receivedAt: "desc" },
          take: 10,
          select: { id: true, type: true, receivedAt: true },
        },
      },
    });

    const primaryAccount = brokerAccounts[0] || null;
    const status = buildEaConnectionStatus(primaryAccount?.eaEvents || []);

    return res.json({
      ok: true,
      platform: primaryAccount?.platform || null,
      brokerAccountId: primaryAccount?.id || null,
      brokerAccountNumber: primaryAccount?.accountNumber || null,
      brokerName: primaryAccount?.brokerName || null,
      ...status,
    });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/ea/diagnostics", authRequired, async (req, res, next) => {
  try {
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: req.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        platform: true,
        accountNumber: true,
        brokerName: true,
        eaEvents: {
          where: { type: { in: ["EXPORT_REQUEST", "HEARTBEAT", "HISTORY_EXPORT"] } },
          orderBy: { receivedAt: "desc" },
          take: 25,
          select: { id: true, type: true, payload: true, receivedAt: true },
        },
      },
    });

    const primaryAccount = brokerAccounts[0] || null;
    const events = primaryAccount?.eaEvents || [];
    const status = buildEaConnectionStatus(events);
    const latestRequest = events.find((event) => event.type === "EXPORT_REQUEST") || null;
    const latestExport = events.find((event) => event.type === "HISTORY_EXPORT") || null;
    const hints = [];

    if (!primaryAccount) {
      hints.push("No broker account is linked yet. Save your MetaTrader ID in Settings first.");
    } else if (!status.eaLastSeenAt) {
      hints.push("No EA telemetry has reached the backend yet. Download the latest EA file and keep MetaTrader running.");
    } else if (!status.eaConnected) {
      hints.push(`The EA was seen before but is currently offline. Expected heartbeat every ${status.onlineWindowMinutes} minutes or less.`);
    }

    if (latestRequest && (!latestExport || latestExport.receivedAt < latestRequest.receivedAt)) {
      hints.push("A history export has been requested but the EA has not uploaded it yet. Keep MetaTrader open and attached to a chart.");
    }

    hints.push(`Allow MetaTrader WebRequest access to: ${getPublicApiBaseUrl(req)}`);

    return res.json({
      ok: true,
      connection: status,
      profile: {
        brokerAccountId: primaryAccount?.id || null,
        accountNumber: primaryAccount?.accountNumber || null,
        brokerName: primaryAccount?.brokerName || null,
        platform: primaryAccount?.platform || null,
      },
      expected: {
        apiBaseUrl: getPublicApiBaseUrl(req),
        exportRequestPath: "/v1/ea/export-request",
        historyExportPath: "/v1/ea/history/export",
        heartbeatPath: "/v1/ea/heartbeat",
      },
      telemetry: {
        latestRequestAt: toIsoOrNull(latestRequest?.receivedAt || null),
        latestExportAt: toIsoOrNull(latestExport?.receivedAt || null),
        recentEvents: events.slice(0, 10).map((event) => ({
          id: event.id,
          type: event.type,
          receivedAt: toIsoOrNull(event.receivedAt),
        })),
      },
      hints,
    });
  } catch (err) {
    return next(err);
  }
});

// Admin metrics
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

// ---------------------------------------------------------------------------
// Turtle Analytics — trigger ML pipeline and poll results
// ---------------------------------------------------------------------------

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

app.get("/api/analyse/options", authRequired, async (req, res, next) => {
  try {
    return res.json({ ok: true, ...(await buildAnalysisOptionsPayload(req.user.id, { requestFresh: true })) });
  } catch (err) {
    return next(err);
  }
});

app.get("/api/account/state", authRequired, async (req, res, next) => {
  try {
    return res.json({ ok: true, ...(await buildAccountStatePayload(req.user.id)) });
  } catch (err) {
    return next(err);
  }
});

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

app.get("/api/trades", authRequired, async (req, res, next) => {
  try {
    const { trades, pnlMeta } = await buildAccountStatePayload(req.user.id);
    return res.json({ ok: true, trades, pnlMeta });
  } catch (err) {
    return next(err);
  }
});

app.delete("/api/account/analysis-data", authRequired, async (req, res, next) => {
  try {
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

    return res.json({
      ok: true,
      message: "Saved analysis runs, snapshots, and stored trade history were cleared for this account.",
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/analyse/csv
 *
 * Parses a CSV upload, upserts its trades into the stored trade ledger,
 * and analyses the user's cumulative remembered trade history.
 */
app.post("/api/analyse/csv", authRequired, async (req, res, next) => {
  let analysisRun = null;
  try {
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
    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/analyse`, {
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
    analysisJobContext.set(job_id, {
      userId: req.user.id,
      analysisRunId: analysisRun.id,
      tradeFingerprint,
      tradeIdentities: pendingTrades
        .map((trade) => buildTradeIdentity(trade, req.user.id))
        .filter(Boolean),
      requestedTradeCount: tradeCount,
      uniqueTradeCount: allTrades.length,
      availableTradeCount: allTrades.length,
      duplicateTradeCount: persistSummary.updated,
      mode,
    });

    return res.json({
      ok: true,
      jobId: job_id,
      analysisRunId: analysisRun.id,
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

/**
 * POST /api/analyse
 *
 * Fetches the user's trade history from HISTORY_EXPORT EA events,
 * extracts the trade records, and dispatches them to the Python
 * Turtle Analytics service.
 *
 * Body (optional):
 *   { tradeCount?: number, months?: number, mode?: "trades"|"months" }
 *
 * Returns: { ok: true, jobId: string }
 */
app.post("/api/analyse", authRequired, async (req, res, next) => {
  let analysisRun = null;
  try {
    const { tradeCount = 500, months = 12, mode = "trades" } = req.body || {};

    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: req.user.id, isActive: true },
      select: { id: true },
    });
    const brokerAccountIds = brokerAccounts.map((b) => b.id);
    let persistSummary = { stored: 0, updated: 0, invalid: 0 };
    let freshTrades = [];

    if (brokerAccountIds.length > 0) {
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
      freshTrades = freshRows.map((row) => row.trade);
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
    }

    const pendingTrades = await loadStoredTradesForAnalysis(req.user.id, {
      mode,
      tradeCount,
      months,
      pendingOnly: true,
    });

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

    // 6. Dispatch to Python service
    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/analyse`, {
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
    analysisJobContext.set(job_id, {
      userId: req.user.id,
      analysisRunId: analysisRun.id,
      tradeFingerprint,
      tradeIdentities: pendingTrades
        .map((trade) => buildTradeIdentity(trade, req.user.id))
        .filter(Boolean),
      requestedTradeCount: mode === "trades" ? tradeCount : null,
      uniqueTradeCount: allTrades.length,
      availableTradeCount: uniqueTradeCount,
      duplicateTradeCount,
      mode,
    });
    return res.json({
      ok: true,
      jobId: job_id,
      analysisRunId: analysisRun.id,
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

/**
 * GET /api/analyse/:jobId
 *
 * Polls the Python service for job status and forwards the result.
 *
 * Returns: { ok: true, status, tradesAnalysed, simulationsRun, regimesFound, avgRMultiple, report? }
 */
app.get("/api/analyse/:jobId", authRequired, async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/results/${jobId}`);

    if (pythonRes.status === 404) {
      return res.status(404).json({ ok: false, error: "Job not found" });
    }

    if (!pythonRes.ok) {
      const jobContext = analysisJobContext.get(jobId) || null;
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

      const jobContext = analysisJobContext.get(jobId) || null;
      const snapshotReport = buildSnapshotReport(data.report, {
        trade_fingerprint: jobContext?.tradeFingerprint ?? null,
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
      }
    } else if (data.status === "error") {
      const jobContext = analysisJobContext.get(jobId) || null;
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
      report: data.report || null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// Stripe Checkout
// ---------------------------------------------------------------------------

app.post("/api/create-checkout-session", authRequired, async (req, res, next) => {
  try {
    if (process.env.PAYMENTS_ACTIVE !== "true") {
      return res.status(403).json({ ok: false, error: "Payments not active" });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ ok: false, error: "Stripe not configured" });
    }

    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY;
    const perTradePriceId = process.env.STRIPE_PRICE_PER_TRADE;

    if (!monthlyPriceId || !perTradePriceId) {
      return res.status(500).json({ ok: false, error: "Stripe prices not configured" });
    }

    const stripe = Stripe(stripeSecretKey);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Reuse existing Stripe customer or create a new one
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const appUrl = process.env.APP_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: monthlyPriceId,
          quantity: 1,
        },
        {
          price: perTradePriceId,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}?checkout=success`,
      cancel_url: `${appUrl}?checkout=cancelled`,
    });

    return res.json({ ok: true, url: session.url });
  } catch (err) {
    return next(err);
  }
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

module.exports = app;
