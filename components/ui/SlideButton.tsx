"use client"

/**
 * SlideButton — the label leaves upward and its replacement arrives from
 * below, on hover and on focus.
 *
 * Adapted from Kokonut UI's SlideTextButton (MIT, kokonutui.com). The idea is
 * theirs; almost none of the code survives, because the original does five
 * things this repo cannot do. Each is fixed here, and each is why the pasted
 * snippet was parked rather than shipped:
 *
 *  1. IT NEEDS NO ANIMATION LIBRARY. The original imports "motion/react",
 *     which is not installed here (only framer-motion@11), for what is a
 *     transform and an opacity. Both are CSS. Nothing is imported.
 *
 *  2. NO MOUNT ANIMATION. The original enters from x:200 at opacity:0. On an
 *     RTL page that is the wrong side; on a page of CTAs it is motion nobody
 *     asked for; and resting from opacity:0 leaves an invisible button
 *     wherever the script does not run. The house rule is that a resting
 *     state is the finished state, so this button simply is where it lands.
 *
 *  3. ARABIC DESCENDERS DECIDE THE GEOMETRY. Clipping at the element's own
 *     height shaves the tails of ج ح خ ع غ م ه ي. So the window is a fixed
 *     multiple of the em (--sb-win) with each label centred inside its own
 *     copy of that box: the clip lands in the leading, never on a glyph, and
 *     the travel is exactly one window rather than "100%" of a box whose
 *     height the text can change.
 *
 *  4. NO NEGATIVE TRACKING. The original carries tracking-tighter, which
 *     breaks the joins between Arabic letterforms. Also text-md, which is not
 *     a Tailwind class and silently does nothing.
 *
 *  5. IT RENDERS AS EITHER. The original is Link-only; half of this app's
 *     CTAs are <button onClick>. Both are supported from one implementation,
 *     so the two never drift apart.
 *
 * Under prefers-reduced-motion the slide does not run and the resting label
 * stays put, which is the whole point of the resting state being the finished
 * one. Colour comes from the variant, never from a hardcoded black or white.
 *
 * THE STYLES LIVE IN app/globals.css, not in a <style> here. This component
 * renders once per CTA, so an inline style element is one identical copy of
 * the whole block per button: three on the pricing page, about fifty across
 * the marketing site. Measured before the move: three copies in the DOM on
 * /demo/pricing alone.
 *
 * THE SLIDE RUNS ON PRESS AND ON FOCUS, not only on hover. A touch screen has
 * no hover, so a hover-only rule means the animation does not exist at all on
 * a phone. Hover itself is scoped to (hover: hover), because unscoped it
 * sticks after a tap and leaves the label on its second face for ever.
 */

import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Variant = "key" | "violet" | "onyx" | "quiet"

type CommonProps = {
  /** The resting label. */
  children: ReactNode
  /** The label that arrives on hover. Defaults to the resting one, which
   *  makes the movement a flourish rather than a second message. */
  slide?: ReactNode
  variant?: Variant
  className?: string
}

type LinkProps = CommonProps & { href: string; onClick?: never; type?: never }
type ButtonProps = CommonProps & {
  href?: never
  onClick?: () => void
  type?: "button" | "submit"
}

export default function SlideButton(props: LinkProps | ButtonProps) {
  const { children, slide, variant = "key", className } = props
  const inner = (
    <span className="sb-win" aria-hidden="true">
      <span className="sb-track">
        <span className="sb-face">{children}</span>
        <span className="sb-face">{slide ?? children}</span>
      </span>
    </span>
  )

  /* The visible copy is aria-hidden and duplicated, so the accessible name
     comes from one plain label that is never cloned or clipped. */
  const label = <span className="sb-a11y">{children}</span>
  const cls = cn("sb", className)

  return (
    <>
      {"href" in props && props.href !== undefined ? (
        <Link href={props.href} className={cls} data-variant={variant}>
          {label}
          {inner}
        </Link>
      ) : (
        <button
          type={props.type ?? "button"}
          onClick={props.onClick}
          className={cls}
          data-variant={variant}
        >
          {label}
          {inner}
        </button>
      )}
    </>
  )
}
