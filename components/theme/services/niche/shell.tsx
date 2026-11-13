'use client'

/**
 * The frame every heavy niche theme shares: the top strip, the header with
 * its pages, the phone menu, the page change, the inner page heading, the
 * "next page" card and the large footer. A theme gives it pages and its own
 * CSS layer; the frame never decides how a section looks.
 *
 * SAMPLE STAGE (2026-11-12): shown at /demo/niche-lab only.
 *
 * Pages: a page whose body is null is dropped, and its link goes with it, so
 * a shop that answered little gets fewer pages, never an empty one.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, ArrowUpLeft, ChevronLeft, Clock, MapPin, Menu, Phone, Star, X } from 'lucide-react'
import { DAYS_AR, timeAr } from '@/utils/services/barber'
import type { ServiceContent } from '@/utils/services/types'
import { ar, type N } from './kit'

export type SPage = {
  id: string
  /** Link text in the header. */
  label: string
  /** Heading on the page itself; defaults to the label. */
  title?: string
  lead?: string
  image?: string
  body: ReactNode | null
}

const GoCtx = createContext<(id: string) => void>(() => {})
/** Move to another page of the site (or the home page). */
export const useGo = () => useContext(GoCtx)

/* ---------- brand icons lucide does not draw ---------- */
const svg = (d: ReactNode, s = 18) => <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden="true">{d}</svg>
export const Brand = {
  wa: (s = 18) => svg(<path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />, s),
  instagram: (s = 18) => svg(<><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.3" cy="6.8" r="1.1" fill="currentColor" /></>, s),
  tiktok: (s = 18) => svg(<path fill="currentColor" d="M16.6 3c.4 2.3 1.9 3.8 4.2 4v3.1a7.4 7.4 0 0 1-4.1-1.3v6.4A5.8 5.8 0 1 1 10.9 9.4v3.2a2.7 2.7 0 1 0 2.6 2.7V3h3.1z" />, s),
  snapchat: (s = 18) => svg(<path fill="currentColor" d="M12 2.6c3 0 5.2 2.3 5.2 5.3v2.3l1.5-.5c.6-.1 1 .5.6.9-.6.6-1.6.9-2.1 1.1.3 1.6 2 3.6 3.7 4 .4.1.4.6.1.8-.7.4-1.7.6-2.3.7-.1.4-.2 1-.5 1.1-.7.2-1.6-.3-2.9.1-1.1.3-1.8 1.6-3.3 1.6s-2.2-1.3-3.3-1.6c-1.3-.4-2.2.1-2.9-.1-.3-.1-.4-.7-.5-1.1-.6-.1-1.6-.3-2.3-.7-.3-.2-.3-.7.1-.8 1.7-.4 3.4-2.4 3.7-4-.5-.2-1.5-.5-2.1-1.1-.4-.4 0-1 .6-.9l1.5.5V7.9c0-3 2.2-5.3 5.2-5.3z" />, s),
  x: (s = 18) => svg(<path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />, s),
  facebook: (s = 18) => svg(<path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" />, s),
  youtube: (s = 18) => svg(<path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />, s),
}
const SOCIAL_NAME: Record<string, string> = { instagram: 'إنستغرام', tiktok: 'تيك توك', snapchat: 'سناب شات', x: 'إكس', facebook: 'فيسبوك', youtube: 'يوتيوب' }
const SOCIAL_BASE: Record<string, string> = { instagram: 'https://www.instagram.com/', tiktok: 'https://www.tiktok.com/@', snapchat: 'https://www.snapchat.com/add/', x: 'https://x.com/', facebook: 'https://www.facebook.com/', youtube: 'https://www.youtube.com/@' }

export function socials(content: ServiceContent): { key: keyof typeof Brand; name: string; href: string }[] {
  const out: { key: keyof typeof Brand; name: string; href: string }[] = []
  for (const [k, v] of Object.entries(content.social_links || {})) {
    const s = (v || '').trim()
    if (!s || !(k in SOCIAL_BASE)) continue
    const href = /^https?:\/\//i.test(s) ? s : SOCIAL_BASE[k] + s.replace(/^@/, '')
    out.push({ key: k as keyof typeof Brand, name: SOCIAL_NAME[k], href })
  }
  return out
}

/** Today's opening in one short line: "اليوم 5 ص - 12 ص". */
export function todayLine(n: N): string {
  if (!n.st) return ''
  const d = n.hours.find((h) => h.day === n.st!.today)
  if (!d || d.closed || !d.periods.length) return 'مغلق اليوم'
  return `اليوم ${d.periods.map((p) => `${timeAr(p.open)} - ${timeAr(p.close)}`).join('، ')}`
}

/** The window the site is drawn in: the editor draws it inside a frame, so the page's own window is not the app's. */
function winOf(el: Element | null): Window { return el?.ownerDocument?.defaultView || window }

/** Sync the open page with ?p= when the site is not routed by the app. */
function useView(pages: SPage[], rootRef: { current: HTMLElement | null }, initial?: string, view?: string, onViewChange?: (id: string) => void) {
  const ids = pages.map((p) => p.id)
  const valid = (v?: string | null) => (v && ids.includes(v) ? v : 'home')
  const [own, setOwn] = useState(() => valid(initial))
  const cur = onViewChange ? valid(view) : own
  useEffect(() => {
    if (onViewChange) return
    const on = () => setOwn(valid(new URLSearchParams(location.search).get('p')))
    // A shared link (?p=plans) opens on that page; read after mount so the server HTML matches.
    if (new URLSearchParams(location.search).get('p')) on()
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onViewChange, ids.join()])
  const go = useCallback((id: string) => {
    const next = valid(id)
    const swap = () => {
      if (onViewChange) onViewChange(next)
      else {
        setOwn(next)
        const q = new URLSearchParams(location.search)
        if (next === 'home') q.delete('p'); else q.set('p', next)
        history.pushState(null, '', `${location.pathname}${q.toString() ? `?${q}` : ''}`)
      }
      winOf(rootRef.current).scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    const d = (rootRef.current?.ownerDocument || document) as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (d.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(() => flushSync(swap))
    else swap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onViewChange, ids.join()])
  // A new page starts at its top, also when the app (or the editor) sets the page.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    winOf(rootRef.current).scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur])
  return [cur, go] as const
}

export type ShellProps = {
  n: N
  content: ServiceContent
  /** The theme's root class, e.g. "ga". */
  root: string
  style: CSSProperties
  /** Google Fonts css2 query, e.g. "family=Changa:wght@500;800". */
  fonts: string
  css: string
  pages: SPage[]
  /** The one main action, and the page it opens. */
  cta: { label: string; page: string }
  /** Footer's closing call. */
  close?: { title: string; text?: string; image?: string }
  initial?: string
  view?: string
  onViewChange?: (id: string) => void
  /** Short lines for the top strip (beside open now / rating). */
  strip?: string[]
  /** The owner's uploaded logo; hidden when brand.show_logo is false. */
  logo?: string
}

export function Shell(p: ShellProps) {
  const { n, content } = p
  const pages = p.pages.filter((x) => x.body !== null && x.body !== undefined && x.body !== false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [view, go] = useView(pages, rootRef, p.initial, p.view, p.onViewChange)
  const page = pages.find((x) => x.id === view) || pages[0]
  const inner = pages.filter((x) => x.id !== 'home')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { const w = winOf(rootRef.current); const on = () => setScrolled(w.scrollY > 24); on(); w.addEventListener('scroll', on, { passive: true }); return () => w.removeEventListener('scroll', on) }, [])
  useEffect(() => {
    if (!open) return
    const w = winOf(rootRef.current), body = w.document.body
    const prev = body.style.overflow
    body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    w.addEventListener('keydown', esc)
    return () => { body.style.overflow = prev; w.removeEventListener('keydown', esc) }
  }, [open])

  // Reveal: re-scan on every page change.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const seen = new WeakSet<Element>()
    const fresh = () => Array.from(root.querySelectorAll<HTMLElement>('[data-r]:not(.in)')).filter((e) => !seen.has(e))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      const all = () => fresh().forEach((e) => e.classList.add('in'))
      all()
      const mo = new MutationObserver(all)
      mo.observe(root, { childList: true, subtree: true })
      return () => mo.disconnect()
    }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    const watch = () => fresh().forEach((e) => { seen.add(e); io.observe(e) })
    watch()
    // Sections that fill in after mount (today's classes, a tab) are watched too.
    const mo = new MutationObserver(watch)
    mo.observe(root, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [view])

  const nav = (id: string) => { setOpen(false); go(id) }
  const idx = inner.findIndex((x) => x.id === view)
  const next = view === 'home' ? inner[0] : inner[idx + 1] || null
  const soc = socials(content)
  const year = new Date().getFullYear()

  return (
    <GoCtx.Provider value={nav}>
      <div ref={rootRef} className={`nv sh ${p.root}`} dir="rtl" data-view={view} style={p.style}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${p.fonts}&display=swap`} />
        <style dangerouslySetInnerHTML={{ __html: SHELL_CSS + p.css }} />

        <div className="s-strip" data-section="booking">
          <div className="n-w s-strip-in">
            {n.st ? <span className="s-live"><i className={n.st.open ? 'on' : ''} />{n.st.open ? 'مفتوح الآن' : 'مغلق الآن'}<em>{n.st.text}</em></span> : null}
            {n.rating ? <span className="s-hide-sm"><Star size={13} fill="currentColor" strokeWidth={0} /> {n.rating.toFixed(1)}{n.count ? ` · ${ar(n.count)} تقييم على Google` : ''}</span> : null}
            {(p.strip || []).map((s) => <span key={s} className="s-hide-sm">{s}</span>)}
            {n.tel ? <a className="s-strip-tel" href={`tel:${n.tel}`} dir="ltr"><Phone size={13} /> {content.footer.phone}</a> : null}
          </div>
        </div>

        <header className={`s-head${scrolled ? ' solid' : ''}${view === 'home' ? ' home' : ''}`}>
          <div className="n-w s-head-in">
            <button type="button" className="s-logo" data-section="brand" onClick={() => nav('home')} aria-label={`${n.b.name}، الصفحة الرئيسية`}>
              {p.logo && n.b.show_logo !== false ? <img className="s-mark" src={p.logo} alt="" /> : null}
              <span className="s-name"><b>{n.short}</b>{n.b.latin ? <small dir="ltr">{n.b.latin}</small> : null}</span>
            </button>
            <nav className="s-nav" aria-label="صفحات الموقع">
              {inner.filter((x) => x.id !== p.cta.page).map((x) => <button key={x.id} type="button" className={x.id === view ? 'on' : ''} aria-current={x.id === view ? 'page' : undefined} onClick={() => nav(x.id)}>{x.label}</button>)}
            </nav>
            <button type="button" className="n-btn s-cta" onClick={() => nav(p.cta.page)}>{p.cta.label}</button>
            <button type="button" className="s-burger" aria-label="القائمة" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={24} /></button>
          </div>
        </header>

        <div className={`s-menu${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="القائمة" aria-hidden={!open}>
          <div className="s-menu-top n-w">
            <b className="s-logo-txt">{n.short}</b>
            <button type="button" className="s-x" aria-label="إغلاق" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}><X size={26} /></button>
          </div>
          <nav className="s-menu-list n-w">
            {[{ id: 'home', label: 'الرئيسية' }, ...inner].map((x, i) => (
              <button key={x.id} type="button" tabIndex={open ? 0 : -1} className={x.id === view ? 'on' : ''} style={{ ['--i' as string]: i }} onClick={() => nav(x.id)}>
                <small>{String(i + 1).padStart(2, '0')}</small>{x.label}<ArrowUpLeft size={22} />
              </button>
            ))}
          </nav>
          <div className="s-menu-foot n-w">
            {n.st ? <p><Clock size={15} /> {todayLine(n)}</p> : null}
            <div className="n-row">
              {n.wa ? <a className="n-btn" tabIndex={open ? 0 : -1} href={n.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">{Brand.wa()} واتساب</a> : null}
              {n.tel ? <a className="n-btn ghost" tabIndex={open ? 0 : -1} href={`tel:${n.tel}`}><Phone size={17} /> اتصل</a> : null}
            </div>
          </div>
        </div>

        <main className="s-main" key={view}>
          {view !== 'home' ? (
            <section className={`s-ph${page.image ? ' img' : ''}`}>
              {page.image ? <img className="s-ph-img" src={page.image} alt="" /> : null}
              <div className="n-w s-ph-in">
                <nav className="s-crumb" aria-label="أنت هنا"><button type="button" onClick={() => nav('home')}>الرئيسية</button><ChevronLeft size={14} /><span>{page.label}</span></nav>
                <h1>{page.title || page.label}</h1>
                {page.lead ? <p>{page.lead}</p> : null}
              </div>
            </section>
          ) : null}
          {page.body}
          {next && view !== 'home' ? (
            <section className="n-w s-next">
              <button type="button" onClick={() => nav(next.id)}>
                <small>الصفحة التالية</small>
                <b>{next.title || next.label}</b>
                <i><ArrowLeft size={28} /></i>
              </button>
            </section>
          ) : null}
        </main>

        <footer className="s-foot" data-section="footer">
          {p.close ? (
            <section className="s-close">
              {p.close.image ? <img src={p.close.image} alt="" loading="lazy" /> : null}
              <div className="n-w s-close-in">
                <h2>{p.close.title}</h2>
                {p.close.text ? <p>{p.close.text}</p> : null}
                <div className="n-row">
                  <button type="button" className="n-btn" onClick={() => nav(p.cta.page)}>{p.cta.label}<ArrowLeft size={18} /></button>
                  {n.wa ? <a className="n-btn ghost" href={n.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">{Brand.wa()} واتساب</a> : null}
                </div>
              </div>
            </section>
          ) : null}
          <div className="n-w s-cols">
            <div className="s-col-brand">
              <b>{n.b.name}</b>
              {n.b.tagline ? <p>{n.b.tagline}</p> : null}
              {soc.length ? <div className="s-soc">{soc.map((s) => <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>{Brand[s.key]()}</a>)}</div> : null}
            </div>
            <div>
              <h3>الصفحات</h3>
              <ul>{[{ id: 'home', label: 'الرئيسية' }, ...inner].map((x) => <li key={x.id}><button type="button" onClick={() => nav(x.id)}>{x.label}</button></li>)}</ul>
            </div>
            <div>
              <h3>تواصل</h3>
              <ul>
                {content.footer.address || n.where ? <li><MapPin size={15} />{[content.footer.address, n.where].filter(Boolean).join('، ')}</li> : null}
                {n.tel ? <li><Phone size={15} /><a href={`tel:${n.tel}`} dir="ltr">{content.footer.phone}</a></li> : null}
                {n.wa ? <li>{Brand.wa(15)}<a href={n.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">راسلنا على واتساب</a></li> : null}
                {n.mapsUrl ? <li><ArrowUpLeft size={15} /><a href={n.mapsUrl} target="_blank" rel="noopener noreferrer">افتح الموقع في الخرائط</a></li> : null}
              </ul>
            </div>
            {n.hours.length ? (
              <div>
                <h3>الدوام</h3>
                <ul className="s-fhours">{n.hours.map((d) => <li key={d.day} className={n.st?.today === d.day ? 'today' : ''}><span>{DAYS_AR[d.day]}</span><span>{d.closed || !d.periods.length ? 'مغلق' : d.periods.map((x) => `${timeAr(x.open)} - ${timeAr(x.close)}`).join('، ')}</span></li>)}</ul>
              </div>
            ) : null}
          </div>
          <div className="s-word" aria-hidden="true"><span style={{ ['--len' as string]: (n.b.latin || n.short).length } as CSSProperties}>{n.b.latin || n.short}</span></div>
          <div className="n-w s-legal"><span>© {year.toLocaleString('ar', { useGrouping: false })} {n.b.name}</span>{n.where ? <span>{n.where}</span> : null}</div>
        </footer>

        <nav className="n-bar s-bar" aria-label="تواصل سريع">
          <button type="button" className="n-btn" onClick={() => nav(p.cta.page)}>{p.cta.label}</button>
          {n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer" aria-label="واتساب">{Brand.wa(20)}</a> : null}
          {n.tel ? <a className="n-btn ghost sq" href={`tel:${n.tel}`} aria-label="اتصل"><Phone size={19} /></a> : null}
        </nav>
      </div>
    </GoCtx.Provider>
  )
}

/** A link that opens another page of the site. */
export function GoLink({ to, children, className = 'n-btn ghost' }: { to: string; children: ReactNode; className?: string }) {
  const go = useGo()
  return <button type="button" className={className} onClick={() => go(to)}>{children}</button>
}

/**
 * Frame CSS. Structure only, in the theme's variables; each theme restyles
 * every part through its root class. Heights are held for a phone at 390.
 */
export const SHELL_CSS = `
.sh{--s-strip:34px;--s-head:72px}
.s-strip{background:var(--s-strip-bg,var(--n-ink));color:var(--s-strip-ink,var(--n-bg));font-size:13px;position:relative;z-index:31}
.s-strip-in{display:flex;align-items:center;gap:22px;height:var(--s-strip);white-space:nowrap;overflow:hidden}
.s-strip-in>span{display:inline-flex;align-items:center;gap:6px;opacity:.85}
.s-live{opacity:1!important;font-weight:600}
.s-live i{width:7px;height:7px;border-radius:50%;background:#e2574c;display:inline-block}
.s-live i.on{background:#3fcf7a;box-shadow:0 0 0 0 rgba(63,207,122,.6);animation:s-ping 2s infinite}
@keyframes s-ping{70%{box-shadow:0 0 0 7px rgba(63,207,122,0)}100%{box-shadow:0 0 0 0 rgba(63,207,122,0)}}
.s-live em{font-style:normal;font-weight:400;opacity:.75;margin-inline-start:4px}
.s-strip-tel{margin-inline-start:auto;display:inline-flex;align-items:center;gap:6px;font-weight:600}
.s-head{position:sticky;top:0;z-index:30;transition:background-color .3s,box-shadow .3s,color .3s;background:var(--n-bg)}
.s-head.solid{box-shadow:0 1px 0 var(--n-line),0 12px 30px -24px rgba(0,0,0,.5)}
.s-head-in{display:flex;align-items:center;gap:28px;height:var(--s-head)}
.s-logo{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;line-height:1.05}
.s-name{display:grid}
.nv .s-mark{width:40px;height:40px;object-fit:contain;border-radius:8px;flex:none}
.s-logo b{font:800 22px var(--n-disp)}
.s-logo small{font:600 10px/1.4 var(--n-body);letter-spacing:.18em;text-transform:uppercase;opacity:.6}
.s-logo:focus-visible{outline:2px solid var(--n-acc);outline-offset:4px}
.s-nav{display:flex;gap:4px;margin-inline-start:auto}
.s-nav button{all:unset;cursor:pointer;position:relative;padding:8px 12px;font:500 15px var(--n-body);color:var(--n-ink2);border-radius:8px;transition:color .2s}
.s-nav button::after{content:"";position:absolute;inset:auto 12px 2px;height:2px;background:var(--n-acc);transform:scaleX(0);transform-origin:right;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.s-nav button:hover,.s-nav button.on{color:var(--n-ink)}
.s-nav button:hover::after,.s-nav button.on::after{transform:none}
.s-nav button:focus-visible{outline:2px solid var(--n-acc)}
.sh .s-cta{min-height:46px}
.s-burger{all:unset;cursor:pointer;display:none;width:46px;height:46px;place-items:center;border-radius:12px;border:1px solid var(--n-line);margin-inline-start:auto}
@media (max-width:980px){.sh .s-nav,.sh .s-head .s-cta{display:none}.s-burger{display:grid}.s-hide-sm{display:none!important}}
.s-menu{position:fixed;inset:0;z-index:60;background:var(--s-menu-bg,var(--n-ink));color:var(--s-menu-ink,var(--n-bg));display:grid;grid-template-rows:auto 1fr auto;padding:14px 0 calc(22px + env(safe-area-inset-bottom));clip-path:circle(0 at calc(100% - 0px) 0);visibility:hidden;transition:clip-path .6s cubic-bezier(.7,0,.2,1),visibility 0s .6s}
[dir=rtl] .s-menu{clip-path:circle(0 at 40px 50px)}
.s-menu.open{clip-path:circle(150% at 40px 50px);visibility:visible;transition:clip-path .7s cubic-bezier(.7,0,.2,1),visibility 0s}
.s-menu-top{display:flex;justify-content:space-between;align-items:center;height:56px}
.s-logo-txt{font:800 22px var(--n-disp)}
.s-x{all:unset;cursor:pointer;width:46px;height:46px;display:grid;place-items:center;border-radius:50%;border:1px solid color-mix(in srgb,currentColor 25%,transparent)}
.s-menu-list{display:grid;align-content:center;gap:2px}
.s-menu-list button{all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid color-mix(in srgb,currentColor 14%,transparent);font:700 clamp(30px,8.5vw,46px)/1.15 var(--n-disp);opacity:0;transform:translateY(30px);transition:opacity .5s,transform .6s cubic-bezier(.2,.8,.2,1)}
.s-menu.open .s-menu-list button{opacity:1;transform:none;transition-delay:calc(.25s + var(--i)*.06s)}
.s-menu-list small{font:600 12px var(--n-body);opacity:.5;width:24px}
.s-menu-list svg{margin-inline-start:auto;opacity:.4}
.s-menu-list button.on{color:var(--n-acc)}
.s-menu-foot{display:grid;gap:14px;opacity:0;transition:opacity .4s .5s}
.s-menu.open .s-menu-foot{opacity:1}
.s-menu-foot p{display:flex;align-items:center;gap:8px;font-size:14px;opacity:.75}
.s-menu-foot .n-btn{flex:1}
.sh .s-menu-foot .n-btn.ghost{color:inherit;border-color:color-mix(in srgb,currentColor 25%,transparent)}
.s-main{animation:s-in .55s cubic-bezier(.2,.8,.2,1) both}
@keyframes s-in{from{opacity:0;transform:translateY(14px)}}
::view-transition-old(root){animation:s-out .25s ease both}
::view-transition-new(root){animation:s-new .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes s-out{to{opacity:0}}@keyframes s-new{from{opacity:0}}
.s-ph{position:relative;overflow:hidden;padding:72px 0 56px;border-bottom:1px solid var(--n-line)}
.s-ph-in{position:relative;z-index:1;display:grid;gap:16px}
.s-ph h1{font-size:clamp(44px,7vw,104px);line-height:.98;font-weight:800;letter-spacing:-.01em}
.s-ph p{max-width:56ch;font-size:18px;color:var(--n-ink2)}
.s-ph.img{min-height:min(62vh,560px);display:flex;align-items:flex-end;color:#fff;border:0}
.s-ph.img p{color:rgba(255,255,255,.82)}
.s-ph-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:s-kb 14s ease-out both}
@keyframes s-kb{from{transform:scale(1.12)}}
.s-ph.img::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.78),rgba(0,0,0,.15) 70%)}
.s-crumb{display:flex;align-items:center;gap:6px;font-size:13px;opacity:.75}
.s-crumb button{all:unset;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.s-next{padding:56px 0 80px}
.s-next button{all:unset;cursor:pointer;display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px 20px;width:100%;padding:28px 0;border-top:1px solid var(--n-line);border-bottom:1px solid var(--n-line)}
.s-next small{grid-column:1;font-size:13px;color:var(--n-mute)}
.s-next b{grid-column:1;font:800 clamp(30px,5vw,64px)/1.05 var(--n-disp);transition:color .3s}
.s-next i{grid-column:2;grid-row:1/3;display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:var(--n-acc);color:var(--n-on);transition:transform .45s cubic-bezier(.3,1.5,.5,1)}
.s-next button:hover b{color:var(--n-acc)}
.s-next button:hover i{transform:translateX(-10px) rotate(-8deg)}
.s-foot{background:var(--s-foot-bg,var(--n-ink));color:var(--s-foot-ink,var(--n-bg));overflow:hidden}
.s-close{position:relative;padding:110px 0;overflow:hidden;isolation:isolate}
.s-close img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;opacity:.9}
.s-close::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to left,color-mix(in srgb,var(--s-foot-bg,var(--n-ink)) 96%,transparent) 30%,color-mix(in srgb,var(--s-foot-bg,var(--n-ink)) 55%,transparent))}
.s-close-in{display:grid;gap:18px;justify-items:start}
.s-close h2{font-size:clamp(42px,7vw,110px);line-height:.95;font-weight:800;max-width:14ch}
.s-close p{font-size:18px;opacity:.8;max-width:46ch}
.sh .s-close .n-btn.ghost{color:inherit;border-color:color-mix(in srgb,currentColor 30%,transparent)}
.s-close .n-btn.ghost:hover{background:color-mix(in srgb,currentColor 10%,transparent)}
.s-cols{display:grid;grid-template-columns:1.4fr 1fr 1.3fr 1.3fr;gap:40px;padding:64px 0 40px;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent)}
.s-cols h3{font:600 13px var(--n-body);letter-spacing:.06em;opacity:.55;margin-bottom:14px}
.s-cols ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:15px}
.s-cols li{display:flex;gap:9px;align-items:flex-start}
.s-cols li svg{flex:none;margin-top:5px;opacity:.6}
.s-cols button{all:unset;cursor:pointer;transition:color .2s}
.s-cols button:hover,.s-cols a:hover{color:var(--s-foot-acc,var(--n-acc))}
.s-col-brand b{font:800 28px var(--n-disp);display:block;margin-bottom:8px}
.s-col-brand p{opacity:.7;font-size:15px;max-width:30ch}
.s-soc{display:flex;gap:8px;margin-top:18px}
.s-soc a{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;border:1px solid color-mix(in srgb,currentColor 22%,transparent);transition:background .25s,color .25s,transform .3s cubic-bezier(.3,1.6,.5,1)}
.s-soc a:hover{background:var(--n-acc);color:var(--n-on);border-color:transparent;transform:translateY(-3px)}
.s-fhours li{justify-content:space-between;font-size:14px}
.s-fhours li span:first-child{opacity:.6}
.s-fhours li.today{color:var(--s-foot-acc,var(--n-acc));font-weight:700}.s-fhours li.today span{opacity:1}
.s-word{overflow:hidden;line-height:.8;padding-top:10px}
.s-word span{display:block;white-space:nowrap;text-align:center;font:800 min(280px,17vw,calc(150vw / var(--len,8)))/.8 var(--n-disp);letter-spacing:-.03em;color:color-mix(in srgb,currentColor 9%,transparent);transform:translateY(12%)}
.s-legal{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:18px 0 26px;font-size:13px;opacity:.6;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent)}
@media (max-width:980px){.s-cols{grid-template-columns:1fr 1fr;gap:32px 20px}.s-col-brand{grid-column:1/-1}}
@media (max-width:560px){.s-cols{grid-template-columns:1fr}.s-ph{padding:48px 0 36px}.s-close{padding:76px 0}.s-next i{width:56px;height:56px}.sh{--s-head:64px}}
.sh .s-bar .n-btn.ghost{background:var(--n-bg)}
@media (prefers-reduced-motion:reduce){.s-menu,.s-menu.open{transition:none}.s-ph-img{animation:none}}
`
