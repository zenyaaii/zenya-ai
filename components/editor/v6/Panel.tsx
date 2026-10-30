'use client'

/**
 * The panel (panel.js in the editor sample): one column of views that push
 * and pop like a phone app — the three tabs (المحتوى · التصميم · الموقع) →
 * a section → an item of its list → an item inside that. The top of the
 * stack is also what is selected on the site. On a phone the same column is
 * the sheet that rises over the dock.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { EditorConfig, EditorPanel } from '@/utils/theme-editor-types'
import { Ic, Seg, MOD, fineMouse, reduceMotion } from './ui'
import { useEd, type View } from './ctx'
import { Fields, ItemFields, listDef } from './Fields'
import {
  allTexts, colorsOf, contrast, cut, gp, hex, isGlobal, itemTitle, norm, notes, panelPage, plural, rgb, alphaOf, vibeAr,
  type Check, type Hist,
} from './model'

export type Tab = 'content' | 'design' | 'site'
export type FontCard = { id: string; name: string; sub: string; h: string; b: string; hw: number; tag?: string; adj?: string }

export type PanelApi = {
  stack: View[]
  nav: { n: number; anim: string | null }
  tab: Tab
  setTab: (t: Tab) => void
  query: string
  setQuery: (q: string) => void
  page: string
  goPage: (id: string) => void
  pop: () => void
  closeSheet: () => void
  dupItem: () => void
  delItem: () => void
  stepItem: (dir: 1 | -1) => void
  hist: { list: Hist[]; i: number }
  jumpTo: (i: number) => void
  fix: (c: Check) => void
  setPreset: (id: string) => void
  setColor: (k: string, v: string, fromPicker: boolean) => void
  resetColors: () => void
  fonts: FontCard[]
  setFont: (id: string) => void
  loadFontSamples: () => void
  setStyle: (panel: string, k: 'scale' | 'align', v: string) => void
  copyUrl: () => void
  siteUrl: string | null
  brandName: string
}

const TAB_T: Record<Tab, string> = { content: 'أقسام الصفحة', design: 'الألوان والخط', site: 'إعدادات الموقع' }

/** A panel's icon: the sample's sprite when the config names one, else its lucide icon. */
export function PIcon({ p, fallback = 'layers' }: { p?: Pick<EditorPanel, 'ic' | 'icon'> | null; fallback?: string }) {
  if (p?.ic) return <Ic n={p.ic} />
  const L = p?.icon
  if (L) return <L className="i" strokeWidth={1.9} aria-hidden />
  return <Ic n={fallback} />
}

export function panelById(c: EditorConfig, id: string) {
  return [...c.panels, ...c.globalPanels].find((p) => p.id === id) || null
}

export default function Panel({ api, sheet, panelRef }: { api: PanelApi; sheet: string; panelRef: React.RefObject<HTMLElement> }) {
  const top = api.stack[api.stack.length - 1]
  const [pvs, setPvs] = useState<{ k: number; view: View; tab: Tab; cls: string }[]>(() => [{ k: 0, view: top, tab: api.tab, cls: '' }])
  const lastNav = useRef(api.nav.n)

  // A new top of the stack slides in; the old one slides out the other way.
  useLayoutEffect(() => {
    if (api.nav.n === lastNav.current) return
    lastNav.current = api.nav.n
    const anim = api.nav.anim
    const k = api.nav.n
    if (anim && !reduceMotion()) {
      setPvs((old) => [...old.filter((o) => !o.cls.startsWith('out-')).map((o) => ({ ...o, cls: 'out-' + anim })), { k, view: top, tab: api.tab, cls: 'in-' + anim }])
      const a = window.setTimeout(() => setPvs((o) => o.filter((x) => !x.cls.startsWith('out-'))), 360)
      const b = window.setTimeout(() => setPvs((o) => o.map((x) => (x.k === k ? { ...x, cls: '' } : x))), 520)
      return () => { window.clearTimeout(a); window.clearTimeout(b) }
    }
    setPvs([{ k, view: top, tab: api.tab, cls: '' }])
  }, [api.nav, top, api.tab])

  const live = pvs[pvs.length - 1]
  return (
    <aside className={'panel' + (sheet !== 'closed' ? ' ' + sheet : '')} id="panel" aria-label="لوحة التعديل" ref={panelRef as React.RefObject<HTMLElement>}>
      <div className="p-grab" id="pgrab" aria-hidden="true"><i /></div>
      <div className="p-head" id="phead"><Head api={api} view={top} /></div>
      <div className="p-body" id="pbody">
        {pvs.map((x) => (
          <PV key={x.k} view={x === live ? top : x.view} cls={x.cls} api={api} tab={x === live ? api.tab : x.tab} />
        ))}
      </div>
      <Foot api={api} view={top} />
    </aside>
  )
}

