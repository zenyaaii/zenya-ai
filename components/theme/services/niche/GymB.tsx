'use client'

/**
 * Gym, option B «الجدول» (clear plan). SAMPLE.
 * Light and orderly, for the person comparing gyms before paying. A switch
 * between memberships slides a pill and swaps one detail panel (price, what
 * it includes, the freeze/cancel terms), a week grid shows classes with today
 * marked, coaches are rows.
 * Motion: precise. The pill glides on a spring, the panel cross-fades, nothing loops.
 */

import { useLayoutEffect, useRef, useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { DAYS_AR } from '@/utils/services/barber'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#f3f3f0', surface: '#e7e7e2', text: '#121212', muted: '#5f5f5a', accent: '#2b4bff', border: '#d8d8d2' }

export default function GymB({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const plans = n.services
  const [sel, setSel] = useState(Math.min(1, Math.max(0, plans.length - 1)))
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const segRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ l: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const el = segRef.current?.querySelectorAll<HTMLButtonElement>('button')[sel]
    if (el) setPill({ l: el.offsetLeft, w: el.offsetWidth })
  }, [sel, plans.length])
  const p = plans[sel]
  const classes = (x.classes || []).filter((c) => c.items.length)

  return (
    <div ref={ref} className="nv gb" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Cairo", sans-serif', ['--n-body' as string]: '"Cairo", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;800;900&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`gb-top${solid ? ' solid' : ''}`}><div className="n-w gb-top-in">
        <a href="#top" className="gb-mark">{n.short}</a>
        <nav><a href="#plans">الاشتراكات</a>{classes.length ? <a href="#week">الحصص</a> : null}<a href="#visit">الموقع</a></nav>
        <a className="n-btn" href="#book">احجز حصة تجربة</a>
      </div></header>

      <section id="top" className="gb-hero n-w">
        <div className="gb-copy">
          <h1>{n.short}</h1>
          <p>{content.hero.subheadline || n.b.tagline}</p>
          <div className="n-row"><a className="n-btn" href="#book">احجز حصة تجربة</a><a className="n-btn ghost" href="#plans">قارن الاشتراكات</a></div>
          <ul className="gb-facts">
            {n.rating ? <li><b>{n.rating.toFixed(1)}</b><span><Stars n={n.rating} /> {n.count ? `${ar(n.count)} تقييم` : ''}</span></li> : null}
            {n.st ? <li><b>{n.st.open ? 'مفتوح' : 'مغلق'}</b><span>{n.st.text}</span></li> : null}
            {content.booking?.busy ? <li><b>الزحمة</b><span>{content.booking.busy}</span></li> : null}
          </ul>
        </div>
        {n.hero ? <div className="gb-img"><img src={n.hero} alt={`داخل ${n.b.name}`} /></div> : null}
      </section>

      {plans.length ? (
        <section id="plans" className="gb-sec gb-alt"><div className="n-w">
          <h2 data-r>الاشتراكات</h2>
          {plans.length > 1 ? (
            <div className="gb-seg" ref={segRef} role="tablist" data-r>
              {pill ? <i style={{ transform: `translateX(${pill.l}px)`, width: pill.w }} /> : null}
              {plans.map((pl, i) => <button key={pl.name} role="tab" aria-selected={sel === i} className={sel === i ? 'on' : ''} onClick={() => setSel(i)}>{pl.name}</button>)}
            </div>
          ) : null}
          {p ? (
            <div className="gb-panel" key={sel}>
              <div>
                <span className="gb-k">{p.name}</span>
                {p.price_from ? <b className="gb-price">{p.price_from}</b> : <b className="gb-price sm">اسأل عن السعر</b>}
                {p.duration ? <span className="gb-k">{p.duration}</span> : null}
                {p.description ? <p>{p.description}</p> : null}
                <button type="button" className="n-btn" onClick={() => { setPick(p.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>اشترك في {p.name}</button>
              </div>
              {content.terms?.length ? <ul className="gb-terms">{content.terms.map((t) => <li key={t.label}>{Ic.check}<div><b>{t.label}</b><span>{t.text}</span></div></li>)}</ul> : null}
            </div>
          ) : null}
        </div></section>
      ) : null}

      {classes.length ? (
        <section id="week" className="gb-sec"><div className="n-w">
          <h2 data-r>حصص الأسبوع</h2>
          <div className="gb-week" data-r>
            {classes.map((c) => (
              <div key={c.day} className={n.st?.today === c.day ? 'today' : ''}>
                <h3>{DAYS_AR[c.day]}{n.st?.today === c.day ? <small>اليوم</small> : null}</h3>
                <ul>{c.items.map((it, i) => <li key={i}><b>{it.time}</b>{it.name}</li>)}</ul>
              </div>
            ))}
          </div>
        </div></section>
      ) : null}

      {n.members.length ? (
        <section className="gb-sec gb-alt"><div className="n-w">
          <h2 data-r>المدربون</h2>
          <ul className="gb-coach">{n.members.map((m, i) => (
            <li key={m.name} data-r style={{ ['--d' as string]: i }}>
              {m.photo ? <img src={m.photo} alt={m.name} /> : <i>{m.name.slice(0, 1)}</i>}
              <div><b>{m.name}</b>{m.role ? <small>{m.role}</small> : null}</div>
              {m.tags?.length ? <span>{m.tags.join('، ')}</span> : null}
            </li>
          ))}</ul>
        </div></section>
      ) : null}

      {n.reviews.length ? (
        <section className="gb-sec"><div className="n-w gb-rv">
          <div data-r><b className="gb-big">{n.rating?.toFixed(1)}</b><Stars n={n.rating || 5} /><p>{n.count ? `${ar(n.count)} تقييم على جوجل` : 'على جوجل'}</p></div>
          <div className="gb-rvl">{n.reviews.slice(0, 4).map((r, i) => <figure key={i} data-r style={{ ['--d' as string]: i }}><blockquote>{r.text}</blockquote><figcaption>{r.name}</figcaption></figure>)}</div>
        </div></section>
      ) : null}

      <section id="book" className="gb-sec gb-alt"><div className="n-w gb-two">
        <div data-r><h2>احجز حصة تجربة</h2><p className="gb-sub">يرد عليك النادي على واتساب.</p></div>
        <div className="gb-card" data-r><Book n={n} options={n.services.map((s) => s.name)} place="النادي" pick={pick} setPick={setPick} label="احجز الحصة" /></div>
      </div></section>

      {n.faq.length ? <section className="gb-sec n-w gb-narrow"><h2 data-r>أسئلة</h2>{n.faq.map((f, i) => <details key={i} className="gb-q" data-r><summary>{f.q}<span>{Ic.plus}</span></summary><p>{f.a}</p></details>)}</section> : null}

      <section id="visit" className="gb-sec gb-alt"><div className="n-w gb-two">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="gb-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="gb-foot n-w"><b>{n.b.name}</b><span>{n.where}</span></footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجز حصة تجربة</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.gb{--n-r-btn:12px;--n-r-in:10px}
.gb-top{position:sticky;top:0;z-index:20;transition:background .3s}
.gb-top.solid{background:color-mix(in srgb,var(--n-bg) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--n-line)}
.gb-top-in{display:flex;align-items:center;gap:24px;height:66px}
.gb-mark{font:900 20px var(--n-disp)}
.gb-top nav{display:flex;gap:22px;margin-inline-start:auto;font-size:15px;color:var(--n-ink2);font-weight:600}
.gb-top .n-btn{min-height:42px;font-size:14px}
@media (max-width:760px){.gb-top nav,.gb-top .n-btn{display:none}}
.gb-hero{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;padding:32px 0 80px}
.gb-copy{display:grid;gap:20px}
.gb-copy>*{animation:b-up .7s cubic-bezier(.2,.8,.2,1) both}
.gb-copy>*:nth-child(2){animation-delay:.07s}.gb-copy>*:nth-child(3){animation-delay:.14s}.gb-copy>*:nth-child(4){animation-delay:.21s}
@keyframes b-up{from{opacity:0;transform:translateY(20px)}}
.gb-hero h1{font-size:clamp(48px,7vw,96px);font-weight:900;line-height:1}
.gb-copy p{font-size:19px;color:var(--n-ink2);max-width:40ch}
.gb-facts{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,auto);justify-content:start;gap:28px}
.gb-facts li{display:grid;gap:2px}.gb-facts b{font:800 24px var(--n-disp)}.gb-facts span{font-size:13px;color:var(--n-mute);display:flex;gap:4px;align-items:center}
.gb-img{border-radius:20px;overflow:hidden;aspect-ratio:4/5}
.gb-img img{width:100%;height:100%;object-fit:cover;animation:gb-in 1.2s cubic-bezier(.2,.8,.2,1) both}
@keyframes gb-in{from{transform:scale(1.1);opacity:.4}}
@media (max-width:860px){.gb-hero{grid-template-columns:1fr;padding:16px 0 56px;gap:24px}.gb-img{aspect-ratio:4/3;order:-1}.gb-facts{grid-template-columns:repeat(2,auto)}}
.gb-sec{padding:88px 0}.gb-sec.n-w{padding-inline:0}
.gb-alt{background:var(--n-bg2)}
.gb-sec h2{font-size:clamp(32px,4.4vw,56px);font-weight:900;margin-bottom:24px}
.gb-sub{color:var(--n-mute);margin-top:-12px}
.gb-seg{position:relative;display:inline-flex;padding:5px;border-radius:14px;background:var(--n-bg);max-width:100%;overflow-x:auto;scrollbar-width:none;margin-bottom:20px;border:1px solid var(--n-line)}
.gb-seg i{position:absolute;top:5px;bottom:5px;left:0;border-radius:10px;background:var(--n-ink);transition:transform .5s cubic-bezier(.34,1.4,.5,1),width .5s cubic-bezier(.34,1.4,.5,1)}
.gb-seg button{position:relative;z-index:1;border:0;background:none;min-height:46px;padding:0 20px;font:700 15px var(--n-body);color:var(--n-ink2);cursor:pointer;white-space:nowrap;transition:color .3s}
.gb-seg button.on{color:var(--n-bg)}
.gb-panel{display:grid;grid-template-columns:1fr 1fr;gap:16px;animation:gb-fade .45s cubic-bezier(.2,.8,.2,1)}
@keyframes gb-fade{from{opacity:0;transform:translateY(10px)}}
.gb-panel>div{padding:32px;border-radius:20px;background:var(--n-bg);display:grid;gap:10px;align-content:start}
.gb-k{font-size:15px;color:var(--n-mute);font-weight:600}
.gb-price{font:900 clamp(64px,8vw,112px)/1 var(--n-disp);color:var(--n-acc)}
.gb-price.sm{font-size:32px}
.gb-panel .n-btn{justify-self:start;margin-top:10px}
.gb-terms{list-style:none;margin:0;padding:28px;border-radius:20px;border:1px solid var(--n-line);display:grid;gap:18px;align-content:start}
.gb-terms li{display:flex;gap:12px}.gb-terms svg{color:var(--n-acc);flex:none;margin-top:4px}
.gb-terms div{display:grid}.gb-terms span{color:var(--n-ink2)}
@media (max-width:760px){.gb-panel{grid-template-columns:1fr}.gb-panel>div,.gb-terms{padding:22px}.gb-sec{padding:60px 0}}
.gb-week{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.gb-week>div{padding:18px;border-radius:16px;border:1px solid var(--n-line);display:grid;gap:10px;align-content:start}
.gb-week>div.today{background:var(--n-ink);color:var(--n-bg);border-color:transparent}
.gb-week h3{font-size:17px;display:flex;justify-content:space-between}
.gb-week h3 small{font-size:12px;padding:2px 8px;border-radius:6px;background:var(--n-acc);color:var(--n-on)}
.gb-week ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:14px}
.gb-week b{display:block;font-size:13px;opacity:.65}
@media (max-width:760px){.gb-week{grid-auto-flow:column;grid-auto-columns:62%;grid-template-columns:none;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.gb-week>div{scroll-snap-align:start}}
.gb-coach{list-style:none;margin:0;padding:0;display:grid}
.gb-coach li{display:grid;grid-template-columns:56px 1fr 1.2fr;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid var(--n-line)}
.gb-coach img,.gb-coach i{width:56px;height:56px;border-radius:14px;object-fit:cover;display:grid;place-items:center;background:var(--n-ink);color:var(--n-bg);font:800 24px var(--n-disp);font-style:normal}
.gb-coach div{display:grid}.gb-coach b{font-size:20px}.gb-coach small{color:var(--n-mute)}
.gb-coach span{color:var(--n-ink2)}
@media (max-width:620px){.gb-coach li{grid-template-columns:56px 1fr}.gb-coach span{grid-column:2}}
.gb-rv{display:grid;grid-template-columns:.6fr 1.4fr;gap:40px;align-items:start}
.gb-big{display:block;font:900 96px/1 var(--n-disp)}
.gb-rv p{color:var(--n-mute)}
.gb-rvl{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gb-rvl figure{margin:0;padding:22px;border-radius:16px;background:var(--n-bg2);display:grid;gap:10px}
.gb-rvl blockquote{margin:0}.gb-rvl figcaption{font-size:13px;color:var(--n-mute)}
@media (max-width:760px){.gb-rv,.gb-rvl{grid-template-columns:1fr}}
.gb-two{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.gb-two .n-row{margin-top:20px}
.gb-card{background:var(--n-bg);border-radius:20px;padding:26px}
.gb-narrow{max-width:800px}
.gb-q{border-bottom:1px solid var(--n-line)}
.gb-q summary{list-style:none;display:flex;justify-content:space-between;padding:18px 0;font-weight:700;cursor:pointer}
.gb-q summary::-webkit-details-marker{display:none}
.gb-q summary span{transition:transform .3s}.gb-q[open] summary span{transform:rotate(45deg)}
.gb-q p{padding-bottom:18px;color:var(--n-ink2)}
.gb-foot{display:flex;justify-content:space-between;padding:26px 0;color:var(--n-mute);font-size:14px}.gb-foot b{color:var(--n-ink)}
@media (max-width:760px){.gb-two{grid-template-columns:1fr;gap:24px}.gb-card{padding:18px}}
`
