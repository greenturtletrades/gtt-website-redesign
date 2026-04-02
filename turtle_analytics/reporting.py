from __future__ import annotations

"""
Comprehensive reporting for Turtle Analytics.

This module aggregates results from all analysis phases into a single,
structured JSON report that can be consumed by dashboards, APIs, or
further analysis tools.

The report includes:
- Global summary statistics
- Best policy found (from optimization)
- Optimization trials history
- Market regime analysis
- Hold time insights (from survival analysis)
- Risk recommendations

JSON Schema
-----------
{
  "metadata": {
    "generated_at": "2024-12-31T14:30:00",
    "pipeline_version": "1.0.0",
    "n_trades_analyzed": 250,
    "date_range": ["2024-01-01", "2024-06-30"]
  },
  
  "summary": {
    "original_performance": {
      "avg_r": 1.23,
      "win_rate": 0.58,
      "total_r": 307.5,
      "median_r": 0.95,
      "std_r": 2.15,
      "max_win_r": 5.8,
      "max_loss_r": -3.2,
      "n_trades": 250
    },
    
    "best_performance": {
      "avg_r": 1.89,
      "improvement": 0.66,
      "improvement_pct": 0.537,
      "win_rate": 0.65,
      "source": "bayesian_optimization"
    }
  },
  
  "global_policy": {
    "best_policy": {
      "sl_mult": 0.78,
      "tp_mult": 1.92,
      "trail_pct": 0.023,
      "max_hold_minutes": 120,
      "risk_fraction": 0.01
    },
    
    "performance": {
      "avg_r": 1.89,
      "win_rate": 0.65,
      "total_r": 472.5,
      "sharpe_ratio": null
    },
    
    "confidence": {
      "mean_r": 1.87,
      "std_r": 0.15,
      "ci_95_lower": 1.72,
      "ci_95_upper": 2.03
    }
  },
  
  "optimization_results": {
    "method": "bayesian_optimization",
    "n_trials": 50,
    "objective_metric": "avg_R",
    "best_trial": {
      "trial_id": 23,
      "value": 1.89
    },
    "convergence": {
      "trials_to_best": 23,
      "improvement_per_trial": 0.028
    }
  },
  
  "regimes": {
    "n_regimes": 4,
    "cluster_quality": {
      "silhouette_score": 0.487,
      "separation": "good"
    },
    
    "regime_details": [
      {
        "regime_id": 0,
        "regime_type": "Trending High Volatility",
        "n_trades": 78,
        "percentage": 0.312,
        
        "characteristics": {
          "volatility_recent": 0.0285,
          "trend_strength": 0.72,
          "avg_mfe_mae_ratio": 2.15
        },
        
        "performance": {
          "avg_r": 2.15,
          "win_rate": 0.68,
          "total_r": 167.7
        },
        
        "optimal_policy": {
          "sl_mult": 0.75,
          "tp_mult": 2.85,
          "trail_pct": 0.025,
          "max_hold_minutes": 120
        }
      }
    ],
    
    "recommendations": [
      "Best performance in Trending High Vol regime (avg R: 2.150)",
      "Use adaptive parameter selection based on detected regime"
    ]
  },
  
  "hold_time_insights": {
    "optimal_range_minutes": [15, 60],
    "survival_rate_in_range": 0.893,
    "median_survival_time": 75,
    
    "survival_at_key_times": {
      "15_minutes": {"survival_prob": 0.942, "ci_lower": 0.915, "ci_upper": 0.969},
      "60_minutes": {"survival_prob": 0.851, "ci_lower": 0.808, "ci_upper": 0.894}
    },
    
    "recommendations": [
      "Exit trades within 15-60 minutes for 89.3% survival rate",
      "Avoid holding beyond 60 minutes - survival drops significantly"
    ],
    
    "covariate_effects": {
      "vol_high": {
        "hazard_ratio": 1.42,
        "p_value": 0.002,
        "interpretation": "High volatility increases failure rate by 42%"
      }
    }
  },
  
  "risk_recommendations": {
    "suggested_risk_fraction": 0.012,
    "reasoning": "Based on variance of R and drawdown analysis",
    
    "risk_metrics": {
      "variance_of_r": 2.34,
      "max_drawdown_r": -8.5,
      "consecutive_losses": 5
    },
    
    "kelly_criterion": {
      "full_kelly": 0.023,
      "half_kelly": 0.0115,
      "recommended": 0.012
    },
    
    "recommendations": [
      "Use 1.2% risk per trade for optimal growth",
      "Max drawdown with this sizing: ~15% (estimated)",
      "Reduce to 0.6% in unfavorable regimes"
    ]
  }
}
"""

from datetime import datetime
from pathlib import Path
from typing import Any
import json

import pandas as pd
import numpy as np

from .policies import PolicyParams
from .simulator import run_simulation


