import { test, expect } from '@playwright/test'

// These run with the saved session (see playwright.config → authed project).
const DASH_PAGES = [
  '/dashboard',
  '/dashboard/sites',
  '/dashboard/domains',
  '/dashboard/billing',
  '/dashboard/settings',
]

for (const pathname of DASH_PAGES) {
  test(`authed: ${pathname} loads without bouncing to login`, async ({ page }) => {
    const res = await page.goto(pathname, { waitUntil: 'networkidle' })
    expect(res!.status()).toBeLessThan(400)
    // The gate is the real signal: an unauthenticated hit would redirect here.
    expect(page.url()).not.toContain('/login')
    await expect(page.locator('text=/Application error|Internal Server Error/i')).toHaveCount(0)
    await expect(page.locator('body')).not.toBeEmpty()
  })
}
