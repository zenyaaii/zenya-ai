'use client'

/**
 * Gym «الطاقة», the full theme. SAMPLE (2026-11-12), built on option A.
 *
 * Six pages: home, memberships, coaches, timetable, the club, book & visit.
 * Each section is made for a gym, not borrowed: the hero says which class is
 * on next, memberships light up under the finger, the timetable knows what is
 * on now, coaches are named with what a customer said about them.
 *
 * Every list can hold 0, 1 or many. A page with nothing to show is dropped
 * with its link; a section with nothing to show is not drawn.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowLeft, Check, Clock, Flame, Minus, Users, CalendarDays } from 'lucide-react'
import type { ServiceContent } from '@/utils/services/types'
import { DAYS_AR } from '@/utils/services/barber'
import { KIT_CSS, Book, Hours, ar, useNiche, vars, type Colors, type N, type NicheExtra } from './kit'
import { BLOCKS_CSS, CountUp, Faq, Head, Icon, Lightbox, MapCard, Reviews, ScrollWords, priceNum, useSpotlight } from './blocks'
import { Brand, GoLink, Shell, todayLine, useGo, type SPage } from './shell'

const LOOK = { background: '#0d0e0f', surface: '#161819', text: '#f2f2ef', muted: '#8e9295', accent: '#ff5b24', border: '#26292c' }

/* ---------- class times ---------- */
/** "6:00 ص" / "7:30 م" → minutes after midnight. */
function mins(t: string): number | null {
  const m = /(\d{1,2}):(\d{2})\s*(ص|م)?/.exec(t)
  if (!m) return null
  let h = Number(m[1]) % 12
  if (m[3] === 'م') h += 12
  return h * 60 + Number(m[2])
}
/** Saturday = 0 … Friday = 6, as the hours are stored. */
const weekday = (d: Date) => (d.getDay() + 1) % 7

type Cls = { time: string; name: string }
/** Today's classes with their state, worked out in the browser only. */
function useToday(classes: NonNullable<NicheExtra['classes']>) {
  const [now, setNow] = useState<{ day: number; m: number } | null>(null)
  useEffect(() => { const f = () => { const d = new Date(); setNow({ day: weekday(d), m: d.getHours() * 60 + d.getMinutes() }) }; f(); const t = setInterval(f, 60_000); return () => clearInterval(t) }, [])
  if (!now) return { day: null as number | null, list: [] as (Cls & { s: 'done' | 'now' | 'next' | 'later' })[], ahead: null as null | { day: number; items: Cls[] } }
  const items = classes.find((c) => c.day === now.day)?.items || []
  // The next day that has classes, for a day with none (or none left).
  let ahead: null | { day: number; items: Cls[] } = null
  for (let k = 1; k <= 7 && !ahead; k++) { const c = classes.find((x) => x.day === (now.day + k) % 7 && x.items.length); if (c) ahead = { day: c.day, items: c.items } }
  let nextGiven = false
  const list = items.map((it) => {
    const m = mins(it.time)
    let s: 'done' | 'now' | 'next' | 'later' = 'later'
    if (m !== null && now.m >= m + 60) s = 'done'
    else if (m !== null && now.m >= m) s = 'now'
    else if (!nextGiven) { s = 'next'; nextGiven = true }
    return { ...it, s }
  })
  return { day: now.day, list, ahead }
}

/* ---------- sections ---------- */

