'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Layers,
  Palette,
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
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { Reveal, RevealGroup, RevealItem } from '@/components/marketing/Reveal'
import { auroraTints, BUSINESS_TYPE_ORDER, type AuroraTint } from '@/lib/aurora-tints'
import { themePreview, themePreviewFallback } from '@/lib/theme-previews'
import { useIsAdmin } from '@/lib/use-is-admin'
import { cn } from '@/lib/utils'

type ThemeCard = {
  /** Internal business_type key. Drives aurora tint + cover lookup. */
  id: keyof typeof auroraTints
  /** Short business descriptor shown above the title. */
  tagline: string
  /** One-line description for the card body. */
  description: string
  /** Number of style presets the wizard offers. */
  presets: number
  /** Number of pre-built sections in the template. */
  sections: number
  /** No-auth live preview URL. */
  demoHref: string
  /** Where "ابنِ بهذا" goes — the real wizard / builder for this template. */
  createHref: string
  /** Icon shown in the card chip. */
  icon: LucideIcon
  /** When true, this is the Shopify-exportable template (vs hosted site). */
  shopify?: boolean
}

/**
 * The 8 canonical templates — one entry per business_type, ordered to match the
 * marketing surface. Build links point straight at each template's wizard (or
 * /build for the Shopify one-product flow) so this page IS the single picker —
 * there's no second gallery to keep in sync.
 */
const THEMES: Record<keyof typeof auroraTints, Omit<ThemeCard, 'id'>> = {
  one_product: {
    tagline: 'متجر شوبيفاي · منتج واحد',
    description:
      'ثيم شوبيفاي بمنتج واحد يركّز على التحويل: مسار بيع، وزر إضافة ثابت، وحزم، ومقارنة، وأسئلة شائعة، وإلحاح. يُصدَّر كثيم شوبيفاي جاهز.',
    presets: 3,
    sections: 24,
    demoHref: '/demo',
    createHref: '/build',
    icon: ShoppingBag,
    shopify: true,
  },
  restaurant: {
    tagline: 'مطعم · قائمة · حجوزات',
    description:
      'موقع مطعم تحريري راقٍ: قائمة بتبويبات، ومعرض صور، وساعات عمل، وحجوزات، وحائط صحافة، وقصة الشيف — متجاوب بالكامل.',
    presets: 4,
    sections: 13,
    demoHref: '/demo/restaurant',
    createHref: '/theme/new/restaurant',
    icon: Utensils,
  },
  atlas: {
    tagline: 'تطبيق · برمجيات · B2B',
    description:
      'صفحة هبوط عصرية للبرمجيات: واجهة منتج، وشبكة مزايا، وباقات أسعار، وتكاملات، وشريط ثقة أمني، ودعوة لعرض توضيحي.',
    presets: 4,
    sections: 12,
    demoHref: '/demo/atlas',
    createHref: '/theme/new/atlas',
    icon: LayoutDashboard,
  },
  lookbook: {
    tagline: 'أزياء · ملابس · علامة',
    description:
      'قالب أزياء راقٍ بلوك بوك تحريري بملء الشاشة، ولافتة إصدار، وشبكة الأكثر مبيعًا، وقصة علامة، وحائط صحافة، ونشرة بريدية.',
    presets: 4,
    sections: 11,
    demoHref: '/demo/lookbook',
    createHref: '/theme/new/lookbook',
    icon: Shirt,
  },
  collective: {
    tagline: 'كتالوج · منتجات متعددة',
    description:
      'متجر فاخر متعدد العلامات بواجهة مضيئة، وشبكة مجموعات منسّقة، ووافدون جدد، والأكثر مبيعًا، ووعد العلامة، ونشرة بريدية.',
    presets: 4,
    sections: 10,
    demoHref: '/demo/collective',
    createHref: '/theme/new/collective',
    icon: Store,
  },
  studio: {
    tagline: 'قصة علامة · تحرير',
    description:
      'صفحة قصة علامة تحريرية بخط عرض ضخم، ورسالة المؤسّس، وخط زمني، وقيم، ومنهجية، وفريق، وحائط صحافة، وإحصاءات مجتمع.',
    presets: 4,
    sections: 12,
    demoHref: '/demo/studio',
    createHref: '/theme/new/studio',
    icon: Feather,
  },
  services: {
    tagline: 'خدمات محلية · حِرف',
    description:
      'موقع خدمات فاخر: واجهة، وخدمات، وإثبات، وقبل/بعد، ومناطق الخدمة، وتقييمات، وأسئلة شائعة، ومسار طلب عرض سعر.',
    presets: 4,
    sections: 13,
    demoHref: '/demo/services',
    createHref: '/theme/new/services',
    icon: Wrench,
  },
  wellness: {
    tagline: 'سبا · يوغا · عافية',
    description:
      'قالب هادئ للسبا واستوديوهات اليوغا وعلامات العافية: قائمة جلسات، وحجز، ومدرّبون، وجداول، وبطاقات هدايا.',
    presets: 3,
    sections: 12,
    demoHref: '/demo/wellness',
    createHref: '/theme/new/wellness',
    icon: Leaf,
  },
}

