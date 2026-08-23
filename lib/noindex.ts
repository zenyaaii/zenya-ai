/**
 * Metadata for a product surface that must never compete in search.
 *
 * The wizard, the login screen and the account pages are all `"use client"`
 * with no metadata of their own, so each one inherited the ROOT title verbatim.
 * That put several crawlable URLs into the index all claiming to be
 * "زينيا — منشئ المواقع العربي بالذكاء الاصطناعي…" — the homepage's own title,
 * competing with the homepage for the homepage's query, on pages a searcher
 * has no reason to land on.
 *
 * `noindex` rather than a robots.txt Disallow on purpose: Disallow blocks the
 * fetch, so a crawler never reads the noindex and any copy already indexed
 * stays indexed as a bare URL. Letting the crawl through with a noindex is what
 * actually removes them.
 */

import type { Metadata } from 'next'

export function noindexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  }
}