function Hero({ n, content, x }: { n: N; content: ServiceContent; x: NicheExtra }) {
  const go = useGo()
  const today = useToday(x.classes || [])
  const up = today.list.find((c) => c.s === 'now') || today.list.find((c) => c.s === 'next')
  const name = n.b.name.split(/\s+/).length <= 3 ? n.b.name : n.short
  const words = name.split(/\s+/)
  return (
    <section className="g-hero">
      {n.hero ? <img className="g-hero-img" src={n.hero} alt={`داخل ${n.b.name}`} /> : null}
      <div className="n-w g-hero-in">
        {n.b.latin ? <span className="g-hero-side" dir="ltr" aria-hidden="true">{n.b.latin}</span> : null}
        <h1 aria-label={name}>{words.map((w, i) => <span key={i} className="g-line"><span style={{ ['--i' as string]: i } as CSSProperties}>{w}</span></span>)}</h1>
        <div className="g-hero-row">
          {content.hero.subheadline || n.b.tagline ? <p>{content.hero.subheadline || n.b.tagline}</p> : null}
          <div className="n-row">
            <button type="button" className="n-btn g-big" onClick={() => go('book')}>احجز حصة تجربة<ArrowLeft size={18} /></button>
            {n.services.length ? <button type="button" className="n-btn ghost g-big" onClick={() => go('plans')}>الاشتراكات</button> : null}
          </div>
        </div>
        <div className="g-hero-facts">
          {n.rating ? <span><b>{n.rating.toFixed(1)}</b><small>{n.count ? `من ${ar(n.count)} تقييم` : 'على Google'}</small></span> : null}
          {n.st ? <span><b className={n.st.open ? 'ok' : 'no'}>{n.st.open ? 'مفتوح' : 'مغلق'}</b><small>{n.st.text}</small></span> : null}
          {n.members.length ? <span><b>{ar(n.members.length)}</b><small>{n.members.length > 2 ? 'مدربين' : n.members.length === 2 ? 'مدربان' : 'مدرب'}</small></span> : null}
          {up ? (
            <button type="button" className="g-next" onClick={() => go('timetable')}>
              <i className={up.s === 'now' ? 'live' : ''} />
              <span><small>{up.s === 'now' ? 'الآن في النادي' : 'الحصة التالية اليوم'}</small><b>{up.name} · {up.time}</b></span>
              <ArrowLeft size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function Ticker({ tags }: { tags: string[] }) {
  if (tags.length < 3) return null
  const row = [...tags, ...tags, ...tags, ...tags]
  return (
    <div className="g-tick" aria-label="ماذا نتدرّب">
      <div className="g-tick-t">{row.map((t, i) => <span key={i} aria-hidden={i >= tags.length}><Icon of={t} size={26} strokeWidth={2.2} />{t}</span>)}</div>
    </div>
  )
}

function Manifesto({ n, x, content }: { n: N; x: NicheExtra; content: ServiceContent }) {
  const text = x.story || content.story?.body || ''
  const years = x.since ? new Date().getFullYear() - x.since : 0
  const stats = [
    n.rating ? { v: <CountUp to={n.rating} dec={1} />, l: 'تقييمنا على Google' } : null,
    n.count ? { v: <CountUp to={n.count} />, l: 'تقييم كتبه أعضاؤنا' } : null,
    years > 0 ? { v: <CountUp to={years} />, l: years > 10 ? 'سنة ونحن هنا' : 'سنوات ونحن هنا' } : null,
    (x.classes || []).length ? { v: <CountUp to={(x.classes || []).reduce((a, c) => a + c.items.length, 0)} />, l: 'حصة كل أسبوع' } : null,
  ].filter(Boolean) as { v: React.ReactNode; l: string }[]
  if (!text && stats.length < 2) return null
  return (
    <section className="g-sec g-man"><div className="n-w">
      {text ? <ScrollWords text={text} className="g-man-t" /> : null}
      {stats.length >= 2 ? <dl className={`g-stats c${stats.length}`}>{stats.map((s, i) => <div key={i} data-r style={{ ['--d' as string]: i } as CSSProperties}><dt>{s.l}</dt><dd>{s.v}</dd></div>)}</dl> : null}
    </div></section>
  )
}

/** What people train here. Rows with a photo that follows the pointer (a thumbnail on phones). */
function Programs({ n, x }: { n: N; x: NicheExtra }) {
  const go = useGo()
  const list = (x.offers || []).filter(Boolean)
  const [hover, setHover] = useState<number | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const pics = n.photos
  if (list.length < 2) return null
  return (
    <section className="g-sec"><div className="n-w">
      <Head title="ماذا نتدرّب" sub="اختر ما يناسب هدفك. الجدول فيه وقت كل حصة." more={(x.classes || []).length ? <GoLink to="timetable">جدول الحصص<ArrowLeft size={16} /></GoLink> : null} />
      <ol className="g-prog" onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }) }} onPointerLeave={() => setHover(null)}>
        {list.map((t, i) => (
          <li key={t} data-r style={{ ['--d' as string]: i } as CSSProperties} onPointerEnter={() => setHover(i)}>
            <button type="button" onClick={() => go((x.classes || []).length ? 'timetable' : 'book')}>
              <small>{String(i + 1).padStart(2, '0')}</small>
              <Icon of={t} size={30} strokeWidth={1.8} />
              <b>{t}</b>
              {pics.length ? <img className="g-prog-th" src={pics[i % pics.length]} alt="" loading="lazy" /> : null}
              <ArrowLeft className="g-prog-ar" size={26} />
            </button>
          </li>
        ))}
        {pics.length ? <img className={`g-prog-float${hover !== null ? ' on' : ''}`} src={pics[(hover ?? 0) % pics.length]} alt="" style={{ transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) rotate(${hover !== null ? -4 : 0}deg)` }} /> : null}
      </ol>
    </div></section>
  )
}

/** Membership tiles. The middle one stands taller; a light follows the pointer. */
function Plans({ n, x, full }: { n: N; x: NicheExtra; full?: boolean }) {
  const go = useGo()
  const spot = useSpotlight<HTMLDivElement>()
  const plans = n.services
  if (!plans.length) return null
  const hot = plans.findIndex((p) => /الأكثر|الأفضل/.test(p.description || p.badge || ''))
  const mid = hot >= 0 ? hot : plans.length >= 3 ? 1 : -1
  return (
    <div ref={spot} className={`g-plans c${Math.min(plans.length, 4)}`}>
      {plans.map((p, i) => {
        const pr = priceNum(p.price_from)
        const perks = x.perks?.[p.name] || []
        return (
          <article key={p.name} className={i === mid ? 'hot' : ''} data-spot data-r style={{ ['--d' as string]: i } as CSSProperties}>
            {i === mid ? <span className="g-badge"><Flame size={14} /> {p.badge || 'الأكثر طلبًا'}</span> : null}
            <h3>{p.name}</h3>
            {pr ? <div className="g-price"><b><CountUp to={pr.num} /></b><span>{pr.unit}{p.duration ? <small>/ {p.duration}</small> : null}</span></div> : <div className="g-price ask"><b>اسأل عن السعر</b>{p.duration ? <small>{p.duration}</small> : null}</div>}
            {p.description && i !== mid ? <p>{p.description}</p> : null}
            {perks.length ? <ul>{perks.slice(0, full ? 8 : 4).map((k) => <li key={k}><Check size={16} strokeWidth={2.6} />{k}</li>)}</ul> : null}
            {pr || !n.wa
              ? <button type="button" className={`n-btn${i === mid ? '' : ' ghost'}`} onClick={() => go('book')}>{i === mid ? 'ابدأ بهذا الاشتراك' : 'اختر'}</button>
              : <a className="n-btn ghost" href={n.waLink(`مرحبًا، كم سعر ${p.name}؟`)!} target="_blank" rel="noopener noreferrer">{Brand.wa(16)} اسأل على واتساب</a>}
          </article>
        )
      })}
    </div>
  )
}

/** Today in the club: each class with done / on now / next. With none today, the next day that has some. */
function TodayBoard({ x }: { x: NicheExtra }) {
  const t = useToday(x.classes || [])
  if (!(x.classes || []).length) return null
  const left = t.list.some((c) => c.s !== 'done')
  const show = left ? t.list : (t.ahead?.items || []).map((c) => ({ ...c, s: 'later' as const }))
  const when = left || t.day === null ? (t.day !== null ? `اليوم، ${DAYS_AR[t.day]}` : 'اليوم') : t.ahead ? ((t.ahead.day - t.day + 7) % 7 === 1 ? `غدًا، ${DAYS_AR[t.ahead.day]}` : DAYS_AR[t.ahead.day]) : ''
  return (
    <section className="g-sec g-alt"><div className="n-w g-today">
      <div data-r>
        <span className="g-k"><CalendarDays size={16} /> {when}</span>
        <h2>{left ? 'اليوم في النادي' : 'الحصص القادمة'}</h2>
        <p>{left ? 'كل الحصص مع مدرب، والمكان محدود. احجز مكانك قبل أن يمتلئ.' : 'انتهت حصص اليوم، والصالة مفتوحة للتمرين الحر. هذه الحصص التالية.'}</p>
        <GoLink to="timetable">جدول الأسبوع كاملًا<ArrowLeft size={16} /></GoLink>
      </div>
      {show.length ? (
        <ol className="g-board">
          {show.map((c, i) => (
            <li key={i} className={c.s} data-r style={{ ['--d' as string]: i } as CSSProperties}>
              <b dir="rtl">{c.time}</b><span><Icon of={c.name} size={18} />{c.name}</span>
              <em>{c.s === 'done' ? 'انتهت' : c.s === 'now' ? 'الآن' : c.s === 'next' ? 'التالية' : left ? 'لاحقًا' : 'احجز'}</em>
            </li>
          ))}
        </ol>
      ) : null}
    </div></section>
  )
}

function Coaches({ n, limit }: { n: N; limit?: number }) {
  const list = limit ? n.members.slice(0, limit) : n.members
  if (!list.length) return null
  return (
    <div className={`g-coach c${Math.min(list.length, 3)}`}>
      {list.map((m, i) => (
        <article key={m.name} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          <div className="g-coach-pic">
            {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span aria-hidden="true">{m.name.slice(0, 1)}</span>}
            {m.role ? <em>{m.role}</em> : null}
          </div>
          <h3>{m.name}</h3>
          {m.tags?.length ? <ul>{m.tags.map((t) => <li key={t}><Icon of={t} size={14} />{t}</li>)}</ul> : null}
          {m.quote ? <blockquote>«{m.quote}»{m.quote_by ? <cite>{m.quote_by}، على Google</cite> : null}</blockquote> : null}
        </article>
      ))}
    </div>
  )
}

/** Columns for n tiles: whole rows where possible. */
const cols = (k: number) => (k <= 4 ? k : k % 4 === 0 ? 4 : k % 3 === 0 ? 3 : 4)

function Facilities({ list }: { list: string[] }) {
  if (!list.length) return null
  return (
    <ul className="g-fac" style={{ ['--c' as string]: cols(list.length) } as CSSProperties}>
      {list.map((f, i) => <li key={f} data-r style={{ ['--d' as string]: i, ...(i === list.length - 1 ? { ['--span' as string]: cols(list.length) - ((list.length - 1) % cols(list.length)) } : {}) } as CSSProperties}><Icon of={f} size={28} strokeWidth={1.7} /><span>{f}</span></li>)}
    </ul>
  )
}

/** Photos in a bento that opens a viewer. */
function Gallery({ n, urls }: { n: N; urls: string[] }) {
  const [at, setAt] = useState<number | null>(null)
  if (urls.length < 2) return null
  return (
    <>
      <div className={`g-gal c${Math.min(urls.length, 6)}`}>
        {urls.slice(0, 6).map((u, i) => <button key={u} type="button" onClick={() => setAt(i)} data-r style={{ ['--d' as string]: i } as CSSProperties} aria-label={`افتح الصورة ${i + 1}`}><img src={u} alt={`${n.short} ${i + 1}`} loading="lazy" /></button>)}
      </div>
      <Lightbox urls={urls.slice(0, 6)} at={at} onClose={() => setAt(null)} alt={n.short} />
    </>
  )
}

/** The week: columns of days on a laptop, one day at a time on a phone. A class name filter lights its slots. */
function Week({ x }: { x: NicheExtra }) {
  const classes = (x.classes || []).filter((c) => c.items.length)
  const names = Array.from(new Set(classes.flatMap((c) => c.items.map((i) => i.name))))
  const [only, setOnly] = useState<string | null>(null)
  const t = useToday(classes)
  const [day, setDay] = useState<number | null>(null)
  const shown = day ?? (classes.some((c) => c.day === t.day) ? t.day : classes[0]?.day) ?? 0
  if (!classes.length) return null
  return (
    <div className="g-week">
      {names.length > 1 ? (
        <div className="g-filter" data-r>
          <span>اعرض:</span>
          <div className="n-chips">
            <button type="button" className={only === null ? 'on' : ''} onClick={() => setOnly(null)}>الكل</button>
            {names.map((nm) => <button key={nm} type="button" className={only === nm ? 'on' : ''} onClick={() => setOnly(only === nm ? null : nm)}>{nm}</button>)}
          </div>
        </div>
      ) : null}
      <div className="g-days n-chips" role="tablist" aria-label="أيام الأسبوع">
        {classes.map((c) => <button key={c.day} type="button" role="tab" aria-selected={shown === c.day} className={shown === c.day ? 'on' : ''} onClick={() => setDay(c.day)}>{DAYS_AR[c.day]}{c.day === t.day ? ' (اليوم)' : ''}</button>)}
      </div>
      <div className="g-grid" style={{ ['--c' as string]: classes.length } as CSSProperties}>
        {classes.map((c, ci) => (
          <div key={c.day} className={`g-col${shown === c.day ? ' shown' : ''}${c.day === t.day ? ' today' : ''}`} data-r style={{ ['--d' as string]: ci } as CSSProperties}>
            <h3>{DAYS_AR[c.day]}{c.day === t.day ? <em>اليوم</em> : null}</h3>
            {c.items.map((it, i) => (
              <div key={i} className={`g-slot${only && only !== it.name ? ' dim' : ''}${only === it.name ? ' lit' : ''}`}>
                <b>{it.time}</b><span><Icon of={it.name} size={16} />{it.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Membership side by side: what each one has. */
function Compare({ n, x }: { n: N; x: NicheExtra }) {
  const plans = n.services
  const perks = Array.from(new Set(plans.flatMap((p) => x.perks?.[p.name] || [])))
  if (plans.length < 2 || perks.length < 2) return null
  return (
    <div className="g-cmp" data-r>
      <table>
        <thead><tr><th scope="col"><span className="sr">الميزة</span></th>{plans.map((p) => <th key={p.name} scope="col">{p.name}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">السعر</th>{plans.map((p) => <td key={p.name}><b>{p.price_from || 'اسأل'}</b></td>)}</tr>
          {plans.some((p) => p.duration) ? <tr><th scope="row">المدة</th>{plans.map((p) => <td key={p.name}>{p.duration || '·'}</td>)}</tr> : null}
          {perks.map((k) => <tr key={k}><th scope="row">{k}</th>{plans.map((p) => <td key={p.name}>{(x.perks?.[p.name] || []).includes(k) ? <Check size={18} strokeWidth={2.6} className="y" aria-label="نعم" /> : <Minus size={16} className="no" aria-label="لا" />}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}

function Steps({ steps }: { steps: { title: string; text: string }[] }) {
  if (steps.length < 2) return null
  return (
    <ol className="g-steps">
      {steps.map((s, i) => <li key={i} data-r style={{ ['--d' as string]: i } as CSSProperties}><span>{ar(i + 1)}</span><h3>{s.title}</h3><p>{s.text}</p></li>)}
    </ol>
  )
}

/* ---------- the theme ---------- */

export default function GymFull({ content, x = {}, colors, initial, view, onViewChange }: { content: ServiceContent; x?: NicheExtra; colors?: Colors; initial?: string; view?: string; onViewChange?: (id: string) => void }) {
  const n = useNiche(content)
  const tags = useMemo(() => Array.from(new Set([...(x.offers || []), ...n.members.flatMap((m) => m.tags || [])])), [x.offers, n.members])
  const classes = (x.classes || []).filter((c) => c.items.length)
  const terms = (content.terms || []).filter((t) => t.text.trim())
  const steps = x.steps || []
  const facilities = x.facilities || []
  const busy = content.booking?.busy
  const pics = n.photos

  const home = (
    <>
      <Hero n={n} content={content} x={x} />
      <Ticker tags={tags} />
      <Manifesto n={n} x={x} content={content} />
      <Programs n={n} x={x} />
      {n.services.length ? (
        <section className="g-sec g-alt"><div className="n-w">
          <Head title="الاشتراكات" sub={terms.length ? 'السعر مكتوب، والشروط واضحة قبل أن تدفع.' : undefined} more={<GoLink to="plans">قارن الاشتراكات<ArrowLeft size={16} /></GoLink>} />
          <Plans n={n} x={x} />
        </div></section>
      ) : null}
      <TodayBoard x={x} />
      {n.members.length ? (
        <section className="g-sec"><div className="n-w">
          <Head title="المدربون" sub="تدرّب مع مدرب تعرفه بالاسم." more={n.members.length > 3 ? <GoLink to="coaches">كل المدربين<ArrowLeft size={16} /></GoLink> : null} />
          <Coaches n={n} limit={3} />
        </div></section>
      ) : null}
      {n.reviews.length ? <section className="g-sec g-alt"><div className="n-w"><Head title="ماذا يقول الأعضاء" /><Reviews n={n} max={5} /></div></section> : null}
      {facilities.length ? <section className="g-sec"><div className="n-w"><Head title="في النادي" more={<GoLink to="club">جولة في النادي<ArrowLeft size={16} /></GoLink>} /><Facilities list={facilities} /></div></section> : null}
      {n.faq.length ? <section className="g-sec g-alt"><div className="n-w g-faqw"><Head title="أسئلة قبل أن تبدأ" /><Faq items={n.faq.slice(0, 4)} /></div></section> : null}
    </>
  )

  const pages: SPage[] = [
    { id: 'home', label: 'الرئيسية', body: home },
    {
      id: 'plans', label: 'الاشتراكات', title: 'الاشتراكات', lead: 'كل الأسعار هنا، بلا رسوم مخفية. اختر، واحجز أول حصة مجانًا.',
      body: n.services.length ? (
        <>
          <section className="g-sec"><div className="n-w"><Plans n={n} x={x} full /></div></section>
          <section className="g-sec g-alt"><div className="n-w">
            <Compare n={n} x={x} />
            {terms.length ? <><Head title="الشروط بوضوح" className="g-mt" /><dl className="g-terms">{terms.map((t, i) => <div key={t.label} data-r style={{ ['--d' as string]: i } as CSSProperties}><dt>{t.label}</dt><dd>{t.text}</dd></div>)}</dl></> : null}
          </div></section>
          {steps.length >= 2 ? <section className="g-sec"><div className="n-w"><Head title="كيف تبدأ" /><Steps steps={steps} /></div></section> : null}
        </>
      ) : null,
    },
    {
      id: 'coaches', label: 'المدربون', title: 'المدربون', lead: 'اطلب مدربك بالاسم عند الحجز.',
      body: n.members.length ? (
        <>
          <section className="g-sec"><div className="n-w"><Coaches n={n} /></div></section>
          {n.wa ? (
            <section className="g-sec g-alt"><div className="n-w g-ask">
              <Users size={34} />
              <h2 data-r>تريد مدربًا خاصًا؟</h2>
              <p data-r>اكتب لنا هدفك، ونقترح عليك المدرب المناسب.</p>
              <a className="n-btn g-big" href={n.waLink('مرحبًا، أريد مدربًا خاصًا. هدفي: ')!} target="_blank" rel="noopener noreferrer">{Brand.wa()} اكتب هدفك على واتساب</a>
            </div></section>
          ) : null}
        </>
      ) : null,
    },
    {
      id: 'timetable', label: 'جدول الحصص', title: 'جدول الحصص', lead: busy ? `أكثر وقت زحمة: ${busy}. إن أردت صالة أهدأ، تعال قبله.` : 'كل الحصص مع مدرب. اختر اليوم، أو اعرض نوعًا واحدًا.',
      body: classes.length ? <section className="g-sec"><div className="n-w"><Week x={x} /></div></section> : null,
    },
    {
      id: 'club', label: 'النادي', title: `جولة في ${n.short}`, lead: x.story || undefined, image: pics[1] || undefined,
      body: facilities.length || pics.length >= 2 ? (
        <>
          {facilities.length ? <section className="g-sec"><div className="n-w"><Head title="ما تجده عندنا" /><Facilities list={facilities} /></div></section> : null}
          {pics.length >= 2 ? <section className="g-sec g-alt"><div className="n-w"><Head title="من داخل النادي" /><Gallery n={n} urls={pics} /></div></section> : null}
          {n.hours.length ? (
            <section className="g-sec"><div className="n-w g-two">
              <div data-r><h2 className="g-h2">الدوام</h2>{busy ? <p className="g-busy"><Clock size={16} /> أكثر وقت زحمة: {busy}</p> : null}</div>
              <div data-r><Hours n={n} /></div>
            </div></section>
          ) : null}
        </>
      ) : null,
    },
    {
      id: 'book', label: 'احجز وزُرنا', title: 'احجز حصة تجربة', lead: 'اختر اليوم والوقت، ويؤكّد لك النادي على واتساب.',
      body: (
        <>
          <section className="g-sec"><div className="n-w g-bookw">
            <div className="g-card" data-r><Book n={n} options={[...(n.services.length ? ['حصة تجربة'] : []), ...n.services.map((s) => s.name)]} place="النادي" label="احجز الحصة" /></div>
            <aside className="g-side" data-r>
              <ol className="g-after">
                <li><b>{ar(1)}</b><span>ترسل الطلب من هنا.</span></li>
                <li><b>{ar(2)}</b><span>يؤكّد لك النادي الموعد على واتساب.</span></li>
                <li><b>{ar(3)}</b><span>تأتي بملابس رياضة، والباقي علينا.</span></li>
              </ol>
              <MapCard n={n} address={content.footer.address} />
              {n.st ? <p className="g-busy"><Clock size={16} /> {todayLine(n)}</p> : null}
            </aside>
          </div></section>
          {n.faq.length ? <section className="g-sec"><div className="n-w g-faqw"><Head title="أسئلة" /><Faq items={n.faq} /></div></section> : null}
        </>
      ),
    },
  ]

  return (
    <Shell
      n={n} content={content} root="gf" pages={pages} initial={initial} view={view} onViewChange={onViewChange}
      style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Changa", sans-serif', ['--n-body' as string]: '"Readex Pro", sans-serif' } as CSSProperties}
      fonts="family=Changa:wght@500;700;800&family=Readex+Pro:wght@400;500;600"
      css={KIT_CSS + BLOCKS_CSS + CSS}
      cta={{ label: 'احجز حصة تجربة', page: 'book' }}
      close={{ title: 'أول حصة علينا', text: n.members.length ? `تعال، وتعرّف على ${n.members[0].name} وبقية المدربين قبل أن تشترك.` : 'تعال وجرّب قبل أن تشترك.', image: pics[2] || n.hero || undefined }}
      strip={busy ? [`الزحمة ${busy}`] : undefined}
    />
  )
}

const CSS = `
.gf{--n-r-btn:6px;--n-r-in:6px;--n-r-card:10px;--s-strip-bg:var(--n-acc);--s-strip-ink:var(--n-on);--s-foot-bg:#060707;--s-foot-ink:var(--n-ink);--s-menu-bg:var(--n-acc);--s-menu-ink:var(--n-on)}
.gf .s-head{background:color-mix(in srgb,var(--n-bg) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.gf .s-logo b{text-transform:uppercase;letter-spacing:-.01em;font-size:24px}
.gf .s-menu .n-btn{background:var(--n-on);color:var(--n-acc)}
.gf .s-menu-list button.on{color:var(--n-on);text-decoration:underline;text-underline-offset:8px;text-decoration-thickness:3px}
.gf .s-ph h1{text-transform:uppercase}
.gf .s-ph:not(.img){background:radial-gradient(ellipse 60% 120% at 0% 0%,color-mix(in srgb,var(--n-acc) 22%,transparent),transparent 60%)}
.gf .s-close h2{text-transform:uppercase}
.gf .n-btn{font-weight:700;letter-spacing:.01em}
.gf .g-big{min-height:56px;padding:0 28px;font-size:16px}
.g-sec{padding:120px 0}
.g-alt{background:var(--n-bg2)}
.g-mt{margin-top:72px}
.g-h2{font-size:clamp(34px,4.6vw,60px);font-weight:800;line-height:1}
.g-k{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--n-acc);margin-bottom:14px}
@media (max-width:760px){.g-sec{padding:72px 0}}

/* hero */
.g-hero{position:relative;min-height:calc(100svh - var(--s-strip) - var(--s-head));display:flex;align-items:flex-end;overflow:hidden;isolation:isolate}
.g-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;filter:grayscale(.4) contrast(1.08);animation:g-zoom 2s cubic-bezier(.2,.8,.2,1) both}
@keyframes g-zoom{from{transform:scale(1.18)}}
.g-hero::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,var(--n-bg) 2%,color-mix(in srgb,var(--n-bg) 60%,transparent) 42%,color-mix(in srgb,var(--n-bg) 10%,transparent) 80%),linear-gradient(to left,color-mix(in srgb,var(--n-bg) 50%,transparent),transparent 60%)}
.g-hero-in{position:relative;padding:60px 0 32px;display:grid;gap:26px}
.g-hero-side{position:absolute;left:0;top:56px;writing-mode:vertical-rl;transform:rotate(180deg);font:700 13px var(--n-body);letter-spacing:.4em;color:var(--n-mute);animation:b-fade 1s .9s both}
.g-hero h1{font-size:clamp(76px,15.5vw,236px);font-weight:800;line-height:.86;letter-spacing:-.025em}
.g-line{display:block;overflow:hidden;padding-bottom:.24em;margin-bottom:-.2em}
.g-line>span{display:block;animation:g-up 1s cubic-bezier(.2,.9,.1,1) both;animation-delay:calc(.15s + var(--i)*.12s)}
.g-line:last-child>span{color:var(--n-acc)}
@keyframes g-up{from{transform:translateY(108%) skewY(4deg)}}
.g-hero-row{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;animation:b-fade .9s .55s both}
.g-hero-row p{font-size:clamp(17px,1.6vw,20px);color:var(--n-ink2);max-width:42ch}
.g-hero-facts{display:flex;gap:12px 40px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--n-line);padding-top:20px;animation:b-fade .9s .75s both}
.g-hero-facts>span{display:grid;line-height:1.15}
.g-hero-facts b{font:800 30px var(--n-disp)}.g-hero-facts b.ok{color:#5bd68e}.g-hero-facts b.no{color:#ff8a73}
.g-hero-facts small{font-size:13px;color:var(--n-mute)}
.g-next{all:unset;cursor:pointer;margin-inline-start:auto;display:flex;align-items:center;gap:14px;padding:12px 18px;border-radius:8px;background:color-mix(in srgb,var(--n-ink) 8%,transparent);border:1px solid var(--n-line);backdrop-filter:blur(10px);transition:background .25s,transform .3s cubic-bezier(.3,1.5,.5,1)}
.g-next:hover{background:color-mix(in srgb,var(--n-acc) 20%,transparent);transform:translateY(-3px)}
.g-next i{width:10px;height:10px;border-radius:50%;background:var(--n-acc)}
.g-next i.live{animation:s-ping 1.6s infinite;background:#3fcf7a}
.g-next span{display:grid;line-height:1.3}.g-next small{font-size:12px;color:var(--n-mute)}.g-next b{font-size:15px}
@media (max-width:760px){.g-hero-side{display:none}.g-hero-row .n-row{width:100%}.g-hero-row .n-btn{flex:1}.g-hero-facts{gap:12px 26px}.g-next{margin-inline-start:0;width:100%;box-sizing:border-box}.g-next svg{margin-inline-start:auto}}

/* ticker */
.g-tick{background:var(--n-acc);color:var(--n-on);padding:18px 0;transform:rotate(-1.6deg) scale(1.03);margin:28px 0 0;overflow:hidden;box-shadow:0 20px 50px -30px var(--n-acc)}
.g-tick-t{display:flex;width:max-content;animation:g-mq 40s linear infinite}
.g-tick span{display:inline-flex;align-items:center;gap:14px;font:800 clamp(26px,3.4vw,40px) var(--n-disp);white-space:nowrap;padding-inline-end:44px}
@keyframes g-mq{to{transform:translateX(25%)}}

/* manifesto */
.g-man-t{font:700 clamp(30px,4.4vw,64px)/1.18 var(--n-disp);max-width:22ch;letter-spacing:-.01em}
.g-stats{display:grid;grid-template-columns:repeat(4,1fr);margin:84px 0 0;border-top:1px solid var(--n-line)}
.g-stats.c2{grid-template-columns:1fr 1fr}.g-stats.c3{grid-template-columns:repeat(3,1fr)}
.g-stats div{padding:26px 0 0;display:flex;flex-direction:column-reverse;gap:6px;border-inline-start:1px solid var(--n-line);padding-inline-start:22px}
.g-stats div:first-child{border-inline-start:0;padding-inline-start:0}
.g-stats dd{margin:0;font:800 clamp(56px,7vw,104px)/.9 var(--n-disp);letter-spacing:-.03em}
.g-stats div:first-child dd{color:var(--n-acc)}
.g-stats dt{font-size:14px;color:var(--n-mute)}
@media (max-width:760px){.g-stats,.g-stats.c3{grid-template-columns:1fr 1fr;row-gap:28px}.g-stats div:nth-child(3){border-inline-start:0;padding-inline-start:0}.g-stats.c3 div:nth-child(3){grid-column:1/-1}}

/* programs */
.g-prog{list-style:none;margin:0;padding:0;position:relative;border-top:1px solid var(--n-line)}
.g-prog li{border-bottom:1px solid var(--n-line)}
.g-prog button{all:unset;cursor:pointer;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:22px;padding:26px 6px;position:relative;z-index:1;transition:padding .45s cubic-bezier(.2,.8,.2,1),color .3s}
.g-prog small{font:600 13px var(--n-body);color:var(--n-mute);width:28px}
.g-prog button>svg:first-of-type{color:var(--n-acc);flex:none}
.g-prog b{font:800 clamp(34px,5.4vw,78px)/1 var(--n-disp);letter-spacing:-.01em}
.g-prog-ar{margin-inline-start:auto;opacity:.3;transition:transform .45s cubic-bezier(.3,1.5,.5,1),opacity .3s}
.gf .g-prog-th{display:none}
.g-prog li:hover button{padding-inline-start:22px;color:var(--n-acc)}
.g-prog li:hover .g-prog-ar{opacity:1;transform:translateX(-12px)}
.g-prog-float{position:absolute;top:0;left:0;width:300px;aspect-ratio:4/5;object-fit:cover;border-radius:8px;pointer-events:none;z-index:0;opacity:0;scale:.6;transition:opacity .35s,scale .45s cubic-bezier(.3,1.4,.5,1),transform .25s cubic-bezier(.2,.8,.2,1);box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}
.g-prog-float.on{opacity:1;scale:1}
@media (hover:none),(max-width:760px){.gf .g-prog-float{display:none}.gf .g-prog-th{display:block;width:64px;height:64px;object-fit:cover;border-radius:6px;margin-inline-start:auto;filter:grayscale(.5)}.g-prog-ar{display:none}.g-prog button{gap:14px;padding:18px 0}.g-prog button>svg:first-of-type{display:none}.g-prog b{font-size:clamp(28px,8vw,40px)}}

/* plans */
.g-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:stretch}
.g-plans.c1{grid-template-columns:minmax(0,520px)}.g-plans.c2{grid-template-columns:1fr 1fr}.g-plans.c4{grid-template-columns:repeat(4,1fr)}
.g-plans article{--mx:50%;--my:0;position:relative;overflow:hidden;padding:30px 26px;border-radius:var(--n-r-card);background:var(--n-bg);border:1px solid var(--n-line);display:flex;flex-direction:column;gap:14px;transition:transform .45s cubic-bezier(.3,1.4,.5,1),border-color .3s}
.g-plans article::before{content:"";position:absolute;inset:0;background:radial-gradient(360px circle at var(--mx) var(--my),color-mix(in srgb,var(--n-acc) 22%,transparent),transparent 60%);opacity:0;transition:opacity .4s;pointer-events:none}
.g-plans article:hover::before{opacity:1}
.g-plans article:hover{transform:translateY(-8px);border-color:color-mix(in srgb,var(--n-acc) 50%,var(--n-line))}
.g-plans article.hot{background:var(--n-acc);color:var(--n-on);border-color:transparent;transform:translateY(-16px);box-shadow:0 40px 80px -40px var(--n-acc)}
.g-plans article.hot:hover{transform:translateY(-22px)}
.g-plans article.hot::before{background:radial-gradient(360px circle at var(--mx) var(--my),rgba(255,255,255,.25),transparent 60%)}
.g-plans article>*{position:relative}
.g-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:4px;background:var(--n-on);color:var(--n-acc);font-size:12px;font-weight:700}
.g-plans h3{font:700 24px var(--n-disp)}
.g-price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;padding:14px 0;border-block:1px solid color-mix(in srgb,currentColor 16%,transparent)}
.g-price b{font:800 clamp(56px,6vw,84px)/.9 var(--n-disp);letter-spacing:-.03em}
.g-price span{font-weight:600;display:grid;line-height:1.2}.g-price small{font-size:13px;font-weight:400;opacity:.7}
.g-price.ask{display:grid}.g-price.ask b{font-size:28px;line-height:1.2}
.g-plans p{font-size:14px;opacity:.8}
.g-plans ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:15px}
.g-plans li{display:flex;gap:10px;align-items:flex-start}.g-plans li svg{flex:none;margin-top:4px;color:var(--n-acc)}
.g-plans .hot li svg{color:inherit}
.g-plans .n-btn{margin-top:auto}
.g-plans .hot .n-btn{background:var(--n-on);color:var(--n-acc)}
.g-plans .hot .n-btn.ghost{background:transparent;color:inherit;border-color:color-mix(in srgb,currentColor 35%,transparent)}
@media (max-width:900px){.g-plans,.g-plans.c2,.g-plans.c4{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:84%;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin-inline:-16px;padding:22px 16px 18px;scroll-padding-inline:16px}.g-plans.c1{grid-auto-columns:100%}.g-plans::-webkit-scrollbar{display:none}.g-plans article{scroll-snap-align:start}.g-plans article.hot{order:-1;transform:none}.g-plans article.hot:hover,.g-plans article:hover{transform:none}}

