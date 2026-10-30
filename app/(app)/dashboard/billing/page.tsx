'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PLAN_BILLING, SUBSCRIBED, asPlan } from '@/components/dashboard/plans'
import V6Billing, { V6_PLANS as PLANS, type V6BillingProps } from '@/components/app/v6/pages/Billing'
import { dateAr } from '@/components/app/v6/pages/kit'
import { useV6 } from '@/components/app/v6/ui'

type StripeInvoice = {
  number: string
  created: number
  amount: number
  currency: string
  status: 'open' | 'paid' | 'uncollectible' | 'void'
  pdf: string | null
}

const INVOICE_STATUS: Record<StripeInvoice['status'], [string, string]> = {
  paid: ['مدفوعة', 'ok'],
  open: ['مستحقة', 'warn'],
  uncollectible: ['متعثّرة', 'bad'],
  void: ['ملغاة', ''],
}

function money(cents: number, currency: string): string {
  const v = (cents / 100).toFixed(2)
  return currency.toLowerCase() === 'usd' ? `${v}$` : `${v} ${currency.toUpperCase()}`
}

/** «24.99$ / شهريًا» → ['24.99$', 'شهريًا'] */
const priceParts = (s: string): [string, string | null] => {
  const [a, b] = s.split(' / ')
  return [a, b || null]
}

/** Billing: the v6 design's billing page, on the owner's real plan, card and invoices. */
export default function BillingPage() {
  const { toast } = useV6()
  const [props, setProps] = useState<V6BillingProps | null>(null)

  useEffect(() => {
    let cancelled = false

    async function openPortal() {
      const r = await fetch('/api/account/portal', { method: 'POST' }).catch(() => null)
      const j = r ? await r.json().catch(() => ({})) : {}
      if (r?.ok && j.url) window.location.href = j.url
      else toast('تعذّر فتح بوابة الاشتراك', { ok: false })
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
      const invoices = (billing?.invoices || []) as StripeInvoice[]
      const [price, per] = priceParts(spec.price)
      const hasCustomer = !!card || invoices.length > 0
      const holder = String(user.user_metadata?.full_name || user.user_metadata?.name || '').toUpperCase()

      setProps({
        current: {
          label: plan === 'pro' ? 'Pro نشط' : plan === 'starter' ? 'Starter نشط' : spec.label,
          price,
          per,
          on: subscribed && periodEnd ? dateAr(periodEnd) : null,
          renews: subscribed && periodEnd ? `يتجدّد تلقائيًا في ${dateAr(periodEnd)}` : subscribed ? 'يتجدّد تلقائيًا كل شهر' : plan === 'free' || plan === 'entry' ? 'مجانية، بلا دفع' : 'بلا تجديد شهري',
          inc: PLANS.find((x) => x.id === (plan === 'free' ? 'entry' : plan))?.inc || spec.includes,
          paid: plan !== 'free' && plan !== 'entry',
          id: plan === 'free' || plan === 'entry' ? 'entry' : plan === 'starter' || plan === 'pro' ? plan : null,
        },
        card: card ? {
          brand: String(card.brand || 'card'),
          last4: String(card.last4),
          exp: `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`,
          holder,
        } : null,
        invoices: invoices.map((inv) => ({
          id: inv.number,
          date: dateAr(inv.created),
          amount: money(inv.amount, inv.currency),
          status: INVOICE_STATUS[inv.status]?.[0] || inv.status,
          tone: INVOICE_STATUS[inv.status]?.[1] || '',
          pdf: inv.pdf,
        })),
        plans: PLANS,
        portal: subscribed || hasCustomer ? openPortal : null,
        // A subscription changes in Stripe's portal; without one, checkout starts it.
        choose: (id) => (subscribed ? { onSelect: openPortal } : id === 'entry' ? { href: '/pricing' } : { href: `/checkout?plan=${id}` }),
      })
    })()
    return () => { cancelled = true }
  }, [toast])

  return props ? <V6Billing {...props} /> : null
}
