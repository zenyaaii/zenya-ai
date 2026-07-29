/**
 * Pure analytics helpers — no I/O, no secrets, no framework.
 *
 * Everything here is deterministic so it can be unit-tested directly and
 * shared between the write path (/api/track, recordView) and the read path
 * (/api/analytics, the dashboard). Keep it dependency-free.
 */

/* ─── user-agent classification ─────────────────────────────────────────── */

/**
 * Bots, crawlers, uptime checks and CLI tools.
 *
 * This runs BEFORE device classification for a reason: 65% of the rows in the
 * live table were bots being counted as customers, and several of them
 * (Googlebot's mobile crawler) carry a perfectly normal mobile UA. Anything
 * matching here is stored with is_bot = true and excluded from owner-facing
 * numbers unless they explicitly ask to see it.
 */
const BOT_RE =
  /(bot|crawl|spider|slurp|curl|wget|headless|monitor|preview|fetch|python-requests|axios|node-fetch|lighthouse|pingdom|uptime|semrush|ahrefs|facebookexternalhit|site-verification|whatsapp|telegram|discord|slackbot|embedly|quora link preview|vercel|screaming frog)/i

export function isBotUA(ua: string | null | undefined): boolean {
  if (!ua) return true // no UA at all is not a real browser
  return BOT_RE.test(ua)
}

export function deviceFromUA(ua: string | null | undefined): string {
  if (!ua) return 'Unknown'
  const s = ua.toLowerCase()
  if (/ipad|tablet|playbook|silk|kindle|(android(?!.*mobile))/.test(s)) return 'Tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/.test(s)) return 'Mobile'
  return 'Desktop'
}

