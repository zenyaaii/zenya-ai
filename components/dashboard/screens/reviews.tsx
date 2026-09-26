'use client'

import { useState } from 'react'
import { MapPin, MessageSquareQuote, Plus, RefreshCw, Star, Link2 } from 'lucide-react'
import { Segmented, TabBar } from '@/components/app/Segmented'
import { Act, EmptyHint, Page, PageHead, type Action } from './kit'

/**
 * Reviews: the owner picks which reviews their site shows.
 *
 * The pool is every review the owner has: the ones pulled from their Google
 * listing and the ones they typed in themselves. A switch on each row says
 * whether it is on the site. Google's own reviews can be shown or hidden but
 * never reworded (Google's terms); the owner's typed ones can be edited.
 *
 * The Google link the owner gave in the wizard is already the source here, so
 * a site built with a link opens connected, not on an empty field.
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

export type ReviewSource = {
  /** The Google Maps link from the wizard or from this page. */
  link: string
  rating: number | null
  count: number | null
  /** "قبل 3 دقائق" — when the reviews were last pulled. */
  fetched?: string
} | null

export type ReviewsScreenProps = {
  sites: { id: string; name: string }[]
  siteId: string
  setSiteId: (id: string) => void
  source: ReviewSource
  draftLink: string
  setDraftLink?: (v: string) => void
  fetching?: boolean
  onFetch?: Action
  reviews: ReviewRow[]
  onToggle?: (id: string) => void
  onAdd?: Action
  onEdit?: (id: string) => void
  /** Sample only: which of the two candidate layouts to draw. */
  layout?: 'preview' | 'tabs'
}

/* ── small parts ────────────────────────────────────────────────────────── */

const AVATAR_TINTS = ['#e9e7fb', '#e3f1ea', '#fbeee2', '#e6eef9', '#f6e6ee', '#eef0e2']
const AVATAR_INKS  = ['#4b53a8', '#23714a', '#9a5a1c', '#2f5d98', '#98385f', '#5d6420']

function tintFor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h % AVATAR_TINTS.length
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const i = tintFor(name)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-black"
      style={{ width: size, height: size, background: AVATAR_TINTS[i], color: AVATAR_INKS[i], fontSize: size * 0.4 }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${n} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          strokeWidth={0}
          fill={i <= Math.round(n) ? '#f2a33a' : 'rgba(17,17,17,0.13)'}
        />
      ))}
    </span>
  )
}

function Switch({ on, name, onToggle }: { on: boolean; name: string; onToggle?: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex min-h-[40px] shrink-0 items-center gap-2 text-[13.5px] font-bold"
      style={{ color: on ? 'var(--violet)' : 'var(--stone-2)' }}
      aria-pressed={on}
      aria-label={on ? `إخفاء تقييم ${name} من الموقع` : `إظهار تقييم ${name} في الموقع`}
    >
      <span className="hidden sm:inline">{on ? 'في الموقع' : 'مخفي'}</span>
      <span className="zy-switch" data-on={on ? '' : undefined}><span className="zy-switch-knob" /></span>
    </button>
  )
}

function SourceTag({ source }: { source: ReviewRow['source'] }) {
  return source === 'google'
    ? <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#56565a]"><MapPin className="h-3.5 w-3.5 text-[#d6453d]" strokeWidth={2.25} />Google</span>
    : <span className="text-[13px] font-bold text-[#66666e]">أضفته أنت</span>
}

/** Where the reviews come from: connected (from the wizard) or not yet. */
function SourceCard({
  source, draftLink, setDraftLink, fetching, onFetch,
}: Pick<ReviewsScreenProps, 'source' | 'draftLink' | 'setDraftLink' | 'fetching' | 'onFetch'>) {
  if (!source) {
    return (
      <section className="rounded-2xl zy-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#d6453d]" strokeWidth={2.25} />
          <h3 className="zy-h3">اربط تقييمات Google</h3>
        </div>
        <p className="mt-1 text-[14px] font-medium leading-[1.8] text-[#66666e]">ألصق رابط نشاطك على خرائط Google، ونجلب تقييمك وآخر التقييمات.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="reviews-google-link"
            value={draftLink}
            readOnly={!setDraftLink}
            onChange={(e) => setDraftLink?.(e.target.value)}
            dir="ltr"
            placeholder="https://maps.app.goo.gl/..."
            className="min-w-0 flex-1 px-3 py-2.5 text-[14.5px] font-medium"
            aria-label="رابط نشاطك على خرائط Google"
          />
          <Act action={onFetch} className="zy-btn justify-center">
            <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} strokeWidth={2.25} />
            {fetching ? 'جارٍ الجلب…' : 'اجلب التقييمات'}
          </Act>
        </div>
      </section>
    )
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fdecea]">
        <MapPin className="h-4 w-4 text-[#d6453d]" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 text-[14px] font-bold text-[#171717]">
          مربوط بخرائط Google
          <span className="zy-pill" data-tone="ok" style={{ fontSize: 12.5, padding: '0.125rem 0.5rem' }}>متصل</span>
        </div>
        <p className="flex items-center gap-1 truncate text-[13px] font-medium text-[#66666e]">
          <Link2 className="h-3 w-3 shrink-0" />
          <span className="truncate" dir="ltr">{source.link.replace(/^https?:\/\//, '')}</span>
        </p>
      </div>
      <Act action={onFetch} className="zy-btn-q shrink-0" title="اجلب آخر التقييمات من Google">
        <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} strokeWidth={2.25} />
        <span className="hidden sm:inline">{fetching ? 'جارٍ التحديث…' : 'حدّث'}</span>
      </Act>
    </div>
  )
}

