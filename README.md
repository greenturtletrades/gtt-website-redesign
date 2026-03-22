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

## Installation

```bash
# Basic installation
pip install -r requirements.txt

# For MetaTrader 5 integration (Windows only)
pip install MetaTrader5

# For all optional features
pip install optuna pyyaml lifelines scikit-learn
```

---

## Data Sources

Turtle Analytics supports two data sources:

### 1. CSV Files (Default)
Load trades from a CSV file with the following schema:

**Required columns:**
- `entry_time` (datetime) - When the trade was opened
- `exit_time` (datetime) - When the trade was closed
- `side` (string) - "LONG" or "SHORT"
- `entry_price` (float) - Entry price
- `exit_price` (float) - Exit price
- `stop_loss` (float) - Stop loss price level
- `take_profit` (float) - Take profit price level

**Optional columns:**
- `mfe` (float) - Maximum Favorable Excursion (price units)
- `mae` (float) - Maximum Adverse Excursion (price units)
- `session` (string) - Trading session (e.g., "london", "ny", "asian")
- `symbol` (string) - Trading symbol (e.g., "EURUSD")
- `spread` (float) - Spread at entry
- `volatility` (float) - Volatility measure

### 2. MetaTrader 5 (Live Connection)
Load trades directly from MetaTrader 5 terminal via the MT5 Python API.

**Requirements:**
- Windows OS (MetaTrader 5 limitation)
- MetaTrader 5 terminal installed and running
- `MetaTrader5` Python library installed

**Setup:**
```bash
pip install MetaTrader5
```

**Configuration:**
Edit `configs/default.yaml` to set your MT5 credentials:
```yaml
metatrader:
  login: 12345678  # Your MT5 account number
  password: "yourpassword"  # Your MT5 password
  server: "YourBroker-Demo"  # Broker server name
  days_history: 90  # Number of days to fetch
  symbol: null  # Filter by symbol (e.g., "EURUSD") or null for all
```

**Security Note:** For production use, store credentials in environment variables:
```bash
export MT5_LOGIN=12345678
export MT5_PASSWORD=yourpassword
export MT5_SERVER=YourBroker-Live
```

---

## Usage

### Option 1: Load from CSV File

```bash
python scripts/run_pipeline.py data/raw/trades.csv \
    --run-counterfactuals \
    --run-optimization \
    --run-survival \
    --run-clustering --n-clusters 4
```

### Option 2: Load from MetaTrader 5

```bash
# Using current logged-in MT5 account (simplest)
python scripts/run_pipeline.py \
    --source mt5 \
    --mt5-days 90 \
    --run-counterfactuals \
    --run-optimization

# Using specific MT5 account credentials
python scripts/run_pipeline.py \
    --source mt5 \
    --mt5-login 12345678 \
    --mt5-password "yourpassword" \
    --mt5-server "Broker-Demo" \
    --mt5-days 90 \
    --mt5-symbol "EURUSD" \
    --run-counterfactuals

# With all analysis phases
python scripts/run_pipeline.py \
    --source mt5 \
    --mt5-days 180 \
    --run-counterfactuals \
    --run-optimization \
    --run-survival \
    --run-clustering --n-clusters 4
```

### MT5 Command Line Options

| Flag | Description | Default |
|------|-------------|---------|
| `--source mt5` | Use MetaTrader 5 as data source | csv |
| `--mt5-login` | MT5 account number | Current account |
| `--mt5-password` | MT5 account password | None |
| `--mt5-server` | Broker server name | None |
| `--mt5-symbol` | Filter by symbol (e.g., EURUSD) | All symbols |
| `--mt5-days` | Number of days of history to fetch | 90 |
| `--calculate-mfe-mae` | Calculate MFE/MAE from tick data (slow) | false |

---

## Recent Updates

- Added the integrated UI application under `UI/` for the public site, analytics dashboard, admin route, and onboarding flows.
- Added a live Trader Journal feed sourced from processed trade output so analysed runs can populate journal entries in the frontend.
- Added separate frontend/backend support for trader applications, investor waitlist signups, and contact submissions.
- Added transactional email handling in the app backend for contact submissions, trader applications, and investor waitlist confirmations.

---

## Project Layout

```
turtle-analytics/
├── README.md
├── .gitignore
├── requirements.txt
├── pyproject.toml
├── configs/
│   └── default.yaml
├── turtle_analytics/
│   ├── __init__.py
│   ├── settings.py
│   ├── io.py
│   ├── features.py
│   ├── metatrader.py          # ← NEW: MT5 integration
│   ├── policies.py
│   ├── simulator.py
│   ├── optimization.py
│   ├── survival.py
│   ├── clustering.py
│   ├── reporting.py
│   └── utils.py
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
```
