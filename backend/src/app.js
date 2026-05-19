const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createClient } = require("redis");
const Stripe = require("stripe");
const { prisma } = require("./db/prisma");
const { createAuthHelpers } = require("./middleware/auth");
const { sendEmail } = require("./services/email");
const { createAccountStateHelpers } = require("./services/account-state");
const { createBillingReferralHelpers } = require("./services/billing-referrals");
const { buildTrading212TradesFromHistory } = require("./services/trading212");
const { registerAccountRoutes } = require("./routes/account-routes");
const { registerAdminRoutes } = require("./routes/admin-routes");
const { registerAnalyticsRoutes } = require("./routes/analytics-routes");
const { registerStripeWebhookRoute, registerBillingRoutes } = require("./routes/billing-routes");
const { registerIntegrationRoutes } = require("./routes/integrations-routes");
const { registerPlatformRoutes } = require("./routes/platform-routes");
const { registerPublicRoutes } = require("./routes/public-routes");

const app = express();

const brokerPlatforms = new Set(["MT4", "MT5", "CTRADER", "TRADING212"]);
const experienceLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const applicationStatuses = new Set(["PENDING", "APPROVED", "REJECTED"]);
const staffPortalRoles = new Set(["ADMIN"]);
const staffWriteRoles = new Set(["ADMIN"]);
const rateLimitStore = new Map();
const rateLimitCleanupIntervalMs = 5 * 60 * 1000;
const subscriptionAccessCache = new Map();
const subscriptionAccessCacheTtlMs = 5 * 60 * 1000;
const internalCompanyEmails = new Set([
  "greenturtletraders26@gmail.com",
  "greengurtletraders26@gmail.com",
]);
let redisRateLimitClient = null;
let redisRateLimitReady = false;
let redisRateLimitInitPromise = null;

const {
  parseCookies,
  getSessionCookieName,
  setSessionCookie,
  clearSessionCookie,
  signToken,
  authRequired,
  adminRequired,
  staffWriteRequired,
  superAdminRequired,
  getHeaderValue,
  getTrustedRequestOrigin,
} = createAuthHelpers({
  staffPortalRoles,
  staffWriteRoles,
});

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (!entry || entry.expiresAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

const rateLimitCleanupTimer = setInterval(cleanupRateLimitStore, rateLimitCleanupIntervalMs);
if (typeof rateLimitCleanupTimer.unref === "function") {
  rateLimitCleanupTimer.unref();
}

async function getRedisRateLimitClient() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (redisRateLimitReady && redisRateLimitClient) {
    return redisRateLimitClient;
  }

  if (redisRateLimitInitPromise) {
    return redisRateLimitInitPromise;
  }

  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: false,
    },
  });

  client.on("error", (error) => {
    redisRateLimitReady = false;
    console.error("Redis rate limit client error:", error?.message || error);
  });

  redisRateLimitInitPromise = client
    .connect()
    .then(() => {
      redisRateLimitClient = client;
      redisRateLimitReady = true;
      return client;
    })
    .catch((error) => {
      redisRateLimitClient = null;
      redisRateLimitReady = false;
      console.error("Redis rate limit connection failed:", error?.message || error);
      return null;
    })
    .finally(() => {
      redisRateLimitInitPromise = null;
    });

  return redisRateLimitInitPromise;
}

async function incrementRedisRateLimit(key, windowMs) {
  const client = await getRedisRateLimitClient();
  if (!client) {
    return null;
  }

  const count = await client.incr(key);
  if (count === 1) {
    await client.pExpire(key, windowMs);
  }

  let ttlMs = await client.pTTL(key);
  if (ttlMs < 0) {
    ttlMs = windowMs;
    await client.pExpire(key, windowMs);
  }

  return {
    count,
    expiresAt: Date.now() + ttlMs,
  };
}

