/**
 * Style 10 — «طبقات» (Layers). The page is a stack of sheets. Each section
 * is a rounded panel that slides over the one before it, and the one being
 * covered settles back and dims. The hero deals three cards into a fan, the
 * reviews are a deck that shuffles, the dashboard has a dock, the editor's
 * steps float around its window, the templates run in two columns that move
 * against each other, and the footer is the last sheet, its wordmark
 * standing up over its top edge like a handle.
 */
import { Home as HomeIc, BarChart3, CalendarDays, Star as StarIc, Search } from 'lucide-react'
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft, Laptop, Phone, Browser, Amount } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER, SECTIONS } from './data'

const ICONS = [HomeIc, BarChart3, CalendarDays, StarIc, Search]
const NUM = ['١', '٢', '٣', '٤']

const CSS = `
.s10{interpolate-size:allow-keywords;--ink-p:#16120D;--on-p:#F4EFE6}
.s10 .h{position:fixed;top:12px;inset-inline:0;pointer-events:none;z-index:60}
.s10 .h-in{pointer-events:auto;height:56px;max-width:min(1080px,calc(100% - 24px));margin-inline:auto;padding-inline:10px 10px;padding-inline-start:18px;border-radius:999px;
  background:color-mix(in srgb,var(--card) 82%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);box-shadow:0 0 0 1px var(--line2),0 12px 30px -16px rgba(22,18,13,.4)}
.s10 .h-drawer{pointer-events:auto;max-width:min(1080px,calc(100% - 24px));margin:8px auto 0;padding:0;border-radius:22px}
.s10[data-menu="open"] .h-drawer{background:var(--card);box-shadow:0 0 0 1px var(--line2),0 20px 40px -20px rgba(22,18,13,.4)}
.s10 .h-drawer nav{padding:6px 18px 12px}
.s10 .h-nav a{font-size:16.5px}

.s10-t{font-family:var(--f-head);font-weight:700;line-height:1.12;letter-spacing:0;text-wrap:balance}
.s10-h2{font-size:clamp(34px,4.6vw,64px)}
.s10-sub{color:var(--mut);font-size:clamp(18px,1.5vw,20px);max-width:46ch;text-wrap:pretty}
.s10-hd{display:grid;gap:14px;margin-bottom:clamp(32px,4vw,52px)}
.rd .s10-b1{display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 24px;border-radius:999px;background:var(--ink);color:var(--bg);font-weight:600;font-size:18px;transition:transform .35s var(--out)}
.rd .s10-b1 svg{width:18px;height:18px;transition:transform .35s var(--out)}
.rd .s10-b1:hover svg{transform:translate(-3px,-3px)}
.rd .s10-b2{display:inline-flex;align-items:center;height:52px;padding:0 22px;border-radius:999px;color:var(--ink);font-weight:600;font-size:18px;box-shadow:inset 0 0 0 1px var(--line2);transition:background-color .3s}
.rd .s10-b2:hover{background:var(--card2)}
.rd .s10-b1:active,.rd .s10-b2:active{transform:scale(.97)}

/* hero: three cards dealt into a fan */
.s10-hero{position:sticky;top:0;z-index:0;isolation:isolate;overflow:hidden;padding-top:clamp(120px,14vw,170px);padding-bottom:clamp(40px,5vw,64px)}
.s10-sheets{position:absolute;inset:0;z-index:-1;pointer-events:none}
.s10-sheets i{position:absolute;left:50%;top:58%;width:calc(var(--k) * 30vw + 40vw);aspect-ratio:1.6;translate:-50% -50%;border-radius:48px;border:1px solid var(--line2);animation:s10br 9s ease-in-out infinite;animation-delay:calc(var(--k) * -2.4s)}
@keyframes s10br{50%{transform:scale(1.04) rotate(.6deg)}}
.s10-sheets b{position:absolute;left:50%;top:62%;width:70vw;aspect-ratio:2;translate:-50% -50%;background:radial-gradient(closest-side,rgba(226,83,42,.16),transparent)}
.s10-ht{display:grid;justify-items:center;text-align:center;gap:22px}
.s10-claim{font-size:15.5px;color:var(--ink2);display:inline-flex;align-items:center;gap:8px}
.s10-claim::before,.s10-claim::after{content:"";width:22px;height:1px;background:var(--line2)}
.s10-h1{font-size:clamp(54px,8.6vw,124px);line-height:1.06}
.s10-h1 em{font-style:normal;color:var(--acc)}
.rd.js .s10-fade{opacity:0;animation:s10f 1s var(--out) forwards;animation-delay:var(--d,.4s)}
@keyframes s10f{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.s10-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
.s10-fan{position:relative;height:clamp(380px,44vw,560px);margin-top:clamp(36px,5vw,64px)}
.s10-fan>div{position:absolute;left:50%;top:0;width:clamp(170px,19vw,250px);translate:-50% 0;transform-origin:50% 120%}
.rd.js .s10-fan>div{animation:s10deal 1.3s cubic-bezier(.2,.9,.2,1) both;animation-delay:calc(.5s + var(--k) * .12s)}
.s10-fan .f1{transform:rotate(-14deg) translateX(-58%);z-index:1}
.s10-fan .f2{z-index:3}
.s10-fan .f3{transform:rotate(14deg) translateX(58%);z-index:2}
@keyframes s10deal{from{transform:translateY(40px) rotate(0) translateX(0);opacity:0}}
.s10-fan .f2 .dv-ph{box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.13),0 50px 80px -30px rgba(22,18,13,.55)}
@media (hover:hover){.s10-fan:hover .f1{transform:rotate(-18deg) translateX(-72%)}.s10-fan:hover .f3{transform:rotate(18deg) translateX(72%)}.s10-fan>div{transition:transform .8s var(--out)}}

/* the stack */
.s10-hero>.wrap,.s10-hero>.s10-fan,.s10-pr>.wrap{transform:scale(calc(1 - var(--c,0) * .06));transform-origin:50% 0}
.s10-hero::after,.s10-pr::after{content:"";position:absolute;inset:0;background:#0B0907;opacity:calc(var(--c,0) * .35);pointer-events:none}
.s10-panel{position:sticky;top:0;z-index:var(--z);border-radius:clamp(28px,4vw,48px) clamp(28px,4vw,48px) 0 0;background:var(--pbg,var(--card));color:var(--pink,var(--ink));
  box-shadow:0 -1px 0 var(--line),0 -30px 60px -40px rgba(22,18,13,.35);transform-origin:50% 0}
.s10-pin{padding-block:clamp(72px,9vw,128px);transform:scale(calc(1 - var(--c,0) * .06));transform-origin:50% 0}
.s10-panel::after{content:"";position:absolute;inset:0;border-radius:inherit;background:#0B0907;opacity:calc(var(--c,0) * .45);pointer-events:none}
.s10-ink{--pbg:#16120D;--pink:#F4EFE6;--ink:#F4EFE6;--ink2:#DAD1C4;--mut:#A39A8D;--mut2:#7E766B;--line:rgba(244,239,230,.08);--line2:rgba(244,239,230,.16);--card:#1F1B16;--card2:#24201A;--card3:#2E2922;--bg:#16120D}
.s10-paper{--pbg:var(--bg2)}
.rd[data-mode="dark"] .s10-ink{--pbg:#080706;--bg:#080706;--card:#14110E}
.rd[data-mode="dark"] .s10-panel{box-shadow:0 -1px 0 var(--line2),0 -30px 60px -40px rgba(0,0,0,.8)}

/* reviews: a deck that shuffles */
.s10-rg{display:grid;gap:40px;align-items:center}
@media (min-width:960px){.s10-rg{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}}
.s10-deck{position:relative;display:grid;min-height:300px}
.s10-deck figure{grid-area:1/1;display:grid;gap:18px;align-content:space-between;padding:clamp(24px,3vw,40px);border-radius:28px;background:var(--bg);box-shadow:0 0 0 1px var(--line2),0 24px 50px -30px rgba(22,18,13,.35);
  transform:translate(-26px,22px) rotate(-5deg) scale(.94);opacity:.55;z-index:1;transition:transform .9s cubic-bezier(.2,.9,.2,1),opacity .9s}
.s10-deck figure.was{transform:translate(26px,12px) rotate(4deg) scale(.96);opacity:.75;z-index:2}
.s10-deck figure.on{transform:none;opacity:1;z-index:3}
.s10-deck blockquote{font-family:var(--f-head);font-weight:700;font-size:clamp(28px,3.4vw,46px);line-height:1.25}
.s10-deck figcaption{display:flex;justify-content:space-between;align-items:center;font-size:15px;color:var(--mut)}
.s10-deck figcaption b{color:var(--ink);font-weight:600}
.s10-deck em{font-style:normal;font-size:13px;color:var(--acc-ink);border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);border-radius:999px;padding:2px 10px}
.s10-pips{display:flex;gap:8px;margin-top:22px}
.rd .s10-pips button{width:10px;height:10px;border-radius:50%;background:var(--line2);transition:background-color .3s,transform .3s}
.rd .s10-pips button[aria-current="true"]{background:var(--acc);transform:scale(1.25)}

/* dashboard: a dock */
.s10-dw{position:relative;max-width:1080px;margin-inline:auto}
.s10-dw .dv-lap{width:100%}
.s10-dw .dv-ph{width:min(260px,66vw);margin-inline:auto}
.s10-dw::before{content:"";position:absolute;inset:10% 10% -6%;background:radial-gradient(closest-side,rgba(226,83,42,.32),transparent);filter:blur(30px);z-index:-1}
.s10-dock{position:relative;z-index:3;display:flex;gap:6px;width:max-content;max-width:100%;margin:-30px auto 0;padding:7px;border-radius:22px;background:color-mix(in srgb,var(--card3) 86%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 0 0 1px var(--line2),0 20px 40px -20px rgba(0,0,0,.7);overflow-x:auto;scrollbar-width:none}
.s10-dock::-webkit-scrollbar{display:none}
.rd .s10-dk{flex:none;display:flex;align-items:center;gap:8px;height:48px;padding:0 14px;border-radius:16px;color:var(--mut);font-size:15.5px;font-weight:600;transition:background-color .35s,color .35s,transform .35s var(--out)}
.rd .s10-dk svg{width:20px;height:20px}
.rd .s10-dk span{display:grid;grid-template-columns:0fr;transition:grid-template-columns .5s var(--out)}
.rd .s10-dk span>i{overflow:hidden;white-space:nowrap;font-style:normal}
.s10-dk[aria-selected="true"]{background:var(--acc);color:#FFFBF7}
.s10-dk[aria-selected="true"] span{grid-template-columns:1fr}
@media (hover:hover){.rd .s10-dk:hover{transform:translateY(-3px)}}
.s10-dp{text-align:center;color:var(--mut);margin:20px auto 0;max-width:52ch;min-height:3.4em}

/* editor: steps float around the window */
.s10-ew{position:relative;max-width:980px;margin-inline:auto}
.s10-ew .dv-win{box-shadow:0 0 0 1px var(--line2),0 40px 80px -40px rgba(22,18,13,.45)}
.s10-ew .dv-ph{width:min(260px,66vw);margin-inline:auto}
.s10-chips{list-style:none}
.s10-chip{display:flex;align-items:center;gap:10px;padding:10px 16px 10px 12px;border-radius:999px;background:var(--card);box-shadow:0 0 0 1px var(--line2),0 16px 30px -18px rgba(22,18,13,.4);cursor:pointer;transition:transform .5s var(--out),box-shadow .5s,background-color .4s;white-space:nowrap}
.s10-chip i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-family:var(--f-head);font-weight:700;background:var(--card2);color:var(--mut);transition:background-color .4s,color .4s}
.s10-chip b{font-family:var(--f-head);font-size:20px;font-weight:700}
.s10-chip span{font-size:15px;color:var(--mut)}
.s10-chip.on{transform:scale(1.06);box-shadow:0 0 0 1.5px var(--acc),0 20px 40px -18px rgba(226,83,42,.55)}
.s10-chip.on i{background:var(--acc);color:#FFFBF7}
.s10-chip.done i{background:var(--ink);color:var(--bg)}
@media (min-width:960px){
  .s10-chips{position:absolute;inset:0;pointer-events:none}
  .s10-chip{position:absolute;pointer-events:auto;animation:s10bob 6s ease-in-out infinite}
  .s10-chip:nth-child(1){top:8%;inset-inline-start:-7%}
  .s10-chip:nth-child(2){top:38%;inset-inline-end:-8%;animation-delay:-1.5s}
  .s10-chip:nth-child(3){bottom:26%;inset-inline-start:-9%;animation-delay:-3s}
  .s10-chip:nth-child(4){bottom:-5%;inset-inline-end:8%;animation-delay:-4.5s}
}
@keyframes s10bob{50%{translate:0 -8px}}
@media (max-width:959px){.s10-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}.s10-chip span{display:none}.s10-chip.on{transform:none}}

/* templates: two columns that move against each other */
.s10-tg{display:grid;gap:36px;align-items:center}
@media (min-width:960px){.s10-tg{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}}
.s10-cols{display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,1.6vw,22px);height:clamp(560px,62vw,760px);overflow:hidden;
  -webkit-mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent)}
.s10-col{display:grid;gap:clamp(12px,1.6vw,22px);align-content:start}
.s10-col:nth-child(1){transform:translateY(calc(var(--p,.5) * -42%))}
.s10-col:nth-child(2){transform:translateY(calc(-42% + var(--p,.5) * 42%))}
.s10-tc{display:grid;gap:8px}
.s10-tc strong{font-size:16px;font-weight:600}
.s10-tc small{font-size:13.5px;color:var(--mut)}
.s10-tc em{font-style:normal;font-size:12px;color:var(--acc-ink);margin-inline-start:6px}
.s10-tc .dv-ph{transition:transform .6s var(--out)}
@media (hover:hover){.s10-tc:hover .dv-ph{transform:scale(1.03)}}

/* faq */
.s10-faq details{border-radius:22px;background:var(--bg);margin-bottom:10px;padding:0 24px;box-shadow:0 0 0 1px var(--line)}
.s10-faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 0;font-size:clamp(18.5px,1.6vw,21px);font-weight:600}
.s10-faq summary svg{flex:none;width:20px;height:20px;transition:transform .5s var(--out)}
.s10-faq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s10-faq details::details-content{block-size:0;overflow:hidden;transition:block-size .5s var(--out),content-visibility .5s allow-discrete}
.s10-faq details[open]::details-content{block-size:auto}
.s10-faq p{padding:0 0 22px;color:var(--mut);max-width:62ch}
.s10-fq{display:grid;gap:32px}
@media (min-width:960px){.s10-fq{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr)}}

/* footer: the last sheet, its wordmark stands over the edge */
.s10-panel.s10-foot{position:relative}
.s10-foot .s10-pin{padding-top:clamp(70px,9vw,120px)}
.s10-handle{position:absolute;top:0;inset-inline:var(--gut);display:grid;justify-items:center;translate:0 -58%;z-index:2;pointer-events:none}
.s10-handle svg{width:min(880px,100%);height:auto;color:var(--pbg)}
.rd[data-mode="dark"] .s10-handle svg{filter:drop-shadow(0 -1.5px 0 rgba(244,239,230,.4)) drop-shadow(0 -10px 24px rgba(226,83,42,.22))}
.s10-fb{display:grid;gap:40px;padding-bottom:28px}
@media (min-width:900px){.s10-fb{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)}}
.s10-fbr{display:grid;gap:18px;justify-items:start}
.s10-fbr p{color:var(--mut);max-width:40ch}
.s10-foot .fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
@media (min-width:600px){.s10-foot .fl{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s10-foot .fl-h{font-size:14px;color:var(--mut);margin-bottom:10px}
.s10-foot .fl ul{display:grid;gap:8px}
.s10-foot .fl a{color:var(--ink2);font-size:17px}
.s10-foot .fl a:hover{color:#FFB79A}
.s10-foot .fc{display:grid;gap:4px;justify-items:start;color:var(--ink2)}
.s10-fbase{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;padding-top:22px;border-top:1px solid var(--line);font-size:14px;color:var(--mut)}
.s10-foot .fs{display:flex;flex-wrap:wrap;gap:16px}

/* pricing */
.s10-pr{position:sticky;top:0;z-index:0;isolation:isolate;overflow:hidden;padding-top:clamp(120px,14vw,170px);padding-bottom:clamp(72px,9vw,120px)}
.s10-pword{position:absolute;inset-inline:0;top:calc(40px + 2vw);text-align:center;font-family:var(--f-head);font-weight:700;font-size:clamp(130px,27vw,400px);line-height:1;color:color-mix(in srgb,var(--ink) 5%,transparent);z-index:-1;pointer-events:none}
.s10-ph1{font-size:clamp(42px,6vw,82px);line-height:1.1}
.s10-ph1 span{color:var(--mut)}
.s10-cards{display:grid;gap:26px;margin-top:clamp(44px,6vw,72px)}
@media (min-width:960px){.s10-cards{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;align-items:start}}
.s10-pc{position:relative;display:grid;gap:16px;padding:clamp(24px,2.6vw,34px);border-radius:28px;background:var(--card);box-shadow:0 0 0 1px var(--line2)}
.s10-pc::before,.s10-pc::after{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--card);box-shadow:0 0 0 1px var(--line2);z-index:-1;transition:transform .6s var(--out)}
.s10-pc::before{transform:translateY(10px) scale(.96)}
.s10-pc::after{transform:translateY(20px) scale(.92);opacity:.6}
@media (hover:hover){.s10-pc:hover::before{transform:translateY(14px) scale(.96)}.s10-pc:hover::after{transform:translateY(28px) scale(.92)}}
.s10-pc.hi,.s10-pc.hi::before,.s10-pc.hi::after{background:#16120D}
.s10-pc.hi{color:#F4EFE6;--mut:#A39A8D;--line:rgba(244,239,230,.12)}
.s10-pc .nm{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:20px;font-weight:600}
.s10-pc .badge{font-size:13px;font-weight:600;color:#FFFBF7;background:var(--acc);border-radius:999px;padding:3px 12px}
.s10-pc .amt{display:flex;align-items:baseline;gap:8px}
.s10-pc .amt-v{font-family:var(--f-head);font-weight:700;font-size:clamp(54px,5vw,70px);line-height:1}
.s10-pc .cur,.s10-pc .dec{font-size:.45em;color:var(--mut)}
.s10-pc .cur{vertical-align:.85em;margin-inline-end:2px}
.s10-pc .amt small{color:var(--mut);font-size:16px}
.s10-pc .sub{color:var(--mut);font-size:17px}
.rd .s10-pc .s10-b1,.rd .s10-pc .s10-b2{width:100%;justify-content:center}
.rd .s10-pc.hi .s10-b1{background:var(--acc);color:#FFFBF7}
.s10-pc ul{display:grid;gap:10px;padding-top:18px;border-top:1px solid var(--line)}
.s10-pc li{display:grid;grid-template-columns:20px 1fr;gap:10px;font-size:16.5px;line-height:1.6}
.s10-pc li svg{width:16px;height:16px;margin-top:5px;color:var(--acc)}
.s10-pc .ft{font-size:14px;color:var(--mut);text-align:center}

@media (prefers-reduced-motion:reduce){.s10-pin,.s10-hero>.wrap,.s10-hero>.s10-fan,.s10-pr>.wrap{transform:none}.s10-panel::after,.s10-hero::after{display:none}.s10-col{transform:none!important}}
`

