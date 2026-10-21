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
import { COMPANY } from './company'

const DEFAULT_FROM = 'Zenya <noreply@zenyaai.co>'

/** Format a minor-unit amount (cents) with a sensible currency symbol.
 *  Amount stays LTR even inside an RTL email so "€9.99" never flips. */
function fmtMoney(cents: number, currency: string): string {
  const cur = (currency || 'usd').toUpperCase()
  const n = (Math.max(0, cents) / 100).toFixed(2)
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: 'ر.س' }
  return sym[cur] ? `${sym[cur]}${n}` : `${n} ${cur}`
}

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
      replyTo: args.replyTo || SUPPORT_EMAIL,
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
/* Every template shares one frame, "paper and light", the email form of the
   house style in docs/zenya-hero-style.md: a #fafafa page, a white sheet with
   a hairline border and no shadow, obsidian #171717 type, an obsidian pill
   button, and the site's light (the شفق palette) glowing behind the wordmark.

   The glow and the wordmark are one picture, /brand/email-header.png, because
   mail clients cannot be trusted with blur, oklch or SVG: Outlook drops
   gradients and Gmail drops SVG. With images off, the cell's own background
   and the alt text stand in for it. Arabic / RTL throughout. */

/** Where a reader writes back. Every send sets it as Reply-To too. */
export const SUPPORT_EMAIL = COMPANY.SUPPORT_EMAIL

const HEADER_IMG = 'https://beynoun.com/brand/email-header.png'
const FONT = `'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif`

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
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="color-scheme" content="light only"/><meta name="supported-color-schemes" content="light"/><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;font-family:${FONT};background:#fafafa;color:#171717;direction:rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fafafa;padding:32px 12px;direction:rtl;"><tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e6e6;border-radius:18px;overflow:hidden;">
    <tr><td bgcolor="#f4eef6" style="padding:0;background:#f4eef6;line-height:0;font-size:0;">
      <img src="${HEADER_IMG}" alt="زينيا" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;font-size:20px;line-height:84px;font-weight:700;color:#171717;text-align:right;" />
    </td></tr>
    <tr><td style="padding:20px 40px 8px;text-align:right;font-family:${FONT};">
      <p style="margin:0 0 10px;font-size:13px;font-weight:500;color:#666666;">${eyebrow}</p>
      <h1 style="margin:0 0 18px;font-size:26px;line-height:1.45;font-weight:700;color:#171717;">${heading}</h1>
      ${bodyHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;"><tr>
        <td style="border-radius:999px;background:#171717;">
          <a href="${ctaHref}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${ctaLabel}</a>
        </td>
      </tr></table>
      ${footnoteHtml ? `<div style="padding:0 0 28px;">${footnoteHtml}</div>` : ''}
    </td></tr>
  </table>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;"><tr><td style="padding:20px 40px 0;text-align:right;font-family:${FONT};">
    <p style="margin:0 0 6px;font-size:12px;line-height:1.7;color:#8f8f8f;">زينيا، منشئ المواقع بالذكاء الاصطناعي · <a href="https://beynoun.com" style="color:#171717;text-decoration:none;">beynoun.com</a></p>
    <p style="margin:0;font-size:12px;line-height:1.7;color:#a3a3a3;">للسؤال أو المساعدة: ردّ على هذه الرسالة، أو اكتب إلى <a href="mailto:${SUPPORT_EMAIL}" style="color:#8f8f8f;">${SUPPORT_EMAIL}</a> · <a href="https://beynoun.com/privacy" style="color:#a3a3a3;">الخصوصية</a> · <a href="https://beynoun.com/terms" style="color:#a3a3a3;">الشروط</a></p>
  </td></tr></table>
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
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#555555;">
      شكرًا لك! تم تسجيل نطاقك <strong style="color:#171717;">${domain}</strong> بنجاح وربطه بموقعك. قد يستغرق تفعيل شهادة الأمان (SSL) بضع دقائق، وبعدها يصبح موقعك مباشرًا على نطاقك الجديد.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#8f8f8f;">النطاق: <strong style="color:#171717;direction:ltr;display:inline-block;">${domain}</strong></p>
        <p style="margin:0 0 6px;font-size:13px;color:#8f8f8f;">المدة: <strong style="color:#171717;">${yearWord}</strong></p>
        <p style="margin:0;font-size:13px;color:#8f8f8f;">ينتهي في: <strong style="color:#171717;">${expiry}</strong></p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: `تم تسجيل نطاقك ${domain}`,
    eyebrow: 'تم التسجيل',
    heading: 'تهانينا! نطاقك جاهز',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'إدارة نطاقاتي',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">سنذكّرك قبل انتهاء النطاق بوقت كافٍ لتجدّده. تدير نطاقاتك في أي وقت من لوحة التحكم.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent when a domain registration could NOT be completed after payment
 * and we auto-refunded the customer (webhook fulfillDomainPurchase
 * failure path). The whole point is that a silent refund feels like a
 * scam — this explains what happened, confirms the full refund, and
 * invites them to try again.
 */
export function domainRefundEmail(args: {
  domain: string
  amountUsd: number
  manageUrl: string
}): { subject: string; text: string; html: string } {
  const { domain, amountUsd, manageUrl } = args
  const amount = `$${amountUsd.toFixed(2)}`

  const subject = `تعذّر تسجيل النطاق ${domain} — وتمت إعادة مبلغك بالكامل`

  const text = [
    `مرحبًا،`,
    ``,
    `حاولنا تسجيل النطاق ${domain}، لكن لم تكتمل العملية لدى جهة التسجيل.`,
    `لذلك أعدنا إليك كامل المبلغ ${amount} تلقائيًا — لم نأخذ منك شيئًا.`,
    ``,
    `قد يستغرق ظهور المبلغ في كشف حسابك من ٥ إلى ١٠ أيام عمل حسب البنك.`,
    `يمكنك تجربة نطاق آخر في أي وقت من: ${manageUrl}`,
    ``,
    `نعتذر عن الإزعاج، ونحن هنا للمساعدة إن احتجت أي شيء.`,
    `— زينيا`,
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#555555;">
      حاولنا تسجيل النطاق <strong style="color:#171717;direction:ltr;display:inline-block;">${domain}</strong>، لكن لم تكتمل العملية لدى جهة التسجيل — لذلك أعدنا إليك كامل المبلغ تلقائيًا. لم نأخذ منك شيئًا.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#8f8f8f;">المبلغ المُعاد: <strong style="color:#171717;">${amount}</strong></p>
        <p style="margin:0;font-size:13px;color:#8f8f8f;">قد يستغرق ظهوره في كشف حسابك من ٥ إلى ١٠ أيام عمل حسب البنك.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: `تعذّر تسجيل النطاق ${domain}`,
    eyebrow: 'تمت إعادة المبلغ',
    heading: 'أعدنا إليك مبلغك بالكامل',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'جرّب نطاقًا آخر',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">نعتذر عن الإزعاج. إن تكرّر الأمر أو كانت لديك أي أسئلة، راسلنا وسنساعدك فورًا.</p>`,
  })

  return { subject, text, html }
}

