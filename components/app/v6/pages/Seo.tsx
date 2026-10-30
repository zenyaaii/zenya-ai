'use client'

/**
 * SEO, as the v6 design draws it (VIEWS.seo, kwTag): the site pills, the
 * Search Console card, Google's result drawn live as the owner types, a
 * quick check, the three fields, and the logo.
 *
 * An empty field means "write it from my site" (the design's own rule), so
 * a field shows only what the owner wrote and the automatic text is its
 * placeholder. Search Console is the real connection: connect, add the
 * site, see the numbers.
 */

import { useEffect, useRef, useState } from 'react'
import { A, type Act } from '../Home'
import { Ic, Seg, useV6 } from '../ui'
import { PageHead, at } from './kit'

export type V6SeoSite = {
  id: string
  name: string
  live: boolean
  /** «https://waha.beynoun.com», or the address it will have. */
  url: string
  auto: { title: string; desc: string; keywords: string[] }
  own: { title: string; desc: string; keywords: string[] }
  logo: string | null
}

export type GscCard =
  | { kind: 'off' }
  | { kind: 'connect'; to: Act }
  | { kind: 'publish'; to: Act }
  | { kind: 'checking' }
  | { kind: 'working' }
  | { kind: 'missing'; add: () => void }
  | { kind: 'added'; email: string | null; numbers: Act }
  | { kind: 'failed'; msg: string; retry: Act }

export type V6SeoProps = {
  sites: V6SeoSite[]
  siteId: string
  onSite: (id: string) => void
  gsc: GscCard
  titleMax: number
  descMax: number
  /** Resolves with an error in plain words, or null when saved. */
  save: (id: string, v: { title: string; desc: string; keywords: string[] }) => Promise<string | null>
  /** Resolves with the new logo's address, or an error. */
  uploadLogo: (id: string, f: File) => Promise<{ url: string } | { error: string }>
  setLogo: (id: string, url: string) => Promise<boolean>
}

export default function V6Seo(p: V6SeoProps) {
  const s = p.sites.find((x) => x.id === p.siteId) || p.sites[0]
  if (!s) {
    return (
      <>
        <PageHead title="السيو" sub="تحكّم في شكل موقعك داخل جوجل: العنوان، والوصف، والشعار." />
        <div className="card rv" style={at(3)}><div className="empty"><Ic n="g" /><b>لا مواقع بعد</b><span>أنشئ موقعًا، ثم تحكّم هنا في شكله داخل جوجل.</span></div></div>
      </>
    )
  }
  return <SeoBody key={s.id} p={p} s={s} />
}

