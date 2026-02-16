"use client"
import { motion } from 'framer-motion'

export default function VideoHero({ 
  heading,
  subheading,
  cta,
  videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4",
  primaryColor
}: { 
  heading: string
  subheading: string
  cta: string
  videoUrl?: string
  primaryColor: string
}) {
  return (
    <section className="relative h-[80vh] w-full overflow-hidden bg-black">
      {/* Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 text-5xl font-black text-white md:text-7xl leading-tight"
          >
            {heading}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-10 text-xl text-slate-200 md:text-3xl max-w-2xl mx-auto"
          >
            {subheading}
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="rounded-full px-12 py-5 text-xl font-bold text-white shadow-2xl transition hover:scale-105 active:scale-95 border-2 border-transparent hover:border-white/20"
            style={{ backgroundColor: primaryColor }}
          >
            {cta}
          </motion.button>
        </div>
      </div>
    </section>
  )
}
