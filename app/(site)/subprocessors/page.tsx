/**
 * The subprocessors page — the house style applied to the legal set.
 *
 * The clauses live in ../documents/subprocessors, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
 */

import type { Metadata } from "next"
import LegalShell from "@/components/zenya/legal/LegalShell"
import Doc, { SECTIONS } from "@/components/zenya/legal/documents/subprocessors"

import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: `المعالجون الفرعيون — ${COMPANY.BRAND_NAME}`,
  description: `مزوّدو الخدمات الخارجيون الذين يعالجون البيانات نيابةً عن ${COMPANY.PRODUCT_NAME}.`,
  alternates: { canonical: '/subprocessors' },
}

export default function Page() {
  return (
    <LegalShell slug="subprocessors" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
