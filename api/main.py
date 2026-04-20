from __future__ import annotations

"""
Turtle Analytics FastAPI Service

Wraps the ML pipeline and exposes it over HTTP so the Node.js backend
can call it. Trades are received as a JSON array, the pipeline runs in
the background, and results are polled via a job ID.

Run with:
    uvicorn api.main:app --port 8000 --reload

From the repo root:
    cd /path/to/turtle_analytics_repo
    uvicorn api.main:app --port 8000
"""

import sys
import uuid
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

import io as builtin_io

import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Make sure turtle_analytics package is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from turtle_analytics import io as tio
from turtle_analytics.features import add_basic_features, add_extended_features
from turtle_analytics.reporting import build_report

# Optional phases — imported lazily so missing deps don't break the whole service
try:
    from turtle_analytics.simulator import run_counterfactuals
    HAS_SIMULATOR = True
except ImportError:
    HAS_SIMULATOR = False

try:
    from turtle_analytics.optimization import optimize_policy, estimate_uncertainty_bootstrap, load_optimization_config
    HAS_OPTIMIZATION = True
except ImportError:
    HAS_OPTIMIZATION = False

try:
    from turtle_analytics.survival import (
        prepare_survival_data, fit_kaplan_meier, fit_cox_model,
        extract_sweet_spot, summarize_hold_time_insights,
    )
    HAS_SURVIVAL = True
except ImportError:
    HAS_SURVIVAL = False

try:
    from turtle_analytics.clustering import (
        extract_regime_features, fit_clustering_model,
        label_trades_with_regime, optimize_policies_per_regime,
        create_regime_summary,
    )
    HAS_CLUSTERING = True
except ImportError:
    HAS_CLUSTERING = False

try:
    from turtle_analytics.metatrader import load_trades_from_mt5
    HAS_MT5 = True
except ImportError:
    HAS_MT5 = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Turtle Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# In-memory job store (fine for single-server; swap for Redis in production)
jobs: dict[str, dict] = {}
executor = ThreadPoolExecutor(max_workers=4)


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class TradeRecord(BaseModel):
    trade_identity: Optional[str] = None
    trade_id: Optional[str] = None
    entry_time: str
    exit_time: str
    entry_time_local: Optional[str] = None
    exit_time_local: Optional[str] = None
    side: str               # "LONG" or "SHORT"
    entry_price: float
    exit_price: float
    stop_loss: float
    take_profit: float
    symbol: Optional[str] = None
    mfe: Optional[float] = None
    mae: Optional[float] = None
    session: Optional[str] = None
    spread: Optional[float] = None
    volatility: Optional[float] = None
    volume: Optional[float] = None
    profit: Optional[float] = None
    commission: Optional[float] = None
    swap: Optional[float] = None


class AnalyseRequest(BaseModel):
    trades: list[TradeRecord]
    run_optimisation: bool = True
    run_survival: bool = True
    run_clustering: bool = True
    n_clusters: int = 4


class MT5Request(BaseModel):
    login: Optional[int] = None
    password: Optional[str] = None
    server: Optional[str] = None
    days: int = 90
    symbol: Optional[str] = None
    run_optimisation: bool = True
    run_survival: bool = True
    run_clustering: bool = True
    n_clusters: int = 4


class JobStatus(BaseModel):
    job_id: str
    status: str             # "queued" | "running" | "complete" | "error"
    error: Optional[str] = None
    report: Optional[dict] = None
    # Quick stats for the dashboard header cards
    trades_analysed: Optional[int] = None
    simulations_run: Optional[int] = None
    regimes_found: Optional[int] = None
    avg_r_multiple: Optional[float] = None


# ---------------------------------------------------------------------------
# Background pipeline runner
# ---------------------------------------------------------------------------

