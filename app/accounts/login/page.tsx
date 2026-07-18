import { Suspense } from 'react'
import AccountsAuthForm from '@/components/accounts/AccountsAuthForm'

export const dynamic = 'force-dynamic'

export default function AccountsLoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AccountsAuthForm initialMode="signin" />
    </Suspense>
  )
}

function AuthSkeleton() {
  return (
    <div
      className="h-[460px] w-full max-w-md animate-pulse rounded-3xl"
      style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)' }}
    />
  )
}
