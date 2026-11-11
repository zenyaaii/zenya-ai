'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { ServiceContent, ServiceTeamMember } from '@/utils/services/types'
import { DAYS_AR, openState, timeAr } from '@/utils/services/barber'
import { KIND, isNicheKind } from '@/utils/services/kinds'
import { useBookingContext } from '@/components/site/BookingContext'

/**
 * The barber site: option A «الصورة أولًا», as Anas approved it (2026-11-10,
 * sample a2). One long page, read on a phone:
 *
 *   hero photo + name + three facts (Google rating, open now, area)
 *   الحلاقون      each barber by name, a customer's words from Google under him,
 *                 his photo only when the owner uploaded one (never a stock face)
 *   الخدمات       a price list; with no prices, one «اسأل عن الأسعار» on WhatsApp
 *   احجز موعدك    service, barber, day, time, name, WhatsApp → /api/bookings
 *   التقييمات     one large quote and four small, all from Google, named
 *   الصالون       the shop's own photos
 *   قبل أن تأتي   only the questions the owner answered
 *   الموقع        map link, hours with today marked, call / WhatsApp
 *
 * Colours: the shop's own when the build measured them (colorOverrides from the
 * restaurant palette step), else near-black and brass. Every gap leaves its
 * section out rather than filling it with something invented.
 */

type Colors = { primary?: string; accent?: string; background?: string; surface?: string; text?: string; muted?: string; border?: string }

const DEFAULT = { bg: '#0d0c0a', bg2: '#151310', ink: '#f2ede3', ink2: '#cfc7b8', mute: '#958d80', line: '#2a2722', line2: '#3d3931', acc: '#c4a35a', acc2: '#dcc28a' }

