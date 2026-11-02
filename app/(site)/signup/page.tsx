import { redirect } from 'next/navigation'

/**
 * beynoun.com/signup — the address people type for «إنشاء حساب».
 *
 * Sign-up is a mode of the one door at /login (?mode=signup), so this only
 * hands over, keeping a same-site ?next=. It is not a second sign-up page.
 */
export default function SignupPage({ searchParams }: { searchParams?: { next?: string } }) {
  const next = searchParams?.next
  const keep = next && next.startsWith('/') && !next.startsWith('//') ? `&next=${encodeURIComponent(next)}` : ''
  redirect(`/login?mode=signup${keep}`)
}
