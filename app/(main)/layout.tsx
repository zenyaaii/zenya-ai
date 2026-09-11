import { ReactNode } from 'react'
import ProductShell from '@/components/zenya/chrome/ProductShell'

/**
 * What is left in this group, and why it is chromed this way.
 *
 * (main) used to be the marketing site. It is not any more: the public pages
 * moved to app/(site) and draw their own chrome through
 * components/zenya/chrome/Shell. What stayed behind is the product:
 *
 *   /theme/new/*   the seven generator wizards
 *   /build         the Shopify one-product builder
 *   /auth/*        the reset-password card and the auth-code error
 *   /account       a redirect to dashboard.zenyaai.co
 *   /settings      a redirect to dashboard.zenyaai.co/settings
 *
 * These carried components/Navbar and components/Footer until now, which is
 * why they were the last surfaces on the old visual language: a house-style
 * wizard under a 410-line marketing navbar reads as two different products.
 *
 * ProductShell gives them the house tokens and the same header pill the
 * public site draws, and stops there — no marketing footer under a form. The
 * two redirect stubs render nothing, so the pill never paints for them.
 *
 * THE FLOATING REVIEW LAUNCHER IS GONE, for the reason app/(site)/layout.tsx
 * records: /review is a page of its own now and the footer links to it, so a
 * permanent floating object was a third piece of chrome earning nothing. It
 * was doubly wrong here, where it floated over a wizard's primary action.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return <ProductShell>{children}</ProductShell>
}
