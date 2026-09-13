'use client'

import { CheckCircle2, CreditCard, Download } from 'lucide-react'
import { Act, EmptyHint, Page, PageHead, type Action, type Tone } from './kit'

export type InvoiceData = {
  id: string
  date: string
  amount: string
  status: string
  tone: Tone
  download?: Action
}

export type BillingScreenProps = {
  planLabel: string
  price: string
  renews: string | null
  includes: string[]
  manage?: Action
  manageLabel?: string
  card: { label: string; expires: string } | null
  updateCard?: Action
  invoices: InvoiceData[]
}

export function BillingScreen({
  planLabel, price, renews, includes, manage, manageLabel = 'إدارة الاشتراك', card, updateCard, invoices,
}: BillingScreenProps) {
  return (
    <Page>
      <PageHead
        title="الفوترة"
        sub="باقتك، وسجلّ الدفع، وطرق الدفع المحفوظة."
        icon={CreditCard}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-2xl zy-card p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-[#15803d]" strokeWidth={2.5} />
                <span className="zy-eyebrow">{planLabel}</span>
              </div>
              <div className="mt-1.5 text-[22px] font-black leading-[1.35] text-[#171717]">{price}</div>
              {renews && <div className="zy-sub mt-1">{renews}</div>}
            </div>
            <Act action={manage} className="zy-btn-q shrink-0">{manageLabel}</Act>
          </div>
          <div className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {includes.map((t) => (
              <div key={t} className="flex items-start gap-2 text-[14.5px] font-medium leading-[1.7] text-[#171717]">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803d]" strokeWidth={2.25} />
                <span className="min-w-0">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl zy-card p-4 sm:p-5">
          <div className="zy-eyebrow">طريقة الدفع</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="zy-tile"><CreditCard className="h-4 w-4" strokeWidth={2} /></div>
            <div className="min-w-0">
              <div className="text-[14.5px] font-bold text-[#171717]" dir={card ? 'ltr' : undefined}>
                {card ? card.label : 'لا بطاقة محفوظة'}
              </div>
              {card && <div className="zy-sub">{card.expires}</div>}
            </div>
          </div>
          {card && <Act action={updateCard} className="zy-btn-q mt-4">تحديث البطاقة</Act>}
        </div>
      </div>

      <h3 className="zy-h2 mb-2.5 mt-6">الفواتير</h3>
      {/* The table owns its own overflow so the PAGE never gets one. */}
      <div className="overflow-hidden rounded-2xl zy-card">
        {invoices.length === 0 ? (
          <EmptyHint>لا فواتير بعد.</EmptyHint>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-start">
              <thead>
                <tr>
                  {['الفاتورة', 'التاريخ', 'المبلغ', 'الحالة', ''].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-4 py-2.5 text-start text-[14.5px] font-bold text-[#66666e]" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.07)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-[14.5px] font-bold text-[#171717]" dir="ltr">{inv.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[14.5px] font-medium text-[#56565a]">{inv.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[14.5px] font-medium tabular-nums text-[#171717]">{inv.amount}</td>
                    <td className="whitespace-nowrap px-4 py-3"><span className="zy-pill" data-tone={inv.tone}>{inv.status}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-end">
                      <Act action={inv.download} className="zy-link"><Download className="h-3 w-3" strokeWidth={2.25} />تحميل</Act>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  )
}
