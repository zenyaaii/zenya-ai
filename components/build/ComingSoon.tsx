'use client'

import { motion } from 'framer-motion'
import {
  Sparkles, Zap, Palette, ShoppingBag, ArrowLeft, Clock, Check,
} from 'lucide-react'

/**
 * The "big new version is coming" screen shown to everyone EXCEPT the admin
 * while the one-product Shopify builder is being rebuilt. It's deliberately
 * premium and marketing-forward — it should make Zenya feel like a serious
 * company shipping something worth waiting for, and route people to the 8
 * templates that DO work today. No fake countdowns or fabricated numbers.
 */
export default function ComingSoon({
  browseHref = '/themes',
  browseLabel = 'استكشف قوالبنا الأخرى',
  browseTarget,
  onBack,
}: {
  browseHref?: string
  browseLabel?: string
  /** e.g. "_blank" when linking out of the embedded Shopify app. */
  browseTarget?: string
  onBack?: () => void
}) {
  const features = [
    { icon: Zap, title: 'أسرع من أي وقت', body: 'من رابط المنتج إلى متجر مباشر خلال دقائق، بلا خطوات معقّدة.' },
    { icon: Palette, title: 'قوالب جديدة كليًا', body: 'تصاميم احترافية مصمّمة للبيع والتحويل — لا مجرد صفحة منتج.' },
    { icon: ShoppingBag, title: 'تثبيت بنقرة واحدة', body: 'نُنشئ المنتج ونثبّت القالب في متجر Shopify تلقائيًا نيابةً عنك.' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-2 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-token bg-white p-8 shadow-sm sm:p-12"
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 90% at 100% 0%, rgba(94,106,210,0.12), transparent 60%)' }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(94,106,210,0.25)] bg-[rgba(94,106,210,0.06)] px-3.5 py-1.5 text-[12px] font-bold text-primary">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
            قريبًا · نسخة جديدة كليًا
          </div>

          <h1 className="mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-[40px]">
            جيلٌ جديد من متاجر Shopify
            <br className="hidden sm:block" />
            <span className="text-primary"> قيد الصناعة.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-[15px] leading-[1.85] text-muted sm:text-[16px]">
            نُعيد بناء منشئ متجر المنتج الواحد من الصفر — أسرع، وأسهل، وبقوالب أعلى تحويلًا
            تُثبَّت مباشرةً في متجرك. نضع اللمسات الأخيرة الآن، وسنفتحه للجميع قريبًا جدًا.
          </p>

          {/* Feature teasers */}
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-token bg-[#fafaf7] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </div>
                  <div className="mt-3.5 text-[14.5px] font-bold text-foreground">{f.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{f.body}</p>
                </motion.div>
              )
            })}
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={browseHref}
              target={browseTarget}
              rel={browseTarget === '_blank' ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.2} />
              {browseLabel}
            </a>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 rounded-full border border-token bg-white px-5 py-3 text-[14px] font-semibold text-foreground transition hover:bg-black/5"
              >
                <ArrowLeft className="h-4 w-4 rtl-flip" /> رجوع
              </button>
            )}
          </div>

          <div className="mt-7 flex items-center gap-2 border-t border-token pt-6 text-[12.5px] text-muted">
            <Check className="h-4 w-4 flex-shrink-0 text-[#15803d]" />
            بينما ننهيه، يمكنك بناء أي من قوالب زينيا الثمانية الأخرى الآن — مطاعم، أزياء، خدمات، برمجيات وغيرها.
          </div>
        </div>
      </motion.div>
    </div>
  )
}
