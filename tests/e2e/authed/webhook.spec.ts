import { test, expect } from '@playwright/test'
import Stripe from 'stripe'
import { isStripeTestMode } from '../helpers/stripeMode'

// The webhook handler is the heart of fulfilment. We exercise it with a
// GENUINELY SIGNED event so signature verification, idempotency, and the
// stripe_events ledger are all covered — without moving money. We use
// `customer.created`, whose handler only upserts a stripe_customers row
// (no Stripe API calls, no charges, no domain registration).
//
// Gated to test mode: signing requires the webhook secret, and we only want
// to write rows into the environment paired with test keys.
test.beforeEach(() => {
  test.skip(
    !isStripeTestMode(),
    'Set STRIPE_SECRET_KEY=sk_test_… and STRIPE_WEBHOOK_SECRET (test) in .env.test.'
  )
})

function signed(payload: object) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  const body = JSON.stringify(payload)
  // generateTestHeaderString is pure HMAC — any key works to construct it.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_REPLACE_ME', {
    apiVersion: '2024-06-20' as any,
  })
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret })
  return { body, header }
}

test('valid signed event is processed and is idempotent', async ({ request }) => {
  const eventId = `evt_e2e_${Date.now()}`
  const event = {
    id: eventId,
    object: 'event',
    type: 'customer.created',
    data: {
      object: {
        id: `cus_e2e_${Date.now()}`,
        object: 'customer',
        email: 'e2e-runner@zenya-test.local',
        metadata: {},
      },
    },
  }
  const { body, header } = signed(event)

  const first = await request.post('/api/webhook', {
    headers: { 'stripe-signature': header, 'content-type': 'application/json' },
    data: body,
  })
  expect(first.status()).toBe(200)
  expect((await first.json()).ok).toBeTruthy()

  // Replaying the SAME event id must be recognised as already processed.
  const second = await request.post('/api/webhook', {
    headers: { 'stripe-signature': header, 'content-type': 'application/json' },
    data: body,
  })
  expect(second.status()).toBe(200)
  expect((await second.json()).idempotent).toBeTruthy()
})

test('a tampered payload fails signature verification', async ({ request }) => {
  const { header } = signed({ id: 'evt_x', type: 'customer.created', data: { object: {} } })
  const res = await request.post('/api/webhook', {
    headers: { 'stripe-signature': header, 'content-type': 'application/json' },
    data: JSON.stringify({ id: 'evt_TAMPERED', type: 'customer.created' }),
  })
  expect(res.status()).toBe(400)
})
