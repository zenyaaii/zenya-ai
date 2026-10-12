'use client'

import { useEffect, useState } from 'react'
import { Panel, Section } from '../analytics/primitives'

/**
 * Site handovers, on the admin page: send a customer the "your site is in
 * your account" notice, try it on yourself first, and see who answered.
 */
type Row = {
  id: string
  site: string
  url: string | null
  email: string
  is_test: boolean
  status: 'pending' | 'yes' | 'no'
  note: string | null
  sent_at: string
  answered_at: string | null
}

const MARK: Record<Row['status'], { sign: string; label: string; color: string }> = {
  yes: { sign: '✓', label: 'وصله', color: '#15803d' },
  no: { sign: '✗', label: 'فيه مشكلة', color: '#b91c1c' },
  pending: { sign: '⏳', label: 'لم يرد', color: '#8a6a00' },
}

export default function HandoversPanel() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [site, setSite] = useState('')
  const [busy, setBusy] = useState<'test' | 'real' | null>(null)
  const [confirmReal, setConfirmReal] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  async function load() {
    const r = await fetch('/api/admin/handovers', { cache: 'no-store' }).catch(() => null)
    if (r?.ok) setRows((await r.json()).handovers || [])
    else setRows([])
  }
  useEffect(() => { load() }, [])

  async function send(test: boolean) {
    setBusy(test ? 'test' : 'real')
    setMsg(null)
    const r = await fetch('/api/admin/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, test }),
    }).catch(() => null)
    const j = r ? await r.json().catch(() => ({})) : {}
    setBusy(null)
    setConfirmReal(false)
    if (!r?.ok) {
      setMsg({ tone: 'bad', text: j.message || 'لم يُرسل. حاول مرة أخرى.' })
      return
    }
    setMsg({
      tone: 'ok',
      text: test
        ? 'أُرسلت التجربة. افتح الجرس 🔔 في أعلى الصفحة.'
        : `أُرسل الإشعار إلى حساب ${j.email}.`,
    })
    load()
  }

  const ready = site.trim().length > 0 && !busy

  return (
    <Section title="تسليم المواقع" hint="إشعار في جرس العميل">
      <Panel className="p-4 sm:p-5">
        <label htmlFor="handover-site" className="block text-[14.5px] font-bold text-[#171717]">عنوان الموقع</label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            id="handover-site"
            dir="ltr"
            value={site}
            onChange={(e) => { setSite(e.target.value); setConfirmReal(false) }}
            placeholder="hybridautoservice"
            className="h-10 min-w-0 flex-1 rounded-xl border border-[rgba(17,17,17,0.14)] bg-white px-3 text-[14.5px] text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
            style={{ minWidth: 200 }}
          />
          <button type="button" className="zy-btn-q" disabled={!ready} onClick={() => send(true)}>
            {busy === 'test' ? 'جارٍ الإرسال…' : 'جرّبه على حسابي'}
          </button>
          <button
            type="button"
            className="zy-btn"
            disabled={!ready}
            onClick={() => (confirmReal ? send(false) : setConfirmReal(true))}
          >
            {busy === 'real' ? 'جارٍ الإرسال…' : confirmReal ? 'اضغط مرة ثانية للتأكيد' : 'أرسل للعميل'}
          </button>
        </div>
        <p className="mt-2 text-[14.5px] font-medium text-[#66666e]">
          "جرّبه على حسابي" يضع الإشعار في جرسك أنت. "أرسل للعميل" يضعه في جرس صاحب الموقع. لا يُرسل أي إيميل.
        </p>
        {msg && (
          <p className="mt-2 text-[14.5px] font-bold" style={{ color: msg.tone === 'ok' ? '#15803d' : '#b91c1c' }}>{msg.text}</p>
        )}

        <div className="mt-4 border-t border-token pt-3">
          {rows === null ? (
            <p className="text-[14.5px] text-[#66666e]">جارٍ التحميل…</p>
          ) : rows.length === 0 ? (
            <p className="text-[14.5px] text-[#66666e]">لم يُرسل أي تسليم بعد.</p>
          ) : (
            <ul className="divide-y divide-[rgba(17,17,17,0.06)]">
              {rows.map((r) => {
                const m = MARK[r.status]
                return (
                  <li key={r.id} className="flex items-start gap-3 py-2.5">
                    <span className="w-6 shrink-0 text-center text-[18px] font-black leading-[1.4]" style={{ color: m.color }} aria-hidden>{m.sign}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-[14.5px]">
                        <span className="font-bold text-[#171717]">{r.site}</span>
                        <span className="font-bold" style={{ color: m.color }}>{m.label}</span>
                        {r.is_test && <span className="zy-pill" data-tone="quiet">تجربة</span>}
                      </div>
                      <div className="truncate text-[14.5px] text-[#66666e]" dir="ltr" style={{ textAlign: 'right' }}>{r.email}</div>
                      {r.note && <div className="mt-1 text-[14.5px] text-[#171717]">«{r.note}»</div>}
                      <div className="text-[14.5px] text-[#8f8f8f]">
                        أُرسل {new Date(r.sent_at).toLocaleString('ar')}
                        {r.answered_at && <> · ردّ {new Date(r.answered_at).toLocaleString('ar')}</>}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Panel>
    </Section>
  )
}
