'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CTA() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl bg-primary px-10 py-16 text-center sm:px-20"
          style={{
            boxShadow:
              '0 24px 64px rgba(94,106,210,0.25), 0 0 0 1px rgba(94,106,210,0.5)',
          }}
        >
          {/* Subtle dot grid overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Top highlight */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px opacity-40"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            }}
          />
          {/* Soft drifting orbs inside the CTA block */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full blur-3xl will-change-transform aurora-orb-1"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-20 h-[280px] w-[280px] rounded-full blur-3xl will-change-transform aurora-orb-2"
            style={{ background: 'rgba(217,119,6,0.18)' }}
          />

          <div className="relative z-10 mx-auto max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              Join 2,400+ founders &amp; operators
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[38px] font-[590] leading-[1.1] tracking-[-1.2px] text-white sm:text-[46px] sm:tracking-[-1.6px]"
            >
              Launch your website today.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="mx-auto mt-4 max-w-sm text-[16px] leading-[1.6]"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Pick one of eight templates, share a brief, and get a live site in
              under a minute. No design or dev work required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24, duration: 0.4 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                href="/login?mode=signup"
                className={cn(
                  'group inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-[14px] font-semibold text-primary transition-all duration-150',
                  'hover:opacity-90 active:scale-[0.98]'
                )}
                style={{ boxShadow: 'rgba(0,0,0,0.10) 0px 1px 3px 0px' }}
              >
                Start for free
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Link>
              <Link
                href="/themes"
                className="inline-flex items-center rounded-md border border-white/20 px-6 py-3 text-[14px] font-medium transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
                style={{ color: 'rgba(255,255,255,0.88)' }}
              >
                Browse templates
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.38 }}
              className="mt-5 text-[12.5px]"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              No credit card required · Cancel anytime
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
