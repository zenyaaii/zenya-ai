'use client'

/**
 * The site editor: the editor sample (v6) itself, around the customer's real
 * site. The markup and the stylesheet are the sample's (shell.html, app.css
 * → editor.css); this file is its app.js and core.js in React.
 *
 * WHAT IS REAL. The site in the middle is the template visitors get, drawn
 * live from the owner's content. Edits save as a DRAFT while the owner works
 * (PUT /api/themes/[id]/draft) and visitors see none of it until «انشر»
 * (POST, which merges the draft into content). A site that is not online yet
 * has no visitors to hide anything from, so its edits save straight to
 * content as they always did, and «انشر» points to the dashboard page that
 * puts it online. Pictures come from the owner's gallery and upload to it;
 * «اقترح صياغة» writes for the owner's own text (/api/ai/rewrite).
 *
 * With a `store` (the /demo/editor page) nothing is fetched: the draft and
 * the published copy live in memory, an upload stays in the browser, and
 * the rewording offer is not shown.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { dashFont } from '@/components/app/dash-font'
import { useDashTheme } from '@/components/app/frame/useDashTheme'
import { isUploadedImageUrl } from '@/lib/seo'
import { dashboardUrl, publicSiteHost, publicSiteUrl } from '@/lib/portal-urls'
import { TYPOGRAPHY_PRESETS, buildGoogleFontsUrl } from '@/utils/theme-editor-typography'
import {
  getPath, setPath, sectionStylesToCss, panelInView,
  type EditorConfig, type SectionStyles, type SectionStyle,
} from '@/utils/theme-editor-types'
import { EDITOR_SPRITE } from './sprite'
import { Ic, Seg, OverlayHost, useOverlay, isPhoneW, fineMouse, reduceMotion, MOD, SHIFT } from './ui'
import { EdCtx, type Ed, type SetOpts, type View } from './ctx'
import Panel, { PIcon, panelById, type FontCard, type PanelApi, type Tab } from './Panel'
import Stage, { type Device, type StageHandle } from './Stage'
import { listDef } from './Fields'
import {
  changes as diff, colorsOf, currencyOf, isGlobal, itemTitle, labelOf, panelPage, plural, resolve,
  runChecks, snap, type Check, type Doc, type Hist,
} from './model'
import './editor.css'
import './editor-frame.css'

export type PreviewProps = {
  content: any
  presetId: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  sectionStyles?: SectionStyles
  view?: string
  onViewChange?: (v: string) => void
  logo?: string
}

/** Where a surface that must not touch the database keeps the theme. */
export type EditorStore = {
  load: () => Promise<any>
  save: (nextContent: any) => Promise<void>
}

/** The /demo/editor page: what it says, and its other templates. */
export type EditorDemo = { note: string; types: { href: string; label: string; current: boolean }[] }

type SaveState = 'saved' | 'saving' | 'error'
type Sheet = 'closed' | 'half' | 'full'

const HINT_KEY = 'beynoun-ed-hint'
const THEME_KEY = 'beynoun-dash-theme'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o))

/** A tiny shared value, for a dialog whose body and foot read the same state. */
function mini<T>(v: T) {
  let s = v
  const ls = new Set<() => void>()
  return { get: () => s, set: (n: T) => { s = n; ls.forEach((f) => f()) }, sub: (f: () => void) => { ls.add(f); return () => { ls.delete(f) } } }
}
function useMini<T>(m: ReturnType<typeof mini<T>>) { return useSyncExternalStore(m.sub, m.get, m.get) }

function docOf(c: any, config: EditorConfig): Doc {
  return {
    content: c?.[config.contentKey],
    presetId: c?.style_preset || config.defaultPresetId,
    typographyPreset: c?.typography_preset || '',
    colorOverrides: (c?.color_overrides as Record<string, string>) || {},
    sectionStyles: (c?.section_styles as SectionStyles) || {},
  }
}
function pruneStyles(s: SectionStyles): SectionStyles {
  const out: SectionStyles = {}
  for (const [k, v] of Object.entries(s)) {
    const n: SectionStyle = {}
    if (typeof v.text_scale === 'number' && v.text_scale > 0 && v.text_scale !== 1) n.text_scale = v.text_scale
    if (v.text_align) n.text_align = v.text_align
    if (Object.keys(n).length) out[k] = n
  }
  return out
}
/** The editor's own keys of the wrapper content; null = remove it. */
function keysOf(d: Doc, config: EditorConfig): Record<string, any> {
  const st = pruneStyles(d.sectionStyles)
  return {
    [config.contentKey]: d.content,
    style_preset: d.presetId,
    typography_preset: d.typographyPreset || null,
    color_overrides: Object.keys(d.colorOverrides).length ? d.colorOverrides : null,
    section_styles: Object.keys(st).length ? st : null,
  }
}
function mergeKeys(full: any, keys: Record<string, any>) {
  const out = { ...(full || {}) }
  for (const [k, v] of Object.entries(keys)) { if (v === null) delete out[k]; else out[k] = v }
  return out
}

/** Every picture the content uses, for the picker when there is no gallery. */
function picturesIn(o: any, out = new Set<string>()): Set<string> {
  if (typeof o === 'string') { if (/^(https?:\/\/|data:image\/|\/)[^\s]+\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(o) || /^data:image\//.test(o) || /images\.unsplash\.com/.test(o)) out.add(o) }
  else if (Array.isArray(o)) o.forEach((x) => picturesIn(x, out))
  else if (o && typeof o === 'object') Object.values(o).forEach((x) => picturesIn(x, out))
  return out
}

function fileToData(file: File): Promise<string> {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('type'))
    const url = URL.createObjectURL(file), im = new Image()
    im.onload = () => {
      const k = Math.min(1, 1600 / Math.max(im.naturalWidth || 1, im.naturalHeight || 1)), c = document.createElement('canvas')
      c.width = Math.max(1, Math.round((im.naturalWidth || 800) * k)); c.height = Math.max(1, Math.round((im.naturalHeight || 600) * k))
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      try { res(c.toDataURL('image/jpeg', 0.85)) } catch (e) { rej(e) }
    }
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('load')) }
    im.src = url
  })
}

function brandOf(content: any, config: EditorConfig) {
  const raw = config.brandNamePath ? getPath(content, config.brandNamePath) : content?.brand?.name
  return typeof raw === 'string' ? raw.trim() : ''
}
function voiceOf(content: any): string[] {
  const out: string[] = []
  const push = (v: any) => { if (typeof v !== 'string') return; const t = v.replace(/\s+/g, ' ').trim(); if (t.length > 2 && t.length <= 180) out.push(t) }
  push(content?.brand?.tagline); push(content?.hero?.headline); push(content?.hero?.subheadline)
  for (const sec of Object.values(content || {})) {
    if (sec && typeof sec === 'object' && !Array.isArray(sec)) {
      const s = sec as any
      push(s.heading); push(s.subheading); push(s.description); push(s.tagline)
      if (Array.isArray(s.items)) for (const it of s.items.slice(0, 2)) { push(it?.title); push(it?.description); push(it?.quote) }
    }
  }
  return Array.from(new Set(out)).slice(0, 8)
}

export default function Editor(props: {
  themeId: string
  config: EditorConfig
  Preview: ComponentType<PreviewProps>
  backHref: string
  /** The «رجوع» button's target. Default: the dashboard's sites page. */
  exitHref?: string
  store?: EditorStore
  demo?: EditorDemo
}) {
  useDashTheme()
  return (
    <div className={'v6e ' + dashFont.variable} dir="rtl" lang="ar">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden dangerouslySetInnerHTML={{ __html: EDITOR_SPRITE }} />
      <OverlayHost>
        <Workbench {...props} />
      </OverlayHost>
    </div>
  )
}

