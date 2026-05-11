# Architecture

This document explains how the full Green Turtle Trades repository is organized and how the moving pieces relate to one another.

## System Summary

The repository is one product split across five major technical areas:

1. `frontend/`
   This is the user-facing Vite + React application.
2. `backend/`
   This is the main Express API and operational core.
3. `api/`
   This is a FastAPI wrapper around the Python analytics engine.
4. `turtle_analytics/`
   This is the reusable Python package that contains the analysis logic itself.
5. `ea/`
   This contains the MetaTrader 4 and MetaTrader 5 Expert Advisor source templates.

## Runtime Relationships

The main runtime path is:

```text
Browser
  -> frontend
  -> backend
  -> database
  -> api
  -> turtle_analytics
```

A second integration path is:

```text
MetaTrader terminal
  -> generated EA file
  -> backend EA endpoints
  -> database
  -> backend-triggered analysis runs
```

## Repository Areas

### `frontend/`

The frontend is responsible for:

- landing pages
- trader login and signup
- payment and subscription UX
- trader settings and EA download UX
- analytics dashboard rendering
- admin dashboard rendering
- legal pages and contact flows

It should be thought of as the presentation layer.

### `backend/`

The backend is the main application layer and durable system boundary.

It is responsible for:

- users, sessions, roles, and password reset
- waitlist and contact submissions
- trader applications and moderation data
- broker accounts and managed API keys
- billing, Stripe checkout, and subscription state
- admin tooling and staff operations
- EA telemetry ingestion and diagnostics
- analysis-run orchestration and persistence

It is the most important “source of truth” service in the repo.

### `api/`

The FastAPI service exists to give the Node backend a stable HTTP way to trigger the Python analytics logic.

This service accepts trade data, runs analysis in the background, and exposes job status and report results.

It is not the source of truth for users or billing. It is a compute-oriented bridge.

### `turtle_analytics/`

This package contains the actual analysis logic:

- input validation
- feature engineering
- counterfactual simulation
- Bayesian optimization
- survival analysis
- clustering / regime detection
- report assembly

This is the analytics engine, independent of the web stack around it.

### `ea/`

The EA files are MetaTrader-side scripts that connect trader terminals to the backend.

They are used to:

- send heartbeat telemetry
- upload trade/history exports
- respond to export requests initiated by the backend

## Data And Output Folders

### `data/`

This contains local datasets for analytics work.

- `raw/` contains input trade files
- `processed/` contains feature-engineered outputs

### `artifacts/`

This contains generated analytics outputs such as:

- summary reports
- best-policy files
- optimization trials
- clustering/regime outputs
- hold-time insights

These are outputs, not primary source code.

## Backend Internal Shape

The backend source is split into:

- `src/routes/`
  Route registration modules grouped by area.
- `src/services/`
  Reusable helpers that are not route modules.
- `src/middleware/`
  Session, JWT, and request-level helpers.
- `src/db/`
  Prisma client setup.
- `src/app.js`
  Service composition and remaining shared logic.

## Frontend Internal Shape

The frontend components are grouped by product area:

- `marketing/`
- `legal/`
- `auth/`
- `trader/`
- `admin/`
- `onboarding/`
- `ui/`

This keeps public pages, trader tools, and admin tools separate.

## Where To Start Depending On Task

If the task is about landing pages or copy:

- start in `frontend/src/components/marketing/`

If the task is about trader product flows:

- start in `frontend/src/components/trader/`
- then inspect `frontend/src/api/`
- then inspect the matching backend route module

If the task is about billing or account behavior:

- start in `backend/src/routes/account-routes.js`
- then `backend/src/routes/billing-routes.js`

If the task is about MetaTrader / EA behavior:

- start in `backend/src/routes/integrations-routes.js`
- then `ea/`

If the task is about model-run behavior or analysis output:

- start in `backend/src/routes/analytics-routes.js`
- then `api/main.py`
- then `turtle_analytics/`

## Important Design Boundaries

- The frontend should not contain core business rules that only exist in UI state.
- The backend should remain the source of truth for user, billing, and integration state.
- The FastAPI service should stay focused on analysis execution, not app account logic.
- The Python analytics package should remain reusable outside the web stack.
