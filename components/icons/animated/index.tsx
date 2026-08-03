/**
 * Animated icons — one data-driven component.
 * ---------------------------------------------------------------------------
 * Each entry in ANIMATED_SVG is the inner SVG markup for an icon, with `zi-*`
 * classes on the parts that move. The motion itself lives in app/globals.css
 * and fires on hover of the icon (.zi:hover) OR of an ancestor `.group` — so
 * an icon animates when its whole card/row is hovered, matching the design.
 *
 * Pure markup + CSS: no per-icon JS, SSR-safe, and covers ~200 icons. Names
 * mirror the canonical keys in ../registry, so `<Icon name="notify" />` works.
 */
import { ANIMATED_SVG } from './data.generated'

export interface AnimatedIconProps {
  name: string
  size?: number | string
  strokeWidth?: number
  className?: string
  color?: string
  title?: string
}

/** Canonical names that have a hand-tuned animated version. */
export const ANIMATED_KEYS = new Set(Object.keys(ANIMATED_SVG))

export function AnimatedIcon({
  name,
  size = 24,
  strokeWidth = 2,
  className,
  color,
  title,
}: AnimatedIconProps) {
  const inner = ANIMATED_SVG[name]
  if (!inner) return null
  return (
    <span
      className={className ? `zi ${className}` : 'zi'}
      style={{ color }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    </span>
  )
}

export default AnimatedIcon
