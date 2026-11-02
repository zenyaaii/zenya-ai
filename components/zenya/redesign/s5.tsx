/**
 * Style 5 — «منصّة» (Stage). Calm and product-first: the product itself is
 * the hero, a laptop and a phone playing the real dashboard, with thin orbit
 * lines turning slowly behind them. Light by default; the footer is the dark
 * cap with a light falling from the wordmark.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER } from './data'

const CSS = `
.s5{interpolate-size:allow-keywords}
.s5 .h{background:color-mix(in srgb,var(--bg) 84%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
@media (min-width:900px){.s5 .h-nav{background:var(--card2);border-radius:999px;padding:4px}.s5 .h-nav a{padding:6px 16px}.s5 .h-nav a:hover{background:var(--card)}}

/* orbit lines */
.s5-orbit{position:absolute;left:50%;top:var(--oy,58%);width:var(--os,1100px);aspect-ratio:1;translate:-50% -50%;z-index:0;pointer-events:none}
.s5-orbit i{position:absolute;inset:calc(var(--k)*11%);border-radius:50%;border:1px solid var(--line2);animation:s5spin calc(40s + var(--k)*14s) linear infinite}
.s5-orbit i:nth-child(even){animation-direction:reverse}
.s5-orbit i::after{content:"";position:absolute;top:-4px;left:50%;width:7px;height:7px;margin-left:-3.5px;border-radius:1px;background:var(--acc);transform:rotate(45deg)}
.s5-orbit i:nth-child(2)::after{background:var(--ink2)}
.s5-orbit i:nth-child(4)::after{display:none}
@keyframes s5spin{to{transform:rotate(360deg)}}
.s5-orbit::after{content:"";position:absolute;inset:30%;border-radius:50%;background:radial-gradient(closest-side,rgba(226,83,42,.16),rgba(226,83,42,0))}

.s5-hero{position:relative;isolation:isolate;overflow:hidden;padding-top:64px}
.s5-hero-t{position:relative;z-index:1;display:grid;justify-items:center;text-align:center;gap:20px}
.s5-claim{font-size:16px;color:var(--ink2);border:1px solid var(--line2);border-radius:999px;padding:4px 14px;background:var(--card)}
.s5-h1{font-size:clamp(46px,7.2vw,92px);line-height:1.1}
.s5-h1 span{color:var(--acc-ink)}
.s5-hero .lead{font-size:clamp(18px,1.9vw,21px);max-width:36ch;text-align:center}
.s5-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.s5-hero-t>*{animation:s5in 1s var(--out) both;animation-delay:calc(var(--i,0)*.1s)}
@keyframes s5in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.s5-stage{position:relative;z-index:1;margin-top:48px;padding-bottom:24px;animation:s5rise 1.4s .35s var(--out) both}
@keyframes s5rise{from{opacity:0;transform:translateY(60px) scale(.97)}to{opacity:1;transform:none}}
.s5-laptop{max-width:980px;margin-inline:auto;border-radius:18px;border:1px solid var(--line2);background:var(--card);padding:8px;box-shadow:0 40px 90px -40px rgba(22,18,13,.45)}
.s5-laptop .vid{border-radius:12px;aspect-ratio:1440/900}
.s5-phone{position:absolute;bottom:0;inset-inline-end:max(var(--gut),calc(50% - 560px));width:min(22vw,210px);border-radius:32px;border:6px solid var(--inv);background:var(--inv);box-shadow:0 30px 60px -24px rgba(22,18,13,.55);overflow:hidden}
.s5-phone .vid{aspect-ratio:390/844;border-radius:26px}
@media (max-width:767px){.s5-laptop{display:none}.s5-phone{position:relative;inset:auto;margin-inline:auto;width:min(64vw,250px)}.s5-stage{margin-top:36px}}

.s5-sec{position:relative;padding-block:88px}
@media (min-width:900px){.s5-sec{padding-block:120px}}
.s5-title{font-size:clamp(34px,4.8vw,54px)}
.s5-hd{display:grid;gap:12px;justify-items:center;text-align:center;margin:0 auto 40px;max-width:720px}
.s5-hd .lead{text-align:center}

