import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { shopify } from '@/lib/shopify'

export const dynamic = 'force-dynamic'

/**
 * GET /api/shopify/connection?shop=my-store.myshopify.com
 *
 * Is this shop connected to the signed-in Zenya user, with a live
 * offline session? The build page polls this after sending the user
 * through OAuth in another tab.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const shop = shopify.utils.sanitizeShop(req.nextUrl.searchParams.get('shop') || '', true)
  if (!shop) return NextResponse.json({ connected: false, validShop: false })

  const { data: connection } = await supabase
    .from('shopify_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('shop', shop)
    .maybeSingle()

  let hasSession = false
  if (connection) {
    try {
      const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop)
      hasSession = Boolean(sessions?.[0]?.accessToken)
    } catch {
      hasSession = false
    }
  }

  return NextResponse.json({
    validShop: true,
    connected: Boolean(connection) && hasSession,
    authUrl: `/api/shopify/auth?shop=${encodeURIComponent(shop)}&returnTo=${encodeURIComponent('/build/connected')}`,
  })
}
