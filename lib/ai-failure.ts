import { NextResponse } from 'next/server'

/**
 * What a generate route answers when the AI did not write the site.
 *
 * The routes used to fill a failed or unreadable answer with the template's
 * demo content and report success, so an owner could publish another
 * business's story, hours and email without knowing. Now the wizard gets an
 * error it shows in words (lib/generate-error.ts) and nothing is saved.
 */

/** The AI call failed, timed out, or sent back something unreadable. */
export function aiFailed(label: string, err?: unknown) {
  console.error(`[${label}] AI generation failed`, err instanceof Error ? err.message : err)
  return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
}

/**
 * No OPENAI_API_KEY. In production that is an outage, not a reason to hand
 * out demo content. Locally the routes keep their demo fill so the wizards
 * can be clicked through without a key, so this returns null there.
 */
export function aiUnavailable() {
  if (process.env.NODE_ENV !== 'production') return null
  console.error('[generate] OPENAI_API_KEY is not set')
  return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
}
