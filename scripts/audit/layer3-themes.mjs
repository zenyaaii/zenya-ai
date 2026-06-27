// Layer 3 — Generated Shopify themes.
//
// This is the highest-value layer because it encodes the SILENT server-side
// rules that local `theme check` never catches — the ones that make Shopify
// drop a template (and its homepage) without an error. Rules mirrored here:
//   - a schema setting must not carry both `default` and live inside `presets`
//     coexisting in a way Shopify rejects → we flag schemas that define
//     `presets` AND `default` settings (the classic silent-drop)
//   - a {type:"header"} setting's `content` is capped at ~50 chars
//   - a section schema `name` is capped at ~25 chars
//   - range settings must satisfy (max-min) % step === 0 and default on grid
//   - no `{` inside a `{{ }}` output (breaks Liquid parse server-side)
//   - templates/*.json: <= 25 sections, every section references a real
//     section file, and every section has populated settings (empty settings
//     render as empty sections — the seeding rule)
//
// Pass a theme directory as argv[2]; defaults to ./shopify-theme.

import path from 'node:path'
import { ROOT, PASS, WARN, FAIL, SKIP, check, walk, read, exists, writeLayer, printLayer } from './_lib.mjs'

const themeDir = path.resolve(ROOT, process.argv[2] || 'shopify-theme')
const checks = []

if (!exists(themeDir)) {
  checks.push(check('theme-dir', FAIL, `theme directory not found: ${themeDir}`))
  printLayer(writeLayer('layer3-themes', 'Generated themes', checks, { themeDir }))
  process.exit(0)
}

function extractSchema(liquid) {
  const m = liquid.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/)
  if (!m) return { schema: null, raw: null }
  try {
    return { schema: JSON.parse(m[1]), raw: m[1] }
  } catch (e) {
    return { schema: null, raw: m[1], parseError: e.message }
  }
}

