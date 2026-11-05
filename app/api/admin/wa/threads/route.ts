import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'

export const dynamic = 'force-dynamic'

/**
 * GET            → one row per number: last message, unread count (incoming
 *                  after our last outgoing), lead id.
 * GET ?wa=<num>  → that conversation, oldest first.
 */
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const db = serviceClient()
  const wa = req.nextUrl.searchParams.get('wa')
  if (wa) {
    const { data, error } = await db.from('wa_messages')
      .select('id,wamid,lead_id,wa,direction,kind,body,status,error,at')
      .eq('wa', wa).order('at').limit(500)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data })
  }
  const { data, error } = await db.from('wa_messages')
    .select('wa,lead_id,direction,body,at,kind,status')
    .order('at', { ascending: false }).limit(3000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const map = new Map<string, any>()
  for (const m of data ?? []) {
    let t = map.get(m.wa)
    if (!t) { t = { wa: m.wa, lead_id: m.lead_id, last: m, unread: 0, seenOut: false, lastIn: null }; map.set(m.wa, t) }
    if (!t.lead_id && m.lead_id) t.lead_id = m.lead_id
    if (m.direction === 'out') t.seenOut = true
    else { if (!t.seenOut) t.unread++; if (!t.lastIn) t.lastIn = m.at }
  }
  const threads = [...map.values()].map(({ seenOut, ...t }) => t)
  return NextResponse.json({ threads })
}