/* reviews: a deck, the front card leaves and goes to the back */
.s5-rev{display:grid;gap:40px;align-items:center}
@media (min-width:900px){.s5-rev{grid-template-columns:1fr 1fr}.s5-rev .s5-hd{justify-items:start;text-align:start;margin:0}.s5-rev .s5-hd .lead{text-align:start}}
.s5-deck{position:relative;height:260px;max-width:520px;width:100%;margin-inline:auto}
.s5-deck figure{position:absolute;inset:0;border-radius:24px;border:1px solid var(--line2);background:var(--card);padding:24px;display:grid;gap:12px;align-content:space-between;box-shadow:var(--shadow);
  transform:translateY(22px) scale(.94);opacity:.7;z-index:1;transition:transform .9s var(--out),opacity .9s var(--out)}
.s5-deck figure.on{transform:none;opacity:1;z-index:3}
.s5-deck figure.was{transform:translateY(40px) scale(.88);opacity:.4;z-index:0}
.s5-deck blockquote{font-family:var(--f-head);font-size:clamp(26px,3vw,34px);line-height:1.35}
.s5-deck figcaption{display:flex;justify-content:space-between;font-size:15px;color:var(--mut)}
.s5-deck figcaption i{font-style:normal;color:var(--acc-ink)}

/* dashboard: tabs at the side, the frame plays the chosen part */
.s5-dg{display:grid;gap:24px}
@media (min-width:960px){.s5-dg{grid-template-columns:320px 1fr;align-items:center;gap:40px}}
.s5-tl{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-inline:calc(-1*var(--gut));padding-inline:var(--gut)}
.s5-tl::-webkit-scrollbar{display:none}
@media (min-width:960px){.s5-tl{display:grid;margin:0;padding:0;overflow:visible}}
.s5-tb{position:relative;flex:none;text-align:start;border-radius:16px;padding:10px 16px;border:1px solid var(--line2);background:var(--card);transition:background-color .3s,border-color .3s}
.s5-tb strong{display:block;font-family:var(--f-head);font-size:18px;line-height:1.3;white-space:nowrap}
.s5-tb span{display:none;font-size:15px;color:var(--mut);line-height:1.5}
.s5-tb::after{content:"";position:absolute;inset-inline-start:0;top:12px;bottom:12px;width:2px;border-radius:2px;background:var(--acc);transform-origin:top;transform:scaleY(var(--p,0));opacity:0}
.s5-tb[aria-selected="true"]{background:var(--inv);color:var(--on-inv);border-color:transparent}
@media (min-width:960px){
  .s5-tb{padding:14px 18px;border-color:transparent;background:none}
  .s5-tb strong{font-size:21px}
  .s5-tb span{display:block;max-height:0;overflow:hidden;transition:max-height .5s var(--out)}
  .s5-tb[aria-selected="true"]{background:var(--card);color:var(--ink);border-color:var(--line2)}
  .s5-tb[aria-selected="true"] span{max-height:5em}
  .s5-tb[aria-selected="true"]::after{opacity:1}
}
.s5-df{border-radius:18px;border:1px solid var(--line2);background:var(--card);padding:8px}
.s5-df .vid{border-radius:12px;aspect-ratio:1440/900}
@media (max-width:767px){.s5-df{width:min(70vw,270px);margin-inline:auto;border-radius:30px;border:6px solid var(--inv);padding:0;background:var(--inv)}.s5-df .vid{aspect-ratio:390/844;border-radius:24px}}
.s5-dp{text-align:center;color:var(--mut);min-height:3.4em}
@media (min-width:960px){.s5-dp{display:none}}

