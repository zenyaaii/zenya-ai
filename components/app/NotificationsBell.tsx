'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, MapPin } from 'lucide-react'

/**
 * The bell in the top bar. For now it carries one kind of news: new Google
 * reviews that the daily check found for one of the owner's sites.
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
  onOpen?: () => void
}

export function NotificationsBell({ items, label = 'الإشعارات' }: { items: BellItem[]; label?: string }) {
  const count = items.length
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="zy-icon-btn relative inline-flex" aria-label={count ? `${label}: ${count} جديد` : label}>
          <Bell className="h-4 w-4" />
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
          className="zy-tokens z-[70] w-[min(320px,calc(100vw-24px))] rounded-2xl bg-white p-2"
          style={{ boxShadow: '0 16px 40px rgba(17,17,17,0.16), 0 0 0 1px rgba(17,17,17,0.06)' }}
        >
          <div dir="rtl">
          <div className="px-2 pb-1.5 pt-1 text-[13.5px] font-black text-[#171717]">{label}</div>
          {count === 0 && <p className="px-2 py-4 text-center text-[13.5px] font-medium text-[#66666e]">لا جديد الآن.</p>}
          {items.map((it) => (
            <DropdownMenu.Item key={it.id} asChild onSelect={it.onOpen}>
              <a href={it.href || '#'} className="flex items-start gap-3 rounded-xl p-2 outline-none hover:bg-[#f4f4f6] focus-visible:bg-[#f4f4f6]">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdecea]">
                  <MapPin className="h-4 w-4 text-[#d6453d]" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-[#171717]">{it.title}</span>
                  <span className="block truncate text-[13px] font-medium text-[#66666e]">{it.site} · {it.when}</span>
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
