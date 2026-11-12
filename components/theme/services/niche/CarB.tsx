'use client'

/**
 * Car services, option B «تقرير الفحص» (light, step by step). SAMPLE.
 * A trust-first page for the owner who fears the bill: the visit is told as
 * steps (book → check → the price on WhatsApp → the work → hand-over), and a
 * line draws down the steps as you scroll. Services are a checklist that
 * ticks in, warranty and parts sit on one "report" card.
 * Motion: calm and explanatory. Scroll-linked line, ticks, nothing loops.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#f1f3f5', surface: '#e4e8ec', text: '#11161b', muted: '#5b6670', accent: '#1d5bd6', border: '#d4dae0' }

export default function CarB({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const has = (id: string) => (x.blocks || []).find((b) => b.id === id && b.text.trim())
  const steps = useMemo(() => {
    const s: { t: string; d: string }[] = [{ t: 'احجز موعدك', d: 'من الموقع أو على واتساب. اختر الوقت الذي يناسبك.' }]
    const free = has('free_check')
    s.push({ t: free ? 'فحص مجاني' : 'نفحص السيارة', d: free ? free.text : 'نحدد المشكلة قبل أي عمل.' })
    const pf = has('price_first')
    if (pf) s.push({ t: 'السعر على واتساب', d: pf.text })
    s.push({ t: 'نصلح', d: x.features?.[0] || 'يعمل على سيارتك فني يعرفها.' })
    const w = has('warranty')
    s.push({ t: 'تستلم سيارتك', d: w ? `ومعها الضمان: ${w.text}` : 'نشرح لك ما عملناه.' })
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x.blocks, x.features])
  const lineRef = useRef<HTMLOListElement>(null)
  const [prog, setProg] = useState(0)
  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProg(1); return }
    let raf = 0
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = el.getBoundingClientRect(); const vh = window.innerHeight; setProg(Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height))) }) }
    on(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])
  const report = [has('warranty') && { k: 'الضمان', v: has('warranty')!.text }, has('parts') && { k: 'القطع', v: has('parts')!.text }, has('loyalty') && { k: 'للزبون الدائم', v: has('loyalty')!.text }].filter(Boolean) as { k: string; v: string }[]

  return (
    <div ref={ref} className="nv cb" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Noto Kufi Arabic", sans-serif', ['--n-body' as string]: '"IBM Plex Sans Arabic", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`cb-top${solid ? ' solid' : ''}`}><div className="n-w cb-top-in">
        <a href="#top" className="cb-mark">{n.short}</a>
        <nav><a href="#how">كيف نعمل</a><a href="#svc">الخدمات</a><a href="#visit">الموقع</a></nav>
        <a className="n-btn" href="#book">احجز موعدك</a>
      </div></header>

      <section id="top" className="cb-hero n-w">
        <div className="cb-head">
          {n.rating ? <a className="cb-g" href={n.mapsUrl || '#rv'}><Stars n={n.rating} /><b>{n.rating.toFixed(1)}</b>{n.count ? `${ar(n.count)} تقييم على جوجل` : 'على جوجل'}</a> : null}
          <h1>{n.short}</h1>
          <p>{content.hero.subheadline || n.b.tagline}</p>
          <div className="n-row"><a className="n-btn" href="#book">احجز موعدك</a><a className="n-btn ghost" href="#how">كيف نعمل</a></div>
        </div>
        {n.hero ? <div className="cb-pano"><img src={n.hero} alt={`${n.b.name}`} /></div> : null}
      </section>

      <section id="how" className="cb-sec"><div className="n-w cb-how">
        <div className="cb-stick" data-r><h2>كيف نعمل</h2><p className="cb-sub">ما يحدث لسيارتك من لحظة الحجز حتى تستلمها.</p></div>
        <ol ref={lineRef} className="cb-steps" style={{ ['--p' as string]: prog }}>
          {steps.map((s, i) => <li key={s.t} className={prog * steps.length > i + 0.15 ? 'on' : ''}><i>{Ic.check}</i><h3>{s.t}</h3><p>{s.d}</p></li>)}
        </ol>
      </div></section>

      <section id="svc" className="cb-sec cb-alt"><div className="n-w">
        <h2 data-r>الخدمات</h2>
        <ul className="cb-list">
          {n.services.map((s, i) => (
            <li key={s.name} data-r style={{ ['--d' as string]: i % 6 }}>
              <i>{Ic.check}</i>
              <div><b>{s.name}</b>{s.duration ? <small>{s.duration}</small> : null}</div>
              {s.price_from ? <span className="pr">{s.price_from}</span> : n.wa ? <a href={n.waLink(`مرحبًا، كم سعر ${s.name}؟`)!} target="_blank" rel="noopener noreferrer">اسأل</a> : null}
              <button type="button" onClick={() => { setPick(s.name); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }) }} aria-label={`احجز ${s.name}`}>{Ic.arrow}</button>
            </li>
          ))}
        </ul>
        {x.brands?.length ? <p className="cb-brands" data-r><b>نعمل على:</b> {x.brands.join('، ')}</p> : null}
      </div></section>

      {report.length || x.facilities?.length ? (
        <section className="cb-sec"><div className="n-w cb-rep">
          {report.length ? (
            <div className="cb-sheet" data-r>
              <h2>ورقة الورشة</h2>
              <dl>{report.map((r) => <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>)}</dl>
            </div>
          ) : null}
          {x.facilities?.length ? <div className="cb-fac" data-r><h3>وأنت تنتظر</h3><ul>{x.facilities.map((f) => <li key={f}>{Ic.check}{f}</li>)}</ul></div> : null}
        </div></section>
      ) : null}

      <section id="book" className="cb-sec cb-alt"><div className="n-w cb-book">
        <div data-r><h2>احجز موعدك</h2><p className="cb-sub">يصلنا طلبك ونرد عليك على واتساب.</p>{n.st?.text ? <p className="cb-st">{n.st.open ? 'مفتوح الآن' : 'مغلق الآن'} · {n.st.text}</p> : null}</div>
        <div className="cb-card" data-r><Book n={n} options={n.services.map((s) => s.name)} place="الورشة" pick={pick} setPick={setPick} /></div>
      </div></section>

      {n.reviews.length ? (
        <section id="rv" className="cb-sec"><div className="n-w cb-rv">
          <figure className="big" data-r><blockquote>{n.reviews[0].text}</blockquote><figcaption><Stars n={n.reviews[0].rating} /> {n.reviews[0].name} · جوجل</figcaption></figure>
          {n.reviews.slice(1, 4).map((r, i) => <figure key={i} data-r style={{ ['--d' as string]: i + 1 }}><blockquote>{r.text}</blockquote><figcaption>{r.name}</figcaption></figure>)}
        </div></section>
      ) : null}

      {n.faq.length ? (
        <section className="cb-sec cb-narrow n-w"><h2 data-r>أسئلة شائعة</h2>{n.faq.map((f, i) => <details key={i} className="cb-q" data-r><summary>{f.q}</summary><p>{f.a}</p></details>)}</section>
      ) : null}

      <section id="visit" className="cb-sec cb-alt"><div className="n-w cb-visit">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="cb-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r><Hours n={n} /></div>
      </div></section>
      <footer className="cb-foot n-w"><b>{n.b.name}</b><span>{n.where}</span></footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجز موعدك</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.cb{--n-r-btn:12px;--n-r-in:10px}
.cb-top{position:sticky;top:0;z-index:20;transition:background .3s}
.cb-top.solid{background:color-mix(in srgb,var(--n-bg) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--n-line)}
.cb-top-in{display:flex;align-items:center;gap:24px;height:66px}
.cb-mark{font:800 19px var(--n-disp)}
.cb-top nav{display:flex;gap:22px;margin-inline-start:auto;font-size:15px;color:var(--n-ink2)}
.cb-top .n-btn{min-height:42px;font-size:14px}
@media (max-width:760px){.cb-top nav,.cb-top .n-btn{display:none}}
.cb-hero{padding:40px 0 72px;display:grid;gap:44px}
.cb-head{display:grid;gap:18px;max-width:780px}
.cb-head>*{animation:b-up .8s cubic-bezier(.2,.8,.2,1) both}
.cb-head>*:nth-child(2){animation-delay:.07s}.cb-head>*:nth-child(3){animation-delay:.14s}.cb-head>*:nth-child(4){animation-delay:.21s}
@keyframes b-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.cb-g{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--n-mute);width:fit-content;padding:6px 14px;border-radius:999px;background:var(--n-bg2)}
.cb-g b{color:var(--n-ink)}
.cb-hero h1{font-size:clamp(42px,6.4vw,84px);font-weight:800;line-height:1.05}
.cb-head p{font-size:19px;color:var(--n-ink2);max-width:46ch}
.cb-pano{border-radius:20px;overflow:hidden;aspect-ratio:21/9;background:var(--n-bg2)}
.cb-pano img{width:100%;height:100%;object-fit:cover;animation:cb-rev 1.2s cubic-bezier(.6,0,.2,1) .2s both}
@keyframes cb-rev{from{clip-path:inset(0 0 0 100% round 20px);transform:scale(1.06)}to{clip-path:inset(0 0 0 0 round 20px);transform:none}}
@media (max-width:760px){.cb-pano{aspect-ratio:4/3}.cb-hero{padding:16px 0 48px;gap:28px}}
.cb-sec{padding:88px 0}.cb-sec.n-w{padding-inline:0}
.cb-alt{background:var(--n-bg2)}
.cb-sec h2{font-size:clamp(30px,4vw,48px);font-weight:800;margin-bottom:16px}
.cb-sub{color:var(--n-mute);max-width:46ch}
.cb-how{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px;align-items:start}
.cb-stick{position:sticky;top:110px}
.cb-steps{list-style:none;margin:0;padding:0 0 0 0;position:relative;display:grid;gap:40px;padding-inline-start:56px}
.cb-steps::before,.cb-steps::after{content:"";position:absolute;top:14px;bottom:14px;inset-inline-start:17px;width:3px;border-radius:3px;background:var(--n-line)}
.cb-steps::after{background:var(--n-acc);bottom:auto;height:calc((100% - 28px) * var(--p));transition:height .12s linear}
.cb-steps li{position:relative;display:grid;gap:6px;opacity:.45;transition:opacity .4s}
.cb-steps li.on{opacity:1}
.cb-steps i{position:absolute;inset-inline-start:-56px;top:0;width:37px;height:37px;border-radius:50%;display:grid;place-items:center;background:var(--n-bg);border:3px solid var(--n-line);color:transparent;z-index:1;transition:background .35s,border-color .35s,color .35s,transform .45s cubic-bezier(.3,1.7,.5,1)}
.cb-steps li.on i{background:var(--n-acc);border-color:var(--n-acc);color:var(--n-on);transform:scale(1.08)}
.cb-steps h3{font-size:23px;font-weight:700}
.cb-steps p{color:var(--n-ink2)}
@media (max-width:760px){.cb-how{grid-template-columns:1fr;gap:28px}.cb-stick{position:static}.cb-sec{padding:60px 0}}
.cb-list{list-style:none;margin:20px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:0 40px}
.cb-list li{display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid var(--n-line)}
.cb-list li>i{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:var(--n-acc-soft);color:var(--n-acc);flex:none}
.cb-list li.in>i svg path{stroke-dasharray:24;stroke-dashoffset:24;animation:cb-tick .5s .25s ease forwards;animation-delay:calc(var(--d,0)*70ms + .25s)}
@keyframes cb-tick{to{stroke-dashoffset:0}}
.cb-list div{flex:1;display:grid}
.cb-list b{font-size:17px;font-weight:600}.cb-list small{font-size:13px;color:var(--n-mute)}
.cb-list .pr{font:700 18px var(--n-disp)}
.cb-list a{font-size:14px;font-weight:600;color:var(--n-acc)}
.cb-list button{width:36px;height:36px;border-radius:10px;border:1px solid var(--n-line);background:var(--n-bg);color:var(--n-ink);display:grid;place-items:center;cursor:pointer;transition:background .2s,color .2s,transform .2s cubic-bezier(.3,1.6,.5,1)}
.cb-list button:hover{background:var(--n-acc);color:var(--n-on);transform:translateX(-3px)}
@media (max-width:760px){.cb-list{grid-template-columns:1fr}}
.cb-brands{margin-top:24px;color:var(--n-ink2)}
.cb-rep{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}
.cb-sheet{padding:32px;border-radius:20px;background:var(--n-bg);border:1px solid var(--n-line);box-shadow:0 30px 60px -40px rgba(17,22,27,.45)}
.cb-sheet dl{margin:0;display:grid}
.cb-sheet dl div{display:grid;grid-template-columns:150px 1fr;gap:16px;padding:16px 0;border-top:1px dashed var(--n-line)}
.cb-sheet dt{font-weight:700;color:var(--n-acc)}.cb-sheet dd{margin:0}
.cb-fac{padding:32px;border-radius:20px;background:var(--n-acc);color:var(--n-on)}
.cb-fac h3{font-size:22px;margin-bottom:14px}
.cb-fac ul{list-style:none;padding:0;margin:0;display:grid;gap:10px}.cb-fac li{display:flex;gap:8px;align-items:center}
@media (max-width:760px){.cb-rep{grid-template-columns:1fr}.cb-sheet dl div{grid-template-columns:1fr;gap:4px}.cb-sheet,.cb-fac{padding:22px}}
.cb-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px}
.cb-card{background:var(--n-bg);border-radius:20px;padding:26px}
.cb-st{margin-top:14px;font-size:14px;color:var(--n-ink2)}
.cb-rv{display:grid;grid-template-columns:1.4fr 1fr;grid-auto-rows:auto;gap:14px}
.cb-rv figure{margin:0;padding:22px;border-radius:18px;background:var(--n-bg2);display:grid;gap:10px;align-content:start}
.cb-rv .big{grid-row:span 3;background:var(--n-ink);color:var(--n-bg);padding:36px;align-content:space-between}
.cb-rv .big blockquote{font:700 clamp(22px,2.6vw,32px)/1.5 var(--n-disp)}
.cb-rv blockquote{margin:0}
.cb-rv figcaption{font-size:13px;opacity:.7;display:flex;gap:8px;align-items:center}
@media (max-width:760px){.cb-rv{grid-template-columns:1fr}.cb-rv .big{grid-row:auto;padding:24px}}
.cb-narrow{max-width:800px}
.cb-q{border-bottom:1px solid var(--n-line)}
.cb-q summary{padding:18px 0;font:600 17px var(--n-body);cursor:pointer}
.cb-q p{padding-bottom:18px;color:var(--n-ink2)}
.cb-visit{display:grid;grid-template-columns:1fr 1fr;gap:48px}.cb-visit .n-row{margin-top:20px}
.cb-foot{display:flex;justify-content:space-between;padding:26px 0;color:var(--n-mute);font-size:14px}.cb-foot b{color:var(--n-ink)}
@media (max-width:760px){.cb-book,.cb-visit{grid-template-columns:1fr;gap:24px}.cb-card{padding:18px}}
`
