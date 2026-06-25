import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import {
  checkDomainCached,
  retailPrice,
  getRegistrationRequirements,
  registerDomain,
  PorkbunError,
} from '@/lib/porkbun'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/domains/purchase
 * Returns the caller's own domain_purchases rows so the dashboard can
 * surface expiry + Renew buttons inline with the existing domains
 * list. Only the fields needed for that UI — no Stripe IDs.
 */
export async function GET() {
  const supabase = createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('domain_purchases')
    .select('id, domain, status, years, expires_at, retail_usd_charged, theme_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'db_error', details: error.message }, { status: 500 })
  }
  return NextResponse.json({ purchases: data || [] })
}

const HOSTNAME = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * POST /api/domains/purchase
 *
 * Body: { domain: string, theme_id?: string, years?: number }
 *
 * Flow:
 *   1. auth check
 *   2. validate domain (format + ownership of theme_id if provided)
 *   3. re-check Porkbun (server-side) — never trust client-supplied price
 *   4. compute retail price via shared markup rule
 *   5. insert pending_payment row in domain_purchases
 *   6. create Stripe Checkout session with inline price_data (because
 *      every domain has a different price)
 *   7. attach metadata so the webhook can route this back to Porkbun
 *
 * Returns: { url } — the Stripe Checkout URL to redirect to.
 */
export async function POST(req: NextRequest) {
  const supabase = createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const domain = String(body?.domain || '').trim().toLowerCase()
  const themeId = body?.theme_id ? String(body.theme_id) : null
  // Client may ask for multiple years, but Porkbun's API registers a
  // fixed term per TLD (almost always 1y) — the create endpoint has no
  // duration param. We re-derive the real term from the registry below
  // so we never charge for years we can't actually deliver.

  if (!HOSTNAME.test(domain)) {
    return NextResponse.json({ error: 'invalid_domain' }, { status: 400 })
  }

  // If a theme is supplied, confirm the user owns it. Prevents one
  // user buying a domain to attach to another user's site.
  if (themeId) {
    const { data: theme } = await supabase
      .from('themes')
      .select('id, user_id')
      .eq('id', themeId)
      .maybeSingle()
    if (!theme || theme.user_id !== user.id) {
      return NextResponse.json({ error: 'theme_not_owned' }, { status: 403 })
    }
  }

  // Re-check Porkbun (via the shared cache). The search the user just
  // ran usually warmed this, so the buy-now click stays inside the
  // registrar's 1-per-10s window instead of failing with a rate-limit.
  let wholesale: number | null = null
  let available = false
  try {
    const r = await checkDomainCached(domain)
    available = r.available
    wholesale = r.price
  } catch (e: any) {
    const err = e as PorkbunError
    console.error('[/api/domains/purchase] porkbun check failed:', err)
    return NextResponse.json(
      { error: err.code || 'lookup_failed', message: err.message },
      { status: err.code === 'rate_limited' ? 429 : 502 }
    )
  }

  if (!available) {
    return NextResponse.json(
      { error: 'unavailable', message: `${domain} is not available.` },
      { status: 409 }
    )
  }
  if (wholesale == null) {
    return NextResponse.json(
      { error: 'no_price', message: 'Porkbun did not return a price for this domain.' },
      { status: 502 }
    )
  }

  // Confirm the TLD can actually be registered through the API and on
  // what term. apiRegisterable:false means it can only be bought on
  // porkbun.com — never take the customer's money for that.
  let years = 1
  try {
    const reqs = await getRegistrationRequirements(domain)
    if (!reqs.apiRegisterable) {
      return NextResponse.json(
        {
          error: 'tld_not_registerable',
          message: `${domain} can't be registered automatically. Please pick a .com, .shop, .store or another supported extension.`,
        },
        { status: 422 }
      )
    }
    years = reqs.registrationDurationYears || 1
  } catch (e: any) {
    // A requirements hiccup shouldn't block the buy — fall through with
    // the safe default term; the dry run below is the real gate.
    console.error('[/api/domains/purchase] getRegistrationRequirements failed:', e?.message || e)
  }

  const retail = retailPrice(wholesale)
  const totalWholesale = +(wholesale * years).toFixed(2)
  const totalRetail = +(retail * years).toFixed(2)
  const amountCents = Math.round(totalRetail * 100)
  // Exact penny figure Porkbun expects for the create call. Sourced from
  // the same fresh price lookup and carried through Stripe metadata so
  // fulfillment registers at precisely the validated price.
  const costCents = Math.round(wholesale * 100)

  // Pre-charge gate: dry-run the registration. This validates
  // availability, exact price, registry eligibility, our account funds
  // and the monthly spend limit WITHOUT charging or registering. If it
  // won't go through, we stop here and the customer is never billed.
  try {
    const preview = await registerDomain({ domain, costCents, dryRun: true })
    if (preview.wouldSucceed === false) {
      console.error(
        '[/api/domains/purchase] dry-run wouldSucceed=false — check Porkbun balance/spend limit:',
        preview.message
      )
      return NextResponse.json(
        {
          error: 'registrar_unavailable',
          message: 'Domain registration is temporarily unavailable. Please try again shortly — you have not been charged.',
        },
        { status: 503 }
      )
    }
  } catch (e: any) {
    const err = e as PorkbunError
    console.error('[/api/domains/purchase] dry-run failed:', err)
    return NextResponse.json(
      {
        error: err.code || 'preflight_failed',
        message: err.message || `${domain} can't be registered right now. You have not been charged.`,
      },
      { status: err.code === 'rate_limited' ? 429 : 422 }
    )
  }

  // Insert pending row so we have a stable id to reference from Stripe
  // metadata. The webhook will look this row up by domain_purchase_id.
  const db = admin()
  const { data: purchase, error: insertErr } = await db
    .from('domain_purchases')
    .insert({
      user_id: user.id,
      theme_id: themeId,
      domain,
      years,
      status: 'pending_payment',
      wholesale_usd: totalWholesale,
      retail_usd_charged: totalRetail,
    })
    .select('id')
    .single()

  if (insertErr || !purchase) {
    console.error('[/api/domains/purchase] db insert failed:', insertErr)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // Build the Checkout session. Inline price_data because every domain
  // has a different price — pre-creating one Stripe Price per domain
  // would litter the dashboard.
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
            name: `Domain: ${domain}`,
            description: years === 1
              ? `1-year registration via Zenya`
              : `${years}-year registration via Zenya`,
          },
        },
      },
    ],
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    metadata: {
      purchase_type: 'domain',
      domain_purchase_id: purchase.id,
      user_id: user.id,
      domain,
      years: String(years),
      cost_cents: String(costCents),
      theme_id: themeId || '',
    },
    payment_intent_data: {
      metadata: {
        purchase_type: 'domain',
        domain_purchase_id: purchase.id,
        user_id: user.id,
        domain,
      },
    },
    success_url: `${origin}/dashboard/sites?domain_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/sites?domain_purchase=cancelled`,
  })

  await db
    .from('domain_purchases')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', purchase.id)

  return NextResponse.json({ url: session.url, purchase_id: purchase.id })
}
