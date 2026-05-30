import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { lookbookInputSchema, type LookbookInput } from '@/utils/lookbook/input'
import type { LookbookContent } from '@/utils/lookbook/types'
import { LOOKBOOK_MOCK_CONTENT } from '@/utils/lookbook/mock-content'

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

function buildPrompt(input: LookbookInput): string {
  const productsText = input.products
    .map((p) => `- ${p.name}${p.price ? ` · ${p.price}` : ''}${p.category ? ` [${p.category}]` : ''}`)
    .join('\n')

  return `FASHION BRAND BRIEF
Brand name: ${input.brand.name}
Tagline: ${input.brand.tagline}
Category: ${input.brand.category}
Style direction: ${input.style_direction}
Target customer: ${input.target_customer}
Collection: ${input.collection_name || 'Current collection'}
Season: ${input.collection_season || 'SS25'}
Sustainability focus: ${input.sustainability_focus ? 'Yes' : 'No'}
Press features: ${input.press_features || 'Not specified'}
Review rating: ${input.social_proof?.review_rating || 4.9}/5
Review count: ${input.social_proof?.review_count || '1,000+ reviews'}

Brand story:
${input.brand_story || 'A considered contemporary fashion brand.'}

Products:
${productsText}

WRITING DIRECTION
You are writing premium copy for a high-end fashion brand website. The tone is editorial, minimal, and confident — like Jacquemus, The Row, or Reformation. Use short, evocative sentences. Avoid corporate speak, avoid overly enthusiastic exclamation marks. Fashion copy should feel like a magazine, not a billboard.

Hard rules:
- Headlines: use \\n to break into 2–3 short poetic lines (3–6 words per line)
- Subheadlines: 1–2 short sentences, evocative and specific
- Product descriptions: keep names exactly as provided
- Testimonials: 45–65 words, first-person, specific about the product, what they loved
- Look titles: "Look 01" through "Look 06" format — keep the numbering
- Look subtitles: use or improve provided product names
- Newsletter: editorial, intimate tone — like a letter from the brand
- Press: keep exactly as provided (these are real publications)
- Avoid: "elevate", "journey", "game-changer", "curated", "bespoke"

OUTPUT
Return ONLY valid JSON, no markdown, no prose, matching this exact shape:

{
  "hero": {
    "eyebrow": "Season · Year (e.g. Spring · Summer 2025)",
    "headline": "Poetic headline with \\n breaks",
    "subheadline": "1–2 evocative sentences",
    "cta_primary": "Shop the collection",
    "cta_secondary": "View lookbook",
    "badge": "Short urgency/season badge"
  },
  "drop_banner": {
    "label": "Emoji + short label (e.g. 🖤 New drop)",
    "text": "Short announcement with shipping/offer info",
    "cta": "Shop now →"
  },
  "lookbook": {
    "eyebrow": "Short season eyebrow",
    "heading": "Collection name with \\n",
    "subheading": "1–2 evocative sentences",
    "looks": [
      { "title": "Look 01", "subtitle": "Product name", "tag": "Shop this look or New arrival or Almost gone" }
    ]
  },
  "bestsellers": {
    "eyebrow": "Short section eyebrow",
    "heading": "Short evocative heading with \\n",
    "products": [
      { "name": "Keep exact name", "price": "Keep exact price", "original_price": "Keep if provided", "badge": "Keep or improve badge", "category": "Keep or infer category" }
    ]
  },
  "brand_story": {
    "eyebrow": "Our story",
    "heading": "Poetic heading with \\n (3 lines)",
    "body": "3–4 sentences, brand voice, specific and grounded",
    "values": [
      { "icon": "◎", "title": "Short title", "text": "1 sentence" }
    ]
  },
  "testimonials": {
    "eyebrow": "Short eyebrow",
    "heading": "Short heading",
    "average_rating": 4.9,
    "review_count": "Keep provided",
    "items": [
      { "author": "First name + initial", "rating": 5, "text": "45–65 word review", "item": "Product name", "verified": true }
    ]
  },
  "newsletter": {
    "eyebrow": "Short eyebrow",
    "heading": "Short evocative heading with \\n",
    "subheading": "1–2 sentences, brand voice",
    "placeholder": "your@email.com",
    "cta": "Join the list",
    "note": "Short reassurance line"
  },
  "footer": {
    "tagline": "Keep brand tagline",
    "legal": "© 2025 ${input.brand.name}. All rights reserved.",
    "email": "hello@${input.brand.name.toLowerCase().replace(/\\s+/g, '')}.co"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- lookbook.looks: exactly 6 looks with Look 01–06 numbering
- bestsellers.products: include all ${input.products.length} provided products
- brand_story.values: exactly 3 values
- testimonials.items: exactly 3 reviews, each referencing a different product
- newsletter.heading: use \\n for 2-line break`
}