function getClientIp(req) {
  const forwarded = getHeaderValue(req.headers["x-forwarded-for"]);
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function rateLimit({ windowMs, max, keyPrefix, message }) {
  return async (req, res, next) => {
    try {
      const now = Date.now();
      const key = `${keyPrefix}:${getClientIp(req)}`;
      const redisEntry = await incrementRedisRateLimit(key, windowMs);

      if (redisEntry) {
        if (redisEntry.count > max) {
          const retryAfter = Math.max(1, Math.ceil((redisEntry.expiresAt - now) / 1000));
          res.set("Retry-After", String(retryAfter));
          return res.status(429).json({ ok: false, error: message });
        }

        return next();
      }

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
    } catch (err) {
      return next(err);
    }
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
    role: user.isSuperAdmin ? "super_admin" : "admin",
    status: user.status,
    joinDate: user.createdAt.toISOString(),
    lastActive: user.updatedAt ? user.updatedAt.toISOString() : null,
    source: "database",
    billingExemptReason: user.billingExemptReason || null,
  };
}

async function wipeTraderSideDataForUser(userId, options = {}) {
  const preserveChurnFeedback = Boolean(options.preserveChurnFeedback);
  const preserveDeletionAudits = Boolean(options.preserveDeletionAudits);

  await prisma.$transaction([
    ...(preserveChurnFeedback ? [] : [prisma.churnFeedback.deleteMany({ where: { userId } })]),
    ...(preserveDeletionAudits ? [] : [prisma.accountDeletionAudit.deleteMany({ where: { userId } })]),
    prisma.billingEvent.deleteMany({ where: { userId } }),
    prisma.analysisRun.deleteMany({ where: { userId } }),
    prisma.analysisSnapshot.deleteMany({ where: { userId } }),
    prisma.storedTrade.deleteMany({ where: { userId } }),
    prisma.apiKey.deleteMany({ where: { userId } }),
    prisma.brokerAccount.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        billingExempt: false,
        billingExemptReason: null,
        platformComped: false,
        platformCompedReason: null,
        appliedReferralCodeId: null,
        accountDiscountPercent: null,
        mlRunDiscountPercent: null,
        referralDiscountExpiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
    }),
  ]);
}

function getUserDisplayName(user) {
  const firstName = user?.profile?.firstName?.trim() || "";
  const lastName = user?.profile?.lastName?.trim() || "";
  return `${firstName} ${lastName}`.trim() || user?.email?.split("@")[0] || "Trader";
}

function calculateReferralExpiry(durationDays) {
  const now = new Date();
  return new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

function isInternalCompanyEmail(email) {
  return typeof email === "string" && internalCompanyEmails.has(email.trim().toLowerCase());
}

function getInternalCompanyEmailGroup(email) {
  if (!isInternalCompanyEmail(email)) {
    return null;
  }
  return "greenturtle-company";
}

function getNonDeletedUserWhere() {
  return {
    email: {
      not: {
        endsWith: "@deleted.local",
      },
    },
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

function getCachedSubscriptionAccess(userId) {
  const cached = subscriptionAccessCache.get(userId);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.checkedAt > subscriptionAccessCacheTtlMs) {
    subscriptionAccessCache.delete(userId);
    return null;
  }

  return cached;
}

function setCachedSubscriptionAccess(userId, decision) {
  subscriptionAccessCache.set(userId, {
    ...decision,
    checkedAt: Date.now(),
  });
}

function getSubscriptionAccessDecisionFromStripe(subscription) {
  if (!subscription) {
    return {
      allowed: false,
      status: "missing",
      reason: "Active subscription required to run ML analysis",
    };
  }

  if (subscription.pause_collection) {
    return {
      allowed: false,
      status: "paused",
      reason: "Your subscription is paused. Resume it in Settings to run the ML model again.",
    };
  }

  const status = typeof subscription.status === "string" ? subscription.status.toLowerCase() : "unknown";
  const allowedStatuses = new Set(["active", "trialing"]);

  if (!allowedStatuses.has(status)) {
    return {
      allowed: false,
      status,
      reason: "Your subscription is not active. Update billing in Settings to run the ML model again.",
    };
  }

  return {
    allowed: true,
    status: subscription.cancel_at_period_end ? "cancelling" : status,
    reason: null,
  };
}

function getSubscriptionAccessDecisionFromBillingEvent(billingEvent) {
  if (!billingEvent || typeof billingEvent !== "object") {
    return null;
  }

  const payloadObject = billingEvent?.payload?.data?.object;
  if (payloadObject && typeof payloadObject === "object") {
    if (payloadObject.pause_collection) {
      return {
        allowed: false,
        status: "paused",
        reason: "Your subscription is paused. Resume it in Settings to run the ML model again.",
      };
    }

    const rawStatus =
      typeof payloadObject.status === "string"
        ? payloadObject.status.toLowerCase()
        : typeof billingEvent.status === "string"
          ? billingEvent.status.toLowerCase()
          : "unknown";

    if (rawStatus === "active" || rawStatus === "trialing") {
      return {
        allowed: true,
        status: payloadObject.cancel_at_period_end ? "cancelling" : rawStatus,
        reason: null,
      };
    }

    if (["canceled", "incomplete", "incomplete_expired", "past_due", "unpaid"].includes(rawStatus)) {
      return {
        allowed: false,
        status: rawStatus,
        reason: "Your subscription is not active. Update billing in Settings to run the ML model again.",
      };
    }
  }

  const eventStatus = typeof billingEvent.status === "string" ? billingEvent.status.toUpperCase() : "";
  if (eventStatus === "ACTIVE") {
    return {
      allowed: true,
      status: "active",
      reason: null,
    };
  }

  if (eventStatus === "CANCELLED" || eventStatus === "INACTIVE") {
    return {
      allowed: false,
      status: eventStatus.toLowerCase(),
      reason: "Your subscription is not active. Update billing in Settings to run the ML model again.",
    };
  }

  return null;
}

function mapDeletionReasonToStripeFeedback(reason) {
  switch (String(reason || "").trim()) {
    case "too-expensive":
      return "too_expensive";
    case "missing-features":
      return "missing_features";
    case "technical-issues":
      return "low_quality";
    case "finished-testing":
      return "unused";
    case "other":
      return "other";
    default:
      return null;
  }
}

async function getOrCreateStripeCustomerId(user) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Stripe not configured");
  }

  const stripe = Stripe(stripeSecretKey);
  if (user?.stripeCustomerId) {
    return { stripe, stripeCustomerId: user.stripeCustomerId };
  }

  const customer = await stripe.customers.create({ email: user.email });
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return { stripe, stripeCustomerId: customer.id };
}