/** Materialize the ordered card list from the canonical map + tint labels. */
const THEME_CARDS: ThemeCard[] = BUSINESS_TYPE_ORDER.map((id) => ({
  id,
  ...THEMES[id],
}))

type Category = 'all' | 'sites' | 'shopify'

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all',     label: 'كل القوالب'     },
  { id: 'sites',   label: 'مواقع مُستضافة' },
  { id: 'shopify', label: 'تصدير شوبيفاي'  },
]

export default function ThemesPage() {
  const [filter, setFilter] = useState<Category>('all')
  // Admin keeps the working one-product builder; everyone else sees "coming soon".
  const isAdmin = useIsAdmin()

  const visible = useMemo(() => {
    if (filter === 'shopify') return THEME_CARDS.filter((t) => t.shopify)
    if (filter === 'sites')   return THEME_CARDS.filter((t) => !t.shopify)
    return THEME_CARDS
  }, [filter])

  const total = THEME_CARDS.length

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Same unified backdrop as the home page: aurora orbs + the fine "boxes"
          grid, fixed behind the long scroll. */}
      <AuroraBackground fixed intensity={0.7} />
      <div aria-hidden className="grid-fade-page pointer-events-none fixed inset-0 -z-10 opacity-70" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
        {/* ── Page header ── */}
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-token bg-white/60 px-3 py-1.5 text-[12px] font-medium text-muted backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            القوالب الـ{total} متاحة · والمزيد شهريًا
          </div>
          <h1 className="heading-ar text-[clamp(40px,6vw,64px)] text-foreground">
            <span className="gradient-text">قوالب</span> لكل نشاط تجاري.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-[1.85] text-muted">
            ثمانية قوالب مصمَّمة بإتقان. اختر واحدًا، اكتب نبذتك، ويكتب ذكاء زينيا
            المحتوى ويصمّم الصفحة ويسلّمك معاينة مباشرة جاهزة للنشر اليوم.
          </p>

          {/* Filters */}
          <div className="mt-9 inline-flex items-center gap-1 rounded-full border border-token bg-white/60 p-1 shadow-soft-md backdrop-blur-md">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-full px-5 py-2 text-[13px] font-semibold transition-all',
                  filter === f.id
                    ? 'bg-foreground text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ── All templates grid ── */}
        <RevealGroup key={filter} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <ThemeGridCard key={t.id} theme={t} tint={auroraTints[t.id]} isAdmin={isAdmin} />
          ))}
        </RevealGroup>

        {/* ── Bottom CTA ── */}
        <BottomCTA />
      </main>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

