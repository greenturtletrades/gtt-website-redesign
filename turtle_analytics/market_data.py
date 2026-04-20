"""
Market data fetcher for regime feature enrichment.

Provides OHLC bar data and derived market context features for each
trade's entry time. These replace the outcome-based clustering features
(win_rate_recent, avg_r_recent) with genuine market structure features
that are known at entry time and not derived from trade outcomes.

Data source priority:
    1. MetaTrader5  — exact broker data, Windows only
    2. yfinance     — free REST-based fallback, works on macOS and Linux/Railway

Install fallback:
    pip install yfinance
"""

from __future__ import annotations

import logging
import warnings
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# --- Optional dependencies ---------------------------------------------------

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False

# --- Symbol mappings ---------------------------------------------------------

# MT5 symbol name → yfinance ticker symbol
SYMBOL_MAP_YF: dict[str, str] = {
    # Forex majors
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "USDJPY=X",
    "USDCHF": "USDCHF=X",
    "AUDUSD": "AUDUSD=X",
    "NZDUSD": "NZDUSD=X",
    "USDCAD": "USDCAD=X",
    # Forex minors
    "EURGBP": "EURGBP=X",
    "EURJPY": "EURJPY=X",
    "GBPJPY": "GBPJPY=X",
    "EURCHF": "EURCHF=X",
    "AUDJPY": "AUDJPY=X",
    "CADJPY": "CADJPY=X",
    "NZDJPY": "NZDJPY=X",
    "GBPAUD": "GBPAUD=X",
    "GBPCAD": "GBPCAD=X",
    # Indices
    "US500":  "^GSPC",
    "SPX500": "^GSPC",
    "US30":   "^DJI",
    "NAS100": "^IXIC",
    "UK100":  "^FTSE",
    "GER40":  "^GDAXI",
    "GER30":  "^GDAXI",
    "FRA40":  "^FCHI",
    "JPN225": "^N225",
    "AUS200": "^AXJO",
    # Commodities
    "XAUUSD": "GC=F",
    "GOLD":   "GC=F",
    "XAGUSD": "SI=F",
    "USOIL":  "CL=F",
    "UKOIL":  "BZ=F",
}

# Timeframe string → yfinance interval
TIMEFRAME_MAP_YF: dict[str, str] = {
    "M1":  "1m",
    "M5":  "5m",
    "M15": "15m",
    "M30": "30m",
    "H1":  "1h",
    "H4":  "4h",
    "D1":  "1d",
    "W1":  "1wk",
}

# Timeframe string → MT5 constant (resolved at runtime to avoid import errors)
TIMEFRAME_MAP_MT5: dict[str, int] = {
    "M1":  1,
    "M5":  5,
    "M15": 15,
    "M30": 30,
    "H1":  16385,
    "H4":  16388,
    "D1":  16408,
}


# --- Bar fetching ------------------------------------------------------------

def _fetch_bars_mt5(
    symbol: str,
    date_from: datetime,
    date_to: datetime,
    timeframe: str = "H1",
) -> pd.DataFrame:
    """
    Fetch OHLC bars from MetaTrader5.
    Returns empty DataFrame if MT5 is unavailable or the request fails.
    """
    if not MT5_AVAILABLE:
        return pd.DataFrame()

    tf_const = TIMEFRAME_MAP_MT5.get(timeframe, 16385)  # default H1
    # Add a buffer before date_from so rolling calculations have enough bars
    fetch_from = date_from - timedelta(days=14)

    rates = mt5.copy_rates_range(symbol, tf_const, fetch_from, date_to)

    if rates is None or len(rates) == 0:
        logger.warning(f"MT5 returned no bars for {symbol} {timeframe}")
        return pd.DataFrame()

    df = pd.DataFrame(rates)
    df["time"] = pd.to_datetime(df["time"], unit="s")
    df = df.set_index("time")
    df.columns = [c.lower() for c in df.columns]

    return df[["open", "high", "low", "close", "tick_volume"]].rename(
        columns={"tick_volume": "volume"}
    )


