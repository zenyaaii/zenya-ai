'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PRODUCT_TOKENS_CSS } from '@/components/app/tokens'
import { dashFont } from '@/components/app/dash-font'

const STORAGE_KEY = 'zenya_consent'
const STORAGE_VERSION = '1'
/** The same answer as a cookie on .beynoun.com, so the site and the dashboard
 *  (dashboard.beynoun.com, another origin with its own localStorage) ask once. */
const COOKIE = 'beynoun_consent'
const SHARED_DOMAIN = 'beynoun.com'

type Consent = {
  v: string
  necessary: true
  functional: boolean
  analytics: boolean
  marketing: boolean
  ts: number
}

function parse(raw: string | null | undefined): Consent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Consent
    return parsed.v === STORAGE_VERSION ? parsed : null
  } catch {
    return null
  }
}

function readCookie(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

function writeCookie(value: string) {
  const host = window.location.hostname
  const shared = host === SHARED_DOMAIN || host.endsWith('.' + SHARED_DOMAIN)
  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${shared ? `; domain=.${SHARED_DOMAIN}` : ''}${window.location.protocol === 'https:' ? '; Secure' : ''}`
}

function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  let local: Consent | null = null
  try { local = parse(localStorage.getItem(STORAGE_KEY)) } catch {}
  const shared = parse(readCookie())
  // The newer answer wins, wherever it was given.
  const c = local && shared ? (shared.ts > local.ts ? shared : local) : local || shared
  if (c && c !== local) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)) } catch {}
  }
  return c
}

function writeConsent(c: Omit<Consent, 'v' | 'necessary' | 'ts'>) {
  if (typeof window === 'undefined') return
  const next: Consent = { v: STORAGE_VERSION, necessary: true, ts: Date.now(), ...c }
  // Any answer counts as a tap for the shake-to-report: on iPhone it asks for
  // motion here, inside the click (ShakeReport sets this hook; not on customer sites).
  try { (window as unknown as { __beynounMotionAsk?: () => void }).__beynounMotionAsk?.() } catch {}
  const raw = JSON.stringify(next)
  try { localStorage.setItem(STORAGE_KEY, raw) } catch {}
  writeCookie(raw)
  // Notify listeners (analytics loader) of the new state.
  window.dispatchEvent(new CustomEvent('zenya:consent-change', { detail: next }))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [functional, setFunctional] = useState(true)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  /** On the dashboard (html.dash-on) the banner is a slim strip on the dock. */
  const [dash, setDash] = useState(false)
  /** On a «ليل» page the panel follows the page's own light/dark switch. */
  const [mode, setMode] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const rd = document.querySelector('.rd')
    if (!rd) return
    const read = () => setMode(rd.getAttribute('data-mode') === 'light' ? 'light' : 'dark')
    read()
    const mo = new MutationObserver(read)
    mo.observe(rd, { attributes: true, attributeFilter: ['data-mode'] })
    return () => mo.disconnect()
  }, [visible])

  useEffect(() => {
    const h = document.documentElement
    const read = () => setDash(h.classList.contains('dash-on'))
    read()
    const mo = new MutationObserver(read)
    mo.observe(h, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    // Show the banner only if no recorded consent yet.
    const c = readConsent()
    if (!c) setVisible(true)
    // Listen for "open preferences" requests from the footer.
    const onOpen = () => setVisible(true)
    window.addEventListener('zenya:open-consent', onOpen)
    return () => window.removeEventListener('zenya:open-consent', onOpen)
  }, [])

  if (!visible) return null

  function acceptAll() {
    writeConsent({ functional: true, analytics: true, marketing: true })
    setVisible(false)
  }

  function rejectAll() {
    writeConsent({ functional: false, analytics: false, marketing: false })
    setVisible(false)
  }

  function saveChoices() {
    writeConsent({ functional, analytics, marketing })
    setVisible(false)
  }

  if (dash && !showDetails) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: PRODUCT_TOKENS_CSS }} />
        {/* The dashboard's strip: one line, accept, reject, and the gear that
            opens the full choices in the same place. Its look is in
            components/app/dash-theme.ts (html.dash-on .zy-cookie). */}
        <div role="dialog" aria-label="ملفات تعريف الارتباط" aria-describedby="cookie-consent-desc" className="zy-tokens zy-cookie" data-strip="">
          <div className="ck-c">
            <span className="ck-c-t" id="cookie-consent-desc">نستخدم <Link href="/cookies">ملفات الارتباط</Link></span>
            <button type="button" className="ck-btn ck-yes" onClick={acceptAll}>قبول</button>
            <button type="button" className="ck-btn ck-no" onClick={rejectAll}>رفض</button>
            <button type="button" className="ck-btn ck-gear" aria-label="إدارة التفضيلات" onClick={() => setShowDetails(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></svg>
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* «ليل», since 2026-11-02: the night card, paper type, the paprika
          action and pill buttons, the site's own faces. The colours are
          written out here rather than read from the page's tokens, because
          this banner is mounted in the ROOT layout, outside every page's
          root, and must read the same on a page that has no tokens at all.

          Still NO backdrop-blur. A backdrop-filter puts the panel on its own
          compositor layer, and text on a composited layer loses subpixel
          antialiasing, which on Arabic thins the stems and takes the i'jam
          dots with it. This is the first Arabic a first-time visitor reads.
          The card is opaque instead. */}
      <style dangerouslySetInnerHTML={{ __html: LAYL_COOKIE_CSS }} />
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      data-mode={mode}
      className={'ck-ly ' + dashFont.variable}
    >
      <div className="ck-ly-in">
        <div className="ck-ly-copy">
          <h2 id="cookie-consent-title" className="ck-ly-h">
            ملفات تعريف الارتباط في بينون
          </h2>
          <p id="cookie-consent-desc" className="ck-ly-p">
            نستخدم ملفات تعريف ارتباط ضرورية تمامًا لإبقائك مسجَّل الدخول. وبموافقتك
            نودّ أيضًا استخدام ملفات وظيفية وتحليلية لتحسين المنتج. اقرأ المزيد في{' '}
            <Link href="/cookies">سياسة ملفات تعريف الارتباط</Link>{' '}
            و{' '}
            <Link href="/privacy">سياسة الخصوصية</Link>
            .
          </p>

          {showDetails && (
            <div className="ck-ly-opts">
              <div className="ck-ly-opt">
                <input type="checkbox" checked disabled />
                <div>
                  <div className="ck-ly-ot">ضرورية تمامًا</div>
                  <div className="ck-ly-od">لازمة لتسجيل الدخول والدفع والأمان. مفعّلة دائمًا.</div>
                </div>
              </div>
              <Toggle
                label="وظيفية"
                desc="تتذكّر التفضيلات مثل الوضع الداكن والبريد المعبّأ مسبقًا."
                checked={functional}
                onChange={setFunctional}
              />
              <Toggle
                label="تحليلية"
                desc="إحصاءات استخدام مجهولة الهوية لنحسّن المنتج. لا شيء محمَّل اليوم."
                checked={analytics}
                onChange={setAnalytics}
              />
              <Toggle
                label="تسويقية"
                desc="غير مستخدمة حاليًا. لن تُحمَّل إلا بموافقتك الصريحة إن أُضيفت."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}
        </div>

        <div className="ck-ly-acts">
          <button type="button" onClick={acceptAll} className="ck-ly-b ck-ly-yes">
            قبول الكل
          </button>
          <button type="button" onClick={rejectAll} className="ck-ly-b">
            رفض غير الأساسي
          </button>
          {showDetails ? (
            <button type="button" onClick={saveChoices} className="ck-ly-b">
              حفظ اختياراتي
            </button>
          ) : (
            <button type="button" onClick={() => setShowDetails(true)} className="ck-ly-more">
              إدارة التفضيلات
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

/* The «ليل» palette (components/zenya/redesign/base.tsx): night card #1A1713 on
   #0F0D0A, paper type #F4EFE6, stone #A39A8D; on a light page the paper card
   #FFFDF9, ink #16120D, stone #5F574D. Paprika #E2532A carries the one action,
   with #FFFBF7 on it as on the site's own buttons. */
const LAYL_COOKIE_CSS = `
.ck-ly{--c:#1A1713;--c2:#24201A;--i:#F4EFE6;--m:#A39A8D;--l:rgba(244,239,230,.16);--a:#E2532A;--ai:#F07A52;
  position:fixed;inset-inline:12px;bottom:12px;z-index:100;margin-inline:auto;max-width:46rem;
  background:var(--c);color:var(--i);border:1px solid var(--l);border-radius:24px;padding:20px;
  box-shadow:0 1px 2px rgba(0,0,0,.3),0 24px 60px -20px rgba(0,0,0,.65);
  font-family:"Thm Text",var(--font-markazi),"Markazi Text",serif;font-size:17px;line-height:1.65;color-scheme:dark;
  -webkit-font-smoothing:antialiased;animation:ckly-in .7s cubic-bezier(.22,1,.36,1) both}
.ck-ly[data-mode="light"]{--c:#FFFDF9;--c2:#F1EBE1;--i:#16120D;--m:#5F574D;--l:rgba(22,18,13,.14);--ai:#B23A17;color-scheme:light;
  box-shadow:0 1px 2px rgba(22,18,13,.06),0 24px 60px -24px rgba(22,18,13,.3)}
@keyframes ckly-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ck-ly{animation:ckly-fade .4s both}@keyframes ckly-fade{from{opacity:0}to{opacity:1}}}
.ck-ly *,.ck-ly *::before,.ck-ly *::after{box-sizing:border-box}
.ck-ly-in{display:flex;flex-direction:column;gap:16px}
.ck-ly-copy{flex:1;min-width:0}
.ck-ly-h{margin:0;font-family:"Thm Display",var(--font-amiri),"Amiri",serif;font-weight:700;font-size:21px;line-height:1.35}
.ck-ly-p{margin:6px 0 0;color:var(--m);font-size:16px}
.ck-ly a{color:var(--ai);text-decoration:none;border-bottom:1px solid currentColor}
.ck-ly-opts{margin-top:14px;display:grid;gap:10px;padding:14px;border-radius:18px;background:var(--c2);border:1px solid var(--l);font-size:15.5px;line-height:1.55}
.ck-ly-opt,.ck-ly-tg{display:flex;align-items:flex-start;gap:12px}
.ck-ly-tg{cursor:pointer}
.ck-ly-opts input{margin-top:4px;width:18px;height:18px;flex:none;accent-color:var(--a)}
.ck-ly-ot{font-weight:600}
.ck-ly-od{color:var(--m)}
.ck-ly-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ck-ly-b{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 20px;border-radius:999px;
  font:inherit;font-size:16px;font-weight:600;cursor:pointer;color:var(--i);background:transparent;border:1px solid var(--l);transition:border-color .3s,background-color .3s,opacity .3s}
.ck-ly-yes{background:var(--a);border-color:var(--a);color:#FFFBF7}
@media (hover:hover){.ck-ly-b:hover{border-color:var(--a)}.ck-ly-yes:hover{opacity:.9}.ck-ly-more:hover{color:var(--i)}}
.ck-ly-more{min-height:44px;padding:0 8px;font:inherit;font-size:16px;color:var(--m);background:none;border:0;cursor:pointer;text-decoration:underline;text-underline-offset:4px}
.ck-ly :focus-visible{outline:2px solid var(--a);outline-offset:3px}
@media (max-width:520px){.ck-ly-acts .ck-ly-b{flex:1 1 auto}}
@media (min-width:768px){.ck-ly{inset-inline:24px;bottom:24px;padding:22px 24px}.ck-ly-in{flex-direction:row;align-items:flex-start;gap:24px}
  .ck-ly-acts{flex-direction:column;align-items:stretch;flex:none;width:12rem}}
/* The dashboard has no «ليل» root: its own switch (html.dash-dk) picks the card, and the
   full choices open above its dock, as the strip's gear always did. */
html.dash-on:not(.dash-dk) .ck-ly{--c:#FFFDF9;--c2:#F1EBE1;--i:#16120D;--m:#5F574D;--l:rgba(22,18,13,.14);--ai:#B23A17;color-scheme:light}
html.dash-on .ck-ly{z-index:45;bottom:calc(66px + 22px + env(safe-area-inset-bottom,0px));max-height:calc(100dvh - 66px - 22px - 80px);overflow:auto}
`

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="ck-ly-tg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <div className="ck-ly-ot">{label}</div>
        <div className="ck-ly-od">{desc}</div>
      </div>
    </label>
  )
}

/** Read consent from anywhere in the app. Returns null on the server. */
export function getConsent(): Consent | null {
  return readConsent()
}

/** Open the banner programmatically (e.g. from footer link). */
export function openConsent() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('zenya:open-consent'))
}
