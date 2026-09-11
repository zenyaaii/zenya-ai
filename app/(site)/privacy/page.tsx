/**
 * Candidate privacy page — the house style applied to the legal set.
 *
 * NOT the live document. It ships at /demo/legal/privacy so it can be read
 * at a real address; app/(main)/privacy/page.tsx is untouched and remains
 * the legal reference. This route changes the STYLE of that document and
 * nothing else: no clause rewritten, no clause renumbered, no API, no
 * schema, no live route. It is noindex, because a second copy of a policy in
 * the index would compete with the real one.
 *
 * The clauses live in ../documents/privacy, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md:
 * "legal/privacy" is in DEMO_SUBDOMAIN_PAGES, so this renders at
 * demo.zenyaai.co/legal/privacy.
 */

import type { Metadata } from "next"
import LegalShell from "@/components/zenya/legal/LegalShell"
import Doc, { SECTIONS } from "@/components/zenya/legal/documents/privacy"

import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `سياسة الخصوصية — ${COMPANY.BRAND_NAME}`,
  description: `كيف يجمع ${COMPANY.PRODUCT_NAME} بياناتك الشخصية ويستخدمها ويحميها. متوافق مع اللائحة العامة لحماية البيانات (GDPR).`,
  alternates: { canonical: '/privacy' },
}

export default function Page() {
  return (
    <LegalShell slug="privacy" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
