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
  const dayWord = daysUntil === 1 ? 'يوم واحد' : daysUntil === 2 ? 'يومين' : `${daysUntil} أيام`
  const urgency = daysUntil <= 7 ? 'عاجل — ' : ''
  const subject = `${urgency}نطاقك ${domain} ينتهي خلال ${dayWord}`

  const text = [
    `مرحبًا،`,
    ``,
    `نطاقك ${domain} ينتهي خلال ${dayWord}.`,
    ``,
    `جدِّده الآن مقابل $${retailUsd.toFixed(2)}/سنة لإبقاء موقعك مباشرًا دون انقطاع:`,
    renewUrl,
    ``,
    `إن لم تجدِّده، سيتوقف النطاق عن العمل ويمكن لشخص آخر تسجيله بعد فترة سماح قصيرة.`,
    ``,
    `— زينيا`,
  ].join('\n')

  const html = `
<!doctype html>
<html lang="ar" dir="rtl"><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Arial,sans-serif; background:#f7f4ed; color:#16171b; direction:rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f7f4ed;padding:40px 16px;direction:rtl;"><tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e2d9;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -16px rgba(28,28,28,0.14);">
    <tr><td align="center" style="padding:28px 40px;background:#ffffff;border-bottom:1px solid #f0ede6;">
      <img src="https://zenyaai.co/brand/wordmark.png" alt="زينيا" width="128" style="display:block;border:0;height:auto;width:128px;" />
    </td></tr>
    <tr><td style="padding:40px;text-align:right;">
      <p style="margin:0 0 10px; font-size:12px; font-weight:700; letter-spacing:0.04em; color:#5e6ad2;">تذكير بالتجديد</p>
      <h1 style="margin:0 0 16px; font-size:24px; line-height:1.4; font-weight:800; letter-spacing:-0.01em; color:#16171b;">
        نطاقك ${domain} ينتهي خلال ${dayWord}
      </h1>
      <p style="font-size:16px; line-height:1.85; color:#5f5f5d; margin:0 0 26px;">
        جدِّده الآن لإبقاء موقعك مباشرًا دون انقطاع. يبدأ التجديد التلقائي إن لم تتحرّك، لكن التجديد يدويًا يضمن لك سنة إضافية اليوم.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 30px;"><tr>
        <td style="border-radius:999px;background:#5e6ad2;box-shadow:0 10px 28px -10px rgba(94,106,210,0.55);">
          <a href="${renewUrl}" style="display:inline-block; padding:14px 34px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:999px;">
            تجديد ${domain} · $${retailUsd.toFixed(2)}/سنة
          </a>
        </td>
      </tr></table>
      <p style="font-size:12px; line-height:1.7; color:#9b9b94; margin:0; border-top:1px solid #ececf2; padding-top:22px;">
        أُرسلت هذه الرسالة لأن نطاقك ${domain} يقترب من تاريخ انتهائه. أدِر نطاقاتك من <a href="https://zenyaai.co/dashboard/domains" style="color:#5e6ad2;text-decoration:none;">zenyaai.co/dashboard/domains</a>.
      </p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`.trim()

  return { subject, text, html }
}