/**
 * One-off broadcast: "Zenya has a new look" announcement. Sent to the
 * existing user base after the 2026 rebrand so they see the new identity
 * and come back. Generic enough to reuse for future announcements via the
 * `headline` / `bodyHtml` overrides, but ships with sensible defaults.
 */
export function announcementEmail(args?: {
  manageUrl?: string
  firstName?: string | null
}): { subject: string; text: string; html: string } {
  const manageUrl = args?.manageUrl || 'https://beynoun.com/dashboard'
  const greeting = args?.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'

  const subject = 'زينيا بحُلّة جديدة ✨'

  const text = [
    greeting,
    '',
    'جدّدنا زينيا بالكامل — هوية جديدة، تصميم أوضح، ورسائل أجمل.',
    'وأضفنا زر «جرّب مثالاً جاهزًا» في منشئ المواقع: ابدأ من مثال جاهز، عدّله، وولّد موقعك في ثوانٍ.',
    '',
    `عُد وجرّبها الآن: ${manageUrl}`,
    '',
    'لأي استفسار راسلنا على team@beynoun.com',
    '— زينيا (Musannef)',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">
      جدّدنا <strong style="color:#171717;">زينيا</strong> بالكامل — هوية جديدة، تصميم أوضح، ورسائل بريد أجمل تطابق موقعنا.
    </p>
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#555555;">
      والأهم: أضفنا زر <strong style="color:#171717;">«جرّب مثالاً جاهزًا»</strong> في منشئ المواقع — ابدأ من مثال جاهز، عدّل الاسم والتفاصيل، وولّد موقعك في ثوانٍ بدل صفحة فارغة.
    </p>`

  const html = emailShell({
    title: 'زينيا بحُلّة جديدة',
    eyebrow: 'جديد',
    heading: 'زينيا بحُلّة جديدة',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'عُد إلى زينيا',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">تصلك هذه الرسالة لأن لديك حسابًا في زينيا. لأي استفسار راسلنا على <a href="mailto:team@beynoun.com" style="color:#171717;text-decoration:none;">team@beynoun.com</a>.</p>`,
  })

  return { subject, text, html }
}

/**
 * Branded payment receipt — replaces Stripe's generic auto-receipt.
 * Sent right after a purchase clears (one-time Pro, or first month of
 * hosting). Doubles as a thank-you so we don't send two emails. All the
 * figures come from the Stripe Checkout Session, so the totals always
 * match what was actually charged.
 */
