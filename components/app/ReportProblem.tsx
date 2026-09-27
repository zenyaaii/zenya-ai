'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CheckCircle2, LifeBuoy, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

/**
 * "Something wrong? Tell us" — a small way out at the foot of the rail.
 *
 * A round icon sits at the foot of the rail. For a few seconds after the
 * dashboard opens, a small speech bubble beside it says what it is for, then
 * hides; hovering or focusing the icon brings it back.
 *
 * The box asks what kind of problem it is and what happened. It goes to the
 * support inbox through the same intake as the contact form (/api/contact,
 * topic support), so it lands in contact_messages and in team@ like every
 * other message, with the page the owner was on.
 */

const KINDS = [
  { key: 'site', label: 'موقعي' },
  { key: 'editor', label: 'المحرّر' },
  { key: 'billing', label: 'الدفع والاشتراك' },
  { key: 'domain', label: 'النطاق' },
  { key: 'other', label: 'شيء آخر' },
] as const

type Kind = (typeof KINDS)[number]['key']

export function ReportProblem({
  email,
  onSend,
  bubbleMs = 5000,
}: {
  /** The signed-in owner's address, so we can answer. */
  email?: string
  /** Replaces the network call, for the demo. Throw to show a failure. */
  onSend?: (message: string) => Promise<void>
  /** How long the bubble shows on arrival. */
  bubbleMs?: number
}) {
  const [open, setOpen] = useState(false)
  const [bubble, setBubble] = useState(true)
  const [hover, setHover] = useState(false)
  const [kind, setKind] = useState<Kind | null>(null)
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  useEffect(() => {
    const t = setTimeout(() => setBubble(false), bubbleMs)
    return () => clearTimeout(t)
  }, [bubbleMs])

  // The rail does not carry the user; read the address when the box opens, so we can answer.
  const [who, setWho] = useState(email || '')
  useEffect(() => {
    if (!open || who || onSend) return
    createClient().auth.getUser().then(({ data }) => setWho(data.user?.email || '')).catch(() => {})
  }, [open, who, onSend])

  const ready = text.trim().length >= 5 && state !== 'sending'

  async function send() {
    if (!ready) return
    setState('sending')
    const label = KINDS.find((k) => k.key === kind)?.label || 'غير محدد'
    const message = `[من لوحة التحكم · ${typeof window !== 'undefined' ? window.location.pathname : ''} · ${label}]\n\n${text.trim()}`
    try {
      if (onSend) await onSend(message)
      else {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: who, topic: 'support', message }),
        })
        if (!res.ok) throw new Error('send')
      }
      setState('sent')
    } catch {
      setState('failed')
    }
  }

  function onOpenChange(v: boolean) {
    setOpen(v)
    if (v) setBubble(false)
    if (!v && state === 'sent') { setText(''); setKind(null); setState('idle') }
    if (!v && state === 'failed') setState('idle')
  }

  const showBubble = (bubble || hover) && !open

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <div className="relative mb-2 flex items-center gap-2" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#5e6ad2] transition-transform hover:scale-105"
            style={{ boxShadow: '0 0 0 1px rgba(17,17,17,0.08), 0 1px 2px rgba(17,17,17,0.06)' }}
            aria-label="واجهت مشكلة؟ أخبرنا"
          >
            <LifeBuoy className="h-4 w-4" strokeWidth={2} />
          </button>
        </Dialog.Trigger>
        <span
          className="pointer-events-none relative whitespace-nowrap rounded-xl bg-[#171717] px-2.5 py-1.5 text-[12.5px] font-bold leading-[1.5] text-white"
          style={{ opacity: showBubble ? 1 : 0, transform: `translateX(${showBubble ? 0 : 6}px)`, transition: 'opacity .35s ease, transform .35s ease' }}
          aria-hidden
        >
          عندك مشكلة؟ أخبرنا
          <span className="absolute top-1/2 -translate-y-1/2 border-[5px] border-transparent" style={{ insetInlineStart: -9, borderInlineEndColor: '#171717' }} />
        </span>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-[rgba(17,17,20,0.38)] backdrop-blur-[2px]" />
        <Dialog.Content
          dir="rtl"
          className="zy-tokens fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-32px)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-white"
          style={{ boxShadow: '0 24px 70px rgba(17,17,17,0.24), 0 0 0 1px rgba(17,17,17,0.06)' }}
        >
          <div className="flex items-start gap-3 px-5 pb-4 pt-5" style={{ background: 'linear-gradient(#f5f6fd, #ffffff)' }}>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#5e6ad2]" style={{ boxShadow: '0 0 0 1px rgba(94,106,210,0.18)' }}>
              <LifeBuoy className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-[17px] font-black leading-[1.5] text-[#171717]">أخبرنا بالمشكلة</Dialog.Title>
              <Dialog.Description className="text-[13.5px] font-medium leading-[1.7] text-[#66666e]">
                فريق زينيا يقرأ كل رسالة ويرد عليك بالبريد.
              </Dialog.Description>
            </div>
            <Dialog.Close className="zy-icon-btn inline-flex" aria-label="إغلاق"><X className="h-4 w-4" /></Dialog.Close>
          </div>

          {state === 'sent' ? (
            <div className="grid justify-items-center gap-2 px-5 pb-6 pt-4 text-center">
              <CheckCircle2 className="h-11 w-11 text-[#1f8a4c]" strokeWidth={1.75} />
              <p className="text-[16px] font-black text-[#171717]">وصلتنا رسالتك</p>
              <p className="max-w-[300px] text-[14px] font-medium leading-[1.8] text-[#66666e]">
                سنرد عليك {who ? <>على <span dir="ltr" className="font-bold text-[#171717]">{who}</span></> : 'على بريدك'} في أقرب وقت.
              </p>
              <Dialog.Close className="zy-btn mt-2 min-w-[120px] justify-center">تم</Dialog.Close>
            </div>
          ) : (
            <form className="grid gap-4 px-5 pb-5" onSubmit={(e) => { e.preventDefault(); send() }}>
              <fieldset className="grid gap-2">
                <legend className="mb-2 text-[13.5px] font-bold text-[#171717]">المشكلة في</legend>
                <div className="flex flex-wrap gap-1.5">
                  {KINDS.map((k) => (
                    <button
                      key={k.key}
                      type="button"
                      onClick={() => setKind(k.key)}
                      aria-pressed={kind === k.key}
                      className="min-h-[34px] rounded-full px-3 text-[13.5px] font-bold transition-colors"
                      style={kind === k.key
                        ? { background: '#171717', color: '#fff' }
                        : { background: '#f4f4f6', color: '#3a3a40', boxShadow: 'inset 0 0 0 1px rgba(17,17,17,0.06)' }}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-1.5">
                <span className="text-[13.5px] font-bold text-[#171717]">ماذا حدث؟</span>
                <textarea
                  id="report-problem-text"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 2000))}
                  rows={4}
                  autoFocus
                  dir="auto"
                  placeholder="مثلًا: ضغطت «احفظ» في المحرّر ولم يتغيّر موقعي."
                  className="w-full rounded-xl px-3 py-2.5 text-[14.5px] font-medium leading-[1.8]"
                  aria-label="اكتب المشكلة"
                />
                <span className="text-[12.5px] font-medium text-[#8a8a92]">نرسل معها اسم الصفحة التي كنت فيها، لنفهم المشكلة أسرع.</span>
              </label>
              {state === 'failed' && (
                <p role="alert" className="rounded-xl px-3 py-2 text-[13.5px] font-bold" style={{ background: '#fdecea', color: '#c0362c' }}>لم تُرسل. تأكد من اتصالك وحاول مرة أخرى.</p>
              )}
              <div className="flex items-center gap-2">
                <button type="submit" disabled={!ready} className="zy-btn min-w-[110px] justify-center disabled:opacity-50">
                  {state === 'sending' ? 'جارٍ الإرسال…' : 'أرسل'}
                </button>
                <Dialog.Close className="zy-btn-q">إلغاء</Dialog.Close>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
