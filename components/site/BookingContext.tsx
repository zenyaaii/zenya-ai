'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Carries the two things a template's booking form needs from the public-site
 * render layer down to whichever section renders the form, without threading
 * props through six template components:
 *
 *   - slug:    which published site this is, so the form knows where to POST.
 *   - enabled: whether the owner is entitled (Pro or in free trial). When
 *              false the templates fall back to their pre-existing CTA so the
 *              site is never broken — the interactive form is Pro-only.
 *
 * There is deliberately NO provider in the editor/preview path. A template
 * rendered there reads the default (`preview: true`, no slug), so the form can
 * show its UI but a submit is a harmless no-op instead of writing a row.
 */

export type BookingCtx = {
  slug: string | null
  enabled: boolean
  /** True in the editor/preview (no live slug) — used to no-op submits. */
  preview: boolean
}

const DEFAULT: BookingCtx = { slug: null, enabled: false, preview: true }

const Ctx = createContext<BookingCtx>(DEFAULT)

export function BookingProvider({
  slug,
  enabled,
  children,
}: {
  slug: string
  enabled: boolean
  children: ReactNode
}) {
  return <Ctx.Provider value={{ slug, enabled, preview: false }}>{children}</Ctx.Provider>
}

export function useBookingContext(): BookingCtx {
  return useContext(Ctx)
}
