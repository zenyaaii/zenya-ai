import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { ensureTestUser, TEST_USER } from './helpers/testUser'

const authFile = path.join(__dirname, '.auth', 'user.json')

setup('create test user and sign in', async ({ page }) => {
  // 1. Ensure the confirmed account exists (service-role, no inbox needed).
  const userId = await ensureTestUser()
  expect(userId).toBeTruthy()

  // 2. Sign in through the real login UI so we get a genuine Supabase cookie.
  await page.goto('/login?mode=signin', { waitUntil: 'networkidle' })
  // The form is behind <Suspense> — wait until it's actually interactive.
  await expect(page.locator('#email')).toBeVisible({ timeout: 20_000 })
  await page.fill('#email', TEST_USER.email)
  await page.fill('#password', TEST_USER.password)
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click()

  // 3. Successful sign-in redirects to the dashboard. Generous timeout: the
  //    first hit compiles the dashboard routes on a cold dev server. If the
  //    credentials were wrong we'd see the inline error instead of hanging.
  const errorBox = page.locator('text=/حدث خطأ|غير صحيح|مسجّل|صالح/')
  await Promise.race([
    page.waitForURL('**/dashboard**', { timeout: 45_000 }),
    errorBox.waitFor({ state: 'visible', timeout: 45_000 }).then(async () => {
      throw new Error(`Login failed: ${await errorBox.first().innerText()}`)
    }),
  ])
  expect(page.url()).toContain('/dashboard')

  // 4. Persist the session for the authed project.
  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
