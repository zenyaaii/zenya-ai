import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/utils/supabase/server'
import { serviceClient } from '@/lib/handover'
import { instagramOf, instagramHandles } from '@/lib/restaurant-build/sources'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

/**
 * The owner's Instagram for a niche wizard: the bio and the latest post
 * photos, copied to our storage. One Apify run per call, at most 12 posts.
 *
 * The photos are offered to the owner, not placed: we never choose a photo
 * of a woman or a tattoo, and nothing judges these yet, so the owner taps
 * the ones to use (spec 2026-11-12 §4.8, §7-ب2).
 *
 * Signed in, or the public try page with `demo: true` (throttled harder).
 */

const MAX_PER_HOUR = 6
const DEMO_PER_HOUR = 2
const hits = new Map<string, number[]>()
function throttled(who: string, max: number): boolean {
  const now = Date.now()
  const recent = (hits.get(who) || []).filter((t) => now - t < 3_600_000)
  if (recent.length >= max) { hits.set(who, recent); return true }
  recent.push(now); hits.set(who, recent)
  return false
}

/** «@name», «name» or a profile link → a profile link. */
function igLink(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  if (/instagram\.com\//i.test(t)) return t
  const h = t.replace(/^@/, '')
  return /^[A-Za-z0-9._]{2,30}$/.test(h) ? `https://www.instagram.com/${h}/` : null
}

export async function POST(req: NextRequest) {
  let body: { instagram?: unknown; demo?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { data: { user } } = await createClient().auth.getUser().catch(() => ({ data: { user: null } }))
  const demo = !user && body.demo === true
  if (!user && !demo) return NextResponse.json({ error: 'sign_in' }, { status: 401 })
  if (!(process.env.APIFY_TOKEN || process.env.apify_token)) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const link = typeof body.instagram === 'string' ? igLink(body.instagram) : null
  if (!link || !instagramHandles(link).length) return NextResponse.json({ error: 'not_instagram' }, { status: 400 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  const who = user ? user.id : 'demo:' + ip
  if (throttled(who, demo ? DEMO_PER_HOUR : MAX_PER_HOUR)) return NextResponse.json({ error: 'too_many' }, { status: 429 })

  try {
    const ig = await instagramOf(link)
    if (!ig.data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const sb = serviceClient().storage.from('theme-uploads')
    const dir = `${user ? 'owners/' + user.id : 'demo'}/instagram/${ig.data.handle.replace(/[^A-Za-z0-9._-]/g, '')}`
    const posts = ig.photos.filter((p) => !p.logoHint)
    const up = await Promise.all(posts.map(async (r) => {
      try {
        const jpeg = await sharp(r.buf).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
        const meta = await sharp(jpeg).metadata()
        if ((meta.width || 0) < 500 || (meta.height || 0) < 400) return null
        const path = `${dir}/${r.id}.jpg`
        const { error } = await sb.upload(path, jpeg, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' })
        if (error) return null
        return sb.getPublicUrl(path).data.publicUrl
      } catch { return null }
    }))
    return NextResponse.json({
      handle: ig.data.handle,
      name: ig.data.name,
      bio: ig.data.bio,
      captions: ig.data.captions,
      followers: ig.data.followers,
      photos: up.filter((u): u is string => !!u),
    })
  } catch (e) {
    console.error('[niche/social]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 502 })
  }
}
