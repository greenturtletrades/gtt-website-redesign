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


def _run_optuna_study(
    train_df: pd.DataFrame,
    search_space: dict,
    objective_metric: str,
    n_trials: int,
    random_seed: int,
    verbose: bool,
) -> tuple[dict, "optuna.Study"]:
    """
    Run a single Optuna study on train_df. Returns (best_params, study).
    Extracted so walk-forward folds can reuse the same logic without duplication.
    """
    def objective(trial: optuna.Trial) -> float:
        params = {}
        for param_name, param_config in search_space.items():
            param_type = param_config.get("type", "float")
            if param_type == "float":
                params[param_name] = trial.suggest_float(param_name, param_config["low"], param_config["high"])
            elif param_type == "int":
                params[param_name] = trial.suggest_int(param_name, param_config["low"], param_config["high"])
            elif param_type == "categorical":
                params[param_name] = trial.suggest_categorical(param_name, param_config["choices"])
            else:
                warnings.warn(f"Unknown parameter type: {param_type}", UserWarning)
        try:
            policy = PolicyParams(**params)
            sim_df = run_simulation(train_df, policy, inplace=False)
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
            objective_value = metrics.get(objective_metric)
            if objective_value is None:
                warnings.warn(
                    f"objective_metric '{objective_metric}' not found in policy metrics. "
                    f"Available: {list(metrics.keys())}",
                    UserWarning,
                )
                return float("inf")

            # Metrics where lower is genuinely better — minimize directly.
            # Everything else is assumed higher-is-better and gets negated.
            lower_is_better = {"std_R", "max_loss_R"}
            if objective_metric in lower_is_better:
                return objective_value
            return -objective_value
        except Exception as e:
            warnings.warn(f"Trial failed: {e}", RuntimeWarning)
            return float("inf")

    sampler = optuna.samplers.TPESampler(seed=random_seed)
    study = optuna.create_study(direction="minimize", sampler=sampler)

    if verbose:
        study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
    else:
        optuna.logging.set_verbosity(optuna.logging.WARNING)
        study.optimize(objective, n_trials=n_trials)

    return study.best_params, study


