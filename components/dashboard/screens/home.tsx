'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft, BarChart3, CalendarCheck, Check, Copy, ExternalLink, Eye, Globe, Lock, Pencil, Plus,
  Search, Share2, Star, Upload, Users,
} from 'lucide-react'
import { Act, Page, type Action } from './kit'
import { DAYS, MONTHS, dateAgo, dayFull, fmt } from './traffic'

/**
 * The home screen, as the 2026-10 design draws it: a greeting that says what
 * needs doing, the traffic card, today's bookings, the site itself, quick
 * actions and three small cards (domain, Google, reviews).
 *
 * It is about ONE site. Most owners have one; an owner with more picks which
 * one at the top. Every figure on it comes from the account: a card whose
 * number the account does not have yet says how to get it instead of showing
 * a made-up one.
 */

export type HomeBooking = {
  id: string
  /** "19:30", the visitor's chosen time. */
  time: string
  name: string
  people?: number | null
  status: 'new' | 'confirmed' | 'done'
  hasNote?: boolean
}

export type HomeSite = {
  id: string
  name: string
  live: boolean
  /** beynoun.com address or the owner's own domain, without https. */
  host: string | null
  /** The full public address, for share and copy. */
  url: string | null
  /** «آخر تعديل منذ يومين» */
  updated: string
  kind: string
  /** A picture from the site's own content (its hero), if it has one. */
  image?: string | null
  edit?: Action
  open?: Action
}

export type HomeWidgets = {
  domain?: { host: string; state: 'live' | 'pending' } | null
  google?: { clicks: number; position: number; query?: string } | 'connect' | null
  reviews?: { rating: number; count: number; fresh: number } | 'add' | null
}

export type HomeScreenProps = {
  name: string
  /** Every site of the owner, for the picker (shown only with two or more). */
  sites: Array<{ id: string; name: string }>
  site: HomeSite | null
  onSite?: (id: string) => void
  /** Bookings waiting for the owner; null when the site takes no bookings. */
  newBookings: number | null
  yesterdayVisitors: number | null
  /** The traffic card's body (TrafficCard), built by the page. */
  traffic: ReactNode
  /** Today's and tomorrow's bookings; null when the site takes no bookings. */
  today: { list: HomeBooking[]; tomorrow: HomeBooking[]; week: number } | null
  widgets: HomeWidgets
  launch: Array<{ label: string; done: boolean }>
  links: {
    bookings?: Action
    analytics?: Action
    gallery?: Action
    seo?: Action
    domains?: Action
    reviews?: Action
    newSite?: Action
    /** Where a draft gets published. */
    publish?: Action
  }
}

const greet = (h: number) => (h >= 4 && h < 12 ? 'صباح الخير' : 'مساء الخير')

const people = (n: number) =>
  n === 1 ? 'شخص واحد' : n === 2 ? 'شخصان' : n <= 10 ? `${n} أشخاص` : `${n} شخصًا`

const bookingsWord = (n: number) =>
  n === 1 ? ['حجز جديد', 'ينتظر'] : n === 2 ? ['حجزان جديدان', 'ينتظران'] : n <= 10 ? ['حجوزات جديدة', 'تنتظر'] : ['حجزًا جديدًا', 'ينتظر']

const weekWord = (n: number) => (n === 1 ? 'حجز' : n === 2 ? 'حجزان' : n <= 10 ? 'حجوزات' : 'حجزًا')

const STATUS: Record<HomeBooking['status'], [string, string]> = {
  new: ['جديد', 'solid-acc'],
  confirmed: ['مؤكّد', 'solid-ok'],
  done: ['منجز', ''],
}

export function HomeScreen(p: HomeScreenProps) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const s = p.site
  return (
    <Page>
      <Hello {...p} now={now} />

      {p.sites.length > 1 && s && p.onSite && (
        <div className="zb-sites zb-rv" style={{ ['--i' as string]: 2 }} role="group" aria-label="اختر الموقع">
          {p.sites.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === s.id} onClick={() => p.onSite!(x.id)}>{x.name}</button>
          ))}
        </div>
      )}

      {!s ? <FirstSite newSite={p.links.newSite} /> : s.live ? <LiveHome {...p} site={s} now={now} /> : <DraftHome {...p} site={s} />}
    </Page>
  )
}

