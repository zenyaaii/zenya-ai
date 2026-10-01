import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
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
    .join('\n') || '- None given'

  const processSteps = input.process?.steps?.join(', ') || 'None given'
  // Only publications the owner named. None given, no press section.
  const pressPublications = input.press_features || ''

  return `BRAND STORY BRIEF
Brand name: ${input.brand.name}
Tagline: ${input.brand.tagline}
Category: ${input.brand.category}
Founded: ${input.brand.founded || 'Not given'}
Mission: ${input.mission}
Founder story: ${input.founder_story || 'Not given'}
Team size: ${input.team_size || 'Not given'}

Core values:
${valuesText}

Process description: ${input.process?.description || 'Not given'}
Process steps: ${processSteps}

Key milestones:
${milestonesText}

Press features: ${pressPublications || 'None. Do not name any publication.'}

Social proof:
- Customer count: ${input.social_proof?.customer_count || 'Not given'}
- Repeat rate: ${input.social_proof?.repeat_rate || 'Not given'}
- Rating: ${input.social_proof?.avg_rating || 'Not given'}

WRITING DIRECTION
You are writing the brand story page for a premium, craft-focused brand. The tone is literary, sincere, and confident — like how ARKET, Kinfolk, or Patagonia speak. No marketing speak. Direct, human, and specific.

Hard rules:
- hero.manifesto: 3–6 words, bold statement or provocative phrase (uses \\n if 2 lines)
- hero.subheadline: 2-3 sentences, lyrical and specific
- mission.statement: 1 sentence, direct and powerful (the brand's north star)
- mission.elaboration: 3-4 sentence paragraph, editorial voice
- founder_letter.paragraphs: 0–4 paragraphs, each 2-4 sentences, only restating the founder story. Return [] when the brief gives no founder story.
- founder_letter.signature: the founder's name only if the founder story states it, word for word; otherwise ""
- timeline events: one per milestone the brief lists, same order and year; title (2-4 words) and description (1-2 sentences) only restate that milestone
- values: expand on provided values — each body 40-55 words, explaining the value in general terms without adding facts
- process steps: each description is 1-2 sentences describing the step in general terms
- Never write a quote and put a publication's name on it, and never name a publication, award or ranking the brief does not give
- community.subheading: may mention the repeat customer rate only if the brief gives it; otherwise ""
- Never state anything the brief does not give: no founding year, city, country, founder or team member name, team size, number of customers, projects, pieces, workshops or partners, percentage, rating, award, certification, client, partner brand, press mention, or dated event. This applies to every field, including hero.eyebrow, mission, founder_letter, values, process, cta and seo. Write around a missing fact; do not guess it.

OUTPUT
Return ONLY valid JSON, no markdown, no prose:

{
  "brand": {
    "name": "${input.brand.name}",
    "tagline": "${input.brand.tagline}",
    "category": "${input.brand.category}",
    "founded": "${input.brand.founded || ''}"
  },
  "hero": {
    "eyebrow": "Short line: the category, plus the founding year only if the brief gives one. No city or country.",
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
    "signature": "Founder name from the founder story, or empty string",
    "signature_role": "Founder's role only if the founder story states it, or empty string"
  },
  "timeline": {
    "eyebrow": "Our history",
    "heading": "Timeline heading, with no number of years",
    "events": [
      { "year": "Year exactly as given in the brief", "title": "Event title", "description": "1-2 sentences restating that milestone." }
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
  "press": {
    "heading": "Short heading for the list of publications that featured the brand"
  },
  "community": {
    "eyebrow": "The people who live with our work",
    "heading": "Community heading with \\n",
    "subheading": "1 sentence; mention the repeat customer rate only if the brief gives it"
  },
  "cta": {
    "eyebrow": "Join us",
    "heading": "CTA heading with \\n (2-5 words per line)",
    "subheading": "2-3 sentence invitation to get in touch, with no numbers or claims",
    "cta_primary": "Primary CTA",
    "cta_secondary": "Secondary CTA"
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
- timeline.events: exactly the provided milestones (${(input.milestones || []).length} items), one event each; return [] when none are given. Never add a milestone.
- values.items: use provided values (${input.values.length} items), numbered 01/02/03 etc. Never add a value.
- process.steps: one per provided step (${input.process?.steps?.length || 0} items); if none are given, 3-4 general steps with no numbers or claims
- Do not write team members or stats; they come from the owner's own details.
- All content should feel like it belongs to this specific brand, using only what the brief says`
}

