'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const items = [
  { name: 'Alex M.', text: 'Launched in a weekend — the copy and sections are spot on.' },
  { name: 'Sara L.', text: 'Looks truly professional and it helped our conversions.' },
  { name: 'Kenji P.', text: 'Love the speed. Scrape, pick, preview — done.' }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const card = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
}

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden py-24 bg-surface/30">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Testimonials
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Trusted by one-product sellers
          </h2>
          <p className="mt-4 text-lg text-muted">
            Real results from real store owners who shipped faster with Zenya.
          </p>
        </motion.div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-8 md:grid-cols-3"
        >
          {items.map((t, i) => (
            <motion.div variants={card} key={t.name} className="relative rounded-2xl border border-token bg-elevated p-8 shadow-soft-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft-lg">
              {/* Stars */}
              <div className="flex gap-1 text-yellow-400 mb-4">
                {[1,2,3,4,5].map(s => <span key={s}>★</span>)}
              </div>
              
              <p className="text-foreground leading-relaxed mb-6">&quot;{t.text}&quot;</p>
              
              <div className="flex items-center gap-4 border-t border-token pt-4 mt-auto">
                <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-surface">
                  <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.name)}`} alt="" fill className="object-cover" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{t.name}</div>
                  <div className="text-xs text-muted">Verified User</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
