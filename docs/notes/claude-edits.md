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

### 1. `?checkout=cancelled` silently ignored (`UI/src/App.tsx`) — ✅ FIXED (session 2)
User now navigated to `turtle-analytics` view on cancelled checkout so the Subscribe button is visible.

### 2. Checkout polling exhausted — no message (`UI/src/App.tsx`) — ✅ FIXED (session 2)
`checkoutExhausted` state added. On poll exhaustion a "Payment received — Refresh now" screen is shown instead of silent drop. Admin sync-stripe button also added to recover stuck users without webhook.

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

---

## Known Weak Points — ML Engine / Simulator (to target in a future session)

### 1. Trailing stop formula uses absolute price percentage — broken across instruments
`simulator.py` line 272/286:
```python
long_trail_stop  = long_peak_price * (1 - policy.trail_pct)   # LONG
short_trail_stop = short_peak_price * (1 + policy.trail_pct)  # SHORT
```
`trail_pct = 0.005` (0.5%) applied to absolute price. On EURUSD at 1.08 with a 5-pip MFE:
- LONG trail stop = 1.0805 × 0.995 = **1.07510** — 50 pips **below entry**
- SHORT trail stop = 1.0799 × 1.005 = **1.08530** — 53 pips **above entry**

For XAUUSD at 2337, trail_pct=0.005 = 11.7-point trail vs a typical 1.5-point risk. The formula produces trail levels that are either never triggered (too far) or triggered below entry (converting profitable trades into losses). Silent garbage — no exception, just wrong R values.

**Fix:** Trail in R-units from peak, not absolute percentage:
```python
long_trail_stop  = long_peak_price  - (sim_risk_long * policy.trail_pct)
short_trail_stop = short_peak_price + (sim_risk_short * policy.trail_pct)
```
This makes trail_pct instrument-agnostic and proportional to actual risk.

### 2. Win rate frozen at original value across all counterfactual policies
All counterfactual parameter rows report identical win rate (55%) with Win Rate Δ = +0.0 pts. Two causes:

**a) ORIGINAL exits structurally preserve sign.** `sim_R = sim_pnl / sim_risk`. For trades where no SL/TP/trail triggered (ORIGINAL), sim_pnl = original_pnl. Dividing by a smaller sim_risk (sl_mult < 1) inflates magnitude but never flips sign. Winners stay winners, losers stay losers, regardless of policy.

**b) SL_HIT trades in this dataset are all confirmed losers (MFE=0).** The 112 trades with MFE=0 went straight against — they never had a profitable moment. Tightening the SL hits them sooner but they're already losses. No winner-to-loser flips occur because no winner had MAE large enough to penetrate the tighter SL before recovering.

**Result:** Win rate is correct arithmetic on data where the policy parameters happen not to flip any outcomes. With a different dataset (winners with large MAE, or losers with large MFE), win rate would move. The table is not lying — but it hides the trail bug because the trail rarely triggers properly.

**Fix:** Fix Bug 1 first (trail formula). Then add a synthetic test case with known flip scenarios (a winner that dips 40% of risk before recovering) to verify win rate does change under tighter SL.

### 4. Trail formula fabricates negative R — optimiser output is corrupted
The trail formula (Bug 1 above) doesn't just produce wrong exit prices — it manufactures phantom losses that directly corrupt Bayesian optimisation output:

**LONG example** (XAUUSD entry=2337, MFE=1.5pts, trail_pct=0.005):
- trail_stop = 2338.5 × 0.995 = **2326.8** (10.7pts below entry)
- sim_pnl = 2326.8 − 2337 = **−10.2** (fabricated loss on a winning move)
- sim_R = large negative — trade that moved favourably recorded as disaster

**SHORT example** (EURUSD entry=1.08, MFE=0.0005, trail_pct=0.005):
- trail_stop = 1.0795 × 1.005 = **1.0849** (price never reached there)
- sim_pnl = 1.08 − 1.0849 = **−0.0049** (fabricated loss)

Optimiser sees phantom losses on every trial where trail_pct > 0 → drives trail_pct to zero on every run. All historical ML pipeline recommendations for trailing stops are the **inverse of reality**. The model learned that trailing stops destroy performance because the formula told it so.
**Fix:** Fix Bug 1 (R-unit trailing). Rerun optimisation. All prior trail_pct recommendations should be discarded.

### 3. sim_R denominator silently drops trades when original SL = entry price
`simulator.py` line 394:
```python
df["sim_R"] = sim_pnl / sim_risk.replace(0, np.nan)
```
`sim_risk = original_risk × sl_mult`. If a trade has entry_price = stop_loss (zero original risk), sim_risk = 0, result is NaN. The trade drops from all downstream metric calculations silently. No warning logged, no count reported.
**Fix:** Warn and skip zero-risk trades before simulation rather than silently NaN-ing them in the denominator.

