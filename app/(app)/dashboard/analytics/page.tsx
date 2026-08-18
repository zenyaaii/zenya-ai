import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'
import AnalyticsDashboard from '@/components/dashboard/analytics/AnalyticsDashboard'
import { analyticsAccess } from '@/lib/analytics-entitlement'

export const dynamic = 'force-dynamic'

/**
 * The one analytics surface.
 *
 * This used to be two pages — /dashboard/analytics and /dashboard/visitors —
 * reading the same table and showing roughly the same numbers under different
 * Arabic labels. They're merged here; /dashboard/visitors now redirects to the
 * مباشر tab. The founder-only business view moved out to /dashboard/admin
 * instead of being a mode toggle bolted onto the customer page.
 */
export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = await userIsAdmin(user.id)

  // Analytics is Starter+ with a one-month trial for Entry/free accounts.
  // Admins always pass. The trial auto-starts the first time the owner opens
  // this page — mirroring how bookings turns its trial on.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, has_hosting, analytics_trial_started_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!isAdmin) {
    let effectiveProfile = profile
    // First visit for a non-included account → start the free month.
    if (
      profile &&
      !profile.analytics_trial_started_at &&
      !['starter', 'pro', 'pro_hosting', 'pro_onetime', 'admin'].includes(String(profile.plan || '')) &&
      !profile.has_hosting
    ) {
      const startedAt = new Date().toISOString()
      await supabase
        .from('profiles')
        .update({ analytics_trial_started_at: startedAt })
        .eq('id', user.id)
      effectiveProfile = { ...profile, analytics_trial_started_at: startedAt }
    }

    const access = analyticsAccess(effectiveProfile)
    if (!access.entitled) {
      return <AnalyticsLocked />
    }
  }

  return <AnalyticsDashboard isAdmin={isAdmin} />
}

/** Shown when a non-Starter account's analytics trial has ended. */
function AnalyticsLocked() {
  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="rounded-2xl border border-token bg-white p-8 shadow-soft-sm">
        <h1 className="text-[22px] font-[590] tracking-[-0.5px] text-foreground">
          انتهت فترة تجربة التحليلات
        </h1>
        <p className="mt-3 text-[14.5px] leading-[1.8] text-muted">
          تحليلات موقعك متاحة في خطة Starter (14.99$ شهريًا) وما فوق. رقّ حسابك
          لمواصلة متابعة زوّار موقعك ومصادرهم وتحويلاتهم.
        </p>
        <Link
          href="/checkout?plan=starter"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white btn-shadow-primary transition hover:-translate-y-0.5"
        >
          الترقية إلى Starter
        </Link>
      </div>
    </main>
  )
}
