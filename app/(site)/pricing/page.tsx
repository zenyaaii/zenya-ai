/**
 * The pricing page, in the «ليل» style (2026-11-01).
 *
 * The view is Pricing in components/zenya/redesign/s11.tsx: the three plans
 * (Free, Starter $14.99, Pro $24.99) with the same names, prices and links the
 * rest of the codebase charges, the live page's discounts and its «لماذا
 * بينون» comparison word for word, then the questions. Metadata and the
 * JSON-LD stay in ./layout.tsx.
 *
 * The previous view, components/zenya/pricing/PricingView.tsx, is kept.
 */

import { dashFont } from '@/components/app/dash-font'
import { Pricing } from '@/components/zenya/redesign/s11'

export default function PricingPage() {
  return <div className={dashFont.variable}><Pricing /></div>
}
