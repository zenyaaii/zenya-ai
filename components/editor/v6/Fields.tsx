'use client'

/**
 * The fields, as the editor sample draws them (panel.js fieldHTML): one
 * .fld per field, the label and its count on top, the input, then the hint
 * and «اقترح صياغة» under it. What a field is comes from the template's
 * EditorConfig; how it looks is the sample's, class for class.
 */

import { useLayoutEffect, useRef, useState } from 'react'
import type { EditorConfig, EditorFieldDef } from '@/utils/theme-editor-types'
import { Ic, Seg, autosize, fineMouse } from './ui'
import { useEd } from './ctx'
import {
  gp, join, len, plural, itemFields, itemTitle, itemName, hasPath, socialURL, telOK, mailOK, urlOK,
} from './model'

export const fid = (p: string) => 'f_' + String(p).replace(/[^\w]/g, '_')

const TIMES = (() => {
  const o: string[] = []
  for (let m = 6 * 60; m <= 27 * 60; m += 30) {
    const h24 = Math.floor(m / 60) % 24, mm = m % 60, pm = h24 >= 12
    let h = h24 % 12
    if (h === 0) h = 12
    o.push(`${h}:${String(mm).padStart(2, '0')} ${pm ? 'م' : 'ص'}`)
  }
  return o
})()

export function Fields({ fields, base }: { fields: EditorFieldDef[]; base: string }) {
  return (
    <div className="stack">
      {fields.map((d, i) => <Field key={i + (hasPath(d) ? d.path : d.type)} d={d} base={base} />)}
    </div>
  )
}

function Count({ max, val }: { max?: number; val: any }) {
  if (!max) return null
  const n = len(val)
  return <span className={'cnt' + (n > max ? ' over' : n >= max * 0.9 ? ' near' : '')}>{n}/{max}</span>
}

/** The line under a field. It turns into the error while the value is wrong. */
function Hint({ text, err }: { text?: string; err?: string | null }) {
  return <span className={'hint' + (err ? ' e' : '')}>{err || text || ''}</span>
}

function Field({ d, base }: { d: EditorFieldDef; base: string }) {
  const ed = useEd()
  const c = ed.doc.content
  if (d.type === 'group') return <div className="gh">{d.label}</div>
  if (d.type === 'note') {
    return (
      <div className={'note' + (d.tone === 'link' ? ' link' : '')}>
        <Ic n="info" />
        <span>{d.content}{d.go ? <> <button type="button" onClick={() => ed.openAt(d.go!, null, { anim: 'f', scroll: true, focus: false })}>افتحه</button></> : null}</span>
      </div>
    )
  }
  if (d.type === 'logo') return <LogoCard />
  if (d.type === 'reviews') return <ReviewsCard path={d.path} />
  if (d.type === 'snippet') return <Snippet d={d} />
  if ((d as any).when && !(d as any).when(c)) return null
  if (!hasPath(d)) return null
  const path = join(base, d.path)
  const val = gp(c, path)
  switch (d.type) {
    case 'text':
    case 'textarea':
      return <TextField d={d} path={path} val={val} />
    case 'price': return <PriceField d={d} path={path} val={val} />
    case 'badge': return <BadgeField d={d} path={path} val={val} />
    case 'tel':
    case 'email':
    case 'url':
    case 'social':
      return <AffixField d={d} path={path} val={val} />
    case 'image': return <ImageField d={d} path={path} val={val} />
    case 'choice': return <ChoiceField d={d} path={path} val={val} />
    case 'toggle': return <ToggleField d={d} path={path} val={val} />
    case 'stars': return <StarsField d={d} path={path} val={val} />
    case 'rating': return <RatingField label={d.label} hint={d.hint ?? 'من 5. يظهر بالنجوم فوق الآراء.'} path={path} val={val} min={0} max={5} step={0.1} />
    case 'number': return <RatingField label={d.label} hint={d.hint} path={path} val={val} min={d.min ?? 0} max={d.max ?? 9999} step={d.step ?? 1} />
    case 'hours': return <HoursField path={path} />
    case 'array':
    case 'strings':
      return <ListField d={d} path={path} />
  }
  return null
}