/* editor: a beam that fills with the recording */
.s5-eg{display:grid;gap:28px;align-items:center}
@media (min-width:960px){.s5-eg{grid-template-columns:1fr 300px;gap:48px}}
.s5-ef{border-radius:18px;border:1px solid var(--line2);background:var(--card);padding:8px}
.s5-ef .vid{border-radius:12px;aspect-ratio:1440/900}
.s5-ef.only-m{width:min(70vw,270px);margin-inline:auto;border-radius:30px;border:6px solid var(--inv);padding:0;background:var(--inv)}
.s5-ef.only-m .vid{aspect-ratio:390/844;border-radius:24px}
.s5-beam{position:relative;display:grid;gap:22px;padding-inline-start:30px}
.s5-beam::before,.s5-beam::after{content:"";position:absolute;inset-inline-start:7px;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--line2)}
.s5-beam::after{background:linear-gradient(to bottom,var(--acc),#F2A15C);transform-origin:top;transform:scaleY(var(--t,0))}
.s5-bs{position:relative;display:grid;gap:2px;opacity:.5;transition:opacity .4s;cursor:pointer}
.s5-bs::before{content:"";position:absolute;inset-inline-start:-28px;top:9px;width:12px;height:12px;border-radius:50%;background:var(--bg);border:2px solid var(--line2);z-index:1;transition:border-color .4s,background-color .4s}
.s5-bs.on,.s5-bs.done{opacity:1}
.s5-bs.on::before,.s5-bs.done::before{border-color:var(--acc);background:var(--acc)}
.s5-bs strong{font-family:var(--f-head);font-size:22px;line-height:1.3}
.s5-bs span{color:var(--mut);font-size:16px}
@media (max-width:959px){.s5-beam{order:2}}

/* templates: phones on a shelf */
.s5-tg{display:grid;grid-template-columns:repeat(2,1fr);gap:20px 14px}
@media (min-width:900px){.s5-tg{grid-template-columns:repeat(4,1fr);gap:36px 24px}}
.s5-tp{display:grid;gap:10px;justify-items:center;text-align:center}
.s5-tp .ph{width:100%;max-width:220px;border-radius:26px;border:5px solid var(--inv);background:var(--inv);overflow:hidden;transition:transform .6s var(--out),box-shadow .6s var(--out)}
.s5-tp img{width:100%;aspect-ratio:480/1039;object-fit:cover;object-position:top}
@media (hover:hover){.s5-tp:hover .ph{transform:translateY(-8px);box-shadow:0 26px 40px -24px rgba(22,18,13,.5)}}
.s5-tp strong{font-family:var(--f-head);font-size:18px;line-height:1.3}
.s5-tp span{font-size:14px;color:var(--mut)}
.s5-tp em{font-style:normal;font-size:13px;color:var(--acc-ink)}

/* faq: opens smoothly where the browser can animate it */
.s5-faq{max-width:780px;margin-inline:auto;border-radius:24px;border:1px solid var(--line2);background:var(--card);padding:4px 22px}
.s5-faq details{border-bottom:1px solid var(--line)}
.s5-faq details:last-child{border-bottom:0}
.s5-faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 0;font-size:19px;font-weight:600}
.s5-faq summary svg{flex:none;transition:transform .45s var(--out)}
.s5-faq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s5-faq p{padding-bottom:20px;color:var(--mut)}
.s5-faq details::details-content{height:0;overflow:clip;transition:height .5s var(--out),content-visibility .5s allow-discrete}
.s5-faq details[open]::details-content{height:auto}

/* footer: the wordmark on the dark cap, a light falls from it */
.s5-foot{position:relative;margin-top:40px;background:#0F0D0A;color:#F4EFE6;overflow:hidden;isolation:isolate;--mut:rgba(244,239,230,.62);--line:rgba(244,239,230,.1);--line2:rgba(244,239,230,.18)}
.s5-lamp{position:relative;display:grid;justify-items:center;padding-top:64px}
.s5-lamp svg{position:relative;z-index:2;height:clamp(40px,6vw,72px);width:auto;color:#F4EFE6}
.s5-lamp::before{content:"";position:absolute;top:calc(64px + clamp(40px,6vw,72px) + 18px);left:50%;width:min(70vw,720px);height:1px;translate:-50% 0;background:linear-gradient(90deg,transparent,#F2A15C,transparent);transform:scaleX(.3);transition:transform 1.6s var(--out)}
.s5-lamp::after{content:"";position:absolute;top:calc(64px + clamp(40px,6vw,72px) + 19px);left:50%;width:min(90vw,980px);height:260px;translate:-50% 0;z-index:0;
  background:conic-gradient(from 180deg at 50% 0%,transparent 120deg,rgba(226,83,42,.32) 180deg,transparent 240deg);-webkit-mask-image:linear-gradient(to bottom,#000,transparent);mask-image:linear-gradient(to bottom,#000,transparent);opacity:0;transform:scaleX(.4);transform-origin:top;transition:opacity 1.6s var(--out),transform 1.6s var(--out)}
.s5-lamp.vis::before{transform:scaleX(1)}
.s5-lamp.vis::after{opacity:1;transform:none}
.s5-fbody{position:relative;z-index:1;padding-block:72px 28px}
.s5-fgrid{display:grid;gap:36px}
@media (min-width:900px){.s5-fgrid{grid-template-columns:1fr 2fr}}
.s5-fbrand{display:grid;gap:14px;align-content:start}
.s5-fbrand p{color:var(--mut);font-size:17px;max-width:34ch}
.s5-fbrand .btn{justify-self:start;background:#F4EFE6;color:#16120D}
.s5 .fc{display:grid;gap:4px;justify-items:start;font-size:16px}
.s5 .fc a{color:#F2A15C}
.s5 .fl{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 16px}
@media (min-width:640px){.s5 .fl{grid-template-columns:repeat(3,1fr)}}
.s5 .fl-h{font-family:var(--f-head);font-size:18px;margin-bottom:10px}
.s5 .fl ul{display:grid;gap:8px;font-size:16px;color:var(--mut)}
.s5 .fl a:hover{color:#F4EFE6}
.s5-fbase{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;border-top:1px solid var(--line);margin-top:40px;padding-top:18px;font-size:14px;color:var(--mut)}
.s5 .fs{display:flex;flex-wrap:wrap;gap:6px}
.s5 .fs a{display:inline-flex;height:32px;align-items:center;padding:0 12px;border-radius:999px;border:1px solid var(--line2)}

/* pricing: the light version of the Forma picture */
.s5-pr{position:relative;isolation:isolate;overflow:hidden;padding:72px 0 96px}
.s5-orb{position:absolute;z-index:0;left:50%;top:420px;width:min(120vw,1200px);aspect-ratio:2/1;translate:-50% -50%;border-radius:50%;background:radial-gradient(closest-side,rgba(226,83,42,.34),rgba(242,161,92,.16) 55%,rgba(242,161,92,0));filter:blur(30px);animation:s5orb 14s ease-in-out infinite alternate;pointer-events:none}
@keyframes s5orb{to{transform:translateX(6%) scale(1.08)}}
.s5-prword{position:absolute;inset-inline:0;top:40px;text-align:center;font-family:var(--f-head);font-weight:800;font-size:clamp(120px,24vw,320px);line-height:1;color:var(--ink);opacity:.06;z-index:0;pointer-events:none;white-space:nowrap}
.s5-pr .s5-hd{position:relative;z-index:1}
.s5-cards{position:relative;z-index:1;display:grid;gap:16px;max-width:1100px;margin-inline:auto}
@media (min-width:960px){.s5-cards{grid-template-columns:repeat(3,1fr)}}
.s5-card{border-radius:28px;padding:26px 24px 24px;display:flex;flex-direction:column;gap:16px;background:color-mix(in srgb,var(--card) 62%,transparent);border:1px solid color-mix(in srgb,var(--card) 80%,var(--line2));-webkit-backdrop-filter:blur(20px) saturate(1.3);backdrop-filter:blur(20px) saturate(1.3);box-shadow:var(--shadow)}
.s5-card.pro{background:color-mix(in srgb,var(--inv) 92%,transparent);color:var(--on-inv);border-color:transparent;--mut:color-mix(in srgb,var(--on-inv) 66%,transparent);--line2:color-mix(in srgb,var(--on-inv) 16%,transparent)}
.s5-card .nm{display:flex;justify-content:space-between;align-items:center;font-size:20px}
.s5-card .badge{font-size:13px;padding:3px 10px;border-radius:999px;background:var(--acc-soft);color:var(--acc-ink)}
.s5-card .amt{display:flex;align-items:baseline;gap:6px;font-family:var(--f-head);font-size:52px;line-height:1}
.s5-card .amt small{font-family:var(--f-ui);font-size:18px;color:var(--mut)}
.s5-card .sub{color:var(--mut);font-size:16px}
.s5-card ul{display:grid;gap:10px;font-size:16px;flex:1}
.s5-card li{display:grid;grid-template-columns:24px 1fr;gap:10px}
.s5-card li svg{width:22px;height:22px;padding:4px;border-radius:50%;background:var(--inv);color:var(--on-inv);margin-top:2px}
.s5-card.pro li svg{background:var(--acc);color:#16120D}
.s5-card .btn{width:100%;background:var(--inv);color:var(--on-inv)}
.s5-card.pro .btn{background:var(--on-inv);color:var(--inv)}
.s5-card .ft{font-size:14px;color:var(--mut);text-align:center}
.rd.shot .s5-lamp::before{transform:none}.rd.shot .s5-lamp::after{opacity:1;transform:none}
`

function Orbit({ size, y }: { size: string; y: string }) {
  return <div className="s5-orbit" style={{ ['--os' as string]: size, ['--oy' as string]: y }} aria-hidden>{[0, 1, 2, 3].map((k) => <i key={k} style={{ ['--k' as string]: k }} />)}</div>
}

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s5-faq" data-r>{list.map((f) => <details key={f.q}><summary>{f.q}<Plus size={20} strokeWidth={1.6} /></summary><p>{f.a}</p></details>)}</div>
}

function Footer() {
  return (
    <footer className="s5-foot">
      <div className="s5-lamp" data-vis aria-hidden><Mark /></div>
      <div className="wrap s5-fbody">
        <div className="s5-fgrid">
          <div className="s5-fbrand">
            <p>{FOOTER.claim}</p>
            <a className="btn" href="/templates">ابدأ الإنشاء</a>
            <Contact />
          </div>
          <FooterLinks />
        </div>
        <div className="s5-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
      </div>
    </footer>
  )
}

export function Home() {
  return (
    <Root id="s5" mode="light" css={CSS}>
      <Header />
      <section className="s5-hero">
        <Orbit size="min(150vw,1300px)" y="62%" />
        <div className="wrap s5-hero-t">
          <p className="s5-claim">{HERO.claim}</p>
          <h1 className="head s5-h1" style={{ ['--i' as string]: 1 }}>{HERO.words[0]}، {HERO.words[1]}، <span>{HERO.words[2]}.</span></h1>
          <p className="lead" style={{ ['--i' as string]: 2 }}>{HERO.sub}</p>
          <div className="s5-ctas" style={{ ['--i' as string]: 3 }}>
            <a className="btn btn-ink" href={HERO.primary.href}>{HERO.primary.label}</a>
            <a className="btn btn-line" href={HERO.secondary.href}>{HERO.secondary.label}</a>
          </div>
        </div>
        <div className="wrap s5-stage">
          <div className="s5-laptop"><div className="vid"><Vid v={DASH_D} kind="d" label="جولة في لوحة تحكم بينون" /></div></div>
          <div className="s5-phone"><div className="vid"><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></div></div>
        </div>
      </section>

      <section className="s5-sec">
        <div className="wrap s5-rev">
          <div className="s5-hd" data-r>
            <h2 className="head s5-title">ماذا يقول من جرّب بينون</h2>
            <p className="note">{REVIEWS_NOTE}</p>
          </div>
          <div className="s5-deck" data-rotate="4600" data-r>
            {REVIEWS.map((r, i) => (
              <figure key={i} data-item>
                <Stars n={r.rating} />
                <blockquote>«{r.body}»</blockquote>
                <figcaption><span>{r.name}</span><i>بانتظار موافقتك</i></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="s5-sec">
        <div className="wrap">
          <div className="s5-hd" data-r>
            <h2 className="head s5-title">لوحة تحكم واحدة لكل شيء</h2>
            <p className="lead">الحجوزات، والزوار، والتقييمات، وظهورك في جوجل. كلها في مكان واحد.</p>
          </div>
          <div className="s5-dg" data-tabs>
            <div className="s5-tl" role="tablist" aria-label="أقسام لوحة التحكم">
              {DASH_FEATURES.map((f, i) => (
                <button key={f.id} type="button" role="tab" className="s5-tb" data-tab={i} data-d={f.d.join(',')} data-m={f.m.join(',')}>
                  <strong>{f.title}</strong><span>{f.body}</span>
                </button>
              ))}
            </div>
            <div>
              <div className="s5-df"><div className="vid">
                <Vid v={DASH_D} kind="d" className="only-d" label="جولة في لوحة تحكم بينون" />
                <Vid v={DASH_M} kind="m" className="only-m" label="لوحة تحكم بينون على الهاتف" />
              </div></div>
            </div>
            {DASH_FEATURES.map((f, i) => <p key={f.id} className="s5-dp" data-panel={i} hidden={i > 0}>{f.body}</p>)}
          </div>
        </div>
      </section>

      <section className="s5-sec">
        <div className="wrap">
          <div className="s5-hd" data-r>
            <h2 className="head s5-title">عدّل موقعك كما تكتب رسالة</h2>
            <p className="lead">اضغط على أي نص في موقعك واكتب. غيّر الألوان والخطوط، ثم انشر بضغطة.</p>
          </div>
          <div className="s5-eg" data-sync>
            <div>
              <div className="s5-ef only-d" data-r><div className="vid"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></div></div>
              <div className="s5-ef only-m" data-r><div className="vid"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></div></div>
            </div>
            <ol className="s5-beam">
              {EDIT_STEPS.map((s) => <li key={s.id} className="s5-bs" data-step data-d={s.d} data-m={s.m}><strong>{s.title}</strong><span>{s.body}</span></li>)}
            </ol>
          </div>
        </div>
      </section>

      <section className="s5-sec">
        <div className="wrap">
          <div className="s5-hd" data-r>
            <h2 className="head s5-title">قالب لكل نشاط</h2>
            <p className="lead">ثمانية قوالب جاهزة. اختر قالب نشاطك، وبينون تكتب المحتوى وترتّب الأقسام.</p>
          </div>
          <div className="s5-tg">
            {TEMPLATES.map((t, i) => (
              <a key={t.id} href={t.href} className="s5-tp" data-r style={{ ['--i' as string]: i % 4 }}>
                <span className="ph"><img src={phoneShot(t.id)} alt={t.name} loading="lazy" /></span>
                <strong>{t.name}</strong>
                <span>{t.tag}</span>
                {'soon' in t && t.soon ? <em>قريبًا</em> : null}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="s5-sec">
        <div className="wrap">
          <div className="s5-hd" data-r><h2 className="head s5-title">أسئلة شائعة</h2></div>
          <Faq />
          <p style={{ textAlign: 'center', marginTop: 22 }}><a className="btn btn-line" href="/faq">كل الأسئلة</a></p>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s5" mode="light" css={CSS}>
      <Header />
      <section className="s5-pr">
        <div className="s5-orb" aria-hidden />
        <div className="s5-prword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s5-hd">
            <h1 className="head s5-title">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="lead">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s5-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s5-card' + (p.id === 'pro' ? ' pro' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><span className="ltr">{p.amount}</span><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.6} />{f}</li>)}</ul>
                <a className="btn" href={p.href}>{p.cta}</a>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="s5-sec">
        <div className="wrap">
          <div className="s5-hd"><h2 className="head s5-title">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
