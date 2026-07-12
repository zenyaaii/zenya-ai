# Zenya End-to-End Tests (Playwright)

Full-stack E2E coverage for Zenya: public site, authenticated app, AI
generators, and the money/registrar flows (Stripe + Porkbun).

## Layout

```
tests/e2e/
  auth.setup.ts          # creates a confirmed test user, logs in, saves session
  helpers/
    testUser.ts          # service-role user provisioning (no inbox needed)
    payloads.ts          # schema-valid generator payloads
    stripeMode.ts        # test-mode / Porkbun key detection (safety gates)
  public/                # runs WITHOUT auth
    pages.spec.ts        # every marketing/legal page renders clean
    api-guards.spec.ts   # sensitive endpoints reject anonymous callers
  authed/                # runs WITH the saved session (depends on setup)
    dashboard.spec.ts    # dashboard pages load, no bounce to /login
    generators.spec.ts   # all 8 generators validate input + 1 real generation
    checkout.spec.ts     # Stripe checkout session creation   (test-mode gated)
    webhook.spec.ts      # signed webhook + idempotency        (test-mode gated)
    domain.spec.ts       # availability + dry-run checkout      (gated)
```

## Running

```bash
npm run test:e2e:public     # safe, no keys needed
npm run test:e2e:authed     # dashboard + generators (uses OpenAI for 1 test)
npm run test:e2e            # everything (money specs skip unless test keys set)
npm run test:e2e:report     # open the last HTML report
```

The dev server on :3000 is reused if already running; otherwise Playwright
starts `npm run dev`.

## Safety model — money never moves by accident

`.env.local` holds **LIVE** Stripe keys. The money specs
(`checkout` / `webhook` / `domain`) are hard-gated: they `test.skip` unless
`STRIPE_SECRET_KEY` starts with `sk_test_`. So on a normal checkout they do
nothing.

To run the money layer:

1. `cp .env.test.example .env.test` and fill in **test-mode** values
   (see that file). `.env.test` overrides `.env.local` for the test run and
   is git-ignored.
2. For webhook tests locally, run the Stripe CLI:
   `stripe listen --forward-to localhost:3000/api/webhook` and paste the
   printed `whsec_…` into `.env.test`.
3. `npm run test:e2e:money`

### Deliberate boundaries

- **Checkout**: we create a Checkout Session and assert the
  `checkout.stripe.com` URL — we never complete payment.
- **Webhook**: exercised with a genuinely-signed `customer.created` event
  (DB upsert only) — no charges, no API calls, no domain registration.
- **Domain**: there is **no** sandbox for real registration. Tests go only as
  far as the availability lookup and the pre-charge dry-run + Stripe test
  checkout URL. The registrar's `/create` is never called.

## The test user

A single confirmed account (`e2e-runner@zenya-test.local` by default) is
created/reused via the Supabase service-role key — no email confirmation
loop. Override via `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` in `.env.test`.
