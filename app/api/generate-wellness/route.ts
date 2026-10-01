import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { ICON_VOCAB_PROMPT } from '@/components/icons/vocab'
import { wellnessInputSchema, type WellnessInput } from '@/utils/wellness/input'
import type { WellnessContent } from '@/utils/wellness/types'
import { WELLNESS_MOCK_CONTENT } from '@/utils/wellness/mock-content'
import { resolveWellnessNiche, unsplash } from '@/utils/wellness/niches'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEOUT_MS = 45_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms)
    promise.then((v) => { clearTimeout(timer); resolve(v) }).catch((e) => { clearTimeout(timer); reject(e) })
  })
}

function parseJsonSafe(raw: string): any {
  try { return JSON.parse(raw) } catch {
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  }
}

function buildPrompt(input: WellnessInput): string {
  const niche = resolveWellnessNiche(input.niche, input.brand.type)
  const treatmentsText = input.treatments
    .map((t) => `- ${t.name}${t.category ? ` [${t.category}]` : ''}${t.duration ? `, ${t.duration}` : ''}${t.price ? `, ${t.price}` : ''}${t.badge ? ` (${t.badge})` : ''}${t.description ? `: ${t.description}` : ''}`)
    .join('\n')

  const teamText = (input.team || [])
    .map((m) => `- ${m.name}${m.title ? `, ${m.title}` : ''}${m.specialty ? ` · ${m.specialty}` : ''}${m.bio ? `: ${m.bio}` : ''}`)
    .join('\n') || 'No team provided'

  return `WELLNESS STUDIO BRIEF
Studio name: ${input.brand.name}
Type: ${input.brand.type}
Niche: ${niche.label} (${niche.id})
Location: ${input.brand.city}${input.brand.region ? `, ${input.brand.region}` : ''}
Founded: ${input.brand.founded_year || 'N/A'}

Philosophy / Story:
${input.philosophy.brief}
${input.philosophy.approach ? `Approach: ${input.philosophy.approach}` : ''}

Treatments offered:
${treatmentsText}

Team:
${teamText}

Amenities: ${input.amenities || 'N/A'}
Rating: ${input.social_proof?.review_rating ? `${input.social_proof.review_rating}/5` : 'N/A'}
Review count: ${input.social_proof?.review_count || 'N/A'}
Weekly classes: ${input.timetable?.length ? input.timetable.map((s) => `${s.day} ${s.time} ${s.name}`).join('; ') : 'N/A'}
Certifications: ${input.social_proof?.certifications || 'N/A'}
Hours: ${input.contact.hours || 'N/A'}

NICHE
${niche.voice}

WRITING DIRECTION
Write like the owner of this exact business talking to a client across the counter, not like an agency. The reader should not be able to tell a machine wrote it.
- Open with the client's real problem or wish in this niche, in their words. A headline states something concrete (a pain, a result, a promise you can check), line-broken with \\n, 2–3 short lines.
- Use specific details from the brief: the city or neighbourhood, real session names, durations, prices, hours, what happens in the first visit. Specific beats pretty.
- Short sentences. Everyday Arabic a client in ${input.brand.city} would use; a light local touch is welcome, no heavy slang.
- Say what happens and what the client gets. No abstract nouns stacked together, no rhetorical questions, no em-dash asides.
- Treatment descriptions: 12–22 words. Say who it is for and what it does.
- Testimonials: 20–45 words, sound like a real review on Google: one concrete detail, the treatment name, plain words.
- FAQ answers: 1–2 direct sentences answering what a first-time client in this niche actually asks.
- Never use these words or their Arabic equivalents: ${[...niche.avoid, 'journey', 'transformation', 'life-changing', 'empowering', 'elevate', 'unlock', 'sanctuary', 'oasis'].join(', ')}.
- Never invent credentials, licences, awards or numbers the brief does not give. Never make medical claims or promise results.

OUTPUT
Return ONLY valid JSON, no prose, no markdown, matching this exact shape:

{
  "hero": {
    "eyebrow": "Short trust-led line",
    "headline": "Concrete headline in the client's words. Use \\n to break into 2–3 short lines.",
    "subheadline": "1–2 sentences",
    "cta_primary": "Book a session",
    "cta_secondary": "Explore treatments",
    "badge": "Short urgency or social proof badge (optional)"
  },
  "trust_bar": ["Short trust item"],
  "philosophy": {
    "eyebrow": "Short eyebrow",
    "heading": "Heading. Use \\n if needed.",
    "subheading": "1–2 sentences",
    "pillars": [
      { "icon": "spa", "title": "Short title", "text": "1 sentence" }
    ]
  },
  "treatments": {
    "heading": "Section heading",
    "subheading": "1 short sentence",
    "items": [
      {
        "name": "Keep exact treatment name",
        "category": "Keep or infer category",
        "duration": "Keep provided duration",
        "price": "Keep provided price",
        "description": "Rewrite 12–22 words",
        "badge": "Keep or improve badge"
      }
    ]
  },
  "journey": {
    "heading": "Section heading",
    "subheading": "1 short sentence",
    "steps": [
      { "step": "01", "title": "Step title", "text": "1 sentence" }
    ]
  },
  "team": {
    "heading": "Section heading",
    "subheading": "1 short sentence",
    "members": [
      {
        "name": "Keep exact name",
        "title": "Keep or improve title",
        "specialty": "Keep or rewrite specialty",
        "bio": "Rewrite 2 sentences, warm and expert"
      }
    ]
  },
  "space": {
    "heading": "Section heading",
    "subheading": "1 short sentence",
    "amenities": ["Short amenity item"]
  },
  "testimonials": {
    "heading": "Section heading for the owner's client reviews",
    "subheading": "1 short sentence"
  },
  "timetable": {
    "heading": "Heading for the weekly class timetable (only used if the brief lists classes)",
    "subheading": "1 short sentence"
  },
  "booking_cta": {
    "eyebrow": "Short eyebrow",
    "heading": "Short, concrete heading",
    "subheading": "1–2 sentences",
    "cta_label": "CTA label",
    "note": "Short reassurance line"
  },
  "faq": [
    { "q": "Question", "a": "Answer" }
  ],
  "footer": {
    "tagline": "Short closing line"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- trust_bar: 0–5 items. Each one restates a fact the brief gives (a treatment offered, the city, a listed amenity or certification, the founding year). Write fewer items rather than invent one. Return [] when the brief gives nothing to restate.
- philosophy.pillars: exactly 3 items
- treatments.items: rewrite every provided treatment
- journey.steps: exactly 3 steps
- team.members: include all provided team members
- space.amenities: only the amenities the brief lists, reworded; [] when the brief gives none
- Do not write reviews or testimonials. Only the owner's real reviews are shown.
- faq: 5–7 items. Answers use only what the brief says. Where it says nothing, the answer tells the reader to ask the studio directly.
- Never state a price, discount, membership, gift card, fee, cancellation policy, session count, rating, licence, certification, product brand, amenity, room, drink or number of clients that the brief does not give. This applies to every field, including booking_cta.note and the journey steps.

${ICON_VOCAB_PROMPT}
For this niche, pick the pillar icons from this shortlist first: ${niche.icons.join(', ')}. Each pillar gets a different icon that matches its text.
Every "icon" field (philosophy.pillars) MUST be one name from the list above — never an emoji.`
}

