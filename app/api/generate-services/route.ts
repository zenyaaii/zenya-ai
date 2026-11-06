import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { serviceInputSchema, type ServiceInput } from '@/utils/services/input'
import type { ServiceContent } from '@/utils/services/types'
import { SERVICE_MOCK_CONTENT } from '@/utils/services/mock-content'
import { pickServicePhotos, resolveServiceNiche, unsplash } from '@/utils/services/niches'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, dropRatingClaims, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'
import { withTimeout, parseJsonSafe, buildPrompt, mergeIntoContent, buildFallbackContent, TIMEOUT_MS, SYSTEM_PROMPT } from '@/lib/generators/services'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = serviceInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues.slice(0, 8) },
      { status: 400 }
    )
  }

  const input = parsed.data
  const apiKey = process.env.OPENAI_API_KEY
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
    const openai = new OpenAI({ apiKey })
    const prompt = buildPrompt(input)

    const response = await withTimeout(
      openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.7,
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
      'services_ai'
    )

    await logAiUsage({ operation: 'generate-services', userId: await getUserIdSafe(), model: AI_MODEL }, response.usage)

    const raw = response.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try {
      aiJson = parseJsonSafe(raw)
    } catch (e) {
      return aiFailed('generate-services', e)
    }

    return NextResponse.json({
      content: mergeIntoContent(input, aiJson),
      _meta: { source: 'openai', model: AI_MODEL }
    })
  } catch (error: any) {
    return aiFailed('generate-services', error)
  }
}
