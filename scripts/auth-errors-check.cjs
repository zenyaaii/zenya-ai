/**
 * Checks lib/auth-errors.ts against the errors Supabase actually returns.
 *
 * WHY THIS EXISTS AS A HARNESS rather than a comment: the mapping is a list
 * of string matches against somebody else's error text, and the failure mode
 * is silent. A message that stops matching does not throw — it falls through
 * to the generic sentence, and the only way anyone finds out is a customer
 * staring at "something went wrong" on the sign-in screen. Writing this
 * caught exactly that: the throttle message Supabase sends most often is
 * "For security purposes, you can only request this after 41 seconds", which
 * contains neither "rate" nor "limit" and was not matching.
 *
 * THE GATE IS THAT NOTHING ENGLISH REACHES A PERSON. Every case has to come
 * back in Arabic; a run of four or more Latin letters in the output means
 * somebody else's copy is being shown on an Arabic page, which is the bug the
 * module was written to end.
 *
 * Run: node scripts/auth-errors-check.cjs
 * Exits non-zero if any case regresses, so it can be wired into CI.
 *
 * It compiles the TypeScript in memory rather than importing a build, so it
 * runs against the source with no build step and no test framework.
 */

const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'lib', 'auth-errors.ts')
const js = ts.transpileModule(fs.readFileSync(SRC, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const mod = { exports: {} }
new Function('module', 'exports', js)(mod, mod.exports)
const { authErrorMessage, GENERIC } = mod.exports

/* Each case is a real shape supabase-js hands back. `generic: true` marks the
   ones that are SUPPOSED to fall through; everything else must be mapped. */
const CASES = [
  ['wrong password or unknown address, stranger',
    { code: 'invalid_credentials', message: 'Invalid login credentials' }, 'signin', {}],
  ['the same, on a browser that knows the account',
    { code: 'invalid_credentials', message: 'Invalid login credentials' }, 'signin', { knownAccount: true }],
  ['wrong current password on reset',
    { code: 'invalid_credentials', message: 'Invalid login credentials' }, 'reset', {}],
  ['email never confirmed',
    { code: 'email_not_confirmed', message: 'Email not confirmed' }, 'signin', {}],
  ['signing up with an address that exists',
    { message: 'User already registered' }, 'signup', {}],
  ['password under the minimum',
    { code: 'weak_password', message: 'Password should be at least 6 characters' }, 'signup', {}],
  ['reset reusing the old password',
    { code: 'same_password', message: 'New password should be different from the old password' }, 'reset', {}],
  ['throttled, with a wait Supabase names',
    { message: 'For security purposes, you can only request this after 41 seconds' }, 'forgot', {}],
  ['throttled, no number',
    { status: 429, message: 'Request rate limit reached' }, 'signin', {}],
  ['malformed address rejected upstream',
    { code: 'validation_failed', message: 'Unable to validate email address: invalid format' }, 'signup', {}],
  ['the device is offline',
    new TypeError('Failed to fetch'), 'signin', {}],
  ['a reset link that has expired',
    { code: 'otp_expired', message: 'Token has expired or is invalid' }, 'reset', {}],
  ['the service is down',
    { status: 503, message: 'Service Unavailable' }, 'signin', {}],
  ['our own pre-submit Arabic passes through untouched',
    new Error('صيغة البريد الإلكتروني غير صحيحة. تحقّق منها.'), 'signin', {}],
  ['something upstream nobody has seen before',
    { message: 'Some brand new upstream failure' }, 'signin', {}, { generic: true }],
]

let failed = 0
for (const [label, err, ctx, hints, opts = {}] of CASES) {
  const out = authErrorMessage(err, ctx, hints)
  const problems = []
  if (/[A-Za-z]{4,}/.test(out)) problems.push('English reaches the user')
  if (!opts.generic && out === GENERIC) problems.push('fell through to the generic message')
  if (opts.generic && out !== GENERIC) problems.push('expected the generic message')
  if (problems.length) {
    failed++
    console.log(`FAIL  ${label}\n      -> ${out}\n      (${problems.join('; ')})`)
  } else {
    console.log(`ok    ${label}`)
  }
}

/* The two credential messages must differ, or the knownAccount hint is doing
   nothing and the returning customer is still being told to check an address
   that is certainly correct. */
const stranger = authErrorMessage({ code: 'invalid_credentials' }, 'signin', {})
const known = authErrorMessage({ code: 'invalid_credentials' }, 'signin', { knownAccount: true })
if (stranger === known) {
  failed++
  console.log('FAIL  knownAccount changes nothing about the credential message')
} else {
  console.log('ok    knownAccount sharpens the credential message')
}

console.log(`\n${CASES.length + 1} cases, ${failed} failing`)
process.exit(failed ? 1 : 0)
