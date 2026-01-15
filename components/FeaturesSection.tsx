'use client'

import { motion } from 'framer-motion'
import FeatureCard from './FeatureCard'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-surface to-background" />
      
      <div className="mx-auto max-w-6xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Why Zenya?
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to <span className="text-primary">ship fast</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            From product scrape to persuasive content and polished preview, in one flow.
          </p>
        </motion.div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={item}>
            <FeatureCard 
              icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} 
              title="Polished design" 
              desc="Clean layouts, modern typography, and trust-building sections automatically applied." 
            />
          </motion.div>
          <motion.div variants={item}>
            <FeatureCard 
              icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} 
              title="Fast setup" 
              desc="Paste a link, pick images, choose colors, preview instantly. No coding required." 
            />
          </motion.div>
          <motion.div variants={item}>
            <FeatureCard 
              icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} 
              title="AI content" 
              desc="Persuasive, credible copy tailored for one-product stores generated in seconds." 
            />
          </motion.div>
          <motion.div variants={item}>
            <FeatureCard 
              icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} 
              title="Secure payments" 
              desc="Stripe-powered checkout integration and webhook status updates included." 
            />
          </motion.div>
          <motion.div variants={item}>
            <FeatureCard 
              icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} 
              title="Conversion-focused" 
              desc="Benefits, testimonials, FAQs, guarantee, and shipping details structured to sell." 
            />
          </motion.div>
          <motion.div variants={item}>
            <FeatureCard 
              icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>} 
              title="Ready to publish" 
              desc="Preview your theme, export the code, and launch your store immediately." 
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
