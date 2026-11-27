#!/usr/bin/env node
/**
 * «فاحص بينون» — the QA agent. See docs/qa-agent.md.
 *
 * Opens sites the way a stranger does (a fresh browser, no login, no preview
 * link), reads what each site was built from out of its own page, and checks
 * the rendered page against that reference at phone and laptop widths.
 *
 *   node scripts/qa/agent.mjs --sites targets.json            customer sites (slug list)
 *   node scripts/qa/agent.mjs --url https://x.beynoun.com     one site
 *   node scripts/qa/agent.mjs --own                           beynoun.com's own pages
 *   node scripts/qa/agent.mjs --url https://other.com --facts facts.json --name «اسم»   a competitor's site
 *
 * Options: --out <dir> (default qa-report/<date>) · --widths 390,1440 · --concurrency 3
 *          --google (check name, phone, rating against Google Places; needs GOOGLE_PLACES_API_KEY)
 *          --only <slug,slug> · --limit <n> · --no-shots
 *
 * Gates (each 0–100, and each finding names the element and the page):
 *   1 الألوان           every painted colour explained by the site's palette; palette from the business, not ours
 *   2 التصميم والستايل   overflow, type floor, Arabic tracking, tap targets, text covered by something, fonts, boxes
 *   3 السكشنز والمعلومات  every fact shown, no section without data, no placeholder, no empty box, no duplicate page
 *   4 الطلبات            no failed request, no console error, no broken image, no preview host
 *   5 الأزرار والروابط    WhatsApp / call / map / email go to the right place, internal links open
 *   7 الامتلاء والقوة     how much real information the site carries
 * Gate 6 (entering and leaving the build questions) is scripts/qa/wizard.mjs.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'))

/* ── args ── */
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d }
const OUT = path.resolve(arg('out', path.join(ROOT, 'qa-report', new Date().toISOString().slice(0, 10))))
const WIDTHS = String(arg('widths', '390,1440')).split(',').map(Number)
const CONC = Number(arg('concurrency', 3))
const SHOTS = !argv.includes('--no-shots')
const GOOGLE = argv.includes('--google')
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true })

/* ── the reference layer, bundled from lib/qa (real app code, not a copy) ── */
const CACHE = path.join(ROOT, 'scripts', 'qa', '.cache')
fs.mkdirSync(CACHE, { recursive: true })
const LIB = path.join(CACHE, 'qa-lib.cjs')
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
  path.join(ROOT, 'lib', 'qa', 'index.ts'), '--bundle', '--platform=node', '--format=cjs', `--outfile=${LIB}`, '--log-level=error', `--tsconfig=${path.join(ROOT, 'tsconfig.json')}`,
], { stdio: 'inherit' })
const Q = require(LIB)
const PROBE = fs.readFileSync(path.join(ROOT, 'scripts', 'qa', 'probe.js'), 'utf8')
const PROBE_FN = PROBE.slice(PROBE.indexOf('async function __qaProbe'))

