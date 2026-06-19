
import { motion } from 'framer-motion'

export default function FeaturedCollection({ 
  title, 
  products = [], 
  primaryColor 
}: { 
  title: string
  products?: any[]
  primaryColor: string
}) {
  // Demo products if none provided
  const displayProducts = products.length > 0 ? products : [1, 2, 3, 4]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-slate-900 mb-12 text-center"
        >
          {title}
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {displayProducts.map((product, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[1/1] overflow-hidden rounded-xl bg-slate-100 mb-4">
                 <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                    {/* Placeholder SVG */}
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 {i === 0 && (
                   <div className="absolute top-2 start-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">تخفيض</div>
                 )}
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">منتج تجريبي {i + 1}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-slate-900">$49.99</span>
                {i === 0 && (
                  <span className="text-sm text-slate-400 line-through">$89.99</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
