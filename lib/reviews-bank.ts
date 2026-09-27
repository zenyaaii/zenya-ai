/**
 * The reviews a site shows, and the ones its owner has set aside.
 *
 * Each template keeps its reviews in its own shape and place: wellness in
 * testimonials.items as {name, text}, atlas as {author, quote}, the restaurant
 * under reviews.testimonials. The site renders that list as it always has.
 * The dashboard's Reviews page reads and writes it through this module, so it
 * works the same on every template without the renderers changing.
 *
 * What the site does not show is kept in content.review_bank.hidden, in the
 * template's own item shape, so switching a review back on is a plain move
 * from one list to the other. The Google source (link, rating, count) sits in
 * content.review_bank.google.
 *
 * An item that came from Google carries origin: 'google'. Its text is never
 * edited here: Google's terms do not allow rewording a review. It can be
 * deleted; its key then goes in content.review_bank.removed so a later fetch
 * skips it.
 */

export type ReviewOrigin = 'google' | 'manual'

export type BankRow = {
  id: string
  name: string
  text: string
  rating: number
  origin: ReviewOrigin
  when?: string
  shown: boolean
}

export type GoogleSource = { link: string; rating: number | null; count: number | null; fetched_at?: string }

type Item = Record<string, any>

type Adapter = {
  /** Where the shown list lives. */
  get(c: any): Item[] | undefined
  set(c: any, items: Item[]): void
  name: string
  text: string
  /** The section heading visitors see, for the dashboard's preview. */
  heading(c: any): string
  /** Where the template stores the overall rating and count, if it does. */
  summary?: { get(c: any): { rating: number | null; count: number | null }; set(c: any, rating: number, count: number): void }
}

const inTestimonials = (name: string, text: string, withSummary: boolean): Adapter => ({
  get: (c) => c?.testimonials?.items,
  set: (c, items) => { c.testimonials = { ...(c.testimonials || {}), items } },
  name,
  text,
  heading: (c) => c?.testimonials?.heading || 'آراء العملاء',
  summary: withSummary
    ? {
        get: (c) => ({ rating: num(c?.testimonials?.average_rating), count: num(c?.testimonials?.review_count) }),
        set: (c, rating, count) => {
          c.testimonials = { ...(c.testimonials || {}), average_rating: rating, review_count: String(count) }
        },
      }
    : undefined,
})

const ADAPTERS: Record<string, Adapter> = {
  wellness: inTestimonials('name', 'text', true),
  services: inTestimonials('name', 'text', true),
  lookbook: inTestimonials('author', 'text', true),
  atlas: inTestimonials('author', 'quote', false),
  restaurant: {
    get: (c) => c?.reviews?.testimonials,
    set: (c, items) => { c.reviews = { ...(c.reviews || {}), testimonials: items } },
    name: 'name',
    text: 'text',
    heading: (c) => c?.reviews?.heading || 'آراء الضيوف',
    summary: {
      get: (c) => ({ rating: num(c?.reviews?.overall_rating), count: num(c?.reviews?.review_count) }),
      set: (c, rating, count) => { c.reviews = { ...(c.reviews || {}), overall_rating: rating, review_count: String(count) } },
    },
  },
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Templates whose sites have a reviews section. */
export function hasReviews(businessType: string): boolean {
  return businessType in ADAPTERS
}

function adapter(bt: string): Adapter {
  const a = ADAPTERS[bt]
  if (!a) throw new Error(`no reviews section on ${bt}`)
  return a
}

function bankOf(c: any): { hidden: Item[]; google?: GoogleSource } {
  const b = c?.review_bank
  return { hidden: Array.isArray(b?.hidden) ? b.hidden : [], google: b?.google || undefined }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v ?? {}))
}

function toRow(a: Adapter, it: Item, id: string, shown: boolean): BankRow {
  return {
    id,
    name: String(it?.[a.name] || '').trim(),
    text: String(it?.[a.text] || '').trim(),
    rating: Math.max(1, Math.min(5, Math.round(Number(it?.rating) || 5))),
    origin: it?.origin === 'google' ? 'google' : 'manual',
    when: typeof it?.when === 'string' ? it.when : undefined,
    shown,
  }
}

export type ReviewsView = {
  rows: BankRow[]
  google: GoogleSource | null
  heading: string
}

