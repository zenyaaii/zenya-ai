import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'

export const dynamic = 'force-dynamic'

/**
 * Shared admin notes in folders (Anas + Yasin share one login, so each note
 * carries the writer's name). Admin only, service role.
 *
 * GET → { folders, notes }
 * POST { kind:'folder', name } | { kind:'note', folder_id, title, body, author }
 * PATCH { kind:'folder', id, name } | { kind:'note', id, title?, body?, author?, pinned?, folder_id? }
 * DELETE ?kind=folder|note&id=
 */
const db = () => serviceClient()
const s = (v: unknown, max: number) => String(v ?? '').slice(0, max)

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny
  const [f, n] = await Promise.all([
    db().from('admin_note_folders').select('*').order('created_at'),
    db().from('admin_notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false }),
  ])
  if (f.error || n.error) return NextResponse.json({ error: (f.error || n.error)!.message }, { status: 500 })
  return NextResponse.json({ folders: f.data, notes: n.data })
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const b = await req.json().catch(() => ({}))
  if (b.kind === 'folder') {
    const name = s(b.name, 80).trim()
    if (!name) return NextResponse.json({ error: 'اكتب اسم المجلد' }, { status: 400 })
    const { data, error } = await db().from('admin_note_folders').insert({ name }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ folder: data })
  }
  const { data, error } = await db().from('admin_notes').insert({
    folder_id: b.folder_id || null, title: s(b.title, 200), body: s(b.body, 50000), author: s(b.author, 40) || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const b = await req.json().catch(() => ({}))
  if (!b?.id) return NextResponse.json({ error: 'id' }, { status: 400 })
  if (b.kind === 'folder') {
    const { data, error } = await db().from('admin_note_folders').update({ name: s(b.name, 80).trim() }).eq('id', b.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ folder: data })
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (b.title !== undefined) patch.title = s(b.title, 200)
  if (b.body !== undefined) patch.body = s(b.body, 50000)
  if (b.author !== undefined) patch.author = s(b.author, 40) || null
  if (b.pinned !== undefined) patch.pinned = !!b.pinned
  if (b.folder_id !== undefined) patch.folder_id = b.folder_id || null
  const { data, error } = await db().from('admin_notes').update(patch).eq('id', b.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data })
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const kind = req.nextUrl.searchParams.get('kind'), id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id' }, { status: 400 })
  const { error } = await db().from(kind === 'folder' ? 'admin_note_folders' : 'admin_notes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
