import { IBM_Plex_Sans_Arabic } from 'next/font/google'

/**
 * The dashboard's chrome face.
 *
 * The house style splits type in two: Tajawal carries content (it is already
 * the body face, set in globals.css) and IBM Plex Sans Arabic carries chrome
 * - the rail, the bar, the menus - so the furniture reads quieter than the
 * thing it frames.
 *
 * next/font rather than the @import in globals.css: it self-hosts the face and
 * preloads it, so adding a fourth family to this surface does not add a
 * render-blocking request to fonts.googleapis.com. Same pattern the candidate
 * set uses (app/demo/access, /build, /pricing, /templates).
 *
 * IT LIVES IN ITS OWN MODULE because two components need it. AppShell puts the
 * variable on the shell, where everything under it inherits; the Topbar's
 * account menu renders through a Radix PORTAL, which lands outside the shell
 * in the DOM and therefore inherits nothing from it - not this variable and
 * not the token block either. The menu has to carry both itself.
 */
export const chromeFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-chrome',
})
