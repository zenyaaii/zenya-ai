'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PRODUCT_TOKENS_CSS } from '@/components/app/tokens'

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
      {/* The declarations the class above needs. On the dashboard AppShell
          already injects them; on every other page nothing does, so the
          banner carries its own copy rather than depending on a shell it is
          not inside. */}
      <style dangerouslySetInnerHTML={{ __html: PRODUCT_TOKENS_CSS }} />
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      /* NO backdrop-blur, and no bg-white/95 behind it.
         A backdrop-filter puts this panel on its own compositor layer, and
         text on a composited layer loses subpixel antialiasing - which on
         Arabic thins the stems by about half a pixel and takes the i'jam dots
         with it. This banner is the first Arabic a first-time visitor reads,
         so it is the last place that should happen. An opaque ground costs
         nothing here: the panel is 5rem tall over whatever it covers, and
         nobody is reading the page through it. */
      /* zy-tokens, because this banner is mounted in the ROOT layout and so
         sits outside .zx-root and .zy-app both. Every colour in it comes
         through border-token, bg-background and text-foreground, and outside
         a scope those resolved to the :root definitions — the old marketing
         cream and the #e5e2d9 border. The banner is on every page of the
         site, so it was the one object still painting the retired palette
         over a restyled page. .zy-tokens exists for exactly this: the
         declarations with none of the shell's layout.

         shadow-2xl also goes. The house rule is elevation by hairline ring,
         and a 25-blur drop shadow under a panel that is already separated
         from the page by being fixed to the bottom of it was never doing
         work. */
      data-open={dash ? '' : undefined}
      className="zy-tokens zy-cookie fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-token bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_0_0_4px_rgba(250,250,250,0.55)] sm:bottom-6 sm:inset-x-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <h2
            id="cookie-consent-title"
            className="text-[15px] font-semibold text-foreground"
          >
            ملفات تعريف الارتباط في بينون
          </h2>
          <p
            id="cookie-consent-desc"
            className="mt-1.5 text-[14.5px] leading-[1.6] text-muted"
          >
            نستخدم ملفات تعريف ارتباط ضرورية تمامًا لإبقائك مسجَّل الدخول. وبموافقتك
            نودّ أيضًا استخدام ملفات وظيفية وتحليلية لتحسين المنتج. اقرأ المزيد في{' '}
            <Link href="/cookies" className="underline hover:text-foreground">
              سياسة ملفات تعريف الارتباط
            </Link>{' '}
            و{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              سياسة الخصوصية
            </Link>
            .
          </p>

          {showDetails && (
            <div className="mt-4 space-y-2.5 rounded-lg border border-token bg-background p-3.5 text-[13px]">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-medium text-foreground">ضرورية تمامًا</div>
                  <div className="text-muted">لازمة لتسجيل الدخول والدفع والأمان. مفعّلة دائمًا.</div>
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

        <div className="flex flex-shrink-0 flex-col gap-2 sm:w-44">
          <button
            onClick={acceptAll}
            className="inline-flex min-h-[38px] items-center justify-center rounded-md bg-primary px-4 py-2.5 text-[14.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            قبول الكل
          </button>
          <button
            onClick={rejectAll}
            className="inline-flex min-h-[38px] items-center justify-center rounded-md border border-token bg-background px-4 py-2.5 text-[14.5px] font-medium text-foreground transition-colors hover:bg-black/5"
          >
            رفض غير الأساسي
          </button>
          {showDetails ? (
            <button
              onClick={saveChoices}
              className="inline-flex min-h-[38px] items-center justify-center rounded-md border border-token bg-background px-4 py-2.5 text-[14.5px] font-medium text-foreground transition-colors hover:bg-black/5"
            >
              حفظ اختياراتي
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="inline-flex min-h-[38px] items-center text-[14.5px] text-muted underline hover:text-foreground"
            >
              إدارة التفضيلات
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

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
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-muted">{desc}</div>
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
