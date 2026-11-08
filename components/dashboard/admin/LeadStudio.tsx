'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdminDashboard from '../AdminDashboard'
import Notes from './Notes'
import BrandLibrary from './BrandLibrary'

/**
 * استوديو العملاء — the founder's leads + WhatsApp inbox (layout B, "today").
 *
 * Nothing here sends by itself. Every message is one click by the admin:
 * «أرسل» sends the approved first message with the lead's site link, and the
 * inbox composer sends free text while WhatsApp's 24-hour window is open.
 * Colours come from the product tokens, so it follows the dashboard theme.
 */

type Lead = {
  id: string; name: string; kind: string | null; country: string | null; city: string | null; area: string | null
  address: string | null; rating: number | null; reviews: number | null; phone: string | null; wa: string | null
  maps: string | null; social: string | null; site: string | null; status: string; sent_at: string | null; notes: string | null
  build?: Report | null
}
/** lib/lead-build.ts BuildReport: what the last build of this lead found and scored. */
type Report = {
  at: string; kind: string; url: string; score: number | null; rounds: number[]; why: string[]; missing: string[]
  social: { instagram?: string; facebook?: string; found?: string } | null
  photos: { google: number; used: number } | null
  outages: Outage[]
}
type Outage = { service: 'anthropic' | 'apify' | 'google'; reason: string; fix: string; at?: string }
const SERVICE: Record<Outage['service'], { t: string; href: string; stops: string }> = {
  anthropic: { t: 'Anthropic (Claude)', href: 'https://platform.claude.com/settings/billing', stops: 'كل البناء متوقف حتى تصلحه' },
  apify: { t: 'Apify', href: 'https://console.apify.com/billing', stops: 'المواقع تُبنى، لكن بلا صور إنستغرام وفيسبوك' },
  google: { t: 'Google Places', href: 'https://console.cloud.google.com/billing', stops: 'كل البناء متوقف حتى تصلحه' },
}
/** The AI visitor's score as a tag: 8+ good, 6–7 fair, 5 and under weak. */
const scoreTone = (n: number) => (n >= 8 ? 'ok' : n >= 6 ? 'warn' : 'err')
const low = (l: Lead) => typeof l.build?.score === 'number' && l.build.score < 8
type Thread = { wa: string; lead_id: string | null; unread: number; lastIn: string | null; last: { direction: string; body: string; at: string } }
type Msg = { id: number; direction: 'in' | 'out'; kind: string; body: string; status: string | null; error: string | null; at: string }

const COUNTRY: Record<string, string> = {
  EG: 'مصر', SA: 'السعودية', JO: 'الأردن', LB: 'لبنان', SY: 'سوريا', IQ: 'العراق', AE: 'الإمارات', KW: 'الكويت',
  QA: 'قطر', BH: 'البحرين', OM: 'عُمان', MA: 'المغرب', TN: 'تونس', DZ: 'الجزائر', LY: 'ليبيا',
}
type Stage = 'nosite' | 'ready' | 'waiting' | 'replied' | 'client' | 'lost'
const stageOf = (l: Lead): Stage =>
  l.status === 'client' ? 'client'
  : l.status === 'no' ? 'lost'
  : l.status === 'replied' || l.status === 'later' ? 'replied'
  : l.status === 'sent' || l.status === 'noans' ? 'waiting'
  : l.site ? 'ready' : 'nosite'
const STAGES: Array<{ id: Stage; t: string; tone: string }> = [
  { id: 'nosite', t: 'بلا موقع', tone: 'mute' },
  { id: 'ready', t: 'الموقع جاهز', tone: 'acc' },
  { id: 'waiting', t: 'أُرسل · ننتظر', tone: 'blue' },
  { id: 'replied', t: 'ردّ', tone: 'warn' },
  { id: 'client', t: 'عميل', tone: 'ok' },
  { id: 'lost', t: 'رفض', tone: 'err' },
]
const place = (l: Lead) => [COUNTRY[l.country ?? ''] ?? l.country, (l.city ?? '').replace(/[‪-‮]/g, '').replace('محافظة ', '')].filter(Boolean).join(' · ')
const when = (iso: string) => {
  const d = new Date(iso), now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('ar', { day: 'numeric', month: 'short' })
}

type Tab = 'today' | 'leads' | 'inbox' | 'stats' | 'notes' | 'brand'

