import { cn } from '@/lib/utils'
import ZenyaMark from '@/components/ZenyaMark'

/**
 * BrandLogo — the official زينيا wordmark for the footer signature.
 *
 * Now renders the wordmark as inline SVG code (see {@link ZenyaMark}) instead of
 * a PNG/image, so it's vector-sharp at the giant footer size and needs no asset
 * request. `className` sizes the box; `markClassName` colors/styles the mark.
 */
export default function BrandLogo({
  className,
  markClassName,
}: {
  className?: string
  markClassName?: string
}) {
  return (
    <div className={cn('select-none', className)} aria-label="زينيا">
      <ZenyaMark className={cn('w-full text-[#16171b]', markClassName)} />
    </div>
  )
}
