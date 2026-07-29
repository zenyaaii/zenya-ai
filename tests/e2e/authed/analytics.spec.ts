import { test, expect } from '@playwright/test'

// Runs with the saved session (authed project). The test user may have zero
// traffic — that is the point of several of these: the dashboard must render
// honest empty states, never a broken chart or a crash.

test('analytics page loads and shows the KPI rail', async ({ page }) => {
  const res = await page.goto('/dashboard/analytics', { waitUntil: 'networkidle' })
  expect(res!.status()).toBeLessThan(400)
  expect(page.url()).not.toContain('/login')
  await expect(page.locator('text=/Application error|Internal Server Error/i')).toHaveCount(0)
  // The six-tile KPI rail is always present, even at zero.
  await expect(page.getByText('الزوّار', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('التحويلات', { exact: true }).first()).toBeVisible()
})

test('every tab renders without error', async ({ page }) => {
  await page.goto('/dashboard/analytics', { waitUntil: 'networkidle' })
  // Scope to the main section tablist — the trend chart has its own metric
  // tablist that reuses some of the same Arabic labels.
  const tabs = page.getByRole('tablist', { name: 'أقسام التحليلات' })
  for (const label of ['الزوّار', 'المصادر', 'المحتوى', 'التحويلات', 'البحث', 'مباشر', 'رؤى', 'نظرة عامة']) {
    await tabs.getByRole('tab', { name: label }).click()
    await expect(page.locator('text=/Application error|Internal Server Error/i')).toHaveCount(0)
    await expect(page.locator('body')).not.toBeEmpty()
  }
})

test('the date range control switches without reloading to an error', async ({ page }) => {
  await page.goto('/dashboard/analytics', { waitUntil: 'networkidle' })
  for (const label of ['7 أيام', '90 يومًا', '24 ساعة', '30 يومًا']) {
    await page.getByRole('button', { name: label }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('text=/Application error/i')).toHaveCount(0)
  }
})

test('the bot filter toggle is present and flips its label', async ({ page }) => {
  await page.goto('/dashboard/analytics', { waitUntil: 'networkidle' })
  const toggle = page.getByRole('button', { name: /روبوت/ })
  await expect(toggle).toBeVisible()
  await expect(page.getByText('بلا روبوتات')).toBeVisible()
  await toggle.click()
  await expect(page.getByText('الروبوتات مُضمَّنة')).toBeVisible()
})

test('deep-linking to a tab via ?tab= works (the Visitors merge)', async ({ page }) => {
  await page.goto('/dashboard/analytics?tab=realtime', { waitUntil: 'networkidle' })
  const tabs = page.getByRole('tablist', { name: 'أقسام التحليلات' })
  await expect(tabs.getByRole('tab', { name: 'مباشر' })).toHaveAttribute('aria-selected', 'true')
})

test('/dashboard/visitors redirects into the realtime tab', async ({ page }) => {
  await page.goto('/dashboard/visitors', { waitUntil: 'networkidle' })
  expect(page.url()).toContain('/dashboard/analytics')
  expect(page.url()).toContain('tab=realtime')
})

test('CSV export returns an attachment, not HTML', async ({ page, request }) => {
  // Reuses the page's authenticated cookies for the API request.
  await page.goto('/dashboard/analytics', { waitUntil: 'networkidle' })
  const res = await request.get('/api/analytics/export?dataset=daily&range=30d')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/csv')
  expect(res.headers()['content-disposition']).toContain('attachment')
})