---

## Known Weak Points — Checkout & Payment Logic (to target in a future session)

### 1. Mid-flight user patching — fragile and already broken for `mlRunDiscountPercent`
`POST /api/create-checkout-session` (line ~6733) fetches the user with a partial `select`, then manually patches the in-memory object after the referral code DB update rather than re-fetching:
```js
user.appliedReferralCode = { code: matchedCode.code };
user.accountDiscountPercent = matchedCode.accountDiscountPercent;
user.referralDiscountExpiresAt = expiresAt;
// mlRunDiscountPercent never patched
```
`mlRunDiscountPercent` is saved correctly to the DB but is not in the original `select` and not in the patch. `getActiveUserDiscounts(user)` therefore returns `mlRunDiscountPercent: 0` at checkout. The Stripe coupon only uses `accountDiscountPercent` so payment works, but the ML run discount is invisible to the checkout layer. Any future code reading that discount summary here will silently give users no ML discount.
**Root cause:** partial `select` + manual object mutation instead of a re-fetch after update.
**Fix:** Either include all discount fields in the original select (`mlRunDiscountPercent`), or after the referral code update, re-fetch the user rather than patching manually. Re-fetch is safer — it can't fall out of sync as the schema grows.

### 2. `POST /api/create-checkout-session` has zero test coverage
The entire payment path — referral code application, Stripe customer creation, coupon creation, `allow_promotion_codes` vs `discounts` mutex, line item construction — has no tests. A broken env var, wrong price ID, bad coupon duration calculation, or schema mismatch will be silent until a real user hits pay. All 20 passing tests cover endpoints that don't touch Stripe.
**Fix:** Add unit tests with a mocked Stripe SDK (intercept `stripe.customers.create`, `stripe.coupons.create`, `stripe.checkout.sessions.create`). Add an integration test that hits the endpoint with `STRIPE_SECRET_KEY` unset and verifies the 500 response, and with `billingExempt=true` verifies the bypass path.

### 3. Two separate DB writes in checkout — no transaction
The checkout endpoint can make two `prisma.user.update` calls: one for `stripeCustomerId` (if no customer exists yet) and one for the referral code. These are separate round trips with no transaction. If the first succeeds and the second fails, `stripeCustomerId` is saved but the referral discount isn't. The user gets a Stripe customer but no discount on retry (the customer reuse path skips the first update). Low probability but leaves state partially applied.
**Fix:** Combine both updates into a single `prisma.user.update` call, or wrap in `prisma.$transaction`.

---

## Known Weak Points — Test Suite Reliability (to target in a future session)

### 1. Mocks replace integration — the 20 green tests cannot catch schema or query bugs
`app.test.js` injects a JS object in place of Prisma before the app loads. This verifies HTTP logic (status codes, auth guards, field writes) but cannot catch: missing DB columns (e.g. `passwordResetToken` not migrated), wrong Prisma filter syntax (e.g. `gt` vs `gte` on the expiry check), or broken indexes. A test mocking `findFirst` returning `null` does not prove Prisma's `{ passwordResetExpiresAt: { gt: new Date() } }` filter works. Tests stay green while production fails on the first real DB call.
**Fix:** CI integration stage — throwaway Postgres, `prisma migrate deploy`, hit real endpoints. Unit tests stay for speed; integration layer catches schema/query correctness.

### 2. Rate limiter state accumulates across tests in the same process
All tests share a single `app` instance. In-memory rate limiters (`forgot-password`: 5/15min, `reset-password`: 10/15min) are never reset between tests. Currently the suite makes 2–3 calls to each — well under limits. As the suite grows, adding more tests for these endpoints will cause mysterious 429 failures with no obvious cause.
**Fix:** Disable rate limiting when `NODE_ENV=test`, or expose store reset in `beforeEach`, or spin a fresh app per test.

### 3. Polling exhausts silently — paying user sees paywall
If the Stripe webhook takes longer than 12 seconds (6 polls × 2s), `checkoutPending` clears with no message and `turtleAnalyticsAuthed` stays `false`. The user has paid but lands back on the paywall with no explanation. No test covers the exhaustion path — the poll loop in `App.tsx` is entirely untested.
**Fix:** On poll exhaustion show a message ("Payment received — check back shortly or refresh"). Add a manual refresh button. Consider extending poll window or using exponential backoff.

*Log maintained by Claude Code. Each future session should append a new section above this line.*