def build_report(
    df: pd.DataFrame,
    best_policy: dict | None = None,
    optimization_results: dict | None = None,
    regime_summary: dict | None = None,
    hold_time_insights: dict | None = None,
    pipeline_version: str = "1.0.0",
) -> dict[str, Any]:
    """
    Build comprehensive JSON report from all analysis phases.
    
    This is the main aggregation function that combines results from:
    - Phase 1: Feature engineering (baseline performance)
    - Phase 2/3: Optimization (best policy, trials)
    - Phase 4: Survival analysis (hold time insights)
    - Phase 5: Regime clustering (market regimes)
    
    Parameters
    ----------
    df : pd.DataFrame
        Processed trades DataFrame with all features.
    
    best_policy : dict, optional
        Best policy from optimization with performance metrics.
        Expected keys: 'policy', 'performance', 'confidence'
    
    optimization_results : dict, optional
        Optimization metadata and trials history.
        Expected keys: 'method', 'n_trials', 'trials_df', 'summary'
    
    regime_summary : dict, optional
        Regime clustering results from create_regime_summary().
    
    hold_time_insights : dict, optional
        Hold time analysis from summarize_hold_time_insights().
    
    pipeline_version : str
        Version identifier for the pipeline.
    
    Returns
    -------
    dict
        Comprehensive JSON-serializable report following the schema.
    
    Examples
    --------
    >>> report = build_report(
    ...     df=trades_df,
    ...     best_policy=best_policy_dict,
    ...     optimization_results=opt_results,
    ...     regime_summary=regimes,
    ...     hold_time_insights=survival_insights
    ... )
    >>> 
    >>> # Access sections
    >>> print(report['summary']['original_performance']['avg_r'])
    >>> print(report['global_policy']['best_policy'])
    >>> print(report['regimes']['n_regimes'])
    
    Notes
    -----
    This implements P6-T3: Implement build_report() function.
    """
    # Metadata
    metadata = {
        "generated_at": datetime.now().isoformat(),
        "pipeline_version": pipeline_version,
        "n_trades_analyzed": len(df),
    }
    
    # Add date range if available
    if "entry_time" in df.columns:
        entry_times = pd.to_datetime(df["entry_time"])
        metadata["date_range"] = [
            entry_times.min().strftime("%Y-%m-%d"),
            entry_times.max().strftime("%Y-%m-%d")
        ]
    
    # Summary - Original Performance
    original_performance = _calculate_original_performance(df)
    
    simulated_best_df = _simulate_best_policy_frame(df, best_policy) if best_policy is not None else None

    # Summary - Best Performance
    if best_policy is not None:
        best_performance_data = _calculate_best_policy_performance(simulated_best_df, best_policy)
        best_performance = {
            "avg_r": best_performance_data.get("avg_r", 0.0),
            "improvement": best_performance_data.get("avg_r", 0.0) - original_performance["avg_r"],
            "improvement_pct": (
                (best_performance_data.get("avg_r", 0.0) - original_performance["avg_r"]) 
                / abs(original_performance["avg_r"]) if original_performance["avg_r"] != 0 else 0
            ),
            "win_rate": best_performance_data.get("win_rate", 0.0),
            "total_r": best_performance_data.get("total_r"),
            "total_currency_pnl": best_performance_data.get("total_currency_pnl"),
            "avg_currency_pnl": best_performance_data.get("avg_currency_pnl"),
            "source": optimization_results.get("method", "unknown") if optimization_results else "unknown"
        }
    else:
        best_performance = None
    
    summary = {
        "original_performance": original_performance,
        "best_performance": best_performance,
    }
    
    # Global Policy (P6-T3)
    global_policy = None
    if best_policy is not None:
        global_policy = {
            "best_policy": best_policy.get("policy", {}),
            "performance": _calculate_best_policy_performance(simulated_best_df, best_policy),
            "confidence": best_policy.get("confidence", {}),
        }
    
    # Optimization Results
    optimization_section = None
    if optimization_results is not None:
        optimization_section = _format_optimization_results(optimization_results)
    
    # Regimes (P6-T5)
    regimes_section = None
    if regime_summary is not None:
        regimes_section = _format_regime_summary(regime_summary)
    
    # Hold Time Insights (P6-T4)
    hold_time_section = None
    if hold_time_insights is not None:
        hold_time_section = hold_time_insights
    
    # Risk Recommendations (P6-T6)
    risk_recommendations = _calculate_risk_recommendations(df, best_policy)

    # Trade Analytics (computed from raw df for dashboard charts)
    pnl_metadata = _build_currency_pnl_metadata(df)
    trade_analytics = _compute_trade_analytics(df)
    if best_policy is not None:
        trade_analytics["optimized_equity_curve"] = _build_optimized_equity_curve(df, simulated_best_df)
    else:
        trade_analytics["optimized_equity_curve"] = []
    trade_analytics["pnl_metadata"] = {
        "currency_pnl_available": bool(pnl_metadata.get("currency_pnl_available")),
        "message": pnl_metadata.get("message"),
        "source_column": pnl_metadata.get("source_column"),
    }
    trade_analytics["journal_entries"] = _build_journal_entries(df, pnl_metadata)

    # Assemble final report
    report = {
        "metadata": metadata,
        "summary": summary,
        "global_policy": global_policy,
        "optimization_results": optimization_section,
        "regimes": regimes_section,
        "hold_time_insights": hold_time_section,
        "risk_recommendations": risk_recommendations,
        "trade_analytics": trade_analytics,
    }

    return report


def _simulate_best_policy_frame(df: pd.DataFrame, best_policy: dict[str, Any] | None) -> pd.DataFrame | None:
    policy_dict = best_policy.get("policy", {}) if isinstance(best_policy, dict) else {}
    if not policy_dict:
        return None

    try:
        policy = PolicyParams.from_dict(policy_dict)
        return run_simulation(df, policy, inplace=False)
    except Exception:
        return None


