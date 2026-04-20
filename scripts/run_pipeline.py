"""
Turtle Analytics Pipeline - Phase 1 & 2

Phase 1: CSV -> load -> validate -> features -> CSV
Phase 2: Counterfactual simulation with policy search

Run with --run-counterfactuals to explore alternative trade management strategies.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add parent directory to Python path so we can import turtle_analytics
# This allows running the script without installing the package
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

import typer
import pandas as pd
from datetime import datetime
from typing import Optional

# Now import from turtle_analytics package
from turtle_analytics.policies import PolicyParams
from turtle_analytics import io as tio  # Avoid conflict with built-in io module
from turtle_analytics.features import add_basic_features, add_extended_features
from turtle_analytics.metatrader import load_trades_from_mt5
from turtle_analytics.simulator import (
    run_counterfactuals,
    save_counterfactuals_results,
)
from turtle_analytics.optimization import (
    optimize_policy,
    estimate_uncertainty_bootstrap,
    save_optimization_results,
    load_optimization_config,
)
from turtle_analytics.survival import (
    prepare_survival_data,
    fit_kaplan_meier,
    fit_cox_model,
    extract_sweet_spot,
    summarize_hold_time_insights,
    save_survival_results,
)
from turtle_analytics.clustering import (
    extract_regime_features,
    fit_clustering_model,
    label_trades_with_regime,
    optimize_policies_per_regime,
    create_regime_summary,
    save_regime_results,
)
from turtle_analytics.reporting import (
    build_report,
    save_report,
)


app = typer.Typer(help="Turtle Analytics - Trade Analysis Pipeline")


@app.command()
def process(
    input_path: Optional[Path] = typer.Argument(
        None,
        help="Path to the input trades CSV file (not required if using --source mt5).",
    ),
    output_path: Optional[Path] = typer.Option(
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
    run_optimization_flag: bool = typer.Option(
        False,
        "--run-optimization",
        "-opt",
        help="Run Bayesian optimization (Phase 3) to find optimal parameters.",
    ),
    run_survival_flag: bool = typer.Option(
        False,
        "--run-survival",
        "-s",
        help="Run survival analysis (Phase 4) to identify optimal hold times.",
    ),
    run_clustering_flag: bool = typer.Option(
        False,
        "--run-clustering",
        "-cl",
        help="Run market regime clustering (Phase 5) for adaptive parameters.",
    ),
    n_clusters: Optional[int] = typer.Option(
        4,
        "--n-clusters",
        help="Number of market regimes to identify (default: 4).",
    ),
    config_path: Optional[Path] = typer.Option(
        None,
        "--config",
        help="Path to configuration YAML file (default: configs/default.yaml).",
    ),
    counterfactual_output: Optional[Path] = typer.Option(
        None,
        "--counterfactual-output",
        help="Path for counterfactual results (default: artifacts/counterfactuals.csv)",
    ),
    n_random: Optional[int] = typer.Option(
        None,
        "--n-random",
        help="Use random search instead of grid search with N samples.",
    ),
    top_n: Optional[int] = typer.Option(
        20,
        "--top-n",
        help="Only save top N best policies (default: 20).",
    ),
    # MetaTrader 5 data source options
    source: str = typer.Option(
        "csv",
        "--source",
        help="Data source: 'csv' or 'mt5' (MetaTrader 5).",
    ),
    mt5_login: Optional[int] = typer.Option(
        None,
        "--mt5-login",
        help="MT5 account number (if not provided, uses current account).",
    ),
    mt5_password: Optional[str] = typer.Option(
        None,
        "--mt5-password",
        help="MT5 account password.",
    ),
    mt5_server: Optional[str] = typer.Option(
        None,
        "--mt5-server",
        help="MT5 broker server name.",
    ),
    mt5_symbol: Optional[str] = typer.Option(
        None,
        "--mt5-symbol",
        help="Filter trades by symbol (e.g., EURUSD).",
    ),
    mt5_days: int = typer.Option(
        90,
        "--mt5-days",
        help="Number of days of history to fetch from MT5 (default: 90).",
    ),
    calculate_mfe_mae: bool = typer.Option(
        False,
        "--calculate-mfe-mae",
        help="Calculate MFE/MAE from tick data (slow for large datasets).",
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
    # Initialize result collectors for comprehensive report (Phase 6)
    # =========================================================================
    report_data = {
        "best_policy": None,
        "optimization_results": None,
        "regime_summary": None,
        "hold_time_insights": None,
    }
    
    # =========================================================================
    # PHASE 1: Feature Engineering
    # =========================================================================

    typer.echo("\n PHASE 1: Feature Engineering")
    typer.echo("-" * 70)

    # 1. Load - from CSV or MetaTrader 5
    if source.lower() == "mt5":
        typer.echo("[1/4] Loading trades from MetaTrader 5 ...")

        # Validate MT5 setup
        try:
            import MetaTrader5 as mt5
        except ImportError:
            typer.echo("\n Error: MetaTrader5 library not installed")
            typer.echo("   Install with: pip install MetaTrader5")
            raise typer.Exit(1)

        # Calculate date range
        date_to = datetime.now()
        date_from = datetime.now() - pd.Timedelta(days=mt5_days)

        # Display connection info
        if mt5_login and mt5_server:
            typer.echo(f"      Account: {mt5_login}")
            typer.echo(f"      Server: {mt5_server}")
        else:
            typer.echo(f"      Using current logged-in account")

        typer.echo(f"      Date range: {date_from.date()} to {date_to.date()}")
        if mt5_symbol:
            typer.echo(f"      Symbol filter: {mt5_symbol}")

        # Load trades from MT5
        df_raw = load_trades_from_mt5(
            login=mt5_login,
            password=mt5_password,
            server=mt5_server,
            date_from=date_from,
            date_to=date_to,
            symbol=mt5_symbol,
            calculate_mfe_mae=calculate_mfe_mae,
        )

        if len(df_raw) == 0:
            typer.echo("\n Error: No trades found in MetaTrader 5")
            typer.echo("   Check your date range and account history")
            raise typer.Exit(1)

        typer.echo(f"      Loaded {len(df_raw)} trades from MT5")

    else:
        # Load from CSV (original behavior)
        if input_path is None:
            typer.echo("\n Error: input_path is required when using --source csv")
            raise typer.Exit(1)

        if not input_path.exists():
            typer.echo(f"\n Error: File not found: {input_path}")
            raise typer.Exit(1)

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

        if source.lower() == "mt5":
            # Generate filename based on MT5 parameters
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            symbol_suffix = f"_{mt5_symbol}" if mt5_symbol else "_all"
            output_path = output_dir / f"mt5{symbol_suffix}_{timestamp}_features.csv"
        else:
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
            
            typer.echo(f"\n    Best Policy Found:")
            typer.echo(f"     Avg R: {best_policy['avg_R']:.3f} ({best_policy['avg_R'] - original_avg_R:+.3f})")
            typer.echo(f"     Winrate: {best_policy['winrate']:.1%}")
            typer.echo(f"     SL Multiplier: {best_policy['sl_mult']:.2f}x")
            typer.echo(f"     TP Multiplier: {best_policy['tp_mult']:.2f}x")
            
            if best_policy['trail_pct'] > 0:
                typer.echo(f"     Trail Stop: {best_policy['trail_pct']:.1%}")
            
            if best_policy['max_hold_minutes'] is not None:
                typer.echo(f"     Max Hold: {best_policy['max_hold_minutes']:.0f} minutes")
        
        # Save results
        typer.echo(f"\n Saving results...")
        save_counterfactuals_results(
            results_df,
            counterfactual_output,
            format="both",  # Save as both CSV and JSON
            top_n=top_n,
        )
        
        typer.echo("✓ Phase 2 complete!")
        
        # Suggest next steps
        typer.echo(f"\n💡 Next Steps:")
        typer.echo(f"   1. Review results: {counterfactual_output}")
        typer.echo(f"   2. Visualize policy performance")
        typer.echo(f"   3. Run Phase 3 (Bayesian optimization) for fine-tuning")
        typer.echo(f"   4. Analyze market regimes (Phase 5 clustering)")
    
    # =========================================================================
    # PHASE 3: Bayesian Optimization (optional)
    # =========================================================================
    
    if run_optimization_flag:
        typer.echo("\n PHASE 3: Bayesian Optimization")
        typer.echo("-" * 70)
        
        # Load configuration
        if config_path is None:
            config_path = Path("configs") / "default.yaml"
        
        if not config_path.exists():
            typer.echo(f"  Config file not found: {config_path}")
            typer.echo("   Using default optimization settings...")
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
                "uncertainty": {
                    "enabled": True,
                    "top_n": 5,
                    "n_bootstrap": 1000,
                    "confidence_level": 0.95,
                },
            }
        else:
            typer.echo(f"Loading config from: {config_path}")
            opt_config = load_optimization_config(config_path)
        
        # Run Bayesian optimization
        typer.echo("\nRunning Bayesian optimization with Optuna...")
        typer.echo(f"  Objective: Maximize {opt_config.get('objective_metric', 'avg_R')}")
        typer.echo(f"  Trials: {opt_config.get('n_trials', 50)}")
        
        try:
            best_policy, trials_df, study_summary = optimize_policy(
                df_features,
                opt_config,
                verbose=True,
            )
            
            # Display results
            typer.echo(f"\n Optimization Results:")
            typer.echo(f"   Tested {len(trials_df)} configurations")
            
            if len(trials_df) > 0:
                original_avg_R = df_features['R'].mean()
                best_value = study_summary['best_value']
                
                typer.echo(f"\n   Original Strategy:")
                typer.echo(f"     Avg R: {original_avg_R:.3f}")
                
                typer.echo(f"\n    Best Policy Found (Bayesian Optimization):")
                typer.echo(f"     Avg R: {best_value:.3f} ({best_value - original_avg_R:+.3f})")
                typer.echo(f"     Parameters: {best_policy}")
            
            # Estimate uncertainty (P3-T6)
            uncertainty_df = None
            uncertainty_config = opt_config.get("uncertainty", {})
            
            if uncertainty_config.get("enabled", True):
                typer.echo(f"\n Estimating uncertainty with bootstrap...")
                
                # Get top N policies
                top_n_policies_count = uncertainty_config.get("top_n", 5)
                top_n_policies_count = min(top_n_policies_count, len(trials_df))
                
                top_policies = []
                for idx in range(top_n_policies_count):
                    trial_row = trials_df.iloc[idx]
                    policy_params = {
                        key: trial_row[key]
                        for key in ['sl_mult', 'tp_mult', 'trail_pct', 'max_hold_minutes', 'risk_fraction']
                        if key in trial_row
                    }
                    top_policies.append(PolicyParams(**policy_params))
                
                uncertainty_df = estimate_uncertainty_bootstrap(
                    df_features,
                    top_policies,
                    n_bootstrap=uncertainty_config.get("n_bootstrap", 1000),
                    confidence_level=uncertainty_config.get("confidence_level", 0.95),
                    verbose=True,
                )
                
                # Display uncertainty for best policy
                if len(uncertainty_df) > 0:
                    best_unc = uncertainty_df.iloc[0]
                    typer.echo(f"\n   Best Policy Uncertainty:")
                    typer.echo(f"     Mean R: {best_unc['mean_R']:.3f}")
                    typer.echo(f"     95% CI: [{best_unc['ci_lower']:.3f}, {best_unc['ci_upper']:.3f}]")
                    typer.echo(f"     Std Dev: {best_unc['std_R']:.3f}")
            
            # Save results (P3-T5, P3-T7)
            artifact_dir = Path("artifacts")
            artifact_dir.mkdir(parents=True, exist_ok=True)
            
            typer.echo(f"\n Saving optimization results...")
            save_optimization_results(
                best_policy,
                trials_df,
                study_summary,
                uncertainty_df,
                artifact_dir,
                verbose=True,
            )
            
            # Store for comprehensive report (P6-T7)
            report_data["best_policy"] = {
                "policy": best_policy.to_dict(),
                "performance": {
                    "avg_r": study_summary.get("best_value", 0.0),
                    "win_rate": None,  # Would need to recalculate
                },
                "confidence": {
                    "mean_r": uncertainty_df.iloc[0]["mean_R"] if uncertainty_df is not None and len(uncertainty_df) > 0 else None,
                    "std_r": uncertainty_df.iloc[0]["std_R"] if uncertainty_df is not None and len(uncertainty_df) > 0 else None,
                    "ci_95_lower": uncertainty_df.iloc[0]["ci_lower"] if uncertainty_df is not None and len(uncertainty_df) > 0 else None,
                    "ci_95_upper": uncertainty_df.iloc[0]["ci_upper"] if uncertainty_df is not None and len(uncertainty_df) > 0 else None,
                }
            }
            report_data["optimization_results"] = {
                "method": "bayesian_optimization",
                "n_trials": len(trials_df),
                "objective_metric": opt_config.get("objective_metric", "avg_R"),
                "summary": study_summary,
                "trials_df": trials_df,
            }
            
            typer.echo("✓ Phase 3 complete!")
            
        except ImportError as e:
            typer.echo(f"\n Error: {e}")
            typer.echo("   Install required packages: pip install optuna pyyaml")
        except Exception as e:
            typer.echo(f"\n Optimization failed: {e}")
    
    # =========================================================================
    # PHASE 4: Survival Analysis (optional)
    # =========================================================================
    
    if run_survival_flag:
        typer.echo("\nPHASE 4: Survival Analysis")
        typer.echo("-" * 70)
        
        typer.echo("\nAnalyzing optimal trade holding times...")
        
        try:
            # Prepare survival data (P4-T2)
            typer.echo("\n  Preparing survival data...")
            survival_df = prepare_survival_data(
                df_features,
                event_definition="negative_r",
                include_covariates=True,
            )
            
            n_events = survival_df["event"].sum()
            n_censored = len(survival_df) - n_events
            typer.echo(f"    Trades: {len(survival_df)}")
            typer.echo(f"    Events (failed): {n_events}")
            typer.echo(f"    Censored (survived): {n_censored}")
            
            # Fit Kaplan-Meier (P4-T3)
            typer.echo("\n  Fitting Kaplan-Meier survival curve...")
            kmf, survival_table = fit_kaplan_meier(survival_df)
            typer.echo(f"    ✓ Kaplan-Meier curve fitted")
            
            # Optionally fit Cox model (P4-T4)
            typer.echo("\n  Fitting Cox proportional hazards model...")
            cph, hazard_ratios = fit_cox_model(survival_df)
            
            if cph is not None:
                typer.echo(f"    ✓ Cox model fitted with {len(hazard_ratios)} covariates")
            else:
                typer.echo(f"      Cox model skipped (insufficient covariates or events)")
            
            # Extract sweet spot (P4-T5)
            typer.echo("\n  Identifying optimal hold time range...")
            sweet_spot = extract_sweet_spot(survival_table, min_survival_prob=0.85)
            
            optimal_min, optimal_max = sweet_spot["optimal_range_minutes"]
            survival_rate = sweet_spot["survival_rate_in_range"]
            median_time = sweet_spot["median_survival_time"]
            
            typer.echo(f"    ✓ Sweet spot identified: {optimal_min}-{optimal_max} minutes")
            
            # Summarize insights (P4-T6)
            original_avg_hold = (
                (pd.to_datetime(df_features["exit_time"]) - 
                 pd.to_datetime(df_features["entry_time"]))
                .dt.total_seconds() / 60
            ).mean()
            
            insights = summarize_hold_time_insights(
                survival_table,
                sweet_spot,
                hazard_ratios,
                original_avg_hold,
            )
            
            # Display results
            typer.echo(f"\n Survival Analysis Results:")
            typer.echo(f"   Original average hold: {original_avg_hold:.0f} minutes")
            typer.echo(f"\n    Optimal Hold Time Range:")
            typer.echo(f"     {optimal_min}-{optimal_max} minutes")
            typer.echo(f"     Survival rate in range: {survival_rate:.1%}")
            typer.echo(f"     Median survival time: {median_time} minutes")
            
            # Display key time points
            typer.echo(f"\n   Survival at Key Times:")
            for time_key, stats in insights["survival_at_key_times"].items():
                time_label = time_key.replace("_", " ")
                prob = stats["survival_prob"]
                typer.echo(f"     {time_label}: {prob:.1%}")
            
            # Display recommendations
            typer.echo(f"\n    Recommendations:")
            for i, rec in enumerate(insights["recommendations"], 1):
                # Wrap long recommendations
                if len(rec) > 60:
                    words = rec.split()
                    lines = []
                    current_line = ""
                    for word in words:
                        if len(current_line) + len(word) + 1 <= 60:
                            current_line += word + " "
                        else:
                            lines.append(current_line.strip())
                            current_line = word + " "
                    if current_line:
                        lines.append(current_line.strip())
                    
                    typer.echo(f"     {i}. {lines[0]}")
                    for line in lines[1:]:
                        typer.echo(f"        {line}")
                else:
                    typer.echo(f"     {i}. {rec}")
            
            # Display covariate effects if available
            if insights["covariate_effects"]:
                typer.echo(f"\n   🔬 Market Condition Effects:")
                for covar, effect in insights["covariate_effects"].items():
                    hr = effect["hazard_ratio"]
                    interpretation = effect["interpretation"]
                    typer.echo(f"     • {interpretation}")
            
            # Save results
            artifact_dir = Path("artifacts")
            artifact_dir.mkdir(parents=True, exist_ok=True)
            
            typer.echo(f"\n Saving survival analysis results...")
            save_survival_results(
                survival_table,
                insights,
                artifact_dir,
                verbose=True,
            )
            
            # Store for comprehensive report (P6-T7)
            report_data["hold_time_insights"] = insights
            
            typer.echo("✓ Phase 4 complete!")
            
        except ImportError as e:
            typer.echo(f"\n Error: {e}")
            typer.echo("   Install required packages: pip install lifelines")
        except Exception as e:
            typer.echo(f"\n Survival analysis failed: {e}")
            import traceback
            traceback.print_exc()
    
    # =========================================================================
    # PHASE 5: Market Regime Clustering (optional)
    # =========================================================================
    
    if run_clustering_flag:
        typer.echo("\n🔬 PHASE 5: Market Regime Clustering")
        typer.echo("-" * 70)
        
        typer.echo("\nIdentifying distinct market regimes...")
        
        try:
            # Enrich with market context features before regime extraction.
            # Uses MT5 on Windows, yfinance on macOS/Linux (Railway).
            typer.echo("\n  Fetching market context (ATR, EMA, volume)...")
            try:
                from turtle_analytics.market_data import fetch_market_context
                df_features = fetch_market_context(df_features)
                typer.echo(f"    ✓ Market context added")
            except Exception as e:
                typer.echo(f"    ⚠ Market context unavailable ({e}) — using outcome-based features")

            # Extract regime features (P5-T2)
            typer.echo("\n  Extracting regime features...")
            regime_df = extract_regime_features(df_features, lookback_window=20)
            typer.echo(f"    ✓ Features extracted")
            
            # Chronological train/test split — model fits on training trades only
            cutoff = int(len(regime_df) * 0.8)
            train_regime_df = regime_df.iloc[:cutoff]
            test_regime_df = regime_df.iloc[cutoff:]

            # Fit clustering model (P5-T3)
            typer.echo(f"\n  Fitting clustering model ({n_clusters} clusters)...")
            typer.echo(f"    Train trades: {len(train_regime_df)} | Test trades: {len(test_regime_df)}")
            model, df_labeled, cluster_summary, scaler = fit_clustering_model(
                train_regime_df,
                n_clusters=n_clusters,
                method="kmeans",
            )

            # Label held-out test trades using the fitted model (not refit)
            test_labeled = label_trades_with_regime(test_regime_df, model, scaler)
            
            actual_clusters = cluster_summary["n_clusters"]
            silhouette = cluster_summary["silhouette_score"]
            typer.echo(f"    ✓ Found {actual_clusters} regimes")
            typer.echo(f"    Silhouette score: {silhouette:.3f}")
            
            # Display regime sizes
            typer.echo(f"\n    Regime Distribution:")
            for regime_id, size in cluster_summary["cluster_sizes"].items():
                pct = size / len(df_labeled) * 100
                regime_type = "Unknown"
                
                # Classify regime
                if regime_id in cluster_summary["cluster_characteristics"]:
                    chars = cluster_summary["cluster_characteristics"][regime_id]
                    trend = chars.get("trend_strength", 0.5)
                    vol = chars.get("volatility_recent", 0.5)
                    
                    if trend > 0.6:
                        regime_type = "Trending High Vol" if vol > 0.02 else "Trending Low Vol"
                    else:
                        regime_type = "Ranging Volatile" if vol > 0.02 else "Ranging Tight"
                
                typer.echo(f"     Regime {regime_id} ({regime_type}): {size} trades ({pct:.1f}%)")
            
            # Optimize policies per regime (P5-T5)
            typer.echo(f"\n  Optimizing policies for each regime...")
            regime_policies = optimize_policies_per_regime(
                df_labeled,
                test_df=test_labeled,
                n_trials_per_regime=20,  # Reduced for speed
                verbose=True,
            )
            
            typer.echo(f"\n    Optimized Policies by Regime:")
            for regime_id in sorted(regime_policies.keys()):
                policy, metrics = regime_policies[regime_id]
                
                # Get regime characteristics
                chars = cluster_summary["cluster_characteristics"].get(regime_id, {})
                trend = chars.get("trend_strength", 0)
                vol = chars.get("volatility_recent", 0)
                
                if trend > 0.6:
                    regime_type = "Trending High Vol" if vol > 0.02 else "Trending Low Vol"
                else:
                    regime_type = "Ranging Volatile" if vol > 0.02 else "Ranging Tight"
                
                typer.echo(f"\n     Regime {regime_id} ({regime_type}):")
                typer.echo(f"       Avg R: {metrics['avg_R']:.3f}")
                typer.echo(f"       SL: {policy.sl_mult:.2f}x, TP: {policy.tp_mult:.2f}x")
                if policy.trail_pct > 0:
                    typer.echo(f"       Trail: {policy.trail_pct:.1%}")
                if policy.max_hold_minutes:
                    typer.echo(f"       Max hold: {policy.max_hold_minutes:.0f} min")
            
            # Create regime summary (P5-T6)
            typer.echo(f"\n  Generating regime summary...")
            regime_summary = create_regime_summary(
                test_labeled,
                cluster_summary,
                regime_policies,
            )
            
            # Display recommendations
            typer.echo(f"\n    Key Insights:")
            for i, rec in enumerate(regime_summary["recommendations"], 1):
                # Wrap long text
                if len(rec) > 60:
                    words = rec.split()
                    lines = []
                    current_line = ""
                    for word in words:
                        if len(current_line) + len(word) + 1 <= 60:
                            current_line += word + " "
                        else:
                            lines.append(current_line.strip())
                            current_line = word + " "
                    if current_line:
                        lines.append(current_line.strip())
                    
                    typer.echo(f"     {i}. {lines[0]}")
                    for line in lines[1:]:
                        typer.echo(f"        {line}")
                else:
                    typer.echo(f"     {i}. {rec}")
            
            # Save results
            artifact_dir = Path("artifacts")
            artifact_dir.mkdir(parents=True, exist_ok=True)
            
            typer.echo(f"\n Saving regime analysis results...")
            save_regime_results(
                df_labeled,
                regime_summary,
                artifact_dir,
                verbose=True,
            )
            
            # Store for comprehensive report (P6-T7)
            report_data["regime_summary"] = regime_summary
            
            typer.echo("✓ Phase 5 complete!")
            
            typer.echo(f"\n Adaptive Trading Strategy Ready!")
            typer.echo(f"   You now have {len(regime_policies)} regime-specific policies")
            typer.echo(f"   Implement dynamic parameter selection based on detected regime")
            
        except ImportError as e:
            typer.echo(f"\n Error: {e}")
            typer.echo("   Install required packages: pip install scikit-learn")
        except Exception as e:
            typer.echo(f"\n Clustering failed: {e}")
            import traceback
            traceback.print_exc()
    
    # =========================================================================
    # PHASE 6: Comprehensive Report Generation (P6-T7, P6-T8)
    # =========================================================================
    
    # Build comprehensive JSON report aggregating all results
    typer.echo("\n Generating Comprehensive Report...")
    typer.echo("-" * 70)
    
    try:
        report = build_report(
            df=df_features,
            best_policy=report_data["best_policy"],
            optimization_results=report_data["optimization_results"],
            regime_summary=report_data["regime_summary"],
            hold_time_insights=report_data["hold_time_insights"],
            pipeline_version="1.0.0",
        )
        
        # Save report to artifacts/report.json (P6-T8)
        artifact_dir = Path("artifacts")
        artifact_dir.mkdir(parents=True, exist_ok=True)
        
        report_path = artifact_dir / "report.json"
        save_report(report, report_path, verbose=True)
        
        # Display summary
        typer.echo(f"\n Report Summary:")
        typer.echo(f"   Original performance: {report['summary']['original_performance']['avg_r']:.3f} avg R")
        
        if report['summary']['best_performance']:
            typer.echo(f"   Best performance: {report['summary']['best_performance']['avg_r']:.3f} avg R")
            typer.echo(f"   Improvement: {report['summary']['best_performance']['improvement']:+.3f} "
                      f"({report['summary']['best_performance']['improvement_pct']:+.1%})")
        
        if report['regimes']:
            typer.echo(f"   Regimes identified: {report['regimes']['n_regimes']}")
        
        if report['hold_time_insights']:
            optimal_range = report['hold_time_insights']['optimal_range_minutes']
            typer.echo(f"   Optimal hold time: {optimal_range[0]}-{optimal_range[1]} minutes")
        
        if report['risk_recommendations']:
            suggested_risk = report['risk_recommendations']['suggested_risk_fraction']
            typer.echo(f"   Suggested risk per trade: {suggested_risk:.2%}")
        
        typer.echo(f"\n✓ Comprehensive report generated: {report_path}")
        
    except Exception as e:
        typer.echo(f"\n  Report generation failed: {e}")
        typer.echo(f"   Individual phase results still saved in artifacts/")
    
    typer.echo("\n" + "=" * 70)
    typer.echo(" PIPELINE COMPLETE")
    typer.echo("=" * 70)


if __name__ == "__main__":
    app()
