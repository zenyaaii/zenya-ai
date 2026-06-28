import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { studioInputSchema, type StudioInput } from '@/utils/studio/input'
import type { StudioContent } from '@/utils/studio/types'
import { STUDIO_MOCK_CONTENT } from '@/utils/studio/mock-content'

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

function buildPrompt(input: StudioInput): string {
  const valuesText = input.values
    .map((v) => `- ${v.title}${v.description ? `: ${v.description}` : ''}`)
    .join('\n')

  const milestonesText = (input.milestones || [])
    .map((m) => `- ${m.year}: ${m.event}`)
    .join('\n') || '- No milestones provided'

  const processSteps = input.process?.steps?.join(', ') || 'Source, Make, Inspect, Ship'
  const pressPublications = input.press_features || 'The New York Times, Wallpaper*, Monocle'

  return `BRAND STORY BRIEF
Brand name: ${input.brand.name}
Tagline: ${input.brand.tagline}
Category: ${input.brand.category}
Founded: ${input.brand.founded || 'Recently'}
Mission: ${input.mission}
Founder story: ${input.founder_story || 'Not provided — invent a compelling origin story that fits the brand category and mission.'}
Team size: ${input.team_size || 'A small focused team'}

Core values:
${valuesText}

Process description: ${input.process?.description || 'Handcrafted with care and attention to detail.'}
Process steps: ${processSteps}

Key milestones:
${milestonesText}

Press features: ${pressPublications}

Social proof:
- Customer count: ${input.social_proof?.customer_count || '10,000+ customers'}
- Repeat rate: ${input.social_proof?.repeat_rate || '75%'}
- Rating: ${input.social_proof?.avg_rating || '4.9★'}

WRITING DIRECTION
You are writing the brand story page for a premium, craft-focused brand. The tone is literary, sincere, and confident — like how ARKET, Kinfolk, or Patagonia speak. No marketing speak. Direct, human, and specific.

Hard rules:
- hero.manifesto: 3–6 words, bold statement or provocative phrase (uses \\n if 2 lines)
- hero.subheadline: 2-3 sentences, lyrical and specific
- mission.statement: 1 sentence, direct and powerful (the brand's north star)
- mission.elaboration: 3-4 sentence paragraph, editorial voice
- founder_letter.paragraphs: exactly 4 paragraphs, each 2-4 sentences, genuine and specific
- timeline events: each has a title (2-4 words) and description (2-3 sentences)
- values: expand on provided values — each body should be 40-55 words, substantive not fluffy
- process steps: each description is 1-2 specific sentences
- press quotes: make them feel real — specific, credible, not hyperbolic
- community.subheading: reference the repeat customer rate specifically

OUTPUT
Return ONLY valid JSON, no markdown, no prose:

{
  "brand": {
    "name": "${input.brand.name}",
    "tagline": "${input.brand.tagline}",
    "category": "${input.brand.category}",
    "founded": "${input.brand.founded || '2020'}"
  },
  "hero": {
    "eyebrow": "Short location/founding line (e.g. 'Est. 2019 · London, UK')",
    "manifesto": "3-6 word bold statement",
    "subheadline": "2-3 sentence lyrical description",
    "cta_primary": "CTA label",
    "cta_secondary": "Secondary CTA"
  },
  "mission": {
    "statement": "One powerful sentence — the brand's north star.",
    "elaboration": "3-4 sentence editorial paragraph expanding on the mission."
  },
  "founder_letter": {
    "eyebrow": "A letter from the founder",
    "heading": "Hook question or statement that opens the letter.",
    "paragraphs": [
      "First paragraph — the origin story. 2-3 sentences.",
      "Second paragraph — the discovery or turning point. 2-3 sentences.",
      "Third paragraph — what the brand has grown into. 2-3 sentences.",
      "Fourth paragraph — the commitment going forward. 2-3 sentences."
    ],
    "signature": "Founder name(s)",
    "signature_role": "Role at ${input.brand.name}"
  },
  "timeline": {
    "eyebrow": "Our history",
    "heading": "Timeline heading (e.g. 'Seven years of slow building.')",
    "events": [
      { "year": "YYYY", "title": "Event title", "description": "2-3 sentence description." }
    ]
  },
  "values": {
    "eyebrow": "What we stand for",
    "heading": "Values heading",
    "subheading": "1 sentence that sets up the values section",
    "items": [
      { "number": "01", "title": "Value title", "body": "40-55 word description of this value." }
    ]
  },
  "process": {
    "eyebrow": "How it's made",
    "heading": "Process heading (e.g. 'Slow on purpose.')",
    "body": "1-2 sentences on the philosophy behind the process.",
    "steps": [
      { "title": "Step name", "description": "1-2 specific sentences about this step." }
    ]
  },
  "team": {
    "eyebrow": "The people behind it",
    "heading": "Team heading with \\n",
    "subheading": "1 sentence about team size and philosophy",
    "members": [
      { "name": "Full Name", "role": "Role title", "bio": "2 sentences. Specific, human, not corporate.", "avatar_letter": "A" }
    ]
  },
  "press": {
    "heading": "What they've said",
    "items": [
      { "publication": "Publication name", "quote": "30-45 word credible press quote", "year": "202X" }
    ]
  },
  "community": {
    "eyebrow": "The people who live with our work",
    "heading": "Community heading with \\n",
    "subheading": "1-2 sentences referencing the repeat customer rate specifically",
    "stats": [
      { "value": "XXX+", "label": "Short stat label" }
    ]
  },
  "cta": {
    "eyebrow": "Join us",
    "heading": "CTA heading with \\n (2-5 words per line)",
    "subheading": "2-3 sentence invitation to shop",
    "cta_primary": "Primary CTA",
    "cta_secondary": "Secondary CTA"
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
- timeline.events: use provided milestones (${(input.milestones || []).length} items); if none, invent 4-5 plausible ones for the brand category
- values.items: use provided values (${input.values.length} items), numbered 01/02/03 etc.
- process.steps: use provided steps or invent 4 logical steps for the brand category
- team.members: invent 3 realistic team members with names appropriate for the brand's origin region
- press.items: use provided publications (${pressPublications.split(',').length} sources), write credible short quotes
- community.stats: exactly 4 stats (objects/customers, repeat rate, rating, catalog size or similar)
- All content should feel like it belongs to this specific brand — not a generic template`
}

