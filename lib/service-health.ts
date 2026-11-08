/**
 * Which paid outside service stopped working, so the admin dashboard can say
 * so in plain words («رصيد Anthropic انتهى») instead of a build failing with a
 * code nobody reads.
 *
 * One row per service in `service_alerts`: status 'down' with the reason, or
 * 'ok'. A failure we can name (no credit, bad key, billing, usage limit) marks
 * it down; the next call that works marks it ok again. Ordinary hiccups
 * (timeouts, overloads) are not recorded: they pass on their own.
 *
 * Server only. Never throws: a health note must not break the call it watches.
 */

export type Service = 'anthropic' | 'apify' | 'google'

/** A failure the admin has to act on, with what to do about it. */
export type Outage = { service: Service; reason: string; fix: string }

export class OutageError extends Error {
  constructor(public outage: Outage) { super(outage.reason) }
}

const FIX: Record<Service, string> = {
  anthropic: 'اشحن الرصيد أو ارفع حد الإنفاق في platform.claude.com، أو تأكد من مفتاح ANTHROPIC_API_KEY في Vercel',
  apify: 'اشحن الرصيد أو غيّر الخطة في console.apify.com، أو تأكد من مفتاح APIFY_TOKEN في Vercel',
  google: 'تأكد من الفوترة ومن تفعيل Places API في console.cloud.google.com، ومن مفتاح GOOGLE_PLACES_API_KEY في Vercel',
}

/** Reads an Anthropic SDK error. Returns null for errors that pass on their own. */
export function anthropicOutage(e: any): Outage | null {
  const status = Number(e?.status) || 0
  const msg = String(e?.error?.error?.message || e?.message || '')
  const reason =
    /credit balance/i.test(msg) ? 'رصيد Anthropic انتهى'
    : /usage limit|spend limit|specified api usage/i.test(msg) ? 'وصل Anthropic إلى حد الإنفاق الشهري'
    : status === 401 || /api key|x-api-key|authentication/i.test(msg) ? 'مفتاح Anthropic غير صالح أو غير موجود'
    : status === 403 ? 'Anthropic رفض الطلب (صلاحية الحساب)'
    : null
  return reason ? { service: 'anthropic', reason, fix: FIX.anthropic } : null
}

/** Reads an Apify HTTP answer. */
export function apifyOutage(status: number, body: string): Outage | null {
  const reason =
    status === 402 || (status >= 400 && status < 500 && /usage|credit|hard limit|not-enough/i.test(body)) ? 'رصيد Apify انتهى أو وصل حد الاستخدام'
    : status === 401 ? 'مفتاح Apify غير صالح'
    : status === 403 ? 'Apify رفض الطلب (الحساب أو الخطة)'
    : null
  return reason ? { service: 'apify', reason, fix: FIX.apify } : null
}

/** Reads a Google Places error answer. */
export function googleOutage(status: number, message: string): Outage | null {
  const reason =
    /billing/i.test(message) ? 'فوترة Google متوقفة'
    : status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(message) ? 'انتهت حصة Google اليومية'
    : status === 401 || /api key not valid|API_KEY_INVALID|missing/i.test(message) ? 'مفتاح Google غير صالح أو غير موجود'
    : status === 403 || /PERMISSION_DENIED|not enabled|has not been used/i.test(message) ? 'Google رفض الطلب (Places API غير مفعّل أو المفتاح مقيّد)'
    : null
  return reason ? { service: 'google', reason, fix: FIX.google } : null
}

export function missingKey(service: Service): Outage {
  const name = { anthropic: 'ANTHROPIC_API_KEY', apify: 'APIFY_TOKEN', google: 'GOOGLE_PLACES_API_KEY' }[service]
  return { service, reason: `مفتاح ${name} غير موجود في Vercel`, fix: FIX[service] }
}

// Each server instance writes 'ok' once, not on every call.
const known = new Map<Service, 'ok' | 'down'>()

async function write(service: Service, row: { status: 'ok' | 'down'; reason?: string | null; fix?: string | null }) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return
    const { serviceClient } = await import('@/lib/handover')
    await serviceClient().from('service_alerts').upsert({ service, ...row, at: new Date().toISOString() })
  } catch { /* the table may not exist yet; never break the caller */ }
}

// Outages this server instance saw, with when: a build asks "did anything stop while I ran?".
const seen: { o: Outage; at: number }[] = []

/** Outages noted since `t` (ms), one per service, newest first. */
export function downSince(t: number): Outage[] {
  const out = new Map<Service, Outage>()
  for (const x of [...seen].reverse()) if (x.at >= t && !out.has(x.o.service)) out.set(x.o.service, x.o)
  return Array.from(out.values())
}

export async function noteDown(o: Outage): Promise<void> {
  seen.push({ o, at: Date.now() }); if (seen.length > 50) seen.shift()
  known.set(o.service, 'down')
  await write(o.service, { status: 'down', reason: o.reason, fix: o.fix })
}

export async function noteUp(service: Service): Promise<void> {
  if (known.get(service) === 'ok') return
  known.set(service, 'ok')
  await write(service, { status: 'ok', reason: null, fix: null })
}
