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

*Log maintained by Claude Code. Each future session should append a new section above this line.*
