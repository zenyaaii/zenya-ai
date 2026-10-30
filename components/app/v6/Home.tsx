'use client'

/**
 * HOME, as the v6 design draws it (VIEWS.home in the design file): the
 * greeting with its two chips, the traffic card, today's bookings, the site
 * card with the phone, quick actions, and the three small cards for the
 * address, Google and reviews. A draft site gets the design's draft home.
 *
 * Every number is the account's own; the page (app/(app)/dashboard/page.tsx)
 * loads them. Two things the design does not have stay because the owner
 * asked for them: the «ابدأ من هنا» card and the edit-site tour stop.
 */

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { TMetric, TRange, TrafficData } from '@/components/dashboard/screens/traffic'
import {
  AreaChart, DAYS, DayNav, Ic, MONTHS, Odo, Seg, Stars, agoName, dayFull, dayNote, deltaTxt, fmt,
  greet, people, rangeLabel, reduceMotion, useV6,
} from './ui'

/** doc: a full page load (an API route that redirects, like Google's sign-in). */
export type Act = { href?: string; onSelect?: () => void; external?: boolean; doc?: boolean }

export type V6Booking = {
  id: string
  time: string
  name: string
  people: number | null
  status: 'new' | 'ok' | 'done'
  hasNote: boolean
}

export type V6Site = {
  id: string
  name: string
  live: boolean
  /** Address without https:// */
  host: string | null
  url: string | null
  /** «26 أكتوبر» */
  updated: string
  kind: string
  cover: string | null
  edit: Act
  preview: Act
}

export type V6Start = { edited: boolean; domain: 'live' | 'pending' | null; shared: boolean }
export type StartStep = 'edit' | 'share' | 'hide'

export type HomeMetric = Extract<TMetric, 'views' | 'visitors' | 'events'>

export type V6HomeProps = {
  name: string
  site: V6Site | null
  /** null: the account has no bookings (plan or draft). */
  newBookings: number | null
  /** Distinct visitors over the last 7 days; null while loading. */
  visitors7: number | null
  traffic: TrafficData | null
  metric: HomeMetric
  onMetric: (m: HomeMetric) => void
  range: TRange
  onRange: (r: TRange) => void
  day: number
  onDay: (d: number) => void
  /** null: no bookings on this plan or site. */
  today: { list: V6Booking[]; tomorrow: V6Booking[]; week: number } | null
  domain: { host: string; own: boolean; live: boolean } | null
  google: 'connect' | { clicks: number; position: number; query?: string } | null
  reviews: { rating: number; count: number; fresh: number } | 'add' | null
  start: V6Start | null
  onStart?: (s: StartStep) => void
  launch: { label: string; done: boolean }[]
  links: {
    bookings: Act
    analyticsDay1: Act
    analyticsSearch: Act
    gallery: Act
    seo: Act
    domains: Act
    reviews: Act
    newSite: Act
    publish: Act
  }
}

const HM: Record<HomeMetric, [string, string]> = { views: ['الزيارات', 'زيارة'], visitors: ['الزوار', 'زائر'], events: ['التواصل', 'تواصل'] }
const ST: Record<V6Booking['status'], [string, string]> = { new: ['جديد', 'solid-acc'], ok: ['مؤكّد', 'solid-ok'], done: ['منجز', ''] }
const personWord = (v: number) => (v === 1 ? 'شخص' : v === 2 ? 'شخصان' : v <= 10 ? 'أشخاص' : 'شخصًا')
const weekWord = (n: number) => (n === 1 ? 'حجز' : n === 2 ? 'حجزان' : n <= 10 ? 'حجوزات' : 'حجزًا')

