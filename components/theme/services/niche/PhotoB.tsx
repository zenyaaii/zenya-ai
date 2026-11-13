'use client'

/**
 * Photo studio, option B «الشريط» (editorial strip). SAMPLE.
 * Light and editorial, like a printed portfolio. A pinned strip of work pans
 * sideways as you scroll down on a laptop (and swipes on a phone); what the
 * studio shoots is a big type list, and hovering a line floats one of its
 * photos. Packages read as three columns of a price sheet.
 * Motion: directed and slow. Scroll drives the strip, hover reveals photos.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#f4f4f2', surface: '#e8e8e5', text: '#141414', muted: '#666662', accent: '#d2462c', border: '#d9d9d5' }

export default function PhotoB({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const work = useMemo(() => (x.work?.length ? x.work : n.photos.map((url) => ({ url, tag: '' }))), [x.work, n.photos])
  const kinds = useMemo(() => {
    const t = Array.from(new Set(work.map((w) => w.tag).filter(Boolean)))
    return (x.offers?.length ? x.offers : t).map((k) => ({ k, img: work.find((w) => w.tag === k)?.url }))
  }, [work, x.offers])
  const [hov, setHov] = useState<string | null>(null)
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const notes = (x.blocks || []).filter((b) => b.text.trim())

  const pin = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [h, setH] = useState<number | null>(null)
  useEffect(() => {
    const sec = pin.current, tr = track.current
    if (!sec || !tr) return
    const mq = window.matchMedia('(min-width: 861px) and (prefers-reduced-motion: no-preference)')
    let raf = 0
    const size = () => { if (!mq.matches) { setH(null); tr.style.transform = ''; return } setH(tr.scrollWidth - window.innerWidth + window.innerHeight) }
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (!mq.matches) return
        const r = sec.getBoundingClientRect()
        const max = tr.scrollWidth - window.innerWidth
        const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)))
        tr.style.transform = `translateX(${p * max}px)`
      })
    }
    size(); on()
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', size); mq.addEventListener('change', size)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', size); mq.removeEventListener('change', size); cancelAnimationFrame(raf) }
  }, [work.length])

  const pk = x.packages?.length ? x.packages : n.services.map((s) => ({ name: s.name, includes: s.description ? [s.description] : [], duration: s.duration, price: s.price_from }))

  return (
    <div ref={ref} className="nv pb" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Noto Naskh Arabic", serif', ['--n-body' as string]: '"IBM Plex Sans Arabic", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`pb-top${solid ? ' solid' : ''}`}><div className="n-w pb-top-in">
        <a href="#top" className="pb-mark">{n.short}</a>
        <a className="pb-link" href="#book">احجز جلستك {Ic.arrow}</a>
      </div></header>

      <section id="top" className="pb-hero n-w">
        <h1>{n.short}</h1>
        <div className="pb-meta">
          <p>{content.hero.subheadline || n.b.tagline}</p>
          <div className="pb-facts">
            {n.rating ? <span><Stars n={n.rating} /> {n.rating.toFixed(1)}{n.count ? ` من ${ar(n.count)} تقييم` : ''}</span> : null}
            <span>{n.where}</span>
          </div>
        </div>
      </section>

      {work.length >= 2 ? (
        <section ref={pin} className="pb-pin" style={h ? { height: h } : undefined}>
          <div className="pb-stage">
            <div ref={track} className="pb-track">
              {work.map((w, i) => <figure key={w.url}><img src={w.url} alt={w.tag || n.short} loading={i < 3 ? 'eager' : 'lazy'} />{w.tag ? <figcaption>{w.tag}</figcaption> : null}</figure>)}
            </div>
          </div>
        </section>
      ) : null}

      {kinds.length ? (
        <section className="pb-sec n-w pb-kinds" onMouseLeave={() => setHov(null)}>
          <h2 data-r>نصوّر</h2>
          <ul>
            {kinds.map((k, i) => (
              <li key={k.k} data-r style={{ ['--d' as string]: i }} onMouseEnter={() => setHov(k.k)}>
                <span>{k.k}</span>
                {k.img ? <img className="pb-thumb" src={k.img} alt="" loading="lazy" /> : null}
              </li>
            ))}
          </ul>
          {kinds.map((k) => (k.img ? <img key={k.k} className={`pb-float${hov === k.k ? ' on' : ''}`} src={k.img} alt="" aria-hidden="true" /> : null))}
        </section>
      ) : null}

      {pk.length ? (
        <section className="pb-sec pb-alt"><div className="n-w">
          <h2 data-r>الأسعار</h2>
          <div className="pb-sheet">
            {pk.map((p, i) => (
              <article key={p.name} data-r style={{ ['--d' as string]: i }}>
                <h3>{p.name}</h3>
                <b>{p.price || 'اسأل عن السعر'}</b>
                {p.includes.length ? <ul>{p.includes.map((t) => <li key={t}>{t}</li>)}</ul> : null}
                {p.duration ? <small>{p.duration}</small> : null}
                <button type="button" onClick={() => { setPick(p.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>احجز هذه الجلسة</button>
              </article>
            ))}
          </div>
        </div></section>
      ) : null}

      {x.delivery?.length || x.specs?.length || notes.length ? (
        <section className="pb-sec"><div className="n-w pb-info">
          {x.delivery?.length ? <div data-r><h3>التسليم</h3><dl>{x.delivery.map((d) => <div key={d.what}><dt>{d.what}</dt><dd>{d.when}</dd></div>)}</dl></div> : null}
          {x.specs?.length ? <div data-r><h3>الصور الرسمية</h3><dl>{x.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.text}</dd></div>)}</dl></div> : null}
          {notes.length ? <div data-r><h3>حتى تعرف</h3>{notes.map((b) => <p key={b.id}><b>{b.title}.</b> {b.text}</p>)}</div> : null}
        </div></section>
      ) : null}

      {n.reviews.length ? (
        <section className="pb-sec pb-alt"><div className="n-w pb-rv">
          <blockquote data-r>{n.reviews[0].text}</blockquote>
          <p data-r>{n.reviews[0].name} · تقييم على جوجل</p>
        </div></section>
      ) : null}

      <section id="book" className="pb-sec"><div className="n-w pb-book">
        <div data-r><h2>احجز جلستك</h2><p className="pb-sub">نرد عليك على واتساب ونؤكّد الموعد.</p></div>
        <div data-r><Book n={n} options={pk.map((p) => p.name)} place="الاستوديو" pick={pick} setPick={setPick} /></div>
      </div></section>

      {n.faq.length ? <section className="pb-sec pb-tight n-w pb-narrow">{n.faq.map((f, i) => <details key={i} className="pb-q" data-r><summary>{f.q}</summary><p>{f.a}</p></details>)}</section> : null}

      <section id="visit" className="pb-sec pb-alt"><div className="n-w pb-book">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="pb-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="pb-foot n-w"><b>{n.b.name}</b>{n.b.latin ? <span dir="ltr">{n.b.latin}</span> : null}</footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجز جلستك</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.pb{--n-r-btn:0px;--n-r-in:0px}
.pb-top{position:sticky;top:0;z-index:20;transition:background .3s}
.pb-top.solid{background:color-mix(in srgb,var(--n-bg) 92%,transparent);box-shadow:0 1px 0 var(--n-line)}
.pb-top-in{display:flex;justify-content:space-between;align-items:center;height:64px}
.pb-mark{font:700 22px var(--n-disp)}
.pb-link{display:inline-flex;align-items:center;gap:8px;font-weight:600;border-bottom:2px solid var(--n-acc);padding-bottom:2px;transition:gap .25s}
.pb-link:hover{gap:14px}
.pb-hero{padding:56px 0 48px;display:grid;gap:28px}
.pb-hero h1{font-size:clamp(64px,13vw,200px);font-weight:700;line-height:.9;letter-spacing:-.02em;animation:pb-mask 1.1s cubic-bezier(.7,0,.2,1) both}
@keyframes pb-mask{from{clip-path:inset(0 0 100% 0);transform:translateY(30px)}to{clip-path:inset(0 0 -20% 0);transform:none}}
.pb-meta{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end;border-top:2px solid var(--n-ink);padding-top:18px;animation:b-fade .8s .5s both}
@keyframes b-fade{from{opacity:0}}
.pb-meta p{font-size:19px;max-width:44ch}
.pb-facts{display:grid;gap:4px;justify-items:end;font-size:14px;color:var(--n-mute)}
.pb-facts span{display:flex;gap:6px;align-items:center}
@media (max-width:760px){.pb-hero{padding:24px 0 32px}.pb-meta{grid-template-columns:1fr}.pb-facts{justify-items:start}}
.pb-pin{position:relative}
.pb-stage{position:sticky;top:0;height:100dvh;overflow:hidden;display:flex;align-items:center}
.pb-track{display:flex;gap:16px;padding-inline:max(16px,calc((100% - 1180px)/2));will-change:transform}
.pb-track figure{margin:0;flex:none;height:min(70dvh,620px);display:grid;gap:8px}
.pb-track figure:nth-child(3n+1){aspect-ratio:4/5}.pb-track figure:nth-child(3n+2){aspect-ratio:3/2;align-self:end}.pb-track figure:nth-child(3n){aspect-ratio:1}
.pb-track img{width:100%;height:100%;object-fit:cover;min-height:0}
.pb-track figcaption{font-size:13px;color:var(--n-mute)}
@media (max-width:860px),(prefers-reduced-motion:reduce){.pb-stage{position:static;height:auto;display:block}.pb-track{overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;transform:none!important;padding-bottom:8px}.pb-track figure{height:56dvh;scroll-snap-align:center}.pb-track figure:nth-child(n){aspect-ratio:3/4;align-self:auto}}
.pb-sec{padding:96px 0}.pb-sec.n-w{padding-inline:0}.pb-tight{padding-top:0}
.pb-alt{background:var(--n-bg2)}
.pb-sec h2{font-size:clamp(34px,4.6vw,60px);font-weight:700;margin-bottom:28px}
.pb-sub{color:var(--n-mute);margin-top:-16px}
.pb-kinds{position:relative}
.pb-kinds ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--n-ink)}
.pb-kinds li{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--n-ink);cursor:default}
.pb-kinds li span{font:700 clamp(30px,5vw,68px)/1.15 var(--n-disp);transition:color .25s,transform .35s cubic-bezier(.2,.8,.2,1)}
.pb-kinds li:hover span{color:var(--n-acc);transform:translateX(-14px)}
.pb-thumb{display:none;width:72px;height:72px;object-fit:cover}
.pb-float{position:absolute;left:8%;top:50%;width:300px;aspect-ratio:4/5;object-fit:cover;pointer-events:none;opacity:0;transform:translateY(-40%) rotate(-3deg) scale(.9);transition:opacity .3s,transform .5s cubic-bezier(.2,.8,.2,1);z-index:2;box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
.pb-float.on{opacity:1;transform:translateY(-50%) rotate(2deg) scale(1)}
@media (hover:none),(max-width:860px){.pb-float{display:none}.pb-thumb{display:block}}
.pb-sheet{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));border-top:2px solid var(--n-ink)}
.pb-sheet article{padding:26px 0;display:grid;gap:10px;align-content:start;padding-inline-end:24px}
.pb-sheet article+article{border-inline-start:1px solid var(--n-line);padding-inline-start:24px}
.pb-sheet h3{font-size:26px}
.pb-sheet b{font:500 30px var(--n-body);color:var(--n-acc)}
.pb-sheet ul{margin:0;padding-inline-start:18px;color:var(--n-ink2)}
.pb-sheet small{color:var(--n-mute)}
.pb-sheet button{justify-self:start;margin-top:8px;border:0;border-bottom:2px solid var(--n-ink);background:none;padding:4px 0;font:600 15px var(--n-body);cursor:pointer;color:var(--n-ink);transition:border-color .2s,color .2s}
.pb-sheet button:hover{color:var(--n-acc);border-color:var(--n-acc)}
@media (max-width:760px){.pb-sheet article+article{border-inline-start:0;padding-inline-start:0;border-top:1px solid var(--n-line)}}
.pb-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:40px}
.pb-info h3{font-size:24px;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid var(--n-ink)}
.pb-info dl{margin:0}.pb-info dl div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--n-line)}
.pb-info dd{margin:0;font-weight:600}.pb-info p{margin-bottom:10px;color:var(--n-ink2)}
.pb-rv blockquote{margin:0;font:700 clamp(26px,3.6vw,48px)/1.4 var(--n-disp);max-width:26ch}
.pb-rv p{margin-top:18px;color:var(--n-mute)}
.pb-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.pb-book .n-row{margin-top:20px}
.pb .n-chips button{border-radius:0}
.pb .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:#fff}
.pb-narrow{max-width:800px}
.pb-q{border-bottom:1px solid var(--n-line)}.pb-q summary{padding:18px 0;font-weight:600;cursor:pointer}.pb-q p{padding-bottom:18px;color:var(--n-ink2)}
.pb-foot{display:flex;justify-content:space-between;padding:26px 0;color:var(--n-mute);font-size:14px}.pb-foot b{color:var(--n-ink);font-family:var(--n-disp);font-size:20px}
@media (max-width:760px){.pb-sec{padding:60px 0}.pb-book{grid-template-columns:1fr;gap:24px}}
`
