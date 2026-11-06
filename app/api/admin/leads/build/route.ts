import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/admin-guard'
import { serviceClient } from '@/lib/handover'
import { BuildError, buildLeadSite } from '@/lib/lead-build'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const STEP_AR: Record<string, string> = { google: 'جلب بيانات Google', facts: 'قراءة البيانات', copy: 'كتابة النصوص', publish: 'النشر' }

/** «اعمل الموقع»: builds and publishes one lead's site under the admin's account. */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(); if (denied) return denied
  const { id } = await req.json().catch(() => ({} as any))
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 })
  const { data: { user } } = await createClient().auth.getUser()
  const { data: lead } = await serviceClient().from('leads').select('*').eq('id', id).maybeSingle()
  if (!lead) return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
  if (lead.site) return NextResponse.json({ error: 'له موقع بالفعل', site: lead.site }, { status: 409 })
  try {
    const out = await buildLeadSite(lead, user!.id)
    const { data: fresh } = await serviceClient().from('leads').select('*').eq('id', id).single()
    return NextResponse.json({ ...out, lead: fresh })
  } catch (e: any) {
    const step = e instanceof BuildError ? e.step : 'copy'
    console.error('[lead-build]', id, step, e?.message)
    return NextResponse.json({ error: `تعذّر البناء عند: ${STEP_AR[step] ?? step}`, detail: String(e?.message ?? '').slice(0, 200) }, { status: 502 })
  }
}
