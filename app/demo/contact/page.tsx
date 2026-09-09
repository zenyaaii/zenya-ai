/**
 * Candidate contact page — the house style applied to the channel where
 * someone writes to Zenya.
 *
 * NOT the contact channel. It ships as a standalone route at /demo/contact so
 * it can be read on the real domain; the live surfaces are untouched:
 * app/(main)/contact/page.tsx is still the form that submits,
 * app/api/contact/route.ts is still the only thing that receives it, and
 * lib/company.ts is still the single source for every legal value. This page
 * changes the STYLE of that channel and nothing else: no schema, no route, no
 * API. It is noindex, because a second contact form in the index would
 * compete with the real one for the same query.
 *
 * DESIGN READ: the address, then the form, on bare paper. A contact page is
 * read by someone who wants to reach a person, so the three real channels are
 * the first object under the heading and the form is the alternative to them
 * rather than the point of the page. Flat #fafafa, hairline rings for
 * elevation, no wash and no gradient anywhere.
 * Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 4.
 *
 * WHAT THE LIVE SURFACE LOOKS LIKE, and why this restyle is worth doing.
 * Measured on app/(main)/contact/page.tsx at 390 and 1440, in the browser:
 * three blurred orbs of violet, amber and indigo drift behind the page while
 * the house style says every pixel of colour belongs to the light at the
 * edges; the form card is elevated by a 4px drop shadow rather than the
 * hairline ring token; the h1 is tracked to -1.6px at 390 and -2px at 1440 on
 * Arabic letterforms that connect; six labels are 11px uppercase with 1.32px
 * of tracking, on Arabic, where uppercase does nothing and tracking breaks
 * the joins; the placeholder measures #9ca3af at 2.31:1 on its own field; the
 * topic chips render 28.1px tall under a coarse pointer against a 32px floor;
 * and the whole page is served with style="opacity:0" on all three of its
 * blocks, so with JavaScript disabled it is blank. Every one of those is
 * fixed here rather than argued with.
 *
 * THE FACTS ARE REAL AND THEY COME FROM ONE PLACE. The register card reads
 * lib/company.ts, the module the privacy, terms, cookies, refund and
 * subprocessors pages already share, so the legal name, the entity type, the
 * KvK number, the VAT status and the country cannot drift from what those
 * pages say. The telephone number and Musannef's own web address are the two
 * values that module does not carry; they are declared once in ContactView
 * and marked as what they are. Nothing on this page is invented: no street,
 * no opening hours, no second number, no support promise beyond the one the
 * live page already makes.
 *
 * AND NOTHING IS SUBMITTED. There is no fetch in this tree. The form runs the
 * product's real rules, the zod bounds in app/api/contact/route.ts and the
 * checks app/(main)/contact/page.tsx runs before it posts, then stops at the
 * door, quotes the real thank-you rather than printing a new one, and hands
 * the reader to /contact.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md: "contact" is
 * in DEMO_SUBDOMAIN_PAGES, so this renders at demo.zenyaai.co/contact.
 */

import type { Metadata } from "next"
import ContactView from "./ContactView"

export const metadata: Metadata = {
  title: "تواصل مع زينيا — نسخة تجريبية",
  robots: { index: false, follow: false },
}

export default function DemoContactPage() {
  return <ContactView />
}
