/**
 * Rebuilds lib/research-files.json from content/research/ (the admin «البحوث» tab).
 * Folders: 1-reports, 2-plans, 3-niches/<niche>, 4-market-data/<type>, 5-agent-tools.
 * File names start with their date (YYYY-MM-DD-). Run: node scripts/research-index.cjs
 */
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..', 'content', 'research')
const out = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = path.join(d, e.name)
    if (e.isDirectory()) { walk(f); continue }
    const p = path.relative(ROOT, f).split(path.sep).join('/')
    const [group, sub] = p.split('/')
    const name = path.basename(p)
    const date = (name.match(/^\d{4}-\d{2}-\d{2}/) || [''])[0]
    const ext = path.extname(name).slice(1)
    let heading = ''
    if (ext === 'md') heading = ((fs.readFileSync(f, 'utf8').match(/^#{1,3}\s+(.+)$/m) || [])[1] || '').trim()
    if (ext === 'html') heading = ((fs.readFileSync(f, 'utf8').match(/<title>([^<]+)<\/title>/) || [])[1] || '').trim()
    // kind: the word after the date (ads, tiktok, reviews…), used for labels in lib/research.ts
    const kind = name.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.[^.]+$/, '')
    out.push({ p, group, sub: p.split('/').length > 2 ? sub : null, name, date, ext, kind, heading, size: fs.statSync(f).size })
  }
}
walk(ROOT)
fs.writeFileSync(path.join(__dirname, '..', 'lib', 'research-files.json'), JSON.stringify(out, null, 1) + '\n')
console.log(out.length, 'files')