async function getStripeSubscriptionForUser(userId) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Stripe not configured");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.stripeSubscriptionId) {
    throw new Error("No active Stripe subscription is linked to this account");
  }

  const stripe = Stripe(stripeSecretKey);
  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
    expand: ["default_payment_method"],
  });

  return { stripe, user, subscription };
}

async function reportMlRunUsageToStripe(analysisRunId) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey || !analysisRunId) {
    return { ok: false, reason: "stripe_not_configured" };
  }

  const run = await prisma.analysisRun.findUnique({
    where: { id: analysisRunId },
    select: {
      id: true,
      mode: true,
      tradesAnalysed: true,
      cost: true,
      stripeBillingStatus: true,
      user: {
        select: {
          id: true,
          email: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          billingExempt: true,
          platformComped: true,
        },
      },
    },
  });

  if (!run) {
    return { ok: false, reason: "run_not_found" };
  }

  if (String(run.stripeBillingStatus || "").toUpperCase() === "REPORTED") {
    return { ok: true, skipped: true };
  }

  if (!run.user || isBillingExemptUser(run.user) || isPlatformCompedUser(run.user) || !run.cost || run.cost <= 0) {
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        stripeBillingStatus: "NO_CHARGE",
        stripeAmountPaid: 0,
      },
    });
    return { ok: true, skipped: true };
  }

  if (!run.user.stripeSubscriptionId) {
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        stripeBillingStatus: "DUE",
      },
    });
    return { ok: false, reason: "no_stripe_customer" };
  }

  const stripe = Stripe(stripeSecretKey);
  const perTradePriceId = process.env.STRIPE_PRICE_PER_TRADE;
  const usageQuantity = Math.max(0, Math.round(Number(run.tradesAnalysed) || 0));

  try {
    const subscription = await stripe.subscriptions.retrieve(run.user.stripeSubscriptionId, {
      expand: ["items.data.price"],
    });

    const usageItem =
      subscription.items?.data?.find((item) => {
        const priceId =
          item.price && typeof item.price === "object" && typeof item.price.id === "string"
            ? item.price.id
            : null;
        const usageType =
          item.price && typeof item.price === "object"
            ? item.price.recurring?.usage_type || null
            : null;
        return (perTradePriceId && priceId === perTradePriceId) || usageType === "metered";
      }) || null;

    if (!usageItem) {
      await prisma.analysisRun.update({
        where: { id: run.id },
        data: {
          stripeBillingStatus: "DUE",
        },
      });
      return { ok: false, reason: "no_metered_subscription_item" };
    }

    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        stripeBillingStatus: "REPORTING",
      },
    });

    const meterId =
      usageItem.price && typeof usageItem.price === "object"
        ? usageItem.price.recurring?.meter || null
        : null;

    if (meterId) {
      const meter = await stripe.billing.meters.retrieve(meterId);
      const customerPayloadKey = meter.customer_mapping?.event_payload_key || "stripe_customer_id";
      const valuePayloadKey = meter.value_settings?.event_payload_key || "value";

      await stripe.billing.meterEvents.create(
        {
          event_name: meter.event_name,
          payload: {
            [customerPayloadKey]: run.user.stripeCustomerId,
            [valuePayloadKey]: String(usageQuantity),
          },
          timestamp: Math.floor(Date.now() / 1000),
          identifier: `analysis-run-usage-${run.id}`,
        },
        {
          idempotencyKey: `analysis-run-usage-${run.id}`,
        },
      );
    } else {
      await stripe.subscriptionItems.createUsageRecord(
        usageItem.id,
        {
          quantity: usageQuantity,
          timestamp: Math.floor(Date.now() / 1000),
          action: "increment",
        },
        {
          idempotencyKey: `analysis-run-usage-${run.id}`,
        },
      );
    }

    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        stripeBillingStatus: "REPORTED",
        stripeInvoiceId: null,
        stripeAmountPaid: null,
        stripeBilledAt: null,
      },
    });

    return {
      ok: true,
      status: "REPORTED",
    };
  } catch (error) {
    console.error("Failed to report ML run usage to Stripe", error);
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        stripeBillingStatus: "REPORT_FAILED",
      },
    }).catch(() => {});
    return { ok: false, reason: "stripe_usage_report_failed" };
  }
}

