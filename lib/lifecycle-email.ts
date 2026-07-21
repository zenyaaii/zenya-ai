/**
 * Event-driven lifecycle emails — the two that fire from a live request path
 * rather than the daily cron:
 *
 *   • sendWelcomeOnce      — first successful auth (auth callback)
 *   • sendQuotaEmailIfExhausted — a free user just consumed their last
 *                            generation (themes POST, after the quota trigger)
 *
 * Both are idempotent: they dedupe against `activity_logs` so a retried
 * request, a re-opened confirmation link, or a double save never sends twice.
 * Both are best-effort — callers fire-and-forget; a failed send must never
 * block sign-in or theme creation. When RESEND_API_KEY is unset, sendEmail
 * no-ops and we still log the (skipped) attempt so we stop retrying.
 *
 * The time-based lifecycle emails (mid-trial reminder, hosting expiry) live
 * in the daily sweep at app/api/cron/lifecycle.
 */
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendEmail, welcomeEmail, quotaReachedEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zenyaai.co'

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/** True if we've already logged `eventType` for this user (our once-only guard). */
async function alreadySent(
  db: ReturnType<typeof adminDb>,
  userId: string,
  eventType: string
): Promise<boolean> {
  const { data } = await db
    .from('activity_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .limit(1)
  return !!(data && data.length)
}

/**
 * Welcome a genuinely-new user exactly once. Safe to call from every auth
 * success (sign-up confirm, OAuth, magic link) — returning users already have
 * the `user.welcome_email_sent` marker, so they're skipped.
 */
export async function sendWelcomeOnce(user: {
  id: string
  email?: string | null
  fullName?: string | null
  trialLimit?: number | null
}): Promise<void> {
  if (!user.email) return
  try {
    const db = adminDb()
    if (await alreadySent(db, user.id, 'user.welcome_email_sent')) return

    const firstName = (user.fullName || '').trim().split(/\s+/)[0] || null
    const tmpl = welcomeEmail({
      firstName,
      trialLimit: user.trialLimit ?? undefined,
      manageUrl: `${APP_URL}/dashboard`,
    })
    const delivery = await sendEmail({
      to: user.email,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      tags: [{ name: 'kind', value: 'welcome' }],
    })
    await db.from('activity_logs').insert({
      user_id: user.id,
      event_type: 'user.welcome_email_sent',
      metadata: { delivery } as any,
    })
  } catch (e) {
    console.error('[lifecycle-email] sendWelcomeOnce failed:', e)
  }
}

/**
 * If the given user is a free-trial account that has now used its whole
 * quota, send the "trial exhausted → upgrade" email once. Reads the profile
 * fresh (the quota trigger has already run by the time the themes insert
 * returns), so `trial_themes_used >= trial_themes_limit` is authoritative.
 */
export async function sendQuotaEmailIfExhausted(userId: string): Promise<void> {
  try {
    const db = adminDb()
    const { data: p } = await db
      .from('profiles')
      .select('email, full_name, plan, is_pro, trial_themes_used, trial_themes_limit')
      .eq('id', userId)
      .maybeSingle()

    if (!p || !(p as any).email) return
    const prof = p as any
    // Only free-trial accounts have a quota to exhaust.
    if (prof.is_pro || (prof.plan && prof.plan !== 'free')) return
    const used = prof.trial_themes_used ?? 0
    const limit = prof.trial_themes_limit ?? 2
    if (used < limit) return

    if (await alreadySent(db, userId, 'user.quota_email_sent')) return

    const firstName = (prof.full_name || '').trim().split(/\s+/)[0] || null
    const tmpl = quotaReachedEmail({
      firstName,
      trialLimit: limit,
      upgradeUrl: `${APP_URL}/pricing`,
    })
    const delivery = await sendEmail({
      to: prof.email,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      tags: [{ name: 'kind', value: 'quota_reached' }],
    })
    await db.from('activity_logs').insert({
      user_id: userId,
      event_type: 'user.quota_email_sent',
      metadata: { delivery, used, limit } as any,
    })
  } catch (e) {
    console.error('[lifecycle-email] sendQuotaEmailIfExhausted failed:', e)
  }
}
