import { Marked } from 'marked'

/**
 * A research markdown file as a page to read (admin «البحوث» → «فتح»).
 *
 * Design «ب · الليل مع فهرس», chosen by Anas on 2026-11-27: the night palette
 * of the admin dashboard, Amiri headings + Markazi Text body, a sticky index of
 * the report's sections beside it on a laptop (a folding list on a phone), the
 * «الخلاصة» section lifted into a box, and every table turned into one card
 * per row on a phone. Arabic reports read right to left; a file that is mostly
 * Latin text is laid out left to right.
 *
 * The page carries no script. Raw HTML inside a markdown file is shown as
 * text, never run.
 */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()

const md = new Marked({ gfm: true })
md.use({ renderer: { html: ({ text }) => esc(text) } })

const isSummary = (t: string) => /^(ال)?خلاصة|^ملخص|^summary|^tl;?dr/i.test(t.trim())

export type ResearchPage = { html: string; title: string; dir: 'rtl' | 'ltr' }

/** Renders the markdown body: ids on h2, the summary boxed, tables wrapped and labelled. */
export function renderResearchBody(source: string) {
  let html = md.parse(source, { async: false }) as string

  // Index: every h2 gets an id; h1 (first) becomes the page title.
  const toc: Array<[string, string]> = []
  let n = 0
  html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    const id = `s${++n}`
    const t = strip(inner)
    toc.push([id, t])
    return `<h2 id="${id}"${isSummary(t) ? ' data-sum' : ''}>${inner}</h2>`
  })
  const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/)
  const title = h1 ? strip(h1[1]) : ''

  // The summary section (up to the next h2) goes into a box, heading inside.
  html = html.replace(/<h2 id="(s\d+)" data-sum>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2 |$)/, (_m, id, inner, body) =>
    `<section class="sum" aria-labelledby="${id}"><h2 id="${id}">${inner}</h2>${body}</section>`)

  // Tables: a scroll wrapper, and each cell named after its column for the phone cards.
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, (_m, t: string) => {
    const heads = [...(t.match(/<thead>[\s\S]*?<\/thead>/)?.[0] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((x) => esc(strip(x[1])))
    const body = t.replace(/<tbody>([\s\S]*?)<\/tbody>/, (_b, rows: string) =>
      `<tbody>${rows.replace(/<tr>([\s\S]*?)<\/tr>/g, (_r, cells: string) => {
        let i = 0
        return `<tr>${cells.replace(/<td([^>]*)>/g, (_c, a: string) => `<td${a} data-l="${heads[i++] ?? ''}">`)}</tr>`
      })}</tbody>`)
    return `<div class="tw"><table>${body}</table></div>`
  })

  // External links open beside the dashboard.
  html = html.replace(/<a href="(https?:[^"]*)"/g, '<a href="$1" target="_blank" rel="noreferrer"')

  const arabic = (source.match(/[؀-ۿ]/g) ?? []).length
  const latin = (source.match(/[A-Za-z]/g) ?? []).length
  return { html, toc, title, dir: (arabic * 2 >= latin ? 'rtl' : 'ltr') as 'rtl' | 'ltr' }
}

