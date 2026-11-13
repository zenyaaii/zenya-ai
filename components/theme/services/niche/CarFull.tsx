'use client'

/**
 * Car services «لوحة الورشة», the full theme. SAMPLE (2026-11-13), built on option A.
 *
 * Five pages: home, services, our promise, the workshop, book.
 * Made for a garage or a wash: the owner's promises are stamped like a work
 * order, every service is a ticket with its time and price, a wash shows its
 * price per car size behind one switch, and the steps from "you arrive" to
 * "you drive off" are drawn as a line that fills as you read.
 *
 * Every list can hold 0, 1 or many. A page with nothing to show is dropped
 * with its link; a section with nothing to show is not drawn.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, BadgeCheck, Car, Clock, FileCheck, Wrench } from 'lucide-react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Hours, ar, useNiche, vars, type Colors, type N, type NicheExtra } from './kit'
import { BLOCKS_CSS, CountUp, Faq, Head, Icon, Lightbox, MapCard, Reviews, ScrollWords } from './blocks'
import { Brand, GoLink, Shell, todayLine, useGo, type SPage } from './shell'

const LOOK = { background: '#0f1113', surface: '#171a1d', text: '#eef0f2', muted: '#8d949a', accent: '#f5b700', border: '#272b2f' }

type Block = { id: string; title: string; text: string }

/* ---------- sections ---------- */

