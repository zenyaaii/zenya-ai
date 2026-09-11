/**
 * Candidate templates page — the house style applied to the catalogue.
 *
 * NOT the templates page. It ships as a standalone route at /demo/templates so
 * it can be reviewed on the real domain; app/(main)/themes/page.tsx remains the
 * live catalogue and is untouched. It is noindex, because a second catalogue in
 * the index would compete with the real one for the same query.
 *
 * Design read: a CONTACT SHEET. The style doc records that the page is
 * achromatic and that every pixel of colour belongs to the light at the edges.
 * A scroll page has no light — /demo/pricing turned it off and did not replace
 * it — so on this page the colour transfers to the WORK. Eight real template
 * screenshots are the only chroma in the room, and the chrome's whole job is to
 * not compete with them. That is why there is no accent anywhere in the grid:
 * a violet tag on a tile would be a ninth colour arguing with eight.
 *
 * Three decisions, made by rendering candidates on the real page rather than by
 * reasoning about them. See the measurement note under "the eight" in the CSS.
 *
 *   - TILE SCALE IS A LEGIBILITY DECISION, NOT A TASTE ONE. Each cover is a
 *     screenshot of an Arabic page, so the tile is only doing its job if the
 *     template's own hero type survives at tile size. Rendered at 2, 3 and 4
 *     across and measured, 4-across puts each cover near 300px on a 1440
 *     viewport and the Arabic inside every one of them collapses to grey
 *     texture: the tile stops being a preview and becomes decoration.
 *
 *   - THE COVERS CARRY NO FILL AND NO ACCENT. Cards take the ring token, the
 *     same as the pricing cards. The key recipe stays scoped to CTAs, because
 *     the style doc says plainly that content never does this.
 *
 *   - SHOPIFY IS A BADGE ON ONE TILE, NOT A SECTION. Exactly one template
 *     carries shopify: true in lib/themes-en.ts and on the live catalogue, and
 *     the live page renders that flag as شوبيفاي / مباشر. Giving the export its
 *     own block would overweight one of eight and re-assert the "Shopify theme
 *     generator" reading that Zenya is not. A badge is proportionate.
 *
 * NOTHING HERE IS INVENTED. Names, short labels and audiences are read from
 * lib/template-pages.tsx; section and preset counts from lib/themes-en.ts; the
 * demo routes are the real ones. There are no ratings, no counts of users, no
 * "trusted by". The covers come from themePreview(), the same resolver the live
 * catalogue uses, and every one of the eight resolves to a real screenshot in
 * public/theme-previews — verified, not assumed.
 *
 * AND NO UNSPLASH FALLBACK. themePreviewFallback() exists and every other
 * surface wires it to onError, but a stock photo standing in for a template
 * preview is a picture of a product we do not sell. If a cover ever fails to
 * load, the tile shows its own ground instead. An honest gap beats a pretty
 * lie.
 */

import type { Metadata } from "next"
import TemplatesView from "@/components/zenya/templates/TemplatesView"

export const metadata: Metadata = {
  title: "القوالب — نسخة تجريبية",
  robots: { index: false, follow: false },
}

export default function DemoTemplatesPage() {
  return <TemplatesView />
}
