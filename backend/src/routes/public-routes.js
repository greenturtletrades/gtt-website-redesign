const crypto = require("crypto");
const http = require("http");
const https = require("https");

const LEADERBOARD_MINIMUM_VERIFIED_TRADES = 1;

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
    return null;
  }

  return riskPercents.reduce((sum, value) => sum + value, 0) / riskPercents.length;
}

function resolveRiskLevel(riskPerTradePercent) {
  if (typeof riskPerTradePercent !== "number" || !Number.isFinite(riskPerTradePercent)) {
    return "N/A";
  }

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

function resolveMarketSummary(trades) {
  const counts = new Map();

  for (const trade of trades) {
    const market = classifySymbolMarket(trade.symbol);
    counts.set(market, (counts.get(market) || 0) + 1);
  }

  const sortedMarkets = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  if (sortedMarkets.length === 0) {
    return "Mixed";
  }

  if (sortedMarkets.length === 1) {
    return sortedMarkets[0][0];
  }

  const primaryMarkets = sortedMarkets.slice(0, 2).map(([market]) => market);
  return sortedMarkets.length > 2
    ? `${primaryMarkets.join(" + ")} + More`
    : primaryMarkets.join(" + ");
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

function calculateAverageR(totalR, totalTrades) {
  if (typeof totalR !== "number" || !Number.isFinite(totalR) || !(totalTrades > 0)) {
    return null;
  }

  return totalR / totalTrades;
}

function calculateProfitFactor(trades) {
  const rValues = trades
    .map((trade) => calculateTradeRMultiple(trade))
    .filter((value) => typeof value === "number" && Number.isFinite(value));

  const grossProfit = rValues.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
  const grossLoss = Math.abs(
    rValues.filter((value) => value < 0).reduce((sum, value) => sum + value, 0)
  );

  if (!(grossProfit > 0) && !(grossLoss > 0)) {
    return null;
  }

  if (!(grossLoss > 0)) {
    return Infinity;
  }

  return grossProfit / grossLoss;
}

function calculateVerifiedCurrencyPnl(trades) {
  let hasCurrencyPnl = false;

  const total = trades.reduce((sum, trade) => {
    const profit = typeof trade.profit === "number" ? trade.profit : 0;
    const commission = typeof trade.commission === "number" ? trade.commission : 0;
    const swap = typeof trade.swap === "number" ? trade.swap : 0;
    const tradeHasCurrencyPnl =
      typeof trade.profit === "number" ||
      typeof trade.commission === "number" ||
      typeof trade.swap === "number";

    if (tradeHasCurrencyPnl) {
      hasCurrencyPnl = true;
    }

    return sum + profit + commission + swap;
  }, 0);

  return hasCurrencyPnl ? total : null;
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

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "T";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function normalizePublicPerformancePoint(point) {
  if (!point || typeof point !== "object") return null;
  const rawDate = point.date || point.timestamp || point.time || point.label || null;
  const rawValue = point.returnPercent ?? point.totalReturnPercent ?? point.value ?? point.equity ?? point.pnl ?? null;
  const value = number(rawValue, NaN);
  if (!Number.isFinite(value)) return null;
  return {
    date: rawDate ? String(rawDate) : null,
    value,
  };
}

function normalizePublicPerformanceSeries(points) {
  if (!Array.isArray(points)) return [];
  const normalized = points.map(normalizePublicPerformancePoint).filter(Boolean).slice(-40);
  if (normalized.length < 2) return normalized;

  const hasExplicitReturnPercent = points.some((point) => {
    if (!point || typeof point !== "object") return false;
    return Number.isFinite(Number(point.returnPercent ?? point.totalReturnPercent));
  });
  if (hasExplicitReturnPercent) return normalized;

  const values = normalized.map((point) => point.value);
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)));
  if (maxAbs < 100) return normalized;

  const baseValue = values.find((value) => Math.abs(value) > 1e-8) || values[0] || 0;
  if (Math.abs(baseValue) <= 1e-8) return normalized.map((point) => ({ ...point, value: 0 }));

  return normalized.map((point) => ({
    ...point,
    value: ((point.value - baseValue) / Math.abs(baseValue)) * 100,
  }));
}

