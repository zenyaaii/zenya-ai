// Audit orchestrator — runs every deterministic layer in sequence, then writes
// audit-report/summary.json and prints a grade table. The MCP-driven layers
// (2 pages / 5 payments / 7 supabase) are run by the Auditor agent on top of
// this, because they need live tools, not file scanning.
//
//   node scripts/audit/run-all.mjs            # fast static layers
//   AUDIT_FULL=1 node scripts/audit/run-all.mjs   # + next build
//
// Optional first arg overrides the theme directory passed to layer 3.

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, REPORT_DIR } from './_lib.mjs'

const themeArg = process.argv[2] || ''

const LAYERS = [
  ['layer1-build', []],
  ['layer3-themes', themeArg ? [themeArg] : []],
  ['layer4-apis', []],
  ['layer6-webhooks', []],
]

for (const [name, args] of LAYERS) {
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'audit', `${name}.mjs`), ...args], {
    stdio: 'inherit',
    cwd: ROOT,
  })
}

// --- aggregate ------------------------------------------------------------
const results = []
for (const [name] of LAYERS) {
  const f = path.join(REPORT_DIR, `${name}.json`)
  if (fs.existsSync(f)) results.push(JSON.parse(fs.readFileSync(f, 'utf8')))
}

const totalFail = results.reduce((s, r) => s + r.counts.fail, 0)
const totalWarn = results.reduce((s, r) => s + r.counts.warn, 0)
const overall = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0

const summary = {
  overallScore: overall,
  totalFail,
  totalWarn,
  layers: results.map((r) => ({ layer: r.layer, title: r.title, score: r.score, counts: r.counts })),
  mcpLayersPending: ['layer2-pages (Preview MCP)', 'layer5-payments (Stripe MCP)', 'layer7-supabase (Supabase advisors)'],
  generatedAt: new Date().toISOString(),
}
fs.mkdirSync(REPORT_DIR, { recursive: true })
fs.writeFileSync(path.join(REPORT_DIR, 'summary.json'), JSON.stringify(summary, null, 2))

console.log(`\n${'═'.repeat(60)}`)
console.log('ZENYA AUDIT — static layers')
console.log('═'.repeat(60))
for (const r of results) {
  const bar = r.counts.fail ? '❌' : r.counts.warn ? '⚠️ ' : '✅'
  console.log(`${bar} ${r.title.padEnd(22)} ${String(r.score).padStart(3)}/100   ${r.counts.fail} fail · ${r.counts.warn} warn`)
}
console.log('─'.repeat(60))
console.log(`Overall ${overall}/100  ·  ${totalFail} fails · ${totalWarn} warns`)
console.log(`Report: ${path.relative(ROOT, REPORT_DIR)}/  ·  run the /audit command for the MCP layers (pages, payments, supabase)`)