/* today board */
.g-today{display:grid;grid-template-columns:.9fr 1.1fr;gap:56px;align-items:start}
.g-today h2{font-size:clamp(40px,5.6vw,80px);font-weight:800;line-height:1;margin-bottom:16px}
.g-today p{color:var(--n-ink2);margin-bottom:24px;max-width:40ch}
.g-board{list-style:none;margin:0;padding:0;border-radius:var(--n-r-card);overflow:hidden;border:1px solid var(--n-line);background:var(--n-bg)}
.g-board li{display:grid;grid-template-columns:110px 1fr auto;gap:16px;align-items:center;padding:22px 24px;border-bottom:1px solid var(--n-line);transition:background .3s}
.g-board li:last-child{border-bottom:0}
.g-board b{font:800 24px var(--n-disp);font-variant-numeric:tabular-nums}
.g-board span{font-size:19px;font-weight:600;display:flex;align-items:center;gap:10px}.g-board span svg{color:var(--n-acc)}.g-board li.now span svg{color:inherit}
.g-board em{font-style:normal;font-size:12px;font-weight:700;padding:5px 10px;border-radius:4px;border:1px solid var(--n-line);color:var(--n-mute)}
.g-board li.done{opacity:.45}.g-board li.done span{text-decoration:line-through}
.g-board li.now{background:var(--n-acc);color:var(--n-on)}.g-board li.now em{border-color:currentColor;color:inherit;animation:g-blink 1.4s infinite}
.g-board li.next em{background:var(--n-ink);color:var(--n-bg);border-color:transparent}
@keyframes g-blink{50%{opacity:.4}}
@media (max-width:860px){.g-today{grid-template-columns:1fr;gap:32px}.g-board li{grid-template-columns:84px 1fr auto;padding:18px 16px}.g-board b{font-size:20px}.g-board span{font-size:16px}}

