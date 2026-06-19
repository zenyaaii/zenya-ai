import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

/* ────────────────────────────────────────────────────────────────────── *
 * AI token-usage logging.                                                 *
 *                                                                         *
 * Every OpenAI call in the app (content + theme generation, AI rewrite,   *
 * name suggestions) records its token usage into `public.ai_usage` via    *
 * `logAiUsage`. One row per call. We log with the service role so it works *
 * from routes that aren't auth-gated; `getUserIdSafe` best-effort attaches *
 * the signed-in user when cookies are present.                            *
 *                                                                         *
 * Logging never throws — analytics must not break generation.            *
 * ────────────────────────────────────────────────────────────────────── */

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export type OpenAiUsage = {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
} | null | undefined

export type AiUsageCtx = {
  /** What spent the tokens, e.g. 'generate-atlas', 'ai-rewrite', 'ai-name'. */
  operation: string
  userId?: string | null
  themeId?: string | null
  model?: string | null
  meta?: Record<string, any> | null
}

/**
 * Record one OpenAI call's token usage. Best-effort + non-throwing.
 * Pass the `usage` object straight off the completion (`completion.usage`).
 */
export async function logAiUsage(ctx: AiUsageCtx, usage: OpenAiUsage): Promise<void> {
  try {
    const prompt = usage?.prompt_tokens ?? 0
    const completion = usage?.completion_tokens ?? 0
    const total = usage?.total_tokens ?? (prompt + completion)
    if (prompt === 0 && completion === 0 && total === 0) return // nothing happened
    await admin().from('ai_usage').insert({
      user_id: ctx.userId ?? null,
      operation: ctx.operation,
      model: ctx.model ?? null,
      prompt_tokens: prompt,
      completion_tokens: completion,
      total_tokens: total,
      theme_id: ctx.themeId ?? null,
      meta: ctx.meta ?? null,
    })
  } catch (e) {
    console.error('[ai-usage] log failed:', (e as any)?.message || e)
  }
}

/** Best-effort signed-in user id from request cookies. Null if not logged in. */
export async function getUserIdSafe(): Promise<string | null> {
  try {
    const { data: { user } } = await createClient().auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}
