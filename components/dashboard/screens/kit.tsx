'use client'

/**
 * The dashboard screens' shared furniture.
 *
 * THE DEMO IS THE PRODUCT. The nine screens in this folder were designed as
 * /demo/dashboard and are now the real dashboard: app/(app)/dashboard/** feeds
 * them live data and real actions, and /demo/dashboard feeds the very same
 * components its sample data. There is one drawing of each screen, so the two
 * cannot look different.
 *
 * AN ACTION IS DATA. A screen never knows whether a button navigates, runs a
 * handler, or - on the demo - does nothing at all. It receives an `Action`,
 * and <Act> renders the matching element: a Link, an external anchor, a
 * button, or an inert span.
 */

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type Tone = 'accent' | 'ok' | 'quiet' | 'bad' | 'warn'

export type Action = {
  href?: string
  onClick?: () => void
  /** Opens in a new tab (a live site, an invoice PDF). */
  external?: boolean
  /** A full page load in this tab: a route handler that redirects (OAuth). */
  document?: boolean
  disabled?: boolean
}

export function Act({
  action, className, children, title, style, tour,
}: {
  action?: Action
  className: string
  children: ReactNode
  title?: string
  style?: CSSProperties
  /** A stop of the dashboard tour (intro/DashIntro) points here. */
  tour?: string
}) {
  // With an href, onClick is a side effect of following the link (a tick on
  // the home's first steps), not a replacement for it.
  const own = { className, title, style, 'data-tour': tour }
  if (action?.href) {
    if (action.document) {
      return <a href={action.href} onClick={action.onClick} {...own}>{children}</a>
    }
    return action.external ? (
      <a href={action.href} target="_blank" rel="noreferrer" onClick={action.onClick} {...own}>
        {children}
      </a>
    ) : (
      <Link href={action.href} onClick={action.onClick} {...own}>
        {children}
      </Link>
    )
  }
  if (action?.onClick) {
    return (
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        {...own}
        className={className + ' disabled:opacity-60'}
      >
        {children}
      </button>
    )
  }
  return <span role="presentation" {...own}>{children}</span>
}

/**
 * The page frame. px-4 on a phone rather than px-6: at 390px, twelve extra
 * pixels of gutter is a word of Arabic on every line of every card.
 */
export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
}

export function PageHead({
  title, sub, icon: Icon, aside,
}: {
  title: string
  sub: ReactNode
  icon?: LucideIcon
  aside?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pb-5" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.08)' }}>
      <div className="min-w-0 flex-1">
        <h2 className="zy-h1 flex items-center gap-2.5">
          {Icon && <Icon className="h-[22px] w-[22px] shrink-0 text-[#5e6ad2]" strokeWidth={2} />}
          <span className="min-w-0">{title}</span>
        </h2>
        <p className="mt-1.5 text-[14.5px] font-medium leading-[1.8] text-[#56565a]">{sub}</p>
      </div>
      {aside && <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>}
    </header>
  )
}

export function StatCard({
  label, value, sub, icon: Icon,
}: { label: string; value: ReactNode; sub?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl zy-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="zy-eyebrow min-w-0">{label}</div>
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#66666e]" strokeWidth={1.75} />
      </div>
      <div className="zy-num mt-2">{value}</div>
      {sub && <div className="zy-sub mt-1">{sub}</div>}
    </div>
  )
}

/** Two up on a phone, four up from lg. Never one up. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</section>
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="zy-sub px-1 py-6 text-center">{children}</p>
}

/* ── formatting ─────────────────────────────────────────────────────────── */

/** "قبل يومين", "قبل 6 أيام" — the demo's "updated" column, from a real date. */
export function relTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const diff = (t - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })
  const abs = Math.abs(diff)
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / (86400 * 7)), 'week')
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month')
  return rtf.format(Math.round(diff / (86400 * 365)), 'year')
}

/** "14 سبتمبر 2026". */
export function longDate(value: string | number | Date | null | undefined): string {
  if (value == null) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "412 ك.ب" / "3.1 م.ب". */
export function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} م.ب`
  return `${Math.max(1, Math.round(n / 1024))} ك.ب`
}
