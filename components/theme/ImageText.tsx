
import { motion } from 'framer-motion'

export default function ImageText({ 
  title, 
  text, 
  image, 
  ctaText, 
  ctaUrl, 
  layout = 'left',
  primaryColor
}: { 
  title: string
  text: string
  image: string
  ctaText?: string
  ctaUrl?: string
  layout?: 'left' | 'right'
  primaryColor: string
}) {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`w-full lg:w-1/2 ${layout === 'right' ? 'lg:order-2' : ''}`}
          >
            <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-xl bg-slate-200">
              <img 
                src={image} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          <div className="w-full lg:w-1/2 space-y-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-slate-900"
            >
              {title}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 leading-relaxed"
            >
              {text}
            </motion.p>
            {ctaText && (
              <motion.a 
                href={ctaUrl || '#'} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-bold text-white shadow-lg transition hover:opacity-90" 
                style={{ backgroundColor: primaryColor }}
              >
                {ctaText}
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
