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

    const { data } = await supabase
      .from('profiles')
      .select('plan, is_pro, trial_themes_limit, trial_themes_used')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.json({
      status: data?.is_pro ? 'pro' : 'free',
      plan: data?.plan || 'free',
      trial_remaining: Math.max(
        0,
        (data?.trial_themes_limit ?? 1) - (data?.trial_themes_used ?? 0)
      ),
    })
  } catch {
    return NextResponse.json({ status: 'free' })
  }
}
