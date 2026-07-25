/**
 * One-off: send the four NEW lifecycle email templates to a single preview
 * inbox so we can eyeball them in a real mail client. Uses the SAME render +
 * send path the app uses, so what lands is exactly what ships to users.
 *
 *   RESEND_API_KEY=re_xxx npx ts-node --transpile-only scripts/send-preview-emails.ts zenyaai@outlook.com
 *
 * Recipient defaults to zenyaai@outlook.com if no arg is given. Never writes
 * the key anywhere — pass it inline for the single run.
 */
import {
  sendEmail,
  welcomeEmail,
  trialReminderEmail,
  quotaReachedEmail,
  hostingExpiringEmail,
} from '../lib/email'

const to = process.argv[2] || 'zenyaai@outlook.com'

const samples = [
  { kind: 'welcome', tmpl: welcomeEmail({ firstName: 'محمد', trialLimit: 2, manageUrl: 'https://zenyaai.co/dashboard' }) },
  { kind: 'trial_reminder', tmpl: trialReminderEmail({ firstName: 'محمد', remaining: 1, manageUrl: 'https://zenyaai.co/dashboard' }) },
  { kind: 'quota_reached', tmpl: quotaReachedEmail({ firstName: 'محمد', trialLimit: 2, upgradeUrl: 'https://zenyaai.co/pricing' }) },
  {
    kind: 'hosting_expiring',
    tmpl: hostingExpiringEmail({
      firstName: 'محمد',
      daysUntil: 3,
      endDate: new Date(Date.now() + 3 * 864e5).toISOString(),
      manageUrl: 'https://zenyaai.co/dashboard/billing',
    }),
  },
]

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error('✗ RESEND_API_KEY is not set — pass it inline for this run. Nothing sent.')
    process.exit(1)
  }
  console.log(`Sending ${samples.length} preview emails to ${to} …\n`)
  for (const s of samples) {
    const res = await sendEmail({
      to,
      subject: s.tmpl.subject,
      text: s.tmpl.text,
      html: s.tmpl.html,
      tags: [{ name: 'kind', value: s.kind }, { name: 'preview', value: 'true' }],
    })
    const ok = (res as any).ok === true
    console.log(`${ok ? '✓' : '✗'} ${s.kind.padEnd(18)} — ${s.tmpl.subject}${ok ? ` (id ${(res as any).id})` : `  ${JSON.stringify(res)}`}`)
  }
  console.log('\nDone.')
}

main().catch((e) => {
  console.error('Send failed:', e)
  process.exit(1)
})