function SeoBody({ p, s }: { p: V6SeoProps; s: V6SeoSite }) {
  const { toast } = useV6()
  const [title, setTitle] = useState(s.own.title)
  const [desc, setDesc] = useState(s.own.desc)
  const [kw, setKw] = useState<string[]>(s.own.keywords)
  const [kwIn, setKwIn] = useState('')
  const [view, setView] = useState<'m' | 'd'>('m')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logo, setLogoState] = useState(s.logo)
  const [logoBusy, setLogoBusy] = useState(false)
  const gp = useRef<HTMLDivElement>(null)
  const kwRef = useRef<HTMLInputElement>(null)
  const fileIn = useRef<HTMLInputElement>(null)
  const flashT = useRef<ReturnType<typeof setTimeout>>()

  const T = title.trim() || s.auto.title
  const D = desc.trim() || s.auto.desc
  const K = kw.length ? kw : s.auto.keywords
  const m = view === 'm', tl = m ? 58 : 62, dl = m ? 120 : 158
  const cut = (x: string, n: number) => (x.length > n ? x.slice(0, n).trim() + '…' : x)

  const checks: [boolean, string, string][] = [
    [T.includes(s.name), 'العنوان فيه اسم نشاطك', `ضع اسم «${s.name}» في بداية العنوان`],
    [T.length >= 20 && T.length <= p.titleMax, 'طول العنوان مناسب', T.length > p.titleMax ? 'العنوان طويل، سيقطعه جوجل' : 'العنوان قصير جدًا'],
    [D.length >= 80 && D.length <= p.descMax, 'طول الوصف مناسب', D.length > p.descMax ? 'الوصف طويل، سيقطعه جوجل' : 'اكتب وصفًا من 80 حرفًا على الأقل'],
    [!!logo, 'للموقع شعار', 'ارفع شعارًا ليظهر بجانب موقعك'],
    [K.length >= 2, 'أضفت كلمات بحث', 'أضف كلمتين على الأقل يبحث بها زبائنك'],
  ]
  const ok = checks.filter((c) => c[0]).length

  const live = () => {
    clearTimeout(flashT.current)
    flashT.current = setTimeout(() => {
      const g = gp.current
      if (!g) return
      g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash')
    }, 250)
  }
  useEffect(() => () => clearTimeout(flashT.current), [])

  const addKw = () => {
    const v = kwIn.trim().replace(/[،,]$/, '').trim()
    if (v && !kw.includes(v) && kw.length < 10) setKw([...kw, v])
    setKwIn('')
  }

  async function save() {
    if (title.length > p.titleMax || desc.length > p.descMax) { toast('النص أطول من المسموح، قصّره قليلًا', { ok: false }); return }
    setSaving(true)
    const err = await p.save(s.id, { title: title.trim(), desc: desc.trim(), keywords: kw })
    setSaving(false)
    if (err) { toast(err, { ok: false }); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
    toast('حُفظ. يظهر في جوجل خلال أيام')
  }

  async function upload(f: File | undefined) {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast('الصورة أكبر من 5 ميغابايت', { ok: false }); return }
    setLogoBusy(true)
    const r = await p.uploadLogo(s.id, f)
    setLogoBusy(false)
    if ('error' in r) { toast(r.error, { ok: false }); return }
    setLogoState(r.url)
    toast('تم رفع الشعار')
  }

  async function removeLogo() {
    const old = logo
    if (!old) return
    setLogoBusy(true)
    const done = await p.setLogo(s.id, '')
    setLogoBusy(false)
    if (!done) { toast('تعذّر حذف الشعار', { ok: false }); return }
    setLogoState(null)
    toast('حُذف الشعار', { undo: async () => { if (await p.setLogo(s.id, old)) setLogoState(old) } })
  }

  return (
    <>
      <PageHead title="السيو" sub="تحكّم في شكل موقعك داخل جوجل: العنوان، والوصف، والشعار." />
      <div className="site-pills rv" style={at(2)} role="group" aria-label="اختر الموقع">
        {p.sites.map((x) => (
          <button key={x.id} type="button" className="press" aria-pressed={x.id === s.id} onClick={() => { if (x.id !== s.id) p.onSite(x.id) }}>
            <span className={`dot ${x.live ? 'ok' : 'warn'}`} />{x.name}
          </button>
        ))}
      </div>
      <Gsc g={p.gsc} name={s.name} />
      <div className="seo-layout">
        <section className="seo-prev stack rv" style={at(4)}>
          <div className="card">
            <div className="card-h"><h2 className="t-h3">معاينة نتيجة جوجل</h2><Seg<'m' | 'd'> items={[['m', 'جوال'], ['d', 'كمبيوتر']]} value={view} onChange={setView} label="الجهاز" /></div>
            <div className="gprev" id="gPrev" ref={gp}>
              <div className="g-site">
                <span className="fav">{logo ? <img src={logo} alt="" /> : <Ic n="globe" />}</span>
                <span className="trunc"><b>{s.name}</b><span>{s.url}</span></span>
              </div>
              <div className="g-t">{cut(T, tl)}</div>
              <div className="g-d">{cut(D, dl)}</div>
            </div>
            <p className="t-small" style={{ marginTop: 12 }}>هكذا يظهر موقعك عندما يبحث عنه أحد. تتغير المعاينة وأنت تكتب.</p>
          </div>
          <div className="card">
            <div className="card-h"><h2 className="t-h3">فحص سريع</h2><span className={`pill ${ok === checks.length ? 'ok' : ok >= 3 ? 'blue' : 'warn'}`}>{ok} من {checks.length}</span></div>
            <div className="rows">
              {checks.map((c) => (
                <div key={c[1]} className="r" style={{ minHeight: 52 }}>
                  <span className={`tile ${c[0] ? 'ok' : 'warn'}`} style={{ width: 32, height: 32, borderRadius: 10 }}><Ic n={c[0] ? 'check' : 'help'} /></span>
                  <span className="tx"><b style={{ fontSize: 14, fontWeight: 600 }}>{c[0] ? c[1] : c[2]}</b></span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="stack rv" style={at(5)}>
          <div className="card">
            <h2 className="t-h3">بيانات البحث</h2>
            <p className="t-small" style={{ marginTop: 4 }}>اترك الحقل فارغًا لنكتبه تلقائيًا من محتوى موقعك.</p>
            <div className="stack" style={{ marginTop: 16 }}>
              <div className="field">
                <label htmlFor="sT">عنوان الصفحة <span className={`cnt num${title.length > p.titleMax ? ' over' : ''}`}>{title.length}/{p.titleMax}</span></label>
                <input className="inp" id="sT" value={title} placeholder={s.auto.title} onChange={(e) => { setTitle(e.target.value); live() }} />
                <span className="hint">السطر الأزرق الكبير. ابدأ باسم نشاطك.</span>
              </div>
              <div className="field">
                <label htmlFor="sD">الوصف <span className={`cnt num${desc.length > p.descMax ? ' over' : ''}`}>{desc.length}/{p.descMax}</span></label>
                <textarea className="inp" id="sD" rows={3} value={desc} placeholder={s.auto.desc || 'جملة أو جملتان عن نشاطك'} onChange={(e) => { setDesc(e.target.value); live() }} />
                <span className="hint">السطر الرمادي تحت العنوان. اجعله دعوة واضحة.</span>
              </div>
              <div className="field">
                <span className="lab">كلمات يبحث بها زبائنك <span className="t-micro">اضغط Enter بعد كل كلمة</span></span>
                <div className="kw" id="kw" onClick={(e) => { if (e.target === e.currentTarget) kwRef.current?.focus() }}>
                  {kw.map((v) => (
                    <span key={v} className="tag"><span className="trunc">{v}</span><button type="button" aria-label={`احذف ${v}`} onClick={() => setKw(kw.filter((x) => x !== v))}><Ic n="x" /></button></span>
                  ))}
                  <input
                    id="kwIn" ref={kwRef} value={kwIn} aria-label="أضف كلمة"
                    placeholder={kw.length ? '' : s.auto.keywords.length ? 'مثل: ' + s.auto.keywords.slice(0, 2).join('، ') : 'مثل: مطعم شامي'}
                    onChange={(e) => setKwIn(e.target.value)}
                    onBlur={() => { if (kwIn.trim()) addKw() }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',' || e.key === '،') && kwIn.trim()) { e.preventDefault(); addKw() }
                      if (e.key === 'Backspace' && !kwIn && kw.length) setKw(kw.slice(0, -1))
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="row-wrap" style={{ marginTop: 20 }}>
              <button className="btn k press" onClick={save} disabled={saving}>{saving ? 'نحفظ…' : 'احفظ التغييرات'}</button>
              <button className="btn line press" onClick={() => {
                const old = { title, desc, kw }
                setTitle(''); setDesc(''); setKw([]); live()
                toast('رجعنا للنص التلقائي. احفظ ليُعتمد', { undo: () => { setTitle(old.title); setDesc(old.desc); setKw(old.kw) } })
              }}>إعادة تعيين</button>
              <span className={`saved${saved ? ' on' : ''}`}><Ic n="check" />حُفظ</span>
            </div>
          </div>
          <div className="card">
            <h2 className="t-h3">شعار الموقع</h2>
            <p className="t-small" style={{ marginTop: 4 }}>يظهر في تبويب المتصفح وبجانب موقعك في جوجل. بدون شعار لا تظهر أي أيقونة.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 16 }}>
              <div className="logo-box" id="logoBox">{logo ? <img src={logo} alt="الشعار الحالي" /> : 'لا يوجد'}</div>
              <div className="row-wrap">
                <button className="btn k press" disabled={logoBusy} onClick={() => fileIn.current?.click()}>
                  <Ic n={logoBusy ? 'refresh' : 'upload'} className={logoBusy ? 'spin' : ''} />{logo ? 'غيّر الشعار' : 'ارفع الشعار'}
                </button>
                {logo && <button className="btn line press" disabled={logoBusy} onClick={removeLogo}>احذف</button>}
              </div>
            </div>
            <p className="t-small" style={{ marginTop: 12 }}>صورة مربعة أفضل، PNG أو JPG، حتى 5 ميغابايت.</p>
            <input ref={fileIn} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        </section>
      </div>
    </>
  )
}