async function assertMlAnalysisAccess(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      billingExempt: true,
      billingExemptReason: true,
      platformComped: true,
      platformCompedReason: true,
      stripeSubscriptionId: true,
      billingEvents: {
        where: {
          category: "subscription",
        },
        orderBy: { occurredAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (isBillingExemptUser(user)) {
    return;
  }

  if (!user.stripeSubscriptionId) {
    const error = new Error("Active subscription required to run ML analysis");
    error.statusCode = 403;
    throw error;
  }

  const latestSubscriptionEvent = Array.isArray(user.billingEvents) ? user.billingEvents[0] || null : null;
  const localDecision = getSubscriptionAccessDecisionFromBillingEvent(latestSubscriptionEvent);
  if (localDecision && !localDecision.allowed) {
    const error = new Error(localDecision.reason || "Active subscription required to run ML analysis");
    error.statusCode = 403;
    throw error;
  }

  if (localDecision && localDecision.allowed) {
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return;
  }

  const cachedDecision = getCachedSubscriptionAccess(userId);
  if (cachedDecision) {
    if (cachedDecision.allowed) {
      return;
    }
    const error = new Error(cachedDecision.reason || "Active subscription required to run ML analysis");
    error.statusCode = 403;
    throw error;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  const stripeDecision = getSubscriptionAccessDecisionFromStripe(subscription);
  setCachedSubscriptionAccess(userId, stripeDecision);

  if (!stripeDecision.allowed) {
    const error = new Error(
      stripeDecision.reason || "Active subscription required to run ML analysis"
    );
    error.statusCode = 403;
    throw error;
  }
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
    return null;
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
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTradeTimestampText(value) {
  const timestamp = parseTradeTimestamp(value);
  if (timestamp === null) {
    return typeof value === "string" ? value.trim() : "";
  }
  return new Date(timestamp).toISOString();
}

function normalizeTradeIdentityValue(value, decimals = null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return decimals === null ? String(value) : value.toFixed(decimals);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return decimals === null ? String(numeric) : numeric.toFixed(decimals);
    }
    return trimmed;
  }
  return "";
}

function sortTradesByRecency(trades) {
  return trades.slice().sort((a, b) => {
    const exitDiff = (parseTradeTimestamp(b?.exit_time) ?? 0) - (parseTradeTimestamp(a?.exit_time) ?? 0);
    if (exitDiff !== 0) return exitDiff;
    return (parseTradeTimestamp(b?.entry_time) ?? 0) - (parseTradeTimestamp(a?.entry_time) ?? 0);
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
    normalizeTradeIdentityValue(trade.symbol),
    normalizeTradeIdentityValue(trade.side),
    normalizeTradeTimestampText(trade.entry_time),
    normalizeTradeTimestampText(trade.exit_time),
    normalizeTradeIdentityValue(trade.entry_price, 8),
    normalizeTradeIdentityValue(trade.exit_price, 8),
    normalizeTradeIdentityValue(trade.volume, 4),
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
    const exitDiff = (parseTradeTimestamp(b.trade?.exit_time) ?? 0) - (parseTradeTimestamp(a.trade?.exit_time) ?? 0);
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
  const rawTrade = storedTrade.rawTrade && typeof storedTrade.rawTrade === "object" ? storedTrade.rawTrade : {};
  const entryTimeLocal =
    typeof rawTrade.entry_time === "string" && rawTrade.entry_time.trim()
      ? rawTrade.entry_time.trim()
      : storedTrade.entryTime.toISOString();
  const exitTimeLocal =
    typeof rawTrade.exit_time === "string" && rawTrade.exit_time.trim()
      ? rawTrade.exit_time.trim()
      : storedTrade.exitTime.toISOString();
  return {
    trade_identity: storedTrade.tradeIdentity,
    trade_id: storedTrade.externalTradeId,
    entry_time: storedTrade.entryTime.toISOString(),
    exit_time: storedTrade.exitTime.toISOString(),
    entry_time_local: entryTimeLocal,
    exit_time_local: exitTimeLocal,
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
    date: storedTrade.entryTime.toISOString().slice(0, 10),
    pair: storedTrade.symbol || "Trade",
    direction: storedTrade.side === "SHORT" ? "short" : "long",
    entryPrice: storedTrade.entryPrice,
    exitPrice: storedTrade.exitPrice,
    stopLoss: storedTrade.stopLoss,
    takeProfit: storedTrade.takeProfit,
    entryTime: storedTrade.entryTime.toISOString().slice(11, 16),
    exitTime: storedTrade.exitTime.toISOString().slice(11, 16),
    duration: durationMinutes,
    exitType,
    result,
    rMultiple,
    notes: storedTrade.notes || "",
    emotions: storedTrade.emotions || "",
    lessonsLearned: storedTrade.lessonsLearned || "",
    marketConditions: storedTrade.session || "",
  };
}

function buildJournalEntryMatchKey(entry) {
  return [
    String(entry.pair || "").trim().toUpperCase(),
    String(entry.direction || "").trim().toLowerCase(),
    String(entry.date || ""),
    String(entry.entryTime || ""),
    String(entry.exitTime || ""),
    Number(entry.entryPrice || 0).toFixed(5),
    Number(entry.exitPrice || 0).toFixed(5),
  ].join("|");
}

const ANALYSIS_DATA_DELETED_MARKER = "__REPORT_DATA_DELETED__";

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
    error: run.error === ANALYSIS_DATA_DELETED_MARKER ? null : run.error || null,
    deletedData: run.error === ANALYSIS_DATA_DELETED_MARKER,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
  };
}

async function estimateAnalysisCost(userId, tradesAnalysed) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mlRunDiscountPercent: true,
      referralDiscountExpiresAt: true,
      billingExempt: true,
    },
  });
  if (isBillingExemptUser(user)) {
    return 0;
  }
  const baseCost = Math.max(0, Number(tradesAnalysed) || 0) * 0.2;
  const discounts = getActiveUserDiscounts(user);
  const discountedCost = baseCost * (1 - discounts.mlRunDiscountPercent / 100);
  return Number(Math.max(0, discountedCost).toFixed(2));
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

