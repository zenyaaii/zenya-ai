import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * The Visitors page was ~65% the same numbers as Analytics, read from the same
 * table. Everything it did — the per-site filter and the live visit feed —
 * now lives in the unified analytics page, so this route just forwards to the
 * مباشر tab rather than 404ing anyone's bookmark.
 */
export default function VisitorsPage() {
  redirect('/dashboard/analytics?tab=realtime')
}
