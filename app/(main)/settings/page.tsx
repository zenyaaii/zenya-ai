import { redirect } from 'next/navigation'

export const metadata = { title: 'الإعدادات', robots: { index: false, follow: false } }

/**
 * /settings is a redirect, and the URL has to keep existing.
 *
 * It is cited by name in four published legal documents — the Arabic and
 * English privacy policies name it as the Article 17 self-service erasure
 * path, and both terms name it as where an account is deleted. Removing the
 * URL would make those four documents wrong, so it stays and points at the
 * one place the settings actually live.
 *
 * They live in the dashboard. app/(app)/dashboard/settings renders the same
 * AccountSettings component this page used to, inside the chrome that was
 * built for it, and it is the copy that gets maintained. Two addresses for
 * one screen is how they drift.
 *
 * A signed-out visitor lands on the dashboard host and is sent to sign in,
 * which is correct: nobody deletes an account without proving it is theirs.
 */
export default function SettingsRedirect() {
  redirect('https://dashboard.zenyaai.co/settings')
}