function getIntegrationEncryptionKey() {
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("APP_ENCRYPTION_KEY or JWT_SECRET is required for encrypted integrations");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSecret(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmedValue = value.trim();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getIntegrationEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(trimmedValue, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
    trimmedValue.slice(-4),
  ].join(":");
}

function decryptSecret(payload) {
  if (typeof payload !== "string" || !payload.trim()) {
    return "";
  }

  const [version, ivText, tagText, encryptedText] = payload.split(":");
  if (version !== "v1" || !ivText || !tagText || !encryptedText) {
    throw new Error("Invalid encrypted secret payload");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getIntegrationEncryptionKey(),
    Buffer.from(ivText, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

async function fetchTrading212Json(path, { apiKey, apiSecret, environment = "live" }) {
  const baseUrl =
    environment === "demo"
      ? "https://demo.trading212.com"
      : "https://live.trading212.com";
  const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authHeader}`,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || `Trading 212 request failed with ${response.status}`,
    );
  }

  return payload;
}

async function fetchTrading212AccountInfo({ apiKey, apiSecret, environment = "live" }) {
  return fetchTrading212Json("/api/v0/equity/account/info", {
    apiKey,
    apiSecret,
    environment,
  });
}

async function fetchTrading212HistoricalOrders({ apiKey, apiSecret, environment = "live", limit = 50 } = {}) {
  const items = [];
  let nextPagePath = `/api/v0/equity/history/orders?limit=${Math.max(1, Math.min(50, Number(limit) || 50))}`;
  let pageCount = 0;

  while (nextPagePath && pageCount < 200) {
    const payload = await fetchTrading212Json(nextPagePath, {
      apiKey,
      apiSecret,
      environment,
    });

    if (Array.isArray(payload?.items)) {
      items.push(...payload.items);
    }

    nextPagePath =
      typeof payload?.nextPagePath === "string" && payload.nextPagePath.trim()
        ? payload.nextPagePath.trim()
        : null;
    pageCount += 1;
  }

  return items;
}

async function ensureTrading212BrokerAccount(userId, { accountNumber = "TRADING212" } = {}) {
  const existing = await prisma.brokerAccount.findFirst({
    where: {
      userId,
      platform: "TRADING212",
      isActive: true,
    },
    select: { id: true },
  });

  if (existing?.id) {
    return existing.id;
  }

  const created = await prisma.brokerAccount.create({
    data: {
      userId,
      platform: "TRADING212",
      brokerName: "Trading 212",
      accountNumber: accountNumber || "TRADING212",
      label: "Trading 212",
      isActive: true,
    },
    select: { id: true },
  });

  return created.id;
}

const {
  formatReferralCode,
  ensureTraderOwnedReferralCode,
  isBillingExemptUser,
  isPlatformCompedUser,
  getActiveReferralCode,
  resolveDiscountCode,
  getActiveUserDiscounts,
  buildStripeAccountDiscountConfig,
  toCurrencyAmount,
  stripeTimestampToDate,
  getSubscriptionStatusForDisplayFromStripe,
  findUserByStripeLink,
  getStripeBillingEventData,
  getStripeInvoiceRevenueBreakdown,
  getBillingEventRevenueBreakdown,
  persistStripeBillingEvent,
  formatStripePaymentMethod,
  buildUserBillingSummary,
} = createBillingReferralHelpers({
  prisma,
  Stripe,
  env: process.env,
  getSubscriptionAccessDecisionFromStripe,
});

const {
  buildUserAccountState,
  buildAnalysisOptionsPayload,
  buildAccountStatePayload,
} = createAccountStateHelpers({
  prisma,
  buildUserBillingSummary,
  formatReferralCode,
  ensureTraderOwnedReferralCode,
  getActiveUserDiscounts,
  syncStoredTradesFromMt,
  getPendingStoredTradeCount,
  formatAnalysisRun,
  storedTradeToJournalEntry,
});

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

function buildEaCommonSource({
  propertyLine,
  apiBaseUrl,
  apiKey,
  brokerAccountId,
  heartbeatSource,
  platformSpecificSource,
}) {
  return `//+------------------------------------------------------------------+
//|                          GreenTurtleTradesEA.${heartbeatSource === "mt4_ea" ? "mq4" : "mq5"}                 |
//+------------------------------------------------------------------+
${propertyLine}

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
   body += "\\"source\\":\\"${heartbeatSource}\\",";
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

${platformSpecificSource}

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

function buildMt4PlatformSpecificSource() {
  return `bool ComputeTradeExcursions(string symbol, datetime entryTime, datetime exitTime, bool isLong, double entryPrice, double &mfe, double &mae)
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
}`;
}

function buildMt5PlatformSpecificSource() {
  return `ulong FindEntryDeal(ulong positionId, datetime exitTime)
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
}`;
}

function buildMt4EaSource({ apiBaseUrl, apiKey, brokerAccountId }) {
  return buildEaCommonSource({
    propertyLine: "#property strict",
    apiBaseUrl,
    apiKey,
    brokerAccountId,
    heartbeatSource: "mt4_ea",
    platformSpecificSource: buildMt4PlatformSpecificSource(),
  });
}

function buildMt5EaSource({ apiBaseUrl, apiKey, brokerAccountId }) {
  return buildEaCommonSource({
    propertyLine: '#property version   "1.00"',
    apiBaseUrl,
    apiKey,
    brokerAccountId,
    heartbeatSource: "mt5_ea",
    platformSpecificSource: buildMt5PlatformSpecificSource(),
  });
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

function normalizeOrigin(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function parseOriginSuffixes(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const allowAllOrigins = process.env.CORS_ALLOW_ALL_ORIGINS === "true";
const allowRailwayAppOrigins = process.env.ALLOW_RAILWAY_APP_ORIGINS === "true";
const allowedOriginSuffixes = parseOriginSuffixes(process.env.CORS_ALLOWED_ORIGIN_SUFFIXES);

const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.APP_URL,
      process.env.FRONTEND_URL,
      process.env.PUBLIC_FRONTEND_URL,
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  )
);

function isAllowedOrigin(origin) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  if (allowAllOrigins) {
    return true;
  }

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  let parsedOrigin;
  try {
    parsedOrigin = new URL(normalizedOrigin);
  } catch {
    return false;
  }

  const hostname = parsedOrigin.hostname.toLowerCase();

  if (allowRailwayAppOrigins && parsedOrigin.protocol === "https:" && hostname.endsWith(".up.railway.app")) {
    return true;
  }

  if (allowedOriginSuffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))) {
    return true;
  }

  return false;
}

// CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookies = parseCookies(req);
  const hasSessionCookie = Boolean(cookies[getSessionCookieName()]);
  if (!hasSessionCookie) {
    return next();
  }

  const trustedOrigin = getTrustedRequestOrigin(req, allowedOrigins, isAllowedOrigin);
  if (!trustedOrigin) {
    return res.status(403).json({ ok: false, error: "Blocked by CSRF protection" });
  }

  return next();
});

