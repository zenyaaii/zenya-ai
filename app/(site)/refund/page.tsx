/**
 * Candidate refund page — the house style applied to the legal set.
 *
 * NOT the live document. It ships at /demo/legal/refund so it can be read
 * at a real address; app/(main)/refund/page.tsx is untouched and remains
 * the legal reference. This route changes the STYLE of that document and
 * nothing else: no clause rewritten, no clause renumbered, no API, no
 * schema, no live route. It is noindex, because a second copy of a policy in
 * the index would compete with the real one.
 *
 * The clauses live in ../documents/refund, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md:
 * "legal/refund" is in DEMO_SUBDOMAIN_PAGES, so this renders at
 * demo.zenyaai.co/legal/refund.
 */

import type { Metadata } from "next"
import LegalShell from "@/components/zenya/legal/LegalShell"
import Doc, { SECTIONS } from "@/components/zenya/legal/documents/refund"

import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `سياسة الاسترداد — ${COMPANY.BRAND_NAME}`,
  description: `متى وكيف يمكنك إلغاء اشتراكك في ${COMPANY.PRODUCT_NAME} أو طلب استرداد المبلغ.`,
  alternates: { canonical: '/refund' },
}

export default function Page() {
  return (
    <LegalShell slug="refund" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