def _fetch_bars_yfinance(
    symbol: str,
    date_from: datetime,
    date_to: datetime,
    timeframe: str = "H1",
) -> pd.DataFrame:
    """
    Fetch OHLC bars from yfinance (cross-platform fallback).
    Returns empty DataFrame if yfinance is unavailable or the request fails.

    Note: yfinance only retains intraday data (< D1) for ~60 days.
    For older intraday data, use D1 timeframe or ensure yfinance has coverage.
    """
    if not YFINANCE_AVAILABLE:
        return pd.DataFrame()

    yf_symbol = SYMBOL_MAP_YF.get(symbol.upper(), symbol)
    yf_interval = TIMEFRAME_MAP_YF.get(timeframe, "1h")
    fetch_from = date_from - timedelta(days=14)

    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(
            start=fetch_from.strftime("%Y-%m-%d"),
            end=(date_to + timedelta(days=1)).strftime("%Y-%m-%d"),
            interval=yf_interval,
            auto_adjust=True,
        )

        if hist.empty:
            logger.warning(f"yfinance returned no data for {yf_symbol} ({yf_interval})")
            return pd.DataFrame()

        hist.columns = [c.lower() for c in hist.columns]

        # Strip timezone so it matches naive entry_time timestamps
        if hist.index.tz is not None:
            hist.index = hist.index.tz_localize(None)

        logger.info(f"Fetched {len(hist)} {yf_interval} bars for {yf_symbol} via yfinance")
        return hist[["open", "high", "low", "close", "volume"]]

    except Exception as e:
        logger.warning(f"yfinance fetch failed for {yf_symbol}: {e}")
        return pd.DataFrame()


def _fetch_bars(
    symbol: str,
    date_from: datetime,
    date_to: datetime,
    timeframe: str = "H1",
) -> pd.DataFrame:
    """
    Fetch OHLC bars using the best available source.
    Tries MT5 first (Windows), falls back to yfinance (Mac/Linux/Railway).
    """
    if MT5_AVAILABLE:
        bars = _fetch_bars_mt5(symbol, date_from, date_to, timeframe)
        if not bars.empty:
            return bars
        logger.warning(f"MT5 fetch failed for {symbol}, trying yfinance")

    return _fetch_bars_yfinance(symbol, date_from, date_to, timeframe)


# --- Feature computation -----------------------------------------------------

def _compute_features_for_trade(
    bars: pd.DataFrame,
    entry_time: pd.Timestamp,
    lookback: int = 20,
) -> dict[str, float]:
    """
    Compute market context features from OHLC bars for a single trade.

    All features use bars strictly BEFORE the entry time — no look-ahead.

    Features computed
    -----------------
    atr_pct         : 14-bar ATR as % of price — true market volatility
    bar_range_pct   : Most recent bar (H-L) as % of price — immediate range
    ema_direction   : 1 if close > 20-EMA at entry, 0 if below — trend
    price_in_range  : Where entry sits in the lookback H-L range (0=lows, 1=highs)
    volume_ratio    : Entry bar volume vs lookback average — market activity
    """
    prior_bars = bars[bars.index < entry_time].tail(lookback)

    if len(prior_bars) < 5:
        return {}

    high  = prior_bars["high"]
    low   = prior_bars["low"]
    close = prior_bars["close"]
    last_close = close.iloc[-1]

    if last_close <= 0:
        return {}

    features: dict[str, float] = {}

    # ATR (14-bar average true range as % of price)
    prev_close = close.shift(1)
    true_range = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low  - prev_close).abs(),
    ], axis=1).max(axis=1)
    features["atr_pct"] = float(true_range.tail(14).mean() / last_close)

    # Most recent bar range as % of price
    features["bar_range_pct"] = float(
        (high.iloc[-1] - low.iloc[-1]) / last_close
    )

    # EMA direction: is price above the 20-bar EMA?
    ema20 = close.ewm(span=min(20, len(close)), adjust=False).mean()
    features["ema_direction"] = float(1 if last_close > ema20.iloc[-1] else 0)

    # Where in the lookback H-L range is the current close? (0 = at lows, 1 = at highs)
    range_high = high.max()
    range_low  = low.min()
    range_size = range_high - range_low
    features["price_in_range"] = float(
        (last_close - range_low) / range_size if range_size > 0 else 0.5
    )

    # Volume ratio: latest bar vs average
    if "volume" in prior_bars.columns:
        vol = prior_bars["volume"]
        avg_vol = vol.mean()
        features["volume_ratio"] = float(
            vol.iloc[-1] / avg_vol if avg_vol > 0 else 1.0
        )
    else:
        features["volume_ratio"] = 1.0

    return features


# --- Public API --------------------------------------------------------------

