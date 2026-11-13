'use client'

/**
 * Crafted parts the heavy themes share. Each takes its look from the theme's
 * variables and root class; none of them draws anything when it has nothing
 * to show.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Activity, Bath, Car, Coffee, Dumbbell, Flame, Flower2, Gauge, HandHeart, Heart, Lock, MapPin, Moon, ParkingCircle, Plus, Quote, ShieldCheck,
  ShowerHead, Snowflake, Sparkles, Star, Timer, Users, Wifi, Wrench, Zap, Droplets, Camera, Aperture, Package, Utensils, Building2, FileCheck,
  Printer, Truck, BadgeCheck, Scissors, SprayCan, Repeat, Award, Trophy, Waves, Video, ChevronLeft, ChevronRight, X, type LucideIcon,
} from 'lucide-react'
import { ar, type N } from './kit'

/* ---------- icons by meaning ---------- */
const ICONS: [RegExp, LucideIcon][] = [
  [/عضل|حديد|أوزان|قوة/, Dumbbell], [/تخسيس|حرق|كارديو/, Flame], [/كروس|لياقة|بطن/, Activity], [/ملاكمة|قتال/, Zap], [/شخصي|مدرب/, Users],
  [/خزائن|خزانة/, Lock], [/دُش|دش|استحمام/, ShowerHead], [/ساونا|بخار|جاكوزي/, Waves], [/مواقف|موقف/, ParkingCircle], [/واي ?فاي|انترنت|إنترنت/, Wifi],
  [/مصلى|صلاة/, Moon], [/مكيف|تكييف/, Snowflake], [/استراحة|قهوة|ضيافة|شاي/, Coffee], [/غرف خاصة|خاص|للسيدات/, Lock], [/حمام مغربي|حمام/, Bath],
  [/مساج|استرخاء/, HandHeart], [/بشرة|تنظيف/, Sparkles], [/أظافر|مناكير|باديكير/, Flower2], [/شعر|صبغة|قص|تصفيف/, Scissors], [/حواجب|رموش|مكياج|عروس/, Heart],
  [/زيت|فلتر|صيانة/, Wrench], [/فحص|كمبيوتر/, Gauge], [/فرامل/, ShieldCheck], [/كهرباء/, Zap], [/غسيل/, Droplets], [/تلميع|نانو|حماية/, SprayCan],
  [/استلام|توصيل/, Truck], [/ضمان/, BadgeCheck], [/قطع/, Package], [/سعر|السعر/, FileCheck], [/دائم|ولاء/, Repeat],
  [/منتج/, Package], [/طعام|أطباق|قائمة|مطعم/, Utensils], [/أماكن|مكتب|عقار/, Building2], [/سيار/, Car], [/رسمي|جواز|هوية|تأشيرة/, FileCheck],
  [/طباعة|مطبوع/, Printer], [/فيديو/, Video], [/بورتريه|شخصية/, Aperture], [/تعديل/, Sparkles], [/خارج/, MapPin],
  [/وقت|دقيقة|سريع/, Timer], [/جائزة|بطولة/, Trophy], [/أفضل|معتمد/, Award],
]
export function iconFor(text: string, fallback: LucideIcon = Star): LucideIcon {
  for (const [re, I] of ICONS) if (re.test(text)) return I
  return fallback
}
export function Icon({ of, size = 22, fallback, ...rest }: { of: string; size?: number; fallback?: LucideIcon; strokeWidth?: number; className?: string }) {
  const I = iconFor(of, fallback)
  return <I size={size} aria-hidden="true" {...rest} />
}

/* ---------- numbers ---------- */
/** Counts up once when it enters the view. Shows the final number to reduced motion. */
export function CountUp({ to, dec = 0, dur = 1300 }: { to: number; dec?: number; dur?: number }) {
  const [v, setV] = useState(to)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setV(0)
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t: number) => { const p = Math.min(1, (t - t0) / dur); setV(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, dur])
  return <span ref={ref}>{dec ? v.toFixed(dec) : ar(Math.round(v))}</span>
}

/** The leading number in a price ("2,200 ر.س" → 2200), or null. */
export function priceNum(p?: string): { num: number; unit: string } | null {
  const m = /^\s*([\d,.]+)\s*(.*)$/.exec(p || '')
  if (!m) return null
  const num = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(num) ? { num, unit: m[2] } : null
}

