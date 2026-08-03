import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
const OUT = process.argv[2]
const src = readFileSync(resolve('components/icons/animated/data.generated.ts'), 'utf8')
const SVG = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1))
// pull the zi-* CSS block from globals
const g = readFileSync(resolve('app/globals.css'), 'utf8')
const ziCss = g.slice(g.indexOf('.zi { display: inline-flex'))
const SW = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
const names = Object.keys(SVG)
const tiles = names.map((n) =>
  `<figure class="tile group"><span class="box zi"><svg viewBox="0 0 24 24" ${SW}>${SVG[n]}</svg></span><figcaption>${n}</figcaption></figure>`
).join('\n')
const css = `
:root{--bg:#fbfaf9;--card:#fff;--ink:#1a1a1a;--muted:#8a8a8a;--line:#ece9e6;--brand:#e0553d;--brand2:#f0a44b}
@media (prefers-color-scheme:dark){:root{--bg:#0f0f10;--card:#171718;--ink:#f2f0ee;--muted:#9a9793;--line:#262625;--brand:#f0664d;--brand2:#f4b264}}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;background:var(--bg);color:var(--ink)}
header{padding:48px 24px 6px;text-align:center}
header h1{margin:0;font-size:26px;letter-spacing:-.02em}
header p{color:var(--muted);margin:9px auto 0;max-width:600px;line-height:1.7}
.hint{display:inline-block;margin-top:12px;font-size:12px;color:var(--brand);border:1px solid color-mix(in srgb,var(--brand) 35%,transparent);border-radius:999px;padding:5px 13px;font-weight:700}
.wrap{max-width:1080px;margin:0 auto;padding:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:12px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 6px 11px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:transform .22s,box-shadow .22s,border-color .22s}
.tile:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(0,0,0,.11);border-color:transparent}
.box{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;color:#fff;background:linear-gradient(145deg,var(--brand),var(--brand2))}
.box svg{width:25px;height:25px}
figcaption{font-size:10.5px;font-weight:600;color:var(--muted);direction:ltr;text-align:center;word-break:break-word}
.note{text-align:center;color:var(--muted);font-size:12px;padding:12px 0 44px}
${ziCss}`
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>مكتبة أيقونات زينيا المتحركة</title><style>${css}</style></head><body>
<header><h1>مكتبة زينيا · ${names.length} أيقونة متحركة</h1><p>كل أيقونة تُحرّك أجزاءها بنفسها. مرّر المؤشّر فوق أي بطاقة كاملة (وليس الأيقونة فقط) — تمامًا كما يحدث داخل القوالب المولّدة.</p><span class="hint">مرّر فوق البطاقات ↓</span></header>
<div class="wrap"><div class="grid">
${tiles}
</div></div>
<p class="note">هذه أيقونات SVG حقيقية من مكوّن Icon — والنظام يغطّي كل المجالات مع بديل أنيق لأي اسم خارج القائمة</p>
</body></html>`
writeFileSync(OUT, html)
console.log('wrote', OUT, names.length, 'icons')
