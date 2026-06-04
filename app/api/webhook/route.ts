import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Stripe sends raw body for signature verification. Force the runtime to
// avoid Next's default body parsing transforms.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

async function linkStripeCustomer(
  supabase: ReturnType<typeof admin>,
  customerId: string,
  email: string | null,
  userId: string | null
) {
  if (!customerId) return
  await supabase
    .from('stripe_customers')
    .upsert(
      { customer_id: customerId, email: email || '', user_id: userId },
      { onConflict: 'customer_id' }
    )
}

async function logEvent(
  supabase: ReturnType<typeof admin>,
  userId: string | null,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  if (!userId) return
  await supabase.from('activity_logs').insert({
    user_id: userId,
    event_type: eventType,
    metadata: metadata as any,
  })
}

async function recordPurchase(
  supabase: ReturnType<typeof admin>,
  session: Stripe.Checkout.Session,
  userId: string
) {
  // Pull the line item price for the canonical price_id.
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price'],
    limit: 1,
  })
  const priceId =
    typeof lineItems.data[0]?.price === 'string'
      ? lineItems.data[0].price
      : lineItems.data[0]?.price?.id || null

  const customerId = typeof session.customer === 'string' ? session.customer : null
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null

  const taxAmount = session.total_details?.amount_tax ?? 0
  const country = session.customer_details?.address?.country || null

  // Insert purchase (idempotent on stripe_checkout_session_id).
  const { error: purchaseErr } = await supabase.from('purchases').upsert(
    {
      user_id: userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      amount_cents: session.amount_total ?? 0,
      currency: (session.currency || 'usd').toLowerCase(),
      tax_amount_cents: taxAmount,
      tax_country: country,
      status: 'paid',
      paid_at: new Date().toISOString(),
      raw_payload: session as any,
    },
    { onConflict: 'stripe_checkout_session_id' }
  )
  if (purchaseErr) throw purchaseErr

  // Flip the user to Pro on their profile (cached flag the UI reads).
  const { error: profErr } = await supabase
    .from('profiles')
    .update({
      plan: 'pro_lifetime',
      is_pro: true,
      pro_purchased_at: new Date().toISOString(),
      pro_amount_cents: session.amount_total ?? 0,
      pro_currency: (session.currency || 'usd').toLowerCase(),
      pro_stripe_session_id: session.id,
      stripe_customer_id: customerId,
    })
    .eq('id', userId)
  if (profErr) throw profErr

  await logEvent(supabase, userId, 'purchase.completed', {
    session_id: session.id,
    amount_cents: session.amount_total,
    currency: session.currency,
    country,
  })
}

async function recordRefund(
  supabase: ReturnType<typeof admin>,
  charge: Stripe.Charge
) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null
  if (!paymentIntentId) return

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, user_id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (!purchase) return

  await supabase
    .from('purchases')
    .update({ status: 'refunded', refunded_at: new Date().toISOString() })
    .eq('id', purchase.id)

  // Revoke Pro access on refund.
  await supabase
    .from('profiles')
    .update({ plan: 'free', is_pro: false })
    .eq('id', purchase.user_id)

  await logEvent(supabase, purchase.user_id, 'purchase.refunded', {
    charge_id: charge.id,
    payment_intent_id: paymentIntentId,
  })
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') || ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!secret) {
    return NextResponse.json({ error: 'webhook_secret_not_configured' }, { status: 500 })
  }

  const buf = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  const supabase = admin()

  // Idempotency: refuse to re-process the same Stripe event id twice.
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id, processed')
    .eq('id', event.id)
    .maybeSingle()

  if (existing?.processed) {
    return NextResponse.json({ ok: true, idempotent: true })
  }

  if (!existing) {
    await supabase
      .from('stripe_events')
      .insert({ id: event.id, type: event.type, payload: event as any, processed: false })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = (session.client_reference_id as string | null) || null
        const customerId = typeof session.customer === 'string' ? session.customer : null
        const email = session.customer_details?.email || session.customer_email || null

        if (customerId) await linkStripeCustomer(supabase, customerId, email, userId)

        if (
          session.mode === 'payment' &&
          session.payment_status === 'paid' &&
          userId
        ) {
          await recordPurchase(supabase, session, userId)
        }
        break
      }

      case 'customer.created':
      case 'customer.updated': {
        const c = event.data.object as Stripe.Customer
        await linkStripeCustomer(
          supabase,
          c.id,
          c.email || null,
          (c.metadata?.user_id as string | undefined) || null
        )
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await recordRefund(supabase, charge)
        break
      }
    }

    await supabase
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', event.id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    await supabase
      .from('stripe_events')
      .update({ error: err?.message || String(err) })
      .eq('id', event.id)
    // Leave processed=false so Stripe's retries can recover.
    return NextResponse.json({ error: 'processing_error', details: err?.message }, { status: 500 })
  }
}
