'use client'

import { useRef } from 'react'
import type { ServiceContent, ServiceTeamMember } from '@/utils/services/types'
import { DAYS_AR, timeAr } from '@/utils/services/barber'
import { Booking, I, ar, type Colors } from '../NicheView'
import { FORM_CSS, initial, useBarber, useReveal } from './shared'

/**
 * Barber design B, «الاستوديو»: a calm, bright page built from rounded
 * panels. Split hero with the shop's photo framed, services as cards with the
 * price set large, barbers as a portrait row, reviews as cards, booking in a
 * solid band. One accent, soft borders, no glow.
 */
export default function BarberB({ content, colors, logo }: { content: ServiceContent; colors?: Colors; logo?: string }) {
  const d = useBarber(content, colors)
  const { k, b } = d
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const navs = [
    d.services.length ? ['#b-prices', k.services] : null,
    d.members.length ? ['#b-crew', content.team?.heading || k.team] : null,
    d.reviews.length ? ['#b-reviews', 'التقييمات'] : null,
    ['#b-visit', 'الموقع'],
  ].filter(Boolean) as [string, string][]

  return (
    <div ref={root} className="bs" dir="rtl" style={d.vars}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS + FORM_CSS }} />

      <header className={`bs-top${d.scrolled ? ' on' : ''}`}>
        <div className="bs-pill">
          <a className="bs-mark" href="#b-top">
            {logo && b.show_logo !== false ? <img src={logo} alt="" /> : <span className="bs-mono" aria-hidden>{initial(d.short)}</span>}
            <b>{d.short}</b>
          </a>
          <nav className="bs-nav">{navs.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
          {d.walkin ? (d.wa ? <a className="bs-btn sm" href={d.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">واتساب</a> : null) : <a className="bs-btn sm" href="#b-book">{k.cta}</a>}
        </div>
      </header>

      <section id="b-top" className={`bs-hero${d.hero ? '' : ' plain'}`}><div className="bs-w bs-hero-in">
        {d.hero ? (
          <figure className="bs-frame">
            <img src={d.hero} alt={`داخل ${b.name}`} />
            {d.hours.length && d.st ? <figcaption><i className={`bs-dot${d.st.open ? '' : ' off'}`} /><b>{d.st.open ? 'مفتوح الآن' : 'مغلق الآن'}</b><span>{d.st.text}</span></figcaption> : null}
          </figure>
        ) : null}
        <div className="bs-copy">
          <p className="bs-tag">{[k.label, b.audience, [b.area, b.city].filter(Boolean).join('، ')].filter(Boolean).join(' · ')}</p>
          <h1>{d.short}</h1>
          {b.latin ? <p className="bs-latin" dir="ltr">{b.latin}</p> : null}
          <p className="bs-lede">{content.hero.subheadline || b.tagline}</p>
          <div className="bs-acts">
            {d.walkin ? null : <a className="bs-btn" href="#b-book">{k.cta}</a>}
            {d.wa ? <a className="bs-btn line" href={d.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
          </div>
          {d.rating ? (
            <div className="bs-rating">
              <b>{d.rating.toFixed(1)}</b>
              <span><span className="bs-stars" aria-hidden>★★★★★</span><small>{d.count ? `${ar(d.count)} تقييم على جوجل` : 'على جوجل'}</small></span>
            </div>
          ) : null}
        </div>
      </div></section>

      {d.services.length ? (
        <section className="bs-sec" id="b-prices"><div className="bs-w">
          <Head title={content.services.heading || k.services} note={d.priced ? 'السعر المكتوب هو ما تدفعه، بلا إضافات.' : 'اسألنا عن السعر على واتساب، ونرد عليك.'} />
          <div className={`bs-cards n${Math.min(d.services.length, 3)}`}>
            {d.services.map((s) => (
              <article key={s.name} className="bs-svc" data-rv>
                <div><h3>{s.name}</h3>{s.duration || s.description ? <p>{[s.duration, s.description].filter(Boolean).join(' · ')}</p> : null}</div>
                {s.price_from ? <b className="bs-price">{s.price_from}</b>
                  : d.wa ? <a className="bs-askp" href={d.waLink(`مرحبًا، كم سعر ${s.name}؟`)!} target="_blank" rel="noopener noreferrer">اسأل عن السعر</a> : null}
              </article>
            ))}
          </div>
          {content.terms?.length ? <dl className="bs-terms">{content.terms.map((t) => <div key={t.label}><dt>{t.label}</dt><dd>{t.text}</dd></div>)}</dl> : null}
        </div></section>
      ) : null}

      {d.members.length ? (
        <section className="bs-sec soft" id="b-crew"><div className="bs-w">
          <Head title={content.team?.heading || k.team} note={`اطلب ${k.one} الذي تريده بالاسم.`} />
          <div className="bs-crew">{d.members.map((m, i) => <Barber key={m.name + i} m={m} label={k.bookAt(m.name)} book={d.walkin ? undefined : () => d.bookWith(m.name)} />)}</div>
        </div></section>
      ) : null}

      {d.reviews.length ? (
        <section className="bs-sec" id="b-reviews"><div className="bs-w">
          <div className="bs-rhead" data-rv>
            <Head title="كلام زبائننا" note="من تقييمات جوجل، كما كتبها أصحابها." />
            {d.mapsUrl ? <a className="bs-btn line" href={d.mapsUrl} target="_blank" rel="noopener noreferrer">كل التقييمات على جوجل</a> : null}
          </div>
          <div className="bs-rvs">{d.reviews.map((r, i) => (
            <figure key={i} className={i === 0 ? 'lead' : undefined} data-rv>
              <span className="bs-stars" aria-hidden>★★★★★</span>
              <blockquote>{r.text}</blockquote>
              <figcaption><span className="bs-av" aria-hidden>{initial(r.name)}</span><b><bdi>{r.name}</bdi></b>{r.when ? <small>{r.when}</small> : null}</figcaption>
            </figure>
          ))}</div>
        </div></section>
      ) : null}

      <section className="bs-sec" id="b-book" ref={d.bookRef}><div className="bs-w">
        <div className="bs-band">
          <div className="bs-band-copy">
            <h2>{d.walkin ? 'تعال مباشرة' : k.cta}</h2>
            <p>{d.walkin ? 'نستقبلك بدون موعد، بالدور.' : k.bookLine}</p>
            <ul>
              {d.st?.text ? <li><span>الآن</span>{d.st.open ? 'مفتوح' : 'مغلق'} · {d.st.text}</li> : null}
              {content.booking?.wait ? <li><span>الانتظار عادة</span>{content.booking.wait}</li> : null}
              {content.booking?.busy ? <li><span>الأكثر زحمة</span>{content.booking.busy}</li> : null}
            </ul>
          </div>
          <div className="bs-card">
            {d.walkin || !d.canBook ? (
              <div className="bs-wa">
                <b>{d.walkin ? 'تريد أن تعرف الدور الآن؟' : 'احجز على واتساب'}</b>
                <p>{d.walkin ? 'اسألنا، ونرد عليك.' : `اكتب الخدمة و${k.one} والوقت، ونؤكّد لك الموعد.`}</p>
                <div className="bs-acts">
                  {d.wa ? <a className="bs-btn" href={d.waLink(d.walkin ? 'مرحبًا، كم الدور الآن؟' : `مرحبًا، أريد حجز موعد${d.pick !== k.any ? ' عند ' + d.pick : ''}.`)!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
                  {d.tel ? <a className="bs-btn line" href={`tel:${d.tel}`}>{I.phone} اتصل</a> : null}
                </div>
              </div>
            ) : (
              <Booking k={k} services={d.services.map((s) => s.name)} barbers={d.members.map((m) => m.name)} pick={d.pick} setPick={d.setPick} slug={d.slug} preview={d.preview || !d.slug} />
            )}
          </div>
        </div>
      </div></section>

      {d.place.length >= 2 ? (
        <section className="bs-sec tight" id="b-place">
          <div className="bs-w"><Head title={content.gallery.heading || `داخل ${k.place}`} /></div>
          <div className="bs-strip" tabIndex={0} aria-label="صور المكان">{[d.side, ...d.place].filter(Boolean).map((u, i) => <img key={u + i} src={u} alt={`${d.short} ${i + 1}`} loading="lazy" />)}</div>
        </section>
      ) : null}

      {d.faq.length ? (
        <section className="bs-sec" id="b-faq"><div className="bs-w bs-narrow">
          <Head title={content.faq.heading || 'قبل أن تأتي'} center />
          <div className="bs-faq">{d.faq.map((f, i) => <details key={i} data-rv><summary>{f.q}<i aria-hidden>+</i></summary><p>{f.a}</p></details>)}</div>
        </div></section>
      ) : null}

      <section className="bs-sec soft" id="b-visit"><div className="bs-w bs-visit">
        <div className="bs-card" data-rv>
          <h2>{[b.area, b.city].filter(Boolean).join('، ')}</h2>
          {content.footer.address && content.footer.address.trim() !== [b.area, b.city].filter(Boolean).join('، ') ? <p className="bs-addr">{content.footer.address}</p> : null}
          <div className="bs-acts">
            {d.mapsUrl ? <a className="bs-btn" href={d.mapsUrl} target="_blank" rel="noopener noreferrer">{I.pin} افتح الخريطة</a> : null}
            {d.tel ? <a className="bs-btn line" href={`tel:${d.tel}`}>{I.phone} <span dir="ltr">{content.footer.phone}</span></a> : null}
          </div>
        </div>
        {d.hours.length ? (
          <div className="bs-card" data-rv>
            <h2>أوقات الدوام</h2>
            <ul className="bs-hours">
              {d.hours.map((h) => (
                <li key={h.day} className={d.st?.today === h.day ? 'today' : undefined}>
                  <span>{DAYS_AR[h.day]}</span>
                  <span>{h.closed || !h.periods.length ? 'مغلق' : h.periods.map((x) => `${timeAr(x.open)} – ${timeAr(x.close)}`).join('، ')}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div></section>

      <footer className="bs-foot"><div className="bs-w">
        <div className="bs-foot-top">
          <b>{b.name}</b>
          <div className="bs-fl">
            {d.wa ? <a href={d.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer" aria-label="واتساب">{I.wa}</a> : null}
            {d.ig ? <a href={d.ig} target="_blank" rel="noopener noreferrer" aria-label="إنستغرام">{I.ig}</a> : null}
            {d.tel ? <a href={`tel:${d.tel}`} aria-label="اتصال">{I.phone}</a> : null}
          </div>
        </div>
        {(content.links?.extra || []).length ? <div className="bs-extra">{content.links!.extra!.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label || l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}</a>)}</div> : null}
        <p>{[content.footer.address, b.latin].filter(Boolean).join(' · ')}</p>
      </div></footer>

      <nav className="bs-bar">
        {d.walkin ? null : <a className="bs-btn" href="#b-book">{k.cta}</a>}
        {d.wa ? <a className="bs-btn line ic" href={d.waLink('مرحبًا، أريد حجز موعد')!} target="_blank" rel="noopener noreferrer" aria-label="واتساب">{I.wa}</a> : null}
        {d.tel ? <a className="bs-btn line ic" href={`tel:${d.tel}`} aria-label="اتصال">{I.phone}</a> : null}
      </nav>
    </div>
  )
}

function Head({ title, note, center }: { title: string; note?: string; center?: boolean }) {
  return <div className={`bs-head${center ? ' c' : ''}`} data-rv><h2>{title}</h2>{note ? <p>{note}</p> : null}</div>
}

function Barber({ m, book, label }: { m: ServiceTeamMember; book?: () => void; label: string }) {
  return (
    <article className="bs-pr" data-rv>
      <div className={`bs-por${m.photo ? '' : ' ni'}`}>
        {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span aria-hidden>{initial(m.name)}</span>}
      </div>
      <div className="bs-pr-body">
        <h3>{m.name}</h3>
        {m.role ? <p className="role">{m.role}</p> : null}
        {m.tags?.length ? <ul className="bs-tags">{m.tags.map((t) => <li key={t}>{t}</li>)}</ul> : null}
        {m.quote ? <blockquote>«{m.quote}»<cite><bdi>{m.quote_by || 'زبون'}</bdi> · جوجل</cite></blockquote> : null}
        {book ? <button type="button" className="bs-btn line sm" onClick={book}>{label}</button> : null}
      </div>
    </article>
  )
}

const CSS = `
.bs{--disp:'Readex Pro','IBM Plex Sans Arabic',sans-serif;--body:'IBM Plex Sans Arabic',system-ui,sans-serif;--r:14px;--R:24px;--gut:clamp(16px,4.5vw,48px);
  background:var(--bb-bg);color:var(--bb-ink);font-family:var(--body);font-size:16px;line-height:1.75;min-height:100%;padding-bottom:84px;overflow-x:clip;-webkit-font-smoothing:antialiased}
.bs *,.bs *::before,.bs *::after{box-sizing:border-box}
.bs img{display:block;max-width:100%}
.bs a{color:inherit}
.bs-w{width:100%;max-width:1200px;margin:0 auto;padding:0 var(--gut)}
@media(min-width:900px){.bs{padding-bottom:0}}

.bs-top{position:sticky;top:0;z-index:40;padding:12px var(--gut);transition:padding .3s}
.bs-pill{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:20px;min-height:60px;padding:8px 8px 8px 8px;padding-inline-start:16px;border-radius:999px;background:var(--bb-bg);border:1px solid var(--bb-line);box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px -16px rgba(0,0,0,.18)}
.bs-mark{display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0}
.bs-mark img,.bs-mono{width:38px;height:38px;border-radius:50%;object-fit:cover;flex:0 0 auto}
.bs-mono{display:grid;place-items:center;background:var(--bb-ink);color:var(--bb-bg);font:700 17px/1 var(--disp)}
.bs-mark b{font:600 17px/1.1 var(--disp);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bs-nav{display:none;gap:4px;margin-inline-start:auto}
.bs-nav a{text-decoration:none;padding:8px 14px;border-radius:999px;font-size:15px;color:var(--bb-ink2)}
.bs-nav a:hover{background:var(--bb-bg2);color:var(--bb-ink)}
.bs-pill>.bs-btn{margin-inline-start:auto}
@media(min-width:900px){.bs-nav{display:flex}.bs-pill>.bs-btn{margin-inline-start:0}}

.bs-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:50px;padding:0 24px;border-radius:999px;background:var(--bb-acc);color:var(--bb-on)!important;font:600 15.5px var(--body);text-decoration:none;border:1px solid var(--bb-acc);cursor:pointer;transition:background .2s,border-color .2s,transform .15s;white-space:nowrap}
.bs-btn:hover{background:var(--bb-acc2);border-color:var(--bb-acc2)}
.bs-btn:active{transform:scale(.98)}
.bs-btn.line{background:transparent;color:var(--bb-ink)!important;border-color:var(--bb-line2)}
.bs-btn.line:hover{border-color:var(--bb-ink)}
.bs-btn.sm{min-height:44px;padding:0 18px;font-size:14.5px}
.bs-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}

.bs-hero{padding:clamp(12px,3vw,40px) 0 clamp(56px,8vw,112px)}
.bs-hero-in{display:grid;gap:28px}
@media(min-width:900px){.bs-hero-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}.bs-frame{order:2}}
.bs-hero.plain .bs-hero-in{grid-template-columns:minmax(0,820px)}
.bs-frame{position:relative;margin:0;border-radius:var(--R);overflow:hidden;aspect-ratio:4/5;background:var(--bb-bg2)}
@media(max-width:899px){.bs-frame{aspect-ratio:4/3}}
.bs-frame img{width:100%;height:100%;object-fit:cover}
.bs-frame figcaption{position:absolute;inset-inline-start:14px;inset-block-end:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;border-radius:999px;background:var(--bb-bg);color:var(--bb-ink);font-size:14px;max-width:calc(100% - 28px)}
.bs-frame figcaption span{color:var(--bb-mute)}
.bs-dot{width:8px;height:8px;border-radius:50%;background:#2f9e63}
.bs-dot.off{background:#c9654f}
.bs-tag{display:inline-block;margin:0 0 18px;padding:6px 14px;border-radius:999px;background:var(--bb-bg2);font-size:13.5px;color:var(--bb-ink2)}
.bs-hero h1{margin:0;font:700 clamp(46px,7.4vw,96px)/1.04 var(--disp);letter-spacing:-.015em;text-wrap:balance}
.bs-latin{text-align:right;margin:12px 0 0;font:500 13px/1 var(--disp);letter-spacing:.28em;text-transform:uppercase;color:var(--bb-mute)}
.bs-lede{margin:20px 0 0;font-size:clamp(16px,1.5vw,19px);color:var(--bb-ink2);max-width:44ch}
.bs-rating{display:flex;align-items:center;gap:14px;margin-top:32px;padding-top:24px;border-top:1px solid var(--bb-line)}
.bs-rating>b{font:700 44px/1 var(--disp)}
.bs-rating>span{display:grid;gap:2px}
.bs-rating small{color:var(--bb-mute);font-size:14px}
.bs-stars{color:var(--bb-acc);letter-spacing:.14em;font-size:15px}

.bs-sec{padding:clamp(64px,9vw,120px) 0}
.bs-sec.soft{background:var(--bb-bg2)}
.bs-sec.tight{padding-bottom:clamp(40px,6vw,80px)}
.bs-head{display:grid;gap:8px;margin-bottom:clamp(28px,4vw,48px);max-width:640px}
.bs-head.c{text-align:center;margin-inline:auto}
.bs-head h2{margin:0;font:700 clamp(30px,4.2vw,50px)/1.12 var(--disp);letter-spacing:-.01em}
.bs-head p{margin:0;color:var(--bb-mute);font-size:15.5px}

.bs-cards{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media(min-width:680px){.bs-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1040px){.bs-cards.n3{grid-template-columns:repeat(3,minmax(0,1fr))}}
.bs-svc{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:22px 22px 24px;border-radius:var(--r);background:var(--bb-bg2);border:1px solid transparent;transition:border-color .2s,transform .2s}
.bs-svc:hover{border-color:var(--bb-line2)}
.bs-svc h3{margin:0;font:600 19px/1.35 var(--disp)}
.bs-svc p{margin:6px 0 0;font-size:14px;color:var(--bb-mute)}
.bs-price{font:700 28px/1 var(--disp);color:var(--bb-acc);white-space:nowrap}
.bs-askp{font-size:14px;color:var(--bb-acc);white-space:nowrap;text-decoration:none;border-bottom:1px solid currentColor}
.bs-terms{margin:28px 0 0;display:grid;gap:10px;font-size:14.5px}
.bs-terms div{display:grid;grid-template-columns:110px 1fr;gap:12px}
.bs-terms dt{color:var(--bb-mute)}
.bs-terms dd{margin:0}

.bs-crew{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(260px,78%);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;margin-inline:calc(var(--gut) * -1);padding-inline:var(--gut);scrollbar-width:none}
.bs-crew::-webkit-scrollbar{display:none}
@media(min-width:900px){.bs-crew{grid-auto-flow:row;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));overflow:visible;margin-inline:0;padding-inline:0}}
.bs-pr{scroll-snap-align:start;display:grid;grid-template-rows:auto 1fr;border-radius:var(--R);background:var(--bb-bg);overflow:hidden;border:1px solid var(--bb-line)}
.bs-por{aspect-ratio:1;background:var(--bb-bg2)}
.bs-por img{width:100%;height:100%;object-fit:cover}
.bs-por.ni{display:grid;place-items:center;background:color-mix(in srgb,var(--bb-acc) 10%,var(--bb-bg2))}
.bs-por.ni span{font:700 120px/1 var(--disp);color:var(--bb-acc)}
.bs-pr-body{padding:20px 20px 22px;display:grid;gap:8px;align-content:start}
.bs-pr h3{margin:0;font:700 23px/1.2 var(--disp)}
.bs-pr .role{margin:0;color:var(--bb-mute);font-size:14px}
.bs-tags{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.bs-tags li{padding:4px 11px;border-radius:999px;background:var(--bb-bg2);font-size:13px}
.bs-pr blockquote{margin:6px 0 0;font-size:14.5px;color:var(--bb-ink2)}
.bs-pr cite{display:block;margin-top:4px;font-style:normal;font-size:12.5px;color:var(--bb-mute)}
.bs-pr .bs-btn{margin-top:8px;width:100%}

.bs-rhead{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px}
.bs-rhead .bs-head{margin-bottom:0}
.bs-rhead{margin-bottom:clamp(28px,4vw,48px)}
.bs-rvs{columns:1;column-gap:14px}
@media(min-width:700px){.bs-rvs{columns:2}}
@media(min-width:1040px){.bs-rvs{columns:3}}
.bs-rvs figure{break-inside:avoid;margin:0 0 14px;padding:22px;border-radius:var(--r);background:var(--bb-bg2);display:grid;gap:12px}
.bs-rvs figure.lead{background:var(--bb-ink);color:var(--bb-bg)}
.bs-rvs figure.lead .bs-stars{color:color-mix(in srgb,var(--bb-acc) 55%,var(--bb-bg))}
.bs-rvs figure.lead blockquote{font:500 20px/1.6 var(--disp)}
.bs-rvs figure.lead small{color:color-mix(in srgb,var(--bb-bg) 65%,var(--bb-ink))}
.bs-rvs blockquote{margin:0;font-size:15.5px;line-height:1.75}
.bs-rvs figcaption{display:flex;align-items:center;gap:10px;font-size:14px}
.bs-rvs figcaption small{color:var(--bb-mute);margin-inline-start:auto}
.bs-av{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--bb-acc);color:var(--bb-on);font:600 14px/1 var(--disp)}

.bs-band{display:grid;gap:28px;padding:clamp(24px,4vw,56px);border-radius:var(--R);background:var(--bb-ink);color:var(--bb-bg)}
@media(min-width:960px){.bs-band{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:56px;align-items:start}}
.bs-band-copy h2{margin:0;font:700 clamp(30px,4vw,48px)/1.12 var(--disp)}
.bs-band-copy p{margin:12px 0 0;opacity:.8;max-width:42ch}
.bs-band-copy ul{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:10px}
.bs-band-copy li{display:grid;grid-template-columns:110px 1fr;gap:10px;font-size:15px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--bb-bg) 18%,transparent)}
.bs-band-copy li span{opacity:.65}
.bs-card{background:var(--bb-bg);color:var(--bb-ink);border-radius:calc(var(--R) - 6px);padding:clamp(20px,3vw,32px);border:1px solid var(--bb-line)}
.bs-wa b{font:700 22px var(--disp)}
.bs-wa p{color:var(--bb-ink2);margin:8px 0 0}
.bs .bb-form select,.bs .bb-form input{border-radius:12px;background:var(--bb-bg2);border-color:transparent}
.bs .bb-chips button{border-radius:999px}
.bs .bb-btn{border-radius:999px}

.bs-strip{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 var(--gut) 8px;scrollbar-width:none}
.bs-strip::-webkit-scrollbar{display:none}
.bs-strip img{flex:0 0 auto;height:clamp(260px,38vw,440px);aspect-ratio:4/5;object-fit:cover;border-radius:var(--r);scroll-snap-align:center}
.bs-strip img:nth-child(3n+2){aspect-ratio:5/4}
@media(min-width:1200px){.bs-strip{padding-inline:calc((100vw - 1200px) / 2 + var(--gut))}}

.bs-narrow{max-width:780px}
.bs-faq{display:grid;gap:10px}
.bs-faq details{border-radius:var(--r);background:var(--bb-bg2);padding:0 22px}
.bs-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 0;font:600 17px/1.45 var(--disp)}
.bs-faq summary::-webkit-details-marker{display:none}
.bs-faq summary i{font-style:normal;width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border-radius:50%;background:var(--bb-bg);font-size:18px;transition:transform .25s}
.bs-faq details[open] summary i{transform:rotate(45deg)}
.bs-faq p{margin:0;padding-bottom:20px;color:var(--bb-ink2)}

.bs-visit{display:grid;gap:14px}
@media(min-width:900px){.bs-visit{grid-template-columns:repeat(2,minmax(0,1fr))}}
.bs-visit h2{margin:0 0 6px;font:700 26px/1.25 var(--disp)}
.bs-addr{margin:0;color:var(--bb-ink2)}
.bs-hours{list-style:none;margin:10px 0 0;padding:0}
.bs-hours li{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--bb-line);font-size:15px}
.bs-hours li:last-child{border-bottom:0}
.bs-hours li span:last-child{color:var(--bb-ink2)}
.bs-hours li.today{font-weight:600}
.bs-hours li.today span:first-child::after{content:' · اليوم';color:var(--bb-acc);font-weight:500}

.bs-foot{background:var(--bb-ink);color:var(--bb-bg);padding:48px 0 36px}
.bs-foot-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px;padding-bottom:24px;border-bottom:1px solid color-mix(in srgb,var(--bb-bg) 16%,transparent)}
.bs-foot-top b{font:700 clamp(26px,3.4vw,40px)/1.1 var(--disp)}
.bs-fl{display:flex;gap:8px}
.bs-fl a{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--bb-bg) 25%,transparent)}
.bs-fl a:hover{background:var(--bb-bg);color:var(--bb-ink)}
.bs-extra{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:20px;font-size:14px}
.bs-extra a{opacity:.8}
.bs-foot p{margin:20px 0 0;font-size:13.5px;opacity:.6}

.bs-bar{position:fixed;inset:auto 12px calc(12px + env(safe-area-inset-bottom,0px));z-index:50;display:flex;gap:6px;padding:6px;border-radius:999px;background:var(--bb-bg);border:1px solid var(--bb-line);box-shadow:0 10px 30px -12px rgba(0,0,0,.35)}
.bs-bar .bs-btn{min-height:46px;padding:0 18px}
.bs-bar .bs-btn:first-child{flex:1}
.bs-bar .bs-btn.ic{width:46px;padding:0}
@media(min-width:900px){.bs-bar{display:none}}
.bs svg{width:18px;height:18px}
.bs a:focus-visible,.bs button:focus-visible,.bs summary:focus-visible,.bs-strip:focus-visible{outline:2px solid var(--bb-acc);outline-offset:3px}
`
