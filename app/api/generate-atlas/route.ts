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

  const integrationsText =
    (input.integrations || []).map((s) => s.trim()).filter(Boolean).join(', ') ||
    'None given. Do not name any integration, tool or platform.'

  const plans = ownerPlans(input)
  const plansText = plans.length
    ? plans.map((p) => `- ${p.plan}: ${p.price}`).join('\n')
    : '- None given. Do not describe any plan, tier or price.'

  return `SAAS PRODUCT BRIEF
App name: ${input.brand.name}
Tagline: ${input.brand.tagline}
Category: ${input.brand.category}
Target audience: ${input.target_audience}
Problem solved: ${input.problem_solved}

Key features:
${featuresText}

Integrations: ${integrationsText}

Plans the owner offers (the prices are set by the owner and are not yours to write):
${plansText}

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
- Pricing: one tier per plan listed above, in that order, and none when no plan is listed. Tier features restate the key features above; never a limit, quota, seat count, trial length or support level
- Integrations: only the integrations the brief names, each with an icon name (from the ICON NAMES list) and a one-word category
- FAQ: 0–6 questions a buyer would ask. Answers use only what the brief says; where it says nothing, the answer invites the reader to contact the team
- Never invent certifications or compliance claims unless based on the brief

OUTPUT
Return ONLY valid JSON, no markdown, no prose, matching this exact shape:

{
  "hero": {
    "eyebrow": "Short line naming the product category (under 60 chars). No numbers unless the brief gives them.",
    "headline": "Punchy headline with \\n breaks",
    "subheadline": "2–3 sentence benefit-focused description",
    "cta_primary": "Primary CTA label",
    "cta_secondary": "Secondary CTA label",
    "social_proof": "Short line under the buttons (e.g. 'No credit card needed'). Use a number only if the brief gives it.",
    "badge": "Optional short badge text, restating a fact the brief gives"
  },
  "trust_bar": {
    "label": "Short label above the owner's customer names"
  },
  "features": {
    "eyebrow": "Short section eyebrow",
    "heading": "Section heading with \\n",
    "subheading": "1–2 sentence description",
    "items": [
      { "icon": "bolt", "title": "Feature title", "description": "25–40 word benefit description" }
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
        "plan": "free | pro | enterprise, as listed above",
        "name": "Tier name",
        "description": "Short tier description",
        "cta": "CTA label",
        "features": ["Feature from the brief", "Feature from the brief", "Feature from the brief"]
      }
    ]
  },
  "integrations": {
    "heading": "Heading with \\n",
    "subheading": "1 sentence",
    "items": [
      { "name": "An integration the brief names", "icon": "chat", "category": "One word" }
    ]
  },
  "testimonials": {
    "eyebrow": "Short eyebrow for the owner's customer reviews",
    "heading": "Section heading"
  },
  "security": {
    "heading": "1 sentence",
    "items": ["A security or privacy fact the brief states"]
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
- features.items: one item per key feature above, in the same order, reworded and expanded in benefit terms. Do not add features the brief does not list
- how_it_works.steps: exactly 3 steps describing how someone starts using the product. No durations, integrations or numbers the brief does not give
- pricing.tiers: one per listed plan (0–3), 3–6 features each, only restating the key features above. Do not write prices or periods
- integrations.items: 0–12 items, only the integrations the brief names. [] when it names none
- security.items: 0–6 items, only restating security or privacy facts the brief gives. [] when it gives none
- faq.items: 0–6 questions, answers only restating facts the brief gives
- Never state a number of users, teams or customers, a price, discount, free trial or its length, cancellation or refund policy, uptime or SLA, certification or compliance standard (SOC 2, ISO, GDPR, HIPAA…), integration, customer or partner name, award, founding year, team member, funding, or any statistic or percentage that the brief does not give. This applies to every field, including hero.eyebrow, hero.badge, hero.social_proof, cta.note, cta.subheading and seo.description.
${NO_REVIEWS_RULE}

${ICON_VOCAB_PROMPT}
Every "icon" field above (features, how_it_works steps, integrations) MUST be one name from the list — never an emoji.`
}

