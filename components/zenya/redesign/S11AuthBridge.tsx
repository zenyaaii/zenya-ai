"use client"

/**
 * The real sign-in behind the «ليل» login card.
 *
 * The card itself (components/zenya/redesign/s11.tsx, Door + the ACCESS
 * script) is plain markup and a small inline script, so it paints before React
 * loads. This component is the only part that talks to Supabase. On mount it
 * puts one function on window; the card's script calls it on submit and shows
 * whatever comes back. Nothing renders.
 *
 * The calls, the checks and the strings are the ones components/zenya/access/
 * AccessView.tsx makes, unchanged: password sign-in, sign-up with the consent
 * stamp and the duplicate-address check, and the reset link. The card runs
 * the same field checks before it calls in.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { authErrorMessage } from "@/lib/auth-errors"
import { dashboardUrl } from "@/lib/portal-urls"

type Mode = "signin" | "signup" | "forgot"
type Fields = { email: string; password: string; name: string }
type Result = { error?: string; sent?: boolean; left?: boolean }
type SavedAccount = { email: string; name?: string }

const STORE = "zenya_accounts"
const MAX_SAVED = 4
const ALREADY_REGISTERED =
  "هذا البريد مسجّل بالفعل. سجّل الدخول، أو أعد تعيين كلمة المرور إن نسيتها."

function loadAccounts(): SavedAccount[] {
  try {
    const arr = JSON.parse(localStorage.getItem(STORE) || "[]")
    return Array.isArray(arr) ? arr.filter((a) => a && typeof a.email === "string").slice(0, MAX_SAVED) : []
  } catch {
    return []
  }
}

/** Keep the address the portal's chooser offers next time, as AccessView does. */
function remember(addr: string, name?: string) {
  try {
    const accounts = loadAccounts()
    const known = accounts.find((a) => a.email.toLowerCase() === addr.toLowerCase())
    const label = (name || "").trim() || known?.name
    const list = [
      { email: addr, name: label || undefined },
      ...accounts.filter((a) => a.email.toLowerCase() !== addr.toLowerCase()),
    ].slice(0, MAX_SAVED)
    localStorage.setItem(STORE, JSON.stringify(list))
    localStorage.setItem("zenya_last_email", addr)
  } catch {}
}

declare global {
  interface Window {
    __beynounAuth?: (mode: Mode, f: Fields) => Promise<Result>
  }
}

/**
 * `portal` is accounts.beynoun.com. There the way on is the dashboard host,
 * which is another origin, so it is a full navigation rather than a router
 * push, and the sign-up link carries the same absolute address the portal's
 * previous card (components/accounts/AccountsAuthForm.tsx, kept) sent.
 */
export default function S11AuthBridge({ next = "/dashboard", portal = false }: { next?: string; portal?: boolean }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const leave = () => {
      if (portal) {
        window.location.href = dashboardUrl()
        return
      }
      router.push(next)
      router.refresh()
    }
    window.__beynounAuth = async (mode, { email, password, name }) => {
      try {
        if (mode === "forgot") {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
          })
          if (error) throw error
          return { sent: true }
        }

        if (mode === "signin") {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          remember(email, (data.user?.user_metadata?.full_name as string) || undefined)
          try { localStorage.setItem("zenya_email", email) } catch {}
          leave()
          return { left: true }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: portal
              ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(dashboardUrl())}`
              : `${window.location.origin}/auth/callback?next=${next}`,
            data: {
              full_name: name.trim(),
              consent_terms_v: "1",
              consent_terms_at: new Date().toISOString(),
            },
          },
        })
        if (error) throw error
        /* With "Confirm email" on, an address that already exists comes back
           as a user with no identities and no mail is sent. */
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return { error: ALREADY_REGISTERED }
        }
        remember(email, name)
        if (data.session) {
          try { localStorage.setItem("zenya_email", email) } catch {}
          leave()
          return { left: true }
        }
        return { sent: true }
      } catch (err) {
        const knownAccount = loadAccounts().some((a) => a.email.toLowerCase() === email.trim().toLowerCase())
        return { error: authErrorMessage(err, mode, { knownAccount }) }
      }
    }
    return () => { delete window.__beynounAuth }
  }, [router, next, portal])

  return null
}
