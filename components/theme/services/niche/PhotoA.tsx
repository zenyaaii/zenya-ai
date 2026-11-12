'use client'

/**
 * Photo studio, option A «المعرض أولًا» (work first). SAMPLE.
 * Near-black so the photos carry the page. The work opens straight under
 * the name in a masonry wall with a filter per kind of shoot (from Instagram
 * or the owner's uploads, never faces we picked); a tap opens the photo full
 * screen. Then packages with what each includes, delivery times, official
 * photo specs.
 * Motion: the gallery is the motion. Photos develop in (blur→sharp), the
 * filter re-flows the wall, the lightbox grows out of the tapped photo.
 */

import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#0c0c0d', surface: '#161618', text: '#f1f0ee', muted: '#8e8c88', accent: '#f1f0ee', border: '#27272a' }

type VT = { startViewTransition?: (cb: () => void) => unknown }
const vt = (cb: () => void) => {
  const d = document as unknown as VT
  if (d.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(() => flushSync(cb))
  else cb()
}

export default function PhotoA({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const work = useMemo(() => (x.work?.length ? x.work : n.photos.map((url) => ({ url, tag: '' }))), [x.work, n.photos])
  const tags = useMemo(() => Array.from(new Set(work.map((w) => w.tag).filter(Boolean))), [work])
  const [tag, setTag] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const shown = work.filter((w) => !tag || w.tag === tag)
  useEffect(() => {
    if (open === null) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') vt(() => setOpen(null)) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [open])
  const notes = (x.blocks || []).filter((b) => b.text.trim())

  return (
    <div ref={ref} className="nv pa" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Noto Sans Arabic", sans-serif', ['--n-body' as string]: '"Noto Sans Arabic", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@200;400;500;700;800&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`pa-top${solid ? ' solid' : ''}`}><div className="n-w pa-top-in">
        <a href="#top" className="pa-mark">{n.short}</a>
        <nav><a href="#work">الأعمال</a>{x.packages?.length ? <a href="#pk">الباقات</a> : null}<a href="#visit">الموقع</a></nav>
        <a className="n-btn" href="#book">احجز جلستك</a>
      </div></header>

      <section id="top" className="pa-hero n-w">
        <h1><span>{n.short}</span>{n.b.latin ? <small dir="ltr">{n.b.latin}</small> : null}</h1>
        <div className="pa-side">
          <p>{content.hero.subheadline || n.b.tagline}</p>
          {n.rating ? <span className="pa-g"><Stars n={n.rating} /> {n.rating.toFixed(1)}{n.count ? ` · ${ar(n.count)} تقييم` : ''}</span> : null}
        </div>
      </section>

      {work.length ? (
        <section id="work" className="pa-work n-w">
          {tags.length > 1 ? (
            <div className="pa-filter" role="tablist">
              {['', ...tags].map((t) => <button key={t || 'all'} role="tab" aria-selected={tag === t} className={tag === t ? 'on' : ''} onClick={() => vt(() => setTag(t))}>{t || 'الكل'}<sup>{t ? work.filter((w) => w.tag === t).length : work.length}</sup></button>)}
            </div>
          ) : null}
          <div className={`pa-wall c${Math.min(shown.length, 4)}`}>
            {shown.map((w) => {
              const i = work.indexOf(w)
              return (
                <button key={w.url} type="button" className="pa-ph" style={{ viewTransitionName: `pa-${i}` } as React.CSSProperties} onClick={() => vt(() => setOpen(i))} aria-label={w.tag || 'صورة'}>
                  <img src={w.url} alt={w.tag ? `${w.tag} من ${n.short}` : n.short} loading="lazy" ref={(el) => { if (el?.complete) el.classList.add('ok') }} onLoad={(e) => e.currentTarget.classList.add('ok')} />
                  {w.tag ? <span>{w.tag}</span> : null}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {open !== null && work[open] ? (
        <div className="pa-lb" role="dialog" aria-modal="true" onClick={() => vt(() => setOpen(null))}>
          <img src={work[open].url} alt="" style={{ viewTransitionName: `pa-${open}` } as React.CSSProperties} />
          <button type="button" aria-label="إغلاق">✕</button>
        </div>
      ) : null}

      {x.packages?.length || n.services.length ? (
        <section id="pk" className="pa-sec"><div className="n-w">
          <h2 data-r>الباقات والأسعار</h2>
          <div className="pa-pk">
            {(x.packages?.length ? x.packages : n.services.map((s) => ({ name: s.name, includes: s.description ? [s.description] : [], duration: s.duration, price: s.price_from }))).map((p, i) => (
              <article key={p.name} data-r style={{ ['--d' as string]: i }}>
                <header><h3>{p.name}</h3>{p.price ? <b>{p.price}</b> : null}</header>
                {p.includes.length ? <ul>{p.includes.map((t) => <li key={t}>{t}</li>)}</ul> : null}
                <footer>{p.duration ? <span>{Ic.clock}{p.duration}</span> : <span />}<button type="button" onClick={() => { setPick(p.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>احجز {Ic.arrow}</button></footer>
              </article>
            ))}
          </div>
        </div></section>
      ) : null}

      {x.delivery?.length ? (
        <section className="pa-sec pa-tight"><div className="n-w">
          <h2 data-r>متى تستلم صورك</h2>
          <ol className="pa-del">{x.delivery.map((d, i) => <li key={d.what} data-r style={{ ['--d' as string]: i }}><b>{d.when}</b><span>{d.what}</span></li>)}</ol>
        </div></section>
      ) : null}

      {x.specs?.length || notes.length ? (
        <section className="pa-sec pa-tight"><div className="n-w pa-two">
          {x.specs?.length ? <div data-r><h2>مقاسات الصور الرسمية</h2><dl className="pa-spec">{x.specs.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.text}</dd></div>)}</dl></div> : null}
          {notes.length ? <div data-r><h2>قبل أن تحجز</h2>{notes.map((b) => <div key={b.id} className="pa-note"><h3>{b.title}</h3><p>{b.text}</p></div>)}</div> : null}
        </div></section>
      ) : null}

      <section id="book" className="pa-sec pa-alt"><div className="n-w pa-book">
        <div data-r><h2>احجز جلستك</h2><p className="pa-sub">اختر نوع الجلسة والوقت. نؤكّد لك على واتساب.</p></div>
        <div data-r><Book n={n} options={[...(x.packages || []).map((p) => p.name), ...n.services.map((s) => s.name)].filter((v, i, a) => a.indexOf(v) === i)} place="الاستوديو" pick={pick} setPick={setPick} /></div>
      </div></section>

      {n.reviews.length ? (
        <section className="pa-sec"><div className="n-w pa-rv">{n.reviews.slice(0, 3).map((r, i) => <figure key={i} data-r style={{ ['--d' as string]: i }}><blockquote>{r.text}</blockquote><figcaption>{r.name} · جوجل</figcaption></figure>)}</div></section>
      ) : null}

      {n.faq.length ? (
        <section className="pa-sec pa-tight"><div className="n-w pa-narrow"><h2 data-r>أسئلة شائعة</h2>{n.faq.map((f, i) => <details key={i} className="pa-q" data-r><summary>{f.q}<span>{Ic.plus}</span></summary><p>{f.a}</p></details>)}</div></section>
      ) : null}

      <section id="visit" className="pa-sec pa-alt"><div className="n-w pa-two">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="pa-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="pa-foot n-w"><b>{n.b.name}</b>{n.ig ? <a href={n.ig}>{Ic.ig} {content.social_links?.instagram}</a> : null}</footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجز جلستك</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.pa{--n-r-btn:999px;--n-r-in:10px}
.pa-top{position:sticky;top:0;z-index:20;transition:background .3s}
.pa-top.solid{background:color-mix(in srgb,var(--n-bg) 86%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.pa-top-in{display:flex;align-items:center;gap:24px;height:64px}
.pa-mark{font:800 18px var(--n-disp)}
.pa-top nav{display:flex;gap:22px;margin-inline-start:auto;font-size:14px;color:var(--n-mute)}
.pa-top nav a:hover{color:var(--n-ink)}
.pa-top .n-btn{min-height:40px;font-size:14px}
@media (max-width:760px){.pa-top nav,.pa-top .n-btn{display:none}}
.pa-hero{display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:end;padding:40px 0 36px}
.pa-hero h1{display:grid;gap:6px}
.pa-hero h1 span{font-size:clamp(56px,10vw,150px);font-weight:200;line-height:.95;letter-spacing:-.03em;animation:pa-in 1.1s cubic-bezier(.2,.8,.2,1) both}
.pa-hero h1 small{font-size:13px;font-weight:500;letter-spacing:.3em;color:var(--n-mute)}
@keyframes pa-in{from{opacity:0;letter-spacing:.06em;filter:blur(8px)}to{opacity:1}}
.pa-side{display:grid;gap:14px;padding-bottom:12px;animation:b-fade .9s .3s both}
@keyframes b-fade{from{opacity:0}}
.pa-side p{font-size:18px;color:var(--n-ink2)}
.pa-g{display:flex;gap:8px;align-items:center;font-size:14px;color:var(--n-mute)}
@media (max-width:760px){.pa-hero{grid-template-columns:1fr;gap:16px;padding:16px 0 24px}.pa-hero h1 span{font-size:clamp(52px,17vw,80px)}}
.pa-work{padding-bottom:72px}
.pa-filter{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:18px;position:sticky;top:64px;z-index:5;padding:8px 0;background:var(--n-bg)}
.pa-filter button{border:0;background:none;color:var(--n-mute);font:500 15px var(--n-body);padding:8px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:color .2s,background .2s}
.pa-filter button sup{font-size:10px;margin-inline-start:3px;opacity:.6}
.pa-filter button.on{background:var(--n-ink);color:var(--n-bg)}
.pa-wall{columns:3;column-gap:10px}
.pa-wall.c1{columns:1}.pa-wall.c2{columns:2}
.pa-ph{position:relative;display:block;width:100%;margin:0 0 10px;padding:0;border:0;background:var(--n-bg2);border-radius:6px;overflow:hidden;cursor:zoom-in;break-inside:avoid}
.pa-ph img{width:100%;height:auto;filter:blur(14px) saturate(.4);transform:scale(1.04);transition:filter 1s ease,transform 1.2s cubic-bezier(.2,.8,.2,1)}
.pa-ph img.ok{filter:none;transform:none}
.pa-ph:hover img{transform:scale(1.03)}
.pa-ph span{position:absolute;bottom:10px;right:10px;font-size:12px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s}
.pa-ph:hover span,.pa-ph:focus-visible span{opacity:1;transform:none}
@media (max-width:760px){.pa-wall{columns:2;column-gap:6px}.pa-ph{margin-bottom:6px}}
::view-transition-group(*){animation-duration:.45s;animation-timing-function:cubic-bezier(.2,.8,.2,1)}
.pa-lb{position:fixed;inset:0;z-index:50;background:rgba(6,6,7,.94);display:grid;place-items:center;padding:24px;cursor:zoom-out}
.pa-lb img{max-width:100%;max-height:88dvh;border-radius:6px;object-fit:contain}
.pa-lb button{position:absolute;top:18px;left:18px;width:44px;height:44px;border-radius:50%;border:1px solid #333;background:#111;color:#fff;font-size:18px;cursor:pointer}
.pa-sec{padding:88px 0}.pa-tight{padding-top:0}
.pa-alt{background:var(--n-bg2)}
.pa-sec h2{font-size:clamp(28px,3.6vw,44px);font-weight:700;margin-bottom:24px}
.pa-sub{color:var(--n-mute);margin-top:-14px}
.pa-pk{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));border-top:1px solid var(--n-line)}
.pa-pk article{padding:28px 24px 24px;border-bottom:1px solid var(--n-line);display:grid;gap:14px;align-content:start;transition:background .3s}
.pa-pk article+article{border-inline-start:1px solid var(--n-line)}
.pa-pk article:hover{background:var(--n-bg2)}
.pa-pk header{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.pa-pk h3{font-size:22px;font-weight:500}
.pa-pk b{font-size:24px;font-weight:200;white-space:nowrap}
.pa-pk ul{list-style:none;padding:0;margin:0;display:grid;gap:6px;color:var(--n-ink2);font-size:15px}
.pa-pk li::before{content:"+ ";color:var(--n-mute)}
.pa-pk footer{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px;font-size:13px;color:var(--n-mute)}
.pa-pk footer span{display:inline-flex;gap:6px;align-items:center}
.pa-pk footer button{display:inline-flex;gap:4px;align-items:center;border:0;background:none;color:var(--n-ink);font:600 14px var(--n-body);cursor:pointer;transition:gap .25s}
.pa-pk footer button:hover{gap:10px}
@media (max-width:760px){.pa-pk article+article{border-inline-start:0}}
.pa-del{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2px}
.pa-del li{padding:24px;background:var(--n-bg2);display:grid;gap:6px}
.pa-del b{font-size:28px;font-weight:200}
.pa-del span{color:var(--n-mute);font-size:14px}
.pa-two{display:grid;grid-template-columns:1fr 1fr;gap:56px}
.pa-spec{margin:0;display:grid}
.pa-spec div{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--n-line)}
.pa-spec dt{font-weight:600}.pa-spec dd{margin:0;color:var(--n-ink2);text-align:left}
.pa-note{padding:18px 0;border-bottom:1px solid var(--n-line)}.pa-note h3{font-size:18px;margin-bottom:4px}.pa-note p{color:var(--n-ink2)}
.pa-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.pa .n-btn{background:var(--n-ink);color:var(--n-bg)}
.pa .n-btn.ghost{background:transparent;color:var(--n-ink)}
.pa-rv{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.pa-rv figure{margin:0}
.pa-rv blockquote{margin:0 0 12px;font-size:20px;font-weight:200;line-height:1.6}
.pa-rv figcaption{font-size:13px;color:var(--n-mute)}
.pa-narrow{max-width:800px}
.pa-q{border-bottom:1px solid var(--n-line)}
.pa-q summary{list-style:none;display:flex;justify-content:space-between;padding:18px 0;font-weight:500;cursor:pointer}
.pa-q summary::-webkit-details-marker{display:none}
.pa-q summary span{transition:transform .3s}.pa-q[open] summary span{transform:rotate(45deg)}
.pa-q p{padding-bottom:18px;color:var(--n-ink2)}
.pa-two .n-row{margin-top:20px}
.pa-foot{display:flex;justify-content:space-between;padding:26px 0;color:var(--n-mute);font-size:14px}.pa-foot b{color:var(--n-ink)}.pa-foot a{display:inline-flex;gap:6px;align-items:center}
@media (max-width:760px){.pa-sec{padding:60px 0}.pa-two,.pa-book{grid-template-columns:1fr;gap:28px}.pa-rv{grid-template-columns:1fr;gap:24px}}
`
