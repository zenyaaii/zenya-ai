import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/handover'
import { clientIpFrom, withinBurstLimit } from '@/lib/analytics-server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/report — a visitor's report from the shake sheet.
 * JSON { text, kind: 'screen'|'camera'|'text', image?: dataURL (jpeg/png/webp), page, title, vw, vh }.
 * The picture goes to the private bucket site-reports; the admin «الزوار» tab
 * reads it back through a short signed link.
 */
const MAX_IMAGE = 4 * 1024 * 1024
const s = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(10000, Math.round(v))) : null)

/* A tighter limit than the shared burst one: a person reports a few things, not hundreds. */
const recent = new Map<string, number[]>()
function allowed(key: string) {
  const now = Date.now(), list = (recent.get(key) ?? []).filter((t) => now - t < 10 * 60_000)
  if (list.length >= 8) { recent.set(key, list); return false }
  list.push(now); recent.set(key, list)
  if (recent.size > 5000) for (const [k, v] of recent) if (!v.some((t) => now - t < 10 * 60_000)) recent.delete(k)
  return true
}

export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers)
  if (!withinBurstLimit(`report:${ip || 'unknown'}`) || !allowed(ip || 'unknown')) return NextResponse.json({ error: 'أرسلت بلاغات كثيرة. حاول بعد دقيقة.' }, { status: 429 })

  const b = await req.json().catch(() => null)
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'بلاغ فارغ' }, { status: 400 })
  const text = s(b.text, 2000).trim()
  const kind = ['screen', 'camera', 'text'].includes(b.kind) ? b.kind : 'text'

  let image: { buf: Buffer; type: string } | null = null
  if (typeof b.image === 'string' && b.image) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.image)
    if (!m) return NextResponse.json({ error: 'الصورة غير صالحة' }, { status: 400 })
    const buf = Buffer.from(m[2], 'base64')
    if (buf.length > MAX_IMAGE) return NextResponse.json({ error: 'الصورة كبيرة جدًا' }, { status: 413 })
    image = { buf, type: m[1] }
  }
  if (!text && !image) return NextResponse.json({ error: 'اكتب ما حدث أو أرفق صورة' }, { status: 400 })

  let userId: string | null = null
  try { const { data } = await createClient().auth.getUser(); userId = data.user?.id ?? null } catch { /* signed out */ }

  const db = serviceClient()
  let image_path: string | null = null
  if (image) {
    const ext = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg'
    image_path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
    const { error } = await db.storage.from('site-reports').upload(image_path, image.buf, { contentType: image.type })
    if (error) image_path = null // keep the words even if the picture failed
  }

  const { error } = await db.from('site_reports').insert({
    text: text || null, kind: image_path ? kind : 'text', image_path,
    page: s(b.page, 500) || null, title: s(b.title, 200) || null, vw: n(b.vw), vh: n(b.vh),
    user_agent: s(req.headers.get('user-agent'), 400) || null, user_id: userId,
  })
  if (error) return NextResponse.json({ error: 'تعذّر حفظ البلاغ' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
