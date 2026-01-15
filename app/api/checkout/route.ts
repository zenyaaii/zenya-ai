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

  let priceId = process.env.STRIPE_PRICE_ID_BIMONTHLY || ''
  if (!priceId) {
    const productId = process.env.STRIPE_PRODUCT_ID || ''
    if (!productId) return NextResponse.json({ error: 'missing_product' }, { status: 500 })
    
    try {
      const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
      const biMonthly = prices.data.find(p => p.recurring && p.recurring.interval === 'month' && p.recurring.interval_count === 2)
      if (biMonthly) {
        priceId = biMonthly.id
      } else {
        const created = await stripe.prices.create({
          product: productId,
          currency: 'usd',
          unit_amount: 499,
          recurring: { interval: 'month', interval_count: 1 }
        })
        priceId = created.id
      }
    } catch (e: any) {
      console.error('Stripe price lookup failed:', e)
      return NextResponse.json({ error: 'stripe_error', details: e.message }, { status: 500 })
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { trial_period_days: 14 },
      success_url: origin + '/dashboard',
      cancel_url: origin + '/dashboard'
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout creation failed:', e)
    return NextResponse.json({ error: 'stripe_checkout_error', details: e.message }, { status: 500 })
  }
}