export function paymentReceiptEmail(args: {
  plan: 'onetime' | 'hosting' | 'starter' | 'pro' | 'entry'
  amountCents: number
  taxCents?: number
  currency: string
  country?: string | null
  receiptNumber: string
  dateIso?: string
  manageUrl: string
}): { subject: string; text: string; html: string } {
  const { plan, amountCents, currency, receiptNumber, manageUrl } = args
  const taxCents = Math.max(0, args.taxCents ?? 0)
  const subtotalCents = Math.max(0, amountCents - taxCents)

  const total = fmtMoney(amountCents, currency)
  const subtotal = fmtMoney(subtotalCents, currency)
  const tax = fmtMoney(taxCents, currency)

  const rate = subtotalCents > 0 ? Math.round((taxCents / subtotalCents) * 100) : 0
  const taxLabel = taxCents > 0 ? `ضريبة القيمة المضافة (${rate}% شامل)` : ''

  const itemName = {
    onetime: 'زينيا برو — وصول مدى الحياة',
    hosting: 'الاستضافة الكاملة — اشتراك شهري',
    starter: 'زينيا Starter — اشتراك شهري',
    pro: 'زينيا Pro — اشتراك شهري مع الاستضافة',
    entry: 'زينيا Entry — فتح التوليد (دفعة واحدة)',
  }[plan]

  let dateStr = ''
  try {
    dateStr = new Date(args.dateIso || Date.now()).toLocaleDateString('ar', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { /* leave empty */ }

  const intro = {
    onetime: 'شكرًا لك! تم استلام دفعتك وتفعيل خطتك مدى الحياة. هذا إيصال رسمي بعمليتك.',
    hosting: 'شكرًا لك! تم استلام دفعتك وتفعيل اشتراك الاستضافة الكاملة. هذا إيصال رسمي بعمليتك.',
    starter: 'شكرًا لك! تم استلام دفعتك وتفعيل اشتراك Starter. هذا إيصال رسمي بعمليتك.',
    pro: 'شكرًا لك! تم استلام دفعتك وتفعيل اشتراك Pro. هذا إيصال رسمي بعمليتك.',
    entry: 'شكرًا لك! تم استلام دفعتك وفتح التوليد بالذكاء الاصطناعي في حسابك. هذا إيصال رسمي بعمليتك.',
  }[plan]

  const subject = `إيصال الدفع من زينيا — ${total}`

  const text = [
    'شكرًا لك! تم استلام دفعتك.',
    '',
    itemName,
    `المجموع الفرعي: ${subtotal}`,
    taxCents > 0 ? `${taxLabel}: ${tax}` : null,
    `المبلغ المدفوع: ${total}`,
    '',
    `رقم الإيصال: ${receiptNumber}`,
    dateStr ? `التاريخ: ${dateStr}` : null,
    '',
    `لوحة التحكم: ${manageUrl}`,
    'لأي استفسار: team@beynoun.com',
    '',
    '— زينيا (Musannef)',
  ].filter((l) => l !== null).join('\n')

  const summary = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size:14px;color:#171717;text-align:right;padding:6px 0;">${itemName}</td>
            <td style="font-size:14px;color:#171717;text-align:left;padding:6px 0;direction:ltr;white-space:nowrap;">${subtotal}</td>
          </tr>
          ${taxCents > 0 ? `<tr>
            <td style="font-size:13px;color:#8f8f8f;text-align:right;padding:8px 0;border-top:1px solid #ececec;">${taxLabel}</td>
            <td style="font-size:13px;color:#8f8f8f;text-align:left;padding:8px 0;border-top:1px solid #ececec;direction:ltr;white-space:nowrap;">${tax}</td>
          </tr>` : ''}
          <tr>
            <td style="font-size:15px;font-weight:800;color:#171717;text-align:right;padding:12px 0 4px;border-top:2px solid #e3e3e3;">المبلغ المدفوع</td>
            <td style="font-size:15px;font-weight:800;color:#171717;text-align:left;padding:12px 0 4px;border-top:2px solid #e3e3e3;direction:ltr;white-space:nowrap;">${total}</td>
          </tr>
        </table>
      </td></tr>
    </table>`

  const bodyHtml = `
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#555555;">${intro}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td style="text-align:right;vertical-align:top;padding:0 0 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#8f8f8f;">المبلغ المدفوع</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#171717;direction:ltr;text-align:right;">${total}</p>
        </td>
        <td style="text-align:left;vertical-align:top;padding:0 0 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#8f8f8f;">التاريخ</p>
          <p style="margin:0;font-size:14px;color:#171717;">${dateStr}</p>
        </td>
      </tr>
    </table>
    ${summary}
    <p style="margin:0;font-size:12px;color:#8f8f8f;">رقم الإيصال: <strong style="color:#555555;direction:ltr;display:inline-block;">${receiptNumber}</strong></p>`

  const html = emailShell({
    title: `إيصال الدفع من زينيا`,
    eyebrow: 'إيصال الدفع',
    heading: 'شكرًا لك! تم استلام دفعتك',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'الذهاب إلى لوحة التحكم',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">${
      {
        onetime: 'هذا إيصال عن شرائك خطة زينيا برو مدى الحياة.',
        hosting: 'هذا إيصال عن اشتراكك الشهري في الاستضافة الكاملة.',
        starter: 'هذا إيصال عن اشتراكك الشهري في خطة Starter.',
        pro: 'هذا إيصال عن اشتراكك الشهري في خطة Pro.',
        entry: 'هذا إيصال عن فتح التوليد بالذكاء الاصطناعي (خطة Entry، دفعة واحدة).',
      }[plan]
    } لأي استفسار بخصوص هذه العملية، راسلنا على <a href="mailto:team@beynoun.com" style="color:#171717;text-decoration:none;">team@beynoun.com</a>.</p>`,
  })

  return { subject, text, html }
}

