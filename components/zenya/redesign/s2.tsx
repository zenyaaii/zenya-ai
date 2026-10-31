/**
 * Style 2 — «ورق» (Paper). Editorial and calm: the dashboard's paper and
 * ink, a big serif headline set to the start, thin contour lines that keep
 * flowing behind the hero, hairlines instead of boxes. Light by default.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, wideShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER } from './data'

/* Contour lines: each row is a smooth wave that repeats every 300 units, so
   sliding a group by exactly 300 loops without a seam. */
function wave(y: number, a: number, phase: number) {
  let d = `M -300 ${y}`
  for (let x = -300; x < 1500; x += 300) {
    d += ` C ${x + 75} ${y - a + phase} ${x + 225} ${y + a - phase} ${x + 300} ${y}`
  }
  return d
}
function Lines() {
  const rows = Array.from({ length: 18 }, (_, k) => ({ y: 30 + k * 34, a: 14 + 12 * Math.sin(k * 0.55), ph: 6 * Math.cos(k * 0.8) }))
  return (
    <svg className="s2-lines" viewBox="0 0 1200 640" preserveAspectRatio="none" aria-hidden>
      {[0, 1, 2].map((g) => (
        <g key={g} className={'g' + g}>
          {rows.filter((_, k) => k % 3 === g).map((r, k) => <path key={k} d={wave(r.y, r.a, r.ph)} />)}
        </g>
      ))}
      <path className="lead-line" d={wave(330, 26, 4)} />
    </svg>
  )
}

