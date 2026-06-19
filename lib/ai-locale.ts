/**
 * Arabic-output contract for every AI generation route.
 *
 * Zenya is an Arabic-first product: every website it generates must ship in
 * Modern Standard Arabic (فصحى) and read as if written by a native Arab
 * copywriter — never translated-sounding. This single directive is appended to
 * the *system* prompt of each generate-* route so the contract lives in one
 * place and stays consistent across templates.
 *
 * Keep it in English: it is an instruction to the model about HOW to write, and
 * models follow meta-instructions about output language reliably regardless of
 * the instruction's own language. The IMPORTANT part is the explicit, repeated
 * "write the VALUES in Arabic" so JSON keys stay English (the app reads them)
 * while every human-facing string is Arabic.
 */
export const ARABIC_OUTPUT_DIRECTIVE = `
LANGUAGE CONTRACT — THIS OVERRIDES EVERYTHING ELSE:
- Write EVERY human-facing string value in Modern Standard Arabic (العربية الفصحى). This includes headlines, subheadlines, body copy, CTAs, button labels, testimonials, FAQ questions AND answers, feature titles, SEO titles/descriptions, customer names, and city/location names.
- JSON KEYS stay exactly as specified in English (the application reads them). Translate only the VALUES.
- The copy must sound native — written by a fluent Arab copywriter, not translated from English. Use natural Arabic marketing voice, correct grammar, and proper Arabic punctuation (، ؛ ؟ «»).
- Use Western Arabic numerals (0-9) for prices, stats, and counts — they are standard on modern Arabic e-commerce.
- Testimonials: use real Arabic names (e.g. أحمد، فاطمة، خالد، نورة، يوسف) and Arab cities/countries (e.g. الرياض، السعودية · دبي، الإمارات · القاهرة، مصر · عمّان، الأردن).
- Do NOT mix English words into the Arabic copy unless they are globally recognized brand names. No transliteration of generic English marketing words.
- Avoid translated-English clichés. Write fresh, confident, culturally-natural Arabic.
`.trim()