function Hello({ name, site, newBookings, yesterdayVisitors, links, now }: HomeScreenProps & { now: Date | null }) {
  const vis = yesterdayVisitors
  const visChip = vis != null && vis > 0 && (
    <Act action={links.analytics} className="zb-chip">
      <i data-tone="ok"><Users strokeWidth={2.2} /></i>
      <span className="zb-num">{people(vis)}</span>
    </Act>
  )
  let say: ReactNode
  if (!site) say = 'ابدأ موقعك الأول، وهنا ترى زواره وحجوزاته.'
  else if (!site.live) say = <>موقع «{site.name}» جاهز تقريبًا. انشره ليراه الناس.</>
  else {
    // «زار موقعك [75 شخصًا] أمس.» — or nothing, when the number is not known.
    const visLine = vis == null ? null : vis > 0 ? <>زار موقعك {visChip} أمس.</> : <>لم يزر موقعك أحد أمس.</>
    if (newBookings && newBookings > 0) {
      const [word, wait] = bookingsWord(newBookings)
      say = (
        <>
          لديك{' '}
          <Act action={links.bookings} className="zb-chip"><i data-tone="acc" className="zb-num">{newBookings}</i>{word}</Act>
          {' '}{wait} تأكيدك{visLine ? <>، و{visLine}</> : '.'}
        </>
      )
    } else if (newBookings === 0) {
      say = <>لا حجوزات جديدة تنتظرك.{visLine && <> {visLine}</>}</>
    } else {
      say = visLine || <>موقع «{site.name}» منشور ويستقبل الزوار.</>
    }
  }
  return (
    <div className="zb-hello">
      <div className="zb-date zb-rv">{now ? `${DAYS[now.getDay()]}، ${now.getDate()} ${MONTHS[now.getMonth()]}` : ' '}</div>
      <h1 className="zb-display zb-rv" style={{ ['--i' as string]: 1 }}>{now ? greet(now.getHours()) : 'أهلًا'}، {name}</h1>
      <p className="zb-say zb-rv" style={{ ['--i' as string]: 2 }}>{say}</p>
    </div>
  )
}

/* ── a published site ──────────────────────────────────────────────────── */

function LiveHome({ site, traffic, today, widgets, links, now }: HomeScreenProps & { site: HomeSite; now: Date | null }) {
  return (
    <>
      <div className="zb-grid">
        <article className="zb-card zb-g-stats zb-rv" style={{ ['--i' as string]: 3 }} aria-label="الزيارات">
          {traffic}
        </article>
        <Today today={today} links={links} now={now} />
        <SiteCard site={site} />
        <Quick site={site} links={links} />
      </div>
      <div className="zb-widgets mt-4">
        <DomainWidget domain={widgets.domain} action={links.domains} />
        {widgets.google !== null && widgets.google !== undefined && <GoogleWidget google={widgets.google} links={links} />}
        {widgets.reviews !== null && widgets.reviews !== undefined && <ReviewsWidget reviews={widgets.reviews} action={links.reviews} />}
      </div>
    </>
  )
}

