import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/handover'
import { clientIpFrom, withinBurstLimit } from '@/lib/analytics-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/wizard-events — the build wizard's moves, sent with sendBeacon by
 * WizardShell. Body: { session, wizard, label, events: [{ e, step, t?, i, n, how?, ms?, note? }] }.
 * Anonymous: a random id per visit, no IP stored. Always 204.
 */
const s = (v: unknown, max: number) => (typeof v === 'string' && v ? v.slice(0, max) : null)
const int = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : null)
const EVENTS = new Set(['view', 'leave', 'finish', 'wish'])
const HOW = new Set(['next', 'back', 'skip', 'jump', 'exit'])

export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 })
  try {
    if (!withinBurstLimit(`wizard:${clientIpFrom(req.headers) || 'unknown'}`)) return done
    const raw = await req.text()
    if (!raw || raw.length > 20000) return done
    const b = JSON.parse(raw)
    const session = s(b?.session, 64), wizard = s(b?.wizard, 120)
    if (!session || !wizard || !Array.isArray(b.events)) return done
    const label = s(b.label, 120)
    const rows = b.events.slice(0, 40).filter((x: { e?: string }) => EVENTS.has(String(x?.e))).map((x: Record<string, unknown>) => ({
      session, wizard, label,
      event: x.e as string,
      step_id: s(x.step, 60), step_title: s(x.t, 120), step_index: int(x.i, 100), step_count: int(x.n, 100),
      how: HOW.has(String(x.how)) ? (x.how as string) : null,
      ms: int(x.ms, 86_400_000),
      note: x.e === 'wish' ? s(x.note, 2000) : null,
    }))
    if (rows.length) await serviceClient().from('wizard_events').insert(rows)
  } catch { /* best effort */ }
  return done
}
