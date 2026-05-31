import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(_req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ status: 'active' }) // Demo mode always active
  }

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ status: 'guest' })

    // `subscriptions` table is keyed on user_id (see supabase_schema.sql).
    // Pick the most recent row in case there's more than one.
    const { data } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ status: data?.status || 'free' })
  } catch {
    return NextResponse.json({ status: 'free' })
  }
}
