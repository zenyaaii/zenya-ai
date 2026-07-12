import fs from 'fs'
import path from 'path'

const authFile = path.join(__dirname, '..', '.auth', 'user.json')

/**
 * Pull the logged-in test user's Supabase access token (JWT) out of the saved
 * Playwright storage state, so we can hit PostgREST directly AS that user and
 * verify Row-Level Security — not just the app's own ownership checks.
 */
export function getAccessToken(): string {
  const state = JSON.parse(fs.readFileSync(authFile, 'utf8'))
  const cookie = (state.cookies || []).find((c: any) =>
    /^sb-.*-auth-token$/.test(c.name)
  )
  if (!cookie) throw new Error('E2E: auth-token cookie not found in storage state')

  let raw: string = cookie.value
  if (raw.startsWith('base64-')) {
    raw = Buffer.from(raw.slice('base64-'.length), 'base64').toString('utf8')
  }
  const parsed = JSON.parse(raw)
  const token = parsed.access_token
  if (!token) throw new Error('E2E: access_token missing from session cookie')
  return token
}
