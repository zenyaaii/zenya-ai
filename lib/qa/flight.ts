/**
 * Read a public site's own props back out of its HTML.
 *
 * The public renderer (components/PublicSiteRenderer) is a client component,
 * so Next serialises its props — businessType, content, presetId,
 * colorOverrides… — into the page's flight data (self.__next_f.push). That is
 * exactly what the site was built from, as the visitor's browser receives it.
 * Reading it there means the agent needs no database access and no login: it
 * checks a site the way a stranger opens it.
 */

import type { SiteProps } from './reference'

/** Concatenate every flight chunk in an HTML document. */
export function flightOf(html: string): string {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g
  let m: RegExpExecArray | null
  let out = ''
  while ((m = re.exec(html))) {
    try { out += JSON.parse(m[1]) } catch { /* a chunk that is not a string */ }
  }
  return out
}

/** The balanced JSON object that starts at `start` (which must be a "{"). */
function objectAt(text: string, start: number): string | null {
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) return text.slice(start, i + 1) }
  }
  return null
}

/** Undo the flight encoding of special values ("$undefined", "$$" for a literal "$"). */
function revive(v: any): any {
  if (typeof v === 'string') {
    if (v === '$undefined') return undefined
    if (v.startsWith('$$')) return v.slice(1)
    return v
  }
  if (Array.isArray(v)) return v.map(revive)
  if (v && typeof v === 'object') {
    const o: Record<string, any> = {}
    for (const [k, x] of Object.entries(v)) { const r = revive(x); if (r !== undefined) o[k] = r }
    return o
  }
  return v
}

/** The renderer's props, or null when the page is not a Beynoun customer site. */
export function sitePropsFromHtml(html: string): (SiteProps & { view?: string }) | null {
  const flight = flightOf(html)
  const key = '{"businessType":'
  let i = flight.indexOf(key)
  while (i >= 0) {
    const raw = objectAt(flight, i)
    if (raw) {
      try {
        const o = revive(JSON.parse(raw))
        if (o && typeof o.businessType === 'string' && o.content && typeof o.content === 'object') return o
      } catch { /* keep looking */ }
    }
    i = flight.indexOf(key, i + key.length)
  }
  return null
}
