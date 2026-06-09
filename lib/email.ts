/**
 * Tiny typed wrapper around Resend for transactional email.
 *
 * Why a wrapper, not direct SDK calls? Two reasons:
 *   1. Most of our callers don't care about Resend specifically — they
 *      want "send this email." Keeping that surface tight means we can
 *      swap providers later without changing 12 files.
 *   2. Dev / CI environments often don't have RESEND_API_KEY set.
 *      Throwing on every call there is annoying — this wrapper falls
 *      back to a structured console.log so the call site code stays
 *      live and reviewable. The send is a no-op in that mode.
 *
 * Env required for real delivery:
 *   RESEND_API_KEY  — `re_…` from resend.com/api-keys
 *   EMAIL_FROM      — defaults to "Zenya <noreply@zenyaai.co>" if unset
 */

import { Resend } from 'resend'

const DEFAULT_FROM = 'Zenya <noreply@zenyaai.co>'

export type SendEmailArgs = {
  to: string | string[]
  subject: string
  /** Plain-text body. We send both text + html when both are provided. */
  text?: string
  html?: string
  from?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string }

let _client: Resend | null = null
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_client) _client = new Resend(key)
  return _client
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const c = client()
  const to = Array.isArray(args.to) ? args.to : [args.to]

  if (!c) {
    console.log('[email] skipped (no RESEND_API_KEY):', {
      to, subject: args.subject, preview: (args.text || args.html || '').slice(0, 120),
    })
    return { ok: false, skipped: true, reason: 'no_api_key' }
  }

  if (!args.text && !args.html) {
    return { ok: false, error: 'no_body — provide text or html' }
  }

  try {
    // Resend's CreateEmailOptions union requires text OR html present.
    // Build the payload conditionally so TS picks the right variant.
    const payload: any = {
      from: args.from || process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject: args.subject,
      replyTo: args.replyTo,
      tags: args.tags,
    }
    if (args.text) payload.text = args.text
    if (args.html) payload.html = args.html
    const r = await c.emails.send(payload)
    if (r.error) {
      console.error('[email] resend returned error:', r.error)
      return { ok: false, error: r.error.message || 'resend_error' }
    }
    return { ok: true, id: r.data?.id || '' }
  } catch (e: any) {
    console.error('[email] send threw:', e)
    return { ok: false, error: e?.message || String(e) }
  }
}

/* ── Templates ───────────────────────────────────────────────────────── */
/* Kept inline to avoid a templates/ folder for two-three emails. If we
   grow past five templates, lift them into separate files and switch to
   react-email for component-based authoring. */

export function domainExpiringEmail(args: {
  domain: string
  daysUntil: number
  renewUrl: string
  retailUsd: number
}): { subject: string; text: string; html: string } {
  const { domain, daysUntil, renewUrl, retailUsd } = args
  const urgency = daysUntil <= 7 ? 'URGENT — ' : ''
  const subject = `${urgency}${domain} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`

  const text = [
    `Hi,`,
    ``,
    `Your domain ${domain} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`,
    ``,
    `Renew now for $${retailUsd.toFixed(2)}/year and keep your site live without interruption:`,
    renewUrl,
    ``,
    `If you don't renew, the domain will stop resolving and someone else can register it after a short grace period.`,
    ``,
    `— Zenya`,
  ].join('\n')

  const html = `
<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; background:#f7f4ed; padding:24px; color:#1c1c1c;">
  <div style="max-width:520px; margin:0 auto; background:#fff; border:1px solid #e5e2d9; border-radius:12px; padding:28px;">
    <div style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.14em; color:#5f5f5d;">Renewal reminder</div>
    <h1 style="margin:8px 0 16px; font-size:20px; font-weight:600; letter-spacing:-0.01em;">
      ${domain} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}
    </h1>
    <p style="font-size:14px; line-height:1.55; color:#5f5f5d; margin:0 0 20px;">
      Renew now to keep your site live without interruption. Auto-renewal kicks in if you don't act, but renewing manually locks in another year today.
    </p>
    <a href="${renewUrl}" style="display:inline-block; background:#5e6ad2; color:#fff; padding:10px 18px; border-radius:999px; font-size:13px; font-weight:600; text-decoration:none;">
      Renew ${domain} · $${retailUsd.toFixed(2)}/yr
    </a>
    <p style="font-size:12px; line-height:1.5; color:#9b9b9b; margin:24px 0 0;">
      Sent because your domain ${domain} is approaching its expiry date. Manage at <a href="https://zenyaai.co/dashboard/domains" style="color:#5e6ad2;">zenyaai.co/dashboard/domains</a>.
    </p>
  </div>
</body></html>`.trim()

  return { subject, text, html }
}
