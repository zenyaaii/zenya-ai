/**
 * Style 3 — «شبكة» (Grid). Structured, product-first SaaS: a dot grid with a
 * soft light that drifts (and follows the pointer on a laptop), a rolling
 * verb in the headline, and bento tiles that each hold one real thing.
 * Light by default.
 */
import { Root, Header, Vid, Stars, FooterLinks, Contact, Socials, Mark, Check, Plus, ArrowUpLeft } from './base'
import { BarChart3, MessageSquareQuote, Search, CalendarCheck } from 'lucide-react'
import { HERO, REVIEWS, REVIEWS_NOTE, DASH_D, DASH_M, EDIT_D, EDIT_M, DASH_FEATURES, EDIT_STEPS, TEMPLATES, wideShot, phoneShot, FAQS, PRICING_FAQS, PRICING_HEAD, PLANS, FOOTER } from './data'

const CSS = `
.s3{--dot:rgba(22,18,13,.16)}
.s3[data-mode="dark"]{--dot:rgba(244,239,230,.13)}
.s3 .h{padding-top:12px}
.s3 .h-in{height:60px;background:color-mix(in srgb,var(--card) 88%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid var(--line2);border-radius:18px;padding-inline:16px 8px}
.s3 .h>.wrap.h-in{width:calc(100% - 2*var(--gut))}
.s3 .h-cta{border-radius:12px}
.s3 .h-icon{border-radius:12px}
.s3 .h-drawer{width:calc(100% - 2*var(--gut));margin-top:8px;border-radius:18px;background:var(--card);padding-inline:16px}
.s3[data-menu="open"] .h-drawer{border:1px solid var(--line2)}

.s3-dots{position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:radial-gradient(var(--dot) 1.1px,transparent 1.3px);background-size:22px 22px;
  -webkit-mask-image:radial-gradient(60% 60% at var(--mx,70%) var(--my,30%),#000 0%,rgba(0,0,0,.35) 60%,transparent 100%);
  mask-image:radial-gradient(60% 60% at var(--mx,70%) var(--my,30%),#000 0%,rgba(0,0,0,.35) 60%,transparent 100%)}
.s3-spot{position:absolute;z-index:0;width:70vmax;height:70vmax;left:calc(var(--mx,70%) - 35vmax);top:calc(var(--my,30%) - 35vmax);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(226,83,42,.22),rgba(226,83,42,0));transition:left 1.2s var(--out),top 1.2s var(--out);animation:s3drift 18s ease-in-out infinite alternate}
@keyframes s3drift{to{transform:translate(-8vmax,10vmax) scale(1.1)}}

.s3-hero{position:relative;isolation:isolate;margin-top:-72px;padding-top:72px;min-height:100svh;display:grid;align-items:center;overflow:hidden}
.s3-hero-g{position:relative;z-index:1;display:grid;gap:40px;align-items:center;padding-block:40px 56px}
@media (min-width:960px){.s3-hero-g{grid-template-columns:1.1fr .9fr}}
.s3-hero-t{display:grid;gap:22px;justify-items:start}
.s3-claim{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:10px;border:1px solid var(--line2);background:var(--card);font-size:16px;color:var(--ink2)}
.s3-claim i{width:7px;height:7px;border-radius:1px;background:var(--acc);transform:rotate(45deg)}
.s3-h1{font-size:clamp(52px,8.4vw,108px);line-height:1.08;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .25em}
.s3-roll{display:inline-grid;height:1.2em;overflow:hidden;color:var(--acc-ink);vertical-align:bottom}
.s3-roll span{grid-area:1/1;display:block;line-height:1.2em;animation:s3roll 7.2s var(--out) infinite;animation-delay:calc(var(--i)*-2.4s);opacity:0}
@keyframes s3roll{0%{transform:translateY(100%);opacity:0}6%,30%{transform:none;opacity:1}36%,100%{transform:translateY(-100%);opacity:0}}
.s3-hero .lead{font-size:clamp(19px,2vw,21px);max-width:32ch}
.s3-ctas{display:flex;flex-wrap:wrap;gap:10px}
.s3 .btn{border-radius:14px}
.s3-fan{position:relative;height:clamp(360px,44vw,560px)}
.s3-fan img{position:absolute;top:50%;left:50%;width:clamp(150px,15vw,220px);aspect-ratio:480/1039;object-fit:cover;object-position:top;border-radius:26px;border:6px solid var(--card);box-shadow:var(--shadow);
  animation:s3float 9s ease-in-out infinite alternate}
.s3-fan img:nth-child(1){transform:translate(-120%,-46%) rotate(-8deg);animation-delay:-3s}
.s3-fan img:nth-child(2){transform:translate(-50%,-54%);z-index:2}
.s3-fan img:nth-child(3){transform:translate(20%,-46%) rotate(8deg);animation-delay:-6s}
@keyframes s3float{to{translate:0 -14px}}
@media (max-width:959px){.s3-fan{height:290px;margin-bottom:-56px}.s3-fan img{width:132px;border-width:5px}.s3-fan img:nth-child(1){transform:translate(-112%,-44%) rotate(-7deg)}.s3-fan img:nth-child(3){transform:translate(12%,-44%) rotate(7deg)}}

.s3-sec{position:relative;padding-block:80px}
@media (min-width:900px){.s3-sec{padding-block:120px}}
.s3-title{font-size:clamp(34px,5vw,56px)}
.s3-hd{display:grid;gap:12px;margin-bottom:36px;max-width:680px}
.s3-cell{position:relative;border-radius:24px;border:1px solid var(--line2);background:var(--card);overflow:hidden;padding:22px}
.s3-cell h3{font-family:var(--f-head);font-size:24px;line-height:1.25}
.s3-cell p{color:var(--mut);font-size:16px}
.s3-cell .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--card2);margin-bottom:14px}
.s3-cell.tint{background:var(--acc-soft);border-color:transparent}
.s3-cell.tint .ic{background:var(--card)}
.s3-cell.ink{background:var(--inv);color:var(--on-inv);border-color:transparent;--mut:color-mix(in srgb,var(--on-inv) 66%,transparent)}
.s3-cell.ink .ic{background:color-mix(in srgb,var(--on-inv) 12%,transparent)}
.s3-cell.dotted{background-image:radial-gradient(var(--dot) 1px,transparent 1.2px);background-size:16px 16px}
@media (hover:hover){.s3-cell{transition:transform .5s var(--out),box-shadow .5s var(--out)}.s3-cell:hover{transform:translateY(-3px);box-shadow:var(--shadow)}}

/* reviews bento: 3 reviews + the note = 4 cells */
.s3-rg{display:grid;gap:12px}
@media (min-width:900px){.s3-rg{grid-template-columns:1.3fr 1fr 1fr;grid-template-rows:auto auto}.s3-rg .big{grid-row:span 2}.s3-rg .wide{grid-column:span 2}}
.s3-rg figure{display:grid;gap:14px;align-content:space-between;min-height:190px}
.s3-rg blockquote{font-size:20px;line-height:1.55}
.s3-rg .big blockquote{font-family:var(--f-head);font-size:clamp(28px,3vw,38px);line-height:1.35}
.s3-rg figcaption{display:flex;justify-content:space-between;gap:8px;font-size:15px;color:var(--mut)}
.s3-rg figcaption i{font-style:normal;color:var(--acc-ink)}
.s3-rg .wide{display:flex;align-items:center;min-height:0}
.s3-rg .wide p{font-size:16px}

/* dashboard bento: 5 cells */
.s3-dg{display:grid;gap:12px}
@media (min-width:900px){.s3-dg{grid-template-columns:repeat(3,1fr)}.s3-dg .c1{grid-column:span 2;grid-row:span 2}.s3-dg .c2{grid-row:span 2}}
.s3-dg .c1,.s3-dg .c2{padding:0;display:flex;flex-direction:column}
.s3-dg .cap{padding:18px 20px;display:grid;gap:4px}
.s3-dg .c1 .vid{aspect-ratio:1440/900;border-bottom:1px solid var(--line)}
.s3-dg .c2 .vid{flex:1;display:grid;place-items:center;background:var(--card2);padding:18px 18px 0}
.s3-dg .c2 .vid video{width:min(100%,250px);aspect-ratio:390/844;border-radius:28px 28px 0 0;border:5px solid var(--ink);border-bottom:0;object-fit:cover;object-position:top}
.s3-dg .c1 .only-m{display:none}
@media (max-width:767px){.s3-dg .c1 .vid{aspect-ratio:auto;display:grid;place-items:center;background:var(--card2);padding:18px 18px 0}.s3-dg .c1 .vid video{width:min(78%,280px);aspect-ratio:390/844;border-radius:30px 30px 0 0;border:5px solid var(--ink);border-bottom:0}.s3-dg .c1 .only-m{display:block}.s3-dg .c2{display:none}}

/* editor */
.s3-eg{display:grid;gap:12px}
@media (min-width:900px){.s3-eg{grid-template-columns:2fr 1fr}}
.s3-eg .v{padding:0}
.s3-eg .v .vid{aspect-ratio:1440/900}
.s3-eg .v .only-m{display:none}
@media (max-width:767px){.s3-eg .v .vid{aspect-ratio:auto;padding:18px 18px 0;background:var(--card2);display:grid;place-items:center}.s3-eg .v .vid video{width:min(78%,280px);aspect-ratio:390/844;border-radius:30px 30px 0 0;border:5px solid var(--ink);border-bottom:0}.s3-eg .v .only-m{display:block}}
.s3-eg .steps{display:grid;gap:6px;align-content:center}
.s3-es{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;padding:12px;border-radius:14px;transition:background-color .4s;align-items:center}
.s3-es b{grid-row:span 2;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-family:var(--f-head);background:color-mix(in srgb,var(--on-inv) 12%,transparent);transition:background-color .4s,color .4s}
.s3-es strong{font-family:var(--f-head);font-size:21px;line-height:1.2}
.s3-es span{font-size:15px;color:var(--mut)}
.s3-es.on{background:color-mix(in srgb,var(--on-inv) 8%,transparent)}
.s3-es.on b{background:var(--acc);color:#fff}
.s3-eg .bar{height:3px;border-radius:2px;background:color-mix(in srgb,var(--on-inv) 14%,transparent);margin-top:10px;overflow:hidden}
.s3-eg .bar i{display:block;height:100%;background:var(--acc);transform-origin:right;transform:scaleX(var(--t,0))}

/* templates bento: 8 cells, 4 x 3 */
.s3-tg{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
.s3-tg a{position:relative;border-radius:20px;overflow:hidden;border:1px solid var(--line2);background:var(--card2);min-height:170px;display:block}
.s3-tg a:first-child{grid-column:span 2;min-height:240px}
@media (min-width:900px){.s3-tg{grid-template-columns:repeat(4,1fr);grid-auto-rows:200px}.s3-tg a{min-height:0}.s3-tg a:first-child{grid-row:span 2}.s3-tg a:last-child{grid-column:span 2}}
.s3-tg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;transition:transform 1s var(--out)}
@media (hover:hover){.s3-tg a:hover img{transform:scale(1.05)}}
.s3-tg p{position:absolute;inset-inline:0;bottom:0;padding:40px 14px 12px;background:linear-gradient(to top,rgba(15,13,10,.86),rgba(15,13,10,0));color:#F4EFE6;display:grid}
.s3-tg strong{font-family:var(--f-head);font-size:19px;line-height:1.25}
.s3-tg span{font-size:13px;opacity:.8}
.s3-tg em{position:absolute;top:10px;inset-inline-start:10px;font-style:normal;font-size:13px;padding:2px 10px;border-radius:8px;background:var(--acc);color:#fff}

/* faq */
.s3-fq{display:grid;gap:10px}
@media (min-width:900px){.s3-fq{grid-template-columns:1fr 1fr;align-items:start}}
.s3-fq details{border-radius:18px;border:1px solid var(--line2);background:var(--card);padding:0 18px}
.s3-fq summary{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:16px 0;font-weight:600;font-size:18px}
.s3-fq summary svg{flex:none;transition:transform .4s var(--out)}
.s3-fq details[open] summary svg{transform:rotate(45deg);color:var(--acc)}
.s3-fq p{padding-bottom:18px;color:var(--mut);font-size:16px}

/* footer: a dark card with a tab on its top edge that holds the wordmark */
.s3-foot{padding:96px var(--gut) var(--gut)}
.s3-fcard{position:relative;max-width:var(--max);margin-inline:auto;background:var(--inv);color:var(--on-inv);border-radius:28px;padding:44px 24px 24px;--mut:color-mix(in srgb,var(--on-inv) 64%,transparent);--line:color-mix(in srgb,var(--on-inv) 12%,transparent);--line2:color-mix(in srgb,var(--on-inv) 20%,transparent)}
@media (min-width:900px){.s3-fcard{padding:56px 48px 28px}}
.s3-tab{position:absolute;bottom:100%;left:50%;translate:-50% 0;background:var(--inv);border-radius:24px 24px 0 0;padding:18px 34px 6px;display:flex;justify-content:center}
.s3-tab::before,.s3-tab::after{content:"";position:absolute;bottom:0;width:24px;height:24px;background:radial-gradient(circle at var(--cx) 0,transparent 23.5px,var(--inv) 24px)}
.s3-tab::before{right:100%;--cx:0}
.s3-tab::after{left:100%;--cx:24px}
.s3-tab svg{height:clamp(30px,5vw,46px);width:auto;color:var(--on-inv)}
.s3-tab i{position:absolute;top:10px;inset-inline-end:14px;width:7px;height:7px;background:var(--acc);transform:rotate(45deg);animation:s3pulse 2.6s ease-in-out infinite}
@keyframes s3pulse{50%{opacity:.25}}
.s3-fgrid{display:grid;gap:32px}
@media (min-width:900px){.s3-fgrid{grid-template-columns:1fr 2fr}}
.s3-fbrand{display:grid;gap:14px;align-content:start}
.s3-fbrand p{color:var(--mut);font-size:17px;max-width:34ch}
.s3-fbrand .btn{justify-self:start;background:var(--acc);color:#fff}
.s3 .fc{display:grid;gap:4px;justify-items:start;font-size:16px}
.s3 .fl{display:grid;grid-template-columns:repeat(2,1fr);gap:24px 16px}
@media (min-width:640px){.s3 .fl{grid-template-columns:repeat(3,1fr)}}
.s3 .fl-h{font-family:var(--f-head);font-size:18px;margin-bottom:10px}
.s3 .fl ul{display:grid;gap:8px;font-size:16px;color:var(--mut)}
.s3 .fl a:hover{color:var(--on-inv)}
.s3-fbase{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;border-top:1px solid var(--line);margin-top:36px;padding-top:18px;font-size:14px;color:var(--mut)}
.s3 .fs{display:flex;flex-wrap:wrap;gap:6px}
.s3 .fs a{display:inline-flex;height:32px;align-items:center;padding:0 12px;border-radius:10px;border:1px solid var(--line2)}

/* pricing */
.s3-pr{position:relative;isolation:isolate;overflow:hidden;margin-top:-72px;padding:132px 0 88px}
.s3-prword{position:absolute;inset-inline:0;top:96px;text-align:center;font-family:var(--f-head);font-weight:800;font-size:clamp(120px,24vw,320px);line-height:1;color:var(--ink);opacity:.06;z-index:0;pointer-events:none;white-space:nowrap}
.s3-pr .s3-hd{position:relative;z-index:1;text-align:center;justify-items:center;margin-inline:auto}
.s3-cards{position:relative;z-index:1;display:grid;gap:12px;max-width:1100px;margin-inline:auto}
@media (min-width:960px){.s3-cards{grid-template-columns:repeat(3,1fr)}}
.s3-card{border-radius:24px;border:1px solid var(--line2);background:var(--card);display:flex;flex-direction:column;overflow:hidden}
.s3-card .top{padding:22px 22px 20px;display:grid;gap:12px;background-image:radial-gradient(var(--dot) 1px,transparent 1.2px);background-size:16px 16px;border-bottom:1px solid var(--line2)}
.s3-card.pro{background:var(--inv);color:var(--on-inv);border-color:transparent;box-shadow:0 0 0 1px var(--acc),0 24px 60px -24px rgba(226,83,42,.55);--mut:color-mix(in srgb,var(--on-inv) 66%,transparent);--line2:color-mix(in srgb,var(--on-inv) 16%,transparent);--dot:color-mix(in srgb,var(--on-inv) 14%,transparent)}
.s3-card .nm{display:flex;justify-content:space-between;align-items:center;font-size:19px}
.s3-card .badge{font-size:13px;padding:2px 10px;border-radius:8px;background:var(--acc);color:#fff}
.s3-card .amt{display:flex;align-items:baseline;gap:6px;font-family:var(--f-head);font-size:52px;line-height:1}
.s3-card .amt small{font-family:var(--f-ui);font-size:18px;color:var(--mut)}
.s3-card .sub{color:var(--mut);font-size:16px}
.s3-card .body{padding:20px 22px 22px;display:flex;flex-direction:column;gap:16px;flex:1}
.s3-card ul{display:grid;gap:10px;font-size:16px;flex:1}
.s3-card li{display:grid;grid-template-columns:22px 1fr;gap:10px}
.s3-card li svg{width:20px;height:20px;margin-top:4px;padding:3px;border-radius:6px;background:var(--acc-soft);color:var(--acc-ink)}
.s3-card .btn{width:100%;background:var(--inv);color:var(--on-inv)}
.s3-card.pro .btn{background:var(--acc);color:#fff}
.s3-card .ft{font-size:14px;color:var(--mut);text-align:center}
`

