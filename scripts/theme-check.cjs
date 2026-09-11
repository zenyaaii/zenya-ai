const { chromium } = require('playwright')

const ROUTES = [
  '/', '/about', '/faq', '/features', '/pricing', '/themes',
  '/websites', '/websites/restaurant', '/compare', '/compare/wix',
  '/why/restaurant', '/privacy', '/terms', '/cookies', '/refund',
  '/subprocessors', '/contact', '/login', '/review',
]
const WIDTHS = [360, 390, 430, 768, 1440]
const BASE = 'http://localhost:3000'

// ── colour maths ──────────────────────────────────────────────────────────
function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
function lum([r, g, b]) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) }
function ratio(a, b) { const la = lum(a), lb = lum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05) }

const PROBE = () => {
  /* The colour maths has to live INSIDE the probe. page.evaluate serialises
     this function and runs it in the page, where nothing from the Node scope
     exists - the first run of this audit referenced a helper defined outside
     and threw ReferenceError on all ninety-five loads, which reads in the
     results as a clean pass with no data in it. */
  const _lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  const lum = (p) => 0.2126 * _lin(p[0]) + 0.7152 * _lin(p[1]) + 0.0722 * _lin(p[2])
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1

  /* WHICH MEASUREMENTS ALREADY CARRY THE ZOOM, AND WHICH DO NOT.
     Calibrated in the browser rather than assumed, because getting it
     backwards silently scales every number by 0.85 and the audit still looks
     like it ran. A div declared 100px tall measures 85 through
     getBoundingClientRect under zoom 0.85, so RECTS ARE ALREADY RENDERED
     PIXELS and must not be multiplied again. getComputedStyle().fontSize
     reports the authored 13px on the same element, so TYPE IS IN CSS PIXELS
     and does need the multiply. */
  const px = (v) => v * zoom
  const out = { zoom, scroll: null, taps: [], type: [], tracking: [], gradients: [], colours: [], indeterminate: [] }

  const se = document.scrollingElement
  out.scroll = { scrollWidth: se.scrollWidth, clientWidth: se.clientWidth }
  if (se.scrollWidth - se.clientWidth > 1) {
    let worst = null
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0) return
      const right = r.right
      if (right > se.clientWidth + 1 && (!worst || right > worst.right)) {
        worst = { sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), right: Math.round(right), width: Math.round(r.width) }
      }
    })
    out.scroll.worst = worst
  }

  const parseRGB = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s || '')
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }
  }
  const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.a + bg[i] * (1 - fg.a))
  const bgOf = (el) => {
    let node = el, acc = null
    while (node && node !== document.documentElement.parentNode) {
      const c = parseRGB(getComputedStyle(node).backgroundColor)
      if (c && c.a > 0) { acc = acc ? over({ rgb: acc.rgb, a: acc.a }, c.rgb) : null
        if (!acc) { if (c.a >= 1) return c.rgb; acc = { rgb: c.rgb, a: c.a } }
        else return acc }
      node = node.parentElement
    }
    return [250, 250, 250]
  }
  /* THE GROUND UNDER A PIECE OF TEXT.
     Walks the ancestor chain compositing every translucent layer down onto
     the page's paper, and it has to look at background-IMAGE as well as
     background-color: the footer cap, the SlideButton and the deck's panels
     are all gradients, so a walker that reads only backgroundColor finds
     nothing opaque, falls through to the paper, and reports white-on-white at
     1:1 for every light-on-dark element on the site. The first run of this
     audit did exactly that and produced 131 phantom failures.

     A gradient has no single luminance, so where one is found every colour
     stop is returned and the caller takes the WORST of them. Stops in oklch
     or oklab are not converted here; a ground carrying one is reported as
     indeterminate rather than guessed at. */
  const gradientStops = (cs) => {
    const bi = cs.backgroundImage || ''
    if (!bi.includes('gradient(')) return null
    if (/oklch|oklab|color\(/.test(bi)) return 'indeterminate'
    const stops = []
    const re = /rgba?\(([^)]+)\)/g
    let m
    while ((m = re.exec(bi))) {
      const p = m[1].split(',').map((x) => parseFloat(x))
      stops.push({ rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 })
    }
    return stops.length ? stops : null
  }

  /* A GROUND CAN BE A SIBLING, NOT AN ANCESTOR.
     The login page's mode switch paints its selected pill as an absolutely
     positioned element BEHIND the two labels rather than as their parent, so
     walking up from the white label found only the light track and reported
     1.1:1 on text that is actually white on #5e6ad2 at 4.70. Anything built
     as a sliding thumb, a highlight bar or a hover fill has this shape. So
     before the ancestor walk: if a positioned sibling of this element - or of
     one of its ancestors - is painted opaque under the element's midpoint,
     that is the ground. */
  const coveringSibling = (el) => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return null
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    /* DIRECT SIBLINGS ONLY, AND ONLY ONES PAINTED BEFORE THIS ELEMENT.
       A first cut walked the ancestors too and matched any positioned box
       whose rect covered the midpoint, which is most overlays and half the
       wrappers on a page: it turned one false positive into fourteen,
       including the cookie banner's white-on-violet button reported as
       white-on-paper. A sliding thumb is a previous sibling of the label it
       sits under, and that is the only shape claimed here. */
    if (!el.parentElement) return null
    for (const sib of Array.from(el.parentElement.children)) {
      if (sib === el) break
      const cs = getComputedStyle(sib)
      if (cs.position === 'static' || cs.visibility === 'hidden') continue
      const sr = sib.getBoundingClientRect()
      if (cx < sr.left || cx > sr.right || cy < sr.top || cy > sr.bottom) continue
      const c = parseRGB(cs.backgroundColor)
      if (c && c.a >= 1) return c.rgb
    }
    return null
  }

  const grounds = (el) => {
    const under = coveringSibling(el)
    if (under) return [under]
    const stack = []
    let node = el
    let gradient = null
    while (node) {
      const cs = getComputedStyle(node)
      const g = gradientStops(cs)
      if (g) { gradient = g; break }
      const c = parseRGB(cs.backgroundColor)
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break }
      node = node.parentElement
    }
    if (gradient === 'indeterminate') return 'indeterminate'
    const bases = gradient
      ? gradient.map((st) => (st.a >= 1 ? st.rgb : over(st, [250, 250, 250])))
      : [[250, 250, 250]]
    return bases.map((b) => {
      let base = b
      for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
      return base
    })
  }

  /* A SIMULATED SCREEN IS A PICTURE OF THE PRODUCT, NOT THE PRODUCT.
     The homepage draws the dashboard and the publish flow inside a laptop and
     a phone, at the size they would be inside a laptop and a phone, and marks
     those subtrees data-simulated. They carry pointer-events: none, so
     nothing in them can be tapped at all. Holding them to the tap-target and
     type floors would mean drawing the product at a size that stops looking
     like the product, and before this exclusion they were the largest source
     of findings in every run - with real ones buried underneath. */
  const simulated = (el) => !!el.closest('[data-simulated]')

  /* THE OTHER THING THAT SHRINKS TEXT, and the type gate missed it for four
     runs. The homepage lays each section out as one screen and scales it to
     fit with a transform - .zn-fit carries scale(0.885) at 360. A transform
     scales the glyphs with everything else, but getComputedStyle().fontSize
     still reports the authored value, so a 12px line inside a fitted section
     reaches the eye at 12 x 0.85 x 0.885 = 9.03 while the gate called it
     10.2. Rects already carry it, which is why the TARGET gate was right
     about the same elements all along. */
  const fitScale = (el) => {
    let scale = 1
    let node = el
    while (node && node.nodeType === 1) {
      const t = getComputedStyle(node).transform
      if (t && t !== 'none') {
        const m = /matrix\(([^)]+)\)/.exec(t)
        if (m) {
          const p = m[1].split(',').map(Number)
          if (p.length >= 4 && p[0] > 0) scale *= p[0]
        }
      }
      node = node.parentElement
    }
    return scale
  }

  const TAPS = 'a,button,[role="button"],input,select,summary,textarea'
  document.querySelectorAll(TAPS).forEach((el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return
    if (simulated(el)) return
    /* An element that cannot receive a pointer is not a target. */
    if (cs.pointerEvents === 'none') return
    /* WCAG 2.5.8 exempts a target that sits in a sentence or a block of text,
       and it has to: an inline link inherits the line box of the prose around
       it, so enforcing a 32px floor on one would mean setting a 32px line
       height on every paragraph that contains a link. Without this the gate
       reports every text link on every legal page and buries the real
       findings. A link that is display:inline and has text on at least one
       side of it is prose; anything laid out as a control is not. */
    if (cs.display === 'inline' && el.tagName === 'A') {
      /* "In a sentence" means the PARENT holds prose beyond this link, not
         that a bare text node happens to touch it - a link wrapped in <bdi>
         or followed by punctuation in its own element has no adjacent text
         node and was being reported on every legal page. */
      const parent = el.parentElement
      if (parent) {
        const own = (el.textContent || '').trim()
        const around = (parent.textContent || '').trim()
        if (around.length > own.length + 2) return
      }
    }
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    /* r is already rendered. See the note above.

       THE FLOOR DEPENDS ON THE POINTER. WCAG 2.5.8 (AA) asks 24px; 2.5.5
       (AAA) asks 44 and this project holds coarse pointers to 32, which is
       the platform guidance and what every fix in this repo is sized to. A
       flat 32 everywhere reported the breadcrumb trail at 1440, where it is
       deliberately 25.5 - above the 24 a mouse is owed - as a failure. */
    const floor = matchMedia('(pointer: coarse)').matches ? 32 : 24
    const w = r.width, h = r.height
    if (w < floor || h < floor) {
      out.taps.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), w: +w.toFixed(1), h: +h.toFixed(1), floor, text: (el.textContent || '').trim().slice(0, 24) })
    }
  })

  const seen = new Set()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = walker.nextNode())) {
    const t = (n.nodeValue || '').trim()
    if (!t) continue
    const el = n.parentElement
    if (!el || seen.has(el)) continue
    seen.add(el)
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    /* Screen-reader-only text is clipped to a 1px box and painted nowhere, so
       neither its size nor its contrast against an ancestor means anything.
       A <caption class="sr-only"> was reporting 1.03:1 on every run. */
    if (el.closest('.sr-only, [class*="sr-only"], [class*="a11y"]')) continue
    if (simulated(el)) continue
    /* A card peeking out from behind the front one in a swipe stack is
       decorative: SwipeStack marks every card but the current one
       aria-hidden, and those are the ones carrying the deck's scale and tilt.
       The card the reader is actually reading is at scale 1, and it passes. */
    if (el.closest('[aria-hidden="true"]')) continue
    const size = parseFloat(cs.fontSize)
    const rendered = px(size) * fitScale(el)
    if (rendered < 12) {
      out.type.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), css: size, rendered: +rendered.toFixed(2), text: t.slice(0, 24) })
    }
    if (/[؀-ۿ]/.test(t)) {
      const ls = cs.letterSpacing
      if (ls && ls !== 'normal' && Math.abs(parseFloat(ls)) > 0.01) {
        out.tracking.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), ls, text: t.slice(0, 24) })
      }
    }
    // contrast
    const fg = parseRGB(cs.color)
    if (fg) {
      const sel = el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.')
      const bold = parseInt(cs.fontWeight, 10) >= 700
      const large = rendered >= 24 || (rendered >= 18.66 && bold)
      const floor = large ? 3 : 4.5
      const bgs = grounds(el)
      if (bgs === 'indeterminate') {
        out.indeterminate.push({ sel, fg: cs.color, rendered: +rendered.toFixed(1), text: t.slice(0, 24) })
      } else {
        let worst = null
        for (const bg of bgs) {
          const composited = fg.a < 1 ? over(fg, bg) : fg.rgb
          const la = lum(composited), lb = lum(bg)
          const hi = Math.max(la, lb), lo = Math.min(la, lb)
          const cr = (hi + 0.05) / (lo + 0.05)
          if (!worst || cr < worst.cr) worst = { cr, bg }
        }
        if (worst && worst.cr < floor) {
          out.colours.push({ sel, fg: cs.color, bg: 'rgb(' + worst.bg.map((x) => Math.round(x)).join(',') + ')', ratio: +worst.cr.toFixed(2), floor, rendered: +rendered.toFixed(1), text: t.slice(0, 24) })
        }
      }
    }
  }

  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el)
    if ((cs.backgroundImage || '').includes('gradient(')) {
      out.gradients.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), bi: cs.backgroundImage.slice(0, 70) })
    }
  })
  return out
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const findings = []
  for (const w of WIDTHS) {
    /* TOUCH IS EMULATED UP TO 768, AND THE GATE DEPENDS ON IT.
       Several surfaces raise their targets inside @media (pointer: coarse) -
       the breadcrumb trail goes from 30px to 38px there - so a run without
       hasTouch reports those as failures that do not exist on any device that
       can actually tap them. 1440 stays a fine pointer, which is what it is. */
    const coarse = w <= 768
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 2,
      locale: 'ar',
      hasTouch: coarse,
      isMobile: false,
    })
    // ZoomLock reads outerWidth; headless reports it differently from innerWidth,
    // which makes it compute 0.663 instead of 0.85 and every measurement wrong.
    await ctx.addInitScript(() => Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
    // Google Fonts cannot be reached from this sandbox, so every page load
    // sat waiting on a request that was never going to answer. Fonts do not
    // change any measurement this audit takes - sizes, colours and box
    // geometry are all CSS - so they are refused outright.
    await ctx.route('**://fonts.googleapis.com/**', (r) => r.abort())
    await ctx.route('**://fonts.gstatic.com/**', (r) => r.abort())
    const page = await ctx.newPage()
    for (const route of ROUTES) {
      try {
        const resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 })
        await page.waitForTimeout(900)
        const r = await page.evaluate(PROBE)
        findings.push({ route, width: w, status: resp ? resp.status() : 0, ...r })
      } catch (e) {
        findings.push({ route, width: w, error: String(e).slice(0, 160) })
      }
    }
    await ctx.close()
  }
  await browser.close()
  require('fs').writeFileSync(process.argv[2] || 'audit.json', JSON.stringify(findings, null, 1))
  console.log('routes x widths:', findings.length)
})()
