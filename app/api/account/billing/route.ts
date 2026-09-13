import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/account/billing — the signed-in owner's saved card and invoices,
 * read live from Stripe for the billing screen.
 *
 * Zenya stores neither: the card and the invoices exist only in Stripe, under
 * the customer mapped in stripe_customers. An owner who has never paid has no
 * customer, and gets an honest empty answer rather than an error.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // stripe_customers is service-role-only.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { data: row } = await admin
    .from('stripe_customers')
    .select('customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row?.customer_id) return NextResponse.json({ card: null, invoices: [] })

  try {
    const customer: any = await stripe.customers.retrieve(row.customer_id, {
      expand: ['invoice_settings.default_payment_method'],
    })
    let pm: any = customer?.deleted ? null : customer?.invoice_settings?.default_payment_method
    if (!pm || typeof pm === 'string') {
      const list = await stripe.paymentMethods.list({ customer: row.customer_id, type: 'card', limit: 1 })
      pm = list.data[0] || null
    }
    const card = pm?.card
      ? { brand: pm.card.brand, last4: pm.card.last4, exp_month: pm.card.exp_month, exp_year: pm.card.exp_year }
      : null

    const list = await stripe.invoices.list({ customer: row.customer_id, limit: 24 })
    const invoices = list.data
      .filter((i) => i.status && i.status !== 'draft')
      .map((i) => ({
        number: i.number || i.id,
        created: i.created * 1000,
        amount: i.status === 'paid' ? i.amount_paid : i.amount_due,
        currency: i.currency,
        status: i.status,
        pdf: i.invoice_pdf || i.hosted_invoice_url || null,
      }))

    return NextResponse.json({ card, invoices })
  } catch (e: any) {
    console.error('[billing] stripe read failed:', e?.message)
    return NextResponse.json({ error: 'stripe_error' }, { status: 502 })
  }
}
