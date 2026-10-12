import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendEmail, passwordChangedEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/account/password-changed
 *
 * Called by the browser right after supabase.auth.updateUser({ password })
 * succeeds (the reset-password page and account settings). Sends the signed-in
 * user the "your password was changed" security notice, so a change they did
 * not make does not go unnoticed. It only ever mails the caller's own address,
 * and at most once every ten minutes.
 */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const a = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await a
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'user.password_changed_sent')
    .gte('created_at', since)
  if ((count ?? 0) > 0) return NextResponse.json({ ok: true, skipped: 'recent' })

  const tmpl = passwordChangedEmail({ email: user.email })
  const res = await sendEmail({
    to: user.email,
    subject: tmpl.subject,
    text: tmpl.text,
    html: tmpl.html,
    tags: [{ name: 'type', value: 'password_changed' }],
  })
  if (res.ok) {
    await a.from('activity_logs').insert({
      user_id: user.id,
      event_type: 'user.password_changed_sent',
      metadata: {} as any,
    })
  }
  return NextResponse.json({ ok: true })
}