/* Sticky sheets: a sheet taller than the screen sticks by its bottom, so all
   of it is read before the next one slides over; the sheet being covered
   learns how far (--c). */
const STACK = `(function(){var root=document.currentScript.parentElement;var ps=[].slice.call(root.querySelectorAll('.s10-hero,.s10-pr,.s10-panel'));if(!ps.length)return;
function size(){ps.forEach(function(p,i){if(ps[i+1])p.style.top=Math.min(0,innerHeight-p.offsetHeight)+'px'})}
var t=0;function f(){t=0;var H=innerHeight;ps.forEach(function(p,i){var n=ps[i+1];if(!n)return;var c=1-n.getBoundingClientRect().top/H;c=c<0?0:c>1?1:c;p.style.setProperty('--c',c.toFixed(3))})}
size();f();addEventListener('resize',function(){size();f()});addEventListener('load',function(){size();f()});addEventListener('scroll',function(){if(!t)t=requestAnimationFrame(f)},{passive:true});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){size();f()})})()`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s10-faq">{list.map((f) => <details key={f.q}><summary>{f.q}<Plus strokeWidth={1.6} /></summary><p>{f.a}</p></details>)}</div>
}

function Footer({ z }: { z: number }) {
  return (
    <footer className="s10-panel s10-ink s10-foot" style={{ ['--z' as string]: z }}>
      <div className="s10-handle" aria-hidden><Mark /></div>
      <div className="s10-pin">
        <div className="wrap s10-fb">
          <div className="s10-fbr">
            <p>{FOOTER.claim}</p>
            <a className="s10-b1" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
            <Contact />
          </div>
          <FooterLinks />
        </div>
        <div className="wrap s10-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
      </div>
    </footer>
  )
}

