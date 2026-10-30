'use client'

import { useEffect, useState } from 'react'
import { Ic, useV6 } from './v6/ui'
import type { IconName } from './v6/sprite'

/**
 * The bell in the top bar, as the v6 design draws it: a round button with a
 * small accent dot while something is unread, and a popover «الإشعارات» with
 * «تحديد الكل كمقروء».
 *
 * It carries three kinds of news: new Google reviews that the daily check
 * found for one of the owner's sites, a site Beynoun handed over to this
 * account, which asks yes or no, and a notice from Beynoun with a link
 * (public.user_notices).
 *
 * "Read" is remembered in this browser only (localStorage), per item and its
 * own signature, so a newer batch of reviews on the same site is unread again.
 * Marking read changes nothing on the site: the reviews stay new on the
 * Reviews page until the owner opens it.
 */
export type BellItem = {
  id: string
  /** "3 تقييمات جديدة" */
  title: string
  /** The site's name. */
  site: string
  /** "اليوم 9:00 ص" */
  when: string
  href?: string
  /** Open href in a new tab (a notice's link usually leaves the dashboard). */
  external?: boolean
  /** 'notice' is a message from Beynoun; anything else is a review. */
  kind?: 'notice'
  onOpen?: () => void
  /** A handover: the question and its two answers, shown in the item itself. */
  handover?: {
    host: string
    plan: string
    done?: boolean
    onYes: () => void
    noHref: string
  }
}

const KEY = 'beynoun-bell-read'
const sig = (it: BellItem) => `${it.id}|${it.title}|${it.when}`
function readSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { return new Set() }
}
function saveSet(s: Set<string>) {
  try { localStorage.setItem(KEY, JSON.stringify([...s].slice(-60))) } catch {}
}

export function NotificationsBell({ items, label = 'الإشعارات' }: { items: BellItem[]; label?: string }) {
  const { openPop } = useV6()
  const [read, setRead] = useState<Set<string>>(new Set())
  useEffect(() => { setRead(readSet()) }, [])

  // An answered handover is no longer news.
  const count = items.filter((it) => !(it.handover?.done) && !read.has(sig(it))).length

  return (
    <button
      type="button" className="icon-btn press" id="bell" data-tour="bell"
      aria-label={count ? `${label}: ${count} جديد` : label}
      aria-haspopup="true" aria-expanded="false"
      onClick={(e) => openPop(e.currentTarget, <BellList items={items} label={label} onRead={setRead} />, 360)}
    >
      <Ic n="bell" />
      <span className="pip" hidden={count === 0} />
    </button>
  )
}

/** The popover's list. It keeps its own "read" state, since the frame holds it as drawn. */
function BellList({ items, label, onRead }: { items: BellItem[]; label: string; onRead: (s: Set<string>) => void }) {
  const { closePop } = useV6()
  const [read, setRead] = useState<Set<string>>(() => readSet())
  const isUnread = (it: BellItem) => !(it.handover?.done) && !read.has(sig(it))
  const mark = (list: BellItem[]) => {
    const s = readSet()
    list.forEach((it) => s.add(sig(it)))
    saveSet(s)
    setRead(new Set(s))
    onRead(new Set(s))
  }
  return (
    <>
      <h4>
        {label}
        {items.some(isUnread) && <button type="button" onClick={() => mark(items)}>تحديد الكل كمقروء</button>}
      </h4>
      {items.length === 0 && <div className="empty" style={{ padding: '20px 8px' }}><Ic n="bell" /><span>لا جديد الآن.</span></div>}
      {items.map((it) => it.handover ? (
        <Handover key={it.id} it={it} unread={isUnread(it)} onSeen={() => mark([it])} />
      ) : (
        <a
          key={it.id} href={it.href || '#'} className={`pi ${isUnread(it) ? 'unread' : ''}`}
          {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          onClick={(e) => {
            mark([it])
            closePop()
            // A notice still opens its link; an item with nowhere to go (the demo's) only runs onOpen.
            if (!it.href) e.preventDefault()
            it.onOpen?.()
          }}
        >
          {it.kind === 'notice'
            ? <span className="tile acc"><Ic n="sparkle" /></span>
            : <span className="tile warn"><Ic n={'reviews' as IconName} /></span>}
          <span className="tx"><b>{it.title}</b><span>{it.site} · {it.when}</span></span>
        </a>
      ))}
    </>
  )
}

/** "Your site is in your account. Did you get everything?" with the two answers. */
function Handover({ it, unread, onSeen }: { it: BellItem; unread: boolean; onSeen: () => void }) {
  const h = it.handover!
  const [done, setDone] = useState(!!h.done)
  return (
    <div className={`pi ${unread ? 'unread' : ''}`} style={{ alignItems: 'flex-start' }}>
      <span className="tile ok"><Ic n="check" /></span>
      <span className="tx">
        <b>{it.title}</b>
        <span className="ltr" style={{ textAlign: 'end' }}>{h.host}</span>
        <span>الباقة: {h.plan} · {it.when}</span>
        {done ? (
          <span style={{ marginTop: 6, fontWeight: 700, color: 'var(--ok)' }}>شكرًا، سجّلنا أنه وصلك.</span>
        ) : (
          <>
            <span style={{ marginTop: 6, fontWeight: 700, color: 'var(--ink)' }}>هل وصلك كل شيء؟</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <button type="button" className="btn k sm press" onClick={() => { h.onYes(); setDone(true); onSeen() }}>نعم، وصلني</button>
              <a className="btn line sm press" href={h.noHref}>لا، فيه مشكلة</a>
            </span>
          </>
        )}
      </span>
    </div>
  )
}
