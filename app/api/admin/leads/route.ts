import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'

export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'sent', 'replied', 'client', 'later', 'noans', 'no']

/** GET: every lead, plus the paid services that are down right now. Admin only. */
export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny
  const db = serviceClient()
  const [{ data, error }, alerts] = await Promise.all([
    db.from('leads').select('*').order('created_at').order('id'),
    db.from('service_alerts').select('service, reason, fix, at').eq('status', 'down'),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data, outages: alerts.data ?? [] })
}

/** PATCH { id, status?, site?, notes? }. Admin only. */
export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const b = await req.json().catch(() => ({}))
  if (!b?.id) return NextResponse.json({ error: 'id' }, { status: 400 })
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return NextResponse.json({ error: 'status' }, { status: 400 })
    patch.status = b.status
  }
  if (b.site !== undefined) patch.site = String(b.site).trim() || null
  if (b.notes !== undefined) patch.notes = String(b.notes)
  const { data, error } = await serviceClient().from('leads').update(patch).eq('id', b.id).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
