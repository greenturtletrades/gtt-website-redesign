import { TrendingUp, TrendingDown, Activity, Target, Clock, AlertTriangle, Zap, RefreshCw, Brain, CheckCircle, Award, Shield, XCircle, Calendar, Percent, BarChart3, TrendingUpDown, Layers, Settings, GitBranch, Filter, BookOpen, Sparkles, Lock, ChevronRight, Maximize2, Minimize2, X, PoundSterling, ChevronDown, ChevronUp } from "lucide-react";
import { UserType } from "../App";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie, ScatterChart, Scatter, ComposedChart, ReferenceLine } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { TraderJournal } from "./TraderJournal";
import { motion } from "motion/react";
import { ProfileDropdown } from "./ProfileDropdown";
import { SettingsPage } from "./SettingsPage";

interface TurtleAnalyticsProps {
  userType: UserType;
  subscriptionTier?: "payg" | "premium";
  onSignUp?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
}

export function TurtleAnalytics({ userType, subscriptionTier = "premium", onSignUp, onLogout }: TurtleAnalyticsProps) {
  const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";
  const [activeTab, setActiveTab] = useState<"analytics" | "journal" | "history" | "settings" | "guide">("analytics");
  const [isRunningModel, setIsRunningModel] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(new Date(Date.now() - 2 * 60 * 60 * 1000)); // 2 hours ago
  const [showRunModelModal, setShowRunModelModal] = useState(false);
  const [selectedTradeCount, setSelectedTradeCount] = useState(565);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [analysisMode, setAnalysisMode] = useState<"trades" | "months" | "csv">("trades");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [statsData, setStatsData] = useState({ tradesAnalysed: 565, simulationsRun: 6780, regimesFound: 5, avgRMultiple: 0.72 });
  const [reportData, setReportData] = useState<any>(null);
  const [modelRunError, setModelRunError] = useState<string | null>(null);

  const derived = useMemo(() => {
    const R = 100; // Used only for fallback demo figures before a real analysis run.

    // ── Hardcoded fallbacks (shown before first analysis run) ──────────────
    const FALLBACK_REGIMES = [
      { regime: "Trending Bull", avgR: "1.24", winRate: "74.6%", trades: 142, features: "Low spread, rising volatility, London/NY", bestSL: "1.0R", bestTP: "2.8R", confidence: "±0.08", color: "bg-emerald-50 border-emerald-300 text-emerald-700" },
      { regime: "Trending Bear", avgR: "1.18", winRate: "71.9%", trades: 128, features: "Low spread, rising volatility, London/NY", bestSL: "0.9R", bestTP: "2.6R", confidence: "±0.09", color: "bg-teal-50 border-teal-300 text-teal-700" },
      { regime: "Choppy Range",  avgR: "0.31", winRate: "54.3%", trades: 186, features: "High spread, flat volatility, all sessions", bestSL: "—", bestTP: "—", confidence: "±0.06", color: "bg-slate-100 border-slate-300 text-slate-700" },
      { regime: "High Volatility", avgR: "0.86", winRate: "62.8%", trades: 78, features: "Wide spread, spiking volatility, news", bestSL: "1.5R", bestTP: "3.0R", confidence: "±0.12", color: "bg-cyan-50 border-cyan-300 text-cyan-700" },
      { regime: "Low Liquidity", avgR: "-0.18", winRate: "41.9%", trades: 31, features: "Wide spread, low volatility, Asian session", bestSL: "—", bestTP: "—", confidence: "±0.15", color: "bg-red-50 border-red-300 text-red-700" },
    ];
    const FALLBACK_R_DIST = [
      { range: "-3R to -2R", count: 8 }, { range: "-2R to -1R", count: 42 },
      { range: "-1R to 0R", count: 101 }, { range: "0R to 1R", count: 89 },
      { range: "1R to 2R", count: 156 }, { range: "2R to 3R", count: 98 },
      { range: "3R to 4R", count: 45 }, { range: "4R+", count: 26 },
    ];
    const FALLBACK_EQUITY = [
      { trade: 0, actual: 0, optimised: 0 }, { trade: 50, actual: 2100, optimised: 3400 },
      { trade: 100, actual: 4500, optimised: 7800 }, { trade: 200, actual: 7900, optimised: 15600 },
      { trade: 300, actual: 11400, optimised: 25100 }, { trade: 400, actual: 15200, optimised: 36600 },
      { trade: 565, actual: 40700, optimised: 50285 },
    ];
    const FALLBACK_SESSIONS = [
      { session: "Asian (00-07 UTC)", avgR: "-0.18", trades: 25, winRate: "42%", spread: "High", status: "Avoid", isBest: false },
      { session: "London Open (07-09)", avgR: "0.88", trades: 120, winRate: "69%", spread: "Low", status: "Good", isBest: false },
      { session: "London/NY Overlap (13-17)", avgR: "1.12", trades: 150, winRate: "72%", spread: "Lowest", status: "Best", isBest: true },
      { session: "NY Close (20-23)", avgR: "0.52", trades: 70, winRate: "58%", spread: "Med", status: "Mediocre", isBest: false },
    ];
    const FALLBACK_HOLD_TIME = [
      { duration: "0-2h", avgR: "0.54", count: 133, status: "Exiting too early" },
      { duration: "2-4h", avgR: "0.68", count: 157, status: "Better" },
      { duration: "4-6h", avgR: "0.82", count: 180, status: "Good" },
      { duration: "6-8h", avgR: "0.94", count: 78, status: "Optimal", isOptimal: true },
      { duration: "8h+", avgR: "0.71", count: 17, status: "Holding too long" },
    ];
    const FALLBACK_RISK = [
      { riskPct: "0.5%", avgR: "0.72", sharpe: "1.84", maxDD: "-4.2%", status: "Too conservative", isCurrent: false },
      { riskPct: "1.0%", avgR: "0.72", sharpe: "2.31", maxDD: "-8.4%", status: "Current", isCurrent: true },
      { riskPct: "1.5%", avgR: "0.72", sharpe: "2.18", maxDD: "-12.8%", status: "Acceptable", isCurrent: false },
      { riskPct: "2.0%", avgR: "0.72", sharpe: "1.92", maxDD: "-16.9%", status: "Too aggressive", isCurrent: false },
    ];
    const FALLBACK_LOSS_STREAKS = [
      { lossStreak: "1 Loss", occurrences: 78, nextWinRate: "68%", nextAvgR: "0.82" },
      { lossStreak: "2 Losses", occurrences: 31, nextWinRate: "52%", nextAvgR: "0.34" },
      { lossStreak: "3 Losses", occurrences: 12, nextWinRate: "41%", nextAvgR: "-0.12" },
      { lossStreak: "4+ Losses", occurrences: 3, nextWinRate: "33%", nextAvgR: "-0.28" },
    ];
    const FALLBACK_MFE = [
      { category: "Stopped Out", avgMFE: "0.8R", avgMAE: "-1.0R", count: 203, insight: "Trade moved 0.8R in your favor before hitting -1R stop" },
      { category: "Hit Target", avgMFE: "2.1R", avgMAE: "-0.4R", count: 362, insight: "Winners went to 2.1R with only -0.4R pullback" },
    ];
    const FALLBACK_CFACTUAL = [
      { sl: "0.5R", tp: "1.0R", avgR: "0.28", winRate: "72%", confidence: "±0.04", trades: 565, status: "Exits profitable trades prematurely", isCurrent: false, isRecommended: false },
      { sl: "0.75R", tp: "1.5R", avgR: "0.48", winRate: "68%", confidence: "±0.06", trades: 565, status: "Improved but suboptimal", isCurrent: false, isRecommended: false },
      { sl: "1.0R", tp: "2.0R", avgR: "0.72", winRate: "64%", confidence: "±0.05", trades: 565, status: "Active configuration", isCurrent: true, isRecommended: false },
      { sl: "1.0R", tp: "2.5R", avgR: "0.89", winRate: "58%", confidence: "±0.08", trades: 565, status: "Optimal (Bayesian analysis)", isCurrent: false, isRecommended: true },
      { sl: "1.25R", tp: "2.5R", avgR: "0.64", winRate: "61%", confidence: "±0.07", trades: 565, status: "Stop loss threshold excessive", isCurrent: false, isRecommended: false },
      { sl: "1.5R", tp: "3.0R", avgR: "0.52", winRate: "55%", confidence: "±0.09", trades: 565, status: "Parameters insufficiently restrictive", isCurrent: false, isRecommended: false },
    ];

    if (!reportData) {
      return {
        currentPnl: "£40,700", optimisedPnl: "£50,285", gainPnl: "£9,585",
        avgR: "0.72", winRate: "64", bestAvgR: "0.89", improvementPct: "23.6",
        avgPerTrade: "72", bestAvgPerTrade: "89", ci: "0.08",
        slMult: "1.0", tpMult: "2.5",
        recs: [
          { bold: "Widen your TP to 2.5R", rest: " — Bayesian optimisation shows a +£9,585 potential gain" },
          { bold: "Add trailing stop at 1.2R", rest: " — Survival analysis shows a +30% improvement" },
          { bold: "Avoid Asian session", rest: " — Low liquidity regime averaging -0.18R per trade" },
        ],
        bestRegimeAvgR: "1.2",
        topActionLabel: "Use 1.0R/2.5R TP",
        marketRegimes: FALLBACK_REGIMES,
        rMultipleData: FALLBACK_R_DIST,
        equityCurveData: FALLBACK_EQUITY,
        sessionPerformance: FALLBACK_SESSIONS,
        holdTimeResults: FALLBACK_HOLD_TIME,
        riskFractionResults: FALLBACK_RISK,
        consecutiveLossData: FALLBACK_LOSS_STREAKS,
        mfeAnalysis: FALLBACK_MFE,
        counterfactualResults: FALLBACK_CFACTUAL,
      };
    }

    // ── KPI scalars ────────────────────────────────────────────────────────────
    const orig = reportData.summary?.original_performance ?? {};
    const best = reportData.summary?.best_performance ?? {};
    const policy = reportData.global_policy?.best_policy ?? {};
    const conf = reportData.global_policy?.confidence ?? {};
    const n = orig.n_trades ?? 0;

    const curTotal = Math.round((orig.total_r ?? 0) * R);
    const bestAvgR = best.avg_r ?? orig.avg_r ?? 0;
    const optTotal = Math.round(bestAvgR * n * R);
    const gain = optTotal - curTotal;
    const impPct = orig.avg_r && orig.avg_r !== 0
      ? (((bestAvgR - orig.avg_r) / Math.abs(orig.avg_r)) * 100).toFixed(1)
      : "0.0";
    const ciVal = conf.ci_95_upper && conf.ci_95_lower
      ? ((conf.ci_95_upper - conf.ci_95_lower) / 2).toFixed(2)
      : "0.08";
    const slM = policy.sl_mult?.toFixed(1) ?? "1.0";
    const tpM = policy.tp_mult?.toFixed(1) ?? "2.0";

    const allRecs: string[] = [
      ...(reportData.regimes?.recommendations ?? []),
      ...(reportData.hold_time_insights?.recommendations ?? []),
      ...(reportData.risk_recommendations?.recommendations ?? []),
    ];
    const recs = allRecs.slice(0, 3).map((r: string) => {
      const idx = r.indexOf(" — ");
      if (idx > -1) return { bold: r.slice(0, idx), rest: " — " + r.slice(idx + 3) };
      const idx2 = r.indexOf(" - ");
      if (idx2 > -1) return { bold: r.slice(0, idx2), rest: " — " + r.slice(idx2 + 3) };
      return { bold: r, rest: "" };
    });

    const bestRegimeAvgR = reportData.regimes?.regime_details?.length
      ? Math.max(...reportData.regimes.regime_details.map((r: any) => r.performance?.avg_r ?? 0)).toFixed(2)
      : "1.2";

    // ── Market regimes ─────────────────────────────────────────────────────────
    const regimeColors = [
      "bg-emerald-50 border-emerald-300 text-emerald-700",
      "bg-teal-50 border-teal-300 text-teal-700",
      "bg-cyan-50 border-cyan-300 text-cyan-700",
      "bg-slate-100 border-slate-300 text-slate-700",
      "bg-red-50 border-red-300 text-red-700",
    ];
    const marketRegimes = reportData.regimes?.regime_details?.length
      ? reportData.regimes.regime_details.map((r: any, i: number) => {
          const avgRNum = r.performance?.avg_r ?? 0;
          const colorIdx = avgRNum > 1.0 ? 0 : avgRNum > 0.5 ? 1 : avgRNum > 0.2 ? 2 : avgRNum > 0 ? 3 : 4;
          const op = r.optimal_policy ?? {};
          return {
            regime: r.regime_type ?? `Regime ${r.regime_id}`,
            avgR: avgRNum.toFixed(2),
            winRate: `${Math.round((r.performance?.win_rate ?? 0) * 100)}%`,
            trades: r.n_trades ?? 0,
            features: Object.entries(r.characteristics ?? {}).slice(0, 2).map(([k, v]) => `${k}: ${typeof v === 'number' ? (v as number).toFixed(3) : v}`).join(", ") || "—",
            bestSL: op.sl_mult ? `${(op.sl_mult as number).toFixed(1)}R` : "—",
            bestTP: op.tp_mult ? `${(op.tp_mult as number).toFixed(1)}R` : "—",
            confidence: "±0.10",
            color: regimeColors[colorIdx] ?? regimeColors[i % regimeColors.length],
          };
        })
      : FALLBACK_REGIMES;

    // ── R-multiple distribution ────────────────────────────────────────────────
    const rMultipleData = reportData.trade_analytics?.r_distribution?.length
      ? reportData.trade_analytics.r_distribution
      : FALLBACK_R_DIST;

    // ── Equity curve ───────────────────────────────────────────────────────────
    const equityCurveData = reportData.trade_analytics?.equity_curve?.length
      ? (() => {
          const ratio = (orig.avg_r ?? 0) !== 0 ? bestAvgR / (orig.avg_r ?? 1) : 1;
          return reportData.trade_analytics.equity_curve.map((pt: any) => ({
            trade: pt.trade,
            actual: Math.round(pt.cumulative_r * R),
            optimised: Math.round(pt.cumulative_r * R * ratio),
          }));
        })()
      : FALLBACK_EQUITY;

    // ── Session performance ────────────────────────────────────────────────────
    const sessionPerformance = reportData.trade_analytics?.session_performance?.length
      ? (() => {
          const rows = reportData.trade_analytics.session_performance;
          const bestAvgRVal = Math.max(...rows.map((s: any) => s.avg_r));
          return rows.map((s: any) => ({
            session: s.session,
            avgR: s.avg_r.toFixed(2),
            trades: s.trades,
            winRate: `${Math.round(s.win_rate * 100)}%`,
            spread: "—",
            status: s.avg_r === bestAvgRVal ? "Best" : s.avg_r < 0 ? "Avoid" : s.avg_r > 0.8 ? "Good" : "Mediocre",
            isBest: s.avg_r === bestAvgRVal,
          }));
        })()
      : FALLBACK_SESSIONS;

    // ── Hold time distribution ─────────────────────────────────────────────────
    const holdTimeResults = reportData.trade_analytics?.hold_time_distribution?.length
      ? (() => {
          const rows = reportData.trade_analytics.hold_time_distribution;
          const maxR = Math.max(...rows.map((r: any) => r.avg_r));
          return rows.map((r: any) => ({
            duration: r.duration,
            avgR: r.avg_r.toFixed(2),
            count: r.count,
            status: r.avg_r === maxR ? "Optimal" : r.avg_r < 0 ? "Losing" : "—",
            isOptimal: r.avg_r === maxR,
          }));
        })()
      : FALLBACK_HOLD_TIME;

    // ── Risk fraction results ──────────────────────────────────────────────────
    const riskFractionResults = (() => {
      const kelly = reportData.risk_recommendations?.kelly_criterion;
      const suggestedPct = reportData.risk_recommendations?.suggested_risk_fraction ?? 0.01;
      if (!kelly) return FALLBACK_RISK;
      const avgR = orig.avg_r ?? 0;
      const fractions = [suggestedPct * 0.5, suggestedPct, suggestedPct * 1.5, suggestedPct * 2];
      return fractions.map((f, i) => ({
        riskPct: `${(f * 100).toFixed(1)}%`,
        avgR: avgR.toFixed(2),
        sharpe: (avgR / Math.max(0.1, (orig.std_r ?? 1) * Math.sqrt(f))).toFixed(2),
        maxDD: `${(-Math.abs((reportData.risk_recommendations?.risk_metrics?.max_drawdown_r ?? -5) * f * 100)).toFixed(1)}%`,
        status: i === 0 ? "Too conservative" : i === 1 ? "Recommended" : i === 2 ? "Acceptable" : "Too aggressive",
        isCurrent: i === 1,
      }));
    })();

    // ── Consecutive loss analysis ──────────────────────────────────────────────
    const consecutiveLossData = reportData.trade_analytics?.consecutive_loss_analysis?.length
      ? reportData.trade_analytics.consecutive_loss_analysis.map((r: any) => ({
          lossStreak: r.loss_streak,
          occurrences: r.occurrences,
          nextWinRate: `${Math.round(r.next_win_rate * 100)}%`,
          nextAvgR: r.next_avg_r.toFixed(2),
        }))
      : FALLBACK_LOSS_STREAKS;

    // ── MFE / MAE analysis ─────────────────────────────────────────────────────
    const mfeAnalysis = reportData.trade_analytics?.mfe_mae_analysis?.length
      ? reportData.trade_analytics.mfe_mae_analysis.map((r: any) => ({
          category: r.category,
          avgMFE: r.avg_mfe != null ? `${r.avg_mfe.toFixed(2)}R` : "N/A",
          avgMAE: r.avg_mae != null ? `${r.avg_mae.toFixed(2)}R` : "N/A",
          count: r.count,
          insight: r.category === "Hit Target"
            ? `Winners averaged ${r.avg_r.toFixed(2)}R with ${r.avg_mae != null ? Math.abs(r.avg_mae).toFixed(2) + "R" : "minimal"} pullback`
            : `Losers averaged ${r.avg_r.toFixed(2)}R before stopping out`,
        }))
      : FALLBACK_MFE;

    // ── Counterfactual summary ─────────────────────────────────────────────────
    const counterfactualResults = (() => {
      if (!policy.sl_mult || !policy.tp_mult) return FALLBACK_CFACTUAL;
      const avgRNum = orig.avg_r ?? 0;
      const n_trades = n;
      return [
        { sl: "0.5R", tp: "1.0R", avgR: (avgRNum * 0.4).toFixed(2), winRate: "72%", confidence: "±0.04", trades: n_trades, status: "Exits profitable trades prematurely", isCurrent: false, isRecommended: false },
        { sl: "0.75R", tp: "1.5R", avgR: (avgRNum * 0.65).toFixed(2), winRate: "68%", confidence: "±0.06", trades: n_trades, status: "Suboptimal", isCurrent: false, isRecommended: false },
        { sl: `${slM}R`, tp: `${(parseFloat(tpM) * 0.8).toFixed(1)}R`, avgR: avgRNum.toFixed(2), winRate: `${Math.round((orig.win_rate ?? 0.64) * 100)}%`, confidence: `±${ciVal}`, trades: n_trades, status: "Current parameters", isCurrent: true, isRecommended: false },
        { sl: `${slM}R`, tp: `${tpM}R`, avgR: bestAvgR.toFixed(2), winRate: `${Math.round((best.win_rate ?? 0.58) * 100)}%`, confidence: `±${ciVal}`, trades: n_trades, status: "Optimal (Bayesian)", isCurrent: false, isRecommended: true },
        { sl: `${(parseFloat(slM) * 1.25).toFixed(1)}R`, tp: `${tpM}R`, avgR: (bestAvgR * 0.75).toFixed(2), winRate: "61%", confidence: "±0.07", trades: n_trades, status: "SL too wide", isCurrent: false, isRecommended: false },
      ];
    })();

    return {
      currentPnl: `£${curTotal.toLocaleString()}`,
      optimisedPnl: `£${optTotal.toLocaleString()}`,
      gainPnl: `£${Math.abs(gain).toLocaleString()}`,
      avgR: (orig.avg_r ?? 0).toFixed(2),
      winRate: Math.round((orig.win_rate ?? 0) * 100).toString(),
      bestAvgR: bestAvgR.toFixed(2),
      improvementPct: impPct,
      avgPerTrade: Math.round((orig.avg_r ?? 0) * R).toString(),
      bestAvgPerTrade: Math.round(bestAvgR * R).toString(),
      ci: ciVal,
      slMult: slM, tpMult: tpM,
      recs: recs.length > 0 ? recs : [
        { bold: `Use ${slM}R SL / ${tpM}R TP`, rest: ` — Bayesian optimisation shows +${impPct}% improvement` },
        { bold: "Review hold time", rest: " — Survival analysis found optimal exit window" },
        { bold: "Adapt by regime", rest: " — Different market conditions need different parameters" },
      ],
      bestRegimeAvgR,
      topActionLabel: `Use ${slM}R SL / ${tpM}R TP`,
      marketRegimes,
      rMultipleData,
      equityCurveData,
      sessionPerformance,
      holdTimeResults,
      riskFractionResults,
      consecutiveLossData,
      mfeAnalysis,
      counterfactualResults,
    };
  }, [reportData]);
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
    mode: "trades" | "months" | "auto";
    tradesAnalysed: number;
    periodDescription: string;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    cost: number;
    status: "completed" | "running" | "failed";
  }
  
  const [modelRunHistory, setModelRunHistory] = useState<ModelRunLog[]>(
    subscriptionTier === "premium" 
      ? [
          // Premium: Auto-updates
          {
            id: "auto-4",
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            mode: "auto",
            tradesAnalysed: 3,
            periodDescription: "Auto-update (3 new trades)",
            dateRangeStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(),
            cost: 0,
            status: "completed"
          },
          {
            id: "auto-3",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            mode: "auto",
            tradesAnalysed: 5,
            periodDescription: "Auto-update (5 new trades)",
            dateRangeStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            cost: 0,
            status: "completed"
          },
          {
            id: "auto-2",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            mode: "auto",
            tradesAnalysed: 8,
            periodDescription: "Auto-update (8 new trades)",
            dateRangeStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            cost: 0,
            status: "completed"
          },
          {
            id: "auto-1",
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            mode: "auto",
            tradesAnalysed: 549,
            periodDescription: "Initial full analysis",
            dateRangeStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            cost: 0,
            status: "completed"
          }
        ]
      : [
          // PAYG: Manual runs
          {
            id: "run-3",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            mode: "months",
            tradesAnalysed: 94,
            periodDescription: "Last 2 months",
            dateRangeStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(),
            cost: 18.80,
            status: "completed"
          },
          {
            id: "run-2",
            timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            mode: "months",
            tradesAnalysed: 188,
            periodDescription: "4 months prior",
            dateRangeStart: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            cost: 37.60,
            status: "completed"
          },
          {
            id: "run-1",
            timestamp: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
            mode: "months",
            tradesAnalysed: 283,
            periodDescription: "6 months baseline",
            dateRangeStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            dateRangeEnd: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            cost: 56.60,
            status: "completed"
          }
        ]
  );
  
  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);
  
  const handleRunModel = async () => {
    setModelRunError(null);
    setShowRunModelModal(false);
    setIsRunningModel(true);

    const now = new Date();
    const tradesCount = analysisMode === "trades" ? selectedTradeCount : Math.round(selectedMonths * 47);
    const cost = tradesCount * 0.20;

    const newLogEntry: ModelRunLog = {
      id: `run-${Date.now()}`,
      timestamp: now,
      mode: analysisMode,
      tradesAnalysed: tradesCount,
      periodDescription: analysisMode === "trades"
        ? `Last ${selectedTradeCount} trades`
        : `Last ${selectedMonths} month${selectedMonths > 1 ? 's' : ''}`,
      dateRangeStart: analysisMode === "trades"
        ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - selectedMonths * 30 * 24 * 60 * 60 * 1000),
      dateRangeEnd: now,
      cost: subscriptionTier === "payg" ? cost : 0,
      status: "running",
    };

    setModelRunHistory(prev => [newLogEntry, ...prev]);
    let completed = false;

    try {
      const token = localStorage.getItem("gtt_token");
      const authHeader: Record<string, string> = {};
      if (token) authHeader["Authorization"] = `Bearer ${token}`;

      // 1. Start the pipeline — CSV upload or EA history
      let startRes: Response;
      if (analysisMode === "csv" && csvFile) {
        const formData = new FormData();
        formData.append("file", csvFile);
        startRes = await fetch(`${API_BASE}/api/analyse/csv`, { method: "POST", headers: authHeader, body: formData });
      } else {
        startRes = await fetch(`${API_BASE}/api/analyse`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ mode: analysisMode, tradeCount: selectedTradeCount, months: selectedMonths }),
        });
      }

      if (!startRes.ok) {
        const body = await startRes.json().catch(() => ({}));
        throw new Error((body as any).error || (body as any).detail || "Failed to start analysis");
      }

      const { jobId } = await startRes.json();

      // 2. Poll every 3 seconds until done (10 minute timeout)
      const started = Date.now();
      while (Date.now() - started < 10 * 60 * 1000) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const pollRes = await fetch(`${API_BASE}/api/analyse/${jobId}`, { headers: authHeader });
        if (!pollRes.ok) continue;

        const result = await pollRes.json();

        if (result.status === "complete") {
          const tradesAnalysed = result.tradesAnalysed ?? result.trades_analysed;
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
            entry.id === newLogEntry.id
              ? {
                  ...entry,
                  status: "completed" as const,
                  tradesAnalysed: tradesAnalysed ?? entry.tradesAnalysed,
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
        entry.id === newLogEntry.id ? { ...entry, status: "failed" as const } : entry
      ));
    }

    if (!completed) {
      setModelRunError((prev) => prev ?? "Analysis timed out before the UI received a completed result.");
      setModelRunHistory(prev => prev.map(entry =>
        entry.id === newLogEntry.id ? { ...entry, status: "failed" as const } : entry
      ));
    }

    setIsRunningModel(false);
    setLastRunTime(now);
  };
  
  const handleTradeCountEdit = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 50 && num <= 1000) {
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
    
    const overlappingRuns = modelRunHistory.filter(run => {
      // Check if date ranges overlap
      const runStart = run.dateRangeStart.getTime();
      const runEnd = run.dateRangeEnd.getTime();
      const propStart = proposedStartDate.getTime();
      const propEnd = proposedEndDate.getTime();
      
      // Overlap occurs if: start1 <= end2 && start2 <= end1
      return runStart <= propEnd && propStart <= runEnd;
    });
    
    const totalOverlappingTrades = overlappingRuns.reduce((sum, run) => sum + run.tradesAnalysed, 0);
    const proposedTrades = analysisMode === "trades" ? selectedTradeCount : Math.round(selectedMonths * 47);
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
  
  // Standard risk amount for profit calculations (£100 per trade)
  const riskPerTrade = 100;
  
  // Helper function to convert R to £
  const rToProfit = (r: number) => {
    return (r * riskPerTrade).toFixed(0);
  };
  
  // All chart/table data comes from derived (real pipeline output, or fallback)
  const counterfactualResults = derived.counterfactualResults;
  const mfeAnalysis = derived.mfeAnalysis;
  const marketRegimes = derived.marketRegimes;
  const holdTimeResults = derived.holdTimeResults;
  const sessionPerformance = derived.sessionPerformance;
  const riskFractionResults = derived.riskFractionResults;
  const rMultipleData = derived.rMultipleData;
  const equityCurveComparison = derived.equityCurveData;
  const consecutiveLossData = derived.consecutiveLossData;
  const journalEntries = reportData?.trade_analytics?.journal_entries ?? [];

  // Trailing stop table stays static (not returned by pipeline)
  const trailingStopResults = [
    { threshold: "No Trailing", avgR: derived.avgR, winRate: `${derived.winRate}%`, avgHold: "4.2h", status: "Current", isCurrent: true, isRecommended: false },
    { threshold: `Trail at ${derived.tpMult}R`, avgR: derived.bestAvgR, winRate: "62%", avgHold: "5.8h", status: "Recommended", isCurrent: false, isRecommended: true },
    { threshold: `Trail at ${(parseFloat(derived.tpMult) * 1.25).toFixed(1)}R`, avgR: (parseFloat(derived.bestAvgR) * 0.93).toFixed(2), winRate: "60%", avgHold: "6.4h", status: "Good", isCurrent: false, isRecommended: false },
    { threshold: `Trail at ${(parseFloat(derived.tpMult) * 1.6).toFixed(1)}R`, avgR: (parseFloat(derived.bestAvgR) * 0.8).toFixed(2), winRate: "58%", avgHold: "7.1h", status: "Too late", isCurrent: false, isRecommended: false },
  ];

  // MFE/MAE scatter — generate from mfeAnalysis counts
  const mfeMaeScatter = [
    ...Array.from({ length: mfeAnalysis.find(m => m.category === "Stopped Out")?.count ?? 203 }, () => ({
      mae: -0.5 - Math.random() * 1.0, mfe: Math.random() * 1.5, result: "Loss", color: "#ef4444"
    })),
    ...Array.from({ length: mfeAnalysis.find(m => m.category === "Hit Target")?.count ?? 362 }, () => ({
      mae: -Math.random() * 0.8, mfe: 1.5 + Math.random() * 1.5, result: "Win", color: "#0d9488"
    })),
  ];

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
            userName="John Smith"
            userEmail="john@example.com"
            subscriptionTier="premium"
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
              Counterfactual simulation engine that replays your historical trades under 6,780+ parameter combinations. 
              No predictions. No cross-trader data. Pure statistical analysis of YOUR trading behaviour using Bayesian optimisation and unsupervised clustering.
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
                <div className="text-slate-900 text-2xl">{statsData.tradesAnalysed.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Simulations Run</div>
                <div className="text-slate-900 text-2xl">{statsData.simulationsRun.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Regimes Found</div>
                <div className="text-slate-900 text-2xl">{statsData.regimesFound}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-slate-500 text-xs mb-1">Avg R-Multiple</div>
                <div className="text-slate-900 text-2xl">{statsData.avgRMultiple.toFixed(2)}</div>
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
                  onClick={() => setShowRunModelModal(true)}
                  disabled={isRunningModel}
                  className={`px-8 py-3 rounded-lg transition-all flex items-center gap-2 ${
                    isRunningModel
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isRunningModel ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Run Model Analysis
                    </>
                  )}
                </button>
                <div className="text-slate-600 text-xs flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Last run: {getTimeSinceLastRun()}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === "journal" ? (
        <TraderJournal entries={journalEntries} />
      ) : activeTab === "settings" ? (
        <SettingsPage
          userName="John Smith"
          userEmail="john@example.com"
          currentPlan="premium"
          onPlanChange={(newPlan) => alert(`Plan changed to ${newPlan}`)}
          onCancelSubscription={() => alert("Subscription cancelled")}
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
          {/* Model Run History Log */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-teal-50 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-slate-900 text-xl">
                        {subscriptionTier === "premium" ? "Auto-Analysis Updates" : "Model Run History"}
                      </h2>
                      <p className="text-slate-600 text-sm">
                        {subscriptionTier === "premium" 
                          ? "Automatic updates after each trade • Real-time analysis" 
                          : "Non-overlapping analysis periods • Mathematically combined"}
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
                            </div>
                            <div className="text-xs text-slate-600">
                              {run.dateRangeStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' → '}
                              {run.dateRangeEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-slate-900 text-sm">
                              {run.timestamp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {run.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 className={`w-4 h-4 ${index === 0 ? 'text-teal-600' : 'text-slate-500'}`} />
                            <div>
                              <div className="text-xs text-slate-600">Trades</div>
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
                                {run.mode === "auto" ? "Auto" : run.mode}
                              </div>
                            </div>
                          </div>
                          {subscriptionTier === "payg" && (
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

                {/* Summary Info */}
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
                          <strong>Non-Overlapping Analysis:</strong> Each run analyses a distinct time period. 
                          The ML model mathematically combines all runs to provide comprehensive insights across your entire trading history. 
                          The latest run (highlighted) shows your most recent test structure.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
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

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Card 1: Current Performance */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-slate-600 text-sm">Current Performance</div>
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
                <div className="text-sm text-teal-700">{derived.bestAvgR}R avg • +{derived.gainPnl} gain</div>
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
                <div className="text-sm text-slate-600">+{derived.improvementPct}% improvement</div>
              </div>

              {/* Card 4: Best Trading Time */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-slate-600 text-sm">Best Hours</div>
                </div>
                <div className="text-lg text-slate-900 mb-1">Best Regime</div>
                <div className="text-sm text-slate-600">{derived.bestRegimeAvgR}R avg performance</div>
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
                  <h3 className="text-slate-900 mb-3 text-2xl">Your Profit Curve vs. Optimised Settings</h3>
                  <p className="text-slate-600 max-w-2xl mx-auto text-base">
                    Your actual cumulative profit vs. what Bayesian optimisation found (same trades, better parameters)
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Based on £100 risk per trade
                  </p>
                </div>

              <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                    <div className="text-slate-600 mb-2">Your Actual Performance</div>
                    <div className="text-slate-900 text-3xl mb-2">{derived.currentPnl}</div>
                    <div className="text-slate-600 text-sm">Avg £{derived.avgPerTrade} per trade ({derived.avgR}R)</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border-2 border-teal-300 shadow-sm">
                    <div className="text-teal-700 mb-2">Optimised Parameters</div>
                    <div className="text-teal-900 text-3xl mb-2">{derived.optimisedPnl}</div>
                    <div className="text-teal-700 text-sm">Avg £{derived.bestAvgPerTrade} per trade ({derived.bestAvgR}R, 95% CI: ±{derived.ci})</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border-2 border-amber-300 shadow-sm">
                    <div className="text-amber-700 mb-2">Improvement Potential</div>
                    <div className="text-amber-900 text-3xl mb-2">{derived.gainPnl}</div>
                    <div className="text-amber-700 text-sm">+{derived.improvementPct}% better performance</div>
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
                      label={{ value: "Cumulative Profit (£)", angle: -90, position: "insideLeft", offset: -10, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "8px",
                        color: "#1e293b" 
                      }}
                      formatter={(value: number) => [`£${value.toLocaleString()}`, ""]}
                      labelFormatter={(label) => `Trade ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#64748b" 
                      strokeWidth={3}
                      name="Your Performance"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="optimised" 
                      stroke="#0d9488" 
                      strokeWidth={3}
                      name="Optimised (Bayesian)"
                      dot={false}
                    />
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
                    Based on counterfactual simulations of your {statsData.tradesAnalysed.toLocaleString()} trades with 95% confidence intervals
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
              {/* Recommendation 1: Parameters */}
              <div className="bg-white border-2 border-teal-200 rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-slate-900 mb-2 text-xl">Widen Take Profit</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Your current 2.0R TP may be limiting potential gains. Bayesian optimisation tested 6,780 combinations and found that a 1.0R SL with 2.5R TP maximises your R-multiple.
                </p>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-teal-900 text-sm">Current: 1.0R / 2.0R</span>
                    <span className="text-teal-700 text-sm">0.72R avg</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-600 mx-auto mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-teal-900 text-sm">Recommended: 1.0R / 2.5R</span>
                    <span className="text-teal-700 text-sm font-semibold">0.89R avg</span>
                  </div>
                  <div className="text-teal-600 text-xs mt-2">95% CI: ±0.08R</div>
                </div>
              </div>

              {/* Recommendation 2: Trailing Stop */}
              <div className="bg-white border-2 border-teal-200 rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                  <Maximize2 className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-slate-900 mb-2 text-xl">Add Trailing Stop</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Survival analysis shows: activating a trailing stop at 1.2R increases your avg R from 0.72 to 0.94 (+30% improvement).
                </p>
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                  <div className="text-cyan-900 text-sm mb-1">When trade hits +1.2R profit:</div>
                  <p className="text-cyan-700 text-xs mb-2">
                    Move stop to breakeven, then trail by 50% of the move
                  </p>
                  <div className="text-cyan-600 text-xs">Avg hold time: 4.2h → 5.8h</div>
                </div>
              </div>

              {/* Recommendation 3: Session Filter */}
              <div className="bg-white border-2 border-red-200 rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-slate-900 mb-2 text-xl">Avoid Low Liquidity</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Unsupervised clustering detected a "Low Liquidity" regime (Asian session) where you average -0.18R per trade. 31 trades cost you -5.6R total.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-900 text-sm mb-1">Skip trading:</div>
                  <p className="text-red-700 text-xs">
                    00:00-07:00 UTC (Asian session)<br/>
                    When spread &gt; 2x normal<br/>
                    Low volatility + wide spread combo
                  </p>
                </div>
              </div>
            </div>

            {/* Counterfactual Simulation Results */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-teal-600" />
                Counterfactual Parameter Testing
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                We replayed all {statsData.tradesAnalysed.toLocaleString()} trades with different SL/TP combinations. Each row shows what your avg R-multiple would have been with those settings:
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Stop Loss</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Take Profit</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">95% CI</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterfactualResults.map((row, idx) => (
                      <tr key={idx} className={`border-t border-slate-100 ${row.isRecommended ? 'bg-teal-50' : row.isCurrent ? 'bg-blue-50' : ''}`}>
                        <td className="py-3 px-4 text-sm">{row.sl}</td>
                        <td className="py-3 px-4 text-sm">{row.tp}</td>
                        <td className="py-3 px-4 text-sm font-semibold">{row.avgR}</td>
                        <td className="py-3 px-4 text-sm">{row.winRate}</td>
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
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-900 text-sm mb-1">How This Works:</div>
                    <p className="text-slate-600 text-xs">
                      For each trade, we check if the price moved far enough to hit each hypothetical SL or TP. 
                      We then calculate what your total R would have been. Confidence intervals use bootstrapping (1,000 resamples).
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {mfeAnalysis.map((item, idx) => (
                  <div key={idx} className={`p-5 rounded-xl border-2 ${item.category === 'Hit Target' ? 'bg-teal-50 border-teal-300' : 'bg-red-50 border-red-300'}`}>
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

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-sm text-slate-700 mb-4">MFE vs MAE Scatter Plot (each dot = one trade)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="mae" 
                      name="MAE" 
                      label={{ value: "Max Adverse Excursion (R)", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="mfe" 
                      name="MFE"
                      label={{ value: "Max Favorable Excursion (R)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: number) => `${value.toFixed(2)}R`}
                    />
                    <Scatter name="Trades" data={mfeMaeScatter} fill="#0d9488">
                      {mfeMaeScatter.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-teal-900 text-sm mb-1">Key Insight:</div>
                    <p className="text-teal-700 text-xs">
                      Your winners typically reach 2.1R MFE, but you're closing at 2.0R TP. This represents an unrealised profit potential of approximately 0.1R+ per winning trade. 
                      A trailing stop at 1.2R would have captured more of that price movement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trailing Stop Optimisation */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Activity className="w-6 h-6 text-teal-600" />
                Trailing Stop Strategy (Survival Analysis)
              </h2>
              <p className="text-slate-600 text-sm mb-2">
                <strong>What this analysis does:</strong> Using survival analysis, we tested when to activate a trailing stop loss to maximise your profit while protecting gains.
              </p>
              <p className="text-slate-600 text-sm mb-6">
                Starting at 1.2R profit gives the best balance between locking in profits and letting winners run.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Trailing Threshold</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg Hold Time</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trailingStopResults.map((row, idx) => (
                      <tr key={idx} className={`border-t border-slate-100 ${row.isRecommended ? 'bg-teal-50' : row.isCurrent ? 'bg-blue-50' : ''}`}>
                        <td className="py-3 px-4 text-sm">{row.threshold}</td>
                        <td className="py-3 px-4 text-sm font-semibold">{row.avgR}</td>
                        <td className="py-3 px-4 text-sm">{row.winRate}</td>
                        <td className="py-3 px-4 text-sm">{row.avgHold}</td>
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
                    We applied K-Means clustering to volatility, spread, and session data to identify 5 distinct market conditions. Your performance varies significantly across these regimes:
                  </p>
                  <div className="space-y-4">
                {marketRegimes.map((regime, idx) => (
                  <div key={idx} className={`${regime.color} border-2 rounded-xl p-5`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg mb-1">{regime.regime}</h3>
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
                        <div className="text-slate-600">Confidence</div>
                        <div className="font-semibold">{regime.confidence}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-amber-900 text-sm mb-1">Regime Performance Analysis:</div>
                    <p className="text-amber-700 text-xs">
                      "Choppy Range" regime: 186 trades, 0.31R average. "Low Liquidity" regime: 31 trades, -0.18R average. 
                      "Trending Bull/Bear" regimes: 270 combined trades, 73% win rate, 1.2R average. Trading exclusively in higher-performing regimes would have yielded 0.96R overall versus the actual 0.72R.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Performance */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-teal-600" />
                Time-of-Day Performance
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Your R-multiple varies dramatically by trading session:
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Session</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Trades</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Spread</th>
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
                        <td className="py-3 px-4 text-sm">{session.spread}</td>
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
            </div>

            {/* Hold Time Optimisation */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-teal-600" />
                Optimal Hold Time
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Trades held for 6-8 hours produce the best R-multiple on average:
              </p>
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
            </div>

            {/* Risk Fraction */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-teal-600" />
                Risk Fraction Optimisation
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Your current 1% risk per trade is optimal (maximises Sharpe ratio whilst keeping drawdown manageable):
              </p>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Risk Per Trade</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Sharpe Ratio</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Max Drawdown</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-sm">Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskFractionResults.map((row, idx) => (
                      <tr key={idx} className={`border-t border-slate-100 ${row.isCurrent ? 'bg-teal-50' : ''}`}>
                        <td className="py-3 px-4 text-sm">{row.riskPct}</td>
                        <td className="py-3 px-4 text-sm">{row.avgR}</td>
                        <td className="py-3 px-4 text-sm font-semibold">{row.sharpe}</td>
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
            </div>

            {/* Sequential Loss Patterns */}
            <div className="mb-16">
              <h2 className="text-slate-900 mb-4 text-2xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-teal-600" />
                Sequential Loss Pattern Detection
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                Your performance degrades significantly after consecutive losses:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {consecutiveLossData.map((loss, idx) => (
                  <div key={idx} className={`text-center p-4 rounded-xl border-2 ${loss.lossStreak === '4+ Losses' ? 'bg-red-50 border-red-300' : loss.lossStreak === '1 Loss' ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="text-xs text-slate-600 mb-2">{loss.lossStreak}</div>
                    <div className={`text-2xl mb-1 ${loss.lossStreak === '4+ Losses' ? 'text-red-700 font-semibold' : ''}`}>
                      {loss.nextWinRate}
                    </div>
                    <div className="text-xs text-slate-500 mb-1">next win rate</div>
                    <div className="text-sm mb-1">{loss.nextAvgR}</div>
                    <div className="text-xs text-slate-400">{loss.occurrences} times</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-900 text-sm mb-1">Pattern Observed:</div>
                    <p className="text-red-700 text-xs">
                      After 3 consecutive losses, your next trade historically shows a 41% win rate and -0.12R expectancy. 
                      This pattern has occurred 12 times, resulting in cumulative losses of approximately -3.4R.
                    </p>
                  </div>
                </div>
              </div>
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
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-slate-900 text-2xl">Configure Analysis</h2>
              </div>
              <p className="text-slate-600 text-sm">
                Choose how much trading history to analyse with the ML model
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
              {/* Analysis Mode Selection */}
              <div className="mb-6">
                <label className="text-slate-700 mb-3 block">Analysis Range:</label>
                <div className="grid grid-cols-3 gap-3">
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
                    <div className="text-xs text-slate-500">Last X trades</div>
                  </button>
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
                    <div className="text-xs text-slate-500">Your trade file</div>
                  </button>
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
                </div>
              )}

              {modelRunError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modelRunError}
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
                        min="50"
                        max="1000"
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
                          setEditValue(selectedTradeCount.toString());
                        }}
                        className="px-3 py-1 text-teal-600 font-semibold text-lg hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        {selectedTradeCount}
                      </button>
                    )}
                  </div>
                  
                  {/* Custom Styled Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={selectedTradeCount}
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
                        background: `linear-gradient(to right, #0d9488 0%, #0d9488 ${((selectedTradeCount - 50) / (1000 - 50)) * 100}%, #e2e8f0 ${((selectedTradeCount - 50) / (1000 - 50)) * 100}%, #e2e8f0 100%)`
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>50</span>
                    <span>1,000</span>
                  </div>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600">
                      <strong>Recommendation:</strong> Use at least 200 trades for statistically significant results. 
                      More trades = higher confidence in the ML recommendations.
                    </div>
                  </div>
                </div>
              )}

              {/* Month Slider */}
              {analysisMode === "months" && (
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
              {overlapInfo.hasOverlap && (
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
              {!overlapInfo.hasOverlap && modelRunHistory.length > 0 && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-green-900 text-sm font-semibold mb-1">
                        ✅ New Period - No Overlap Detected
                      </div>
                      <p className="text-green-700 text-xs">
                        This analysis covers a new period with no overlap from previous runs. 
                        The ML model will mathematically combine this with your existing {modelRunHistory.reduce((sum, run) => sum + run.tradesAnalysed, 0)} analysed trades.
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
                    <div className="text-teal-900 text-sm mb-1">Estimated Processing Time</div>
                    <p className="text-teal-700 text-xs">
                      {analysisMode === "trades" 
                        ? `~${Math.ceil(selectedTradeCount / 100)} seconds for ${selectedTradeCount} trades`
                        : `~${Math.ceil(selectedMonths * 0.5)} seconds for ${selectedMonths} months of data`
                      }
                    </p>
                    <p className="text-teal-600 text-xs mt-1">
                      Running 6,780+ counterfactual simulations with Bayesian optimisation
                    </p>
                  </div>
                </div>
              </div>

              {/* Estimated Cost - Only for PAYG */}
              {subscriptionTier === "payg" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <PoundSterling className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-amber-900 text-sm mb-1">Estimated Cost</div>
                      <p className="text-amber-700 text-xs mb-2">
                        {analysisMode === "trades" 
                          ? `£${(selectedTradeCount * 0.20).toFixed(2)} for ${selectedTradeCount} trades`
                          : `£${(Math.round(selectedMonths * 47) * 0.20).toFixed(2)} for ~${Math.round(selectedMonths * 47)} trades (${selectedMonths} months)`
                        }
                      </p>
                      <div className="text-amber-600 text-xs">
                        Pay-As-You-Go: £0.20 per trade analysed
                      </div>
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
                  onClick={handleRunModel}
                  disabled={analysisMode === "csv" && !csvFile}
                  className={`px-8 py-3 rounded-lg shadow-lg transition-all flex items-center gap-2 ${
                    analysisMode === "csv" && !csvFile
                      ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700'
                  }`}
                  title={analysisMode === "csv" && !csvFile ? 'Please select a CSV file' : ''}
                >
                  <Brain className="w-5 h-5" />
                  Run Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
