import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  addDomainToProject,
  fetchDomainSummary,
  VercelDomainError,
} from '@/lib/vercel-domains'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Loose RFC-ish hostname check — Vercel will reject anything stricter; we
// just want to reject obvious garbage before the API hop.
const HOSTNAME = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

/**
 * GET /api/domains — list the caller's connected domains.
 */
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('domains')
    .select('id, domain, theme_id, status, verified_at, last_checked_at, error_message, is_primary, created_at')
    .eq('user_id', user.id)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })

  return NextResponse.json({ domains: data || [] })
}

/**
 * POST /api/domains { theme_id, domain }
 *
 * Adds a custom domain to the Vercel project, writes a row in `domains`,
 * returns the DNS records the user needs to add. Requires hosting plan.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const themeId = String(body?.theme_id || '').trim()
  const domain = normalizeDomain(String(body?.domain || ''))

  if (!HOSTNAME.test(domain)) {
    return NextResponse.json({ error: 'invalid_domain', message: 'That doesn’t look like a valid domain (e.g. mycoolstore.com).' }, { status: 400 })
  }
  if (!themeId) {
    return NextResponse.json({ error: 'invalid_theme_id' }, { status: 400 })
  }

  // 1. Verify theme ownership + that it's published
  const { data: theme } = await supabase
    .from('themes')
    .select('id, user_id, slug, is_published')
    .eq('id', themeId)
    .maybeSingle()

  if (!theme || theme.user_id !== user.id) {
    return NextResponse.json({ error: 'theme_not_found_or_forbidden' }, { status: 403 })
  }
  if (!theme.is_published || !theme.slug) {
    return NextResponse.json(
      { error: 'theme_not_published', message: 'Publish this theme to Zenya first, then connect a domain.' },
      { status: 400 }
    )
  }

  // 2. Verify hosting entitlement
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, has_hosting')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || (!profile.has_hosting && profile.plan !== 'admin')) {
    return NextResponse.json(
      {
        error: 'hosting_required',
        message: 'Custom domains require the $19.99/mo Hosting plan.',
        cta: '/checkout?plan=hosting',
      },
      { status: 402 }
    )
  }

  const a = admin()

  // 3. Check if this domain is already claimed in our DB
  const { data: existing } = await a
    .from('domains')
    .select('id, user_id, theme_id, status')
    .ilike('domain', domain)
    .neq('status', 'removed')
    .maybeSingle()

  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: 'domain_taken', message: 'That domain is already connected to another Zenya site.' }, { status: 409 })
  }

  // 4. Add to Vercel
  let vercelInfo
  try {
    vercelInfo = await addDomainToProject(domain)
  } catch (e: any) {
    if (e instanceof VercelDomainError) {
      // Vercel may say "domain_already_in_use" if it's on another team — surface that nicely.
      const code = e.code || 'vercel_error'
      const status = e.status === 409 ? 409 : 502
      return NextResponse.json(
        { error: code, message: e.message },
        { status }
      )
    }
    throw e
  }

  // 5. Pull initial config + write row
  const summary = await fetchDomainSummary(domain).catch(() => null)
  const now = new Date().toISOString()

  const upsertPayload = {
    user_id: user.id,
    theme_id: themeId,
    domain,
    vercel_domain_id: vercelInfo.name,
    status: summary?.status || 'pending_dns',
    last_checked_at: now,
    error_message: summary?.errorMessage || null,
    is_primary: true,
    verified_at: summary?.verified ? now : null,
    updated_at: now,
  }

  if (existing) {
    await a.from('domains').update(upsertPayload).eq('id', existing.id)
  } else {
    await a.from('domains').insert(upsertPayload)
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'domain.added',
    metadata: { domain, theme_id: themeId } as any,
  })

  return NextResponse.json({
    ok: true,
    domain,
    status: summary?.status || 'pending_dns',
    required: summary?.required || [],
  })
}
