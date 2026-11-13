'use client'

/**
 * Photo studio «المعرض أولًا», the full theme. SAMPLE (2026-11-13), built on option A.
 *
 * Six pages: home, the work, packages, official photos, the studio, book.
 * Made for a studio: the opening is a viewfinder that runs through the work,
 * the work wall filters by kind of shoot and re-flows, packages read like a
 * printed price list, official photo sizes are drawn to scale, and delivery
 * is a line from the shoot day to the files in your hand.
 *
 * Near-black so the photos carry the page. Every list can hold 0, 1 or many;
 * a page with nothing to show is dropped with its link.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, Clock, Focus, Images } from 'lucide-react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Hours, ar, useNiche, vars, type Colors, type N, type NicheExtra } from './kit'
import { BLOCKS_CSS, Faq, Head, Icon, Lightbox, MapCard, Reviews, ScrollWords } from './blocks'
import { Brand, GoLink, Shell, todayLine, useGo, type SPage } from './shell'

const LOOK = { background: '#0c0c0d', surface: '#151517', text: '#f1f0ee', muted: '#8e8c88', accent: '#f1f0ee', border: '#262628' }

type Work = { url: string; tag: string }
type Pack = { name: string; includes: string[]; duration?: string; price?: string }

const vt = (cb: () => void) => {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (d.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(() => flushSync(cb))
  else cb()
}

/* ---------- sections ---------- */

