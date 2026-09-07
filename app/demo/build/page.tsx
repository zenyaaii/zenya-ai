/**
 * Candidate build form — the house style applied to the wizard.
 *
 * NOT the wizard. It ships as a standalone route at /demo/build so it can be
 * reviewed on the real domain; app/(main)/theme/new/** remains the live
 * builder and is untouched. It is noindex, because a second form in the index
 * would compete with the real one for the same query.
 *
 * Design read: a RAIL AND A STAGE. The catalogue at /demo/templates is a page
 * you look at; this is a page you work through, so the composition answers one
 * question at a time — where am I, and what is left. Eight steps on the start
 * side, one step on the stage, a bar underneath that never moves.
 *
 * WHERE THE VIOLET GOES, and why it is different here. On the catalogue the
 * accent had to compete with eight full-colour screenshots, so it was spent
 * only on the action. There are no screenshots on this page, so violet gets to
 * carry meaning instead of decoration: the progress fill, the current step,
 * the ring on the field you are in, a chosen chip or preset, and the primary
 * button. Type stays obsidian, the ground stays one flat #fafafa, and nothing
 * else is tinted.
 *
 * NOTHING HERE IS INVENTED. Every section title, subtitle, field label,
 * placeholder and required star in spec.ts is copied from
 * app/(main)/theme/new/restaurant/page.tsx, and the style presets are imported
 * from utils/restaurant/presets so a palette cannot drift between the demo and
 * the real form. This is the same rule app/demo/home/templates.tsx states for
 * the deck: a demo that invents a form the product does not have is worth
 * nothing.
 *
 * AND IT DOES NOT GENERATE. The generator sits behind the real wizard and
 * needs an account; this route is public. So the last step is a review and its
 * call to action hands the reader to /theme/new/restaurant, and the page says
 * so in place rather than implying a POST it cannot make. An honest edge beats
 * a convincing dead end.
 *
 * ONE TEMPLATE, AND THE SHAPE IS THE CONTRACT. The seven buildable wizards run
 * to 4,586 lines between them, each with its own repeaters, hour grids, menu
 * builders and upload rails. Restaurant is the richest at eight sections and
 * the one already mirrored in app/demo/home/templates.tsx, so it exercises the
 * design hardest and can be checked against an existing mirror. Adding another
 * is another SPEC object; nothing in the view knows the word "restaurant".
 */

import type { Metadata } from "next"
import BuildFormView from "./BuildFormView"

export const metadata: Metadata = {
  title: "ابنِ موقعك — نسخة تجريبية",
  robots: { index: false, follow: false },
}

export default function DemoBuildPage() {
  return <BuildFormView />
}
