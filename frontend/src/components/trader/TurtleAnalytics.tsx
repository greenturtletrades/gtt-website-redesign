import { TrendingUp, TrendingDown, Activity, Target, Clock, AlertTriangle, Zap, RefreshCw, Brain, CheckCircle, Award, Shield, XCircle, Calendar, Percent, BarChart3, TrendingUpDown, Layers, Settings, GitBranch, Filter, BookOpen, Sparkles, Lock, ChevronRight, Maximize2, Minimize2, X, PoundSterling, ChevronDown, ChevronUp, Trash2, Monitor } from "lucide-react";
import { UserType } from "../../App";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie, ComposedChart, ReferenceLine } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { TraderJournal } from "./TraderJournal";
import { motion } from "motion/react";
import { ProfileDropdown } from "./ProfileDropdown";
import { SettingsPage } from "./SettingsPage";
import { ApiError, API_BASE, clearStoredToken } from "../../api/client";
import { deleteAnalysisRun, fetchAnalysisOptions, fetchTradeData, importCsvTradeData, pollAnalysisJob, startAnalysis, startCsvAnalysis, startMt5Analysis } from "../../api/analysis";
import { fetchAccountState, fetchPersistedAnalysisState, type PersistedAnalysisStateResponse } from "../../api/settings";

interface TurtleAnalyticsProps {
  userType: UserType;
  subscriptionTier?: "payg" | "premium";
  subscriptionStatus?: "active" | "paused" | "cancelling" | "not_started" | "trialing";
  mlModelAccessEnabled?: boolean;
  onSignUp?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onPauseSubscription?: () => void;
  onResumeSubscription?: () => void;
}

