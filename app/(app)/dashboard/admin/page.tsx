import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export const dynamic = 'force-dynamic'

/**
 * Founder-only business dashboard. Guarded server-side as well as by
 * /api/admin/analytics — a non-admin never renders the shell at all, so the
 * route doesn't advertise its own existence.
 */
export default async function DashboardAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!(await userIsAdmin(user.id))) notFound()

  return <AdminDashboard />
}
