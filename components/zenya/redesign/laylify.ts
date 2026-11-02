/**
 * laylify(): an existing stylesheet moved onto the «ليل» palette and type,
 * without editing the source. See layl.tsx for what it is for.
 *
 * Its own module, with no imports, because client components use it too: the
 * generator wizards (components/zenya/build/WizardShell.tsx) and the auth
 * cards draw their stylesheets in the browser, and importing layl.tsx there
 * would pull the whole page frame into the client bundle.
 *
 * The result only works inside a «ليل» root (.rd): every selector is raised
 * by `.rd `, and every colour lands on a variable that root defines.
 */

const SCALE = 1.16

function alpha(a: string) { return parseFloat(a) }

/** The old palette, mapped onto the «ليل» tokens. Both modes follow, because
 *  every value lands on a variable the theme button already switches. */
function recolour(css: string): string {
  return css
    .replace(/rgba\(\s*(?:0\s*,\s*0\s*,\s*0|17\s*,\s*17\s*,\s*17)\s*,\s*([0-9.]+)\s*\)/g, (_, a) => (alpha(a) < 0.1 ? 'var(--line)' : 'var(--line2)'))
    .replace(/rgba\(\s*(?:250\s*,\s*250\s*,\s*250|255\s*,\s*255\s*,\s*255)\s*,\s*([0-9.]+)\s*\)/g, (_, a) => `color-mix(in srgb,var(--bg) ${Math.round(alpha(a) * 100)}%,transparent)`)
    .replace(/rgba\(\s*(?:94\s*,\s*106\s*,\s*210|113\s*,\s*112\s*,\s*255|99\s*,\s*102\s*,\s*241|52\s*,\s*60\s*,\s*150)\s*,/g, 'rgba(226,83,42,')
    .replace(/rgba\(\s*21\s*,\s*128\s*,\s*61\s*,/g, 'rgba(76,179,122,')
    .replace(/rgba\(\s*180\s*,\s*83\s*,\s*9\s*,/g, 'rgba(232,162,90,')
    .replace(/#(?:5e6ad2|7170ff|6366f1|5a66cf|4e5ac0)\b/gi, 'var(--acc)')
    .replace(/#(?:4f5ab8|97a0ee)\b/gi, 'var(--acc-ink)')
    .replace(/#(?:15803d|27a644)\b/gi, 'var(--ok)')
    .replace(/#b45309\b/gi, 'var(--warn)')
    .replace(/(background(?:-color)?\s*:\s*)#(?:fff|ffffff)\b/gi, '$1var(--card)')
    .replace(/#fafafa\b/gi, 'var(--bg)')
    .replace(/#(?:171717|111111|000000|000)\b/gi, 'var(--ink)')
    .replace(/#(?:f4f4f6|f2f2f5|f7f4ed|f7f7f9|f0f0f3|eeeef3)\b/gi, 'var(--card2)')
    .replace(/#(?:b91c1c|dc2626)\b/gi, 'var(--bad)')
    .replace(/rgba\(\s*185\s*,\s*28\s*,\s*28\s*,/g, 'rgba(226,83,42,')
    .replace(/#(?:56565a|66666e|6b6b73|666666|666)\b/gi, 'var(--mut)')
    .replace(/#(?:a8a8b2|7c7c88|86868e|9a9aa2)\b/gi, 'var(--mut2)')
    .replace(/#(?:131316|1c1c1c|191920|2a2a31)\b/gi, 'var(--bg2)')
}

/** Markazi and Thmanyah set smaller than Tajawal at the same size. */
function resize(css: string): string {
  return css.replace(/(font-size\s*:\s*)([^;}]+)/g, (_, k: string, v: string) =>
    k + v.replace(/([0-9.]+)(px|rem)\b/g, (_m, n: string, u: string) => String(+(parseFloat(n) * SCALE).toFixed(2)) + u))
}

function splitTop(prelude: string): string[] {
  const out: string[] = []
  let depth = 0, from = 0
  for (let i = 0; i < prelude.length; i++) {
    const c = prelude[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 0) { out.push(prelude.slice(from, i)); from = i + 1 }
  }
  out.push(prelude.slice(from))
  return out
}

function raise(prelude: string): string {
  return splitTop(prelude).map((sel) => {
    const s = sel.trim()
    if (!s || /^(html|:root|body)\b/.test(s)) return s
    if (s.startsWith(':where(.zy-js)')) return s.replace(/^:where\(\.zy-js\)\s*/, ':where(.zy-js) .rd ')
    return '.rd ' + s
  }).join(', ')
}

/** Every selector one class stronger (.rd), so `.rd h2 { margin: 0 }` in the
 *  frame's reset no longer beats a page's `.zx-h2 { margin: … }`. */
function scope(css: string): string {
  let out = ''
  let i = 0
  const n = css.length
  while (i < n) {
    const open = css.indexOf('{', i)
    if (open < 0) { out += css.slice(i); break }
    let depth = 1
    let j = open + 1
    while (j < n && depth) { const c = css[j]; if (c === '{') depth++; else if (c === '}') depth--; j++ }
    const prelude = css.slice(i, open)
    const body = css.slice(open + 1, j - 1)
    const p = prelude.trim()
    if (p.startsWith('@media') || p.startsWith('@supports')) out += prelude + '{' + scope(body) + '}'
    else if (p.startsWith('@')) out += prelude + '{' + body + '}'
    else out += raise(prelude) + '{' + body + '}'
    i = j
  }
  return out
}

export function laylify(css: string): string {
  return scope(resize(recolour(css.replace(/\/\*[\s\S]*?\*\//g, ''))))
}

