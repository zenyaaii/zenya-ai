import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { ICON_VOCAB_PROMPT } from '@/components/icons/vocab'
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
Collection name: ${input.collection_name || 'none given — never name a collection'}
Season: ${input.collection_season || 'none given — never name a season or a year'}
Sustainability focus: ${input.sustainability_focus ? 'Yes' : 'No — make no sustainability, ethical or material claim'}
Press features: ${input.press_features || 'Not specified'}
${ratingBrief(input.social_proof?.review_rating, input.social_proof?.review_count)}

Brand story:
${input.brand_story || 'Not given.'}

Products:
${productsText}

WRITING DIRECTION
You are writing premium copy for a high-end fashion brand website. The tone is editorial, minimal, and confident, like a fashion magazine. Use short, evocative sentences. Avoid corporate speak, avoid overly enthusiastic exclamation marks. Fashion copy should feel like a magazine, not a billboard.

Hard rules:
- Headlines: use \\n to break into 2–3 short poetic lines (3–6 words per line)
- Subheadlines: 1–2 short sentences, evocative
- Newsletter: editorial, intimate tone — like a letter from the brand
- Avoid: "elevate", "journey", "game-changer", "curated", "bespoke"

OUTPUT
Return ONLY valid JSON, no markdown, no prose, matching this exact shape:

