import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { buildAuthUrl, callbackUrlFor, gscConfigured } from '@/lib/gsc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/gsc/connect
 * Kicks off the Google OAuth consent flow. Sets a short-lived CSRF `state`
 * cookie (scoped to .zenyaai.co so the callback subdomain can read it), then
 * redirects the user to Google.
 */
export async function GET(req: NextRequest) {
  if (!gscConfigured()) {
    return NextResponse.json({ error: 'gsc_not_configured' }, { status: 503 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Not logged in — bounce to login, then they can retry.
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const host = req.headers.get('host')
  const redirectUri = callbackUrlFor(host)
  const state = randomBytes(16).toString('hex')

  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state))
  const isLocal = (host || '').startsWith('localhost') || (host || '').startsWith('127.0.0.1')
  res.cookies.set('gsc_oauth_state', state, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
    ...(isLocal ? {} : { domain: '.zenyaai.co' }),
  })
  return res
}
