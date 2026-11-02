"use client"

/**
 * The «ليل» pages run on small inline scripts (the runtime, the login card,
 * the contact form). A browser runs them while it parses a full page load.
 * React does not run them when it renders the same page after a client-side
 * navigation, for example a next/link from a page still on the old chrome.
 *
 * The runtime's first act is to put .js on its .rd root, so a root without it
 * after mount is a root whose scripts never ran. This runs them once, in
 * document order, each next to the one it copies so document.currentScript
 * finds the same parent.
 */

import { useEffect } from "react"

export default function ScriptRevive() {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".rd:not(.js)").forEach((root) => {
      if (root.dataset.revived) return
      root.dataset.revived = "1"
      root.querySelectorAll("script").forEach((old) => {
        if (old.type && old.type !== "text/javascript") return
        const s = document.createElement("script")
        s.text = old.text
        old.parentElement?.insertBefore(s, old.nextSibling)
      })
    })
  }, [])
  return null
}
