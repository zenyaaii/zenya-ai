"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import Hero from "@/components/Hero"
import Logos from "@/components/Logos"
import FeaturesSection from "@/components/FeaturesSection"
import StepsSection from "@/components/StepsSection"
import StatsSection from "@/components/StatsSection"
import ShowcaseSection from "@/components/ShowcaseSection"
import BeforeAfterSection from "@/components/BeforeAfterSection"
import HomeFaq from "@/components/HomeFaq"
import Testimonials from "@/components/Testimonials"
import CTA from "@/components/CTA"
import TemplateStackSection from "@/components/marketing/TemplateStackSection"
import IncludedSection from "@/components/marketing/IncludedSection"
import ScrollProgress from "@/components/marketing/ScrollProgress"
import PageBackground from "@/components/marketing/PageBackground"
import LiveUsersGlobe from "@/components/marketing/LiveUsersGlobe"

export default function Page() {
  const router = useRouter()

  // Logged-in users visiting the homepage go straight to their dashboard —
  // UNLESS they arrived via ?home=1 ("back to marketing site"), in which case
  // they explicitly want to browse the marketing page, so leave them here.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('home') === '1') return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = 'https://dashboard.zenyaai.co'
    })
  }, [router])

  return (
    <>
      <main className="relative">
        {/* One continuous backdrop (hero grid + aurora) behind the whole page. */}
        <PageBackground />
        <ScrollProgress />
        <Hero />
        <Logos />
        {/* Visual pain→solution — makes the "unprofessional site costs you
            customers" message concrete before the how-it-works steps. */}
        <BeforeAfterSection />
        <StepsSection />
        {/* Shopify-style fanned templates section. Animates in on scroll,
            click any card to open a preview box with Build / Live view CTAs. */}
        <TemplateStackSection />
        <ShowcaseSection />
        <StatsSection />
        <FeaturesSection />
        <IncludedSection />
        <Testimonials />
        {/* FAQ teaser — shared data with /faq, links through for SEO depth. */}
        <HomeFaq />
        <CTA />
        {/* Live-users dot-globe — real, country-level visitor activity across all
            Zenya sites. Sits last so it crops ~40% under the footer. */}
        <LiveUsersGlobe />
      </main>
    </>
  )
}
