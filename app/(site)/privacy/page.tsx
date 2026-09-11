/**
 * The privacy page — the house style applied to the legal set.
 *
 * The clauses live in ../documents/privacy, moved from the live page with
 * the visible copy unchanged (verified character for character). The shell
 * and the stylesheet next to it are the whole restyle.
 *
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
