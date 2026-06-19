'use client'

import { useCallback, useEffect, useState } from 'react'

type DomainRow = {
  id: string
  domain: string
  theme_id: string
  status: 'pending_dns' | 'pending_ssl' | 'live' | 'error' | 'removed'
  verified_at: string | null
  last_checked_at: string | null
  error_message: string | null
  is_primary: boolean
  created_at: string
}

const STATUS_LABEL: Record<DomainRow['status'], { label: string; color: string; bg: string }> = {
  pending_dns: { label: 'بانتظار DNS',     color: '#7a5f00', bg: 'rgba(217,119,6,0.10)' },
  pending_ssl: { label: 'جارٍ إصدار SSL…',  color: '#5e6ad2', bg: 'rgba(94,106,210,0.10)' },
  live:        { label: '🔒 منشور',         color: '#15803d', bg: 'rgba(22,163,74,0.10)' },
  error:       { label: 'خطأ',             color: '#b91c1c', bg: 'rgba(220,38,38,0.10)' },
  removed:     { label: 'مُزال',            color: '#6b6b6b', bg: 'rgba(0,0,0,0.05)' },
}

export default function DomainsList({ themeId }: { themeId?: string }) {
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const r = await fetch('/api/domains')
    if (r.ok) {
      const j = await r.json()
      const list: DomainRow[] = j.domains || []
      setDomains(themeId ? list.filter((d) => d.theme_id === themeId) : list)
    }
    setLoading(false)
  }, [themeId])

  useEffect(() => { reload() }, [reload])

  // Poll any non-live row every 15s while the tab is focused.
  useEffect(() => {
    if (!domains.some((d) => d.status === 'pending_dns' || d.status === 'pending_ssl')) return
    let timer: any
    const tick = async () => {
      for (const d of domains) {
        if (d.status === 'pending_dns' || d.status === 'pending_ssl') {
          try {
            await fetch(`/api/domains/${d.id}`)
          } catch {}
        }
      }
      await reload()
      timer = setTimeout(tick, 15_000)
    }
    timer = setTimeout(tick, 15_000)
    return () => clearTimeout(timer)
  }, [domains, reload])

  async function remove(id: string, domain: string) {
    if (!confirm(`هل تريد فصل ${domain}؟ سيتوقّف موقعك عن العمل على هذا النطاق.`)) return
    setBusy(id)
    try {
      await fetch(`/api/domains/${id}`, { method: 'DELETE' })
      await reload()
    } finally {
      setBusy(null)
    }
  }

  async function recheck(id: string) {
    setBusy(id)
    try {
      await fetch(`/api/domains/${id}`)
      await reload()
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className="text-sm text-muted">جارٍ تحميل النطاقات…</div>
  if (domains.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {domains.map((d) => {
        const meta = STATUS_LABEL[d.status]
        return (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-token bg-white px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
              <code className="text-[13px] text-foreground">{d.domain}</code>
            </div>
            <div className="flex items-center gap-2">
              {d.status !== 'live' && (
                <button
                  onClick={() => recheck(d.id)}
                  disabled={busy === d.id}
                  className="rounded-md border border-token px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-black/5"
                >
                  {busy === d.id ? '…' : 'إعادة فحص'}
                </button>
              )}
              {d.status === 'live' && (
                <a
                  href={`https://${d.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-token px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-black/5"
                >
                  فتح ↖
                </a>
              )}
              <button
                onClick={() => remove(d.id, d.domain)}
                disabled={busy === d.id}
                className="rounded-md border border-token px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-black/5"
              >
                إزالة
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
