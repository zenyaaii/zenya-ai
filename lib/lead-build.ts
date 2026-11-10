import { AiClient, aiKey } from '@/lib/ai-client'
import { AI_MODEL } from '@/lib/ai'
import { logAiUsage } from '@/lib/ai-usage'
import { validateSlug } from '@/lib/slug'
import { serviceClient } from '@/lib/handover'
import { WELLNESS_NICHES } from '@/utils/wellness/niches'
import { resolveServiceNiche } from '@/utils/services/niches'
import { RESTAURANT_PRESETS } from '@/utils/restaurant/presets'
import { RESTAURANT_TYPE_VALUES } from '@/utils/restaurant/input'
import * as Wellness from '@/lib/generators/wellness'
import * as Services from '@/lib/generators/services'
import * as Restaurant from '@/lib/generators/restaurant'
import { prepare, factsBlock, menuWithPhotos, visit, visitBarber, type Prepared } from '@/lib/restaurant-build'
import { barberInputSchema, buildBarberContent } from '@/utils/services/barber'
import { KIND, kindOfLead, type NicheKind } from '@/utils/services/kinds'
import { downSince, googleOutage, missingKey, noteDown, noteUp, OutageError, type Outage } from '@/lib/service-health'

/**
 * «اعمل الموقع» for one lead, server side: Google facts → the owner's side of
 * the wizard (AI, facts only) → the template's real generator → a published
 * themes row under the admin → the link saved on the lead.
 *
 * Ported from the Lead Studio artifact (gen/entry.ts), with restaurants added.
 * Rules carried over: no invented prices, years, staff or credentials; only
 * real Google reviews. Wellness and services use the template's own niche
 * photos. Restaurants run lib/restaurant-build: the place's own photos (judged,
 * copied to our storage, never hot-linked), its menu, its colours, and an AI
 * visitor that scores the site and says what is wrong with it.
 */

type Lead = {
  id: string; name: string; kind: string | null; country: string | null; city: string | null; area: string | null
  address: string | null; rating: number | null; reviews: number | null; phone: string | null; wa: string | null
  maps: string | null; template: string | null; social?: string | null
}
type GReview = { stars: number; text: string; who: string; when: string }
type GPeriod = { open?: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } }
type Google = { type?: string; hoursText: string[]; periods: GPeriod[]; reviews: GReview[] }

const COUNTRY_EN: Record<string, string> = {
  EG: 'Egypt', SA: 'Saudi Arabia', JO: 'Jordan', LB: 'Lebanon', SY: 'Syria', IQ: 'Iraq', AE: 'UAE', KW: 'Kuwait',
  QA: 'Qatar', BH: 'Bahrain', OM: 'Oman', MA: 'Morocco', TN: 'Tunisia', DZ: 'Algeria', LY: 'Libya',
}
const PRESETS = {
  wellness: { zen: ['#5c6e5b', '#a8c5a0'], bloom: ['#a0596a', '#e8b4bc'], forest: ['#1b3a2d', '#c9a84c'], noir: ['#1a1a1a', '#d4af72'] },
  services: { cobalt: ['#0f4c81', '#22c7f2'], graphite: ['#111827', '#f59e0b'], amber: ['#8a4b12', '#f7b23b'], emerald: ['#0f5f55', '#37c9a8'] },
} as const
const WELLNESS_PRESET: Record<string, keyof typeof PRESETS.wellness> = {
  gym: 'noir', spa: 'zen', massage: 'zen', sauna: 'zen', yoga: 'zen', meditation: 'zen',
  hair: 'bloom', nails: 'bloom', skincare: 'bloom', aesthetic: 'bloom', physio: 'forest', nutrition: 'forest', center: 'forest',
}
const SERVICES_PRESET: Record<string, keyof typeof PRESETS.services> = {
  barber: 'graphite', carwash: 'cobalt', carrepair: 'cobalt', ac: 'cobalt', cleaning: 'emerald', carpet: 'emerald', pest: 'emerald',
}

const str = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const strs = (v: unknown, min: number, max: number, n: number) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, max)).filter((x) => x.length >= min).slice(0, n)
const clean = (s: string | null) => String(s ?? '').replace(/[‪-‮]/g, '').replace(/^محافظة\s+/, '').trim()

export type BuildStep = 'google' | 'facts' | 'copy' | 'publish'
export class BuildError extends Error { constructor(public step: BuildStep, msg: string) { super(msg) } }