/* coaches */
.g-coach{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.g-coach.c1{grid-template-columns:minmax(0,420px)}.g-coach.c2{grid-template-columns:1fr 1fr}
.g-coach article{display:grid;gap:12px;align-content:start}
.g-coach-pic{position:relative;aspect-ratio:4/5;border-radius:var(--n-r-card);overflow:hidden;background:var(--n-bg2);display:grid;place-items:center}
.g-alt .g-coach-pic{background:var(--n-bg)}
.g-coach-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1);transition:filter .5s,transform .8s cubic-bezier(.2,.8,.2,1)}
.g-coach article:hover .g-coach-pic img{filter:none;transform:scale(1.05)}
.g-coach-pic>span{font:800 clamp(160px,20vw,280px)/1 var(--n-disp);color:color-mix(in srgb,var(--n-acc) 16%,transparent);transition:transform .7s cubic-bezier(.3,1.4,.5,1),color .5s}
.g-coach article:hover .g-coach-pic>span{transform:scale(1.08) rotate(-4deg);color:var(--n-acc)}
.g-coach-pic::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(-45deg,transparent 0 14px,color-mix(in srgb,var(--n-ink) 4%,transparent) 14px 15px)}
.g-coach-pic em{position:absolute;bottom:14px;right:14px;font-style:normal;font-size:12px;font-weight:700;padding:6px 10px;border-radius:4px;background:var(--n-acc);color:var(--n-on)}
.g-coach h3{font:800 34px/1 var(--n-disp);margin-top:6px}
.g-coach ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.g-coach li{display:inline-flex;align-items:center;gap:6px;font-size:13px;padding:5px 10px;border-radius:4px;border:1px solid var(--n-line)}
.g-coach blockquote{margin:4px 0 0;font-size:15px;color:var(--n-ink2);display:grid;gap:6px;padding-inline-start:14px;border-inline-start:2px solid var(--n-acc)}
.g-coach cite{font-style:normal;font-size:12px;color:var(--n-mute)}
@media (max-width:860px){.g-coach,.g-coach.c2{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:78%;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:10px;scrollbar-width:none}.g-coach article{scroll-snap-align:start}.g-coach-pic>span{font-size:180px}}
.g-ask{display:grid;justify-items:center;text-align:center;gap:16px}
.g-ask>svg{color:var(--n-acc)}
.g-ask h2{font-size:clamp(36px,5vw,68px);font-weight:800;line-height:1}
.g-ask p{color:var(--n-ink2);margin-bottom:8px}

