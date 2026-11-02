/**
 * «ليل» for the rest of the public site.
 *
 * Home, pricing, templates, contact and login were drawn in style 11 one by
 * one (s11.tsx). The other pages (features, the comparisons, each template's
 * page, FAQ, about, the five legal documents, checkout and the review page)
 * keep their own content, markup and behaviour, and wear the same night:
 *
 *  - LaylFrame is the «ليل» page around them: the header pill, the warm light
 *    at the top, an optional large faint word behind the opening, and the
 *    footer with the wordmark rising out of it.
 *  - laylify() takes a page's existing stylesheet and moves it onto the «ليل»
 *    palette and type: the old violet becomes the paprika, the black hairlines
 *    become the night's own lines, the sizes grow to suit Thmanyah / Markazi,
 *    and every selector is raised one step so the frame's reset does not eat
 *    the page's margins. The source stylesheets are not edited.
 *  - LAYL_CSS is what a palette swap cannot do: the opening centred under
 *    the light, the headings in the display face, the marked word in orange
 *    instead of underlined, the questions and the closing band as glass.
 *
 * Nothing on these pages is deleted. Draft notes, English sections and every
 * line of copy stay where they were.
 */
import type { ReactNode } from 'react'
import { Root, Header } from './base'
import { CSS as S1_CSS } from './s1'
import { S11_CSS, Footer, Sky } from './s11'
import S11Session from './S11Session'
import { dashFont } from '@/components/app/dash-font'
import { MARKETING_CSS } from '../chrome/marketing'
import { PARTS_CSS } from '../chrome/parts-css'

