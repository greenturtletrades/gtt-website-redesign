"""
Feature engineering utilities for Turtle Analytics.

This module contains functions that take a *validated* trades DataFrame
and add derived columns that downstream modules (simulation, optimization,
clustering, etc.) rely on.
"""

from __future__ import annotations

from typing import Literal

import pandas as pd
import numpy as np


def add_basic_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add basic derived features to a validated trades DataFrame.

    Expected columns (after `validate_trades`):
    - entry_time (datetime)
    - exit_time (datetime)
    - side ("LONG" or "SHORT")
    - entry_price (float)
    - exit_price (float)
    - stop_loss (float)
    - take_profit (float)

    This function will add at least:
    - risk_per_trade: absolute distance between entry and stop_loss
    - R: R-multiple of the trade (directional PnL / risk)
    - duration_minutes: holding time in minutes
    - directional_pnl: signed PnL in price units

    Parameters
    ----------
    df:
        A DataFrame that has already been passed through `validate_trades`.

    Returns
    -------
    pd.DataFrame
        A *new* DataFrame with additional feature columns.
    """
    df = df.copy()

    # Ensure time columns are datetime (should already be after validation, but safe)
    if "entry_time" in df.columns:
        df["entry_time"] = pd.to_datetime(df["entry_time"], errors="coerce")

    if "exit_time" in df.columns:
        df["exit_time"] = pd.to_datetime(df["exit_time"], errors="coerce")

    # 1. Risk per trade (in price units)
    df["risk_per_trade"] = (df["entry_price"] - df["stop_loss"]).abs()

    # 2. Directional PnL (exit - entry for LONG, entry - exit for SHORT)
    is_long = df["side"] == "LONG"
    is_short = df["side"] == "SHORT"

    directional_pnl = pd.Series(0.0, index=df.index, dtype="float")
    directional_pnl[is_long] = df.loc[is_long, "exit_price"] - df.loc[is_long, "entry_price"]
    directional_pnl[is_short] = df.loc[is_short, "entry_price"] - df.loc[is_short, "exit_price"]

    df["directional_pnl"] = directional_pnl

    # Avoid division-by-zero: risk_per_trade should already be > 0 after validation,
    # but we still guard just in case.
    df["R"] = df["directional_pnl"] / df["risk_per_trade"].replace(0, pd.NA)

    # 3. Duration in minutes
    df["duration_minutes"] = (
        (df["exit_time"] - df["entry_time"])
        .dt.total_seconds()
        .divide(60.0)
    )

    return df


def add_extended_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add optional, richer features if the underlying columns exist.

    This function assumes:
    - `add_basic_features` has already been called (so `R` and
      `risk_per_trade` and `duration_minutes` exist).
    - `df` has been validated by `validate_trades`.

    It will conditionally add:
    - mfe_R: MFE expressed in R-multiples (if `mfe` present)
    - mae_R: MAE expressed in R-multiples (if `mae` present)
    - R_efficiency: realised R divided by potential R at MFE
    - time_of_day_bucket: simple categorical bucket based on entry_time
    - volatility_bucket: "low" / "medium" / "high" based on volatility
      quantiles (if `volatility` present)

    Parameters
    ----------
    df:
        DataFrame after `add_basic_features`.

    Returns
    -------
    pd.DataFrame
        New DataFrame with additional optional feature columns.
    """
    df = df.copy()

    # --- 1. Realized vs potential R using MFE / MAE -------------------------
    if "risk_per_trade" in df.columns:
        risk = df["risk_per_trade"].replace(0, pd.NA)

        if "mfe" in df.columns:
            df["mfe_R"] = df["mfe"] / risk

        if "mae" in df.columns:
            df["mae_R"] = -df["mae"].abs() / risk

        if "mfe" in df.columns and "R" in df.columns:
            valid = df["mfe"].gt(0) & df["R"].notna()
            efficiency = pd.Series(np.nan, index=df.index, dtype="float")
            efficiency[valid] = df.loc[valid, "R"] / (df.loc[valid, "mfe"] / risk[valid])
            df["R_efficiency"] = efficiency

    # --- 2. Time-of-day buckets --------------------------------------------

    if "entry_time" in df.columns:
        entry_hour = pd.to_datetime(df["entry_time"], errors="coerce").dt.hour

        def _bucket_hour(h):
            if pd.isna(h):
                return "Unknown"
            h = int(h)
            if 7 <= h < 10:
                return "London_open"
            if 13 <= h < 16:
                return "NY_open"
            if 0 <= h < 7:
                return "Overnight"
            if 16 <= h < 22:
                return "US_session"
            return "Other"

        df["time_of_day_bucket"] = entry_hour.apply(_bucket_hour)

    # --- 3. Volatility buckets ---------------------------------------------

    if "volatility" in df.columns:
        vol = pd.to_numeric(df["volatility"], errors="coerce")

        try:
            quantiles = vol.quantile([0.33, 0.66])
            low_q, high_q = float(quantiles.iloc[0]), float(quantiles.iloc[1])

            def _bucket_vol(v):
                if pd.isna(v):
                    return "unknown"
                v = float(v)
                if v <= low_q:
                    return "low"
                if v <= high_q:
                    return "medium"
                return "high"

            df["volatility_bucket"] = vol.apply(_bucket_vol)
        except Exception:
            df["volatility_bucket"] = "unknown"

    return df

