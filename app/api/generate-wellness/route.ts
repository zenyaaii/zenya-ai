import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { wellnessInputSchema, type WellnessInput } from '@/utils/wellness/input'
import type { WellnessContent } from '@/utils/wellness/types'
import { WELLNESS_MOCK_CONTENT } from '@/utils/wellness/mock-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEOUT_MS = 45_000

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2400&q=85',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=2400&q=85'
]

const FALLBACK_SPACE_IMAGES = [
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80'
]

const FALLBACK_BOOKING_IMAGE =
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2000&q=80'

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
  const treatmentsText = input.treatments
    .map((t) => `- ${t.name}${t.category ? ` [${t.category}]` : ''}${t.duration ? `, ${t.duration}` : ''}${t.price ? `, ${t.price}` : ''}${t.badge ? ` (${t.badge})` : ''}${t.description ? `: ${t.description}` : ''}`)
    .join('\n')

  const teamText = (input.team || [])
    .map((m) => `- ${m.name}${m.title ? `, ${m.title}` : ''}${m.specialty ? ` · ${m.specialty}` : ''}${m.bio ? `: ${m.bio}` : ''}`)
    .join('\n') || 'No team provided'

  return `WELLNESS STUDIO BRIEF
Studio name: ${input.brand.name}
Type: ${input.brand.type}
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
Rating: ${input.social_proof?.review_rating || 5}/5
Review count: ${input.social_proof?.review_count || '100+'}
Certifications: ${input.social_proof?.certifications || 'N/A'}
Hours: ${input.contact.hours || 'N/A'}
Booking URL: ${input.contact.booking_url || 'N/A'}

WRITING DIRECTION
You are writing premium copy for a luxury wellness studio website. The tone is calm, confident, poetic without being vague — it should feel like a $1000/session spa, not a yoga app or gym. Speak to clients who value intentional rest and expert care.

Hard rules:
- Headlines can be poetic and line-broken with \\n (4–12 words each line).
- Subheadlines: 1–2 short sentences, grounded and warm.
- Treatment descriptions: 12–22 words, sensory and precise.
- Testimonials: 28–50 words, specific and believable, mention the treatment.
- FAQ answers: 1–2 direct, warm sentences.
- Avoid generic wellness buzzwords: "journey", "transformation", "life-changing", "empowering", "holistic journey".
- Never invent credentials or make medical claims.

OUTPUT
Return ONLY valid JSON, no prose, no markdown, matching this exact shape:

{
  "hero": {
    "eyebrow": "Short trust-led line",
    "headline": "Poetic headline. Use \\n to break into 2–3 short lines.",
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
      { "icon": "🌿", "title": "Short title", "text": "1 sentence" }
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
    "heading": "Section heading",
    "subheading": "1 short sentence",
    "average_rating": 5.0,
    "review_count": "Keep provided count",
    "items": [
      { "name": "First name + initial", "text": "28–50 words", "treatment": "Treatment name", "rating": 5 }
    ]
  },
  "booking_cta": {
    "eyebrow": "Short eyebrow",
    "heading": "Poetic heading",
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
- trust_bar: exactly 4–5 items
- philosophy.pillars: exactly 3 items
- treatments.items: rewrite every provided treatment
- journey.steps: exactly 3 steps
- team.members: include all provided team members
- space.amenities: 4–6 items (use provided amenities if any)
- testimonials.items: exactly 3 items
- faq: 5–7 items`
}

function splitLines(value: string): string[] {
  return value.split(/[\n,]/).map((s) => s.trim()).filter((s) => s.length > 0)
}

