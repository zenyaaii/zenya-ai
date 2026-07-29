/**
 * Server-only analytics helpers: identity hashing and slug→theme resolution.
 *
 * NEVER import this into client code — it reads the service-role key.
 */

import { createHash } from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export function analyticsAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Cookieless visitor identity.
 *
 * digest(ip + user-agent + theme + daily-rotating salt)
 *
 * Three properties that matter:
 *   - The raw IP is consumed and never stored, so the row cannot be traced
 *     back to a person.
 *   - The salt includes the UTC date, so the same visitor produces a DIFFERENT
 *     hash tomorrow. That deliberately caps how long anyone can be followed —
 *     it makes "unique visitors today" answerable and "track this person for a
 *     month" impossible.
 *   - The theme id is mixed in, so the same person visiting two different
 *     customer sites is never correlatable across them.
 *
 * This is the same construction Plausible uses and is what lets the customer
 * site keep its "بلا ملفات ارتباط، وبلا متتبّعات" promise literally.
 */
export function visitorHash(input: {
  ip: string | null
  userAgent: string | null
  themeId: string
  date?: Date
}): string {
  const day = (input.date || new Date()).toISOString().slice(0, 10)
  const secret =
    process.env.ANALYTICS_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'zenya-analytics'
  return createHash('sha256')
    .update(`${day}|${secret}|${input.themeId}|${input.ip || 'noip'}|${input.userAgent || 'noua'}`)
    .digest('base64url')
    .slice(0, 22)
}

/**
 * First hop of x-forwarded-for — the real client on Vercel.
 * Takes anything header-shaped so it works with both the Fetch `Headers` of a
 * route handler and the `ReadonlyHeaders` of a server component.
 */
export function clientIpFrom(headers: { get(name: string): string | null }): string | null {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') || null
}

/* ─── slug → theme cache ─────────────────────────────────────────────────── */
// The beacon fires on every pageview, so resolving the slug must not cost a
// DB round-trip each time. Published sites change rarely; 5 minutes of
// staleness is harmless (worst case a just-published site isn't counted for a
// few minutes) and saves a query per hit.

type CachedTheme = { id: string; slug: string } | null
const themeCache = new Map<string, { value: CachedTheme; expires: number }>()
const THEME_TTL_MS = 5 * 60 * 1000

export async function resolveThemeBySlug(slug: string): Promise<CachedTheme> {
  const key = slug.toLowerCase()
  const hit = themeCache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value

  const a = analyticsAdmin()
  const { data } = await a
    .from('themes')
    .select('id, slug')
    .ilike('slug', key)
    .eq('is_published', true)
    .maybeSingle()

  const value: CachedTheme = data ? { id: data.id, slug: data.slug } : null
  themeCache.set(key, { value, expires: Date.now() + THEME_TTL_MS })
  return value
}

/* ─── burst limiter ──────────────────────────────────────────────────────── */
// Per-instance, in-memory. The ingest endpoint is unauthenticated by
// necessity (public visitors hit it), so it needs a cap — but it must be cheap
// enough that legitimate traffic never pays a DB round-trip for the check.

const buckets = new Map<string, { count: number; resetAt: number }>()
const BURST_MAX = 120
const BURST_WINDOW_MS = 60_000

export function withinBurstLimit(key: string): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + BURST_WINDOW_MS })
    // Opportunistic sweep so the map can't grow without bound.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
    }
    return true
  }
  b.count++
  return b.count <= BURST_MAX
}
