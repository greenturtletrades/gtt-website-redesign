# Backend Service

Express API backed by Prisma/Postgres with Resend for transactional emails.

## Setup

1. `npm install`
2. `cp .env.example .env` and fill in values.
3. `npx prisma migrate deploy`
4. `npm run dev`

If you change Prisma models locally, run `npx prisma migrate dev --name trader_application` (or similar) before starting the server.

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
- `GET /api/admin/metrics` (ADMIN only)
