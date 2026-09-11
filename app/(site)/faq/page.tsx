/**
 * Candidate FAQ page — the house style applied to the eleven questions.
 *
 * NOT the live page. It ships at /demo/faq so it can be read at a real
 * address; app/(main)/faq/page.tsx is untouched, and this route imports the
 * same faq-data module rather than copying its entries. No API, no schema, no
 * live route. It is noindex.
 *
 * DESIGN READ: a redesign of a reference page for someone with one specific
 * question, in the house language: flat #fafafa, near-black Arabic at display
 * size, hairline rules instead of eleven cards, and the accent only on the
 * question that is open.
 * Dials: DESIGN_VARIANCE 7, MOTION_INTENSITY 4, VISUAL_DENSITY 4.
 *
 * WHAT THE LIVE SURFACE MEASURES, in the browser at 360/390/430/768/1440:
 *   · The same three aurora orbs as /about: rgba(94,106,210,0.06),
 *     rgba(217,119,6,0.07) and rgba(113,112,255,0.03), each blur(64px) at
 *     opacity 0.7, over #f7f4ed rather than the flat #fafafa.
 *   · .gradient-text on the headline, linear-gradient(120deg, #4f5ab8 10%,
 *     #7170ff 100%).
 *   · Three Arabic elements tracked negatively: the h1 at -1.4px on a phone
 *     and -1.8px from 768, and the closing h2 at -0.4px.
 *   · Three elements under 12px rendered: both eyebrows at 10.2px and the
 *     CTA line at 11.9px.
 *   · Two contrast failures: the eyebrow at 4.28:1 on its own fill, and the
 *     تواصل معنا link at 4.28:1 on the ground. Both need 4.5.
 *   · The call to action sits 1846px down at 390.
 *   · With JavaScript disabled only 827 characters of an eleven-question FAQ
 *     are reachable: the Radix accordion cannot open and three blocks are
 *     server-rendered with style="opacity:0".
 *
 * WHAT CAME BACK CLEAN: no horizontal scroll at any width, no tap target
 * under floor, the eyebrow budget is 2 against a ceiling of 2, and there is
 * no invented proof on the page.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md.
 */

import type { Metadata } from "next"
import FaqView from "@/components/zenya/faq/FaqView"

export const metadata: Metadata = {
  title: "الأسئلة الشائعة (نسخة تجريبية)",
  robots: { index: false, follow: false },
}

export default function DemoFaqPage() {
  return <FaqView />
}
