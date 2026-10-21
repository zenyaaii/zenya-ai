'use client'

import { useEffect, useState } from 'react'

type Props = { token: string; site: { name: string; url: string }; initial: 'yes' | 'no' }
type Phase = 'saving' | 'yes' | 'ask' | 'no' | 'error'

/** Records the answer from the browser, never from the page request itself. */
export default function HandoverAnswer({ token, site, initial }: Props) {
  const [phase, setPhase] = useState<Phase>(initial === 'yes' ? 'saving' : 'ask')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(answer: 'yes' | 'no', text?: string) {
    const r = await fetch(`/api/handover/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, note: text }),
    }).catch(() => null)
    return !!r && r.ok
  }

  useEffect(() => {
    if (initial !== 'yes') return
    send('yes').then((ok) => setPhase(ok ? 'yes' : 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const host = site.url.replace(/^https?:\/\//, '')

  if (phase === 'saving') {
    return <div className="zs-top"><h1 className="zs-h1">لحظة…</h1></div>
  }
  if (phase === 'error') {
    return (
      <div className="zs-top">
        <h1 className="zs-h1">لم نستطع حفظ جوابك</h1>
        <p className="zs-sub">حدّث الصفحة وحاول مرة أخرى.</p>
      </div>
    )
  }
  if (phase === 'yes' || phase === 'no') {
    return (
      <>
        <div className="zs-top">
          <h1 className="zs-h1">{phase === 'yes' ? 'شكرًا، سجّلنا أنه وصلك' : 'شكرًا، وصلتنا رسالتك'}</h1>
          <p className="zs-sub">
            {phase === 'yes'
              ? <>موقع «{site.name}» في حسابك الآن.</>
              : 'سنراجع المشكلة ونتواصل معك قريبًا.'}
          </p>
        </div>
        <a href="https://dashboard.beynoun.com" className="zs-submit zs-submit-link">افتح لوحة التحكم</a>
      </>
    )
  }
  return (
    <>
      <div className="zs-top">
        <h1 className="zs-h1">ما المشكلة؟</h1>
        <p className="zs-sub">
          موقع «{site.name}» · <span dir="ltr">{host}</span>
        </p>
      </div>
      <form
        className="zs-form"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          const ok = await send('no', note)
          setBusy(false)
          setPhase(ok ? 'no' : 'error')
        }}
      >
        <div className="zs-field">
          <textarea
            id="handover-note"
            className="zs-input"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلًا: لا أرى الموقع في حسابي"
            aria-label="ما المشكلة؟"
            style={{ height: 'auto', paddingBlock: '0.75rem', resize: 'vertical' }}
          />
        </div>
        <button type="submit" className="zs-submit" disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'أرسل'}</button>
      </form>
      <p className="zs-sub" style={{ marginTop: '1rem', textAlign: 'center' }}>
        وصلك كل شيء؟{' '}
        <button
          type="button"
          className="zs-note-link"
          onClick={async () => { setPhase('saving'); setPhase((await send('yes')) ? 'yes' : 'error') }}
          style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
        >
          نعم، وصلني
        </button>
      </p>
    </>
  )
}
