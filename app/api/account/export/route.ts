import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GDPR Art. 15 (right of access) + Art. 20 (data portability).
 * Returns a JSON dump of everything we hold on the authenticated user.
 * Auth is via the session cookie; RLS limits the rows to their own.
 */
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const [profile, themes, purchases, scrapes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('themes').select('*').eq('user_id', user.id),
    supabase.from('purchases').select('*').eq('user_id', user.id),
    supabase.from('scrape_history').select('*').eq('user_id', user.id),
  ])

  const dump = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      user_metadata: user.user_metadata,
    },
    profile: profile.data,
    themes: themes.data,
    purchases: purchases.data,
    scrape_history: scrapes.data,
  }

  return new NextResponse(JSON.stringify(dump, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="zenya-data-${user.id}.json"`,
    },
  })
}
