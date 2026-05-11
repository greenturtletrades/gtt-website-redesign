function registerStripeWebhookRoute(app, {
  express,
  Stripe,
  env,
  persistStripeBillingEvent,
}) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res, next) => {
    try {
      const stripeSecretKey = env.STRIPE_SECRET_KEY;
      const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;

      if (!stripeSecretKey || !stripeWebhookSecret) {
        return res.status(500).send("Stripe webhook not configured");
      }

      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string" || !signature.trim()) {
        return res.status(400).send("Missing Stripe signature");
      }

      const stripe = Stripe(stripeSecretKey);
      const event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);

      if (
        event.type === "checkout.session.completed" ||
        event.type === "invoice.paid" ||
        event.type === "invoice.payment_failed" ||
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted"
      ) {
        await persistStripeBillingEvent(event);
      }

      return res.json({ received: true });
    } catch (err) {
      if (err?.type === "StripeSignatureVerificationError") {
        return res.status(400).send("Invalid Stripe signature");
      }
      return next(err);
    }
  });
}

function registerBillingRoutes(app, {
  prisma,
  authRequired,
  adminRequired,
  staffWriteRequired,
  Stripe,
  env,
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
}) {
  async function createChurnFeedbackEntry(userId, user, { reason, feedback, plan, source }) {
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return null;
    }

    return prisma.churnFeedback.create({
      data: {
        userId,
        reason: reason.trim(),
        feedback: typeof feedback === "string" && feedback.trim() ? feedback.trim() : null,
        plan: typeof plan === "string" && plan.trim() ? plan.trim() : null,
        userEmailSnapshot: user?.email || null,
        userNameSnapshot: user ? getUserDisplayName(user) : null,
        source,
      },
    });
  }

  function blockEnvAdminSubscriptionAction(req, res, message) {
    if (req.user?.id === "env-admin" && req.user?.role === "ADMIN") {
      res.status(403).json({ ok: false, error: message });
      return true;
    }

    return false;
  }

  app.post("/api/subscription/churn-feedback", authRequired, async (req, res, next) => {
    try {
      const { reason, feedback, plan } = req.body || {};

      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({ ok: false, error: "Cancellation reason is required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
      });

      const entry = await createChurnFeedbackEntry(req.user.id, user, {
        reason,
        feedback,
        plan,
        source: "subscription-churn",
      });

      return res.json({ ok: true, id: entry.id });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/subscription/pause", authRequired, async (req, res, next) => {
    try {
      if (blockEnvAdminSubscriptionAction(req, res, "Subscription actions are not available for env admin")) {
        return;
      }

      const { stripe, subscription } = await getStripeSubscriptionForUser(req.user.id);
      const updated = await stripe.subscriptions.update(subscription.id, {
        pause_collection: {
          behavior: "keep_as_draft",
        },
        cancel_at_period_end: false,
      });
      setCachedSubscriptionAccess(req.user.id, getSubscriptionAccessDecisionFromStripe(updated));

      return res.json({
        ok: true,
        subscriptionStatus: getSubscriptionStatusForDisplayFromStripe(updated, "active"),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/subscription/resume", authRequired, async (req, res, next) => {
    try {
      if (blockEnvAdminSubscriptionAction(req, res, "Subscription actions are not available for env admin")) {
        return;
      }

      const { stripe, subscription } = await getStripeSubscriptionForUser(req.user.id);
      const updated = await stripe.subscriptions.update(subscription.id, {
        pause_collection: null,
        cancel_at_period_end: false,
      });
      setCachedSubscriptionAccess(req.user.id, getSubscriptionAccessDecisionFromStripe(updated));

      return res.json({
        ok: true,
        subscriptionStatus: getSubscriptionStatusForDisplayFromStripe(updated, "active"),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/subscription/cancel", authRequired, async (req, res, next) => {
    try {
      if (blockEnvAdminSubscriptionAction(req, res, "Subscription actions are not available for env admin")) {
        return;
      }

      const { reason, feedback, plan } = req.body || {};
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true },
      });
      const { stripe, subscription } = await getStripeSubscriptionForUser(req.user.id);
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        pause_collection: null,
      });
      setCachedSubscriptionAccess(req.user.id, getSubscriptionAccessDecisionFromStripe(updated));

      if (reason && typeof reason === "string" && reason.trim()) {
        await createChurnFeedbackEntry(req.user.id, currentUser, {
          reason,
          feedback,
          plan,
          source: "subscription-cancel",
        });
      }

      return res.json({
        ok: true,
        subscriptionStatus: getSubscriptionStatusForDisplayFromStripe(updated, "active"),
        currentPeriodEnd: stripeTimestampToDate(updated.current_period_end)?.toISOString() || null,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/me/billing", authRequired, async (req, res, next) => {
    try {
      if (blockEnvAdminSubscriptionAction(req, res, "Billing settings are not available for env admin")) {
        return;
      }

      const payload = await buildUserBillingSummary(req.user.id);
      if (!payload) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      return res.json(payload);
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/billing/portal-session", authRequired, async (req, res, next) => {
    try {
      if (blockEnvAdminSubscriptionAction(req, res, "Billing portal is not available for env admin")) {
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          stripeCustomerId: true,
        },
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      const { stripe, stripeCustomerId } = await getOrCreateStripeCustomerId(user);
      const appUrl = env.APP_URL || "http://localhost:5173";
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${appUrl}?settings=billing`,
      });

      return res.json({ ok: true, url: session.url });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/referral-codes/validate", async (req, res, next) => {
    try {
      const code = (req.body?.code || "").trim().toUpperCase();
      if (!code) return res.status(400).json({ ok: false, error: "No code provided" });

      const resolved = await resolveDiscountCode(code);
      if (resolved.type === "referral") {
        return res.json({
          ok: true,
          source: "platform",
          code,
        });
      }

      if (resolved.type === "stripe_promotion") {
        return res.json({
          ok: true,
          source: "stripe",
          code,
        });
      }

      return res.json({ ok: false, error: "Invalid or inactive referral code" });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/admin/referral-codes", authRequired, adminRequired, async (req, res, next) => {
    try {
      const referralCodes = await prisma.referralCode.findMany({
        where: {
          OR: [
            { createdByUserId: null },
            { createdBy: { role: "ADMIN" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            include: { profile: true },
          },
        },
      });

      return res.json({
        ok: true,
        items: referralCodes.map(formatReferralCode),
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/admin/referral-codes", authRequired, adminRequired, staffWriteRequired, async (req, res, next) => {
    try {
      const {
        code,
        accountDiscountPercent,
        mlRunDiscountPercent,
        durationDays,
        isActive,
      } = req.body || {};

      if (!code || typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ ok: false, error: "Referral code is required" });
      }

      const normalizedCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{4,32}$/.test(normalizedCode)) {
        return res.status(400).json({ ok: false, error: "Referral code must be 4-32 characters using letters, numbers, hyphens, or underscores" });
      }

      const accountDiscount = Number(accountDiscountPercent);
      const mlRunDiscount = Number(mlRunDiscountPercent);
      const duration = Number(durationDays);

      if (!Number.isFinite(accountDiscount) || accountDiscount < 0 || accountDiscount > 100) {
        return res.status(400).json({ ok: false, error: "Account discount must be between 0 and 100" });
      }

      if (!Number.isFinite(mlRunDiscount) || mlRunDiscount < 0 || mlRunDiscount > 100) {
        return res.status(400).json({ ok: false, error: "ML run discount must be between 0 and 100" });
      }

      if (!Number.isInteger(duration) || duration < 1 || duration > 3650) {
        return res.status(400).json({ ok: false, error: "Duration must be between 1 and 3650 days" });
      }

      const existing = await prisma.referralCode.findUnique({
        where: { code: normalizedCode },
        select: { id: true },
      });

      if (existing) {
        return res.status(409).json({ ok: false, error: "Referral code already exists" });
      }

      const referralCode = await prisma.referralCode.create({
        data: {
          code: normalizedCode,
          accountDiscountPercent: accountDiscount,
          mlRunDiscountPercent: mlRunDiscount,
          durationDays: duration,
          isActive: isActive === undefined ? true : Boolean(isActive),
          createdByUserId: req.user?.id === "env-admin" ? null : req.user.id,
        },
        include: {
          createdBy: {
            include: { profile: true },
          },
        },
      });

      return res.json({
        ok: true,
        referralCode: formatReferralCode(referralCode),
      });
    } catch (err) {
      return next(err);
    }
  });
}

module.exports = {
  registerStripeWebhookRoute,
  registerBillingRoutes,
};
