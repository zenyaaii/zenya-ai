'use client'

/**
 * DOMAINS, as the v6 design draws it (VIEWS.domains, dmHTML, dnsHTML,
 * manageSheet, domainSheet): every address the sites answer on, how linking
 * works, and the sheet that adds a domain the owner has or buys one.
 *
 * Real throughout: linking calls Vercel through /api/domains and prints the
 * records it asks for, «تحقّق الآن» re-checks, buying searches the registrar
 * and goes to Stripe's checkout. A disconnect waits for its «تراجع» to pass
 * before it reaches the server.
 */

import { useEffect, useRef, useState } from 'react'
import { A, type Act } from '../Home'
import { Ic, Seg, useV6 } from '../ui'
import { PageHead, at, byId, copy, shake, store, useStore, type Store } from './kit'

export type DomainState = 'live' | 'pending_dns' | 'pending_ssl' | 'error'
export type V6Domain = {
  id: string
  domain: string
  site: string
  state: DomainState
  /** The site's free address on beynoun.com. */
  free?: boolean
  /** Bought through Beynoun: when it renews. */
  renews?: string
  error?: string | null
}
export type DnsRec = { type: string; name: string; value: string }
export type BuyRow = { domain: string; price: number | null }

export type V6DomainsProps = {
  domains: V6Domain[]
  /** Published sites a domain can point at. */
  sites: { id: string; name: string }[]
  current: string
  /** true, or where linking a domain gets unlocked. */
  canConnect: true | Act
  isPro: boolean
  connect: (siteId: string, domain: string) => Promise<{ records: DnsRec[] } | { error: string }>
  check: (id: string) => Promise<{ state: DomainState; error?: string | null } | null>
  records: (id: string) => Promise<DnsRec[]>
  remove: (id: string) => Promise<boolean>
  search: (q: string) => Promise<{ rows: BuyRow[] } | { error: string }>
  /** Resolves with Stripe's checkout address, or an error. */
  buy: (domain: string, siteId: string) => Promise<{ url: string } | { error: string }>
  links: { sites: Act; pricing: Act }
}

const STATE: Record<DomainState, [string, string]> = {
  live: ['متصل', 'ok'], pending_dns: ['بانتظار DNS', 'warn'], pending_ssl: ['جارٍ إصدار SSL', 'warn'], error: ['يحتاج إصلاحًا', 'bad'],
}
const FREE_TLDS = ['store', 'site', 'online', 'shop']

function Dns({ recs }: { recs: DnsRec[] }) {
  const { toast } = useV6()
  return (
    <div className="dns">
      {recs.map((r) => (
        <div key={r.type + r.name + r.value} className="rec">
          <span><small>النوع</small><span className="k">{r.type}</span></span>
          <span style={{ minWidth: 0 }}><small>الاسم: {r.name || '@'}</small><b>{r.value}</b></span>
          <button className="btn sm press" aria-label={`انسخ ${r.value}`} onClick={() => { copy(r.value); toast('تم نسخ ' + r.value) }}><Ic n="copy" /></button>
        </div>
      ))}
    </div>
  )
}

