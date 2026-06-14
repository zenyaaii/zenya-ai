import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/utils/supabase/server'
import { generateTheme } from '@/lib/build/theme-generator'
import { parseBuildConfig } from '@/lib/build/parse-config'

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

  const parsed = parseBuildConfig(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, message: parsed.message }, { status: 400 })
  }
  const config = parsed.config

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

  const safeStore = config.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'store'
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
