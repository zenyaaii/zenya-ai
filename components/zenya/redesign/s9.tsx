/**
 * Style 9 — «فجر» (Dawn). Bright and confident: a slanted band of slowly
 * moving warm colour opens the page, the product floats in layers that
 * shift with the pointer, the dashboard sits in a browser whose tabs are the
 * features, the editor steps lift like cards, the templates turn on a
 * coverflow, and the footer's wordmark sits across the seam where the same
 * colour band meets the dark base.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft, Laptop, Phone, Amount } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, wideShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER, SECTIONS } from './data'

const NUM = ['١', '٢', '٣', '٤']
const ChevR = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
const ChevL = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 6-6 6 6 6" /></svg>

const CSS = `
.s9{interpolate-size:allow-keywords;--c1:#E2532A;--c2:#F2A65A;--c3:#EE8C7E;--c4:#F7D9B8;--c5:#C9442A;--soft:0 1px 2px rgba(60,30,15,.06),0 18px 50px -20px rgba(120,50,20,.28)}
.rd.s9[data-mode="dark"]{--c4:#5A2A18;--soft:0 1px 2px rgba(0,0,0,.4),0 18px 50px -20px rgba(0,0,0,.7)}
.s9 .h{background:transparent;transition:background-color .4s,box-shadow .4s}
.s9.scrolled .h{background:color-mix(in srgb,var(--bg) 80%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 1px 0 var(--line)}
.s9 .h-nav a{font-size:16.5px;font-weight:600;color:var(--ink)}
.s9 .h-cta{background:var(--ink);color:var(--bg)}

.s9-t{font-family:var(--f-head);font-weight:700;line-height:1.12;letter-spacing:0;text-wrap:balance}
.s9-h2{font-size:clamp(34px,4.6vw,62px)}
.s9-sub{color:var(--ink2);font-size:clamp(18px,1.6vw,21px);max-width:44ch;text-wrap:pretty}
.s9-sec{padding-block:clamp(88px,11vw,150px)}
.s9-hd{display:grid;gap:14px;margin-bottom:clamp(36px,5vw,60px)}

/* the band */
.s9-band{position:absolute;inset:0 0 auto;height:var(--bh,100%);z-index:-1;overflow:hidden;clip-path:polygon(0 0,100% 0,100% var(--cut,74%),0 100%);background:var(--c4)}
.s9-band i{position:absolute;width:62vw;aspect-ratio:1;border-radius:50%;filter:blur(70px);opacity:.9;animation:s9m 18s ease-in-out infinite alternate}
.s9-band i:nth-child(1){background:var(--c1);top:-30%;right:-8%;animation-duration:19s}
.s9-band i:nth-child(2){background:var(--c2);top:10%;right:30%;animation-duration:23s;animation-delay:-6s}
.s9-band i:nth-child(3){background:var(--c3);top:-40%;left:-10%;animation-duration:17s;animation-delay:-3s}
.s9-band i:nth-child(4){background:var(--c5);top:35%;left:20%;width:40vw;animation-duration:21s;animation-delay:-9s;opacity:.6}
@media (max-width:767px){.s9-band i{width:120vw}.s9-band i:nth-child(4){width:80vw}}
@keyframes s9m{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-8vw,6vh) scale(1.15)}100%{transform:translate(6vw,-4vh) scale(.95)}}
.s9-band::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0),color-mix(in srgb,var(--bg) 35%,transparent));mix-blend-mode:normal}
.s9-grain::before{content:"";position:absolute;inset:0;z-index:1;opacity:.22;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}

