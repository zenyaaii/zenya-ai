import { NextRequest, NextResponse } from 'next/server'
import { AiClient, aiKey } from '@/lib/ai-client'
import { createClient } from '@/utils/supabase/server'
import { findMenu } from '@/lib/restaurant-build/find-menu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/menu/find — «جاري قلب المنيو».
 *
 * The restaurant wizard calls this once, the first time the owner lands on
 * the menu step, with the photos its links already gave it (Google, and
 * Instagram when it was read) and the Instagram captions. It finds the menu
 * among them, reads it, and answers in the wizard's own menu shape; see
 * lib/restaurant-build/find-menu.ts for the rules.
 *
 * Signed in only: it costs one look at a contact sheet plus one read per
 * menu page (up to 40: the whole menu, Anas 2026-11-14). Only photos already copied to our own storage are fetched, so this
 * is never a door to fetch any address. The public demo reads its bundled
 * sample through /api/analyze-menu instead.
 */

const MAX_PER_HOUR = 6
const hits = new Map<string, number[]>()
function throttled(who: string): boolean {
  const now = Date.now()
  const recent = (hits.get(who) || []).filter((t) => now - t < 3_600_000)
  if (recent.length >= MAX_PER_HOUR) { hits.set(who, recent); return true }
  recent.push(now); hits.set(who, recent)
  return false
}

function ours(u: unknown): u is string {
  if (typeof u !== 'string') return false
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return false
  try {
    const a = new URL(u), b = new URL(base)
    return a.protocol === 'https:' && a.host === b.host && a.pathname.startsWith('/storage/v1/object/public/theme-uploads/')
  } catch { return false }
}

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { data: { user } } = await createClient().auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'sign_in' }, { status: 401 })

  const photos: string[] = (Array.isArray(body?.photos) ? body.photos : []).filter(ours)
  // The place's Google «Menu» tab, as /api/menu/photos listed it: Google's image host only.
  const menuTab: string[] = (Array.isArray(body?.menu_tab) ? body.menu_tab : [])
    .filter((u: unknown): u is string => typeof u === 'string' && /^https:\/\/[a-z0-9.-]*(googleusercontent|ggpht)\.com\//i.test(u))
    .slice(0, 40)
  const captions: string[] = (Array.isArray(body?.captions) ? body.captions : []).filter((c: unknown) => typeof c === 'string').slice(0, 12)
  const cuisine = typeof body?.cuisine === 'string' && body.cuisine.trim() ? body.cuisine.trim().slice(0, 60) : undefined
  if (!photos.length && !menuTab.length && !captions.length) return NextResponse.json({ pages: [], captions: [], dishes: [], photos: [] })

  const apiKey = aiKey()
  if (!apiKey) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })
  if (throttled(user.id)) return NextResponse.json({ error: 'too_many' }, { status: 429 })

  try {
    const found = await findMenu(new AiClient({ apiKey }), { photos, menuTab, captions, cuisine, userId: user.id })
    return NextResponse.json(found)
  } catch (e) {
    console.error('[menu/find]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'find_failed' }, { status: 502 })
  }
}