function normalizePublicTrade(trade, index) {
  if (!trade || typeof trade !== "object") return null;
  const symbol = String(trade.symbol || trade.asset || "UNKNOWN").trim();
  if (!symbol) return null;
  const side = String(trade.side || trade.type || "").toUpperCase();
  const normalizedSide = side.includes("SHORT") ? "SHORT" : "LONG";
  const pnl = number(trade.pnl ?? trade.profit, 0);
  return {
    id: String(trade.id || trade.sourceOrderId || `public-trade-${index + 1}`),
    symbol,
    side: normalizedSide,
    status: String(trade.status || "closed").toLowerCase(),
    pnl,
    pnlPercent: number(trade.pnlPercent, 0),
    tradeReturnPercent: number(trade.tradeReturnPercent ?? trade.pnlPercent, 0),
    accountReturnPercent: trade.accountReturnPercent == null ? null : number(trade.accountReturnPercent, 0),
    accountReturnBase: trade.accountReturnBase == null ? null : number(trade.accountReturnBase, 0),
    entryTime: trade.entryTime ? String(trade.entryTime) : null,
    exitTime: trade.exitTime ? String(trade.exitTime) : null,
    closeReason: trade.closeReason || trade.statusLabel || null,
  };
}

function normalizeCompetitionLeaderboardRow(trader, index) {
  const data = trader && typeof trader.data === "object" && trader.data ? trader.data : {};
  const name = String(trader?.displayName || data.displayName || data.name || `Trader ${index + 1}`);
  const totalReturnPercent = number(data.totalReturnPercent ?? data.totalPnLPercent, 0);
  const realizedReturnPercent = number(data.realizedReturnPercent, 0);
  const unrealizedReturnPercent = number(data.unrealizedReturnPercent, 0);
  const score = number(data.competitionScore ?? data.score, 0);
  const totalTrades = Math.max(0, Math.floor(number(data.totalTrades, 0)));
  const liveTrades = Array.isArray(data.liveTrades) ? data.liveTrades : [];
  const mainAssets = Array.isArray(data.mainAssets)
    ? data.mainAssets.map((asset) => String(asset)).filter(Boolean).slice(0, 4)
    : [];
  const performanceData = normalizePublicPerformanceSeries(data.performanceData);
  const recentTrades = Array.isArray(data.recentTrades)
    ? data.recentTrades.map(normalizePublicTrade).filter(Boolean).slice(0, 5)
    : [];
  const publicLiveTrades = liveTrades.map(normalizePublicTrade).filter(Boolean).slice(0, 5);

  return {
    rank: index + 1,
    id: String(trader?.userId || trader?.id || `competition-trader-${index + 1}`),
    name,
    initials: formatInitials(name),
    universityName: String(data.universityName || "Verified University"),
    score,
    winRate: number(data.winRate, 0),
    avgReturn: number(data.avgReturn, 0),
    totalReturnPercent,
    realizedReturnPercent,
    unrealizedReturnPercent,
    riskLabel: String(data.riskLabel || "Unrated"),
    totalTrades,
    openTrades: liveTrades.length,
    followers: Math.max(0, Math.floor(number(data.followers, 0))),
    aum: number(data.aum ?? data.equity, 0),
    mainAssets,
    performanceData,
    recentTrades,
    liveTrades: publicLiveTrades,
    lastUpdatedAt: data.updatedAt || data.lastUpdatedAt || null,
  };
}