/* ── targets ── */
function targets() {
  if (arg('sites')) {
    const list = JSON.parse(fs.readFileSync(arg('sites'), 'utf8'))
    let t = list.map((x) => ({ id: x.slug || x.id, url: (x.url || `https://${x.slug}.beynoun.com`).replace(/\/$/, ''), meta: x, facts: x.facts || null }))
    if (arg('only')) { const only = String(arg('only')).split(','); t = t.filter((x) => only.includes(x.id)) }
    // sites on a template the site still marks «قريبًا» are left out unless asked for (Anas, 2026-11-27)
    if (!argv.includes('--soon')) {
      const soon = t.filter((x) => Q.SOON_TEMPLATES.includes(x.meta.template))
      if (soon.length) console.log(`تُرك ${soon.length} موقع على قوالب «قريبًا» (${soon.map((x) => x.id).join('، ')}). أضف --soon لفحصها.`)
      t = t.filter((x) => !soon.includes(x))
    }
    if (arg('limit')) t = t.slice(0, Number(arg('limit')))
    return { mode: t.length && t.every((x) => x.facts) ? 'external' : 'customer', list: t }
  }
  if (argv.includes('--own')) {
    // one target per page, so pages are measured side by side instead of one after another
    const base = String(arg('base', 'https://beynoun.com')).replace(/\/$/, '')
    let pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'qa', 'own-pages.json'), 'utf8'))
    if (arg('only')) { const only = String(arg('only')).split(','); pages = pages.filter((p) => only.includes(p)) }
    return { mode: 'own', list: pages.map((p) => ({ id: 'beynoun' + (p === '/' ? '-home' : p.replace(/\//g, '-')), url: base, pages: [p] })) }
  }
  if (arg('url')) {
    const u = String(arg('url'))
    const facts = arg('facts') ? JSON.parse(fs.readFileSync(arg('facts'), 'utf8')) : null
    return { mode: facts ? 'external' : 'customer', list: [{ id: arg('name') ? String(arg('name')) : new URL(u).hostname, url: u.replace(/\/$/, ''), facts }] }
  }
  console.error('Give --sites, --url or --own'); process.exit(2)
}

/* ── one page, one width: load like a visitor, settle, measure ── */
async function visit(ctx, url, width, opts) {
  const page = await ctx.newPage()
  const net = { failed: [], http: [], console: [], pageErrors: [], hosts: new Set(), mixed: [] }
  page.on('requestfailed', (r) => {
    const u = r.url(), f = r.failure()?.errorText || ''
    if (/fonts\.(googleapis|gstatic)/.test(u) || /ERR_ABORTED/.test(f)) return
    net.failed.push({ url: u.slice(0, 200), error: f, type: r.resourceType() })
  })
  page.on('response', (r) => {
    try {
      const u = new URL(r.url()); net.hosts.add(u.host)
      if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(u.host)) net.http.push({ url: r.url().slice(0, 200), status: r.status(), type: r.request().resourceType() })
      if (u.protocol === 'http:' && !/^localhost|127\./.test(u.host)) net.mixed.push(r.url().slice(0, 200))
    } catch { /* not a URL */ }
  })
  page.on('console', (m) => { if (m.type() === 'error') net.console.push(m.text().slice(0, 240)) })
  page.on('pageerror', (e) => net.pageErrors.push(String(e.message || e).slice(0, 240)))

  let status = 0, html = '', loadMs = 0
  const t0 = Date.now()
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    status = resp ? resp.status() : 0
    html = resp ? await resp.text().catch(() => '') : ''
    await page.waitForLoadState('load', { timeout: 20000 }).catch(() => {})
    loadMs = Date.now() - t0
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {})
    // walk down once so every reveal and lazy image has fired, then come back
    await page.evaluate(async () => {
      const H = () => document.documentElement.scrollHeight
      for (let y = 0; y < H(); y += Math.round(innerHeight * 0.7)) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)) }
      window.scrollTo(0, 0)
    }).catch(() => {})
    await page.waitForTimeout(1200)
  } catch (e) {
    net.pageErrors.push('تعذّر فتح الصفحة: ' + String(e.message || e).slice(0, 160))
  }
  let probe = null
  try {
    probe = await page.evaluate(`(${PROBE_FN})(${JSON.stringify({ coarse: width < 900, typeFloor: 12 })})`)
  } catch (e) {
    net.pageErrors.push('تعذّر القياس: ' + String(e.message || e).slice(0, 160))
  }
  // Tabs (a menu's categories, a gallery's filters) draw their panel only when pressed. A visitor
  // presses them, so the agent does: whatever a tab shows counts as shown.
  if (probe) {
    try {
      const before = page.url()
      const n = await page.evaluate(() => {
        const ok = (b) => {
          const t = (b.innerText || '').trim()
          // (a <button> with no type is type=submit by default; only one inside a form submits anything)
          if (!t || t.length > 30 || b.closest('form,dialog,[role=dialog],header,footer') || b.getAttribute('aria-haspopup')) return false
          const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0
        }
        const groups = new Set()
        // customer sites have no <main>; any short button group outside the header, footer, forms and dialogs
        for (const b of document.querySelectorAll('button, [role=tab]')) {
          if (b.closest('nav') && !b.closest('[role=tablist]')) continue
          const sib = [...b.parentElement.children].filter((x) => (x.tagName === 'BUTTON' || x.getAttribute('role') === 'tab') && ok(x))
          if (sib.length >= 2 && ok(b)) groups.add(b.parentElement)
        }
        let i = 0
        for (const g of groups) for (const b of g.children) if ((b.tagName === 'BUTTON' || b.getAttribute('role') === 'tab') && ok(b)) b.setAttribute('data-qa-tab', String(i++))
        return Math.min(i, 16)
      })
      const seenText = []
      for (let i = 0; i < n; i++) {
        await page.click(`[data-qa-tab="${i}"]`, { timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(350)
        if (page.url() !== before) { await page.goBack({ timeout: 15000 }).catch(() => {}); break }
        seenText.push(await page.evaluate(() => document.body.innerText).catch(() => ''))
      }
      if (seenText.length) probe.text += '\n' + seenText.join('\n')
    } catch { /* the page went away */ }
  }
  let shot = null
  if (SHOTS && opts.shot) {
    shot = `${opts.shotName}-${width}.jpg`
    try {
      const h = Math.min(probe?.docH || 3000, 14000)
      await page.setViewportSize({ width, height: Math.min(h, 14000) }).catch(() => {})
      await page.waitForTimeout(400)
      await page.screenshot({ path: path.join(OUT, 'shots', shot), type: 'jpeg', quality: 55, fullPage: false })
      await page.setViewportSize({ width, height: width < 900 ? 844 : 900 }).catch(() => {})
    } catch { shot = null }
  }
  await page.close().catch(() => {})
  return { url, width, status, html, loadMs, probe, net: { ...net, hosts: [...net.hosts] }, shot }
}

async function newContext(browser, width) {
  const phone = width < 900
  const ctx = await browser.newContext({
    viewport: { width, height: phone ? 844 : 900 },
    deviceScaleFactor: 1, locale: 'ar', timezoneId: 'Asia/Riyadh',
    isMobile: phone, hasTouch: phone,
    userAgent: phone
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  })
  // ZoomLock reads outerWidth; headless reports it wrong (docs/zenya-theme-check.md, trap 1)
  await ctx.addInitScript(() => { try { Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }) } catch { /* sealed */ } })
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return ctx
}

/* ── Google: the outside truth for a place ── */
async function googleTruth(placeId) {
  // two names for the key exist in different environments; one may be stale, so try each until one answers
  const keys = [...new Set([process.env.GOOGLE_PLACES_API_KEY, process.env.google_places_api_key].filter(Boolean))]
  if (!keys.length || !placeId) return null
  for (const key of keys) {
    try {
      const out = execFileSync('curl', ['-s', '--max-time', '20', `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ar`,
        '-H', `X-Goog-Api-Key: ${key}`, '-H', 'X-Goog-FieldMask: displayName,internationalPhoneNumber,nationalPhoneNumber,formattedAddress,rating,userRatingCount,businessStatus,regularOpeningHours.weekdayDescriptions'], { encoding: 'utf8' })
      const d = JSON.parse(out)
      if (!d.error) return d
    } catch { /* next key */ }
  }
  return null
}

/* ── judging ── */
const NEUTRAL = { white: '#ffffff', black: '#000000' }
const THIRD_PARTY = { whatsapp: '#25d366', whatsappDark: '#128c7e', googleBlue: '#4285f4', googleRed: '#ea4335', googleYellow: '#fbbc05', googleGreen: '#34a853', star: '#f5b301', star2: '#fbbf24', star3: '#ffc107', instagram: '#e1306c', facebook: '#1877f2', tiktok: '#fe2c55' }

