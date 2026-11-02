/**
 * Style 6 — «أفق» (Horizon). The product launch page: dark, quiet, and every
 * moment tied to the scroll. A light breathes over a thin horizon, the
 * laptop lies back and stands up as you scroll, the dashboard is a pinned
 * story whose chapters change the recording, a sentence lights word by word
 * before the templates pan past, and the page lifts like a curtain from a
 * footer whose wordmark is lit from the seam.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft, Laptop, Phone, Browser, Words, Amount } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER, STATEMENT, SECTIONS } from './data'

const CSS = `
.s6{interpolate-size:allow-keywords;--seam:#E2532A}
.s6-main{position:relative;z-index:1;background:var(--bg);border-radius:0 0 clamp(28px,4vw,48px) clamp(28px,4vw,48px);
  box-shadow:0 1px 0 rgba(226,83,42,.55),0 24px 60px -18px rgba(226,83,42,.32)}
.s6 .h{transition:background-color .4s,box-shadow .4s}
.s6.scrolled .h{background:color-mix(in srgb,var(--bg) 74%,transparent);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3);box-shadow:0 1px 0 var(--line)}
.s6 .h-nav a{font-size:16px}
.s6 .h-cta{background:var(--ink);color:var(--bg)}

/* type */
.s6-t{font-family:var(--f-head);font-weight:700;line-height:1.12;letter-spacing:0;text-wrap:balance}
.s6-h2{font-size:clamp(34px,4.6vw,64px)}
.s6-sub{color:var(--mut);font-size:clamp(18px,1.6vw,21px);max-width:46ch;text-wrap:pretty}
.s6-c{text-align:center;display:grid;justify-items:center;gap:14px}
.s6-sec{padding-block:clamp(88px,12vw,168px)}

/* hero */
.s6-hero{position:relative;isolation:isolate;overflow:hidden;margin-top:-64px;padding-top:calc(64px + clamp(56px,9vw,104px))}
.s6-sky{position:absolute;inset:0;z-index:-1;pointer-events:none}
.s6-sky::before{content:"";position:absolute;left:50%;top:-30%;width:min(1400px,180vw);aspect-ratio:2/1;translate:-50% 0;
  background:radial-gradient(closest-side,rgba(226,83,42,.34),rgba(226,83,42,.08) 55%,rgba(226,83,42,0));animation:s6breathe 11s ease-in-out infinite}
