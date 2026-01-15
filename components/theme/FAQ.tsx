"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FAQ({ 
  faqs, 
  primaryColor 
}: { 
  faqs: { q: string; a: string }[]
  primaryColor: string 
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left transition hover:bg-slate-50"
              >
                <span className="font-bold text-slate-900">{faq.q}</span>
                <span className={`transform transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-slate-50 rounded-2xl p-8 border border-slate-100">
           <h3 className="font-bold text-slate-900 mb-2">Still have questions?</h3>
           <p className="text-slate-600 mb-6 text-sm">We are here to help you 24/7. Contact our support team.</p>
           <a 
             href="mailto:support@example.com"
             className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
             style={{ backgroundColor: primaryColor }}
           >
             Contact Support
           </a>
        </div>
      </div>
    </section>
  )
}
