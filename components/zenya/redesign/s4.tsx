/**
 * Style 4 — «حركة» (Motion). The loudest of the five: the three verbs set
 * huge, a band of real business types running under them, big moving type
 * for reviews, a rail of dashboard parts, templates drifting in two rows.
 * Dark by default, light works too.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus } from './base'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER } from './data'

const NICHES = ['مطاعم', 'مقاهي', 'خدمات محلية', 'حِرف', 'مراكز عافية', 'سبا', 'أزياء', 'علامات تجارية', 'تطبيقات', 'متاجر']

const CSS = `
.s4 .h{background:color-mix(in srgb,var(--bg) 70%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.s4 .h-in{height:64px}
.s4 .h-nav a{position:relative;background:none!important}
.s4 .h-nav a::after{content:"";position:absolute;inset-inline:14px;bottom:4px;height:2px;background:var(--acc);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--out)}
.s4 .h-nav a:hover::after{transform:scaleX(1);transform-origin:right}
.s4 .h-cta{background:var(--acc);color:#16120D}

.s4-mesh{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.s4-mesh i{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5;will-change:transform}
.s4-mesh .m1{width:55vmax;height:55vmax;background:#E2532A;bottom:-30vmax;inset-inline-end:-12vmax;animation:s4m1 16s ease-in-out infinite alternate}
.s4-mesh .m2{width:40vmax;height:40vmax;background:#8C3416;top:-16vmax;inset-inline-start:10vmax;opacity:.45;animation:s4m2 20s ease-in-out infinite alternate}
.s4[data-mode="light"] .s4-mesh i{opacity:.22}
@keyframes s4m1{to{transform:translate(-20vmax,-12vmax)}}
@keyframes s4m2{to{transform:translate(16vmax,14vmax) scale(1.2)}}

.s4-hero{position:relative;isolation:isolate;margin-top:-64px;padding-top:64px;min-height:100svh;display:grid;align-content:center;overflow:hidden}
.s4-hero-in{position:relative;z-index:1;display:grid;gap:26px;padding-block:32px 40px}
@media (min-width:960px){.s4-hero-in{grid-template-columns:1fr 340px;align-items:end;column-gap:48px}}
.s4-claim{font-size:17px;color:var(--ink2);display:flex;gap:10px;align-items:center}
.s4-claim::before{content:"";width:10px;height:10px;background:var(--acc);transform:rotate(45deg)}
@media (min-width:960px){.s4-claim{grid-column:1/-1}}
.s4-words{font-family:var(--f-head);font-weight:800;font-size:clamp(80px,min(21vw,16.5svh),200px);line-height:1.2;display:grid}
.s4-words span{display:block;overflow:hidden;padding:.16em 0 .22em;margin:-.16em 0 -.22em}
.s4-words b{display:block;font-weight:inherit;animation:s4in 1.1s var(--out) both,s4hot 6s linear infinite;animation-delay:calc(var(--i)*.13s),calc(1.4s + var(--i)*2s)}
.s4-words span:nth-child(2) b{padding-inline-start:.6em}
.s4-words span:nth-child(3) b{padding-inline-start:.2em}
@keyframes s4in{from{transform:translateY(100%)}to{transform:none}}
@keyframes s4hot{0%,30%{color:var(--acc)}34%,100%{color:var(--ink)}}
.s4-side{display:grid;gap:20px;align-content:end}
.s4-side .lead{font-size:20px;color:var(--ink2)}
.s4-ctas{display:flex;flex-wrap:wrap;gap:10px}
.s4 .btn-acc{background:var(--acc);color:#16120D}

.s4-band{background:var(--acc);color:#16120D;overflow:hidden;padding-block:14px;border-block:1px solid rgba(22,18,13,.2)}
.s4-band div{display:flex;width:max-content;animation:s4mq 30s linear infinite}
.s4-band span{display:flex;align-items:center;gap:22px;padding-inline-end:22px;font-family:var(--f-head);font-size:26px;font-weight:700;white-space:nowrap}
.s4-band span::after{content:"";width:9px;height:9px;background:#16120D;transform:rotate(45deg)}
@keyframes s4mq{to{transform:translateX(50%)}}

.s4-sec{position:relative;padding-block:88px}
@media (min-width:900px){.s4-sec{padding-block:128px}}
.s4-title{font-size:clamp(40px,6.4vw,76px);font-weight:800;line-height:1.05}
.s4-hd{display:grid;gap:14px;margin-bottom:40px;max-width:820px}

/* reviews: big moving type */
.s4-tick{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.s4-tick>div{display:flex;width:max-content;animation:s4mq 46s linear infinite}
.s4-tick:hover>div{animation-play-state:paused}
.s4-tq{display:flex;align-items:center;gap:28px;padding-inline-end:28px;white-space:nowrap}
.s4-tq q{font-family:var(--f-head);font-size:clamp(34px,5vw,64px);font-weight:700;quotes:"«" "»"}
.s4-tq q::before,.s4-tq q::after{color:var(--acc)}
.s4-tq small{display:grid;font-size:15px;color:var(--mut);line-height:1.4}
.s4-tq small i{font-style:normal;color:var(--acc-ink)}
.s4-tq .stars svg{width:20px;height:20px}

/* dashboard: a rail of parts */
.s4-railbar{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:28px}
.s4-railbar .s4-hd{margin:0}
.s4-arrows{display:none;gap:8px}
@media (min-width:900px){.s4-arrows{display:flex}}
.s4-arrows button{width:52px;height:52px;border-radius:50%;background:var(--card2);font-size:22px;transition:background-color .3s,color .3s}
.s4-arrows button:hover{background:var(--acc);color:#16120D}
.s4-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-inline:var(--gut);margin-inline:calc(-1*var(--gut))}
.s4-track::-webkit-scrollbar{display:none}
.s4-card{flex:none;width:min(84vw,330px);scroll-snap-align:center;border-radius:28px;background:var(--card);border:1px solid var(--line2);overflow:hidden;display:flex;flex-direction:column}
@media (min-width:768px){.s4-card{width:min(70vw,780px);scroll-snap-align:start}}
.s4-card .vid{aspect-ratio:390/600;background:var(--card2)}
.s4-card .vid video{object-position:top}
@media (min-width:768px){.s4-card .vid{aspect-ratio:1440/900}}
.s4-card div.t{padding:20px 22px 24px;display:grid;gap:6px}
.s4-card h3{font-family:var(--f-head);font-size:30px;font-weight:700;line-height:1.15}
.s4-card p{color:var(--mut);font-size:17px}
.s4-prog{height:3px;border-radius:2px;background:var(--line2);margin-top:22px;overflow:hidden}
.s4-prog i{display:block;height:100%;width:100%;background:var(--acc);transform-origin:right;transform:scaleX(.2)}
@supports (animation-timeline:scroll()){.s4-prog i{animation:s4p linear both;animation-timeline:--s4rail}.s4-track{scroll-timeline:--s4rail inline}.s4-dash{timeline-scope:--s4rail}}
@keyframes s4p{from{transform:scaleX(.2)}to{transform:scaleX(1)}}

/* editor: the four verbs light up with the recording */
.s4-verbs{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:8px;margin-bottom:24px}
.s4-verb{font-family:var(--f-head);font-weight:800;font-size:clamp(34px,8vw,96px);line-height:1;color:var(--ink);opacity:.18;transition:opacity .5s var(--out),color .5s,transform .6s var(--out);cursor:pointer}
.s4-verb.on{opacity:1;color:var(--acc);transform:translateY(-4px)}
.s4-verb.done{opacity:.55}
.s4-ed .vid{border-radius:24px;border:1px solid var(--line2);aspect-ratio:1440/900}
.s4-ed .only-m{max-width:300px;margin-inline:auto}
.s4-ed .only-m.vid{aspect-ratio:390/844;border-radius:34px;border:6px solid var(--card3)}

/* templates drift in two rows */
.s4-rows{display:grid;gap:16px}
.s4-row{display:flex;gap:16px;width:max-content;animation:s4mq 60s linear infinite}
.s4-row.rev{animation-direction:reverse;animation-duration:70s}
.s4-rows:hover .s4-row{animation-play-state:paused}
.s4-tp{flex:none;width:clamp(150px,18vw,220px);display:grid;gap:8px}
.s4-tp img{width:100%;aspect-ratio:480/1039;object-fit:cover;object-position:top;border-radius:22px;border:1px solid var(--line2);background:var(--card2);transition:transform .6s var(--out)}
@media (hover:hover){.s4-tp:hover img{transform:translateY(-8px) rotate(-1.5deg)}}
.s4-tp strong{font-family:var(--f-head);font-size:18px;line-height:1.3}
.s4-tp em{font-style:normal;color:var(--acc-ink);font-size:14px;margin-inline-start:6px}

/* faq: large type */
.s4-faq{border-top:1px solid var(--line2)}
.s4-faq details{border-bottom:1px solid var(--line2)}
.s4-faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 0;font-family:var(--f-head);font-weight:700;font-size:clamp(22px,2.8vw,32px);line-height:1.3;transition:color .3s}
.s4-faq summary:hover{color:var(--acc-ink)}
.s4-faq summary svg{flex:none;width:30px;height:30px;transition:transform .5s var(--out)}
.s4-faq details[open] summary svg{transform:rotate(135deg);color:var(--acc)}
.s4-faq p{padding-bottom:24px;color:var(--mut);max-width:64ch}