/* ---- the Search Console card ------------------------------------------------ */
function Gsc({ g, name }: { g: GscCard; name: string }) {
  if (g.kind === 'off') return null
  const row = (tile: string, pill: React.ReactNode, lines: React.ReactNode, act: React.ReactNode) => (
    <div className="card rv" style={{ ...at(3), marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' }}>
        <span className={`tile ${tile}`}><Ic n="g" /></span>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <b style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>Google Search Console {pill}</b>
          {lines}
        </div>
        {act}
      </div>
    </div>
  )
  switch (g.kind) {
    case 'added':
      return row('blue', <span className="pill ok">مُضاف</span>, <>
        <span className="t-small" style={{ display: 'block' }}>«{name}» مُضاف، وجوجل يرسل أرقامه.</span>
        {g.email && <span className="t-small ltr" style={{ display: 'block', textAlign: 'right' }}>{g.email}</span>}
      </>, <A to={g.numbers} className="btn sm press"><Ic n="chart" />شاهد الأرقام</A>)
    case 'publish':
      return row('', <span className="pill">غير منشور</span>,
        <span className="t-small">انشر «{name}» أولًا، ثم نضيفه إلى جوجل بنقرة واحدة.</span>,
        <A to={g.to} className="btn sm acc press"><Ic n="globe" />انشر</A>)
    case 'connect':
      return row('', <span className="pill">غير مربوط</span>,
        <span className="t-small" style={{ display: 'block' }}>اربط حسابك في Google لترى كيف يظهر «{name}» في البحث.</span>,
        <A to={g.to} className="btn sm acc press"><Ic n="g" />اربطه</A>)
    case 'missing':
      return row('blue', <span className="pill warn">غير مُضاف</span>,
        <span className="t-small">حسابك مربوط. أضف «{name}» إلى جوجل ليبدأ إرسال الأرقام.</span>,
        <button className="btn sm k press" onClick={g.add}><Ic n="plus" />أضف الموقع</button>)
    case 'checking':
    case 'working':
      return row('blue', <span className="pill">{g.kind === 'working' ? 'نضيفه الآن' : 'نتحقق'}</span>,
        <span className="t-small">{g.kind === 'working' ? `نضيف «${name}» إلى جوجل ونرسل خريطة الموقع…` : 'نتحقق من حالة الموقع في جوجل…'}</span>,
        <button className="btn sm press" disabled><Ic n="refresh" className="spin" />انتظر</button>)
    case 'failed':
      return row('', <span className="pill bad">لم يكتمل</span>,
        <span className="t-small">{g.msg}</span>,
        <A to={g.retry} className="btn sm press"><Ic n="refresh" />أعد المحاولة</A>)
  }
}
