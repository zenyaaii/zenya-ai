'use client'

/**
 * The portal's header, on accounts.zenyaai.co.
 *
 * IT IS THE HOUSE PILL NOW, not a second one. This file used to draw its own
 * bar — mark, three nav links, separator, account — in one row at every
 * width, and the comment justifying that said a hamburger opening three
 * items is chrome earning nothing. On a phone it was not one row: at 375 the
 * three Arabic words wrapped onto two lines each, the call to action wrapped
 * with them, and the pill stood 56px tall carrying six lines of broken type.
 * Every other surface on the site — the eight marketing pages, the wizards,
 * the builder — collapses to the phone pill under 768, so the portal was the
 * one screen in the product where the header came apart, and it is the screen
 * every customer passes through to sign in.
 *
 * WHAT IT KEEPS FROM THE OLD FILE, and why the portal still needs a component
 * of its own rather than rendering components/zenya/chrome/Shell:
 *
 *   · THE LINKS ARE ABSOLUTE. Middleware rewrites every unrouted path on this
 *     host under /accounts, so a relative /pricing resolves to
 *     /accounts/pricing and 404s. siteUrl() spells the apex out, and stays
 *     relative on localhost and preview deployments where one app serves
 *     everything. They are plain anchors for the same reason: a cross-origin
 *     href is a document navigation, not a route change.
 *
 *   · THE ACCOUNT MARK. Signed in, the pill ends in a disc carrying the first
 *     letter of the account — its name if it has one, otherwise its address —
 *     and that disc goes to the dashboard. Signed out it is the "ابدأ"
 *     control, which is what the house header draws by default. The letter is
 *     taken with Intl.Segmenter where the browser has it, because the first
 *     UTF-16 code unit of an Arabic name is a whole letter but the first code
 *     unit of an emoji or a flag is half a surrogate pair, and slicing there
 *     renders a replacement glyph.
 *
 * THE INVERSION MECHANIC IS MOUNTED AND INERT. useOnDark wants the element to
 * search for dark grounds in; the portal is one flat #fafafa page with no
 * ".zf" cap anywhere on it, so the ref is deliberately left unattached and
 * the hook returns false forever. That is cheaper than a second Header that
 * does not take the flag, and it is one line to wire up if the portal ever
 * grows a footer.
 */

import { useEffect, useRef, useState } from 'react'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { createClient } from '@/utils/supabase/client'
import Header, { useOnDark, type NavItem } from '@/components/zenya/chrome/Header'
import { dashboardUrl, siteUrl } from '@/lib/portal-urls'

const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500'], display: 'swap' })

const NAV = [
  { path: '/templates', label: 'القوالب' },
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

  /* Never attached — see the note at the top. */
  const groundRef = useRef<HTMLElement | null>(null)
  const { headRef, onDark } = useOnDark(groundRef)

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

  const nav: NavItem[] = NAV.map((i) => ({ href: siteUrl(i.path), label: i.label }))

  return (
    <Header
      headRef={headRef}
      onDark={onDark}
      uiClass={plex.className}
      nav={nav}
      homeHref={siteUrl()}
      plain
      /* Both states are spelled out rather than letting the default CTA
         through: the house default is a relative /login?mode=signup, and on
         this host that is the portal's own door rather than the site's. */
      account={
        label ? (
          <a
            href={dashboardUrl()}
            className="zn-head-disc"
            title={title}
            aria-label={`الذهاب إلى لوحة التحكم — ${title}`}
          >
            {label}
          </a>
        ) : (
          <a href={siteUrl('/login?mode=signup')} className="zx-account">ابدأ</a>
        )
      }
    />
  )
}
