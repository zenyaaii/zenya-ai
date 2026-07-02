import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Reached via the Shopify app proxy: a storefront request to
//   https://{shop}/apps/zenya/license
// is forwarded by Shopify to https://zenyaai.co/app/license with the shop
// domain + an HMAC `signature` appended. We verify that signature, resolve
// the shop → linked Zenya account → subscription, and answer whether the
// Zenya-generated theme content is licensed to render right now.
//
// This is the enforcement point for graceful degradation: an inactive
// subscription (cancelled) or an uninstalled app both resolve to
// { active: false }, and the theme block then shows a "reconnect to
// restore" message instead of the premium content — the merchant's base
// store is never touched.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Verify a Shopify app-proxy request signature. Shopify signs proxied
 * requests with an HMAC-SHA256 (hex) of the query params — sorted by key,
 * joined as `key=value` with no separator, excluding `signature` itself —
 * keyed by the app's shared secret.
 */
function verifyProxySignature(searchParams: URLSearchParams, secret: string): boolean {
  const signature = searchParams.get('signature') || ''
  if (!signature) return false

  const params: Record<string, string[]> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key === 'signature') continue
    ;(params[key] ||= []).push(value)
  }

  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key].join(',')}`)
    .join('')

  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex')

  const a = Buffer.from(digest, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function json(active: boolean, status = 200) {
  return NextResponse.json(
    { active },
    { status, headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function GET(req: NextRequest) {
  const secret = process.env.SHOPIFY_API_SECRET || ''
  const params = req.nextUrl.searchParams

  // Reject anything that isn't a genuinely-signed Shopify proxy request.
  if (!secret || !verifyProxySignature(params, secret)) {
    return json(false, 401)
  }

  const shop = params.get('shop') || ''
  if (!shop) return json(false)

  try {
    const supabase = admin()

    // shop → the Zenya account(s) that connected it.
    const { data: connections } = await supabase
      .from('shopify_connections')
      .select('user_id')
      .eq('shop', shop)

    const userIds = (connections || []).map((c) => c.user_id)
    if (userIds.length === 0) return json(false)

    // Licensed if ANY linked account currently holds a paid entitlement.
    // profiles.is_pro is the cached flag flipped by the Stripe webhook on
    // subscribe/cancel, and it's true for starter/pro/pro_onetime/
    // pro_hosting/admin, false for free.
    const { data: profiles } = await supabase
      .from('profiles')
      .select('is_pro')
      .in('id', userIds)

    const active = (profiles || []).some((p) => p.is_pro === true)
    return json(active)
  } catch {
    // Fail OPEN on our own errors: a Zenya-side hiccup must never make a
    // paying merchant's storefront look broken. Only an explicit, verified
    // "not licensed" answer degrades the content.
    return json(true)
  }
}