.rd.s6:not([data-mode="dark"]) .s6-sky::before{background:radial-gradient(closest-side,rgba(226,83,42,.2),rgba(226,83,42,.05) 55%,rgba(226,83,42,0))}
@keyframes s6breathe{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
.s6-hz{position:absolute;left:0;right:0;top:var(--hz,62%);height:1px;background:linear-gradient(90deg,transparent,var(--line2) 20%,rgba(226,83,42,.7) 50%,var(--line2) 80%,transparent);overflow:hidden}
.s6-hz::after{content:"";position:absolute;top:0;left:-20%;width:18%;height:1px;background:linear-gradient(90deg,transparent,#FFD9C7,transparent);animation:s6glint 7s cubic-bezier(.6,0,.4,1) infinite 1.2s}
@keyframes s6glint{0%{transform:translateX(0)}60%,100%{transform:translateX(700%)}}
.s6-ht{display:grid;justify-items:center;text-align:center;gap:22px}
.s6-claim{display:inline-flex;align-items:center;gap:10px;font-size:15px;color:var(--ink2);padding:6px 14px 6px 16px;border-radius:999px;border:1px solid var(--line2);background:color-mix(in srgb,var(--card) 60%,transparent)}
.s6-claim i{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px rgba(226,83,42,.18)}
.s6-h1{font-size:clamp(54px,9.4vw,136px);line-height:1.05}
.s6-h1 .m{display:inline-block;overflow:hidden;vertical-align:top;padding:.14em .05em .26em;margin:-.14em -.05em -.26em}
.s6-h1 .m>b{display:inline-block;font-weight:inherit}
.rd.js .s6-h1 .m>b{transform:translateY(110%);animation:s6up 1.15s var(--out) forwards;animation-delay:calc(.12s + var(--i)*.13s)}
.s6-h1>span:last-child b{color:var(--acc)}
@keyframes s6up{to{transform:none}}
.rd.js .s6-fade{opacity:0;animation:s6fade 1s var(--out) forwards;animation-delay:var(--d,.6s)}
@keyframes s6fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.s6-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;align-items:center}
.rd .s6-go{display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 10px 0 24px;border-radius:999px;background:var(--acc);color:#FFFBF7;font-weight:600;font-size:18px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 14px 34px -14px rgba(226,83,42,.8);transition:transform .4s var(--out),box-shadow .4s var(--out)}
.rd .s6-go span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.18);transition:transform .4s var(--out)}
.rd .s6-go svg{width:18px;height:18px}
@media (hover:hover){.s6-go:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 20px 40px -14px rgba(226,83,42,.9)}.s6-go:hover span{transform:translate(-3px,-3px)}}
.s6-go:active{transform:scale(.97)}
.s6-ln{font-size:18px;font-weight:600;color:var(--ink);padding:8px 6px;background:linear-gradient(currentColor,currentColor) 0 100%/100% 1px no-repeat;transition:background-size .4s var(--out)}
.s6-ln:hover{background-size:0 1px;background-position:100% 100%}
.s6-dev{position:relative;margin-top:clamp(48px,7vw,88px);perspective:1800px}
.s6-tilt{transform-origin:50% 100%;transform:rotateX(calc((1 - var(--p,1)) * 34deg)) scale(calc(.8 + var(--p,1) * .2));will-change:transform}
.s6-dev .dv-lap{width:min(1060px,100%);margin-inline:auto}
.s6-dev .dv-ph{width:min(300px,76%);margin-inline:auto}
.s6-floor{position:absolute;left:50%;bottom:-12%;width:120%;height:40%;translate:-50% 0;z-index:-1;background:radial-gradient(closest-side,rgba(226,83,42,.28),transparent);filter:blur(10px)}

/* reviews */
.s6-rev{display:grid;justify-items:center;gap:30px;text-align:center}
.s6-rev h2{font-size:clamp(18px,1.6vw,20px);font-family:var(--f-ui);font-weight:600;color:var(--mut)}
.s6-q{display:grid;width:100%;max-width:980px}
.s6-q figure{grid-area:1/1;display:grid;justify-items:center;gap:22px;opacity:0;filter:blur(10px);transform:translateY(14px);transition:opacity .9s var(--out),filter .9s var(--out),transform .9s var(--out);pointer-events:none}
.s6-q figure.on{opacity:1;filter:none;transform:none;pointer-events:auto}
.s6-q blockquote{font-family:var(--f-head);font-weight:700;font-size:clamp(32px,4.8vw,64px);line-height:1.25;text-wrap:balance}
.s6-q figcaption{display:flex;align-items:center;gap:12px;font-size:16px;color:var(--mut)}
.s6-q figcaption b{color:var(--ink);font-weight:600}
.s6-q figcaption em{font-style:normal;font-size:13px;color:var(--acc-ink);border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);border-radius:999px;padding:2px 10px}
.s6-dots{display:flex;gap:8px}
.s6-dots button{width:22px;height:3px;border-radius:3px;background:var(--line2);transition:width .5s var(--out),background-color .3s}
.s6-dots button[aria-current="true"]{width:44px;background:var(--acc)}
.s6-rev .note{text-align:start}