def _run_pipeline_from_df(
    job_id: str,
    df_raw: pd.DataFrame,
    run_optimisation: bool = True,
    run_survival: bool = True,
    run_clustering: bool = True,
    n_clusters: int = 4,
) -> None:
    """Shared pipeline phases 1–6. Accepts a raw DataFrame (pre-validated schema)."""
    try:
        jobs[job_id]["status"] = "running"

        # --- Phase 1: Feature Engineering ---
        df_clean = tio.validate_trades(df_raw)

        if len(df_clean) == 0:
            jobs[job_id].update({"status": "error", "error": "No valid trades after validation"})
            return

        df_basic = add_basic_features(df_clean)
        df_features = add_extended_features(df_basic)
        report_df = df_features.copy()

        report_data = {
            "best_policy": None,
            "optimization_results": None,
            "regime_summary": None,
            "hold_time_insights": None,
        }
        simulations_run = 0

        # --- Phase 2: Counterfactual simulation ---
        if HAS_SIMULATOR:
            results_df = run_counterfactuals(df_features)
            simulations_run = len(results_df)
            logger.info(f"[{job_id}] Counterfactuals: {simulations_run} policies tested")

        # --- Phase 3: Bayesian Optimisation ---
        if run_optimisation and HAS_OPTIMIZATION:
            opt_config = {
                "objective_metric": "avg_R",
                "n_trials": 50,
                "random_seed": 42,
                "search_space": {
                    "sl_mult": {"type": "float", "low": 0.3, "high": 2.0},
                    "tp_mult": {"type": "float", "low": 0.5, "high": 3.0},
                    "trail_pct": {"type": "float", "low": 0.0, "high": 0.1},
                    "max_hold_minutes": {"type": "categorical", "choices": [None, 60, 120, 180, 240]},
                    "risk_fraction": {"type": "float", "low": 0.005, "high": 0.03},
                },
                "uncertainty": {"enabled": True, "top_n": 3, "n_bootstrap": 500, "confidence_level": 0.95},
            }
            best_policy, trials_df, study_summary = optimize_policy(df_features, opt_config)
            report_data["best_policy"] = {
                "policy": best_policy.to_dict(),
                "performance": {"avg_r": study_summary.get("best_value", 0.0)},
            }
            report_data["optimization_results"] = {
                "method": "bayesian_optimization",
                "n_trials": len(trials_df),
                "summary": study_summary,
                "trials_df": trials_df,
            }
            logger.info(f"[{job_id}] Optimisation complete")

        # --- Phase 4: Survival Analysis ---
        if run_survival and HAS_SURVIVAL:
            survival_df = prepare_survival_data(df_features, event_definition="negative_r")
            kmf, survival_table = fit_kaplan_meier(survival_df)
            cph, hazard_ratios = fit_cox_model(survival_df)
            sweet_spot = extract_sweet_spot(survival_table)
            original_avg_hold = (
                (pd.to_datetime(df_features["exit_time"]) - pd.to_datetime(df_features["entry_time"]))
                .dt.total_seconds() / 60
            ).mean()
            insights = summarize_hold_time_insights(survival_table, sweet_spot, hazard_ratios, original_avg_hold)
            report_data["hold_time_insights"] = insights
            logger.info(f"[{job_id}] Survival analysis complete")

        # --- Phase 5: Clustering ---
        regimes_found = 0
        if run_clustering and HAS_CLUSTERING:
            # Enrich trades with market context features (ATR, EMA direction,
            # volume ratio etc.) before extracting regime features.
            # Uses MT5 on Windows, yfinance on macOS/Linux (Railway).
            # Degrades gracefully if neither is available or symbol is missing.
            try:
                from turtle_analytics.market_data import fetch_market_context
                df_features = fetch_market_context(df_features)
            except Exception as e:
                logger.warning(f"[{job_id}] Market context fetch failed ({e}) — using outcome-based features")

            regime_df = extract_regime_features(df_features)

            # Chronological train/test split — model fits on training trades only
            cutoff = int(len(regime_df) * 0.8)
            train_regime_df = regime_df.iloc[:cutoff]
            test_regime_df = regime_df.iloc[cutoff:]

            model, df_labeled, cluster_summary, scaler = fit_clustering_model(
                train_regime_df, n_clusters=n_clusters
            )

            # Label held-out test trades using the fitted model (not refit)
            test_labeled = label_trades_with_regime(test_regime_df, model, scaler)

            regime_policies = optimize_policies_per_regime(
                df_labeled, test_df=test_labeled, n_trials_per_regime=15
            )
            # Report performance on held-out test trades
            regime_summary = create_regime_summary(test_labeled, cluster_summary, regime_policies)
            report_data["regime_summary"] = regime_summary
            regimes_found = cluster_summary.get("n_clusters", 0)
            if "regime" in df_labeled.columns:
                merge_key = None
                for candidate in ("trade_identity", "trade_id"):
                    if candidate in report_df.columns and candidate in df_labeled.columns:
                        merge_key = candidate
                        break

                if merge_key is not None:
                    regime_map = (
                        df_labeled[[merge_key, "regime"]]
                        .dropna(subset=[merge_key])
                        .drop_duplicates(subset=[merge_key], keep="last")
                    )
                    report_df = report_df.merge(regime_map, on=merge_key, how="left")
                elif len(report_df) == len(df_labeled):
                    report_df = report_df.reset_index(drop=True)
                    report_df["regime"] = df_labeled.reset_index(drop=True)["regime"]
            logger.info(f"[{job_id}] Clustering complete: {regimes_found} regimes")

        # --- Phase 6: Report ---
        report = build_report(
            df=report_df,
            best_policy=report_data["best_policy"],
            optimization_results=report_data["optimization_results"],
            regime_summary=report_data["regime_summary"],
            hold_time_insights=report_data["hold_time_insights"],
            pipeline_version="1.0.0",
        )

        jobs[job_id].update({
            "status": "complete",
            "report": report,
            "trades_analysed": len(df_clean),
            "simulations_run": simulations_run,
            "regimes_found": regimes_found,
            "avg_r_multiple": round(df_features["R"].mean(), 3) if "R" in df_features.columns else None,
        })
        logger.info(f"[{job_id}] Pipeline complete")

    except Exception as e:
        logger.exception(f"[{job_id}] Pipeline failed")
        jobs[job_id].update({"status": "error", "error": str(e)})


