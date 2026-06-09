import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * POST /api/admin/refund-domain
 * Body: { purchase_id }
 *
 * Issues a full Stripe refund for the original payment intent and
 * flips domain_purchases.status to 'refunded'. Logs an activity row
 * so we can later see who triggered it.
 *
 * Does NOT attempt to un-register the domain at Porkbun — that's a
 * one-way action and the operator might still want the user to keep
 * the name for the year they paid for. Surface this in the confirm
 * dialog on the client side.
 *
 * Admin gate: profile.plan === 'admin'.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.plan !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { body = {} }
  const purchaseId = String(body?.purchase_id || '')
  if (!purchaseId) {
    return NextResponse.json({ error: 'missing_purchase_id' }, { status: 400 })
  }

  const db = adminDb()
  const { data: purchase } = await db
    .from('domain_purchases')
    .select('id, user_id, domain, stripe_payment_intent_id, status, retail_usd_charged')
    .eq('id', purchaseId)
    .maybeSingle()

  if (!purchase) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (purchase.status === 'refunded') {
    return NextResponse.json({ ok: true, idempotent: true })
  }
  if (!purchase.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'no_payment_intent' }, { status: 400 })
  }

  try {
    await stripe.refunds.create({
      payment_intent: purchase.stripe_payment_intent_id,
      reason: 'requested_by_customer',
      metadata: {
        purchase_type: 'domain',
        domain_purchase_id: purchase.id,
        domain: purchase.domain,
        refunded_by_admin: user.id,
      },
    })
  } catch (e: any) {
    console.error('[/api/admin/refund-domain] stripe refund failed:', e)
    return NextResponse.json(
      { error: 'stripe_refund_failed', message: e?.message || String(e) },
      { status: 502 }
    )
  }

  await db
    .from('domain_purchases')
    .update({
      status: 'refunded',
      error_message: null,
    })
    .eq('id', purchaseId)

  await db.from('activity_logs').insert({
    user_id: purchase.user_id,
    event_type: 'domain_purchase.refunded_by_admin',
    metadata: {
      domain: purchase.domain,
      purchase_id: purchase.id,
      refunded_amount_usd: purchase.retail_usd_charged,
      admin_user_id: user.id,
    } as any,
  })

  return NextResponse.json({ ok: true })
}
