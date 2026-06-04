import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GDPR Art. 17 — Right to erasure ("right to be forgotten").
 *
 * Authenticated POST that:
 *   1. Deletes their Supabase rows (themes, scrape_history cascade via FK)
 *   2. Deletes the auth.users row via the admin API
 *
 * Pro is a one-time purchase so there's no subscription to cancel.
 * We do NOT delete: invoice records, stripe_events log, or purchases — these
 * are required by Dutch tax law to retain (7 years). The purchases row keeps
 * the stripe_customer_id but the user_id FK cascades to NULL on delete.
 */
export async function POST(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  // 1. Best-effort delete of user-owned rows. Most have ON DELETE CASCADE on
  //    user_id → auth.users(id), so step 2 alone would cover them — but doing
  //    it explicitly here gives us a clean audit log.
  //    Note: `purchases` and `stripe_customers` are intentionally NOT deleted —
  //    they're financial records subject to 7-year retention under Dutch law.
  //    The FK on purchases.user_id is ON DELETE CASCADE so when we delete the
  //    auth user it will null/cascade as configured; we keep the row's payment
  //    metadata for the retention period.
  for (const table of ['themes', 'scrape_history', 'activity_logs', 'profiles'] as const) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq(table === 'profiles' ? 'id' : 'user_id', user.id)
    if (error) {
      console.warn(`[delete-account] failed to clean ${table}:`, error.message)
    }
  }

  // 2. Delete the auth.users row (admin API — service role only).
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
  if (delErr) {
    console.error('[delete-account] auth.admin.deleteUser failed:', delErr)
    return NextResponse.json({ error: 'delete_failed', details: delErr.message }, { status: 500 })
  }

  // 4. Sign out the current session on the client side.
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
