import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Create a one-time Stripe Customer Portal session for the authenticated
 * user and return the redirect URL. Each session is scoped to a single
 * Stripe customer and expires after a few minutes — the standard pattern.
 *
 * If the user has never paid (no stripe_customers row yet), we return 409
 * so the UI can show "Upgrade first" instead of a portal link.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // stripe_customers is service-role-only; use admin client to look up the
  // Stripe customer id mapped to this Supabase user.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: row } = await admin
    .from('stripe_customers')
    .select('customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row?.customer_id) {
    return NextResponse.json(
      { error: 'no_customer', message: 'You don\'t have a subscription yet. Upgrade to Pro first.' },
      { status: 409 }
    )
  }

  const origin =
    req.headers.get('origin') ||
    req.nextUrl.origin ||
    'https://zenyaai.co'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: row.customer_id,
      return_url: `${origin}/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('[portal] session create failed:', e)
    return NextResponse.json(
      { error: 'portal_error', details: e?.message },
      { status: 500 }
    )
  }
}