/* hero */
.s9-hero{position:relative;isolation:isolate;margin-top:-64px;padding-top:calc(64px + clamp(40px,6vw,88px));padding-bottom:clamp(40px,5vw,72px)}
.s9-hg{display:grid;gap:clamp(36px,5vw,56px);align-items:center}
@media (min-width:1000px){.s9-hg{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr)}}
.s9-htxt{display:grid;gap:24px;justify-items:start}
.s9-claim{font-size:15.5px;font-weight:600;color:var(--ink);background:color-mix(in srgb,var(--bg) 55%,transparent);border-radius:999px;padding:5px 14px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.s9-h1{font-size:clamp(56px,8.4vw,120px);line-height:1.06}
.s9-h1 span{display:inline-block}
.rd.js .s9-h1 span{opacity:0;transform:translateY(30px) rotate(-2deg);animation:s9in 1s cubic-bezier(.2,.9,.25,1.15) forwards;animation-delay:calc(.12s + var(--i)*.12s)}
@keyframes s9in{to{opacity:1;transform:none}}
.rd.js .s9-fade{opacity:0;animation:s9f .9s var(--out) forwards;animation-delay:var(--d,.55s)}
@keyframes s9f{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.s9-ctas{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.rd .s9-b1{display:inline-flex;align-items:center;gap:8px;height:52px;padding:0 24px;border-radius:999px;background:var(--ink);color:var(--bg);font-weight:600;font-size:18px;box-shadow:0 10px 30px -12px rgba(22,18,13,.6);transition:transform .35s var(--out),box-shadow .35s var(--out)}
.rd .s9-b1 svg{width:18px;height:18px;transition:transform .35s var(--out)}
.rd .s9-b1:hover{transform:translateY(-2px)}.rd .s9-b1:hover svg{transform:translate(-3px,-3px)}
.rd .s9-b2{display:inline-flex;align-items:center;height:52px;padding:0 22px;border-radius:999px;background:color-mix(in srgb,var(--card) 70%,transparent);color:var(--ink);font-weight:600;font-size:18px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px var(--line2)}
.rd .s9-b1:active,.rd .s9-b2:active{transform:scale(.97)}

/* layered product */
.s9-stack{position:relative;height:clamp(420px,46vw,620px)}
.s9-ly{position:absolute;transition:transform 1s var(--out)}
.s9-ly.a{inset-inline-end:0;top:4%;width:88%;transform:translate(calc(var(--tx,0) * 10px),calc(var(--ty,0) * 8px))}
.s9-ly.b{inset-inline-start:2%;bottom:0;width:31%;transform:translate(calc(var(--tx,0) * 26px),calc(var(--ty,0) * 20px))}
.s9-ly.c{inset-inline-end:6%;bottom:2%;width:34%;transform:translate(calc(var(--tx,0) * 18px),calc(var(--ty,0) * 14px))}
.s9-ly.a .dv-lap{box-shadow:var(--soft)}
.s9-chip{border-radius:16px;overflow:hidden;background:var(--card);box-shadow:var(--soft);animation:s9float 7s ease-in-out infinite}
.s9-chip img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top}
.s9-chip p{padding:10px 14px;font-size:14.5px;display:flex;justify-content:space-between;gap:8px}
.s9-chip p span{color:var(--mut)}
@keyframes s9float{50%{transform:translateY(-10px)}}
.s9-ly.b .dv-ph{animation:s9float 8s ease-in-out infinite -2s}
@media (max-width:999px){
  .s9-stack{height:auto;display:grid;justify-items:center}
  .s9-ly{position:relative;inset:auto!important;transform:none}
  .s9-ly.a,.s9-ly.c{display:none}
  .s9-ly.b{width:min(270px,70vw)}
}

/* reviews: one moving row */
.s9-rv{position:relative;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.s9-rt{display:flex;gap:18px;width:max-content;animation:s9mq 46s linear infinite;padding-block:18px 30px}
.s9-rv:hover .s9-rt{animation-play-state:paused}
@keyframes s9mq{to{transform:translateX(50%)}}
.s9-rc{width:min(420px,78vw);display:grid;gap:16px;align-content:space-between;padding:26px;border-radius:22px;background:var(--card);box-shadow:var(--soft)}
.s9-rc blockquote{font-family:var(--f-head);font-weight:700;font-size:clamp(22px,2vw,27px);line-height:1.35}
.s9-rc figcaption{display:flex;align-items:center;justify-content:space-between;font-size:15px;color:var(--mut)}
.s9-rc figcaption b{color:var(--ink);font-weight:600}
.s9-rc em{font-style:normal;font-size:13px;font-weight:600;color:var(--acc-ink);background:var(--acc-soft);border-radius:999px;padding:2px 10px}

/* dashboard: a browser whose tabs are the features */
.s9-dash{display:grid;gap:18px}
.s9-win{border-radius:18px;overflow:hidden;background:var(--card);box-shadow:var(--soft),0 0 0 1px var(--line)}
.s9-tabs{display:flex;align-items:end;gap:2px;padding:10px 12px 0;background:var(--card3);overflow-x:auto;scrollbar-width:none}
.s9-tabs::-webkit-scrollbar{display:none}
.rd .s9-tab{position:relative;flex:none;display:flex;align-items:center;gap:8px;height:40px;padding:0 18px;border-radius:12px 12px 0 0;font-size:15.5px;font-weight:600;color:var(--mut);transition:background-color .3s,color .3s;white-space:nowrap}
.rd .s9-tab::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--line2);transition:background-color .3s}
.s9-tab[aria-selected="true"]{background:var(--card);color:var(--ink)}
.s9-tab[aria-selected="true"]::before{background:var(--acc)}
.s9-tab i{position:absolute;inset-inline:14px;bottom:0;height:2px;background:var(--acc);transform-origin:right;transform:scaleX(var(--p,0));opacity:0}
.s9-tab[aria-selected="true"] i{opacity:1}
.s9-url{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);font-size:13px;color:var(--mut);direction:ltr}
.s9-url span{flex:1;background:var(--card2);border-radius:999px;padding:5px 14px}
.s9-win .dv-scr{border-radius:0}
.s9-dm{display:grid;justify-items:center;padding:22px;background:linear-gradient(180deg,var(--card2),var(--card))}
.s9-dm .dv-ph{width:min(260px,66vw)}
.s9-dp{color:var(--mut);text-align:center;max-width:52ch;margin-inline:auto;min-height:3.4em}

