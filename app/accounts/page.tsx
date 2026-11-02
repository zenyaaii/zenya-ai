import { dashFont } from '@/components/app/dash-font'
import { Portal } from '@/components/zenya/redesign/s11'
import { portalUser } from './portal-user'

export const dynamic = 'force-dynamic'

/**
 * Account chooser — the landing page of accounts.beynoun.com, in «ليل».
 *
 *  • Signed in  → "continue as <account>" (name + avatar) → dashboard,
 *    plus "use another account" and "sign out".
 *  • Signed out → the sign-in card, or the accounts this device used before
 *    if there are any.
 *
 * The previous client-side chooser read the session after load and showed a
 * spinner first; reading it here paints the right card straight away.
 */
export default async function AccountsChooserPage() {
  const { user, dash } = await portalUser()
  return <div className={dashFont.variable}><Portal mode="signin" user={user} dash={dash} /></div>
}