function Faq({ list = FAQS }: { list?: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className="s3-fq">
      {list.map((f, i) => <details key={f.q} data-r style={{ ['--i' as string]: i % 2 }}><summary>{f.q}<Plus size={20} strokeWidth={1.6} /></summary><p>{f.a}</p></details>)}
    </div>
  )
}

function Footer() {
  return (
    <footer className="s3-foot">
      <div className="s3-fcard">
        <div className="s3-tab" aria-hidden><Mark /><i /></div>
        <div className="s3-fgrid">
          <div className="s3-fbrand">
            <p>{FOOTER.claim}</p>
            <a className="btn" href="/templates">ابدأ الإنشاء</a>
            <Contact />
          </div>
          <FooterLinks />
        </div>
        <div className="s3-fbase"><span>© {FOOTER.year} بينون. جميع الحقوق محفوظة.</span><Socials /></div>
      </div>
    </footer>
  )
}

function Backdrop() {
  return (<><div className="s3-dots" aria-hidden /><div className="s3-spot" aria-hidden /></>)
}

export function Home() {
  const [a, b, c] = REVIEWS
  const icons = { analytics: BarChart3, reviews: MessageSquareQuote, seo: Search, bookings: CalendarCheck } as const
  const small = DASH_FEATURES.filter((f) => f.id === 'analytics' || f.id === 'reviews' || f.id === 'seo')
  return (
    <Root id="s3" mode="light" css={CSS}>
      <Header />
      <section className="s3-hero" data-spot>
        <Backdrop />
        <div className="wrap s3-hero-g">
          <div className="s3-hero-t">
            <p className="s3-claim"><i aria-hidden />{HERO.claim}</p>
            <h1 className="head s3-h1">
              <span className="s3-roll" aria-hidden>{HERO.words.map((w, i) => <span key={w} style={{ ['--i' as string]: i }}>{w}</span>)}</span>
              <span className="sr">{HERO.words.join('، ')}</span>
              <span>موقعك.</span>
            </h1>
            <p className="lead">{HERO.sub}</p>
            <div className="s3-ctas">
              <a className="btn btn-ink" href={HERO.primary.href}>{HERO.primary.label}</a>
              <a className="btn btn-line" href={HERO.secondary.href}>{HERO.secondary.label}</a>
            </div>
          </div>
          <div className="s3-fan" aria-hidden>
            <img src={phoneShot('services')} alt="" />
            <img src={phoneShot('restaurant')} alt="" />
            <img src={phoneShot('wellness')} alt="" />
          </div>
        </div>
      </section>

      <section className="s3-sec">
        <div className="wrap">
          <div className="s3-hd" data-r><h2 className="head s3-title">ماذا يقول من جرّب بينون</h2></div>
          <div className="s3-rg">
            {[a, b, c].map((r, i) => (
              <figure key={i} className={'s3-cell' + (i === 0 ? ' big tint' : i === 2 ? ' dotted' : '')} data-r style={{ ['--i' as string]: i }}>
                <Stars n={r.rating} />
                <blockquote>«{r.body}»</blockquote>
                <figcaption><span>{r.name}</span><i>بانتظار موافقتك</i></figcaption>
              </figure>
            ))}
            <div className="s3-cell wide" data-r style={{ ['--i' as string]: 3 }}><p>{REVIEWS_NOTE}</p></div>
          </div>
        </div>
      </section>

      <section className="s3-sec">
        <div className="wrap">
          <div className="s3-hd" data-r>
            <h2 className="head s3-title">لوحة تحكم واحدة لكل شيء</h2>
            <p className="lead">الحجوزات، والزوار، والتقييمات، وظهورك في جوجل. كلها في مكان واحد.</p>
          </div>
          <div className="s3-dg">
            <div className="s3-cell c1" data-r>
              <div className="vid">
                <Vid v={DASH_D} kind="d" className="only-d" label="جولة في لوحة تحكم بينون" />
                <Vid v={DASH_M} kind="m" className="only-m" label="لوحة تحكم بينون على الهاتف" />
              </div>
              <div className="cap"><h3>{DASH_FEATURES[0].title}</h3><p>{DASH_FEATURES[0].body}</p></div>
            </div>
            <div className="s3-cell c2 ink" data-r style={{ ['--i' as string]: 1 }}>
              <div className="cap"><h3>الحجوزات من هاتفك</h3><p>{DASH_FEATURES[2].body}</p></div>
              <div className="vid"><Vid v={DASH_M} kind="m" seg={DASH_FEATURES[2].m} label="الحجوزات في لوحة التحكم على الهاتف" /></div>
            </div>
            {small.map((f, i) => {
              const Ic = icons[f.id as keyof typeof icons]
              return (
                <div key={f.id} className={'s3-cell' + (i === 0 ? ' tint' : i === 2 ? ' dotted' : '')} data-r style={{ ['--i' as string]: i + 2 }}>
                  <span className="ic"><Ic size={22} strokeWidth={1.6} /></span>
                  <h3>{f.title}</h3><p>{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="s3-sec">
        <div className="wrap">
          <div className="s3-hd" data-r>
            <h2 className="head s3-title">عدّل موقعك كما تكتب رسالة</h2>
            <p className="lead">اضغط على أي نص في موقعك واكتب. غيّر الألوان والخطوط، ثم انشر بضغطة.</p>
          </div>
          <div className="s3-eg" data-sync>
            <div className="s3-cell v" data-r>
              <div className="vid">
                <Vid v={EDIT_D} kind="d" className="only-d" label="تعديل موقع في محرر بينون" />
                <Vid v={EDIT_M} kind="m" className="only-m" label="تعديل موقع من الهاتف" />
              </div>
            </div>
            <div className="s3-cell ink steps" data-r style={{ ['--i' as string]: 1 }}>
              {EDIT_STEPS.map((s, i) => <div key={s.id} className="s3-es" data-step data-d={s.d} data-m={s.m}><b>{i + 1}</b><strong>{s.title}</strong><span>{s.body}</span></div>)}
              <div className="bar"><i /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="s3-sec">
        <div className="wrap">
          <div className="s3-hd" data-r>
            <h2 className="head s3-title">قالب لكل نشاط</h2>
            <p className="lead">ثمانية قوالب جاهزة. اختر قالب نشاطك، وبينون تكتب المحتوى وترتّب الأقسام.</p>
          </div>
          <div className="s3-tg">
            {TEMPLATES.map((t, i) => (
              <a key={t.id} href={t.href} data-r style={{ ['--i' as string]: i % 4 }}>
                <img src={wideShot(t.id)} alt={t.name} loading="lazy" />
                {'soon' in t && t.soon ? <em>قريبًا</em> : null}
                <p><strong>{t.name}</strong><span>{t.tag}</span></p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="s3-sec">
        <div className="wrap">
          <div className="s3-hd" data-r><h2 className="head s3-title">أسئلة شائعة</h2></div>
          <Faq />
          <p style={{ marginTop: 20 }}><a className="btn btn-line" href="/faq">كل الأسئلة <ArrowUpLeft size={18} /></a></p>
        </div>
      </section>
      <Footer />
    </Root>
  )
}

export function Pricing() {
  return (
    <Root id="s3" mode="light" css={CSS}>
      <Header />
      <section className="s3-pr" data-spot>
        <Backdrop />
        <div className="s3-prword" aria-hidden>الأسعار</div>
        <div className="wrap">
          <div className="s3-hd">
            <h1 className="head s3-title">{PRICING_HEAD.l1}<br />{PRICING_HEAD.l2}</h1>
            <p className="lead">{PRICING_HEAD.sub}</p>
          </div>
          <div className="s3-cards">
            {PLANS.map((p, i) => (
              <article key={p.id} className={'s3-card' + (p.id === 'pro' ? ' pro' : '')} data-r style={{ ['--i' as string]: i }}>
                <div className="top">
                  <p className="nm"><span>{p.name}</span>{'badge' in p && p.badge ? <span className="badge">{p.badge}</span> : null}</p>
                  <p className="amt"><span className="ltr">{p.amount}</span><small>{p.per}</small></p>
                  <p className="sub">{p.sub}</p>
                </div>
                <div className="body">
                  <ul>{p.features.map((f) => <li key={f}><Check strokeWidth={2.6} />{f}</li>)}</ul>
                  <a className="btn" href={p.href}>{p.cta}</a>
                  <p className="ft">{p.foot}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="s3-sec">
        <div className="wrap">
          <div className="s3-hd"><h2 className="head s3-title">أسئلة عن الأسعار</h2></div>
          <Faq list={PRICING_FAQS} />
        </div>
      </section>
      <Footer />
    </Root>
  )
}
