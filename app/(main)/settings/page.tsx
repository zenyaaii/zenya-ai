'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { openConsent } from '@/components/CookieConsent'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)
  const [dark, setDark] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    const val = localStorage.getItem('zenya_theme') === 'dark'
    setDark(val)
    document.documentElement.classList.toggle('dark', val)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || null)
      else router.push('/login?next=/settings')
    })
  }, [router, supabase])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('zenya_theme', next ? 'dark' : 'light')
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/account/portal', { method: 'POST' })
      const j = await res.json()
      if (!res.ok || !j.url) {
        // 409 = user never subscribed; nudge them to /pricing instead
        if (res.status === 409) {
          window.location.href = '/dashboard'
          return
        }
        throw new Error(j.message || j.details || 'تعذّر فتح بوابة الفوترة')
      }
      window.location.href = j.url
    } catch (e: any) {
      alert(e.message || 'تعذّر فتح بوابة الفوترة')
      setPortalLoading(false)
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('فشل التصدير')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zenya-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(`تعذّر التصدير: ${e.message || e}`)
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount() {
    if (confirmText !== 'حذف') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.details || 'فشل الحذف')
      }
      await supabase.auth.signOut()
      router.push('/?account_deleted=1')
    } catch (e: any) {
      alert(`تعذّر الحذف: ${e.message || e}`)
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold">الإعدادات</h1>
      <p className="mt-2 text-muted">
        مُسجَّل الدخول باسم <strong>{email || '...'}</strong>
      </p>

      <div className="mt-10 space-y-6">
        {/* Appearance */}
        <Card title="المظهر">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={dark}
              onChange={toggleDark}
              className="h-5 w-5 rounded border-token"
            />
            <span>الوضع الداكن</span>
          </label>
          <p className="mt-2 text-sm text-muted">
            يبدّل الموقع بين الوضع الفاتح والداكن. محفوظ على هذا الجهاز.
          </p>
        </Card>

        {/* Billing */}
        <Card title="الفوترة والفواتير">
          <p className="text-sm text-muted">
            زينيا Pro عبارة عن شراء لمرة واحدة — لا يوجد ما يُلغى. استخدم بوابة Stripe الآمنة لتنزيل فاتورتك أو تحديث تفاصيل الدفع إن اشتريت منّا شيئًا آخر يومًا ما.
          </p>
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="mt-3 inline-flex w-fit items-center gap-2 rounded-md border border-token bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 disabled:opacity-60"
          >
            {portalLoading ? 'جارٍ فتح البوابة…' : 'فتح بوابة Stripe ←'}
          </button>
          <p className="mt-2 text-xs text-muted">
            راجع <Link href="/refund" className="underline">سياسة الاسترداد</Link> لمعرفة تفاصيل الاسترداد.
          </p>
        </Card>

        {/* Privacy & cookies */}
        <Card title="الخصوصية وملفات تعريف الارتباط">
          <div className="space-y-2.5">
            <button
              onClick={openConsent}
              className="block text-sm font-medium text-primary hover:underline"
            >
              إدارة تفضيلات ملفات تعريف الارتباط
            </button>
            <Link
              href="/privacy"
              className="block text-sm font-medium text-primary hover:underline"
            >
              عرض سياسة الخصوصية
            </Link>
            <Link
              href="/terms"
              className="block text-sm font-medium text-primary hover:underline"
            >
              عرض شروط الخدمة
            </Link>
          </div>
        </Card>

        {/* Your data — GDPR */}
        <Card title="بياناتك">
          <p className="text-sm text-muted">
            بموجب اللائحة العامة لحماية البيانات (GDPR)، يحق لك الوصول إلى بياناتك الشخصية وتصديرها وحذفها في أي وقت.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={exportData}
              disabled={exporting}
              className="rounded-md border border-token bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 disabled:opacity-60"
            >
              {exporting ? 'جارٍ التحضير…' : 'تنزيل بياناتي (JSON)'}
            </button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card title="منطقة الخطر" tone="danger">
          <p className="text-sm text-muted">
            احذف نهائيًا حسابك وقوالبك وسجلّ الاستخلاص واشتراكك. تُلغى فوترة Stripe تلقائيًا. ويُحتفظ بسجلّات الفواتير المطلوبة ضريبيًا وفق القانون الهولندي (٧ سنوات). <strong>لا يمكن التراجع عن هذا.</strong>
          </p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="mt-4 rounded-md border border-[#dc2626] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
            >
              حذف حسابي…
            </button>
          ) : (
            <div className="mt-4 space-y-3 rounded-lg border border-[#dc2626] bg-[#fef2f2] p-4">
              <p className="text-sm text-[#7f1d1d]">
                اكتب <strong>حذف</strong> أدناه للتأكيد.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="حذف"
                className="w-full rounded-md border border-token bg-white px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={confirmText !== 'حذف' || deleting}
                  className="rounded-md bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? 'جارٍ الحذف…' : 'حذف الحساب نهائيًا'}
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false)
                    setConfirmText('')
                  }}
                  className="rounded-md border border-token bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}

function Card({
  title,
  tone,
  children,
}: {
  title: string
  tone?: 'danger'
  children: React.ReactNode
}) {
  return (
    <section
      className={`rounded-2xl border bg-elevated p-6 shadow-soft-md ${
        tone === 'danger' ? 'border-[#fecaca]' : 'border-token'
      }`}
    >
      <h2
        className={`mb-3 text-lg font-semibold ${
          tone === 'danger' ? 'text-[#dc2626]' : 'text-foreground'
        }`}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