function PV({ view, cls, api, tab }: { view: View; cls: string; api: PanelApi; tab: Tab }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = view.scroll || 0 }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  // The stack remembers where each view was scrolled, so «رجوع» lands there.
  const onScroll = () => { if (ref.current && !cls.startsWith('out-')) view.scroll = ref.current.scrollTop }
  return (
    <div ref={ref} className={'pv' + (cls ? ' ' + cls : '')} tabIndex={-1} onScroll={onScroll}>
      <Body view={view} api={api} tab={tab} />
    </div>
  )
}

/* ── head ──────────────────────────────────────────────────────────────── */
function Head({ api, view }: { api: PanelApi; view: View }) {
  const ed = useEd()
  const phone = <button type="button" className="ib x" aria-label="إغلاق" onClick={api.closeSheet}><Ic n="x" /></button>
  if (view.v === 'root') {
    return (
      <>
        <div className="p-tabs">
          <Seg<Tab> items={[['content', 'المحتوى'], ['design', 'التصميم'], ['site', 'الموقع']]} value={api.tab} cls="fill" label="أقسام اللوحة" attrs={{ id: 'tabs' }} onChange={api.setTab} />
        </div>
        <div className="ttl ph-only"><b>{TAB_T[api.tab]}</b></div>
        {phone}
      </>
    )
  }
  let small = '', title = ''
  let acts: ReactNode = null
  if (view.v === 'sec') {
    const p = panelById(ed.config, view.id)
    const g = isGlobal(ed.config, view.id)
    const pg = p ? panelPage(p) : null
    small = g ? 'في كل الصفحات' : pg ? `صفحة ${ed.config.pages?.find((x) => x.id === pg)?.label || ''}` : 'الصفحة الرئيسية'
    title = p?.label || ''
    if (p?.hideable) {
      const off = ed.hidden(view.id)
      acts = (
        <button type="button" className="ib" aria-pressed={off} aria-label={off ? 'إظهار القسم' : 'إخفاء القسم'} title={off ? 'إظهار القسم' : 'إخفاء القسم عن الزوار'} onClick={() => ed.toggleHidden(view.id)}>
          <Ic n={off ? 'eyeoff' : 'eye'} />
        </button>
      )
    }
  } else if (view.v === 'item') {
    const d = listDef(ed.config, view.list)
    const arr = gp(ed.doc.content, view.list) || []
    small = d ? d.label : ''
    title = d ? itemTitle(d, arr[view.i], view.i) : ''
    acts = (
      <>
        <button type="button" className="ib" aria-label="نسخة مكررة" title="نسخة مكررة" onClick={api.dupItem}><Ic n="dup" /></button>
        <button type="button" className="ib" aria-label="حذف" title="حذف" onClick={api.delItem}><Ic n="trash" /></button>
      </>
    )
  } else if (view.v === 'check') { small = 'قبل النشر'; title = 'فحص الموقع' }
  else if (view.v === 'history') { small = 'هذه الجلسة'; title = 'سجل التعديلات' }
  return (
    <>
      <button type="button" className="ib back" aria-label="رجوع" onClick={api.pop}><Ic n="next" /></button>
      <div className="ttl"><small className="trunc">{small}</small><b className="trunc" id="pTitle">{title}</b></div>
      <div className="acts">{acts}</div>
      {phone}
    </>
  )
}

