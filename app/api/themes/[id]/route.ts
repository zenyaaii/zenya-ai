import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { extractImageUrls } from '@/lib/extract-image-urls'

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
 * GET /api/themes/[id] — fetch a single theme (owned by caller).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Idempotent gallery top-up: every image the theme references gets
  // upserted into the user's gallery so old themes (created before the
  // auto-seed) and any race-with-POST cases are covered. Fire-and-forget.
  try {
    const urls = extractImageUrls((data as any).content)
    if (urls.length > 0) {
      const rows = urls.map((url) => ({
        user_id: user.id,
        url,
        source: 'theme' as const,
      }))
      admin()
        .from('gallery_images')
        .upsert(rows, { onConflict: 'user_id,url', ignoreDuplicates: true })
        .then(({ error: e }) => {
          if (e) console.error('[themes GET] gallery top-up failed:', e.message)
        })
    }
  } catch (e) {
    console.error('[themes GET] gallery top-up threw:', e)
  }

  return NextResponse.json({ theme: data })
}

/**
 * PATCH /api/themes/[id]
 * Body: { content?: object, product_name?: string }
 *
 * Updates the theme's content jsonb. Used by the editor — the client
 * sends back the full content object after the user edits text /
 * toggles section visibility / sets social links. Auth + ownership
 * enforced; activity log on success.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body?.content !== undefined && typeof body.content === 'object') {
    patch.content = body.content
  }
  if (typeof body?.product_name === 'string' && body.product_name.trim().length > 0) {
    patch.product_name = body.product_name.trim().slice(0, 80)
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const a = admin()
  // Verify ownership before letting the service role write.
  const { data: existing } = await a
    .from('themes')
    .select('id, user_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data, error } = await a
    .from('themes')
    .update(patch)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    console.error('[/api/themes/[id]] update failed', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.edited',
    metadata: { theme_id: params.id, fields: Object.keys(patch).filter((k) => k !== 'updated_at') } as any,
  })

  return NextResponse.json({ ok: true, theme: data })
}

const GALLERY_BUCKET = 'theme-uploads'

/**
 * DELETE /api/themes/[id] — permanently remove a theme.
 *
 * Query: ?deleteImages=1  → also remove the images this theme used from the
 *        user's gallery (rows + storage objects), BUT only those not
 *        referenced by any of the user's *other* themes, so a shared image is
 *        never yanked out from under a site that still needs it.
 *
 * Cascade behaviour (per schema):
 *   • site_views       → ON DELETE CASCADE (rows removed)
 *   • domains.theme_id → ON DELETE SET NULL (row survives, unlinked so the
 *                        user can detach it from /dashboard/domains)
 *   • gallery_images   → not linked to theme; images stay in the user's gallery
 *                        unless ?deleteImages=1 opts in (see above)
 *
 * Ownership enforced; activity log on success.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const deleteImages = req.nextUrl.searchParams.get('deleteImages') === '1'

  const a = admin()
  const { data: existing } = await a
    .from('themes')
    .select('id, user_id, slug, is_published, product_name, content')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Work out which images are safe to delete BEFORE removing the theme.
  let deletableUrls: string[] = []
  if (deleteImages) {
    try {
      const theseUrls = extractImageUrls((existing as any).content)
      if (theseUrls.length > 0) {
        // Collect every image URL referenced by the user's OTHER themes.
        const { data: others } = await a
          .from('themes')
          .select('content')
          .eq('user_id', user.id)
          .neq('id', params.id)
        const stillInUse = new Set<string>()
        for (const row of others || []) {
          for (const u of extractImageUrls((row as any).content)) stillInUse.add(u)
        }
        deletableUrls = theseUrls.filter((u) => !stillInUse.has(u))
      }
    } catch (e) {
      console.error('[/api/themes/[id]] image cleanup planning failed', e)
    }
  }

  const { error } = await a
    .from('themes')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[/api/themes/[id]] delete failed', error)
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  // Best-effort image cleanup — never fail the delete over it.
  let deletedImages = 0
  if (deleteImages && deletableUrls.length > 0) {
    try {
      const { data: rows } = await a
        .from('gallery_images')
        .select('id, url, path')
        .eq('user_id', user.id)
        .in('url', deletableUrls)

      const paths = (rows || []).map((r: any) => r.path).filter(Boolean) as string[]
      if (paths.length > 0) {
        await a.storage.from(GALLERY_BUCKET).remove(paths).catch(() => null)
      }
      const ids = (rows || []).map((r: any) => r.id)
      if (ids.length > 0) {
        const { error: delErr } = await a
          .from('gallery_images')
          .delete()
          .eq('user_id', user.id)
          .in('id', ids)
        if (!delErr) deletedImages = ids.length
        else console.error('[/api/themes/[id]] gallery row delete failed', delErr)
      }
    } catch (e) {
      console.error('[/api/themes/[id]] image cleanup failed', e)
    }
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'theme.deleted',
    metadata: {
      theme_id: params.id,
      slug: existing.slug,
      was_published: !!existing.is_published,
      product_name: existing.product_name,
      deleted_images: deletedImages,
    } as any,
  })

  return NextResponse.json({ ok: true, deletedImages })
}
