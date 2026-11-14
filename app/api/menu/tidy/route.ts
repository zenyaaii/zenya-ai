import { NextRequest, NextResponse } from 'next/server'
import { AiClient, aiKey } from '@/lib/ai-client'
import { createClient } from '@/utils/supabase/server'
import { tidyMenu } from '@/lib/restaurant-build/find-menu'
import type { Category } from '@/lib/menu-ocr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

/**
 * POST /api/menu/tidy { categories } → { categories }
 *
 * After the owner says «نعم» to the menu pages we found: the pages overlap,
 * so the same dish was read several times, sometimes in two languages. This
 * makes one menu of them (text only, see tidyMenu). On any failure the wizard
 * keeps the plain merge it already has.
 */
export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { data: { user } } = await createClient().auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) return NextResponse.json({ error: 'sign_in' }, { status: 401 })
  const cats: Category[] = (Array.isArray(body?.categories) ? body.categories : []).slice(0, 60).map((c: any) => ({
    name: String(c?.name || '').slice(0, 40), description: String(c?.description || '').slice(0, 160),
    items: (Array.isArray(c?.items) ? c.items : []).slice(0, 80).map((i: any) => ({
      name: String(i?.name || '').slice(0, 80), price: String(i?.price || '').slice(0, 30),
      description: String(i?.description || '').slice(0, 220), badge: String(i?.badge || '').slice(0, 20),
    })).filter((i: any) => i.name),
  })).filter((c: Category) => c.name && c.items.length)
  if (!cats.length) return NextResponse.json({ categories: [] })
  const apiKey = aiKey()
  if (!apiKey) return NextResponse.json({ error: 'no_api_key' }, { status: 503 })
  try {
    return NextResponse.json({ categories: await tidyMenu(new AiClient({ apiKey }), cats, user.id) })
  } catch (e) {
    console.error('[menu/tidy]', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'tidy_failed' }, { status: 502 })
  }
}
