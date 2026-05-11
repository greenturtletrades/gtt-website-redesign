# Routes

This folder contains route registration modules grouped by domain.

- `public-routes.js` handles public submissions and launch-facing endpoints
- `account-routes.js` handles account auth, session, profile, and trader account operations
- `billing-routes.js` handles Stripe webhook and billing/account payment flows
- `admin-routes.js` handles staff and admin API endpoints
- `analytics-routes.js` handles analytics run orchestration and analysis data APIs
- `integrations-routes.js` handles broker accounts, API keys, and MetaTrader EA endpoints
- `platform-routes.js` handles top-level platform endpoints such as checkout session creation and config flags
