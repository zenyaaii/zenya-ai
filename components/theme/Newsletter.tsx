
import { motion } from 'framer-motion'

export default function Newsletter({ 
  heading, 
  text, 
  primaryColor 
}: { 
  heading: string
  text: string
  primaryColor: string
}) {
  return (
    <section className="py-24 bg-slate-900 text-white text-center">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4"
        >
          {heading}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-300 mb-8"
        >
          {text}
        </motion.p>
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <input 
            type="email" 
            placeholder="البريد الإلكتروني"
            required 
            className="flex-1 px-6 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button 
            type="submit" 
            className="px-8 py-3 rounded-full font-bold bg-white text-slate-900 hover:bg-slate-100 transition"
          >
            Subscribe
          </button>
        </motion.form>
      </div>
    </section>
  )
}
