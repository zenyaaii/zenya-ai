'use client'

/**
 * BOOKINGS, as the v6 design draws it (VIEWS.bookings, bkHTML, groupsHTML,
 * bookingSheet, the swipe, bookingForm): the week strip, the status filter,
 * the bookings grouped by day, today's summary on the side, a sheet per
 * booking, and «حجز جديد» for a booking that came by phone.
 *
 * Every status change is the server's (PATCH /api/bookings/:id) and the
 * toast's «تراجع» sends the old status back. The design's on/off switch for
 * taking bookings has no setting behind it: the side card says the real
 * state of the plan instead, with the button that changes it.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { A, type Act } from '../Home'
import { DAYS, Ic, Seg, dayFull, people, reduceMotion, useV6 } from '../ui'
import { PageHead, Switch, at, byId, digits, first, shake, store, tint, useStore, type Store } from './kit'

export type BkStatus = 'new' | 'ok' | 'done' | 'cancel'
export type V6Booking = {
  id: string
  name: string
  phone: string | null
  email: string | null
  note: string | null
  people: number | null
  /** Days from today: 0 today, 1 tomorrow, -2 two days ago. */
  d: number
  /** «20:00», or '' when the visitor gave no time. */
  time: string
  st: BkStatus
  /** «حجز طاولة» */
  kind: string
  site: string
}

export type NewBooking = { name: string; phone: string; d: number; time: string; people: number; note: string }

export type V6BookingsProps = {
  bookings: V6Booking[]
  /** Whether the site takes bookings now: the head's pill and the side card's switch. */
  receiving: boolean
  /** Turns it on or off; resolves with what went wrong, or null. */
  setReceiving: ((on: boolean) => Promise<string | null>) | null
  /** The site new bookings come from, for the side card. */
  siteName: string | null
  setStatus: (id: string, st: BkStatus) => Promise<boolean>
  /** null: no site to file a booking under. */
  create: ((b: NewBooking) => Promise<V6Booking | null>) | null
  /** Takes back a booking just made here (its «تراجع»). */
  undoCreate?: (id: string) => Promise<boolean>
  links: { settings: Act }
}

const ST: Record<BkStatus, [string, string]> = { new: ['جديد', 'solid-acc'], ok: ['مؤكّد', 'solid-ok'], done: ['منجز', ''], cancel: ['ملغى', 'bad'] }
const dayLabel = (d: number) => dayFull(d) + (d === 0 ? ' · اليوم' : d === 1 ? ' · غدًا' : '')
const dateOf = (d: number) => new Date(Date.now() + d * 864e5)

