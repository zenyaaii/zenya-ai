"use client"
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  
  const faqs = [
    { q: "Can I cancel my subscription anytime?", a: "Yes, absolutely. You can cancel your subscription from your dashboard at any time. You will continue to have access until the end of your billing period." },
    { q: "What happens to my themes if I cancel?", a: "Your themes remain accessible, but you won't be able to edit them or create new ones using AI until you resubscribe. Exported code is yours forever." },
    { q: "Do you offer a refund policy?", a: "We offer a 14-day money-back guarantee. If you're not satisfied with Zenya Pro, just reach out to our support team." },
    { q: "Can I use the themes for client projects?", a: "Yes! Zenya Pro allows you to use generated themes for both personal and commercial projects, including client work." }
  ]

  return (
    <main className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Simple pricing, <span className="bg-gradient-primary bg-clip-text text-transparent">transparent value</span>
        </h1>
        <p className="mt-4 text-xl text-muted max-w-2xl mx-auto">
          Choose the plan that fits your needs. No hidden fees, no surprises.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-24">
        {/* Free Plan */}
        <div className="relative flex flex-col rounded-3xl border border-token bg-surface p-8 shadow-soft-md transition hover:shadow-soft-lg">
          <div className="mb-4">
             <div className="text-xl font-bold text-foreground">Starter</div>
             <div className="mt-2 flex items-baseline text-foreground">
               <span className="text-4xl font-extrabold tracking-tight">$0</span>
               <span className="ml-1 text-xl font-medium text-muted">/forever</span>
             </div>
             <p className="mt-4 text-muted">Perfect for exploring Zenya&apos;s capabilities.</p>
          </div>
          
          <ul className="mt-8 space-y-4 flex-1">
            {['3 AI Themes per month', 'Basic Customization', 'View Only (No Code Export)', 'Community Support'].map(item => (
              <li key={item} className="flex items-center gap-3">
                <svg className="h-5 w-5 text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          
          <Link href="/login?mode=signup" className="mt-8 block w-full text-center rounded-full border border-token bg-elevated py-4 font-bold text-foreground transition hover:bg-surface hover:shadow-sm">
            Get Started for Free
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="relative flex flex-col rounded-3xl border-2 border-primary/10 bg-elevated p-8 shadow-glow ring-1 ring-primary/20">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1 text-sm font-medium text-white shadow-lg whitespace-nowrap">
            Most Popular
          </div>
          
          <div className="mb-4">
             <div className="text-xl font-bold text-foreground">Pro</div>
             <div className="mt-2 flex items-baseline text-foreground">
               <span className="text-4xl font-extrabold tracking-tight">$4.99</span>
               <span className="ml-1 text-xl font-medium text-muted">/month</span>
             </div>
             <p className="mt-4 text-muted">For serious dropshippers ready to scale.</p>
          </div>
          
          <ul className="mt-8 space-y-4 flex-1">
            {[
              'Unlimited AI Themes', 
              'Full Code Export (Next.js/React)', 
              'Priority AI Generation Speed', 
              'Remove Zenya Branding', 
              'Priority Support', 
              'Early Access to New Features'
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <svg className="h-5 w-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-foreground font-medium">{item}</span>
              </li>
            ))}
          </ul>
          
          <Link 
            href="/checkout"
            className="mt-8 block w-full text-center rounded-full bg-primary py-4 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-[1.02] hover:shadow-xl"
          >
            Start 14-Day Free Trial
          </Link>
          <p className="mt-4 text-center text-xs text-muted">Cancel anytime. No questions asked.</p>
        </div>
      </div>

      {/* Comparison Table Section */}
      <div className="max-w-5xl mx-auto mb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Why Zenya?</h2>
        <p className="text-center text-muted mb-12 max-w-2xl mx-auto">See how we stack up against the competition.</p>
        
        <div className="overflow-x-auto rounded-2xl border border-token bg-surface shadow-sm">
           <table className="w-full text-left border-collapse min-w-[600px]">
             <thead>
               <tr className="border-b border-token bg-slate-50/50">
                 <th className="p-4 pl-6 font-bold text-muted uppercase text-xs tracking-wider w-1/4">Feature</th>
                 <th className="p-4 font-bold text-center text-primary text-lg w-1/4 bg-primary/5">Zenya</th>
                 <th className="p-4 font-bold text-center text-foreground w-1/4">Other AI Builders</th>
                 <th className="p-4 font-bold text-center text-muted w-1/4">Agencies</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-token">
               {[
                 { name: 'Monthly Cost', zenya: '$4.99', other: '$29+', agency: '$2,000+' },
                 { name: 'Setup Time', zenya: 'Seconds', other: 'Minutes', agency: 'Weeks' },
                 { name: 'Code Ownership', zenya: '✅ Full Export', other: '❌ Locked', agency: '✅' },
                 { name: 'Platform Lock-in', zenya: '❌ None', other: '⚠️ High', agency: '❌ None' },
                 { name: 'Free Plan', zenya: '✅ Forever Free', other: '❌ Trial Only', agency: '❌' },
                 { name: 'AI Customization', zenya: '✅ Advanced', other: '✅ Standard', agency: '❌ Manual' },
               ].map((row, i) => (
                 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                   <td className="p-4 pl-6 font-medium text-foreground">{row.name}</td>
                   <td className="p-4 text-center font-bold text-primary bg-primary/5">{row.zenya}</td>
                   <td className="p-4 text-center text-foreground font-medium">{row.other}</td>
                   <td className="p-4 text-center text-muted">{row.agency}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-token bg-surface overflow-hidden transition-all hover:border-slate-300">
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left font-bold text-foreground"
              >
                {faq.q}
                <span className={`transform transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-muted leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
