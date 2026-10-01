import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { serviceInputSchema, type ServiceInput } from '@/utils/services/input'
import type { ServiceContent } from '@/utils/services/types'
import { SERVICE_MOCK_CONTENT } from '@/utils/services/mock-content'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, dropRatingClaims, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEOUT_MS = 45_000

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2000&q=80'
]

// There is no stock fallback for the gallery or the before/after pair: those
// sections present photos as this business's own work, so they carry the
// owner's uploads or nothing, and the template leaves an empty one out.

const FALLBACK_TEAM_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function parseJsonSafe(raw: string): any {
  try {
    return JSON.parse(raw)
  } catch {
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  }
}

function buildPrompt(input: ServiceInput) {
  const servicesText = input.services
    .map(
      (service) =>
        `- ${service.name}${service.price_from ? ` (${service.price_from})` : ''}${service.badge ? ` [${service.badge}]` : ''}${
          service.description ? `: ${service.description}` : ''
        }`
    )
    .join('\n')

  return `LOCAL SERVICE BRIEF
Business: ${input.brand.name}
Category: ${input.brand.category}
City: ${input.brand.city}${input.brand.region ? `, ${input.brand.region}` : ''}
Owner: ${input.brand.owner_name || 'N/A'}
Years in business: ${input.brand.years_in_business || 'N/A'}

Story notes:
${input.story.brief}

Services:
${servicesText}

Areas served:
${input.areas_served.join(', ') || 'N/A'}

Differentiators:
${input.differentiators.map((item) => `- ${item}`).join('\n') || 'N/A'}

Founder quote notes: ${input.story.quote_seed || 'N/A'}

Emergency service: ${input.contact.emergency_service ? 'Yes' : 'No'}
Availability: ${input.contact.availability || 'N/A'}
Response time: ${input.contact.response_time || 'N/A'}
Promo offer: ${input.social_proof.promo_offer || 'N/A'}
Licenses and trust items: ${(input.social_proof.licenses || []).join(', ') || 'N/A'}
Guarantees: ${(input.social_proof.guarantees || []).join(', ') || 'N/A'}
${ratingBrief(input.social_proof.review_rating, input.social_proof.review_count)}

WRITING DIRECTION
You are writing premium copy for a local service business website. The tone is modern, reassuring, specific, and conversion-minded. It should feel like a high-end service company, not a generic directory listing and not cheesy sales copy.

Hard rules:
- Headlines: 4-11 words.
- Subheadlines: 1-2 short sentences.
- Service descriptions: 10-24 words.
- FAQ answers: 1-2 direct sentences.
- Use the business name sparingly.
- Make the copy feel local, competent, fast, and trustworthy.
- Do not invent awards, certifications, or claims not supported by the input.
- Never state a price, discount, offer, fee, year, number of years, number of clients or jobs, rating, award, licence, certification, insurance, guarantee, warranty, response time, working hours, emergency cover, free estimate, team member, brand or product name that the brief does not give. Where the brief says N/A, say nothing about it. This applies to every field.
- Avoid filler phrases like "best in town", "world class", "unmatched", "revolutionary".

OUTPUT
Return ONLY valid JSON matching this exact shape. No prose. No markdown.

{
  "hero": {
    "eyebrow": "Short trust-led line",
    "headline": "Modern service headline. Use \\n if useful.",
    "subheadline": "1-2 sentence positioning line",
    "primary_cta": "Book now",
    "secondary_cta": "See services"
  },
  "trust_bar": [
    "Short trust item"
  ],
  "services": {
    "heading": "Section heading",
    "subheading": "One short sentence",
    "items": [
      {
        "name": "Exact service name",
        "description": "Rewrite or improve description"
      }
    ]
  },
  "story": {
    "eyebrow": "Short eyebrow",
    "heading": "Story heading",
    "body": "2-3 sentence polished version of the founder/service story",
    "quote": "The founder quote notes, lightly polished. Empty string when the brief gives none"
  },
  "proof": {
    "heading": "Proof section heading",
    "subheading": "One short sentence",
    "items": [
      { "title": "Short title", "text": "1 sentence" }
    ]
  },
  "before_after": {
    "heading": "Before/after heading",
    "subheading": "One short sentence",
    "highlights": ["Short result point"]
  },
  "process": {
    "heading": "Process heading",
    "subheading": "One short sentence",
    "steps": [
      { "title": "Step title", "text": "1 sentence" }
    ]
  },
  "areas": {
    "heading": "Service area heading",
    "subheading": "One short sentence"
  },
  "offer": {
    "badge": "Optional small badge",
    "heading": "Offer heading",
    "subheading": "One short sentence",
    "points": ["Short bullet"],
    "cta_label": "CTA label"
  },
  "testimonials": {
    "heading": "Heading for the owner's customer reviews",
    "subheading": "One short sentence"
  },
  "faq": [
    { "q": "Question", "a": "Answer" }
  ],
  "final_cta": {
    "heading": "Final CTA heading",
    "subheading": "One short sentence",
    "cta_label": "CTA label",
    "secondary_text": "Short reassurance line"
  },
  "gallery": {
    "heading": "Gallery heading"
  },
  "footer": {
    "tagline": "Short closing line"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- services.items: rewrite every provided service item's description, in the same order. Prices and badges are taken from the brief as given; do not write them.
- trust_bar: 0-4 items. Each one restates a fact the brief gives (a listed licence or guarantee, a service offered, the city, the years in business). Write fewer items rather than invent one. Return [] when the brief gives nothing to restate.
- proof.items: 0-3 items, each restating a differentiator the brief gives. Return [] when the brief lists none.
- process.steps: exactly 3 items describing how a customer books and gets the job done, with no promises of time, price or guarantee.
- before_after.highlights: 0-3 items, only restating results the brief describes. Return [] when it describes none.
- offer.points: 0-3 items, only restating the promo offer or guarantees the brief gives. Return [] when it gives none.
- offer.badge: only when the brief gives a promo offer; otherwise empty string.
${NO_REVIEWS_RULE}
- faq: 5-7 items. Answers use only what the brief says. Where it says nothing, the answer tells the reader to contact the business directly.
- areas heading and offer heading should feel useful, not generic`
}

