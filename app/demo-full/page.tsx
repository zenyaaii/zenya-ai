import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'

export default function DemoFullPage() {
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
    },
    scrolling_text: [
      "Free 2-Day Shipping", "5-Year Warranty Included", "Over 50,000 Happy Customers", "Rated #1 by CleanHome Magazine"
    ],
    slideshow: [
      { 
        heading: "Clean Smarter, Not Harder", 
        subheading: "The most advanced cordless vacuum on the market.", 
        cta: "Shop Now",
        image: "https://images.unsplash.com/photo-1558317374-a309d244678e?q=80&w=1920&auto=format&fit=crop"
      },
      { 
        heading: "Pet Owners Love Us", 
        subheading: "Say goodbye to pet hair forever with our patented tangle-free brush.", 
        cta: "See Features",
        image: "https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=1920&auto=format&fit=crop"
      }
    ],
    rich_text: {
      title: "Engineered for Real Life",
      text: "We didn't just build another vacuum. We studied how people actually clean. The result is a machine that anticipates your needs, adapts to your floor type, and filters out 99.9% of allergens."
    },
    image_text: {
      title: "Laser Dust Detection",
      text: "A precisely angled laser reveals invisible dust on hard floors, so you don't miss a thing. See what you're cleaning in real-time.",
      cta: "Learn Technology"
    },
    multicolumn: [
      { title: "HEPA Filtration", text: "Traps 99.99% of microscopic particles as small as 0.3 microns." },
      { title: "60-Min Run Time", text: "Fade-free power to clean here, there, and everywhere." },
      { title: "Hygienic Bin Emptying", text: "Point and shoot mechanism ejects dust and debris deep into your bin." }
    ],
    video_hero: {
      heading: "See It In Action",
      subheading: "Watch how the Zenya V2 tackles the toughest messes with ease.",
      cta: "Watch Demo"
    },
    newsletter: {
      heading: "Unlock 10% Off",
      text: "Join our email list to get a discount code instantly sent to your inbox."
    }
  }

  // Using a reliable placeholder image
  const mockImages = [
    "https://images.unsplash.com/photo-1558317374-a309d244678e?q=80&w=1000&auto=format&fit=crop", // Hero
    "https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=1000&auto=format&fit=crop", // Problem
    "https://images.unsplash.com/photo-1585773690161-7b1cd0accfcf?q=80&w=1000&auto=format&fit=crop", // Solution
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"  // Visual Showcase
  ]
  const colors = { primary: "#3b82f6", secondary: "#10b981" }

  return (
    <div className="min-h-screen bg-white">
      <ThemePreview 
        name="Zenya V2"
        images={mockImages}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        content={mockContent}
      />
      <ThemeActions 
        themeId="demo-full"
        isPro={true}
        content={mockContent}
        colors={colors}
        name="Zenya V2"
      />
    </div>
  )
}
