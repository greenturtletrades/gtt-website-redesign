"""
Trade simulation engine for Turtle Analytics.

This module contains the core simulation logic that replays historical trades
under alternative trade management policies (different SL/TP distances, time
limits, trailing stops, etc.) to generate counterfactual outcomes.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal
import warnings

import pandas as pd
import numpy as np

from .policies import PolicyParams


def run_simulation(
    df: pd.DataFrame,
    policy: PolicyParams,
    inplace: bool = False,
) -> pd.DataFrame:
    """
    Simulate trades under a specific policy with adjusted SL/TP distances.
    
    This function takes historical trades and replays them with different
    stop-loss and take-profit levels based on the policy's sl_mult and tp_mult
    parameters. It determines what would have happened if you had used these
    adjusted levels instead of the original ones.
    
    **Logic:**
    1. Calculate adjusted SL and TP distances based on multipliers
    2. Determine if adjusted levels would have been hit using MFE/MAE
    3. Apply trailing stop logic (if trail_pct > 0 and MFE available)
    4. Check if trade exceeded max_hold_minutes (time-based exit)
    5. Recalculate exit prices and R values under the new policy
    
    **Priority Order:**
    1. Fixed SL hit (highest priority - stops loss)
    2. Fixed TP hit (take profit)
    3. Trailing stop hit (dynamic exit after favorable move)
    4. Time limit hit (max_hold_minutes)
    5. Original exit (no intervention)
    
    **Assumptions:**
    - If MFE/MAE are available, use them to determine if new levels were hit
    - If MFE/MAE are NOT available, assume the original exit price stands
      (conservative approach - we can't know what would have happened)
    - For time-based exits, we estimate the price at max_hold_minutes using
      linear interpolation between entry and actual exit prices
    - For trailing stops, we assume the trail activates at MFE (peak), then
      checks if MAE indicates a pullback large enough to hit the trail level
    
    Parameters
    ----------
    df : pd.DataFrame
        Historical trades DataFrame. Must have been processed through
        validate_trades() and add_basic_features(). Required columns:
        - entry_price, exit_price
        - stop_loss, take_profit
        - side ("LONG" or "SHORT")
        - risk_per_trade (from add_basic_features)
        
        Optional columns (improve simulation accuracy):
        - mfe (maximum favorable excursion)
        - mae (maximum adverse excursion)
    
    policy : PolicyParams
        Trade management policy to simulate.
    
    inplace : bool
        If True, modify df in place. If False (default), return a copy.
        
    Returns
    -------
    pd.DataFrame
        DataFrame with simulated results. Added/modified columns:
        - sim_stop_loss: adjusted stop-loss price
        - sim_take_profit: adjusted take-profit price
        - sim_trail_stop: trailing stop level (if trail_pct > 0)
        - sim_exit_price: where the trade would have exited
        - sim_exit_reason: "SL_HIT", "TP_HIT", "TRAIL_HIT", "TIME_LIMIT", or "ORIGINAL"
        - sim_exit_time: estimated exit time (added if max_hold_minutes used)
        - sim_directional_pnl: PnL under simulated exit
        - sim_R: R-multiple under the policy
        - sim_win: boolean, True if sim_R > 0
    
    Notes
    -----
    Implemented features:
    - P2-T2: SL/TP distance adjustments ✓
    - P2-T3: max_hold_minutes (time-based exits) ✓
    - P2-T4: trail_pct (trailing stops) ✓
    
    All Phase 2 core simulation features are now complete!
    Next: P2-T6 will build run_counterfactuals() for grid search.
    
    All Phase 2 simulation features complete!
    
    Examples
    --------
    Simulate with tighter stops:
    >>> tight_policy = PolicyParams(sl_mult=0.5, tp_mult=1.0)
    >>> sim_df = run_simulation(trades_df, tight_policy)
    >>> print(f"Original avg R: {trades_df['R'].mean():.2f}")
    >>> print(f"Simulated avg R: {sim_df['sim_R'].mean():.2f}")
    """
    if not inplace:
        df = df.copy()
    
    # Validate required columns
    required_cols = [
        "entry_price", "exit_price", "stop_loss", "take_profit",
        "side", "risk_per_trade"
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns for simulation: {missing}")
    
    # Check if we have MFE/MAE for better simulation
    has_mfe = "mfe" in df.columns
    has_mae = "mae" in df.columns
    
    if not (has_mfe and has_mae):
        warnings.warn(
            "MFE/MAE columns not found. Simulation will assume original exit "
            "prices stand, which may underestimate the impact of SL/TP changes.",
            UserWarning
        )
    
    # Separate LONG and SHORT trades for vectorized operations
    is_long = df["side"] == "LONG"
    is_short = df["side"] == "SHORT"
    
    # --- Calculate adjusted SL and TP prices ---------------------------------
    
    # For LONG trades:
    #   Original risk = entry_price - stop_loss
    #   New SL = entry_price - (original_risk * sl_mult)
    #   Original TP distance = take_profit - entry_price
    #   New TP = entry_price + (original_tp_distance * tp_mult)
    
    # For SHORT trades:
    #   Original risk = stop_loss - entry_price
    #   New SL = entry_price + (original_risk * sl_mult)
    #   Original TP distance = entry_price - take_profit
    #   New TP = entry_price - (original_tp_distance * tp_mult)
    
    # Initialize with NaN
    sim_sl = pd.Series(np.nan, index=df.index)
    sim_tp = pd.Series(np.nan, index=df.index)
    
    # LONG positions
    original_risk_long = df.loc[is_long, "entry_price"] - df.loc[is_long, "stop_loss"]
    sim_sl.loc[is_long] = (
        df.loc[is_long, "entry_price"] - (original_risk_long * policy.sl_mult)
    )
    
    original_tp_dist_long = df.loc[is_long, "take_profit"] - df.loc[is_long, "entry_price"]
    sim_tp.loc[is_long] = (
        df.loc[is_long, "entry_price"] + (original_tp_dist_long * policy.tp_mult)
    )
    
    # SHORT positions
    original_risk_short = df.loc[is_short, "stop_loss"] - df.loc[is_short, "entry_price"]
    sim_sl.loc[is_short] = (
        df.loc[is_short, "entry_price"] + (original_risk_short * policy.sl_mult)
    )
    
    original_tp_dist_short = df.loc[is_short, "entry_price"] - df.loc[is_short, "take_profit"]
    sim_tp.loc[is_short] = (
        df.loc[is_short, "entry_price"] - (original_tp_dist_short * policy.tp_mult)
    )
    
    df["sim_stop_loss"] = sim_sl
    df["sim_take_profit"] = sim_tp
    
    # --- Determine simulated exit prices and reasons -------------------------
    
    sim_exit_price = df["exit_price"].copy()
    sim_exit_reason = pd.Series("ORIGINAL", index=df.index, dtype="string")
    
    if has_mfe and has_mae:
        # Use MFE/MAE to determine if adjusted levels would have been hit
        
        # For LONG trades:
        #   - SL is hit if MAE (negative) goes below SL
        #   - TP is hit if MFE (positive) reaches TP
        #   - MAE in data is likely negative or absolute, need to check
        #   - Peak price = entry_price + mfe
        #   - Trough price = entry_price - |mae|
        
        # For SHORT trades:
        #   - SL is hit if MFE goes above SL
        #   - TP is hit if MAE reaches TP (goes down enough)
        #   - Peak price = entry_price - |mae|
        #   - Trough price = entry_price + mfe (for short, mfe is favorable downward movement)
        
        # LONG: check if SL hit
        mae_abs = df["mae"].abs()  # ensure MAE is positive magnitude
        long_worst_price = df.loc[is_long, "entry_price"] - mae_abs.loc[is_long]
        long_sl_hit = long_worst_price <= sim_sl.loc[is_long]
        
        # LONG: check if TP hit
        long_best_price = df.loc[is_long, "entry_price"] + df.loc[is_long, "mfe"]
        long_tp_hit = long_best_price >= sim_tp.loc[is_long]
        
        # SHORT: check if SL hit
        short_worst_price = df.loc[is_short, "entry_price"] + mae_abs.loc[is_short]
        short_sl_hit = short_worst_price >= sim_sl.loc[is_short]
        
        # SHORT: check if TP hit  
        # For shorts, MFE is positive downward movement, so best price is entry - mfe
        short_best_price = df.loc[is_short, "entry_price"] - df.loc[is_short, "mfe"]
        short_tp_hit = short_best_price <= sim_tp.loc[is_short]
        
        # Apply results for LONG trades
        # Prioritize SL over TP (conservative: assume SL hit first if both)
        long_indices = df.index[is_long]
        
        for idx in long_indices:
            if long_sl_hit.loc[idx]:
                sim_exit_price.loc[idx] = sim_sl.loc[idx]
                sim_exit_reason.loc[idx] = "SL_HIT"
            elif long_tp_hit.loc[idx]:
                sim_exit_price.loc[idx] = sim_tp.loc[idx]
                sim_exit_reason.loc[idx] = "TP_HIT"
            # else: keep ORIGINAL exit price
        
        # Apply results for SHORT trades
        short_indices = df.index[is_short]
        
        for idx in short_indices:
            if short_sl_hit.loc[idx]:
                sim_exit_price.loc[idx] = sim_sl.loc[idx]
                sim_exit_reason.loc[idx] = "SL_HIT"
            elif short_tp_hit.loc[idx]:
                sim_exit_price.loc[idx] = sim_tp.loc[idx]
                sim_exit_reason.loc[idx] = "TP_HIT"
            # else: keep ORIGINAL exit price
    
    df["sim_exit_price"] = sim_exit_price
    df["sim_exit_reason"] = sim_exit_reason
    
    # --- Apply trailing stops (trail_pct) ------------------------------------
    
    if policy.trail_pct > 0:
        # Trailing stops require MFE to know the peak price
        if not has_mfe:
            warnings.warn(
                "trail_pct is set but MFE column is missing. "
                "Trailing stops will be skipped.",
                UserWarning
            )
        else:
            # Only apply trailing stops to trades that haven't hit fixed SL/TP
            # (Fixed SL/TP have priority)
            can_trail = sim_exit_reason == "ORIGINAL"
            
            if can_trail.any():
                # Calculate trailing stop levels based on peak prices
                
                # For LONG trades:
                # - Peak price = entry + MFE
                # - Trail stop = peak × (1 - trail_pct)
                # - Check if worst price (entry - MAE) <= trail stop
                
                long_peak_price = df.loc[is_long, "entry_price"] + df.loc[is_long, "mfe"]
                long_trail_stop = long_peak_price * (1 - policy.trail_pct)
                
                # Check if price pulled back enough to hit the trail
                # Worst price for LONG is entry - |MAE|
                mae_abs = df["mae"].abs()
                long_worst_price = df.loc[is_long, "entry_price"] - mae_abs.loc[is_long]
                long_trail_hit = (long_worst_price <= long_trail_stop) & can_trail.loc[is_long]
                
                # For SHORT trades:
                # - Peak price = entry - MFE (best for short is lower price)
                # - Trail stop = peak × (1 + trail_pct) (higher than peak for shorts)
                # - Check if worst price (entry + MAE) >= trail stop
                
                short_peak_price = df.loc[is_short, "entry_price"] - df.loc[is_short, "mfe"]
                short_trail_stop = short_peak_price * (1 + policy.trail_pct)
                
                # Worst price for SHORT is entry + |MAE|
                short_worst_price = df.loc[is_short, "entry_price"] + mae_abs.loc[is_short]
                short_trail_hit = (short_worst_price >= short_trail_stop) & can_trail.loc[is_short]
                
                # Store trail stop levels in DataFrame for analysis
                sim_trail_stop = pd.Series(np.nan, index=df.index)
                sim_trail_stop.loc[is_long] = long_trail_stop
                sim_trail_stop.loc[is_short] = short_trail_stop
                df["sim_trail_stop"] = sim_trail_stop
                
                # Apply trail stops for LONG trades
                long_trail_mask = is_long.astype(bool) & long_trail_hit.astype(bool)
                long_trail_indices = df.index[long_trail_mask]
                for idx in long_trail_indices:
                    sim_exit_price.loc[idx] = long_trail_stop.loc[idx]
                    sim_exit_reason.loc[idx] = "TRAIL_HIT"
                
                # Apply trail stops for SHORT trades
                short_trail_mask = is_short.astype(bool) & short_trail_hit.astype(bool)
                short_trail_indices = df.index[short_trail_mask]
                for idx in short_trail_indices:
                    sim_exit_price.loc[idx] = short_trail_stop.loc[idx]
                    sim_exit_reason.loc[idx] = "TRAIL_HIT"
                
                # Update the DataFrame
                df["sim_exit_price"] = sim_exit_price
                df["sim_exit_reason"] = sim_exit_reason
    
    # --- Apply time-based exits (max_hold_minutes) ---------------------------
    
    if policy.max_hold_minutes is not None:
        # Check which trades require datetime columns
        has_times = "entry_time" in df.columns and "exit_time" in df.columns
        
        if not has_times:
            warnings.warn(
                "max_hold_minutes is set but entry_time/exit_time columns are missing. "
                "Time-based exits will be skipped.",
                UserWarning
            )
        else:
            # Calculate actual holding time in minutes
            entry_time = pd.to_datetime(df["entry_time"], errors="coerce")
            exit_time = pd.to_datetime(df["exit_time"], errors="coerce")
            actual_hold_minutes = (exit_time - entry_time).dt.total_seconds() / 60.0
            
            # Initialize sim_exit_time with actual exit times
            sim_exit_time = exit_time.copy()
            
            # Find trades that exceeded max_hold_minutes
            exceeded_time_limit = actual_hold_minutes > policy.max_hold_minutes
            
            # Only apply time exit if SL/TP wasn't already hit
            # (SL/TP have priority - they happen faster)
            needs_time_exit = exceeded_time_limit & (sim_exit_reason == "ORIGINAL")
            
            if needs_time_exit.any():
                # Calculate the forced exit time (entry + max_hold_minutes)
                forced_exit_time = entry_time + pd.Timedelta(minutes=policy.max_hold_minutes)
                
                # Estimate price at max_hold_minutes using linear interpolation
                # Price at time T = entry + (exit - entry) * (T / total_duration)
                time_fraction = policy.max_hold_minutes / actual_hold_minutes
                time_fraction = time_fraction.clip(upper=1.0)  # Cap at 100%
                
                interpolated_price = (
                    df["entry_price"] + 
                    (df["exit_price"] - df["entry_price"]) * time_fraction
                )
                
                # Apply time-based exits
                sim_exit_price.loc[needs_time_exit] = interpolated_price.loc[needs_time_exit]
                sim_exit_reason.loc[needs_time_exit] = "TIME_LIMIT"
                sim_exit_time.loc[needs_time_exit] = forced_exit_time.loc[needs_time_exit]
                
                # Update the DataFrame
                df["sim_exit_price"] = sim_exit_price
                df["sim_exit_reason"] = sim_exit_reason
                df["sim_exit_time"] = sim_exit_time
                
                # Add simulated hold duration
                df["sim_hold_minutes"] = (sim_exit_time - entry_time).dt.total_seconds() / 60.0
    
    # --- Calculate simulated PnL and R ----------------------------------------
    
    # Directional PnL under simulation
    sim_pnl = pd.Series(0.0, index=df.index)
    sim_pnl.loc[is_long] = (
        sim_exit_price.loc[is_long] - df.loc[is_long, "entry_price"]
    )
    sim_pnl.loc[is_short] = (
        df.loc[is_short, "entry_price"] - sim_exit_price.loc[is_short]
    )
    
    df["sim_directional_pnl"] = sim_pnl
    
    # R-multiple under simulation
    # Use adjusted risk (new SL distance)
    sim_risk = pd.Series(np.nan, index=df.index)
    sim_risk.loc[is_long] = (
        df.loc[is_long, "entry_price"] - sim_sl.loc[is_long]
    )
    sim_risk.loc[is_short] = (
        sim_sl.loc[is_short] - df.loc[is_short, "entry_price"]
    )
    
    df["sim_R"] = sim_pnl / sim_risk.replace(0, np.nan)
    
    # Win indicator
    df["sim_win"] = df["sim_R"] > 0
    
    return df


def calculate_policy_metrics(df: pd.DataFrame) -> dict:
    """
    Calculate aggregate performance metrics from simulated trades.
    
    This function computes summary statistics that describe the overall
    performance of a policy across all trades.
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame after run_simulation(). Must contain sim_R column.
    
    Returns
    -------
    dict
        Dictionary containing:
        - avg_R: mean R-multiple
        - median_R: median R-multiple
        - std_R: standard deviation of R
        - winrate: fraction of winning trades
        - n_trades: number of trades
        - total_R: sum of all R-multiples (cumulative R)
        - max_win_R: largest winning R
        - max_loss_R: largest losing R (negative)
        - expectancy: average R (same as avg_R, but explicit name)
    
    Examples
    --------
    >>> sim_df = run_simulation(trades, policy)
    >>> metrics = calculate_policy_metrics(sim_df)
    >>> print(f"Avg R: {metrics['avg_R']:.2f}, Winrate: {metrics['winrate']:.1%}")
    """
    if "sim_R" not in df.columns:
        raise ValueError("DataFrame must contain 'sim_R' column from run_simulation()")
    
    # Remove any NaN R values
    valid_df = df[df["sim_R"].notna()].copy()
    
    if len(valid_df) == 0:
        return {
            "avg_R": 0.0,
            "median_R": 0.0,
            "std_R": 0.0,
            "winrate": 0.0,
            "n_trades": 0,
            "total_R": 0.0,
            "max_win_R": 0.0,
            "max_loss_R": 0.0,
            "expectancy": 0.0,
        }
    
    R_values = valid_df["sim_R"]
    
    metrics = {
        "avg_R": float(R_values.mean()),
        "median_R": float(R_values.median()),
        "std_R": float(R_values.std()),
        "winrate": float((R_values > 0).mean()),
        "n_trades": int(len(valid_df)),
        "total_R": float(R_values.sum()),
        "max_win_R": float(R_values.max()) if len(R_values) > 0 else 0.0,
        "max_loss_R": float(R_values.min()) if len(R_values) > 0 else 0.0,
    }
    
    # Expectancy is just another name for avg_R
    metrics["expectancy"] = metrics["avg_R"]
    
    return metrics


def compare_original_vs_simulated(df: pd.DataFrame) -> dict:
    """
    Compare original trade results vs simulated results.
    
    Useful for understanding the impact of policy changes.
    
    Parameters
    ----------
    df : pd.DataFrame
        Must have both 'R' (original) and 'sim_R' (simulated) columns.
    
    Returns
    -------
    dict
        Comparison metrics:
        - original_avg_R: original average R
        - simulated_avg_R: simulated average R
        - delta_avg_R: improvement in average R
        - original_winrate: original win rate
        - simulated_winrate: simulated win rate
        - delta_winrate: improvement in win rate
        - pct_changed: percentage of trades with different outcomes
    """
    required = ["R", "sim_R"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    valid_df = df[df["R"].notna() & df["sim_R"].notna()].copy()
    
    if len(valid_df) == 0:
        return {
            "original_avg_R": 0.0,
            "simulated_avg_R": 0.0,
            "delta_avg_R": 0.0,
            "original_winrate": 0.0,
            "simulated_winrate": 0.0,
            "delta_winrate": 0.0,
            "pct_changed": 0.0,
        }
    
    original_avg_R = valid_df["R"].mean()
    simulated_avg_R = valid_df["sim_R"].mean()
    
    original_winrate = (valid_df["R"] > 0).mean()
    simulated_winrate = (valid_df["sim_R"] > 0).mean()
    
    # Percentage of trades where outcome changed
    outcome_changed = (
        ((valid_df["R"] > 0) != (valid_df["sim_R"] > 0)) |
        (valid_df["exit_price"] != valid_df["sim_exit_price"])
    )
    pct_changed = outcome_changed.mean()
    
    return {
        "original_avg_R": float(original_avg_R),
        "simulated_avg_R": float(simulated_avg_R),
        "delta_avg_R": float(simulated_avg_R - original_avg_R),
        "original_winrate": float(original_winrate),
        "simulated_winrate": float(simulated_winrate),
        "delta_winrate": float(simulated_winrate - original_winrate),
        "pct_changed": float(pct_changed),
    }


def run_counterfactuals(
    df: pd.DataFrame,
    param_grid: dict | None = None,
    n_random: int | None = None,
    random_seed: int = 42,
) -> pd.DataFrame:
    """
    Run counterfactual simulations across multiple policy configurations.
    
    This function performs a grid search or random search over policy parameter
    space to find which configurations would have performed best historically.
    
    Parameters
    ----------
    df : pd.DataFrame
        Historical trades DataFrame (must be validated and have features).
    
    param_grid : dict, optional
        Dictionary defining parameter ranges for grid search.
        Keys are parameter names, values are lists of values to try.
        Example:
            {
                "sl_mult": [0.5, 0.75, 1.0, 1.5, 2.0],
                "tp_mult": [1.0, 1.5, 2.0, 2.5],
                "trail_pct": [0.0, 0.015, 0.03, 0.05],
                "max_hold_minutes": [None, 60, 120, 240],
            }
        If None, uses a sensible default grid.
    
    n_random : int, optional
        If provided, performs random search instead of grid search.
        Randomly samples n_random parameter combinations from the ranges.
        Useful when grid search would be too large.
    
    random_seed : int
        Random seed for reproducible random search.
    
    Returns
    -------
    pd.DataFrame
        Results DataFrame with one row per policy tested.
        Columns include:
        - policy_id: unique identifier for each policy
        - sl_mult, tp_mult, trail_pct, max_hold_minutes, risk_fraction
        - avg_R, median_R, std_R, winrate, n_trades, total_R
        - max_win_R, max_loss_R, expectancy
        
    Examples
    --------
    Grid search with default parameters:
    >>> results = run_counterfactuals(trades_df)
    >>> best = results.nlargest(1, 'avg_R')
    >>> print(best[['sl_mult', 'tp_mult', 'avg_R', 'winrate']])
    
    Random search over large space:
    >>> param_grid = {
    ...     "sl_mult": np.linspace(0.3, 2.0, 20),
    ...     "tp_mult": np.linspace(0.5, 3.0, 20),
    ...     "trail_pct": np.linspace(0.0, 0.1, 15),
    ... }
    >>> results = run_counterfactuals(trades_df, param_grid, n_random=100)
    """
    # Default grid if none provided
    if param_grid is None:
        param_grid = {
            "sl_mult": [0.5, 0.75, 1.0, 1.25, 1.5],
            "tp_mult": [1.0, 1.5, 2.0, 2.5],
            "trail_pct": [0.0, 0.015, 0.03, 0.05],
            "max_hold_minutes": [None, 60, 120, 240],
            "risk_fraction": [0.01],  # Keep constant for now
        }
    
    # Generate policy configurations
    if n_random is not None:
        # Random search
        np.random.seed(random_seed)
        policies = _generate_random_policies(param_grid, n_random)
    else:
        # Grid search
        policies = _generate_grid_policies(param_grid)
    
    print(f"Running counterfactual analysis on {len(policies)} policy configurations...")
    
    # Run simulation for each policy and collect results
    results = []
    
    for i, policy in enumerate(policies):
        if (i + 1) % 50 == 0 or i == 0:
            print(f"  Progress: {i + 1}/{len(policies)} policies tested...")
        
        try:
            # Run simulation
            sim_df = run_simulation(df, policy, inplace=False)
            
            # Calculate metrics
            metrics = calculate_policy_metrics(sim_df)
            
            # Combine policy params + metrics
            result = {
                "policy_id": i,
                **policy.to_dict(),
                **metrics,
            }
            
            results.append(result)
            
        except Exception as e:
            warnings.warn(f"Policy {i} failed: {e}", RuntimeWarning)
            continue
    
    print(f"✓ Completed {len(results)} simulations")
    
    # Convert to DataFrame
    results_df = pd.DataFrame(results)
    
    # Sort by avg_R (best first)
    results_df = results_df.sort_values("avg_R", ascending=False).reset_index(drop=True)
    
    return results_df


def _generate_grid_policies(param_grid: dict) -> list[PolicyParams]:
    """Generate all combinations of parameters for grid search."""
    from itertools import product
    
    # Get parameter names and value lists
    param_names = list(param_grid.keys())
    param_values = [param_grid[name] for name in param_names]
    
    # Generate all combinations
    policies = []
    for combination in product(*param_values):
        param_dict = dict(zip(param_names, combination))
        
        try:
            policy = PolicyParams(**param_dict)
            policies.append(policy)
        except ValueError:
            # Skip invalid combinations
            continue
    
    return policies


def _generate_random_policies(param_grid: dict, n: int) -> list[PolicyParams]:
    """Generate random policy combinations for random search."""
    policies = []
    
    # Convert ranges to arrays for sampling
    param_arrays = {}
    for name, values in param_grid.items():
        if isinstance(values, list):
            param_arrays[name] = np.array(values)
        else:
            param_arrays[name] = values
    
    attempts = 0
    max_attempts = n * 10  # Avoid infinite loops
    
    while len(policies) < n and attempts < max_attempts:
        attempts += 1
        
        # Sample random values
        param_dict = {}
        for name, values in param_arrays.items():
            if isinstance(values, np.ndarray):
                param_dict[name] = np.random.choice(values)
            else:
                # Handle None values (e.g., max_hold_minutes)
                param_dict[name] = np.random.choice(values) if isinstance(values, list) else values
        
        try:
            policy = PolicyParams(**param_dict)
            policies.append(policy)
        except ValueError:
            # Skip invalid combinations
            continue
    
    if len(policies) < n:
        warnings.warn(
            f"Only generated {len(policies)}/{n} valid policies after {max_attempts} attempts",
            RuntimeWarning
        )
    
    return policies


def save_counterfactuals_results(
    results_df: pd.DataFrame,
    output_path: str | Path,
    format: str = "csv",
    top_n: int | None = None,
) -> None:
    """
    Save counterfactual simulation results to disk.
    
    Parameters
    ----------
    results_df : pd.DataFrame
        Results from run_counterfactuals().
    
    output_path : str or Path
        Where to save the results. Extension will be added if missing.
    
    format : str
        Output format: "csv", "json", or "both".
    
    top_n : int, optional
        If provided, only save the top N policies by avg_R.
    
    Examples
    --------
    Save top 20 policies as CSV:
    >>> save_counterfactuals_results(
    ...     results_df,
    ...     "artifacts/counterfactuals.csv",
    ...     top_n=20
    ... )
    
    Save all policies as both CSV and JSON:
    >>> save_counterfactuals_results(
    ...     results_df,
    ...     "artifacts/counterfactuals",
    ...     format="both"
    ... )
    """
    import json
    
    output_path = Path(output_path)
    
    # Select top N if specified
    if top_n is not None:
        df_to_save = results_df.head(top_n).copy()
        print(f"Saving top {top_n} policies...")
    else:
        df_to_save = results_df.copy()
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save CSV
    if format in ["csv", "both"]:
        csv_path = output_path.with_suffix(".csv")
        df_to_save.to_csv(csv_path, index=False)
        print(f"✓ Saved CSV: {csv_path}")
    
    # Save JSON
    if format in ["json", "both"]:
        json_path = output_path.with_suffix(".json")
        
        # Convert to list of dicts for cleaner JSON
        records = df_to_save.to_dict(orient="records")
        
        # Handle NaN values for JSON
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        with open(json_path, "w") as f:
            json.dump(records, f, indent=2)
        
        print(f"✓ Saved JSON: {json_path}")


def compare_original_vs_simulated(df: pd.DataFrame) -> dict:
    """
    Compare original trade results vs simulated results.
    
    Useful for understanding the impact of policy changes.
    
    Parameters
    ----------
    df : pd.DataFrame
        Must have both 'R' (original) and 'sim_R' (simulated) columns.
    
    Returns
    -------
    dict
        Comparison metrics:
        - original_avg_R: original average R
        - simulated_avg_R: simulated average R
        - delta_avg_R: improvement in average R
        - original_winrate: original win rate
        - simulated_winrate: simulated win rate
        - delta_winrate: improvement in win rate
        - pct_changed: percentage of trades with different outcomes
    """
    required = ["R", "sim_R"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    valid_df = df[df["R"].notna() & df["sim_R"].notna()].copy()
    
    if len(valid_df) == 0:
        return {
            "original_avg_R": 0.0,
            "simulated_avg_R": 0.0,
            "delta_avg_R": 0.0,
            "original_winrate": 0.0,
            "simulated_winrate": 0.0,
            "delta_winrate": 0.0,
            "pct_changed": 0.0,
        }
    
    original_avg_R = valid_df["R"].mean()
    simulated_avg_R = valid_df["sim_R"].mean()
    
    original_winrate = (valid_df["R"] > 0).mean()
    simulated_winrate = (valid_df["sim_R"] > 0).mean()
    
    # Percentage of trades where outcome changed
    outcome_changed = (
        ((valid_df["R"] > 0) != (valid_df["sim_R"] > 0)) |
        (valid_df["exit_price"] != valid_df["sim_exit_price"])
    )
    pct_changed = outcome_changed.mean()
    
    return {
        "original_avg_R": float(original_avg_R),
        "simulated_avg_R": float(simulated_avg_R),
        "delta_avg_R": float(simulated_avg_R - original_avg_R),
        "original_winrate": float(original_winrate),
        "simulated_winrate": float(simulated_winrate),
        "delta_winrate": float(simulated_winrate - original_winrate),
        "pct_changed": float(pct_changed),
    }