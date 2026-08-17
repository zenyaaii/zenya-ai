import { ReactNode } from 'react'
import AccountsBackground from '@/components/accounts/AccountsBackground'
import { getT } from '@/lib/i18n/server'

/** Title follows the viewer's locale; the portal is noindex either way. */
export function generateMetadata() {
  const { t } = getT()
  return {
    title: t.accounts.title,
    robots: { index: false, follow: false },
  }
}

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-12">
      <AccountsBackground />
      {children}
    </main>
  )
}