function Foot({ api, view }: { api: PanelApi; view: View }) {
  const ed = useEd()
  if (view.v !== 'item') return <div className="p-foot" id="pfoot" hidden />
  const n = (gp(ed.doc.content, view.list) || []).length
  const d = listDef(ed.config, view.list)
  const nm = d ? (d.type === 'array' ? d.itemLabel : d.label) : ''
  return (
    <div className="p-foot" id="pfoot">
      <button type="button" className="btn sm line" disabled={view.i <= 0} onClick={() => api.stepItem(-1)}><Ic n="next" />السابق</button>
      <span className="pos">{nm} {view.i + 1} من {n}</span>
      <button type="button" className="btn sm line" disabled={view.i >= n - 1} onClick={() => api.stepItem(1)}>التالي<Ic n="prev" /></button>
    </div>
  )
}

/* ── body ──────────────────────────────────────────────────────────────── */
function Body({ view, api, tab }: { view: View; api: PanelApi; tab: Tab }) {
  if (view.v === 'root') return tab === 'content' ? <RootContent api={api} /> : tab === 'design' ? <RootDesign api={api} /> : <RootSite api={api} />
  if (view.v === 'sec') return <SecView id={view.id} api={api} />
  if (view.v === 'item') return <ItemFields list={view.list} i={view.i} />
  if (view.v === 'check') return <CheckView api={api} />
  return <HistoryView api={api} />
}

function issuesFor(checks: Check[], id: string) { return checks.filter((x) => x.lvl === 'warn' && x.panel === id).length }

function SecRow({ p }: { p: EditorPanel }) {
  const ed = useEd()
  const off = ed.hidden(p.id)
  const emp = p.empty ? p.empty(ed.doc.content) : false
  const n = issuesFor(ed.checks, p.id)
  const sum = (p.summary ? p.summary(ed.doc.content) : '') || p.desc || ''
  return (
    <div className={'srow' + (off ? ' off' : '')}>
      <button type="button" className="go" onClick={() => ed.openAt(p.id, null, { anim: 'f', scroll: true, focus: false })}>
        <span className="ico"><PIcon p={p} /></span>
        <span className="tx">
          <b><span className="trunc">{p.label}</span>{off ? <span className="tag">مخفي</span> : emp ? <span className="tag">فارغ</span> : null}{n ? <span className="tag w">{notes(n)}</span> : null}</b>
          {sum ? <span>{sum}</span> : null}
        </span>
      </button>
      {p.hideable && (
        <button type="button" className="eye" aria-pressed={off} aria-label={`${off ? 'إظهار' : 'إخفاء'} «${p.label}»`} title={off ? 'إظهار القسم' : 'إخفاء القسم عن الزوار'} onClick={() => ed.toggleHidden(p.id)}>
          <Ic n={off ? 'eyeoff' : 'eye'} />
        </button>
      )}
      <Ic n="next" c="chev" />
    </div>
  )
}

