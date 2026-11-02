/**
 * The public look at the restaurant builder.
 *
 * THIS IS THE REAL WIZARD, NOT A DRAWING OF IT. It renders the same
 * RestaurantWizard component as /theme/new/restaurant, in its `demo` mode:
 * nobody is signed in here, so it keeps no draft, cannot upload, reads the menu
 * analyzer's bundled sample, and its last step hands the reader to the real
 * builder instead of calling a generator a public page cannot reach.
 */

import type { Metadata } from "next"
import RestaurantWizard from "@/components/zenya/build/wizards/RestaurantWizard"
import { LaylProduct } from "@/components/zenya/redesign/layl"

export const metadata: Metadata = {
  title: "ابنِ موقع مطعم",
  robots: { index: false, follow: false },
}

/** In the «ليل» product frame, the same one the builder wears at /theme/new/restaurant. */
export default function DemoBuildPage() {
  return <LaylProduct><RestaurantWizard demo /></LaylProduct>
}