export default function V6Domains(p: V6DomainsProps) {
  const { toast, openSheet, closeSheet } = useV6()
  const [gone, setGone] = useState<Set<string>>(new Set())
  const [checking, setChecking] = useState<string | null>(null)
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const removeRef = useRef(p.remove)
  removeRef.current = p.remove
  useEffect(() => () => { pending.current.forEach((t, id) => { clearTimeout(t); removeRef.current(id) }) }, [])

  const list = p.domains.filter((d) => !gone.has(d.id))

  async function check(d: V6Domain) {
    setChecking(d.id)
    const r = await p.check(d.id)
    setChecking(null)
    if (!r) { toast('تعذّر فحص ' + d.domain, { ok: false }); return }
    if (r.state === 'live') toast(d.domain + ' متصل الآن')
    else if (r.state === 'error') toast(r.error || 'السجلات غير صحيحة بعد. راجعها عند شركة النطاق', { ok: false })
    // Not there yet: the records come up again, to compare with the registrar's.
    else { toast('لم يصل التحديث بعد. جرّب بعد قليل', { ok: false }); manage(d) }
  }

  function manage(d: V6Domain) {
    const st = store<{ recs: DnsRec[] | null }>({ recs: null })
    if (!d.free) p.records(d.id).then((recs) => st.set({ recs })).catch(() => st.set({ recs: [] }))
    openSheet({
      title: d.domain,
      body: <ManageBody d={d} st={st} />,
      foot: d.free
        ? <button className="btn k press block" onClick={() => { closeSheet(); copy('https://' + d.domain); toast('تم نسخ https://' + d.domain) }}><Ic n="copy" />انسخ العنوان</button>
        : <>
          <button className="btn danger press" onClick={() => {
            closeSheet()
            setGone((g) => new Set(g).add(d.id))
            pending.current.set(d.id, setTimeout(async () => {
              pending.current.delete(d.id)
              if (!(await removeRef.current(d.id))) {
                setGone((g) => { const n = new Set(g); n.delete(d.id); return n })
                toast('تعذّر فصل ' + d.domain, { ok: false })
              }
            }, 5200))
            toast('فُصل ' + d.domain, {
              undo: () => {
                clearTimeout(pending.current.get(d.id))
                pending.current.delete(d.id)
                setGone((g) => { const n = new Set(g); n.delete(d.id); return n })
              },
            })
          }}><Ic n="trash" />افصل النطاق</button>
          <button className="btn press" data-close onClick={closeSheet}>تم</button>
        </>,
    })
  }

  function add(mode: 'own' | 'buy') {
    if (p.canConnect !== true) return
    if (!p.sites.length) { toast('انشر موقعك أولًا، ثم اربط نطاقك به', { ok: false }); return }
    const sid = p.sites.some((s) => s.id === p.current) ? p.current : p.sites[0].id
    const st = store<AddState>({ mode, sid, dom: '', recs: null, busy: false, rows: null, searching: false })
    openSheet({
      title: 'أضف نطاقًا',
      body: <AddBody st={st} p={p} />,
      foot: <AddFoot st={st} p={p} />,
    })
  }

  const addBtn = (cls: string, label: React.ReactNode, mode: 'own' | 'buy') =>
    p.canConnect === true
      ? <button className={cls} onClick={() => add(mode)}>{label}</button>
      : <A to={p.canConnect} className={cls}>{label}</A>

  return (
    <>
      <PageHead
        title="النطاقات"
        sub="اربط نطاقك الخاص بموقعك، وبينون تتكفّل بشهادة الأمان والتجديد."
        acts={addBtn('btn k press', <><Ic n="plus" />أضف نطاقًا</>, 'own')}
      />
      <section className="card rv" style={{ ...at(3), paddingBlock: 4 }}>
        {list.length ? list.map((d) => {
          const [label, tone] = d.free ? ['مجاني', ''] : STATE[d.state]
          const waiting = tone === 'warn'
          return (
            <div key={d.id} className="dm">
              <span className={`tile ${tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn' : ''}`}><Ic n={tone === 'ok' ? 'lock' : tone === 'warn' ? 'clock' : 'globe'} /></span>
              <div className="tx">
                <b>{d.domain}</b>
                <span>{d.site} · {d.free ? 'عنوان مجاني دائم' : d.state === 'error' ? (d.error || 'السجلات غير صحيحة') : waiting ? 'ننتظر سجلّات DNS' : 'يتجدّد ' + (d.renews || 'تلقائيًا')}</span>
              </div>
              <div className="end">
                <span className={`pill ${tone}`}>{label}</span>
                {d.state === 'live' && <span className="pill ok"><Ic n="shield" />SSL</span>}
                {waiting
                  ? <button className="btn sm press" disabled={checking === d.id} onClick={() => check(d)}><Ic n="refresh" className={checking === d.id ? 'spin' : ''} />تحقّق الآن</button>
                  : <button className="btn sm line press" onClick={() => manage(d)}>إدارة</button>}
              </div>
            </div>
          )
        }) : <div className="empty"><Ic n="globe" /><b>لا نطاقات بعد</b></div>}
      </section>
      <h2 className="sec-title rv" style={{ ...at(4), marginTop: 28 }}>كيف يعمل الربط</h2>
      <div className="steps3 rv" style={at(5)}>
        {[['أضف النطاق هنا', 'اكتب النطاق الذي اشتريته، مثل darnoor.ae'], ['انسخ سجلّين', 'نعطيك سجلّين، تضعهما عند الشركة التي اشتريت منها النطاق'], ['انتظر قليلًا', 'يعمل عادة خلال ساعة، وأحيانًا حتى 24 ساعة. شهادة الأمان مجانية وتلقائية']].map((x, i) => (
          <div key={x[0]} className="st"><i className="num">{i + 1}</i><span><b>{x[0]}</b><span>{x[1]}</span></span></div>
        ))}
      </div>
      {p.isPro ? (
        <div className="banner info rv" style={{ ...at(6), marginTop: 16 }}>
          <span className="tx">باقتك Pro تشمل نطاقًا مجانيًا لسنة كاملة، بنهاية <span className="ltr">.store</span> أو <span className="ltr">.site</span> أو <span className="ltr">.online</span> أو <span className="ltr">.shop</span></span>
          {addBtn('btn sm press', 'اختر نطاقك', 'buy')}
        </div>
      ) : (
        <div className="banner info rv" style={{ ...at(6), marginTop: 16 }}>
          <span className="tx">باقة Pro تشمل نطاقًا مجانيًا لسنة كاملة، بنهاية <span className="ltr">.store</span> أو <span className="ltr">.site</span> أو <span className="ltr">.online</span> أو <span className="ltr">.shop</span></span>
          <A to={p.links.pricing} className="btn sm press">طالع الباقات</A>
        </div>
      )}
    </>
  )
}

