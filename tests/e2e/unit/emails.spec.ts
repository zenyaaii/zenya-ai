import { test, expect } from '@playwright/test'
import {
  domainPurchasedEmail,
  domainRefundEmail,
  planPurchasedEmail,
  paymentReceiptEmail,
  domainExpiringEmail,
  accountDeletedEmail,
  announcementEmail,
} from '../../../lib/email'

// Every transactional email must render: Arabic + RTL, real injected data, a
// subject, and NO unresolved template artifacts (undefined / NaN / ${ / [object]).

type Rendered = { subject: string; text: string; html: string }

const ARABIC = /[؀-ۿ]/
const BROKEN = /undefined|NaN|\[object Object\]|\$\{/

function assertClean(r: Rendered, mustContain: string[]) {
  expect(r.subject, 'subject').toBeTruthy()
  expect(r.subject).toMatch(ARABIC)
  expect(r.text, 'text').toBeTruthy()
  expect(r.html, 'html').toContain('dir="rtl"')
  expect(r.html).toContain('lang="ar"')
  expect(r.html).toMatch(ARABIC)
  for (const needle of mustContain) {
    expect(r.html, `html should contain "${needle}"`).toContain(needle)
  }
  // No leaked template internals anywhere the user would see.
  expect(r.subject, 'subject clean').not.toMatch(BROKEN)
  expect(r.text, 'text clean').not.toMatch(BROKEN)
  expect(r.html, 'html clean').not.toMatch(BROKEN)
}

test('domain purchased email', () => {
  assertClean(
    domainPurchasedEmail({
      domain: 'matjari.com',
      years: 1,
      expiresAt: '2027-07-08T00:00:00Z',
      manageUrl: 'https://zenyaai.co/dashboard/sites',
    }),
    ['matjari.com']
  )
})

test('domain refund email', () => {
  assertClean(
    domainRefundEmail({ domain: 'matjari.com', amountUsd: 17.99, manageUrl: 'https://zenyaai.co' }),
    ['matjari.com', '17.99']
  )
})

test('payment receipt — each plan renders with the amount', () => {
  for (const plan of ['onetime', 'starter', 'pro', 'hosting'] as const) {
    assertClean(
      paymentReceiptEmail({
        plan,
        amountCents: 2499,
        taxCents: 375,
        currency: 'usd',
        country: 'SA',
        receiptNumber: 'ABCD-1234',
        dateIso: '2026-07-08T00:00:00Z',
        manageUrl: 'https://zenyaai.co/dashboard',
      }),
      ['ABCD-1234']
    )
  }
})

test('plan purchased email', () => {
  const r = planPurchasedEmail({ plan: 'hosting', manageUrl: 'https://zenyaai.co/dashboard' })
  assertClean(r, [])
})

test('domain expiring email', () => {
  const r = domainExpiringEmail({
    domain: 'matjari.com',
    daysUntil: 7,
    renewUrl: 'https://zenyaai.co/dashboard/sites',
    retailUsd: 17.99,
  })
  assertClean(r, ['matjari.com', '17.99'])
})

test('account deleted email', () => {
  const r = accountDeletedEmail({ email: 'user@example.com' })
  assertClean(r, [])
})

test('announcement email', () => {
  assertClean(announcementEmail(), [])
})
