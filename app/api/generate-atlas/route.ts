import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { ICON_VOCAB_PROMPT } from '@/components/icons/vocab'
import { atlasInputSchema, type AtlasInput } from '@/utils/atlas/input'
import type { AtlasContent } from '@/utils/atlas/types'
import { ATLAS_MOCK_CONTENT } from '@/utils/atlas/mock-content'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, dropRatingClaims, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'

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

function buildPrompt(input: AtlasInput): string {
  const featuresText = input.features
    .map((f) => `- ${f.title}${f.description ? `: ${f.description}` : ''}`)
    .join('\n')

  const integrationsText = (input.integrations || []).join(', ') || 'Slack, GitHub, Notion'

  return `SAAS PRODUCT BRIEF
App name: ${input.brand.name}
Tagline: ${input.brand.tagline}
Category: ${input.brand.category}
Target audience: ${input.target_audience}
Problem solved: ${input.problem_solved}

Key features:
${featuresText}

Integrations: ${integrationsText}

Pricing:
- Free tier: ${input.pricing?.free_tier ? 'Yes' : 'No'}
- Pro price: ${input.pricing?.pro_price || '$49/month'}
- Enterprise: ${input.pricing?.enterprise ? 'Yes' : 'No'}

Social proof:
- User count: ${input.social_proof?.user_count || 'Not given. Do not state any number of users, teams or customers.'}
- ${ratingBrief(input.social_proof?.review_rating, input.social_proof?.review_count)}
- Notable customers: ${input.social_proof?.notable_customers || 'None given. Do not name any customer or company.'}

WRITING DIRECTION
You are writing premium marketing copy for a modern SaaS product landing page. The tone is confident, clear, and slightly technical — like Linear, Vercel, or Stripe. Speak to technical decision-makers and product teams who care about quality, speed, and ROI.

Hard rules:
- Headlines use \\n to break into 2–3 short punchy lines (4–8 words each)
- Subheadlines: 2–3 sentences, concrete and specific — no fluff
- Feature descriptions: 25–40 words, benefits-focused, avoid generic buzzwords
- Pricing: create 3 tiers (Starter/free, Pro/paid, Enterprise/custom) with 6–8 features each
- Integrations: list 12 realistic integrations with an appropriate icon name (from the ICON NAMES list) and category
- FAQ: exactly 6 questions covering setup, migration, AI features, trial end, discounts, security
- Never invent certifications or compliance claims unless based on the brief

OUTPUT
Return ONLY valid JSON, no markdown, no prose, matching this exact shape:

{
  "hero": {
    "eyebrow": "Short trust/social proof line (under 60 chars)",
    "headline": "Punchy headline with \\n breaks",
    "subheadline": "2–3 sentence benefit-focused description",
    "cta_primary": "Primary CTA label",
    "cta_secondary": "Secondary CTA label",
    "social_proof": "Short line under the buttons (e.g. 'No credit card needed'). Use a number only if the brief gives it.",
    "badge": "Optional short badge text"
  },
  "trust_bar": {
    "label": "Short label above the owner's customer names"
  },
  "features": {
    "eyebrow": "Short section eyebrow",
    "heading": "Section heading with \\n",
    "subheading": "1–2 sentence description",
    "items": [
      { "icon": "bolt", "title": "Feature title", "description": "25–40 word benefit description", "badge": "optional" }
    ]
  },
  "how_it_works": {
    "eyebrow": "Short eyebrow",
    "heading": "Heading with \\n",
    "subheading": "1 sentence",
    "steps": [
      { "step": "01", "icon": "connect", "title": "Step title", "description": "1–2 sentences" }
    ]
  },
  "pricing": {
    "eyebrow": "Short eyebrow",
    "heading": "Heading with \\n",
    "subheading": "1 sentence",
    "tiers": [
      {
        "name": "Starter",
        "price": "$0",
        "period": "forever",
        "description": "Short tier description",
        "cta": "CTA label",
        "highlighted": false,
        "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"]
      }
    ]
  },
  "integrations": {
    "heading": "Heading with \\n",
    "subheading": "1 sentence",
    "items": [
      { "name": "Slack", "icon": "chat", "category": "Comms" }
    ]
  },
  "testimonials": {
    "eyebrow": "Short eyebrow for the owner's customer reviews",
    "heading": "Section heading"
  },
  "security": {
    "heading": "1 sentence",
    "items": ["SOC 2 Type II certified", "GDPR compliant", "SSO / SAML", "99.99% uptime SLA", "End-to-end encryption", "Role-based access control"]
  },
  "cta": {
    "eyebrow": "Short eyebrow",
    "heading": "Heading with \\n",
    "subheading": "2–3 sentence benefit description",
    "cta_primary": "Primary CTA",
    "cta_secondary": "Secondary CTA",
    "note": "Short reassurance line"
  },
  "faq": {
    "heading": "Questions, answered.",
    "items": [
      { "q": "Question?", "a": "1–2 sentence answer." }
    ]
  },
  "footer": {
    "tagline": "Short brand tagline"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- Never name a customer, company, user count or award the brief does not give
- features.items: exactly 6 items (use provided features + expand/improve)
- how_it_works.steps: exactly 3 steps
- pricing.tiers: exactly 3 tiers — Starter (free), Pro (paid), Enterprise (custom)
- pricing tiers: Starter has 6 features, Pro has 8 features, Enterprise has 8 features
- integrations.items: exactly 12 items with a relevant icon name from the ICON NAMES list
- security.items: exactly 6 items
- faq.items: exactly 6 questions
${NO_REVIEWS_RULE}

${ICON_VOCAB_PROMPT}
Every "icon" field above (features, how_it_works steps, integrations) MUST be one name from the list — never an emoji.`
}

