'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * «الهوية» — every design Anas has approved (colours, fonts, logo, posts…),
 * kept in one place with its files to download. Rendered inside LeadStudio's
 * `.ls` root; its own rules are scoped `.bl`.
 *
 * Data: GET /api/admin/brand → { items } (Supabase table brand_assets; files in
 * the private storage bucket brand-library, served as short signed links).
 */
export type BrandFile = { name: string; url: string; size?: number }
export type BrandItem = {
  id: string; title: string; category: string; note?: string | null
  approved_at: string; approved_by?: string | null; preview_url?: string | null
  swatches?: string[] | null; files: BrandFile[]
}
export const CATS: [string, string][] = [
  ['colours', 'الألوان'], ['fonts', 'الخطوط'], ['logo', 'الشعار'], ['social', 'حسابات التواصل'], ['posts', 'المنشورات'], ['site', 'الموقع'],
]
const day = (iso: string) => new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
const size = (n?: number) => !n ? '' : n > 1e6 ? `${(n / 1e6).toFixed(1)} م.ب` : `${Math.max(1, Math.round(n / 1e3))} ك.ب`
const ext = (n: string) => (n.split('.').pop() || '').toUpperCase()

const WHO = ['أنس', 'ياسين']
const api = (body: unknown) => fetch('/api/admin/brand', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) }))

export default function BrandLibrary({ initial, layout = 'timeline', say }: { initial?: BrandItem[]; layout?: 'shelf' | 'timeline'; say?: (m: string) => void }) {
  const [items, setItems] = useState<BrandItem[] | null>(initial ?? null)
  const [err, setErr] = useState<string | null>(null)
  const [cat, setCat] = useState('all')
  const [adding, setAdding] = useState(false)
  const load = () => fetch('/api/admin/brand', { cache: 'no-store' }).then(async (r) => {
    const j = await r.json().catch(() => ({}))
    if (!r.ok) setErr(j.error || 'تعذّر التحميل'); else { setItems(j.items); setErr(null) }
  })
  useEffect(() => { if (!initial) load() }, [initial]) // eslint-disable-line react-hooks/exhaustive-deps
  async function remove(i: BrandItem) {
    if (!confirm(`حذف «${i.title}» وملفاته؟`)) return
    const r = await fetch('/api/admin/brand?id=' + encodeURIComponent(i.id), { method: 'DELETE' })
    if (!r.ok) return say?.('تعذّر الحذف')
    setItems((x) => (x ?? []).filter((y) => y.id !== i.id))
  }
  const shown = useMemo(() => (items ?? []).filter((i) => cat === 'all' || i.category === cat)
    .sort((a, b) => b.approved_at.localeCompare(a.approved_at)), [items, cat])

  if (err) return <div className="note">{err}</div>
  if (!items) return <div className="note">جارٍ التحميل…</div>
  const count = (c: string) => items.filter((i) => i.category === c).length

  const Card = ({ i }: { i: BrandItem }) => (
    <article className="card">
      {i.preview_url ? <a className="pv" href={i.preview_url} target="_blank" rel="noreferrer"><img src={i.preview_url} alt="" loading="lazy" /></a>
        : i.swatches?.length ? <div className="pv sw">{i.swatches.map((c) => <i key={c} style={{ background: c }} />)}</div> : null}
      <div className="bd">
        <div className="hd"><b>{i.title}</b><span className="ok">موافَق عليه</span></div>
        {i.note && <p className="nt2">{i.note}</p>}
        <p className="mt">{day(i.approved_at)}{i.approved_by ? ` · ${i.approved_by}` : ''}{!initial && <button className="del" onClick={() => remove(i)}>حذف</button>}</p>
        <div className="files">
          {i.files.map((f) => (
            <a key={f.url} className="file" href={f.url} download={f.name}>
              <span className="x">{ext(f.name)}</span><span className="fn ltr">{f.name}</span><span className="sz">{size(f.size)}</span>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" /></svg>
            </a>
          ))}
        </div>
      </div>
    </article>
  )

  return (
    <div className={`bl ${layout}`}>
      <style dangerouslySetInnerHTML={{ __html: BL_CSS }} />
      <div className="bar2"><p className="lead">كل تصميم وافقتم عليه يُحفظ هنا مع ملفاته. اضغط على الملف لتنزيله مباشرة.</p>
        {!initial && <button className="btn sm" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>{adding ? 'إغلاق' : '+ أضف'}</button>}</div>
      {adding && <AddForm onDone={() => { setAdding(false); load() }} say={say} />}
      <div className="chips" role="group" aria-label="القسم">
        <button className="btn sm" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>الكل <span className="num">{items.length}</span></button>
        {CATS.filter(([c]) => count(c)).map(([c, t]) => (
          <button key={c} className="btn sm" aria-pressed={cat === c} onClick={() => setCat(c)}>{t} <span className="num">{count(c)}</span></button>
        ))}
      </div>
      {layout === 'shelf' ? (
        CATS.filter(([c]) => shown.some((i) => i.category === c)).map(([c, t]) => (
          <section key={c} className="shelf">
            <h2>{t}</h2>
            <div className="grid">{shown.filter((i) => i.category === c).map((i) => <Card key={i.id} i={i} />)}</div>
          </section>
        ))
      ) : (
        <ol className="tl">{shown.map((i) => (
          <li key={i.id}><span className="dot" /><span className="cat">{CATS.find(([c]) => c === i.category)?.[1]}</span><Card i={i} /></li>
        ))}</ol>
      )}
      {!shown.length && <div className="empty">لا شيء هنا بعد.</div>}
    </div>
  )
}

