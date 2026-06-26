'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { openConsent } from '@/components/CookieConsent'
import {
  User,
  Lock,
  CreditCard,
  Shield,
  Database,
  AlertTriangle,
  ChevronRight,
  Check,
  Loader2,
  Sun,
} from 'lucide-react'

/* ── Tiny utilities ──────────────────────────────────────────────── */

type Status = 'idle' | 'loading' | 'success' | 'error'

function useStatus(duration = 3000) {
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  function set(s: Status, m = '') {
    setStatus(s)
    setMsg(m)
    if (s === 'success' || s === 'error') {
      setTimeout(() => setStatus('idle'), duration)
    }
  }

  return { status, msg, set }
}

/* ── Sub-components ──────────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  tone,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: ReactNode
  tone?: 'danger'
}) {
  return (
    <section
      className={`rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        tone === 'danger' ? 'border-red-200' : 'border-[#e8e5de]'
      }`}
    >
      <div className={`flex items-start gap-4 border-b p-6 ${tone === 'danger' ? 'border-red-100' : 'border-[#f0ede6]'}`}>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            tone === 'danger' ? 'bg-red-50 text-red-500' : 'bg-[#f0ede6] text-[#5e6ad2]'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className={`text-[15px] font-semibold ${tone === 'danger' ? 'text-red-600' : 'text-foreground'}`}>
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted/60 transition focus:border-[#5e6ad2] focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]/20 disabled:opacity-50 ${props.className ?? ''}`}
    />
  )
}

function SaveButton({
  status,
  label = 'حفظ التغييرات',
}: {
  status: Status
  label?: string
}) {
  return (
    <button
      type="submit"
      disabled={status === 'loading' || status === 'success'}
      className="inline-flex items-center gap-2 rounded-xl bg-[#5e6ad2] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#4f5ab8] disabled:opacity-60"
    >
      {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === 'success' && <Check className="h-4 w-4" />}
      {status === 'success' ? 'تم الحفظ!' : status === 'loading' ? 'جارٍ الحفظ…' : label}
    </button>
  )
}

function Feedback({ status, msg }: { status: Status; msg: string }) {
  if (status !== 'error' || !msg) return null
  return (
    <p className="mt-2 text-[13px] text-red-600">{msg}</p>
  )
}

/* ── Main page ───────────────────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [dark, setDark] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // form states
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const profileStatus = useStatus()
  const emailStatus = useStatus()
  const passwordStatus = useStatus()

  useEffect(() => {
    const val = localStorage.getItem('zenya_theme') === 'dark'
    setDark(val)
    document.documentElement.classList.toggle('dark', val)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?next=/settings'); return }
      setEmail(user.email || '')
      setNewEmail(user.email || '')
      const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setFullName(name)
      setNewName(name)
    })
  }, [router, supabase])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('zenya_theme', next ? 'dark' : 'light')
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    profileStatus.set('loading')
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName } })
    if (error) { profileStatus.set('error', error.message); return }
    setFullName(newName)
    profileStatus.set('success')
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault()
    if (newEmail === email) { emailStatus.set('success'); return }
    emailStatus.set('loading')
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) { emailStatus.set('error', error.message); return }
    emailStatus.set('success', 'أُرسل بريد تأكيد إلى عنوانك الجديد.')
  }

  async function sendPasswordReset() {
    if (!email) return
    passwordStatus.set('loading')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { passwordStatus.set('error', error.message); return }
    passwordStatus.set('success')
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/account/portal', { method: 'POST' })
      const j = await res.json()
      if (!res.ok || !j.url) {
        if (res.status === 409) { window.location.href = '/dashboard'; return }
        throw new Error(j.message || 'تعذّر فتح بوابة الفوترة')
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
    <main className="mx-auto max-w-2xl px-6 py-16" dir="rtl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[32px] font-bold tracking-tight text-foreground">الإعدادات</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          مُسجَّل الدخول باسم <span className="font-medium text-foreground">{email || '…'}</span>
        </p>
      </div>

      <div className="space-y-5">
        {/* ── Profile ── */}
        <Section icon={User} title="الملف الشخصي" subtitle="اسمك الظاهر في حسابك">
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="الاسم الكامل">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اكتب اسمك هنا"
              />
            </Field>
            <div className="flex items-center gap-3">
              <SaveButton status={profileStatus.status} />
              <Feedback status={profileStatus.status} msg={profileStatus.msg} />
              {profileStatus.status === 'success' && (
                <span className="text-[13px] text-emerald-600">تم الحفظ بنجاح</span>
              )}
            </div>
          </form>
        </Section>

        {/* ── Email ── */}
        <Section icon={User} title="البريد الإلكتروني" subtitle="عنوان بريدك المستخدم لتسجيل الدخول">
          <form onSubmit={saveEmail} className="space-y-4">
            <Field label="البريد الإلكتروني">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
              />
            </Field>
            <div className="flex items-center gap-3">
              <SaveButton status={emailStatus.status} label="تغيير البريد" />
              {emailStatus.status === 'success' && (
                <span className="text-[13px] text-emerald-600">
                  {emailStatus.msg || 'أُرسل بريد تأكيد إلى عنوانك الجديد.'}
                </span>
              )}
              <Feedback status={emailStatus.status} msg={emailStatus.msg} />
            </div>
          </form>
        </Section>

        {/* ── Password ── */}
        <Section icon={Lock} title="كلمة المرور" subtitle="أرسِل لنفسك رابط إعادة تعيين آمن">
          <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
            سنرسل رابطًا إلى <span className="font-medium text-foreground">{email}</span> لإعادة تعيين كلمة مرورك.
          </p>
          <button
            type="button"
            onClick={sendPasswordReset}
            disabled={passwordStatus.status === 'loading' || passwordStatus.status === 'success'}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition hover:bg-[#f0ede6] disabled:opacity-60"
          >
            {passwordStatus.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {passwordStatus.status === 'success' && <Check className="h-4 w-4 text-emerald-500" />}
            {passwordStatus.status === 'success' ? 'تم إرسال الرابط!' : 'إرسال رابط إعادة التعيين'}
          </button>
          <Feedback status={passwordStatus.status} msg={passwordStatus.msg} />
        </Section>

        {/* ── Appearance ── */}
        <Section icon={Sun} title="المظهر" subtitle="يبقى الإعداد على هذا الجهاز فقط">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-4 py-3">
            <span className="text-[14px] font-medium text-foreground">الوضع الداكن</span>
            <div
              onClick={toggleDark}
              className={`relative h-6 w-11 rounded-full transition-colors ${dark ? 'bg-[#5e6ad2]' : 'bg-[#d4d1ca]'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${dark ? '-translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          </label>
        </Section>

        {/* ── Billing ── */}
        <Section icon={CreditCard} title="الفوترة والفواتير" subtitle="زينيا Pro — شراء لمرة واحدة، لا اشتراك">
          <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
            استخدم بوابة Stripe الآمنة لتنزيل فواتيرك أو تحديث تفاصيل الدفع. راجع{' '}
            <Link href="/refund" className="text-[#5e6ad2] hover:underline">سياسة الاسترداد</Link>{' '}
            لمعرفة تفاصيل الاسترجاع.
          </p>
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition hover:bg-[#f0ede6] disabled:opacity-60"
          >
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 rotate-180" />}
            {portalLoading ? 'جارٍ الفتح…' : 'فتح بوابة Stripe'}
          </button>
        </Section>

        {/* ── Privacy ── */}
        <Section icon={Shield} title="الخصوصية والأمان">
          <ul className="divide-y divide-[#f0ede6]">
            {[
              { label: 'إدارة ملفات تعريف الارتباط', onClick: openConsent },
            ].map(({ label, onClick }) => (
              <li key={label}>
                <button
                  onClick={onClick}
                  className="flex w-full items-center justify-between py-3 text-[13.5px] font-medium text-foreground transition hover:text-[#5e6ad2]"
                >
                  {label}
                  <ChevronRight className="h-4 w-4 rotate-180 text-muted" />
                </button>
              </li>
            ))}
            {[
              { href: '/privacy', label: 'سياسة الخصوصية' },
              { href: '/terms', label: 'شروط الخدمة' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center justify-between py-3 text-[13.5px] font-medium text-foreground transition hover:text-[#5e6ad2]"
                >
                  {label}
                  <ChevronRight className="h-4 w-4 rotate-180 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Data export ── */}
        <Section icon={Database} title="بياناتك" subtitle="تصدير نسخة كاملة من بياناتك (GDPR)">
          <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
            بموجب اللائحة العامة لحماية البيانات يحق لك تنزيل جميع بياناتك الشخصية في أي وقت.
          </p>
          <button
            onClick={exportData}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition hover:bg-[#f0ede6] disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {exporting ? 'جارٍ التحضير…' : 'تنزيل بياناتي (JSON)'}
          </button>
        </Section>

        {/* ── Danger zone ── */}
        <Section icon={AlertTriangle} title="منطقة الخطر" tone="danger">
          <p className="mb-4 text-[13.5px] leading-relaxed text-muted">
            احذف نهائيًا حسابك وقوالبك وسجل الاستخلاص. تُلغى فوترة Stripe تلقائيًا. يُحتفظ
            بسجلات الفواتير المطلوبة ضريبيًا (٧ سنوات).{' '}
            <strong className="text-red-700">لا يمكن التراجع عن هذا.</strong>
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-xl border border-red-300 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-red-600 transition hover:bg-red-50"
            >
              حذف حسابي…
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-[13.5px] text-red-800">
                اكتب <strong>حذف</strong> أدناه للتأكيد.
              </p>
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="حذف"
                className="bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={confirmText !== 'حذف' || deleting}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'جارٍ الحذف…' : 'حذف الحساب نهائيًا'}
                </button>
                <button
                  onClick={() => { setShowDelete(false); setConfirmText('') }}
                  className="rounded-xl border border-[#e8e5de] bg-white px-4 py-2.5 text-[13.5px] font-medium text-foreground transition hover:bg-[#f0ede6]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </main>
  )
}
