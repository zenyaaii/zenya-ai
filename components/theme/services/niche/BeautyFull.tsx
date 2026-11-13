'use client'

/**
 * Beauty & spa «جلسات», the full theme. Anas approved it on 2026-11-13, with
 * the centre's own photo colours as the default look (lib/niche-photo-looks).
 *
 * Five pages: home, sessions, packages, the centre, book.
 * Made for a women's centre: privacy is said first and plainly, sessions
 * sit under one tab per kind with a pill that glides between them, packages
 * are cards you swipe with what each holds and how long it takes, and the
 * notes before a session (hospitality, health, lateness) open on tap.
 *
 * Calm and soft: sage, arches, slow motion. Every list can hold 0, 1 or many;
 * a page with nothing to show is dropped with its link.
 */

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, Clock, Lock, Sparkles } from 'lucide-react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Hours, ar, extraOf, useNiche, vars, type Colors, type N, type NicheExtra } from './kit'
import { BLOCKS_CSS, CountUp, Faq, Head, Icon, Lightbox, MapCard, Reviews } from './blocks'
import { Brand, GoLink, Shell, todayLine, useGo, type SPage } from './shell'

/** Default look «مريمية ورمل»: sage with a sand second colour. */
const LOOK = { background: '#f2f1ec', surface: '#e7e5dc', text: '#1b231f', muted: '#5f6a63', accent: '#3d6652', border: '#d9d6cb' }
const LOOK2 = '#b48a5e'

type Pack = { name: string; includes: string[]; duration?: string; price?: string }

/* ---------- sections ---------- */

