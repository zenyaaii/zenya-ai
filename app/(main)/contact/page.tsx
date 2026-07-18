'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Globe,
  CheckCircle2,
  Send,
  LifeBuoy,
  Sparkles,
  Briefcase,
  MessageCircle,
  MessageSquareQuote,
  Gift,
  Copy,
  Check,
  Star,
  type LucideIcon,
} from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'
import { useNotify } from '@/components/ui/Notify'

type Topic = 'support' | 'request' | 'sales' | 'review' | 'other'

type TopicMeta = { id: Topic; label: string; icon: LucideIcon }

const TOPICS: TopicMeta[] = [
  { id: 'support', label: 'الدعم',             icon: LifeBuoy           },
  { id: 'request', label: 'طلب قالب',          icon: Sparkles          },
  { id: 'review',  label: 'مشاركة تجربة',      icon: MessageSquareQuote },
  { id: 'sales',   label: 'المبيعات',          icon: Briefcase          },
  { id: 'other',   label: 'شيء آخر',           icon: MessageCircle      },
]

const TOPIC_SUCCESS: Record<Topic, string> = {
  support:
    'شكرًا لك — سنردّ خلال يوم عمل واحد، وغالبًا أسرع. تحقّق من مجلد البريد العشوائي إن لم تجد ردًّا.',
  request:
    'تمّ استلام طلبك. نراجع طلبات القوالب كل يوم اثنين ونرفع الفئات الأكثر طلبًا إلى أعلى خارطة الطريق. سنراسلك عند إطلاق قالبك.',
  sales:
    'شكرًا لك — سيتواصل معك أحد أعضاء الفريق خلال يوم عمل واحد لمناقشة احتياجاتك.',
  review:
    'شكرًا جزيلًا على مشاركتك تجربتك الصادقة! سنراجعها، وسنرسل إليك رمز خصم كشكرٍ على وقتك. رأيك يساعد مؤسّسين آخرين على الثقة بزينيا.',
  other:
    'شكرًا لك — تمّ استلام رسالتك. سنردّ عليك قريبًا.',
}

const CHANNELS: { label: string; value: string; href: string; icon: LucideIcon }[] = [
  { label: 'البريد الإلكتروني', value: 'support@zenyaai.co', href: 'mailto:support@zenyaai.co', icon: Mail   },
  { label: 'موقعنا',            value: 'zenyaai.co',        href: 'https://zenyaai.co',       icon: Globe  },
]

/**
 * Default export wraps the form in <Suspense> because `useSearchParams()` in
 * Next.js 14 App Router bails out of static rendering unless the consumer is
 * inside a Suspense boundary. The fallback is `null` since the page chrome
 * itself doesn't need a skeleton.
 */
export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageInner />
    </Suspense>
  )
}