/* editor: steps lift like cards */
.s9-eg{display:grid;gap:clamp(28px,4vw,48px);align-items:center}
@media (min-width:1000px){.s9-eg{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr)}}
.s9-steps{display:grid;gap:10px}
.s9-sc{display:grid;grid-template-columns:44px 1fr;column-gap:16px;align-items:center;padding:16px 18px;border-radius:18px;cursor:pointer;transition:background-color .5s,box-shadow .5s,transform .5s var(--out)}
.s9-sc i{grid-row:span 2;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-style:normal;font-family:var(--f-head);font-weight:700;font-size:22px;background:var(--card2);color:var(--mut);transition:background-color .5s,color .5s}
.s9-sc b{font-family:var(--f-head);font-size:24px;font-weight:700;line-height:1.2}
.s9-sc span{font-size:16px;color:var(--mut)}
.s9-sc.on{background:var(--card);box-shadow:var(--soft);transform:translateX(-6px)}
.s9-sc.on i{background:var(--acc);color:#FFFBF7}
.s9-sc.done i{background:var(--ink);color:var(--bg)}
.s9-ev .dv-lap{width:100%}
.s9-ev .dv-ph{width:min(270px,70vw);margin-inline:auto}
@media (max-width:999px){.s9-steps{grid-template-columns:1fr 1fr}.s9-sc{grid-template-columns:36px 1fr;padding:12px}.s9-sc i{width:36px;height:36px;font-size:18px}.s9-sc span{display:none}.s9-sc b{font-size:20px}.s9-sc.on{transform:none}}

/* templates: coverflow */
.s9-cf{position:relative}
.s9-rail{display:flex;gap:0;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-block:30px 10px;perspective:1200px;padding-inline:calc(50% - var(--cw)/2);--cw:clamp(200px,22vw,280px)}
.s9-rail::-webkit-scrollbar{display:none}
.s9-fi{flex:none;width:var(--cw);scroll-snap-align:center;display:grid;gap:14px;justify-items:center;
  transform:rotateY(calc(max(-1, min(1, var(--d,0))) * -38deg)) scale(calc(1 - min(1, var(--ad,0)) * .16)) translateZ(calc(min(1, var(--ad,0)) * -40px));
  opacity:calc(1 - min(.85, max(0, var(--ad,0) - 1.4)));transition:transform .15s linear}
.s9-fi.mid{z-index:2}
.s9-fi .dv-ph{width:86%}
.s9-fi .cap{text-align:center;display:grid;opacity:0;transition:opacity .4s}
.s9-fi.mid .cap{opacity:1}
.s9-fi .cap strong{font-family:var(--f-head);font-size:22px;font-weight:700}
.s9-fi .cap small{font-size:14px;color:var(--mut)}
.s9-fi .cap em{font-style:normal;font-size:12px;color:var(--acc-ink)}
.s9-nav{display:flex;justify-content:center;gap:10px;margin-top:10px}
.rd .s9-nav button{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--card);box-shadow:var(--soft),0 0 0 1px var(--line);transition:transform .3s var(--out)}
.rd .s9-nav button:active{transform:scale(.94)}

