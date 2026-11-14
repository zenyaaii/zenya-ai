"use client"

import { useEffect, useState } from 'react'

/**
 * «نبّهني» on a template marked «قريبًا» (Anas, 2026-11-14). A small button:
 * a signed-in owner is added with one press (their account's email); anyone
 * else types an email. Then «شكرًا». Rows land in public.template_waitlist
 * through /api/template-waitlist.
 *
 * One fetch per page tells it whether the visitor is signed in and which
 * templates they already asked for; every button on the page shares it.
 */

type Me = { signedIn: boolean; joined: string[] }
let meOnce: Promise<Me> | null = null
const me = () => (meOnce ??= fetch('/api/template-waitlist').then((r) => r.json()).catch(() => ({ signedIn: false, joined: [] })))

export default function NotifyMe({ template, name }: { template: string; name: string }) {
  const [state, setState] = useState<'idle' | 'open' | 'busy' | 'done' | 'error'>('idle')
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let live = true
    me().then((m) => { if (!live) return; setSignedIn(m.signedIn); if (m.joined.includes(template)) setState('done') })
    return () => { live = false }
  }, [template])

  async function send() {
    if (!signedIn && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setState('error'); setMsg('اكتب بريدًا إلكترونيًا صحيحًا.'); return }
    setState('busy'); setMsg('')
    try {
      const r = await fetch('/api/template-waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template, email: email.trim(), page: location.pathname }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setState('error'); setMsg(j?.error || 'تعذّر الحفظ الآن. حاول لاحقًا.'); return }
      setState('done')
    } catch { setState('error'); setMsg('تعذّر الحفظ الآن. حاول لاحقًا.') }
  }

  const css = <style dangerouslySetInnerHTML={{ __html: NM_CSS }} />
  if (state === 'done') return <p className="nm nm-done" role="status"><span aria-hidden>✓</span> شكرًا. سنخبرك حين يصبح {name} جاهزًا.{css}</p>
  if (state === 'idle') {
    return (
      <button type="button" className="nm nm-btn" onClick={() => (signedIn ? send() : setState('open'))}>
        <BellIcon /> نبّهني عند الإطلاق{css}
      </button>
    )
  }
  return (
    <form className="nm nm-form" onSubmit={(e) => { e.preventDefault(); void send() }}>
      {signedIn ? null : (
        <input type="email" dir="ltr" required autoFocus value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('open') }}
          placeholder="you@example.com" aria-label={`بريدك لننبّهك عند إطلاق ${name}`} />
      )}
      <button type="submit" disabled={state === 'busy'}>{state === 'busy' ? '…' : 'أرسل'}</button>
      {state === 'error' && msg ? <span className="nm-err" role="alert">{msg}</span> : null}
      {css}
    </form>
  )
}

function BellIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
}

const NM_CSS = `
.nm-btn{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid var(--line2,rgba(244,239,230,.18));background:transparent;color:var(--ink,#F4EFE6);font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;transition:border-color .2s,background .2s}
.nm-btn:hover{border-color:var(--acc,#E2532A)}
.nm-btn:focus-visible,.nm-form button:focus-visible,.nm-form input:focus-visible{outline:2px solid var(--acc,#E2532A);outline-offset:2px}
.nm-form{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.nm-form input{flex:1 1 180px;min-width:0;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line2,rgba(244,239,230,.18));background:var(--bg2,rgba(255,255,255,.04));color:var(--ink,#F4EFE6);font:inherit;font-size:15px}
.nm-form button{min-height:40px;padding:0 18px;border-radius:999px;border:0;background:var(--acc,#E2532A);color:#fff;font:inherit;font-size:14.5px;font-weight:700;cursor:pointer}
.nm-err{flex-basis:100%;color:#f08a6c;font-size:13.5px}
.nm-done{margin:0;font-size:14.5px;color:var(--mut,#A39A8D)}
.nm-done span{color:var(--acc,#E2532A);font-weight:700}
`
