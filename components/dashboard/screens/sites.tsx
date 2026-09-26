'use client'

import { Folder, Plus } from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import { Act, EmptyHint, Page, PageHead, type Action } from './kit'

export type SiteFilter = 'all' | 'live' | 'draft'

export type SiteCardData = {
  id: string
  name: string
  kind: string
  host: string | null
  live: boolean
  updated: string
  edit?: Action
  preview?: Action
  primary: { label: string; action?: Action }
}

export function SitesScreen({
  sites, filter, setFilter, newSite,
}: {
  sites: SiteCardData[]
  filter: SiteFilter
  setFilter: (f: SiteFilter) => void
  newSite?: Action
}) {
  const live = sites.filter((s) => s.live).length
  const drafts = sites.length - live
  const rows = filter === 'live' ? sites.filter((s) => s.live) : filter === 'draft' ? sites.filter((s) => !s.live) : sites

  return (
    <Page>
      <PageHead
        title="مواقعك"
        sub={`${sites.length} مواقع · ${live} مباشر · ${drafts} مسوّدات`}
        icon={Folder}
        aside={<Act action={newSite} className="zy-btn"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} />موقع جديد</Act>}
      />
      <Segmented
        className="mb-4"
        label="تصفية المواقع"
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'all', label: `الكل ${sites.length}` },
          { key: 'live', label: `مباشر ${live}` },
          { key: 'draft', label: `مسوّدات ${drafts}` },
        ]}
      />

      {/* One column on a phone: a site card carries a name, an address and
          three actions, and none of that survives a 180px column. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <article key={s.id} className="flex flex-col overflow-hidden rounded-2xl zy-card">
            {/* Stands in for the site's own screenshot, carrying its initial:
                a flat grey field with a lone glyph reads as a failed image. */}
            <div className="relative flex aspect-[16/10] items-center justify-center bg-[#f4f4f6] sm:aspect-[16/9]">
              <span className="select-none text-[56px] font-black leading-none text-[rgba(17,17,17,0.17)]">
                {s.name.trim().charAt(0)}
              </span>
              <span className="absolute top-3" style={{ insetInlineStart: '0.75rem' }}>
                <span className="zy-pill" data-tone={s.live ? 'ok' : 'warn'}>{s.live ? 'مباشر' : 'مسوّدة'}</span>
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="truncate text-[14.5px] font-black leading-[1.5] text-[#171717]">{s.name}</h3>
              <p className="mt-0.5 text-[14.5px] font-medium leading-[1.7] text-[#66666e]">{s.kind} · {s.updated}</p>
              {s.host && (
                <p className="mt-2 truncate text-[14.5px] font-medium text-[#5e6ad2]" dir="ltr">{s.host}</p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <Act action={s.edit} className="zy-btn-q">تعديل</Act>
                <Act action={s.preview} className="zy-btn-q">معاينة</Act>
                <Act action={s.primary.action} className="zy-btn">{s.primary.label}</Act>
              </div>
            </div>
          </article>
        ))}
      </div>
      {rows.length === 0 && <EmptyHint>لا مواقع في هذا التصنيف.</EmptyHint>}
    </Page>
  )
}
