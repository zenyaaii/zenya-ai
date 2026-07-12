import { createClient } from '@supabase/supabase-js'

/**
 * A stable throwaway account used across the authed E2E suite. Created (and
 * email-confirmed) via the service-role key so no inbox is involved. Kept at
 * a fixed address so re-runs reuse the same profile/themes instead of
 * littering the DB with new users.
 */
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e-runner@zenya-test.local',
  password: process.env.E2E_TEST_PASSWORD || 'Zenya-E2E-pw-9f3!x',
  fullName: 'Zenya E2E Runner',
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'E2E: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — ' +
        'check .env.local is loaded.'
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isDuplicate(err: { status?: number; code?: string; message?: string } | null): boolean {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  return (
    err.code === 'email_exists' ||
    err.status === 422 ||
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('already exists')
  )
}

/**
 * Idempotently ensure the confirmed test user exists. Create-first: one admin
 * call in the common case. On "already registered" we're done — the account
 * was created with this same password on a prior run, so sign-in will work.
 * Retries transient upstream errors (Supabase can return an HTML 5xx page).
 * Returns the user id when we have it, or the email as a stable fallback.
 */
export async function ensureTestUser(): Promise<string> {
  const admin = adminClient()
  let lastErr: unknown = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true,
        user_metadata: { full_name: TEST_USER.fullName },
      })
      if (!error) return data.user!.id
      if (isDuplicate(error as any)) return TEST_USER.email // already provisioned
      lastErr = error
    } catch (e) {
      lastErr = e // transient (e.g. HTML gateway page) — retry
    }
    await sleep(1000 * attempt)
  }

  throw new Error(
    `E2E: could not provision test user after 3 attempts: ${
      (lastErr as any)?.message || String(lastErr)
    }`
  )
}