// Used when the AI leaves the steps out. Nothing here is a fact about a business.
const NEUTRAL_PROCESS = [
  { step: '01', title: 'أخبرنا بما تحتاج', text: 'تواصل معنا واشرح لنا المهمة والوقت الذي يناسبك.' },
  { step: '02', title: 'نتّفق على التفاصيل', text: 'نراجع الطلب معك ونوضّح ما يمكن توقّعه قبل الموعد.' },
  { step: '03', title: 'ننجز العمل', text: 'نصل في الموعد المتّفق عليه وننجز المهمة.' }
]

function pickNth<T>(items: T[], index: number, fallback: T): T {
  if (!Array.isArray(items) || items.length === 0) return fallback
  return items[index % items.length] ?? fallback
}

function mergeIntoContent(input: ServiceInput, ai: any): ServiceContent {
  const mock = SERVICE_MOCK_CONTENT
  const heroImage = input.visuals.hero_image_url || FALLBACK_HERO_IMAGES[0]
  const teamImage = input.visuals.team_image_url || FALLBACK_TEAM_IMAGE
  const beforeImage = input.visuals.before_image_url || ''
  const afterImage = input.visuals.after_image_url || ''
  const galleryImages = (input.visuals.gallery_image_urls || []).slice(0, 4).map((url) => ({ url }))

  const services =
    Array.isArray(ai?.services?.items) && ai.services.items.length >= 3
      ? input.services.map((service, index) => {
          const rewritten = ai.services.items[index] || {}
          return {
            name: service.name,
            description: String(rewritten.description || service.description || ''),
            // Price and badge are the owner's facts. The AI may not supply them.
            price_from: service.price_from || undefined,
            badge: service.badge || undefined
          }
        })
      : input.services.map((service, index) => ({
          name: service.name,
          description: service.description || '',
          price_from: service.price_from,
          badge: service.badge
        }))

  const rating = input.social_proof.review_rating
  const rated = typeof rating === 'number' && rating > 0
  const owner = { rating, count: input.social_proof.review_count }
  const trustBar = Array.isArray(ai?.trust_bar) && ai.trust_bar.length > 0
    ? dropRatingClaims(ai.trust_bar.slice(0, 4).map((item: any) => String(item || '')).filter(Boolean), (t: string) => t, owner)
    : [
        ...(input.social_proof.licenses || []).slice(0, 2),
        ...(input.social_proof.guarantees || []).slice(0, 2)
      ].filter(Boolean)

  const proofItems =
    Array.isArray(ai?.proof?.items) && ai.proof.items.length > 0
      ? ai.proof.items.slice(0, 3).map((item: any) => ({
          title: String(item?.title || ''),
          text: String(item?.text || '')
        })).filter((item: { title: string; text: string }) => item.title || item.text)
      : input.differentiators.slice(0, 3).map((item, index) => ({
          title: index === 0 ? 'تواصل واضح' : index === 1 ? 'تنفيذ متقن' : 'خدمة تستحق الثقة',
          text: item
        }))

  const processSteps =
    Array.isArray(ai?.process?.steps) && ai.process.steps.length >= 3
      ? ai.process.steps.slice(0, 3).map((item: any, index: number) => ({
          step: `0${index + 1}`,
          title: String(item?.title || NEUTRAL_PROCESS[index].title),
          text: String(item?.text || NEUTRAL_PROCESS[index].text)
        }))
      : NEUTRAL_PROCESS

  // Reviews are only ever the owner's own. With none, the section is not drawn.
  const testimonials = cleanOwnerReviews(input.social_proof.reviews).map((r) => ({
    name: r.name,
    text: r.text,
    source: r.origin === 'google' ? 'Google' : undefined,
    service: r.detail,
    rating: starsOf(r.rating),
    origin: r.origin,
    when: r.when
  }))

  // Hero stats are the owner's numbers, built from the brief only. The AI never
  // writes one, and with nothing given the stat cards are not drawn.
  const plainStats: { value: string; label: string }[] = [
    ...(input.brand.years_in_business ? [{ value: input.brand.years_in_business, label: 'في السوق' }] : []),
    ...(input.contact.response_time ? [{ value: input.contact.response_time, label: 'وقت الاستجابة' }] : []),
    ...(input.areas_served.length ? [{ value: String(input.areas_served.length), label: input.areas_served.length === 1 ? 'منطقة نخدمها' : 'مناطق نخدمها' }] : [])
  ]
  const heroStats = (rated ? [{ value: `${rating.toFixed(1)}/5`, label: 'متوسط التقييم' }, ...plainStats] : plainStats).slice(0, 3)

  const faqItems =
    Array.isArray(ai?.faq) && ai.faq.length >= 5
      ? ai.faq.slice(0, 7).map((item: any) => ({
          q: String(item?.q || ''),
          a: String(item?.a || '')
        }))
      : []

  const neutralEyebrow = `${input.brand.category} · ${input.brand.city}`
  const neutralSubheadline = `${input.brand.name} يقدّم ${input.brand.category} في ${input.brand.city}${input.brand.region ? `، ${input.brand.region}` : ''}.`
  const promo = input.social_proof.promo_offer
  const offerPoints =
    Array.isArray(ai?.offer?.points) && ai.offer.points.length > 0
      ? ai.offer.points.slice(0, 3).map((item: any) => String(item || '')).filter(Boolean)
      : (input.social_proof.guarantees || []).slice(0, 3)

  return {
    brand: {
      name: input.brand.name,
      category: input.brand.category,
      city: input.brand.city,
      region: input.brand.region,
      tagline: String(ai?.hero?.subheadline || neutralSubheadline),
      owner_name: input.brand.owner_name
    },
    hero: {
      eyebrow: unlessRatingClaim(String(ai?.hero?.eyebrow || neutralEyebrow), neutralEyebrow, owner),
      headline: String(ai?.hero?.headline || mock.hero.headline),
      subheadline: String(ai?.hero?.subheadline || neutralSubheadline),
      primary_cta: String(ai?.hero?.primary_cta || (input.contact.booking_url ? 'احجز زيارة' : 'اطلب عرض سعر')),
      secondary_cta: String(ai?.hero?.secondary_cta || 'تصفّح الخدمات'),
      image: heroImage,
      stats: heroStats
    },
    trust_bar: {
      items: trustBar.slice(0, 4)
    },
    services: {
      heading: String(ai?.services?.heading || 'كيف يمكننا مساعدتك'),
      subheading: String(ai?.services?.subheading || mock.services.subheading),
      items: services
    },
    story: {
      eyebrow: String(ai?.story?.eyebrow || 'عن العمل'),
      heading: String(ai?.story?.heading || 'بُنينا لنكون أكثر موثوقية منذ أول اتصال.'),
      body: String(ai?.story?.body || input.story.brief),
      owner_name: input.brand.owner_name,
      owner_title: input.story.owner_title,
      // A quote is attributed to the owner, so it only exists when they wrote one.
      quote: input.story.quote_seed ? String(ai?.story?.quote || input.story.quote_seed) : undefined,
      image: teamImage
    },
    proof: {
      heading: String(ai?.proof?.heading || mock.proof.heading),
      subheading: String(ai?.proof?.subheading || 'ما يميّز طريقتنا في العمل.'),
      items: proofItems
    },
    before_after: {
      heading: String(ai?.before_after?.heading || mock.before_after.heading),
      subheading: String(ai?.before_after?.subheading || 'صور من العمل قبل الخدمة وبعدها.'),
      before_label: 'قبل',
      after_label: 'بعد',
      before_image: beforeImage,
      after_image: afterImage,
      highlights:
        Array.isArray(ai?.before_after?.highlights)
          ? ai.before_after.highlights.slice(0, 3).map((item: any) => String(item || '')).filter(Boolean)
          : []
    },
    process: {
      heading: String(ai?.process?.heading || mock.process.heading),
      subheading: String(ai?.process?.subheading || 'من أول تواصل إلى إنجاز المهمة.'),
      steps: processSteps
    },
    areas: {
      heading: String(ai?.areas?.heading || `نخدم ${input.brand.city} والمناطق المجاورة`),
      subheading: String(ai?.areas?.subheading || 'التغطية المحلية تساعدنا على التحرّك أسرع والمتابعة بشكل أفضل.'),
      areas_served: input.areas_served,
      // Response time and hours are the owner's promises. Empty when not given.
      response_time: input.contact.response_time || '',
      availability: input.contact.availability || ''
    },
    offer: {
      // An offer badge only when the owner has an offer.
      badge: promo ? 'عرض حالي' : undefined,
      heading: String(ai?.offer?.heading || promo || 'أخبرنا بما تحتاج'),
      subheading: String(ai?.offer?.subheading || 'أرسل تفاصيل طلبك وسنعود إليك.'),
      points: offerPoints,
      cta_label: String(ai?.offer?.cta_label || (input.contact.booking_url ? 'احجز زيارتي' : 'اطلب عرض سعري'))
    },
    testimonials: {
      heading: String(ai?.testimonials?.heading || mock.testimonials.heading),
      subheading: String(ai?.testimonials?.subheading || 'ما كتبه عملاؤنا عن تجربتهم.'),
      average_rating: rated ? rating : undefined,
      review_count: countOf(input.social_proof.review_count),
      items: testimonials
    },
    faq: {
      heading: 'أسئلة شائعة قبل الحجز',
      items: faqItems
    },
    final_cta: {
      heading: String(ai?.final_cta?.heading || mock.final_cta.heading),
      subheading: String(ai?.final_cta?.subheading || ai?.final_cta?.subheadline || 'تواصل معنا واحجز الموعد الذي يناسبك.'),
      cta_label: String(ai?.final_cta?.cta_label || (input.contact.booking_url ? 'احجز الآن' : 'اطلب عرض سعر')),
      secondary_text: String(ai?.final_cta?.secondary_text || '')
    },
    gallery: {
      heading: String(ai?.gallery?.heading || 'معرض الصور'),
      images: galleryImages
    },
    footer: {
      tagline: String(ai?.footer?.tagline || mock.footer.tagline),
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`,
      phone: input.contact.phone,
      email: input.contact.email,
      address: input.contact.address
    },
    seo: {
      title: String(ai?.seo?.title || `${input.brand.name} · ${input.brand.category} · ${input.brand.city}`),
      description: String(
        ai?.seo?.description ||
          `${input.brand.name} يقدّم ${input.brand.category} في ${input.brand.city}${input.brand.region ? `، ${input.brand.region}` : ''}.`
      )
    },
    links: { reviews_url: input.social_proof.reviews_url || undefined }
  }
}

function buildFallbackContent(input: ServiceInput): ServiceContent {
  return mergeIntoContent(input, {})
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = serviceInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues.slice(0, 8) },
      { status: 400 }
    )
  }

  const input = parsed.data
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const off = aiUnavailable()
    if (off) return off
    return NextResponse.json(
      {
        content: buildFallbackContent(input),
        _meta: { source: 'fallback_no_api_key' }
      },
      { status: 200 }
    )
  }

  try {
    const openai = new OpenAI({ apiKey })
    const prompt = buildPrompt(input)

    const response = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.7,
        max_tokens: AI_MAX_TOKENS,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior website copywriter for premium local service companies. You write clean, conversion-focused, design-aware copy and always return strict JSON only.\n\n' +
              ARABIC_OUTPUT_DIRECTIVE
          },
          { role: 'user', content: prompt }
        ]
      }),
      TIMEOUT_MS,
      'services_ai'
    )

    await logAiUsage({ operation: 'generate-services', userId: await getUserIdSafe(), model: AI_MODEL }, response.usage)

    const raw = response.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try {
      aiJson = parseJsonSafe(raw)
    } catch (e) {
      return aiFailed('generate-services', e)
    }

    return NextResponse.json({
      content: mergeIntoContent(input, aiJson),
      _meta: { source: 'openai', model: AI_MODEL }
    })
  } catch (error: any) {
    return aiFailed('generate-services', error)
  }
}
