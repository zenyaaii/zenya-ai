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
   react-email for component-based authoring.

   All templates share the website look: cream #f7f4ed page, white card with a
   #e5e2d9 border, ink #16171b headings, indigo #5e6ad2 accent + pill CTA, and
   the hosted pixel wordmark logo. Arabic / RTL to match the site. */

/** Shared chrome so every transactional email matches the auth templates. */
function emailShell(opts: {
  title: string
  eyebrow: string
  heading: string
  bodyHtml: string
  ctaHref: string
  ctaLabel: string
  footnoteHtml?: string
}): string {
  const { title, eyebrow, heading, bodyHtml, ctaHref, ctaLabel, footnoteHtml } = opts
  return `
<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="color-scheme" content="light only"/><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Arial,sans-serif; background:#f7f4ed; color:#16171b; direction:rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f7f4ed;padding:40px 16px;direction:rtl;"><tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e2d9;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -16px rgba(28,28,28,0.14);">
    <tr><td align="center" style="padding:28px 40px;background:#ffffff;border-bottom:1px solid #f0ede6;">
      <img src="https://zenyaai.co/brand/wordmark.png" alt="زينيا" width="128" style="display:block;border:0;height:auto;width:128px;" />
    </td></tr>
    <tr><td style="padding:40px;text-align:right;">
      <p style="margin:0 0 10px; font-size:12px; font-weight:700; letter-spacing:0.04em; color:#5e6ad2;">${eyebrow}</p>
      <h1 style="margin:0 0 16px; font-size:26px; line-height:1.35; font-weight:800; letter-spacing:-0.01em; color:#16171b;">${heading}</h1>
      ${bodyHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 30px;"><tr>
        <td style="border-radius:999px;background:#5e6ad2;box-shadow:0 10px 28px -10px rgba(94,106,210,0.55);">
          <a href="${ctaHref}" style="display:inline-block; padding:14px 34px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:999px;">${ctaLabel}</a>
        </td>
      </tr></table>
      ${footnoteHtml ? `<div style="border-top:1px solid #ececf2;padding-top:22px;margin-top:8px;">${footnoteHtml}</div>` : ''}
    </td></tr>
    <tr><td style="padding:24px 40px;background:#faf8f3;border-top:1px solid #ececf2;text-align:right;">
      <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#9b9b94;">أُرسلت من <strong style="color:#5f5f5d;">زينيا</strong> — منشئ المواقع بالذكاء الاصطناعي</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#9b9b94;">
        <a href="https://zenyaai.co" style="color:#5e6ad2;text-decoration:none;">zenyaai.co</a> &nbsp;·&nbsp;
        <a href="https://zenyaai.co/privacy" style="color:#9b9b94;text-decoration:underline;">الخصوصية</a> &nbsp;·&nbsp;
        <a href="https://zenyaai.co/terms" style="color:#9b9b94;text-decoration:underline;">الشروط</a>
      </p>
    </td></tr>
  </table>
  </td></tr></table>
</body></html>`.trim()
}

/**
 * Sent right after a domain is registered + attached (webhook
 * fulfillDomainPurchase). A thank-you + "your domain is live" confirmation.
 */
