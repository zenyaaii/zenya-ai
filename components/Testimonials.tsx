'use client'

import Link from 'next/link'
import { MessageSquareQuote, Gift, ArrowLeft } from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'

/**
 * Honest "first reviews" invitation.
 *
 * We deliberately do NOT ship invented testimonials. Zenya is early, so
 * instead of faking social proof we invite real founders to share their
 * experience in exchange for a thank-you discount. Once real, approved
 * reviews exist they'll render here in place of this invite.
 *
 * (Full DB-backed review submission + automatic coupon issuance is tracked
 * as a follow-up; for now the CTA routes to our contact channel.)
 */
export default function Testimonials() {
  return (
    <section className="relative border-b border-token py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-token bg-white p-8 text-center shadow-soft-md sm:p-12">
            {/* soft brand wash */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(94,106,210,0.10), transparent 70%)',
              }}
            />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(94,106,210,0.10)]">
                <MessageSquareQuote className="h-6 w-6 text-primary" strokeWidth={1.75} />
              </div>

              <p className="kicker mb-3">آراء العملاء</p>
              <h2 className="heading-ar text-[clamp(26px,4.5vw,40px)] text-foreground">
                كن من <span className="gradient-text">أوائل من يشارك تجربته.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.85] text-muted">
                زينيا منصّة جديدة، ونؤمن بأن نعرض آراءً حقيقية فقط — لا شهادات
                مُختلَقة. أطلقت موقعك معنا؟ شاركنا رأيك الصادق، وسنشكرك بخصمٍ على
                خطوتك القادمة.
              </p>

              {/* incentive chip */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(217,119,6,0.25)] bg-[rgba(217,119,6,0.08)] px-4 py-1.5 text-[13px] font-medium text-[#b45309]">
                <Gift className="h-3.5 w-3.5" strokeWidth={2} />
                خصم شكرًا لأوّل المراجِعين
              </div>

              <div className="mt-8">
                <Link
                  href="/contact?topic=review"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-soft-md transition hover:-translate-y-0.5 hover:shadow-soft-lg"
                >
                  شارك تجربتك
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
