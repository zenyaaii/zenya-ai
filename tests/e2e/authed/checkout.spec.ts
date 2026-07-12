import { test, expect } from '@playwright/test'
import { isStripeTestMode } from '../helpers/stripeMode'

// SAFETY: only ever run these against a TEST-mode Stripe key. Creating a
// Checkout Session does not charge anything, but we still refuse to touch
// live keys so a stray change can't. Provide sk_test_* via .env.test.
test.beforeEach(() => {
  test.skip(
    !isStripeTestMode(),
    'Set STRIPE_SECRET_KEY=sk_test_… (and price ids) in .env.test to run checkout E2E.'
  )
})

test('subscription checkout redirects to Stripe (Pro)', async ({ page }) => {
  // /checkout is a server component that creates the session and 302s to
  // Stripe. We assert the redirect target — never complete the payment here.
  await page.goto('/checkout?plan=pro', { waitUntil: 'domcontentloaded' })
  await page.waitForURL(/checkout\.stripe\.com|\/dashboard\?already/, { timeout: 20_000 })
  expect(page.url()).toMatch(/checkout\.stripe\.com|already_pro/)
})

test('one-time checkout API returns a Stripe session url', async ({ request, baseURL }) => {
  // A real browser always sends Origin on this fetch; the route builds the
  // success/cancel URLs from it. Playwright's request fixture omits it, so we
  // set it explicitly (otherwise Stripe rejects the empty success_url).
  const res = await request.post('/api/checkout', {
    data: { plan: 'onetime' },
    headers: { origin: baseURL || 'http://localhost:3000' },
  })
  // 200 with a Stripe url, OR the app told us the user is already pro.
  expect([200]).toContain(res.status())
  const body = await res.json()
  expect(body.url).toBeTruthy()
  expect(String(body.url)).toMatch(/checkout\.stripe\.com|\/dashboard/)
})