registerStripeWebhookRoute(app, {
  express,
  Stripe,
  env: process.env,
  persistStripeBillingEvent,
});

// Parse JSON bodies
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

registerPublicRoutes(app, {
  prisma,
  sendEmail,
  env: process.env,
  brokerPlatforms,
  experienceLevels,
});

registerAccountRoutes(app, {
  prisma,
  bcrypt,
  crypto,
  Stripe,
  env: process.env,
  sendEmail,
  rateLimit,
  authRequired,
  adminRequired,
  staffPortalRoles,
  resolveDiscountCode,
  isInternalCompanyEmail,
  isBillingExemptUser,
  calculateReferralExpiry,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  buildUserAccountState,
  buildUserBillingSummary,
  getUserDisplayName,
  wipeTraderSideDataForUser,
  getStripeInvoiceRevenueBreakdown,
  mapDeletionReasonToStripeFeedback,
});

registerBillingRoutes(app, {
  prisma,
  authRequired,
  adminRequired,
  staffWriteRequired,
  Stripe,
  env: process.env,
  getUserDisplayName,
  formatReferralCode,
  resolveDiscountCode,
  buildUserBillingSummary,
  getOrCreateStripeCustomerId,
  getStripeSubscriptionForUser,
  setCachedSubscriptionAccess,
  getSubscriptionAccessDecisionFromStripe,
  getSubscriptionStatusForDisplayFromStripe,
  stripeTimestampToDate,
});

