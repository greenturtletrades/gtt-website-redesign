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
        df["volatility_recent"] = price_returns.rolling(
            window=lookback_window,
            min_periods=min(5, lookback_window)
        ).std()
    else:
        df["volatility_recent"] = 0.0
    
    # Feature 2: Trend strength (directional consistency)
    # Measured as: |sum of R| / sum of |R|
    # 1.0 = perfect trend, 0.0 = no trend (range)
    r_sum = df["R"].rolling(window=lookback_window, min_periods=5).sum()
    r_abs_sum = df["R"].abs().rolling(window=lookback_window, min_periods=5).sum()
    
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        df["trend_strength"] = (r_sum.abs() / r_abs_sum).fillna(0)
    
    df["trend_strength"] = df["trend_strength"].clip(0, 1)
    
    # Feature 3: MFE/MAE ratio (excursion pattern)
    if "mfe" in df.columns and "mae" in df.columns:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            mfe_mae_ratio = df["mfe"] / df["mae"].replace(0, np.nan)
        
        df["avg_mfe_mae_ratio"] = mfe_mae_ratio.rolling(
            window=lookback_window,
            min_periods=5
        ).mean().fillna(1.0)
    else:
        df["avg_mfe_mae_ratio"] = 1.0
    
    # Feature 4: Recent win rate
    is_winner = (df["R"] > 0).astype(int)
    df["win_rate_recent"] = is_winner.rolling(
        window=lookback_window,
        min_periods=5
    ).mean().fillna(0.5)
    
    # Feature 5: Recent average R
    df["avg_r_recent"] = df["R"].rolling(
        window=lookback_window,
        min_periods=5
    ).mean().fillna(0.0)
    
    # Feature 6: Range tightness (opposite of volatility)
    # High value = tight range, low value = wide range
    if "risk_per_trade" in df.columns:
        risk_vol = df["risk_per_trade"].rolling(
            window=lookback_window,
            min_periods=5
        ).std()
        
        # Invert and normalize
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            df["range_tightness"] = 1.0 / (1.0 + risk_vol).fillna(1.0)
    else:
        df["range_tightness"] = 0.5
    
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
) -> tuple[Any, pd.DataFrame, dict]:
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
    >>> model, df_labeled, summary = fit_clustering_model(regime_df, n_clusters=4)
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
    
    return model, df_valid, cluster_summary


def label_trades_with_regime(
    df: pd.DataFrame,
    model: Any,
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
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X.fillna(0))
    
    # Predict regime
    labels = model.predict(X_scaled)
    
    df_labeled = df.copy()
    df_labeled["regime"] = labels
    df_labeled.loc[~valid_idx, "regime"] = -1  # Mark invalid as -1
    
    return df_labeled


def optimize_policies_per_regime(
    df: pd.DataFrame,
    n_trials_per_regime: int = 30,
    verbose: bool = True,
) -> dict[int, tuple[PolicyParams, dict]]:
    """
    Optimize separate trade management policies for each regime.
    
    This is the key benefit of regime clustering: we can find
    different optimal parameters for different market conditions.
    
    Parameters
    ----------
    df : pd.DataFrame
        Trades DataFrame with 'regime' column.
    
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
            0: (Policy(sl=0.8, tp=2.0), {'avg_R': 1.5, 'winrate': 0.65}),
            1: (Policy(sl=1.2, tp=1.5), {'avg_R': 1.2, 'winrate': 0.58}),
        }
    
    Notes
    -----
    This implements P5-T5: Optimize separate policies per regime.
    """
    if "regime" not in df.columns:
        raise ValueError("DataFrame must have 'regime' column. Call fit_clustering_model() first.")
    
    # Import here to avoid circular dependency
    try:
        from .optimization import optimize_policy
        from .simulator import calculate_policy_metrics
    except ImportError:
        raise ImportError(
            "optimization and simulator modules required. "
            "Make sure Phase 3 is complete."
        )
    
    regime_ids = sorted([r for r in df["regime"].unique() if r >= 0])
    
    if verbose:
        print(f"Optimizing policies for {len(regime_ids)} regimes...")
    
    results = {}
    
    for regime_id in regime_ids:
        # Filter trades for this regime
        regime_df = df[df["regime"] == regime_id].copy()
        
        if len(regime_df) < 20:
            if verbose:
                print(f"  Regime {regime_id}: Skipped (only {len(regime_df)} trades, need 20+)")
            continue
        
        if verbose:
            print(f"\n  Regime {regime_id}: {len(regime_df)} trades")
        
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
            # Run optimization for this regime
            best_policy, trials_df, summary = optimize_policy(
                regime_df,
                config,
                verbose=False,  # Suppress per-trial output
            )
            
            if verbose:
                print(f"    Best avg_R: {summary['best_value']:.3f}")
                print(f"    Policy: {best_policy}")
            
            # Store results
            results[regime_id] = (best_policy, {
                "avg_R": summary["best_value"],
                "n_trials": len(trials_df),
                "n_trades": len(regime_df),
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

    raw_regimes: list[tuple[int, dict[str, Any], float, float]] = []

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
        ))

    label_groups: dict[str, list[tuple[int, dict[str, Any], float, float]]] = {}
    for regime_id, regime_info, trend_strength, volatility in raw_regimes:
        label_groups.setdefault(regime_info["regime_type"], []).append((regime_id, regime_info, trend_strength, volatility))

    for _, grouped in label_groups.items():
        if len(grouped) == 1:
            regime_id, regime_info, _, _ = grouped[0]
            summary["regimes"][regime_id] = regime_info
            continue

        grouped.sort(key=lambda item: (item[2], item[3], item[1]["performance"]["avg_r"]), reverse=True)
        for regime_id, regime_info, trend_strength, volatility in grouped:
            if regime_info["regime_type"] == "Trending":
                descriptor = "Higher Momentum" if trend_strength >= 0.75 else "Moderate Momentum" if trend_strength >= 0.6 else "Emerging Trend"
            elif regime_info["regime_type"] == "Sideways / Ranging":
                descriptor = "Higher Volatility" if volatility >= 0.02 else "Balanced" if volatility >= 0.008 else "Tight Range"
            elif regime_info["regime_type"] == "Volatile":
                descriptor = "Higher Momentum" if trend_strength >= 0.35 else "Erratic Swings"
            else:
                descriptor = "Compressed Range" if volatility <= 0.004 else "Quiet Flow"

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
