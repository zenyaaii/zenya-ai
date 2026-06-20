'use client'

import { motion } from 'framer-motion'
import Counter from '@/components/marketing/Counter'

type Stat = { value: string; label: string; color: string }

const STATS: Stat[] = [
  { value: '8',              label: 'قوالب متاحة',          color: '#5e6ad2' },
  { value: '2,400+',         label: 'موقع تم إطلاقه',       color: '#d97706' },
  { value: 'أقل من دقيقة',   label: 'متوسط وقت الإطلاق',    color: '#27a644' },
  { value: '99.9%',          label: 'وقت التشغيل، 30 يومًا', color: '#5e6ad2' },
]

export default function StatsSection() {
  return (
    <section className="relative border-b border-token bg-white py-16">
      {/* hairline top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(94,106,210,0.35), transparent)' }}
      />
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:divide-x md:divide-[#f0ede6] rtl:md:divide-x-reverse">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col md:items-center md:px-4 md:text-center"
            >
              <div
                className="tnum text-[clamp(30px,4vw,42px)] font-extrabold leading-[1]"
                style={{
                  background: `linear-gradient(120deg, ${s.color} 0%, ${s.color}aa 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                <Counter value={s.value} />
              </div>
              <div className="mt-2 text-[12.5px] font-medium text-muted">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
