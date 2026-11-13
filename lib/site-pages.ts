/**
 * Multi-page map for Beynoun-hosted brochure sites.
 *
 * Every brochure template already renders several internal "views" (home, menu,
 * about, …) driven by a `view` prop — but historically on ONE URL. This maps
 * each template's views to real, crawlable URLs (slug.beynoun.com/<slug>) so
 * every view becomes its own indexable page, reusing the exact same content.
 *
 * The `view` values MUST match each template Preview's `View` union.
 * The home page has slug '' (served at the root).
 */

export type SitePage = {
  /** The template's internal view key (matches its `View` union). */
  view: string
  /** URL segment. '' = the site root (home). */
  slug: string
  /** Arabic label — used in page titles and (future) nav. */
  label: string
}

export const SITE_PAGES: Record<string, SitePage[]> = {
  restaurant: [
    { view: 'home',    slug: '',        label: 'الرئيسية' },
    { view: 'menu',    slug: 'menu',    label: 'قائمة الطعام' },
    { view: 'gallery', slug: 'gallery', label: 'معرض الصور' },
    { view: 'visit',   slug: 'visit',   label: 'الزيارة والحجز' },
    { view: 'about',   slug: 'about',   label: 'قصتنا' },
    { view: 'reviews', slug: 'reviews', label: 'التقييمات' },
  ],
  atlas: [
    { view: 'home',         slug: '',             label: 'الرئيسية' },
    { view: 'features',     slug: 'features',     label: 'المزايا' },
    { view: 'pricing',      slug: 'pricing',      label: 'الأسعار' },
    { view: 'integrations', slug: 'integrations', label: 'التكاملات' },
    { view: 'docs',         slug: 'docs',         label: 'التوثيق' },
  ],
  lookbook: [
    { view: 'home',     slug: '',         label: 'الرئيسية' },
    { view: 'shop',     slug: 'shop',     label: 'المتجر' },
    { view: 'lookbook', slug: 'lookbook', label: 'التشكيلة' },
    { view: 'about',    slug: 'about',    label: 'عن العلامة' },
  ],
  wellness: [
    { view: 'home',       slug: '',           label: 'الرئيسية' },
    { view: 'treatments', slug: 'treatments', label: 'الجلسات' },
    { view: 'team',       slug: 'team',       label: 'الفريق' },
    { view: 'space',      slug: 'space',      label: 'المكان' },
    { view: 'about',      slug: 'about',      label: 'من نحن' },
    { view: 'contact',    slug: 'contact',    label: 'تواصل معنا' },
  ],
  studio: [
    { view: 'home',    slug: '',        label: 'الرئيسية' },
    { view: 'about',   slug: 'about',   label: 'من نحن' },
    { view: 'process', slug: 'process', label: 'منهجيتنا' },
    { view: 'team',    slug: 'team',    label: 'الفريق' },
    { view: 'contact', slug: 'contact', label: 'تواصل' },
  ],
  services: [
    { view: 'home',     slug: '',         label: 'الرئيسية' },
    { view: 'services', slug: 'services', label: 'خدماتنا' },
    { view: 'about',    slug: 'about',    label: 'من نحن' },
    { view: 'process',  slug: 'process',  label: 'كيف نعمل' },
    { view: 'contact',  slug: 'contact',  label: 'تواصل' },
  ],
}

/**
 * A services kind with its own full theme has its own pages. The `view` values
 * match that theme's page ids (components/theme/services/niche/GymFull.tsx).
 */
export const NICHE_PAGES: Record<string, SitePage[]> = {
  gym: [
    { view: 'home',      slug: '',          label: 'الرئيسية' },
    { view: 'plans',     slug: 'plans',     label: 'الاشتراكات' },
    { view: 'coaches',   slug: 'coaches',   label: 'المدربون' },
    { view: 'timetable', slug: 'timetable', label: 'جدول الحصص' },
    { view: 'club',      slug: 'club',      label: 'النادي' },
    { view: 'book',      slug: 'book',      label: 'احجز وزُرنا' },
  ],
  photo: [
    { view: 'home',      slug: '',          label: 'الرئيسية' },
    { view: 'work',      slug: 'work',      label: 'الأعمال' },
    { view: 'packages',  slug: 'packages',  label: 'الباقات' },
    { view: 'official',  slug: 'official',  label: 'الصور الرسمية' },
    { view: 'studio',    slug: 'studio',    label: 'الاستوديو' },
    { view: 'book',      slug: 'book',      label: 'احجز جلستك' },
  ],
  // components/theme/services/niche/BeautyFull.tsx
  beauty: [
    { view: 'home',      slug: '',          label: 'الرئيسية' },
    { view: 'sessions',  slug: 'sessions',  label: 'الجلسات' },
    { view: 'packages',  slug: 'packages',  label: 'الباقات' },
    { view: 'center',    slug: 'center',    label: 'المركز' },
    { view: 'book',      slug: 'book',      label: 'احجزي' },
  ],
}

/** The services kind a site's content was built for ('gym', …), if any. */
export function nicheOf(content: unknown, businessType?: string): string | undefined {
  if (!content || typeof content !== 'object') return undefined
  const c = content as Record<string, any>
  const inner = businessType && c[businessType] && typeof c[businessType] === 'object' ? c[businessType] : c
  return typeof inner.niche === 'string' ? inner.niche : typeof c.niche === 'string' ? c.niche : undefined
}

/** All pages for a template (empty array if the template isn't multi-page). */
export function pagesFor(businessType: string, niche?: string): SitePage[] {
  if (businessType === 'services' && niche && NICHE_PAGES[niche]) return NICHE_PAGES[niche]
  return SITE_PAGES[businessType] || []
}

/** Resolve a URL segment to its page (null if unknown). Empty slug = home. */
export function pageBySlug(businessType: string, slug: string, niche?: string): SitePage | null {
  const pages = pagesFor(businessType, niche)
  const s = (slug || '').toLowerCase()
  return pages.find((p) => p.slug === s) || null
}

/** view key → URL slug (for client nav). Falls back to the view itself. */
export function slugForView(businessType: string, view: string, niche?: string): string {
  const p = pagesFor(businessType, niche).find((x) => x.view === view)
  return p ? p.slug : ''
}