def optimize_policy(
    df: pd.DataFrame,
    config: dict,
    verbose: bool = True,
    train_ratio: float = 0.8,
    n_walkforward_folds: int = 1,
) -> tuple[PolicyParams, pd.DataFrame, dict]:
    """
    Find optimal policy parameters using Bayesian optimization.

    Supports two validation modes controlled by n_walkforward_folds:

    n_walkforward_folds=1 (default):
        Single chronological 80/20 split. Fast. Optimize on first 80%,
        evaluate once on last 20%.

    n_walkforward_folds>1 (walk-forward):
        Expanding window walk-forward validation. For each fold, the training
        window grows and is followed by a fresh test window. Each fold runs a
        full Optuna study. The final returned policy is optimized on the full
        training portion (train_ratio). Walk-forward statistics (mean, std,
        coefficient of variation of test scores) are included in the summary —
        a high coefficient of variation (>0.5) indicates the optimized
        parameters are unstable across time periods, which is a strong
        overfitting signal.

        Fold layout example with n_walkforward_folds=3, train_ratio=0.8:
            Fold 1: train [0%–53%]  test [53%–67%]
            Fold 2: train [0%–67%]  test [67%–80%]
            Fold 3: train [0%–80%]  test [80%–100%]  ← same as single-split test

    Parameters
    ----------
    df : pd.DataFrame
        Historical trades DataFrame (validated, with features).

    config : dict
        Optimization configuration. Must contain:
        - objective_metric: "avg_R", "sharpe_ratio", "winrate", etc.
        - n_trials: number of optimization iterations per fold
        - search_space: parameter ranges
        - random_seed: for reproducibility

    verbose : bool
        If True, print progress during optimization.

    train_ratio : float
        Fraction of trades used as the final training window. Default: 0.8.

    n_walkforward_folds : int
        Number of walk-forward folds. 1 = single split (fast, default).
        3–5 recommended for production use. Each fold adds one full Optuna
        study, so compute time scales linearly.

    Returns
    -------
    best_policy : PolicyParams
        Policy optimized on the full training window (train_ratio of data).

    trials_df : pd.DataFrame
        Trials from the final (full training) Optuna study.

    study_summary : dict
        Includes train score, test score, and walk-forward statistics when
        n_walkforward_folds > 1:
        - wf_scores        : list of per-fold test scores
        - wf_mean          : mean test score across folds
        - wf_std           : standard deviation of test scores
        - wf_cv            : coefficient of variation (std / |mean|)
                             >0.5 suggests unstable / overfitting parameters
    """
    if not OPTUNA_AVAILABLE:
        raise ImportError(
            "Optuna is required for Bayesian optimization. "
            "Install with: pip install optuna"
        )

    objective_metric = config.get("objective_metric", "avg_R")
    n_trials         = config.get("n_trials", 50)
    search_space     = config.get("search_space", {})
    random_seed      = config.get("random_seed", 42)

    n_walkforward_folds = max(1, n_walkforward_folds)

    if verbose:
        print(f"Starting Bayesian optimization with Optuna")
        print(f"  Objective: Maximize {objective_metric}")
        print(f"  Trials per fold: {n_trials}")
        print(f"  Walk-forward folds: {n_walkforward_folds}")
        print(f"  Search space: {len(search_space)} parameters")
    # ------------------------------------------------------------------
    # Walk-forward folds
    # ------------------------------------------------------------------
    # The final fold always mirrors the single-split behaviour (train up to
    # train_ratio, test on the remainder). Earlier folds use smaller training
    # windows that end before train_ratio, each followed by a fresh test slice.
    #
    # Fold boundaries (fractions of total trades):
    #   fold k train end  = min_train + k * step          where step = train_ratio - min_train / n_folds
    #   fold k test start = fold k train end
    #   fold k test end   = fold k+1 train end  (or 1.0 for the last fold)

    min_train_ratio = max(0.5, train_ratio - 0.3)  # earliest training window is 50% of data
    step = (train_ratio - min_train_ratio) / n_walkforward_folds

    fold_boundaries = []
    for k in range(n_walkforward_folds):
        fold_train_end  = min_train_ratio + (k + 1) * step
        fold_test_start = fold_train_end
        fold_test_end   = min_train_ratio + (k + 2) * step if k < n_walkforward_folds - 1 else 1.0
        fold_boundaries.append((fold_train_end, fold_test_start, fold_test_end))

    wf_scores: list[float] = []
    final_best_params = None
    final_study = None

    for fold_idx, (fold_train_end, fold_test_start, fold_test_end) in enumerate(fold_boundaries):
        fold_train_cut = int(len(df) * fold_train_end)
        fold_test_cut  = int(len(df) * fold_test_end)

        fold_train_df = df.iloc[:fold_train_cut].copy()
        fold_test_df  = df.iloc[fold_train_cut:fold_test_cut].copy()

        if len(fold_train_df) < 10 or len(fold_test_df) < 5:
            if verbose:
                print(f"  Fold {fold_idx + 1}/{n_walkforward_folds}: skipped (insufficient data)")
            continue

        if verbose:
            is_final = (fold_idx == n_walkforward_folds - 1)
            label = " (final)" if is_final else ""
            print(f"\n  Fold {fold_idx + 1}/{n_walkforward_folds}{label}: "
                  f"train={len(fold_train_df)} trades, test={len(fold_test_df)} trades")

        fold_best_params, fold_study = _run_optuna_study(
            fold_train_df, search_space, objective_metric,
            n_trials, random_seed + fold_idx, verbose,
        )

        # Evaluate on this fold's test window
        try:
            fold_policy  = PolicyParams(**fold_best_params)
            fold_sim_df  = run_simulation(fold_test_df, fold_policy, inplace=False)
            fold_metrics = calculate_policy_metrics(fold_sim_df)
            fold_score   = fold_metrics.get(objective_metric, 0.0)
            wf_scores.append(fold_score)
            if verbose:
                print(f"    Fold test {objective_metric}: {fold_score:.3f}")
        except Exception as e:
            warnings.warn(f"Fold {fold_idx + 1} test evaluation failed: {e}", RuntimeWarning)

        # Keep the last fold's study as the final one (trained on most data)
        final_best_params = fold_best_params
        final_study = fold_study

    if final_best_params is None or final_study is None:
        raise RuntimeError("All walk-forward folds failed — cannot determine best policy.")

    # ------------------------------------------------------------------
    # Final policy from the last (largest training window) fold
    # ------------------------------------------------------------------
    best_policy = PolicyParams(**final_best_params)

    # Evaluate final policy on its held-out test window
    final_train_cut = int(len(df) * train_ratio)
    final_test_df   = df.iloc[final_train_cut:].copy()
    best_value_test = None
    try:
        test_sim_df  = run_simulation(final_test_df, best_policy, inplace=False)
        test_metrics = calculate_policy_metrics(test_sim_df)
        best_value_test = test_metrics.get(objective_metric)
    except Exception as e:
        warnings.warn(f"Final test evaluation failed: {e}", RuntimeWarning)

    # Walk-forward stability statistics
    wf_mean = float(np.mean(wf_scores)) if wf_scores else None
    wf_std  = float(np.std(wf_scores))  if wf_scores else None
    wf_cv   = float(wf_std / abs(wf_mean)) if (wf_mean and wf_mean != 0) else None

    # Extract trials from final study
    trials_data = []
    for trial in final_study.trials:
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
    if not trials_df.empty:
        trials_df = trials_df.sort_values(objective_metric, ascending=False).reset_index(drop=True)

    train_score = -final_study.best_value

    study_summary = {
        "best_value_train":      train_score,
        "best_value_test":       best_value_test,
        "best_value":            train_score,       # backwards compatibility
        "best_params":           final_best_params,
        "n_trials":              len(final_study.trials),
        "objective_metric":      objective_metric,
        "n_train_trades":        final_train_cut,
        "n_test_trades":         len(final_test_df),
        "n_walkforward_folds":   n_walkforward_folds,
        "wf_scores":             wf_scores,
        "wf_mean":               wf_mean,
        "wf_std":                wf_std,
        "wf_cv":                 wf_cv,
    }

    if verbose:
        print(f"\n✓ Optimization complete!")
        print(f"  Train {objective_metric}: {train_score:.3f}")
        if best_value_test is not None:
            print(f"  Test  {objective_metric}: {best_value_test:.3f}")
        if len(wf_scores) > 1:
            print(f"  Walk-forward scores: {[f'{s:.3f}' for s in wf_scores]}")
            print(f"  WF mean={wf_mean:.3f}  std={wf_std:.3f}  CV={wf_cv:.2f}")
            if wf_cv is not None and wf_cv > 0.5:
                print(f"  ⚠ High CV ({wf_cv:.2f}) — parameters unstable across time periods")
        print(f"  Best parameters:")
        for param, value in final_best_params.items():
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
    train_ratio: float = 0.8,
) -> pd.DataFrame:
    """
    Estimate uncertainty in policy performance using bootstrap resampling.

    Bootstrap resampling repeatedly samples trades with replacement and
    re-evaluates each policy to estimate the distribution of outcomes.
    This gives confidence intervals for the "true" performance.

    Resampling is performed on the held-out test portion of the data only
    (the last 1 - train_ratio fraction, chronologically) to ensure confidence
    intervals reflect out-of-sample performance rather than training performance.

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

    train_ratio : float
        Must match the value used in optimize_policy so the same test split
        is used here. Default: 0.8.

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

    # Use only the held-out test portion so CIs reflect out-of-sample performance
    cutoff = int(len(df) * train_ratio)
    df = df.iloc[cutoff:].copy()

    if verbose:
        print(f"  Bootstrap using {len(df)} held-out test trades")
    
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
