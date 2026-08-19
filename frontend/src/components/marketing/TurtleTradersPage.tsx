import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  BarChart3,
  ExternalLink,
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
import type { PublicCompetitionOverview, PublicLeaderboardRow, PublicUniversityLeaderboardRow } from "../../api/public";
import type { ViewType } from "../../seo/routes";

interface TurtleTradersPageProps {
  onNavigate?: (page: ViewType) => void;
}

type LeaderboardView = "traders" | "universities";
type SortOption = "topPerformers" | "winRate" | "returns" | "risk" | "followers";

const competitionAppUrl =
  (import.meta.env.VITE_COMPETITION_APP_URL as string | undefined) || "https://comp.turtletrades.co.uk";

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

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "£0.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatInvestorCount(value: number) {
  return `${value} ${value === 1 ? "backer" : "backers"}`;
}

function formatPublicCompetitionDate(value: string | null) {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/London",
    year: "numeric",
  }).format(date);
}

function competitionPhaseLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "testing") return "Testing competition";
  if (normalized === "scheduled" || normalized === "draft") return "Scheduled competition";
  if (normalized === "active") return "Live competition";
  if (normalized === "finished" || normalized === "archived") return "Archived competition";
  return "Competition setup";
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

function signedValueTextStyle(value: number): CSSProperties {
  if (value > 0) return { color: "#107949" };
  if (value < 0) return { color: "#dc2626" };
  return { color: "#0f172a" };
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

function formatShortTradeDate(value: string | null) {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  }).format(date);
}

