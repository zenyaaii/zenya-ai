/* ── Template sanitizer ───────────────────────────────────────────────
 *
 * Shopify validates templates/*.json against each section's schema
 * server-side and SILENTLY DROPS any template that fails — local
 * `theme check` never sees it (that's how a theme ships without its
 * homepage). Rules enforced here, mirroring the server:
 *   - setting ids must exist in the section/block schema
 *   - range values must be numbers within [min, max] AND on a step
 *   - select values must be one of the declared options
 *   - checkbox values must be booleans
 *   - block types must exist in the schema
 * Rather than throwing inside a user-facing generation request, this
 * snaps/strips invalid values so the output is always accepted.
 */

type SettingDef = {
  type: string
  id?: string
  min?: number
  max?: number
  step?: number
  options?: { value: string }[]
  default?: unknown
}

type BlockDef = { type: string; settings?: SettingDef[] }

type SectionSchema = {
  settings?: SettingDef[]
  blocks?: BlockDef[]
  max_blocks?: number
}

function extractSchema(liquid: string): SectionSchema | null {
  const m = liquid.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/)
  if (!m) return null
  try {
    return JSON.parse(m[1]) as SectionSchema
  } catch {
    return null
  }
}

function snapRange(value: unknown, def: SettingDef): number {
  const min = def.min ?? 0
  const max = def.max ?? 100
  const step = def.step ?? 1
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return typeof def.default === 'number' ? def.default : min
  let snapped = min + Math.round((n - min) / step) * step
  if (snapped > max) snapped = min + Math.floor((max - min) / step) * step
  if (snapped < min) snapped = min
  return snapped
}

function sanitizeSettings(
  values: Record<string, unknown> | undefined,
  defs: SettingDef[] | undefined,
  where: string,
): Record<string, unknown> {
  if (!values) return {}
  const byId: Record<string, SettingDef> = {}
  for (const d of defs ?? []) if (d.id) byId[d.id] = d
  const out: Record<string, unknown> = {}
  for (const [id, value] of Object.entries(values)) {
    const def = byId[id]
    if (!def) {
      console.warn(`[build/validate] ${where}: dropped unknown setting '${id}'`)
      continue
    }
    if (def.type === 'range') {
      const snapped = snapRange(value, def)
      if (snapped !== value) console.warn(`[build/validate] ${where}: snapped range '${id}' ${value} -> ${snapped}`)
      out[id] = snapped
    } else if (def.type === 'checkbox') {
      out[id] = Boolean(value)
    } else if (def.type === 'number') {
      const n = typeof value === 'number' ? value : Number(value)
      out[id] = Number.isNaN(n) ? (typeof def.default === 'number' ? def.default : 0) : n
    } else if (def.type === 'select' && def.options?.length && !def.options.some((o) => o.value === value)) {
      const fallback = def.default ?? def.options[0].value
      console.warn(`[build/validate] ${where}: select '${id}' value '${value}' not an option, using '${fallback}'`)
      out[id] = fallback
    } else {
      out[id] = value
    }
  }
  return out
}

/** Sanitize every templates/*.json and sections/*-group.json in a
 *  generated theme against the schemas in its sections/*.liquid files. */
export function sanitizeTemplates(files: Record<string, string>): Record<string, string> {
  const schemas: Record<string, SectionSchema> = {}
  for (const [path, body] of Object.entries(files)) {
    const m = path.match(/^sections\/(.+)\.liquid$/)
    if (!m) continue
    const schema = extractSchema(body)
    if (schema) schemas[m[1]] = schema
  }

  for (const [path, body] of Object.entries(files)) {
    if (!/^(templates\/.+\.json|sections\/.+-group\.json)$/.test(path)) continue
    let tpl: { sections?: Record<string, any>; order?: string[] }
    try {
      tpl = JSON.parse(body)
    } catch {
      console.warn(`[build/validate] ${path}: invalid JSON, left untouched`)
      continue
    }
    for (const [key, sec] of Object.entries(tpl.sections ?? {})) {
      const schema = schemas[sec.type]
      if (!schema) {
        console.warn(`[build/validate] ${path}/${key}: unknown section type '${sec.type}'`)
        continue
      }
      sec.settings = sanitizeSettings(sec.settings, schema.settings, `${path}/${key}`)
      const blockDefs: Record<string, BlockDef> = {}
      for (const b of schema.blocks ?? []) blockDefs[b.type] = b
      for (const [bk, blk] of Object.entries<any>(sec.blocks ?? {})) {
        const def = blockDefs[blk.type]
        if (!def) {
          console.warn(`[build/validate] ${path}/${key}/${bk}: dropped unknown block type '${blk.type}'`)
          delete sec.blocks[bk]
          sec.block_order = (sec.block_order ?? []).filter((k: string) => k !== bk)
          continue
        }
        blk.settings = sanitizeSettings(blk.settings, def.settings, `${path}/${key}/${bk}`)
      }
    }
    files[path] = JSON.stringify(tpl, null, 2)
  }
  return files
}
