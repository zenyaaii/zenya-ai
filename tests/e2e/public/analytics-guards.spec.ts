import { test, expect } from '@playwright/test'

// Analytics read endpoints expose one user's traffic and must reject anonymous
// callers. The ingest endpoint is the opposite: it's hit by every public
// visitor, so it must ACCEPT anonymous posts — but never error, never leak, and
// never trust its input.

test('GET /api/analytics requires auth', async ({ request }) => {
  const res = await request.get('/api/analytics')
  expect(res.status()).toBe(401)
})

test('GET /api/analytics/realtime requires auth', async ({ request }) => {
  const res = await request.get('/api/analytics/realtime')
  expect(res.status()).toBe(401)
})

test('GET /api/analytics/export requires auth', async ({ request }) => {
  const res = await request.get('/api/analytics/export?dataset=daily')
  expect(res.status()).toBe(401)
})

test.describe('/api/insight ingest (public by design)', () => {
  test('accepts a well-formed pageview and always answers 204', async ({ request }) => {
    const res = await request.post('/api/insight', {
      data: { k: 'pv', s: 'definitely-not-a-real-slug-xyz', p: '/', i: 'sess-test' },
      headers: { 'content-type': 'application/json' },
    })
    // Unknown slug is swallowed silently — an attacker must not be able to
    // probe which slugs exist by watching the status code.
    expect(res.status()).toBe(204)
  })

  test('never 500s on garbage input', async ({ request }) => {
    for (const body of ['not json', '{}', '{"k":"nope"}', '{"k":"pv"}', JSON.stringify({ k: 'ev', e: 'bad_type' })]) {
      const res = await request.post('/api/insight', {
        data: body,
        headers: { 'content-type': 'application/json' },
      })
      expect(res.status(), `body: ${body}`).toBe(204)
    }
  })

  test('rejects an oversized payload without erroring', async ({ request }) => {
    const res = await request.post('/api/insight', {
      data: JSON.stringify({ k: 'pv', s: 'x', p: '/', junk: 'a'.repeat(8000) }),
      headers: { 'content-type': 'application/json' },
    })
    expect(res.status()).toBe(204)
  })
})