/* ---- laylify ------------------------------------------------------------ */

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
    .replace(/#(?:f4f4f6|f2f2f5|f7f4ed)\b/gi, 'var(--card2)')
    .replace(/#(?:56565a|66666e|6b6b73|666666|666)\b/gi, 'var(--mut)')
    .replace(/#(?:a8a8b2|7c7c88)\b/gi, 'var(--mut2)')
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

/* ---- what a palette swap cannot do --------------------------------------- */

export const LAYL_CSS = `
.rd.ly{position:relative;--warn:#E8A25A}
.rd.ly[data-mode="light"]{--warn:#9A5208}
.ly-top{position:absolute;inset:0 0 auto;height:min(100svh,920px);pointer-events:none;z-index:0}
.ly-word{position:absolute;inset-inline:0;top:84px;text-align:center;font-family:var(--f-head);font-weight:800;font-size:clamp(92px,22vw,300px);line-height:1;color:var(--ink);opacity:.06;white-space:nowrap}
.rd[data-mode="light"] .ly-word{opacity:.07}

/* the old pages' roots, sat on the night */
.rd.ly .ly-main{position:relative;z-index:1;min-height:0;padding:clamp(20px,4vw,48px) var(--gut) 0;background:none;font-family:var(--f-ui);font-size:18px;line-height:1.75;color:var(--ink);letter-spacing:0}
.rd.ly .ly-main::before{display:none}
.rd.ly .ly-main [class*="__className"]{font-family:inherit}
.rd.ly .ly-main,.rd.ly .ly-main *{overflow-wrap:anywhere}
.rd.ly .ly-main :where(.zl-flex,.zl-grid)>*{min-width:0}
.rd.ly .zl-a11y,.rd.ly .zx-a11y{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.rd.ly .zx-root,.rd.ly .zl-root,.rd.ly .zr-root{
  --card:inherit;--ground:var(--bg);--obsidian:var(--ink);--stone:var(--mut);--stone-2:var(--mut);--ghost:var(--mut);
  --violet:var(--acc);--violet-ink:var(--acc-ink);--violet-lift:var(--acc-ink);--field:var(--card2);--onyx:var(--bg2);
  --ease-out:var(--out);--r-panel:28px;--r-card:22px;--r-control:999px}
.rd.ly .ly-main :is(h1,h2,h3,h4){font-family:var(--f-head);font-weight:700;letter-spacing:0}
.rd.ly .ly-main :where(a,button,summary,input,textarea):focus-visible{outline:2px solid var(--acc);outline-offset:3px}

/* a wider reading column: the night's type is larger */
.rd.ly .zx-wrap{max-width:var(--max);grid-template-columns:[full-start] minmax(0,1fr) [main-start] min(100%,44rem) [main-end] minmax(0,1fr) [full-end]}

/* the opening: centred under the light, like pricing */
.rd.ly .ly-main>.zx-wrap:has(>.zx-open)>.zx-crumbs{grid-column:full-start/full-end;justify-self:center}
.rd.ly .ly-main>.zx-wrap:has(>.zx-open)>.zx-crumbs ol{justify-content:center}
.rd.ly .ly-main>:is(.zx-wrap,.zl-wrap,.zr-wrap)>:is(.zx-open,.zl-open,.zr-open){grid-column:full-start/full-end;display:grid;justify-items:center;text-align:center;
  padding-top:clamp(24px,5vw,64px);padding-bottom:clamp(44px,7vw,88px)}
.rd.ly .ly-main>:is(.zx-wrap,.zl-wrap,.zr-wrap)>:is(.zx-open,.zl-open,.zr-open) :is(.zx-lede,.zl-lede,.zr-lede){max-width:40ch;margin-inline:auto}
.rd.ly .ly-main>:is(.zx-wrap,.zl-wrap,.zr-wrap)>:is(.zx-open,.zl-open,.zr-open) .zx-acts{justify-content:center}
.rd.ly .ly-main :is(.zx-h1,.zl-h1,.zr-h1){font-size:clamp(44px,7vw,92px);line-height:1.12;max-width:21ch;text-wrap:balance;color:var(--ink)}
.rd.ly .ly-main .zx-detail .zx-h1{font-size:clamp(38px,4.6vw,62px);max-width:none}
.rd.ly .ly-main :is(.zx-lede,.zl-lede,.zr-lede){font-size:clamp(19px,1.8vw,22px);line-height:1.75;color:var(--mut)}
.rd.ly .ly-main :is(.zx-eyebrow,.zr-eyebrow,.zl-stamp){font-size:16.5px;font-weight:500;color:var(--ink2)}
.rd.ly .ly-main :is(.zx-eyebrow-dot,.zr-eyebrow-dot,.zl-stamp-dot){width:8px;height:8px;border-radius:1px;transform:rotate(45deg);background:var(--acc)}
.rd.ly .ly-main :is(.zx-h1-mark,.zr-h1-mark,.gradient-text){color:var(--acc-ink);-webkit-text-fill-color:currentColor;white-space:normal;background:none}
.rd.ly .ly-main :is(.zx-h1-mark,.zr-h1-mark,.gradient-text)::after{display:none}

/* section type */
.rd.ly .ly-main :is(.zx-h2,.zx-band-h,.zr-h2){font-size:clamp(30px,4.2vw,46px);line-height:1.22;color:var(--ink)}
.rd.ly .ly-main .zx-p{font-size:clamp(18px,1.7vw,19.5px)}

/* actions: the night's pills */
.rd.ly .ly-main .zx-act-1{min-height:48px;padding:0 24px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:17px;font-weight:600;box-shadow:none}
.rd.ly .ly-main .zx-act-2{min-height:48px;padding:0 22px;border-radius:999px;background:var(--glass);color:var(--ink);font-size:17px;box-shadow:0 0 0 1px var(--glass-line);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
.rd.ly .ly-main .sb{border-radius:999px;font-size:17px;padding:.3rem 1.5rem}
.rd.ly .ly-main .sb:is([data-variant="key"],[data-variant="onyx"],[data-variant="violet"]){background:var(--ink);color:var(--bg);box-shadow:none}
.rd.ly .ly-main .sb[data-variant="quiet"]{color:var(--ink2);background:transparent;box-shadow:inset 0 0 0 1px var(--line2)}

/* questions: glass, as on the home page */
.rd.ly .ly-main .zx-q{border:1px solid var(--glass-line);background:var(--glass);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-radius:20px;padding:0 clamp(16px,2.4vw,22px);margin-top:10px}
.rd.ly .ly-main .zx-q:last-child{border-bottom:1px solid var(--glass-line)}
.rd.ly .ly-main .zx-q .zx-qsum{font-family:var(--f-ui);font-weight:600;font-size:clamp(18.5px,1.8vw,20px);color:var(--ink)}
.rd.ly .ly-main .zx-q[open] .zx-qsum{color:var(--ink)}
.rd.ly .ly-main .zx-q .zx-qa{color:var(--mut)}

/* the closing band: a glass panel with the light under it */
.rd.ly .ly-main :is(.zx-band,.zx-close){grid-column:full-start/full-end;position:relative;isolation:isolate;overflow:hidden;display:grid;justify-items:center;text-align:center;
  margin-top:clamp(56px,8vw,112px);padding:clamp(40px,6vw,76px) clamp(20px,5vw,64px);border:1px solid var(--glass-line);border-radius:32px;
  background:var(--glass);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
.rd.ly .ly-main :is(.zx-band,.zx-close)::before{content:"";position:absolute;z-index:-1;left:50%;bottom:-70%;width:min(900px,120%);height:140%;transform:translateX(-50%);
  background:radial-gradient(closest-side,rgba(226,83,42,.42),rgba(226,83,42,0));filter:blur(30px);pointer-events:none}
.rd[data-mode="light"].ly .ly-main :is(.zx-band,.zx-close)::before{opacity:.5}
.rd.ly .ly-main .zx-band .zx-band-p{max-width:44ch;color:var(--mut);font-size:clamp(18px,1.7vw,20px)}
.rd.ly .ly-main :is(.zx-band,.zx-close) .zx-acts{justify-content:center}
.rd.ly .ly-main .zx-close .zx-p{color:var(--mut)}

/* cards read as the night's cards */
.rd.ly .ly-main :is(.zx-choose-card,.zx-note,.zk-sum,.zk-door,.zk-state,.zr-card){border-radius:24px}

/* the draft notes stay; they just sit quieter, with room before the footer */
.rd.ly .ly-main :is(.zx-foot-note,.zl-foot-note){margin-top:clamp(40px,6vw,72px);color:var(--mut2);font-size:16px}
.rd.ly .ly-main+.s1-foot{margin-top:clamp(40px,6vw,80px)}
/* forms: a pill field is right, a pill box of text is not */
.rd.ly .ly-main textarea{border-radius:22px}

/* the legal documents: a wider column for the larger type, and tables that
   keep a name on one line (the wrapper scrolls, the page never does) */
.rd.ly .zl-wrap{width:min(100%,1120px)}
@media (min-width:1024px){.rd.ly .zl-body{grid-template-columns:minmax(0,46rem) minmax(0,1fr)}}
.rd.ly .ly-main .zl-tw :is(th,td),.rd.ly .ly-main .zl-tw :is(th,td) *{overflow-wrap:normal;word-break:normal}
@media (min-width:768px){.rd.ly .ly-main .zl-tw table{min-width:680px}}
.rd.ly .ly-main .zl-foot-note{max-width:46rem}
`

/* The arrival. The root layout's boot does this on a full load, and this
   copy covers a page reached by a client-side link (ScriptRevive runs it).
   Threshold 0, not a ratio: a legal document is 7000px tall, and 8% of it
   never fits on a phone's first screen, so it waited for a scroll. */
const REVEAL = `(function(){var root=document.currentScript.parentElement;if(!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.setAttribute('data-in','true');io.unobserve(e.target)})},{rootMargin:'0px 0px -8% 0px',threshold:0});
root.querySelectorAll('[data-reveal]:not([data-in])').forEach(function(el){io.observe(el)})})()`

/** The «ليل» page: header, the light, optional faint word, the page, footer. */
export function LaylFrame({ children, css = '', word }: { children: ReactNode; css?: string; word?: string }) {
  return (
    <Root id={'s1 s11 ly ' + dashFont.variable} mode="dark" css={S1_CSS + S11_CSS + css + LAYL_CSS}>
      <Header dots /><S11Session />
      <div className="ly-top" aria-hidden>
        <Sky />
        {word ? <div className="ly-word">{word}</div> : null}
      </div>
      {children}
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
    </Root>
  )
}

/**
 * The drop-in for components/zenya/chrome/Shell on a public page: same
 * props, same .zx-root and .zx-wrap inside, so the page's parts render as
 * they did, in the night.
 */
export default function LaylShell({ children, css = '', word }: { children: ReactNode; css?: string; word?: string }) {
  return (
    <LaylFrame css={laylify(MARKETING_CSS + PARTS_CSS + css)} word={word}>
      <main className="zx-root ly-main" dir="rtl">
        <div className="zx-wrap">{children}</div>
      </main>
    </LaylFrame>
  )
}