function ThemeGridCard({ theme, tint, isAdmin }: { theme: ThemeCard; tint: AuroraTint; isAdmin: boolean | null }) {
  const Icon = theme.icon
  const accentText = tint.accent === '#1c1c1c' ? '#1c1c1c' : tint.accent
  // The one-product builder is being rebuilt — "coming soon" for everyone but
  // the admin (loading counts as non-admin so no build CTA flashes).
  const comingSoon = theme.id === 'one_product' && isAdmin !== true
  return (
    <RevealItem
      className="group relative flex flex-col overflow-hidden rounded-[26px] ring-hover card-sheen transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow:
          '0 30px 70px -30px rgba(40,44,92,0.42), 0 2px 8px rgba(40,44,92,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      {/* Per-type aurora wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tint.orb1}, transparent 70%)` }}
      />

      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={themePreview(theme.id)}
          alt={tint.label}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          onError={(e) => {
            const fb = themePreviewFallback(theme.id)
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)' }}
        />
        {/* Accent stripe */}
        <div className="absolute left-0 top-0 h-1 w-full" style={{ background: tint.accent }} />
        {/* Status pill */}
        <div className="absolute end-4 top-4">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={
              comingSoon
                ? { background: 'rgba(0,0,0,0.55)', color: '#ffffff', backdropFilter: 'blur(4px)' }
                : { background: tint.accent, color: tint.accent === '#1c1c1c' ? '#ffffff' : '#0a0a0c' }
            }
          >
            {comingSoon ? 'قريبًا' : theme.shopify ? 'شوبيفاي' : 'مباشر'}
          </span>
        </div>
        {/* Bottom title overlay */}
        <div className="absolute bottom-4 right-5 left-5 flex items-end justify-between text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/80">{theme.tagline}</p>
            <h3 className="mt-0.5 text-[24px] font-[590] tracking-[-0.6px]">{tint.label}</h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-5">
        <p className="text-[13.5px] leading-[1.6] text-muted">{theme.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: `${tint.accent}1a`, color: accentText }}
          >
            <Icon className="h-2.5 w-2.5" strokeWidth={2.25} />
            {theme.tagline.split(' · ')[0]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            <Layers className="h-2.5 w-2.5" strokeWidth={2.25} />
            {theme.sections} قسمًا
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-token bg-white/60 px-2.5 py-1 text-muted">
            <Palette className="h-2.5 w-2.5" strokeWidth={2.25} />
            {theme.presets} أنماط
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-5">
          <Link
            href={theme.demoHref}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition hover:scale-[1.02]"
            style={{
              background: tint.accent,
              color: tint.accent === '#1c1c1c' ? '#ffffff' : '#0a0a0c',
              boxShadow: 'rgba(28,28,28,0.08) 0px 1px 2px 0px',
            }}
          >
            شاهد العرض
            <ArrowUpRight className="h-3 w-3 rtl-flip transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
          </Link>
          {comingSoon ? (
            <span
              className="cursor-not-allowed rounded-full border border-token bg-white/50 px-4 py-2.5 text-[13px] font-semibold text-muted"
              aria-label="نسخة جديدة قادمة قريبًا"
              title="نعمل على نسخة جديدة كليًا — قريبًا"
            >
              قريبًا
            </span>
          ) : (
            <Link
              href={theme.createHref}
              className="rounded-full border border-token bg-white/70 px-4 py-2.5 text-[13px] font-semibold text-foreground backdrop-blur-md transition hover:bg-white"
              aria-label={`ابنِ بقالب ${tint.label}`}
            >
              ابنِ
            </Link>
          )}
        </div>
      </div>
    </RevealItem>
  )
}

function BottomCTA() {
  return (
    <Reveal className="relative mt-20 overflow-hidden rounded-3xl border border-token bg-white/70 p-10 text-center backdrop-blur-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 0%, rgba(94,106,210,0.10), transparent 65%), radial-gradient(ellipse 60% 80% at 50% 100%, rgba(217,119,6,0.06), transparent 70%)',
        }}
      />
      <div className="relative">
        <h2 className="heading-ar text-[clamp(28px,4vw,40px)] text-foreground">لا تجد نوع نشاطك؟</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
          نضيف قوالب جديدة كل شهر. أخبرنا بما تحتاجه وسنمنحه الأولوية.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-foreground px-6 py-3 text-[13.5px] font-semibold text-white shadow-soft-md transition hover:scale-[1.02] hover:shadow-soft-lg"
          >
            اطلب قالبًا
          </Link>
          <Link
            href="/build"
            className="rounded-full border border-token bg-white/70 px-6 py-3 text-[13.5px] font-semibold text-foreground backdrop-blur-md transition hover:bg-white"
          >
            ابدأ الإنشاء الآن
          </Link>
        </div>
      </div>
    </Reveal>
  )
}
