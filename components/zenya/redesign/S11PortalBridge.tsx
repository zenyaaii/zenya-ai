"use client"

/**
 * Sign-out on the «ليل» account chooser at accounts.beynoun.com.
 *
 * The chooser is server markup: the account it shows was read on the server,
 * so the card paints with the right name before any script runs. The one
 * thing it cannot do without React is end the session, which needs the
 * Supabase client. This puts a listener on the «تسجيل الخروج» row and does
 * what the previous chooser (app/accounts/page.tsx before the restyle) did:
 * sign out, forget the addresses kept for prefill, and go to the login card.
 * Nothing renders.
 */

import { useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { accountsUrl } from "@/lib/portal-urls"

export default function S11PortalBridge() {
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>(".rd [data-signout]")
    if (!btn) return
    const label = btn.querySelector<HTMLElement>("[data-l]")
    const onClick = async (e: Event) => {
      e.preventDefault()
      if (btn.disabled) return
      btn.disabled = true
      if (label) label.textContent = "جارٍ تسجيل الخروج…"
      try { await createClient().auth.signOut() } catch {}
      try {
        localStorage.removeItem("zenya_email")
        localStorage.removeItem("zenya_last_email")
      } catch {}
      window.location.replace(accountsUrl("/login"))
    }
    btn.addEventListener("click", onClick)
    return () => btn.removeEventListener("click", onClick)
  }, [])
  return null
}
