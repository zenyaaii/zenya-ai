import { motion } from 'framer-motion'

export default function Testimonials({ 
  testimonials, 
  primaryColor 
}: { 
  testimonials: { name: string; text: string; location: string; rating: number }[]
  primaryColor: string 
}) {
  return (
    <section className="bg-slate-900 py-24 text-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
             <div className="flex -space-x-2">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className={`h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold`}>{String.fromCharCode(64+i)}</div>
               ))}
             </div>
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">Loved by 50,000+ Customers</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">Join the community of happy customers who have transformed their lives with our product.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            (() => {
              const safeName = typeof (t as any)?.name === 'string' ? (t as any).name.trim() : ''
              const safeText = typeof (t as any)?.text === 'string' ? (t as any).text.trim() : ''
              const safeLocation = typeof (t as any)?.location === 'string' ? (t as any).location.trim() : ''
              const ratingRaw = Number((t as any)?.rating)
              const safeRating = Number.isFinite(ratingRaw) ? Math.max(1, Math.min(5, Math.round(ratingRaw))) : 5
              const initial = safeName.charAt(0) || '✓'
              return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl bg-slate-800 p-8 pt-12"
            >
              <div className="absolute -top-6 left-8 h-12 w-12 rounded-full bg-slate-700 border-4 border-slate-900 flex items-center justify-center font-bold text-slate-300 text-xl shadow-lg">
                &rdquo;
              </div>
              
              <div className="flex gap-1 mb-6 text-yellow-400 text-sm">
                {[...Array(safeRating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              
              <p className="mb-8 text-lg leading-relaxed text-slate-300 italic">
                &ldquo;{safeText}&rdquo;
              </p>
              
              <div className="flex items-center gap-4 border-t border-slate-700/50 pt-6">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-slate-300 shadow-inner">
                  {initial}
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {safeName || 'Verified Buyer'}
                    <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full border border-green-800">Verified</span>
                  </div>
                  <div className="text-xs text-slate-500">{safeLocation || 'Verified Buyer'}</div>
                </div>
              </div>
            </motion.div>
              )
            })()
          ))}
        </div>
      </div>
    </section>
  )
}
