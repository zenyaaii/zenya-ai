/**
 * Central AI model configuration. Every generator reads its model from here,
 * so a model change is one line (or one env var) and everything moves together.
 *
 * The AI is Claude (Anthropic), reached through lib/ai-client.ts. The key is
 * ANTHROPIC_API_KEY.
 *
 *  - AI_MODEL: writes whole sites, reads menus and photos, judges the result.
 *  - AI_MODEL_FAST: small utility calls (names, single-field rewrites).
 */

/** Main model for full site generation, vision and judging. */
export const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5'

/** Cheaper model for small utility calls (names, single-field rewrites). */
export const AI_MODEL_FAST = process.env.AI_MODEL_FAST || 'claude-haiku-5-5'

/** Output token ceiling for a full generation: room for rich sections without cutting the JSON. */
export const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 8000)