export default function LeadStudio() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [outages, setOutages] = useState<Outage[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [open, setOpen] = useState<Lead | null>(null)     // lead sheet
  const [chat, setChat] = useState<string | null>(null)   // wa number of open chat
  const [toast, setToast] = useState<string | null>(null)
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600) }

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch('/api/admin/leads', { cache: 'no-store' }),
      fetch('/api/admin/wa/threads', { cache: 'no-store' }),
    ])
    if (!a.ok) { setErr(a.status === 403 ? 'للإدارة فقط.' : `تعذّر التحميل (${a.status})`); return }
    const j = await a.json()
    setLeads(j.leads ?? []); setOutages(j.outages ?? [])
    if (b.ok) setThreads((await b.json()).threads ?? [])
    setErr(null)
  }, [])
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])

  const byId = useMemo(() => new Map((leads ?? []).map((l) => [l.id, l])), [leads])
  const byWa = useMemo(() => new Map((leads ?? []).map((l) => [l.wa ?? '', l])), [leads])
  const of = (s: Stage) => (leads ?? []).filter((l) => stageOf(l) === s)
  // Sites to rebuild with the newest build system: every lead site except a customer's own.
  const rebuildable = (leads ?? []).filter((l) => l.site && l.status !== 'client')
  const unread = threads.filter((t) => t.unread > 0)

  async function patch(id: string, body: Partial<Lead>) {
    const r = await fetch('/api/admin/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { say(j.error || 'تعذّر الحفظ'); return }
    setLeads((ls) => ls?.map((l) => (l.id === id ? j.lead : l)) ?? null)
    setOpen((o) => (o?.id === id ? j.lead : o))
  }
  async function sendGift(l: Lead) {
    if (!confirm(`إرسال رسالتك الثابتة مع رابط الموقع إلى «${l.name}»؟`)) return
    const r = await fetch('/api/admin/wa/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: l.id, mode: 'gift' }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { say(j.error || 'لم تُرسل'); return }
    say('أُرسلت ✓'); load()
  }
  const [building, setBuilding] = useState<Set<string>>(new Set())
  async function build(l: Lead, quiet = false, rebuild = false): Promise<boolean> {
    setBuilding((b) => new Set(b).add(l.id)); if (!quiet) say(`${rebuild ? 'أعيد بناء' : 'أعمل'} موقع «${l.name}»… (دقيقتان تقريباً)`)
    try {
      const r = await fetch('/api/admin/leads/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, rebuild }) })
      const j = await r.json().catch(() => ({}))
      if (j.outage) {
        // A paid service stopped: the rest of a bulk run would fail the same way.
        if (j.outage.service !== 'apify') stopRef.current = true
        setOutages((os) => [...os.filter((o) => o.service !== j.outage.service), j.outage])
        say(`توقف البناء: ${j.outage.reason}`); return false
      }
      if (!r.ok) { if (!quiet) say(j.error || 'تعذّر البناء'); return false }
      setLeads((ls) => ls?.map((x) => (x.id === l.id ? j.lead : x)) ?? null)
      setOpen((o) => (o?.id === l.id ? j.lead : o))
      if (j.report?.outages?.length) setOutages((os) => [...os.filter((o) => !j.report.outages.some((n: Outage) => n.service === o.service)), ...j.report.outages])
      const sc = j.report?.score
      if (!quiet) say(`${j.replaced ? 'أُعيد بناؤه على نفس الرابط' : 'نُشر'} ✓${typeof sc === 'number' ? ` · ${sc}/10${sc < 8 && j.report.why?.[0] ? ` — ${j.report.why[0]}` : ''}` : ''}`)
      return true
    } catch { if (!quiet) say('تعذّر البناء'); return false }
    finally { setBuilding((b) => { const n = new Set(b); n.delete(l.id); return n }) }
  }
  // «اعمل الكل»: every lead without a site, three at a time, until done or stopped.
  const [bulk, setBulk] = useState<{ done: number; failed: number; total: number } | null>(null)
  const stopRef = useRef(false)
  async function buildAll(list: Lead[], rebuild = false) {
    if (!list.length || bulk) return
    if (!confirm(rebuild
      ? `أعد بناء ${list.length} موقعاً بالنظام الجديد على نفس روابطها؟ كل موقع يُنشر، ودرجته وأسبابها تظهر هنا. اترك الصفحة مفتوحة.`
      : `اعمل ${list.length} موقعاً الآن؟ كل موقع يأخذ دقيقة تقريباً، وتبني الصفحة 3 مواقع معاً. اترك الصفحة مفتوحة.`)) return
    stopRef.current = false
    const queue = [...list]; let done = 0, failed = 0
    setBulk({ done, failed, total: list.length })
    const worker = async () => {
      while (queue.length && !stopRef.current) {
        const ok = await build(queue.shift()!, true, rebuild)
        ok ? done++ : failed++
        setBulk({ done, failed, total: list.length })
      }
    }
    await Promise.all([worker(), worker(), worker()])
    setBulk(null)
    say(stopRef.current && failed ? 'توقف البناء: خدمة مدفوعة متوقفة، انظر التنبيه في «اليوم»' : `انتهى: ${done} موقع منشور${failed ? ` · ${failed} لم ينجح` : ''}`)
  }
  function openChat(wa: string) { setChat(wa); setTab('inbox') }

  const counts = leads ? [
    ['العملاء', leads.length], ['لهم موقع', leads.filter((l) => l.site).length],
    ['أُرسل لهم', leads.filter((l) => l.sent_at || ['sent', 'replied', 'client', 'later', 'noans', 'no'].includes(l.status)).length],
    ['ردّوا', leads.filter((l) => ['replied', 'client', 'later', 'no'].includes(l.status)).length],
    ['صاروا عملاء', of('client').length],
  ] as const : []

  return (
    <div className="ls" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="nav" role="tablist">
        {([['today', 'اليوم', I.today], ['leads', 'العملاء', I.leads], ['inbox', 'الرسائل', I.inbox], ['stats', 'التحليلات', I.stats], ['notes', 'الملاحظات', I.notes], ['brand', 'الهوية', I.brand]] as const).map(([id, t, ic]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); if (id !== 'inbox') setChat(null) }}>
            <svg viewBox="0 0 24 24" aria-hidden>{ic}</svg><span>{t}</span>
            {id === 'inbox' && unread.length > 0 && <b className="n num">{unread.length}</b>}
          </button>
        ))}
      </nav>

      <div className="main">
        <header className="top">
          <h1>استوديو <i>العملاء</i></h1>
          <span className="sp" />
          <span className="pill">الإرسال بيدك فقط</span>
        </header>

        {bulk && (
          <div className="bulk">
            <span>أعمل المواقع… <b className="num">{bulk.done + bulk.failed}</b> من <b className="num">{bulk.total}</b>{bulk.failed > 0 && <> · لم ينجح <b className="num">{bulk.failed}</b></>}</span>
            <div className="bar"><i style={{ width: `${((bulk.done + bulk.failed) / bulk.total) * 100}%` }} /></div>
            <button className="btn sm ghost" onClick={() => { stopRef.current = true }}>أوقف</button>
          </div>
        )}
        {tab === 'stats' ? <AdminDashboard /> : tab === 'notes' ? <Notes say={say} /> : tab === 'brand' ? <BrandLibrary say={say} /> : err ? <div className="note">{err}</div> : !leads ? <div className="note">جارٍ التحميل…</div> : (
          <>
            {tab === 'today' && (
              <>
                <div className="funnel">
                  {counts.map(([l, v]) => (
                    <div key={l} className="fstep"><div className="v num">{v}</div><div className="l">{l}</div>
                      <div className="bar"><i style={{ width: `${Math.max(3, Math.round((v / Math.max(1, leads.length)) * 100))}%` }} /></div></div>
                  ))}
                </div>
                <div className="today">
                  {outages.length > 0 && <div className="wide"><Outages list={outages} /></div>}
                  <Task tone="ok" n={unread.length} t="ردود تنتظرك" why="العميل كتب وينتظر ردّك">
                    {unread.length === 0 && <div className="empty">لا ردود جديدة</div>}
                    {unread.map((t) => {
                      const l = (t.lead_id && byId.get(t.lead_id)) || byWa.get(t.wa)
                      return <Item key={t.wa} name={l?.name ?? '+' + t.wa} meta={t.last.body} btn={<button className="btn sm wa" onClick={() => openChat(t.wa)}>ردّ</button>} />
                    })}
                  </Task>
                  <Task tone="acc" n={of('ready').length} t="مواقع جاهزة لم تُرسل" why="أرسل الرابط برسالتك الثابتة">
                    {of('ready').length === 0 && <div className="empty">لا شيء جاهز للإرسال</div>}
                    {of('ready').map((l) => <Item key={l.id} name={l.name} meta={place(l)} onOpen={() => setOpen(l)} btn={<button className="btn sm wa" onClick={() => sendGift(l)}>أرسل</button>} />)}
                  </Task>
                  <Task tone="blue" n={of('nosite').length} t="عملاء بلا موقع" why="«اعمل الموقع» يبنيه وينشره ويضع رابطه هنا">
                    {of('nosite').length > 0 && <button className="btn all" disabled={!!bulk} onClick={() => buildAll(of('nosite'))}>اعمل كل المواقع ({of('nosite').length})</button>}
                    {of('nosite').slice(0, 6).map((l) => <Item key={l.id} name={l.name} meta={place(l)} onOpen={() => setOpen(l)} btn={<button className="btn sm" disabled={building.has(l.id)} onClick={() => build(l)}>{building.has(l.id) ? 'يُبنى…' : 'اعمل الموقع'}</button>} />)}
                    {of('nosite').length > 6 && <button className="more" onClick={() => setTab('leads')}>كل العملاء ({of('nosite').length})</button>}
                  </Task>
                  {(leads.filter(low).length > 0) && (
                    <Task tone="warn" n={leads.filter(low).length} t="مواقع درجتها أقل من 8" why="نُشرت كما هي. افتح العميل لترى ما ينقص موقعه">
                      {leads.filter(low).sort((a, b) => a.build!.score! - b.build!.score!).slice(0, 8).map((l) => (
                        <Item key={l.id} name={l.name} meta={l.build!.why[0] ?? l.build!.missing[0]} onOpen={() => setOpen(l)}
                          btn={<span className={'tag num t-' + scoreTone(l.build!.score!)}>{l.build!.score}/10</span>} />
                      ))}
                    </Task>
                  )}
                  {rebuildable.length > 0 && (
                    <Task tone="blue" n={rebuildable.length} t="أعد بناء المواقع بالنظام الجديد" why="«أعد البناء» يبنيها بالنظام الجديد على نفس الرابط، ويكتب درجة كل موقع وأسبابها">
                      <button className="btn all" disabled={!!bulk} onClick={() => buildAll(rebuildable, true)}>أعد بناء كل المواقع ({rebuildable.length})</button>
                    </Task>
                  )}
                </div>
              </>
            )}
            {tab === 'leads' && <Leads leads={leads} onOpen={setOpen} build={build} building={building} sendGift={sendGift} buildAll={buildAll} busy={!!bulk} />}
            {tab === 'inbox' && (
              <Inbox threads={threads} byId={byId} byWa={byWa} chat={chat} setChat={setChat} onSent={load} say={say} onLead={setOpen} />
            )}
          </>
        )}
      </div>

      {open && <Sheet lead={open} onClose={() => setOpen(null)} patch={patch} sendGift={sendGift} build={build} building={building.has(open.id)} openChat={(wa) => { setOpen(null); openChat(wa) }} />}
      <div className={'toast' + (toast ? ' show' : '')} role="status">{toast}</div>
    </div>
  )
}

