import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { countNew } from '@/lib/reviews-bank'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reviews/new — for the dashboard bell: each of the owner's sites
 * that has reviews marked new, with how many and when the last check ran.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ sites: [] }, { status: 401 })

  const { data } = await supabase
    .from('themes')
    .select('id, product_name, template_type, content')
    .eq('user_id', user.id)
    .not('content->review_bank', 'is', null)

  const sites = (data || [])
    .map((t: any) => ({
      id: t.id as string,
      name: (t.product_name as string) || 'موقع بلا اسم',
      count: countNew(t.content?.business_type || t.template_type, t.content),
      at: (t.content?.review_bank?.google?.fetched_at as string) || null,
    }))
    .filter((s) => s.count > 0)

  return NextResponse.json({ sites })
}
