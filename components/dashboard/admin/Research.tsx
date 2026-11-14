'use client'

import { useMemo, useState } from 'react'
import { GROUPS, RESEARCH_FILES, dateOf, formOf, sizeOf, sortKey, subTitle, titleOf, type ResearchFile } from '@/lib/research'

/**
 * «البحوث» — every research file the content agent produced, sorted: reports,
 * plans, one folder per niche, market data by type, the agent's code. Each
 * file opens or downloads; each folder and the whole set download as a zip.
 * Files are served admin-only by /api/admin/research (content/research/).
 * Rendered inside LeadStudio's `.ls` root; rules scoped `.rs`.
 */
const fileUrl = (f: ResearchFile, view = false) => `/api/admin/research/file?p=${encodeURIComponent(f.p)}${view ? '&view=1' : ''}`
const zipUrl = (g: string) => `/api/admin/research/zip?g=${encodeURIComponent(g)}`
const DL = <svg viewBox="0 0 24 24" aria-hidden><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" /></svg>
const n = (x: number) => x.toLocaleString('ar')
const total = (fs: ResearchFile[]) => sizeOf(fs.reduce((s, f) => s + f.size, 0))
const latest = (fs: ResearchFile[]) => fs.map((f) => f.date).sort().pop() ?? ''

type Folder = { id: string; t: string; files: ResearchFile[] }
function foldersOf(group: string, files: ResearchFile[]): Folder[] {
  const m = new Map<string, ResearchFile[]>()
  for (const f of files) if (f.sub) m.set(f.sub, [...(m.get(f.sub) ?? []), f])
  return [...m.entries()]
    .map(([sub, fs]) => ({ id: `${group}/${sub}`, t: subTitle(group, sub), files: fs.sort((a, b) => sortKey(a) - sortKey(b) || b.date.localeCompare(a.date) || a.name.localeCompare(b.name)) }))
    // the niche with a full report first, then by how much there is
    .sort((a, b) => Number(b.files.some((f) => f.kind === 'report')) - Number(a.files.some((f) => f.kind === 'report')) || b.files.length - a.files.length || a.t.localeCompare(b.t, 'ar'))
}

