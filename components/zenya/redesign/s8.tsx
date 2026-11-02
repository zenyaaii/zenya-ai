/**
 * Style 8 — «نواة» (Core). Precision, the way the best software sites do it:
 * a dark room with a grid floor running toward you under a cone of light,
 * thin borders that catch a travelling beam, cards whose edges light under
 * the pointer, a command bar for the dashboard, a real timeline under the
 * editor, a brief that types itself into a site, and a footer whose
 * wordmark stands on a lit horizon.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft, Phone, Browser, Amount } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER, SECTIONS, BRIEF } from './data'

/* where each editor step starts, as a share of each recording's length */
const EDIT_DUR = { d: 33.97, m: 30.17 }

const CSS = `
.s8{interpolate-size:allow-keywords;--grid:rgba(244,239,230,.07);--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
.rd.s8:not([data-mode="dark"]){--grid:rgba(22,18,13,.07)}
.s8 .h{background:color-mix(in srgb,var(--bg) 70%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}
.s8 .h-nav a{font-size:16px;border-radius:8px}
.s8 .h-cta{background:var(--ink);color:var(--bg);border-radius:10px;height:38px;box-shadow:inset 0 -1px 0 rgba(0,0,0,.2)}

.s8-t{font-family:var(--f-head);font-weight:700;line-height:1.12;letter-spacing:0;text-wrap:balance}
.s8-h2{font-size:clamp(34px,4.4vw,60px)}
.s8-sub{color:var(--mut);font-size:clamp(18px,1.5vw,20px);max-width:48ch;text-wrap:pretty}
.s8-sec{position:relative;padding-block:clamp(88px,11vw,150px)}
.s8-hd{display:grid;gap:14px;margin-bottom:clamp(36px,5vw,56px)}
.s8-tag{font-family:var(--mono);font-size:12.5px;letter-spacing:.06em;color:var(--mut);direction:ltr}

/* beam border: a light that runs around an edge */
@property --s8a{syntax:"<angle>";inherits:false;initial-value:0deg}
.s8-beam{position:relative}
.s8-beam::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;z-index:2;
  background:conic-gradient(from var(--s8a),transparent 0 75%,rgba(226,83,42,.9) 85%,#FFD3BF 88%,transparent 92%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  animation:s8spin 6s linear infinite}
@keyframes s8spin{to{--s8a:360deg}}

/* hero room */
.s8-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-64px;padding-top:calc(64px + clamp(64px,9vw,120px))}
.s8-room{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.s8-cone{position:absolute;left:50%;top:-10%;width:min(1200px,160vw);height:90%;translate:-50% 0;
  background:conic-gradient(from 180deg at 50% 0%,transparent 160deg,rgba(255,236,224,.10) 175deg,rgba(255,236,224,.16) 180deg,rgba(255,236,224,.10) 185deg,transparent 200deg);filter:blur(8px)}
.rd.s8:not([data-mode="dark"]) .s8-cone{background:conic-gradient(from 180deg at 50% 0%,transparent 160deg,rgba(226,83,42,.08) 175deg,rgba(226,83,42,.12) 180deg,rgba(226,83,42,.08) 185deg,transparent 200deg)}
.s8-floor{position:absolute;left:-50%;right:-50%;bottom:-6%;height:62%;perspective:520px;perspective-origin:50% 0%}
.s8-floor i{position:absolute;inset:0;transform:rotateX(64deg);transform-origin:50% 0;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:72px 72px;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 30%,#000);mask-image:linear-gradient(to bottom,transparent,#000 30%,#000);
  animation:s8run 3.2s linear infinite}
@keyframes s8run{to{background-position:0 72px}}
.s8-glow{position:absolute;left:50%;bottom:52%;width:80%;height:120px;translate:-50% 50%;background:radial-gradient(closest-side,rgba(226,83,42,.35),transparent);filter:blur(16px)}
.s8-ht{display:grid;justify-items:center;text-align:center;gap:24px}
.s8-pill{display:inline-flex;align-items:center;gap:10px;font-size:15px;color:var(--ink2);padding:5px 14px;border-radius:999px;border:1px solid var(--line2);background:color-mix(in srgb,var(--card) 70%,transparent)}
.s8-h1{font-size:clamp(52px,8.6vw,124px);line-height:1.08}
.s8-h1 span{display:inline-block}
.rd.js .s8-h1 span{opacity:0;filter:blur(14px);transform:translateY(14px);animation:s8in 1.2s var(--out) forwards;animation-delay:calc(.15s + var(--i)*.16s)}
@keyframes s8in{to{opacity:1;filter:none;transform:none}}
.s8-h1 span:last-child{background:linear-gradient(180deg,var(--ink),color-mix(in srgb,var(--acc) 80%,var(--ink)));-webkit-background-clip:text;background-clip:text;color:transparent}
.rd.js .s8-fade{opacity:0;animation:s8in 1s var(--out) forwards;animation-delay:var(--d,.7s);filter:blur(6px)}
.s8-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.rd .s8-b1{display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 20px;border-radius:12px;background:var(--ink);color:var(--bg);font-weight:600;font-size:17px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18),0 8px 30px -10px rgba(244,239,230,.25);transition:transform .3s var(--out)}
.rd .s8-b2{display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 20px;border-radius:12px;border:1px solid var(--line2);background:color-mix(in srgb,var(--card) 60%,transparent);color:var(--ink);font-weight:600;font-size:17px;transition:background-color .3s,transform .3s var(--out)}
.rd .s8-b1:hover,.rd .s8-b2:hover{transform:translateY(-1px)}
.rd .s8-b1:active,.rd .s8-b2:active{transform:scale(.97)}
.s8-b1 svg,.s8-b2 svg{width:17px;height:17px}
.s8-shot{position:relative;margin-top:clamp(56px,7vw,96px);perspective:1400px}
.s8-tilt{transform:rotateX(calc(16deg - var(--ty,0) * 3deg)) rotateY(calc(var(--tx,0) * 4deg));transform-style:preserve-3d;transition:transform .8s var(--out)}
.s8-shot .dv-win{max-width:1100px;margin-inline:auto;border-radius:16px;background:#14120F}
.s8-shot .dv-bar{background:#1A1713;border-color:rgba(244,239,230,.08)}
.s8-shot .dv-bar span{background:#24201A;color:#A39A8D}
.s8-shot .dv-ph{width:min(280px,72vw);margin-inline:auto}
.s8-shot::after{content:"";position:absolute;inset-inline:0;bottom:-2px;height:42%;background:linear-gradient(transparent,var(--bg));pointer-events:none}
.s8-rim{position:absolute;inset-inline:12%;top:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,220,200,.9),transparent);z-index:3}

/* reviews: one large, two small, edges light under the pointer */
.s8-rv{display:grid;gap:14px}
@media (min-width:900px){.s8-rv{grid-template-columns:1.3fr 1fr;grid-template-rows:auto auto}.s8-rv .big{grid-row:span 2}}
.s8-card{position:relative;border-radius:20px;background:var(--card);border:1px solid var(--line);padding:clamp(22px,2.6vw,34px);display:grid;gap:18px;align-content:space-between;overflow:hidden}
.s8-card::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
  background:radial-gradient(360px circle at var(--mx,50%) var(--my,-30%),rgba(226,83,42,.8),transparent 60%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);opacity:.0;transition:opacity .4s}
.s8-card:hover::after{opacity:1}
.s8-card blockquote{font-family:var(--f-head);font-weight:700;font-size:clamp(24px,2.4vw,32px);line-height:1.3}
.s8-card.big blockquote{font-size:clamp(32px,3.8vw,52px)}
.s8-who{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:15px;color:var(--mut)}
.s8-who b{color:var(--ink);font-weight:600}
.s8-who em{font-style:normal;font-size:13px;color:var(--acc-ink);border:1px solid color-mix(in srgb,var(--acc) 35%,transparent);border-radius:6px;padding:2px 8px}
.s8-rv .note{grid-column:1/-1}

/* dashboard: a command bar */
.s8-seg{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px;border-radius:14px;background:var(--card);border:1px solid var(--line2);max-width:820px;margin-inline:auto}
.s8-seg::before{content:"";position:absolute;top:5px;bottom:5px;inset-inline-start:5px;width:calc((100% - 10px) / 5);border-radius:10px;background:var(--card3);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 2px 8px rgba(0,0,0,.2);
  transform:translateX(calc(var(--ix,0) * -100%));transition:transform .55s var(--out)}
.rd .s8-sb{position:relative;z-index:1;height:42px;border-radius:10px;font-size:16px;font-weight:600;color:var(--mut);transition:color .3s;white-space:nowrap}
.s8-sb[aria-selected="true"]{color:var(--ink)}
.s8-sb i{position:absolute;inset-inline:22%;bottom:4px;height:2px;border-radius:2px;background:var(--acc);transform-origin:right;transform:scaleX(var(--p,0));opacity:0}
.s8-sb[aria-selected="true"] i{opacity:1}
@media (max-width:767px){
  .s8-segw{overflow-x:auto;scrollbar-width:none;margin-inline:calc(-1 * var(--gut));padding-inline:var(--gut)}
  .s8-segw::-webkit-scrollbar{display:none}
  .s8-seg{grid-template-columns:repeat(5,auto);width:max-content}
  .s8-seg::before{display:none}
  .rd .s8-sb{padding-inline:14px}
  .s8-sb[aria-selected="true"]{background:var(--card3)}
}
.s8-dwin{margin-top:22px;border-radius:16px}
.s8-dwin .dv-win{border-radius:16px}
.s8-dm .dv-ph{width:min(270px,70vw);margin-inline:auto}
.s8-dp{text-align:center;color:var(--mut);margin-top:18px;min-height:3.4em}

/* editor: a timeline */
.s8-ed{display:grid;gap:22px}
.s8-ed .dv-win{border-radius:16px;max-width:1100px;margin-inline:auto;width:100%}
.s8-ed .dv-ph{width:min(270px,70vw);margin-inline:auto}
.s8-tl{position:relative;max-width:1100px;margin-inline:auto;width:100%;padding-top:14px}
.s8-track{position:relative;height:2px;border-radius:2px;background:var(--line2)}
.s8-track::after{content:"";position:absolute;inset-block:0;inset-inline-start:0;width:calc(var(--t,0) * 100%);background:var(--acc);border-radius:2px}
.s8-head{position:absolute;top:50%;inset-inline-start:calc(var(--t,0) * 100%);width:12px;height:12px;margin-inline-start:-6px;translate:0 -50%;border-radius:50%;background:var(--ink);box-shadow:0 0 0 4px rgba(226,83,42,.35)}
.s8-mk{list-style:none;position:relative;height:74px}
.s8-mk li{position:absolute;top:0;inset-inline-start:calc(var(--at) * 100%);display:grid;justify-items:start;gap:2px;cursor:pointer;padding-top:16px;color:var(--mut2);transition:color .3s;max-width:24%}
.s8-mk li::before{content:"";position:absolute;top:-9px;inset-inline-start:-5px;width:10px;height:10px;border-radius:3px;transform:rotate(45deg);background:var(--bg);border:1px solid var(--mut2);transition:background-color .3s,border-color .3s}
.s8-mk li.on,.s8-mk li.done{color:var(--ink)}
.s8-mk li.on::before,.s8-mk li.done::before{background:var(--acc);border-color:var(--acc)}
.s8-mk b{font-family:var(--f-head);font-size:clamp(20px,2vw,26px);font-weight:700;line-height:1.1}
.s8-mk span{font-size:14.5px;color:var(--mut);line-height:1.5}
.s8-mk li{--at:var(--ad)}
@media (max-width:767px){.s8-mk li{--at:var(--am)}.s8-mk span{display:none}.s8-mk{height:52px}}

/* brief to site */
.s8-gen{display:grid;gap:clamp(28px,4vw,56px);align-items:center}
@media (min-width:960px){.s8-gen{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.s8-prompt{border-radius:20px;background:var(--card);border:1px solid var(--line2);padding:clamp(20px,2.4vw,30px);display:grid;gap:18px}
.s8-ptop{display:flex;justify-content:space-between;align-items:center;font-size:15px;color:var(--mut)}
.s8-ptop em{font-style:normal;font-size:13px;border:1px solid var(--line2);border-radius:6px;padding:2px 8px}
.s8-ptxt{min-height:6.2em;font-size:clamp(20px,1.9vw,24px);line-height:1.6;color:var(--ink)}
.s8-ptxt::after{content:"";display:inline-block;width:2px;height:1.1em;margin-inline-start:2px;vertical-align:-.15em;background:var(--acc);animation:s8blink 1s steps(1) infinite}
.s8-gen.typed .s8-ptxt::after{opacity:0;animation:none}
@keyframes s8blink{50%{opacity:0}}
.s8-pgo{justify-self:end;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:12px;background:var(--card3);color:var(--mut);font-weight:600;transition:background-color .4s,color .4s,box-shadow .4s}
.s8-gen.typed .s8-pgo{background:var(--acc);color:#FFFBF7;box-shadow:0 0 0 6px rgba(226,83,42,.18)}
.s8-steps3{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:15px;color:var(--mut)}
.s8-steps3 span{display:inline-flex;align-items:center;gap:8px}
.s8-steps3 span::before{content:"";width:8px;height:8px;border-radius:50%;border:1px solid var(--mut2);transition:background-color .4s,border-color .4s}
.s8-steps3 span:nth-child(1)::before{background:var(--acc);border-color:var(--acc)}
.s8-gen.typed .s8-steps3 span:nth-child(2)::before,.s8-gen.built .s8-steps3 span:nth-child(3)::before{background:var(--acc);border-color:var(--acc)}
.s8-out{position:relative;justify-self:center;width:min(300px,74vw)}
.rd.js .s8-out .dv-ph-scr img{clip-path:inset(0 0 100% 0);transition:clip-path 1.6s cubic-bezier(.65,0,.35,1)}
.rd.js .s8-gen.built .s8-out .dv-ph-scr img{clip-path:inset(0)}
.s8-skel{position:absolute;inset:0;display:grid;align-content:start;gap:10px;padding:18% 9% 0;background:#1A1713}
.s8-skel i{height:12px;border-radius:6px;background:linear-gradient(90deg,#24201A,#302A22,#24201A);background-size:200% 100%;animation:s8sh 1.4s linear infinite}
.s8-skel i:nth-child(1){height:120px;border-radius:12px}.s8-skel i:nth-child(3){width:70%}.s8-skel i:nth-child(5){width:50%}
@keyframes s8sh{to{background-position:-200% 0}}
.s8-scan{position:absolute;inset-inline:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#FFB79A,transparent);box-shadow:0 0 18px 4px rgba(226,83,42,.5);opacity:0;z-index:3}
.s8-gen.built .s8-scan{animation:s8scan 1.6s cubic-bezier(.65,0,.35,1)}
@keyframes s8scan{0%{opacity:1;top:0}90%{opacity:1}100%{opacity:0;top:100%}}

/* faq: a grid of cells */
.s8-faq{display:grid;gap:1px;background:var(--line2);border:1px solid var(--line2);border-radius:18px;overflow:hidden}
@media (min-width:900px){.s8-faq{grid-template-columns:1fr 1fr}}
.s8-faq details{background:var(--bg);padding:0 clamp(18px,2vw,26px)}
.s8-faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 0;font-size:18.5px;font-weight:600}
.s8-faq summary svg{flex:none;width:18px;height:18px;color:var(--mut);transition:transform .5s var(--out)}
.s8-faq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s8-faq details::details-content{block-size:0;overflow:hidden;transition:block-size .5s var(--out),content-visibility .5s allow-discrete}
.s8-faq details[open]::details-content{block-size:auto}
.s8-faq p{padding:0 0 22px;color:var(--mut);font-size:17px}

/* footer: the wordmark stands on a lit horizon */
.s8-foot{position:relative;isolation:isolate;overflow:hidden;margin-top:clamp(40px,6vw,80px)}
.s8-hz{position:relative;height:1px;background:linear-gradient(90deg,transparent,var(--line2) 15%,rgba(226,83,42,.8) 50%,var(--line2) 85%,transparent)}
.s8-hz::after{content:"";position:absolute;top:-1px;left:0;width:16%;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#FFD3BF,transparent);filter:blur(1px);animation:s8hz 6s cubic-bezier(.6,0,.4,1) infinite}
@keyframes s8hz{0%{transform:translateX(-120%)}70%,100%{transform:translateX(720%)}}
.s8-fw{position:relative;display:grid;justify-items:center;padding-inline:var(--gut)}
.s8-fw::before{content:"";position:absolute;top:0;left:15%;right:15%;height:140%;background:radial-gradient(50% 60% at 50% 0%,rgba(226,83,42,.22),transparent);z-index:-1}
.s8-fw svg{width:min(1180px,100%);height:auto;color:var(--ink);-webkit-mask-image:linear-gradient(#000 10%,rgba(0,0,0,.08) 92%);mask-image:linear-gradient(#000 10%,rgba(0,0,0,.08) 92%)}
.s8-ffloor{position:absolute;left:-50%;right:-50%;bottom:0;height:70%;perspective:520px;perspective-origin:50% 0%;z-index:-1;pointer-events:none}
.s8-ffloor i{position:absolute;inset:0;transform:rotateX(64deg);transform-origin:50% 0;background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:72px 72px;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 50%);mask-image:linear-gradient(to bottom,transparent,#000 50%)}
.s8-fb{display:grid;gap:40px;padding-block:clamp(40px,5vw,64px) 28px}
@media (min-width:900px){.s8-fb{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)}}
.s8-fbr{display:grid;gap:18px;justify-items:start}
.s8-fbr p{color:var(--mut);max-width:40ch}
.s8-foot .fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
@media (min-width:600px){.s8-foot .fl{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s8-foot .fl-h{font-size:14px;color:var(--mut);margin-bottom:12px}
.s8-foot .fl ul{display:grid;gap:8px}
.s8-foot .fl a{color:var(--ink2);font-size:17px;transition:color .2s}
.s8-foot .fl a:hover{color:var(--acc-ink)}
.s8-foot .fc{display:grid;gap:4px;justify-items:start;font-family:var(--mono);font-size:14px;color:var(--ink2)}
.s8-fbase{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;padding-block:22px 34px;border-top:1px solid var(--line);font-size:14px;color:var(--mut)}
.s8-foot .fs{display:flex;flex-wrap:wrap;gap:16px}

/* pricing */
.s8-pr{position:relative;isolation:isolate;overflow:hidden;margin-top:-64px;padding-top:calc(64px + clamp(56px,7vw,96px));padding-bottom:clamp(72px,9vw,120px)}
.s8-pword{position:absolute;inset-inline:0;top:calc(64px + 1vw);text-align:center;font-family:var(--f-head);font-weight:700;font-size:clamp(130px,27vw,400px);line-height:1;z-index:-1;pointer-events:none;color:transparent;
  background-image:linear-gradient(var(--line2) 1px,transparent 1px),linear-gradient(90deg,var(--line2) 1px,transparent 1px),linear-gradient(180deg,color-mix(in srgb,var(--ink) 8%,transparent),transparent 80%);background-size:14px 14px,14px 14px,100% 100%;-webkit-background-clip:text;background-clip:text}
.s8-ph1{font-size:clamp(40px,5.6vw,76px);line-height:1.12}
.s8-ph1 span{color:var(--mut);display:block}
.s8-cards{display:grid;gap:14px;margin-top:clamp(44px,6vw,72px)}
@media (min-width:960px){.s8-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s8-pc{position:relative;border-radius:20px;background:var(--card);border:1px solid var(--line2);padding:clamp(22px,2.4vw,32px);display:grid;align-content:start;gap:16px}
.s8-pc.hi{background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 10%,var(--card)),var(--card) 40%)}
.s8-pc .nm{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:19px;font-weight:600}
.s8-pc .badge{font-size:13px;color:var(--acc-ink);border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);border-radius:6px;padding:2px 8px}
.s8-pc .amt{display:flex;align-items:baseline;gap:8px}
.s8-pc .amt-v{font-family:var(--mono);font-weight:500;font-size:clamp(46px,4.4vw,60px);line-height:1;letter-spacing:-.04em}
.s8-pc .cur,.s8-pc .dec{font-size:.5em;color:var(--mut)}
.s8-pc .cur{vertical-align:.7em;margin-inline-end:2px}
.s8-pc .amt small{color:var(--mut);font-size:15.5px}
.s8-pc .sub{color:var(--mut);font-size:16.5px}
.rd .s8-pc .s8-b1,.rd .s8-pc .s8-b2{width:100%;justify-content:center}
.s8-pc ul{display:grid;gap:10px;padding-top:18px;border-top:1px dashed var(--line2)}
.s8-pc li{display:grid;grid-template-columns:18px 1fr;gap:10px;font-size:16px;line-height:1.6}
.s8-pc li svg{width:15px;height:15px;margin-top:6px;color:var(--acc)}
.s8-pc .ft{font-size:13.5px;color:var(--mut)}

@media (prefers-reduced-motion:reduce){.s8-floor i{animation:none}.s8-beam::before{animation:none}.s8-tilt{transform:none}}
`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s8-faq">{list.map((f) => <details key={f.q}><summary>{f.q}<Plus strokeWidth={1.6} /></summary><p>{f.a}</p></details>)}</div>
}

