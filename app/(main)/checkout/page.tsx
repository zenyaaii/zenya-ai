import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createOneTimeCheckoutSession } from '@/lib/checkout'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
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

  // Skip the Stripe round-trip if the user already paid.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_pro) {
    redirect('/dashboard?already_pro=1')
  }

  const h = headers()
  const country = h.get('x-vercel-ip-country') || null
  const origin = getOrigin()

  try {
    const session = await createOneTimeCheckoutSession({
      userId: user.id,
      email: user.email,
      country,
      origin,
    })

    if (!session.url) {
      return <CheckoutError message="Stripe returned no checkout URL." />
    }

    redirect(session.url)
  } catch (e: any) {
    // Next.js implements redirect() by throwing — re-throw so the redirect
    // propagates instead of being swallowed as a generic error.
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
