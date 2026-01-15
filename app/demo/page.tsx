import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'
import { Suspense } from 'react'

export default function DemoPage() {
  const mockContent = {
    hero: {
      headline: "The Last Vacuum You'll Ever Need",
      subheadline: "Engineered with military-grade suction and whisper-quiet technology. Experience the future of cleaning today.",
      cta: "Get 50% Off Now"
    },
    features: [
      { title: "Whisper Quiet", desc: "Clean your home without waking the baby. operates at less than 40dB.", icon: "volume-x" },
      { title: "All-Day Battery", desc: "One charge lasts up to 120 minutes. Enough to clean your entire home twice.", icon: "battery-charging" },
      { title: "Pet Hair Eraser", desc: "Specialized brushes designed to lift stubborn pet hair from any surface.", icon: "dog" }
    ],
    problem: {
      headline: "Sick of bulky, weak vacuums?",
      text: "Traditional vacuums are heavy, loud, and lose suction after a few months. You shouldn't have to wrestle with your cleaning tools."
    },
    solution: {
      headline: "Meet the Zenya V2",
      text: "Featherlight design meets industrial power. We've reimagined what a vacuum should be, making cleaning effortless and even enjoyable."
    },
    testimonials: [
      { name: "Sarah Jenkins", text: "I can't believe how much dust this thing picked up. My carpets look brand new!", location: "Denver, CO", rating: 5 },
      { name: "Mike Ross", text: "Finally, a vacuum that doesn't hurt my back. Worth every penny.", location: "New York, NY", rating: 5 },
      { name: "Emily Chen", text: "The battery life is insane. I cleaned my whole 2-story house on one charge.", location: "Seattle, WA", rating: 5 }
    ],
    faq: [
      { q: "Does it work on hardwood floors?", a: "Yes! The soft-roller head is specifically designed to polish hard floors while cleaning." },
      { q: "How long is the warranty?", a: "We offer an industry-leading 5-year warranty on the motor and battery." },
      { q: "Is the filter washable?", a: "Absolutely. Just rinse it under cold water once a month to maintain peak performance." },
      { q: "What is the return policy?", a: "Try it risk-free for 30 days. If you don't love it, we'll pay for return shipping." }
    ],
    guarantee: {
      title: "30-Day Risk-Free Guarantee",
      text: "We are so confident you'll love the Zenya V2 that we're letting you try it in your own home for 30 days. No strings attached.",
      days: 30
    }
  }

  // Using a placeholder image that looks like a product
  const mockImage = "https://images.unsplash.com/photo-1558317374-a354d5f6d40b?q=80&w=1000&auto=format&fit=crop"
  const colors = { primary: "#3b82f6", secondary: "#10b981" }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Header with Paywall Actions */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="font-bold text-xl">Zenya Theme Demo</div>
          <div className="hidden md:block">
            <Suspense fallback={<div>Loading...</div>}>
              <ThemeActions 
                themeId="demo-theme-id" 
                isPro={false} // Force locked state for demo
                content={mockContent}
                colors={colors}
                name="Zenya V2"
              />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Main Theme Preview */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <ThemePreview 
          name="Zenya V2"
          images={[mockImage, mockImage]}
          primaryColor={colors.primary}
          secondaryColor={colors.secondary}
          content={mockContent}
        />
      </div>

      {/* Mobile Sticky Paywall Actions */}
      <div className="md:hidden">
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeActions 
            themeId="demo-theme-id" 
            isPro={false} // Force locked state for demo
            content={mockContent}
            colors={colors}
            name="Zenya V2"
          />
        </Suspense>
      </div>
    </div>
  )
}