/* ---------- words lit by scroll ---------- */
/**
 * A statement whose words light up as it moves through the screen. The text
 * is real text: a reader without motion gets it whole, in full colour.
 */
export function ScrollWords({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = text.split(/\s+/).filter(Boolean)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el?.style.setProperty('--p', '1'); return }
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect(), h = window.innerHeight
        const p = Math.min(1, Math.max(0, (h * 0.85 - r.top) / (r.height + h * 0.35)))
        el.style.setProperty('--p', p.toFixed(3))
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])
  return (
    <p ref={ref} className={`b-sw ${className}`} style={{ ['--n' as string]: words.length } as CSSProperties}>
      {words.map((w, i) => <span key={i} style={{ ['--i' as string]: i } as CSSProperties}>{w} </span>)}
    </p>
  )
}

/* ---------- spotlight on cards ---------- */
/** Tracks the pointer inside each [data-spot] child, for a light that follows it. */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root || !window.matchMedia('(hover: hover)').matches) return
    const on = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-spot]')
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    root.addEventListener('pointermove', on)
    return () => root.removeEventListener('pointermove', on)
  }, [])
  return ref
}

/* ---------- questions ---------- */
export function Faq({ items, className = '' }: { items: { q: string; a: string }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0)
  if (!items.length) return null
  return (
    <div className={`b-faq ${className}`}>
      {items.map((f, i) => (
        <div key={i} className={`b-q${open === i ? ' open' : ''}`} data-r style={{ ['--d' as string]: i } as CSSProperties}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <span>{f.q}</span><i><Plus size={20} /></i>
          </button>
          <div className="b-a"><div><p>{f.a}</p></div></div>
        </div>
      ))}
    </div>
  )
}

