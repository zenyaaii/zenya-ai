'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useNotify } from '@/components/ui/Notify'
import { BillingScreen, type BillingScreenProps, type InvoiceData } from '@/components/dashboard/screens/billing'
import { longDate } from '@/components/dashboard/screens/kit'
import { PLAN_BILLING, SUBSCRIBED, asPlan } from '@/components/dashboard/plans'

type StripeInvoice = {
  number: string
  created: number
  amount: number
  currency: string
  status: 'open' | 'paid' | 'uncollectible' | 'void'
  pdf: string | null
}

const INVOICE_STATUS: Record<StripeInvoice['status'], { label: string; tone: InvoiceData['tone'] }> = {
  paid: { label: 'مدفوعة', tone: 'ok' },
  open: { label: 'مستحقة', tone: 'warn' },
  uncollectible: { label: 'متعثّرة', tone: 'bad' },
  void: { label: 'ملغاة', tone: 'quiet' },
}

function money(cents: number, currency: string): string {
  const v = (cents / 100).toFixed(2)
  return currency.toLowerCase() === 'usd' ? `${v}$` : `${v} ${currency.toUpperCase()}`
}

/** Billing: the demo's billing screen, on the owner's real plan, card and invoices. */
export default function BillingPage() {
  const { toast } = useNotify()
  const [props, setProps] = useState<BillingScreenProps | null>(null)

  useEffect(() => {
    let cancelled = false

    async function openPortal() {
      const r = await fetch('/api/account/portal', { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.url) window.location.href = j.url
      else toast({ type: 'error', message: 'تعذّر فتح بوابة الاشتراك' })
    }

    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: profile }, billing] = await Promise.all([
        supabase.from('profiles').select('plan, hosting_current_period_end').eq('id', user.id).maybeSingle(),
        fetch('/api/account/billing', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (cancelled) return

      const plan = asPlan((profile as any)?.plan)
      const spec = PLAN_BILLING[plan]
      const subscribed = SUBSCRIBED.includes(plan)
      const periodEnd = (profile as any)?.hosting_current_period_end
      const card = billing?.card

      setProps({
        planLabel: spec.label,
        price: spec.price,
        renews: subscribed && periodEnd ? `يتجدّد ${longDate(periodEnd)}` : null,
        includes: spec.includes,
        manage: subscribed ? { onClick: openPortal } : { href: '/pricing' },
        manageLabel: subscribed ? 'إدارة الاشتراك' : 'طالع الخطط',
        card: card
          ? { label: `•••• ${card.last4}`, expires: `تنتهي ${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` }
          : null,
        updateCard: { onClick: openPortal },
        invoices: ((billing?.invoices || []) as StripeInvoice[]).map((inv) => ({
          id: inv.number,
          date: longDate(inv.created),
          amount: money(inv.amount, inv.currency),
          status: INVOICE_STATUS[inv.status]?.label || inv.status,
          tone: INVOICE_STATUS[inv.status]?.tone || 'quiet',
          download: inv.pdf ? { href: inv.pdf, external: true } : undefined,
        })),
      })
    })()
    return () => { cancelled = true }
  }, [toast])

  return props ? <BillingScreen {...props} /> : null
}
