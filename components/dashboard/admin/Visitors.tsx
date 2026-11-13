'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * «الزوار» (Anas, 2026-11-12, option P2): what visitors tell us and how they
 * move through the build questions. Three parts:
 *   البلاغات — reports from the shake sheet / corner button, with the picture.
 *   حركة الزوار في الأسئلة — one table per wizard: reached, time, skipped,
 *     came back, stopped here; and how many pressed the build button.
 *   ما تمنّى العملاء أن نسألهم عنه — answers to the last question.
 * Renders inside LeadStudio's `.ls` root, so it uses its tokens and classes.
 */
type Report = { id: string; at: string; text: string | null; kind: string; page: string | null; title: string | null; vw: number | null; status: string; signedIn: boolean; image: string | null }
type StepRow = { id: string; title: string; i: number; reached: number; avgMs: number | null; skipped: number; back: number; left: number }
type Funnel = { key: string; label: string; wizard: string; started: number; finished: number; steps: StepRow[] }
type Wish = { at: string; text: string; label: string }
type Data = { reports: Report[]; wizards: Funnel[]; wishes: Wish[] }

const KIND: Record<string, string> = { screen: 'لقطة شاشة', camera: 'صورة كاميرا', text: 'نص فقط' }
const when = (iso: string) => {
  const d = new Date(iso), now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('ar', { day: 'numeric', month: 'short' })
}
const dur = (ms: number | null) => {
  if (ms == null) return '—'
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s} ث` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function Visitors({ say, onCount }: { say: (m: string) => void; onCount?: (n: number) => void }) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [pick, setPick] = useState<string | null>(null)
  const [big, setBig] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/visitors?days=' + days, { cache: 'no-store' })
    if (!r.ok) { setErr(r.status === 403 ? 'للإدارة فقط.' : `تعذّر التحميل (${r.status})`); return }
    const j: Data = await r.json()
    setData(j); setErr(null)
    onCount?.(j.reports.filter((x) => x.status === 'new').length)
  }, [days, onCount])
  useEffect(() => { load() }, [load])

  async function mark(id: string, status: 'new' | 'done') {
    const r = await fetch('/api/admin/visitors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    if (!r.ok) { say('لم يُحفظ'); return }
    say(status === 'done' ? 'عُلّم: تم الإصلاح' : 'أُعيد إلى الجديد'); load()
  }
  async function remove(id: string) {
    const r = await fetch('/api/admin/visitors?id=' + id, { method: 'DELETE' })
    if (!r.ok) { say('لم يُحذف'); return }
    say('حُذف البلاغ'); load()
  }

  if (err) return <div className="note">{err}</div>
  if (!data) return <div className="note">جارٍ التحميل…</div>

  const fn = data.wizards.find((w) => w.key === pick) ?? data.wizards[0]

  return (
    <div className="vz">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="vz-sec">
        <div className="vz-hd"><h2>البلاغات</h2><span className="why">من هزّ الهاتف أو زر «بلّغ عن مشكلة»</span></div>
        {data.reports.length === 0 ? <div className="empty">لا بلاغات بعد. حين يهزّ أحد هاتفه ويرسل، يظهر بلاغه هنا.</div> : data.reports.map((r) => (
          <div className="rep" key={r.id} data-new={r.status === 'new' ? '' : undefined}>
            {r.image
              ? <button className="th" onClick={() => setBig(r.image)} aria-label="كبّر الصورة">{/* eslint-disable-next-line @next/next/no-img-element */}<img alt="" src={r.image} /></button>
              : <span className="th ph">بلا صورة</span>}
            <div className="rb">
              <p className="tx">{r.text || <span className="mu">بلا نص</span>}</p>
              <div className="mt">
                <span className={'tag ' + (r.status === 'new' ? 't-acc' : 't-ok')}>{r.status === 'new' ? 'جديد' : 'تم الإصلاح'}</span>
                <span>{when(r.at)}</span>
                <span>{r.vw != null && r.vw < 760 ? 'هاتف' : 'كمبيوتر'}</span>
                <span>{KIND[r.kind] ?? r.kind}</span>
                {r.signedIn ? <span>مسجّل الدخول</span> : null}
              </div>
              {r.page ? <a className="pg ltr" href={r.page} target="_blank" rel="noreferrer">{r.page}</a> : null}
              <div className="ac">
                {r.status === 'new'
                  ? <button className="btn sm" onClick={() => mark(r.id, 'done')}>تم الإصلاح</button>
                  : <button className="btn sm ghost" onClick={() => mark(r.id, 'new')}>أعده جديدًا</button>}
                <button className="btn sm ghost" onClick={() => remove(r.id)}>احذف</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="vz-sec">
        <div className="vz-hd"><h2>ما تمنّى العملاء أن نسألهم عنه</h2><span className="why">جواب السؤال الأخير، إن كتبوا شيئًا</span></div>
        {data.wishes.length === 0 ? <div className="empty">لا إجابات بعد.</div> : (
          <div className="wish">{data.wishes.map((w, i) => <p key={i}>{w.text}<span>{w.label} · {when(w.at)}</span></p>)}</div>
        )}
      </section>

      <section className="vz-sec full">
        <div className="vz-hd"><h2>حركة الزوار في الأسئلة</h2>
          <span className="sp" />
          <div className="chips per">{[7, 30, 90].map((d) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>آخر {d} يومًا</button>)}</div>
        </div>
        {data.wizards.length === 0 ? <div className="empty">لا حركة بعد في هذه المدة. كل من يفتح أسئلة البناء يظهر هنا.</div> : (
          <>
            <div className="chips">
              {data.wizards.map((w) => <button key={w.key} aria-pressed={fn?.key === w.key} onClick={() => setPick(w.key)}>{w.label} <b className="num">{w.started}</b></button>)}
            </div>
            {fn ? (
              <>
                <p className="vz-lead">بدأ <b className="num">{fn.started}</b> · ضغط «ابنِ» <b className="num">{fn.finished}</b>
                  {fn.started ? <> (<bdi className="num">{Math.round((fn.finished / fn.started) * 100)}%</bdi>)</> : null}
                  <span className="ltr mu pth">{fn.wizard}</span></p>
                <div className="tbl">
                  <table>
                    <thead><tr><th>الخطوة</th><th>وصلها</th><th>متوسط الوقت</th><th>تخطّاها</th><th>رجع إليها</th><th>توقف هنا</th></tr></thead>
                    <tbody>
                      {fn.steps.map((s) => {
                        const hot = fn.started > 0 && s.left / fn.started >= 0.15
                        return (
                          <tr key={s.id}>
                            <td><b>{s.title}</b></td>
                            <td className="num">{s.reached}<span className="mb" style={{ width: Math.round((s.reached / Math.max(1, fn.started)) * 60) }} /></td>
                            <td className="num">{dur(s.avgMs)}</td>
                            <td className="num">{s.skipped || '—'}</td>
                            <td className="num">{s.back || '—'}</td>
                            <td className={'num' + (hot ? ' hot' : '')}>{s.left || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="vz-foot">«توقف هنا»: آخر خطوة رآها من لم يضغط «ابنِ». بالأحمر: خطوة توقف عندها 15% أو أكثر.</p>
              </>
            ) : null}
          </>
        )}
      </section>


      {big ? (
        <div className="vz-big" role="dialog" aria-label="الصورة" onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={big} />
        </div>
      ) : null}
    </div>
  )
}

const CSS = `
.ls .vz{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
.ls .vz-sec{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px;min-width:0}
.ls .vz-hd{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.ls .vz-hd h2{font-size:15px;margin:0;font-weight:700}
.ls .vz-hd .why{font-size:12px;color:var(--muted)}
.ls .vz-hd .chips{margin:0}
.ls .vz-lead{font-size:12.5px;color:var(--muted);margin:0 0 10px}
.ls .vz-lead .pth{display:block;font-size:11.5px;text-align:right}
.ls .vz-foot{font-size:11.5px;color:var(--muted);margin:8px 0 0}
.ls .mu{color:var(--muted)}
.ls .rep{display:grid;grid-template-columns:72px minmax(0,1fr);gap:10px;align-items:start;background:var(--sunk);border-radius:11px;padding:8px;margin-bottom:6px}
.ls .rep[data-new]{box-shadow:inset 0 0 0 1.5px var(--acc)}
.ls .rep .th{width:72px;height:96px;border-radius:8px;border:1px solid var(--line);background:var(--surface);padding:0;overflow:hidden;display:grid;place-items:center;color:var(--muted);font-size:11px}
.ls .rep .th img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.ls .rep .rb{min-width:0}
.ls .rep .tx{font-size:13.5px;font-weight:600;margin:0 0 4px;overflow-wrap:anywhere;white-space:pre-wrap}
.ls .rep .mt{font-size:11.5px;color:var(--muted);display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.ls .rep .pg{display:block;font-size:11.5px;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ls .rep .ac{margin-top:6px;display:flex;gap:6px}
.ls .tbl{overflow-x:auto}
.ls .tbl table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px}
.ls .tbl th{font-weight:600;color:var(--muted);text-align:right;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}
.ls .tbl td{padding:7px 8px;border-bottom:1px solid var(--line);white-space:nowrap}
.ls .tbl td.hot{color:var(--err);font-weight:700}
.ls .tbl .mb{display:inline-block;height:6px;border-radius:3px;background:var(--acc);vertical-align:middle;margin-inline-start:6px}
.ls .wish{display:grid;gap:6px}
.ls .wish p{margin:0;background:var(--sunk);border-radius:10px;padding:8px 10px;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}
.ls .wish p span{display:block;font-size:11.5px;color:var(--muted);margin-top:2px;white-space:normal}
.ls .vz-big{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.75);display:grid;place-items:center;padding:16px;cursor:zoom-out}
.ls .vz-big img{max-width:100%;max-height:100%;border-radius:10px}
@media (min-width:1100px){.ls .vz{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start}.ls .vz>.full{grid-column:1/-1}}
`