function Workbench({ themeId, config, Preview, backHref, exitHref, store, demo }: Parameters<typeof Editor>[0]) {
  const router = useRouter()
  const ov = useOverlay()
  const offline = !!store
  const supabase = useMemo(() => (store ? null : createClient()), [store])

  /* ── state ── */
  const [error, setError] = useState<string | null>(null)
  const [doc, setDocS] = useState<Doc | null>(null)
  const docR = useRef<Doc | null>(null)
  const [pub, setPub] = useState<Doc | null>(null)
  const pubR = useRef<Doc | null>(null)
  const [online, setOnline] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const histR = useRef<{ list: Hist[]; i: number }>({ list: [], i: 0 })
  const [, setHv] = useState(0)
  const [checks, setChecks] = useState<Check[]>([])
  const [saveState, setSaveState] = useState<SaveState>('saved')

  const [stack, setStackS] = useState<View[]>([{ v: 'root' }])
  const stackR = useRef(stack)
  const [nav, setNav] = useState<{ n: number; anim: string | null }>({ n: 0, anim: null })
  const [tab, setTabS] = useState<Tab>('content')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState<string>(config.pages?.[0]?.id || 'home')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [device, setDeviceS] = useState<Device>('desk')
  const [phone, setPhone] = useState(false)
  const [sheet, setSheetS] = useState<Sheet>('closed')
  const sheetR = useRef<Sheet>('closed')
  const [hint, setHint] = useState<{ show: boolean; text: string }>({ show: false, text: '' })
  const [frozen, setFrozen] = useState<Doc | null>(null)
  const [siteKey, setSiteKey] = useState(0)

  const stageRef = useRef<StageHandle>(null)
  const panelRef = useRef<HTMLElement>(null)
  const pending = useRef<{ scroll?: string | null | true; focus?: { path: string; focus: boolean } } | null>(null)

  const applyDoc = (d: Doc) => { docR.current = d; setDocS(d) }
  const applyStack = (s: View[], anim: string | null) => {
    stackR.current = s
    setStackS(s)
    setNav((n) => ({ n: n.n + 1, anim }))
  }

  /* ── load ── */
  useEffect(() => {
    let off = false
    ;(async () => {
      let c: any, draft: any = null, isOnline = true, sl: string | null = null
      if (store) {
        c = await store.load()
      } else {
        const { data: { user } } = await supabase!.auth.getUser()
        if (off) return
        if (!user) { router.push(`/login?next=${backHref}/edit`); return }
        const r = await fetch(`/api/themes/${themeId}`)
        if (!r.ok) { setError(r.status === 404 ? 'لم نجد هذا الموقع.' : 'لا تملك صلاحية تعديل هذا الموقع.'); return }
        const j = await r.json()
        c = j?.theme?.content
        sl = j?.theme?.slug || null
        isOnline = !!j?.theme?.is_published && !!sl
        if (j?.theme && !('draft' in j.theme)) { noDrafts.current = true; draft = localDraft.get() }
        else draft = j?.theme?.draft || null
      }
      if (off) return
      if (!c?.[config.contentKey]) { setError(`هذا الموقع ليس من قالب «${config.themeName}».`); return }
      const p = docOf(c, config)
      const restored = isOnline && draft && draft[config.contentKey] ? docOf(mergeKeys(c, draft), config) : null
      const d = restored || p
      pubR.current = p; setPub(p)
      applyDoc(d)
      savedSnap.current = snap(d)
      histR.current = { list: [{ s: snap(d), doc: d, label: restored ? 'آخر ما حفظته' : 'بداية الجلسة', t: Date.now(), key: null }], i: 0 }
      setHv((v) => v + 1)
      setOnline(isOnline); setSlug(sl)
      setLogo(isUploadedImageUrl(c?.seo?.logo) ? c.seo.logo : undefined)
      setChecks(runChecks(config, d))
      if (restored && snap(restored) !== snap(p)) setTimeout(() => ov.toast('رجعنا إلى تعديلاتك غير المنشورة', { action: 'تجاهلها', run: () => discardRef.current() }), 400)
      if (demo) setTimeout(() => ov.toast(demo.note, { ok: false }), restored ? 3000 : 600)
    })()
    return () => { off = true }
  }, [themeId, config, store]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── saving: the draft, as the owner works ── */
  const savedSnap = useRef('')
  const saveT = useRef(0)
  /** No draft columns in the database yet: the draft is held in this browser
   *  and «انشر» writes content directly. */
  const noDrafts = useRef(false)
  const localDraft = useMemo(() => {
    const k = 'beynoun-ed-draft-' + themeId
    return {
      get: () => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } },
      set: (v: any) => { try { if (v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k) } catch {} },
    }
  }, [themeId])
  const chain = useRef<Promise<void>>(Promise.resolve())
  const persist = useCallback(async (d: Doc) => {
    if (offline) { await sleep(320); return }
    if (online) {
      const same = pubR.current && snap(d) === snap(pubR.current)
      const draft = same ? null : keysOf(d, config)
      if (!noDrafts.current) {
        const r = await fetch(`/api/themes/${themeId}/draft`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft }),
        })
        if (r.ok) return
        if (r.status !== 503) throw new Error('save ' + r.status)
        noDrafts.current = true
      }
      localDraft.set(draft)
      return
    }
    const g = await fetch(`/api/themes/${themeId}`)
    const full = (await g.json())?.theme?.content || {}
    const r = await fetch(`/api/themes/${themeId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: mergeKeys(full, keysOf(d, config)) }),
    })
    if (!r.ok) throw new Error('save ' + r.status)
  }, [offline, online, themeId, config, localDraft])
  const persistR = useRef(persist)
  persistR.current = persist

  const saveNow = useCallback(() => {
    window.clearTimeout(saveT.current)
    const run = async () => {
      const d = docR.current
      if (!d) return
      const s = snap(d)
      if (s === savedSnap.current) return
      await persistR.current(d)
      savedSnap.current = s
    }
    const p = chain.current.then(run)
    chain.current = p.catch(() => {})
    p.then(
      () => { if (docR.current && snap(docR.current) === savedSnap.current) setSaveState('saved') },
      () => {
        setSaveState('error')
        ov.toast('لم نستطع حفظ آخر تعديلاتك. تحقق من الاتصال.', { ok: false, action: 'أعد المحاولة', run: () => { setSaveState('saving'); saveNowR.current() } })
      },
    )
    return p
  }, [ov])
  const saveNowR = useRef(saveNow)
  saveNowR.current = saveNow
  const scheduleSave = useCallback(() => {
    setSaveState('saving')
    window.clearTimeout(saveT.current)
    saveT.current = window.setTimeout(() => { saveNowR.current() }, 700)
  }, [])

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (docR.current && snap(docR.current) !== savedSnap.current) { saveNowR.current(); e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  /* ── history: the only two ways anything changes ── */
  const chkT = useRef(0)
  const commit = useCallback((next: Doc, label: string, key: string | null) => {
    const h = histR.current
    const s = snap(next), top = h.list[h.i]
    if (top && s === top.s) return false
    applyDoc(next)
    const now = Date.now()
    if (key && top && top.key === key && now - top.t < 1400 && h.i === h.list.length - 1) { top.s = s; top.doc = next; top.t = now }
    else {
      const list = h.list.slice(0, h.i + 1)
      list.push({ s, doc: next, label, t: now, key: key || null })
      if (list.length > 150) list.shift()
      histR.current = { list, i: list.length - 1 }
    }
    setHv((v) => v + 1)
    scheduleSave()
    window.clearTimeout(chkT.current)
    chkT.current = window.setTimeout(() => setChecks(runChecks(config, docR.current!)), 220)
    setHint((x) => (x.show ? hideHint() : x))
    return true
  }, [config, scheduleSave])

  const setC = useCallback((path: string, val: any, o: SetOpts = {}) => {
    const d = docR.current
    if (!d || getPath(d.content, path) === val) return
    const r = resolve(config, path)
    commit({ ...d, content: setPath(d.content, path, val) }, o.label || `عدّلت «${labelOf(r?.def) || 'نصًا'}»`, o.key === undefined ? 'f:' + path : o.key)
  }, [config, commit])
  const setDoc = useCallback((fn: (d: Doc) => Doc, label: string, key: string | null = null) => {
    const d = docR.current
    if (d) commit(fn(d), label, key)
  }, [commit])

  /* ── navigation: the panel's stack is what is selected on the site ── */
  const goPage = useCallback((id: string, keep = false) => {
    stageRef.current?.finishInline()
    if (!config.pages?.some((p) => p.id === id)) return
    setPage(id)
    if (keep || mode !== 'edit') return
    const top = stackR.current[stackR.current.length - 1]
    const onOther = (top.v === 'sec' || top.v === 'item') && stackR.current.some((x) => {
      if (x.v !== 'sec') return false
      const p = panelById(config, x.id)
      return !!p && !isGlobal(config, x.id) && !panelInView(p, id)
    })
    if (onOther) { setTabS('content'); applyStack([{ v: 'root' }], 'x') }
  }, [config, mode])

  const ensurePage = useCallback((panel: string) => {
    const p = panelById(config, panel)
    if (!p || isGlobal(config, panel) || panelInView(p, page)) return
    const pg = panelPage(p)
    if (pg) setPage(pg)
  }, [config, page])

  const openAt = useCallback((panel: string, path?: string | null, o: { anim?: string | null; scroll?: boolean; focus?: boolean } = {}) => {
    stageRef.current?.finishInline()
    const r = path ? resolve(config, path) : null
    if (r && r.panel !== panel && panelById(config, r.panel)) panel = r.panel
    const p = panelById(config, panel)
    if (!p) return
    ensurePage(panel)
    const st: View[] = [{ v: 'root' }, { v: 'sec', id: panel }]
    let field: string | null = null
    if (r && r.panel === panel) { r.items.forEach((it) => st.push({ v: 'item', list: it.list, i: it.i, panel })); if (r.def) field = r.abs }
    const newTab: Tab = isGlobal(config, panel) ? 'site' : 'content'
    const cur = stackR.current
    const same = cur.length === st.length && cur.every((x, i) => JSON.stringify({ ...x, scroll: 0, panel: '' }) === JSON.stringify({ ...st[i], scroll: 0, panel: '' })) && tab === newTab
    setTabS(newTab); setQuery('')
    pending.current = {
      scroll: o.scroll ? (path || true) : undefined,
      focus: field || path ? { path: (field || path)!, focus: o.focus !== undefined ? o.focus : fineMouse() && !isPhoneW() } : undefined,
    }
    if (!same) applyStack(st, o.anim === undefined ? 'x' : o.anim)
    else setNav((x) => ({ ...x }))
    if (isPhoneW() && sheetR.current === 'closed') setSheet('half')
  }, [config, ensurePage, tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const push = useCallback((v: View) => {
    if (v.v === 'item') {
      const r = resolve(config, `${v.list}.${v.i}`)
      if (r) ensurePage(r.panel)
    }
    applyStack([...stackR.current, v], 'f')
    pending.current = { scroll: true }
  }, [config, ensurePage])
  const pop = useCallback(() => {
    if (stackR.current.length < 2) { if (isPhoneW()) setSheet('closed'); return }
    applyStack(stackR.current.slice(0, -1), 'b')
    pending.current = { scroll: true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setTab = useCallback((t: Tab) => {
    setTabS(t); setQuery(''); applyStack([{ v: 'root' }], 'x')
  }, [])

  // After the panel has drawn the new view: bring the field into view and,
  // when asked, the selection on the site.
  useEffect(() => {
    const x = pending.current
    if (!x) return
    pending.current = null
    // A double click that starts typing on the site wins over its first click's focus.
    const t1 = window.setTimeout(() => {
      if (x.focus) focusField(x.focus.path, x.focus.focus && !inlineR.current)
    }, 40)
    const t2 = x.scroll !== undefined ? window.setTimeout(() => stageRef.current?.scrollToSel(typeof x.scroll === 'string' ? x.scroll : null, true), 90) : 0
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [nav]) // eslint-disable-line react-hooks/exhaustive-deps

  const focusField = (path: string, focus: boolean) => {
    const pv = document.querySelector<HTMLElement>('.v6e #pbody .pv:last-child')
    if (!pv) return
    let el = pv.querySelector<HTMLElement>(`[data-fk="${CSS.escape(path)}"]`)
    if (!el) {
      const r = resolve(config, path)
      if (r && r.def && r.def.type === 'hours') el = pv.querySelector<HTMLElement>(`[data-fk="${CSS.escape(r.abs)}"]`)
    }
    if (!el) return
    const pr = pv.getBoundingClientRect(), er = el.getBoundingClientRect()
    if (er.top < pr.top + 8 || er.bottom > pr.bottom - 8) pv.scrollTo({ top: pv.scrollTop + er.top - pr.top - pv.clientHeight * 0.25, behavior: reduceMotion() ? 'auto' : 'smooth' })
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash')
    if (focus) {
      const inp = el.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type=color]):not([type=range]),textarea,select')
      if (inp) {
        inp.focus({ preventScroll: true })
        if ('setSelectionRange' in inp && inp.type !== 'email' && inp.type !== 'number') { try { const n = inp.value.length; inp.setSelectionRange(n, n) } catch {} }
      }
    }
  }

  /** A list item or section removed by an undo leaves the stack. */
  const validateStack = (d: Doc) => {
    const out: View[] = [stackR.current[0]]
    for (const v of stackR.current.slice(1)) {
      if (v.v === 'item') { const arr = getPath(d.content, v.list); if (!Array.isArray(arr) || arr[v.i] === undefined) break }
      out.push(v)
    }
    if (out.length !== stackR.current.length) applyStack(out, null)
  }

  /* ── undo / redo / history ── */
  const restore = (i: number) => {
    const h = histR.current
    histR.current = { list: h.list, i }
    const d = h.list[i].doc
    applyDoc(d); validateStack(d)
    setHv((v) => v + 1)
    scheduleSave()
    setChecks(runChecks(config, d))
  }
  const undo = () => {
    stageRef.current?.finishInline()
    const h = histR.current
    if (h.i <= 0) return
    const l = h.list[h.i].label
    restore(h.i - 1)
    ov.toast(`تراجعت عن: ${l}`, { action: 'إعادة', run: () => redoR.current() })
  }
  const redo = () => {
    stageRef.current?.finishInline()
    const h = histR.current
    if (h.i >= h.list.length - 1) return
    restore(h.i + 1)
    ov.toast(`أعدت: ${histR.current.list[histR.current.i].label}`)
  }
  const redoR = useRef(redo); redoR.current = redo
  const undoR = useRef(undo); undoR.current = undo
  const jumpTo = (i: number) => { if (i >= 0 && i < histR.current.list.length && i !== histR.current.i) restore(i) }

  /* ── sections, items, pictures ── */
  const hidden = useCallback((id: string) => ((docR.current?.content?.hidden_sections as string[]) || []).includes(id), [])
  const toggleHidden = useCallback((id: string) => {
    const d = docR.current
    if (!d) return
    const arr = ((d.content.hidden_sections as string[]) || []).slice()
    const i = arr.indexOf(id), p = panelById(config, id)
    if (i >= 0) arr.splice(i, 1); else arr.push(id)
    commit({ ...d, content: { ...d.content, hidden_sections: arr } }, i >= 0 ? `أظهرت «${p?.label}»` : `أخفيت «${p?.label}»`, null)
    ov.toast(i >= 0 ? `ظهر «${p?.label}» لزوارك` : `أُخفي «${p?.label}» عن زوارك`, { action: 'تراجع', run: () => undoR.current() })
  }, [config, commit, ov])

  const setImage = useCallback((path: string, val: string) => {
    const r = resolve(config, path)
    const l = labelOf(r?.def) || 'صورة'
    setC(path, val, { label: val ? `غيّرت «${l}»` : `أزلت «${l}»`, key: null })
    window.setTimeout(() => focusField(path, false), 60)
  }, [config, setC]) // eslint-disable-line react-hooks/exhaustive-deps

  const upload = useCallback(async (file: File): Promise<string | null> => {
    if (!/^image\//.test(file.type)) { ov.toast('هذا الملف ليس صورة نعرف فتحها. جرّب JPG أو PNG.', { ok: false }); return null }
    if (offline) {
      try { return await fileToData(file) } catch { ov.toast('هذا الملف ليس صورة نعرف فتحها. جرّب JPG أو PNG.', { ok: false }); return null }
    }
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: form })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.url) throw new Error(j?.message || j?.error || 'upload')
      return j.url as string
    } catch (e: any) {
      ov.toast(e?.message && e.message !== 'upload' ? e.message : 'لم نستطع رفع الصورة. جرّب مرة أخرى.', { ok: false })
      return null
    }
  }, [offline, ov])

  const uploadTo = useCallback(async (path: string, file: File) => {
    ov.toast('تُرفع الصورة…', { ok: false })
    const url = await upload(file)
    if (url) { setImage(path, url); ov.toast('وُضعت الصورة') }
  }, [upload, setImage, ov])

  const addItem = useCallback((path: string) => {
    const d = docR.current, def = listDef(config, path)
    if (!d || !def) return
    const arr = [...((getPath(d.content, path) as any[]) || [])]
    arr.push(def.type === 'array' ? def.makeItem() : '')
    commit({ ...d, content: setPath(d.content, path, arr) }, `أضفت ${def.type === 'array' ? def.itemAcc || def.itemLabel : def.label}`, null)
    applyStack([...stackR.current, { v: 'item', list: path, i: arr.length - 1, panel: '' }], 'f')
    pending.current = { scroll: true }
    window.setTimeout(() => {
      const f = document.querySelector<HTMLInputElement>('.v6e #pbody .pv:last-child input.inp, .v6e #pbody .pv:last-child textarea.inp')
      if (f && !isPhoneW()) { f.focus({ preventScroll: true }); f.select?.() }
    }, 140)
  }, [config, commit])

  const moveItem = useCallback((path: string, from: number, to: number) => {
    const d = docR.current
    if (!d) return
    const arr = [...((getPath(d.content, path) as any[]) || [])]
    if (from === to || to < 0 || to >= arr.length) return
    const [x] = arr.splice(from, 1)
    arr.splice(to, 0, x)
    const def = listDef(config, path)
    commit({ ...d, content: setPath(d.content, path, arr) }, `غيّرت ترتيب ${def ? def.label : ''}`, null)
  }, [config, commit])

  const delItem = () => {
    const v = stackR.current[stackR.current.length - 1], d = docR.current
    if (v.v !== 'item' || !d) return
    const arr = [...((getPath(d.content, v.list) as any[]) || [])], def = listDef(config, v.list)
    if (!def) return
    const t = itemTitle(def, arr[v.i], v.i)
    arr.splice(v.i, 1)
    commit({ ...d, content: setPath(d.content, v.list, arr) }, `حذفت «${t}»`, null)
    applyStack(stackR.current.slice(0, -1), 'b')
    ov.toast(`حُذف «${t}»`, { action: 'تراجع', run: () => undoR.current() })
  }
  const dupItem = () => {
    const v = stackR.current[stackR.current.length - 1], d = docR.current
    if (v.v !== 'item' || !d) return
    const arr = [...((getPath(d.content, v.list) as any[]) || [])], def = listDef(config, v.list)
    if (!def) return
    let cp = clone(arr[v.i])
    if (cp && typeof cp === 'object') {
      if (cp.id) cp.id = 'c' + Math.random().toString(36).slice(2, 8)
      if (def.type === 'array' && def.itemTitle) { const tt = getPath(cp, def.itemTitle); if (typeof tt === 'string' && tt) cp = setPath(cp, def.itemTitle, tt + ' (نسخة)') }
    }
    arr.splice(v.i + 1, 0, cp)
    commit({ ...d, content: setPath(d.content, v.list, arr) }, `كررت «${itemTitle(def, arr[v.i], v.i)}»`, null)
    applyStack([...stackR.current.slice(0, -1), { ...v, i: v.i + 1, scroll: 0 }], 'f')
    pending.current = { scroll: true }
    ov.toast('أُضيفت نسخة')
  }
  const stepItem = (dir: 1 | -1) => {
    const v = stackR.current[stackR.current.length - 1], d = docR.current
    if (v.v !== 'item' || !d) return
    const n = ((getPath(d.content, v.list) as any[]) || []).length, i = v.i + dir
    if (i < 0 || i >= n) return
    applyStack([...stackR.current.slice(0, -1), { ...v, i, scroll: 0 }], dir > 0 ? 'f' : 'b')
    pending.current = { scroll: true }
  }

  /* ── colours, font, section look ── */
  const preset = (id: string) => config.colorPresets.find((p) => p.id === id) || config.colorPresets[0]
  const setPreset = (id: string) => {
    const d = docR.current
    if (!d || (id === d.presetId && !Object.keys(d.colorOverrides).length)) return
    setDoc((x) => ({ ...x, presetId: id, colorOverrides: {} }), `اخترت ألوان «${preset(id)?.name}»`)
  }
  const setColor = (k: string, v: string) => {
    const t = config.colorTokens.find((x) => x.key === k)
    setDoc((x) => ({ ...x, colorOverrides: { ...x.colorOverrides, [k]: v } }), `غيّرت «${t?.label || 'لونًا'}»`, 'tok:' + k)
  }
  const resetColors = () => setDoc((x) => ({ ...x, colorOverrides: {} }), `أعدت ألوان «${preset(docR.current!.presetId)?.name}»`)
  const fonts: FontCard[] = useMemo(() => [
    { id: '', name: 'خط القالب', sub: 'كما صُمّم القالب', h: 'inherit', b: 'inherit', hw: 700 },
    ...TYPOGRAPHY_PRESETS.map((p) => ({ id: p.id, name: p.name, sub: p.vibe, h: p.heading_font, b: p.body_font, hw: p.heading_weight || 500 })),
  ], [])
  const setFont = (id: string) => {
    if (!docR.current || docR.current.typographyPreset === id) return
    setDoc((x) => ({ ...x, typographyPreset: id }), `اخترت خط «${fonts.find((f) => f.id === id)?.name || ''}»`)
  }
  const fontsLoaded = useRef(false)
  const loadFontSamples = () => {
    if (fontsLoaded.current) return
    fontsLoaded.current = true
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = buildGoogleFontsUrl(TYPOGRAPHY_PRESETS)
    document.head.appendChild(l)
  }
  const setStyle = (id: string, k: 'scale' | 'align', v: string) => {
    const p = panelById(config, id)
    setDoc((x) => {
      const o: SectionStyle = { ...(x.sectionStyles[id] || {}) }
      if (k === 'scale') { const n = +v; if (n === 1) delete o.text_scale; else o.text_scale = n }
      else if (v) o.text_align = v as SectionStyle['text_align']; else delete o.text_align
      const ss = { ...x.sectionStyles }
      if (Object.keys(o).length) ss[id] = o; else delete ss[id]
      return { ...x, sectionStyles: ss }
    }, `غيّرت شكل «${p?.label || ''}»`)
  }

  /* ── the site's address ── */
  const siteUrl = online && slug ? publicSiteUrl(slug) : null
  const siteHost = slug ? publicSiteHost(slug) : null
  const copyUrl = () => {
    if (!siteUrl) return
    try { navigator.clipboard.writeText(siteUrl).then(() => ov.toast('نُسخ رابط موقعك'), () => ov.toast(siteUrl, { ok: false })) } catch { ov.toast(siteUrl, { ok: false }) }
  }
  const dash = (to: 'seo' | 'reviews' | 'domains', label: string) => {
    if (offline) { ov.toast(`في لوحة التحكم تفتح صفحة «${label}»`, { ok: false }); return }
    window.open(dashboardUrl('/' + to), '_blank', 'noopener')
  }
  const exit = () => {
    stageRef.current?.finishInline()
    saveNowR.current()
    const to = exitHref || dashboardUrl('/sites')
    if (/^https?:/.test(to)) window.location.href = to
    else router.push(to)
  }

  /* ── pictures: the picker ── */
  const openPicker = (path: string) => {
    const r = resolve(config, path)
    if (!r || !r.def) return
    const cur = String(getPath(docR.current?.content, path) || '')
    const st = mini<{ sel: string; list: string[] | null; busy: boolean }>({ sel: cur, list: null, busy: false })
    const optional = (r.def as any).optional
    const use = (v: string) => { ov.closeDlg(); setImage(path, v) }
    ;(async () => {
      let list: string[] = []
      if (!offline) {
        try { const g = await fetch('/api/gallery'); const j = await g.json(); list = (j?.images || []).map((x: any) => x.url).filter(Boolean) } catch {}
      }
      const used = [...picturesIn(docR.current?.content)]
      st.set({ ...st.get(), list: [...new Set([...list, ...used])] })
    })()
    const Body = () => {
      const s = useMini(st)
      const fi = useRef<HTMLInputElement>(null)
      return (
        <>
          <p className="hint" style={{ marginBottom: 12 }}>اختر من صور موقعك، أو ارفع صورة جديدة. نصغّر الصور الكبيرة تلقائيًا لتفتح بسرعة.</p>
          <div className="lib" id="lib">
            <button type="button" className="up" disabled={s.busy} onClick={() => fi.current?.click()}><Ic n="upload" />{s.busy ? 'تُرفع…' : 'ارفع من جهازك'}</button>
            <input ref={fi} type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              st.set({ ...st.get(), busy: true })
              const url = await upload(f)
              st.set({ ...st.get(), busy: false, ...(url ? { sel: url, list: [url, ...(st.get().list || [])] } : {}) })
            }} />
            {s.list === null
              ? <span className="hint">نجمع صورك…</span>
              : s.list.map((u) => (
                <button key={u} type="button" aria-pressed={u === s.sel} aria-label="صورة" style={{ backgroundImage: `url("${u.replace(/"/g, '%22')}")` }}
                  onClick={() => st.set({ ...st.get(), sel: u })} onDoubleClick={() => use(u)} />
              ))}
          </div>
        </>
      )
    }
    const Foot = () => {
      const s = useMini(st)
      return (
        <>
          {optional && cur ? <button type="button" className="btn line" onClick={() => use('')}><Ic n="trash" />إزالة</button> : null}
          <button type="button" className="btn line" data-close>إلغاء</button>
          <button type="button" className="btn k" disabled={!s.sel || s.sel === cur} onClick={() => use(s.sel)}>استخدم الصورة</button>
        </>
      )
    }
    ov.openDlg({ title: labelOf(r.def), wide: true, body: <Body />, foot: <Foot /> })
  }

  /* ── «اقترح صياغة» ── */
  const suggest = (anchor: HTMLElement, path: string, label: string) => {
    if (offline) return
    const r = resolve(config, path)
    const current = String(getPath(docR.current?.content, path) ?? '')
    const panel = r ? panelById(config, r.panel) : null
    const SugList = ({ close }: { close: (silent?: boolean) => void }) => {
      const [list, setList] = useState<string[] | null>(null)
      const [err, setErr] = useState<string | null>(null)
      useEffect(() => {
        let off = false
        fetch('/api/ai/rewrite', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            themeName: config.themeName, businessType: config.contentKey,
            brand: { name: brandOf(docR.current?.content, config) || undefined, tagline: docR.current?.content?.brand?.tagline },
            voiceSample: voiceOf(docR.current?.content), panelLabel: panel?.label || '', fieldLabel: label,
            current, multiline: r?.def?.type === 'textarea', mode: 'improve', variants: 3,
          }),
        }).then(async (x) => {
          const j = await x.json().catch(() => ({}))
          if (off) return
          if (!x.ok) throw new Error(j?.message || j?.error || '')
          const v: string[] = Array.isArray(j?.variants) ? j.variants.filter((s: any) => typeof s === 'string' && s.trim()) : []
          if (!v.length) throw new Error('')
          setList(v)
        }).catch((e) => { if (!off) setErr(e?.message || 'لم نستطع كتابة اقتراحات الآن. جرّب بعد قليل.') })
        return () => { off = true }
      }, [])
      return (
        <>
          <h4>صياغات مقترحة</h4>
          {err ? <div className="foot-note">{err}</div>
            : !list ? <div className="foot-note">نكتب صياغات لنصك…</div>
            : list.map((t, i) => (
              <button key={i} type="button" className="sg" onClick={() => {
                close(true)
                setC(path, t, { label: `طبّقت صياغة مقترحة على «${label}»`, key: null })
                window.setTimeout(() => focusField(path, false), 60)
                ov.toast('طُبّقت الصياغة', { action: 'تراجع', run: () => undoR.current() })
              }}>
                <span className="tone">صياغة {['١', '٢', '٣', '٤'][i]}</span><span className="t">{t}</span>
              </button>
            ))}
          {list && <div className="foot-note">مكتوبة لنصك أنت. اختر واحدة، ويمكنك تعديلها بعد ذلك.</div>}
        </>
      )
    }
    ov.openPop({ anchor, w: 340, body: (close) => <SugList close={close} /> })
  }

  /* ── publishing ── */
  const changeList = doc && pub ? diff(config, pub, doc, (id) => fonts.find((f) => f.id === id)?.name || '') : []
  const openPublish = () => {
    stageRef.current?.finishInline()
    const d = docR.current
    if (!d) return
    const cs = runChecks(config, d)
    setChecks(cs)
    if (!online) {
      ov.openDlg({
        title: 'موقعك لم يُنشر بعد',
        body: <p>تعديلاتك محفوظة. اختر عنوان موقعك وانشره من صفحة «مواقعي» في لوحة التحكم، وبعدها تنشر أي تعديل من هنا.</p>,
        foot: <><button type="button" className="btn line" data-close>ليس الآن</button><a className="btn k" href={offline ? '#' : dashboardUrl('/sites')}><Ic n="send" />اذهب إلى مواقعي</a></>,
      })
      return
    }
    const ch = diff(config, pubR.current!, d, (id) => fonts.find((f) => f.id === id)?.name || '')
    if (!ch.length) {
      ov.openDlg({
        title: 'كل شيء منشور',
        body: <><p>موقعك المنشور مطابق لما تراه هنا. أي تعديل جديد يظهر في زر «انشر».</p><div style={{ height: 14 }} />{siteUrl && <UrlRow />}</>,
        foot: <button type="button" className="btn k" data-close>تمّ</button>,
      })
      return
    }
    const w = cs.filter((x) => x.lvl === 'warn').length
    ov.openDlg({
      title: 'انشر تعديلاتك',
      body: (
        <>
          <p style={{ marginBottom: 12 }}>يرى زوارك هذه التعديلات فور النشر:</p>
          <ul className="chg">{ch.map((c) => <li key={c.panel}><PIcon p={c} /><span>{c.label}</span><span className="w">{c.what}</span></li>)}</ul>
          {w > 0 && (
            <>
              <div style={{ height: 12 }} />
              <div className="note warn"><Ic n="alert" /><span>{w === 1 ? 'عندك ملاحظة واحدة' : `عندك ${plural(w, '', 'ملاحظتان', 'ملاحظات', 'ملاحظة')}`} في فحص الموقع. يمكنك النشر الآن أو إصلاحها أولًا. <button type="button" onClick={() => { ov.closeDlg(); showChecks() }}>اعرضها</button></span></div>
            </>
          )}
        </>
      ),
      foot: <><button type="button" className="btn line" data-close>ليس الآن</button><button type="button" className="btn k" autoFocus onClick={doPublish}><Ic n="send" />انشر الآن</button></>,
    })
  }
  const UrlRow = () => (
    <div className="url-row"><span>{siteHost}</span><button type="button" className="btn sm" onClick={copyUrl}><Ic n="copy" />انسخ</button></div>
  )
  const Prog = () => {
    const ref = useRef<HTMLElement>(null)
    useEffect(() => { const r = requestAnimationFrame(() => requestAnimationFrame(() => { if (ref.current) ref.current.style.width = '92%' })); return () => cancelAnimationFrame(r) }, [])
    return <div className="prog" id="prog"><i ref={ref} /></div>
  }
  const doPublish = async () => {
    ov.openDlg({
      title: 'انشر تعديلاتك',
      body: <><p style={{ marginBottom: 12 }}>يُنشر موقعك…</p><Prog /></>,
      foot: <><button type="button" className="btn line" disabled>ليس الآن</button><button type="button" className="btn k" disabled>يُنشر…</button></>,
    })
    const d = docR.current!
    const t0 = Date.now()
    try {
      if (offline) {
        const full = await store!.load()
        await store!.save(mergeKeys(full, keysOf(d, config)))
      } else {
        await saveNow()
        let r = noDrafts.current ? null : await fetch(`/api/themes/${themeId}/draft`, { method: 'POST' })
        if (!r || r.status === 503) {
          noDrafts.current = true
          const full = (await (await fetch(`/api/themes/${themeId}`)).json())?.theme?.content || {}
          r = await fetch(`/api/themes/${themeId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: mergeKeys(full, keysOf(d, config)) }),
          })
          if (r.ok) localDraft.set(null)
        }
        if (!r.ok) throw new Error('publish ' + r.status)
      }
      const wait = (reduceMotion() ? 200 : 1100) - (Date.now() - t0)
      if (wait > 0) await sleep(wait)
      pubR.current = d; setPub(d)
      savedSnap.current = snap(d)
      ov.openDlg({
        title: 'نُشر موقعك',
        body: (
          <div className="pub-ok">
            <span className="big"><Ic n="check" /></span>
            <b>تعديلاتك ظاهرة الآن لزوارك</b>
            {offline ? <span className="hint">هذه نسخة تجريبية، فالنشر هنا لا يغيّر موقعًا حقيقيًا.</span> : null}
            {siteUrl && <div style={{ marginTop: 6, width: '100%' }}><UrlRow /></div>}
          </div>
        ),
        foot: <button type="button" className="btn k" data-close autoFocus>تمّ</button>,
      })
    } catch {
      ov.openDlg({
        title: 'لم يُنشر بعد',
        body: <div className="note warn"><Ic n="alert" /><span>لم نستطع نشر تعديلاتك الآن. تعديلاتك محفوظة كمسودة، فلا يضيع شيء. جرّب مرة أخرى بعد قليل.</span></div>,
        foot: <><button type="button" className="btn line" data-close>إغلاق</button><button type="button" className="btn k" onClick={doPublish}>أعد المحاولة</button></>,
      })
    }
  }
  const discard = () => {
    const d = docR.current, p = pubR.current
    if (!d || !p) return
    if (snap(d) === snap(p)) { ov.toast('لا تعديلات غير منشورة'); return }
    ov.openDlg({
      title: 'تجاهل التعديلات غير المنشورة؟',
      body: <p>يرجع موقعك هنا إلى ما يراه زوارك الآن. يمكنك التراجع عن هذا من زر التراجع.</p>,
      foot: <><button type="button" className="btn line" data-close>إلغاء</button><button type="button" className="btn danger" onClick={() => {
        ov.closeDlg()
        commit(pubR.current!, 'تجاهلت التعديلات غير المنشورة', null)
        validateStack(pubR.current!)
        ov.toast('رجعت إلى النسخة المنشورة', { action: 'تراجع', run: () => undoR.current() })
      }}>تجاهل التعديلات</button></>,
    })
  }
  const discardRef = useRef(discard); discardRef.current = discard

  /* ── the site check ── */
  const showChecks = () => {
    if (isPhoneW()) { dockGo('check'); return }
    applyStack([{ v: 'root' }, { v: 'check' }], 'x')
  }
  const fix = (c: Check) => {
    if (c.panel === '__colors') {
      setTabS('design'); applyStack([{ v: 'root' }], 'b')
      window.setTimeout(() => document.querySelector('.v6e #toks')?.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' }), 80)
      if (isPhoneW()) setSheet('full')
      return
    }
    openAt(c.panel, c.path, { anim: 'f', scroll: true, focus: true })
  }

  /* ── phone: the sheet and the dock ── */
  const setSheet = (state: Sheet, silent = false) => {
    const p = panelRef.current
    sheetR.current = state
    setSheetS(state)
    if (p) {
      const H = p.getBoundingClientRect().height || innerHeight * 0.8, vis = Math.min(H, Math.max(300, innerHeight * 0.46))
      p.style.setProperty('--half-off', Math.max(0, H - vis) + 'px')
      p.setAttribute('aria-hidden', isPhoneW() && state === 'closed' ? 'true' : 'false')
    }
    if (state === 'closed' && isPhoneW()) {
      stageRef.current?.finishInline()
      if (!silent) window.setTimeout(() => applyStack([{ v: 'root' }], null), 400)
      else applyStack([{ v: 'root' }], null)
    }
    if (state !== 'closed') window.setTimeout(() => stageRef.current?.scrollToSel(null, true), 380)
  }
  const dockGo = (k: string) => {
    if (k === 'preview') { setPreview(true); return }
    const top = stackR.current[stackR.current.length - 1]
    if (k === 'check') {
      if (top.v === 'check' && sheetR.current !== 'closed') { setSheet('closed'); return }
      applyStack([{ v: 'root' }, { v: 'check' }], 'x'); setSheet('half'); return
    }
    if (sheetR.current !== 'closed' && tab === k && top.v === 'root') { setSheet('closed'); return }
    setTabS(k as Tab); setQuery(''); applyStack([{ v: 'root' }], 'x')
    setSheet(k === 'design' ? 'full' : 'half')
  }

  // The sheet follows a finger: a flick moves one stop, a slow drag lands on the nearest.
  useEffect(() => {
    const p = panelRef.current
    if (!p || !doc) return
    let y0: number | null = null, dy = 0, t0 = 0, base = 0
    const start = (e: PointerEvent) => {
      if (!isPhoneW() || (e.target as Element).closest('button,a,input,textarea,select')) return
      y0 = e.clientY; dy = 0; t0 = performance.now()
      base = sheetR.current === 'full' ? 0 : parseFloat(getComputedStyle(p).getPropertyValue('--half-off')) || 0
      p.classList.add('drag')
      try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}
    }
    const move = (e: PointerEvent) => {
      if (y0 === null) return
      dy = e.clientY - y0
      let y = base + dy
      if (y < 0) y = -Math.sqrt(-y) * 2
      p.style.transform = `translateY(${y}px)`
    }
    const end = () => {
      if (y0 === null) return
      const v = dy / Math.max(1, performance.now() - t0)
      y0 = null; p.classList.remove('drag'); p.style.transform = ''
      const H = p.getBoundingClientRect().height, pos = base + dy, half = parseFloat(getComputedStyle(p).getPropertyValue('--half-off')) || H * 0.45
      if (Math.abs(dy) < 6) return
      if (v > 0.6) setSheet(sheetR.current === 'full' && pos < half + 40 ? 'half' : 'closed')
      else if (v < -0.5) setSheet('full')
      else {
        const stops: [Sheet, number][] = [['full', 0], ['half', half], ['closed', H]]
        setSheet(stops.reduce((a, b) => (Math.abs(b[1] - pos) < Math.abs(a[1] - pos) ? b : a))[0])
      }
    }
    const hs = ['#pgrab', '#phead'].map((s) => p.querySelector<HTMLElement>(s)).filter(Boolean) as HTMLElement[]
    hs.forEach((h) => { h.addEventListener('pointerdown', start); h.addEventListener('pointermove', move); h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end) })
    // A field in a half sheet opens it the rest of the way, so the keyboard does not cover it.
    const fin = (e: FocusEvent) => {
      if (isPhoneW() && sheetR.current === 'half' && (e.target as Element).matches('input:not([type=color]):not([type=range]),textarea')) setSheet('full')
    }
    p.addEventListener('focusin', fin)
    return () => {
      hs.forEach((h) => { h.removeEventListener('pointerdown', start); h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', end); h.removeEventListener('pointercancel', end) })
      p.removeEventListener('focusin', fin)
    }
  }, [!!doc]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── preview mode, device, phone ── */
  const setPreview = (on: boolean) => {
    stageRef.current?.finishInline()
    ov.closePop(true)
    setMode(on ? 'preview' : 'edit')
    if (on && isPhoneW()) setSheet('closed', true)
    if (on) window.setTimeout(() => document.querySelector<HTMLElement>('.v6e #exitPrev')?.focus({ preventScroll: true }), 60)
  }
  const setDevice = (d: Device) => setDeviceS(d)

  useEffect(() => {
    const p = isPhoneW()
    setPhone(p)
    setDeviceS(window.innerWidth >= 1100 ? 'desk' : 'phone')
    if (p) setSheet('closed', true)
    let was = p
    const onR = () => {
      const now = isPhoneW()
      if (now === was) return
      was = now
      setPhone(now)
      if (!now) { sheetR.current = 'closed'; setSheetS('closed'); panelRef.current?.removeAttribute('aria-hidden'); if (window.innerWidth >= 1100) setDeviceS((d) => (d === 'phone' ? 'desk' : d)) }
      else setSheet('closed', true)
    }
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── the hint ── */
  function hideHint() {
    try { localStorage.setItem(HINT_KEY, '1') } catch {}
    return { show: false, text: '' }
  }
  useEffect(() => {
    if (!doc) return
    let seen = false
    try { seen = !!localStorage.getItem(HINT_KEY) } catch {}
    if (!seen) setHint({ show: true, text: isPhoneW() ? 'المس أي جزء من موقعك لتعديله.' : 'اضغط أي جزء من موقعك لتعديله، واضغط مرتين على نص لتكتب عليه مباشرة.' })
  }, [!!doc]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── the keyboard ── */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey, key = e.key.toLowerCase()
      const typing = (e.target as Element)?.closest?.('input,textarea,select,[contenteditable]')
      if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? redoR.current() : undoR.current(); return }
      if (mod && key === 'y') { e.preventDefault(); redoR.current(); return }
      if (mod && key === 's') { e.preventDefault(); stageRef.current?.finishInline(); saveNowR.current(); ov.toast('حُفظت تعديلاتك كمسودة'); return }
      if (mod && key === 'k') {
        e.preventDefault()
        if (mode !== 'edit') setPreview(false)
        setTabS('content'); setQuery(''); applyStack([{ v: 'root' }], 'x')
        if (isPhoneW()) setSheet('full')
        window.setTimeout(() => document.querySelector<HTMLInputElement>('.v6e #q')?.focus(), 80)
        return
      }
      if (e.key === 'Escape') {
        if (ov.dlgOpen()) { ov.closeDlg(); return }
        if (ov.popOpen()) { ov.closePop(); return }
        if (mode === 'preview') { setPreview(false); return }
        if (typing) { (e.target as HTMLElement).blur(); return }
        if (stackR.current.length > 1) { pop(); return }
        if (isPhoneW() && sheetR.current !== 'closed') { setSheet('closed'); return }
        return
      }
      if (!typing && !mod && e.key === '?') keysDlg()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  /* ── menus ── */
  const pageMenu = (anchor: HTMLElement) => {
    const pages = config.pages || []
    ov.openPop({
      anchor, w: 300,
      body: (close) => (
        <>
          <h4>صفحات موقعك</h4>
          {pages.map((p) => {
            const secs = config.panels.filter((x) => panelInView(x, p.id)).map((x) => x.label).join('، ')
            return (
              <button key={p.id} type="button" className="pi" aria-current={p.id === page ? 'page' : undefined} onClick={() => { close(); goPage(p.id) }}>
                <PIcon p={p} /><span className="tx">{p.label}<span>{secs}</span></span>{p.id === page ? <Ic n="check" c="ok-i" /> : null}
              </button>
            )
          })}
        </>
      ),
    })
  }
  const themeMode = (): 'light' | 'dark' | 'auto' => { try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : 'auto' } catch { return 'auto' } }
  const setTheme = (m: 'light' | 'dark' | 'auto') => {
    try { if (m === 'auto') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, m) } catch {}
    const dark = m === 'auto' ? window.matchMedia('(prefers-color-scheme: dark)').matches : m === 'dark'
    document.documentElement.classList.toggle('dash-dk', dark)
  }
  const ThemeSeg = () => {
    const [m, setM] = useState(themeMode())
    return <Seg<'light' | 'dark' | 'auto'> items={[['light', 'فاتح'], ['dark', 'داكن'], ['auto', 'تلقائي']]} value={m} cls="fill" label="مظهر المحرّر" attrs={{ id: 'themeSeg' }} onChange={(v) => { setM(v); setTheme(v) }} />
  }
  const moreMenu = (anchor: HTMLElement) => {
    const h = histR.current
    ov.openPop({
      anchor, w: 300,
      body: (close) => {
        const go = (fn: () => void) => () => { close(true); fn() }
        return (
          <>
            {phone && (
              <button type="button" className="pi" disabled={h.i >= h.list.length - 1} onClick={go(() => redoR.current())}>
                <Ic n="redo" c="flip" /><span className="tx">إعادة<span>{h.i < h.list.length - 1 ? h.list[h.i + 1].label : 'لا شيء للإعادة'}</span></span>
              </button>
            )}
            <button type="button" className="pi" onClick={go(openHistory)}><Ic n="history" /><span className="tx">سجل التعديلات<span>ارجع إلى أي خطوة</span></span></button>
            {!phone && <button type="button" className="pi" onClick={go(keysDlg)}><Ic n="kbd" /><span className="tx">اختصارات لوحة المفاتيح</span></button>}
            <hr />
            <h4>مظهر المحرّر</h4>
            <div className="row-seg"><ThemeSeg /></div>
            {demo && (
              <>
                <hr />
                <h4>قوالب العرض</h4>
                {demo.types.map((t) => (
                  <a key={t.href} className="pi" href={t.href} aria-current={t.current ? 'page' : undefined}><Ic n="sites" /><span className="tx">{t.label}</span>{t.current ? <Ic n="check" c="ok-i" /> : null}</a>
                ))}
              </>
            )}
            {online && (
              <>
                <hr />
                <button type="button" className="pi" onClick={go(discard)}><Ic n="reset" /><span className="tx">تجاهل التعديلات غير المنشورة</span></button>
              </>
            )}
          </>
        )
      },
    })
  }
  const openHistory = () => { applyStack([{ v: 'root' }, { v: 'history' }], 'x'); if (isPhoneW()) setSheet('full') }
  const keysDlg = () => {
    const k: [string, string][] = [['تراجع', `${MOD} Z`], ['إعادة', `${SHIFT} ${MOD} Z`], ['احفظ الآن', `${MOD} S`], ['ابحث في نصوص موقعك', `${MOD} K`], ['اكتب على النص مباشرة', 'ضغطتان على النص'], ['اخرج من الكتابة أو المعاينة', 'Esc'], ['رتّب عنصرًا في قائمة', '↑ ↓ على مقبض الترتيب'], ['هذه القائمة', '?']]
    ov.openDlg({ title: 'اختصارات لوحة المفاتيح', body: <div className="kbd-list">{k.map(([a, b]) => <div key={a}><span>{a}</span><kbd>{b}</kbd></div>)}</div>, foot: <button type="button" className="btn k" data-close>تمّ</button> })
  }
  const siteMenu = (anchor: HTMLElement) => {
    const n = changeList.length
    ov.openPop({
      anchor, w: 320,
      body: (close) => (
        <>
          <h4>موقعك</h4>
          <div style={{ padding: '4px 8px 10px' }}>
            {siteUrl ? <UrlRow /> : <div className="hint">لم يُنشر موقعك بعد. يصبح له رابط عند أول نشر.</div>}
          </div>
          <button type="button" className="pi" onClick={() => { close(true); openPublish() }}>
            <Ic n="send" /><span className="tx">انشر التعديلات<span>{!online ? 'من صفحة «مواقعي»' : n ? plural(n, 'تعديل واحد', 'تعديلان', 'تعديلات', 'تعديلًا') : 'كل شيء منشور'}</span></span>
          </button>
        </>
      ),
    })
  }

  /* ── inline typing on the site: the site holds still while the owner types ── */
  const inlineR = useRef(false)
  const onInline = useCallback((path: string, value: string, done: boolean) => {
    inlineR.current = !done
    if (!done) {
      setFrozen((f) => f || docR.current)
      setC(path, value, { src: 'inline' })
      return
    }
    setC(path, value, { src: 'inline' })
    setFrozen(null)
    setSiteKey((k) => k + 1)
  }, [setC])

  // A template whose config marks the fields worth rewording offers it only there.
  const suggestMarked = useMemo(() => [...config.panels, ...config.globalPanels].some((p) => JSON.stringify(p.fields, (_k, v) => (typeof v === 'function' ? undefined : v)).includes('"suggest":true')), [config])

  /* ── what the site shows ── */
  const shown = frozen || doc
  const previewNode = useMemo(() => (shown ? (
    <Fragment key={siteKey}>
      <Preview
        content={shown.content}
        presetId={shown.presetId}
        colorOverrides={shown.colorOverrides}
        typographyPreset={shown.typographyPreset || undefined}
        sectionStyles={shown.sectionStyles}
        view={page}
        onViewChange={setPage}
        logo={logo}
      />
    </Fragment>
  ) : null), [Preview, shown, page, logo, siteKey])
  const sectionCss = useMemo(() => (shown && Object.keys(shown.sectionStyles).length ? sectionStylesToCss(shown.sectionStyles) : ''), [shown])

  if (error) {
    return (
      <div className="app" id="app" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="note warn" style={{ maxWidth: 420 }}><Ic n="alert" /><span>{error} <button type="button" onClick={exit}>ارجع إلى لوحة التحكم</button></span></div>
      </div>
    )
  }
  if (!doc || !pub) {
    return <div className="app" id="app" aria-busy="true" style={{ display: 'grid', placeItems: 'center' }}><span className="hint">يُفتح موقعك…</span></div>
  }

  const top = stack[stack.length - 1]
  let selPanel: string | null = null, selItem: string | null = null
  if (top.v === 'sec') selPanel = top.id
  else if (top.v === 'item') { selPanel = resolve(config, `${top.list}.${top.i}`)?.panel || top.panel || null; selItem = `${top.list}.${top.i}` }
  const selP = selPanel ? panelById(config, selPanel) : null
  let selLabel = selP?.label || ''
  if (selItem) {
    const r = resolve(config, selItem), it = r?.items[r.items.length - 1]
    if (it) selLabel = itemTitle(it.def, (getPath(doc.content, it.list) || [])[it.i], it.i)
  }
  const sel = selP ? { panel: selP.id, item: selItem, label: selLabel, hideable: !!selP.hideable, hidden: hidden(selP.id) } : null

  const h = histR.current
  const n = changeList.length
  const warns = checks.filter((x) => x.lvl === 'warn').length
  const name = brandOf(doc.content, config)
  const pages = config.pages || []
  const pg = pages.find((p) => p.id === page) || pages[0]
  const dockOn = phone && sheet !== 'closed' && mode === 'edit'
  const dockPressed = (k: string) => {
    if (!dockOn) return false
    if (k === 'check') return top.v === 'check'
    return top.v !== 'check' && top.v !== 'history' && tab === k
  }
  const devSeg = <Seg<Device> items={[['phone', 'هاتف', 'mobile'], ['tablet', 'جهاز لوحي', 'tablet'], ['desk', 'حاسوب', 'monitor']]} value={device} cls="devseg" label="حجم المعاينة" onChange={setDevice} />

  const ed: Ed = {
    config, doc, setC, setDoc, openAt, push,
    openPicker, setImage, uploadTo, suggest, addItem, moveItem, hidden, toggleHidden, dash,
    phone: config.phonePath ? String(getPath(doc.content, config.phonePath) || '') : '',
    currency: currencyOf(doc.content), siteHost, checks, offline,
    suggestMarked,
  }
  const api: PanelApi = {
    stack, nav, tab, setTab, query, setQuery, page, goPage: (id) => goPage(id),
    pop, closeSheet: () => setSheet('closed'), dupItem, delItem, stepItem,
    hist: h, jumpTo, fix, setPreset, setColor: (k, v) => setColor(k, v), resetColors,
    fonts, setFont, loadFontSamples, setStyle, copyUrl, siteUrl, brandName: name,
  }

  return (
    <EdCtx.Provider value={ed}>
      <div className={'app' + (mode === 'preview' ? ' preview' : '') + (sheet !== 'closed' ? ' sheet-open' : '')} id="app" dir="rtl" lang="ar">
        <header className="top">
          <div className="t-start">
            <button type="button" className="ib" id="backDash" aria-label="رجوع إلى لوحة التحكم" title="رجوع إلى لوحة التحكم" onClick={exit}><Ic n="next" /></button>
            <button type="button" className="site-chip" id="siteChip" aria-haspopup="true" aria-expanded="false" onClick={(e) => siteMenu(e.currentTarget)}>
              <span className="av" id="siteAv" aria-hidden="true">{[...(name || 'م')][0]}</span>
              <span className="tx">
                <b className="trunc" id="siteName">{name || 'موقعك'}</b>
                <span className="st" id="siteSt">
                  {!online ? <><i />لم يُنشر بعد</> : n ? <><i className="d" />{plural(n, 'تعديل واحد غير منشور', 'تعديلان غير منشورين', 'تعديلات غير منشورة', 'تعديلًا غير منشور')}</> : <><i />منشور ومطابق لما تراه</>}
                </span>
              </span>
            </button>
          </div>
          <div className="t-mid">
            {pages.length > 1 && pg && (
              <button type="button" className="pagebtn" id="pageBtn" aria-haspopup="true" aria-expanded="false" aria-label="اختر صفحة لتعديلها" onClick={(e) => pageMenu(e.currentTarget)}>
                <PIcon p={pg} /><span className="lbl"><span className="lbl2">صفحة </span>{pg.label}</span><Ic n="next" c="chv" />
              </button>
            )}
            {devSeg}
          </div>
          <div className="t-end">
            <span className={'save' + (saveState === 'saving' ? ' busy' : '')} id="save" role="status"
              title={saveState === 'saving' ? 'يُحفظ…' : saveState === 'error' ? 'لم يُحفظ آخر تعديل' : online ? 'حُفظت كل تعديلاتك كمسودة. لا يراها الزوار حتى تنشر.' : 'حُفظت كل تعديلاتك.'}>
              {saveState === 'saving' ? <><Ic n="cloud" /><span className="lbl">يُحفظ…</span></> : saveState === 'error' ? <><Ic n="alert" /><span className="lbl">لم يُحفظ</span></> : <><Ic n="cloudok" /><span className="lbl">محفوظ</span></>}
            </span>
            <span className="t-sep" aria-hidden="true" />
            <button type="button" className="ib" id="undo" aria-label="تراجع" disabled={h.i <= 0} title={h.i > 0 ? `تراجع: ${h.list[h.i].label} (${MOD}Z)` : 'لا شيء للتراجع'} onClick={() => undoR.current()}><Ic n="undo" /></button>
            <button type="button" className="ib" id="redo" aria-label="إعادة" disabled={h.i >= h.list.length - 1} title={h.i < h.list.length - 1 ? `إعادة: ${h.list[h.i + 1].label} (${SHIFT}${MOD}Z)` : 'لا شيء للإعادة'} onClick={() => redoR.current()}><Ic n="redo" /></button>
            <button type="button" className="ib chk" id="chk" aria-label="فحص الموقع" title="فحص الموقع قبل النشر" onClick={() => applyStack([{ v: 'root' }, { v: 'check' }], 'x')}>
              <Ic n="checkc" /><span className="badge" hidden={!warns}>{warns}</span>
            </button>
            <button type="button" className="ib more" id="more" aria-label="المزيد" title="المزيد" aria-haspopup="true" aria-expanded="false" onClick={(e) => moreMenu(e.currentTarget)}><Ic n="more" /></button>
            <button type="button" className="btn line prev" id="prev" title="شاهد موقعك كما يراه زوارك" aria-label="معاينة" onClick={() => setPreview(true)}><Ic n="play" /><span className="lbl">معاينة</span></button>
            {online
              ? <button type="button" className={'btn pub' + (n ? ' k' : ' done')} id="pub" aria-label={n ? `انشر ${n} تعديلات` : 'كل شيء منشور'} onClick={openPublish}>{n ? <>انشر<span className="cnt">{n}</span></> : <><Ic n="check" />منشور</>}</button>
              : <button type="button" className="btn k pub" id="pub" onClick={openPublish}>انشر موقعك</button>}
          </div>
        </header>

        <div className="work">
          <Panel api={api} sheet={phone ? sheet : 'closed'} panelRef={panelRef} />
          <Stage
            ref={stageRef}
            config={config}
            content={shown!.content}
            device={device}
            mode={mode}
            preview={previewNode}
            sectionStylesCss={sectionCss}
            sel={sel}
            sheetTop={() => (isPhoneW() && sheetR.current !== 'closed' && panelRef.current ? panelRef.current.getBoundingClientRect().top : null)}
            onPick={(panel, path, o) => {
              if (!panelById(config, panel)) return
              openAt(panel, path, { focus: o.focus })
              setHint((x) => (x.show ? hideHint() : x))
            }}
            onInline={onInline}
            onImage={openPicker}
            onToggleHidden={toggleHidden}
            bg={colorsOf(config, shown!).background || '#fff'}
            hint={{ ...hint, close: () => setHint(hideHint()) }}
          />
        </div>

        <nav className="dock" id="dock" aria-label="أدوات التعديل">
          {([['content', 'layers', 'الأقسام'], ['design', 'palette', 'التصميم'], ['site', 'settings', 'الموقع'], ['check', 'checkc', 'الفحص'], ['preview', 'play', 'معاينة']] as const).map(([k, i, l]) => (
            <button key={k} type="button" data-dock={k} aria-pressed={dockPressed(k)} onClick={() => dockGo(k)}>
              <Ic n={i} /><span>{l}</span>{k === 'check' ? <span className="badge" hidden={!warns}>{warns}</span> : null}
            </button>
          ))}
        </nav>

        <div className="pbar" id="pbar" role="toolbar" aria-label="المعاينة">
          <span className="pb-t">كما يراه زوارك</span>
          {devSeg}
          <button type="button" className="btn k sm" id="exitPrev" onClick={() => setPreview(false)}><Ic n="edit" />رجوع للتعديل</button>
        </div>
      </div>
    </EdCtx.Provider>
  )
}
