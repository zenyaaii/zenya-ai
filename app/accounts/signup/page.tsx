import { dashFont } from '@/components/app/dash-font'
import { Portal } from '@/components/zenya/redesign/s11'
import { portalUser } from '../portal-user'

export const dynamic = 'force-dynamic'

/** accounts.beynoun.com/signup — the «ليل» door on «حساب جديد». */
export default async function AccountsSignupPage() {
  const { user, dash } = await portalUser()
  return <div className={dashFont.variable}><Portal mode="signup" user={user} dash={dash} /></div>
}
