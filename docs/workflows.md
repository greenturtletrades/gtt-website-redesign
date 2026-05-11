# Workflows

This document explains the main end-to-end flows in the project.

## 1. Public Landing Flow

1. A visitor opens the frontend landing page.
2. The frontend renders marketing components from `frontend/src/components/marketing/`.
3. Public forms such as contact, waitlist, or trader application submit to backend endpoints.
4. The backend validates and stores the submission, and may send email notifications.

Main code areas:

- frontend marketing components
- frontend API helpers for public submissions
- backend public routes

## 2. Trader Auth And Account Flow

1. A trader signs up or logs in from the frontend.
2. The frontend calls backend auth endpoints.
3. The backend creates or validates the account.
4. The backend returns session/auth state.
5. The frontend renders trader-facing product screens.

Main code areas:

- `frontend/src/components/auth/`
- `frontend/src/api/auth.ts`
- `backend/src/routes/account-routes.js`
- `backend/src/middleware/auth.js`

## 3. Billing And Subscription Flow

1. A trader initiates checkout from the frontend.
2. The frontend requests a checkout session from the backend.
3. The backend creates a Stripe Checkout session.
4. Stripe redirects the user back to the frontend.
5. The frontend refreshes account state through the backend.
6. Stripe webhooks update billing state in the backend database.

Main code areas:

- `frontend/src/components/auth/SubscriptionModal.tsx`
- `frontend/src/api/subscription.ts`
- `backend/src/routes/platform-routes.js`
- `backend/src/routes/billing-routes.js`

## 4. EA Download And MetaTrader Flow

1. A trader opens settings or the EA download screen in the frontend.
2. The frontend asks the backend to generate an MT4 or MT5 EA file.
3. The backend injects trader-specific API key and broker account details into the EA source.
4. The trader installs the EA in MetaTrader.
5. The EA sends heartbeats and history exports to backend endpoints.
6. The backend stores those events and exposes status/diagnostics to the frontend.

Main code areas:

- `frontend/src/components/trader/SettingsPage.tsx`
- `frontend/src/components/trader/EACodePage.tsx`
- `backend/src/routes/integrations-routes.js`
- `ea/`

## 5. Analytics Run Flow

1. A trader starts an analysis from the frontend.
2. The frontend calls backend analytics endpoints.
3. The backend checks access and gathers trade input.
4. The backend calls the FastAPI service.
5. The FastAPI service runs the Python analytics pipeline in the background.
6. The frontend polls for status through the backend.
7. Final report data is shown in the trader dashboard and related views.

Main code areas:

- `frontend/src/components/trader/TurtleAnalytics.tsx`
- `frontend/src/api/analysis.ts`
- `backend/src/routes/analytics-routes.js`
- `api/main.py`
- `turtle_analytics/`

## 6. Admin Operations Flow

1. A staff/admin user logs in through the frontend admin route.
2. The frontend loads admin dashboard data from backend endpoints.
3. The backend aggregates user, signup, finance, referral, and audit information.
4. Admin actions such as invite, moderation, or trader account changes are persisted by the backend.

Main code areas:

- `frontend/src/components/admin/`
- `frontend/src/api/admin.ts`
- `backend/src/routes/admin-routes.js`

## 7. Offline Analytics Flow

1. A developer or analyst runs `scripts/run_pipeline.py`.
2. The script loads raw trades from CSV or MetaTrader.
3. The script runs feature engineering and optional advanced phases.
4. Results are written to `data/processed/` and `artifacts/`.

Main code areas:

- `scripts/run_pipeline.py`
- `turtle_analytics/`
- `data/`
- `artifacts/`
