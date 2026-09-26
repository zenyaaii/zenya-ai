'use client'

import { Star, MessageSquareQuote, Plus, RefreshCw, X } from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import { EmptyHint, Page, PageHead, type Action, Act } from './kit'

/**
 * Reviews: the owner picks which reviews their site shows.
 *
 * The pool is every review the owner has: the ones pulled from their Google
 * listing and the ones they typed in themselves. A switch on each row says
 * whether it is on the site. Google's own reviews can be shown or hidden but
 * not reworded; the owner's typed ones can be edited.
 */

export type ReviewRow = {
  id: string
  name: string
  rating: number
  text: string
  source: 'google' | 'manual'
  when?: string
  shown: boolean
}

export type GoogleSummary = { rating: number; count: number } | null

export type ReviewsPanelProps = {
  google: GoogleSummary
  link: string
  setLink?: (v: string) => void
  fetching?: boolean
  onFetch?: Action
  reviews: ReviewRow[]
  onToggle?: (id: string) => void
  onAdd?: Action
  onEdit?: (id: string) => void
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          strokeWidth={0}
          fill={i <= n ? '#f5a524' : 'rgba(17,17,17,0.14)'}
        />
      ))}
    </span>
  )
}

/** The body both layouts share: the Google strip, then the list. */
export function ReviewsPanel({
  google, link, setLink, fetching, onFetch, reviews, onToggle, onAdd, onEdit,
}: ReviewsPanelProps) {
  const shown = reviews.filter((r) => r.shown).length
  return (
    <div className="space-y-4">
      <section className="rounded-2xl zy-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="zy-h3">تقييمات Google</h3>
          {google && (
            <span className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-[#171717]">
              <Star className="h-4 w-4" strokeWidth={0} fill="#f5a524" />
              <span className="tabular-nums">{google.rating.toFixed(1)}</span>
              <span className="font-medium text-[#66666e]">· {google.count} تقييم</span>
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={link}
            readOnly={!setLink}
            onChange={(e) => setLink?.(e.target.value)}
            dir="ltr"
            placeholder="https://maps.app.goo.gl/..."
            className="min-w-0 flex-1 px-3 py-2.5 text-[14.5px] font-medium"
            aria-label="رابط نشاطك على خرائط Google"
          />
          <Act action={onFetch} className="zy-btn justify-center">
            <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} strokeWidth={2.25} />
            {fetching ? 'جارٍ الجلب…' : google ? 'حدّث من Google' : 'اجلب من Google'}
          </Act>
        </div>
        <p className="mt-2 text-[14.5px] font-medium leading-[1.7] text-[#66666e]">
          Google يعطينا آخر 5 تقييمات فقط. تقييمات Google تظهر كما كتبها أصحابها.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[14.5px] font-bold text-[#171717]">
          يظهر في موقعك <span className="tabular-nums">{shown}</span> من <span className="tabular-nums">{reviews.length}</span>
        </p>
        <Act action={onAdd} className="zy-btn-q">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />أضف تقييمًا
        </Act>
      </div>

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl zy-card p-4 transition-opacity sm:p-5"
            style={{ opacity: r.shown ? 1 : 0.55 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-black leading-[1.5] text-[#171717]" dir="auto">{r.name}</span>
                  <span className="zy-pill" data-tone={r.source === 'google' ? 'accent' : 'quiet'}>
                    {r.source === 'google' ? 'Google' : 'أضفته أنت'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Stars n={r.rating} />
                  {r.when && <span className="text-[13px] font-medium text-[#66666e]">{r.when}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggle?.(r.id)}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-2 text-[13px] font-bold text-[#56565a]"
                aria-pressed={r.shown}
                aria-label={r.shown ? `إخفاء تقييم ${r.name}` : `إظهار تقييم ${r.name}`}
              >
                <span className="hidden sm:inline">{r.shown ? 'يظهر' : 'مخفي'}</span>
                <span className="zy-switch" data-on={r.shown ? '' : undefined}>
                  <span className="zy-switch-knob" />
                </span>
              </button>
            </div>
            <p className="mt-2.5 line-clamp-3 text-[14.5px] font-medium leading-[1.8] text-[#3a3a40]" dir="auto">{r.text}</p>
            {r.source === 'manual' && onEdit && (
              <button type="button" onClick={() => onEdit(r.id)} className="zy-link mt-2 text-[14px] font-bold">
                تعديل النص
              </button>
            )}
          </li>
        ))}
      </ul>
      {reviews.length === 0 && (
        <EmptyHint>لا تقييمات بعد. ألصق رابطك على Google أو أضف تقييمًا بنفسك.</EmptyHint>
      )}
    </div>
  )
}

/** Option A: its own page in the rail, with a site picker at the top. */
export function ReviewsScreen({
  sites, siteId, setSiteId, ...panel
}: ReviewsPanelProps & {
  sites: { id: string; name: string }[]
  siteId: string
  setSiteId: (id: string) => void
}) {
  return (
    <Page>
      <PageHead
        title="التقييمات"
        sub="اختر التقييمات التي تظهر في موقعك. التغيير يظهر فورًا بدون فتح المحرّر."
        icon={MessageSquareQuote}
      />
      {sites.length > 1 && (
        <Segmented
          className="mb-4"
          label="اختر الموقع"
          value={siteId}
          onChange={setSiteId}
          items={sites.map((s) => ({ key: s.id, label: s.name }))}
        />
      )}
      <div className="max-w-3xl">
        <ReviewsPanel {...panel} />
      </div>
    </Page>
  )
}

/** Option B: a side sheet opened from a site's card on the Sites page. */
export function ReviewsSheet({
  siteName, onClose, ...panel
}: ReviewsPanelProps & { siteName: string; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(17,17,17,0.32)]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`تقييمات ${siteName}`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[20px] bg-[var(--background,#fafafa)] shadow-2xl sm:inset-y-0 sm:left-0 sm:right-auto sm:max-h-none sm:w-[460px] sm:rounded-none"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.08)' }}>
          <div className="min-w-0">
            <div className="zy-eyebrow">التقييمات</div>
            <h2 className="truncate text-[16px] font-black text-[#171717]">{siteName}</h2>
          </div>
          <button type="button" onClick={onClose} className="zy-icon-btn inline-flex" aria-label="أغلق">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ReviewsPanel {...panel} />
        </div>
      </aside>
    </>
  )
}
