import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'
import { fillGift, logOut, normWa, sendGift, sendText, windowOpen } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

/**
 * POST { leadId?, wa?, mode: 'gift' | 'text', text? }
 *  gift → the approved first message with the lead's site link
 *  text → free text, only while the 24-hour window is open
 * Admin only. One click = one message; nothing is sent in bulk or by itself.
 */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const b = await req.json().catch(() => ({}))
  const db = serviceClient()
  let lead: any = null
  if (b.leadId) {
    const { data } = await db.from('leads').select('*').eq('id', b.leadId).maybeSingle()
    lead = data
  }
  const wa = normWa(b.wa ?? lead?.wa ?? lead?.phone)
  if (!wa) return NextResponse.json({ error: 'لا يوجد رقم واتساب' }, { status: 400 })

  if (b.mode === 'gift') {
    const link = lead?.site
    if (!link) return NextResponse.json({ error: 'لا يوجد موقع لهذا العميل بعد' }, { status: 400 })
    const res = await sendGift(wa, link)
    await logOut({ wa, leadId: lead?.id, kind: 'template', body: fillGift(link), res })
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 })
    if (lead && lead.status === 'new') {
      await db.from('leads').update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', lead.id)
    }
    return NextResponse.json({ ok: true })
  }

  const text = String(b.text ?? '').trim()
  if (!text) return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 })
  if (!(await windowOpen(wa))) {
    return NextResponse.json({ error: 'مرّت 24 ساعة على آخر رسالة منه. واتساب يسمح الآن بالقالب فقط.' }, { status: 409 })
  }
  const res = await sendText(wa, text)
  await logOut({ wa, leadId: lead?.id, kind: 'text', body: text, res })
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 })
  return NextResponse.json({ ok: true })
}
