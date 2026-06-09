import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendEmail, domainExpiringEmail } from '@/lib/email'
import { retailPrice } from '@/lib/porkbun'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zenyaai.co'

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
 * Daily expiry sweep. Finds active domain purchases that are entering
 * one of two reminder windows and emails the owner:
 *
 *   • 30d window — first nudge ("renew now to lock in this year's
 *     price"). Fires once between 30 and 23 days out.
 *   • 7d window  — urgent reminder. Fires once between 7 and 0 days out.
 *
 * De-dupe is done via activity_logs — we look back 14 days for a
 * `domain_purchase.renewal_reminder_sent` event tagged with the same
 * purchase_id and window. Re-running the cron same-day is a no-op.
 *
 * Auth: Vercel cron user-agent OR Bearer CRON_SECRET.
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
  const now = new Date()
  const horizon30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()

  const { data: rows, error } = await db
    .from('domain_purchases')
    .select('id, user_id, domain, expires_at, retail_usd_charged, wholesale_usd, years, theme_id')
    .eq('status', 'active')
    .lte('expires_at', horizon30)
    .gte('expires_at', nowIso)
    .order('expires_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'db_error', details: error.message }, { status: 500 })
  }

  const { data: pastDue } = await db
    .from('domain_purchases')
    .select('id, user_id, domain, expires_at, retail_usd_charged')
    .eq('status', 'active')
    .lt('expires_at', nowIso)
    .order('expires_at', { ascending: true })

  // Look up owner emails in one round-trip.
  const userIds = Array.from(new Set((rows || []).map((r) => r.user_id)))
  const emailByUser: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email')
      .in('id', userIds)
    for (const p of profiles || []) emailByUser[(p as any).id] = (p as any).email
  }

  // For de-dupe: pull all renewal_reminder_sent events from last 14d
  // for the affected users, then check window-by-window per row.
  const sinceIso = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: priorReminders } = await db
    .from('activity_logs')
    .select('metadata, created_at')
    .eq('event_type', 'domain_purchase.renewal_reminder_sent')
    .gte('created_at', sinceIso)
    .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

  // Index reminders by `${purchase_id}:${window}` so the dedupe check
  // is O(1) per row.
  const remindedKey = new Set<string>()
  for (const log of priorReminders || []) {
    const meta = (log as any).metadata || {}
    if (meta.purchase_id && meta.window) {
      remindedKey.add(`${meta.purchase_id}:${meta.window}`)
    }
  }

  const sent: Array<{ purchase_id: string; window: string; email: string; ok: boolean }> = []

  for (const row of rows || []) {
    const expiresAt = new Date(row.expires_at as any)
    const daysUntil = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const window: '30d' | '7d' | null =
      daysUntil <= 7 && daysUntil >= 0 ? '7d' :
      daysUntil <= 30 && daysUntil >= 23 ? '30d' :
      null

    if (!window) continue
    if (remindedKey.has(`${row.id}:${window}`)) continue

    const to = emailByUser[row.user_id]
    if (!to) continue

    // Re-compute retail in case markup env vars changed since purchase.
    const retail = row.wholesale_usd != null
      ? retailPrice(Number(row.wholesale_usd) / Math.max(1, row.years || 1))
      : Number(row.retail_usd_charged) || 0

    const renewUrl = `${APP_URL}/dashboard/domains?renew=${encodeURIComponent(row.id)}`
    const tmpl = domainExpiringEmail({
      domain: row.domain,
      daysUntil: Math.max(0, daysUntil),
      renewUrl,
      retailUsd: retail,
    })

    const res = await sendEmail({
      to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      tags: [
        { name: 'kind', value: 'domain_renewal_reminder' },
        { name: 'window', value: window },
      ],
    })

    const ok = (res as any).ok === true || (res as any).skipped === true
    sent.push({ purchase_id: row.id, window, email: to, ok })

    // Always record the attempt — even no-key skips — so we don't
    // hammer the same row daily once a key is added.
    await db.from('activity_logs').insert({
      user_id: row.user_id,
      event_type: 'domain_purchase.renewal_reminder_sent',
      metadata: {
        purchase_id: row.id,
        domain: row.domain,
        window,
        days_until: daysUntil,
        delivery: res,
      } as any,
    })
  }

  return NextResponse.json({
    checked_at: nowIso,
    expiring_count: rows?.length || 0,
    past_due_count: pastDue?.length || 0,
    emails_attempted: sent.length,
    sent,
  })
}
