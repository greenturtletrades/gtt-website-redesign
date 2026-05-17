function createAccountStateHelpers({
  prisma,
  buildUserBillingSummary,
  formatReferralCode,
  ensureTraderOwnedReferralCode,
  getActiveUserDiscounts,
  syncStoredTradesFromMt,
  getPendingStoredTradeCount,
  formatAnalysisRun,
  storedTradeToJournalEntry,
}) {
  async function buildUserAccountState(userId, sessionRole = null) {
    const [user, storedTradeCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.storedTrade.count({
        where: { userId },
      }),
    ]);

    if (!user) {
      return null;
    }

    const billingPayload = await buildUserBillingSummary(userId);
    const accountRole = sessionRole || user.role;
    const ownReferralCode =
      accountRole === "TRADER" ? formatReferralCode(await ensureTraderOwnedReferralCode(user)) : null;

    return {
      ok: true,
      account: {
        id: user.id,
        email: user.email,
        role: accountRole,
        isSuperAdmin: Boolean(user.isSuperAdmin),
        status: user.status,
        plan: "payg",
        profile: user.profile,
        billing: billingPayload?.billing || null,
        ownReferralCode,
        leaderboard: {
          optIn: Boolean(user.leaderboardOptIn),
          displayName: user.leaderboardDisplayName || null,
          publishedAt: user.leaderboardPublishedAt ? user.leaderboardPublishedAt.toISOString() : null,
          eligibleTradeCount: storedTradeCount,
          minimumTradeCount: 10,
        },
        trading212: {
          configured: Boolean(user.trading212ApiKeyEncrypted && user.trading212ApiSecretEncrypted),
          apiKeyLast4:
            typeof user.trading212ApiKeyEncrypted === "string" &&
            user.trading212ApiKeyEncrypted.includes(":")
              ? user.trading212ApiKeyEncrypted.split(":").pop() || null
              : null,
          environment: user.trading212Environment || "live",
        },
      },
    };
  }

  async function buildAnalysisOptionsPayload(
    userId,
    { requestFresh = false, syncStoredTrades = false } = {}
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        appliedReferralCode: { select: { code: true } },
        accountDiscountPercent: true,
        mlRunDiscountPercent: true,
        referralDiscountExpiresAt: true,
      },
    });
    const brokerAccounts = await prisma.brokerAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const brokerAccountIds = brokerAccounts.map((account) => account.id);
    if (syncStoredTrades) {
      await syncStoredTradesFromMt(userId, brokerAccountIds, { requestFresh, timeoutMs: 8000 });
    }

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
    const discounts = getActiveUserDiscounts(user);

    return {
      availableTradeCount: pendingStoredTradeCount,
      minimumTradeCount: 10,
      recommendedTradeCount: Math.min(200, pendingStoredTradeCount || 200),
      mlRunDiscountPercent: discounts.mlRunDiscountPercent,
      accountDiscountPercent: discounts.accountDiscountPercent,
      referralCode: discounts.referralActive ? user?.appliedReferralCode?.code || null : null,
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
      buildAnalysisOptionsPayload(userId, { requestFresh: false, syncStoredTrades: false }),
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
        message: null,
      },
    };
  }

  return {
    buildUserAccountState,
    buildAnalysisOptionsPayload,
    buildAccountStatePayload,
  };
}

module.exports = {
  createAccountStateHelpers,
};
