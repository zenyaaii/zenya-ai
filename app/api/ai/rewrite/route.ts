import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'
import { logAiUsage } from '@/lib/ai-usage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.OPENAI_COPY_MODEL || process.env.OPENAI_NAME_MODEL || 'gpt-4o-mini'
const TIMEOUT_MS = 22_000

/**
 * POST /api/ai/rewrite
 *
 * The editor's inline AI copywriter. Rewrites ONE piece of microcopy for a
 * specific slot in a generated theme, while staying glued to the brand's
 * established voice. The intelligence is entirely in the context we hand the
 * model: the brand identity, a sample of the site's existing copy (so the new
 * line sounds like the same writer wrote it), the exact slot it's filling
 * (section + field), and the format of the value it's replacing.
 *
 * Body: {
 *   themeName:    string                 // pretty theme name, e.g. "Atlas"
 *   businessType: string                 // theme key, e.g. "atlas"
 *   brand:        { name?, tagline?, category? }
 *   voiceSample:  string[]               // existing copy from the same site
 *   panelLabel:   string                 // section, e.g. "Hero"
 *   fieldLabel:   string                 // field, e.g. "Headline"
 *   current:      string                 // the value being rewritten
 *   multiline?:   boolean                // textarea vs single line
 *   mode:         'improve' | 'shorter' | 'longer' | 'punchier'
 *                 | 'professional' | 'playful' | 'custom'
 *   instruction?: string                 // free-form, used when mode = custom
 *   variants?:    number                 // how many options (1–4, default 3)
 * }
 *
 * Returns: { variants: string[] } — distinct, ready-to-paste replacements.
 *
 * Auth required so the endpoint is off the open internet and abuse is
 * traceable to a user (same posture as /api/ai/name).
 */

const MODE_INSTRUCTIONS: Record<string, string> = {
  improve:
    'Rewrite it to be clearer, more compelling, and more on-brand. Keep the same intent and roughly the same length.',
  shorter:
    'Make it noticeably shorter and punchier. Cut filler, keep the core message and the brand voice.',
  longer:
    'Expand it slightly with one more concrete, benefit-driven detail. Stay tight — add substance, not fluff.',
  punchier:
    'Make it bolder and more energetic: strong verbs, confident rhythm, scroll-stopping. No hype words like "best" or "ultimate".',
  professional:
    'Make it more polished and authoritative: precise, credible, calm. Remove exclamation marks and hype.',
  playful:
    'Make it warmer and more playful: human, a touch of wit, conversational. Never cheesy or gimmicky.',
}

function clampStr(v: any, max: number): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function buildSystemPrompt(): string {
  return [
    'You are a world-class conversion copywriter for premium brands — the level of Apple, Stripe, Linear, and Glossier. You write microcopy for live marketing websites and ecommerce stores.',
    '',
    'Your job: rewrite ONE small piece of copy for ONE specific slot on a page, and make it sound like it was written by the same person who wrote the rest of that site.',
    '',
    'How to be excellent here:',
    '1. VOICE MATCH. Study the brand and the VOICE SAMPLE. Infer the tone, formality, reading level, sentence rhythm, and vocabulary, then mirror them. The rewrite must feel native to this exact site, not generic AI copy.',
    '2. STAY TRUE. Never invent product features, customers, statistics, prices, awards, or compliance/certification claims that are not present or clearly implied by the brand and sample. When you lack a specific fact, stay benefit-led and concrete without fabricating numbers.',
    '3. MATCH THE FORMAT. Mirror the length of the CURRENT VALUE (within ~20% of its character count). Match its capitalization style. Headlines and labels carry no trailing period unless the original had one. Output the value only — no markdown, no surrounding quotes, no commentary.',
    '4. RESPECT THE SLOT. A headline, a subheadline, a button label, a feature description, and an FAQ answer all behave differently. Use the SECTION and FIELD to write something that fits that role precisely.',
    '5. LINE BREAKS. If the CURRENT VALUE uses the two-character sequence backslash-n (\\n) to break lines, keep using \\n for breaks in your output. Otherwise return a single line (or natural sentences for a long description) — do not introduce \\n.',
    '6. LANGUAGE. This is an Arabic website. ALWAYS write every variant in Modern Standard Arabic (العربية الفصحى) with correct grammar and Arabic punctuation. Never output English (except globally recognized brand names). Match the existing Arabic voice in the sample.',
    '',
    'Return ONLY valid JSON of the form { "variants": ["...", "..."] }: distinct, complete replacement values, ordered best first. No prose outside the JSON.',
  ].join('\n')
}

