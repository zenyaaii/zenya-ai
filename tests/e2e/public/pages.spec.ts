import { test, expect, type Page } from '@playwright/test'

// Public pages that must render for an anonymous visitor. [path, a string that
// must appear in the rendered HTML to prove it's the real page, not an error].
const PAGES: Array<[string, RegExp]> = [
  ['/', /زينيا/],
  ['/about', /زينيا|من نحن|قصّة|قصة/],
  ['/features', /ميزات|المميزات|زينيا/],
  ['/pricing', /الأسعار|السعر|شهري|مجان/],
  ['/faq', /الأسئلة|سؤال|شائع/],
  ['/contact', /تواصل|راسلنا|البريد/],
  ['/themes', /قوالب|قالب/],
  ['/compare', /مقارنة|زينيا/],
  ['/privacy', /الخصوصية/],
  ['/terms', /الشروط|الخدمة/],
  ['/cookies', /الكوكيز|ملفات|تعريف/],
  ['/refund', /الاسترداد|استرجاع|المبلغ/],
  ['/login', /تسجيل الدخول|أهلًا/],
]

/** Console errors that are noise, not real failures. */
const IGNORABLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /Failed to load resource.*(analytics|gtag|posthog)/i,
]

function watchConsole(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (IGNORABLE.some((re) => re.test(text))) return
    errors.push(text)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  return errors
}

for (const [pathname, needle] of PAGES) {
  test(`public page ${pathname} renders cleanly`, async ({ page }) => {
    const errors = watchConsole(page)
    const res = await page.goto(pathname, { waitUntil: 'networkidle' })

    expect(res, `no response for ${pathname}`).toBeTruthy()
    expect(res!.status(), `bad status for ${pathname}`).toBeLessThan(400)

    // Real content, not a Next error boundary.
    await expect(page.locator('body')).toContainText(needle)
    await expect(page.locator('text=/Application error|Internal Server Error|404/i')).toHaveCount(0)

    expect(errors, `console errors on ${pathname}:\n${errors.join('\n')}`).toEqual([])
  })
}

test('pricing shows real plans and prices', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'networkidle' })
  // The two live subscription tiers.
  await expect(page.getByText(/14\.99/).first()).toBeVisible()
  await expect(page.getByText(/24\.99/).first()).toBeVisible()
})

test('home has a primary build CTA that routes to signup/build', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  const cta = page.getByRole('link', { name: /ابدأ|أنشئ|جرّب|ابنِ|مجان/ }).first()
  await expect(cta).toBeVisible()
  const href = await cta.getAttribute('href')
  expect(href).toMatch(/\/(build|login|signup|pricing)/)
})
