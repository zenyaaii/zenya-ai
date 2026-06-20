'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  X as XIcon,
  CheckCircle2,
  Send,
  LifeBuoy,
  Sparkles,
  Briefcase,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

/**
 * GitHub mark — inlined because lucide-react v1+ removed brand icons.
 * Typed as LucideIcon-compatible (accepts className + strokeWidth gracefully).
 */
const GithubIcon: LucideIcon = ((props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.56v-2.02c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.97 10.97 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56 4.56-1.52 7.85-5.82 7.85-10.9C23.5 5.65 18.35.5 12 .5z" />
  </svg>
)) as unknown as LucideIcon
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'

type Topic = 'support' | 'request' | 'sales' | 'other'

type TopicMeta = { id: Topic; label: string; icon: LucideIcon }

const TOPICS: TopicMeta[] = [
  { id: 'support', label: 'الدعم',             icon: LifeBuoy      },
  { id: 'request', label: 'طلب قالب',          icon: Sparkles     },
  { id: 'sales',   label: 'المبيعات',          icon: Briefcase     },
  { id: 'other',   label: 'شيء آخر',           icon: MessageCircle },
]

const TOPIC_SUCCESS: Record<Topic, string> = {
  support:
    'شكرًا لك — سنردّ خلال يوم عمل واحد، وغالبًا أسرع. تحقّق من مجلد البريد العشوائي إن لم تجد ردًّا.',
  request:
    'تمّ استلام طلبك. نراجع طلبات القوالب كل يوم اثنين ونرفع الفئات الأكثر طلبًا إلى أعلى خارطة الطريق. سنراسلك عند إطلاق قالبك.',
  sales:
    'شكرًا لك — سيتواصل معك أحد أعضاء الفريق خلال يوم عمل واحد لمناقشة احتياجاتك.',
  other:
    'شكرًا لك — تمّ استلام رسالتك. سنردّ عليك قريبًا.',
}

const CHANNELS: { label: string; value: string; href: string; icon: LucideIcon }[] = [
  { label: 'البريد الإلكتروني', value: 'support@zenyaai.co', href: 'mailto:support@zenyaai.co', icon: Mail       },
  { label: 'منصّة X',           value: '@zenyaai',          href: '#',                        icon: XIcon      },
  { label: 'GitHub',           value: 'zenyaai',           href: '#',                        icon: GithubIcon },
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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [topic, setTopic] = useState<Topic>('support')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /* Honor ?topic=request from the /themes "Request a template" link. */
  useEffect(() => {
    const t = search.get('topic') as Topic | null
    if (t && TOPICS.some((x) => x.id === t)) setTopic(t)
  }, [search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !message || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      })
      // Even if the backend isn't fully wired (e.g. Resend not configured),
      // we treat 200 as success and surface anything else as the topic-specific
      // copy. The route currently logs to console + returns 200.
      if (!res.ok) throw new Error('تعذّر الإرسال — يُرجى مراسلتنا مباشرةً.')
      setSent(true)
    } catch (err: any) {
      // Show the error inline instead of the success state.
      alert(err.message || 'حدث خطأ ما؛ يُرجى مراسلتنا مباشرةً على support@zenyaai.co.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setSent(false)
    setMessage('')
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

                  {/* Message */}
                  <Field label="الرسالة" required>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        topic === 'request'
                          ? 'أي نوع من قوالب الأعمال سيساعد عملك؟ كن محدّدًا — «قالب صالون حلاقة» أفضل من «قالب خدمات».'
                          : 'أخبرنا قليلًا عمّا تحتاجه.'
                      }
                      className={cn(inputCls, 'min-h-[140px] resize-y')}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={!email || !message || submitting}
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
