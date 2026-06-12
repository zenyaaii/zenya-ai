/**
 * Smoke test for the dropshipping theme generator. Writes a sample
 * theme to `tmp-build-theme/` so we can run `shopify theme check` on
 * it locally and inspect the Liquid by hand.
 *
 * Run with: npx tsx scripts/test-build-theme.ts
 */
import { generateTheme, type BuildConfig } from '../lib/build/theme-generator'
import { getPalette } from '../lib/build/palettes'
import * as fs from 'node:fs'
import * as path from 'node:path'

const palette = getPalette('crimson-cream')

const config: BuildConfig = {
  productName: 'GlowPro',
  storeName: 'Halo Goods',
  salePrice: 49.99,
  originalPrice: 99.99,
  paletteId: palette.id,
  paletteName: palette.name,
  paletteVibe: palette.vibe,
  paletteColors: {
    bg: palette.bg, surface: palette.surface, fg: palette.fg, muted: palette.muted,
    primary: palette.primary, primaryFg: palette.primaryFg,
    accent: palette.accent, border: palette.border,
  },
  images: [
    'https://cdn.shopify.com/static/sample-images/garnished.jpeg',
    'https://cdn.shopify.com/static/sample-images/teacup.jpeg',
    'https://cdn.shopify.com/static/sample-images/bath.jpeg',
    'https://cdn.shopify.com/static/sample-images/icecream.jpeg',
    'https://cdn.shopify.com/static/sample-images/mug.jpeg',
  ],
  description: 'A premium daily-use product backed by thousands of customers.',
  highlights: ['Premium build', 'Free shipping', '30-day returns'],
  sourceUrl: 'https://example.com/products/glowpro',
}

const files = generateTheme(config)
const outDir = path.resolve(process.cwd(), 'tmp-build-theme')

if (fs.existsSync(outDir)) {
  // Windows holds the dir lock if a previous theme-check spawn is
  // still attached. Try the recursive remove; if it errors, clear
  // file-by-file so we don't crash the run.
  try {
    fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  } catch {
    for (const entry of fs.readdirSync(outDir, { withFileTypes: true, recursive: true } as any)) {
      const e: any = entry
      if (e.isFile?.()) { try { fs.unlinkSync(path.join(e.path, e.name)) } catch {} }
    }
  }
}
fs.mkdirSync(outDir, { recursive: true })

let total = 0
let bytes = 0
for (const [rel, content] of Object.entries(files)) {
  const full = path.join(outDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf8')
  total++
  bytes += Buffer.byteLength(content, 'utf8')
}

console.log(`Wrote ${total} files to ${outDir}`)
console.log(`Total uncompressed: ${(bytes / 1024).toFixed(1)} KB`)

const indexJson = JSON.parse(files['templates/index.json'])
console.log(`\nindex.json: ${Object.keys(indexJson.sections).length} sections`)
let blockTotal = 0
for (const id of Object.keys(indexJson.sections)) {
  const s = indexJson.sections[id]
  const settingsCount = Object.keys(s.settings || {}).length
  const blockCount = s.blocks ? Object.keys(s.blocks).length : 0
  blockTotal += blockCount
  console.log(`  ${id.padEnd(14)} ${s.type.padEnd(28)} settings=${String(settingsCount).padStart(2)} blocks=${blockCount}`)
}
console.log(`Total blocks across homepage: ${blockTotal}`)
console.log('Next: cd tmp-build-theme && shopify theme check')
