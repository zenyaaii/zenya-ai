import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'

export default function DemoEmptyPage() {
  const name = "Zenya Demo Product"
  const colors = { primary: "#0f172a", secondary: "#ffffff" }

  // Construct complete content object for the download generator
  // This matches the fallbacks used in ThemePreview
  const safeContent = {
    hero: {
      headline: `The Ultimate ${name}`,
      subheadline: 'Experience the difference with our premium quality design engineered for your lifestyle.',
      cta: 'Shop Now'
    },
    features: [
      { title: 'Premium Quality', desc: 'Made with the finest materials for lasting durability.', icon: 'star' },
      { title: 'Fast Shipping', desc: 'Get it delivered to your door in 3-5 business days.', icon: 'truck' },
      { title: '24/7 Support', desc: 'Our expert team is here to help you anytime.', icon: 'phone' }
    ],
    problem: {
      headline: 'Tired of the struggle?',
      text: 'Stop wasting time with inferior solutions that just do not work. You deserve better.'
    },
    solution: {
      headline: `Meet ${name}`,
      text: 'The ultimate solution you have been waiting for. Engineered for perfection.'
    },
    testimonials: [
      { name: 'Alex M.', text: 'Absolutely love this product! The quality exceeded my expectations.', location: 'New York, USA', rating: 5 },
      { name: 'Sarah J.', text: 'Best purchase I made all year. Highly recommend to everyone.', location: 'London, UK', rating: 5 },
      { name: 'David K.', text: 'Great quality and amazing customer service. Will buy again.', location: 'Toronto, CA', rating: 5 }
    ],
    faq: [
      { q: 'How long does shipping take?', a: 'Shipping usually takes 3-5 business days worldwide.' },
      { q: 'What is the return policy?', a: 'We offer a 30-day money back guarantee on all orders.' },
      { q: 'Is there a warranty?', a: 'Yes, we provide a 1-year warranty against any defects.' },
      { q: 'How do I contact support?', a: 'You can reach us 24/7 via email or our contact form.' }
    ],
    guarantee: {
      title: '30-Day Risk Free Guarantee',
      text: 'Try it risk-free for 30 days. If you are not satisfied, we will refund you.',
      days: 30
    },
    rich_text: {
      title: `About ${name}`,
      text: `We are ${name}, a brand dedicated to quality and innovation. Our journey began with a simple mission.`
    },
    image_text: {
      title: "Crafted for Excellence",
      text: "Every detail is meticulously designed to ensure superior performance and durability.",
      cta: "Learn More"
    },
    multicolumn: [
      { title: "Eco-Friendly", text: "Sustainably sourced materials that are kind to the planet." },
      { title: "Ethically Made", text: "Fair wages and safe working conditions for all our makers." },
      { title: "Community Focused", text: "A portion of every sale goes back to supporting local communities." }
    ],
    newsletter: {
      heading: "Join Our Community",
      text: "Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals."
    },
    shopName: "Zenya Demo Store"
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="font-bold text-xl">Zenya Empty Theme Structure</div>
          <div className="flex items-center gap-4">
             {/* We use ThemeActions to provide the Download button */}
             <ThemeActions 
               themeId="demo-empty"
               isPro={true} 
               content={safeContent}
               colors={colors}
               name="Zenya Demo"
             />
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-6xl px-6 py-10">
        <ThemePreview 
          name={name}
          images={[]}
          primaryColor={colors.primary}
          secondaryColor={colors.secondary}
          content={safeContent}
        />
      </div>
    </div>
  )
}
