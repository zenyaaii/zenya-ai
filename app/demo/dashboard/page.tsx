/**
 * Candidate dashboard — the restyled logged-in product surface, viewable
 * without a session.
 *
 * WHY THIS ROUTE EXISTS. The restyle itself lives where it belongs, on
 * app/(app)/dashboard/** and components/{app,dashboard}/**, behind the auth
 * gate in AppShell. That gate is the point of the real surface and it is not
 * touched here — but it also means the work cannot be LOOKED at without
 * signing in, which makes reviewing it awkward and makes showing it to anyone
 * else impossible. This route is the sixth candidate page: the same treatment
 * the other five get, applied to the surface that was hardest to see.
 *
 * IT IS THE REAL THING, NOT A PICTURE OF IT. Every token, every primitive and
 * the chart are imported from the components the product actually ships:
 * DASHBOARD_CSS is the same stylesheet AppShell injects, TrendChart is the
 * same chart /dashboard/analytics renders, and Segmented, Tile, BarList and
 * Delta are the same primitives. Only two things are written for this page —
 * the rail and the bar — and only because the real Sidebar and Topbar
 * navigate to /dashboard/*, which is not on this host's allowlist and would
 * bounce a reader to the apex on the first click. Here they switch the view
 * instead, so the whole restyle is reachable from one page.
 *
 * AND IT SIGNS NOBODY IN. There is no supabase call in this tree, no session
 * and no redirect into the app. The numbers are invented and the page says so
 * in place, under the fold, the way /demo/access says it authenticates
 * nobody. An honest edge beats a convincing dead end.
 *
 * noindex, like the rest of the candidate set: a second dashboard in the
 * index would compete with nothing useful, and a page that looks exactly like
 * the product and holds no one's data should not turn up in a search.
 */

import type { Metadata } from 'next'
import DashboardDemoView from './DashboardDemoView'

export const metadata: Metadata = {
  title: 'لوحة التحكم — نسخة تجريبية',
  robots: { index: false, follow: false },
}

export default function DemoDashboardPage() {
  return <DashboardDemoView />
}
