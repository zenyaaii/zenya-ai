/**
 * The cookie notice dressed as the theme it sits on (Anas, 2026-11-13: the
 * notice's colours and style belong to the site's own theme).
 *
 * Colours always come from the site's palette (lib/site-palette). A niche with
 * its own full theme also gives the notice its type, corners, edge and mark,
 * so it reads as part of that theme instead of a pill laid over it.
 * A kind not listed here keeps the default glass pill.
 */
export type CookieLook = {
  /** The theme's body face; the theme already loads it on the page. */
  font: string
  /** Corner radius of the notice and of its buttons, in px (999 = pill). */
  radius: number
  buttonRadius: number
  /** A flat, opaque card instead of the frosted pill. */
  flat: boolean
  shadow: string
  /** The small mark beside the sentence. */
  mark: 'cookie' | 'aperture' | 'petal'
}

export const NICHE_COOKIE: Record<string, CookieLook> = {
  // Photo studio (PhotoFull): Noto Sans Arabic, printed-card corners, pill buttons,
  // a hairline frame and a lens aperture, like the theme's viewfinder.
  photo: { font: '"Noto Sans Arabic", system-ui, sans-serif', radius: 8, buttonRadius: 999, flat: true, shadow: '0 12px 32px -16px rgba(0,0,0,.35)', mark: 'aperture' },
  // Beauty & spa (BeautyFull): Readex Pro, the theme's soft rounded cards, pill
  // buttons, a low warm shadow and a small petal, like the calm band's flower.
  beauty: { font: '"Readex Pro", system-ui, sans-serif', radius: 22, buttonRadius: 999, flat: true, shadow: '0 14px 36px -18px rgba(40,30,20,.35)', mark: 'petal' },
}

export const cookieLookOf = (niche?: string): CookieLook | undefined => (niche ? NICHE_COOKIE[niche] : undefined)
