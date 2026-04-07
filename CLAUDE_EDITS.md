# Claude Code Edit Log

This file tracks every change made with Claude Code assistance.
Each session is recorded with the branch, date, files touched, and exact edits made.

---

## Session 1 — Stripe Checkout Integration (Phase 1)

**Branch:** `v2`
**Date:** 2026-03-25
**Goal:** Add a `PAYMENTS_ACTIVE` feature gate that, when enabled, replaces the
waitlist form on the landing page with a Stripe Checkout pricing card.

---

### Files Modified

---

#### 1. `UI/backend/src/app.js`

**What changed:**
- Added `require("stripe")` import at the top (line 8)
- Added a new API endpoint block before the error handler at the bottom of the file

**New endpoint added:**
```
POST /api/create-checkout-session
```

**Behaviour:**
- Requires user to be authenticated (`authRequired` middleware)
- Reads `process.env.PAYMENTS_ACTIVE` — if not `"true"`, returns `403`
- Reads `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_PER_TRADE` from env
- Looks up the authenticated user in the database
- Creates a Stripe Customer if one doesn't exist yet, saves `stripeCustomerId` to the User record
- Creates a Stripe Checkout Session with:
  - `STRIPE_PRICE_MONTHLY` (recurring, quantity 1)
  - `STRIPE_PRICE_PER_TRADE` (metered)
  - `success_url` → `APP_URL?checkout=success`
  - `cancel_url` → `APP_URL?checkout=cancelled`
- Returns `{ ok: true, url: session.url }` to the frontend

**Nothing else in this file was touched.**

---

#### 2. `UI/backend/prisma/schema.prisma`

**What changed:**
Two nullable fields added to the `User` model:

```prisma
stripeCustomerId     String?
stripeSubscriptionId String?
```

**Why:** Stripe requires a Customer ID to attach subscriptions to. `stripeSubscriptionId`
is stored for future use (e.g. cancellation, plan management).

**Action required:** Run the Prisma migration before deploying:
```bash
cd UI/backend
npx prisma migrate dev --name add_stripe_fields
```

---

#### 3. `UI/backend/package.json`

**What changed:**
Added one dependency:
```json
"stripe": "^16.0.0"
```

Installed via `npm install`.

---

#### 4. `UI/package.json` (frontend)

**What changed:**
Added one dependency:
```json
"@stripe/stripe-js": "^4.0.0"
```

Installed via `npm install`.

---

#### 5. `UI/src/components/WaitingListSignup.tsx`

**What changed — imports (top of file):**
Added two lines after the existing imports:
```ts
import { createCheckoutSession } from "../api/checkout";

const PAYMENTS_ACTIVE = import.meta.env.VITE_PAYMENTS_ACTIVE === "true";
```

**What changed — inside the component function:**
Added new state variable and handler below the existing state declarations:
```ts
const [isCheckingOut, setIsCheckingOut] = useState(false);

const handleSubscribe = async () => {
  setIsCheckingOut(true);
  setErrorMsg(null);
  try {
    const url = await createCheckoutSession();
    window.location.href = url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Something went wrong.";
    setErrorMsg(msg);
    setIsCheckingOut(false);
  }
};
```

**What changed — JSX return block:**

The section heading and badge text are now conditionally rendered based on `PAYMENTS_ACTIVE`:
- Badge: `"Limited Early Access"` → `"Subscribe Now"`
- Heading: `"Request Early Access"` → `"Start Your Subscription"`
- Subtext: waitlist copy → pricing copy

The main content block is now a conditional:

- **`PAYMENTS_ACTIVE === false` (default):** renders the existing waitlist email form
  exactly as it was before. Zero visual change for users.

- **`PAYMENTS_ACTIVE === true`:** renders a pricing card showing:
  - £10/month
  - + £0.20 per trade
  - Feature checklist (7 items)
  - "Subscribe Now" button → calls `handleSubscribe()` → redirects to Stripe Checkout

**The existing waitlist form code was not deleted** — it is preserved inside the `else`
branch of the conditional.

---

#### 6. `UI/src/api/checkout.ts` *(new file)*

**What changed:** File created from scratch.

```
UI/src/api/checkout.ts
```

Contents: a single exported async function `createCheckoutSession()` that calls
`POST /api/create-checkout-session` using the existing `apiPost` client helper and
returns the Stripe Checkout session URL as a string.

---

### Environment Variables Required

Before this feature can go live, the following env vars must be set:

**Backend (`UI/backend/.env`):**
| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Your Stripe secret key (from Stripe dashboard) |
| `STRIPE_PRICE_MONTHLY` | Stripe Price ID for the £10/month recurring base plan |
| `STRIPE_PRICE_PER_TRADE` | Stripe Price ID for the £0.20 metered per-trade add-on |
| `PAYMENTS_ACTIVE` | Set to `"true"` to enable payments. Default: `"false"` |
| `APP_URL` | Your deployed frontend URL (used for Stripe redirect URLs) |

