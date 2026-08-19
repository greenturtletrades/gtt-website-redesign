import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { Footer } from "./Footer";
import { fetchPublicLeaderboard } from "../../api/public";
import type { PublicLeaderboardRow, PublicUniversityLeaderboardRow } from "../../api/public";
import type { ViewType } from "../../seo/routes";

interface TurtleTradersPageProps {
  onNavigate?: (page: ViewType) => void;
}

type LeaderboardView = "traders" | "universities";
type SortOption = "topPerformers" | "winRate" | "returns" | "risk" | "followers";

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
  if (normalized.includes("low")) return "bg-[#ecfdf5] text-[#107949] border-[#bbf7d0]";
  if (normalized.includes("medium")) return "bg-[#fef9eb] text-[#d97706] border-[#fde68a]";
  if (normalized.includes("high")) return "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]";
  return "bg-white text-[#9ca3af] border-[#e5eaef]";
}

function riskTextClass(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("low")) return "text-[#107949]";
  if (normalized.includes("medium")) return "text-[#d97706]";
  if (normalized.includes("high")) return "text-[#dc2626]";
  return "text-[#9ca3af]";
}

function universityFilterButtonStyle(active: boolean): CSSProperties {
  return active
    ? {
        backgroundColor: "#0f6b45",
        borderColor: "#0f6b45",
        boxShadow: "0 8px 18px rgba(15, 107, 69, 0.2)",
        color: "#ffffff",
      }
    : {
        backgroundColor: "#e8f2ee",
        borderColor: "#b9d0c7",
        color: "#12372b",
      };
}

function leaderboardControlButtonStyle(active: boolean): CSSProperties {
  return active
    ? {
        backgroundColor: "#0f6b45",
        borderColor: "#0f6b45",
        boxShadow: "0 8px 18px rgba(15, 107, 69, 0.18)",
        color: "#ffffff",
      }
    : {
        backgroundColor: "#e8f2ee",
        borderColor: "#b9d0c7",
        color: "#12372b",
      };
}

function universityViewSwitchStyle(active: boolean): CSSProperties {
  return {
    alignSelf: "center",
    backgroundColor: active ? "#107949" : "#dbe7e2",
    borderColor: active ? "#107949" : "#9fb8ae",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: active ? "inset 0 2px 6px rgba(8, 47, 31, 0.22)" : "inset 0 2px 6px rgba(15, 23, 42, 0.12)",
    height: 28,
    overflow: "hidden",
    position: "relative",
    transform: "translateY(-1px)",
    width: 54,
  };
}

function universityViewKnobStyle(active: boolean): CSSProperties {
  return {
    backgroundColor: active ? "#ffffff" : "#334155",
    borderRadius: 999,
    boxShadow: active ? "0 2px 7px rgba(0, 0, 0, 0.22)" : "0 2px 7px rgba(15, 23, 42, 0.25)",
    height: 22,
    left: 3,
    position: "absolute",
    top: 2,
    transform: `translateX(${active ? 25 : 0}px)`,
    width: 22,
  };
}

function rankBadgeClass(rankIndex: number) {
  if (rankIndex === 0) return "bg-yellow-500 text-yellow-900";
  if (rankIndex === 1) return "bg-slate-400 text-slate-900";
  if (rankIndex === 2) return "bg-amber-700 text-amber-100";
  return "bg-white text-[#4b5563]";
}

function riskSortValue(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("low")) return 1;
  if (normalized.includes("medium")) return 2;
  if (normalized.includes("high")) return 3;
  return 4;
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