// Used when the AI leaves the steps out and the owner gave none. Nothing here is a fact about a business.
const NEUTRAL_STEPS = [
  { title: 'نستمع', description: 'نبدأ بفهم ما تحتاجه وما تريد الوصول إليه.' },
  { title: 'نخطّط', description: 'نتّفق معك على الفكرة والخطوات قبل أن نبدأ العمل.' },
  { title: 'ننفّذ', description: 'نعمل على التفاصيل ونشاركك التقدّم أولًا بأول.' },
  { title: 'نسلّم', description: 'نسلّمك العمل النهائي ونبقى قريبين لأي سؤال.' }
]

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// "+42,000 قطعة في البيوت" → value "+42,000", label "قطعة في البيوت".
function splitStat(raw: string, fallbackLabel: string): { value: string; label: string } {
  const m = raw.match(/^([+\-]?[\d.,٠-٩٫٬]+\s*[%★+]?)\s*(.*)$/)
  if (m && m[1].trim()) return { value: m[1].trim(), label: m[2].trim() || fallbackLabel }
  return { value: raw, label: fallbackLabel }
}

function mergeIntoContent(input: StudioInput, ai: any): StudioContent {
  const mock = STUDIO_MOCK_CONTENT
  const founded = input.brand.founded?.trim() || ''
  const founderStory = input.founder_story?.trim() || ''

  // Timeline: the owner's milestones only. The AI may reword each one, never add one.
  const milestones = input.milestones || []
  const aiEvents: any[] = Array.isArray(ai.timeline?.events) ? ai.timeline.events : []
  const events = milestones.map((m, i) => {
    const e = aiEvents.length === milestones.length ? aiEvents[i] : null
    return { year: m.year, title: str(e?.title) || m.event, description: str(e?.description) }
  })

  // Values: the owner's list. The AI may expand each one, never add one.
  const aiValues: any[] = Array.isArray(ai.values?.items) ? ai.values.items : []
  const values = input.values.map((v, i) => {
    const a = aiValues.length === input.values.length ? aiValues[i] : null
    return {
      number: String(i + 1).padStart(2, '0'),
      title: str(a?.title) || v.title,
      body: str(a?.body) || v.description || ''
    }
  })

  // Process steps: the owner's names; the AI only describes them.
  const ownerSteps = input.process?.steps || []
  const aiSteps: any[] = Array.isArray(ai.process?.steps) ? ai.process.steps : []
  const steps = ownerSteps.length
    ? ownerSteps.map((title, i) => ({
        title,
        description: aiSteps.length === ownerSteps.length ? str(aiSteps[i]?.description) : ''
      }))
    : aiSteps.length
      ? aiSteps.slice(0, 4).map((s, i) => ({
          title: str(s?.title) || NEUTRAL_STEPS[i].title,
          description: str(s?.description)
        }))
      : NEUTRAL_STEPS

  // Founder letter: only when the owner told the story. The signature must be a name the story states.
  const paragraphs: string[] = founderStory
    ? (Array.isArray(ai.founder_letter?.paragraphs)
        ? ai.founder_letter.paragraphs.map(str).filter(Boolean).slice(0, 4)
        : [])
    : []
  const aiSignature = str(ai.founder_letter?.signature)
  const signature = aiSignature && founderStory.includes(aiSignature) ? aiSignature : ''

  // Stats: the owner's social proof only.
  const sp = input.social_proof || {}
  const stats = [
    sp.customer_count ? splitStat(sp.customer_count.trim(), 'عميل') : null,
    sp.repeat_rate ? splitStat(sp.repeat_rate.trim(), 'عملاء متكرّرون') : null,
    sp.avg_rating ? splitStat(sp.avg_rating.trim(), 'متوسط التقييم') : null
  ].filter((s): s is { value: string; label: string } => !!s && !!s.value)

  return {
    brand: {
      name: input.brand.name,
      tagline: input.brand.tagline,
      category: input.brand.category,
      founded
    },
    hero: {
      eyebrow: str(ai.hero?.eyebrow) || (founded ? `${input.brand.category} · تأسّست ${founded}` : input.brand.category),
      manifesto: str(ai.hero?.manifesto) || input.brand.tagline,
      subheadline: str(ai.hero?.subheadline) || input.mission,
      cta_primary: str(ai.hero?.cta_primary) || mock.hero.cta_primary,
      cta_secondary: str(ai.hero?.cta_secondary) || mock.hero.cta_secondary
    },
    mission: {
      statement: str(ai.mission?.statement) || input.mission,
      elaboration: str(ai.mission?.elaboration)
    },
    founder_letter: {
      eyebrow: str(ai.founder_letter?.eyebrow) || 'رسالة من المؤسِّس',
      heading: str(ai.founder_letter?.heading) || 'كيف بدأنا.',
      paragraphs: paragraphs.length ? paragraphs : founderStory ? [founderStory] : [],
      signature,
      signature_role: signature ? str(ai.founder_letter?.signature_role) : ''
    },
    timeline: {
      eyebrow: str(ai.timeline?.eyebrow) || mock.timeline.eyebrow,
      heading: str(ai.timeline?.heading) || 'محطّات من مسيرتنا.',
      events
    },
    values: {
      eyebrow: str(ai.values?.eyebrow) || mock.values.eyebrow,
      heading: str(ai.values?.heading) || 'قيمنا.',
      subheading: str(ai.values?.subheading),
      items: values
    },
    process: {
      eyebrow: str(ai.process?.eyebrow) || 'كيف نعمل',
      heading: str(ai.process?.heading) || 'خطوةً بخطوة.',
      body: str(ai.process?.body) || input.process?.description || '',
      steps
    },
    // The wizard collects no team members, so none are shown. The owner adds them in the editor.
    team: {
      eyebrow: mock.team.eyebrow,
      heading: 'فريقنا.',
      subheading: input.team_size || '',
      members: []
    },
    press: {
      heading: str(ai.press?.heading) || mock.press.heading,
      items: (input.press_features || '')
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6)
        .map((publication) => ({ publication, quote: '' }))
    },
    community: {
      eyebrow: str(ai.community?.eyebrow) || mock.community.eyebrow,
      heading: str(ai.community?.heading) || mock.community.heading,
      subheading: str(ai.community?.subheading),
      stats
    },
    cta: {
      eyebrow: str(ai.cta?.eyebrow) || mock.cta.eyebrow,
      heading: str(ai.cta?.heading) || 'لنبدأ\nالحديث.',
      subheading: str(ai.cta?.subheading),
      cta_primary: str(ai.cta?.cta_primary) || 'تواصل معنا',
      cta_secondary: str(ai.cta?.cta_secondary) || 'اقرأ قصتنا'
    },
    footer: {
      tagline: str(ai.footer?.tagline) || input.brand.tagline,
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`,
      // The wizard asks for no email, so none is made up; the owner adds it in the editor.
      email: ''
    },
    seo: {
      title: str(ai.seo?.title) || `${input.brand.name} — ${input.brand.tagline}`.slice(0, 60),
      description: str(ai.seo?.description) || input.mission.slice(0, 155)
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
      const off = aiUnavailable()
      if (off) return off
      return NextResponse.json({ content: mergeIntoContent(input, {}) })
    }

    const openai = new OpenAI({ apiKey })

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.82,
        max_tokens: AI_MAX_TOKENS,
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

    await logAiUsage({ operation: 'generate-studio', userId: await getUserIdSafe(), model: AI_MODEL }, completion.usage)

    const raw = completion.choices[0]?.message?.content || ''
    let ai: any = {}
    try {
      ai = parseJsonSafe(raw)
    } catch {
      return aiFailed('generate-studio', raw.slice(0, 300))
    }

    const content = mergeIntoContent(input, ai)
    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[generate-studio]', err)
    return aiFailed('generate-studio', err)
  }
}
