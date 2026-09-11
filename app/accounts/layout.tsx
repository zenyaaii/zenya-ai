import { ReactNode } from 'react'
import { getT } from '@/lib/i18n/server'
import { CHROME_CSS } from '@/components/zenya/chrome/tokens'
import { ACCOUNTS_CSS } from './styles'

/** Title follows the viewer's locale; the portal is noindex either way. */
export function generateMetadata() {
  const { t } = getT()
  return {
    title: t.accounts.title,
    robots: { index: false, follow: false },
  }
}

/**
 * accounts.zenyaai.co — the ground the portal stands on.
 *
 * IT USED TO MOUNT AccountsBackground: three blurred aurora orbs drifting on
 * 26-, 32- and 38-second loops, a moving mesh, and two sparkles, over a cream
 * gradient. That component is left in the tree but nothing imports it now.
 * The house ground is flat #fafafa, and the reason is not only taste: the
 * portal is the screen where someone reads a password field, and six elements
 * animating behind it forever is the opposite of what that screen is for.
 *
 * The tokens are mounted here rather than per page so the three cards and the
 * chooser all read the same definitions. .zx-root is the scope
 * components/zenya/chrome/tokens.ts declares them on, so the ground carries
 * both classes.
 */
export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="zx-root zn-ground" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CHROME_CSS + ACCOUNTS_CSS }} />
      {children}
    </main>
  )
}
