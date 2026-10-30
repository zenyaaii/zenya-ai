'use client'

/**
 * The stage (canvas.js in the editor sample): the device frame, the live
 * site inside it, and the selection ring drawn over it. A click on the site
 * selects the section under it and, when the words or the picture clicked
 * are one of the section's fields, opens that field. A double click on a
 * text edits it in place.
 *
 * The sample drew its own copy of the site with every field tagged. Here the
 * site is the real template, which tags only its sections (data-section), so
 * a field is found by what it shows: the text clicked is matched against the
 * section's texts, the picture against its pictures.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import SiteFrame from './SiteFrame'
import { Ic, fineMouse, isPhoneW, reduceMotion } from './ui'
import type { EditorConfig } from '@/utils/theme-editor-types'
import { allTexts, gp, hasPath, itemFields, join } from './model'

export type Device = 'phone' | 'tablet' | 'desk'
const DEV: Record<Device, { w: number; h: number }> = { phone: { w: 390, h: 844 }, tablet: { w: 820, h: 1180 }, desk: { w: 1280, h: 800 } }

export type Sel = { panel: string; item: string | null; label: string; hideable: boolean; hidden: boolean } | null

export type StageHandle = {
  scrollToSel: (focusPath: string | null, smooth?: boolean) => void
  finishInline: () => void
}

const EDITOR_KEYS = new Set(['z', 'y', 's', 'k'])
const clean = (s: string) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
/** A picture address can hold a lone % (a file named "50%-off.jpg"), which decodeURIComponent throws on. */
const dec = (s: string) => { try { return decodeURIComponent(s) } catch { return s } }

/** Every picture field of a panel, with its value. */
function imagesOf(config: EditorConfig, panelId: string, content: any) {
  const out: { path: string; val: string }[] = []
  const p = [...config.panels, ...config.globalPanels].find((x) => x.id === panelId)
  if (!p) return out
  const go = (fields: any[], base: string) => {
    for (const f of fields) {
      if (!hasPath(f)) continue
      const path = join(base, f.path)
      if (f.type === 'image') { const v = gp(content, path); if (typeof v === 'string' && v) out.push({ path, val: v }) }
      if (f.type === 'array') (gp(content, path) || []).forEach((_: any, i: number) => go(itemFields(f), `${path}.${i}.`))
    }
  }
  go(p.fields, '')
  return out
}

