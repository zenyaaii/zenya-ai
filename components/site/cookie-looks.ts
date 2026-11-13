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
  mark: 'cookie' | 'aperture'
}

// Anas picked option ج for every template (2026-11-13): the usual capsule in the
// site's own colours. Each theme only carries its font over; the shape is the same.
const PILL = { radius: 999, buttonRadius: 999, flat: false, shadow: '0 18px 50px -12px rgba(0,0,0,.45)', mark: 'cookie' } as const

export const NICHE_COOKIE: Record<string, CookieLook> = {
  barber: { ...PILL, font: '"IBM Plex Sans Arabic", system-ui, sans-serif' },
  gym: { ...PILL, font: '"Readex Pro", system-ui, sans-serif' }, // GymFull body face
  car: { ...PILL, font: '"Rubik", system-ui, sans-serif' }, // CarFull body face
  photo: { ...PILL, font: '"Noto Sans Arabic", system-ui, sans-serif' }, // PhotoFull body face
}

export const cookieLookOf = (niche?: string): CookieLook | undefined => (niche ? NICHE_COOKIE[niche] : undefined)
