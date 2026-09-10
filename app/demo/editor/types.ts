/**
 * The six theme types the live editor serves, one per edit route under
 * app/preview/<type>/[id]/edit. Kept in a plain module (not the client view)
 * so the server page can read the list: a value imported from a 'use client'
 * file arrives on the server as a client reference, not as the array.
 */
export const DEMO_TYPES = ['restaurant', 'atlas', 'lookbook', 'services', 'studio', 'wellness'] as const

export type DemoType = (typeof DEMO_TYPES)[number]

export function parseDemoType(raw: string | string[] | undefined): DemoType {
  const v = Array.isArray(raw) ? raw[0] : raw
  return (DEMO_TYPES as readonly string[]).includes(v ?? '') ? (v as DemoType) : 'restaurant'
}
