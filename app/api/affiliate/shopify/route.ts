import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  buildShopifyAffiliateUrl,
  PLACEMENTS,
  type AffiliatePlacement,
} from '@/lib/affiliate'

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
 * GET /api/affiliate/shopify?placement=dashboard_post_export
 *
 * Fire-and-forget logs the click to activity_logs (so you can measure
 * which placements convert) then 302s to the Shopify affiliate URL with
 * a subId1 tag for cross-system attribution.
 */
export async function GET(req: NextRequest) {
  const rawPlacement = (req.nextUrl.searchParams.get('placement') || 'unknown') as AffiliatePlacement
  const placement: AffiliatePlacement = PLACEMENTS.includes(rawPlacement) ? rawPlacement : 'unknown'

  // Resolve user id from session if available — clicks from logged-in users
  // are way more interesting than anonymous traffic to us.
  let userId: string | null = null
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id || null
  } catch {
    // ignore — anonymous clicks still count
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req.headers.get('user-agent') || null
  const referrer = req.headers.get('referer') || null

  // Fire-and-forget. Never let logging failures block the redirect.
  admin()
    .from('activity_logs')
    .insert({
      user_id: userId,
      event_type: 'affiliate.shopify_click',
      metadata: { placement, referrer } as any,
      ip_address: ip,
      user_agent: ua,
    })
    .then(() => {})

  return NextResponse.redirect(buildShopifyAffiliateUrl(placement), 302)
}
