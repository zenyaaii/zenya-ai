'use client'

/**
 * /demo/ribbon - the flowing ribbon, for approval. Nothing is wired into the
 * site from here.
 *
 * Two views, because they answer different questions.
 *
 * First, the Stripe composition: the ribbon anchored in a corner, tilted, and
 * running off the edges of the frame, with real headline copy over it. This is
 * the only view that answers "does it work on a page". Stripe puts the sweep
 * opposite the side the text starts from; under RTL that means top left.
 *
 * Second, the ribbon alone and centred, so the object itself can be judged
 * against the Spline reference without a layout around it.
 */

import FlowingRibbon from '@/components/marketing/FlowingRibbon'

export default function RibbonDemo() {
  return (
    <main dir="rtl" className="bg-[#f7f4ed] text-[#1c1c1c]">
      {/* In place: corner anchored, tilted, bleeding off two edges. */}
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
        {/* Corner-confined. Stripe's sweep covers roughly a third of the hero
            and bleeds off two edges; covering the whole frame is what turns it
            from a composition into a background. */}
        <div className="pointer-events-none absolute -left-[18%] -top-[26%] h-[104%] w-[74%]">
          <FlowingRibbon tilt={-18} className="h-full w-full" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <h1 className="max-w-[20ch] text-[clamp(36px,6vw,68px)] font-bold leading-[1.28]">
            موقعك الكامل، بالذكاء الاصطناعي
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.9] text-[#5f5f5d]">
            اختر قالبًا، واكتب نبذة قصيرة عن نشاطك، وشاهد الموقع يُبنى أمامك.
          </p>
          <a
            href="/build"
            className="mt-9 inline-flex items-center rounded-lg bg-[#5e6ad2] px-6 py-3 text-[15px] font-semibold text-white transition-transform active:translate-y-[1px]"
          >
            ابدأ الآن
          </a>
        </div>
      </section>

      {/* On its own, for judging the object. */}
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden border-t border-[#e5e2d9]">
        <FlowingRibbon className="h-[62vh] w-full" />
      </section>
    </main>
  )
}
