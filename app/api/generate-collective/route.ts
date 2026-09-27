import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { collectiveInputSchema, type CollectiveInput } from '@/utils/collective/input'
import type { CollectiveContent, CollectiveProduct } from '@/utils/collective/types'
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
Curation story: ${input.curation_story || 'N/A'}

Collections:
${collectionsText}

Price range: ${input.price_range?.min || 'N/A'} – ${input.price_range?.max || 'N/A'}${input.price_range?.average ? ` (average ${input.price_range.average})` : ''}
Sustainability vetted: ${input.sustainability ? 'Yes' : 'No'}
Shipping: ${input.shipping_perks || 'N/A'}
Returns: ${input.returns_policy || 'N/A'}

Social proof:
- Customer count: ${input.social_proof?.customer_count || 'N/A'}
- ${ratingBrief(input.social_proof?.review_rating, input.social_proof?.review_count)}

WRITING DIRECTION
You are a luxury retail copywriter. The tone is elevated, editorial, and confident — like Net-a-Porter, Ssense, or Monocle. Think quality over quantity. Understated sophistication, not flashy luxury.

Hard rules:
- Headlines use \\n for line breaks (2–3 short lines, 3–7 words each)
- Subheadlines: 2–3 sentences, editorial, drawn only from what the brief says — never generic, never an invented detail
- Product names are placeholders the owner replaces with their real products: a plain item type from one of the brief's categories or collections plus at most a colour or shape (e.g. "Throw — Warm Sand", "Serving Board"). No brand, maker, material, ingredient, origin, size, percentage or other spec.
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
    "eyebrow": "Short line naming what the store sells, from the categories (no season or year)",
    "headline": "Hero headline with \\n",
    "subheadline": "2-3 sentence description",
    "cta_primary": "Primary CTA",
    "cta_secondary": "Secondary CTA"
  },
  "collections": {
    "eyebrow": "Short eyebrow",
    "heading": "Section heading with \\n",
    "subheading": "1–2 sentence description",
    "items": [
      { "name": "Collection name, exactly as given", "tagline": "Short poetic tagline" }
    ]
  },
  "new_arrivals": {
    "eyebrow": "Just landed",
    "heading": "New this week.",
    "products": [
      { "name": "Placeholder product name", "category": "One of the brief's categories, exactly as given" }
    ]
  },
  "brand_promise": {
    "eyebrow": "Short eyebrow",
    "headline": "Headline with \\n",
    "body": "2-3 sentence brand promise paragraph, restating only the brief's description and curation story"
  },
  "bestsellers": {
    "eyebrow": "Short eyebrow for a selection from the store (no sales or popularity claim)",
    "heading": "Heading for a selection from the store, with \\n",
    "subheading": "1 sentence, no sales, stock or popularity claim",
    "products": [
      { "name": "Placeholder product name", "category": "One of the brief's categories, exactly as given" }
    ]
  },
  "testimonials": {
    "eyebrow": "From our customers",
    "heading": "Heading for the owner's customer reviews"
  },
  "newsletter": {
    "eyebrow": "The ${input.brand.name} Edit",
    "heading": "Newsletter heading with \\n",
    "subheading": "1-2 sentence newsletter description (no frequency, no discount, no gift)",
    "placeholder": "your@email.com",
    "cta": "Subscribe",
    "note": "No noise. Unsubscribe any time."
  },
  "footer": {
    "tagline": "${input.brand.tagline}"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- collections.items: the provided collections (${input.collections.length} items), same names, same order. Write a tagline only where the brief gives none.
- new_arrivals.products: exactly 6 placeholder products across the brief's categories. No prices, badges or discounts.
- bestsellers.products: exactly 8 placeholder products across the brief's categories. No prices, badges or discounts.
- Never state, in any field, a fact the brief does not give: a price, discount, sale, shipping threshold or delivery time, return period or policy, number of products, customers, brands, studios or years, a founding year, season or date, stock level ("almost gone", "sold out", "restocked"), sales rank ("bestseller", "most loved", "reordered"), a named person, brand, maker or city, a material, ingredient or certification, or a sustainability or testing claim. Shipping, returns, customer count and sustainability may be restated only as the brief words them, and only when it gives them.
${NO_REVIEWS_RULE}`
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/**
 * The product grids are placeholders the owner replaces with their real
 * products. The AI may name one; it may not price it, badge it, discount it
 * or rate it. A category the owner did not list is dropped.
 */
function placeholderProducts(list: unknown, categories: string[], max: number): CollectiveProduct[] {
  if (!Array.isArray(list)) return []
  return list
    .map((p: any) => {
      const category = str(p?.category)
      return { name: str(p?.name), price: '', category: categories.includes(category) ? category : '' }
    })
    .filter((p) => p.name)
    .slice(0, max)
}

/** First sentence of the owner's text, or '' when it is too long for a line. */
function firstSentence(text: string | undefined, max = 155): string {
  const t = str(text)
  const s = (t.match(/^[^.!?؟۔\n]+[.!?؟۔]?/) || [''])[0].trim()
  return s.length <= max ? s : ''
}

function mergeIntoContent(input: CollectiveInput, ai: any): CollectiveContent {
  const mock = COLLECTIVE_MOCK_CONTENT
  const rating = input.social_proof?.review_rating
  const rated = typeof rating === 'number'
  const owner = { rating, count: input.social_proof?.review_count }
  const categories = input.categories.map((c) => c.trim()).filter(Boolean)
  const shipping = str(input.shipping_perks)
  const returns = str(input.returns_policy)
  const customers = str(input.social_proof?.customer_count)
  // Reviews are only ever the owner's own. With none, the section is not drawn.
  const testimonials = cleanOwnerReviews(input.social_proof?.reviews).map((r) => ({
    quote: r.text,
    author: r.name,
    rating: starsOf(r.rating),
    avatar_letter: r.name.charAt(0),
    product: r.detail,
    origin: r.origin,
    when: r.when
  }))
  // Stats are the owner's numbers only: their rating and their customer count.
  // Nothing is generated; with neither, the strip is not drawn.
  const promiseStats: { value: string; label: string }[] = [
    ...(rated ? [{ value: `${rating}★`, label: 'متوسط التقييم' }] : []),
    ...(customers ? [{ value: customers, label: 'عملاؤنا' }] : [])
  ]
  // Perks restate what the owner wrote, word for word. Nothing else is promised.
  const perks = [
    ...(shipping ? [{ icon: 'shipping', title: 'الشحن', description: shipping }] : []),
    ...(returns ? [{ icon: 'returns', title: 'الإرجاع', description: returns }] : []),
    ...(input.sustainability ? [{ icon: 'eco', title: 'منتجات مُدقَّقة للاستدامة', description: '' }] : [])
  ]
  // The owner's collections, in their order. The AI may only add a missing tagline.
  const aiCollections: any[] = Array.isArray(ai.collections?.items) ? ai.collections.items : []
  const collectionItems = input.collections.map((c, i) => ({
    name: c.name,
    tagline: str(c.tagline) || str(aiCollections[i]?.tagline),
    product_count: ''
  }))
  const ownerLine = categories.slice(0, 3).join(' · ')

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      description: ai.brand?.description || input.brand.description
    },
    hero: {
      eyebrow: unlessRatingClaim(ai.hero?.eyebrow || ownerLine, ownerLine, owner),
      headline: ai.hero?.headline || mock.hero.headline,
      subheadline: unlessRatingClaim(ai.hero?.subheadline || input.brand.description, input.brand.description, owner),
      cta_primary: ai.hero?.cta_primary || mock.hero.cta_primary,
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary,
      // The owner's shipping line, or no badge.
      badge: shipping || undefined
    },
    collections: {
      eyebrow: ai.collections?.eyebrow || mock.collections.eyebrow,
      heading: ai.collections?.heading || mock.collections.heading,
      subheading: ai.collections?.subheading || '',
      items: collectionItems
    },
    new_arrivals: {
      eyebrow: ai.new_arrivals?.eyebrow || mock.new_arrivals.eyebrow,
      heading: ai.new_arrivals?.heading || mock.new_arrivals.heading,
      products: placeholderProducts(ai.new_arrivals?.products, categories, 6)
    },
    brand_promise: {
      eyebrow: ai.brand_promise?.eyebrow || `لماذا ${input.brand.name}`,
      headline: ai.brand_promise?.headline || 'ما نختاره،\nولماذا.',
      body: ai.brand_promise?.body || input.curation_story || input.brand.description,
      stats: promiseStats
    },
    bestsellers: {
      eyebrow: ai.bestsellers?.eyebrow || 'من المتجر',
      heading: ai.bestsellers?.heading || 'مختارات\nمن المتجر.',
      subheading: ai.bestsellers?.subheading || '',
      products: placeholderProducts(ai.bestsellers?.products, categories, 8)
    },
    perks: {
      items: perks
    },
    testimonials: {
      eyebrow: ai.testimonials?.eyebrow || mock.testimonials.eyebrow,
      heading: ai.testimonials?.heading || mock.testimonials.heading,
      average_rating: rating,
      review_count: countOf(input.social_proof?.review_count),
      items: testimonials
    },
    newsletter: {
      eyebrow: ai.newsletter?.eyebrow || `نشرة ${input.brand.name}`,
      heading: ai.newsletter?.heading || mock.newsletter.heading,
      subheading: ai.newsletter?.subheading || 'جديد المتجر، في بريدك.',
      placeholder: ai.newsletter?.placeholder || mock.newsletter.placeholder,
      cta: ai.newsletter?.cta || mock.newsletter.cta,
      note: ai.newsletter?.note || ''
    },
    footer: {
      tagline: ai.footer?.tagline || input.brand.tagline,
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`,
      // The wizard asks for no email, so none is made up; the owner adds it in the editor.
      email: ''
    },
    seo: {
      title: ai.seo?.title || `${input.brand.name} — ${input.brand.tagline}`,
      description: unlessRatingClaim(
        ai.seo?.description || firstSentence(input.brand.description) || input.brand.tagline,
        input.brand.tagline,
        owner
      )
    },
    links: { reviews_url: input.social_proof?.reviews_url || undefined }
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
      const off = aiUnavailable()
      if (off) return off
      return NextResponse.json({ content: mergeIntoContent(input, {}) })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.78,
        max_tokens: AI_MAX_TOKENS,
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

    await logAiUsage({ operation: 'generate-collective', userId: await getUserIdSafe(), model: AI_MODEL }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      return aiFailed('generate-collective', raw.slice(0, 300))
    }

    const content = mergeIntoContent(input, ai)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[generate-collective]', err)
    return aiFailed('generate-collective', err)
  }
}
