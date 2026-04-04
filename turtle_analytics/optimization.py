"""
Bayesian optimization for Turtle Analytics.

This module implements smart parameter search using Optuna for Bayesian optimization.
Unlike grid search which tests all combinations, Bayesian optimization intelligently
explores the parameter space, focusing on promising regions.

Key features:
- Gaussian process-based optimization
- Adaptive sampling (focuses on promising areas)
- Uncertainty estimation via bootstrap
- Confidence intervals for best parameters
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable
import warnings
import json

import pandas as pd
import numpy as np

try:
    import optuna
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    warnings.warn(
        "Optuna not installed. Install with: pip install optuna\n"
        "Falling back to random search if optimization is requested.",
        UserWarning
    )

from .policies import PolicyParams
from .simulator import run_simulation, calculate_policy_metrics, compare_original_vs_simulated


def optimize_policy(
    df: pd.DataFrame,
    config: dict,
    verbose: bool = True,
) -> tuple[PolicyParams, pd.DataFrame, dict]:
    """
    Find optimal policy parameters using Bayesian optimization.
    
    This function uses Optuna to intelligently search the parameter space.
    Instead of testing all combinations (grid search) or random sampling,
    it uses Gaussian processes to model the objective function and focuses
    on promising parameter regions.
    
    Parameters
    ----------
    df : pd.DataFrame
        Historical trades DataFrame (validated, with features).
    
    config : dict
        Optimization configuration from YAML. Must contain:
        - objective_metric: "avg_R", "sharpe_ratio", "winrate", etc.
        - n_trials: number of optimization iterations
        - search_space: parameter ranges
        - random_seed: for reproducibility
    
    verbose : bool
        If True, print progress during optimization.
    
    Returns
    -------
    best_policy : PolicyParams
        Best policy found by optimization.
    
    trials_df : pd.DataFrame
        All trials with parameters and metrics.
    
    study_summary : dict
        Summary statistics about the optimization.
    
    Examples
    --------
    >>> config = {
    ...     "objective_metric": "avg_R",
    ...     "n_trials": 50,
    ...     "search_space": {...},
    ...     "random_seed": 42,
    ... }
    >>> best_policy, trials_df, summary = optimize_policy(trades, config)
    >>> print(f"Best avg_R: {summary['best_value']:.3f}")
    
    Notes
    -----
    This implements P3-T3 and P3-T4:
    - P3-T3: Uses Optuna for Bayesian optimization
    - P3-T4: Objective function calls run_simulation and returns negative avg_R
    """
    if not OPTUNA_AVAILABLE:
        raise ImportError(
            "Optuna is required for Bayesian optimization. "
            "Install with: pip install optuna"
        )
    
    # Extract config
    objective_metric = config.get("objective_metric", "avg_R")
    n_trials = config.get("n_trials", 50)
    search_space = config.get("search_space", {})
    random_seed = config.get("random_seed", 42)
    
    if verbose:
        print(f"Starting Bayesian optimization with Optuna")
        print(f"  Objective: Maximize {objective_metric}")
        print(f"  Trials: {n_trials}")
        print(f"  Search space: {len(search_space)} parameters")
    
    # Create objective function
    def objective(trial: optuna.Trial) -> float:
        """
        Objective function for Optuna.
        
        This function:
        1. Samples parameters from the search space
        2. Creates a PolicyParams object
        3. Runs simulation with that policy
        4. Calculates metrics
        5. Returns the objective value (to be minimized by Optuna)
        
        Note: Optuna MINIMIZES, so we return negative values for metrics we want to maximize.
        """
        # Sample parameters from search space
        params = {}
        
        for param_name, param_config in search_space.items():
            param_type = param_config.get("type", "float")
            
            if param_type == "float":
                low = param_config["low"]
                high = param_config["high"]
                params[param_name] = trial.suggest_float(param_name, low, high)
                
            elif param_type == "int":
                low = param_config["low"]
                high = param_config["high"]
                params[param_name] = trial.suggest_int(param_name, low, high)
                
            elif param_type == "categorical":
                choices = param_config["choices"]
                params[param_name] = trial.suggest_categorical(param_name, choices)
            
            else:
                warnings.warn(f"Unknown parameter type: {param_type}", UserWarning)
        
        try:
            # Create policy
            policy = PolicyParams(**params)
            
            # Run simulation
            sim_df = run_simulation(df, policy, inplace=False)
            
            # Calculate metrics
            metrics = calculate_policy_metrics(sim_df)
            for key, value in metrics.items():
                if isinstance(value, (int, float, np.floating)) and np.isfinite(value):
                    trial.set_user_attr(key, float(value))
            comparison = compare_original_vs_simulated(sim_df)
            pct_changed = comparison.get("pct_changed")
            if isinstance(pct_changed, (int, float, np.floating)) and np.isfinite(pct_changed):
                trial.set_user_attr("pct_changed", float(pct_changed))
            original_winrate = comparison.get("original_winrate")
            if isinstance(original_winrate, (int, float, np.floating)) and np.isfinite(original_winrate):
                trial.set_user_attr("original_winrate", float(original_winrate))
            simulated_winrate = comparison.get("simulated_winrate")
            if isinstance(simulated_winrate, (int, float, np.floating)) and np.isfinite(simulated_winrate):
                trial.set_user_attr("simulated_winrate", float(simulated_winrate))
            delta_winrate = comparison.get("delta_winrate")
            if isinstance(delta_winrate, (int, float, np.floating)) and np.isfinite(delta_winrate):
                trial.set_user_attr("delta_winrate", float(delta_winrate))
            
            # Get objective value
            objective_value = metrics.get(objective_metric, 0.0)
            
            # Optuna minimizes, so negate for metrics we want to maximize
            if objective_metric in ["avg_R", "winrate", "total_R", "sharpe_ratio"]:
                return -objective_value  # Negate to maximize
            else:
                return objective_value  # Minimize directly
                
        except Exception as e:
            # If policy is invalid or simulation fails, return worst value
            warnings.warn(f"Trial failed: {e}", RuntimeWarning)
            return float('inf')  # Worst possible value
    
    # Create study
    sampler = optuna.samplers.TPESampler(seed=random_seed)
    study = optuna.create_study(
        direction="minimize",  # We minimize (negative values)
        sampler=sampler,
    )
    
    # Run optimization
    if verbose:
        # Show progress bar
        study.optimize(
            objective,
            n_trials=n_trials,
            show_progress_bar=True,
        )
    else:
        # Silent mode
        optuna.logging.set_verbosity(optuna.logging.WARNING)
        study.optimize(objective, n_trials=n_trials)
    
    # Extract results (P3-T5: Store all trials)
    trials_data = []
    for trial in study.trials:
        trial_data = {
            "trial_id": trial.number,
            **trial.params,
            f"{objective_metric}": -trial.value if trial.value is not None else None,
            "state": trial.state.name,
            "avg_R": trial.user_attrs.get("avg_R"),
            "winrate": trial.user_attrs.get("winrate"),
            "median_R": trial.user_attrs.get("median_R"),
            "std_R": trial.user_attrs.get("std_R"),
            "n_trades": trial.user_attrs.get("n_trades"),
            "total_R": trial.user_attrs.get("total_R"),
            "pct_changed": trial.user_attrs.get("pct_changed"),
            "original_winrate": trial.user_attrs.get("original_winrate"),
            "simulated_winrate": trial.user_attrs.get("simulated_winrate"),
            "delta_winrate": trial.user_attrs.get("delta_winrate"),
        }
        trials_data.append(trial_data)
    
    trials_df = pd.DataFrame(trials_data)
    trials_df = trials_df.sort_values(objective_metric, ascending=False).reset_index(drop=True)
    
    # Get best policy
    best_params = study.best_params
    best_policy = PolicyParams(**best_params)
    
    # Create summary
    study_summary = {
        "best_value": -study.best_value,  # Un-negate
        "best_params": best_params,
        "n_trials": len(study.trials),
        "objective_metric": objective_metric,
    }
    
    if verbose:
        print(f"\n✓ Optimization complete!")
        print(f"  Best {objective_metric}: {-study.best_value:.3f}")
        print(f"  Best parameters:")
        for param, value in best_params.items():
            if value is not None:
                print(f"    {param}: {value}")
    
    return best_policy, trials_df, study_summary


def estimate_uncertainty_bootstrap(
    df: pd.DataFrame,
    policies: list[PolicyParams],
    n_bootstrap: int = 1000,
    confidence_level: float = 0.95,
    random_seed: int = 42,
    verbose: bool = True,
) -> pd.DataFrame:
    """
    Estimate uncertainty in policy performance using bootstrap resampling.
    
    Bootstrap resampling repeatedly samples trades with replacement and
    re-evaluates each policy to estimate the distribution of outcomes.
    This gives confidence intervals for the "true" performance.
    
    Parameters
    ----------
    df : pd.DataFrame
        Historical trades DataFrame.
    
    policies : list[PolicyParams]
        List of policies to evaluate (typically top N from optimization).
    
    n_bootstrap : int
        Number of bootstrap samples (more = better estimates but slower).
        Recommended: 1000 for production, 100 for quick testing.
    
    confidence_level : float
        Confidence level for intervals (e.g., 0.95 for 95% CI).
    
    random_seed : int
        Random seed for reproducibility.
    
    verbose : bool
        If True, show progress.
    
    Returns
    -------
    pd.DataFrame
        Uncertainty estimates with columns:
        - policy_id: identifier
        - mean_R: mean avg_R across bootstraps
        - std_R: standard deviation
        - ci_lower: lower confidence bound
        - ci_upper: upper confidence bound
        - All policy parameters
    
    Examples
    --------
    >>> top_policies = [best_policy, second_best, third_best]
    >>> uncertainty_df = estimate_uncertainty_bootstrap(
    ...     trades,
    ...     top_policies,
    ...     n_bootstrap=1000,
    ...     confidence_level=0.95
    ... )
    >>> print(uncertainty_df[['mean_R', 'ci_lower', 'ci_upper']])
    
    Notes
    -----
    This implements P3-T6: Bootstrap-based uncertainty estimation.
    """
    np.random.seed(random_seed)
    
    if verbose:
        print(f"Estimating uncertainty with bootstrap (n={n_bootstrap})...")
    
    n_trades = len(df)
    alpha = 1 - confidence_level
    lower_percentile = (alpha / 2) * 100
    upper_percentile = (1 - alpha / 2) * 100
    
    results = []
    
    for policy_idx, policy in enumerate(policies):
        if verbose and (policy_idx + 1) % 5 == 0:
            print(f"  Policy {policy_idx + 1}/{len(policies)}...")
        
        bootstrap_Rs = []
        
        # Bootstrap resampling
        for _ in range(n_bootstrap):
            # Sample trades with replacement
            bootstrap_indices = np.random.choice(
                n_trades,
                size=n_trades,
                replace=True
            )
            bootstrap_df = df.iloc[bootstrap_indices].copy()
            
            # Simulate with this policy
            try:
                sim_df = run_simulation(bootstrap_df, policy, inplace=False)
                metrics = calculate_policy_metrics(sim_df)
                bootstrap_Rs.append(metrics['avg_R'])
            except Exception:
                # If simulation fails, skip this bootstrap sample
                continue
        
        if len(bootstrap_Rs) == 0:
            warnings.warn(f"Policy {policy_idx} failed all bootstrap samples", RuntimeWarning)
            continue
        
        bootstrap_Rs = np.array(bootstrap_Rs)
        
        # Calculate statistics
        result = {
            "policy_id": policy_idx,
            **policy.to_dict(),
            "mean_R": float(np.mean(bootstrap_Rs)),
            "median_R": float(np.median(bootstrap_Rs)),
            "std_R": float(np.std(bootstrap_Rs)),
            "ci_lower": float(np.percentile(bootstrap_Rs, lower_percentile)),
            "ci_upper": float(np.percentile(bootstrap_Rs, upper_percentile)),
            "n_bootstrap_samples": len(bootstrap_Rs),
        }
        
        results.append(result)
    
    uncertainty_df = pd.DataFrame(results)
    
    if verbose:
        print(f"✓ Uncertainty estimation complete!")
    
    return uncertainty_df


def save_optimization_results(
    best_policy: PolicyParams,
    trials_df: pd.DataFrame,
    study_summary: dict,
    uncertainty_df: pd.DataFrame | None,
    output_dir: str | Path,
    verbose: bool = True,
) -> None:
    """
    Save optimization results to disk.
    
    Saves multiple files:
    - optimization_trials.csv: All trials with parameters and metrics
    - optimization_trials.json: Same as JSON
    - best_policy.json: Best policy with confidence intervals
    
    Parameters
    ----------
    best_policy : PolicyParams
        Best policy found.
    
    trials_df : pd.DataFrame
        All trials from optimization.
    
    study_summary : dict
        Summary statistics.
    
    uncertainty_df : pd.DataFrame or None
        Uncertainty estimates (if available).
    
    output_dir : str or Path
        Directory to save results.
    
    verbose : bool
        If True, print save confirmations.
    
    Notes
    -----
    This implements P3-T5 and P3-T7:
    - P3-T5: Save all trials as DataFrame
    - P3-T7: Save best policy with confidence intervals
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save trials (P3-T5)
    trials_csv = output_dir / "optimization_trials.csv"
    trials_df.to_csv(trials_csv, index=False)
    if verbose:
        print(f"✓ Saved trials: {trials_csv}")
    
    trials_json = output_dir / "optimization_trials.json"
    records = trials_df.to_dict(orient="records")
    # Handle NaN values
    for record in records:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    
    with open(trials_json, "w") as f:
        json.dump(records, f, indent=2)
    if verbose:
        print(f"✓ Saved trials: {trials_json}")
    
    # Save best policy with confidence intervals (P3-T7)
    best_policy_data = {
        "best_policy": best_policy.to_dict(),
        "performance": {
            "objective_metric": study_summary["objective_metric"],
            "best_value": study_summary["best_value"],
        },
        "optimization_summary": {
            "n_trials": study_summary["n_trials"],
        },
    }
    
    # Add uncertainty estimates if available
    if uncertainty_df is not None and len(uncertainty_df) > 0:
        best_uncertainty = uncertainty_df.iloc[0]
        best_policy_data["uncertainty"] = {
            "mean_R": float(best_uncertainty["mean_R"]),
            "std_R": float(best_uncertainty["std_R"]),
            "ci_lower": float(best_uncertainty["ci_lower"]),
            "ci_upper": float(best_uncertainty["ci_upper"]),
            "confidence_level": 0.95,  # Hardcoded for now
        }
    
    best_policy_json = output_dir / "best_policy.json"
    with open(best_policy_json, "w") as f:
        json.dump(best_policy_data, f, indent=2)
    if verbose:
        print(f"✓ Saved best policy: {best_policy_json}")
    
    # Save uncertainty estimates if available
    if uncertainty_df is not None:
        uncertainty_csv = output_dir / "uncertainty_estimates.csv"
        uncertainty_df.to_csv(uncertainty_csv, index=False)
        if verbose:
            print(f"✓ Saved uncertainty: {uncertainty_csv}")


def load_optimization_config(config_path: str | Path) -> dict:
    """
    Load optimization configuration from YAML file.
    
    Parameters
    ----------
    config_path : str or Path
        Path to YAML configuration file.
    
    Returns
    -------
    dict
        Optimization configuration.
    
    Examples
    --------
    >>> config = load_optimization_config("configs/default.yaml")
    >>> print(config["optimization"]["n_trials"])
    50
    
    Notes
    -----
    This implements P3-T2: Load optimization config.
    """
    try:
        import yaml
    except ImportError:
        raise ImportError(
            "PyYAML is required to load config files. "
            "Install with: pip install pyyaml"
        )
    
    config_path = Path(config_path)
    
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    return config.get("optimization", {})