export function TurtleAnalytics({
  userType,
  subscriptionTier = "payg",
  subscriptionStatus = "not_started",
  mlModelAccessEnabled = false,
  onSignUp,
  onLogout,
  onPauseSubscription,
  onResumeSubscription,
}: TurtleAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "journal" | "history" | "settings" | "guide">(
    () => (mlModelAccessEnabled ? "analytics" : "journal")
  );
  const [isRunningModel, setIsRunningModel] = useState(false);
  const [isFetchingTradeData, setIsFetchingTradeData] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [showRunModelModal, setShowRunModelModal] = useState(false);
  const [selectedTradeCount, setSelectedTradeCount] = useState(565);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [analysisMode, setAnalysisMode] = useState<"trades" | "months" | "csv" | "mt5">("trades");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [replaceCsvDataset, setReplaceCsvDataset] = useState(false);
  const [mt5Login, setMt5Login] = useState("");
  const [mt5Password, setMt5Password] = useState("");
  const [mt5Server, setMt5Server] = useState("");
  const [mt5Days, setMt5Days] = useState(90);
  const [mt5Symbol, setMt5Symbol] = useState("");
  const [statsData, setStatsData] = useState({ tradesAnalysed: 0, simulationsRun: 0, regimesFound: 0, avgRMultiple: 0 });
  const [reportData, setReportData] = useState<any>(null);
  const [modelRunError, setModelRunError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [runHistoryError, setRunHistoryError] = useState<string | null>(null);
  const [storedJournalEntries, setStoredJournalEntries] = useState<any[]>([]);
  const [storedJournalPnlMeta, setStoredJournalPnlMeta] = useState<any>(null);
  const [currentUserName, setCurrentUserName] = useState("Trader");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [analysisOptions, setAnalysisOptions] = useState<{
    availableTradeCount: number;
    minimumTradeCount: number;
    recommendedTradeCount: number;
    mlRunDiscountPercent: number;
    accountDiscountPercent: number;
    referralCode: string | null;
    latestAnalysis: { updatedAt?: string | null; tradesAnalysed?: number | null } | null;
  }>({
    availableTradeCount: 0,
    minimumTradeCount: 10,
    recommendedTradeCount: 200,
    mlRunDiscountPercent: 0,
    accountDiscountPercent: 0,
    referralCode: null,
    latestAnalysis: null,
  });

  const formatAccountMetric = (value: number | null) =>
    value === null || !Number.isFinite(value)
      ? "Not available"
      : `${value >= 0 ? "+" : "-"}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const derived = useMemo(() => {
    if (!reportData) {
      return {
        currentPnl: "Not available",
        optimisedPnl: "Not available",
        gainPnl: "Not available",
        avgR: "0.00",
        winRate: "0",
        bestAvgR: "0.00",
        improvementPct: "0.0",
        avgPerTrade: "0",
        bestAvgPerTrade: "0",
        ci: "0.00",
        slMult: "0.0",
        tpMult: "0.0",
        optimisationFoundEdge: false,
        optimisationHeadline: "No consistent optimisation edge found yet",
        optimisationSubtext: "Run more trades to improve optimisation stability",
        improvementDisplay: "Not available",
      improvementSubtext: "No improvement baseline available yet",
        equityLabel: "Cumulative R",
        recs: [],
        bestRegimeAvgR: "0.00",
        topActionLabel: "Run analysis to generate recommendations",
        bestHoursLabel: "Not available yet",
        bestHoursSubtext: "Import more trade timing data to rank hours",
        marketRegimes: [],
        rMultipleData: [],
        equityCurveData: [],
        hasOptimisedEquityCurve: false,
        sessionPerformance: [],
        holdTimeResults: [],
        riskFractionResults: [],
        consecutiveLossData: [],
        mfeAnalysis: [],
        mfeMaePoints: [],
        counterfactualResults: [],
        trailingStopResults: [],
        combinedStrategy: null,
      };
    }

    const orig = reportData.summary?.original_performance ?? {};
    const best = reportData.summary?.best_performance ?? {};
    const policy = reportData.global_policy?.best_policy ?? {};
    const conf = reportData.global_policy?.confidence ?? {};
    const originalAvgR = typeof orig.avg_r === "number" ? orig.avg_r : 0;
    const n = orig.n_trades ?? 0;
    const bestAvgR =
      typeof reportData.global_policy?.performance?.avg_r === "number"
        ? reportData.global_policy.performance.avg_r
        : typeof best.avg_r === "number"
          ? best.avg_r
          : originalAvgR;
    const bestTotalR =
      typeof reportData.global_policy?.performance?.total_r === "number"
        ? reportData.global_policy.performance.total_r
        : typeof reportData.summary?.best_performance?.total_r === "number"
          ? reportData.summary.best_performance.total_r
          : null;
    const journalEntries = reportData.trade_analytics?.journal_entries ?? [];
    const pnlMeta = reportData.trade_analytics?.pnl_metadata ?? {};
    const hasCurrencyPnl = pnlMeta.currency_pnl_available === true;
    const totalCurrencyPnl = hasCurrencyPnl
      ? journalEntries.reduce((sum: number, entry: any) => sum + (typeof entry.result === "number" ? entry.result : 0), 0)
      : null;
    const optimisedCurrencyPnl =
      typeof reportData.global_policy?.performance?.total_currency_pnl === "number"
        ? reportData.global_policy.performance.total_currency_pnl
        : null;
    const gain =
      totalCurrencyPnl !== null && optimisedCurrencyPnl !== null
        ? optimisedCurrencyPnl - totalCurrencyPnl
        : typeof bestTotalR === "number" && typeof orig.total_r === "number"
          ? bestTotalR - orig.total_r
          : null;
    const impPct =
      totalCurrencyPnl !== null && optimisedCurrencyPnl !== null && totalCurrencyPnl !== 0
        ? (((optimisedCurrencyPnl - totalCurrencyPnl) / Math.abs(totalCurrencyPnl)) * 100).toFixed(1)
        : originalAvgR !== 0
          ? (((bestAvgR - originalAvgR) / Math.abs(originalAvgR)) * 100).toFixed(1)
          : "0.0";
    const ciVal = conf.ci_95_upper && conf.ci_95_lower
      ? ((conf.ci_95_upper - conf.ci_95_lower) / 2).toFixed(2)
      : "0.08";
    const slM = policy.sl_mult?.toFixed(1) ?? "1.0";
    const tpM = policy.tp_mult?.toFixed(1) ?? "2.0";
    const optimisationFoundEdge = bestAvgR > originalAvgR && bestAvgR > 0;

    const strategyIsUnprofitable =
      (typeof totalCurrencyPnl === "number" && totalCurrencyPnl < 0) ||
      (typeof orig.total_r === "number" && orig.total_r < 0) ||
      originalAvgR < 0;

    const profitabilityRecommendation = strategyIsUnprofitable
      ? {
          bold: "Current strategy is unprofitable in this run",
          rest:
            " — Focus on the least negative regime, strongest session, and tighter risk controls before scaling this setup.",
          source: "Run summary",
        }
      : null;

    const bestRegimeAvgR = reportData.regimes?.regime_details?.length
      ? Math.max(...reportData.regimes.regime_details.map((r: any) => r.performance?.avg_r ?? 0)).toFixed(2)
      : "0.00";

    const regimeColors = [
      "bg-emerald-50 border-emerald-300 text-emerald-700",
      "bg-teal-50 border-teal-300 text-teal-700",
      "bg-cyan-50 border-cyan-300 text-cyan-700",
      "bg-slate-100 border-slate-300 text-slate-700",
      "bg-red-50 border-red-300 text-red-700",
    ];
    const formatRegimeFeatureLabel = (key: string) =>
      key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const marketRegimes = reportData.regimes?.regime_details?.length
      ? (() => {
          const rows = [...reportData.regimes.regime_details];
          const ranked = [...rows].sort((a: any, b: any) => (b.performance?.avg_r ?? 0) - (a.performance?.avg_r ?? 0));
          const bestRegimeId = ranked[0]?.regime_id ?? null;
          const worstRegimeId = ranked[ranked.length - 1]?.regime_id ?? null;
          return rows.map((r: any, i: number) => {
          const avgRNum = r.performance?.avg_r ?? 0;
          const colorIdx = avgRNum > 1.0 ? 0 : avgRNum > 0.5 ? 1 : avgRNum > 0.2 ? 2 : avgRNum > 0 ? 3 : 4;
          const op = r.optimal_policy ?? {};
          const featureText = Object.entries(r.characteristics ?? {})
            .filter(([key]) => !["avg_r", "win_rate", "n_trades"].includes(key))
            .slice(0, 2)
            .map(([key, value]) => `${formatRegimeFeatureLabel(key)}: ${typeof value === "number" ? (value as number).toFixed(3) : value}`)
            .join(", ");
          return {
            regime: r.regime_type ?? `Regime ${r.regime_id}`,
            regimeId: r.regime_id,
            avgR: avgRNum.toFixed(2),
            winRate: `${Math.round((r.performance?.win_rate ?? 0) * 100)}%`,
            trades: r.n_trades ?? 0,
            features: featureText || "No stable regime features available",
            bestSL: op.sl_mult ? `${(op.sl_mult as number).toFixed(1)}R` : "—",
            bestTP: op.tp_mult ? `${(op.tp_mult as number).toFixed(1)}R` : "—",
            coverage: `${Math.round((r.percentage ?? 0) * 100)}% of trades`,
            color: regimeColors[colorIdx] ?? regimeColors[i % regimeColors.length],
            isBest: r.regime_id === bestRegimeId,
            isWorst: r.regime_id === worstRegimeId,
          };
        });
      })()
      : [];
    const bestRegimeCard = marketRegimes.find((regime: any) => regime.isBest) ?? null;
    const worstRegimeCard = marketRegimes.find((regime: any) => regime.isWorst) ?? null;

    const rMultipleData = reportData.trade_analytics?.r_distribution?.length
      ? reportData.trade_analytics.r_distribution
      : [];

    const hasOptimisedEquityCurve =
      Array.isArray(reportData.trade_analytics?.optimized_equity_curve) &&
      reportData.trade_analytics.optimized_equity_curve.length > 0;
    const optimisationComparisonUsesR =
      hasOptimisedEquityCurve &&
      !reportData.trade_analytics.optimized_equity_curve.some((pt: any) => typeof pt.cumulative_pnl === "number");
    const equityCurveData = reportData.trade_analytics?.equity_curve?.length
      ? (() => {
          const usesCurrencyCurve =
            !optimisationComparisonUsesR &&
            reportData.trade_analytics.equity_curve.some((pt: any) => typeof pt.cumulative_pnl === "number");
          const optimizedCurveByTrade = hasOptimisedEquityCurve
            ? new Map(
                reportData.trade_analytics.optimized_equity_curve.map((pt: any) => [
                  pt.trade,
                  usesCurrencyCurve && typeof pt.cumulative_pnl === "number"
                    ? Number(pt.cumulative_pnl.toFixed(2))
                    : Number((pt.cumulative_r ?? 0).toFixed(3)),
                ])
              )
            : null;
          return reportData.trade_analytics.equity_curve.map((pt: any) => ({
            trade: pt.trade,
            actual: usesCurrencyCurve && typeof pt.cumulative_pnl === "number"
              ? Number(pt.cumulative_pnl.toFixed(2))
              : Number((pt.cumulative_r ?? 0).toFixed(3)),
            optimised: optimizedCurveByTrade?.get(pt.trade),
          }));
        })()
      : [];

    const sessionPerformance = reportData.trade_analytics?.session_performance?.length
      ? (() => {
          const rows = reportData.trade_analytics.session_performance;
          return rows.map((s: any, index: number) => {
            const isBest = index === 0;

            const status = isBest
              ? "Best"
              : s.avg_r < 0
                ? "Avoid"
                : s.avg_r > 0
                  ? "Positive"
                  : "Flat";

            return ({
            session: s.session,
            avgR: s.avg_r.toFixed(2),
            trades: s.trades,
            winRate: `${Math.round(s.win_rate * 100)}%`,
            pnl:
              typeof s.total_currency_pnl === "number"
                ? formatAccountMetric(s.total_currency_pnl)
                : typeof s.total_r === "number"
                  ? `${s.total_r.toFixed(2)}R`
                  : "—",
            status,
            isBest,
            rawAvgR: s.avg_r,
            rawWinRate: s.win_rate,
          });
          });
        })()
      : [];
    const bestSession = sessionPerformance[0] ?? null;

    const holdTimeResults = reportData.trade_analytics?.hold_time_distribution?.length
      ? (() => {
          const rows = reportData.trade_analytics.hold_time_distribution;
          const maxR = Math.max(...rows.map((r: any) => r.avg_r));
          return rows.map((r: any) => ({
            duration: r.duration,
            avgR: `${r.avg_r.toFixed(2)}R`,
            count: r.count,
            status: r.avg_r === maxR ? "Highest Avg R" : r.avg_r < 0 ? "Negative Avg R" : "—",
            isOptimal: r.avg_r === maxR,
          }));
        })()
      : [];

    const riskFractionResults = (() => {
      const riskRec = reportData.risk_recommendations ?? {};
      const kelly = riskRec.kelly_criterion ?? {};
      const maxDrawdownR = riskRec.risk_metrics?.max_drawdown_r;
      const rows: Array<{
        riskPct: string;
        basis: string;
        maxDD: string;
        status: string;
        isCurrent: boolean;
      }> = [];

      if (typeof riskRec.suggested_risk_fraction === "number") {
        rows.push({
          riskPct: `${(riskRec.suggested_risk_fraction * 100).toFixed(2)}%`,
          basis: "Variance-adjusted Kelly",
          maxDD: typeof maxDrawdownR === "number" ? `${Math.abs(maxDrawdownR).toFixed(2)}R` : "—",
          status: "Recommended",
          isCurrent: true,
        });
      }

      if (typeof kelly.half_kelly === "number") {
        rows.push({
          riskPct: `${(kelly.half_kelly * 100).toFixed(2)}%`,
          basis: "Half Kelly",
          maxDD: typeof maxDrawdownR === "number" ? `${Math.abs(maxDrawdownR).toFixed(2)}R` : "—",
          status: "Conservative",
          isCurrent: false,
        });
      }

      if (typeof kelly.full_kelly === "number") {
        rows.push({
          riskPct: `${(kelly.full_kelly * 100).toFixed(2)}%`,
          basis: "Full Kelly",
          maxDD: typeof maxDrawdownR === "number" ? `${Math.abs(maxDrawdownR).toFixed(2)}R` : "—",
          status: "Aggressive",
          isCurrent: false,
        });
      }

      return rows;
    })();

    const consecutiveLossData = reportData.trade_analytics?.consecutive_loss_analysis?.length
      ? reportData.trade_analytics.consecutive_loss_analysis.map((r: any) => ({
          lossStreak: r.loss_streak,
          headline:
            r.loss_streak === "1 Loss"
              ? "After exactly 1 loss"
              : r.loss_streak === "2 Losses"
                ? "After exactly 2 losses"
                : r.loss_streak === "3 Losses"
                  ? "After exactly 3 losses"
                  : "After 4+ losses",
          occurrences: r.occurrences,
          nextWins: r.next_wins ?? Math.round((r.next_win_rate ?? 0) * (r.occurrences ?? 0)),
          nextWinRate: `${Math.round(r.next_win_rate * 100)}%`,
          nextAvgR: `${r.next_avg_r >= 0 ? "+" : ""}${r.next_avg_r.toFixed(2)}R`,
        }))
      : [];

    const mfeAnalysis = reportData.trade_analytics?.mfe_mae_analysis?.length
      ? reportData.trade_analytics.mfe_mae_analysis.map((r: any) => ({
          category: r.category,
          avgRRaw: Number(r.avg_r ?? 0),
          avgMFERaw: r.avg_mfe != null ? Number(r.avg_mfe) : null,
          avgMAERaw: r.avg_mae != null ? Number(r.avg_mae) : null,
          avgMFE: r.avg_mfe != null ? `${r.avg_mfe.toFixed(2)}R` : "N/A",
          avgMAE: r.avg_mae != null ? `${r.avg_mae.toFixed(2)}R` : "N/A",
          count: r.count,
          insight:
            r.category === "Wins"
              ? `Winners averaged ${r.avg_r.toFixed(2)}R with ${r.avg_mae != null ? Math.abs(r.avg_mae).toFixed(2) + "R" : "minimal"} pullback`
              : r.category === "Losses"
                ? `Losing trades averaged ${r.avg_r.toFixed(2)}R before exit`
                : `Breakeven trades averaged ${r.avg_r.toFixed(2)}R with mixed excursion before exit`,
        }))
      : [];
    const mfeMaePoints = reportData.trade_analytics?.mfe_mae_points?.length
      ? reportData.trade_analytics.mfe_mae_points.map((point: any) => ({
          tradeId: point.trade_id ?? null,
          mae: Number(point.mae ?? 0),
          mfe: Number(point.mfe ?? 0),
          result: point.result === "Win" ? "Win" : point.result === "Breakeven" ? "Breakeven" : "Loss",
          r: Number(point.r ?? 0),
        }))
      : [];
    const exitEfficiencyChartData = mfeAnalysis.map((item: any) => ({
      category: item.category,
      realisedR: item.avgRRaw,
      avgMFE: item.avgMFERaw,
      avgMAE: item.avgMAERaw,
    }));

    const counterfactualResults = (() => {
      const trialRows = reportData.optimization_results?.trial_rows;
      if (!Array.isArray(trialRows) || trialRows.length === 0) return [];
      return trialRows.slice(0, 5).map((row: any, idx: number) => {
        const ciHalfWidth =
          typeof row.ci_lower === "number" && typeof row.ci_upper === "number"
            ? ((row.ci_upper - row.ci_lower) / 2).toFixed(2)
            : ciVal;
        return {
          sl: `${Number(row.sl_mult ?? 0).toFixed(3)}R`,
          tp: `${Number(row.tp_mult ?? 0).toFixed(3)}R`,
          trail: typeof row.trail_pct === "number" ? `${(row.trail_pct * 100).toFixed(1)}%` : "—",
          maxHold: row.max_hold_minutes == null ? "None" : `${row.max_hold_minutes}m`,
          avgR: Number(row.avg_r ?? 0).toFixed(2),
          totalR: typeof row.total_r === "number" ? `${row.total_r.toFixed(2)}R` : "—",
          winRate:
            typeof row.win_rate === "number" ? `${(row.win_rate * 100).toFixed(1)}%` : "—",
          wins:
            typeof row.win_count === "number" && typeof row.n_trades === "number"
              ? `${row.win_count}/${row.n_trades}`
              : "—",
          winRateDelta:
            typeof row.delta_win_rate === "number"
              ? `${row.delta_win_rate >= 0 ? "+" : ""}${(row.delta_win_rate * 100).toFixed(1)} pts`
              : "—",
          changedTrades:
            typeof row.pct_changed === "number" ? `${Math.round(row.pct_changed * 100)}%` : "—",
          confidence: `±${ciHalfWidth}`,
          status: idx === 0 ? "Best tested policy" : "Observed trial",
          isCurrent: false,
          isRecommended: idx === 0,
        };
      });
    })();
    const bestTrialRow = counterfactualResults[0] ?? null;
    const trailingStopResults = (() => {
      const rows = reportData.optimization_results?.trailing_stop_rows;
      if (!Array.isArray(rows) || rows.length === 0) return [];
      return rows.map((row: any) => ({
        threshold:
          typeof row.trail_pct === "number" && row.trail_pct > 0
            ? `${(row.trail_pct * 100).toFixed(1)}%`
            : "No trailing",
        avgR: Number(row.avg_r ?? 0).toFixed(2),
        winRate: typeof row.win_rate === "number" ? `${Math.round(row.win_rate * 100)}%` : "—",
        maxHold: row.max_hold_minutes == null ? "None" : `${row.max_hold_minutes}m`,
        policies: typeof row.count === "number" ? row.count.toString() : "—",
        status: row.status ?? "Observed",
      }));
    })();
    const combinedStrategy = (() => {
      const block = reportData.combined_strategy_optimization;
      if (!block) return null;
      const filters = block.filters ?? {};
      const policyBlock = block.policy ?? {};
      const historical = block.historical_performance ?? {};
      const simulated = block.simulated_performance ?? {};
      const coverage = block.coverage ?? {};
      const supporting = block.supporting_context ?? {};
      const formatPct = (value: number | null | undefined, digits = 1) =>
        typeof value === "number" ? `${(value * 100).toFixed(digits)}%` : "—";
      const formatR = (value: number | null | undefined) =>
        typeof value === "number" ? `${value.toFixed(2)}R` : "—";
      const formatPnl = (value: number | null | undefined, fallback?: number | null | undefined) =>
        typeof value === "number"
          ? formatAccountMetric(value)
          : typeof fallback === "number"
            ? `${fallback.toFixed(2)}R`
            : "—";
      return {
        scope: block.scope ?? "all analysed trades",
        summaryText: `Trade ${filters.time_range ?? "the strongest time range"}${filters.regime ? ` in ${filters.regime} conditions` : ""}, hold up to ${policyBlock.max_hold_minutes == null ? "your normal trade duration" : `${policyBlock.max_hold_minutes}m`}, and manage risk with ${typeof policyBlock.sl_mult === "number" ? `${policyBlock.sl_mult.toFixed(3)}R SL` : "the tested stop"} / ${typeof policyBlock.tp_mult === "number" ? `${policyBlock.tp_mult.toFixed(3)}R TP` : "the tested target"}${typeof policyBlock.trail_pct === "number" ? ` / ${(policyBlock.trail_pct * 100).toFixed(1)}% trail` : ""}.`,
        profileRows: [
          { label: "Time Range", value: filters.time_range ?? "—" },
          { label: "Regime", value: filters.regime ?? "Any regime" },
          { label: "Historical Hold Bucket", value: filters.hold_bucket ?? "—" },
          { label: "Stop Loss", value: typeof policyBlock.sl_mult === "number" ? `${policyBlock.sl_mult.toFixed(3)}R` : "—" },
          { label: "Take Profit", value: typeof policyBlock.tp_mult === "number" ? `${policyBlock.tp_mult.toFixed(3)}R` : "—" },
          { label: "Trail", value: typeof policyBlock.trail_pct === "number" ? `${(policyBlock.trail_pct * 100).toFixed(1)}%` : "—" },
          { label: "Max Hold", value: policyBlock.max_hold_minutes == null ? "None" : `${policyBlock.max_hold_minutes}m` },
          { label: "Risk Per Trade", value: typeof policyBlock.risk_fraction === "number" ? `${(policyBlock.risk_fraction * 100).toFixed(2)}%` : "—" },
        ],
        summaryCards: [
          {
            label: "Matched Trades",
            value: `${coverage.matched_trades ?? 0}`,
            subtext: `out of ${coverage.total_trades ?? 0} analysed trades`,
          },
          {
            label: "Coverage",
            value: formatPct(coverage.coverage_pct),
            subtext: supporting.best_hold_bucket_avg_r != null
              ? `${supporting.best_hold_bucket_avg_r.toFixed(2)}R best historical hold bucket`
              : "Coverage of the filtered setup",
          },
          {
            label: "Simulated Avg R",
            value: formatR(simulated.avg_r),
            subtext: typeof simulated.win_rate === "number" ? `${(simulated.win_rate * 100).toFixed(1)}% simulated win rate` : "Simulated on the matched slice",
          },
        ],
        scopeLabel:
          block.scope === "time + regime"
            ? "Built from the overlap of your best time range and best regime."
            : block.scope === "time only"
              ? "Built from your best time range only because the regime overlap was too small."
              : block.scope === "regime only"
                ? "Built from your best regime only because the time-range overlap was too small."
                : "Built from the full analysed trade set because the narrower overlap was too small.",
        metricsRows: [
          {
            label: "Original setup",
            trades: historical.trades ?? 0,
            avgR: formatR(historical.avg_r),
            winRate: formatPct(historical.win_rate),
            total: formatPnl(historical.total_currency_pnl, historical.total_r),
          },
          {
            label: "Optimised setup",
            trades: simulated.trades ?? 0,
            avgR: formatR(simulated.avg_r),
            winRate: formatPct(simulated.win_rate),
            total: formatPnl(simulated.total_currency_pnl, simulated.total_r),
          },
        ],
        warnings: Array.isArray(block.warnings) ? block.warnings : [],
      };
    })();
    const recommendationCards = (() => {
      const cards: Array<{ bold: string; rest: string; source: string }> = [];

      if (strategyIsUnprofitable && profitabilityRecommendation) {
        cards.push(profitabilityRecommendation);
      }

      if (bestTrialRow && optimisationFoundEdge) {
        cards.push({
          bold: `Best tested policy: ${bestTrialRow.sl} SL / ${bestTrialRow.tp} TP / ${bestTrialRow.trail} trail`,
          rest: ` — Averaged ${bestTrialRow.avgR}R per trade across ${statsData.tradesAnalysed.toLocaleString()} analysed trades, with ${bestTrialRow.changedTrades} of trades exiting differently.`,
          source: "Policy optimisation",
        });
      }

      if (bestRegimeCard) {
        cards.push({
          bold: `Best performance in ${bestRegimeCard.regime}`,
          rest: ` — ${bestRegimeCard.avgR}R avg across ${bestRegimeCard.trades} trades with ${bestRegimeCard.winRate} win rate. ${bestRegimeCard.bestSL} / ${bestRegimeCard.bestTP} was the strongest regime-specific SL/TP pair.`,
          source: "Regime clustering",
        });
      }

      if (worstRegimeCard) {
        cards.push({
          bold: `Avoid ${worstRegimeCard.regime} conditions when possible`,
          rest: ` — This regime averaged ${worstRegimeCard.avgR}R across ${worstRegimeCard.trades} trades and was the weakest segment in this run.`,
          source: "Regime clustering",
        });
      }

      if (cards.length < 3) {
        const holdTimeText = reportData.hold_time_insights?.recommendations?.[0];
        if (typeof holdTimeText === "string" && holdTimeText.trim()) {
          cards.push({
            bold: holdTimeText.split(" — ")[0].split(" - ")[0],
            rest: holdTimeText.includes(" — ")
              ? ` — ${holdTimeText.split(" — ").slice(1).join(" — ")}`
              : holdTimeText.includes(" - ")
                ? ` — ${holdTimeText.split(" - ").slice(1).join(" - ")}`
                : "",
            source: "Hold-time analysis",
          });
        }
      }

      return cards.slice(0, 3);
    })();

    const topRecommendation = recommendationCards[0]
      ? `${recommendationCards[0].bold}${recommendationCards[0].rest}`
      : policy.sl_mult || policy.tp_mult
        ? `Use ${slM}R SL / ${tpM}R TP`
        : "Review the latest model recommendations";

    return {
      currentPnl: totalCurrencyPnl !== null ? formatAccountMetric(totalCurrencyPnl) : `${(orig.total_r ?? 0).toFixed(2)}R`,
      optimisedPnl: optimisationFoundEdge
        ? (optimisedCurrencyPnl !== null ? formatAccountMetric(optimisedCurrencyPnl) : typeof bestTotalR === "number" ? `${bestTotalR.toFixed(2)}R` : `${bestAvgR.toFixed(2)}R avg`)
        : "No consistent edge found",
      gainPnl: optimisationFoundEdge
        ? (gain !== null
            ? (optimisedCurrencyPnl !== null && totalCurrencyPnl !== null ? formatAccountMetric(gain) : `${gain.toFixed(2)}R`)
            : `${Math.abs(bestAvgR - originalAvgR).toFixed(2)}R/trade`)
        : "No reliable uplift",
      avgR: originalAvgR.toFixed(2),
      winRate: Math.round((orig.win_rate ?? 0) * 100).toString(),
      bestAvgR: bestAvgR.toFixed(2),
      improvementPct: impPct,
      avgPerTrade: totalCurrencyPnl !== null && n > 0 ? formatAccountMetric(totalCurrencyPnl / n) : originalAvgR.toFixed(2),
      bestAvgPerTrade: optimisationFoundEdge
        ? (optimisedCurrencyPnl !== null && n > 0 ? formatAccountMetric(optimisedCurrencyPnl / n) : `${bestAvgR.toFixed(2)}R`)
        : "Not reliable",
      ci: ciVal,
      slMult: slM, tpMult: tpM,
      optimisationFoundEdge,
      optimisationHeadline: optimisationFoundEdge ? "Optimised Parameters" : "Optimisation Outcome",
      optimisationSubtext: optimisationFoundEdge
        ? `Best tested policy averaged ${bestAvgR.toFixed(2)}R per trade (95% CI: ±${ciVal})`
        : `No consistent edge was found in this run. Best tested policy still averaged ${bestAvgR.toFixed(2)}R.`,
      improvementDisplay: optimisationFoundEdge
        ? (gain !== null
            ? (optimisedCurrencyPnl !== null && totalCurrencyPnl !== null ? formatAccountMetric(gain) : `${gain.toFixed(2)}R`)
            : `${Math.abs(bestAvgR - originalAvgR).toFixed(2)}R/trade`)
        : "No improvement confirmed",
      improvementSubtext: optimisationFoundEdge
        ? `+${impPct}% better performance`
        : "Best tested policy did not outperform your baseline",
      equityLabel: totalCurrencyPnl !== null ? "Cumulative Account P/L" : "Cumulative R",
      comparisonCurrentValue: optimisationComparisonUsesR
        ? `${(orig.total_r ?? 0).toFixed(2)}R`
        : totalCurrencyPnl !== null
          ? formatAccountMetric(totalCurrencyPnl)
          : `${(orig.total_r ?? 0).toFixed(2)}R`,
      comparisonCurrentSubtext: optimisationComparisonUsesR
        ? `Average trade outcome ${originalAvgR.toFixed(2)}R`
        : `Average trade outcome ${totalCurrencyPnl !== null && n > 0 ? formatAccountMetric(totalCurrencyPnl / n) : originalAvgR.toFixed(2)} (${originalAvgR.toFixed(2)}R)`,
      comparisonOptimisedValue: optimisationFoundEdge
        ? optimisationComparisonUsesR
          ? (typeof bestTotalR === "number" ? `${bestTotalR.toFixed(2)}R` : `${bestAvgR.toFixed(2)}R avg`)
          : (optimisedCurrencyPnl !== null ? formatAccountMetric(optimisedCurrencyPnl) : typeof bestTotalR === "number" ? `${bestTotalR.toFixed(2)}R` : `${bestAvgR.toFixed(2)}R avg`)
        : "No consistent edge found",
      comparisonImprovementValue: optimisationFoundEdge
        ? optimisationComparisonUsesR
          ? (typeof bestTotalR === "number" && typeof orig.total_r === "number"
              ? `${(bestTotalR - orig.total_r).toFixed(2)}R`
              : `${Math.abs(bestAvgR - originalAvgR).toFixed(2)}R/trade`)
          : (gain !== null
              ? (optimisedCurrencyPnl !== null && totalCurrencyPnl !== null ? formatAccountMetric(gain) : `${gain.toFixed(2)}R`)
              : `${Math.abs(bestAvgR - originalAvgR).toFixed(2)}R/trade`)
        : "No improvement confirmed",
      comparisonEquityLabel: optimisationComparisonUsesR ? "Cumulative R" : (totalCurrencyPnl !== null ? "Cumulative Account P/L" : "Cumulative R"),
      recs: recommendationCards.length > 0 ? recommendationCards : [
        optimisationFoundEdge
          ? { bold: `Use ${slM}R SL / ${tpM}R TP`, rest: ` — Best tested policy improved on your baseline in this run`, source: "Policy optimisation" }
          : { bold: "No consistent optimisation edge found", rest: " — The tested policies did not outperform your baseline in this run", source: "Policy optimisation" },
        { bold: "Review hold time", rest: " — Hold-time insights appear when the run has enough duration signal", source: "Hold-time analysis" },
        { bold: "Adapt by regime", rest: " — Regime recommendations appear when clustering data is available", source: "Regime clustering" },
      ],
      bestRegimeAvgR,
      topActionLabel: topRecommendation,
      bestHoursLabel: bestSession?.session ?? "Not available yet",
      bestHoursSubtext: bestSession
        ? `${bestSession.avgR}R avg • ${bestSession.winRate} win rate`
        : "Import more trade timing data to rank hours",
      marketRegimes,
      rMultipleData,
      equityCurveData,
      hasOptimisedEquityCurve,
      optimisationComparisonUsesR,
      sessionPerformance,
      holdTimeResults,
      riskFractionResults,
      consecutiveLossData,
      mfeAnalysis,
      mfeMaePoints,
      exitEfficiencyChartData,
      counterfactualResults,
      trailingStopResults,
      combinedStrategy,
    };
  }, [formatAccountMetric, reportData]);
  const [isEditingTradeCount, setIsEditingTradeCount] = useState(false);
  const [isEditingMonths, setIsEditingMonths] = useState(false);
  const [editValue, setEditValue] = useState("");
  
  // Collapsible section states for analytics dashboard
  const [expandedSections, setExpandedSections] = useState({
    performance: true,
    optimisation: false,
    exitStrategy: false,
    marketConditions: false,
    riskMetrics: false,
    combinedStrategy: false,
    howItWorks: false
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Model Run History Log
  interface ModelRunLog {
    id: string;
    timestamp: Date;
    mode: string;
    tradesAnalysed: number;
    periodDescription: string;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    cost: number;
    status: "completed" | "running" | "failed";
    deletedData?: boolean;
  }

  interface DeleteRunPromptState {
    id: string;
    periodDescription: string;
    deletedData?: boolean;
    status: "completed" | "running" | "failed";
  }
  
  const [modelRunHistory, setModelRunHistory] = useState<ModelRunLog[]>([]);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [deleteRunPrompt, setDeleteRunPrompt] = useState<DeleteRunPromptState | null>(null);

  const mapRunHistoryItem = (item: any): ModelRunLog => ({
    id: String(item.id),
    timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
    mode: typeof item.mode === "string" && item.mode ? item.mode : "trades",
    tradesAnalysed: typeof item.tradesAnalysed === "number" ? item.tradesAnalysed : 0,
    periodDescription: typeof item.periodDescription === "string" && item.periodDescription
      ? item.periodDescription
      : "Analysis run",
    dateRangeStart: item.dateRangeStart ? new Date(item.dateRangeStart) : (item.createdAt ? new Date(item.createdAt) : new Date()),
    dateRangeEnd: item.dateRangeEnd ? new Date(item.dateRangeEnd) : (item.createdAt ? new Date(item.createdAt) : new Date()),
    cost: typeof item.cost === "number" ? item.cost : 0,
    deletedData: item.deletedData === true,
    status:
      item.status === "completed" || item.status === "running" || item.status === "failed"
        ? item.status
        : item.status === "COMPLETED"
          ? "completed"
          : item.status === "FAILED"
            ? "failed"
            : "running",
  });

  const applyPersistedAccountState = (payload: PersistedAnalysisStateResponse) => {
    setAnalysisOptions({
      availableTradeCount: payload.analysisOptions?.availableTradeCount ?? 0,
      minimumTradeCount: payload.analysisOptions?.minimumTradeCount ?? 10,
      recommendedTradeCount: payload.analysisOptions?.recommendedTradeCount ?? 200,
      mlRunDiscountPercent: payload.analysisOptions?.mlRunDiscountPercent ?? 0,
      accountDiscountPercent: payload.analysisOptions?.accountDiscountPercent ?? 0,
      referralCode: payload.analysisOptions?.referralCode ?? null,
      latestAnalysis: payload.analysisOptions?.latestAnalysis ?? null,
    });

    setModelRunHistory(
      Array.isArray(payload.history) ? payload.history.map(mapRunHistoryItem) : []
    );
    setRunHistoryError(null);
    setStoredJournalEntries(Array.isArray(payload.trades) ? payload.trades : []);
    setStoredJournalPnlMeta(payload.pnlMeta ?? null);

    const latest = payload.latestAnalysis;
    if (latest?.report) {
      setReportData(latest.report);
      setStatsData((prev) => ({
        tradesAnalysed: latest.tradesAnalysed ?? latest.report?.summary?.original_performance?.n_trades ?? prev.tradesAnalysed,
        simulationsRun:
          latest.report?.metadata?.simulations_run ??
          latest.report?.optimization_results?.summary?.n_trials ??
          latest.report?.optimization_results?.n_trials ??
          prev.simulationsRun,
        regimesFound:
          latest.report?.metadata?.regimes_found ??
          latest.report?.regimes?.regime_details?.length ??
          latest.report?.summary?.n_regimes ??
          prev.regimesFound,
        avgRMultiple:
          latest.avgRMultiple ??
          latest.report?.summary?.original_performance?.avg_r ??
          prev.avgRMultiple,
      }));
      if (latest.updatedAt) {
        const latestRunAt = new Date(latest.updatedAt);
        setLastRunTime((prev) => {
          if (prev && prev.getTime() === latestRunAt.getTime()) {
            return prev;
          }
          return latestRunAt;
        });
      }
    } else {
      setReportData(null);
      setStatsData({ tradesAnalysed: 0, simulationsRun: 0, regimesFound: 0, avgRMultiple: 0 });
      setLastRunTime(null);
    }
  };

  const loadPersistedAccountState = async () => {
    try {
      const payload = await fetchPersistedAnalysisState();
      if (payload.ok) {
        applyPersistedAccountState(payload);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredToken();
      }
      setRunHistoryError("Saved account data could not be loaded. The backend may be unavailable right now.");
    }
  };

  const handleDeleteRunData = async (runId: string, deleteJournalData = false) => {
    setDeletingRunId(runId);
    setRunHistoryError(null);

    try {
      await deleteAnalysisRun(runId, deleteJournalData);
      await loadPersistedAccountState();
    } catch (err) {
      setRunHistoryError(
        err instanceof Error ? err.message : "Saved analysis data could not be deleted for this run."
      );
    } finally {
      setDeletingRunId(null);
      setDeleteRunPrompt(null);
    }
  };

  const getLedgerModeLabel = (mode: string) => {
    switch (mode) {
      case "auto":
        return "Auto";
      case "months":
        return "By time";
      case "csv":
        return "CSV analysis";
      case "mt5":
        return "MT5 analysis";
      case "journal_fetch":
        return "EA import";
      case "journal_csv_import":
        return "CSV import";
      default:
        return "By trades";
    }
  };

  const isImportLedgerEntry = (mode: string) =>
    mode === "journal_fetch" || mode === "journal_csv_import";
  
  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;

    const loadSessionUser = async () => {
      try {
        const accountState = await fetchAccountState();
        if (!cancelled && accountState.ok) {
          const firstName = accountState.account.profile?.firstName?.trim() || "";
          const lastName = accountState.account.profile?.lastName?.trim() || "";
          const fullName = `${firstName} ${lastName}`.trim();
          setCurrentUserName(fullName || accountState.account.email.split("@")[0]);
          setCurrentUserEmail(accountState.account.email);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            setCurrentUserName("Trader");
            setCurrentUserEmail("");
          }
        }
      }
    };

    loadSessionUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAccountState = async () => {
      await loadPersistedAccountState();
    };

    loadAccountState();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, lastRunTime]);

  useEffect(() => {
    if (!showRunModelModal) return;

    let cancelled = false;

    const refreshAnalysisOptions = async () => {
      try {
        const payload = await fetchAnalysisOptions();
        if (!cancelled && payload.ok) {
          setAnalysisOptions({
            availableTradeCount: payload.availableTradeCount ?? 0,
            minimumTradeCount: payload.minimumTradeCount ?? 10,
            recommendedTradeCount: payload.recommendedTradeCount ?? 200,
            mlRunDiscountPercent: payload.mlRunDiscountPercent ?? 0,
            accountDiscountPercent: payload.accountDiscountPercent ?? 0,
            referralCode: payload.referralCode ?? null,
            latestAnalysis: payload.latestAnalysis ?? null,
          });
        }
      } catch {
        // Keep the last known options if this refresh fails.
      }
    };

    refreshAnalysisOptions();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, showRunModelModal]);

  const minTradeSelection = Math.max(10, analysisOptions.minimumTradeCount || 10);
  const maxTradeSelection = Math.max(minTradeSelection, analysisOptions.availableTradeCount || minTradeSelection);
  const effectiveTradeCount = Math.min(Math.max(selectedTradeCount, minTradeSelection), maxTradeSelection);
  const canRunTradeAnalysis = analysisOptions.availableTradeCount >= minTradeSelection;
  const isSubscriptionPaused = subscriptionStatus === "paused";
  const canRunMlModel = mlModelAccessEnabled && !isSubscriptionPaused;
  const isFreeFetchFlow = !mlModelAccessEnabled;

  useEffect(() => {
    if (!mlModelAccessEnabled && activeTab === "analytics" && !reportData) {
      setActiveTab("journal");
    }
  }, [activeTab, mlModelAccessEnabled, reportData]);
  const referralDiscountFactor = Math.max(0, 1 - (analysisOptions.mlRunDiscountPercent || 0) / 100);
  const estimatedModalCost =
    analysisMode === "trades"
      ? effectiveTradeCount * 0.2 * referralDiscountFactor
      : Math.round(selectedMonths * 47) * 0.2 * referralDiscountFactor;

  useEffect(() => {
    if (analysisMode !== "trades") return;
    if (selectedTradeCount !== effectiveTradeCount) {
      setSelectedTradeCount(effectiveTradeCount);
    }
  }, [analysisMode, effectiveTradeCount, selectedTradeCount]);
  
  const handleRunModel = async () => {
    setModelRunError(null);
    setActionMessage(null);
    setShowRunModelModal(false);
    setIsRunningModel(true);

    const now = new Date();
    const tradesCount = analysisMode === "trades" ? effectiveTradeCount : Math.round(selectedMonths * 47);

    const tempRunId = `pending-${Date.now()}`;
    let currentRunEntryId = tempRunId;
    const newLogEntry: ModelRunLog = {
      id: tempRunId,
      timestamp: now,
      mode: analysisMode,
      tradesAnalysed: tradesCount,
      periodDescription: analysisMode === "trades"
        ? `Last ${effectiveTradeCount} trades`
        : `Last ${selectedMonths} month${selectedMonths > 1 ? 's' : ''}`,
      dateRangeStart: analysisMode === "trades"
        ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - selectedMonths * 30 * 24 * 60 * 60 * 1000),
      dateRangeEnd: now,
      cost: 0,
      status: "running",
    };

    setModelRunHistory(prev => [newLogEntry, ...prev]);
    let completed = false;

    try {
      // 1. Start the pipeline — CSV upload or EA history
      let startPayload;
      if (analysisMode === "csv" && csvFile) {
        startPayload = await startCsvAnalysis(csvFile, replaceCsvDataset);
      } else if (analysisMode === "mt5") {
        startPayload = await startMt5Analysis({
          login: mt5Login || null,
          password: mt5Password || null,
          server: mt5Server || null,
          days: mt5Days,
          symbol: mt5Symbol || null,
        });
      } else {
        startPayload = await startAnalysis({
          mode: analysisMode,
          tradeCount: effectiveTradeCount,
          months: selectedMonths,
        });
      }

      const { jobId, analysisRunId, estimatedCost } = startPayload;
      if (typeof estimatedCost === "number") {
        setModelRunHistory((prev) =>
          prev.map((entry) =>
            entry.id === currentRunEntryId ? { ...entry, cost: estimatedCost } : entry
          )
        );
      }
      if (analysisRunId) {
        currentRunEntryId = analysisRunId;
        setModelRunHistory((prev) =>
          prev.map((entry) =>
            entry.id === tempRunId ? { ...entry, id: analysisRunId } : entry
          )
        );
      }

      // 2. Poll every 3 seconds until done (10 minute timeout)
      const started = Date.now();
      while (Date.now() - started < 10 * 60 * 1000) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        let result;
        try {
          result = await pollAnalysisJob(jobId);
        } catch {
          continue;
        }

        if (result.status === "complete") {
          const tradesAnalysed = result.tradesAnalysed ?? result.trades_analysed;
          const actualCost =
            typeof result.cost === "number" ? result.cost : newLogEntry.cost;
          const simulationsRun = result.simulationsRun ?? result.simulations_run;
          const regimesFound = result.regimesFound ?? result.regimes_found;
          const avgRMultiple = result.avgRMultiple ?? result.avg_r_multiple;
          const dateRange = result.report?.metadata?.date_range;
          const actualStartDate = Array.isArray(dateRange) && dateRange[0] ? new Date(`${dateRange[0]}T00:00:00`) : null;
          const actualEndDate = Array.isArray(dateRange) && dateRange[1] ? new Date(`${dateRange[1]}T00:00:00`) : null;
          const actualPeriodDescription =
            actualStartDate && actualEndDate
              ? `${actualStartDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} → ${actualEndDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : newLogEntry.periodDescription;

          setModelRunHistory(prev => prev.map(entry =>
            entry.id === currentRunEntryId
              ? {
                  ...entry,
                  status: "completed" as const,
                  tradesAnalysed: tradesAnalysed ?? entry.tradesAnalysed,
                  cost: actualCost,
                  periodDescription: actualPeriodDescription,
                  dateRangeStart: actualStartDate ?? entry.dateRangeStart,
                  dateRangeEnd: actualEndDate ?? entry.dateRangeEnd,
                }
              : entry
          ));
          setStatsData((prev) => ({
            tradesAnalysed: tradesAnalysed ?? prev.tradesAnalysed,
            simulationsRun: simulationsRun ?? prev.simulationsRun,
            regimesFound:   regimesFound   ?? prev.regimesFound,
            avgRMultiple:   avgRMultiple   ?? prev.avgRMultiple,
          }));
          if (result.report) setReportData(result.report);
          await loadPersistedAccountState();
          completed = true;
          break;
        }

        if (result.status === "error") {
          throw new Error(result.error || "Analysis failed");
        }
      }
    } catch (err) {
      console.error("Model run failed:", err);
      setModelRunError(err instanceof Error ? err.message : "Model run failed.");
      setModelRunHistory(prev => prev.map(entry =>
        entry.id === currentRunEntryId ? { ...entry, status: "failed" as const } : entry
      ));
    }

    if (!completed) {
      setModelRunError((prev) => prev ?? "Analysis timed out before the UI received a completed result.");
      setModelRunHistory(prev => prev.map(entry =>
        entry.id === currentRunEntryId ? { ...entry, status: "failed" as const } : entry
      ));
    }

    setIsRunningModel(false);
    setLastRunTime(now);
  };

  const handleFetchTradeData = async () => {
    setModelRunError(null);
    setActionMessage(null);
    setIsFetchingTradeData(true);
    try {
      const payload =
        analysisMode === "csv" && csvFile
          ? await importCsvTradeData(csvFile, replaceCsvDataset)
          : await fetchTradeData();
      setAnalysisOptions({
        availableTradeCount: payload.analysisOptions?.availableTradeCount ?? 0,
        minimumTradeCount: payload.analysisOptions?.minimumTradeCount ?? 10,
        recommendedTradeCount: payload.analysisOptions?.recommendedTradeCount ?? 200,
        mlRunDiscountPercent: payload.analysisOptions?.mlRunDiscountPercent ?? 0,
        accountDiscountPercent: payload.analysisOptions?.accountDiscountPercent ?? 0,
        referralCode: payload.analysisOptions?.referralCode ?? null,
        latestAnalysis: payload.analysisOptions?.latestAnalysis ?? null,
      });
      setStoredJournalEntries(Array.isArray(payload.trades) ? payload.trades : []);
      setStoredJournalPnlMeta(payload.pnlMeta ?? null);
      setActionMessage(payload.message);
      setShowRunModelModal(false);
      setActiveTab("journal");
    } catch (error) {
      setModelRunError(error instanceof Error ? error.message : "Trade data could not be fetched.");
    } finally {
      setIsFetchingTradeData(false);
    }
  };
  
  const handleTradeCountEdit = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= minTradeSelection && num <= maxTradeSelection) {
      setSelectedTradeCount(num);
    }
    setIsEditingTradeCount(false);
  };

  const handleMonthsEdit = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 24) {
      setSelectedMonths(num);
    }
    setIsEditingMonths(false);
  };
  
  // Check for overlapping analysis periods
  const checkOverlap = () => {
    const now = new Date();
    const proposedStartDate = analysisMode === "trades"
      ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // approximate for trades
      : new Date(now.getTime() - selectedMonths * 30 * 24 * 60 * 60 * 1000);
    const proposedEndDate = now;
    
    const comparableRuns = modelRunHistory.filter(
      (run) => run.status === "completed" && run.tradesAnalysed > 0
    );

    const overlappingRuns = comparableRuns.filter(run => {
      // Check if date ranges overlap
      const runStart = run.dateRangeStart.getTime();
      const runEnd = run.dateRangeEnd.getTime();
      const propStart = proposedStartDate.getTime();
      const propEnd = proposedEndDate.getTime();
      
      // Overlap occurs if: start1 <= end2 && start2 <= end1
      return runStart <= propEnd && propStart <= runEnd;
    });
    
    const totalOverlappingTrades = overlappingRuns.reduce((sum, run) => sum + run.tradesAnalysed, 0);
    const proposedTrades = analysisMode === "trades" ? effectiveTradeCount : Math.round(selectedMonths * 47);
    const overlapPercentage = overlappingRuns.length > 0 ? Math.min(100, (totalOverlappingTrades / proposedTrades) * 100) : 0;
    
    return {
      hasOverlap: overlappingRuns.length > 0,
      overlappingRuns,
      overlapPercentage: Math.round(overlapPercentage),
      totalOverlappingTrades,
      proposedTrades
    };
  };
  
  const overlapInfo = checkOverlap();
  const hasAnalysisReport = Boolean(reportData);
  
  const getTimeSinceLastRun = () => {
    if (!lastRunTime) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastRunTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };
  
  // All chart/table data comes from the latest completed analysis report.
  const counterfactualResults = derived.counterfactualResults;
  const trailingStopResults = derived.trailingStopResults;
  const mfeAnalysis = derived.mfeAnalysis;
  const exitEfficiencyChartData = derived.exitEfficiencyChartData;
  const marketRegimes = derived.marketRegimes;
  const holdTimeResults = derived.holdTimeResults;
  const sessionPerformance = derived.sessionPerformance;
  const riskFractionResults = derived.riskFractionResults;
  const rMultipleData = derived.rMultipleData;
  const equityCurveComparison = derived.equityCurveData;
  const hasOptimisedEquityCurve = derived.hasOptimisedEquityCurve === true;
  const consecutiveLossData = derived.consecutiveLossData;
  const combinedStrategy = derived.combinedStrategy;
  const reportJournalEntries = reportData?.trade_analytics?.journal_entries ?? [];
  const storedJournalEntryMap = new Map(
    storedJournalEntries.map((entry: any) => [
      [
        String(entry.pair || "").trim().toUpperCase(),
        String(entry.direction || "").trim().toLowerCase(),
        String(entry.date || ""),
        String(entry.entryTime || ""),
        String(entry.exitTime || ""),
        Number(entry.entryPrice || 0).toFixed(5),
        Number(entry.exitPrice || 0).toFixed(5),
      ].join("|"),
      entry,
    ])
  );
  const journalEntries =
    reportJournalEntries.length > 0
      ? reportJournalEntries.map((entry: any) => {
          const matchKey = [
            String(entry.pair || "").trim().toUpperCase(),
            String(entry.direction || "").trim().toLowerCase(),
            String(entry.date || ""),
            String(entry.entryTime || ""),
            String(entry.exitTime || ""),
            Number(entry.entryPrice || 0).toFixed(5),
            Number(entry.exitPrice || 0).toFixed(5),
          ].join("|");
          const storedMatch = storedJournalEntryMap.get(matchKey);
          if (!storedMatch) {
            return entry;
          }
          return {
            ...entry,
            id: storedMatch.id || entry.id,
            notes: storedMatch.notes ?? entry.notes,
            emotions: storedMatch.emotions ?? entry.emotions,
            lessonsLearned: storedMatch.lessonsLearned ?? entry.lessonsLearned,
          };
        })
      : storedJournalEntries;
  const journalPnlMeta =
    reportJournalEntries.length > 0
      ? reportData?.trade_analytics?.pnl_metadata ?? null
      : storedJournalPnlMeta;
  const pnlWarning =
    journalPnlMeta?.currency_pnl_available === false && journalPnlMeta?.message
      ? journalPnlMeta.message
      : null;
  const recommendationCards = derived.recs.slice(0, 3);
  const hasCounterfactualResults = counterfactualResults.length > 0;
  const hasTrailingStopResults = trailingStopResults.length > 0;
  const hasMfeMaeAnalysis = mfeAnalysis.length > 0;
  const hasMarketRegimes = marketRegimes.length > 0;
  const hasSessionPerformance = sessionPerformance.length > 0;
  const hasHoldTimeResults = holdTimeResults.length > 0;
  const hasRiskFractionResults = riskFractionResults.length > 0;
  const hasConsecutiveLossData = consecutiveLossData.length > 0;
  const hasCombinedStrategy = combinedStrategy !== null;
  const equityUsesCurrency = derived.equityLabel === "Cumulative Account P/L";
  const formatEquityValue = (value: number) =>
    equityUsesCurrency ? formatAccountMetric(value) : `${value.toFixed(2)}R`;
  const displayedStats = {
    tradesAnalysed:
      reportData?.summary?.original_performance?.n_trades ??
      statsData.tradesAnalysed,
    policiesTested:
      reportData?.metadata?.simulations_run ??
      statsData.simulationsRun,
    regimesFound:
      reportData?.regimes?.n_regimes ??
      statsData.regimesFound,
    avgRMultiple:
      reportData?.summary?.original_performance?.avg_r ??
      statsData.avgRMultiple,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50 py-12 sm:py-16 md:py-20 px-4 sm:px-6 border-b border-teal-100 relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <motion.div
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ opacity: [0.6, 0.4, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-200 to-teal-200 rounded-full blur-3xl"
          />
        </div>

        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        {/* Profile Dropdown - Top Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <ProfileDropdown
            userName={currentUserName}
            userEmail={currentUserEmail}
            subscriptionTier={subscriptionTier}
            onLogout={() => onLogout && onLogout()}
            onSettings={() => setActiveTab("settings")}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center mt-20">
            <h1 className="pt-6 sm:pt-8 mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-teal-700 bg-clip-text text-transparent">
                Turtle Analytics
              </span>
            </h1>
            <p className="text-slate-700 text-base sm:text-lg mb-8">
              Counterfactual simulation engine that replays your historical trades against the parameter sets generated for your own account data.
              No predictions. No cross-trader data. Statistical analysis of your trading behaviour using optimisation and clustering on your exported history.
            </p>

            {/* Tabs */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-5 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === "analytics"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("journal")}
                className={`px-5 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === "journal"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Trading Journal
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-5 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === "history"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Model Run History
              </button>
              <button
                onClick={() => setActiveTab("guide")}
                className={`px-5 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === "guide"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Guide
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-5 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === "settings"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Settings
              </button>
            </div>
            
            {/* System Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Trades Analysed</div>
                <div className="text-slate-900 text-2xl">{displayedStats.tradesAnalysed.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Policies Tested</div>
                <div className="text-slate-900 text-2xl">{displayedStats.policiesTested.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Regimes Found</div>
                <div className="text-slate-900 text-2xl">{displayedStats.regimesFound}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Avg R-Multiple</div>
                <div className="text-slate-900 text-2xl">{displayedStats.avgRMultiple.toFixed(2)}</div>
              </div>
            </div>

            {/* Analysis Status - Different for Premium vs PAYG */}
            {subscriptionTier === "premium" ? (
              <div className="flex flex-col items-center gap-3">
                <div className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full absolute top-0 left-0 animate-ping"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-900 font-semibold">Auto-Analysis Active</span>
                    </div>
                    <div className="text-emerald-700 text-xs">
                      Continuously analysing after each trade • Always up-to-date
                    </div>
                  </div>
                </div>
                <div className="text-slate-600 text-xs flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  Last updated: {getTimeSinceLastRun()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => {
                    if (isFreeFetchFlow || canRunMlModel) {
                      setShowRunModelModal(true);
                    }
                  }}
                  disabled={isRunningModel || isFetchingTradeData || (mlModelAccessEnabled && !canRunMlModel)}
                  className={`px-8 py-3 rounded-lg transition-all flex items-center gap-2 ${
                    isRunningModel || isFetchingTradeData || (mlModelAccessEnabled && !canRunMlModel)
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl"
                  }`}
                  title={
                    isSubscriptionPaused
                      ? "Resume your subscription in Settings to run the ML model"
                      : !mlModelAccessEnabled
                        ? "Open data import options for your journal"
                        : ""
                  }
                >
                  {isFetchingTradeData ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Fetching Trade Data...
                    </>
                  ) : isRunningModel ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      {mlModelAccessEnabled ? <Brain className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                      {mlModelAccessEnabled ? "Run Model Analysis" : "Fetch Data"}
                    </>
                  )}
                </button>
                <div className="text-slate-600 text-xs flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Last run: {getTimeSinceLastRun()}
                </div>
                {isSubscriptionPaused && (
                  <div className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
                    Subscription paused. You can still access your account, but new ML model runs are locked until you resume billing in Settings.
                  </div>
                )}
                {!mlModelAccessEnabled && (
                  <div className="max-w-sm rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-center text-xs text-sky-800">
                    Your account, journal, and settings are unlocked. Use Fetch Data to pull trades in from MetaTrader, then upgrade when you want to run the ML model.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {actionMessage && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {actionMessage}
          </div>
        </section>
      )}

      {/* Conditional Content Based on Active Tab */}
      {activeTab === "journal" ? (
        <TraderJournal entries={journalEntries} pnlMeta={journalPnlMeta} apiBase={API_BASE} />
      ) : activeTab === "settings" ? (
        <SettingsPage
          userName={currentUserName}
          userEmail={currentUserEmail}
          currentPlan={subscriptionTier}
          subscriptionStatus={subscriptionStatus}
          onPauseSubscription={onPauseSubscription}
          onResumeSubscription={onResumeSubscription}
        />
      ) : activeTab === "guide" ? (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-200 px-8 py-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-slate-900 text-3xl">Turtle Analytics Guide</h1>
              </div>
              <p className="text-slate-600">Understanding the metrics, methodology, and insights</p>
            </div>

            <div className="p-8 space-y-8">
              {/* What is R-Multiple */}
              <div>
                <h2 className="text-slate-900 text-2xl mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-teal-600" />
                  What is R-Multiple?
                </h2>
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-4">
                  <p className="text-slate-700">
                    <strong>R-Multiple</strong> is a way to measure trading performance independent of account size or position sizes. 
                    It normalises every trade's profit or loss by the amount of risk you took.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <p className="text-slate-700 mb-2"><strong>Simple Example:</strong></p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700">
                      <li>You risk <strong>£100</strong> on a trade (your stop loss = £100 away from entry)</li>
                      <li>The trade makes you <strong>£200 profit</strong></li>
                      <li>Your R-Multiple = +2R (you made 2 times your risk)</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <p className="text-slate-700 mb-2"><strong>Loss Example:</strong></p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-700">
                      <li>You risk <strong>£100</strong> on a trade</li>
                      <li>The trade hits your stop loss, losing <strong>£100</strong></li>
                      <li>Your R-Multiple = -1R (you lost exactly your risk)</li>
                    </ul>
                  </div>
                  <p className="text-slate-700">
                    <strong>Why is this useful?</strong> R-multiples let you compare your performance across different account sizes, 
                    markets, and timeframes. An average of <strong>+0.72R</strong> means for every £1 you risk, you make 72p on average.
                  </p>
                </div>
              </div>

              {/* How Turtle Analytics Works */}
              <div>
                <h2 className="text-slate-900 text-2xl mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-teal-600" />
                  How Turtle Analytics Works
                </h2>
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-4">
                  <p className="text-slate-700">
                    Turtle Analytics uses machine learning to analyse <strong>YOUR historical trades</strong> and generate 
                    personalised insights. Here's the methodology:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GitBranch className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 mb-2">Counterfactual Simulation</h3>
                          <p className="text-slate-600 text-sm">
                            Replays your actual trades with different stop-loss and take-profit levels to see what would have happened. 
                            Tests thousands of parameter combinations to find optimal settings.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 mb-2">Bayesian Optimisation</h3>
                          <p className="text-slate-600 text-sm">
                            Intelligently searches for the best parameter combinations (SL/TP levels, trailing stops) using 
                            probabilistic modelling. This approach is more computationally efficient than exhaustive testing of all parameter combinations.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 mb-2">Survival Analysis</h3>
                          <p className="text-slate-600 text-sm">
                            Analyses when your trades typically peak and when they reverse. Helps identify optimal hold times 
                            and exit strategies based on your historical patterns.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Layers className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 mb-2">Unsupervised Clustering</h3>
                          <p className="text-slate-600 text-sm">
                            Identifies different market regimes in your trading history (trending, ranging, volatile) and 
                            shows how your performance varies across these conditions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Metrics Explained */}
              <div>
                <h2 className="text-slate-900 text-2xl mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-teal-600" />
                  Common Metrics Explained
                </h2>
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h3 className="text-slate-900 mb-2">MFE (Maximum Favourable Excursion)</h3>
                    <p className="text-slate-600 text-sm">
                      The furthest a trade moved in your favour before it closed. If MFE is much higher than your final profit, 
                      you might be exiting winners too early.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h3 className="text-slate-900 mb-2">MAE (Maximum Adverse Excursion)</h3>
                    <p className="text-slate-600 text-sm">
                      The furthest a trade moved against you before it closed. If winning trades have high MAE, 
                      you might need wider stops or better entries.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h3 className="text-slate-900 mb-2">Win Rate</h3>
                    <p className="text-slate-600 text-sm">
                      Percentage of trades that were profitable. Note: A 40% win rate can still be very profitable if your 
                      winners are significantly larger than your losers (high R-multiples).
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h3 className="text-slate-900 mb-2">Expectancy</h3>
                    <p className="text-slate-600 text-sm">
                      Your average R-multiple per trade. This is your "edge" in the market. Positive expectancy indicates 
                      profitability on average, with higher values representing a stronger edge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-amber-900 mb-2">Important Disclaimer</h3>
                    <p className="text-amber-800 text-sm">
                      Turtle Analytics analyses <strong>historical</strong> performance. Past results do not guarantee future performance. 
                      The optimised settings suggested by the system may not work in different market conditions. 
                      Always use proper risk management and never risk more than you can afford to lose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : activeTab === "history" ? (
        <>
          {/* Account Ledger */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {runHistoryError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {runHistoryError}
              </div>
            )}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-teal-50 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 text-xl">
                        {subscriptionTier === "premium" ? "Account Ledger" : "Account Ledger"}
                      </h2>
                      <p className="text-slate-600 text-sm">
                        {subscriptionTier === "premium"
                          ? "Imports, account activity, and automatic analysis updates"
                          : "Imports, journal activity, and ML analysis records in one place"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-900 text-sm">
                      Total Coverage: <span className="font-semibold text-teal-600">{modelRunHistory.reduce((sum, run) => sum + run.tradesAnalysed, 0)} trades</span>
                    </div>
                    {subscriptionTier === "payg" && (
                      <div className="text-slate-600 text-xs mt-1">
                        Total spent: £{modelRunHistory.reduce((sum, run) => sum + run.cost, 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Timeline of runs */}
                {modelRunHistory.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200">
                      <BookOpen className="h-6 w-6 text-slate-600" />
                    </div>
                    <h3 className="text-lg text-slate-900">No ledger activity yet</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Trade imports and completed ML runs will appear here after you fetch data, upload a CSV, or run the model.
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {modelRunHistory.map((run, index) => (
                    <div 
                      key={run.id}
                      className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                        index === 0 
                          ? 'border-teal-500 bg-teal-50 shadow-md' 
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {/* Timeline connector */}
                      {index < modelRunHistory.length - 1 && (
                        <div className="absolute left-[34px] top-[60px] w-0.5 h-8 bg-slate-300" />
                      )}

                      {/* Status Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        run.status === "completed" 
                          ? index === 0 
                            ? "bg-gradient-to-r from-teal-600 to-cyan-600" 
                            : "bg-slate-400"
                          : run.status === "running"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}>
                        {run.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : run.status === "running" ? (
                          <RefreshCw className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>

                      {/* Run Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm ${index === 0 ? 'text-teal-900 font-semibold' : 'text-slate-900'}`}>
                                {run.periodDescription}
                              </h3>
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                                  Latest
                                </span>
                              )}
                              {run.deletedData && (
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                                  Data deleted
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600">
                              {run.dateRangeStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' → '}
                              {run.dateRangeEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            {run.deletedData && (
                              <div className="mt-2 text-xs text-slate-500">
                                Saved report data was removed for this run. The billed ML run record remains in your history.
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-slate-900 text-sm">
                              {run.timestamp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {run.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {!isImportLedgerEntry(run.mode) && (
                              <button
                                onClick={() =>
                                  setDeleteRunPrompt({
                                    id: run.id,
                                    periodDescription: run.periodDescription,
                                    deletedData: run.deletedData,
                                    status: run.status,
                                  })
                                }
                                disabled={run.status === "running" || run.deletedData || deletingRunId === run.id}
                                className={`mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                                  run.status === "running" || run.deletedData || deletingRunId === run.id
                                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingRunId === run.id ? "Deleting..." : run.deletedData ? "Data Deleted" : "Delete Data"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 className={`w-4 h-4 ${index === 0 ? 'text-teal-600' : 'text-slate-500'}`} />
                            <div>
                              <div className="text-xs text-slate-600">{isImportLedgerEntry(run.mode) ? "Imported" : "Trades"}</div>
                              <div className={`text-sm ${index === 0 ? 'text-teal-900' : 'text-slate-900'}`}>
                                {run.tradesAnalysed}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {run.mode === "auto" ? (
                              <Zap className={`w-4 h-4 ${index === 0 ? 'text-emerald-600' : 'text-emerald-500'}`} />
                            ) : (
                              <Calendar className={`w-4 h-4 ${index === 0 ? 'text-teal-600' : 'text-slate-500'}`} />
                            )}
                            <div>
                              <div className="text-xs text-slate-600">Mode</div>
                              <div className={`text-sm capitalize ${index === 0 ? 'text-teal-900' : 'text-slate-900'}`}>
                                {getLedgerModeLabel(run.mode)}
                              </div>
                            </div>
                          </div>
                          {subscriptionTier === "payg" && !isImportLedgerEntry(run.mode) && (
                            <div className="flex items-center gap-2">
                              <PoundSterling className={`w-4 h-4 ${index === 0 ? 'text-teal-600' : 'text-slate-500'}`} />
                              <div>
                                <div className="text-xs text-slate-600">Cost</div>
                                <div className={`text-sm ${index === 0 ? 'text-teal-900' : 'text-slate-900'}`}>
                                  £{run.cost.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}

                {/* Summary Info */}
                {modelRunHistory.length > 0 && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  subscriptionTier === "premium" 
                    ? "bg-emerald-50 border-emerald-200" 
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex items-start gap-2">
                    <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      subscriptionTier === "premium" ? "text-emerald-600" : "text-blue-600"
                    }`} />
                    <div className={`text-xs ${
                      subscriptionTier === "premium" ? "text-emerald-900" : "text-blue-900"
                    }`}>
                      {subscriptionTier === "premium" ? (
                        <>
                          <strong>Automatic Continuous Analysis:</strong> Your Premium plan automatically runs ML analysis 
                          after each trade is recorded. The model continuously updates with your latest performance, 
                          ensuring you always have the most current insights without manual intervention.
                        </>
                      ) : (
                        <>
                          <strong>Ledger View:</strong> This combines trade imports and ML analysis records in one timeline.
                          Imported journal data can be analysed later after upgrade, and completed ML runs remain visible alongside those imports.
                        </>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {!hasAnalysisReport && (
            <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100">
                    {mlModelAccessEnabled ? <Brain className="h-7 w-7 text-teal-700" /> : <Sparkles className="h-7 w-7 text-teal-700" />}
                  </div>
                  <h1 className="text-3xl text-slate-900">
                    {mlModelAccessEnabled ? "No analysis data yet" : "Upgrade Plan To Use This Section"}
                  </h1>
                  <p className="mt-3 text-slate-600">
                    {mlModelAccessEnabled
                      ? "This analytics view now only shows completed ML output from your own account. Run the model once, or upload a CSV, and the dashboard will populate with your real trading data."
                      : "Your free account already supports journal imports and trade storage. Upgrade your plan when you want to unlock the full analytics dashboard and run the ML model on the data already stored in your account."}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setShowRunModelModal(true)}
                      disabled={isRunningModel || isFetchingTradeData}
                      className={`rounded-lg px-6 py-3 text-white transition-all ${
                        isRunningModel || isFetchingTradeData
                          ? "cursor-not-allowed bg-slate-400"
                          : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                      }`}
                    >
                      {mlModelAccessEnabled
                        ? isRunningModel
                          ? "Running Analysis..."
                          : "Run First Analysis"
                        : "Upgrade Plan"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {hasAnalysisReport && (
          <>
          {/* Dashboard Overview */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="mb-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-slate-900 text-3xl mb-2">Performance Dashboard</h1>
                  <p className="text-slate-600">Key insights from your {statsData.tradesAnalysed.toLocaleString()} trades analysed with machine learning</p>
                </div>
                <button
                  onClick={() => setActiveTab("guide")}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  View Guide
                </button>
              </div>
            </div>

            {pnlWarning && (
              <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                  <div>
                    <div className="text-sm font-medium text-amber-900">Currency P/L not available for this import</div>
                    <p className="mt-1 text-sm text-amber-800">
                      {pnlWarning} The dashboard is showing R-multiple based analytics for this run instead of account-currency profit and loss.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Card 1: Equity Performance */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-slate-600 text-sm">Equity Performance</div>
                </div>
                <div className="text-3xl text-slate-900 mb-1">{derived.currentPnl}</div>
                <div className="text-sm text-slate-600">{derived.avgR}R avg • {derived.winRate}% win rate</div>
              </div>

              {/* Card 2: Optimised Potential */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-teal-900 text-sm font-medium">Optimised Potential</div>
                </div>
                <div className="text-3xl text-teal-900 mb-1">{derived.optimisedPnl}</div>
                <div className="text-sm text-teal-700">
                  {derived.optimisationFoundEdge
                    ? `${derived.bestAvgR}R avg • ${derived.gainPnl} projected change`
                    : derived.optimisationSubtext}
                </div>
              </div>

              {/* Card 3: Top Recommendation */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-slate-600 text-sm">Top Action</div>
                </div>
                <div className="text-lg text-slate-900 mb-1">{derived.topActionLabel}</div>
                <div className="text-sm text-slate-600">
                  {derived.optimisationFoundEdge ? `+${derived.improvementPct}% improvement` : "No confirmed optimisation edge in this run"}
                </div>
              </div>

              {/* Card 4: Best Trading Time */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-slate-600 text-sm">Best Hours</div>
                </div>
                <div className="text-lg text-slate-900 mb-1">{derived.bestHoursLabel}</div>
                <div className="text-sm text-slate-600">{derived.bestHoursSubtext}</div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 mb-8 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl mb-2">Top 3 Recommendations</h3>
                  <div className="space-y-2 text-teal-50">
                    {derived.recs.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm"><strong>{rec.bold}</strong>{rec.rest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Analysis Section - Collapsible */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
            <button
              onClick={() => toggleSection('performance')}
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-6 flex items-center justify-between hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-slate-900 text-xl mb-1">Performance Analysis</h2>
                  <p className="text-slate-600 text-sm">Profit curves and equity comparison</p>
                </div>
              </div>
              {expandedSections.performance ? (
                <ChevronUp className="w-6 h-6 text-slate-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {expandedSections.performance && (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                <div className="mb-8 text-center">
                  <h3 className="text-slate-900 mb-3 text-2xl">
                    {hasOptimisedEquityCurve ? "Your Equity Curve vs. Optimised Settings" : "Your Equity Curve"}
                  </h3>
                  <p className="text-slate-600 max-w-2xl mx-auto text-base">
                    {hasOptimisedEquityCurve
                      ? "Your cumulative equity performance vs. what Bayesian optimisation found on the same analysed trades"
                      : "Your cumulative performance from the latest completed analysis run"}
                  </p>
                </div>

                  <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                    <div className="text-slate-600 mb-2">Your Equity Performance</div>
                    <div className="text-slate-900 text-3xl mb-2">{derived.comparisonCurrentValue}</div>
                    <div className="text-slate-600 text-sm">{derived.comparisonCurrentSubtext}</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border-2 border-teal-300 shadow-sm">
                    <div className="text-teal-700 mb-2">{derived.optimisationHeadline}</div>
                    <div className="text-teal-900 text-3xl mb-2">{derived.comparisonOptimisedValue}</div>
                    <div className="text-teal-700 text-sm">{derived.optimisationSubtext}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border-2 border-amber-300 shadow-sm">
                    <div className="text-amber-700 mb-2">Improvement Potential</div>
                    <div className="text-amber-900 text-3xl mb-2">{derived.comparisonImprovementValue}</div>
                    <div className="text-amber-700 text-sm">{derived.improvementSubtext}</div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={equityCurveComparison}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                    <XAxis 
                      dataKey="trade" 
                      stroke="#64748b"
                      label={{ value: "Trade Number", position: "insideBottom", offset: -10, fill: "#64748b" }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      label={{ value: derived.comparisonEquityLabel, angle: -90, position: "insideLeft", offset: -10, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "8px",
                        color: "#1e293b" 
                      }}
                      formatter={(value: number) => [formatEquityValue(value), ""]}
                      labelFormatter={(label) => `Trade ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#64748b" 
                      strokeWidth={3}
                      name="Your Equity"
                      dot={false}
                    />
                    {derived.optimisationFoundEdge && hasOptimisedEquityCurve && (
                      <Line 
                        type="monotone" 
                        dataKey="optimised" 
                        stroke="#0d9488" 
                        strokeWidth={3}
                        name="Optimised (Bayesian)"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}
          </section>

          {/* Parameter Optimisation Section - Collapsible */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
            <button
              onClick={() => toggleSection('optimisation')}
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-6 flex items-center justify-between hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-teal-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-slate-900 text-xl mb-1">Parameter Optimisation</h2>
                  <p className="text-slate-600 text-sm">Counterfactual simulations & Bayesian results</p>
                </div>
              </div>
              {expandedSections.optimisation ? (
                <ChevronUp className="w-6 h-6 text-slate-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {expandedSections.optimisation && (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
                {/* Top Recommendations */}
                <div className="mb-12 text-center">
                  <h2 className="text-slate-900 mb-3 text-2xl">
                    Data-Driven Recommendations
                  </h2>
                  <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                    These recommendations are generated from the latest completed run on your own account data. Sections without supporting model output are left blank rather than filled with examples.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                  {recommendationCards.length > 0 ? recommendationCards.map((rec, idx) => (
                    <div key={`${rec.bold}-${idx}`} className="bg-white border-2 border-teal-200 rounded-xl p-6 shadow-sm">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                        {idx === 0 ? (
                          <Settings className="w-6 h-6 text-teal-600" />
                        ) : idx === 1 ? (
                          <Maximize2 className="w-6 h-6 text-teal-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-teal-600" />
                        )}
                      </div>
                      <h3 className="text-slate-900 mb-2 text-xl">{rec.bold}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {rec.rest.trim() || "This recommendation comes directly from the latest completed analysis output."}
                      </p>
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <div className="text-teal-900 text-sm">
                          Recommendation {idx + 1} of {recommendationCards.length}
                        </div>
                        <div className="text-teal-700 text-xs mt-1">
                          Source: {rec.source}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-600">
                      No recommendation set was returned by this run yet.
                    </div>
                  )}
            </div>

            {/* Counterfactual Simulation Results */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-teal-600" />
                Counterfactual Parameter Testing
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                We replayed all {statsData.tradesAnalysed.toLocaleString()} trades under the top tested policy combinations from Bayesian optimisation. Rows may differ by stop loss, take profit, trailing stop, and time limit:
              </p>
              {hasCounterfactualResults ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Stop Loss</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Take Profit</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Trail</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Max Hold</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Total R</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Wins</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate Δ</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">% Changed</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">95% CI</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {counterfactualResults.map((row, idx) => (
                        <tr key={idx} className={`border-t border-slate-100 ${row.isRecommended ? 'bg-teal-50' : row.isCurrent ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 px-4 text-sm">{row.sl}</td>
                          <td className="py-3 px-4 text-sm">{row.tp}</td>
                          <td className="py-3 px-4 text-sm">{row.trail}</td>
                          <td className="py-3 px-4 text-sm">{row.maxHold}</td>
                          <td className="py-3 px-4 text-sm font-semibold">{row.avgR}</td>
                          <td className="py-3 px-4 text-sm">{row.totalR}</td>
                          <td className="py-3 px-4 text-sm">{row.winRate}</td>
                          <td className="py-3 px-4 text-sm">{row.wins}</td>
                          <td className="py-3 px-4 text-sm">{row.winRateDelta}</td>
                          <td className="py-3 px-4 text-sm">{row.changedTrades}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">{row.confidence}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={row.isRecommended ? 'text-teal-700 font-medium' : row.isCurrent ? 'text-blue-700 font-medium' : 'text-slate-600'}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  This run did not return a counterfactual parameter comparison table.
                </div>
              )}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-900 text-sm mb-1">How This Works:</div>
                      <p className="text-slate-600 text-xs">
                      Each line is a real optimiser trial. `Avg R` ranks the policies, `Total R` shows cumulative outcome across the analysed trades, `Wins` shows the raw winning-trade count behind the displayed win rate, `Win Rate Δ` shows how much the win rate moved from your original trades, and `% Changed` shows how many trades would have exited differently from your original history.
                      </p>
                    </div>
                </div>
              </div>
            </div>
              </div>
            )}
          </section>

          {/* Exit Strategy Section - Collapsible */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
            <button
              onClick={() => toggleSection('exitStrategy')}
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-6 flex items-center justify-between hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-slate-900 text-xl mb-1">Exit Strategy Analysis</h2>
                  <p className="text-slate-600 text-sm">MFE/MAE analysis & trailing stop optimisation</p>
                </div>
              </div>
              {expandedSections.exitStrategy ? (
                <ChevronUp className="w-6 h-6 text-slate-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {expandedSections.exitStrategy && (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
                {/* MFE/MAE Analysis */}
                <div className="mb-16">
                  <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                    <Maximize2 className="w-6 h-6 text-teal-600" />
                    MFE/MAE: Are You Exiting Too Early?
                  </h2>
                  <p className="text-slate-600 text-sm mb-2">
                <strong>What this analysis does:</strong> We measured how far each trade moved in your favor vs. against you to spot exit timing issues.
              </p>
              <p className="text-slate-600 text-sm mb-6">
                Maximum Favorable Excursion (MFE) = how far price moved in your favor. 
                Maximum Adverse Excursion (MAE) = worst drawdown during the trade.
              </p>

              {hasMfeMaeAnalysis ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {mfeAnalysis.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-xl border-2 ${
                          item.category === 'Wins'
                            ? 'bg-teal-50 border-teal-300'
                            : item.category === 'Breakeven'
                              ? 'bg-slate-50 border-slate-300'
                              : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div className="text-sm text-slate-700 mb-2">{item.category} ({item.count} trades)</div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-slate-600">Avg MFE</div>
                            <div className="text-2xl">{item.avgMFE}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Avg MAE</div>
                            <div className="text-2xl">{item.avgMAE}</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">{item.insight}</p>
                      </div>
                    ))}
                  </div>

                  {exitEfficiencyChartData.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <div className="text-sm text-slate-700 mb-4">Exit Efficiency Comparison</div>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={exitEfficiencyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis label={{ value: "R-Multiple", angle: -90, position: "insideLeft" }} />
                          <ReferenceLine y={0} stroke="#94a3b8" />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === "realisedR") return [`${value.toFixed(2)}R`, "Realised Avg R"];
                              if (name === "avgMFE") return [value == null ? "N/A" : `${value.toFixed(2)}R`, "Avg MFE"];
                              if (name === "avgMAE") return [value == null ? "N/A" : `${value.toFixed(2)}R`, "Avg MAE"];
                              return [value, name];
                            }}
                          />
                          <Bar dataKey="realisedR" name="realisedR" fill="#0f766e" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="avgMFE" name="avgMFE" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="avgMAE" name="avgMAE" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                      This run did not include enough excursion data to compare realised R against average MFE and MAE by trade outcome.
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-teal-900 text-sm mb-1">Key Insight:</div>
                        <p className="text-teal-700 text-xs">
                          Compare realised R against average MFE and MAE to see whether winners are leaving meaningful upside on the table or losers are giving back too much before exit.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  This run did not return MFE/MAE excursion data.
                </div>
              )}
            </div>

            {/* Trailing Stop Optimisation */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Activity className="w-6 h-6 text-teal-600" />
                Trailing Stop Testing
              </h2>
              <p className="text-slate-600 text-sm mb-2">
                <strong>What this analysis does:</strong> We grouped the optimiser's tested policies by trailing-stop threshold to show which trailing settings performed best on your analysed trades.
              </p>
              <p className="text-slate-600 text-sm mb-6">
                These rows are drawn from the optimisation trials in this run, not from a separate standalone trailing-stop model.
              </p>
              {hasTrailingStopResults ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Trail Threshold</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Max Hold</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Policies</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trailingStopResults.map((row, idx) => (
                        <tr key={idx} className={`border-t border-slate-100 ${row.status === 'Recommended' ? 'bg-teal-50' : row.status === 'Current' ? 'bg-blue-50' : ''}`}>
                          <td className="py-3 px-4 text-sm">{row.threshold}</td>
                          <td className="py-3 px-4 text-sm font-semibold">{row.avgR}</td>
                          <td className="py-3 px-4 text-sm">{row.winRate}</td>
                          <td className="py-3 px-4 text-sm">{row.maxHold}</td>
                          <td className="py-3 px-4 text-sm">{row.policies}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={row.status === 'Recommended' ? 'text-teal-700 font-medium' : row.status === 'Current' ? 'text-blue-700 font-medium' : 'text-slate-600'}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  No trailing-stop optimisation table is available in the current report output.
                </div>
              )}
            </div>
              </div>
            )}
          </section>

          {/* Market Conditions Section - Collapsible */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
            <button
              onClick={() => toggleSection('marketConditions')}
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-6 flex items-center justify-between hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-slate-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-slate-900 text-xl mb-1">Market Conditions</h2>
                  <p className="text-slate-600 text-sm">Regime clustering & session performance</p>
                </div>
              </div>
              {expandedSections.marketConditions ? (
                <ChevronUp className="w-6 h-6 text-slate-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {expandedSections.marketConditions && (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
                {/* Market Regime Clustering */}
                <div className="mb-16">
                  <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                    Market Regimes (Unsupervised K-Means Clustering)
                  </h2>
                  <p className="text-slate-600 text-sm mb-6">
                    Regimes below come directly from the latest clustering output in this run.
                  </p>
                  {hasMarketRegimes ? (
                    <div className="space-y-4">
                      {marketRegimes.map((regime, idx) => (
                        <div key={idx} className={`${regime.color} border-2 rounded-xl p-5`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-lg">{regime.regime}</h3>
                                {regime.isBest && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                    Best
                                  </span>
                                )}
                                {regime.isWorst && (
                                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                                    Worst
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600">{regime.features}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl mb-1">{regime.avgR}</div>
                              <div className="text-xs text-slate-600">avg R-multiple</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <div className="text-slate-600">Win Rate</div>
                              <div className="font-semibold">{regime.winRate}</div>
                            </div>
                            <div>
                              <div className="text-slate-600">Trades</div>
                              <div className="font-semibold">{regime.trades}</div>
                            </div>
                            <div>
                              <div className="text-slate-600">Best SL/TP</div>
                              <div className="font-semibold">{regime.bestSL} / {regime.bestTP}</div>
                            </div>
                            <div>
                              <div className="text-slate-600">Coverage</div>
                              <div className="font-semibold">{regime.coverage}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                      This run did not produce enough clustering output to show market regimes.
                    </div>
                  )}
            </div>

            {/* Session Performance */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-teal-600" />
                Time-of-Day Performance
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Time ranges below are grouped from the trade timestamps exactly as recorded in the trading account or uploaded file.
              </p>
              {hasSessionPerformance ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Time Range</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Trades</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">P/L</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionPerformance.map((session, idx) => (
                        <tr key={idx} className={`border-t border-slate-100 ${session.isBest ? 'bg-teal-50' : session.status === 'Avoid' ? 'bg-red-50' : ''}`}>
                          <td className="py-3 px-4 text-sm">{session.session}</td>
                          <td className="py-3 px-4 text-sm font-semibold">{session.avgR}</td>
                          <td className="py-3 px-4 text-sm">{session.trades}</td>
                          <td className="py-3 px-4 text-sm">{session.winRate}</td>
                          <td className="py-3 px-4 text-sm">{session.pnl}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={session.isBest ? 'text-teal-700 font-medium' : session.status === 'Avoid' ? 'text-red-700 font-medium' : 'text-slate-600'}>
                              {session.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  No session-performance breakdown is available in this run.
                </div>
              )}
            </div>

            {/* Hold Time Optimisation */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-teal-600" />
                Optimal Hold Time
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Hold-time buckets below are taken from the report when they are available. Duration ranges are ranked by average R-multiple for trades in each bucket.
              </p>
              {hasHoldTimeResults ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {holdTimeResults.map((dur, idx) => (
                    <div key={idx} className={`text-center p-4 rounded-xl border-2 ${dur.isOptimal ? 'bg-teal-50 border-teal-300' : 'bg-white border-slate-200'}`}>
                      <div className="text-xs text-slate-600 mb-2">{dur.duration}</div>
                      <div className={`text-2xl mb-1 ${dur.isOptimal ? 'text-teal-700 font-semibold' : ''}`}>
                        {dur.avgR}
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{dur.count} trades</div>
                      <div className="text-xs text-slate-600">{dur.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  Hold-time optimisation was not returned by this run.
                </div>
              )}
            </div>

            {/* Risk Fraction */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-teal-600" />
                Risk Fraction Optimisation
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Risk fraction rows below are generated from the sizing methods used in the latest run: variance-adjusted Kelly, half Kelly, and full Kelly.
              </p>
              {hasRiskFractionResults ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Risk Per Trade</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Basis</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Max Drawdown</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskFractionResults.map((row, idx) => (
                        <tr key={idx} className={`border-t border-slate-100 ${row.isCurrent ? 'bg-teal-50' : ''}`}>
                          <td className="py-3 px-4 text-sm">{row.riskPct}</td>
                          <td className="py-3 px-4 text-sm">{row.basis}</td>
                          <td className="py-3 px-4 text-sm">{row.maxDD}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={row.isCurrent ? 'text-teal-700 font-medium' : 'text-slate-600'}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  No risk-fraction optimisation output is available in this run.
                </div>
              )}
            </div>

            {/* Sequential Loss Patterns */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-teal-600" />
                Sequential Loss Pattern Detection
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                These cards show what happened on the very next trade after each losing streak length: the exact next-trade win rate, next-trade average R, and the raw win count behind that percentage.
              </p>
              {hasConsecutiveLossData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {consecutiveLossData.map((loss, idx) => (
                    <div key={idx} className={`text-center p-4 rounded-xl border-2 ${loss.lossStreak === '4+ Losses' ? 'bg-red-50 border-red-300' : loss.lossStreak === '1 Loss' ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="text-xs text-slate-600 mb-2">{loss.headline}</div>
                      <div className={`text-2xl mb-1 ${loss.lossStreak === '4+ Losses' ? 'text-red-700 font-semibold' : ''}`}>
                        {loss.nextWinRate}
                      </div>
                      <div className="text-xs text-slate-500 mb-1">Next-trade win rate</div>
                      <div className="text-sm mb-1">{loss.nextAvgR}</div>
                      <div className="text-xs text-slate-500 mb-1">Next-trade avg R</div>
                      <div className="text-xs text-slate-400">{loss.nextWins}/{loss.occurrences} next trades won</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                  No sequential-loss pattern output is available in this run.
                </div>
              )}
            </div>
              </div>
            )}
          </section>

          {/* Risk Metrics Section - Collapsible */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
            <button
              onClick={() => toggleSection('riskMetrics')}
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-6 flex items-center justify-between hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-slate-900 text-xl mb-1">Risk & Distribution Analysis</h2>
                  <p className="text-slate-600 text-sm">R-multiple distribution & risk metrics</p>
                </div>
              </div>
              {expandedSections.riskMetrics ? (
                <ChevronUp className="w-6 h-6 text-slate-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {expandedSections.riskMetrics && (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
                {/* R-Multiple Distribution */}
                <div className="mb-16">
                  <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                    R-Multiple Distribution
                  </h2>
                  <p className="text-slate-600 text-sm mb-6">
                    Your trade outcomes measured in R (risk units):
                  </p>
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rMultipleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis label={{ value: "Number of Trades", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
              </div>
            )}
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
            <button
              onClick={() => toggleSection('combinedStrategy')}
              className="w-full bg-white border-2 border-slate-200 rounded-xl p-6 flex items-center justify-between hover:border-teal-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-teal-700" />
                </div>
                <div className="text-left">
                  <h2 className="text-slate-900 text-xl mb-1">Combined Strategy Optimisation</h2>
                  <p className="text-slate-600 text-sm">Best historical setup built from your strongest time, regime, and policy signals</p>
                </div>
              </div>
              {expandedSections.combinedStrategy ? (
                <ChevronUp className="w-6 h-6 text-slate-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-600" />
              )}
            </button>

            {expandedSections.combinedStrategy && (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
                <div className="mb-8">
                  <h2 className="text-slate-900 mb-3 text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-teal-600" />
                    Ultimate Strategy Profile
                  </h2>
                  <p className="text-slate-600 text-sm">
                    This section combines the strongest historical time-of-day, regime, and management settings from the current run into one practical profile. It is a best-fit historical setup, not a guaranteed future result.
                  </p>
                </div>

                {hasCombinedStrategy ? (
                  <>
                    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
                      <div className="text-xs uppercase tracking-wide text-teal-700 mb-2">Best Historical Strategy Setup</div>
                      <div className="text-slate-900 text-lg mb-2">{combinedStrategy.summaryText}</div>
                      <div className="text-xs text-teal-800">{combinedStrategy.scopeLabel}</div>
                    </div>

                    {combinedStrategy.warnings.length > 0 && (
                      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm text-amber-900 mb-2">Read This Before Using It</div>
                            <div className="space-y-2">
                              {combinedStrategy.warnings.map((warning: string, idx: number) => (
                                <p key={idx} className="text-xs text-amber-800">
                                  {warning}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {combinedStrategy.summaryCards.map((card: any) => (
                        <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                          <div className="text-xs text-slate-500 mb-2">{card.label}</div>
                          <div className="text-2xl text-slate-900 mb-1">{card.value}</div>
                          <div className="text-xs text-slate-600">{card.subtext}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-8">
                      <div className="text-sm text-slate-700 mb-4">Recommended Setup</div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {combinedStrategy.profileRows.map((row: any) => (
                          <div key={row.label} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="text-xs text-slate-500 mb-2">{row.label}</div>
                            <div className="text-base text-slate-900">{row.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 pt-4 text-sm text-slate-700">What This Setup Would Have Looked Like</div>
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-slate-700 text-sm">Comparison</th>
                            <th className="text-left py-3 px-4 text-slate-700 text-sm">Trades</th>
                            <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                            <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                            <th className="text-left py-3 px-4 text-slate-700 text-sm">Total Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {combinedStrategy.metricsRows.map((row: any, idx: number) => (
                            <tr key={row.label} className={`border-t border-slate-100 ${idx === 1 ? 'bg-teal-50' : ''}`}>
                              <td className="py-3 px-4 text-sm font-medium text-slate-900">{row.label}</td>
                              <td className="py-3 px-4 text-sm">{row.trades}</td>
                              <td className="py-3 px-4 text-sm">{row.avgR}</td>
                              <td className="py-3 px-4 text-sm">{row.winRate}</td>
                              <td className="py-3 px-4 text-sm">{row.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </>
                ) : (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
                    This run did not return enough overlapping optimisation, timing, and regime data to build a combined strategy profile yet.
                  </div>
                )}
              </div>
            )}
          </section>
          </>
          )}

        </>
      )}

      {/* Run Model Configuration Modal */}
      {showRunModelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8 relative">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-xl p-6 sm:p-8 z-10">
              <button
                onClick={() => setShowRunModelModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  {isFreeFetchFlow ? <RefreshCw className="w-6 h-6 text-white" /> : <Brain className="w-6 h-6 text-white" />}
                </div>
                <h2 className="text-slate-900 text-2xl">{isFreeFetchFlow ? "Fetch Trade Data" : "Configure Analysis"}</h2>
              </div>
              <p className="text-slate-600 text-sm">
                {isFreeFetchFlow
                  ? "Choose how you want to import trade data into your journal."
                  : "Choose how much trading history to analyse with the ML model"}
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
              {/* Analysis Mode Selection */}
              <div className="mb-6">
                <label className="text-slate-700 mb-3 block">{isFreeFetchFlow ? "Import Method:" : "Analysis Range:"}</label>
                <div className={`grid gap-3 ${isFreeFetchFlow ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                  <button
                    onClick={() => setAnalysisMode("trades")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      analysisMode === "trades"
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <BarChart3 className={`w-6 h-6 mx-auto mb-2 ${
                      analysisMode === "trades" ? "text-teal-600" : "text-slate-400"
                    }`} />
                    <div className="text-sm text-slate-900">By Trades</div>
                    <div className="text-xs text-slate-500">{isFreeFetchFlow ? "Fetch from EA" : "Last X trades"}</div>
                  </button>
                  {!isFreeFetchFlow && (
                    <button
                      onClick={() => setAnalysisMode("months")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        analysisMode === "months"
                          ? "border-teal-600 bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Calendar className={`w-6 h-6 mx-auto mb-2 ${
                        analysisMode === "months" ? "text-teal-600" : "text-slate-400"
                      }`} />
                      <div className="text-sm text-slate-900">By Time</div>
                      <div className="text-xs text-slate-500">Last X months</div>
                    </button>
                  )}
                  <button
                    onClick={() => setAnalysisMode("csv")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      analysisMode === "csv"
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Sparkles className={`w-6 h-6 mx-auto mb-2 ${
                      analysisMode === "csv" ? "text-teal-600" : "text-slate-400"
                    }`} />
                    <div className="text-sm text-slate-900">Upload CSV</div>
                    <div className="text-xs text-slate-500">{isFreeFetchFlow ? "Import into journal" : "Your trade file"}</div>
                  </button>
                  {!isFreeFetchFlow && (
                    <button
                      onClick={() => setAnalysisMode("mt5")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        analysisMode === "mt5"
                          ? "border-teal-600 bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Monitor className={`w-6 h-6 mx-auto mb-2 ${
                        analysisMode === "mt5" ? "text-teal-600" : "text-slate-400"
                      }`} />
                      <div className="text-sm text-slate-900">MetaTrader</div>
                      <div className="text-xs text-slate-500">Connect MT5</div>
                    </button>
                  )}
                </div>
              </div>

              {/* CSV File Upload */}
              {analysisMode === "csv" && (
                <div className="mb-6">
                  <label className="text-slate-700 mb-2 block text-sm">Select your trades CSV file:</label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    csvFile ? "border-teal-400 bg-teal-50" : "border-slate-300 hover:border-slate-400"
                  }`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      {csvFile ? (
                        <div>
                          <CheckCircle className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                          <div className="text-teal-700 font-medium text-sm">{csvFile.name}</div>
                          <div className="text-teal-600 text-xs mt-1">Click to change file</div>
                        </div>
                      ) : (
                        <div>
                          <BarChart3 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <div className="text-slate-600 text-sm font-medium">Click to upload CSV</div>
                          <div className="text-slate-400 text-xs mt-1">Requires: entry_date, exit_date, entry_price, exit_price</div>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm text-slate-900">CSV fields needed for the model</div>
                    <div className="mt-3 space-y-3 text-xs text-slate-600">
                      <div>
                        <div className="font-medium text-slate-800">Required for a valid import</div>
                        <div className="mt-1">
                          <span className="font-mono">entry_date</span>, <span className="font-mono">exit_date</span>, <span className="font-mono">entry_price</span>, <span className="font-mono">exit_price</span>, direction/side, and a trade identifier such as symbol or pair.
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Recommended for accurate ML analysis</div>
                        <div className="mt-1">
                          <span className="font-mono">stop_loss</span>, <span className="font-mono">take_profit</span>, realised P/L, position size/volume, and timestamps with entry and exit times.
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Needed for the richer analytics sections</div>
                        <div className="mt-1">
                          <span className="font-mono">mfe</span> and <span className="font-mono">mae</span> for exit analysis, plus valid timing data for time-of-day and hold-time sections.
                        </div>
                      </div>
                      <div className="text-slate-500">
                        If those richer fields are missing, the run can still complete, but some analytics cards will be simplified or left blank.
                      </div>
                    </div>
                  </div>
                  {!isFreeFetchFlow && (
                    <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={replaceCsvDataset}
                        onChange={(e) => setReplaceCsvDataset(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <div className="text-sm text-slate-900">Replace account dataset with this CSV</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Clears saved analysis runs, snapshots, and remembered journal trades before importing this file.
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {modelRunError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modelRunError}
                </div>
              )}

              {isSubscriptionPaused && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Your subscription is paused. Account access stays active, but new ML model runs are disabled until you resume the subscription in Settings.
                </div>
              )}

              {!mlModelAccessEnabled && (
                <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  Free account mode is active. You can use the journal and account area now, but subscribing is still required before running the ML model.
                </div>
              )}

              {/* MetaTrader 5 Credentials */}
              {analysisMode === "mt5" && (
                <div className="mb-6 space-y-4">
                  <p className="text-slate-600 text-sm">
                    Connect directly to your MetaTrader 5 terminal. Leave credentials blank to use the currently logged-in account.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-700 text-sm mb-1 block">Account Number</label>
                      <input
                        type="number"
                        placeholder="e.g. 12345678"
                        value={mt5Login}
                        onChange={(e) => setMt5Login(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm mb-1 block">Password</label>
                      <input
                        type="password"
                        placeholder="Investor or full password"
                        value={mt5Password}
                        onChange={(e) => setMt5Password(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm mb-1 block">Broker Server</label>
                      <input
                        type="text"
                        placeholder="e.g. Broker-Demo"
                        value={mt5Server}
                        onChange={(e) => setMt5Server(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 text-sm mb-1 block">Symbol Filter <span className="text-slate-400">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. EURUSD (leave blank for all)"
                        value={mt5Symbol}
                        onChange={(e) => setMt5Symbol(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-700 text-sm mb-1 block">History Lookback: <span className="text-teal-600 font-semibold">{mt5Days} days</span></label>
                    <input
                      type="range"
                      min={7}
                      max={365}
                      step={7}
                      value={mt5Days}
                      onChange={(e) => setMt5Days(parseInt(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>7 days</span>
                      <span>1 year</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-xs">
                      MT5 must be installed and running on the same machine as the analytics server. The investor (read-only) password is sufficient.
                    </p>
                  </div>
                </div>
              )}

              {/* Trade Count Slider */}
              {analysisMode === "trades" && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-slate-700">Number of Trades:</label>
                    {isEditingTradeCount ? (
                      <input
                        type="number"
                        min={minTradeSelection}
                        max={maxTradeSelection}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          handleTradeCountEdit(editValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTradeCountEdit(editValue);
                          } else if (e.key === 'Escape') {
                            setIsEditingTradeCount(false);
                          }
                        }}
                        autoFocus
                        className="w-24 px-3 py-1 text-teal-600 font-semibold text-lg text-right border-2 border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditingTradeCount(true);
                          setEditValue(effectiveTradeCount.toString());
                        }}
                        className="px-3 py-1 text-teal-600 font-semibold text-lg hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        {effectiveTradeCount}
                      </button>
                    )}
                  </div>
                  
                  {/* Custom Styled Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min={minTradeSelection}
                      max={maxTradeSelection}
                      step="1"
                      value={effectiveTradeCount}
                      onChange={(e) => setSelectedTradeCount(Number(e.target.value))}
                      className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-6 
                        [&::-webkit-slider-thumb]:h-6 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-gradient-to-r 
                        [&::-webkit-slider-thumb]:from-teal-600 
                        [&::-webkit-slider-thumb]:to-cyan-600 
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:w-6 
                        [&::-moz-range-thumb]:h-6 
                        [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-gradient-to-r 
                        [&::-moz-range-thumb]:from-teal-600 
                        [&::-moz-range-thumb]:to-cyan-600 
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:shadow-lg
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:transition-transform
                        [&::-moz-range-thumb]:hover:scale-110"
                      style={{
                        background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${maxTradeSelection === minTradeSelection ? 100 : ((effectiveTradeCount - minTradeSelection) / (maxTradeSelection - minTradeSelection)) * 100}%, #e2e8f0 ${maxTradeSelection === minTradeSelection ? 100 : ((effectiveTradeCount - minTradeSelection) / (maxTradeSelection - minTradeSelection)) * 100}%, #e2e8f0 100%)`
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>{minTradeSelection}</span>
                    <span>{maxTradeSelection.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600">
                      <strong>Recommendation:</strong> {analysisOptions.availableTradeCount > 0
                        ? `Your account currently has ${analysisOptions.availableTradeCount.toLocaleString()} new trade${analysisOptions.availableTradeCount === 1 ? "" : "s"} pending analysis.`
                        : "Connect the EA or upload a CSV to detect new trades that still need analysing."}{" "}
                      Use around {Math.min(analysisOptions.recommendedTradeCount || 200, maxTradeSelection).toLocaleString()} new trades for stronger statistical confidence when possible.
                    </div>
                  </div>
                </div>
              )}

              {!isFreeFetchFlow && analysisMode === "trades" && !canRunTradeAnalysis && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-red-900 text-sm font-semibold mb-1">
                        At least 10 closed trades are required
                      </div>
                      <p className="text-red-700 text-xs">
                        Only {analysisOptions.availableTradeCount.toLocaleString()} new trade{analysisOptions.availableTradeCount === 1 ? "" : "s"} are currently pending analysis.
                        Run more trades in MetaTrader or upload a newer CSV before starting the model.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Month Slider */}
              {!isFreeFetchFlow && analysisMode === "months" && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-slate-700">Number of Months:</label>
                    {isEditingMonths ? (
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          handleMonthsEdit(editValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleMonthsEdit(editValue);
                          } else if (e.key === 'Escape') {
                            setIsEditingMonths(false);
                          }
                        }}
                        autoFocus
                        className="w-24 px-3 py-1 text-teal-600 font-semibold text-lg text-right border-2 border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditingMonths(true);
                          setEditValue(selectedMonths.toString());
                        }}
                        className="px-3 py-1 text-teal-600 font-semibold text-lg hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        {selectedMonths}
                      </button>
                    )}
                  </div>
                  
                  {/* Custom Styled Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="24"
                      step="1"
                      value={selectedMonths}
                      onChange={(e) => setSelectedMonths(Number(e.target.value))}
                      className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-6 
                        [&::-webkit-slider-thumb]:h-6 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-gradient-to-r 
                        [&::-webkit-slider-thumb]:from-teal-600 
                        [&::-webkit-slider-thumb]:to-cyan-600 
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:w-6 
                        [&::-moz-range-thumb]:h-6 
                        [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-gradient-to-r 
                        [&::-moz-range-thumb]:from-teal-600 
                        [&::-moz-range-thumb]:to-cyan-600 
                        [&::-moz-range-thumb]:border-0
                        [&::-moz-range-thumb]:shadow-lg
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:transition-transform
                        [&::-moz-range-thumb]:hover:scale-110"
                      style={{
                        background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${((selectedMonths - 1) / (24 - 1)) * 100}%, #e2e8f0 ${((selectedMonths - 1) / (24 - 1)) * 100}%, #e2e8f0 100%)`
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>1</span>
                    <span>24</span>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600">
                      <strong>Recommendation:</strong> Analyse 6-12 months for a good balance of recent patterns 
                      and sufficient sample size. Too short = unreliable, too long = outdated patterns.
                    </div>
                  </div>
                </div>
              )}

              {/* Overlap Detection Warning */}
              {!isFreeFetchFlow && overlapInfo.hasOverlap && (
                <div className={`mb-4 p-4 rounded-lg border-2 ${
                  overlapInfo.overlapPercentage >= 80 
                    ? 'bg-red-50 border-red-300' 
                    : overlapInfo.overlapPercentage >= 50
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      overlapInfo.overlapPercentage >= 80 
                        ? 'text-red-600' 
                        : overlapInfo.overlapPercentage >= 50
                        ? 'text-orange-600'
                        : 'text-amber-600'
                    }`} />
                    <div className="flex-1">
                      <div className={`text-sm mb-2 ${
                        overlapInfo.overlapPercentage >= 80 
                          ? 'text-red-900 font-semibold' 
                          : overlapInfo.overlapPercentage >= 50
                          ? 'text-orange-900 font-semibold'
                          : 'text-amber-900 font-semibold'
                      }`}>
                        {overlapInfo.overlapPercentage >= 80 
                          ? '⚠️ Existing Analysis Overlap'
                          : overlapInfo.overlapPercentage >= 50
                          ? '⚠️ High Overlap Detected'
                          : '⚠️ Partial Overlap Detected'
                        }
                      </div>
                      <p className={`text-xs mb-3 ${
                        overlapInfo.overlapPercentage >= 80 ? 'text-red-700' : 'text-amber-700'
                      }`}>
                        This period overlaps with {overlapInfo.overlappingRuns.length} previous run{overlapInfo.overlappingRuns.length > 1 ? 's' : ''} 
                        ({overlapInfo.overlapPercentage}% overlap, ~{overlapInfo.totalOverlappingTrades} trades already analysed).
                        {overlapInfo.overlapPercentage >= 80 && ' This is a comparison with previous local runs shown in the dashboard history.'}
                      </p>
                      
                      {/* Show overlapping runs */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-700 mb-1">Overlapping with:</div>
                        {overlapInfo.overlappingRuns.map(run => (
                          <div key={run.id} className="flex items-center gap-2 text-xs bg-white/50 rounded px-2 py-1.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-700">
                              {run.periodDescription} • {run.tradesAnalysed} trades • {run.dateRangeStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {run.dateRangeEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>

                      {overlapInfo.overlapPercentage < 80 && (
                        <div className="mt-3 text-xs text-amber-700 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span><strong>Tip:</strong> Adjust the date range to analyse an unanalysed period for better insights.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* No Overlap - Green Light */}
              {!isFreeFetchFlow && !overlapInfo.hasOverlap && modelRunHistory.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-green-900 text-sm font-semibold mb-1">
                        New Period - No Overlap Detected
                      </div>
                      <p className="text-green-700 text-xs">
                        This analysis covers a new period with no overlap from previous runs.
                        Any repeated MetaTrader trade IDs are filtered out before the model runs, so reruns do not duplicate the same closed trades in the analysis set.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isFreeFetchFlow && analysisMode === "trades" && analysisOptions.availableTradeCount > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-blue-900 text-sm font-semibold mb-1">
                        Duplicate-safe trade matching is active
                      </div>
                      <p className="text-blue-700 text-xs">
                        We identify each MetaTrader trade by its broker trade ID or a fallback trade fingerprint, then only charge and analyse trades that are still new to your account log.
                        {analysisOptions.latestAnalysis?.tradesAnalysed
                          ? ` Latest saved run analysed ${analysisOptions.latestAnalysis.tradesAnalysed.toLocaleString()} trades.`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estimated Processing Time */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-teal-900 text-sm mb-1">{isFreeFetchFlow ? "Import Time" : "Processing Time"}</div>
                    <p className="text-teal-700 text-xs">
                      {isFreeFetchFlow
                        ? "This can take a few seconds depending on how many trades are returned from MetaTrader or included in your CSV."
                        : "This can take a few seconds depending on the number of trades analysed and the optimisation workload in this run."}
                    </p>
                    <p className="text-teal-600 text-xs mt-1">
                      {isFreeFetchFlow
                        ? "Leave the platform open while the import finishes and the journal refreshes."
                        : "Leave the platform open while the model finishes and saves the latest report."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Summary - Only for PAYG */}
              {!isFreeFetchFlow && subscriptionTier === "payg" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <PoundSterling className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-amber-900 text-sm mb-1">Cost Per Trade</div>
                      <p className="text-amber-700 text-xs mb-2">
                        {analysisMode === "trades"
                          ? `£${estimatedModalCost.toFixed(2)} for ${effectiveTradeCount} trades`
                          : analysisMode === "months"
                            ? "£0.20 per trade analysed from the selected time period"
                            : "£0.20 per trade analysed from the uploaded CSV"}
                      </p>
                      <div className="text-amber-600 text-xs">
                        Final cost is calculated from your account pricing and any active ML-run referral discount.
                      </div>
                      {analysisOptions.referralCode && analysisOptions.mlRunDiscountPercent > 0 && (
                        <div className="mt-2 text-amber-700 text-xs">
                          Referral code `{analysisOptions.referralCode}` is active: {analysisOptions.mlRunDiscountPercent}% off ML runs.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 rounded-b-xl p-6 sm:p-8">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRunModelModal(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={isFreeFetchFlow ? handleFetchTradeData : handleRunModel}
                  disabled={
                    (isFreeFetchFlow
                      ? (analysisMode === "csv" && !csvFile)
                      : !canRunMlModel) ||
                    (analysisMode === "csv" && !csvFile) ||
                    (!isFreeFetchFlow && analysisMode === "trades" && !canRunTradeAnalysis)
                  }
                  className={`px-8 py-3 rounded-lg shadow-lg transition-all flex items-center gap-2 ${
                    (isFreeFetchFlow
                      ? (analysisMode === "csv" && !csvFile)
                      : !canRunMlModel) ||
                    (analysisMode === "csv" && !csvFile) ||
                    (!isFreeFetchFlow && analysisMode === "trades" && !canRunTradeAnalysis)
                      ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                  }`}
                  title={
                    !isFreeFetchFlow && isSubscriptionPaused
                      ? 'Resume your subscription to run the ML model'
                      : isFreeFetchFlow && analysisMode === "csv" && !csvFile
                      ? 'Please select a CSV file'
                      : !isFreeFetchFlow && !mlModelAccessEnabled
                      ? 'Subscribe to unlock ML model runs'
                      : analysisMode === "csv" && !csvFile
                      ? 'Please select a CSV file'
                      : !isFreeFetchFlow && analysisMode === "trades" && !canRunTradeAnalysis
                        ? 'At least 10 exported MetaTrader trades are required'
                        : ''
                  }
                >
                  {isFreeFetchFlow ? <RefreshCw className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                  {isFreeFetchFlow ? "Import Data" : "Run Analysis"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteRunPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-xl text-slate-900">Delete Run Data</h3>
            <p className="mt-2 text-sm text-slate-600">
              Choose what to remove for <span className="font-medium text-slate-900">{deleteRunPrompt.periodDescription}</span>. The billed run record and cost will stay in history either way.
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium text-slate-900">Delete ML Data Only</div>
                <div className="mt-1">
                  Removes the saved analysis report for this run, but keeps your saved journal trades.
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="font-medium text-amber-900">Delete ML Data And Trading Journal</div>
                <div className="mt-1">
                  Removes the saved analysis report for this run and clears the saved journal trades linked to this same run.
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setDeleteRunPrompt(null)}
                disabled={deletingRunId === deleteRunPrompt.id}
                className="rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRunData(deleteRunPrompt.id, false)}
                disabled={deletingRunId === deleteRunPrompt.id}
                className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingRunId === deleteRunPrompt.id ? "Deleting..." : "Delete ML Data Only"}
              </button>
              <button
                onClick={() => handleDeleteRunData(deleteRunPrompt.id, true)}
                disabled={deletingRunId === deleteRunPrompt.id}
                className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingRunId === deleteRunPrompt.id ? "Deleting..." : "Delete ML Data And Journal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
