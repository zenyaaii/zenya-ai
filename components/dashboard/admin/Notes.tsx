'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * «الملاحظات» — shared notes for the admins, in folders. Anas and Yasin use
 * one login, so each note says who wrote it. Rendered inside LeadStudio's
 * `.ls` root and uses its buttons/inputs; its own rules are scoped `.nt`.
 */
type Folder = { id: string; name: string }
type Note = { id: string; folder_id: string | null; title: string; body: string; author: string | null; pinned: boolean; updated_at: string }
const WHO = ['أنس', 'ياسين']
const api = (method: string, body?: unknown, q = '') =>
  fetch('/api/admin/notes' + q, { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
    .then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => ({})) }))
const day = (iso: string) => new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short' })

export default function Notes({ say }: { say: (m: string) => void }) {
  const [folders, setFolders] = useState<Folder[] | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [fid, setFid] = useState<string>('all')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Note | null>(null)
  const [who, setWho] = useState<string>(() => { try { return localStorage.getItem('nt-who') || WHO[0] } catch { return WHO[0] } })

  const load = useCallback(async () => {
    const { ok, j } = await api('GET')
    if (!ok) { setErr(j.error || 'تعذّر التحميل'); return }
    setFolders(j.folders); setNotes(j.notes); setErr(null)
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { try { localStorage.setItem('nt-who', who) } catch {} }, [who])

  async function addFolder() {
    const name = prompt('اسم المجلد الجديد')?.trim(); if (!name) return
    const { ok, j } = await api('POST', { kind: 'folder', name })
    if (!ok) return say(j.error || 'تعذّر الحفظ')
    setFolders((f) => [...(f ?? []), j.folder]); setFid(j.folder.id)
  }
  async function renameFolder(f: Folder) {
    const name = prompt('اسم المجلد', f.name)?.trim(); if (!name || name === f.name) return
    const { ok, j } = await api('PATCH', { kind: 'folder', id: f.id, name })
    if (!ok) return say(j.error || 'تعذّر الحفظ')
    setFolders((fs) => fs?.map((x) => (x.id === f.id ? j.folder : x)) ?? null)
  }
  async function delFolder(f: Folder) {
    const n = notes.filter((x) => x.folder_id === f.id).length
    if (!confirm(`حذف مجلد «${f.name}»${n ? ` و${n} ملاحظة داخله` : ''}؟`)) return
    const { ok, j } = await api('DELETE', undefined, `?kind=folder&id=${f.id}`)
    if (!ok) return say(j.error || 'تعذّر الحذف')
    setFolders((fs) => fs?.filter((x) => x.id !== f.id) ?? null); setNotes((ns) => ns.filter((x) => x.folder_id !== f.id)); setFid('all')
  }
  async function newNote() {
    const { ok, j } = await api('POST', { kind: 'note', folder_id: fid === 'all' ? null : fid, title: '', body: '', author: who })
    if (!ok) return say(j.error || 'تعذّر الحفظ')
    setNotes((ns) => [j.note, ...ns]); setEdit(j.note)
  }
  async function save(n: Note) {
    const { ok, j } = await api('PATCH', { kind: 'note', id: n.id, title: n.title, body: n.body, author: n.author, pinned: n.pinned, folder_id: n.folder_id })
    if (!ok) { say(j.error || 'تعذّر الحفظ'); return false }
    setNotes((ns) => ns.map((x) => (x.id === n.id ? j.note : x))); return true
  }
  async function delNote(n: Note) {
    if (!confirm('حذف هذه الملاحظة؟')) return
    const { ok, j } = await api('DELETE', undefined, `?kind=note&id=${n.id}`)
    if (!ok) return say(j.error || 'تعذّر الحذف')
    setNotes((ns) => ns.filter((x) => x.id !== n.id)); setEdit(null)
  }

  if (err) return <div className="note">{err}</div>
  if (!folders) return <div className="note">جارٍ التحميل…</div>
  if (edit) return <Editor n={edit} folders={folders} save={save} del={delNote} close={() => { setEdit(null); load() }} />

  const cur = folders.find((f) => f.id === fid)
  const list = notes.filter((n) => (fid === 'all' || n.folder_id === fid) && (!q || `${n.title} ${n.body}`.includes(q)))
  return (
    <div className="nt">
      <div className="chips">
        <button aria-pressed={fid === 'all'} onClick={() => setFid('all')}>كل الملاحظات <span className="num">{notes.length}</span></button>
        {folders.map((f) => (
          <button key={f.id} aria-pressed={fid === f.id} onClick={() => setFid(f.id)}>📁 {f.name} <span className="num">{notes.filter((n) => n.folder_id === f.id).length}</span></button>
        ))}
        <button onClick={addFolder}>+ مجلد</button>
      </div>
      <div className="bar2">
        <button className="btn" onClick={newNote}>+ ملاحظة جديدة{cur ? ` في «${cur.name}»` : ''}</button>
        <span className="who">أكتب باسم:{WHO.map((w) => <button key={w} className="btn sm" aria-pressed={who === w} onClick={() => setWho(w)}>{w}</button>)}</span>
        {cur && <><button className="btn sm ghost" onClick={() => renameFolder(cur)}>إعادة تسمية</button><button className="btn sm ghost" onClick={() => delFolder(cur)}>حذف المجلد</button></>}
      </div>
      <input className="search" placeholder="ابحث في الملاحظات" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="cards">
        {list.map((n) => (
          <button key={n.id} className="card" onClick={() => setEdit(n)}>
            <b>{n.pinned && '📌 '}{n.title || 'بلا عنوان'}</b>
            <span className="pv">{n.body.slice(0, 160) || '…'}</span>
            <span className="mt">{n.author ?? ''}{n.author ? ' · ' : ''}{day(n.updated_at)}{fid === 'all' && n.folder_id ? ` · 📁 ${folders.find((f) => f.id === n.folder_id)?.name ?? ''}` : ''}</span>
          </button>
        ))}
        {list.length === 0 && <div className="empty">لا ملاحظات هنا بعد</div>}
      </div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  )
}

function Editor({ n: init, folders, save, del, close }: {
  n: Note; folders: Folder[]; save: (n: Note) => Promise<boolean>; del: (n: Note) => void; close: () => void
}) {
  const [n, setN] = useState(init)
  const [dirty, setDirty] = useState(false)
  const set = (p: Partial<Note>) => { setN((x) => ({ ...x, ...p })); setDirty(true) }
  // Save a second after typing stops, and on the way out.
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(async () => { if (await save(n)) setDirty(false) }, 1000)
    return () => clearTimeout(t)
  }, [n, dirty, save])
  async function back() { if (dirty && !(await save(n))) return; close() }
  return (
    <div className="nt ed">
      <div className="bar2">
        <button className="btn sm ghost" onClick={back}>→ رجوع</button>
        <span className="st">{dirty ? 'يحفظ…' : 'محفوظ ✓'}</span>
        <span style={{ flex: 1 }} />
        <button className="btn sm" aria-pressed={n.pinned} onClick={() => set({ pinned: !n.pinned })}>📌 تثبيت</button>
        <button className="btn sm ghost" onClick={() => del(n)}>حذف</button>
      </div>
      <input className="ttl" placeholder="العنوان" value={n.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!init.title} />
      <div className="bar2">
        <select value={n.folder_id ?? ''} onChange={(e) => set({ folder_id: e.target.value || null })}>
          <option value="">بلا مجلد</option>
          {folders.map((f) => <option key={f.id} value={f.id}>📁 {f.name}</option>)}
        </select>
        <span className="who">الكاتب:{WHO.map((w) => <button key={w} className="btn sm" aria-pressed={n.author === w} onClick={() => set({ author: w })}>{w}</button>)}</span>
      </div>
      <textarea placeholder="اكتب الملاحظة هنا…" value={n.body} onChange={(e) => set({ body: e.target.value })} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  )
}

const CSS = `
.ls .nt .bar2{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0 10px}
.ls .nt .who{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted)}
.ls .nt .st{font-size:12px;color:var(--muted)}
.ls .nt .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
.ls .nt .card{display:flex;flex-direction:column;gap:6px;text-align:right;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer;color:inherit;font:inherit;min-height:110px}
.ls .nt .card b{font-weight:700}
.ls .nt .card .pv{font-size:13px;color:var(--muted);white-space:pre-line;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;flex:1}
.ls .nt .card .mt{font-size:11.5px;color:var(--muted)}
.ls .nt .ttl{width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;font:inherit;font-size:20px;font-weight:700;padding:8px 2px;color:inherit;outline:none}
.ls .nt select{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:6px 10px;font:inherit;font-size:13px;color:inherit}
.ls .nt textarea{width:100%;min-height:55vh;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:14px;font:inherit;font-size:15px;line-height:1.8;color:inherit;resize:vertical}
`