def _run_pipeline(job_id: str, request: AnalyseRequest) -> None:
    logger.info(f"[{job_id}] Pipeline started with {len(request.trades)} trades")
    df_raw = pd.DataFrame([t.model_dump() for t in request.trades])
    _run_pipeline_from_df(
        job_id, df_raw,
        run_optimisation=request.run_optimisation,
        run_survival=request.run_survival,
        run_clustering=request.run_clustering,
        n_clusters=request.n_clusters,
    )


def _run_pipeline_mt5(job_id: str, body: MT5Request) -> None:
    try:
        jobs[job_id]["status"] = "running"
        logger.info(f"[{job_id}] MT5 pipeline started (days={body.days}, symbol={body.symbol})")
        date_from = datetime.now() - timedelta(days=body.days)
        df_raw = load_trades_from_mt5(
            login=body.login,
            password=body.password,
            server=body.server,
            date_from=date_from,
            symbol=body.symbol,
        )
        if len(df_raw) == 0:
            jobs[job_id].update({"status": "error", "error": "No closed trades found in MetaTrader 5 for the specified period"})
            return
        logger.info(f"[{job_id}] Loaded {len(df_raw)} trades from MT5")
        _run_pipeline_from_df(
            job_id, df_raw,
            run_optimisation=body.run_optimisation,
            run_survival=body.run_survival,
            run_clustering=body.run_clustering,
            n_clusters=body.n_clusters,
        )
    except Exception as e:
        logger.exception(f"[{job_id}] MT5 pipeline failed")
        jobs[job_id].update({"status": "error", "error": str(e)})


# ---------------------------------------------------------------------------
# CSV column mapping helper
# ---------------------------------------------------------------------------

def _normalize_trade_side(value: object) -> Optional[str]:
    if value is None or pd.isna(value):
        return None

    normalized = str(value).strip().upper()
    if not normalized:
        return None

    side_aliases = {
        "LONG": "LONG",
        "BUY": "LONG",
        "SHORT": "SHORT",
        "SELL": "SHORT",
    }
    return side_aliases.get(normalized)


def _infer_trade_side(
    entry_price: float,
    stop_loss: Optional[float] = None,
    take_profit: Optional[float] = None,
) -> Optional[str]:
    """
    Infer trade direction from risk/reward levels.

    We only infer when the geometry is structurally clear:
    - LONG: stop below entry and/or target above entry
    - SHORT: stop above entry and/or target below entry

    If SL and TP disagree, or neither level gives direction, return None
    rather than guessing from PnL.
    """
    signals: list[str] = []

    if stop_loss is not None and pd.notna(stop_loss):
        if stop_loss < entry_price:
            signals.append("LONG")
        elif stop_loss > entry_price:
            signals.append("SHORT")

    if take_profit is not None and pd.notna(take_profit):
        if take_profit > entry_price:
            signals.append("LONG")
        elif take_profit < entry_price:
            signals.append("SHORT")

    if not signals:
        return None

    first_signal = signals[0]
    return first_signal if all(signal == first_signal for signal in signals) else None


