"use client"
import { motion } from 'framer-motion'

export default function HowItWorks({ 
  primaryColor 
}: { 
  primaryColor: string 
}) {
  const steps = [
    { 
      title: "Place Your Order", 
      desc: "Select your preferred options and checkout securely in seconds.",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    { 
      title: "We Ship Fast", 
      desc: "Our team packs your order with care and ships it within 24 hours.",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    { 
      title: "Enjoy Your Product", 
      desc: "Receive your package and experience the quality difference.",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-slate-600">Simple, fast, and hassle-free process.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex flex-col items-center text-center bg-white"
            >
              <div 
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl border-4 border-slate-50"
                style={{ color: primaryColor }}
              >
                {step.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="max-w-xs text-sm text-slate-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
