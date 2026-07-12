import { test, expect, devices } from '@playwright/test'

// Arabic/RTL correctness + responsive integrity. (The product is light-only by
// design — no dark theme — so dark-mode is intentionally out of scope.)

const KEY_PAGES = ['/', '/pricing', '/features', '/login']

test.describe('RTL', () => {
  for (const path of KEY_PAGES) {
    test(`${path} is rendered right-to-left in Arabic`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      const dir = await page.locator('html').getAttribute('dir')
      const lang = await page.locator('html').getAttribute('lang')
      expect(dir).toBe('rtl')
      expect(lang).toBe('ar')
    })
  }
})

test.describe('Responsive — no horizontal overflow', () => {
  for (const path of ['/', '/pricing']) {
    test(`${path} does not scroll sideways on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(path, { waitUntil: 'networkidle' })
      const { scrollW, clientW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }))
      // Allow a 2px rounding tolerance.
      expect(scrollW, `${path} overflows: scrollW=${scrollW} clientW=${clientW}`).toBeLessThanOrEqual(clientW + 2)
    })
  }
})
