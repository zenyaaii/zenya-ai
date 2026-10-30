'use client'

/**
 * THE DASHBOARD FRAME, AS THE v6 DESIGN DRAWS IT.
 *
 * The markup and class names are the design file's own (the v6
 * dashboard.html: aside.side, header.top, nav.dock, .sheet, .pop, .pal,
 * .toast), and so is the stylesheet (v6.css, the design's CSS scoped under
 * .v6). One change on purpose, the owner's: the side menu is the dark
 * floating panel in light mode too (v6-frame.css).
 *
 * It draws and nothing else. Which page is current, where a row goes, the
 * account's sites and the bell and account controls come in as props, so the
 * real shell (AppShell, rows are links) and /demo/dashboard (rows switch a
 * view) share one frame.
 */

import {
  Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import Link from 'next/link'
import ZenyaMark from '@/components/ZenyaMark'
import { useDashTheme } from '@/components/app/frame/useDashTheme'
import { V6_SPRITE, type IconName } from './sprite'
import { Ic, V6Ctx, reduceMotion, type SheetSpec, type ToastOpts, type V6Api } from './ui'

export type FramePage = {
  key: string
  label: string
  icon: IconName
  /** 'w' مساحة العمل, 'a' الحساب */
  group: 'w' | 'a'
  href?: string
  onSelect?: () => void
  active?: boolean
  count?: number
  /** Bookings are counted in the accent, reviews quietly. */
  countTone?: 'acc' | 'quiet'
  /** The dashboard tour finds a control by this name. */
  tour?: string
  keywords?: string
}

export type FrameSite = {
  id: string
  name: string
  live: boolean
  /** The address people visit, without https:// */
  host: string | null
  cover: string | null
}

type Target = { href?: string; onSelect?: () => void }

type Props = {
  pages: FramePage[]
  /** The page's name, shown in the bar once the page's own title has scrolled away. */
  title: string
  home: Target
  newSite: Target
  sites: FrameSite[]
  siteId: string
  onSite: (id: string) => void
  /** Moves to a page or a tab of one: 'seo', 'analytics:search'. */
  go: (to: string) => void
  /** The bell and the account button, at the end of the bar. */
  tools: ReactNode
  /** The help sheet's report box. onSend replaces the network call (the demo). */
  help?: { email?: string; onSend?: (message: string) => Promise<void> }
  /** The "More" sheet's open state, lifted so the dashboard tour can open it. */
  moreOpen: boolean
  setMoreOpen: (open: boolean) => void
  /** The page is one of the older screens, which bring their own gutters. */
  legacy?: boolean
  dir?: 'rtl' | 'ltr'
  pageKey?: string
  children: ReactNode
}

const DOCK = ['home', 'bookings', 'analytics', 'sites'] as const
const BACK = 'https://beynoun.com/?home=1'

function To({ to, className, children, onDone, ...rest }: { to: Target; className?: string; children: ReactNode; onDone?: () => void } & Record<string, unknown>) {
  if (to.href) return <Link href={to.href} className={className} onClick={() => { to.onSelect?.(); onDone?.() }} {...rest}>{children}</Link>
  return <button type="button" className={className} onClick={() => { to.onSelect?.(); onDone?.() }} {...rest}>{children}</button>
}

const SWEDGE = (s: FrameSite, full: boolean) => {
  const th = s.cover ? <img src={s.cover} alt="" /> : s.name[0]
  return full ? (
    <>
      <span className="thumb">{th}</span>
      <span className="trunc" style={{ flex: 1 }}>
        <b className="trunc">{s.name}</b>
        <small><span className={`dot ${s.live ? 'ok' : 'warn'}`} />{s.live ? 'منشور' : 'مسودة'}</small>
      </span>
      <Ic n="chevd" className="chev" />
    </>
  ) : (
    <><span className="thumb">{th}</span><span className="trunc">{s.name}</span><Ic n="chevd" /></>
  )
}

export default function Frame({
  pages, title, home, newSite, sites, siteId, onSite, go, tools, help,
  moreOpen, setMoreOpen, legacy, dir, pageKey, children,
}: Props) {
  const { dark, toggle } = useDashTheme()
  const root = useRef<HTMLDivElement>(null)

  /* ---- sheet ------------------------------------------------------------ */
  const [sheet, setSheet] = useState<SheetSpec | null>(null)
  const [sheetOn, setSheetOn] = useState(false)
  const sheetEl = useRef<HTMLDivElement>(null)
  const sheetFocus = useRef<HTMLElement | null>(null)
  const sheetRef = useRef<SheetSpec | null>(null)
  sheetRef.current = sheet

  const closeSheet = useCallback(() => {
    setSheetOn((on) => {
      if (!on) return on
      document.body.style.overflow = ''
      const f = sheetRef.current?.onClose
      if (f) setTimeout(f, 0)
      const back = sheetFocus.current
      if (back && back.isConnected) back.focus({ preventScroll: true })
      return false
    })
  }, [])

  /* ---- popover ---------------------------------------------------------- */
  const [pop, setPop] = useState<{ anchor: HTMLElement; body: ReactNode; width?: number } | null>(null)
  const popEl = useRef<HTMLDivElement>(null)
  const popRef = useRef(pop)
  popRef.current = pop
  const closePop = useCallback((silent?: boolean) => {
    const p = popRef.current
    if (!p) return
    p.anchor.setAttribute('aria-expanded', 'false')
    if (!silent && p.anchor.isConnected) p.anchor.focus({ preventScroll: true })
    setPop(null)
  }, [])

  /* ---- toast ------------------------------------------------------------ */
  const [tst, setTst] = useState<{ msg: string; o: ToastOpts; n: number } | null>(null)
  const [tstOn, setTstOn] = useState(false)
  const tstTimer = useRef<ReturnType<typeof setTimeout>>()
  const toast = useCallback((msg: string, o: ToastOpts = {}) => {
    setTst((t) => ({ msg, o, n: (t?.n || 0) + 1 }))
    setTstOn(false)
    requestAnimationFrame(() => setTstOn(true))
    clearTimeout(tstTimer.current)
    tstTimer.current = setTimeout(() => setTstOn(false), o.undo ? 5000 : 2400)
  }, [])

  /* ---- search ----------------------------------------------------------- */
  const [palOn, setPalOn] = useState(false)

  const openSheet = useCallback((s: SheetSpec) => {
    closePop(true)
    setPalOn(false)
    sheetFocus.current = document.activeElement as HTMLElement | null
    setSheet(s)
    if (sheetEl.current) { sheetEl.current.style.transform = ''; const b = sheetEl.current.querySelector('.sh-body'); if (b) b.scrollTop = 0 }
    setSheetOn(true)
    document.body.style.overflow = 'hidden'
    setTimeout(() => {
      const sh = sheetEl.current
      if (!sh) return
      const coarse = window.matchMedia('(pointer:coarse)').matches
      const f = (!coarse && sh.querySelector<HTMLElement>('[autofocus],[data-autofocus]')) || sh.querySelector<HTMLElement>('[data-close]')
      f?.focus({ preventScroll: true })
    }, 90)
  }, [closePop])

  const openPop = useCallback((anchor: HTMLElement, body: ReactNode, width?: number) => {
    if (popRef.current?.anchor === anchor) { closePop(); return }
    closePop(true)
    anchor.setAttribute('aria-expanded', 'true')
    setPop({ anchor, body, width })
  }, [closePop])

  // Place the popover under its anchor, or above it when there is no room.
  useLayoutEffect(() => {
    const p = popEl.current
    if (!p || !pop) return
    const r = pop.anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight
    let left = r.left + r.width / 2 - pw / 2
    left = Math.max(12, Math.min(window.innerWidth - 12 - pw, left))
    let top = r.bottom + 10
    if (top + ph > window.innerHeight - 12 && r.top - 10 - ph > 12) top = r.top - 10 - ph
    p.style.left = left + 'px'
    p.style.top = top + 'px'
    p.style.transformOrigin = `${r.left + r.width / 2 - left}px ${top > r.top ? '-8px' : ph + 8 + 'px'}`
    const t = setTimeout(() => p.querySelector<HTMLElement>('button,a')?.focus({ preventScroll: true }), 30)
    return () => clearTimeout(t)
  }, [pop])

  useEffect(() => {
    if (!pop) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (!popEl.current?.contains(t) && !pop.anchor.contains(t)) closePop(true)
    }
    const resize = () => closePop(true)
    const scroll = () => { if (!popEl.current?.contains(document.activeElement)) closePop(true) }
    document.addEventListener('pointerdown', down)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', down)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', scroll)
    }
  }, [pop, closePop])

  const api: V6Api = useMemo(() => ({
    openSheet, closeSheet, openPop, closePop: () => closePop(), toast,
    openPal: () => { closePop(true); setPalOn(true) },
    dark, toggleTheme: toggle,
  }), [openSheet, closeSheet, openPop, closePop, toast, dark, toggle])

  /* ---- keys: ⌘K, Escape ------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); closePop(true); setPalOn((o) => !o) }
      if (e.key === 'Escape') {
        if (popRef.current) closePop()
        else if (palOnRef.current) setPalOn(false)
        else closeSheet()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closePop, closeSheet])
  const palOnRef = useRef(palOn)
  palOnRef.current = palOn

  /* ---- the large title collapses into the bar --------------------------- */
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => {
      const y = window.scrollY
      const h = root.current?.querySelector<HTMLElement>('.page.on h1')
      if (h && !reduceMotion()) {
        const p = Math.min(1, Math.max(0, y / 90))
        h.style.transform = p ? `scale(${1 - p * 0.12})` : ''
        h.style.opacity = p ? String(1 - p * 0.8) : ''
      }
      setScrolled(y > 64)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [pageKey])

  /* ---- the "you are here" pills slide to the current page --------------- */
  const navRef = useRef<HTMLElement>(null)
  const dockRef = useRef<HTMLElement>(null)
  const moveInd = useCallback(() => {
    const nav = navRef.current
    if (nav) {
      const ind = nav.querySelector<HTMLElement>('.ind')!
      const a = nav.querySelector<HTMLElement>('a[aria-current="page"], button[aria-current="page"]')
      if (a) { ind.style.opacity = '1'; ind.style.transform = `translateY(${a.offsetTop}px)` } else ind.style.opacity = '0'
    }
    const dock = dockRef.current
    if (dock) {
      const di = dock.querySelector<HTMLElement>('.ind')!
      const t = dock.querySelector<HTMLElement>('[aria-current="page"]')
      if (t) { di.style.opacity = '1'; di.style.width = t.offsetWidth + 'px'; di.style.transform = `translateX(${t.offsetLeft - 5}px)` } else di.style.opacity = '0'
    }
  }, [])
  const activeKey = pages.find((p) => p.active)?.key
  useLayoutEffect(() => { moveInd() }, [moveInd, activeKey, pages])
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const r = () => { clearTimeout(t); t = setTimeout(moveInd, 60) }
    window.addEventListener('resize', r)
    document.fonts?.ready.then(moveInd)
    const t2 = setTimeout(moveInd, 300)
    return () => { window.removeEventListener('resize', r); clearTimeout(t); clearTimeout(t2) }
  }, [moveInd])

  /* ---- More: every page, as a sheet (phone) ------------------------------ */
  const reviewsNew = pages.find((p) => p.key === 'reviews')?.count || 0
  const moreSheet = useCallback(() => {
    const done = () => closeSheet()
    openSheet({
      title: 'كل الصفحات',
      onClose: () => setMoreOpen(false),
      body: (
        <>
          <div className="qgrid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }} data-tour-more>
            {pages.filter((p) => !(DOCK as readonly string[]).includes(p.key)).map((p) => (
              <To key={p.key} to={p} onDone={done} className="q press" style={{ alignItems: 'center', textAlign: 'center', minHeight: 104 }} aria-current={p.active ? 'page' : undefined}>
                <span className="tile"><Ic n={p.icon} /></span><b>{p.label}</b>
                {p.key === 'reviews' && reviewsNew > 0 && <span className="pill acc" style={{ marginTop: -4 }}>{reviewsNew} جديد</span>}
              </To>
            ))}
          </div>
          <div className="rows" style={{ marginTop: 12 }}>
            <To to={newSite} onDone={done} className="r"><span className="tile"><Ic n="plus" /></span><span className="tx"><b>موقع جديد</b><span>اختر نوع نشاطك ونبنيه لك</span></span><Ic n="chev" className="chev" /></To>
            <button type="button" className="r" onClick={() => helpRef.current()}><span className="tile"><Ic n="help" /></span><span className="tx"><b>المساعدة</b><span>أبلغ عن مشكلة أو اسألنا</span></span><Ic n="chev" className="chev" /></button>
          </div>
        </>
      ),
    })
  }, [pages, newSite, reviewsNew, openSheet, closeSheet, setMoreOpen])

  // The tour (and the dock) open and close More through moreOpen.
  useEffect(() => {
    if (moreOpen) moreSheet()
    else if (sheetRef.current?.title === 'كل الصفحات') closeSheet()
  }, [moreOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- help ----------------------------------------------------------------- */
  const helpRef = useRef<() => void>(() => {})
  helpRef.current = () => openSheet({
    title: 'المساعدة',
    body: <HelpBody email={help?.email} />,
    foot: <HelpFoot onSend={help?.onSend} email={help?.email} toast={toast} done={closeSheet} />,
  })
  useEffect(() => {
    const h = () => helpRef.current()
    window.addEventListener('v6:help', h)
    return () => window.removeEventListener('v6:help', h)
  }, [])

  /* ---- site switcher ------------------------------------------------------- */
  const site = sites.find((s) => s.id === siteId) || null
  const siteMenu = (anchor: HTMLElement) => openPop(anchor, (
    <>
      <h4>مواقعك</h4>
      {sites.map((s) => (
        <button key={s.id} className={`pi ${s.id === siteId ? 'on' : ''}`} onClick={() => {
          closePop(true)
          if (s.id !== siteId) { onSite(s.id); toast('تم التبديل إلى ' + s.name) }
        }}>
          <span className={`tile ${s.live ? 'ok' : 'warn'}`}><Ic n={s.live ? 'globe' : 'edit'} /></span>
          <span className="tx"><b>{s.name}</b><span>{s.live ? s.host : 'مسودة · غير منشور بعد'}</span></span>
          {s.id === siteId && <span className="end"><Ic n="check" /></span>}
        </button>
      ))}
      <hr />
      <To to={newSite} onDone={() => closePop(true)} className="pi"><span className="tile"><Ic n="plus" /></span><span className="tx"><b>موقع جديد</b><span>اختر نوع نشاطك ونبنيه لك</span></span></To>
    </>
  ), 300)

  /* ---- sheet drag to close (phone) ----------------------------------------- */
  const drag = useRef<{ y0: number; dy: number; t0: number } | null>(null)
  const dragStart = (e: React.PointerEvent) => {
    if (window.innerWidth >= 760 || (e.target as HTMLElement).closest('button,a,input,textarea')) return
    drag.current = { y0: e.clientY, dy: 0, t0: performance.now() }
    sheetEl.current?.classList.add('drag')
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }
  const dragMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !sheetEl.current) return
    d.dy = e.clientY - d.y0
    const v = d.dy < 0 ? -Math.sqrt(-d.dy) * 2 : d.dy
    sheetEl.current.style.transform = `translateY(${v}px)`
    const sc = root.current?.querySelector<HTMLElement>('.scrim')
    if (sc) sc.style.opacity = String(Math.max(0, 1 - d.dy / 420))
  }
  const dragEnd = () => {
    const d = drag.current
    if (!d || !sheetEl.current) return
    const v = d.dy / Math.max(1, performance.now() - d.t0)
    drag.current = null
    sheetEl.current.classList.remove('drag')
    const sc = root.current?.querySelector<HTMLElement>('.scrim')
    if (sc) sc.style.opacity = ''
    if (d.dy > 110 || v > 0.6) { sheetEl.current.style.transform = ''; closeSheet() } else sheetEl.current.style.transform = ''
  }
  const dragProps = { onPointerDown: dragStart, onPointerMove: dragMove, onPointerUp: dragEnd, onPointerCancel: dragEnd }

  const logo = <ZenyaMark />
  const work = pages.filter((p) => p.group === 'w'), acct = pages.filter((p) => p.group === 'a')
  const navRow = (p: FramePage) => (
    <To key={p.key} to={p} aria-current={p.active ? 'page' : undefined} data-tour={p.tour}>
      <Ic n={p.icon} /><span>{p.label}</span>
      {p.countTone && !!p.count && <span className={`count num ${p.countTone === 'quiet' ? 'cq' : ''}`}>{p.count}</span>}
    </To>
  )

  return (
    <V6Ctx.Provider value={api}>
      <div ref={root} dir={dir} className="v6">
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden dangerouslySetInnerHTML={{ __html: V6_SPRITE }} />

        <aside className="side" aria-label="القائمة">
          <To to={home} className="logo" aria-label="بينون، الرئيسية">{logo}</To>
          {site && (
            <div style={{ marginTop: 14 }}>
              <button className="sw press" aria-haspopup="true" aria-expanded="false" aria-label={'الموقع الحالي: ' + site.name} onClick={(e) => siteMenu(e.currentTarget)}>{SWEDGE(site, true)}</button>
            </div>
          )}
          <div className="side-scroll">
            <nav className="nav" ref={navRef} aria-label="الصفحات" data-tour="nav">
              <span className="ind" aria-hidden />
              <div className="nav-label">مساحة العمل</div>
              {work.map(navRow)}
              <div className="nav-label">الحساب</div>
              {acct.map(navRow)}
            </nav>
          </div>
          <div className="side-foot">
            <To to={newSite} className="btn k block press" data-tour="new-site"><Ic n="plus" />موقع جديد</To>
            <a className="back" href={BACK}>← العودة إلى موقع بينون</a>
          </div>
        </aside>

        <div className="main">
          <div className="wrap">
            <header className={`top${scrolled ? ' scrolled' : ''}`}>
              <To to={home} className="logo" aria-label="بينون، الرئيسية">{logo}</To>
              {site && (
                <button className="hsw press" aria-haspopup="true" aria-expanded="false" aria-label={'الموقع الحالي: ' + site.name} data-tour="new-site" onClick={(e) => siteMenu(e.currentTarget)}>{SWEDGE(site, false)}</button>
              )}
              <span className="ttl" aria-hidden>{title}</span>
              <div className="tools">
                <button className="ask" aria-label="ابحث (⌘K)" data-tour="search" onClick={() => { closePop(true); setPalOn(true) }}>
                  <Ic n="search" /><span>ابحث أو اطلب أي شيء</span><kbd>⌘K</kbd>
                </button>
                <button className="icon-btn press" id="themeBtn" data-tour="theme" aria-label={dark ? 'الوضع الفاتح' : 'الوضع الليلي'} onClick={toggle}>
                  <Ic n={dark ? 'sun' : 'moon'} />
                </button>
                {tools}
              </div>
            </header>
            <main>
              <section key={pageKey} className={`page on in${legacy ? ' legacy' : ''}`} aria-label={title}>{children}</section>
            </main>
          </div>
        </div>

        <nav className="dock" ref={dockRef} aria-label="التنقل" data-tour="nav">
          <span className="ind" aria-hidden />
          {DOCK.map((k) => {
            const p = pages.find((x) => x.key === k)
            if (!p) return null
            return (
              <To key={k} to={p} aria-current={p.active ? 'page' : undefined} data-tour={p.tour}>
                <Ic n={p.icon} /><span>{p.label}</span>
                {k === 'bookings' && !!p.count && <span className="count num">{p.count}</span>}
              </To>
            )
          })}
          <button
            type="button" aria-haspopup="dialog" data-tour="more"
            aria-current={pages.some((p) => p.active && !(DOCK as readonly string[]).includes(p.key)) ? 'page' : undefined}
            onClick={() => setMoreOpen(true)}
          >
            <Ic n="more" /><span>المزيد</span>
          </button>
        </nav>

        <div className={`scrim${sheetOn || palOn ? ' on' : ''}`} onClick={() => { setPalOn(false); closeSheet() }} />
        <div
          ref={sheetEl} className={`sheet${sheetOn ? ' on' : ''}${sheet?.wide ? ' wide' : ''}`}
          role="dialog" aria-modal="true" aria-labelledby="shTitle"
          {...(sheetOn ? {} : { inert: '' as unknown as boolean })}
        >
          <div className="grab" {...dragProps}><i /></div>
          <div className="sh-head" {...dragProps}>
            <h2 id="shTitle">{sheet?.title}</h2>
            <button className="icon-btn press" data-close aria-label="إغلاق" onClick={closeSheet}><Ic n="x" /></button>
          </div>
          <div className="sh-body">{sheet?.body}</div>
          <div className="sh-foot" hidden={!sheet?.foot}>{sheet?.foot}</div>
        </div>

        <div ref={popEl} className={`pop${pop ? ' on' : ''}`} role="dialog" style={pop?.width ? { width: `min(${pop.width}px, calc(100vw - 24px))` } : undefined}>
          {pop?.body}
        </div>

        <Palette
          on={palOn} close={() => setPalOn(false)} pages={pages} go={go}
          newSite={newSite} dark={dark} toggleTheme={toggle}
          copyLink={site?.live && site.host ? () => {
            try { navigator.clipboard.writeText('https://' + site.host) } catch {}
            toast('تم نسخ رابط ' + site.name)
          } : undefined}
        />

        <div className={`toast${tstOn ? ' on' : ''}`} role="status" aria-live="polite">
          {tst && (
            <Fragment key={tst.n}>
              {tst.o.ok !== false && <span className="ok-i"><Ic n="check" /></span>}
              <span className="msg">{tst.msg}</span>
              {tst.o.undo && <button type="button" onClick={() => { tst.o.undo!(); setTstOn(false); setTimeout(() => toast('تم التراجع'), 260) }}>تراجع</button>}
            </Fragment>
          )}
        </div>
      </div>
    </V6Ctx.Provider>
  )
}