function Today({ today, links, now }: { today: HomeScreenProps['today']; links: HomeScreenProps['links']; now: Date | null }) {
  const clock = now ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` : null
  let rows: ReactNode[] = []
  if (today) {
    let placed = false
    today.list.forEach((b) => {
      if (clock && !placed && b.time > clock) {
        rows.push(<Now key="now" clock={clock} />)
        placed = true
      }
      rows.push(<Slot key={b.id} b={b} action={links.bookings} />)
    })
    if (clock && !placed && today.list.length) rows.push(<Now key="now" clock={clock} />)
    if (!today.list.length) {
      rows = [
        <div key="empty" className="zb-empty">
          <span className="zb-tile"><CalendarCheck strokeWidth={2} /></span>
          <span>لا حجوزات اليوم</span>
        </div>,
      ]
    }
    if (today.tomorrow.length) {
      rows.push(<div key="tmr" className="zb-day-sub">غدًا · {dayFull(dateAgo(-1))}</div>)
      today.tomorrow.forEach((b) => rows.push(<Slot key={b.id} b={b} action={links.bookings} />))
    }
  }
  return (
    <article className="zb-card zb-g-day zb-rv" data-first={today && (today.list.length || today.tomorrow.length) ? '' : undefined} style={{ ['--i' as string]: 4 }}>
      <div className="zb-card-h">
        <h2 className="zb-h2">اليوم</h2>
        <Act action={links.bookings} className="zb-link">كل الحجوزات <ArrowLeft strokeWidth={2.2} className="rtl-flip" /></Act>
      </div>
      {today ? (
        <>
          <div className="zb-day">{rows}</div>
          <div className="zb-day-foot">
            <span>هذا الأسبوع: <b className="zb-num" style={{ color: 'var(--obsidian)' }}>{today.week}</b> {weekWord(today.week)}</span>
          </div>
        </>
      ) : (
        <div className="zb-empty">
          <span className="zb-tile" data-tone="acc"><CalendarCheck strokeWidth={2} /></span>
          <span>شغّل الحجز في موقعك، وتظهر حجوزات اليوم هنا.</span>
          <Act action={links.bookings} className="zb-btn">الحجوزات</Act>
        </div>
      )}
    </article>
  )
}

function Now({ clock }: { clock: string }) {
  return <div className="zb-now">الآن <span className="zb-num">{clock}</span></div>
}

function Slot({ b, action }: { b: HomeBooking; action?: Action }) {
  const [label, tone] = STATUS[b.status]
  return (
    <Act action={action} className="zb-slot">
      <span className="zb-t zb-num" data-st={b.status}>{b.time}</span>
      <span className="zb-b" data-st={b.status}>
        <b>{b.name}</b>
        <span>{[b.people ? people(b.people) : '', b.hasNote ? 'فيه ملاحظة' : ''].filter(Boolean).join(' · ') || ' '}</span>
        <span className="zb-pill" data-tone={tone || undefined}>{label}</span>
      </span>
    </Act>
  )
}

function Phone({ site }: { site: HomeSite }) {
  return site.image ? (
    <div className="zb-ph">
      {/* An owner's own upload, from any host: next/image would need each one allow-listed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.image} alt={`صورة من موقع ${site.name}`} loading="lazy" />
    </div>
  ) : (
    <div className="zb-ph" data-blank="" aria-hidden="true"><i /><i /><i /><i /><i /></div>
  )
}

function useCopy() {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 2200)
    return () => clearTimeout(t)
  }, [done])
  return {
    done,
    copy: async (text: string) => {
      try { await navigator.clipboard.writeText(text); setDone(true) } catch { /* the address is on the card */ }
    },
  }
}

function SiteCard({ site }: { site: HomeSite }) {
  const { done, copy } = useCopy()
  const share = async () => {
    if (!site.url) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: site.name, url: site.url }); return } catch { return }
    }
    copy(site.url)
  }
  return (
    <article className="zb-card zb-g-site zb-rv" style={{ ['--i' as string]: 5 }}>
      <div className="zb-sitecard">
        <div className="zb-meta">
          <span className="zb-live">منشور</span>
          <h3>{site.name}</h3>
          {site.host && <span className="zb-addr">{site.host}</span>}
          <span className="zb-small">آخر تعديل {site.updated}</span>
          <div className="zb-btns">
            <Act action={site.edit} className="zb-btn zb-btn-ink"><Pencil strokeWidth={2} />عدّل الموقع</Act>
            {site.url && (
              <button type="button" className="zb-btn" onClick={share} aria-live="polite">
                {done ? <><Check strokeWidth={2.4} />نُسخ الرابط</> : <><Share2 strokeWidth={2} />شارك</>}
              </button>
            )}
          </div>
        </div>
        <Phone site={site} />
      </div>
    </article>
  )
}

function Quick({ site, links }: { site: HomeSite; links: HomeScreenProps['links'] }) {
  const { done, copy } = useCopy()
  return (
    <article className="zb-card zb-g-quick zb-rv" style={{ ['--i' as string]: 6 }}>
      <div className="zb-card-h"><h2 className="zb-h2">إجراءات سريعة</h2></div>
      <div className="zb-qgrid">
        <Act action={links.gallery} className="zb-q"><span className="zb-tile"><Upload strokeWidth={2} /></span><b>ارفع صورة</b></Act>
        {site.url && (
          <button type="button" className="zb-q" onClick={() => copy(site.url!)} aria-live="polite">
            <span className="zb-tile">{done ? <Check strokeWidth={2.4} /> : <Copy strokeWidth={2} />}</span>
            <b>{done ? 'نُسخ الرابط' : 'انسخ رابط الموقع'}</b>
          </button>
        )}
        <Act action={links.seo} className="zb-q"><span className="zb-tile"><Search strokeWidth={2} /></span><b>ظهورك في جوجل</b></Act>
        <Act action={site.open} className="zb-q"><span className="zb-tile"><ExternalLink strokeWidth={2} /></span><b>افتح موقعك</b></Act>
      </div>
    </article>
  )
}

function DomainWidget({ domain, action }: { domain: HomeWidgets['domain']; action?: Action }) {
  return (
    <Act action={action} className="zb-card zb-w zb-rv" style={{ ['--i' as string]: 7 }}>
      {domain ? (
        <>
          <div className="zb-w-top">
            <span className="zb-tile" data-tone={domain.state === 'live' ? 'ok' : 'warn'}><Lock strokeWidth={2} /></span>
            {domain.state === 'live'
              ? <span className="zb-pill" data-tone="ok"><Check strokeWidth={2.4} />آمن</span>
              : <span className="zb-pill" data-tone="warn">قيد الربط</span>}
          </div>
          <p>{domain.state === 'live' ? 'نطاقك متصل، وشهادة الأمان تعمل.' : 'نطاقك يُربط الآن. قد يأخذ ذلك بعض الوقت.'}</p>
          <div className="zb-w-v"><b className="zb-host">{domain.host}</b></div>
        </>
      ) : (
        <>
          <div className="zb-w-top"><span className="zb-tile"><Globe strokeWidth={2} /></span></div>
          <p>اربط اسمًا خاصًا لموقعك، مثل myrestaurant.com.</p>
          <div className="zb-w-v"><span className="zb-link">اربط نطاقًا <ArrowLeft strokeWidth={2.2} className="rtl-flip" /></span></div>
        </>
      )}
    </Act>
  )
}

function GoogleWidget({ google, links }: { google: Exclude<HomeWidgets['google'], null | undefined>; links: HomeScreenProps['links'] }) {
  if (google === 'connect') {
    return (
      <Act action={links.seo} className="zb-card zb-w zb-rv" style={{ ['--i' as string]: 8 }}>
        <div className="zb-w-top"><span className="zb-tile" data-tone="blue"><Search strokeWidth={2} /></span></div>
        <p>اربط Google Search Console لترى كم مرة ظهر موقعك في بحث جوجل.</p>
        <div className="zb-w-v"><span className="zb-link">اربطه الآن <ArrowLeft strokeWidth={2.2} className="rtl-flip" /></span></div>
      </Act>
    )
  }
  const pos = Math.max(1, Math.round(google.position * 10) / 10)
  return (
    <Act action={links.analytics} className="zb-card zb-w zb-rv" style={{ ['--i' as string]: 8 }}>
      <div className="zb-w-top">
        <span className="zb-tile" data-tone="blue"><Search strokeWidth={2} /></span>
        <span className="zb-small">آخر 28 يومًا</span>
      </div>
      <p>{google.query ? <>ترتيبك في جوجل لكلمة «{google.query}»</> : 'متوسط ترتيبك في نتائج جوجل'}</p>
      <div className="zb-w-v">
        <span className="zb-big">#{google.query ? Math.max(1, Math.round(google.position)) : pos}</span>
        <span className="zb-small"><b className="zb-num" style={{ color: 'var(--obsidian)' }}>{fmt(google.clicks)}</b> نقرة من جوجل</span>
      </div>
    </Act>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span className="zb-stars" role="img" aria-label={`${n} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" data-f={i <= Math.round(n) ? '' : undefined}>
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  )
}

