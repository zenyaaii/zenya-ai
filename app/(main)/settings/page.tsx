'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { openConsent } from '@/components/CookieConsent'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)
  const [dark, setDark] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    const val = localStorage.getItem('zenya_theme') === 'dark'
    setDark(val)
    document.documentElement.classList.toggle('dark', val)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || null)
      else router.push('/login?next=/settings')
    })
  }, [router, supabase])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('zenya_theme', next ? 'dark' : 'light')
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/account/portal', { method: 'POST' })
      const j = await res.json()
      if (!res.ok || !j.url) {
        // 409 = user never subscribed; nudge them to /pricing instead
        if (res.status === 409) {
          window.location.href = '/dashboard'
          return
        }
        throw new Error(j.message || j.details || 'Could not open billing portal')
      }
      window.location.href = j.url
    } catch (e: any) {
      alert(e.message || 'Could not open billing portal')
      setPortalLoading(false)
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zenya-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(`Couldn't export: ${e.message || e}`)
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.details || 'Delete failed')
      }
      await supabase.auth.signOut()
      router.push('/?account_deleted=1')
    } catch (e: any) {
      alert(`Couldn't delete: ${e.message || e}`)
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold">Settings</h1>
      <p className="mt-2 text-muted">
        Signed in as <strong>{email || '...'}</strong>
      </p>

      <div className="mt-10 space-y-6">
        {/* Appearance */}
        <Card title="Appearance">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={dark}
              onChange={toggleDark}
              className="h-5 w-5 rounded border-token"
            />
            <span>Dark mode</span>
          </label>
          <p className="mt-2 text-sm text-muted">
            Toggles the site between light and dark. Saved on this device.
          </p>
        </Card>

        {/* Subscription */}
        <Card title="Subscription">
          <p className="text-sm text-muted">
            Manage your billing, change your payment method, view invoices, or cancel — all from the secure Stripe customer portal.
          </p>
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="mt-3 inline-flex w-fit items-center gap-2 rounded-md border border-token bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 disabled:opacity-60"
          >
            {portalLoading ? 'Opening portal…' : 'Manage subscription →'}
          </button>
          <p className="mt-2 text-xs text-muted">
            See our <Link href="/refund" className="underline">Refund Policy</Link> for cancellation details.
          </p>
        </Card>

        {/* Privacy & cookies */}
        <Card title="Privacy & cookies">
          <div className="space-y-2.5">
            <button
              onClick={openConsent}
              className="block text-sm font-medium text-primary hover:underline"
            >
              Manage cookie preferences
            </button>
            <Link
              href="/privacy"
              className="block text-sm font-medium text-primary hover:underline"
            >
              View Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="block text-sm font-medium text-primary hover:underline"
            >
              View Terms of Service
            </Link>
          </div>
        </Card>

        {/* Your data — GDPR */}
        <Card title="Your data">
          <p className="text-sm text-muted">
            Under GDPR you have the right to access, export, and delete your personal data at any time.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={exportData}
              disabled={exporting}
              className="rounded-md border border-token bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 disabled:opacity-60"
            >
              {exporting ? 'Preparing…' : 'Download my data (JSON)'}
            </button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card title="Danger zone" tone="danger">
          <p className="text-sm text-muted">
            Permanently delete your account, your themes, your scrape history, and your subscription. Stripe billing is cancelled automatically. Tax-required invoice records are retained per Dutch law (7 years). <strong>This cannot be undone.</strong>
          </p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="mt-4 rounded-md border border-[#dc2626] bg-white px-4 py-2 text-sm font-semibold text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
            >
              Delete my account…
            </button>
          ) : (
            <div className="mt-4 space-y-3 rounded-lg border border-[#dc2626] bg-[#fef2f2] p-4">
              <p className="text-sm text-[#7f1d1d]">
                Type <strong>DELETE</strong> below to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-md border border-token bg-white px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="rounded-md bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Permanently delete account'}
                </button>
                <button
                  onClick={() => {
                    setShowDelete(false)
                    setConfirmText('')
                  }}
                  className="rounded-md border border-token bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}

function Card({
  title,
  tone,
  children,
}: {
  title: string
  tone?: 'danger'
  children: React.ReactNode
}) {
  return (
    <section
      className={`rounded-2xl border bg-elevated p-6 shadow-soft-md ${
        tone === 'danger' ? 'border-[#fecaca]' : 'border-token'
      }`}
    >
      <h2
        className={`mb-3 text-lg font-semibold ${
          tone === 'danger' ? 'text-[#dc2626]' : 'text-foreground'
        }`}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