function Task({ tone, n, t, why, children }: { tone: string; n: number; t: string; why: string; children: React.ReactNode }) {
  return (
    <section className={'task t-' + tone}>
      <div className="hd"><span className="ic num">{n}</span><span className="t">{t}<span className="why">{why}</span></span></div>
      <div className="items">{children}</div>
    </section>
  )
}
/** A paid service that stopped, said in plain words, with where to fix it. Shown at the top of «اليوم» (Anas picked B, 2026-11-08). */
function Outages({ list }: { list: Outage[] }) {
  return (
    <div className="outs" role="alert">
      {list.map((o) => (
        <div key={o.service} className="out">
          <span className="dot" aria-hidden />
          <span className="tx"><b>{o.reason}</b>
            <span className="st">{SERVICE[o.service].stops}</span>
            <span className="fx">{o.fix}</span></span>
          <a className="btn sm" href={SERVICE[o.service].href} target="_blank" rel="noreferrer">افتح {SERVICE[o.service].t}</a>
        </div>
      ))}
    </div>
  )
}
/** The last build of a lead: score, the visitor's reasons, what was missing, where the photos came from. */
function BuildReport({ r }: { r: Report }) {
  const sc = r.score
  return (
    <section className="rep">
      <div className="rhd">
        {typeof sc === 'number'
          ? <span className={'big num t-' + scoreTone(sc)}>{sc}<small>/10</small></span>
          : <span className="big t-mute">—</span>}
        <span className="rt"><b>تقرير البناء</b>
          <span className="mt">{typeof sc === 'number' ? (r.rounds.length > 1 ? `الزائر الآلي قيّمه ${r.rounds.length} مرات: ${r.rounds.join(' ← ')}` : 'تقييم الزائر الآلي') : 'هذا القالب بلا تقييم بعد'} · {when(r.at)}</span></span>
      </div>
      {r.why.length > 0 && <><div className="lbl">ما لم يعجب الزائر</div><ul className="why">{r.why.map((w, i) => <li key={i}>{w}</li>)}</ul></>}
      {r.missing.length > 0 && <><div className="lbl">ما لم نجده</div><ul className="why miss">{r.missing.map((w, i) => <li key={i}>{w}</li>)}</ul></>}
      {(r.social || r.photos) && (
        <dl className="kv">
          {r.photos && <><dt>الصور</dt><dd className="num">{r.photos.used} صور في الموقع · {r.photos.google} من Google</dd></>}
          {r.social && <><dt>التواصل</dt><dd className="ltr">{[r.social.instagram && '@' + r.social.instagram, r.social.facebook?.replace(/^https?:\/\/(www\.)?/, '')].filter(Boolean).join(' · ') || <span dir="rtl">لم نجد حساباً</span>}</dd></>}
        </dl>
      )}
      {r.outages.length > 0 && <div className="note">أثناء البناء: {r.outages.map((o) => o.reason).join('، ')}</div>}
    </section>
  )
}
function Item({ name, meta, btn, onOpen }: { name: string; meta?: string; btn: React.ReactNode; onOpen?: () => void }) {
  return (
    <div className="it">
      <button className="nm" onClick={onOpen} disabled={!onOpen}>{name}</button>
      {meta && <span className="mt">{meta}</span>}
      {btn}
    </div>
  )
}

