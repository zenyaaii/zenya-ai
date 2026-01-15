"use client"
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-32">
      {/* Animated Background Blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            x: [0, 50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-[20%] h-[400px] w-[400px] rounded-full bg-accent/15 blur-[100px]" 
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-6 w-fit rounded-full border border-token bg-surface/50 px-4 py-1.5 text-sm font-medium text-muted backdrop-blur-sm">
            ✨ <span className="text-foreground">New:</span> Smart AI Color Generation
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
            Design that converts for <br className="hidden sm:block" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">one-product stores</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl">
            Generate trustworthy pages with persuasive copy, curated images, and brand colors — in minutes. No design skills required.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }} 
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/pricing" className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary px-8 py-4 font-medium text-white shadow-glow transition duration-300 hover:scale-105 hover:shadow-lg">
            <span className="mr-2">Start for free</span>
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link href="/pricing" className="inline-flex items-center justify-center rounded-full border border-token bg-white/50 px-8 py-4 font-medium text-foreground backdrop-blur-sm transition duration-300 hover:bg-surface hover:shadow-soft-md">
            View pricing
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4 text-sm text-muted sm:flex-row sm:justify-center"
        >
          <div className="flex -space-x-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-200" style={{ backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${i})` }} />
            ))}
          </div>
          <div className="flex gap-1">
            ⭐⭐⭐⭐⭐ <span className="font-medium text-foreground">Trusted by 1,000+ dropshippers</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
