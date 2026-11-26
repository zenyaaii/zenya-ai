"use client"

import { Amiri, Aref_Ruqaa, IBM_Plex_Sans_Arabic } from 'next/font/google'
import type { BrandContent } from '@/utils/studio/brand'
import { digits, profileUrl } from '@/utils/studio/brand'

/**
 * «فصول» — the brand-story design Anas was shown on 2026-11-20 (sample A):
 * the page reads as numbered chapters of a book, the story first and the
 * products after the visitor knows who made them.
 *
 * Only a look over BrandContent (utils/studio/brand.ts). Every word, photo
 * and list comes from the build answers and is edited in the editor
 * (utils/studio/brand-editor-config.ts). A chapter with nothing in it is left
 * out and the chapters after it renumber, so the numbers always say where the
 * reader is.
 *
 * Colours: the owner's own (measured from his photos and logo) arrive as
 * colorOverrides; the studio preset tokens are accepted too.
 */

const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], display: 'swap' })
const ruqaa = Aref_Ruqaa({ subsets: ['arabic'], weight: ['700'], display: 'swap' })
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '600'], display: 'swap' })

const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع']

const BASE = {
  background: '#F7F6F1', text: '#1B1D1A', muted: '#5F655E', accent: '#2F5D46', primary: '#2C6E70', surfaceAlt: '#D9E7E4', border: '#E1E3DC',
}

function palette(o?: Record<string, string>) {
  const c: Record<string, string | undefined> = { ...BASE, ...(o || {}) }
  return {
    paper: c.background || BASE.background,
    ink: c.text || BASE.text,
    soft: c.muted || BASE.muted,
    brand: c.accent || BASE.accent,
    sea: c.primary || c.accentMuted || c.accent || BASE.primary,
    shelf: o?.surfaceAlt || o?.surface || BASE.surfaceAlt,
    rule: c.border || BASE.border,
  }
}

