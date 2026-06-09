import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * GET /api/cron/domains-expiring
 *
 * Returns the active domain purchases expiring within the next 30
 * days. Designed to be hit by Vercel Cron (or any external scheduler).
 *
 * Auth: requires the Vercel Cron header OR a Bearer token equal to
 * CRON_SECRET. Without CRON_SECRET set, the endpoint is locked down
 * to Vercel's own cron runner only.
 *
 * Wire from vercel.json:
 *   { "crons": [{ "path": "/api/cron/domains-expiring", "schedule": "0 9 * * *" }] }
 *
 * Today this just reports — emailing the user is a follow-up. The
 * response shape is stable so future jobs can iterate on it without
 * changing the cron config.
 */
export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron') ?? false
  const bearer = req.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET || ''
  const bearerOk = secret && bearer === `Bearer ${secret}`

  if (!isVercelCron && !bearerOk) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = adminDb()
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 30)
  const horizonIso = horizon.toISOString()
  const nowIso = new Date().toISOString()

  const { data: expiring, error } = await db
    .from('domain_purchases')
    .select('id, user_id, domain, expires_at, retail_usd_charged, years, theme_id')
    .eq('status', 'active')
    .lte('expires_at', horizonIso)
    .gte('expires_at', nowIso)
    .order('expires_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'db_error', details: error.message }, { status: 500 })
  }

  // Also surface anything that's already past expiry — likely the
  // user lost the domain but we should know.
  const { data: pastDue } = await db
    .from('domain_purchases')
    .select('id, user_id, domain, expires_at, retail_usd_charged')
    .eq('status', 'active')
    .lt('expires_at', nowIso)
    .order('expires_at', { ascending: true })

  return NextResponse.json({
    checked_at: nowIso,
    horizon_days: 30,
    expiring_count: expiring?.length || 0,
    past_due_count: pastDue?.length || 0,
    expiring: expiring || [],
    past_due: pastDue || [],
  })
}
