import { NextRequest, NextResponse } from 'next/server'
import { measure, identityFromPixels, paletteOf } from '@/lib/restaurant-build/palette'

/**
 * The owner's own colours, for the build wizard's colour list.
 *
 * Takes up to four of the photos the owner kept (they are all copies in our
 * own storage by now: Google, Instagram and uploads alike) and measures their
 * real colours. No AI is called: the pixels choose. Returns a day palette, a
 * night palette and a few second colours the owner may add.
 *
 * Only our storage host is fetched, so this cannot be pointed at anything else.
 */

const PER_HOUR = 30
const hits = new Map<string, number[]>()
function throttled(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < 3_600_000)
  if (recent.length >= PER_HOUR) { hits.set(key, recent); return true }
  recent.push(now)
  hits.set(key, recent)
  return false
}

function ours(u: unknown): u is string {
  if (typeof u !== 'string') return false
  try {
    const url = new URL(u)
    const store = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.invalid')
    return url.protocol === 'https:' && url.host === store.host && url.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}

async function fetchImage(u: string): Promise<Buffer | null> {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) })
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const len = Number(r.headers.get('content-length') || 0)
    if (len > 12_000_000) return null
    const buf = Buffer.from(await r.arrayBuffer())
    return buf.length > 12_000_000 ? null : buf
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  if (throttled(ip)) return NextResponse.json({ error: 'busy' }, { status: 429 })
  let body: { photos?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad' }, { status: 400 }) }
  const urls = (Array.isArray(body.photos) ? body.photos : []).filter(ours).slice(0, 4)
  if (!urls.length) return NextResponse.json({ error: 'no_photos' }, { status: 400 })

  const bufs = (await Promise.all(urls.map(fetchImage))).filter((b): b is Buffer => !!b)
  const measured = (await Promise.all(bufs.map((b) => measure(b).catch(() => [])))).flat()
  const { identity, seconds } = identityFromPixels(measured)
  if (!identity.length) return NextResponse.json({ error: 'no_colour' }, { status: 422 })
  return NextResponse.json({ day: paletteOf(identity, 'light'), night: paletteOf(identity, 'dark'), seconds })
}
