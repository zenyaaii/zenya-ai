"use client"
import AnnouncementBar from './theme/AnnouncementBar'
import StoreNavbar from './theme/StoreNavbar'
import ProductPage from './theme/ProductPage'
import CatalogPage from './theme/CatalogPage'
import Hero from './theme/Hero'
import Features from './theme/Features'
import ProblemSolution from './theme/ProblemSolution'
import ComparisonTable from './theme/ComparisonTable'
import HowItWorks from './theme/HowItWorks'
import VisualShowcase from './theme/VisualShowcase'
import Testimonials from './theme/Testimonials'
import FAQ from './theme/FAQ'
import Guarantee from './theme/Guarantee'
import RichText from './theme/RichText'
import ImageText from './theme/ImageText'
import Multicolumn from './theme/Multicolumn'
import Newsletter from './theme/Newsletter'
import FeaturedCollection from './theme/FeaturedCollection'
import CartDrawer from './theme/CartDrawer'
import ScrollingText from './theme/ScrollingText'
import Slideshow from './theme/Slideshow'
import LogoList from './theme/LogoList'
import VideoHero from './theme/VideoHero'
import TrustBadges from './theme/TrustBadges'
import VolumeBundles from './theme/VolumeBundles'
import Upsell from './theme/Upsell'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'

type Content = {
  hero: { headline: string; subheadline: string; cta: string }
  features: { title: string; desc: string; icon: string }[]
  problem: { headline: string; text: string }
  solution: { headline: string; text: string }
  testimonials: { name: string; text: string; location: string; rating: number }[]
  faq: { q: string; a: string }[]
  guarantee: { title: string; text: string; days: number }
}

export interface ThemePreviewProps {
  name: string
  images: string[]
  primaryColor: string
  secondaryColor: string
  content: any
  price?: number
  originalPrice?: number
  shopName?: string
}

