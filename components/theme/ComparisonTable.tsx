"use client"
import { motion } from 'framer-motion'

export default function ComparisonTable({ 
  productName, 
  shopName,
  primaryColor,
  heading = 'Why Choose Us?',
  subheading = 'See how we stack up against the competition.',
  features: providedFeatures,
}: { 
  productName: string
  shopName?: string
  primaryColor: string 
  heading?: string
  subheading?: string
  features?: { name: string; us: boolean; them: boolean }[]
}) {
  const features =
    Array.isArray(providedFeatures) && providedFeatures.length
      ? providedFeatures
          .map((f) => ({
            name: typeof f?.name === 'string' ? f.name : '',
            us: Boolean((f as any)?.us),
            them: Boolean((f as any)?.them),
          }))
          .filter((f) => f.name.trim())
          .slice(0, 6)
      : [
          { name: 'Premium Quality Materials', us: true, them: false },
          { name: '24/7 Customer Support', us: true, them: false },
          { name: '30-Day Money Back Guarantee', us: true, them: false },
          { name: 'Fast & Free Shipping', us: true, them: false },
          { name: 'Eco-Friendly Packaging', us: true, them: false },
        ]

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{heading}</h2>
          <p className="text-slate-600">{subheading}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="grid grid-cols-3 bg-slate-100 p-4 text-center font-bold text-slate-900">
            <div className="text-left pl-4">Feature</div>
            <div className="text-slate-500">Others</div>
            <div style={{ color: primaryColor }}>{shopName || productName}</div>
          </div>

          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-3 items-center border-b border-slate-100 p-4 text-center last:border-0 hover:bg-slate-50"
            >
              <div className="text-left pl-4 font-medium text-slate-700">{feature.name}</div>
              <div className="flex justify-center text-slate-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex justify-center" style={{ color: primaryColor }}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