/** A link, a button or an outside address, with the design's classes. */
export function A({ to, className, children, ...rest }: { to?: Act; className?: string; children: ReactNode } & Record<string, unknown>) {
  if (to?.href && to.external) return <a href={to.href} target="_blank" rel="noopener noreferrer" className={className} onClick={to.onSelect} {...rest}>{children}</a>
  if (to?.href && to.doc) return <a href={to.href} className={className} onClick={to.onSelect} {...rest}>{children}</a>
  if (to?.href) return <Link href={to.href} className={className} onClick={to.onSelect} {...rest}>{children}</Link>
  return <button type="button" className={className} onClick={to?.onSelect} {...rest}>{children}</button>
}

function useNow() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t) }, [])
  return now
}

export default function V6Home(p: V6HomeProps) {
  const now = useNow()
  if (!p.site) return <FirstSite p={p} now={now} />
  if (!p.site.live) return <DraftHome p={p} site={p.site} now={now} />
  return <LiveHome p={p} site={p.site} now={now} />
}

/* ---- the greeting ------------------------------------------------------------ */
function Hello({ p, now, date, say }: { p: V6HomeProps; now: Date | null; date?: string; say: ReactNode }) {
  return (
    <div className="hello">
      <div className="date rv">{date ?? (now ? `${DAYS[now.getDay()]}، ${now.getDate()} ${MONTHS[now.getMonth()]}` : ' ')}</div>
      <h1 className="t-display rv" style={{ ['--i' as string]: 1 }}>{now ? greet() : 'أهلًا'}، {p.name}</h1>
      <p className="say rv" style={{ ['--i' as string]: 2 }}>{say}</p>
    </div>
  )
}