// ── Google ────────────────────────────────────────────────────────────────
async function googleOf(placeId: string): Promise<Google> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.google_places_api_key
  if (!key) { const o = missingKey('google'); await noteDown(o); throw new OutageError(o) }
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ar`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'reviews,regularOpeningHours,primaryTypeDisplayName' },
    cache: 'no-store',
  })
  const d: any = await r.json().catch(() => ({}))
  if (!r.ok) {
    const o = googleOutage(r.status, String(d?.error?.message || d?.error?.status || ''))
    if (o) { await noteDown(o); throw new OutageError(o) }
    throw new BuildError('google', d?.error?.message || `Google ${r.status}`)
  }
  void noteUp('google')
  return {
    type: d.primaryTypeDisplayName?.text,
    hoursText: d.regularOpeningHours?.weekdayDescriptions ?? [],
    periods: d.regularOpeningHours?.periods ?? [],
    reviews: (d.reviews ?? []).map((x: any) => ({
      stars: x.rating, text: (x.text?.text ?? x.originalText?.text ?? '').trim(),
      who: x.authorAttribution?.displayName ?? '', when: x.relativePublishTimeDescription ?? '',
    })),
  }
}
/** Real reviews, word for word: 4–5 stars, text that fits the wizard. Restaurants show all Google gives (5). */
const pickReviews = (g: Google, n = 3) => g.reviews.filter((r) => r.stars >= 4 && r.text.length >= 2 && r.text.length <= 600 && r.who).slice(0, n)

// ── AI: the owner's side of the wizard, from facts only ───────────────────
async function askJson(prompt: string, system: string, temperature = 0.4): Promise<any> {
  const apiKey = aiKey()
  if (!apiKey) throw new BuildError('facts', 'ANTHROPIC_API_KEY missing')
  const res = await new AiClient({ apiKey }).chat.completions.create({
    model: AI_MODEL, temperature, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
  })
  await logAiUsage({ operation: 'lead-build-facts', userId: null, model: AI_MODEL }, res.usage)
  return JSON.parse(res.choices?.[0]?.message?.content || '{}')
}

function factsPrompt(lead: Lead, kind: Tpl, g: Google, prep?: Prepared): string {
  const common = `You fill in the Beynoun website wizard for a small business in ${COUNTRY_EN[lead.country ?? ''] ?? 'the Arab world'}, the way its owner would, using ONLY the facts below (Google Maps data). Write every value in Modern Standard Arabic unless told otherwise.

FACTS
Name on Google: ${lead.name}
Kind: ${lead.kind ?? ''}${g.type ? ` (Google type: ${g.type})` : ''}
City: ${clean(lead.city)}, area: ${clean(lead.area)}
Address: ${lead.address || 'N/A'}
Google rating: ${lead.rating} from ${lead.reviews} reviews
Hours: ${g.hoursText.join(' / ') || 'N/A'}
Google reviews (verbatim, the only reviews there are):
${g.reviews.map((r, i) => `${i + 1}. [${r.stars}★] ${r.text.replace(/\s+/g, ' ')}`).join('\n') || 'none'}
${prep ? factsBlock(prep) : ''}
HARD RULES
- No invented facts. No prices, durations, discounts, years, founding dates, staff or owner names, emails, certifications, awards, client counts, guarantees or response times. If the facts do not say it, leave it out.
- A service, treatment or dish may be listed only when it is what any business of this kind plainly offers, or a review names it.
- Never mention photos.
- brand_name: the business name as on Google, minus descriptions in brackets or after a dash. Keep its original script.
- slug: the brand name in Latin letters for a web address: lowercase a-z and 0-9 only, no spaces or dashes, 3 to 24 characters (transliterate Arabic, e.g. مطعم ماماي → mamai).`
  if (kind === 'wellness') return `${common}

Reply with ONLY this JSON:
{ "slug": "string", "brand_name": "string", "brand_type": "short Arabic type, e.g. صالة رياضية (جيم)",
  "niche": "one of: ${WELLNESS_NICHES.map((n) => n.id).join(', ')}",
  "treatments": [{ "name": "2-6 words", "category": "short Arabic category" }],
  "philosophy_brief": "2-3 sentences, 40-400 chars: where it is, the hours, and what reviewers say (attributed to reviewers)",
  "amenities": ["only amenities a review or the facts state; [] when none"] }
treatments: 3 to 6 items.`
  if (kind === 'services') return `${common}

Reply with ONLY this JSON:
{ "slug": "string", "brand_name": "string", "category": "short Arabic trade, e.g. صالون حلاقة رجالي",
  "services": [{ "name": "2-6 words" }],
  "story_brief": "2-3 sentences, 40-600 chars: where it is, the hours, and what reviewers say (attributed to reviewers)",
  "differentiators": ["4-100 chars each, only what reviews or facts state; [] when none"],
  "availability": "the hours summarised in at most 100 chars; empty string when no hours" }