function AddForm({ onDone, say }: { onDone: () => void; say?: (m: string) => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATS[0][0])
  const [note, setNote] = useState('')
  const [who, setWho] = useState(WHO[0])
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  async function save() {
    if (!title.trim() || !files.length) return say?.('اكتب عنوانًا واختر ملفًا')
    setBusy('أجهّز الرفع…')
    const sign = await api({ action: 'sign', files: files.map((f) => ({ name: f.name })) })
    if (!sign.ok) { setBusy(null); return say?.(sign.j.error || 'تعذّر الرفع') }
    const done: { name: string; path: string; size: number; type: string }[] = []
    for (let k = 0; k < files.length; k++) {
      const f = files[k], u = sign.j.uploads[k]
      setBusy(`أرفع ${k + 1} من ${files.length}…`)
      const r = await fetch(u.signedUrl, { method: 'PUT', headers: { 'Content-Type': f.type || 'application/octet-stream', 'x-upsert': 'false' }, body: f })
      if (!r.ok) { setBusy(null); return say?.(`تعذّر رفع ${f.name}`) }
      done.push({ name: f.name, path: u.path, size: f.size, type: f.type })
    }
    const c = await api({ action: 'create', title, category, note, approved_by: who, files: done })
    setBusy(null)
    if (!c.ok) return say?.(c.j.error || 'تعذّر الحفظ')
    say?.('أُضيف إلى الهوية'); onDone()
  }
  return (
    <div className="add">
      <input placeholder="العنوان، مثل: لون الشتاء" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="row">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>{CATS.map(([c, t]) => <option key={c} value={c}>{t}</option>)}</select>
        <select value={who} onChange={(e) => setWho(e.target.value)}>{WHO.map((w) => <option key={w}>{w}</option>)}</select>
      </div>
      <textarea rows={2} placeholder="ملاحظة قصيرة (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} />
      <input type="file" multiple onChange={(e) => setFiles([...(e.target.files ?? [])])} />
      <button className="btn" disabled={!!busy} onClick={save}>{busy ?? 'احفظ في الهوية'}</button>
    </div>
  )
}

const BL_CSS = `
.bl .bar2{display:flex;align-items:center;gap:10px}.bl .bar2 .lead{flex:1}
.bl .add{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px;display:grid;gap:8px}
.bl .add .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.bl .add input,.bl .add select,.bl .add textarea{font:inherit;font-size:13px;border:1px solid var(--line);border-radius:9px;padding:7px 10px;background:var(--sunk);color:inherit;min-width:0;width:100%}
.bl .del{border:0;background:none;color:var(--muted);font-size:11.5px;margin-inline-start:10px;padding:0;text-decoration:underline}
.bl{display:grid;gap:14px}
.bl .lead{margin:0;color:var(--muted);font-size:13px}
.bl .chips{display:flex;flex-wrap:wrap;gap:6px}
.bl .chips .num{opacity:.6;margin-inline-start:2px}
.bl h2{font-size:15px;margin:6px 0 8px;font-weight:700}
.bl .grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.bl .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:grid;grid-template-rows:auto 1fr;min-width:0}
.bl .pv{display:block;aspect-ratio:16/10;background:var(--sunk);overflow:hidden;border-bottom:1px solid var(--line)}
.bl .pv img{width:100%;height:100%;object-fit:cover;display:block}
.bl .pv.sw{display:flex}.bl .pv.sw i{flex:1}
.bl .bd{padding:10px 12px 12px;display:grid;gap:6px;align-content:start;min-width:0}
.bl .hd{display:flex;align-items:center;gap:8px}
.bl .hd b{flex:1;min-width:0;font-size:14px}
.bl .ok{font-size:11px;font-weight:700;color:var(--wa);background:var(--wa-bg);border-radius:99px;padding:1px 8px;white-space:nowrap}
.bl .nt2{margin:0;font-size:12.5px;color:var(--ink);opacity:.85}
.bl .mt{margin:0;font-size:11.5px;color:var(--muted)}
.bl .files{display:grid;gap:4px;margin-top:2px}
.bl .file{display:flex;align-items:center;gap:8px;background:var(--sunk);border-radius:9px;padding:6px 8px;font-size:12.5px;text-decoration:none;color:inherit;min-width:0}
.bl .file:hover{outline:1px solid var(--line)}
.bl .file .x{font-size:10px;font-weight:700;border-radius:5px;padding:1px 5px;background:var(--surface);border:1px solid var(--line);flex:none}
.bl .file .fn{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
.bl .file .sz{color:var(--muted);font-size:11px;flex:none}
.bl .file svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.bl.timeline .tl{list-style:none;margin:0;padding:0;display:grid;gap:12px;position:relative}
.bl.timeline .tl::before{content:"";position:absolute;inset-block:6px;inset-inline-start:6px;width:2px;background:var(--line)}
.bl.timeline .tl li{position:relative;padding-inline-start:24px;display:grid;gap:4px}
.bl.timeline .tl .dot{position:absolute;inset-inline-start:1px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 3px var(--surface)}
.bl.timeline .tl .cat{font-size:11.5px;color:var(--muted);font-weight:700}
@media(min-width:760px){.bl.timeline .card{grid-template-columns:240px minmax(0,1fr);grid-template-rows:none}.bl.timeline .pv{aspect-ratio:auto;height:100%;min-height:150px;border-bottom:0;border-inline-end:1px solid var(--line)}}
`