/* ---- manage -------------------------------------------------------------------- */
function ManageBody({ d, st }: { d: V6Domain; st: Store<{ recs: DnsRec[] | null }> }) {
  const { recs } = useStore(st)
  return (
    <>
      <div className="facts" style={{ marginTop: 0 }}>
        <div><span>الحالة</span><b>{d.free ? 'مجاني' : STATE[d.state][0]}</b></div>
        <div><span>الموقع</span><b>{d.site}</b></div>
        <div><span>شهادة الأمان</span><b>{d.state === 'live' ? 'تعمل' : 'بانتظار الربط'}</b></div>
        <div><span>التجديد</span><b>{d.free ? 'دائمًا' : d.renews || '—'}</b></div>
      </div>
      {d.free
        ? <p className="t-small" style={{ marginTop: 16 }}>هذا العنوان مجاني ودائم، ويبقى يعمل حتى بعد ربط نطاقك الخاص.</p>
        : <>
          <h3 className="t-h3" style={{ marginTop: 20 }}>سجلات DNS</h3>
          <p className="t-small">{d.state === 'live' ? 'هذه السجلات موجودة عند شركة النطاق. لا تحذفها.' : 'ضع هذه السجلات عند الشركة التي اشتريت منها النطاق.'}</p>
          {recs == null ? <p className="t-small" style={{ marginTop: 12 }}>نحمّل السجلات…</p> : recs.length ? <Dns recs={recs} /> : <p className="t-small" style={{ marginTop: 12 }}>لا سجلات مطلوبة الآن.</p>}
        </>}
    </>
  )
}

/* ---- add --------------------------------------------------------------------------- */
type AddState = { mode: 'own' | 'buy'; sid: string; dom: string; recs: DnsRec[] | null; busy: boolean; rows: BuyRow[] | null; searching: boolean }

