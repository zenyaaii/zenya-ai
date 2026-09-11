/**
 * Checkout.
 *
 * THIS PAGE USED TO HAVE NO INTERFACE. It parsed the plan, read the profile,
 * short-circuited the already-owned cases and called redirect() to Stripe, so
 * the whole of the reader-facing checkout was a blank moment followed by
 * somebody else's page. The only thing it ever rendered was an error card.
 *
 * It renders the moment now: the plan, the amount, when it renews, and what
 * happens if it is cancelled — then the handoff. The rules underneath are
 * unchanged, and so is the fact that Zenya never sees a card: there is no
 * card field anywhere in this tree, and app/(site)/checkout/actions.ts is the
 * only thing that talks to Stripe.
 *
 * DESIGN READ: a payment handoff for someone deciding whether to trust Zenya
 * with a card. Calm and confident rather than busy — bare #fafafa paper,
 * hairline rings instead of shadows, obsidian Arabic type, violet spent only
 * as a mark. The order summary is the centre of the page rather than a
 * sidebar, because what the reader came to check is what it costs and what
 * happens next.
 * Dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 5, VISUAL_DENSITY 4.
 *
 * THE MOTION, STATED. CLAUDE.md holds dense product surfaces to the taste
 * skill's universal principles with no cinematic presets, and that caveat
 * still governs the dashboard and the settings screens. Checkout is not one
 * of those. It is the one screen where perceived quality IS the product, so
 * it runs at MOTION_INTENSITY 5 — which buys confidence, not busyness: one
 * thing moves at a time, everything arrives on the out-curve, and every
 * movement reports a state change the reader caused. No scroll hijack, no
 * parallax, no infinite loop. A page you pay on does not perform.
 *
 * EVERY PRICE COMES FROM lib/company.ts AND IS NEVER RETYPED. Two of the five
 * plans lib/checkout.ts declares have a display constant there; the other
 * three do not, so this page PRINTS NO NUMBER FOR THEM and says so. Nothing
 * about the payment is invented either — the reassurances are read straight
 * out of lib/checkout.ts: tax is calculated at Stripe, a promotion code is
 * accepted, a billing address is required, and the charge may be taken in
 * euros. No VAT line, no trial, no guarantee, no badge and no security logo.
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { PlanId } from '@/lib/checkout'
import { createClient } from '@/utils/supabase/server'
import { COMPANY } from '@/lib/company'
import CheckoutView from '@/components/zenya/checkout/CheckoutView'
import { startCheckout } from './actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'إتمام الدفع',
  robots: { index: false, follow: false },
}

/** The route's parser: anything unrecognised is the plan the product sells. */
function parsePlan(raw: string | string[] | undefined): PlanId {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (v === 'hosting' || v === 'starter' || v === 'pro' || v === 'entry' || v === 'onetime') {
    return v
  }
  return 'starter'
}

/**
 * A BARE /checkout OPENS ON STARTER, and that is a fix rather than a default.
 *
 * The old route fell through to 'onetime': the pre-2026-07-02 one-time plan,
 * which is grandfathered, is not on sale, and has no display price in
 * lib/company.ts. A new buyer following a bare /checkout link was sent to
 * Stripe for a legacy price rather than either plan the product actually
 * sells, and because the route redirected immediately they never saw which
 * plan they were buying. Both legacy plans stay fully reachable through
 * ?plan=onetime and ?plan=hosting, and both are labelled as legacy when they
 * render.
 */
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

  // Skip the whole screen if the account already has what this plan would give
  // it. Showing someone a summary for something they own is worse than a
  // redirect, because they have to read it to find that out.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, has_hosting, plan, entry_unlocked')
    .eq('id', user.id)
    .maybeSingle()

  // Entry is a one-time generation unlock. Anyone who already unlocked it
  // (grandfathered free user, paid Entry, or on any paid plan) skips it.
  if (
    plan === 'entry' &&
    (profile?.entry_unlocked ||
      profile?.is_pro ||
      ['entry', 'starter', 'pro', 'pro_hosting', 'pro_onetime', 'admin'].includes(
        String(profile?.plan || ''),
      ))
  ) {
    redirect('https://dashboard.zenyaai.co?already_unlocked=1')
  }

  if (plan === 'onetime' && profile?.is_pro) {
    redirect('https://dashboard.zenyaai.co?already_pro=1')
  }
  if (plan === 'hosting' && profile?.has_hosting) {
    redirect('https://dashboard.zenyaai.co?already_hosting=1')
  }
  if (plan === 'starter' && (profile?.plan === 'starter' || profile?.plan === 'pro')) {
    redirect('https://dashboard.zenyaai.co?already_pro=1')
  }
  if (plan === 'pro' && profile?.plan === 'pro') {
    redirect('https://dashboard.zenyaai.co?already_pro=1')
  }

  return <CheckoutView initialPlan={plan} start={startCheckout} />
}

/**
 * The one thing that can go wrong before a session exists.
 *
 * Restyled into the house language — flat ground, a hairline ring instead of
 * the drop shadow, obsidian type — and pointed at the address that is
 * actually read. It used to link to a third support mailbox that is neither
 * the one in lib/company.ts nor the one the footer prints.
 */
function CheckoutError({ message }: { message: string }) {
  return (
    <main
      dir="rtl"
      style={{ minHeight: '100dvh', background: '#fafafa', padding: '6rem 1.25rem' }}
    >
      <div
        style={{
          maxWidth: '30rem',
          margin: '0 auto',
          borderRadius: 28,
          background: '#fafafa',
          padding: '2.25rem',
          boxShadow:
            '0 0 0 1px rgba(0,0,0,0.08), 0 0 0 4px rgba(250,250,250,0.55)',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#171717', lineHeight: 1.4 }}>
          تعذّر بدء عملية الدفع
        </h1>
        <p style={{ marginTop: 10, fontSize: 15, color: '#666', lineHeight: 1.8 }}>{message}</p>
        <p style={{ marginTop: 18, fontSize: 15, color: '#666', lineHeight: 1.8 }}>
          لم يُخصم منك شيء ولم يُنشأ أي اشتراك.
        </p>
        <div style={{ marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link
            href="/pricing"
            style={{
              borderRadius: 999,
              padding: '0.7rem 1.15rem',
              fontSize: 15,
              color: '#171717',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
            }}
          >
            العودة إلى الأسعار
          </Link>
          <a
            href={`mailto:${COMPANY.SUPPORT_EMAIL}`}
            style={{
              borderRadius: 999,
              padding: '0.7rem 1.15rem',
              fontSize: 15,
              background: '#5e6ad2',
              color: '#fff',
            }}
          >
            التواصل مع الدعم
          </a>
        </div>
      </div>
    </main>
  )
}
