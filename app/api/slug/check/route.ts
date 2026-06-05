import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { validateSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

/**
 * GET /api/slug/check?slug=foo
 * Returns { available: boolean, reason?: 'too_short'|'too_long'|... }
 * Cheap, debounce-able. Available means the slug passes validation AND is
 * not currently held by another theme.
 */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('slug') || '').trim().toLowerCase()
  if (!raw) return NextResponse.json({ available: false, reason: 'too_short' })

  const check = validateSlug(raw)
  if (!check.ok) return NextResponse.json({ available: false, reason: check.reason })

  const supabase = createClient()
  const { count, error } = await supabase
    .from('themes')
    .select('id', { count: 'exact', head: true })
    .ilike('slug', raw)

  if (error) {
    return NextResponse.json({ available: false, reason: 'lookup_failed', error: error.message }, { status: 500 })
  }

  return NextResponse.json({ available: (count ?? 0) === 0 })
}
