/**
 * Shared SEO logic for Zenya-hosted customer sites.
 *
 * One resolver, used in three places so they never drift:
 *   1. app/s/[slug]/page.tsx  → generateMetadata (what Google actually reads)
 *   2. app/s/[slug]/sitemap.xml + robots.txt route handlers
 *   3. the dashboard SEO editor + live Google-result (SERP) preview
 *
 * A site's SEO is derived automatically from its content, then the owner can
 * override any field. Overrides live under `content.seo` (a plain JSON blob on
 * the existing `themes.content` column — no migration needed).
 *
 * NB: everything here is isomorphic (no `window`, no Node APIs) so it can run
 * in a server component, a route handler, or the browser preview alike.
 */

import { publicSiteUrl, publicSiteHost } from './portal-urls'

/** Owner-set overrides, persisted at themes.content.seo. All optional. */
export type SeoOverrides = {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  /** The token from Google Search Console's "HTML tag" verification method. */
  gscVerification?: string
  /** The filename from Google's "HTML file" method, e.g. "google<hash>.html". */
  gscFile?: string
  /** Owner explicitly hid the site from search engines. */
  noindex?: boolean
}

/** Fully-resolved SEO — defaults merged with overrides, ready to render. */
export type ResolvedSeo = {
  title: string
  description: string
  keywords: string[]
  canonical: string
  host: string
  ogImage?: string
  gscVerification?: string
  index: boolean
  /** True for each field the owner has explicitly overridden (for the UI). */
  overridden: { title: boolean; description: boolean; ogImage: boolean }
}

/** Minimal theme shape the resolver needs. */
export type SeoTheme = {
  product_name?: string | null
  slug?: string | null
  content?: any
  template_type?: string | null
  is_published?: boolean | null
}

const TYPE_LABEL_AR: Record<string, string> = {
  restaurant: 'مطعم',
  atlas: 'تطبيق',
  lookbook: 'أزياء',
  studio: 'ستوديو',
  services: 'خدمات',
  wellness: 'مركز عافية',
  one_product: 'متجر',
  storefront: 'متجر',
  collective: 'تشكيلة منتجات',
}

/** Google truncates the title around 60 chars and the description around 160. */
export const SEO_TITLE_MAX = 60
export const SEO_DESC_MAX = 160

