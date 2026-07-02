/**
 * Single source of truth for legal/contact details used across every
 * legal page (Privacy, Terms, Cookies, Refund, Subprocessors, DPA).
 *
 * 🔴 BEFORE PUBLIC LAUNCH — replace every {{PLACEHOLDER}} with real values:
 *   1. LEGAL_NAME       — Your full legal name as on KvK (sole trader)
 *   2. KVK_NUMBER       — Your 8-digit Dutch Chamber of Commerce number
 *   3. ADDRESS_LINE_1   — Registered business address (a virtual office
 *                          / KvK bezoekadres is fine; don't use your home
 *                          address publicly)
 *   4. CITY / POSTAL    — Postcode + city
 *   5. VAT_NUMBER       — Once your BTW-nummer arrives (NL + 9 digits + B + 2)
 *
 * Update `LAST_UPDATED` whenever any legal page changes (regulatory hygiene).
 */
export const COMPANY = {
  // Brand
  BRAND_NAME: 'زينيا',
  PRODUCT_NAME: 'زينيا AI',
  TAGLINE: 'مولّد المواقع بالذكاء الاصطناعي لكل نشاط تجاري',

  // Legal entity — Dutch eenmanszaak operating under the trade name "Musannef".
  // For an eenmanszaak the legal entity IS the natural person; the owner's
  // identity is on file with the KvK and publicly retrievable by KvK number.
  LEGAL_NAME: 'Musannef',
  TRADE_NAME: 'Musannef',
  ENTITY_TYPE: 'مؤسسة فردية هولندية (eenmanszaak)',
  OWNER_DISCLOSURE: 'الشخص الطبيعي الذي يدير Musannef يمكن التعرّف عليه عبر السجل العام للغرفة التجارية الهولندية (KvK) باستخدام رقم KvK أدناه. المالك هو المتحكّم في البيانات لأغراض اللائحة العامة لحماية البيانات (GDPR).',
  COUNTRY: 'هولندا',
  JURISDICTION: 'هولندا',
  GOVERNING_LAW: 'القانون الهولندي',
  COMPETENT_COURT: 'محاكم أمستردام في هولندا',

  // Registrations
  KVK_NUMBER: '42070030',
  VAT_NUMBER: 'قيد التسجيل (ضريبة القيمة المضافة BTW)',       // Update once BTW arrives

  // Address — Musannef's registered KvK address. Only the postcode is
  // disclosed publicly; the full street is available via the KvK public
  // register using the KvK number, or on written request to privacy@.
  ADDRESS_LINE_1: '',
  ADDRESS_LINE_2: '',
  POSTAL_CODE: '7776 BA',
  CITY: '',

  // Contact — using personal Outlook mailbox until a real support@ mailbox is set up.
  SUPPORT_EMAIL: 'zenyaai@outlook.com',
  PRIVACY_EMAIL: 'zenyaai@outlook.com',
  LEGAL_EMAIL: 'zenyaai@outlook.com',
  DPO_EMAIL: 'zenyaai@outlook.com',

  // Sites
  WEBSITE_URL: 'https://zenyaai.co',
  APP_URL: 'https://zenyaai.co',

  // Pricing
  PRICE_DISPLAY: '9.99 دولار دفعة واحدة (9.99 يورو في أوروبا)',
  TRIAL_DAYS: 0,
  CURRENCY: 'USD',

  // Maintenance
  LAST_UPDATED: '2026-07-02',
} as const

export const formatAddress = () => {
  const all: string[] = [
    String(COMPANY.ADDRESS_LINE_1),
    String(COMPANY.ADDRESS_LINE_2),
  ]
  const street = all.filter((p) => p && !p.includes('{{')).join(', ')
  const cityLine = `${COMPANY.POSTAL_CODE} ${COMPANY.CITY}`.trim()
  const parts: string[] = [street, cityLine, String(COMPANY.COUNTRY)].filter(
    (p) => p.length > 0
  )
  return parts.join(', ')
}
