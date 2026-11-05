import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'
import LeadStudio from '@/components/dashboard/admin/LeadStudio'

export const dynamic = 'force-dynamic'

/** Founder-only: leads + WhatsApp inbox. Same guard as /dashboard/admin. */
export default async function AdminLeadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!(await userIsAdmin(user.id))) notFound()
  return <LeadStudio />
}
