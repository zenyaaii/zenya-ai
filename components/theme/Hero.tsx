import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Hero({ 
  headline, 
  subheadline, 
  cta, 
  image, 
  primaryColor,
  onShopNow
}: { 
  headline: string
  subheadline: string
  cta: string
  image: string
  primaryColor: string
  onShopNow?: () => void
}) {
  return (
    <section className="relative overflow-hidden bg-white py-20 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              New Arrival • Limited Stock
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
              {headline}
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onShopNow}
                className="rounded-full px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                {cta}
              </button>
              <div className="flex items-center gap-2 px-4 py-4 text-sm font-medium text-slate-500">
                <div className="flex -space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-6 w-6 rounded-full border-2 border-white bg-slate-200 z-${i}`} />
                  ))}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="flex text-yellow-400">★★★★★</span>
                  <span className="text-xs">1,000+ Happy Customers</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-2xl">
              <Image 
                src={image} 
                alt="Product Hero" 
                fill 
                className="object-cover"
                priority
              />
            </div>
            {/* Float Element */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-4 shadow-xl backdrop-blur-md bg-white/90">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-900">
                  100+ bought<br/>in last 24h
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
