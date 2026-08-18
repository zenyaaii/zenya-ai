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
      <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#9b9b94;">
        <a href="https://zenyaai.co" style="color:#5e6ad2;text-decoration:none;">zenyaai.co</a> &nbsp;·&nbsp;
        <a href="https://zenyaai.co/privacy" style="color:#9b9b94;text-decoration:underline;">الخصوصية</a> &nbsp;·&nbsp;
        <a href="https://zenyaai.co/terms" style="color:#9b9b94;text-decoration:underline;">الشروط</a>
      </p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#b3b3ab;">زينيا علامة تجارية مملوكة لشركة Musannef · للتواصل: <a href="mailto:noreply@zenyaai.co" style="color:#9b9b94;text-decoration:underline;">noreply@zenyaai.co</a></p>
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
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      حاولنا تسجيل النطاق <strong style="color:#16171b;direction:ltr;display:inline-block;">${domain}</strong>، لكن لم تكتمل العملية لدى جهة التسجيل — لذلك أعدنا إليك كامل المبلغ تلقائيًا. لم نأخذ منك شيئًا.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#f3f7f3;border:1px solid #d9e7d9;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#5f8a5f;">المبلغ المُعاد: <strong style="color:#1f6f3f;">${amount}</strong></p>
        <p style="margin:0;font-size:13px;color:#8a8a83;">قد يستغرق ظهوره في كشف حسابك من ٥ إلى ١٠ أيام عمل حسب البنك.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: `تعذّر تسجيل النطاق ${domain}`,
    eyebrow: 'تمت إعادة المبلغ',
    heading: 'أعدنا إليك مبلغك بالكامل',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'جرّب نطاقًا آخر',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">نعتذر عن الإزعاج. إن تكرّر الأمر أو كانت لديك أي أسئلة، راسلنا وسنساعدك فورًا.</p>`,
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
  const manageUrl = args?.manageUrl || 'https://zenyaai.co/dashboard'
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
    'لأي استفسار راسلنا على noreply@zenyaai.co',
    '— زينيا (Musannef)',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      جدّدنا <strong style="color:#16171b;">زينيا</strong> بالكامل — هوية جديدة، تصميم أوضح، ورسائل بريد أجمل تطابق موقعنا.
    </p>
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      والأهم: أضفنا زر <strong style="color:#16171b;">«جرّب مثالاً جاهزًا»</strong> في منشئ المواقع — ابدأ من مثال جاهز، عدّل الاسم والتفاصيل، وولّد موقعك في ثوانٍ بدل صفحة فارغة.
    </p>`

  const html = emailShell({
    title: 'زينيا بحُلّة جديدة',
    eyebrow: 'جديد',
    heading: 'زينيا بحُلّة جديدة ✨',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'عُد إلى زينيا',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">تصلك هذه الرسالة لأن لديك حسابًا في زينيا. لأي استفسار راسلنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a>.</p>`,
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
    'لأي استفسار: noreply@zenyaai.co',
    '',
    '— زينيا (Musannef)',
  ].filter((l) => l !== null).join('\n')

  const summary = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;background:#faf8f3;border:1px solid #ececf2;border-radius:12px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size:14px;color:#16171b;text-align:right;padding:6px 0;">${itemName}</td>
            <td style="font-size:14px;color:#16171b;text-align:left;padding:6px 0;direction:ltr;white-space:nowrap;">${subtotal}</td>
          </tr>
          ${taxCents > 0 ? `<tr>
            <td style="font-size:13px;color:#8a8a83;text-align:right;padding:8px 0;border-top:1px solid #ececf2;">${taxLabel}</td>
            <td style="font-size:13px;color:#8a8a83;text-align:left;padding:8px 0;border-top:1px solid #ececf2;direction:ltr;white-space:nowrap;">${tax}</td>
          </tr>` : ''}
          <tr>
            <td style="font-size:15px;font-weight:800;color:#16171b;text-align:right;padding:12px 0 4px;border-top:2px solid #e5e2d9;">المبلغ المدفوع</td>
            <td style="font-size:15px;font-weight:800;color:#16171b;text-align:left;padding:12px 0 4px;border-top:2px solid #e5e2d9;direction:ltr;white-space:nowrap;">${total}</td>
          </tr>
        </table>
      </td></tr>
    </table>`

  const bodyHtml = `
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#5f5f5d;">${intro}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td style="text-align:right;vertical-align:top;padding:0 0 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#9b9b94;">المبلغ المدفوع</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#16171b;direction:ltr;text-align:right;">${total}</p>
        </td>
        <td style="text-align:left;vertical-align:top;padding:0 0 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.04em;color:#9b9b94;">التاريخ</p>
          <p style="margin:0;font-size:14px;color:#16171b;">${dateStr}</p>
        </td>
      </tr>
    </table>
    ${summary}
    <p style="margin:0;font-size:12px;color:#9b9b94;">رقم الإيصال: <strong style="color:#5f5f5d;direction:ltr;display:inline-block;">${receiptNumber}</strong></p>`

  const html = emailShell({
    title: `إيصال الدفع من زينيا`,
    eyebrow: 'إيصال الدفع',
    heading: 'شكرًا لك! تم استلام دفعتك',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'الذهاب إلى لوحة التحكم',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">${
      {
        onetime: 'هذا إيصال عن شرائك خطة زينيا برو مدى الحياة.',
        hosting: 'هذا إيصال عن اشتراكك الشهري في الاستضافة الكاملة.',
        starter: 'هذا إيصال عن اشتراكك الشهري في خطة Starter.',
        pro: 'هذا إيصال عن اشتراكك الشهري في خطة Pro.',
        entry: 'هذا إيصال عن فتح التوليد بالذكاء الاصطناعي (خطة Entry، دفعة واحدة).',
      }[plan]
    } لأي استفسار بخصوص هذه العملية، راسلنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a>.</p>`,
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
  const secureUrl = args.secureUrl || 'https://zenyaai.co/login'

  const subject = 'تم تغيير كلمة مرور حسابك في زينيا'

  const text = [
    `مرحبًا،`,
    ``,
    `هذا تأكيد بأن كلمة المرور لحسابك (${email}) قد تغيّرت للتو.`,
    `إن كنت أنت من قام بذلك، فلا حاجة لأي إجراء.`,
    ``,
    `لم تقم بهذا التغيير؟ أمّن حسابك فورًا بإعادة تعيين كلمة المرور من: ${secureUrl}`,
    `وراسلنا على noreply@zenyaai.co`,
    ``,
    `— زينيا`,
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      هذا تأكيد بأن كلمة المرور لحسابك <strong style="color:#16171b;direction:ltr;display:inline-block;">${email}</strong> قد تغيّرت للتو. إن كنت أنت من قام بذلك، فلا حاجة لأي إجراء.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#faf8f3;border:1px solid #ececf2;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">🔒 &nbsp;لأمانك، لن نُرسل لك كلمة المرور أبدًا عبر البريد، ولن نطلبها منك.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: subject,
    eyebrow: 'أمان الحساب',
    heading: 'تم تغيير كلمة المرور',
    bodyHtml,
    ctaHref: secureUrl,
    ctaLabel: 'تأمين حسابي',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;"><strong style="color:#5f5f5d;">لم تقم بهذا التغيير؟</strong> أمّن حسابك فورًا بإعادة تعيين كلمة المرور من الزر أعلاه، وراسلنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a>.</p>`,
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
  const manageUrl = args.manageUrl || 'https://zenyaai.co/dashboard'
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
    'لأي سؤال راسلنا على noreply@zenyaai.co — نحن هنا للمساعدة.',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      يسعدنا انضمامك إلى <strong style="color:#16171b;">زينيا</strong> — منشئ المواقع بالذكاء الاصطناعي. حسابك جاهز، ولديك <strong style="color:#16171b;">${genWord}</strong> لتبدأ بها فورًا.
    </p>
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      اكتب فكرتك، أو ابدأ من <strong style="color:#16171b;">مثال جاهز</strong>، وعدّله، وولّد موقعًا احترافيًا في ثوانٍ — بلا صفحة فارغة ولا كود.
    </p>`

  const html = emailShell({
    title: 'أهلًا بك في زينيا',
    eyebrow: 'مرحبًا',
    heading: 'أهلًا بك في زينيا 👋',
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'ابدأ إنشاء موقعك',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">تحتاج مساعدة في إطلاق أول موقع؟ راسلنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a> ويسعدنا أن نأخذ بيدك.</p>`,
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
  const manageUrl = args.manageUrl || 'https://zenyaai.co/dashboard'
  const remaining = Math.max(0, args.remaining)
  const remWord = remaining === 1 ? 'موقع مجاني واحد' : remaining === 2 ? 'موقعان مجانيان' : `${remaining} مواقع مجانية`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'

  const subject = `لا يزال لديك ${remWord} في زينيا`

  const text = [
    greeting,
    '',
    `تجربتك في زينيا ما زالت مفتوحة، ولا يزال لديك ${remWord}.`,
    'لا تدع فكرتك تنتظر — اكتبها، أو ابدأ من مثال جاهز، وولّد موقعك في ثوانٍ.',
    '',
    `تابع من حيث توقفت: ${manageUrl}`,
    '',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">${greeting}</p>
    <p style="margin:0 0 22px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      تجربتك في زينيا ما زالت مفتوحة، ولا يزال لديك <strong style="color:#16171b;">${remWord}</strong>. لا تدع فكرتك تنتظر — اكتبها، أو ابدأ من مثال جاهز، وولّد موقعك الاحترافي في ثوانٍ.
    </p>`

  const html = emailShell({
    title: 'لا يزال لديك مواقع مجانية في زينيا',
    eyebrow: 'تذكير بتجربتك',
    heading: `لا يزال لديك ${remWord}`,
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'أكمل إنشاء موقعك',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">تصلك هذه الرسالة لأن لديك تجربة مجانية نشطة في زينيا. عند الترقية تحصل على توليد غير محدود.</p>`,
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
  const upgradeUrl = args.upgradeUrl || 'https://zenyaai.co/pricing'
  const limit = Math.max(1, args.trialLimit)
  const genWord = limit === 1 ? 'موقعك المجاني' : limit === 2 ? 'موقعيك المجانيين' : `مواقعك المجانية الـ${limit}`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'

  const subject = 'استنفدت تجربتك المجانية في زينيا'

  const text = [
    greeting,
    '',
    `لقد استخدمت ${genWord} بالكامل — نأمل أن تكون النتائج أعجبتك!`,
    'للاستمرار في توليد مواقع بلا حدود، بالإضافة إلى تصدير شوبيفاي وملفات المشاريع، اشترك في إحدى خططنا.',
    '',
    `طالع الخطط: ${upgradeUrl}`,
    '',
    'مواقعك التي أنشأتها تبقى محفوظة في حسابك.',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">${greeting}</p>
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      لقد استخدمت <strong style="color:#16171b;">${genWord}</strong> بالكامل — نأمل أن تكون النتائج أعجبتك! للاستمرار في توليد مواقع <strong style="color:#16171b;">بلا حدود</strong>، مع تصدير شوبيفاي وملفات المشاريع، اشترك في إحدى خططنا.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#faf8f3;border:1px solid #ececf2;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">✅ &nbsp;مواقعك التي أنشأتها تبقى محفوظة في حسابك — لن تفقد أي عمل.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: 'استنفدت تجربتك المجانية في زينيا',
    eyebrow: 'انتهت التجربة',
    heading: 'استنفدت تجربتك المجانية',
    bodyHtml,
    ctaHref: upgradeUrl,
    ctaLabel: 'طالع الخطط والترقية',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">لأي سؤال عن الخطط راسلنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a>.</p>`,
  })

  return { subject, text, html }
}

