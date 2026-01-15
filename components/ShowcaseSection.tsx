'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const themes = [
  { name: 'Modern Tech', color: 'from-blue-500 to-cyan-400' },
  { name: 'Organic Beauty', color: 'from-green-400 to-emerald-600' },
  { name: 'Urban Fashion', color: 'from-purple-500 to-pink-500' },
]

export default function ShowcaseSection() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Built with Zenya
          </h2>
          <p className="mt-4 text-lg text-muted">
            Stunning, conversion-optimized themes generated in seconds.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {themes.map((theme, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-token bg-surface shadow-md"
            >
              {/* Abstract Placeholder for Theme Preview */}
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="w-full h-full bg-white shadow-xl rounded-lg overflow-hidden flex flex-col transform group-hover:scale-105 transition-transform duration-500">
                    {/* Mock Header */}
                    <div className="h-4 bg-slate-100 border-b flex items-center px-2 gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                    {/* Mock Content */}
                    <div className="flex-1 bg-slate-50 relative p-4 space-y-2">
                        <div className="w-3/4 h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-1/2 h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className={`w-full h-32 mt-4 rounded-lg bg-gradient-to-r ${theme.color} opacity-50`}></div>
                        <div className="space-y-1 mt-4">
                            <div className="w-full h-2 bg-slate-200 rounded"></div>
                            <div className="w-full h-2 bg-slate-200 rounded"></div>
                            <div className="w-2/3 h-2 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/90 to-transparent">
                 <h3 className="text-lg font-bold text-slate-900">{theme.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
