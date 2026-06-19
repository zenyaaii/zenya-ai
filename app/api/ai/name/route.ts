import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'
import { logAiUsage } from '@/lib/ai-usage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.OPENAI_NAME_MODEL || 'gpt-4o-mini'
const TIMEOUT_MS = 14_000

/**
 * POST /api/ai/name
 *
 * Body: {
 *   scraped_name?: string   // the raw title from the source page
 *   description?: string    // scraped product description / blurb
 *   highlights?: string[]   // bullet-point selling points if we have them
 *   vibe?: 'bold' | 'premium' | 'dark' | 'warm'   // optional palette hint
 * }
 *
 * Returns: { names: string[] } — 8 brandable product names, each 1-3
 * words, no trademarked terms, no "TM" suffixes. The dropshipping
 * builder calls this when the user clicks "Auto-name" on the product
 * editor step. We deliberately don't include filler like "the best" or
 * "premium" — those read as cheap.
 *
 * Auth required. We bill against the caller's user so abuse is
 * traceable, and to keep this endpoint off the open internet.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { body = {} }

  const scrapedName = String(body?.scraped_name || '').slice(0, 200).trim()
  const description = String(body?.description || '').slice(0, 1200).trim()
  const highlights = Array.isArray(body?.highlights)
    ? body.highlights.slice(0, 8).map((h: any) => String(h || '').slice(0, 200))
    : []
  const vibe = ['bold', 'premium', 'dark', 'warm'].includes(body?.vibe) ? body.vibe : null

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'no_api_key', message: 'OPENAI_API_KEY is not set on the server.' },
      { status: 500 }
    )
  }

  const openai = new OpenAI({ apiKey: key })

  const sys = [
    'You name dropshipping products for Arabic one-product Shopify stores. The brand serves Arab customers, so every name must be in Arabic.',
    'Output is consumed by a brand picker UI — return ONLY a JSON array.',
    '',
    'Rules:',
    '• 8 names total, ALL written in Arabic script.',
    '• 1–2 words each. No taglines, no Latin letters, no punctuation.',
    '• Sound like a real Arabic consumer brand — punchy, brandable, memorable.',
    '• Mix styles: evocative single words (وميض، نور، أصيل، ضياء), short compounds (نور بيت، لمسة).',
    '• Never include generic filler like "الأفضل"، "الفاخر"، "الأمثل"، "بريميوم".',
    '• Avoid trademarked names.',
    '• No emojis.',
    '• Each name must feel ownable and distinctive — short and easy to remember.',
  ].join('\n')

  const userParts: string[] = []
  if (scrapedName) userParts.push(`Source product title: ${scrapedName}`)
  if (description) userParts.push(`What it does:\n${description}`)
  if (highlights.length) userParts.push(`Highlights:\n- ${highlights.join('\n- ')}`)
  if (vibe) {
    const vibeNote: Record<string, string> = {
      bold: 'Vibe: bold, high-energy, conversion-focused. Arabic names only.',
      premium: 'Vibe: quiet luxury, refined, premium. Arabic names only.',
      dark: 'Vibe: tech, gear, modern, after-dark. Arabic names only.',
      warm: 'Vibe: cozy, lifestyle, lived-in. Arabic names only.',
    }
    userParts.push(vibeNote[vibe])
  }
  userParts.push('')
  userParts.push('Return a JSON object: { "names": ["...", "...", ...] } where every name is in Arabic script. No prose.')

  const userPrompt = userParts.join('\n\n') || 'Generate 8 brandable Arabic product names for a generic dropshipping product.'

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    }, { signal: ctrl.signal as any })
    clearTimeout(timer)

    await logAiUsage({ operation: 'ai-name', userId: user.id, model: MODEL }, completion.usage)

    const raw = completion.choices[0]?.message?.content || '{}'
    let parsed: any
    try { parsed = JSON.parse(raw) } catch { parsed = {} }

    const namesIn = Array.isArray(parsed?.names) ? parsed.names : []
    const names: string[] = namesIn
      .map((n: any) => String(n || '').trim())
      .filter((n: string) => n.length > 0 && n.length <= 40)
      .slice(0, 8)

    if (names.length === 0) {
      return NextResponse.json(
        { error: 'empty', message: 'AI returned no usable names. Try again.' },
        { status: 502 }
      )
    }
    return NextResponse.json({ names })
  } catch (e: any) {
    const msg = String(e?.message || e || 'AI request failed')
    const isTimeout = /abort|timeout/i.test(msg)
    return NextResponse.json(
      { error: isTimeout ? 'timeout' : 'ai_error', message: msg },
      { status: isTimeout ? 504 : 502 }
    )
  }
}
