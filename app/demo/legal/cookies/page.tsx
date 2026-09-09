/**
 * Candidate cookies page — the house style applied to the legal set.
 *
 * NOT the live document. It ships at /demo/legal/cookies so it can be read
 * at a real address; app/(main)/cookies/page.tsx is untouched and remains
 * the legal reference. This route changes the STYLE of that document and
 * nothing else: no clause rewritten, no clause renumbered, no API, no
 * schema, no live route. It is noindex, because a second copy of a policy in
 * the index would compete with the real one.
 *
 * The clauses live in ../documents/cookies, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md:
 * "legal/cookies" is in DEMO_SUBDOMAIN_PAGES, so this renders at
 * demo.zenyaai.co/legal/cookies.
 */

import type { Metadata } from "next"
import LegalShell from "../LegalShell"
import Doc, { SECTIONS } from "../documents/cookies"

export const metadata: Metadata = {
  title: "سياسة ملفات تعريف الارتباط (نسخة تجريبية)",
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <LegalShell slug="cookies" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
