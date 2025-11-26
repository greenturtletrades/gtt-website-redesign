"""
Simple Phase 1 pipeline for Turtle Analytics.

CSV -> load_trades -> validate_trades -> add_basic_features -> add_extended_features -> CSV

Later phases (simulation, optimization, survival, etc.) will extend this.
"""

from __future__ import annotations

# --- Make sure Python can find the project package ---------------------------
import sys
from pathlib import Path

# Path to this file: .../turtle_analytics_repo/scripts/run_pipeline.py
THIS_FILE = Path(__file__).resolve()
SCRIPTS_DIR = THIS_FILE.parent
PROJECT_ROOT = SCRIPTS_DIR.parent      # .../turtle_analytics_repo

# Support both layouts:
# - turtle_analytics_repo/turtle_analytics
# - turtle_analytics_repo/src/turtle_analytics
CANDIDATE_PATHS = [
    PROJECT_ROOT,
    PROJECT_ROOT / "src",
]

for p in CANDIDATE_PATHS:
    if p.exists():
        sp = str(p)
        if sp not in sys.path:
            sys.path.insert(0, sp)
# -----------------------------------------------------------------------------


import typer
import pandas as pd

from turtle_analytics.io import load_trades, validate_trades
from turtle_analytics.features import add_basic_features, add_extended_features


app = typer.Typer(help="Turtle Analytics - Phase 1 pipeline")


@app.command()
def process(
    input_path: Path = typer.Argument(
        ...,
        help="Path to the input trades CSV file.",
        exists=True,
        readable=True,
    ),
    output_path: Path | None = typer.Option(
        None,
        "--output",
        "-o",
        help=(
            "Optional path for the processed CSV. "
            "Defaults to data/processed/<input_stem>_features.csv"
        ),
    ),
) -> None:
    """
    Run the Phase 1 pipeline on a single trades CSV.

    Steps:
    - Load raw trades from CSV
    - Validate schema and basic sanity checks
    - Add basic features (R, duration, risk_per_trade, etc.)
    - Add extended features (if underlying columns exist)
    - Save processed DataFrame to CSV
    """
    # 1. Load
    typer.echo(f"[1/4] Loading trades from {input_path} ...")
    df_raw = load_trades(input_path)

    # 2. Validate
    typer.echo("[2/4] Validating trades ...")
    df_clean = validate_trades(df_raw)

    # 3. Feature engineering
    typer.echo("[3/4] Adding features ...")
    df_basic = add_basic_features(df_clean)
    df_features = add_extended_features(df_basic)

    # 4. Save
    if output_path is None:
        output_dir = Path("data") / "processed"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{input_path.stem}_features.csv"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_features.to_csv(output_path, index=False)

    typer.echo(f"[4/4] Saved processed trades to {output_path}")


if __name__ == "__main__":
    app()
