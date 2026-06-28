import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { collectiveInputSchema, type CollectiveInput } from '@/utils/collective/input'
import type { CollectiveContent } from '@/utils/collective/types'
import { COLLECTIVE_MOCK_CONTENT } from '@/utils/collective/mock-content'

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

function buildPrompt(input: CollectiveInput): string {
  const categoriesText = input.categories.join(', ')
  const collectionsText = input.collections
    .map((c) => `- ${c.name}${c.tagline ? `: ${c.tagline}` : ''}`)
    .join('\n')

  return `LUXURY MULTI-BRAND STORE BRIEF
Store name: ${input.brand.name}
Tagline: ${input.brand.tagline}
Description: ${input.brand.description}
Categories: ${categoriesText}
Curation story: ${input.curation_story || 'We test everything ourselves before listing it.'}

Collections:
${collectionsText}

Price range: ${input.price_range?.min || '$50'} – ${input.price_range?.max || '$500'}
Sustainability vetted: ${input.sustainability ? 'Yes' : 'No'}
Shipping: ${input.shipping_perks || 'Free over $150, 3-5 business days'}
Returns: ${input.returns_policy || '14-day free returns'}

Social proof:
- Customer count: ${input.social_proof?.customer_count || '25,000+'}
- Review count: ${input.social_proof?.review_count || '6,000+ verified reviews'}
- Rating: ${input.social_proof?.review_rating || 4.9}/5

WRITING DIRECTION
You are a luxury retail copywriter. The tone is elevated, editorial, and confident — like Net-a-Porter, Ssense, or Monocle. Think quality over quantity. Understated sophistication, not flashy luxury.

Hard rules:
- Headlines use \\n for line breaks (2–3 short lines, 3–7 words each)
- Subheadlines: 2–3 sentences, specific and editorial — never generic
- Product names: realistic, elegant (e.g. "Linen Throw — Warm Sand", "The Daily Moisturiser SPF50")
- Testimonials: 45–65 words, specific product details, genuine voice
- Collection taglines: poetic and specific, 6–10 words
- Never use buzzwords like "premium", "luxury", "amazing", "stunning" in product copy

OUTPUT
Return ONLY valid JSON, no markdown, no prose:

{
  "brand": {
    "name": "${input.brand.name}",
    "tagline": "Brand tagline",
    "description": "2-sentence store description"
  },
  "hero": {
    "eyebrow": "New season · Season/Year or relevant short line",
    "headline": "Hero headline with \\n",
    "subheadline": "2-3 sentence description",
    "cta_primary": "Primary CTA",
    "cta_secondary": "Secondary CTA",
    "badge": "Short perk badge (e.g. 'Free shipping over $150')"
  },
  "collections": {
    "eyebrow": "Short eyebrow",
    "heading": "Section heading with \\n",
    "subheading": "1–2 sentence description",
    "items": [
      { "name": "Collection name", "tagline": "Short poetic tagline", "product_count": "NN pieces", "tag": "e.g. New season / Bestseller / Staff picks" }
    ]
  },
  "new_arrivals": {
    "eyebrow": "Just landed",
    "heading": "New this week.",
    "products": [
      { "name": "Product name", "price": "$XXX", "badge": "New", "category": "Category", "rating": 5 }
    ]
  },
  "brand_promise": {
    "eyebrow": "Short eyebrow",
    "headline": "Headline with \\n",
    "body": "2-3 sentence brand promise paragraph",
    "stats": [
      { "value": "XXX+", "label": "Short label" }
    ]
  },
  "bestsellers": {
    "eyebrow": "Consistently loved",
    "heading": "Bestseller heading with \\n",
    "subheading": "1 sentence",
    "products": [
      { "name": "Product name", "price": "$XXX", "category": "Category", "rating": 5, "badge": "optional badge" }
    ]
  },
  "perks": {
    "items": [
      { "icon": "📦", "title": "Perk title", "description": "1-2 sentence perk description" }
    ]
  },
  "testimonials": {
    "eyebrow": "From our customers",
    "heading": "Testimonials heading",
    "average_rating": 4.9,
    "review_count": "X,XXX+ verified reviews",
    "items": [
      { "quote": "45-65 word testimonial", "author": "First name L.", "location": "City, Country", "rating": 5, "avatar_letter": "A", "product": "Product name" }
    ]
  },
  "newsletter": {
    "eyebrow": "The ${input.brand.name} Edit",
    "heading": "Newsletter heading with \\n",
    "subheading": "1-2 sentence newsletter description",
    "placeholder": "your@email.com",
    "cta": "Subscribe",
    "note": "No noise. Unsubscribe any time."
  },
  "footer": {
    "tagline": "${input.brand.tagline}",
    "legal": "© 2025 ${input.brand.name}. جميع الحقوق محفوظة.",
    "email": "hello@${input.brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- collections.items: use the provided collections (${input.collections.length} items), expand with product counts and tags
- new_arrivals.products: exactly 6 products across different categories
- brand_promise.stats: exactly 4 stats (products, rating, returns, customer metric)
- bestsellers.products: exactly 8 products with realistic names and prices
- perks.items: exactly 4 perks covering shipping, returns, quality, sustainability
- testimonials.items: exactly 3 testimonials with different avatar_letters
- Each product name should be specific and elegant, not generic`
}

