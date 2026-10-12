import { NextRequest, NextResponse } from 'next/server'
import { isHandoverToken, serviceClient } from '@/lib/handover'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/handover/<token> { answer: 'yes' | 'no', note? }
 *
 * The token from the email (or the dashboard card) is the whole credential:
 * it names one notice and nothing else. A later answer replaces an earlier
 * one, so a "no" can turn into a "yes" once the problem is fixed.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token
  if (!isHandoverToken(token)) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const answer = body?.answer
  if (answer !== 'yes' && answer !== 'no') {
    return NextResponse.json({ error: 'bad_answer' }, { status: 400 })
  }
  const note = answer === 'no' ? String(body?.note || '').trim().slice(0, 2000) || null : null

  const a = serviceClient()
  const { data, error } = await a
    .from('site_handovers')
    .update({ status: answer, note, answered_at: new Date().toISOString() })
    .eq('token', token)
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ ok: true, status: answer })
}
