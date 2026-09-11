/**
 * A restyle proposal for the RESTAURANT WIZARD, not for /build.
 *
 * IT IS FILED UNDER THE WRONG NAME AND THE NAME IS KEPT ON PURPOSE, because
 * the confusion it caused is worth recording. The candidate set shipped this
 * as "build", and the promotion nearly put it at /build — which is a
 * different surface entirely. /build is the Shopify one-product builder:
 * paste a product URL, pick images, choose colours, generate a theme. What
 * this page restyles is app/(main)/theme/new/restaurant, the eight-step
 * restaurant brief. Every string in components/zenya/build/spec.ts is copied
 * out of that wizard, and the presets are imported from its own
 * utils/restaurant/presets so a palette cannot drift between the two.
 *
 * SO IT STAYS A PROPOSAL, while the rest of the candidate set went live. The
 * wizard it proposes for sits behind an account and runs the generator; this
 * route is public and noindex, and a public page cannot reach that generator.
 * The last step is therefore a review, and its call to action hands the
 * reader to the real builder. A page that pretended to POST to a generator it
 * cannot reach would be the same class of lie as a stock photo standing in
 * for a template preview.
 *
 * WHAT IT IS WORTH LOOKING AT FOR: the rail-and-stage composition, the
 * eight-step progress model, and the rule that the accent is spent on
 * progress and on the action and nowhere else. Those transfer to the wizard
 * whether or not this exact form does.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md: "build" is
 * in DEMO_SUBDOMAIN_PAGES, so this renders at demo.zenyaai.co/build.
 */

import type { Metadata } from "next"
import BuildFormView from "@/components/zenya/build/BuildFormView"

export const metadata: Metadata = {
  title: "ابنِ موقعك — مقترح تصميم",
  robots: { index: false, follow: false },
}

export default function DemoBuildPage() {
  return <BuildFormView />
}
