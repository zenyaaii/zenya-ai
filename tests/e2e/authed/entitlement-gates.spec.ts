import { test, expect } from '@playwright/test'
import { TEST_USER } from '../helpers/testUser'
import { getUserIdByEmail, setProfile, insertTheme, deleteThemesByPrefix, adminDb } from '../helpers/db'

// Behavioral proof of the capability gates that separate the tiers (2026-08-18):
//   • Publish on subdomain → base tier (Entry unlocked / grandfathered / paid);
//     a locked account (not entry_unlocked) is blocked.
//   • Export to Shopify    → requires is_pro (any paid; Entry/Free blocked)
// We flip the test user's plan via service-role and drive the real endpoints.

const PREFIX = 'E2E-GATE-'
let userId: string
let hostableThemeId: string

test.beforeAll(async () => {
  userId = await getUserIdByEmail(TEST_USER.email)
  // Uncap before seeding so the free-plan quota trigger doesn't reject the
  // setup insert (individual tests set the plan they need below).
  await setProfile(userId, { plan: 'pro', is_pro: true, trial_themes_used: 0 })
  await deleteThemesByPrefix(userId, PREFIX)
  // A hostable (services) theme so publish reaches the hosting gate.
  const { data, error } = await adminDb()
    .from('themes')
    .insert({
      user_id: userId,
      product_name: `${PREFIX}hostable`,
      template_type: 'services',
      content: { business_type: 'services' },
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  hostableThemeId = data.id
})

test.afterAll(async () => {
  await deleteThemesByPrefix(userId, PREFIX)
  await setProfile(userId, { plan: 'entry', is_pro: false, has_hosting: false, entry_unlocked: true, trial_themes_used: 0, trial_themes_limit: 2 })
})

test.describe('Publish gate (base tier can publish on subdomain)', () => {
  test('LOCKED account (not entry-unlocked) is blocked from publishing', async ({ request }) => {
    await setProfile(userId, { plan: 'free', is_pro: false, has_hosting: false, entry_unlocked: false })
    const res = await request.post(`/api/themes/${hostableThemeId}/publish`, {
      data: { slug: `e2e-gate-${Date.now()}` },
    })
    expect(res.status(), 'Locked account must be denied publish').toBe(402)
    expect((await res.json()).error).toBe('entry_required')
  })

  test('ENTRY (unlocked) can publish on its subdomain', async ({ request }) => {
    await setProfile(userId, { plan: 'entry', is_pro: false, has_hosting: false, entry_unlocked: true })
    const res = await request.post(`/api/themes/${hostableThemeId}/publish`, {
      data: { slug: `e2e-gate-${Date.now()}` },
    })
    expect(res.status(), 'Entry must pass the publish gate').toBe(200)
    expect((await res.json()).ok).toBeTruthy()
  })

  test('PRO can publish', async ({ request }) => {
    await setProfile(userId, { plan: 'pro', is_pro: true, has_hosting: true })
    const res = await request.post(`/api/themes/${hostableThemeId}/publish`, {
      data: { slug: `e2e-gate-${Date.now()}` },
    })
    expect(res.status(), 'Pro must pass the publish gate').toBe(200)
    expect((await res.json()).ok).toBeTruthy()
  })
})

test.describe('Shopify export gate (paid-only)', () => {
  test('ENTRY is blocked from Shopify export', async ({ request }) => {
    await setProfile(userId, { plan: 'entry', is_pro: false, has_hosting: false, entry_unlocked: true })
    const res = await request.get(`/api/themes/${hostableThemeId}/export-shopify`)
    expect(res.status(), 'Entry must be denied export').toBe(402)
    expect((await res.json()).error).toBe('pro_required')
  })

  test('PAID passes the export entitlement gate', async ({ request }) => {
    await setProfile(userId, { plan: 'pro', is_pro: true, has_hosting: true })
    const res = await request.get(`/api/themes/${hostableThemeId}/export-shopify`)
    // The services theme isn't a Shopify-exportable type, so after clearing the
    // entitlement gate it fails downstream — the point is it is NOT 402.
    expect(res.status(), 'paid must clear the entitlement gate').not.toBe(402)
  })
})
