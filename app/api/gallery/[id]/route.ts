import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = 'theme-uploads'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * DELETE /api/gallery/[id] — remove an image from the user's gallery. If the
 * image lives in our storage bucket, the object is also deleted.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: row, error: getErr } = await supabase
    .from('gallery_images')
    .select('id, path')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (getErr) return NextResponse.json({ error: 'db_error', message: getErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Best-effort: delete the storage object first, then the row. We don't
  // fail the request if the object is already gone.
  if (row.path) {
    const a = admin()
    await a.storage.from(BUCKET).remove([row.path]).catch(() => null)
  }

  const { error: delErr } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', row.id)
    .eq('user_id', user.id)

  if (delErr) return NextResponse.json({ error: 'db_error', message: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