export function browserFromUA(ua: string | null | undefined): string {
  if (!ua) return 'Unknown'
  const s = ua
  // Order matters — Edge/Opera/Samsung all embed "Chrome" in their UA.
  if (/Edg[A-Z]?\//i.test(s)) return 'Edge'
  if (/OPR\/|Opera/i.test(s)) return 'Opera'
  if (/SamsungBrowser/i.test(s)) return 'Samsung Internet'
  if (/FBAV|FBAN/i.test(s)) return 'Facebook'
  if (/Instagram/i.test(s)) return 'Instagram'
  if (/CriOS/i.test(s)) return 'Chrome'
  if (/FxiOS|Firefox/i.test(s)) return 'Firefox'
  if (/Chrome\//i.test(s)) return 'Chrome'
  if (/Safari\//i.test(s)) return 'Safari'
  return 'Other'
}

export function osFromUA(ua: string | null | undefined): string {
  if (!ua) return 'Unknown'
  const s = ua
  if (/Windows NT/i.test(s)) return 'Windows'
  if (/iPhone|iPad|iPod|iOS/i.test(s)) return 'iOS'
  if (/Mac OS X|Macintosh/i.test(s)) return 'macOS'
  if (/Android/i.test(s)) return 'Android'
  if (/Linux/i.test(s)) return 'Linux'
  return 'Other'
}

/* ─── referrer + channel ─────────────────────────────────────────────────── */

/** Bare hostname of a referrer, or null when there isn't one (a direct hit). */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    return new URL(referrer).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

const SEARCH_HOSTS = /(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|brave|qwant|naver|ask\.com)/i
const SOCIAL_HOSTS =
  /(instagram|facebook|fb\.|twitter|x\.com|t\.co|tiktok|snapchat|linkedin|pinterest|reddit|youtube|whatsapp|telegram|threads)/i
const EMAIL_HOSTS = /(mail\.|gmail|outlook|webmail|yahoo\.mail)/i

export type Channel = 'campaign' | 'search' | 'social' | 'email' | 'referral' | 'direct'

/**
 * Which bucket did this visit come from.
 *
 * A UTM medium always wins — if the owner tagged a link, respect their label
 * over anything we could infer. `selfHost` prevents a visitor clicking from
 * the site's own /menu page to /about being logged as a "referral".
 */
export function classifyChannel(input: {
  referrerHost?: string | null
  utmMedium?: string | null
  utmSource?: string | null
  selfHost?: string | null
}): Channel {
  const med = (input.utmMedium || '').toLowerCase()
  const src = (input.utmSource || '').toLowerCase()
  if (med) {
    if (/cpc|ppc|paid|ads?|display|campaign/.test(med)) return 'campaign'
    if (/social/.test(med)) return 'social'
    if (/email|newsletter/.test(med)) return 'email'
    if (/organic|search/.test(med)) return 'search'
    return 'campaign'
  }
  if (src && !input.referrerHost) return 'campaign'

  const host = (input.referrerHost || '').toLowerCase()
  if (!host) return 'direct'
  if (input.selfHost && host === input.selfHost.toLowerCase()) return 'direct'
  if (SEARCH_HOSTS.test(host)) return 'search'
  if (SOCIAL_HOSTS.test(host)) return 'social'
  if (EMAIL_HOSTS.test(host)) return 'email'
  return 'referral'
}

export const CHANNEL_LABEL_AR: Record<Channel, string> = {
  campaign: 'حملة',
  search: 'بحث',
  social: 'تواصل اجتماعي',
  email: 'بريد',
  referral: 'إحالة',
  direct: 'مباشر',
}

/* ─── paths ──────────────────────────────────────────────────────────────── */

/**
 * Normalise to a leading-slash path with no query, hash, or trailing slash.
 * Historic rows stored "site-slug/menu" in the `slug` column, so we also
 * accept that shape and strip the leading site segment when asked.
 */
export function normalizePath(input: string | null | undefined): string {
  if (!input) return '/'
  let p = input.trim()
  p = p.split('#')[0].split('?')[0]
  if (!p.startsWith('/')) p = '/' + p
  p = p.replace(/\/+/g, '/')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p || '/'
}

/** Turn "myslug/menu" (the legacy recordView shape) into "/menu". */
export function pathFromLegacySlug(slug: string | null | undefined): string {
  if (!slug) return '/'
  const i = slug.indexOf('/')
  return i === -1 ? '/' : normalizePath(slug.slice(i))
}

/* ─── conversion events ──────────────────────────────────────────────────── */

export const EVENT_TYPES = [
  'whatsapp_click',
  'phone_click',
  'email_click',
  'booking_click',
  'map_click',
  'order_click',
  'social_click',
  'form_submit',
  'outbound_click',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export function isEventType(v: unknown): v is EventType {
  return typeof v === 'string' && (EVENT_TYPES as readonly string[]).includes(v)
}

export const EVENT_LABEL_AR: Record<EventType, string> = {
  whatsapp_click: 'نقرات واتساب',
  phone_click: 'اتصال هاتفي',
  email_click: 'مراسلة بالبريد',
  booking_click: 'طلب حجز',
  map_click: 'فتح الخريطة',
  order_click: 'طلب / شراء',
  social_click: 'حسابات التواصل',
  form_submit: 'إرسال نموذج',
  outbound_click: 'رابط خارجي',
}

/**
 * Classify an outbound link into a business action.
 *
 * This is what lets one delegated click listener cover all eight templates
 * without touching a single template file — every `tel:` / `wa.me` / booking
 * link already in RestaurantPreview, ServicesPreview, WellnessPreview and the
 * rest is captured by URL shape alone.
 */
export function classifyLink(href: string | null | undefined): EventType | null {
  if (!href) return null
  const h = href.trim().toLowerCase()

  if (h.startsWith('tel:')) return 'phone_click'
  if (h.startsWith('mailto:')) return 'email_click'
  if (h.startsWith('sms:')) return 'phone_click'
  if (/(^https?:\/\/)?(api\.)?(wa\.me|whatsapp\.com)/.test(h)) return 'whatsapp_click'
  if (/(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google)/.test(h)) return 'map_click'
  if (/(opentable|resy|thefork|calendly|booking|reserve|احجز|حجز)/.test(h)) return 'booking_click'
  if (/(instagram|facebook|tiktok|snapchat|twitter|x\.com|linkedin|youtube|pinterest|threads)\.com/.test(h))
    return 'social_click'
  if (/(checkout|\/cart|\/order|\/shop\/buy|talabat|hungerstation|jahez|deliveroo|ubereats)/.test(h))
    return 'order_click'

  if (/^https?:\/\//.test(h)) return 'outbound_click'
  return null
}

/* ─── countries ──────────────────────────────────────────────────────────── */

/** ISO-3166 alpha-2 → flag emoji via regional indicator symbols. */
export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2 || !/^[a-z]{2}$/i.test(code)) return '🏳️'
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  )
}

/**
 * Arabic country names. Gulf + Levant + North Africa first (the actual
 * audience), then the rest of the common traffic sources. Unknown codes fall
 * back to the raw code rather than inventing a name.
 */
const COUNTRY_AR: Record<string, string> = {
  SA: 'السعودية', AE: 'الإمارات', KW: 'الكويت', QA: 'قطر', BH: 'البحرين', OM: 'عُمان',
  YE: 'اليمن', IQ: 'العراق', JO: 'الأردن', LB: 'لبنان', SY: 'سوريا', PS: 'فلسطين',
  EG: 'مصر', SD: 'السودان', LY: 'ليبيا', TN: 'تونس', DZ: 'الجزائر', MA: 'المغرب',
  MR: 'موريتانيا', SO: 'الصومال', DJ: 'جيبوتي', KM: 'جزر القمر',
  TR: 'تركيا', IR: 'إيران', PK: 'باكستان', IN: 'الهند', BD: 'بنغلاديش', ID: 'إندونيسيا',
  MY: 'ماليزيا', PH: 'الفلبين', CN: 'الصين', JP: 'اليابان', KR: 'كوريا الجنوبية',
  US: 'الولايات المتحدة', CA: 'كندا', MX: 'المكسيك', BR: 'البرازيل',
  GB: 'المملكة المتحدة', IE: 'أيرلندا', FR: 'فرنسا', DE: 'ألمانيا', NL: 'هولندا',
  BE: 'بلجيكا', ES: 'إسبانيا', PT: 'البرتغال', IT: 'إيطاليا', CH: 'سويسرا',
  AT: 'النمسا', SE: 'السويد', NO: 'النرويج', DK: 'الدنمارك', FI: 'فنلندا',
  PL: 'بولندا', RU: 'روسيا', UA: 'أوكرانيا', RO: 'رومانيا', GR: 'اليونان',
  AU: 'أستراليا', NZ: 'نيوزيلندا', ZA: 'جنوب أفريقيا', NG: 'نيجيريا', KE: 'كينيا',
  ET: 'إثيوبيا', GH: 'غانا', TZ: 'تنزانيا', SG: 'سنغافورة', TH: 'تايلاند',
  VN: 'فيتنام', IL: 'إسرائيل', CY: 'قبرص', AZ: 'أذربيجان', KZ: 'كازاخستان',
}

export function countryNameAr(code: string | null | undefined): string {
  if (!code) return 'غير معروف'
  const c = code.toUpperCase()
  if (c === 'UNKNOWN') return 'غير معروف'
  return COUNTRY_AR[c] || c
}

export const DEVICE_LABEL_AR: Record<string, string> = {
  Mobile: 'جوال',
  Tablet: 'لوحي',
  Desktop: 'حاسوب',
  Unknown: 'غير معروف',
}

export function deviceLabelAr(d: string): string {
  return DEVICE_LABEL_AR[d] || d
}

/* ─── date ranges ────────────────────────────────────────────────────────── */

export type RangeKey = '24h' | '7d' | '30d' | '90d' | '12mo' | 'custom'

export const RANGE_LABEL_AR: Record<RangeKey, string> = {
  '24h': 'آخر 24 ساعة',
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يومًا',
  '90d': 'آخر 90 يومًا',
  '12mo': 'آخر 12 شهرًا',
  custom: 'مدة مخصصة',
}

const RANGE_DAYS: Record<Exclude<RangeKey, 'custom' | '24h'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12mo': 365,
}

/**
 * Resolve a range key into an absolute window plus the immediately preceding
 * window of the same length, so every number on the page can carry a delta.
 */
export function resolveRange(
  key: RangeKey,
  now: Date = new Date(),
  custom?: { from?: string | null; to?: string | null },
): { from: Date; to: Date; prevFrom: Date; prevTo: Date; days: number } {
  let from: Date
  const to = new Date(now)

  if (key === 'custom' && custom?.from) {
    from = new Date(custom.from)
    if (custom.to) to.setTime(new Date(custom.to).getTime())
  } else if (key === '24h') {
    from = new Date(now.getTime() - 24 * 3600_000)
  } else {
    const days = RANGE_DAYS[(key as Exclude<RangeKey, 'custom' | '24h'>) ?? '30d'] ?? 30
    from = new Date(now.getTime() - days * 24 * 3600_000)
  }

  if (!(from instanceof Date) || isNaN(from.getTime())) {
    from = new Date(now.getTime() - 30 * 24 * 3600_000)
  }

  const span = Math.max(60_000, to.getTime() - from.getTime())
  return {
    from,
    to,
    prevFrom: new Date(from.getTime() - span),
    prevTo: new Date(from.getTime()),
    days: Math.max(1, Math.round(span / 86_400_000)),
  }
}

/**
 * Percent change vs the previous period.
 * Returns null (not 0, not Infinity) when there's no baseline — the UI shows
 * "—" rather than a meaningless "+100%".
 */
export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/* ─── formatting ─────────────────────────────────────────────────────────── */

/** ms → "٣ د ٢٠ ث" style duration, Arabic-friendly and compact. */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 1000) return '0 ث'
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m === 0) return `${s} ث`
  if (m < 60) return s === 0 ? `${m} د` : `${m} د ${s} ث`
  const h = Math.floor(m / 60)
  return `${h} س ${m % 60} د`
}

export function formatPct(n: number | null | undefined, digits = 0): string {
  if (n == null || !isFinite(n)) return '—'
  return `${n.toFixed(digits)}%`
}

/** Sum of a numeric field — used all over the read path. */
export function sumBy<T>(rows: T[], pick: (r: T) => number): number {
  return rows.reduce((s, r) => s + (pick(r) || 0), 0)
}
