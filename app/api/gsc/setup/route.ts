import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { publicSiteUrl } from '@/lib/portal-urls'
import { extractGscToken } from '@/lib/seo'
import {
  addSite, getValidAccessToken, getVerificationToken, submitSitemap, verifySite,
} from '@/lib/gsc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * POST /api/gsc/setup  { themeId }
 *
 * One-click Search Console setup for a published Zenya site — no manual steps:
 *   1. Ask Google for a META verification token.
 *   2. Plant it on the live site (themes.content.seo.gscVerification → rendered
 *      as <meta name="google-site-verification">).
 *   3. Verify ownership (retried, since the token must be live first).
 *   4. Add the site as a URL-prefix property.
 *   5. Submit the sitemap.
 *
 * Returns granular per-step results so the UI can tell the owner exactly what
 * happened — never a fake "done". Needs the broadened write scopes; if the
 * connected token predates them we return `reason:'reconnect_required'`.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any = {}
  try { body = await req.json() } catch {}
  const themeId = body?.themeId
  if (!themeId) return NextResponse.json({ error: 'missing_theme' }, { status: 400 })

  const a = admin()
  const { data: theme } = await a
    .from('themes')
    .select('id, user_id, slug, is_published, content')
    .eq('id', themeId)
    .maybeSingle()
  if (!theme || theme.user_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!theme.slug || !theme.is_published) {
    return NextResponse.json({ ok: false, reason: 'not_published' })
  }

  const accessToken = await getValidAccessToken(a, user.id)
  if (!accessToken) return NextResponse.json({ ok: false, reason: 'not_connected' })

  const siteUrl = publicSiteUrl(theme.slug) + '/'
  const sitemapUrl = publicSiteUrl(theme.slug) + '/sitemap.xml'
  const steps: Record<string, { ok: boolean; error?: string }> = {}

  // 1. token ---------------------------------------------------------------
  const tokenRes = await getVerificationToken(accessToken, siteUrl, 'META')
  if (!tokenRes.ok) {
    // 401/403 here almost always means the token lacks the new write scopes.
    if (tokenRes.status === 401 || tokenRes.status === 403) {
      return NextResponse.json({ ok: false, reason: 'reconnect_required', error: tokenRes.error })
    }
    return NextResponse.json({ ok: false, reason: 'token_failed', error: tokenRes.error, steps })
  }
  const token = extractGscToken(String(tokenRes.data || ''))
  if (!token) return NextResponse.json({ ok: false, reason: 'token_failed', error: 'empty_token', steps })
  steps.token = { ok: true }

  // 2. plant the token on the live site ------------------------------------
  const content = (theme.content && typeof theme.content === 'object') ? { ...theme.content } : {}
  const seo = ((content as any).seo && typeof (content as any).seo === 'object') ? { ...(content as any).seo } : {}
  seo.gscVerification = token.slice(0, 200)
  delete seo.gscFile // only one method active at a time
  ;(content as any).seo = seo
  const { error: saveErr } = await a
    .from('themes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', themeId)
  if (saveErr) {
    return NextResponse.json({ ok: false, reason: 'save_failed', error: saveErr.message, steps })
  }
  steps.planted = { ok: true }

  // 3. verify — retried, because the meta tag has to be live first ---------
  let verified = false
  let verifyErr: string | undefined
  for (let i = 0; i < 4 && !verified; i++) {
    if (i > 0) await sleep(2000)
    const v = await verifySite(accessToken, siteUrl, 'META')
    verified = v.ok
    verifyErr = v.error
  }
  steps.verified = { ok: verified, error: verified ? undefined : verifyErr }

  // 4. add the property (needs a verified owner) ---------------------------
  if (verified) {
    const add = await addSite(accessToken, siteUrl)
    steps.added = { ok: add.ok, error: add.ok ? undefined : add.error }

    // 5. submit the sitemap ------------------------------------------------
    if (add.ok) {
      const sm = await submitSitemap(accessToken, siteUrl, sitemapUrl)
      steps.sitemap = { ok: sm.ok, error: sm.ok ? undefined : sm.error }
    }
  }

  await a.from('activity_logs').insert({
    user_id: user.id,
    event_type: 'gsc.auto_setup',
    metadata: { theme_id: themeId, verified, steps } as any,
  }).then(() => {}, () => {})

  const ok = verified && !!steps.added?.ok
  return NextResponse.json({
    ok,
    // Verified but the tag may still be propagating → let the UI offer a retry.
    reason: ok ? 'done' : verified ? 'partial' : 'verify_pending',
    property: siteUrl,
    steps,
  })
}
