"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function Slideshow({ 
  slides,
  primaryColor 
}: { 
  slides: { heading: string; subheading: string; cta: string; image?: string }[]
  primaryColor: string
}) {
  const [current, setCurrent] = useState(0)

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides || slides.length === 0) return null

  return (
    <div className="relative h-[600px] w-full overflow-hidden bg-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Image (Mock) */}
          <div className="absolute inset-0 opacity-50">
             <Image 
               src={slides[current].image || `https://images.unsplash.com/photo-1558317374-a309d244678e?q=80&w=1920&auto=format&fit=crop`}
               alt={slides[current].heading}
               fill
               className="object-cover"
               priority
             />
          </div>
          <div className="absolute inset-0 bg-black/40" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-3xl px-6">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 text-5xl font-extrabold text-white md:text-7xl"
              >
                {slides[current].heading}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-10 text-xl text-slate-100 md:text-2xl"
              >
                {slides[current].subheading}
              </motion.p>
              <motion.button 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-full px-10 py-4 text-lg font-bold text-white shadow-xl transition hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                {slides[current].cta}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-3 w-3 rounded-full transition-all ${
              current === i ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
