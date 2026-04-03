from __future__ import annotations

"""
I/O utilities for Turtle Analytics.

This module defines the minimal trade schema that all input CSV files
must follow. 
"""

from dataclasses import dataclass
from typing import Dict
from pathlib import Path
import warnings

import pandas as pd

# --- Trade schema definitions -------------------------------------------------


@dataclass(frozen=True)
class ColumnSpec:
    """Specification for a single trade column."""
    name: str
    dtype: str        # semantic / pandas dtype, e.g. "datetime64[ns]", "float", "string"
    required: bool
    description: str


# Required columns: every trade row must have these
REQUIRED_TRADE_COLUMNS: Dict[str, ColumnSpec] = {
    "entry_time": ColumnSpec(
        name="entry_time",
        dtype="datetime64[ns]",
        required=True,
        description="Timestamp when the trade was opened."
    ),
    "exit_time": ColumnSpec(
        name="exit_time",
        dtype="datetime64[ns]",
        required=True,
        description="Timestamp when the trade was closed."
    ),
    "side": ColumnSpec(
        name="side",
        dtype="string",
        required=True,
        description='Trade direction: "LONG" or "SHORT".'
    ),
    "entry_price": ColumnSpec(
        name="entry_price",
        dtype="float",
        required=True,
        description="Entry price of the trade."
    ),
    "exit_price": ColumnSpec(
        name="exit_price",
        dtype="float",
        required=True,
        description="Exit price of the trade."
    ),
    "stop_loss": ColumnSpec(
        name="stop_loss",
        dtype="float",
        required=True,
        description="Original stop-loss price for the trade."
    ),
    "take_profit": ColumnSpec(
        name="take_profit",
        dtype="float",
        required=True,
        description="Original take-profit price for the trade."
    ),
}

# Optional columns: nice-to-have, used if present
OPTIONAL_TRADE_COLUMNS: Dict[str, ColumnSpec] = {
    "trade_identity": ColumnSpec(
        name="trade_identity",
        dtype="string",
        required=False,
        description="Stable internal trade identity used to map saved account notes back to a stored trade."
    ),
    "trade_id": ColumnSpec(
        name="trade_id",
        dtype="string",
        required=False,
        description="Broker/dealer trade identifier."
    ),
    "entry_time_local": ColumnSpec(
        name="entry_time_local",
        dtype="datetime64[ns]",
        required=False,
        description="Entry timestamp exactly as recorded by the trading account."
    ),
    "exit_time_local": ColumnSpec(
        name="exit_time_local",
        dtype="datetime64[ns]",
        required=False,
        description="Exit timestamp exactly as recorded by the trading account."
    ),
    "mfe": ColumnSpec(
        name="mfe",
        dtype="float",
        required=False,
        description="Maximum favourable excursion (price units or pips)."
    ),
    "mae": ColumnSpec(
        name="mae",
        dtype="float",
        required=False,
        description="Maximum adverse excursion (price units or pips)."
    ),
    "session": ColumnSpec(
        name="session",
        dtype="string",
        required=False,
        description='Trading session label, e.g. "London", "New York", "Asia".'
    ),
    "spread": ColumnSpec(
        name="spread",
        dtype="float",
        required=False,
        description="Spread at entry (e.g. in pips)."
    ),
    "volatility": ColumnSpec(
        name="volatility",
        dtype="float",
        required=False,
        description="Volatility measure at entry (e.g. ATR multiple or % range)."
    ),
    "symbol": ColumnSpec(
        name="symbol",
        dtype="string",
        required=False,
        description="Instrument symbol, e.g. EURUSD, XAUUSD."
    ),
    "volume": ColumnSpec(
        name="volume",
        dtype="float",
        required=False,
        description="Executed position size or lot size."
    ),
    "profit": ColumnSpec(
        name="profit",
        dtype="float",
        required=False,
        description="Realised profit/loss in account currency."
    ),
    "commission": ColumnSpec(
        name="commission",
        dtype="float",
        required=False,
        description="Commission charged on the trade in account currency."
    ),
    "swap": ColumnSpec(
        name="swap",
        dtype="float",
        required=False,
        description="Swap or financing adjustment in account currency."
    ),
}

