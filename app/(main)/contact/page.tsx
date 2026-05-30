'use client'

import { useState, useEffect } from 'react'
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
  { id: 'support', label: 'Support',           icon: LifeBuoy      },
  { id: 'request', label: 'Request a template', icon: Sparkles     },
  { id: 'sales',   label: 'Sales',             icon: Briefcase     },
  { id: 'other',   label: 'Something else',    icon: MessageCircle },
]

const TOPIC_SUCCESS: Record<Topic, string> = {
  support:
    "Thanks — we'll get back within one business day, usually faster. Check the spam folder if you don't see a reply.",
  request:
    "Got it. We review template requests every Monday and bump the most-requested categories to the top of the roadmap. We'll email you when yours ships.",
  sales:
    "Thanks — a member of the team will reach out within one business day to talk about your needs.",
  other:
    "Thanks — message received. We'll get back to you shortly.",
}

const CHANNELS: { label: string; value: string; href: string; icon: LucideIcon }[] = [
  { label: 'Email',  value: 'support@zenya.ai', href: 'mailto:support@zenya.ai', icon: Mail       },
  { label: 'X',      value: '@zenyaai',         href: '#',                       icon: XIcon      },
  { label: 'GitHub', value: 'zenyaai',          href: '#',                       icon: GithubIcon },
]

export default function ContactPage() {
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
    // Visual-only delay — real backend wiring is out of scope for this rebuild.
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setSent(true)
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
            Contact
          </p>
          <h1 className="text-[44px] font-[590] leading-[1.08] tracking-[-1.6px] text-foreground sm:text-[56px] sm:tracking-[-2px]">
            Tell us what you&rsquo;re building.
          </h1>
          <p className="mt-4 text-[16px] leading-[1.65] text-muted">
            Support, template requests, sales, or just a hello — pick a topic and we&rsquo;ll
            get back within one business day.
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
                      What&rsquo;s this about?
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
                    <Field label="Your name">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Designer"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Email" required>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Message */}
                  <Field label="Message" required>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        topic === 'request'
                          ? "What kind of business template would help your work? Be specific — 'a barbershop template' beats 'a service template'."
                          : 'Tell us a bit about what you need.'
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
                    {submitting ? 'Sending…' : 'Send message'}
                    <Send
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-150',
                        !submitting && 'group-hover:translate-x-0.5'
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
                    Message received.
                  </h2>
                  <p className="max-w-md text-[14px] leading-[1.65] text-muted">
                    {TOPIC_SUCCESS[topic]}
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-token bg-background px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
                  >
                    Send another
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
                Other channels
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
                Response time
              </p>
              <p className="text-[13.5px] leading-[1.6] text-muted">
                Most messages get a real reply within{' '}
                <strong className="font-[590] text-foreground">one business day</strong>.
                Pro subscribers are prioritized — we usually answer those within hours.
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
