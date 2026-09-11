import { redirect } from 'next/navigation'

export const metadata = { title: 'الحساب', robots: { index: false, follow: false } }

/**
 * /account was an orphan: eighteen lines that read an e-mail out of
 * localStorage and printed it under a heading. Nothing in the app linked to
 * it, it showed "زائر" to anyone whose browser had not been through the old
 * sign-in, and it knew nothing about the account it claimed to describe —
 * not the plan, not the sites, not the billing.
 *
 * It is not deleted, because a URL that has been live can be in somebody's
 * history or somebody's link. It points at the dashboard, which is the screen
 * it was pretending to be.
 */
export default function AccountRedirect() {
  redirect('https://dashboard.zenyaai.co')
}
