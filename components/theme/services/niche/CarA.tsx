'use client'

/**
 * Car services, option A «لوحة الورشة» (workshop board). SAMPLE.
 * Dark graphite with one signal colour. The owner's promises (price before
 * work, free check, warranty) sit in the opening as stamped cards, the makes
 * run once across the page, services are job cards in a bento, and a car
 * wash gets a size switch that swaps every price.
 * Motion: short and mechanical. Hard ease-out slides, count-up rating, one marquee.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#0f1113', surface: '#181b1e', text: '#eef0f2', muted: '#8d949a', accent: '#f5b700', border: '#262a2e' }

function CountUp({ to, dec = 0 }: { to: number; dec?: number }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const step = (t: number) => { const p = Math.min(1, (t - t0) / 1100); setV(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step) }
      requestAnimationFrame(step)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{dec ? v.toFixed(dec) : ar(Math.round(v))}</span>
}

export default function CarA({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const [size, setSize] = useState(0)
  const promises = (x.blocks || []).filter((b) => b.text.trim())
  const lead = promises.find((b) => b.id === 'price_first') || promises[0]
  const groups = useMemo(() => {
    const m = new Map<string, typeof n.services>()
    for (const s of n.services) { const g = x.groups?.[s.name] || ''; m.set(g, [...(m.get(g) || []), s]) }
    return Array.from(m.entries())
  }, [n.services, x.groups])
  const shots = n.rest.slice(0, 4)

  return (
    <div ref={ref} className="nv ca" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Rubik", sans-serif', ['--n-body' as string]: '"Rubik", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;800&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`ca-top${solid ? ' solid' : ''}`}><div className="n-w ca-top-in">
        <a href="#top" className="ca-mark"><b>{n.short}</b>{n.b.latin ? <small dir="ltr">{n.b.latin}</small> : null}</a>
        <nav><a href="#svc">الخدمات</a><a href="#book">الحجز</a><a href="#visit">الموقع</a></nav>
        <a className="n-btn" href="#book">احجز موعد صيانة</a>
      </div></header>

      <section id="top" className="ca-hero"><div className="n-w ca-hero-in">
        <div className="ca-copy">
          <h1 className="ca-in">{n.short}</h1>
          <p className="ca-lede ca-in">{content.hero.subheadline || n.b.tagline}</p>
          <div className="n-row ca-in"><a className="n-btn" href="#book">احجز موعد صيانة</a>{n.wa ? <a className="n-btn ghost" href={n.waLink('مرحبًا، عندي مشكلة في سيارتي')!} target="_blank" rel="noopener noreferrer">{Ic.wa} صف المشكلة</a> : null}</div>
          <div className="ca-facts ca-in">
            {n.rating ? <div><b><CountUp to={n.rating} dec={1} /></b><span><Stars n={n.rating} /> {n.count ? <><CountUp to={n.count} /> تقييم</> : 'جوجل'}</span></div> : null}
            {n.st ? <div><b className={n.st.open ? 'ok' : 'no'}>{n.st.open ? 'مفتوح' : 'مغلق'}</b><span>{n.st.text}</span></div> : null}
          </div>
        </div>
        <div className="ca-vis">
          {n.hero ? <img src={n.hero} alt={`${n.b.name} من الداخل`} /> : null}
          {promises.slice(0, 2).map((p, i) => <div key={p.id} className={`ca-stamp s${i}`}><b>{Ic.check}{p.title}</b><span>{p.text}</span></div>)}
        </div>
      </div></section>

      {x.brands?.length ? (
        <section className="ca-mq" aria-label="الماركات"><div className="ca-mq-t">{[...x.brands, ...x.brands, ...x.brands, ...x.brands].map((m, i) => <span key={i} aria-hidden={i >= x.brands!.length}>{m}</span>)}</div></section>
      ) : null}

      <section id="svc" className="ca-sec"><div className="n-w">
        <h2 data-r>الخدمات</h2>
        {x.sizes?.length && x.sizeNames?.length ? (
          <div className="ca-size" data-r>
            <span>حجم السيارة</span>
            <div className="n-chips">{x.sizeNames.map((s, i) => <button key={s} type="button" className={size === i ? 'on' : ''} aria-pressed={size === i} onClick={() => setSize(i)}>{s}</button>)}</div>
          </div>
        ) : null}
        {groups.map(([g, items]) => (
          <div key={g || 'all'} className="ca-grp">
            {g && groups.length > 1 ? <h3 className="ca-gh" data-r>{g}</h3> : null}
            <div className={`ca-bento c${Math.min(items.length, 5)}`}>
              {items.map((s, i) => {
                const sz = x.sizes?.find((z) => z.name === s.name)
                const price = sz ? sz.prices[size] : s.price_from
                return (
                  <article key={s.name} data-r style={{ ['--d' as string]: i }}>
                    <h4>{s.name}</h4>
                    {s.description ? <p>{s.description}</p> : null}
                    <footer>
                      {s.duration ? <span className="du">{Ic.clock}{s.duration}</span> : <span />}
                      {price ? <b key={price} className="ca-p">{price}</b> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${s.name}؟`)!} target="_blank" rel="noopener noreferrer">اسأل عن السعر</a> : null}
                    </footer>
                    <button type="button" onClick={() => { setPick(s.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>احجز</button>
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </div></section>

      {lead ? (
        <section className="ca-band"><div className="n-w" data-r><b>{lead.title}</b><p>{lead.text}</p></div></section>
      ) : null}

      {promises.length > 1 || x.facilities?.length ? (
        <section className="ca-sec"><div className="n-w ca-prom">
          {promises.filter((p) => p !== lead).map((p, i) => <div key={p.id} data-r style={{ ['--d' as string]: i }}><h3>{p.title}</h3><p>{p.text}</p></div>)}
          {x.facilities?.length ? <div data-r><h3>في الورشة</h3><ul>{x.facilities.map((f) => <li key={f}>{Ic.check}{f}</li>)}</ul></div> : null}
        </div></section>
      ) : null}

      <section id="book" className="ca-sec ca-alt"><div className="n-w ca-book">
        <div data-r><h2>احجز موعدك</h2><p className="ca-sub">اختر الخدمة والوقت. نؤكّد لك على واتساب، ونخبرك بالسعر قبل أي عمل.</p></div>
        <div className="ca-card" data-r><Book n={n} options={n.services.map((s) => s.name)} place="الورشة" pick={pick} setPick={setPick} /></div>
      </div></section>

      {n.reviews.length ? (
        <section className="ca-sec"><div className="n-w">
          <h2 data-r>من زبائن الورشة</h2>
          <div className="ca-rv">{n.reviews.slice(0, 3).map((r, i) => <figure key={i} data-r style={{ ['--d' as string]: i }}><Stars n={r.rating} /><blockquote>{r.text}</blockquote><figcaption>{r.name} · جوجل</figcaption></figure>)}</div>
        </div></section>
      ) : null}

      {shots.length >= 2 ? (
        <section className="ca-sec ca-tight"><div className={`n-w ca-shots c${shots.length}`}>{shots.map((u, i) => <img key={u} src={u} alt={`${n.short} ${i + 1}`} loading="lazy" data-r style={{ ['--d' as string]: i }} />)}</div></section>
      ) : null}

      {n.faq.length ? (
        <section className="ca-sec"><div className="n-w ca-faq">
          <h2 data-r>أسئلة قبل أن تأتي</h2>
          <div>{n.faq.map((f, i) => <details key={i} data-r><summary>{f.q}<span>{Ic.plus}</span></summary><p>{f.a}</p></details>)}</div>
        </div></section>
      ) : null}

      <section id="visit" className="ca-sec ca-alt"><div className="n-w ca-visit">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="ca-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="ca-foot n-w"><b>{n.b.name}</b><span>{n.where}</span></footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجز موعد</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}{n.tel ? <a className="n-btn ghost sq" href={`tel:${n.tel}`} aria-label="اتصال">{Ic.phone}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.ca{--n-r-btn:10px;--n-r-in:10px}
.ca [data-r]{transform:translateX(-28px);transition-duration:.45s;transition-timing-function:cubic-bezier(.2,.9,.1,1)}
.ca [data-r].in{transform:none}
.ca-top{position:sticky;top:0;z-index:20;transition:background .25s}
.ca-top.solid{background:color-mix(in srgb,var(--n-bg) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 1px 0 var(--n-line)}
.ca-top-in{display:flex;align-items:center;gap:24px;height:66px}
.ca-mark{display:flex;flex-direction:column;line-height:1.1}.ca-mark b{font:800 20px var(--n-disp)}.ca-mark small{font-size:11px;color:var(--n-mute);letter-spacing:.1em}
.ca-top nav{display:flex;gap:22px;margin-inline-start:auto;color:var(--n-ink2);font-size:15px}
.ca-top nav a:hover{color:var(--n-acc)}
.ca-top .n-btn{min-height:42px;font-size:14px}
@media (max-width:760px){.ca-top nav,.ca-top .n-btn{display:none}}
.ca-hero{padding:32px 0 80px}
.ca-hero-in{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.ca-copy{display:grid;gap:22px}
.ca-in{animation:ca-in .6s cubic-bezier(.2,.9,.1,1) both}
.ca-copy .ca-in:nth-child(2){animation-delay:.06s}.ca-copy .ca-in:nth-child(3){animation-delay:.12s}.ca-copy .ca-in:nth-child(4){animation-delay:.18s}
@keyframes ca-in{from{opacity:0;transform:translateX(-36px)}to{opacity:1;transform:none}}
.ca-hero h1{font-size:clamp(48px,7.4vw,104px);font-weight:800;line-height:.95;letter-spacing:-.02em}
.ca-lede{font-size:18px;color:var(--n-ink2);max-width:38ch}
.ca-facts{display:flex;gap:36px;padding-top:22px;border-top:1px solid var(--n-line)}
.ca-facts div{display:grid;gap:4px}
.ca-facts b{font:800 34px var(--n-disp);line-height:1}
.ca-facts b.ok{color:#56d68d}.ca-facts b.no{color:#ff8a73}
.ca-facts span{font-size:13px;color:var(--n-mute);display:flex;gap:6px;align-items:center}
.ca-vis{position:relative;aspect-ratio:5/6;border-radius:14px;overflow:visible}
.ca-vis img{width:100%;height:100%;object-fit:cover;border-radius:14px;clip-path:polygon(0 0,100% 0,100% 88%,86% 100%,0 100%);animation:ca-wipe 1s cubic-bezier(.7,0,.2,1) both}
@keyframes ca-wipe{from{clip-path:polygon(100% 0,100% 0,100% 0,100% 0,100% 100%)}}
.ca-stamp{position:absolute;max-width:270px;padding:16px 18px;border-radius:12px;background:var(--n-acc);color:var(--n-on);display:grid;gap:4px;box-shadow:0 18px 40px -18px rgba(0,0,0,.7);animation:ca-stamp .5s cubic-bezier(.3,1.6,.5,1) both}
.ca-stamp.s0{bottom:28px;right:-22px;animation-delay:.7s;transform:rotate(-2deg)}
.ca-stamp.s1{top:28px;left:-22px;animation-delay:.9s;background:var(--n-ink);color:var(--n-bg)}
.ca-stamp b{display:flex;gap:6px;align-items:center;font-size:16px}.ca-stamp span{font-size:13px;line-height:1.5;opacity:.9}
@keyframes ca-stamp{from{opacity:0;scale:1.4}to{opacity:1;scale:1}}
@media (max-width:860px){.ca-hero-in{grid-template-columns:1fr;gap:28px}.ca-vis{aspect-ratio:4/3;order:-1}.ca-stamp{position:static;max-width:none;margin-top:10px;transform:none!important}.ca-stamp.s1{display:none}.ca-hero{padding:8px 0 56px}}
.ca-mq{overflow:hidden;border-block:1px solid var(--n-line);padding:18px 0;background:var(--n-bg2)}
.ca-mq-t{display:flex;gap:44px;width:max-content;animation:ca-mq 38s linear infinite}
.ca-mq span{font:800 26px var(--n-disp);color:var(--n-mute);white-space:nowrap;display:flex;align-items:center;gap:44px}
.ca-mq span::after{content:"";width:8px;height:8px;background:var(--n-acc);transform:rotate(45deg)}
@keyframes ca-mq{to{transform:translateX(50%)}}
.ca-sec{padding:88px 0}.ca-tight{padding-top:0}
.ca-alt{background:var(--n-bg2)}
.ca-sec h2{font-size:clamp(32px,4.4vw,56px);font-weight:800;letter-spacing:-.01em;margin-bottom:28px}
.ca-sub{color:var(--n-mute);margin-top:-14px}
.ca-size{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:-8px 0 24px;font-size:14px;color:var(--n-mute)}
.ca-size .n-chips{margin:0}
.ca-size .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.ca-grp+.ca-grp{margin-top:36px}
.ca-gh{font:600 15px var(--n-body);color:var(--n-acc);margin-bottom:14px}
.ca-bento{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ca-bento.c1{grid-template-columns:1fr}.ca-bento.c2{grid-template-columns:1fr 1fr}
.ca-bento.c4 article:first-child,.ca-bento.c5 article:first-child{grid-row:span 2}
.ca-bento.c4{grid-template-columns:1.3fr 1fr 1fr}
.ca-bento article{position:relative;padding:22px;border-radius:14px;background:var(--n-bg2);border:1px solid var(--n-line);display:grid;gap:10px;align-content:start;min-height:150px;transition:border-color .2s,transform .2s cubic-bezier(.2,.9,.1,1)}
.ca-bento article:hover{border-color:var(--n-acc);transform:translateY(-3px)}
.ca-bento.c4 article:first-child,.ca-bento.c5 article:first-child{background:var(--n-acc);color:var(--n-on);border-color:transparent}
.ca-bento.c4 article:first-child h4,.ca-bento.c5 article:first-child h4{font-size:30px}
.ca-bento h4{font:600 20px var(--n-disp);margin:0;padding-inline-end:58px}
.ca-bento p{font-size:14px;opacity:.75}
.ca-bento footer{display:flex;justify-content:space-between;align-items:center;margin-top:auto}
.ca-bento .du{display:inline-flex;gap:6px;align-items:center;font-size:13px;opacity:.75}
.ca-bento footer b{font:800 22px var(--n-disp)}
.ca-p{animation:ca-flip .35s cubic-bezier(.2,.9,.1,1)}
@keyframes ca-flip{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
.ca-bento footer a{font-size:13px;font-weight:600;color:var(--n-acc)}
.ca-bento article:first-child footer a{color:inherit;text-decoration:underline}
.ca-bento button{position:absolute;top:16px;left:16px;min-height:34px;padding:0 12px;border-radius:8px;border:1px solid currentColor;background:transparent;color:inherit;font:600 13px var(--n-body);cursor:pointer;opacity:.8;transition:opacity .2s,background .2s,transform .15s}
.ca-bento button:hover{opacity:1}.ca-bento button:active{transform:scale(.94)}
@media (max-width:760px){.ca-bento,.ca-bento.c2,.ca-bento.c4{grid-template-columns:1fr}.ca-bento article:first-child{grid-row:auto}.ca-sec{padding:60px 0}}
.ca-band{background:var(--n-acc);color:var(--n-on);padding:64px 0}
.ca-band b{display:block;font:800 clamp(28px,4vw,52px)/1.1 var(--n-disp);margin-bottom:12px}
.ca-band p{font-size:clamp(17px,1.8vw,22px);max-width:52ch;font-weight:500}
.ca-prom{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.ca-prom>div{padding:26px;border-radius:14px;border:1px solid var(--n-line)}
.ca-prom h3{font-size:22px;font-weight:600;margin-bottom:8px}
.ca-prom p{color:var(--n-ink2);font-size:15px}
.ca-prom ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}.ca-prom li{display:flex;gap:8px;align-items:center}.ca-prom li svg{color:var(--n-acc)}
.ca-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.ca-card{background:var(--n-bg);border:1px solid var(--n-line);border-radius:14px;padding:26px}
.ca-card .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.ca-rv{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ca-rv figure{margin:0;padding:24px;border-radius:14px;background:var(--n-bg2);display:grid;gap:12px;align-content:start}
.ca-rv blockquote{margin:0;font-size:17px;line-height:1.7}
.ca-rv figcaption{font-size:13px;color:var(--n-mute)}
.ca-shots{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.ca-shots.c2{grid-template-columns:1fr 1fr}.ca-shots.c3{grid-template-columns:2fr 1fr 1fr}
.ca-shots img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;filter:grayscale(.3);transition:filter .3s}
.ca-shots img:hover{filter:none}
.ca-faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.ca-faq details{border-bottom:1px solid var(--n-line)}
.ca-faq summary{list-style:none;display:flex;justify-content:space-between;gap:12px;padding:18px 0;font:600 17px var(--n-body);cursor:pointer}
.ca-faq summary::-webkit-details-marker{display:none}
.ca-faq summary span{color:var(--n-acc);transition:transform .25s}.ca-faq details[open] summary span{transform:rotate(45deg)}
.ca-faq p{padding-bottom:18px;color:var(--n-ink2)}
.ca-visit{display:grid;grid-template-columns:1fr 1fr;gap:48px}.ca-visit .n-row{margin-top:20px}
.ca-foot{display:flex;justify-content:space-between;padding:26px 0;color:var(--n-mute);font-size:14px}.ca-foot b{color:var(--n-ink)}
@media (max-width:760px){.ca-book,.ca-faq,.ca-visit{grid-template-columns:1fr;gap:24px}.ca-rv{grid-template-columns:1fr}.ca-shots,.ca-shots.c3{grid-template-columns:1fr 1fr}.ca-card{padding:18px}}
`