export default function V6Bookings(p: V6BookingsProps) {
  const { toast, openSheet, closeSheet } = useV6()
  const [list, setList] = useState(p.bookings)
  const [on, setOn] = useState(p.receiving)
  useEffect(() => { setOn(p.receiving) }, [p.receiving])
  useEffect(() => { setList(p.bookings) }, [p.bookings])
  const [filter, setFilter] = useState<'all' | BkStatus>('all')
  const [day, setDay] = useState<number | null>(null)
  const swiped = useRef(false)

  const cnt = (k: 'all' | BkStatus) => list.filter((b) => k === 'all' || b.st === k).length
  const waiting = cnt('new')
  const today = list.filter((b) => b.d === 0 && b.st !== 'cancel')

  /** msg null: an undo, which the toast already answers with «تم التراجع». */
  async function setStatus(b: V6Booking, st: BkStatus, msg: string | null) {
    const old = b.st
    setList((l) => l.map((x) => (x.id === b.id ? { ...x, st } : x)))
    const ok = await p.setStatus(b.id, st)
    if (!ok) {
      setList((l) => l.map((x) => (x.id === b.id ? { ...x, st: old } : x)))
      toast('لم يُحفظ التغيير. تأكد من اتصالك وحاول مرة أخرى.', { ok: false })
      return
    }
    if (msg) toast(msg, { undo: () => { setStatus({ ...b, st }, old, null) } })
  }

  function sheet(b: V6Booking) {
    const wa = b.phone ? `https://wa.me/${digits(b.phone).replace(/^\+/, '')}?text=${encodeURIComponent(`مرحبًا ${first(b.name)}، نؤكد حجزك${b.d >= 0 ? ' يوم ' + dayFull(b.d) : ''}${b.time ? ' الساعة ' + b.time : ''}. ننتظرك.`)}` : null
    const foot = b.st === 'new' ? <ConfirmFoot onReject={() => { closeSheet(); setStatus(b, 'cancel', 'تم رفض حجز ' + first(b.name)) }} onOk={() => { closeSheet(); setStatus(b, 'ok', 'تم تأكيد حجز ' + first(b.name)) }} />
      : b.st === 'ok' ? <>
        <button className="btn line press" style={{ color: 'var(--bad)' }} onClick={() => { closeSheet(); setStatus(b, 'cancel', 'تم إلغاء حجز ' + first(b.name)) }}>ألغِ الحجز</button>
        <button className="btn k press" onClick={() => { closeSheet(); setStatus(b, 'done', 'سجّلنا أن ' + first(b.name) + ' حضر') }}><Ic n="check" />حضروا</button>
      </>
        : <button className="btn press" data-close onClick={closeSheet}>إغلاق</button>
    openSheet({
      title: 'تفاصيل الحجز',
      body: (
        <>
          <div className="sh-person">
            <span className={`av ${tint(b.name)}`}>{b.name[0]}</span>
            <div style={{ minWidth: 0 }}><h3 className="trunc">{b.name}</h3><span className={`pill ${ST[b.st][1]}`}>{ST[b.st][0]}</span></div>
          </div>
          <div className="facts">
            <div><span>اليوم</span><b>{dayFull(b.d)}</b></div>
            <div><span>الساعة</span><b className="num">{b.time || '—'}</b></div>
            <div><span>العدد</span><b>{people(b.people)}</b></div>
            <div><span>النوع</span><b>{b.kind} · {b.site}</b></div>
          </div>
          {b.note && <div className="note">«{b.note}»</div>}
          <div className="rows" style={{ marginTop: 8 }}>
            {b.phone && <a className="r" href={`tel:${digits(b.phone)}`}><span className="tile"><Ic n="phone" /></span><span className="tx"><b>اتصل</b><span className="ltr" style={{ textAlign: 'end' }}>{b.phone}</span></span><Ic n="chev" className="chev" /></a>}
            {wa && <a className="r" href={wa} target="_blank" rel="noopener noreferrer"><span className="tile ok"><Ic n="whatsapp" /></span><span className="tx"><b>واتساب</b><span>رسالة تأكيد جاهزة باسمه</span></span><Ic n="chev" className="chev" /></a>}
            {b.email && <a className="r" href={`mailto:${b.email}`}><span className="tile"><Ic n="mail" /></span><span className="tx"><b>بريد</b><span className="ltr" style={{ textAlign: 'end' }}>{b.email}</span></span><Ic n="chev" className="chev" /></a>}
          </div>
        </>
      ),
      foot,
    })
  }

  function form() {
    if (!p.create) return
    const create = p.create
    const st = store({ d: 0, n: 2, busy: false })
    openSheet({
      title: 'حجز جديد',
      body: <FormBody st={st} />,
      foot: (
        <FormFoot st={st} save={async () => {
          const name = byId('fN')?.value.trim() || ''
          if (!name) { shake(byId('fN')); return }
          const s = st.get()
          st.set({ busy: true })
          const b = await create({
            name, phone: byId('fP')?.value.trim() || '', d: s.d, time: byId('fT')?.value || '20:00', people: s.n,
            note: byId<HTMLTextAreaElement>('fNote')?.value.trim() || '',
          })
          st.set({ busy: false })
          if (!b) { toast('لم يُحفظ الحجز. حاول مرة أخرى.', { ok: false }); return }
          closeSheet()
          setTimeout(() => {
            setFilter('all'); setDay(null)
            setList((l) => [...l, b])
            requestAnimationFrame(() => {
              const el = document.querySelector<HTMLElement>(`#bGroups [data-bk="${b.id}"]`)
              if (el && !reduceMotion()) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.animate([{ transform: 'scale(.92)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 760, easing: 'cubic-bezier(.2,.9,.3,1.2)' }) }
            })
            toast('تمت إضافة حجز ' + first(name), p.undoCreate ? {
              undo: async () => {
                setList((l) => l.filter((x) => x.id !== b.id))
                if (!(await p.undoCreate!(b.id))) { setList((l) => [...l, b]); toast('تعذّر التراجع', { ok: false }) }
              },
            } : {})
          }, 280)
        }} />
      ),
    })
  }

  const week = Array.from({ length: 7 }, (_, d) => {
    const x = dateOf(d)
    const on = list.filter((b) => b.d === d && b.st !== 'cancel')
    return (
      <button key={d} type="button" className="wd press" aria-pressed={day === d} aria-label={`${dayFull(d)}، ${on.length} حجوزات`} onClick={() => setDay(day === d ? null : d)}>
        <small>{d === 0 ? 'اليوم' : d === 1 ? 'غدًا' : DAYS[x.getDay()].replace('ال', '')}</small>
        <b className="num">{x.getDate()}</b>
        <span className="dots">{on.slice(0, 3).map((b) => <i key={b.id} className={b.st === 'ok' ? 'ok' : ''} />)}</span>
      </button>
    )
  })

  const shown = list.filter((b) => (filter === 'all' || b.st === filter) && (day === null || b.d === day))
  const ds = [...new Set(shown.map((b) => b.d))].sort((a, b) => Number(a < 0) - Number(b < 0) || (a < 0 ? b - a : a - b))
  let past = false
  const groups: ReactNode = shown.length ? ds.map((d) => {
    const head = d < 0 && !past ? (past = true, <div className="past-h">حجوزات سابقة</div>) : null
    return (
      <div key={d}>
        {head}
        <div className="group">
          <h4>{dayLabel(d)}</h4>
          <div className="blist">
            {shown.filter((b) => b.d === d).sort((a, b) => a.time.localeCompare(b.time)).map((b, i) => (
              <Row key={b.id} b={b} i={i} swiped={swiped} onOpen={() => sheet(b)} onSwipe={() => setStatus(b, 'ok', 'تم تأكيد حجز ' + first(b.name))} />
            ))}
          </div>
        </div>
      </div>
    )
  }) : (
    <div className="card"><div className="empty"><Ic n="cal" /><b>لا حجوزات هنا</b><span>{day !== null ? 'لا شيء في هذا اليوم بهذه الحالة.' : 'جرّب حالة أخرى من الأعلى.'}</span></div></div>
  )

  return (
    <>
      <PageHead
        title="الحجوزات"
        sub="كل طلبات الحجز التي يرسلها زوار موقعك تصلك هنا."
        acts={<>
          <span className={`pill ${on ? 'ok' : 'warn'}`}>{on ? 'الحجز مفعّل' : 'الحجز متوقف'}</span>
          {p.create && <button className="btn k press" onClick={form}><Ic n="plus" />حجز جديد</button>}
        </>}
      />
      <div className="week rv" style={at(2)} id="week" role="group" aria-label="الأسبوع">{week}</div>
      <div className="bk-layout">
        <div>
          <div className="bk-top rv" style={at(3)}>
            <Seg<'all' | BkStatus> className="fit" label="تصفية حسب الحالة" value={filter} onChange={setFilter}
              items={[['all', 'الكل', cnt('all')], ['new', 'جديد', cnt('new')], ['ok', 'مؤكّد', cnt('ok')], ['done', 'منجز', cnt('done')], ['cancel', 'ملغى', cnt('cancel')]]} />
          </div>
          <p className="hint rv" style={at(3)}><Ic n="help" /><span className="touch">اسحب الحجز الجديد إلى اليسار لتأكيده بسرعة.</span><span className="mouse">اضغط على أي حجز لترى تفاصيله وتؤكّده.</span></p>
          <div id="bGroups">{groups}</div>
        </div>
        <aside className="bk-side rv" style={at(4)}>
          <div className="card">
            <div className="card-h"><h2 className="t-h3">ملخص اليوم</h2><span className="side-note">{dayFull(0)}</span></div>
            <div className="rows">
              <div className="r"><span className="tile acc"><Ic n="cal" /></span><span className="tx"><b>الحجوزات</b></span><span className="end"><b className="num" style={{ fontSize: 18 }}>{today.length}</b></span></div>
              <div className="r"><span className="tile"><Ic n="users" /></span><span className="tx"><b>عدد الضيوف</b></span><span className="end"><b className="num" style={{ fontSize: 18 }}>{today.reduce((a, b) => a + (b.people || 0), 0)}</b></span></div>
              <div className="r"><span className="tile warn"><Ic n="bell" /></span><span className="tx"><b>تنتظر تأكيدك</b></span><span className="end"><b className="num" style={{ fontSize: 18 }}>{waiting}</b></span></div>
            </div>
          </div>
          <div className="card"><div className="rows">
            <div className="r">
              <span className="tile"><Ic n="globe" /></span>
              <span className="tx"><b>استقبال الحجوزات</b><span>من موقع {p.siteName || '—'}</span></span>
              <span className="end"><Switch on={on} label="استقبال الحجوزات" id="bSw" disabled={!p.setReceiving} onChange={async (v) => {
                if (!p.setReceiving) return
                setOn(v)
                const err = await p.setReceiving(v)
                if (err) { setOn(!v); toast(err, { ok: false }); return }
                toast(v ? 'تم تشغيل الحجز' : 'تم إيقاف الحجز مؤقتًا')
              }} /></span>
            </div>
            <A to={p.links.settings} className="r"><span className="tile"><Ic n="mail" /></span><span className="tx"><b>تنبيه بالبريد</b><span>عند وصول كل حجز جديد</span></span><Ic n="chev" className="chev" /></A>
          </div></div>
        </aside>
      </div>
    </>
  )
}

/* ---- one booking, and the swipe that confirms a new one ------------------- */
function Row({ b, i, swiped, onOpen, onSwipe }: { b: V6Booking; i: number; swiped: React.MutableRefObject<boolean>; onOpen: () => void; onSwipe: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (reduceMotion() || !row.current) return
    const el = (wrap.current || row.current) as HTMLElement
    el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: Math.min(i, 10) * 40, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const btn = (
    <button
      ref={row} className={`bk ${b.st}`} data-bk={b.id}
      onClick={() => { if (swiped.current) { swiped.current = false; return } onOpen() }}
      onPointerDown={b.st === 'new' ? (e) => drag(e) : undefined}
    >
      <span className={`av ${tint(b.name)}`}>{b.name[0]}</span>
      <span className="tx"><b>{b.name}</b><span>{b.time && <><span className="num">{b.time}</span> · </>}{people(b.people)}{b.note ? ' · فيه ملاحظة' : ''}</span></span>
      <span className="end"><span className={`pill ${ST[b.st][1]}`}>{ST[b.st][0]}</span></span>
    </button>
  )

  function drag(e: React.PointerEvent<HTMLButtonElement>) {
    const r = row.current, w = wrap.current
    if (!r || !w || e.button > 0) return
    const x0 = e.clientX, y0 = e.clientY
    let dx = 0, on = false, dead = false
    const mv = (ev: PointerEvent) => {
      const ddx = ev.clientX - x0, ddy = ev.clientY - y0
      if (!on && !dead) {
        if (Math.abs(ddy) > 10 && Math.abs(ddy) > Math.abs(ddx)) { dead = true; return }
        if (Math.abs(ddx) > 8) { on = true; w.classList.add('dragging'); try { r.setPointerCapture(ev.pointerId) } catch {} }
      }
      if (!on) return
      dx = Math.min(0, ddx)
      if (ddx > 0) dx = ddx * 0.15
      const lim = w.offsetWidth * 0.6
      if (dx < -lim) dx = -lim - (-dx - lim) * 0.25
      r.style.transform = `translateX(${dx}px)`
      const ready = dx < -96
      if (ready !== w.classList.contains('ready')) { w.classList.toggle('ready', ready); if (ready) try { navigator.vibrate?.(6) } catch {} }
    }
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up)
      if (!on) return
      swiped.current = true
      setTimeout(() => { swiped.current = false }, 60)
      w.classList.remove('dragging')
      if (dx < -96) {
        w.classList.add('go')
        r.style.transform = `translateX(-${w.offsetWidth}px)`
        setTimeout(() => { w.classList.remove('go', 'ready'); r.style.transform = ''; onSwipe() }, 300)
      } else { r.style.transform = ''; w.classList.remove('ready') }
    }
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up)
  }

  return b.st === 'new'
    ? <div className="swipe" ref={wrap}><div className="act"><span><Ic n="check" />تأكيد</span></div>{btn}</div>
    : btn
}

/* ---- the sheet's feet ---------------------------------------------------- */
function ConfirmFoot({ onReject, onOk }: { onReject: () => void; onOk: () => void }) {
  const [done, setDone] = useState(false)
  return (
    <>
      <button className="btn danger press" onClick={onReject} disabled={done}>ارفض</button>
      <button className={`btn acc press${done ? ' okd' : ''}`} disabled={done} onClick={() => {
        setDone(true)
        try { navigator.vibrate?.(12) } catch {}
        setTimeout(onOk, 560)
      }}>
        <span className="done-mark"><Ic n="check" /></span><span>{done ? 'تم التأكيد' : 'تأكيد الحجز'}</span>
      </button>
    </>
  )
}

type FormState = { d: number; n: number; busy: boolean }
function FormBody({ st }: { st: Store<FormState> }) {
  const s = useStore(st)
  const num = useRef<HTMLElement>(null)
  const step = (k: number) => {
    st.set({ n: Math.max(1, Math.min(30, s.n + k)) })
    if (!reduceMotion()) num.current?.animate([{ transform: `translateY(${k > 0 ? -8 : 8}px)`, opacity: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)' })
  }
  return (
    <>
      <p className="t-small">أضف حجزًا جاءك بالهاتف أو مباشرة، ليظهر مع باقي الحجوزات.</p>
      <div className="stack" style={{ marginTop: 16 }}>
        <div className="field"><label htmlFor="fN">الاسم</label><input className="inp" id="fN" placeholder="مثل: أحمد علي" autoComplete="off" autoFocus maxLength={120} /></div>
        <div className="field"><label htmlFor="fP">الجوال <span className="t-micro">اختياري</span></label><input className="inp ltr" id="fP" type="tel" inputMode="tel" placeholder="+971 50 000 0000" style={{ textAlign: 'right' }} maxLength={40} /></div>
        <div className="field">
          <span className="lab">اليوم</span>
          <Seg<string> className="fill" label="اليوم" value={String(s.d)} onChange={(v) => st.set({ d: +v })}
            items={[['0', 'اليوم'], ['1', 'غدًا'], ['2', DAYS[dateOf(2).getDay()]]]} />
        </div>
        <div className="grid2" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <div className="field"><label htmlFor="fT">الساعة</label><input className="inp" id="fT" type="time" defaultValue="20:00" /></div>
          <div className="field">
            <span className="lab">العدد</span>
            <div className="stepper">
              <button type="button" aria-label="أقل" onClick={() => step(-1)}>−</button>
              <b className="num" ref={num}>{s.n}</b>
              <button type="button" aria-label="أكثر" onClick={() => step(1)}>+</button>
            </div>
          </div>
        </div>
        <div className="field"><label htmlFor="fNote">ملاحظة <span className="t-micro">اختياري</span></label><textarea className="inp" id="fNote" rows={2} placeholder="مثل: طاولة في الخارج" maxLength={2000} /></div>
      </div>
    </>
  )
}

function FormFoot({ st, save }: { st: Store<FormState>; save: () => void }) {
  const s = useStore(st)
  const { closeSheet } = useV6()
  return (
    <>
      <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
      <button className="btn k press" onClick={save} disabled={s.busy}>{s.busy ? 'نحفظ…' : 'احفظ الحجز'}</button>
    </>
  )
}

/** For a page: a booking's day as days from today. */
export function dayOffset(date: string | null, fallback: string): number {
  const src = date ? new Date(date + (date.length === 10 ? 'T00:00:00' : '')) : new Date(fallback)
  if (isNaN(src.getTime())) return 0
  const a = new Date(); a.setHours(0, 0, 0, 0)
  const b = new Date(src); b.setHours(0, 0, 0, 0)
  return Math.round((b.getTime() - a.getTime()) / 864e5)
}
