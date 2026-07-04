'use client'

import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'

const EASE = [0.22, 1, 0.36, 1] as const

/** Illustrative "amateur site" pain points vs what Zenya delivers. These are
 *  generic, honest contrasts — not claims about any specific customer. */
const BEFORE = ['ألوان متضاربة وخطوط عشوائية', 'نصوص مكتوبة على عجل', 'يبدو مبنيًا بالهواة', 'بطيء وغير متجاوب مع الجوال']
const AFTER = ['تصميم متناسق بهوية واضحة', 'محتوى مقنع يكتبه الذكاء الاصطناعي', 'يبدو أنك دفعت لوكالة', 'سريع ومتجاوب على كل شاشة']

export default function BeforeAfterSection() {
  return (
    <section className="relative border-b border-token py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="mb-16 text-center">
            <p className="kicker mb-3">قبل وبعد</p>
            <h2 className="heading-ar text-[clamp(26px,4.5vw,42px)] text-foreground">
              الفرق الذي{' '}
              <span className="gradient-text">يراه عملاؤك.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.85] text-muted">
              الزائر يحكم على نشاطك في ثوانٍ. موقع غير احترافي يُفقدك الثقة — ومعها المبيعات.
              زينيا يقلب المعادلة.
            </p>
          </div>
        </Reveal>

        {/* ── Diagonal before→after. RTL: "قبل" starts top-right, the redesign
            "بعد" lands bottom-left, so the eye travels the way Arabic reads.
            Tablet & desktop show laptop mockups; phones show phone mockups so
            each device frame fits its screen naturally. ── */}
        <div className="relative mx-auto hidden h-[460px] w-full max-w-[840px] md:block lg:h-[520px]">
          <Stage device="laptop" />
        </div>
        <div className="relative mx-auto h-[400px] w-full max-w-[330px] md:hidden">
          <Stage device="phone" />
        </div>

        {/* ── The contrast, spelled out ── */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 md:mt-20">
          <ul className="space-y-2.5">
            {BEFORE.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] text-muted">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(220,38,38,0.10)]">
                  <X className="h-3 w-3 text-[#dc2626]" strokeWidth={2.5} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <ul className="space-y-2.5">
            {AFTER.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] font-medium text-foreground">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(39,166,68,0.12)]">
                  <Check className="h-3 w-3 text-[#27a644]" strokeWidth={2.5} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/** Small pill label that sits above each laptop (our stand-in for the
 *  reference's vertical BEFORE / AFTER type). */
function Label({ tone }: { tone: 'bad' | 'good' }) {
  const bad = tone === 'bad'
  return (
    <span
      className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
      style={
        bad
          ? { background: 'rgba(28,28,28,0.06)', color: 'rgba(28,28,28,0.45)' }
          : { background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }
      }
    >
      {bad ? 'قبل' : 'بعد · مع زينيا'}
    </span>
  )
}

/** Renders the before→after diagonal with a given device frame. Laptop frames
 *  on tablet/desktop; phone frames on phones — each device fits its own screen
 *  naturally instead of a shrunken laptop. */
function Stage({ device }: { device: 'laptop' | 'phone' }) {
  const isPhone = device === 'phone'
  const Frame = isPhone ? Phone : Laptop
  const beforeW = isPhone ? 'w-[43%]' : 'w-[54%]'
  const afterW = isPhone ? 'w-[50%]' : 'w-[64%]'
  return (
    <>
      {/* BEFORE — smaller, faded, up in the start (right, RTL) corner */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`absolute start-0 top-0 z-10 ${beforeW}`}
      >
        <Label tone="bad" />
        <Frame tone="bad" />
      </motion.div>

      {/* Connector arrow, sweeping from BEFORE down to AFTER */}
      <motion.svg
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
        className="pointer-events-none absolute left-1/2 top-[40%] z-30 h-14 w-14 -translate-x-1/2 sm:h-20 sm:w-20 md:h-28 md:w-28"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path d="M78 20 C 55 40, 45 55, 26 74" stroke="#5e6ad2" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
        <path d="M26 74 l 12 -3 M26 74 l 3 -12" stroke="#5e6ad2" strokeWidth="3" strokeLinecap="round" />
      </motion.svg>

      {/* AFTER — larger, crisp, in the end (left, RTL) corner */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
        className={`absolute bottom-0 end-0 z-20 ${afterW}`}
      >
        <Label tone="good" />
        <Frame tone="good" />
      </motion.div>
    </>
  )
}

/** Shared frame chrome tint. */
function frameShadow(bad: boolean) {
  return bad
    ? '0 18px 40px -22px rgba(28,28,28,0.4)'
    : '0 40px 80px -34px rgba(94,106,210,0.55), 0 0 0 1px rgba(94,106,210,0.10)'
}

/** A CSS laptop: bezel + browser chrome + storefront + silver base. */
function Laptop({ tone }: { tone: 'bad' | 'good' }) {
  const bad = tone === 'bad'
  return (
    <div style={{ filter: bad ? 'grayscale(0.3) saturate(0.85)' : 'none', opacity: bad ? 0.92 : 1 }}>
      {/* Lid / bezel */}
      <div
        className="rounded-[14px] p-2.5"
        style={{ background: 'linear-gradient(160deg,#2a2b31,#17181c)', boxShadow: frameShadow(bad) }}
      >
        <div className="overflow-hidden rounded-md bg-white" style={{ border: '1px solid rgba(0,0,0,0.35)' }}>
          <Chrome tone={tone} />
          <StoreMock tone={tone} />
        </div>
      </div>
      {/* Base / hinge */}
      <div
        className="relative mx-auto h-3 rounded-b-[10px]"
        style={{ width: '112%', marginInlineStart: '-6%', background: 'linear-gradient(180deg,#d7d8dd,#a9abb3)', boxShadow: '0 10px 18px -8px rgba(28,28,28,0.35)' }}
      >
        <div className="absolute left-1/2 top-0 h-1.5 w-16 -translate-x-1/2 rounded-b-lg" style={{ background: 'linear-gradient(180deg,#9a9ca4,#c3c5cb)' }} />
      </div>
    </div>
  )
}

/** A CSS phone: rounded body + notch + storefront. Used on phones. */
function Phone({ tone }: { tone: 'bad' | 'good' }) {
  const bad = tone === 'bad'
  return (
    <div style={{ filter: bad ? 'grayscale(0.3) saturate(0.85)' : 'none', opacity: bad ? 0.92 : 1 }}>
      <div
        className="rounded-[26px] p-[5px]"
        style={{ background: 'linear-gradient(160deg,#2a2b31,#17181c)', boxShadow: frameShadow(bad) }}
      >
        <div className="relative overflow-hidden rounded-[22px] bg-white" style={{ border: '1px solid rgba(0,0,0,0.35)' }}>
          {/* Notch */}
          <div className="absolute left-1/2 top-1.5 z-10 h-1.5 w-11 -translate-x-1/2 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }} />
          {/* Status-bar spacer so content clears the notch */}
          <div className="h-5" style={{ background: bad ? '#fffbe6' : '#f7f4ed' }} />
          <StoreMock tone={tone} />
        </div>
      </div>
    </div>
  )
}

/** The mac-style browser chrome bar (laptop only). */
function Chrome({ tone }: { tone: 'bad' | 'good' }) {
  const bad = tone === 'bad'
  return (
    <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid #f0ede6', background: '#faf8f3' }}>
      <span className="h-2 w-2 rounded-full" style={{ background: '#fca5a5' }} />
      <span className="h-2 w-2 rounded-full" style={{ background: '#fcd34d' }} />
      <span className="h-2 w-2 rounded-full" style={{ background: '#86efac' }} />
      <span
        className="ms-auto rounded px-2 py-0.5 text-[9px] font-semibold"
        style={bad ? { background: 'rgba(220,38,38,0.10)', color: '#dc2626' } : { background: 'rgba(39,166,68,0.10)', color: '#27a644' }}
      >
        {bad ? 'موقع هاوٍ' : 'مع زينيا'}
      </span>
    </div>
  )
}

/** The mock storefront content shared by both device frames. */
function StoreMock({ tone }: { tone: 'bad' | 'good' }) {
  const bad = tone === 'bad'
  return (
    <>
      {bad ? (
        // Amateur: clashing colors, cramped, misaligned
        <div className="min-h-[122px] p-3 sm:min-h-[168px] sm:p-4 md:min-h-[200px]" style={{ background: '#fffbe6' }}>
          <div className="mb-2 inline-block rounded px-2 py-1 text-[13px] font-black" style={{ background: '#ff00aa', color: '#00e0ff', transform: 'rotate(-2deg)' }}>
            متجــري !!!
          </div>
          <div className="mb-1.5 h-2 w-4/5 rounded-sm" style={{ background: '#c026d3' }} />
          <div className="mb-1.5 h-2 w-full rounded-sm" style={{ background: '#9ca3af' }} />
          <div className="mb-3 h-2 w-2/3 rounded-sm" style={{ background: '#9ca3af' }} />
          <div className="flex gap-1.5">
            <div className="h-11 w-16 rounded" style={{ background: 'repeating-linear-gradient(45deg,#d1d5db,#d1d5db 4px,#e5e7eb 4px,#e5e7eb 8px)' }} />
            <div className="h-11 flex-1 rounded" style={{ background: '#e5e7eb' }} />
          </div>
          <div className="mt-3 inline-block rounded px-3 py-1 text-[11px] font-bold text-white" style={{ background: '#16a34a', border: '2px dashed #ef4444' }}>
            اشترِ الآن!!!
          </div>
        </div>
      ) : (
        // Zenya: clean, calm, on-brand
        <div className="min-h-[122px] p-3.5 sm:min-h-[168px] sm:p-4 md:min-h-[200px] md:p-5" style={{ background: '#f7f4ed' }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="h-3 w-16 rounded-full" style={{ background: 'linear-gradient(90deg,#5e6ad2,#8b93e0)' }} />
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => <div key={i} className="h-1.5 w-6 rounded-full bg-[rgba(28,28,28,0.10)]" />)}
            </div>
          </div>
          <div className="mb-2 h-3.5 w-3/4 rounded-full" style={{ background: 'rgba(28,28,28,0.75)' }} />
          <div className="mb-1.5 h-2 w-full rounded-full bg-[rgba(28,28,28,0.10)]" />
          <div className="mb-4 h-2 w-5/6 rounded-full bg-[rgba(28,28,28,0.10)]" />
          <div className="flex gap-2">
            <div className="h-16 flex-1 rounded-lg bg-white" style={{ boxShadow: '0 2px 8px rgba(28,28,28,0.06)' }} />
            <div className="h-16 flex-1 rounded-lg bg-white" style={{ boxShadow: '0 2px 8px rgba(28,28,28,0.06)' }} />
          </div>
          <div className="mt-4 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: '#5e6ad2', boxShadow: '0 6px 16px -6px rgba(94,106,210,0.6)' }}>
            ابدأ الآن
          </div>
        </div>
      )}
    </>
  )
}