/* facilities */
.g-fac{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--c),1fr);gap:1px;background:var(--n-line);border:1px solid var(--n-line);border-radius:var(--n-r-card);overflow:hidden}
.g-fac li{grid-column:span var(--span,1);background:var(--n-bg);padding:30px 24px;display:grid;gap:22px;transition:background .3s}
.g-alt .g-fac li{background:var(--n-bg2)}
.g-fac li:hover{background:var(--n-acc);color:var(--n-on)}
.g-fac svg{color:var(--n-acc);transition:color .3s,transform .5s cubic-bezier(.3,1.5,.5,1)}
.g-fac li:hover svg{color:inherit;transform:scale(1.15) rotate(-6deg)}
.g-fac span{font:700 20px var(--n-disp)}
@media (max-width:760px){.g-fac{grid-template-columns:1fr 1fr}.g-fac li{grid-column:auto;padding:22px 18px;gap:16px}.g-fac li:last-child:nth-child(odd){grid-column:span 2}.g-fac span{font-size:17px}}

/* gallery */
.g-gal{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:220px;gap:10px}
.g-gal button{all:unset;cursor:zoom-in;overflow:hidden;border-radius:var(--n-r-card)}
.g-gal button:nth-child(1){grid-column:span 2;grid-row:span 2}
.g-gal.c6 button:nth-child(4){grid-column:span 2}
.g-gal img{width:100%;height:100%;object-fit:cover;filter:grayscale(.7);transition:filter .5s,transform .9s cubic-bezier(.2,.8,.2,1)}
.g-gal button:hover img{filter:none;transform:scale(1.06)}
.g-gal button:focus-visible{outline:2px solid var(--n-acc);outline-offset:3px}
@media (max-width:760px){.g-gal{grid-template-columns:1fr 1fr;grid-auto-rows:150px}.g-gal.c6 button:nth-child(4){grid-column:auto}}

