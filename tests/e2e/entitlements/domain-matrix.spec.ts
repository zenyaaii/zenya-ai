import { test, expect } from '@playwright/test'
import { isProProfile, priceDomainFor } from '../../../lib/domain-entitlement'

/**
 * Entitlement matrix for the DOMAIN perks (free 1-yr domain + 30% off), which
 * the pricing page reserves for **Pro only** ("نطاق مخصّص — في خطة Pro").
 *
 * These are pure decisions, so we can assert them deterministically for a
 * simulated profile at every plan level — i.e. "if I were a Starter/Pro user,
 * what would the server let me do?" — without touching Stripe or Porkbun.
 *
 * Profiles mirror exactly what app/api/webhook sets for each subscription:
 *   starter → { plan:'starter', is_pro:true,  has_hosting:false }
 *   pro     → { plan:'pro',     is_pro:true,  has_hosting:true  }
 */
// Cheap promotional TLD (.store / .site / .online / .shop) — wholesale
// ≤ $4 → qualifies for the free perk.
const CHEAP_DOMAIN = { wholesale: 2.99, retail: 7.99, premium: false }
// A normal .com — wholesale sits around $10 → above the free cap, so
// Pro users get 30% off, not free.
const STANDARD_DOMAIN = { wholesale: 10.13, retail: 15.99, premium: false }

const PROFILES = {
  free: { plan: 'free', is_pro: false, has_hosting: false, free_domain_claimed_at: null },
  starter: { plan: 'starter', is_pro: true, has_hosting: false, free_domain_claimed_at: null },
  pro: { plan: 'pro', is_pro: true, has_hosting: true, free_domain_claimed_at: null },
  pro_hosting: { plan: 'pro_hosting', is_pro: true, has_hosting: true, free_domain_claimed_at: null },
  pro_onetime: { plan: 'pro_onetime', is_pro: true, has_hosting: false, free_domain_claimed_at: null },
  admin: { plan: 'admin', is_pro: true, has_hosting: true, free_domain_claimed_at: null },
} as const

test.describe('domain entitlement matrix', () => {
  test('Free users get no domain perk (full price)', () => {
    expect(isProProfile(PROFILES.free)).toBe(false)
    expect(priceDomainFor(PROFILES.free, CHEAP_DOMAIN)).toBe('standard')
    expect(priceDomainFor(PROFILES.free, STANDARD_DOMAIN)).toBe('standard')
  })

  test('Pro users get the free perk on cheap-wholesale TLDs', () => {
    expect(isProProfile(PROFILES.pro)).toBe(true)
    expect(priceDomainFor(PROFILES.pro, CHEAP_DOMAIN)).toBe('free')
  })

  test('Pro users get 30% off on domains above the wholesale cap (e.g. .com)', () => {
    // .com wholesale is > $4 → 30% off, not free.
    expect(priceDomainFor(PROFILES.pro, STANDARD_DOMAIN)).toBe('pro')
  })

  test('legacy Pro-hosting, grandfathered pro_onetime, and admin get the free perk on cheap domains', () => {
    expect(priceDomainFor(PROFILES.pro_hosting, CHEAP_DOMAIN)).toBe('free')
    expect(priceDomainFor(PROFILES.pro_onetime, CHEAP_DOMAIN)).toBe('free')
    expect(priceDomainFor(PROFILES.admin, CHEAP_DOMAIN)).toBe('free')
  })

  test('a Pro who already claimed their free domain only gets 30% off', () => {
    const claimed = { ...PROFILES.pro, free_domain_claimed_at: '2026-01-01T00:00:00Z' }
    expect(priceDomainFor(claimed, CHEAP_DOMAIN)).toBe('pro')
  })

  test('premium domains are never free, even for Pro', () => {
    expect(priceDomainFor(PROFILES.pro, { wholesale: 2.0, retail: 500, premium: true })).toBe('pro')
  })

  // Regression guard for the fixed leak: Starter ($14.99) must NOT receive
  // the Pro-only free domain, even though the webhook sets is_pro=true for it.
  test('Starter does NOT get the Pro-only free domain (fixed leak)', () => {
    expect(isProProfile(PROFILES.starter)).toBe(false)
    expect(priceDomainFor(PROFILES.starter, CHEAP_DOMAIN)).toBe('standard')
  })
})