/**
 * Sent when a hosting subscription is set to lapse — the user canceled (or
 * payment won't renew) and the paid period is ending within the reminder
 * window. The point is churn prevention: warn them their live sites will go
 * offline unless they resubscribe, before it actually happens.
 */
export function hostingExpiringEmail(args: {
  firstName?: string | null
  daysUntil: number
  endDate: string
  manageUrl?: string
}): { subject: string; text: string; html: string } {
  const manageUrl = args.manageUrl || 'https://zenyaai.co/dashboard/billing'
  const daysUntil = Math.max(0, args.daysUntil)
  const dayWord = daysUntil === 0 ? 'اليوم' : daysUntil === 1 ? 'يوم واحد' : daysUntil === 2 ? 'يومين' : `${daysUntil} أيام`
  const greeting = args.firstName ? `أهلًا ${args.firstName}،` : 'أهلًا بك،'
  let endStr = args.endDate
  try {
    endStr = new Date(args.endDate).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { /* keep ISO fallback */ }

  const urgency = daysUntil <= 3 ? 'عاجل — ' : ''
  const subject = `${urgency}استضافتك في زينيا تنتهي ${daysUntil === 0 ? 'اليوم' : `خلال ${dayWord}`}`

  const text = [
    greeting,
    '',
    `اشتراك الاستضافة الكاملة في حسابك ينتهي ${daysUntil === 0 ? 'اليوم' : `خلال ${dayWord}`} (${endStr}).`,
    'عند انتهائه، ستتوقف مواقعك المستضافة عن الظهور على الإنترنت.',
    '',
    `لإبقاء مواقعك مباشرة، جدّد اشتراكك من: ${manageUrl}`,
    '',
    'ملفاتك ومحتواك يبقى محفوظًا في حسابك — الاستضافة فقط هي ما يتوقف.',
    '— زينيا',
  ].join('\n')

  const bodyHtml = `
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">${greeting}</p>
    <p style="margin:0 0 20px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      اشتراك الاستضافة الكاملة في حسابك ينتهي <strong style="color:#16171b;">${daysUntil === 0 ? 'اليوم' : `خلال ${dayWord}`}</strong>. عند انتهائه، ستتوقف مواقعك المستضافة عن الظهور على الإنترنت.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background:#fdf4f0;border:1px solid #f0dcd2;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 6px;font-size:13px;color:#a05a3a;">ينتهي في: <strong style="color:#8a3c1f;">${endStr}</strong></p>
        <p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">ملفاتك ومحتواك يبقى محفوظًا في حسابك — الاستضافة فقط هي ما يتوقف.</p>
      </td></tr>
    </table>`

  const html = emailShell({
    title: 'استضافتك في زينيا تقترب من الانتهاء',
    eyebrow: 'تنبيه الاستضافة',
    heading: `استضافتك تنتهي ${daysUntil === 0 ? 'اليوم' : `خلال ${dayWord}`}`,
    bodyHtml,
    ctaHref: manageUrl,
    ctaLabel: 'جدّد الاستضافة الآن',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">تصلك هذه الرسالة لأن اشتراك الاستضافة في حسابك مُجدوَل للإيقاف. لأي سؤال راسلنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a>.</p>`,
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
    <p style="margin:0 0 18px; font-size:16px; line-height:1.85; color:#5f5f5d;">
      تم حذف حسابك المرتبط بـ <strong style="color:#16171b;">${args.email}</strong> نهائيًا وفق طلبك.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background:#faf8f3;border:1px solid #ececf2;border-radius:12px;">
      <tr><td style="padding:16px 18px;text-align:right;">
        <p style="margin:0 0 8px;font-size:13px;color:#8a8a83;">✅ &nbsp;تم حذفه: ملفك الشخصي، قوالبك، وسجل الاستخلاص.</p>
        <p style="margin:0;font-size:13px;color:#8a8a83;">🔒 &nbsp;يُحتفظ به: سجلات الدفع (متطلب قانوني لمدة ٧ سنوات).</p>
      </td></tr>
    </table>
    <p style="margin:0 0 20px; font-size:14px; line-height:1.8; color:#8a8a83;">
      إذا غيّرت رأيك يمكنك إنشاء حساب جديد في أي وقت من <a href="https://zenyaai.co/signup" style="color:#5e6ad2;text-decoration:none;">zenyaai.co</a>.
    </p>`

  const html = emailShell({
    title: 'تم حذف حسابك في زينيا',
    eyebrow: 'طلب الحذف',
    heading: 'تم حذف حسابك',
    bodyHtml,
    ctaHref: 'https://zenyaai.co/signup',
    ctaLabel: 'إنشاء حساب جديد',
    footnoteHtml: `<p style="margin:0;font-size:13px;line-height:1.8;color:#8a8a83;">إن لم تطلب هذا الحذف يرجى التواصل معنا على <a href="mailto:noreply@zenyaai.co" style="color:#5e6ad2;text-decoration:none;">noreply@zenyaai.co</a> فورًا.</p>`,
  })

  return { subject, text, html }
}
