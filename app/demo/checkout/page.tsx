/**
 * Candidate checkout page — the house style applied to the moment someone pays.
 *
 * NOT THE CHECKOUT. It ships as a standalone route at /demo/checkout so it can
 * be read on the real domain; the live surfaces are untouched.
 * app/(main)/checkout/page.tsx is still the only thing that starts a payment,
 * lib/checkout.ts is still the only thing that talks to Stripe, and
 * lib/company.ts is still the single source for every price. This page changes
 * the STYLE of that moment and nothing else: no schema, no route, no API. It
 * is noindex, because a second checkout in the index would compete with the
 * real one for the same query.
 *
 * DESIGN READ: reading this as a payment handoff for someone deciding whether
 * to trust Zenya with a card, with a calm, confident, premium-product
 * language, leaning toward the Zenya house style — bare #fafafa paper,
 * hairline rings instead of shadows, obsidian Arabic type, and violet spent
 * only as a mark. The order summary is the centre of the page rather than a
 * sidebar, because what the reader came to check is what it costs and what
 * happens next.
 * Dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 5, VISUAL_DENSITY 4.
 *
 * THE MOTION SPLIT, STATED. CLAUDE.md holds product surfaces to the taste
 * skill's universal principles only, with no cinematic presets. That caveat is
 * written for DENSE surfaces — dashboards, data tables, settings — and it
 * still governs them: app/(app)/dashboard/**, components/dashboard/**,
 * components/app/** and the settings component are untouched by this batch.
 * Checkout is not one of those. It is the one screen where perceived quality
 * IS the product, because someone is deciding whether to hand over a card, so
 * it runs at MOTION_INTENSITY 5. What that buys is confidence, not busyness:
 * one thing moves at a time, everything arrives on the out-curve, and every
 * movement reports a state change the reader caused. No scroll hijack, no
 * parallax, no infinite loop. A page you pay on does not perform.
 *
 * WHAT THE LIVE SURFACE LOOKS LIKE, and why this candidate exists at all.
 * /checkout HAS NO INTERFACE. app/(main)/checkout/page.tsx is a server
 * component that parses the plan, reads the Supabase profile, short-circuits
 * the already-owned cases, and calls redirect() to Stripe. The ONLY thing it
 * ever renders is a CheckoutError card. So there was no style to judge and
 * nothing to restyle: the whole of the reader-facing checkout is a blank
 * moment followed by somebody else's page. This candidate designs that blank
 * moment — the summary, the spine, and the handoff — and leaves the redirect
 * exactly where it is.
 *
 * AND NOTHING IS PAID. There is no fetch, no POST, no createCheckoutSession
 * and no card field in this tree. The page runs the live route's real rules,
 * shows the real summary, then stops at the door, says plainly that it is a
 * design proposal, and hands the reader to the real /checkout.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md: "checkout" is
 * in DEMO_SUBDOMAIN_PAGES, so this renders at demo.zenyaai.co/checkout. The
 * plan arrives as ?plan=, which is a query and not a path, so the page is one
 * segment and the exact-match Set is the right list for it rather than
 * DEMO_SUBDOMAIN_PREFIXES.
 */

import type { Metadata } from "next"
import type { PlanId } from "@/lib/checkout"
import CheckoutView from "./CheckoutView"

export const metadata: Metadata = {
  title: "إتمام الدفع — نسخة تجريبية",
  robots: { index: false, follow: false },
}

/** The live route's parser, to the letter: anything unrecognised is 'onetime'.
 *  Kept identical on purpose — a candidate that resolved ?plan= differently
 *  from the route it proposes would be demonstrating the wrong flow. */
function parsePlan(raw: string | string[] | undefined): PlanId {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (v === "hosting" || v === "starter" || v === "pro" || v === "entry") return v
  return "onetime"
}

/**
 * THE ONE PLACE THIS PAGE DIVERGES FROM THE ROUTE, AND IT IS DELIBERATE.
 *
 * parsePlan above is the route's, unchanged, so ?plan=anything resolves here
 * exactly as it resolves there — including the fallback to 'onetime'. What
 * differs is the case where THERE IS NO ?plan= AT ALL.
 *
 * On the live route a bare /checkout falls through the same fallback and
 * lands on 'onetime': the pre-2026-07-02 one-time plan, which is
 * grandfathered, is not on sale, and has no display price in lib/company.ts.
 * A new buyer following a bare /checkout link is therefore sent to Stripe for
 * a legacy price rather than to either plan the product actually sells. THAT
 * IS A FINDING ABOUT THE LIVE ROUTE, reported rather than fixed here — the
 * route is not this candidate's to edit.
 *
 * The candidate opens on Starter instead, because a checkout whose default
 * view is an unpriced plan nobody can buy is not a design anyone can judge.
 * Both legacy plans stay fully reachable through ?plan=onetime and
 * ?plan=hosting, and both are labelled as legacy when they render.
 */
function initialPlan(searchParams: { plan?: string }): PlanId {
  if (searchParams.plan === undefined) return "starter"
  return parsePlan(searchParams.plan)
}

export default function DemoCheckoutPage({
  searchParams,
}: {
  searchParams: { plan?: string }
}) {
  return <CheckoutView initialPlan={initialPlan(searchParams)} />
}
