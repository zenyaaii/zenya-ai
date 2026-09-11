/**
 * The refund page — the house style applied to the legal set.
 *
 * The clauses live in ../documents/refund, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
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
