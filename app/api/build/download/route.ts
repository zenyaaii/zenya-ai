import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/utils/supabase/server'
import { generateTheme, type BuildConfig } from '@/lib/build/theme-generator'
import { getPalette } from '@/lib/build/palettes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/build/download
 *
 * Body: BuildConfig (subset — paletteId resolves the colors server-side
 * so the client can't smuggle a bogus palette into the theme settings).
 *
 * Generates the full Online Store 2.0 theme via the theme generator,
 * zips it with jszip, and streams it back as application/zip. The
 * filename includes the store/product handle so the download tray
 * stays organised.
 *
 * Auth required. We don't store anything server-side here — the build
 * state lives in the browser until/unless the user installs the theme.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const productName = String(body?.productName || '').trim()
  const storeName = String(body?.storeName || '').trim()
  const salePrice = Number(body?.salePrice)
  const originalPrice = Number(body?.originalPrice) || 0
  const images = Array.isArray(body?.images)
    ? body.images.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 12)
    : []
  const paletteId = String(body?.paletteId || '')
  const description = String(body?.description || '')
  const highlights = Array.isArray(body?.highlights)
    ? body.highlights.map((s: any) => String(s || '')).filter(Boolean).slice(0, 10)
    : []
  const sourceUrl = String(body?.sourceUrl || '')

  if (!productName || !storeName) {
    return NextResponse.json(
      { error: 'invalid', message: 'productName and storeName are required.' },
      { status: 400 }
    )
  }
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return NextResponse.json(
      { error: 'invalid_price', message: 'salePrice must be a positive number.' },
      { status: 400 }
    )
  }
  if (images.length < 5) {
    return NextResponse.json(
      { error: 'not_enough_images', message: 'Pick at least 5 product images first.' },
      { status: 400 }
    )
  }

  const palette = getPalette(paletteId)
  const config: BuildConfig = {
    productName,
    storeName,
    salePrice,
    originalPrice,
    images,
    paletteId: palette.id,
    paletteName: palette.name,
    paletteVibe: palette.vibe,
    paletteColors: {
      bg: palette.bg, surface: palette.surface, fg: palette.fg, muted: palette.muted,
      primary: palette.primary, primaryFg: palette.primaryFg,
      accent: palette.accent, border: palette.border,
    },
    description: description || undefined,
    highlights: highlights.length ? highlights : undefined,
    sourceUrl: sourceUrl || undefined,
  }

  const files = generateTheme(config)
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content)
  }

  const u8 = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const safeStore = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'store'
  const filename = `${safeStore}-zenya-theme.zip`

  // Wrap in a Blob — Next's NextResponse body type doesn't accept a
  // bare Uint8Array under our TS lib config, but Blob is universal.
  const blob = new Blob([u8 as unknown as BlobPart], { type: 'application/zip' })

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(u8.byteLength),
      'Cache-Control': 'no-store',
    },
  })
}
