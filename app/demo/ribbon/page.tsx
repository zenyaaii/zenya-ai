'use client'

/**
 * /demo/ribbon - the flowing ribbon, on its own, for approval.
 *
 * Nothing else is on this page. It exists so the ribbon can be compared
 * against the Spline reference before it is placed anywhere. The homepage is
 * untouched.
 */

import FlowingRibbon from '@/components/marketing/FlowingRibbon'

export default function RibbonDemo() {
  return (
    <main
      dir="rtl"
      className="relative min-h-[100dvh] overflow-hidden bg-[#f7f4ed]"
    >
      <div className="absolute inset-0 flex items-center">
        <FlowingRibbon className="h-[70vh] w-full" />
      </div>
    </main>
  )
}