/** Everything the dashboard draws for one site. */
export function readReviews(bt: string, content: any): ReviewsView {
  const a = adapter(bt)
  const shown = a.get(content) || []
  const bank = bankOf(content)
  const rows = [
    ...shown.map((it, i) => toRow(a, it, `s${i}`, true)),
    ...bank.hidden.map((it, i) => toRow(a, it, `h${i}`, false)),
  ]
  const link = bank.google?.link || (typeof content?.links?.reviews_url === 'string' ? content.links.reviews_url : '')
  const summary = a.summary?.get(content)
  const google: GoogleSource | null = link
    ? {
        link,
        rating: bank.google?.rating ?? summary?.rating ?? null,
        count: bank.google?.count ?? summary?.count ?? null,
        fetched_at: bank.google?.fetched_at,
      }
    : null
  return { rows, google, heading: a.heading(content) }
}

function split(bt: string, content: any) {
  const a = adapter(bt)
  const c = clone(content)
  const shown = [...(a.get(c) || [])]
  const hidden = [...bankOf(c).hidden]
  const commit = () => {
    a.set(c, shown)
    c.review_bank = { ...(c.review_bank || {}), hidden }
    return c
  }
  const pick = (id: string): [Item[], number] => {
    const list = id.startsWith('s') ? shown : hidden
    return [list, Number(id.slice(1))]
  }
  return { a, c, shown, hidden, commit, pick }
}

/** Show a hidden review (it goes to the end of the site's list) or hide a shown one. */
export function toggleReview(bt: string, content: any, id: string): any {
  const s = split(bt, content)
  const [from, i] = s.pick(id)
  const [item] = from.splice(i, 1)
  if (!item) return content
  ;(id.startsWith('s') ? s.hidden : s.shown).push(item)
  return s.commit()
}

/** Add a review the owner typed, or change one they typed before. Google's are not editable. */
export function saveReview(bt: string, content: any, id: string | null, v: { name: string; text: string; rating: number }): any {
  const s = split(bt, content)
  const fields: Item = { [s.a.name]: v.name.trim(), [s.a.text]: v.text.trim(), rating: Math.max(1, Math.min(5, Math.round(v.rating))) }
  if (bt === 'atlas') fields.avatar_letter = v.name.trim().charAt(0)
  if (!id) {
    s.shown.push({ ...fields, origin: 'manual' })
    return s.commit()
  }
  const [list, i] = s.pick(id)
  if (!list[i] || list[i].origin === 'google') return content
  list[i] = { ...list[i], ...fields }
  return s.commit()
}

/**
 * Remove a review, whichever kind. A Google one leaves its name|text key in
 * content.review_bank.removed, so the next fetch from Google does not bring it back.
 */
export function deleteReview(bt: string, content: any, id: string): any {
  const s = split(bt, content)
  const [list, i] = s.pick(id)
  const item = list[i]
  if (!item) return content
  list.splice(i, 1)
  const c = s.commit()
  if (item.origin === 'google') {
    const removed: string[] = Array.isArray(c.review_bank.removed) ? c.review_bank.removed : []
    const k = keyOf(s.a, item)
    if (!removed.includes(k)) c.review_bank.removed = [...removed, k]
  }
  return c
}

function keyOf(a: Adapter, it: Item): string {
  return String(it?.[a.name] || '').trim() + '|' + String(it?.[a.text] || '').trim()
}

type Fetched = {
  place: { rating: number | null; count: number | null; url: string }
  reviews: { name: string; text: string; rating: number; when?: string }[]
}

/**
 * Take what /api/reviews/google returned. New reviews land hidden, so nothing
 * goes on the site until the owner switches it on, unless the site shows no
 * reviews at all, in which case they go straight on.
 */
export function mergeGoogle(bt: string, content: any, link: string, r: Fetched): any {
  const s = split(bt, content)
  const key = (it: Item) => keyOf(s.a, it)
  const removed: string[] = Array.isArray(s.c.review_bank?.removed) ? s.c.review_bank.removed : []
  const have = new Set([...s.shown, ...s.hidden].map(key).concat(removed))
  const target = s.shown.length === 0 ? s.shown : s.hidden
  for (const g of r.reviews) {
    const it: Item = { [s.a.name]: g.name, [s.a.text]: g.text, rating: g.rating, origin: 'google', when: g.when || undefined }
    if (bt === 'atlas') it.avatar_letter = g.name.trim().charAt(0)
    if (bt === 'restaurant' || bt === 'services') it.source = 'Google'
    if (!have.has(key(it))) { target.push(it); have.add(key(it)) }
  }
  const c = s.commit()
  c.review_bank.google = { link, rating: r.place.rating, count: r.place.count, fetched_at: new Date().toISOString() }
  if (r.place.rating != null && r.place.count != null) s.a.summary?.set(c, r.place.rating, r.place.count)
  if (bt === 'wellness' && !c.links?.reviews_url) c.links = { ...(c.links || {}), reviews_url: link }
  return c
}
