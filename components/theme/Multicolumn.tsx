
import { motion } from 'framer-motion'

export default function Multicolumn({ 
  title, 
  columns 
}: { 
  title: string
  columns: { title: string; text: string }[]
}) {
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
        <div className="grid md:grid-cols-3 gap-8">
          {columns.map((col, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-50 p-8 rounded-2xl text-center hover:shadow-lg transition duration-300"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">{col.title}</h3>
              <p className="text-slate-600">{col.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
