import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// A preview of a theme Zenya generates, not a page of Zenya's own site. It is
// in no sitemap and nothing links to it, but without this it would carry the
// homepage's title and could rank for the brand. Same rule as the template
// demos in lib/demo-seo.ts.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
