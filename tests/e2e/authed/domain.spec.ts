import { test, expect } from '@playwright/test'
import { isStripeTestMode, hasPorkbunKeys } from '../helpers/stripeMode'

// Domain flows touch a REAL registrar (Porkbun) — there is no sandbox for
// registration. So the E2E boundary is deliberate:
//   • availability check  → safe, read-only (needs Porkbun keys)
//   • purchase            → we go only as far as the pre-charge dry-run +
//                           Stripe TEST checkout URL. We NEVER complete the
//                           payment, because the webhook's fulfilment calls
//                           the real Porkbun /create and would register (and
//                           bill) a real domain.

test('domain availability check returns a well-formed result', async ({ request }) => {
  test.skip(!hasPorkbunKeys(), 'Add PORKBUN_API_KEY / PORKBUN_SECRET_API_KEY to run domain checks.')

  const res = await request.get('/api/domains/check?domain=example.com', { timeout: 20_000 })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.domain).toBe('example.com')
  // example.com is registered → available must be false (or null if rate-limited).
  expect([false, null]).toContain(body.available)
  expect(body).toHaveProperty('retail_usd_year')
})

test('invalid domain is rejected before hitting the registrar', async ({ request }) => {
  // Longer timeout: first hit compiles the route on a cold dev server.
  const res = await request.get('/api/domains/check?domain=not_a_domain', { timeout: 30_000 })
  expect(res.status()).toBe(400)
})

test('domain purchase reaches a Stripe TEST checkout (dry-run passes)', async ({ request }) => {
  test.skip(
    !isStripeTestMode() || !hasPorkbunKeys(),
    'Needs sk_test_* Stripe keys AND Porkbun keys. Stops BEFORE payment — never registers.'
  )

  // Use a random, very-likely-available domain so the dry-run can succeed.
  const domain = `zenya-e2e-${Date.now()}.com`
  const res = await request.post('/api/domains/purchase', {
    data: { domain },
    timeout: 30_000,
  })

  // Either it produced a Stripe test checkout URL (dry-run OK), or it cleanly
  // refused (e.g. registrar spend limit) with a structured error — both are
  // acceptable; a 500/crash is not.
  expect(res.status()).toBeLessThan(500)
  const body = await res.json()
  if (res.status() === 200) {
    expect(String(body.url)).toContain('checkout.stripe.com')
    expect(body.purchase_id).toBeTruthy()
  } else {
    expect(body.error).toBeTruthy()
  }
})
