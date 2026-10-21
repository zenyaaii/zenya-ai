import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { userIsAdmin } from '@/lib/is-admin'
import { handoverSiteName, handoverSiteUrl, handoverToken, serviceClient } from '@/lib/handover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  if (!(await userIsAdmin(user.id))) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { user }
}

/** GET /api/admin/handovers — every notice sent, newest first. */
export async function GET() {
  const gate = await requireAdmin()
  if (gate.error) return gate.error

  const a = serviceClient()
  const { data, error } = await a
    .from('site_handovers')
    .select('id, email, is_test, status, note, sent_at, answered_at, theme:themes(slug, product_name, published_url)')
    .order('sent_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: 'load_failed', message: error.message }, { status: 500 })

  const handovers = (data || []).map((r: any) => ({
    id: r.id,
    email: r.email,
    is_test: r.is_test,
    status: r.status,
    note: r.note,
    sent_at: r.sent_at,
    answered_at: r.answered_at,
    site: r.theme ? handoverSiteName(r.theme) : '—',
    url: r.theme ? handoverSiteUrl(r.theme) : null,
  }))
  return NextResponse.json({ handovers })
}

/**
 * POST /api/admin/handovers { site, test }
 *   site  the site's address or slug ("hybridautoservice" or
 *         "hybridautoservice.beynoun.com")
 *   test  true puts it in the admin's own bell, as if they owned the site, so
 *         they can see it first
 *
 * No email goes out: the notice is an entry in the owner's notification bell
 * (GET /api/handover), and their yes or no comes back here as ✓ or ✗.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate.error) return gate.error
  const me = gate.user

  const body = await req.json().catch(() => ({}))
  const slug = String(body?.site || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\.(?:beynoun\.com|zenyaai\.co)$/, '')
  const test = body?.test === true
  if (!/^[a-z0-9-]{1,63}$/.test(slug)) {
    return NextResponse.json({ error: 'bad_site', message: 'اكتب عنوان الموقع، مثل hybridautoservice' }, { status: 400 })
  }

  const a = serviceClient()
  const { data: theme } = await a
    .from('themes')
    .select('id, user_id, slug, product_name, published_url, is_published')
    .eq('slug', slug)
    .maybeSingle()
  if (!theme) return NextResponse.json({ error: 'not_found', message: 'لا يوجد موقع بهذا العنوان.' }, { status: 404 })

  // The person the notice is for: the site's owner, or the admin on a test.
  const toUserId = test ? me.id : (theme as any).user_id
  const { data: owner } = await a.auth.admin.getUserById(toUserId)
  const email = owner?.user?.email || ''
  if (!test && (await userIsAdmin(toUserId))) {
    return NextResponse.json({ error: 'still_yours', message: 'الموقع ما زال في حسابك. انقله إلى حساب العميل أولًا.' }, { status: 409 })
  }

  const token = handoverToken()
  const { data: row, error: insErr } = await a
    .from('site_handovers')
    .insert({ theme_id: theme.id, user_id: toUserId, email, token, is_test: test, sent_by: me.id })
    .select('id')
    .single()
  if (insErr) return NextResponse.json({ error: 'save_failed', message: insErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: row.id, email })
}
