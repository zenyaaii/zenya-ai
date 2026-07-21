import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendEmail, trialReminderEmail, hostingExpiringEmail } from '@/lib/email'

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

const DAY = 24 * 60 * 60 * 1000

/**
 * GET /api/cron/lifecycle
 *
 * Daily sweep for the two time-based lifecycle emails (the event-driven ones —
 * welcome + quota-reached — fire from the request path in lib/lifecycle-email):
 *
 *   • Trial reminder — free-plan users created 6–8 days ago who still have
 *     unused free generations and haven't converted. One gentle mid-trial
 *     nudge. Deduped by `user.trial_reminder_sent`.
 *
 *   • Hosting expiring — accounts whose hosting subscription is set to lapse
 *     (canceled, still active, period end within 7 days). Churn-prevention
 *     warning before their sites go offline. Deduped by
 *     `user.hosting_expiring_sent` for the 7d window.
 *
 * Idempotent: re-running the same day is a no-op. Auth: Vercel cron
 * user-agent OR Bearer CRON_SECRET (identical to /api/cron/domains-expiring).
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
  const nowIso = now.toISOString()

  const trial = await runTrialReminders(db, now)
  const hosting = await runHostingExpiring(db, now)

  return NextResponse.json({ checked_at: nowIso, trial, hosting })
}

/** De-dupe helper: have we logged `eventType` for this user since `sinceIso`? */
function reminderIndex(rows: any[] | null | undefined): Set<string> {
  const set = new Set<string>()
  for (const r of rows || []) set.add(r.user_id)
  return set
}

async function runTrialReminders(db: ReturnType<typeof adminDb>, now: Date) {
  // Day-7 window: created between 8 and 6 days ago.
  const olderThan = new Date(now.getTime() - 8 * DAY).toISOString()
  const youngerThan = new Date(now.getTime() - 6 * DAY).toISOString()

  const { data: rows, error } = await db
    .from('profiles')
    .select('id, email, full_name, trial_themes_used, trial_themes_limit, created_at')
    .eq('plan', 'free')
    .eq('is_pro', false)
    .gte('created_at', olderThan)
    .lte('created_at', youngerThan)

  if (error) return { error: error.message, attempted: 0 }

  const eligible = (rows || []).filter((r: any) => {
    const used = r.trial_themes_used ?? 0
    const limit = r.trial_themes_limit ?? 2
    return r.email && used < limit // still has room, hasn't converted
  })

  const ids = eligible.map((r: any) => r.id)
  const { data: prior } = ids.length
    ? await db
        .from('activity_logs')
        .select('user_id')
        .eq('event_type', 'user.trial_reminder_sent')
        .in('user_id', ids)
    : { data: [] as any[] }
  const already = reminderIndex(prior)

  const sent: Array<{ user_id: string; ok: boolean }> = []
  for (const r of eligible) {
    const row = r as any
    if (already.has(row.id)) continue
    const remaining = Math.max(0, (row.trial_themes_limit ?? 2) - (row.trial_themes_used ?? 0))
    const firstName = (row.full_name || '').trim().split(/\s+/)[0] || null
    const tmpl = trialReminderEmail({ firstName, remaining, manageUrl: `${APP_URL}/dashboard` })
    const res = await sendEmail({
      to: row.email,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      tags: [{ name: 'kind', value: 'trial_reminder' }],
    })
    const ok = (res as any).ok === true || (res as any).skipped === true
    sent.push({ user_id: row.id, ok })
    await db.from('activity_logs').insert({
      user_id: row.id,
      event_type: 'user.trial_reminder_sent',
      metadata: { remaining, delivery: res } as any,
    })
  }

  return { eligible: eligible.length, attempted: sent.length, sent }
}

async function runHostingExpiring(db: ReturnType<typeof adminDb>, now: Date) {
  const horizon = new Date(now.getTime() + 7 * DAY).toISOString()
  const nowIso = now.toISOString()

  const { data: rows, error } = await db
    .from('profiles')
    .select('id, email, full_name, hosting_current_period_end, hosting_canceled_at, hosting_status')
    .eq('has_hosting', true)
    .eq('hosting_status', 'active')
    .not('hosting_canceled_at', 'is', null) // set to lapse, not auto-renewing
    .gte('hosting_current_period_end', nowIso)
    .lte('hosting_current_period_end', horizon)

  if (error) return { error: error.message, attempted: 0 }

  const eligible = (rows || []).filter((r: any) => r.email && r.hosting_current_period_end)
  const ids = eligible.map((r: any) => r.id)

  // De-dupe within the last 14 days so the 7d window fires at most once.
  const sinceIso = new Date(now.getTime() - 14 * DAY).toISOString()
  const { data: prior } = ids.length
    ? await db
        .from('activity_logs')
        .select('user_id')
        .eq('event_type', 'user.hosting_expiring_sent')
        .gte('created_at', sinceIso)
        .in('user_id', ids)
    : { data: [] as any[] }
  const already = reminderIndex(prior)

  const sent: Array<{ user_id: string; ok: boolean }> = []
  for (const r of eligible) {
    const row = r as any
    if (already.has(row.id)) continue
    const end = new Date(row.hosting_current_period_end)
    const daysUntil = Math.max(0, Math.round((end.getTime() - now.getTime()) / DAY))
    const firstName = (row.full_name || '').trim().split(/\s+/)[0] || null
    const tmpl = hostingExpiringEmail({
      firstName,
      daysUntil,
      endDate: row.hosting_current_period_end,
      manageUrl: `${APP_URL}/dashboard/billing`,
    })
    const res = await sendEmail({
      to: row.email,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      tags: [{ name: 'kind', value: 'hosting_expiring' }],
    })
    const ok = (res as any).ok === true || (res as any).skipped === true
    sent.push({ user_id: row.id, ok })
    await db.from('activity_logs').insert({
      user_id: row.id,
      event_type: 'user.hosting_expiring_sent',
      metadata: { days_until: daysUntil, period_end: row.hosting_current_period_end, delivery: res } as any,
    })
  }

  return { eligible: eligible.length, attempted: sent.length, sent }
}
