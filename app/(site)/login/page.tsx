/**
 * Sign in, sign up, and the password reset: one page, three modes on ?mode=.
 *
 * In the «ليل» style since 2026-11-01. The card is Login in
 * components/zenya/redesign/s11.tsx and the Supabase calls are in
 * S11AuthBridge next to it: the same checks, strings and calls the previous
 * view (components/zenya/access/AccessView.tsx, kept) made. ?next= is read
 * here on the server and only a same-site path is honoured.
 */

import { dashFont } from '@/components/app/dash-font'
import { Login } from '@/components/zenya/redesign/s11'

type Mode = 'signin' | 'signup' | 'forgot'

/**
 * ?mode= and ?next= are read HERE, on the server, and handed down as props.
 *
 * The page this replaced read them with useSearchParams() inside a Suspense
 * boundary. That works on a first load and breaks on a client-side navigation
 * into this route: a suspended subtree carrying the page's inline <style>
 * blanks the whole page for the length of the suspense, and the header's
 * "ابدأ" on every other page is exactly that navigation. Resolved on the
 * server there is no boundary, no hook, and nothing to reconcile.
 *
 * ?next= is confined to a path on this origin. Taking it as given would let
 * any link of the form /login?next=https://example.com walk a reader out of
 * the site through a page they trust, which is the standard open-redirect,
 * and it costs one check to refuse. A protocol-relative //host is a URL with
 * the scheme left off, so it is refused too.
 */
function safeNext(raw: string | undefined): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { mode?: string; next?: string }
}) {
  const asked = searchParams?.mode
  const initialMode: Mode =
    asked === 'signup' || asked === 'forgot' || asked === 'signin' ? asked : 'signin'
  return <div className={dashFont.variable}><Login mode={initialMode} next={safeNext(searchParams?.next)} /></div>
}
