import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const origin = req.headers.get('origin') || ''

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ url: origin + '/dashboard?demo_success=true' })
  }

  // Resolve the price to charge. Prefer an explicit env var; otherwise reuse
  // the first active recurring price on the product. Never auto-create prices
  // here — that produced duplicates on every cold call.
  let priceId =
    process.env.STRIPE_PRICE_ID ||
    process.env.STRIPE_PRICE_ID_BIMONTHLY ||
    ''

  if (!priceId) {
    const productId = process.env.STRIPE_PRODUCT_ID || ''
    if (!productId) {
      return NextResponse.json({ error: 'missing_product' }, { status: 500 })
    }

    try {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      })
      const recurring = prices.data.find((p) => p.recurring)
      if (!recurring) {
        return NextResponse.json(
          { error: 'no_active_price', details: 'No active recurring price on this product. Create one in the Stripe Dashboard.' },
          { status: 500 }
        )
      }
      priceId = recurring.id
    } catch (e: any) {
      console.error('Stripe price lookup failed:', e)
      return NextResponse.json({ error: 'stripe_error', details: e.message }, { status: 500 })
    }
  }

  try {
    // NB: omitting `payment_method_types` lets Stripe Checkout show every
    // method enabled on the account (card, link, klarna, amazon_pay,
    // revolut_pay, etc.) based on the customer's country & currency.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: { trial_period_days: 14 },
      success_url: origin + '/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/dashboard?checkout=cancelled',
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout creation failed:', e)
    return NextResponse.json({ error: 'stripe_checkout_error', details: e.message }, { status: 500 })
  }
}
