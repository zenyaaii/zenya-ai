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

// The root template appends "· زينيا", so the title is the page's own name
// alone. It used to carry "— زينيا" too, and read "… — زينيا · زينيا".
const TITLE = 'شروط الخدمة'
const DESCRIPTION = `الشروط التي تحكم استخدامك لـ ${COMPANY.PRODUCT_NAME}.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  ...share({ title: `${TITLE} · زينيا`, description: DESCRIPTION, url: 'https://zenyaai.co/terms' }),
}

export default function Page() {
  return (
    <LegalShell slug="terms" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