function rgb(hex?: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
function lum(hex?: string): number {
  const c = rgb(hex)
  if (!c) return 0
  const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const onColor = (hex: string) => (lum(hex) > 0.36 ? '#15120c' : '#fffaf2')

function palette(c?: Colors, fallback?: Colors) {
  if (!c?.background || !c.accent) c = fallback
  if (!c?.background || !c.accent) return { ...DEFAULT, onAcc: onColor(DEFAULT.acc), dark: true }
  const dark = lum(c.background) < 0.2
  const ink = c.text || (dark ? DEFAULT.ink : '#1b1712')
  return {
    bg: c.background,
    bg2: c.surface && c.surface !== c.background ? c.surface : `color-mix(in srgb, ${c.background} 90%, ${ink})`,
    ink,
    ink2: `color-mix(in srgb, ${ink} 80%, ${c.background})`,
    mute: c.muted || `color-mix(in srgb, ${ink} 58%, ${c.background})`,
    line: `color-mix(in srgb, ${ink} 13%, ${c.background})`,
    line2: `color-mix(in srgb, ${ink} 22%, ${c.background})`,
    acc: c.accent,
    acc2: `color-mix(in srgb, ${c.accent} 78%, ${dark ? '#fff' : '#000'})`,
    onAcc: onColor(c.accent),
    dark,
  }
}

function waNumber(content: ServiceContent): string | null {
  for (const raw of [content.links?.whatsapp || '', content.footer.phone || '']) {
    const v = raw.trim()
    const m = /wa\.me\/(\d{8,})/.exec(v)
    if (m) return m[1]
    if (/^(\+|00)/.test(v)) { const d = v.replace(/\D/g, '').replace(/^00/, ''); if (d.length >= 8) return d }
    const d = v.replace(/\D/g, '')
    if (raw === content.links?.whatsapp && d.length >= 10 && !d.startsWith('0')) return d
  }
  return null
}
const telOf = (p: string) => p.replace(/[^\d+]/g, '')

const I = {
  wa: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>,
  phone: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" /></svg>,
  pin: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>,
  ig: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2c-2.7 0-3 0-4.1.1C4.4 2.2 2.2 4.4 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.1 3.5 2.3 5.7 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.5-.1 5.7-2.3 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.1-3.5-2.3-5.7-5.8-5.8C15 2 14.7 2 12 2zm0 1.8c2.7 0 3 0 4 .1 2.6.1 3.9 1.4 4 4 .1 1.1.1 1.4.1 4.1s0 3-.1 4c-.1 2.6-1.4 3.9-4 4-1.1.1-1.4.1-4 .1s-3 0-4-.1c-2.6-.1-3.9-1.4-4-4C3.8 15 3.8 14.7 3.8 12s0-3 .1-4c.1-2.6 1.4-3.9 4-4 1-.2 1.4-.2 4.1-.2z" /></svg>,
}

function igHref(v?: string): string | null {
  const s = (v || '').trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  const h = s.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '')
  return h ? `https://www.instagram.com/${h}/` : null
}

const ar = (n: number) => n.toLocaleString('ar')

export default function NicheView({ content, colors, logo }: { content: ServiceContent; colors?: Colors; logo?: string }) {
  const kind = isNicheKind(content.niche) ? content.niche : 'barber'
  const p = useMemo(() => palette(colors, KIND[kind].looks[0].colors), [colors, kind])
  const { slug, enabled, preview } = useBookingContext()
  const canBook = enabled || preview
  const wa = waNumber(content)
  const waLink = (text: string) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null)
  const [st, setSt] = useState<ReturnType<typeof openState>>(null)
  useEffect(() => { setSt(openState(content.hours)); const t = setInterval(() => setSt(openState(content.hours)), 60_000); return () => clearInterval(t) }, [content.hours])
  const [solid, setSolid] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const k = KIND[kind]
  const b = content.brand
  const members = (content.team?.members || []).filter((m) => m.name.trim())
  const services = content.services.items.filter((s) => s.name.trim())
  const priced = services.some((s) => s.price_from)
  const reviews = content.testimonials.items.filter((r) => r.text.trim()).slice(0, 5)
  const rating = content.google?.rating ?? content.testimonials.average_rating
  const count = content.google?.count ?? (Number(content.testimonials.review_count) || undefined)
  const mapsUrl = content.google?.maps_url || content.links?.reviews_url
  const photos = content.gallery.images.map((i) => i.url).filter(Boolean)
  const hero = content.hero.image || photos[0] || ''
  const side = content.story.image || photos.find((u) => u !== hero) || ''
  const place = photos.filter((u) => u !== hero && u !== side).slice(0, 5)
  const hours = (content.hours || []).slice().sort((a, b) => a.day - b.day)
  const faq = content.faq.items.filter((f) => f.q.trim() && f.a.trim())
  const short = content.hero.headline?.trim() || b.name
  const where = b.area || b.region || b.city
  const ig = igHref(content.social_links?.instagram)
  const walkin = content.booking?.mode === 'walkin'
  const tel = content.footer.phone ? telOf(content.footer.phone) : ''

  const [pick, setPick] = useState(k.any)
  const bookRef = useRef<HTMLElement>(null)
  const bookWith = (name: string) => { setPick(name); bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const vars = {
    '--bb-bg': p.bg, '--bb-bg2': p.bg2, '--bb-ink': p.ink, '--bb-ink2': p.ink2, '--bb-mute': p.mute,
    '--bb-line': p.line, '--bb-line2': p.line2, '--bb-acc': p.acc, '--bb-acc2': p.acc2, '--bb-on': p.onAcc,
    colorScheme: p.dark ? 'dark' : 'light',
  } as CSSProperties

  return (
    <div ref={root} className="bb" dir="rtl" style={vars}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Cormorant+SC:wght@500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className={`bb-top${solid ? ' solid' : ''}${hero ? ' onphoto' : ' plain'}`}>
        <a className="bb-mark" href="#bb-top">
          {logo && b.show_logo !== false ? <img src={logo} alt="" /> : null}
          <span><b>{short}</b>{b.latin ? <i>{b.latin}</i> : null}</span>
        </a>
        <nav>
          {members.length ? <a href="#bb-crew">{content.team?.heading || k.team}</a> : null}
          <a href="#bb-prices">{k.services}</a>
          {reviews.length ? <a href="#bb-reviews">التقييمات</a> : null}
          <a href="#bb-visit">الموقع</a>
        </nav>
        {walkin ? (wa ? <a className="bb-btn sm" href={waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">واتساب</a> : null) : <a className="bb-btn sm" href="#bb-book">{k.cta}</a>}
      </header>

      <section id="bb-top" className={`bb-hero${hero ? '' : ' plain'}`}>
        {hero ? <img src={hero} alt={`داخل ${b.name}`} /> : null}
        <div className="bb-w">
          {b.latin ? <span className="bb-lat bb-rise" dir="ltr">{b.latin}</span> : null}
          <h1 className="bb-rise">{short}</h1>
          <p className="bb-lede bb-rise">{content.hero.subheadline || b.tagline}</p>
          <div className="bb-acts bb-rise">
            {walkin ? null : <a className="bb-btn" href="#bb-book">{k.cta}</a>}
            <a className="bb-btn line" href="#bb-prices">{priced ? `${k.services} والأسعار` : k.services}</a>
          </div>
          <div className="bb-facts bb-rise">
            {rating ? <div><b>{rating.toFixed(1)} <span className="bb-stars">★★★★★</span></b><span>{count ? `${ar(count)} تقييم على جوجل` : 'على جوجل'}</span></div> : null}
            {hours.length ? <div><b><i className={`bb-dot${st && !st.open ? ' off' : ''}`} />{st ? (st.open ? 'مفتوح' : 'مغلق') : '—'}</b><span>{st?.text || ' '}</span></div> : null}
            <div><b>{where}</b><span>{b.area ? b.city : b.audience || ' '}</span></div>
          </div>
        </div>
      </section>

      {members.length ? (
        <section className="bb-sec" id="bb-crew"><div className="bb-w">
          <div className="bb-head"><h2>{content.team?.heading || k.team}</h2>{members.some((m) => m.quote) ? <p>ما تقرؤه تحت كل اسم كتبه زبون على جوجل.</p> : null}</div>
          <div className="bb-crew">{members.map((m) => <Barber key={m.name} m={m} label={k.bookAt(m.name)} book={walkin ? undefined : () => bookWith(m.name)} />)}</div>
        </div></section>
      ) : null}

      <section className="bb-sec alt" id="bb-prices"><div className={`bb-w bb-board${side ? '' : ' one'}`}>
        <div>
          <div className="bb-head"><h2>{content.services.heading || k.services}</h2>{priced ? <p>السعر المكتوب هو ما تدفعه.</p> : null}</div>
          <ul className="bb-list">
            {services.map((s) => (
              <li key={s.name}>
                <span className="n">{s.name}</span>
                {s.price_from ? <span className="p">{s.price_from}</span> : <span />}
                {s.duration || s.description ? <span className="t">{[s.duration, s.description].filter(Boolean).join(' · ')}</span> : null}
              </li>
            ))}
          </ul>
          {!priced && wa ? (
            <div className="bb-ask">
              <h3>تريد السعر قبل أن تأتي؟</h3>
              <p>اكتب لنا على واتساب، ونرد عليك بسعر الخدمة.</p>
              <a className="bb-btn" href={waLink('مرحبًا، أريد أسعار الخدمات')!} target="_blank" rel="noopener noreferrer">{I.wa} اسأل عن الأسعار</a>
            </div>
          ) : null}
          {content.terms?.length ? (
            <dl className="bb-terms">{content.terms.map((t) => <div key={t.label}><dt>{t.label}</dt><dd>{t.text}</dd></div>)}</dl>
          ) : null}
        </div>
        {side ? <div className="bb-side"><img src={side} alt={`${k.place} ${short}`} loading="lazy" /></div> : null}
      </div></section>

      <section className="bb-sec" id="bb-book" ref={bookRef}><div className="bb-w bb-bk">
        <aside>
          <h2>{walkin ? 'تعال مباشرة' : k.cta}</h2>
          <p>{walkin ? 'نستقبلك بدون موعد، بالدور.' : k.bookLine}</p>
          {content.booking?.wait ? <p className="bb-fine">الانتظار عادة: {content.booking.wait}</p> : null}
          {content.booking?.busy ? <p className="bb-fine">الأكثر زحمة: {content.booking.busy}</p> : null}
          {st?.text ? <p className="bb-fine">{st.open ? 'مفتوح الآن' : 'مغلق الآن'} · {st.text}</p> : null}
        </aside>
        {walkin ? (
          <div className="bb-ask">
            <h3>تريد أن تتأكد قبل أن تأتي؟</h3>
            <p>اسألنا عن الدور الآن.</p>
            <div className="bb-call">
              {wa ? <a className="bb-btn" href={waLink('مرحبًا، كم الدور الآن؟')!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
              {tel ? <a className="bb-btn line" href={`tel:${tel}`}>{I.phone} اتصل</a> : null}
            </div>
          </div>
        ) : canBook ? (
          <Booking k={k} services={services.map((s) => s.name)} barbers={members.map((m) => m.name)} pick={pick} setPick={setPick} slug={slug} preview={preview || !slug} />
        ) : (
          <div className="bb-ask">
            <h3>احجز على واتساب</h3>
            <p>اكتب الخدمة و{k.one} والوقت الذي يناسبك، ونؤكّد لك الموعد.</p>
            <div className="bb-call">
              {wa ? <a className="bb-btn" href={waLink(`مرحبًا، أريد حجز موعد${pick !== k.any ? ' عند ' + pick : ''}.`)!} target="_blank" rel="noopener noreferrer">{I.wa} احجز على واتساب</a> : null}
              {tel ? <a className="bb-btn line" href={`tel:${tel}`}>{I.phone} اتصل</a> : null}
            </div>
          </div>
        )}
      </div></section>

      {reviews.length ? (
        <section className="bb-sec alt" id="bb-reviews"><div className={`bb-w bb-rv${reviews.length > 1 ? '' : ' one'}`}>
          <div>
            <p className="bb-big">{reviews[0].text}</p>
            <p className="bb-by">{reviews[0].name}{reviews[0].when ? ` · ${reviews[0].when}` : ''}</p>
            {rating ? (
              mapsUrl ? <a className="bb-g" href={mapsUrl} target="_blank" rel="noopener noreferrer"><span className="bb-stars">★★★★★</span> {rating.toFixed(1)}{count ? ` من ${ar(count)} تقييم` : ''} على جوجل</a>
                : <span className="bb-g"><span className="bb-stars">★★★★★</span> {rating.toFixed(1)}{count ? ` من ${ar(count)} تقييم` : ''} على جوجل</span>
            ) : null}
          </div>
          {reviews.length > 1 ? (
            <div className="bb-small">{reviews.slice(1).map((r, i) => <figure key={i}><blockquote>{r.text}</blockquote><figcaption>{r.name}{r.when ? ` · ${r.when}` : ''} · جوجل</figcaption></figure>)}</div>
          ) : null}
        </div></section>
      ) : null}

      {place.length >= 2 ? (
        <section className="bb-sec" id="bb-place"><div className="bb-w">
          <div className="bb-head"><h2>{content.gallery.heading || k.place}</h2><p>صور المكان الحقيقية.</p></div>
          <div className={`bb-mos n${Math.min(place.length, 5)}`}>{place.map((u, i) => <img key={u} src={u} alt={`${short} ${i + 1}`} loading="lazy" />)}</div>
        </div></section>
      ) : null}

      {faq.length ? (
        <section className={`bb-sec${place.length >= 2 ? ' tight' : ''}`} id="bb-faq"><div className="bb-w narrow">
          <div className="bb-head"><h2>{content.faq.heading || 'قبل أن تأتي'}</h2></div>
          <div className="bb-faq">{faq.map((f, i) => <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        </div></section>
      ) : null}

      <section className="bb-sec alt" id="bb-visit"><div className={`bb-w bb-vs${mapsUrl ? '' : ' one'}`}>
        {mapsUrl ? (
          <a className="bb-map" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="400" height="260" fill="var(--bb-bg2)" />
              <g stroke="var(--bb-line2)" fill="none" strokeLinecap="round"><path strokeWidth="12" d="M-10 180 C90 160 170 190 410 140" /><path strokeWidth="12" d="M130 -10 L190 270" /><path strokeWidth="12" d="M270 -10 C258 90 310 170 300 270" /><path strokeWidth="5" d="M0 70 L400 92" /><path strokeWidth="5" d="M40 270 L95 0" /></g>
              <circle cx="222" cy="136" r="30" fill="var(--bb-acc)" opacity=".16" /><circle cx="222" cy="136" r="9" fill="var(--bb-acc)" />
            </svg>
            <span>{I.pin} افتح في خرائط جوجل</span>
          </a>
        ) : null}
        <div>
          <h2 className="bb-h3">{[b.area, b.city].filter(Boolean).join('، ')}</h2>
          {content.footer.address ? <p className="bb-addr">{content.footer.address}</p> : null}
          {hours.length ? (
            <table className="bb-hours"><tbody>
              {hours.map((d) => (
                <tr key={d.day} className={st?.today === d.day ? 'today' : undefined}>
                  <td>{DAYS_AR[d.day]}{st?.today === d.day ? ' · اليوم' : ''}</td>
                  <td>{d.closed || !d.periods.length ? 'مغلق' : d.periods.map((x) => `${timeAr(x.open)} – ${timeAr(x.close)}`).join('، ')}</td>
                </tr>
              ))}
            </tbody></table>
          ) : null}
          <div className="bb-call">
            {tel ? <a className="bb-btn line" href={`tel:${tel}`}>{I.phone} <span dir="ltr">{content.footer.phone}</span></a> : null}
            {wa ? <a className="bb-btn line" href={waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
            {ig ? <a className="bb-btn line" href={ig} target="_blank" rel="noopener noreferrer">{I.ig} إنستغرام</a> : null}
          </div>
          {content.links?.extra?.length ? (
            <div className="bb-extra">{content.links.extra.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label || l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}</a>)}</div>
          ) : null}
        </div>
      </div></section>

      <footer className="bb-foot">
        <span className="bb-mark"><span><b>{b.name}</b>{b.latin ? <i>{b.latin}</i> : null}</span></span>
        {content.footer.address ? <span>{content.footer.address}</span> : null}
      </footer>

      <nav className="bb-bar">
        {walkin ? null : <a className="bb-btn" href="#bb-book">{k.cta}</a>}
        {wa ? <a className="bb-btn line" href={waLink('مرحبًا، أريد حجز موعد')!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
        {tel ? <a className="bb-btn line sq" href={`tel:${tel}`} aria-label="اتصال">{I.phone}</a> : null}
      </nav>
    </div>
  )
}

function Barber({ m, book, label }: { m: ServiceTeamMember; book?: () => void; label: string }) {
  return (
    <article className={`bb-pr${m.photo ? '' : ' ni'}`}>
      {m.photo ? <div className="bb-por"><img src={m.photo} alt={m.name} loading="lazy" /></div> : null}
      <h3>{m.name}{m.role ? <small>{m.role}</small> : null}</h3>
      {m.tags?.length ? <ul className="bb-tags">{m.tags.map((t) => <li key={t}>{t}</li>)}</ul> : null}
      {m.quote ? <blockquote>{m.quote}<cite>{m.quote_by ? `${m.quote_by} · ` : ''}تقييم على جوجل</cite></blockquote> : null}
      {book ? <button type="button" className="bb-go" onClick={book}>{label}</button> : null}
    </article>
  )
}

function nextDays(n: number): { v: string; label: string }[] {
  const out: { v: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i)
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({ v, label: i === 0 ? 'اليوم' : i === 1 ? 'غدًا' : d.toLocaleDateString('ar', { weekday: 'long' }) })
  }
  return out
}

const TIMES = [['11:00', '11 ص'], ['13:00', '1 م'], ['16:00', '4 م'], ['18:30', '6:30 م'], ['20:00', '8 م'], ['21:00', '9 م']] as const

function Booking({ k, services, barbers, pick, setPick, slug, preview }: { k: (typeof KIND)[keyof typeof KIND]; services: string[]; barbers: string[]; pick: string; setPick: (v: string) => void; slug: string | null; preview: boolean }) {
  const [days, setDays] = useState<{ v: string; label: string }[]>([])
  useEffect(() => setDays(nextDays(6)), [])
  const [svc, setSvc] = useState(services[0] || '')
  const [day, setDay] = useState(0)
  const [time, setTime] = useState(3)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('اكتب اسمك.'); setState('error'); return }
    if (phone.replace(/\D/g, '').length < 7) { setErr('اكتب رقم واتساب صحيحًا.'); setState('error'); return }
    setErr('')
    if (preview) { setState('done'); return }
    setState('sending')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, type: 'appointment', name: name.trim(), phone: phone.trim(),
          date: days[day]?.v, time: TIMES[time][0],
          message: [`الخدمة: ${svc}`, `${k.one}: ${pick}`].join(' · '),
          path: typeof window !== 'undefined' ? window.location.pathname : '/',
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) setState('done')
      else { setErr('تعذّر الإرسال، حاول مرة أخرى.'); setState('error') }
    } catch { setErr('تعذّر الإرسال، حاول مرة أخرى.'); setState('error') }
  }

  if (state === 'done') {
    return (
      <div className="bb-done" role="status">
        <b>وصل طلبك</b>
        <span>{svc} · {pick} · {days[day]?.label} {TIMES[time][1]}. سيؤكّد لك {k.place} الموعد على واتساب.</span>
        {preview ? <small>معاينة: لم يُرسل هذا الطلب.</small> : null}
      </div>
    )
  }
  return (
    <form className="bb-form" onSubmit={submit} noValidate>
      {services.length > 1 ? (
        <label className="bb-fl">الخدمة
          <select value={svc} onChange={(e) => setSvc(e.target.value)}>{services.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
      ) : null}
      {barbers.length ? (
        <div className="bb-fl">{k.one}
          <div className="bb-chips">{[k.any, ...barbers].map((v) => <button key={v} type="button" className={pick === v ? 'on' : ''} aria-pressed={pick === v} onClick={() => setPick(v)}>{v}</button>)}</div>
        </div>
      ) : null}
      <div className="bb-fl">اليوم
        <div className="bb-chips">{days.map((d, i) => <button key={d.v} type="button" className={day === i ? 'on' : ''} aria-pressed={day === i} onClick={() => setDay(i)}>{d.label}</button>)}</div>
      </div>
      <div className="bb-fl">الوقت
        <div className="bb-chips">{TIMES.map((t, i) => <button key={t[0]} type="button" className={time === i ? 'on' : ''} aria-pressed={time === i} onClick={() => setTime(i)}>{t[1]}</button>)}</div>
      </div>
      <label className="bb-fl">اسمك<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="الاسم" /></label>
      <label className="bb-fl">رقم واتساب<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" autoComplete="tel" placeholder="+9627XXXXXXXX" /></label>
      {state === 'error' && err ? <p className="bb-err" role="alert">{err}</p> : null}
      <button className="bb-btn" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'جارٍ الإرسال…' : 'أرسل طلب الحجز'}</button>
    </form>
  )
}

const CSS = `
.bb{--disp:'El Messiri','IBM Plex Sans Arabic',serif;--body:'IBM Plex Sans Arabic',system-ui,sans-serif;--latin:'Cormorant SC',Georgia,serif;--gut:max(18px,env(safe-area-inset-left,0px));--r:6px;
  background:var(--bb-bg);color:var(--bb-ink);font-family:var(--body);font-size:16px;line-height:1.7;min-height:100%;padding-bottom:76px;overflow-x:clip}
.bb *{box-sizing:border-box;margin:0}
.bb img{display:block;max-width:100%}
.bb a{color:inherit}
.bb-w{max-width:1160px;margin:0 auto;padding-inline:var(--gut)}
.bb-w.narrow{max-width:820px}
.bb h1,.bb h2,.bb h3{font-family:var(--disp);font-weight:700;line-height:1.15;text-wrap:balance;color:var(--bb-ink)}
.bb h2{font-size:clamp(30px,5vw,46px)}
.bb-h3{font-size:32px!important}
.bb-sec{padding-block:clamp(56px,9vw,104px)}
.bb-sec.alt{background:var(--bb-bg2)}
.bb-sec.tight{padding-top:0}
.bb-head{display:flex;align-items:end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:28px;padding-bottom:14px;border-bottom:1px solid var(--bb-line)}
.bb-head p{color:var(--bb-mute);font-size:15px;max-width:44ch}
.bb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 24px;border-radius:var(--r);background:var(--bb-acc);color:var(--bb-on)!important;font:600 16px var(--body);text-decoration:none;border:0;cursor:pointer;transition:background .2s,border-color .2s}
.bb-btn:hover{background:var(--bb-acc2)}
.bb-btn.line{background:transparent;color:var(--bb-ink)!important;border:1px solid var(--bb-line2)}
.bb-btn.line:hover{border-color:var(--bb-acc)}
.bb-btn.sm{min-height:40px;padding:0 16px;font-size:14px}
.bb-btn[disabled]{opacity:.6;cursor:default}
.bb :focus-visible{outline:2px solid var(--bb-acc);outline-offset:3px}
.bb-top{position:sticky;top:0;z-index:20;height:68px;margin-bottom:-68px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 var(--gut);transition:background .3s,border-color .3s;border-bottom:1px solid transparent}
.bb-top.solid,.bb-top.plain{background:color-mix(in srgb,var(--bb-bg) 92%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-color:var(--bb-line)}
.bb-mark{display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0}
.bb-mark img{width:36px;height:36px;object-fit:contain;border-radius:8px}
.bb-mark>span{display:flex;flex-direction:column;line-height:1;min-width:0}
.bb-mark b{font-family:var(--disp);font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bb-mark i{font:500 12px var(--latin);font-style:normal;letter-spacing:.18em;color:var(--bb-acc);margin-top:4px;text-transform:uppercase}
.bb-top nav{display:none;gap:26px;font-size:14px}
.bb-top.onphoto:not(.solid) .bb-mark b,.bb-top.onphoto:not(.solid) nav a{color:#f2ede3}
.bb-top.onphoto:not(.solid) .bb-mark i{color:rgba(242,237,227,.75)}
.bb-top nav a{text-decoration:none;color:var(--bb-ink2)}
.bb-top nav a:hover{color:var(--bb-acc)}
@media(min-width:900px){.bb-top nav{display:flex}}
.bb-hero{position:relative;min-height:clamp(600px,100svh,900px);display:grid;align-items:end;overflow:hidden}
.bb-hero.plain{min-height:clamp(440px,64svh,640px);background:radial-gradient(120% 80% at 80% 0%,color-mix(in srgb,var(--bb-acc) 14%,transparent),transparent 60%),var(--bb-bg)}
.bb-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%}
.bb-hero:not(.plain)::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,9,8,.6) 0%,rgba(10,9,8,0) 22%,rgba(10,9,8,.38) 48%,rgba(10,9,8,.94) 84%,rgba(10,9,8,1) 100%)}
.bb-hero:not(.plain) .bb-w{color:#f2ede3}
.bb-hero:not(.plain) h1{color:#f2ede3}
.bb-hero:not(.plain) .bb-lat{color:rgba(242,237,227,.9);text-shadow:0 1px 10px rgba(0,0,0,.55)}
.bb-hero:not(.plain) .bb-stars{color:#e8c46a}
.bb-hero .bb-w{position:relative;z-index:1;width:100%;padding-bottom:clamp(28px,5vw,56px);display:grid;gap:22px}
.bb-lat{justify-self:start;font:600 13px var(--latin);letter-spacing:.32em;color:var(--bb-acc);text-transform:uppercase}
.bb-hero h1{font-size:clamp(48px,11vw,112px);line-height:1}
.bb-lede{font-size:clamp(17px,2vw,20px);opacity:.86;max-width:36ch}
.bb-acts{display:flex;gap:10px;flex-wrap:wrap}
.bb-hero:not(.plain) .bb-btn.line{color:#f2ede3!important;border-color:rgba(242,237,227,.3)}
.bb-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));grid-auto-flow:column;border-top:1px solid color-mix(in srgb,currentColor 20%,transparent);margin-top:6px}
.bb-facts div{padding:14px 0 0;display:grid;gap:2px;min-width:0}
.bb-facts div+div{padding-inline-start:16px;border-inline-start:1px solid color-mix(in srgb,currentColor 14%,transparent)}
.bb-facts b{font-family:var(--disp);font-size:clamp(18px,3vw,28px);font-weight:600;display:flex;align-items:center;gap:6px;line-height:1.25}
.bb-facts span{font-size:13px;opacity:.8}
.bb-dot{width:8px;height:8px;border-radius:50%;background:#4cb37a;box-shadow:0 0 0 4px rgba(76,179,122,.2);flex:0 0 auto}
.bb-dot.off{background:#d08a5a;box-shadow:0 0 0 4px rgba(208,138,90,.2)}
.bb-stars{color:var(--bb-acc);font-size:.7em;letter-spacing:1px}
.bb-crew{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(10px,2vw,22px);align-items:start}
@media(max-width:700px){.bb-crew{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(var(--gut) * -1);padding-inline:var(--gut);scroll-padding-inline:var(--gut);scrollbar-width:none}.bb-crew>*{flex:0 0 76%;scroll-snap-align:start}}
.bb-pr{display:grid;gap:12px;min-width:0;align-content:start}
.bb-por{aspect-ratio:4/5;background:var(--bb-bg2);border:1px solid var(--bb-line);overflow:hidden}
.bb-por img{width:100%;height:100%;object-fit:cover}
.bb-pr.ni{border-top:1px solid var(--bb-acc);padding-top:18px}
.bb-pr.ni h3{font-size:40px}
.bb-pr h3{font-size:30px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.bb-pr h3 small{font:500 13px var(--body);color:var(--bb-acc)}
.bb-tags{list-style:none;padding:0;display:flex;gap:6px;flex-wrap:wrap}
.bb-tags li{font-size:12px;border:1px solid var(--bb-line2);color:var(--bb-ink2);padding:2px 10px;border-radius:99px}
.bb-pr blockquote{font-size:15px;color:var(--bb-ink2);border-inline-start:2px solid var(--bb-acc);padding-inline-start:12px}
.bb-pr cite{display:block;font-style:normal;font-size:12px;color:var(--bb-mute);margin-top:4px}
.bb-go{justify-self:start;background:none;border:0;border-bottom:1px solid var(--bb-acc);color:var(--bb-ink);font:600 14px var(--body);padding:4px 0;cursor:pointer}
.bb-board{display:grid;grid-template-columns:1fr;gap:clamp(24px,5vw,64px)}
@media(min-width:900px){.bb-board:not(.one){grid-template-columns:1.25fr 1fr;align-items:start}}
.bb-list{list-style:none;padding:0}
.bb-list li{display:grid;grid-template-columns:1fr auto;gap:4px 16px;padding:18px 0;border-bottom:1px solid var(--bb-line);align-items:baseline}
.bb-list .n{font-family:var(--disp);font-size:22px;font-weight:600}
.bb-list .p{font:600 22px var(--disp);font-variant-numeric:tabular-nums;text-align:end;white-space:nowrap}
.bb-list .t{font-size:13px;color:var(--bb-mute);grid-column:1/-1}
.bb-ask{background:var(--bb-bg);border:1px solid var(--bb-line);padding:22px;display:grid;gap:12px;align-content:start}
.bb-sec:not(.alt) .bb-ask{background:var(--bb-bg2)}
.bb-board .bb-ask{margin-top:22px}
.bb-ask h3{font-size:22px}
.bb-ask p{color:var(--bb-ink2);font-size:15px}
.bb-side{aspect-ratio:4/5;overflow:hidden}
.bb-terms{margin-top:22px;display:grid;gap:0;border-top:1px solid var(--bb-line)}
.bb-terms div{display:grid;grid-template-columns:minmax(90px,auto) 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--bb-line);font-size:15px}
.bb-terms dt{color:var(--bb-acc);font-weight:600}
.bb-terms dd{color:var(--bb-ink2);margin:0}
.bb-side img{width:100%;height:100%;object-fit:cover}
.bb-bk{display:grid;gap:clamp(24px,5vw,64px)}
@media(min-width:900px){.bb-bk{grid-template-columns:1fr 1.2fr}}
.bb-bk aside{display:grid;gap:12px;align-content:start}
.bb-bk aside p{color:var(--bb-ink2)}
.bb-fine{font-size:14px;color:var(--bb-mute)!important}
.bb-form{display:grid;gap:18px}
.bb-fl{display:grid;gap:8px;font-size:14px;color:var(--bb-ink2)}
.bb-form select,.bb-form input{font:inherit;font-size:16px;color:var(--bb-ink);background:var(--bb-bg2);border:1px solid var(--bb-line2);border-radius:var(--r);min-height:50px;padding:0 14px;width:100%}
.bb-chips{display:flex;gap:6px;flex-wrap:wrap}
.bb-chips button{min-height:42px;padding:0 16px;border:1px solid var(--bb-line2);background:transparent;color:var(--bb-ink);font:500 14px var(--body);border-radius:var(--r);cursor:pointer}
.bb-chips button.on{background:var(--bb-ink);color:var(--bb-bg);border-color:var(--bb-ink)}
.bb-err{color:#e07a5f;font-size:14px}
.bb-done{border:1px solid rgba(76,179,122,.45);background:rgba(76,179,122,.08);padding:18px;display:grid;gap:4px;font-size:15px;align-content:start}
.bb-done small{color:var(--bb-mute)}
.bb-rv{display:grid;gap:28px}
@media(min-width:900px){.bb-rv:not(.one){grid-template-columns:1.1fr 1fr}}
.bb-big{font-family:var(--disp);font-size:clamp(22px,3.2vw,34px);line-height:1.5;font-weight:500}
.bb-big::before{content:'«';color:var(--bb-acc)}.bb-big::after{content:'»';color:var(--bb-acc)}
.bb-by{margin-top:14px;font-size:14px;color:var(--bb-mute)}
.bb-small figure{padding:16px 0;border-bottom:1px solid var(--bb-line);display:grid;gap:4px}
.bb-small figure:first-child{padding-top:0}
.bb-small blockquote{font-size:15px;color:var(--bb-ink2)}
.bb-small figcaption{font-size:12px;color:var(--bb-mute)}
.bb-g{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--bb-ink2);margin-top:18px;text-decoration:none}
a.bb-g:hover{color:var(--bb-acc)}
.bb-mos{display:grid;gap:8px}
.bb-mos img{width:100%;height:100%;object-fit:cover;min-height:0}
.bb-mos.n2{grid-template-columns:1fr 1fr;aspect-ratio:2/1}
.bb-mos.n3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;aspect-ratio:2/1}.bb-mos.n3 img:first-child{grid-row:span 2}
.bb-mos.n4{grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;aspect-ratio:2/1}.bb-mos.n4 img:first-child{grid-row:span 2}.bb-mos.n4 img:last-child{grid-column:span 2}
.bb-mos.n5{grid-template-columns:2fr 1fr 1fr;grid-template-rows:1fr 1fr;aspect-ratio:2/1}.bb-mos.n5 img:first-child{grid-row:span 2}
@media(max-width:700px){.bb-mos[class]{grid-template-columns:1fr 1fr;grid-template-rows:auto;aspect-ratio:auto}.bb-mos img{aspect-ratio:1;grid-column:auto!important;grid-row:auto!important}.bb-mos img:first-child{grid-column:span 2!important;aspect-ratio:4/3}.bb-mos.n4 img:last-child,.bb-mos.n2 img:last-child{grid-column:span 2!important;aspect-ratio:4/3}}
.bb-faq details{border-bottom:1px solid var(--bb-line)}
.bb-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;padding:20px 0;font:600 19px var(--disp)}
.bb-faq summary::-webkit-details-marker{display:none}
.bb-faq summary::after{content:'+';color:var(--bb-acc);font:400 26px/1 var(--body)}
.bb-faq details[open] summary::after{content:'−'}
.bb-faq p{padding-bottom:20px;color:var(--bb-ink2);max-width:60ch}
.bb-vs{display:grid;gap:28px}
@media(min-width:900px){.bb-vs:not(.one){grid-template-columns:1.3fr 1fr}}
.bb-map{position:relative;display:block;min-height:280px;border:1px solid var(--bb-line);overflow:hidden;text-decoration:none}
.bb-map svg{position:absolute;inset:0;width:100%;height:100%}
.bb-map span{position:absolute;inset-inline-start:14px;bottom:14px;display:flex;gap:8px;align-items:center;background:var(--bb-bg);border:1px solid var(--bb-line2);padding:10px 14px;font-size:14px;font-weight:600}
.bb-addr{color:var(--bb-ink2);margin:6px 0 18px}
.bb-hours{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.bb-hours td{padding:11px 0;border-bottom:1px solid var(--bb-line);font-size:15px}
.bb-hours td+td{text-align:end;color:var(--bb-ink2)}
.bb-hours tr.today td{color:var(--bb-acc);font-weight:600}
.bb-call{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}
.bb-ask .bb-call{margin-top:4px}
.bb-extra{margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;font-size:14px}
.bb-extra a{color:var(--bb-ink2);border-bottom:1px solid var(--bb-line2);text-decoration:none}
.bb-foot{border-top:1px solid var(--bb-line);padding:40px var(--gut) 48px;display:grid;gap:6px;justify-items:center;text-align:center;color:var(--bb-mute);font-size:14px}
.bb-foot .bb-mark>span{align-items:center}
.bb-bar{position:fixed;inset:auto 0 0;z-index:20;display:flex;gap:8px;padding:10px var(--gut) calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bb-bg) 94%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--bb-line)}
.bb-bar .bb-btn{flex:1;min-height:48px;white-space:nowrap;padding:0 14px;font-size:15px}
.bb-bar .sq{flex:0 0 48px;padding:0}
@media(min-width:900px){.bb-bar{display:none}.bb{padding-bottom:0}}
@media(max-width:899px){.bb-hero:not(.plain){min-height:calc(100svh - 70px)}}
@media(max-width:899px){a[aria-label="Made with Beynoun"]{bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}}
.bb-rise{animation:bb-rise .9s cubic-bezier(.2,.7,.2,1) both}
.bb-rise:nth-child(2){animation-delay:.08s}.bb-rise:nth-child(3){animation-delay:.16s}.bb-rise:nth-child(4){animation-delay:.24s}.bb-rise:nth-child(5){animation-delay:.32s}
@keyframes bb-rise{from{opacity:0;transform:translateY(16px)}}
@media(prefers-reduced-motion:reduce){.bb-rise{animation:none}}
`
