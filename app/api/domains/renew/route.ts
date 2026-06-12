import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { checkDomainCached, retailPrice, PorkbunError } from '@/lib/porkbun'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * POST /api/domains/renew
 *
 * Body: { purchase_id: string, years?: number }
 *
 * Renews an existing active domain. Pulls the live renewal price from
 * Porkbun (renewal can differ from first-year — especially on .com new
 * registrations), applies our markup, charges via Stripe Checkout.
 *
 * Flow:
 *   1. auth + ownership check on domain_purchases row
 *   2. re-check Porkbun → get renewal wholesale (regularPrice, not the
 *      first-year promo price)
 *   3. create Stripe Checkout with purchase_type=domain_renew metadata
 *   4. return checkout URL
 *
 * Doesn't insert a new domain_purchases row — the webhook bumps the
 * existing row's expires_at instead, keeping one row per domain.
 * Activity logs record the renewal event for audit.
 */
export async function POST(req: NextRequest) {
  const supabase = createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const purchaseId = String(body?.purchase_id || '')
  const years = Math.max(1, Math.min(10, Number(body?.years) || 1))
  if (!purchaseId) return NextResponse.json({ error: 'missing_purchase_id' }, { status: 400 })

  const db = admin()
  const { data: purchase } = await db
    .from('domain_purchases')
    .select('id, user_id, domain, status, expires_at')
    .eq('id', purchaseId)
    .maybeSingle()

  if (!purchase) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (purchase.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (purchase.status !== 'active') {
    return NextResponse.json(
      { error: 'not_renewable', message: `Domain is ${purchase.status}, not active.` },
      { status: 409 }
    )
  }

  // Live renewal price from Porkbun. Use regularPrice (renewal), not
  // the firstYearPromo price — that one only applies to brand-new
  // registrations and would understate the cost.
  let renewalWholesale: number | null = null
  try {
    const r = await checkDomainCached(purchase.domain)
    renewalWholesale = r.regularPrice
  } catch (e: any) {
    const err = e as PorkbunError
    return NextResponse.json(
      { error: 'lookup_failed', message: err.message },
      { status: 502 }
    )
  }

  if (renewalWholesale == null) {
    return NextResponse.json(
      { error: 'no_price', message: 'Porkbun did not return a renewal price for this domain.' },
      { status: 502 }
    )
  }

  const retail = retailPrice(renewalWholesale)
  const totalRetail = +(retail * years).toFixed(2)
  const amountCents = Math.round(totalRetail * 100)

  const origin = req.headers.get('origin') || ''
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: user.id,
    customer_email: user.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `Renew: ${purchase.domain}`,
            description: years === 1
              ? `1-year renewal via Zenya`
              : `${years}-year renewal via Zenya`,
          },
        },
      },
    ],
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    metadata: {
      purchase_type: 'domain_renew',
      domain_purchase_id: purchase.id,
      user_id: user.id,
      domain: purchase.domain,
      years: String(years),
      wholesale_usd: String(renewalWholesale * years),
      retail_usd: String(totalRetail),
    },
    payment_intent_data: {
      metadata: {
        purchase_type: 'domain_renew',
        domain_purchase_id: purchase.id,
        domain: purchase.domain,
      },
    },
    success_url: `${origin}/dashboard/domains?renew=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/domains?renew=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