// --- sections -------------------------------------------------------------
const sectionFiles = walk(themeDir, (r) => /^sections\/.+\.liquid$/.test(r))
const sectionTypes = new Set(sectionFiles.map((f) => f.rel.replace(/^sections\//, '').replace(/\.liquid$/, '')))
// type -> count of content settings that have NO schema default. Those are the
// ones that render blank when a template instance supplies nothing (Shopify
// falls back to per-setting defaults at runtime, so settings WITH a default are
// safe; functional sections like main-cart have none and are fine).
const contentSettingCount = {}

if (sectionFiles.length === 0) {
  checks.push(check('sections-present', FAIL, 'no sections/*.liquid found'))
}

for (const { full, rel } of sectionFiles) {
  const body = read(full)
  const { schema, parseError } = extractSchema(body)

  // Liquid: `{` inside an output `{{ ... }}` — server-side parse breaker.
  const badOutput = body.match(/\{\{[^}]*\{[^}]*\}\}/g)
  if (badOutput) {
    checks.push(check('liquid-brace', FAIL, `'{' inside {{ }} output (e.g. ${badOutput[0].slice(0, 40)})`, rel))
  }

  if (!schema) {
    if (parseError) checks.push(check('schema-json', FAIL, `schema JSON invalid: ${parseError}`, rel))
    continue
  }

  const type = rel.replace(/^sections\//, '').replace(/\.liquid$/, '')
  contentSettingCount[type] = (schema.settings || []).filter(
    (s) => s.type !== 'header' && s.id && s.default === undefined,
  ).length

  // name cap (~25 chars)
  if (typeof schema.name === 'string' && schema.name.length > 25) {
    checks.push(check('schema-name-cap', FAIL, `schema name ${schema.name.length} chars (>25 silently rejected): "${schema.name}"`, rel))
  }

  // header content cap (~50 chars)
  for (const s of schema.settings || []) {
    if (s.type === 'header' && typeof s.content === 'string' && s.content.length > 50) {
      checks.push(check('header-cap', FAIL, `header content ${s.content.length} chars (>50): "${s.content.slice(0, 40)}…"`, rel))
    }
    if (s.type === 'range') {
      const min = Number(s.min), max = Number(s.max), step = Number(s.step ?? 1)
      if ([min, max, step].every(Number.isFinite)) {
        if (step <= 0) {
          checks.push(check('range-step', FAIL, `range '${s.id}' step must be > 0`, rel))
        } else if (Math.round((max - min) / step) !== (max - min) / step) {
          checks.push(check('range-grid', FAIL, `range '${s.id}' (max-min)=${max - min} not divisible by step ${step} (silently rejected)`, rel))
        } else if (s.default != null && Math.round((s.default - min) / step) !== (s.default - min) / step) {
          checks.push(check('range-default', FAIL, `range '${s.id}' default ${s.default} not on the step grid`, rel))
        }
      }
    }
  }

  // Top-level `default` + `presets` together is the real silent-drop rule.
  // (Per-setting `default` values are normal and not the conflict.)
  const hasPresets = Array.isArray(schema.presets) && schema.presets.length > 0
  if (hasPresets && schema.default !== undefined) {
    checks.push(check('default-presets', FAIL, `schema defines both top-level 'default' and 'presets' — Shopify silently drops this section`, rel))
  }
}

if (sectionFiles.length && !checks.some((c) => c.id === 'schema-json' && c.status === FAIL)) {
  checks.push(check('schemas-parse', PASS, `${sectionFiles.length} section schemas parsed`))
}

// --- templates ------------------------------------------------------------
const templateFiles = walk(themeDir, (r) => /^templates\/.+\.json$/.test(r) || /^sections\/.+-group\.json$/.test(r))
if (templateFiles.length === 0) {
  checks.push(check('templates-present', WARN, 'no templates/*.json found'))
}

for (const { full, rel } of templateFiles) {
  let tpl
  try {
    tpl = JSON.parse(read(full))
  } catch (e) {
    checks.push(check('template-json', FAIL, `invalid JSON: ${e.message}`, rel))
    continue
  }
  const entries = Object.entries(tpl.sections || {})

  // 25-section template cap.
  if (entries.length > 25) {
    checks.push(check('section-cap', FAIL, `${entries.length} sections (>25 — Shopify drops the template)`, rel))
  }

  const blank = []
  for (const [key, sec] of entries) {
    if (sec.type && sectionTypes.size && !sectionTypes.has(sec.type)) {
      checks.push(check('unknown-section', FAIL, `references missing section '${sec.type}' (${key})`, rel))
    }
    const settingCount = sec.settings ? Object.keys(sec.settings).length : 0
    const blockCount = sec.blocks ? Object.keys(sec.blocks).length : 0
    // Only a problem when the section's schema HAS content settings but the
    // instance supplies neither settings nor blocks → it renders blank.
    const needsContent = (contentSettingCount[sec.type] ?? 0) > 0
    if (needsContent && settingCount === 0 && blockCount === 0) blank.push(`${key}(${sec.type})`)
  }
  if (blank.length > 0) {
    checks.push(check('seeding', WARN, `${blank.length} content section(s) unseeded → render blank: ${blank.slice(0, 4).join(', ')}`, rel))
  } else if (entries.length) {
    checks.push(check('seeding', PASS, `${entries.length} sections seeded`, rel))
  }
}

// --- coverage: does the catalogue ship enough sections? -------------------
checks.push(
  sectionTypes.size >= 60
    ? check('section-depth', PASS, `${sectionTypes.size} section types (>=60 target)`)
    : check('section-depth', WARN, `${sectionTypes.size} section types (<60 conversion-app depth target)`),
)

// theme check (opt-in — requires the Shopify CLI + can be slow/offline)
checks.push(check('theme-check-cli', SKIP, 'run `shopify theme check` and/or push to dev store via MCP for server-truth validation'))

const result = writeLayer('layer3-themes', 'Generated themes', checks, { themeDir, sectionCount: sectionTypes.size })
printLayer(result)
