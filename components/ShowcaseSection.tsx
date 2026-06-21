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
import { themePreview, themePreviewFallback } from '@/lib/theme-previews'
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

/** Real template thumbnail — the actual theme screenshot inside a tiny
 *  browser frame. Resolves through `themePreview()` (local file → curated
 *  fallback) so dropping a screenshot into public/theme-previews/ is all it
 *  takes; `onError` keeps a missing image from ever showing a broken frame. */
function PreviewThumb({ id, accent, Icon }: { id: string; accent: string; Icon: LucideIcon }) {
  return (
    <div className="relative h-40 overflow-hidden bg-[#f7f4ed]">
      {/* mini browser chrome */}
      <div
        className="flex items-center gap-1 px-3 py-2"
        style={{ background: '#faf8f3', borderBottom: '1px solid #f0ede6' }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fca5a5' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#fcd34d' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#86efac' }} />
        <span
          className="ms-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-[3px]"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon className="h-2.5 w-2.5" strokeWidth={2.25} />
        </span>
      </div>
      {/* the real screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={themePreview(id)}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        style={{ height: 'calc(100% - 28px)' }}
        onError={(e) => {
          const fb = themePreviewFallback(id)
          if (e.currentTarget.src !== fb) e.currentTarget.src = fb
        }}
      />
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
                  <PreviewThumb id={key} accent={tint.accent} Icon={Icon} />
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