/* ── text ──────────────────────────────────────────────────────────────── */
function TextField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'text' | 'textarea' }>; path: string; val: any }) {
  const ed = useEd()
  const ref = useRef<HTMLTextAreaElement>(null)
  const id = fid(path)
  const v = val == null ? '' : String(val)
  useLayoutEffect(() => { autosize(ref.current) }, [v])
  // A template whose config marks the fields worth rewording offers it there;
  // one that marks none offers it on its longer texts.
  const sug = d.suggest ?? (d.type === 'textarea' && !ed.suggestMarked)
  const onChange = (x: string) => ed.setC(path, d.type === 'text' ? x.replace(/\n/g, ' ') : x, { src: 'panel' })
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top"><label htmlFor={id}>{d.label}</label><Count max={d.max} val={v} /></div>
      {d.type === 'textarea'
        ? <textarea ref={ref} className="inp" id={id} rows={d.rows || 2} data-p={path} value={v} placeholder={d.placeholder} onChange={(e) => { onChange(e.target.value); autosize(e.target) }} />
        : <input className="inp" id={id} type="text" data-p={path} value={v} placeholder={d.placeholder} autoComplete="off" onChange={(e) => onChange(e.target.value)} />}
      {(d.hint || sug) && (
        <div className="fl-bot">
          <Hint text={d.hint} />
          {sug && !ed.offline && (
            <button type="button" className="sug" aria-haspopup="true" aria-expanded="false" onClick={(e) => ed.suggest(e.currentTarget, path, d.label)}>
              <Ic n="sparkle" />اقترح صياغة
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PriceField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'price' }>; path: string; val: any }) {
  const ed = useEd()
  const id = fid(path)
  const sym = ed.currency
  const words = `اكتب الرقم فقط، ونضيف العملة (${sym}) تلقائيًا.`
  return (
    <div className="fld price" data-fk={path}>
      <div className="fl-top"><label htmlFor={id}>{d.label}</label></div>
      <div className="affix">
        <span className="pre"><Ic n="money" /></span>
        <input
          id={id} type="text" inputMode="decimal" data-p={path} value={val ?? ''} placeholder={sym + '0'} autoComplete="off"
          onChange={(e) => ed.setC(path, e.target.value, { src: 'panel' })}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (/^\d+([.,]\d+)?$/.test(v)) ed.setC(path, sym + v.replace(',', '.'), { key: 'f:' + path })
          }}
        />
      </div>
      <div className="fl-bot"><span className="hint">{words}</span></div>
    </div>
  )
}

function BadgeField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'badge' }>; path: string; val: any }) {
  const ed = useEd()
  const id = fid(path)
  const v = val || ''
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top"><label htmlFor={id}>{d.label}</label></div>
      <input className="inp" id={id} type="text" data-p={path} value={v} placeholder="مثل: جديد" autoComplete="off" onChange={(e) => ed.setC(path, e.target.value, { src: 'panel' })} />
      <div className="chips">
        {['', ...d.options].map((b) => (
          <button key={b || '-'} type="button" aria-pressed={v === b} onClick={() => ed.setC(path, b, { label: 'غيّرت الشارة', key: null })}>{b || 'بلا شارة'}</button>
        ))}
      </div>
    </div>
  )
}

