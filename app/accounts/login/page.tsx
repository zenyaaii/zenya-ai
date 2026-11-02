import { dashFont } from '@/components/app/dash-font'
import { Portal } from '@/components/zenya/redesign/s11'
import { portalUser } from '../portal-user'

export const dynamic = 'force-dynamic'

/** accounts.beynoun.com/login — the «ليل» door. With a live session it opens on the chooser, as the previous card did. */
export default async function AccountsLoginPage() {
  const { user, dash } = await portalUser()
  return <div className={dashFont.variable}><Portal mode="signin" user={user} dash={dash} /></div>
}