function RootContent({ api }: { api: PanelApi }) {
  const ed = useEd()
  const c = ed.config
  const q = api.query
  const pages = c.pages || []
  const pg = pages.find((p) => p.id === api.page) || pages[0]
  const secs = c.panels.filter((p) => {
    const v = p.pages && p.pages.length ? p.pages : p.page ? [p.page] : null
    return !pg || v === null || v.includes(pg.id)
  })
  const pinned = c.globalPanels.filter((p) => (c.pinned ? c.pinned.includes(p.id) : p === c.globalPanels[0]))
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <label className="srch" htmlFor="q">
        <Ic n="search" />
        <input ref={inputRef} id="q" type="search" placeholder="ابحث في نصوص موقعك" value={q} autoComplete="off" enterKeyHint="search"
          onChange={(e) => api.setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { (document.querySelector('#qres [data-hit]') as HTMLButtonElement | null)?.click() }
            if (e.key === 'Escape' && q) { e.stopPropagation(); api.setQuery('') }
          }} />
        <button type="button" className="clr" aria-label="مسح البحث" hidden={!q} onClick={() => { api.setQuery(''); inputRef.current?.focus() }}><Ic n="x" /></button>
        {fineMouse() && !q ? <kbd>{MOD}K</kbd> : null}
      </label>
      <div id="qres" hidden={!q.trim()}>{q.trim() ? <Search q={q} /> : null}</div>
      <div id="qmain" hidden={!!q.trim()}>
        {pages.length > 0 && (
          <div className="pages" role="list" aria-label="صفحات موقعك">
            {pages.map((p) => (
              <button key={p.id} type="button" role="listitem" aria-current={p.id === api.page ? 'page' : undefined} onClick={() => api.goPage(p.id)}>
                <PIcon p={p} />{p.label}
              </button>
            ))}
          </div>
        )}
        <div className="gh">{pg ? `أقسام صفحة «${pg.label}» بالترتيب` : 'أقسام موقعك بالترتيب'}<span className="n">{secs.length}</span></div>
        <div className="rows">{secs.map((p) => <SecRow key={p.id} p={p} />)}</div>
        {pinned.length > 0 && (
          <>
            <div className="gh">في كل الصفحات</div>
            <div className="rows pinned">{pinned.map((p) => <SecRow key={p.id} p={p} />)}</div>
          </>
        )}
      </div>
    </>
  )
}

