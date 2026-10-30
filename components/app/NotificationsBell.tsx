'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, MapPin, PackageCheck, Sparkles } from 'lucide-react'
import { dashFont } from './dash-font'

/**
 * The bell in the top bar. It carries three kinds of news: new Google reviews
 * that the daily check found for one of the owner's sites, a site Beynoun
 * handed over to this account, which asks yes or no, and a notice from Beynoun
 * with a link (public.user_notices).
 */
export type BellItem = {
  id: string
  /** "3 تقييمات جديدة" */
  title: string
  /** The site's name. */
  site: string
  /** "اليوم 9:00 ص" */
  when: string
  href?: string
  /** Open href in a new tab (a notice's link usually leaves the dashboard). */
  external?: boolean
  /** 'notice' is a message from Beynoun; anything else is a review. */
  kind?: 'notice'
  onOpen?: () => void
  /** A handover: the question and its two answers, shown in the item itself. */
  handover?: {
    host: string
    plan: string
    done?: boolean
    onYes: () => void
    noHref: string
  }
}

export function NotificationsBell({ items, label = 'الإشعارات' }: { items: BellItem[]; label?: string }) {
  // An answered handover stays in the list until the page changes, but is no longer news.
  const count = items.filter((it) => !it.handover?.done).length
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="zy-icon-btn relative inline-flex" data-tour="bell" aria-label={count ? `${label}: ${count} جديد` : label}>
          <Bell className="h-[19px] w-[19px]" strokeWidth={2} />
          {count > 0 && (
            <span className="absolute -top-0.5 inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#d6453d] px-1 text-[11px] font-black leading-none text-white" style={{ insetInlineEnd: -2 }}>
              {count}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={`zy-tokens zy-dash ${dashFont.variable} z-[70] w-[min(320px,calc(100vw-24px))] rounded-2xl bg-white p-2`}
          style={{ boxShadow: 'var(--shadow-pop)' }}
        >
          <div dir="rtl">
          <div className="px-2 pb-1.5 pt-1 text-[13.5px] font-black text-[#171717]">{label}</div>
          {items.length === 0 && <p className="px-2 py-4 text-center text-[13.5px] font-medium text-[#66666e]">لا جديد الآن.</p>}
          {items.map((it) => it.handover ? (
            <HandoverItem key={it.id} it={it} />
          ) : (
            <DropdownMenu.Item key={it.id} asChild onSelect={it.onOpen}>
              <a href={it.href || '#'} {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="flex items-start gap-3 rounded-xl p-2 outline-none hover:bg-[#f4f4f6] focus-visible:bg-[#f4f4f6]">
                {it.kind === 'notice' ? (
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f4f6]">
                    <Sparkles className="h-4 w-4 text-[#171717]" strokeWidth={2.25} />
                  </span>
                ) : (
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdecea]">
                    <MapPin className="h-4 w-4 text-[#d6453d]" strokeWidth={2.25} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-[#171717]">{it.title}</span>
                  <span className={`block text-[13px] font-medium text-[#66666e] ${it.kind === 'notice' ? '' : 'truncate'}`}>{it.site} · {it.when}</span>
                </span>
              </a>
            </DropdownMenu.Item>
          ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** "Your site is in your account. Did you get everything?" with the two answers. */
function HandoverItem({ it }: { it: BellItem }) {
  const h = it.handover!
  return (
    <div className="flex items-start gap-3 rounded-xl p-2">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f5ec]">
        <PackageCheck className="h-4 w-4 text-[#15803d]" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-[#171717]">{it.title}</span>
        <span className="block truncate text-[13px] font-medium text-[#66666e]" dir="ltr" style={{ textAlign: 'right' }}>{h.host}</span>
        <span className="block text-[13px] font-medium text-[#66666e]">الباقة: {h.plan} · {it.when}</span>
        {h.done ? (
          <span className="mt-2 block text-[13.5px] font-bold text-[#15803d]">شكرًا، سجّلنا أنه وصلك.</span>
        ) : (
          <>
            <span className="mt-2 block text-[13.5px] font-bold text-[#171717]">هل وصلك كل شيء؟</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <DropdownMenu.Item
                onSelect={(e) => { e.preventDefault(); h.onYes() }}
                className="cursor-pointer rounded-full bg-[#171717] px-3 py-1.5 text-[13px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-1"
              >
                نعم، وصلني
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <a
                  href={h.noHref}
                  className="rounded-full px-3 py-1.5 text-[13px] font-bold text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(17,17,17,0.18)' }}
                >
                  لا، فيه مشكلة
                </a>
              </DropdownMenu.Item>
            </span>
          </>
        )}
      </span>
    </div>
  )
}