function LiveHome({ p, site, now }: { p: V6HomeProps; site: V6Site; now: Date | null }) {
  const { toast, openSheet, closeSheet } = useV6()
  const n = p.newBookings || 0
  const vis = p.visitors7
  const visChip = (
    <A to={p.links.analyticsDay1} className="chip press"><i className="g"><Ic n="users" /></i><span className="num">{vis == null ? '…' : fmt(vis)}</span> {personWord(vis || 0)}</A>
  )
  const say = n
    ? <>لديك <A to={p.links.bookings} className="chip press"><i className="o num">{n}</i>{n === 1 ? 'حجز جديد' : n === 2 ? 'حجزان جديدان' : 'حجوزات جديدة'}</A> {n === 1 ? 'ينتظر' : 'تنتظر'} تأكيدك، وزار موقعك {visChip} في آخر 7 أيام.</>
    : <>لا حجوزات جديدة تنتظرك. زار موقعك {visChip} في آخر 7 أيام.</>

  const copy = () => {
    if (!site.url) return
    try { navigator.clipboard.writeText(site.url) } catch {}
    toast('تم نسخ رابط ' + site.name)
  }
  const share = () => {
    if (!site.url) return
    p.onStart?.('share')
    const url = site.url
    const wa = `https://wa.me/?text=${encodeURIComponent(`${site.name}\n${url}`)}`
    openSheet({
      title: 'شارك موقعك',
      body: (
        <>
          <div className="sitecard" style={{ gridTemplateColumns: 'minmax(0,1fr) 88px' }}>
            <div className="meta">
              <h3>{site.name}</h3>
              <span className="addr">{url.replace('https://', '')}</span>
              <span className="t-small">أرسل الرابط لزبائنك، أو ضعه في حساب إنستغرام.</span>
            </div>
            <Phone site={site} style={{ width: 88 }} />
          </div>
          <div className="rows" style={{ marginTop: 12 }}>
            <button className="r" onClick={() => { closeSheet(); copy() }}><span className="tile"><Ic n="copy" /></span><span className="tx"><b>انسخ الرابط</b><span className="ltr" style={{ textAlign: 'end' }}>{url}</span></span></button>
            <a className="r" href={wa} target="_blank" rel="noopener noreferrer" onClick={() => closeSheet()}><span className="tile ok"><Ic n="whatsapp" /></span><span className="tx"><b>أرسل على واتساب</b><span>يفتح واتساب برسالة جاهزة</span></span></a>
          </div>
        </>
      ),
    })
  }
  const edit: Act = { ...site.edit, onSelect: () => { site.edit.onSelect?.(); p.onStart?.('edit') } }

  return (
    <>
      <Hello p={p} now={now} say={say} />
      {p.start && <Start p={p} site={site} start={p.start} edit={edit} share={share} />}
      <div className="hgrid">
        <Traffic p={p} />
        <Today p={p} now={now} />
        <article className="card lift h-site rv" style={{ ['--i' as string]: 5 }}>
          <div className="sitecard">
            <div className="meta">
              <span className="live">منشور</span>
              <h3>{site.name}</h3>
              {site.host && <span className="addr">{site.host}</span>}
              <span className="t-small">آخر تعديل {site.updated}</span>
              <div className="btns">
                <A to={edit} className="btn k sm press" data-tour="edit-site"><Ic n="edit" />عدّل الموقع</A>
                {site.url && <button className="btn sm press" onClick={share}><Ic n="share" />شارك</button>}
              </div>
            </div>
            <Phone site={site} peek />
          </div>
        </article>
        <article className="card lift h-quick rv" style={{ ['--i' as string]: 6 }}>
          <div className="card-h"><h2 className="t-h2">إجراءات سريعة</h2></div>
          <div className="qgrid">
            <A to={p.links.bookings} className="q press"><span className="tile"><Ic n="plus" /></span><b>حجز جديد</b></A>
            <A to={p.links.gallery} className="q press"><span className="tile"><Ic n="upload" /></span><b>ارفع صورة</b></A>
            <button className="q press" onClick={copy}><span className="tile"><Ic n="copy" /></span><b>انسخ رابط الموقع</b></button>
            <A to={p.links.seo} className="q press"><span className="tile"><Ic n="g" /></span><b>ظهورك في جوجل</b></A>
          </div>
        </article>
        <A to={p.links.domains} className="card lift h-w wcard rv" style={{ ['--i' as string]: 7 }}>
          <div className="w-top"><span className="tile ok"><Ic n="lock" /></span><span className="pill ok"><Ic n="check" />آمن</span></div>
          <p>{p.domain?.own && p.domain.live ? 'نطاقك متصل، وشهادة الأمان تعمل.' : p.domain?.own ? 'نطاقك يُربط الآن، وقد يأخذ ذلك بعض الوقت. عنوانك المجاني يعمل حتى ذلك الحين.' : 'عنوانك المجاني يعمل، وشهادة الأمان تعمل. Pro يعطيك نطاقًا خاصًا مجانًا لسنة.'}</p>
          <div className="w-v"><b className="ltr" style={{ fontSize: p.domain?.own ? 18 : 14, fontWeight: 800, overflowWrap: 'anywhere' }}>{p.domain?.host || site.host}</b></div>
        </A>
        <GoogleCard p={p} />
        <ReviewsCard p={p} />
      </div>
    </>
  )
}