services: 3 to 8 items.`
  return `${common}

Reply with ONLY this JSON:
{ "slug": "string", "brand_name": "string", "cuisine": "short Arabic cuisine, e.g. مأكولات شامية",
  "restaurant_type": "one of: ${RESTAURANT_TYPE_VALUES.join(', ')}",
  "menu": [{ "category": "short Arabic section name", "items": ["dish name, 2-6 words"] }],
  "story_brief": "2-3 sentences, 40-600 chars: where it is, the hours, and what reviewers say (attributed to reviewers)" }
menu: 2 to 4 sections, 3 to 6 dishes each.${prep?.menu.length ? ' (A printed menu was read from a photo and will be used as is; still return a short menu.)' : ''}
story_brief: also say what kind of evening or visit this is, in the place's own words when its Instagram or Facebook gives them (e.g. live music, breakfast, family place, heritage house). Only what the facts say.`
}

// ── wizard inputs ─────────────────────────────────────────────────────────
type Tpl = 'wellness' | 'services' | 'restaurant'
export function templateOf(lead: Lead): Tpl {
  const t = String(lead.template || '').toLowerCase()
  return t === 'restaurant' ? 'restaurant' : t === 'services' ? 'services' : 'wellness'
}

const WEEK = [
  ['saturday', 'السبت', 6], ['sunday', 'الأحد', 0], ['monday', 'الإثنين', 1], ['tuesday', 'الثلاثاء', 2],
  ['wednesday', 'الأربعاء', 3], ['thursday', 'الخميس', 4], ['friday', 'الجمعة', 5],
] as const
const hm = (h: number, m: number) => {
  const pm = h >= 12; const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${pm ? 'م' : 'ص'}`
}
function restaurantHours(g: Google) {
  return WEEK.map(([day, label, n]) => {
    const p = g.periods.find((x) => x.open?.day === n)
    if (!g.periods.length) return { day, label, open: '', close: '' }
    if (!p?.open) return { day, label, open: '', close: '', closed: true }
    if (!p.close) return { day, label, open: '12:00 ص', close: '11:59 م' } // open 24h
    return { day, label, open: hm(p.open.hour, p.open.minute ?? 0), close: hm(p.close.hour, p.close.minute ?? 0) }
  })
}
const hoursLine = (g: Google) => g.hoursText.length ? g.hoursText.join(' · ').slice(0, 300) : undefined

function buildInput(lead: Lead, kind: Tpl, f: any, g: Google, prep?: Prepared) {
  const phone = str(lead.phone, 40) || `+${lead.wa}`
  const mapUrl = /^https?:\/\//.test(lead.maps || '') ? lead.maps! : undefined
  const name = str(f?.brand_name, 80) || str(lead.name.replace(/\([^)]*\)/g, ''), 80)
  const city = clean(lead.city) || clean(lead.area) || 'المدينة'
  const reviews = pickReviews(g, kind === 'restaurant' ? 5 : 3).map((r) => ({
    name: r.who.slice(0, 80), text: r.text.slice(0, 600), rating: Math.min(5, Math.max(1, r.stars || 5)),
    origin: 'google' as const, when: r.when ? r.when.slice(0, 60) : undefined,
  }))
  const proof = { review_rating: lead.rating ?? undefined, review_count: lead.reviews ? String(lead.reviews) : undefined, reviews, reviews_url: mapUrl }

  if (kind === 'wellness') {
    const ids = WELLNESS_NICHES.map((n) => n.id) as string[]
    const niche = ids.includes(f?.niche) ? f.niche : 'center'
    const treatments = (Array.isArray(f?.treatments) ? f.treatments : [])
      .map((t: any) => ({ name: str(t?.name, 80), category: str(t?.category, 40) || undefined }))
      .filter((t: any) => t.name.length >= 2).slice(0, 6)
    if (!treatments.length) throw new BuildError('facts', 'no treatments')
    const brief = str(f?.philosophy_brief, 600)
    if (brief.length < 20) throw new BuildError('facts', 'brief too short')
    const amenities = strs(f?.amenities, 2, 60, 6)
    const preset = WELLNESS_PRESET[niche] || 'zen'
    return { preset, colors: PRESETS.wellness[preset], input: {
      niche,
      brand: { name, type: str(f?.brand_type, 60) || lead.kind || 'مركز', city, region: clean(lead.area) || undefined },
      contact: { phone, email: '', address: lead.address || undefined, hours: hoursLine(g), whatsapp: phone, map_url: mapUrl },
      treatments, team: [], philosophy: { brief },
      amenities: amenities.length ? amenities.join('\n') : undefined,
      social_proof: proof, visuals: {}, style_preset: preset,
    } }
  }
  if (kind === 'services') {
    let category = str(f?.category, 80)
    if (!category || (!resolveServiceNiche(category) && resolveServiceNiche(lead.kind))) category = lead.kind || category
    const niche = resolveServiceNiche(category)
    const services = (Array.isArray(f?.services) ? f.services : [])
      .map((s: any) => ({ name: str(s?.name, 80) })).filter((s: any) => s.name.length >= 2).slice(0, 12)
    if (!services.length) throw new BuildError('facts', 'no services')
    const brief = str(f?.story_brief, 900)
    if (brief.length < 20) throw new BuildError('facts', 'brief too short')
    const preset = (niche && SERVICES_PRESET[niche.id]) || 'cobalt'
    return { preset, colors: PRESETS.services[preset], input: {
      brand: { name, category, city: city.slice(0, 60), region: clean(lead.area).slice(0, 80) || undefined },
      contact: { phone, email: '', address: lead.address ? lead.address.slice(0, 200) : undefined, emergency_service: false, availability: str(f?.availability, 120) || undefined },
      services, areas_served: lead.area ? [clean(lead.area).slice(0, 60)] : [],
      differentiators: strs(f?.differentiators, 4, 120, 8), story: { brief },
      visuals: { gallery_image_urls: [] },
      social_proof: { ...proof, licenses: [], guarantees: [] }, style_preset: preset,
    } }
  }
  const type = (RESTAURANT_TYPE_VALUES as readonly string[]).includes(f?.restaurant_type) ? f.restaurant_type : 'other'
  const aiMenu = (Array.isArray(f?.menu) ? f.menu : []).map((c: any) => ({
    name: str(c?.category, 40),
    // No price is known, so none is shown: the owner adds prices in the editor.
    items: strs(c?.items, 2, 80, 6).map((n) => ({ name: n, price: '' })),
  })).filter((c: any) => c.name.length >= 2 && c.items.length).slice(0, 4)
  const categories = prep ? menuWithPhotos(prep, aiMenu) : aiMenu
  if (!categories.length) throw new BuildError('facts', 'no menu')
  const brief = str(f?.story_brief, 800)
  if (brief.length < 20) throw new BuildError('facts', 'brief too short')
  // The place's own colours decide night (onyx) or day (trattoria); without
  // the build system the old type-based choice stands.
  const preset = prep ? (prep.mood === 'dark' ? 'onyx' : 'trattoria')
    : type === 'cafe' || type === 'coffee_takeaway' || type === 'bakery' || type === 'dessert' ? 'coastal' : 'trattoria'
  const p = RESTAURANT_PRESETS.find((x) => x.id === preset) || RESTAURANT_PRESETS[0]
  const colors = prep ? [prep.colors.primary, prep.colors.accent] as const : [p.colors.primary, p.colors.accent] as const
  const u = (j?: { id: string }) => (j ? prep?.urls.get(j.id) : undefined)
  const visuals = prep ? {
    hero_image_url: u(prep.picks.hero),
    accent_image_url: u(prep.picks.story),
    gallery_image_urls: prep.picks.gallery.map(u).filter(Boolean) as string[],
  } : {}
  const email = prep?.social.facebook?.email && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(prep.social.facebook.email) ? prep.social.facebook.email : ''
  return { preset, colors, input: {
    brand: { name, cuisine: str(f?.cuisine, 60) || lead.kind || 'مطعم', city: city.slice(0, 60), neighborhood: clean(lead.area).slice(0, 60) || undefined, restaurant_type: type },
    location: { address: (lead.address || city).slice(0, 200), phone, email, map_link: mapUrl, hours: restaurantHours(g) },
    menu: { categories }, story: { brief },
    // The site's own booking form: every request lands in the owner's inbox.
    reservations: { provider_type: prep ? 'form' : 'phone', provider_value: phone },
    visuals, social_proof: proof, style_preset: preset,
  } }
}

// ── the build report ──────────────────────────────────────────────────────
/**
 * What the admin reads about a build, saved on the lead (`leads.build`): the
 * AI visitor's score and its reasons, what was missing, and which outside
 * service stopped during the build. A low score no longer holds a site back
 * (Anas, 2026-11-08): it is published and the report says why it scored low.
 */
export type BuildReport = {
  at: string
  kind: string
  url: string
  score: number | null            // the AI visitor's last score (restaurants); null when not scored
  rounds: number[]                // the score of each round, first to last
  why: string[]                   // the visitor's problems, from the last round
  missing: string[]               // what the build could not find (no menu photo, no social account…)
  social: { instagram?: string; facebook?: string; found?: string } | null
  photos: { google: number; used: number } | null
  outages: Outage[]               // a paid service that stopped while this site was built
}

// ── barber: the services template's barber kind ───────────────────────────
/** A barber lead, whatever template the lead list gave it (they came in as "Wellness"). */
export function isBarber(lead: Pick<Lead, 'kind' | 'name'>): boolean {
  return kindOfLead(lead) === 'barber'
}
const CURRENCY: Record<string, string> = { JO: 'د.أ', SA: 'ر.س', AE: 'د.إ', KW: 'د.ك', QA: 'ر.ق', BH: 'د.ب', OM: 'ر.ع', EG: 'ج.م', IQ: 'د.ع', LB: 'ل.ل', MA: 'د.م', TN: 'د.ت', DZ: 'د.ج', LY: 'د.ل', SY: 'ل.س' }

function barberFactsPrompt(lead: Lead, g: Google, prep: Prepared | undefined, nk: NicheKind): string {
  const k = KIND[nk]
  return `You read the facts of a ${k.visitor.place} in ${COUNTRY_EN[lead.country ?? ''] ?? 'the Arab world'} and fill in its website wizard, the way its owner would. Use ONLY the facts below.

FACTS
Name on Google: ${lead.name}
City: ${clean(lead.city)}, area: ${clean(lead.area)}
Google reviews (verbatim):
${g.reviews.map((r, i) => `${i + 1}. [${r.stars}★] ${r.who}: ${r.text.replace(/\s+/g, ' ')}`).join('\n') || 'none'}
${prep ? factsBlock(prep) : ''}
RULES
- brand_name: the shop's name as on Google, minus anything in brackets or after a dash. Keep its script. At most 5 words.
- latin: the shop's name in Latin letters ONLY if the facts write it so (Google name, Instagram handle or bio), e.g. "Hamuda Barber"; else "".
- barbers: the staff reviewers name as the person who served them or as the owner (e.g. "حلقت عند عمار", "تسلم ايد معاذ", "الكابتن فيصل", "د. سامي"). Arabic script, one or two words each, as written (keep "د." for a doctor). role: "${k.ownerRole}" when a review says so, else "${k.role}". Never a reviewer's own name, never a guessed name. [] when none.
- services: what a review, the price board or the Instagram names, plus the plain basics every ${k.visitor.place} offers (${k.defaults.filter((d) => d.on).map((d) => d.name).join('، ')}). 2-6 words each. price: ONLY when the price board or a review states it, digits only; else "".
- audience: ${k.audiences ? `one of ${k.audiences.map((a) => `"${a}"`).join(', ')}, from the facts; else "${k.audiences[0]}".` : '"".'}
- slug: the brand name in Latin letters for a web address: lowercase a-z and 0-9 only, 3 to 24 characters.

Reply with ONLY this JSON:
{ "slug": "", "brand_name": "", "latin": "", "audience": "رجال", "barbers": [{ "name": "", "role": "حلاق" }], "services": [{ "name": "", "price": "" }] }`
}

function barberInput(lead: Lead, f: any, prep: Prepared | undefined, nk: NicheKind) {
  const k = KIND[nk]
  const url = (j?: { id: string }) => (j ? prep?.urls.get(j.id) : undefined)
  const hero = url(prep?.picks.hero)
  const side = url(prep?.picks.story)
  const gallery = (prep?.picks.gallery ?? []).map(url).filter((u): u is string => !!u && u !== hero && u !== side)
  const menuPrices = new Map<string, string>()
  for (const c of prep?.menu ?? []) for (const i of c.items) if (i.price) menuPrices.set(i.name.trim(), i.price.replace(/[^\d.]/g, ''))
  const svc = (Array.isArray(f?.services) ? f.services : []).map((x: any) => ({ name: str(x?.name, 60), price: str(x?.price, 12).replace(/[^\d.]/g, '') }))
    .filter((x: any) => x.name.length >= 2)
  for (const [name, price] of Array.from(menuPrices)) if (!svc.some((x: any) => x.name === name) && svc.length < 12) svc.push({ name: name.slice(0, 60), price })
  const ig = prep?.social.instagram?.handle
  const phone = String(lead.phone || '').trim()
  const wa = String(lead.wa || '').trim()
  return {
    kind: nk, terms: [],
    name: str(f?.brand_name, 80) || lead.name,
    latin: /^[A-Za-z0-9 &'.-]{2,40}$/.test(String(f?.latin || '').trim()) ? String(f.latin).trim() : undefined,
    city: clean(lead.city) || 'المدينة',
    area: clean(lead.area) || undefined,
    address: lead.address ? clean(lead.address).slice(0, 200) : undefined,
    audience: k.audiences?.includes(f?.audience) ? f.audience : k.audiences?.[0],
    phone: phone || wa || '0000',
    whatsapp: wa ? (/^\+|^00/.test(wa) ? wa : '+' + wa.replace(/\D/g, '')) : (/^\+|^00/.test(phone) ? phone : undefined),
    maps_url: lead.maps || `https://www.google.com/maps/place/?q=place_id:${lead.id}`,
    instagram: ig ? `@${ig}` : undefined,
    links: [],
    barbers: (Array.isArray(f?.barbers) ? f.barbers : []).map((b: any) => ({ name: str(b?.name, 30), role: b?.role === k.ownerRole ? k.ownerRole : k.role, tags: [] }))
      .filter((b: any) => b.name.length >= 2 && b.name.replace(/^د\.\s*/, '').split(' ').length <= 2).slice(0, 6),
    services: svc.length ? svc.slice(0, 12).map((x: any) => ({ name: x.name, price: x.price || undefined })) : k.defaults.filter((d) => d.on).map((d) => ({ name: d.name })),
    currency: CURRENCY[lead.country ?? ''] || undefined,
    booking: { mode: 'both' as const },
    hours: [],
    photos: { hero, side, gallery },
    faq: [],
  }
}

