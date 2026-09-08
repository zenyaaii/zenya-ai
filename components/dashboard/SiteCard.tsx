'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  Globe,
  MoreHorizontal,
  Download,
  Eye,
  Edit3,
  Trash2,
  Lock,
  ShoppingBag,
  Utensils,
  Shirt,
  LayoutDashboard,
  Feather,
  Store,
  Wrench,
  Leaf,
  type LucideIcon,
} from 'lucide-react'
import DomainsList from '@/components/DomainsList'
import { themePreview, themePreviewFallback, hasLocalThemePreview } from '@/lib/theme-previews'
import { publicSiteUrl, publicSiteHost } from '@/lib/portal-urls'

export type SiteTheme = {
  id: string
  product_name: string
  created_at: string
  slug?: string | null
  is_published?: boolean
  template_type?: string | null
  content?: any
  view_count?: number | null
}

export const HOSTABLE_TYPES = new Set([
  'restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services',
])
export const SHOPIFY_TYPES = new Set(['one_product', 'storefront', 'collective'])

const TEMPLATE_ICON: Record<string, LucideIcon> = {
  one_product: ShoppingBag,
  storefront:  ShoppingBag,
  collective:  Store,
  restaurant:  Utensils,
  atlas:       LayoutDashboard,
  lookbook:    Shirt,
  studio:      Feather,
  services:    Wrench,
  wellness:    Leaf,
}

const TEMPLATE_LABEL: Record<string, string> = {
  one_product: 'متجر · شوبيفاي',
  storefront:  'متجر · شوبيفاي',
  collective:  'تشكيلة · شوبيفاي',
  restaurant:  'مطعم',
  atlas:       'تطبيق',
  lookbook:    'أزياء',
  studio:      'ستوديو',
  services:    'خدمات',
  wellness:    'عافية',
}

const TEMPLATE_TINT: Record<string, { bg: string; ring: string; fg: string }> = {
  one_product: { bg: 'rgba(94,106,210,0.10)',  ring: 'rgba(94,106,210,0.30)',  fg: '#5e6ad2' },
  storefront:  { bg: 'rgba(94,106,210,0.10)',  ring: 'rgba(94,106,210,0.30)',  fg: '#5e6ad2' },
  collective:  { bg: 'rgba(5,150,105,0.10)',   ring: 'rgba(5,150,105,0.30)',   fg: '#059669' },
  restaurant:  { bg: 'rgba(200,169,106,0.14)', ring: 'rgba(200,169,106,0.35)', fg: '#9b6f00' },
  atlas:       { bg: 'rgba(67,56,202,0.10)',   ring: 'rgba(67,56,202,0.28)',   fg: '#4338ca' },
  lookbook:    { bg: 'rgba(190,18,60,0.10)',   ring: 'rgba(190,18,60,0.28)',   fg: '#be123c' },
  studio:      { bg: 'rgba(28,28,28,0.06)',    ring: 'rgba(28,28,28,0.20)',    fg: '#1c1c1c' },
  services:    { bg: 'rgba(194,65,12,0.10)',   ring: 'rgba(194,65,12,0.30)',   fg: '#c2410c' },
  wellness:    { bg: 'rgba(21,128,61,0.10)',   ring: 'rgba(21,128,61,0.30)',   fg: '#15803d' },
}

