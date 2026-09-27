'use client'

import { useState, type ReactNode } from 'react'
import { Link2, MapPin, MessageSquareQuote, Plus, RefreshCw, Star, Trash2 } from 'lucide-react'
import { Segmented } from '@/components/app/Segmented'
import { Act, EmptyHint, Page, PageHead, type Action } from './kit'

/**
 * Reviews: the owner picks which reviews their site shows.
 *
 * The pool is every review the owner has: the ones pulled from their Google
 * listing and the ones they typed in themselves. A switch on each row says
 * whether it is on the site. Google's reviews can be shown or hidden but never
 * reworded (Google's terms); the owner's own can be edited. Any review is
 * deleted with one tap, and a bar at the bottom offers to undo it.
 *
 * The Google link the owner gave in the wizard is already the source here, so
 * a site built with a link opens connected, not on an empty field.
 *
 * Beside the list sits the site's own reviews section, drawn small, following
 * the switches as they flip: the owner sees what a visitor will see.
 */

export type ReviewRow = {
  id: string
  name: string
  rating: number
  text: string
  origin: 'google' | 'manual'
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

export type ReviewDraft = { name: string; text: string; rating: number }

export type ReviewsScreenProps = {
  sites: { id: string; name: string }[]
  siteId: string
  setSiteId: (id: string) => void
  source: ReviewSource
  draftLink: string
  setDraftLink?: (v: string) => void
  fetching?: boolean
  onFetch?: Action
  /** A plain-words problem from the last fetch or save. */
  error?: string
  /** 'saving' while a change is on its way, 'saved' once it landed. */
  saveState?: 'idle' | 'saving' | 'saved'
  reviews: ReviewRow[]
  /** The heading the site's reviews section carries. */
  heading: string
  onToggle?: (id: string) => void
  /** id null adds a new review. */
  onSave?: (id: string | null, v: ReviewDraft) => void
  onDelete?: (id: string) => void
  /** Set just after a delete: the review's name, with a way to bring it back. */
  undo?: { name: string; onUndo: () => void } | null
  /** Shown instead of the page body, e.g. "no sites with a reviews section". */
  empty?: ReactNode
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
      {name.trim().charAt(0).toUpperCase() || '؟'}
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

function OriginTag({ origin }: { origin: ReviewRow['origin'] }) {
  return origin === 'google'
    ? <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#56565a]"><MapPin className="h-3.5 w-3.5 text-[#d6453d]" strokeWidth={2.25} />Google</span>
    : <span className="text-[13px] font-bold text-[#66666e]">أضفته أنت</span>
}

/** The add / edit form for a review the owner types. */
function Editor({
  initial, onSave, onCancel,
}: {
  initial: ReviewDraft
  onSave: (v: ReviewDraft) => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)
  const ok = v.name.trim().length > 0 && v.text.trim().length > 0
  return (
    <form
      className="grid gap-3 p-4 sm:p-5"
      style={{ background: 'var(--violet-fill, #eef0fb)' }}
      onSubmit={(e) => { e.preventDefault(); if (ok) onSave(v) }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-1.5">
          <span className="text-[13.5px] font-bold text-[#171717]">اسم الزبون</span>
          <input id="review-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="نورة س." className="px-3 py-2.5 text-[14.5px] font-medium" dir="auto" />
        </label>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-[13.5px] font-bold text-[#171717]">التقييم</legend>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="التقييم">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={v.rating === i}
                aria-label={`${i} من 5`}
                onClick={() => setV({ ...v, rating: i })}
                className="inline-flex h-9 w-8 items-center justify-center"
              >
                <Star className="h-6 w-6" strokeWidth={0} fill={i <= v.rating ? '#f2a33a' : 'rgba(17,17,17,0.16)'} />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <label className="grid gap-1.5">
        <span className="text-[13.5px] font-bold text-[#171717]">نص التقييم</span>
        <textarea id="review-text" value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} rows={3} placeholder="اكتب ما قاله الزبون بكلماته." className="px-3 py-2.5 text-[14.5px] font-medium leading-[1.8]" dir="auto" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={!ok} className="zy-btn disabled:opacity-50">احفظ</button>
        <button type="button" onClick={onCancel} className="zy-btn-q">إلغاء</button>
      </div>
    </form>
  )
}

/** Where the reviews come from: connected, or a field to connect. */
function SourceBlock({
  source, draftLink, setDraftLink, fetching, onFetch,
}: Pick<ReviewsScreenProps, 'source' | 'draftLink' | 'setDraftLink' | 'fetching' | 'onFetch'>) {
  if (!source) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#d6453d]" strokeWidth={2.25} />
          <h3 className="zy-h3">اربط تقييمات Google</h3>
        </div>
        <p className="text-[14px] font-medium leading-[1.8] text-[#66666e]">ألصق رابط نشاطك على خرائط Google، ونجلب تقييمك وآخر التقييمات.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
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
      </div>
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
        <a href={source.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-[13px] font-medium text-[#66666e] hover:text-[#5e6ad2]">
          <Link2 className="h-3 w-3 shrink-0" />
          <span className="truncate" dir="ltr">{source.link.replace(/^https?:\/\//, '')}</span>
        </a>
      </div>
      <Act action={onFetch} className="zy-btn-q shrink-0" title="اجلب آخر التقييمات من Google">
        <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} strokeWidth={2.25} />
        <span className="hidden sm:inline">{fetching ? 'جارٍ التحديث…' : 'حدّث'}</span>
      </Act>
    </div>
  )
}

/* ── the screen ─────────────────────────────────────────────────────────── */

export function ReviewsScreen(p: ReviewsScreenProps) {
  const { source, reviews } = p
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const shown = reviews.filter((r) => r.shown)
  const saveNote = p.saveState === 'saving' ? 'جارٍ الحفظ…' : p.saveState === 'saved' ? 'حُفظ. يظهر في موقعك خلال دقيقة.' : null

  return (
    <Page>
      <PageHead
        title="التقييمات"
        sub="اختر التقييمات التي تظهر في موقعك. التغيير يظهر في موقعك خلال دقيقة."
        icon={MessageSquareQuote}
        aside={saveNote && <span className="zy-pill" data-tone={p.saveState === 'saved' ? 'ok' : 'quiet'}>{saveNote}</span>}
      />
      {p.sites.length > 1 && (
        <Segmented
          className="mb-4"
          label="اختر الموقع"
          value={p.siteId}
          onChange={(id) => { setEditing(null); p.setSiteId(id) }}
          items={p.sites.map((s) => ({ key: s.id, label: s.name }))}
        />
      )}

      {p.empty ?? (
        <>
          {p.error && (
            <p role="alert" className="mb-4 rounded-xl px-4 py-3 text-[14px] font-bold" style={{ color: 'var(--warning)', background: 'var(--warning-fill)', boxShadow: '0 0 0 1px var(--warning-ring)' }}>
              {p.error}
            </p>
          )}

          <section className="rounded-2xl zy-card overflow-hidden">
            <div className="grid sm:grid-cols-[auto_1fr]">
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
                <SourceBlock {...p} />
                <p className="hidden text-[13.5px] font-medium text-[#66666e] sm:block">
                  في موقعك الآن <b className="text-[#171717]">{shown.length}</b> من {reviews.length} تقييمات{source?.fetched ? ` · آخر تحديث ${source.fetched}` : ''}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <h3 className="zy-h3">كل التقييمات</h3>
                {p.onSave && (
                  <button type="button" onClick={() => setEditing('new')} className="zy-btn-q">
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />أضف تقييمًا
                  </button>
                )}
              </div>
              <ul className="rounded-2xl zy-card divide-y divide-[rgba(17,17,17,0.07)] overflow-hidden">
                {editing === 'new' && p.onSave && (
                  <li>
                    <Editor
                      initial={{ name: '', text: '', rating: 5 }}
                      onSave={(v) => { p.onSave?.(null, v); setEditing(null) }}
                      onCancel={() => setEditing(null)}
                    />
                  </li>
                )}
                {reviews.map((r) => (
                  editing === r.id && p.onSave ? (
                    <li key={r.id}>
                      <Editor
                        initial={{ name: r.name, text: r.text, rating: r.rating }}
                        onSave={(v) => { p.onSave?.(r.id, v); setEditing(null) }}
                        onCancel={() => setEditing(null)}
                      />
                    </li>
                  ) : (
                    <li key={r.id} className="flex gap-3 p-4 sm:p-5">
                      <div style={{ opacity: r.shown ? 1 : 0.45 }} className="transition-opacity"><Avatar name={r.name} /></div>
                      <div className="min-w-0 flex-1 transition-opacity" style={{ opacity: r.shown ? 1 : 0.55 }}>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                          <span className="text-[14.5px] font-black text-[#171717]" dir="auto">{r.name}</span>
                          <Stars n={r.rating} size={13} />
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <OriginTag origin={r.origin} />
                          {r.when && <span className="text-[13px] font-medium text-[#8a8a92]">· {r.when}</span>}
                        </div>
                        <p className="mt-2 text-[14.5px] font-medium leading-[1.85] text-[#3a3a40]" dir="auto">{r.text}</p>
                        {(p.onSave || p.onDelete) && (
                          <div className="mt-1.5 flex items-center gap-4">
                            {r.origin === 'manual' && p.onSave && (
                              <button type="button" onClick={() => setEditing(r.id)} className="zy-link min-h-[32px] text-[13.5px] font-bold">تعديل</button>
                            )}
                            {p.onDelete && (
                              <button type="button" onClick={() => p.onDelete?.(r.id)} className="inline-flex min-h-[32px] items-center gap-1 text-[13.5px] font-bold text-[#8a8a92] hover:text-[var(--error,#c0362c)]" aria-label={`حذف تقييم ${r.name}`}>
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />حذف
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <Switch on={r.shown} name={r.name} onToggle={() => p.onToggle?.(r.id)} />
                    </li>
                  )
                ))}
              </ul>
              {reviews.length === 0 && editing !== 'new' && <EmptyHint>لا تقييمات بعد. اربط Google أو أضف تقييمًا بنفسك.</EmptyHint>}
            </div>

            {/* What the visitor sees: the site's reviews section, drawn small. */}
            <aside className="lg:sticky lg:top-4">
              <h3 className="zy-h3 mb-3 px-1">هكذا تظهر في موقعك</h3>
              <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2, #f4f4f6)', boxShadow: '0 0 0 1px rgba(17,17,17,0.06)' }}>
                <div className="text-center">
                  <div className="text-[15px] font-black text-[#171717]" dir="auto">{p.heading}</div>
                  {source?.rating != null && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#56565a]">
                      <Stars n={source.rating} size={12} />{source.rating.toFixed(1)}{source.count != null ? ` · ${source.count} تقييم` : ''}
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
                  {shown.length > 4 && <p className="text-center text-[12.5px] font-medium text-[#66666e]">و{shown.length - 4} غيرها</p>}
                  {shown.length === 0 && <p className="py-4 text-center text-[13px] font-medium text-[#66666e]">لا يظهر أي تقييم. شغّل تقييمًا واحدًا على الأقل.</p>}
                </div>
              </div>
            </aside>
          </div>
          <p className="mt-4 px-1 text-[13px] font-medium leading-[1.8] text-[#8a8a92]">
            Google يعطي آخر 5 تقييمات فقط، ونصها يبقى كما كتبه أصحابها. التقييمات التي تضيفها أنت يمكنك تعديلها. ويمكنك حذف أي تقييم.
          </p>
        </>
      )}
      {p.undo && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#171717] px-4 py-3 text-white shadow-lg">
          <span className="min-w-0 flex-1 truncate text-[14px] font-bold" dir="auto">حُذف تقييم {p.undo.name}</span>
          <button type="button" onClick={p.undo.onUndo} className="min-h-[36px] shrink-0 rounded-lg px-3 text-[14px] font-black text-[#b9c0ff] hover:bg-white/10">تراجع</button>
        </div>
      )}
    </Page>
  )
}
