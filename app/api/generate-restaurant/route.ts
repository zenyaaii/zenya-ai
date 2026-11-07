import { NextRequest, NextResponse } from 'next/server'
import { AiClient, aiKey } from '@/lib/ai-client'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { dishPhoto } from '@/lib/dish-photos'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { restaurantInputSchema, type RestaurantInput } from '@/utils/restaurant/input'
import type { RestaurantContent } from '@/utils/restaurant/types'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'
import { withTimeout, parseJsonSafe, buildPrompt, mergeIntoContent, buildFallbackContent, TIMEOUT_MS, SYSTEM_PROMPT } from '@/lib/generators/restaurant'

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

  const parsed = restaurantInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues.slice(0, 8) },
      { status: 400 }
    )
  }
  const input = parsed.data

  const apiKey = aiKey()
  if (!apiKey) {
    const off = aiUnavailable()
    if (off) return off
    return NextResponse.json(
      {
        content: buildFallbackContent(input),
        _meta: { source: 'fallback_no_api_key' }
      },
      { status: 200 }
    )
  }

  try {
    const openai = new AiClient({ apiKey })
    const prompt = buildPrompt(input)

    const resp = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.65,
        max_tokens: AI_MAX_TOKENS,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          { role: 'user', content: prompt }
        ]
      }),
      TIMEOUT_MS,
      'restaurant_ai'
    )

    await logAiUsage({ operation: 'generate-restaurant', userId: await getUserIdSafe(), model: AI_MODEL }, resp.usage)

    const raw = resp.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try {
      aiJson = parseJsonSafe(raw)
    } catch (e) {
      return aiFailed('generate-restaurant', e)
    }

    const content = mergeIntoContent(input, aiJson)
    return NextResponse.json({
      content,
      _meta: { source: 'claude', model: AI_MODEL }
    })
  } catch (e: any) {
    return aiFailed('generate-restaurant', e)
  }
}