def fetch_market_context(
    trades_df: pd.DataFrame,
    timeframe: str = "H1",
    lookback_bars: int = 20,
) -> pd.DataFrame:
    """
    Enrich a trades DataFrame with market context features at each entry time.

    For each trade, fetches OHLC bars before its entry and computes five
    market structure features. These are intended to replace the outcome-based
    clustering features (win_rate_recent, avg_r_recent) with features that
    describe the actual market environment at entry — not the strategy's
    recent performance.

    Uses MetaTrader5 on Windows, yfinance on macOS and Linux (Railway).

    Parameters
    ----------
    trades_df : pd.DataFrame
        Must contain 'entry_time' and 'symbol' columns.
    timeframe : str
        Bar timeframe for feature computation. H1 is a good default for
        most day-trading strategies. Options: M1, M5, M15, M30, H1, H4, D1.
    lookback_bars : int
        Number of bars before entry used for rolling calculations (ATR,
        EMA, range). Default: 20.

    Returns
    -------
    pd.DataFrame
        trades_df with five new columns added:
        - atr_pct         : ATR / price (market volatility)
        - bar_range_pct   : Bar H-L / price
        - ema_direction   : 1 above 20-EMA, 0 below (trend)
        - price_in_range  : 0–1 position in lookback range
        - volume_ratio    : Latest bar volume / avg volume

        Trades where data could not be fetched will have NaN for these columns.
        The pipeline handles NaN gracefully — those trades are excluded from
        clustering but not from the rest of the analysis.

    Notes
    -----
    yfinance only retains intraday (sub-daily) data for approximately 60 days.
    For older data, use timeframe="D1" or ensure your MT5 terminal is available.
    """
    if "entry_time" not in trades_df.columns:
        raise ValueError("trades_df must have an 'entry_time' column")

    if "symbol" not in trades_df.columns:
        warnings.warn(
            "trades_df has no 'symbol' column — market context features require "
            "a symbol per trade (e.g. 'EURUSD'). Add this column or the clustering "
            "will fall back to outcome-based features.",
            UserWarning,
            stacklevel=2,
        )
        return trades_df

    if not MT5_AVAILABLE and not YFINANCE_AVAILABLE:
        warnings.warn(
            "Neither MetaTrader5 nor yfinance is installed.\n"
            "Install the cross-platform fallback with: pip install yfinance\n"
            "Clustering will use outcome-based features until this is resolved.",
            UserWarning,
            stacklevel=2,
        )
        return trades_df

    source = "MetaTrader5" if MT5_AVAILABLE else "yfinance"
    logger.info(f"Fetching market context via {source} ({timeframe}, lookback={lookback_bars})")

    result_df = trades_df.copy()
    market_cols = ["atr_pct", "bar_range_pct", "ema_direction", "price_in_range", "volume_ratio"]
    for col in market_cols:
        result_df[col] = np.nan

    # Fetch bars once per symbol to avoid redundant API calls
    symbols = trades_df["symbol"].dropna().unique()
    bar_cache: dict[str, pd.DataFrame] = {}

    for symbol in symbols:
        symbol_trades = trades_df[trades_df["symbol"] == symbol]
        times = pd.to_datetime(symbol_trades["entry_time"])
        date_from = times.min().to_pydatetime()
        date_to   = times.max().to_pydatetime()

        bars = _fetch_bars(symbol, date_from, date_to, timeframe)
        if bars.empty:
            logger.warning(f"No bar data retrieved for {symbol} — these trades will have NaN features")
        bar_cache[symbol] = bars

    # Compute features per trade
    n_enriched = 0
    for idx, trade in trades_df.iterrows():
        symbol = trade.get("symbol")
        if not symbol:
            continue

        bars = bar_cache.get(symbol)
        if bars is None or bars.empty:
            continue

        entry_time = pd.to_datetime(trade["entry_time"])
        features = _compute_features_for_trade(bars, entry_time, lookback=lookback_bars)

        if features:
            for col, val in features.items():
                result_df.at[idx, col] = val
            n_enriched += 1

    logger.info(f"Market context enriched {n_enriched}/{len(trades_df)} trades via {source}")

    if n_enriched == 0:
        warnings.warn(
            f"Market context could not be computed for any trades. "
            f"Check that symbol names match the SYMBOL_MAP_YF mapping in market_data.py, "
            f"and that the timeframe ({timeframe}) is supported by your data source.",
            UserWarning,
            stacklevel=2,
        )

    return result_df
