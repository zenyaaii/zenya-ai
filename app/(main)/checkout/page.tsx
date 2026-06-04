import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

async function resolvePriceId(): Promise<string | { error: string }> {
  const explicit =
    process.env.STRIPE_PRICE_ID ||
    process.env.STRIPE_PRICE_ID_BIMONTHLY ||
    ''
  if (explicit) return explicit

  const productId = process.env.STRIPE_PRODUCT_ID || ''
  if (!productId) return { error: 'No STRIPE_PRICE_ID or STRIPE_PRODUCT_ID configured.' }

  try {
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
    const recurring = prices.data.find((p) => p.recurring)
    if (!recurring) return { error: 'No active recurring price found on the product.' }
    return recurring.id
  } catch (e: any) {
    return { error: `Stripe price lookup failed: ${e.message}` }
  }
}

export default async function CheckoutPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?mode=signup&next=/checkout')
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return <CheckoutError message="Payments aren't configured yet. STRIPE_SECRET_KEY is missing." />
  }

  const priceOrError = await resolvePriceId()
  if (typeof priceOrError !== 'string') {
    return <CheckoutError message={priceOrError.error} />
  }

  const origin = getOrigin()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user.id,
      customer_email: user.email,
      line_items: [{ price: priceOrError, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: { trial_period_days: 14 },
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    })

    if (!session.url) {
      return <CheckoutError message="Stripe returned no checkout URL." />
    }

    redirect(session.url)
  } catch (e: any) {
    // Next.js uses a thrown redirect under the hood — re-throw so the
    // redirect propagates instead of being caught as a generic error.
    if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e
    return <CheckoutError message={`Stripe error: ${e.message}`} />
  }
}

function CheckoutError({ message }: { message: string }) {
  return (
    <main className="min-h-[calc(100vh-68px)] bg-surface px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-token bg-white p-8 shadow-soft-sm">
        <h1 className="text-xl font-semibold text-foreground">We couldn&apos;t start checkout</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/pricing"
            className="rounded-md border border-token bg-background px-4 py-2 text-sm font-medium text-muted hover:bg-black/5"
          >
            Back to pricing
          </Link>
          <Link
            href="mailto:support@zenya.app"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Contact support
          </Link>
        </div>
      </div>
    </main>
  )
}