/* dashboard: pinned chapters */
.s6-dash{position:relative;height:calc(var(--n) * 82svh)}
.s6-stick{position:sticky;top:0;height:100svh;display:grid;align-content:center;padding-top:64px}
.s6-dg{display:grid;gap:28px;align-items:center}
.s6-chs{display:grid;gap:4px;position:relative;padding-inline-start:26px}
.s6-chs::before,.s6-chs::after{content:"";position:absolute;inset-inline-start:0;top:6px;bottom:6px;width:2px;border-radius:2px;background:var(--line2)}
.s6-chs::after{background:var(--acc);bottom:auto;height:calc((100% - 12px) * var(--p,0))}
.rd .s6-ch{display:grid;text-align:start;padding:10px 0;color:var(--mut2);transition:color .5s}
.s6-ch strong{font-family:var(--f-head);font-size:clamp(26px,2.6vw,36px);line-height:1.2;font-weight:700}
.s6-ch span{display:grid;grid-template-rows:0fr;opacity:0;font-size:17px;color:var(--mut);transition:grid-template-rows .6s var(--out),opacity .6s,margin .6s;max-width:38ch}
.s6-ch span>i{overflow:hidden;font-style:normal}
.s6-ch.on{color:var(--ink)}
.s6-ch.on span{grid-template-rows:1fr;opacity:1;margin-top:6px}
.s6-dhead{display:grid;gap:12px;margin-bottom:22px}
.s6-dm .dv-ph{width:min(240px,56vw);margin-inline:auto}
.s6-mch{display:none}
@media (max-width:899px){
  .s6-dg{gap:18px}
  .s6-dhead{text-align:center;justify-items:center;margin-bottom:6px}
  .s6-dhead .s6-sub{display:none}
  .s6-chs{display:none}
  .s6-mch{display:grid;justify-items:center;text-align:center;gap:6px;min-height:104px}
  .s6-mch p{display:none}
  .s6-mch p.on{display:grid;gap:4px;animation:s6fade .6s var(--out)}
  .s6-mch strong{font-family:var(--f-head);font-size:26px;font-weight:700;line-height:1.2}
  .s6-mch span{font-size:16px;color:var(--mut);max-width:32ch}
  .s6-mdots{display:flex;gap:6px;justify-content:center}
  .s6-mdots i{width:6px;height:6px;border-radius:50%;background:var(--line2);transition:background-color .3s,width .4s var(--out)}
  .s6-dash[data-at="0"] .s6-mdots i:nth-child(1),.s6-dash[data-at="1"] .s6-mdots i:nth-child(2),.s6-dash[data-at="2"] .s6-mdots i:nth-child(3),.s6-dash[data-at="3"] .s6-mdots i:nth-child(4),.s6-dash[data-at="4"] .s6-mdots i:nth-child(5){background:var(--acc);width:18px;border-radius:3px}
}
@media (min-width:900px){.s6-dg{grid-template-columns:minmax(0,.8fr) minmax(0,1.5fr);gap:56px}}

/* statement + templates pan */
.s6-pan{position:relative;height:300svh}
.s6-pan .s6-stick{align-content:center;gap:clamp(28px,4vh,56px);overflow:hidden}
.s6-stmt{font-family:var(--f-head);font-weight:700;font-size:clamp(26px,3.3vw,48px);line-height:1.32;max-width:26ch;text-wrap:balance}
.s6-stmt .w{opacity:calc(.14 + .86 * clamp(0, (var(--p,1) * 3.2 - var(--w) / var(--n)) * 5, 1));transition:opacity .2s linear}
.s6-ph{display:flex;align-items:end;justify-content:space-between;gap:18px}
.s6-ph h2{font-size:clamp(24px,2.4vw,32px)}
.s6-ph a{font-size:17px}
.s6-track{--cw:clamp(168px,14vw,210px);--g:clamp(14px,1.6vw,22px);display:flex;gap:var(--g);width:max-content;padding-inline:var(--gut);
  transform:translateX(calc(max(0px, 8 * (var(--cw) + var(--g)) + var(--gut) - 100vw) * clamp(0, (var(--p,0) - .3) / .62, 1)))}
.s6-card{width:var(--cw);display:grid;gap:10px}
.s6-card .dv-ph{width:100%;transition:transform .6s var(--out)}
.s6-card strong{font-size:17px;font-weight:600}
.s6-card small{display:block;font-size:14px;color:var(--mut)}
.s6-card em{font-style:normal;font-size:12px;color:var(--acc-ink);margin-inline-start:6px}
@media (hover:hover){.s6-card:hover .dv-ph{transform:translateY(-8px)}}

