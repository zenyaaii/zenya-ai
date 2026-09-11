'use client'

/**
 * The portal's header, on accounts.zenyaai.co.
 *
 * WHY THE PORTAL DRAWS ITS OWN RATHER THAN RENDERING components/zenya/chrome.
 * The house Header pill links /themes, /pricing and /contact as relative
 * paths, which is right everywhere except here: middleware rewrites every
 * unrouted path on this host under /accounts, so those three resolve to
 * /accounts/themes and 404. This header spells the apex out through
 * siteUrl(), which stays relative on localhost and preview deployments where
 * there are no subdomains and the same app serves everything.
 *
 * THE ACCOUNT MARK. Signed in, the pill ends in a disc carrying the first
 * letter of the account — its name if it has one, otherwise its address — and
 * that disc goes to the dashboard. Signed out it is the "ابدأ" control, the
 * same object the public header ends in. The letter is taken with
 * Intl.Segmenter where the browser has it, because the first UTF-16 code unit
 * of an Arabic name is a whole letter but the first code unit of an emoji or
 * a flag is half a surrogate pair, and slicing there renders a replacement
 * glyph.
 *
 * IT IS ONE ROW AT EVERY WIDTH. There is no drawer: the portal has three
 * links and an account, which fits a phone without a menu, and a hamburger
 * that opens three items is chrome earning nothing.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import ZenyaMark from '@/components/ZenyaMark'
import { dashboardUrl, siteUrl } from '@/lib/portal-urls'

const NAV = [
  { path: '/themes', label: 'القوالب' },
  { path: '/pricing', label: 'الأسعار' },
  { path: '/contact', label: 'تواصل' },
]

/** First LETTER, not first code unit. */
function firstLetter(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) return '؟'
  try {
    /* Typed by hand: the project's tsconfig lib predates Intl.Segmenter, and
       it is absent at runtime on older Safari, so it is reached for
       defensively rather than declared as always present. */
    const Seg = (Intl as unknown as {
      Segmenter?: new (
        l?: string,
        o?: { granularity?: string },
      ) => { segment(s: string): Iterable<{ segment: string }> }
    }).Segmenter
    if (Seg) {
      const first = new Seg(undefined, { granularity: 'grapheme' })
        .segment(trimmed)[Symbol.iterator]()
        .next()
      if (!first.done) return first.value.segment.toUpperCase()
    }
  } catch {
    /* Intl.Segmenter is missing on older Safari; the slice below is the
       fallback and is correct for the Arabic and Latin names that are
       almost all of them. */
  }
  return trimmed.charAt(0).toUpperCase()
}

export default function AccountsHeader() {
  const [label, setLabel] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  useEffect(() => {
    let alive = true
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!alive || !user) return
        const name = (user.user_metadata?.full_name as string | undefined) || ''
        const email = user.email || ''
        setLabel(firstLetter(name || email))
        setTitle(name || email)
      })
      .catch(() => {
        /* Signed out is the common case and not an error. */
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <header className="zn-head">
      <div className="zn-pill">
        <a href={siteUrl()} className="zn-head-mark" aria-label="زينيا">
          <ZenyaMark className="zn-head-svg" />
        </a>

        <nav className="zn-nav">
          {NAV.map((i) => (
            <a key={i.path} href={siteUrl(i.path)} className="zn-nav-item">
              {i.label}
            </a>
          ))}
        </nav>

        <span className="zn-head-end">
          <span className="zn-sep" aria-hidden />
          {label ? (
            <a
              href={dashboardUrl()}
              className="zn-head-disc"
              title={title}
              aria-label={`الذهاب إلى لوحة التحكم — ${title}`}
            >
              {label}
            </a>
          ) : (
            <a href={siteUrl('/login?mode=signup')} className="zn-head-cta">
              ابدأ
            </a>
          )}
        </span>
      </div>
    </header>
  )
}
