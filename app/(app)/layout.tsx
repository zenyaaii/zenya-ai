import { ReactNode } from 'react'
import AppShell from '@/components/app/AppShell'

/**
 * Layout for the logged-in app — wraps every /dashboard/* page (and any
 * future authenticated route in this group) with the AppShell (sidebar +
 * topbar). Does NOT inherit the marketing Navbar from app/(main)/layout.tsx
 * because (app) is a separate route group.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