function mergeIntoContent(input: CollectiveInput, ai: any): CollectiveContent {
  const mock = COLLECTIVE_MOCK_CONTENT

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      description: ai.brand?.description || input.brand.description
    },
    hero: {
      eyebrow: ai.hero?.eyebrow || mock.hero.eyebrow,
      headline: ai.hero?.headline || mock.hero.headline,
      subheadline: ai.hero?.subheadline || mock.hero.subheadline,
      cta_primary: ai.hero?.cta_primary || mock.hero.cta_primary,
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary,
      badge: ai.hero?.badge || mock.hero.badge
    },
    collections: {
      eyebrow: ai.collections?.eyebrow || mock.collections.eyebrow,
      heading: ai.collections?.heading || mock.collections.heading,
      subheading: ai.collections?.subheading || mock.collections.subheading,
      items: Array.isArray(ai.collections?.items) ? ai.collections.items : mock.collections.items
    },
    new_arrivals: {
      eyebrow: ai.new_arrivals?.eyebrow || mock.new_arrivals.eyebrow,
      heading: ai.new_arrivals?.heading || mock.new_arrivals.heading,
      products: Array.isArray(ai.new_arrivals?.products) ? ai.new_arrivals.products : mock.new_arrivals.products
    },
    brand_promise: {
      eyebrow: ai.brand_promise?.eyebrow || mock.brand_promise.eyebrow,
      headline: ai.brand_promise?.headline || mock.brand_promise.headline,
      body: ai.brand_promise?.body || mock.brand_promise.body,
      stats: Array.isArray(ai.brand_promise?.stats) ? ai.brand_promise.stats : mock.brand_promise.stats
    },
    bestsellers: {
      eyebrow: ai.bestsellers?.eyebrow || mock.bestsellers.eyebrow,
      heading: ai.bestsellers?.heading || mock.bestsellers.heading,
      subheading: ai.bestsellers?.subheading || mock.bestsellers.subheading,
      products: Array.isArray(ai.bestsellers?.products) ? ai.bestsellers.products : mock.bestsellers.products
    },
    perks: {
      items: Array.isArray(ai.perks?.items) ? ai.perks.items : mock.perks.items
    },
    testimonials: {
      eyebrow: ai.testimonials?.eyebrow || mock.testimonials.eyebrow,
      heading: ai.testimonials?.heading || mock.testimonials.heading,
      average_rating: ai.testimonials?.average_rating || mock.testimonials.average_rating,
      review_count: ai.testimonials?.review_count || mock.testimonials.review_count,
      items: Array.isArray(ai.testimonials?.items) ? ai.testimonials.items : mock.testimonials.items
    },
    newsletter: {
      eyebrow: ai.newsletter?.eyebrow || mock.newsletter.eyebrow,
      heading: ai.newsletter?.heading || mock.newsletter.heading,
      subheading: ai.newsletter?.subheading || mock.newsletter.subheading,
      placeholder: ai.newsletter?.placeholder || mock.newsletter.placeholder,
      cta: ai.newsletter?.cta || mock.newsletter.cta,
      note: ai.newsletter?.note || mock.newsletter.note
    },
    footer: {
      tagline: ai.footer?.tagline || mock.footer.tagline,
      legal: ai.footer?.legal || mock.footer.legal,
      email: ai.footer?.email || mock.footer.email
    },
    seo: {
      title: ai.seo?.title || mock.seo.title,
      description: ai.seo?.description || mock.seo.description
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parseResult = collectiveInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 })
    }
    const input = parseResult.data

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ content: mergeIntoContent(input, {}) })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.78,
        max_tokens: 4500,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert luxury retail copywriter and brand strategist. Output only valid JSON.\n\n' +
              ARABIC_OUTPUT_DIRECTIVE
          },
          {
            role: 'user',
            content: buildPrompt(input)
          }
        ]
      }),
      TIMEOUT_MS,
      'openai_collective'
    )

    await logAiUsage({ operation: 'generate-collective', userId: await getUserIdSafe(), model: 'gpt-4o-mini' }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      console.error('[generate-collective] JSON parse failed, using mock fallback', raw.slice(0, 300))
    }

    const content = mergeIntoContent(input, ai)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[generate-collective]', err)
    return NextResponse.json(
      { error: err?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
