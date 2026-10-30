import type { Messages } from '@/lib/i18n/messages'
import type { FramePage } from '@/components/app/v6/Frame'
import type { IconName } from '@/components/app/v6/sprite'

/**
 * The dashboard's pages, in the order the v6 design's side menu lists them.
 * One list for the real shell and the demo, so the two cannot drift. The
 * phone dock carries home, bookings, analytics and sites (v6/Frame); the
 * rest live under "More".
 *
 * `keywords` are extra words the search palette matches, in both languages,
 * so "حجز" finds Bookings and "domain" finds النطاقات whatever the locale.
 */
export type PageKey =
  | 'home' | 'sites' | 'gallery' | 'analytics' | 'bookings' | 'reviews'
  | 'seo' | 'domains' | 'billing' | 'settings'

export const PAGE_ROUTE: Record<PageKey, string> = {
  home: '/dashboard',
  sites: '/dashboard/sites',
  gallery: '/dashboard/gallery',
  analytics: '/dashboard/analytics',
  bookings: '/dashboard/bookings',
  reviews: '/dashboard/reviews',
  seo: '/dashboard/seo',
  domains: '/dashboard/domains',
  billing: '/dashboard/billing',
  settings: '/dashboard/settings',
}

type Spec = { key: PageKey; label: (t: Messages) => string; icon: IconName; group: 'w' | 'a'; tour?: string; keywords: string }

const PAGES: Spec[] = [
  { key: 'home',      label: (t) => t.nav.home,      icon: 'home',     group: 'w', tour: 'home',      keywords: 'home رئيسية بداية' },
  { key: 'sites',     label: (t) => t.nav.sites,     icon: 'sites',    group: 'w', tour: 'sites',     keywords: 'sites موقع مواقع تعديل محرر' },
  { key: 'gallery',   label: (t) => t.nav.gallery,   icon: 'gallery',  group: 'w',                    keywords: 'gallery photos صور صورة معرض' },
  { key: 'analytics', label: (t) => t.nav.analytics, icon: 'chart',    group: 'w', tour: 'analytics', keywords: 'analytics visitors زوار زيارات احصاءات إحصاءات' },
  { key: 'bookings',  label: (t) => t.nav.bookings,  icon: 'cal',      group: 'w', tour: 'bookings',  keywords: 'bookings حجز حجوزات مواعيد' },
  { key: 'reviews',   label: (t) => t.nav.reviews,   icon: 'reviews',  group: 'w', tour: 'reviews',   keywords: 'reviews google تقييم تقييمات آراء' },
  { key: 'seo',       label: (t) => t.nav.seo,       icon: 'search',   group: 'w', tour: 'seo',       keywords: 'seo google بحث جوجل ظهور' },
  { key: 'domains',   label: (t) => t.nav.domains,   icon: 'globe',    group: 'w', tour: 'domains',   keywords: 'domain domains نطاق دومين عنوان' },
  { key: 'billing',   label: (t) => t.nav.billing,   icon: 'card',     group: 'a',                    keywords: 'billing plan باقة اشتراك دفع فاتورة' },
  { key: 'settings',  label: (t) => t.nav.settings,  icon: 'settings', group: 'a',                    keywords: 'settings account حساب كلمة المرور لغة' },
]

/** The badges on the menu: new bookings in the accent, new reviews quiet. */
export type NavCounts = { bookings?: number; reviews?: number }

/** Which page a route belongs to: /dashboard/sites/abc is Sites. */
export function pageFor(pathname: string): PageKey | null {
  if (pathname === '/dashboard') return 'home'
  for (const k of Object.keys(PAGE_ROUTE) as PageKey[]) {
    if (k !== 'home' && (pathname === PAGE_ROUTE[k] || pathname.startsWith(PAGE_ROUTE[k] + '/'))) return k
  }
  return null
}

export function buildPages(
  t: Messages,
  current: PageKey | null,
  link: (k: PageKey) => { href?: string; onSelect?: () => void },
  counts: NavCounts = {},
): FramePage[] {
  return PAGES.map((s) => ({
    key: s.key,
    label: s.label(t),
    icon: s.icon,
    group: s.group,
    tour: s.tour,
    keywords: s.keywords,
    active: s.key === current,
    ...link(s.key),
    ...(s.key === 'bookings' ? { count: counts.bookings, countTone: 'acc' as const } : {}),
    ...(s.key === 'reviews' ? { count: counts.reviews, countTone: 'quiet' as const } : {}),
  }))
}
