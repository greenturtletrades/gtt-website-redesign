const crypto = require("crypto");

const LEADERBOARD_MINIMUM_TRADES = 10;

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

function calculateAverageRiskPercent(trades) {
  const riskPercents = trades
    .map((trade) => {
      if (typeof trade.entryPrice !== "number" || trade.entryPrice <= 0 || typeof trade.stopLoss !== "number") {
        return null;
      }

      return (Math.abs(trade.entryPrice - trade.stopLoss) / trade.entryPrice) * 100;
    })
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  if (!riskPercents.length) {
    return 0;
  }

  return riskPercents.reduce((sum, value) => sum + value, 0) / riskPercents.length;
}

function resolveRiskLevel(riskPerTradePercent) {
  if (riskPerTradePercent <= 1) {
    return "Low";
  }

  if (riskPerTradePercent <= 1.5) {
    return "Medium";
  }

  return "High";
}

function classifySymbolMarket(symbol) {
  const normalized = String(symbol || "").trim().toUpperCase();
  if (!normalized) {
    return "Mixed";
  }

  if (/^(XAU|XAG|USOIL|UKOIL|WTI|BRENT|NGAS)/.test(normalized)) {
    return "Commodities";
  }

  if (
    /^(US30|US100|NAS100|SPX500|GER40|UK100|JP225|AUS200|FRA40|EU50|DJI|NDX|SPX)/.test(normalized)
  ) {
    return "Indices";
  }

  if (/^[A-Z]{6}$/.test(normalized)) {
    return "FX";
  }

  return "Stocks";
}

function resolveDominantMarket(trades) {
  const counts = new Map();

  for (const trade of trades) {
    const market = classifySymbolMarket(trade.symbol);
    counts.set(market, (counts.get(market) || 0) + 1);
  }

  const sortedMarkets = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return sortedMarkets[0]?.[0] || "Mixed";
}

function calculateWinRate(trades) {
  if (!trades.length) {
    return 0;
  }

  const winningTrades = trades.filter((trade) => calculateTradeRMultiple(trade) > 0).length;
  return (winningTrades / trades.length) * 100;
}

function calculateTotalR(trades) {
  return trades.reduce((sum, trade) => sum + calculateTradeRMultiple(trade), 0);
}

function calculatePercentileRanks(values, { descending = true } = {}) {
  if (!values.length) {
    return [];
  }

  if (values.length === 1) {
    return [100];
  }

  const sorted = [...values].sort((left, right) => (
    descending ? right.value - left.value : left.value - right.value
  ));
  const rankMap = new Map();

  sorted.forEach((item, index) => {
    rankMap.set(item.id, 100 - (index / (sorted.length - 1)) * 100);
  });

  return values.map((item) => rankMap.get(item.id) || 0);
}

