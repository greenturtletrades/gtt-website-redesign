# Analytics Package

This is the core Python analysis package used by both the CLI pipeline and the FastAPI bridge.

- `io.py` validates and normalizes trade input
- `features.py` builds derived trade features
- `simulator.py` runs counterfactual policy simulations
- `optimization.py` searches for better parameter sets
- `survival.py` analyzes hold-time behavior
- `clustering.py` detects market regimes
- `reporting.py` assembles output summaries
- `metatrader.py` loads trades from MetaTrader when available
