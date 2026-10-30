'use client'

/**
 * SITES, as the v6 design draws it (VIEWS.sites, siteDetail, shareSheet and
 * publishSheet in the design file): the filter, a card per site with its
 * phone picture, and under them the chosen site's own page of shortcuts.
 *
 * What the design faked is real here. «انشر» checks the address with the
 * server and publishes; the three steps run while the request is out. The
 * quick switches are the site's own (lib/site-switches), the hours are the
 * template's, and the QR is a picture of the real address.
 */

import { useEffect, useRef, useState } from 'react'
import { validateSlug, slugErrorMessage } from '@/lib/slug'
import { A, type Act } from '../Home'
import { Ic, Seg, useV6 } from '../ui'
import { PageHead, Switch, at, copy, store, useStore, type Store } from './kit'

export type V6Hours = { d: string; on: boolean; from: string; to: string }
export type SwitchKey = 'bookings' | 'wa' | 'reviews'

export type V6SiteRow = {
  id: string
  name: string
  /** «مطعم» */
  kind: string
  live: boolean
  /** The address without https://, when the site is live. */
  host: string | null
  url: string | null
  /** «قبل 3 أيام» */
  updated: string
  /** The phone picture on the card. */
  cover: string | null
  edit: Act
  preview: Act
  /** A Shopify theme: it is downloaded, not published. */
  shopify?: Act
  /** Pictures of the gallery this site uses. */
  photos: number
  /** A restaurant's menu: dishes and sections. */
  menu?: { dishes: number; cats: number } | null
  /** The week, for a template that keeps its hours day by day. */
  hours?: V6Hours[] | null
  /** The quick switches; null where the template has no such thing. */
  sw: Record<SwitchKey, boolean | null>
  /** The address the publish sheet suggests. */
  slugHint: string
}

export type PublishResult = { ok: true; slug: string; url: string } | { ok: false; msg: string }

export type V6SitesProps = {
  sites: V6SiteRow[]
  current: string
  onPick: (id: string) => void
  /** true: the publish sheet opens. An Act: where publishing gets unlocked. */
  canPublish: true | Act
  /** «.beynoun.com» */
  suffix: string
  links: { newSite: Act; gallery: Act; domains: Act }
  checkSlug: (slug: string) => Promise<true | string>
  publish: (id: string, slug: string) => Promise<PublishResult>
  onPublished: (id: string, slug: string, url: string) => void
  /** Resolves with what went wrong in plain words, or null when it took. */
  setSwitch: (id: string, key: SwitchKey, on: boolean) => Promise<string | null>
  saveHours: (id: string, hours: V6Hours[]) => Promise<boolean>
}

type Filter = 'all' | 'live' | 'draft'
const count = (n: number) => (n === 1 ? 'موقع واحد' : n === 2 ? 'موقعان' : n + ' مواقع')
const hoursSummary = (h: V6Hours[]) => { const open = h.filter((x) => x.on).length; return open === 7 ? 'كل يوم · ' + h[0].from + '–' + h[0].to : `${open} أيام في الأسبوع` }