function AffixField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'tel' | 'email' | 'url' | 'social' }>; path: string; val: any }) {
  const ed = useEd()
  const id = fid(path)
  const v = val == null ? '' : String(val)
  const [err, setErr] = useState<string | null>(null)
  const icon = d.type === 'tel' ? 'phone' : d.type === 'email' ? 'mail' : d.type === 'url' ? 'map'
    : d.net === 'website' ? 'globe' : d.net === 'snapchat' || d.net === 'x' ? 'at' : d.net
  const ph = d.type === 'tel' ? (d.placeholderFrom ? gp(ed.doc.content, d.placeholderFrom) : d.placeholder) || '+966 5x xxx xxxx'
    : d.type === 'email' ? 'name@example.com' : (d as any).placeholder || (d.type === 'url' ? 'https://' : '')
  const resolved = d.type === 'social' ? socialURL(d.net, v, ed.phone) : ''
  const blur = () => {
    const x = v.trim()
    if (d.type === 'tel') setErr(!x || telOK(x) ? null : 'اكتب الرقم مع رمز الدولة، مثل +966 11 555 0140.')
    if (d.type === 'email') setErr(!x || mailOK(x) ? null : 'هذا البريد غير مكتمل. مثال: name@example.com')
    if (d.type === 'url') {
      if (x && !/^https?:\/\//i.test(x) && /\.\w/.test(x)) { ed.setC(path, 'https://' + x, { key: 'f:' + path }); setErr(null); return }
      setErr(!x || urlOK(x) ? null : 'الرابط يبدأ عادةً بـ https://')
    }
    // The templates link to what is stored, so a handle is stored as its link.
    if (d.type === 'social' && x && resolved && resolved !== x) ed.setC(path, resolved, { key: 'f:' + path })
  }
  return (
    <div className={'fld' + (err ? ' err' : '')} data-fk={path}>
      <div className="fl-top"><label htmlFor={id}>{d.label}</label></div>
      <div className="affix">
        <span className="pre"><Ic n={icon} /></span>
        <input
          id={id} dir="ltr" data-p={path} value={v} placeholder={ph} autoComplete="off"
          type={d.type === 'tel' ? 'tel' : d.type === 'email' ? 'email' : d.type === 'url' ? 'url' : 'text'}
          inputMode={d.type === 'tel' ? 'tel' : d.type === 'email' ? 'email' : undefined}
          autoCapitalize={d.type === 'social' ? 'off' : undefined}
          spellCheck={d.type === 'social' ? false : undefined}
          onChange={(e) => { if (err) setErr(null); ed.setC(path, e.target.value, { src: 'panel' }) }}
          onBlur={blur}
        />
        {d.type === 'url' && urlOK(v) && <a className="end" href={v} target="_blank" rel="noopener noreferrer">افتح</a>}
      </div>
      {d.type === 'social'
        ? (resolved && resolved !== v ? <div className="resolved">يفتح: {resolved.replace(/^https?:\/\//, '')}</div> : null)
        : (d.hint || err) ? <div className="fl-bot"><Hint text={d.hint} err={err} /></div> : null}
    </div>
  )
}

/* ── pictures ──────────────────────────────────────────────────────────── */
function ImageField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'image' }>; path: string; val: any }) {
  const ed = useEd()
  const [drop, setDrop] = useState(false)
  const src = typeof val === 'string' ? val : ''
  const dz = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDrop(true) },
    onDragLeave: (e: React.DragEvent) => { if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) setDrop(false) },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); setDrop(false)
      const f = e.dataTransfer.files?.[0]
      if (f) ed.uploadTo(path, f)
    },
  }
  if (d.round) {
    return (
      <div className="fld" data-fk={path}>
        <div className="fl-top"><span className="lab">{d.label}</span></div>
        <div className="img-row">
          <button type="button" className={'imgf round' + (drop ? ' drop' : '')} aria-label={`تغيير ${d.label}`} onClick={() => ed.openPicker(path)} {...dz}>
            {src ? <img src={src} alt="" /> : <span className="empty"><Ic n="img" /></span>}
          </button>
          <div className="col">
            <button type="button" className="btn sm" onClick={() => ed.openPicker(path)}><Ic n="img" />{src ? 'تغيير' : 'اختر صورة'}</button>
            {d.optional && src && <button type="button" className="btn sm line" onClick={() => ed.setImage(path, '')}><Ic n="trash" />إزالة</button>}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top"><span className="lab">{d.label}</span></div>
      <div className={'imgf' + (drop ? ' drop' : '')} {...dz}>
        {src ? <img src={src} alt="" /> : <button type="button" className="empty" onClick={() => ed.openPicker(path)}><Ic n="img" />أضف صورة</button>}
        <div className="acts">
          {src && <button type="button" onClick={() => ed.openPicker(path)}><Ic n="img" />تغيير</button>}
          {d.optional && src && <button type="button" onClick={() => ed.setImage(path, '')}><Ic n="trash" />إزالة</button>}
        </div>
      </div>
      <div className="fl-bot"><span className="hint">{d.hint || (fineMouse() ? 'يمكنك أيضًا سحب صورة من جهازك وإفلاتها هنا.' : '')}</span></div>
    </div>
  )
}

/* ── choices ───────────────────────────────────────────────────────────── */
function ChoiceField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'choice' }>; path: string; val: any }) {
  const ed = useEd()
  const v = String(val || d.fallback)
  const hint = d.hints?.[v] ?? d.hint
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top"><span className="lab">{d.label}</span></div>
      {d.options.length <= 3
        ? <Seg items={d.options.map((o) => [o.value, o.label] as [string, string])} value={v} cls="fill" label={d.label}
            onChange={(x) => ed.setC(path, x, { label: `غيّرت «${d.label}»`, key: null })} />
        : <div className="chips">{d.options.map((o) => (
            <button key={o.value} type="button" aria-pressed={v === o.value} onClick={() => ed.setC(path, o.value, { label: `غيّرت «${d.label}»`, key: null })}>{o.label}</button>
          ))}</div>}
      {hint ? <div className="fl-bot"><span className="hint">{hint}</span></div> : null}
    </div>
  )
}