export function domainPurchasedEmail(args: {
  domain: string
  years: number
  expiresAt: string
  manageUrl: string
}): { subject: string; text: string; html: string } {
  const { domain, years, expiresAt, manageUrl } = args
  const yearWord = years === 1 ? 'سنة واحدة' : years === 2 ? 'سنتان' : `${years} سنوات`
  let expiry = expiresAt
  try {
    expiry = new Date(expiresAt).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { /* keep ISO fallback */ }

  const subject = `تم تسجيل نطاقك ${domain} 🎉`

  const text = [
    `شكرًا لك!`,
    ``,
    `تم تسجيل نطاقك ${domain} بنجاح وربطه بموقعك على زينيا.`,
    `المدة: ${yearWord} · ينتهي في: ${expiry}`,
    ``,
    `قد يستغرق تفعيل شهادة الأمان (SSL) بضع دقائق، وبعدها يصبح موقعك مباشرًا على نطاقك الجديد.`,
    `أدِر نطاقاتك من: ${manageUrl}`,
    ``,
    `— زينيا`,
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      شكرًا لك! تم تسجيل نطاقك <strong style="color:#16171b;">${domain}</strong> بنجاح وربطه بموقعك. قد يستغرق تفعيل شهادة الأمان (SSL) بضع دقائق، وبعدها يصبح موقعك مباشرًا على نطاقك الجديد.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#faf8f3;border:1px solid #ececf2;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#8a8a83;">النطاق: <strong style="color:#16171b;direction:ltr;display:inline-block;">${domain}</strong></p>
        <p style="margin:0 0 6px;font-size:13px;color:#8a8a83;">المدة: <strong style="color:#16171b;">${yearWord}</strong></p>
        <p style="margin:0;font-size:13px;color:#8a8a83;">ينتهي في: <strong style="color:#16171b;">${expiry}</strong></p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: `تم تسجيل نطاقك ${domain}`,
    eyebrow: 'تم التسجيل',
    heading: 'تهانينا! نطاقك جاهز',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'إدارة نطاقاتي',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">يتم تجديد النطاق تلقائيًا قبل انتهائه حتى يبقى موقعك مباشرًا. يمكنك إدارة ذلك في أي وقت من لوحة التحكم.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent right after a plan purchase clears (Stripe webhook). Two flavours:
 *   - 'onetime'  → the $9.99 lifetime Pro purchase
 *   - 'hosting'  → the $19.99/mo full-hosting subscription (first activation)
 */
export function planPurchasedEmail(args: {
  plan: 'onetime' | 'hosting'
  manageUrl: string
}): { subject: string; text: string; html: string } {
  const { plan, manageUrl } = args
  const isHosting = plan === 'hosting'

  const subject = isHosting
    ? 'تم تفعيل الاستضافة الكاملة في زينيا 🎉'
    : 'أهلًا بك في زينيا برو 🎉'

  const heading = isHosting ? 'تم تفعيل اشتراكك' : 'أهلًا بك في زينيا برو'
  const eyebrow = isHosting ? 'الاستضافة الكاملة' : 'ترقية'
  const intro = isHosting
    ? 'شكرًا لك! اشتراك الاستضافة الكاملة نشطٌ الآن. مواقعك مستضافة ومُدارة بالكامل مع التحديثات التلقائية والنسخ الاحتياطية ودعم الأولوية.'
    : 'شكرًا لك! تم تفعيل خطتك مدى الحياة بنجاح. يمكنك الآن إنشاء ونشر مواقع احترافية بكل ميزات زينيا — بدفعة واحدة فقط، إلى الأبد.'

  const text = [
    `شكرًا لك!`,
    ``,
    isHosting
      ? `تم تفعيل اشتراك الاستضافة الكاملة في زينيا.`
      : `تم تفعيل خطة زينيا برو مدى الحياة في حسابك.`,
    ``,
    `ابدأ من لوحة التحكم: ${manageUrl}`,
    ``,
    `— زينيا`,
  ].join('\n')

  const html = emailShell({
    title: subject.replace(' 🎉', ''),
    eyebrow,
    heading,
    bodyHtml: `<p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#5f5f5d;">${intro}</p>`,
    ctaHref: manageUrl,
    ctaLabel: isHosting ? 'الذهاب إلى لوحة التحكم' : 'ابدأ الإنشاء',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">${
      isHosting
        ? 'يمكنك إدارة اشتراكك أو إلغاءه في أي وقت من صفحة الفوترة في لوحة التحكم.'
        : 'تحتاج مساعدة في إطلاق أول موقع؟ راسلنا في أي وقت — يسعدنا أن نساعدك.'
    }</p>`,
  })

  return { subject, text, html }
}

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
