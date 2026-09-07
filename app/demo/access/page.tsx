/**
 * Candidate auth page — the house style applied to sign-in, sign-up and
 * password reset.
 *
 * NOT the auth page. It ships as a standalone route at /demo/access so it can
 * be reviewed on the real domain; app/(main)/login and the accounts portal at
 * components/accounts/AccountsAuthForm remain the live surfaces and are
 * untouched. It is noindex, because a second sign-in form in the index would
 * compete with the real one for the same query — and because a page that
 * looks exactly like a login and cannot log anyone in is the last thing that
 * should turn up in a search for "تسجيل الدخول زينيا".
 *
 * Design read: ONE OBJECT ON BARE PAPER. The catalogue at /demo/templates is a
 * page you look at and /demo/build is a page you work through; this is a door.
 * A door is one object, so the composition is a single card centred on flat
 * #fafafa with nothing else on the paper — no split, no marketing column, no
 * ambient wash. The obsidian footer cap is the only other weight on the page,
 * and it is there so the header's inversion mechanic has a dark ground to
 * cross, the way it does on the other four.
 *
 * WHICH SYSTEM THIS MIRRORS. Two auth surfaces exist and they are not the
 * same. app/(main)/login is one page with three modes on ?mode=. The accounts
 * portal — app/accounts/{login,signup} rendering AccountsAuthForm — has those
 * same three modes PLUS an account chooser: a one-click continue for a live
 * session, a list of remembered accounts, and a way to type a fresh one. The
 * portal is the newer and richer of the two, so the chooser is mirrored here.
 * Every string is taken from one of those two files; see AccessView for the
 * three the demo had to write itself and why each one had to be written.
 *
 * WHAT THE OLD SURFACES LOOK LIKE, and why this is a redesign rather than a
 * restyle. The accounts portal stands on a cream gradient with three drifting
 * aurora orbs (violet, amber, teal), a moving mesh grid, five floating
 * sparkles and a card carrying a 70px drop shadow. That is four separate
 * violations of the house style in one screen: gradients on something that is
 * not the light, a page that is not achromatic, a drop shadow doing the
 * elevation, and motion with no meaning attached to it. All of it is gone.
 * The ground here is one flat #fafafa, elevation is the stacked hairline ring
 * token, and every animation on the page is attached to something the reader
 * actually did.
 *
 * WHERE THE VIOLET GOES. Same rule as /demo/build, which is the rule a form
 * makes possible: the accent carries meaning instead of decorating. It is the
 * focused field's ring, the chosen tab, the password rule filling as you meet
 * it, the required star, and the primary action. Type stays obsidian, muted
 * type stays #56565a, and nothing else on the page is tinted.
 *
 * AND IT DOES NOT AUTHENTICATE. There is no supabase call in this tree, no
 * session, and no redirect into the app. The form validates for real — every
 * error string below is the real one, thrown on the real condition, in the
 * real order — and then stops at the door and says so, handing the reader to
 * /login in the mode they were in. The precedent is /demo/build's review step:
 * an honest edge beats a convincing dead end.
 */

import type { Metadata } from "next"
import AccessView from "./AccessView"

export const metadata: Metadata = {
  title: "الدخول إلى زينيا — نسخة تجريبية",
  robots: { index: false, follow: false },
}

type Mode = "signin" | "signup" | "forgot"

/**
 * ?mode= is read HERE, on the server, and handed down as a prop — the shape
 * app/accounts/{login,signup} already use with initialMode, rather than the
 * useSearchParams + Suspense shape app/(main)/login uses.
 *
 * Both work on a first load. Only one survives a client-side navigation into
 * this route: a suspended subtree carrying the page's inline <style> blanked
 * the entire page on the click the header CTA makes, which is the one click
 * that reaches this page from anywhere else in the candidate set. No hook and
 * no boundary means nothing to reconcile.
 */
export default function DemoAccessPage({
  searchParams,
}: {
  searchParams?: { mode?: string }
}) {
  const asked = searchParams?.mode
  const initialMode: Mode =
    asked === "signup" || asked === "forgot" || asked === "signin" ? asked : "signin"
  return <AccessView initialMode={initialMode} />
}
