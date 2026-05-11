# Frontend

This is the Vite + React frontend for Green Turtle Trades.

## Responsibilities

- Public landing page
- Trader auth and onboarding
- Trader analytics dashboard
- Admin route and staff UI
- Legal and contact pages

## What The Frontend Talks To

The frontend talks primarily to the Express backend in `../backend/`.

Typical frontend responsibilities are:

- Collect input from public users and traders
- Render account, billing, journal, and analytics screens
- Poll or display analysis results returned through backend APIs
- Display admin operational data for staff users

The frontend does not run analytics itself. It triggers backend endpoints, and the backend coordinates with the Python service when needed.

## Run Locally

```bash
npm install
npm run dev
```

The frontend expects the backend to be available for real auth, billing, settings, and analytics flows.

## Main Folders

- `src/components/` for UI screens and reusable components
- `src/api/` for frontend API clients
- `src/assets/` for images and static design assets
- `src/styles/` and `src/index.css` for styling

## Component Grouping

- `src/components/marketing/` contains the public landing experience, header, footer, waitlist, and contact page
- `src/components/legal/` contains privacy, terms, and risk disclosure screens
- `src/components/auth/` contains login/signup, reset password, subscription, and post-checkout flow components
- `src/components/trader/` contains trader product screens such as analytics, settings, EA download, and journal
- `src/components/admin/` contains admin login and dashboard tooling
- `src/components/onboarding/` contains trader application flow screens
- `src/components/ui/` contains shared presentational primitives

Non-runtime notes and product docs live in the repository-level `docs/frontend/` folder.
