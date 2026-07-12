import { test, expect, request as pwRequest } from '@playwright/test'
import {
  createOrGetUser, deleteUserById, insertTheme, insertDomain, adminDb,
} from '../helpers/db'
import { getAccessToken } from '../helpers/session'

// Cross-user data isolation. User A is the signed-in test user (this project's
// saved session). User B is a freshly provisioned stranger who owns a theme and
// a domain. A must not be able to see or touch B's data — via the app's API,
// OR by talking to the database directly with A's own token (real RLS).

const USER_B_EMAIL = 'e2e-stranger@zenya-test.local'
const USER_B_PW = 'Zenya-E2E-stranger-7k2!z'

let bUserId: string
let bThemeId: string
let bDomainId: string

test.beforeAll(async () => {
  bUserId = await createOrGetUser(USER_B_EMAIL, USER_B_PW)
  // Clean any leftovers from a prior run, then seed fresh rows owned by B.
  await adminDb().from('themes').delete().eq('user_id', bUserId)
  await adminDb().from('domains').delete().eq('user_id', bUserId)
  bThemeId = await insertTheme(bUserId, 'E2E-RLS-stranger-theme')
  bDomainId = await insertDomain(bUserId, `e2e-rls-${Date.now()}.com`, bThemeId)
})

test.afterAll(async () => {
  await adminDb().from('domains').delete().eq('user_id', bUserId)
  await adminDb().from('themes').delete().eq('user_id', bUserId)
  await deleteUserById(bUserId)
})

test.describe('API surface — user A cannot reach user B resources', () => {
  test("GET another user's theme returns not_found", async ({ request }) => {
    const res = await request.get(`/api/themes/${bThemeId}`)
    expect(res.status()).toBe(404)
  })

  test("PATCH another user's theme is forbidden", async ({ request }) => {
    const res = await request.patch(`/api/themes/${bThemeId}`, {
      data: { content: { hacked: true }, product_name: 'PWNED' },
    })
    expect(res.status()).toBe(403)
  })

  test("GET another user's domain is forbidden", async ({ request }) => {
    const res = await request.get(`/api/domains/${bDomainId}`)
    expect(res.status()).toBe(403)
  })

  test("DELETE another user's domain is forbidden", async ({ request }) => {
    const res = await request.delete(`/api/domains/${bDomainId}`)
    expect(res.status()).toBe(403)
  })

  test("A's theme list does not include B's theme", async ({ request }) => {
    const res = await request.get('/api/themes')
    expect(res.status()).toBe(200)
    const ids = ((await res.json()).themes || []).map((t: any) => t.id)
    expect(ids).not.toContain(bThemeId)
  })

  // Confirm the seed is real: B's theme DOES exist (service-role can see it),
  // so the 404/403 above are isolation, not a missing row.
  test('sanity: B\'s theme really exists', async () => {
    const { data } = await adminDb().from('themes').select('id').eq('id', bThemeId).maybeSingle()
    expect(data?.id).toBe(bThemeId)
  })
})

test.describe('Raw database RLS — A\'s own JWT cannot read B\'s rows', () => {
  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const ANON =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

  async function asUserA() {
    return pwRequest.newContext({
      baseURL: SUPA,
      extraHTTPHeaders: {
        apikey: ANON,
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
  }

  test('themes RLS blocks reading B\'s row', async () => {
    const ctx = await asUserA()
    const res = await ctx.get(`/rest/v1/themes?id=eq.${bThemeId}&select=id,user_id`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual([]) // RLS filters it out entirely
    await ctx.dispose()
  })

  test('domains RLS blocks reading B\'s row', async () => {
    const ctx = await asUserA()
    const res = await ctx.get(`/rest/v1/domains?id=eq.${bDomainId}&select=id,user_id`)
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual([])
    await ctx.dispose()
  })

  test('RLS blocks A from UPDATING B\'s theme directly', async () => {
    const ctx = await asUserA()
    const res = await ctx.patch(`/rest/v1/themes?id=eq.${bThemeId}`, {
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      data: { product_name: 'PWNED-VIA-RLS' },
    })
    // RLS turns the update into a no-op: 200 with an empty representation.
    expect(res.status()).toBeLessThan(400)
    expect(await res.json()).toEqual([])
    // And confirm via service-role that B's row is untouched.
    const { data } = await adminDb().from('themes').select('product_name').eq('id', bThemeId).maybeSingle()
    expect(data?.product_name).toBe('E2E-RLS-stranger-theme')
    await ctx.dispose()
  })
})