{
  "hero": {
    "headline": "Poetic headline with \\n breaks",
    "subheadline": "1–2 evocative sentences",
    "cta_primary": "Shop the collection",
    "cta_secondary": "View lookbook"
  },
  "drop_banner": {
    "label": "Short label, no emoji",
    "text": "One short line saying the collection is available now",
    "cta": "Shop now →"
  },
  "lookbook": {
    "heading": "Short heading with \\n",
    "subheading": "1–2 evocative sentences"
  },
  "bestsellers": {
    "eyebrow": "Short section eyebrow",
    "heading": "Short evocative heading with \\n"
  },
  "brand_story": {
    "eyebrow": "Our story",
    "heading": "Poetic heading with \\n (3 lines)",
    "body": "2–4 sentences, brand voice",
    "values": [
      { "icon": "sparkle", "title": "Short title", "text": "1 sentence" }
    ]
  },
  "testimonials": {
    "eyebrow": "Short eyebrow",
    "heading": "Short heading for the owner's customer reviews"
  },
  "newsletter": {
    "eyebrow": "Short eyebrow",
    "heading": "Short evocative heading with \\n",
    "subheading": "1–2 sentences, brand voice",
    "note": "Short line, or \\"\\""
  },
  "footer": {
    "tagline": "Keep brand tagline"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- lookbook.heading: a short poetic line. It is never a collection name — the site shows the owner's own collection name itself.
- brand_story.body: retell only what the brand story above says. If it is "Not given.", write 2 sentences from the style direction and target customer only.
- brand_story.values: 0–3 items, each restating something the brief says (style direction, target customer, brand story${input.sustainability_focus ? ', the sustainability focus' : ''}). Write fewer rather than invent one. Return [] when there is nothing to restate.
- bestsellers: do not call the products bestsellers, favourites, sold out, limited or reordered — the brief says nothing about sales.
${NO_REVIEWS_RULE}
- newsletter.heading: use \\n for 2-line break
- newsletter.note: no sending frequency, discount, gift, early access or unsubscribe promise. "" is fine.
- Never state, in any field, a price, currency, discount, sale, shipping, delivery, returns or exchange policy, season code or year (such as "SS25" or "2025"), collection name, number of pieces, stock level, founding year, founder or designer name, city, workshop, factory, material, fabric, certification, production method, stockist, another brand or publication, or an email address — unless the brief above gives it.

${ICON_VOCAB_PROMPT}
Every "icon" field (brand_story.values) MUST be one name from the list above — never an emoji.`
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function mergeIntoContent(input: LookbookInput, ai: any): LookbookContent {
  const mock = LOOKBOOK_MOCK_CONTENT
  const owner = { rating: input.social_proof?.review_rating, count: input.social_proof?.review_count }
  const season = input.collection_season?.trim() || ''
  const collection = input.collection_name?.trim() || ''
  // Reviews are only ever the owner's own. With none, the section is not drawn.
  const testimonials = cleanOwnerReviews(input.social_proof?.reviews).map((r) => ({
    author: r.name,
    rating: starsOf(r.rating),
    text: r.text,
    item: r.detail,
    origin: r.origin,
    when: r.when
  }))

  // Products, prices and categories are the owner's. The AI never supplies a
  // price, a sale price or a badge.
  const products = input.products.map((p) => ({
    name: p.name,
    price: p.price?.trim() || '',
    category: p.category?.trim() || undefined
  }))

  // Six looks, each one of the owner's products. With fewer than six products
  // they repeat, so the grid keeps its shape without an invented product name.
  const looks = products.length
    ? Array.from({ length: 6 }, (_, i) => ({
        title: `إطلالة 0${i + 1}`,
        subtitle: products[i % products.length].name
      }))
    : []

  const values = Array.isArray(ai.brand_story?.values)
    ? ai.brand_story.values
        .slice(0, 3)
        .map((v: any) => ({ icon: str(v?.icon) || 'sparkle', title: str(v?.title), text: str(v?.text) }))
        .filter((v: { title: string; text: string }) => v.title && v.text)
    : []

  const bannerFallback = collection ? `تشكيلة «${collection}» متوفّرة الآن.` : 'التشكيلة متوفّرة الآن في المتجر.'
  const seoFallback = `${input.brand.name} — ${input.brand.category}`
  const seoDescFallback = `${input.brand.name}: ${input.brand.tagline}`

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      category: input.brand.category
    },
    hero: {
      // Season and collection are the owner's facts; the AI does not write them.
      eyebrow: [season, input.brand.category].filter(Boolean).join(' · '),
      headline: ai.hero?.headline || mock.hero.headline,
      subheadline: ai.hero?.subheadline || input.brand.tagline,
      cta_primary: ai.hero?.cta_primary || mock.hero.cta_primary,
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary,
      badge: collection || undefined
    },
    drop_banner: {
      label: ai.drop_banner?.label || mock.drop_banner.label,
      text: unlessRatingClaim(ai.drop_banner?.text || bannerFallback, bannerFallback, owner),
      cta: ai.drop_banner?.cta || mock.drop_banner.cta
    },
    lookbook: {
      eyebrow: season ? `لوك بوك · ${season}` : 'لوك بوك',
      heading: collection || ai.lookbook?.heading || 'التشكيلة.',
      subheading: ai.lookbook?.subheading || '',
      looks
    },
    bestsellers: {
      eyebrow: ai.bestsellers?.eyebrow || 'المتجر',
      heading: ai.bestsellers?.heading || 'قطع التشكيلة.',
      products
    },
    brand_story: {
      eyebrow: ai.brand_story?.eyebrow || mock.brand_story.eyebrow,
      heading: ai.brand_story?.heading || 'من نحن.',
      body: ai.brand_story?.body || input.brand_story || '',
      values
    },
    press: {
      heading: mock.press.heading,
      publications: input.press_features
        ? input.press_features.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        : []
    },
    testimonials: {
      eyebrow: ai.testimonials?.eyebrow || mock.testimonials.eyebrow,
      heading: ai.testimonials?.heading || mock.testimonials.heading,
      average_rating: input.social_proof?.review_rating,
      review_count: countOf(input.social_proof?.review_count),
      items: testimonials
    },
    newsletter: {
      eyebrow: ai.newsletter?.eyebrow || mock.newsletter.eyebrow,
      heading: ai.newsletter?.heading || mock.newsletter.heading,
      subheading: ai.newsletter?.subheading || 'اتركوا بريدكم لتصلكم أخبار التشكيلات الجديدة.',
      placeholder: mock.newsletter.placeholder,
      cta: mock.newsletter.cta,
      note: ai.newsletter?.note || ''
    },
    footer: {
      tagline: ai.footer?.tagline || input.brand.tagline,
      // The year is today's and the brief holds no email, so none is made up.
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`,
      email: ''
    },
    seo: {
      title: ai.seo?.title || seoFallback,
      description: unlessRatingClaim(ai.seo?.description || seoDescFallback, seoDescFallback, owner)
    },
    links: { reviews_url: input.social_proof?.reviews_url || undefined },
    // Only what the owner uploaded. No uploads, no photos: the renderer draws
    // the product and look tiles without one rather than borrow stock.
    images: {
      hero: input.visuals?.hero_image_url || undefined,
      gallery: (input.visuals?.gallery_image_urls || []).filter(Boolean)
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
      const off = aiUnavailable()
      if (off) return off
      return NextResponse.json({ content: mergeIntoContent(input, {}) })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.72,
        max_tokens: AI_MAX_TOKENS,
        messages: [
          { role: 'system', content: 'You are an expert fashion copywriter. Output only valid JSON.\n\n' + ARABIC_OUTPUT_DIRECTIVE },
          { role: 'user', content: buildPrompt(input) }
        ]
      }),
      TIMEOUT_MS,
      'openai_lookbook'
    )

    await logAiUsage({ operation: 'generate-lookbook', userId: await getUserIdSafe(), model: AI_MODEL }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      return aiFailed('generate-lookbook', raw.slice(0, 300))
    }

    return NextResponse.json({ content: mergeIntoContent(input, ai) })
  } catch (err: any) {
    console.error('[generate-lookbook]', err)
    return aiFailed('generate-lookbook', err)
  }
}
