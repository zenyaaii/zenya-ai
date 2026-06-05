'use client'

import { useEffect, useMemo, useState } from 'react'
import { REGISTRARS, getRegistrar, type RegistrarId } from '@/lib/registrars'

type Required = Array<{
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  reason?: string
}>

export default function AddDomainModal({
  themeId,
  onClose,
  onAdded,
}: {
  themeId: string
  onClose: () => void
  onAdded: () => void
}) {
  const [step, setStep] = useState<'enter' | 'dns'>('enter')
  const [domain, setDomain] = useState('')
  const [registrarId, setRegistrarId] = useState<RegistrarId>('godaddy')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [required, setRequired] = useState<Required>([])
  const [status, setStatus] = useState<string>('pending_dns')

  const registrar = useMemo(() => getRegistrar(registrarId), [registrarId])

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      const r = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_id: themeId, domain: domain.trim().toLowerCase() }),
      })
      const j = await r.json()
      if (!r.ok) {
        setError(j.message || j.error || 'Could not add domain.')
        return
      }
      setRequired(j.required || [])
      setStatus(j.status || 'pending_dns')
      setStep('dns')
      onAdded()
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(15,15,18,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 560,
          background: 'white', borderRadius: 16,
          padding: 28, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.30)',
        }}
      >
        {step === 'enter' ? (
          <EnterStep
            domain={domain}
            setDomain={setDomain}
            registrarId={registrarId}
            setRegistrarId={setRegistrarId}
            onSubmit={submit}
            submitting={submitting}
            error={error}
            onClose={onClose}
          />
        ) : (
          <DnsStep
            domain={domain}
            registrar={registrar}
            required={required}
            status={status}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

function EnterStep({
  domain, setDomain, registrarId, setRegistrarId, onSubmit, submitting, error, onClose,
}: {
  domain: string
  setDomain: (s: string) => void
  registrarId: RegistrarId
  setRegistrarId: (id: RegistrarId) => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
  onClose: () => void
}) {
  return (
    <>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1c1c1c' }}>
        Connect a custom domain
      </h2>
      <p style={{ margin: '6px 0 18px', fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.55 }}>
        Point your domain at Zenya. Two minutes to add the records, then we verify and issue SSL automatically.
      </p>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b6b6b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Domain
      </label>
      <input
        autoFocus
        placeholder="mycoolstore.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        style={{
          width: '100%',
          padding: '11px 13px',
          fontSize: 14,
          border: '1px solid #e5e2d9',
          borderRadius: 8,
          outline: 'none',
          fontFamily: 'inherit',
          marginBottom: 18,
          color: '#1c1c1c',
        }}
      />

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b6b6b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Where did you buy this domain?
      </label>
      <select
        value={registrarId}
        onChange={(e) => setRegistrarId(e.target.value as RegistrarId)}
        style={{
          width: '100%',
          padding: '11px 13px',
          fontSize: 14,
          border: '1px solid #e5e2d9',
          borderRadius: 8,
          background: 'white',
          fontFamily: 'inherit',
          color: '#1c1c1c',
          marginBottom: 18,
        }}
      >
        {REGISTRARS.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <div
        style={{
          marginTop: 4,
          padding: '10px 12px',
          background: '#fef9e7',
          border: '1px solid #f6e7a8',
          borderRadius: 8,
          fontSize: 12.5,
          color: '#7a5f00',
          lineHeight: 1.55,
        }}
      >
        <strong>Heads up:</strong> connecting your domain to Zenya{' '}
        <strong>does NOT affect your email</strong>. Your existing email (e.g. info@yourdomain.com) keeps working — Zenya only changes the records that point web traffic.
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.20)', borderRadius: 8, fontSize: 13, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          style={{
            padding: '9px 14px', fontSize: 13.5, fontWeight: 500,
            background: 'transparent', color: '#6b6b6b',
            border: '1px solid #e5e2d9', borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !domain.trim()}
          style={{
            padding: '9px 16px', fontSize: 13.5, fontWeight: 600,
            background: submitting || !domain.trim() ? '#c5c2bb' : '#5e6ad2',
            color: 'white',
            border: 'none', borderRadius: 8,
            cursor: submitting ? 'wait' : 'pointer',
            boxShadow: '0 4px 14px rgba(94,106,210,0.25)',
          }}
        >
          {submitting ? 'Connecting…' : 'Next: DNS records →'}
        </button>
      </div>
    </>
  )
}

function DnsStep({
  domain,
  registrar,
  required,
  status,
  onClose,
}: {
  domain: string
  registrar: ReturnType<typeof getRegistrar>
  required: Required
  status: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1c1c1c' }}>
        Almost there — add these DNS records
      </h2>
      <p style={{ margin: '6px 0 14px', fontSize: 13.5, color: '#6b6b6b', lineHeight: 1.55 }}>
        Go to <strong>{registrar.name}</strong> and add the records below.
        Zenya will verify automatically — usually within 5-15 minutes. Status:{' '}
        <strong style={{ color: status === 'live' ? '#15803d' : '#5e6ad2' }}>
          {status === 'live' ? '🔒 Live' : 'Waiting on DNS'}
        </strong>
      </p>

      {registrar.dashboardUrl && (
        <a
          href={registrar.dashboardUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            marginBottom: 14,
            fontSize: 12.5, fontWeight: 600,
            color: '#5e6ad2',
            textDecoration: 'none',
            borderBottom: '1px solid currentColor',
          }}
        >
          Open {registrar.name} DNS panel →
        </a>
      )}

      <ol style={{ margin: '8px 0 16px 18px', padding: 0, color: '#3a3a3a', lineHeight: 1.65, fontSize: 13 }}>
        {registrar.steps.map((step, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{step}</li>
        ))}
      </ol>

      <div style={{ marginTop: 16, border: '1px solid #e5e2d9', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background: '#f7f4ed', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#6b6b6b', letterSpacing: 0.4, textTransform: 'uppercase' }}>
          DNS records to add for {domain}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'white' }}>
              <th style={th}>Type</th>
              <th style={th}>Name / Host</th>
              <th style={th}>Value</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {required.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid #ece8db' }}>
                <td style={td}><code>{r.type}</code></td>
                <td style={td}><code>{r.name}</code></td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{r.value}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => copy(r.value, `${r.type}-${i}`)}
                    style={{
                      padding: '4px 10px', fontSize: 11.5, fontWeight: 600,
                      background: copied === `${r.type}-${i}` ? '#15803d' : '#1c1c1c',
                      color: 'white',
                      border: 'none', borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {copied === `${r.type}-${i}` ? 'Copied' : 'Copy'}
                  </button>
                </td>
              </tr>
            ))}
            {required.length === 0 && (
              <tr><td colSpan={4} style={{ ...td, color: '#9b9b9b', fontStyle: 'italic' }}>
                Verification will start in a few seconds. Refresh the dashboard to see updated records.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {registrar.notes && registrar.notes.length > 0 && (
        <div style={{ marginTop: 16, padding: '10px 12px', background: '#fef9e7', border: '1px solid #f6e7a8', borderRadius: 8, fontSize: 12.5, color: '#7a5f00', lineHeight: 1.55 }}>
          {registrar.notes.map((n, i) => <div key={i}>• {n}</div>)}
        </div>
      )}

      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '9px 16px', fontSize: 13.5, fontWeight: 600,
            background: '#5e6ad2', color: 'white',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(94,106,210,0.25)',
          }}
        >
          Done — close
        </button>
      </div>
    </>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b6b6b',
  letterSpacing: 0.4,
  textTransform: 'uppercase',
}
const td: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
  color: '#3a3a3a',
}