function ContactPageInner() {
  const search = useSearchParams()
  const { toast } = useNotify()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [topic, setTopic] = useState<Topic>('support')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rewardCode, setRewardCode] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)

  /* Honor ?topic=request from the /themes "Request a template" link. */
  useEffect(() => {
    const t = search.get('topic') as Topic | null
    if (t && TOPICS.some((x) => x.id === t)) setTopic(t)
  }, [search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !message || submitting) return
    // A review needs a star rating — that's the whole point of the channel.
    if (topic === 'review' && rating < 1) {
      toast({ type: 'warning', message: 'يرجى اختيار عدد النجوم لتقييم تجربتك.' })
      return
    }
    setSubmitting(true)
    try {
      // Reviews are persisted to Supabase (pending → founder-approved) so real
      // feedback is never lost. This runs alongside the contact intake, which
      // still returns the thank-you reward code.
      if (topic === 'review') {
        const rev = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: name || 'مستخدم زينيا', email, rating, body: message }),
        })
        if (!rev.ok) {
          const j = await rev.json().catch(() => ({}))
          throw new Error(j?.message || 'تعذّر حفظ مراجعتك — يُرجى المحاولة مجددًا.')
        }
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      })
      // Even if the backend isn't fully wired (e.g. Resend not configured),
      // we treat 200 as success and surface anything else as the topic-specific
      // copy. The route currently logs to console + returns 200.
      if (!res.ok) throw new Error('تعذّر الإرسال — يُرجى مراسلتنا مباشرةً.')
      const data = await res.json().catch(() => ({}))
      if (topic === 'review' && data?.rewardCode) {
        setRewardCode(data.rewardCode as string)
        // Best-effort: save the code to the user's list too, so logged-in
        // reviewers see it in Settings → أكواد الخصم. 401s silently for guests.
        try {
          fetch('/api/promo-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: data.rewardCode }),
            keepalive: true,
          }).catch(() => {})
        } catch {}
      }
      setSent(true)
    } catch (err: any) {
      toast({
        type: 'error',
        message: err.message || 'حدث خطأ ما',
        description: 'يُرجى مراسلتنا مباشرةً على support@zenyaai.co.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setSent(false)
    setMessage('')
    setRating(0)
    setHoverRating(0)
    setRewardCode(null)
    setCodeCopied(false)
  }

  async function copyCode() {
    if (!rewardCode) return
    try {
      await navigator.clipboard.writeText(rewardCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1800)
    } catch {}
  }

  return (
    <main className="relative">
      <AuroraBackground fixed intensity={0.75} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-xl"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            تواصل معنا
          </p>
          <h1 className="text-[44px] font-[590] leading-[1.08] tracking-[-1.6px] text-foreground sm:text-[56px] sm:tracking-[-2px]">
            أخبِرنا بما تبنيه.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-muted">
            الدعم، أو طلبات القوالب، أو المبيعات، أو حتى مجرّد تحية — اختر موضوعًا وسنردّ
            خلال يوم عمل واحد.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          {/* ── Form / Success ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-token bg-white p-7 shadow-soft-md sm:p-8"
          >
            <AnimatePresence mode="wait" initial={false}>
              {!sent ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Topic chips */}
                  <div>
                    <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      ما موضوع رسالتك؟
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => {
                        const Icon = t.icon
                        const active = topic === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTopic(t.id)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-150',
                              active
                                ? 'border-primary bg-[rgba(94,106,210,0.08)] text-primary'
                                : 'border-token bg-background text-muted hover:border-[rgba(28,28,28,0.18)] hover:text-foreground'
                            )}
                          >
                            <Icon className="h-3 w-3" strokeWidth={2.25} />
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Name + Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="اسمك">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: أحمد المصمّم"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="البريد الإلكتروني" required>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        dir="ltr"
                        className={cn(inputCls, 'text-start')}
                      />
                    </Field>
                  </div>

                  {/* Star rating — only for the review channel. Saved to Supabase. */}
                  <AnimatePresence initial={false}>
                    {topic === 'review' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                          تقييمك
                          <span className="ml-1 text-[#dc2626]">*</span>
                        </span>
                        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="التقييم بالنجوم">
                          {[1, 2, 3, 4, 5].map((n) => {
                            const filled = (hoverRating || rating) >= n
                            return (
                              <button
                                key={n}
                                type="button"
                                role="radio"
                                aria-checked={rating === n}
                                aria-label={`${n} من 5`}
                                onClick={() => setRating(n)}
                                onMouseEnter={() => setHoverRating(n)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="rounded-md p-1 transition-transform duration-150 hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    'h-7 w-7 transition-colors',
                                    filled ? 'text-[#f5a623]' : 'text-muted/35',
                                  )}
                                  fill={filled ? '#f5a623' : 'none'}
                                  strokeWidth={1.75}
                                />
                              </button>
                            )
                          })}
                          {rating > 0 && (
                            <span className="ms-2 text-[13px] font-semibold text-foreground">
                              {rating}/5
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message */}
                  <Field label="الرسالة" required>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        topic === 'request'
                          ? 'أي نوع من قوالب الأعمال سيساعد عملك؟ كن محدّدًا — «قالب صالون حلاقة» أفضل من «قالب خدمات».'
                          : topic === 'review'
                          ? 'ما الذي أعجبك؟ وما الذي يمكن تحسينه؟ إن أمكن، أرفِق رابط موقعك الذي أنشأته مع زينيا.'
                          : 'أخبرنا قليلًا عمّا تحتاجه.'
                      }
                      className={cn(inputCls, 'min-h-[140px] resize-y')}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={!email || !message || submitting || (topic === 'review' && rating < 1)}
                    className={cn(
                      'group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[14px] font-semibold text-white transition-all duration-150',
                      'btn-shadow-primary hover:opacity-90 active:scale-[0.98]',
                      'disabled:cursor-not-allowed disabled:opacity-60'
                    )}
                  >
                    {submitting ? 'جارٍ الإرسال…' : 'إرسال الرسالة'}
                    <Send
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-150 rtl-flip',
                        !submitting && 'group-hover:-translate-x-0.5'
                      )}
                      strokeWidth={2.5}
                    />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-start gap-4 py-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(39,166,68,0.10)] text-[#27a644]">
                    <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[22px] font-[590] tracking-[-0.6px] text-foreground">
                    تمّ استلام رسالتك.
                  </h2>
                  <p className="max-w-md text-[14px] leading-[1.65] text-muted">
                    {TOPIC_SUCCESS[topic]}
                  </p>

                  {rewardCode && (
                    <div
                      className="mt-2 w-full max-w-md rounded-2xl border p-5"
                      style={{
                        borderColor: 'rgba(94,106,210,0.28)',
                        background:
                          'linear-gradient(135deg, rgba(94,106,210,0.06) 0%, rgba(217,119,6,0.05) 100%)',
                      }}
                    >
                      <div className="mb-2.5 flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl"
                          style={{ background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }}
                        >
                          <Gift className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <p className="text-[13.5px] font-bold text-foreground">
                          هذا كودك — 30% على أول شهر
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copyCode}
                        aria-label="نسخ كود الخصم"
                        className="mt-2 flex items-center gap-3 rounded-xl border border-dashed px-4 py-2.5 transition-colors hover:bg-[rgba(94,106,210,0.06)]"
                        style={{ borderColor: 'rgba(94,106,210,0.5)' }}
                      >
                        <span
                          className="font-latin text-[18px] font-extrabold tracking-[0.14em] text-primary"
                          dir="ltr"
                        >
                          {rewardCode}
                        </span>
                        {codeCopied ? (
                          <Check className="h-4 w-4 text-[#27a644]" strokeWidth={2.5} />
                        ) : (
                          <Copy className="h-4 w-4 text-muted" strokeWidth={2} />
                        )}
                      </button>
                      <p className="mt-2.5 text-[12px] leading-[1.7] text-muted">
                        أدخِله في خانة «Promotion code» عند الاشتراك. صالح للعملاء الجدد على أول شهر.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={reset}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-token bg-background px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
                  >
                    إرسال رسالة أخرى
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Side panel: channels ── */}
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div className="rounded-2xl border border-token bg-white/80 p-6 backdrop-blur-md">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                قنوات أخرى
              </p>
              <ul className="space-y-3">
                {CHANNELS.map(({ label, value, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-all duration-150',
                        'hover:border-token hover:bg-background'
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-token bg-background text-muted transition-colors group-hover:border-[rgba(94,106,210,0.30)] group-hover:text-primary">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-foreground">{label}</p>
                        <p className="truncate text-[12px] text-muted">{value}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-token bg-white/80 p-6 backdrop-blur-md">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                وقت الاستجابة
              </p>
              <p className="text-[13.5px] leading-[1.6] text-muted">
                تحصل معظم الرسائل على ردّ حقيقي خلال{' '}
                <strong className="font-[590] text-foreground">يوم عمل واحد</strong>.
                ويحظى مشتركو Pro بالأولوية — وعادةً ما نردّ عليهم خلال ساعات.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </main>
  )
}

/* ── small helpers ── */

const inputCls =
  'w-full rounded-md border border-token bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted/65 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
        {required && <span className="ml-1 text-[#dc2626]">*</span>}
      </span>
      {children}
    </label>
  )
}
