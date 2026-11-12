'use client'

/**
 * Shared parts for the per-niche pages (beauty-spa, car, photo, gym).
 * SAMPLE STAGE (2026-11-12): these views are shown at /demo/niche-lab for
 * Anas to pick from. Nothing on a live site uses them yet.
 *
 * Every view reads the same ServiceContent the barber page reads, plus the
 * niche extras below (packages, yes/no blocks, brands...). Every list may hold
 * 0, 1 or many items: a view drops a section with nothing in it, never shows
 * a placeholder.
 */

import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { DAYS_AR, openState, timeAr } from '@/utils/services/barber'
import { useBookingContext } from '@/components/site/BookingContext'

/** Niche fields the wizard's new questions fill. Each is optional. */
export type NicheExtra = {
  /** What the place offers, from «ماذا تقدّم؟». Opens the matching sections. */
  offers?: string[]
  /** Service name → its group («شعر», «أظافر»), for grouped menus. */
  groups?: Record<string, string>
  packages?: { name: string; includes: string[]; duration?: string; price?: string }[]
  /** «ما الذي يميزك؟», organised into short lines. */
  features?: string[]
  /** Yes/no sections with the owner's text: hospitality, health note, price before work... */
  blocks?: { id: string; title: string; text: string }[]
  facilities?: string[]
  /** Car: makes the workshop knows. */
  brands?: string[]
  /** Beauty: who the place is for, and how it is kept private. */
  privacy?: string
  /** Photo: when and how the work is delivered. */
  delivery?: { what: string; when: string }[]
  /** Photo: official photo specs per document. */
  specs?: { label: string; text: string }[]
  /** Photo: portfolio, each photo tagged with its kind. */
  work?: { url: string; tag: string }[]
  /** Gym: classes per day. */
  classes?: { day: number; items: { time: string; name: string }[] }[]
  /** Car wash: price by car size. */
  sizes?: { name: string; prices: string[] }[]
  sizeNames?: string[]
}

export type Colors = { primary?: string; accent?: string; background?: string; surface?: string; text?: string; muted?: string; border?: string }

function rgb(hex?: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
export function lum(hex?: string): number {
  const c = rgb(hex)
  if (!c) return 0
  const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const onColor = (hex: string) => (lum(hex) > 0.36 ? '#121212' : '#ffffff')

/** CSS variables from the shop's own colours, or the view's default look. */
export function vars(c: Colors | undefined, def: Required<Pick<Colors, 'background' | 'surface' | 'text' | 'muted' | 'accent' | 'border'>>) {
  const x = c?.background && c.accent ? c : def
  const bg = x.background!, ink = x.text || def.text, acc = x.accent!
  return {
    '--n-bg': bg,
    '--n-bg2': x.surface || `color-mix(in srgb, ${bg} 92%, ${ink})`,
    '--n-ink': ink,
    '--n-ink2': `color-mix(in srgb, ${ink} 78%, ${bg})`,
    '--n-mute': x.muted || `color-mix(in srgb, ${ink} 55%, ${bg})`,
    '--n-line': x.border || `color-mix(in srgb, ${ink} 14%, ${bg})`,
    '--n-acc': acc,
    '--n-acc-soft': `color-mix(in srgb, ${acc} 14%, ${bg})`,
    '--n-on': onColor(acc),
    colorScheme: lum(bg) < 0.2 ? 'dark' : 'light',
  } as React.CSSProperties
}

export function waNumber(content: ServiceContent): string | null {
  for (const raw of [content.links?.whatsapp || '', content.footer.phone || '']) {
    const v = raw.trim()
    const m = /wa\.me\/(\d{8,})/.exec(v)
    if (m) return m[1]
    if (/^(\+|00)/.test(v)) { const d = v.replace(/\D/g, '').replace(/^00/, ''); if (d.length >= 8) return d }
  }
  return null
}
export const telOf = (p: string) => p.replace(/[^\d+]/g, '')
export const ar = (n: number) => n.toLocaleString('ar')
export function igHref(v?: string): string | null {
  const s = (v || '').trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  const h = s.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '')
  return h ? `https://www.instagram.com/${h}/` : null
}

/** Everything a view needs, read once. */
export function useNiche(content: ServiceContent) {
  const { slug, enabled, preview } = useBookingContext()
  const wa = waNumber(content)
  const [st, setSt] = useState<ReturnType<typeof openState>>(null)
  useEffect(() => { setSt(openState(content.hours)); const t = setInterval(() => setSt(openState(content.hours)), 60_000); return () => clearInterval(t) }, [content.hours])
  const photos = content.gallery.images.map((i) => i.url).filter(Boolean)
  const hero = content.hero.image || photos[0] || ''
  return {
    slug, canBook: enabled || preview, preview: preview || !slug, wa, st,
    waLink: (text: string) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null),
    tel: content.footer.phone ? telOf(content.footer.phone) : '',
    b: content.brand,
    short: content.hero.headline?.trim() || content.brand.name,
    services: content.services.items.filter((s) => s.name.trim()),
    priced: content.services.items.some((s) => s.price_from),
    reviews: content.testimonials.items.filter((r) => r.text.trim()).slice(0, 6),
    rating: content.google?.rating ?? content.testimonials.average_rating,
    count: content.google?.count ?? (Number(content.testimonials.review_count) || undefined),
    mapsUrl: content.google?.maps_url || content.links?.reviews_url,
    photos, hero,
    rest: photos.filter((u) => u !== hero),
    hours: (content.hours || []).slice().sort((a, b) => a.day - b.day),
    faq: content.faq.items.filter((f) => f.q.trim() && f.a.trim()),
    members: (content.team?.members || []).filter((m) => m.name.trim()),
    ig: igHref(content.social_links?.instagram),
    walkin: content.booking?.mode === 'walkin',
    where: [content.brand.area, content.brand.city].filter(Boolean).join('، '),
  }
}
export type N = ReturnType<typeof useNiche>

