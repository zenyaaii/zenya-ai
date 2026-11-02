import { ReactNode } from 'react'
import { headers } from 'next/headers'
import { LaylProduct } from '@/components/zenya/redesign/layl'

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
 *   /account       a redirect to dashboard.beynoun.com
 *   /settings      a redirect to dashboard.beynoun.com/settings
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
/*
 * «ليل», since 2026-11-02. LaylProduct (components/zenya/redesign/layl.tsx) is
 * the site's night frame with the product's rule kept: the header pill and
 * the light, no footer. ProductShell, which drew the old pill on #fafafa, is
 * left in the tree.
 *
 * /build opens on the paper side of «ليل» rather than the night. The Shopify
 * builder draws its panels white in its own classes, and on the night they
 * would be white boxes in the dark; the theme button still switches it.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  const path = headers().get('x-pathname') || ''
  const paper = path === '/build' || path.startsWith('/build/')
  return <LaylProduct mode={paper ? 'light' : 'dark'}>{children}</LaylProduct>
}
