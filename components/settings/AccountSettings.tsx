'use client'

/**
 * The single, shared account-settings surface. Rendered by BOTH
 * /settings (marketing shell) and /dashboard/settings (app shell) so the
 * two can never drift. Everything here is self-service and editable:
 *
 *   • Profile  — display name
 *   • Email    — change address (Supabase sends a confirmation link)
 *   • Password — change inline (user is already authenticated)
 *   • Plan     — read-only badge + links to billing / refund
 *   • Privacy  — cookies / policy links
 *   • Data     — GDPR export
 *   • Danger   — permanent account deletion
 *   • Appearance — light / dark toggle (this device)
 *
 * Brand chrome: cream #faf8f3 fields, indigo #5e6ad2 accent, rounded cards.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { openConsent } from '@/components/CookieConsent'
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Shield,
  Database,
  AlertTriangle,
  ChevronLeft,
  Check,
  Loader2,
  Sun,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

/* ── Status helper ───────────────────────────────────────────────── */

type Status = 'idle' | 'loading' | 'success' | 'error'

function useStatus(resetAfter = 3500) {
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')
  function set(s: Status, m = '') {
    setStatus(s)
    setMsg(m)
    if (s === 'success' || s === 'error') setTimeout(() => setStatus('idle'), resetAfter)
  }
  return { status, msg, set }
}

/* ── Presentational atoms ────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  tone,
  action,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: ReactNode
  tone?: 'danger'
  action?: ReactNode
}) {
  const danger = tone === 'danger'
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        danger ? 'border-red-200' : 'border-[#e8e5de]'
      }`}
    >
      <div className={`flex items-center gap-4 border-b p-5 ${danger ? 'border-red-100' : 'border-[#f0ede6]'}`}>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            danger ? 'bg-red-50 text-red-500' : 'bg-[#eef0fb] text-[#5e6ad2]'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={`text-[15px] font-semibold ${danger ? 'text-red-600' : 'text-foreground'}`}>{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-muted">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted/60 transition focus:border-[#5e6ad2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5e6ad2]/15 disabled:opacity-50 ${props.className ?? ''}`}
    />
  )
}

function PrimaryButton({
  status,
  idleLabel,
  busyLabel = 'جارٍ الحفظ…',
  doneLabel = 'تم الحفظ!',
  ...rest
}: {
  status: Status
  idleLabel: string
  busyLabel?: string
  doneLabel?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={status === 'loading' || status === 'success' || rest.disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-[#5e6ad2] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#4f5ab8] disabled:opacity-60"
    >
      {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === 'success' && <Check className="h-4 w-4" />}
      {status === 'success' ? doneLabel : status === 'loading' ? busyLabel : idleLabel}
    </button>
  )
}

function GhostButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition hover:bg-[#f0ede6] disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function Note({ status, msg }: { status: Status; msg: string }) {
  if (status === 'idle' || !msg) return null
  return (
    <span className={`text-[12.5px] ${status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{msg}</span>
  )
}

/* ── Main ────────────────────────────────────────────────────────── */

