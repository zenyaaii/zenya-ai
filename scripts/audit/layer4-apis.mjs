// Layer 4 — API route contracts.
//
// Static scan of every app/api/**/route.ts. Scripts can't judge business
// correctness, but they CAN flag the structural gaps that cause real incidents:
//   - a mutating route (POST/PUT/PATCH/DELETE) with no input validation
//   - a sensitive route (account, admin, themes, subscription, billing) with no
//     auth/identity check
//   - an admin route with no admin/role gate
//   - a handler with no try/catch around its body
//   - use of the service-role key in a route reachable by the browser
// Each finding carries the file so the Auditor agent (and you) can jump to it.

import path from 'node:path'
import { ROOT, PASS, WARN, FAIL, check, walk, read, writeLayer, printLayer } from './_lib.mjs'

const apiDir = path.join(ROOT, 'app', 'api')
const files = walk(apiDir, (r) => /(^|\/)route\.ts$/.test(r))
const checks = []

// Routes that touch user data / money / admin must verify identity.
const SENSITIVE = /^(account|admin|themes|subscription|billing|build|domains|affiliate|upload|gallery|visitors|analytics)\b/
const ADMIN = /^admin\b/
const PUBLIC_OK = /^(contact|log|scrape|slug|generate-|ai\/|theme-preview)/ // intentionally open

let protectedOk = 0
let validatedOk = 0
let mutating = 0

for (const { full, rel } of files) {
  const route = rel.replace(/\/route\.ts$/, '')
  const body = read(full)
  const methods = (body.match(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g) || []).map((m) =>
    m.split(/\s+/).pop(),
  )
  const isMutating = methods.some((m) => m !== 'GET')
  if (isMutating) mutating++

  // --- auth / identity ---
  const hasAuth =
    /auth\.getUser|getSession|client_reference_id|x-user-email|requireUser|getUser\(|supabase\.auth|verifyAdmin|isAdmin/.test(body)
  if (SENSITIVE.test(route) && !PUBLIC_OK.test(route)) {
    if (hasAuth) protectedOk++
    else checks.push(check(`auth:${route}`, FAIL, 'sensitive route with no visible auth/identity check', rel))
  }
  if (ADMIN.test(route) && !/admin|role|isAdmin|verifyAdmin|plan\s*===\s*['"]admin['"]/.test(body)) {
    checks.push(check(`admin-gate:${route}`, FAIL, 'admin route with no admin/role gate', rel))
  }

  // --- input validation on mutating routes ---
  if (isMutating) {
    const hasValidation = /\bz\.|zod|safeParse|\.parse\(|typeof\s+\w+\s*!==|if\s*\(!/.test(body)
    if (hasValidation) validatedOk++
    else checks.push(check(`validate:${route}`, WARN, `${methods.join('/')} with no obvious input validation`, rel))
  }

  // --- error handling ---
  if (!/try\s*\{/.test(body)) {
    checks.push(check(`try-catch:${route}`, WARN, 'no try/catch in handler', rel))
  }

  // --- service-role key exposure heuristic ---
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(body) && !/runtime\s*=\s*['"]nodejs['"]/.test(body)) {
    checks.push(check(`svc-runtime:${route}`, WARN, 'uses service-role key without explicit nodejs runtime', rel))
  }
}

checks.push(check('routes-found', files.length ? PASS : FAIL, `${files.length} API routes scanned`))
checks.push(check('auth-coverage', PASS, `${protectedOk} sensitive routes have auth checks`))
checks.push(check('validation-coverage', PASS, `${validatedOk}/${mutating} mutating routes validate input`))

const result = writeLayer('layer4-apis', 'API contracts', checks, { routeCount: files.length })
printLayer(result)
