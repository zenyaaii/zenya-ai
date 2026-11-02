/**
 * Style 7 — «حرير» (Silk). A luxury editorial house: paper, ink and thin
 * rules, one colour used like a signature. Hairline columns draw themselves
 * behind the hero, pictures open like windows, the dashboard opens from a
 * slit as it scrolls in, the templates hang as strips that widen one at a
 * time, and the footer's wordmark fills with ink from the rule it sits on.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft, Laptop, Phone, Browser, Amount } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER, SECTIONS } from './data'

const NUM = ['١', '٢', '٣', '٤']
const HERO_SHOTS = ['restaurant', 'wellness', 'lookbook'] as const

const CSS = `
.s7{interpolate-size:allow-keywords;--rule:var(--line2)}
.s7 .h{background:var(--bg);transition:box-shadow .4s}
.s7.scrolled .h{box-shadow:0 1px 0 var(--rule)}
.s7 .h-nav a{border-radius:0;padding:8px 2px;margin-inline:12px;background:linear-gradient(var(--ink),var(--ink)) 100% 100%/0 1px no-repeat;transition:background-size .45s var(--out),color .2s}
.s7 .h-nav a:hover{background-color:transparent;background-size:100% 1px;background-position:0 100%}
.s7 .h-cta{background:transparent;color:var(--ink);border:1px solid var(--ink);transition:background-color .3s,color .3s}
.s7 .h-cta:hover{background:var(--ink);color:var(--bg)}

.s7-t{font-family:var(--f-head);font-weight:700;line-height:1.1;letter-spacing:0;text-wrap:balance}
.s7-h2{font-size:clamp(36px,5vw,72px)}
.s7-sub{color:var(--mut);font-size:clamp(18px,1.5vw,20px);max-width:44ch;text-wrap:pretty}
.s7-sec{padding-block:clamp(96px,12vw,176px)}
.s7-rule{height:1px;background:var(--rule)}
.s7-k{display:inline-flex;align-items:center;gap:12px;font-size:15px;color:var(--mut)}
.s7-k::before{content:"";width:28px;height:1px;background:var(--acc)}

/* masked lines */
.s7-ln{display:block;overflow:hidden;padding:.12em 0 .24em;margin:-.12em 0 -.24em}
.s7-ln>span{display:block}
.rd.js .s7-ln>span{transform:translateY(108%);animation:s7up 1.3s cubic-bezier(.19,1,.22,1) forwards;animation-delay:calc(.2s + var(--i)*.14s)}
@keyframes s7up{to{transform:none}}
.rd.js .s7-fade{opacity:0;animation:s7fade 1.2s var(--out) forwards;animation-delay:var(--d,.7s)}
@keyframes s7fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* hero */
.s7-hero{position:relative;isolation:isolate;overflow:hidden;padding-block:clamp(40px,6vw,88px) clamp(72px,9vw,128px)}
.s7-cols{position:absolute;inset:0;z-index:-1;display:grid;grid-template-columns:repeat(4,1fr);max-width:var(--max);margin-inline:auto;padding-inline:var(--gut);pointer-events:none}
.s7-cols i{border-inline-start:1px solid var(--line);transform-origin:top;animation:s7draw 1.8s cubic-bezier(.65,0,.35,1) both;animation-delay:calc(var(--i)*.12s)}
.s7-cols i:last-child{border-inline-end:1px solid var(--line)}
@keyframes s7draw{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.s7-glow{position:absolute;z-index:-2;width:70vw;aspect-ratio:1;border-radius:50%;top:-30%;inset-inline-end:-20%;background:radial-gradient(closest-side,rgba(226,83,42,.13),transparent);animation:s7drift 22s ease-in-out infinite alternate}
@keyframes s7drift{to{transform:translate(18%,22%) scale(1.15)}}
.s7-hg{display:grid;gap:clamp(40px,6vw,72px);align-items:end}
@media (min-width:960px){.s7-hg{grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr)}}
.s7-htxt{display:grid;gap:26px;justify-items:start}
.s7-h1{font-size:clamp(68px,10.4vw,164px);line-height:1}
.s7-h1 .s7-ln:nth-child(2){padding-inline-start:.9em}
.s7-h1 .s7-ln:nth-child(3)>span{color:var(--acc)}
.s7-ctas{display:flex;flex-wrap:wrap;gap:22px;align-items:center}
.rd .s7-pri{display:inline-flex;align-items:center;gap:12px;height:54px;padding:0 28px;background:var(--ink);color:var(--bg);font-weight:600;font-size:18px;border-radius:999px;transition:gap .4s var(--out),transform .3s}
.rd .s7-pri svg{width:18px;height:18px}
.rd .s7-pri:hover{gap:18px}.rd .s7-pri:active{transform:scale(.97)}
.s7-txt{font-size:18px;font-weight:600;padding:6px 0;background:linear-gradient(var(--ink),var(--ink)) 0 100%/100% 1px no-repeat;transition:background-size .45s var(--out)}
.s7-txt:hover{background-size:0 1px;background-position:100% 100%}
.s7-win{position:relative;justify-self:end;width:min(380px,82%);aspect-ratio:3/4.3;border-radius:999px 999px 18px 18px;overflow:hidden;background:var(--card2);
  box-shadow:0 40px 80px -40px rgba(22,18,13,.4)}