function buildUserPrompt(args: {
  themeName: string
  businessType: string
  brand: { name?: string; tagline?: string; category?: string }
  voiceSample: string[]
  panelLabel: string
  fieldLabel: string
  current: string
  multiline: boolean
  mode: string
  instruction: string
  variants: number
}): string {
  const {
    themeName, businessType, brand, voiceSample, panelLabel,
    fieldLabel, current, multiline, mode, instruction, variants,
  } = args

  const hasEscapedBreak = current.includes('\\n')
  const looksLikeHeadline = /headline|title|hero/i.test(`${fieldLabel} ${panelLabel}`)
  const lineBreakNote = hasEscapedBreak
    ? 'This value uses \\n line breaks — keep them (2–3 short lines).'
    : looksLikeHeadline && !current
      ? 'This is a headline slot — you may use \\n to break it into 2–3 short, punchy lines.'
      : multiline
        ? 'This is a multi-line field — full sentences are fine; do not use \\n unless writing a headline.'
        : 'This is a single-line field — return one tight line, no \\n.'

  const len = current.length
  const lengthNote = current
    ? `Match the length of the current value (~${len} characters).`
    : 'The field is currently empty — infer a sensible length for this kind of slot.'

  const task =
    mode === 'custom' && instruction
      ? `Apply this instruction: ${instruction}`
      : MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.improve

  const voice = voiceSample.length
    ? voiceSample.map((v) => `- ${v}`).join('\n')
    : '(no sample available — infer the voice from the brand)'

  return [
    'THEME & BRAND',
    `Theme style: ${themeName} (${businessType})`,
    brand.name ? `Brand: ${brand.name}` : '',
    brand.tagline ? `Tagline: ${brand.tagline}` : '',
    brand.category ? `Category: ${brand.category}` : '',
    '',
    'VOICE SAMPLE — existing copy on this same site. Match this voice:',
    voice,
    '',
    'SLOT',
    `Section: ${panelLabel || 'Page'}`,
    `Field: ${fieldLabel}`,
    lineBreakNote,
    lengthNote,
    '',
    'CURRENT VALUE:',
    '"""',
    current || '(empty)',
    '"""',
    '',
    `TASK: ${task}`,
    '',
    `Return ${variants} distinct option${variants === 1 ? '' : 's'} as JSON: { "variants": [ ... ] }.`,
  ].filter(Boolean).join('\n')
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const current = clampStr(body?.current, 800)
  const mode = typeof body?.mode === 'string' && (MODE_INSTRUCTIONS[body.mode] || body.mode === 'custom')
    ? body.mode
    : 'improve'
  const instruction = clampStr(body?.instruction, 400)
  const fieldLabel = clampStr(body?.fieldLabel, 80) || 'Text'
  const panelLabel = clampStr(body?.panelLabel, 80)
  const themeName = clampStr(body?.themeName, 60) || 'this theme'
  const businessType = clampStr(body?.businessType, 60)
  const multiline = !!body?.multiline
  const variants = Math.min(4, Math.max(1, Number(body?.variants) || 3))

  const brandIn = body?.brand && typeof body.brand === 'object' ? body.brand : {}
  const brand = {
    name: clampStr(brandIn.name, 120) || undefined,
    tagline: clampStr(brandIn.tagline, 160) || undefined,
    category: clampStr(brandIn.category, 120) || undefined,
  }

  const voiceSample: string[] = Array.isArray(body?.voiceSample)
    ? body.voiceSample
        .map((s: any) => clampStr(String(s || '').replace(/\\n/g, ' '), 180))
        .filter((s: string) => s.length > 2)
        .slice(0, 8)
    : []

  if (mode === 'custom' && !instruction) {
    return NextResponse.json(
      { error: 'no_instruction', message: 'Add an instruction for a custom rewrite.' },
      { status: 400 }
    )
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'no_api_key', message: 'OPENAI_API_KEY is not set on the server.' },
      { status: 500 }
    )
  }

  const openai = new OpenAI({ apiKey: key })
  const userPrompt = buildUserPrompt({
    themeName, businessType, brand, voiceSample, panelLabel,
    fieldLabel, current, multiline, mode, instruction, variants,
  })

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: mode === 'professional' ? 0.6 : 0.82,
      max_tokens: 700,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
    }, { signal: ctrl.signal as any })
    clearTimeout(timer)

    await logAiUsage({ operation: 'ai-rewrite', userId: user.id, model: MODEL, meta: { mode } }, completion.usage)

    const raw = completion.choices[0]?.message?.content || '{}'
    let parsed: any
    try { parsed = JSON.parse(raw) } catch { parsed = {} }

    const list = Array.isArray(parsed?.variants)
      ? parsed.variants
      : Array.isArray(parsed?.options)
        ? parsed.options
        : []

    const seen = new Set<string>()
    const out: string[] = []
    for (const v of list) {
      const text = String(v ?? '').trim()
      if (!text) continue
      const dedupeKey = text.toLowerCase()
      if (seen.has(dedupeKey)) continue
      // Skip a verbatim echo of the current value.
      if (text === current) continue
      seen.add(dedupeKey)
      out.push(text)
      if (out.length >= variants) break
    }

    if (out.length === 0) {
      return NextResponse.json(
        { error: 'empty', message: 'The AI returned no usable copy. Try again.' },
        { status: 502 }
      )
    }
    return NextResponse.json({ variants: out })
  } catch (e: any) {
    const msg = String(e?.message || e || 'AI request failed')
    const isTimeout = /abort|timeout/i.test(msg)
    return NextResponse.json(
      { error: isTimeout ? 'timeout' : 'ai_error', message: isTimeout ? 'The rewrite timed out. Try again.' : msg },
      { status: isTimeout ? 504 : 502 }
    )
  }
}
