/**
 * Google Search Console integration (server-only).
 *
 * Per-user OAuth: each Zenya user connects their own Google account (the one
 * that owns their Search Console property). We store the refresh token in the
 * RLS-locked `gsc_connections` table and use it to pull live search-performance
 * data (impressions, clicks, position, top queries) for their sites.
 *
 * No `googleapis` dependency — plain fetch against Google's REST endpoints.
 * NEVER import this into client code: it reads secrets + tokens.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const WMX_BASE = 'https://www.googleapis.com/webmasters/v3'

// webmasters.readonly → Search Console data. openid+email → show which account.
export const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'openid',
  'email',
].join(' ')

export function gscConfigured(): boolean {
  return !!process.env.GOOGLE_OAUTH_CLIENT_ID && !!process.env.GOOGLE_OAUTH_CLIENT_SECRET
}

/** Build the exact callback URL for this request host (must match a registered URI). */
export function callbackUrlFor(host: string | null): string {
  const h = host || 'dashboard.zenyaai.co'
  const proto = h.startsWith('localhost') || h.startsWith('127.0.0.1') ? 'http' : 'https'
  return `${proto}://${h}/api/gsc/callback`
}

/** Google consent URL. `state` is our CSRF token. */
export function buildAuthUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GSC_SCOPES,
    access_type: 'offline',   // get a refresh token
    prompt: 'consent',        // force refresh_token even on re-connect
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTH_ENDPOINT}?${p.toString()}`
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  id_token?: string
  error?: string
  error_description?: string
}

/** Exchange the auth code for tokens. */
export async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const r = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  return (await r.json()) as TokenResponse
}

/** Trade a refresh token for a fresh access token. */
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const r = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  return (await r.json()) as TokenResponse
}

/** Best-effort email extraction from an id_token (no verification — came from Google over TLS). */
export function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null
  try {
    const payload = idToken.split('.')[1]
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return typeof json.email === 'string' ? json.email : null
  } catch {
    return null
  }
}

/**
 * Return a valid access token for a user, refreshing (and persisting) if the
 * cached one is missing or within 60s of expiry. `admin` must be a
 * service-role client (bypasses RLS). Returns null if the user isn't connected.
 */
export async function getValidAccessToken(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: conn } = await admin
    .from('gsc_connections')
    .select('refresh_token, access_token, token_expiry')
    .eq('user_id', userId)
    .maybeSingle()
  if (!conn?.refresh_token) return null

  const stillValid =
    conn.access_token &&
    conn.token_expiry &&
    new Date(conn.token_expiry).getTime() - Date.now() > 60_000
  if (stillValid) return conn.access_token as string

  const refreshed = await refreshAccessToken(conn.refresh_token as string)
  if (!refreshed.access_token) return null

  const expiry = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString()
  await admin
    .from('gsc_connections')
    .update({ access_token: refreshed.access_token, token_expiry: expiry, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return refreshed.access_token
}

/** List the Search Console properties this account can access. */
export async function listSites(accessToken: string): Promise<string[]> {
  const r = await fetch(`${WMX_BASE}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!r.ok) return []
  const j = await r.json()
  return (j.siteEntry || []).map((s: any) => s.siteUrl as string)
}

export type SearchAnalyticsRow = {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/**
 * Query search analytics for a property. `siteUrl` must be a property the
 * account owns (URL-prefix like `https://slug.zenyaai.co/` or `sc-domain:...`).
 */
export async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; rows: SearchAnalyticsRow[] }> {
  const r = await fetch(
    `${WMX_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  if (!r.ok) return { ok: false, status: r.status, rows: [] }
  const j = await r.json()
  return { ok: true, status: 200, rows: (j.rows || []) as SearchAnalyticsRow[] }
}

/**
 * Given the account's properties and a site's public URL, pick the matching
 * Search Console property. Tries the exact URL-prefix, then a domain property.
 */
export function matchProperty(siteUrl: string, properties: string[]): string | null {
  const withSlash = siteUrl.endsWith('/') ? siteUrl : siteUrl + '/'
  // exact URL-prefix property
  const exact = properties.find((p) => p === withSlash || p === siteUrl)
  if (exact) return exact
  // domain property covering this host, e.g. sc-domain:zenyaai.co
  try {
    const host = new URL(siteUrl).hostname
    const domainProp = properties.find(
      (p) => p.startsWith('sc-domain:') && host.endsWith(p.slice('sc-domain:'.length)),
    )
    if (domainProp) return domainProp
  } catch {}
  return null
}