function ToggleField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'toggle' }>; path: string; val: any }) {
  const ed = useEd()
  const on = val == null ? d.fallback : !!val
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top">
        <span className="lab">{d.label}</span>
        <button type="button" className="switch" role="switch" aria-checked={on} aria-label={d.label}
          onClick={() => ed.setC(path, !on, { label: `${on ? 'أوقفت' : 'شغّلت'} «${d.label}»`, key: null })} />
      </div>
      {d.hint ? <div className="fl-bot"><span className="hint">{d.hint}</span></div> : null}
    </div>
  )
}

function StarsField({ d, path, val }: { d: Extract<EditorFieldDef, { type: 'stars' }>; path: string; val: any }) {
  const ed = useEd()
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top"><span className="lab">{d.label}</span></div>
      <div className="stars-in" role="radiogroup" aria-label={d.label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={+val === n} aria-label={`${n} من 5`} className={n <= +val ? 'f' : ''}
            onClick={() => ed.setC(path, n, { label: 'غيّرت التقييم', key: null })}>
            <svg viewBox="0 0 24 24" fill="currentColor"><use href="#i-starf" /></svg>
          </button>
        ))}
      </div>
    </div>
  )
}

function RatingField({ label, hint, path, val, min, max, step }: { label: string; hint?: string; path: string; val: any; min: number; max: number; step: number }) {
  const ed = useEd()
  const id = fid(path)
  const dec = step < 1 ? 1 : 0
  const [text, setText] = useState<string | null>(null)
  const shown = text ?? (val == null || val === '' ? '' : (+val || 0).toFixed(dec))
  const set = (n: number) => {
    const x = Math.max(min, Math.min(max, Math.round(n / step) * step))
    ed.setC(path, +x.toFixed(dec), { key: 'f:' + path })
  }
  return (
    <div className="fld" data-fk={path}>
      <div className="fl-top"><label htmlFor={id}>{label}</label></div>
      <div className="rate">
        <div className="affix">
          <button type="button" aria-label="أنقص" onClick={() => set((+val || 0) - step)}><Ic n="minus" /></button>
          <input id={id} type="text" inputMode="decimal" data-p={path} value={shown}
            onChange={(e) => { setText(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n >= min && n <= max) ed.setC(path, n, { src: 'panel' }) }}
            onBlur={() => setText(null)} />
          <button type="button" aria-label="زد" onClick={() => set((+val || 0) + step)}><Ic n="plus" /></button>
        </div>
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
    </div>
  )
}

