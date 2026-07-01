import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createCheckoutSession, type PlanId } from '@/lib/checkout'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

function parsePlan(raw: string | string[] | undefined): PlanId {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (v === 'hosting' || v === 'starter' || v === 'pro') return v
  return 'onetime'
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  const plan = parsePlan(searchParams.plan)

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?mode=signup&next=/checkout?plan=${plan}`)
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return <CheckoutError message="لم تُهيّأ المدفوعات بعد. مفتاح STRIPE_SECRET_KEY مفقود." />
  }

  // Skip the Stripe round-trip if the user already has what this plan would give them.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, has_hosting, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (plan === 'onetime' && profile?.is_pro) {
    redirect('/dashboard?already_pro=1')
  }
  if (plan === 'hosting' && profile?.has_hosting) {
    redirect('/dashboard?already_hosting=1')
  }
  if (plan === 'starter' && (profile?.plan === 'starter' || profile?.plan === 'pro')) {
    redirect('/dashboard?already_pro=1')
  }
  if (plan === 'pro' && profile?.plan === 'pro') {
    redirect('/dashboard?already_pro=1')
  }

  const h = headers()
  const country = h.get('x-vercel-ip-country') || null
  const origin = getOrigin()

  try {
    const session = await createCheckoutSession({
      plan,
      userId: user.id,
      email: user.email,
      country,
      origin,
    })

    if (!session.url) {
      return <CheckoutError message="لم تُرجِع Stripe رابط دفع." />
    }

    redirect(session.url)
  } catch (e: any) {
    if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e
    return <CheckoutError message={`خطأ من Stripe: ${e.message}`} />
  }
}

function CheckoutError({ message }: { message: string }) {
  return (
    <main className="min-h-[calc(100vh-68px)] bg-surface px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-token bg-white p-8 shadow-soft-sm">
        <h1 className="text-xl font-semibold text-foreground">تعذّر بدء عملية الدفع</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/pricing"
            className="rounded-md border border-token bg-background px-4 py-2 text-sm font-medium text-muted hover:bg-black/5"
          >
            العودة إلى الأسعار
          </Link>
          <Link
            href="mailto:support@zenya.app"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            التواصل مع الدعم
          </Link>
        </div>
      </div>
    </main>
  )
}
