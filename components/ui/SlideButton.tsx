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
 */

import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Variant = "key" | "violet" | "onyx"

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
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </>
  )
}

const CSS = `
.sb {
  --sb-win: 2.75em;
  --sb-ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  display: block;
  width: 100%;
  border: 0;
  padding: 0.375rem 1rem;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: transform 120ms var(--sb-ease), box-shadow 120ms var(--sb-ease);
}
.sb:focus-visible { outline: 2px solid #5e6ad2; outline-offset: 3px; }

/* The accessible name. Present for assistive technology and for a browser
   with no CSS, hidden from sighted readers who get the animated copy. */
.sb-a11y {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}

/* A fixed multiple of the em. The clip has to land in the leading, because
   Arabic tails sit well below the baseline. */
.sb-win {
  display: block;
  height: var(--sb-win);
  overflow: hidden;
}
.sb-track {
  display: block;
  transition: transform 420ms var(--sb-ease);
}
.sb:hover .sb-track,
.sb:focus-visible .sb-track { transform: translateY(calc(var(--sb-win) * -1)); }

/* Each face owns a whole window and centres its own label in it, so a word
   with descenders and a word without sit on the same optical line. */
.sb-face {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--sb-win);
  line-height: 1.35;
  opacity: 1;
  transition: opacity 300ms var(--sb-ease);
}
.sb-face:last-child { opacity: 0; }
.sb:hover .sb-face:first-child,
.sb:focus-visible .sb-face:first-child { opacity: 0; }
.sb:hover .sb-face:last-child,
.sb:focus-visible .sb-face:last-child { opacity: 1; }

/* ---- variants. The key recipe, per docs/zenya-hero-style.md ------------- */

.sb[data-variant="key"] {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(246, 245, 242, 0.96) 100%);
  color: #171717;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -3px 0 rgba(17, 17, 17, 0.10),
    0 0 0 1px rgba(17, 17, 17, 0.26),
    0 3px 0 rgba(17, 17, 17, 0.12),
    0 8px 16px rgba(17, 17, 17, 0.11);
}
.sb[data-variant="violet"] {
  background: linear-gradient(180deg, #6b76d8 0%, #5460c9 100%);
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -3px 0 rgba(26, 30, 72, 0.34),
    0 0 0 1px rgba(52, 60, 150, 0.55),
    0 3px 0 rgba(52, 60, 150, 0.30),
    0 8px 16px rgba(94, 106, 210, 0.26);
}
.sb[data-variant="onyx"] {
  background: linear-gradient(180deg, #2a2a31 0%, #191920 100%);
  color: #fafafa;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -3px 0 rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(0, 0, 0, 0.55),
    0 3px 0 rgba(0, 0, 0, 0.30),
    0 8px 16px rgba(0, 0, 0, 0.28);
}

/* Pressed, a key loses its base and drops by exactly the base it lost. */
.sb:active { transform: translateY(3px); }
.sb[data-variant="key"]:active {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -1px 0 rgba(17, 17, 17, 0.10),
    0 0 0 1px rgba(17, 17, 17, 0.26),
    0 2px 6px rgba(17, 17, 17, 0.10);
}
.sb[data-variant="violet"]:active {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(26, 30, 72, 0.34),
    0 0 0 1px rgba(52, 60, 150, 0.55),
    0 2px 6px rgba(94, 106, 210, 0.22);
}
.sb[data-variant="onyx"]:active {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(0, 0, 0, 0.55),
    0 2px 6px rgba(0, 0, 0, 0.22);
}

@media (prefers-reduced-motion: reduce) {
  .sb, .sb-track, .sb-face { transition: none; }
  .sb:hover .sb-track, .sb:focus-visible .sb-track { transform: none; }
  .sb:hover .sb-face:first-child,
  .sb:focus-visible .sb-face:first-child { opacity: 1; }
  .sb:hover .sb-face:last-child,
  .sb:focus-visible .sb-face:last-child { opacity: 0; }
  .sb:active { transform: none; }
}
`
