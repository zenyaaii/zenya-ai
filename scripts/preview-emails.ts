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
  planPurchasedEmail,
  domainExpiringEmail,
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
    file: 'plan-onetime.html',
    label: 'ترقية برو (دفعة واحدة)',
    tmpl: planPurchasedEmail({ plan: 'onetime', manageUrl: 'https://zenyaai.co/dashboard' }),
  },
  {
    file: 'plan-hosting.html',
    label: 'تفعيل الاستضافة',
    tmpl: planPurchasedEmail({ plan: 'hosting', manageUrl: 'https://zenyaai.co/dashboard' }),
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
]

for (const s of samples) {
  writeFileSync(join(outDir, s.file), s.tmpl.html, 'utf8')
}

// Simple index that frames each email so you can scroll through them all.
const index = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>معاينة رسائل زينيا</title>
<style>
  body{margin:0;background:#e9e6dd;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#16171b}
  header{padding:20px 24px;background:#16171b;color:#fff}
  h1{margin:0;font-size:18px}
  .row{padding:22px 16px}
  .label{max-width:560px;margin:0 auto 10px;font-size:13px;font-weight:700;color:#5e6ad2}
  .subj{max-width:560px;margin:0 auto 10px;font-size:13px;color:#5f5f5d}
  iframe{display:block;width:100%;max-width:600px;height:760px;margin:0 auto;border:1px solid #cfcabb;border-radius:14px;background:#fff}
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