function mergeIntoContent(input: AtlasInput, ai: any): AtlasContent {
  const mock = ATLAS_MOCK_CONTENT
  const owner = { rating: input.social_proof?.review_rating, count: input.social_proof?.review_count }
  // Reviews are only ever the owner's own. With none, the section is not drawn.
  const testimonials = cleanOwnerReviews(input.social_proof?.reviews).map((r) => ({
    quote: r.text,
    author: r.name,
    role: r.detail,
    rating: starsOf(r.rating),
    avatar_letter: r.name.charAt(0),
    origin: r.origin,
    when: r.when
  }))

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      category: input.brand.category
    },
    hero: {
      eyebrow: unlessRatingClaim(ai.hero?.eyebrow || mock.hero.eyebrow, mock.hero.eyebrow, owner),
      headline: ai.hero?.headline || mock.hero.headline,
      subheadline: ai.hero?.subheadline || mock.hero.subheadline,
      cta_primary: ai.hero?.cta_primary || mock.hero.cta_primary,
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary,
      social_proof: unlessRatingClaim(ai.hero?.social_proof || mock.hero.social_proof, mock.hero.social_proof, owner),
      badge: ai.hero?.badge ? unlessRatingClaim(ai.hero.badge, '', owner) || undefined : undefined
    },
    trust_bar: {
      label: ai.trust_bar?.label || mock.trust_bar.label,
      // Only the customers the owner named. None given, the bar is not drawn.
      logos: (input.social_proof?.notable_customers || '')
        .split(/[,\n،]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
    },
    features: {
      eyebrow: ai.features?.eyebrow || mock.features.eyebrow,
      heading: ai.features?.heading || mock.features.heading,
      subheading: ai.features?.subheading || mock.features.subheading,
      items: Array.isArray(ai.features?.items) ? ai.features.items : mock.features.items
    },
    how_it_works: {
      eyebrow: ai.how_it_works?.eyebrow || mock.how_it_works.eyebrow,
      heading: ai.how_it_works?.heading || mock.how_it_works.heading,
      subheading: ai.how_it_works?.subheading || mock.how_it_works.subheading,
      steps: Array.isArray(ai.how_it_works?.steps) ? ai.how_it_works.steps : mock.how_it_works.steps
    },
    pricing: {
      eyebrow: ai.pricing?.eyebrow || mock.pricing.eyebrow,
      heading: ai.pricing?.heading || mock.pricing.heading,
      subheading: ai.pricing?.subheading || mock.pricing.subheading,
      tiers: Array.isArray(ai.pricing?.tiers) ? ai.pricing.tiers : mock.pricing.tiers
    },
    integrations: {
      heading: ai.integrations?.heading || mock.integrations.heading,
      subheading: ai.integrations?.subheading || mock.integrations.subheading,
      items: Array.isArray(ai.integrations?.items) ? ai.integrations.items : mock.integrations.items
    },
    testimonials: {
      eyebrow: ai.testimonials?.eyebrow || mock.testimonials.eyebrow,
      heading: ai.testimonials?.heading || mock.testimonials.heading,
      average_rating: input.social_proof?.review_rating,
      review_count: countOf(input.social_proof?.review_count),
      items: testimonials
    },
    security: {
      heading: ai.security?.heading || mock.security.heading,
      items: dropRatingClaims(Array.isArray(ai.security?.items) ? ai.security.items : mock.security.items, (t: any) => String(t), owner)
    },
    cta: {
      eyebrow: ai.cta?.eyebrow || mock.cta.eyebrow,
      heading: ai.cta?.heading || mock.cta.heading,
      subheading: ai.cta?.subheading || mock.cta.subheading,
      cta_primary: ai.cta?.cta_primary || mock.cta.cta_primary,
      cta_secondary: ai.cta?.cta_secondary || mock.cta.cta_secondary,
      note: ai.cta?.note || mock.cta.note
    },
    faq: {
      heading: ai.faq?.heading || mock.faq.heading,
      items: Array.isArray(ai.faq?.items) ? ai.faq.items : mock.faq.items
    },
    footer: {
      tagline: ai.footer?.tagline || mock.footer.tagline,
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`,
      // The wizard asks for no email, so none is made up; the owner adds it in the editor.
      email: ''
    },
    seo: {
      title: ai.seo?.title || mock.seo.title,
      description: unlessRatingClaim(ai.seo?.description || mock.seo.description, mock.seo.description, owner)
    },
    links: { reviews_url: input.social_proof?.reviews_url || undefined }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parseResult = atlasInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 })
    }
    const input = parseResult.data

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const off = aiUnavailable()
      if (off) return off
      // Return mock content in dev if no API key
      return NextResponse.json({ content: mergeIntoContent(input, {}) })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.75,
        max_tokens: AI_MAX_TOKENS,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert SaaS copywriter. Output only valid JSON.\n\n' +
              ARABIC_OUTPUT_DIRECTIVE
          },
          {
            role: 'user',
            content: buildPrompt(input)
          }
        ]
      }),
      TIMEOUT_MS,
      'openai_atlas'
    )

    await logAiUsage({ operation: 'generate-atlas', userId: await getUserIdSafe(), model: AI_MODEL }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      return aiFailed('generate-atlas', raw.slice(0, 300))
    }

    const content = mergeIntoContent(input, ai)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[generate-atlas]', err)
    return aiFailed('generate-atlas', err)
  }
}