function registerPublicRoutes(app, {
  prisma,
  sendEmail,
  env,
  brokerPlatforms,
  experienceLevels,
}) {
  app.get("/api/public/leaderboard", async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: "TRADER",
          status: "ACTIVE",
          leaderboardOptIn: true,
        },
        select: {
          id: true,
          leaderboardDisplayName: true,
          leaderboardPublishedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          analysisSnapshots: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
            select: {
              updatedAt: true,
              totalR: true,
              winRate: true,
            },
          },
          storedTrades: {
            orderBy: {
              exitTime: "desc",
            },
            select: {
              symbol: true,
              side: true,
              entryPrice: true,
              exitPrice: true,
              stopLoss: true,
              updatedAt: true,
            },
          },
        },
      });

      const eligibleRows = users
        .map((user) => {
          if (user.storedTrades.length < LEADERBOARD_MINIMUM_TRADES) {
            return null;
          }

          const latestSnapshot = user.analysisSnapshots[0] || null;
          const tradeCount = user.storedTrades.length;
          const averageRiskPercent = calculateAverageRiskPercent(user.storedTrades);
          const totalR = typeof latestSnapshot?.totalR === "number"
            ? latestSnapshot.totalR
            : calculateTotalR(user.storedTrades);
          const winRate = typeof latestSnapshot?.winRate === "number"
            ? latestSnapshot.winRate
            : calculateWinRate(user.storedTrades);
          const latestTradeUpdatedAt = user.storedTrades[0]?.updatedAt || null;
          const lastUpdatedAt = latestSnapshot?.updatedAt || latestTradeUpdatedAt || user.leaderboardPublishedAt || null;
          const fallbackName = [user.profile?.firstName, user.profile?.lastName]
            .filter((value) => typeof value === "string" && value.trim())
            .join(" ")
            .trim();

          return {
            id: user.id,
            displayName: user.leaderboardDisplayName || fallbackName || "Trader",
            market: resolveDominantMarket(user.storedTrades),
            totalTrades: tradeCount,
            averageRiskPercent,
            riskLevel: resolveRiskLevel(averageRiskPercent),
            totalR,
            winRate,
            lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
            source: latestSnapshot ? "analysis" : "journal",
          };
        })
        .filter(Boolean);

      const performancePercentiles = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: row.totalR })),
        { descending: true },
      );
      const riskScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: row.averageRiskPercent })),
        { descending: false },
      );
      const tradeScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: row.totalTrades })),
        { descending: true },
      );
      const stabilityScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: row.winRate })),
        { descending: true },
      );

      const leaderboard = eligibleRows
        .map((row, index) => ({
          ...row,
          percentilePnl: Math.round(performancePercentiles[index]),
          score:
            performancePercentiles[index] * 0.35 +
            riskScores[index] * 0.30 +
            tradeScores[index] * 0.20 +
            stabilityScores[index] * 0.15,
        }))
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          return right.percentilePnl - left.percentilePnl;
        })
        .map((row, index) => ({
          rank: index + 1,
          id: row.id,
          name: row.displayName,
          market: row.market,
          percentilePnl: row.percentilePnl,
          winRate: typeof row.winRate === "number" ? Number((row.winRate * 100).toFixed(1)) : null,
          riskPerTradePercent: Number(row.averageRiskPercent.toFixed(2)),
          totalTrades: row.totalTrades,
          riskLevel: row.riskLevel,
          lastUpdatedAt: row.lastUpdatedAt,
          source: row.source,
        }));

      return res.json({
        ok: true,
        minimumTradeCount: LEADERBOARD_MINIMUM_TRADES,
        leaderboard,
      });
    } catch (err) {
      return next(err);
    }
  });

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
      const statusLookupToken = crypto.randomBytes(24).toString("hex");

      const application = await prisma.traderApplication.upsert({
        where: { email: normalizedEmail },
        update: {
          fullName: fullName.trim(),
          statusLookupToken,
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
          statusLookupToken,
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
        replyTo: env.EMAIL_NOTIFY_TO || env.EMAIL_FROM,
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
                <p style="margin: 0 0 8px;"><strong>Broker:</strong> ${
                  typeof brokerName === "string" && brokerName.trim()
                    ? brokerName.trim()
                    : "Not provided"
                }</p>
                <p style="margin: 0;"><strong>Application status token:</strong> ${statusLookupToken}</p>
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
          `Application status token: ${statusLookupToken}`,
          "Keep this token to check your application status later without exposing your email address.",
          "",
          "Best regards,",
          "Green Turtle Trades",
        ].join("\n"),
      }).catch((e) => console.error("Trader application confirmation email failed:", e));

      const notifyTo = env.EMAIL_NOTIFY_TO;

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

      return res.json({
        ok: true,
        id: application.id,
        status: application.status,
        statusLookupToken,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/trader/application", async (req, res, next) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ ok: false, error: "Application token is required" });
      }

      const application = await prisma.traderApplication.findUnique({
        where: { statusLookupToken: token.trim() },
        select: { status: true, rejectionReason: true },
      });

      if (!application) {
        return res.status(404).json({ ok: false, error: "Application not found" });
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

      const notifyTo = env.EMAIL_NOTIFY_TO;

      sendEmail({
        to: normalizedEmail,
        replyTo: notifyTo || env.EMAIL_FROM,
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

      await prisma.contactMessage.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          subject: normalizedSubject,
          message: normalizedMessage,
        },
      });

      const notifyTo = env.EMAIL_NOTIFY_TO;

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
        replyTo: notifyTo || env.EMAIL_FROM,
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
}

module.exports = {
  registerPublicRoutes,
};
