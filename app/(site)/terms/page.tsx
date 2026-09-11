/**
 * The terms page — the house style applied to the legal set.
 *
 * The clauses live in ../documents/terms, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
 */

import type { Metadata } from "next"
import LegalShell from "@/components/zenya/legal/LegalShell"
import Doc, { SECTIONS } from "@/components/zenya/legal/documents/terms"

import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `شروط الخدمة — ${COMPANY.BRAND_NAME}`,
  description: `الشروط التي تحكم استخدامك لـ ${COMPANY.PRODUCT_NAME}.`,
  alternates: { canonical: '/terms' },
}

export default function Page() {
  return (
    <LegalShell slug="terms" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
