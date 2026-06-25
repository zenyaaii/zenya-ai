/**
 * One-off broadcast tool for emailing the existing user base.
 *
 *   npx ts-node --transpile-only scripts/send-broadcast.ts <kind> [flags]
 *
 * kinds:
 *   announcement   → branded "Zenya has a new look" to ALL users
 *   receipt        → re-send the branded receipt to everyone who PAID
 *   verification   → (info only) re-send confirm email to UNCONFIRMED users
 *
 * flags:
 *   --send         actually send. WITHOUT THIS, it's a dry run: it prints
 *                  who it WOULD email and sends nothing.
 *   --show-emails  print full addresses (default: masked, to keep PII out
 *                  of logs/transcripts).
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 * from the environment (.env.local is loaded automatically below).
 *
 * Safe by default: dry run, masked emails, no send. Designed so you can
 * eyeball the recipient list before committing to a real send.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, announcementEmail, paymentReceiptEmail } from '../lib/email'

// ── tiny .env.local loader (no dotenv dependency required) ───────────────
function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(join(process.cwd(), f), 'utf8')
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
        }
      }
    } catch { /* file may not exist */ }
  }
}
loadEnv()

const KIND = (process.argv[2] || '').toLowerCase()
const SEND = process.argv.includes('--send')
const SHOW = process.argv.includes('--show-emails')

function mask(email: string): string {
  const [u, d] = email.split('@')
  if (!d) return email
  const head = u.slice(0, 1)
  return SHOW ? email : `${head}${'*'.repeat(Math.max(1, u.length - 1))}@${d}`
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
    process.exit(1)
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

type AuthUser = { id: string; email: string; confirmed: boolean; firstName: string | null }

async function listAllUsers(sb: ReturnType<typeof admin>): Promise<AuthUser[]> {
  const out: AuthUser[] = []
  let page = 1
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    for (const u of data.users) {
      if (!u.email) continue
      const meta = (u.user_metadata || {}) as any
      out.push({
        id: u.id,
        email: u.email,
        confirmed: !!u.email_confirmed_at,
        firstName: meta.first_name || meta.name || meta.full_name?.split?.(' ')?.[0] || null,
      })
    }
    if (data.users.length < 200) break
    page++
  }
  return out
}

async function run() {
  if (!['announcement', 'receipt', 'verification'].includes(KIND)) {
    console.error('Usage: send-broadcast.ts <announcement|receipt|verification> [--send] [--show-emails]')
    process.exit(1)
  }
  const sb = admin()
  const users = await listAllUsers(sb)
  const byId = new Map(users.map((u) => [u.id, u]))

  console.log(`\nMode: ${KIND}  ·  ${SEND ? '🔴 LIVE SEND' : '🟢 DRY RUN (no email sent)'}  ·  emails ${SHOW ? 'shown' : 'masked'}\n`)

  // Resolve the recipient set per kind.
  let recipients: { email: string; tmpl: { subject: string; text: string; html: string }; tag: string }[] = []

  if (KIND === 'announcement') {
    recipients = users.map((u) => ({
      email: u.email,
      tmpl: announcementEmail({ firstName: u.firstName }),
      tag: 'announcement',
    }))
  } else if (KIND === 'receipt') {
    const { data: purchases, error } = await sb
      .from('purchases')
      .select('user_id, amount_cents, currency, tax_amount_cents, tax_country, stripe_payment_intent_id, stripe_checkout_session_id, paid_at')
      .eq('status', 'paid')
    if (error) throw error
    for (const p of purchases || []) {
      const u = byId.get((p as any).user_id)
      if (!u) continue
      const base = (p as any).stripe_payment_intent_id || (p as any).stripe_checkout_session_id || ''
      const tail = String(base).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
      recipients.push({
        email: u.email,
        tag: 'receipt_resend',
        tmpl: paymentReceiptEmail({
          plan: 'onetime',
          amountCents: (p as any).amount_cents || 0,
          taxCents: (p as any).tax_amount_cents || 0,
          currency: (p as any).currency || 'usd',
          country: (p as any).tax_country || null,
          receiptNumber: tail.length >= 8 ? `${tail.slice(0, 4)}-${tail.slice(4)}` : tail || 'ZENYA',
          dateIso: (p as any).paid_at || new Date().toISOString(),
          manageUrl: 'https://zenyaai.co/dashboard',
        }),
      })
    }
  } else if (KIND === 'verification') {
    const unconfirmed = users.filter((u) => !u.confirmed)
    console.log(`Unconfirmed users eligible for a verification re-send: ${unconfirmed.length}`)
    for (const u of unconfirmed) console.log('  ·', mask(u.email))
    console.log(
      '\nNOTE: this path is intentionally not wired to send yet.\n' +
      '  - Confirmed users (the other ' + (users.length - unconfirmed.length) + ') have nothing to verify.\n' +
      "  - To make the confirm email on-brand, the live Supabase auth templates must be\n" +
      '    applied first (needs an sbp_ access token: node supabase/email-templates/_apply.mjs).\n' +
      '  - Then resend via supabase.auth.admin.generateLink({ type: "signup" }) + our own mailer,\n' +
      '    or the client resend() flow. Provide the sbp_ token and confirm to proceed.\n'
    )
    return
  }

  console.log(`Recipients: ${recipients.length}`)
  for (const r of recipients) console.log('  ·', mask(r.email), '—', r.tmpl.subject)

  if (!SEND) {
    console.log('\nDry run complete. Re-run with --send to actually deliver.\n')
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('\nRESEND_API_KEY missing — cannot send. Aborting.')
    process.exit(1)
  }

  let ok = 0
  let fail = 0
  for (const r of recipients) {
    const res = await sendEmail({
      to: r.email,
      subject: r.tmpl.subject,
      text: r.tmpl.text,
      html: r.tmpl.html,
      tags: [{ name: 'type', value: r.tag }],
    })
    if ('ok' in res && res.ok) { ok++; } else { fail++; console.error('  ✗', mask(r.email), JSON.stringify(res)) }
    // Gentle pacing so we stay well under Resend rate limits.
    await new Promise((r) => setTimeout(r, 120))
  }
  console.log(`\nDone. Sent ${ok}, failed ${fail}.\n`)
}

run().catch((e) => { console.error(e); process.exit(1) })
