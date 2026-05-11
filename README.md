# Green Turtle Trades Monorepo

This repository contains the public app, the app backend, the Python analytics pipeline, and the MetaTrader EA files in one place.

## Start Here

- Read [docs/architecture.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/docs/architecture.md:1) for the full system overview.
- Read [docs/getting-started.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/docs/getting-started.md:1) for local development setup and startup order.
- Read [docs/workflows.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/docs/workflows.md:1) for the main user and system flows.

## Top-Level Structure

```text
landing-page-no-ML-/
├── frontend/          # Vite + React client
├── backend/           # Express + Prisma API
├── api/               # FastAPI wrapper around the analytics pipeline
├── turtle_analytics/  # Python analytics package
├── scripts/           # Python pipeline entry scripts
├── ea/                # MT4 / MT5 Expert Advisor source files
├── data/              # Sample and processed trade datasets
├── artifacts/         # Generated analytics outputs
├── tests/             # Python test suite
├── docs/              # Product, analytics, and archive docs
└── configs/           # Analytics config files
```

## What Lives Where

- `frontend/` serves the landing page, trader dashboard, admin route, onboarding flow, and account screens.
- `backend/` handles auth, billing, waitlist/contact forms, trader applications, admin endpoints, and EA ingestion.
- `api/` exposes the Python analytics pipeline over HTTP so the backend can trigger model runs.
- `turtle_analytics/` contains the reusable analysis logic: validation, feature engineering, simulation, optimization, clustering, survival analysis, and reporting.
- `ea/` contains the MetaTrader 4 and MetaTrader 5 source files generated for trader installs.
- `docs/` now holds non-runtime markdown and reference material that was previously mixed into source folders.

## How The Pieces Fit Together

At a high level:

1. The `frontend/` React app is the user-facing product.
2. The `backend/` Express app is the main application API and source of truth for accounts, billing, EA telemetry, and admin data.
3. The `api/` FastAPI service wraps the Python analytics pipeline behind HTTP endpoints.
4. The `turtle_analytics/` package performs the actual trade analysis logic used by both the FastAPI bridge and the offline pipeline script.
5. The `ea/` files are trader-side MetaTrader scripts that send trade/export telemetry back into the backend.

The most important runtime relationships are:

- `frontend -> backend` for auth, settings, admin, billing, journal, and product flows
- `backend -> api` for analytics job execution
- `api -> turtle_analytics` for feature engineering, simulation, optimization, clustering, and reporting
- `ea -> backend` for trade/event ingestion and history export
- `backend -> database` for durable state

## Major Product Areas

- Public marketing site: landing page, waitlist, trader application, contact, legal pages
- Trader product: auth, subscription, settings, EA download, trade journal, analytics runs
- Admin product: trader operations, signup moderation, referral codes, finance, churn, audit tooling
- Analytics engine: historical trade analysis without market forecasting
- MetaTrader integration: MT4/MT5 EA generation, heartbeat tracking, and trade export flow

## Development Commands

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Analytics API

```bash
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### Offline Analytics Pipeline

```bash
pip install -r requirements.txt
python scripts/run_pipeline.py data/raw/trades.csv \
  --run-counterfactuals \
  --run-optimization \
  --run-survival \
  --run-clustering
```

## Recommended Local Startup Order

1. Start the backend in `backend/`
2. Start the analytics API in the repo root with `uvicorn api.main:app`
3. Start the frontend in `frontend/`

That order gives the frontend a live application API and gives the backend a live Python analysis service.

## Where To Look First

- Frontend landing and product UI: [frontend/README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/frontend/README.md:1)
- Backend application API: [backend/README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/backend/README.md:1)
- Backend internal layout: [backend/src/README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/backend/src/README.md:1)
- Analytics package orientation: [turtle_analytics/README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/turtle_analytics/README.md:1)
- Folder-level documentation index: [docs/README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/docs/README.md:1)

## Data Expectations

The Python pipeline expects trade data with these required columns:

- `entry_time`
- `exit_time`
- `side`
- `entry_price`
- `exit_price`
- `stop_loss`
- `take_profit`

Useful optional columns include `mfe`, `mae`, `session`, `symbol`, `spread`, and `volatility`.

## Notes

- `artifacts/` and `data/processed/` are output-oriented directories. They are useful for local analysis but should not be treated as primary source code.
- `docs/notes/claude-edits.md` is historical implementation context, not part of the runtime app.
- The root `Procfile` starts the FastAPI service, not the frontend or Node backend.
- The repository still contains archived notes and reference documents in `docs/`; those are useful for context but are not always current design specs.
