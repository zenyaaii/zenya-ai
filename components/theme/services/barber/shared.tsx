'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { openState } from '@/utils/services/barber'
import { KIND, isNicheKind } from '@/utils/services/kinds'
import { useBookingContext } from '@/components/site/BookingContext'
import { igHref, palette, telOf, waNumber, type Colors } from '../NicheView'

/**
 * What both barber designs read from the content. Nothing here is invented:
 * every value comes from the build questions or Google, and every list may be
 * empty, one, or many. The designs only decide how it looks.
 */
export function useBarber(content: ServiceContent, colors?: Colors) {
  const kind = isNicheKind(content.niche) ? content.niche : 'barber'
  const k = KIND[kind]
  const p = useMemo(() => palette(colors, k.looks[0].colors), [colors, k])
  const { slug, enabled, preview } = useBookingContext()
  const wa = waNumber(content)
  const waLink = (text: string) => (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null)
  const [st, setSt] = useState<ReturnType<typeof openState>>(null)
  useEffect(() => { setSt(openState(content.hours)); const t = setInterval(() => setSt(openState(content.hours)), 60_000); return () => clearInterval(t) }, [content.hours])
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const [pick, setPick] = useState(k.any)
  const bookRef = useRef<HTMLElement>(null)
  const bookWith = (name: string) => { setPick(name); bookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const b = content.brand
  const members = (content.team?.members || []).filter((m) => m.name.trim())
  const services = content.services.items.filter((s) => s.name.trim())
  const priced = services.some((s) => s.price_from)
  const reviews = content.testimonials.items.filter((r) => r.text.trim()).slice(0, 6)
  const rating = content.google?.rating ?? content.testimonials.average_rating
  const count = content.google?.count ?? (Number(content.testimonials.review_count) || undefined)
  const mapsUrl = content.google?.maps_url || content.links?.reviews_url
  const photos = content.gallery.images.map((i) => i.url).filter(Boolean)
  const hero = content.hero.image || photos[0] || ''
  const side = content.story.image || photos.find((u) => u !== hero) || ''
  const place = photos.filter((u) => u !== hero && u !== side).slice(0, 6)
  const hours = (content.hours || []).slice().sort((a, b) => a.day - b.day)
  const faq = content.faq.items.filter((f) => f.q.trim() && f.a.trim())
  const short = content.hero.headline?.trim() || b.name
  const where = b.area || b.region || b.city
  const ig = igHref(content.social_links?.instagram)
  const walkin = content.booking?.mode === 'walkin'
  const tel = content.footer.phone ? telOf(content.footer.phone) : ''
  const canBook = enabled || preview

  const vars = {
    '--bb-bg': p.bg, '--bb-bg2': p.bg2, '--bb-ink': p.ink, '--bb-ink2': p.ink2, '--bb-mute': p.mute,
    '--bb-line': p.line, '--bb-line2': p.line2, '--bb-acc': p.acc, '--bb-acc2': p.acc2, '--bb-on': p.onAcc,
    colorScheme: p.dark ? 'dark' : 'light',
  } as CSSProperties

  return {
    kind, k, p, vars, slug, preview, canBook, wa, waLink, st, scrolled, pick, setPick, bookRef, bookWith,
    b, members, services, priced, reviews, rating, count, mapsUrl, hero, side, place, hours, faq, short, where, ig, walkin, tel,
  }
}

/** Fades a section in once, the first time it is on screen. Off for reduced motion. */
export function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-rv]'))
    items.forEach((x) => x.classList.add('rv-wait'))
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
    items.forEach((x) => io.observe(x))
    return () => io.disconnect()
  }, [root])
}

/** Initials for a barber without a photo: the first letter of his name, big. */
export const initial = (n: string) => n.trim().replace(/^(ال|أبو\s|ابو\s)/, '').slice(0, 1)

/** The booking form's styles, shared: it uses the --bb-* names both designs set. */
export const FORM_CSS = `
.bb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 24px;border-radius:var(--r,6px);background:var(--bb-acc);color:var(--bb-on)!important;font:600 16px var(--body);text-decoration:none;border:0;cursor:pointer;transition:background .2s,border-color .2s}
.bb-btn:hover{background:var(--bb-acc2)}
.bb-btn[disabled]{opacity:.6;cursor:default}
.bb-form{display:grid;gap:18px}
.bb-fl{display:grid;gap:8px;font-size:14px;color:var(--bb-ink2)}
.bb-form select,.bb-form input{font:inherit;font-size:16px;color:var(--bb-ink);background:var(--bb-bg);border:1px solid var(--bb-line2);border-radius:var(--r,6px);min-height:50px;padding:0 14px;width:100%}
.bb-form select:focus,.bb-form input:focus{outline:2px solid var(--bb-acc);outline-offset:1px}
.bb-chips{display:flex;gap:6px;flex-wrap:wrap}
.bb-chips button{min-height:42px;padding:0 16px;border:1px solid var(--bb-line2);background:transparent;color:var(--bb-ink);font:500 14px var(--body);border-radius:var(--r,6px);cursor:pointer}
.bb-chips button.on{background:var(--bb-ink);color:var(--bb-bg);border-color:var(--bb-ink)}
.bb-err{color:#e07a5f;font-size:14px}
.bb-done{border:1px solid rgba(76,179,122,.45);background:rgba(76,179,122,.08);padding:18px;border-radius:var(--r,6px);display:grid;gap:4px;font-size:15px;align-content:start}
.bb-done small{color:var(--bb-mute)}
.rv-wait{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.rv-in{opacity:1;transform:none}
`