async function buildBarberSite(lead: Lead, prep: Prepared | undefined, g: Google, nk: NicheKind): Promise<{ content: any; input: any; slug: string; colors: [string, string] }> {
  const f = await askJson(barberFactsPrompt(lead, g, prep, nk), 'You fill in website wizards from Google Maps facts only. Return strict JSON only.')
    .catch((e) => { throw e instanceof BuildError || e instanceof OutageError ? e : new BuildError('facts', e?.message || 'facts failed') })
  const parsed = barberInputSchema.safeParse(barberInput(lead, f, prep, nk))
  if (!parsed.success) throw new BuildError('facts', 'barber input: ' + parsed.error.issues.map((i) => i.path.join('.')).join(', '))
  const content = buildBarberContent(parsed.data, {
    place_id: lead.id, maps_url: lead.maps || undefined, rating: lead.rating, count: lead.reviews,
    reviews: g.reviews.map((r) => ({ name: r.who, rating: r.stars, text: r.text, when: r.when })),
    periods: g.periods,
  })
  return { content, input: parsed.data, slug: String(f?.slug || ''), colors: [prep?.colors.accent || KIND[nk].looks[0].colors.accent, prep?.colors.background || KIND[nk].looks[0].colors.background] }
}

// ── slug + publish ────────────────────────────────────────────────────────
async function freeSlug(base: string): Promise<string> {
  let b = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)
  if (b.length < 3 || !validateSlug(b).ok) b = `site${Math.random().toString(36).slice(2, 7)}`
  const { data } = await serviceClient().from('themes').select('slug').ilike('slug', `${b}%`)
  const taken = new Set((data ?? []).map((r: any) => String(r.slug).toLowerCase()))
  if (!taken.has(b)) return b
  for (let n = 2; n < 100; n++) if (!taken.has(b + n)) return b + n
  throw new BuildError('publish', 'no free slug')
}

