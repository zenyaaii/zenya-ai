import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/handover'
import { clientIpFrom, withinBurstLimit } from '@/lib/analytics-server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/template-waitlist — «نبّهني» on a template marked «قريبًا»
 * (Anas, 2026-11-14). JSON { template, email?, page? }. A signed-in visitor
 * needs no email: their account's is used. One row per template and email;
 * pressing again changes nothing. Table public.template_waitlist.
 */
const TEMPLATES = ['atlas', 'studio', 'lookbook', 'collective', 'one_product']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const recent = new Map<string, number[]>()
function allowed(key: string) {
  const now = Date.now(), list = (recent.get(key) ?? []).filter((t) => now - t < 10 * 60_000)
  if (list.length >= 10) { recent.set(key, list); return false }
  list.push(now); recent.set(key, list)
  if (recent.size > 5000) for (const [k, v] of recent) if (!v.some((t) => now - t < 10 * 60_000)) recent.delete(k)
  return true
}

/** GET: is a signed-in visitor already on the list? { signedIn, joined: string[] } */
export async function GET() {
  try {
    const { data } = await createClient().auth.getUser()
    const user = data.user
    if (!user?.email) return NextResponse.json({ signedIn: false, joined: [] })
    const { data: rows } = await serviceClient().from('template_waitlist').select('template').eq('email', user.email.toLowerCase())
    return NextResponse.json({ signedIn: true, joined: (rows || []).map((r: { template: string }) => r.template) })
  } catch {
    return NextResponse.json({ signedIn: false, joined: [] })
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers) || 'unknown'
  if (!withinBurstLimit(`waitlist:${ip}`) || !allowed(ip)) return NextResponse.json({ error: 'محاولات كثيرة. حاول بعد دقيقة.' }, { status: 429 })
  const b = await req.json().catch(() => null)
  const template = typeof b?.template === 'string' ? b.template : ''
  if (!TEMPLATES.includes(template)) return NextResponse.json({ error: 'قالب غير معروف' }, { status: 400 })

  let userId: string | null = null
  let email = typeof b?.email === 'string' ? b.email.trim().toLowerCase().slice(0, 200) : ''
  try {
    const { data } = await createClient().auth.getUser()
    if (data.user) { userId = data.user.id; if (data.user.email) email = data.user.email.toLowerCase() }
  } catch { /* signed out */ }
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'اكتب بريدًا إلكترونيًا صحيحًا' }, { status: 400 })

  const page = typeof b?.page === 'string' ? b.page.slice(0, 300) : null
  const { error } = await serviceClient().from('template_waitlist')
    .upsert({ template, email, user_id: userId, page }, { onConflict: 'template,email', ignoreDuplicates: true })
  if (error) { console.error('[template-waitlist]', error.message); return NextResponse.json({ error: 'تعذّر الحفظ الآن. حاول لاحقًا.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
