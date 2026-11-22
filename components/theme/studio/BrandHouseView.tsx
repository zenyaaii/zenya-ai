"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Alexandria, IBM_Plex_Sans_Arabic, Lalezar, Readex_Pro } from 'next/font/google'
import type { BrandContent } from '@/utils/studio/brand'
import { digits, profileUrl } from '@/utils/studio/brand'

/**
 * «بيت العلامة» — a brand site of several pages (Anas, 2026-11-21: «صفحة
 * واحدة بس… مش قوي»). SAMPLE for review, not wired to the builder yet.
 *
 * Pages: الرئيسية · قصتنا · كيف نصنع · منتجاتنا (+ a page per product) ·
 * تواصل. Pages live behind the hash (#/story, #/p/2), so the same component
 * works in the editor preview, the public site and a demo without new routes.
 * A page with nothing in it is not in the menu.
 *
 * Two looks over the same data (BrandContent, utils/studio/brand.ts):
 *  - 'tropic' «موسم»: full-bleed photos, a heavy poster face, bands of the
 *    brand's own colour. Strong; needs real photos to carry it.
 *  - 'shelf'  «رفّ»: product first, packshots on coloured plinths, big size
 *    numerals, calm paper. Holds up with few photos; less emotional.
 *
 * Every word and picture comes from the build answers; nothing is written
 * here except the fixed labels.
 *
 * Anas, 2026-11-22: both looks ship, «موسم» first; the owner picks one in the
 * review step and can switch in the editor (content.studio.design).
 */

const lalezar = Lalezar({ subsets: ['arabic'], weight: ['400'], display: 'swap' })
const readex = Readex_Pro({ subsets: ['arabic'], weight: ['400', '600'], display: 'swap' })
const alex = Alexandria({ subsets: ['arabic'], weight: ['500', '700', '800'], display: 'swap' })
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '600'], display: 'swap' })

export type HouseLook = 'tropic' | 'shelf'
type Page = { id: 'home' } | { id: 'story' } | { id: 'make' } | { id: 'products' } | { id: 'product'; i: number } | { id: 'contact' }

const BASE = { background: '#FBF3E2', surface: '#F1E3C3', text: '#14261A', muted: '#55615A', accent: '#1F6A2E', primary: '#0F7C8C', border: '#E6D9BC' }

