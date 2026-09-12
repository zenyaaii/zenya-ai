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
 * Chrome: the house dashboard language — .zy-card, .zy-btn, .zy-h3 and the
 * product tokens. It carried its own cream fields and a nine-colour icon set
 * until the port; nothing here declares a palette of its own now.
 */

import { COMPANY, usdTrailing } from '@/lib/company'
import { useEffect, useState, type ReactNode } from 'react'
import { REVIEW_REWARD_AR } from '@/lib/review-reward'
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
  Check as CheckIcon, Settings as SettingsIcon,} from 'lucide-react'

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
    <motion.section variants={sectionV} className="zy-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {/* ONE ACCENT, NOT NINE. Each card used to carry its own hue — violet,
            sky, green, purple, teal, blue — which is the same confetti the
            dashboard restyle reduced to a documented triad everywhere else.
            The icon chip is the field fill; the only colour that survives is
            the one that reports danger. */}
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: danger ? 'rgba(185,28,28,0.07)' : 'var(--field)',
            color: danger ? '#b91c1c' : 'var(--stone)',
          }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="zy-h3" style={danger ? { color: '#b91c1c' } : undefined}>{title}</h2>
        </div>
        {action}
      </div>
      {subtitle && <p className="zy-sub mt-1.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </motion.section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      {/* Was 12px uppercase with 0.05em tracking. 12px renders 10.2px under
          the root zoom; uppercase is a dead declaration on Arabic and the
          tracking pulls its connected letterforms apart. */}
      <label className="block text-[14.5px] font-bold text-[#171717]">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      /* No colours here any more: .zy-app already styles every input on this
         surface, so a field in settings and a field in the editor cannot
         disagree. What is left is the size and the box. */
      className={`w-full px-3 py-2.5 text-[14.5px] font-medium disabled:opacity-50 ${props.className ?? ''}`}
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
      className="zy-btn"
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
      className="zy-btn-q"
    >
      {children}
    </button>
  )
}

