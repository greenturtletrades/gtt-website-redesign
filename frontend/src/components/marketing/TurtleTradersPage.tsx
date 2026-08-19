import { useEffect, useMemo, useState } from "react";
import { Trophy, Users, Wallet, TrendingUp, ShieldCheck, Search, GraduationCap } from "lucide-react";
import { Footer } from "./Footer";
import { fetchPublicLeaderboard } from "../../api/public";
import type { PublicLeaderboardRow, PublicUniversityLeaderboardRow } from "../../api/public";
import type { ViewType } from "../../seo/routes";

interface TurtleTradersPageProps {
  onNavigate?: (page: ViewType) => void;
}

function formatSignedPercent(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return "0.00%";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(decimals)}%`;
}

function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return "£0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatInvestorCount(value: number) {
  return `${value} ${value === 1 ? "backer" : "backers"}`;
}

function rankBadge(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function riskClass(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("low")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized.includes("medium")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized.includes("high")) return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function riskTextClass(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("low")) return "text-emerald-600";
  if (normalized.includes("medium")) return "text-amber-600";
  if (normalized.includes("high")) return "text-rose-600";
  return "text-slate-500";
}

function formatRelativeTimestamp(value: string | null) {
  if (!value) return "Live";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Live";
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Live";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function TurtleTradersPage({ onNavigate }: TurtleTradersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [traders, setTraders] = useState<PublicLeaderboardRow[]>([]);
  const [universities, setUniversities] = useState<PublicUniversityLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        const response = await fetchPublicLeaderboard();
        if (cancelled) return;
        setTraders(response.leaderboard);
        setUniversities(response.universities || []);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load the university competition leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTraders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const scoped = selectedUniversity
      ? traders.filter((trader) => trader.universityName === selectedUniversity)
      : traders;
    if (!query) return scoped;
    return scoped.filter((trader) => (
      trader.name.toLowerCase().includes(query) ||
      trader.universityName.toLowerCase().includes(query)
    ));
  }, [searchTerm, selectedUniversity, traders]);

  const visibleTraders = showAllRows || searchTerm.trim() ? filteredTraders : filteredTraders.slice(0, 8);
  const hasHiddenRows = !searchTerm.trim() && filteredTraders.length > 8;
  const topTrader = traders[0] || null;
  const activeUniversities = universities.length || new Set(traders.map((trader) => trader.universityName).filter(Boolean)).size;
  const totalTrades = universities.length
    ? universities.reduce((sum, university) => sum + university.trades, 0)
    : traders.reduce((sum, trader) => sum + trader.totalTrades, 0);
  const totalBackers = universities.length
    ? universities.reduce((sum, university) => sum + university.followers, 0)
    : traders.reduce((sum, trader) => sum + trader.followers, 0);

  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="w-full bg-[#f8fafc] px-4 py-14 text-slate-950 sm:px-6 sm:py-18">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mx-auto max-w-4xl text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Scotland&apos;s next generation of investors, ranked live.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-8 text-slate-700 sm:text-lg">
              The university competition gives Scottish students a risk-free place to learn practical investing,
              build discipline, and gain market experience before real capital is on the line. The leaderboard below
              is powered by live in-house competition data from the Green Turtle platform.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Top Competitor</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{topTrader?.name || "Loading"}</div>
                <div className="mt-1 text-sm text-slate-600">{topTrader?.universityName || "University competition"}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Live Score</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{topTrader ? topTrader.score.toFixed(1) : "0.0"}</div>
                <div className="mt-1 text-sm text-slate-600">Score from competition engine</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Universities</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{activeUniversities}</div>
                <div className="mt-1 text-sm text-slate-600">Represented on the board</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Competition Activity</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{totalTrades}</div>
                <div className="mt-1 text-sm text-slate-600">{formatInvestorCount(totalBackers)} following traders</div>
              </div>
          </div>

          <div className="mt-12 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">University Leaderboard</div>
                <div className="mt-1 text-xs text-slate-300">Ranked from central university competition scoring</div>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search trader or university"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedUniversity("")}
                className={`flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  !selectedUniversity
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                Total Uni Overview
              </button>
              {universities.map((university) => (
                <button
                  key={university.universityName}
                  type="button"
                  onClick={() => setSelectedUniversity(university.universityName)}
                  className={`flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedUniversity === university.universityName
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {university.universityName}
                </button>
              ))}
              <div className="ml-auto hidden items-center text-sm font-medium text-slate-500 sm:flex">Uni view</div>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-slate-600">Loading university competition leaderboard...</div>
              ) : null}

              {!loading && loadError ? (
                <div className="px-5 py-10 text-center text-sm text-red-600">{loadError}</div>
              ) : null}

              {!loading && !loadError && !selectedUniversity && universities.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-600">No competition traders match that search.</div>
              ) : null}

              {!selectedUniversity && universities.map((university) => {
                const isPositive = university.totalReturnPercent >= 0;
                return (
                  <article
                    key={university.universityName}
                    className="bg-white px-5 py-5 transition-colors hover:bg-teal-50/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-lg font-semibold text-teal-800">
                        {rankBadge(university.rank)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold text-slate-950">{university.universityName}</h2>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>{university.activeTraders} active / {university.totalTraders}</span>
                              <span>
                                Return <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>{formatSignedPercent(university.totalReturnPercent)}</span>
                              </span>
                              <span>
                                R <span className={university.realizedReturnPercent >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatSignedPercent(university.realizedReturnPercent)}</span>
                                {" "}· U <span className={university.unrealizedReturnPercent >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatSignedPercent(university.unrealizedReturnPercent)}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xs text-slate-500">Score</div>
                            <div className="text-lg font-semibold tabular-nums text-slate-950">{university.score.toFixed(1)}</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-5">
                          <div>
                            <div className="text-[0.6875rem] text-slate-500">Trader Score</div>
                            <div className="text-sm text-slate-950">{university.avgTraderScore.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-[0.6875rem] text-slate-500">Win Rate</div>
                            <div className="text-sm text-slate-950">{university.winRate.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-[0.6875rem] text-slate-500">Risk</div>
                            <div className={`text-sm ${riskTextClass(university.riskLabel)}`}>{university.riskLabel}</div>
                          </div>
                          <div>
                            <div className="text-[0.6875rem] text-slate-500">Trades</div>
                            <div className="text-sm text-slate-950">{university.trades}</div>
                          </div>
                          <div>
                            <div className="text-[0.6875rem] text-slate-500">Backers</div>
                            <div className="text-sm text-slate-950">{university.followers}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {selectedUniversity && visibleTraders.length === 0 && !loading && !loadError ? (
                <div className="px-5 py-10 text-center text-sm text-slate-600">No traders found for {selectedUniversity}.</div>
              ) : null}

              {selectedUniversity && visibleTraders.map((trader) => {
                const isPositive = trader.totalReturnPercent >= 0;
                return (
                  <article key={trader.id} className="bg-white px-5 py-5 transition-colors hover:bg-teal-50/40">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-lg font-semibold text-teal-800">
                          {trader.rank <= 3 ? rankBadge(trader.rank) : trader.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-950">{trader.name}</h2>
                            <ShieldCheck className="h-4 w-4 text-teal-600" />
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{trader.universityName}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {trader.mainAssets.length ? trader.mainAssets.map((asset) => (
                              <span key={`${trader.id}-${asset}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                                {asset}
                              </span>
                            )) : (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                                Building history
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
                        <div>
                          <div className="text-xs text-slate-500">Score</div>
                          <div className="mt-1 text-base font-semibold tabular-nums text-slate-950">{trader.score.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Win Rate</div>
                          <div className="mt-1 text-base font-semibold tabular-nums text-slate-950">{trader.winRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Avg Return</div>
                          <div className={`mt-1 text-base font-semibold tabular-nums ${trader.avgReturn >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatSignedPercent(trader.avgReturn)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Total Return</div>
                          <div className={`mt-1 text-base font-semibold tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatSignedPercent(trader.totalReturnPercent)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 lg:w-[25rem] lg:justify-end">
                        <span className={`rounded-full border px-3 py-1 font-medium ${riskClass(trader.riskLabel)}`}>{trader.riskLabel}</span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="h-3.5 w-3.5" />
                          {formatCompactCurrency(trader.aum)} AUM
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {formatInvestorCount(trader.followers)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {trader.totalTrades} closed / {trader.openTrades} open
                        </span>
                        <span>{formatRelativeTimestamp(trader.lastUpdatedAt)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedUniversity && hasHiddenRows ? (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllRows((current) => !current)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  {showAllRows ? "Show Top 8" : "Show Full Leaderboard"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Trophy className="h-5 w-5 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Risk-free learning</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Students trade with virtual capital, so they can build practical experience without risking personal money.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <GraduationCap className="h-5 w-5 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">University pride</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Competitors represent their university while learning portfolio discipline, risk control, and market behaviour.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Central scoring</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Public rankings use the same competition engine as the app, so website visitors see the live official board.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
