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
import { share } from '@/lib/site-share'

// The root template appends "· زينيا", so the title is the page's own name
// alone. It used to carry "— زينيا" too, and read "… — زينيا · زينيا".
const TITLE = 'سياسة الاسترداد'
const DESCRIPTION = `متى وكيف يمكنك إلغاء اشتراكك في ${COMPANY.PRODUCT_NAME} أو طلب استرداد المبلغ.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/refund' },
  ...share({ title: `${TITLE} · زينيا`, description: DESCRIPTION, url: 'https://zenyaai.co/refund' }),
}

export default function Page() {
  return (
    <LegalShell slug="refund" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