function Leads({ leads, onOpen, build, building, sendGift, buildAll, busy }: {
  leads: Lead[]; onOpen: (l: Lead) => void; build: (l: Lead) => void; building: Set<string>
  sendGift: (l: Lead) => void; buildAll: (l: Lead[]) => void; busy: boolean
}) {
  const [q, setQ] = useState('')
  const [st, setSt] = useState<'all' | Stage>('all')
  const [cc, setCc] = useState('all')
  const countries = useMemo(() => [...new Set(leads.map((l) => l.country ?? ''))].filter(Boolean), [leads])
  const list = leads.filter((l) => (st === 'all' || stageOf(l) === st) && (cc === 'all' || l.country === cc)
    && (!q || `${l.name} ${l.kind} ${l.city} ${l.area} ${COUNTRY[l.country ?? '']}`.includes(q)))
  return (
    <>
      <input className="search" placeholder="ابحث بالاسم أو المدينة أو النشاط" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        <button aria-pressed={st === 'all'} onClick={() => setSt('all')}>الكل <span className="num">{leads.length}</span></button>
        {STAGES.map((s) => <button key={s.id} aria-pressed={st === s.id} onClick={() => setSt(s.id)}>{s.t} <span className="num">{leads.filter((l) => stageOf(l) === s.id).length}</span></button>)}
      </div>
      <div className="chips">
        <button aria-pressed={cc === 'all'} onClick={() => setCc('all')}>كل الدول</button>
        {countries.map((c) => <button key={c} aria-pressed={cc === c} onClick={() => setCc(c)}>{COUNTRY[c] ?? c}</button>)}
      </div>
      {list.some((l) => !l.site) && (
        <button className="btn all" disabled={busy} onClick={() => buildAll(list.filter((l) => !l.site))}>
          اعمل مواقع المعروضين بلا موقع ({list.filter((l) => !l.site).length})
        </button>
      )}
      <div className="llist">
        {list.slice(0, 300).map((l) => {
          const st = stageOf(l)
          const s = STAGES.find((x) => x.id === st)!
          return (
            <div key={l.id} className="lrow" role="button" tabIndex={0} onClick={() => onOpen(l)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(l) }}>
              <span style={{ minWidth: 0 }}><span className="nm">{l.name}</span>
                <span className="mt">{l.kind} · {place(l)} · ★ <span className="num">{l.rating ?? '–'}</span> (<span className="num">{l.reviews ?? 0}</span>)</span></span>
              <span className="acts" onClick={(e) => e.stopPropagation()}>
                {st === 'nosite' && !l.site && <button className="btn sm" disabled={building.has(l.id)} onClick={() => build(l)}>{building.has(l.id) ? 'يُبنى…' : 'اعمل الموقع'}</button>}
                {st === 'ready' && <button className="btn sm wa" onClick={() => sendGift(l)}>أرسل</button>}
                {l.site && <a className="btn sm ghost" href={l.site} target="_blank" rel="noreferrer">الموقع</a>}
                {typeof l.build?.score === 'number' && <span className={'tag num t-' + scoreTone(l.build.score)} title="درجة الزائر الآلي">{l.build.score}/10</span>}
                <span className={'tag t-' + s.tone}>{s.t}</span>
              </span>
            </div>
          )
        })}
        {list.length === 0 && <div className="empty">لا نتائج</div>}
      </div>
    </>
  )
}

