import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/build/acknowledge
 *
 * Records that the signed-in user saw the AI-content disclosure and
 * clicked "I understand" before generating a theme. This is the
 * liability trail: if a merchant later publishes the invented stock
 * counts / press quotes / buyer names as-is, we can show they were
 * told the content was AI-generated and needed replacing.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const claimIds = Array.isArray(body?.claimIds)
    ? body.claimIds.map((s: any) => String(s || '').slice(0, 60)).filter(Boolean).slice(0, 40)
    : []

  const { error } = await supabase.from('build_honesty_acks').insert({
    user_id: user.id,
    product_name: String(body?.productName || '').slice(0, 200) || null,
    store_name: String(body?.storeName || '').slice(0, 200) || null,
    source_url: String(body?.sourceUrl || '').slice(0, 500) || null,
    claims_count: claimIds.length,
    claim_ids: claimIds,
    user_agent: req.headers.get('user-agent')?.slice(0, 300) || null,
  })

  if (error) {
    console.error('acknowledge insert failed:', error.message)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