/**
 * `rebuild`: the lead already has a site (often already sent to the owner).
 * The new build replaces that site's content at the SAME address, so the link
 * the owner holds keeps working.
 *
 * Every build is published, whatever the AI visitor scores: the score and its
 * reasons go in the build report for the admin to read. The one thing that
 * stops a build is a paid service that stopped (no credit, a bad key).
 */
export async function buildLeadSite(lead: Lead & { status?: string | null; site?: string | null }, ownerId: string, opts: { rebuild?: boolean } = {}): Promise<{ url: string; themeId: string; replaced?: boolean; report: BuildReport }> {
  const kind = templateOf(lead)
  const started = Date.now()
  let old: { id: string; slug: string; content: any } | null = null
  if (opts.rebuild) {
    if (lead.status === 'client') throw new BuildError('publish', 'صار عميلاً: موقعه عنده الآن، لا نعيد بناءه')
    const slug = /^https?:\/\/([a-z0-9-]+)\.beynoun\.com/i.exec(lead.site || '')?.[1]
    const { data } = slug ? await serviceClient().from('themes').select('id, slug, content').eq('slug', slug).maybeSingle() : { data: null }
    if (!data) throw new BuildError('publish', 'لم أجد الموقع القديم لهذا الرابط')
    old = data
  }
  // Barbers run the same build system as restaurants, with the barber's eye
  // and the barber page of the services template (Anas, 2026-11-10).
  const nk = kindOfLead(lead)
  if (nk) return buildBarberLead(lead, nk, ownerId, old, started)
  // Restaurants run the full build system (lib/restaurant-build); the other
  // templates keep the Google-only path until they get theirs.
  const prep = kind === 'restaurant'
    ? await prepare(lead.id, lead.social ?? null, { placeId: lead.id, name: lead.name, city: lead.city, area: lead.area, address: lead.address, phone: lead.phone })
      .catch((e) => { throw e instanceof OutageError ? e : new BuildError('google', e?.message || 'collect failed') })
    : undefined
  // An account the search found is saved on the lead, so the admin sees it and the next build starts from it.
  const foundLink = prep && !lead.social ? (prep.social.instagram ? `https://www.instagram.com/${prep.social.instagram.handle}/` : prep.social.facebook?.url) : undefined
  if (foundLink) await serviceClient().from('leads').update({ social: foundLink }).eq('id', lead.id)
  const g: Google = prep ? prep.place : await googleOf(lead.id)
  const facts = await askJson(factsPrompt(lead, kind, g, prep), 'You fill in website wizards from Google Maps facts only. Return strict JSON only.')
    .catch((e) => { throw e instanceof BuildError || e instanceof OutageError ? e : new BuildError('facts', e?.message || 'facts failed') })
  const { input, colors, preset } = buildInput(lead, kind, facts, g, prep)

  let content: any
  try {
    content = kind === 'wellness' ? await Wellness.generateCopy(input as any)
      : kind === 'services' ? await Services.generateCopy(input as any)
      : await Restaurant.generateCopy(input as any)
  } catch (e: any) { throw e instanceof OutageError ? e : new BuildError('copy', e?.message || 'copy failed') }
  if (kind === 'wellness') { content.team.members = []; content.treatments?.items?.forEach((t: any) => { if (!t.badge) delete t.badge }) }
  if (kind === 'services') content.services?.items?.forEach((s: any) => { if (!s.badge) delete s.badge; if (!s.price_from) delete s.price_from })
  if (/googleusercontent|ggpht|lh[0-9]\.google|places\.googleapis|cdninstagram|fbcdn/.test(JSON.stringify(content))) throw new BuildError('copy', 'an outside photo link got in')

  let wrapper: Record<string, unknown> = {}
  if (prep) {
    const wallReviews = pickReviews(g, 5).map((r) => ({ name: r.who.slice(0, 60), rating: Math.min(5, Math.max(1, r.stars || 5)), text: r.text.slice(0, 600), when: r.when.slice(0, 40) }))
    const wallPhotos = prep.picks.wall.map((j) => prep.urls.get(j.id)).filter(Boolean) as string[]
    if (wallPhotos.length >= 4) content.google_wall = { photos: wallPhotos, reviews: wallReviews }
    content.color_overrides = prep.colors
    await visit(content, (input as any).brand.city, prep.file)
    prep.file.published = true
    wrapper = { color_overrides: prep.colors, build_file: prep.file }
  }

  // Claude stopped half way (no credit, a spend limit): what was built is not
  // worth publishing, and the dashboard already says which service to fix.
  const ai = downSince(started).find((o) => o.service === 'anthropic')
  if (ai) throw new OutageError(ai)

  const report = (url: string): BuildReport => {
    const v = prep?.file.visitor ?? []
    const last = v[v.length - 1]
    return {
      at: new Date().toISOString(), kind, url,
      score: last?.score ?? null, rounds: v.map((x) => x.score), why: last?.notes ?? [],
      missing: prep?.file.missing ?? [],
      social: prep ? { instagram: prep.file.sources.instagram, facebook: prep.file.sources.facebook, found: prep.file.sources.found_by_search } : null,
      photos: prep ? { google: prep.file.sources.google.photos, used: prep.file.photos.filter((x) => x.used).length } : null,
      outages: downSince(started),
    }
  }
  // Saved on its own: if the column is missing, the site and its link still save.
  const saveReport = async (r: BuildReport) => { try { await serviceClient().from('leads').update({ build: r }).eq('id', lead.id) } catch { /* noop */ } }

  if (old) {
    // Same address, new content: the owner's link now opens the rebuilt site.
    const url = `https://${old.slug}.beynoun.com`
    const { error } = await serviceClient().from('themes').update({
      template_type: kind, product_name: (input as any).brand.name,
      primary_color: colors[0], secondary_color: colors[1],
      // Settings the site gathered since (switches, SEO, domain…) are kept; the built parts are replaced.
      content: JSON.parse(JSON.stringify({ ...(old.content || {}), business_type: kind, style_preset: preset, [kind]: content, input, ...wrapper })),
      is_published: true, status: 'published', published_url: url, published_at: new Date().toISOString(),
    }).eq('id', old.id)
    if (error) throw new BuildError('publish', error.message)
    const r = report(url); await saveReport(r)
    return { url, themeId: old.id, replaced: true, report: r }
  }

  const slug = await freeSlug(String(facts?.slug || ''))
  const url = `https://${slug}.beynoun.com`
  const { data, error } = await serviceClient().from('themes').insert({
    user_id: ownerId, template_type: kind, product_name: (input as any).brand.name,
    primary_color: colors[0], secondary_color: colors[1], images: [],
    content: JSON.parse(JSON.stringify({ business_type: kind, style_preset: preset, [kind]: content, input, ...wrapper })),
    slug, is_published: true, status: 'published', published_url: url, published_at: new Date().toISOString(),
  }).select('id').single()
  if (error || !data) throw new BuildError('publish', error?.message || 'insert failed')
  await serviceClient().from('leads').update({ site: url, updated_at: new Date().toISOString() }).eq('id', lead.id)
  const r = report(url); await saveReport(r)
  return { url, themeId: data.id, report: r }
}