/* ---- «ابدأ من هنا» (kept at the owner's request; not in the design) ------------ */
function Start({ p, site, start, edit, share }: { p: V6HomeProps; site: V6Site; start: V6Start; edit: Act; share: () => void }) {
  const steps: { key: string; done: boolean; title: string; sub: string; act: ReactNode }[] = [
    {
      key: 'edit', done: start.edited, title: 'عدّل موقعك',
      sub: start.edited ? 'فتحت المحرّر.' : 'غيّر الصور والنصوص والأسعار لتناسب نشاطك.',
      act: <A to={edit} className="btn k sm press"><Ic n="edit" />عدّل</A>,
    },
    {
      key: 'domain', done: start.domain === 'live', title: 'اربط نطاقك',
      sub: start.domain === 'live' ? 'نطاقك متصل.' : start.domain === 'pending' ? 'نطاقك يُربط الآن، وقد يأخذ ذلك بعض الوقت.' : 'اسم خاص لموقعك، مثل myrestaurant.com.',
      act: start.domain === 'pending' ? <span className="pill warn">قيد الربط</span> : <A to={p.links.domains} className="btn sm press"><Ic n="globe" />اربط</A>,
    },
    {
      key: 'share', done: start.shared, title: 'شارك رابطك',
      sub: start.shared ? 'شاركت رابط موقعك.' : 'أرسله لزبائنك على واتساب، وضعه في حساباتك.',
      act: site.url ? <button className="btn sm press" onClick={share}><Ic n="share" />شارك</button> : null,
    },
  ]
  const done = steps.filter((x) => x.done).length
  if (done === steps.length) return null
  return (
    <article className="card rv" style={{ ['--i' as string]: 3, marginBottom: 16 }} aria-labelledby="startH">
      <div className="card-h">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <h2 className="t-h2" id="startH">ابدأ من هنا</h2>
          <span className="pill warn"><span className="num">{done}</span>&nbsp;من&nbsp;<span className="num">{steps.length}</span></span>
        </div>
        {p.onStart && <button className="link" onClick={() => p.onStart!('hide')}>أخفِ</button>}
      </div>
      <div className="rows">
        {steps.map((x, i) => (
          <div className="r" key={x.key}>
            <span className={`tile ${x.done ? 'ok' : ''}`}>{x.done ? <Ic n="check" /> : <b className="num">{i + 1}</b>}</span>
            <span className="tx"><b>{x.title}</b><span>{x.sub}</span></span>
            {!x.done && x.act && <span className="end">{x.act}</span>}
          </div>
        ))}
      </div>
    </article>
  )
}

/* ---- traffic -------------------------------------------------------------------- */
function Traffic({ p }: { p: V6HomeProps }) {
  const t = p.traffic
  const day = p.range === 'day'
  const v = t ? t.values[p.metric] : []
  const prev = t ? t.prev[p.metric] : null
  const [scrub, setScrub] = useState<ReactNode>(null)
  const [hover, setHover] = useState(false)
  useEffect(() => { setHover(window.matchMedia('(hover:hover)').matches) }, [])
  const hint = day
    ? (hover ? 'مرّر على الرسم لترى كل ساعة' : 'المس الرسم لترى كل ساعة')
    : (hover ? 'مرّر لترى كل يوم، واضغط على يوم لترى ساعاته' : 'المس الرسم لترى كل يوم، واضغط على يوم لترى ساعاته')
  const r = { '7d': '7 أيام', '30d': '30 يومًا', '90d': '90 يومًا' } as Record<string, string>

  // The metric pill slides under the chosen tab.
  const [mp, setMp] = useState<React.CSSProperties>({})
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!box) return
    const place = () => {
      const on = box.querySelector<HTMLElement>('.mtab[aria-pressed="true"]')
      if (!on || !box.offsetParent) return
      setMp({ width: on.offsetWidth, height: on.offsetHeight, transform: `translate(${on.offsetLeft}px,${on.offsetTop}px)` })
    }
    place()
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [box, p.metric, t])

  return (
    <article className="card lift h-stats rv" style={{ ['--i' as string]: 3 }}>
      <div className="statbar">
        <div className="mtabs" ref={setBox} role="group" aria-label="اختر الرقم">
          <span className="mp" aria-hidden style={mp} />
          {(Object.keys(HM) as HomeMetric[]).map((k) => {
            const x = t ? t.deltas[k] : null
            return (
              <button key={k} type="button" className="mtab" aria-pressed={k === p.metric} onClick={() => p.onMetric(k)}>
                <small>{HM[k][0]}</small>
                <b className="num">{t ? fmt(t.totals[k]) : '—'}</b>
                <em className={x != null && x < 0 ? 'dn' : ''}>{deltaTxt(x == null ? null : Math.round(x))}</em>
              </button>
            )
          })}
        </div>
        <Seg<TRange> items={[['day', 'يوم'], ['7d', '7 أيام'], ['30d', '30 يومًا'], ['90d', '90 يومًا']]} value={p.range} onChange={(v) => { if (v === 'day') p.onDay(0); p.onRange(v) }} label="المدة" />
      </div>
      <DayNav day={p.day} onDay={p.onDay} hidden={!day} />
      <div className="bigline">
        <div>
          <Odo value={t ? t.totals[p.metric] : 0} />
          <div className="lab">{day ? `${HM[p.metric][1]} ${dayNote(p.day)}` : `${HM[p.metric][1]} في آخر ${r[p.range]}`}</div>
        </div>
        <div className="scrub" aria-live="polite">{scrub ?? hint}</div>
      </div>
      <AreaChart
        values={v} prev={prev} slots={day ? 24 : v.length} pick={!day}
        onScrub={(i, val) => setScrub(<><b className="num">{fmt(val)}</b> {HM[p.metric][1]} · {rangeLabel(p.range, i, v.length)}</>)}
        onLeave={() => setScrub(null)}
        onPick={(i) => { if (day) return; p.onDay(v.length - 1 - i); p.onRange('day') }}
      />
      <div className="axis" hidden={!day}>
        {day && [0, 6, 12, 18, 23].map((h) => <span key={h} className="num">{`${String(h).padStart(2, '0')}:00`}</span>)}
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        <span><i /><span>{day ? agoName(p.day) : 'هذه المدة'}</span></span>
        <span><i className="p" /><span>{day ? 'نفس اليوم قبل أسبوع' : 'المدة السابقة'}</span></span>
      </div>
    </article>
  )
}

