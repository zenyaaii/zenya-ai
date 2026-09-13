'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DASHBOARD_HOST, dashboardPortalPath, dashboardRoutePath } from '@/lib/portal-urls'

/**
 * The dashboard chrome's view of the address, on either host.
 *
 * `pathname` is always the route form (/dashboard/sites), so active states and
 * titles match the same keys whether the page is read on dashboard.zenyaai.co
 * (browser path /sites) or on localhost (/dashboard/sites).
 *
 * `linkTo` turns a route into the address to put in an href. The host is only
 * known in the browser, so the first render keeps the route form — identical
 * to the server's HTML, no hydration mismatch — and the clean form lands right
 * after mount. A click before that still ends on the clean address: middleware
 * redirects /dashboard/* on the portal host.
 */
export function useDashboardPath() {
  const pathname = dashboardRoutePath(usePathname())
  const [onPortal, setOnPortal] = useState(false)

  useEffect(() => {
    setOnPortal(window.location.hostname === DASHBOARD_HOST)
  }, [])

  const linkTo = (route: string) => (onPortal ? dashboardPortalPath(route) : route)

  return { pathname, linkTo }
}
