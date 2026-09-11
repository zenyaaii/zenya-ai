/**
 * The about page — the house style applied to the story Zenya tells
 * about itself.
 *
 * DESIGN READ: a redesign of a trust page for someone deciding whether a new
 * Arabic product is real, in the house language: flat #fafafa, near-black
 * Arabic at display size, hairline rings instead of shadows, and the accent
 * only where it reports something.
 * Dials: DESIGN_VARIANCE 7, MOTION_INTENSITY 4, VISUAL_DENSITY 4.
 *
 * WHAT THE PAGE THIS REPLACED MEASURED, and why the restyle is worth doing. Taken
 * in the browser at 360/390/430/768/1440:
 *   · Three aurora orbs, rgba(94,106,210,0.06), rgba(217,119,6,0.07) and
 *     rgba(113,112,255,0.03), each blur(64px) at opacity 0.7, over a #f7f4ed
 *     ground rather than the flat #fafafa the house style names.
 *   · The headline is filled with .gradient-text, which computes to
 *     linear-gradient(120deg, #4f5ab8 10%, #7170ff 100%).
 *   · Six Arabic elements carry negative tracking: the h1 at -1.4px on a
 *     phone and -2px from 768, and four h2 at -0.6px.
 *   · Eight elements render under 12px: the eyebrow pill at 10.2px and the
 *     four pillar descriptions at 11.47px.
 *   · The eyebrow measures 4.28:1 on its own fill, under the 4.5 floor.
 *   · Four pillar tiles in three hues, two of them the status triad.
 *   · The first call to action sits 2362px down at 390.
 *   · Nine blocks are server-rendered with style="opacity:0", so the page is
 *     blank with JavaScript disabled.
 *
 * WHAT CAME BACK CLEAN, because a verdict that fails everything is a
 * template: no horizontal scroll at any width, the measure is 55.3 Arabic
 * characters a line at 390 and 73.7 at 1440 (both inside 60-75 at the wide
 * end and comfortably under it on a phone), the eyebrow budget is 2 against
 * a ceiling of 3, and there is no invented proof anywhere on the page: no
 * testimonial, no logo wall, no counts, no ratings.
 *
 */

import AboutView from "@/components/zenya/about/AboutView"

export default function AboutPage() {
  return <AboutView />
}
