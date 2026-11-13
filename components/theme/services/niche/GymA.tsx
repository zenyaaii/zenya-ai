'use client'

/**
 * Gym, option A «الطاقة» (energy). SAMPLE.
 * Dark, loud and condensed. The name stands huge over the gym floor, what
 * people train runs once across the page, memberships are tall price tiles
 * with the middle one raised, coaches by name, classes by day.
 * Motion: punchy. Words slide up per line, prices count up, tiles spring.
 */

import { useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { DAYS_AR } from '@/utils/services/barber'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#0d0e0f', surface: '#17191b', text: '#f2f2ef', muted: '#8e9295', accent: '#ff5b24', border: '#26292c' }

export default function GymA({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const tags = Array.from(new Set([...(x.offers || []), ...n.members.flatMap((m) => m.tags || [])]))
  const plans = n.services
  const mid = plans.length >= 3 ? 1 : -1
  const classes = (x.classes || []).filter((c) => c.items.length)
  const [day, setDay] = useState(() => classes[0]?.day ?? 0)
  const today = classes.find((c) => c.day === day) || classes[0]

  return (
    <div ref={ref} className="nv ga" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Changa", sans-serif', ['--n-body' as string]: '"Readex Pro", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Changa:wght@500;700;800&family=Readex+Pro:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`ga-top${solid ? ' solid' : ''}`}><div className="n-w ga-top-in">
        <a href="#top" className="ga-mark">{n.short}</a>
        <nav><a href="#plans">الاشتراكات</a>{n.members.length ? <a href="#coach">المدربون</a> : null}<a href="#visit">الموقع</a></nav>
        <a className="n-btn" href="#book">احجز حصة تجربة</a>
      </div></header>

      <section id="top" className="ga-hero">
        {n.hero ? <img src={n.hero} alt={`داخل ${n.b.name}`} /> : null}
        <div className="n-w ga-hero-in">
          <h1><span>{n.short}</span></h1>
          <div className="ga-row">
            <p>{content.hero.subheadline || n.b.tagline}</p>
            <div className="n-row"><a className="n-btn" href="#book">احجز حصة تجربة</a><a className="n-btn ghost" href="#plans">الاشتراكات</a></div>
          </div>
          <div className="ga-facts">
            {n.rating ? <span><b>{n.rating.toFixed(1)}</b><Stars n={n.rating} />{n.count ? `${ar(n.count)} تقييم` : ''}</span> : null}
            {n.st ? <span><b className={n.st.open ? 'ok' : 'no'}>{n.st.open ? 'مفتوح' : 'مغلق'}</b>{n.st.text}</span> : null}
            {content.booking?.busy ? <span><b>الزحمة</b>{content.booking.busy}</span> : null}
          </div>
        </div>
      </section>

      {tags.length >= 3 ? (
        <section className="ga-mq" aria-label="ماذا نتدرب"><div className="ga-mq-t">{[...tags, ...tags, ...tags].map((t, i) => <span key={i} aria-hidden={i >= tags.length}>{t}</span>)}</div></section>
      ) : null}

      <section id="plans" className="ga-sec"><div className="n-w">
        <h2 data-r>الاشتراكات</h2>
        {content.terms?.length ? <p className="ga-sub" data-r>بلا رسوم مخفية. الشروط مكتوبة تحت.</p> : null}
        <div className={`ga-plans c${Math.min(plans.length, 4)}`}>
          {plans.map((p, i) => (
            <article key={p.name} className={i === mid ? 'hot' : ''} data-r style={{ ['--d' as string]: i }}>
              <h3>{p.name}</h3>
              {p.price_from ? <b className="ga-price">{p.price_from}</b> : <span className="ga-ask">اسأل عن السعر</span>}
              {p.duration ? <span className="ga-dur">{p.duration}</span> : null}
              {p.description ? <p>{p.description}</p> : null}
              <button type="button" className="n-btn" onClick={() => { setPick(p.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }}>{i === mid ? 'ابدأ بهذا' : 'اختر'}</button>
            </article>
          ))}
        </div>
        {content.terms?.length ? <dl className="ga-terms" data-r>{content.terms.map((t) => <div key={t.label}><dt>{t.label}</dt><dd>{t.text}</dd></div>)}</dl> : null}
      </div></section>

      {n.members.length ? (
        <section id="coach" className="ga-sec ga-alt"><div className="n-w">
          <h2 data-r>المدربون</h2>
          <div className="ga-coach">
            {n.members.map((m, i) => (
              <article key={m.name} data-r style={{ ['--d' as string]: i }}>
                {m.photo ? <img src={m.photo} alt={m.name} /> : <i className="ga-mono">{m.name.slice(0, 1)}</i>}
                <h3>{m.name}</h3>
                {m.role ? <small>{m.role}</small> : null}
                {m.tags?.length ? <ul>{m.tags.map((t) => <li key={t}>{t}</li>)}</ul> : null}
                {m.quote ? <blockquote>«{m.quote}»</blockquote> : null}
              </article>
            ))}
          </div>
        </div></section>
      ) : null}

      {classes.length ? (
        <section className="ga-sec"><div className="n-w">
          <h2 data-r>الحصص</h2>
          <div className="n-chips ga-days" data-r>{classes.map((c) => <button key={c.day} type="button" className={day === c.day ? 'on' : ''} onClick={() => setDay(c.day)}>{DAYS_AR[c.day]}</button>)}</div>
          <ul className="ga-cls" key={day}>{today?.items.map((it, i) => <li key={i} style={{ ['--i' as string]: i }}><b>{it.time}</b><span>{it.name}</span></li>)}</ul>
        </div></section>
      ) : null}

      <section id="book" className="ga-sec ga-hotbg"><div className="n-w ga-book">
        <div data-r><h2>احجز حصة تجربة</h2><p>اختر الوقت، ويرد عليك النادي على واتساب.</p></div>
        <div className="ga-card" data-r><Book n={n} options={n.services.map((s) => s.name)} place="النادي" pick={pick} setPick={setPick} label="احجز الحصة" /></div>
      </div></section>

      {n.reviews.length ? (
        <section className="ga-sec"><div className="n-w ga-rv">{n.reviews.slice(0, 3).map((r, i) => <figure key={i} data-r style={{ ['--d' as string]: i }}><blockquote>{r.text}</blockquote><figcaption><Stars n={r.rating} /> {r.name}</figcaption></figure>)}</div></section>
      ) : null}

      {n.rest.length >= 2 ? <section className="ga-gal">{n.rest.slice(0, 4).map((u, i) => <img key={u} src={u} alt={`${n.short} ${i + 1}`} loading="lazy" data-r style={{ ['--d' as string]: i }} />)}</section> : null}

      {n.faq.length ? <section className="ga-sec n-w ga-narrow"><h2 data-r>أسئلة</h2>{n.faq.map((f, i) => <details key={i} className="ga-q" data-r><summary>{f.q}<span>{Ic.plus}</span></summary><p>{f.a}</p></details>)}</section> : null}

      <section id="visit" className="ga-sec ga-alt"><div className="n-w ga-book">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p>{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="ga-foot n-w"><b>{n.b.name}</b><span>{n.where}</span></footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجز حصة تجربة</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.ga{--n-r-btn:6px;--n-r-in:6px}
.ga-top{position:fixed;inset:0 0 auto;z-index:20;transition:background .25s}
.ga-top.solid{background:color-mix(in srgb,var(--n-bg) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.ga-top-in{display:flex;align-items:center;gap:24px;height:66px}
.ga-mark{font:800 22px var(--n-disp);text-transform:uppercase}
.ga-top nav{display:flex;gap:22px;margin-inline-start:auto;color:var(--n-ink2);font-size:15px}
.ga-top .n-btn{min-height:42px;font-size:14px}
@media (max-width:760px){.ga-top nav,.ga-top .n-btn{display:none}}
.ga-hero{position:relative;min-height:100dvh;display:flex;align-items:flex-end;overflow:hidden}
.ga-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.35) contrast(1.05);animation:ga-zoom 1.6s cubic-bezier(.2,.8,.2,1) both}
@keyframes ga-zoom{from{transform:scale(1.15)}to{transform:none}}
.ga-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,var(--n-bg) 4%,color-mix(in srgb,var(--n-bg) 55%,transparent) 50%,color-mix(in srgb,var(--n-bg) 20%,transparent))}
.ga-hero-in{position:relative;z-index:1;padding-bottom:40px;display:grid;gap:22px}
.ga-hero h1{overflow:hidden}
.ga-hero h1 span{display:block;font-size:clamp(72px,15vw,220px);font-weight:800;line-height:.85;letter-spacing:-.02em;animation:ga-up .9s cubic-bezier(.2,.9,.1,1) .1s both}
@keyframes ga-up{from{transform:translateY(105%)}to{transform:none}}
.ga-row{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;animation:b-fade .8s .5s both}
@keyframes b-fade{from{opacity:0}}
.ga-row p{font-size:18px;color:var(--n-ink2);max-width:40ch}
.ga-facts{display:flex;gap:32px;flex-wrap:wrap;border-top:1px solid var(--n-line);padding-top:16px;font-size:13px;color:var(--n-mute);animation:b-fade .8s .7s both}
.ga-facts span{display:flex;gap:8px;align-items:center}
.ga-facts b{font:700 18px var(--n-disp);color:var(--n-ink)}.ga-facts b.ok{color:#5bd68e}.ga-facts b.no{color:#ff8a73}
.ga-mq{overflow:hidden;background:var(--n-acc);color:var(--n-on);padding:14px 0;transform:rotate(-1.2deg) scale(1.02);margin:10px 0}
.ga-mq-t{display:flex;gap:28px;width:max-content;animation:ga-mq 30s linear infinite}
.ga-mq span{font:800 30px var(--n-disp);white-space:nowrap;display:flex;gap:28px;align-items:center}
.ga-mq span::after{content:"✦";font-size:18px}
@keyframes ga-mq{to{transform:translateX(33.333%)}}
.ga-sec{padding:96px 0}.ga-sec.n-w{padding-inline:0}
.ga-alt{background:var(--n-bg2)}
.ga-sec h2{font-size:clamp(40px,6vw,84px);font-weight:800;line-height:1;margin-bottom:24px;text-transform:uppercase}
.ga-sub{color:var(--n-mute);margin-top:-10px;margin-bottom:24px}
.ga-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:end}
.ga-plans.c1{grid-template-columns:1fr;max-width:520px}.ga-plans.c2{grid-template-columns:1fr 1fr}.ga-plans.c4{grid-template-columns:repeat(4,1fr)}
.ga-plans article{padding:28px 24px;border-radius:8px;background:var(--n-bg2);border:1px solid var(--n-line);display:grid;gap:8px;min-height:300px;align-content:start;transition:transform .35s cubic-bezier(.3,1.5,.5,1)}
.ga-plans article:hover{transform:translateY(-6px)}
.ga-plans article.hot{background:var(--n-acc);color:var(--n-on);border-color:transparent;min-height:360px}
.ga-plans article.hot .n-btn{background:var(--n-on);color:var(--n-acc)}
.ga-plans h3{font:700 22px var(--n-disp)}
.ga-price{font:800 clamp(52px,6vw,80px)/1 var(--n-disp);margin-top:auto}
.ga-ask{margin-top:auto;font-weight:600}
.ga-dur{font-size:14px;opacity:.75}
.ga-plans p{font-size:14px;opacity:.8}
.ga-plans .n-btn{margin-top:14px}
@media (max-width:860px){.ga-plans,.ga-plans.c2,.ga-plans.c4{grid-template-columns:1fr}.ga-plans article,.ga-plans article.hot{min-height:0}.ga-plans article.hot{order:-1}}
.ga-terms{margin:28px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.ga-terms div{padding:16px 18px;border-inline-start:3px solid var(--n-acc);background:var(--n-bg2)}
.ga-terms dt{font-weight:700}.ga-terms dd{margin:0;color:var(--n-ink2);font-size:14px}
.ga-coach{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.ga-coach article{padding:24px;border-radius:8px;background:var(--n-bg);display:grid;gap:8px;align-content:start}
.ga-coach img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px}
.ga-mono{display:grid;place-items:center;width:64px;height:64px;border-radius:6px;background:var(--n-acc);color:var(--n-on);font:800 32px var(--n-disp);font-style:normal}
.ga-coach h3{font:800 28px var(--n-disp)}.ga-coach small{color:var(--n-mute)}
.ga-coach ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px}
.ga-coach li{font-size:13px;padding:4px 10px;border-radius:4px;border:1px solid var(--n-line)}
.ga-coach blockquote{margin:6px 0 0;font-size:14px;color:var(--n-ink2)}
.ga-days{margin-bottom:20px}
.ga-days button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.ga-cls{list-style:none;margin:0;padding:0;display:grid}
.ga-cls li{display:flex;gap:24px;align-items:baseline;padding:18px 0;border-bottom:1px solid var(--n-line);animation:ga-li .45s cubic-bezier(.2,.9,.1,1) both;animation-delay:calc(var(--i)*60ms)}
@keyframes ga-li{from{opacity:0;transform:translateX(-24px)}}
.ga-cls b{font:800 26px var(--n-disp);min-width:110px;color:var(--n-acc)}
.ga-cls span{font-size:20px;font-weight:500}
.ga-hotbg{background:var(--n-ink);color:var(--n-bg)}
.ga-hotbg h2{color:var(--n-bg)}
.ga-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.ga-book .n-row{margin-top:20px}
.ga-card{background:var(--n-bg);color:var(--n-ink);border-radius:8px;padding:26px}
.ga-card .n-chips button.on{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on)}
.ga-rv{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.ga-rv figure{margin:0;display:grid;gap:12px;padding-top:18px;border-top:3px solid var(--n-acc)}
.ga-rv blockquote{margin:0;font-size:18px}
.ga-rv figcaption{font-size:13px;color:var(--n-mute);display:flex;gap:8px;align-items:center}
.ga-gal{display:grid;grid-template-columns:repeat(4,1fr)}
.ga-gal img{width:100%;aspect-ratio:1;object-fit:cover;filter:grayscale(1);transition:filter .4s}.ga-gal img:hover{filter:none}
.ga-narrow{max-width:800px}
.ga-q{border-bottom:1px solid var(--n-line)}
.ga-q summary{list-style:none;display:flex;justify-content:space-between;padding:18px 0;font-weight:600;cursor:pointer}
.ga-q summary::-webkit-details-marker{display:none}
.ga-q summary span{color:var(--n-acc);transition:transform .3s}.ga-q[open] summary span{transform:rotate(45deg)}
.ga-q p{padding-bottom:18px;color:var(--n-ink2)}
.ga-foot{display:flex;justify-content:space-between;padding:26px 0;color:var(--n-mute);font-size:14px}.ga-foot b{color:var(--n-ink);font-family:var(--n-disp);font-size:20px}
@media (max-width:760px){.ga-sec{padding:60px 0}.ga-book{grid-template-columns:1fr;gap:24px}.ga-rv{grid-template-columns:1fr}.ga-gal{grid-template-columns:1fr 1fr}.ga-card{padding:18px}.ga-hero h1 span{font-size:clamp(64px,22vw,110px)}}
`
