import { useEffect, useState } from "react";
import { Footer } from "./Footer";
import { fetchPublicLeaderboard } from "../../api/public";
import type { PublicLeaderboardRow } from "../../api/public";

interface TurtleTradersPageProps {
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

const scoringModel = [
  {
    name: "Win Rate",
    weight: "35%",
    detail: "Win rate shows how often a trader closes positions profitably across verified journal history. It matters because consistency is easier to trust than one or two standout trades.",
  },
  {
    name: "Risk Per Trade",
    weight: "30%",
    detail: "We place significant weight on how much capital is being risked on each trade. Traders who keep risk controlled rank better than traders who try to manufacture performance through oversized exposure.",
  },
  {
    name: "Total Trades",
    weight: "20%",
    detail: "A larger verified trade sample gives more confidence in the result. This helps prevent a trader from ranking highly based on only a small number of successful trades.",
  },
  {
    name: "Expectancy",
    weight: "15%",
    detail: "Expectancy is the average R-multiple per trade. It shows the average edge a trader produces each time they take risk, which makes it a strong measure of trade quality over time.",
  },
];

function riskPillClass(riskLevel: string) {
  if (riskLevel === "Low") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (riskLevel === "Medium") {
    return "bg-amber-100 text-amber-700";
  }

  if (riskLevel === "N/A") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-rose-100 text-rose-700";
}

function formatRiskPercent(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value.toFixed(2)}%`;
}

function formatWinRate(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value.toFixed(1)}%`;
}