function ReviewsWidget({ reviews, action }: { reviews: Exclude<HomeWidgets['reviews'], null | undefined>; action?: Action }) {
  if (reviews === 'add') {
    return (
      <Act action={action} className="zb-card zb-w zb-rv" style={{ ['--i' as string]: 9 }}>
        <div className="zb-w-top"><span className="zb-tile" data-tone="warn"><Star strokeWidth={2} /></span></div>
        <p>اعرض تقييماتك من Google في موقعك، ونجلب الجديد منها كل يوم.</p>
        <div className="zb-w-v"><span className="zb-link">أضف رابط Google <ArrowLeft strokeWidth={2.2} className="rtl-flip" /></span></div>
      </Act>
    )
  }
  return (
    <Act action={action} className="zb-card zb-w zb-rv" style={{ ['--i' as string]: 9 }}>
      <div className="zb-w-top">
        <span className="zb-tile" data-tone="warn"><Star strokeWidth={2} /></span>
        {reviews.fresh > 0 && <span className="zb-pill" data-tone="acc"><span className="zb-num">{reviews.fresh}</span> جديد</span>}
      </div>
      <p>تقييمك على Google من <span className="zb-num">{fmt(reviews.count)}</span> تقييمًا</p>
      <div className="zb-w-v"><span className="zb-big">{reviews.rating.toFixed(1)}</span><Stars n={reviews.rating} /></div>
    </Act>
  )
}

/* ── a site not published yet ─────────────────────────────────────────── */

