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
        optimize_policies_per_regime, create_regime_summary,
    )
    HAS_CLUSTERING = True
except ImportError:
    HAS_CLUSTERING = False

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

def _run_pipeline(job_id: str, request: AnalyseRequest) -> None:
    try:
        jobs[job_id]["status"] = "running"
        logger.info(f"[{job_id}] Pipeline started with {len(request.trades)} trades")

        # --- Phase 1: Feature Engineering ---
        df_raw = pd.DataFrame([t.model_dump() for t in request.trades])
        df_clean = tio.validate_trades(df_raw)

        if len(df_clean) == 0:
            jobs[job_id].update({"status": "error", "error": "No valid trades after validation"})
            return

        df_basic = add_basic_features(df_clean)
        df_features = add_extended_features(df_basic)

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
        if request.run_optimisation and HAS_OPTIMIZATION:
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
        if request.run_survival and HAS_SURVIVAL:
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
        if request.run_clustering and HAS_CLUSTERING:
            regime_df = extract_regime_features(df_features)
            model, df_labeled, cluster_summary = fit_clustering_model(
                regime_df, n_clusters=request.n_clusters
            )
            regime_policies = optimize_policies_per_regime(df_labeled, n_trials_per_regime=15)
            regime_summary = create_regime_summary(df_labeled, cluster_summary, regime_policies)
            report_data["regime_summary"] = regime_summary
            regimes_found = cluster_summary.get("n_clusters", 0)
            logger.info(f"[{job_id}] Clustering complete: {regimes_found} regimes")

        # --- Phase 6: Report ---
        report = build_report(
            df=df_features,
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


# ---------------------------------------------------------------------------
# CSV column mapping helper
# ---------------------------------------------------------------------------

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

    missing = []
    if entry_time is None:  missing.append("entry_time/entry_date")
    if exit_time is None:   missing.append("exit_time/exit_date")
    if entry_price is None: missing.append("entry_price")
    if exit_price is None:  missing.append("exit_price")
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}")

    ep = pd.to_numeric(entry_price, errors="coerce")
    xp = pd.to_numeric(exit_price,  errors="coerce")

    sides = (
        [s.strip().upper() for s in side_col.astype(str).tolist()]
        if side_col is not None
        else ["LONG" if x >= e else "SHORT" for e, x in zip(ep, xp)]
    )

    sl_vals = (
        pd.to_numeric(sl_col, errors="coerce").tolist()
        if sl_col is not None
        else [p * 0.98 if s == "LONG" else p * 1.02 for p, s in zip(ep, sides)]
    )
    tp_vals = (
        pd.to_numeric(tp_col, errors="coerce").tolist()
        if tp_col is not None
        else [p * 1.04 if s == "LONG" else p * 0.96 for p, s in zip(ep, sides)]
    )

    def fmt(val: str) -> str:
        v = str(val).strip()
        return v + " 09:00:00" if len(v) <= 10 and "T" not in v and " " not in v else v

    trades = []
    for i in range(len(df)):
        try:
            trades.append({
                "entry_time":  fmt(str(entry_time.iloc[i])),
                "exit_time":   fmt(str(exit_time.iloc[i])),
                "side":        str(sides[i]).upper(),
                "entry_price": float(ep.iloc[i]),
                "exit_price":  float(xp.iloc[i]),
                "stop_loss":   float(sl_vals[i]),
                "take_profit": float(tp_vals[i]),
                "trade_id":    str(trade_id_col.iloc[i]) if trade_id_col is not None else None,
                "symbol":      str(symbol_col.iloc[i]) if symbol_col is not None else None,
                "volume":      float(pd.to_numeric(volume_col.iloc[i], errors="coerce")) if volume_col is not None and pd.notna(pd.to_numeric(volume_col.iloc[i], errors="coerce")) else None,
                "profit":      float(pd.to_numeric(profit_col.iloc[i], errors="coerce")) if profit_col is not None and pd.notna(pd.to_numeric(profit_col.iloc[i], errors="coerce")) else None,
                "commission":  float(pd.to_numeric(commission_col.iloc[i], errors="coerce")) if commission_col is not None and pd.notna(pd.to_numeric(commission_col.iloc[i], errors="coerce")) else None,
                "swap":        float(pd.to_numeric(swap_col.iloc[i], errors="coerce")) if swap_col is not None and pd.notna(pd.to_numeric(swap_col.iloc[i], errors="coerce")) else None,
            })
        except Exception:
            continue  # skip malformed rows

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


@app.get("/health")
def health():
    return {"status": "ok"}
