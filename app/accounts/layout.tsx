import { ReactNode } from 'react'
import { getT } from '@/lib/i18n/server'
import { CHROME_CSS } from '@/components/zenya/chrome/tokens'
import { ACCOUNTS_CSS } from './styles'
import AccountsHeader from '@/components/accounts/AccountsHeader'

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
 *
 * THE HEADER IS MOUNTED HERE TOO, so it is the same object on all four
 * screens and does not have to be remembered per page. It draws its links
 * against the apex rather than relatively — on this host middleware rewrites
 * every unrouted path under /accounts, so a relative /pricing would 404. See
 * components/accounts/AccountsHeader.
 */
export default function AccountsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="zx-root zn-ground" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CHROME_CSS + ACCOUNTS_CSS }} />
      <AccountsHeader />
      <main className="zn-body">{children}</main>
    </div>
  )
}
