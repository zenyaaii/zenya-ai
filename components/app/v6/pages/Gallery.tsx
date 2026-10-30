'use client'

/**
 * GALLERY, as the v6 design draws it (VIEWS.gallery, assetHTML, addFiles,
 * assetSheet): the drop box, a tile per picture, and a sheet with the
 * picture, its facts, a copy-link and a delete.
 *
 * The library is the account's; a picture belongs to a site when that site
 * uses it, so the filter, the tile's site and «مستخدمة في» are read from the
 * sites themselves. A delete waits for the toast's «تراجع» to pass before it
 * reaches the server, so the undo is real.
 */

import { useEffect, useRef, useState } from 'react'
import { Ic, Seg, useV6 } from '../ui'
import { PageHead, at, copy, kbOf } from './kit'

export type V6Asset = {
  id: string
  url: string
  name: string
  bytes: number | null
  /** The sites that use it. */
  sites: string[]
  /** «الصفحة الرئيسية», or «لم تُستخدم بعد». */
  used: string
}

export type V6GalleryProps = {
  assets: V6Asset[]
  sites: { id: string; name: string }[]
  /** Uploads the files and resolves with the ids that arrived. */
  upload: (files: File[]) => Promise<{ added: string[]; failed: string[] }>
  remove: (id: string) => Promise<boolean>
}

const files = (n: number) => (n === 1 ? 'ملف' : n === 2 ? 'ملفان' : n <= 10 ? 'ملفات' : 'ملفًا')

export default function V6Gallery({ assets, sites, upload, remove }: V6GalleryProps) {
  const { toast, openSheet, closeSheet } = useV6()
  const [f, setF] = useState<string>('all')
  const [gone, setGone] = useState<Set<string>>(new Set())
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  // A delete is sent when its undo runs out, or when the page closes.
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const removeRef = useRef(remove)
  removeRef.current = remove
  useEffect(() => () => {
    pending.current.forEach((t, id) => { clearTimeout(t); removeRef.current(id) })
  }, [])

  const all = assets.filter((a) => !gone.has(a.id))
  // A picture just uploaded stays in view until it is placed in a site.
  const list = all.filter((a) => f === 'all' || a.sites.includes(f) || fresh.has(a.id))
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name || ''
  const bytes = list.reduce((s, a) => s + (a.bytes || 0), 0)

  async function add(fl: FileList | File[] | null) {
    const arr = [...(fl || [])].filter((x) => x.type.startsWith('image/')).slice(0, 12)
    if (!arr.length) { toast('اختر صورًا فقط (JPG أو PNG أو WEBP)', { ok: false }); return }
    if (busy) return
    setBusy(true)
    try {
      const r = await upload(arr)
      setFresh(new Set(r.added))
      if (r.failed.length && !r.added.length) toast('تعذّر رفع ' + (r.failed.length === 1 ? r.failed[0] : `${r.failed.length} صور`), { ok: false })
      else if (r.failed.length) toast(`رُفعت ${r.added.length} وتعذّر رفع ${r.failed.length}`, { ok: false })
      else toast(r.added.length === 1 ? 'تم رفع ' + arr[0].name : `تم رفع ${r.added.length} صور`)
    } finally {
      setBusy(false)
    }
  }

  function sheet(a: V6Asset) {
    const ext = (a.name.includes('.') ? a.name.split('.').pop() || '' : a.url.split('?')[0].split('.').pop() || '').toUpperCase().slice(0, 5)
    openSheet({
      title: a.name,
      body: (
        <>
          <div className="lb-img" style={{ background: 'var(--card2)' }}><img src={a.url} alt={a.name} /></div>
          <div className="facts">
            <div><span>الحجم</span><b className="num">{kbOf(a.bytes)}</b></div>
            <div><span>النوع</span><b>{ext || '—'}</b></div>
            <div><span>الموقع</span><b>{a.sites.map(siteName).filter(Boolean).join('، ') || '—'}</b></div>
            <div><span>مستخدمة في</span><b>{a.used}</b></div>
          </div>
        </>
      ),
      foot: (
        <>
          <button className="btn danger press" onClick={() => {
            closeSheet()
            const el = document.querySelector<HTMLElement>(`[data-asset="${a.id}"]`)
            const hide = () => setGone((g) => new Set(g).add(a.id))
            if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
              el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.85)' }], { duration: 320, easing: 'ease-in', fill: 'forwards' }).onfinish = hide
            } else hide()
            pending.current.set(a.id, setTimeout(async () => {
              pending.current.delete(a.id)
              if (!(await removeRef.current(a.id))) {
                setGone((g) => { const n = new Set(g); n.delete(a.id); return n })
                toast('تعذّر حذف ' + a.name, { ok: false })
              }
            }, 5200))
            toast('تم حذف ' + a.name, {
              undo: () => {
                clearTimeout(pending.current.get(a.id))
                pending.current.delete(a.id)
                setGone((g) => { const n = new Set(g); n.delete(a.id); return n })
              },
            })
          }}><Ic n="trash" />احذف</button>
          <button className="btn k press" onClick={() => { closeSheet(); copy(a.url); toast('تم نسخ رابط الصورة') }}><Ic n="link" />انسخ الرابط</button>
        </>
      ),
    })
  }

  return (
    <>
      <PageHead
        title="المعرض"
        sub="كل الصور والملفات التي تستخدمها مواقعك، في مكان واحد."
        acts={<button className="btn k press" onClick={() => input.current?.click()} disabled={busy}><Ic n={busy ? 'refresh' : 'upload'} className={busy ? 'spin' : ''} />{busy ? 'جارٍ الرفع…' : 'ارفع صورًا'}</button>}
      />
      <div className="gal-bar rv" style={at(2)}>
        <div className="seg-scroll">
          <Seg<string>
            items={[['all', 'الكل', all.length], ...sites.map((x): [string, string, number] => [x.id, x.name, all.filter((a) => a.sites.includes(x.id)).length])]}
            value={f} onChange={setF} label="تصفية حسب الموقع"
          />
        </div>
        <div className="row-wrap">
          <span className="pill"><span className="num">{list.length}</span> {files(list.length)}</span>
          <span className="pill"><span className="num">{kbOf(bytes)}</span> مستخدمة</span>
        </div>
      </div>
      <div className="gal" id="gal">
        <button
          className={`drop rv${over ? ' over' : ''}`} style={at(3)} id="drop" disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }}
        >
          <Ic n="upload" /><span>اسحب الصور إلى هنا<br />أو اضغط للاختيار</span>
        </button>
        {list.map((a, i) => (
          <button key={a.id} className={`ga rv${fresh.has(a.id) ? ' new-in' : ''}`} style={at(Math.min(4 + i, 14))} data-asset={a.id} aria-label={a.name} onClick={() => sheet(a)}>
            <span className="im"><img src={a.url} alt="" loading="lazy" /></span>
            <span className="cap"><b>{a.name}</b><span><em>{a.sites.length ? siteName(a.sites[0]) : 'لم تُستخدم بعد'}</em><span className="num">{kbOf(a.bytes)}</span></span></span>
          </button>
        ))}
      </div>
      {!list.length && (
        <div className="empty"><Ic n="gallery" /><b>لا صور لهذا الموقع بعد</b><span>ارفع صورك الأولى من الزر في الأعلى.</span></div>
      )}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />
    </>
  )
}
