"use client"
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

export default function Page() {
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
      </main>
    </>
  )
}
