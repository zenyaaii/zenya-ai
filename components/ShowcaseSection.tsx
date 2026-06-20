'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Utensils,
  Shirt,
  LayoutDashboard,
  Feather,
  Store,
  Wrench,
  Leaf,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { Reveal, RevealGroup, RevealItem } from '@/components/marketing/Reveal'

const TYPE_META: Record<
  string,
  { icon: LucideIcon; tagline: string; pitch: string; demoHref: string }
> = {
  one_product: {
    icon: ShoppingBag,
    tagline: 'متجر شوبيفاي بمنتج واحد',
    pitch: 'مسار بيع متكامل، وزر إضافة ثابت، وحزم، ومقارنة، وإلحاح، وأسئلة شائعة. يُصدَّر كثيم شوبيفاي OS 2.0.',
    demoHref: '/demo',
  },
  restaurant: {
    icon: Utensils,
    tagline: 'مطعم · قائمة · حجوزات',
    pitch: 'موقع مطعم راقٍ: قائمة بتبويبات، ومعرض صور، وساعات عمل، وحجوزات، وحائط صحافة، وقصة الشيف.',
    demoHref: '/demo/restaurant',
  },
  atlas: {
    icon: LayoutDashboard,
    tagline: 'تطبيق · برمجيات · B2B',
    pitch: 'صفحة منتج عصرية: واجهة، وشبكة مزايا، وباقات أسعار، وتكاملات، وشريط ثقة أمني، ودعوة لعرض توضيحي.',
    demoHref: '/demo/atlas',
  },
  lookbook: {
    icon: Shirt,
    tagline: 'أزياء · ملابس · علامة',
    pitch: 'لوك بوك تحريري بملء الشاشة، ولافتة إصدار، وشبكة الأكثر مبيعًا، وقصة علامة، وحائط صحافة، ونشرة بريدية.',
    demoHref: '/demo/lookbook',
  },
  collective: {
    icon: Store,
    tagline: 'كتالوج · منتجات متعددة',
    pitch: 'متجر فاخر متعدد العلامات بمجموعات منسّقة، والأكثر مبيعًا، ووعد العلامة، ونشرة بريدية.',
    demoHref: '/demo/collective',
  },
  studio: {
    icon: Feather,
    tagline: 'قصة علامة · تحرير',
    pitch: 'رسالة المؤسّس، وخط زمني، وقيم، ومنهجية، وفريق، وحائط صحافة، وإحصاءات مجتمع — سرد مطوّل.',
    demoHref: '/demo/studio',
  },
  services: {
    icon: Wrench,
    tagline: 'خدمات محلية · حِرف',
    pitch: 'موقع خدمات احترافي: واجهة، وإثبات، وقبل/بعد، ومناطق الخدمة، وتقييمات، وأسئلة شائعة، ومسار طلب عرض سعر.',
    demoHref: '/demo/services',
  },
  wellness: {
    icon: Leaf,
    tagline: 'سبا · يوغا · عافية',
    pitch: 'قالب هادئ بقائمة جلسات، وحجز، ومدرّبين، وجداول، وبطاقات هدايا.',
    demoHref: '/demo/wellness',
  },
}

/** Faux template thumbnail — a tasteful, per-type abstraction of a page so
 *  the card reads as a real preview without shipping a heavy screenshot. */
function PreviewThumb({ accent, orb, Icon }: { accent: string; orb: string; Icon: LucideIcon }) {
  return (
    <div
      className="relative h-32 overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${accent}14, #ffffff 65%)` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl"
        style={{ background: orb }}
      />
      {/* mini browser chrome */}
      <div className="flex items-center gap-1 px-3 pt-3">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fca5a5' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fcd34d' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#86efac' }} />
      </div>
      {/* faux layout */}
      <div className="relative px-3 pt-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: `${accent}1a`, color: accent, border: `1px solid ${accent}2e` }}
          >
            <Icon className="h-3 w-3" strokeWidth={2} />
          </div>
          <div className="h-2 w-16 rounded-full" style={{ background: `${accent}55` }} />
          <div className="ms-auto h-4 w-10 rounded-full" style={{ background: `${accent}` , opacity: 0.9 }} />
        </div>
        <div className="mt-3 h-1.5 w-28 rounded-full bg-black/10" />
        <div className="mt-1.5 h-1.5 w-20 rounded-full bg-black/[0.07]" />
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="h-7 rounded-md bg-black/[0.05]" />
          <div className="h-7 rounded-md bg-black/[0.05]" />
          <div className="h-7 rounded-md bg-black/[0.05]" />
        </div>
      </div>
      {/* bottom fade into the card body */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
    </div>
  )
}

export default function ShowcaseSection() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker mb-4">ثمانية قوالب · لغة تصميم واحدة</p>
            <h2 className="heading-ar text-[clamp(32px,5vw,50px)] text-foreground">
              مبنيّ بـ <span className="gradient-text">زينيا.</span>
            </h2>
          </div>
          <Link
            href="/themes"
            className="group inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted transition-colors hover:text-foreground"
          >
            استكشف كل القوالب
            <ArrowUpRight className="h-3.5 w-3.5 rtl-flip transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.25} />
          </Link>
        </Reveal>

        {/* 8-card grid */}
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_TYPE_ORDER.map((key) => {
            const tint = auroraTints[key]
            const meta = TYPE_META[key]
            const Icon = meta.icon
            return (
              <RevealItem
                key={key}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white ring-hover card-sheen"
                style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.04)' }}
              >
                <div className="transition-transform duration-300 group-hover:-translate-y-0.5">
                  <PreviewThumb accent={tint.accent} orb={tint.orb1} Icon={Icon} />
                </div>

                <div className="relative flex flex-1 flex-col gap-2.5 p-5">
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground">{tint.label}</h3>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-muted">
                      {meta.tagline}
                    </p>
                  </div>

                  <p className="text-[13px] leading-[1.6] text-muted">{meta.pitch}</p>

                  <Link
                    href={meta.demoHref}
                    className="mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] font-semibold text-muted transition-colors group-hover:text-[color:var(--primary)]"
                  >
                    شاهد العرض الحي
                    <ArrowUpRight
                      className="h-3 w-3 rtl-flip transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2.25}
                    />
                  </Link>
                </div>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
