import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/handover'

/**
 * One webhook for everything Meta sends: WhatsApp, Instagram, Messenger,
 * Page. Every event is stored as-is in `meta_events`, so later automations
 * read from the table instead of needing a new endpoint.
 *
 * Env: META_VERIFY_TOKEN (typed into Meta's "Verify token" box),
 *      META_APP_SECRET (App settings → Basic → App secret).
 */
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const token = process.env.META_VERIFY_TOKEN
  if (token && p.get('hub.mode') === 'subscribe' && p.get('hub.verify_token') === token) {
    return new NextResponse(p.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('forbidden', { status: 403 })
}

function validSignature(raw: string, header: string | null) {
  const secret = process.env.META_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const want = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const got = header.slice(7)
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!validSignature(raw, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('bad signature', { status: 401 })
  }
  let body: any
  try { body = JSON.parse(raw) } catch { return new NextResponse('bad json', { status: 400 }) }

  const rows: any[] = []
  for (const entry of body?.entry ?? []) {
    const changes = entry.changes ?? entry.messaging ?? [entry]
    for (const ch of changes) {
      rows.push({
        platform: body.object ?? 'unknown',
        field: ch.field ?? (entry.messaging ? 'messaging' : null),
        account_id: entry.id ?? null,
        payload: ch,
      })
    }
  }
  if (rows.length) {
    const { error } = await serviceClient().from('meta_events').insert(rows)
    if (error) console.error('[meta webhook] insert failed', error.message)
  }
  // Always 200 so Meta does not retry and disable the hook.
  return NextResponse.json({ ok: true })
}
