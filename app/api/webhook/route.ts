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

function toIsoOrNull(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null
  return new Date(unixSeconds * 1000).toISOString()
}

async function upsertSubscriptionFromStripe(
  supabase: ReturnType<typeof admin>,
  sub: Stripe.Subscription,
  userIdHint?: string | null
) {
  // Resolve user_id: prefer the hint (from checkout.session.completed) or
  // metadata.user_id; otherwise look up via stripe_customers mapping.
  let userId = userIdHint || (sub.metadata?.user_id as string | undefined) || null
  if (!userId && typeof sub.customer === 'string') {
    const { data } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', sub.customer)
      .maybeSingle()
    userId = data?.user_id || null
  }

  if (!userId) {
    console.warn('[stripe webhook] subscription event with no resolvable user_id', sub.id)
    return
  }

  const item = sub.items?.data?.[0]
  const row = {
    id: sub.id,
    user_id: userId,
    status: sub.status,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : null,
    price_id: item?.price?.id || null,
    quantity: item?.quantity ?? null,
    cancel_at_period_end: sub.cancel_at_period_end ?? null,
    current_period_start: toIsoOrNull((sub as any).current_period_start),
    current_period_end: toIsoOrNull((sub as any).current_period_end),
    ended_at: toIsoOrNull(sub.ended_at as number | null),
    cancel_at: toIsoOrNull(sub.cancel_at as number | null),
    canceled_at: toIsoOrNull(sub.canceled_at as number | null),
    trial_start: toIsoOrNull(sub.trial_start as number | null),
    trial_end: toIsoOrNull(sub.trial_end as number | null),
  }

  const { error } = await supabase.from('subscriptions').upsert(row, { onConflict: 'id' })
  if (error) throw error

  // Mirror the active/trialing flag onto profile for quick checks in UI.
  const isActive = ['active', 'trialing'].includes(sub.status)
  await supabase
    .from('profiles')
    .update({ is_subscribed: isActive })
    .eq('id', userId)
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
      {
        customer_id: customerId,
        email: email || '',
        user_id: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'customer_id' }
    )
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
  // stripe_events is created with (id PK, type, payload, created_at, processed).
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

        // One-time payment path: lifetime Pro access. Stripe sends
        // payment_status=paid the moment the charge succeeds — anything
        // else (unpaid, no_payment_required) means we shouldn't unlock yet.
        if (session.mode === 'payment' && session.payment_status === 'paid' && userId) {
          await supabase.from('profiles').update({ is_subscribed: true }).eq('id', userId)
        }

        // Legacy subscription path (kept harmless in case any older sessions
        // still complete during a transition window).
        if (typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription)
          await upsertSubscriptionFromStripe(supabase, sub, userId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscriptionFromStripe(supabase, sub)
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

      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        // Keep subscription row in sync when invoice events touch it.
        const inv = event.data.object as Stripe.Invoice
        const subId = (inv as any).subscription
        if (typeof subId === 'string') {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertSubscriptionFromStripe(supabase, sub)
        }
        break
      }
    }

    await supabase.from('stripe_events').update({ processed: true }).eq('id', event.id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    // Leave processed=false so Stripe's retries can recover.
    return NextResponse.json({ error: 'processing_error', details: err?.message }, { status: 500 })
  }
}