/* week */
.g-filter{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:28px}
.g-filter>span{font-size:14px;color:var(--n-mute)}
.g-filter .n-chips{margin:0}
.g-filter .n-chips button.on,.g-days button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.g-days{display:none}
.g-grid{display:grid;grid-template-columns:repeat(var(--c),1fr);gap:10px}
.g-col{display:grid;gap:8px;align-content:start}
.g-col h3{font:700 18px var(--n-disp);padding:12px 14px;border-radius:6px;background:var(--n-bg2);display:flex;justify-content:space-between;align-items:center}
.g-col.today h3{background:var(--n-acc);color:var(--n-on)}
.g-col h3 em{font-style:normal;font-size:11px;font-weight:700;padding:3px 8px;border-radius:3px;background:var(--n-on);color:var(--n-acc)}
.g-slot{padding:16px 14px;border-radius:6px;border:1px solid var(--n-line);display:grid;gap:6px;transition:opacity .35s,transform .35s cubic-bezier(.3,1.5,.5,1),border-color .3s,background .3s}
.g-slot b{font:800 22px var(--n-disp);font-variant-numeric:tabular-nums}
.g-slot span{display:flex;gap:6px;align-items:center;font-size:15px;color:var(--n-ink2)}
.g-slot span svg{color:var(--n-acc)}
.g-slot.dim{opacity:.2}
.g-slot.lit{border-color:var(--n-acc);background:var(--n-acc-soft);transform:scale(1.03)}
@media (max-width:860px){.g-days{display:flex;margin:0 0 18px}.g-grid{grid-template-columns:1fr}.g-col{display:none}.g-col.shown{display:grid;animation:s-in .4s both}.g-col h3{display:none}.g-slot{grid-template-columns:100px 1fr;align-items:center;padding:20px 16px}}