/** Adds .in to every [data-r] child once it scrolls into view. Reduced motion: shown at once. */
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-r]'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
  return ref
}

/** True after the page has scrolled past y. */
export function useScrolled(y = 40) {
  const [s, setS] = useState(false)
  useEffect(() => { const on = () => setS(window.scrollY > y); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on) }, [y])
  return s
}

export const Ic = {
  wa: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>,
  phone: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" /></svg>,
  pin: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>,
  check: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.2 4.2L19 7" /></svg>,
  plus: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>,
  arrow: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" /></svg>,
  star: <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.6l6.1-.8z" /></svg>,
  clock: <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  ig: <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.3" cy="6.8" r="1.1" fill="currentColor" /></svg>,
}

export function Stars({ n = 5 }: { n?: number }) {
  return <span className="n-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < Math.round(n) ? '' : 'off'}>{Ic.star}</i>)}</span>
}

/** Hours with today marked. */
export function Hours({ n }: { n: N }) {
  if (!n.hours.length) return null
  return (
    <table className="n-hours"><tbody>
      {n.hours.map((d) => (
        <tr key={d.day} className={n.st?.today === d.day ? 'today' : undefined}>
          <td>{DAYS_AR[d.day]}</td>
          <td>{d.closed || !d.periods.length ? 'مغلق' : d.periods.map((x) => `${timeAr(x.open)} - ${timeAr(x.close)}`).join('، ')}</td>
        </tr>
      ))}
    </tbody></table>
  )
}