export default function SiteCard({
  theme,
  hasHosting,
  canPublish = false,
  trialHosting = false,
  isPro,
  plan,
  onPublish,
  onAddDomain,
  onUnpublish,
  onDelete,
}: {
  theme: SiteTheme
  hasHosting: boolean
  /** Can publish right now — paid hosting OR inside the free 30-day trial. */
  canPublish?: boolean
  /** Live only because of the free trial (no paid hosting) — shows a badge. */
  trialHosting?: boolean
  /** any pro entitlement (lifetime OR hosting OR admin) */
  isPro: boolean
  /** raw plan value from profile — used to keep upsell copy honest
   *  (a `pro_onetime` user is already "Pro"; telling them to "الترقية إلى Pro"
   *  is confusing — they need hosting, not Pro). */
  plan?: string | null
  onPublish: () => void
  onAddDomain: () => void
  onUnpublish: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type ||
    'one_product'

  const isHostable = HOSTABLE_TYPES.has(businessType)
  const isEcom = SHOPIFY_TYPES.has(businessType)
  const publishedHere = isHostable && !!theme.is_published && !!theme.slug

  const Icon = TEMPLATE_ICON[businessType] || ShoppingBag
  const label = TEMPLATE_LABEL[businessType] || businessType
  const tint = TEMPLATE_TINT[businessType] || TEMPLATE_TINT.one_product
  const hasPreview = hasLocalThemePreview(businessType)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      /* NO INLINE boxShadow. It used to carry
         '0 1px 0 #f0ede6, 0 8px 24px -16px rgba(28,28,28,0.10)' - the old warm
         line plus a drop shadow - and an inline style beats every stylesheet,
         so this card was the one place on the surface the ring token could not
         reach. Elevation is .zy-card's stacked hairlines now, like everything
         else. The lift on hover stays: it is the card responding, not
         elevation. */
      className={
        'group relative isolate flex flex-col rounded-2xl zy-card transition-all duration-200 hover:-translate-y-0.5 ' +
        (menuOpen ? 'z-30' : '')
      }
    >
      {/* Top — visual + status overlay. Themes with a captured preview
          show the screenshot; everything else falls back to the icon-
          on-tinted-gradient placeholder. */}
      {hasPreview ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={themePreview(businessType)}
            alt={`معاينة ${label}`}
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
            onError={(e) => {
              const fb = themePreviewFallback(businessType)
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb
            }}
          />
          {/* Accent stripe at top for brand cue */}
          {/* THE TEMPLATE COLOUR BAR IS GONE. It drew a 4px rule of the
              template's own hue across the top of every card, which broke two
              house rules at once: nothing draws a line across a surface, and
              the page is achromatic apart from the accent and the status
              triad. It also wrote left-0, a PHYSICAL edge, on a card that
              renders in RTL - harmless only because it was w-full.

              Nothing is lost: the template already names itself in words
              directly under the title (مطعم / تطبيق / أزياء), which is
              legible to a screen reader and to someone who cannot separate
              #be123c from #c2410c. The medallion keeps its tint - see the
              note there. */}
          {/* Subtle bottom fade so the title chip below reads clean */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-white/40"
          />
          {/* Status pill — top right */}
          <div className="absolute end-3 top-3">
            <StatusPill
              isPublished={!!publishedHere}
              isDraft={!publishedHere && isHostable}
              isEcom={isEcom}
            />
          </div>
        </div>
      ) : (
        <div
          className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-2xl"
          style={{
            background: `linear-gradient(135deg, ${tint.bg} 0%, white 80%)`,
          }}
        >
          {/* Subtle dot grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(28,28,28,0.08) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
              maskImage: 'radial-gradient(circle at 50% 60%, black, transparent 75%)',
            }}
          />

          {/* Icon medallion */}
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
            /* Was a coloured drop shadow. The house style has no drop shadows
               at all - elevation is stacked hairlines - so this is the same
               tint expressed as a ring. */
            /* THE MEDALLION KEEPS ITS TINT, DELIBERATELY, and it is the one
               thing on this surface still outside the triad. It is a single
               large object on a card that has no thumbnail, standing in for
               the missing picture, so it is closer to artwork than to chrome.
               Collapsing the nine template hues to one accent would make every
               placeholder identical, and that is a product decision about the
               template identity system rather than a restyle - it is flagged
               rather than taken. */
            style={{
              background: 'white',
              color: tint.fg,
              boxShadow: `0 0 0 1px ${tint.ring}, 0 0 0 4px rgba(250,250,250,0.55)`,
            }}
          >
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </div>

          {/* Status pill — top right */}
          <div className="absolute end-3 top-3">
            <StatusPill
              isPublished={!!publishedHere}
              isDraft={!publishedHere && isHostable}
              isEcom={isEcom}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <h3 className="line-clamp-1 text-[16px] font-semibold tracking-tight text-foreground">
            {theme.product_name || 'موقع بلا عنوان'}
          </h3>
          <p className="mt-0.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted">
            {label}
          </p>
        </div>

        {/* URL block */}
        {publishedHere && (
          <a
            href={publicSiteUrl(theme.slug!)}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[#15803d]/[0.06] px-2 py-1 text-[12px] font-medium text-[#15803d] transition hover:bg-[#15803d]/[0.10]"
          >
            <Globe className="h-3 w-3" strokeWidth={2.5} />
            {publicSiteHost(theme.slug!)}
            <ExternalLink className="h-2.5 w-2.5 opacity-70" strokeWidth={2.5} />
          </a>
        )}
        {!publishedHere && isHostable && (
          <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[rgba(217,119,6,0.08)] px-2 py-1 text-[12px] font-medium text-[#b45309]">
            مسودّة · غير مباشر بعد
          </div>
        )}
        {/* Free-trial hosting badge — this site is live only for the first month. */}
        {publishedHere && trialHosting && (
          <div
            className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-[12px] font-medium"
            style={{ background: 'rgba(217,119,6,0.10)', color: '#b45309', border: '1px solid rgba(217,119,6,0.20)' }}
            title="موقعك مباشر مجانًا خلال الشهر الأول. بعده تحتاج خطة Starter للإبقاء عليه."
          >
            🎁 تجربة مجانية · مباشر خلال الشهر الأول
          </div>
        )}
        {isEcom && (
          <div className="mb-3 inline-flex items-center gap-1.5 self-start rounded-md bg-[rgba(94,106,210,0.08)] px-2 py-1 text-[12px] font-medium text-primary">
            يُصدَّر إلى شوبيفاي
          </div>
        )}

        {/* Inline domains list — only when hosting + published here */}
        {publishedHere && hasHosting && (
          <DomainsList themeId={theme.id} />
        )}

        {/* Locked upsell for hostable + paid-but-no-hosting (Starter, pro_onetime).
            Hidden during the free trial — those users can publish now. */}
        {isHostable && !hasHosting && !canPublish && isPro && !publishedHere && (() => {
          // Copy honesty: a pro_onetime user IS "Pro" — telling them to
          // "الترقية إلى Pro" is misleading. They need hosting, not Pro.
          const isOnetime = plan === 'pro_onetime'
          const title = isOnetime ? 'أضف الاستضافة لنشر الموقع' : 'خطة Pro تفتح النشر'
          const cta = isOnetime
            ? 'أضف استضافة زينيا · 24.99$ شهريًا ←'
            : 'الترقية إلى Pro · 24.99$ شهريًا ←'
          return (
            <div className="mb-3 rounded-lg border border-token bg-surface px-3 py-2.5 text-[12.5px]">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" strokeWidth={2} />
                <div>
                  <div className="font-medium text-foreground">{title}</div>
                  <Link href="/pricing?upgrade=pro" className="text-primary hover:underline">
                    {cta}
                  </Link>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Action row — sticks to bottom */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Link
            href={editUrlFor(theme.id, businessType)}
            className="zy-btn-q"
            title="تعديل المحتوى"
          >
            <Edit3 className="me-1 inline-block h-3 w-3" strokeWidth={2.25} />
            تعديل
          </Link>
          {/* Storefront/Shopify themes are export-only (not a publish-ready
              hosted site), so no misleading preview button — Edit + the ZIP
              export are the real actions. Every other template keeps معاينة. */}
          {!isEcom && (
            <a
              href={publishedHere ? publicSiteUrl(theme.slug!) : `/preview/${theme.id}`}
              target="_blank"
              rel="noreferrer"
              className="zy-btn-q"
            >
              <Eye className="me-1 inline-block h-3 w-3" strokeWidth={2.25} />
              معاينة
              <ExternalLink className="ms-1 inline-block h-2.5 w-2.5 opacity-60" strokeWidth={2.25} />
            </a>
          )}

          {/* Hostable primary action */}
          {isHostable && (
            publishedHere ? (
              hasHosting ? (
                <button
                  onClick={onAddDomain}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <Globe className="h-3 w-3" strokeWidth={2.5} />
                  أضف نطاقًا
                </button>
              ) : null
            ) : (
              canPublish ? (
                <button
                  onClick={onPublish}
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                >
                  انشر على زينيا
                </button>
              ) : (
                <Link
                  href="/pricing?upgrade=pro"
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
                >
                  رقِّ للنشر
                </Link>
              )
            )
          )}

          {/* E-com primary — ZIP download. Starter includes Shopify export. */}
          {isEcom && isPro && (
            <a
              href={`/api/themes/${theme.id}/export-shopify`}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Download className="h-3 w-3" strokeWidth={2.5} />
              نزّل ملف شوبيفاي
            </a>
          )}
          {isEcom && !isPro && (
            <Link
              href="/pricing?upgrade=starter"
              className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:opacity-90"
            >
              اشترك في Starter للتصدير
            </Link>
          )}

          {/* Overflow menu — preview thumbnail + open + unpublish + delete */}
          <div className="relative ms-auto">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md border border-token p-1.5 text-muted hover:bg-black/5"
              aria-label="إجراءات إضافية"
            >
              <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="zy-menu absolute bottom-full end-0 z-40 mb-2 w-64 overflow-hidden"
                  >
                    {/* Screenshot thumbnail — what the user expects to see when
                        they open the "more" menu. Clicking it opens the site
                        preview in a new tab. Storefront/Shopify themes have no
                        publish-ready preview, so this is hidden for them. */}
                    {!isEcom && (
                    <a
                      href={publishedHere ? publicSiteUrl(theme.slug!) : `/preview/${theme.id}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="group block"
                      title="افتح المعاينة الكاملة"
                    >
                      {hasPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={themePreview(businessType)}
                          alt={`لقطة ${theme.product_name || label}`}
                          className="aspect-[16/9] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                          onError={(e) => {
                            const fb = themePreviewFallback(businessType)
                            if (e.currentTarget.src !== fb) e.currentTarget.src = fb
                          }}
                        />
                      ) : (
                        <div
                          className="flex aspect-[16/9] w-full items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${tint.bg} 0%, white 80%)`,
                          }}
                        >
                          <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: tint.fg }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-token bg-white px-3 py-2 text-[11.5px] font-medium text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="h-3 w-3" strokeWidth={2.25} />
                          افتح المعاينة الكاملة
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-70" strokeWidth={2.25} />
                      </div>
                    </a>
                    )}

                    <div className="p-1">
                      {publishedHere && (
                        <>
                          <button
                            onClick={() => { setMenuOpen(false); onUnpublish() }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-[12.5px] text-muted hover:bg-black/5 hover:text-foreground"
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={2.25} />
                            إلغاء النشر
                          </button>
                          <div className="my-1 h-px bg-token" />
                        </>
                      )}
                      <button
                        onClick={() => { setMenuOpen(false); onDelete() }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start text-[12.5px] text-[#b91c1c] hover:bg-[rgba(220,38,38,0.06)]"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2.25} />
                        حذف الموقع نهائيًا
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* Every brochure theme has its own /edit route built on the shared
 * ThemeEditor shell. E-commerce themes (collective / one_product /
 * storefront) ship via Shopify and don't have an in-app editor, so they
 * fall through to the storefront preview. */
const BROCHURE_TYPES = new Set([
  'restaurant', 'atlas', 'lookbook', 'wellness', 'studio', 'services',
])
function editUrlFor(id: string, businessType: string): string {
  if (BROCHURE_TYPES.has(businessType)) return `/preview/${businessType}/${id}/edit`
  return `/preview/${id}`
}

/* -------------------------- StatusPill ----------------------------------
   Three hand-rolled pills became one .zy-pill with a tone. They were the
   same shape three times over with their own fill, border and foreground
   inlined - and an inline style is unreachable from a stylesheet, so this
   was one of the places the status triad could not land by re-pointing a
   token. The tones are the documented ones: live is success, a draft is
   warning (it is unfinished, not broken) and a Shopify export is accent,
   because it names a destination rather than a state.
------------------------------------------------------------------------- */

function StatusPill({
  isPublished,
  isDraft,
  isEcom,
}: {
  isPublished: boolean
  isDraft: boolean
  isEcom: boolean
}) {
  if (isPublished) {
    return (
      <span className="zy-pill" data-tone="ok">
        {/* The dot pulses to say "serving right now". Under
            prefers-reduced-motion the stylesheet stops it. */}
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#15803d]" />
        مباشر
      </span>
    )
  }
  if (isEcom) {
    return <span className="zy-pill" data-tone="accent">شوبيفاي</span>
  }
  if (isDraft) {
    return <span className="zy-pill" data-tone="warn">مسوّدة · غير مباشر بعد</span>
  }
  return null
}