/* ---------- reviews ---------- */
/** Rating summary beside a wall of reviews. The first review is set large. */
export function Reviews({ n, max = 6, className = '' }: { n: N; max?: number; className?: string }) {
  const list = n.reviews.slice(0, max)
  if (!list.length) return null
  const [first, ...rest] = list
  return (
    <div className={`b-rv ${className}`}>
      <div className="b-rv-sum" data-r>
        {n.rating ? <b><CountUp to={n.rating} dec={1} /></b> : null}
        {n.rating ? <span className="b-rv-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={18} fill="currentColor" strokeWidth={0} className={i < Math.round(n.rating!) ? '' : 'off'} />)}</span> : null}
        {n.count ? <small>من {ar(n.count)} تقييم على Google</small> : null}
        {n.mapsUrl ? <a href={n.mapsUrl} target="_blank" rel="noopener noreferrer" className="b-rv-link">اقرأ كل التقييمات<ChevronLeft size={16} /></a> : null}
      </div>
      <figure className="b-rv-big" data-r>
        <Quote size={34} aria-hidden="true" />
        <blockquote>{first.text}</blockquote>
        <figcaption><i>{first.name.slice(0, 1)}</i><span><b>{first.name}</b>{first.when ? <small>{first.when}</small> : null}</span></figcaption>
      </figure>
      {rest.length ? (
        <div className="b-rv-wall">
          {rest.map((r, i) => (
            <figure key={i} data-r style={{ ['--d' as string]: i } as CSSProperties}>
              <span className="b-rv-stars sm">{Array.from({ length: 5 }, (_, k) => <Star key={k} size={13} fill="currentColor" strokeWidth={0} className={k < Math.round(r.rating || 5) ? '' : 'off'} />)}</span>
              <blockquote>{r.text}</blockquote>
              <figcaption><i>{r.name.slice(0, 1)}</i><span><b>{r.name}</b>{r.when ? <small>{r.when}</small> : null}</span></figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ---------- where we are ---------- */
/** A drawn map card (no third-party map loads) with the address and a button to the real map. */
export function MapCard({ n, address }: { n: N; address?: string }) {
  const where = [address, n.where].filter(Boolean).join('، ')
  if (!where && !n.mapsUrl) return null
  return (
    <div className="b-map" data-r>
      <svg className="b-map-art" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="b-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="currentColor" strokeOpacity=".08" /></pattern></defs>
        <rect width="400" height="260" fill="url(#b-grid)" />
        <path d="M-10 190 C80 160 120 210 210 150 S330 90 410 120" fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="14" strokeLinecap="round" />
        <path d="M120 -10 C140 80 110 150 160 270" fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth="9" />
        <path d="M260 -10 L300 270" fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="6" />
        <path d="M-10 60 L410 90" fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="6" />
      </svg>
      <span className="b-map-pin"><MapPin size={26} /></span>
      <div className="b-map-txt">
        {where ? <b>{where}</b> : null}
        {n.mapsUrl ? <a className="n-btn" href={n.mapsUrl} target="_blank" rel="noopener noreferrer">افتح في الخرائط</a> : null}
      </div>
    </div>
  )
}

/* ---------- gallery with a viewer ---------- */
export function Lightbox({ urls, at, onClose, alt }: { urls: string[]; at: number | null; onClose: () => void; alt: string }) {
  const [i, setI] = useState(at ?? 0)
  useEffect(() => { if (at !== null) setI(at) }, [at])
  useEffect(() => {
    if (at === null) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') setI((v) => (v + 1) % urls.length); if (e.key === 'ArrowRight') setI((v) => (v - 1 + urls.length) % urls.length) }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [at, urls.length, onClose])
  if (at === null || !urls.length) return null
  return (
    <div className="b-lb" role="dialog" aria-modal="true" aria-label="معرض الصور" onClick={onClose}>
      <img key={i} src={urls[i]} alt={`${alt} ${i + 1}`} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="b-lb-x" aria-label="إغلاق" onClick={onClose}><X size={24} /></button>
      {urls.length > 1 ? <>
        <button type="button" className="b-lb-n prev" aria-label="السابقة" onClick={(e) => { e.stopPropagation(); setI((v) => (v - 1 + urls.length) % urls.length) }}><ChevronRight size={26} /></button>
        <button type="button" className="b-lb-n next" aria-label="التالية" onClick={(e) => { e.stopPropagation(); setI((v) => (v + 1) % urls.length) }}><ChevronLeft size={26} /></button>
        <span className="b-lb-c">{ar(i + 1)} / {ar(urls.length)}</span>
      </> : null}
    </div>
  )
}

/** Section heading with an optional link to the page that holds the rest. */
export function Head({ title, sub, more, children, className = '' }: { title: ReactNode; sub?: ReactNode; more?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`b-head ${className}`} data-r>
      <div><h2>{title}</h2>{sub ? <p>{sub}</p> : null}{children}</div>
      {more ? <div className="b-more">{more}</div> : null}
    </div>
  )
}

export const BLOCKS_CSS = `
.b-sw span{color:color-mix(in srgb,var(--n-ink) calc(18% + 82% * clamp(0, (var(--p,0) * var(--n) - var(--i)) , 1)),var(--n-bg));transition:color .15s linear}
.b-faq{display:grid}
.b-q{border-bottom:1px solid var(--n-line)}
.b-q>button{all:unset;cursor:pointer;box-sizing:border-box;width:100%;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px 0;font:600 clamp(17px,2vw,20px)/1.45 var(--n-body)}
.b-q>button:focus-visible{outline:2px solid var(--n-acc);outline-offset:4px}
.b-q i{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;border:1px solid var(--n-line);transition:transform .45s cubic-bezier(.3,1.4,.5,1),background .3s,color .3s}
.b-q.open i{transform:rotate(135deg);background:var(--n-acc);color:var(--n-on);border-color:transparent}
.b-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.2,.8,.2,1)}
.b-q.open .b-a{grid-template-rows:1fr}
.b-a>div{overflow:hidden}
.b-a p{padding:0 0 24px;color:var(--n-ink2);max-width:62ch;font-size:16px}
.b-rv{display:grid;grid-template-columns:minmax(220px,.7fr) 1.5fr;gap:20px 48px;align-items:start}
.b-rv-sum{grid-column:1;grid-row:1/span 2;display:grid;gap:8px;align-content:start;position:sticky;top:calc(var(--s-head,72px) + 24px)}
.b-rv-sum b{font:800 clamp(80px,10vw,140px)/.9 var(--n-disp);letter-spacing:-.03em}
.b-rv-stars{display:inline-flex;gap:2px;color:var(--n-star,#f2b01e)}.b-rv-stars .off{opacity:.25}
.b-rv-sum small{color:var(--n-mute);font-size:14px}
.b-rv-link{display:inline-flex;align-items:center;gap:4px;font-weight:600;margin-top:6px;border-bottom:1px solid currentColor;width:max-content;padding-bottom:2px}
.b-rv-big{grid-column:2;margin:0;display:grid;gap:18px;padding-bottom:28px;border-bottom:1px solid var(--n-line)}
.b-rv-big>svg{color:var(--n-acc)}
.b-rv-big blockquote{margin:0;font:600 clamp(24px,3vw,38px)/1.35 var(--n-disp)}
.b-rv figcaption{display:flex;align-items:center;gap:10px;font-size:14px}
.b-rv figcaption i{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font:700 16px var(--n-disp);font-style:normal;background:var(--n-acc-soft);color:var(--n-ink)}
.b-rv figcaption span{display:grid;line-height:1.3}.b-rv figcaption small{color:var(--n-mute)}
.b-rv-wall{grid-column:2;columns:2;column-gap:16px}
.b-rv-wall figure{break-inside:avoid;margin:0 0 16px;padding:22px;border-radius:var(--n-r-card,14px);background:var(--n-bg2);border:1px solid var(--n-line);display:grid;gap:12px}
.b-rv-wall blockquote{margin:0;font-size:16px}
@media (max-width:860px){.b-rv{grid-template-columns:1fr}.b-rv-sum{position:static;grid-row:auto}.b-rv-big{grid-column:1}.b-rv-wall{grid-column:1;columns:1}}
.b-map{position:relative;min-height:300px;border-radius:var(--n-r-card,14px);overflow:hidden;background:var(--n-bg2);color:var(--n-ink);border:1px solid var(--n-line);display:grid;align-content:end}
.b-map-art{position:absolute;inset:0;width:100%;height:100%}
.b-map-pin{position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:50% 50% 50% 0;rotate:-45deg;display:grid;place-items:center;background:var(--n-acc);color:var(--n-on);box-shadow:0 10px 20px -12px rgba(0,0,0,.45);animation:b-drop 1s cubic-bezier(.3,1.6,.5,1) both}
.b-map-pin svg{rotate:45deg}
.b-map-pin::after{content:"";position:absolute;inset:-10px;border-radius:inherit;border:2px solid var(--n-acc);opacity:0;animation:b-ring 2.4s 1s infinite}
@keyframes b-drop{from{transform:translate(-50%,-160%);opacity:0}}
@keyframes b-ring{0%{opacity:.6;transform:scale(.8)}100%{opacity:0;transform:scale(1.6)}}
.b-map-txt{position:relative;margin:16px;padding:18px;border-radius:calc(var(--n-r-card,14px) - 4px);background:color-mix(in srgb,var(--n-bg) 90%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.b-map-txt b{font-size:16px}
.b-lb{position:fixed;inset:0;z-index:80;background:rgba(8,8,8,.94);display:grid;place-items:center;padding:56px 12px;animation:b-fade .3s both}
@keyframes b-fade{from{opacity:0}}
.b-lb img{max-width:min(1200px,100%);max-height:100%;object-fit:contain;border-radius:6px;animation:b-zoom .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes b-zoom{from{opacity:0;transform:scale(.94)}}
.b-lb button{all:unset;cursor:pointer;position:absolute;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff}
.b-lb button:hover{background:rgba(255,255,255,.2)}
.b-lb-x{top:14px;left:14px}.b-lb-n.prev{right:14px;top:50%}.b-lb-n.next{left:14px;top:50%}
.b-lb-c{position:absolute;bottom:18px;color:#fff;font-size:14px;opacity:.7}
.b-head{display:flex;justify-content:space-between;align-items:end;gap:20px 40px;flex-wrap:wrap;margin-bottom:40px}
.b-head h2{font-size:clamp(38px,5.6vw,80px);line-height:1;font-weight:800}
.b-head p{margin-top:14px;color:var(--n-ink2);max-width:52ch;font-size:17px}
.b-more .n-btn{gap:6px}
`