/**
 * Branded "your password was changed" security notification. Replaces the
 * plain English default. This is the Resend-sendable twin of
 * supabase/email-templates/password-changed.html — use it if we ever wire a
 * post-password-change hook and want our look instead of Supabase's default.
 */
export function passwordChangedEmail(args: {
  email: string
  secureUrl?: string
}): { subject: string; text: string; html: string } {
  const { email } = args
  const secureUrl = args.secureUrl || 'https://beynoun.com/login'

  const subject = 'تم تغيير كلمة مرور حسابك في زينيا'

  const text = [
    `مرحبًا،`,
    ``,
    `هذا تأكيد بأن كلمة المرور لحسابك (${email}) قد تغيّرت للتو.`,
    `إن كنت أنت من قام بذلك، فلا حاجة لأي إجراء.`,
    ``,
    `لم تقم بهذا التغيير؟ أمّن حسابك فورًا بإعادة تعيين كلمة المرور من: ${secureUrl}`,
    `وراسلنا على team@beynoun.com`,
    ``,
    `— زينيا`,
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#555555;">
      هذا تأكيد بأن كلمة المرور لحسابك <strong style="color:#171717;direction:ltr;display:inline-block;">${email}</strong> قد تغيّرت للتو. إن كنت أنت من قام بذلك، فلا حاجة لأي إجراء.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">لأمانك، لن نُرسل لك كلمة المرور أبدًا عبر البريد، ولن نطلبها منك.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: subject,
    eyebrow: 'أمان الحساب',
    heading: 'تم تغيير كلمة المرور',
    bodyHtml,
    ctaHref: secureUrl,
    ctaLabel: 'تأمين حسابي',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;"><strong style="color:#555555;">لم تقم بهذا التغيير؟</strong> أمّن حسابك فورًا بإعادة تعيين كلمة المرور من الزر أعلاه، وراسلنا على <a href="mailto:team@beynoun.com" style="color:#171717;text-decoration:none;">team@beynoun.com</a>.</p>`,
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

  const html = emailShell({
    title: subject,
    eyebrow: 'تذكير بالتجديد',
    heading: `نطاقك <span style="direction:ltr;unicode-bidi:isolate;">${domain}</span> ينتهي خلال ${dayWord}`,
    bodyHtml: `<p style="margin:0 0 22px;font-size:16px;line-height:1.85;color:#555555;">جدِّده الآن ليبقى موقعك ظاهرًا دون انقطاع. إن لم تجدِّده، يتوقف النطاق عن العمل، وقد يسجّله شخص آخر بعد فترة قصيرة.</p>`,
    ctaHref: renewUrl,
    ctaLabel: `جدِّد النطاق · $${retailUsd.toFixed(2)} للسنة`,
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">تصلك هذه الرسالة لأن نطاقك يقترب من تاريخ انتهائه. تدير نطاقاتك من <a href="https://beynoun.com/dashboard/domains" style="color:#171717;text-decoration:none;">لوحة التحكم</a>.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent once, right after a new account is confirmed (auth callback). A warm
 * welcome that points the user straight at the builder and sets the "you get
 * N free generations" expectation so the later quota / trial nudges land in
 * context rather than out of nowhere.
 */
export function welcomeEmail(args: {
  firstName?: string | null
  trialLimit?: number
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/dashboard'
  const limit = Math.max(1, args.trialLimit ?? 2)
  const genWord = limit === 1 ? 'موقع مجاني واحد' : limit === 2 ? 'موقعين مجانيين' : `${limit} مواقع مجانية`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'

  const subject = 'أهلًا بك في زينيا 👋'

  const text = [
    greeting,
    '',
    'يسعدنا انضمامك إلى زينيا — منشئ المواقع بالذكاء الاصطناعي.',
    `حسابك جاهز، ولديك ${genWord} لتبدأ بها فورًا.`,
    '',
    'اكتب فكرتك، أو ابدأ من مثال جاهز، وولّد موقعًا احترافيًا في ثوانٍ.',
    `ابدأ من هنا: ${manageUrl}`,
    '',
    'لأي سؤال راسلنا على team@beynoun.com — نحن هنا للمساعدة.',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">
      يسعدنا انضمامك إلى <strong style="color:#171717;">زينيا</strong> — منشئ المواقع بالذكاء الاصطناعي. حسابك جاهز، ولديك <strong style="color:#171717;">${genWord}</strong> لتبدأ بها فورًا.
    </p>
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#555555;">
      اكتب فكرتك، أو ابدأ من <strong style="color:#171717;">مثال جاهز</strong>، وعدّله، وولّد موقعًا احترافيًا في ثوانٍ — بلا صفحة فارغة ولا كود.
    </p>`

  const html = emailShell({
    title: 'أهلًا بك في زينيا',
    eyebrow: 'مرحبًا',
    heading: 'أهلًا بك في زينيا',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'ابدأ إنشاء موقعك',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">تحتاج مساعدة في إطلاق أول موقع؟ راسلنا على <a href="mailto:team@beynoun.com" style="color:#171717;text-decoration:none;">team@beynoun.com</a> ويسعدنا أن نأخذ بيدك.</p>`,
  })

  return { subject, text, html }
}

/** Visitor-typed text goes into the HTML body, so it is escaped first. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Sent to a site owner the moment a visitor submits a booking on one of their
 * sites (app/api/bookings), unless they switched "حجز جديد" off in dashboard
 * settings. Reply-To is the visitor when they left an email, so answering the
 * mail answers the customer.
 */
export function bookingReceivedEmail(args: {
  firstName?: string | null
  siteName: string
  kind: string
  name: string
  phone?: string | null
  email?: string | null
  when?: string | null
  party?: number | null
  message?: string | null
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://dashboard.beynoun.com/bookings'
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'
  const subject = `${args.kind} جديد من ${args.name} — ${args.siteName}`

  const facts: Array<[string, string]> = [
    ['الاسم', args.name],
    ...(args.phone ? [['الهاتف', args.phone] as [string, string]] : []),
    ...(args.email ? [['البريد', args.email] as [string, string]] : []),
    ...(args.when ? [['الموعد', args.when] as [string, string]] : []),
    ...(args.party ? [['عدد الأشخاص', String(args.party)] as [string, string]] : []),
  ]

  const text = [
    greeting,
    '',
    `وصلك ${args.kind} جديد على موقعك «${args.siteName}».`,
    '',
    ...facts.map(([k, v]) => `${k}: ${v}`),
    ...(args.message ? ['', args.message] : []),
    '',
    `كل حجوزاتك: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">
      وصلك <strong style="color:#171717;">${esc(args.kind)}</strong> جديد على موقعك «${esc(args.siteName)}».
    </p>
    <table role="presentation" style="width:100%; border-collapse:collapse; margin:0 0 18px;">
      ${facts.map(([k, v]) => `<tr><td style="padding:6px 0; font-size:15px; color:#8f8f8f; white-space:nowrap;">${k}</td><td style="padding:6px 12px 6px 0; font-size:15px; color:#171717; font-weight:700;">${esc(v)}</td></tr>`).join('')}
    </table>
    ${args.message ? `<p style="margin:0 0 22px; padding:12px 14px; background:#f5f5f5; border-radius:10px; font-size:15px; line-height:1.8; color:#555555;">${esc(args.message)}</p>` : ''}`

  const html = emailShell({
    title: subject,
    eyebrow: 'حجز جديد',
    heading: `${args.kind} من ${esc(args.name)}`,
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'افتح الحجوزات',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">تصلك هذه الرسالة لأن إشعار «حجز جديد» مفعّل في إعدادات لوحة التحكم. يمكنك إيقافه من هناك.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent once, mid-trial (~day 7), to a free user who still has free
 * generations left but hasn't converted. A gentle "you've still got room —
 * come finish what you started" nudge, not a hard sell.
 */
export function trialReminderEmail(args: {
  firstName?: string | null
  remaining: number
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/dashboard'
  const remaining = Math.max(0, args.remaining)
  const remWord = remaining === 1 ? 'موقع مجاني واحد' : remaining === 2 ? 'موقعان مجانيان' : `${remaining} مواقع مجانية`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'

  const subject = `لا يزال لديك ${remWord} في زينيا`

  const text = [
    greeting,
    '',
    `حسابك في زينيا جاهز، ولا يزال لديك ${remWord} في الباقة المجانية.`,
    'لا تدع فكرتك تنتظر — اكتبها، أو ابدأ من مثال جاهز، وولّد موقعك في ثوانٍ.',
    '',
    `تابع من حيث توقفت: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">${greeting}</p>
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#555555;">
      حسابك في زينيا جاهز، ولا يزال لديك <strong style="color:#171717;">${remWord}</strong> في الباقة المجانية. لا تدع فكرتك تنتظر — اكتبها، أو ابدأ من مثال جاهز، وولّد موقعك الاحترافي في ثوانٍ.
    </p>`

  const html = emailShell({
    title: 'لا يزال لديك مواقع مجانية في زينيا',
    eyebrow: 'الباقة المجانية',
    heading: `لا يزال لديك ${remWord}`,
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'أكمل إنشاء موقعك',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">تصلك هذه الرسالة مرة واحدة فقط. مع خطة Starter أو Pro تولّد مواقع بلا حدود.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent once, the moment a free user consumes their LAST free generation
 * (themes POST, after the quota trigger fires). Confirms they've used the
 * whole trial and routes them to pricing for unlimited generation.
 */
export function quotaReachedEmail(args: {
  firstName?: string | null
  trialLimit: number
  upgradeUrl?: string
}): { subject: string; text: string; html: string } {
  const upgradeUrl = args.upgradeUrl || 'https://beynoun.com/pricing'
  const limit = Math.max(1, args.trialLimit)
  const genWord = limit === 1 ? 'موقعك المجاني' : limit === 2 ? 'موقعيك المجانيين' : `مواقعك المجانية الـ${limit}`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'

  const subject = 'استخدمت مواقعك المجانية في زينيا'

  const text = [
    greeting,
    '',
    `لقد استخدمت ${genWord} بالكامل — نأمل أن تكون النتائج أعجبتك!`,
    'مع خطة Starter أو Pro تولّد مواقع بلا حدود، وتربط نطاقك الخاص، وتستقبل الحجوزات.',
    '',
    `طالع الخطط: ${upgradeUrl}`,
    '',
    'مواقعك التي أنشأتها تبقى محفوظة ومنشورة كما هي.',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">
      لقد استخدمت <strong style="color:#171717;">${genWord}</strong> بالكامل — نأمل أن تكون النتائج أعجبتك! مع خطة Starter أو Pro تولّد مواقع <strong style="color:#171717;">بلا حدود</strong>، وتربط نطاقك الخاص، وتستقبل الحجوزات.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">مواقعك التي أنشأتها تبقى محفوظة ومنشورة كما هي. لن تفقد أي شيء.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: 'استخدمت مواقعك المجانية في زينيا',
    eyebrow: 'الباقة المجانية',
    heading: 'استخدمت مواقعك المجانية',
    bodyHtml,
    ctaHref: upgradeUrl,
    ctaLabel: 'طالع الخطط والترقية',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">لأي سؤال عن الخطط راسلنا على <a href="mailto:team@beynoun.com" style="color:#171717;text-decoration:none;">team@beynoun.com</a>.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent when a Pro (or legacy hosting) subscription is set to lapse: the owner
 * canceled and the paid period ends within the reminder window. Their sites
 * stay published on the free plan; what goes is the Pro extras, most visibly
 * the "made with Zenya" badge coming back. Churn prevention, sent before it
 * happens.
 */
export function hostingExpiringEmail(args: {
  firstName?: string | null
  daysUntil: number
  endDate: string
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/dashboard/billing'
  const daysUntil = Math.max(0, args.daysUntil)
  const dayWord = daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'يوم واحد' : daysUntil === 2 ? 'يومين' : `${daysUntil} أيام`
  const when = daysUntil === 0 ? 'اليوم' : `خلال ${dayWord}`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'
  let endStr = args.endDate
  try {
    endStr = new Date(args.endDate).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { /* keep ISO fallback */ }

  const subject = `اشتراكك في زينيا ينتهي ${when}`

  const text = [
    greeting,
    '',
    `اشتراكك في زينيا ينتهي ${when} (${endStr}).`,
    'بعدها يرجع حسابك إلى الباقة المجانية. مواقعك تبقى منشورة، لكن تعود شارة «صُنع بزينيا» وتتوقف مزايا خطتك.',
    '',
    `لتبقى على خطتك، جدّد اشتراكك من: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:16px;line-height:1.85;color:#555555;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.85;color:#555555;">
      اشتراكك في زينيا ينتهي <strong style="color:#171717;">${when}</strong>. بعدها يرجع حسابك إلى الباقة المجانية.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#8f8f8f;">ينتهي في: <strong style="color:#171717;">${endStr}</strong></p>
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">مواقعك تبقى منشورة ومحفوظة. ما يتوقف: مزايا خطتك، وتعود شارة «صُنع بزينيا» أسفل مواقعك.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: subject,
    eyebrow: 'اشتراكك',
    heading: `اشتراكك ينتهي ${when}`,
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'جدّد اشتراكك',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">تصلك هذه الرسالة لأن اشتراكك أُلغي وسينتهي في آخر يوم مدفوع.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent to a user right before their account is permanently deleted so they
 * have a written record that the erasure was processed.
 */
export function accountDeletedEmail(args: {
  email: string
}): { subject: string; text: string; html: string } {
  const subject = 'تم حذف حسابك في زينيا'

  const text = [
    `مرحبًا،`,
    ``,
    `تم حذف حسابك في زينيا (${args.email}) نهائيًا وفق طلبك.`,
    ``,
    `ما تم حذفه: ملفك الشخصي، قوالبك، وسجل الاستخلاص.`,
    `ما يُحتفظ به: سجلات الدفع (متطلب قانوني لمدة ٧ سنوات).`,
    ``,
    `إذا غيّرت رأيك يمكنك إنشاء حساب جديد في أي وقت.`,
    ``,
    `— زينيا`,
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#555555;">
      تم حذف حسابك المرتبط بـ <strong style="color:#171717;">${args.email}</strong> نهائيًا وفق طلبك.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:#fafafa;border:1px solid #ececec;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 8px;font-size:13px;color:#8f8f8f;">تم حذفه: ملفك الشخصي، قوالبك، وسجل الاستخلاص.</p>
        <p style="margin:0;font-size:13px;color:#8f8f8f;">يُحتفظ به: سجلات الدفع (متطلب قانوني لمدة ٧ سنوات).</p>
      </td></tr>
    </table>
    <p style="margin:0 0 20px; font-size:14px; line-height:1.8; color:#8f8f8f;">
      إذا غيّرت رأيك يمكنك إنشاء حساب جديد في أي وقت من <a href="https://beynoun.com/signup" style="color:#171717;text-decoration:none;">beynoun.com</a>.
    </p>`

  const html = emailShell({
    title: 'تم حذف حسابك في زينيا',
    eyebrow: 'طلب الحذف',
    heading: 'تم حذف حسابك',
    bodyHtml,
    ctaHref: 'https://beynoun.com/signup',
    ctaLabel: 'إنشاء حساب جديد',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">إن لم تطلب هذا الحذف يرجى التواصل معنا على <a href="mailto:team@beynoun.com" style="color:#171717;text-decoration:none;">team@beynoun.com</a> فورًا.</p>`,
  })

  return { subject, text, html }
}

const P = 'margin:0 0 18px;font-size:16px;line-height:1.85;color:#555555;'
const NOTE = 'margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;'
const BOX = 'margin:0 0 26px;background:#fafafa;border:1px solid #ececec;border-radius:12px;'
const hello = (firstName?: string | null) => (firstName ? `أهلًا ${firstName}،` : 'أهلًا بك،')

function arDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

/**
 * Sent when Stripe fails to take a subscription payment (webhook
 * invoice.payment_failed, first attempt only). Stripe retries on its own, so
 * the message is "your card was refused, update it before the next try", not
 * "you lost your plan".
 */
export function paymentFailedEmail(args: {
  firstName?: string | null
  planLabel: string
  amountCents: number
  currency: string
  nextAttemptIso?: string | null
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/dashboard/billing'
  const amount = fmtMoney(args.amountCents, args.currency)
  const next = arDate(args.nextAttemptIso)
  const subject = 'لم نتمكن من تجديد اشتراكك في زينيا'

  const text = [
    hello(args.firstName),
    '',
    `حاولنا تجديد اشتراكك (${args.planLabel}، ${amount}) لكن البطاقة رُفضت.`,
    next ? `سنحاول مرة أخرى في ${next}.` : 'سنحاول مرة أخرى خلال أيام.',
    'حدّث بطاقتك قبل ذلك حتى لا تتوقف مزايا خطتك.',
    '',
    `حدّث بطاقتك من: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="${P}">${hello(args.firstName)}</p>
    <p style="${P}">حاولنا تجديد اشتراكك لكن البطاقة <strong style="color:#171717;">رُفضت</strong>. حدّث بطاقتك قبل المحاولة القادمة حتى لا تتوقف مزايا خطتك.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${BOX}">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#8f8f8f;">الخطة: <strong style="color:#171717;">${args.planLabel}</strong></p>
        <p style="margin:0 0 6px;font-size:13px;color:#8f8f8f;">المبلغ: <strong style="color:#171717;direction:ltr;display:inline-block;">${amount}</strong></p>
        ${next ? `<p style="margin:0;font-size:13px;color:#8f8f8f;">المحاولة القادمة: <strong style="color:#171717;">${next}</strong></p>` : ''}
      </td></tr>
    </table>`

  const html = emailShell({
    title: subject,
    eyebrow: 'الدفع',
    heading: 'البطاقة رُفضت',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'حدّث بطاقتك',
    footnoteHtml: `<p style="${NOTE}">مواقعك منشورة ولم يتغيّر فيها شيء. أسباب الرفض الشائعة: بطاقة منتهية، أو رصيد غير كافٍ، أو البنك أوقف الدفع عبر الإنترنت.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent the day a paid subscription actually ends (webhook
 * customer.subscription.deleted). The account is back on the free plan; the
 * sites stay up. Says plainly what changed and how to come back.
 */
export function subscriptionEndedEmail(args: {
  firstName?: string | null
  planLabel: string
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/pricing'
  const subject = 'انتهى اشتراكك في زينيا'

  const text = [
    hello(args.firstName),
    '',
    `انتهى اشتراكك (${args.planLabel})، ورجع حسابك إلى الباقة المجانية.`,
    'مواقعك تبقى منشورة ومحفوظة. ما توقف: مزايا خطتك، مثل التوليد بلا حدود.',
    '',
    `ترجع متى شئت من: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="${P}">${hello(args.firstName)}</p>
    <p style="${P}">انتهى اشتراكك في <strong style="color:#171717;">${args.planLabel}</strong>، ورجع حسابك إلى الباقة المجانية.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${BOX}">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;line-height:1.8;color:#8f8f8f;">باقٍ كما هو: <strong style="color:#171717;">مواقعك ومحتواها، منشورة ومحفوظة.</strong></p>
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8f8f8f;">توقف: <strong style="color:#171717;">مزايا خطتك، مثل التوليد بلا حدود.</strong></p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: subject,
    eyebrow: 'اشتراكك',
    heading: 'انتهى اشتراكك',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'ارجع إلى خطتك',
    footnoteHtml: `<p style="${NOTE}">إن لم تقصد إلغاء الاشتراك، ردّ على هذه الرسالة ونساعدك.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent the first time a site is published (POST /api/themes/[id]/publish when
 * the theme had never been published). The live link is the point: it is
 * what the owner forwards to their customers.
 */
export function sitePublishedEmail(args: {
  firstName?: string | null
  siteName: string
  siteUrl: string
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/dashboard'
  const host = args.siteUrl.replace(/^https?:\/\//, '')
  const name = esc(args.siteName)
  const subject = `موقع «${args.siteName}» أصبح على الإنترنت`

  const text = [
    hello(args.firstName),
    '',
    `موقع «${args.siteName}» منشور الآن، ويستطيع أي شخص فتحه:`,
    args.siteUrl,
    '',
    'أرسل الرابط لزبائنك على واتساب، وضعه في حساباتك على إنستغرام وفيسبوك وخرائط Google.',
    '',
    `عدّل موقعك في أي وقت من: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="${P}">${hello(args.firstName)}</p>
    <p style="${P}">موقع <strong style="color:#171717;">«${name}»</strong> منشور الآن، ويستطيع أي شخص فتحه من هذا الرابط:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${BOX}">
      <tr><td style="padding:18px;text-align:center;">
        <a href="${args.siteUrl}" style="font-size:17px;font-weight:700;color:#171717;text-decoration:none;direction:ltr;unicode-bidi:isolate;">${host}</a>
      </td></tr>
    </table>
    <p style="${P}">أرسل الرابط لزبائنك على واتساب، وضعه في حساباتك على إنستغرام وفيسبوك وخرائط Google.</p>`

  const html = emailShell({
    title: subject,
    eyebrow: 'تم النشر',
    heading: 'موقعك على الإنترنت',
    bodyHtml,
    ctaHref: args.siteUrl,
    ctaLabel: 'افتح موقعك',
    footnoteHtml: `<p style="${NOTE}">تعدّل موقعك وتتابع زياراته من <a href="${manageUrl}" style="color:#171717;text-decoration:none;">لوحة التحكم</a>. التعديلات تظهر خلال دقيقة.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent when a custom domain first turns live (DNS verified, SSL issued) on
 * GET /api/domains/[id]. Owners often close the page while DNS settles; this
 * tells them it worked without them checking back.
 */
export function domainLiveEmail(args: {
  domain: string
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://beynoun.com/dashboard/domains'
  const url = `https://${args.domain}`
  const subject = `نطاقك ${args.domain} يعمل الآن`

  const text = [
    'أهلًا بك،',
    '',
    `نطاقك ${args.domain} يعمل الآن، وموقعك يفتح عليه بأمان (https).`,
    url,
    '',
    'حدّث الرابط في واتساب وإنستغرام وخرائط Google إلى العنوان الجديد.',
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="${P}">نطاقك يعمل الآن، وموقعك يفتح عليه بأمان (https):</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${BOX}">
      <tr><td style="padding:18px;text-align:center;">
        <a href="${url}" style="font-size:17px;font-weight:700;color:#171717;text-decoration:none;direction:ltr;unicode-bidi:isolate;">${args.domain}</a>
      </td></tr>
    </table>
    <p style="${P}">حدّث الرابط في واتساب وإنستغرام وخرائط Google إلى العنوان الجديد.</p>`

  const html = emailShell({
    title: subject,
    eyebrow: 'النطاق',
    heading: 'نطاقك يعمل الآن',
    bodyHtml,
    ctaHref: url,
    ctaLabel: 'افتح موقعك',
    footnoteHtml: `<p style="${NOTE}">تدير نطاقاتك من <a href="${manageUrl}" style="color:#171717;text-decoration:none;">لوحة التحكم</a>.</p>`,
  })

  return { subject, text, html }
}
