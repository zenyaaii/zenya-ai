import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { serviceInputSchema, type ServiceInput } from '@/utils/services/input'
import type { ServiceContent } from '@/utils/services/types'
import { SERVICE_MOCK_CONTENT } from '@/utils/services/mock-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEOUT_MS = 45_000

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2000&q=80'
]

const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1400&q=80'
]

const FALLBACK_TEAM_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80'

const FALLBACK_BEFORE_IMAGE =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80'

const FALLBACK_AFTER_IMAGE =
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80'

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
${input.areas_served.join(', ')}

Differentiators:
${input.differentiators.map((item) => `- ${item}`).join('\n')}

Emergency service: ${input.contact.emergency_service ? 'Yes' : 'No'}
Availability: ${input.contact.availability || 'Standard business hours'}
Response time: ${input.contact.response_time || 'Fast local response'}
Promo offer: ${input.social_proof.promo_offer || 'N/A'}
Licenses and trust items: ${(input.social_proof.licenses || []).join(', ') || 'N/A'}
Guarantees: ${(input.social_proof.guarantees || []).join(', ') || 'N/A'}

WRITING DIRECTION
You are writing premium copy for a local service business website. The tone is modern, reassuring, specific, and conversion-minded. It should feel like a high-end service company, not a generic directory listing and not cheesy sales copy.

Hard rules:
- Headlines: 4-11 words.
- Subheadlines: 1-2 short sentences.
- Service descriptions: 10-24 words.
- Testimonials: 18-40 words, believable and specific.
- FAQ answers: 1-2 direct sentences.
- Use the business name sparingly.
- Make the copy feel local, competent, fast, and trustworthy.
- Do not invent awards, certifications, or claims not supported by the input.
- Avoid filler phrases like "best in town", "world class", "unmatched", "revolutionary".

OUTPUT
Return ONLY valid JSON matching this exact shape. No prose. No markdown.