const CSS = `
:root{color-scheme:dark;--bg:#16120D;--panel:#1A1713;--card:#1F1B16;--line:#2C2620;--ink:#F4EFE6;--soft:#D9D1C4;--mut:#A79D90;--acc:#F07A52;--code:#F1C9A8}
*{box-sizing:border-box;min-width:0}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:19px/1.6 "Markazi Text",Thmanyah,serif;overflow-x:clip;-webkit-text-size-adjust:100%}
.wrap{display:grid;grid-template-columns:260px minmax(0,1fr);max-width:1240px;margin-inline:auto;min-height:100vh}
.toc{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;padding:36px 22px;border-inline-end:1px solid var(--line);font-size:17px}
.toc .back{display:block;color:var(--acc);text-decoration:none;font-weight:600;margin-bottom:22px}
.toc b{display:block;font:700 18px Amiri,serif;color:var(--mut);margin-bottom:8px}
.toc a.i{display:block;color:var(--soft);text-decoration:none;padding:7px 12px;border-radius:10px;line-height:1.35}
.toc a.i:hover,.toc a.i:focus-visible{background:var(--card);color:#fff;outline:none}
.mtoc{display:none}
main{padding:clamp(22px,4vw,56px) clamp(18px,4vw,56px) 80px;max-width:880px}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 16px;font-size:16px;color:var(--mut);margin-bottom:18px}
.top a{color:var(--acc);text-decoration:none;font-weight:600}
h1,h2,h3,h4{font-family:Amiri,Thmanyah,serif;font-weight:700;line-height:1.35;letter-spacing:0;color:#fff}
h1{font-size:clamp(28px,4vw,40px);margin:0 0 12px}
h2{font-size:26px;margin:44px 0 14px;scroll-margin-top:16px}
h3{font-size:21px;margin:28px 0 8px}
h4{font-size:19px;margin:22px 0 6px}
p{margin:0 0 14px}
ul,ol{padding-inline-start:24px;margin:0 0 16px}
li{margin-bottom:8px}
li::marker{color:var(--acc)}
a{color:var(--acc);overflow-wrap:anywhere}
strong{font-weight:700;color:#fff}
hr{border:0;border-top:1px solid var(--line);margin:32px 0}
blockquote{margin:0 0 16px;padding:10px 16px;border-inline-start:3px solid var(--acc);background:var(--panel);border-radius:10px;color:var(--soft)}
code{font:14px/1.4 "IBM Plex Mono",ui-monospace,monospace;direction:ltr;unicode-bidi:isolate;background:#26211B;color:var(--code);padding:1px 6px;border-radius:6px;overflow-wrap:anywhere}
pre{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;overflow-x:auto;direction:ltr;text-align:left}
pre code{background:none;padding:0;overflow-wrap:normal}
img{max-width:100%;border-radius:12px}
.sum{border:1px solid #3A2C22;background:linear-gradient(#211913,#1A1612);border-radius:18px;padding:20px 22px 8px;margin:18px 0 8px}
.sum h2{font-size:22px;margin:0 0 10px;color:var(--acc)}
.tw{overflow-x:auto;margin:6px 0 22px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
table{border-collapse:collapse;width:100%;color:inherit;font-size:17px;line-height:1.5}
th,td{padding:10px 12px;text-align:start;vertical-align:top}
th{font-weight:700;white-space:nowrap;background:#211C17;color:#CFC6B8;border-bottom:1px solid var(--line)}
td{border-bottom:1px solid #27221C}
tr:last-child td{border-bottom:0}
@media (max-width:760px){
 body{font-size:18px}
 .wrap{display:block}
 .toc{display:none}
 .mtoc{display:block;border-bottom:1px solid var(--line);padding:14px 18px}
 .mtoc summary{cursor:pointer;font:700 18px Amiri,serif;color:var(--acc);min-height:32px}
 .mtoc a.i{display:block;color:var(--soft);text-decoration:none;padding:8px 4px;border-bottom:1px solid #221D18}
 h2{font-size:23px}
 .tw{border:0;background:none;overflow:visible}
 thead{display:none}
 table,tbody,tr,td{display:block;width:100%}
 tr{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 14px;margin-bottom:10px}
 td{border:0!important;padding:6px 0}
 td::before{content:attr(data-l);display:block;color:var(--mut);font-size:15px;line-height:1.3}
 td:empty{display:none}
}
@media print{.toc,.mtoc,.top{display:none}.wrap{display:block}}
`

/** The whole page for one file. `back` is the admin page, `download` the file's own URL. */
export function researchPage(source: string, o: { fallbackTitle: string; group: string; date: string; back: string; download: string }): ResearchPage {
  const { html, toc, title: h1, dir } = renderResearchBody(source)
  const title = h1 || o.fallbackTitle
  const rtl = dir === 'rtl'
  const items = toc.map(([id, t]) => `<a class="i" href="#${id}">${esc(t)}</a>`).join('')
  const meta = [o.group, o.date].filter(Boolean).map(esc).join(' · ')
  const back = `<a class="back" href="${esc(o.back)}">${rtl ? '→ كل البحوث' : '← All research'}</a>`
  const page = `<!doctype html><html lang="${rtl ? 'ar' : 'en'}" dir="${dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Markazi+Text:wght@400;600;700&family=IBM+Plex+Mono&display=swap">
<style>${CSS}</style></head><body>
<div class="wrap">
${toc.length ? `<nav class="toc" aria-label="فهرس التقرير">${back}<b>${rtl ? 'في هذا التقرير' : 'In this report'}</b>${items}</nav>` : `<nav class="toc">${back}</nav>`}
<main>
${toc.length ? `<details class="mtoc"><summary>${rtl ? 'فهرس التقرير' : 'Contents'}</summary>${items}</details>` : ''}
<div class="top"><a href="${esc(o.back)}">${rtl ? '→ كل البحوث' : '← All research'}</a><span>${meta}${meta ? ' · ' : ''}<a href="${esc(o.download)}">${rtl ? 'تحميل' : 'Download'}</a></span></div>
${html}
</main></div></body></html>`
  return { html: page, title, dir }
}