function formatExpectancy(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${value.toFixed(2)}R`;
}

function formatProfitFactor(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return value.toFixed(2);
}

function splitMarketSummary(value: string) {
  return String(value)
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatRelativeTimestamp(value: string | null) {
  if (!value) {
    return "Just updated";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Just updated";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function TurtleTradersPage({ onNavigateLegal }: TurtleTradersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllRows, setShowAllRows] = useState(false);
  const [traders, setTraders] = useState<PublicLeaderboardRow[]>([]);
  const [minimumTradeCount, setMinimumTradeCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        const response = await fetchPublicLeaderboard();
        if (cancelled) {
          return;
        }

        setTraders(response.leaderboard);
        setMinimumTradeCount(response.minimumTradeCount);
        setLoadError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Unable to load the public leaderboard.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTraders = traders.filter((trader) => {
    if (!normalizedSearch) {
      return true;
    }

    return trader.name.toLowerCase().includes(normalizedSearch);
  });

  const visibleTraders = showAllRows || normalizedSearch ? filteredTraders : filteredTraders.slice(0, 5);
  const hasHiddenRows = !normalizedSearch && filteredTraders.length > 5;

  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50 py-16 sm:py-20 px-4 sm:px-6 relative overflow-hidden text-slate-950">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-teal-200 to-cyan-200 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-tr from-cyan-200 to-teal-200 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-12 text-center">
            <h1 className="text-4xl leading-tight text-slate-900 sm:text-5xl md:text-6xl tracking-tight">Turtle Traders Leaderboard</h1>
            <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
              Verified data matters. Traders choose whether to publish summary performance from their own imported account data. Raw trades stay private.
            </p>
          </div>

          <div className="mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex flex-col gap-2 border-b border-teal-200 bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white">Ranked by verified account data</div>
            </div>
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-slate-600">
                  Search Trader
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by trader name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              {hasHiddenRows ? (
                <button
                  type="button"
                  onClick={() => setShowAllRows((current) => !current)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  {showAllRows ? "Show Top 5" : "Show Full Leaderboard"}
                </button>
              ) : null}
            </div>
            <div className="overflow-x-auto p-2 sm:p-3">
              <table className="w-full md:min-w-[1160px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-4 text-left text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:px-3 md:px-5 md:text-[11px] md:tracking-[0.2em]">Rank</th>
                    <th className="px-2 py-4 text-left text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:px-3 md:px-5 md:text-[11px] md:tracking-[0.2em]">Trader</th>
                    <th className="hidden px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600 md:table-cell">Market</th>
                    <th className="px-2 py-4 text-right text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:px-3 md:px-5 md:text-[11px] md:tracking-[0.2em]">Win Rate</th>
                    <th className="hidden px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600 md:table-cell">Profit Factor</th>
                    <th className="px-2 py-4 text-right text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:px-3 md:px-5 md:text-[11px] md:tracking-[0.2em]">Risk Per Trade</th>
                    <th className="px-2 py-4 text-right text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:px-3 md:px-5 md:text-[11px] md:tracking-[0.2em]">Total Trades</th>
                    <th className="hidden px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600 md:table-cell">Expectancy</th>
                    <th className="px-2 py-4 text-center text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:px-3 md:px-5 md:text-[11px] md:tracking-[0.2em]">Risk Level</th>
                    <th className="hidden px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600 md:table-cell">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-600">
                        Loading public leaderboard...
                      </td>
                    </tr>
                  ) : null}
                  {!loading && loadError ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-8 text-center text-sm text-red-600">
                        {loadError}
                      </td>
                    </tr>
                  ) : null}
                  {!loading && !loadError && visibleTraders.length === 0 && !normalizedSearch ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-8 text-center text-sm text-slate-600">
                        No public trader performance has been published yet.
                      </td>
                    </tr>
                  ) : null}
                  {visibleTraders.map((trader) => {
                    return (
                    <tr key={trader.id} className="border-t border-slate-100 transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/60">
                      <td className="px-2 py-4 text-xs font-semibold tabular-nums text-slate-900 sm:px-3 sm:text-sm md:px-5">
                        {trader.rank}
                      </td>
                      <td className="px-2 py-4 sm:px-3 md:px-5">
                        <div>
                          <div className="text-xs font-semibold text-slate-950 sm:text-sm">{trader.name}</div>
                          <div className="hidden text-xs uppercase tracking-[0.16em] text-slate-500 sm:block">
                            {trader.source === "analysis" ? "Verified Analysis" : "Verified Journal"}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-4 md:table-cell">
                        <div className="flex max-w-[220px] flex-wrap gap-2">
                          {splitMarketSummary(trader.market).map((market) => (
                            <span
                              key={`${trader.id}-${market}`}
                              className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                            >
                              {market}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-4 text-right sm:px-3 md:px-5">
                        <div className="text-xs font-semibold tabular-nums text-slate-950 sm:text-sm md:text-base">{formatWinRate(trader.winRate)}</div>
                      </td>
                      <td className="hidden px-5 py-4 text-right text-base font-medium tabular-nums text-slate-950 md:table-cell">{formatProfitFactor(trader.profitFactor)}</td>
                      <td className="px-2 py-4 text-right text-xs font-medium tabular-nums text-slate-950 sm:px-3 sm:text-sm md:px-5 md:text-base">{formatRiskPercent(trader.riskPerTradePercent)}</td>
                      <td className="px-2 py-4 text-right text-xs font-medium tabular-nums text-slate-950 sm:px-3 sm:text-sm md:px-5 md:text-base">{trader.totalTrades}</td>
                      <td className="hidden px-5 py-4 text-right text-base font-medium tabular-nums text-slate-950 md:table-cell">{formatExpectancy(trader.expectancyR)}</td>
                      <td className="px-2 py-4 text-center sm:px-3 md:px-5">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium sm:px-3 sm:text-xs ${riskPillClass(trader.riskLevel)}`}>
                          {trader.riskLevel}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-4 text-right text-sm tabular-nums text-slate-700 md:table-cell">{formatRelativeTimestamp(trader.lastUpdatedAt)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {normalizedSearch && visibleTraders.length === 0 ? (
              <div className="border-t border-slate-200 px-6 py-5 text-sm text-slate-600">
                No verified traders match that search yet.
              </div>
            ) : null}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-slate-950 shadow-lg">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
                  Scoring model
                </div>
                <h3 className="text-2xl text-slate-900">How we decide who is best</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  The leaderboard is not built around one lucky month or one impressive screenshot. It is designed to reward traders who show strong verified performance over time, manage risk with discipline, and do it across a meaningful sample of real trades.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {scoringModel.map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm uppercase tracking-[0.16em] text-slate-600">{item.name}</div>
                  <div className="mt-3 text-3xl text-slate-900">{item.weight}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
              In practice, this means the strongest traders are not simply the ones showing the biggest headline gain. The better rank goes to the trader combining win rate, expectancy, meaningful sample size, and controlled risk. Profit factor is shown as extra context because it helps explain how efficiently a trader converts wins versus losses.
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigateLegal={onNavigateLegal} />
    </div>
  );
}
