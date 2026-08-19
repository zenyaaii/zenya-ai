/**
 * ISO 3166-1 alpha-2 → a single representative point on the globe + Arabic name.
 *
 * Zenya's analytics only stores a visitor's **country** (Vercel's
 * `x-vercel-ip-country`), never a precise city or coordinate — so the live-users
 * globe places one dot per active *country*, not per person. That is deliberate:
 * it is real (a country only lights up when it has real live/recent visitors) and
 * privacy-preserving (no individual is ever locatable on the map).
 *
 * Coordinates are an approximate population/centroid point, chosen so the dot
 * lands somewhere sensible inside the country. Precision beyond "the right place
 * on the sphere" is neither needed nor wanted.
 */
export type Centroid = { lat: number; lng: number; ar: string }

export const COUNTRY_CENTROIDS: Record<string, Centroid> = {
  // ── Arab world / MENA (Zenya's core) ──
  EG: { lat: 26.8, lng: 30.8, ar: 'مصر' },
  SA: { lat: 24.0, lng: 45.0, ar: 'السعودية' },
  AE: { lat: 24.3, lng: 54.3, ar: 'الإمارات' },
  QA: { lat: 25.3, lng: 51.2, ar: 'قطر' },
  KW: { lat: 29.3, lng: 47.6, ar: 'الكويت' },
  BH: { lat: 26.1, lng: 50.5, ar: 'البحرين' },
  OM: { lat: 21.5, lng: 55.9, ar: 'عُمان' },
  JO: { lat: 31.2, lng: 36.5, ar: 'الأردن' },
  LB: { lat: 33.9, lng: 35.9, ar: 'لبنان' },
  PS: { lat: 31.9, lng: 35.2, ar: 'فلسطين' },
  SY: { lat: 35.0, lng: 38.0, ar: 'سوريا' },
  IQ: { lat: 33.2, lng: 43.7, ar: 'العراق' },
  YE: { lat: 15.6, lng: 47.6, ar: 'اليمن' },
  MA: { lat: 31.8, lng: -7.1, ar: 'المغرب' },
  DZ: { lat: 28.0, lng: 2.6, ar: 'الجزائر' },
  TN: { lat: 34.1, lng: 9.6, ar: 'تونس' },
  LY: { lat: 27.0, lng: 18.0, ar: 'ليبيا' },
  SD: { lat: 15.0, lng: 30.2, ar: 'السودان' },
  MR: { lat: 20.3, lng: -10.9, ar: 'موريتانيا' },
  SO: { lat: 5.2, lng: 46.2, ar: 'الصومال' },
  DJ: { lat: 11.8, lng: 42.6, ar: 'جيبوتي' },
  KM: { lat: -11.6, lng: 43.3, ar: 'جزر القمر' },

  // ── Wider MENA / neighbours ──
  TR: { lat: 39.0, lng: 35.2, ar: 'تركيا' },
  IR: { lat: 32.4, lng: 53.7, ar: 'إيران' },
  IL: { lat: 31.5, lng: 34.9, ar: 'إسرائيل' },

  // ── Europe ──
  GB: { lat: 52.4, lng: -1.5, ar: 'المملكة المتحدة' },
  IE: { lat: 53.2, lng: -8.0, ar: 'أيرلندا' },
  FR: { lat: 46.6, lng: 2.4, ar: 'فرنسا' },
  DE: { lat: 51.2, lng: 10.4, ar: 'ألمانيا' },
  NL: { lat: 52.2, lng: 5.3, ar: 'هولندا' },
  BE: { lat: 50.6, lng: 4.7, ar: 'بلجيكا' },
  ES: { lat: 40.2, lng: -3.6, ar: 'إسبانيا' },
  PT: { lat: 39.6, lng: -8.0, ar: 'البرتغال' },
  IT: { lat: 42.8, lng: 12.6, ar: 'إيطاليا' },
  CH: { lat: 46.8, lng: 8.2, ar: 'سويسرا' },
  AT: { lat: 47.6, lng: 14.1, ar: 'النمسا' },
  SE: { lat: 62.2, lng: 15.3, ar: 'السويد' },
  NO: { lat: 64.5, lng: 12.0, ar: 'النرويج' },
  DK: { lat: 56.0, lng: 9.5, ar: 'الدنمارك' },
  FI: { lat: 63.2, lng: 25.8, ar: 'فنلندا' },
  PL: { lat: 52.1, lng: 19.4, ar: 'بولندا' },
  CZ: { lat: 49.8, lng: 15.5, ar: 'التشيك' },
  GR: { lat: 39.1, lng: 22.4, ar: 'اليونان' },
  RO: { lat: 45.9, lng: 25.0, ar: 'رومانيا' },
  UA: { lat: 48.4, lng: 31.2, ar: 'أوكرانيا' },
  RU: { lat: 61.5, lng: 90.0, ar: 'روسيا' },

  // ── Americas ──
  US: { lat: 39.8, lng: -98.6, ar: 'الولايات المتحدة' },
  CA: { lat: 56.1, lng: -106.3, ar: 'كندا' },
  MX: { lat: 23.6, lng: -102.6, ar: 'المكسيك' },
  BR: { lat: -14.2, lng: -51.9, ar: 'البرازيل' },
  AR: { lat: -38.4, lng: -63.6, ar: 'الأرجنتين' },
  CL: { lat: -35.7, lng: -71.5, ar: 'تشيلي' },
  CO: { lat: 4.6, lng: -74.3, ar: 'كولومبيا' },

  // ── Asia / Pacific ──
  PK: { lat: 30.4, lng: 69.3, ar: 'باكستان' },
  IN: { lat: 22.4, lng: 79.6, ar: 'الهند' },
  BD: { lat: 23.7, lng: 90.4, ar: 'بنغلاديش' },
  ID: { lat: -2.5, lng: 118.0, ar: 'إندونيسيا' },
  MY: { lat: 4.2, lng: 101.9, ar: 'ماليزيا' },
  SG: { lat: 1.35, lng: 103.8, ar: 'سنغافورة' },
  PH: { lat: 12.9, lng: 121.8, ar: 'الفلبين' },
  TH: { lat: 15.1, lng: 101.0, ar: 'تايلاند' },
  VN: { lat: 16.0, lng: 106.3, ar: 'فيتنام' },
  CN: { lat: 35.9, lng: 104.2, ar: 'الصين' },
  JP: { lat: 36.2, lng: 138.3, ar: 'اليابان' },
  KR: { lat: 36.5, lng: 127.9, ar: 'كوريا الجنوبية' },
  AU: { lat: -25.3, lng: 133.8, ar: 'أستراليا' },
  NZ: { lat: -41.8, lng: 172.0, ar: 'نيوزيلندا' },

  // ── Sub-Saharan Africa ──
  NG: { lat: 9.1, lng: 8.7, ar: 'نيجيريا' },
  GH: { lat: 7.9, lng: -1.0, ar: 'غانا' },
  KE: { lat: 0.2, lng: 37.9, ar: 'كينيا' },
  ET: { lat: 9.1, lng: 40.5, ar: 'إثيوبيا' },
  ZA: { lat: -30.6, lng: 22.9, ar: 'جنوب أفريقيا' },
  SN: { lat: 14.5, lng: -14.5, ar: 'السنغال' },
  TZ: { lat: -6.4, lng: 34.9, ar: 'تنزانيا' },
  UG: { lat: 1.4, lng: 32.3, ar: 'أوغندا' },
}

export function centroidFor(code?: string | null): Centroid | null {
  if (!code) return null
  return COUNTRY_CENTROIDS[code.toUpperCase()] ?? null
}