function Hero({ n, content, x }: { n: N; content: ServiceContent; x: NicheExtra }) {
  const go = useGo()
  const who = x.privacy || n.b.audience
  const second = n.rest[0]
  return (
    <section className="y-hero" data-section="hero">
      <div className="n-w y-hero-in">
        <div className="y-hero-txt">
          {who ? <span className="y-priv"><Lock size={14} /> {who}</span> : null}
          <h1>{n.b.name}</h1>
          {content.hero.subheadline || n.b.tagline ? <p>{content.hero.subheadline || n.b.tagline}</p> : null}
          <div className="n-row">
            <button type="button" className="n-btn y-big" onClick={() => go('book')}>احجزي جلستك<ArrowLeft size={18} /></button>
            {n.services.length ? <button type="button" className="n-btn ghost y-big" onClick={() => go('sessions')}>الجلسات والأسعار</button> : null}
          </div>
          <div className="y-facts">
            {n.rating ? <span><b><CountUp to={n.rating} dec={1} /></b><small>{n.count ? `من ${ar(n.count)} تقييم` : 'على Google'}</small></span> : null}
            {n.st ? <span><b className={n.st.open ? 'on' : 'off'}>{n.st.open ? 'مفتوح الآن' : 'مغلق الآن'}</b><small>{n.st.text}</small></span> : null}
            {n.where ? <span><b>{n.b.area || n.b.city}</b><small>{n.b.area ? n.b.city : ''}</small></span> : null}
          </div>
        </div>
        {n.hero ? (
          <div className="y-hero-art">
            <div className="y-arch"><img src={n.hero} alt={`داخل ${n.b.name}`} /></div>
            {second ? <div className="y-arch sm"><img src={second} alt="" loading="lazy" /></div> : null}
            <span className="y-ring" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Privacy and comfort, said plainly in one band. */
function Calm({ x }: { x: NicheExtra }) {
  const fac = x.facilities || []
  if (!x.privacy && fac.length < 2) return null
  return (
    <section className="y-calm" data-section="about">
      <div className="n-w y-calm-in">
        {x.privacy ? <p data-r><Lock size={22} /> {x.privacy}</p> : null}
        {fac.length ? <ul>{fac.map((f, i) => <li key={f} data-r style={{ ['--d' as string]: i } as CSSProperties}><Icon of={f} size={17} />{f}</li>)}</ul> : null}
      </div>
    </section>
  )
}

/** One tab per kind of session; a pill glides between tabs; cards rise in. */
function Sessions({ n, x, limit }: { n: N; x: NicheExtra; limit?: number }) {
  const go = useGo()
  const groups = useMemo(() => {
    const m = new Map<string, N['services']>()
    for (const s of n.services) { const g = s.group?.trim() || x.groups?.[s.name] || 'الجلسات'; m.set(g, [...(m.get(g) || []), s]) }
    return Array.from(m.entries())
  }, [n.services, x.groups])
  const [tab, setTab] = useState(0)
  const bar = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ l: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const el = bar.current?.querySelectorAll<HTMLButtonElement>('button')[tab]
    if (el) { setPill({ l: el.offsetLeft, w: el.offsetWidth }); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
  }, [tab, groups.length])
  if (!n.services.length) return null
  const active = groups[Math.min(tab, groups.length - 1)]
  const list = limit ? active[1].slice(0, limit) : active[1]
  return (
    <div className="y-ses">
      {groups.length > 1 ? (
        <div className="y-tabs" ref={bar} role="tablist" aria-label="أنواع الجلسات" data-r>
          {pill ? <i style={{ transform: `translateX(${pill.l}px)`, width: pill.w }} aria-hidden="true" /> : null}
          {groups.map(([g, l], i) => <button key={g} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}><Icon of={g} size={16} />{g}<small>{ar(l.length)}</small></button>)}
        </div>
      ) : null}
      <div className="y-cards" key={tab}>
        {list.map((s, i) => (
          <article key={s.name} style={{ ['--i' as string]: i } as CSSProperties}>
            <span className="y-ic"><Icon of={s.name + ' ' + active[0]} size={20} /></span>
            <h3>{s.name}</h3>
            {s.description ? <p>{s.description}</p> : null}
            <footer>
              {s.duration ? <span><Clock size={14} />{s.duration}</span> : <span />}
              {s.price_from ? <b>{s.price_from}</b> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${s.name}؟`)!} target="_blank" rel="noopener noreferrer">اسألي عن السعر</a> : null}
            </footer>
            <button type="button" className="y-go" onClick={() => go('book')} aria-label={`احجزي ${s.name}`}><ArrowLeft size={17} /></button>
          </article>
        ))}
      </div>
    </div>
  )
}

/** Packages to swipe; the first is the house's leading one. */
function Packs({ n, packs }: { n: N; packs: Pack[] }) {
  const go = useGo()
  if (!packs.length) return null
  return (
    <div className={`y-packs c${Math.min(packs.length, 3)}`}>
      {packs.map((p, i) => (
        <article key={p.name} className={i === 0 ? 'lead' : ''} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          {i === 0 && packs.length > 1 ? <span className="y-badge"><Sparkles size={13} /> الأكثر طلبًا</span> : null}
          <h3>{p.name}</h3>
          {p.duration ? <small><Clock size={14} /> {p.duration}</small> : null}
          {p.includes?.length ? <ul>{p.includes.filter(Boolean).map((t) => <li key={t}>{t}</li>)}</ul> : null}
          <footer>
            {p.price ? <b>{p.price}</b> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${p.name}؟`)!} target="_blank" rel="noopener noreferrer">اسألي عن السعر</a> : <span />}
            <button type="button" className="n-btn" onClick={() => go('book')}>احجزي</button>
          </footer>
        </article>
      ))}
    </div>
  )
}

/** What sets the place apart, as large calm lines. */
function Features({ list }: { list: string[] }) {
  if (list.length < 2) return null
  return (
    <ol className="y-feat">
      {list.map((f, i) => <li key={f} data-r style={{ ['--d' as string]: i } as CSSProperties}><span>{ar(i + 1)}</span><p>{f}</p></li>)}
    </ol>
  )
}

function Specialists({ n }: { n: N }) {
  if (!n.members.length) return null
  return (
    <div className={`y-team c${Math.min(n.members.length, 3)}${n.members.some((m) => m.photo) ? '' : ' nopic'}`}>
      {n.members.map((m, i) => (
        <article key={m.name} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          <div className="y-team-pic">{m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span aria-hidden="true">{m.name.slice(0, 1)}</span>}</div>
          <h3>{m.name}</h3>
          {m.role ? <small>{m.role}</small> : null}
          {m.tags?.length ? <ul>{m.tags.map((t) => <li key={t}>{t}</li>)}</ul> : null}
          {m.quote ? <blockquote>«{m.quote}»{m.quote_by ? <cite>{m.quote_by}، على Google</cite> : null}</blockquote> : null}
        </article>
      ))}
    </div>
  )
}

