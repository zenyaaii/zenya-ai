import { test, expect } from '@playwright/test'
import { createOrGetUser, deleteUserById } from '../helpers/db'

// Logout, isolated on its OWN user so signing out (which revokes that user's
// sessions) can never touch the shared test-user session other specs rely on.
// Runs in the `public` project (no storageState) — it logs in fresh itself.

const EMAIL = 'e2e-logout@zenya-test.local'
const PW = 'Zenya-E2E-logout-5m8!q'
let uid: string

test.beforeAll(async () => { uid = await createOrGetUser(EMAIL, PW) })
test.afterAll(async () => { await deleteUserById(uid) })

test('user can log out and the session is cleared', async ({ page }) => {
  // 1. Log in through the UI.
  await page.goto('/login?mode=signin', { waitUntil: 'networkidle' })
  await page.fill('#email', EMAIL)
  await page.fill('#password', PW)
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click()
  await page.waitForURL('**/dashboard**', { timeout: 30_000 })

  // 2. Open the account menu and sign out.
  await page.getByRole('button', { name: 'قائمة الحساب' }).click()
  await page.getByRole('menuitem', { name: 'تسجيل الخروج' }).click()

  // 3. We should leave the dashboard (signOut → router.push('/')).
  await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'), { timeout: 15_000 })

  // 4. The session must actually be gone: an authenticated API now rejects us.
  //    (This is the real security property; the /dashboard shell itself does
  //    not hard-redirect anonymous users — its data APIs 401 instead.)
  const res = await page.request.get('/api/themes')
  expect(res.status(), 'session should be cleared → 401').toBe(401)
})