function parse(h: string): Page {
  const m = h.replace(/^#\/?/, '').split('/')
  if (m[0] === 'story') return { id: 'story' }
  if (m[0] === 'make') return { id: 'make' }
  if (m[0] === 'products') return { id: 'products' }
  if (m[0] === 'contact') return { id: 'contact' }
  if (m[0] === 'p' && /^\d+$/.test(m[1] || '')) return { id: 'product', i: +m[1] }
  return { id: 'home' }
}

const NETS: { key: keyof BrandContent['links']; label: string }[] = [
  { key: 'instagram', label: 'إنستغرام' }, { key: 'tiktok', label: 'تيك توك' }, { key: 'facebook', label: 'فيسبوك' },
  { key: 'snapchat', label: 'سناب شات' }, { key: 'x', label: 'إكس' }, { key: 'youtube', label: 'يوتيوب' },
]

const CSS = `
.bh{--g:20px;background:var(--paper);color:var(--ink);font-family:var(--b);font-size:16px;line-height:1.85;direction:rtl;-webkit-font-smoothing:antialiased;min-height:100dvh;overflow-x:clip}
.bh *{box-sizing:border-box}.bh img{display:block;max-width:100%}
.bh a{color:inherit;text-decoration:none}
.bh .in{max-width:1200px;margin:0 auto;padding:0 var(--g)}
.bh h1,.bh h2,.bh h3{font-family:var(--d);margin:0;line-height:1.25;text-wrap:balance}
.bh p{margin:0}
.bh .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;border-radius:99px;font-weight:600;font-size:15px;background:var(--brand);color:var(--on);transition:transform .2s cubic-bezier(.2,.8,.2,1),background .2s}
.bh .btn:active{transform:scale(.97)}
.bh .btn.ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
.bh .lnk{font-weight:600;color:var(--brand);border-bottom:1.5px solid currentColor;padding-bottom:2px}
.bh .eb{font-size:13px;font-weight:600;letter-spacing:0;color:var(--sea)}

/* header */
.bh .hd{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--rule)}
.bh .hd .in{display:flex;align-items:center;justify-content:space-between;gap:12px;height:64px}
.bh .lg{display:flex;align-items:center;gap:10px;font-family:var(--d);font-size:24px;color:var(--brand)}
.bh .lg img{height:40px;width:auto;max-width:140px;object-fit:contain}
.bh .nav{display:none;gap:4px;font-size:14.5px}
.bh .nav a{padding:8px 14px;border-radius:99px;color:var(--soft)}
.bh .nav a[aria-current]{color:var(--ink);background:var(--shelf)}
.bh .hd .btn{min-height:40px;padding:0 18px;font-size:14px}
.bh .mb{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:99px;border:1px solid var(--rule);background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.bh .hd .acts{display:flex;align-items:center;gap:8px}
.bh .hd .acts .btn{display:none}
.bh .sheet{position:fixed;inset:64px 0 0 0;z-index:19;background:var(--paper);padding:24px var(--g);display:flex;flex-direction:column;gap:4px;animation:bhIn .25s ease}
.bh .sheet a{font-family:var(--d);font-size:30px;padding:10px 0;border-bottom:1px solid var(--rule)}
.bh .sheet a[aria-current]{color:var(--brand)}
.bh .sheet .btn{margin-top:20px;font-family:var(--b);font-size:16px;border:0}
@keyframes bhIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}

/* reveal */
.bh [data-r]{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}
.bh [data-r].on{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.bh [data-r]{opacity:1;transform:none;transition:none}}

/* shared blocks */
.bh section{padding:64px 0}
.bh .sh{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:28px}
.bh .sh h2{font-size:34px}
.bh .prods{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:16px}
.bh .pc{display:flex;flex-direction:column;border-radius:24px;overflow:hidden;background:var(--shelf);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.bh .pc:hover{transform:translateY(-4px)}
.bh .pc .st{position:relative;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;padding:28px}
.bh .pc .st img{position:absolute;inset:28px;width:calc(100% - 56px);height:calc(100% - 56px);object-fit:contain;filter:drop-shadow(0 18px 22px rgb(0 0 0/.18))}
.bh .pc .st img.cov,.bh .pd .st img.cov{inset:0;width:100%;height:100%;object-fit:cover;filter:none}
.bh .pc .mono{font-family:var(--d);font-size:72px;color:var(--brand);opacity:.35}
.bh .pc .tx{padding:18px 20px 22px;display:grid;gap:4px}
.bh .pc h3{font-size:20px}
.bh .pc .sz{font-family:var(--d);font-size:15px;color:var(--sea)}
.bh .pc p{font-size:14.5px;color:var(--soft)}
.bh .bens{display:grid;grid-template-columns:1fr;gap:0}
.bh .ben{display:grid;grid-template-columns:44px 1fr;gap:12px;padding:18px 0;border-top:1px solid var(--line)}
.bh .ben b{font-family:var(--d);font-size:22px;line-height:1.2;color:var(--acc2)}
.bh .ben h3{font-size:19px;margin-bottom:2px}
.bh .ben p{font-size:15px;opacity:.78}
.bh .prods.rail{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:78%;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 calc(var(--g)*-1);padding:0 var(--g) 6px;scrollbar-width:none}
.bh .prods.rail::-webkit-scrollbar{display:none}
.bh .prods.rail>*{scroll-snap-align:start}
.bh .gal{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bh .gal img{width:100%;height:100%;object-fit:cover;border-radius:18px;background:var(--shelf);aspect-ratio:1}
.bh .gal img:first-child{grid-column:span 2;aspect-ratio:16/10}
.bh .steps{display:grid;gap:36px;counter-reset:s}
.bh .step{display:grid;gap:16px;align-items:center}
.bh .step img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:24px}
.bh .step .n{font-family:var(--d);font-size:56px;line-height:1;color:var(--brand)}
.bh .step h3{font-size:26px;margin:6px 0 8px}
.bh .step p{color:var(--soft);font-size:16.5px;max-width:52ch}
.bh .vals{display:grid;grid-template-columns:1fr;gap:14px}
.bh .val{padding:22px;border-radius:20px;background:var(--shelf)}
.bh .val h3{font-size:21px;margin-bottom:4px}
.bh .val p{font-size:15px;color:var(--soft)}
.bh .quote{font-family:var(--d);font-size:30px;line-height:1.45;color:var(--brand);max-width:24ch}
.bh .sig{margin-top:14px;font-size:14px;color:var(--soft)}
.bh .phero{position:relative;min-height:56dvh;display:flex;align-items:flex-end;color:#fff;overflow:hidden}
.bh .phero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.bh .phero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgb(0 0 0/.62),rgb(0 0 0/.06) 60%)}
.bh .phero .in{position:relative;z-index:1;width:100%;padding-bottom:36px}
.bh .phero h1{font-size:46px}
.bh .phero .eb{color:#fff;opacity:.85}
.bh .plain{padding-top:48px;padding-bottom:8px}
.bh .plain h1{font-size:44px}
.bh .cta{background:var(--brand);color:var(--on);border-radius:32px;padding:40px 24px;display:grid;gap:18px;text-align:start}
.bh .cta h2{font-size:34px}
.bh .cta .btn{background:var(--on);color:var(--brand);justify-self:start}
.bh .cta p{opacity:.85}
.bh .ft{background:var(--deep);color:var(--on);padding:48px 0 28px;margin-top:64px}
.bh .ft .cols{display:grid;gap:28px}
.bh .ft .lg{color:var(--on)}
.bh .ft .lg img{background:#fff;border-radius:12px;padding:6px 10px;height:48px}
.bh .ft h4{margin:0 0 10px;font-size:13px;opacity:.65;font-weight:600}
.bh .ft ul{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:15px}
.bh .ft .base{margin-top:36px;padding-top:18px;border-top:1px solid rgb(255 255 255/.16);font-size:12.5px;opacity:.6}
.bh .rows{display:grid;gap:0}
.bh .row{display:grid;gap:2px;padding:18px 0;border-top:1px solid var(--rule)}
.bh .row span{font-size:13px;color:var(--soft)}
.bh .row a,.bh .row b{font-family:var(--d);font-size:22px;font-weight:400;direction:ltr;text-align:right;unicode-bidi:plaintext}
.bh .pd{display:grid;gap:28px;padding-top:32px}
.bh .pd .st{border-radius:32px;background:var(--shelf);aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;overflow:hidden}
.bh .pd .st img{position:absolute;inset:40px;width:calc(100% - 80px);height:calc(100% - 80px);object-fit:contain;filter:drop-shadow(0 24px 28px rgb(0 0 0/.2))}
.bh .pd .big{position:absolute;inset:auto 0 -0.18em 0;text-align:center;font-family:var(--d);font-size:min(34vw,220px);line-height:1;color:var(--brand);opacity:.12;white-space:nowrap}
.bh .pd h1{font-size:40px}
.bh .pd .sz{font-family:var(--d);font-size:22px;color:var(--sea)}
.bh .pd .lead{font-size:18px;color:var(--soft);margin:12px 0 22px}
.bh .pd .meta{display:grid;gap:0;margin:22px 0}
.bh .crumb{font-size:13.5px;color:var(--soft);padding-top:20px}
.bh .crumb a{color:var(--brand)}
.bh .note{margin-top:24px;padding:18px 20px;border-radius:18px;border:1px dashed var(--rule);font-size:15px;color:var(--soft)}

/* ——— «موسم» tropic ——— */
.bh.t{--line:rgb(255 255 255/.18);--acc2:var(--sun)}
.bh.t .hero{position:relative;min-height:calc(100dvh - 64px);display:flex;align-items:flex-end;color:#fff;overflow:hidden}
.bh.t .hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:35% 60%;transform:scale(1.06);animation:bhZoom 1.6s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes bhZoom{to{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.bh.t .hero>img{animation:none;transform:none}}
.bh.t .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,color-mix(in srgb,var(--deep) 92%,transparent) 0%,rgb(0 0 0/.18) 55%,rgb(0 0 0/.05))}
.bh.t .hero .in{position:relative;z-index:1;width:100%;padding-bottom:40px;display:grid;gap:18px}
.bh.t .hero h1{font-size:clamp(52px,15vw,132px);line-height:.98;max-width:9ch;font-weight:400}
.bh.t .hero h1[data-long]{font-size:clamp(38px,9vw,76px);max-width:16ch;line-height:1.15}
.bh.t .hero p{font-size:17px;max-width:40ch;opacity:.9}
.bh.t .hero .eb{color:var(--sun)}
.bh.t .hero .btns{display:flex;gap:10px;flex-wrap:wrap}
.bh.t .hero .btn{background:var(--sun);color:var(--deep)}
.bh.t .hero .btn.ghost{background:transparent;color:#fff}
.bh.t h1,.bh.t h2{font-weight:400}
.bh.t .sh h2,.bh.t .cta h2{font-size:42px}
.bh.t .band{background:var(--deep);color:var(--on);position:relative;overflow:hidden}
.bh.t .band .eb{color:var(--sun)}
.bh.t .band .deco{position:absolute;width:62%;max-width:520px;inset-inline-start:-14%;bottom:-8%;opacity:.95;pointer-events:none}
.bh.t .band .in{position:relative}
.bh.t .story2{display:grid;gap:24px}
.bh.t .story2 img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:28px}
.bh.t .story2 .quote{font-size:34px}
.bh.t .pc{background:var(--shelf)}
.bh.t .pc .st{background:radial-gradient(circle at 50% 62%,color-mix(in srgb,var(--sun) 55%,transparent),transparent 62%)}
.bh.t .pc h3{font-size:24px}
.bh.t .marq{background:var(--sun);color:var(--deep);overflow:hidden;white-space:nowrap;font-family:var(--d);font-size:28px;padding:10px 0}
.bh.t .marq div{display:inline-flex;gap:36px;padding-inline-end:36px;animation:bhMq 32s linear infinite}
@keyframes bhMq{to{transform:translateX(50%)}}
@media (prefers-reduced-motion:reduce){.bh.t .marq div{animation:none}}

/* ——— «رفّ» shelf ——— */
.bh.s{--line:var(--rule);--acc2:var(--brand);--d:var(--d2)}
.bh.s h1,.bh.s h2,.bh.s h3{font-weight:800;letter-spacing:0}
.bh.s .hero{padding:28px 0 8px}
.bh.s .hero .grid{display:grid;gap:24px;align-items:center}
.bh.s .hero h1{font-size:clamp(40px,10vw,76px);line-height:1.1}
.bh.s .hero p{font-size:17.5px;color:var(--soft);margin-top:14px;max-width:42ch}
.bh.s .hero .btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
.bh.s .plinth{position:relative;border-radius:36px;background:var(--brand);aspect-ratio:1;display:flex;align-items:flex-end;justify-content:center;gap:4%;padding:12% 8% 14%;overflow:hidden}
.bh.s .plinth::before{content:"";position:absolute;inset:auto -10% -38% -10%;height:62%;border-radius:50%;background:color-mix(in srgb,var(--on) 18%,transparent)}
.bh.s .plinth img{position:relative;height:100%;align-self:flex-end;width:auto;max-width:34%;object-fit:contain;filter:drop-shadow(0 22px 22px rgb(0 0 0/.28))}
.bh.s .plinth img.ph{position:absolute;inset:0;height:100%;width:100%;max-width:none;object-fit:cover;filter:none}
.bh.s .sizes{display:flex;gap:8px;flex-wrap:wrap;margin-top:22px}
.bh.s .sizes a{padding:8px 14px;border-radius:99px;background:var(--shelf);font-weight:600;font-size:14px}
.bh.s .pc{background:var(--card);border:1px solid var(--rule)}
.bh.s .pc .st{background:var(--shelf);margin:8px;border-radius:18px}
.bh.s .pc .sz{font-size:30px;color:var(--brand);font-family:var(--d)}
.bh.s .strip{display:grid;gap:18px;align-items:center}
.bh.s .strip img{width:100%;aspect-ratio:16/11;object-fit:cover;border-radius:28px}
.bh.s .why{background:var(--shelf);border-radius:36px;padding:36px 22px}
.bh.s .chk{display:grid;grid-template-columns:1fr;gap:10px}
.bh.s .chk>div{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;background:var(--card);border-radius:18px;padding:16px}
.bh.s .chk i{width:28px;height:28px;border-radius:99px;background:var(--brand);color:var(--on);display:grid;place-items:center;font-style:normal;font-size:14px;font-weight:700}
.bh.s .chk h3{font-size:17px}
.bh.s .chk p{font-size:14.5px;color:var(--soft)}
.bh.s .ft{background:var(--ink)}

@media (min-width:760px){
  .bh{--g:32px}
  .bh section{padding:96px 0}
  .bh .nav{display:flex}
  .bh .mb{display:none}
  .bh .hd .acts .btn{display:inline-flex}
  .bh .prods.rail{grid-auto-flow:row;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));grid-auto-columns:auto;overflow:visible;margin:0;padding:0}
  .bh .gal{grid-template-columns:repeat(4,1fr)}
  .bh .gal img:first-child{grid-column:span 2;grid-row:span 2;aspect-ratio:auto}
  .bh .bens{grid-template-columns:1fr 1fr;column-gap:48px}
  .bh .vals{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
  .bh .step{grid-template-columns:1fr 1fr;gap:56px}
  .bh .step:nth-child(even) img{order:2}
  .bh .step.np{grid-template-columns:1fr}
  .bh .ft .cols{grid-template-columns:1.4fr 1fr 1fr 1fr}
  .bh .pd{grid-template-columns:1.1fr 1fr;gap:56px;align-items:center}
  .bh .pd h1{font-size:54px}
  .bh .cta{grid-template-columns:1fr auto;align-items:center;padding:56px}
  .bh .phero h1,.bh .plain h1{font-size:64px}
  .bh.t .story2{grid-template-columns:5fr 6fr;gap:64px;align-items:center}
  .bh.t .story2 .quote{font-size:44px}
  .bh.t .hero .in{padding-bottom:72px}
  .bh.s .hero{padding:56px 0 16px}
  .bh.s .hero .grid{grid-template-columns:1.05fr 1fr;gap:56px}
  .bh.s .strip{grid-template-columns:1fr 1fr;gap:56px}
  .bh.s .why{padding:64px 56px}
  .bh.s .chk{grid-template-columns:repeat(3,1fr)}
}
`

/** A cut-out (PNG, kept with its transparency) stands on the stage; a photograph fills it. */
const cut = (u?: string) => !!u && /\.(png|webp)(\?|$)/i.test(u)

const AR_NUM = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠']

export default function BrandHouseView({ content: c, colorOverrides, look = 'tropic', className }: { content: BrandContent; colorOverrides?: Record<string, string>; look?: HouseLook; className?: string }) {
  const k = { ...BASE, ...(colorOverrides || {}) }
  const vars = {
    '--paper': k.background, '--ink': k.text, '--soft': k.muted, '--brand': k.accent, '--sea': k.primary, '--shelf': k.surface, '--rule': k.border,
    '--deep': `color-mix(in srgb, ${k.accent} 62%, #05140a)`, '--sun': '#F6C445', '--on': '#FFFDF6', '--card': '#FFFDF8',
    '--d': `${look === 'tropic' ? lalezar.style.fontFamily : alex.style.fontFamily}, sans-serif`,
    '--d2': `${alex.style.fontFamily}, sans-serif`,
    '--b': `${look === 'tropic' ? readex.style.fontFamily : plex.style.fontFamily}, system-ui, sans-serif`,
  } as React.CSSProperties

  const [page, setPage] = useState<Page>({ id: 'home' })
  const [menu, setMenu] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = () => { setPage(parse(window.location.hash)); setMenu(false); root.current?.scrollIntoView({ block: 'start' }); window.scrollTo({ top: 0 }) }
    on()
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  // Reveal on scroll, once per element; re-armed on every page change.
  useEffect(() => {
    const els = root.current?.querySelectorAll('[data-r]') || []
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('on')); return }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [page])

  const wa = digits(c.contact.whatsapp)
  const tel = digits(c.contact.phone)
  const action = useMemo(() => {
    if (c.buy === 'whatsapp' && wa) return { href: `https://wa.me/${wa.replace('+', '')}`, label: 'اطلب على واتساب', ask: 'اطلبه على واتساب' }
    if (c.buy === 'store' && c.links.store) return { href: profileUrl('website', c.links.store)!, label: 'تسوّق الآن', ask: 'اطلبه من المتجر' }
    if (c.buy === 'email' && c.contact.email) return { href: `mailto:${c.contact.email}`, label: 'راسلنا', ask: 'اسأل عنه بالبريد' }
    if (c.buy === 'instagram' && c.links.instagram) return { href: profileUrl('instagram', c.links.instagram)!, label: 'راسلنا على إنستغرام', ask: 'اطلبه برسالة على إنستغرام' }
    if (tel) return { href: `tel:${tel}`, label: 'اتصل بنا', ask: 'اطلبه بالهاتف' }
    if (wa) return { href: `https://wa.me/${wa.replace('+', '')}`, label: 'تواصل على واتساب', ask: 'اطلبه على واتساب' }
    if (c.contact.email) return { href: `mailto:${c.contact.email}`, label: 'راسلنا', ask: 'اسأل عنه بالبريد' }
    // A brand that sells by Instagram messages.
    const ig = profileUrl('instagram', c.links.instagram)
    if (ig) return { href: ig, label: 'راسلنا على إنستغرام', ask: 'اطلبه برسالة على إنستغرام' }
    return null
  }, [c, wa, tel])
  const social = NETS.map((n) => ({ ...n, href: profileUrl(n.key, c.links[n.key]) })).filter((n) => n.href)

  const P = c.products.items
  const has = {
    story: c.story.paragraphs.length > 0 || c.values.items.length > 0 || !!c.story.quote,
    make: c.steps.items.length > 0,
    products: P.length > 0,
    contact: !!(tel || wa || c.contact.email || c.contact.address || social.length),
  }
  const nav = [
    { id: 'home', label: 'الرئيسية', href: '#/' },
    has.story && { id: 'story', label: 'قصتنا', href: '#/story' },
    has.make && { id: 'make', label: 'كيف نصنع', href: '#/make' },
    has.products && { id: 'products', label: 'منتجاتنا', href: '#/products' },
    has.contact && { id: 'contact', label: 'تواصل', href: '#/contact' },
  ].filter(Boolean) as { id: string; label: string; href: string }[]
  const cur = page.id === 'product' ? 'products' : page.id

  const gallery = c.gallery.images
  const name = c.brand.name

  const prodCard = (p: (typeof P)[number], i: number) => (
    <a key={i} href={`#/p/${i}`} className="pc" data-r>
      <div className="st">{p.photo ? <img className={cut(p.photo) ? undefined : 'cov'} src={p.photo} alt={`${p.name}${p.size ? ' ' + p.size : ''}`} loading="lazy" /> : <span className="mono">{name.slice(0, 1)}</span>}</div>
      <div className="tx">
        {look === 'shelf' && p.size ? <span className="sz">{p.size}</span> : null}
        <h3>{p.name}</h3>
        {look === 'tropic' && p.size ? <span className="sz">{p.size}</span> : null}
        {p.text ? <p>{p.text}</p> : null}
        {p.price ? <p><b>{p.price}</b></p> : null}
      </div>
    </a>
  )

  const benefits = (max?: number) => c.benefits.items.length > 0 && (
    <div className="bens">
      {c.benefits.items.slice(0, max).map((b, i) => (
        <div className="ben" key={i} data-r><b>{AR_NUM[i] || i + 1}</b><div><h3>{b.title}</h3>{b.text ? <p>{b.text}</p> : null}</div></div>
      ))}
    </div>
  )

  const checks = (max?: number) => c.benefits.items.length > 0 && (
    <div className="chk">
      {c.benefits.items.slice(0, max).map((b, i) => (
        <div key={i} data-r><i aria-hidden>✓</i><div><h3>{b.title}</h3>{b.text ? <p>{b.text}</p> : null}</div></div>
      ))}
    </div>
  )

  const cta = action && (
    <section><div className="in"><div className="cta" data-r>
      <div><h2>{look === 'tropic' ? `جرّب ${name}` : `اطلب ${name}`}</h2>{c.products.note ? <p style={{ marginTop: 8 }}>{c.products.note}</p> : c.brand.tagline ? <p style={{ marginTop: 8 }}>{c.brand.tagline}</p> : null}</div>
      <a className="btn" href={action.href}>{action.label}</a>
    </div></div></section>
  )

  const galleryBlock = gallery.length > 0 && (
    <section><div className="in">
      <div className="sh"><h2>{c.gallery.heading}</h2></div>
      <div className="gal">{gallery.slice(0, 7).map((g, i) => <img key={i} src={g} alt="" loading="lazy" data-r />)}</div>
    </div></section>
  )

  /* ——— pages ——— */
  const home = look === 'tropic' ? (
    <>
      <div className="hero">
        {c.hero.photo ? <img src={c.hero.photo} alt="" /> : null}
        <div className="in">
          {c.brand.kind ? <span className="eb">{c.brand.kind}{c.brand.city ? ` · ${c.brand.city}` : ''}</span> : null}
          <h1 data-long={(c.brand.tagline || name).length > 34 || undefined}>{c.brand.tagline || name}</h1>
          {c.brand.intro ? <p>{c.brand.intro}</p> : null}
          <div className="btns">
            {has.products ? <a className="btn" href="#/products">منتجاتنا</a> : action ? <a className="btn" href={action.href}>{action.label}</a> : null}
            {has.story ? <a className="btn ghost" href="#/story">قصتنا</a> : null}
          </div>
        </div>
      </div>
      {c.values.items.length > 0 && <div className="marq" aria-hidden><div>{[...c.values.items, ...c.values.items].map((v, i) => <span key={i}>{v.title} ✦</span>)}</div></div>}
      {has.products && (
        <section><div className="in">
          <div className="sh"><div><span className="eb">{P.length} {P.length > 2 ? 'أحجام' : 'منتج'}</span><h2>{c.products.heading}</h2></div><a className="lnk" href="#/products">كل المنتجات</a></div>
          <div className="prods rail">{P.slice(0, 3).map(prodCard)}</div>
        </div></section>
      )}
      {c.benefits.items.length > 0 && (
        <section className="band">
          <div className="in">
            <div className="sh"><div><span className="eb">لماذا {name}</span><h2>{c.benefits.heading}</h2></div></div>
            {benefits(6)}
            {c.benefits.items.length > 6 && has.products ? <p style={{ marginTop: 24 }}><a className="lnk" style={{ color: 'var(--sun)' }} href="#/products">كل الفوائد</a></p> : null}
          </div>
        </section>
      )}
      {has.story && (
        <section><div className="in story2">
          {c.story.photo ? <img src={c.story.photo} alt="" loading="lazy" data-r /> : null}
          <div data-r>
            <span className="eb">{c.story.heading}</span>
            {c.story.quote ? <p className="quote" style={{ marginTop: 10 }}>«{c.story.quote}»</p> : <p className="quote">{c.story.paragraphs[0]}</p>}
            {c.story.quote && c.story.paragraphs[0] ? <p style={{ marginTop: 18, color: 'var(--soft)', maxWidth: '52ch' }}>{c.story.paragraphs[0]}</p> : null}
            <p style={{ marginTop: 22 }}><a className="lnk" href="#/story">اقرأ قصتنا</a></p>
          </div>
        </div></section>
      )}
      {has.make && (
        <section style={{ paddingTop: 0 }}><div className="in">
          <div className="sh"><h2>{c.steps.heading}</h2><a className="lnk" href="#/make">الرحلة كاملة</a></div>
          {c.steps.items.some((s) => s.photo) ? (
            <div className="prods rail">{c.steps.items.map((s, i) => (
            <a key={i} href="#/make" className="pc" data-r style={{ background: 'transparent' }}>
              {s.photo ? <img src={s.photo} alt="" loading="lazy" style={{ aspectRatio: '4/3', objectFit: 'cover', borderRadius: 24, width: '100%' }} /> : <div style={{ aspectRatio: '4/3', borderRadius: 24, background: 'var(--shelf)', display: 'grid', placeItems: 'center', fontFamily: 'var(--d)', fontSize: 64, color: 'var(--brand)' }}>{AR_NUM[i]}</div>}
              <div className="tx" style={{ paddingInline: 4 }}><span className="sz">{AR_NUM[i]}</span><h3>{s.title}</h3></div>
            </a>
          ))}</div>
          ) : (
            <div className="vals">{c.steps.items.map((s, i) => <div className="val" key={i} data-r><span className="eb">{AR_NUM[i]}</span><h3 style={{ marginTop: 4 }}>{s.title}</h3>{s.text ? <p>{s.text}</p> : null}</div>)}</div>
          )}
        </div></section>
      )}
      {galleryBlock}
      {cta}
    </>
  ) : (
    <>
      <div className="hero"><div className="in grid">
        <div data-r>
          {c.brand.kind ? <span className="eb">{c.brand.kind}{c.brand.city ? ` · ${c.brand.city}` : ''}</span> : null}
          <h1 style={{ marginTop: 10, fontSize: (c.brand.tagline || name).length > 34 ? 'clamp(32px,7vw,54px)' : undefined }}>{c.brand.tagline || name}</h1>
          {c.brand.intro ? <p>{c.brand.intro}</p> : null}
          <div className="btns">
            {has.products ? <a className="btn" href="#/products">تصفّح المنتجات</a> : null}
            {action ? <a className="btn ghost" href={action.href}>{action.label}</a> : null}
          </div>
          {P.some((p) => p.size) ? <div className="sizes">{P.map((p, i) => p.size ? <a key={i} href={`#/p/${i}`}>{p.size.length <= 14 ? p.size : p.name}</a> : null)}</div> : null}
        </div>
        <div className="plinth" data-r>
          {P.some((p) => p.photo)
            ? [...P].reverse().filter((p, i, all) => p.photo && all.findIndex((q) => q.photo === p.photo) === i).slice(0, 3).map((p, i, a) => <img key={i} src={p.photo} alt={p.name} style={{ height: `${100 - (a.length - 1 - i) * 18}%`, maxWidth: a.length === 1 ? '84%' : undefined }} />)
            : c.hero.photo ? <img className="ph" src={c.hero.photo} alt="" /> : null}
        </div>
      </div></div>
      {has.products && (
        <section><div className="in">
          <div className="sh"><h2>{c.products.heading}</h2><a className="lnk" href="#/products">الكل</a></div>
          <div className="prods rail">{P.slice(0, 3).map(prodCard)}</div>
        </div></section>
      )}
      {c.benefits.items.length > 0 && (
        <section style={{ paddingTop: 0 }}><div className="in"><div className="why">
          <div className="sh"><div><span className="eb">لماذا {name}</span><h2>{c.benefits.heading}</h2></div></div>
          {checks(6)}
        </div></div></section>
      )}
      {has.story && (
        <section style={{ paddingTop: 0 }}><div className="in strip">
          {c.story.photo || c.hero.photo ? <img src={c.story.photo || c.hero.photo} alt="" loading="lazy" data-r /> : null}
          <div data-r>
            <span className="eb">{c.story.heading}</span>
            <p style={{ fontFamily: 'var(--d)', fontWeight: 700, fontSize: 'clamp(21px,3vw,28px)', lineHeight: 1.6, marginTop: 8 }}>{c.story.paragraphs[0] || c.story.quote}</p>
            <p style={{ marginTop: 20 }}><a className="lnk" href="#/story">اقرأ قصتنا</a></p>
          </div>
        </div></section>
      )}
      {has.make && (
        <section style={{ paddingTop: 0 }}><div className="in">
          <div className="sh"><h2>{c.steps.heading}</h2><a className="lnk" href="#/make">التفاصيل</a></div>
          <div className="vals">{c.steps.items.map((s, i) => <div className="val" key={i} data-r><span className="eb">الخطوة {AR_NUM[i]}</span><h3 style={{ marginTop: 6 }}>{s.title}</h3></div>)}</div>
        </div></section>
      )}
      {galleryBlock}
      {cta}
    </>
  )

  const pageHero = (title: string, eyebrow: string | undefined, photo?: string) => photo ? (
    <div className="phero"><img src={photo} alt="" /><div className="in">{eyebrow ? <span className="eb">{eyebrow}</span> : null}<h1>{title}</h1></div></div>
  ) : (
    <div className="in plain">{eyebrow ? <span className="eb">{eyebrow}</span> : null}<h1>{title}</h1></div>
  )

  const story = (
    <>
      {pageHero(c.story.heading, name, c.story.photo || gallery[0])}
      <section><div className="in" style={{ display: 'grid', gap: 28, maxWidth: 820 }}>
        {c.story.paragraphs.map((p, i) => <p key={i} data-r style={{ fontSize: i === 0 ? 22 : 18, lineHeight: 1.9 }}>{p}</p>)}
        {c.story.quote ? <div data-r><p className="quote">«{c.story.quote}»</p>{c.story.signature ? <p className="sig">{c.story.signature}{c.story.role ? ` · ${c.story.role}` : ''}</p> : null}</div> : null}
      </div></section>
      {c.values.items.length > 0 && (
        <section style={{ paddingTop: 0 }}><div className="in">
          <div className="sh"><h2>{c.values.heading}</h2></div>
          <div className="vals">{c.values.items.map((v, i) => <div className="val" key={i} data-r><h3>{v.title}</h3>{v.text ? <p>{v.text}</p> : null}</div>)}</div>
        </div></section>
      )}
      {c.timeline.items.length > 0 && (
        <section style={{ paddingTop: 0 }}><div className="in">
          <div className="sh"><h2>{c.timeline.heading}</h2></div>
          <div className="rows">{c.timeline.items.map((t, i) => <div className="row" key={i} data-r><b>{t.year}</b><span style={{ fontSize: 16, color: 'var(--ink)' }}>{t.text}</span></div>)}</div>
        </div></section>
      )}
      {c.team.items.length > 0 && (
        <section style={{ paddingTop: 0 }}><div className="in">
          <div className="sh"><h2>{c.team.heading}</h2></div>
          <div className="prods">{c.team.items.map((t, i) => <div className="pc" key={i} data-r>{t.photo ? <img src={t.photo} alt={t.name} style={{ aspectRatio: '4/5', objectFit: 'cover' }} /> : null}<div className="tx"><h3>{t.name}</h3>{t.role ? <p>{t.role}</p> : null}</div></div>)}</div>
        </div></section>
      )}
      {galleryBlock}
      {cta}
    </>
  )

  const make = (
    <>
      {pageHero(c.steps.heading, name, c.steps.items.find((s) => s.photo)?.photo || gallery[1])}
      <section><div className="in steps">
        {c.steps.items.map((s, i) => (
          <div key={i} className={`step${s.photo ? '' : ' np'}`} data-r>
            {s.photo ? <img src={s.photo} alt="" loading="lazy" /> : null}
            <div><span className="n">{AR_NUM[i]}</span><h3>{s.title}</h3>{s.text ? <p>{s.text}</p> : null}</div>
          </div>
        ))}
        {c.products.note ? <p className="note" data-r>{c.products.note}</p> : null}
      </div></section>
      {cta}
    </>
  )

  const products = (
    <>
      <div className="in plain"><span className="eb">{name}</span><h1>{c.products.heading}</h1></div>
      <section style={{ paddingTop: 32 }}><div className="in">
        <div className="prods">{P.map(prodCard)}</div>
        {c.products.note ? <p className="note">{c.products.note}</p> : null}
      </div></section>
      {c.benefits.items.length > 0 && (look === 'tropic'
        ? <section className="band"><div className="in"><div className="sh"><h2>{c.benefits.heading}</h2></div>{benefits()}</div></section>
        : <section style={{ paddingTop: 0 }}><div className="in"><div className="why"><div className="sh"><h2>{c.benefits.heading}</h2></div>{checks()}</div></div></section>)}
      {cta}
    </>
  )

  const product = (() => {
    if (page.id !== 'product') return null
    const p = P[page.i]
    if (!p) return products
    const others = P.map((x, i) => ({ x, i })).filter((o) => o.i !== page.i)
    return (
      <>
        <div className="in crumb"><a href="#/products">{c.products.heading}</a> · {p.name}{p.size ? ` ${p.size}` : ''}</div>
        <div className="in pd">
          <div className="st" data-r>{p.size && p.size.length <= 10 ? <span className="big" aria-hidden>{p.size}</span> : null}{p.photo ? <img className={cut(p.photo) ? undefined : 'cov'} src={p.photo} alt={p.name} /> : <span className="pc"><span className="mono">{name.slice(0, 1)}</span></span>}</div>
          <div data-r>
            <span className="eb">{c.brand.kind || name}</span>
            <h1 style={{ marginTop: 8 }}>{p.name}</h1>
            {p.size ? <p className="sz" style={{ marginTop: 6 }}>{p.size}</p> : null}
            {p.text ? <p className="lead">{p.text}</p> : null}
            {p.price ? <p style={{ fontFamily: 'var(--d)', fontSize: 28, marginBottom: 18 }}>{p.price}</p> : null}
            {action ? <a className="btn" href={action.href}>{action.ask}</a> : null}
            {c.benefits.items.length > 0 ? (
              <div className="meta">{c.benefits.items.slice(0, 4).map((b, i) => <div className="row" key={i}><span>{b.title}</span><p style={{ fontSize: 15 }}>{b.text}</p></div>)}</div>
            ) : null}
          </div>
        </div>
        {others.length > 0 && (
          <section><div className="in">
            <div className="sh"><h2>{others.length > 1 ? 'أحجام ومنتجات أخرى' : 'جرّب أيضًا'}</h2></div>
            <div className="prods rail">{others.map((o) => prodCard(o.x, o.i))}</div>
          </div></section>
        )}
      </>
    )
  })()

  const mapHref = c.contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.contact.address)}` : undefined
  const contact = (
    <>
      <div className="in plain"><span className="eb">{name}</span><h1>{c.contact.heading}</h1></div>
      <section style={{ paddingTop: 32 }}><div className="in" style={{ display: 'grid', gap: 32, maxWidth: 820 }}>
        {action ? <div><a className="btn" href={action.href}>{action.label}</a></div> : null}
        <div className="rows">
          {tel ? <div className="row"><span>الهاتف</span><a href={`tel:${tel}`}>{c.contact.phone}</a></div> : null}
          {wa ? <div className="row"><span>واتساب</span><a href={`https://wa.me/${wa.replace('+', '')}`}>{c.contact.whatsapp}</a></div> : null}
          {c.contact.email ? <div className="row"><span>البريد</span><a href={`mailto:${c.contact.email}`}>{c.contact.email}</a></div> : null}
          {c.contact.address ? <div className="row"><span>العنوان</span><a href={mapHref} target="_blank" rel="noreferrer" style={{ fontSize: 18 }}>{c.contact.address}</a></div> : null}
          {social.length > 0 ? <div className="row"><span>تابعنا</span><div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontWeight: 600 }}>{social.map((s) => <a key={s.key} href={s.href} target="_blank" rel="noreferrer" className="lnk" style={{ fontFamily: 'var(--b)', fontSize: 16 }}>{s.label}</a>)}</div></div> : null}
        </div>
      </div></section>
    </>
  )

  const body = page.id === 'story' && has.story ? story
    : page.id === 'make' && has.make ? make
    : page.id === 'products' && has.products ? products
    : page.id === 'product' ? product
    : page.id === 'contact' ? contact
    : home

  return (
    <div ref={root} className={`bh ${look === 'tropic' ? 't' : 's'} ${className || ''}`} style={vars}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="hd"><div className="in">
        <a className="lg" href="#/">{c.brand.logo ? <img src={c.brand.logo} alt={name} /> : name}</a>
        <nav className="nav" aria-label="الصفحات">{nav.map((n) => <a key={n.id} href={n.href} aria-current={cur === n.id ? 'page' : undefined}>{n.label}</a>)}</nav>
        <div className="acts">
          {action ? <a className="btn" href={action.href}>{action.label}</a> : null}
          <button className="mb" type="button" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>{menu ? 'إغلاق' : 'القائمة'}</button>
        </div>
      </div></header>
      {menu && (
        <div className="sheet">
          {nav.map((n) => <a key={n.id} href={n.href} aria-current={cur === n.id ? 'page' : undefined} onClick={() => setMenu(false)}>{n.label}</a>)}
          {action ? <a className="btn" href={action.href}>{action.label}</a> : null}
        </div>
      )}
      <main key={page.id + ('i' in page ? page.i : '')}>{body}</main>
      <footer className="ft"><div className="in">
        <div className="cols">
          <div><a className="lg" href="#/">{c.brand.logo ? <img src={c.brand.logo} alt={name} /> : name}</a>{c.footer.tagline ? <p style={{ marginTop: 14, opacity: .8, maxWidth: '32ch' }}>{c.footer.tagline}</p> : null}</div>
          <div><h4>الصفحات</h4><ul>{nav.map((n) => <li key={n.id}><a href={n.href}>{n.label}</a></li>)}</ul></div>
          {has.products ? <div><h4>{c.products.heading}</h4><ul>{P.slice(0, 6).map((p, i) => <li key={i}><a href={`#/p/${i}`}>{p.name}</a></li>)}</ul></div> : null}
          {social.length > 0 ? <div><h4>تابعنا</h4><ul>{social.map((s) => <li key={s.key}><a href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul></div> : null}
        </div>
        <p className="base">© {name}{c.brand.city ? ` · ${c.brand.city}` : ''}</p>
      </div></footer>
    </div>
  )
}
