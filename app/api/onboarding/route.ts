import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Per-user onboarding state — the welcome tour "seen" flag and the launch-plan
 * checklist ticks. These used to live in localStorage, which reset on every new
 * device; now they ride on the profile row so they follow the owner everywhere.
 *
 * GET   → { welcomeSeen, launchPlan }
 * PATCH → accepts { welcomeSeen?, launchPlan? } and persists whatever is sent.
 */

type LaunchPlan = Record<string, boolean>

function sanitizePlan(input: unknown): LaunchPlan {
  if (!input || typeof input !== 'object') return {}
  const out: LaunchPlan = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof k === 'string' && k.length <= 32 && typeof v === 'boolean') out[k] = v
  }
  return out
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('welcome_tour_seen, launch_plan')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    welcomeSeen: !!data?.welcome_tour_seen,
    launchPlan: sanitizePlan(data?.launch_plan),
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body?.welcomeSeen === 'boolean') patch.welcome_tour_seen = body.welcomeSeen
  if (body?.launchPlan !== undefined) patch.launch_plan = sanitizePlan(body.launchPlan)

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
