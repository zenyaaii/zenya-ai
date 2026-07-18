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
import { motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { openConsent } from '@/components/CookieConsent'
import { useNotify } from '@/components/ui/Notify'
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
  Gift,
  Copy,
  Check as CheckIcon,
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

/* ── Motion variants ─────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const sectionV = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

/* ── Presentational atoms ────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  tone,
  accent = '#5e6ad2',
  action,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: ReactNode
  tone?: 'danger'
  /** Icon-chip accent so each card has its own colour. */
  accent?: string
  action?: ReactNode
}) {
  const danger = tone === 'danger'
  return (
    <motion.section
      variants={sectionV}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-[0_18px_40px_-22px_rgba(28,28,28,0.30)] ${
        danger ? 'border-red-200' : 'border-[#e8e5de]'
      }`}
    >
      <div className={`flex items-center gap-4 border-b p-5 ${danger ? 'border-red-100' : 'border-[#f0ede6]'}`}>
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{
            background: danger ? 'rgba(220,38,38,0.08)' : `${accent}16`,
            color: danger ? '#ef4444' : accent,
          }}
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
    </motion.section>
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
  const reduce = useReducedMotion()
  const { toast } = useNotify()

  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [dark, setDark] = useState(false)

  // Saved discount codes (from the review offer, Pro perks, etc.)
  type PromoCode = { id: string; code: string; label: string | null; description: string | null }
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [codesLoaded, setCodesLoaded] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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

      // Saved discount codes — best-effort; failure just leaves the empty state.
      try {
        const res = await fetch('/api/promo-codes')
        if (res.ok) {
          const j = await res.json()
          setCodes(j.codes || [])
        }
      } catch {}
      setCodesLoaded(true)
    })
  }, [router, supabase])

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1800)
    } catch {}
  }

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
      toast({ type: 'error', message: 'تعذّر التصدير', description: e.message || String(e) })
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
      toast({ type: 'error', message: 'تعذّر الحذف', description: e.message || String(e) })
      setDeleting(false)
    }
  }

  // Show the actual tier — not a generic "Pro" — so a Starter user doesn't
  // see themselves labelled "Pro" and get confused when the dashboard tells
  // them to "الترقية إلى Pro". Same for legacy pro_onetime buyers.
  const planLabel =
    plan === 'admin'        ? 'مشرف' :
    plan === 'pro'          ? 'Pro · نشط' :
    plan === 'pro_hosting'  ? 'Pro + استضافة' :
    plan === 'pro_onetime'  ? 'Pro · مدى الحياة' :
    plan === 'starter'      ? 'Starter · نشط' :
    isPro                   ? 'Pro' :
    'مجانية'

  const initial = newName?.trim()?.[0] || email?.[0] || '؟'

  return (
    <div className="mx-auto max-w-2xl" dir="rtl">
      {/* Header — premium brand banner */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative mb-8 overflow-hidden rounded-3xl border border-[#e8e5de] bg-white p-6 shadow-[0_18px_50px_-30px_rgba(28,28,28,0.4)]"
      >
        {/* soft brand wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 140% at 100% 0%, rgba(94,106,210,0.14), transparent 55%), radial-gradient(90% 120% at 0% 100%, rgba(139,148,232,0.10), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-[20px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #5e6ad2 0%, #8b94e8 100%)',
              boxShadow: '0 12px 28px -10px rgba(94,106,210,0.55)',
            }}
          >
            {initial.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              الإعدادات
            </h1>
            <p className="mt-0.5 truncate text-[13.5px] text-muted">
              مُسجَّل الدخول باسم{' '}
              <span dir="ltr" className="font-medium text-foreground">{email || '…'}</span>
            </p>
          </div>
          <span className="hidden flex-shrink-0 items-center gap-1.5 self-start rounded-full bg-[#eef0fb] px-3 py-1 text-[12px] font-bold text-[#5e6ad2] sm:inline-flex">
            {isPro && <Sparkles className="h-3 w-3" />}
            {planLabel}
          </span>
        </div>
      </motion.div>

      <motion.div
        className="space-y-5"
        variants={containerV}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        {/* Profile */}
        <Section icon={User} accent="#5e6ad2" title="الملف الشخصي" subtitle="اسمك كما يظهر في حسابك ورسائلنا">
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
        <Section icon={Mail} accent="#0ea5e9" title="البريد الإلكتروني" subtitle="عنوان تسجيل الدخول وإرسال الإشعارات">
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
        <Section icon={Lock} accent="#16a34a" title="كلمة المرور" subtitle="غيّرها مباشرةً — أنت مسجّل الدخول بالفعل">
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
          accent="#d97706"
          title="الخطة والفوترة"
          subtitle="اشتراك شهري — Starter 14.99$ أو Pro 24.99$. ألغِ في أي وقت."
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
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
            تريد استردادًا؟ راجع{' '}
            <Link href="/refund" className="text-[#5e6ad2] hover:underline">سياسة الاسترداد</Link>{' '}
            ثم <Link href="/contact" className="text-[#5e6ad2] hover:underline">تواصل معنا</Link> وسنعالج طلبك.
          </p>
        </Section>

        {/* Discount codes — persistent, so a code revealed once (e.g. the
            review offer) is never lost. */}
        <Section
          icon={Gift}
          accent="#e11d48"
          title="أكواد الخصم"
          subtitle="أكوادك محفوظة هنا — انسخها واستخدمها عند الدفع في أي وقت"
        >
          {!codesLoaded ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-[#f4f2ec]" />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#e8e5de] bg-[#faf8f3] p-5 text-center">
              <p className="text-[13px] leading-relaxed text-muted">
                لا أكواد بعد. شاركنا رأيك أثناء إنشاء موقعك لتحصل على كود خصم 30% على أول شهر —
                وسيظهر هنا تلقائيًا.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {codes.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#e8e5de] bg-[#faf8f3] p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code
                        dir="ltr"
                        className="rounded-md border border-dashed border-[#5e6ad2]/50 bg-white px-2.5 py-1 text-[14px] font-extrabold tracking-[0.1em] text-[#5e6ad2]"
                      >
                        {c.code}
                      </code>
                      {c.label && <span className="truncate text-[13px] font-semibold text-foreground">{c.label}</span>}
                    </div>
                    {c.description && (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{c.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(c.code)}
                    aria-label={`نسخ ${c.code}`}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#e8e5de] bg-white px-3 py-2 text-[12.5px] font-semibold text-foreground transition hover:bg-[#f0ede6]"
                  >
                    {copiedCode === c.code ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> نسخ
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Appearance */}
        <Section icon={Sun} accent="#a855f7" title="المظهر" subtitle="يُحفظ على هذا الجهاز فقط">
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
        <Section icon={Shield} accent="#0d9488" title="الخصوصية والأمان">
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
        <Section icon={Database} accent="#2563eb" title="بياناتك" subtitle="نزّل نسخة كاملة — وفق المادتين ١٥ و٢٠ من GDPR">
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
      </motion.div>
    </div>
  )
}
