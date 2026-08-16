'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Globe, LifeBuoy, Sparkles, Briefcase, MessageCircle, Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * English contact form. Posts the same payload as the Arabic page to
 * /api/contact, so both languages land in one inbox.
 *
 * The Arabic page additionally carries the "share a review" topic, which is
 * wired to a rating widget and an Arabic promo-code reward; that flow is not
 * duplicated here rather than half-translated.
 */

type Topic = 'support' | 'request' | 'sales' | 'other'

const TOPICS: { id: Topic; label: string; icon: LucideIcon }[] = [
  { id: 'support', label: 'Support',          icon: LifeBuoy      },
  { id: 'request', label: 'Request a template', icon: Sparkles    },
  { id: 'sales',   label: 'Sales',            icon: Briefcase     },
  { id: 'other',   label: 'Something else',   icon: MessageCircle },
]

function ContactForm() {
  const search = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [topic, setTopic] = useState<Topic>('support')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Honour ?topic=request from the templates page link. */
  useEffect(() => {
    const t = search.get('topic') as Topic | null
    if (t && TOPICS.some((x) => x.id === t)) setTopic(t)
  }, [search])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      })
      if (!res.ok) throw new Error('failed')
      setSent(true)
    } catch {
      setError('That did not go through. Please email support@zenyaai.co directly and we will pick it up.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-token bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(39,166,68,0.10)]">
          <Check className="h-5 w-5 text-[#27a644]" strokeWidth={2.5} />
        </div>
        <h2 className="text-[18px] font-bold text-foreground">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-[1.8] text-muted">
          Thanks for writing. We read everything and reply to the address you gave us.
        </p>
        <Link
          href="/en"
          className="mt-6 inline-flex items-center rounded-lg border border-token bg-background px-5 py-2.5 text-[13.5px] font-medium text-muted transition-colors hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-token bg-white p-6 sm:p-8">
      <fieldset className="mb-6">
        <legend className="mb-3 text-[12.5px] font-semibold uppercase tracking-[0.10em] text-subtle">
          What is this about?
        </legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const active = topic === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTopic(t.id)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150',
                  active
                    ? 'border-primary bg-[rgba(94,106,210,0.08)] text-primary'
                    : 'border-token bg-background text-muted hover:text-foreground'
                )}
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={2} />
                {t.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-foreground">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            className="w-full rounded-lg border border-token bg-background px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-foreground">
            Email <span className="text-muted">(required)</span>
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border border-token bg-background px-3.5 py-2.5 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-foreground">
          Message <span className="text-muted">(required)</span>
        </span>
        <textarea
          required
          minLength={5}
          maxLength={8000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-lg border border-token bg-background px-3.5 py-2.5 text-[14px] leading-[1.7] text-foreground outline-none transition-colors focus:border-primary"
          placeholder="Tell us what you need. The more detail, the better the answer."
        />
      </label>

      {error && (
        <p className="mt-3 rounded-lg border border-[rgba(220,38,38,0.25)] bg-[rgba(220,38,38,0.06)] px-3.5 py-2.5 text-[13px] text-[#b91c1c]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-primary py-3 text-[14px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}

export default function EnContact() {
  return (
    <main className="relative">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <h1 className="display-ar text-[clamp(32px,5.5vw,52px)] leading-[1.1] text-foreground">
            Talk to <span className="gradient-text">a human.</span>
          </h1>
          <p className="mt-6 text-[17px] leading-[1.9] text-muted">
            Questions about the product, a template you wish existed, or something that is not working. Write
            to us and we will answer.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <a
            href="mailto:support@zenyaai.co"
            className="flex items-center gap-3 rounded-2xl border border-token bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(94,106,210,0.30)]"
          >
            <Mail className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2} aria-hidden />
            <span>
              <span className="block text-[12px] uppercase tracking-[0.08em] text-subtle">Email</span>
              <span className="block text-[14px] font-medium text-foreground">support@zenyaai.co</span>
            </span>
          </a>
          <div className="flex items-center gap-3 rounded-2xl border border-token bg-white px-5 py-4">
            <Globe className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2} aria-hidden />
            <span>
              <span className="block text-[12px] uppercase tracking-[0.08em] text-subtle">Based in</span>
              <span className="block text-[14px] font-medium text-foreground">The European Union</span>
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Suspense fallback={<div className="h-96 rounded-2xl border border-token bg-white" />}>
            <ContactForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-[13px] leading-[1.8] text-muted">
          Looking for an answer right now? The{' '}
          <Link href="/en/faq" className="font-medium text-primary hover:text-foreground">
            FAQ
          </Link>{' '}
          covers pricing, hosting, domains, and Shopify export.
        </p>
      </div>
    </main>
  )
}
