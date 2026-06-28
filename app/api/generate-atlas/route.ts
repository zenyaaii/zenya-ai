import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { atlasInputSchema, type AtlasInput } from '@/utils/atlas/input'
import type { AtlasContent } from '@/utils/atlas/types'
import { ATLAS_MOCK_CONTENT } from '@/utils/atlas/mock-content'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'

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
- User count: ${input.social_proof?.user_count || '1,000+ teams'}
- Rating: ${input.social_proof?.review_rating || 4.9}/5
- Review count: ${input.social_proof?.review_count || '500+ reviews'}
- Notable customers: ${input.social_proof?.notable_customers || 'Various tech companies'}

WRITING DIRECTION
You are writing premium marketing copy for a modern SaaS product landing page. The tone is confident, clear, and slightly technical — like Linear, Vercel, or Stripe. Speak to technical decision-makers and product teams who care about quality, speed, and ROI.

Hard rules:
- Headlines use \\n to break into 2–3 short punchy lines (4–8 words each)
- Subheadlines: 2–3 sentences, concrete and specific — no fluff
- Feature descriptions: 25–40 words, benefits-focused, avoid generic buzzwords
- Testimonials: 40–60 words, specific metrics or outcomes, first-person voice
- Pricing: create 3 tiers (Starter/free, Pro/paid, Enterprise/custom) with 6–8 features each
- Integrations: list 12 realistic integrations with appropriate emoji icons and categories
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
    "social_proof": "Short social proof (e.g. 'Trusted by 2,000+ teams · No credit card')",
    "badge": "Optional short badge text"
  },
  "trust_bar": {
    "label": "Trusted by teams at",
    "logos": ["CompanyA", "CompanyB", "CompanyC", "CompanyD", "CompanyE", "CompanyF", "CompanyG", "CompanyH"]
  },
  "features": {
    "eyebrow": "Short section eyebrow",
    "heading": "Section heading with \\n",
    "subheading": "1–2 sentence description",
    "items": [
      { "icon": "⚡", "title": "Feature title", "description": "25–40 word benefit description", "badge": "optional" }
    ]
  },
  "how_it_works": {
    "eyebrow": "Short eyebrow",
    "heading": "Heading with \\n",
    "subheading": "1 sentence",
    "steps": [
      { "step": "01", "icon": "🔌", "title": "Step title", "description": "1–2 sentences" }
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
      { "name": "Slack", "icon": "💬", "category": "Comms" }
    ]
  },
  "testimonials": {
    "eyebrow": "Short eyebrow",
    "heading": "Section heading",
    "items": [
      {
        "quote": "40–60 word specific testimonial",
        "author": "First name + initial",
        "role": "Role",
        "company": "Company name",
        "rating": 5,
        "avatar_letter": "S"
      }
    ]
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
    "tagline": "Short brand tagline",
    "legal": "© 2025 ${input.brand.name}. جميع الحقوق محفوظة.",
    "email": "hello@${input.brand.name.toLowerCase().replace(/\\s+/g, '')}.io"
  },
  "seo": {
    "title": "60 chars max",
    "description": "155 chars max"
  }
}

Requirements:
- trust_bar.logos: exactly 8 realistic tech company names
- features.items: exactly 6 items (use provided features + expand/improve)
- how_it_works.steps: exactly 3 steps
- pricing.tiers: exactly 3 tiers — Starter (free), Pro (paid), Enterprise (custom)
- pricing tiers: Starter has 6 features, Pro has 8 features, Enterprise has 8 features
- integrations.items: exactly 12 items with relevant emoji icons
- testimonials.items: exactly 3 testimonials, each with a different avatar_letter
- security.items: exactly 6 items
- faq.items: exactly 6 questions`
}

function mergeIntoContent(input: AtlasInput, ai: any): AtlasContent {
  const mock = ATLAS_MOCK_CONTENT

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
      social_proof: ai.hero?.social_proof || mock.hero.social_proof,
      badge: ai.hero?.badge
    },
    trust_bar: {
      label: ai.trust_bar?.label || mock.trust_bar.label,
      logos: Array.isArray(ai.trust_bar?.logos) ? ai.trust_bar.logos : mock.trust_bar.logos
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
      items: Array.isArray(ai.testimonials?.items) ? ai.testimonials.items : mock.testimonials.items
    },
    security: {
      heading: ai.security?.heading || mock.security.heading,
      items: Array.isArray(ai.security?.items) ? ai.security.items : mock.security.items
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
    const parseResult = atlasInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 })
    }
    const input = parseResult.data

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Return mock content in dev if no API key
      return NextResponse.json({ content: mergeIntoContent(input, {}) })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.75,
        max_tokens: 4000,
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

    await logAiUsage({ operation: 'generate-atlas', userId: await getUserIdSafe(), model: 'gpt-4o-mini' }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      console.error('[generate-atlas] JSON parse failed, using mock fallback', raw.slice(0, 300))
    }

    const content = mergeIntoContent(input, ai)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[generate-atlas]', err)
    return NextResponse.json(
      { error: err?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