**Frontend (`UI/.env`):**
| Variable | Description |
|---|---|
| `VITE_PAYMENTS_ACTIVE` | Must match backend `PAYMENTS_ACTIVE`. Set to `"true"` to show pricing card |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (not yet used in code, ready for future use) |

---

### No Other Files Were Touched

The following were explicitly **not** modified:
- `SubscriptionModal.tsx` — left as-is
- `PaymentModal.tsx` — left as-is
- `App.tsx` — left as-is
- All other components, API files, backend routes, and Python ML engine files

---

### How to Activate Payments

1. Create the two prices in your Stripe dashboard (one recurring £10/month product,
   one metered £0.20/trade add-on — both under the same product)
2. Run the database migration: `npx prisma migrate dev --name add_stripe_fields`
3. Fill in the env vars listed above
4. Set `PAYMENTS_ACTIVE=true` (backend) and `VITE_PAYMENTS_ACTIVE=true` (frontend)
5. Deploy

---

---

## Known Weak Points — Error Handling (to target in a future session)

These are gaps identified during the test1 build review. None are crashes — they are silent failures or missing user feedback.

### 1. `?checkout=cancelled` silently ignored (`UI/src/App.tsx`)
When a user backs out of Stripe's checkout page, they return with `?checkout=cancelled`. The URL param is stripped but no message is shown. User lands on the landing page with no explanation and may think payment failed.
**Fix:** Add a `checkout === "cancelled"` branch that shows a brief message or toast.

### 2. Checkout polling exhausted — no message (`UI/src/App.tsx`)
If the Stripe webhook takes longer than 12 seconds (6 polls × 2s), `checkoutPending` clears silently and the user is left on the landing page. They have paid but see nothing.
**Fix:** On poll exhaustion, show a message telling the user their payment is processing and to log in shortly.

### 3. Non-401 session errors swallowed on page load (`UI/src/App.tsx`)
`fetchAccountState` in `validateSession` only handles `ApiError` with status 401. A 500 or network error is caught but ignored — user stays logged out silently.
**Fix:** Add a fallback catch branch that at minimum logs the error; optionally show a "couldn't connect" notice.

### 4. Login fetch failure shows wrong state (`UI/src/App.tsx` — `handleAuthComplete`)
If `fetchAccountState` throws during the login path, `turtleAnalyticsAuthed` is set to `false` and the user is navigated to `turtle-analytics` but sees `TurtleAnalyticsWelcome` with no explanation.
**Fix:** On catch, show a message explaining the subscription check failed and prompt the user to try again.

---

---

## Known Weak Points — Subscription System Reliability (to target in a future session)

These are potential failure points in the Stripe subscription flow identified during testing. None have been reproduced in production but all are plausible under real conditions.

### 1. Webhook fails silently — user locked out after paying
If the Stripe webhook arrives but fails signature verification (wrong `STRIPE_WEBHOOK_SECRET`), Stripe retries 3 times then stops. `stripeSubscriptionId` is never saved to the DB. `fetchAccountState` returns `not_started` forever. User paid but can never get in without admin manually setting their subscription in the DB.
**Fix:** Add a webhook failure alert in Railway logs monitoring. Add an admin endpoint to manually link a Stripe subscription ID to a user. Consider a "I've paid but can't get in" support flow.

### 2. Polling window too short — user dropped after paying
If the Stripe webhook takes longer than 12 seconds (6 polls × 2s), `checkoutPending` clears and the user is left on the landing page with no message. Already logged in the error handling weak points above — combining here for full picture.
**Fix:** Extend polling attempts, and on exhaustion show a message rather than silent drop.

### 3. Cancelled subscription — user stays in until page refresh
When `customer.subscription.deleted` fires, `stripeSubscriptionId` is set to null in DB. But a user currently in an active session keeps `turtleAnalyticsAuthed = true` in React memory until they refresh. No real-time gate on the frontend.
**Fix:** Periodic background `fetchAccountState` poll (e.g. every 10 mins) to revalidate session state, or check on each ML run attempt and redirect if subscription gone.

### 4. Stripe API down — paying users blocked from ML
`assertMlAnalysisAccess` calls the live Stripe API on every ML run to check subscription status. If Stripe has an outage or is slow, it throws and paying users get a 403.
**Fix:** Cache subscription status in the DB (e.g. `stripeSubscriptionStatus` field, kept in sync by webhooks). Fall back to DB status if Stripe API call fails, rather than blocking the user.

### 5. State 2 → State 1 transition requires page reload
A logged-in unsubscribed user who completes the subscription modal → Stripe → returns with `?checkout=success` triggers the polling correctly. But if they somehow complete payment without the full redirect cycle (e.g. Stripe redirects back before webhook fires and the polling exhausts), `turtleAnalyticsAuthed` stays `false` in React state. They'd need a manual page reload to get in.
**Fix:** After successful checkout polling, force a full `fetchAccountState` refresh and update all derived state. Consider a "Refresh" button on the loading screen if polling exhausts.

---

*Log maintained by Claude Code. Each future session should append a new section above this line.*