function Arches({ n, urls }: { n: N; urls: string[] }) {
  const [at, setAt] = useState<number | null>(null)
  if (urls.length < 2) return null
  return (
    <>
      <div className={`y-arches c${Math.min(urls.length, 4)}`}>
        {urls.slice(0, 4).map((u, i) => <button key={u} type="button" onClick={() => setAt(i)} data-r style={{ ['--d' as string]: i } as CSSProperties} aria-label={`افتحي الصورة ${i + 1}`}><img src={u} alt={`${n.short} ${i + 1}`} loading="lazy" /></button>)}
      </div>
      <Lightbox urls={urls.slice(0, 4)} at={at} onClose={() => setAt(null)} alt={n.short} />
    </>
  )
}

/* ---------- the theme ---------- */

export default function BeautyFull({ content, x: given, colors, initial, view, onViewChange, logo }: { content: ServiceContent; x?: NicheExtra; colors?: Colors; initial?: string; view?: string; onViewChange?: (id: string) => void; logo?: string }) {
  const n = useNiche(content)
  const x = extraOf(content, given)
  const packs: Pack[] = (x.packages || []).filter((p) => p && p.name?.trim())
  const notes = (x.blocks || []).filter((b) => b && b.title?.trim() && b.text?.trim()).map((b) => ({ q: b.title, a: b.text }))
  const features = (x.features || []).filter((f) => f && f.trim())
  const pics = n.photos

  const home = (
    <>
      <Hero n={n} content={content} x={x} />
      <Calm x={x} />
      {n.services.length ? <section className="y-sec" data-section="services"><div className="n-w"><Head title="الجلسات" sub={n.priced ? 'المدة المكتوبة هي مدة الجلسة كاملة.' : undefined} more={n.services.length > 6 ? <GoLink to="sessions">كل الجلسات<ArrowLeft size={16} /></GoLink> : null} /><Sessions n={n} x={x} limit={6} /></div></section> : null}
      {packs.length ? <section className="y-sec y-acc" data-section="about"><div className="n-w"><Head title="الباقات" sub="جلسات مجتمعة في زيارة واحدة." more={<GoLink to="packages" className="n-btn ghost y-on">كل الباقات<ArrowLeft size={16} /></GoLink>} /><Packs n={n} packs={packs} /></div></section> : null}
      {features.length >= 2 ? <section className="y-sec" data-section="about"><div className="n-w"><Head title="لماذا نحن" /><Features list={features} /></div></section> : null}
      {n.members.length ? <section className="y-sec y-alt" data-section="team"><div className="n-w"><Head title="الأخصائيات" sub="اطلبي أخصائيتك بالاسم عند الحجز." /><Specialists n={n} /></div></section> : null}
      {n.reviews.length ? <section className="y-sec" data-section="reviews"><div className="n-w"><Head title="ماذا قالت زبوناتنا" /><Reviews n={n} max={5} /></div></section> : null}
      {pics.length >= 3 ? <section className="y-sec y-alt" data-section="gallery"><div className="n-w"><Head title="من داخل المركز" more={<GoLink to="center">جولة في المركز<ArrowLeft size={16} /></GoLink>} /><Arches n={n} urls={pics} /></div></section> : null}
      {n.faq.length || notes.length ? <section className="y-sec" data-section="faq"><div className="n-w y-faqw"><Head title="قبل جلستك" /><Faq items={[...notes, ...n.faq].slice(0, 5)} /></div></section> : null}
    </>
  )

  const pages: SPage[] = [
    { id: 'home', label: 'الرئيسية', body: home },
    {
      id: 'sessions', label: 'الجلسات', title: 'الجلسات والأسعار', lead: 'كل جلسة بمدتها وسعرها. اختاري النوع من الأعلى.',
      body: n.services.length ? (
        <>
          <section className="y-sec y-tight" data-section="services"><div className="n-w"><Sessions n={n} x={x} /></div></section>
          {features.length >= 2 ? <section className="y-sec y-alt" data-section="about"><div className="n-w"><Head title="وعدنا لك" /><Features list={features} /></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'packages', label: 'الباقات', title: 'الباقات', lead: 'زيارة واحدة، وجلسات مختارة معًا.',
      body: packs.length ? <section className="y-sec y-tight" data-section="about"><div className="n-w"><Packs n={n} packs={packs} /></div></section> : null,
    },
    {
      id: 'center', label: 'المركز', title: `جولة في ${n.short}`, lead: x.privacy ? `${x.privacy}.` : undefined, image: pics[1] || n.hero || undefined,
      body: pics.length >= 2 || (x.facilities || []).length || n.members.length ? (
        <>
          <Calm x={x} />
          {pics.length >= 2 ? <section className="y-sec" data-section="gallery"><div className="n-w"><Head title="الصور" /><Arches n={n} urls={pics} /></div></section> : null}
          {n.members.length ? <section className="y-sec y-alt" data-section="team"><div className="n-w"><Head title="الأخصائيات" /><Specialists n={n} /></div></section> : null}
          {notes.length ? <section className="y-sec" data-section="about"><div className="n-w y-faqw"><Head title="قبل جلستك" /><Faq items={notes} /></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'book', label: 'احجزي', title: 'احجزي جلستك', lead: 'اختاري الجلسة والوقت، ونؤكّد لك على واتساب.',
      body: (
        <>
          <section className="y-sec y-tight" data-section="booking"><div className="n-w y-bookw">
            <div className="y-card" data-r><Book n={n} options={[...packs.map((p) => p.name), ...n.services.map((s) => s.name)]} place="المركز" label="أرسلي الطلب" /></div>
            <aside className="y-side" data-r>
              {x.privacy ? <p className="y-note"><Lock size={16} /> {x.privacy}</p> : null}
              <MapCard n={n} address={content.footer.address} />
              {n.st ? <p className="y-today"><Clock size={16} /> {todayLine(n)}</p> : null}
              {n.hours.length ? <Hours n={n} /> : null}
            </aside>
          </div></section>
          {n.faq.length ? <section className="y-sec y-alt" data-section="faq"><div className="n-w y-faqw"><Head title="أسئلة" /><Faq items={n.faq} /></div></section> : null}
        </>
      ),
    },
  ]

  return (
    <Shell
      n={n} content={content} root="yf" pages={pages} initial={initial} view={view} onViewChange={onViewChange} logo={logo}
      style={{ ...vars(colors?.background && colors.accent ? colors : { ...LOOK, accent2: LOOK2 }, LOOK), ['--n-disp' as string]: '"Alexandria", sans-serif', ['--n-body' as string]: '"Readex Pro", sans-serif' } as CSSProperties}
      fonts="family=Alexandria:wght@300;400;600;700&family=Readex+Pro:wght@300;400;500;600"
      css={KIT_CSS + BLOCKS_CSS + CSS}
      cta={{ label: 'احجزي جلستك', page: 'book' }}
      close={{ title: 'خذي وقتك، والباقي علينا', text: x.privacy ? `${x.privacy}.` : undefined, image: pics[pics.length - 1] || n.hero || undefined }}
      strip={x.privacy ? [x.privacy] : undefined}
    />
  )
}

const CSS = `
.yf{--n-r-btn:999px;--n-r-in:14px;--n-r-card:22px;--y-night:color-mix(in srgb,var(--n-acc) 16%,#0f0d0c);--y-pearl:#f3eee8;--s-strip-bg:var(--n-acc);--s-strip-ink:var(--n-on);--s-foot-bg:var(--y-night);--s-foot-ink:var(--y-pearl);--s-menu-bg:var(--y-night);--s-menu-ink:var(--y-pearl);--s-foot-acc:color-mix(in srgb,var(--n-acc2) 55%,#fff)}
.yf .s-head{background:color-mix(in srgb,var(--n-bg) 86%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.yf .s-logo b{font-weight:600}
.yf .s-ph h1,.yf .b-head h2,.yf .s-close h2,.yf .s-next b{font-weight:600;letter-spacing:-.02em}
.yf .s-ph:not(.img){background:var(--n-bg2)}
.yf .s-menu-list button{font-weight:400}
.yf .s-menu .n-btn{background:var(--y-pearl);color:var(--y-night)}
.yf .s-close .n-btn:not(.ghost){background:var(--y-pearl);color:var(--y-night)}
.yf .b-rv-big blockquote{font-weight:400}
.yf .y-big{min-height:56px;padding:0 28px;font-size:16px}
.y-sec{padding:112px 0}.y-tight{padding-top:56px}
.y-alt{background:var(--n-bg2)}
.y-acc{background:var(--n-acc);color:var(--n-on)}
.y-acc .b-head p{color:color-mix(in srgb,var(--n-on) 75%,transparent)}
.yf .y-on{color:var(--n-on);border-color:color-mix(in srgb,var(--n-on) 35%,transparent)}
.yf .y-on:hover{background:color-mix(in srgb,var(--n-on) 12%,transparent)}
.y-faqw{max-width:900px}
@media (max-width:760px){.y-sec{padding:72px 0}.y-tight{padding-top:36px}}

/* hero */
.y-hero{padding:48px 0 72px;overflow:hidden}
.y-hero-in{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;min-height:calc(100svh - var(--s-strip) - var(--s-head) - 120px)}
.y-hero-txt{display:grid;gap:22px;justify-items:start}
.y-priv{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:var(--n-acc-soft);color:var(--n-acc);font-weight:600;font-size:14px;animation:y-in .8s .2s both}
.y-hero h1{font-size:clamp(54px,7.4vw,112px);font-weight:600;line-height:1.02;letter-spacing:-.03em;animation:y-rise 1.1s cubic-bezier(.2,.8,.2,1) .3s both}
@keyframes y-rise{from{opacity:0;transform:translateY(40px);filter:blur(8px)}}
@keyframes y-in{from{opacity:0;transform:translateY(14px)}}
.y-hero-txt>p{font-size:clamp(17px,1.5vw,19px);color:var(--n-ink2);max-width:42ch;animation:y-in .9s .5s both}
.y-hero-txt .n-row{animation:y-in .9s .65s both}
.y-facts{display:flex;gap:14px 40px;flex-wrap:wrap;padding-top:20px;border-top:1px solid var(--n-line);width:100%;animation:y-in .9s .8s both}
.y-facts span{display:grid;line-height:1.25}
.y-facts b{font:600 24px var(--n-disp)}.y-facts b.on{color:#2f8a5b}.y-facts b.off{color:#b4533e}
.y-facts small{font-size:13px;color:var(--n-mute)}
.y-hero-art{position:relative;height:min(78svh,700px)}
.y-arch{position:absolute;inset:0 0 0 18%;border-radius:999px 999px 24px 24px;overflow:hidden;animation:y-arch 1.4s cubic-bezier(.7,0,.2,1) .1s both}
@keyframes y-arch{from{clip-path:inset(100% 0 0 0 round 999px 999px 24px 24px)}to{clip-path:inset(0 0 0 0 round 999px 999px 24px 24px)}}
.y-arch img{width:100%;height:100%;object-fit:cover;animation:y-kb 20s ease-out both}
@keyframes y-kb{from{transform:scale(1.15)}}
.y-arch.sm{inset:auto auto 6% 0;width:36%;height:42%;border:8px solid var(--n-bg);animation-delay:.6s;box-shadow:0 30px 60px -30px rgba(0,0,0,.35)}
.y-ring{position:absolute;top:8%;left:6%;width:120px;height:120px;border-radius:50%;border:1px solid var(--n-acc2);opacity:.6;animation:y-in 1.2s 1s both}
.y-ring::after{content:"";position:absolute;top:-5px;left:50%;width:10px;height:10px;border-radius:50%;background:var(--n-acc2)}
@media (max-width:900px){.y-hero{padding:28px 0 56px}.y-hero-in{grid-template-columns:1fr;gap:32px;min-height:0}.y-hero-art{height:440px;order:-1}.y-arch{inset:0 0 0 12%}.y-arch.sm{width:42%;height:46%}.y-hero-txt .n-row{width:100%}.y-hero-txt .n-btn{flex:1}.y-ring{width:80px;height:80px}}

/* calm band */
.y-calm{background:var(--y-night);color:var(--y-pearl);padding:38px 0}
.y-calm-in{display:flex;justify-content:space-between;align-items:center;gap:20px 40px;flex-wrap:wrap}
.y-calm p{display:flex;align-items:center;gap:12px;font:600 clamp(20px,2.2vw,28px) var(--n-disp)}
.y-calm p svg,.y-calm li svg{color:color-mix(in srgb,var(--n-acc2) 70%,#fff)}
.y-calm ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.y-calm li{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;border:1px solid color-mix(in srgb,var(--y-pearl) 22%,transparent);font-size:14px}

/* sessions */
.y-tabs{position:relative;display:flex;gap:4px;padding:6px;border-radius:999px;background:var(--n-bg2);width:max-content;max-width:100%;overflow-x:auto;scrollbar-width:none;margin-bottom:28px}
.y-alt .y-tabs{background:var(--n-bg)}
.y-tabs::-webkit-scrollbar{display:none}
.y-tabs i{position:absolute;top:6px;bottom:6px;left:0;border-radius:999px;background:var(--n-acc);transition:transform .55s cubic-bezier(.3,1.3,.5,1),width .55s cubic-bezier(.3,1.3,.5,1)}
.y-tabs button{all:unset;cursor:pointer;position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:999px;font-weight:500;white-space:nowrap;transition:color .35s}
.y-tabs button small{font-size:11px;padding:1px 7px;border-radius:999px;background:color-mix(in srgb,currentColor 12%,transparent)}
.y-tabs button.on{color:var(--n-on)}
.y-tabs button:focus-visible{outline:2px solid var(--n-acc);outline-offset:2px}
.y-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.y-cards article{position:relative;display:flex;flex-direction:column;gap:10px;padding:26px;border-radius:var(--n-r-card);background:var(--n-bg2);border:1px solid var(--n-line);animation:y-card .6s cubic-bezier(.3,1.3,.5,1) both;animation-delay:calc(var(--i)*55ms);transition:transform .45s cubic-bezier(.3,1.4,.5,1),box-shadow .4s}
.y-alt .y-cards article{background:var(--n-bg)}
@keyframes y-card{from{opacity:0;transform:translateY(22px) scale(.97)}}
.y-cards article:hover{transform:translateY(-6px);box-shadow:0 24px 40px -28px rgba(20,40,30,.45)}
.y-ic{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--n-acc-soft);color:var(--n-acc)}
.y-cards h3{font:600 22px var(--n-disp)}
.y-cards p{font-size:14px;color:var(--n-ink2)}
.y-cards footer{margin-top:auto;padding-top:14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--n-line)}
.y-cards footer span{display:inline-flex;gap:6px;align-items:center;font-size:14px;color:var(--n-mute)}
.y-cards footer b{font:600 20px var(--n-disp)}
.y-cards footer a{font-weight:600;color:var(--n-acc);border-bottom:1px solid currentColor}
.y-go{all:unset;cursor:pointer;position:absolute;top:22px;left:22px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--n-acc);color:var(--n-on);opacity:0;transform:scale(.6) rotate(-45deg);transition:opacity .3s,transform .45s cubic-bezier(.3,1.5,.5,1)}
.y-cards article:hover .y-go,.y-go:focus-visible{opacity:1;transform:none}
@media (max-width:900px){.y-cards{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.y-cards{grid-template-columns:1fr;gap:10px}.y-cards article{padding:20px}.y-go{opacity:1;transform:none;width:36px;height:36px;top:18px;left:18px}.y-tabs{width:auto;margin-inline:-16px;border-radius:0;padding-inline:16px}}

/* packages */
.y-packs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:stretch}
.y-packs.c1{grid-template-columns:minmax(0,560px)}.y-packs.c2{grid-template-columns:1fr 1fr}
.y-packs article{position:relative;display:flex;flex-direction:column;gap:14px;padding:32px 28px;border-radius:var(--n-r-card);background:var(--n-bg);color:var(--n-ink)}
.y-packs article.lead{background:color-mix(in srgb,var(--n-bg) 92%,var(--n-acc))}
.y-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:var(--n-acc2);color:var(--n-on2);font-size:12px;font-weight:600}
.y-packs h3{font:600 clamp(26px,2.6vw,34px)/1.1 var(--n-disp)}
.y-packs small{display:inline-flex;align-items:center;gap:6px;color:var(--n-mute);font-size:14px}
.y-packs ul{list-style:none;margin:0;padding:16px 0 0;display:grid;gap:10px;border-top:1px dashed var(--n-line)}
.y-packs li{display:flex;gap:10px;align-items:baseline;font-size:15px}
.y-packs li::before{content:"";flex:none;width:7px;height:7px;border-radius:50%;background:var(--n-acc2);translate:0 -2px}
.y-packs footer{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:14px;padding-top:18px}
.y-packs footer b{font:700 30px var(--n-disp)}
.y-packs footer a{font-weight:600;color:var(--n-acc);border-bottom:1px solid currentColor}
.y-tight .y-packs article,.y-sec:not(.y-acc) .y-packs article{border:1px solid var(--n-line)}
@media (max-width:900px){.y-packs,.y-packs.c2{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:84%;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin-inline:-16px;padding-inline:16px;scroll-padding-inline:16px}.y-packs::-webkit-scrollbar{display:none}.y-packs article{scroll-snap-align:start;padding:26px 22px}}

/* features */
.y-feat{list-style:none;margin:0;padding:0;display:grid}
.y-feat li{display:grid;grid-template-columns:80px 1fr;gap:20px;align-items:baseline;padding:30px 0;border-top:1px solid var(--n-line)}
.y-feat li:last-child{border-bottom:1px solid var(--n-line)}
.y-feat span{font:300 54px/1 var(--n-disp);color:var(--n-acc2)}
.y-feat p{font:400 clamp(22px,2.8vw,38px)/1.35 var(--n-disp);max-width:30ch}
@media (max-width:560px){.y-feat li{grid-template-columns:48px 1fr;gap:12px;padding:22px 0}.y-feat span{font-size:36px}}

/* team */
.y-team{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.y-team.c1{grid-template-columns:minmax(0,360px)}.y-team.c2{grid-template-columns:repeat(2,minmax(0,360px))}
.y-team article{display:grid;gap:8px;justify-items:center;text-align:center}
.y-team-pic{width:100%;aspect-ratio:4/5;border-radius:999px 999px 22px 22px;overflow:hidden;background:linear-gradient(160deg,var(--n-acc-soft),color-mix(in srgb,var(--n-acc) 30%,var(--n-bg)));display:grid;place-items:center;margin-bottom:8px}
.y-team-pic img{width:100%;height:100%;object-fit:cover}
.y-team-pic span{font:300 clamp(110px,12vw,170px)/1 var(--n-disp);color:var(--n-acc);transition:transform .8s cubic-bezier(.3,1.3,.5,1)}
.y-team article:hover .y-team-pic span{transform:translateY(-10px) scale(1.06)}
.y-team h3{font:600 28px var(--n-disp)}
.y-team small{color:var(--n-mute)}
.y-team ul{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.y-team li{padding:5px 12px;border-radius:999px;background:var(--n-bg);font-size:13px}
.y-team blockquote{margin:8px 0 0;font-size:15px;color:var(--n-ink2);display:grid;gap:4px;max-width:32ch}
.y-team cite{font-style:normal;font-size:12px;color:var(--n-mute)}
.y-team.nopic{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.y-team.nopic article{padding:30px 22px 26px;border-radius:var(--n-r-card);background:var(--n-bg);border:1px solid var(--n-line)}
.y-team.nopic .y-team-pic{width:96px;aspect-ratio:1;border-radius:50%;margin-bottom:6px;background:var(--n-acc-soft)}
.y-team.nopic .y-team-pic span{font:400 46px/1 var(--n-disp)}
.y-team.nopic article:hover .y-team-pic span{transform:none}
@media (max-width:860px){.y-team,.y-team.c2{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:72%;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin-inline:-16px;padding-inline:16px}.y-team article{scroll-snap-align:start}.y-team-pic{aspect-ratio:1}}

/* arches */
.y-arches{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:end}
.y-arches.c2{grid-template-columns:1fr 1fr}.y-arches.c3{grid-template-columns:repeat(3,1fr)}
.y-arches button{all:unset;cursor:zoom-in;aspect-ratio:3/4.4;border-radius:999px 999px 18px 18px;overflow:hidden}
.y-arches button:nth-child(even){aspect-ratio:3/3.8}
.y-arches img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
.y-arches button:hover img{transform:scale(1.07)}
.y-arches button:focus-visible{outline:2px solid var(--n-acc);outline-offset:3px}
@media (max-width:760px){.y-arches,.y-arches.c3{grid-template-columns:1fr 1fr;gap:10px}}

/* booking */
.y-bookw{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:start}
.y-card{padding:34px;border-radius:var(--n-r-card);background:var(--n-bg2);border:1px solid var(--n-line)}
.y-card .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.y-side{display:grid;gap:14px;position:sticky;top:calc(var(--s-head) + 20px)}
.y-note{display:flex;gap:10px;align-items:center;padding:16px 18px;border-radius:16px;background:var(--n-acc-soft);color:var(--n-acc);font-weight:600}
.y-today{display:flex;gap:8px;align-items:center;color:var(--n-ink2)}
@media (max-width:860px){.y-bookw{grid-template-columns:1fr}.y-card{padding:20px}.y-side{position:static}}
`