# Convenience: all known columns (required + optional)
ALL_TRADE_COLUMNS: Dict[str, ColumnSpec] = {
    **REQUIRED_TRADE_COLUMNS,
    **OPTIONAL_TRADE_COLUMNS,
}

# --- CSV loading --------------------------------------------------------------


def load_trades(path: str | Path) -> pd.DataFrame:
    
    """
    Load raw trade data from a CSV file.
    """

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Trade file not found: {path}")

    try:
        df = pd.read_csv(path)
    except Exception as exc:  # pragma: no cover (generic CSV parse failure)
        raise ValueError(f"Failed to read CSV from {path}") from exc

    if df.empty:
        raise ValueError(f"Trade file is empty: {path}")

    # strip whitespace from column names
    df.columns = [c.strip() for c in df.columns]

    return df


# --- Validation ---------------------------------------------------------------


def _coerce_column(df: pd.DataFrame, spec: ColumnSpec) -> pd.Series:

    """
    Coerce a column to the expected dtype based on ColumnSpec.
    """

    col = df[spec.name]

    if spec.dtype == "datetime64[ns]":
        return pd.to_datetime(col, errors="coerce")

    if spec.dtype == "float":
        return pd.to_numeric(col, errors="coerce")

    if spec.dtype == "string":
        # Normalize to string dtype, stripping whitespace
        return col.astype("string").str.strip()

    # Fallback: return as-is
    return col


def validate_trades(df: pd.DataFrame) -> pd.DataFrame:
    
    """
    Validate and lightly clean a raw trades DataFrame.
    """

    df = df.copy()

    # 1. Check required columns
    missing = [name for name in REQUIRED_TRADE_COLUMNS.keys() if name not in df.columns]
    if missing:
        raise ValueError(f"Missing required trade columns: {missing}")

    # 2. Only keep known columns (required + optional); ignore unknown extras for now
    known_cols = list(ALL_TRADE_COLUMNS.keys())
    present_known_cols = [c for c in known_cols if c in df.columns]
    df = df[present_known_cols]

    # 3. Coerce dtypes for all present columns
    for name in present_known_cols:
        spec = ALL_TRADE_COLUMNS[name]
        df[name] = _coerce_column(df, spec)

    # 4. Normalise `side` values to \"LONG\"/\"SHORT\"
    if "side" in df.columns:
        df["side"] = (
            df["side"]
            .astype("string")
            .str.strip()
            .str.upper()
        )

        valid_sides = {"LONG", "SHORT"}
        before = len(df)
        df = df[df["side"].isin(valid_sides)]
        dropped = before - len(df)
        if dropped > 0:
            warnings.warn(f"Dropped {dropped} rows with invalid 'side' values.", RuntimeWarning)

    # 5. Drop rows with NaNs in any required column
    required_names = list(REQUIRED_TRADE_COLUMNS.keys())
    before = len(df)
    df = df.dropna(subset=required_names)
    dropped = before - len(df)
    if dropped > 0:
        warnings.warn(f"Dropped {dropped} rows with missing required values.", RuntimeWarning)

    # 6. Drop rows with zero or undefined risk (|entry_price - stop_loss| == 0)
    risk = (df["entry_price"] - df["stop_loss"]).abs()
    invalid_risk_mask = risk.isna() | (risk <= 0)

    before = len(df)
    df = df[~invalid_risk_mask]
    dropped = before - len(df)
    if dropped > 0:
        warnings.warn(f"Dropped {dropped} rows with zero/invalid risk.", RuntimeWarning)

    # 7. Reset index for cleanliness
    df = df.reset_index(drop=True)

    return df