async function buildBarberLead(lead: Lead, nk: NicheKind, ownerId: string, old: { id: string; slug: string; content: any } | null, started: number) {
  const kind = 'services' as const
  const who = { placeId: lead.id, name: lead.name, city: lead.city, area: lead.area, address: lead.address, phone: lead.phone }
  const prep = await prepare(lead.id, lead.social ?? null, who, nk)
    .catch((e) => { throw e instanceof OutageError ? e : new BuildError('google', e?.message || 'collect failed') })
  const foundLink = !lead.social ? (prep.social.instagram ? `https://www.instagram.com/${prep.social.instagram.handle}/` : prep.social.facebook?.url) : undefined
  if (foundLink) await serviceClient().from('leads').update({ social: foundLink }).eq('id', lead.id)
  const { content, input, slug: wanted, colors } = await buildBarberSite(lead, prep, prep.place, nk)
  await visitBarber(content, input.city, prep.file, nk)
  prep.file.published = true
  const ai = downSince(started).find((o) => o.service === 'anthropic')
  if (ai) throw new OutageError(ai)
  // The barber page reads the shop's own colours; the near-black + brass of the approved sample when none were found.
  const own = prep.file.colors.identity.length ? prep.colors : KIND[nk].looks[0].colors
  const wrapper = { niche: nk, color_overrides: own, build_file: prep.file }
  const v = prep.file.visitor, last = v[v.length - 1]
  const report = (url: string): BuildReport => ({
    at: new Date().toISOString(), kind: nk, url,
    score: last?.score ?? null, rounds: v.map((x) => x.score), why: last?.notes ?? [], missing: prep.file.missing,
    social: { instagram: prep.file.sources.instagram, facebook: prep.file.sources.facebook, found: prep.file.sources.found_by_search },
    photos: { google: prep.file.sources.google.photos, used: prep.file.photos.filter((x) => x.used).length },
    outages: downSince(started),
  })
  const saveReport = async (r: BuildReport) => { try { await serviceClient().from('leads').update({ build: r }).eq('id', lead.id) } catch { /* noop */ } }
  if (old) {
    const url = `https://${old.slug}.beynoun.com`
    const { error } = await serviceClient().from('themes').update({
      template_type: kind, product_name: input.name, primary_color: colors[0], secondary_color: colors[1],
      content: JSON.parse(JSON.stringify({ ...(old.content || {}), business_type: kind, style_preset: 'graphite', [kind]: content, input, ...wrapper })),
      is_published: true, status: 'published', published_url: url, published_at: new Date().toISOString(),
    }).eq('id', old.id)
    if (error) throw new BuildError('publish', error.message)
    const r = report(url); await saveReport(r)
    return { url, themeId: old.id, replaced: true, report: r }
  }
  const slug = await freeSlug(wanted)
  const url = `https://${slug}.beynoun.com`
  const { data, error } = await serviceClient().from('themes').insert({
    user_id: ownerId, template_type: kind, product_name: input.name, primary_color: colors[0], secondary_color: colors[1], images: [],
    content: JSON.parse(JSON.stringify({ business_type: kind, style_preset: 'graphite', [kind]: content, input, ...wrapper })),
    slug, is_published: true, status: 'published', published_url: url, published_at: new Date().toISOString(),
  }).select('id').single()
  if (error || !data) throw new BuildError('publish', error?.message || 'insert failed')
  await serviceClient().from('leads').update({ site: url, updated_at: new Date().toISOString() }).eq('id', lead.id)
  const r = report(url); await saveReport(r)
  return { url, themeId: data.id, report: r }
}