const CSS = `
.s2 .h{background:color-mix(in srgb,var(--bg) 82%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.s2 .h-in{height:68px}
.s2 .h-logo svg{height:22px}

.s2-lines{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
.s2-lines path{fill:none;stroke:var(--line2);stroke-width:1;vector-effect:non-scaling-stroke}
.s2-lines g{animation:s2flow 30s linear infinite}
.s2-lines .g1{animation-duration:42s;animation-direction:reverse}
.s2-lines .g2{animation-duration:56s}
.s2-lines .lead-line{stroke:var(--acc);stroke-width:1.6;stroke-dasharray:2600;stroke-dashoffset:2600;animation:s2draw 3.6s .3s var(--out) forwards}
@keyframes s2flow{to{transform:translateX(300px)}}
@keyframes s2draw{to{stroke-dashoffset:0}}

.s2-hero{position:relative;isolation:isolate;min-height:calc(100svh - 68px);display:grid;align-items:center;overflow:hidden}
.s2-hero::after{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,transparent 0%,color-mix(in srgb,var(--bg) 0%,transparent) 30%,var(--bg) 75%)}
.s2-hero-in{position:relative;z-index:1;display:grid;gap:22px;padding-block:56px 72px;max-width:var(--max)}
@media (max-width:899px){.s2-hero{align-items:start}.s2-hero-in{padding-block:44px 40svh}.s2-hero .s2-lines{top:auto;height:38%}.s2-hero::after{display:none}}
.s2-claim{display:flex;align-items:center;gap:12px;font-size:17px;color:var(--ink2)}
.s2-claim::before{content:"";width:36px;height:1px;background:var(--acc)}
.s2-h1{font-size:clamp(58px,10.5vw,136px);line-height:1.02;font-weight:700}
.s2-h1 span{display:inline-block;margin-inline-end:.2em;animation:s2in 1.2s var(--out) both;animation-delay:calc(.1s + var(--i)*.12s)}
.s2-h1 .dot{color:var(--acc)}
@keyframes s2in{from{opacity:0;transform:translateY(24px);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
.s2-hero .lead{font-size:clamp(19px,2vw,22px);max-width:30ch;animation:s2in 1.2s .5s var(--out) both}
.s2-ctas{display:flex;flex-wrap:wrap;gap:10px;animation:s2in 1.2s .65s var(--out) both}

.s2-sec{padding-block:88px;border-top:1px solid var(--line)}
@media (min-width:900px){.s2-sec{padding-block:128px}}
.s2-title{font-size:clamp(36px,5.2vw,60px)}
.s2-hd{display:grid;gap:14px;margin-bottom:40px;max-width:720px}

/* reviews: one at a time */
.s2-rev{display:grid;gap:36px}
@media (min-width:900px){.s2-rev{grid-template-columns:1fr 1.4fr;align-items:center}}
.s2-q{position:relative;min-height:250px}
.s2-q figure{position:absolute;inset:0;display:grid;align-content:center;gap:18px;opacity:0;transform:translateY(16px);transition:opacity .9s var(--out),transform .9s var(--out);pointer-events:none}
.s2-q figure.on{opacity:1;transform:none;pointer-events:auto}
.s2-q figure.was{transform:translateY(-16px)}
.s2-q blockquote{font-family:var(--f-head);font-size:clamp(30px,4.2vw,48px);line-height:1.3;text-wrap:balance}
.s2-q blockquote::before{content:"«";color:var(--acc)}
.s2-q blockquote::after{content:"»";color:var(--acc)}
.s2-q figcaption{display:flex;gap:12px;align-items:center;color:var(--mut);font-size:16px}
.s2-q figcaption i{font-style:normal;color:var(--acc-ink);font-size:14px}
.s2-dots{display:flex;gap:8px;margin-top:8px}
.s2-dots button{width:34px;height:3px;border-radius:2px;background:var(--line2);transition:background-color .4s}
.s2-dots button[aria-current="true"]{background:var(--ink)}

/* dashboard: the text scrolls, the recording stays and follows it */
.s2-scrolly{display:grid;gap:0}
@media (min-width:900px){.s2-scrolly{grid-template-columns:.8fr 1.2fr;gap:56px}}
.s2-media{position:sticky;top:84px;z-index:2;align-self:start;background:var(--bg);padding-bottom:12px}
@media (min-width:900px){.s2-media{top:calc(50svh - 240px);order:2;background:none}}
.s2-frame{border:1px solid var(--line2);border-radius:20px;padding:6px;background:var(--card)}
.s2-frame .vid{border-radius:14px;aspect-ratio:1440/900}
.s2-frame.only-m{width:min(48vw,200px);margin-inline:auto;border-radius:30px}
.s2-frame.only-m .vid{border-radius:24px;aspect-ratio:390/844}
.s2-blocks{display:grid}
.s2-block{min-height:42svh;display:grid;align-content:center;gap:10px;padding-block:24px;opacity:.28;transition:opacity .6s var(--out)}
@media (min-width:900px){.s2-block{min-height:62svh}}
.s2-block.on{opacity:1}
.s2-block h3{font-family:var(--f-head);font-size:clamp(28px,3.4vw,40px);line-height:1.2;display:flex;align-items:center;gap:14px}
.s2-block h3 i{font-style:normal;width:8px;height:8px;border-radius:1px;background:var(--acc);transform:rotate(45deg);flex:none;opacity:0;transition:opacity .4s}
.s2-block.on h3 i{opacity:1}
.s2-block p{color:var(--mut);max-width:36ch}

/* editor: one wide recording and a line that fills with it */
.s2-ed .s2-frame.only-d{max-width:1040px;margin-inline:auto}
.s2-ed .s2-frame.only-m{width:min(72vw,290px)}
.s2-bar{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:1040px;margin:28px auto 0;padding-top:20px}
.s2-bar::before,.s2-bar::after{content:"";position:absolute;top:0;inset-inline:0;height:2px;border-radius:2px;background:var(--line2)}
.s2-bar::after{background:var(--acc);transform-origin:right;transform:scaleX(var(--t,0))}
.s2-st{display:grid;gap:2px;text-align:start;opacity:.45;transition:opacity .4s}
.s2-st.on,.s2-st.done{opacity:1}
.s2-st strong{font-family:var(--f-head);font-size:22px}
.s2-st span{font-size:15px;color:var(--mut)}
@media (max-width:640px){.s2-st span{display:none}.s2-st strong{font-size:19px}}

/* templates: an index, the picture follows the row you point at */
.s2-tl{display:grid;gap:32px}
@media (min-width:900px){.s2-tl{grid-template-columns:1fr 1fr;gap:56px}}
.s2-rows{border-top:1px solid var(--line2)}
.s2-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:18px 0;border-bottom:1px solid var(--line2);transition:padding .5s var(--out)}
.s2-row strong{font-family:var(--f-head);font-size:clamp(23px,2.6vw,30px);line-height:1.25;display:block}
.s2-row span{font-size:15px;color:var(--mut)}
.s2-row em{font-style:normal;color:var(--acc-ink);font-size:14px;margin-inline-start:8px}
.s2-row img{width:92px;height:58px;object-fit:cover;object-position:top;border-radius:10px;border:1px solid var(--line)}
.s2-row svg{display:none}
@media (min-width:900px){
  .s2-row img{display:none}.s2-row svg{display:block;color:var(--mut);transition:transform .4s var(--out),color .3s}
  .s2-row:hover{padding-inline-start:12px}.s2-row:hover svg{transform:translate(-4px,-4px);color:var(--acc)}
}
.s2-prev{display:none;position:sticky;top:110px;align-self:start;aspect-ratio:560/400;border-radius:22px;overflow:hidden;border:1px solid var(--line2);background:var(--card2)}
@media (min-width:900px){.s2-prev{display:block}}
.s2-prev img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0;transform:scale(1.04);transition:opacity .6s var(--out),transform .9s var(--out)}
.s2-prev img:first-child{opacity:1;transform:none}
${TEMPLATES.map((t) => `.s2-tl:has([data-t="${t.id}"]:hover) .s2-prev img{opacity:0}.s2-tl:has([data-t="${t.id}"]:hover) .s2-prev img[data-t="${t.id}"]{opacity:1;transform:none}`).join('\n')}

/* faq */
.s2-faqg{display:grid;gap:24px}
@media (min-width:900px){.s2-faqg{grid-template-columns:.8fr 1.2fr;gap:56px}.s2-faqg .s2-hd{position:sticky;top:120px;align-self:start}}
.s2-faq{border-top:1px solid var(--line2)}
.s2-faq details{border-bottom:1px solid var(--line2)}
.s2-faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 0;font-size:20px;font-weight:600}
.s2-faq summary svg{flex:none;transition:transform .45s var(--out)}
.s2-faq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s2-faq p{padding-bottom:22px;color:var(--mut);max-width:60ch}

/* footer: the wordmark sits on the footer's top line and writes itself */
.s2-foot{position:relative;margin-top:24px}
.s2-fbody{background:var(--bg2)}
.s2-fmark{position:relative;display:flex;justify-content:center;padding-inline:var(--gut);background:linear-gradient(to bottom,var(--bg) 50%,var(--bg2) 50%)}
.s2-fmark::before{content:"";position:absolute;inset-inline:0;top:50%;height:1px;background:var(--line2)}
.s2-fmark span{position:relative;background:linear-gradient(to bottom,var(--bg) 50%,var(--bg2) 50%);padding-inline:clamp(12px,3vw,40px)}
.s2-fmark svg{width:min(78vw,820px);height:auto;color:var(--ink)}
.s2-fmark path{fill:transparent;stroke:var(--ink);stroke-width:1.1;stroke-dasharray:5200;stroke-dashoffset:5200;transition:stroke-dashoffset 3.4s var(--out),fill 1s 2.4s}
.s2-fmark.vis path{stroke-dashoffset:0;fill:var(--ink)}
.s2-fbody{padding-block:40px 28px}
.s2-fgrid{display:grid;gap:36px}
@media (min-width:900px){.s2-fgrid{grid-template-columns:1fr 2fr}}
.s2-fbrand{display:grid;gap:14px;align-content:start}
.s2-fbrand p{color:var(--mut);font-size:17px;max-width:34ch}
.s2 .fc{display:grid;gap:4px;justify-items:start;font-size:16px}
.s2 .fc a{border-bottom:1px solid var(--line2)}
.s2 .fl{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 16px}
@media (min-width:640px){.s2 .fl{grid-template-columns:repeat(3,1fr)}}
.s2 .fl-h{font-family:var(--f-head);font-size:19px;margin-bottom:10px}
.s2 .fl ul{display:grid;gap:8px;font-size:16px;color:var(--mut)}
.s2 .fl a:hover{color:var(--ink)}
.s2-fbase{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px;border-top:1px solid var(--line2);margin-top:40px;padding-top:18px;font-size:14px;color:var(--mut)}
.s2 .fs{display:flex;flex-wrap:wrap;gap:4px 16px}
.s2 .fs a:hover{color:var(--ink)}

/* pricing */
.s2-pr{position:relative;isolation:isolate;overflow:hidden;padding-block:72px 96px}
.s2-prword{position:absolute;inset-inline:0;top:24px;text-align:center;font-family:var(--f-head);font-weight:800;font-size:clamp(120px,25vw,340px);line-height:1;color:var(--ink);opacity:.055;z-index:0;pointer-events:none;white-space:nowrap}
.s2-pr .s2-hd{position:relative;z-index:1;margin-inline:auto;text-align:center;justify-items:center}
.s2-cards{position:relative;z-index:1;display:grid;gap:16px;max-width:1100px;margin-inline:auto}
@media (min-width:960px){.s2-cards{grid-template-columns:repeat(3,1fr)}}
.s2-card{border:1px solid var(--line2);border-radius:28px;background:var(--card);padding:28px 24px 24px;display:flex;flex-direction:column;gap:18px;box-shadow:var(--shadow)}
.s2-card.pro{background:var(--inv);color:var(--on-inv);border-color:transparent;--mut:color-mix(in srgb,var(--on-inv) 66%,transparent)}
.s2-card .nm{display:flex;justify-content:space-between;align-items:center;font-size:20px}
.s2-card .badge{font-size:13px;padding:3px 10px;border-radius:999px;background:var(--acc-soft);color:var(--acc-ink)}
.s2-card .amt{display:flex;align-items:baseline;gap:6px;font-family:var(--f-head);font-size:54px;line-height:1}
.s2-card .amt small{font-family:var(--f-ui);font-size:19px;color:var(--mut)}
.s2-card .sub{color:var(--mut);font-size:16px}
.s2-card ul{display:grid;gap:10px;font-size:16px;flex:1;border-top:1px solid var(--line2);padding-top:18px}
.s2-card.pro ul{border-color:color-mix(in srgb,var(--on-inv) 16%,transparent)}
.s2-card li{display:grid;grid-template-columns:20px 1fr;gap:10px}
.s2-card li svg{width:18px;height:18px;margin-top:5px;color:var(--acc)}
.s2-card .btn{width:100%}
.s2-card:not(.pro) .btn{background:var(--inv);color:var(--on-inv)}
.s2-card.pro .btn{background:var(--acc);color:#fff}
.s2-card .ft{font-size:14px;color:var(--mut);text-align:center}
.rd.shot .s2-fmark path{stroke-dashoffset:0!important;fill:var(--ink)!important}
`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className="s2-faq">
      {list.map((f) => (
        <details key={f.q}><summary>{f.q}<Plus size={22} strokeWidth={1.5} /></summary><p>{f.a}</p></details>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer className="s2-foot">
      <div className="s2-fmark" data-vis aria-hidden><span><Mark /></span></div>
      <div className="s2-fbody"><div className="wrap">
        <div className="s2-fgrid">
          <div className="s2-fbrand">
            <p>{FOOTER.claim}</p>
            <a className="btn btn-ink" href="/templates" style={{ justifySelf: 'start' }}>ابدأ الإنشاء</a>
            <Contact />
          </div>
          <FooterLinks />
        </div>
        <div className="s2-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
      </div></div>
    </footer>
  )
}

export function Home() {
  return (
    <Root id="s2" mode="light" css={CSS}>
      <Header />
      <section className="s2-hero">
        <Lines />
        <div className="wrap s2-hero-in">
          <p className="s2-claim">{HERO.claim}</p>
          <h1 className="head s2-h1">{HERO.words.map((w, i) => <span key={w} style={{ ['--i' as string]: i }}>{w}<b className="dot">.</b> </span>)}</h1>
          <p className="lead">{HERO.sub}</p>
          <div className="s2-ctas">
            <a className="btn btn-ink" href={HERO.primary.href}>{HERO.primary.label}</a>
            <a className="btn btn-line" href={HERO.secondary.href}>{HERO.secondary.label}</a>
          </div>
        </div>
      </section>

      <section className="s2-sec">
        <div className="wrap s2-rev">
          <div className="s2-hd" data-r>
            <h2 className="head s2-title">ماذا يقول من جرّب بينون</h2>
            <p className="note">{REVIEWS_NOTE}</p>
          </div>
          <div data-rotate="5200" data-r>
            <div className="s2-q">
              {REVIEWS.map((r, i) => (
                <figure key={i} data-item>
                  <Stars n={r.rating} />
                  <blockquote>{r.body}</blockquote>
                  <figcaption><span>{r.name}</span><i>بانتظار موافقتك</i></figcaption>
                </figure>
              ))}
            </div>
            <div className="s2-dots">{REVIEWS.map((_, i) => <button key={i} type="button" data-dot aria-label={`التقييم ${i + 1}`} />)}</div>
          </div>
        </div>
      </section>

      <section className="s2-sec">
        <div className="wrap">
          <div className="s2-hd" data-r>
            <h2 className="head s2-title">لوحة تحكم واحدة لكل شيء</h2>
            <p className="lead">الحجوزات، والزوار، والتقييمات، وظهورك في جوجل. كلها في مكان واحد.</p>
          </div>
          <div className="s2-scrolly" data-scrolly data-zone-m="-66% 0px -26% 0px" data-zone-d="-48% 0px -48% 0px">
            <div className="s2-media">
              <div className="s2-frame only-d"><div className="vid"><Vid v={DASH_D} kind="d" seg={DASH_FEATURES[0].d} label="جولة في لوحة تحكم بينون" /></div></div>
              <div className="s2-frame only-m"><div className="vid"><Vid v={DASH_M} kind="m" seg={DASH_FEATURES[0].m} label="لوحة تحكم بينون على الهاتف" /></div></div>
            </div>
            <div className="s2-blocks">
              {DASH_FEATURES.map((f) => (
                <div key={f.id} className="s2-block" data-block data-d={f.d.join(',')} data-m={f.m.join(',')}>
                  <h3><i aria-hidden />{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="s2-sec">
        <div className="wrap">
          <div className="s2-hd" data-r>
            <h2 className="head s2-title">عدّل موقعك كما تكتب رسالة</h2>
            <p className="lead">اضغط على أي نص في موقعك واكتب. غيّر الألوان والخطوط، ثم انشر بضغطة.</p>
          </div>
          <div className="s2-ed" data-sync>
            <div className="s2-frame only-d" data-r><div className="vid"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></div></div>
            <div className="s2-frame only-m" data-r><div className="vid"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></div></div>
            <ol className="s2-bar">
              {EDIT_STEPS.map((s) => <li key={s.id} className="s2-st" data-step data-d={s.d} data-m={s.m}><strong>{s.title}</strong><span>{s.body}</span></li>)}
            </ol>
          </div>
        </div>
      </section>

      <section className="s2-sec">
        <div className="wrap">
          <div className="s2-hd" data-r>
            <h2 className="head s2-title">قالب لكل نشاط</h2>
            <p className="lead">ثمانية قوالب جاهزة. اختر قالب نشاطك، وبينون تكتب المحتوى وترتّب الأقسام.</p>
          </div>
          <div className="s2-tl">
            <div className="s2-rows">
              {TEMPLATES.map((t) => (
                <a key={t.id} href={t.href} className="s2-row" data-t={t.id}>
                  <span><strong>{t.name}{'soon' in t && t.soon ? <em>قريبًا</em> : null}</strong><span>{t.tag}</span></span>
                  <img src={wideShot(t.id)} alt="" loading="lazy" />
                  <ArrowUpLeft size={22} strokeWidth={1.5} />
                </a>
              ))}
            </div>
            <div className="s2-prev" aria-hidden>
              {TEMPLATES.map((t) => <img key={t.id} data-t={t.id} src={wideShot(t.id)} alt="" loading="lazy" />)}
            </div>
          </div>
        </div>
      </section>

      <section className="s2-sec">
        <div className="wrap s2-faqg">
          <div className="s2-hd">
            <h2 className="head s2-title">أسئلة شائعة</h2>
            <a className="btn btn-line" href="/faq" style={{ justifySelf: 'start' }}>كل الأسئلة</a>
          </div>
          <Faq />
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s2" mode="light" css={CSS}>
      <Header />
      <section className="s2-pr">
        <Lines />
        <div className="s2-prword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s2-hd">
            <h1 className="head s2-title">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="lead">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s2-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s2-card' + (p.id === 'pro' ? ' pro' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><span className="ltr">{p.amount}</span><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.2} />{f}</li>)}</ul>
                <a className="btn" href={p.href}>{p.cta}</a>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="s2-sec">
        <div className="wrap s2-faqg">
          <div className="s2-hd"><h2 className="head s2-title">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
