#!/usr/bin/env node
/**
 * «فاحص بينون» — gate 6: entering and leaving the build questions.
 *
 * Walks every build wizard the way a new customer does: answers each step
 * with plain test answers, presses «التالي» to the end, then checks the way
 * back — «السابق» keeps the answers, the step rail jumps, a reload brings the
 * draft back, «رجوع» on the first step leaves to a page that opens. On every
 * step it also runs the probe (overflow, covered text, tap targets, colours
 * and boxes against Beynoun's own system) and records errors and failed
 * requests. It never presses the final build button and never fills a link
 * field, so nothing is read, scraped or charged.
 *
 *   node scripts/qa/wizard.mjs [--out dir] [--widths 390,1440] [--only barber-build,…]
 *   node scripts/qa/wizard.mjs --storage state.json     (a signed-in test account, for /theme/new/*)
 */
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, loadLib, launch, newContext, probe, watch } from './shared.mjs'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d }
const OUT = path.resolve(arg('out', path.join(ROOT, 'qa-report', new Date().toISOString().slice(0, 10), 'wizards')))
const WIDTHS = String(arg('widths', '390,1440')).split(',').map(Number)
const STORAGE = arg('storage')
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true })
const Q = loadLib()

const BASE = arg('base', 'https://beynoun.com')
const WIZARDS = [
  { id: 'barber-build', path: '/demo/barber-build', label: 'الحلاق (عرض)' },
  { id: 'beauty-build', path: '/demo/beauty-build', label: 'التجميل والسبا (عرض)' },
  { id: 'car-build', path: '/demo/car-build', label: 'السيارات (عرض)' },
  { id: 'gym-build', path: '/demo/gym-build', label: 'النادي (عرض)' },
  { id: 'photo-build', path: '/demo/photo-build', label: 'استوديو التصوير (عرض)' },
  { id: 'build', path: '/demo/build', label: 'المطعم (عرض)' },
  ...(STORAGE ? [
    { id: 'new-restaurant', path: '/theme/new/restaurant', label: 'المطعم' },
    { id: 'new-barber', path: '/theme/new/services?kind=barber', label: 'الحلاق' },
    { id: 'new-gym', path: '/theme/new/services?kind=gym', label: 'النادي' },
    { id: 'new-beauty', path: '/theme/new/services?kind=beauty', label: 'التجميل' },
    { id: 'new-car', path: '/theme/new/services?kind=car', label: 'السيارات' },
    { id: 'new-photo', path: '/theme/new/services?kind=photo', label: 'التصوير' },
    { id: 'new-services', path: '/theme/new/services?kind=other', label: 'الخدمات العامة' },
    { id: 'new-wellness', path: '/theme/new/wellness', label: 'العافية' },
    { id: 'new-studio', path: '/theme/new/studio', label: 'العلامة التجارية' },
  ] : []),
].filter((w) => !arg('only') || String(arg('only')).split(',').includes(w.id))

/** A plain test answer for a field, from its label — or null to leave it empty. */
function answerFor(label, type, tag) {
  const l = (label || '').trim()
  if (/رابط|إنستغرام|انستغرام|تيك|سناب|فيسبوك|فيس بوك|يوتيوب|موقعك الحالي|متجر|http|link|url|@your/i.test(l)) return null
  if (type === 'file' || type === 'checkbox' || type === 'radio' || type === 'time' || type === 'color' || type === 'range') return null
  if (type === 'email' || /بريد|email/i.test(l)) return 'qa-wizard@beynoun.com'
  if (type === 'tel' || /هاتف|جوال|واتساب|رقم/.test(l)) return '+447700900123' // Ofcom's range for fiction: never a real person's number
  if (/مدينة/.test(l)) return 'عمّان'
  if (/منطقة|حي/.test(l)) return 'الصويفية'
  if (/عنوان/.test(l)) return 'شارع فاحص بينون 1'
  if (/سعر|السعر|ثمن/.test(l)) return '10'
  if (/مدة|المدة/.test(l)) return '30 دقيقة'
  if (/سنة|منذ|تأسس/.test(l)) return '2015'
  if (/لاتيني|بالإنجليزية|english/i.test(l)) return 'Fahis Test'
  if (/اسم/.test(l)) return 'محل فاحص بينون'
  if (type === 'number') return '10'
  if (tag === 'TEXTAREA') return 'نص قصير من فاحص بينون لاختبار الأسئلة فقط.'
  return 'اختبار'
}

