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

import { laylify } from './laylify'

export { laylify }

/* ---- what a palette swap cannot do --------------------------------------- */

export const LAYL_CSS = `
.rd.ly{position:relative;--warn:#E8A25A;--bad:#F2795E}
.rd.ly[data-mode="light"]{--warn:#9A5208;--bad:#B42318}
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

/* ---- the product: the wizards, /build, the auth cards -------------------- */

/* The product token block (components/app/tokens.ts) re-pointed at the night,
   so tailwind's bg-background / text-muted / border-token and every var() the
   product pages read land on the «ليل» palette in both modes. */
export const LAYL_PRODUCT_CSS = `
.rd.lyp .ly-prod{position:relative;z-index:1;min-height:calc(100svh - 70px);font-family:var(--f-ui);font-size:18px;line-height:1.7;color:var(--ink);letter-spacing:0;
  --ground:var(--bg);--obsidian:var(--ink);--violet:var(--acc);--onyx:var(--bg2);--field:var(--card2);--stone:var(--mut);--stone-2:var(--mut);--ghost:var(--mut2);
  --background:var(--bg);--surface:var(--card);--surface-2:var(--card2);--elevated:var(--card);--card:inherit;--foreground:var(--ink);--muted:var(--mut);--subtle:var(--mut2);
  --border:var(--line2);--border-muted:var(--line);--border-strong:var(--line2);
  --success:var(--ok);--warning:var(--warn);--error:var(--bad);
  --success-fill:color-mix(in srgb,var(--ok) 8%,transparent);--warning-fill:color-mix(in srgb,var(--warn) 12%,transparent);--error-fill:color-mix(in srgb,var(--bad) 10%,transparent);
  --success-ring:color-mix(in srgb,var(--ok) 30%,transparent);--warning-ring:color-mix(in srgb,var(--warn) 30%,transparent);--error-ring:color-mix(in srgb,var(--bad) 30%,transparent);
  --primary:var(--acc);--primary-600:var(--acc-ink);--primary-500:var(--acc);--primary-400:var(--acc);
  --violet-fill:var(--acc-soft);--violet-ring:color-mix(in srgb,var(--acc) 22%,transparent);--violet-ink:var(--acc-ink);--violet-lift:var(--acc-ink);
  --ring-1:0 0 0 1px var(--line2);--ring-2:0 0 0 0 transparent;--shadow-sm:0 0 0 1px var(--line2);
  --shadow-lg:0 0 0 1px var(--line2),var(--shadow);--shadow-xl:0 0 0 1px var(--line2),var(--shadow);
  --ease-out:var(--out);--r-panel:28px;--r-card:22px;--r-control:16px;--on-acc:#FFFBF7}
.rd.lyp .ly-prod [class*="__className"]{font-family:inherit}
.rd.lyp .ly-prod :is(h1,h2,h3){font-family:var(--f-head);font-weight:700;letter-spacing:0}
.rd.lyp .ly-prod :where(a,button,summary,input,textarea,select):focus-visible{outline:2px solid var(--acc);outline-offset:3px}
.rd.lyp .ly-prod :where(input,textarea,select){color:var(--ink)}
.rd.lyp .ly-prod ::placeholder{color:var(--mut2)}

/* the wizard: its own token block, re-pointed; the night shows through */
.rd.lyp .zb-root,.rd.ly .zb-root{--ground:var(--bg);--card:inherit;--obsidian:var(--ink);--stone:var(--mut);--stone-2:var(--mut);--violet:var(--acc);--violet-lift:var(--acc-ink);--onyx:var(--bg2);
  --ease-out:var(--out);--r-panel:28px;--r-card:22px;--r-control:16px;background:none;font-family:var(--f-ui)}
.rd .zb-root::before{display:none}
.rd .zb-root :is(.zb-h1,.zb-h2,.zb-meter-n,.zb-sum-row dd){font-family:var(--f-head);font-weight:700}
.rd .zb-root .zb-h1{font-size:clamp(38px,5.4vw,64px);line-height:1.15;text-wrap:balance}
.rd .zb-root .zb-eyebrow,.rd .zb-root .zb-count{display:inline-flex;align-items:center;gap:10px;color:var(--ink2);font-weight:500}
.rd .zb-root .zb-eyebrow::before,.rd .zb-root .zb-count::before{content:"";width:8px;height:8px;border-radius:1px;transform:rotate(45deg);background:var(--acc)}
.rd .zb-root :is(.zb-card,.zb-meter){background:var(--glass);border:1px solid var(--glass-line);box-shadow:none;-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2)}
.rd .zb-root .zb-in{background:var(--card2);box-shadow:0 0 0 1px var(--line2)}
.rd .zb-root .zb-in:focus{background:var(--card)}
.rd .zb-root :is(.zb-chip[data-on],.zb-step[data-on] .zb-step-n,.zb-preset-on){color:#FFFBF7}
.rd .zb-root :is(.zb-next,.zb-back){border-radius:999px}
.rd .zb-root .zb-handoff{background:var(--card2);border:1px solid var(--line2)}
.rd.lyp .ly-prod .sb,.rd .zb-root .sb{border-radius:999px;font-size:17px;padding:.3rem 1.5rem;box-shadow:none}
.rd.lyp .ly-prod .sb[data-variant="violet"],.rd .zb-root .sb[data-variant="violet"]{background:var(--acc);color:#FFFBF7}
.rd.lyp .ly-prod .sb:is([data-variant="key"],[data-variant="onyx"]){background:var(--ink);color:var(--bg)}
.rd.lyp .ly-prod .sb[data-variant="quiet"]{color:var(--ink2);background:transparent;box-shadow:inset 0 0 0 1px var(--line2)}
@media (prefers-reduced-transparency:reduce){.rd .zb-root :is(.zb-card,.zb-meter){background:var(--card);-webkit-backdrop-filter:none;backdrop-filter:none}}

/* the auth cards (app/(main)/auth/styles.ts) */
.rd .zs-card{background:var(--glass);border:1px solid var(--glass-line);box-shadow:none;-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);border-radius:28px}
.rd .zs-mark{color:var(--ink)}
`

/**
 * The «ليل» page for the product under app/(main): the generator wizards, the
 * Shopify builder, the reset-password and auth-error cards, the hand-over.
 * The header pill and the light, and no footer: a generator flow is a form
 * with somewhere to go next (the reason ProductShell, kept, gave). Each page
 * still renders its own <main>, so this roots a <div> inside the frame.
 */
export function LaylProduct({ children, mode = 'dark' }: { children: ReactNode; mode?: 'dark' | 'light' }) {
  return (
    <Root id={'s1 s11 ly lyp ' + dashFont.variable} mode={mode} css={S1_CSS + S11_CSS + LAYL_CSS + LAYL_PRODUCT_CSS}>
      <Header dots /><S11Session />
      <div className="ly-top" aria-hidden><Sky /></div>
      <div className="zx-root ly-prod" dir="rtl">{children}</div>
      <script dangerouslySetInnerHTML={{ __html: REVEAL }} />
    </Root>
  )
}
