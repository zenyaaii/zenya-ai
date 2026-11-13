import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'
import { funnels, type Ev } from '@/lib/wizard-funnel'

export const dynamic = 'force-dynamic'

/**
 * «الزوار» (admin only): the reports people sent, how they move through the
 * build questions, and what they wished we had asked.
 *
 * GET ?days=30 → { reports, wizards, wishes }
 * PATCH { id, status: 'new'|'done' }
 * DELETE ?id=   (removes the picture too)
 */
const BUCKET = 'site-reports'
const db = () => serviceClient()

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const days = Math.max(1, Math.min(365, Number(req.nextUrl.searchParams.get('days')) || 30))
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data: reps, error } = await db().from('site_reports').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const paths = (reps ?? []).map((r) => r.image_path).filter(Boolean) as string[]
  const urls = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await db().storage.from(BUCKET).createSignedUrls(paths, 3600)
    for (const x of signed ?? []) if (x.path && x.signedUrl) urls.set(x.path, x.signedUrl)
  }
  const reports = (reps ?? []).map((r) => ({
    id: r.id, at: r.created_at, text: r.text, kind: r.kind, page: r.page, title: r.title, vw: r.vw, vh: r.vh,
    status: r.status, signedIn: !!r.user_id, image: r.image_path ? urls.get(r.image_path) ?? null : null,
  }))

  // Events of the period, a page at a time (the API caps one read at 1000 rows).
  const rows: Ev[] = []
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error: e } = await db().from('wizard_events')
      .select('session,wizard,label,step_id,step_title,step_index,step_count,event,how,ms,note,at')
      .gte('at', since).order('id', { ascending: true }).range(from, from + 999)
    if (e) return NextResponse.json({ error: e.message }, { status: 500 })
    rows.push(...((data ?? []) as Ev[]))
    if (!data || data.length < 1000) break
  }
  const wishes = rows.filter((r) => r.event === 'wish' && r.note).reverse().slice(0, 200)
    .map((r) => ({ at: r.at, text: r.note!, label: r.label || r.wizard }))

  return NextResponse.json({ reports, wizards: funnels(rows.filter((r) => r.event !== 'wish')), wishes, days })
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const b = await req.json().catch(() => ({}))
  if (typeof b.id !== 'string' || !['new', 'done'].includes(b.status)) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  const { error } = await db().from('site_reports').update({ status: b.status }).eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  const { data } = await db().from('site_reports').select('image_path').eq('id', id).maybeSingle()
  if (data?.image_path) await db().storage.from(BUCKET).remove([data.image_path])
  const { error } = await db().from('site_reports').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