function DraftHome({ site, launch, links }: HomeScreenProps & { site: HomeSite }) {
  const done = launch.filter((x) => x.done).length
  const next = launch.findIndex((x) => !x.done)
  const frac = launch.length ? done / launch.length : 0
  return (
    <div className="zb-grid">
      <article className="zb-card zb-g-stats zb-rv" style={{ ['--i' as string]: 3 }}>
        <div className="zb-card-h">
          <h2 className="zb-h2">خطة الإطلاق</h2>
          <span className="zb-pill" data-tone="warn"><span className="zb-num">{done}</span> من <span className="zb-num">{launch.length}</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="zb-ring">
            <svg viewBox="0 0 56 56" aria-hidden="true">
              <circle className="zb-bg" cx="28" cy="28" r="22" />
              <circle className="zb-fg" cx="28" cy="28" r="22" style={{ strokeDashoffset: 138.2 * (1 - frac) }} />
            </svg>
            <b className="zb-num">{Math.round(frac * 100)}%</b>
          </div>
          <div className="zb-steps min-w-[220px] flex-1">
            {launch.map((x, i) => (
              <div key={x.label} data-done={x.done ? '' : undefined} data-on={i === next ? '' : undefined}>
                <i>{x.done ? <Check strokeWidth={3} /> : <span className="zb-num">{i + 1}</span>}</i>{x.label}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Act action={links.publish} className="zb-btn zb-btn-acc"><Globe strokeWidth={2} />انشر الموقع</Act>
          <Act action={site.edit} className="zb-btn"><Pencil strokeWidth={2} />أكمل التعديل</Act>
        </div>
      </article>
      <article className="zb-card zb-g-day zb-rv" style={{ ['--i' as string]: 4 }}>
        <div className="zb-card-h"><h2 className="zb-h2">بعد النشر</h2></div>
        <div className="zb-rows">
          <div><span className="zb-tile" data-tone="acc"><CalendarCheck strokeWidth={2} /></span><span><b>الحجوزات</b><span>تصلك هنا فور أن يرسلها الزوار</span></span></div>
          <div><span className="zb-tile" data-tone="blue"><BarChart3 strokeWidth={2} /></span><span><b>الزيارات</b><span>تعرف كم شخصًا زارك ومن أين</span></span></div>
          <div><span className="zb-tile" data-tone="warn"><Star strokeWidth={2} /></span><span><b>التقييمات</b><span>اعرض تقييمات Google في موقعك</span></span></div>
        </div>
      </article>
      <article className="zb-card zb-g-site zb-rv" style={{ ['--i' as string]: 5 }}>
        <div className="zb-sitecard">
          <div className="zb-meta">
            <span className="zb-pill" data-tone="warn" style={{ alignSelf: 'flex-start' }}>مسودة</span>
            <h3>{site.name}</h3>
            <span className="zb-small">{site.kind} · آخر تعديل {site.updated}</span>
            <div className="zb-btns">
              <Act action={site.edit} className="zb-btn zb-btn-ink"><Pencil strokeWidth={2} />عدّل</Act>
              <Act action={site.open} className="zb-btn"><Eye strokeWidth={2} />معاينة</Act>
            </div>
          </div>
          <Phone site={site} />
        </div>
      </article>
      <article className="zb-card zb-g-quick zb-rv" style={{ ['--i' as string]: 6 }}>
        <div className="zb-card-h"><h2 className="zb-h2">إجراءات سريعة</h2></div>
        <div className="zb-qgrid">
          <Act action={links.gallery} className="zb-q"><span className="zb-tile"><Upload strokeWidth={2} /></span><b>ارفع صورة</b></Act>
          <Act action={links.seo} className="zb-q"><span className="zb-tile"><Search strokeWidth={2} /></span><b>جهّز ظهورك في جوجل</b></Act>
        </div>
      </article>
    </div>
  )
}

function FirstSite({ newSite }: { newSite?: Action }) {
  return (
    <article className="zb-card zb-rv" style={{ ['--i' as string]: 3 }}>
      <div className="zb-empty" style={{ padding: '36px 16px' }}>
        <span className="zb-tile" data-tone="acc"><Plus strokeWidth={2} /></span>
        <b style={{ color: 'var(--obsidian)', fontSize: 18 }}>لا مواقع بعد</b>
        <span>اختر نوع موقعك، وأجب عن أسئلة قليلة، ويكون جاهزًا في دقائق.</span>
        <Act action={newSite} className="zb-btn zb-btn-ink"><Plus strokeWidth={2} />ابدأ موقعك الأول</Act>
      </div>
    </article>
  )
}