function Note({ status, msg }: { status: Status; msg: string }) {
  if (status === 'idle' || !msg) return null
  /* text-[#b91c1c] is #dc2626 at 4.0:1 and text-[#15803d] is #059669 at
     3.4:1 — both under the 4.5 a label is owed. The triad's own values are
     6.47 and 5.02. role=status so the result of pressing Save reaches a
     screen reader, which it did not before. */
  return (
    <span
      role="status"
      className="text-[14.5px] font-medium"
      style={{ color: status === 'error' ? '#b91c1c' : '#15803d' }}
    >
      {msg}
    </span>
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
    /* The demo's page width, not max-w-2xl. Nine cards in one 672px column
       is a very long scroll on a screen that has room for two; every other
       screen in app/demo/dashboard lays out at max-w-7xl. */
    <div className="mx-auto w-full max-w-7xl" dir="rtl">
      {/* THE PAGE HEAD, flat.

          What this replaces: a rounded-3xl banner carrying a 50px drop
          shadow, TWO radial gradient washes, and an avatar filled with a
          violet-to-periwinkle gradient under its own coloured shadow. That
          is the aurora, on the settings screen, after it had been taken out
          of the marketing site, the dashboard chrome, the accounts portal
          and the seven wizards in turn.

          The composition is the one /demo/dashboard uses for every screen:
          an icon chip, a title, a sentence saying what the screen is for.
          The plan pill stays because it reports something real. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="mb-6 flex items-start gap-3"
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--field)', color: 'var(--stone)' }}
        >
          <SettingsIcon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="zy-h1">الإعدادات</h1>
          <p className="zy-sub mt-1">
            مُسجَّل الدخول باسم{' '}
            <span dir="ltr" className="font-medium text-[#171717]">{email || '…'}</span>
          </p>
        </div>
        <span className="zy-pill shrink-0" data-tone="accent">
          {isPro && <Sparkles className="h-3 w-3" />}
          {planLabel}
        </span>
      </motion.div>

      {/* Two columns from lg, one below it, items-start so a short card does
          not stretch to the height of a tall neighbour. */}
      <motion.div
        className="grid items-start gap-4 lg:grid-cols-2"
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
          subtitle={`اشتراك شهري — Starter ${usdTrailing(COMPANY.STARTER_PRICE_USD)} أو Pro ${usdTrailing(COMPANY.PRO_PRICE_USD)}. ألغِ في أي وقت.`}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--violet-fill)] px-3 py-1 text-[14.5px] font-bold text-[#5e6ad2]">
              {isPro && <Sparkles className="h-3 w-3" />}
              {planLabel}
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/billing"
              className="zy-btn"
            >
              تفاصيل الخطة والفواتير
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
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
            <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--field)] p-5 text-center">
              <p className="text-[14.5px] leading-relaxed text-muted">
                لا أكواد بعد. شاركنا رأيك أثناء إنشاء موقعك لتحصل على كود {REVIEW_REWARD_AR} —
                وسيظهر هنا تلقائيًا.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {codes.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--field)] p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code
                        dir="ltr"
                        className="rounded-md border border-dashed border-[#5e6ad2]/50 bg-white px-2.5 py-1 text-[14.5px] font-extrabold tracking-[0.1em] text-[#5e6ad2]"
                      >
                        {c.code}
                      </code>
                      {c.label && <span className="truncate text-[14.5px] font-semibold text-foreground">{c.label}</span>}
                    </div>
                    {c.description && (
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{c.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(c.code)}
                    aria-label={`نسخ ${c.code}`}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-[14.5px] font-semibold text-foreground transition hover:bg-[#f0ede6]"
                  >
                    {copiedCode === c.code ? (
                      <>
                        <CheckIcon className="h-3.5 w-3.5 text-[#15803d]" /> تم النسخ
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
            className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--field)] px-4 py-3 text-right"
          >
            <span className="text-[14.5px] font-medium text-foreground">الوضع الداكن</span>
            <span className={`relative h-6 w-11 rounded-full transition-colors ${dark ? 'bg-[#5e6ad2]' : 'bg-[#d4d1ca]'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${dark ? '-translate-x-5' : '-translate-x-0.5'}`} />
            </span>
          </button>
        </Section>

        {/* Privacy */}
        <Section icon={Shield} accent="#0d9488" title="الخصوصية والأمان">
          <ul className="-my-1 divide-y divide-[color:var(--border)]">
            <li>
              <button onClick={openConsent} className="flex w-full items-center justify-between py-3 text-[14.5px] font-medium text-foreground transition hover:text-[#5e6ad2]">
                إدارة ملفات تعريف الارتباط
                <ChevronLeft className="h-4 w-4 text-muted" />
              </button>
            </li>
            {[
              { href: '/privacy', label: 'سياسة الخصوصية' },
              { href: '/terms', label: 'شروط الخدمة' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="flex items-center justify-between py-3 text-[14.5px] font-medium text-foreground transition hover:text-[#5e6ad2]">
                  {label}
                  <ChevronLeft className="h-4 w-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {/* Data */}
        <Section icon={Database} accent="#2563eb" title="بياناتك" subtitle="نزّل نسخة كاملة — وفق المادتين ١٥ و٢٠ من GDPR">
          <p className="mb-4 text-[14.5px] leading-relaxed text-muted">
            يشمل التصدير ملفك الشخصي وقوالبك وسجلّ الاستخلاص ومشترياتك.
          </p>
          <GhostButton onClick={exportData} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {exporting ? 'جارٍ التحضير…' : 'تنزيل بياناتي (JSON)'}
          </GhostButton>
        </Section>

        {/* Danger zone */}
        <Section icon={AlertTriangle} title="منطقة الخطر" tone="danger">
          <p className="mb-4 text-[14.5px] leading-relaxed text-muted">
            احذف نهائيًا حسابك وقوالبك وسجلّ الاستخلاص. تُلغى فوترة Stripe تلقائيًا، ويُحتفظ
            بسجلّات الفواتير المطلوبة ضريبيًا (٧ سنوات وفق القانون الهولندي).{' '}
            <strong className="text-red-700">لا يمكن التراجع.</strong> سنرسل لك بريد تأكيد بالحذف.
          </p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-xl border border-red-300 bg-white px-5 py-2.5 text-[14.5px] font-semibold text-[#b91c1c] transition hover:bg-red-50"
            >
              حذف حسابي…
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-[14.5px] text-red-800">اكتب <strong>حذف</strong> للتأكيد.</p>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="حذف" className="bg-white" />
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={confirmText !== 'حذف' || deleting}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'جارٍ الحذف…' : 'حذف الحساب نهائيًا'}
                </button>
                <button
                  onClick={() => { setShowDelete(false); setConfirmText('') }}
                  className="rounded-xl border border-[color:var(--border)] bg-white px-4 py-2.5 text-[14.5px] font-medium text-foreground transition hover:bg-[#f0ede6]"
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
