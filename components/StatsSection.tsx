'use client'

import { motion } from 'framer-motion'

type Stat = { value: string; label: string; color: string }

const STATS: Stat[] = [
  { value: '8',         label: 'Live templates',       color: '#5e6ad2' },
  { value: '2,400+',    label: 'Sites launched',       color: '#d97706' },
  { value: 'Under 1m',  label: 'Avg. time to live',    color: '#27a644' },
  { value: '99.9%',     label: 'Uptime, 30-day',       color: '#5e6ad2' },
]

export default function StatsSection() {
  return (
    <section className="relative border-b border-token bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <div
                className="text-[38px] font-[590] leading-[1] tracking-[-1.5px]"
                style={{
                  background: `linear-gradient(120deg, ${s.color} 0%, ${s.color}99 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="mt-1.5 text-[12.5px] font-medium text-muted">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
