'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Moon, Plus, Search, Sun, X, type LucideIcon } from 'lucide-react'
import ZenyaMark from '@/components/ZenyaMark'
import { useT } from '@/components/i18n/LocaleProvider'
import CommandPalette from './CommandPalette'
import { useDashTheme } from './useDashTheme'

/**
 * The dashboard frame: the side rail on a laptop, the top bar, the dock and
 * its "More" sheet on a phone, the search palette and the theme switch.
 *
 * It draws and nothing else. Which page is current, where a row goes and
 * what the top bar holds on its end come in as props, so the real shell
 * (AppShell, rows are links) and /demo/dashboard (rows switch a view) share
 * one frame instead of keeping two copies in step.
 */

export type FrameItem = {
  key: string
  label: string
  icon: LucideIcon
  /** A link. Leave it out and pass onSelect for a row that is not a page. */
  href?: string
  onSelect?: () => void
  active?: boolean
  /** Slug the welcome tour points at. */
  tour?: string
  /** One of the four the phone dock shows. */
  dock?: boolean
  /** Extra words the search palette matches on. */
  keywords?: string
}

export type FrameGroup = { label: string; items: FrameItem[] }

type Props = {
  groups: FrameGroup[]
  title: string
  homeHref?: string
  onHome?: () => void
  /** The primary action: where "New site" goes. */
  newSite: { href?: string; onSelect?: () => void }
  /** The bell and the account control, at the end of the top bar. */
  tools: ReactNode
  /** Under the nav: the problem report. */
  foot?: ReactNode
  /** The "More" sheet's open state, lifted so the welcome tour can open it. */
  moreOpen: boolean
  setMoreOpen: (open: boolean) => void
  dir?: 'rtl' | 'ltr'
  children: ReactNode
}

function Row({ item, onPick }: { item: FrameItem; onPick?: () => void }) {
  const Icon = item.icon
  const common = {
    className: 'zf-row',
    'aria-current': item.active ? ('page' as const) : undefined,
    'data-tour': item.tour,
  }
  const body = (
    <>
      <Icon strokeWidth={item.active ? 2.2 : 1.9} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </>
  )
  if (item.href) {
    return <Link href={item.href} {...common} onClick={() => { item.onSelect?.(); onPick?.() }}>{body}</Link>
  }
  return <button type="button" {...common} onClick={() => { item.onSelect?.(); onPick?.() }}>{body}</button>
}

function NavList({ groups, onPick }: { groups: FrameGroup[]; onPick?: () => void }) {
  return (
    <>
      {groups.map((g) => (
        <div key={g.label}>
          <div className="zf-label">{g.label}</div>
          <div className="zf-nav">
            {g.items.map((it) => <Row key={it.key} item={it} onPick={onPick} />)}
          </div>
        </div>
      ))}
    </>
  )
}