/** Call / WhatsApp / Instagram row. */
export function Contact({ n, cls = 'n-btn ghost' }: { n: N; cls?: string }) {
  return (
    <div className="n-row">
      {n.wa ? <a className={cls} href={n.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">{Ic.wa} واتساب</a> : null}
      {n.tel ? <a className={cls} href={`tel:${n.tel}`}>{Ic.phone} اتصل</a> : null}
      {n.ig ? <a className={cls} href={n.ig} target="_blank" rel="noopener noreferrer">{Ic.ig} إنستغرام</a> : null}
      {n.mapsUrl ? <a className={cls} href={n.mapsUrl} target="_blank" rel="noopener noreferrer">{Ic.pin} الخريطة</a> : null}
    </div>
  )
}

function nextDays(k: number) {
  const out: { v: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < k; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i)
    out.push({ v: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, label: i === 0 ? 'اليوم' : i === 1 ? 'غدًا' : d.toLocaleDateString('ar', { weekday: 'long' }) })
  }
  return out
}
const TIMES = [['10:00', '10 ص'], ['12:00', '12 م'], ['16:00', '4 م'], ['18:00', '6 م'], ['20:00', '8 م']] as const

/** Booking request: service, day, time, name, WhatsApp → /api/bookings. Without booking on: WhatsApp. */
export function Book({ n, options, place, label = 'أرسل طلب الحجز', pick, setPick }: { n: N; options: string[]; place: string; label?: string; pick?: string; setPick?: (v: string) => void }) {
  const [days, setDays] = useState<{ v: string; label: string }[]>([])
  useEffect(() => setDays(nextDays(5)), [])
  const [own, setOwn] = useState(options[0] || '')
  const svc = pick ?? own
  const set = setPick ?? setOwn
  const [day, setDay] = useState(0)
  const [time, setTime] = useState(3)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState('')

  if (!n.canBook) {
    return (
      <div className="n-ask">
        <p>اكتب لنا الخدمة والوقت الذي يناسبك، ونؤكّد لك الموعد.</p>
        <div className="n-row">
          {n.wa ? <a className="n-btn" href={n.waLink('مرحبًا، أريد حجز موعد')!} target="_blank" rel="noopener noreferrer">{Ic.wa} احجز على واتساب</a> : null}
          {n.tel ? <a className="n-btn ghost" href={`tel:${n.tel}`}>{Ic.phone} اتصل</a> : null}
        </div>
      </div>
    )
  }
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('اكتب اسمك.'); setState('error'); return }
    if (phone.replace(/\D/g, '').length < 7) { setErr('اكتب رقم واتساب صحيحًا.'); setState('error'); return }
    setErr('')
    if (n.preview) { setState('done'); return }
    setState('sending')
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: n.slug, type: 'appointment', name: name.trim(), phone: phone.trim(), date: days[day]?.v, time: TIMES[time][0], message: `الخدمة: ${svc}`, path: window.location.pathname }) })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) setState('done'); else { setErr('تعذّر الإرسال، حاول مرة أخرى.'); setState('error') }
    } catch { setErr('تعذّر الإرسال، حاول مرة أخرى.'); setState('error') }
  }
  if (state === 'done') return <div className="n-done" role="status"><b>وصل طلبك</b><span>{svc} · {days[day]?.label} {TIMES[time][1]}. يؤكّد لك {place} الموعد على واتساب.</span>{n.preview ? <small>معاينة: لم يُرسل هذا الطلب.</small> : null}</div>
  return (
    <form className="n-form" onSubmit={submit} noValidate>
      {options.length > 1 ? <label className="n-fl">الخدمة<select value={svc} onChange={(e) => set(e.target.value)}>{options.map((s) => <option key={s}>{s}</option>)}</select></label> : null}
      <div className="n-fl">اليوم<div className="n-chips">{days.map((d, i) => <button key={d.v} type="button" className={day === i ? 'on' : ''} aria-pressed={day === i} onClick={() => setDay(i)}>{d.label}</button>)}</div></div>
      <div className="n-fl">الوقت<div className="n-chips">{TIMES.map((t, i) => <button key={t[0]} type="button" className={time === i ? 'on' : ''} aria-pressed={time === i} onClick={() => setTime(i)}>{t[1]}</button>)}</div></div>
      <div className="n-two">
        <label className="n-fl">اسمك<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <label className="n-fl">رقم واتساب<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" autoComplete="tel" /></label>
      </div>
      {state === 'error' && err ? <p className="n-err" role="alert">{err}</p> : null}
      <button className="n-btn wide" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'جارٍ الإرسال…' : label}</button>
    </form>
  )
}

/**
 * Base CSS every view shares: buttons with a real press, chips, form, hours,
 * reveal states. Each view adds its own layer on top, scoped by its root class.
 */
