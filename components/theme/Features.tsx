import { motion } from 'framer-motion'

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
                className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg transition group-hover:scale-110 relative z-10"
                style={{ backgroundColor: primaryColor }}
              >
                {/* Dynamic Icon Rendering based on keyword matching */}
                {feature.icon === 'truck' || feature.title.toLowerCase().includes('ship') ? (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                ) : feature.icon === 'phone' || feature.title.toLowerCase().includes('support') ? (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : feature.icon === 'leaf' || feature.title.toLowerCase().includes('eco') ? (
                   <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                ) : (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                )}
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
