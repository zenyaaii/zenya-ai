"use client"

/**
 * The «ليل» header is server markup with «دخول» and «إنشاء حساب» in it. For a
 * visitor who is already signed in, this swaps them for one way back into the
 * dashboard, the job components/zenya/chrome/AccountControl does on the old
 * header. Nothing renders; with no session the header stays as it was served.
 */

import { useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { dashboardUrl } from "@/lib/portal-urls"

export default function S11Session() {
  useEffect(() => {
    let live = true
    const apply = (signedIn: boolean) => {
      if (!live || !signedIn) return
      const dash = dashboardUrl()
      document.querySelectorAll<HTMLElement>(".rd .h-login").forEach((el) => { el.style.display = "none" })
      document.querySelectorAll<HTMLAnchorElement>(".rd .h-cta").forEach((a) => { a.href = dash; a.textContent = "لوحة التحكم" })
      document.querySelectorAll<HTMLAnchorElement>('.rd .h-drawer a[href="/login"]').forEach((a) => {
        a.href = dash
        if (a.firstChild) a.firstChild.textContent = "لوحة التحكم"
      })
    }
    createClient().auth.getSession().then(({ data: { session } }) => apply(!!session)).catch(() => {})
    return () => { live = false }
  }, [])
  return null
}
