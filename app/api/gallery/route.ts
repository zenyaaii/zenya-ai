import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * GET /api/gallery — list the caller's gallery images, newest first.
 */
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('gallery_images')
    .select('id, url, path, name, mime, bytes, width, height, source, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ images: data || [] })
}

/**
 * POST /api/gallery — record an existing URL (e.g. a theme asset) into the
 * user's gallery. Used by "save to gallery" affordances.
 *
 * Body: { url: string, name?: string, source?: 'theme'|'external' }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as
    | { url?: string; name?: string; source?: string }
    | null

  const url = (body?.url || '').trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }
  const source = body?.source === 'theme' || body?.source === 'external' ? body.source : 'external'

  // Service role bypasses RLS for the upsert-on-conflict path; we still gate
  // by the authenticated user_id above.
  const a = admin()
  const { data, error } = await a
    .from('gallery_images')
    .upsert(
      { user_id: user.id, url, name: body?.name || null, source },
      { onConflict: 'user_id,url', ignoreDuplicates: false },
    )
    .select('id, url, path, name, mime, bytes, width, height, source, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }
  return NextResponse.json({ image: data })
}
