"use client"
import Hero from "@/components/Hero"
import Logos from "@/components/Logos"
import FeaturesSection from "@/components/FeaturesSection"
import StepsSection from "@/components/StepsSection"
import StatsSection from "@/components/StatsSection"
import ShowcaseSection from "@/components/ShowcaseSection"
import Testimonials from "@/components/Testimonials"
import CTA from "@/components/CTA"

export default function Page() {
  return (
    <main>
      <Hero />
      <Logos />
      <StepsSection />
      <ShowcaseSection />
      <StatsSection />
      <FeaturesSection />
      <Testimonials />
      <CTA />
    </main>
  )
}