.rd.js .s7-win{clip-path:inset(100% 0 0 0 round 999px 999px 18px 18px);animation:s7open 1.6s cubic-bezier(.77,0,.18,1) forwards .35s}
@keyframes s7open{to{clip-path:inset(0 0 0 0 round 999px 999px 18px 18px)}}
.s7-win figure{position:absolute;inset:0;opacity:0;transition:opacity 1.4s ease}
.s7-win figure.on{opacity:1}
.s7-win img{width:100%;height:100%;object-fit:cover;object-position:top;transform:scale(1.12);transition:transform 7s linear}
.s7-win figure.on img{transform:scale(1)}
.s7-cap{position:absolute;inset-inline:0;bottom:0;padding:44px 22px 18px;background:linear-gradient(transparent,rgba(16,13,10,.72));color:#F4EFE6;font-size:15px;display:flex;justify-content:space-between;gap:8px}
@media (max-width:959px){.s7-win{justify-self:start;width:min(320px,78%)}}

/* reviews: one large, two small */
.s7-rv{display:grid;gap:clamp(40px,5vw,64px)}
@media (min-width:900px){.s7-rv{grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr)}}
.s7-big{position:relative;display:grid;gap:24px;padding-top:40px}
.s7-big::before{content:"”";position:absolute;top:-.3em;inset-inline-start:-.04em;font-family:var(--f-head);font-size:200px;line-height:1;color:var(--acc);opacity:.9}
.s7-big blockquote{font-family:var(--f-head);font-weight:700;font-size:clamp(34px,4.4vw,62px);line-height:1.22;text-wrap:balance}
.s7-sm{display:grid;align-content:end}
.s7-sm figure{display:grid;gap:12px;padding-block:26px;border-top:1px solid var(--rule)}
.s7-sm blockquote{font-family:var(--f-head);font-weight:700;font-size:24px;line-height:1.35}
.s7-by{display:flex;align-items:center;gap:12px;font-size:15px;color:var(--mut)}
.s7-by b{color:var(--ink);font-weight:600}
.s7-by em{font-style:normal;font-size:13px;color:var(--acc-ink)}

/* dashboard: opens from a slit */
.s7-dh{display:grid;gap:16px;margin-bottom:clamp(36px,5vw,56px)}
.s7-band{position:relative;padding-block:clamp(36px,5vw,72px);background:#16120D;color:#F4EFE6;
  clip-path:inset(0 calc((1 - var(--p,1)) * 38%) 0 calc((1 - var(--p,1)) * 38%) round calc(28px + (1 - var(--p,1)) * 200px))}
