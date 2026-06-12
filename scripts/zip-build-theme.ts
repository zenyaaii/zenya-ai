/**
 * Zips the generated dropshipping theme to tmp-build-theme.zip so we
 * can hand it to Shopify's stagedUploadsCreate / themeCreate.
 */
import { generateTheme, type BuildConfig } from '../lib/build/theme-generator'
import { getPalette } from '../lib/build/palettes'
import JSZip from 'jszip'
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
  sourceUrl: 'https://example.com/products/glowpro',
}

async function main() {
  const files = generateTheme(config)
  const zip = new JSZip()
  for (const [rel, content] of Object.entries(files)) zip.file(rel, content)
  const u8 = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  const out = path.resolve(process.cwd(), 'tmp-build-theme.zip')
  fs.writeFileSync(out, u8)
  console.log(`Wrote ${out} (${(u8.byteLength / 1024).toFixed(1)} KB)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
