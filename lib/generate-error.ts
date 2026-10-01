/**
 * The generate routes answer a bad form with a code ('invalid_input'), and the
 * wizards used to show that code to the owner as-is. This turns it into words.
 */
const CODES: Record<string, string> = {
  invalid_input: 'بعض البيانات في النموذج غير مقبولة. راجع الحقول ثم جرّب مرة ثانية.',
  invalid_json: 'لم يصل النموذج كاملًا. جرّب مرة ثانية.',
  invalid: 'بعض البيانات في النموذج غير مقبولة. راجع الحقول ثم جرّب مرة ثانية.',
  ai_failed: 'لم يكتمل التوليد هذه المرة، ولم يُحفظ شيء. بياناتك ما زالت هنا. جرّب مرة ثانية.',
  ai_unavailable: 'التوليد متوقف مؤقتًا من جهتنا. بياناتك محفوظة. جرّب بعد قليل.',
}

export function generateErrorText(json: unknown): string {
  const code = (json as { error?: unknown } | null)?.error
  if (typeof code !== 'string' || !code) return 'فشل التوليد. جرّب مرة ثانية.'
  // An unknown code is a server message in English, not words for the owner.
  return CODES[code] || 'فشل التوليد. جرّب مرة ثانية.'
}
