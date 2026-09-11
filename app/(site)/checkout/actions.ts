'use server'

import { headers } from 'next/headers'
import { createCheckoutSession, type PlanId } from '@/lib/checkout'
import { createClient } from '@/utils/supabase/server'

/**
 * Start a Stripe Checkout session and hand back its URL.
 *
 * IT RETURNS THE URL RATHER THAN REDIRECTING. redirect() from a server action
 * to an external origin works, but it throws NEXT_REDIRECT through the action
 * boundary, which means the one failure mode that matters here — Stripe
 * refusing the session — has to be distinguished from a control-flow throw at
 * the call site. Returning a discriminated result keeps the error path
 * ordinary, and the page turns a url into a navigation in one line.
 *
 * EVERY CHECK THE PAGE ALREADY RAN IS RUN AGAIN HERE. The page gates on a
 * session and short-circuits the plans an account already owns, but a server
 * action is a public endpoint: anything the page decided can be skipped by
 * calling this directly. So the user is read from the cookie again, never
 * from an argument, and the plan is the only thing the caller gets to choose.
 */
export async function startCheckout(
  plan: PlanId,
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'انتهت جلستك. يُرجى تسجيل الدخول ثم المحاولة مجددًا.' }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'لم تُهيّأ المدفوعات بعد. مفتاح STRIPE_SECRET_KEY مفقود.' }
  }

  const h = headers()
  const country = h.get('x-vercel-ip-country') || null

  try {
    const session = await createCheckoutSession({
      plan,
      userId: user.id,
      email: user.email,
      country,
      origin: getOrigin(),
    })
    if (!session.url) return { error: 'لم تُرجِع Stripe رابط دفع.' }
    return { url: session.url }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'خطأ غير معروف'
    return { error: `خطأ من Stripe: ${message}` }
  }
}

/** The origin Stripe returns to. NEXT_PUBLIC_SITE_URL when it is set, the
 *  forwarded host otherwise, so a preview deployment sends the customer back
 *  to the preview rather than to production. */
function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
