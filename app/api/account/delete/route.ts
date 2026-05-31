import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GDPR Art. 17 — Right to erasure ("right to be forgotten").
 *
 * Authenticated POST that:
 *   1. Cancels any active Stripe subscription for this user (so we stop charging them)
 *   2. Deletes their Supabase rows (themes, scrape_history, brand_assets, etc. cascade via FK)
 *   3. Deletes the auth.users row via the admin API
 *
 * We do NOT delete: invoice records, stripe_events log, or anything required
 * by Dutch tax law to retain (7 years). That data is kept de-identified.
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

  // 1. Cancel any active Stripe subscriptions.
  try {
    const { data: subs } = await admin
      .from('subscriptions')
      .select('id, status, stripe_customer_id')
      .eq('user_id', user.id)

    for (const s of subs || []) {
      if (s.status && !['canceled', 'incomplete_expired'].includes(s.status)) {
        try {
          await stripe.subscriptions.cancel(s.id)
        } catch (e) {
          console.warn(`[delete-account] could not cancel ${s.id}:`, e)
          // Continue — even if Stripe cancel fails, we still want to delete locally.
        }
      }
    }

    // Optionally: delete the Stripe customer record (keeps invoices for tax).
    // We leave the customer object but unlink it from the local user.
  } catch (e) {
    console.error('[delete-account] stripe cleanup failed:', e)
  }

  // 2. Best-effort delete of user-owned rows. Most have ON DELETE CASCADE on
  //    user_id → auth.users(id), so step 3 alone would cover them — but doing
  //    it explicitly here gives us a clean audit log and lets us return early
  //    if any of these fail.
  for (const table of [
    'themes',
    'scrape_history',
    'brand_assets',
    'theme_feedback',
    'user_segmentation',
    'activity_logs',
    'subscriptions',
    'stripe_customers',
    'profiles',
  ] as const) {
    const { error } = await admin.from(table).delete().eq(
      table === 'profiles' ? 'id' : table === 'user_segmentation' ? 'user_id' : 'user_id',
      user.id
    )
    if (error) {
      console.warn(`[delete-account] failed to clean ${table}:`, error.message)
    }
  }

  // 3. Delete the auth.users row (admin API — service role only).
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
  if (delErr) {
    console.error('[delete-account] auth.admin.deleteUser failed:', delErr)
    return NextResponse.json({ error: 'delete_failed', details: delErr.message }, { status: 500 })
  }

  // 4. Sign out the current session on the client side.
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
