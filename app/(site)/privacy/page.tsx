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
import { share } from '@/lib/site-share'

// The root template appends "· بينون", so the title is the page's own name
// alone. It used to carry "— بينون" too, and read "… — بينون · بينون".
const TITLE = 'سياسة الخصوصية'
const DESCRIPTION = `كيف يجمع ${COMPANY.PRODUCT_NAME} بياناتك الشخصية ويستخدمها ويحميها. متوافق مع اللائحة العامة لحماية البيانات (GDPR).`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  ...share({ title: `${TITLE} · بينون`, description: DESCRIPTION, url: 'https://beynoun.com/privacy' }),
}

export default function Page() {
  return (
    <LegalShell slug="privacy" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