function normalizeCompetitionUniversityRow(university, index) {
  const name = String(university?.universityName || university?.university || `University ${index + 1}`);
  const avgRiskScore = university?.avgRiskScore == null ? null : number(university.avgRiskScore, 0);
  const riskLabel = avgRiskScore == null
    ? "Unrated"
    : avgRiskScore <= 3
      ? "Low"
      : avgRiskScore <= 6
        ? "Medium"
        : "High";

  return {
    rank: index + 1,
    universityName: name,
    activeTraders: Math.max(0, Math.floor(number(university?.activeTraders, 0))),
    totalTraders: Math.max(0, Math.floor(number(university?.totalTraders ?? university?.totalParticipants, 0))),
    totalReturnPercent: number(university?.totalReturnPercent, 0),
    realizedReturnPercent: number(university?.realizedReturnPercent ?? university?.realizedPnlPercent, 0),
    unrealizedReturnPercent: number(university?.unrealizedReturnPercent ?? university?.unrealizedPnlPercent, 0),
    score: number(university?.score, 0),
    avgTraderScore: number(university?.avgTraderScore, 0),
    winRate: number(university?.winRate, 0),
    avgRiskScore,
    riskLabel,
    trades: Math.max(0, Math.floor(number(university?.trades, 0))),
    followers: Math.max(0, Math.floor(number(university?.followers ?? university?.backers, 0))),
    aum: number(university?.aum, 0),
  };
}

function buildUniversityRowsFromLeaderboard(leaderboard) {
  const grouped = new Map();
  for (const trader of leaderboard) {
    const universityName = String(trader?.universityName || "").trim();
    if (!universityName) continue;
    const summary = grouped.get(universityName) || {
      universityName,
      activeTraders: 0,
      totalTraders: 0,
      totalReturnPercent: 0,
      realizedReturnPercent: 0,
      unrealizedReturnPercent: 0,
      score: 0,
      avgTraderScore: 0,
      winRate: 0,
      avgRiskScore: null,
      trades: 0,
      followers: 0,
      aum: 0,
    };
    summary.totalTraders += 1;
    if (trader.totalTrades > 0 || trader.openTrades > 0) summary.activeTraders += 1;
    summary.totalReturnPercent += trader.totalReturnPercent;
    summary.realizedReturnPercent += trader.realizedReturnPercent;
    summary.unrealizedReturnPercent += trader.unrealizedReturnPercent;
    summary.score += trader.score;
    summary.avgTraderScore += trader.score;
    summary.winRate += trader.winRate;
    summary.trades += trader.totalTrades;
    summary.followers += trader.followers;
    summary.aum += trader.aum;
    grouped.set(universityName, summary);
  }

  return Array.from(grouped.values())
    .map((summary) => {
      const divisor = Math.max(1, summary.totalTraders);
      return normalizeCompetitionUniversityRow({
        ...summary,
        totalReturnPercent: summary.totalReturnPercent / divisor,
        realizedReturnPercent: summary.realizedReturnPercent / divisor,
        unrealizedReturnPercent: summary.unrealizedReturnPercent / divisor,
        score: summary.score / divisor,
        avgTraderScore: summary.avgTraderScore / divisor,
        winRate: summary.winRate / divisor,
      }, 0);
    })
    .sort((left, right) => right.score - left.score || left.universityName.localeCompare(right.universityName))
    .map((university, index) => ({ ...university, rank: index + 1 }));
}

