/**
 * One-off codemod: Shopify rejects sections that declare BOTH "default"
 * and "presets" in {% schema %}. Merges the default.blocks into the
 * first preset's blocks field and drops the standalone default block.
 *
 * Operates on the section generator .ts files. Idempotent.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

const targets = [
  'lib/build/theme-generator.ts',
  'lib/build/sections/conversion.ts',
  'lib/build/sections/social-proof.ts',
  'lib/build/sections/product-extras.ts',
  'lib/build/sections/storytelling.ts',
  'lib/build/sections/marketing.ts',
]

let totalEdits = 0

for (const rel of targets) {
  const abs = path.resolve(process.cwd(), rel)
  let src = fs.readFileSync(abs, 'utf8')
  let edits = 0

  // Match: "default": { "blocks": [ ... ] },\n  "presets": [{ "name": "X" }]
  // Capture: defaultBlocks JSON, presetName
  // Replace with: "presets": [{ "name": "X", "blocks": <defaultBlocks> }]
  //
  // We do this iteratively because some files have many occurrences.
  // The regex is greedy-safe by anchoring on the `"presets":` line that
  // immediately follows.
  const re = /"default":\s*\{\s*"blocks":\s*(\[[\s\S]*?\])\s*\},\s*\n\s*"presets":\s*\[\s*\{\s*"name":\s*("(?:[^"\\]|\\.)*")\s*\}\s*\]/g

  src = src.replace(re, (_match, blocksJson, presetNameJson) => {
    edits++
    return `"presets": [{ "name": ${presetNameJson}, "blocks": ${blocksJson} }]`
  })

  if (edits > 0) {
    fs.writeFileSync(abs, src, 'utf8')
    console.log(`  ${rel}: fixed ${edits} section schema${edits === 1 ? '' : 's'}`)
    totalEdits += edits
  } else {
    console.log(`  ${rel}: nothing to do`)
  }
}

console.log(`\nTotal: ${totalEdits} sections fixed.`)
