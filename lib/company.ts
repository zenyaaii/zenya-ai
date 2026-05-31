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
  BRAND_NAME: 'Zenya',
  PRODUCT_NAME: 'Zenya AI',
  TAGLINE: 'AI website generator for every business',

  // Legal entity — Dutch eenmanszaak operating under the trade name "Musannef".
  // For an eenmanszaak the legal entity IS the natural person; the owner's
  // identity is on file with the KvK and publicly retrievable by KvK number.
  LEGAL_NAME: 'Musannef',
  TRADE_NAME: 'Musannef',
  ENTITY_TYPE: 'Dutch eenmanszaak',
  OWNER_DISCLOSURE: 'The natural person operating Musannef is identifiable via the Dutch Chamber of Commerce (KvK) public register using the KvK number below. The owner is the data controller for purposes of GDPR.',
  COUNTRY: 'The Netherlands',
  JURISDICTION: 'The Netherlands',
  GOVERNING_LAW: 'Dutch law',
  COMPETENT_COURT: 'the courts of Amsterdam, The Netherlands',

  // Registrations
  KVK_NUMBER: '42070030',
  VAT_NUMBER: 'Pending registration (BTW)',       // Update once BTW arrives

  // Address — Musannef's registered business address. Pending values to be
  // supplied by the operator; placeholders fall back to "address pending".
  ADDRESS_LINE_1: '{{ADDRESS_LINE_1}}',
  ADDRESS_LINE_2: '',
  POSTAL_CODE: '{{POSTAL_CODE}}',
  CITY: '{{CITY}}',

  // Contact — using personal Outlook mailbox until a real support@ mailbox is set up.
  SUPPORT_EMAIL: 'zenyaai@outlook.com',
  PRIVACY_EMAIL: 'zenyaai@outlook.com',
  LEGAL_EMAIL: 'zenyaai@outlook.com',
  DPO_EMAIL: 'zenyaai@outlook.com',

  // Sites
  WEBSITE_URL: 'https://zenyaai.co',
  APP_URL: 'https://zenyaai.co',

  // Pricing
  PRICE_DISPLAY: '$4.99 every 2 months',
  TRIAL_DAYS: 14,
  CURRENCY: 'USD',

  // Maintenance
  LAST_UPDATED: '2026-05-31',
} as const

export const formatAddress = () => {
  const parts = [
    COMPANY.ADDRESS_LINE_1,
    COMPANY.ADDRESS_LINE_2,
    `${COMPANY.POSTAL_CODE} ${COMPANY.CITY}`.trim(),
    COMPANY.COUNTRY,
  ].filter((p) => p && !p.includes('{{'))
  return parts.length ? parts.join(', ') : `${COMPANY.COUNTRY} (address pending)`
}