export default function V6Sites(p: V6SitesProps) {
  const { toast, openSheet, closeSheet } = useV6()
  const [f, setF] = useState<Filter>('all')
  const n = p.sites.length
  const live = p.sites.filter((s) => s.live).length
  const rows = p.sites.filter((s) => f === 'all' || (f === 'live' ? s.live : !s.live))
  const cur = p.sites.find((s) => s.id === p.current) || p.sites[0]
  const detail = useRef<HTMLDivElement>(null)

  const pick = (id: string) => {
    if (id === p.current) return
    p.onPick(id)
    requestAnimationFrame(() => detail.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }

  const share = (s: V6SiteRow) => {
    if (!s.url) return
    const url = s.url
    openSheet({
      title: 'شارك موقعك',
      body: (
        <>
          <div className="sitecard" style={{ gridTemplateColumns: 'minmax(0,1fr) 88px' }}>
            <div className="meta">
              <h3>{s.name}</h3>
              <span className="addr">{url.replace('https://', '')}</span>
              <span className="t-small">أرسل الرابط لزبائنك، أو ضعه في حساب إنستغرام.</span>
            </div>
            {s.cover
              ? <div className="ph" style={{ width: 88 }}><img src={s.cover} alt={`صورة موقع ${s.name} على الجوال`} /></div>
              : <div className="ph blank" style={{ width: 88 }} aria-hidden><i /><i /><i /><i /><i /></div>}
          </div>
          <div className="rows" style={{ marginTop: 12 }}>
            <button className="r" onClick={() => { closeSheet(); copy(url); toast('تم نسخ رابط ' + s.name) }}>
              <span className="tile"><Ic n="copy" /></span><span className="tx"><b>انسخ الرابط</b><span className="ltr" style={{ textAlign: 'end' }}>{url}</span></span>
            </button>
            <a className="r" href={`https://wa.me/?text=${encodeURIComponent(`${s.name}\n${url}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => closeSheet()}>
              <span className="tile ok"><Ic n="whatsapp" /></span><span className="tx"><b>أرسل على واتساب</b><span>يفتح واتساب برسالة جاهزة</span></span>
            </a>
            <button className="r" onClick={async () => { closeSheet(); if (await saveQr(url, s.host || s.name)) toast('تم تجهيز رمز QR للتحميل'); else toast('تعذّر تجهيز رمز QR', { ok: false }) }}>
              <span className="tile"><Ic n="more" /></span><span className="tx"><b>رمز QR للطاولات</b><span>اطبعه وضعه على الطاولة أو الباب</span></span>
            </button>
          </div>
        </>
      ),
    })
  }

  const publish = (s: V6SiteRow) => {
    const st = store<PubState>({ slug: s.slugHint, av: null, busy: false, step: -1 })
    openSheet({
      title: `انشر «${s.name}»`,
      body: <PublishBody st={st} suffix={p.suffix} check={p.checkSlug} />,
      foot: (
        <PublishFoot
          st={st}
          go={async () => {
            const slug = st.get().slug
            st.set({ busy: true, step: 0 })
            const t0 = Date.now()
            const steps = [setTimeout(() => st.set({ step: 1 }), 700), setTimeout(() => st.set({ step: 2 }), 1400)]
            const r = await p.publish(s.id, slug)
            if (!r.ok) {
              steps.forEach(clearTimeout)
              st.set({ busy: false, step: -1, av: { ok: false, msg: r.msg } })
              return
            }
            await new Promise((ok) => setTimeout(ok, Math.max(0, 2100 - (Date.now() - t0))))
            st.set({ step: 3 })
            setTimeout(() => {
              closeSheet()
              toast(`«${s.name}» منشور الآن`)
              p.onPublished(s.id, r.slug, r.url)
            }, 400)
          }}
        />
      ),
    })
  }

  const flip = async (s: V6SiteRow, key: SwitchKey, on: boolean) => {
    const err = await p.setSwitch(s.id, key, on)
    if (err) { toast(err, { ok: false }); return }
    toast(key === 'bookings' ? (on ? 'تم تشغيل الحجز' : 'تم إيقاف الحجز مؤقتًا')
      : key === 'wa' ? (on ? 'زر واتساب ظاهر الآن' : 'تم إخفاء زر واتساب')
        : on ? 'قسم التقييمات ظاهر في موقعك' : 'تم إخفاء قسم التقييمات')
  }

  const hoursSheet = (s: V6SiteRow) => {
    if (!s.hours) return
    const st = store({ h: s.hours.map((x) => ({ ...x })), busy: false })
    openSheet({
      title: 'ساعات العمل',
      body: <HoursBody st={st} />,
      foot: <HoursFoot st={st} go={async () => {
        st.set({ busy: true })
        const ok = await p.saveHours(s.id, st.get().h)
        st.set({ busy: false })
        if (!ok) { toast('تعذّر حفظ ساعات العمل', { ok: false }); return }
        closeSheet()
        toast('تم حفظ ساعات العمل')
      }} />,
    })
  }

  const publishBtn = (s: V6SiteRow, cls: string, label: string, style?: React.CSSProperties) =>
    p.canPublish === true
      ? <button className={cls} style={style} onClick={() => publish(s)}><Ic n="globe" />{label}</button>
      : <A to={p.canPublish} className={cls} style={style}><Ic n="globe" />{label}</A>

  return (
    <>
      <PageHead
        title="المواقع"
        sub={`${count(n)} · ${live} منشور · ${n - live} مسودة`}
        acts={<A to={p.links.newSite} className="btn k press"><Ic n="plus" />موقع جديد</A>}
      />
      <div className="rv" style={{ ...at(2), marginBottom: 16 }}>
        <Seg<Filter> items={[['all', 'الكل', n], ['live', 'منشور', live], ['draft', 'مسودة', n - live]]} value={f} onChange={setF} label="تصفية المواقع" />
      </div>
      <div className="sites">
        {rows.map((x, i) => (
          <article
            key={x.id}
            className={`card lift scard rv${x.id === cur?.id ? ' sel' : ''}`}
            style={at(3 + i)}
            tabIndex={0}
            aria-label={x.name + (x.id === cur?.id ? '، محدد' : '')}
            onClick={(e) => { if (!(e.target as HTMLElement).closest('button,a')) pick(x.id) }}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); pick(x.id) } }}
          >
            <div className="cover">
              {x.cover
                ? <span className="mini"><img src={x.cover} alt="" /></span>
                : <span className="mini sk"><i /><i /><i /><i /><i /></span>}
              {x.shopify
                ? <span className="pill">شوبيفاي</span>
                : <span className={`pill ${x.live ? 'ok' : 'warn'}`}>{x.live ? 'منشور' : 'مسودة'}</span>}
            </div>
            <div className="body">
              <h3>{x.name}</h3>
              <span className="t-small">{x.kind} · آخر تعديل {x.updated}</span>
              {x.live && x.host && <span className="host">{x.host}</span>}
            </div>
            <div className="acts">
              <A to={x.edit} className="btn sm press"><Ic n="edit" />تعديل</A>
              <A to={x.preview} className="btn sm press"><Ic n="eye" />معاينة</A>
              {x.shopify
                ? <A to={x.shopify} className="btn sm k press"><Ic n="download" />نزّل الثيم</A>
                : x.live
                  ? <button className="btn sm k press" onClick={() => share(x)}><Ic n="share" />شارك</button>
                  : publishBtn(x, 'btn sm acc press', 'انشر')}
            </div>
          </article>
        ))}
        <A to={p.links.newSite} className="card scard add rv" style={at(3 + rows.length)}>
          <span className="tile"><Ic n="plus" /></span>أضف موقعًا جديدًا
        </A>
      </div>

      {cur && rows.some((x) => x.id === cur.id) && (
        <div className="sdetail" id="sDetail" ref={detail}>
          <section className="rv" style={at(6)}>
            <h2 className="sec-title">عدّل «{cur.name}»</h2>
            <div className="card"><div className="rows">
              <A to={cur.edit} className="r"><span className="tile"><Ic n="type" /></span><span className="tx"><b>النصوص</b><span>العنوان، والوصف، ومن نحن</span></span><Ic n="chev" className="chev" /></A>
              <A to={p.links.gallery} className="r"><span className="tile"><Ic n="gallery" /></span><span className="tx"><b>الصور</b><span className="num">{cur.photos} صور في المعرض</span></span><Ic n="chev" className="chev" /></A>
              {cur.menu && <A to={cur.edit} className="r"><span className="tile"><Ic n="menu" /></span><span className="tx"><b>قائمة الطعام</b><span><span className="num">{cur.menu.dishes}</span> طبقًا في <span className="num">{cur.menu.cats}</span> أقسام</span></span><Ic n="chev" className="chev" /></A>}
              {cur.hours && <button className="r" id="hoursBtn" onClick={() => hoursSheet(cur)}><span className="tile"><Ic n="clock" /></span><span className="tx"><b>ساعات العمل</b><span>{hoursSummary(cur.hours)}</span></span><Ic n="chev" className="chev" /></button>}
              <A to={cur.edit} className="r"><span className="tile"><Ic n="wand" /></span><span className="tx"><b>الألوان والخط</b><span>شكل الموقع العام</span></span><Ic n="chev" className="chev" /></A>
            </div></div>
          </section>
          <section className="rv" style={at(7)}>
            <h2 className="sec-title">التحكم السريع</h2>
            <div className="stack">
              {(cur.sw.bookings != null || cur.sw.wa != null || cur.sw.reviews != null) && (
                <div className="card"><div className="rows">
                  {cur.sw.bookings != null && (
                    <div className="r"><span className="tile"><Ic n="cal" /></span><span className="tx"><b>استقبال الحجوزات</b><span id="bkStateTx">{cur.sw.bookings ? 'الزوار يستطيعون الحجز الآن' : 'متوقف: لن يظهر زر الحجز في موقعك'}</span></span><span className="end"><Switch key={cur.id + 'bk'} on={cur.sw.bookings} label="استقبال الحجوزات" id="swBk" onChange={(on) => flip(cur, 'bookings', on)} /></span></div>
                  )}
                  {cur.sw.wa != null && (
                    <div className="r"><span className="tile"><Ic n="whatsapp" /></span><span className="tx"><b>زر واتساب</b><span>يظهر في أسفل كل صفحة</span></span><span className="end"><Switch key={cur.id + 'wa'} on={cur.sw.wa} label="زر واتساب" id="swWa" onChange={(on) => flip(cur, 'wa', on)} /></span></div>
                  )}
                  {cur.sw.reviews != null && (
                    <div className="r"><span className="tile"><Ic n="star" /></span><span className="tx"><b>قسم التقييمات</b><span>تختار التقييمات من صفحة التقييمات</span></span><span className="end"><Switch key={cur.id + 'rv'} on={cur.sw.reviews} label="قسم التقييمات" id="swRv" onChange={(on) => flip(cur, 'reviews', on)} /></span></div>
                  )}
                </div></div>
              )}
              {cur.shopify ? (
                <div className="card">
                  <div className="card-h"><h3 className="t-h3">ثيم شوبيفاي</h3><span className="pill">ملف</span></div>
                  <p className="t-small">هذا الموقع ملف ثيم ترفعه إلى متجرك في شوبيفاي.</p>
                  <A to={cur.shopify} className="btn k press" style={{ marginTop: 14 }}><Ic n="download" />نزّل الثيم</A>
                </div>
              ) : cur.live && cur.host ? (
                <div className="card"><div className="rows">
                  <A to={p.links.domains} className="r"><span className="tile ok"><Ic n="lock" /></span><span className="tx"><b className="ltr" style={{ textAlign: 'end' }}>{cur.host}</b><span>النطاق متصل · الأمان يعمل</span></span><Ic n="chev" className="chev" /></A>
                  <button className="r" onClick={() => { if (cur.url) { copy(cur.url); toast('تم نسخ رابط ' + cur.name) } }}><span className="tile"><Ic n="copy" /></span><span className="tx"><b>انسخ رابط الموقع</b><span>لتشاركه مع زبائنك</span></span></button>
                </div></div>
              ) : (
                <div className="card">
                  <div className="card-h"><h3 className="t-h3">الموقع غير منشور</h3><span className="pill warn">مسودة</span></div>
                  <p className="t-small">انشره على اسم مجاني مثل <span className="ltr">{cur.slugHint}{p.suffix}</span>، ثم اربط نطاقك متى شئت.</p>
                  {publishBtn(cur, 'btn acc press', 'انشر الموقع', { marginTop: 14 })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

/** A QR picture of the site's address, saved to the device. */
async function saveQr(url: string, name: string): Promise<boolean> {
  try {
    const QR = await import('qrcode')
    const png = await QR.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#16120D', light: '#FFFFFF' } })
    const a = document.createElement('a')
    a.href = png
    a.download = `qr-${name.replace(/[^\w.-]+/g, '-')}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    return true
  } catch {
    return false
  }
}

/* ---- the hours sheet ------------------------------------------------------ */
function HoursBody({ st }: { st: Store<{ h: V6Hours[]; busy: boolean }> }) {
  const s = useStore(st)
  return (
    <>
      <p className="t-small" style={{ marginBottom: 8 }}>تظهر في موقعك وفي نتيجة جوجل.</p>
      <div className="rows">
        {s.h.map((x, i) => (
          <div key={i} className="r" style={{ minHeight: 58 }}>
            <span className="tx"><b>{x.d}</b><span className="num" data-h={i}>{x.on ? x.from + ' – ' + x.to : 'مغلق'}</span></span>
            <span className="end"><Switch on={x.on} label={'مفتوح يوم ' + x.d} id={'hs' + i} onChange={(on) => st.set({ h: st.get().h.map((y, j) => (j === i ? { ...y, on } : y)) })} /></span>
          </div>
        ))}
      </div>
    </>
  )
}

function HoursFoot({ st, go }: { st: Store<{ h: V6Hours[]; busy: boolean }>; go: () => void }) {
  const s = useStore(st)
  const { closeSheet } = useV6()
  return (
    <>
      <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
      <button className="btn k press" id="hSave" onClick={go} disabled={s.busy}>احفظ</button>
    </>
  )
}

/* ---- the publish sheet --------------------------------------------------- */
type PubState = { slug: string; av: null | 'checking' | { ok: boolean; msg: string }; busy: boolean; step: number }

function PublishBody({ st, suffix, check }: { st: Store<PubState>; suffix: string; check: (s: string) => Promise<true | string> }) {
  const s = useStore(st)
  const tm = useRef<ReturnType<typeof setTimeout>>()
  const run = (v: string) => {
    clearTimeout(tm.current)
    const local = validateSlug(v)
    if (!local.ok) { st.set({ av: { ok: false, msg: v.length < 3 ? 'اكتب 3 أحرف على الأقل' : slugErrorMessage(local.reason) } }); return }
    st.set({ av: 'checking' })
    tm.current = setTimeout(async () => {
      const r = await check(v).catch(() => 'تعذّر الفحص، حاول مرة أخرى')
      if (st.get().slug !== v) return
      st.set({ av: r === true ? { ok: true, msg: 'متاح' } : { ok: false, msg: r } })
    }, 380)
  }
  // The suggested address is checked as soon as the sheet opens.
  useEffect(() => { run(st.get().slug); return () => clearTimeout(tm.current) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const av = s.av
  return (
    <>
      <p className="t-small">اختر اسمًا لعنوان موقعك. هذا العنوان مجاني ودائم.</p>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="pubName">عنوان الموقع</label>
        <div className="inp-affix" style={{ direction: 'ltr' }}>
          <input
            id="pubName" value={s.slug} autoComplete="off" spellCheck={false} style={{ textAlign: 'left' }} disabled={s.busy}
            onChange={(e) => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''); st.set({ slug: v }); run(v) }}
          />
          <span>{suffix}</span>
        </div>
        <div className={`avail${av && av !== 'checking' ? (av.ok ? ' ok' : ' bad') : ''}`} id="pubAv" role="status">
          {av === 'checking' ? 'نتحقق…' : av ? <>{av.ok && <Ic n="check" />} {av.msg}</> : null}
        </div>
      </div>
      <div className="pub-steps" hidden={s.step < 0} style={{ marginTop: 18 }}>
        {['نجهّز الصفحات', 'نفعّل شهادة الأمان', 'ننشر على الإنترنت'].map((t, i) => {
          const done = s.step > i, on = s.step === i
          return <div key={t} className={`s${done ? ' done' : on ? ' on' : ''}`}><i>{done ? <Ic n="check" /> : i + 1}</i>{t}</div>
        })}
      </div>
    </>
  )
}

function PublishFoot({ st, go }: { st: Store<PubState>; go: () => void }) {
  const s = useStore(st)
  const { closeSheet } = useV6()
  const ok = !!s.av && s.av !== 'checking' && s.av.ok
  return (
    <>
      <button className="btn press" data-close onClick={closeSheet} disabled={s.busy}>إلغاء</button>
      <button className="btn acc press" disabled={!ok || s.busy} onClick={go}>
        {s.busy ? <><Ic n="refresh" className="spin" />جارٍ النشر…</> : <><Ic n="globe" />انشر الآن</>}
      </button>
    </>
  )
}