/* faq */
.s9-faq{display:grid;gap:12px}
@media (min-width:900px){.s9-faq{grid-template-columns:1fr 1fr;align-items:start}}
.s9-faq details{border-radius:18px;background:var(--card);box-shadow:0 0 0 1px var(--line);padding:0 22px;transition:box-shadow .4s}
.s9-faq details[open]{box-shadow:var(--soft),0 0 0 1px var(--line)}
.s9-faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0;font-size:18.5px;font-weight:600}
.s9-faq summary svg{flex:none;width:20px;height:20px;color:var(--acc);transition:transform .5s var(--out)}
.s9-faq details[open] summary svg{transform:rotate(45deg)}
.s9-faq details::details-content{block-size:0;overflow:hidden;transition:block-size .5s var(--out),content-visibility .5s allow-discrete}
.s9-faq details[open]::details-content{block-size:auto}
.s9-faq p{padding:0 0 20px;color:var(--mut);font-size:17px}

/* footer: the wordmark sits across the seam */
.s9-foot{position:relative;isolation:isolate;margin-top:clamp(40px,6vw,80px);background:#16120D;color:#F4EFE6;--mut:#A39A8D;--ink2:#DAD1C4;--line:rgba(244,239,230,.1)}
.s9-ftop{position:relative;height:clamp(150px,17vw,250px);background:var(--bg)}
.s9-ftop .s9-band{--cut:100%;z-index:0;clip-path:polygon(0 0,100% 34%,100% 100%,0 100%);height:100%;background:#E2532A}
.rd.s9 .s9-ftop .s9-band::after{background:linear-gradient(180deg,transparent 40%,rgba(22,18,13,.35))}
.s9-fwm{position:absolute;inset-inline:var(--gut);bottom:0;translate:0 42%;display:grid;justify-items:center;z-index:2}
.s9-fwm svg{width:min(1100px,100%);height:auto;color:#FFF8F2;filter:drop-shadow(0 18px 30px rgba(22,18,13,.35))}
.s9-fb{display:grid;gap:40px;padding-block:clamp(90px,10vw,150px) 28px}
@media (min-width:900px){.s9-fb{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)}}
.s9-fbr{display:grid;gap:18px;justify-items:start}
.s9-fbr p{color:var(--mut);max-width:40ch}
.rd .s9-foot .s9-b1{background:#F4EFE6;color:#16120D}
.s9-foot .fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
@media (min-width:600px){.s9-foot .fl{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s9-foot .fl-h{font-size:14px;color:var(--mut);margin-bottom:10px}
.s9-foot .fl ul{display:grid;gap:8px}
.s9-foot .fl a{color:var(--ink2);font-size:17px}
.s9-foot .fl a:hover{color:#FFB79A}
.s9-foot .fc{display:grid;gap:4px;justify-items:start;color:var(--ink2)}
.s9-fbase{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;padding-block:22px 34px;border-top:1px solid var(--line);font-size:14px;color:var(--mut)}
.s9-foot .fs{display:flex;flex-wrap:wrap;gap:16px}

/* pricing */
.s9-pr{position:relative;isolation:isolate;margin-top:-64px;padding-top:calc(64px + clamp(48px,7vw,96px));padding-bottom:clamp(72px,9vw,120px)}
.s9-pr .s9-band{--bh:min(760px,92vh)}
.s9-pword{position:absolute;inset-inline:0;top:calc(64px + 1vw);text-align:center;font-family:var(--f-head);font-weight:700;font-size:clamp(130px,27vw,400px);line-height:1;color:rgba(255,250,245,.32);z-index:-1;pointer-events:none;mix-blend-mode:soft-light}
.s9-phd{display:grid;justify-items:center;text-align:center;gap:16px}
.s9-ph1{font-size:clamp(42px,6vw,82px);line-height:1.1}
.s9-cards{display:grid;gap:16px;margin-top:clamp(40px,6vw,72px)}
@media (min-width:960px){.s9-cards{grid-template-columns:repeat(3,minmax(0,1fr));align-items:start}}
.s9-pc{position:relative;display:grid;gap:16px;padding:clamp(24px,2.6vw,34px);border-radius:26px;background:var(--card);box-shadow:var(--soft),0 0 0 1px var(--line)}
@property --s9h{syntax:"<angle>";inherits:false;initial-value:0deg}
.s9-pc.hi{border:2px solid transparent;background:linear-gradient(var(--card),var(--card)) padding-box,conic-gradient(from var(--s9h),#E2532A,#F2A65A,#EE8C7E,#C9442A,#E2532A) border-box;animation:s9spin 8s linear infinite}
@media (min-width:960px){.s9-pc.hi{transform:translateY(-14px)}}
@keyframes s9spin{to{--s9h:360deg}}
.s9-pc .nm{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:20px;font-weight:600}
.s9-pc .badge{font-size:13px;font-weight:600;color:#FFFBF7;background:linear-gradient(90deg,#E2532A,#F2A65A);border-radius:999px;padding:3px 12px}
.s9-pc .amt{display:flex;align-items:baseline;gap:8px}
.s9-pc .amt-v{font-family:var(--f-head);font-weight:700;font-size:clamp(54px,5vw,70px);line-height:1}
.s9-pc .cur,.s9-pc .dec{font-size:.45em;color:var(--mut)}
.s9-pc .cur{vertical-align:.85em;margin-inline-end:2px}
.s9-pc .amt small{color:var(--mut);font-size:16px}
.s9-pc .sub{color:var(--mut);font-size:17px}
.rd .s9-pc .s9-b1,.rd .s9-pc .s9-b2{width:100%;justify-content:center}
.s9-pc ul{display:grid;gap:10px;padding-top:18px;border-top:1px solid var(--line)}
.s9-pc li{display:grid;grid-template-columns:22px 1fr;gap:10px;font-size:16.5px;line-height:1.6}
.s9-pc li svg{width:16px;height:16px;margin-top:5px;padding:2px;border-radius:50%;background:var(--acc-soft);color:var(--acc-ink)}
.s9-pc .ft{font-size:14px;color:var(--mut);text-align:center}

@media (prefers-reduced-motion:reduce){.s9-rt{animation:none;flex-wrap:wrap;width:auto}.s9-band i{animation:none}}
`

function Band({ grain = true }: { grain?: boolean }) {
  return <div className={'s9-band' + (grain ? ' s9-grain' : '')} aria-hidden><i /><i /><i /><i /></div>
}

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s9-faq">{list.map((f) => <details key={f.q}><summary>{f.q}<Plus strokeWidth={1.8} /></summary><p>{f.a}</p></details>)}</div>
}

function Footer() {
  return (
    <footer className="s9-foot">
      <div className="s9-ftop"><Band /><div className="s9-fwm" aria-hidden><Mark /></div></div>
      <div className="wrap s9-fb">
        <div className="s9-fbr">
          <p>{FOOTER.claim}</p>
          <a className="s9-b1" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
          <Contact />
        </div>
        <FooterLinks />
      </div>
      <div className="wrap s9-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
    </footer>
  )
}

export function Home() {
  const loop = [...REVIEWS, ...REVIEWS]
  return (
    <Root id="s9" mode="light" css={CSS}>
      <Header />
      <section className="s9-hero">
        <Band />
        <div className="wrap s9-hg">
          <div className="s9-htxt">
            <p className="s9-claim s9-fade" style={{ ['--d' as string]: '.05s' }}>{HERO.claim}</p>
            <h1 className="s9-t s9-h1">{HERO.words.map((w, i) => <span key={w} style={{ ['--i' as string]: i }}>{w}{i < 2 ? '، ' : '.'}</span>)}</h1>
            <p className="s9-sub s9-fade">{HERO.sub}</p>
            <div className="s9-ctas s9-fade" style={{ ['--d' as string]: '.7s' }}>
              <a className="s9-b1" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
              <a className="s9-b2" href={HERO.secondary.href}>{HERO.secondary.label}</a>
            </div>
          </div>
          <div className="s9-stack s9-fade" data-tilt style={{ ['--d' as string]: '.85s' }}>
            <div className="s9-ly a"><Laptop><Vid v={DASH_D} kind="d" className="only-d" label="جولة في لوحة تحكم بينون" /></Laptop></div>
            <div className="s9-ly c"><div className="s9-chip"><img src={wideShot('restaurant')} alt="قالب موقع مطعم" /><p>موقع مطعم<span>قالب</span></p></div></div>
            <div className="s9-ly b"><Phone><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone></div>
          </div>
        </div>
      </section>

      <section className="s9-sec" style={{ paddingTop: 'clamp(56px,7vw,96px)' }}>
        <div className="wrap s9-hd" data-r><h2 className="s9-t s9-h2">{SECTIONS.reviews}</h2></div>
        <div className="s9-rv">
          <div className="s9-rt">
            {loop.map((r, i) => (
              <figure key={i} className="s9-rc" aria-hidden={i >= REVIEWS.length || undefined}>
                <Stars n={r.rating} />
                <blockquote>«{r.body}»</blockquote>
                <figcaption><b>{r.name}</b><em>بانتظار موافقتك</em></figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="wrap"><p className="note">{REVIEWS_NOTE}</p></div>
      </section>

      <section className="s9-sec" style={{ paddingTop: 0 }}>
        <div className="wrap" data-tabs>
          <div className="s9-hd" data-r>
            <h2 className="s9-t s9-h2">{SECTIONS.dash}</h2>
            <p className="s9-sub">{SECTIONS.dashLead}</p>
          </div>
          <div className="s9-dash">
            <div className="s9-win" data-r>
              <div className="s9-tabs" role="tablist" aria-label="أقسام لوحة التحكم">
                {DASH_FEATURES.map((f, i) => <button key={f.id} type="button" role="tab" className="s9-tab" data-tab={i} data-d={f.d.join(',')} data-m={f.m.join(',')}>{f.title}<i /></button>)}
              </div>
              <div className="s9-url" aria-hidden><span>beynoun.com/dashboard</span></div>
              <div className="dv-scr only-d"><Vid v={DASH_D} kind="d" label="لوحة تحكم بينون" /></div>
              <div className="s9-dm only-m"><Phone><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone></div>
            </div>
            {DASH_FEATURES.map((f, i) => <p key={f.id} className="s9-dp" data-panel={i} hidden={i > 0}>{f.body}</p>)}
          </div>
        </div>
      </section>

      <section className="s9-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="s9-hd" data-r>
            <h2 className="s9-t s9-h2">{SECTIONS.edit}</h2>
            <p className="s9-sub">{SECTIONS.editLead}</p>
          </div>
          <div className="s9-eg" data-sync>
            <ol className="s9-steps">
              {EDIT_STEPS.map((s, i) => <li key={s.id} className="s9-sc" data-step data-d={s.d} data-m={s.m}><i>{NUM[i]}</i><b>{s.title}</b><span>{s.body}</span></li>)}
            </ol>
            <div className="s9-ev" data-r>
              <Laptop className="only-d"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></Laptop>
              <Phone className="only-m"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></Phone>
            </div>
          </div>
        </div>
      </section>

      <section className="s9-sec" style={{ paddingTop: 0 }}>
        <div className="wrap s9-hd" data-r style={{ justifyItems: 'center', textAlign: 'center' }}>
          <h2 className="s9-t s9-h2">{SECTIONS.tpl}</h2>
          <p className="s9-sub">{SECTIONS.tplLead}</p>
        </div>
        <div className="s9-cf" data-rail>
          <div className="s9-rail" data-flow="0" data-track>
            {TEMPLATES.map((t) => (
              <a key={t.id} href={t.href} className="s9-fi" data-fi>
                <Phone><img src={phoneShot(t.id)} alt={t.name} loading="lazy" /></Phone>
                <span className="cap"><strong>{t.name}</strong><small>{t.tag}</small>{'soon' in t && t.soon ? <em>قريبًا</em> : null}</span>
              </a>
            ))}
          </div>
          <div className="s9-nav"><button type="button" data-prev aria-label="السابق"><ChevR /></button><button type="button" data-next aria-label="التالي"><ChevL /></button></div>
        </div>
      </section>

      <section className="s9-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="s9-hd" data-r style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
            <h2 className="s9-t s9-h2">{SECTIONS.faq}</h2>
            <a className="s9-b2" href="/faq">كل الأسئلة</a>
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
    <Root id="s9" mode="light" css={CSS}>
      <Header />
      <section className="s9-pr">
        <Band />
        <div className="s9-pword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s9-phd">
            <h1 className="s9-t s9-ph1">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="s9-sub">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s9-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s9-pc' + (p.id === 'starter' ? ' hi' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><Amount v={p.amount} /><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <a className={p.id === 'starter' ? 's9-b1' : 's9-b2'} href={p.href}>{p.cta}</a>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={3} />{f}</li>)}</ul>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="s9-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="s9-hd"><h2 className="s9-t s9-h2">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
