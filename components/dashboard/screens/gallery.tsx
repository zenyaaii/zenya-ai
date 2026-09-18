'use client'

import { Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { Act, EmptyHint, Page, PageHead, type Action } from './kit'

export type AssetData = {
  id: string
  name: string
  site: string
  size: string
  /** The real image. The demo has none and paints `tint` instead. */
  url?: string
  tint?: string
  open?: Action
}

export function GalleryScreen({
  assets, usedLabel, upload, uploading = false,
}: {
  assets: AssetData[]
  usedLabel: string
  upload?: Action
  uploading?: boolean
}) {
  return (
    <Page>
      <PageHead
        title="المعرض"
        sub="كل الصور والملفات التي تستخدمها مواقعك، في مكان واحد."
        icon={ImageIcon}
        aside={
          <Act action={upload} className="zy-btn">
            {uploading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Upload className="h-3.5 w-3.5" strokeWidth={2.5} />}
            {uploading ? 'جارٍ الرفع…' : 'ارفع ملفًا'}
          </Act>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="zy-pill" data-tone="quiet">{assets.length} ملفًا</span>
        <span className="zy-pill" data-tone="quiet">{usedLabel}</span>
      </div>

      {/* Two up on a phone, six up on a wide screen. A thumbnail grid is the
          one place a phone can carry more than one column comfortably. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {assets.map((a) => (
          <figure key={a.id} className="group overflow-hidden rounded-2xl zy-card">
            <Act action={a.open} className="block aspect-square w-full">
              {a.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.name} loading="lazy" className="h-full w-full bg-[#f4f4f6] object-cover" />
              ) : (
                <span className="block h-full w-full" style={{ background: a.tint }} aria-hidden />
              )}
            </Act>
            <figcaption className="min-w-0 p-2.5">
              <div className="truncate text-[14.5px] font-bold leading-[1.5] text-[#171717]">{a.name}</div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate text-[14.5px] font-medium text-[#66666e]">{a.site}</span>
                <span className="shrink-0 text-[14.5px] font-medium tabular-nums text-[#66666e]">{a.size}</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {assets.length === 0 && <EmptyHint>لا ملفات بعد. ارفع صورتك الأولى من الزر بالأعلى.</EmptyHint>}
    </Page>
  )
}