type PlanKey = 'free' | 'pro' | 'enterprise'

// The plans are the owner's. Their prices come from the wizard, never the AI.
function ownerPlans(input: AtlasInput): { plan: PlanKey; price: string }[] {
  const p = input.pricing
  if (!p) return []
  const out: { plan: PlanKey; price: string }[] = []
  if (p.free_tier) out.push({ plan: 'free', price: 'مجانًا' })
  const pro = (p.pro_price || '').trim()
  if (pro) out.push({ plan: 'pro', price: pro })
  if (p.enterprise) out.push({ plan: 'enterprise', price: 'حسب الطلب' })
  return out
}

const PLAN_DEFAULTS: Record<PlanKey, { name: string; cta: string }> = {
  free: { name: 'المجانية', cta: 'ابدأ مجانًا' },
  pro: { name: 'الاحترافية', cta: 'ابدأ الآن' },
  enterprise: { name: 'المؤسسات', cta: 'تواصل معنا' }
}

const FEATURE_ICONS = ['bolt', 'link', 'settings', 'analytics', 'boxes', 'rocket']

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [])

function mergeIntoContent(input: AtlasInput, aiRaw: any): AtlasContent {
  const ai = aiRaw && typeof aiRaw === 'object' ? aiRaw : {}
  const mock = ATLAS_MOCK_CONTENT
  const owner = { rating: input.social_proof?.review_rating, count: input.social_proof?.review_count }
  const name = input.brand.name
  const hasFree = !!input.pricing?.free_tier
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

  // One card per feature the owner listed. The AI may reword them, not add to them.
  const aiFeatures: any[] = Array.isArray(ai.features?.items) ? ai.features.items : []
  const features = input.features.map((f, i) => {
    const a = aiFeatures[i] || {}
    return {
      icon: str(a.icon) || FEATURE_ICONS[i % FEATURE_ICONS.length],
      title: str(a.title) || f.title,
      description: str(a.description) || f.description || ''
    }
  })

  // Neutral when the AI leaves them out: nothing here is a fact about a product.
  const neutralSteps = [
    { step: '01', icon: 'connect', title: 'أنشئ حسابك', description: `سجّل في ${name} وجهّز مساحة العمل الخاصة بك.` },
    { step: '02', icon: 'settings', title: 'اضبطه على طريقتك', description: 'خصّص الإعدادات بما يناسب طريقة عملك.' },
    { step: '03', icon: 'rocket', title: 'ابدأ العمل', description: `استخدم ${name} في عملك اليومي.` }
  ]
  const aiSteps: any[] = Array.isArray(ai.how_it_works?.steps) ? ai.how_it_works.steps : []
  const steps =
    aiSteps.length >= 3
      ? aiSteps.slice(0, 3).map((s, i) => ({
          step: `0${i + 1}`,
          icon: str(s?.icon) || neutralSteps[i].icon,
          title: str(s?.title) || neutralSteps[i].title,
          description: str(s?.description) || neutralSteps[i].description
        }))
      : neutralSteps

  // Only the plans the owner offers, at the owner's prices. None, no pricing section.
  const aiTiers: any[] = Array.isArray(ai.pricing?.tiers) ? ai.pricing.tiers : []
  const plans = ownerPlans(input)
  const tiers = plans.map((p, i) => {
    const a = aiTiers.find((t) => str(t?.plan).toLowerCase() === p.plan) || aiTiers[i] || {}
    return {
      name: str(a.name) || PLAN_DEFAULTS[p.plan].name,
      price: p.price,
      period: '',
      description: str(a.description),
      cta: str(a.cta) || PLAN_DEFAULTS[p.plan].cta,
      highlighted: p.plan === 'pro' && plans.length > 1,
      features: dropRatingClaims(strList(a.features), (t) => t, owner).slice(0, 8)
    }
  })

  // Only the integrations the owner named. The AI supplies an icon and a category.
  const aiIntegrations: any[] = Array.isArray(ai.integrations?.items) ? ai.integrations.items : []
  const integrations = (input.integrations || [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((n, i) => {
      const a =
        aiIntegrations.find((x) => str(x?.name).toLowerCase() === n.toLowerCase()) || aiIntegrations[i] || {}
      return { name: n, icon: str(a.icon) || 'plugins', category: str(a.category) }
    })

  const faqItems = (Array.isArray(ai.faq?.items) ? ai.faq.items : [])
    .map((f: any) => ({ q: str(f?.q), a: str(f?.a) }))
    .filter((f: { q: string; a: string }) => f.q && f.a)
    .slice(0, 6)

  const seoFallback = input.problem_solved.slice(0, 155)

  return {
    brand: {
      name,
      tagline: input.brand.tagline,
      category: input.brand.category
    },
    hero: {
      eyebrow: unlessRatingClaim(ai.hero?.eyebrow || input.brand.category, input.brand.category, owner),
      headline: ai.hero?.headline || input.brand.tagline,
      subheadline: ai.hero?.subheadline || input.problem_solved,
      cta_primary: ai.hero?.cta_primary || (hasFree ? 'ابدأ مجانًا' : 'ابدأ الآن'),
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary,
      social_proof: unlessRatingClaim(ai.hero?.social_proof || '', '', owner),
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
      subheading: ai.features?.subheading || input.problem_solved,
      items: features
    },
    how_it_works: {
      eyebrow: ai.how_it_works?.eyebrow || 'كيف يعمل',
      heading: ai.how_it_works?.heading || mock.how_it_works.heading,
      subheading: ai.how_it_works?.subheading || 'ثلاث خطوات للبدء.',
      steps
    },
    pricing: {
      eyebrow: ai.pricing?.eyebrow || 'الأسعار',
      heading: ai.pricing?.heading || 'اختر الباقة\nالتي تناسبك.',
      subheading: ai.pricing?.subheading || 'اختر الباقة المناسبة لك.',
      tiers
    },
    integrations: {
      heading: ai.integrations?.heading || mock.integrations.heading,
      subheading: ai.integrations?.subheading || `الأدوات التي يتكامل معها ${name}.`,
      items: integrations
    },
    testimonials: {
      eyebrow: ai.testimonials?.eyebrow || 'آراء العملاء',
      heading: ai.testimonials?.heading || mock.testimonials.heading,
      average_rating: input.social_proof?.review_rating,
      review_count: countOf(input.social_proof?.review_count),
      items: testimonials
    },
    security: {
      heading: ai.security?.heading || 'الأمان والخصوصية',
      // No fallback list: a certification is a fact only the owner can state.
      items: dropRatingClaims(strList(ai.security?.items), (t) => t, owner).slice(0, 6)
    },
    cta: {
      eyebrow: ai.cta?.eyebrow || mock.cta.eyebrow,
      heading: ai.cta?.heading || mock.cta.heading,
      subheading: ai.cta?.subheading || input.brand.tagline,
      cta_primary: ai.cta?.cta_primary || (hasFree ? 'ابدأ مجانًا' : 'ابدأ الآن'),
      cta_secondary: ai.cta?.cta_secondary || mock.cta.cta_secondary,
      note: unlessRatingClaim(ai.cta?.note || '', '', owner)
    },
    faq: {
      heading: ai.faq?.heading || mock.faq.heading,
      items: faqItems
    },
    footer: {
      tagline: ai.footer?.tagline || input.brand.tagline,
      legal: `© ${new Date().getFullYear()} ${name}. جميع الحقوق محفوظة.`,
      // The wizard asks for no email, so none is made up; the owner adds it in the editor.
      email: ''
    },
    seo: {
      title: ai.seo?.title || `${name} — ${input.brand.tagline}`,
      description: unlessRatingClaim(ai.seo?.description || seoFallback, seoFallback, owner)
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
