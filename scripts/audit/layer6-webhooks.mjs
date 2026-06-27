// Layer 6 — Webhook integrity.
//
// Webhooks are the seam where money and store state cross trust boundaries, so
// the two non-negotiables are: (1) cryptographic signature verification before
// trusting the body, and (2) idempotency so a provider retry can't double-apply.
// This scans the Stripe and Shopify webhook handlers for both, plus a couple of
// footguns (raw-body handling, swallowed errors that hide failed fulfilment).

import path from 'node:path'
import { ROOT, PASS, WARN, FAIL, SKIP, check, read, exists, writeLayer, printLayer } from './_lib.mjs'

const checks = []

const targets = [
  {
    id: 'stripe',
    file: path.join(ROOT, 'app', 'api', 'webhook', 'route.ts'),
    sig: /constructEvent\s*\(/,
    sigName: 'stripe.webhooks.constructEvent',
    idem: /stripe_events|\.processed|idempotent/,
    rawBody: /req\.text\(\)/,
  },
  {
    id: 'shopify',
    file: path.join(ROOT, 'app', 'api', 'webhooks', 'shopify', 'route.ts'),
    sig: /hmac|createHmac|verifyWebhook|x-shopify-hmac/i,
    sigName: 'HMAC verification',
    idem: /webhook_id|x-shopify-webhook-id|processed|onConflict|upsert/i,
    rawBody: /req\.text\(\)|rawBody|arrayBuffer/,
  },
]

for (const t of targets) {
  if (!exists(t.file)) {
    checks.push(check(`${t.id}:exists`, t.id === 'stripe' ? FAIL : WARN, `handler not found: ${path.relative(ROOT, t.file)}`))
    continue
  }
  const body = read(t.file)
  const rel = path.relative(ROOT, t.file).split(path.sep).join('/')

  checks.push(
    t.sig.test(body)
      ? check(`${t.id}:signature`, PASS, `${t.sigName} present`, rel)
      : check(`${t.id}:signature`, FAIL, `no signature verification (${t.sigName}) — body is forgeable`, rel),
  )

  checks.push(
    t.idem.test(body)
      ? check(`${t.id}:idempotency`, PASS, 'idempotency guard present', rel)
      : check(`${t.id}:idempotency`, WARN, 'no idempotency guard — provider retries may double-apply', rel),
  )

  checks.push(
    t.rawBody.test(body)
      ? check(`${t.id}:raw-body`, PASS, 'reads raw body (signature-safe)', rel)
      : check(`${t.id}:raw-body`, WARN, 'no raw-body read — signature verification may fail on parsed body', rel),
  )

  // A webhook that returns 500 on a downstream failure lets the provider retry;
  // one that swallows everything to 200 can silently drop fulfilment. Flag the
  // latter as worth a human read (heuristic only).
  if (/catch\b[\s\S]{0,400}NextResponse\.json\([^)]*ok[^)]*\)/.test(body)) {
    checks.push(check(`${t.id}:error-swallow`, WARN, 'catch block appears to return ok — verify failures are retried not swallowed', rel))
  }
}

// Live replay (Stripe CLI `stripe trigger`) belongs to the agent/MCP layer.
checks.push(check('live-replay', SKIP, 'replay test events via Stripe MCP / `stripe trigger` to verify end-to-end'))

const result = writeLayer('layer6-webhooks', 'Webhook integrity', checks)
printLayer(result)
