// One-shot Supabase Management API patcher for Zenya's auth config.
// Usage:  SUPABASE_ACCESS_TOKEN=sbp_... node supabase/email-templates/_apply.mjs
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(resolve(here, name), 'utf8')

const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF || 'cacvmeykpljvdpypjviy'
if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN')

const body = {
  site_url: 'https://zenyaai.co',
  uri_allow_list: [
    'https://zenyaai.co/auth/callback',
    'https://zenyaai.co/auth/reset-password',
    'https://www.zenyaai.co/auth/callback',
    'https://www.zenyaai.co/auth/reset-password',
    'http://localhost:3000/auth/callback',
    'http://localhost:3000/auth/reset-password',
  ].join(','),
  // password_hibp_enabled requires Supabase Pro plan — flip in dashboard after upgrade.
  password_min_length: 8,

  mailer_subjects_confirmation: 'Confirm your Zenya account',
  mailer_templates_confirmation_content: read('confirm-signup.html'),

  mailer_subjects_recovery: 'Reset your Zenya password',
  mailer_templates_recovery_content: read('reset-password.html'),

  mailer_subjects_magic_link: 'Your Zenya sign-in link',
  mailer_templates_magic_link_content: read('magic-link.html'),

  mailer_subjects_invite: "You're invited to Zenya",
  mailer_templates_invite_content: read('invite-user.html'),

  mailer_subjects_email_change: 'Confirm your new Zenya email',
  mailer_templates_email_change_content: read('change-email.html'),

  mailer_subjects_reauthentication: 'Your Zenya verification code',
  mailer_templates_reauthentication_content: read('reauthentication.html'),
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

const text = await res.text()
console.log('HTTP', res.status)
if (!res.ok) {
  console.error(text)
  process.exit(1)
}
// Verify
const verify = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  headers: { 'Authorization': `Bearer ${token}` },
}).then((r) => r.json())
console.log('---- VERIFY ----')
console.log('site_url            :', verify.site_url)
console.log('uri_allow_list      :', verify.uri_allow_list)
console.log('password_hibp_enabled:', verify.password_hibp_enabled)
console.log('password_min_length :', verify.password_min_length)
console.log('subjects:')
for (const k of [
  'mailer_subjects_confirmation',
  'mailer_subjects_recovery',
  'mailer_subjects_magic_link',
  'mailer_subjects_invite',
  'mailer_subjects_email_change',
  'mailer_subjects_reauthentication',
]) console.log('  ', k, '=', verify[k])
