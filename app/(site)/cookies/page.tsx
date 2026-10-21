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
import { share } from '@/lib/site-share'

// The root template appends "· بينون", so the title is the page's own name
// alone. It used to carry "— بينون" too, and read "… — بينون · بينون".
const TITLE = 'سياسة ملفات تعريف الارتباط'
const DESCRIPTION = `كيف ولماذا يستخدم ${COMPANY.PRODUCT_NAME} ملفات تعريف الارتباط والتقنيات المشابهة.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/cookies' },
  ...share({ title: `${TITLE} · بينون`, description: DESCRIPTION, url: 'https://beynoun.com/cookies' }),
}

export default function Page() {
  return (
    <LegalShell slug="cookies" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