/* compare, terms, steps */
.g-cmp{overflow-x:auto;border:1px solid var(--n-line);border-radius:var(--n-r-card);background:var(--n-bg)}
.g-cmp table{width:100%;border-collapse:collapse;min-width:560px;font-size:15px}
.g-cmp th,.g-cmp td{padding:16px 18px;border-bottom:1px solid var(--n-line);text-align:center}
.g-cmp tbody th{text-align:start;font-weight:500;color:var(--n-ink2)}
.g-cmp thead th{font:700 17px var(--n-disp);background:var(--n-bg2)}
.g-cmp tr:last-child>*{border-bottom:0}
.g-cmp .y{color:var(--n-acc)}.g-cmp .no{opacity:.3}
.g-cmp tbody tr{transition:background .2s}.g-cmp tbody tr:hover{background:var(--n-acc-soft)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.g-terms{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.g-terms div{padding:24px;border-radius:var(--n-r-card);background:var(--n-bg);border-top:3px solid var(--n-acc);display:grid;gap:8px}
.g-terms dt{font:700 20px var(--n-disp)}.g-terms dd{margin:0;color:var(--n-ink2)}
.g-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px;counter-reset:s}
.g-steps li{display:grid;gap:12px;padding-top:24px;border-top:1px solid var(--n-line);position:relative}
.g-steps li::before{content:"";position:absolute;top:-1px;right:0;height:3px;width:0;background:var(--n-acc);transition:width 1s cubic-bezier(.2,.8,.2,1) .3s}
.g-steps li.in::before{width:60px}
.g-steps span{font:800 64px/1 var(--n-disp);color:var(--n-acc)}
.g-steps h3{font:700 24px var(--n-disp)}
.g-steps p{color:var(--n-ink2)}

/* booking, visit */
.g-bookw{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:start}
.g-card{padding:32px;border-radius:var(--n-r-card);background:var(--n-bg2);border:1px solid var(--n-line)}
.g-card .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.g-side{display:grid;gap:14px;position:sticky;top:calc(var(--s-head) + 20px)}
.g-busy{display:flex;align-items:center;gap:8px;color:var(--n-ink2);font-size:15px;margin-top:12px}
.g-after{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:2px;counter-reset:a}
.g-after li{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:8px;background:var(--n-bg2)}
.g-after b{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--n-acc);color:var(--n-on);font:800 16px var(--n-disp)}
.g-two{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px}
.g-faqw{max-width:900px}
@media (max-width:860px){.g-bookw,.g-two{grid-template-columns:1fr;gap:28px}.g-card{padding:20px}.g-side{position:static}}
`