/* ── layout 1: summary, list, and a live preview of the site's section ─── */

function PreviewLayout(p: ReviewsScreenProps) {
  const { source, reviews } = p
  const shown = reviews.filter((r) => r.shown)
  return (
    <>
      <section className="rounded-2xl zy-card overflow-hidden">
        <div className="grid gap-0 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4 p-4 sm:p-5" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.07)' }}>
            <div>
              <div className="text-[40px] font-black leading-none tabular-nums text-[#171717]">
                {source?.rating != null ? source.rating.toFixed(1) : '–'}
              </div>
              <div className="mt-2"><Stars n={source?.rating ?? 0} size={16} /></div>
              <div className="mt-1.5 text-[13.5px] font-medium text-[#66666e]">
                {source?.count != null ? `${source.count} تقييم على Google` : 'لم يُربط Google بعد'}
              </div>
            </div>
            <div className="ms-auto text-end sm:hidden">
              <div className="zy-eyebrow">في موقعك</div>
              <div className="zy-num">{shown.length}<span className="text-[15px] text-[#66666e]"> / {reviews.length}</span></div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 p-4 sm:p-5 sm:ps-6" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.07)' }}>
            {source ? <SourceCard {...p} /> : <p className="text-[14px] font-medium text-[#66666e]">اربط Google من الأسفل.</p>}
            <p className="hidden text-[13.5px] font-medium text-[#66666e] sm:block">
              في موقعك الآن <b className="text-[#171717]">{shown.length}</b> من {reviews.length} تقييمات{source?.fetched ? ` · آخر تحديث ${source.fetched}` : ''}
            </p>
          </div>
        </div>
      </section>
      {!source && <div className="mt-4"><SourceCard {...p} /></div>}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h3 className="zy-h3">كل التقييمات</h3>
            <Act action={p.onAdd} className="zy-btn-q"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} />أضف تقييمًا</Act>
          </div>
          <ul className="rounded-2xl zy-card divide-y divide-[rgba(17,17,17,0.07)]">
            {reviews.map((r) => (
              <li key={r.id} className="flex gap-3 p-4 sm:p-5">
                <div style={{ opacity: r.shown ? 1 : 0.45 }} className="transition-opacity"><Avatar name={r.name} /></div>
                <div className="min-w-0 flex-1 transition-opacity" style={{ opacity: r.shown ? 1 : 0.55 }}>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    <span className="text-[14.5px] font-black text-[#171717]" dir="auto">{r.name}</span>
                    <Stars n={r.rating} size={13} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <SourceTag source={r.source} />
                    {r.when && <span className="text-[13px] font-medium text-[#8a8a92]">· {r.when}</span>}
                  </div>
                  <p className="mt-2 text-[14.5px] font-medium leading-[1.85] text-[#3a3a40]" dir="auto">{r.text}</p>
                  {r.source === 'manual' && p.onEdit && (
                    <button type="button" onClick={() => p.onEdit?.(r.id)} className="zy-link mt-1.5 text-[13.5px] font-bold">تعديل</button>
                  )}
                </div>
                <Switch on={r.shown} name={r.name} onToggle={() => p.onToggle?.(r.id)} />
              </li>
            ))}
          </ul>
          {reviews.length === 0 && <EmptyHint>لا تقييمات بعد. اربط Google أو أضف تقييمًا بنفسك.</EmptyHint>}
        </div>

        {/* What the visitor sees: the site's reviews section, drawn small,
            following the switches as they flip. */}
        <aside className="lg:sticky lg:top-4">
          <h3 className="zy-h3 mb-3 px-1">هكذا تظهر في موقعك</h3>
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2, #f4f4f6)', boxShadow: '0 0 0 1px rgba(17,17,17,0.06)' }}>
            <div className="text-center">
              <div className="text-[15px] font-black text-[#171717]">ماذا يقول عملاؤنا</div>
              {source?.rating != null && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#56565a]">
                  <Stars n={source.rating} size={12} />{source.rating.toFixed(1)} · {source.count} تقييم
                </div>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {shown.slice(0, 4).map((r) => (
                <figure key={r.id} className="m-0 rounded-xl bg-white p-3" style={{ boxShadow: '0 1px 2px rgba(17,17,17,0.06)' }}>
                  <Stars n={r.rating} size={11} />
                  <blockquote className="m-0 mt-1 line-clamp-2 text-[13px] font-medium leading-[1.75] text-[#3a3a40]" dir="auto">{r.text}</blockquote>
                  <figcaption className="mt-1 text-[12.5px] font-bold text-[#171717]" dir="auto">{r.name}</figcaption>
                </figure>
              ))}
              {shown.length === 0 && <p className="py-4 text-center text-[13px] font-medium text-[#66666e]">لا يظهر أي تقييم. شغّل تقييمًا واحدًا على الأقل.</p>}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

/* ── layout 2: three numbers, tabs, and one dense list ─────────────────── */

type TabKey = 'all' | 'shown' | 'hidden'

function TabsLayout(p: ReviewsScreenProps) {
  const { source, reviews } = p
  const [tab, setTab] = useState<TabKey>('all')
  const shown = reviews.filter((r) => r.shown)
  const rows = tab === 'shown' ? shown : tab === 'hidden' ? reviews.filter((r) => !r.shown) : reviews
  return (
    <>
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl zy-card p-3.5 sm:p-5">
          <div className="zy-eyebrow text-[13px] sm:text-[14.5px]">التقييم</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="zy-num">{source?.rating != null ? source.rating.toFixed(1) : '–'}</span>
            <Star className="h-4 w-4" strokeWidth={0} fill="#f2a33a" />
          </div>
        </div>
        <div className="rounded-2xl zy-card p-3.5 sm:p-5">
          <div className="zy-eyebrow text-[13px] sm:text-[14.5px]">على Google</div>
          <div className="zy-num mt-1">{source?.count ?? '–'}</div>
        </div>
        <div className="rounded-2xl zy-card p-3.5 sm:p-5">
          <div className="zy-eyebrow text-[13px] sm:text-[14.5px]">في موقعك</div>
          <div className="zy-num mt-1">{shown.length}<span className="text-[15px] text-[#66666e]"> / {reviews.length}</span></div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl zy-card p-4 sm:px-5">
        {source ? <SourceCard {...p} /> : <SourceCard {...p} />}
      </section>

      <section className="mt-4 rounded-2xl zy-card">
        <div className="flex items-end justify-between gap-2 px-3 pt-2 sm:px-4" style={{ boxShadow: 'inset 0 -1px 0 rgba(17,17,17,0.08)' }}>
          <TabBar<TabKey>
            label="تصفية التقييمات"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'all', label: `الكل ${reviews.length}` },
              { key: 'shown', label: `في الموقع ${shown.length}` },
              { key: 'hidden', label: `مخفية ${reviews.length - shown.length}` },
            ]}
          />
          <Act action={p.onAdd} className="zy-btn-q mb-2 shrink-0"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} /><span className="hidden sm:inline">أضف تقييمًا</span></Act>
        </div>
        <ul className="divide-y divide-[rgba(17,17,17,0.07)]">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3.5 sm:px-5">
              <Avatar name={r.name} size={34} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[14px] font-black text-[#171717]" dir="auto">{r.name}</span>
                  <Stars n={r.rating} size={12} />
                  <span className="text-[12.5px] font-medium text-[#8a8a92]">
                    {r.source === 'google' ? 'Google' : 'أضفته أنت'}{r.when ? ` · ${r.when}` : ''}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.8] text-[#3a3a40]" dir="auto">{r.text}</p>
              </div>
              <Switch on={r.shown} name={r.name} onToggle={() => p.onToggle?.(r.id)} />
            </li>
          ))}
        </ul>
        {rows.length === 0 && <EmptyHint>لا تقييمات هنا.</EmptyHint>}
      </section>
    </>
  )
}

export function ReviewsScreen(p: ReviewsScreenProps) {
  return (
    <Page>
      <PageHead
        title="التقييمات"
        sub="اختر التقييمات التي تظهر في موقعك. التغيير يظهر في موقعك فورًا."
        icon={MessageSquareQuote}
      />
      {p.sites.length > 1 && (
        <Segmented
          className="mb-4"
          label="اختر الموقع"
          value={p.siteId}
          onChange={p.setSiteId}
          items={p.sites.map((s) => ({ key: s.id, label: s.name }))}
        />
      )}
      {p.layout === 'tabs' ? <TabsLayout {...p} /> : <PreviewLayout {...p} />}
      <p className="mt-4 px-1 text-[13px] font-medium leading-[1.8] text-[#8a8a92]">
        Google يعطي آخر 5 تقييمات فقط، ونصها يبقى كما كتبه أصحابها. التقييمات التي تضيفها أنت يمكنك تعديلها.
      </p>
    </Page>
  )
}
