# Backend Service

Express API backed by Prisma/Postgres with Resend for transactional emails.

This service is the central application backend for the repo. It sits alongside `frontend/`, `api/`, and the Python analytics code at the repository root.

## Responsibilities

- Account registration, login, session management, and password reset
- Trader profile, settings, broker accounts, and API keys
- Stripe billing and subscription control
- Public waitlist, contact, and trader-application intake
- Admin and staff operations
- MetaTrader EA download, telemetry ingestion, and history-export coordination
- Analytics job orchestration and persistence around the Python service

## Internal Structure

- `src/routes/` contains route registration modules grouped by domain
- `src/services/` contains business helpers shared across route areas
- `src/middleware/` contains auth/session helpers
- `src/db/` contains Prisma setup
- `src/app.js` wires the service together

For backend source orientation, start with [backend/src/README.md](/Users/sean/Green Turtle Trades /landing-page-no-ML-/backend/src/README.md:1).

## Setup

1. `npm install`
2. Create `.env` with the required database, auth, billing, email, and app URL settings.
3. `npx prisma migrate deploy`
4. `npm run dev`

If you change Prisma models locally, run `npx prisma migrate dev --name trader_application` (or similar) before starting the server.

## Runtime Neighbors

- The React frontend in `../frontend/` calls this backend directly.
- The FastAPI service in `../api/` performs Python-side analytics when this backend triggers model runs.
- The MetaTrader EA templates in `../ea/` are generated and served through this backend.

## Auth

- `POST /api/auth/register` `{ "email": "...", "password": "..." }`
- `POST /api/auth/login` `{ "email": "...", "password": "..." }`
- `GET /api/me` (Bearer token)

## Broker Accounts

- `POST /api/broker-accounts`
- `GET /api/broker-accounts`
- `PATCH /api/broker-accounts/:id`

## API Keys (EA)

- `POST /api/api-keys` (returns the raw key once)
- `GET /api/api-keys`
- `DELETE /api/api-keys/:id` (revokes)

## EA Ingestion (ApiKey)

- `POST /v1/ea/market/batch`
- `POST /v1/ea/trades/event`
- `POST /v1/ea/history/export`

Example:

```bash
curl -X POST http://localhost:3001/v1/ea/market/batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: gt_your_raw_key" \
  -H "x-broker-account-id: BROKER_ACCOUNT_ID" \
  -d '{"bars":[{"time":"2026-01-01T00:00:00Z","open":1.1,"high":1.2,"low":1.0,"close":1.15}]}'
```

```bash
curl -X POST http://localhost:3001/v1/ea/trades/event \
  -H "Content-Type: application/json" \
  -H "x-api-key: gt_your_raw_key" \
  -H "x-broker-account-id: BROKER_ACCOUNT_ID" \
  -d '{"ticket":"12345","action":"OPEN","symbol":"EURUSD"}'
```

```bash
curl -X POST http://localhost:3001/v1/ea/history/export \
  -H "Content-Type: application/json" \
  -H "x-api-key: gt_your_raw_key" \
  -H "x-broker-account-id: BROKER_ACCOUNT_ID" \
  -d '{"from":"2025-01-01","to":"2025-12-31"}'
```

## Misc

- `GET /health`
- `POST /api/waitlist`
- `POST /api/contact`
- `POST /api/trader-applications`
- `GET /api/admin/metrics` (ADMIN only)

## Related Folders

- `../frontend/` contains the React client that calls this API.
- `../api/` contains the FastAPI analytics bridge used for model runs.
- `../ea/` contains the MT4 and MT5 EA source files used for trader downloads.
