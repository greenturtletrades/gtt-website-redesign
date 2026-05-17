function registerIntegrationRoutes(app, {
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
}) {
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

  app.patch("/api/trading212/config", authRequired, async (req, res, next) => {
    try {
      const environment = req.body?.environment === "demo" ? "demo" : "live";
      const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
      const apiSecret = typeof req.body?.apiSecret === "string" ? req.body.apiSecret.trim() : "";
      const clearConfig = !apiKey && !apiSecret;

      if (!clearConfig && (!apiKey || !apiSecret)) {
        return res.status(400).json({
          ok: false,
          error: "Both Trading 212 API key and API secret are required.",
        });
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: clearConfig
          ? {
              trading212ApiKeyEncrypted: null,
              trading212ApiSecretEncrypted: null,
              trading212Environment: null,
            }
          : {
              trading212ApiKeyEncrypted: encryptSecret(apiKey),
              trading212ApiSecretEncrypted: encryptSecret(apiSecret),
              trading212Environment: environment,
            },
        select: {
          trading212ApiKeyEncrypted: true,
          trading212ApiSecretEncrypted: true,
          trading212Environment: true,
        },
      });

      return res.json({
        ok: true,
        trading212: {
          configured: Boolean(updated.trading212ApiKeyEncrypted && updated.trading212ApiSecretEncrypted),
          apiKeyLast4: clearConfig ? null : apiKey.slice(-4),
          environment: updated.trading212Environment || "live",
        },
      });
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
}

module.exports = {
  registerIntegrationRoutes,
};