function Room() {
  return <div className="s8-room" aria-hidden><div className="s8-cone" /><div className="s8-glow" /><div className="s8-floor"><i /></div></div>
}

function Footer() {
  return (
    <footer className="s8-foot">
      <div className="s8-hz" aria-hidden />
      <div className="s8-fw" aria-hidden><Mark /></div>
      <div className="s8-ffloor" aria-hidden><i /></div>
      <div className="wrap s8-fb">
        <div className="s8-fbr">
          <p>{FOOTER.claim}</p>
          <a className="s8-b1" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
          <Contact />
        </div>
        <FooterLinks />
      </div>
      <div className="wrap s8-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
    </footer>
  )
}

export function Home() {
  const [big, ...rest] = REVIEWS
  return (
    <Root id="s8" mode="dark" css={CSS}>
      <Header />
      <section className="s8-hero">
        <Room />
        <div className="wrap s8-ht">
          <p className="s8-pill s8-fade" style={{ ['--d' as string]: '.05s' }}>{HERO.claim}</p>
          <h1 className="s8-t s8-h1">{HERO.words.map((w, i) => <span key={w} style={{ ['--i' as string]: i }}>{w}{i < 2 ? '، ' : '.'}</span>)}</h1>
          <p className="s8-sub s8-fade" style={{ ['--d' as string]: '.7s' }}>{HERO.sub}</p>
          <div className="s8-ctas s8-fade" style={{ ['--d' as string]: '.85s' }}>
            <a className="s8-b1" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
            <a className="s8-b2" href={HERO.secondary.href}>{HERO.secondary.label}</a>
          </div>
        </div>
        <div className="wrap s8-shot s8-fade" data-tilt style={{ ['--d' as string]: '1s' }}>
          <div className="s8-tilt">
            <div className="only-d s8-beam" style={{ borderRadius: 16, maxWidth: 1100, marginInline: 'auto' }}>
              <span className="s8-rim" />
              <Browser url="beynoun.com/dashboard"><Vid v={DASH_D} kind="d" label="جولة في لوحة تحكم بينون" /></Browser>
            </div>
            <Phone className="only-m"><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone>
          </div>
        </div>
      </section>

      <section className="s8-sec">
        <div className="wrap">
          <div className="s8-hd" data-r><h2 className="s8-t s8-h2">{SECTIONS.reviews}</h2></div>
          <div className="s8-rv">
            <figure className="s8-card big" data-spot data-r>
              <Stars n={big.rating} />
              <blockquote>«{big.body}»</blockquote>
              <figcaption className="s8-who"><b>{big.name}</b><em>بانتظار موافقتك</em></figcaption>
            </figure>
            {rest.map((r, i) => (
              <figure key={i} className="s8-card" data-spot data-r style={{ ['--i' as string]: i + 1 }}>
                <blockquote>«{r.body}»</blockquote>
                <figcaption className="s8-who"><b>{r.name}</b><em>بانتظار موافقتك</em></figcaption>
              </figure>
            ))}
            <p className="note">{REVIEWS_NOTE}</p>
          </div>
        </div>
      </section>

      <section className="s8-sec" style={{ paddingTop: 0 }}>
        <div className="wrap" data-tabs>
          <div className="s8-hd" data-r style={{ justifyItems: 'center', textAlign: 'center' }}>
            <h2 className="s8-t s8-h2">{SECTIONS.dash}</h2>
            <p className="s8-sub">{SECTIONS.dashLead}</p>
          </div>
          <div className="s8-segw">
            <div className="s8-seg" role="tablist" aria-label="أقسام لوحة التحكم">
              {DASH_FEATURES.map((f, i) => (
                <button key={f.id} type="button" role="tab" className="s8-sb" data-tab={i} data-d={f.d.join(',')} data-m={f.m.join(',')}>{f.title}<i /></button>
              ))}
            </div>
          </div>
          <div className="s8-dwin only-d s8-beam" data-r><Browser url="beynoun.com/dashboard"><Vid v={DASH_D} kind="d" label="لوحة تحكم بينون" /></Browser></div>
          <div className="s8-dwin only-m s8-dm" data-r><Phone><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone></div>
          {DASH_FEATURES.map((f, i) => <p key={f.id} className="s8-dp" data-panel={i} hidden={i > 0}>{f.body}</p>)}
        </div>
      </section>

      <section className="s8-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="s8-hd" data-r>
            <h2 className="s8-t s8-h2">{SECTIONS.edit}</h2>
            <p className="s8-sub">{SECTIONS.editLead}</p>
          </div>
          <div className="s8-ed" data-sync>
            <div data-r>
              <Browser className="only-d" url="beynoun.com/editor"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></Browser>
              <Phone className="only-m"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></Phone>
            </div>
            <div className="s8-tl">
              <div className="s8-track"><span className="s8-head" /></div>
              <ol className="s8-mk">
                {EDIT_STEPS.map((s) => (
                  <li key={s.id} data-step data-d={s.d} data-m={s.m} style={{ ['--ad' as string]: (s.d / EDIT_DUR.d).toFixed(3), ['--am' as string]: (s.m / EDIT_DUR.m).toFixed(3) }}>
                    <b>{s.title}</b><span>{s.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="s8-sec" style={{ paddingTop: 0 }}>
        <div className="wrap s8-gen" data-gen>
          <div style={{ display: 'grid', gap: 26 }}>
            <div className="s8-hd" data-r style={{ marginBottom: 0 }}>
              <h2 className="s8-t s8-h2">{SECTIONS.gen}</h2>
              <p className="s8-sub">{SECTIONS.genLead}</p>
            </div>
            <div className="s8-prompt s8-beam">
              <div className="s8-ptop"><span>صِف نشاطك</span><em>{BRIEF.label}</em></div>
              <p className="s8-ptxt" data-type={BRIEF.text}>{BRIEF.text}</p>
              <span className="s8-pgo">أنشئ الموقع<ArrowUpLeft size={16} /></span>
            </div>
            <div className="s8-steps3"><span>تكتب</span><span>بينون تبني</span><span>موقعك جاهز</span></div>
          </div>
          <div className="s8-out">
            <Phone>
              <div className="s8-skel" aria-hidden><i /><i /><i /><i /><i /></div>
              <img src={phoneShot(BRIEF.shot)} alt="موقع مطعم من قالب المطعم" style={{ position: 'relative' }} />
              <span className="s8-scan" aria-hidden />
            </Phone>
          </div>
        </div>
      </section>

      <section className="s8-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="s8-hd" data-r style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
            <h2 className="s8-t s8-h2">{SECTIONS.faq}</h2>
            <a className="s8-b2" href="/faq">كل الأسئلة</a>
          </div>
          <div data-r><Faq /></div>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s8" mode="dark" css={CSS}>
      <Header />
      <section className="s8-pr">
        <Room />
        <div className="s8-pword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s8-ht">
            <h1 className="s8-t s8-ph1">{PRICING_HEAD.l1}<span>{PRICING_HEAD.l2}</span></h1>
            <p className="s8-sub">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s8-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s8-pc' + (p.id === 'starter' ? ' hi s8-beam' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><Amount v={p.amount} /><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <a className={p.id === 'starter' ? 's8-b1' : 's8-b2'} href={p.href}>{p.cta}</a>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.4} />{f}</li>)}</ul>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="s8-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="s8-hd"><h2 className="s8-t s8-h2">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
