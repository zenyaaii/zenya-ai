import { NextRequest, NextResponse } from 'next/server'
import { createOneTimeCheckoutSession } from '@/lib/checkout'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const origin = req.headers.get('origin') || ''

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ url: origin + '/dashboard?demo_success=true' })
  }

  const country = req.headers.get('x-vercel-ip-country') || null

  try {
    const session = await createOneTimeCheckoutSession({
      userId: user.id,
      email: user.email,
      country,
      origin,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('Stripe checkout creation failed:', e)
    return NextResponse.json({ error: 'stripe_checkout_error', details: e.message }, { status: 500 })
  }
}