function judge(site, ref, visits, mode, google) {
  const F = [] // findings
  const add = (gate, severity, title, detail = {}) => F.push({ gate, severity, title, ...detail })
  const phone = visits.filter((v) => v.width < 900 && v.probe)
  const all = visits.filter((v) => v.probe)
  const home = all.find((v) => /^https?:\/\/[^/]+\/?$/.test(v.url) && v.width < 900) || all[0]

  /* 1 colours */
  let g1 = 100
  if (ref?.palette) {
    if (mode === 'customer' && ref.palette.source !== 'brand') {
      add(1, 'high', ref.palette.source === 'stock' ? 'ألوان الموقع من ألواننا الجاهزة، لا من المحل' : 'ألوان الموقع ألوان القالب الافتراضية، لا من المحل', { detail: `المجموعة: ${ref.palette.stockMatch || 'افتراضي القالب'}. القاعدة: ألوان كل موقع تُقاس من صور المحل وشعاره.` })
      g1 -= 35
    }
    const palette = { ...ref.palette.colors, ...NEUTRAL }
    let total = 0, unexplained = 0
    const off = new Map(), third = new Map()
    for (const v of phone.concat(all.filter((x) => x.width >= 900))) {
      for (const p of v.probe.paint) {
        if (p.kind === 'gradient') continue
        const c = Q.parseColor(p.hex); if (!c) continue
        total += p.weight
        const e = Q.explain(c, palette, 7)
        if (e.ok) continue
        const tp = Q.explain(c, THIRD_PARTY, 6, null)
        if (tp.ok) { third.set(p.hex, (third.get(p.hex) || 0) + p.weight); continue }
        unexplained += p.weight
        const o = off.get(p.hex) || { hex: p.hex, kind: p.kind, weight: 0, nearest: e.nearest, dE: e.dE, sels: p.sels, pages: new Set() }
        o.weight += p.weight; o.pages.add(new URL(v.url).pathname)
        off.set(p.hex, o)
      }
    }
    const share = total ? unexplained / total : 0
    const offList = [...off.values()].sort((a, b) => b.weight - a.weight)
    for (const o of offList.slice(0, 8)) {
      const pct = total ? Math.round((o.weight / total) * 1000) / 10 : 0
      if (pct < 0.05) continue
      add(1, pct > 2 ? 'high' : pct > 0.3 ? 'medium' : 'low', `لون من خارج هوية الموقع ${o.hex}`, { detail: `${kindAr(o.kind)} — يغطي ${pct}% من الرسم. أقرب لون في الهوية: ${o.nearest} (فرق ${o.dE}).`, where: o.sels.slice(0, 2).join(' | '), pages: [...o.pages].slice(0, 4) })
    }
    if (third.size) add(1, 'info', 'ألوان علامات خارجية (واتساب، جوجل، النجوم)', { detail: [...third.keys()].slice(0, 6).join(' ') })
    g1 -= Math.round(Math.min(45, share * 300))
    // one button colour across the site
    const btns = new Set()
    for (const v of all) for (const b of v.probe.boxes || []) { /* boxes are containers, not buttons */ }
    void btns
  }

  /* 2 design & style — one finding per kind of problem, counted by distinct offenders across the site */
  let g2 = 100
  const issues = new Map()
  // kind → { severity, title, unit penalty, cap }; the penalty grows with distinct offenders and stops at the cap
  const KINDS = {
    overflow: { severity: 'high', title: 'الصفحة تتحرك يمينًا ويسارًا (تمرير جانبي)', base: 15, per: 0, cap: 15 },
    small: { severity: 'medium', title: 'نص أصغر من 12px', base: 2, per: 0.5, cap: 10 },
    tracking: { severity: 'medium', title: 'تباعد حروف على نص عربي (يكسر وصل الحروف)', base: 4, per: 0.5, cap: 6 },
    taps: { severity: 'medium', title: 'أزرار أو روابط أصغر من حجم الإصبع', base: 2, per: 0.5, cap: 8 },
    covered: { severity: 'high', title: 'نص يغطيه عنصر آخر', base: 5, per: 2, cap: 15 },
    contrast: { severity: 'medium', title: 'نص ضعيف التباين', base: 3, per: 0.5, cap: 12 },
    fixed: { severity: 'medium', title: 'أشرطة ثابتة تغطي جزءًا كبيرًا من شاشة الجوال', base: 6, per: 0, cap: 6 },
    fonts: { severity: 'low', title: 'خطوط كثيرة في صفحة واحدة', base: 4, per: 0, cap: 4 },
    boxes: { severity: 'high', title: 'مربعات خارج نظام مربعات الإحصائيات', base: 4, per: 0.5, cap: 25 },
    gradients: { severity: 'medium', title: 'تدرجات لونية', base: 3, per: 0.5, cap: 6 },
    broken: { severity: 'high', title: 'كلمة مكسورة على سطرين داخل زر أو رابط', base: 5, per: 1, cap: 10 },
  }
  const issue = (kind, page, items, extra = {}) => {
    const K = KINDS[kind]
    const it = issues.get(kind) || { kind, severity: K.severity, title: K.title, pages: [], items: new Map(), where: '', ...extra }
    if (!it.pages.includes(page)) it.pages.push(page)
    for (const x of items) if (!it.items.has(x.key)) it.items.set(x.key, x)
    if (!it.where && items[0]?.sel) it.where = items[0].sel
    if (extra.boxes) it.boxes = (it.boxes || []).concat(extra.boxes).slice(0, 60)
    issues.set(kind, it)
  }
  for (const v of all) {
    const p = v.probe, where = `${new URL(v.url).pathname} @${v.width}`
    if (p.overflow.scrollW > p.overflow.clientW + 1) issue('overflow', where, [{ key: p.overflow.widest?.sel || 'page', label: `أعرض من الشاشة بـ ${p.overflow.scrollW - p.overflow.clientW}px`, sel: p.overflow.widest?.sel }])
    if (p.smallText.length) issue('small', where, p.smallText.map((x) => ({ key: x.t + x.px, label: `«${x.t}» ${x.px}px`, sel: x.sel })))
    if (p.arabicTracking.length) issue('tracking', where, p.arabicTracking.map((x) => ({ key: x.t, label: `«${x.t}» ${x.ls}`, sel: x.sel })))
    if (p.brokenWords?.length) issue('broken', where, p.brokenWords.map((x) => ({ key: x.t, label: `«${x.t}» في عرض ${x.w}px`, sel: x.sel })))
    if (p.smallTaps.length) issue('taps', where, p.smallTaps.map((x) => ({ key: (x.text || x.sel) + x.w + 'x' + x.h, label: `«${x.text || '؟'}» ${x.w}×${x.h}`, sel: x.sel })))
    if (p.covered.length) issue('covered', where, p.covered.map((x) => ({ key: x.text + '|' + x.by, label: `«${x.text}» تحت ${x.by.split(' > ').pop()}`, sel: x.sel })))
    if (p.lowContrast.length) issue('contrast', where, p.lowContrast.map((x) => ({ key: x.t + x.fg + x.bg, label: `«${x.t}» ${x.ratio}:1 (${x.fg} على ${x.bg})`, sel: x.sel })))
    const bigFixed = p.fixed.filter((x) => x.share >= 12)
    const fixedShare = bigFixed.reduce((a, x) => a + x.share, 0)
    if (v.width < 900 && fixedShare >= 28) issue('fixed', where, bigFixed.map((x) => ({ key: x.sel, label: `${x.sel.split(' > ').pop()} ${x.share}%`, sel: x.sel })))
    const fams = Object.entries(p.fonts).filter(([, n]) => n > 30).map(([f]) => f)
    if (fams.length > 3) issue('fonts', where, fams.map((f) => ({ key: f, label: f })))
    if (mode === 'own') {
      // the boxes as they stood on 2026-11-27 are kept by decision (Q.ACCEPTED_OWN_BOXES); only new or changed ones count
      const bad = (p.boxes || []).map((b) => ({ b, probs: Q.boxProblems(b) })).filter((x) => x.probs.length && !Q.acceptedOwnBox(x.b.sel, x.probs))
      if (bad.length) issue('boxes', where, bad.map((x) => ({ key: x.b.sel + x.probs[0], label: `${x.b.sel.split(' > ').pop()}: ${x.probs[0]}`, sel: x.b.sel })),
        { boxes: bad.slice(0, 40).map((x) => ({ page: where, sel: x.b.sel, w: x.b.w, h: x.b.h, y: x.b.y, radius: x.b.radius, bg: x.b.bg, problems: x.probs })) })
      const grads = p.gradients.filter((g) => !Q.acceptedOwnGradient(g.sel))
      if (grads.length) issue('gradients', where, grads.map((g) => ({ key: g.sel, label: g.sel.split(' > ').pop(), sel: g.sel })))
    }
  }
  for (const it of issues.values()) {
    const K = KINDS[it.kind], n = it.items.size
    const items = [...it.items.values()]
    add(2, it.kind === 'taps' && it.pages.every((x) => / @1[0-9]{3}$/.test(x)) ? 'low' : it.severity, `${it.title} (${n})`, {
      detail: items.slice(0, 4).map((x) => x.label).join('، '), where: it.where, pages: it.pages, examples: items.slice(0, 12).map((x) => x.label), ...(it.boxes ? { boxes: it.boxes } : {}),
    })
    g2 -= Math.min(K.cap, K.base + K.per * Math.max(0, n - 1))
  }

  /* 3 sections & information */
  let g3 = 100
  const texts = all.map((v) => ({ path: new URL(v.url).pathname, width: v.width, t: Q.norm(v.probe.text), raw: v.probe.text, digits: (v.probe.text.match(/[\d٠-٩][\d٠-٩\s+\-]{5,}/g) || []).map((d) => d.replace(/[^\d٠-٩]/g, '')), links: v.probe.links }))
  const siteText = texts.map((x) => x.t).join('\n')
  const homeText = texts.filter((x) => x.path === '/').map((x) => x.t).join('\n')
  let factW = 0, shownW = 0
  const missing = []
  for (const f of ref?.facts || []) {
    factW += f.weight
    let ok = false
    if (f.kind === 'phone') {
      const hay = texts.flatMap((x) => x.digits.concat(x.links.filter((l) => /^(tel:|https?:\/\/(wa\.me|api\.whatsapp))/.test(l.href || '')).map((l) => l.href)))
      ok = f.any.some((p) => hay.some((h) => Q.samePhone(h, p)))
    } else {
      const scope = f.home ? homeText || siteText : siteText
      ok = f.any.some((v) => { const n = Q.norm(v); return n.length >= 2 && scope.includes(n) })
    }
    if (ok) shownW += f.weight
    else missing.push(f)
  }
  const factPct = factW ? Math.round((shownW / factW) * 100) : 100
  if (missing.length) {
    const byGroup = {}
    for (const m of missing) (byGroup[m.group] ||= []).push(m.label)
    for (const [g, labels] of Object.entries(byGroup)) add(3, labels.some((l) => /اسم|رقم/.test(l)) ? 'high' : 'medium', `معلومات موجودة في البيانات ولا تظهر: ${g} (${labels.length})`, { detail: labels.slice(0, 5).join('، ') })
  }
  g3 = Math.round(factPct * 0.6) + 40
  for (const a of ref?.absent || []) {
    const shown = all.flatMap((v) => v.probe.headings).find((h) => a.headings.some((re) => re.test(Q.norm(h.t)) || re.test(h.t.trim())))
    if (shown) { add(3, 'high', `قسم «${shown.t}» ظاهر بلا بيانات`, { detail: a.because }); g3 -= 10 }
  }
  for (const r of ref?.forbidden || Q.referenceFor({ businessType: 'x', content: {} }).forbidden) {
    const hit = texts.find((x) => r.pattern.test(x.raw))
    if (hit) { const m = hit.raw.match(r.pattern); add(3, r.severity, r.label, { detail: `«${(m && m[0]) || ''}»`, pages: [hit.path] }); g3 -= r.severity === 'high' ? 12 : r.severity === 'medium' ? 5 : 2 }
  }
  const hidden = new Map()
  // phones only: on a laptop a hover can reveal what a finger never will
  for (const v of phone) for (const h of v.probe.neverShown || []) if (!hidden.has(h.t)) hidden.set(h.t, { ...h, page: new URL(v.url).pathname, width: v.width })
  if (hidden.size) { const hs = [...hidden.values()]; add(3, 'high', `محتوى لا يراه زائر الجوال أبدًا (${hs.length})`, { detail: hs.slice(0, 4).map((h) => `«${h.t}»`).join('، ') + ' — موجود في الصفحة لكنه يبقى شفافًا حتى بعد التمرير إليه (يظهر بمرور الفأرة فقط، والجوال بلا فأرة)', where: hs[0].sel, pages: [...new Set(hs.map((h) => h.page))].slice(0, 5), examples: hs.slice(0, 12).map((h) => h.t) }); g3 -= Math.min(15, 4 + hs.length) }
  const empties = all.flatMap((v) => v.probe.emptyBoxes.map((b) => ({ ...b, page: new URL(v.url).pathname, width: v.width })))
  if (empties.length) { add(3, 'medium', `صناديق فارغة بلا محتوى (${empties.length})`, { detail: empties.slice(0, 3).map((b) => `${b.sel.split(' > ').pop()} ${b.w}×${b.h}`).join('، '), where: empties[0].sel }); g3 -= Math.min(10, empties.length * 2) }
  // duplicate pages: two addresses showing the same words
  const byText = new Map()
  for (const x of texts.filter((t) => t.width < 900)) { const k = x.t.length + ':' + x.t.slice(0, 400); (byText.get(k) || byText.set(k, []).get(k)).push(x.path) }
  for (const paths of byText.values()) if (paths.length > 1) { add(3, 'medium', `صفحات مكررة بنفس المحتوى (${paths.length})`, { detail: paths.join('، ') + ' — نفس الصفحة بعناوين مختلفة، جوجل يعدّها تكرارًا' }); g3 -= 6 }
  // English left in an Arabic page
  const latinWords = (siteText.match(/\b[a-z][a-z'’]{2,}\b/g) || []).filter((w) => !/^(https?|www|com|net|org|beynoun|gmail|hotmail|outlook|instagram|facebook|tiktok|whatsapp|google|maps|snapchat)$/.test(w))
  // Latin words the business itself gave us (its name, reviewers' names, reviews written in English)
  // are its own; the ones that matter came from the template
  const values = []
  const walkValues = (v, d = 0) => { if (d > 8 || v == null) return; if (typeof v === 'string') { if (!/^(https?:|data:|\/|#)/.test(v)) values.push(v) } else if (Array.isArray(v)) v.forEach((x) => walkValues(x, d + 1)); else if (typeof v === 'object') Object.values(v).forEach((x) => walkValues(x, d + 1)) }
  walkValues(site.content)
  const own = new Set((Q.norm(values.join(' ')).match(/\b[a-z][a-z'’]{2,}\b/g) || []))
  const latinName = Q.norm(ref?.name || '') + ' ' + Q.norm((site.meta && site.meta.latin) || (site.facts && site.facts.latin) || '')
  const stray = latinWords.filter((w) => !latinName.includes(w) && !own.has(w))
  const allWords = siteText.split(/\s+/).length || 1
  if (stray.length / allWords > 0.03 && stray.length > 8) {
    const freq = {}; for (const w of stray) freq[w] = (freq[w] || 0) + 1
    add(3, 'medium', `كلمات إنجليزية من القالب في موقع عربي (${stray.length})`, { detail: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w).join(' ') }); g3 -= 6
  }
  // pictures that are not the business: stock libraries, and Google photos linked straight from Google
  // (their addresses expire, so they break; copying them is against Google's terms)
  if (site.content) {
    const pics = new Set()
    const walkPics = (v, d = 0) => { if (d > 8 || !v) return; if (typeof v === 'string') { if (/^https?:\/\//.test(v) && /(unsplash\.com|pexels\.com|pixabay\.com|googleusercontent\.com)/i.test(v)) pics.add(v) } else if (Array.isArray(v)) v.forEach((x) => walkPics(x, d + 1)); else if (typeof v === 'object') Object.values(v).forEach((x) => walkPics(x, d + 1)) }
    walkPics(site.content)
    const stock = [...pics].filter((u) => /unsplash|pexels|pixabay/i.test(u)), hot = [...pics].filter((u) => /googleusercontent/i.test(u))
    if (stock.length) { add(3, 'high', `صور من مكتبة صور عامة، ليست صور المحل (${stock.length})`, { detail: `الزائر يرى مكانًا ليس مكان المحل. مثال: ${stock[0].slice(0, 90)}`, examples: stock.slice(0, 6) }); g3 -= Math.min(20, 8 + stock.length) }
    if (hot.length) { add(3, 'medium', `صور مربوطة من جوجل مباشرة (${hot.length})`, { detail: 'روابط صور جوجل تنتهي صلاحيتها فتنكسر الصورة، ونسخها مخالف لشروط جوجل', examples: hot.slice(0, 3).map((u) => u.slice(0, 90)) }); g3 -= 4 }
    site._stockPics = stock.length
  }
  for (const c of ref?.claims || []) add(3, 'medium', c.label, { detail: `«${c.text}» — ${c.why}` })
  if ((ref?.claims || []).length) g3 -= Math.min(15, ref.claims.length * 3)
  if (google) {
    const gname = google.displayName?.text || ''
    if (google.businessStatus && google.businessStatus !== 'OPERATIONAL') { add(3, 'high', 'المحل مغلق في جوجل', { detail: google.businessStatus }); g3 -= 20 }
    const gp = google.internationalPhoneNumber || google.nationalPhoneNumber
    const sp = ref?.facts.find((f) => f.kind === 'phone')?.any[0]
    if (gp && sp && !Q.samePhone(gp, sp)) { add(3, 'high', 'رقم الهاتف في الموقع غير رقم جوجل', { detail: `الموقع ${sp} · جوجل ${gp}` }); g3 -= 10 }
    const rating = site.content?.google?.rating
    if (google.rating && rating && Math.abs(google.rating - rating) >= 0.2) add(3, 'medium', 'تقييم جوجل في الموقع قديم', { detail: `الموقع ${rating} · جوجل الآن ${google.rating} (${google.userRatingCount} تقييم)` })
    if (gname && ref?.name && !Q.norm(gname).includes(Q.norm(ref.name).split(' ')[0])) add(3, 'info', 'اسم الموقع يختلف عن اسم جوجل', { detail: `الموقع «${ref.name}» · جوجل «${gname}»` })
  }

  /* 4 requests */
  let g4 = 100
  const seen = new Set()
  for (const v of visits) {
    const where = `${new URL(v.url).pathname} @${v.width}`
    if (v.status >= 400 || v.status === 0) { add(4, 'high', `الصفحة لا تفتح (${v.status || 'لا رد'})`, { pages: [where] }); g4 -= 30 }
    for (const h of v.net.http) { const k = 'h' + h.url; if (seen.has(k)) continue; seen.add(k); const own = /beynoun\.com|supabase\.co/.test(h.url); add(4, own ? 'high' : 'low', `طلب فشل ${h.status} (${typeAr(h.type)})`, { detail: h.url, pages: [where] }); g4 -= own ? 8 : 2 }
    for (const h of v.net.failed) { const k = 'f' + h.url; if (seen.has(k)) continue; seen.add(k); add(4, 'medium', `طلب لم يكتمل (${typeAr(h.type)})`, { detail: `${h.url} — ${h.error}`, pages: [where] }); g4 -= 4 }
    for (const e of v.net.pageErrors) {
      const hyd = /react\.dev\/errors\/(418|419|420|421|422|423|425)|Hydration|hydrat/i.test(e)
      const k = hyd ? 'hydration' : 'e' + e; if (seen.has(k)) continue; seen.add(k)
      if (hyd) { add(4, 'medium', 'الصفحة تُرسم مرتين (خطأ مطابقة بين الخادم والمتصفح)', { detail: `${e.slice(0, 90)} — الزائر لا يرى خطأ، لكن الصفحة تُعاد من الصفر في المتصفح فتبطؤ وقد يتغير النص لحظة الفتح`, pages: [where] }); g4 -= 6 }
      else { add(4, 'high', 'خطأ برمجي في الصفحة', { detail: e, pages: [where] }); g4 -= 10 }
    }
    for (const e of v.net.console.filter((m) => !/Failed to load resource/.test(m))) { const k = 'c' + e.slice(0, 80); if (seen.has(k)) continue; seen.add(k); add(4, 'low', 'خطأ في الكونسول', { detail: e, pages: [where] }); g4 -= 2 }
    for (const b of v.probe?.images.broken || []) { const k = 'b' + b.src; if (seen.has(k)) continue; seen.add(k); add(4, 'high', 'صورة مكسورة', { detail: b.src, where: b.sel, pages: [where] }); g4 -= 8 }
    const preview = v.net.hosts.filter((h) => /vercel\.app$/.test(h))
    if (preview.length && !seen.has('preview')) { seen.add('preview'); add(4, 'high', 'الموقع يطلب من رابط بريفيو', { detail: preview.join('، '), pages: [where] }); g4 -= 10 }
    if (v.net.mixed.length && !seen.has('mixed')) { seen.add('mixed'); add(4, 'medium', 'طلبات غير آمنة http', { detail: v.net.mixed.slice(0, 2).join('، '), pages: [where] }); g4 -= 5 }
  }

  /* 5 actions */
  let g5 = 100
  const links = all.flatMap((v) => v.probe.links.map((l) => ({ ...l, page: new URL(v.url).pathname })))
  const wa = links.filter((l) => /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(l.href || ''))
  const tel = links.filter((l) => /^tel:/i.test(l.href || ''))
  const maps = links.filter((l) => /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google|maps\.apple\.com|waze\.com/i.test(l.href || ''))
  const expWa = ref?.actions?.whatsapp || ref?.actions?.phone
  if (expWa) {
    if (!wa.length && ref.actions.whatsapp) { add(5, 'high', 'لا يوجد زر واتساب مع أن رقم الواتساب في البيانات', { detail: `الرقم: ${ref.actions.whatsapp}` }); g5 -= 20 }
    else if (!wa.length) { add(5, 'medium', 'لا يوجد زر واتساب', { detail: `في البيانات رقم هاتف فقط (${ref.actions.phone}) ولا رقم واتساب — الزائر العربي يراسل قبل أن يتصل` }); g5 -= 8 }
    const wrong = wa.filter((l) => { const d = (/wa\.me\/(\d+)/.exec(l.href) || /phone=(\d+)/.exec(l.href) || [])[1]; return d && !Q.samePhone(d, expWa) && !(ref.actions.phone && Q.samePhone(d, ref.actions.phone)) })
    if (wrong.length) { add(5, 'high', 'زر واتساب يذهب لرقم آخر', { detail: wrong.slice(0, 2).map((l) => `«${l.text}» → ${l.href}`).join('، '), pages: [wrong[0].page] }); g5 -= 25 }
    const noNum = wa.filter((l) => !/wa\.me\/\d|phone=\d/.test(l.href))
    if (noNum.length) { add(5, 'medium', 'زر واتساب بلا رقم', { detail: noNum[0].href, pages: [noNum[0].page] }); g5 -= 8 }
  }
  if (ref?.actions?.phone) {
    if (!tel.length) { add(5, 'medium', 'لا يوجد زر اتصال', { detail: `الرقم في البيانات: ${ref.actions.phone}` }); g5 -= 8 }
    const wrong = tel.filter((l) => !Q.samePhone(l.href, ref.actions.phone) && !(ref.actions.whatsapp && Q.samePhone(l.href, ref.actions.whatsapp)))
    if (wrong.length) { add(5, 'high', 'زر الاتصال يتصل برقم آخر', { detail: wrong.slice(0, 2).map((l) => l.href).join('، ') }); g5 -= 20 }
  }
  if (ref?.actions?.maps && !maps.length) { add(5, 'medium', 'لا يوجد رابط للخريطة', { detail: 'العنوان موجود ولا يوجد زر «افتح في الخرائط»' }); g5 -= 8 }
  if (ref?.actions?.email) {
    const mail = links.filter((l) => /^mailto:/i.test(l.href || ''))
    if (mail.length && !mail.some((l) => l.href.toLowerCase().includes(ref.actions.email.toLowerCase()))) { add(5, 'medium', 'زر البريد يذهب لعنوان آخر', { detail: mail[0].href }); g5 -= 8 }
  }
  const dead = links.filter((l) => l.href === '#' || l.href === '' || /^javascript:/i.test(l.href))
  if (dead.length) { add(5, 'medium', `روابط لا تذهب لأي مكان (${dead.length})`, { detail: dead.slice(0, 4).map((l) => `«${l.text || '؟'}»`).join('، '), pages: [dead[0].page] }); g5 -= Math.min(12, dead.length * 3) }
  const unlabeled = all.flatMap((v) => v.probe.buttons.filter((b) => !b.text))
  if (unlabeled.length) { add(5, 'low', `أزرار بلا اسم (${unlabeled.length})`, { detail: 'قارئ الشاشة لا يعرف ما تفعله', where: unlabeled[0].sel }); g5 -= 3 }
  site._internal = [...new Set(links.filter((l) => { try { const u = new URL(l.abs); return u.host === new URL(site.url).host && !u.hash } catch { return false } }).map((l) => l.abs.split('#')[0]))].slice(0, 25)

  /* 7 fill & strength */
  const inv = ref?.inventory || {}
  const want = { 'الخدمات': 3, 'المنتجات': 3, 'القائمة': 8, 'الأسعار': 1, 'التقييمات': 3, 'الصور': 6, 'ساعات العمل': 1, 'الخريطة': 1, 'الفريق': 1, 'الأسئلة': 2, 'القصة': 1 }
  const relevant = Object.keys(want).filter((k) => k in inv)
  const filled = relevant.filter((k) => inv[k] >= want[k])
  const thin = relevant.filter((k) => inv[k] < want[k])
  const words = home?.probe?.words || 0
  const imgs = home?.probe?.images.visible || 0
  let g7 = relevant.length ? Math.round((filled.length / relevant.length) * 70) : 35
  g7 += Math.min(15, Math.round(words / 40)) + Math.min(15, imgs * 2)
  if (thin.length) add(7, thin.length >= 3 ? 'medium' : 'low', `أقسام ضعيفة المعلومات (${thin.length})`, { detail: thin.map((k) => `${k}: ${inv[k] || 0} من ${want[k]}`).join('، ') })

  // colour discipline, measured the same way on every site: how many distinct colours (ΔE ≥ 5 apart)
  // it takes to cover 95% of what the pages paint, and how many different button fills there are
  const merged = new Map()
  for (const v of all) for (const p of v.probe.paint) { if (p.kind === 'gradient') continue; merged.set(p.hex, (merged.get(p.hex) || 0) + p.weight) }
  const clusters = []
  for (const [hx, w] of [...merged.entries()].sort((a, b) => b[1] - a[1])) {
    const c = Q.parseColor(hx); if (!c) continue
    const near = clusters.find((k) => Q.dE(k.c, c) < 5)
    if (near) near.w += w; else clusters.push({ hex: hx, c, w })
  }
  const totalW = clusters.reduce((a, k) => a + k.w, 0) || 1
  let acc = 0, n95 = 0
  for (const k of clusters) { if (acc / totalW >= 0.95) break; acc += k.w; n95++ }
  const colorStats = { colors95: n95, colorsAll: clusters.length, top: clusters.slice(0, 8).map((k) => ({ hex: k.hex, pct: Math.round((k.w / totalW) * 1000) / 10 })) }

  const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)))
  const gates = { 1: clamp(g1), 2: clamp(g2), 3: clamp(g3), 4: clamp(g4), 5: clamp(g5), 7: clamp(g7) }
  const W = { 1: 1, 2: 1, 3: 1.5, 4: 1, 5: 1.2, 7: 1 }
  const overall = clamp(Object.entries(gates).reduce((a, [k, v]) => a + v * W[k], 0) / Object.values(W).reduce((a, b) => a + b, 0))
  return { gates, overall, findings: F, factPct, inventory: inv, words, images: imgs, colorStats }
}

const kindAr = (k) => ({ bg: 'خلفية', text: 'لون نص', border: 'حد', icon: 'أيقونة', gradient: 'تدرج' }[k] || k)
const typeAr = (t) => ({ image: 'صورة', script: 'سكربت', stylesheet: 'ستايل', fetch: 'طلب بيانات', xhr: 'طلب بيانات', document: 'صفحة', font: 'خط', media: 'وسائط' }[t] || t)

/* ── a whole site ── */
async function auditSite(browser, site, mode) {
  const started = Date.now()
  const visits = []
  const phoneCtx = await newContext(browser, WIDTHS[0])
  const firstPath = mode === 'own' ? site.pages[0] : '/'
  const first = await visit(phoneCtx, site.url + firstPath, WIDTHS[0], { shot: true, shotName: safe(site.id) })
  visits.push(first)
  let props = null, ref = null
  if (mode === 'customer') {
    props = Q.sitePropsFromHtml(first.html)
    if (props) ref = Q.referenceFor(props)
  } else if (mode === 'external' && site.facts) {
    ref = externalRef(site.facts)
  } else if (mode === 'own') {
    ref = { name: 'بينون', pages: site.pages.map((p) => ({ path: p, label: p })), facts: [], absent: [], forbidden: [], palette: { colors: Q.BEYNOUN_PALETTE, source: 'brand' }, actions: {}, claims: [], inventory: {} }
  }
  let pages = (ref?.pages || [{ path: '/' }]).map((p) => p.path).filter((p) => p !== firstPath)
  if (mode === 'external' && !(site.facts && site.facts.pages) && first.probe) {
    const host = new URL(site.url).host
    const want = /(about|contact|menu|categor|product|collection|من-نحن|تواصل|القائمة|المنيو|منتجات|اتصل)/i
    const inner = [...new Set(first.probe.links.map((l) => { try { const u = new URL(l.abs); return u.host === host && u.pathname.length > 1 && !/\.(jpg|png|pdf)$/i.test(u.pathname) ? u.pathname : null } catch { return null } }).filter(Boolean))]
    pages = inner.filter((p) => want.test(decodeURIComponent(p))).concat(inner.filter((p) => !want.test(decodeURIComponent(p)))).slice(0, 4)
    if (ref) ref.pages = [{ path: '/' }, ...pages.map((p) => ({ path: p, label: p }))]
  }
  for (const p of pages) visits.push(await visit(phoneCtx, site.url + p, WIDTHS[0], { shot: mode === 'own', shotName: safe(site.id + p) }))
  await phoneCtx.close()
  for (const w of WIDTHS.slice(1)) {
    const ctx = await newContext(browser, w)
    visits.push(await visit(ctx, site.url + firstPath, w, { shot: true, shotName: safe(site.id) }))
    if (mode === 'own') for (const p of pages) visits.push(await visit(ctx, site.url + p, w, { shot: true, shotName: safe(site.id + p) }))
    await ctx.close()
  }
  const google = GOOGLE && props?.content?.google?.place_id ? await googleTruth(props.content.google.place_id) : null
  site.content = props?.content
  const res = judge(site, ref, visits, mode, google)
  // internal links: every same-site address must open
  const req = await browser.newContext().then((c) => c.request)
  for (const u of site._internal || []) {
    try { const r = await req.get(u, { timeout: 20000, maxRedirects: 5 }); if (r.status() >= 400) res.findings.push({ gate: 5, severity: 'high', title: `رابط داخلي لا يفتح (${r.status()})`, detail: u }) } catch (e) { res.findings.push({ gate: 5, severity: 'medium', title: 'رابط داخلي لم يرد', detail: u }) }
  }
  return {
    id: site.id, url: site.url, mode, template: ref?.template || props?.businessType || null, niche: ref?.niche || null, name: ref?.name || site.id,
    paletteSource: ref?.palette?.source || null, stockMatch: ref?.palette?.stockMatch || null, palette: ref?.palette?.colors || null,
    ...res,
    pages: visits.map((v) => ({ url: v.url, width: v.width, status: v.status, loadMs: v.loadMs, words: v.probe?.words || 0, shot: v.shot, fixed: v.probe?.fixed, fonts: v.probe?.fonts })),
    google: google ? { name: google.displayName?.text, rating: google.rating, count: google.userRatingCount, status: google.businessStatus } : null,
    ms: Date.now() - started,
  }
}

/** A competitor's page has no flight data: its facts come from what we asked them to build. */
function externalRef(f) {
  const facts = []
  let n = 0
  const add = (group, label, values, kind = 'text', home = false, weight = 1) => { const any = values.filter(Boolean); if (any.length) facts.push({ id: `x${++n}`, group, label, any, kind, home, weight }) }
  add('الأساسيات', 'الاسم', [f.name, f.latin], 'text', true, 3)
  add('التواصل', 'الهاتف', [f.phone], 'phone', false, 3)
  if (f.address) add('التواصل', 'العنوان', [f.address, f.area, f.city], 'text', false, 2)
  for (const s of f.services || []) add('الخدمات', `خدمة: ${s}`, [s])
  for (const p of f.prices || []) add('الأسعار', `سعر: ${p}`, [p])
  for (const r of f.reviews || []) add('التقييمات', 'تقييم', [r.split(/\s+/).slice(0, 6).join(' ')])
  return {
    template: 'external', name: f.name, pages: (f.pages || ['/']).map((p) => ({ path: p, label: p })), facts, absent: [], forbidden: Q.referenceFor({ businessType: 'x', content: {} }).forbidden,
    palette: f.palette ? { colors: f.palette, source: 'brand' } : null, actions: { whatsapp: f.whatsapp || f.phone, phone: f.phone, maps: !!f.address }, claims: [],
    // only what we were told: an inventory of zeros would score their sections against our data
    inventory: Object.fromEntries([['الخدمات', f.services], ['الأسعار', f.prices], ['التقييمات', f.reviews]].filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length])),
  }
}

const safe = (s) => String(s).replace(/[^a-z0-9._-]+/gi, '_').slice(0, 80)

/* ── run ── */
const { mode, list } = targets()
console.log(`«فاحص بينون» — ${list.length} موقع، الوضع ${mode}، العروض ${WIDTHS.join('/')}، → ${OUT}`)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const results = []
let next = 0
async function worker() {
  while (next < list.length) {
    const site = list[next++]
    try {
      const r = await auditSite(browser, site, mode)
      results.push(r)
      fs.writeFileSync(path.join(OUT, `${safe(site.id)}.json`), JSON.stringify(r, null, 1))
      const bad = r.findings.filter((f) => f.severity === 'high').length
      console.log(`${String(results.length).padStart(3)}/${list.length} ${site.id.padEnd(34)} ${String(r.overall).padStart(3)}  [${Object.entries(r.gates).map(([k, v]) => `${k}:${v}`).join(' ')}]  ${bad} عالية  ${Math.round(r.ms / 1000)}s`)
    } catch (e) {
      console.log(`!! ${site.id}: ${e.message}`)
      results.push({ id: site.id, url: site.url, error: String(e.message || e) })
    }
  }
}
await Promise.all(Array.from({ length: Math.min(CONC, list.length) }, worker))
await browser.close()
const summary = { generatedAt: new Date().toISOString(), mode, widths: WIDTHS, count: results.length, results: results.map(({ findings, ...r }) => ({ ...r, high: (findings || []).filter((f) => f.severity === 'high').length, medium: (findings || []).filter((f) => f.severity === 'medium').length })) }
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1))
console.log(`تم. ${results.length} موقع → ${path.join(OUT, 'summary.json')}`)
