/**
 * Sign in, sign up, and the password reset — one page, three modes on ?mode=.
 *
 * DESIGN READ: one object on bare paper. A door is one object, so the
 * composition is a single card centred on flat #fafafa with nothing else on
 * it — no split, no marketing column, no ambient wash. The obsidian footer
 * cap is the only other weight, and it is there so the header's inversion
 * mechanic has a dark ground to cross.
 * Dials: DESIGN_VARIANCE 5, MOTION_INTENSITY 4, VISUAL_DENSITY 3.
 *
 * WHERE THE VIOLET GOES. The accent carries meaning rather than decorating:
 * the focused field's ring, the chosen tab, the password rule filling as you
 * meet it, the required star, and the primary action. Type stays obsidian,
 * muted type stays #56565a, and nothing else is tinted.
 *
 * THE ACCOUNT CHOOSER IS SHARED WITH THE PORTAL. Both this page and
 * components/accounts/AccountsAuthForm remember addresses under
 * "zenya_accounts", so an account used here is waiting at
 * accounts.zenyaai.co and the other way round. No password is ever stored;
 * the chooser prefills the address and focuses the password field.
 *
 * WHAT IT CALLS. supabase.auth.signInWithPassword, signUp and
 * resetPasswordForEmail — the same three the page carried before the restyle,
 * with the same validation in the same order and the same duplicate-signup
 * detection, which is the one case Supabase deliberately does not report as
 * an error.
 */

import AccessView from '@/components/zenya/access/AccessView'

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
  return <AccessView initialMode={initialMode} next={safeNext(searchParams?.next)} />
}
