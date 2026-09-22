/**
 * Candidate theme editor — the house style applied to the screen where a
 * customer actually edits their site.
 *
 * NOT THE EDITOR'S ROUTE. The six live edit routes stay at
 * app/preview/<type>/[id]/edit and still load and save through
 * GET/PATCH /api/themes/[id]. This page mounts the SAME ThemeEditor those
 * routes mount, with the same per-type config, the same Preview component and
 * the theme's own mock content, and hands it an in-memory store instead of
 * the database. Every mechanic is the real one; nothing is written anywhere.
 *
 * REGISTERED ON THE SUBDOMAIN in the same commit, per CLAUDE.md. The theme
 * arrives as ?type=, a query and not a path, so this is ONE segment and the
 * exact-match DEMO_SUBDOMAIN_PAGES Set is the right list, not the prefixes.
 *
 * noindex, like the rest of the candidate set.
 */

import type { Metadata } from 'next'
import EditorDemoView from './EditorDemoView'
import { parseDemoType } from './types'

export const metadata: Metadata = {
  title: 'محرّر القالب — نسخة تجريبية',
  robots: { index: false, follow: false },
}

export default function DemoEditorPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  return <EditorDemoView type={parseDemoType(searchParams.type)} />
}