// Used when the AI leaves the steps out. Nothing here is a fact about a studio.
const NEUTRAL_JOURNEY = [
  { step: '01', title: 'اختر جلستك', text: 'تصفّح الجلسات واختر ما يناسبك، أو راسلنا لنساعدك في الاختيار.' },
  { step: '02', title: 'احجز موعدك', text: 'اختر اليوم والوقت المناسبين، وسنؤكّد لك الموعد.' },
  { step: '03', title: 'تعال في موعدك', text: 'احضر قبل موعدك بقليل، وسنكون في انتظارك.' }
]

function splitLines(value: string): string[] {
  return value.split(/[\n,]/).map((s) => s.trim()).filter((s) => s.length > 0)
}

function mergeIntoContent(input: WellnessInput, ai: any): WellnessContent {
  const mock = WELLNESS_MOCK_CONTENT
  const niche = resolveWellnessNiche(input.niche, input.brand.type)

  // Owner uploads win. The hero and booking backdrops may fall back to the
  // niche's mood photos, which claim nothing. "The space" is shown as theirs,
  // so it takes only their own photos: none uploaded, no photo grid.
  const heroImage = input.visuals?.hero_image_url || unsplash(niche.photos.hero, 2400)
  const bookingImage = input.visuals?.hero_image_url || unsplash(niche.photos.booking, 2000)
  const spaceUrls = splitLines(input.visuals?.space_image_urls || '').filter((u) => /^https?:\/\//.test(u))
  const spaceImages = spaceUrls.slice(0, 4).map((url) => ({ url }))

  const treatments =
    Array.isArray(ai?.treatments?.items) && ai.treatments.items.length >= 3
      ? input.treatments.map((t, i) => {
          const aiT = ai.treatments.items[i] || {}
          return {
            name: t.name,
            category: t.category || String(aiT.category || ''),
            // Duration, price and badge are the owner's facts. The AI may not supply them.
            duration: t.duration || '',
            price: t.price || '',
            description: String(aiT.description || t.description || ''),
            badge: t.badge || undefined
          }
        })
      : input.treatments.map((t, i) => ({
          name: t.name,
          category: t.category || '',
          duration: t.duration || '',
          price: t.price || '',
          description: t.description || '',
          badge: t.badge
        }))

  const teamMembers =
    (input.team || []).length > 0
      ? (input.team || []).map((m, i) => {
          const aiM = Array.isArray(ai?.team?.members) ? (ai.team.members[i] || {}) : {}
          return {
            name: m.name,
            title: m.title || String(aiM.title || ''),
            specialty: m.specialty || String(aiM.specialty || ''),
            bio: String(aiM.bio || m.bio || ''),
            // A real person gets their own photo or none — never a stranger's.
            image: m.image_url || undefined
          }
        })
      // No team given: stand-in roles for this niche, not invented people, and
      // no stranger's face on them. The owner adds real names and photos from
      // the editor.
      : niche.team.map((m) => ({ name: m.title, title: '', specialty: m.specialty, bio: '', image: undefined }))

  const philosophyPillars =
    Array.isArray(ai?.philosophy?.pillars) && ai.philosophy.pillars.length >= 3
      ? ai.philosophy.pillars.slice(0, 3).map((p: any) => ({
          icon: String(p?.icon || niche.icons[0]),
          title: String(p?.title || ''),
          text: String(p?.text || '')
        }))
      : mock.philosophy.pillars

  const journeySteps =
    Array.isArray(ai?.journey?.steps) && ai.journey.steps.length >= 3
      ? ai.journey.steps.slice(0, 3).map((s: any, i: number) => ({
          step: `0${i + 1}`,
          title: String(s?.title || NEUTRAL_JOURNEY[i].title),
          text: String(s?.text || NEUTRAL_JOURNEY[i].text)
        }))
      : NEUTRAL_JOURNEY

  // Reviews are only ever the owner's own. With none, the section shows the
  // link to their public reviews, or is not drawn at all.
  const testimonials = (input.social_proof?.reviews || []).map((t) => ({
    name: t.name.trim(),
    text: t.text.trim(),
    treatment: t.treatment?.trim() || undefined,
    rating: typeof t.rating === 'number' ? Math.max(1, Math.min(5, Math.round(t.rating))) : 5,
    // Marks a review taken from Google, so the dashboard never lets its text be reworded.
    origin: t.origin,
    when: t.when
  }))

  const faqItems =
    Array.isArray(ai?.faq) && ai.faq.length >= 5
      ? ai.faq.slice(0, 7).map((f: any) => ({ q: String(f?.q || ''), a: String(f?.a || '') }))
      : []

  // Amenities are the owner's list. The AI may reword it, never add to it.
  const ownerAmenities = splitLines(input.amenities || '').slice(0, 6)
  const amenities =
    ownerAmenities.length === 0
      ? []
      : Array.isArray(ai?.space?.amenities) && ai.space.amenities.length === ownerAmenities.length
        ? ai.space.amenities.map((a: any) => String(a))
        : ownerAmenities

  const trustBar =
    Array.isArray(ai?.trust_bar) ? ai.trust_bar.slice(0, 5).map((t: any) => String(t)).filter(Boolean) : []

  return {
    niche: niche.id,
    links: {
      whatsapp: input.contact.whatsapp?.trim() || undefined,
      map_url: input.contact.map_url || undefined,
      reviews_url: input.social_proof?.reviews_url || undefined
    },
    timetable: input.timetable?.length
      ? {
          heading: String(ai?.timetable?.heading || 'جدول الحصص'),
          subheading: String(ai?.timetable?.subheading || 'احجز مكانك قبل الحصة.'),
          slots: input.timetable.map((s) => ({ day: s.day, time: s.time, name: s.name, teacher: s.teacher || undefined, level: s.level || undefined }))
        }
      : undefined,
    brand: {
      name: input.brand.name,
      type: input.brand.type,
      city: input.brand.city,
      region: input.brand.region,
      tagline: String(ai?.hero?.subheadline || mock.brand.tagline)
    },
    hero: {
      eyebrow: String(ai?.hero?.eyebrow || `${input.brand.type} · ${input.brand.city}`),
      headline: String(ai?.hero?.headline || mock.hero.headline),
      subheadline: String(ai?.hero?.subheadline || mock.hero.subheadline),
      cta_primary: String(ai?.hero?.cta_primary || 'احجز جلسة'),
      cta_secondary: String(ai?.hero?.cta_secondary || 'تصفّح الجلسات'),
      image: heroImage,
      badge: ai?.hero?.badge ? String(ai.hero.badge) : undefined
    },
    trust_bar: { items: trustBar },
    philosophy: {
      eyebrow: String(ai?.philosophy?.eyebrow || mock.philosophy.eyebrow),
      heading: String(ai?.philosophy?.heading || mock.philosophy.heading),
      subheading: String(ai?.philosophy?.subheading || mock.philosophy.subheading),
      pillars: philosophyPillars
    },
    treatments: {
      heading: String(ai?.treatments?.heading || mock.treatments.heading),
      subheading: String(ai?.treatments?.subheading || mock.treatments.subheading),
      items: treatments
    },
    journey: {
      heading: String(ai?.journey?.heading || mock.journey.heading),
      subheading: String(ai?.journey?.subheading || mock.journey.subheading),
      steps: journeySteps
    },
    team: {
      heading: String(ai?.team?.heading || mock.team.heading),
      subheading: String(ai?.team?.subheading || 'الفريق الذي سيستقبلك ويعتني بك.'),
      members: teamMembers
    },
    space: {
      heading: String(ai?.space?.heading || mock.space.heading),
      subheading: String(ai?.space?.subheading || mock.space.subheading),
      images: spaceImages,
      amenities
    },
    testimonials: {
      heading: String(ai?.testimonials?.heading || mock.testimonials.heading),
      subheading: String(ai?.testimonials?.subheading || mock.testimonials.subheading),
      average_rating: input.social_proof?.review_rating || 5,
      review_count: String(input.social_proof?.review_count || '').replace(/^\+?\s*$/, ''),
      items: testimonials
    },
    booking_cta: {
      eyebrow: String(ai?.booking_cta?.eyebrow || mock.booking_cta.eyebrow),
      heading: String(ai?.booking_cta?.heading || mock.booking_cta.heading),
      subheading: String(ai?.booking_cta?.subheading || 'اختر الجلسة والموعد المناسبين، وسنؤكّد لك الحجز.'),
      cta_label: String(ai?.booking_cta?.cta_label || 'احجز جلستك'),
      note: String(ai?.booking_cta?.note || ''),
      image: bookingImage
    },
    faq: {
      heading: mock.faq.heading,
      items: faqItems
    },
    footer: {
      tagline: String(ai?.footer?.tagline || mock.footer.tagline),
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`,
      phone: input.contact.phone,
      email: input.contact.email,
      address: input.contact.address,
      hours: input.contact.hours,
    },
    seo: {
      title: String(ai?.seo?.title || `${input.brand.name} · ${input.brand.type} · ${input.brand.city}`),
      description: String(
        ai?.seo?.description ||
          `${input.brand.name} يقدّم ${input.brand.type} في ${input.brand.city}${input.brand.region ? `، ${input.brand.region}` : ''}.`
      )
    }
  }
}

function buildFallbackContent(input: WellnessInput): WellnessContent {
  return mergeIntoContent(input, {})
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = wellnessInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues.slice(0, 8) }, { status: 400 })
  }

  const input = parsed.data
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const off = aiUnavailable()
    if (off) return off
    return NextResponse.json({ content: buildFallbackContent(input), _meta: { source: 'fallback_no_api_key' } }, { status: 200 })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.72,
        max_tokens: AI_MAX_TOKENS,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior copywriter who writes websites for small wellness and beauty businesses in the Arab world: massage centers, salons, clinics, studios. Your copy sounds like a real person who knows the trade, specific and warm, never generic or flowery. Always return strict JSON only.\n\n' +
              ARABIC_OUTPUT_DIRECTIVE
          },
          { role: 'user', content: buildPrompt(input) }
        ]
      }),
      TIMEOUT_MS,
      'wellness_ai'
    )

    await logAiUsage({ operation: 'generate-wellness', userId: await getUserIdSafe(), model: AI_MODEL }, response.usage)

    const raw = response.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try { aiJson = parseJsonSafe(raw) } catch (e) { return aiFailed('generate-wellness', e) }

    return NextResponse.json({ content: mergeIntoContent(input, aiJson), _meta: { source: 'openai', model: AI_MODEL } })
  } catch (error: any) {
    return aiFailed('generate-wellness', error)
  }
}
