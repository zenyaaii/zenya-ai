# Unblocking the credential-gated E2E tests

Three areas can't be tested without credentials only you can provide. Each
section below is a copy-paste checklist. None of these touch real money when
followed exactly (test/sandbox/dry-run modes throughout).

---

## 1. Payments completion + webhooks  (Stripe TEST mode)

This unblocks the 6 skipped specs (`authed/checkout`, `authed/webhook`) **and**
lets us drive a full checkout→webhook→entitlement chain with a test card.

### Step 1 — Create `.env.test`
```bash
cp .env.test.example .env.test
```

### Step 2 — Get TEST keys from Stripe
1. Go to https://dashboard.stripe.com → toggle **Test mode** ON (top-right).
2. Developers → API keys → copy the **Secret** (`sk_test_…`) and
   **Publishable** (`pk_test_…`) keys.
3. Paste into `.env.test`:
   ```
   STRIPE_SECRET_KEY=sk_test_…
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
   ```

### Step 3 — Create TEST prices (Products → in Test mode)
Create three recurring/one-time prices and paste their `price_…` ids:
```
STRIPE_PRICE_ID=price_…             # one-time "pro"
STRIPE_PRICE_ID_STARTER_USD=price_… # Starter $14.99/mo
STRIPE_PRICE_ID_PRO_USD=price_…     # Pro $24.99/mo
```

### Step 4 — Get a TEST webhook secret (via Stripe CLI)
1. Install the CLI: https://stripe.com/docs/stripe-cli  (`scoop install stripe`
   on Windows, or download the .exe).
2. `stripe login`
3. In a terminal, run and LEAVE IT RUNNING:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
4. It prints `whsec_…` — paste into `.env.test`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_…
   ```

### Step 5 — Run
```bash
npm run test:e2e:money
```
The gated specs will now run instead of skip. Test card for any manual
checkout: `4242 4242 4242 4242`, any future expiry, any CVC.

> Once this works, tell me — I'll add the deeper specs the map still lists as
> ⬜: full checkout COMPLETION (drive Stripe's test page with 4242 → assert the
> DB `purchases`/subscription row), subscription lifecycle, refund→downgrade,
> and the $0 free-domain (`no_payment_required`) path.

---

## 2. Domain purchase live path  (Porkbun API)

Porkbun has **no registration sandbox**, so we never actually register in tests
— the suite stops at the pre-charge **dry-run** + the Stripe test-checkout URL.
These keys only enable the read-only availability check and that dry-run.

### Steps
1. Log in at https://porkbun.com → Account → **API Access**.
2. Enable API access, create an **API key**. You get two values:
   - API key  → `pk1_…`
   - Secret key → `sk1_…`
3. Add to `.env.test` (or `.env.local` if you also want it in dev):
   ```
   PORKBUN_API_KEY=pk1_…
   PORKBUN_SECRET_API_KEY=sk1_…
   ```
4. (Porkbun requires you to allow-list the calling IP, or enable "API Access"
   per-domain — for local runs, enable global API access in the same panel.)
5. Run:
   ```bash
   npx playwright test authed/domain
   ```
   The availability check + dry-run-to-Stripe-URL specs will run instead of skip.

> ⚠️ Do NOT complete a domain checkout against real Porkbun keys — the webhook's
> fulfilment calls the real `/create` and would register (and bill) a real
> domain. The tests are written to stop before that on purpose.

---

## 3. Shopify one-click publish  (dev store + OAuth)

This is the heaviest to set up because it needs a real Shopify store and the
OAuth handshake. It's optional unless you're actively shipping Shopify installs.

### Steps
1. Create a **development store**: https://partners.shopify.com → Stores → Add
   store → *Development store* (free, for testing).
2. In your Shopify **Partner app** settings, confirm the app URL points at your
   tunnel (e.g. `ngrok http 3000` or the Shopify CLI tunnel) and the redirect
   URLs include `…/api/shopify/auth/callback`.
3. Ensure these are set (already in `.env.local` for the live app — mirror the
   dev-store values if different):
   ```
   SHOPIFY_API_KEY=…
   SHOPIFY_API_SECRET=…
   SHOPIFY_APP_URL=https://<your-tunnel>
   SHOPIFY_SCOPES=write_themes,read_themes,write_products,…
   ```
4. Install the app onto the dev store once (visit the app URL → OAuth → approve).
5. Tell me the dev-store domain (`your-store.myshopify.com`) and I'll write specs
   that drive `/build` → publish theme + create product, asserting via the
   Shopify Admin API (there's an MCP connected for verification).

> Because this needs a live tunnel + OAuth session, it can't run headless in CI
> without a stored offline token. Realistic scope: a semi-manual E2E you run
> locally against the dev store, which I can script once the store exists.

---

## Quick reference — what each unlocks

| You provide | Unblocks | Command |
|---|---|---|
| Stripe test keys + `whsec_` | checkout, webhook, (then full payment chain) | `npm run test:e2e:money` |
| Porkbun API keys | domain availability + dry-run purchase | `npx playwright test authed/domain` |
| Shopify dev store + OAuth | one-click theme/product publish | (semi-manual, local) |