const CSS = `
.bs{background:var(--paper);color:var(--ink);font-family:var(--b);font-size:16px;line-height:1.9;direction:rtl;-webkit-font-smoothing:antialiased;min-height:100%}
.bs *{box-sizing:border-box}.bs img{display:block;max-width:100%}
.bs a{color:inherit}
.bs .in{max-width:1180px;margin:0 auto;padding:0 20px}
.bs .top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule)}
.bs .logo{display:flex;align-items:center;gap:10px;font-family:var(--d);font-weight:700;font-size:24px;color:var(--brand);text-decoration:none;line-height:1.2}
.bs .logo img{height:44px;width:auto;max-width:160px;object-fit:contain;mix-blend-mode:multiply}
.bs .nav{display:none;gap:26px;font-size:14px;color:var(--soft)}.bs .nav a{text-decoration:none}
.bs .buy{font-size:14px;background:var(--brand);color:var(--paper);padding:9px 16px;border-radius:99px;text-decoration:none;white-space:nowrap}
.bs .hero{padding:36px 0 28px;display:grid;gap:22px}
.bs .eb{font-size:13px;color:var(--sea)}
.bs h1{font-family:var(--d);font-weight:700;font-size:40px;line-height:1.3;margin:0;max-width:16ch;text-wrap:balance}
.bs .hero p{margin:14px 0 0;color:var(--soft);font-size:17px;max-width:46ch}
.bs .hero .ph{aspect-ratio:4/3;object-fit:cover;width:100%;border-radius:2px}
.bs .ch{border-top:1px solid var(--rule);padding:40px 0;display:grid;gap:18px}
.bs .chl{display:flex;gap:10px;align-items:baseline;color:var(--sea);font-size:13px}
.bs .chl b{font-family:var(--d);font-size:22px;color:var(--brand);font-weight:700}
.bs h2{font-family:var(--d);font-size:30px;line-height:1.4;margin:0;font-weight:700;text-wrap:balance}
.bs .prose p{margin:0 0 14px;font-size:17px;max-width:60ch}
.bs .q{font-family:var(--d);font-size:26px;line-height:1.6;color:var(--brand);margin:0;padding-inline-start:18px;border-inline-start:3px solid var(--shelf)}
.bs .sig{font-family:var(--r);font-size:28px;color:var(--sea);line-height:1.2;margin-top:12px}
.bs .sig small{display:block;font-family:var(--b);font-size:12px;color:var(--soft);margin-top:6px}
.bs .stphoto{aspect-ratio:3/4;object-fit:cover;width:100%}
.bs .vals{display:grid;gap:18px}
.bs .vals>div{border-top:1px solid var(--ink);padding-top:10px}
.bs h3{font-family:var(--d);font-size:21px;margin:0 0 4px;line-height:1.4}
.bs .vals p,.bs .ben p{margin:0;color:var(--soft);font-size:15px}
.bs .proc{display:grid;gap:20px;padding:0;margin:0;list-style:none}
.bs .proc li{display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center}
.bs .proc li.np{grid-template-columns:1fr}
.bs .proc img{aspect-ratio:1;object-fit:cover;width:96px}
.bs .proc h3 span{color:var(--sea)}
.bs .proc p{margin:0;color:var(--soft);font-size:14.5px}
.bs .ben{display:grid;grid-template-columns:1fr 1fr;gap:18px 16px}
.bs .ben>div{border-top:1px solid var(--rule);padding-top:10px}
.bs .ben h3{color:var(--brand);font-size:19px}
.bs .prods{display:grid;grid-template-columns:1fr 1fr;gap:22px 14px}
.bs .prods .ph{aspect-ratio:4/5;object-fit:contain;width:100%;background:var(--shelf);margin-bottom:10px}
.bs .prods .noph{aspect-ratio:4/5;background:var(--shelf);margin-bottom:10px;display:grid;place-items:center;font-family:var(--d);font-size:28px;color:var(--brand);text-align:center;padding:12px}
.bs .prods h3{font-size:19px;margin:0}
.bs .prods p{margin:0;font-size:13.5px;color:var(--soft);line-height:1.6}
.bs .prods .pr{font-size:14px;color:var(--ink);font-weight:600;margin-top:4px}
.bs .ask{display:inline-block;margin-top:6px;font-size:13px;color:var(--brand);font-weight:600;text-decoration:none;border-bottom:1px solid currentColor}
.bs .note{font-size:13.5px;color:var(--soft);max-width:60ch}
.bs .tl>div{display:grid;grid-template-columns:72px 1fr;gap:12px;padding:12px 0;border-bottom:1px dashed var(--rule)}
.bs .tl b{font-family:var(--d);font-size:22px;color:var(--sea)}
.bs .team{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.bs .team img,.bs .team .mono{aspect-ratio:1;width:100%;object-fit:cover;background:var(--shelf)}
.bs .team .mono{display:grid;place-items:center;font-family:var(--d);font-size:48px;color:var(--brand)}
.bs .team b{display:block;font-family:var(--d);font-size:19px;margin-top:8px}.bs .team span{font-size:13px;color:var(--soft)}
.bs .gal{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.bs .gal img{width:100%;aspect-ratio:1;object-fit:cover}
.bs .rev{display:grid;gap:22px}
.bs .rev blockquote{margin:0;font-family:var(--d);font-size:20px;line-height:1.7}
.bs .rev cite{display:block;font-style:normal;font-size:13px;color:var(--soft);margin-top:4px}
.bs .press{display:flex;flex-wrap:wrap;gap:10px 22px}.bs .press a{font-family:var(--d);font-size:20px;text-decoration:none;border-bottom:1px solid var(--rule)}
.bs .end{background:var(--brand);color:var(--paper);padding:44px 0 120px;margin-top:20px}
.bs .end h2{color:var(--paper);margin:0 0 14px}
.bs .end dl{display:grid;gap:10px;margin:0 0 20px}.bs .end dt{font-size:12px;opacity:.7}.bs .end dd{margin:0;font-size:15px}
.bs .end .row{display:flex;flex-wrap:wrap;gap:10px}
.bs .end .row a{background:var(--paper);color:var(--brand);padding:11px 18px;border-radius:99px;text-decoration:none;font-weight:600;font-size:14px}
.bs .end .row a.o{background:none;color:var(--paper);border:1px solid currentColor}
.bs .foot{font-size:12px;opacity:.7;margin-top:28px}
.bs .bar{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--paper) 94%,transparent);backdrop-filter:blur(8px);border-top:1px solid var(--rule)}
.bs .bar a{flex:1;text-align:center;padding:11px;border-radius:99px;font-size:14px;font-weight:600;text-decoration:none;background:var(--brand);color:var(--paper)}
.bs .bar a+a{background:none;color:var(--brand);border:1px solid var(--brand)}
@media(min-width:900px){
 .bs .in{padding:0 48px}.bs .nav{display:flex}
 .bs .hero{grid-template-columns:1fr 1.15fr;align-items:end;padding:56px 0 44px;gap:56px}
 .bs h1{font-size:60px}
 .bs .ch{grid-template-columns:200px 1fr;gap:48px;padding:64px 0}
 .bs .ch>.chl{flex-direction:column;gap:2px;position:sticky;top:20px;align-self:start}
 .bs h2{font-size:40px}
 .bs .twocol{display:grid;grid-template-columns:1.3fr 1fr;gap:56px;align-items:start}
 .bs .vals{grid-template-columns:repeat(3,1fr)}
 .bs .proc{grid-template-columns:repeat(4,1fr)}.bs .proc li{grid-template-columns:1fr;align-items:start}.bs .proc img{width:100%;aspect-ratio:4/5}
 .bs .ben{grid-template-columns:repeat(4,1fr);gap:28px}
 .bs .prods{grid-template-columns:repeat(4,1fr);gap:24px}
 .bs .tl{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.bs .tl>div{grid-template-columns:1fr;border-bottom:0;border-top:1px solid var(--ink)}
 .bs .team{grid-template-columns:repeat(4,1fr);gap:24px}
 .bs .gal{grid-template-columns:repeat(4,1fr);gap:12px}
 .bs .rev{grid-template-columns:repeat(3,1fr);gap:36px}
 .bs .bar{display:none}
 .bs .end{padding:64px 0}.bs .end .in{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:end}
}`

