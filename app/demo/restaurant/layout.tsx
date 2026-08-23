import type { ReactNode } from 'react'
import { demoMetadata } from '@/lib/demo-seo'

// The demo page itself is a client component and cannot export metadata, so the
// unique title/description/canonical for this route lives here. Without it the
// page inherited the ROOT title and looked to Google like a copy of the
// homepage. See lib/demo-seo.ts.
export const metadata = demoMetadata('restaurant')

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
