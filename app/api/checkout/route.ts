import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, type PlanId } from '@/lib/checkout'
import { createClient } from '@/utils/supabase/server'

function parsePlan(raw: unknown): PlanId {
  return raw === 'hosting' ? 'hosting' : 'onetime'
}

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

  let plan: PlanId = 'onetime'
  try {
    const body = await req.json().catch(() => ({}))
    plan = parsePlan(body?.plan)
  } catch {
    // empty body — default to one-time
  }

  const country = req.headers.get('x-vercel-ip-country') || null

  try {
    const session = await createCheckoutSession({
      plan,
      userId: user.id,
      email: user.email,
      country,
      origin,
    })
    return NextResponse.json({ url: session.url, plan })
  } catch (e: any) {
    console.error('Stripe checkout creation failed:', e)
    return NextResponse.json({ error: 'stripe_checkout_error', details: e.message }, { status: 500 })
  }
}