export default function AccountSettings() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [dark, setDark] = useState(false)

  // editable fields
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)

  // per-action status
  const nameS = useStatus()
  const emailS = useStatus()
  const pwS = useStatus()

  // one-off actions
  const [exporting, setExporting] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('zenya_theme') === 'dark'
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login?next=/settings'); return }
      setEmail(user.email || '')
      setNewEmail(user.email || '')
      const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setNewName(name)

      const { data } = await supabase
        .from('profiles')
        .select('plan, is_pro')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        setPlan((data as any).plan ?? null)
        setIsPro(Boolean((data as any).is_pro))
      }
    })
  }, [router, supabase])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('zenya_theme', next ? 'dark' : 'light')
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    nameS.set('loading')
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } })
    if (error) return nameS.set('error', error.message)
    nameS.set('success', 'تم تحديث اسمك.')
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault()
    const next = newEmail.trim()
    if (!next || next === email) return emailS.set('error', 'أدخل بريدًا جديدًا مختلفًا.')
    emailS.set('loading')
    const { error } = await supabase.auth.updateUser({ email: next })
    if (error) return emailS.set('error', error.message)
    emailS.set('success', 'أرسلنا رابط تأكيد إلى بريدك القديم والجديد لإتمام التغيير.')
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw1.length < 8) return pwS.set('error', 'يجب ألا تقل كلمة المرور عن ٨ أحرف.')
    if (pw1 !== pw2) return pwS.set('error', 'كلمتا المرور غير متطابقتين.')
    pwS.set('loading')
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) return pwS.set('error', error.message)
    setPw1(''); setPw2('')
    pwS.set('success', 'تم تحديث كلمة المرور.')
  }

  async function openPortal() {
    setPortalBusy(true)
    try {
      const res = await fetch('/api/account/portal', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (res.status === 409) { router.push('/dashboard/billing'); return }
      if (!res.ok || !j.url) throw new Error(j.message || 'تعذّر فتح بوابة الفوترة')
      window.location.href = j.url
    } catch (e: any) {
      alert(e.message || 'تعذّر فتح بوابة الفوترة')
      setPortalBusy(false)
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

  const planLabel = isPro
    ? plan === 'pro_hosting' ? 'Pro + استضافة' : 'Pro'
    : plan === 'admin' ? 'مشرف' : 'مجانية'

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">الإعدادات</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          أدِر حسابك وأمانك وبياناتك — مُسجَّل الدخول باسم{' '}
          <span dir="ltr" className="font-medium text-foreground">{email || '…'}</span>
        </p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <Section icon={User} title="الملف الشخصي" subtitle="اسمك كما يظهر في حسابك ورسائلنا">
          <form onSubmit={saveName} className="space-y-4">
            <Field label="الاسم الكامل">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="اكتب اسمك" />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton status={nameS.status} idleLabel="حفظ الاسم" />
              <Note status={nameS.status} msg={nameS.msg} />
            </div>
          </form>
        </Section>

        {/* Email */}
        <Section icon={Mail} title="البريد الإلكتروني" subtitle="عنوان تسجيل الدخول وإرسال الإشعارات">
          <form onSubmit={saveEmail} className="space-y-4">
            <Field label="البريد الإلكتروني">
              <Input
                type="email"
                dir="ltr"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton status={emailS.status} idleLabel="تغيير البريد" busyLabel="جارٍ الإرسال…" doneLabel="تحقق من بريدك" />
              <Note status={emailS.status} msg={emailS.msg} />
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section icon={Lock} title="كلمة المرور" subtitle="غيّرها مباشرةً — أنت مسجّل الدخول بالفعل">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="كلمة المرور الجديدة">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  placeholder="٨ أحرف على الأقل"
                  autoComplete="new-password"
                  className="pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition hover:text-foreground"
                  aria-label={showPw ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="تأكيد كلمة المرور">
              <Input
                type={showPw ? 'text' : 'password'}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                autoComplete="new-password"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton status={pwS.status} idleLabel="تحديث كلمة المرور" doneLabel="تم التحديث!" />
              <Note status={pwS.status} msg={pwS.msg} />
            </div>
          </form>
        </Section>

        {/* Plan & billing */}
        <Section
          icon={CreditCard}
          title="الخطة والفوترة"
          subtitle="زينيا Pro شراء لمرة واحدة — لا اشتراك متكرّر"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0fb] px-3 py-1 text-[12px] font-bold text-[#5e6ad2]">
              {isPro && <Sparkles className="h-3 w-3" />}
              {planLabel}
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5e6ad2] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#4f5ab8]"
            >
              تفاصيل الخطة والفواتير
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <GhostButton onClick={openPortal} disabled={portalBusy}>
              {portalBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {portalBusy ? 'جارٍ الفتح…' : 'بوابة Stripe الآمنة'}
            </GhostButton>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            تريد استردادًا؟ راجع{' '}
            <Link href="/refund" className="text-[#5e6ad2] hover:underline">سياسة الاسترداد</Link>{' '}
            ثم <Link href="/contact" className="text-[#5e6ad2] hover:underline">تواصل معنا</Link> وسنعالج طلبك.
          </p>
        </Section>

        {/* Appearance */}
        <Section icon={Sun} title="المظهر" subtitle="يُحفظ على هذا الجهاز فقط">
          <button
            type="button"
            onClick={toggleDark}
            className="flex w-full items-center justify-between rounded-xl border border-[#e8e5de] bg-[#faf8f3] px-4 py-3 text-right"
          >
            <span className="text-[14px] font-medium text-foreground">الوضع الداكن</span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${dark ? 'bg-[#5e6ad2]' : 'bg-[#d4d1ca]'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${dark ? '-translate-x-5' : '-translate-x-0.5'}`} />
            </span>
          </button>
        </Section>

        {/* Privacy */}
        <Section icon={Shield} title="الخصوصية والأمان">
          <ul className="-my-1 divide-y divide-[#f0ede6]">
            <li>
              <button onClick={openConsent} className="flex w-full items-center justify-between py-3 text-[13.5px] font-medium text-foreground transition hover:text-[#5e6ad2]">
                إدارة ملفات تعريف الارتباط
                <ChevronLeft className="h-4 w-4 text-muted" />
              </button>
            </li>
            {[
              { href: '/privacy', label: 'سياسة الخصوصية' },
              { href: '/terms', label: 'شروط الخدمة' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="flex items-center justify-between py-3 text-[13.5px] font-medium text-foreground transition hover:text-[#5e6ad2]">
                  {label}
                  <ChevronLeft className="h-4 w-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Data */}
        <Section icon={Database} title="بياناتك" subtitle="نزّل نسخة كاملة — وفق المادتين ١٥ و٢٠ من GDPR">
          <p className="mb-4 text-[13px] leading-relaxed text-muted">
            يشمل التصدير ملفك الشخصي وقوالبك وسجلّ الاستخلاص ومشترياتك.
          </p>
          <GhostButton onClick={exportData} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {exporting ? 'جارٍ التحضير…' : 'تنزيل بياناتي (JSON)'}
          </GhostButton>
        </Section>

        {/* Danger zone */}
        <Section icon={AlertTriangle} title="منطقة الخطر" tone="danger">
          <p className="mb-4 text-[13px] leading-relaxed text-muted">
            احذف نهائيًا حسابك وقوالبك وسجلّ الاستخلاص. تُلغى فوترة Stripe تلقائيًا، ويُحتفظ
            بسجلّات الفواتير المطلوبة ضريبيًا (٧ سنوات وفق القانون الهولندي).{' '}
            <strong className="text-red-700">لا يمكن التراجع.</strong> سنرسل لك بريد تأكيد بالحذف.
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
              <p className="text-[13px] text-red-800">اكتب <strong>حذف</strong> للتأكيد.</p>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="حذف" className="bg-white" />
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
    </div>
  )
}
