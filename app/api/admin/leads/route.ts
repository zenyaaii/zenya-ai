import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'

export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'sent', 'replied', 'client', 'later', 'noans', 'no']

/** GET: every lead. Admin only. */
export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny
  const { data, error } = await serviceClient().from('leads').select('*').order('created_at').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data })
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
