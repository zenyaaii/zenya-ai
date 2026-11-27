/**
 * «فاحص بينون» — the in-page probe.
 *
 * Runs inside the page (page.evaluate) after it has settled, and measures what
 * a visitor gets: visible text, every painted colour with how much of the page
 * it covers, fonts, boxes, things covering text, empty boxes, broken images,
 * links and buttons. It judges nothing; scripts/qa/agent.mjs compares the
 * numbers with the reference (lib/qa/reference.ts).
 *
 * Kept as plain browser JavaScript with no imports, so it can be injected
 * into any site — ours or a competitor's.
 */
// eslint-disable-next-line no-unused-vars
async function __qaProbe(opts) {
  const MAX_EL = opts.maxElements || 7000
  const coarse = !!opts.coarse
  const vw = window.innerWidth
  const vh = window.innerHeight
  const out = { url: location.href, vw, vh, title: document.title, lang: document.documentElement.lang, dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction }

  const sel = (el) => {
    if (!el || !el.tagName) return ''
    const parts = []
    let e = el
    for (let i = 0; e && e.nodeType === 1 && i < 4; i++) {
      let p = e.tagName.toLowerCase()
      if (e.id) { p += '#' + e.id; parts.unshift(p); break }
      const cls = (typeof e.className === 'string' ? e.className : (e.className && e.className.baseVal) || '').trim().split(/\s+/).filter((c) => c && c.length < 30).slice(0, 2)
      if (cls.length) p += '.' + cls.join('.')
      parts.unshift(p)
      e = e.parentElement
    }
    return parts.join(' > ')
  }
  const parseRGBA = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s || '')
    if (!m) {
      const c = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(s || '')
      if (c) return { r: +c[1] * 255, g: +c[2] * 255, b: +c[3] * 255, a: c[4] !== undefined ? +c[4] : 1 }
      return null
    }
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat)
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
  const over = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 })
  // Laid out and not hidden (display/visibility), whatever its opacity right now.
  const laidOut = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })) return false
    const r = el.getBoundingClientRect()
    return r.width > 1 && r.height > 1
  }
  const opaqueNow = (el) => !el.checkVisibility || el.checkVisibility({ opacityProperty: true })
  // Seen by a visitor: opaque now, or opaque at some point while the page was scrolled through.
  // Reveal-on-scroll content is transparent until it enters the screen, and some of it fades out
  // again when it leaves, so a single look from the top would miss most of a page.
  const seen = new WeakSet()
  const visible = (el) => laidOut(el) && (seen.has(el) || opaqueNow(el))

  // Scroll and wait until the page is really there: smooth-scroll libraries (Lenis on the barber
  // template) animate towards the target instead of jumping, and measuring mid-glide lies.
  const go = async (y) => {
    const target = Math.max(0, Math.min(y, (document.scrollingElement || document.documentElement).scrollHeight - vh))
    window.scrollTo({ top: target, left: 0, behavior: 'instant' })
    const t0 = performance.now()
    while (Math.abs(window.scrollY - target) > 2 && performance.now() - t0 < 1500) {
      await new Promise((r) => setTimeout(r, 50))
      if (Math.abs(window.scrollY - target) > 2) window.scrollTo({ top: target, left: 0, behavior: 'instant' })
    }
  }

  // The item a node belongs to in a list of look-alike siblings (a card in a row of cards).
  const itemOf = (el) => {
    const key = (a) => a.tagName + '.' + ((typeof a.className === 'string' ? a.className : '').trim().split(/\s+/)[0] || '')
    for (let a = el; a && a.parentElement && a !== document.body; a = a.parentElement) {
      const k = key(a)
      if (Array.from(a.parentElement.children).filter((c) => key(c) === k).length >= 2) return a
    }
    return null
  }
  // A card of a fanned or stacked deck lying under its neighbour is the deck's design, not a defect.
  const sameDeck = (a, b) => { const ia = itemOf(a), ib = itemOf(b); return !!(ia && ib && ia !== ib && ia.parentElement === ib.parentElement) }

  // ── the sweep: scroll through once, a screen at a time, and note what shows
  const sweepTargets = () => {
    const list = []
    const tw0 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let t0
    while ((t0 = tw0.nextNode())) { if (t0.nodeValue.trim() && t0.parentElement) list.push(t0.parentElement) }
    for (const e of document.querySelectorAll('img,a[href],button,[role="button"],video,canvas,svg')) list.push(e)
    return list
  }
  const targets0 = Array.from(new Set(sweepTargets()))
  const sweepDocH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)
  const sweepStep = Math.max(240, Math.round(vh * 0.7))
  const markSeen = () => {
    for (const e of targets0) {
      if (seen.has(e)) continue
      const r = e.getBoundingClientRect()
      if (r.bottom < 0 || r.top > vh || r.width <= 1 || r.height <= 1) continue
      if (opaqueNow(e) && laidOut(e)) seen.add(e)
    }
  }
  if (!opts.noSweep) {
    for (let y = 0; y <= sweepDocH; y += sweepStep) {
      await go(y)
      await new Promise((r) => setTimeout(r, opts.sweepWait || 260))
      markSeen()
    }
    await new Promise((r) => setTimeout(r, 400))
    markSeen()
    await go(0)
    await new Promise((r) => setTimeout(r, 300))
  }
  markSeen()
  const docH = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)
  const pageRect = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height } }

  // The ground under an element: the first opaque background up the tree.
  const groundCache = new Map()
  const groundOf = (el) => {
    const chain = []
    let e = el, base = null
    while (e && e.nodeType === 1) {
      if (groundCache.has(e)) { base = groundCache.get(e); break }
      chain.push(e)
      const cs = getComputedStyle(e)
      const bg = parseRGBA(cs.backgroundColor)
      if (bg && bg.a >= 0.98) { base = bg; break }
      e = e.parentElement
    }
    if (!base) base = { r: 255, g: 255, b: 255, a: 1 }
    // composite translucent layers on the way back down
    let ground = base
    for (let i = chain.length - 1; i >= 0; i--) {
      const bg = parseRGBA(getComputedStyle(chain[i]).backgroundColor)
      if (bg && bg.a > 0 && bg.a < 0.98) ground = over(bg, ground)
      groundCache.set(chain[i], ground)
    }
    return ground
  }

  // ── overflow
  const se = document.scrollingElement || document.documentElement
  out.overflow = { scrollW: se.scrollWidth, clientW: se.clientWidth, widest: null }
  if (se.scrollWidth > se.clientWidth + 1) {
    let worst = null
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.right > se.clientWidth + 1 || r.left < -1) {
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed') continue
        // ignore children of a horizontal scroller: they scroll inside it, not the page
        let p = el.parentElement, inScroller = false
        while (p && p !== document.body) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') { inScroller = true; break } p = p.parentElement }
        if (inScroller) continue
        const over = Math.max(r.right - se.clientWidth, -r.left)
        if (!worst || over > worst.over) worst = { sel: sel(el), over: Math.round(over), w: Math.round(r.width) }
      }
    }
    out.overflow.widest = worst
  }

  // ── visible text nodes
  const texts = []
  const hiddenTexts = []
  const ARABIC = /[؀-ۿ]/
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1
  while ((n = tw.nextNode())) {
    const t = n.nodeValue.replace(/\s+/g, ' ').trim()
    if (!t) continue
    const el = n.parentElement
    if (!el || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TITLE)$/.test(el.tagName)) continue
    // decoration (aria-hidden) and pictures of the product (data-simulated) are not read as content
    if (el.closest('[aria-hidden="true"],[data-simulated]')) continue
    if (!laidOut(el)) continue
    if (!visible(el)) { hiddenTexts.push({ el, t }); continue }
    const range = document.createRange(); range.selectNodeContents(n)
    const rr = range.getBoundingClientRect()
    if (rr.width < 2 || rr.height < 2) continue
    const cs = getComputedStyle(el)
    // sr-only: clipped to a pixel
    const r = el.getBoundingClientRect()
    if (r.width <= 1.5 || r.height <= 1.5) continue
    const scale = el.offsetWidth ? r.width / el.offsetWidth : 1
    const fs = parseFloat(cs.fontSize) * (Math.abs(scale - 1) < 0.02 ? zoom : scale)
    let fixedAnc = false
    for (let e = el; e && e !== document.body; e = e.parentElement) { const ps = getComputedStyle(e).position; if (ps === 'fixed' || ps === 'sticky') { fixedAnc = true; break } }
    texts.push({ t, el, n, rect: { x: rr.left + scrollX, y: rr.top + scrollY, w: rr.width, h: rr.height }, fs, cs, fixedAnc })
  }
  out.text = texts.map((x) => x.t).join('\n')
  const neverShown = []
  if (!opts.noSweep) {
    for (const h of hiddenTexts) {
      if (neverShown.length >= 30) break
      if (h.t.length < 3 || !/[\p{L}\p{N}]{2,}/u.test(h.t)) continue
      // menus, dialogs, drawers, tooltips and carousels hide their content on purpose
      if (h.el.closest('nav,header,dialog,[role="dialog"],[role="menu"],[role="tooltip"],[aria-hidden="true"],[inert],[data-state="closed"],[aria-expanded="false"] ~ *')) continue
      let skip = !!h.el.closest('details:not([open]),[hidden]')
      for (let e = h.el; e && e !== document.body && !skip; e = e.parentElement) {
        const c = getComputedStyle(e)
        if (c.pointerEvents === 'none' && parseFloat(c.opacity) === 0) { skip = true; break }
        // a closed accordion: an ancestor that clips its content to (almost) nothing
        if (e !== h.el && /(hidden|clip|auto|scroll)/.test(c.overflowY) && e.getBoundingClientRect().height < 6) { skip = true; break }
        if (e !== h.el && (c.gridTemplateRows === '0px' || /^0fr$/.test(c.gridTemplateRows))) { skip = true; break }
        if (c.position === 'fixed' || c.position === 'sticky') { skip = true; break }
        if (/(auto|scroll|hidden|clip)/.test(c.overflowX) && e.scrollWidth > e.clientWidth + 4) {
          const r = h.el.getBoundingClientRect(), er = e.getBoundingClientRect()
          if (r.right < er.left + 2 || r.left > er.right - 2) { skip = true; break }
        }
      }
      if (skip) continue
      neverShown.push({ el: h.el, sel: sel(h.el), t: h.t.slice(0, 40) })
    }
    // A rotating set (a strip that features one item at a time) shows every item in turn: watch each
    // list a few seconds, and if what is on show changes, its items are not hidden, only waiting.
    const lists = new Map()
    for (const c of neverShown) { const it = itemOf(c.el); if (it) { const L = it.parentElement; (lists.get(L) || lists.set(L, []).get(L)).push(c) } }
    const rotating = new Set()
    for (const [L, cs] of lists) {
      L.scrollIntoView({ block: 'center', behavior: 'instant' })
      const snap = () => Array.from(L.querySelectorAll('*')).map((e) => (opaqueNow(e) ? 1 : 0)).join('')
      const s0 = snap()
      for (let i = 0; i < 16; i++) { await new Promise((r) => setTimeout(r, 300)); if (snap() !== s0) { cs.forEach((c) => rotating.add(c)); break } }
    }
    for (let i = neverShown.length - 1; i >= 0; i--) if (rotating.has(neverShown[i])) neverShown.splice(i, 1)
    if (lists.size) await go(0)
  }
  out.neverShown = neverShown.map((c) => { const r = c.el.getBoundingClientRect(); return { sel: c.sel, t: c.t, y: Math.round(r.top + scrollY) } })
  out.words = out.text.split(/\s+/).filter(Boolean).length

  // ── type: fonts, small text, Arabic tracking
  const fonts = {}
  const small = []
  const tracking = []
  const floor = opts.typeFloor || 12
  for (const x of texts) {
    const fam = (x.cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim()
    fonts[fam] = (fonts[fam] || 0) + x.t.length
    if (x.fs < floor && /[\p{L}\p{N}]{2,}/u.test(x.t) && small.length < 40) small.push({ sel: sel(x.el), t: x.t.slice(0, 40), px: Math.round(x.fs * 10) / 10 })
    if (ARABIC.test(x.t)) {
      const ls = x.cs.letterSpacing
      if (ls && ls !== 'normal' && Math.abs(parseFloat(ls)) > 0.05 && tracking.length < 30) tracking.push({ sel: sel(x.el), t: x.t.slice(0, 30), ls })
    }
  }
  out.fonts = fonts
  out.smallText = small
  out.arabicTracking = tracking

  // ── colours: every paint, weighted by the area (or ink) it covers
  const paint = new Map()
  const addPaint = (kind, c, weight, el, ground) => {
    if (!c || c.a < 0.04 || weight <= 0) return
    const solid = c.a < 0.98 && ground ? over(c, ground) : c
    const key = kind + hex(solid)
    const p = paint.get(key) || { kind, hex: hex(solid), weight: 0, raw: c.a < 0.98 ? `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${Math.round(c.a * 100) / 100})` : null, sels: [] }
    p.weight += weight
    if (p.sels.length < 3) { const s = sel(el); if (s && !p.sels.includes(s)) p.sels.push(s) }
    paint.set(key, p)
  }
  const els = Array.from(document.body.querySelectorAll('*')).slice(0, MAX_EL)
  const boxes = []
  const emptyBoxes = []
  const gradients = []
  const bodyGround = groundOf(document.body)
  addPaint('bg', bodyGround, vw * docH * 0.25, document.body, null)
  for (const el of els) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|BR|HEAD|META|LINK)$/.test(el.tagName)) continue
    if (!visible(el)) continue
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const area = Math.min(r.width, vw) * Math.min(r.height, docH)
    const parentGround = el.parentElement ? groundOf(el.parentElement) : bodyGround
    const bg = parseRGBA(cs.backgroundColor)
    const bgDiffers = bg && bg.a > 0.04 && hex(bg.a < 0.98 ? over(bg, parentGround) : bg) !== hex(parentGround)
    if (bgDiffers) addPaint('bg', bg, area, el, parentGround)
    const bi = cs.backgroundImage
    if (bi && bi.includes('gradient(')) {
      if (gradients.length < 30) gradients.push({ sel: sel(el), value: bi.slice(0, 160) })
      const stops = bi.match(/rgba?\([^)]+\)/g) || []
      for (const s of stops) addPaint('gradient', parseRGBA(s), area / Math.max(1, stops.length), el, parentGround)
    }
    // borders
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => (cs['border' + k + 'Style'] !== 'none' ? parseFloat(cs['border' + k + 'Width']) || 0 : 0))
    const bwMax = Math.max(...bw)
    if (bwMax > 0) addPaint('border', parseRGBA(cs.borderTopColor), (r.width + r.height) * 2 * bwMax, el, parentGround)
    // svg paint
    if (el instanceof SVGElement && /^(path|circle|rect|ellipse|polygon|line|polyline|text)$/.test(el.tagName.toLowerCase())) {
      const fill = parseRGBA(cs.fill); const stroke = parseRGBA(cs.stroke)
      const svgArea = Math.min(r.width * r.height, 4000)
      if (fill && cs.fill !== 'none') addPaint('icon', fill, svgArea, el, parentGround)
      if (stroke && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0) addPaint('icon', stroke, svgArea * 0.4, el, parentGround)
    }
    // the box shapes (containers big enough to hold a section or a number)
    const shadow = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow : ''
    const radius = Math.max(parseFloat(cs.borderTopLeftRadius) || 0, parseFloat(cs.borderTopRightRadius) || 0, parseFloat(cs.borderBottomLeftRadius) || 0, parseFloat(cs.borderBottomRightRadius) || 0)
    // a box is an in-flow container that draws an edge or a ground: not a layer laid over something
    // (position absolute/fixed), not a table cell, not code, not a picture of the product (device
    // frames, simulated screens), not an app pane that fills the screen
    const isBox = (bgDiffers || bwMax > 0 || /0px 0px 0px 1px/.test(shadow)) && r.width >= 120 && r.height >= 56 &&
      !/^(IMG|VIDEO|CANVAS|IFRAME|INPUT|TEXTAREA|SELECT|BUTTON|A|HTML|BODY|svg|TABLE|THEAD|TBODY|TR|TH|TD|CODE|PRE|KBD)$/i.test(el.tagName) &&
      r.width < vw * 0.98 && cs.position !== 'absolute' && cs.position !== 'fixed' &&
      !(r.height >= vh * 0.85 && (el.id || /^(ASIDE|MAIN|NAV)$/.test(el.tagName))) &&
      !el.closest('[aria-hidden="true"],[data-simulated],.dv-ph,.dv-win,.dv-scr')
    if (isBox && boxes.length < 400) {
      const bc = parseRGBA(cs.borderTopColor)
      boxes.push({
        sel: sel(el), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top + scrollY),
        radius: Math.round(radius * 10) / 10, borderWidth: bwMax, borderSides: bw.filter((w) => w >= 1.5).length, edgeSides: bw.filter((w) => w >= 0.5).length, filled: !!bgDiffers, borderAlpha: bc ? Math.round(bc.a * 100) / 100 : 0,
        ringShadow: /0px 0px 0px (0\.5|1)px/.test(shadow), shadow: shadow.slice(0, 120),
        gradient: !!(bi && bi.includes('gradient(')), dashed: /dashed|dotted/.test(cs.borderTopStyle),
        bg: bg ? hex(bg.a < 0.98 ? over(bg, parentGround) : bg) : null,
        pad: [cs.paddingTop, cs.paddingInlineStart || cs.paddingRight].map((v) => Math.round(parseFloat(v) || 0)),
      })
    }
    // an empty box: a painted shape with nothing in it
    if ((bgDiffers || bwMax > 0) && r.width >= 48 && r.height >= 40 && !el.closest('[aria-hidden="true"]') && cs.position !== 'absolute' && cs.position !== 'fixed' &&
        !/^(IMG|VIDEO|CANVAS|IFRAME|INPUT|TEXTAREA|SELECT|BUTTON|svg|HR|PICTURE)$/i.test(el.tagName) &&
        !(bi && bi !== 'none') && !el.querySelector('img,video,canvas,iframe,svg,input,textarea,select,picture,button,a') &&
        !(el.innerText || '').trim() && emptyBoxes.length < 30) {
      emptyBoxes.push({ sel: sel(el), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.top + scrollY) })
    }
  }
  // text ink
  for (const x of texts) {
    const c = parseRGBA(x.cs.color)
    addPaint('text', c, x.t.length * x.fs * 2, x.el, groundOf(x.el))
  }
  out.paint = Array.from(paint.values()).sort((a, b) => b.weight - a.weight).slice(0, 80)
  out.boxes = boxes
  out.emptyBoxes = emptyBoxes
  out.gradients = gradients

  // ── contrast of text against its ground (worst cases)
  const lin = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const lowContrast = []
  const pictures = []
  for (const e of document.querySelectorAll('img,video,canvas,picture,iframe,[style*="background-image"],[class*="bg-["]')) {
    if (!laidOut(e)) continue
    const cs = getComputedStyle(e)
    if (!/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(e.tagName) && !/url\(/.test(cs.backgroundImage)) continue
    const r = e.getBoundingClientRect()
    if (r.width * r.height < 2500) continue
    pictures.push({ el: e, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height })
  }
  for (const e of els) {
    const b = getComputedStyle(e).backgroundImage
    if (!b || !/url\(/.test(b) || !laidOut(e)) continue
    const r = e.getBoundingClientRect()
    if (r.width * r.height >= 2500) pictures.push({ el: e, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height })
  }
  const overPicture = (x) => pictures.some((P) => {
    if (P.el.contains(x.el)) return false
    const ix = Math.max(0, Math.min(x.rect.x + x.rect.w, P.x + P.w) - Math.max(x.rect.x, P.x))
    const iy = Math.max(0, Math.min(x.rect.y + x.rect.h, P.y + P.h) - Math.max(x.rect.y, P.y))
    return ix * iy >= 0.5 * x.rect.w * x.rect.h
  })
  let overPictureCount = 0
  // the text's own opacity (and its parents' up to the first solid ground) thins its ink
  const inkAlpha = (el) => { let a = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e); a *= parseFloat(c.opacity); const b = parseRGBA(c.backgroundColor); if (b && b.a >= 0.98) break } return isNaN(a) ? 1 : a }
  for (const x of texts) {
    if (x.t.length < 2) continue
    const c = parseRGBA(x.cs.color); if (!c) continue
    const g = groundOf(x.el)
    // text over a picture or gradient: its ground is unknown, not white
    let e = x.el, onImage = false
    for (let i = 0; e && i < 6; i++, e = e.parentElement) { const b = getComputedStyle(e).backgroundImage; if (b && b !== 'none') { onImage = true; break } }
    if (onImage || overPicture(x)) { x.cAnc = { picture: true }; continue }
    const ia = inkAlpha(x.el)
    if (ia < 0.3) { x.cAnc = { faded: true }; continue } // fading in or out: not measurable now
    const ink = { ...c, a: c.a * ia }
    x.cAnc = { k: ratio(ink.a < 0.98 ? over(ink, g) : ink, g), fg: hex(c), bg: hex(g) }
  }

  // ── headings (real and visual)
  const heads = []
  for (const x of texts) {
    const isH = /^H[1-4]$/.test(x.el.tagName) || (x.fs >= 20 && x.t.length <= 48 && parseInt(x.cs.fontWeight, 10) >= 600)
    if (isH && heads.length < 80) heads.push({ t: x.t, tag: x.el.tagName, px: Math.round(x.fs), y: Math.round(x.rect.y) })
  }
  out.headings = heads

  // ── images
  const imgs = Array.from(document.images)
  out.images = { total: imgs.length, visible: 0, broken: [], tiny: 0 }
  for (const im of imgs) {
    if (!visible(im)) continue
    out.images.visible++
    if (im.complete && im.naturalWidth === 0 && out.images.broken.length < 20) out.images.broken.push({ src: (im.currentSrc || im.src || '').slice(0, 160), sel: sel(im) })
    if (im.naturalWidth && im.naturalWidth < 80) out.images.tiny++
  }

  // ── links and buttons
  out.links = []
  for (const a of document.querySelectorAll('a[href]')) {
    if (!visible(a)) continue
    const r = a.getBoundingClientRect()
    out.links.push({ href: a.getAttribute('href'), abs: a.href, text: (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), target: a.target || '' })
    if (out.links.length > 300) break
  }
  out.buttons = []
  for (const b of document.querySelectorAll('button,[role="button"],input[type="submit"]')) {
    if (!visible(b)) continue
    const r = b.getBoundingClientRect()
    out.buttons.push({ text: (b.innerText || b.value || b.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), disabled: !!b.disabled, sel: sel(b) })
    if (out.buttons.length > 200) break
  }

  // ── tap targets
  const minTap = coarse ? 32 : 24
  const taps = []
  for (const el of document.querySelectorAll('a[href],button,[role="button"],input:not([type="hidden"]),select,textarea')) {
    if (!visible(el)) continue
    if (el.closest('[aria-hidden="true"]')) continue
    const r = el.getBoundingClientRect()
    if (Math.min(r.width, r.height) >= minTap) continue
    // an inline link inside a sentence is exempt (WCAG 2.5.8)
    if (el.tagName === 'A' && el.parentElement) {
      const pt = (el.parentElement.innerText || '').trim(), at = (el.innerText || '').trim()
      if (pt.length > at.length + 12) continue
    }
    if (taps.length < 30) taps.push({ sel: sel(el), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) })
  }
  out.smallTaps = taps

  // ── a word broken across two lines inside a button or a link («اح / جز»): the box is too narrow for its word
  const broken = []
  for (const el of document.querySelectorAll('a[href],button,[role="button"]')) {
    if (broken.length >= 20) break
    if (!visible(el) || el.closest('[aria-hidden="true"]')) continue
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const m of n.textContent.matchAll(/[^\s\u00a0]{3,}/g)) {
        const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length)
        const lines = new Set(Array.from(rg.getClientRects()).filter((q) => q.width > 0.5).map((q) => Math.round(q.top)))
        if (lines.size > 1) { broken.push({ sel: sel(el), t: m[0].slice(0, 30), w: Math.round(el.getBoundingClientRect().width) }); break }
      }
    }
  }
  out.brokenWords = broken

  // ── what covers text: scroll a screen at a time and ask what is on top
  const covered = []
  const coveredByFixed = new Map()
  const step = Math.max(200, vh - 120)
  // only words that are on show at the moment they are tested: a slide waiting its turn under the
  // current one is transparent, not covered
  const leafs = texts.filter((x) => x.t.length >= 2 && x.rect.w >= 6 && !x.fixedAnc)
  const textRect = (node) => { const g = document.createRange(); g.selectNodeContents(node); return g.getBoundingClientRect() }
  // wait for finite animations and transitions (a reveal sliding in) to come to rest; marquees never do
  const settle = async (maxMs) => {
    const t0 = performance.now()
    while (performance.now() - t0 < maxMs) {
      const running = document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming().iterations !== Infinity) : []
      if (!running.length) return
      await new Promise((r) => setTimeout(r, 80))
    }
  }
  // how much of a rect an ancestor that clips (overflow other than visible) still lets through
  const shownFraction = (el, r) => {
    let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const c = getComputedStyle(e)
      if (c.overflowX === 'visible' && c.overflowY === 'visible') continue
      const q = e.getBoundingClientRect()
      x1 = Math.max(x1, q.left); y1 = Math.max(y1, q.top); x2 = Math.min(x2, q.right); y2 = Math.min(y2, q.bottom)
      if (x2 <= x1 || y2 <= y1) return 0
    }
    const a = Math.max(1, r.width * r.height)
    return ((x2 - x1) * (y2 - y1)) / a
  }
  const ownText = (hit, x) => hit === x.el || x.el.contains(hit) || hit.contains(x.el)
  // Contrast from the paint stack under the word, not from its parents: a selected tab's dark pill,
  // a badge's tint and a card under a floating label are siblings, not ancestors. Hit-testing skips
  // pointer-events:none layers (most of those pills), so let it see everything while it measures.
  const peAll = document.createElement('style')
  peAll.textContent = '*{pointer-events:auto!important}'
  const opCache = new Map()
  const effOpacity = (e) => {
    if (!e || e.nodeType !== 1) return 1
    if (opCache.has(e)) return opCache.get(e)
    const o = parseFloat(getComputedStyle(e).opacity)
    const v = (isNaN(o) ? 1 : o) * effOpacity(e.parentElement)
    opCache.set(e, v)
    return v
  }
  const stackGround = (x, nr) => {
    const cx = nr.left + nr.width / 2, cy = nr.top + nr.height / 2
    if (cx < 1 || cx > vw - 1 || cy < 1 || cy > vh - 1) return null
    const stack = document.elementsFromPoint(cx, cy)
    const layers = []
    let below = false
    for (const e of stack) {
      // the stack runs top to bottom: what comes before the word's own element is on top of the
      // word (a fixed bar passing over it), not under it — start at the word's element
      if (!below) { if (e === x.el || e.contains(x.el)) below = true; else continue }
      const op = effOpacity(e)
      if (op < 0.02) continue // a transparent layer (a hidden tooltip) paints nothing
      if (e instanceof SVGElement || /^(IMG|VIDEO|CANVAS|IFRAME|PICTURE)$/.test(e.tagName)) return { picture: true }
      const c = getComputedStyle(e)
      if (c.backgroundImage && c.backgroundImage !== 'none') return { picture: true }
      const b = parseRGBA(c.backgroundColor)
      if (b && b.a > 0.01) {
        const a = b.a * op
        layers.push({ ...b, a })
        if (a >= 0.98) break
      }
    }
    if (!below) return null
    let g = { r: 255, g: 255, b: 255, a: 1 }
    for (let i = layers.length - 1; i >= 0; i--) g = over(layers[i], g)
    return g
  }
  for (let y = 0; y < docH; y += step) {
    await go(y)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await settle(1200)
    document.head.appendChild(peAll)
    opCache.clear()
    const moving = new Set((document.getAnimations ? document.getAnimations() : []).filter((a) => a.playState === 'running' && a.effect && a.effect.target).map((a) => a.effect.target))
    const isMoving = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) if (moving.has(e)) return true; return false }
    for (const x of texts) {
      if (x.cStack || x.t.length < 2 || !x.cAnc || x.cAnc.picture) continue
      if (moving.size && isMoving(x.el)) continue
      if (inkAlpha(x.el) < 0.3) continue
      if (x.rect.y + x.rect.h < y - 50 || x.rect.y > y + vh + 50) continue
      if (!opaqueNow(x.el)) continue
      const nr = textRect(x.n)
      if (nr.width < 4 || nr.top < 0 || nr.bottom > vh || shownFraction(x.el, nr) < 0.5) continue
      const g = stackGround(x, nr)
      if (!g) continue
      if (g.picture) { x.cStack = { picture: true }; continue }
      const c = parseRGBA(x.cs.color)
      const ink = { ...c, a: c.a * inkAlpha(x.el) }
      x.cStack = { k: ratio(ink.a < 0.98 ? over(ink, g) : ink, g), fg: hex(c), bg: hex(g) }
    }
    peAll.remove()
    if (covered.length >= 25) continue
    for (const x of leafs) {
      if (x.rect.y + x.rect.h < y - 50 || x.rect.y > y + vh + 50) continue
      if (!opaqueNow(x.el)) continue
      // measure now, not from the first look: marquees, sliders and reveals move words around
      const nr = textRect(x.n)
      const top = nr.top
      if (nr.width < 6 || top < 0 || top + nr.height > vh) continue
      // scrolled out of its own window (a marquee, a slider): clipped, not covered
      if (shownFraction(x.el, nr) < 0.5) continue
      const cy = top + nr.height / 2
      let hit = null, hitAt = null
      for (const f of [0.12, 0.5, 0.88]) {
        const cx = nr.left + nr.width * f
        if (cx < 1 || cx > vw - 1) continue
        const h = document.elementFromPoint(cx, cy)
        if (h && !ownText(h, x) && !sameDeck(h, x.el)) { hit = h; hitAt = { x: cx, y: cy }; break }
      }
      if (!hit) continue
      // a label inside a button whose icon sits on top of the words
      let fixed = null
      for (let e = hit; e && e !== document.body; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') { fixed = e; break } }
      if (fixed) { const k = sel(fixed); coveredByFixed.set(k, (coveredByFixed.get(k) || 0) + 1); continue }
      const hcs = getComputedStyle(hit)
      const hbg = parseRGBA(hcs.backgroundColor)
      // does the thing on top paint where the words are? A see-through link stretched over a card
      // (the whole card clickable) sits on top of every word in it and hides none of them.
      const ownWordsHere = Array.from(hit.childNodes).some((n) => {
        if (n.nodeType !== 3 || !n.nodeValue.trim()) return false
        const q = textRect(n)
        return q.left <= hitAt.x && hitAt.x <= q.right && q.top <= hitAt.y && hitAt.y <= q.bottom
      })
      // a background clipped to the glyphs (gradient headline text) paints only inside its own letters
      const bgPaints = hcs.backgroundImage && hcs.backgroundImage !== 'none' && !/text/.test(hcs.backgroundClip || hcs.webkitBackgroundClip || '')
      const paints = (hbg && hbg.a > 0.2) || hit instanceof SVGElement || /^(IMG|VIDEO|CANVAS|IFRAME)$/.test(hit.tagName) || bgPaints || ownWordsHere
      if (!paints) continue
      // a layer inside a faded-out parent (a caption at opacity 0 until hover) paints nothing
      if (effOpacity(hit) < 0.05) continue
      // frosted glass laid over a preview (a collapsed row, a locked tile) is a veil on purpose, not a slip
      if (/blur\(/.test(hcs.backdropFilter || hcs.webkitBackdropFilter || '')) continue
      covered.push({ text: x.t.slice(0, 30), sel: sel(x.el), by: sel(hit), y: Math.round(x.rect.y) })
      if (covered.length >= 25) break
    }
  }
  await go(0)
  await settle(1500)
  // Positioned paint that sits on words but lets clicks through (pointer-events: none), or an icon
  // whose box grew over its own label: hit-testing cannot see either, so test the geometry against
  // the words themselves (the text node's box, not its element's).
  const layers = []
  for (const el of els) {
    if (layers.length > 400) break
    const isSvgRoot = el instanceof SVGSVGElement && !(el.parentElement && el.parentElement.closest('svg'))
    const cs = getComputedStyle(el)
    // only what hit-testing cannot see: icons (whose clicks land on their button) and layers that let clicks through
    if (!isSvgRoot && !(cs.pointerEvents === 'none' && (cs.position === 'absolute' || el.tagName === 'IMG'))) continue
    if (!laidOut(el) || !opaqueNow(el) || parseInt(cs.zIndex, 10) < 0 || parseFloat(cs.opacity) < 0.5) continue
    let rides = false
    for (let e = el; e && e !== document.body; e = e.parentElement) { const ps = getComputedStyle(e).position; if (ps === 'fixed' || ps === 'sticky') { rides = true; break } }
    if (rides) continue
    const paintsSomething = isSvgRoot || el.tagName === 'IMG' || ((parseRGBA(cs.backgroundColor) || { a: 0 }).a > 0.5)
    if (!paintsSomething) continue
    const r = el.getBoundingClientRect()
    if (r.width < 6 || r.height < 6 || r.width * r.height > vw * vh * 0.6) continue
    layers.push({ el, abs: cs.position === 'absolute', x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height })
  }
  const positioned = (el) => { const p = getComputedStyle(el).position; return p !== 'static' }
  for (const x0 of leafs) {
    if (covered.length >= 25) break
    if (!opaqueNow(x0.el)) continue
    const nr = textRect(x0.n)
    if (nr.width < 6 || shownFraction(x0.el, nr) < 0.5) continue
    const x = { ...x0, rect: { x: nr.left + scrollX, y: nr.top + scrollY, w: nr.width, h: nr.height } }
    const textPositioned = positioned(x.el)
    for (const L of layers) {
      if (L.el === x.el || L.el.contains(x.el) || sameDeck(L.el, x.el)) continue
      const ix = Math.max(0, Math.min(x.rect.x + x.rect.w, L.x + L.w) - Math.max(x.rect.x, L.x))
      const iy = Math.max(0, Math.min(x.rect.y + x.rect.h, L.y + L.h) - Math.max(x.rect.y, L.y))
      if (ix * iy <= 0.15 * x.rect.w * x.rect.h) continue
      // who paints on top: a positioned layer beats words in normal flow; otherwise the later one
      const later = !!(x.el.compareDocumentPosition(L.el) & Node.DOCUMENT_POSITION_FOLLOWING)
      const onTop = (L.abs && !textPositioned) || later
      if (!onTop) continue
      covered.push({ text: x.t.slice(0, 30), sel: sel(x.el), by: sel(L.el) + (L.el.parentElement ? ' in ' + sel(L.el.parentElement) : ''), y: Math.round(x.rect.y), geometric: true, textBox: [x.rect.x, x.rect.y, x.rect.w, x.rect.h].map(Math.round), layerBox: [L.x, L.y, L.w, L.h].map(Math.round) })
      break
    }
  }
  out.covered = covered
  for (const x of texts) {
    const m = x.cStack || x.cAnc
    if (!m || m.faded) continue
    if (m.picture) { overPictureCount++; continue }
    const large = x.fs >= 24 || (x.fs >= 18.66 && parseInt(x.cs.fontWeight, 10) >= 700)
    if (m.k < (large ? 3 : 4.5) && lowContrast.length < 30) lowContrast.push({ sel: sel(x.el), t: x.t.slice(0, 30), ratio: Math.round(m.k * 100) / 100, fg: m.fg, bg: m.bg, how: x.cStack ? 'stack' : 'parents' })
  }
  out.lowContrast = lowContrast
  out.textOverPictures = overPictureCount
  out.coveredByFixed = Array.from(coveredByFixed.entries()).map(([k, v]) => ({ sel: k, count: v }))

  // ── fixed things that sit on the screen at rest (bars, banners) and how much they cover
  const fixedNow = []
  for (const el of els) {
    const cs = getComputedStyle(el)
    if (cs.position !== 'fixed' || !visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width * r.height < 2000) continue
    // only the part that is on the screen (a drawer parked off to the side covers nothing)
    const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
    if (ix * iy < 2000 || !opaqueNow(el)) continue
    fixedNow.push({ sel: sel(el), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), share: Math.round(((ix * iy) / (vw * vh)) * 100) })
  }
  out.fixed = fixedNow

  // ── forms (found, never submitted)
  out.forms = []
  for (const f of document.querySelectorAll('form')) {
    if (!visible(f)) continue
    const fields = Array.from(f.querySelectorAll('input,select,textarea')).filter((i) => i.type !== 'hidden').map((i) => i.name || i.type || i.tagName.toLowerCase())
    const submit = f.querySelector('button[type="submit"],input[type="submit"],button:not([type])')
    out.forms.push({ sel: sel(f), fields, submit: submit ? (submit.innerText || submit.value || '').trim().slice(0, 30) : null })
  }

  out.docH = docH
  return out
}
