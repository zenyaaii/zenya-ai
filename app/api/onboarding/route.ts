import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Per-user onboarding state — the "seen" flags of the first-visit tour and of
 * the dashboard tour, and the launch-plan checklist ticks. These used to live
 * in localStorage, which reset on every new device; now they ride on the
 * profile row so they follow the owner everywhere.
 *
 * GET   → { welcomeSeen, introSeen, launchPlan }
 * PATCH → accepts { welcomeSeen?, introSeen?, launchPlan? } and persists
 *         whatever is sent.
 *
 * introSeen (the 2026-10 dashboard tour, intro/DashIntro) has no column of its
 * own: it is a reserved key inside launch_plan. The launch plan is written
 * whole by the checklist, which never sees that key, so a launchPlan write
 * carries the stored one over and GET leaves it out of launchPlan.
 */

type LaunchPlan = Record<string, boolean>

const INTRO_KEY = '_intro_v2'

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

  const { [INTRO_KEY]: introSeen, ...launchPlan } = sanitizePlan(data?.launch_plan)
  return NextResponse.json({
    welcomeSeen: !!data?.welcome_tour_seen,
    introSeen: !!introSeen,
    launchPlan,
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

  const introSent = typeof body?.introSeen === 'boolean'
  if (body?.launchPlan !== undefined || introSent) {
    const { data } = await supabase
      .from('profiles')
      .select('launch_plan')
      .eq('id', user.id)
      .maybeSingle()
    const stored = sanitizePlan(data?.launch_plan)
    const plan = body?.launchPlan !== undefined ? sanitizePlan(body.launchPlan) : stored
    delete plan[INTRO_KEY]
    const intro = introSent ? body.introSeen : !!stored[INTRO_KEY]
    patch.launch_plan = intro ? { ...plan, [INTRO_KEY]: true } : plan
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
