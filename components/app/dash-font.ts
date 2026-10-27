import { Amiri, Markazi_Text } from 'next/font/google'

/**
 * The dashboard's two faces.
 *
 * The house face is Thmanyah (serif display for headings, serif text for
 * everything else). Its licence does not allow shipping the font files on a
 * page where a visitor could pull them out, so the dashboard never serves
 * them: DASH_THEME_CSS reads Thmanyah with local() only, which shows it on a
 * device that has it installed. Everyone else gets these two free faces,
 * picked because they sit closest to Thmanyah's shapes: Amiri for headings,
 * Markazi Text for the rest.
 *
 * Two next/font objects, one class string. Every place that needs the faces
 * (the shell, and any Radix portal that lands outside it) adds
 * dashFont.variable and gets both.
 */
const head = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-amiri',
})

const text = Markazi_Text({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-markazi',
})

export const dashFont = { variable: `${head.variable} ${text.variable}` }
