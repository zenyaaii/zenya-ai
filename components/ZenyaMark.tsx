import { cn } from '@/lib/utils'

/**
 * ZenyaMark — the official زينيا wordmark, rendered as inline SVG code (vector,
 * not an image file). The square-Kufi lettering was vectorized from the brand
 * artwork into 27 rectangles, so it stays razor-sharp at any size and needs no
 * network request. Fills with `currentColor`, so set its color via text color
 * (e.g. `text-[#16171b]` or `text-white`).
 *
 * `className` sizes/colors it — set a height (`h-5`) and the width follows the
 * ~4.76:1 aspect ratio.
 */
export default function ZenyaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 486 102"
      role="img"
      aria-label="زينيا"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      className={cn('block w-auto', className)}
    >
      <rect x="86" y="1" width="101" height="16" />
      <rect x="235" y="1" width="16" height="16" />
      <rect x="299" y="1" width="101" height="16" />
      <rect x="469" y="1" width="16" height="16" />
      <rect x="86" y="17" width="16" height="26" />
      <rect x="171" y="17" width="16" height="26" />
      <rect x="299" y="17" width="16" height="26" />
      <rect x="43" y="43" width="59" height="16" />
      <rect x="129" y="43" width="16" height="16" />
      <rect x="171" y="43" width="59" height="16" />
      <rect x="256" y="43" width="59" height="16" />
      <rect x="341" y="43" width="16" height="16" />
      <rect x="1" y="1" width="16" height="85" />
      <rect x="43" y="59" width="17" height="27" />
      <rect x="214" y="59" width="16" height="27" />
      <rect x="256" y="59" width="16" height="27" />
      <rect x="469" y="43" width="16" height="43" />
      <rect x="1" y="86" width="59" height="16" />
      <rect x="129" y="86" width="16" height="16" />
      <rect x="214" y="86" width="58" height="16" />
      <rect x="341" y="86" width="17" height="16" />
      <rect x="384" y="17" width="16" height="85" />
      <rect x="426" y="86" width="59" height="16" />
    </svg>
  )
}
