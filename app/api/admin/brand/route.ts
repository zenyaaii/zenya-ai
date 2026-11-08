import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'

export const dynamic = 'force-dynamic'

/**
 * «الهوية» — approved designs and their files (admin only, service role).
 *
 * GET → { items } with short signed download links (1 hour).
 * POST JSON: sign upload links, then create the item (see below)
 * DELETE ?id=
 */
const BUCKET = 'brand-library'
const db = () => serviceClient()
const s = (v: unknown, max: number) => String(v ?? '').slice(0, max)
type Stored = { name: string; path: string; size?: number }

export async function GET() {
  const deny = await requireAdmin(); if (deny) return deny
  const { data, error } = await db().from('brand_assets').select('*').order('approved_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const paths = new Set<string>()
  for (const r of data ?? []) {
    if (r.preview_path) paths.add(r.preview_path)
    for (const f of (r.files as Stored[]) ?? []) paths.add(f.path)
  }
  const urls = new Map<string, string>()
  const list = [...paths]
  if (list.length) {
    const { data: signed } = await db().storage.from(BUCKET).createSignedUrls(list, 3600)
    for (const x of signed ?? []) if (x.path && x.signedUrl) urls.set(x.path, x.signedUrl)
  }
  // Downloads keep their file name (download=<name>), previews open inline.
  const dl = (f: Stored) => { const u = urls.get(f.path); return u ? `${u}&download=${encodeURIComponent(f.name)}` : '' }
  const items = (data ?? []).map((r) => ({
    id: r.id, title: r.title, category: r.category, note: r.note, approved_by: r.approved_by, approved_at: r.approved_at,
    swatches: r.swatches, preview_url: r.preview_path ? urls.get(r.preview_path) ?? null : null,
    files: ((r.files as Stored[]) ?? []).map((f) => ({ name: f.name, size: f.size, url: dl(f) })).filter((f) => f.url),
  }))
  return NextResponse.json({ items })
}

const safe = (n: string) => n.normalize('NFKD').replace(/[^\w.\-]+/g, '-').replace(/-+/g, '-').slice(-120) || 'file'

/**
 * Two steps, so big files (zips) go straight from the browser to storage and
 * never through this function's body limit:
 *   { action:'sign', files:[{name}] }  → { dir, uploads:[{ name, path, signedUrl }] }
 *   { action:'create', title, category, note?, approved_by?, files:[{name,path,size,type}] } → { item }
 */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const b = await req.json().catch(() => ({}))
  if (b.action === 'sign') {
    const names: string[] = (Array.isArray(b.files) ? b.files : []).map((f: { name?: string }) => s(f?.name, 200)).filter(Boolean).slice(0, 30)
    if (!names.length) return NextResponse.json({ error: 'اختر ملفًا واحدًا على الأقل' }, { status: 400 })
    const dir = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}`
    const uploads = []
    for (const name of names) {
      const path = `${dir}/${safe(name)}`
      const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path)
      if (error || !data) return NextResponse.json({ error: error?.message || 'sign' }, { status: 500 })
      uploads.push({ name, path, signedUrl: data.signedUrl })
    }
    return NextResponse.json({ dir, uploads })
  }
  const title = s(b.title, 160).trim()
  if (!title) return NextResponse.json({ error: 'اكتب عنوانًا' }, { status: 400 })
  const files: (Stored & { type?: string })[] = (Array.isArray(b.files) ? b.files : [])
    .filter((f: Stored) => f && typeof f.path === 'string' && /^\d{4}-\d{2}-\d{2}\/[\w-]+\/[\w.\-]+$/.test(f.path))
    .map((f: Stored & { type?: string }) => ({ name: s(f.name, 200), path: f.path, size: Number(f.size) || undefined, type: s(f.type, 80) }))
  if (!files.length) return NextResponse.json({ error: 'اختر ملفًا واحدًا على الأقل' }, { status: 400 })
  const preview = files.find((f) => /^image\//.test(f.type || '') || /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name))?.path ?? null
  const { data, error } = await db().from('brand_assets').insert({
    title, category: s(b.category, 30) || 'other', note: s(b.note, 1000) || null,
    approved_by: s(b.approved_by, 40) || null, preview_path: preview,
    files: files.map(({ name, path, size }) => ({ name, path, size })),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(); if (deny) return deny
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id' }, { status: 400 })
  const { data } = await db().from('brand_assets').select('files,preview_path').eq('id', id).single()
  const paths = [...new Set([...(((data?.files as Stored[]) ?? []).map((f) => f.path)), ...(data?.preview_path ? [data.preview_path] : [])])]
  if (paths.length) await db().storage.from(BUCKET).remove(paths)
  const { error } = await db().from('brand_assets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
