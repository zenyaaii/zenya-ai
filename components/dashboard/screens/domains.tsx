'use client'

import type { ReactNode } from 'react'
import { Globe, Plus, ShieldCheck } from 'lucide-react'
import { Act, EmptyHint, Page, PageHead, type Action, type Tone } from './kit'

export type DomainData = {
  id: string
  domain: string
  site: string
  status: string
  tone: Tone
  ssl: boolean
  renews: string
  manage?: Action
}

export function DomainsScreen({
  domains, add, addMenu,
}: {
  domains: DomainData[]
  add?: Action
  /** A menu opened by the add button (which site the domain is for). */
  addMenu?: ReactNode
}) {
  return (
    <Page>
      <PageHead
        title="النطاقات"
        sub="اربط نطاقك الخاص بموقعك، وتتكفّل زينيا بشهادة SSL والتجديد."
        icon={Globe}
        aside={
          <div className="relative">
            <Act action={add} className="zy-btn"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} />أضف نطاقًا</Act>
            {addMenu}
          </div>
        }
      />
      <ul className="space-y-3">
        {domains.map((d) => (
          <li key={d.id} className="rounded-2xl zy-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[14.5px] font-black text-[#171717]" dir="ltr">{d.domain}</span>
                  <span className="zy-pill shrink-0" data-tone={d.tone}>{d.status}</span>
                </div>
                <p className="mt-1 truncate text-[14.5px] font-medium leading-[1.7] text-[#66666e]">
                  {d.site} · يتجدّد {d.renews}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.ssl && (
                  <span className="zy-pill" data-tone="ok">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2.25} /> SSL
                  </span>
                )}
                <Act action={d.manage} className="zy-btn-q">إدارة</Act>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {domains.length === 0 && <EmptyHint>لا نطاقات مربوطة بعد.</EmptyHint>}
      <div className="mt-4 rounded-2xl zy-card p-4 sm:p-5">
        <div className="zy-eyebrow">كيف يعمل الربط</div>
        <ol className="mt-3 space-y-2.5">
          {['أضف النطاق هنا', 'انسخ سجلّي DNS إلى مزوّد النطاق', 'انتظر حتى 24 ساعة للتفعيل'].map((t, i) => (
            <li key={t} className="flex items-start gap-2.5 text-[14.5px] font-medium leading-[1.8] text-[#171717]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(94,106,210,0.10)] text-[14.5px] font-black text-[#5e6ad2]">
                {i + 1}
              </span>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </Page>
  )
}
