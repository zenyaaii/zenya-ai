'use client'

/**
 * REVIEWS, as the v6 design draws it (VIEWS.reviews, rvListHTML, rvPrevHTML,
 * moveRv, reviewForm): the Google summary, the list with a switch per
 * review, and beside it the site's reviews section drawn small, following
 * the switches.
 *
 * The reviews live in the site's own content (lib/reviews-bank); the page
 * that holds this component reads and writes them. Google's reviews can be
 * shown, hidden, moved or deleted but never reworded (Google's terms); the
 * owner's own can be edited.
 */

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Ic, Seg, Stars, reduceMotion, useV6 } from '../ui'
import { PageHead, at, byId, first, shake, store, tint, useStore, type Store } from './kit'

export type V6Review = {
  id: string
  name: string
  rating: number
  text: string
  origin: 'google' | 'manual'
  /** «قبل أسبوع» */
  at: string
  isNew?: boolean
  shown: boolean
}

export type ReviewDraft = { name: string; text: string; rating: number }

export type V6ReviewsProps = {
  sites: { id: string; name: string }[]
  siteId: string
  onSite: (id: string) => void
  source: { link: string; rating: number | null; count: number | null; fetched: string } | null
  reviews: V6Review[]
  heading: string
  /** Fetches (or refreshes) from Google. Resolves with an error in plain words, or null. */
  fetchGoogle: (link: string) => Promise<{ error: string | null; added: number }>
  toggle: (id: string) => Promise<boolean>
  save: (id: string | null, v: ReviewDraft) => Promise<boolean>
  /** Resolves with a way to bring the review back, or null when it failed. */
  remove: (id: string) => Promise<(() => void) | null>
  move: (id: string, to: 'up' | 'down') => Promise<boolean>
}

const SPRING = 'cubic-bezier(.2,.9,.3,1.15)'
const key = (r: { name: string; text: string }) => r.name + '|' + r.text
const words = (n: number) => (n === 1 ? 'تقييم' : n === 2 ? 'تقييمان' : n <= 10 ? 'تقييمات' : 'تقييمًا')

/** Rows that moved slide from where they were (the design's FLIP). */
function useFlip(root: RefObject<HTMLElement>, sel: string, grow: boolean) {
  const before = useRef<Map<string, number> | null>(null)
  const snap = () => {
    const m = new Map<string, number>()
    root.current?.querySelectorAll<HTMLElement>(sel).forEach((e) => m.set(e.dataset.k || '', e.getBoundingClientRect().top))
    before.current = m
  }
  useLayoutEffect(() => {
    const b = before.current
    before.current = null
    if (!b || reduceMotion()) return
    root.current?.querySelectorAll<HTMLElement>(sel).forEach((e) => {
      const t = b.get(e.dataset.k || '')
      if (t == null) { if (grow) e.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: SPRING }); return }
      const dy = t - e.getBoundingClientRect().top
      if (dy) e.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 620, easing: SPRING })
    })
  })
  return snap
}

