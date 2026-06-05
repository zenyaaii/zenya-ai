import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  fetchDomainSummary,
  removeProjectDomain,
  verifyProjectDomain,
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

async function loadOwn(req: NextRequest, id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { data: row } = await supabase
    .from('domains')
    .select('id, user_id, domain, theme_id, status')
    .eq('id', id)
    .maybeSingle()
  if (!row || row.user_id !== user.id) {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }
  return { user, row }
}

/**
 * GET /api/domains/[id]
 * Re-polls Vercel for current verification state and updates the row.
 * Cheap to call on focus / interval.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await loadOwn(req, params.id)
  if ('error' in ctx) return ctx.error

  try {
    // Kick a verify (forces Vercel to re-check), then fetch summary.
    await verifyProjectDomain(ctx.row.domain).catch(() => null)
    const summary = await fetchDomainSummary(ctx.row.domain)

    const a = admin()
    const now = new Date().toISOString()
    await a
      .from('domains')
      .update({
        status: summary.status,
        last_checked_at: now,
        verified_at: summary.verified && ctx.row.status !== 'live' ? now : undefined,
        error_message: summary.errorMessage || null,
      })
      .eq('id', ctx.row.id)

    if (summary.status === 'live' && ctx.row.status !== 'live') {
      await a.from('activity_logs').insert({
        user_id: ctx.user.id,
        event_type: 'domain.verified',
        metadata: { domain: ctx.row.domain, theme_id: ctx.row.theme_id } as any,
      })
    }

    return NextResponse.json({
      ok: true,
      id: ctx.row.id,
      domain: ctx.row.domain,
      status: summary.status,
      required: summary.required,
      verified: summary.verified,
      misconfigured: summary.misconfigured,
    })
  } catch (e: any) {
    if (e instanceof VercelDomainError) {
      return NextResponse.json({ error: 'vercel_error', message: e.message }, { status: 502 })
    }
    return NextResponse.json({ error: 'unknown', message: e?.message }, { status: 500 })
  }
}

/**
 * DELETE /api/domains/[id]
 * Removes the domain from the Vercel project + soft-deletes the row.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await loadOwn(req, params.id)
  if ('error' in ctx) return ctx.error

  try {
    await removeProjectDomain(ctx.row.domain).catch((e: VercelDomainError) => {
      if (e.status !== 404) throw e
      // 404 = Vercel doesn't have it (race or earlier deletion) — fine.
    })
  } catch (e: any) {
    if (e instanceof VercelDomainError) {
      return NextResponse.json({ error: 'vercel_error', message: e.message }, { status: 502 })
    }
    throw e
  }

  const a = admin()
  await a
    .from('domains')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', ctx.row.id)

  await a.from('activity_logs').insert({
    user_id: ctx.user.id,
    event_type: 'domain.removed',
    metadata: { domain: ctx.row.domain, theme_id: ctx.row.theme_id } as any,
  })

  return NextResponse.json({ ok: true })
}