/* ---- today ------------------------------------------------------------------------ */
function Slot({ b, to }: { b: V6Booking; to: Act }) {
  return (
    <A to={to} className={`slot ${b.status}`}>
      <span className="t num">{b.time}</span>
      <span className="b">
        <b>{b.name}</b>
        <span>{people(b.people)}{b.hasNote ? ' · فيه ملاحظة' : ''}</span>
        <span className={`pill ${ST[b.status][1]}`}>{ST[b.status][0]}</span>
      </span>
    </A>
  )
}

function Today({ p, now }: { p: V6HomeProps; now: Date | null }) {
  const td = p.today
  const clock = now ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` : ''
  const list = td?.list || []
  const out: ReactNode[] = []
  let placed = false
  list.forEach((b) => {
    if (!placed && clock && b.time > clock) { out.push(<div key="now" className="nowline">الآن <span className="num">{clock}</span></div>); placed = true }
    out.push(<Slot key={b.id} b={b} to={p.links.bookings} />)
  })
  if (!placed && clock) out.push(<div key="now" className="nowline">الآن <span className="num">{clock}</span></div>)
  const body = list.length ? out : [<div key="e" className="empty" style={{ padding: '20px 8px' }}><Ic n="cal" /><span>{td ? 'لا حجوزات اليوم' : 'الحجوزات غير مفعّلة في باقتك'}</span></div>]
  const tmr = td?.tomorrow || []
  const wk = td?.week || 0
  return (
    <article className="card lift h-day rv" style={{ ['--i' as string]: 4 }} data-tour="bookings-card">
      <div className="card-h"><h2 className="t-h2">اليوم</h2><A to={p.links.bookings} className="link">كل الحجوزات <Ic n="arrow" /></A></div>
      <div className="day">
        {body}
        {tmr.length > 0 && <div className="day-sub">غدًا · {dayFull(1)}</div>}
        {tmr.map((b) => <Slot key={b.id} b={b} to={p.links.bookings} />)}
      </div>
      <div className="day-foot">
        <span>هذا الأسبوع: <b className="num">{wk}</b> {weekWord(wk)}</span>
        <A to={p.links.bookings} className="btn sm press"><Ic n="plus" />حجز</A>
      </div>
    </article>
  )
}

/* ---- the phone picture -------------------------------------------------------------- */
function Phone({ site, peek, style }: { site: V6Site; peek?: boolean; style?: React.CSSProperties }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!peek || reduceMotion()) return
    const a = setTimeout(() => setOn(true), 1400), b = setTimeout(() => setOn(false), 5600)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [peek])
  return site.cover
    ? <div className={`ph${on ? ' peek' : ''}`} style={style}><img src={site.cover} alt={`صورة موقع ${site.name} على الجوال`} /></div>
    : <div className="ph blank" style={style} aria-hidden><i /><i /><i /><i /><i /></div>
}

/* ---- the three small cards ------------------------------------------------------------ */
function GoogleCard({ p }: { p: V6HomeProps }) {
  const g = p.google
  if (g && g !== 'connect') {
    return (
      <A to={p.links.analyticsSearch} className="card lift h-w wcard rv" style={{ ['--i' as string]: 8 }}>
        <div className="w-top"><span className="tile blue"><Ic n="g" /></span><span className="pill ok"><Ic n="check" />مربوط</span></div>
        <p>{g.query ? <>ترتيبك في جوجل لكلمة «{g.query}»</> : 'متوسط ترتيبك في نتائج جوجل'}</p>
        <div className="w-v"><span className="t-big num">#{Math.max(1, Math.round(g.position))}</span><span className="t-small"><b className="num" style={{ color: 'var(--ink)' }}>{fmt(g.clicks)}</b> نقرة من جوجل</span></div>
      </A>
    )
  }
  return (
    <A to={p.links.analyticsSearch} className="card lift h-w wcard rv" style={{ ['--i' as string]: 8 }}>
      <div className="w-top"><span className="tile blue"><Ic n="g" /></span><span className="pill">غير مربوط</span></div>
      <p>اربط Google Search Console لترى كم مرة ظهر موقعك في جوجل، وبأي كلمات.</p>
      <div className="w-v"><span className="t-small"><b style={{ color: 'var(--ink)' }}>اربط الآن</b> · خطوة واحدة</span></div>
    </A>
  )
}

function ReviewsCard({ p }: { p: V6HomeProps }) {
  const r = p.reviews
  if (!r) return null
  if (r === 'add') {
    return (
      <A to={p.links.reviews} className="card lift h-w wcard rv" style={{ ['--i' as string]: 9 }}>
        <div className="w-top"><span className="tile warn"><Ic n="star" /></span></div>
        <p>اعرض تقييماتك من Google في موقعك. الصق رابط نشاطك على الخريطة ونجلبها لك.</p>
        <div className="w-v"><span className="t-small"><b style={{ color: 'var(--ink)' }}>أضف تقييماتك</b></span></div>
      </A>
    )
  }
  return (
    <A to={p.links.reviews} className="card lift h-w wcard rv" style={{ ['--i' as string]: 9 }}>
      <div className="w-top"><span className="tile warn"><Ic n="star" /></span>{r.fresh > 0 && <span className="pill acc">{r.fresh} جديد</span>}</div>
      <p>تقييمك على Google من <span className="num">{fmt(r.count)}</span> تقييمًا</p>
      <div className="w-v"><span className="t-big num">{r.rating}</span><Stars n={r.rating} lg /></div>
    </A>
  )
}

/* ---- a draft site (the design's homeDraft) ---------------------------------------------- */
function DraftHome({ p, site, now }: { p: V6HomeProps; site: V6Site; now: Date | null }) {
  const steps = p.launch
  const done = steps.filter((x) => x.done).length
  const next = steps.findIndex((x) => !x.done)
  return (
    <>
      <Hello p={p} now={now} date={`${site.name} · مسودة`} say={<>موقع «{site.name}» جاهز تقريبًا. انشره ليراه الناس ويبدأ الحجز.</>} />
      <div className="hgrid">
        <article className="card h-stats rv" style={{ ['--i' as string]: 3 }}>
          <div className="card-h"><h2 className="t-h2">خطة الإطلاق</h2><span className="pill warn">{done} من {steps.length}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div className="ring" style={{ ['--v' as string]: steps.length ? done / steps.length : 0 }}>
              <svg viewBox="0 0 56 56"><circle className="bg" cx="28" cy="28" r="22" /><circle className="fg" cx="28" cy="28" r="22" /></svg>
              <b className="num">{steps.length ? Math.round((done / steps.length) * 100) : 0}%</b>
            </div>
            <div className="pub-steps" style={{ flex: 1, minWidth: 220 }}>
              {steps.map((s, i) => <div key={s.label} className={`s ${s.done ? 'done' : i === next ? 'on' : ''}`}><i>{s.done ? <Ic n="check" /> : i + 1}</i>{s.label}</div>)}
            </div>
          </div>
          <div className="row-wrap" style={{ marginTop: 20 }}>
            <A to={p.links.publish} className="btn acc press"><Ic n="globe" />انشر الموقع الآن</A>
            <A to={site.edit} className="btn press"><Ic n="edit" />أكمل التعديل</A>
          </div>
        </article>
        <article className="card h-day h-after rv" style={{ ['--i' as string]: 4 }}>
          <div className="card-h"><h2 className="t-h2">بعد النشر</h2></div>
          <div className="rows">
            <div className="r"><span className="tile acc"><Ic n="cal" /></span><span className="tx"><b>الحجوزات</b><span>تصلك هنا فور أن يرسلها الزوار</span></span></div>
            <div className="r"><span className="tile blue"><Ic n="chart" /></span><span className="tx"><b>الزيارات</b><span>تعرف كم شخصًا زارك ومن أين</span></span></div>
            <div className="r"><span className="tile warn"><Ic n="star" /></span><span className="tx"><b>التقييمات</b><span>اعرض تقييمات Google في موقعك</span></span></div>
          </div>
        </article>
        <article className="card h-site rv" style={{ ['--i' as string]: 5 }}>
          <div className="sitecard">
            <div className="meta">
              <span className="pill warn" style={{ alignSelf: 'flex-start' }}>مسودة</span>
              <h3>{site.name}</h3>
              <span className="t-small">{site.kind} · آخر تعديل {site.updated}</span>
              <div className="btns">
                <A to={site.edit} className="btn k sm press" data-tour="edit-site"><Ic n="edit" />عدّل</A>
                <A to={site.preview} className="btn sm press"><Ic n="eye" />معاينة</A>
              </div>
            </div>
            <Phone site={site} />
          </div>
        </article>
        <article className="card h-quick rv" style={{ ['--i' as string]: 6 }}>
          <div className="card-h"><h2 className="t-h2">إجراءات سريعة</h2></div>
          <div className="qgrid">
            <A to={p.links.gallery} className="q press"><span className="tile"><Ic n="upload" /></span><b>ارفع صورة</b></A>
            <A to={p.links.seo} className="q press"><span className="tile"><Ic n="g" /></span><b>جهّز ظهورك في جوجل</b></A>
          </div>
        </article>
      </div>
    </>
  )
}

/* ---- no site yet ------------------------------------------------------------------------- */
function FirstSite({ p, now }: { p: V6HomeProps; now: Date | null }) {
  return (
    <>
      <Hello p={p} now={now} say="ابدأ بموقعك الأول. اختر نوع نشاطك، ونبنيه لك في دقائق." />
      <div className="card rv" style={{ ['--i' as string]: 3 }}>
        <div className="empty">
          <span className="tile"><Ic n="sites" /></span>
          <b>لا مواقع بعد</b>
          <span>اختر نوع نشاطك، ونبني لك الموقع في دقائق. يمكنك تغيير كل شيء بعدها.</span>
          <A to={p.links.newSite} className="btn k press" data-tour="new-site"><Ic n="plus" />موقع جديد</A>
        </div>
      </div>
    </>
  )
}

