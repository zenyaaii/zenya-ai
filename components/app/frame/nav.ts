import {
  BarChart3, CalendarCheck, CreditCard, Folder, Globe, Home, Image as ImageIcon,
  MessageSquareQuote, Search, Settings,
} from 'lucide-react'
import type { Messages } from '@/lib/i18n/messages'
import type { FrameGroup, FrameItem } from './DashFrame'

/**
 * The dashboard's pages, in the order the rail lists them. One list for the
 * real shell and the demo, so the two cannot drift.
 *
 * `dock` marks the four the phone dock carries; the rest live under "More".
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

type Spec = Omit<FrameItem, 'label' | 'href' | 'onSelect' | 'active'> & { key: PageKey; label: (t: Messages) => string }

const WORK: Spec[] = [
  { key: 'home',      label: (t) => t.nav.home,      icon: Home,          tour: 'home',      dock: true, keywords: 'home رئيسية بداية' },
  { key: 'sites',     label: (t) => t.nav.sites,     icon: Folder,        tour: 'sites',     dock: true, keywords: 'sites موقع مواقع تعديل محرر' },
  { key: 'gallery',   label: (t) => t.nav.gallery,   icon: ImageIcon,                                    keywords: 'gallery photos صور صورة معرض' },
  { key: 'analytics', label: (t) => t.nav.analytics, icon: BarChart3,     tour: 'analytics', dock: true, keywords: 'analytics visitors زوار زيارات احصاءات إحصاءات' },
  { key: 'bookings',  label: (t) => t.nav.bookings,  icon: CalendarCheck, tour: 'bookings',  dock: true, keywords: 'bookings حجز حجوزات مواعيد' },
  { key: 'reviews',   label: (t) => t.nav.reviews,   icon: MessageSquareQuote, tour: 'reviews',          keywords: 'reviews google تقييم تقييمات آراء' },
  { key: 'seo',       label: (t) => t.nav.seo,       icon: Search,        tour: 'seo',                   keywords: 'seo google بحث جوجل ظهور' },
  { key: 'domains',   label: (t) => t.nav.domains,   icon: Globe,         tour: 'domains',               keywords: 'domain domains نطاق دومين عنوان' },
]

const ACCOUNT: Spec[] = [
  { key: 'billing',  label: (t) => t.nav.billing,  icon: CreditCard, keywords: 'billing plan باقة اشتراك دفع فاتورة' },
  { key: 'settings', label: (t) => t.nav.settings, icon: Settings,   keywords: 'settings account حساب كلمة المرور لغة' },
]

/** Which page a route belongs to: /dashboard/sites/abc is Sites. */
export function pageFor(pathname: string): PageKey | null {
  if (pathname === '/dashboard') return 'home'
  for (const k of Object.keys(PAGE_ROUTE) as PageKey[]) {
    if (k !== 'home' && (pathname === PAGE_ROUTE[k] || pathname.startsWith(PAGE_ROUTE[k] + '/'))) return k
  }
  return null
}

export function buildNav(
  t: Messages,
  current: PageKey | null,
  link: (k: PageKey) => { href?: string; onSelect?: () => void },
): FrameGroup[] {
  const make = (s: Spec): FrameItem => ({ ...s, label: s.label(t), active: s.key === current, ...link(s.key) })
  return [
    { label: t.nav.workspace, items: WORK.map(make) },
    { label: t.nav.account, items: ACCOUNT.map(make) },
  ]
}
