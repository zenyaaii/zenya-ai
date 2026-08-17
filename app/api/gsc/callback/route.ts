import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { exchangeCode, callbackUrlFor, emailFromIdToken } from '@/lib/gsc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** Land the user back on the SEO page with a status flag (+ optional reason). */
function backToSeo(req: NextRequest, status: string, reason?: string) {
  const host = req.headers.get('host') || 'dashboard.zenyaai.co'
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  const base = isLocal ? `http://${host}` : `https://${host}`
  const url = new URL('/dashboard/seo', base)
  url.searchParams.set('gsc', status)
  if (reason) url.searchParams.set('gsc_reason', reason.slice(0, 64))
  const res = NextResponse.redirect(url)
  res.cookies.delete('gsc_oauth_state')
  return res
}

/**
 * GET /api/gsc/callback
 * Google redirects here with ?code & ?state. We verify the CSRF state, exchange
 * the code for tokens, and persist the refresh token for the logged-in user.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err = url.searchParams.get('error')

  if (err) return backToSeo(req, 'denied')
  if (!code || !state) return backToSeo(req, 'error')

  // CSRF: state must match the cookie we set in /connect.
  const cookieState = req.cookies.get('gsc_oauth_state')?.value
  if (!cookieState || cookieState !== state) return backToSeo(req, 'error')

  // Must be the same logged-in user (their Supabase cookie rides along).
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return backToSeo(req, 'error')

  const redirectUri = callbackUrlFor(req.headers.get('host'))
  const tokens = await exchangeCode(code, redirectUri)
  if (!tokens.access_token || !tokens.refresh_token) {
    console.error('[gsc/callback] token exchange failed', tokens.error, tokens.error_description, 'redirect_uri=', redirectUri)
    return backToSeo(req, 'error', tokens.error)
  }

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()
  const a = admin()
  const { error } = await a.from('gsc_connections').upsert(
    {
      user_id: user.id,
      google_email: emailFromIdToken(tokens.id_token),
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      token_expiry: expiry,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    console.error('[gsc/callback] store failed', error)
    return backToSeo(req, 'error')
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'gsc.connected',
    metadata: { email: emailFromIdToken(tokens.id_token) } as any,
  }).then(() => {}, () => {})

  return backToSeo(req, 'connected')
}