function normalizeCompetitionOverview(competition) {
  const source = competition && typeof competition === "object" ? competition : {};
  const archives = Array.isArray(source.archives) ? source.archives : [];
  const competitions = Array.isArray(source.competitions) ? source.competitions : [];
  const includedUniversities = Array.isArray(source.includedUniversities)
    ? source.includedUniversities.map((university) => String(university || "").trim()).filter(Boolean)
    : [];
  return {
    id: String(source.id || "uni-investment-2026"),
    name: String(source.name || "University Investment Challenge"),
    year: Math.max(2000, Math.min(2100, Math.floor(number(source.year, new Date().getUTCFullYear())))),
    region: String(source.region || "Scotland"),
    status: String(source.status || "active").toLowerCase(),
    startsAt: source.startsAt || null,
    endsAt: source.endsAt || null,
    startingBalance: number(source.startingBalance, 100000),
    includedUniversities,
    locked: Boolean(source.locked),
    archives: archives.map((archive, index) => ({
      id: String(archive?.id || `archive-${index + 1}`),
      competitionId: String(archive?.competitionId || source.id || "uni-investment-2026"),
      competitionName: String(archive?.competitionName || source.name || "University Investment Challenge"),
      archiveLabel: String(archive?.archiveLabel || archive?.competitionName || source.name || "University Investment Challenge"),
      year: Math.max(2000, Math.min(2100, Math.floor(number(archive?.year, source.year || new Date().getUTCFullYear())))),
      region: String(archive?.region || source.region || "Scotland"),
      status: String(archive?.status || "finished"),
      savedAt: archive?.savedAt || null,
      rowCount: Math.max(0, Math.floor(number(archive?.rowCount, 0))),
      note: archive?.note || null,
    })),
    competitions: competitions.map((competition, index) => ({
      id: String(competition?.id || `competition-${index + 1}`),
      name: String(competition?.name || "University Investment Challenge"),
      year: Math.max(2000, Math.min(2100, Math.floor(number(competition?.year, new Date().getUTCFullYear())))),
      region: String(competition?.region || "Scotland"),
      status: String(competition?.status || "scheduled").toLowerCase(),
      startsAt: competition?.startsAt || null,
      endsAt: competition?.endsAt || null,
      universityCount: Math.max(0, Math.floor(number(competition?.universityCount, 0))),
      archiveId: competition?.archiveId ? String(competition.archiveId) : null,
    })),
  };
}

function fetchJson(url, { timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "http:" ? http : https;
    const request = client.request(
      parsedUrl,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          let payload = {};
          try {
            payload = body ? JSON.parse(body) : {};
          } catch {
            payload = { message: body.slice(0, 240) };
          }
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            payload,
          });
        });
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    request.on("error", reject);
    request.end();
  });
}

