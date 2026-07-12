import { test, expect } from '@playwright/test'
import { GENERATOR_ENDPOINTS, validServiceInput } from '../helpers/payloads'

// Every generator must validate its input. An empty body is never valid, so
// each endpoint must answer with a 4xx (400 invalid_input / 400 invalid_json)
// — a 200 here would mean the validation gate is broken.
for (const endpoint of GENERATOR_ENDPOINTS) {
  test(`generator ${endpoint} rejects malformed input`, async ({ request }) => {
    const res = await request.post(endpoint, { data: {} })
    expect(res.status(), `${endpoint} should reject empty body`).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })
}

// One real end-to-end generation, exercising the OpenAI path + merge logic.
// Tagged @slow because it makes a live model call (~cents, up to ~45s).
test('generator produces a complete, well-formed theme @slow', async ({ request }) => {
  test.setTimeout(90_000)
  // Live model call — override the short default actionTimeout.
  const res = await request.post('/api/generate-services', {
    data: validServiceInput,
    timeout: 80_000,
  })
  expect(res.status()).toBe(200)

  const body = await res.json()
  const c = body.content
  // Structural contract the /theme/new/services renderer relies on.
  expect(c).toBeTruthy()
  expect(c.hero?.headline).toBeTruthy()
  expect(Array.isArray(c.services?.items)).toBeTruthy()
  expect(c.services.items.length).toBeGreaterThan(0)
  expect(Array.isArray(c.faq?.items)).toBeTruthy()
  expect(c.faq.items.length).toBeGreaterThan(0)
  expect(c.seo?.title).toBeTruthy()

  // No-fake-data guarantee: the two real services we supplied survive into
  // the output (copy may be rewritten, but the set of names is preserved).
  const names = c.services.items.map((s: any) => String(s.name))
  expect(names.join(' ')).toMatch(/زيت|فحص/)
})
