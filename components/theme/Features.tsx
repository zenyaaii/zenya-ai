import { motion } from 'framer-motion'
import { Icon } from '@/components/icons'

export default function Features({
  features,
  primaryColor
}: {
  features: { title: string; desc: string; icon: string }[]
  primaryColor: string
}) {
  return (
    <section className="bg-slate-50 py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-500">لماذا يتميّز</span>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">مصمَّم للتميّز</h2>
          <p className="mt-4 text-lg text-slate-600">ركّزنا على كل تفصيلة كي لا تضطر أنت. اختبر المزيج المثالي بين الشكل والوظيفة.</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-slate-50 transition group-hover:scale-150 group-hover:bg-slate-100" />
              
              <div
                className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition group-hover:scale-110 relative z-10"
                style={{ backgroundColor: primaryColor }}
              >
                {/* Full animated icon library — AI picks the name, we resolve
                    it to a real lucide glyph (falls back to the title text). */}
                <Icon
                  name={feature.icon || feature.title}
                  size={28}
                  animation="draw"
                  className="[&_svg]:h-7 [&_svg]:w-7"
                />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 relative z-10">{feature.title}</h3>
              <p className="leading-relaxed text-slate-600 relative z-10">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
