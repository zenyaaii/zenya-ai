const ARABIC_CHAR = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/
const LATIN_CHAR = /[A-Za-z]/

/** Splits "Dr. Air Conditioning د. التكييف" into its Arabic and Latin
 *  words. Either side is empty when the name is in one language only. */
export function splitBrandName(name: string): { arabic: string; latin: string } {
  const ar: string[] = []
  const la: string[] = []
  for (const w of name.trim().split(/\s+/)) {
    if (ARABIC_CHAR.test(w)) ar.push(w)
    else if (LATIN_CHAR.test(w)) la.push(w)
    else (la.length > ar.length ? la : ar).push(w)
  }
  return { arabic: ar.join(' '), latin: la.join(' ') }
}

/** True when the name has both an Arabic and a Latin part. */
export function isTwoLanguageName(name: string | undefined): boolean {
  const { arabic, latin } = splitBrandName(name || '')
  return !!arabic && !!latin
}