async function stepState(page) {
  return page.evaluate(() => {
    const c = document.querySelector('.zb-count')?.textContent || ''
    const m = /(\d+)\s*من\s*(\d+)/.exec(c.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    return {
      n: m ? Number(m[1]) : 0, of: m ? Number(m[2]) : 0,
      title: document.querySelector('.zb-h2')?.textContent?.trim() || '',
      note: document.querySelector('.zb-nav-note')?.textContent?.trim() || '',
      warn: document.querySelector('.zb-nav-note')?.getAttribute('data-warn') === 'true',
      last: !!document.querySelector('.zb-go'),
      final: document.querySelector('.zb-go')?.textContent?.trim().slice(0, 40) || '',
    }
  }).catch(() => ({ n: 0, of: 0, title: '', note: '', warn: false, last: false, final: '' }))
}

/** Answer every empty visible field on this step. Returns {label: value} of what it wrote. */
async function fillStep(page) {
  const fields = await page.$$('.zb-stage input, .zb-stage textarea, .zb-stage select')
  const wrote = {}
  for (const f of fields) {
    try {
      if (!(await f.isVisible())) continue
      const info = await f.evaluate((el) => ({
        tag: el.tagName, type: el.type, value: el.value, ph: el.placeholder || '',
        label: el.closest('label')?.querySelector('.zb-lab')?.textContent || el.getAttribute('aria-label') || el.closest('.zb-f')?.querySelector('.zb-lab')?.textContent || el.placeholder || '',
        disabled: el.disabled || el.readOnly,
      }))
      if (info.disabled || (info.value && info.tag !== 'SELECT')) continue
      if (info.tag === 'SELECT') {
        const opts = await f.evaluate((el) => Array.from(el.options).map((o) => o.value))
        if (!info.value && opts.length > 1) { await f.selectOption(opts[1]); wrote[info.label] = opts[1] }
        continue
      }
      const v = answerFor(info.label + ' ' + info.ph, info.type, info.tag)
      if (v == null) continue
      await f.fill(v)
      wrote[(info.label || info.ph).trim()] = v
    } catch { /* a field that went away while we typed */ }
  }
  return wrote
}

async function measure(page, width, where) {
  try {
    // a wizard step is one short screen with no reveal-on-scroll: skip the sweep
    const p = await probe(page, { coarse: width < 900, typeFloor: 12, maxElements: 4000, noSweep: true })
    const out = []
    if (p.overflow.scrollW > p.overflow.clientW + 1) out.push({ severity: 'high', title: 'تمرير جانبي في الأسئلة', detail: p.overflow.widest?.sel || '', where })
    if (p.covered.length) out.push({ severity: 'high', title: `نص يغطيه عنصر آخر (${p.covered.length})`, detail: p.covered.slice(0, 2).map((x) => `«${x.text}» تحت ${x.by.split(' > ').pop()}`).join('، '), where })
    if (p.smallTaps.length) out.push({ severity: 'medium', title: `أزرار أصغر من الإصبع (${p.smallTaps.length})`, detail: p.smallTaps.slice(0, 3).map((x) => `«${x.text || '؟'}» ${x.w}×${x.h}`).join('، '), where })
    if (p.smallText.length) out.push({ severity: 'medium', title: `نص أصغر من 12px (${p.smallText.length})`, detail: p.smallText.slice(0, 3).map((x) => `«${x.t}» ${x.px}px`).join('، '), where })
    if (p.lowContrast.length) out.push({ severity: 'medium', title: `نص ضعيف التباين (${p.lowContrast.length})`, detail: p.lowContrast.slice(0, 3).map((x) => `«${x.t}» ${x.ratio}:1 (${x.fg} على ${x.bg})`).join('، '), where })
    // Beynoun's own surface: its palette and its boxes
    const off = []
    for (const c of p.paint) {
      if (c.kind === 'gradient') continue
      const rgb = Q.parseColor(c.hex); if (!rgb) continue
      const e = Q.explain(rgb, Q.BEYNOUN_PALETTE, 7)
      if (!e.ok && c.weight > 200) off.push(`${c.hex} (${c.sels[0]?.split(' > ').pop() || ''})`)
    }
    if (off.length) out.push({ severity: 'medium', title: `ألوان من خارج نظام بينون (${off.length})`, detail: off.slice(0, 5).join('، '), where })
    const bad = p.boxes.map((b) => ({ b, probs: Q.boxProblems(b) })).filter((x) => x.probs.length)
    if (bad.length) out.push({ severity: 'medium', title: `مربعات خارج نظام مربعات الإحصائيات (${bad.length})`, detail: bad.slice(0, 3).map((x) => `${x.b.sel.split(' > ').pop()}: ${x.probs[0]}`).join(' · '), where, boxes: bad.slice(0, 20).map((x) => ({ sel: x.b.sel, w: x.b.w, h: x.b.h, radius: x.b.radius, problems: x.probs })) })
    return out
  } catch (e) { return [{ severity: 'low', title: 'تعذّر القياس', detail: String(e.message || e).slice(0, 120), where }] }
}

async function kindPicker(page, wz, F) {
  const sheet = () => page.locator('[role=dialog][aria-modal=true]').filter({ has: page.locator('button') }).first()
  if (!(await sheet().isVisible().catch(() => false))) return null
  const home = new URL(BASE + wz.path).pathname
  const labels = await sheet().locator('button').evaluateAll((bs) => bs
    .filter((b) => !/إغلاق|close/i.test(b.getAttribute('aria-label') || '') && (b.innerText || '').trim())
    .map((b) => (b.innerText || '').trim().split('\n')[0].trim()).slice(0, 4))
  const went = []
  for (const [i, label] of labels.entries()) {
    if (i) { await page.goto(BASE + wz.path, { waitUntil: 'load', timeout: 60000 }).catch(() => {}); await page.waitForTimeout(1500) }
    await sheet().locator('button', { hasText: label }).first().click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(2000)
    const u = new URL(page.url())
    if (u.pathname === home) { await page.waitForSelector('.zb-count', { timeout: 15000 }).catch(() => {}); return { chose: label, url: u.pathname + u.search, others: went } }
    went.push(`«${label}» ← ${u.pathname}${u.search}`)
  }
  // nothing keeps the visitor here: come back and close the sheet to reach this wizard's own questions
  await page.goto(BASE + wz.path, { waitUntil: 'load', timeout: 60000 }).catch(() => {}); await page.waitForTimeout(1500)
  await sheet().locator('button[aria-label*="إغلاق"], button[aria-label*="close" i]').first().click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(2000)
  const closed = new URL(page.url())
  if (closed.pathname !== home) {
    // closing leaves too: nobody reaches this wizard's own questions (often on purpose, when a wizard was folded into others)
    F.push({ severity: 'medium', title: `لا أحد يصل إلى أسئلة ${wz.label} نفسها`, detail: `كل خيارات «مشروعك أيّ واحد؟» تنقل إلى معالج آخر (${went.join('، ')})، وزر الإغلاق يعود إلى ${closed.pathname}.` })
    return { chose: null, others: went, closedTo: closed.pathname, unreachable: true }
  }
  await page.waitForSelector('.zb-count', { timeout: 15000 }).catch(() => {})
  F.push({ severity: 'medium', title: 'كل خيارات «مشروعك أيّ واحد؟» تنقل إلى معالج آخر', detail: `${went.join('، ')}. أسئلة ${wz.label} نفسها لا تظهر إلا بعد إغلاق النافذة.` })
  return { chose: null, others: went }
}

async function walk(browser, wz, width) {
  const ctx = await newContext(browser, width, STORAGE ? { storageState: STORAGE } : {})
  const page = await ctx.newPage()
  const net = watch(page)
  const F = []
  const log = []
  const t0 = Date.now()
  const resp = await page.goto(BASE + wz.path, { waitUntil: 'load', timeout: 60000 }).catch((e) => { F.push({ severity: 'high', title: 'صفحة الأسئلة لا تفتح', detail: String(e.message).slice(0, 120) }); return null })
  if (!resp) { await ctx.close(); return { id: wz.id, width, findings: F, log } }
  if (resp.status() >= 400) F.push({ severity: 'high', title: `صفحة الأسئلة ترد ${resp.status()}`, detail: wz.path })
  await page.waitForSelector('.zb-count', { timeout: 20000 }).catch(() => F.push({ severity: 'high', title: 'لم تظهر الخطوة الأولى', detail: page.url() }))
  await page.waitForTimeout(800)
  // A visitor meets the cookie banner first. If it sits on «التالي», that is a finding; then answer it as a person would.
  const coveredNext = await page.evaluate(() => {
    const b = document.querySelector('.zb-next'); if (!b) return null
    const r = b.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) return null
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return hit && !b.contains(hit) ? (hit.closest('[id],[class]')?.id || hit.closest('[class]')?.className || hit.tagName).toString().slice(0, 60) : null
  }).catch(() => null)
  if (coveredNext) F.push({ severity: 'high', title: 'شريط الكوكيز يغطي زر «التالي» عند فتح الأسئلة', detail: `العنصر الذي فوق الزر: ${coveredNext}`, where: `خطوة 1 @${width}` })
  for (const label of ['رفض', 'ضرورية فقط', 'قبول الكل', 'موافق', 'قبول']) {
    const btn = page.locator('button', { hasText: label }).first()
    if (await btn.isVisible().catch(() => false)) { await btn.click().catch(() => {}); await page.waitForTimeout(500); break }
  }
  // Some wizards open on a «مشروعك أيّ واحد؟» sheet first. A visitor answers it, so the agent does too: it takes
  // the first choice that keeps the visitor in this wizard and records where the others went. When every
  // choice leads to another wizard, this wizard's own questions open only behind the close button.
  const picked = await kindPicker(page, wz, F)
  if (picked) log.push({ picker: picked })
  if (picked?.unreachable) { await ctx.close(); return { id: wz.id, label: wz.label, width, steps: 0, reached: 0, finalLabel: '', loadMs: Date.now() - t0, exitTo: BASE + picked.closedTo, log, findings: F } }
  const first = await stepState(page)
  const loadMs = Date.now() - t0
  const answers = {}
  let s = first, guard = 0
  const seen = new Set()
  while (guard++ < 20) {
    const where = `خطوة ${s.n} «${s.title}» @${width}`
    log.push({ n: s.n, of: s.of, title: s.title, note: s.note, warn: s.warn })
    if (!seen.has(s.n)) {
      seen.add(s.n)
      F.push(...await measure(page, width, where))
      if (width < 900) await page.screenshot({ path: path.join(OUT, 'shots', `${wz.id}-${s.n}-${width}.jpg`), type: 'jpeg', quality: 55 }).catch(() => {})
    }
    if (s.last) break
    const wrote = await fillStep(page)
    answers[s.n] = wrote
    const before = s.n
    const tNext = Date.now()
    await page.click('.zb-next', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(700)
    s = await stepState(page)
    if (s.n === before) {
      // a required answer is missing: try the skip the wizard offers, and say why it held us
      const why = s.note
      const skip = await page.$('.zb-skip')
      if (skip) { await skip.click().catch(() => {}); await page.waitForTimeout(600); s = await stepState(page) }
      if (s.n === before) {
        F.push({ severity: 'high', title: `الأسئلة توقفت عند الخطوة ${before}`, detail: `«${s.title}» — الملاحظة: «${why}». جرّب الفاحص ملء: ${Object.keys(wrote).join('، ') || 'لا شيء'}`, where })
        break
      }
    } else if (Date.now() - tNext > 4000) {
      F.push({ severity: 'medium', title: 'الانتقال للخطوة التالية بطيء', detail: `${Math.round((Date.now() - tNext) / 100) / 10} ث`, where })
    }
  }
  const reached = s.n
  const finalLabel = s.final
  // the way back: «السابق» keeps what was typed
  if (reached > 2) {
    await page.click('.zb-back').catch(() => {})
    await page.waitForTimeout(600)
    const back = await stepState(page)
    if (back.n !== reached - 1) F.push({ severity: 'high', title: 'زر «السابق» لا يرجع خطوة', detail: `من ${reached} إلى ${back.n}` })
    // jump to step 2 from the rail, check one answer is still there
    const rail = await page.$$('.zb-step')
    if (rail[1]) {
      await rail[1].click().catch(() => {})
      await page.waitForTimeout(600)
      const two = await stepState(page)
      if (two.n !== 2) F.push({ severity: 'medium', title: 'شريط الخطوات لا ينقل للخطوة المختارة', detail: `ضغطت الخطوة 2 فصارت ${two.n}` })
      const kept = answers[2] || {}
      const firstKey = Object.keys(kept)[0]
      if (firstKey) {
        const still = await page.evaluate((v) => Array.from(document.querySelectorAll('.zb-stage input, .zb-stage textarea')).some((i) => i.value === v), kept[firstKey])
        if (!still) F.push({ severity: 'high', title: 'الإجابات ضاعت عند الرجوع', detail: `«${firstKey}» كانت «${kept[firstKey]}»` })
        // a reload: the draft must come back
        await page.reload({ waitUntil: 'load' }).catch(() => {})
        await page.waitForSelector('.zb-count', { timeout: 15000 }).catch(() => {})
        await page.waitForTimeout(1200)
        const afterReload = await stepState(page)
        const restored = await page.evaluate((v) => Array.from(document.querySelectorAll('.zb-stage input, .zb-stage textarea')).some((i) => i.value === v), kept[firstKey])
        let restoredSomewhere = restored
        if (!restored && afterReload.n !== 2) {
          const r2 = await page.$$('.zb-step'); if (r2[1]) { await r2[1].click().catch(() => {}); await page.waitForTimeout(600) }
          restoredSomewhere = await page.evaluate((v) => Array.from(document.querySelectorAll('.zb-stage input, .zb-stage textarea')).some((i) => i.value === v), kept[firstKey])
        }
        if (!restoredSomewhere) F.push({ severity: 'medium', title: 'إعادة تحميل الصفحة تمسح الإجابات', detail: 'العميل الذي يغلق الصفحة بالخطأ يبدأ من الصفر' })
        log.push({ reload: { step: afterReload.n, restored: restoredSomewhere } })
      }
    }
  }
  // leaving: «رجوع» on step 1 must take the visitor somewhere that opens
  const r1 = await page.$$('.zb-step'); if (r1[0]) { await r1[0].click().catch(() => {}); await page.waitForTimeout(500) }
  const before = page.url()
  const exitBtn = await page.$('.zb-back')
  let exitTo = null
  if (exitBtn) {
    await Promise.all([page.waitForURL((u) => u.toString() !== before, { timeout: 8000 }).catch(() => {}), exitBtn.click().catch(() => {})])
    await page.waitForTimeout(800)
    exitTo = page.url()
    if (exitTo === before) {
      const st = await stepState(page)
      if (st.n >= 1) F.push({ severity: 'medium', title: 'زر «رجوع» في أول خطوة لا يُخرج من الأسئلة', detail: before })
    }
  }
  for (const e of net.pageErrors) F.push({ severity: 'high', title: 'خطأ برمجي أثناء الأسئلة', detail: e })
  for (const e of net.console.slice(0, 5)) F.push({ severity: 'low', title: 'خطأ في الكونسول', detail: e })
  for (const h of net.http.slice(0, 8)) F.push({ severity: /beynoun|supabase/.test(h.url) ? 'high' : 'low', title: `طلب فشل ${h.status}`, detail: h.url })
  await ctx.close()
  return { id: wz.id, label: wz.label, width, steps: first.of, reached, finalLabel, loadMs, exitTo, log, findings: F }
}

const browser = await launch()
const results = []
for (const wz of WIZARDS) for (const w of WIDTHS) {
  const r = await walk(browser, wz, w)
  results.push(r)
  const hi = r.findings.filter((f) => f.severity === 'high').length
  console.log(`${wz.id.padEnd(16)} @${w}  ${r.reached}/${r.steps} خطوات  ${r.findings.length} ملاحظة (${hi} عالية)  الخروج → ${r.exitTo || '—'}`)
}
await browser.close()
fs.writeFileSync(path.join(OUT, 'wizards.json'), JSON.stringify(results, null, 1))
console.log('→', path.join(OUT, 'wizards.json'))
