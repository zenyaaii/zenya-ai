import { test, expect } from '@playwright/test'
import { TEST_USER } from '../helpers/testUser'
import { getUserIdByEmail, setProfile, deleteThemesByPrefix, getProfile } from '../helpers/db'

// Real entitlement enforcement — we drive actual theme SAVES (POST /api/themes,
// which fires the enforce_theme_quota trigger) at each plan level and assert
// the limit behaves. This is the coverage that was missing before.

const PREFIX = 'E2E-QUOTA-'
let userId: string

function themeBody(name: string) {
  return {
    productName: name,
    productUrl: '',
    images: [],
    primaryColor: '#123456',
    secondaryColor: '#abcdef',
    content: { business_type: 'e2e', headline: 'test' },
  }
}

test.beforeAll(async () => {
  userId = await getUserIdByEmail(TEST_USER.email)
})

test.afterAll(async () => {
  // Leave the account clean: remove test themes, reset to a fresh free trial.
  await deleteThemesByPrefix(userId, PREFIX)
  await setProfile(userId, { plan: 'free', is_pro: false, has_hosting: false, trial_themes_used: 0, trial_themes_limit: 2 })
})

test('FREE plan is hard-capped at the trial limit (2), enforced on save', async ({ request }) => {
  await deleteThemesByPrefix(userId, PREFIX)
  await setProfile(userId, { plan: 'free', is_pro: false, has_hosting: false, trial_themes_used: 0, trial_themes_limit: 2 })

  // First two saves succeed and consume the trial.
  for (let i = 1; i <= 2; i++) {
    const res = await request.post('/api/themes', { data: themeBody(`${PREFIX}free-${i}`) })
    expect(res.status(), `free save #${i} should succeed`).toBe(200)
  }

  // Third save must be rejected by the quota trigger (402 limit_reached).
  const third = await request.post('/api/themes', { data: themeBody(`${PREFIX}free-3`) })
  expect(third.status(), 'free save #3 must be blocked').toBe(402)
  expect((await third.json()).error).toBe('limit_reached')

  // Counter landed exactly at the limit.
  const prof = await getProfile(userId)
  expect(prof?.trial_themes_used).toBe(2)
})

test('PRO plan generates unlimited themes (no cap)', async ({ request }) => {
  await deleteThemesByPrefix(userId, PREFIX)
  await setProfile(userId, { plan: 'pro', is_pro: true, has_hosting: true, trial_themes_used: 0, trial_themes_limit: 2 })

  // Save well past the free cap — every one must succeed.
  for (let i = 1; i <= 4; i++) {
    const res = await request.post('/api/themes', { data: themeBody(`${PREFIX}pro-${i}`) })
    expect(res.status(), `pro save #${i} should succeed`).toBe(200)
  }

  // Pro is not a trial plan → the trial counter must NOT be consumed.
  const prof = await getProfile(userId)
  expect(prof?.trial_themes_used).toBe(0)
})

test('STARTER plan also generates unlimited themes (both paid tiers)', async ({ request }) => {
  await deleteThemesByPrefix(userId, PREFIX)
  await setProfile(userId, { plan: 'starter', is_pro: true, has_hosting: false, trial_themes_used: 0, trial_themes_limit: 2 })

  for (let i = 1; i <= 3; i++) {
    const res = await request.post('/api/themes', { data: themeBody(`${PREFIX}starter-${i}`) })
    expect(res.status(), `starter save #${i} should succeed`).toBe(200)
  }
})