/* editor */
.s6-edit{background:var(--bg2);border-block:1px solid var(--line)}
.s6-eg{display:grid;gap:clamp(36px,5vw,64px);margin-top:clamp(40px,5vw,64px)}
.s6-ef .dv-win{max-width:1060px;margin-inline:auto}
.s6-ef .dv-ph{width:min(280px,72vw);margin-inline:auto}
.s6-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(10px,2vw,28px);counter-reset:s}
.s6-st{display:grid;gap:6px;text-align:start;cursor:pointer;color:var(--mut2);transition:color .4s}
.s6-st b{font-family:var(--f-head);font-size:clamp(24px,2.4vw,34px);line-height:1.1;font-weight:700}
.s6-st span{font-size:16px;color:var(--mut)}
.s6-st i{display:block;height:2px;border-radius:2px;background:var(--line2);overflow:hidden;position:relative;margin-bottom:8px}
.s6-st i::after{content:"";position:absolute;inset:0;background:var(--acc);transform:scaleX(0);transform-origin:right}
.s6-st.done i::after{transform:none}
.s6-st.on i::after{animation:s6load 3.2s linear infinite}
@keyframes s6load{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.s6-st.on,.s6-st.done{color:var(--ink)}
@media (max-width:767px){.s6-st span{display:none}.s6-st b{font-size:22px}}

/* faq */
.s6-fq{display:grid;gap:36px}
@media (min-width:900px){.s6-fq{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:64px}.s6-fh{position:sticky;top:120px;align-self:start}}
.s6-fh{display:grid;gap:18px;justify-items:start}
.s6-faq details{border-bottom:1px solid var(--line2)}
.s6-faq details:first-child{border-top:1px solid var(--line2)}
.s6-faq summary{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px 0;font-size:clamp(19px,1.7vw,22px);font-weight:600}
.s6-faq summary svg{flex:none;width:22px;height:22px;transition:transform .5s var(--out);color:var(--mut)}
.s6-faq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s6-faq details::details-content{block-size:0;overflow:hidden;transition:block-size .5s var(--out),content-visibility .5s allow-discrete}
.s6-faq details[open]::details-content{block-size:auto}
.s6-faq p{padding:0 0 24px;color:var(--mut);max-width:62ch}

/* footer: the page lifts, the seam lights the wordmark */
.s6-foot{--bg:#0B0A08;--ink:#F4EFE6;--ink2:#DAD1C4;--mut:#A39A8D;--line:rgba(244,239,230,.09);--line2:rgba(244,239,230,.16);
  position:relative;z-index:0;margin-top:-48px;padding-top:48px;background:#0B0A08;color:var(--ink);overflow:hidden}
.s6-fin{transform:translateY(calc((1 - var(--p,1)) * -26%))}
.s6-word{position:relative;padding:clamp(18px,3vw,36px) var(--gut) 0;display:grid;justify-items:center}
.s6-word svg{width:min(1180px,100%);height:auto;color:#F4EFE6;
  -webkit-mask-image:linear-gradient(to bottom,#000 calc(var(--p,1) * 130% - 30%),rgba(0,0,0,.08) calc(var(--p,1) * 130%));mask-image:linear-gradient(to bottom,#000 calc(var(--p,1) * 130% - 30%),rgba(0,0,0,.08) calc(var(--p,1) * 130%))}
.s6-word::before{content:"";position:absolute;top:0;left:10%;right:10%;height:60%;background:radial-gradient(50% 100% at 50% 0%,rgba(226,83,42,.32),transparent);pointer-events:none}
.s6-fb{display:grid;gap:40px;padding-block:clamp(48px,6vw,80px) 28px}
@media (min-width:900px){.s6-fb{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);align-items:start}}
.s6-fbr{display:grid;gap:18px;justify-items:start}
.s6-fbr p{color:var(--mut);max-width:40ch}
.s6-foot .fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
@media (min-width:600px){.s6-foot .fl{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s6-foot .fl-h{font-size:14px;color:var(--mut);margin-bottom:10px}
.s6-foot .fl ul{display:grid;gap:8px}
.s6-foot .fl a{color:var(--ink2);font-size:17px;transition:color .2s}
.s6-foot .fl a:hover{color:#fff}
.s6-foot .fc{display:grid;gap:4px;justify-items:start}
.s6-foot .fc a{color:var(--ink2)}
.s6-fbase{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;align-items:center;padding-block:22px 34px;border-top:1px solid var(--line);font-size:14px;color:var(--mut)}
.s6-foot .fs{display:flex;flex-wrap:wrap;gap:16px}
.s6-foot .fs a:hover{color:#fff}

/* pricing */
.s6-pr{position:relative;isolation:isolate;overflow:hidden;margin-top:-64px;padding-top:calc(64px + clamp(48px,7vw,88px));padding-bottom:clamp(72px,9vw,120px)}
.s6-pword{position:absolute;inset-inline:0;top:calc(64px + 2vw);text-align:center;font-family:var(--f-head);font-weight:700;font-size:clamp(120px,26vw,380px);line-height:1;z-index:-1;pointer-events:none;
  color:transparent;background:linear-gradient(180deg,color-mix(in srgb,var(--ink) 14%,transparent),transparent 78%);-webkit-background-clip:text;background-clip:text}
.s6-ph1{font-size:clamp(40px,6vw,80px);line-height:1.12}
.s6-ph1 span{display:block;color:var(--mut)}
.s6-cards{display:grid;gap:18px;margin-top:clamp(44px,6vw,72px);align-items:stretch}
@media (min-width:960px){.s6-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
@property --s6a{syntax:"<angle>";inherits:false;initial-value:0deg}
.s6-pc{position:relative;display:grid;align-content:start;gap:18px;padding:clamp(24px,2.6vw,34px);border-radius:28px;
  background:linear-gradient(180deg,color-mix(in srgb,var(--card) 92%,transparent),color-mix(in srgb,var(--card) 70%,transparent));
  border:1px solid var(--line2);box-shadow:inset 0 1px 0 rgba(255,255,255,.06);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.s6-pc.hi{border:1px solid transparent;
  background:linear-gradient(var(--card),var(--card)) padding-box,conic-gradient(from var(--s6a),var(--line2) 0 62%,#E2532A 76%,#FFC9B0 82%,#E2532A 88%,var(--line2) 96%) border-box;
  animation:s6spin 7s linear infinite;box-shadow:0 30px 80px -40px rgba(226,83,42,.55)}
@keyframes s6spin{to{--s6a:360deg}}
.s6-pc .nm{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:20px;font-weight:600}
.s6-pc .badge{font-size:13px;font-weight:600;color:#FFFBF7;background:var(--acc);border-radius:999px;padding:3px 10px}
.s6-pc .amt{display:flex;align-items:baseline;gap:8px}
.s6-pc .amt-v{font-family:var(--f-head);font-weight:700;font-size:clamp(52px,5vw,68px);line-height:1}
.s6-pc .cur{font-size:.45em;vertical-align:.9em;margin-inline-end:2px;color:var(--mut)}
.s6-pc .dec{font-size:.45em;color:var(--mut)}
.s6-pc .amt small{color:var(--mut);font-size:16px}
.s6-pc .sub{color:var(--mut);font-size:17px}
.s6-pc ul{display:grid;gap:10px;padding-top:18px;border-top:1px solid var(--line)}
.s6-pc li{display:grid;grid-template-columns:20px 1fr;gap:10px;font-size:16.5px;line-height:1.6}
.s6-pc li svg{width:16px;height:16px;margin-top:5px;color:var(--acc)}
.s6-pc .btn{width:100%;margin-top:4px}
.s6-pc.hi .btn{background:var(--acc);color:#FFFBF7}
.s6-pc:not(.hi) .btn{border:1px solid var(--line2)}
.s6-pc .ft{font-size:14px;color:var(--mut);text-align:center}

@media (prefers-reduced-motion:reduce){
  .s6-tilt{transform:none}
  .s6-track{transform:none;flex-wrap:wrap;width:auto}
  .s6-pan{height:auto}.s6-pan .s6-stick{position:static;height:auto;padding-block:96px}
  .s6-stmt .w{opacity:1}
  .s6-fin{transform:none}.s6-word svg{-webkit-mask-image:none;mask-image:none}
}
`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s6-faq">{list.map((f) => <details key={f.q}><summary>{f.q}<Plus strokeWidth={1.6} /></summary><p>{f.a}</p></details>)}</div>
}

function Footer() {
  return (
    <footer className="s6-foot" data-p="end">
      <div className="s6-fin">
        <div className="s6-word" data-p="rise" aria-hidden><Mark /></div>
        <div className="wrap s6-fb">
          <div className="s6-fbr">
            <p>{FOOTER.claim}</p>
            <a className="s6-go" href={HERO.primary.href}>{HERO.primary.label}<span><ArrowUpLeft /></span></a>
            <Contact />
          </div>
          <FooterLinks />
        </div>
        <div className="wrap s6-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
      </div>
    </footer>
  )
}

export function Home() {
  return (
    <Root id="s6" mode="dark" css={CSS}>
      <div className="s6-main">
        <Header />
        <section className="s6-hero">
          <div className="s6-sky" aria-hidden><div className="s6-hz" /></div>
          <div className="wrap s6-ht">
            <p className="s6-claim s6-fade" style={{ ['--d' as string]: '.05s' }}><i />{HERO.claim}</p>
            <h1 className="s6-t s6-h1">{HERO.words.map((w, i) => <span key={w}><span className="m"><b style={{ ['--i' as string]: i }}>{w}.</b></span>{i < 2 ? ' ' : ''}</span>)}</h1>
            <p className="s6-sub s6-fade" style={{ ['--d' as string]: '.62s' }}>{HERO.sub}</p>
            <div className="s6-ctas s6-fade" style={{ ['--d' as string]: '.78s' }}>
              <a className="s6-go" href={HERO.primary.href}>{HERO.primary.label}<span><ArrowUpLeft /></span></a>
              <a className="s6-ln" href={HERO.secondary.href}>{HERO.secondary.label}</a>
            </div>
          </div>
          <div className="wrap s6-dev s6-fade" data-p="enter" style={{ ['--d' as string]: '.95s' }}>
            <div className="s6-floor" aria-hidden />
            <div className="s6-tilt">
              <Laptop className="only-d"><Vid v={DASH_D} kind="d" label="جولة في لوحة تحكم بينون" /></Laptop>
              <Phone className="only-m"><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone>
            </div>
          </div>
        </section>

        <section className="s6-sec">
          <div className="wrap s6-rev">
            <h2 data-r>{SECTIONS.reviews}</h2>
            <div className="s6-rot" data-rotate="5400" style={{ display: 'grid', justifyItems: 'center', gap: 30, width: '100%' }}>
              <div className="s6-q">
                {REVIEWS.map((r, i) => (
                  <figure key={i} data-item>
                    <Stars n={r.rating} />
                    <blockquote>«{r.body}»</blockquote>
                    <figcaption><b>{r.name}</b><em>بانتظار موافقتك</em></figcaption>
                  </figure>
                ))}
              </div>
              <div className="s6-dots">{REVIEWS.map((r, i) => <button key={i} type="button" data-dot aria-label={'رأي ' + (i + 1)} />)}</div>
            </div>
            <p className="note">{REVIEWS_NOTE}</p>
          </div>
        </section>

        <section className="s6-dash" data-p="pin" data-steps style={{ ['--n' as string]: DASH_FEATURES.length }}>
          <div className="s6-stick">
            <div className="wrap s6-dg">
              <div>
                <div className="s6-dhead">
                  <h2 className="s6-t s6-h2">{SECTIONS.dash}</h2>
                  <p className="s6-sub">{SECTIONS.dashLead}</p>
                </div>
                <div className="s6-chs">
                  {DASH_FEATURES.map((f) => (
                    <button key={f.id} type="button" className="s6-ch" data-chap data-d={f.d.join(',')} data-m={f.m.join(',')}>
                      <strong>{f.title}</strong><span><i>{f.body}</i></span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Laptop className="only-d"><Vid v={DASH_D} kind="d" seg={DASH_FEATURES[0].d} label="لوحة تحكم بينون" /></Laptop>
                <div className="only-m s6-dm"><Phone><Vid v={DASH_M} kind="m" seg={DASH_FEATURES[0].m} label="لوحة تحكم بينون على الهاتف" /></Phone></div>
              </div>
              <div className="s6-mch" aria-live="polite">
                {DASH_FEATURES.map((f, i) => <p key={f.id} className={i === 0 ? 'on' : ''} data-mirror={i}><strong>{f.title}</strong><span>{f.body}</span></p>)}
                <div className="s6-mdots" aria-hidden>{DASH_FEATURES.map((f) => <i key={f.id} />)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="s6-edit s6-sec">
          <div className="wrap">
            <div className="s6-c" data-r>
              <h2 className="s6-t s6-h2">{SECTIONS.edit}</h2>
              <p className="s6-sub">{SECTIONS.editLead}</p>
            </div>
            <div className="s6-eg" data-sync>
              <div className="s6-ef" data-r>
                <Browser className="only-d" url="beynoun.com/editor"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></Browser>
                <Phone className="only-m"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></Phone>
              </div>
              <ol className="s6-steps">
                {EDIT_STEPS.map((s) => <li key={s.id} className="s6-st" data-step data-d={s.d} data-m={s.m}><i /><b>{s.title}</b><span>{s.body}</span></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className="s6-pan" data-p="pin">
          <div className="s6-stick">
            <div className="wrap"><p className="s6-stmt"><Words text={STATEMENT} /></p></div>
            <div className="wrap s6-ph"><h2 className="s6-t">{SECTIONS.tpl}</h2><a className="s6-ln" href="/templates">كل القوالب</a></div>
            <div className="s6-track">
              {TEMPLATES.map((t) => (
                <a key={t.id} className="s6-card" href={t.href}>
                  <Phone><img src={phoneShot(t.id)} alt={t.name} loading="lazy" /></Phone>
                  <span><strong>{t.name}</strong>{'soon' in t && t.soon ? <em>قريبًا</em> : null}<small>{t.tag}</small></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="s6-sec">
          <div className="wrap s6-fq">
            <div className="s6-fh" data-r>
              <h2 className="s6-t s6-h2">{SECTIONS.faq}</h2>
              <a className="s6-ln" href="/faq">كل الأسئلة</a>
            </div>
            <div data-r><Faq /></div>
          </div>
        </section>
      </div>
      <Footer />
      <script dangerouslySetInnerHTML={{ __html: MIRROR }} />
    </Root>
  )
}

/* The phone shows one chapter at a time under the recording: copy the
   chapter state onto the mirrored captions. */
const MIRROR = `(function(){var s=document.currentScript.parentElement.querySelector('.s6-dash');if(!s)return;var ps=s.querySelectorAll('[data-mirror]');
new MutationObserver(function(){var a=s.getAttribute('data-at');ps.forEach(function(p){p.classList.toggle('on',p.getAttribute('data-mirror')===a)})}).observe(s,{attributes:true,attributeFilter:['data-at']})})()`

export function Pricing() {
  return (
    <Root id="s6" mode="dark" css={CSS}>
      <div className="s6-main">
        <Header />
        <section className="s6-pr">
          <div className="s6-sky" aria-hidden><div className="s6-hz" style={{ ['--hz' as string]: '46%' }} /></div>
          <div className="s6-pword" aria-hidden>الأسعار</div>
          <div className="wrap">
            <div className="s6-c">
              <h1 className="s6-t s6-ph1">{PRICING_HEAD.l1}<span>{PRICING_HEAD.l2}</span></h1>
              <p className="s6-sub">{PRICING_HEAD.sub}</p>
            </div>
            <div className="s6-cards">
              {PLANS.map((p, i) => (
                <article key={p.id} className={'s6-pc' + (p.id === 'starter' ? ' hi' : '')} data-r style={{ ['--i' as string]: i }}>
                  <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                  <p className="amt"><Amount v={p.amount} /><small>{p.per}</small></p>
                  <p className="sub">{p.sub}</p>
                  <a className="btn" href={p.href}>{p.cta}</a>
                  <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.4} />{f}</li>)}</ul>
                  <p className="ft">{p.foot}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="s6-sec" style={{ paddingTop: 0 }}>
          <div className="wrap s6-fq">
            <div className="s6-fh"><h2 className="s6-t s6-h2">أسئلة عن الأسعار</h2></div>
            <Faq list={PRICING_FAQS} />
          </div>
        </section>
      </div>
      <Footer />
    </Root>
  )
}