function mergeIntoContent(input: StudioInput, ai: any): StudioContent {
  const mock = STUDIO_MOCK_CONTENT

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      category: input.brand.category,
      founded: input.brand.founded || ai.brand?.founded || mock.brand.founded
    },
    hero: {
      eyebrow: ai.hero?.eyebrow || mock.hero.eyebrow,
      manifesto: ai.hero?.manifesto || mock.hero.manifesto,
      subheadline: ai.hero?.subheadline || mock.hero.subheadline,
      cta_primary: ai.hero?.cta_primary || mock.hero.cta_primary,
      cta_secondary: ai.hero?.cta_secondary || mock.hero.cta_secondary
    },
    mission: {
      statement: ai.mission?.statement || mock.mission.statement,
      elaboration: ai.mission?.elaboration || mock.mission.elaboration
    },
    founder_letter: {
      eyebrow: ai.founder_letter?.eyebrow || mock.founder_letter.eyebrow,
      heading: ai.founder_letter?.heading || mock.founder_letter.heading,
      paragraphs: Array.isArray(ai.founder_letter?.paragraphs) ? ai.founder_letter.paragraphs : mock.founder_letter.paragraphs,
      signature: ai.founder_letter?.signature || mock.founder_letter.signature,
      signature_role: ai.founder_letter?.signature_role || mock.founder_letter.signature_role
    },
    timeline: {
      eyebrow: ai.timeline?.eyebrow || mock.timeline.eyebrow,
      heading: ai.timeline?.heading || mock.timeline.heading,
      events: Array.isArray(ai.timeline?.events) ? ai.timeline.events : mock.timeline.events
    },
    values: {
      eyebrow: ai.values?.eyebrow || mock.values.eyebrow,
      heading: ai.values?.heading || mock.values.heading,
      subheading: ai.values?.subheading || mock.values.subheading,
      items: Array.isArray(ai.values?.items) ? ai.values.items : mock.values.items
    },
    process: {
      eyebrow: ai.process?.eyebrow || mock.process.eyebrow,
      heading: ai.process?.heading || mock.process.heading,
      body: ai.process?.body || mock.process.body,
      steps: Array.isArray(ai.process?.steps) ? ai.process.steps : mock.process.steps
    },
    team: {
      eyebrow: ai.team?.eyebrow || mock.team.eyebrow,
      heading: ai.team?.heading || mock.team.heading,
      subheading: ai.team?.subheading || mock.team.subheading,
      members: Array.isArray(ai.team?.members) ? ai.team.members : mock.team.members
    },
    press: {
      heading: ai.press?.heading || mock.press.heading,
      items: Array.isArray(ai.press?.items) ? ai.press.items : mock.press.items
    },
    community: {
      eyebrow: ai.community?.eyebrow || mock.community.eyebrow,
      heading: ai.community?.heading || mock.community.heading,
      subheading: ai.community?.subheading || mock.community.subheading,
      stats: Array.isArray(ai.community?.stats) ? ai.community.stats : mock.community.stats
    },
    cta: {
      eyebrow: ai.cta?.eyebrow || mock.cta.eyebrow,
      heading: ai.cta?.heading || mock.cta.heading,
      subheading: ai.cta?.subheading || mock.cta.subheading,
      cta_primary: ai.cta?.cta_primary || mock.cta.cta_primary,
      cta_secondary: ai.cta?.cta_secondary || mock.cta.cta_secondary
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
    const parseResult = studioInputSchema.safeParse(body)
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
        temperature: 0.82,
        max_tokens: 4500,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert brand storyteller writing for premium, craft-focused businesses. Your copy is literary, sincere, and specific — never generic. Output only valid JSON.\n\n' +
              ARABIC_OUTPUT_DIRECTIVE
          },
          {
            role: 'user',
            content: buildPrompt(input)
          }
        ]
      }),
      TIMEOUT_MS,
      'openai_studio'
    )

    await logAiUsage({ operation: 'generate-studio', userId: await getUserIdSafe(), model: 'gpt-4o-mini' }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      console.error('[generate-studio] JSON parse failed, using mock fallback', raw.slice(0, 300))
    }

    const content = mergeIntoContent(input, ai)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[generate-studio]', err)
    return NextResponse.json(
      { error: err?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