const Stage = forwardRef<StageHandle, {
  config: EditorConfig
  content: any
  device: Device
  mode: 'edit' | 'preview'
  preview: ReactNode
  sectionStylesCss: string
  sel: Sel
  sheetTop: () => number | null
  onPick: (panel: string, path: string | null, o: { focus: boolean }) => void
  onInline: (path: string, value: string, done: boolean) => void
  onImage: (path: string) => void
  onToggleHidden: (id: string) => void
  bg: string
  hint: { show: boolean; text: string; close: () => void }
}>(function Stage(props, ref) {
  const { device, mode, sel } = props
  const stageRef = useRef<HTMLElement>(null)
  const [geo, setGeo] = useState<{ w: number; h: number; s: number; fw: number; fh: number; left: number; top: number; flat: boolean; desk: boolean } | null>(null)
  const docRef = useRef<Document | null>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const ring = useRef<HTMLDivElement>(null)
  const hov = useRef<HTMLDivElement>(null)
  const chip = useRef<HTMLDivElement>(null)
  const ov = useRef<HTMLDivElement>(null)
  const p = useRef(props)
  p.current = props
  const inline = useRef<{ el: HTMLElement; path: string; multi: boolean } | null>(null)

  /* ── geometry: the sample's layoutCanvas ── */
  const layout = useCallback(() => {
    const st = stageRef.current
    if (!st) return
    const cs = getComputedStyle(st)
    const W0 = st.clientWidth, H0 = st.clientHeight - parseFloat(cs.paddingBottom || '0')
    if (isPhoneW()) { setGeo({ w: W0, h: H0, s: 1, fw: W0, fh: H0, left: 0, top: 0, flat: true, desk: false }); return }
    const pad = W0 < 700 ? 16 : 28, d = DEV[p.current.device]
    let w, h, s, fw, fh, left, top
    if (p.current.device === 'desk') { w = d.w; s = Math.min(1, (W0 - pad * 2) / w); fw = w * s; fh = H0 - pad * 2; h = fh / s; left = (W0 - fw) / 2; top = pad }
    else { w = d.w; h = d.h; s = Math.min(1, (W0 - pad * 2) / w, (H0 - pad * 2) / h); fw = w * s; fh = h * s; left = (W0 - fw) / 2; top = Math.max(pad, (H0 - fh) / 2) }
    setGeo({ w, h, s, fw, fh, left, top, flat: false, desk: p.current.device === 'desk' })
  }, [])
  useLayoutEffect(() => { layout() }, [layout, device, mode])
  useEffect(() => {
    const st = stageRef.current
    if (!st) return
    const ro = new ResizeObserver(layout)
    ro.observe(st)
    return () => ro.disconnect()
  }, [layout])

  /* ── the ring, the hover line and the label chip ── */
  const S = geo?.s || 1
  const sectionEls = useCallback((id: string) => {
    const d = docRef.current
    if (!d) return []
    const all = [...d.querySelectorAll<HTMLElement>(`[data-section="${CSS.escape(id)}"]`)]
    return all.filter((e) => !all.some((o) => o !== e && o.contains(e)))
  }, [])
  const union = (els: Element[]) => {
    let r: { l: number; t: number; r: number; b: number } | null = null
    els.forEach((e) => {
      const b = e.getBoundingClientRect()
      if (!b.width && !b.height) return
      r = r ? { l: Math.min(r.l, b.left), t: Math.min(r.t, b.top), r: Math.max(r.r, b.right), b: Math.max(r.b, b.bottom) } : { l: b.left, t: b.top, r: b.right, b: b.bottom }
    })
    return r as { l: number; t: number; r: number; b: number } | null
  }
  const raf = useRef(0)
  const paint = useCallback(() => {
    const rg = ring.current, ch = chip.current, o = ov.current
    if (!rg || !ch || !o) return
    const s = p.current.sel
    const scale = geoRef.current?.s || 1
    if (!s || p.current.mode !== 'edit') { rg.classList.remove('on'); ch.classList.remove('on'); return }
    const u = union(sectionEls(s.panel))
    if (!u) { rg.classList.remove('on'); ch.classList.remove('on'); return }
    const L = u.l * scale, T = u.t * scale, W = (u.r - u.l) * scale, H = (u.b - u.t) * scale
    Object.assign(rg.style, { left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px' })
    rg.classList.add('on')
    const oh = o.clientHeight, ow = o.clientWidth
    if (T > oh - 12 || T + H < 12) { ch.classList.remove('on'); return }
    const cw = ch.offsetWidth, chh = 32
    let cx = L + W - cw
    cx = Math.max(6, Math.min(ow - cw - 6, cx))
    // Keep the label clear of the site's own sticky bar.
    let nb = 0
    docRef.current?.querySelectorAll<HTMLElement>('header, nav, .sticky, .fixed').forEach((el) => {
      const pos = el.ownerDocument.defaultView?.getComputedStyle(el).position
      if (pos !== 'fixed' && pos !== 'sticky') return
      const r = el.getBoundingClientRect()
      if (r.top <= 4 && r.bottom > 0 && r.height < 220) nb = Math.max(nb, r.bottom)
    })
    const minY = Math.max(6, nb * scale + 6)
    let cy = T - chh - 6
    if (cy < minY) cy = Math.min(Math.max(minY, T + 6), oh - chh - 6)
    ch.style.left = cx + 'px'
    ch.style.top = cy + 'px'
    ch.classList.add('on')
  }, [sectionEls])
  const geoRef = useRef(geo)
  geoRef.current = geo
  const draw = useCallback(() => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(paint) }, [paint])
  useEffect(() => { draw() }, [sel, geo, mode, draw, props.content])
  useEffect(() => { doc?.documentElement.classList.toggle('zy-editing', mode === 'edit') }, [doc, mode])

  const hoverAt = useCallback((t: Element | null) => {
    const h = hov.current
    if (!h) return
    if (!t || p.current.mode !== 'edit' || !fineMouse()) { h.classList.remove('on'); return }
    const sec = t.closest('[data-section]')
    const id = sec?.getAttribute('data-section')
    const s = p.current.sel
    if (!sec || !id || (s && !s.item && id === s.panel)) { h.classList.remove('on'); return }
    const u = union(sectionEls(id))
    if (!u) { h.classList.remove('on'); return }
    const scale = geoRef.current?.s || 1
    Object.assign(h.style, { left: u.l * scale + 'px', top: u.t * scale + 'px', width: (u.r - u.l) * scale + 'px', height: (u.b - u.t) * scale + 'px' })
    h.classList.add('on')
  }, [sectionEls])

  /* ── finding a field by what it shows ── */
  const fieldAt = useCallback((t: Element, sec: Element, panelId: string): { path: string; el: HTMLElement; multi: boolean } | null => {
    const { config, content } = p.current
    const img = t.closest('img') as HTMLImageElement | null
    if (img) {
      const src = dec(img.currentSrc || img.src || '')
      const hit = imagesOf(config, panelId, content).find((x) => src.includes(x.val) || src.includes(dec(x.val)))
      if (hit) return { path: hit.path, el: img, multi: false }
    }
    const texts = allTexts(config, content).filter((x) => x.panel === panelId && clean(x.val))
    let el: Element | null = t
    for (let k = 0; el && k < 6; k++, el = el.parentElement) {
      const tx = clean((el as HTMLElement).innerText || el.textContent || '')
      if (tx && tx.length <= 600) {
        const hit = texts.find((x) => clean(x.val) === tx)
        if (hit) return { path: hit.path, el: el as HTMLElement, multi: /\n/.test(hit.val) }
      }
      if (el === sec) break
    }
    // A background picture: the section's own picture when it has just one.
    const imgs = imagesOf(config, panelId, content)
    let b: Element | null = t
    for (let k = 0; b && k < 4; k++, b = b.parentElement) {
      const bg = (b.ownerDocument.defaultView?.getComputedStyle(b).backgroundImage || '')
      if (bg && bg !== 'none') {
        const hit = imgs.find((x) => dec(bg).includes(x.val))
        if (hit) return { path: hit.path, el: b as HTMLElement, multi: false }
      }
    }
    return null
  }, [])

  const finishInline = useCallback(() => {
    const x = inline.current
    if (!x) return
    inline.current = null
    x.el.removeAttribute('contenteditable')
    p.current.onInline(x.path, readInline(x), true)
  }, [])
  const readInline = (x: { el: HTMLElement; multi: boolean }) => {
    let v = x.el.innerText.replace(/ /g, ' ')
    if (!x.multi) v = v.replace(/\n+/g, ' ')
    return v.replace(/\n{3,}/g, '\n\n')
  }

  /* ── the site's own events ── */
  const onReady = useCallback((d: Document) => {
    docRef.current = d
    setDoc(d)
  }, [])

  useEffect(() => {
    const d = doc
    if (!d) return
    const w = d.defaultView!
    const onScroll = () => { draw(); hov.current?.classList.remove('on') }
    const onMove = (e: PointerEvent) => { if (e.pointerType === 'mouse') hoverAt(e.target as Element) }
    const onLeave = () => hov.current?.classList.remove('on')
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element
      if (inline.current && inline.current.el.contains(t)) return
      const a = t.closest('a[href]') as HTMLAnchorElement | null
      // Nothing on the site leaves the editor: a link's page is the editor's page switch.
      if (a && !(a.getAttribute('href') || '').startsWith('#')) e.preventDefault()
      if (p.current.mode !== 'edit') return
      const sec = t.closest('[data-section]')
      const id = sec?.getAttribute('data-section')
      if (!sec || !id) return
      const ctl = t.closest('button,[role="tab"],[role="button"],summary,input,select,textarea,label')
      if (!ctl) { e.preventDefault(); e.stopPropagation() }
      const f = fieldAt(t, sec, id)
      p.current.onPick(id, f?.path || null, { focus: fineMouse() && !isPhoneW() })
    }
    const onDbl = (e: MouseEvent) => {
      if (p.current.mode !== 'edit' || isPhoneW()) return
      const t = e.target as Element
      const sec = t.closest('[data-section]')
      const id = sec?.getAttribute('data-section')
      if (!sec || !id) return
      const f = fieldAt(t, sec, id)
      if (!f) return
      e.preventDefault()
      if (p.current.config && (f.el.tagName === 'IMG' || !f.el.innerText || imagesOf(p.current.config, id, p.current.content).some((x) => x.path === f.path))) {
        p.current.onImage(f.path)
        return
      }
      if (inline.current) finishInline()
      const el = f.el
      el.contentEditable = 'plaintext-only'
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'
      el.spellcheck = false
      inline.current = { el, path: f.path, multi: f.multi }
      el.focus({ preventScroll: true })
      const rg = d.createRange(); rg.selectNodeContents(el)
      const s = w.getSelection(); s?.removeAllRanges(); s?.addRange(rg)
      p.current.onInline(f.path, readInline(inline.current), false)
    }
    const onInput = (e: Event) => { const x = inline.current; if (x && e.target === x.el) p.current.onInline(x.path, readInline(x), false) }
    const onKey = (e: KeyboardEvent) => {
      const x = inline.current
      if (!x) {
        // The editor's keys work with the focus on the site too: it is the editor's page in the sample.
        const mod = e.metaKey || e.ctrlKey
        const typing = (e.target as Element)?.closest?.('input,textarea,select,[contenteditable]')
        if (e.key === 'Escape' || (mod && EDITOR_KEYS.has(e.key.toLowerCase())) || (e.key === '?' && !typing)) {
          e.preventDefault()
          window.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey }))
        }
        return
      }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); x.el.blur(); return }
      if (e.key === 'Enter' && !x.multi) { e.preventDefault(); x.el.blur() }
    }
    const onOut = (e: FocusEvent) => { if (inline.current && e.target === inline.current.el) finishInline() }
    const onPaste = (e: ClipboardEvent) => {
      const x = inline.current
      if (!x) return
      e.preventDefault()
      const t = e.clipboardData?.getData('text/plain') || ''
      d.execCommand('insertText', false, x.multi ? t : t.replace(/\n+/g, ' '))
    }
    const onSubmit = (e: Event) => e.preventDefault()
    d.addEventListener('scroll', onScroll, { capture: true, passive: true })
    d.addEventListener('pointermove', onMove)
    d.documentElement.addEventListener('pointerleave', onLeave)
    d.addEventListener('click', onClick, true)
    d.addEventListener('dblclick', onDbl)
    d.addEventListener('input', onInput)
    d.addEventListener('keydown', onKey, true)
    d.addEventListener('focusout', onOut)
    d.addEventListener('paste', onPaste)
    d.addEventListener('submit', onSubmit, true)
    const RO = (w as any).ResizeObserver as typeof ResizeObserver
    const ro = new RO(draw)
    const root = d.getElementById('zenya-root')
    if (root) ro.observe(root)
    return () => {
      d.removeEventListener('scroll', onScroll, true)
      d.removeEventListener('pointermove', onMove)
      d.documentElement.removeEventListener('pointerleave', onLeave)
      d.removeEventListener('click', onClick, true)
      d.removeEventListener('dblclick', onDbl)
      d.removeEventListener('input', onInput)
      d.removeEventListener('keydown', onKey, true)
      d.removeEventListener('focusout', onOut)
      d.removeEventListener('paste', onPaste)
      d.removeEventListener('submit', onSubmit, true)
      ro.disconnect()
    }
  }, [doc, draw, hoverAt, fieldAt, finishInline])

  /* ── bring the selection into view ── */
  const scrollToSel = useCallback((focusPath: string | null, smooth = true) => {
    const d = docRef.current, s = p.current.sel
    if (!d || !s) return
    let els: Element[] = sectionEls(s.panel)
    if (!els.length) return
    let room = 0
    if (focusPath) {
      // Aim at the very words or picture asked for, when they can be found.
      const { config, content } = p.current
      const val = clean(String(gp(content, focusPath) ?? ''))
      const isImg = imagesOf(config, s.panel, content).find((x) => x.path === focusPath)
      let hit: Element | null = null
      if (isImg) hit = els.map((e) => [...e.querySelectorAll('img')].find((im) => dec(im.currentSrc || im.src).includes(isImg.val)) || null).find(Boolean) || null
      else if (val) {
        const walker = (root: Element): Element | null => {
          for (const c of root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,button,blockquote,div,dd,dt,small,strong,em,label')) {
            if (clean((c as HTMLElement).innerText || '') === val) return c
          }
          return null
        }
        hit = els.map(walker).find(Boolean) || null
      }
      if (hit && !els.includes(hit)) { room = 44; els = [hit] }
    }
    const w = d.defaultView!
    const u = union(els)
    if (!u) return
    const scroller = d.body.scrollHeight > d.body.clientHeight ? d.body : (d.scrollingElement || d.documentElement)
    const under = parseFloat(w.getComputedStyle(els[0]).scrollMarginTop) || 0
    let visH = w.innerHeight
    const st = p.current.sheetTop()
    const frameTop = ov.current?.getBoundingClientRect().top
    if (st != null && frameTop != null) visH = Math.max(160, (st - frameTop) / (geoRef.current?.s || 1))
    const elH = u.b - u.t
    const inView = u.t >= under + room && u.t + Math.min(elH, visH * 0.6) <= visH
    if (inView) return
    scroller.scrollBy({ top: u.t - under - 14 - room, behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' })
  }, [sectionEls])

  useImperativeHandle(ref, () => ({ scrollToSel, finishInline }), [scrollToSel, finishInline])

  const g = geo
  const frameStyle = g ? { width: g.fw, height: g.fh, left: g.left, top: g.top } : { visibility: 'hidden' as const }
  const s = sel
  return (
    <section className="stage" id="stage" aria-label="موقعك" ref={stageRef}>
      <div className={'frame' + (g?.flat ? ' flat' : g?.desk ? ' desk' : '')} id="frame" style={frameStyle}>
        {g && (
          <div className="vp" id="vp" style={{ width: g.w, height: g.h, transform: g.s === 1 ? undefined : `scale(${g.s})`, background: props.bg, overflow: 'hidden' }}>
            <SiteFrame w={g.w} h={g.h} scale={1} preview={props.preview} sectionStylesCss={props.sectionStylesCss} onReady={onReady} title="موقعك" />
          </div>
        )}
      </div>
      <div className="ov" id="ov" ref={ov} style={g ? { width: g.fw, height: g.fh, left: g.left, top: g.top } : undefined}>
        <div className="ring hov" id="hov" ref={hov} />
        <div className="ring" id="ring" ref={ring} />
        <div className="chip" id="chip" ref={chip}>
          {s && (
            <>
              <span className="nm">{s.label}</span>
              {s.hideable && !s.item && !isPhoneW() && (
                <button type="button" onClick={() => props.onToggleHidden(s.panel)}><Ic n={s.hidden ? 'eye' : 'eyeoff'} />{s.hidden ? 'إظهار' : 'إخفاء'}</button>
              )}
            </>
          )}
        </div>
      </div>
      <div className={'hint-pill' + (props.hint.show ? '' : ' out')} id="hint" role="status">
        <Ic n="cursor" /><span className="tx">{props.hint.text}</span>
        <button type="button" aria-label="إخفاء التلميح" onClick={props.hint.close}><Ic n="x" /></button>
      </div>
    </section>
  )
})

export default Stage
