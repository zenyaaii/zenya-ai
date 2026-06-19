'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'zenya_consent'
const STORAGE_VERSION = '1'

type Consent = {
  v: string
  necessary: true
  functional: boolean
  analytics: boolean
  marketing: boolean
  ts: number
}

function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Consent
    if (parsed.v !== STORAGE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeConsent(c: Omit<Consent, 'v' | 'necessary' | 'ts'>) {
  if (typeof window === 'undefined') return
  const next: Consent = { v: STORAGE_VERSION, necessary: true, ts: Date.now(), ...c }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  // Notify listeners (analytics loader) of the new state.
  window.dispatchEvent(new CustomEvent('zenya:consent-change', { detail: next }))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [functional, setFunctional] = useState(true)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

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

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-token bg-white/95 p-5 shadow-2xl backdrop-blur-md sm:bottom-6 sm:inset-x-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <h2
            id="cookie-consent-title"
            className="text-[15px] font-semibold text-foreground"
          >
            ملفات تعريف الارتباط في زينيا
          </h2>
          <p
            id="cookie-consent-desc"
            className="mt-1.5 text-[13.5px] leading-[1.6] text-muted"
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
            className="rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            قبول الكل
          </button>
          <button
            onClick={rejectAll}
            className="rounded-md border border-token bg-background px-4 py-2.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-black/5"
          >
            رفض غير الأساسي
          </button>
          {showDetails ? (
            <button
              onClick={saveChoices}
              className="rounded-md border border-token bg-background px-4 py-2.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-black/5"
            >
              حفظ اختياراتي
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="text-[12.5px] text-muted underline hover:text-foreground"
            >
              إدارة التفضيلات
            </button>
          )}
        </div>
      </div>
    </div>
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