function mergeIntoContent(input: WellnessInput, ai: any): WellnessContent {
  const mock = WELLNESS_MOCK_CONTENT

  const heroImage = input.visuals?.hero_image_url || FALLBACK_HERO_IMAGES[0]
  const bookingImage = input.visuals?.hero_image_url || FALLBACK_BOOKING_IMAGE
  const spaceUrls = splitLines(input.visuals?.space_image_urls || '').filter((u) => /^https?:\/\//.test(u))
  const spaceImages =
    spaceUrls.length >= 4
      ? spaceUrls.slice(0, 4).map((url) => ({ url }))
      : [
          ...spaceUrls.map((url) => ({ url })),
          ...FALLBACK_SPACE_IMAGES.slice(0, 4 - spaceUrls.length).map((url) => ({ url }))
        ]

  const treatments =
    Array.isArray(ai?.treatments?.items) && ai.treatments.items.length >= 3
      ? input.treatments.map((t, i) => {
          const aiT = ai.treatments.items[i] || {}
          return {
            name: t.name,
            category: t.category || String(aiT.category || mock.treatments.items[i % mock.treatments.items.length].category),
            duration: t.duration || String(aiT.duration || '60 min'),
            price: t.price || String(aiT.price || ''),
            description: String(aiT.description || t.description || mock.treatments.items[i % mock.treatments.items.length].description),
            badge: t.badge || (aiT.badge ? String(aiT.badge) : undefined)
          }
        })
      : input.treatments.map((t, i) => ({
          name: t.name,
          category: t.category || mock.treatments.items[i % mock.treatments.items.length].category,
          duration: t.duration || '60 min',
          price: t.price || '',
          description: t.description || mock.treatments.items[i % mock.treatments.items.length].description,
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
            bio: String(aiM.bio || m.bio || mock.team.members[i % mock.team.members.length].bio),
            image: m.image_url || mock.team.members[i % mock.team.members.length].image
          }
        })
      : mock.team.members

  const philosophyPillars =
    Array.isArray(ai?.philosophy?.pillars) && ai.philosophy.pillars.length >= 3
      ? ai.philosophy.pillars.slice(0, 3).map((p: any) => ({
          icon: String(p?.icon || '✦'),
          title: String(p?.title || ''),
          text: String(p?.text || '')
        }))
      : mock.philosophy.pillars

  const journeySteps =
    Array.isArray(ai?.journey?.steps) && ai.journey.steps.length >= 3
      ? ai.journey.steps.slice(0, 3).map((s: any, i: number) => ({
          step: `0${i + 1}`,
          title: String(s?.title || mock.journey.steps[i].title),
          text: String(s?.text || mock.journey.steps[i].text)
        }))
      : mock.journey.steps

  const testimonials =
    Array.isArray(ai?.testimonials?.items) && ai.testimonials.items.length >= 3
      ? ai.testimonials.items.slice(0, 3).map((t: any) => ({
          name: String(t?.name || 'Verified client'),
          text: String(t?.text || ''),
          treatment: t?.treatment ? String(t.treatment) : undefined,
          rating: typeof t?.rating === 'number' ? Math.max(1, Math.min(5, Math.round(t.rating))) : 5
        }))
      : mock.testimonials.items

  const faqItems =
    Array.isArray(ai?.faq) && ai.faq.length >= 5
      ? ai.faq.slice(0, 7).map((f: any) => ({ q: String(f?.q || ''), a: String(f?.a || '') }))
      : mock.faq.items

  const amenities =
    Array.isArray(ai?.space?.amenities) && ai.space.amenities.length >= 4
      ? ai.space.amenities.slice(0, 6).map((a: any) => String(a))
      : splitLines(input.amenities || '').length >= 4
        ? splitLines(input.amenities || '').slice(0, 6)
        : mock.space.amenities

  const trustBar =
    Array.isArray(ai?.trust_bar) && ai.trust_bar.length >= 3
      ? ai.trust_bar.slice(0, 5).map((t: any) => String(t))
      : mock.trust_bar.items

  return {
    brand: {
      name: input.brand.name,
      type: input.brand.type,
      city: input.brand.city,
      region: input.brand.region,
      tagline: String(ai?.hero?.subheadline || mock.brand.tagline)
    },
    hero: {
      eyebrow: String(ai?.hero?.eyebrow || mock.hero.eyebrow),
      headline: String(ai?.hero?.headline || mock.hero.headline),
      subheadline: String(ai?.hero?.subheadline || mock.hero.subheadline),
      cta_primary: String(ai?.hero?.cta_primary || (input.contact.booking_url ? 'Book a session' : 'Contact us')),
      cta_secondary: String(ai?.hero?.cta_secondary || 'Explore treatments'),
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
      subheading: String(ai?.team?.subheading || mock.team.subheading),
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
      average_rating:
        typeof ai?.testimonials?.average_rating === 'number'
          ? Math.max(4, Math.min(5, ai.testimonials.average_rating))
          : input.social_proof?.review_rating || mock.testimonials.average_rating,
      review_count: String(ai?.testimonials?.review_count || input.social_proof?.review_count || mock.testimonials.review_count),
      items: testimonials
    },
    booking_cta: {
      eyebrow: String(ai?.booking_cta?.eyebrow || mock.booking_cta.eyebrow),
      heading: String(ai?.booking_cta?.heading || mock.booking_cta.heading),
      subheading: String(ai?.booking_cta?.subheading || mock.booking_cta.subheading),
      cta_label: String(ai?.booking_cta?.cta_label || (input.contact.booking_url ? 'Book your session' : 'Get in touch')),
      note: String(ai?.booking_cta?.note || mock.booking_cta.note),
      image: bookingImage
    },
    faq: {
      heading: mock.faq.heading,
      items: faqItems
    },
    footer: {
      tagline: String(ai?.footer?.tagline || mock.footer.tagline),
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. All rights reserved.`,
      phone: input.contact.phone,
      email: input.contact.email,
      address: input.contact.address,
      hours: input.contact.hours,
      booking_url: input.contact.booking_url
    },
    seo: {
      title: String(ai?.seo?.title || `${input.brand.name} · ${input.brand.type} · ${input.brand.city}`),
      description: String(
        ai?.seo?.description ||
          `${input.brand.name} offers ${input.brand.type.toLowerCase()} in ${input.brand.city}${input.brand.region ? `, ${input.brand.region}` : ''}.`
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
    return NextResponse.json({ content: buildFallbackContent(input), _meta: { source: 'fallback_no_api_key' } }, { status: 200 })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const response = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.72,
        max_tokens: 3200,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content: 'You are a senior copywriter for ultra-premium wellness and spa brands. You write calm, precise, sensory copy that feels like it belongs on a $1000/session luxury wellness website. Always return strict JSON only.'
          },
          { role: 'user', content: buildPrompt(input) }
        ]
      }),
      TIMEOUT_MS,
      'wellness_ai'
    )

    const raw = response.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try { aiJson = parseJsonSafe(raw) } catch { aiJson = {} }

    return NextResponse.json({ content: mergeIntoContent(input, aiJson), _meta: { source: 'openai', model: 'gpt-4o-mini' } })
  } catch (error: any) {
    return NextResponse.json(
      { content: buildFallbackContent(input), _meta: { source: 'fallback_error', error: String(error?.message || error) } },
      { status: 200 }
    )
  }
}
