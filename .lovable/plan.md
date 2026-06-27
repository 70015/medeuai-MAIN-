# Switch from Stripe to Razorpay

You'll provide `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` now. The webhook secret can be added later — until then, we'll rely on **client-side payment verification** (signature check on the success callback) plus a manual "Refresh subscription status" poll. That's enough to ship and test; the webhook just makes status updates more reliable for cancellations/renewals.

## What gets built

**1. Database (already migrated)**
- `razorpay_plans` table caches auto-created Plan IDs
- `subscriptions` extended with `provider`, `razorpay_subscription_id`, `razorpay_customer_id`, `razorpay_plan_id`, `short_url`

**2. Server functions** (`src/lib/razorpay.functions.ts`)
- `ensureRazorpayPlans` — admin-triggered; creates Monthly ₹99 and Yearly ₹799 plans in Razorpay via API, stores Plan IDs in `razorpay_plans`. Idempotent.
- `createRazorpaySubscription` — creates a Razorpay subscription for the signed-in user, returns `subscription_id` + `short_url` for checkout
- `verifyRazorpayPayment` — verifies `razorpay_signature` from success handler using HMAC-SHA256, then upserts the `subscriptions` row as active
- `getPlanStatus` — same shape as today (isPro, attemptsInWindow, canStartTest), reads provider-agnostic
- `cancelRazorpaySubscription` — cancels at period end via Razorpay API

**3. Webhook route** (`src/routes/api/public/payments/razorpay-webhook.ts`)
- Built now but only activates once `RAZORPAY_WEBHOOK_SECRET` is set
- Handles `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.halted`
- URL to register later in Razorpay Dashboard → Webhooks: `https://project--919a0eec-4904-4552-a317-8eb48c9a8544.lovable.app/api/public/payments/razorpay-webhook`

**4. Frontend** (`src/routes/_authenticated/billing.tsx` rewritten)
- Loads Razorpay Checkout script (`https://checkout.razorpay.com/v1/checkout.js`)
- "Subscribe Monthly / Yearly" → calls `createRazorpaySubscription` → opens Razorpay modal with `subscription_id`
- On success handler → calls `verifyRazorpayPayment` → invalidates plan status query
- Shows current plan, period end, "Cancel subscription" button
- INR pricing display (₹99 / ₹799)

**5. Admin bootstrap**
- Add "Initialize Razorpay Plans" button to `/admin` that calls `ensureRazorpayPlans` once

**6. Removals**
- Delete: `src/lib/stripe.ts`, `src/lib/stripe.server.ts`, `src/lib/payments.functions.ts`, `src/components/stripe-embedded-checkout.tsx`, `src/components/payment-test-mode-banner.tsx`, `src/routes/api/public/payments/webhook.ts`
- Uninstall: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`
- Install: `razorpay` (server SDK)
- Remove `VITE_PAYMENTS_CLIENT_TOKEN` from `.env.development`
- Update `tests.$slug.tsx` upgrade banner to point to Razorpay billing
- Remove the Lovable-managed Stripe connector from Payments dashboard (you do this manually)

## What I need from you

1. **Now**: `RAZORPAY_KEY_ID` (e.g. `rzp_test_xxx`) and `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard → Settings → API Keys
2. **Disconnect Stripe**: open Payments dashboard → three-dots menu → Disconnect
3. **Later (whenever ready)**: create a webhook in Razorpay Dashboard → Webhooks pointing to the URL above, copy the secret, and tell me — I'll just store it; no code change needed.

## Technical notes

- Razorpay test mode: use card `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`
- `KEY_ID` is treated as public (passed to browser via a server-fn that reads `process.env.RAZORPAY_KEY_ID` and returns it) — no need for a `VITE_*` var, keeps it out of the bundle source
- Subscription `current_period_end` derived from Razorpay's `current_end` (Unix seconds)
- Free-tier cap (3 attempts / 30 days) logic stays unchanged