export function Home() {
  const colA = TEMPLATES.filter((_, i) => i % 2 === 0)
  const colB = TEMPLATES.filter((_, i) => i % 2 === 1)
  const Card = (t: (typeof TEMPLATES)[number]) => (
    <a key={t.id} href={t.href} className="s10-tc">
      <Phone><img src={phoneShot(t.id)} alt={t.name} loading="lazy" /></Phone>
      <span><strong>{t.name}</strong>{'soon' in t && t.soon ? <em>قريبًا</em> : null}<br /><small>{t.tag}</small></span>
    </a>
  )
  return (
    <Root id="s10" mode="light" css={CSS}>
      <Header />
      <section className="s10-hero">
        <div className="s10-sheets" aria-hidden>{[0, 1, 2].map((k) => <i key={k} style={{ ['--k' as string]: k }} />)}<b /></div>
        <div className="wrap s10-ht">
          <p className="s10-claim s10-fade" style={{ ['--d' as string]: '.05s' }}>{HERO.claim}</p>
          <h1 className="s10-t s10-h1 s10-fade" style={{ ['--d' as string]: '.15s' }}>{HERO.words[0]}، {HERO.words[1]}، <em>{HERO.words[2]}.</em></h1>
          <p className="s10-sub s10-fade" style={{ ['--d' as string]: '.3s' }}>{HERO.sub}</p>
          <div className="s10-ctas s10-fade" style={{ ['--d' as string]: '.42s' }}>
            <a className="s10-b1" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
            <a className="s10-b2" href={HERO.secondary.href}>{HERO.secondary.label}</a>
          </div>
        </div>
        <div className="s10-fan">
          <div className="f1" style={{ ['--k' as string]: 0 }}><Phone><img src={phoneShot('wellness')} alt="قالب موقع مركز عافية" /></Phone></div>
          <div className="f3" style={{ ['--k' as string]: 1 }}><Phone><img src={phoneShot('restaurant')} alt="قالب موقع مطعم" /></Phone></div>
          <div className="f2" style={{ ['--k' as string]: 2 }}><Phone><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone></div>
        </div>
      </section>

      <main>
        <section className="s10-panel" style={{ ['--z' as string]: 1 }}>
          <div className="s10-pin"><div className="wrap s10-rg">
            <div className="s10-hd" style={{ marginBottom: 0 }}>
              <h2 className="s10-t s10-h2">{SECTIONS.reviews}</h2>
              <p className="note">{REVIEWS_NOTE}</p>
            </div>
            <div data-rotate="4500">
              <div className="s10-deck">
                {REVIEWS.map((r, i) => (
                  <figure key={i} data-item>
                    <Stars n={r.rating} />
                    <blockquote>«{r.body}»</blockquote>
                    <figcaption><b>{r.name}</b><em>بانتظار موافقتك</em></figcaption>
                  </figure>
                ))}
              </div>
              <div className="s10-pips">{REVIEWS.map((r, i) => <button key={i} type="button" data-dot aria-label={'رأي ' + (i + 1)} />)}</div>
            </div>
          </div></div>
        </section>

        <section className="s10-panel s10-ink" style={{ ['--z' as string]: 2 }}>
          <div className="s10-pin"><div className="wrap" data-tabs>
            <div className="s10-hd" style={{ justifyItems: 'center', textAlign: 'center' }}>
              <h2 className="s10-t s10-h2">{SECTIONS.dash}</h2>
              <p className="s10-sub">{SECTIONS.dashLead}</p>
            </div>
            <div className="s10-dw">
              <Laptop className="only-d"><Vid v={DASH_D} kind="d" label="لوحة تحكم بينون" /></Laptop>
              <Phone className="only-m"><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone>
              <div className="s10-dock" role="tablist" aria-label="أقسام لوحة التحكم">
                {DASH_FEATURES.map((f, i) => {
                  const I = ICONS[i]
                  return <button key={f.id} type="button" role="tab" className="s10-dk" data-tab={i} data-d={f.d.join(',')} data-m={f.m.join(',')} aria-label={f.title}><I strokeWidth={1.7} /><span><i>{f.title}</i></span></button>
                })}
              </div>
            </div>
            {DASH_FEATURES.map((f, i) => <p key={f.id} className="s10-dp" data-panel={i} hidden={i > 0}>{f.body}</p>)}
          </div></div>
        </section>

        <section className="s10-panel s10-paper" style={{ ['--z' as string]: 3 }}>
          <div className="s10-pin"><div className="wrap">
            <div className="s10-hd" style={{ justifyItems: 'center', textAlign: 'center' }}>
              <h2 className="s10-t s10-h2">{SECTIONS.edit}</h2>
              <p className="s10-sub">{SECTIONS.editLead}</p>
            </div>
            <div className="s10-ew" data-sync>
              <Browser className="only-d" url="beynoun.com/editor"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></Browser>
              <Phone className="only-m"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></Phone>
              <ol className="s10-chips">
                {EDIT_STEPS.map((s, i) => <li key={s.id} className="s10-chip" data-step data-d={s.d} data-m={s.m}><i>{NUM[i]}</i><b>{s.title}</b><span>{s.body}</span></li>)}
              </ol>
            </div>
          </div></div>
        </section>

        <section className="s10-panel s10-ink" style={{ ['--z' as string]: 4 }}>
          <div className="s10-pin"><div className="wrap s10-tg">
            <div className="s10-hd" style={{ marginBottom: 0, justifyItems: 'start' }}>
              <h2 className="s10-t s10-h2">{SECTIONS.tpl}</h2>
              <p className="s10-sub">{SECTIONS.tplLead}</p>
              <a className="s10-b2" href="/templates" style={{ marginTop: 8 }}>كل القوالب</a>
            </div>
            <div className="s10-cols" data-p>
              <div className="s10-col">{[...colA, ...colA].map((t, i) => <span key={i} style={{ display: 'contents' }}>{Card(t)}</span>)}</div>
              <div className="s10-col">{[...colB, ...colB].map((t, i) => <span key={i} style={{ display: 'contents' }}>{Card(t)}</span>)}</div>
            </div>
          </div></div>
        </section>

        <section className="s10-panel" style={{ ['--z' as string]: 5 }}>
          <div className="s10-pin"><div className="wrap s10-fq">
            <div className="s10-hd" style={{ alignContent: 'start', justifyItems: 'start' }}>
              <h2 className="s10-t s10-h2">{SECTIONS.faq}</h2>
              <a className="s10-b2" href="/faq">كل الأسئلة</a>
            </div>
            <Faq />
          </div></div>
        </section>
        <Footer z={6} />
      </main>
      <script dangerouslySetInnerHTML={{ __html: STACK }} />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s10" mode="light" css={CSS}>
      <Header />
      <section className="s10-pr">
        <div className="s10-sheets" aria-hidden>{[0, 1, 2].map((k) => <i key={k} style={{ ['--k' as string]: k }} />)}<b /></div>
        <div className="s10-pword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s10-ht">
            <h1 className="s10-t s10-ph1">{PRICING_HEAD.l1}<br /><span>{PRICING_HEAD.l2}</span></h1>
            <p className="s10-sub">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s10-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s10-pc' + (p.id === 'starter' ? ' hi' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><Amount v={p.amount} /><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <a className={p.id === 'starter' ? 's10-b1' : 's10-b2'} href={p.href}>{p.cta}</a>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.4} />{f}</li>)}</ul>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <main>
        <section className="s10-panel" style={{ ['--z' as string]: 1 }}>
          <div className="s10-pin"><div className="wrap s10-fq">
            <div className="s10-hd" style={{ alignContent: 'start' }}><h2 className="s10-t s10-h2">أسئلة عن الأسعار</h2></div>
            <Faq list={PRICING_FAQS} />
          </div></div>
        </section>
        <Footer z={2} />
      </main>
      <script dangerouslySetInnerHTML={{ __html: STACK }} />
    </Root>
  )
}
