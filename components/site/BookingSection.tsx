'use client'

import BookingForm, { type BookingPalette, type BookingType } from './BookingForm'
import { useBookingContext } from './BookingContext'

/**
 * A drop-in "احجز / تواصل" section for templates that never had a booking
 * concept of their own (studio, atlas, lookbook…).
 *
 * It renders NOTHING when the owner isn't entitled, so adding it to a template
 * is a zero-regression change: free/Starter sites look exactly as before, and
 * the interactive form only appears for Pro / free-trial owners. Placement is
 * up to the template (usually just above the footer).
 */
export default function BookingSection({
  type = 'contact',
  palette,
  heading,
  subheading,
  eyebrow,
  background,
  id = 'booking',
}: {
  type?: BookingType
  palette: BookingPalette
  heading: string
  subheading?: string
  eyebrow?: string
  /** Section background (CSS colour/gradient). Defaults to transparent. */
  background?: string
  id?: string
}) {
  const { enabled } = useBookingContext()
  if (!enabled) return null

  return (
    <section
      id={id}
      data-section="booking"
      dir="rtl"
      className="px-6 py-24 md:py-28"
      style={{ background: background || 'transparent' }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        {eyebrow && (
          <p
            className="mb-3 text-[0.7rem] font-bold uppercase"
            style={{ color: palette.accent, letterSpacing: '0.3em', fontFamily: palette.bodyFont }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          style={{
            fontFamily: palette.headingFont || palette.bodyFont,
            color: palette.text,
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {heading}
        </h2>
        {subheading && (
          <p
            className="mx-auto mt-4 max-w-md"
            style={{ color: palette.muted, fontFamily: palette.bodyFont, fontSize: '1rem', lineHeight: 1.7 }}
          >
            {subheading}
          </p>
        )}
        <div className="mx-auto mt-9 max-w-lg text-start">
          <BookingForm type={type} palette={palette} />
        </div>
      </div>
    </section>
  )
}

export type { BookingPalette }
