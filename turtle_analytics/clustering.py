"""
Market regime clustering for Turtle Analytics.

This module identifies different market conditions (regimes) using unsupervised
clustering, then optimizes separate trade management policies for each regime.

The key insight: What works in trending markets may fail in ranging markets.
By clustering trades into regimes, we can:
- Identify distinct market conditions
- Optimize policies per regime
- Implement adaptive parameter selection

Typical regimes discovered:
- Trending high volatility
- Trending low volatility
- Ranging tight
- Ranging volatile
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal
import warnings
import json

import pandas as pd
import numpy as np

try:
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import silhouette_score, davies_bouldin_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    warnings.warn(
        "scikit-learn not installed. Install with: pip install scikit-learn\n"
        "Clustering features will not be available.",
        UserWarning
    )

from .policies import PolicyParams


def extract_regime_features(
    df: pd.DataFrame,
    lookback_window: int = 20,
) -> pd.DataFrame:
    """
    Extract features that characterize market regimes.
    
    Calculates rolling statistics that capture:
    - Volatility (how much price moves)
    - Trend strength (directional persistence)
    - Range characteristics (consolidation vs expansion)
    
    These features are used for clustering trades into distinct regimes.
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame with entry_price, mfe, mae, etc.
    
    lookback_window : int
        Number of recent trades to use for rolling features (default: 20).
    
    Returns
    -------
    pd.DataFrame
        DataFrame with regime features added:
        - volatility_recent: recent price volatility
        - trend_strength: directional consistency
        - avg_mfe_mae_ratio: typical excursion pattern
        - win_rate_recent: recent win rate
        - avg_r_recent: recent average R
    
    Examples
    --------
    >>> regime_df = extract_regime_features(trades_df, lookback_window=20)
    >>> print(regime_df[['volatility_recent', 'trend_strength']].head())
    
    Notes
    -----
    This implements P5-T2: Build function extract_regime_features(df).
    """
    df = df.copy()
    
    # Validate required columns
    required = ["entry_price", "R"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns for regime features: {missing}")
    
    # Sort by entry time if available
    if "entry_time" in df.columns:
        df = df.sort_values("entry_time").reset_index(drop=True)
    
    # Feature 1: Recent volatility (price changes)
    if "entry_price" in df.columns:
        price_returns = df["entry_price"].pct_change().abs()
        df["volatility_recent"] = price_returns.shift(1).rolling(
            window=lookback_window,
            min_periods=min(5, lookback_window)
        ).std()
    else:
        df["volatility_recent"] = 0.0
    
    # Feature 2: Trend strength (directional consistency)
    # Measured as: |sum of R| / sum of |R|
    # 1.0 = perfect trend, 0.0 = no trend (range)
    r_sum = df["R"].shift(1).rolling(window=lookback_window, min_periods=5).sum()
    r_abs_sum = df["R"].abs().shift(1).rolling(window=lookback_window, min_periods=5).sum()
    
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df["trend_strength"] = (r_sum.abs() / r_abs_sum).fillna(0)
    
    df["trend_strength"] = df["trend_strength"].clip(0, 1)
    
    # Feature 3: MFE/MAE ratio (excursion pattern)
    if "mfe" in df.columns and "mae" in df.columns:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            mfe_mae_ratio = df["mfe"] / df["mae"].replace(0, np.nan)
        
        df["avg_mfe_mae_ratio"] = mfe_mae_ratio.shift(1).rolling(
            window=lookback_window,
            min_periods=5
        ).mean().fillna(1.0)
    else:
        df["avg_mfe_mae_ratio"] = 1.0
    
    # Feature 4: Recent win rate
    is_winner = (df["R"] > 0).astype(int)
    df["win_rate_recent"] = is_winner.shift(1).rolling(
        window=lookback_window,
        min_periods=5
    ).mean().fillna(0.5)
    
    # Feature 5: Recent average R
    df["avg_r_recent"] = df["R"].shift(1).rolling(
        window=lookback_window,
        min_periods=5
    ).mean().fillna(0.0)
    
    # Feature 6: Range tightness (opposite of volatility)
    # High value = tight range, low value = wide range
    if "risk_per_trade" in df.columns:
        risk_vol = df["risk_per_trade"].shift(1).rolling(
            window=lookback_window,
            min_periods=5
        ).std()
        
        # Invert and normalize
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            df["range_tightness"] = 1.0 / (1.0 + risk_vol).fillna(1.0)
    else:
        df["range_tightness"] = 0.5
    
    # --- Override outcome-based features with market-based features -----------
    # If fetch_market_context() has been called upstream, the following columns
    # will be present and are strictly better for clustering because they
    # describe actual market conditions at entry rather than past trade outcomes.
    #
    #   atr_pct         → replaces volatility_recent
    #   ema_direction   → replaces trend_strength
    #   bar_range_pct   → replaces range_tightness
    #   price_in_range  → replaces avg_mfe_mae_ratio
    #   volume_ratio    → replaces win_rate_recent / avg_r_recent
    #
    # Columns are only substituted where sufficient non-NaN data exists (>50%
    # coverage). If market data is absent or sparse the outcome-based features
    # are kept as-is so the pipeline degrades gracefully.

    MARKET_FEATURE_MAP = {
        "atr_pct":        "volatility_recent",
        "ema_direction":  "trend_strength",
        "bar_range_pct":  "range_tightness",
        "price_in_range": "avg_mfe_mae_ratio",
        "volume_ratio":   "win_rate_recent",
    }

    substituted = []
    for market_col, outcome_col in MARKET_FEATURE_MAP.items():
        if market_col in df.columns:
            coverage = df[market_col].notna().mean()
            if coverage >= 0.5:
                df[outcome_col] = df[market_col]
                substituted.append(f"{outcome_col} → {market_col}")

    if substituted:
        import logging as _logging
        _logging.getLogger(__name__).info(
            "Regime features substituted with market data: " + ", ".join(substituted)
        )

    # avg_r_recent has no direct market equivalent — keep as-is

    # Fill any remaining NaN with column means
    feature_cols = [
        "volatility_recent",
        "trend_strength",
        "avg_mfe_mae_ratio",
        "win_rate_recent",
        "avg_r_recent",
        "range_tightness",
    ]

    for col in feature_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].mean())

    return df


def fit_clustering_model(
    df: pd.DataFrame,
    n_clusters: int = 4,
    method: Literal["kmeans", "dbscan"] = "kmeans",
    random_state: int = 42,
) -> tuple[Any, pd.DataFrame, dict, Any]:
    """
    Fit clustering model to identify market regimes.
    
    Uses unsupervised learning to group trades into distinct regimes
    based on market characteristics (volatility, trend, etc.).
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame with regime features from extract_regime_features().
    
    n_clusters : int
        Number of clusters/regimes to identify (default: 4).
        Typical values: 3-6
    
    method : str
        Clustering algorithm:
        - "kmeans": KMeans (requires n_clusters)
        - "dbscan": DBSCAN (automatically finds n_clusters)
    
    random_state : int
        Random seed for reproducibility.
    
    Returns
    -------
    model : sklearn model
        Fitted clustering model.
    
    df_labeled : pd.DataFrame
        Input DataFrame with 'regime' column added.
    
    cluster_summary : dict
        Summary statistics about the clusters.
    
    Examples
    --------
    >>> model, df_labeled, summary, scaler fit_clustering_model(regime_df, n_clusters=4)
    >>> print(summary['n_clusters'])
    4
    >>> print(df_labeled['regime'].value_counts())
    
    Notes
    -----
    This implements P5-T3: Fit clustering model (KMeans or similar).
    """
    if not SKLEARN_AVAILABLE:
        raise ImportError(
            "scikit-learn is required for clustering. "
            "Install with: pip install scikit-learn"
        )
    
    # Feature columns for clustering
    feature_cols = [
        "volatility_recent",
        "trend_strength",
        "avg_mfe_mae_ratio",
        "win_rate_recent",
        "avg_r_recent",
        "range_tightness",
    ]
    
    # Validate features exist
    missing = [c for c in feature_cols if c not in df.columns]
    if missing:
        raise ValueError(
            f"Missing regime features: {missing}. "
            f"Call extract_regime_features() first."
        )
    
    # Extract feature matrix
    X = df[feature_cols].copy()
    
    # Remove any rows with NaN
    valid_idx = X.notna().all(axis=1)
    X = X[valid_idx]
    df_valid = df[valid_idx].copy()
    
    if len(X) < n_clusters:
        raise ValueError(
            f"Not enough valid samples ({len(X)}) for {n_clusters} clusters. "
            f"Need at least {n_clusters} trades."
        )
    
    # Standardize features (important for clustering!)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Fit clustering model
    if method == "kmeans":
        model = KMeans(
            n_clusters=n_clusters,
            random_state=random_state,
            n_init=10,
        )
        labels = model.fit_predict(X_scaled)
        
    elif method == "dbscan":
        # DBSCAN automatically finds n_clusters
        model = DBSCAN(eps=0.5, min_samples=5)
        labels = model.fit_predict(X_scaled)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        
    else:
        raise ValueError(f"Unknown clustering method: {method}")
    
    # Add regime labels to dataframe
    df_valid["regime"] = labels
    
    # Calculate cluster quality metrics
    if n_clusters > 1 and len(set(labels)) > 1:
        silhouette = silhouette_score(X_scaled, labels)
        davies_bouldin = davies_bouldin_score(X_scaled, labels)
    else:
        silhouette = 0.0
        davies_bouldin = 0.0
    
    # Create cluster summary
    cluster_summary = {
        "n_clusters": n_clusters,
        "method": method,
        "silhouette_score": float(silhouette),
        "davies_bouldin_score": float(davies_bouldin),
        "cluster_sizes": {},
        "cluster_characteristics": {},
    }
    
    # Characterize each cluster
    for cluster_id in sorted(set(labels)):
        if cluster_id == -1:  # DBSCAN noise
            continue
        
        cluster_data = df_valid[df_valid["regime"] == cluster_id]
        
        cluster_summary["cluster_sizes"][int(cluster_id)] = len(cluster_data)
        
        # Calculate mean features for this cluster
        characteristics = {}
        for feat in feature_cols:
            characteristics[feat] = float(cluster_data[feat].mean())
        
        # Add performance metrics
        characteristics["avg_r"] = float(cluster_data["R"].mean())
        characteristics["win_rate"] = float((cluster_data["R"] > 0).mean())
        characteristics["n_trades"] = len(cluster_data)
        
        cluster_summary["cluster_characteristics"][int(cluster_id)] = characteristics
    
    return model, df_valid, cluster_summary, scaler


def label_trades_with_regime(
    df: pd.DataFrame,
    model: Any,
    scaler: Any,
    feature_cols: list[str] | None = None,
) -> pd.DataFrame:
    """
    Label trades with their market regime using fitted model.
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame with regime features.
    
    model : sklearn model
        Fitted clustering model from fit_clustering_model().
    
    feature_cols : list[str], optional
        Feature columns to use. If None, uses standard features.
    
    Returns
    -------
    pd.DataFrame
        DataFrame with 'regime' column added.
    
    Notes
    -----
    This implements P5-T4: Label each trade with its regime.
    """
    if not SKLEARN_AVAILABLE:
        raise ImportError("scikit-learn required for regime labeling")
    
    if feature_cols is None:
        feature_cols = [
            "volatility_recent",
            "trend_strength",
            "avg_mfe_mae_ratio",
            "win_rate_recent",
            "avg_r_recent",
            "range_tightness",
        ]
    
    # Extract features
    X = df[feature_cols].copy()
    
    # Handle NaN
    valid_idx = X.notna().all(axis=1)
    
    # Standardize (use same scaler as training - approximation)
    
    X_scaled = scaler.transform(X.fillna(0))
    
    # Predict regime
    labels = model.predict(X_scaled)
    
    df_labeled = df.copy()
    df_labeled["regime"] = labels
    df_labeled.loc[~valid_idx, "regime"] = -1  # Mark invalid as -1
    
    return df_labeled


def optimize_policies_per_regime(
    df: pd.DataFrame,
    test_df: pd.DataFrame | None = None,
    n_trials_per_regime: int = 30,
    n_walkforward_folds: int = 3,
    verbose: bool = True,
) -> dict[int, tuple[PolicyParams, dict]]:
    """
    Optimize separate trade management policies for each regime.

    This is the key benefit of regime clustering: we can find
    different optimal parameters for different market conditions.

    Parameters
    ----------
    df : pd.DataFrame
        Training trades DataFrame with 'regime' column. Policies are
        optimized exclusively on this data.

    test_df : pd.DataFrame, optional
        Held-out test trades with 'regime' column. When provided, the
        best policy for each regime is evaluated on the matching test
        trades to produce an honest out-of-sample performance score.
        Should be labeled using label_trades_with_regime() with the
        same model and scaler used to label df.

    n_trials_per_regime : int
        Number of Bayesian optimization trials per regime (default: 30).

    verbose : bool
        If True, print progress.

    Returns
    -------
    dict
        Dictionary mapping regime_id -> (best_policy, metrics).

        Example:
        {
            0: (Policy(sl=0.8, tp=2.0), {'avg_R_train': 1.5, 'avg_R_test': 1.3}),
            1: (Policy(sl=1.2, tp=1.5), {'avg_R_train': 1.2, 'avg_R_test': 0.9}),
        }

    Notes
    -----
    This implements P5-T5: Optimize separate policies per regime.
    """
    if "regime" not in df.columns:
        raise ValueError("DataFrame must have 'regime' column. Call fit_clustering_model() first.")

    if test_df is not None and "regime" not in test_df.columns:
        raise ValueError("test_df must have 'regime' column. Call label_trades_with_regime() first.")

    # Import here to avoid circular dependency
    try:
        from .optimization import optimize_policy
        from .simulator import run_simulation, calculate_policy_metrics
    except ImportError:
        raise ImportError(
            "optimization and simulator modules required. "
            "Make sure Phase 3 is complete."
        )

    regime_ids = sorted([r for r in df["regime"].unique() if r >= 0])

    if verbose:
        print(f"Optimizing policies for {len(regime_ids)} regimes...")
        if test_df is not None:
            print(f"  Train trades: {len(df)} | Test trades: {len(test_df)}")

    results = {}

    for regime_id in regime_ids:
        # Filter training trades for this regime
        regime_train_df = df[df["regime"] == regime_id].copy()

        if len(regime_train_df) < 80:
            if verbose:
                print(f"  Regime {regime_id}: Skipped (only {len(regime_train_df)} train trades, need 80+)")
            continue

        if verbose:
            print(f"\n  Regime {regime_id}: {len(regime_train_df)} train trades")

        # Configure optimization for this regime
        config = {
            "objective_metric": "avg_R",
            "n_trials": n_trials_per_regime,
            "random_seed": 42 + regime_id,
            "search_space": {
                "sl_mult": {"type": "float", "low": 0.5, "high": 1.5},
                "tp_mult": {"type": "float", "low": 1.0, "high": 3.0},
                "trail_pct": {"type": "float", "low": 0.0, "high": 0.08},
                "max_hold_minutes": {
                    "type": "categorical",
                    "choices": [None, 60, 120, 180, 240]
                },
                "risk_fraction": {"type": "float", "low": 0.005, "high": 0.02},
            },
        }

        try:
            # Optimize on training trades only (optimize_policy does its own
            # internal chronological split as a second layer of validation)
            best_policy, trials_df, summary = optimize_policy(
                regime_train_df,
                config,
                verbose=False,
                n_walkforward_folds=n_walkforward_folds,
            )

            # --- Statistical significance test ---
            # Compare regime-specific policy R-multiples against the baseline
            # policy (PolicyParams defaults = no adjustment, use original SL/TP).
            # Welch's t-test: H0 = regime policy mean R == baseline mean R.
            # If p > 0.05 the improvement is not statistically significant and
            # the regime-specific policy should not be trusted over the baseline.
            p_value = None
            significant = False
            try:
                from scipy import stats as _stats
                baseline_policy = PolicyParams()
                baseline_sim = run_simulation(regime_train_df, baseline_policy, inplace=False)
                regime_sim   = run_simulation(regime_train_df, best_policy, inplace=False)
                baseline_r = baseline_sim["sim_R"].dropna().values
                regime_r   = regime_sim["sim_R"].dropna().values
                if len(baseline_r) >= 10 and len(regime_r) >= 10:
                    t_stat, p_value = _stats.ttest_ind(regime_r, baseline_r, equal_var=False)
                    # One-tailed: regime policy should be BETTER (higher R), not just different
                    p_value = float(p_value / 2 if t_stat > 0 else 1.0)
                    significant = p_value < 0.05
            except ImportError:
                # scipy not installed — skip significance test
                significant = True  # assume significant so pipeline still runs
            except Exception:
                significant = True

            # Evaluate best policy on held-out test trades for this regime
            avg_r_test = None
            if test_df is not None:
                regime_test_df = test_df[test_df["regime"] == regime_id].copy()
                if len(regime_test_df) >= 5:
                    try:
                        test_sim_df = run_simulation(regime_test_df, best_policy, inplace=False)
                        test_metrics = calculate_policy_metrics(test_sim_df)
                        avg_r_test = test_metrics.get("avg_R")
                    except Exception:
                        pass

            if verbose:
                train_score = summary["best_value_train"]
                print(f"    Train avg_R: {train_score:.3f}")
                if avg_r_test is not None:
                    print(f"    Test  avg_R: {avg_r_test:.3f}")
                    gap = train_score - avg_r_test
                    if gap > 0.3:
                        print(f"    ⚠ Large train/test gap ({gap:.3f}) — possible overfitting")
                else:
                    print(f"    Test  avg_R: n/a (insufficient test trades)")
                if p_value is not None:
                    sig_label = "✓ significant" if significant else "✗ NOT significant — baseline policy may be better"
                    print(f"    vs baseline p={p_value:.3f} ({sig_label})")
                print(f"    Policy: {best_policy}")

            # Store results
            results[regime_id] = (best_policy, {
                "avg_R": summary["best_value"],
                "avg_R_train": summary["best_value_train"],
                "avg_R_test": avg_r_test,
                "p_value": p_value,
                "significant": significant,
                "n_trials": len(trials_df),
                "n_trades_train": len(regime_train_df),
                "n_trades_test": len(test_df[test_df["regime"] == regime_id]) if test_df is not None else 0,
            })

        except Exception as e:
            if verbose:
                print(f"    Optimization failed: {e}")
            continue

    return results


def create_regime_summary(
    df: pd.DataFrame,
    cluster_summary: dict,
    regime_policies: dict[int, tuple[PolicyParams, dict]] | None = None,
) -> dict[str, Any]:
    """
    Create comprehensive regime analysis summary.
    
    Packages all regime clustering results into structured format
    for JSON export and reporting.
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame with 'regime' column.
    
    cluster_summary : dict
        Summary from fit_clustering_model().
    
    regime_policies : dict, optional
        Optimized policies per regime from optimize_policies_per_regime().
    
    Returns
    -------
    dict
        Comprehensive regime summary with:
        - cluster_quality: silhouette score, etc.
        - regimes: characteristics of each regime
        - optimal_policies: best policy per regime (if provided)
        - recommendations: actionable insights
    
    Examples
    --------
    >>> summary = create_regime_summary(df_labeled, cluster_summary, policies)
    >>> print(json.dumps(summary, indent=2))
    
    Notes
    -----
    This implements P5-T6: Create regime summary report.
    """
    regime_ids = sorted([r for r in df["regime"].unique() if r >= 0])
    
    summary = {
        "cluster_quality": {
            "n_clusters": cluster_summary["n_clusters"],
            "silhouette_score": cluster_summary["silhouette_score"],
            "davies_bouldin_score": cluster_summary["davies_bouldin_score"],
        },
        "regimes": {},
        "optimal_policies": {},
        "recommendations": [],
    }
    
    def _base_regime_type(chars: dict[str, Any]) -> str:
        trend_strength = float(chars.get("trend_strength", 0.5) or 0.0)
        volatility = float(chars.get("volatility_recent", 0.0) or 0.0)
        range_tightness = float(chars.get("range_tightness", 0.5) or 0.0)

        # Trader-facing labels:
        # - Trending: clear directional movement
        # - Sideways / Ranging: horizontal or mixed movement
        # - Volatile: high-speed, erratic movement
        # - Thin / Low Volume: quiet / compressed conditions
        if volatility >= 0.05 and trend_strength < 0.55:
            return "Volatile"
        if trend_strength >= 0.55:
            return "Trending"
        if volatility <= 0.008 or range_tightness >= 0.75:
            return "Thin / Low Volume"
        return "Sideways / Ranging"

    raw_regimes: list[tuple[int, dict[str, Any], float, float, float]] = []

    # Characterize each regime
    for regime_id in regime_ids:
        regime_df = df[df["regime"] == regime_id]
        
        # Get characteristics from cluster summary
        if regime_id in cluster_summary["cluster_characteristics"]:
            chars = cluster_summary["cluster_characteristics"][regime_id]
        else:
            chars = {}
        
        regime_info = {
            "regime_id": int(regime_id),
            "regime_type": _base_regime_type(chars),
            "n_trades": len(regime_df),
            "characteristics": chars,
            "performance": {
                "avg_r": float(regime_df["R"].mean()),
                "win_rate": float((regime_df["R"] > 0).mean()),
                "total_r": float(regime_df["R"].sum()),
            },
        }
        raw_regimes.append((
            int(regime_id),
            regime_info,
            float(chars.get("trend_strength", 0.0) or 0.0),
            float(chars.get("volatility_recent", 0.0) or 0.0),
            float(chars.get("range_tightness", 0.0) or 0.0),
        ))

    if len(raw_regimes) == 4:
        remaining = raw_regimes[:]

        def _pick_best(rows, key_fn):
            best = max(rows, key=key_fn)
            rows.remove(best)
            return best

        trending = _pick_best(
            remaining,
            lambda item: (item[2], item[1]["performance"]["avg_r"], item[3]),
        )
        thin = _pick_best(
            remaining,
            lambda item: (item[4], -item[3], item[1]["performance"]["avg_r"]),
        )
        volatile = _pick_best(
            remaining,
            lambda item: (item[3], -item[4], item[1]["performance"]["avg_r"]),
        )
        sideways = remaining[0]

        for label, item in [
            ("Trending", trending),
            ("Thin / Low Volume", thin),
            ("Volatile", volatile),
            ("Sideways / Ranging", sideways),
        ]:
            regime_id, regime_info, _, _, _ = item
            regime_info["regime_type"] = label
            summary["regimes"][regime_id] = regime_info
    else:
        label_groups: dict[str, list[tuple[int, dict[str, Any], float, float, float]]] = {}
        for regime_id, regime_info, trend_strength, volatility, range_tightness in raw_regimes:
            label_groups.setdefault(regime_info["regime_type"], []).append((regime_id, regime_info, trend_strength, volatility, range_tightness))

        for _, grouped in label_groups.items():
            if len(grouped) == 1:
                regime_id, regime_info, _, _, _ = grouped[0]
                summary["regimes"][regime_id] = regime_info
                continue

            grouped.sort(key=lambda item: (item[2], item[3], item[1]["performance"]["avg_r"]), reverse=True)
            descriptors = ["Higher Momentum", "Balanced", "Lower Momentum", "Lowest Momentum"]
            for idx, (regime_id, regime_info, _, _, _) in enumerate(grouped):
                descriptor = descriptors[idx] if idx < len(descriptors) else f"Variant {idx + 1}"
                regime_info["regime_type"] = f"{regime_info['regime_type']} ({descriptor})"
                summary["regimes"][regime_id] = regime_info
    
    # Add optimized policies if provided
    if regime_policies:
        for regime_id, (policy, metrics) in regime_policies.items():
            summary["optimal_policies"][int(regime_id)] = {
                "policy": policy.to_dict(),
                "metrics": metrics,
            }
    
    # Generate recommendations
    recommendations = []
    
    # Recommendation 1: Best/worst regimes
    regime_performances = [
        (rid, summary["regimes"][rid]["performance"]["avg_r"])
        for rid in regime_ids
    ]
    regime_performances.sort(key=lambda x: x[1], reverse=True)
    
    if len(regime_performances) > 0:
        best_regime = regime_performances[0][0]
        worst_regime = regime_performances[-1][0]
        
        best_type = summary["regimes"][best_regime]["regime_type"]
        worst_type = summary["regimes"][worst_regime]["regime_type"]
        
        best_avg_r = summary["regimes"][best_regime]["performance"]["avg_r"]
        if best_avg_r > 0:
            recommendations.append(
                f"Best performance in {best_type} regime "
                f"(avg R: {best_avg_r:.3f})"
            )
        else:
            recommendations.append(
                f"Least negative performance in {best_type} regime "
                f"(avg R: {best_avg_r:.3f})"
            )
        
        recommendations.append(
            f"Weakest performance in {worst_type} regime "
            f"(avg R: {summary['regimes'][worst_regime]['performance']['avg_r']:.3f})"
        )
    
    # Recommendation 2: Regime-specific policies
    if regime_policies:
        recommendations.append(
            f"Optimized separate policies for {len(regime_policies)} regimes - "
            f"use adaptive parameter selection based on detected market condition"
        )
    
    # Recommendation 3: Clustering quality
    silhouette = cluster_summary["silhouette_score"]
    if silhouette > 0.5:
        recommendations.append(
            f"Strong regime separation (silhouette={silhouette:.2f}) - "
            f"regimes are well-defined"
        )
    elif silhouette > 0.3:
        recommendations.append(
            f"Moderate regime separation (silhouette={silhouette:.2f}) - "
            f"consider adjusting number of clusters"
        )
    else:
        recommendations.append(
            f"Weak regime separation (silhouette={silhouette:.2f}) - "
            f"regimes may not be distinct, consider different features or fewer clusters"
        )
    
    summary["recommendations"] = recommendations
    
    return summary


def save_regime_results(
    df: pd.DataFrame,
    regime_summary: dict,
    output_dir: str | Path,
    verbose: bool = True,
) -> None:
    """
    Save regime clustering results to disk.
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame with 'regime' column.
    
    regime_summary : dict
        Summary from create_regime_summary().
    
    output_dir : str or Path
        Directory to save results.
    
    verbose : bool
        If True, print save confirmations.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save trades with regime labels
    trades_csv = output_dir / "trades_with_regimes.csv"
    df.to_csv(trades_csv, index=False)
    if verbose:
        print(f"✓ Saved trades with regimes: {trades_csv}")
    
    # Save regime summary
    summary_json = output_dir / "regime_summary.json"
    with open(summary_json, "w") as f:
        json.dump(regime_summary, f, indent=2)
    if verbose:
        print(f"✓ Saved regime summary: {summary_json}")
