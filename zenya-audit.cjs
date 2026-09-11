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
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom || '1') || 1
  const px = (v) => v * zoom
  const out = { zoom, scroll: null, taps: [], type: [], tracking: [], gradients: [], colours: [] }

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
  const solidBg = (el) => {
    const stack = []
    let node = el
    while (node) {
      const c = parseRGB(getComputedStyle(node).backgroundColor)
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break }
      node = node.parentElement
    }
    let base = [250, 250, 250]
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
    return base
  }

  const TAPS = 'a,button,[role="button"],input,select,summary,textarea'
  document.querySelectorAll(TAPS).forEach((el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return
    const w = px(r.width), h = px(r.height)
    if (w < 32 || h < 32) {
      out.taps.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), w: +w.toFixed(1), h: +h.toFixed(1), text: (el.textContent || '').trim().slice(0, 24) })
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
    const size = parseFloat(cs.fontSize)
    const rendered = px(size)
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
      const bg = solidBg(el)
      const composited = fg.a < 1 ? over(fg, bg) : fg.rgb
      const cr = (() => { const la = lum(composited), lb = lum(bg); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05) })()
      const bold = parseInt(cs.fontWeight, 10) >= 700
      const large = rendered >= 24 || (rendered >= 18.66 && bold)
      const floor = large ? 3 : 4.5
      if (cr < floor) {
        out.colours.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'), fg: cs.color, bg: 'rgb(' + bg.map((x) => Math.round(x)).join(',') + ')', ratio: +cr.toFixed(2), floor, rendered: +rendered.toFixed(1), text: t.slice(0, 24) })
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
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, locale: 'ar' })
    // ZoomLock reads outerWidth; headless reports it differently from innerWidth,
    // which makes it compute 0.663 instead of 0.85 and every measurement wrong.
    await ctx.addInitScript(() => Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
    const page = await ctx.newPage()
    for (const route of ROUTES) {
      try {
        const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 })
        await page.waitForTimeout(350)
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
