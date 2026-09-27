"use client"

import type { OwnerReview } from '@/lib/owner-reviews'
import GoogleReviewsImport, { type GoogleFound, type GoogleResult } from './GoogleReviewsImport'
import { AddButton, Block, Card, Field, Input, Select, Textarea, Grid } from './WizardShell'

/**
 * The reviews step every generator wizard shares: the Google link and import,
 * the rating and count, and the owner's own reviews typed by hand. The same
 * markup as the wellness step, which was approved first. The site shows these
 * and nothing else: no wizard sends a review the owner did not give.
 */

export type ReviewDraft = { id: string; name: string; text: string; rating: string; detail?: string; origin?: 'google'; when?: string }

export type ReviewsForm = { reviews: ReviewDraft[]; reviews_url: string; review_rating: string; review_count: string }

function uid() { return Math.random().toString(36).slice(2, 9) }

export function validReviewsOf(list: ReviewDraft[] | undefined): ReviewDraft[] {
  return (list || []).filter((r) => (r.name || '').trim() && (r.text || '').trim().length >= 2)
}

/** The reviews as the generators take them, clamped to the schema's limits so a long Google review never blocks the build. */
export function reviewsPayload(list: ReviewDraft[] | undefined): OwnerReview[] {
  return validReviewsOf(list).slice(0, 12).map((r) => ({
    name: r.name.trim().slice(0, 80),
    text: r.text.trim().slice(0, 600),
    detail: (r.detail || '').trim().slice(0, 120) || undefined,
    rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
    origin: r.origin,
    when: r.when?.slice(0, 60),
  }))
}

export function reviewsUrlOf(raw: string | undefined): string | undefined {
  const v = (raw || '').trim()
  return /^https?:\/\//.test(v) ? v : undefined
}

export default function OwnerReviewsFields({ form, patch, name, city, detail }: {
  form: ReviewsForm
  /** Applied against the latest form, so an import never drops a review typed meanwhile. */
  patch: (fn: (prev: ReviewsForm) => Partial<ReviewsForm>) => void
  name: string
  city: string
  /** The optional "what was it about" field: a product, a service, a dish. */
  detail?: { label: string; placeholder: string }
}) {
  const reviews = form.reviews || []

  function update(id: string, p: Partial<ReviewDraft>) {
    patch((prev) => ({ reviews: (prev.reviews || []).map((r) => (r.id === id ? { ...r, ...p } : r)) }))
  }
  function add() {
    patch((prev) => ({ reviews: [...(prev.reviews || []), { id: uid(), name: '', text: '', detail: '', rating: '5' }] }))
  }
  function remove(id: string) {
    patch((prev) => ({ reviews: (prev.reviews || []).filter((r) => r.id !== id) }))
  }
  function placeGoogle(r: GoogleResult) {
    patch((prev) => ({
      reviews_url: prev.reviews_url?.trim() ? prev.reviews_url : r.place.url,
      review_rating: r.place.rating != null ? r.place.rating.toFixed(1) : prev.review_rating,
      review_count: r.place.count != null ? String(r.place.count) : prev.review_count,
    }))
  }
  function importGoogle(r: GoogleResult, chosen: GoogleFound[]) {
    patch((prev) => {
      const have = new Set((prev.reviews || []).map((x) => x.name.trim() + '|' + x.text.trim()))
      const fresh = chosen
        .filter((c) => !have.has(c.name + '|' + c.text))
        .map((c) => ({ id: uid(), name: c.name, text: c.text, detail: '', rating: String(c.rating), origin: 'google' as const, when: c.when || undefined }))
      return {
        reviews: [...(prev.reviews || []), ...fresh],
        reviews_url: prev.reviews_url?.trim() ? prev.reviews_url : r.place.url,
        review_rating: r.place.rating != null ? r.place.rating.toFixed(1) : prev.review_rating,
        review_count: r.place.count != null ? String(r.place.count) : prev.review_count,
      }
    })
  }

  // Cells, not a grid: the step wraps them in its Grid beside its own fields.
  return (
    <>
      <Field label="رابط نشاطك على خرائط Google (أو Trustpilot أو Facebook)" wide hint="الصق رابط Google واضغط «اجلب تقييماتي»، أو أضف تقييماتك بيدك تحت.">
        <Input dir="ltr" value={form.reviews_url || ''} onChange={(e) => { const v = e.target.value; patch(() => ({ reviews_url: v })) }} placeholder="https://maps.app.goo.gl/..." />
      </Field>
      <Block>
        <GoogleReviewsImport url={form.reviews_url || ''} name={name} city={city} onPlace={placeGoogle} onImport={importGoogle} />
      </Block>
      <Field label="متوسط التقييم" hint="كما يظهر على Google، مثلًا 4.8">
        <Input value={form.review_rating || ''} onChange={(e) => { const v = e.target.value; patch(() => ({ review_rating: v })) }} placeholder="4.8" />
      </Field>
      <Field label="عدد التقييمات">
        <Input value={form.review_count || ''} onChange={(e) => { const v = e.target.value; patch(() => ({ review_count: v })) }} placeholder="120" />
      </Field>
      <Block title="تقييمات تريد عرضها" hint={reviews.length === 0 ? 'انسخ تقييمات من Google والصقها هنا. تقدر تعدّلها لاحقًا من لوحة التحكم.' : undefined}>
        <div className="zb-list">
          {reviews.map((r, i) => (
            <Card key={r.id} title={'التقييم ' + (i + 1)} onRemove={() => remove(r.id)} removeLabel={'حذف التقييم ' + (i + 1)}>
              <Grid>
                <Field label="اسم الزبون">
                  <Input value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} placeholder="نورة س." />
                </Field>
                <Field label="النجوم">
                  <Select value={r.rating} onChange={(e) => update(r.id, { rating: e.target.value })}>
                    {['5', '4', '3', '2', '1'].map((n) => <option key={n} value={n}>{n} من 5</option>)}
                  </Select>
                </Field>
                <Field label="نص التقييم" wide>
                  <Textarea rows={3} value={r.text} onChange={(e) => update(r.id, { text: e.target.value })} placeholder="الصق التقييم كما كتبه الزبون" />
                </Field>
                {detail ? (
                  <Field label={detail.label} wide>
                    <Input value={r.detail || ''} onChange={(e) => update(r.id, { detail: e.target.value })} placeholder={detail.placeholder} />
                  </Field>
                ) : null}
              </Grid>
            </Card>
          ))}
          <AddButton onClick={add}>أضف تقييمًا</AddButton>
        </div>
      </Block>
    </>
  )
}
