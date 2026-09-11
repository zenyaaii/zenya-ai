/**
 * The cookies page — the house style applied to the legal set.
 *
 * The clauses live in ../documents/cookies, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
 */

import type { Metadata } from "next"
import LegalShell from "@/components/zenya/legal/LegalShell"
import Doc, { SECTIONS } from "@/components/zenya/legal/documents/cookies"

import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `سياسة ملفات تعريف الارتباط — ${COMPANY.BRAND_NAME}`,
  description: `كيف ولماذا يستخدم ${COMPANY.PRODUCT_NAME} ملفات تعريف الارتباط والتقنيات المشابهة.`,
  alternates: { canonical: '/cookies' },
}

export default function Page() {
  return (
    <LegalShell slug="cookies" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
