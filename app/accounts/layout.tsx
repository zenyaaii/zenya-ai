import { ReactNode } from 'react'
import AccountsBackground from '@/components/accounts/AccountsBackground'

export const metadata = {
  title: 'زينيا · الحساب',
  robots: { index: false, follow: false },
}

export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-6 py-12">
      <AccountsBackground />
      {children}
    </main>
  )
}
