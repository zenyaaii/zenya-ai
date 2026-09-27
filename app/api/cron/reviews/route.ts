import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { hasReviews, mergeGoogleCounted } from '@/lib/reviews-bank'
import { googleUrl, lookupGoogleReviews } from '@/lib/google-reviews'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * GET /api/cron/reviews
 *
 * The daily Google check. For every site whose owner connected a Google
 * listing on the Reviews page, read the listing again and bring in any
 * review we have not seen. New ones land hidden and marked is_new, so
 * nothing reaches the site until the owner switches it on; the dashboard's
 * bell counts them. Reviews the owner deleted stay out (review_bank.removed).
 *
 * One Places call per connected site per day (two the first time, when we
 * only have the link and must find the place). Auth: Vercel cron user-agent
 * or Bearer CRON_SECRET, like the other crons.
 */
export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('user-agent')?.includes('vercel-cron') ?? false
  const secret = process.env.CRON_SECRET || ''
  const bearerOk = secret && (req.headers.get('authorization') || '') === `Bearer ${secret}`
  if (!isVercelCron && !bearerOk) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return NextResponse.json({ skipped: 'not_configured' })

  const db = adminDb()
  const { data: rows, error } = await db
    .from('themes')
    .select('id, template_type, content')
    .not('content->review_bank->google', 'is', null)
    .limit(1000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let checked = 0, updated = 0, added = 0, failed = 0
  for (const row of rows || []) {
    const content: any = row.content
    const bt: string = content?.business_type || row.template_type
    const g = content?.review_bank?.google
    if (!hasReviews(bt) || !g?.link) continue
    checked++
    try {
      const r = await lookupGoogleReviews(key, { placeId: g.place_id, link: googleUrl(g.link) })
      const out = mergeGoogleCounted(bt, content, g.link, r)
      const { error: upErr } = await db.from('themes').update({ content: out.content }).eq('id', row.id)
      if (upErr) throw new Error(upErr.message)
      updated++
      added += out.added
    } catch (e) {
      failed++
      console.error('[cron/reviews]', row.id, e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ checked_at: new Date().toISOString(), checked, updated, added, failed })
}
