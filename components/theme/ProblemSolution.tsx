import { motion } from 'framer-motion'

export default function ProblemSolution({ 
  problem, 
  solution, 
  problemImage,
  solutionImage,
  secondaryColor
}: { 
  problem: { headline: string; text: string }
  solution: { headline: string; text: string }
  problemImage: string
  solutionImage: string
  secondaryColor: string
}) {
  return (
    <section className="py-24 overflow-hidden bg-slate-50/50">
      <div className="container mx-auto px-6">
        {/* Problem */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center mb-24 relative">
          <motion.div 
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="order-2 lg:order-1 relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
          >
             <div className="absolute top-4 left-4 z-10 rounded-full bg-red-600/90 px-4 py-1 text-sm font-bold text-white backdrop-blur-sm">
               ❌ The Old Way
             </div>
             {/* Use problem image, fallback to grayscale if it's the same as solution */}
             <img
               src={problemImage}
               alt="Problem"
               className="h-full w-full object-cover grayscale contrast-125 sepia-[.3]"
               loading="lazy"
               decoding="async"
             />
             <div className="absolute inset-0 bg-red-900/10 mix-blend-multiply" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-bold text-red-600 mb-6">
              <span className="text-lg">⚠️</span> The Problem
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">{problem.headline}</h2>
            <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-red-200 pl-6">{problem.text}</p>
          </motion.div>
          
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-full h-24 w-px bg-gradient-to-b from-slate-200 to-transparent -translate-x-1/2" />
        </div>

        {/* Solution */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-600 mb-6">
              <span className="text-lg">✨</span> The Solution
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">{solution.headline}</h2>
            <p className="text-lg text-slate-600 leading-relaxed border-s-4 border-green-200 ps-6">{solution.text}</p>
            
            <div className="mt-8 flex items-center gap-4">
               <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
               <span className="font-bold text-slate-900">نتائج مثبتة علميًا</span>
            </div>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-green-50"
          >
             <div className="absolute top-4 right-4 z-10 rounded-full bg-green-600/90 px-4 py-1 text-sm font-bold text-white backdrop-blur-sm">
               ✅ The New Way
             </div>
             <img
               src={solutionImage}
               alt="Solution"
               className="h-full w-full object-cover"
               loading="lazy"
               decoding="async"
             />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
