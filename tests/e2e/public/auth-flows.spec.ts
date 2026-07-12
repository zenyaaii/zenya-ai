import { test, expect } from '@playwright/test'
import { ensureTestUser, TEST_USER } from '../helpers/testUser'

// Auth surface beyond the happy-path login (which the setup project covers):
// signup validation, duplicate-email handling, and password reset.

test.beforeAll(async () => {
  await ensureTestUser() // guarantees the duplicate-email case has a real hit
})

test('signup requires accepting the terms (submit disabled)', async ({ page }) => {
  await page.goto('/login?mode=signup', { waitUntil: 'networkidle' })
  await page.fill('#fullName', 'E2E Person')
  await page.fill('#email', `e2e-new-${Date.now()}@zenya-test.local`)
  await page.fill('#password', 'a-strong-pw-123')
  // Terms unchecked → the submit button is disabled.
  const submit = page.getByRole('button', { name: 'إنشاء حساب' })
  await expect(submit).toBeDisabled()
})

test('signup rejects a too-short password', async ({ page }) => {
  await page.goto('/login?mode=signup', { waitUntil: 'networkidle' })
  await page.fill('#fullName', 'E2E Person')
  await page.fill('#email', `e2e-new-${Date.now()}@zenya-test.local`)
  await page.fill('#password', '123') // < 6 chars
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'إنشاء حساب' }).click()
  await expect(page.getByText(/يجب ألّا تقلّ كلمة المرور/)).toBeVisible()
})

test('signing up with an existing email is handled (not a dead end)', async ({ page }) => {
  await page.goto('/login?mode=signup', { waitUntil: 'networkidle' })
  await page.fill('#fullName', 'E2E Person')
  await page.fill('#email', TEST_USER.email) // already registered
  await page.fill('#password', 'a-strong-pw-123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'إنشاء حساب' }).click()
  // App detects the duplicate and tells the user to sign in instead.
  await expect(page.locator('text=/مسجّل بالفعل|سجّل الدخول/')).toBeVisible({ timeout: 15_000 })
})

test('password reset shows a confirmation', async ({ page }) => {
  await page.goto('/login?mode=forgot', { waitUntil: 'networkidle' })
  await page.fill('#email', TEST_USER.email)
  await page.getByRole('button', { name: 'إرسال رابط التعيين' }).click()
  await expect(page.locator('text=/تم إرسال|تحقق من بريدك/')).toBeVisible({ timeout: 15_000 })
})
