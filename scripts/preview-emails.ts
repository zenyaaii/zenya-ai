/**
 * Dev-only: render every transactional email template to standalone HTML
 * files so we can eyeball them in a browser. Pulls the SAME functions the
 * app sends, so what you see is exactly what ships.
 *
 *   npx ts-node --transpile-only scripts/preview-emails.ts
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  domainPurchasedEmail,
  domainRefundEmail,
  paymentReceiptEmail,
  domainExpiringEmail,
  announcementEmail,
  welcomeEmail,
  trialReminderEmail,
  quotaReachedEmail,
  hostingExpiringEmail,
  passwordChangedEmail,
  accountDeletedEmail,
  bookingReceivedEmail,
  paymentFailedEmail,
  subscriptionEndedEmail,
  sitePublishedEmail,
  domainLiveEmail,
  bookingConfirmationEmail,
} from '../lib/email'

const outDir = join(process.cwd(), '.email-previews')
mkdirSync(outDir, { recursive: true })

const samples: { file: string; label: string; tmpl: { subject: string; html: string } }[] = [
  {
    file: 'domain-purchased.html',
    label: 'تم تسجيل النطاق (نجاح)',
    tmpl: domainPurchasedEmail({
      domain: 'musannef.shop',
      years: 1,
      expiresAt: new Date(Date.now() + 365 * 864e5).toISOString(),
      manageUrl: 'https://zenyaai.co/dashboard/sites',
    }),
  },
  {
    file: 'domain-refund.html',
    label: 'تعذّر التسجيل + إعادة المبلغ (الجديد)',
    tmpl: domainRefundEmail({
      domain: 'musannef.shop',
      amountUsd: 8.46,
      manageUrl: 'https://zenyaai.co/dashboard/sites',
    }),
  },
  {
    file: 'receipt-onetime.html',
    label: 'إيصال الدفع (برو — دفعة واحدة)',
    tmpl: paymentReceiptEmail({
      plan: 'onetime',
      amountCents: 999,
      taxCents: 173,
      currency: 'eur',
      country: 'NL',
      receiptNumber: '1415-5399',
      dateIso: new Date().toISOString(),
      manageUrl: 'https://zenyaai.co/dashboard',
    }),
  },
  {
    file: 'receipt-hosting.html',
    label: 'إيصال الدفع (الاستضافة الشهرية)',
    tmpl: paymentReceiptEmail({
      plan: 'hosting',
      amountCents: 1999,
      taxCents: 347,
      currency: 'eur',
      country: 'NL',
      receiptNumber: '2208-7710',
      dateIso: new Date().toISOString(),
      manageUrl: 'https://zenyaai.co/dashboard',
    }),
  },
  {
    file: 'announcement.html',
    label: 'إعلان إعادة الإطلاق (لكل المستخدمين)',
    tmpl: announcementEmail({ firstName: 'محمد', manageUrl: 'https://zenyaai.co/dashboard' }),
  },
  {
    file: 'welcome.html',
    label: 'ترحيب بالتسجيل',
    tmpl: welcomeEmail({ firstName: 'محمد', trialLimit: 2, manageUrl: 'https://zenyaai.co/dashboard' }),
  },
  {
    file: 'trial-reminder.html',
    label: 'تذكير منتصف التجربة',
    tmpl: trialReminderEmail({ firstName: 'محمد', remaining: 1, manageUrl: 'https://zenyaai.co/dashboard' }),
  },
  {
    file: 'quota-reached.html',
    label: 'استنفاد التجربة المجانية',
    tmpl: quotaReachedEmail({ firstName: 'محمد', trialLimit: 2, upgradeUrl: 'https://zenyaai.co/pricing' }),
  },
  {
    file: 'hosting-expiring.html',
    label: 'تنبيه انتهاء الاستضافة',
    tmpl: hostingExpiringEmail({
      firstName: 'محمد',
      daysUntil: 3,
      endDate: new Date(Date.now() + 3 * 864e5).toISOString(),
      manageUrl: 'https://zenyaai.co/dashboard/billing',
    }),
  },
  {
    file: 'domain-expiring.html',
    label: 'تذكير بالتجديد',
    tmpl: domainExpiringEmail({
      domain: 'musannef.shop',
      daysUntil: 7,
      renewUrl: 'https://zenyaai.co/dashboard/domains',
      retailUsd: 8.46,
    }),
  },
  {
    file: 'password-changed.html',
    label: 'تم تغيير كلمة المرور',
    tmpl: passwordChangedEmail({ email: 'owner@example.com' }),
  },
  {
    file: 'account-deleted.html',
    label: 'تم حذف الحساب',
    tmpl: accountDeletedEmail({ email: 'owner@example.com' }),
  },
  {
    file: 'booking-received.html',
    label: 'حجز جديد (لصاحب الموقع)',
    tmpl: bookingReceivedEmail({
      firstName: 'محمد', siteName: 'مطعم بيت الشام', kind: 'حجز طاولة', name: 'سارة أحمد',
      phone: '+20 100 555 2211', when: '2026-10-17 · 20:30', party: 4, message: 'نريد طاولة قرب الشباك لو أمكن.',
    }),
  },
  {
    file: 'payment-failed.html',
    label: 'فشل الدفع (جديد)',
    tmpl: paymentFailedEmail({
      firstName: 'محمد', planLabel: 'Pro', amountCents: 2499, currency: 'usd',
      nextAttemptIso: new Date(Date.now() + 3 * 864e5).toISOString(),
    }),
  },
  {
    file: 'subscription-ended.html',
    label: 'انتهى الاشتراك (جديد)',
    tmpl: subscriptionEndedEmail({ firstName: 'محمد', planLabel: 'Pro' }),
  },
  {
    file: 'site-published.html',
    label: 'موقعك نُشر (جديد)',
    tmpl: sitePublishedEmail({ firstName: 'محمد', siteName: 'مطعم بيت الشام', siteUrl: 'https://beitalsham.zenyaai.co' }),
  },
  {
    file: 'domain-live.html',
    label: 'نطاقك يعمل الآن (جديد)',
    tmpl: domainLiveEmail({ domain: 'beitalsham.com' }),
  },
  {
    file: 'booking-confirmation.html',
    label: 'تأكيد وصول الحجز للزبون (جديد، بألوان الموقع)',
    tmpl: bookingConfirmationEmail({
      siteName: 'مطعم بيت الشام', siteUrl: 'https://beitalsham.zenyaai.co', kind: 'حجز طاولة',
      when: '2026-10-17 · 20:30', party: 4,
      palette: {
        background: '#f6f1e7', surface: '#fffdf8', text: '#2a1d14', muted: '#7a6a5c', border: '#e7dccb',
        button: '#9c3b1b', buttonText: '#ffffff', buttonRadius: 2,
      },
    }),
  },
]

for (const s of samples) {
  writeFileSync(join(outDir, s.file), s.tmpl.html, 'utf8')
}

// Simple index that frames each email so you can scroll through them all.
const index = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>معاينة رسائل زينيا</title>
<style>
  body{margin:0;background:#f0f0f0;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#171717}
  header{padding:20px 24px;background:#171717;color:#fff}
  h1{margin:0;font-size:18px}
  .row{padding:22px 16px}
  .label{max-width:560px;margin:0 auto 10px;font-size:13px;font-weight:700;color:#171717}
  .subj{max-width:560px;margin:0 auto 10px;font-size:13px;color:#555555}
  iframe{display:block;width:100%;max-width:600px;height:760px;margin:0 auto;border:1px solid #dddddd;border-radius:14px;background:#fff}
</style></head><body>
<header><h1>معاينة رسائل البريد — زينيا (هذه نسخة محلية، لم تُرسل لأحد)</h1></header>
${samples
  .map(
    (s) => `<div class="row">
  <p class="label">${s.label}</p>
  <p class="subj">العنوان: ${s.tmpl.subject}</p>
  <iframe src="./${s.file}"></iframe>
</div>`
  )
  .join('\n')}
</body></html>`
writeFileSync(join(outDir, 'index.html'), index, 'utf8')

console.log('Wrote previews to:', outDir)
for (const s of samples) console.log(' -', s.file, '·', s.tmpl.subject)