function Sheet({ lead: l, onClose, patch, sendGift, openChat, build, building }: {
  lead: Lead; onClose: () => void; patch: (id: string, b: Partial<Lead>) => void
  sendGift: (l: Lead) => void; openChat: (wa: string) => void; build: (l: Lead, quiet?: boolean, rebuild?: boolean) => void; building: boolean
}) {
  const [site, setSite] = useState(l.site ?? '')
  const [notes, setNotes] = useState(l.notes ?? '')
  useEffect(() => { setSite(l.site ?? ''); setNotes(l.notes ?? '') }, [l.id, l.site, l.notes])
  const s = stageOf(l)
  return (
    <div className="scrim" onClick={onClose}>
      <aside className="sheet" role="dialog" aria-label={l.name} onClick={(e) => e.stopPropagation()}>
        <div className="shd"><b>{l.name}</b><button className="btn sm ghost" onClick={onClose}>إغلاق</button></div>
        <dl className="kv">
          <dt>النوع</dt><dd>{l.kind}</dd>
          <dt>المكان</dt><dd>{place(l)}{l.area ? ' · ' + l.area : ''}</dd>
          <dt>التقييم</dt><dd className="num">★ {l.rating} ({l.reviews})</dd>
          <dt>الرقم</dt><dd className="ltr">{l.phone}</dd>
          {l.maps && <><dt>الخريطة</dt><dd><a href={l.maps} target="_blank" rel="noreferrer">افتح في Google</a></dd></>}
          {l.social && <><dt>تواصل</dt><dd><a href={l.social} target="_blank" rel="noreferrer" className="ltr">{l.social.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}</a></dd></>}
        </dl>
        {l.build && <BuildReport r={l.build} />}
        <label className="fld">رابط الموقع الذي صنعناه
          <div className="row"><input className="ltr" value={site} placeholder="https://….beynoun.com" onChange={(e) => setSite(e.target.value)} />
            <button className="btn sm" onClick={() => patch(l.id, { site })} disabled={site === (l.site ?? '')}>احفظ</button></div>
        </label>
        <div className="row">
          {!l.site && <button className="btn" disabled={building} onClick={() => build(l)}>{building ? 'يُبنى… (دقيقة تقريباً)' : 'اعمل الموقع'}</button>}
          {l.site && l.status !== 'client' && <button className="btn" disabled={building} onClick={() => build(l, false, true)}>{building ? 'يُعاد بناؤه…' : 'أعد البناء'}</button>}
          {l.site && (s === 'ready' || s === 'nosite') && <button className="btn wa" onClick={() => sendGift(l)}>أرسل رسالتك + الرابط</button>}
          {l.wa && <button className="btn" onClick={() => openChat(l.wa!)}>المحادثة</button>}
          {l.site && <a className="btn ghost" href={l.site} target="_blank" rel="noreferrer">الموقع</a>}
        </div>
        <div className="lbl">الحالة</div>
        <div className="row wrap">
          {([['new', 'جديد'], ['sent', 'أُرسل'], ['noans', 'لم يردّ'], ['replied', 'ردّ'], ['later', 'لاحقاً'], ['client', 'صار عميلاً'], ['no', 'رفض']] as const).map(([k, t]) => (
            <button key={k} className="btn sm" aria-pressed={l.status === k} onClick={() => patch(l.id, { status: k })}>{t}</button>
          ))}
        </div>
        <label className="fld">ملاحظات
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (l.notes ?? '') && patch(l.id, { notes })} />
        </label>
      </aside>
    </div>
  )
}

