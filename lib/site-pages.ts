/**
 * Multi-page map for Zenya-hosted brochure sites.
 *
 * Every brochure template already renders several internal "views" (home, menu,
 * about, …) driven by a `view` prop — but historically on ONE URL. This maps
 * each template's views to real, crawlable URLs (slug.zenyaai.co/<slug>) so
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

/** All pages for a template (empty array if the template isn't multi-page). */
export function pagesFor(businessType: string): SitePage[] {
  return SITE_PAGES[businessType] || []
}

/** Resolve a URL segment to its page (null if unknown). Empty slug = home. */
export function pageBySlug(businessType: string, slug: string): SitePage | null {
  const pages = pagesFor(businessType)
  const s = (slug || '').toLowerCase()
  return pages.find((p) => p.slug === s) || null
}

/** view key → URL slug (for client nav). Falls back to the view itself. */
export function slugForView(businessType: string, view: string): string {
  const p = pagesFor(businessType).find((x) => x.view === view)
  return p ? p.slug : ''
}
