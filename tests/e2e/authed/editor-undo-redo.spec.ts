import { test, expect } from '@playwright/test'
import { TEST_USER } from '../helpers/testUser'
import { getUserIdByEmail, deleteThemesByPrefix, setProfile, adminDb } from '../helpers/db'
import { SERVICE_MOCK_CONTENT } from '../../../utils/services/mock-content'

// Drives the real ThemeEditor UI to prove undo/redo works end-to-end:
// edit a field → undo reverts it → redo re-applies it. (Backend autosave +
// AI rewrite are covered separately in editor.spec.ts.)

const PREFIX = 'E2E-UNDO-'
let userId: string
let themeId: string

test.beforeAll(async () => {
  userId = await getUserIdByEmail(TEST_USER.email)
  await setProfile(userId, { plan: 'pro', is_pro: true, trial_themes_used: 0 })
  await deleteThemesByPrefix(userId, PREFIX)
  // The editor requires content[contentKey] ('services') — seed a real,
  // fully-populated services theme so the field panels render.
  const { data, error } = await adminDb()
    .from('themes')
    .insert({
      user_id: userId,
      product_name: `${PREFIX}draft`,
      template_type: 'services',
      content: { services: SERVICE_MOCK_CONTENT, style_preset: 'cobalt' },
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  themeId = data.id
})

test.afterAll(async () => {
  await deleteThemesByPrefix(userId, PREFIX)
})

test('editor undo reverts an edit and redo re-applies it', async ({ page }) => {
  await page.goto(`/preview/services/${themeId}/edit`, { waitUntil: 'networkidle' })

  // exact match: the inline AI-rewrite buttons are labelled "إعادة الصياغة…",
  // which a substring match on "إعادة" would also (wrongly) catch.
  const undo = page.getByRole('button', { name: 'تراجع', exact: true })
  const redo = page.getByRole('button', { name: 'إعادة', exact: true })

  // Editor loaded; nothing edited yet → undo is disabled.
  await expect(undo).toBeVisible({ timeout: 20_000 })
  await expect(undo).toBeDisabled()

  // Open the first section panel so its fields render, then grab the first
  // editable text field in the control column. FieldText renders a type-less
  // <input>; the preview is an iframe, so these only hit the editor's inputs.
  await page.locator('aside button').first().click()
  const field = page
    .locator('input:not([type]):visible, input[type="text"]:visible, textarea:visible')
    .first()
  await expect(field).toBeVisible({ timeout: 10_000 })

  const original = (await field.inputValue()) ?? ''
  const edited = `${original} — تعديل E2E`
  await field.fill(edited)
  await field.blur()

  // The edit registered in history → undo becomes available.
  await expect(undo).toBeEnabled()

  // Undo → the field goes back to its original value.
  await undo.click()
  await expect(field).toHaveValue(original)

  // Redo → the edit comes back.
  await expect(redo).toBeEnabled()
  await redo.click()
  await expect(field).toHaveValue(edited)
})
