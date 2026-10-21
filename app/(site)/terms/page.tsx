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
import { share } from '@/lib/site-share'

// The root template appends "· بينون", so the title is the page's own name
// alone. It used to carry "— بينون" too, and read "… — بينون · بينون".
const TITLE = 'شروط الخدمة'
const DESCRIPTION = `الشروط التي تحكم استخدامك لـ ${COMPANY.PRODUCT_NAME}.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  ...share({ title: `${TITLE} · بينون`, description: DESCRIPTION, url: 'https://beynoun.com/terms' }),
}

export default function Page() {
  return (
    <LegalShell slug="terms" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