{
  "hero": {
    "eyebrow": "Short trust-led line",
    "headline": "Modern service headline. Use \\n if useful.",
    "subheadline": "1-2 sentence positioning line",
    "primary_cta": "Book now",
    "secondary_cta": "See services",
    "stats": [
      { "value": "4.9/5", "label": "Average rating" }
    ]
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
        "description": "Rewrite or improve description",
        "price_from": "Keep provided price if any",
        "badge": "Keep or improve badge"
      }
    ]
  },
  "story": {
    "eyebrow": "Short eyebrow",
    "heading": "Story heading",
    "body": "2-3 sentence polished version of the founder/service story",
    "quote": "One short founder-style quote"
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
    "subheading": "One short sentence",
    "response_time": "Short promise line",
    "availability": "Short availability line"
  },
  "offer": {
    "badge": "Optional small badge",
    "heading": "Offer heading",
    "subheading": "One short sentence",
    "points": ["Short bullet"],
    "cta_label": "CTA label"
  },
  "testimonials": {
    "heading": "Testimonials heading",
    "subheading": "One short sentence",
    "average_rating": 4.9,
    "review_count": "200+",
    "items": [
      { "name": "Plausible first name + initial", "text": "18-40 words", "source": "Google Reviews", "rating": 5 }
    ]
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
- services.items: rewrite every provided service item
- trust_bar: 4 items
- proof.items: exactly 3 items
- process.steps: exactly 3 items
- before_after.highlights: exactly 3 items
- offer.points: exactly 3 items
- testimonials.items: exactly 3 items
- faq: 5-7 items
- areas heading and offer heading should feel useful, not generic`
}

function pickNth<T>(items: T[], index: number, fallback: T): T {
  if (!Array.isArray(items) || items.length === 0) return fallback
  return items[index % items.length] ?? fallback
}

function mergeIntoContent(input: ServiceInput, ai: any): ServiceContent {
  const mock = SERVICE_MOCK_CONTENT
  const heroImage = input.visuals.hero_image_url || FALLBACK_HERO_IMAGES[0]
  const teamImage = input.visuals.team_image_url || FALLBACK_TEAM_IMAGE
  const beforeImage = input.visuals.before_image_url || FALLBACK_BEFORE_IMAGE
  const afterImage = input.visuals.after_image_url || FALLBACK_AFTER_IMAGE
  const galleryUrls = input.visuals.gallery_image_urls || []

  const galleryImages =
    galleryUrls.length >= 4
      ? galleryUrls.slice(0, 4).map((url) => ({ url }))
      : [
          ...galleryUrls.map((url) => ({ url })),
          ...FALLBACK_GALLERY.slice(0, 4 - galleryUrls.length).map((url) => ({ url }))
        ]

  const services =
    Array.isArray(ai?.services?.items) && ai.services.items.length >= 3
      ? input.services.map((service, index) => {
          const rewritten = ai.services.items[index] || {}
          return {
            name: service.name,
            description: String(rewritten.description || service.description || mock.services.items[index % mock.services.items.length].description),
            price_from: service.price_from || (rewritten.price_from ? String(rewritten.price_from) : undefined),
            badge: service.badge || (rewritten.badge ? String(rewritten.badge) : undefined)
          }
        })
      : input.services.map((service, index) => ({
          name: service.name,
          description: service.description || mock.services.items[index % mock.services.items.length].description,
          price_from: service.price_from,
          badge: service.badge
        }))

  const trustBar = Array.isArray(ai?.trust_bar) && ai.trust_bar.length >= 3
    ? ai.trust_bar.slice(0, 4).map((item: any) => String(item))
    : [
        ...(input.social_proof.licenses || []).slice(0, 2),
        ...(input.social_proof.guarantees || []).slice(0, 2)
      ].filter(Boolean)

  const proofItems =
    Array.isArray(ai?.proof?.items) && ai.proof.items.length >= 3
      ? ai.proof.items.slice(0, 3).map((item: any) => ({
          title: String(item?.title || ''),
          text: String(item?.text || '')
        }))
      : input.differentiators.slice(0, 3).map((item, index) => ({
          title: index === 0 ? 'Clear communication' : index === 1 ? 'Reliable execution' : 'Trustworthy service',
          text: item
        }))

  const processSteps =
    Array.isArray(ai?.process?.steps) && ai.process.steps.length >= 3
      ? ai.process.steps.slice(0, 3).map((item: any, index: number) => ({
          step: `0${index + 1}`,
          title: String(item?.title || mock.process.steps[index].title),
          text: String(item?.text || mock.process.steps[index].text)
        }))
      : mock.process.steps

  const testimonials =
    Array.isArray(ai?.testimonials?.items) && ai.testimonials.items.length >= 3
      ? ai.testimonials.items.slice(0, 3).map((item: any) => ({
          name: String(item?.name || 'عميل موثّق'),
          text: String(item?.text || ''),
          source: item?.source ? String(item.source) : undefined,
          rating: typeof item?.rating === 'number' ? Math.max(1, Math.min(5, Math.round(item.rating))) : 5
        }))
      : mock.testimonials.items

  const faqItems =
    Array.isArray(ai?.faq) && ai.faq.length >= 5
      ? ai.faq.slice(0, 7).map((item: any) => ({
          q: String(item?.q || ''),
          a: String(item?.a || '')
        }))
      : mock.faq.items

  const fallbackTrust = trustBar.length > 0 ? trustBar : mock.trust_bar.items

  return {
    brand: {
      name: input.brand.name,
      category: input.brand.category,
      city: input.brand.city,
      region: input.brand.region,
      tagline: String(ai?.hero?.subheadline || mock.brand.tagline),
      owner_name: input.brand.owner_name
    },
    hero: {
      eyebrow: String(ai?.hero?.eyebrow || mock.hero.eyebrow),
      headline: String(ai?.hero?.headline || mock.hero.headline),
      subheadline: String(ai?.hero?.subheadline || mock.hero.subheadline),
      primary_cta: String(ai?.hero?.primary_cta || (input.contact.booking_url ? 'احجز زيارة' : 'اطلب عرض سعر')),
      secondary_cta: String(ai?.hero?.secondary_cta || 'تصفّح الخدمات'),
      image: heroImage,
      stats:
        Array.isArray(ai?.hero?.stats) && ai.hero.stats.length >= 3
          ? ai.hero.stats.slice(0, 3).map((item: any) => ({
              value: String(item?.value || ''),
              label: String(item?.label || '')
            }))
          : [
              { value: `${(input.social_proof.review_rating || 4.9).toFixed(1)}/5`, label: 'متوسط التقييم' },
              { value: input.brand.years_in_business || '+10 سنوات', label: 'في السوق' },
              { value: input.contact.response_time || 'رد سريع', label: 'وقت الرد' }
            ]
    },
    trust_bar: {
      items: fallbackTrust.slice(0, 4)
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
      quote: String(ai?.story?.quote || input.story.quote_seed || mock.story.quote),
      image: teamImage
    },
    proof: {
      heading: String(ai?.proof?.heading || mock.proof.heading),
      subheading: String(ai?.proof?.subheading || mock.proof.subheading),
      items: proofItems
    },
    before_after: {
      heading: String(ai?.before_after?.heading || mock.before_after.heading),
      subheading: String(ai?.before_after?.subheading || mock.before_after.subheading),
      before_label: 'قبل',
      after_label: 'بعد',
      before_image: beforeImage,
      after_image: afterImage,
      highlights:
        Array.isArray(ai?.before_after?.highlights) && ai.before_after.highlights.length >= 3
          ? ai.before_after.highlights.slice(0, 3).map((item: any) => String(item))
          : mock.before_after.highlights
    },
    process: {
      heading: String(ai?.process?.heading || mock.process.heading),
      subheading: String(ai?.process?.subheading || mock.process.subheading),
      steps: processSteps
    },
    areas: {
      heading: String(ai?.areas?.heading || `نخدم ${input.brand.city} والمناطق المجاورة`),
      subheading: String(ai?.areas?.subheading || 'التغطية المحلية تساعدنا على التحرّك أسرع والمتابعة بشكل أفضل.'),
      areas_served: input.areas_served,
      response_time: String(ai?.areas?.response_time || input.contact.response_time || 'استجابة محلية سريعة'),
      availability: String(ai?.areas?.availability || input.contact.availability || 'المواعيد متاحة خلال أيام الأسبوع')
    },
    offer: {
      badge: input.social_proof.promo_offer ? 'عرض حالي' : String(ai?.offer?.badge || mock.offer.badge),
      heading: String(ai?.offer?.heading || input.social_proof.promo_offer || mock.offer.heading),
      subheading: String(ai?.offer?.subheading || mock.offer.subheading),
      points:
        Array.isArray(ai?.offer?.points) && ai.offer.points.length >= 3
          ? ai.offer.points.slice(0, 3).map((item: any) => String(item))
          : (input.social_proof.guarantees || mock.offer.points).slice(0, 3),
      cta_label: String(ai?.offer?.cta_label || (input.contact.booking_url ? 'احجز زيارتي' : 'اطلب عرض سعري'))
    },
    testimonials: {
      heading: String(ai?.testimonials?.heading || mock.testimonials.heading),
      subheading: String(ai?.testimonials?.subheading || mock.testimonials.subheading),
      average_rating:
        typeof ai?.testimonials?.average_rating === 'number'
          ? Math.max(4, Math.min(5, ai.testimonials.average_rating))
          : input.social_proof.review_rating || mock.testimonials.average_rating,
      review_count: String(ai?.testimonials?.review_count || input.social_proof.review_count || mock.testimonials.review_count),
      items: testimonials
    },
    faq: {
      heading: 'أسئلة شائعة قبل الحجز',
      items: faqItems
    },
    final_cta: {
      heading: String(ai?.final_cta?.heading || mock.final_cta.heading),
      subheading: String(ai?.final_cta?.subheading || ai?.final_cta?.subheadline || mock.final_cta.subheading),
      cta_label: String(ai?.final_cta?.cta_label || (input.contact.booking_url ? 'احجز الآن' : 'اطلب عرض سعر')),
      secondary_text: String(ai?.final_cta?.secondary_text || mock.final_cta.secondary_text)
    },
    gallery: {
      heading: String(ai?.gallery?.heading || mock.gallery.heading),
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
    }
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
    } catch {
      aiJson = {}
    }

    return NextResponse.json({
      content: mergeIntoContent(input, aiJson),
      _meta: { source: 'openai', model: AI_MODEL }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        content: buildFallbackContent(input),
        _meta: { source: 'fallback_error', error: String(error?.message || error) }
      },
      { status: 200 }
    )
  }
}
