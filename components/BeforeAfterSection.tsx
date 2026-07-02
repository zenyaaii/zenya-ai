'use client'

import { motion } from 'framer-motion'
import { X, Check, ArrowLeft } from 'lucide-react'
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
          <div className="mb-14 text-center">
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

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <MockWindow tone="bad" />
            <ul className="mt-5 space-y-2.5">
              {BEFORE.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13.5px] text-muted">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(220,38,38,0.10)]">
                    <X className="h-3 w-3 text-[#dc2626]" strokeWidth={2.5} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
            className="mx-auto hidden h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-soft-md md:flex"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          >
            <MockWindow tone="good" />
            <ul className="mt-5 space-y-2.5">
              {AFTER.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13.5px] font-medium text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(39,166,68,0.12)]">
                    <Check className="h-3 w-3 text-[#27a644]" strokeWidth={2.5} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/** Pure-CSS mock storefront — "bad" is deliberately cramped/clashing, "good"
 *  mirrors the clean Zenya aesthetic. No external images. */
function MockWindow({ tone }: { tone: 'bad' | 'good' }) {
  const bad = tone === 'bad'
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white"
      style={{
        border: '1px solid #e5e2d9',
        boxShadow: bad
          ? '0 8px 24px -12px rgba(28,28,28,0.18)'
          : '0 24px 60px -24px rgba(94,106,210,0.35), 0 0 0 1px rgba(94,106,210,0.14)',
      }}
    >
      {/* chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ borderBottom: '1px solid #f0ede6', background: '#faf8f3' }}>
        <span className="h-2 w-2 rounded-full" style={{ background: '#fca5a5' }} />
        <span className="h-2 w-2 rounded-full" style={{ background: '#fcd34d' }} />
        <span className="h-2 w-2 rounded-full" style={{ background: '#86efac' }} />
        <span
          className="ms-auto rounded px-2 py-0.5 text-[9px] font-semibold"
          style={
            bad
              ? { background: 'rgba(220,38,38,0.10)', color: '#dc2626' }
              : { background: 'rgba(39,166,68,0.10)', color: '#27a644' }
          }
        >
          {bad ? 'موقع هاوٍ' : 'مع زينيا'}
        </span>
      </div>

      {bad ? (
        // Amateur: clashing colors, cramped, misaligned
        <div className="p-4" style={{ background: '#fffbe6', minHeight: 190 }}>
          <div className="mb-2 inline-block rounded px-2 py-1 text-[13px] font-black" style={{ background: '#ff00aa', color: '#00e0ff', transform: 'rotate(-2deg)' }}>
            متجــري !!!
          </div>
          <div className="mb-1.5 h-2 w-4/5 rounded-sm" style={{ background: '#c026d3' }} />
          <div className="mb-1.5 h-2 w-full rounded-sm" style={{ background: '#9ca3af' }} />
          <div className="mb-3 h-2 w-2/3 rounded-sm" style={{ background: '#9ca3af' }} />
          <div className="flex gap-1.5">
            <div className="h-10 w-14 rounded" style={{ background: 'repeating-linear-gradient(45deg,#d1d5db,#d1d5db 4px,#e5e7eb 4px,#e5e7eb 8px)' }} />
            <div className="h-10 flex-1 rounded" style={{ background: '#e5e7eb' }} />
          </div>
          <div className="mt-3 inline-block rounded px-3 py-1 text-[11px] font-bold text-white" style={{ background: '#16a34a', border: '2px dashed #ef4444' }}>
            اشترِ الآن!!!
          </div>
        </div>
      ) : (
        // Zenya: clean, calm, on-brand
        <div className="p-5" style={{ background: '#f7f4ed', minHeight: 190 }}>
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
            <div className="h-14 flex-1 rounded-lg bg-white" style={{ boxShadow: '0 2px 8px rgba(28,28,28,0.06)' }} />
            <div className="h-14 flex-1 rounded-lg bg-white" style={{ boxShadow: '0 2px 8px rgba(28,28,28,0.06)' }} />
          </div>
          <div className="mt-4 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: '#5e6ad2', boxShadow: '0 6px 16px -6px rgba(94,106,210,0.6)' }}>
            ابدأ الآن
          </div>
        </div>
      )}
    </div>
  )
}
