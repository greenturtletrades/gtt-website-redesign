import warnings

import numpy as np
import pandas as pd

from turtle_analytics.policies import PolicyParams
from turtle_analytics.simulator import run_simulation


def _base_trade_frame() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "entry_price": 100.0,
                "exit_price": 104.0,
                "stop_loss": 99.0,
                "take_profit": 110.0,
                "side": "LONG",
                "risk_per_trade": 1.0,
                "mfe": 5.0,
                "mae": 4.2,
                "entry_time": "2026-01-01 10:00:00",
                "exit_time": "2026-01-01 12:00:00",
            },
            {
                "entry_price": 100.0,
                "exit_price": 96.0,
                "stop_loss": 101.0,
                "take_profit": 90.0,
                "side": "SHORT",
                "risk_per_trade": 1.0,
                "mfe": 5.0,
                "mae": 4.2,
                "entry_time": "2026-01-01 10:00:00",
                "exit_time": "2026-01-01 12:00:00",
            },
        ]
    )


def test_trailing_stop_uses_risk_units_for_long_and_short():
    trades = _base_trade_frame()
    policy = PolicyParams(sl_mult=1.0, tp_mult=10.0, trail_pct=0.5, max_hold_minutes=None)

    simulated = run_simulation(trades, policy, inplace=False)

    # Long: peak=105, risk=1, trail=105 - 0.5 = 104.5
    assert simulated.loc[0, "sim_exit_reason"] == "TRAIL_HIT"
    assert np.isclose(simulated.loc[0, "sim_trail_stop"], 104.5)
    assert np.isclose(simulated.loc[0, "sim_exit_price"], 104.5)
    assert np.isclose(simulated.loc[0, "sim_R"], 4.5)

    # Short: peak=95, risk=1, trail=95 + 0.5 = 95.5
    assert simulated.loc[1, "sim_exit_reason"] == "TRAIL_HIT"
    assert np.isclose(simulated.loc[1, "sim_trail_stop"], 95.5)
    assert np.isclose(simulated.loc[1, "sim_exit_price"], 95.5)
    assert np.isclose(simulated.loc[1, "sim_R"], 4.5)


def test_zero_simulated_risk_emits_warning_and_nan_r():
    trades = pd.DataFrame(
        [
            {
                "entry_price": 100.0,
                "exit_price": 101.0,
                "stop_loss": 100.0,
                "take_profit": 102.0,
                "side": "LONG",
                "risk_per_trade": 0.0,
                "mfe": 1.0,
                "mae": 0.5,
            }
        ]
    )
    policy = PolicyParams(sl_mult=1.0, tp_mult=1.0, trail_pct=0.0, max_hold_minutes=None)

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        simulated = run_simulation(trades, policy, inplace=False)

    assert any("zero simulated risk" in str(w.message) for w in caught)
    assert np.isnan(simulated.loc[0, "sim_R"])