const NETS: { key: keyof BrandContent['links']; label: string }[] = [
  { key: 'instagram', label: 'إنستغرام' }, { key: 'tiktok', label: 'تيك توك' }, { key: 'facebook', label: 'فيسبوك' },
  { key: 'snapchat', label: 'سناب شات' }, { key: 'x', label: 'إكس' }, { key: 'youtube', label: 'يوتيوب' },
  { key: 'store', label: 'المتجر' }, { key: 'website', label: 'الموقع' },
]

export default function BrandStoryView({ content: c, colorOverrides, className }: { content: BrandContent; colorOverrides?: Record<string, string>; className?: string }) {
  const p = palette(colorOverrides)
  const vars = {
    '--paper': p.paper, '--ink': p.ink, '--soft': p.soft, '--brand': p.brand, '--sea': p.sea, '--shelf': p.shelf, '--rule': p.rule,
    '--d': `${amiri.style.fontFamily}, serif`, '--r': `${ruqaa.style.fontFamily}, serif`, '--b': `${plex.style.fontFamily}, system-ui, sans-serif`,
  } as React.CSSProperties

  const wa = digits(c.contact.whatsapp)
  const tel = digits(c.contact.phone)
  const action = (() => {
    if (c.buy === 'whatsapp' && wa) return { href: `https://wa.me/${wa.replace('+', '')}`, label: 'اطلب على واتساب', short: 'واتساب', ask: 'اسأل على واتساب' }
    if (c.buy === 'store' && c.links.store) return { href: profileUrl('website', c.links.store)!, label: 'تسوّق الآن', short: 'المتجر', ask: 'اطلبه من المتجر' }
    if (c.buy === 'email' && c.contact.email) return { href: `mailto:${c.contact.email}`, label: 'راسلنا', short: 'راسلنا', ask: 'اسأل عنه' }
    if (tel) return { href: `tel:${tel}`, label: 'اتصل بنا', short: 'اتصل', ask: 'اسأل عنه' }
    if (wa) return { href: `https://wa.me/${wa.replace('+', '')}`, label: 'تواصل على واتساب', short: 'واتساب', ask: 'اسأل على واتساب' }
    return null
  })()
  const social = NETS.map((n) => ({ ...n, href: profileUrl(n.key === 'store' || n.key === 'website' ? 'website' : n.key, c.links[n.key]) })).filter((n) => n.href)
  const second = social.find((n) => n.key !== 'store' || c.buy !== 'store')

  // Chapters that have something in them, numbered in the order they appear.
  const make = c.values.items.length > 0 || c.steps.items.length > 0
  const chapters = [
    c.story.paragraphs.length || c.story.quote ? 'story' : '',
    make ? 'make' : '',
    c.benefits.items.length ? 'benefits' : '',
    c.products.items.length ? 'products' : '',
    c.timeline.items.length ? 'timeline' : '',
  ].filter(Boolean)
  const no = (id: string) => ORD[chapters.indexOf(id)] || ''
  const Label = ({ id, name }: { id: string; name: string }) => (
    <div className="chl"><span>الفصل</span><b>{no(id)}</b><span>{name}</span></div>
  )
  const nav = [
    chapters.includes('story') && { id: 'story', label: 'قصتنا' },
    chapters.includes('make') && { id: 'make', label: 'كيف نصنع' },
    chapters.includes('products') && { id: 'products', label: 'منتجاتنا' },
    { id: 'contact', label: 'تواصل' },
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className={`bs ${className || ''}`} style={vars}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="in">
        <header className="top">
          <a className="logo" href="#top">{c.brand.logo ? <img src={c.brand.logo} alt={c.brand.name} /> : c.brand.name}</a>
          <nav className="nav">{nav.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}</nav>
          {action ? <a className="buy" href={action.href} target="_blank" rel="noopener">{action.label}</a> : <a className="buy" href="#contact">تواصل معنا</a>}
        </header>

        <section className="hero" id="top">
          <div>
            {(c.brand.kind || c.brand.city) && <div className="eb">{[c.brand.kind, c.brand.city].filter(Boolean).join(' · ')}</div>}
            <h1>{c.brand.tagline || c.brand.name}</h1>
            {c.brand.intro && <p>{c.brand.intro}</p>}
          </div>
          {c.hero.photo && <img className="ph" src={c.hero.photo} alt="" />}
        </section>

        {chapters.includes('story') && (
          <section className="ch" id="story">
            <Label id="story" name="البداية" />
            <div className="twocol">
              <div>
                <h2>{c.story.heading}</h2>
                <div className="prose" style={{ marginTop: 18 }}>{c.story.paragraphs.map((t, i) => <p key={i}>{t}</p>)}</div>
              </div>
              {(c.story.photo || c.story.quote) && (
                <div style={{ display: 'grid', gap: 18 }}>
                  {c.story.photo && <img className="stphoto" src={c.story.photo} alt="" />}
                  {c.story.quote && <div><p className="q">«{c.story.quote}»</p>{c.story.signature && <div className="sig">{c.story.signature}{c.story.role && <small>{c.story.role}</small>}</div>}</div>}
                </div>
              )}
            </div>
          </section>
        )}

        {make && (
          <section className="ch" id="make">
            <Label id="make" name="كيف نصنع" />
            <div style={{ display: 'grid', gap: 34 }}>
              <h2>{c.steps.items.length ? c.steps.heading : c.values.heading}</h2>
              {c.values.items.length > 0 && <div className="vals">{c.values.items.map((v, i) => <div key={i}><h3>{v.title}</h3>{v.text && <p>{v.text}</p>}</div>)}</div>}
              {c.steps.items.length > 0 && (
                <ol className="proc">
                  {c.steps.items.map((s, i) => (
                    <li key={i} className={s.photo ? '' : 'np'}>
                      {s.photo && <img src={s.photo} alt="" />}
                      <div><h3><span>{(i + 1).toLocaleString('ar')} · </span>{s.title}</h3>{s.text && <p>{s.text}</p>}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        )}

        {chapters.includes('benefits') && (
          <section className="ch" id="benefits">
            <Label id="benefits" name="فوائده" />
            <div style={{ display: 'grid', gap: 26 }}>
              <h2>{c.benefits.heading}</h2>
              <div className="ben">{c.benefits.items.map((b, i) => <div key={i}><h3>{b.title}</h3>{b.text && <p>{b.text}</p>}</div>)}</div>
            </div>
          </section>
        )}

        {chapters.includes('products') && (
          <section className="ch" id="products">
            <Label id="products" name="ما نصنع" />
            <div style={{ display: 'grid', gap: 26 }}>
              <h2>{c.products.heading}</h2>
              <div className="prods">
                {c.products.items.map((x, i) => (
                  <div key={i}>
                    {x.photo ? <img className="ph" src={x.photo} alt={x.name} /> : <div className="noph">{x.size || x.name}</div>}
                    <h3>{x.name}</h3>
                    {(x.text || x.size) && <p>{[x.text, x.photo ? x.size : ''].filter(Boolean).join(' · ')}</p>}
                    {x.price && <div className="pr">{x.price}</div>}
                    {action && !x.price && <a className="ask" href={action.href} target="_blank" rel="noopener">{action.ask}</a>}
                  </div>
                ))}
              </div>
              {c.products.note && <p className="note">{c.products.note}</p>}
            </div>
          </section>
        )}

        {chapters.includes('timeline') && (
          <section className="ch" id="timeline">
            <Label id="timeline" name="محطاتنا" />
            <div className="tl">{c.timeline.items.map((t, i) => <div key={i}><b>{t.year}</b><span>{t.text}</span></div>)}</div>
          </section>
        )}

        {c.team.items.length > 0 && (
          <section className="ch" id="team">
            <div className="chl"><b>{c.team.heading}</b></div>
            <div className="team">{c.team.items.map((t, i) => (
              <div key={i}>{t.photo ? <img src={t.photo} alt={t.name} /> : <div className="mono">{t.name.trim().charAt(0)}</div>}<b>{t.name}</b>{t.role && <span>{t.role}</span>}</div>
            ))}</div>
          </section>
        )}

        {c.gallery.images.length > 0 && (
          <section className="ch" id="gallery">
            <div className="chl"><b>{c.gallery.heading}</b></div>
            <div className="gal">{c.gallery.images.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />)}</div>
          </section>
        )}

        {c.reviews.items.length > 0 && (
          <section className="ch" id="reviews">
            <div className="chl"><b>{c.reviews.heading}</b></div>
            <div className="rev">{c.reviews.items.map((r, i) => <div key={i}><blockquote>«{r.text}»</blockquote><cite>{[r.name, r.from].filter(Boolean).join(' · ')}</cite></div>)}</div>
          </section>
        )}

        {c.press.items.length > 0 && (
          <section className="ch" id="press">
            <div className="chl"><b>{c.press.heading}</b></div>
            <div className="press">{c.press.items.map((x, i) => <a key={i} href={x.url} target="_blank" rel="noopener">{x.name}</a>)}</div>
          </section>
        )}
      </div>

      <section className="end" id="contact">
        <div className="in">
          <div>
            <h2>{c.contact.heading}</h2>
            <dl>
              {c.contact.address && <><dt>العنوان</dt><dd>{c.contact.address}</dd></>}
              {c.contact.phone && <><dt>الهاتف</dt><dd dir="ltr" style={{ textAlign: 'right' }}>{c.contact.phone}</dd></>}
              {c.contact.whatsapp && c.contact.whatsapp !== c.contact.phone && <><dt>واتساب</dt><dd dir="ltr" style={{ textAlign: 'right' }}>{c.contact.whatsapp}</dd></>}
              {c.contact.email && <><dt>البريد</dt><dd>{c.contact.email}</dd></>}
            </dl>
          </div>
          <div>
            <div className="row">
              {action && <a href={action.href} target="_blank" rel="noopener">{action.label}</a>}
              {social.map((n) => <a key={n.key} className="o" href={n.href} target="_blank" rel="noopener">{n.label}</a>)}
            </div>
            <div className="foot">© {new Date().getFullYear()} {c.brand.name}{c.footer.tagline ? ` · ${c.footer.tagline}` : ''}</div>
          </div>
        </div>
      </section>

      {(action || second) && (
        <nav className="bar">
          {action && <a href={action.href} target="_blank" rel="noopener">{action.short}</a>}
          {second && <a href={second.href} target="_blank" rel="noopener">{second.label}</a>}
        </nav>
      )}
    </div>
  )
}
