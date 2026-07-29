import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'
import AnalyticsDashboard from '@/components/dashboard/analytics/AnalyticsDashboard'

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

  return <AnalyticsDashboard isAdmin={isAdmin} />
}