def _map_csv_columns(df: pd.DataFrame) -> list[dict]:
    """Map flexible CSV column names to TradeRecord schema."""
    col_lower = {c.lower().replace(" ", "_").replace("-", "_"): c for c in df.columns}

    def find(*candidates):
        for c in candidates:
            if c in col_lower:
                return df[col_lower[c]]
        return None

    entry_time = find("entry_time", "entrytime", "entry_date", "entrydate", "open_time", "opentime", "open_date", "opendate")
    exit_time  = find("exit_time",  "exittime",  "exit_date",  "exitdate",  "close_time", "closetime", "close_date", "closedate")
    entry_price = find("entry_price", "entryprice", "open_price", "openprice", "buyprice", "buy_price")
    exit_price  = find("exit_price",  "exitprice",  "close_price", "closeprice", "sellprice", "sell_price")
    symbol_col  = find("symbol", "ticker", "instrument", "pair", "asset")
    trade_id_col = find("trade_id", "ticket", "id", "order_id")
    side_col    = find("side", "direction", "type", "trade_type")
    sl_col      = find("stop_loss", "stoploss", "sl")
    tp_col      = find("take_profit", "takeprofit", "tp")
    volume_col = find("volume", "lot_size", "lots", "position_size", "size")
    profit_col = find("profit", "pnl", "net_pnl", "realized_pnl", "realised_pnl")
    commission_col = find("commission", "fees", "fee")
    swap_col = find("swap", "financing", "rollover")
    mfe_col = find("mfe", "max_favorable_excursion", "maximum_favorable_excursion")
    mae_col = find("mae", "max_adverse_excursion", "maximum_adverse_excursion")
    entry_time_local_col = find("entry_time_local", "local_entry_time")
    exit_time_local_col = find("exit_time_local", "local_exit_time")

    missing = []
    if entry_time is None:  missing.append("entry_time/entry_date")
    if exit_time is None:   missing.append("exit_time/exit_date")
    if entry_price is None: missing.append("entry_price")
    if exit_price is None:  missing.append("exit_price")
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}")

    ep = pd.to_numeric(entry_price, errors="coerce")
    xp = pd.to_numeric(exit_price,  errors="coerce")
    sl_numeric = pd.to_numeric(sl_col, errors="coerce") if sl_col is not None else None
    tp_numeric = pd.to_numeric(tp_col, errors="coerce") if tp_col is not None else None

    def fmt(val: str) -> str:
        v = str(val).strip()
        return v + " 09:00:00" if len(v) <= 10 and "T" not in v and " " not in v else v

    trades = []
    ambiguous_side_rows: list[int] = []
    for i in range(len(df)):
        try:
            entry_price_value = float(ep.iloc[i])
            exit_price_value = float(xp.iloc[i])
            stop_loss_value = (
                float(sl_numeric.iloc[i]) if sl_numeric is not None and pd.notna(sl_numeric.iloc[i]) else None
            )
            take_profit_value = (
                float(tp_numeric.iloc[i]) if tp_numeric is not None and pd.notna(tp_numeric.iloc[i]) else None
            )

            side_value = (
                _normalize_trade_side(side_col.iloc[i])
                if side_col is not None
                else None
            )
            if side_value is None:
                side_value = _infer_trade_side(
                    entry_price=entry_price_value,
                    stop_loss=stop_loss_value,
                    take_profit=take_profit_value,
                )

            if side_value is None:
                ambiguous_side_rows.append(i + 2)  # account for header row in CSV editors
                continue

            if stop_loss_value is None:
                stop_loss_value = entry_price_value * (0.98 if side_value == "LONG" else 1.02)
            if take_profit_value is None:
                take_profit_value = entry_price_value * (1.04 if side_value == "LONG" else 0.96)

            trades.append({
                "entry_time":  fmt(str(entry_time.iloc[i])),
                "exit_time":   fmt(str(exit_time.iloc[i])),
                "entry_time_local": fmt(str(entry_time_local_col.iloc[i])) if entry_time_local_col is not None and pd.notna(entry_time_local_col.iloc[i]) else None,
                "exit_time_local": fmt(str(exit_time_local_col.iloc[i])) if exit_time_local_col is not None and pd.notna(exit_time_local_col.iloc[i]) else None,
                "side":        side_value,
                "entry_price": entry_price_value,
                "exit_price":  exit_price_value,
                "stop_loss":   stop_loss_value,
                "take_profit": take_profit_value,
                "trade_id":    str(trade_id_col.iloc[i]) if trade_id_col is not None else None,
                "symbol":      str(symbol_col.iloc[i]) if symbol_col is not None else None,
                "volume":      float(pd.to_numeric(volume_col.iloc[i], errors="coerce")) if volume_col is not None and pd.notna(pd.to_numeric(volume_col.iloc[i], errors="coerce")) else None,
                "profit":      float(pd.to_numeric(profit_col.iloc[i], errors="coerce")) if profit_col is not None and pd.notna(pd.to_numeric(profit_col.iloc[i], errors="coerce")) else None,
                "commission":  float(pd.to_numeric(commission_col.iloc[i], errors="coerce")) if commission_col is not None and pd.notna(pd.to_numeric(commission_col.iloc[i], errors="coerce")) else None,
                "swap":        float(pd.to_numeric(swap_col.iloc[i], errors="coerce")) if swap_col is not None and pd.notna(pd.to_numeric(swap_col.iloc[i], errors="coerce")) else None,
                "mfe":         float(pd.to_numeric(mfe_col.iloc[i], errors="coerce")) if mfe_col is not None and pd.notna(pd.to_numeric(mfe_col.iloc[i], errors="coerce")) else None,
                "mae":         float(pd.to_numeric(mae_col.iloc[i], errors="coerce")) if mae_col is not None and pd.notna(pd.to_numeric(mae_col.iloc[i], errors="coerce")) else None,
            })
        except Exception:
            continue  # skip malformed rows

    if ambiguous_side_rows:
        preview = ", ".join(str(row) for row in ambiguous_side_rows[:5])
        more = "" if len(ambiguous_side_rows) <= 5 else f" and {len(ambiguous_side_rows) - 5} more"
        raise ValueError(
            "CSV is missing a usable trade direction for some rows. "
            f"Add a side/direction column or consistent stop-loss/take-profit levels. "
            f"Ambiguous rows: {preview}{more}."
        )

    return trades


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/analyse", response_model=JobStatus)
def start_analysis(body: AnalyseRequest):
    if len(body.trades) < 10:
        raise HTTPException(status_code=400, detail="At least 10 trades are required")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued"}
    executor.submit(_run_pipeline, job_id, body)
    return JobStatus(job_id=job_id, status="queued")


