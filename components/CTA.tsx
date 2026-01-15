'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-2xl sm:px-12 sm:py-20"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-500" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -20, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" 
        />
        
        <div className="relative z-10 mx-auto max-w-2xl">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Ready to launch your brand?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-4 max-w-lg text-lg text-indigo-100"
          >
            Join 1,000+ dropshippers building trustworthy one-product stores with Zenya.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/pricing" className="rounded-full bg-white px-8 py-4 font-bold text-primary shadow-lg transition duration-300 hover:scale-105 hover:bg-gray-50">
              Start building for free
            </Link>
            <Link href="/pricing" className="rounded-full border border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition duration-300 hover:bg-white/20">
              View pricing
            </Link>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-sm text-indigo-200"
          >
            No credit card required · 14-day free trial on Pro
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
}
