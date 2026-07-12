import { test, expect, type Page } from '@playwright/test'

// Every template's builder page must actually render (not white-screen / crash).
// The 8 generators each have a /theme/new/<key> wizard; /build is the dropship
// flow. We load each and assert real content + no uncaught errors.

const PAGES = [
  '/theme/new',
  '/theme/new/services',
  '/theme/new/studio',
  '/theme/new/wellness',
  '/theme/new/atlas',
  '/theme/new/collective',
  '/theme/new/lookbook',
  '/theme/new/restaurant',
  '/build',
]

const IGNORABLE = [/favicon/i, /Download the React DevTools/i, /analytics|gtag|posthog/i, /ResizeObserver/i]

function watchConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (!IGNORABLE.some((re) => re.test(t))) errors.push(t)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

for (const path of PAGES) {
  test(`builder page ${path} renders`, async ({ page }) => {
    const errors = watchConsole(page)
    const res = await page.goto(path, { waitUntil: 'networkidle' })
    expect(res!.status(), `status for ${path}`).toBeLessThan(400)
    expect(page.url(), `${path} should not bounce to login`).not.toContain('/login')
    // Real UI, not a Next error boundary.
    await expect(page.locator('text=/Application error|Internal Server Error/i')).toHaveCount(0)
    await expect(page.locator('body')).not.toBeEmpty()
    await expect(page.locator('body')).toContainText(/[؀-ۿ]/) // Arabic content present
    expect(errors, `console errors on ${path}:\n${errors.join('\n')}`).toEqual([])
  })
}
