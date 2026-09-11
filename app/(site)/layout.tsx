import type { ReactNode } from 'react'

/**
 * The public site.
 *
 * IT RENDERS NOTHING OF ITS OWN, and that is the point. Every page in this
 * group draws its own chrome through components/zenya/chrome/Shell — the
 * header pill with its inversion mechanic, and the obsidian footer cap. A
 * Navbar and a Footer mounted here would be a second header and a second
 * footer stacked on top of the ones the page already draws.
 *
 * The old marketing chrome (components/Navbar, components/Footer,
 * components/ReviewFloatingButton) still serves app/(main), which now holds
 * only the surfaces that have not been restyled: the account and settings
 * stubs, the auth callbacks, and the generated-theme previews under
 * /theme/new.
 *
 * The floating review launcher is deliberately not mounted here. It existed
 * to make one honest review channel reachable from anywhere while that
 * channel was a topic buried inside the contact form. /review is now a page
 * of its own and the footer links to it, so a permanent floating object on
 * bare paper would be a third piece of chrome earning nothing.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
