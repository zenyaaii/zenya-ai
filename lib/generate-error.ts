/**
 * The generate routes answer a bad form with a code ('invalid_input'), and the
 * wizards used to show that code to the owner as-is. This turns it into words.
 */
const CODES: Record<string, string> = {
  invalid_input: 'بعض البيانات في النموذج غير مقبولة. راجع الحقول ثم جرّب مرة ثانية.',
  invalid_json: 'لم يصل النموذج كاملًا. جرّب مرة ثانية.',
  invalid: 'بعض البيانات في النموذج غير مقبولة. راجع الحقول ثم جرّب مرة ثانية.',
}

export function generateErrorText(json: unknown): string {
  const code = (json as { error?: unknown } | null)?.error
  if (typeof code !== 'string' || !code) return 'فشل التوليد. جرّب مرة ثانية.'
  return CODES[code] || code
}