function mergeIntoContent(input: LookbookInput, ai: any): LookbookContent {
  const mock = LOOKBOOK_MOCK_CONTENT

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      category: input.brand.category
    },
    hero: {
      eyebrow: ai.hero?.eyebrow || mock.hero.eyebrow,
      headline: ai.hero?.headline || mock.hero.headline,
      subheadline: ai.hero?.subheadline || mock.hero.subheadline,
      cta_primary: ai.hero?.cta_primary || mock.hero.cta_primary,
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary,
      badge: ai.hero?.badge || mock.hero.badge
    },
    drop_banner: {
      label: ai.drop_banner?.label || mock.drop_banner.label,
      text: ai.drop_banner?.text || mock.drop_banner.text,
      cta: ai.drop_banner?.cta || mock.drop_banner.cta
    },
    lookbook: {
      eyebrow: ai.lookbook?.eyebrow || mock.lookbook.eyebrow,
      heading: ai.lookbook?.heading || mock.lookbook.heading,
      subheading: ai.lookbook?.subheading || mock.lookbook.subheading,
      looks: Array.isArray(ai.lookbook?.looks) ? ai.lookbook.looks : mock.lookbook.looks
    },
    bestsellers: {
      eyebrow: ai.bestsellers?.eyebrow || mock.bestsellers.eyebrow,
      heading: ai.bestsellers?.heading || mock.bestsellers.heading,
      products: Array.isArray(ai.bestsellers?.products) ? ai.bestsellers.products : mock.bestsellers.products
    },
    brand_story: {
      eyebrow: ai.brand_story?.eyebrow || mock.brand_story.eyebrow,
      heading: ai.brand_story?.heading || mock.brand_story.heading,
      body: ai.brand_story?.body || mock.brand_story.body,
      values: Array.isArray(ai.brand_story?.values) ? ai.brand_story.values : mock.brand_story.values
    },
    press: {
      heading: mock.press.heading,
      publications: input.press_features
        ? input.press_features.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        : mock.press.publications
    },
    testimonials: {
      eyebrow: ai.testimonials?.eyebrow || mock.testimonials.eyebrow,
      heading: ai.testimonials?.heading || mock.testimonials.heading,
      average_rating: input.social_proof?.review_rating || mock.testimonials.average_rating,
      review_count: input.social_proof?.review_count || mock.testimonials.review_count,
      items: Array.isArray(ai.testimonials?.items) ? ai.testimonials.items : mock.testimonials.items
    },
    newsletter: {
      eyebrow: ai.newsletter?.eyebrow || mock.newsletter.eyebrow,
      heading: ai.newsletter?.heading || mock.newsletter.heading,
      subheading: ai.newsletter?.subheading || mock.newsletter.subheading,
      placeholder: mock.newsletter.placeholder,
      cta: mock.newsletter.cta,
      note: ai.newsletter?.note || mock.newsletter.note
    },
    footer: {
      tagline: ai.footer?.tagline || input.brand.tagline,
      legal: ai.footer?.legal || `© 2025 ${input.brand.name}. All rights reserved.`,
      email: ai.footer?.email || `hello@${input.brand.name.toLowerCase().replace(/\s+/g, '')}.co`
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
    const parseResult = lookbookInputSchema.safeParse(body)
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
        temperature: 0.72,
        max_tokens: 3500,
        messages: [
          { role: 'system', content: 'You are an expert fashion copywriter. Output only valid JSON.' },
          { role: 'user', content: buildPrompt(input) }
        ]
      }),
      TIMEOUT_MS,
      'openai_lookbook'
    )

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      console.error('[generate-lookbook] JSON parse failed, using mock fallback', raw.slice(0, 300))
    }

    return NextResponse.json({ content: mergeIntoContent(input, ai) })
  } catch (err: any) {
    console.error('[generate-lookbook]', err)
    return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 500 })
  }
}
