# Turtle Analytics – Trading Improvement Analyst

Turtle Analytics is a per-trader machine learning system that analyzes a trader’s own historical trades and generates data-driven performance insights without doing any forecasting or using cross-trader data.

Instead of predicting the market, it:

- Replays each historical trade under alternative trade management parameters (stop loss / take profit distances, hold times, trailing stops, risk per trade).
- Uses statistical analysis + Bayesian optimization to find parameter settings that historically maximise the trader’s *average R*.
- Uses unsupervised clustering to detect different market regimes (e.g. trend, chop, high volatility) and finds which management styles work best in each.
- Uses survival analysis to understand how long trades should be held before expected edge decays.

All insights are purely from that trader’s own history:  
no forecasting, no external labels, no cross-trader pooling.

---

## Project Layout


turtle-analytics/
├── README.md
├── .gitignore
├── requirements.txt
├── pyproject.toml
├── configs/
│   └── default.yaml
├── turtle_analytics/
│       ├── __init__.py
│       ├── settings.py
│       ├── io.py
│       ├── features.py
│       ├── policies.py
│       ├── simulator.py
│       ├── optimization.py
│       ├── survival.py
│       ├── clustering.py
│       ├── reporting.py
│       └── utils.py
├── scripts/
│   └── run_pipeline.py
├── data/
│   ├── raw/
│   └── processed/
├── artifacts/
├── tests/
│   ├── __init__.py
│   ├── test_simulator.py
│   ├── test_optimization.py
│   └── test_clustering.py
└── notebooks/
    └── exploration.ipynb



to run: 
cd/location 
python scripts/run_pipeline.py data/raw/trades.csv 

