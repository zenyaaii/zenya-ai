import { NextRequest, NextResponse } from 'next/server'
import { AiClient, aiKey } from '@/lib/ai-client'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { ICON_VOCAB_PROMPT } from '@/components/icons/vocab'
import { wellnessInputSchema, type WellnessInput } from '@/utils/wellness/input'
import type { WellnessContent } from '@/utils/wellness/types'
import { WELLNESS_MOCK_CONTENT } from '@/utils/wellness/mock-content'
import { pickWellnessPhotos, resolveWellnessNiche, unsplash } from '@/utils/wellness/niches'
import { withTimeout, parseJsonSafe, buildPrompt, mergeIntoContent, buildFallbackContent, TIMEOUT_MS, SYSTEM_PROMPT } from '@/lib/generators/wellness'

// The AI writes the whole site in one answer; give it time.
export const maxDuration = 120

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = wellnessInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues.slice(0, 8) }, { status: 400 })
  }

  const input = parsed.data
  const apiKey = aiKey()
  if (!apiKey) {
    const off = aiUnavailable()
    if (off) return off
    return NextResponse.json({ content: buildFallbackContent(input), _meta: { source: 'fallback_no_api_key' } }, { status: 200 })
  }

  try {
    const aiClient = new AiClient({ apiKey })
    const response = await withTimeout(
      aiClient.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.72,
        max_tokens: AI_MAX_TOKENS,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          { role: 'user', content: buildPrompt(input) }
        ]
      }),
      TIMEOUT_MS,
      'wellness_ai'
    )

    await logAiUsage({ operation: 'generate-wellness', userId: await getUserIdSafe(), model: AI_MODEL }, response.usage)

    const raw = response.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try { aiJson = parseJsonSafe(raw) } catch (e) { return aiFailed('generate-wellness', e) }

    return NextResponse.json({ content: mergeIntoContent(input, aiJson), _meta: { source: 'claude', model: AI_MODEL } })
  } catch (error: any) {
    return aiFailed('generate-wellness', error)
  }
}
