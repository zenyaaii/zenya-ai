
import { motion } from 'framer-motion'

export default function RichText({ 
  title, 
  text, 
  align = 'center' 
}: { 
  title: string
  text: string
  align?: 'left' | 'center'
}) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 max-w-4xl" style={{ textAlign: align }}>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-slate-900 mb-6"
        >
          {title}
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600 leading-relaxed prose prose-slate"
        >
          {text}
        </motion.div>
      </div>
    </section>
  )
}