registerAdminRoutes(app, {
  prisma,
  bcrypt,
  crypto,
  Stripe,
  sendEmail,
  env: process.env,
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
});

registerIntegrationRoutes(app, {
  prisma,
  bcrypt,
  crypto,
  authRequired,
  apiKeyRequired,
  eaEventHandler,
  brokerPlatforms,
  getOrCreateEaBrokerAccount,
  issueManagedEaApiKey,
  getPublicApiBaseUrl,
  buildEaSource,
  buildEaConnectionStatus,
  toIsoOrNull,
  encryptSecret,
});

// ---------------------------------------------------------------------------
// Turtle Analytics — trigger ML pipeline and poll results
// ---------------------------------------------------------------------------

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

registerAnalyticsRoutes(app, {
  prisma,
  authRequired,
  crypto,
  fetch,
  pythonServiceUrl: PYTHON_SERVICE_URL,
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
  analysisDataDeletedMarker: ANALYSIS_DATA_DELETED_MARKER,
  decryptSecret,
  fetchTrading212AccountInfo,
  fetchTrading212HistoricalOrders,
  buildTrading212TradesFromHistory,
  ensureTrading212BrokerAccount,
});

registerPlatformRoutes(app, {
  prisma,
  Stripe,
  authRequired,
  env: process.env,
  isBillingExemptUser,
  resolveDiscountCode,
  calculateReferralExpiry,
  buildStripeAccountDiscountConfig,
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

module.exports = app;
