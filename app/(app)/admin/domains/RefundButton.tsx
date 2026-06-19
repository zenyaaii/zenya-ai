'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

/**
 * Operator-facing button that triggers a Stripe refund for a domain
 * purchase. Confirms before firing — refunds are reversible only at
 * Stripe's discretion and we don't want a misclick eating $20 of
 * margin.
 */
export default function RefundButton({
  purchaseId, domain, amount,
}: {
  purchaseId: string
  domain: string
  amount: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function refund() {
    if (!confirm(`هل تريد استرداد $${amount.toFixed(2)} مقابل ${domain}؟\n\nسيُصدر هذا استردادًا كاملًا عبر Stripe ويضع علامة "مُسترد" على عملية الشراء. لا يُلغي المُسجِّل تسجيل النطاق تلقائيًا — تعامل مع ذلك بشكل منفصل عند الحاجة.`)) {
      return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/admin/refund-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_id: purchaseId }),
      })
      const j = await r.json()
      if (!r.ok) {
        alert(`فشل الاسترداد: ${j?.message || j?.error || r.statusText}`)
        return
      }
      router.refresh()
    } catch (e: any) {
      alert(`خطأ في الشبكة: ${e?.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={refund}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md border border-token bg-white px-2 py-1 text-[11px] font-medium text-[#b91c1c] hover:bg-[rgba(220,38,38,0.06)] disabled:opacity-50"
    >
      <RotateCcw className={'h-3 w-3 ' + (busy ? 'animate-spin' : '')} />
      {busy ? 'جارٍ الاسترداد…' : 'استرداد'}
    </button>
  )
}
