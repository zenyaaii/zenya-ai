/**
 * Style 1 — «ليل» (Night). Closest to the Forma pricing picture and the
 * getcluster.ai link: dark ground, a slow warm light behind everything,
 * frosted cards, a floating pill header. Dark by default, light works too.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER } from './data'

const CSS = `
.s1{--glass:rgba(26,23,19,.55);--glass-line:rgba(244,239,230,.12);--glow:rgba(226,83,42,.55)}
.s1[data-mode="light"]{--glass:rgba(255,253,249,.6);--glass-line:rgba(22,18,13,.1);--glow:rgba(226,83,42,.35)}
.s1 .glass{background:var(--glass);border:1px solid var(--glass-line);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2)}

/* header: one floating pill */
.s1 .h{padding-top:10px}
.s1 .h-in{height:56px;max-width:900px;border-radius:999px;padding-inline:8px 10px;background:var(--glass);border:1px solid var(--glass-line);
  -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
.s1 .h>.wrap.h-in{width:calc(100% - 2*var(--gut));padding-inline:14px 8px}
.s1 .h-cta{background:var(--ink);color:var(--bg)}
.s1 .h-drawer{width:calc(100% - 2*var(--gut));max-width:900px;margin-top:8px;border-radius:24px;background:var(--glass);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);padding-inline:18px}
.s1:not([data-menu="open"]) .h-drawer{border-color:transparent}
.s1[data-menu="open"] .h-drawer{border:1px solid var(--glass-line)}

