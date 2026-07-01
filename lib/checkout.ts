import type Stripe from 'stripe'
import { stripe } from './stripe'

const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB',
])

export type PlanId = 'onetime' | 'hosting' | 'starter' | 'pro'

type Picked = { priceId: string; currency: 'usd' | 'eur' }

function wantsEur(country: string | null | undefined) {
  const code = (country || '').toUpperCase()
  return code !== '' && EUR_COUNTRIES.has(code)
}

export function pickPriceId(
  plan: PlanId,
  country: string | null | undefined
): Picked | { error: string } {
  const isEu = wantsEur(country)

  if (plan === 'onetime') {
    const usd = process.env.STRIPE_PRICE_ID || ''
    const eur = process.env.STRIPE_PRICE_ID_EUR || ''
    if (isEu && eur) return { priceId: eur, currency: 'eur' }
    if (usd) return { priceId: usd, currency: 'usd' }
    if (eur) return { priceId: eur, currency: 'eur' }
    return { error: 'No one-time price configured (STRIPE_PRICE_ID / _EUR).' }
  }

  if (plan === 'starter') {
    const usd = process.env.STRIPE_PRICE_ID_STARTER_USD || ''
    const eur = process.env.STRIPE_PRICE_ID_STARTER_EUR || ''
    if (isEu && eur) return { priceId: eur, currency: 'eur' }
    if (usd) return { priceId: usd, currency: 'usd' }
    if (eur) return { priceId: eur, currency: 'eur' }
    return { error: 'No Starter price configured (STRIPE_PRICE_ID_STARTER_*).' }
  }

  if (plan === 'pro') {
    const usd = process.env.STRIPE_PRICE_ID_PRO_USD || ''
    const eur = process.env.STRIPE_PRICE_ID_PRO_EUR || ''
    if (isEu && eur) return { priceId: eur, currency: 'eur' }
    if (usd) return { priceId: usd, currency: 'usd' }
    if (eur) return { priceId: eur, currency: 'eur' }
    return { error: 'No Pro price configured (STRIPE_PRICE_ID_PRO_*).' }
  }

  // hosting (legacy recurring monthly — grandfathered customers only)
  const usd = process.env.STRIPE_PRICE_ID_HOSTING_USD || ''
  const eur = process.env.STRIPE_PRICE_ID_HOSTING_EUR || ''
  if (isEu && eur) return { priceId: eur, currency: 'eur' }
  if (usd) return { priceId: usd, currency: 'usd' }
  if (eur) return { priceId: eur, currency: 'eur' }
  return { error: 'No hosting price configured (STRIPE_PRICE_ID_HOSTING_*).' }
}

export async function createCheckoutSession(opts: {
  plan: PlanId
  userId: string
  email: string | null | undefined
  country: string | null | undefined
  origin: string
}): Promise<Stripe.Checkout.Session> {
  const picked = pickPriceId(opts.plan, opts.country)
  if ('error' in picked) throw new Error(picked.error)

  const baseCommon = {
    client_reference_id: opts.userId,
    customer_email: opts.email || undefined,
    line_items: [{ price: picked.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: 'required' as const,
    automatic_tax: { enabled: true },
    metadata: { user_id: opts.userId, plan: opts.plan },
    success_url: `${opts.origin}/dashboard?checkout=success&plan=${opts.plan}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/pricing?checkout=cancelled&plan=${opts.plan}`,
  }

  if (opts.plan === 'onetime') {
    return stripe.checkout.sessions.create({
      ...baseCommon,
      mode: 'payment',
      payment_intent_data: {
        metadata: { user_id: opts.userId, plan: 'onetime' },
      },
    })
  }

  return stripe.checkout.sessions.create({
    ...baseCommon,
    mode: 'subscription',
    subscription_data: {
      metadata: { user_id: opts.userId, plan: opts.plan },
    },
  })
}

// Back-compat wrapper for any older callers that imported the legacy name.
export const createOneTimeCheckoutSession = (opts: Omit<Parameters<typeof createCheckoutSession>[0], 'plan'>) =>
  createCheckoutSession({ ...opts, plan: 'onetime' })