/* ── the week ──────────────────────────────────────────────────────────── */
function HoursField({ path }: { path: string }) {
  const ed = useEd()
  const hs: any[] = gp(ed.doc.content, path) || []
  const opts = (v: string) => (TIMES.includes(v) || !v ? TIMES : [v, ...TIMES])
  const firstOpen = hs.find((h) => !h.closed)
  const set = (i: number, nh: any, label: string) => ed.setC(`${path}.${i}`, nh, { label, key: null })
  return (
    <div className="fld" data-fk={path}>
      <div className="hrs">
        {hs.map((h, i) => (
          <div key={i} className={'hrow' + (h.closed ? ' closed' : '')}>
            <span className="day">{h.label}</span>
            <button type="button" className="switch" role="switch" aria-checked={!h.closed} aria-label={`${h.label} مفتوح`}
              onClick={() => {
                const open = h.closed
                const f = hs.find((x) => !x.closed && x !== h)
                set(i, { ...h, closed: !open, ...(open && !h.open ? { open: f ? f.open : '5:30 م', close: f ? f.close : '10:00 م' } : {}) }, `${open ? 'فتحت' : 'أغلقت'} يوم ${h.label}`)
              }} />
            <span className="tm">
              {h.closed ? <span className="x">مغلق</span> : (
                <>
                  <select aria-label={`يفتح ${h.label}`} value={h.open || ''} onChange={(e) => set(i, { ...h, open: e.target.value }, `غيّرت مواعيد ${h.label}`)}>
                    {opts(h.open).map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <span className="dash">–</span>
                  <select aria-label={`يغلق ${h.label}`} value={h.close || ''} onChange={(e) => set(i, { ...h, close: e.target.value }, `غيّرت مواعيد ${h.label}`)}>
                    {opts(h.close).map((t) => <option key={t}>{t}</option>)}
                  </select>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
      {firstOpen && (
        <button type="button" className="btn sm line" style={{ justifySelf: 'start' }}
          onClick={() => ed.setC(path, hs.map((h) => (h.closed ? h : { ...h, open: firstOpen.open, close: firstOpen.close })), { label: `طبّقت مواعيد ${firstOpen.label} على كل الأيام`, key: null })}>
          <Ic n="copy" />طبّق مواعيد {firstOpen.label} على كل الأيام المفتوحة
        </button>
      )}
    </div>
  )
}

/* ── lists ─────────────────────────────────────────────────────────────── */
function ListField({ d, path }: { d: Extract<EditorFieldDef, { type: 'array' | 'strings' }>; path: string }) {
  const ed = useEd()
  const arr: any[] = gp(ed.doc.content, path) || []
  const wrap = useRef<HTMLDivElement>(null)
  const a = d.type === 'array' ? d : null
  const show = a?.show
  const sub = (it: any) => {
    if (a?.itemCount) { const x = a.itemCount; return plural((gp(it, x.path) || []).length, x.one, x.two, x.few, x.many) }
    if (a?.itemSub) return String(gp(it, a.itemSub) ?? '').trim()
    return ''
  }
  const drag = (e: React.PointerEvent<HTMLButtonElement>, from: number) => {
    if (e.button !== 0) return
    const grip = e.currentTarget
    const rows = [...(wrap.current?.querySelectorAll<HTMLElement>(':scope>.lrow') || [])]
    if (rows.length < 2) return
    const row = rows[from]
    const rects = rows.map((r) => r.getBoundingClientRect()), step = rects[1].top - rects[0].top, y0 = e.clientY
    let to = from, moved = false
    try { grip.setPointerCapture(e.pointerId) } catch {}
    const mv = (ev: PointerEvent) => {
      const dy = ev.clientY - y0
      if (!moved && Math.abs(dy) < 4) return
      if (!moved) { moved = true; row.classList.add('drag') }
      const lim = Math.max(rects[0].top - rects[from].top - 8, Math.min(rects[rects.length - 1].top - rects[from].top + 8, dy))
      row.style.transform = `translateY(${lim}px)`
      to = Math.max(0, Math.min(rows.length - 1, from + Math.round(lim / step)))
      rows.forEach((r, k) => {
        if (k === from) return
        let sh = 0
        if (from < to && k > from && k <= to) sh = -step
        if (from > to && k < from && k >= to) sh = step
        r.style.transform = sh ? `translateY(${sh}px)` : ''
      })
    }
    const up = () => {
      grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up)
      rows.forEach((r) => (r.style.transform = '')); row.classList.remove('drag')
      if (moved && to !== from) ed.moveItem(path, from, to)
    }
    grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); grip.addEventListener('pointercancel', up)
  }
  const thumbOf = (it: any) => (a?.itemThumb ? String(gp(it, a.itemThumb) || '') : '')
  const name = itemName(d)
  const acc = a?.itemAcc || name
  return (
    <div className="lst" data-list={path}>
      <div className="gh" style={{ margin: '6px 0 0' }}>{d.label}<span className="n">{arr.length}</span></div>
      <div className="lrows" ref={wrap}>
        {arr.length ? arr.map((it, i) => {
          const t = itemTitle(d, it, i)
          const emptyT = d.type === 'strings' ? !String(it ?? '').trim() : !(a?.itemTitle && String(gp(it, a.itemTitle) ?? '').trim())
          const src = thumbOf(it)
          const off = !!show && i >= show
          const s = a?.itemThumb && a.itemTitle && emptyT && a.itemThumb === 'url' ? '' : sub(it)
          return (
            <div key={i} className={'lrow' + (off ? ' off' : '')} data-li={i}>
              <button type="button" className="grip" data-grip={i} aria-label={`رتّب «${t}». اسحب، أو استخدم السهمين.`}
                onPointerDown={(e) => drag(e, i)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
                  e.preventDefault()
                  const to = i + (e.key === 'ArrowUp' ? -1 : 1)
                  ed.moveItem(path, i, to)
                  requestAnimationFrame(() => wrap.current?.querySelector<HTMLElement>(`[data-grip="${to}"]`)?.focus({ preventScroll: true }))
                }}>
                <Ic n="grip" />
              </button>
              <button type="button" className="open" onClick={() => ed.push({ v: 'item', list: path, i, panel: '' })}>
                {a?.itemThumb ? <span className="th" style={src ? { backgroundImage: `url('${src}')` } : undefined}>{src ? null : <Ic n="img" />}</span> : null}
                <span className="tx"><b className={emptyT ? 'empty' : ''}>{t}</b>{s ? <span>{s}</span> : null}</span>
                {off ? <span className="tag">لا يظهر</span> : null}
                {emptyT && a?.itemThumb === 'url' ? <span className="tag w">بلا وصف</span> : null}
                <Ic n="next" c="chev" />
              </button>
            </div>
          )
        }) : (
          <div className="empty-st"><Ic n="plus" /><span>لا {d.label} بعد.</span></div>
        )}
      </div>
      {show && arr.length > show ? <div className="cap">يظهر في موقعك أول {show} فقط. اسحب ما تريد إظهاره إلى الأعلى.</div> : null}
      <button type="button" className="add" onClick={() => ed.addItem(path)}><Ic n="plus" />أضف {acc}</button>
    </div>
  )
}

/* ── cards that point at the dashboard ─────────────────────────────────── */
function LogoCard() {
  const ed = useEd()
  return (
    <div className="card-note">
      <div className="hd"><span className="logo-box"><Ic n="img" /></span><span>الشعار</span></div>
      <p>ترفع شعارك مرة واحدة من صفحة «الظهور في Google» في لوحة التحكم، ويصبح أيقونة موقعك في المتصفح أيضًا.</p>
      <button type="button" className="btn sm" onClick={() => ed.dash('seo', 'الظهور في Google')}>ارفع الشعار <Ic n="open" /></button>
    </div>
  )
}

function ReviewsCard({ path }: { path: string }) {
  const ed = useEd()
  const n = (gp(ed.doc.content, path) || []).length
  return (
    <div className="card-note">
      <div className="hd"><Ic n="reviews" />تقييماتك</div>
      <p>يظهر في موقعك {plural(n, 'رأي واحد', 'رأيان', 'آراء', 'رأيًا')}. تجلب آراء Google وتختار ما يظهر من صفحة «الآراء» في لوحة التحكم، وتعدّل نصوصها هنا.</p>
      <button type="button" className="btn sm k" onClick={() => ed.dash('reviews', 'الآراء')}>افتح صفحة الآراء <Ic n="open" /></button>
    </div>
  )
}

function Snippet({ d }: { d: Extract<EditorFieldDef, { type: 'snippet' }> }) {
  const ed = useEd()
  const c = ed.doc.content
  const name = String(gp(c, d.name) || '')
  const title = String(gp(c, d.title) || name)
  const desc = String(gp(c, d.description) || '')
  const cutTo = (t: string, n: number) => ([...t].length > n ? [...t].slice(0, n - 1).join('').trimEnd() + '…' : t)
  return (
    <div className="snip">
      <div className="u">
        <span className="fav">{[...(name.trim() || 'م')][0]}</span>
        <span><b>{name}</b><span className="ltr">{ed.siteHost ? `https://${ed.siteHost}` : 'https://…'}</span></span>
      </div>
      <div className="t">{cutTo(title, 60)}</div>
      <div className="d">{cutTo(desc, 160)}</div>
    </div>
  )
}

/** The fields of one item of a list. */
export function ItemFields({ list, i }: { list: string; i: number }) {
  const ed = useEd()
  const d = listDef(ed.config, list)
  if (!d) return null
  return <Fields fields={itemFields(d)} base={`${list}.${i}.`} />
}

export function listDef(config: EditorConfig, list: string) {
  for (const p of [...config.panels, ...config.globalPanels]) {
    const r = findList(p.fields, '', list)
    if (r) return r
  }
  return null
}
function findList(fields: EditorFieldDef[], prefix: string, list: string): Extract<EditorFieldDef, { type: 'array' | 'strings' }> | null {
  for (const f of fields) {
    if (!hasPath(f)) continue
    const abs = join(prefix, f.path)
    if ((f.type === 'array' || f.type === 'strings') && abs === list) return f
    if (f.type === 'array' && list.startsWith(abs + '.')) {
      const m = list.slice(abs.length + 1).match(/^(\d+)\.(.+)$/)
      if (m) { const r = findList(f.itemFields, `${abs}.${m[1]}.`, list); if (r) return r }
    }
  }
  return null
}