/* footer: a band, then the wordmark with light running through it */
.s4-foot{position:relative;margin-top:24px}
.s4-fmark{padding:28px var(--gut) 0;display:flex;justify-content:center}
.s4-fmark svg{width:100%;max-width:1400px;height:auto}
.s4-fmark path{fill:url(#s4grad)}
.s4-fbody{padding-block:40px 28px}
.s4-fgrid{display:grid;gap:36px}
@media (min-width:900px){.s4-fgrid{grid-template-columns:1fr 2fr}}
.s4-fbrand{display:grid;gap:14px;align-content:start}
.s4-fbrand p{color:var(--mut);font-size:17px;max-width:34ch}
.s4 .fc{display:grid;gap:4px;justify-items:start;font-size:16px}
.s4 .fc a{color:var(--acc-ink)}
.s4 .fl{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 16px}
@media (min-width:640px){.s4 .fl{grid-template-columns:repeat(3,1fr)}}
.s4 .fl-h{font-family:var(--f-head);font-weight:700;font-size:20px;margin-bottom:10px}
.s4 .fl ul{display:grid;gap:8px;font-size:16px;color:var(--mut)}
.s4 .fl a:hover{color:var(--acc-ink)}
.s4-fbase{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;border-top:1px solid var(--line2);margin-top:40px;padding-top:18px;font-size:14px;color:var(--mut)}
.s4 .fs{display:flex;flex-wrap:wrap;gap:4px 18px}
.s4 .fs a:hover{color:var(--acc-ink)}

/* pricing */
.s4-pr{position:relative;isolation:isolate;overflow:hidden;margin-top:-64px;padding:120px 0 96px}
.s4-prword{position:absolute;top:110px;inset-inline:0;z-index:0;overflow:hidden;pointer-events:none}
.s4-prword div{display:flex;width:max-content;animation:s4mq 40s linear infinite}
.s4-prword span{font-family:var(--f-head);font-weight:800;font-size:clamp(130px,22vw,300px);line-height:1;color:transparent;-webkit-text-stroke:1.2px var(--line2);padding-inline-end:.4em;white-space:nowrap}
.s4-pr .s4-hd{position:relative;z-index:1}
.s4-cards{position:relative;z-index:1;display:grid;gap:14px}
@media (min-width:960px){.s4-cards{grid-template-columns:repeat(3,1fr)}}
.s4-card2{border-radius:28px;background:var(--card);border:1px solid var(--line2);padding:26px 24px 24px;display:flex;flex-direction:column;gap:16px}
.s4-card2.pro{background:var(--acc);color:#16120D;border-color:transparent;--mut:rgba(22,18,13,.72);--line2:rgba(22,18,13,.2)}
.s4-card2 .nm{display:flex;justify-content:space-between;align-items:center;font-family:var(--f-head);font-weight:700;font-size:24px}
.s4-card2 .badge{font-family:var(--f-ui);font-weight:600;font-size:13px;padding:3px 10px;border-radius:999px;background:var(--acc);color:#16120D}
.s4-card2 .amt{display:flex;align-items:baseline;gap:6px;font-family:var(--f-head);font-weight:800;font-size:clamp(60px,6vw,76px);line-height:1}
.s4-card2 .amt small{font-family:var(--f-ui);font-weight:400;font-size:18px;color:var(--mut)}
.s4-card2 .sub{color:var(--mut);font-size:16px}
.s4-card2 ul{display:grid;gap:10px;font-size:16px;flex:1;border-top:1px solid var(--line2);padding-top:16px}
.s4-card2 li{display:grid;grid-template-columns:20px 1fr;gap:10px}
.s4-card2 li svg{width:18px;height:18px;margin-top:5px;color:var(--acc)}
.s4-card2.pro li svg{color:#16120D}
.s4-card2 .btn{width:100%;background:var(--ink);color:var(--bg)}
.s4-card2.pro .btn{background:#16120D;color:#F4EFE6}
.s4-card2 .ft{font-size:14px;color:var(--mut);text-align:center}
@media (prefers-reduced-motion:reduce){.s4-band div,.s4-tick>div,.s4-row,.s4-prword div{animation:none}.s4-tick,.s4-rows{overflow-x:auto}}
`

function Band({ items }: { items: string[] }) {
  const all = [...items, ...items, ...items, ...items]
  return <div className="s4-band" aria-hidden><div>{all.map((n, i) => <span key={i}>{n}</span>)}</div></div>
}

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return <div className="s4-faq">{list.map((f) => <details key={f.q}><summary>{f.q}<Plus strokeWidth={1.4} /></summary><p>{f.a}</p></details>)}</div>
}

function Footer() {
  return (
    <footer className="s4-foot">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="s4grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="566" y2="0" spreadMethod="repeat">
            <stop offset="0" style={{ stopColor: 'var(--ink)' }} />
            <stop offset=".38" style={{ stopColor: 'var(--ink)' }} />
            <stop offset=".5" style={{ stopColor: '#E2532A' }} />
            <stop offset=".62" style={{ stopColor: 'var(--ink)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ink)' }} />
            <animateTransform attributeName="gradientTransform" type="translate" from="566 0" to="0 0" dur="5s" repeatCount="indefinite" />
          </linearGradient>
        </defs>
      </svg>
      <Band items={['ابدأ مجانًا', 'ابنِ موقعك', 'أدِر نشاطك', 'انشر اليوم']} />
      <div className="s4-fmark" aria-hidden><Mark /></div>
      <div className="wrap s4-fbody">
        <div className="s4-fgrid">
          <div className="s4-fbrand">
            <p>{FOOTER.claim}</p>
            <a className="btn btn-acc" href="/templates" style={{ justifySelf: 'start' }}>ابدأ الإنشاء</a>
            <Contact />
          </div>
          <FooterLinks />
        </div>
        <div className="s4-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
      </div>
    </footer>
  )
}

export function Home() {
  const tq = [...REVIEWS, ...REVIEWS]
  const row1 = TEMPLATES.slice(0, 4), row2 = TEMPLATES.slice(4)
  return (
    <Root id="s4" mode="dark" css={CSS}>
      <Header />
      <section className="s4-hero">
        <div className="s4-mesh" aria-hidden><i className="m1" /><i className="m2" /></div>
        <div className="wrap s4-hero-in">
          <p className="s4-claim">{HERO.claim}</p>
          <h1 className="s4-words">{HERO.words.map((w, i) => <span key={w}><b style={{ ['--i' as string]: i }}>{w}</b></span>)}</h1>
          <div className="s4-side">
            <p className="lead">{HERO.sub}</p>
            <div className="s4-ctas">
              <a className="btn btn-acc" href={HERO.primary.href}>{HERO.primary.label}</a>
              <a className="btn btn-line" href={HERO.secondary.href}>{HERO.secondary.label}</a>
            </div>
          </div>
        </div>
      </section>
      <Band items={NICHES} />

      <section className="s4-sec">
        <div className="wrap s4-hd" data-r><h2 className="s4-title">ماذا يقول من جرّب بينون</h2></div>
        <div className="s4-tick" data-r>
          <div>
            {[...tq, ...tq].map((r, i) => (
              <div key={i} className="s4-tq" aria-hidden={i >= REVIEWS.length ? true : undefined}>
                <Stars n={r.rating} /><q>{r.body}</q><small>{r.name}<i>بانتظار موافقتك</i></small>
              </div>
            ))}
          </div>
        </div>
        <div className="wrap"><p className="note" style={{ marginTop: 24 }}>{REVIEWS_NOTE}</p></div>
      </section>

      <section className="s4-sec s4-dash" data-rail>
        <div className="wrap">
          <div className="s4-railbar" data-r>
            <div className="s4-hd">
              <h2 className="s4-title">لوحة تحكم واحدة لكل شيء</h2>
              <p className="lead">الحجوزات، والزوار، والتقييمات، وظهورك في جوجل. كلها في مكان واحد.</p>
            </div>
            <div className="s4-arrows"><button type="button" data-prev aria-label="السابق">→</button><button type="button" data-next aria-label="التالي">←</button></div>
          </div>
          <div className="s4-track" data-track>
            {DASH_FEATURES.map((f) => (
              <article key={f.id} className="s4-card">
                <div className="vid">
                  <Vid v={DASH_D} kind="d" seg={f.d} className="only-d" label={'لوحة التحكم: ' + f.title} />
                  <Vid v={DASH_M} kind="m" seg={f.m} className="only-m" label={'لوحة التحكم على الهاتف: ' + f.title} />
                </div>
                <div className="t"><h3>{f.title}</h3><p>{f.body}</p></div>
              </article>
            ))}
          </div>
          <div className="s4-prog" aria-hidden><i /></div>
        </div>
      </section>

      <section className="s4-sec">
        <div className="wrap">
          <div className="s4-hd" data-r>
            <h2 className="s4-title">عدّل موقعك كما تكتب رسالة</h2>
            <p className="lead">اضغط على أي نص في موقعك واكتب. غيّر الألوان والخطوط، ثم انشر بضغطة.</p>
          </div>
          <div className="s4-ed" data-sync>
            <div className="s4-verbs">{EDIT_STEPS.map((s) => <span key={s.id} className="s4-verb" data-step data-d={s.d} data-m={s.m}>{s.title}</span>)}</div>
            <div className="vid only-d" data-r><Vid v={EDIT_D} kind="d" label="تعديل موقع في محرر بينون" /></div>
            <div className="vid only-m" data-r><Vid v={EDIT_M} kind="m" label="تعديل موقع من الهاتف" /></div>
          </div>
        </div>
      </section>

      <section className="s4-sec">
        <div className="wrap s4-hd" data-r>
          <h2 className="s4-title">قالب لكل نشاط</h2>
          <p className="lead">ثمانية قوالب جاهزة. اختر قالب نشاطك، وبينون تكتب المحتوى وترتّب الأقسام.</p>
        </div>
        <div className="s4-rows">
          {[row1, row2].map((row, r) => (
            <div key={r} className={'s4-row' + (r ? ' rev' : '')}>
              {[...row, ...row, ...row, ...row].map((t, i) => (
                <a key={i} href={t.href} className="s4-tp" aria-hidden={i >= row.length ? true : undefined} tabIndex={i >= row.length ? -1 : undefined}>
                  <img src={phoneShot(t.id)} alt={t.name} loading="lazy" />
                  <strong>{t.name}{'soon' in t && t.soon ? <em>قريبًا</em> : null}</strong>
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="s4-sec">
        <div className="wrap">
          <div className="s4-hd" data-r><h2 className="s4-title">أسئلة شائعة</h2></div>
          <Faq />
          <p style={{ marginTop: 24 }}><a className="btn btn-line" href="/faq">كل الأسئلة</a></p>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s4" mode="dark" css={CSS}>
      <Header />
      <section className="s4-pr">
        <div className="s4-mesh" aria-hidden><i className="m1" /><i className="m2" /></div>
        <div className="s4-prword" aria-hidden><div>{[0, 1, 2, 3].map((i) => <span key={i}>الأسعار</span>)}</div></div>
        <div className="wrap">
          <div className="s4-hd">
            <h1 className="s4-title">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="lead">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s4-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s4-card2' + (p.id === 'pro' ? ' pro' : '')} data-r style={{ ['--i' as string]: i }}>
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
      <section className="s4-sec">
        <div className="wrap">
          <div className="s4-hd"><h2 className="s4-title">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