export default function V6Reviews(p: V6ReviewsProps) {
  const { toast, openSheet, closeSheet } = useV6()
  const [fetching, setFetching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const list = useRef<HTMLDivElement>(null)
  const prev = useRef<HTMLDivElement>(null)
  const snapList = useFlip(list, '.rvi', false)
  const snapPrev = useFlip(prev, 'figure', true)
  const snap = () => { snapList(); snapPrev() }

  const shown = p.reviews.filter((r) => r.shown)
  const fresh = p.reviews.filter((r) => r.isNew).length
  const g = p.source

  async function fetchFrom(link: string, btn: 'fetch' | 'refresh') {
    const set = btn === 'fetch' ? setFetching : setRefreshing
    set(true)
    const r = await p.fetchGoogle(link)
    set(false)
    if (r.error) toast(r.error, { ok: false })
    else toast(r.added ? (r.added === 1 ? 'وصل تقييم جديد من Google' : `وصلت ${r.added} تقييمات جديدة من Google`) : btn === 'fetch' ? 'تم جلب التقييمات' : 'لا تقييمات جديدة على Google')
  }

  function form(r?: V6Review) {
    const st = store({ rate: r ? r.rating : 5, busy: false })
    openSheet({
      title: r ? 'عدّل التقييم' : 'أضف تقييمًا',
      body: <FormBody st={st} r={r} />,
      foot: (
        <FormFoot st={st} save={async () => {
          const n = byId('rN')?.value.trim() || ''
          const x = byId<HTMLTextAreaElement>('rX')?.value.trim() || ''
          if (!n) { shake(byId('rN')); return }
          if (!x) { shake(byId('rX')); return }
          st.set({ busy: true })
          snap()
          const ok = await p.save(r ? r.id : null, { name: n, text: x, rating: st.get().rate })
          st.set({ busy: false })
          if (!ok) { toast('لم يُحفظ التقييم. حاول مرة أخرى.', { ok: false }); return }
          closeSheet()
          toast(r ? 'تم حفظ التقييم' : 'أُضيف التقييم وظهر في موقعك')
        }} />
      ),
    })
  }

  const head = (
    <>
      <PageHead
        title="التقييمات"
        sub="اختر التقييمات التي تظهر في موقعك. التغيير يظهر في موقعك خلال دقيقة."
        acts={p.siteId ? <button className="btn k press" onClick={() => form()}><Ic n="plus" />أضف تقييمًا</button> : undefined}
      />
      {p.sites.length > 1 && (
        <div className="rv" style={{ ...at(2), marginBottom: 16 }}>
          <Seg<string> items={p.sites.map((x) => [x.id, x.name])} value={p.siteId} onChange={p.onSite} label="اختر الموقع" />
        </div>
      )}
    </>
  )

  if (!p.sites.length) {
    return (
      <>
        <PageHead title="التقييمات" sub="اختر التقييمات التي تظهر في موقعك." />
        <div className="card rv" style={at(3)}><div className="empty"><Ic n="reviews" /><b>لا يوجد عندك موقع فيه قسم تقييمات بعد</b><span>أنشئ موقعًا، وتظهر تقييماته هنا.</span></div></div>
      </>
    )
  }

  const connect = (
    <div className="inp-row" style={{ flexWrap: 'wrap' }}>
      <input className="inp ltr" id="gLink" placeholder="https://maps.app.goo.gl/..." style={{ flex: '1 1 240px', textAlign: 'left' }} />
      <button className="btn k press" disabled={fetching} onClick={() => {
        const v = byId('gLink')?.value.trim() || ''
        if (!/^https?:\/\//.test(v)) { shake(byId('gLink')); toast('ألصق رابطًا يبدأ بـ https://', { ok: false }); return }
        fetchFrom(v, 'fetch')
      }}>{fetching ? <><Ic n="refresh" className="spin" />جارٍ الجلب…</> : <><Ic n="refresh" />اجلب التقييمات</>}</button>
    </div>
  )

  if (!g && !p.reviews.length) {
    const name = p.sites.find((s) => s.id === p.siteId)?.name || ''
    return (
      <>
        {head}
        <div className="card rv" style={at(3)}>
          <div className="stack">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="tile bad"><Ic n="pin" /></span><h2 className="t-h3">اربط تقييمات Google</h2></div>
            <p className="t-small">ألصق رابط «{name}» على خرائط Google، ونجلب تقييمك وآخر التقييمات.</p>
            {connect}
          </div>
        </div>
      </>
    )
  }

  const score = g?.rating ?? null
  return (
    <>
      {head}
      <section className="card flush rv" style={at(3)}>
        <div className="rv-sum">
          <div className="score">
            <div><div className="big num">{score != null ? score : shown.length}</div></div>
            <div>
              {score != null ? <Stars n={score} lg /> : null}
              <div className="t-small" style={{ marginTop: 6 }}>
                {score != null && g?.count != null ? <><span className="num">{g.count}</span> تقييمًا على Google</> : `${words(shown.length)} في موقعك`}
              </div>
            </div>
          </div>
          <div className="stack" style={{ justifyContent: 'center', gap: 10 }}>
            {g ? (
              <div className="rv-src">
                <span className="tile bad"><Ic n="pin" /></span>
                <span className="trunc" style={{ flex: 1 }}>
                  <b style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', fontSize: 14.5 }}>مربوط بخرائط Google <span className="pill ok">متصل</span></b>
                  <span className="t-small ltr trunc" style={{ display: 'block', textAlign: 'end' }}>{g.link.replace(/^https?:\/\//, '')}</span>
                </span>
                <button className="btn sm press" disabled={refreshing} onClick={() => fetchFrom(g.link, 'refresh')}><Ic n="refresh" className={refreshing ? 'spin' : ''} /><span>حدّث</span></button>
              </div>
            ) : (
              <>
                <b style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5 }}><Ic n="pin" />اربط خرائط Google لتجلب تقييماتك</b>
                {connect}
              </>
            )}
            <p className="t-small">في موقعك الآن <b className="num" style={{ color: 'var(--ink)' }}>{shown.length}</b> من <span className="num">{p.reviews.length}</span> تقييمات{g?.fetched ? <> · آخر تحديث {g.fetched}</> : null}</p>
          </div>
        </div>
      </section>
      <div className="rv-layout">
        <section className="card rv" style={at(4)}>
          <div className="card-h"><h2 className="t-h3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>كل التقييمات {fresh > 0 && <span className="pill acc">{fresh} جديد</span>}</h2></div>
          <div id="rvList" ref={list}>
            {p.reviews.length ? p.reviews.map((r) => {
              const si = shown.indexOf(r)
              return (
                <div key={r.id} className={`rvi${r.shown ? '' : ' off'}`} data-rv={r.id} data-k={key(r)}>
                  <span className={`av ${tint(r.name)}`}>{r.name[0] || '؟'}</span>
                  <div className="body">
                    <div className="nm"><b>{r.name}</b><Stars n={r.rating} />{r.isNew && <span className="pill acc">جديد</span>}</div>
                    <div className="meta">{r.origin === 'google' ? <><Ic n="pin" />Google</> : <><Ic n="edit" />أضفته أنت</>}{r.at && <><span>·</span><span>{r.at}</span></>}</div>
                    <p>{r.text}</p>
                    <div className="tools-r">
                      {r.origin === 'manual' && <button type="button" onClick={() => form(r)}><Ic n="edit" />تعديل</button>}
                      {r.shown && <>
                        <button type="button" disabled={si === 0} aria-label={`قدّم تقييم ${r.name}`} onClick={async () => { snap(); if (!(await p.move(r.id, 'up'))) toast('لم يُحفظ التغيير', { ok: false }) }}><Ic n="up" />قدّم</button>
                        <button type="button" disabled={si === shown.length - 1} aria-label={`أخّر تقييم ${r.name}`} onClick={async () => { snap(); if (!(await p.move(r.id, 'down'))) toast('لم يُحفظ التغيير', { ok: false }) }}><Ic n="down" />أخّر</button>
                      </>}
                      <button type="button" onClick={async (e) => {
                        const row = (e.currentTarget as HTMLElement).closest<HTMLElement>('.rvi')
                        if (row && !reduceMotion()) await row.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: 280, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {})
                        snapPrev()
                        const undo = await p.remove(r.id)
                        if (!undo) { row?.getAnimations().forEach((a) => a.cancel()); toast('لم يُحذف التقييم. حاول مرة أخرى.', { ok: false }); return }
                        toast('حُذف تقييم ' + first(r.name), { undo })
                      }}><Ic n="trash" />حذف</button>
                    </div>
                  </div>
                  <div className="sw-col">
                    <button
                      type="button" className="switch" role="switch" aria-checked={r.shown} aria-label={(r.shown ? 'إخفاء' : 'إظهار') + ' تقييم ' + r.name}
                      onClick={async () => { try { navigator.vibrate?.(8) } catch {} snapPrev(); if (!(await p.toggle(r.id))) toast('لم يُحفظ التغيير', { ok: false }) }}
                    />
                    <small>{r.shown ? 'في الموقع' : 'مخفي'}</small>
                  </div>
                </div>
              )
            }) : <div className="empty"><Ic n="reviews" /><b>لا تقييمات بعد</b><span>أضف تقييمًا بنفسك أو حدّث من Google.</span></div>}
          </div>
        </section>
        <aside className="rv" style={at(5)}>
          <h2 className="sec-title">هكذا تظهر في موقعك</h2>
          <div className="preview" id="rvPrev" ref={prev}>
            <div className="ph-h">
              <b>{p.heading || 'ماذا يقول زبائننا'}</b>
              {score != null && <span><Stars n={score} /><span className="num">{score}</span>{g?.count != null && <> · <span className="num">{g.count}</span> تقييمًا</>}</span>}
            </div>
            <div className="pv-list">
              {shown.slice(0, 4).map((r) => (
                <figure key={key(r)} data-k={key(r)}><Stars n={r.rating} /><blockquote>{r.text}</blockquote><figcaption>{r.name}</figcaption></figure>
              ))}
              {shown.length > 4 && <p className="t-small" style={{ textAlign: 'center' }}>و{shown.length - 4} غيرها</p>}
              {!shown.length && <p className="t-small" style={{ textAlign: 'center', padding: '16px 0' }}>لا يظهر أي تقييم. شغّل تقييمًا واحدًا على الأقل.</p>}
            </div>
          </div>
        </aside>
      </div>
      <p className="t-small rv" style={{ ...at(6), margin: '16px 4px 0' }}>Google يعطي آخر 5 تقييمات فقط، ونصّها يبقى كما كتبه أصحابها. التقييمات التي تضيفها أنت يمكنك تعديلها. ويمكنك حذف أي تقييم.</p>
    </>
  )
}

/* ---- the add/edit sheet ---------------------------------------------------- */
type FormState = { rate: number; busy: boolean }
function FormBody({ st, r }: { st: Store<FormState>; r?: V6Review }) {
  const s = useStore(st)
  const box = useRef<HTMLDivElement>(null)
  return (
    <>
      <p className="t-small">أضف ما قاله زبون لك بكلماته، من رسالة أو من دفتر الزوار.</p>
      <div className="stack" style={{ marginTop: 16 }}>
        <div className="field"><label htmlFor="rN">اسم الزبون</label><input className="inp" id="rN" defaultValue={r?.name || ''} placeholder="مثل: سالم ع." autoFocus maxLength={80} /></div>
        <div className="field">
          <span className="lab">التقييم</span>
          <div className="rate-pick" id="rRate" role="radiogroup" aria-label="التقييم" ref={box}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" role="radio" aria-label={`${i} من 5`} aria-checked={i === s.rate} onClick={() => {
                st.set({ rate: i })
                if (!reduceMotion()) box.current?.querySelectorAll('button').forEach((b, k) => { if (k < i) b.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1)' }], { duration: 500, delay: (k + 1) * 40, easing: SPRING }) })
              }}>
                <svg className={i <= s.rate ? 'f' : ''}><use href="#i-starf" /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="field"><label htmlFor="rX">نص التقييم</label><textarea className="inp" id="rX" rows={4} defaultValue={r?.text || ''} placeholder="اكتب ما قاله الزبون" maxLength={600} /></div>
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
      <button className="btn k press" onClick={save} disabled={s.busy}>{s.busy ? 'نحفظ…' : 'احفظ'}</button>
    </>
  )
}
