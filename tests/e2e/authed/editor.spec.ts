import { test, expect } from '@playwright/test'
import { TEST_USER } from '../helpers/testUser'
import { getUserIdByEmail, insertTheme, deleteThemesByPrefix, setProfile } from '../helpers/db'

// The editor's backend contract: autosave (PATCH persists content) and the
// inline AI copywriter (/api/ai/rewrite). Undo/redo is purely client-side and
// not exercised here.

const PREFIX = 'E2E-EDITOR-'
let userId: string
let themeId: string

test.beforeAll(async () => {
  userId = await getUserIdByEmail(TEST_USER.email)
  // Uncap before seeding — this insert isn't a quota test, and the free-plan
  // trigger would otherwise count it against the trial.
  await setProfile(userId, { plan: 'pro', is_pro: true, trial_themes_used: 0 })
  await deleteThemesByPrefix(userId, PREFIX)
  themeId = await insertTheme(userId, `${PREFIX}draft`)
})

test.afterAll(async () => {
  await deleteThemesByPrefix(userId, PREFIX)
})

test('autosave: PATCH persists edited content and name', async ({ request }) => {
  const newContent = { business_type: 'services', hero: { headline: 'عنوان محرَّر' } }
  const patch = await request.patch(`/api/themes/${themeId}`, {
    data: { content: newContent, product_name: `${PREFIX}renamed` },
  })
  expect(patch.status()).toBe(200)
  expect((await patch.json()).ok).toBeTruthy()

  // Read it back — the edit must have persisted.
  const get = await request.get(`/api/themes/${themeId}`)
  expect(get.status()).toBe(200)
  const theme = (await get.json()).theme
  expect(theme.product_name).toBe(`${PREFIX}renamed`)
  expect(theme.content?.hero?.headline).toBe('عنوان محرَّر')
})

test('PATCH with nothing to update is rejected', async ({ request }) => {
  const res = await request.patch(`/api/themes/${themeId}`, { data: {} })
  expect(res.status()).toBe(400)
})

test('AI rewrite returns usable Arabic variants @slow', async ({ request }) => {
  test.setTimeout(60_000)
  const res = await request.post('/api/ai/rewrite', {
    timeout: 40_000,
    data: {
      themeName: 'Services',
      businessType: 'services',
      brand: { name: 'ورشة النخبة', category: 'صيانة سيارات' },
      voiceSample: ['خدمة صيانة موثوقة في الرياض'],
      panelLabel: 'Hero',
      fieldLabel: 'Headline',
      current: 'صيانة سيارتك بأيدٍ خبيرة',
      mode: 'improve',
      variants: 2,
    },
  })
  expect(res.status()).toBe(200)
  const variants = (await res.json()).variants
  expect(Array.isArray(variants)).toBeTruthy()
  expect(variants.length).toBeGreaterThan(0)
  expect(String(variants[0])).toMatch(/[؀-ۿ]/) // Arabic
})
