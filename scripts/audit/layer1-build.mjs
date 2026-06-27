// Layer 1 — Build & types.
//
// Deterministic: does the codebase compile, type-check, and lint? These are
// pass/fail with no judgement. Slow steps (next build) are opt-in via
// AUDIT_FULL=1 so the default run stays fast.

import { spawnSync } from 'node:child_process'
import { ROOT, PASS, FAIL, WARN, SKIP, check, writeLayer, printLayer } from './_lib.mjs'

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32', // npx/tsc resolve via shell on Windows
    maxBuffer: 64 * 1024 * 1024,
  })
  return { code: r.status ?? 1, out: `${r.stdout || ''}${r.stderr || ''}` }
}

const checks = []

// --- typecheck -------------------------------------------------------------
{
  const { code, out } = run('npx', ['tsc', '--noEmit'])
  const errs = (out.match(/error TS\d+/g) || []).length
  if (code === 0) {
    checks.push(check('typecheck', PASS, 'tsc --noEmit clean'))
  } else {
    const sample = (out.match(/[^\n]*error TS\d+[^\n]*/g) || []).slice(0, 5).join(' | ')
    checks.push(check('typecheck', FAIL, `${errs} type error(s). e.g. ${sample}`))
  }
}

// --- lint ------------------------------------------------------------------
{
  // Errors fail the layer; warnings are reported but don't fail (the project
  // ships `<img>`/perf warnings intentionally in theme-preview components).
  const { out } = run('npx', ['eslint', '.', '-f', 'compact'])
  const errs = (out.match(/ Error /g) || []).length
  const warns = (out.match(/ Warning /g) || []).length
  if (errs === 0 && warns === 0) {
    checks.push(check('lint', PASS, 'eslint clean'))
  } else if (errs === 0) {
    checks.push(check('lint', WARN, `${warns} eslint warning(s) (no errors)`))
  } else {
    checks.push(check('lint', FAIL, `${errs} eslint error(s), ${warns} warning(s)`))
  }
}

// --- build (opt-in, slow) --------------------------------------------------
if (process.env.AUDIT_FULL === '1') {
  const { code, out } = run('npm', ['run', 'build'])
  if (code === 0) {
    checks.push(check('build', PASS, 'next build succeeded'))
  } else {
    const sample = (out.match(/[^\n]*(Error|Failed)[^\n]*/g) || []).slice(0, 3).join(' | ')
    checks.push(check('build', FAIL, `next build failed. ${sample}`))
  }
} else {
  checks.push(check('build', SKIP, 'skipped (set AUDIT_FULL=1 to run next build)'))
}

const result = writeLayer('layer1-build', 'Build & types', checks)
printLayer(result)
