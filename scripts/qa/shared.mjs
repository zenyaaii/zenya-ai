/**
 * What the QA agent's scripts share: the bundled reference layer (lib/qa,
 * real app code), the in-page probe, and a browser context that looks like a
 * first-time visitor on a phone or a laptop.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'))

let lib = null
/** lib/qa bundled with esbuild (tsconfig paths resolve '@/…'), loaded once. */
export function loadLib() {
  if (lib) return lib
  const cache = path.join(ROOT, 'scripts', 'qa', '.cache')
  fs.mkdirSync(cache, { recursive: true })
  const out = path.join(cache, 'qa-lib.cjs')
  execFileSync(path.join(ROOT, 'node_modules', '.bin', 'esbuild'), [
    path.join(ROOT, 'lib', 'qa', 'index.ts'), '--bundle', '--platform=node', '--format=cjs', `--outfile=${out}`, '--log-level=error', `--tsconfig=${path.join(ROOT, 'tsconfig.json')}`,
  ], { stdio: 'inherit' })
  lib = require(out)
  return lib
}

const PROBE = fs.readFileSync(path.join(ROOT, 'scripts', 'qa', 'probe.js'), 'utf8')
export const PROBE_FN = PROBE.slice(PROBE.indexOf('async function __qaProbe'))
export const probe = (page, opts) => page.evaluate(`(${PROBE_FN})(${JSON.stringify(opts)})`)

export const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

export async function newContext(browser, width, extra = {}) {
  const phone = width < 900
  const ctx = await browser.newContext({
    viewport: { width, height: phone ? 844 : 900 },
    deviceScaleFactor: 1, locale: 'ar', timezoneId: 'Asia/Riyadh',
    isMobile: phone, hasTouch: phone,
    userAgent: phone
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    ...extra,
  })
  // ZoomLock reads outerWidth; headless reports it wrong (docs/zenya-theme-check.md, trap 1)
  await ctx.addInitScript(() => { try { Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }) } catch { /* sealed */ } })
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return ctx
}

/** Collect what goes wrong on a page while it is used. */
export function watch(page) {
  const net = { failed: [], http: [], console: [], pageErrors: [] }
  page.on('requestfailed', (r) => {
    const u = r.url(), f = r.failure()?.errorText || ''
    // ERR_ABORTED is the browser cancelling a request (a lazy frame, a page closing), not a failure
    if (/fonts\.(googleapis|gstatic)/.test(u) || /ERR_ABORTED/.test(f)) return
    net.failed.push({ url: u.slice(0, 200), error: f, type: r.resourceType() })
  })
  page.on('response', (r) => { if (r.status() >= 400 && !/fonts\.(googleapis|gstatic)/.test(r.url())) net.http.push({ url: r.url().slice(0, 200), status: r.status(), type: r.request().resourceType() }) })
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) net.console.push(m.text().slice(0, 240)) })
  page.on('pageerror', (e) => net.pageErrors.push(String(e.message || e).slice(0, 240)))
  return net
}
