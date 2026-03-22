"""
Survival analysis for Turtle Analytics.

This module provides survival analysis tools to identify optimal trade holding times.
Using Kaplan-Meier curves and Cox proportional hazards models, it answers questions like:
- How long should I hold trades?
- When does profitability peak?
- Do certain market conditions favor longer/shorter holds?

Key concepts:
- "Survival" = trade remains profitable
- "Event" = trade becomes unprofitable (R < 0) or exits
- "Censored" = trade still profitable when exited (didn't "fail")
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
import warnings
import json

import pandas as pd
import numpy as np

try:
    from lifelines import KaplanMeierFitter, CoxPHFitter
    LIFELINES_AVAILABLE = True
except ImportError:
    LIFELINES_AVAILABLE = False
    warnings.warn(
        "lifelines not installed. Install with: pip install lifelines\n"
        "Survival analysis features will not be available.",
        UserWarning
    )


def prepare_survival_data(
    df: pd.DataFrame,
    event_definition: str = "negative_r",
    include_covariates: bool = True,
) -> pd.DataFrame:
    """
    Prepare trades data for survival analysis.
    
    Converts trades DataFrame into survival-ready format with:
    - duration: time from entry to exit (minutes)
    - event: 1 if "failed" (unprofitable), 0 if "censored" (still profitable)
    - covariates: market conditions that might affect survival
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame with entry_time, exit_time, R, etc.
    
    event_definition : str
        How to define "event" (trade failure):
        - "negative_r": Event if R < 0 (simple, recommended)
        - "zero_or_negative": Event if R <= 0
        - "giveback_50pct": Event if gave back >50% of MFE (advanced)
    
    include_covariates : bool
        If True, add market condition covariates for Cox model.
        Requires additional columns like volatility_bucket, session, etc.
    
    Returns
    -------
    pd.DataFrame
        Survival-ready DataFrame with columns:
        - duration: holding time in minutes
        - event: 1 (failed) or 0 (censored)
        - And original trade data
    
    Examples
    --------
    >>> survival_df = prepare_survival_data(trades_df)
    >>> print(survival_df[['duration', 'event', 'R']].head())
       duration  event      R
    0        45      0   1.5  # Censored (won)
    1       120      1  -0.8  # Event (lost)
    2        30      0   2.1  # Censored (won)
    
    Notes
    -----
    This implements P4-T2: Build function prepare_survival_data(df).
    """
    # Validate required columns
    required = ["entry_time", "exit_time", "R"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Create copy to avoid modifying original
    surv_df = df.copy()
    
    # Calculate duration in minutes
    entry_time = pd.to_datetime(surv_df["entry_time"])
    exit_time = pd.to_datetime(surv_df["exit_time"])
    duration_minutes = (exit_time - entry_time).dt.total_seconds() / 60.0
    surv_df["duration"] = duration_minutes
    
    # Define event based on specified definition
    if event_definition == "negative_r":
        # Simple: event if R < 0
        surv_df["event"] = (surv_df["R"] < 0).astype(int)
        
    elif event_definition == "zero_or_negative":
        # Include breakeven as event
        surv_df["event"] = (surv_df["R"] <= 0).astype(int)
        
    elif event_definition == "giveback_50pct":
        # Advanced: event if gave back >50% of peak profit
        if "mfe" not in surv_df.columns:
            warnings.warn(
                "giveback_50pct requires 'mfe' column. Falling back to negative_r.",
                UserWarning
            )
            surv_df["event"] = (surv_df["R"] < 0).astype(int)
        else:
            # Calculate giveback percentage
            # For winners: did we give back >50% of MFE?
            is_winner = surv_df["R"] > 0
            
            # Initialize all as censored (0)
            surv_df["event"] = 0
            
            # Losers are always events
            surv_df.loc[~is_winner, "event"] = 1
            
            # Winners: check giveback
            for idx in surv_df[is_winner].index:
                mfe = surv_df.loc[idx, "mfe"]
                final_r = surv_df.loc[idx, "R"]
                risk = surv_df.loc[idx, "risk_per_trade"]
                
                if mfe > 0 and risk > 0:
                    # Convert R to price move
                    final_move = final_r * risk
                    # Giveback = (MFE - final_move) / MFE
                    giveback_pct = (mfe - final_move) / mfe
                    
                    if giveback_pct > 0.5:
                        surv_df.loc[idx, "event"] = 1
    
    else:
        raise ValueError(f"Unknown event_definition: {event_definition}")
    
    # Add covariates if requested
    if include_covariates:
        # Check which covariates are available
        
        # Volatility bucket (if available)
        if "volatility_bucket" in surv_df.columns:
            # One-hot encode
            volatility_dummies = pd.get_dummies(
                surv_df["volatility_bucket"],
                prefix="vol",
                drop_first=True  # Avoid multicollinearity
            )
            surv_df = pd.concat([surv_df, volatility_dummies], axis=1)
        
        # Session (if available)
        if "session" in surv_df.columns:
            session_dummies = pd.get_dummies(
                surv_df["session"],
                prefix="session",
                drop_first=True
            )
            surv_df = pd.concat([surv_df, session_dummies], axis=1)
        
        # Side (LONG vs SHORT)
        if "side" in surv_df.columns:
            surv_df["is_long"] = (surv_df["side"] == "LONG").astype(int)
    
    # Remove any rows with invalid duration
    surv_df = surv_df[surv_df["duration"] > 0].copy()
    
    return surv_df


def fit_kaplan_meier(
    df: pd.DataFrame,
    duration_col: str = "duration",
    event_col: str = "event",
) -> tuple[KaplanMeierFitter, pd.DataFrame]:
    """
    Fit Kaplan-Meier survival curve.
    
    The Kaplan-Meier estimator is a non-parametric statistic that estimates
    the survival function from lifetime data. In trading context:
    - "Survival" = trade remains profitable
    - Curve shows: "What % of trades survive to time T?"
    
    Parameters
    ----------
    df : pd.DataFrame
        Survival-ready DataFrame from prepare_survival_data().
    
    duration_col : str
        Column name for duration (default: "duration").
    
    event_col : str
        Column name for event indicator (default: "event").
    
    Returns
    -------
    kmf : KaplanMeierFitter
        Fitted Kaplan-Meier model.
    
    survival_table : pd.DataFrame
        Survival probabilities at each time point.
        Columns: time, survival_prob, ci_lower, ci_upper
    
    Examples
    --------
    >>> kmf, survival_table = fit_kaplan_meier(survival_df)
    >>> print(survival_table.head())
       time  survival_prob  ci_lower  ci_upper
    0     0          1.000     1.000     1.000
    1    30          0.950     0.920     0.980
    2    60          0.900     0.860     0.940
    
    Notes
    -----
    This implements P4-T3: Fit Kaplan-Meier survival model.
    """
    if not LIFELINES_AVAILABLE:
        raise ImportError(
            "lifelines is required for survival analysis. "
            "Install with: pip install lifelines"
        )
    
    # Validate columns
    required = [duration_col, event_col]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Create and fit KM model
    kmf = KaplanMeierFitter()
    kmf.fit(
        durations=df[duration_col],
        event_observed=df[event_col],
        label="Trade Survival"
    )
    
    # Extract survival table
    survival_table = kmf.survival_function_.reset_index()
    survival_table.columns = ["time", "survival_prob"]
    
    # Add confidence intervals
    ci = kmf.confidence_interval_survival_function_
    survival_table["ci_lower"] = ci.iloc[:, 0].values
    survival_table["ci_upper"] = ci.iloc[:, 1].values
    
    return kmf, survival_table


def fit_cox_model(
    df: pd.DataFrame,
    duration_col: str = "duration",
    event_col: str = "event",
    covariates: list[str] | None = None,
) -> tuple[CoxPHFitter, pd.DataFrame] | None:
    """
    Fit Cox proportional hazards model (optional).
    
    The Cox model estimates how covariates (market conditions) affect
    the hazard (risk) of trade failure. It answers questions like:
    - Do high-volatility trades fail faster?
    - Do trades in certain sessions survive longer?
    
    Parameters
    ----------
    df : pd.DataFrame
        Survival-ready DataFrame with covariates.
    
    duration_col : str
        Column name for duration.
    
    event_col : str
        Column name for event indicator.
    
    covariates : list[str], optional
        List of covariate columns to include in model.
        If None, auto-detects from common patterns.
    
    Returns
    -------
    cph : CoxPHFitter
        Fitted Cox model, or None if fitting fails.
    
    hazard_ratios : pd.DataFrame
        Hazard ratios for each covariate with p-values.
        Columns: covariate, hazard_ratio, p_value, ci_lower, ci_upper
    
    Examples
    --------
    >>> cph, hazards = fit_cox_model(survival_df, covariates=['vol_high', 'is_long'])
    >>> print(hazards)
         covariate  hazard_ratio  p_value  ci_lower  ci_upper
    0     vol_high          1.45    0.001      1.20      1.75
    1      is_long          0.92    0.234      0.80      1.06
    
    Interpretation:
    - vol_high: HR=1.45 → High vol trades fail 45% faster (p<0.001)
    - is_long: HR=0.92 → Long trades fail 8% slower (not significant)
    
    Notes
    -----
    This implements P4-T4: Optionally fit Cox model with covariates.
    """
    if not LIFELINES_AVAILABLE:
        return None, None
    
    # Auto-detect covariates if not specified
    if covariates is None:
        # Look for common covariate patterns
        potential_covariates = []
        
        for col in df.columns:
            # One-hot encoded volatility
            if col.startswith("vol_"):
                potential_covariates.append(col)
            # One-hot encoded session
            elif col.startswith("session_"):
                potential_covariates.append(col)
            # Side indicator
            elif col == "is_long":
                potential_covariates.append(col)
        
        covariates = potential_covariates
    
    if len(covariates) == 0:
        warnings.warn(
            "No covariates found for Cox model. Skipping.",
            UserWarning
        )
        return None, None
    
    # Prepare data for Cox model
    cox_cols = [duration_col, event_col] + covariates
    missing = [c for c in cox_cols if c not in df.columns]
    if missing:
        warnings.warn(
            f"Missing covariates for Cox model: {missing}. Skipping.",
            UserWarning
        )
        return None, None
    
    cox_df = df[cox_cols].copy()
    
    # Check for sufficient events
    n_events = cox_df[event_col].sum()
    if n_events < 10:
        warnings.warn(
            f"Too few events ({n_events}) for Cox model. Need at least 10. Skipping.",
            UserWarning
        )
        return None, None
    
    try:
        # Fit Cox model
        cph = CoxPHFitter()
        cph.fit(
            cox_df,
            duration_col=duration_col,
            event_col=event_col,
        )
        
        # Extract hazard ratios
        summary = cph.summary
        hazard_ratios = pd.DataFrame({
            "covariate": summary.index,
            "hazard_ratio": np.exp(summary["coef"]),  # exp(beta) = HR
            "p_value": summary["p"],
            "ci_lower": np.exp(summary["coef lower 95%"]),
            "ci_upper": np.exp(summary["coef upper 95%"]),
        }).reset_index(drop=True)
        
        return cph, hazard_ratios
        
    except Exception as e:
        warnings.warn(
            f"Cox model fitting failed: {e}. Skipping.",
            UserWarning
        )
        return None, None


def extract_sweet_spot(
    survival_table: pd.DataFrame,
    min_survival_prob: float = 0.85,
    percentile_range: tuple[float, float] = (0.25, 0.75),
) -> dict[str, Any]:
    """
    Extract optimal "sweet spot" hold time range.
    
    Identifies the time range where trades have highest survival probability.
    Uses multiple criteria:
    1. Time range where survival > min_survival_prob
    2. Interquartile range of survival times
    3. Median survival time
    
    Parameters
    ----------
    survival_table : pd.DataFrame
        Survival table from fit_kaplan_meier().
    
    min_survival_prob : float
        Minimum survival probability for "sweet spot" (default: 0.85 = 85%).
    
    percentile_range : tuple[float, float]
        Percentile range for IQR-based sweet spot (default: 25th-75th).
    
    Returns
    -------
    dict
        Sweet spot information:
        - optimal_range_minutes: [min, max] time range
        - survival_rate_in_range: average survival in range
        - median_survival_time: time at 50% survival
        - time_at_min_survival: when survival drops below threshold
    
    Examples
    --------
    >>> sweet_spot = extract_sweet_spot(survival_table, min_survival_prob=0.85)
    >>> print(sweet_spot)
    {
        'optimal_range_minutes': [15, 60],
        'survival_rate_in_range': 0.92,
        'median_survival_time': 75,
        'time_at_min_survival': 90
    }
    
    Interpretation: "Trades held 15-60 minutes have 92% survival rate"
    
    Notes
    -----
    This implements P4-T5: Extract survival probabilities vs time and
    identify "sweet spot" hold range.
    """
    if len(survival_table) == 0:
        return {
            "optimal_range_minutes": [0, 0],
            "survival_rate_in_range": 0.0,
            "median_survival_time": 0,
            "time_at_min_survival": 0,
        }
    
    # Find median survival time (50% survival)
    median_survival_time = 0
    for idx, row in survival_table.iterrows():
        if row["survival_prob"] <= 0.5:
            median_survival_time = row["time"]
            break
    if median_survival_time == 0:
        # If never drops below 50%, use last time
        median_survival_time = survival_table["time"].iloc[-1]
    
    # Find time where survival drops below threshold
    time_at_min_survival = survival_table["time"].iloc[-1]
    for idx, row in survival_table.iterrows():
        if row["survival_prob"] < min_survival_prob:
            time_at_min_survival = row["time"]
            break
    
    # Optimal range: from start until survival drops below threshold
    # This is the time window where trades have highest success rate
    time_start = survival_table["time"].iloc[0] if len(survival_table) > 0 else 0
    time_end = time_at_min_survival
    
    # Ensure range is in correct order [min, max]
    optimal_range = [
        int(min(time_start, time_end)),
        int(max(time_start, time_end))
    ]
    
    # Calculate average survival in optimal range
    in_range = survival_table[
        (survival_table["time"] >= optimal_range[0]) &
        (survival_table["time"] <= optimal_range[1])
    ]
    
    if len(in_range) > 0:
        survival_rate_in_range = in_range["survival_prob"].mean()
    else:
        survival_rate_in_range = survival_table["survival_prob"].iloc[0]
    
    return {
        "optimal_range_minutes": optimal_range,
        "survival_rate_in_range": float(survival_rate_in_range),
        "median_survival_time": int(median_survival_time),
        "time_at_min_survival": int(time_at_min_survival),
    }


def summarize_hold_time_insights(
    survival_table: pd.DataFrame,
    sweet_spot: dict,
    hazard_ratios: pd.DataFrame | None = None,
    original_avg_hold: float | None = None,
) -> dict[str, Any]:
    """
    Create comprehensive hold-time insights summary.
    
    Packages all survival analysis results into a structured dict
    suitable for JSON export and reporting.
    
    Parameters
    ----------
    survival_table : pd.DataFrame
        Survival table from fit_kaplan_meier().
    
    sweet_spot : dict
        Sweet spot info from extract_sweet_spot().
    
    hazard_ratios : pd.DataFrame, optional
        Hazard ratios from fit_cox_model().
    
    original_avg_hold : float, optional
        Original average hold time for comparison.
    
    Returns
    -------
    dict
        Comprehensive insights including:
        - sweet_spot: optimal hold range
        - recommendations: list of actionable insights
        - survival_at_key_times: survival rates at common time points
        - covariate_effects: market condition impacts (if Cox model)
    
    Examples
    --------
    >>> insights = summarize_hold_time_insights(
    ...     survival_table,
    ...     sweet_spot,
    ...     hazard_ratios
    ... )
    >>> print(json.dumps(insights, indent=2))
    
    Notes
    -----
    This implements P4-T6: Create function summarize_hold_time_insights()
    returning dict/JSON-ready report.
    """
    insights = {
        # Flatten sweet_spot data for easier access
        "optimal_range_minutes": sweet_spot["optimal_range_minutes"],
        "survival_rate_in_range": sweet_spot["survival_rate_in_range"],
        "median_survival_time": sweet_spot["median_survival_time"],
        "time_at_min_survival": sweet_spot["time_at_min_survival"],
        "survival_at_key_times": {},
        "recommendations": [],
        "covariate_effects": {},
    }
    
    # Survival rates at key time points
    key_times = [15, 30, 60, 120, 180, 240]
    for t in key_times:
        # Find closest time in table
        closest_row = survival_table.iloc[(survival_table["time"] - t).abs().argsort()[0]]
        insights["survival_at_key_times"][f"{t}_minutes"] = {
            "survival_prob": float(closest_row["survival_prob"]),
            "ci_lower": float(closest_row["ci_lower"]),
            "ci_upper": float(closest_row["ci_upper"]),
        }
    
    # Generate recommendations
    optimal_min, optimal_max = sweet_spot["optimal_range_minutes"]
    survival_in_range = sweet_spot["survival_rate_in_range"]
    median_time = sweet_spot["median_survival_time"]
    
    recommendations = []
    
    # Recommendation 1: Optimal range
    recommendations.append(
        f"Exit trades within {optimal_min}-{optimal_max} minutes for "
        f"{survival_in_range:.1%} survival rate (highest probability of staying profitable)"
    )
    
    # Recommendation 2: Avoid holding too long
    if optimal_max < median_time:
        recommendations.append(
            f"Avoid holding beyond {optimal_max} minutes - survival rate drops "
            f"significantly after this point"
        )
    
    # Recommendation 3: Median comparison
    if original_avg_hold is not None:
        if original_avg_hold > optimal_max:
            diff = original_avg_hold - optimal_max
            recommendations.append(
                f"Current average hold time ({original_avg_hold:.0f} min) exceeds "
                f"optimal by {diff:.0f} minutes - consider earlier exits"
            )
        elif original_avg_hold < optimal_min:
            diff = optimal_min - original_avg_hold
            recommendations.append(
                f"Current average hold time ({original_avg_hold:.0f} min) is "
                f"{diff:.0f} minutes shorter than optimal - may be exiting too early"
            )
    
    # Recommendation 4: Median survival
    recommendations.append(
        f"Median survival time is {median_time} minutes - 50% of trades fail by this point"
    )
    
    insights["recommendations"] = recommendations
    
    # Add covariate effects if available
    if hazard_ratios is not None and len(hazard_ratios) > 0:
        for _, row in hazard_ratios.iterrows():
            covar = row["covariate"]
            hr = row["hazard_ratio"]
            p_val = row["p_value"]
            
            # Only report significant effects (p < 0.05)
            if p_val < 0.05:
                effect = "increases" if hr > 1 else "decreases"
                pct_change = abs((hr - 1) * 100)
                
                insight = (
                    f"{covar}: {effect} failure rate by {pct_change:.0f}% "
                    f"(HR={hr:.2f}, p={p_val:.3f})"
                )
                
                insights["covariate_effects"][covar] = {
                    "hazard_ratio": float(hr),
                    "p_value": float(p_val),
                    "interpretation": insight,
                }
    
    return insights


def save_survival_results(
    survival_table: pd.DataFrame,
    insights: dict,
    output_dir: str | Path,
    verbose: bool = True,
) -> None:
    """
    Save survival analysis results to disk.
    
    Parameters
    ----------
    survival_table : pd.DataFrame
        Survival probabilities over time.
    
    insights : dict
        Insights from summarize_hold_time_insights().
    
    output_dir : str or Path
        Directory to save results.
    
    verbose : bool
        If True, print save confirmations.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save survival table
    survival_csv = output_dir / "survival_curve.csv"
    survival_table.to_csv(survival_csv, index=False)
    if verbose:
        print(f"✓ Saved survival curve: {survival_csv}")
    
    # Save insights as JSON
    insights_json = output_dir / "hold_time_insights.json"
    with open(insights_json, "w") as f:
        json.dump(insights, f, indent=2)
    if verbose:
        print(f"✓ Saved insights: {insights_json}")