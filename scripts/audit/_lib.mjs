// Shared helpers for the Zenya audit layers.
//
// Each layer is a standalone .mjs script (plain node, no ts-node) that scans
// files or probes endpoints and writes a structured result to
// audit-report/<layer>.json. run-all.mjs aggregates them into a graded report
// that the Auditor agent reads. Keeping the layers as text/AST-light static
// analysis means they run without compiling the Next app and work on Windows.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REPORT_DIR = path.join(ROOT, 'audit-report')

export const PASS = 'pass'
export const WARN = 'warn'
export const FAIL = 'fail'
export const SKIP = 'skip'

/** A single result object collected by a layer. */
export function check(id, status, detail, file = null) {
  return { id, status, detail, file }
}

/** Recursively collect files under `dir` matching `test(relPath)`. */
export function walk(dir, test, base = dir, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue
      walk(full, test, base, out)
    } else {
      const rel = path.relative(base, full).split(path.sep).join('/')
      if (test(rel)) out.push({ full, rel })
    }
  }
  return out
}

export function read(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

export function exists(p) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

/** Score a checks[] array: fails are heavy, warns are light. 0..100. */
export function scoreOf(checks) {
  const graded = checks.filter((c) => c.status !== SKIP)
  if (graded.length === 0) return 100
  let lost = 0
  for (const c of graded) {
    if (c.status === FAIL) lost += 1
    else if (c.status === WARN) lost += 0.25
  }
  return Math.max(0, Math.round((1 - lost / graded.length) * 100))
}

/** Write a layer result and return it. */
export function writeLayer(layer, title, checks, extra = {}) {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
  const counts = {
    pass: checks.filter((c) => c.status === PASS).length,
    warn: checks.filter((c) => c.status === WARN).length,
    fail: checks.filter((c) => c.status === FAIL).length,
    skip: checks.filter((c) => c.status === SKIP).length,
  }
  const result = {
    layer,
    title,
    score: scoreOf(checks),
    counts,
    checks,
    ...extra,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(path.join(REPORT_DIR, `${layer}.json`), JSON.stringify(result, null, 2))
  return result
}

const ICON = { pass: '✅', warn: '⚠️ ', fail: '❌', skip: '·  ' }

/** Pretty-print a layer result to the console. */
export function printLayer(result) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`${result.layer}  ·  ${result.title}  ·  ${result.score}/100`)
  console.log('─'.repeat(60))
  for (const c of result.checks) {
    if (c.status === PASS) continue // keep the console focused on problems
    const where = c.file ? `  (${c.file})` : ''
    console.log(`${ICON[c.status] || '?'} ${c.id}: ${c.detail}${where}`)
  }
  const { pass, warn, fail } = result.counts
  console.log(`   ${pass} pass · ${warn} warn · ${fail} fail`)
}