function PublicTraderProfile({ trader, onBack }: { trader: PublicLeaderboardRow; onBack: () => void }) {
  const totalReturnPositive = trader.totalReturnPercent >= 0;
  const realizedPositive = trader.realizedReturnPercent >= 0;
  const unrealizedPositive = trader.unrealizedReturnPercent >= 0;
  const hasOpenTrades = trader.openTrades > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
          aria-label="Back to leaderboard"
        >
          <ArrowLeft className="h-6 w-6 text-slate-950" />
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-3xl font-semibold text-teal-700">
            {trader.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-semibold text-slate-950">{trader.name}</h2>
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-teal-600" />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Competition performance is calculated from in-house university market execution data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${riskClass(trader.riskLabel)}`}>
                {trader.riskLabel} Risk
              </span>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {trader.universityName}
              </span>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                Rank #{trader.rank}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Performance</h3>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {["1M", "3M", "6M", "All"].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`rounded px-3 py-1 text-xs transition-colors ${filter === "All" ? "bg-teal-600 text-white" : "text-slate-600 hover:text-slate-950"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 h-44 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-full items-end gap-2">
            {[0.15, 0.34, 0.28, 0.52, 0.46, 0.7, 0.62, 0.86, 0.78, 1].map((height, index) => (
              <div
                key={index}
                className={`flex-1 rounded-t ${totalReturnPositive ? "bg-teal-500/70" : "bg-rose-500/70"}`}
                style={{ height: `${Math.max(8, height * 100)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Total Return</p>
            <p className={`text-lg font-semibold ${totalReturnPositive ? "text-emerald-600" : "text-rose-600"}`}>
              {formatSignedPercent(trader.totalReturnPercent)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Realized Return</p>
            <p className={`text-lg font-semibold ${realizedPositive ? "text-emerald-600" : "text-rose-600"}`}>
              {formatSignedPercent(trader.realizedReturnPercent)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Unrealized Return</p>
            <p className={`text-lg font-semibold ${unrealizedPositive ? "text-emerald-600" : "text-rose-600"}`}>
              {formatSignedPercent(trader.unrealizedReturnPercent)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Win Rate</p>
            <p className="text-lg font-semibold text-slate-950">{trader.winRate.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Score</p>
            <p className="text-lg font-semibold text-slate-950">{trader.score.toFixed(1)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Total Trades</p>
            <p className="text-lg font-semibold text-slate-950">{trader.totalTrades}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-950">Trading Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Activity className="h-4 w-4 text-slate-400" />
              Trading Frequency
            </div>
            <span className="text-sm font-medium text-slate-950">{trader.totalTrades ? `${trader.totalTrades} competition trades` : hasOpenTrades ? "No closed trades yet" : "No trades yet"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              Main Assets
            </div>
            <span className="text-right text-sm font-medium text-slate-950">{trader.mainAssets.length ? trader.mainAssets.join(", ") : "Building history"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Wallet className="h-4 w-4 text-slate-400" />
              Competition AUM
            </div>
            <span className="text-sm font-medium text-slate-950">{formatCompactCurrency(trader.aum)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4 text-slate-400" />
              Backers
            </div>
            <span className="text-sm font-medium text-slate-950">{formatInvestorCount(trader.followers)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
      >
        <BarChart3 className="h-5 w-5" />
        Advanced Analytics
      </button>

      {hasOpenTrades ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-950">Live Trades</h3>
            <span className="text-xs text-slate-500">{trader.openTrades} open</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            {trader.openTrades} active competition {trader.openTrades === 1 ? "trade" : "trades"} currently contribute to unrealized return.
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-950">Recent Trades</h3>
          <span className="text-sm text-teal-700">View All Trades</span>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Public trade rows are limited on the website. Full trade history is available inside the competition platform.
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs text-slate-500">Public Competition Profile</p>
              <h3 className="text-lg font-semibold text-slate-950">Investment actions disabled</h3>
            </div>
            <span className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${riskClass(trader.riskLabel)}`}>
              {trader.riskLabel}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Website visitors can inspect public competition performance. Trader-investing actions remain inside the secure competition app.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TurtleTradersPage({ onNavigate }: TurtleTradersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>("universities");
  const [sortBy, setSortBy] = useState<SortOption>("topPerformers");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedTrader, setSelectedTrader] = useState<PublicLeaderboardRow | null>(null);
  const [traders, setTraders] = useState<PublicLeaderboardRow[]>([]);
  const [universities, setUniversities] = useState<PublicUniversityLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    try {
      const response = await fetchPublicLeaderboard();
      setTraders(response.leaderboard);
      setUniversities(response.universities || []);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the university competition leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
  };

  const filteredTraders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const scoped = selectedUniversity
      ? traders.filter((trader) => trader.universityName === selectedUniversity)
      : traders;
    const searched = !query ? scoped : scoped.filter((trader) => (
      trader.name.toLowerCase().includes(query) ||
      trader.universityName.toLowerCase().includes(query) ||
      trader.mainAssets.some((asset) => asset.toLowerCase().includes(query))
    ));
    const sorted = searched.slice();
    if (sortBy === "topPerformers") {
      sorted.sort((a, b) => b.score - a.score || b.totalReturnPercent - a.totalReturnPercent || b.totalTrades - a.totalTrades);
    } else if (sortBy === "winRate") {
      sorted.sort((a, b) => b.winRate - a.winRate || b.score - a.score);
    } else if (sortBy === "returns") {
      sorted.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent || b.score - a.score);
    } else if (sortBy === "risk") {
      sorted.sort((a, b) => riskSortValue(a.riskLabel) - riskSortValue(b.riskLabel) || b.score - a.score);
    } else if (sortBy === "followers") {
      sorted.sort((a, b) => b.followers - a.followers || b.score - a.score);
    }
    return sortBy === "topPerformers" && !selectedUniversity ? sorted.slice(0, 5) : sorted;
  }, [searchTerm, selectedUniversity, sortBy, traders]);

  const visibleTraders = filteredTraders;
  const topTrader = traders[0] || null;
  const activeUniversities = universities.length || new Set(traders.map((trader) => trader.universityName).filter(Boolean)).size;
  const totalTrades = universities.length
    ? universities.reduce((sum, university) => sum + university.trades, 0)
    : traders.reduce((sum, trader) => sum + trader.totalTrades, 0);
  const totalBackers = universities.length
    ? universities.reduce((sum, university) => sum + university.followers, 0)
    : traders.reduce((sum, trader) => sum + trader.followers, 0);

  return (
    <div className="min-h-screen bg-white">
      <section
        className="w-full bg-[#fafbfc] px-4 pb-14 text-[#111827] sm:px-6 sm:pb-18"
        style={{ paddingTop: "clamp(9.5rem, 12vw, 12rem)" }}
      >
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

          <div className="mx-auto mt-12 max-w-6xl">
            {selectedTrader ? (
              <PublicTraderProfile trader={selectedTrader} onBack={() => setSelectedTrader(null)} />
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by name, strategy, or assets..."
                      className="w-full rounded-xl border border-[#e5eaef] bg-white py-3 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#107949] focus:outline-none focus:ring-2 focus:ring-[#107949]/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#e5eaef] bg-white text-[#4b5563] transition-colors hover:bg-[#fafbfc] disabled:opacity-60"
                    aria-label="Refresh leaderboard"
                  >
                    <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                  <div className="flex h-12 flex-shrink-0 items-center gap-3 rounded-xl border border-[#d9e2e8] bg-white px-3 shadow-sm">
                    <span className="whitespace-nowrap text-sm font-semibold text-[#334155]">Uni view</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={leaderboardView === "universities"}
                      aria-label="Toggle university view"
                      onClick={() => {
                        setLeaderboardView(leaderboardView === "traders" ? "universities" : "traders");
                        setSelectedUniversity("");
                        if (leaderboardView === "universities") setSortBy("topPerformers");
                      }}
                      style={universityViewSwitchStyle(leaderboardView === "universities")}
                      className="flex-shrink-0 cursor-pointer p-0 transition-transform active:scale-95"
                    >
                      <span
                        style={universityViewKnobStyle(leaderboardView === "universities")}
                        className="transition-transform duration-200 ease-out"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {leaderboardView === "traders" ? (
                    <>
                      {[
                        ["topPerformers", "Top Performers"],
                        ["winRate", "Win Rate"],
                        ["returns", "Returns"],
                        ["risk", "Risk"],
                        ["followers", "Followers"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSortBy(value as SortOption)}
                          aria-pressed={sortBy === value}
                          style={leaderboardControlButtonStyle(sortBy === value)}
                          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-all hover:-translate-y-px hover:brightness-[0.98] active:translate-y-0"
                        >
                          {value === "topPerformers" ? <Trophy className="h-3.5 w-3.5" /> : null}
                          {label}
                          {["winRate", "returns", "risk", "followers"].includes(value) ? <ArrowUpDown className="h-3.5 w-3.5" /> : null}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedUniversity("")}
                        aria-pressed={!selectedUniversity}
                        style={universityFilterButtonStyle(!selectedUniversity)}
                        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-all hover:-translate-y-px hover:brightness-[0.98] active:translate-y-0"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Total Uni Overview
                      </button>
                      {universities.map((university) => (
                        <button
                          key={university.universityName}
                          type="button"
                          onClick={() => setSelectedUniversity(university.universityName)}
                          aria-pressed={selectedUniversity === university.universityName}
                          style={universityFilterButtonStyle(selectedUniversity === university.universityName)}
                          className="flex-shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-all hover:-translate-y-px hover:brightness-[0.98] active:translate-y-0"
                        >
                          {university.universityName}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-3">
                    <div className="h-12 animate-pulse rounded-xl border border-slate-200 bg-white" />
                    <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
                    <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
                  </div>
                ) : null}

                {!loading && loadError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">{loadError}</div>
                ) : null}

                {leaderboardView === "universities" && selectedUniversity ? (
                  <div className="rounded-xl border border-[#e5eaef] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-950">{selectedUniversity} participant rankings</p>
                        <p className="text-xs text-slate-600">Sorted by competition score.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUniversity("")}
                        className="text-sm font-medium text-teal-700 hover:underline"
                      >
                        Uni overview
                      </button>
                    </div>
                  </div>
                ) : null}

                {leaderboardView === "universities" && !selectedUniversity && !loading && !loadError ? (
                  <div className="space-y-2.5">
                    {universities.map((university, index) => {
                      const isPositive = university.totalReturnPercent >= 0;
                      return (
                        <button
                          key={university.universityName}
                          type="button"
                          onClick={() => setSelectedUniversity(university.universityName)}
                          className="w-full rounded-lg border border-[#e5eaef] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#fafbfc] sm:p-5"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${rankBadgeClass(index)}`}>
                              {index < 3 ? <span className="text-xl">{rankBadge(index + 1)}</span> : <span className="text-sm font-semibold">#{index + 1}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h4 className="truncate text-base font-semibold text-[#111827]">{university.universityName}</h4>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4b5563]">
                                    <span>{university.activeTraders} active / {university.totalTraders}</span>
                                    <span>Return <span className={isPositive ? "text-[#107949]" : "text-[#dc2626]"}>{formatSignedPercent(university.totalReturnPercent, 2)}</span></span>
                                    <span>
                                      R <span className={university.realizedReturnPercent >= 0 ? "text-[#107949]" : "text-[#dc2626]"}>{formatSignedPercent(university.realizedReturnPercent, 2)}</span>
                                      {" "}· U <span className={university.unrealizedReturnPercent >= 0 ? "text-[#107949]" : "text-[#dc2626]"}>{formatSignedPercent(university.unrealizedReturnPercent, 2)}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-[0.6875rem] text-slate-500">Score</p>
                                  <p className="text-base font-semibold leading-tight text-[#111827]">{university.score.toFixed(1)}</p>
                                </div>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
                                <div><p className="text-[0.6875rem] text-slate-500">Trader Score</p><p className="text-sm text-slate-950">{university.avgTraderScore.toFixed(1)}</p></div>
                                <div><p className="text-[0.6875rem] text-slate-500">Win Rate</p><p className="text-sm text-slate-950">{university.winRate.toFixed(1)}%</p></div>
                                <div><p className="text-[0.6875rem] text-slate-500">Risk</p><p className={`text-sm ${riskTextClass(university.riskLabel)}`}>{university.riskLabel}</p></div>
                                <div><p className="text-[0.6875rem] text-slate-500">Trades</p><p className="text-sm text-slate-950">{university.trades}</p></div>
                                <div><p className="text-[0.6875rem] text-slate-500">Backers</p><p className="text-sm text-slate-950">{university.followers}</p></div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {(leaderboardView === "traders" || selectedUniversity) && !loading && !loadError ? (
                  <div className="space-y-2.5">
                    {visibleTraders.map((trader, index) => {
                      const isPositive = trader.totalReturnPercent >= 0;
                      const showRankBadge = sortBy === "topPerformers" || leaderboardView === "universities";
                      return (
                        <button
                          key={trader.id}
                          type="button"
                          onClick={() => setSelectedTrader(trader)}
                          className={`w-full rounded-lg border border-[#e5eaef] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#fafbfc] sm:p-5 ${showRankBadge && index < 3 ? "bg-[#fafbfc]" : ""}`}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${showRankBadge ? rankBadgeClass(index) : "bg-teal-50 text-teal-700"}`}>
                              {showRankBadge && index < 3 ? <span className="text-xl">{rankBadge(index + 1)}</span> : showRankBadge ? <span className="text-sm font-semibold">#{index + 1}</span> : <span className="text-base font-semibold">{trader.initials}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  {showRankBadge ? <span className="mr-1 flex-shrink-0 text-base">{trader.initials}</span> : null}
                                  <h4 className="truncate text-base font-semibold text-slate-950">{trader.name}</h4>
                                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-teal-600" />
                                </div>
                              </div>
                              <p className="mb-3 text-xs text-slate-500">{trader.universityName}</p>
                              <div className={`${showRankBadge ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-4"} mb-3 grid gap-x-4 gap-y-2`}>
                                {showRankBadge ? <div><p className="text-xs text-slate-500">Score</p><p className="text-sm text-slate-950">{trader.score.toFixed(1)}</p></div> : null}
                                <div><p className="text-xs text-slate-500">Win Rate</p><p className="text-sm text-slate-950">{trader.winRate.toFixed(1)}%</p></div>
                                <div><p className="text-xs text-slate-500">Avg Return</p><p className={`text-sm ${trader.avgReturn >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatSignedPercent(trader.avgReturn, 2)}</p></div>
                                <div><p className="text-xs text-slate-500">Total Return</p><p className={`text-sm ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>{formatSignedPercent(trader.totalReturnPercent, 2)}</p></div>
                                <div><p className="text-xs text-slate-500">Risk</p><p className={`text-sm ${riskTextClass(trader.riskLabel)}`}>{trader.riskLabel}</p></div>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                                <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />{formatCompactCurrency(trader.aum)} competition AUM</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatInvestorCount(trader.followers)}</span>
                                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{trader.totalTrades} trades</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {visibleTraders.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        No traders found.
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
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
