'use client'

import { useRef } from 'react'
import type { ServiceContent, ServiceTeamMember } from '@/utils/services/types'
import { DAYS_AR, timeAr } from '@/utils/services/barber'
import { Booking, I, ar, type Colors } from '../NicheView'
import { FORM_CSS, initial, useBarber, useReveal } from './shared'

/**
 * Barber design A, «الكرسي»: a dark editorial page. Big type over the shop's
 * own photo, a price board with leaders, the barbers as numbered portraits,
 * the Google rating set large. One accent (the shop's own colour), hairlines
 * instead of boxes, no glow. Sections leave the page when their data is empty.
 */
export default function BarberA({ content, colors, logo }: { content: ServiceContent; colors?: Colors; logo?: string }) {
  const d = useBarber(content, colors)
  const { k, b } = d
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)
  const navs = [
    d.services.length ? ['#a-prices', k.services] : null,
    d.members.length ? ['#a-crew', content.team?.heading || k.team] : null,
    d.reviews.length ? ['#a-reviews', 'التقييمات'] : null,
    ['#a-visit', 'الموقع'],
  ].filter(Boolean) as [string, string][]
  let n = 0
  const idx = () => String(++n).padStart(2, '0')

  return (
    <div ref={root} className="ba" dir="rtl" style={d.vars}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CSS + FORM_CSS }} />

      <header className={`ba-top${d.scrolled ? ' on' : ''}${d.hero ? '' : ' plain'}`}>
        <a className="ba-mark" href="#a-top">
          {logo && b.show_logo !== false ? <img src={logo} alt="" /> : null}
          <b>{d.short}</b>
        </a>
        <nav className="ba-nav">{navs.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav>
        {d.walkin ? (d.wa ? <a className="ba-cta" href={d.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">واتساب</a> : null) : <a className="ba-cta" href="#a-book">{k.cta}</a>}
      </header>

      <section id="a-top" className={`ba-hero${d.hero ? '' : ' plain'}`}>
        {d.hero ? <img className="ba-hero-img" src={d.hero} alt={`داخل ${b.name}`} /> : null}
        <div className="ba-w ba-hero-in">
          <p className="ba-eyebrow">{[b.audience ? `${k.label} · ${b.audience}` : k.label, [b.area, b.city].filter(Boolean).join('، ')].filter(Boolean).join('  —  ')}</p>
          <h1>{d.short}</h1>
          {b.latin ? <p className="ba-latin" dir="ltr">{b.latin}</p> : null}
          <p className="ba-lede">{content.hero.subheadline || b.tagline}</p>
          <div className="ba-acts">
            {d.walkin ? null : <a className="ba-btn" href="#a-book">{k.cta} <span aria-hidden>←</span></a>}
            {d.services.length ? <a className="ba-btn ghost" href="#a-prices">{d.priced ? 'الأسعار' : k.services}</a> : null}
          </div>
        </div>
        <div className="ba-w">
          <dl className="ba-facts">
            {d.rating ? <div><dt>جوجل</dt><dd><b>{d.rating.toFixed(1)}</b> <span className="ba-star" aria-hidden>★</span><small>{d.count ? `${ar(d.count)} تقييم` : ''}</small></dd></div> : null}
            {d.hours.length ? <div><dt>اليوم</dt><dd><i className={`ba-dot${d.st && !d.st.open ? ' off' : ''}`} /><b>{d.st ? (d.st.open ? 'مفتوح' : 'مغلق') : '—'}</b><small>{d.st?.text || ''}</small></dd></div> : null}
            <div><dt>المكان</dt><dd><b>{d.where}</b><small>{b.area ? b.city : ''}</small></dd></div>
          </dl>
        </div>
      </section>

      {d.services.length ? (
        <section className="ba-sec" id="a-prices"><div className={`ba-w ba-menu${d.side ? '' : ' one'}`}>
          <div data-rv>
            <Head n={idx()} title={content.services.heading || k.services} note={d.priced ? 'السعر المكتوب هو ما تدفعه.' : undefined} />
            <ol className="ba-list">
              {d.services.map((s) => (
                <li key={s.name}>
                  <span className="nm">{s.name}</span>
                  <span className="ld" aria-hidden />
                  <span className="pr">{s.price_from || ''}</span>
                  {s.duration || s.description ? <span className="sub">{[s.duration, s.description].filter(Boolean).join(' · ')}</span> : null}
                </li>
              ))}
            </ol>
            {!d.priced && d.wa ? (
              <a className="ba-ask" href={d.waLink('مرحبًا، أريد أسعار الخدمات')!} target="_blank" rel="noopener noreferrer">
                <span><b>تريد السعر قبل أن تأتي؟</b><small>اكتب لنا على واتساب، ونرد عليك بسعر الخدمة.</small></span>{I.wa}
              </a>
            ) : null}
            {content.terms?.length ? <dl className="ba-terms">{content.terms.map((t) => <div key={t.label}><dt>{t.label}</dt><dd>{t.text}</dd></div>)}</dl> : null}
          </div>
          {d.side ? <figure className="ba-side" data-rv><img src={d.side} alt={`${k.place} ${d.short}`} loading="lazy" /></figure> : null}
        </div></section>
      ) : null}

      {d.members.length ? (
        <section className="ba-sec alt" id="a-crew"><div className="ba-w">
          <div data-rv><Head n={idx()} title={content.team?.heading || k.team} note={d.members.some((m) => m.quote) ? 'تحت كل اسم، كلام زبون كتبه على جوجل.' : undefined} /></div>
          <div className={`ba-crew c${Math.min(d.members.length, 4)}`}>
            {d.members.map((m, i) => <Barber key={m.name + i} m={m} i={i} label={k.bookAt(m.name)} book={d.walkin ? undefined : () => d.bookWith(m.name)} />)}
          </div>
        </div></section>
      ) : null}

      {d.reviews.length ? (
        <section className="ba-sec" id="a-reviews"><div className="ba-w">
          <div data-rv><Head n={idx()} title="ماذا يقول الزبائن" /></div>
          <div className="ba-rv" data-rv>
            <div className="ba-score">
              {d.rating ? <><b>{d.rating.toFixed(1)}</b><span className="ba-stars" aria-label={`${d.rating.toFixed(1)} من 5`}>★★★★★</span><small>{d.count ? `من ${ar(d.count)} تقييم على جوجل` : 'على جوجل'}</small></> : null}
              {d.mapsUrl ? <a href={d.mapsUrl} target="_blank" rel="noopener noreferrer">اقرأ كل التقييمات ←</a> : null}
            </div>
            <figure className="ba-quote">
              <blockquote>{d.reviews[0].text}</blockquote>
              <figcaption><bdi>{d.reviews[0].name}</bdi>{d.reviews[0].when ? <span> · {d.reviews[0].when}</span> : null}</figcaption>
            </figure>
          </div>
          {d.reviews.length > 1 ? (
            <div className="ba-rvs">{d.reviews.slice(1).map((r, i) => (
              <figure key={i} data-rv><blockquote>{r.text}</blockquote><figcaption><bdi>{r.name}</bdi>{r.when ? ` · ${r.when}` : ''}</figcaption></figure>
            ))}</div>
          ) : null}
        </div></section>
      ) : null}

      <section className="ba-sec alt" id="a-book" ref={d.bookRef}><div className="ba-w ba-bk">
        <div data-rv>
          <Head n={idx()} title={d.walkin ? 'تعال مباشرة' : k.cta} />
          <p className="ba-p">{d.walkin ? 'نستقبلك بدون موعد، بالدور.' : k.bookLine}</p>
          <dl className="ba-info">
            {d.st?.text ? <div><dt>الآن</dt><dd>{d.st.open ? 'مفتوح' : 'مغلق'} · {d.st.text}</dd></div> : null}
            {content.booking?.wait ? <div><dt>الانتظار عادة</dt><dd>{content.booking.wait}</dd></div> : null}
            {content.booking?.busy ? <div><dt>الأكثر زحمة</dt><dd>{content.booking.busy}</dd></div> : null}
          </dl>
        </div>
        <div className="ba-panel" data-rv>
          {d.walkin || !d.canBook ? (
            <div className="ba-wa">
              <b>{d.walkin ? 'تريد أن تتأكد من الدور؟' : 'احجز على واتساب'}</b>
              <p>{d.walkin ? 'اسألنا الآن، ونرد عليك.' : `اكتب الخدمة و${k.one} والوقت، ونؤكّد لك الموعد.`}</p>
              <div className="ba-acts">
                {d.wa ? <a className="ba-btn" href={d.waLink(d.walkin ? 'مرحبًا، كم الدور الآن؟' : `مرحبًا، أريد حجز موعد${d.pick !== k.any ? ' عند ' + d.pick : ''}.`)!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
                {d.tel ? <a className="ba-btn ghost" href={`tel:${d.tel}`}>{I.phone} اتصل</a> : null}
              </div>
            </div>
          ) : (
            <Booking k={k} services={d.services.map((s) => s.name)} barbers={d.members.map((m) => m.name)} pick={d.pick} setPick={d.setPick} slug={d.slug} preview={d.preview || !d.slug} />
          )}
        </div>
      </div></section>

      {d.place.length >= 2 ? (
        <section className="ba-sec" id="a-place"><div className="ba-w">
          <div data-rv><Head n={idx()} title={content.gallery.heading || `داخل ${k.place}`} /></div>
          <div className={`ba-gal g${Math.min(d.place.length, 6)}`}>{d.place.map((u, i) => <img key={u} src={u} alt={`${d.short} ${i + 1}`} loading="lazy" data-rv />)}</div>
        </div></section>
      ) : null}

      {d.faq.length ? (
        <section className={`ba-sec${d.place.length >= 2 ? ' alt' : ''}`} id="a-faq"><div className="ba-w ba-faqw">
          <div data-rv><Head n={idx()} title={content.faq.heading || 'قبل أن تأتي'} /></div>
          <div className="ba-faq" data-rv>{d.faq.map((f, i) => <details key={i}><summary>{f.q}<i aria-hidden /></summary><p>{f.a}</p></details>)}</div>
        </div></section>
      ) : null}

      <section className={`ba-sec${d.faq.length && d.place.length < 2 ? ' alt' : ''}`} id="a-visit"><div className="ba-w ba-visit">
        <div data-rv>
          <Head n={idx()} title="زرنا" />
          <p className="ba-addr">{content.footer.address || [b.area, b.city].filter(Boolean).join('، ')}</p>
          <div className="ba-acts">
            {d.mapsUrl ? <a className="ba-btn" href={d.mapsUrl} target="_blank" rel="noopener noreferrer">{I.pin} الاتجاهات</a> : null}
            {d.tel ? <a className="ba-btn ghost" href={`tel:${d.tel}`}>{I.phone} <span dir="ltr">{content.footer.phone}</span></a> : null}
          </div>
        </div>
        {d.hours.length ? (
          <table className="ba-hours" data-rv><tbody>
            {d.hours.map((h) => (
              <tr key={h.day} className={d.st?.today === h.day ? 'today' : undefined}>
                <th scope="row">{DAYS_AR[h.day]}</th>
                <td>{h.closed || !h.periods.length ? 'مغلق' : h.periods.map((x) => `${timeAr(x.open)} – ${timeAr(x.close)}`).join('، ')}</td>
              </tr>
            ))}
          </tbody></table>
        ) : null}
      </div></section>

      <footer className="ba-foot"><div className="ba-w">
        <p className="ba-big">{b.name}</p>
        <div className="ba-fl">
          {d.wa ? <a href={d.waLink('مرحبًا')!} target="_blank" rel="noopener noreferrer">{I.wa} واتساب</a> : null}
          {d.ig ? <a href={d.ig} target="_blank" rel="noopener noreferrer">{I.ig} إنستغرام</a> : null}
          {(content.links?.extra || []).map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label || l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}</a>)}
        </div>
        <p className="ba-fine">{[content.footer.address, b.latin].filter(Boolean).join(' · ')}</p>
      </div></footer>

      <nav className="ba-bar">
        {d.walkin ? null : <a className="ba-btn" href="#a-book">{k.cta}</a>}
        {d.wa ? <a className="ba-btn ghost" href={d.waLink('مرحبًا، أريد حجز موعد')!} target="_blank" rel="noopener noreferrer" aria-label="واتساب">{I.wa}</a> : null}
        {d.tel ? <a className="ba-btn ghost" href={`tel:${d.tel}`} aria-label="اتصال">{I.phone}</a> : null}
      </nav>
    </div>
  )
}

function Head({ n, title, note }: { n: string; title: string; note?: string }) {
  return (
    <div className="ba-head">
      <span className="ba-n">{n}</span>
      <h2>{title}</h2>
      {note ? <p>{note}</p> : null}
    </div>
  )
}

function Barber({ m, i, book, label }: { m: ServiceTeamMember; i: number; book?: () => void; label: string }) {
  return (
    <article className="ba-pr" data-rv>
      <div className={`ba-por${m.photo ? '' : ' ni'}`}>
        {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span aria-hidden>{initial(m.name)}</span>}
        <em>{String(i + 1).padStart(2, '0')}</em>
      </div>
      <h3>{m.name}</h3>
      <p className="role">{[m.role, ...(m.tags || [])].filter(Boolean).join(' · ')}</p>
      {m.quote ? <blockquote>«{m.quote}»<cite><bdi>{m.quote_by || 'زبون'}</bdi> · جوجل</cite></blockquote> : null}
      {book ? <button type="button" className="ba-link" onClick={book}>{label} <span aria-hidden>←</span></button> : null}
    </article>
  )
}

const CSS = `
.ba{--disp:'Alexandria','IBM Plex Sans Arabic',sans-serif;--body:'IBM Plex Sans Arabic',system-ui,sans-serif;--r:4px;--gut:clamp(18px,5vw,56px);
  background:var(--bb-bg);color:var(--bb-ink);font-family:var(--body);font-size:16px;line-height:1.75;min-height:100%;padding-bottom:84px;overflow-x:clip;-webkit-font-smoothing:antialiased}
.ba *,.ba *::before,.ba *::after{box-sizing:border-box}
.ba img{display:block;max-width:100%}
.ba a{color:inherit}
.ba-w{width:100%;max-width:1240px;margin:0 auto;padding:0 var(--gut)}
@media(min-width:900px){.ba{padding-bottom:0}}
@media(max-width:899px){.ba-hero:not(.plain){padding-bottom:70px}}

.ba-top{position:fixed;inset:0 0 auto;z-index:40;display:flex;align-items:center;gap:24px;height:68px;padding:0 var(--gut);color:#fff;transition:background .3s,color .3s,border-color .3s;border-bottom:1px solid transparent}
.ba-top.on,.ba-top.plain{background:var(--bb-bg);color:var(--bb-ink);border-color:var(--bb-line)}
.ba-mark{display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0}
.ba-mark img{width:36px;height:36px;object-fit:contain;border-radius:4px}
.ba-mark b{font:700 19px/1 var(--disp);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ba-nav{display:none;gap:28px;margin-inline-start:auto;font-size:15px}
.ba-nav a{text-decoration:none;opacity:.8}
.ba-nav a:hover{opacity:1}
.ba-cta{margin-inline-start:auto;display:inline-flex;align-items:center;min-height:40px;padding:0 18px;border:1px solid currentColor;border-radius:999px;font:600 14px var(--body);text-decoration:none;white-space:nowrap}
.ba-top.on .ba-cta,.ba-top.plain .ba-cta{background:var(--bb-acc);color:var(--bb-on);border-color:var(--bb-acc)}
@media(min-width:900px){.ba-nav{display:flex}.ba-cta{margin-inline-start:0}}

.ba-hero{position:relative;min-height:min(100svh,920px);display:grid;grid-template-rows:1fr auto;color:#fff;background:#0b0b0b;isolation:isolate}
.ba-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.ba-hero::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,.1) 30%,rgba(0,0,0,.55) 62%,rgba(0,0,0,.88) 100%)}
.ba-hero.plain{background:var(--bb-bg);color:var(--bb-ink);min-height:auto;padding-top:96px}
.ba-hero.plain::after{display:none}
.ba-hero-in{align-self:end;padding-top:120px;padding-bottom:36px}
.ba-eyebrow{margin:0 0 18px;font-size:14px;letter-spacing:.01em;opacity:.85}
.ba-hero h1{margin:0;font:800 clamp(52px,11vw,140px)/.98 var(--disp);letter-spacing:-.01em;max-width:12ch;text-wrap:balance}
.ba-latin{text-align:right;margin:14px 0 0;font:500 13px/1 var(--disp);letter-spacing:.32em;text-transform:uppercase;opacity:.7}
.ba-lede{margin:22px 0 0;font-size:clamp(16px,1.6vw,19px);max-width:46ch;opacity:.9}
.ba-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.ba-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 26px;border-radius:var(--r);background:var(--bb-acc);color:var(--bb-on)!important;font:600 16px var(--body);text-decoration:none;border:1px solid var(--bb-acc);cursor:pointer;transition:background .2s,border-color .2s,transform .2s}
.ba-btn:hover{background:var(--bb-acc2);border-color:var(--bb-acc2)}
.ba-btn:active{transform:translateY(1px)}
.ba-btn.ghost{background:transparent;color:inherit!important;border-color:color-mix(in srgb,currentColor 35%,transparent)}
.ba-btn.ghost:hover{border-color:currentColor}
.ba-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:0;border-top:1px solid rgba(255,255,255,.22)}
.ba-hero.plain .ba-facts{border-color:var(--bb-line2)}
.ba-facts>div{padding:18px 0 26px;padding-inline-end:12px}
.ba-facts>div+div{border-inline-start:1px solid rgba(255,255,255,.14);padding-inline-start:16px}
.ba-hero.plain .ba-facts>div+div{border-color:var(--bb-line)}
.ba-facts dt{font-size:12.5px;opacity:.65;margin-bottom:6px}
.ba-facts dd{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px}
.ba-facts b{font:700 clamp(18px,2.4vw,26px)/1.1 var(--disp)}
.ba-facts small{font-size:13px;opacity:.7;flex-basis:100%}
.ba-star{color:var(--bb-acc);font-size:16px}
.ba-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#4cb37a;align-self:center}
.ba-dot.off{background:#c9654f}

.ba-sec{padding:clamp(72px,10vw,136px) 0;background:var(--bb-bg)}
.ba-sec.alt{background:var(--bb-bg2)}
.ba-head{display:grid;gap:10px;margin-bottom:clamp(32px,4.5vw,56px)}
.ba-n{font:600 13px/1 var(--disp);color:var(--bb-acc);letter-spacing:.08em;display:flex;align-items:center;gap:12px}
.ba-n::after{content:'';height:1px;width:48px;background:var(--bb-line2)}
.ba-head h2{margin:0;font:700 clamp(32px,4.6vw,56px)/1.1 var(--disp);letter-spacing:-.005em;text-wrap:balance}
.ba-head p{margin:0;color:var(--bb-mute);font-size:15.5px;max-width:52ch}
.ba-p{color:var(--bb-ink2);max-width:46ch;margin:0}

.ba-menu{display:grid;gap:48px}
@media(min-width:960px){.ba-menu{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:72px;align-items:start}.ba-menu.one{grid-template-columns:minmax(0,760px)}}
.ba-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--bb-line2)}
.ba-list li{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:4px 14px;padding:20px 0;border-bottom:1px solid var(--bb-line)}
.ba-list .nm{font:600 clamp(18px,2vw,22px)/1.3 var(--disp)}
.ba-list .ld{border-bottom:1px dotted var(--bb-line2);transform:translateY(-5px);min-width:20px}
.ba-list .pr{font:700 clamp(18px,2vw,22px)/1 var(--disp);color:var(--bb-acc);white-space:nowrap}
.ba-list .sub{grid-column:1/-1;font-size:14px;color:var(--bb-mute)}
.ba-ask{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:28px;padding:20px 22px;border:1px solid var(--bb-line2);border-radius:var(--r);text-decoration:none;transition:border-color .2s}
.ba-ask:hover{border-color:var(--bb-acc)}
.ba-ask span{display:grid;gap:2px}
.ba-ask b{font:600 17px var(--disp)}
.ba-ask small{color:var(--bb-mute);font-size:14px}
.ba-ask svg{width:26px;height:26px;color:var(--bb-acc);flex:0 0 auto}
.ba-terms{margin:28px 0 0;display:grid;gap:10px;font-size:14.5px}
.ba-terms div{display:grid;grid-template-columns:110px 1fr;gap:12px}
.ba-terms dt{color:var(--bb-mute)}
.ba-terms dd{margin:0}
.ba-side{margin:0;position:relative}
.ba-side img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:var(--r)}
@media(min-width:960px){.ba-side{position:sticky;top:100px}}

.ba-crew{display:grid;gap:40px 24px;grid-template-columns:minmax(0,1fr)}
@media(min-width:620px){.ba-crew{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1000px){.ba-crew.c3{grid-template-columns:repeat(3,minmax(0,1fr))}.ba-crew.c4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ba-crew.c1{max-width:420px}
@media(max-width:619px){
  .ba-crew{gap:0}
  .ba-pr{grid-template-columns:104px minmax(0,1fr);column-gap:16px;row-gap:6px;padding:20px 0;border-bottom:1px solid var(--bb-line)}
  .ba-pr:first-child{border-top:1px solid var(--bb-line2)}
  .ba-por{grid-row:1/span 5;margin:0;aspect-ratio:4/5}
  .ba-por.ni span{font-size:52px}
  .ba-por.ni em{display:none}
  .ba-por em{inset-block-start:8px;inset-inline-start:8px;padding:5px 7px;font-size:11px}
  .ba-pr h3{font-size:22px}
}
.ba-pr{display:grid;gap:10px;align-content:start}
.ba-por{position:relative;aspect-ratio:4/5;border-radius:var(--r);overflow:hidden;background:var(--bb-bg);margin-bottom:8px}
.ba-por img{width:100%;height:100%;object-fit:cover;filter:grayscale(.15)}
@media(min-width:620px){.ba-por.ni{aspect-ratio:3/2}}
.ba-por.ni{display:grid;place-items:center;border:1px solid var(--bb-line2);background:color-mix(in srgb,var(--bb-acc) 7%,var(--bb-bg))}
.ba-por.ni span{font:800 clamp(96px,14vw,168px)/1 var(--disp);color:color-mix(in srgb,var(--bb-acc) 70%,var(--bb-ink))}
.ba-por em{position:absolute;inset-block-start:14px;inset-inline-start:14px;font:600 12px/1 var(--disp);font-style:normal;letter-spacing:.1em;padding:7px 9px;border-radius:999px;background:var(--bb-bg);color:var(--bb-ink)}
.ba-pr h3{margin:0;font:700 26px/1.15 var(--disp)}
.ba-pr .role{margin:0;color:var(--bb-mute);font-size:14.5px}
.ba-pr blockquote{margin:4px 0 0;font-size:15px;color:var(--bb-ink2);line-height:1.7}
.ba-pr cite{display:block;margin-top:6px;font-style:normal;font-size:13px;color:var(--bb-mute)}
.ba-link{all:unset;cursor:pointer;margin-top:6px;font:600 15px var(--body);color:var(--bb-acc);display:inline-flex;gap:8px;align-items:center;width:max-content;border-bottom:1px solid currentColor;padding-bottom:2px}
.ba-link:focus-visible{outline:2px solid var(--bb-acc);outline-offset:3px}

.ba-rv{display:grid;gap:40px;padding-bottom:clamp(40px,5vw,64px);border-bottom:1px solid var(--bb-line)}
@media(min-width:900px){.ba-rv{grid-template-columns:minmax(0,.7fr) minmax(0,1.3fr);gap:72px;align-items:end}}
.ba-score{display:grid;gap:8px;align-content:start}
.ba-score b{font:800 clamp(88px,12vw,160px)/.9 var(--disp);letter-spacing:-.02em}
.ba-stars{color:var(--bb-acc);letter-spacing:.18em;font-size:18px}
.ba-score small{color:var(--bb-mute);font-size:14.5px}
.ba-score a{margin-top:10px;font-size:15px;color:var(--bb-acc);text-decoration:none;width:max-content;border-bottom:1px solid currentColor}
.ba-quote{margin:0}
.ba-quote blockquote{margin:0;font:500 clamp(22px,2.8vw,34px)/1.5 var(--disp);text-wrap:pretty}
.ba-quote blockquote::before{content:'«';color:var(--bb-acc)}
.ba-quote blockquote::after{content:'»';color:var(--bb-acc)}
.ba-quote figcaption{margin-top:18px;font-size:15px;color:var(--bb-ink2)}
.ba-quote figcaption span{color:var(--bb-mute)}
.ba-rvs{display:grid;gap:0;margin-top:8px}
@media(min-width:760px){.ba-rvs{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:48px}}
.ba-rvs figure{margin:0;padding:24px 0;border-bottom:1px solid var(--bb-line)}
.ba-rvs blockquote{margin:0;color:var(--bb-ink2);font-size:16px}
.ba-rvs figcaption{margin-top:10px;font-size:13.5px;color:var(--bb-mute)}

.ba-bk{display:grid;gap:40px}
@media(min-width:960px){.ba-bk{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:72px;align-items:start}}
.ba-info{margin:28px 0 0;display:grid;border-top:1px solid var(--bb-line2)}
.ba-info div{display:grid;grid-template-columns:120px 1fr;gap:12px;padding:14px 0;border-bottom:1px solid var(--bb-line)}
.ba-info dt{color:var(--bb-mute);font-size:14px}
.ba-info dd{margin:0;font-size:15px}
.ba-panel{background:var(--bb-bg);border:1px solid var(--bb-line);border-radius:calc(var(--r) * 2);padding:clamp(20px,3vw,36px)}
.ba-wa b{font:700 22px var(--disp)}
.ba-wa p{color:var(--bb-ink2);margin:8px 0 0}

.ba-gal{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
.ba-gal img{width:100%;height:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r)}
.ba-gal img:first-child{grid-column:1/-1;aspect-ratio:16/10}
.ba-gal img:last-child:nth-child(even){grid-column:1/-1;aspect-ratio:16/10}
@media(min-width:900px){
  .ba-gal{grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:clamp(150px,16vw,220px)}
  .ba-gal img,.ba-gal img:last-child:nth-child(even){aspect-ratio:auto;grid-column:span 3;grid-row:span 1}
  .ba-gal img:first-child{grid-column:span 6;grid-row:span 2}
  .ba-gal.g2 img{grid-column:span 6;grid-row:span 2}
  .ba-gal.g3 img:first-child,.ba-gal.g6 img:first-child{grid-column:span 8}
  .ba-gal.g3 img:not(:first-child),.ba-gal.g6 img:not(:first-child){grid-column:span 4}
  .ba-gal.g4 img:nth-child(2){grid-column:span 6}
}

.ba-faqw{display:grid;gap:8px}
@media(min-width:960px){.ba-faqw{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:72px}}
.ba-faq{border-top:1px solid var(--bb-line2)}
.ba-faq details{border-bottom:1px solid var(--bb-line)}
.ba-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:22px 0;font:600 18px/1.4 var(--disp)}
.ba-faq summary::-webkit-details-marker{display:none}
.ba-faq summary i{position:relative;width:14px;height:14px;flex:0 0 auto}
.ba-faq summary i::before,.ba-faq summary i::after{content:'';position:absolute;inset:6px 0 auto;height:2px;background:var(--bb-acc);transition:transform .25s}
.ba-faq summary i::after{transform:rotate(90deg)}
.ba-faq details[open] summary i::after{transform:rotate(0)}
.ba-faq p{margin:0 0 22px;color:var(--bb-ink2);max-width:60ch}
.ba-faq summary:focus-visible{outline:2px solid var(--bb-acc);outline-offset:2px}

.ba-visit{display:grid;gap:40px}
@media(min-width:960px){.ba-visit{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:72px;align-items:start}}
.ba-addr{margin:0;font:500 clamp(20px,2.4vw,26px)/1.5 var(--disp);max-width:26ch}
.ba-hours{width:100%;border-collapse:collapse;font-size:15.5px}
.ba-hours th,.ba-hours td{padding:13px 0;border-bottom:1px solid var(--bb-line);text-align:start;font-weight:400}
.ba-hours td{text-align:end;color:var(--bb-ink2);direction:rtl}
.ba-hours tr.today th,.ba-hours tr.today td{color:var(--bb-ink);font-weight:600}
.ba-hours tr.today th::after{content:' · اليوم';color:var(--bb-acc);font-weight:500}

.ba-foot{padding:clamp(64px,8vw,112px) 0 40px;border-top:1px solid var(--bb-line);background:var(--bb-bg)}
.ba-big{margin:0;font:800 clamp(44px,10vw,128px)/1 var(--disp);letter-spacing:-.01em;color:var(--bb-ink)}
.ba-fl{display:flex;flex-wrap:wrap;gap:10px 28px;margin-top:36px;font-size:15px}
.ba-fl a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;opacity:.85}
.ba-fl a:hover{opacity:1;color:var(--bb-acc)}
.ba-fine{margin:28px 0 0;color:var(--bb-mute);font-size:13.5px}

.ba-bar{position:fixed;inset:auto 0 0;z-index:50;display:flex;gap:8px;padding:10px var(--gut) calc(10px + env(safe-area-inset-bottom,0px));background:var(--bb-bg);border-top:1px solid var(--bb-line)}
.ba-bar .ba-btn{min-height:48px;padding:0 16px}
.ba-bar .ba-btn:first-child{flex:1}
.ba-bar .ba-btn.ghost{color:var(--bb-ink)!important;width:52px;padding:0}
@media(min-width:900px){.ba-bar{display:none}}
.ba svg{width:18px;height:18px}
.ba a:focus-visible,.ba button:focus-visible{outline:2px solid var(--bb-acc);outline-offset:3px}
`
