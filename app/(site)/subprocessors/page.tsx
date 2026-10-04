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
import { share } from '@/lib/site-share'

// The root template appends "· زينيا", so the title is the page's own name
// alone. It used to carry "— زينيا" too, and read "… — زينيا · زينيا".
const TITLE = 'المعالجون الفرعيون'
const DESCRIPTION = `مزوّدو الخدمات الخارجيون الذين يعالجون البيانات نيابةً عن ${COMPANY.PRODUCT_NAME}.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/subprocessors' },
  ...share({ title: `${TITLE} · زينيا`, description: DESCRIPTION, url: 'https://zenyaai.co/subprocessors' }),
}

export default function Page() {
  return (
    <LegalShell slug="subprocessors" sections={SECTIONS}>
      <Doc />
    </LegalShell>
  )
}