function Row({ f, flat }: { f: ResearchFile; flat?: boolean }) {
  const canView = f.ext !== 'json' || f.size < 400_000
  return (
    <li className={`rf ${flat ? 'flat' : ''}`}>
      <span className={`fm f-${f.ext}`}>{formOf(f)}</span>
      <div className="rt">
        <b>{titleOf(f)}</b>
        <span className="mt">{[dateOf(f.date), sizeOf(f.size)].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="ra">
        {canView && <a className="btn sm ghost" href={fileUrl(f, true)} target="_blank" rel="noreferrer">فتح</a>}
        <a className="btn sm ghost ic" href={fileUrl(f)} download={f.name} aria-label={`تحميل ${titleOf(f)}`}>{DL}</a>
      </div>
    </li>
  )
}

const Zip = ({ g, label = 'تحميل المجلد' }: { g: string; label?: string }) => <a className="btn sm" href={zipUrl(g)} download>{DL}{label}</a>

export default function Research({ layout = 'cards' }: { layout?: 'list' | 'cards' }) {
  const [q, setQ] = useState('')
  const [view, setView] = useState('1-reports')
  const [open, setOpen] = useState<string | null>(null)
  const files = useMemo(() => {
    const s = q.trim()
    return s ? RESEARCH_FILES.filter((f) => `${titleOf(f)} ${f.sub ? subTitle(f.group, f.sub) : ''} ${f.name}`.includes(s)) : RESEARCH_FILES
  }, [q])
  const groups = Object.keys(GROUPS).map((g) => ({ g, ...GROUPS[g], files: files.filter((f) => f.group === g) })).filter((x) => x.files.length)

  const head = (
    <div className="rh">
      <div>
        <h2>البحوث</h2>
        <p className="lead">{n(RESEARCH_FILES.length)} ملفًا · {total(RESEARCH_FILES)} · آخر تحديث {dateOf(latest(RESEARCH_FILES))}</p>
      </div>
      <Zip g="all" label="تحميل الكل" />
    </div>
  )
  const search = <input className="search" type="search" placeholder="ابحث: حلاق، تيك توك، تقييمات…" value={q} onChange={(e) => setQ(e.target.value)} />

  const FolderBody = ({ fo }: { fo: Folder }) => (
    <div className="fb">
      <ul className="rows">{fo.files.map((f) => <Row key={f.p} f={f} flat />)}</ul>
      <Zip g={fo.id} label={`تحميل «${fo.t}»`} />
    </div>
  )

  if (layout === 'cards') {
    const cur = groups.find((x) => x.g === view) ?? groups[0]
    const folders = cur ? foldersOf(cur.g, cur.files) : []
    return (
      <div className="rs cards">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {head}{search}
        <div className="chips" role="tablist">
          {groups.map((x) => (
            <button key={x.g} aria-pressed={cur?.g === x.g} onClick={() => { setView(x.g); setOpen(null) }}>{x.t} <span className="num">{n(x.files.length)}</span></button>
          ))}
        </div>
        {cur && (
          <section className="grp">
            <div className="gh"><p className="lead">{cur.note}</p><Zip g={cur.g} label="تحميل القسم" /></div>
            {folders.length ? (
              <>
                <div className="cg">{folders.map((fo) => {
                  const kinds = [...new Set(fo.files.map((f) => f.kind))]
                  return (
                    <button key={fo.id} className="card" aria-pressed={open === fo.id} onClick={() => setOpen(open === fo.id ? null : fo.id)}>
                      <b>{fo.t}</b>
                      <span className="mt">{n(fo.files.length)} ملفات · {dateOf(latest(fo.files))}</span>
                      {fo.files.some((f) => f.kind === 'report') ? <span className="tag on">تقرير كامل</span> : <span className="tag">{kinds.length} أنواع بيانات</span>}
                    </button>
                  )
                })}</div>
                {folders.filter((fo) => fo.id === open).map((fo) => (
                  <div key={fo.id} className="sheet"><div className="hd"><b>{fo.t}</b><button className="btn sm ghost" onClick={() => setOpen(null)}>إغلاق</button></div><FolderBody fo={fo} /></div>
                ))}
              </>
            ) : <ul className="rows">{cur.files.map((f) => <Row key={f.p} f={f} />)}</ul>}
          </section>
        )}
        {!groups.length && <div className="note">لا يوجد ملف بهذا الاسم.</div>}
      </div>
    )
  }

  return (
    <div className="rs list">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {head}{search}
      {groups.map((x) => {
        const folders = foldersOf(x.g, x.files)
        return (
          <section key={x.g} className="grp">
            <div className="gh">
              <div><h3>{x.t} <span className="cnt num">{n(x.files.length)}</span></h3><p className="lead">{x.note}</p></div>
              <Zip g={x.g} label="تحميل القسم" />
            </div>
            {folders.length ? (
              <div className="fl">{folders.map((fo) => (
                <details key={fo.id} open={!!q.trim()}>
                  <summary>
                    <b>{fo.t}</b>
                    {fo.files.some((f) => f.kind === 'report') && <span className="tag on">تقرير كامل</span>}
                    <span className="mt">{n(fo.files.length)} ملفات · {dateOf(latest(fo.files))}</span>
                  </summary>
                  <FolderBody fo={fo} />
                </details>
              ))}</div>
            ) : <ul className="rows">{x.files.map((f) => <Row key={f.p} f={f} />)}</ul>}
          </section>
        )
      })}
      {!groups.length && <div className="note">لا يوجد ملف بهذا الاسم.</div>}
    </div>
  )
}

const CSS = `
.rs{display:grid;gap:14px;max-width:860px}
.rs .rh{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.rs h2{font-size:16px;font-weight:700;margin:0}
.rs h3{font-size:14.5px;font-weight:700;margin:0;display:flex;align-items:center;gap:6px}
.rs .lead{margin:2px 0 0;color:var(--muted);font-size:12.5px;line-height:1.6}
.rs .search{margin:0}
.rs .chips{margin:0}
.rs .chips .num{opacity:.6;margin-inline-start:2px}
.rs .btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;margin-inline-end:2px}
.rs .btn.ic svg{margin:0}
.rs a.btn{text-decoration:none;color:inherit}
.rs .grp{display:grid;gap:8px}
.rs .gh{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.rs .cnt{font-size:11.5px;font-weight:700;color:var(--muted);background:var(--sunk);border-radius:99px;padding:1px 8px}
.rs .rows{list-style:none;margin:0;padding:0;display:grid;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.rs .rf{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid var(--line)}
.rs .rf:first-child{border-top:0}
.rs .rt{flex:1;min-width:0;display:grid;gap:1px}
.rs .rt b{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rs .mt{font-size:11.5px;color:var(--muted)}
.rs .ra{display:flex;gap:5px;flex:none}
.rs .fm{flex:none;font-size:10.5px;font-weight:700;border-radius:6px;padding:2px 7px;background:var(--sunk);color:var(--muted);min-width:46px;text-align:center}
.rs .fm.f-md,.rs .fm.f-html{color:var(--acc);background:var(--warn-bg)}
.rs .tag{font-size:11px;font-weight:700;border-radius:99px;padding:1px 8px;background:var(--sunk);color:var(--muted);white-space:nowrap}
.rs .tag.on{color:var(--wa);background:var(--wa-bg)}
.rs .fl{display:grid;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.rs details{border-top:1px solid var(--line)}.rs details:first-child{border-top:0}
.rs summary{display:flex;align-items:center;gap:8px;padding:11px 12px;cursor:pointer;list-style:none}
.rs summary::-webkit-details-marker{display:none}
.rs summary::after{content:'';width:7px;height:7px;border-inline-end:1.8px solid var(--muted);border-bottom:1.8px solid var(--muted);transform:rotate(45deg);margin-inline-start:4px;transition:transform .15s}
.rs details[open] summary::after{transform:rotate(-135deg)}
.rs summary b{font-size:13.5px}
.rs summary .mt{margin-inline-start:auto}
.rs .fb{display:grid;gap:8px;padding:0 12px 12px}
.rs .fb .rows{background:var(--sunk);border:0}
.rs .fb .rf{border-color:var(--line)}
.rs .fb>.btn{justify-self:start}
.rs .cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.rs .card{display:grid;gap:4px;justify-items:start;text-align:start;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px;font:inherit;color:inherit;cursor:pointer}
.rs .card b{font-size:14px}
.rs .card[aria-pressed=true]{outline:2px solid var(--acc);outline-offset:-2px}
.rs .sheet{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 0 0;display:grid;gap:8px}
.rs .sheet .hd{display:flex;align-items:center;justify-content:space-between;padding:0 12px}
@media(max-width:560px){
 .rs .rh,.rs .gh{flex-direction:column}
 .rs .cg{grid-template-columns:repeat(2,minmax(0,1fr))}
 .rs .fm{min-width:0}
 .rs summary{flex-wrap:wrap}
}
`
