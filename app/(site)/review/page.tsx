/**
 * Candidate review page — the house style applied to the channel where a
 * customer rates Zenya.
 *
 * NOT the review channel. It ships as a standalone route at /demo/review so
 * it can be read on the real domain; the live surfaces are untouched:
 * app/(main)/contact with ?topic=review is still the form that submits,
 * app/api/reviews/route.ts is still the only thing that writes a row, and
 * components/Testimonials.tsx is still what the marketing site renders. This
 * page changes the STYLE of that channel and nothing else — no schema, no
 * route, no API. It is noindex, because a second review form in the index
 * would compete with the real one for the same query.
 *
 * DESIGN READ: ONE INSTRUMENT ON BARE PAPER. Rating is a single gesture, so
 * the five stars are the largest object on the page and every other element
 * is the sentence around them — the invitation above, the note beside, the
 * empty wall below. Flat #fafafa, hairline rings for elevation, no wash and
 * no gradient anywhere on the page.
 *
 * WHAT THE LIVE SURFACE LOOKS LIKE, and why this is a restyle worth doing.
 * The review channel today is one topic inside a five-topic contact form,
 * standing on an aurora background, with the stars as a small row under the
 * message box; the marketing site's Testimonials block adds a radial violet
 * wash, a gradient-text heading, a drop-shadowed card and an amber chip. That
 * is four house-style violations in two screens: a page that is not
 * achromatic, gradients on something that is not the light, a drop shadow
 * doing the elevation, and a second accent hue with no meaning attached. All
 * of it is gone here. The ground is one flat #fafafa, elevation is the
 * stacked hairline ring token, and #5e6ad2 appears only where it carries
 * meaning: the stars the reader has set, the counter once the rule is met,
 * the live step of the pipeline, and the primary action.
 *
 * NO GOLD FOR THE STARS. A star is data — the value being set — so it takes
 * the accent, which is what the house style already allows data to do. An
 * invented gold would be a second hue on an achromatic page, and it would be
 * the only colour on it that means nothing.
 *
 * AND NOTHING IS SUBMITTED. There is no fetch in this tree. The form runs the
 * product's real rules — the zod bounds in app/api/reviews/route.ts and the
 * two checks app/(main)/contact/page.tsx runs before it posts — and then
 * stops at the door, quotes the real thank-you rather than printing it, and
 * hands the reader to /contact?topic=review. That matters more here than on
 * /demo/access: a POST from a design page would put a pending row in the
 * production reviews table that no customer ever wrote.
 *
 * THE WALL IS EMPTY ON PURPOSE. Testimonials.tsx refuses to ship invented
 * testimonials while Zenya is early. Filling this page with three plausible
 * founders would break that refusal in a nicer typeface, so the wall holds
 * labelled placeholders and says what they are waiting for.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md: "review" is
 * in DEMO_SUBDOMAIN_PAGES, so this renders at demo.zenyaai.co/review.
 */

import type { Metadata } from "next"
import ReviewView from "@/components/zenya/review/ReviewView"

export const metadata: Metadata = {
  title: "قيّم تجربتك مع زينيا — نسخة تجريبية",
  robots: { index: false, follow: false },
}

export default function DemoReviewPage() {
  return <ReviewView />
}
