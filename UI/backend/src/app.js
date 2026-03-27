const http = require("http");
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
  if (!req.user || req.user.role !== "ADMIN") {
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

// CORS (dev)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
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
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};

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

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
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

app.post("/api/auth/login", async (req, res) => {
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

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ ok: false, error: "Password is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (
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
      where: { email: normalizedEmail, role: "ADMIN" },
    });

    if (adminUser) {
      const passwordValid = await bcrypt.compare(password, adminUser.passwordHash);

      if (!passwordValid) {
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
      }

      if (adminUser.status !== "ACTIVE") {
        return res.status(403).json({ ok: false, error: "Account disabled" });
      }

      const token = signToken(adminUser);

      return res.json({
        ok: true,
        token,
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

// EA ingestion
app.post(
  "/v1/ea/market/batch",
  apiKeyRequired,
  eaEventHandler("MARKET_BATCH")
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

/**
 * POST /api/analyse/csv
 *
 * Accepts a CSV file upload and pipes it directly to the Python service.
 * Returns: { ok: true, jobId: string }
 */
app.post("/api/analyse/csv", authRequired, (req, res, next) => {
  const pythonUrl = new URL(`${PYTHON_SERVICE_URL}/analyse/csv`);
  const pythonReq = http.request(
    {
      hostname: pythonUrl.hostname,
      port: parseInt(pythonUrl.port) || 8000,
      path: pythonUrl.pathname,
      method: "POST",
      headers: {
        "content-type": req.headers["content-type"],
        ...(req.headers["content-length"] && { "content-length": req.headers["content-length"] }),
      },
    },
    (pythonRes) => {
      let data = "";
      pythonRes.on("data", (chunk) => (data += chunk));
      pythonRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (pythonRes.statusCode !== 200) {
            return res.status(502).json({ ok: false, error: parsed.detail || "Analysis service error" });
          }
          return res.json({ ok: true, jobId: parsed.job_id });
        } catch (e) {
          return res.status(502).json({ ok: false, error: "Invalid response from analysis service" });
        }
      });
    }
  );
  pythonReq.on("error", next);
  req.pipe(pythonReq);
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
  try {
    const { tradeCount = 500, months = 12, mode = "trades" } = req.body || {};

    // 1. Fetch the user's broker accounts
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId: req.user.id, isActive: true },
      select: { id: true },
    });

    if (brokerAccounts.length === 0) {
      return res.status(400).json({ ok: false, error: "No active broker accounts found" });
    }

    const brokerAccountIds = brokerAccounts.map((b) => b.id);

    // 2. Calculate date range filter
    const dateTo = new Date();
    const dateFrom = mode === "months"
      ? new Date(dateTo.getTime() - months * 30 * 24 * 60 * 60 * 1000)
      : new Date(dateTo.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); // 5 years back, limit by tradeCount

    // 3. Fetch HISTORY_EXPORT events for these accounts
    const events = await prisma.eaEvent.findMany({
      where: {
        brokerAccountId: { in: brokerAccountIds },
        type: "HISTORY_EXPORT",
        receivedAt: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { receivedAt: "desc" },
      take: 50, // max 50 export batches
    });

    if (events.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "No trade history found. Please export your trade history from your EA first.",
      });
    }

    // 4. Extract and flatten trade records from event payloads
    //    The EA payload may be { trades: [...] } or an array directly
    let allTrades = [];
    for (const event of events) {
      const payload = event.payload;
      if (Array.isArray(payload)) {
        allTrades.push(...payload);
      } else if (payload && Array.isArray(payload.trades)) {
        allTrades.push(...payload.trades);
      }
    }

    if (allTrades.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Trade history events found but no trade records could be extracted from the payloads.",
      });
    }

    // 5. Apply trade count limit for "trades" mode
    if (mode === "trades" && allTrades.length > tradeCount) {
      allTrades = allTrades.slice(0, tradeCount);
    }

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
      return res.status(502).json({ ok: false, error: "Analysis service error: " + err });
    }

    const { job_id } = await pythonRes.json();
    return res.json({ ok: true, jobId: job_id });
  } catch (err) {
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
      return res.status(502).json({ ok: false, error: "Analysis service unavailable" });
    }

    const data = await pythonRes.json();

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
