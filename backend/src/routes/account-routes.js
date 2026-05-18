function registerAccountRoutes(app, {
  prisma,
  bcrypt,
  crypto,
  Stripe,
  env,
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
  getUserDisplayName,
  wipeTraderSideDataForUser,
  getStripeInvoiceRevenueBreakdown,
  mapDeletionReasonToStripeFeedback,
}) {
  function isEnvAdminSession(req) {
    return req.user?.id === "env-admin" && req.user?.role === "ADMIN";
  }

  function buildEnvAdminUserPayload() {
    const envEmail = (env.ADMIN_EMAIL || "greenturtlrtraders26@gmail.com").trim().toLowerCase();
    return {
      id: "env-admin",
      email: envEmail,
      role: "ADMIN",
      isSuperAdmin: true,
      status: "ACTIVE",
    };
  }

  function splitFullName(value) {
    const trimmedName = typeof value === "string" ? value.trim() : "";
    const [firstName, ...restName] = trimmedName ? trimmedName.split(/\s+/) : [];
    return {
      trimmedName,
      firstName: firstName || null,
      lastName: restName.join(" ") || null,
    };
  }

  function normalizeOptionalTrimmedString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function getAppUrl() {
    return (
      normalizeOptionalTrimmedString(env.APP_URL) ||
      normalizeOptionalTrimmedString(env.FRONTEND_URL) ||
      normalizeOptionalTrimmedString(env.PUBLIC_FRONTEND_URL) ||
      "http://localhost:5173"
    );
  }

  async function buildPendingMlChargeSummary(userId, user) {
    const outstandingMlCharges = await prisma.analysisRun.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        cost: {
          gt: 0,
        },
        OR: [
          { stripeBillingStatus: null },
          { stripeBillingStatus: { notIn: ["PAID", "NO_CHARGE", "REPORTED"] } },
        ],
      },
      _sum: {
        cost: true,
      },
    });

    let outstandingMlChargeTotal = Number(outstandingMlCharges._sum.cost || 0);

    if (user.stripeSubscriptionId && env.STRIPE_SECRET_KEY) {
      try {
        const stripe = Stripe(env.STRIPE_SECRET_KEY);
        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
          customer: user.stripeCustomerId || undefined,
          subscription: user.stripeSubscriptionId,
          expand: ["lines.data.price"],
        });
        outstandingMlChargeTotal = getStripeInvoiceRevenueBreakdown(upcomingInvoice).mlRevenue;
      } catch (error) {
        console.error("Unable to load Stripe upcoming invoice while deleting account", error);
      }
    }

    return outstandingMlChargeTotal;
  }

  async function createAccountDeletionChurnFeedback(userId, user, { reason, feedback, plan }) {
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return null;
    }

    return prisma.churnFeedback.create({
      data: {
        userId,
        reason: reason.trim(),
        feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : null,
        plan: typeof plan === "string" && plan.trim() ? plan.trim() : null,
        userEmailSnapshot: user.email,
        userNameSnapshot: getUserDisplayName(user),
        source: "account-delete",
      },
    });
  }

  app.post("/api/auth/register", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyPrefix: "auth-register",
    message: "Too many registration attempts. Please try again later.",
  }), async (req, res) => {
    try {
      const { email, password, name, metaTraderUsername, brokerName, referralCode } = req.body || {};

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
      const { trimmedName, firstName, lastName } = splitFullName(name);
      const normalizedMetaTraderUsername = normalizeOptionalTrimmedString(metaTraderUsername);
      const normalizedBrokerName = normalizeOptionalTrimmedString(brokerName);
      const normalizedReferralCode =
        typeof referralCode === "string" && referralCode.trim()
          ? referralCode.trim().toUpperCase()
          : "";
      const resolvedDiscountCode = normalizedReferralCode
        ? await resolveDiscountCode(normalizedReferralCode)
        : { type: "none" };
      const appliedReferralCode =
        resolvedDiscountCode.type === "referral" ? resolvedDiscountCode.referralCode : null;

      if (normalizedReferralCode && resolvedDiscountCode.type === "invalid") {
        return res.status(400).json({ ok: false, error: "Referral code is invalid or inactive" });
      }

      const referralDiscountExpiresAt = appliedReferralCode
        ? calculateReferralExpiry(appliedReferralCode.durationDays)
        : null;
      const billingExempt = isInternalCompanyEmail(normalizedEmail);

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          billingExempt,
          billingExemptReason: billingExempt ? "Internal Green Turtle Trades company account" : null,
          appliedReferralCodeId: appliedReferralCode?.id || null,
          accountDiscountPercent: appliedReferralCode?.accountDiscountPercent ?? null,
          mlRunDiscountPercent: appliedReferralCode?.mlRunDiscountPercent ?? null,
          referralDiscountExpiresAt,
          profile: trimmedName
            ? {
                create: {
                  firstName,
                  lastName,
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
      setSessionCookie(res, token);

      return res.json({
        ok: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        referralApplied: appliedReferralCode
          ? {
              code: appliedReferralCode.code,
              accountDiscountPercent: appliedReferralCode.accountDiscountPercent,
              mlRunDiscountPercent: appliedReferralCode.mlRunDiscountPercent,
              expiresAt: referralDiscountExpiresAt ? referralDiscountExpiresAt.toISOString() : null,
            }
          : null,
        billingExempt,
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

      const sessionRole =
        user.role === "ADMIN"
          ? isBillingExemptUser(user)
            ? "TRADER"
            : null
          : user.role;

      if (!sessionRole) {
        return res.status(403).json({ ok: false, error: "Use the admin login for this account" });
      }

      const token = signToken(user, sessionRole);
      setSessionCookie(res, token);

      return res.json({
        ok: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          role: sessionRole,
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
      const envEmail = env.ADMIN_EMAIL || "greenturtlrtraders26@gmail.com";
      const envPassword = env.ADMIN_PASSWORD;
      const allowEnvAdminLogin = env.ENABLE_ENV_ADMIN_LOGIN === "true";

      if (
        allowEnvAdminLogin &&
        envEmail &&
        envPassword &&
        normalizedEmail === envEmail.trim().toLowerCase() &&
        password === envPassword
      ) {
        const token = signToken({ id: "env-admin", role: "ADMIN", isSuperAdmin: true });
        setSessionCookie(res, token);

        return res.json({
          ok: true,
          token,
          user: buildEnvAdminUserPayload(),
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
        setSessionCookie(res, token);

        return res.json({
          ok: true,
          token,
          mustChangePassword: adminUser.status === "PENDING",
          user: {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            isSuperAdmin: Boolean(adminUser.isSuperAdmin),
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

  app.post("/api/admin/forgot-password", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "admin-forgot-password",
    message: "Too many password reset requests. Please try again later.",
  }), async (req, res, next) => {
    try {
      const { email } = req.body || {};
      if (!email || typeof email !== "string") {
        return res.status(400).json({ ok: false, error: "Email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const adminUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          role: {
            in: Array.from(staffPortalRoles),
          },
        },
        select: { id: true, email: true, status: true },
      });

      if (adminUser && adminUser.status !== "DISABLED") {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: adminUser.id },
          data: { passwordResetToken: tokenHash, passwordResetExpiresAt: expiresAt },
        });

        const appUrl = getAppUrl().replace(/\/+$/, "");
        const resetUrl = `${appUrl}/admin?reset=${rawToken}&resetRole=admin`;

        return sendEmail({
          to: adminUser.email,
          subject: "Reset your Green Turtle Trades admin password",
          html: `
            <p>Hi,</p>
            <p>We received a request to reset your admin password. Click the link below to choose a new one:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
            <p>Green Turtle Trades</p>
          `,
          text: `Reset your admin password: ${resetUrl}\n\nThis link expires in 1 hour.`,
        }).catch(() => {}).then(() => res.json({ ok: true }));
      }

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/auth/logout", authRequired, async (req, res, next) => {
    try {
      clearSessionCookie(res);
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/auth/forgot-password", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: "forgot-password",
    message: "Too many password reset requests. Please try again later.",
  }), async (req, res, next) => {
    try {
      const { email } = req.body || {};
      if (!email || typeof email !== "string") {
        return res.status(400).json({ ok: false, error: "Email is required" });
      }
      const normalizedEmail = email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, role: true },
      });

      if (user && user.role === "TRADER") {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: { passwordResetToken: tokenHash, passwordResetExpiresAt: expiresAt },
        });

        const appUrl = getAppUrl();
        const resetUrl = `${appUrl}?reset=${rawToken}`;

        return sendEmail({
          to: user.email,
          subject: "Reset your Green Turtle Trades password",
          html: `
            <p>Hi,</p>
            <p>We received a request to reset your password. Click the link below to choose a new one:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
            <p>Green Turtle Trades</p>
          `,
          text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
        }).catch(() => {}).then(() => res.json({ ok: true }));
      }

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/auth/reset-password", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: "reset-password",
    message: "Too many reset attempts. Please try again later.",
  }), async (req, res, next) => {
    try {
      const { token, password } = req.body || {};
      if (!token || typeof token !== "string") {
        return res.status(400).json({ ok: false, error: "Reset token is required" });
      }
      if (!password || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ ok: false, error: "Password must be at least 8 characters" });
      }

      const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: tokenHash,
          passwordResetExpiresAt: { gt: new Date() },
        },
        select: { id: true },
      });

      if (!user) {
        return res.status(400).json({ ok: false, error: "Reset link is invalid or has expired" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
      });

      return res.json({ ok: true });
    } catch (err) {
      return next(err);
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

  app.get("/api/me", authRequired, async (req, res, next) => {
    try {
      if (isEnvAdminSession(req)) {
        return res.json({
          ok: true,
          user: {
            ...buildEnvAdminUserPayload(),
            profile: null,
          },
        });
      }

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
          role: req.user?.role || user.role,
          isSuperAdmin: Boolean(user.isSuperAdmin),
          status: user.status,
          profile: user.profile,
        },
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/me/account-state", authRequired, async (req, res, next) => {
    try {
      if (isEnvAdminSession(req)) {
        return res.json({
          ok: true,
          account: {
            ...buildEnvAdminUserPayload(),
            plan: null,
            profile: null,
            billing: null,
          },
        });
      }

      const payload = await buildUserAccountState(req.user.id, req.user?.role || null);
      if (!payload) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      return res.json(payload);
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

      const { firstName, lastName } = splitFullName(fullName !== undefined ? fullName : "");
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...data,
          ...(fullName !== undefined
            ? user.profile
              ? {
                  profile: {
                    update: {
                      firstName,
                      lastName,
                    },
                  },
                }
              : {
                  profile: {
                    create: {
                      firstName,
                      lastName,
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
      const { reason, feedback, plan, confirmOutstandingMlCharge } = req.body || {};
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          role: true,
          isSuperAdmin: true,
          billingExempt: true,
          billingExemptReason: true,
          brokerAccounts: {
            select: { id: true },
            take: 1,
          },
          apiKeys: {
            select: { id: true },
            take: 1,
          },
          billingEvents: {
            where: {
              eventType: {
                in: ["invoice.paid", "invoice.payment_failed", "customer.subscription.created", "customer.subscription.updated"],
              },
            },
            take: 1,
            select: { id: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      if (user.role === "ADMIN" && req.user?.role === "TRADER") {
        if (reason && typeof reason === "string" && reason.trim()) {
          await createAccountDeletionChurnFeedback(req.user.id, user, { reason, feedback, plan });
        }

        await wipeTraderSideDataForUser(user.id, {
          preserveChurnFeedback: true,
        });

        return res.json({
          ok: true,
          softDeleted: false,
          traderSideWiped: true,
        });
      }

      const outstandingMlChargeTotal = await buildPendingMlChargeSummary(req.user.id, user);

      if (outstandingMlChargeTotal > 0 && !confirmOutstandingMlCharge) {
        return res.status(409).json({
          ok: false,
          error: `Deleting your account will stop future platform billing, but Stripe will first charge £${outstandingMlChargeTotal.toFixed(2)} for unpaid ML usage before the account is fully closed.`,
          requiresFinalBillingConfirmation: true,
          outstandingMlChargeTotal: Number(outstandingMlChargeTotal.toFixed(2)),
        });
      }

      if (outstandingMlChargeTotal > 0 && !user.stripeSubscriptionId) {
        return res.status(409).json({
          ok: false,
          error: "This account has unpaid ML usage but no active Stripe subscription to bill it against. Please contact support before deleting the account.",
        });
      }

      if (user.stripeSubscriptionId) {
        if (!env.STRIPE_SECRET_KEY) {
          return res.status(409).json({
            ok: false,
            error: "Stripe billing must be configured before this account can be deleted safely.",
          });
        }

        try {
          const stripe = Stripe(env.STRIPE_SECRET_KEY);
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (subscription && subscription.status !== "canceled") {
            const canceledSubscription = await stripe.subscriptions.cancel(user.stripeSubscriptionId, {
              invoice_now: true,
              prorate: false,
              cancellation_details: {
                feedback: mapDeletionReasonToStripeFeedback(reason) || undefined,
                comment: typeof feedback === "string" && feedback.trim() ? feedback.trim() : undefined,
              },
              expand: ["latest_invoice.payment_intent"],
            });

            const latestInvoiceRef = canceledSubscription.latest_invoice;
            const latestInvoice =
              latestInvoiceRef && typeof latestInvoiceRef === "object"
                ? latestInvoiceRef
                : latestInvoiceRef
                  ? await stripe.invoices.retrieve(latestInvoiceRef)
                  : null;

            if (
              latestInvoice &&
              typeof latestInvoice.amount_remaining === "number" &&
              latestInvoice.amount_remaining > 0 &&
              latestInvoice.status !== "paid"
            ) {
              const paidInvoice = await stripe.invoices.pay(latestInvoice.id);
              if (
                paidInvoice.status !== "paid" &&
                typeof paidInvoice.amount_remaining === "number" &&
                paidInvoice.amount_remaining > 0
              ) {
                return res.status(409).json({
                  ok: false,
                  error: "We stopped future platform billing, but could not collect the outstanding ML usage charge. Please update your billing method and try again.",
                });
              }
            }
          }
        } catch (error) {
          console.error("Failed to cancel Stripe subscription during account deletion", error);
          return res.status(409).json({
            ok: false,
            error: "Unable to stop Stripe billing for this account. Please try again or contact support.",
          });
        }
      }

      const deletedEmail = `deleted+${user.id}.${Date.now()}@deleted.local`;
      const replacementPasswordHash = await bcrypt.hash(crypto.randomUUID(), 10);
      const deletionChurnWrite =
        reason && typeof reason === "string" && reason.trim()
          ? createAccountDeletionChurnFeedback(req.user.id, user, { reason, feedback, plan })
          : null;

      await prisma.$transaction([
        prisma.apiKey.updateMany({
          where: { userId: req.user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        prisma.brokerAccount.updateMany({
          where: { userId: req.user.id, isActive: true },
          data: { isActive: false },
        }),
        prisma.accountDeletionAudit.create({
          data: {
            userId: req.user.id,
            previousEmail: user.email,
            deletedEmail,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId,
            hadBillingHistory: user.billingEvents.length > 0,
            hadBrokerAccounts: user.brokerAccounts.length > 0,
            hadApiKeys: user.apiKeys.length > 0,
            metadata: {
              deletedAt: new Date().toISOString(),
              deletionMode: "self-service-soft-delete",
              deletionReason: reason && typeof reason === "string" ? reason.trim() : null,
              deletionFeedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : null,
            },
          },
        }),
        ...(deletionChurnWrite ? [deletionChurnWrite] : []),
        prisma.user.update({
          where: { id: req.user.id },
          data: {
            email: deletedEmail,
            passwordHash: replacementPasswordHash,
            status: "DISABLED",
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            platformComped: false,
            platformCompedReason: null,
            appliedReferralCodeId: null,
            accountDiscountPercent: null,
            mlRunDiscountPercent: null,
            referralDiscountExpiresAt: null,
          },
        }),
      ]);

      clearSessionCookie(res);

      return res.json({ ok: true, softDeleted: true });
    } catch (err) {
      return next(err);
    }
  });
}

module.exports = {
  registerAccountRoutes,
};