function buildPerformancePath(points: Array<{ value: number }>) {
  const values = points.map((point) => point.value).filter(Number.isFinite);
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function PublicTraderProfile({ trader, onBack }: { trader: PublicLeaderboardRow; onBack: () => void }) {
  const totalReturnPositive = trader.totalReturnPercent >= 0;
  const hasOpenTrades = trader.openTrades > 0;
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const performancePoints = Array.isArray(trader.performanceData) ? trader.performanceData.filter((point) => Number.isFinite(point.value)) : [];
  const performanceValues = performancePoints.map((point) => point.value).filter(Number.isFinite);
  const performanceMin = performanceValues.length ? Math.min(...performanceValues) : 0;
  const performanceMax = performanceValues.length ? Math.max(...performanceValues) : 0;
  const performancePath = buildPerformancePath(performancePoints);
  const performanceAreaPath = performancePath ? `${performancePath} L 100 100 L 0 100 Z` : "";
  const recentTrades = Array.isArray(trader.recentTrades) ? trader.recentTrades : [];

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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
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

        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex h-20 gap-2">
            {performancePath ? (
              <>
                <div className="flex w-12 flex-col justify-between py-0.5 text-[0.625rem] leading-none text-slate-500">
                  <span>{formatSignedPercent(performanceMax, 2)}</span>
                  <span>{formatSignedPercent(performanceMin, 2)}</span>
                </div>
                <div className="relative min-w-0 flex-1">
                  <div className="absolute inset-0 grid grid-rows-2">
                    {[0, 1].map((line) => (
                      <div key={line} className="border-t border-slate-200/70" />
                    ))}
                  </div>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative h-full w-full overflow-visible">
                    <path
                      d={performanceAreaPath}
                      fill={totalReturnPositive ? "rgba(13, 148, 136, 0.12)" : "rgba(225, 29, 72, 0.12)"}
                    />
                    <path
                      d={performancePath}
                      fill="none"
                      stroke={totalReturnPositive ? "#0d9488" : "#e11d48"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-1 items-center justify-center text-center text-xs text-slate-500">
                No public performance chart available yet.
              </div>
            )}
            </div>
          <div className="mt-1 text-right text-[0.6875rem] text-slate-500">
            {performancePoints.length
              ? `${formatShortTradeDate(performancePoints[0]?.date || null)} - ${formatShortTradeDate(performancePoints[performancePoints.length - 1]?.date || null)}`
              : "Performance preview"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Total Return</p>
            <p className="text-lg font-semibold" style={signedValueTextStyle(trader.totalReturnPercent)}>
              {formatSignedPercent(trader.totalReturnPercent)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Realized Return</p>
            <p className="text-lg font-semibold" style={signedValueTextStyle(trader.realizedReturnPercent)}>
              {formatSignedPercent(trader.realizedReturnPercent)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Unrealized Return</p>
            <p className="text-lg font-semibold" style={signedValueTextStyle(trader.unrealizedReturnPercent)}>
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

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvancedPrompt(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <BarChart3 className="h-5 w-5" />
          Advanced Analytics
        </button>
        {showAdvancedPrompt ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-950">Please log in to your account to view advanced analytics.</div>
            <p className="mt-1 leading-6">
              Full analytics, expanded trade history, and account actions are available inside the secure university competition app.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = competitionAppUrl;
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Open competition login
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

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

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-950">Recent Trades</h3>
          <button
            type="button"
            onClick={() => setShowAdvancedPrompt(true)}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            View All Trades
          </button>
        </div>
        {recentTrades.length ? (
          <div className="space-y-2">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${trade.side === "SHORT" ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`}>
                    {trade.side === "SHORT" ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">{trade.symbol}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {trade.side} · {formatShortTradeDate(trade.exitTime || trade.entryTime)}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold" style={signedValueTextStyle(trade.pnlPercent)}>
                    {formatSignedPercent(trade.pnlPercent)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatCurrency(trade.pnl)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            No public recent trades available yet.
          </div>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Public trade rows are limited on the website. Full trade history is available inside the competition platform.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs text-slate-500">Public Competition Profile</p>
              <h3 className="text-lg font-semibold text-slate-950">Log in or sign up to follow this trader</h3>
            </div>
            <span className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${riskClass(trader.riskLabel)}`}>
              {trader.riskLabel}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Website visitors can inspect public competition performance here. Following and account actions happen inside the secure university competition app.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = competitionAppUrl;
            }}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 sm:w-auto"
          >
            Open competition login
            <ExternalLink className="h-4 w-4" />
          </button>
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
  const [competition, setCompetition] = useState<PublicCompetitionOverview | null>(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    try {
      const response = await fetchPublicLeaderboard(selectedArchiveId || undefined);
      setTraders(response.leaderboard);
      setUniversities(response.universities || []);
      setCompetition(response.competition || null);
      setLoadError(null);
      setSelectedTrader(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the university competition leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadLeaderboard();
  }, [selectedArchiveId]);

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
  const topUniversity = universities[0] || null;
  const selectedArchive = competition?.selectedArchive || null;

  return (
    <div className="min-h-screen bg-white">
      <section
        className="relative w-full overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50/70 px-4 pb-24 text-[#111827] sm:px-6 sm:pb-32"
        style={{ paddingTop: "clamp(9.5rem, 12vw, 12rem)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d94880a_1px,transparent_1px),linear-gradient(to_bottom,#0891b20a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mx-auto max-w-4xl text-4xl leading-tight text-slate-950 sm:text-5xl md:text-6xl">
              Scotland&apos;s next generation of investors, ranked live.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base font-medium leading-8 text-slate-700 sm:text-lg">
              The university competition gives Scottish students a risk-free place to learn practical investing,
              build discipline, and gain market experience before real capital is on the line. The leaderboard below
              is powered by live in-house competition data from the Green Turtle platform.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-white/90 p-5 text-left shadow-[0_18px_44px_rgba(15,107,69,0.10)] backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase text-slate-500">Top Individual Performer</div>
                    <div className="mt-3 truncate text-2xl font-semibold text-slate-950">{topTrader?.name || "Loading"}</div>
                    <div className="mt-1 text-sm text-slate-600">{topTrader?.universityName || "University competition"}</div>
                  </div>
                  <div className="flex h-11 min-w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white px-3">
                    <span className="text-[0.6875rem] font-semibold text-slate-500">Score</span>
                    <span className="text-base font-semibold text-[#107949]">{topTrader ? topTrader.score.toFixed(1) : "0.0"}</span>
                  </div>
                </div>
                {topTrader ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-slate-500">Win Rate</p><p className="font-semibold text-slate-950">{topTrader.winRate.toFixed(1)}%</p></div>
                    <div><p className="text-xs text-slate-500">Return</p><p className="font-semibold" style={signedValueTextStyle(topTrader.totalReturnPercent)}>{formatSignedPercent(topTrader.totalReturnPercent, 2)}</p></div>
                    <div><p className="text-xs text-slate-500">Risk</p><p className={`font-semibold ${riskTextClass(topTrader.riskLabel)}`}>{topTrader.riskLabel}</p></div>
                  </div>
                ) : null}
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-cyan-200/80 bg-white/90 p-5 text-left shadow-[0_18px_44px_rgba(8,145,178,0.10)] backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-800 via-teal-700 to-cyan-500" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase text-slate-500">Top University</div>
                    <div className="mt-3 truncate text-2xl font-semibold text-slate-950">{topUniversity?.universityName || "Loading"}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {topUniversity ? `${topUniversity.activeTraders} active / ${topUniversity.totalTraders} competitors` : "University leaderboard"}
                    </div>
                  </div>
                  <div className="flex h-11 min-w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white px-3">
                    <span className="text-[0.6875rem] font-semibold text-slate-500">Score</span>
                    <span className="text-base font-semibold text-[#107949]">{topUniversity ? topUniversity.score.toFixed(1) : "0.0"}</span>
                  </div>
                </div>
                {topUniversity ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-slate-500">Win Rate</p><p className="font-semibold text-slate-950">{topUniversity.winRate.toFixed(1)}%</p></div>
                    <div><p className="text-xs text-slate-500">Return</p><p className="font-semibold" style={signedValueTextStyle(topUniversity.totalReturnPercent)}>{formatSignedPercent(topUniversity.totalReturnPercent, 2)}</p></div>
                    <div><p className="text-xs text-slate-500">Backers</p><p className="font-semibold text-slate-950">{topUniversity.followers}</p></div>
                  </div>
                ) : null}
              </div>
          </div>

          <div className="mx-auto mt-12 max-w-6xl">
            {selectedTrader ? (
              <PublicTraderProfile trader={selectedTrader} onBack={() => setSelectedTrader(null)} />
            ) : (
              <div className="space-y-4">
                <div
                  className="grid items-center gap-2 rounded-2xl border border-white/80 bg-white/85 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.08)] backdrop-blur"
                  style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}
                >
                  <div className="relative min-w-0">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by name, strategy, or assets..."
                      className="w-full rounded-xl border border-transparent bg-white/70 py-3 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#107949] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#107949]/20"
                    />
                  </div>
                  <div className="flex flex-shrink-0 justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#d9e2e8] bg-white text-[#4b5563] shadow-sm transition-colors hover:bg-[#f8fbfa] disabled:opacity-60"
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
                  <div className="rounded-xl border border-teal-200 bg-white/90 p-4 shadow-sm backdrop-blur">
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
                      return (
                        <button
                          key={university.universityName}
                          type="button"
                          onClick={() => setSelectedUniversity(university.universityName)}
                          className="w-full rounded-lg border border-[#d9e2e8] bg-white/90 p-4 text-left shadow-sm transition-all hover:border-teal-200 hover:bg-white hover:shadow-md sm:p-5"
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
                                    <span>Return <span style={signedValueTextStyle(university.totalReturnPercent)}>{formatSignedPercent(university.totalReturnPercent, 2)}</span></span>
                                    <span>
                                      R <span style={signedValueTextStyle(university.realizedReturnPercent)}>{formatSignedPercent(university.realizedReturnPercent, 2)}</span>
                                      {" "}· U <span style={signedValueTextStyle(university.unrealizedReturnPercent)}>{formatSignedPercent(university.unrealizedReturnPercent, 2)}</span>
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
                      const showRankBadge = sortBy === "topPerformers" || leaderboardView === "universities";
                      return (
                        <button
                          key={trader.id}
                          type="button"
                          onClick={() => setSelectedTrader(trader)}
                          className={`w-full rounded-lg border border-[#d9e2e8] bg-white/90 p-4 text-left shadow-sm transition-all hover:border-teal-200 hover:bg-white hover:shadow-md sm:p-5 ${showRankBadge && index < 3 ? "bg-gradient-to-br from-white to-teal-50/40" : ""}`}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${showRankBadge ? rankBadgeClass(index) : "bg-teal-50 text-teal-700"}`}>
                              {showRankBadge && index < 3 ? <span className="text-xl">{rankBadge(index + 1)}</span> : showRankBadge ? <span className="text-sm font-semibold">#{index + 1}</span> : <span className="text-base font-semibold">{trader.initials}</span>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <h4 className="truncate text-base font-semibold text-slate-950">{trader.name}</h4>
                                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-teal-600" />
                                </div>
                              </div>
                              <p className="mb-3 text-xs text-slate-500">{trader.universityName}</p>
                              <div className={`${showRankBadge ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-4"} mb-3 grid gap-x-4 gap-y-2`}>
                                {showRankBadge ? <div><p className="text-xs text-slate-500">Score</p><p className="text-sm text-slate-950">{trader.score.toFixed(1)}</p></div> : null}
                                <div><p className="text-xs text-slate-500">Win Rate</p><p className="text-sm text-slate-950">{trader.winRate.toFixed(1)}%</p></div>
                                <div><p className="text-xs text-slate-500">Avg Return</p><p className="text-sm" style={signedValueTextStyle(trader.avgReturn)}>{formatSignedPercent(trader.avgReturn, 2)}</p></div>
                                <div><p className="text-xs text-slate-500">Total Return</p><p className="text-sm" style={signedValueTextStyle(trader.totalReturnPercent)}>{formatSignedPercent(trader.totalReturnPercent, 2)}</p></div>
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

          <div className="mx-auto mt-6 max-w-6xl rounded-xl border border-white/80 bg-white/85 px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-[#b9d0c7] bg-[#e8f2ee] px-2.5 py-1 font-semibold text-[#12372b]">
                {competition ? competitionPhaseLabel(competition.status) : "Competition setup"}
              </span>
              <span className="rounded-full bg-white/80 px-2.5 py-1 font-semibold text-slate-950">{selectedArchive?.archiveLabel || competition?.name || "University Investment Challenge"}</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">{competition?.region || "Scotland"} {competition?.year || new Date().getFullYear()}</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">Starts {formatPublicCompetitionDate(competition?.startsAt || null)}</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">Ends {formatPublicCompetitionDate(competition?.endsAt || null)}</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">{competition?.includedUniversities?.length || universities.length || 0} universities</span>
              {competition?.archives?.length ? (
                <span className="rounded-full bg-white/80 px-2.5 py-1">{competition.archives.length} archived {competition.archives.length === 1 ? "competition" : "competitions"}</span>
              ) : null}
            </div>
            {competition?.archives?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedArchiveId("")}
                  aria-pressed={!selectedArchiveId}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    !selectedArchiveId
                      ? "border-[#107949] bg-[#107949] text-white"
                      : "border-[#d9e2e8] bg-white text-slate-700 hover:border-[#107949]/50"
                  }`}
                >
                  Current leaderboard
                </button>
                {competition.archives.map((archive) => (
                  <button
                    key={archive.id}
                    type="button"
                    onClick={() => setSelectedArchiveId(archive.id)}
                    aria-pressed={selectedArchiveId === archive.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedArchiveId === archive.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-[#d9e2e8] bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {archive.archiveLabel}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3" style={{ marginBottom: "clamp(4.5rem, 7vw, 7rem)" }}>
            <div className="rounded-xl border border-teal-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
              <Trophy className="h-5 w-5 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Risk-free learning</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Students trade with virtual capital, so they can build practical experience without risking personal money.
              </p>
            </div>
            <div className="rounded-xl border border-cyan-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
              <GraduationCap className="h-5 w-5 text-cyan-700" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">University pride</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Competitors represent their university while learning portfolio discipline, risk control, and market behaviour.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
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
