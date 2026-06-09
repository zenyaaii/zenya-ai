/**
 * Theme cover image resolver.
 *
 *   GET /api/theme-preview/studio
 *
 * Checks `public/theme-previews/<id>.png` on disk:
 *   • file exists → 302 to the static asset, browsers cache it normally
 *   • file missing → 302 to the curated Unsplash fallback so the card
 *     never renders blank or logs a 404
 *
 * Why this exists: client components can't run `fs.existsSync`, so the
 * old approach hard-coded a `HAS_LOCAL_PREVIEW` set in lib/. Forgetting
 * to update that set after dropping a PNG was the source of every theme
 * card 404. Pushing the existence check to a server route means the file
 * system is the only source of truth — drop a file and every card across
 * the app picks it up on next request.
 */

import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { join, normalize } from 'path'

const FALLBACKS: Record<string, string> = {
  restaurant:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
  one_product:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
  storefront:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
  atlas:
    'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80',
  services:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80',
  collective:
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80',
  studio:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80',
  lookbook:
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
  wellness:
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80',
}

// File extensions we accept on disk, tried in order. PNG is the default
// recommendation in the docstring of lib/theme-previews.ts; the others
// are here so a user who saves a JPG / WEBP from a screenshot tool
// doesn't end up debugging "why isn't my cover showing".
const EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const

// Reject anything that doesn't look like a plain theme id — keeps the
// path-join below from sneaking out of `public/theme-previews/`.
const SAFE_ID = /^[a-z0-9_-]{1,40}$/i

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  if (!id || !SAFE_ID.test(id)) {
    return NextResponse.json({ error: 'Bad theme id' }, { status: 400 })
  }

  const previewsDir = join(process.cwd(), 'public', 'theme-previews')

  for (const ext of EXTS) {
    const fileName = `${id}.${ext}`
    const absolute = normalize(join(previewsDir, fileName))
    // Defensive: even after the SAFE_ID regex, double-check the resolved
    // path stays inside the previews directory.
    if (!absolute.startsWith(previewsDir)) continue
    if (existsSync(absolute)) {
      return NextResponse.redirect(
        new URL(`/theme-previews/${fileName}`, req.url),
        { status: 302 }
      )
    }
  }

  const fallback = FALLBACKS[id] || FALLBACKS.one_product
  return NextResponse.redirect(fallback, { status: 302 })
}
