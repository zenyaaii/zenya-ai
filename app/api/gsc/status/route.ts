import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { gscConfigured } from '@/lib/gsc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * GET /api/gsc/status → is the current user connected to Search Console?
 * Never returns tokens — only whether a connection exists + which email.
 */
export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ connected: false, configured: gscConfigured() })

  const { data } = await admin()
    .from('gsc_connections')
    .select('google_email')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    configured: gscConfigured(),
    connected: !!data,
    email: data?.google_email ?? null,
  })
}
