"use client"

/**
 * The header pill's account control, on the home page's rule.
 *
 * Signed out it is the one call to action, ابدأ. Signed in it is the account's
 * own initial and goes to the dashboard. Every page used to hard-code ابدأ, so
 * a signed-in reader saw their initial on the home page and a sign-up button
 * everywhere else.
 *
 * It takes the page's own account class, so each page keeps its colours and
 * its inversion on a dark ground; only the size changes to a round 36px.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { dashboardUrl } from "@/lib/portal-urls"

const ROUND: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  minWidth: 36,
  minHeight: 36,
  padding: 0,
  fontWeight: 500,
  lineHeight: 1,
}

export default function AccountControl({ className }: { className: string }) {
  const [email, setEmail] = useState<string | null>(null)
  const [dash, setDash] = useState("/dashboard")

  useEffect(() => {
    setDash(dashboardUrl())
    let mounted = true
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setEmail(session?.user?.email ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setEmail(session?.user?.email ?? null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!email) {
    return <Link href="/login?mode=signup" className={className}>ابدأ</Link>
  }
  return (
    <Link href={dash} className={className} aria-label="حسابي" title={email} style={ROUND}>
      {email.charAt(0).toUpperCase()}
    </Link>
  )
}
