'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle2, Sparkles, ExternalLink, Receipt, ArrowRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type Plan = 'free' | 'pro_onetime' | 'pro_hosting' | 'admin'

type Profile = {
  plan: Plan
  is_pro: boolean
  has_hosting: boolean
  hosting_status: string | null
  hosting_current_period_end: string | null
  pro_purchased_at: string | null
  pro_amount_cents: number | null
  pro_currency: string | null
  email?: string | null
}

export default function BillingPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalBusy, setPortalBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting, hosting_status, hosting_current_period_end, pro_purchased_at, pro_amount_cents, pro_currency, email')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setProfile((data as unknown as Profile) || null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [supabase])

  async function openPortal() {
    setPortalBusy(true)
    try {
      const r = await fetch('/api/account/portal', { method: 'POST' })
      if (r.ok) {
        const { url } = await r.json()
        if (url) window.location.href = url
      }
    } finally { setPortalBusy(false) }
  }

  const plan: Plan = profile?.plan || 'free'
  const renews = profile?.hosting_current_period_end ? new Date(profile.hosting_current_period_end) : null
  const purchased = profile?.pro_purchased_at ? new Date(profile.pro_purchased_at) : null

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 border-b border-token pb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">Billing</h1>
        <p className="mt-1 text-[13px] text-muted">
          Your plan, payment history, and Stripe Customer Portal — invoices and saved payment methods.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-token bg-white p-6">
              <div className="h-4 w-1/3 rounded bg-[rgba(28,28,28,0.06)]" />
              <div className="mt-3 h-3 w-1/2 rounded bg-[rgba(28,28,28,0.04)]" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Current plan card */}
          <section className="rounded-2xl border border-token bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                {plan === 'pro_hosting' && <PlanHeader icon="✓" tint="#15803d" label="Hosting active" />}
                {plan === 'pro_onetime' && <PlanHeader icon="★" tint="#5e6ad2" label="Pro · Lifetime" />}
                {plan === 'admin' && <PlanHeader icon="★" tint="#9b6f00" label="Admin · all features" />}
                {plan === 'free' && <PlanHeader icon=" " tint="#6b6b6b" label="Free Plan" />}

                <div className="mt-2 text-[26px] font-bold tracking-tight text-foreground">
                  {plan === 'pro_hosting' && '$19.99 / month'}
                  {plan === 'pro_onetime' && '$9.99 paid once'}
                  {plan === 'admin' && 'No charge'}
                  {plan === 'free' && '$0'}
                </div>

                <div className="mt-1 text-[13px] text-muted">
                  {plan === 'pro_hosting' && renews && <>Renews {renews.toLocaleDateString(undefined, { dateStyle: 'medium' })}</>}
                  {plan === 'pro_onetime' && purchased && <>Lifetime access · purchased {purchased.toLocaleDateString(undefined, { dateStyle: 'medium' })}</>}
                  {plan === 'free' && '3 free generations on signup. No subscription.'}
                  {plan === 'admin' && 'Internal team account'}
                </div>
              </div>

              {/* Plan actions */}
              <div className="flex flex-col gap-2">
                {plan === 'free' && (
                  <>
                    <Link href="/checkout?plan=onetime"
                          className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white">
                      Get Pro · $9.99
                      <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                    </Link>
                    <Link href="/checkout?plan=hosting"
                          className="inline-flex items-center justify-center gap-1 rounded-full border border-token bg-white px-4 py-2 text-[12.5px] font-semibold text-foreground hover:bg-black/5">
                      Start Hosting · $19.99/mo
                    </Link>
                  </>
                )}
                {plan === 'pro_onetime' && (
                  <Link href="/checkout?plan=hosting"
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white">
                    Add Hosting · $19.99/mo
                    <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                  </Link>
                )}
                {plan === 'pro_hosting' && (
                  <button onClick={openPortal} disabled={portalBusy}
                          className="inline-flex items-center justify-center gap-1 rounded-full border border-token bg-white px-4 py-2 text-[12.5px] font-semibold text-foreground hover:bg-black/5">
                    <CreditCard className="h-3 w-3" />
                    {portalBusy ? 'Opening…' : 'Manage subscription'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Stripe portal + invoices */}
          {(plan === 'pro_onetime' || plan === 'pro_hosting') && (
            <section className="mt-4 rounded-2xl border border-token bg-white p-6">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Invoices & payment methods</h2>
              <p className="mt-1 text-[12.5px] text-muted">
                The Stripe Customer Portal handles invoices, receipts, and payment-method updates.
              </p>
              <button onClick={openPortal} disabled={portalBusy}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-token bg-white px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-black/5">
                <Receipt className="h-3.5 w-3.5" strokeWidth={2.25} />
                {portalBusy ? 'Opening Stripe…' : 'Open Stripe portal'}
                <ExternalLink className="h-3 w-3 opacity-70" />
              </button>
            </section>
          )}

          {/* What's included */}
          <section className="mt-4 rounded-2xl border border-token bg-white p-6">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">What's included</h2>
            <ul className="mt-3 space-y-2 text-[13px]">
              <Included on={true}                  label="Free · 3 AI-generated sites" />
              <Included on={plan !== 'free'}       label="Pro · Unlimited generations" />
              <Included on={plan !== 'free'}       label="Pro · Shopify OS 2.0 ZIP exports" />
              <Included on={plan !== 'free'}       label="Pro · Project ZIPs for non-Shopify templates" />
              <Included on={plan === 'pro_hosting' || plan === 'admin'} label="Hosting · Live at zenya.app/s/{slug}" />
              <Included on={plan === 'pro_hosting' || plan === 'admin'} label="Hosting · Custom domain + automatic SSL" />
              <Included on={plan === 'pro_hosting' || plan === 'admin'} label="Hosting · Edit content + style without regenerating" />
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function PlanHeader({ icon, tint, label }: { icon: string; tint: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: tint }}>
      {icon !== ' ' && (icon === '✓' ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />)}
      {label}
    </div>
  )
}

function Included({ on, label }: { on: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-foreground">
      <span className={'inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ' + (on ? 'bg-[#15803d]/15 text-[#15803d]' : 'bg-[rgba(28,28,28,0.06)] text-muted')}>
        {on ? '✓' : '·'}
      </span>
      <span className={on ? 'text-foreground' : 'text-muted line-through'}>{label}</span>
    </li>
  )
}
