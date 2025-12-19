"""
Turtle Analytics Pipeline - Phase 1 & 2

Phase 1: CSV -> load -> validate -> features -> CSV
Phase 2: Counterfactual simulation with policy search

Run with --run-counterfactuals to explore alternative trade management strategies.

USAGE:
    # From project root with package installed:
    python scripts/run_pipeline.py data/raw/trades.csv --run-counterfactuals
    
    # Or if running directly:
    python run_pipeline.py data/raw/trades.csv
"""

from __future__ import annotations

from pathlib import Path

import typer
import pandas as pd

# Import from turtle_analytics package
from turtle_analytics.policies import PolicyParams
from turtle_analytics import io as tio  # Avoid conflict with built-in io module
from turtle_analytics.features import add_basic_features, add_extended_features
from turtle_analytics.simulator import (
    run_counterfactuals,
    save_counterfactuals_results,
)


app = typer.Typer(help="Turtle Analytics - Trade Analysis Pipeline")


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
    run_counterfactuals_flag: bool = typer.Option(
        False,
        "--run-counterfactuals",
        "-c",
        help="Run counterfactual policy search after feature engineering.",
    ),
    counterfactual_output: Path | None = typer.Option(
        None,
        "--counterfactual-output",
        help="Path for counterfactual results (default: artifacts/counterfactuals.csv)",
    ),
    n_random: int | None = typer.Option(
        None,
        "--n-random",
        help="Use random search instead of grid search with N samples.",
    ),
    top_n: int | None = typer.Option(
        20,
        "--top-n",
        help="Only save top N best policies (default: 20).",
    ),
) -> None:
    """
    Run the Turtle Analytics pipeline on trades CSV.

    PHASE 1 - Feature Engineering:
    - Load raw trades from CSV
    - Validate schema and basic sanity checks
    - Add basic features (R, duration, risk_per_trade, etc.)
    - Add extended features (if underlying columns exist)
    - Save processed DataFrame to CSV

    PHASE 2 - Counterfactual Simulation (optional, use --run-counterfactuals):
    - Test alternative trade management policies
    - Explore different SL/TP distances, time limits, trailing stops
    - Find which parameters would have performed best historically
    - Save results for analysis and optimization

    Examples:
    
        # Basic feature engineering only
        python run_pipeline.py data/raw/trades.csv
        
        # With counterfactual analysis
        python run_pipeline.py data/raw/trades.csv --run-counterfactuals
        
        # Random search with 100 samples
        python run_pipeline.py data/raw/trades.csv -c --n-random 100
    """
    typer.echo("=" * 70)
    typer.echo("TURTLE ANALYTICS PIPELINE")
    typer.echo("=" * 70)
    
    # =========================================================================
    # PHASE 1: Feature Engineering
    # =========================================================================
    
    typer.echo("\n PHASE 1: Feature Engineering")
    typer.echo("-" * 70)
    
    # 1. Load
    typer.echo(f"[1/4] Loading trades from {input_path} ...")
    df_raw = tio.load_trades(input_path)
    typer.echo(f"      Loaded {len(df_raw)} trades")

    # 2. Validate
    typer.echo("[2/4] Validating trades ...")
    df_clean = tio.validate_trades(df_raw)
    typer.echo(f"      {len(df_clean)} valid trades after validation")

    # 3. Feature engineering
    typer.echo("[3/4] Adding features ...")
    df_basic = add_basic_features(df_clean)
    df_features = add_extended_features(df_basic)
    typer.echo(f"      Added {len(df_features.columns) - len(df_raw.columns)} feature columns")

    # 4. Save
    if output_path is None:
        output_dir = Path("data") / "processed"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{input_path.stem}_features.csv"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df_features.to_csv(output_path, index=False)

    typer.echo(f"[4/4] Saved processed trades to {output_path}")
    typer.echo("✓ Phase 1 complete!")
    
    # =========================================================================
    # PHASE 2: Counterfactual Simulation (optional)
    # =========================================================================
    
    if run_counterfactuals_flag:
        typer.echo("\n PHASE 2: Counterfactual Policy Search")
        typer.echo("-" * 70)
        
        # Default output path
        if counterfactual_output is None:
            artifact_dir = Path("artifacts")
            artifact_dir.mkdir(parents=True, exist_ok=True)
            counterfactual_output = artifact_dir / "counterfactuals.csv"
        
        # Run counterfactual analysis
        typer.echo("\nSearching for optimal trade management policies...")
        
        if n_random is not None:
            typer.echo(f"  Strategy: Random search ({n_random} samples)")
        else:
            typer.echo(f"  Strategy: Grid search (default parameter ranges)")
        
        results_df = run_counterfactuals(
            df_features,
            n_random=n_random,
        )
        
        # Display summary
        typer.echo(f"\n Results Summary:")
        typer.echo(f"   Tested {len(results_df)} policy configurations")
        
        if len(results_df) > 0:
            best_policy = results_df.iloc[0]
            original_avg_R = df_features['R'].mean()
            
            typer.echo(f"\n   Original Strategy:")
            typer.echo(f"     Avg R: {original_avg_R:.3f}")
            typer.echo(f"     Winrate: {(df_features['R'] > 0).mean():.1%}")
            
            typer.echo(f"\n   Best Policy Found:")
            typer.echo(f"     Avg R: {best_policy['avg_R']:.3f} ({best_policy['avg_R'] - original_avg_R:+.3f})")
            typer.echo(f"     Winrate: {best_policy['winrate']:.1%}")
            typer.echo(f"     SL Multiplier: {best_policy['sl_mult']:.2f}x")
            typer.echo(f"     TP Multiplier: {best_policy['tp_mult']:.2f}x")
            
            if best_policy['trail_pct'] > 0:
                typer.echo(f"     Trail Stop: {best_policy['trail_pct']:.1%}")
            
            if best_policy['max_hold_minutes'] is not None:
                typer.echo(f"     Max Hold: {best_policy['max_hold_minutes']:.0f} minutes")
        
        # Save results
        typer.echo(f" Saving results...")
        save_counterfactuals_results(
            results_df,
            counterfactual_output,
            format="both",  # Save as both CSV and JSON
            top_n=top_n,
        )
        
        typer.echo("✓ Phase 2 complete!")
        
        # Suggest next steps
        typer.echo(f" Next Steps:")
        typer.echo(f"   1. Review results: {counterfactual_output}")
        typer.echo(f"   2. Visualize policy performance")
        typer.echo(f"   3. Run Phase 3 (Bayesian optimization) for fine-tuning")
        typer.echo(f"   4. Analyze market regimes (Phase 5 clustering)")
    
    typer.echo("\n" + "=" * 70)
    typer.echo("PIPELINE COMPLETE")
    typer.echo("=" * 70)


if __name__ == "__main__":
    app()