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

// Leaked-password protection (HaveIBeenPwned) requires the Supabase Pro
// plan. On a Free project the PATCH rejects the whole body if this is
// `true`, so we only opt in when ENABLE_HIBP=1 is passed. Once the
// project is Pro, run with ENABLE_HIBP=1 to satisfy the security advisor.
const hibp = process.env.ENABLE_HIBP === '1'

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
  password_min_length: 8,
  ...(hibp ? { password_hibp_enabled: true } : {}),

  // Subjects match the Arabic / RTL template bodies below.
  mailer_subjects_confirmation: 'أكِّد حسابك في زينيا',
  mailer_templates_confirmation_content: read('confirm-signup.html'),

  mailer_subjects_recovery: 'إعادة تعيين كلمة المرور في زينيا',
  mailer_templates_recovery_content: read('reset-password.html'),

  mailer_subjects_magic_link: 'رابط الدخول إلى زينيا',
  mailer_templates_magic_link_content: read('magic-link.html'),

  mailer_subjects_invite: 'دعوة للانضمام إلى زينيا',
  mailer_templates_invite_content: read('invite-user.html'),

  mailer_subjects_email_change: 'أكِّد بريدك الجديد في زينيا',
  mailer_templates_email_change_content: read('change-email.html'),

  mailer_subjects_reauthentication: 'رمز التحقق من زينيا',
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
