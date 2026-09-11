import type { ReactNode } from 'react'
import { noindexMetadata } from '@/lib/noindex'

// Product surface, not a landing page: it carried the root title into the index
// and competed with the homepage. See lib/noindex.ts.
export const metadata = noindexMetadata('تسجيل الدخول')

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