/* ---- help: WhatsApp, the mailbox, and a box for a problem ----------------- */
const SUPPORT_WA = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || ''

function HelpBody({ email }: { email?: string }) {
  return (
    <>
      <div className="rows">
        {SUPPORT_WA && (
          <a className="r" href={`https://wa.me/${SUPPORT_WA.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <span className="tile ok"><Ic n="whatsapp" /></span><span className="tx"><b>راسلنا على واتساب</b><span>نرد عادة خلال ساعة</span></span><Ic n="chev" className="chev" />
          </a>
        )}
        <a className="r" href="mailto:team@beynoun.com">
          <span className="tile"><Ic n="mail" /></span><span className="tx"><b>team@beynoun.com</b><span>للأسئلة الطويلة والفواتير</span></span><Ic n="chev" className="chev" />
        </a>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor="probIn">أبلغ عن مشكلة</label>
        <textarea className="inp" id="probIn" placeholder="ماذا حدث؟ وفي أي صفحة؟" maxLength={2000} data-email={email || ''} />
      </div>
    </>
  )
}

function HelpFoot({ onSend, email, toast, done }: { onSend?: (m: string) => Promise<void>; email?: string; toast: (m: string, o?: ToastOpts) => void; done: () => void }) {
  const [busy, setBusy] = useState(false)
  async function send() {
    const box = document.getElementById('probIn') as HTMLTextAreaElement | null
    const v = box?.value.trim() || ''
    if (!v) {
      const f = box?.closest('.field')
      f?.classList.add('err')
      box?.focus()
      if (!reduceMotion()) box?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 420 })
      box?.addEventListener('input', () => f?.classList.remove('err'), { once: true })
      return
    }
    const message = `[من لوحة التحكم · ${window.location.pathname}]\n\n${v}`
    setBusy(true)
    try {
      if (onSend) await onSend(message)
      else {
        const r = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || '', topic: 'support', message }),
        })
        if (!r.ok) throw new Error('send')
      }
      if (box) box.value = ''
      done()
      toast('وصلتنا رسالتك، شكرًا لك')
    } catch {
      toast('لم تُرسل. تأكد من اتصالك وحاول مرة أخرى.', { ok: false })
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <button className="btn press" data-close onClick={done}>إلغاء</button>
      <button className="btn k press" disabled={busy} onClick={send}>{busy ? 'جارٍ الإرسال…' : 'أرسل'}</button>
    </>
  )
}

/* ---- search / command palette ----------------------------------------------- */
const norm = (s: string) => s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase()

type PalItem = { t: string; k?: string; i: IconName; h: string; run: () => void }

function Palette({
  on, close, pages, go, newSite, dark, toggleTheme, copyLink,
}: {
  on: boolean; close: () => void; pages: FramePage[]; go: (to: string) => void
  newSite: Target; dark: boolean; toggleTheme: () => void; copyLink?: () => void
}) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const back = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (on) {
      back.current = document.activeElement as HTMLElement | null
      setQ(''); setSel(0)
      const t = setTimeout(() => input.current?.focus(), 20)
      return () => clearTimeout(t)
    }
    if (back.current?.isConnected) back.current.focus({ preventScroll: true })
  }, [on])

  const nav = (to: string) => () => go(to)
  const ACTIONS: (PalItem & { go?: boolean })[] = [
    { t: 'حجز جديد', k: 'حجز اضافة طاولة موعد', i: 'plus', h: 'اذهب', run: nav('bookings') },
    { t: 'ارفع صورة إلى المعرض', k: 'صور صورة رفع معرض', i: 'upload', h: 'اذهب', run: nav('gallery') },
    { t: 'أضف نطاقًا', k: 'دومين نطاق رابط عنوان', i: 'globe', h: 'اذهب', run: nav('domains') },
    ...(copyLink ? [{ t: 'انسخ رابط موقعي', k: 'رابط مشاركة نسخ شارك', i: 'copy' as IconName, h: 'نفّذ', run: copyLink }] : []),
    { t: 'أضف تقييمًا', k: 'تقييم مراجعة نجوم', i: 'star', h: 'اذهب', run: nav('reviews') },
    { t: 'عدّل ظهوري في جوجل', k: 'جوجل سيو عنوان وصف بحث', i: 'g', h: 'اذهب', run: nav('seo') },
    { t: 'أرقام بحث جوجل', k: 'جوجل ظهور نقرات كلمات', i: 'g', h: 'اذهب', run: nav('analytics:search') },
    { t: 'من يزور موقعي الآن؟', k: 'مباشر الان زوار', i: 'pulse', h: 'اذهب', run: nav('analytics:live') },
    { t: dark ? 'بدّل إلى الوضع الفاتح' : 'بدّل الوضع الليلي', k: 'ليل داكن فاتح ثيم مظهر', i: 'moon', h: 'نفّذ', run: toggleTheme },
    { t: 'موقع جديد', k: 'انشاء موقع جديد قالب', i: 'sites', h: 'نفّذ', run: () => { if (newSite.onSelect) newSite.onSelect(); else if (newSite.href) window.location.href = newSite.href } },
  ]
  const nq = norm(q.trim())
  const acts = ACTIONS.filter((a) => !nq || norm(a.t + ' ' + (a.k || '')).includes(nq))
  const pgs: PalItem[] = pages.filter((p) => !nq || norm(p.label + ' ' + (p.keywords || '')).includes(nq))
    .map((p) => ({ t: p.label, i: p.icon, h: 'صفحة', run: nav(p.key) }))
  const items = [...acts, ...pgs]
  const cur = Math.min(sel, Math.max(0, items.length - 1))

  useEffect(() => { list.current?.querySelector(`#po${cur}`)?.scrollIntoView({ block: 'nearest' }) }, [cur])

  const run = (a?: PalItem) => { close(); a?.run() }
  let k = -1
  const li = (a: PalItem) => {
    k++
    const n = k
    return (
      <li key={'p' + n}>
        <button className="pi" role="option" id={`po${n}`} aria-selected={n === cur} onClick={() => run(items[n])}>
          <span className="tile"><Ic n={a.i} /></span><span className="tx"><b>{a.t}</b></span><span className="end">{a.h}</span>
        </button>
      </li>
    )
  }

  return (
    <div className={`pal${on ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label="ابحث أو اطلب" {...(on ? {} : { inert: '' as unknown as boolean })}>
      <div className="in-row">
        <Ic n="search" />
        <input
          ref={input} value={q} placeholder="اكتب ما تريد… مثل: حجز، نطاق، صور" autoComplete="off"
          aria-controls="palList" aria-activedescendant={'po' + cur}
          onChange={(e) => { setQ(e.target.value); setSel(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { setSel(Math.min(cur + 1, items.length - 1)); e.preventDefault() }
            else if (e.key === 'ArrowUp') { setSel(Math.max(cur - 1, 0)); e.preventDefault() }
            else if (e.key === 'Enter') { e.preventDefault(); run(items[cur]) }
          }}
        />
      </div>
      <ul ref={list} id="palList" role="listbox">
        {items.length === 0 && <li className="empty"><b>لا يوجد شيء بهذا الاسم</b><span>جرّب كلمة أخرى</span></li>}
        {acts.length > 0 && <li className="grp">إجراءات</li>}
        {acts.map(li)}
        {pgs.length > 0 && <li className="grp">الصفحات</li>}
        {pgs.map(li)}
      </ul>
    </div>
  )
}