/** The opening: the name, then a viewfinder that runs through the work. */
function Viewfinder({ n, content, work }: { n: N; content: ServiceContent; work: Work[] }) {
  const go = useGo()
  const [i, setI] = useState(0)
  const pics = work.length ? work : n.hero ? [{ url: n.hero, tag: '' }] : []
  useEffect(() => {
    if (pics.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI((v) => (v + 1) % pics.length), 3800)
    return () => clearInterval(t)
  }, [pics.length])
  return (
    <section className="p-hero">
      <div className="n-w p-hero-top">
        <h1><span>{n.short}</span>{n.b.latin ? <small dir="ltr">{n.b.latin}</small> : null}</h1>
        <div className="p-hero-side">
          {content.hero.subheadline || n.b.tagline ? <p>{content.hero.subheadline || n.b.tagline}</p> : null}
          <div className="n-row">
            <button type="button" className="n-btn p-big" onClick={() => go('book')}>احجز جلستك<ArrowLeft size={18} /></button>
            {work.length >= 4 ? <button type="button" className="n-btn ghost p-big" onClick={() => go('work')}>شاهد الأعمال</button> : null}
          </div>
        </div>
      </div>
      {pics.length ? (
        <div className="n-w">
          <div className="p-vf">
            {pics.map((w, k) => <img key={w.url} src={w.url} alt={k === i ? (w.tag ? `${w.tag} من ${n.short}` : n.short) : ''} className={k === i ? 'on' : ''} loading={k ? 'lazy' : 'eager'} />)}
            <span className="p-vf-c tl" /><span className="p-vf-c tr" /><span className="p-vf-c bl" /><span className="p-vf-c br" />
            <span className="p-vf-focus" key={i} aria-hidden="true" />
            <div className="p-vf-bar" dir="ltr" aria-hidden="true">
              <span><i />{String(i + 1).padStart(2, '0')} / {String(pics.length).padStart(2, '0')}</span>
              <span>{pics[i]?.tag || n.b.latin || ''}</span>
              {n.rating ? <span>★ {n.rating.toFixed(1)}</span> : <span />}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

/** Kinds of shoot, each a card with its first photo; opens the work wall on that kind. */
function Kinds({ work, onPick }: { work: Work[]; onPick: (t: string) => void }) {
  const kinds = Array.from(new Set(work.map((w) => w.tag).filter(Boolean)))
  if (kinds.length < 2) return null
  return (
    <div className="p-kinds">
      {kinds.map((t, i) => {
        const first = work.find((w) => w.tag === t)!
        const count = work.filter((w) => w.tag === t).length
        return (
          <button key={t} type="button" onClick={() => onPick(t)} data-r style={{ ['--d' as string]: i } as CSSProperties}>
            <img src={first.url} alt="" loading="lazy" />
            <span><b>{t}</b><small>{ar(count)} {count > 2 && count < 11 ? 'صور' : 'صورة'}</small></span>
            <ArrowLeft size={20} />
          </button>
        )
      })}
    </div>
  )
}

/** The wall: masonry, a filter per kind that re-flows it, a viewer on tap. */
function Wall({ n, work, tag, setTag, limit }: { n: N; work: Work[]; tag: string; setTag?: (t: string) => void; limit?: number }) {
  const tags = useMemo(() => Array.from(new Set(work.map((w) => w.tag).filter(Boolean))), [work])
  const shown = work.filter((w) => !tag || w.tag === tag).slice(0, limit || 99)
  const [at, setAt] = useState<number | null>(null)
  if (!work.length) return null
  return (
    <>
      {setTag && tags.length > 1 ? (
        <div className="p-filter" role="tablist" aria-label="نوع التصوير" data-r>
          {['', ...tags].map((t) => <button key={t || 'all'} type="button" role="tab" aria-selected={tag === t} className={tag === t ? 'on' : ''} onClick={() => vt(() => setTag(t))}>{t || 'الكل'}<sup>{ar(t ? work.filter((w) => w.tag === t).length : work.length)}</sup></button>)}
        </div>
      ) : null}
      <div className={`p-wall c${Math.min(shown.length, 3)}`}>
        {shown.map((w, k) => (
          <button key={w.url} type="button" className="p-ph" style={{ viewTransitionName: `p-${work.indexOf(w)}` } as CSSProperties} onClick={() => setAt(k)} aria-label={`افتح ${w.tag || 'الصورة'}`}>
            <img src={w.url} alt={w.tag ? `${w.tag} من ${n.short}` : n.short} loading="lazy" ref={(el) => { if (el?.complete) el.classList.add('ok') }} onLoad={(e) => e.currentTarget.classList.add('ok')} />
            {w.tag ? <span>{w.tag}</span> : null}
          </button>
        ))}
      </div>
      <Lightbox urls={shown.map((w) => w.url)} at={at} onClose={() => setAt(null)} alt={n.short} />
    </>
  )
}

/** Packages as a printed price list: name, dotted leader, price; what is in it underneath. */
function PriceList({ n, packs }: { n: N; packs: Pack[] }) {
  const go = useGo()
  if (!packs.length) return null
  return (
    <ol className="p-list">
      {packs.map((p, i) => (
        <li key={p.name} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          <div className="p-list-row">
            <small>{String(i + 1).padStart(2, '0')}</small>
            <h3>{p.name}</h3>
            <i aria-hidden="true" />
            {p.price ? <b>{p.price}</b> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${p.name}؟`)!} target="_blank" rel="noopener noreferrer">اسأل عن السعر</a> : <b className="ask">حسب الطلب</b>}
          </div>
          <div className="p-list-sub">
            {p.includes.length ? <ul>{p.includes.map((t) => <li key={t}>{t}</li>)}</ul> : <span />}
            <div>
              {p.duration ? <span><Clock size={14} /> {p.duration}</span> : null}
              <button type="button" onClick={() => go('book')}>احجز<ArrowLeft size={15} /></button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** From the shoot to the files: when each kind of work is delivered. */
function Delivery({ list }: { list: { what: string; when: string }[] }) {
  if (!list.length) return null
  return (
    <ol className="p-del">
      <li className="p-del-0" data-r><i /><b>يوم التصوير</b><span>نصوّر في الاستوديو أو عندك</span></li>
      {list.map((d, k) => <li key={d.what} data-r style={{ ['--d' as string]: k + 1 } as CSSProperties}><i /><b>{d.when}</b><span>{d.what}</span></li>)}
    </ol>
  )
}

/** Official photo sizes drawn to scale (1 cm = --u), with their measurements. */
function Sizes({ specs }: { specs: { label: string; text: string }[] }) {
  if (!specs.length) return null
  return (
    <div className="p-sizes">
      {specs.map((s, i) => {
        const m = /([\d.]+)\s*[×x]\s*([\d.]+)/.exec(s.text)
        const w = m ? Number(m[1]) : 3.5, h = m ? Number(m[2]) : 4.5
        const rest = s.text.replace(/^[^،,]*[،,]\s*/, '')
        return (
          <figure key={s.label} data-r style={{ ['--d' as string]: i } as CSSProperties}>
            <div className="p-size-box">
              <span className="p-size-ph" style={{ width: `calc(${w} * var(--u))`, height: `calc(${h} * var(--u))` } as CSSProperties}>
                <svg viewBox="0 0 40 50" aria-hidden="true"><circle cx="20" cy="19" r="9" fill="currentColor" /><path d="M4 50c1-11 8-17 16-17s15 6 16 17z" fill="currentColor" /></svg>
                <em className="w" dir="ltr">{w} cm</em><em className="h" dir="ltr">{h} cm</em>
              </span>
            </div>
            <figcaption><b>{s.label}</b><span>{m ? `${w} × ${h} سم` : s.text}{m && rest !== s.text ? `، ${rest}` : ''}</span></figcaption>
          </figure>
        )
      })}
    </div>
  )
}

function Notes({ list }: { list: { id: string; title: string; text: string }[] }) {
  if (!list.length) return null
  return <div className="p-notes">{list.map((b, i) => <div key={b.id} data-r style={{ ['--d' as string]: i } as CSSProperties}><Icon of={b.title} size={22} /><h3>{b.title}</h3><p>{b.text}</p></div>)}</div>
}

/* ---------- the theme ---------- */

export default function PhotoFull({ content, x = {}, colors, initial, view, onViewChange }: { content: ServiceContent; x?: NicheExtra; colors?: Colors; initial?: string; view?: string; onViewChange?: (id: string) => void }) {
  const n = useNiche(content)
  const work: Work[] = useMemo(() => (x.work?.length ? x.work : n.photos.map((url) => ({ url, tag: '' }))), [x.work, n.photos])
  const [tag, setTag] = useState('')
  const packs: Pack[] = x.packages?.length ? x.packages : n.services.map((s) => ({ name: s.name, includes: s.description ? [s.description] : [], duration: s.duration, price: s.price_from }))
  const notes = (x.blocks || []).filter((b) => b.text.trim())
  const specs = x.specs || []
  const owner = n.members[0]

  const home = (
    <>
      <Viewfinder n={n} content={content} work={work} />
      <HomeKinds work={work} setTag={setTag} />
      {work.length >= 4 ? <section className="p-sec"><div className="n-w"><Head title="مختارات من أعمالنا" more={<GoLink to="work">كل الأعمال<ArrowLeft size={16} /></GoLink>} /><Wall n={n} work={work} tag="" limit={6} /></div></section> : null}
      {x.story ? <section className="p-sec p-alt"><div className="n-w"><ScrollWords text={x.story} className="p-man" /></div></section> : null}
      {packs.length ? <section className="p-sec"><div className="n-w"><Head title="الأسعار" sub="السعر يشمل التعديل. لا رسوم بعد التصوير." more={packs.length > 3 ? <GoLink to="packages">كل الباقات<ArrowLeft size={16} /></GoLink> : null} /><PriceList n={n} packs={packs.slice(0, 3)} /></div></section> : null}
      {x.delivery?.length ? <section className="p-sec p-alt"><div className="n-w"><Head title="متى تستلم صورك" /><Delivery list={x.delivery} /></div></section> : null}
      {specs.length ? <section className="p-sec"><div className="n-w p-split"><div data-r><h2 className="p-h2">صور رسمية في دقائق</h2><p className="p-lead">جواز، هوية، تأشيرة. نعرف المقاس المطلوب لكل ورقة.</p><GoLink to="official">كل المقاسات<ArrowLeft size={16} /></GoLink></div><Sizes specs={specs.slice(0, 3)} /></div></section> : null}
      {n.reviews.length ? <section className="p-sec p-alt"><div className="n-w"><Head title="قالوا عنا" /><Reviews n={n} max={5} /></div></section> : null}
      {n.faq.length ? <section className="p-sec"><div className="n-w p-faqw"><Head title="أسئلة" /><Faq items={n.faq.slice(0, 4)} /></div></section> : null}
    </>
  )

  const pages: SPage[] = [
    { id: 'home', label: 'الرئيسية', body: home },
    {
      id: 'work', label: 'الأعمال', title: 'الأعمال', lead: 'صور من جلساتنا. اختر النوع الذي تريده.',
      body: work.length >= 2 ? <section className="p-sec p-tight"><div className="n-w"><Wall n={n} work={work} tag={tag} setTag={setTag} /></div></section> : null,
    },
    {
      id: 'packages', label: 'الباقات', title: 'الباقات والأسعار', lead: 'كل باقة مكتوب ما فيها، ومتى تستلمها.',
      body: packs.length ? (
        <>
          <section className="p-sec p-tight"><div className="n-w"><PriceList n={n} packs={packs} /></div></section>
          {x.delivery?.length ? <section className="p-sec p-alt"><div className="n-w"><Head title="التسليم" /><Delivery list={x.delivery} /></div></section> : null}
          {notes.length ? <section className="p-sec"><div className="n-w"><Head title="قبل أن تحجز" /><Notes list={notes} /></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'official', label: 'الصور الرسمية', title: 'الصور الرسمية', lead: 'تأتي، نصوّر، وتخرج بالصور مطبوعة. بلا موعد.',
      body: specs.length ? (
        <>
          <section className="p-sec p-tight"><div className="n-w"><Sizes specs={specs} /></div></section>
          {n.wa ? <section className="p-sec p-alt"><div className="n-w p-ask"><Focus size={30} /><h2 data-r>لا تعرف المقاس المطلوب؟</h2><p data-r>أرسل لنا اسم الجهة أو صورة الطلب، ونخبرك بالمقاس.</p><a className="n-btn p-big" href={n.waLink('مرحبًا، أحتاج صورة رسمية لـ ')!} target="_blank" rel="noopener noreferrer">{Brand.wa()} اسأل على واتساب</a></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'studio', label: 'الاستوديو', title: n.b.name, lead: x.story, image: work[2]?.url || n.hero || undefined,
      body: owner || n.reviews.length ? (
        <>
          {owner ? (
            <section className="p-sec"><div className="n-w p-owner">
              <div className="p-owner-pic" data-r>{owner.photo ? <img src={owner.photo} alt={owner.name} /> : <span aria-hidden="true"><Images size={40} /></span>}</div>
              <div data-r>
                <small>{owner.role || 'المصوّر'}</small>
                <h2 className="p-h2">{owner.name}</h2>
                {owner.tags?.length ? <ul className="p-tags">{owner.tags.map((t) => <li key={t}>{t}</li>)}</ul> : null}
                {owner.quote ? <blockquote>«{owner.quote}»{owner.quote_by ? <cite>{owner.quote_by}، على Google</cite> : null}</blockquote> : null}
              </div>
            </div></section>
          ) : null}
          {n.members.length > 1 ? <section className="p-sec p-alt"><div className="n-w"><Head title="الفريق" /><ul className="p-team">{n.members.slice(1).map((m) => <li key={m.name} data-r><b>{m.name}</b>{m.role ? <span>{m.role}</span> : null}</li>)}</ul></div></section> : null}
          {n.reviews.length ? <section className="p-sec"><div className="n-w"><Head title="قالوا عنا" /><Reviews n={n} max={6} /></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'book', label: 'احجز جلستك', title: 'احجز جلستك', lead: 'اختر الجلسة والوقت. نؤكّد لك على واتساب.',
      body: (
        <>
          <section className="p-sec p-tight"><div className="n-w p-bookw">
            <div className="p-card" data-r><Book n={n} options={packs.map((p) => p.name)} place="الاستوديو" label="أرسل الطلب" /></div>
            <aside className="p-side" data-r>
              <MapCard n={n} address={content.footer.address} />
              {n.st ? <p className="p-today"><Clock size={16} /> {todayLine(n)}</p> : null}
              {n.hours.length ? <Hours n={n} /> : null}
            </aside>
          </div></section>
          {n.faq.length ? <section className="p-sec p-alt"><div className="n-w p-faqw"><Head title="أسئلة" /><Faq items={n.faq} /></div></section> : null}
        </>
      ),
    },
  ]

  return (
    <Shell
      n={n} content={content} root="pf" pages={pages} initial={initial} view={view} onViewChange={onViewChange}
      style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Noto Sans Arabic", sans-serif', ['--n-body' as string]: '"Noto Sans Arabic", sans-serif' } as CSSProperties}
      fonts="family=Noto+Sans+Arabic:wght@200;300;400;500;700;800"
      css={KIT_CSS + BLOCKS_CSS + CSS}
      cta={{ label: 'احجز جلستك', page: 'book' }}
      close={{ title: 'صورتك القادمة تبدأ هنا', text: x.delivery?.[0] ? `${x.delivery[0].what}: ${x.delivery[0].when}.` : undefined, image: work[work.length - 1]?.url || n.hero || undefined }}
    />
  )
}

/** Kinds on the home page open the work page already filtered. */
function HomeKinds({ work, setTag }: { work: Work[]; setTag: (t: string) => void }) {
  const go = useGo()
  if (new Set(work.map((w) => w.tag).filter(Boolean)).size < 2) return null
  return (
    <section className="p-sec p-alt"><div className="n-w">
      <Head title="ماذا نصوّر" />
      <Kinds work={work} onPick={(t) => { setTag(t); go('work') }} />
    </div></section>
  )
}

const CSS = `
.pf{--n-r-btn:999px;--n-r-in:10px;--n-r-card:8px;--s-strip-bg:var(--n-bg);--s-strip-ink:var(--n-mute);--s-foot-bg:#050506;--s-foot-ink:var(--n-ink);--s-menu-bg:#050506;--s-menu-ink:var(--n-ink)}
.pf .s-strip{border-bottom:1px solid var(--n-line)}
.pf .s-head{background:color-mix(in srgb,var(--n-bg) 86%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.pf .s-logo b{font-weight:300;font-size:24px;letter-spacing:.02em}
.pf .s-ph h1,.pf .s-close h2,.pf .b-head h2{font-weight:200;letter-spacing:-.01em}
.pf .s-menu-list button{font-weight:200}
.pf .s-word span{font-weight:200}
.pf .s-next b{font-weight:200}
.pf .p-big{min-height:54px;padding:0 26px;font-size:16px}
.p-sec{padding:112px 0}.p-tight{padding-top:56px}
.p-alt{background:var(--n-bg2)}
.p-h2{font-size:clamp(36px,5vw,72px);font-weight:200;line-height:1.05}
.p-lead{color:var(--n-ink2);margin:14px 0 22px;font-size:17px;max-width:40ch}
@media (max-width:760px){.p-sec{padding:72px 0}.p-tight{padding-top:36px}}

/* hero */
.p-hero{padding:56px 0 0}
.p-hero-top{display:grid;grid-template-columns:1.3fr .7fr;gap:40px;align-items:end;margin-bottom:40px}
.p-hero h1{display:grid;gap:6px}
.p-hero h1 span{font-size:clamp(64px,11vw,176px);font-weight:200;line-height:.95;letter-spacing:-.03em;animation:p-dev 1.6s cubic-bezier(.2,.8,.2,1) both}
@keyframes p-dev{from{opacity:0;filter:blur(18px);letter-spacing:.1em}}
.p-hero h1 small{justify-self:start;width:max-content;font-size:13px;font-weight:500;letter-spacing:.5em;text-transform:uppercase;color:var(--n-mute);animation:b-fade 1s .8s both}
.p-hero-side{display:grid;gap:22px;animation:b-fade 1s .6s both}
.p-hero-side p{font-size:17px;color:var(--n-ink2)}
.p-vf{position:relative;aspect-ratio:21/9;border-radius:6px;overflow:hidden;background:#000;animation:p-open 1.4s cubic-bezier(.7,0,.2,1) .3s both}
@keyframes p-open{from{clip-path:inset(48% 0 48% 0)}to{clip-path:inset(0)}}
.p-vf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity 1.2s ease,transform 4.5s linear}
.p-vf img.on{opacity:1;transform:scale(1)}
.p-vf::after{content:"";position:absolute;inset:auto 0 0;height:30%;background:linear-gradient(to top,rgba(0,0,0,.55),transparent);z-index:1;pointer-events:none}
.p-vf-c{position:absolute;width:34px;height:34px;border:2px solid rgba(255,255,255,.85);z-index:2}
.p-vf-c.tl{top:18px;left:18px;border-right:0;border-bottom:0}.p-vf-c.tr{top:18px;right:18px;border-left:0;border-bottom:0}
.p-vf-c.bl{bottom:18px;left:18px;border-right:0;border-top:0}.p-vf-c.br{bottom:18px;right:18px;border-left:0;border-top:0}
.p-vf-focus{position:absolute;top:50%;left:50%;width:70px;height:70px;translate:-50% -50%;border:1.5px solid rgba(255,255,255,.9);z-index:2;animation:p-focus 1s cubic-bezier(.3,1.4,.5,1) both}
@keyframes p-focus{0%{scale:1.8;opacity:0}60%{scale:.92;opacity:1}100%{scale:1;opacity:.5}}
.p-vf-bar{position:absolute;inset:auto 64px 22px;z-index:2;display:flex;justify-content:space-between;color:#fff;font:500 12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.p-vf-bar span{display:flex;align-items:center;gap:8px}
.p-vf-bar i{width:8px;height:8px;border-radius:50%;background:#e2483d;animation:g-blink 1.2s infinite}
@keyframes g-blink{50%{opacity:.25}}
@media (max-width:860px){.p-hero{padding-top:36px}.p-hero-top{grid-template-columns:1fr;gap:24px;margin-bottom:24px}.p-hero-side .n-row{width:100%}.p-hero-side .n-btn{flex:1}.p-vf{aspect-ratio:4/5}.p-vf-bar{inset:auto 52px 16px;font-size:11px}.p-vf-bar span:nth-child(2){display:none}.p-vf-c{width:24px;height:24px}}

/* kinds */
.p-kinds{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(240px,1fr);gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px}
.p-kinds::-webkit-scrollbar{display:none}
.p-kinds button{all:unset;cursor:pointer;position:relative;aspect-ratio:3/4;border-radius:8px;overflow:hidden;scroll-snap-align:start;isolation:isolate}
.p-kinds img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;filter:grayscale(1) brightness(.7);transition:filter .6s,transform 1s cubic-bezier(.2,.8,.2,1)}
.p-kinds button:hover img,.p-kinds button:focus-visible img{filter:none;transform:scale(1.06)}
.p-kinds button::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(0,0,0,.75),transparent 55%)}
.p-kinds span{position:absolute;bottom:20px;right:20px;display:grid;color:#fff}
.p-kinds b{font-size:30px;font-weight:300;line-height:1.1}
.p-kinds small{font-size:13px;opacity:.75}
.p-kinds svg{position:absolute;bottom:24px;left:20px;color:#fff;opacity:0;transform:translateX(10px);transition:opacity .3s,transform .4s cubic-bezier(.3,1.5,.5,1)}
.p-kinds button:hover svg{opacity:1;transform:none}
.p-kinds button:focus-visible{outline:2px solid var(--n-acc);outline-offset:3px}
@media (max-width:760px){.p-kinds{grid-auto-columns:62%;margin-inline:-16px;padding-inline:16px;scroll-padding-inline:16px}.p-kinds svg{opacity:1;transform:none}}

/* wall */
.p-filter{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:28px;border-bottom:1px solid var(--n-line)}
.p-filter button{all:unset;cursor:pointer;position:relative;padding:12px 16px;font-size:16px;color:var(--n-mute);transition:color .25s}
.p-filter button::after{content:"";position:absolute;inset:auto 16px -1px;height:2px;background:var(--n-ink);transform:scaleX(0);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.p-filter button.on{color:var(--n-ink)}.p-filter button.on::after{transform:none}
.p-filter sup{font-size:10px;margin-inline-start:4px;opacity:.6}
.p-filter button:focus-visible{outline:2px solid var(--n-acc)}
.p-wall{columns:3;column-gap:10px}
.p-wall.c1{columns:1}.p-wall.c2{columns:2}
.p-ph{all:unset;box-sizing:border-box;position:relative;display:block;width:100%;margin:0 0 10px;background:var(--n-bg2);border-radius:6px;overflow:hidden;cursor:zoom-in;break-inside:avoid}
.pf .p-ph img{width:100%;height:auto;filter:blur(14px) saturate(.3);transform:scale(1.04);transition:filter 1.1s ease,transform 1.2s cubic-bezier(.2,.8,.2,1)}
.pf .p-ph img.ok{filter:none;transform:none}
.p-ph:hover img.ok{transform:scale(1.03)}
.p-ph span{position:absolute;bottom:12px;right:12px;font-size:12px;padding:5px 11px;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;backdrop-filter:blur(6px);opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s}
.p-ph:hover span,.p-ph:focus-visible span{opacity:1;transform:none}
.p-ph:focus-visible{outline:2px solid var(--n-acc);outline-offset:2px}
::view-transition-group(*){animation-duration:.5s;animation-timing-function:cubic-bezier(.2,.8,.2,1)}
@media (max-width:760px){.p-wall{columns:2;column-gap:6px}.p-ph{margin-bottom:6px}.p-filter{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.p-filter button{white-space:nowrap}}

.p-man{font:300 clamp(28px,4vw,56px)/1.3 var(--n-disp);max-width:24ch}

/* price list */
.p-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--n-ink)}
.p-list>li{padding:28px 0;border-bottom:1px solid var(--n-line)}
.p-list-row{display:flex;align-items:baseline;gap:16px}
.p-list-row small{font-size:12px;color:var(--n-mute);font-variant-numeric:tabular-nums}
.p-list-row h3{font-size:clamp(24px,3vw,38px);font-weight:300}
.p-list-row i{flex:1;border-bottom:1px dotted color-mix(in srgb,var(--n-ink) 35%,transparent);transform:translateY(-6px);min-width:24px}
.p-list-row b{font-size:clamp(22px,2.6vw,32px);font-weight:500;white-space:nowrap}.p-list-row b.ask{font-size:16px;color:var(--n-mute)}
.p-list-row a{font-weight:500;border-bottom:1px solid currentColor;white-space:nowrap}
.p-list-sub{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:12px;padding-inline-start:30px}
.p-list-sub ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px;color:var(--n-ink2);font-size:15px}
.p-list-sub ul li::before{content:"·";margin-inline-end:8px;color:var(--n-mute)}
.p-list-sub>div{display:flex;align-items:center;gap:18px;flex:none;font-size:14px;color:var(--n-mute)}
.p-list-sub>div span{display:inline-flex;gap:6px;align-items:center}
.p-list-sub button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;border:1px solid var(--n-line);color:var(--n-ink);font-weight:500;transition:background .25s,color .25s}
.p-list-sub button:hover{background:var(--n-ink);color:var(--n-bg)}
@media (max-width:760px){.p-list-row{flex-wrap:wrap;gap:6px 12px}.p-list-row i{display:none}.p-list-row b,.p-list-row a{margin-inline-start:auto}.p-list-sub{flex-direction:column;align-items:stretch;padding-inline-start:0}.p-list-sub>div{justify-content:space-between}}

/* delivery */
.p-del{list-style:none;margin:0;padding:0;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;position:relative}
.p-del::before{content:"";position:absolute;top:7px;right:0;left:0;height:1px;background:var(--n-line)}
.p-del li{position:relative;display:grid;gap:8px;padding-inline-end:20px}
.p-del i{width:15px;height:15px;border-radius:50%;background:var(--n-bg);border:1px solid var(--n-ink);margin-bottom:14px;position:relative}
.p-del li.in i{animation:p-dot .6s cubic-bezier(.3,1.5,.5,1) calc(var(--d,0)*.12s + .2s) both}
@keyframes p-dot{50%{scale:1.6;background:var(--n-ink)}to{background:var(--n-ink)}}
.p-del b{font-size:clamp(24px,2.6vw,34px);font-weight:300;line-height:1.1}
.p-del span{color:var(--n-mute);font-size:15px}
@media (max-width:760px){.p-del{grid-auto-flow:row;gap:26px}.p-del::before{top:0;bottom:0;right:7px;left:auto;width:1px;height:auto}.p-del li{grid-template-columns:15px 1fr;column-gap:18px}.p-del i{grid-row:span 2;margin:8px 0 0}}

/* sizes */
.p-split{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px;align-items:center}
.p-sizes{--u:26px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.p-sizes figure{margin:0;display:grid;gap:14px;padding:22px;border-radius:8px;border:1px solid var(--n-line);background:var(--n-bg)}
.p-alt .p-sizes figure{background:var(--n-bg)}
.p-size-box{height:200px;display:grid;place-items:center;background:repeating-linear-gradient(0deg,transparent 0 calc(var(--u) - 1px),color-mix(in srgb,var(--n-ink) 6%,transparent) calc(var(--u) - 1px) var(--u)),repeating-linear-gradient(90deg,transparent 0 calc(var(--u) - 1px),color-mix(in srgb,var(--n-ink) 6%,transparent) calc(var(--u) - 1px) var(--u));border-radius:6px}
.p-size-ph{position:relative;display:grid;place-items:end center;background:#e9e7e2;color:#b9b5ac;border-radius:2px;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);overflow:visible;transition:transform .5s cubic-bezier(.3,1.4,.5,1)}
.p-sizes figure:hover .p-size-ph{transform:rotate(-3deg) scale(1.04)}
.p-size-ph svg{width:72%;height:auto}
.p-size-ph em{position:absolute;font:500 10px ui-monospace,monospace;font-style:normal;color:var(--n-mute);white-space:nowrap}
.p-size-ph em.w{top:-18px;left:50%;translate:-50% 0}
.p-size-ph em.h{left:-10px;top:50%;translate:-100% -50%}
.p-sizes figcaption{display:grid;gap:2px}
.p-sizes b{font-size:19px;font-weight:500}.p-sizes figcaption span{font-size:14px;color:var(--n-mute)}
@media (max-width:860px){.p-split{grid-template-columns:1fr;gap:28px}.p-sizes{--u:22px;grid-template-columns:1fr 1fr}.p-sizes figure:last-child:nth-child(odd){grid-column:span 2}.p-size-box{height:170px}.p-sizes figure{padding:14px}}

.p-notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.p-notes div{padding:26px;border-radius:8px;border:1px solid var(--n-line);display:grid;gap:10px}
.p-notes h3{font-size:22px;font-weight:500}.p-notes p{color:var(--n-ink2)}
.p-ask{display:grid;justify-items:center;text-align:center;gap:14px}
.p-ask h2{font-size:clamp(32px,4.4vw,60px);font-weight:200}.p-ask p{color:var(--n-ink2);margin-bottom:8px}

.p-owner{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px;align-items:center}
.p-owner-pic{aspect-ratio:4/5;border-radius:8px;overflow:hidden;background:var(--n-bg2);display:grid;place-items:center;color:var(--n-mute)}
.p-owner-pic img{width:100%;height:100%;object-fit:cover}
.p-owner small{font-size:13px;color:var(--n-mute)}
.p-tags{list-style:none;margin:18px 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.p-tags li{padding:6px 14px;border-radius:999px;border:1px solid var(--n-line);font-size:14px}
.p-owner blockquote{margin:0;font-size:clamp(20px,2.2vw,28px);font-weight:300;display:grid;gap:10px}
.p-owner cite{font-style:normal;font-size:13px;color:var(--n-mute)}
.p-team{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.p-team li{padding:22px;border-radius:8px;background:var(--n-bg);display:grid}
.p-team b{font-size:22px;font-weight:500}.p-team span{color:var(--n-mute);font-size:14px}
@media (max-width:860px){.p-owner{grid-template-columns:1fr;gap:28px}.p-owner-pic{aspect-ratio:16/10}}

.p-bookw{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:start}
.p-card{padding:32px;border-radius:8px;background:var(--n-bg2);border:1px solid var(--n-line)}
.p-card .n-chips button.on{background:var(--n-ink);color:var(--n-bg)}
.p-side{display:grid;gap:14px;position:sticky;top:calc(var(--s-head) + 20px)}
.p-today{display:flex;gap:8px;align-items:center;color:var(--n-ink2)}
.p-faqw{max-width:900px}
@media (max-width:860px){.p-bookw{grid-template-columns:1fr}.p-card{padding:20px}.p-side{position:static}}
`