@app.post("/analyse/csv", response_model=JobStatus)
async def start_analysis_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = pd.read_csv(builtin_io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    try:
        raw_trades = _map_csv_columns(df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(raw_trades) < 10:
        raise HTTPException(status_code=400, detail="At least 10 valid trades are required")

    try:
        trade_objects = [TradeRecord(**t) for t in raw_trades]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Trade validation error: {e}")

    request = AnalyseRequest(
        trades=trade_objects,
        run_optimisation=True,
        run_survival=True,
        run_clustering=True,
        n_clusters=4,
    )
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued"}
    executor.submit(_run_pipeline, job_id, request)
    logger.info(f"[{job_id}] CSV job queued with {len(raw_trades)} trades")
    return JobStatus(job_id=job_id, status="queued")


@app.post("/parse/csv")
async def parse_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = pd.read_csv(builtin_io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    try:
        raw_trades = _map_csv_columns(df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(raw_trades) < 10:
        raise HTTPException(status_code=400, detail="At least 10 valid trades are required")

    try:
        trade_objects = [TradeRecord(**t) for t in raw_trades]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Trade validation error: {e}")

    return {
        "ok": True,
        "trades": [trade.model_dump() for trade in trade_objects],
        "count": len(trade_objects),
    }


@app.get("/results/{job_id}", response_model=JobStatus)
def get_results(job_id: str):
    job = jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatus(job_id=job_id, **job)


@app.post("/analyse/mt5", response_model=JobStatus)
def start_analysis_mt5(body: MT5Request):
    if not HAS_MT5:
        raise HTTPException(status_code=503, detail="MetaTrader5 library is not installed on this server. Install with: pip install MetaTrader5")
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued"}
    executor.submit(_run_pipeline_mt5, job_id, body)
    return JobStatus(job_id=job_id, status="queued")


@app.get("/health")
def health():
    return {"status": "ok", "mt5_available": HAS_MT5}