export default function DashFrame({
  groups, title, homeHref, onHome, newSite, tools, foot, moreOpen, setMoreOpen, dir, children,
}: Props) {
  const t = useT()
  const { dark, toggle } = useDashTheme()
  const [palOpen, setPalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  // ⌘K / Ctrl+K opens search from anywhere on the dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // The sheet is modal: Escape closes it and the page behind does not scroll.
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.querySelector<HTMLElement>('button, a')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [moreOpen, setMoreOpen])

  const all = groups.flatMap((g) => g.items)
  const docked = all.filter((i) => i.dock).slice(0, 4)
  const moreActive = all.some((i) => i.active && !i.dock)

  const logo = <ZenyaMark />
  const home = homeHref
    ? <Link href={homeHref} className="zf-logo" aria-label={t.nav.home}>{logo}</Link>
    : <button type="button" className="zf-logo" onClick={onHome} aria-label={t.nav.home}>{logo}</button>

  const newSiteBody = (
    <>
      <Plus strokeWidth={2.4} aria-hidden />
      {t.nav.newSite}
    </>
  )

  return (
    <div dir={dir} className="zf-shell">
      {/* ── the rail, laptop ── */}
      <aside className="zf-side" aria-label={t.nav.pages}>
        {home}
        <nav className="zf-scroll" data-tour="nav">
          <NavList groups={groups} />
        </nav>
        <div className="zf-foot">
          {newSite.href
            ? <Link href={newSite.href} className="zf-new" data-tour="new-site">{newSiteBody}</Link>
            : <button type="button" className="zf-new" onClick={newSite.onSelect}>{newSiteBody}</button>}
          {foot}
          <a className="zf-back" href="https://beynoun.com/?home=1">{t.nav.backToSite}</a>
        </div>
      </aside>

      <div className="zf-main">
        <header className="zf-top" data-scrolled={scrolled ? '' : undefined}>
          {home}
          <h1 className="zf-title">{title}</h1>
          <div className="zf-tools">
            <button type="button" className="zf-search" data-tour="search" onClick={() => setPalOpen(true)} aria-label={t.nav.searchHint}>
              <Search strokeWidth={2} aria-hidden />
              <span className="zf-search-t">{t.nav.searchHint}</span>
              <kbd>⌘K</kbd>
            </button>
            {/* Below the laptop width the rail is gone, so the new-site
                action rides in the bar as an ink circle. */}
            {newSite.href
              ? <Link href={newSite.href} className="zy-top-cta lg:!hidden" data-tour="new-site" aria-label={t.nav.newSite}><Plus className="h-[18px] w-[18px]" strokeWidth={2.4} /></Link>
              : <button type="button" className="zy-top-cta lg:!hidden" onClick={newSite.onSelect} aria-label={t.nav.newSite}><Plus className="h-[18px] w-[18px]" strokeWidth={2.4} /></button>}
            <button
              type="button"
              className="zy-icon-btn zf-theme inline-flex"
              data-tour="theme"
              onClick={toggle}
              aria-label={dark ? t.nav.lightMode : t.nav.darkMode}
              aria-pressed={dark}
            >
              {dark ? <Sun strokeWidth={2} /> : <Moon strokeWidth={2} />}
            </button>
            {tools}
          </div>
        </header>

        {children}
      </div>

      {/* ── the dock, phone and tablet ── */}
      <nav className="zf-dock" aria-label={t.nav.pages} data-tour="nav">
        {docked.map((it) => {
          const Icon = it.icon
          const inner = (<><Icon strokeWidth={it.active ? 2.2 : 1.9} aria-hidden /><span>{it.label}</span></>)
          const props = {
            className: 'zf-dock-b',
            'aria-current': it.active ? ('page' as const) : undefined,
            'data-tour': it.tour,
          }
          return it.href
            ? <Link key={it.key} href={it.href} {...props} onClick={() => it.onSelect?.()}>{inner}</Link>
            : <button key={it.key} type="button" {...props} onClick={() => it.onSelect?.()}>{inner}</button>
        })}
        <button
          type="button"
          className="zf-dock-b"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-current={moreActive ? 'page' : undefined}
          data-tour="more"
        >
          <MoreHorizontal strokeWidth={2} aria-hidden />
          <span>{t.nav.more}</span>
        </button>
      </nav>

      {/* ── More: every page, as a sheet from the bottom ── */}
      <div className="zf-scrim" data-open={moreOpen ? '' : undefined} hidden={!moreOpen} onClick={() => setMoreOpen(false)} aria-hidden />
      <div
        ref={sheetRef}
        className="zf-sheet"
        data-open={moreOpen ? '' : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.pages}
        {...(moreOpen ? {} : { inert: '' as unknown as boolean })}
      >
        <div className="zf-sheet-grab" aria-hidden><i /></div>
        <div className="zf-sheet-head">
          <h2>{t.nav.pages}</h2>
          <button type="button" className="zy-icon-btn inline-flex" onClick={() => setMoreOpen(false)} aria-label={t.nav.closeMenu}>
            <X strokeWidth={2} />
          </button>
        </div>
        <div className="zf-sheet-body">
          <NavList groups={groups} onPick={() => setMoreOpen(false)} />
        </div>
        <div className="zf-sheet-foot">
          {foot}
          <a className="zf-back" href="https://beynoun.com/?home=1">{t.nav.backToSite}</a>
        </div>
      </div>

      {palOpen && (
        <CommandPalette
          items={all}
          dark={dark}
          onToggleTheme={toggle}
          newSite={newSite}
          onClose={() => setPalOpen(false)}
        />
      )}
    </div>
  )
}