function Search({ q }: { q: string }) {
  const ed = useEd()
  const nq = norm(q.trim())
  const hits = allTexts(ed.config, ed.doc.content).filter((f) => norm(f.val).includes(nq) || norm(f.label).includes(nq)).slice(0, 40)
  if (!hits.length) return <div className="empty-st"><Ic n="search" /><span>لا نتائج لـ «{q}».</span></div>
  const mark = (t: string) => {
    const n = norm(t), i = n.indexOf(nq)
    if (i < 0) return <>{cut(t, 70)}</>
    const a = Math.max(0, i - 20)
    return <>{a ? '…' : ''}{t.slice(a, i)}<mark>{t.slice(i, i + nq.length)}</mark>{cut(t.slice(i + nq.length), 50)}</>
  }
  return (
    <>
      <div className="gh" style={{ marginTop: 14 }}>{plural(hits.length, 'نتيجة واحدة', 'نتيجتان', 'نتائج', 'نتيجة')}</div>
      <div className="res">
        {hits.map((h) => {
          const p = panelById(ed.config, h.panel)
          const g = isGlobal(ed.config, h.panel)
          const pid = p ? panelPage(p) : null
          const pg = g ? 'كل الصفحات' : ed.config.pages?.find((x) => x.id === pid)?.label || 'الرئيسية'
          return (
            <button key={h.path} type="button" data-hit={h.path} onClick={() => ed.openAt(h.panel, h.path, { anim: 'f', scroll: true, focus: true })}>
              <small>{pg} › {h.ctx.join(' › ')}</small>
              <b>{h.label}</b>
              <span>{h.val ? mark(h.val) : <i className="mut">فارغ</i>}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function RootDesign({ api }: { api: PanelApi }) {
  const ed = useEd()
  const c = ed.config
  const d = ed.doc
  const col = colorsOf(c, d)
  const custom = Object.keys(d.colorOverrides).length > 0
  const cur = c.colorPresets.find((p) => p.id === d.presetId) || c.colorPresets[0]
  useEffect(() => { api.loadFontSamples() }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  const lines: [string, string | undefined, string | undefined, number][] = [
    ['النص على الخلفية', col.text, col.background, 4.5],
    ['النص الثانوي على الخلفية', col.muted, col.background, 3],
    ['اللون المميز على الخلفية', col.accent, col.background, 3],
  ]
  return (
    <>
      <div className="gh">ألوان جاهزة</div>
      <div className="presets">
        {c.colorPresets.map((p) => {
          const pc = p.colors
          return (
            <button key={p.id} type="button" className="pc" aria-pressed={p.id === d.presetId} onClick={() => api.setPreset(p.id)}>
              <span className="mini" style={{ background: pc.background }}>
                <span className="h" style={{ background: pc.text }} />
                <span className="l" style={{ background: pc.muted }} />
                <span className="r">
                  <span className="b" style={{ background: pc.accent }} />
                  <span className="s" style={{ background: pc.surface || pc.background, boxShadow: `inset 0 0 0 1px ${pc.border || 'rgba(0,0,0,.12)'}` }} />
                </span>
              </span>
              <span className="nm"><b>{p.name}</b><span>{p.id === d.presetId && custom ? 'معدّلة' : vibeAr(p.vibe)}</span></span>
              <span className="ck"><Ic n="check" /></span>
            </button>
          )
        })}
      </div>
      <div className="gh" id="custGh">
        خصّص الألوان
        {custom && <button type="button" className="btn sm line" onClick={api.resetColors}><Ic n="reset" />أعد ألوان «{cur?.name}»</button>}
      </div>
      <div id="toks">
        {c.colorTokens.map(({ key, label }) => {
          const v = col[key] || '#000000'
          const isB = key === 'border'
          return (
            <div key={key} className="tok" data-tok={key}>
              <label className="sw" style={{ background: v }} title="اختر لونًا">
                <input type="color" value={hex(rgb(v))} aria-label={label}
                  onChange={(e) => {
                    let x = e.target.value
                    if (isB) { const [r, g, b] = rgb(x); x = `rgba(${r},${g},${b},${alphaOf(v)})` }
                    api.setColor(key, x, true)
                  }} />
              </label>
              <span className="tx"><b>{label}</b>{c.colorHints?.[key] ? <span>{c.colorHints[key]}</span> : null}</span>
              {isB
                ? <input type="range" min={0} max={60} step={1} value={Math.round(alphaOf(v) * 100)} aria-label="قوة الخطوط الفاصلة"
                    onChange={(e) => { const [r, g, b] = rgb(v); api.setColor('border', `rgba(${r},${g},${b},${(+e.target.value / 100).toFixed(2)})`, true) }} />
                : <HexInput k={key} v={v} label={label} api={api} />}
            </div>
          )
        })}
      </div>
      <div className="contrast" id="contrast">
        {lines.filter(([, f, b]) => f && b).map(([l, f, b, min]) => {
          const r = contrast(f!, b!)
          const cls = r >= min ? 'ok' : r >= min * 0.75 ? 'w' : 'b'
          const word = r >= min * 1.5 ? 'ممتاز' : r >= min ? 'جيد' : r >= min * 0.75 ? 'ضعيف' : 'صعب القراءة'
          return (
            <div key={l} className="cline">
              <span className="dot" style={{ background: b, color: f }}>ب</span>
              <span>{l}</span>
              <span className={'r ' + cls}>{word} · {r.toFixed(1)}</span>
            </div>
          )
        })}
      </div>
      <div className="gh">خط موقعك</div>
      <div className="note"><Ic n="info" /><span>كل هذه الخطوط مجانية ومسموح استخدامها في موقعك. الخط يتغيّر في الموقع فورًا لتراه.</span></div>
      <div style={{ height: 10 }} />
      <div className="fonts">
        {api.fonts.map((f) => (
          <button key={f.id} type="button" className="fc" aria-pressed={f.id === d.typographyPreset} onClick={() => api.setFont(f.id)}>
            {/* The template fonts are Latin: an Arabic name would show every card in the same fallback. */}
            <span className="smp-h" style={{ fontFamily: f.h, fontWeight: f.hw, fontSizeAdjust: (f.adj || 'none') as any }}>{!f.id || /[A-Za-z]/.test(api.brandName) ? api.brandName || 'موقعك' : f.name}</span>
            <span className="smp-b" style={{ fontFamily: f.b }}>صفحتك كما يراها زوارك، بخط يناسبك.</span>
            <span className="meta"><b>{f.name}</b><span>{f.sub}</span>{f.tag ? <span className="tag a">{f.tag}</span> : null}</span>
            <span className="ck"><Ic n="check" /></span>
          </button>
        ))}
      </div>
    </>
  )
}

function HexInput({ k, v, label, api }: { k: string; v: string; label: string; api: PanelApi }) {
  const [text, setText] = useState<string | null>(null)
  return (
    <input className="hex" value={text ?? hex(rgb(v))} maxLength={7} spellCheck={false} aria-label={`رمز ${label}`}
      onChange={(e) => {
        setText(e.target.value)
        const x = e.target.value.trim()
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(x)) api.setColor(k, x.toLowerCase(), false)
      }}
      onBlur={() => setText(null)} />
  )
}

function RootSite({ api }: { api: PanelApi }) {
  const ed = useEd()
  return (
    <>
      <div className="rows">
        {ed.config.globalPanels.map((p) => {
          const n = issuesFor(ed.checks, p.id)
          const sum = (p.summary ? p.summary(ed.doc.content) : '') || p.desc || ''
          return (
            <button key={p.id} type="button" className="nrow" onClick={() => ed.openAt(p.id, null, { anim: 'f', scroll: true, focus: false })}>
              <span className="ico"><PIcon p={p} /></span>
              <span className="tx"><b>{p.label}{n ? <> <span className="tag w">{notes(n)}</span></> : null}</b>{sum ? <span>{sum}</span> : null}</span>
              <Ic n="next" c="chev" />
            </button>
          )
        })}
      </div>
      <div className="gh">رابط موقعك</div>
      {api.siteUrl ? (
        <div className="url-row"><span>{api.siteUrl.replace(/^https?:\/\//, '')}</span><button type="button" className="btn sm" onClick={api.copyUrl}><Ic n="copy" />انسخ</button></div>
      ) : (
        <div className="note"><Ic n="info" /><span>لم يُنشر موقعك بعد. يصبح له رابط عند أول نشر.</span></div>
      )}
      <div style={{ height: 8 }} />
      <div className="hint">تربط نطاقك الخاص من صفحة «النطاقات» في لوحة التحكم. <button type="button" className="sug" style={{ marginInlineStart: 0, display: 'inline-flex' }} onClick={() => ed.dash('domains', 'النطاقات')}>افتحها<Ic n="open" /></button></div>
    </>
  )
}

function SecView({ id, api }: { id: string; api: PanelApi }) {
  const ed = useEd()
  const p = panelById(ed.config, id)
  if (!p) return null
  const st = ed.doc.sectionStyles[id] || {}
  const g = isGlobal(ed.config, id)
  return (
    <>
      {p.hideable && ed.hidden(id) && (
        <>
          <div className="note warn"><Ic n="eyeoff" /><span>هذا القسم مخفي عن زوارك. <button type="button" onClick={() => ed.toggleHidden(id)}>إظهاره</button></span></div>
          <div style={{ height: 14 }} />
        </>
      )}
      <Fields fields={p.fields} base="" />
      {!g && (
        <>
          <div className="gh">شكل القسم</div>
          <div className="stack">
            <div className="fld">
              <div className="fl-top"><span className="lab">حجم النص</span></div>
              <Seg items={[['0.9', 'أصغر'], ['1', 'عادي'], ['1.12', 'أكبر']]} value={scaleKey(st.text_scale)} cls="fill" onChange={(v) => api.setStyle(id, 'scale', v)} />
            </div>
            <div className="fld">
              <div className="fl-top"><span className="lab">محاذاة النص</span></div>
              <Seg items={[['', 'كما في القالب'], ['right', 'يمين'], ['center', 'وسط']]} value={st.text_align === 'left' ? '' : st.text_align || ''} cls="fill" onChange={(v) => api.setStyle(id, 'align', v)} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
/** A saved size from the older editor (0.85, 1.15, 1.3) reads as the nearest of the three. */
function scaleKey(s?: number) {
  if (!s || Math.abs(s - 1) < 0.01) return '1'
  return s < 1 ? '0.9' : '1.12'
}

function CheckView({ api }: { api: PanelApi }) {
  const ed = useEd()
  const w = ed.checks.filter((x) => x.lvl === 'warn'), t = ed.checks.filter((x) => x.lvl === 'tip')
  const C2 = 2 * Math.PI * 24, done = Math.max(0.08, 1 - Math.min(1, w.length / 6))
  const item = (x: Check, k: number) => (
    <div key={k} className={'issue ' + x.lvl}>
      <span className="ic"><Ic n={x.lvl === 'warn' ? 'alert' : 'info'} /></span>
      <span className="tx">
        <b>{x.t}</b>{x.d ? <span>{x.d}</span> : null}
        <button type="button" className="btn sm line" onClick={() => api.fix(x)}>{x.panel === '__colors' ? 'افتح الألوان' : 'أصلحه'}</button>
      </span>
    </div>
  )
  return (
    <>
      <div className="score">
        <svg className="ring2" viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="24" stroke="var(--card3)" />
          <circle cx="28" cy="28" r="24" stroke={w.length ? 'var(--warn)' : 'var(--ok)'} strokeDasharray={`${C2 * done} ${C2}`} strokeLinecap="round" transform="rotate(-90 28 28)" />
        </svg>
        <span className="tx">
          <b>{w.length ? `${w.length === 1 ? 'ملاحظة واحدة' : plural(w.length, '', 'ملاحظتان', 'ملاحظات', 'ملاحظة')} قبل النشر` : 'موقعك جاهز للنشر'}</b>
          <span>{w.length ? 'يمكنك النشر الآن، لكن إصلاحها يجعل موقعك أوضح لزوارك.' : 'لا شيء ناقص. يمكنك النشر متى شئت.'}</span>
        </span>
      </div>
      <div style={{ height: 14 }} />
      <div className="stack" style={{ gap: 8 }}>{w.map(item)}</div>
      {t.length ? <><div className="gh">اقتراحات</div><div className="stack" style={{ gap: 8 }}>{t.map(item)}</div></> : null}
    </>
  )
}

function HistoryView({ api }: { api: PanelApi }) {
  const now = Date.now()
  const rel = (t: number) => { const s = Math.round((now - t) / 1000); return s < 45 ? 'الآن' : s < 3600 ? `قبل ${Math.round(s / 60)} د` : `قبل ${Math.round(s / 3600)} س` }
  const { list, i: cur } = api.hist
  return (
    <>
      <div className="hint">اضغط أي خطوة لترجع إليها. لا يضيع شيء: يمكنك التقدم مرة أخرى.</div>
      <div style={{ height: 10 }} />
      <div className="hist">
        {list.map((h, i) => [h, i] as const).reverse().map(([h, i]) => (
          <button key={i} type="button" className={i === cur ? 'cur' : i > cur ? 'fut' : ''} onClick={() => api.jumpTo(i)}>
            <Ic n={i === 0 ? 'flag' : i === cur ? 'dot' : 'history'} />
            <span>{h.label}</span>
            <span className="t">{rel(h.t)}</span>
          </button>
        ))}
      </div>
    </>
  )
}