async function fetchCompetitionData(env, { archiveId = "" } = {}) {
  const baseUrl = String(env.COMPETITION_API_BASE_URL || env.COMPETITION_APP_API_BASE_URL || "https://comp.turtletrades.co.uk").replace(/\/+$/, "");
  const limit = Math.max(1, Math.min(500, number(env.PUBLIC_COMPETITION_LEADERBOARD_LIMIT, 100)));
  const normalizedArchiveId = String(archiveId || "").trim();

  if (normalizedArchiveId) {
    const [overviewResponse, archiveResponse] = await Promise.allSettled([
      fetchJson(`${baseUrl}/app/competition/overview`),
      fetchJson(`${baseUrl}/app/competition/archive/${encodeURIComponent(normalizedArchiveId)}`),
    ]);

    if (archiveResponse.status !== "fulfilled" || !archiveResponse.value.ok) {
      const status = archiveResponse.status === "fulfilled" ? archiveResponse.value.status : "network_error";
      const payload = archiveResponse.status === "fulfilled" ? archiveResponse.value.payload : {};
      const message = payload?.error || payload?.message || `Competition archive API returned ${status}`;
      throw new Error(message);
    }

    const archive = archiveResponse.value.payload?.archive || {};
    const traders = Array.isArray(archiveResponse.value.payload?.traders) ? archiveResponse.value.payload.traders : [];
    const universityRows = Array.isArray(archiveResponse.value.payload?.universities) ? archiveResponse.value.payload.universities : [];
    const overview = overviewResponse.status === "fulfilled" && overviewResponse.value.ok
      ? normalizeCompetitionOverview(overviewResponse.value.payload?.competition)
      : normalizeCompetitionOverview({});
    const selectedArchive = normalizeCompetitionOverview({
      ...overview,
      id: archive.competitionId || overview.id,
      name: archive.competitionName || archive.archiveLabel || overview.name,
      year: archive.year || overview.year,
      region: archive.region || overview.region,
      status: "archived",
      startsAt: archive.startsAt || null,
      endsAt: archive.endsAt || null,
      startingBalance: archive.startingBalance || overview.startingBalance,
      includedUniversities: archive.includedUniversities || overview.includedUniversities,
      locked: true,
      archives: overview.archives,
    });
    selectedArchive.selectedArchive = {
      id: String(archive.id || normalizedArchiveId),
      competitionId: String(archive.competitionId || selectedArchive.id),
      competitionName: String(archive.competitionName || selectedArchive.name),
      archiveLabel: String(archive.archiveLabel || archive.competitionName || selectedArchive.name),
      year: selectedArchive.year,
      region: selectedArchive.region,
      status: "archived",
      savedAt: archive.savedAt || null,
      rowCount: Math.max(0, Math.floor(number(archive.rowCount, traders.length))),
      note: archive.note || null,
    };
    return {
      competition: selectedArchive,
      leaderboard: traders.map(normalizeCompetitionLeaderboardRow),
      universities: universityRows.map(normalizeCompetitionUniversityRow),
    };
  }

  const [overviewResponse, traderResponse, universityResponse] = await Promise.allSettled([
    fetchJson(`${baseUrl}/app/competition/overview`),
    fetchJson(`${baseUrl}/app/competition/traders?limit=${limit}`),
    fetchJson(`${baseUrl}/app/competition/universities?limit=${limit}`),
  ]);

  if (traderResponse.status !== "fulfilled" || !traderResponse.value.ok) {
    const status = traderResponse.status === "fulfilled" ? traderResponse.value.status : "network_error";
    const payload = traderResponse.status === "fulfilled" ? traderResponse.value.payload : {};
    const message = payload?.error || payload?.message || `Competition traders API returned ${status}`;
    throw new Error(message);
  }

  const traders = Array.isArray(traderResponse.value.payload?.traders) ? traderResponse.value.payload.traders : [];
  const leaderboard = traders.map(normalizeCompetitionLeaderboardRow);
  const universityRows = universityResponse.status === "fulfilled" && universityResponse.value.ok && Array.isArray(universityResponse.value.payload?.universities)
    ? universityResponse.value.payload.universities
    : [];
  const universities = universityRows.length
    ? universityRows.map(normalizeCompetitionUniversityRow)
    : buildUniversityRowsFromLeaderboard(leaderboard);
  return {
    competition: overviewResponse.status === "fulfilled" && overviewResponse.value.ok
      ? normalizeCompetitionOverview(overviewResponse.value.payload?.competition)
      : normalizeCompetitionOverview({}),
    leaderboard,
    universities,
  };
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
      const competitionData = await fetchCompetitionData(env, { archiveId: req.query?.archiveId });
      return res.json({
        ok: true,
        source: "university_competition",
        competition: competitionData.competition,
        leaderboard: competitionData.leaderboard,
        universities: competitionData.universities,
      });

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
          storedTrades: {
            where: {
              source: {
                not: "csv_import",
              },
            },
            orderBy: {
              exitTime: "desc",
            },
            select: {
              symbol: true,
              side: true,
              entryPrice: true,
              exitPrice: true,
              stopLoss: true,
              profit: true,
              commission: true,
              swap: true,
              updatedAt: true,
            },
          },
        },
      });

      const eligibleRows = users
        .map((user) => {
          if (user.storedTrades.length < LEADERBOARD_MINIMUM_VERIFIED_TRADES) {
            return null;
          }

          const tradeCount = user.storedTrades.length;
          const averageRiskPercent = calculateAverageRiskPercent(user.storedTrades);
          const verifiedPnl = calculateVerifiedCurrencyPnl(user.storedTrades);
          const totalR = calculateTotalR(user.storedTrades);
          const averageR = calculateAverageR(totalR, tradeCount);
          const profitFactor = calculateProfitFactor(user.storedTrades);
          const winRate = calculateWinRate(user.storedTrades);
          const latestTradeUpdatedAt = user.storedTrades[0]?.updatedAt || null;
          const lastUpdatedAt = latestTradeUpdatedAt || user.leaderboardPublishedAt || null;
          const fallbackName = [user.profile?.firstName, user.profile?.lastName]
            .filter((value) => typeof value === "string" && value.trim())
            .join(" ")
            .trim();

          return {
            id: user.id,
            displayName: user.leaderboardDisplayName || fallbackName || "Trader",
            market: resolveMarketSummary(user.storedTrades),
            totalTrades: tradeCount,
            averageRiskPercent,
            riskLevel: resolveRiskLevel(averageRiskPercent),
            verifiedPnl,
            totalR,
            averageR,
            profitFactor,
            winRate,
            lastUpdatedAt: lastUpdatedAt ? lastUpdatedAt.toISOString() : null,
            source: "journal",
          };
        })
        .filter(Boolean);

      const riskScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: typeof row.averageRiskPercent === "number" ? row.averageRiskPercent : 999999 })),
        { descending: false },
      );
      const tradeScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: row.totalTrades })),
        { descending: true },
      );
      const winRateScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: row.winRate })),
        { descending: true },
      );
      const avgRScores = calculatePercentileRanks(
        eligibleRows.map((row) => ({ id: row.id, value: typeof row.averageR === "number" ? row.averageR : -999999 })),
        { descending: true },
      );
      const performancePercentiles = calculatePercentileRanks(
        eligibleRows
          .filter((row) => typeof row.verifiedPnl === "number")
          .map((row) => ({ id: row.id, value: row.verifiedPnl })),
        { descending: true },
      );
      const percentilePnlMap = new Map(
        eligibleRows
          .filter((row) => typeof row.verifiedPnl === "number")
          .map((row, index) => [row.id, Math.round(performancePercentiles[index])])
      );

      const leaderboard = eligibleRows
        .map((row, index) => {
          const percentilePnl = percentilePnlMap.get(row.id) ?? null;
          return {
          ...row,
          percentilePnl,
          score:
            winRateScores[index] * 0.35 +
            avgRScores[index] * 0.30 +
            tradeScores[index] * 0.20 +
            riskScores[index] * 0.15,
        };
        })
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          return (right.winRate ?? 0) - (left.winRate ?? 0);
        })
        .map((row, index) => ({
          rank: index + 1,
          id: row.id,
          name: row.displayName,
          market: row.market,
          percentilePnl: row.percentilePnl,
          verifiedPnl: row.verifiedPnl !== null ? Number(row.verifiedPnl.toFixed(2)) : null,
          winRate: typeof row.winRate === "number" ? Number(row.winRate.toFixed(1)) : null,
          riskPerTradePercent:
            typeof row.averageRiskPercent === "number" ? Number(row.averageRiskPercent.toFixed(2)) : null,
          totalTrades: row.totalTrades,
          expectancyR: typeof row.averageR === "number" ? Number(row.averageR.toFixed(2)) : null,
          profitFactor:
            row.profitFactor === Infinity
              ? null
              : typeof row.profitFactor === "number" && Number.isFinite(row.profitFactor)
                ? Number(row.profitFactor.toFixed(2))
                : null,
          riskLevel: row.riskLevel,
          lastUpdatedAt: row.lastUpdatedAt,
          source: row.source,
        }));

      return res.json({
        ok: true,
        minimumTradeCount: LEADERBOARD_MINIMUM_VERIFIED_TRADES,
        leaderboard,
      });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/trader/apply", async (req, res, next) => {
    // Closed for FCA regulatory reasons.
    return res.status(403).json({ ok: false, error: "Trader applications are currently closed." });
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
    // Closed for FCA regulatory reasons.
    return res.status(403).json({ ok: false, error: "Investor waitlist signups are currently closed." });
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
