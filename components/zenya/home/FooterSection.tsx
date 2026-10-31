"use client"

import { useRef } from "react"
import PricingFooter from "../pricing/PricingFooter"
import { useFit } from "./runner"

/* ─────────────────────────────────────────────────────────────────────────
   Section five: the close.

   The deck has no free scrolling, so a footer on this page is either a whole
   screen or it does not exist. This is the whole screen — the fifth panel of
   the same deck, one more gesture down from انشر.

   ── IT IS NOT A FOURTH WORD. ابن، ادر، انشر are the three the hero cycles
   and there is no fourth; this screen is where the page comes to rest rather
   than another step in the argument. So it carries no display word behind it,
   no device, no cursor and no script: it is a surface with the real pages on
   it, and every link on it goes somewhere that exists.

   ── THE GROUND IS OBSIDIAN, the same #131316 ادر stands on, and the reason
   is measured. Evergreen to obsidian is 34 units at its widest channel, which
   is the same step انشر hides in 2.2% of a panel — a ramp short enough to
   finish above the header pill. Coming back to paper is a 231-unit step, and
   a ramp long enough to hide that puts a band of light under the pill unless
   there is a light in the band to explain it. ادر has one. This screen has
   none, and inventing one to buy a paper ground would be adding colour to the
   page for the sake of a transition.

   ── IT IS THE SAME FOOTER EVERY OTHER PAGE ENDS ON. This screen used to
   carry its own copy: a white pill for the call to action, a grey address,
   ringed icons, two columns of lists on a phone. The owner read that as a
   different footer, which it was. It now renders PricingFooter in its bare
   form (no cap of its own, since this panel is already the obsidian ground)
   and scales it to fit the screen, so a change to that footer lands here too.

   ── NOTHING HERE IS INVENTED. Every route was checked against the app tree,
   the address is the one the product already answers on, the company line is
   the one the real footer carries, and the sentence in the brand column is
   the page's single claim rather than a second one written for the footer.
   ───────────────────────────────────────────────────────────────────────── */

/* The marks the footer carries, drawn here. They were redrawn rather
   than imported because components/Footer.tsx was a client module that also
   pulled in the consent dialog, the language switcher and the aurora palette,
   none of which this page had any use for. That file is now deleted — the
   restyle left it importing nothing and imported by nothing — so this is
   where the marks live. */
export function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
    </svg>
  )
}
export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}
export function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  )
}
export function ThreadsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
    </svg>
  )
}

/* Beynoun's accounts. The contact page and the pricing footer use this same
   list, and app/layout.tsx repeats the URLs in sameAs, so change them together. */
export const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@beynounn", Icon: TikTokIcon },
  { label: "Instagram", href: "https://www.instagram.com/beynoun", Icon: InstagramIcon },
  { label: "X", href: "https://x.com/beynounn", Icon: XIcon },
  { label: "Facebook", href: "https://www.facebook.com/beynoun", Icon: FacebookIcon },
  { label: "Threads", href: "https://www.threads.com/@beynoun", Icon: ThreadsIcon },
]

export default function FooterSection({ uiClass }: { uiClass: string }) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const fitRef = useRef<HTMLDivElement | null>(null)

  /* The same fit pass the other three sections use: the footer is laid out
     at its natural size, measured, and scaled by whatever ratio makes it sit
     inside the screen. On a phone that is about 0.58, which is the trade the
     owner chose over letting this one screen scroll. */
  useFit(stageRef, fitRef, [])

  return (
    <div className={`${uiClass} zn-close`} dir="rtl" ref={stageRef}>
      <div className="zn-closebox">
        <div className="zn-fit" ref={fitRef}>
          {/* The measured child. useFit reads the first element inside .zn-fit. */}
          <div>
            <PricingFooter bare />
          </div>
        </div>
      </div>
    </div>
  )
}