function Hero({ n, content, promises }: { n: N; content: ServiceContent; promises: Block[] }) {
  const go = useGo()
  return (
    <section className="c-hero">
      {n.hero ? <img className="c-hero-img" src={n.hero} alt={`داخل ${n.b.name}`} /> : null}
      <div className="n-w c-hero-in">
        <div className="c-hero-main">
          {n.where ? <span className="c-tag"><Wrench size={15} /> {n.where}</span> : null}
          <h1><span>{n.b.name}</span></h1>
          {content.hero.subheadline || n.b.tagline ? <p>{content.hero.subheadline || n.b.tagline}</p> : null}
          <div className="n-row">
            <button type="button" className="n-btn c-big" onClick={() => go('book')}>احجز موعدًا<ArrowLeft size={18} /></button>
            {n.wa ? <a className="n-btn ghost c-big" href={n.waLink('مرحبًا، عندي سؤال عن سيارتي')!} target="_blank" rel="noopener noreferrer">{Brand.wa()} اسأل عن سيارتك</a> : null}
          </div>
        </div>
        {promises.length ? (
          <ul className="c-stamps">
            {promises.slice(0, 3).map((b, i) => (
              <li key={b.id} style={{ ['--i' as string]: i } as CSSProperties}>
                <span className="c-no">#{String(i + 1).padStart(2, '0')}</span>
                <b>{b.title}</b>
                <p>{b.text}</p>
                <i className="c-ok" aria-hidden="true"><BadgeCheck size={20} /></i>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="c-gauge n-w">
        {n.rating ? <span><b><CountUp to={n.rating} dec={1} /></b><small>{n.count ? `من ${ar(n.count)} تقييم على Google` : 'على Google'}</small></span> : null}
        {n.st ? <span><b className={n.st.open ? 'ok' : 'no'}>{n.st.open ? 'مفتوح' : 'مغلق'}</b><small>{n.st.text}</small></span> : null}
        {n.services.length ? <span><b><CountUp to={n.services.length} /></b><small>خدمة لسيارتك</small></span> : null}
      </div>
    </section>
  )
}

/** The makes the workshop knows. One marquee for the page. */
function Makes({ brands }: { brands: string[] }) {
  if (brands.length < 3) return null
  const row = [...brands, ...brands, ...brands]
  return (
    <div className="c-makes" aria-label="نعمل على">
      <span className="c-makes-l">نعمل على</span>
      <div className="c-makes-v"><div className="c-makes-t">{row.map((b, i) => <span key={i} aria-hidden={i >= brands.length}>{b}</span>)}</div></div>
    </div>
  )
}

/** Each service as a work ticket: number, icon, time, price (or a WhatsApp question). */
function Tickets({ n, list, start = 0 }: { n: N; list: N['services']; start?: number }) {
  const go = useGo()
  return (
    <div className="c-tix">
      {list.map((s, i) => (
        <article key={s.name} data-r style={{ ['--d' as string]: i % 6 } as CSSProperties}>
          <header><span>#{String(start + i + 1).padStart(2, '0')}</span><Icon of={s.name} size={22} /></header>
          <h3>{s.name}</h3>
          {s.description ? <p>{s.description}</p> : null}
          <footer>
            {s.duration ? <span><Clock size={14} /> {s.duration}</span> : <span />}
            {s.price_from ? <b>من {s.price_from}</b> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${s.name}؟`)!} target="_blank" rel="noopener noreferrer">اسأل عن السعر</a> : <b className="ask">السعر حسب السيارة</b>}
          </footer>
          <button type="button" className="c-tix-go" onClick={() => go('book')} aria-label={`احجز ${s.name}`}><ArrowLeft size={18} /></button>
        </article>
      ))}
    </div>
  )
}

/** Wash prices by car size, behind one switch. The pill slides; the numbers roll. */
function Sizes({ x }: { x: NicheExtra }) {
  const names = x.sizeNames || []
  const rows = (x.sizes || []).filter((r) => r.prices.some(Boolean))
  const [k, setK] = useState(0)
  const bar = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ l: number; w: number } | null>(null)
  useEffect(() => {
    const b = bar.current?.querySelectorAll<HTMLButtonElement>('button')[k]
    if (b) setPill({ l: b.offsetLeft, w: b.offsetWidth })
  }, [k, names.length])
  if (names.length < 2 || !rows.length) return null
  return (
    <div className="c-size" data-r>
      <div className="c-size-top">
        <div><Car size={22} /><b>السعر حسب حجم السيارة</b></div>
        <div className="c-seg" ref={bar} role="tablist" aria-label="حجم السيارة">
          {pill ? <i style={{ transform: `translateX(${pill.l}px)`, width: pill.w }} aria-hidden="true" /> : null}
          {names.map((nm, i) => <button key={nm} type="button" role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} onClick={() => setK(i)}>{nm}</button>)}
        </div>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.name}><span><Icon of={r.name} size={18} />{r.name}</span><b key={k} className="c-roll">{r.prices[k] || 'اسأل'}</b></li>
        ))}
      </ul>
    </div>
  )
}

/** From arrival to driving off: a line that fills as the steps scroll past. */
function Route({ steps }: { steps: { title: string; text: string }[] }) {
  const ref = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el?.style.setProperty('--p', '1'); return }
    let raf = 0
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = el.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height)); el.style.setProperty('--p', p.toFixed(3)) }) }
    on(); addEventListener('scroll', on, { passive: true })
    return () => { removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [])
  if (steps.length < 2) return null
  return (
    <ol className="c-route" ref={ref}>
      {steps.map((s, i) => (
        <li key={i} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          <i>{ar(i + 1)}</i>
          <div><h3>{s.title}</h3><p>{s.text}</p></div>
        </li>
      ))}
    </ol>
  )
}

function Crew({ n }: { n: N }) {
  if (!n.members.length) return null
  return (
    <div className={`c-crew c${Math.min(n.members.length, 3)}`}>
      {n.members.map((m, i) => (
        <article key={m.name} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          <div className="c-badge-id">
            {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span aria-hidden="true">{m.name.replace(/^(أبو|ابو)\s+/, '').slice(0, 1)}</span>}
          </div>
          <div>
            <small>{m.role || 'فني'}</small>
            <h3>{m.name}</h3>
            {m.tags?.length ? <ul>{m.tags.map((t) => <li key={t}><Icon of={t} size={13} />{t}</li>)}</ul> : null}
            {m.quote ? <blockquote>«{m.quote}»{m.quote_by ? <cite>{m.quote_by}، على Google</cite> : null}</blockquote> : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function Shots({ n, urls }: { n: N; urls: string[] }) {
  const [at, setAt] = useState<number | null>(null)
  if (urls.length < 2) return null
  return (
    <>
      <div className={`c-shots c${Math.min(urls.length, 5)}`}>
        {urls.slice(0, 5).map((u, i) => <button key={u} type="button" onClick={() => setAt(i)} data-r style={{ ['--d' as string]: i } as CSSProperties} aria-label={`افتح الصورة ${i + 1}`}><img src={u} alt={`${n.short} ${i + 1}`} loading="lazy" /></button>)}
      </div>
      <Lightbox urls={urls.slice(0, 5)} at={at} onClose={() => setAt(null)} alt={n.short} />
    </>
  )
}

function Perks({ list }: { list: string[] }) {
  if (!list.length) return null
  return <ul className="c-perks">{list.map((f, i) => <li key={f} data-r style={{ ['--d' as string]: i } as CSSProperties}><Icon of={f} size={24} /><span>{f}</span></li>)}</ul>
}

/* ---------- the theme ---------- */

export default function CarFull({ content, x = {}, colors, initial, view, onViewChange }: { content: ServiceContent; x?: NicheExtra; colors?: Colors; initial?: string; view?: string; onViewChange?: (id: string) => void }) {
  const n = useNiche(content)
  const promises = (x.blocks || []).filter((b) => b.text.trim())
  const groups = useMemo(() => {
    const m = new Map<string, N['services']>()
    for (const s of n.services) { const g = x.groups?.[s.name] || 'خدماتنا'; m.set(g, [...(m.get(g) || []), s]) }
    return Array.from(m.entries())
  }, [n.services, x.groups])
  const [tab, setTab] = useState(0)
  const brands = x.brands || []
  const facilities = x.facilities || []
  const terms = (content.terms || []).filter((t) => t.text.trim() && !promises.some((b) => b.title === t.label))
  const steps = x.steps?.length ? x.steps : [
    { title: 'تصل أو نستلم سيارتك', text: facilities.some((f) => /استلام/.test(f)) ? 'تأتي إلى الورشة، أو نأخذ السيارة من بيتك.' : 'تأتي إلى الورشة في موعدك.' },
    { title: 'نفحص ونكتب السعر', text: promises.find((b) => b.id === 'price_first')?.text || 'نخبرك بما تحتاجه السيارة وسعره.' },
    { title: 'نبدأ بعد موافقتك', text: 'لا نلمس شيئًا قبل أن توافق.' },
    { title: 'تستلم سيارتك', text: promises.find((b) => b.id === 'warranty')?.text || 'جاهزة، ونشرح لك ما عملناه.' },
  ]
  const pics = n.photos

  const svcHead = (
    <Head title="الخدمات" sub={n.priced ? 'السعر يبدأ من الرقم المكتوب. نخبرك بالسعر النهائي قبل أن نبدأ.' : 'اسأل عن سعر سيارتك على واتساب، ونرد عليك بالسعر قبل أي عمل.'} more={n.services.length > 6 ? <GoLink to="services">كل الخدمات<ArrowLeft size={16} /></GoLink> : null} />
  )

  const home = (
    <>
      <Hero n={n} content={content} promises={promises} />
      <Makes brands={brands} />
      {x.story ? <section className="c-sec"><div className="n-w"><ScrollWords text={x.story} className="c-man" /></div></section> : null}
      {n.services.length ? <section className="c-sec c-alt"><div className="n-w">{svcHead}<Tickets n={n} list={n.services.slice(0, 6)} /></div></section> : null}
      {(x.sizes || []).length ? <section className="c-sec"><div className="n-w c-split"><div data-r><h2 className="c-h2">غسيل وتلميع</h2><p className="c-lead">اختر حجم سيارتك، وترى السعر فورًا.</p></div><Sizes x={x} /></div></section> : null}
      <section className="c-sec c-alt"><div className="n-w"><Head title="كيف نعمل" more={promises.length ? <GoLink to="promise">ضماننا<ArrowLeft size={16} /></GoLink> : null} /><Route steps={steps} /></div></section>
      {n.reviews.length ? <section className="c-sec"><div className="n-w"><Head title="ماذا يقول الزبائن" /><Reviews n={n} max={5} /></div></section> : null}
      {facilities.length ? <section className="c-sec c-alt"><div className="n-w"><Head title="وأنت تنتظر" /><Perks list={facilities} /></div></section> : null}
      {n.faq.length ? <section className="c-sec"><div className="n-w c-faqw"><Head title="أسئلة" /><Faq items={n.faq.slice(0, 4)} /></div></section> : null}
    </>
  )

  const g = groups[Math.min(tab, groups.length - 1)]
  const pages: SPage[] = [
    { id: 'home', label: 'الرئيسية', body: home },
    {
      id: 'services', label: 'الخدمات', title: 'كل الخدمات', lead: brands.length ? `نعمل على ${brands.slice(0, 4).join(' و')} وغيرها.` : undefined,
      body: n.services.length ? (
        <>
          <section className="c-sec"><div className="n-w">
            {groups.length > 1 ? (
              <div className="c-tabs" role="tablist" data-r>
                {groups.map(([name, list], i) => <button key={name} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{name}<small>{ar(list.length)}</small></button>)}
              </div>
            ) : null}
            {g ? <Tickets key={g[0]} n={n} list={g[1]} /> : null}
          </div></section>
          {(x.sizes || []).length ? <section className="c-sec c-alt"><div className="n-w c-split"><div data-r><h2 className="c-h2">السعر حسب الحجم</h2><p className="c-lead">للغسيل والتلميع. الصيانة سعرها حسب السيارة.</p></div><Sizes x={x} /></div></section> : null}
          {brands.length ? <section className="c-sec"><div className="n-w"><Head title="نعمل على" /><ul className="c-brands">{brands.map((b, i) => <li key={b} data-r style={{ ['--d' as string]: i % 8 } as CSSProperties}>{b}</li>)}</ul></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'promise', label: 'ضماننا', title: 'ما نعدك به', lead: 'هذه وعودنا مكتوبة. اسألنا عنها في أي وقت.',
      body: promises.length ? (
        <>
          <section className="c-sec"><div className="n-w">
            <ol className="c-vows">
              {promises.map((b, i) => (
                <li key={b.id} data-r style={{ ['--d' as string]: i } as CSSProperties}>
                  <span className="c-no">#{String(i + 1).padStart(2, '0')}</span>
                  <Icon of={b.title} size={34} fallback={FileCheck} />
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </li>
              ))}
            </ol>
          </div></section>
          <section className="c-sec c-alt"><div className="n-w"><Head title="من الوصول إلى الاستلام" /><Route steps={steps} /></div></section>
          {terms.length ? <section className="c-sec"><div className="n-w"><Head title="شروط مكتوبة" /><dl className="c-terms">{terms.map((t) => <div key={t.label} data-r><dt>{t.label}</dt><dd>{t.text}</dd></div>)}</dl></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'shop', label: 'الورشة', title: `داخل ${n.short}`, lead: x.story, image: pics[1] || undefined,
      body: n.members.length || pics.length >= 2 || facilities.length ? (
        <>
          {n.members.length ? <section className="c-sec"><div className="n-w"><Head title="من سيعمل على سيارتك" /><Crew n={n} /></div></section> : null}
          {pics.length >= 2 ? <section className="c-sec c-alt"><div className="n-w"><Head title="صور من الورشة" /><Shots n={n} urls={pics} /></div></section> : null}
          {facilities.length ? <section className="c-sec"><div className="n-w"><Head title="وأنت تنتظر" /><Perks list={facilities} /></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'book', label: 'احجز موعدًا', title: 'احجز موعدًا', lead: 'اختر الخدمة والوقت. نؤكّد لك على واتساب، ونرسل السعر قبل أن نبدأ.',
      body: (
        <>
          <section className="c-sec"><div className="n-w c-bookw">
            <div className="c-order" data-r>
              <div className="c-order-h"><b>طلب موعد</b><span>{n.b.name}</span></div>
              <Book n={n} options={n.services.map((s) => s.name)} place="الورشة" label="أرسل الطلب" />
            </div>
            <aside className="c-side" data-r>
              <MapCard n={n} address={content.footer.address} />
              {n.st ? <p className="c-today"><Clock size={16} /> {todayLine(n)}</p> : null}
              {n.hours.length ? <Hours n={n} /> : null}
            </aside>
          </div></section>
          {n.faq.length ? <section className="c-sec c-alt"><div className="n-w c-faqw"><Head title="أسئلة" /><Faq items={n.faq} /></div></section> : null}
        </>
      ),
    },
  ]

  return (
    <Shell
      n={n} content={content} root="cf" pages={pages} initial={initial} view={view} onViewChange={onViewChange}
      style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Rubik", sans-serif', ['--n-body' as string]: '"Rubik", sans-serif' } as CSSProperties}
      fonts="family=Rubik:wght@400;500;600;700;800;900"
      css={KIT_CSS + BLOCKS_CSS + CSS}
      cta={{ label: 'احجز موعدًا', page: 'book' }}
      close={{ title: promises[0]?.title || 'سيارتك في أيدٍ أمينة', text: promises[0]?.text, image: pics[pics.length - 1] || n.hero || undefined }}
      strip={promises.find((b) => b.id === 'free_check') ? [promises.find((b) => b.id === 'free_check')!.title] : undefined}
    />
  )
}

const CSS = `
.cf{--n-r-btn:4px;--n-r-in:4px;--n-r-card:6px;--s-strip-bg:#000;--s-strip-ink:#d6d9dc;--s-foot-bg:#08090a;--s-foot-ink:var(--n-ink);--s-menu-bg:var(--n-acc);--s-menu-ink:#111}
.cf .s-head{background:color-mix(in srgb,var(--n-bg) 90%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.cf .s-logo b{font-weight:900}
.cf .s-menu .n-btn{background:#111;color:var(--n-acc)}
.cf .s-menu .n-btn.ghost{background:transparent;color:#111;border-color:rgba(0,0,0,.3)}
.cf .s-ph:not(.img){background:repeating-linear-gradient(-45deg,transparent 0 22px,color-mix(in srgb,var(--n-acc) 5%,transparent) 22px 24px)}
.cf .s-ph:not(.img)::before{content:"";position:absolute;inset:auto 0 0;height:6px;background:repeating-linear-gradient(-45deg,var(--n-acc) 0 14px,#111 14px 28px)}
.cf .n-btn{font-weight:700}
.cf .c-big{min-height:56px;padding:0 26px;font-size:16px}
.c-sec{padding:112px 0}
.c-alt{background:var(--n-bg2)}
.c-h2{font-size:clamp(36px,5vw,72px);font-weight:900;line-height:1}
.c-lead{color:var(--n-ink2);margin-top:14px;font-size:17px;max-width:40ch}
.c-no{font:700 12px/1 var(--n-body);letter-spacing:.08em;color:var(--n-acc);font-variant-numeric:tabular-nums}
@media (max-width:760px){.c-sec{padding:72px 0}}

/* hero */
.c-hero{position:relative;min-height:calc(100svh - var(--s-strip) - var(--s-head));display:grid;align-content:end;overflow:hidden;isolation:isolate}
.c-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;clip-path:inset(0 0 0 0);animation:c-wipe 1.3s cubic-bezier(.7,0,.2,1) both}
@keyframes c-wipe{from{clip-path:inset(0 0 0 100%)}}
.c-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,var(--n-bg) 6%,color-mix(in srgb,var(--n-bg) 70%,transparent) 45%,color-mix(in srgb,var(--n-bg) 25%,transparent)),linear-gradient(to left,color-mix(in srgb,var(--n-bg) 75%,transparent) 20%,transparent 70%)}
.c-hero-in{display:grid;grid-template-columns:1.25fr .75fr;gap:48px;align-items:end;padding:64px 0 36px}
.c-hero-main{display:grid;gap:22px;justify-items:start}
.c-tag{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:4px;background:var(--n-acc);color:#111;font-size:13px;font-weight:700;animation:c-in .6s .5s both}
.c-hero h1{font-size:clamp(60px,9.5vw,148px);font-weight:900;line-height:1.02;letter-spacing:-.02em;overflow:hidden;padding-bottom:.08em}
.c-hero h1 span{display:block;animation:c-up .9s cubic-bezier(.2,.9,.1,1) .35s both}
@keyframes c-up{from{transform:translateY(105%)}}
@keyframes c-in{from{opacity:0;transform:translateY(16px)}}
.c-hero-main>p{font-size:clamp(17px,1.6vw,20px);color:var(--n-ink2);max-width:42ch;animation:c-in .7s .6s both}
.c-hero-main .n-row{animation:c-in .7s .7s both}
.c-stamps{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.c-stamps li{position:relative;padding:18px 20px 18px 54px;border-radius:6px;background:color-mix(in srgb,var(--n-bg) 78%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--n-line);border-inline-start:3px solid var(--n-acc);display:grid;gap:4px;animation:c-stamp .7s cubic-bezier(.3,1.4,.5,1) both;animation-delay:calc(.8s + var(--i)*.14s)}
@keyframes c-stamp{from{opacity:0;transform:translateX(-30px) rotate(-2deg)}}
.c-stamps b{font-size:17px}
.c-stamps p{font-size:14px;color:var(--n-ink2);line-height:1.6}
.c-ok{position:absolute;left:18px;top:18px;color:var(--n-acc)}
.c-gauge{display:flex;gap:12px 48px;flex-wrap:wrap;padding:20px 0 30px;border-top:1px solid var(--n-line);animation:c-in .7s 1.1s both}
.c-gauge span{display:grid;line-height:1.15}
.c-gauge b{font:900 32px var(--n-disp);font-variant-numeric:tabular-nums}.c-gauge b.ok{color:#5bd68e}.c-gauge b.no{color:#ff8a73}
.c-gauge small{font-size:13px;color:var(--n-mute)}
@media (max-width:900px){.c-hero-in{grid-template-columns:1fr;gap:28px;padding-top:48px}.c-hero-main .n-row{width:100%}.c-hero-main .n-btn{flex:1}.c-stamps li{padding:14px 16px 14px 48px}.c-gauge{gap:12px 28px}}

/* makes */
.c-makes{display:flex;align-items:center;border-block:1px solid var(--n-line);background:var(--n-bg)}
.c-makes-l{flex:none;padding:0 24px;height:64px;display:grid;place-items:center;background:var(--n-acc);color:#111;font-weight:800;font-size:14px}
.c-makes-v{overflow:hidden;flex:1;mask-image:linear-gradient(to left,transparent,#000 8%,#000 92%,transparent)}
.c-makes-t{display:flex;width:max-content;animation:c-mq 36s linear infinite}
.c-makes-t span{font:800 26px var(--n-disp);padding:0 34px;color:var(--n-ink2);white-space:nowrap;border-inline-start:1px solid var(--n-line)}
@keyframes c-mq{to{transform:translateX(33.333%)}}

.c-man{font:800 clamp(28px,4.2vw,58px)/1.2 var(--n-disp);max-width:24ch}

/* tickets */
.c-tix{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.c-tix article{position:relative;display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:6px;background:var(--n-bg);border:1px solid var(--n-line);overflow:hidden;transition:border-color .3s,transform .4s cubic-bezier(.3,1.4,.5,1)}
.c-tix article::after{content:"";position:absolute;inset:auto 0 0;height:3px;background:var(--n-acc);transform:scaleX(0);transform-origin:right;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.c-tix article:hover{border-color:color-mix(in srgb,var(--n-acc) 45%,var(--n-line));transform:translateY(-4px)}
.c-tix article:hover::after{transform:none}
.c-tix header{display:flex;justify-content:space-between;align-items:center;color:var(--n-acc)}
.c-tix header span{font:700 13px var(--n-body);letter-spacing:.08em}
.c-tix h3{font:800 24px/1.2 var(--n-disp)}
.c-tix p{font-size:14px;color:var(--n-ink2)}
.c-tix footer{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:14px;border-top:1px dashed var(--n-line);font-size:14px}
.c-tix footer span{display:inline-flex;gap:6px;align-items:center;color:var(--n-mute)}
.c-tix footer b{font-size:17px}.c-tix footer b.ask{font-size:14px;color:var(--n-mute)}
.c-tix footer a{font-weight:700;color:var(--n-acc);border-bottom:1px solid currentColor}
.c-tix-go{all:unset;cursor:pointer;position:absolute;top:18px;left:56px;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:var(--n-acc);color:#111;opacity:0;transform:scale(.6);transition:opacity .3s,transform .4s cubic-bezier(.3,1.5,.5,1)}
.c-tix article:hover .c-tix-go,.c-tix-go:focus-visible{opacity:1;transform:none}
@media (max-width:900px){.c-tix{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.c-tix{grid-template-columns:1fr;gap:8px}.c-tix article{padding:16px 18px;gap:8px}.c-tix h3{font-size:20px}.c-tix footer{padding-top:10px}.c-tix-go{opacity:1;transform:none;top:auto;bottom:62px;left:18px;display:none}}

/* sizes */
.c-split{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px;align-items:center}
.c-size{border-radius:8px;background:var(--n-bg2);border:1px solid var(--n-line);overflow:hidden}
.c-alt .c-size{background:var(--n-bg)}
.c-size-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:18px 20px;border-bottom:1px solid var(--n-line)}
.c-size-top>div:first-child{display:flex;gap:10px;align-items:center;color:var(--n-acc)}.c-size-top b{color:var(--n-ink)}
.c-seg{position:relative;display:flex;padding:4px;border-radius:999px;background:color-mix(in srgb,var(--n-ink) 7%,transparent)}
.c-seg i{position:absolute;top:4px;bottom:4px;right:0;left:auto;border-radius:999px;background:var(--n-acc);transition:transform .45s cubic-bezier(.3,1.3,.5,1),width .45s cubic-bezier(.3,1.3,.5,1);left:0;right:auto}
.c-seg button{all:unset;cursor:pointer;position:relative;z-index:1;padding:9px 18px;font-weight:700;font-size:14px;transition:color .3s;border-radius:999px}
.c-seg button.on{color:#111}
.c-seg button:focus-visible{outline:2px solid var(--n-acc)}
.c-size ul{list-style:none;margin:0;padding:0}
.c-size li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px;border-bottom:1px solid var(--n-line);font-size:17px}
.c-size li:last-child{border-bottom:0}
.c-size li span{display:flex;gap:10px;align-items:center}.c-size li span svg{color:var(--n-mute)}
.c-roll{font:900 26px var(--n-disp);font-variant-numeric:tabular-nums;animation:c-roll .45s cubic-bezier(.3,1.4,.5,1) both}
@keyframes c-roll{from{opacity:0;transform:translateY(60%)}}
@media (max-width:900px){.c-split{grid-template-columns:1fr;gap:24px}.c-seg{width:100%}.c-seg button{flex:1;text-align:center;padding:10px 6px}}

/* route */
.c-route{--p:0;list-style:none;margin:0;padding:0;position:relative;display:grid;grid-template-columns:repeat(var(--k,4),1fr);gap:24px}
.c-route{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.c-route::before,.c-route::after{content:"";position:absolute;top:27px;right:28px;left:28px;height:2px;background:var(--n-line)}
.c-route::after{background:var(--n-acc);transform:scaleX(var(--p));transform-origin:right}
.c-route li{position:relative;display:grid;gap:18px;align-content:start}
.c-route i{position:relative;z-index:1;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font:900 22px var(--n-disp);font-style:normal;background:var(--n-bg2);border:2px solid var(--n-acc);color:var(--n-acc)}
.c-alt .c-route i{background:var(--n-bg2)}
.c-route h3{font:800 21px var(--n-disp);margin-bottom:6px}
.c-route p{color:var(--n-ink2);font-size:15px}
@media (max-width:900px){.c-route{grid-template-columns:1fr;gap:28px}.c-route::before,.c-route::after{top:28px;bottom:28px;right:27px;left:auto;width:2px;height:auto}.c-route::after{transform:scaleY(var(--p));transform-origin:top}.c-route li{grid-template-columns:56px 1fr;gap:18px}}

/* crew */
.c-crew{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.c-crew.c1{grid-template-columns:minmax(0,640px)}
.c-crew.c3{grid-template-columns:repeat(3,1fr)}
.c-crew article{display:grid;grid-template-columns:120px 1fr;gap:20px;padding:22px;border-radius:8px;background:var(--n-bg2);border:1px solid var(--n-line);align-items:start}
.c-badge-id{aspect-ratio:3/4;border-radius:6px;overflow:hidden;background:repeating-linear-gradient(-45deg,var(--n-acc) 0 10px,#111 10px 20px);display:grid;place-items:center}
.c-badge-id img{width:100%;height:100%;object-fit:cover}
.c-badge-id span{width:70%;aspect-ratio:1;border-radius:50%;background:var(--n-bg);display:grid;place-items:center;font:900 44px var(--n-disp);color:var(--n-acc)}
.c-crew small{font-size:12px;font-weight:700;color:var(--n-acc)}
.c-crew h3{font:900 30px/1.1 var(--n-disp);margin:4px 0 10px}
.c-crew ul{list-style:none;margin:0 0 12px;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.c-crew li{display:inline-flex;gap:6px;align-items:center;font-size:13px;padding:4px 10px;border-radius:4px;background:color-mix(in srgb,var(--n-ink) 7%,transparent)}
.c-crew blockquote{margin:0;font-size:15px;color:var(--n-ink2);display:grid;gap:4px}
.c-crew cite{font-style:normal;font-size:12px;color:var(--n-mute)}
@media (max-width:900px){.c-crew,.c-crew.c3{grid-template-columns:1fr}.c-crew article{grid-template-columns:90px 1fr;padding:16px}}

/* shots */
.c-shots{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:240px;gap:10px}
.c-shots button{all:unset;cursor:zoom-in;overflow:hidden;border-radius:6px;grid-column:span 2}
.c-shots button:nth-child(1),.c-shots button:nth-child(2){grid-column:span 3}
.c-shots.c2 button{grid-column:span 3}
.c-shots img{width:100%;height:100%;object-fit:cover;transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.c-shots button:hover img{transform:scale(1.06)}
@media (max-width:760px){.c-shots{grid-template-columns:1fr 1fr;grid-auto-rows:150px}.c-shots button,.c-shots button:nth-child(2){grid-column:auto}.c-shots button:nth-child(1){grid-column:span 2}}

.c-perks{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:12px}
.c-perks li{display:flex;align-items:center;gap:12px;padding:18px 22px;border-radius:6px;background:var(--n-bg);border:1px solid var(--n-line);font-weight:700;font-size:17px}
.c-alt .c-perks li{background:var(--n-bg)}
.c-perks svg{color:var(--n-acc)}

.c-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.c-tabs button{all:unset;cursor:pointer;display:inline-flex;gap:10px;align-items:center;padding:12px 20px;border-radius:4px;border:1px solid var(--n-line);font-weight:700;transition:background .25s,color .25s,border-color .25s}
.c-tabs small{font-size:12px;padding:2px 8px;border-radius:3px;background:color-mix(in srgb,var(--n-ink) 10%,transparent)}
.c-tabs button.on{background:var(--n-acc);color:#111;border-color:var(--n-acc)}.c-tabs button.on small{background:rgba(0,0,0,.15)}
.c-tabs button:focus-visible{outline:2px solid var(--n-acc);outline-offset:2px}
.c-brands{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:1px;background:var(--n-line);border:1px solid var(--n-line);border-radius:6px;overflow:hidden}
.c-brands li{background:var(--n-bg);padding:28px 16px;text-align:center;font:800 20px var(--n-disp);transition:background .25s,color .25s}
.c-brands li:hover{background:var(--n-acc);color:#111}

.c-vows{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.c-vows li{position:relative;padding:30px 28px;border-radius:6px;background:var(--n-bg2);border:1px solid var(--n-line);display:grid;gap:14px;align-content:start;overflow:hidden}
.c-vows li::after{content:"";position:absolute;top:0;right:0;left:0;height:4px;background:repeating-linear-gradient(-45deg,var(--n-acc) 0 10px,#111 10px 20px)}
.c-vows svg{color:var(--n-acc)}
.c-vows h3{font:900 28px var(--n-disp)}
.c-vows p{color:var(--n-ink2);font-size:16px}
.c-terms{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.c-terms div{padding:22px;border-radius:6px;border:1px solid var(--n-line);display:grid;gap:6px}
.c-terms dt{font-weight:800;font-size:18px}.c-terms dd{margin:0;color:var(--n-ink2)}

.c-bookw{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:start}
.c-order{border-radius:8px;background:var(--n-bg2);border:1px solid var(--n-line);overflow:hidden}
.c-order-h{display:flex;justify-content:space-between;align-items:center;padding:16px 26px;background:var(--n-acc);color:#111}
.c-order-h b{font:900 18px var(--n-disp)}.c-order-h span{font-size:13px;font-weight:600}
.c-order .n-form,.c-order .n-ask,.c-order .n-done{padding:26px;margin:0}
.c-order .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:#111}
.c-side{display:grid;gap:14px;position:sticky;top:calc(var(--s-head) + 20px)}
.c-today{display:flex;gap:8px;align-items:center;font-weight:600}
.c-faqw{max-width:900px}
@media (max-width:900px){.c-bookw{grid-template-columns:1fr}.c-side{position:static}.c-order .n-form{padding:18px}}
`
