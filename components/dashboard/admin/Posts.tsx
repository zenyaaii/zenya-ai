'use client'

import { useState } from 'react'
import { SOCIAL_SETS, type SocialPost } from '@/lib/social-posts'

/**
 * «المنشورات» — every approved social post with its files to download (post
 * for Instagram/Facebook, story for TikTok), its caption to copy, and why it
 * was written. Rendered inside LeadStudio's `.ls` root; rules scoped `.sp2`.
 * Data is static (lib/social-posts.ts + public/social/<set>/).
 */
const when = (iso: string) => new Date(iso).toLocaleString('ar', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Riyadh' })
const live = (iso: string) => Date.now() >= new Date(iso).getTime()
const DL = <svg viewBox="0 0 24 24" aria-hidden><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" /></svg>

export default function Posts({ layout = 'grid', say }: { layout?: 'days' | 'grid'; say?: (m: string) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const [why, setWhy] = useState<number | null>(null)
  const copy = (p: SocialPost) => navigator.clipboard?.writeText(p.caption).then(() => say?.('نُسخ النص'), () => say?.('تعذّر النسخ'))

  const Actions = ({ p }: { p: SocialPost }) => (
    <div className="acts">
      <a className="btn sm" href={p.post} download={`beynoun-${p.n}-post.jpg`}>{DL}المنشور</a>
      <a className="btn sm ghost" href={p.story} download={`beynoun-${p.n}-story.jpg`}>{DL}القصص</a>
      <button className="btn sm ghost" onClick={() => copy(p)}>نسخ النص</button>
    </div>
  )
  const Why = ({ p }: { p: SocialPost }) => (
    <dl className="why">
      <dt>الهدف</dt><dd>{p.goal}</dd><dt>لمن</dt><dd>{p.who}</dd><dt>الألم</dt><dd>{p.pain}</dd><dt>إعلان ممول؟</dt><dd>{p.boost}</dd>
    </dl>
  )
  const Status = ({ p }: { p: SocialPost }) => <span className={`st ${live(p.date) ? 'on' : ''}`}>{live(p.date) ? 'نُشر' : 'مجدول'}</span>

  return (
    <div className={`sp2 ${layout}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {SOCIAL_SETS.map((s) => (
        <section key={s.id} className="set">
          <div className="sh">
            <div><h2>{s.title}</h2><p className="lead">{s.note}</p></div>
            {s.zip && <a className="btn sm" href={s.zip} download>{DL}تحميل الكل</a>}
          </div>
          {layout === 'days' ? (
            <ol className="rows">{s.posts.map((p) => (
              <li key={p.n} className="row">
                <img className="th" src={p.post} alt={p.onImage} loading="lazy" />
                <div className="bd">
                  <div className="hd"><b>{p.n}. {p.title}</b><Status p={p} /></div>
                  <p className="mt">{when(p.date)} · فيسبوك وانستغرام</p>
                  <p className="cap">{p.caption}</p>
                  <Actions p={p} />
                  <button className="more" aria-expanded={why === p.n} onClick={() => setWhy(why === p.n ? null : p.n)}>{why === p.n ? 'إخفاء السبب' : 'لماذا هذا المنشور؟'}</button>
                  {why === p.n && <Why p={p} />}
                </div>
              </li>
            ))}</ol>
          ) : (
            <>
              <div className="g3">{s.posts.map((p) => (
                <button key={p.n} className="tile" aria-pressed={open === p.n} onClick={() => setOpen(open === p.n ? null : p.n)}>
                  <img src={p.post} alt={p.onImage} loading="lazy" /><Status p={p} />
                </button>
              ))}</div>
              {s.posts.filter((p) => p.n === open).map((p) => (
                <div key={p.n} className="sheet">
                  <div className="hd"><b>{p.n}. {p.title}</b><Status p={p} /></div>
                  <p className="mt">{when(p.date)} · فيسبوك وانستغرام</p>
                  <p className="cap">{p.caption}</p>
                  <Actions p={p} />
                  <Why p={p} />
                </div>
              ))}
            </>
          )}
        </section>
      ))}
    </div>
  )
}

const CSS = `
.sp2{display:grid;gap:18px}
.sp2 .set{display:grid;gap:12px}
.sp2 .sh{display:flex;align-items:flex-start;gap:10px;justify-content:space-between}
.sp2 h2{font-size:16px;font-weight:700;margin:0}
.sp2 .lead{margin:2px 0 0;color:var(--muted);font-size:13px}
.sp2 .btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;margin-inline-end:4px;vertical-align:-3px}
.sp2 a.btn{text-decoration:none;white-space:nowrap}
.sp2 .hd{display:flex;align-items:center;gap:8px}.sp2 .hd b{flex:1;min-width:0;font-size:14px}
.sp2 .st{font-size:11px;font-weight:700;border-radius:99px;padding:1px 8px;background:var(--sunk);color:var(--muted);white-space:nowrap}
.sp2 .st.on{color:var(--wa);background:var(--wa-bg)}
.sp2 .mt{margin:0;font-size:12px;color:var(--muted)}
.sp2 .cap{margin:0;font-size:13px;line-height:1.7;white-space:pre-line;background:var(--sunk);border-radius:10px;padding:8px 10px}
.sp2 .acts{display:flex;flex-wrap:wrap;gap:6px}
.sp2 .more{justify-self:start;border:0;background:none;padding:0;font:inherit;font-size:12.5px;color:var(--acc);text-decoration:underline;cursor:pointer}
.sp2 .why{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:4px 12px;margin:0;font-size:12.5px;line-height:1.6}
.sp2 .why dt{color:var(--muted);font-weight:700}.sp2 .why dd{margin:0}
.sp2 .rows{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.sp2 .row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px}
.sp2 .th{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;display:block}
.sp2 .bd{display:grid;gap:7px;align-content:start;min-width:0}
.sp2 .g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;max-width:520px}
.sp2 .tile{position:relative;border:0;padding:0;background:none;cursor:pointer;display:block}
.sp2 .tile img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
.sp2 .tile .st{position:absolute;top:6px;inset-inline-start:6px}
.sp2 .tile[aria-pressed=true]{outline:3px solid var(--acc);outline-offset:-3px}
.sp2 .sheet{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px;display:grid;gap:8px;max-width:520px}
@media(max-width:520px){.sp2 .row{grid-template-columns:88px minmax(0,1fr)}.sp2 .why{grid-template-columns:1fr}.sp2 .sh{flex-direction:column}}
`
