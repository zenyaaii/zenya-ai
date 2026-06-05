import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BUCKET = 'theme-uploads'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
])

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function extFromType(t: string) {
  if (t === 'image/jpeg') return 'jpg'
  if (t === 'image/png')  return 'png'
  if (t === 'image/webp') return 'webp'
  if (t === 'image/gif')  return 'gif'
  if (t === 'image/avif') return 'avif'
  return 'bin'
}

/**
 * POST /api/upload
 * Body: multipart/form-data with a single "file" field.
 *
 * Auth-gated. Validates type + size. Uploads to the public
 * theme-uploads bucket. Returns { url } — a public CDN URL the form
 * can drop straight into hero_image_url / item.image_url / etc.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'invalid_body', message: 'Expected multipart/form-data.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }

  const type = (file.type || '').toLowerCase()
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: 'unsupported_type', message: 'Use JPG, PNG, WebP, GIF, or AVIF.' },
      { status: 415 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'too_large', message: 'Max 5 MB per image. Try compressing it.' },
      { status: 413 }
    )
  }

  const arrayBuf = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)

  // Key: per-user folder so each owner's uploads sit together. The slug
  // adds entropy so collisions are vanishingly rare.
  const rand = Math.random().toString(36).slice(2, 10)
  const ts = Date.now()
  const path = `${user.id}/${ts}-${rand}.${extFromType(type)}`

  const a = admin()
  const { error: upErr } = await a.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: type,
      cacheControl: '31536000', // immutable — the random suffix already busts cache
      upsert: false,
    })
  if (upErr) {
    console.error('[/api/upload] storage error:', upErr)
    return NextResponse.json(
      { error: 'storage_error', message: upErr.message },
      { status: 500 }
    )
  }

  const { data: pub } = a.storage.from(BUCKET).getPublicUrl(path)
  if (!pub?.publicUrl) {
    return NextResponse.json({ error: 'no_public_url' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    url: pub.publicUrl,
    path,
    type,
    size: file.size,
  })
}
