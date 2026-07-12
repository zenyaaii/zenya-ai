import { test, expect } from '@playwright/test'

// These run WITHOUT a session (public project) and must never touch money —
// they only prove that the sensitive endpoints reject anonymous callers.
// A regression that drops one of these gates would be a serious auth hole.

test('POST /api/checkout requires auth', async ({ request }) => {
  const res = await request.post('/api/checkout', { data: { plan: 'onetime' } })
  expect(res.status()).toBe(401)
})

test('POST /api/domains/purchase requires auth', async ({ request }) => {
  const res = await request.post('/api/domains/purchase', {
    data: { domain: 'example-e2e-test.com' },
  })
  expect(res.status()).toBe(401)
})

test('GET /api/domains/check requires auth', async ({ request }) => {
  const res = await request.get('/api/domains/check?domain=example.com')
  expect(res.status()).toBe(401)
})

test('GET /api/account/export requires auth', async ({ request }) => {
  const res = await request.get('/api/account/export')
  expect(res.status()).toBeGreaterThanOrEqual(401)
  expect(res.status()).toBeLessThan(500)
})

// BY DESIGN: generation is public so guests can try Zenya before signing up
// (/theme/new/* and /build are guest-accessible). It is not auth-gated (400 on
// a bad body, never 401); abuse is bounded by the edge rate-limiter in
// middleware.ts (60 req/min/IP), and the real entitlement cap sits on theme
// SAVE (see authed/quota-enforcement.spec.ts). This asserts that contract.
test('generation is open for trial (reachable without auth, validates input)', async ({ request }) => {
  const res = await request.post('/api/generate-services', { data: {} })
  expect(res.status(), 'public trial endpoint — 400 for bad body, not 401').toBe(400)
})

test('webhook rejects an unsigned payload', async ({ request }) => {
  // No stripe-signature header → signature verification must fail (400),
  // never process. (500 would mean the secret isn't configured at all.)
  const res = await request.post('/api/webhook', {
    data: { id: 'evt_fake', type: 'checkout.session.completed' },
  })
  expect(res.status()).toBe(400)
})
