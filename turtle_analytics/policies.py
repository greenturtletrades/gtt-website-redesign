"""
Trade management policy definitions for Turtle Analytics.

This module defines PolicyParams, which represents a set of trade management
rules that can be applied during simulation. The simulator uses these parameters
to create counterfactual scenarios - answering "what if I had managed trades
with different rules?"
"""


from __future__ import annotations 
from dataclasses import dataclass, field, asdict 
from typing import Any, Dict 


@dataclass(frozen=True)
class PolicyParams:
    """
    Trade management policy parameters.
    
    This dataclass encapsulates all the "knobs" you can turn when simulating
    alternative trade management strategies:
    
    - Stop-loss and take-profit adjustments (tighter or wider)
    - Maximum hold time (time-based exits)
    - Trailing stops (dynamic stop adjustments)
    - Position sizing (risk per trade)
    
    Attributes
    ----------
    sl_mult : float
        Stop-loss distance multiplier.
        - 1.0 = use original stop-loss distance
        - 0.5 = tighter stop (50% of original distance)
        - 2.0 = wider stop (200% of original distance)
        Must be positive.
        
    tp_mult : float
        Take-profit distance multiplier (same logic as sl_mult).
        Must be positive.
        
    max_hold_minutes : int | None
        Maximum time to hold a trade before forcing exit.
        - None = no time-based exit
        - 60 = force exit after 1 hour
        - 1440 = force exit after 24 hours
        If set, must be positive.
        
    trail_pct : float
        Trailing stop percentage from maximum favorable excursion (MFE).
        - 0.0 = no trailing stop
        - 0.02 = 2% trailing stop (exit if price pulls back 2% from peak)
        - 0.05 = 5% trailing stop
        Must be non-negative. Typically between 0.0 and 0.2.
        
    risk_fraction : float
        Fraction of account to risk per trade (for position sizing).
        - 0.01 = risk 1% of capital per trade
        - 0.02 = risk 2% of capital per trade
        Must be positive and typically < 0.1 (risky to go higher).
        This is used for portfolio-level simulations and risk calculations.
    
    Examples
    --------
    Create a baseline policy (no adjustments):
    >>> baseline = PolicyParams()
    
    Create a conservative policy (tighter stops, shorter holds):
    >>> conservative = PolicyParams(sl_mult=0.5, tp_mult=1.5, max_hold_minutes=120)
    
    Create an aggressive policy (wider stops, trailing):
    >>> aggressive = PolicyParams(sl_mult=2.0, tp_mult=3.0, trail_pct=0.03)
    """
    
    
    sl_mult: float = 1.0
    tp_mult: float = 1.0
    max_hold_minutes: int | None = None
    trail_pct: float = 0.0
    risk_fraction: float = 0.01
    
    def __post_init__(self) -> None:
        """Validate parameters after initialization."""
        # Validate sl_mult
        if self.sl_mult <= 0:
            raise ValueError(f"sl_mult must be positive, got {self.sl_mult}")
        
        # Validate tp_mult
        if self.tp_mult <= 0:
            raise ValueError(f"tp_mult must be positive, got {self.tp_mult}")
        
        # Validate max_hold_minutes
        if self.max_hold_minutes is not None and self.max_hold_minutes <= 0:
            raise ValueError(
                f"max_hold_minutes must be positive or None, got {self.max_hold_minutes}"
            )
        
        # Validate trail_pct
        if self.trail_pct < 0:
            raise ValueError(f"trail_pct must be non-negative, got {self.trail_pct}")
        
        if self.trail_pct > 1.0:
            raise ValueError(
                f"trail_pct should typically be < 1.0 (100%), got {self.trail_pct}"
            )
        
        # Validate risk_fraction
        if self.risk_fraction <= 0:
            raise ValueError(f"risk_fraction must be positive, got {self.risk_fraction}")
        
        # Warning at 20 %, can be changed after 
        if self.risk_fraction > 0.2:
            raise ValueError(
                f"risk_fraction > 0.2 (20%) is extremely risky, got {self.risk_fraction}"
            )
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert policy parameters to a dictionary.
        
        Returns
        -------
        dict
            Dictionary representation of the policy parameters.
        """
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> PolicyParams:
        """
        Create PolicyParams from a dictionary.
        
        Parameters
        ----------
        data : dict
            Dictionary with policy parameter keys and values.
        
        Returns
        -------
        PolicyParams
            New PolicyParams instance.
        """
        return cls(**data)
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        parts = [
            f"sl={self.sl_mult:.2f}x",
            f"tp={self.tp_mult:.2f}x",
        ]
        
        if self.max_hold_minutes is not None:
            parts.append(f"hold≤{self.max_hold_minutes}min")
        
        if self.trail_pct > 0:
            parts.append(f"trail={self.trail_pct:.1%}")
        
        parts.append(f"risk={self.risk_fraction:.1%}")
        
        return f"Policy({', '.join(parts)})"


# --- Preset policies ---------------------------------------

# Baseline: no adjustments
BASELINE_POLICY = PolicyParams()

# Conservative: tighter stops, shorter holds
CONSERVATIVE_POLICY = PolicyParams(
    sl_mult=0.75,
    tp_mult=1.5,
    max_hold_minutes=240,  # 4 hours
    trail_pct=0.015,  # 1.5% trailing
    risk_fraction=0.01,
)

# Aggressive: wider stops, longer holds
AGGRESSIVE_POLICY = PolicyParams(
    sl_mult=1.5,
    tp_mult=2.5,
    max_hold_minutes=None,  # no time limit
    trail_pct=0.03,  # 3% trailing
    risk_fraction=0.02,
)

# Quick scalp: very tight, very fast
SCALP_POLICY = PolicyParams(
    sl_mult=0.5,
    tp_mult=0.75,
    max_hold_minutes=30,
    trail_pct=0.005,  # 0.5% trailing
    risk_fraction=0.01,
)

# All preset policies for easy access
PRESET_POLICIES = {
    "baseline": BASELINE_POLICY,
    "conservative": CONSERVATIVE_POLICY,
    "aggressive": AGGRESSIVE_POLICY,
    "scalp": SCALP_POLICY,
}