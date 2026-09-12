/**
 * The "Made with Zenya" badge on free-tier hosted sites.
 *
 * WHAT IT IS. Every site Zenya generates for a customer on the free tier
 * carries this in the corner, linking back to zenyaai.co with ?ref=badge.
 * Paid hosting removes it: lib/public-site.tsx passes hide={theme.owner_has_hosting},
 * and "the Made with Zenya badge removed" is a line item on the pricing page,
 * so the prop is a paid promise and not a preference.
 *
 * IT IS THE ONE PIECE OF ZENYA'S OWN CHROME THAT RENDERS ON SOMEBODY ELSE'S
 * SITE, which is why every value here is inline and absolute rather than a
 * token. The host page is a customer theme with its own palette, its own
 * fonts and its own stylesheet, and none of the house custom properties are
 * defined there. A var() would resolve to nothing and the badge would paint
 * as unstyled text over a stranger's design.
 *
 * WHAT CHANGED IN THE RESTYLE, within that constraint:
 *   · The text was #f7f4ed, the retired marketing cream. It is #fafafa now,
 *     the house paper, which is also what every other white-on-dark surface
 *     uses.
 *   · The dot was a violet-to-gold gradient. #c8a96a was one of the eight
 *     ambers the dashboard restyle reduced to a single documented triad, and
 *     a two-stop gradient on an 8px disc reads as a muddy smear at any real
 *     size. It is the accent, flat.
 *   · The 14px drop shadow and the inset white highlight become one hairline
 *     ring, which is how elevation works in this house style.
 *   · backdrop-filter comes off. It put the badge on its own compositor
 *     layer, and text on a composited layer loses subpixel antialiasing —
 *     the same reason the cookie banner refuses one. The ground was already
 *     92% opaque, so it was blurring almost nothing to pay for that.
 *
 * THE GROUND STAYS OPAQUE AND DARK ON PURPOSE. It has to be legible over a
 * photograph, a white page and a black page alike, and it cannot know which
 * it is standing on.
 */
export default function MadeWithZenya({ hide = false }: { hide?: boolean }) {
  if (hide) return null
  return (
    <a
      href="https://zenyaai.co?ref=badge"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Made with Zenya"
      style={{
        position: 'fixed',
        bottom: 16,
        /* Physical, not logical. The badge sits on customer sites that may be
           RTL or LTR, and the wordmark reads left-to-right either way; the
           bottom-right corner is where a reader looks for it on both. */
        right: 16,
        zIndex: 2147483000,
        background: '#131316',
        color: '#fafafa',
        padding: '8px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: 0.1,
        textDecoration: 'none',
        boxShadow: '0 0 0 1px rgba(250,250,250,0.10)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#5e6ad2',
        }}
      />
      Made with <strong style={{ fontWeight: 600 }}>Zenya</strong>
    </a>
  )
}