export const KIT_CSS = `
.nv{background:var(--n-bg);color:var(--n-ink);font-family:var(--n-body);font-size:16px;line-height:1.75;min-height:100%;overflow-x:clip;-webkit-font-smoothing:antialiased}
.nv *{box-sizing:border-box}
.nv img{display:block;max-width:100%}
.nv a{color:inherit;text-decoration:none}
.nv h1,.nv h2,.nv h3{font-family:var(--n-disp);margin:0;line-height:1.2;text-wrap:balance}
.nv p{margin:0}
.n-w{width:min(1180px,100% - 32px);margin-inline:auto}
.n-row{display:flex;flex-wrap:wrap;gap:10px}
.n-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 22px;border-radius:var(--n-r-btn,999px);background:var(--n-acc);color:var(--n-on);font:600 15px/1 var(--n-body);border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:transform .18s cubic-bezier(.3,1.6,.5,1),background-color .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}
.n-btn:hover{background:color-mix(in srgb,var(--n-acc) 86%,var(--n-ink))}
.n-btn:active{transform:scale(.96)}
.n-btn.ghost{background:transparent;color:var(--n-ink);border-color:var(--n-line)}
.n-btn.ghost:hover{background:var(--n-acc-soft);border-color:color-mix(in srgb,var(--n-acc) 40%,var(--n-line))}
.n-btn.wide{width:100%}
.n-btn:focus-visible,.n-chips button:focus-visible{outline:2px solid var(--n-acc);outline-offset:3px}
.n-stars{display:inline-flex;gap:1px;color:var(--n-star,#f2b01e);vertical-align:-2px}.n-stars .off{opacity:.25}
.n-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.n-chips button{min-height:40px;padding:0 15px;border-radius:999px;border:1px solid var(--n-line);background:transparent;color:var(--n-ink);font:500 14px var(--n-body);cursor:pointer;transition:transform .16s cubic-bezier(.3,1.6,.5,1),background .2s,border-color .2s}
.n-chips button:active{transform:scale(.94)}
.n-chips button.on{background:var(--n-ink);color:var(--n-bg);border-color:var(--n-ink)}
.n-form{display:grid;gap:18px}
.n-fl{display:grid;gap:6px;font-size:14px;font-weight:600;color:var(--n-ink2)}
.n-fl input,.n-fl select{min-height:48px;border-radius:var(--n-r-in,12px);border:1px solid var(--n-line);background:var(--n-bg);color:var(--n-ink);padding:0 14px;font:500 16px var(--n-body)}
.n-fl input:focus,.n-fl select:focus{outline:none;border-color:var(--n-acc);box-shadow:0 0 0 3px var(--n-acc-soft)}
.n-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:520px){.n-two{grid-template-columns:1fr}}
.n-err{color:#d4483b;font-size:14px}
.n-done{display:grid;gap:6px;padding:22px;border-radius:16px;background:var(--n-acc-soft);animation:n-pop .5s cubic-bezier(.3,1.5,.5,1)}
.n-done b{font:700 20px var(--n-disp)}.n-done small{color:var(--n-mute)}
.n-ask{display:grid;gap:14px}
.n-hours{width:100%;border-collapse:collapse;font-size:15px}
.n-hours td{padding:9px 0;border-bottom:1px solid var(--n-line)}
.n-hours td:last-child{text-align:left;color:var(--n-ink2)}
.n-hours tr.today td{color:var(--n-acc);font-weight:700}
[data-r]{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--d,0)*70ms)}
[data-r].in{opacity:1;transform:none}
@keyframes n-pop{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.nv *,.nv *::before,.nv *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}[data-r]{opacity:1;transform:none}}
.n-bar{position:fixed;inset:auto 12px 12px;z-index:30;display:none;gap:8px;padding:8px;border-radius:999px;background:color-mix(in srgb,var(--n-bg) 82%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--n-line);box-shadow:0 10px 30px -12px rgba(0,0,0,.35)}
.n-bar .n-btn{flex:1;min-height:46px}
.n-bar .n-btn.sq{flex:0 0 46px;padding:0}
@media (max-width:760px){.n-bar{display:flex}.nv{padding-bottom:84px}}
`