.s7-band .dv-lap{width:min(1000px,88%);margin-inline:auto}
.s7-band .dv-ph{width:min(250px,62vw);margin-inline:auto}
.s7-band .dv-base{background:linear-gradient(#4A4640,#2E2B27 55%,#1C1A17)}
.s7-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;margin-top:clamp(28px,4vw,44px);border-top:1px solid var(--rule)}
.rd .s7-tb{position:relative;display:grid;gap:6px;align-content:start;text-align:start;padding:20px 0 6px;padding-inline-end:16px;color:var(--mut2);transition:color .4s}
.s7-tb::before{content:"";position:absolute;top:-1px;inset-inline-start:0;width:calc(var(--p,0) * 100%);height:1px;background:var(--ink)}
.s7-tb[aria-selected="true"]{color:var(--ink)}
.s7-tb[aria-selected="false"]::before{width:0}
.s7-tb strong{font-family:var(--f-head);font-size:clamp(20px,1.8vw,25px);font-weight:700;line-height:1.2}
.s7-tb span{font-size:15.5px;color:var(--mut);opacity:0;transition:opacity .5s}
.s7-tb[aria-selected="true"] span{opacity:1}
@media (max-width:899px){
  .s7-tabs{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:4px}
  .s7-tb span{display:none}
  .s7-tb strong{font-size:18px}
  .s7-dp{display:block;margin-top:14px;color:var(--mut);font-size:17px;min-height:3.4em}
  .s7-dp[hidden]{display:none}
}
@media (min-width:900px){.s7-dp{display:none!important}}

/* editor: numbered steps beside the window */
.s7-eg{display:grid;gap:clamp(36px,5vw,64px);align-items:center}
@media (min-width:960px){.s7-eg{grid-template-columns:minmax(0,.62fr) minmax(0,1.38fr)}}
.s7-steps{display:grid}
.s7-st{display:grid;grid-template-columns:auto 1fr;column-gap:22px;align-items:center;padding-block:16px;border-top:1px solid var(--rule);cursor:pointer}
.s7-st:last-child{border-bottom:1px solid var(--rule)}
.s7-eg .s7-h2{font-size:clamp(36px,3.8vw,56px)}
.s7-st i{grid-row:span 2;font-style:normal;font-family:var(--f-head);font-weight:700;font-size:clamp(48px,4.6vw,68px);line-height:1;color:transparent;-webkit-text-stroke:1px var(--mut2);transition:color .5s,-webkit-text-stroke-color .5s;min-width:1ch;text-align:center}
.s7-st b{font-family:var(--f-head);font-size:clamp(24px,2.2vw,30px);font-weight:700;line-height:1.2;color:var(--mut2);transition:color .4s}
.s7-st span{font-size:16px;color:var(--mut)}
.s7-st.on i{color:var(--acc);-webkit-text-stroke-color:var(--acc)}
.s7-st.on b,.s7-st.done b{color:var(--ink)}
.s7-st.done i{-webkit-text-stroke-color:var(--ink)}
.s7-ew .dv-ph{width:min(270px,70vw);margin-inline:auto}

/* templates: strips that widen */
.s7-strips{display:flex;gap:10px;height:clamp(420px,46vw,600px);margin-top:clamp(36px,5vw,56px)}
.s7-strip{position:relative;flex:1;min-width:0;border-radius:16px;overflow:hidden;cursor:pointer;background:var(--card2);transition:flex-grow .9s cubic-bezier(.77,0,.18,1)}
.s7-strip.on{flex-grow:5.2}
.s7-strip img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;filter:saturate(.75);transform:scale(1.04);transition:filter .9s,transform 1.2s var(--out)}
.s7-strip.on img{filter:none;transform:none}
.s7-strip .cap{position:absolute;inset-inline:0;bottom:0;padding:60px 20px 18px;background:linear-gradient(transparent,rgba(16,13,10,.8));color:#F4EFE6;display:grid;gap:2px;opacity:0;transform:translateY(10px);transition:opacity .5s,transform .6s var(--out)}
.s7-strip.on .cap{opacity:1;transform:none;transition-delay:.35s}
.s7-strip .cap strong{font-family:var(--f-head);font-size:24px;font-weight:700;white-space:nowrap}
.s7-strip .cap small{font-size:14px;opacity:.8;white-space:nowrap}
.s7-strip .cap a{justify-self:start;margin-top:8px;font-size:15px;font-weight:600;padding-bottom:2px;border-bottom:1px solid currentColor}
.s7-strip em{position:absolute;top:12px;inset-inline-start:12px;font-style:normal;font-size:12px;background:#F4EFE6;color:#16120D;border-radius:999px;padding:2px 10px}
@media (max-width:767px){
  .s7-strips{flex-direction:column;height:auto;gap:8px}
  .s7-strip{flex:none;height:64px;transition:height .8s cubic-bezier(.77,0,.18,1)}
  .s7-strip.on{height:440px}
  .s7-strip:not(.on) img{object-position:center 18%}
  .s7-strip:not(.on)::after{content:attr(data-name);position:absolute;inset:0;display:flex;align-items:center;padding-inline:18px;background:linear-gradient(90deg,rgba(16,13,10,.15),rgba(16,13,10,.62));color:#F4EFE6;font-size:18px;font-weight:600}
}

/* faq */
.s7-fq{max-width:860px;margin-inline:auto}
.s7-fq>h2{text-align:center;margin-bottom:clamp(36px,5vw,56px)}
.s7-faq details{border-top:1px solid var(--rule)}
.s7-faq details:last-child{border-bottom:1px solid var(--rule)}
.s7-faq summary{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:26px 0;font-family:var(--f-head);font-size:clamp(21px,2vw,26px);font-weight:700;line-height:1.3}
.s7-faq summary svg{flex:none;width:20px;height:20px;transition:transform .5s var(--out)}
.s7-faq details[open] summary svg{transform:rotate(45deg)}
.s7-faq details::details-content{block-size:0;overflow:hidden;transition:block-size .55s var(--out),content-visibility .55s allow-discrete}
.s7-faq details[open]::details-content{block-size:auto}
.s7-faq p{padding:0 0 26px;color:var(--mut);max-width:60ch}
.s7-more{display:flex;justify-content:center;margin-top:32px}

/* footer: ink rises in the wordmark from the rule it stands on */
.s7-foot{position:relative;padding-top:clamp(56px,7vw,96px);overflow:hidden}
.s7-wm{position:relative;width:min(1180px,calc(100% - 2 * var(--gut)));margin-inline:auto}
.s7-wm span{display:block}
.s7-wm svg{display:block;width:100%;height:auto}
.s7-wm .o svg{fill:transparent;stroke:var(--ink);stroke-width:1.1;opacity:.5}
.s7-wm .f{position:absolute;inset:0;color:var(--ink);clip-path:inset(calc((1 - var(--p,1)) * 100%) 0 0 0)}
.s7-wm::after{content:"";position:absolute;inset-inline:calc(-1 * var(--gut));bottom:8%;height:1px;background:var(--acc)}
.s7-fb{display:grid;gap:40px;padding-block:clamp(48px,6vw,80px) 28px}
@media (min-width:900px){.s7-fb{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr)}}
.s7-fbr{display:grid;gap:18px;justify-items:start}
.s7-fbr p{font-family:var(--f-head);font-size:24px;font-weight:700;line-height:1.35;max-width:24ch}
.s7-foot .fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px}
@media (min-width:600px){.s7-foot .fl{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s7-foot .fl-col{border-inline-start:1px solid var(--rule);padding-inline-start:18px}
.s7-foot .fl-h{font-size:14px;color:var(--mut);margin-bottom:10px}
.s7-foot .fl ul{display:grid;gap:8px}
.s7-foot .fl a{font-size:17px;color:var(--ink2)}
.s7-foot .fl a:hover{color:var(--acc-ink)}
.s7-foot .fc{display:grid;gap:4px;justify-items:start;color:var(--ink2)}
.s7-fbase{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;padding-block:22px 34px;border-top:1px solid var(--rule);font-size:14px;color:var(--mut)}
.s7-foot .fs{display:flex;flex-wrap:wrap;gap:18px}

/* pricing */
.s7-pr{position:relative;isolation:isolate;overflow:hidden;padding-block:clamp(48px,7vw,96px) clamp(80px,9vw,128px)}
.s7-pword{position:absolute;inset-inline:0;top:0;text-align:center;font-family:var(--f-head);font-weight:700;font-size:clamp(130px,27vw,400px);line-height:1;color:transparent;-webkit-text-stroke:1px var(--line2);z-index:-1;pointer-events:none}
.s7-phd{display:grid;justify-items:center;text-align:center;gap:18px;padding-top:clamp(40px,8vw,140px)}
.s7-ph1{font-size:clamp(42px,6vw,84px);line-height:1.12}
.s7-ph1 .s7-ln:nth-child(2)>span{color:var(--mut)}
.s7-table{display:grid;margin-top:clamp(48px,6vw,80px);border:1px solid var(--rule);border-radius:24px;overflow:hidden;background:var(--card)}
@media (min-width:960px){.s7-table{grid-template-columns:repeat(3,minmax(0,1fr))}}
.s7-pc{display:grid;align-content:start;gap:18px;padding:clamp(26px,2.8vw,40px)}
.s7-pc+.s7-pc{border-top:1px solid var(--rule)}
@media (min-width:960px){.s7-pc+.s7-pc{border-top:0;border-inline-start:1px solid var(--rule)}}
.s7-pc.hi{background:#16120D;color:#F4EFE6;--mut:#A39A8D;--rule:rgba(244,239,230,.14)}
.s7-pc .nm{display:flex;justify-content:space-between;align-items:center;gap:10px;font-family:var(--f-head);font-size:28px;font-weight:700}
.s7-pc .badge{font-family:var(--f-ui);font-size:13px;font-weight:600;color:var(--acc);border:1px solid currentColor;border-radius:999px;padding:2px 10px}
.s7-pc .amt{display:flex;align-items:baseline;gap:8px;padding-block:6px 4px}
.s7-pc .amt-v{font-family:var(--f-head);font-weight:400;font-size:clamp(60px,5.6vw,84px);line-height:1}
.s7-pc .cur{font-size:.42em;vertical-align:.95em;margin-inline-end:3px}
.s7-pc .dec{font-size:.42em}
.s7-pc .amt small{color:var(--mut);font-size:16px}
.s7-pc .sub{color:var(--mut);font-size:17px;min-height:3.2em}
.s7-pc ul{display:grid;gap:10px;padding-top:20px;border-top:1px solid var(--rule)}
.s7-pc li{display:grid;grid-template-columns:18px 1fr;gap:10px;font-size:16.5px;line-height:1.6}
.s7-pc li svg{width:15px;height:15px;margin-top:6px;color:var(--acc)}
.s7-pc .btn{width:100%;border:1px solid currentColor;margin-top:6px}
.s7-pc.hi .btn{background:#F4EFE6;color:#16120D;border-color:#F4EFE6}
.s7-pc .ft{font-size:14px;color:var(--mut)}

@media (prefers-reduced-motion:reduce){.s7-band{clip-path:none}.s7-wm .f{clip-path:none}.s7-win{clip-path:none!important}}
`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s7-faq">{list.map((f) => <details key={f.q}><summary>{f.q}<Plus strokeWidth={1.4} /></summary><p>{f.a}</p></details>)}</div>
}

function Footer() {
  return (
    <footer className="s7-foot">
      <div className="s7-wm" data-p="rise" aria-hidden>
        <span className="o"><Mark long /></span>
        <span className="f"><Mark long /></span>
      </div>
      <div className="wrap s7-fb">
        <div className="s7-fbr">
          <p>{FOOTER.claim}</p>
          <a className="s7-pri" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
          <Contact />
        </div>
        <FooterLinks />
      </div>
      <div className="wrap s7-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
    </footer>
  )
}

export function Home() {
  const [big, ...rest] = REVIEWS
  return (
    <Root id="s7" mode="light" css={CSS}>
      <Header />
      <section className="s7-hero">
        <div className="s7-glow" aria-hidden />
        <div className="s7-cols" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} style={{ ['--i' as string]: i }} />)}</div>
        <div className="wrap s7-hg">
          <div className="s7-htxt">
            <p className="s7-k s7-fade" style={{ ['--d' as string]: '.1s' }}>{HERO.claim}</p>
            <h1 className="s7-t s7-h1">{HERO.words.map((w, i) => <span key={w} className="s7-ln"><span style={{ ['--i' as string]: i }}>{w}{i < 2 ? '،' : '.'}</span></span>)}</h1>
            <p className="s7-sub s7-fade" style={{ ['--d' as string]: '.75s' }}>{HERO.sub}</p>
            <div className="s7-ctas s7-fade" style={{ ['--d' as string]: '.9s' }}>
              <a className="s7-pri" href={HERO.primary.href}>{HERO.primary.label}<ArrowUpLeft /></a>
              <a className="s7-txt" href={HERO.secondary.href}>{HERO.secondary.label}</a>
            </div>
          </div>
          <div className="s7-win" data-rotate="5200">
            {HERO_SHOTS.map((id) => {
              const t = TEMPLATES.find((x) => x.id === id)!
              return <figure key={id} data-item><img src={phoneShot(id)} alt={t.name} /><figcaption className="s7-cap"><span>{t.name}</span><span>{t.tag.split(' · ')[0]}</span></figcaption></figure>
            })}
          </div>
        </div>
      </section>

      <div className="wrap"><div className="s7-rule" /></div>

      <section className="s7-sec">
        <div className="wrap">
          <p className="s7-k" data-r style={{ marginBottom: 28 }}>{SECTIONS.reviews}</p>
          <div className="s7-rv">
            <figure className="s7-big" data-r>
              <blockquote>{big.body}</blockquote>
              <figcaption className="s7-by"><Stars n={big.rating} /><b>{big.name}</b><em>بانتظار موافقتك</em></figcaption>
            </figure>
            <div className="s7-sm">
              {rest.map((r, i) => (
                <figure key={i} data-r style={{ ['--i' as string]: i + 1 }}>
                  <blockquote>«{r.body}»</blockquote>
                  <figcaption className="s7-by"><b>{r.name}</b><em>بانتظار موافقتك</em></figcaption>
                </figure>
              ))}
              <p className="note" style={{ marginTop: 18 }}>{REVIEWS_NOTE}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="s7-sec" style={{ paddingTop: 0 }}>
        <div className="wrap s7-dh" data-r>
          <h2 className="s7-t s7-h2">{SECTIONS.dash}</h2>
          <p className="s7-sub">{SECTIONS.dashLead}</p>
        </div>
        <div data-tabs>
          <div className="s7-band" data-p="enter">
            <Laptop className="only-d"><Vid v={DASH_D} kind="d" label="جولة في لوحة تحكم بينون" /></Laptop>
            <Phone className="only-m"><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></Phone>
          </div>
          <div className="wrap">
            <div className="s7-tabs" role="tablist" aria-label="أقسام لوحة التحكم">
              {DASH_FEATURES.map((f, i) => (
                <button key={f.id} type="button" role="tab" className="s7-tb" data-tab={i} data-d={f.d.join(',')} data-m={f.m.join(',')}>
                  <strong>{f.title}</strong><span>{f.body}</span>
                </button>
              ))}
            </div>
            {DASH_FEATURES.map((f, i) => <p key={f.id} className="s7-dp" data-panel={i} hidden={i > 0}>{f.body}</p>)}
          </div>
        </div>
      </section>

      <section className="s7-sec" style={{ paddingTop: 0 }}>
        <div className="wrap s7-eg" data-sync>
          <div style={{ display: 'grid', gap: 28 }}>
            <div data-r style={{ display: 'grid', gap: 16 }}>
              <h2 className="s7-t s7-h2">{SECTIONS.edit}</h2>
              <p className="s7-sub">{SECTIONS.editLead}</p>
            </div>
            <ol className="s7-steps">
              {EDIT_STEPS.map((s, i) => <li key={s.id} className="s7-st" data-step data-d={s.d} data-m={s.m}><i>{NUM[i]}</i><b>{s.title}</b><span>{s.body}</span></li>)}
            </ol>
          </div>
          <div className="s7-ew" data-r>
            <Browser className="only-d" url="beynoun.com/editor"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></Browser>
            <Phone className="only-m"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></Phone>
          </div>
        </div>
      </section>

      <section className="s7-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div data-r style={{ display: 'grid', gap: 16 }}>
            <h2 className="s7-t s7-h2">{SECTIONS.tpl}</h2>
            <p className="s7-sub">{SECTIONS.tplLead}</p>
          </div>
          <div className="s7-strips" data-rotate="3800">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="s7-strip" data-item data-dot data-name={t.name}>
                <img src={phoneShot(t.id)} alt={t.name} loading="lazy" />
                {'soon' in t && t.soon ? <em>قريبًا</em> : null}
                <div className="cap"><strong>{t.name}</strong><small>{t.tag}</small><a href={t.href}>عرض القالب</a></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s7-sec" style={{ paddingTop: 0 }}>
        <div className="wrap s7-fq">
          <h2 className="s7-t s7-h2" data-r>{SECTIONS.faq}</h2>
          <div data-r><Faq /></div>
          <div className="s7-more"><a className="s7-txt" href="/faq">كل الأسئلة</a></div>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s7" mode="light" css={CSS}>
      <Header />
      <section className="s7-pr">
        <div className="s7-pword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s7-phd">
            <h1 className="s7-t s7-ph1"><span className="s7-ln"><span style={{ ['--i' as string]: 0 }}>{PRICING_HEAD.l1}</span></span><span className="s7-ln"><span style={{ ['--i' as string]: 1 }}>{PRICING_HEAD.l2}</span></span></h1>
            <p className="s7-sub s7-fade">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s7-table">
            {PLANS.map((p) => (
              <article key={p.id} className={'s7-pc' + (p.id === 'starter' ? ' hi' : '')}>
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
      <section className="s7-sec" style={{ paddingTop: 0 }}>
        <div className="wrap s7-fq">
          <h2 className="s7-t s7-h2">أسئلة عن الأسعار</h2>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
