/**
 * The dashboard's quick switches for one site (the Sites page's «التحكم
 * السريع» and the Bookings page's «استقبال الحجوزات»), stored on the theme's
 * content as content.site_switches. Top level, beside review_bank, so it is
 * the same place whatever the template keeps its own content under.
 *
 * What reads each one:
 *   bookings_off → lib/public-site (BookingProvider) and the public booking
 *                  route: the site falls back to its plain call button
 *   wa_float     → lib/public-site's floating WhatsApp button, and the
 *                  services template's own; it needs a WhatsApp number
 *   reviews_off  → lib/public-site, which leaves the reviews section out
 */

export type SiteSwitches = { bookings_off?: boolean; wa_float?: boolean; reviews_off?: boolean }

export function switchesOf(content: any): SiteSwitches {
  const s = content?.site_switches
  return s && typeof s === 'object' && !Array.isArray(s) ? s : {}
}

export function withSwitch(content: any, key: keyof SiteSwitches, on: boolean): any {
  return { ...(content || {}), site_switches: { ...switchesOf(content), [key]: on } }
}

export const bookingsPaused = (content: any) => switchesOf(content).bookings_off === true
export const reviewsHidden = (content: any) => switchesOf(content).reviews_off === true

/** The template's own content, where the owner's WhatsApp number lives. */
function inner(bt: string, content: any): any {
  const c = content?.[bt]
  return c && typeof c === 'object' && !Array.isArray(c) ? c : content || {}
}

/** The owner's WhatsApp number (or wa.me link), for the templates that have a field for it. */
export function waNumber(bt: string, content: any): string | null {
  const c = inner(bt, content)
  // The services template falls back to the footer's phone for its own button.
  const v = bt === 'restaurant' ? c?.social_links?.whatsapp
    : bt === 'services' ? c?.links?.whatsapp || c?.footer?.phone
      : bt === 'wellness' ? c?.links?.whatsapp
        : null
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/** Templates with a WhatsApp field, so the switch has a number to use. */
export const hasWaField = (bt: string) => bt === 'restaurant' || bt === 'services' || bt === 'wellness'

/**
 * Whether the floating button shows. The services template has always drawn
 * one, so it stays on there until turned off; elsewhere it is off until
 * turned on. Without a number there is nothing to open.
 */
export function waFloatOn(bt: string, content: any): boolean {
  if (!waNumber(bt, content)) return false
  const v = switchesOf(content).wa_float
  return bt === 'services' ? v !== false : v === true
}

/** A wa.me link from a full link or a bare number. */
export function waHref(v: string): string | null {
  if (/^https?:\/\//i.test(v)) return v
  const digits = v.replace(/[^\d]/g, '')
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}