function AddBody({ st, p }: { st: Store<AddState>; p: V6DomainsProps }) {
  const s = useStore(st)
  const { toast } = useV6()
  const step2 = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!s.recs || !step2.current) return
    step2.current.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' })
    document.querySelector('.sheet .sh-body')?.scrollTo({ top: 9999, behavior: 'smooth' })
  }, [s.recs])

  async function search() {
    const v = (byId('bIn')?.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].replace(/[^a-z0-9-]/g, '')
    if (v.length < 2) { shake(byId('bIn')); return }
    st.set({ searching: true, rows: null })
    const r = await p.search(v)
    st.set({ searching: false, rows: 'rows' in r ? r.rows : [] })
    if ('error' in r) toast(r.error, { ok: false })
  }

  async function pick(domain: string) {
    st.set({ busy: true })
    const r = await p.buy(domain, st.get().sid)
    if ('url' in r) { window.location.href = r.url; return }
    st.set({ busy: false })
    toast(r.error, { ok: false })
  }

  return (
    <>
      <Seg<'own' | 'buy'> className="fill" label="الطريقة" value={s.mode} onChange={(m) => st.set({ mode: m, recs: null, dom: '' })}
        items={[['own', 'عندي نطاق'], ['buy', 'اشترِ نطاقًا']]} />
      <div id="dBody" style={{ marginTop: 18 }}>
        {s.mode === 'own' ? (
          <>
            <div className="field"><label htmlFor="dIn">النطاق</label><input className="inp ltr" id="dIn" placeholder="example.com" autoComplete="off" spellCheck={false} style={{ textAlign: 'left' }} autoFocus readOnly={!!s.recs} /></div>
            <div className="field" style={{ marginTop: 14 }}><span className="lab">لأي موقع؟</span>
              <Seg<string> items={p.sites.map((x) => [x.id, x.name])} value={s.sid} onChange={(v) => st.set({ sid: v })} label="الموقع" />
            </div>
            <div id="dStep2" ref={step2}>
              {s.recs && <>
                <h3 className="t-h3" style={{ marginTop: 20 }}>{s.recs.length === 2 ? 'ضع هذين السجلّين عند شركة النطاق' : 'ضع هذه السجلّات عند شركة النطاق'}</h3>
                <p className="t-small">ادخل حسابك عند الشركة التي اشتريت منها <span className="ltr">{s.dom}</span>، وافتح إعدادات DNS.</p>
                <Dns recs={s.recs} />
              </>}
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="bIn">اسم النطاق الذي تريده</label>
              <div className="inp-row">
                <input className="inp ltr" id="bIn" placeholder="darnoor" autoComplete="off" spellCheck={false} style={{ textAlign: 'left' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') search() }} />
                <button className="btn k press" onClick={search} disabled={s.searching}><Ic n="search" />ابحث</button>
              </div>
            </div>
            <div className="results" id="bRes">
              {s.searching && <p className="t-small"><Ic n="refresh" className="spin" /> نبحث…</p>}
              {s.rows?.map((r, i) => {
                const free = p.isPro && FREE_TLDS.includes(r.domain.split('.').pop() || '')
                return (
                  <div key={r.domain} className="res" style={{ animationDelay: `${i * 60}ms` }}>
                    <b>{r.domain}</b>
                    <span className="end">
                      {free
                        ? <span className="price" style={{ color: 'var(--ok)' }}>مجاني مع Pro</span>
                        : r.price != null && <span className="price num" style={{ color: 'var(--ink)' }}>{r.price.toFixed(2)}$ / سنة</span>}
                      <button className="btn sm k press" disabled={s.busy} onClick={() => pick(r.domain)}>اختر</button>
                    </span>
                  </div>
                )
              })}
              {s.rows && !s.rows.length && !s.searching && <p className="t-small">لا نتائج. جرّب اسمًا آخر.</p>}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function AddFoot({ st, p }: { st: Store<AddState>; p: V6DomainsProps }) {
  const s = useStore(st)
  const { toast, closeSheet } = useV6()
  async function next() {
    const v = (byId('dIn')?.value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v)) { shake(byId('dIn')); toast('اكتب النطاق هكذا: example.com', { ok: false }); return }
    st.set({ busy: true })
    const r = await p.connect(s.sid, v)
    if ('error' in r) { st.set({ busy: false }); toast(r.error, { ok: false }); return }
    st.set({ busy: false, dom: v, recs: r.records })
  }
  if (s.mode === 'buy') return <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
  return (
    <>
      <button className="btn press" data-close onClick={closeSheet}>إلغاء</button>
      {s.recs
        ? <button className="btn k press" onClick={() => { closeSheet(); toast('أضفنا ' + s.dom + '. نتحقق منه تلقائيًا') }}>{s.recs.length === 2 ? 'تم، أضفتهما' : 'تم، أضفتها'}</button>
        : <button className="btn k press" onClick={next} disabled={s.busy}>{s.busy ? 'نضيفه…' : 'التالي'}</button>}
    </>
  )
}
