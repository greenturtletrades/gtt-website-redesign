# Getting Started

This document explains how to run the project locally and what each part needs.

## Services

There are three main runtime services during normal local development:

1. `backend/` on Node/Express
2. `api/` on FastAPI/Python
3. `frontend/` on Vite/React

The Python package `turtle_analytics/` is used by the FastAPI service and by the offline script, but it is not launched by itself as a web service.

## Recommended Startup Order

1. Start the backend
2. Start the FastAPI analytics service
3. Start the frontend

This order makes the frontend usable immediately and allows backend-triggered analysis calls to succeed.

## Backend

From `backend/`:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

What it needs:

- a valid `DATABASE_URL`
- auth/session secrets
- app URLs
- billing settings if Stripe flows are being exercised
- email settings if Resend flows are being exercised

## Analytics API

From the repository root:

```bash
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

What it does:

- accepts trade payloads
- runs analysis in the background
- exposes job status and final report results

## Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

What it expects:

- the backend to be reachable
- configuration values exposed through backend endpoints and frontend environment variables

## Offline Analytics Script

The offline script is useful when you want to run analysis without the web stack:

```bash
python scripts/run_pipeline.py data/raw/trades.csv \
  --run-counterfactuals \
  --run-optimization \
  --run-survival \
  --run-clustering
```

This path writes outputs into `data/processed/` and `artifacts/`.

## Useful Read Order For New Developers

1. Read the root [README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/README.md:1)
2. Read [architecture.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/docs/architecture.md:1)
3. Read `frontend/README.md` or `backend/README.md` depending on the area you are working on
4. Read the folder-level README inside the code area you are about to touch

## Practical Advice

- Start with the backend if you need real product behavior.
- Start with the frontend if you are changing UI structure or copy.
- Start with the analytics service and package only when the work is specifically about model runs or reports.
- Treat `data/processed/` and `artifacts/` as generated outputs, not canonical source.