/* the warm light, three soft blobs drifting slowly, with grain */
.s1-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.s1-sky i{position:absolute;border-radius:50%;filter:blur(70px);will-change:transform;opacity:.9}
.s1-sky .b1{width:62vmax;height:62vmax;background:radial-gradient(closest-side,#E2532A,rgba(226,83,42,0));top:-18vmax;inset-inline-start:-14vmax;animation:s1a 26s var(--out) infinite alternate}
.s1-sky .b2{width:48vmax;height:48vmax;background:radial-gradient(closest-side,#F2A15C,rgba(242,161,92,0));bottom:-22vmax;inset-inline-end:-10vmax;opacity:.55;animation:s1b 32s ease-in-out infinite alternate}
.s1-sky .b3{width:36vmax;height:36vmax;background:radial-gradient(closest-side,#7A2A12,rgba(122,42,18,0));top:30%;left:38%;opacity:.8;animation:s1c 22s ease-in-out infinite alternate}
.s1[data-mode="light"] .s1-sky i{opacity:.32}
.s1[data-mode="light"] .s1-sky .b3{opacity:.18}
.s1-sky::after{content:"";position:absolute;inset:0;opacity:.16;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
@keyframes s1a{to{transform:translate(18vmax,10vmax) scale(1.12)}}
@keyframes s1b{to{transform:translate(-14vmax,-8vmax) scale(.9)}}
@keyframes s1c{0%{transform:translate(0,0)}100%{transform:translate(-12vmax,6vmax) scale(1.2)}}

/* hero */
.s1-hero{position:relative;margin-top:-66px;padding-top:66px;min-height:100svh;display:grid;align-items:center;isolation:isolate}
.s1-ghost{position:absolute;inset-inline:0;bottom:7%;display:flex;justify-content:center;color:var(--ink);opacity:.05;z-index:0;pointer-events:none}
.s1-ghost svg{width:min(88vw,1100px);height:auto}
.s1-hero-in{position:relative;z-index:1;display:grid;justify-items:center;text-align:center;gap:22px;padding-block:48px 72px}
.s1-claim{display:inline-flex;align-items:center;gap:10px;padding:6px 16px 6px 12px;border-radius:999px;font-size:16px;color:var(--ink2)}
.s1-claim b{width:8px;height:8px;background:var(--acc);transform:rotate(45deg);border-radius:1px}
.s1-h1{font-size:clamp(54px,11vw,128px);line-height:1.05;display:flex;flex-wrap:wrap;justify-content:center;gap:0 .28em}
.s1-h1 span{display:inline-block;overflow:hidden;padding-bottom:.08em}
.s1-h1 span i{display:inline-block;font-style:normal;animation:s1up 1.1s var(--out) both;animation-delay:calc(.15s + var(--i)*.14s)}
.s1-h1 span:last-child i{color:var(--acc-ink)}
@keyframes s1up{from{transform:translateY(105%)}to{transform:none}}
.s1-hero .lead{font-size:clamp(18px,2.2vw,21px);max-width:34ch;animation:s1fade 1.2s .6s var(--out) both}
.s1-ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;animation:s1fade 1.2s .75s var(--out) both}
.s1 .btn-white{background:var(--ink);color:var(--bg)}
@keyframes s1fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* sections */
.s1-sec{position:relative;padding-block:88px}
@media (min-width:900px){.s1-sec{padding-block:128px}}
.s1-title{font-size:clamp(34px,5.4vw,58px)}
.s1-hd{display:grid;gap:14px;justify-items:center;text-align:center;margin-bottom:44px}
.s1-hd .lead{text-align:center}

/* reviews: two rows drifting in opposite directions */
.s1-rows{display:grid;gap:14px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.s1-row{display:flex;gap:14px;width:max-content;animation:s1mq 38s linear infinite}
.s1-row.rev{animation-direction:reverse;animation-duration:44s}
.s1-rows:hover .s1-row{animation-play-state:paused}
@keyframes s1mq{to{transform:translateX(50%)}}
.s1-rv{width:min(78vw,360px);border-radius:24px;padding:22px;display:grid;gap:12px;align-content:start}
.s1-rv blockquote{font-size:20px;line-height:1.55;color:var(--ink)}
.s1-rv figcaption{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:15px;color:var(--mut)}
.s1-rv .tag{font-size:13px;color:var(--acc-ink);border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);border-radius:999px;padding:2px 10px}
.s1-revnote{margin:22px auto 0;text-align:center}

/* dashboard: the frame tilts back and stands up as it arrives */
.s1-stage{perspective:1400px}
.s1-tilt{border-radius:22px;padding:8px;transform-origin:50% 0;transition:transform 1.6s var(--out),opacity 1.2s var(--out)}
.rd.js .s1-tilt:not(.vis){transform:rotateX(26deg) scale(.92) translateY(40px);opacity:.5}
.s1-tilt .vid{border-radius:16px}
.s1-tilt .only-d{aspect-ratio:1440/900}
.s1-tilt.only-m{max-width:320px;margin-inline:auto;border-radius:40px;padding:7px}
.s1-tilt.only-m .vid{border-radius:34px;aspect-ratio:390/844}
.s1-tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px var(--gut);margin:28px calc(-1*var(--gut)) 0;justify-content:flex-start}
.s1-tabs::-webkit-scrollbar{display:none}
@media (min-width:900px){.s1-tabs{justify-content:center;margin-inline:0}}
.s1-tab{position:relative;flex:none;height:44px;padding:0 18px;border-radius:999px;font-size:16px;color:var(--mut);overflow:hidden;border:1px solid var(--glass-line)}
.s1-tab[aria-selected="true"]{color:var(--ink);background:var(--glass)}
.s1-tab::after{content:"";position:absolute;inset-inline-start:14px;inset-inline-end:14px;bottom:6px;height:2px;border-radius:2px;background:var(--acc);transform-origin:right;transform:scaleX(var(--p,0));opacity:0;transition:opacity .3s}
.s1-tab[aria-selected="true"]::after{opacity:1}
.s1-panel{text-align:center;color:var(--mut);margin-top:16px;min-height:3.4em}

/* editor: steps follow the recording */
.s1-ed{display:grid;gap:28px;align-items:center}
@media (min-width:900px){.s1-ed{grid-template-columns:300px 1fr;gap:48px}}
.s1-steps{display:grid;gap:8px;position:relative}
.s1-step{display:grid;grid-template-columns:40px 1fr;gap:4px 14px;align-items:center;text-align:start;padding:14px;border-radius:18px;border:1px solid transparent;transition:background-color .4s,border-color .4s,opacity .4s;opacity:.55}
.s1-step b{grid-row:span 2;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-family:var(--f-head);font-size:20px;background:var(--card2);color:var(--ink2);transition:background-color .4s,color .4s}
.s1-step strong{font-family:var(--f-head);font-size:22px;line-height:1.2}
.s1-step span{font-size:16px;color:var(--mut)}
.s1-step.on{opacity:1;background:var(--glass);border-color:var(--glass-line)}
.s1-step.on b{background:var(--acc);color:#fff}
.s1-step.done{opacity:.8}
@media (max-width:899px){
  .s1-steps{grid-template-columns:repeat(4,1fr);gap:6px;order:2}
  .s1-step{grid-template-columns:1fr;justify-items:center;text-align:center;padding:10px 4px}
  .s1-step b{grid-row:auto;width:34px;height:34px}
  .s1-step strong{font-size:18px}
  .s1-step span{display:none}
}
.s1-edframe{border-radius:22px;padding:8px}
.s1-edframe .vid{border-radius:16px;aspect-ratio:1440/900}
.s1-edframe.only-m{max-width:320px;margin-inline:auto;border-radius:40px;padding:7px}
.s1-edframe.only-m .vid{border-radius:34px;aspect-ratio:390/844}

/* templates rail */
.s1-railhd{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:28px}
.s1-railhd .s1-hd{justify-items:start;text-align:start;margin:0}
.s1-arrows{display:none;gap:8px}
@media (min-width:900px){.s1-arrows{display:flex}}
.s1-arrows button{width:48px;height:48px;border-radius:999px;border:1px solid var(--glass-line);display:grid;place-items:center;font-size:20px}
.s1-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-inline:var(--gut);margin-inline:calc(-1*var(--gut));padding-bottom:8px}
.s1-track::-webkit-scrollbar{display:none}
.s1-tp{flex:none;width:min(66vw,250px);scroll-snap-align:start;border-radius:28px;padding:8px;display:grid;gap:10px;transition:transform .5s var(--out)}
@media (hover:hover){.s1-tp:hover{transform:translateY(-6px)}}
.s1-tp img{border-radius:21px;aspect-ratio:480/1039;object-fit:cover;object-position:top;width:100%;background:var(--card2)}
.s1-tp .soon img{object-fit:cover}
.s1-tp p{padding:0 8px 6px;display:grid}
.s1-tp strong{font-family:var(--f-head);font-size:19px;line-height:1.3}
.s1-tp span{font-size:14px;color:var(--mut)}
.s1-tp em{font-style:normal;font-size:13px;color:var(--acc-ink)}

/* faq */
.s1-faq{max-width:760px;margin-inline:auto;display:grid;gap:10px}
.s1-faq details{border-radius:20px;padding:0 20px}
.s1-faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 0;font-size:19px;font-weight:600}
.s1-faq summary svg{flex:none;transition:transform .4s var(--out);color:var(--mut)}
.s1-faq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s1-faq details p{padding-bottom:20px;color:var(--mut);font-size:17px}
.s1-more{display:flex;justify-content:center;margin-top:24px}

/* footer: the wordmark rises out of the footer's top edge */
.s1-foot{position:relative;margin-top:40px;overflow:hidden;isolation:isolate}
.s1-fmark{position:relative;height:clamp(84px,17vw,230px);overflow:hidden;display:flex;justify-content:center}
.s1-fmark svg{width:min(94vw,1240px);height:auto;color:var(--ink);opacity:.92;transform:translateY(58%);transition:transform 1.8s var(--out)}
.s1-fmark.vis svg{transform:translateY(16%)}
.s1-fmark::after{content:"";position:absolute;inset-inline:0;bottom:0;height:60%;background:linear-gradient(to bottom,transparent,var(--bg2))}
.s1-fline{height:1px;background:linear-gradient(90deg,transparent,var(--acc) 30%,#F2A15C 50%,var(--acc) 70%,transparent);box-shadow:0 0 24px 2px var(--glow)}
.s1-fbody{background:var(--bg2);padding-block:48px 28px}
.s1-fgrid{display:grid;gap:36px}
@media (min-width:900px){.s1-fgrid{grid-template-columns:1.2fr 2fr}}
.s1-fbrand{display:grid;gap:16px;align-content:start}
.s1-fbrand>a svg{height:26px;width:auto}
.s1-fbrand p{color:var(--mut);max-width:36ch;font-size:17px}
.s1 .fc{display:grid;gap:4px;font-size:16px;justify-items:start}
.s1 .fc a{color:var(--acc-ink)}
.s1 .fl{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 16px}
@media (min-width:640px){.s1 .fl{grid-template-columns:repeat(3,1fr)}}
.s1 .fl-h{font-family:var(--f-head);font-size:18px;margin-bottom:10px}
.s1 .fl ul{display:grid;gap:8px;font-size:16px;color:var(--mut)}
.s1 .fl a:hover{color:var(--ink)}
.s1-fbase{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;align-items:center;border-top:1px solid var(--line);margin-top:40px;padding-top:20px;font-size:14px;color:var(--mut)}
.s1 .fs{display:flex;flex-wrap:wrap;gap:6px}
.s1 .fs a{display:inline-flex;height:34px;align-items:center;padding:0 12px;border-radius:999px;border:1px solid var(--line2);font-size:14px}

/* pricing, after the Forma picture */
.s1-pr{position:relative;min-height:100svh;margin-top:-66px;padding-top:120px;padding-bottom:80px;isolation:isolate}
.s1-prword{position:absolute;inset-inline:0;top:84px;text-align:center;font-family:var(--f-head);font-weight:800;font-size:clamp(110px,24vw,330px);line-height:1;color:var(--ink);opacity:.07;pointer-events:none;z-index:0;white-space:nowrap}
.s1-prhd{position:relative;z-index:1;text-align:center;display:grid;gap:12px;justify-items:center;margin-bottom:40px}
.s1-cards{position:relative;z-index:1;display:grid;gap:16px;max-width:1080px;margin-inline:auto}
@media (min-width:960px){.s1-cards{grid-template-columns:repeat(3,1fr);align-items:stretch}}
.s1-card{border-radius:30px;padding:28px 24px 24px;display:flex;flex-direction:column;gap:18px;position:relative}
.s1-card.pro{border-color:color-mix(in srgb,var(--acc) 55%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--acc) 25%,transparent),0 0 60px -10px var(--glow),inset 0 0 40px -20px var(--glow)}
.s1-card .nm{font-size:20px;color:var(--ink2);display:flex;justify-content:space-between;align-items:center}
.s1-card .badge{font-size:13px;padding:3px 10px;border-radius:999px;background:var(--acc-soft);color:var(--acc-ink)}
.s1-card .amt{font-family:var(--f-head);font-size:52px;line-height:1;display:flex;align-items:baseline;gap:6px}
.s1-card .amt small{font-size:20px;color:var(--mut);font-family:var(--f-ui)}
.s1-card .sub{color:var(--mut);font-size:16px}
.s1-card ul{display:grid;gap:10px;font-size:16px;flex:1}
.s1-card li{display:grid;grid-template-columns:24px 1fr;gap:10px;align-items:start}
.s1-card li svg{width:24px;height:24px;padding:5px;border-radius:50%;background:var(--card3);color:var(--ink)}
.s1-card .btn{width:100%;background:var(--ink);color:var(--bg)}
.s1-card .ft{font-size:14px;color:var(--mut);text-align:center}
.s1-prfaq{position:relative;z-index:1}
.rd.shot .s1-tilt{transform:none!important;opacity:1!important}
.rd.shot .s1-fmark svg{transform:translateY(16%)!important}
`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className="s1-faq">
      {list.map((f, i) => (
        <details key={f.q} className="glass" data-r style={{ ['--i' as string]: i % 3 }}>
          <summary>{f.q}<Plus size={22} strokeWidth={1.6} /></summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer className="s1-foot">
      <div className="s1-fmark" data-vis aria-hidden><Mark /></div>
      <div className="s1-fline" />
      <div className="s1-fbody">
        <div className="wrap">
          <div className="s1-fgrid">
            <div className="s1-fbrand">
              <a href="/" aria-label="بينون"><Mark /></a>
              <p>{FOOTER.claim}</p>
              <a className="btn btn-ink" href="/templates" style={{ justifySelf: 'start' }}>ابدأ الإنشاء</a>
              <Contact />
            </div>
            <FooterLinks />
          </div>
          <div className="s1-fbase">
            <span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span>
            <Socials />
          </div>
        </div>
      </div>
    </footer>
  )
}

export function Home() {
  const row = [...REVIEWS, ...REVIEWS]
  return (
    <Root id="s1" mode="dark" css={CSS}>
      <Header />
      <section className="s1-hero">
        <div className="s1-sky" aria-hidden><i className="b1" /><i className="b2" /><i className="b3" /></div>
        <div className="s1-ghost" aria-hidden><Mark /></div>
        <div className="wrap s1-hero-in">
          <p className="s1-claim glass"><b aria-hidden />{HERO.claim}</p>
          <h1 className="head s1-h1">
            {HERO.words.map((w, i) => <span key={w}><i style={{ ['--i' as string]: i }}>{w}.</i></span>)}
          </h1>
          <p className="lead">{HERO.sub}</p>
          <div className="s1-ctas">
            <a className="btn btn-white" href={HERO.primary.href}>{HERO.primary.label}</a>
            <a className="btn btn-line glass" href={HERO.secondary.href}>{HERO.secondary.label}</a>
          </div>
        </div>
      </section>

      <section className="s1-sec">
        <div className="wrap s1-hd" data-r>
          <h2 className="head s1-title">ماذا يقول من جرّب بينون</h2>
        </div>
        <div className="s1-rows" data-r>
          {[0, 1].map((r) => (
            <div key={r} className={'s1-row' + (r ? ' rev' : '')}>
              {[...row, ...row].map((rv, i) => (
                <figure key={i} className="s1-rv glass" aria-hidden={i >= REVIEWS.length || r === 1 ? true : undefined}>
                  <Stars n={rv.rating} />
                  <blockquote>«{rv.body}»</blockquote>
                  <figcaption><span>{rv.name}</span><span className="tag">بانتظار موافقتك</span></figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
        <div className="wrap"><p className="note s1-revnote">{REVIEWS_NOTE}</p></div>
      </section>

      <section className="s1-sec">
        <div className="wrap">
          <div className="s1-hd" data-r>
            <h2 className="head s1-title">لوحة تحكم واحدة لكل شيء</h2>
            <p className="lead">الحجوزات، والزوار، والتقييمات، وظهورك في جوجل. كلها في مكان واحد.</p>
          </div>
          <div data-tabs>
            <div className="s1-stage">
              <div className="s1-tilt glass only-d" data-vis>
                <div className="vid"><Vid v={DASH_D} kind="d" label="جولة في لوحة تحكم بينون" /></div>
              </div>
              <div className="s1-tilt glass only-m" data-vis>
                <div className="vid"><Vid v={DASH_M} kind="m" label="لوحة تحكم بينون على الهاتف" /></div>
              </div>
            </div>
            <div className="s1-tabs" role="tablist" aria-label="أقسام لوحة التحكم">
              {DASH_FEATURES.map((f, i) => (
                <button key={f.id} type="button" role="tab" className="s1-tab" data-tab={i} data-d={f.d.join(',')} data-m={f.m.join(',')}>{f.title}</button>
              ))}
            </div>
            {DASH_FEATURES.map((f, i) => <p key={f.id} className="s1-panel" data-panel={i} hidden={i > 0}>{f.body}</p>)}
          </div>
        </div>
      </section>

      <section className="s1-sec">
        <div className="wrap">
          <div className="s1-hd" data-r>
            <h2 className="head s1-title">عدّل موقعك كما تكتب رسالة</h2>
            <p className="lead">اضغط على أي نص في موقعك واكتب. غيّر الألوان والخطوط، ثم انشر بضغطة.</p>
          </div>
          <div className="s1-ed" data-sync>
            <ol className="s1-steps">
              {EDIT_STEPS.map((s, i) => (
                <li key={s.id} className="s1-step" data-step data-d={s.d} data-m={s.m}>
                  <b>{i + 1}</b><strong>{s.title}</strong><span>{s.body}</span>
                </li>
              ))}
            </ol>
            <div>
              <div className="s1-edframe glass only-d" data-r><div className="vid"><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></div></div>
              <div className="s1-edframe glass only-m" data-r><div className="vid"><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="s1-sec" data-rail>
        <div className="wrap">
          <div className="s1-railhd" data-r>
            <div className="s1-hd">
              <h2 className="head s1-title">قالب لكل نشاط</h2>
              <p className="lead">ثمانية قوالب جاهزة. اختر قالب نشاطك، وبينون تكتب المحتوى وترتّب الأقسام.</p>
            </div>
            <div className="s1-arrows"><button type="button" data-prev aria-label="السابق">→</button><button type="button" data-next aria-label="التالي">←</button></div>
          </div>
          <div className="s1-track" data-track>
            {TEMPLATES.map((t, i) => (
              <a key={t.id} href={t.href} className="s1-tp glass" data-r style={{ ['--i' as string]: i % 4 }}>
                <img src={phoneShot(t.id)} alt={t.name} loading="lazy" width={480} height={1039} />
                <p><strong>{t.name}</strong><span>{t.tag}</span>{'soon' in t && t.soon ? <em>قريبًا</em> : null}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="s1-sec">
        <div className="wrap">
          <div className="s1-hd" data-r><h2 className="head s1-title">أسئلة شائعة</h2></div>
          <Faq />
          <div className="s1-more"><a className="btn btn-line glass" href="/faq">كل الأسئلة</a></div>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s1" mode="dark" css={CSS}>
      <Header />
      <section className="s1-pr">
        <div className="s1-sky" aria-hidden><i className="b1" /><i className="b2" /><i className="b3" /></div>
        <div className="s1-prword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s1-prhd">
            <h1 className="head s1-title">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="lead">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s1-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s1-card glass' + (p.id === 'pro' ? ' pro' : '')} data-r style={{ ['--i' as string]: i }}>
                <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                <p className="amt"><span className="ltr">{p.amount}</span><small>{p.per}</small></p>
                <p className="sub">{p.sub}</p>
                <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.4} />{f}</li>)}</ul>
                <a className="btn" href={p.href}>{p.cta}</a>
                <p className="ft">{p.foot}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="s1-sec s1-prfaq">
        <div className="wrap">
          <div className="s1-hd" data-r><h2 className="head s1-title">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