function clean(s: unknown, max: number): string {
  if (typeof s !== 'string') return ''
  return s.replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Pull the first non-empty string among `keys` from a plain object. */
function pick(obj: any, keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

/**
 * Best-effort scrape of a headline / tagline / description out of arbitrary
 * template content. Content shape differs per template, so we look at the most
 * common places (hero block, top-level tagline, about block) and fall back
 * gracefully. Never throws.
 */
function extractCopy(content: any, businessType: string): { tagline?: string; description?: string; city?: string } {
  const root = (content && typeof content === 'object' && content[businessType]) || content || {}
  const hero = (root && typeof root === 'object' && (root.hero || root.header || root.intro)) || {}
  const about = (root && typeof root === 'object' && (root.about || root.story)) || {}

  const tagline =
    pick(hero, ['subheadline', 'subtitle', 'tagline', 'subheading', 'lead']) ||
    pick(root, ['tagline', 'subtitle', 'slogan'])

  const description =
    pick(hero, ['description', 'body', 'text']) ||
    pick(about, ['description', 'text', 'body', 'paragraph']) ||
    pick(root, ['description', 'summary'])

  const city =
    pick(root, ['city', 'location', 'area', 'neighborhood']) ||
    pick(root.contact || {}, ['city', 'location', 'address'])

  return { tagline, description, city }
}

/**
 * Find a usable Open Graph image in the content — prefer an explicit hero/cover
 * image, else the first image URL anywhere in the content.
 */
function extractOgImage(content: any, businessType: string): string | undefined {
  const root = (content && typeof content === 'object' && content[businessType]) || content || {}
  const hero = (root && typeof root === 'object' && (root.hero || root.header)) || {}
  const explicit = pick(hero, ['image', 'backgroundImage', 'cover', 'photo']) || pick(root, ['ogImage', 'cover', 'image'])
  if (explicit) return explicit
  // Shallow scan for the first image-looking string (avoid pulling in a full deep walk here).
  try {
    // Lazy import to keep this module dependency-light where possible.
    const first = firstImageUrl(content)
    if (first) return first
  } catch {}
  return undefined
}

const IMG_RE = /^https?:\/\/[^\s"']+\.(?:jpe?g|png|webp|avif|gif)(?:\?[^\s"']*)?$/i
function firstImageUrl(value: any, depth = 0): string | undefined {
  if (depth > 6 || value == null) return undefined
  if (typeof value === 'string') return IMG_RE.test(value.trim()) ? value.trim() : undefined
  if (Array.isArray(value)) {
    for (const v of value) { const r = firstImageUrl(v, depth + 1); if (r) return r }
    return undefined
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value)) { const r = firstImageUrl(v, depth + 1); if (r) return r }
  }
  return undefined
}

/**
 * Normalise whatever the user pasted from Google's "HTML tag" verification
 * method into the bare token. Handles all of these:
 *   <meta name="google-site-verification" content="ABC123" />
 *   <meta content="ABC123" name="google-site-verification">
 *   google-site-verification: ABC123
 *   ABC123
 * Returns '' if nothing token-like is found.
 */
export function extractGscToken(input: string): string {
  if (typeof input !== 'string') return ''
  const raw = input.trim()
  if (!raw) return ''
  // Full meta tag → pull the content="…" value.
  const metaMatch = raw.match(/content\s*=\s*["']([^"']+)["']/i)
  if (metaMatch) return metaMatch[1].trim()
  // "google-site-verification: TOKEN" form.
  const colon = raw.match(/google-site-verification\s*[:=]\s*([A-Za-z0-9_\-]+)/i)
  if (colon) return colon[1].trim()
  // Otherwise assume they pasted the bare token — but reject anything with
  // angle brackets / spaces (a broken paste) so we never store garbage.
  if (/[<>\s]/.test(raw)) {
    const token = raw.match(/[A-Za-z0-9_\-]{20,}/)
    return token ? token[0] : ''
  }
  return raw
}

/**
 * Figure out which Google verification method the user pasted:
 *  - "file": they pasted the HTML-file name or its contents (contains
 *    `google<hash>.html`). We host that file at the site root.
 *  - "meta": they pasted the `<meta>` tag or the bare token.
 */
export type GscParse = { method: 'file' | 'meta' | 'none'; fileName?: string; token?: string }
export function parseGscVerification(input: string): GscParse {
  if (typeof input !== 'string' || !input.trim()) return { method: 'none' }
  const raw = input.trim()
  // HTML-file method — a "google<hash>.html" appears (filename OR file body,
  // which is literally `google-site-verification: google<hash>.html`).
  const file = raw.match(/\b(google[a-z0-9]+\.html)\b/i)
  if (file) return { method: 'file', fileName: file[1].toLowerCase() }
  // Otherwise treat it as the meta-tag method.
  const token = extractGscToken(raw)
  if (token) return { method: 'meta', token }
  return { method: 'none' }
}

/** Read the owner's SEO overrides off a theme (safe on any shape). */
export function readSeoOverrides(theme: SeoTheme): SeoOverrides {
  const seo = theme?.content && typeof theme.content === 'object' ? (theme.content as any).seo : undefined
  return (seo && typeof seo === 'object') ? seo as SeoOverrides : {}
}

/**
 * The heart of the module: auto-derive good defaults from content, then apply
 * the owner's overrides on top.
 */
export function resolveSeo(theme: SeoTheme): ResolvedSeo {
  const slug = (theme.slug || '').toLowerCase()
  const name = clean(theme.product_name, 80) || slug || 'موقعي'
  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type ||
    ''
  const label = TYPE_LABEL_AR[businessType] || ''
  const { tagline, description, city } = extractCopy(theme.content, businessType)
  const overrides = readSeoOverrides(theme)

  // ── Title ────────────────────────────────────────────────────────────────
  // "الاسم — وصف قصير" or "الاسم | نوع النشاط". Keeps the brand first.
  const autoTitle = (() => {
    if (tagline && (name.length + tagline.length + 3) <= SEO_TITLE_MAX) return `${name} — ${tagline}`
    if (label) return `${name} | ${label}${city ? ' في ' + city : ''}`
    return name
  })()
  const title = clean(overrides.title, SEO_TITLE_MAX) || clean(autoTitle, SEO_TITLE_MAX)

  // ── Description ────────────────────────────────────────────────────────────
  const autoDesc =
    clean(description || tagline, SEO_DESC_MAX) ||
    clean(
      label
        ? `${name} — ${label}${city ? ' في ' + city : ''}. تصفّح، تواصل، واحجز مباشرة من الموقع.`
        : `${name} — موقع رسمي. تصفّح وتواصل مباشرة.`,
      SEO_DESC_MAX,
    )
  const desc = clean(overrides.description, SEO_DESC_MAX) || autoDesc

  // ── Keywords ───────────────────────────────────────────────────────────────
  const keywords = overrides.keywords
    ? overrides.keywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean)
    : [name, label, city].filter((v): v is string => !!v)

  // ── Image / canonical / verification / index ───────────────────────────────
  const ogImage = clean(overrides.ogImage, 500) || extractOgImage(theme.content, businessType)
  const canonical = slug ? publicSiteUrl(slug) : ''
  const host = slug ? publicSiteHost(slug) : ''
  const gscVerification = clean(overrides.gscVerification, 200) || undefined
  const index = overrides.noindex ? false : !!theme.is_published

  return {
    title,
    description: desc,
    keywords,
    canonical,
    host,
    ogImage: ogImage || undefined,
    gscVerification,
    index,
    overridden: {
      title: !!clean(overrides.title, SEO_TITLE_MAX),
      description: !!clean(overrides.description, SEO_DESC_MAX),
      ogImage: !!clean(overrides.ogImage, 500),
    },
  }
}

/** JSON-LD structured data for the public site (LocalBusiness + WebSite). */
export function buildJsonLd(theme: SeoTheme, resolved: ResolvedSeo): Record<string, any>[] {
  const businessType =
    (theme.content && typeof theme.content === 'object' && (theme.content as any).business_type) ||
    theme.template_type ||
    ''
  const name = clean(theme.product_name, 80) || theme.slug || ''
  const graph: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      url: resolved.canonical,
      description: resolved.description,
      inLanguage: 'ar',
    },
  ]
  // Restaurants and physical businesses benefit most from LocalBusiness.
  const LOCAL = new Set(['restaurant', 'wellness', 'services', 'studio'])
  if (LOCAL.has(businessType)) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': businessType === 'restaurant' ? 'Restaurant' : 'LocalBusiness',
      name,
      url: resolved.canonical,
      description: resolved.description,
      ...(resolved.ogImage ? { image: resolved.ogImage } : {}),
    })
  }
  return graph
}
