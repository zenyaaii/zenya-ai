import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'

/** null when the caller is the admin, otherwise the response to return. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(await userIsAdmin(user.id))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  return null
}
