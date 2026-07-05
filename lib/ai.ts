/**
 * Central AI model configuration.
 *
 * The template generators previously hardcoded `gpt-4o-mini` in ~a dozen
 * places. This centralizes the choice so a model upgrade is a one-line/env
 * change, and so every generator moves together.
 *
 * Default is **gpt-4.1** — a large quality jump over gpt-4o-mini (better copy,
 * instruction-following, and layout reasoning) while keeping the SAME Chat
 * Completions API surface (temperature, max_tokens, JSON mode), so it is a true
 * drop-in. gpt-5.x reasoning models are intentionally NOT the default: they
 * change the request params (max_completion_tokens, restricted temperature) and
 * add latency to the generation wait. Override per-deployment via env if wanted.
 */

/** Main model for full template/site generation. */
export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1'

/** Cheaper model for small utility calls (names, single-field rewrites). */
export const AI_MODEL_FAST = process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini'

/** Output token ceiling for a full generation. gpt-4.1 supports large outputs;
 *  a higher ceiling lets sections be richer without truncating the JSON.
 *  (The quality/structure guidance lives in lib/ai-locale's shared directive,
 *  which every generator already appends to its system prompt.) */
export const AI_MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS || 8000)