export default function ThemePreview({ 
  name, 
  images, 
  primaryColor, 
  secondaryColor, 
  content,
  price = 49.99,
  originalPrice = 99.99,
  shopName
}: ThemePreviewProps) {
  const [showSticky, setShowSticky] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'catalog'>('home')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const unsub = scrollY.on("change", (latest) => {
      setShowSticky(latest > 600)
    })
    return () => unsub()
  }, [scrollY])

  // Fallback for legacy content structure (prevents crash if old data exists)
  // Robust fallback ensuring no empty objects break the UI
  const defaultHero = {
    headline: `The Ultimate ${name}`,
    subheadline: 'Experience the difference with our premium quality design engineered for your lifestyle.',
    cta: 'Shop Now'
  }
  
  const heroContent = {
    headline: content?.hero?.headline || content?.headline || defaultHero.headline,
    subheadline: content?.hero?.subheadline || content?.subheadline || defaultHero.subheadline,
    cta: content?.hero?.cta || defaultHero.cta
  }

  const defaultFeatures = [
    { title: 'Premium Quality', desc: 'Made with the finest materials for lasting durability.', icon: 'star' },
    { title: 'Fast Shipping', desc: 'Get it delivered to your door in 3-5 business days.', icon: 'truck' },
    { title: '24/7 Support', desc: 'Our expert team is here to help you anytime.', icon: 'phone' }
  ]

  const featuresContent = (content?.features?.length > 0 ? content.features : defaultFeatures).map((f: any) => ({
    title: f.title || 'Feature Title',
    desc: f.desc || 'Feature description goes here.',
    icon: f.icon || 'star'
  }))

  const defaultProblem = {
    headline: 'Tired of the struggle?',
    text: 'Stop wasting time with inferior solutions that just do not work. You deserve better.'
  }

  const problemContent = {
    headline: content?.problem?.headline || defaultProblem.headline,
    text: content?.problem?.text || defaultProblem.text
  }

  const defaultSolution = {
    headline: `Meet ${name}`,
    text: 'The ultimate solution you have been waiting for. Engineered for perfection and designed to solve your problems instantly.'
  }

  const solutionContent = {
    headline: content?.solution?.headline || defaultSolution.headline,
    text: content?.solution?.text || defaultSolution.text
  }

  const defaultTestimonials = [
    { name: 'Alex M.', text: 'Absolutely love this product! The quality exceeded my expectations.', location: 'New York, USA', rating: 5 },
    { name: 'Sarah J.', text: 'Best purchase I made all year. Highly recommend to everyone.', location: 'London, UK', rating: 5 },
    { name: 'David K.', text: 'Great quality and amazing customer service. Will buy again.', location: 'Toronto, CA', rating: 5 }
  ]

  const testimonialsContent = content?.testimonials?.length > 0 ? content.testimonials : defaultTestimonials

  const defaultFaq = [
    { q: 'How long does shipping take?', a: 'Shipping usually takes 3-5 business days worldwide.' },
    { q: 'What is the return policy?', a: 'We offer a 30-day money back guarantee on all orders.' },
    { q: 'Is there a warranty?', a: 'Yes, we provide a 1-year warranty against any defects.' },
    { q: 'How do I contact support?', a: 'You can reach us 24/7 via email or our contact form.' }
  ]

  const faqContent = content?.faq?.length > 0 ? content.faq : defaultFaq

  const defaultGuarantee = {
    title: '30-Day Risk Free Guarantee',
    text: 'Try it risk-free for 30 days. If you are not satisfied, we will refund you. No questions asked.',
    days: 30
  }

  const guaranteeContent = {
    title: content?.guarantee?.title || defaultGuarantee.title,
    text: content?.guarantee?.text || defaultGuarantee.text,
    days: content?.guarantee?.days || defaultGuarantee.days
  }

  // --- New Sections Content with Fallbacks ---

  const defaultRichText = {
    title: `About ${name}`,
    text: `We are ${name}, a brand dedicated to quality and innovation. Our journey began with a simple mission: to create products that make a difference in your life. We believe in sustainable practices, ethical sourcing, and putting our customers first.`
  }

  const richTextContent = {
    title: content?.rich_text?.title || defaultRichText.title,
    text: content?.rich_text?.text || defaultRichText.text
  }

  const defaultImageText = {
    title: "Crafted for Excellence",
    text: "Every detail is meticulously designed to ensure superior performance and durability. We don't just make products; we craft experiences that last a lifetime.",
    cta: "Learn More"
  }

  const imageTextContent = {
    title: content?.image_text?.title || defaultImageText.title,
    text: content?.image_text?.text || defaultImageText.text,
    cta: content?.image_text?.cta || defaultImageText.cta
  }

  const defaultMulticolumn = [
    { title: "Eco-Friendly", text: "Sustainably sourced materials that are kind to the planet." },
    { title: "Ethically Made", text: "Fair wages and safe working conditions for all our makers." },
    { title: "Community Focused", text: "A portion of every sale goes back to supporting local communities." }
  ]

  const multicolumnContent = content?.multicolumn?.length > 0 ? content.multicolumn : defaultMulticolumn

  const defaultNewsletter = {
    heading: "Join Our Community",
    text: "Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals."
  }

  const newsletterContent = {
    heading: content?.newsletter?.heading || defaultNewsletter.heading,
    text: content?.newsletter?.text || defaultNewsletter.text
  }

  // Mega Pack Content Fallbacks
  const scrollingTextContent = content?.scrolling_text || [
    "Free Shipping Worldwide", "30-Day Money Back Guarantee", "Premium Quality Materials", "24/7 Customer Support"
  ]

  const slideshowContent = content?.slideshow || [
    { heading: `Welcome to ${name}`, subheading: "Discover the best products for your lifestyle", cta: "Shop Collection" },
    { heading: "New Arrivals", subheading: "Check out the latest trends and styles", cta: "View All" }
  ]

  const videoHeroContent = content?.video_hero || {
    heading: "Experience the Difference",
    subheading: "Watch our product in action and see why thousands love it.",
    cta: "Shop Now"
  }

  const safeContent = {
    hero: heroContent,
    features: featuresContent,
    problem: problemContent,
    solution: solutionContent,
    testimonials: testimonialsContent,
    faq: faqContent,
    guarantee: guaranteeContent,
    rich_text: richTextContent,
    image_text: imageTextContent,
    multicolumn: multicolumnContent,
    newsletter: newsletterContent,
    scrolling_text: scrollingTextContent,
    slideshow: slideshowContent,
    video_hero: videoHeroContent
  }

  const safeShopName = shopName || name
  
  // Robust image fallback
  const safeImages = images && images.length > 0 ? images : ['https://placehold.co/600x600/e2e8f0/64748b?text=No+Image']

  return (
    <div className="relative bg-white font-sans text-slate-900">
      {/* Top Bar & Nav */}
      <AnnouncementBar primaryColor={primaryColor} />
      <StoreNavbar 
        name={safeShopName} 
        primaryColor={primaryColor} 
        onNavigate={(view) => setCurrentView(view)} 
        onOpenCart={() => setIsCartOpen(true)}
      />

      {currentView === 'home' && (
        <>
          {/* Sticky Add To Cart Bar */}
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: showSticky ? 0 : 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 p-4 backdrop-blur-md md:hidden"
          >
            <button 
              onClick={() => setCurrentView('product')}
              className="w-full rounded-full py-3 font-bold text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {safeContent.hero.cta} - $49.99
            </button>
          </motion.div>

          <ScrollingText 
            texts={safeContent.scrolling_text}
            primaryColor={primaryColor}
          />
          
          {/* Show Slideshow OR Hero based on preference (showing both for preview) */}
          <Slideshow 
             slides={safeContent.slideshow}
             primaryColor={primaryColor}
          />

          <Hero 
            headline={safeContent.hero.headline}
            subheadline={safeContent.hero.subheadline}
            cta={safeContent.hero.cta}
            image={safeImages[0]}
            primaryColor={primaryColor}
            onShopNow={() => setCurrentView('product')}
          />

          <LogoList 
            title="As Seen On"
            logos={["Forbes", "TechCrunch", "GQ", "Vogue", "Wired", "Inc."]}
          />

          <ProblemSolution 
            problem={safeContent.problem}
            solution={safeContent.solution}
            problemImage={safeImages[1] || safeImages[0]}
            solutionImage={safeImages[2] || safeImages[0]}
            secondaryColor={secondaryColor}
          />

          <VideoHero 
              heading={safeContent.video_hero.heading}
              subheading={safeContent.video_hero.subheading}
              cta={safeContent.video_hero.cta}
              primaryColor={primaryColor}
            />
            
            <HowItWorks primaryColor={primaryColor} />

            <Features 
              features={safeContent.features} 
              primaryColor={primaryColor}
            />

          <ComparisonTable 
            productName={name}
            shopName={safeShopName}
            primaryColor={primaryColor}
          />

          <FeaturedCollection 
            title="Best Sellers"
            primaryColor={primaryColor}
          />

          <ImageText 
            title={safeContent.image_text.title}
            text={safeContent.image_text.text}
            image={safeImages[1] || safeImages[0]}
            ctaText={safeContent.image_text.cta}
            primaryColor={primaryColor}
            layout="left"
          />

          <Multicolumn 
            title="Our Values"
            columns={safeContent.multicolumn}
          />

          <VisualShowcase 
            image={safeImages[3] || safeImages[0]}
            primaryColor={primaryColor}
            onShopNow={() => setCurrentView('product')}
          />

          <div id="reviews">
            <Testimonials 
              testimonials={safeContent.testimonials}
              primaryColor={primaryColor}
            />
          </div>

          <RichText 
            title={safeContent.rich_text.title}
            text={safeContent.rich_text.text}
          />

          <div id="faq">
            <FAQ 
              faqs={safeContent.faq}
              primaryColor={primaryColor}
            />
          </div>

          <Guarantee 
            guarantee={safeContent.guarantee}
            primaryColor={primaryColor}
          />

          <div className="mx-auto max-w-lg px-6 mb-16">
            <VolumeBundles 
              price={price} 
              originalPrice={originalPrice}
              primaryColor={primaryColor} 
              onChange={() => {}} 
            />
          </div>

          <div className="mx-auto max-w-lg px-6 mb-16">
             <Upsell 
               primaryColor={primaryColor} 
               mainProductImage={safeImages[0]}
               onAdd={() => alert('Upsell added!')}
             />
          </div>

          <div className="mx-auto max-w-7xl px-6 mb-16">
            <TrustBadges />
          </div>

          <Newsletter 
            heading={safeContent.newsletter.heading}
            text={safeContent.newsletter.text}
            primaryColor={primaryColor}
          />
        </>
      )}

      {currentView === 'product' && (
        <ProductPage 
          primaryColor={primaryColor} 
          images={safeImages} 
          productName={name}
          price={price}
          originalPrice={originalPrice}
          onBack={() => setCurrentView('home')} 
          onAddToCart={() => alert('Added to cart!')}
          content={safeContent}
        />
      )}

      {currentView === 'catalog' && (
        <CatalogPage 
          primaryColor={primaryColor} 
          productName={name}
          onProductClick={() => setCurrentView('product')} 
        />
      )}

      {/* Enhanced Footer */}
      <footer className="bg-slate-50 pt-16 pb-8 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
             <h3 className="text-xl font-bold text-slate-900">{safeShopName}</h3>
             <p className="text-sm text-slate-500 leading-relaxed">
               We are dedicated to providing the best quality products for our customers. Your satisfaction is our #1 priority.
             </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition">All Products</a></li>
              <li><a href="#" className="hover:text-primary transition">Best Sellers</a></li>
              <li><a href="#" className="hover:text-primary transition">New Arrivals</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-primary transition">Track Order</a></li>
              <li><a href="#" className="hover:text-primary transition">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-primary transition">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-primary transition">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Stay in the loop</h4>
            <div className="flex gap-2">
              <input placeholder="Enter your email" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button className="rounded-md px-4 py-2 text-sm font-bold text-white transition hover:opacity-90" style={{ backgroundColor: primaryColor }}>Subscribe</button>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-slate-200 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} {safeShopName}. Powered by Shopify.</p>
          <div className="flex gap-3 opacity-70 grayscale transition hover:grayscale-0">
             {/* Visa */}
             <div className="flex h-8 w-12 items-center justify-center rounded bg-slate-100 border border-slate-200">
               <span className="text-[10px] font-bold italic text-slate-800">VISA</span>
             </div>
             {/* Mastercard */}
             <div className="flex h-8 w-12 items-center justify-center rounded bg-slate-100 border border-slate-200">
               <div className="flex -space-x-1">
                 <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                 <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
               </div>
             </div>
             {/* Amex */}
             <div className="flex h-8 w-12 items-center justify-center rounded bg-blue-50 border border-slate-200">
               <span className="text-[8px] font-bold text-blue-800">AMEX</span>
             </div>
             {/* PayPal */}
             <div className="flex h-8 w-12 items-center justify-center rounded bg-white border border-slate-200">
               <span className="text-[10px] font-bold italic text-blue-900">PayPal</span>
             </div>
          </div>
        </div>
      </footer>
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        productName={safeContent.hero.headline}
        price={price}
        image={safeImages[0]}
        primaryColor={primaryColor}
      />
    </div>
  )
}

