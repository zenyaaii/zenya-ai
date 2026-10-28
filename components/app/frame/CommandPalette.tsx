'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Moon, Plus, Search, Sun, type LucideIcon } from 'lucide-react'
import { useT } from '@/components/i18n/LocaleProvider'
import { dashFont } from '../dash-font'
import type { FrameItem } from './DashFrame'

/**
 * Search: type a word, jump to a page. Opened from the top bar or with
 * ⌘K / Ctrl+K. Arrow keys move, Enter goes, Escape closes.
 *
 * It portals to <body> so no transform or overflow on the page can clip it,
 * which means it carries the token scope (.zy-dash) and the faces itself.
 */

type Entry = { key: string; label: string; icon: LucideIcon; group: string; run: () => void; words: string }

/** Arabic letters that people type interchangeably. */
const fold = (s: string) =>
  s.toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ً-ْـ]/g, '')
    .trim()

export default function CommandPalette({
  items, dark, onToggleTheme, newSite, onClose,
}: {
  items: FrameItem[]
  dark: boolean
  onToggleTheme: () => void
  newSite: { href?: string; onSelect?: () => void }
  onClose: () => void
}) {
  const t = useT()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const entries = useMemo<Entry[]>(() => {
    const go = (it: { href?: string; onSelect?: () => void }) => () => {
      onClose()
      if (it.onSelect) it.onSelect()
      else if (it.href) router.push(it.href)
    }
    return [
      ...items.map((it) => ({
        key: it.key, label: it.label, icon: it.icon, group: t.nav.pages,
        run: go(it), words: fold(`${it.label} ${it.keywords || ''}`),
      })),
      {
        key: 'new-site', label: t.nav.newSite, icon: Plus, group: t.nav.actions,
        run: go(newSite), words: fold(t.nav.newSite),
      },
      {
        key: 'theme', label: dark ? t.nav.lightMode : t.nav.darkMode, icon: dark ? Sun : Moon, group: t.nav.actions,
        run: () => { onClose(); onToggleTheme() }, words: fold(`${t.nav.darkMode} ${t.nav.lightMode}`),
      },
    ]
  }, [items, dark, newSite, onClose, onToggleTheme, router, t])

  const shown = useMemo(() => {
    const f = fold(q)
    return f ? entries.filter((e) => f.split(/\s+/).every((w) => e.words.includes(w))) : entries
  }, [entries, q])

  useEffect(() => { setSel(0) }, [q])
  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  // Focus goes back where it was when the palette closes.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    return () => { before?.focus?.({ preventScroll: true }) }
  }, [])

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, shown.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); shown[sel]?.run() }
  }

  let lastGroup = ''
  return createPortal(
    <div className={`zy-dash ${dashFont.variable}`} dir={document.documentElement.dir || 'rtl'}>
      <div className="zf-pal-scrim" onClick={onClose} aria-hidden />
      <div className="zf-pal" role="dialog" aria-modal="true" aria-label={t.nav.searchHint} onKeyDown={onKey}>
        <div className="zf-pal-in">
          <Search strokeWidth={2} aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.nav.searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="zf-pal-list"
            aria-activedescendant={shown[sel] ? `zf-pal-${shown[sel].key}` : undefined}
            autoComplete="off"
          />
        </div>
        <ul id="zf-pal-list" ref={list} role="listbox">
          {shown.length === 0 && <li className="zf-pal-empty">{t.nav.searchEmpty}</li>}
          {shown.map((e, i) => {
            const head = e.group !== lastGroup
            lastGroup = e.group
            const Icon = e.icon
            return (
              <li key={e.key} role="presentation">
                {head && <div className="zf-pal-grp" role="presentation">{e.group}</div>}
                <button
                  type="button"
                  id={`zf-pal-${e.key}`}
                  role="option"
                  aria-selected={i === sel}
                  className="zf-pal-i"
                  onMouseMove={() => setSel(i)}
                  onClick={e.run}
                  tabIndex={-1}
                >
                  <Icon strokeWidth={1.9} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{e.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
