'use client'

/**
 * Beauty & spa, option A «قائمة العناية» (calm menu). SAMPLE.
 * A light, quiet page that reads like a spa's printed menu: arched photo,
 * services grouped by what the place offers with duration and price on one
 * line, packages, the yes/no notes (hospitality, health) as two cards.
 * Motion: slow and soft. The arch opens on load, sections fade up once.
 */

import { useMemo, useState } from 'react'
import type { ServiceContent } from '@/utils/services/types'
import { KIT_CSS, Book, Contact, Hours, Ic, Stars, ar, useNiche, useReveal, useScrolled, vars, type Colors, type NicheExtra } from './kit'

const LOOK = { background: '#f6f4f7', surface: '#ece7ee', text: '#251c24', muted: '#76697a', accent: '#8b3a5e', border: '#e0d8e2' }

export default function BeautyA({ content, x = {}, colors }: { content: ServiceContent; x?: NicheExtra; colors?: Colors }) {
  const n = useNiche(content)
  const ref = useReveal()
  const solid = useScrolled()
  const groups = useMemo(() => {
    const m = new Map<string, typeof n.services>()
    for (const s of n.services) { const g = x.groups?.[s.name] || content.services.heading || 'الخدمات'; m.set(g, [...(m.get(g) || []), s]) }
    return Array.from(m.entries())
  }, [n.services, x.groups, content.services.heading])
  const [pick, setPick] = useState(n.services[0]?.name || '')
  const notes = (x.blocks || []).filter((b) => b.text.trim())
  const gallery = n.rest.slice(0, 3)
  const priv = [x.privacy, ...(x.facilities || [])].filter(Boolean) as string[]

  return (
    <div ref={ref} className="nv ba" dir="rtl" style={{ ...vars(colors, LOOK), ['--n-disp' as string]: '"Reem Kufi", "IBM Plex Sans Arabic", sans-serif', ['--n-body' as string]: '"IBM Plex Sans Arabic", sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: KIT_CSS + CSS }} />

      <header className={`ba-top${solid ? ' solid' : ''}`}>
        <div className="n-w ba-top-in">
          <a href="#top" className="ba-mark">{n.short}{n.b.latin ? <small dir="ltr">{n.b.latin}</small> : null}</a>
          <nav><a href="#menu">الخدمات</a>{x.packages?.length ? <a href="#pk">الباقات</a> : null}<a href="#visit">الموقع</a></nav>
          <a className="n-btn" href="#book">احجزي موعدك</a>
        </div>
      </header>

      <section id="top" className="ba-hero n-w">
        <div className="ba-copy">
          <h1 data-r>{n.short}</h1>
          <p className="ba-lede" data-r style={{ ['--d' as string]: 1 }}>{content.hero.subheadline || n.b.tagline}</p>
          <div className="n-row" data-r style={{ ['--d' as string]: 2 }}>
            <a className="n-btn" href="#book">احجزي موعدك</a>
            <a className="n-btn ghost" href="#menu">{n.priced ? 'الخدمات والأسعار' : 'الخدمات'}</a>
          </div>
          {n.rating ? <a className="ba-g" href={n.mapsUrl || '#rv'} data-r style={{ ['--d' as string]: 3 }}><Stars n={n.rating} /> <b>{n.rating.toFixed(1)}</b> من {n.count ? ar(n.count) : ''} تقييم على جوجل</a> : null}
        </div>
        {n.hero ? <figure className="ba-arch"><img src={n.hero} alt={`داخل ${n.b.name}`} /></figure> : null}
      </section>

      {priv.length ? (
        <section className="ba-priv"><div className="n-w">{priv.map((p, i) => <span key={p} data-r style={{ ['--d' as string]: i }}>{Ic.check}{p}</span>)}</div></section>
      ) : null}

      <section id="menu" className="ba-sec n-w">
        <h2 data-r>قائمة الخدمات</h2>
        {n.priced ? <p className="ba-sub" data-r>المدة المكتوبة هي مدة الجلسة الفعلية، والسعر هو ما تدفعينه.</p> : null}
        <div className={`ba-menu${groups.length > 1 ? '' : ' one'}`}>
          {groups.map(([g, items], gi) => (
            <div key={g} className="ba-grp" data-r style={{ ['--d' as string]: gi }}>
              {groups.length > 1 ? <h3>{g}</h3> : null}
              <ul>
                {items.map((s) => (
                  <li key={s.name}>
                    <span className="nm">{s.name}</span><i className="ld" />
                    {s.duration ? <span className="du">{s.duration}</span> : null}
                    {s.price_from ? <span className="pr">{s.price_from}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {!n.priced && n.wa ? <a className="n-btn ghost ba-askp" href={n.waLink('مرحبًا، أريد أسعار الخدمات')!} target="_blank" rel="noopener noreferrer">{Ic.wa} اسألي عن الأسعار</a> : null}
      </section>

      {x.packages?.length ? (
        <section id="pk" className="ba-sec ba-alt"><div className="n-w">
          <h2 data-r>الباقات</h2>
          <div className={`ba-pk c${Math.min(x.packages.length, 3)}`}>
            {x.packages.map((p, i) => (
              <article key={p.name} data-r style={{ ['--d' as string]: i }}>
                <h3>{p.name}</h3>
                <ul>{p.includes.map((t) => <li key={t}>{Ic.check}{t}</li>)}</ul>
                <footer>{p.duration ? <span>{Ic.clock} {p.duration}</span> : <span />}{p.price ? <b>{p.price}</b> : <a href={n.waLink(`مرحبًا، أريد سعر ${p.name}`) || '#book'}>اسألي عن السعر</a>}</footer>
              </article>
            ))}
          </div>
        </div></section>
      ) : null}

      {notes.length ? (
        <section className="ba-sec n-w">
          <h2 data-r>قبل جلستك</h2>
          <div className={`ba-notes c${Math.min(notes.length, 3)}`}>{notes.map((b, i) => <div key={b.id} data-r style={{ ['--d' as string]: i }}><h3>{b.title}</h3><p>{b.text}</p></div>)}</div>
        </section>
      ) : null}

      <section id="book" className="ba-sec ba-alt"><div className="n-w ba-book">
        <div data-r><h2>احجزي موعدك</h2><p className="ba-sub">اختاري الخدمة والوقت. يصلنا طلبك، ونؤكّد لك الموعد على واتساب.</p>{n.st?.text ? <p className="ba-st"><i className={n.st.open ? 'on' : ''} />{n.st.open ? 'مفتوح الآن' : 'مغلق الآن'} · {n.st.text}</p> : null}</div>
        <div className="ba-card" data-r style={{ ['--d' as string]: 1 }}><Book n={n} options={n.services.map((s) => s.name)} place="المركز" pick={pick} setPick={setPick} /></div>
      </div></section>

      {n.reviews.length ? (
        <section id="rv" className="ba-sec n-w">
          <h2 data-r>ماذا تقول زبوناتنا</h2>
          <div className="ba-rv">{n.reviews.slice(0, 4).map((r, i) => <figure key={i} data-r style={{ ['--d' as string]: i }}><Stars n={r.rating} /><blockquote>{r.text}</blockquote><figcaption>{r.name}{r.when ? ` · ${r.when}` : ''} · جوجل</figcaption></figure>)}</div>
        </section>
      ) : null}

      {gallery.length >= 2 ? (
        <section className="ba-sec n-w"><h2 data-r>{content.gallery.heading || 'المركز'}</h2><div className={`ba-gal c${gallery.length}`}>{gallery.map((u, i) => <img key={u} src={u} alt={`${n.short} ${i + 1}`} loading="lazy" data-r style={{ ['--d' as string]: i }} />)}</div></section>
      ) : null}

      {n.faq.length ? (
        <section className="ba-sec n-w ba-narrow"><h2 data-r>أسئلة تتكرر</h2><div className="ba-faq">{n.faq.map((f, i) => <details key={i} data-r><summary>{f.q}<span>{Ic.plus}</span></summary><p>{f.a}</p></details>)}</div></section>
      ) : null}

      <section id="visit" className="ba-sec ba-alt"><div className="n-w ba-visit">
        <div data-r><h2>{n.where}</h2>{content.footer.address ? <p className="ba-sub">{content.footer.address}</p> : null}<Contact n={n} /></div>
        <div data-r style={{ ['--d' as string]: 1 }}><Hours n={n} /></div>
      </div></section>

      <footer className="ba-foot n-w"><b>{n.b.name}</b><span>{n.where}</span></footer>
      <nav className="n-bar"><a className="n-btn" href="#book">احجزي موعدك</a>{n.wa ? <a className="n-btn ghost sq" href={n.waLink('مرحبًا')!} aria-label="واتساب">{Ic.wa}</a> : null}{n.tel ? <a className="n-btn ghost sq" href={`tel:${n.tel}`} aria-label="اتصال">{Ic.phone}</a> : null}</nav>
    </div>
  )
}

const CSS = `
.ba{--n-r-btn:999px;--n-r-in:14px}
.ba-top{position:sticky;top:0;z-index:20;transition:background .3s,box-shadow .3s}
.ba-top.solid{background:color-mix(in srgb,var(--n-bg) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--n-line)}
.ba-top-in{display:flex;align-items:center;gap:24px;height:68px}
.ba-mark{font:700 21px var(--n-disp);display:flex;flex-direction:column;line-height:1.1}
.ba-mark small{font:500 11px var(--n-body);letter-spacing:.08em;color:var(--n-mute)}
.ba-top nav{display:flex;gap:22px;margin-inline-start:auto;font-size:15px;color:var(--n-ink2)}
.ba-top nav a:hover{color:var(--n-acc)}
.ba-top .n-btn{min-height:42px;padding:0 18px;font-size:14px}
@media (max-width:760px){.ba-top nav,.ba-top .n-btn{display:none}}
.ba-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;padding:40px 0 72px;min-height:calc(100dvh - 68px)}
.ba-copy{display:grid;gap:22px;align-content:center}
.ba-hero h1{font-size:clamp(46px,7vw,92px);font-weight:700;letter-spacing:-.01em;color:var(--n-ink)}
.ba-lede{font-size:clamp(17px,1.6vw,20px);color:var(--n-ink2);max-width:34ch}
.ba-g{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--n-mute)}
.ba-g b{color:var(--n-ink);font-size:16px}
.ba-arch{margin:0;aspect-ratio:4/5;border-radius:999px 999px 28px 28px;overflow:hidden;background:var(--n-bg2);animation:ba-open 1.4s cubic-bezier(.2,.75,.1,1) both}
.ba-arch img{width:100%;height:100%;object-fit:cover;animation:ba-zoom 2.2s cubic-bezier(.2,.75,.1,1) both}
@keyframes ba-open{from{clip-path:inset(100% 0 0 0 round 999px 999px 28px 28px)}to{clip-path:inset(0 0 0 0 round 999px 999px 28px 28px)}}
@keyframes ba-zoom{from{transform:scale(1.18)}to{transform:none}}
@media (max-width:860px){.ba-hero{grid-template-columns:1fr;gap:28px;padding:12px 0 48px;min-height:0}.ba-arch{order:-1;aspect-ratio:1/1;max-height:56dvh;width:100%;border-radius:999px 999px 24px 24px}.ba-hero h1{font-size:clamp(42px,12vw,60px)}}
.ba-priv{border-block:1px solid var(--n-line);padding:16px 0}
.ba-priv .n-w{display:flex;flex-wrap:wrap;gap:12px 28px;justify-content:center;font-size:15px;color:var(--n-ink2)}
.ba-priv span{display:inline-flex;align-items:center;gap:8px}.ba-priv svg{color:var(--n-acc)}
.ba-sec{padding:88px 0}
.ba-sec.n-w{padding-inline:0}
.ba-alt{background:var(--n-bg2)}
.ba-sec h2{font-size:clamp(30px,4vw,46px);font-weight:600;margin-bottom:12px}
.ba-sub{color:var(--n-mute);max-width:56ch;margin-bottom:8px}
.ba-menu{display:grid;grid-template-columns:1fr 1fr;gap:28px 64px;margin-top:36px}
.ba-menu.one{grid-template-columns:1fr;max-width:720px}
.ba-grp h3{font-size:15px;font-family:var(--n-body);font-weight:600;color:var(--n-acc);margin-bottom:6px}
.ba-grp ul{list-style:none;margin:0;padding:0}
.ba-grp li{display:flex;align-items:baseline;gap:10px;padding:14px 0}
.ba-grp li+li{border-top:1px solid var(--n-line)}
.ba-grp .nm{font:600 19px var(--n-disp)}
.ba-grp .ld{flex:1;border-bottom:1px dotted color-mix(in srgb,var(--n-ink) 30%,transparent);transform:translateY(-5px);min-width:16px}
.ba-grp .du{font-size:14px;color:var(--n-mute);white-space:nowrap}
.ba-grp .pr{font:700 18px var(--n-body);white-space:nowrap;min-width:3ch;text-align:left}
@media (max-width:760px){.ba-menu{grid-template-columns:1fr;gap:20px}.ba-sec{padding:64px 0}}
.ba-askp{margin-top:24px}
.ba-pk{display:grid;gap:18px;margin-top:32px}
.ba-pk.c1{grid-template-columns:1fr;max-width:760px}.ba-pk.c2{grid-template-columns:1fr 1fr}.ba-pk.c3{grid-template-columns:1.2fr 1fr 1fr}
.ba-pk article{background:var(--n-bg);border-radius:24px;padding:28px;display:grid;gap:16px;align-content:start;border:1px solid var(--n-line);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}
.ba-pk article:hover{transform:translateY(-4px);box-shadow:0 22px 40px -28px color-mix(in srgb,var(--n-acc) 60%,transparent)}
.ba-pk.c3 article:first-child{background:var(--n-acc);color:var(--n-on);border-color:transparent}
.ba-pk.c3 article:first-child svg,.ba-pk.c3 article:first-child footer span{color:inherit;opacity:.85}
.ba-pk h3{font-size:24px;font-weight:600}
.ba-pk ul{list-style:none;padding:0;margin:0;display:grid;gap:8px;font-size:15px}
.ba-pk li{display:flex;gap:8px;align-items:flex-start}.ba-pk li svg{color:var(--n-acc);flex:none;margin-top:4px}
.ba-pk footer{display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid color-mix(in srgb,currentColor 18%,transparent);font-size:14px}
.ba-pk footer span{display:inline-flex;gap:6px;align-items:center;color:var(--n-mute)}
.ba-pk footer b{font-size:22px}
@media (max-width:860px){.ba-pk.c2,.ba-pk.c3{grid-template-columns:1fr}}
.ba-notes{display:grid;gap:18px;margin-top:28px}
.ba-notes.c2{grid-template-columns:1fr 1fr}.ba-notes.c3{grid-template-columns:repeat(3,1fr)}
.ba-notes div{padding:26px;border-radius:24px;background:var(--n-acc-soft)}
.ba-notes h3{font-size:20px;font-weight:600;margin-bottom:8px}
.ba-notes p{color:var(--n-ink2);font-size:15px}
@media (max-width:760px){.ba-notes.c2,.ba-notes.c3{grid-template-columns:1fr}}
.ba-book{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px;align-items:start}
.ba-card{background:var(--n-bg);border-radius:28px;padding:28px;border:1px solid var(--n-line)}
.ba-st{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--n-ink2);margin-top:14px}
.ba-st i{width:8px;height:8px;border-radius:50%;background:#c4594a}.ba-st i.on{background:#2f9e6a}
@media (max-width:860px){.ba-book{grid-template-columns:1fr;gap:24px}.ba-card{padding:20px}}
.ba-rv{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:28px}
.ba-rv figure{margin:0;padding:26px;border-radius:24px;border:1px solid var(--n-line);display:grid;gap:12px}
.ba-rv blockquote{margin:0;font:500 18px/1.7 var(--n-body);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ba-rv figcaption{font-size:13px;color:var(--n-mute)}
@media (max-width:760px){.ba-rv{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:-16px;padding-inline:16px;scrollbar-width:none}.ba-rv figure{flex:0 0 84%;scroll-snap-align:start}}
.ba-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px}
.ba-gal.c2{grid-template-columns:1fr 1fr}
.ba-gal img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:999px 999px 20px 20px}
@media (max-width:760px){.ba-gal{grid-template-columns:1fr 1fr}.ba-gal img:nth-child(3){display:none}}
.ba-narrow{max-width:780px}
.ba-faq{display:grid;margin-top:20px}
.ba-faq details{border-bottom:1px solid var(--n-line)}
.ba-faq summary{list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 0;font:600 18px var(--n-body);cursor:pointer}
.ba-faq summary::-webkit-details-marker{display:none}
.ba-faq summary span{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--n-acc-soft);color:var(--n-acc);transition:transform .35s cubic-bezier(.3,1.5,.5,1);flex:none}
.ba-faq details[open] summary span{transform:rotate(45deg)}
.ba-faq details p{padding:0 0 20px;color:var(--n-ink2);animation:n-pop .4s ease}
.ba-visit{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.ba-visit .n-row{margin-top:20px}
@media (max-width:760px){.ba-visit{grid-template-columns:1fr;gap:28px}}
.ba-foot{display:flex;justify-content:space-between;gap:12px;padding:28px 0;font-size:14px;color:var(--n-mute);flex-wrap:wrap}
.ba-foot b{font-family:var(--n-disp);color:var(--n-ink);font-size:18px}
`
