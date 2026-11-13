'use client'

/**
 * Beauty & spa, option B «جلسات» (immersive, tabbed). SAMPLE.
 * Full-bleed photo opening, then one tab per thing the place offers (شعر،
 * أظافر، مساج…) with a pill that glides between tabs on a spring. Packages
 * scroll sideways, reviews run in one slow marquee, notes open on tap.
 * Motion: springy and tactile. Tabs glide, cards lift, accordion springs.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#eef1ed', surface: '#e1e7e1', text: '#18211c', muted: '#5f6d65', accent: '#2f5d4a', border: '#d3dbd4' }

export default function BeautyB({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled(200)
  const groups = useMemo(() => {
    const m = new Map<string, typeof n.services>()
    for (const s of n.services) { const g = x.groups?.[s.name] || 'الخدمات'; m.set(g, [...(m.get(g) || []), s]) }
    return Array.from(m.entries())
  }, [n.services, x.groups])
  const [tab, setTab] = useState(0)
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const tabsRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ l: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const el = tabsRef.current?.querySelectorAll<HTMLButtonElement>('button')[tab]
    if (el) setPill({ l: el.offsetLeft, w: el.offsetWidth })
  }, [tab, groups.length])
  const notes = (x.blocks || []).filter((b) => b.text.trim())
  const active = groups[Math.min(tab, groups.length - 1)]

  return (
    <div ref={ref} className="nv bb2" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Alexandria", sans-serif', ['--n-body' as string]: '"Readex Pro", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;500;700&family=Readex+Pro:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`b2-top${solid ? ' solid' : ''}`}>
        <a href="#top" className="b2-mark">{n.short}</a>
        <a className="n-btn" href="#book">احجزي</a>
      </header>

      <section id="top" className="b2-hero">
        {n.hero ? <img src={n.hero} alt={`داخل ${n.b.name}`} /> : null}
        <div className="b2-hero-in n-w">
          <p className="b2-kick">{[n.b.audience || x.privacy, n.where].filter(Boolean).join(' · ')}</p>
          <h1>{n.short}</h1>
          <p className="b2-lede">{content.hero.subheadline || n.b.tagline}</p>
          <div className="b2-facts">
            {n.rating ? <span><b>{n.rating.toFixed(1)}</b><Stars n={n.rating} /><small>{n.count ? `${ar(n.count)} تقييم` : 'جوجل'}</small></span> : null}
            {n.st ? <span><b className={n.st.open ? 'on' : 'off'}>{n.st.open ? 'مفتوح' : 'مغلق'}</b><small>{n.st.text}</small></span> : null}
          </div>
        </div>
      </section>

      <section id="menu" className="b2-sec n-w">
        <h2 data-r>الجلسات</h2>
        {groups.length > 1 ? (
          <div className="b2-tabs" ref={tabsRef} role="tablist" data-r>
            {pill ? <i className="b2-pill" style={{ transform: `translateX(${pill.l}px)`, width: pill.w }} /> : null}
            {groups.map(([g], i) => <button key={g} role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{g}</button>)}
          </div>
        ) : null}
        <div className="b2-cards" key={tab}>
          {active?.[1].map((s, i) => (
            <article key={s.name} style={{ ['--i' as string]: i }}>
              <h3>{s.name}</h3>
              {s.description ? <p>{s.description}</p> : null}
              <footer>
                {s.duration ? <span className="du">{Ic.clock}{s.duration}</span> : <span />}
                {s.price_from ? <b>{s.price_from}</b> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${s.name}؟`)!} target="_blank" rel="noopener noreferrer">اسألي عن السعر</a> : null}
              </footer>
              <button type="button" className="b2-go" onClick={() => { setPick(s.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }} aria-label={`احجزي ${s.name}`}>{Ic.arrow}</button>
            </article>
          ))}
        </div>
      </section>

      {x.packages?.length ? (
        <section className="b2-sec b2-dark"><div className="n-w">
          <h2 data-r>الباقات</h2>
          <div className="b2-strip">
            {x.packages.map((p, i) => (
              <article key={p.name} data-r style={{ ['--d' as string]: i }}>
                <span className="b2-n">{p.duration || ' '}</span>
                <h3>{p.name}</h3>
                <p>{p.includes.join('، ')}</p>
                <footer>{p.price ? <b>{p.price}</b> : <span>اسألي عن السعر</span>}<a className="n-btn" href="#book" onClick={() => setPick(p.name)}>احجزي</a></footer>
              </article>
            ))}
          </div>
        </div></section>
      ) : null}

      {x.features?.length ? (
        <section className="b2-sec n-w b2-feat">
          {x.features.slice(0, 4).map((f, i) => <p key={f} data-r style={{ ['--d' as string]: i }}>{f}</p>)}
        </section>
      ) : null}

      {n.reviews.length >= 3 ? (
        <section className="b2-mq" aria-label="تقييمات جوجل">
          <div className="b2-mq-track">{[...n.reviews, ...n.reviews].map((r, i) => <figure key={i} aria-hidden={i >= n.reviews.length}><blockquote>{r.text}</blockquote><figcaption><Stars n={r.rating} /> {r.name}</figcaption></figure>)}</div>
        </section>
      ) : n.reviews.length ? (
        <section className="b2-sec n-w"><figure className="b2-one"><blockquote>{n.reviews[0].text}</blockquote><figcaption>{n.reviews[0].name} · جوجل</figcaption></figure></section>
      ) : null}

      {notes.length || n.faq.length ? (
        <section className="b2-sec n-w b2-narrow">
          <h2 data-r>قبل الجلسة</h2>
          <div className="b2-acc">
            {[...notes.map((b) => ({ q: b.title, a: b.text })), ...n.faq].map((f, i) => <details key={i} data-r><summary>{f.q}<span>{Ic.plus}</span></summary><div><p>{f.a}</p></div></details>)}
          </div>
        </section>
      ) : null}

      <section id="book" className="b2-sec b2-tint"><div className="n-w b2-book">
        <div data-r><h2>احجزي موعدك</h2><p className="b2-sub">يصلنا طلبك، ونؤكّد لك الموعد على واتساب.</p></div>
        <div className="b2-card" data-r><Book n={n} options={[...n.services.map((s) => s.name), ...(x.packages || []).map((p) => p.name)]} place="المركز" pick={pick} setPick={setPick} /></div>
      </div></section>

      {x.facilities?.length ? (
        <section className="b2-sec n-w"><h2 data-r>في المركز</h2><ul className="b2-fac">{x.facilities.map((f, i) => <li key={f} data-r style={{ ['--d' as string]: i }}>{Ic.check}{f}</li>)}</ul></section>
      ) : null}

      <section id="visit" className="b2-sec b2-tint"><div className="n-w b2-visit">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="b2-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="b2-foot n-w"><b>{n.b.name}</b>{n.b.latin ? <span dir="ltr">{n.b.latin}</span> : null}</footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجزي موعدك</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.bb2{--n-r-btn:14px;--n-r-in:12px}
.b2-top{position:fixed;inset:0 0 auto;z-index:20;display:flex;justify-content:space-between;align-items:center;padding:14px max(16px,calc((100% - 1180px)/2));color:#fff;transition:background .35s,color .35s,box-shadow .35s}
.b2-top.solid{background:color-mix(in srgb,var(--n-bg) 90%,transparent);color:var(--n-ink);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--n-line)}
.b2-mark{font:700 20px var(--n-disp)}
.b2-top .n-btn{min-height:40px;padding:0 18px}
.b2-hero{position:relative;min-height:100dvh;display:flex;align-items:flex-end;color:#fff;overflow:hidden;background:#18211c}
.b2-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:b2-ken 14s ease-out both}
.b2-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(10,16,13,.86) 0%,rgba(10,16,13,.35) 45%,rgba(10,16,13,.1) 100%)}
@keyframes b2-ken{from{transform:scale(1.12)}to{transform:scale(1)}}
.b2-hero-in{position:relative;z-index:1;padding:0 0 56px;display:grid;gap:14px}
.b2-hero-in>*{animation:b2-up .9s cubic-bezier(.2,.8,.2,1) both}
.b2-hero-in>*:nth-child(2){animation-delay:.08s}.b2-hero-in>*:nth-child(3){animation-delay:.16s}.b2-hero-in>*:nth-child(4){animation-delay:.24s}
@keyframes b2-up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
.b2-kick{font-size:14px;opacity:.85}
.b2-hero h1{font-size:clamp(52px,9vw,120px);font-weight:700;line-height:1;letter-spacing:-.02em}
.b2-lede{font-size:clamp(16px,1.6vw,20px);max-width:40ch;opacity:.92}
.b2-facts{display:flex;gap:28px;margin-top:10px;flex-wrap:wrap}
.b2-facts span{display:grid;gap:2px}
.b2-facts b{font:500 26px var(--n-disp);display:flex;align-items:center;gap:8px}
.b2-facts b.on::before,.b2-facts b.off::before{content:"";width:9px;height:9px;border-radius:50%;background:#5fd39a}.b2-facts b.off::before{background:#ff8a7a}
.b2-facts small{font-size:13px;opacity:.75}
.b2-sec{padding:96px 0}.b2-sec.n-w{padding-inline:0}
.b2-sec h2{font-size:clamp(32px,4.4vw,54px);font-weight:500;letter-spacing:-.01em;margin-bottom:24px}
.b2-sub{color:var(--n-mute);margin-top:-12px}
.b2-tabs{position:relative;display:inline-flex;gap:4px;padding:5px;border-radius:999px;background:var(--n-bg2);max-width:100%;overflow-x:auto;scrollbar-width:none;margin-bottom:28px}
.b2-tabs button{position:relative;z-index:1;border:0;background:none;min-height:44px;padding:0 20px;border-radius:999px;font:500 15px var(--n-body);color:var(--n-ink2);cursor:pointer;white-space:nowrap;transition:color .3s}
.b2-tabs button.on{color:var(--n-on)}
.b2-pill{position:absolute;top:5px;bottom:5px;right:auto;left:0;border-radius:999px;background:var(--n-acc);transition:transform .5s cubic-bezier(.34,1.45,.5,1),width .5s cubic-bezier(.34,1.45,.5,1);box-shadow:0 6px 18px -8px var(--n-acc)}
.b2-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.b2-cards article{position:relative;padding:24px;border-radius:20px;background:var(--n-bg2);display:grid;gap:10px;align-content:start;min-height:170px;animation:b2-card .55s cubic-bezier(.3,1.35,.5,1) both;animation-delay:calc(var(--i)*55ms);transition:transform .3s cubic-bezier(.3,1.4,.5,1),background .3s}
.b2-cards article:hover{transform:translateY(-4px);background:color-mix(in srgb,var(--n-acc) 10%,var(--n-bg2))}
@keyframes b2-card{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
.b2-cards h3{font-size:21px;font-weight:500;padding-inline-end:44px}
.b2-cards p{font-size:14px;color:var(--n-mute)}
.b2-cards footer{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px}
.b2-cards .du{display:inline-flex;gap:6px;align-items:center;font-size:14px;color:var(--n-ink2)}
.b2-cards footer b{font:600 20px var(--n-body)}
.b2-cards footer a{font-size:14px;color:var(--n-acc);font-weight:600}
.b2-go{position:absolute;top:18px;left:18px;width:40px;height:40px;border-radius:50%;border:0;background:var(--n-bg);color:var(--n-ink);display:grid;place-items:center;cursor:pointer;transition:transform .25s cubic-bezier(.3,1.6,.5,1),background .2s}
.b2-go:hover{background:var(--n-acc);color:var(--n-on);transform:rotate(-12deg) scale(1.06)}
.b2-dark{background:var(--n-acc);color:var(--n-on)}
.b2-strip{display:grid;grid-auto-flow:column;grid-auto-columns:min(380px,82%);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;scrollbar-width:none;margin-inline:-16px;padding-inline:16px}
.b2-strip article{scroll-snap-align:start;padding:28px;border-radius:24px;background:color-mix(in srgb,var(--n-on) 9%,transparent);border:1px solid color-mix(in srgb,var(--n-on) 16%,transparent);display:grid;gap:12px;align-content:start}
.b2-n{font-size:13px;opacity:.75}
.b2-strip h3{font-size:26px;font-weight:500}
.b2-strip p{opacity:.85;font-size:15px}
.b2-strip footer{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
.b2-strip footer b{font-size:24px}
.b2-strip .n-btn{background:var(--n-on);color:var(--n-acc)}
.b2-feat{display:grid;gap:4px}
.b2-feat p{font:300 clamp(24px,3.6vw,44px)/1.35 var(--n-disp);padding:14px 0;border-bottom:1px solid var(--n-line)}
.b2-mq{overflow:hidden;padding:40px 0;border-block:1px solid var(--n-line);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.b2-mq-track{display:flex;gap:16px;width:max-content;animation:b2-mq 60s linear infinite}
.b2-mq:hover .b2-mq-track{animation-play-state:paused}
@keyframes b2-mq{to{transform:translateX(50%)}}
.b2-mq figure{margin:0;width:340px;padding:22px;border-radius:20px;background:var(--n-bg2);display:grid;gap:12px}
.b2-mq blockquote{margin:0;font-size:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.b2-mq figcaption{font-size:13px;color:var(--n-mute);display:flex;gap:8px;align-items:center}
.b2-one{margin:0}.b2-one blockquote{margin:0;font:300 32px/1.4 var(--n-disp)}.b2-one figcaption{color:var(--n-mute);margin-top:12px}
.b2-narrow{max-width:800px}
.b2-acc details{border-radius:18px;background:var(--n-bg2);margin-bottom:10px;overflow:hidden}
.b2-acc summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 22px;font:500 17px var(--n-body);cursor:pointer}
.b2-acc summary::-webkit-details-marker{display:none}
.b2-acc summary span{transition:transform .45s cubic-bezier(.34,1.6,.5,1);color:var(--n-acc)}
.b2-acc details[open] summary span{transform:rotate(135deg)}
.b2-acc details>div{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.34,1.3,.5,1)}
.b2-acc details[open]>div{grid-template-rows:1fr}
.b2-acc details>div p{overflow:hidden;padding:0 22px;color:var(--n-ink2)}
.b2-acc details[open]>div p{padding-bottom:20px}
.b2-tint{background:var(--n-bg2)}
.b2-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.b2-card{background:var(--n-bg);border-radius:24px;padding:28px}
.b2-fac{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.b2-fac li{display:flex;gap:10px;align-items:center;padding:18px;border-radius:16px;border:1px solid var(--n-line);font-weight:500}
.b2-fac svg{color:var(--n-acc)}
.b2-visit{display:grid;grid-template-columns:1fr 1fr;gap:48px}.b2-visit .n-row{margin-top:20px}
.b2-foot{display:flex;justify-content:space-between;padding:28px 0;color:var(--n-mute);font-size:14px}.b2-foot b{color:var(--n-ink);font-family:var(--n-disp)}
@media (max-width:760px){.b2-sec{padding:64px 0}.b2-book,.b2-visit{grid-template-columns:1fr;gap:24px}.b2-card{padding:18px}.b2-hero h1{font-size:clamp(48px,15vw,72px)}.b2-cards{grid-template-columns:1fr}}
`
