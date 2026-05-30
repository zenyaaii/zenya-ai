"use client"
import { motion } from 'framer-motion'

export default function VisualShowcase({ 
  image,
  primaryColor,
  onShopNow,
  heading = 'Experience Perfection',
  subheading = "Don't settle for less. Join thousands of satisfied customers who have upgraded their lifestyle.",
  cta = 'Get Yours Today',
}: { 
  image: string
  primaryColor: string
  onShopNow?: () => void
  heading?: string
  subheading?: string
  cta?: string
}) {
  return (
    <section className="relative h-[600px] w-full overflow-hidden bg-slate-900">
      <div className="absolute inset-0 opacity-60">
        <img
          src={image}
          alt="Lifestyle Showcase"
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="relative z-10 flex h-full items-end justify-center pb-20 text-center">
        <div className="px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl drop-shadow-lg">
              {heading}
            </h2>
            <p className="mb-8 text-lg text-slate-200 drop-shadow-md">
              {subheading}
            </p>
            <button 
              onClick={onShopNow}
              className="rounded-full px-10 py-4 text-lg font-bold text-white shadow-2xl transition hover:scale-105 active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              {cta}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
