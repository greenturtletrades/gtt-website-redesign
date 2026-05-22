const DEFAULT_TRADER_REFERRAL_ACCOUNT_DISCOUNT_PERCENT = 10;
const DEFAULT_TRADER_REFERRAL_ML_DISCOUNT_PERCENT = 10;
const DEFAULT_TRADER_REFERRAL_DURATION_DAYS = 90;

function slugifyReferralFragment(value, fallback = "TRADER") {
  const fragment = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return fragment || fallback;
}

function buildTraderReferralCodeCandidates(user) {
  const emailLocal = String(user?.email || "").split("@")[0] || "";
  const profileName = `${user?.profile?.firstName || ""}${user?.profile?.lastName || ""}`;
  const primary = slugifyReferralFragment(profileName || emailLocal || user?.id, "TRADER");
  const secondary = slugifyReferralFragment(emailLocal || user?.id, "TRADER");
  const idTail = String(user?.id || "").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-4) || "GTT1";
  return [
    `TRADER-${primary}`,
    `TRADER-${secondary}-${idTail}`,
    `TRADER-${idTail}`,
  ];
}

function createBillingReferralHelpers({
  prisma,
  Stripe,
  env,
  getSubscriptionAccessDecisionFromStripe,
}) {
  function formatReferralCode(referralCode) {
    const creatorFirstName = referralCode.createdBy?.profile?.firstName?.trim() || "";
    const creatorLastName = referralCode.createdBy?.profile?.lastName?.trim() || "";
    const creatorName = `${creatorFirstName} ${creatorLastName}`.trim();

    return {
      id: referralCode.id,
      code: referralCode.code,
      accountDiscountPercent: referralCode.accountDiscountPercent,
      mlRunDiscountPercent: referralCode.mlRunDiscountPercent,
      durationDays: referralCode.durationDays,
      isActive: referralCode.isActive,
      createdAt: referralCode.createdAt.toISOString(),
      createdBy: referralCode.createdBy
        ? {
            id: referralCode.createdBy.id,
            email: referralCode.createdBy.email,
            name: creatorName || referralCode.createdBy.email.split("@")[0],
          }
        : null,
    };
  }

  function isBillingExemptUser(user) {
    return Boolean(user?.billingExempt);
  }

  function isPlatformCompedUser(user) {
    return Boolean(user?.platformComped);
  }

  async function ensureTraderOwnedReferralCode(user) {
    if (!user?.id) {
      return null;
    }

    const existing = await prisma.referralCode.findFirst({
      where: { createdByUserId: user.id },
      include: {
        createdBy: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      return existing;
    }

    const existingCodes = new Set(
      (
        await prisma.referralCode.findMany({
          where: {
            code: {
              in: buildTraderReferralCodeCandidates(user),
            },
          },
          select: { code: true },
        })
      ).map((item) => item.code),
    );

    let selectedCode =
      buildTraderReferralCodeCandidates(user).find((candidate) => !existingCodes.has(candidate)) || null;

    if (!selectedCode) {
      let attempt = 1;
      const base = buildTraderReferralCodeCandidates(user)[0] || "TRADER";
      while (!selectedCode) {
        const nextCandidate = `${base}-${attempt}`;
        const collision = await prisma.referralCode.findUnique({
          where: { code: nextCandidate },
          select: { id: true },
        });
        if (!collision) {
          selectedCode = nextCandidate;
        }
        attempt += 1;
      }
    }

    return prisma.referralCode.create({
      data: {
        code: selectedCode,
        accountDiscountPercent: DEFAULT_TRADER_REFERRAL_ACCOUNT_DISCOUNT_PERCENT,
        mlRunDiscountPercent: DEFAULT_TRADER_REFERRAL_ML_DISCOUNT_PERCENT,
        durationDays: DEFAULT_TRADER_REFERRAL_DURATION_DAYS,
        isActive: true,
        createdByUserId: user.id,
      },
      include: {
        createdBy: {
          include: { profile: true },
        },
      },
    });
  }

  async function getActiveReferralCode(code) {
    if (!code || typeof code !== "string" || !code.trim()) {
      return null;
    }

    const normalizedCode = code.trim().toUpperCase();
    const referralCode = await prisma.referralCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!referralCode || !referralCode.isActive) {
      return null;
    }

    return referralCode;
  }

  async function getActiveStripePromotionCode(code) {
    if (!code || typeof code !== "string" || !code.trim() || !env.STRIPE_SECRET_KEY) {
      return null;
    }

    const normalizedCode = code.trim().toUpperCase();
    const stripe = Stripe(env.STRIPE_SECRET_KEY);
    const result = await stripe.promotionCodes.list({
      code: normalizedCode,
      active: true,
      limit: 1,
    });

    return result.data?.[0] || null;
  }

  async function resolveDiscountCode(code) {
    if (!code || typeof code !== "string" || !code.trim()) {
      return { type: "none" };
    }

    const normalizedCode = code.trim().toUpperCase();
    const referralCode = await getActiveReferralCode(normalizedCode);
    if (referralCode) {
      return { type: "referral", code: normalizedCode, referralCode };
    }

    const stripePromotionCode = await getActiveStripePromotionCode(normalizedCode);
    if (stripePromotionCode) {
      return { type: "stripe_promotion", code: normalizedCode, promotionCode: stripePromotionCode };
    }

    return { type: "invalid", code: normalizedCode };
  }

  function getActiveUserDiscounts(user) {
    if (isBillingExemptUser(user)) {
      return {
        referralActive: true,
        accountDiscountPercent: 100,
        mlRunDiscountPercent: 100,
        referralDiscountExpiresAt: null,
      };
    }

    if (isPlatformCompedUser(user)) {
      return {
        referralActive: true,
        accountDiscountPercent: 100,
        mlRunDiscountPercent: 0,
        referralDiscountExpiresAt: null,
      };
    }

    const now = Date.now();
    const expiryTs = user?.referralDiscountExpiresAt
      ? new Date(user.referralDiscountExpiresAt).getTime()
      : 0;
    const referralActive = expiryTs > now;

    return {
      referralActive,
      accountDiscountPercent:
        referralActive && typeof user?.accountDiscountPercent === "number"
          ? Math.max(0, Math.min(100, user.accountDiscountPercent))
          : 0,
      mlRunDiscountPercent:
        referralActive && typeof user?.mlRunDiscountPercent === "number"
          ? Math.max(0, Math.min(100, user.mlRunDiscountPercent))
          : 0,
      referralDiscountExpiresAt:
        referralActive && user?.referralDiscountExpiresAt
          ? new Date(user.referralDiscountExpiresAt)
          : null,
    };
  }

  async function buildStripeAccountDiscountConfig({ stripe, user, monthlyPriceId }) {
    const discounts = getActiveUserDiscounts(user);
    const freeCouponId =
      typeof env.STRIPE_COUPON_FREE === "string" && env.STRIPE_COUPON_FREE.trim()
        ? env.STRIPE_COUPON_FREE.trim()
        : null;

    if (discounts.accountDiscountPercent <= 0) {
      return {
        discountsPayload: undefined,
        allowPromotionCodes: true,
      };
    }

    if (discounts.accountDiscountPercent >= 100 && freeCouponId) {
      return {
        discountsPayload: [{ coupon: freeCouponId }],
        allowPromotionCodes: false,
      };
    }

    const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId);
    const monthlyProductId =
      monthlyPrice && typeof monthlyPrice.product === "string"
        ? monthlyPrice.product
        : null;

    const expiryDate = discounts.referralDiscountExpiresAt
      ? discounts.referralDiscountExpiresAt
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const durationMonths = Math.max(
      1,
      Math.ceil((expiryDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)),
    );

    const coupon = await stripe.coupons.create({
      percent_off: discounts.accountDiscountPercent,
      duration: "repeating",
      duration_in_months: durationMonths,
      name: user.appliedReferralCode?.code
        ? `${user.appliedReferralCode.code} account discount`
        : isPlatformCompedUser(user)
          ? "Manual complimentary platform access"
          : "Referral account discount",
      ...(monthlyProductId
        ? {
            applies_to: {
              products: [monthlyProductId],
            },
          }
        : {}),
    });

    return {
      discountsPayload: [{ coupon: coupon.id }],
      allowPromotionCodes: false,
    };
  }

  function toCurrencyAmount(minorUnits) {
    if (typeof minorUnits !== "number" || !Number.isFinite(minorUnits)) {
      return null;
    }
    return minorUnits / 100;
  }

  function stripeTimestampToDate(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    return new Date(value * 1000);
  }

  function getSubscriptionStatusForDisplayFromStripe(subscription, fallback = "active") {
    const decision = getSubscriptionAccessDecisionFromStripe(subscription);
    if (!decision || typeof decision.status !== "string" || !decision.status.trim()) {
      return fallback;
    }
    return decision.status;
  }

  async function findUserByStripeLink({ stripeCustomerId, stripeSubscriptionId }) {
    if (stripeCustomerId) {
      const byCustomer = await prisma.user.findFirst({
        where: { stripeCustomerId },
        select: { id: true, stripeCustomerId: true, stripeSubscriptionId: true },
      });
      if (byCustomer) return byCustomer;
    }

    if (stripeSubscriptionId) {
      const bySubscription = await prisma.user.findFirst({
        where: { stripeSubscriptionId },
        select: { id: true, stripeCustomerId: true, stripeSubscriptionId: true },
      });
      if (bySubscription) return bySubscription;
    }

    return null;
  }

  function getStripeBillingEventData(event) {
    const object = event?.data?.object || {};
    const eventType = event?.type || "unknown";
    let stripeCustomerId = typeof object.customer === "string" ? object.customer : null;
    let stripeSubscriptionId = typeof object.subscription === "string" ? object.subscription : null;
    let stripeInvoiceId = typeof object.id === "string" && object.object === "invoice" ? object.id : null;
    let category = null;
    let analysisRunId =
      typeof object.metadata?.analysisRunId === "string" ? object.metadata.analysisRunId : null;
    let status = null;
    let currency = typeof object.currency === "string" ? object.currency.toUpperCase() : null;
    let amount = null;
    let amountSubtotal = null;
    let amountTax = null;
    let amountPaid = null;
    let periodStart = stripeTimestampToDate(object.current_period_start);
    let periodEnd = stripeTimestampToDate(object.current_period_end);
    let occurredAt = stripeTimestampToDate(event.created) || new Date();

    if (eventType.startsWith("customer.subscription.")) {
      category = "subscription";
      stripeSubscriptionId = typeof object.id === "string" ? object.id : stripeSubscriptionId;
      status = object.status === "active" ? "ACTIVE" : object.status === "canceled" ? "CANCELLED" : "INACTIVE";
      amount = toCurrencyAmount(object.items?.data?.[0]?.price?.unit_amount ?? null);
    } else if (eventType.startsWith("invoice.")) {
      const firstLine = object.lines?.data?.[0] || null;
      category =
        typeof object.metadata?.chargeType === "string"
          ? object.metadata.chargeType
          : typeof firstLine?.metadata?.chargeType === "string"
            ? firstLine.metadata.chargeType
            : "subscription";
      analysisRunId =
        analysisRunId ||
        (typeof firstLine?.metadata?.analysisRunId === "string" ? firstLine.metadata.analysisRunId : null);
      const linePeriod = firstLine?.period || null;
      periodStart = stripeTimestampToDate(linePeriod?.start) || periodStart;
      periodEnd = stripeTimestampToDate(linePeriod?.end) || periodEnd;
      status =
        eventType === "invoice.paid"
          ? "PAID"
          : eventType === "invoice.payment_failed"
            ? "FAILED"
            : typeof object.status === "string"
              ? String(object.status).toUpperCase()
              : "PENDING";
      amount = toCurrencyAmount(object.amount_due);
      amountSubtotal = toCurrencyAmount(object.subtotal);
      amountTax = toCurrencyAmount(object.tax);
      amountPaid = toCurrencyAmount(object.amount_paid);
      occurredAt = stripeTimestampToDate(object.status_transitions?.paid_at) || occurredAt;
    } else if (eventType === "checkout.session.completed") {
      category = "subscription";
      status = object.payment_status === "paid" ? "PAID" : "PENDING";
      amount = toCurrencyAmount(object.amount_total);
      amountSubtotal = toCurrencyAmount(object.amount_subtotal);
      stripeSubscriptionId = typeof object.subscription === "string" ? object.subscription : stripeSubscriptionId;
    }

    return {
      eventType,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeInvoiceId,
      category,
      analysisRunId,
      status,
      currency,
      amount,
      amountSubtotal,
      amountTax,
      amountPaid,
      periodStart,
      periodEnd,
      occurredAt,
    };
  }

  function getStripeInvoiceRevenueBreakdown(invoiceLike, fallbackAmountPaid = 0) {
    const lines = Array.isArray(invoiceLike?.lines?.data) ? invoiceLike.lines.data : [];
    const monthlyPriceId = env.STRIPE_PRICE_MONTHLY || null;
    const perTradePriceId = env.STRIPE_PRICE_PER_TRADE || null;

    let subscriptionRevenue = 0;
    let mlRevenue = 0;

    for (const line of lines) {
      const amount = typeof line?.amount === "number" ? line.amount / 100 : 0;
      const priceId =
        line?.price && typeof line.price === "object" && typeof line.price.id === "string"
          ? line.price.id
          : null;
      const usageType =
        line?.price && typeof line.price === "object"
          ? line.price.recurring?.usage_type || null
          : null;

      if ((perTradePriceId && priceId === perTradePriceId) || usageType === "metered") {
        mlRevenue += amount;
      } else if (!monthlyPriceId || priceId === monthlyPriceId) {
        subscriptionRevenue += amount;
      } else {
        subscriptionRevenue += amount;
      }
    }

    if (lines.length === 0) {
      subscriptionRevenue = typeof fallbackAmountPaid === "number" ? fallbackAmountPaid : 0;
    }

    return {
      subscriptionRevenue: Number(subscriptionRevenue.toFixed(2)),
      mlRevenue: Number(mlRevenue.toFixed(2)),
    };
  }

  function getBillingEventRevenueBreakdown(billingEvent) {
    const payload = billingEvent?.payload;
    const object = payload?.data?.object;
    return getStripeInvoiceRevenueBreakdown(
      object,
      typeof billingEvent?.amountPaid === "number" ? billingEvent.amountPaid : 0
    );
  }

  async function persistStripeBillingEvent(event) {
    const eventData = getStripeBillingEventData(event);
    const linkedUser = await findUserByStripeLink({
      stripeCustomerId: eventData.stripeCustomerId,
      stripeSubscriptionId: eventData.stripeSubscriptionId,
    });

    if (linkedUser) {
      const nextStripeCustomerId = eventData.stripeCustomerId || linkedUser.stripeCustomerId || null;
      const nextStripeSubscriptionId =
        event.type === "customer.subscription.deleted"
          ? null
          : eventData.stripeSubscriptionId || linkedUser.stripeSubscriptionId || null;
      const shouldPromotePlanToPayg =
        event.type === "checkout.session.completed" ||
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated" ||
        event.type === "invoice.paid";

      await prisma.user.update({
        where: { id: linkedUser.id },
        data: {
          stripeCustomerId: nextStripeCustomerId,
          stripeSubscriptionId: nextStripeSubscriptionId,
          ...(shouldPromotePlanToPayg ? { plan: "payg" } : {}),
        },
      });
    }

    await prisma.billingEvent.upsert({
      where: { stripeEventId: event.id },
      update: {
        userId: linkedUser?.id || null,
        stripeCustomerId: eventData.stripeCustomerId,
        stripeSubscriptionId: eventData.stripeSubscriptionId,
        stripeInvoiceId: eventData.stripeInvoiceId,
        category: eventData.category,
        eventType: eventData.eventType,
        status: eventData.status,
        currency: eventData.currency,
        amount: eventData.amount,
        amountSubtotal: eventData.amountSubtotal,
        amountTax: eventData.amountTax,
        amountPaid: eventData.amountPaid,
        periodStart: eventData.periodStart,
        periodEnd: eventData.periodEnd,
        occurredAt: eventData.occurredAt,
        payload: event,
      },
      create: {
        stripeEventId: event.id,
        userId: linkedUser?.id || null,
        stripeCustomerId: eventData.stripeCustomerId,
        stripeSubscriptionId: eventData.stripeSubscriptionId,
        stripeInvoiceId: eventData.stripeInvoiceId,
        category: eventData.category,
        eventType: eventData.eventType,
        status: eventData.status,
        currency: eventData.currency,
        amount: eventData.amount,
        amountSubtotal: eventData.amountSubtotal,
        amountTax: eventData.amountTax,
        amountPaid: eventData.amountPaid,
        periodStart: eventData.periodStart,
        periodEnd: eventData.periodEnd,
        occurredAt: eventData.occurredAt,
        payload: event,
      },
    });
  }

  function formatStripePaymentMethod(paymentMethod) {
    if (!paymentMethod || paymentMethod.object !== "payment_method" || paymentMethod.type !== "card") {
      return null;
    }

    return {
      brand: paymentMethod.card?.brand || null,
      last4: paymentMethod.card?.last4 || null,
      expMonth: paymentMethod.card?.exp_month || null,
      expYear: paymentMethod.card?.exp_year || null,
      funding: paymentMethod.card?.funding || null,
      country: paymentMethod.card?.country || null,
    };
  }

  async function buildUserBillingSummary(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        billingExempt: true,
        billingExemptReason: true,
        platformComped: true,
        platformCompedReason: true,
        appliedReferralCode: { select: { code: true } },
        accountDiscountPercent: true,
        mlRunDiscountPercent: true,
        referralDiscountExpiresAt: true,
        billingEvents: {
          where: {
            eventType: {
              in: ["invoice.paid", "invoice.payment_failed"],
            },
          },
          orderBy: { occurredAt: "desc" },
          take: 12,
        },
        analysisRuns: {
          where: {
            status: "COMPLETED",
            cost: { not: null },
          },
          orderBy: { completedAt: "desc" },
          take: 12,
          select: {
            id: true,
            mode: true,
            tradesAnalysed: true,
            cost: true,
            stripeInvoiceId: true,
            stripeBillingStatus: true,
            stripeBilledAt: true,
            stripeAmountPaid: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const discounts = getActiveUserDiscounts(user);
    let subscriptionStatus = user.stripeSubscriptionId ? "active" : "not_started";
    let currentBillingMethod = null;
    let currentPeriodEnd = null;
    let currentPeriodStart = null;
    let stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
    let stripeUpcomingMlCharge = null;

    if (env.STRIPE_SECRET_KEY && (user.stripeCustomerId || user.stripeSubscriptionId)) {
      try {
        const stripe = Stripe(env.STRIPE_SECRET_KEY);
        let subscription = null;
        if (user.stripeSubscriptionId) {
          subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
            expand: ["default_payment_method"],
          });
        }

        let paymentMethod =
          subscription?.default_payment_method &&
          typeof subscription.default_payment_method === "object"
            ? subscription.default_payment_method
            : null;

        if (!paymentMethod && user.stripeCustomerId) {
          const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
            expand: ["invoice_settings.default_payment_method"],
          });
          if (!customer.deleted) {
            paymentMethod =
              customer.invoice_settings?.default_payment_method &&
              typeof customer.invoice_settings.default_payment_method === "object"
                ? customer.invoice_settings.default_payment_method
                : null;
          }
        }

        currentBillingMethod = formatStripePaymentMethod(paymentMethod);

        if (subscription) {
          subscriptionStatus = getSubscriptionStatusForDisplayFromStripe(subscription, subscriptionStatus);
          currentPeriodStart = stripeTimestampToDate(subscription.current_period_start);
          currentPeriodEnd = stripeTimestampToDate(subscription.current_period_end);

          const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
            customer: user.stripeCustomerId || undefined,
            subscription: user.stripeSubscriptionId,
            expand: ["lines.data.price"],
          });
          stripeUpcomingMlCharge = getStripeInvoiceRevenueBreakdown(upcomingInvoice).mlRevenue;
        }
      } catch (error) {
        console.error("Unable to load Stripe billing summary", error);
        stripeConfigured = true;
      }
    }

    const mlRunChargesDue = user.analysisRuns.reduce((sum, run) => {
      const status = String(run.stripeBillingStatus || "").toUpperCase();
      const isSettled = status === "PAID" || status === "NO_CHARGE" || status === "REPORTED";
      return sum + (!isSettled && typeof run.cost === "number" ? run.cost : 0);
    }, 0);
    const mlRunChargesAwaitingPayment = user.analysisRuns.reduce((sum, run) => {
      const status = String(run.stripeBillingStatus || "").toUpperCase();
      const isSettled = status === "PAID" || status === "NO_CHARGE";
      return sum + (!isSettled && typeof run.cost === "number" ? run.cost : 0);
    }, 0);
    const displayedMlRunChargesAwaitingPayment =
      typeof stripeUpcomingMlCharge === "number"
        ? stripeUpcomingMlCharge
        : mlRunChargesAwaitingPayment;
    const totalPaidBilling = user.billingEvents.reduce(
      (sum, event) => sum + (typeof event.amountPaid === "number" ? event.amountPaid : 0),
      0
    );

    return {
      ok: true,
      billing: {
        plan:
          isBillingExemptUser(user)
            ? "internal"
            : typeof user.plan === "string" && user.plan.trim()
              ? user.plan.trim()
              : user.stripeSubscriptionId
                ? "payg"
                : "free",
        subscriptionStatus: isBillingExemptUser(user) ? "internal" : subscriptionStatus,
        stripeConfigured,
        stripeCustomerLinked: Boolean(user.stripeCustomerId),
        stripeSubscriptionLinked: Boolean(user.stripeSubscriptionId),
        billingExempt: isBillingExemptUser(user),
        billingExemptReason: user.billingExemptReason || null,
        platformComped: isPlatformCompedUser(user),
        platformCompedReason: user.platformCompedReason || null,
        cancelAtPeriodEnd: subscriptionStatus === "cancelling",
        currentPeriodStart: currentPeriodStart ? currentPeriodStart.toISOString() : null,
        currentPeriodEnd: currentPeriodEnd ? currentPeriodEnd.toISOString() : null,
        currentBillingMethod,
        referralCode: discounts.referralActive ? user.appliedReferralCode?.code || null : null,
        accountDiscountPercent: discounts.accountDiscountPercent,
        mlRunDiscountPercent: discounts.mlRunDiscountPercent,
        discountExpiresAt: discounts.referralDiscountExpiresAt ? discounts.referralDiscountExpiresAt.toISOString() : null,
        mlRunChargesDue: Number(displayedMlRunChargesAwaitingPayment.toFixed(2)),
        mlRunChargesAwaitingPayment: Number(displayedMlRunChargesAwaitingPayment.toFixed(2)),
        totalPaidBilling: Number(totalPaidBilling.toFixed(2)),
        recentMlRunCharges: user.analysisRuns.map((run) => ({
          id: run.id,
          status: (() => {
            const status = String(run.stripeBillingStatus || "").toUpperCase();
            if (status === "PAID") return "paid";
            if (status === "FAILED" || status === "CANCELLED") return "failed";
            if (status === "PENDING") return "pending";
            if (status === "REPORTED") return "reported";
            if (status === "REPORT_FAILED") return "report_failed";
            if (status === "NO_CHARGE") return "no_charge";
            return "due";
          })(),
          mode: run.mode,
          tradesAnalysed: run.tradesAnalysed ?? null,
          amount: typeof run.cost === "number" ? Number(run.cost.toFixed(2)) : null,
          createdAt: run.createdAt.toISOString(),
          completedAt: run.completedAt ? run.completedAt.toISOString() : null,
        })),
        recentInvoices: user.billingEvents.map((event) => ({
          id: event.id,
          stripeInvoiceId: event.stripeInvoiceId,
          eventType: event.eventType,
          status: event.status,
          currency: event.currency,
          amount: event.amount,
          amountSubtotal: event.amountSubtotal,
          amountTax: event.amountTax,
          amountPaid: event.amountPaid,
          periodStart: event.periodStart ? event.periodStart.toISOString() : null,
          periodEnd: event.periodEnd ? event.periodEnd.toISOString() : null,
          occurredAt: event.occurredAt.toISOString(),
        })),
      },
    };
  }

  return {
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
  };
}

module.exports = {
  createBillingReferralHelpers,
};
