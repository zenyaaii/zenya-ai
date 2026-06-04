import type Stripe from 'stripe'
import { stripe } from './stripe'

const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB',
])

export function pickPriceId(country: string | null | undefined): { priceId: string; currency: 'usd' | 'eur' } | { error: string } {
  const code = (country || '').toUpperCase()
  const wantsEur = code && EUR_COUNTRIES.has(code)

  const usd = process.env.STRIPE_PRICE_ID || ''
  const eur = process.env.STRIPE_PRICE_ID_EUR || ''

  if (wantsEur && eur) return { priceId: eur, currency: 'eur' }
  if (usd) return { priceId: usd, currency: 'usd' }
  if (eur) return { priceId: eur, currency: 'eur' }
  return { error: 'No STRIPE_PRICE_ID or STRIPE_PRICE_ID_EUR configured.' }
}

export async function createOneTimeCheckoutSession(opts: {
  userId: string
  email: string | null | undefined
  country: string | null | undefined
  origin: string
}): Promise<Stripe.Checkout.Session> {
  const picked = pickPriceId(opts.country)
  if ('error' in picked) throw new Error(picked.error)

  return stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: opts.userId,
    customer_email: opts.email || undefined,
    line_items: [{ price: picked.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    payment_intent_data: {
      metadata: { user_id: opts.userId },
    },
    metadata: { user_id: opts.userId, plan: 'zenya_pro_lifetime' },
    success_url: `${opts.origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/pricing?checkout=cancelled`,
  })
}
