function registerPlatformRoutes(app, {
  prisma,
  Stripe,
  authRequired,
  env,
  isBillingExemptUser,
  resolveDiscountCode,
  calculateReferralExpiry,
  buildStripeAccountDiscountConfig,
}) {
  app.post("/api/create-checkout-session", authRequired, async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          stripeCustomerId: true,
          billingExempt: true,
          platformComped: true,
          platformCompedReason: true,
          appliedReferralCode: { select: { code: true } },
          accountDiscountPercent: true,
          mlRunDiscountPercent: true,
          referralDiscountExpiresAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      if (isBillingExemptUser(user)) {
        return res.json({
          ok: true,
          bypass: true,
          internalAccount: true,
        });
      }

      if (env.PAYMENTS_ACTIVE !== "true") {
        return res.status(403).json({ ok: false, error: "Payments not active" });
      }

      const stripeSecretKey = env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ ok: false, error: "Stripe not configured" });
      }

      const monthlyPriceId = env.STRIPE_PRICE_MONTHLY;
      const perTradePriceId = env.STRIPE_PRICE_PER_TRADE;
      if (!monthlyPriceId || !perTradePriceId) {
        return res.status(500).json({ ok: false, error: "Stripe prices not configured" });
      }

      const stripe = Stripe(stripeSecretKey);

      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({ email: user.email });
        stripeCustomerId = customer.id;
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId },
        });
      }

      const appUrl = env.APP_URL || "http://localhost:5173";

      const incomingReferralCode =
        typeof req.body?.referralCode === "string" ? req.body.referralCode.trim().toUpperCase() : null;
      const resolvedDiscountCode = incomingReferralCode
        ? await resolveDiscountCode(incomingReferralCode)
        : { type: "none" };

      if (incomingReferralCode && resolvedDiscountCode.type === "invalid") {
        return res.status(400).json({ ok: false, error: "Referral code is invalid or inactive" });
      }

      if (incomingReferralCode && !user.appliedReferralCode && resolvedDiscountCode.type === "referral") {
        const matchedCode = resolvedDiscountCode.referralCode;
        if (matchedCode) {
          const expiresAt = calculateReferralExpiry(matchedCode.durationDays);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              appliedReferralCodeId: matchedCode.id,
              accountDiscountPercent: matchedCode.accountDiscountPercent,
              mlRunDiscountPercent: matchedCode.mlRunDiscountPercent,
              referralDiscountExpiresAt: expiresAt,
            },
          });
          user.appliedReferralCode = { code: matchedCode.code };
          user.accountDiscountPercent = matchedCode.accountDiscountPercent;
          user.mlRunDiscountPercent = matchedCode.mlRunDiscountPercent;
          user.referralDiscountExpiresAt = expiresAt;
        }
      }

      let {
        discountsPayload,
        allowPromotionCodes,
      } = await buildStripeAccountDiscountConfig({
        stripe,
        user,
        monthlyPriceId,
      });

      if (resolvedDiscountCode.type === "stripe_promotion") {
        discountsPayload = [{ promotion_code: resolvedDiscountCode.promotionCode.id }];
        allowPromotionCodes = false;
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          referralCode: user.appliedReferralCode?.code || "",
        },
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
        discounts: discountsPayload,
        allow_promotion_codes: allowPromotionCodes || undefined,
        success_url: `${appUrl}?checkout=success`,
        cancel_url: `${appUrl}?checkout=cancelled`,
      });

      return res.json({ ok: true, url: session.url });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/config", (req, res) => {
    res.json({ ml_enabled: env.ML_ENABLED === "true" });
  });
}

module.exports = {
  registerPlatformRoutes,
};