def _calculate_best_policy_performance(sim_df: pd.DataFrame | None, best_policy: dict[str, Any]) -> dict[str, Any]:
    fallback = dict(best_policy.get("performance", {})) if isinstance(best_policy, dict) else {}
    if sim_df is None or "sim_R" not in sim_df.columns:
        return fallback

    sim_r = pd.to_numeric(sim_df["sim_R"], errors="coerce").dropna()
    performance = {
        "avg_r": float(sim_r.mean()) if len(sim_r) > 0 else fallback.get("avg_r", 0.0),
        "win_rate": float((sim_r > 0).mean()) if len(sim_r) > 0 else fallback.get("win_rate", 0.0),
        "total_r": float(sim_r.sum()) if len(sim_r) > 0 else fallback.get("total_r"),
    }

    sim_currency = _infer_simulated_currency_series(sim_df)
    if sim_currency is not None and sim_currency.notna().sum() > 0:
        performance["total_currency_pnl"] = float(sim_currency.fillna(0.0).sum())
        performance["avg_currency_pnl"] = float(sim_currency.dropna().mean())

    return performance


def _build_optimized_equity_curve(df: pd.DataFrame, sim_df: pd.DataFrame | None) -> list[dict[str, Any]]:
    if sim_df is None:
        return []

    if "sim_R" not in sim_df.columns:
        return []

    sim_df = _sorted_trade_frame(sim_df).reset_index(drop=True)
    sim_r = pd.to_numeric(sim_df["sim_R"], errors="coerce").dropna()
    if len(sim_r) <= 1:
        return []

    cum = sim_r.cumsum().reset_index(drop=True)
    cumulative_pnl = None
    sim_currency = _infer_simulated_currency_series(sim_df)
    if sim_currency is not None and sim_currency.notna().sum() > 0:
        cumulative_pnl = sim_currency.fillna(0.0).reset_index(drop=True).cumsum()

    n = len(cum)
    step = max(1, n // 19)
    indices = list(range(0, n, step)) + [n - 1]
    indices = sorted(set(indices))
    curve = [{"trade": 0, "cumulative_r": 0.0, "cumulative_pnl": 0.0 if cumulative_pnl is not None else None}]
    for idx in indices:
        curve.append({
            "trade": int(idx + 1),
            "cumulative_r": round(float(cum.iloc[idx]), 3),
            "cumulative_pnl": round(float(cumulative_pnl.iloc[idx]), 2) if cumulative_pnl is not None else None,
        })
    return curve


def _infer_simulated_currency_series(sim_df: pd.DataFrame) -> pd.Series | None:
    pnl_metadata = _build_currency_pnl_metadata(sim_df)
    if not (pnl_metadata.get("currency_pnl_available") and pnl_metadata.get("values") is not None and "R" in sim_df.columns and "sim_R" in sim_df.columns):
        return None

    actual_currency = pd.to_numeric(pnl_metadata["values"], errors="coerce").reset_index(drop=True)
    actual_r = pd.to_numeric(sim_df["R"], errors="coerce").reset_index(drop=True)
    sim_r_full = pd.to_numeric(sim_df["sim_R"], errors="coerce").reset_index(drop=True)

    stable_mask = actual_currency.notna() & actual_r.notna() & (actual_r.abs() >= 0.05)
    if stable_mask.sum() == 0:
        return None

    inferred_cash_risk = (actual_currency[stable_mask].abs() / actual_r[stable_mask].abs()).replace([np.inf, -np.inf], np.nan).dropna()
    inferred_cash_risk = inferred_cash_risk[inferred_cash_risk > 0]
    if len(inferred_cash_risk) == 0:
        return None

    lower = inferred_cash_risk.quantile(0.05)
    upper = inferred_cash_risk.quantile(0.95)
    filtered_cash_risk = inferred_cash_risk[(inferred_cash_risk >= lower) & (inferred_cash_risk <= upper)]
    if len(filtered_cash_risk) == 0:
        filtered_cash_risk = inferred_cash_risk

    fallback_risk = float(filtered_cash_risk.median())
    risk_per_trade = pd.Series(fallback_risk, index=sim_df.index, dtype="float")
    stable_indices = stable_mask[stable_mask].index
    risk_per_trade.loc[stable_indices] = (actual_currency.loc[stable_indices].abs() / actual_r.loc[stable_indices].abs()).replace([np.inf, -np.inf], np.nan)
    risk_per_trade = risk_per_trade.fillna(fallback_risk).clip(lower=lower if np.isfinite(lower) else 0, upper=upper if np.isfinite(upper) else None)

    sim_currency = risk_per_trade * sim_r_full
    sim_currency = sim_currency.replace([np.inf, -np.inf], np.nan)
    return sim_currency


def _sorted_trade_frame(df: pd.DataFrame) -> pd.DataFrame:
    if "exit_time" in df.columns:
        return df.sort_values("exit_time", kind="stable").reset_index(drop=True)
    if "entry_time" in df.columns:
        return df.sort_values("entry_time", kind="stable").reset_index(drop=True)
    return df.reset_index(drop=True)


def _calculate_original_performance(df: pd.DataFrame) -> dict[str, Any]:
    """Calculate baseline performance metrics."""
    if "R" not in df.columns:
        return {
            "avg_r": 0.0,
            "win_rate": 0.0,
            "total_r": 0.0,
            "median_r": 0.0,
            "std_r": 0.0,
            "max_win_r": 0.0,
            "max_loss_r": 0.0,
            "n_trades": 0,
            "win_count": 0,
            "loss_count": 0,
            "breakeven_count": 0,
            "total_currency_pnl": None,
            "avg_currency_pnl": None,
        }
    
    r_values = df["R"].dropna()
    pnl_metadata = _build_currency_pnl_metadata(df)
    total_currency_pnl = None
    avg_currency_pnl = None
    if pnl_metadata.get("currency_pnl_available") and pnl_metadata.get("values") is not None:
        pnl_values = pd.to_numeric(pnl_metadata["values"], errors="coerce").dropna()
        if len(pnl_values) > 0:
            total_currency_pnl = float(pnl_values.sum())
            avg_currency_pnl = float(pnl_values.mean())

    return {
        "avg_r": float(r_values.mean()),
        "win_rate": float((r_values > 0).mean()),
        "total_r": float(r_values.sum()),
        "median_r": float(r_values.median()),
        "std_r": float(r_values.std()),
        "max_win_r": float(r_values.max()),
        "max_loss_r": float(r_values.min()),
        "n_trades": int(len(r_values)),
        "win_count": int((r_values > 0).sum()),
        "loss_count": int((r_values < 0).sum()),
        "breakeven_count": int((r_values == 0).sum()),
        "total_currency_pnl": total_currency_pnl,
        "avg_currency_pnl": avg_currency_pnl,
    }


def _format_optimization_results(opt_results: dict) -> dict[str, Any]:
    """Format optimization results for report."""
    formatted = {
        "method": opt_results.get("method", "unknown"),
        "n_trials": opt_results.get("n_trials", 0),
        "objective_metric": opt_results.get("objective_metric", "avg_R"),
    }
    
    # Best trial info
    if "summary" in opt_results:
        summary = opt_results["summary"]
        formatted["best_trial"] = {
            "value": summary.get("best_value", 0.0),
        }
    
    # Convergence info
    if "trials_df" in opt_results:
        trials_df = opt_results["trials_df"]
        if len(trials_df) > 0:
            # Find trial number where best was found
            best_idx = trials_df["avg_R"].idxmax()
            trials_to_best = int(best_idx + 1)
            
            formatted["convergence"] = {
                "trials_to_best": trials_to_best,
                "improvement_per_trial": float(trials_df["avg_R"].max() / len(trials_df)),
            }
            real_rows = []
            sorted_trials = trials_df.sort_values("avg_R", ascending=False, kind="stable").head(8)
            for _, row in sorted_trials.iterrows():
                real_rows.append({
                    "sl_mult": float(row.get("sl_mult", 0.0)),
                    "tp_mult": float(row.get("tp_mult", 0.0)),
                    "trail_pct": float(row.get("trail_pct", 0.0)) if pd.notna(row.get("trail_pct")) else None,
                    "max_hold_minutes": None if pd.isna(row.get("max_hold_minutes")) else row.get("max_hold_minutes"),
                    "risk_fraction": float(row.get("risk_fraction", 0.0)) if pd.notna(row.get("risk_fraction")) else None,
                    "avg_r": float(row.get("avg_R", 0.0)),
                    "win_rate": None
                    if pd.isna(row.get("win_rate", row.get("winrate")))
                    else float(row.get("win_rate", row.get("winrate"))),
                    "ci_lower": None if pd.isna(row.get("ci_lower")) else float(row.get("ci_lower")),
                    "ci_upper": None if pd.isna(row.get("ci_upper")) else float(row.get("ci_upper")),
                })
            formatted["trial_rows"] = real_rows
        else:
            formatted["trial_rows"] = []
    else:
        formatted["trial_rows"] = []
    
    return formatted


def _format_regime_summary(regime_summary: dict) -> dict[str, Any]:
    """
    Format regime clustering results for report.
    
    This implements P6-T5: Integrate clustering output into regimes section.
    """
    regimes_section = {
        "n_regimes": regime_summary.get("cluster_quality", {}).get("n_clusters", 0),
        "cluster_quality": {
            "silhouette_score": regime_summary.get("cluster_quality", {}).get("silhouette_score", 0.0),
            "separation": _classify_separation(
                regime_summary.get("cluster_quality", {}).get("silhouette_score", 0.0)
            ),
        },
        "regime_details": [],
        "recommendations": regime_summary.get("recommendations", []),
    }
    
    # Format each regime
    if "regimes" in regime_summary:
        for regime_id, regime_info in regime_summary["regimes"].items():
            regime_detail = {
                "regime_id": int(regime_id),
                "regime_type": regime_info.get("regime_type", "Unknown"),
                "n_trades": regime_info.get("n_trades", 0),
                "percentage": regime_info.get("n_trades", 0) / max(
                    sum(r.get("n_trades", 0) for r in regime_summary["regimes"].values()), 1
                ),
                "characteristics": regime_info.get("characteristics", {}),
                "performance": regime_info.get("performance", {}),
            }
            
            # Add optimal policy if available
            if "optimal_policies" in regime_summary:
                optimal_policies = regime_summary["optimal_policies"]
                policy_entry = optimal_policies.get(regime_id)
                if policy_entry is None:
                    policy_entry = optimal_policies.get(str(regime_id))
                if policy_entry is not None:
                    regime_detail["optimal_policy"] = policy_entry["policy"]
            
            regimes_section["regime_details"].append(regime_detail)
    
    return regimes_section


def _classify_separation(silhouette: float) -> str:
    """Classify cluster separation quality."""
    if silhouette > 0.5:
        return "excellent"
    elif silhouette > 0.3:
        return "good"
    elif silhouette > 0.2:
        return "moderate"
    else:
        return "weak"


def _calculate_risk_recommendations(
    df: pd.DataFrame,
    best_policy: dict | None = None
) -> dict[str, Any]:
    """
    Calculate risk recommendations based on variance and drawdown.
    
    This implements P6-T6: Add risk_recommendation block based on 
    drawdown/variance of R.
    
    Uses:
    - Variance of R → Position sizing
    - Max drawdown → Risk limits
    - Kelly criterion → Optimal fraction
    """
    if "R" not in df.columns or len(df) == 0:
        return {
            "suggested_risk_fraction": 0.01,
            "reasoning": "Insufficient data for analysis",
            "risk_metrics": {},
            "recommendations": ["Use conservative 1% risk per trade"],
        }
    
    r_values = df["R"].dropna()
    
    # Calculate risk metrics
    variance_r = float(r_values.var())
    std_r = float(r_values.std())
    
    # Calculate drawdown
    cumulative_r = r_values.cumsum()
    running_max = cumulative_r.expanding().max()
    drawdown = cumulative_r - running_max
    max_drawdown = float(drawdown.min())
    
    # Consecutive losses
    is_loss = (r_values < 0).astype(int)
    consecutive_losses = 0
    current_streak = 0
    for loss in is_loss:
        if loss:
            current_streak += 1
            consecutive_losses = max(consecutive_losses, current_streak)
        else:
            current_streak = 0
    
    risk_metrics = {
        "variance_of_r": variance_r,
        "std_of_r": std_r,
        "max_drawdown_r": max_drawdown,
        "consecutive_losses": int(consecutive_losses),
    }
    
    # Kelly Criterion
    # Kelly = (win_rate * avg_win - loss_rate * avg_loss) / avg_win
    winners = r_values[r_values > 0]
    losers = r_values[r_values < 0]
    
    if len(winners) > 0 and len(losers) > 0:
        win_rate = len(winners) / len(r_values)
        loss_rate = 1 - win_rate
        avg_win = winners.mean()
        avg_loss = abs(losers.mean())
        
        if avg_win > 0:
            full_kelly = (win_rate * avg_win - loss_rate * avg_loss) / avg_win
            full_kelly = max(0, min(full_kelly, 0.25))  # Cap at 25%
        else:
            full_kelly = 0.01
    else:
        full_kelly = 0.01
    
    half_kelly = full_kelly / 2
    
    # Adjust based on variance
    # Higher variance → reduce risk
    if std_r > 2.5:
        suggested_risk = min(half_kelly, 0.008)  # Very conservative
        reasoning = "High variance detected - using conservative sizing"
    elif std_r > 1.5:
        suggested_risk = half_kelly
        reasoning = "Moderate variance - using half-Kelly for safety"
    else:
        suggested_risk = min(half_kelly * 1.2, 0.02)
        reasoning = "Low variance - slightly more aggressive sizing"
    
    kelly_criterion = {
        "full_kelly": float(full_kelly),
        "half_kelly": float(half_kelly),
        "recommended": float(suggested_risk),
    }
    
    # Generate recommendations
    recommendations = []
    
    recommendations.append(
        f"Use {suggested_risk:.1%} risk per trade for optimal growth"
    )
    
    # Estimate max drawdown with this sizing
    estimated_max_dd = abs(max_drawdown * suggested_risk * 100)
    recommendations.append(
        f"Max drawdown with this sizing: ~{estimated_max_dd:.0f}% (estimated)"
    )
    
    # Regime-based adjustment
    if best_policy and "regimes" in best_policy:
        recommendations.append(
            f"Reduce to {suggested_risk * 0.5:.1%} in unfavorable regimes"
        )
    
    # Consecutive loss warning
    if consecutive_losses >= 5:
        recommendations.append(
            f"Warning: {consecutive_losses} consecutive losses observed - "
            f"consider additional risk controls"
        )
    
    return {
        "suggested_risk_fraction": float(suggested_risk),
        "reasoning": reasoning,
        "risk_metrics": risk_metrics,
        "kelly_criterion": kelly_criterion,
        "recommendations": recommendations,
    }


def _compute_trade_analytics(df: pd.DataFrame) -> dict[str, Any]:
    """
    Compute chart/table datasets from raw trade df for the dashboard.
    Returns r_distribution, equity_curve, session_performance,
    mfe_mae_analysis, hold_time_distribution, consecutive_loss_analysis.
    """
    result: dict[str, Any] = {}
    df = _sorted_trade_frame(df)
    plot_df = df[df["R"].notna()].copy() if "R" in df.columns else df.iloc[0:0].copy()
    r_col = plot_df["R"] if "R" in plot_df.columns else pd.Series([], dtype=float)
    pnl_metadata = _build_currency_pnl_metadata(plot_df) if len(plot_df) > 0 else {
        "currency_pnl_available": False,
        "values": None,
    }

    # ── R-multiple distribution histogram ─────────────────────────────────────
    if len(r_col) > 0:
        bin_edges = [-np.inf, -3, -2, -1, 0, 1, 2, 3, 4, np.inf]
        bin_labels = ["-3R+", "-3R to -2R", "-2R to -1R", "-1R to 0R",
                      "0R to 1R", "1R to 2R", "2R to 3R", "3R to 4R", "4R+"]
        counts = (
            pd.cut(r_col, bins=bin_edges, labels=bin_labels)
            .value_counts()
            .reindex(bin_labels, fill_value=0)
        )
        result["r_distribution"] = [
            {"range": lbl, "count": int(cnt)} for lbl, cnt in counts.items()
        ]
    else:
        result["r_distribution"] = []

    # ── Equity curve (sampled ~20 points) ─────────────────────────────────────
    if len(r_col) > 1:
        plot_df = plot_df.reset_index(drop=True)
        cum = plot_df["R"].cumsum()
        cumulative_pnl = None
        if pnl_metadata.get("currency_pnl_available") and pnl_metadata.get("values") is not None:
            cumulative_pnl = (
                pd.to_numeric(pnl_metadata["values"], errors="coerce")
                .fillna(0.0)
                .reset_index(drop=True)
                .cumsum()
            )
        n = len(cum)
        step = max(1, n // 19)
        indices = list(range(0, n, step)) + [n - 1]
        indices = sorted(set(indices))
        curve = [{"trade": 0, "cumulative_r": 0.0, "cumulative_pnl": 0.0 if cumulative_pnl is not None else None}]
        for idx in indices:
            curve.append({
                "trade": int(idx + 1),
                "cumulative_r": round(float(cum.iloc[idx]), 3),
                "cumulative_pnl": round(float(cumulative_pnl.iloc[idx]), 2) if cumulative_pnl is not None else None,
            })
        result["equity_curve"] = curve
    else:
        result["equity_curve"] = []

    # ── Session performance ────────────────────────────────────────────────────
    session_column = None
    if "session" in df.columns and df["session"].notna().any():
        session_column = "session"
    elif "time_of_day_bucket" in df.columns and df["time_of_day_bucket"].notna().any():
        session_column = "time_of_day_bucket"

    if session_column and len(r_col) > 0:
        pnl_metadata = _build_currency_pnl_metadata(df)
        session_columns = [session_column, "R"]
        if pnl_metadata.get("currency_pnl_available"):
            df2 = df[[session_column, "R"]].copy()
            df2["_currency_pnl"] = pd.to_numeric(pnl_metadata.get("values"), errors="coerce")
        else:
            df2 = df[[session_column, "R"]].copy()
            df2["_currency_pnl"] = np.nan
        df2 = df2.dropna(subset=[session_column, "R"])
        session_rows = []
        for session, grp in df2.groupby(session_column):
            r = grp["R"]
            if len(r) < 1:
                continue
            total_currency_pnl = None
            currency_values = pd.to_numeric(grp["_currency_pnl"], errors="coerce").dropna()
            if len(currency_values) > 0:
                total_currency_pnl = round(float(currency_values.sum()), 2)
            session_rows.append({
                "session": str(session).replace("_", " "),
                "avg_r": round(float(r.mean()), 3),
                "total_r": round(float(r.sum()), 3),
                "win_rate": round(float((r > 0).mean()), 3),
                "trades": int(len(r)),
                "total_currency_pnl": total_currency_pnl,
            })
        session_rows.sort(
            key=lambda x: (
                x["total_currency_pnl"] if x["total_currency_pnl"] is not None else x["total_r"],
                x["win_rate"],
                x["trades"],
            ),
            reverse=True,
        )
        result["session_performance"] = session_rows
    else:
        result["session_performance"] = []

    # ── MFE / MAE analysis ─────────────────────────────────────────────────────
    if len(r_col) > 0:
        mfe_r_series = None
        mae_r_series = None

        if "mfe_R" in df.columns:
            mfe_r_series = pd.to_numeric(df["mfe_R"], errors="coerce")
        elif "mfe" in df.columns:
            risk = None
            if "risk_per_trade" in df.columns:
                risk = pd.to_numeric(df["risk_per_trade"], errors="coerce").replace(0, np.nan)
            elif "entry_price" in df.columns and "stop_loss" in df.columns:
                risk = (
                    pd.to_numeric(df["entry_price"], errors="coerce")
                    - pd.to_numeric(df["stop_loss"], errors="coerce")
                ).abs().replace(0, np.nan)
            if risk is not None:
                mfe_r_series = pd.to_numeric(df["mfe"], errors="coerce") / risk

        if "mae_R" in df.columns:
            mae_r_series = pd.to_numeric(df["mae_R"], errors="coerce").abs()
        elif "mae" in df.columns:
            risk = None
            if "risk_per_trade" in df.columns:
                risk = pd.to_numeric(df["risk_per_trade"], errors="coerce").replace(0, np.nan)
            elif "entry_price" in df.columns and "stop_loss" in df.columns:
                risk = (
                    pd.to_numeric(df["entry_price"], errors="coerce")
                    - pd.to_numeric(df["stop_loss"], errors="coerce")
                ).abs().replace(0, np.nan)
            if risk is not None:
                mae_r_series = pd.to_numeric(df["mae"], errors="coerce").abs() / risk

        has_mfe = mfe_r_series is not None and mfe_r_series.notna().any()
        has_mae = mae_r_series is not None and mae_r_series.notna().any()
        mfe_rows = []
        mfe_mae_points: list[dict[str, Any]] = []
        excursions_df = df.copy()
        if mfe_r_series is not None:
            excursions_df["mfe_r_numeric"] = mfe_r_series
        if mae_r_series is not None:
            excursions_df["mae_r_numeric"] = mae_r_series
        wins = df[df["R"] > 0] if "R" in df.columns else df.iloc[0:0]
        losses = df[df["R"] < 0] if "R" in df.columns else df.iloc[0:0]
        breakeven = df[df["R"] == 0] if "R" in df.columns else df.iloc[0:0]
        for category, grp in [("Wins", wins), ("Losses", losses), ("Breakeven", breakeven)]:
            if len(grp) == 0:
                continue
            entry: dict[str, Any] = {
                "category": category,
                "count": int(len(grp)),
                "avg_r": round(float(grp["R"].mean()), 3),
            }
            if has_mfe:
                mfe_vals = pd.to_numeric(excursions_df.loc[grp.index, "mfe_r_numeric"], errors="coerce").dropna()
                entry["avg_mfe"] = round(float(mfe_vals.mean()), 3) if len(mfe_vals) > 0 else None
            if has_mae:
                mae_vals = pd.to_numeric(excursions_df.loc[grp.index, "mae_r_numeric"], errors="coerce").dropna()
                entry["avg_mae"] = round(float(mae_vals.mean()), 3) if len(mae_vals) > 0 else None
            mfe_rows.append(entry)
        if has_mfe and has_mae:
            scatter_df = excursions_df.dropna(subset=["mfe_r_numeric", "mae_r_numeric"]).copy()
            for row in scatter_df.itertuples(index=False):
                r_value = float(getattr(row, "R", 0.0) or 0.0)
                mfe_mae_points.append({
                    "trade_id": getattr(row, "trade_id", None),
                    "mfe": round(float(getattr(row, "mfe_r_numeric")), 3),
                    "mae": round(float(getattr(row, "mae_r_numeric")), 3),
                    "result": "Win" if r_value > 0 else ("Loss" if r_value < 0 else "Breakeven"),
                    "r": round(r_value, 3),
                })
        result["mfe_mae_analysis"] = mfe_rows
        result["mfe_mae_points"] = mfe_mae_points
    else:
        result["mfe_mae_analysis"] = []
        result["mfe_mae_points"] = []

    # ── Hold time distribution ─────────────────────────────────────────────────
    if "duration_minutes" in df.columns and len(r_col) > 0:
        df3 = df[["R", "duration_minutes"]].dropna()
        bin_edges, bin_labels = _get_hold_time_bins(df3["duration_minutes"])
        df3 = df3.copy()
        df3["bucket"] = pd.cut(df3["duration_minutes"], bins=bin_edges, labels=bin_labels)
        ht_rows = []
        for lbl in bin_labels:
            grp = df3[df3["bucket"] == lbl]["R"]
            if len(grp) > 0:
                ht_rows.append({
                    "duration": lbl,
                    "avg_r": round(float(grp.mean()), 3),
                    "count": int(len(grp)),
                })
        result["hold_time_distribution"] = ht_rows
    else:
        result["hold_time_distribution"] = []

    # ── Consecutive loss analysis ──────────────────────────────────────────────
    if len(r_col) > 0:
        r_list = r_col.tolist()
        streaks: dict[int, list] = {}
        i = 0
        while i < len(r_list):
            if r_list[i] < 0:
                streak = 0
                while i + streak < len(r_list) and r_list[i + streak] < 0:
                    streak += 1
                next_idx = i + streak
                if next_idx < len(r_list):
                    key = min(streak, 4)
                    streaks.setdefault(key, []).append(r_list[next_idx])
                i = next_idx if next_idx > i else i + 1
            else:
                i += 1
        streak_labels = {1: "1 Loss", 2: "2 Losses", 3: "3 Losses", 4: "4+ Losses"}
        cl_rows = []
        for k in sorted(streaks.keys()):
            next_rs = streaks[k]
            next_wins = sum(1 for x in next_rs if x > 0)
            cl_rows.append({
                "loss_streak": streak_labels.get(k, f"{k}+ Losses"),
                "occurrences": len(next_rs),
                "next_wins": int(next_wins),
                "next_win_rate": round(next_wins / len(next_rs), 3),
                "next_avg_r": round(float(np.mean(next_rs)), 3),
            })
        result["consecutive_loss_analysis"] = cl_rows
    else:
        result["consecutive_loss_analysis"] = []

    return result


def _build_currency_pnl_metadata(df: pd.DataFrame) -> dict[str, Any]:
    currency_columns = (
        "net_pnl",
        "realized_pnl",
        "realised_pnl",
        "pnl",
        "profit",
    )

    for column in currency_columns:
        if column not in df.columns:
            continue

        pnl_values = pd.to_numeric(df[column], errors="coerce")
        if pnl_values.notna().sum() == 0:
            continue

        if column == "profit":
            pnl_values = pnl_values.fillna(0.0)
            if "commission" in df.columns:
                pnl_values = pnl_values + pd.to_numeric(df["commission"], errors="coerce").fillna(0.0)
            if "swap" in df.columns:
                pnl_values = pnl_values + pd.to_numeric(df["swap"], errors="coerce").fillna(0.0)

        return {
            "currency_pnl_available": True,
            "message": None,
            "source_column": column,
            "values": pnl_values.fillna(0.0),
        }

    return {
        "currency_pnl_available": False,
        "message": (
            "No position sizing or realised profit fields were found in this dataset, "
            "so currency profit/loss cannot be calculated."
        ),
        "source_column": None,
        "values": None,
    }


def _get_hold_time_bins(duration_minutes: pd.Series) -> tuple[list[float], list[str]]:
    clean = pd.to_numeric(duration_minutes, errors="coerce").dropna()
    if len(clean) == 0:
        return [0, 120, 240, 360, 480, np.inf], ["0-2h", "2-4h", "4-6h", "6-8h", "8h+"]

    max_duration = float(clean.max())

    if max_duration < 1:
        return (
            [0, 0.25, 0.5, 0.75, 1, np.inf],
            ["0-15s", "15-30s", "30-45s", "45-60s", "60s+"],
        )

    if max_duration < 60:
        return (
            [0, 15, 30, 45, 60, np.inf],
            ["0-15m", "15-30m", "30-45m", "45-60m", "60m+"],
        )

    return (
        [0, 120, 240, 360, 480, np.inf],
        ["0-2h", "2-4h", "4-6h", "6-8h", "8h+"],
    )


def _infer_exit_type(row: pd.Series) -> str:
    exit_price = row.get("exit_price")
    take_profit = row.get("take_profit")
    stop_loss = row.get("stop_loss")

    try:
        exit_price = float(exit_price)
    except Exception:
        return "Manual"

    if pd.notna(take_profit) and abs(exit_price - float(take_profit)) < 1e-9:
        return "TP"
    if pd.notna(stop_loss) and abs(exit_price - float(stop_loss)) < 1e-9:
        return "SL"
    return "Manual"


def _format_market_conditions(row: pd.Series) -> str:
    parts: list[str] = []

    session = row.get("session")
    if pd.notna(session) and str(session).strip():
        parts.append(str(session).strip())
    else:
        bucket = row.get("time_of_day_bucket")
        if pd.notna(bucket) and str(bucket).strip():
            parts.append(str(bucket).replace("_", " ").strip())

    vol_bucket = row.get("volatility_bucket")
    if pd.notna(vol_bucket) and str(vol_bucket).strip() and str(vol_bucket).lower() != "unknown":
        parts.append(f"{str(vol_bucket).strip()} volatility")

    return ", ".join(parts) if parts else "Imported from analysed trade data"


def _build_journal_entries(
    df: pd.DataFrame,
    pnl_metadata: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if len(df) == 0:
        return entries

    pnl_values = pnl_metadata.get("values") if pnl_metadata else None
    has_currency_pnl = bool(pnl_metadata and pnl_metadata.get("currency_pnl_available"))

    for idx, row in df.sort_values("entry_time", ascending=False).iterrows():
        entry_time = pd.to_datetime(row.get("entry_time"), errors="coerce")
        exit_time = pd.to_datetime(row.get("exit_time"), errors="coerce")
        symbol = row.get("symbol")
        pair = str(symbol).strip() if pd.notna(symbol) and str(symbol).strip() else "Trade"
        currency_result = None
        if has_currency_pnl and pnl_values is not None and idx in pnl_values.index:
            raw_currency_result = pnl_values.loc[idx]
            if pd.notna(raw_currency_result):
                currency_result = round(float(raw_currency_result), 2)

        entries.append({
            "id": f"trade-{idx + 1}",
            "date": entry_time.strftime("%Y-%m-%d") if pd.notna(entry_time) else "",
            "pair": pair,
            "direction": "long" if str(row.get("side", "")).upper() == "LONG" else "short",
            "entryPrice": round(float(row.get("entry_price", 0.0)), 5),
            "exitPrice": round(float(row.get("exit_price", 0.0)), 5),
            "stopLoss": round(float(row.get("stop_loss", 0.0)), 5) if pd.notna(row.get("stop_loss")) else 0.0,
            "takeProfit": round(float(row.get("take_profit", 0.0)), 5) if pd.notna(row.get("take_profit")) else 0.0,
            "entryTime": entry_time.strftime("%H:%M") if pd.notna(entry_time) else "",
            "exitTime": exit_time.strftime("%H:%M") if pd.notna(exit_time) else "",
            "duration": max(0, int(round(float(row.get("duration_minutes", 0.0))))) if pd.notna(row.get("duration_minutes")) else 0,
            "exitType": _infer_exit_type(row),
            "result": currency_result,
            "rMultiple": round(float(row.get("R", 0.0)), 3) if pd.notna(row.get("R")) else 0.0,
            "notes": "",
            "emotions": "",
            "lessonsLearned": "",
            "marketConditions": _format_market_conditions(row),
        })

    return entries


def save_report(
    report: dict[str, Any],
    output_path: str | Path,
    verbose: bool = True,
) -> None:
    """
    Save report to JSON file.
    
    Parameters
    ----------
    report : dict
        Report from build_report().
    
    output_path : str or Path
        Where to save the JSON file.
    
    verbose : bool
        If True, print confirmation.
    
    Notes
    -----
    This implements P6-T8: json.dump report to artifacts/report.json.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
    
    if verbose:
        size_kb = output_path.stat().st_size / 1024
        print(f"✓ Saved comprehensive report: {output_path} ({size_kb:.1f} KB)")
