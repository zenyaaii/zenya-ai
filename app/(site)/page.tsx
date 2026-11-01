/**
 * The homepage, in the «ليل» style chosen on 2026-11-01 with hero B: the
 * three words centred over the light, the big faint wordmark behind them.
 *
 * The view is components/zenya/redesign/s11.tsx (HomeB). It draws its own
 * header and footer, so app/(site)/layout.tsx still renders nothing around
 * it. The page's metadata and JSON-LD are in app/layout.tsx, untouched.
 *
 * The previous home (the one-screen "three words on paper" page with the font
 * and light pickers) is in git history before this change.
 */

import { dashFont } from '@/components/app/dash-font'
import { HomeB } from '@/components/zenya/redesign/s11'

export default function HomePage() {
  return <div className={dashFont.variable}><HomeB /></div>
}