function Inbox({ threads, byId, byWa, chat, setChat, onSent, say, onLead }: {
  threads: Thread[]; byId: Map<string, Lead>; byWa: Map<string, Lead>; chat: string | null
  setChat: (wa: string | null) => void; onSent: () => void; say: (m: string) => void; onLead: (l: Lead) => void
}) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const lead = chat ? byWa.get(chat) ?? (threads.find((t) => t.wa === chat)?.lead_id ? byId.get(threads.find((t) => t.wa === chat)!.lead_id!) : undefined) : undefined

  const loadChat = useCallback(async () => {
    if (!chat) return
    const r = await fetch('/api/admin/wa/threads?wa=' + encodeURIComponent(chat), { cache: 'no-store' })
    if (r.ok) setMsgs((await r.json()).messages ?? [])
  }, [chat])
  useEffect(() => { setMsgs([]); loadChat(); const t = setInterval(loadChat, 15000); return () => clearInterval(t) }, [loadChat])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])

  const lastIn = [...msgs].reverse().find((m) => m.direction === 'in')
  const openWindow = !!lastIn && Date.now() - new Date(lastIn.at).getTime() < 24 * 3600 * 1000

  async function send() {
    if (!chat || !text.trim()) return
    setBusy(true)
    const r = await fetch('/api/admin/wa/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wa: chat, leadId: lead?.id, mode: 'text', text }) })
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) { say(j.error || 'لم تُرسل'); return }
    setText(''); loadChat(); onSent()
  }

  return (
    <div className={'inbox' + (chat ? ' open' : '')}>
      <div className="ilist">
        {threads.length === 0 && <div className="empty">لا رسائل بعد. أول ما يرد عميل تظهر محادثته هنا.</div>}
        {threads.map((t) => {
          const l = (t.lead_id && byId.get(t.lead_id)) || byWa.get(t.wa)
          return (
            <button key={t.wa} className="irow" aria-current={t.wa === chat} onClick={() => setChat(t.wa)}>
              <span className="av">{(l?.name ?? '#').trim().slice(0, 1)}</span>
              <span style={{ minWidth: 0 }}><span className="nm">{l?.name ?? '+' + t.wa}</span>
                <span className="pv">{t.last.direction === 'out' ? 'أنت: ' : ''}{t.last.body}</span></span>
              <span className="tm">{when(t.last.at)}{t.unread > 0 && <b className="unread num">{t.unread}</b>}</span>
            </button>
          )
        })}
      </div>
      <div className="chat">
        {!chat ? <div className="empty">اختر محادثة</div> : (
          <>
            <div className="chead">
              <button className="btn sm back" onClick={() => setChat(null)}>رجوع</button>
              <span className="av">{(lead?.name ?? '#').slice(0, 1)}</span>
              <span style={{ minWidth: 0, flex: 1 }}><span className="nm">{lead?.name ?? '+' + chat}</span>
                <span className="mt">{lead ? `${lead.kind} · ${place(lead)}` : ''}</span></span>
              {lead && <button className="btn sm ghost" onClick={() => onLead(lead)}>العميل</button>}
            </div>
            <div className="msgs">
              {msgs.map((m) => (
                <div key={m.id} className={'b ' + (m.direction === 'out' ? 'me' : 'them') + (m.kind === 'template' ? ' tpl' : '')}>
                  {m.kind === 'template' && <span className="tag t-ok">رسالتك الثابتة</span>}
                  {m.body}
                  <span className="w">{when(m.at)}{m.direction === 'out' ? ' · ' + ({ sent: '✓', delivered: '✓✓', read: '✓✓ قُرئت', failed: 'لم تصل' } as Record<string, string>)[m.status ?? ''] : ''}</span>
                </div>
              ))}
              <div ref={end} />
            </div>
            <div className="compose">
              {openWindow ? (
                <>
                  <textarea rows={2} placeholder="اكتب ردّك…" value={text} onChange={(e) => setText(e.target.value)} />
                  <button className="btn wa" disabled={busy || !text.trim()} onClick={send}>{busy ? '…' : 'أرسل'}</button>
                </>
              ) : <div className="note">مرّت 24 ساعة على آخر رسالة منه، فواتساب لا يسمح بنص حر الآن. تستطيع الكتابة له بعد أن يراسلك.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const I = {
  today: <path d="M4 5h16v15H4z M4 9h16 M9 3v4 M15 3v4" />,
  leads: <path d="M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M3 20c0-3.5 3-6 6-6s6 2.5 6 6 M16 4.5a3.5 3.5 0 0 1 0 7 M18 14c2 .7 3.5 2.8 3.5 6" />,
  inbox: <path d="M4 5h16v11H9l-5 4z" />,
  brand: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />,
  notes: <path d="M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h5" />,
  stats: <path d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2" />,
}

export const CSS = `
.ls{--ink:var(--foreground);--line:var(--border);--sunk:var(--background);--acc:#E2532A;--wa:var(--success);--wa-bg:var(--success-fill);
  --blue:#2c63a8;--blue-bg:rgba(44,99,168,.10);--warn:var(--warning);--warn-bg:var(--warning-fill);--err:var(--error);--err-bg:var(--error-fill);
  display:grid;grid-template-columns:minmax(0,1fr);max-width:1180px;margin:0 auto;padding:14px 16px 110px;color:var(--ink);font-size:14px;line-height:1.55}
.ls *{box-sizing:border-box}
.ls button{font:inherit;color:inherit;cursor:pointer}
.ls .num{font-variant-numeric:tabular-nums}
.ls .ltr{direction:ltr;unicode-bidi:isolate}
.ls .top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.ls .top h1{font-size:20px;margin:0;font-weight:700}
.ls .top h1 i{font-style:normal;color:var(--acc)}
.ls .sp{flex:1}
.ls .pill{font-size:12px;border-radius:999px;padding:3px 10px;background:var(--warn-bg);color:var(--warn);font-weight:600}
.ls .btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:7px 12px;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}
.ls .btn.sm{padding:5px 10px;font-size:12.5px}
.ls .btn.ghost{background:transparent}
.ls .btn.wa{background:var(--wa);border-color:var(--wa);color:#fff}
.ls .btn[disabled]{opacity:.5;cursor:default}
.ls .btn[aria-pressed="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.ls .note,.ls .empty{font-size:12.5px;color:var(--muted);padding:8px 12px}
.ls .note{background:var(--surface);border:1px dashed var(--line);border-radius:10px}
.ls .funnel{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:14px}
.ls .fstep{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.ls .fstep .v{font-size:24px;font-weight:700;line-height:1.1}
.ls .fstep .l{font-size:12px;color:var(--muted);white-space:nowrap}
.ls .fstep .bar{height:4px;border-radius:2px;background:var(--sunk);margin-top:8px;overflow:hidden}
.ls .fstep .bar i{display:block;height:100%;background:var(--acc)}
.ls .today{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
.ls .task{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:grid;gap:8px;grid-template-columns:minmax(0,1fr)}
.ls .task .hd{display:flex;align-items:center;gap:8px}
.ls .task .ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:700;background:var(--c-bg);color:var(--c);flex:none}
.ls .task .t{font-weight:700;flex:1}
.ls .task .why{font-size:12px;color:var(--muted);font-weight:400;display:block}
.ls .t-ok{--c:var(--wa);--c-bg:var(--wa-bg)} .ls .t-acc{--c:var(--acc);--c-bg:var(--warn-bg)} .ls .t-blue{--c:var(--blue);--c-bg:var(--blue-bg)}
.ls .t-warn{--c:var(--warn);--c-bg:var(--warn-bg)} .ls .t-err{--c:var(--err);--c-bg:var(--err-bg)} .ls .t-mute{--c:var(--muted);--c-bg:var(--sunk)}
.ls .items{display:grid;gap:4px}
.ls .it{display:flex;align-items:center;gap:8px;background:var(--sunk);border-radius:9px;padding:6px 10px;font-size:13px}
.ls .it .nm{flex:1 1 0;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:0;background:none;padding:0;text-align:right;font-weight:600}
.ls .it .nm[disabled]{cursor:default}
.ls .it .mt{color:var(--muted);font-size:11.5px;flex:0 1 auto;min-width:0;max-width:40%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ls .more{border:0;background:none;color:var(--muted);font-size:12.5px;padding:4px;text-align:right}
.ls .search{width:100%;border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:9px 12px;margin-bottom:8px;font:inherit;color:inherit}
.ls .chips{display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;padding-bottom:2px}
.ls .chips button{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:5px 12px;font-size:12.5px;white-space:nowrap}
.ls .chips button[aria-pressed="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
.ls .llist{display:grid;gap:6px}
.ls .lrow{background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:9px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;text-align:right;cursor:pointer}
.ls .lrow .acts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.ls .btn.all{width:100%;margin:2px 0 10px}
.ls .bulk{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:10px 12px;margin-bottom:12px;font-size:13.5px}
.ls .bulk .bar{flex:1;min-width:120px;height:6px;border-radius:9px;background:var(--line);overflow:hidden}
.ls .bulk .bar i{display:block;height:100%;background:var(--success, #2e7d4f)}
.ls .lrow .nm,.ls .irow .nm,.ls .chead .nm{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ls .lrow .mt,.ls .chead .mt{display:block;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ls .tag{font-size:11.5px;border-radius:999px;padding:2px 9px;font-weight:600;background:var(--c-bg);color:var(--c);white-space:nowrap}
.ls .nav{display:flex;position:sticky;top:0;z-index:30;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:4px;margin-bottom:12px;gap:4px}
.ls .nav button{border:0;background:none;flex:1;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:var(--muted);padding:7px 8px;border-radius:9px;position:relative}
.ls .nav button[aria-selected="true"]{background:var(--background)}
.ls .nav svg{width:18px;height:18px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8}
.ls .nav button[aria-selected="true"]{color:var(--acc);font-weight:700}
.ls .nav .n{position:static;background:var(--wa);color:#fff;border-radius:999px;font-size:10px;padding:0 5px}
@media (min-width:900px){
  .ls{grid-template-columns:190px minmax(0,1fr);gap:20px;padding-bottom:30px}
  .ls .nav{position:sticky;top:16px;flex-direction:column;justify-content:flex-start;gap:2px;border:0;background:none;padding:0;margin:0;align-self:start}
  .ls .nav button{flex:none;justify-content:flex-start;gap:10px;font-size:14px;padding:9px 12px;border-radius:10px;width:100%;text-align:right}
  .ls .nav button span{flex:1}
  .ls .nav button[aria-selected="true"]{background:var(--surface);color:var(--ink)}
  .ls .nav .n{position:static}
  .ls .today{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  .ls .funnel{grid-template-columns:repeat(5,minmax(68px,1fr));overflow-x:auto;margin-inline:-16px;padding-inline:16px}
  .ls .fstep{padding:8px 9px}.ls .fstep .v{font-size:19px}.ls .fstep .l{font-size:11px}
  .ls .it .mt{display:none}
  .ls .nav button{flex-direction:column;gap:2px;font-size:11px;padding:6px 2px;min-width:0}
  .ls .nav button span{white-space:nowrap}
}
.ls .inbox{display:grid;grid-template-columns:300px minmax(0,1fr);background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;min-height:520px}
.ls .ilist{border-inline-end:1px solid var(--line);overflow-y:auto;max-height:70vh}
.ls .irow{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;border:0;border-bottom:1px solid var(--line);background:none;padding:10px 12px;text-align:right}
.ls .irow[aria-current="true"]{background:var(--sunk)}
.ls .irow .pv{display:block;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ls .irow .tm{font-size:11px;color:var(--muted);display:grid;justify-items:end;gap:3px}
.ls .unread{background:var(--wa);color:#fff;border-radius:999px;font-size:10.5px;padding:0 6px}
.ls .av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--sunk);font-weight:700;flex:none}
.ls .chat{display:grid;grid-template-rows:auto 1fr auto;min-width:0;max-height:70vh}
.ls .chat > .empty{align-self:center;justify-self:center}
.ls .chead{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}
.ls .chead .back{display:none}
.ls .msgs{overflow-y:auto;padding:14px;display:grid;gap:6px;align-content:start;background:var(--sunk)}
.ls .b{max-width:78%;padding:7px 10px;border-radius:12px;white-space:pre-wrap;font-size:13.5px;background:var(--surface);border:1px solid var(--line);justify-self:start}
.ls .b.me{justify-self:end;background:var(--wa-bg);border-color:transparent}
.ls .b.tpl{border:1px dashed var(--wa)}
.ls .b .tag{display:inline-block;margin-bottom:4px}
.ls .b .w{display:block;font-size:10.5px;color:var(--muted);margin-top:3px}
.ls .compose{display:flex;gap:8px;align-items:flex-end;padding:10px;border-top:1px solid var(--line)}
.ls .compose textarea,.ls .fld input,.ls .fld textarea{flex:1;width:100%;border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:8px 10px;font:inherit;color:inherit;resize:vertical}
@media (max-width:760px){
  .ls .inbox{grid-template-columns:minmax(0,1fr)}
  .ls .inbox .chat{display:none}
  .ls .inbox.open .ilist{display:none}
  .ls .inbox.open .chat{display:grid;max-height:none;min-height:70vh}
  .ls .chead .back{display:inline-flex}
}
.ls .scrim{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.35);display:flex;justify-content:flex-start}
.ls .sheet{width:min(420px,100%);height:100%;overflow-y:auto;background:var(--surface);padding:16px;display:grid;gap:12px;align-content:start;box-shadow:var(--shadow-lg)}
.ls .shd{display:flex;align-items:center;gap:8px;justify-content:space-between;font-size:16px}
.ls .kv{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;margin:0;font-size:13px}
.ls .kv dt{color:var(--muted)} .ls .kv dd{margin:0;overflow-wrap:anywhere;text-align:right}
.ls .kv a{color:var(--acc)}
.ls .fld{display:grid;gap:4px;font-size:12.5px;color:var(--muted)}
.ls .fld input,.ls .fld textarea{color:var(--ink)}
.ls .row{display:flex;gap:6px;align-items:center}
.ls .row.wrap{flex-wrap:wrap}
.ls .lbl{font-size:12.5px;color:var(--muted)}
.ls .outs{display:grid;gap:6px;margin-bottom:12px}
.ls .out{display:flex;align-items:center;gap:10px;background:var(--err-bg);border:1px solid var(--err);border-radius:12px;padding:10px 12px}
.ls .out .dot{width:8px;height:8px;border-radius:50%;background:var(--err);flex:none}
.ls .out .tx{flex:1;min-width:0;display:grid;gap:1px}
.ls .out b{color:var(--err);font-size:14px}
.ls .out .st{font-size:12.5px;font-weight:600}
.ls .out .fx{font-size:12px;color:var(--muted)}
.ls .today .wide{grid-column:1/-1}
.ls .today .wide .outs{margin:0}
@media (max-width:640px){.ls .out{display:grid;grid-template-columns:8px minmax(0,1fr);align-items:start;gap:4px 10px}.ls .out .dot{margin-top:8px}.ls .out .btn{grid-column:1/-1;width:100%;margin-top:6px}}
.ls .rep{border:1px solid var(--line);border-radius:12px;padding:12px;display:grid;gap:8px;background:var(--sunk)}
.ls .rhd{display:flex;align-items:center;gap:10px}
.ls .rhd .big{min-width:62px;height:50px;border-radius:11px;display:flex;align-items:baseline;justify-content:center;padding-top:9px;direction:ltr;flex:none;font-size:24px;font-weight:700;background:var(--c-bg);color:var(--c)}
.ls .rhd .big small{font-size:12px;font-weight:600;opacity:.8}
.ls .rhd .rt{display:grid;min-width:0}
.ls .rhd .mt{font-size:12px;color:var(--muted)}
.ls .why{margin:0;padding-inline-start:18px;display:grid;gap:3px;font-size:13px}
.ls .why.miss{color:var(--muted)}
.ls .toast{position:fixed;inset-inline:16px;bottom:96px;margin:0 auto;max-width:320px;background:var(--ink);color:var(--surface);padding:8px 12px;border-radius:10px;text-align:center;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:60}
.ls .toast.show{opacity:1}
@media (prefers-reduced-motion:reduce){.ls .toast{transition:none}}
`
