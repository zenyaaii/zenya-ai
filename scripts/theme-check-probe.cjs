const { chromium } = require('playwright')
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 2, hasTouch: true })
  await ctx.addInitScript(() => Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth }))
  await ctx.route('**://fonts.g*.com/**', (r) => r.abort())
  const p = await ctx.newPage()
  const probe = (sel) => `(() => {
    const el = document.querySelector('${sel}')
    if (!el) return null
    const chain = []
    let n = el
    while (n && n !== document.body) {
      const t = getComputedStyle(n).transform
      if (t && t !== 'none' && !/matrix\\(1, 0, 0, 1/.test(t)) chain.push((n.className||n.tagName).toString().slice(0,40) + ' :: ' + t)
      n = n.parentElement
    }
    return { sel: '${sel}', fontSize: getComputedStyle(el).fontSize, chain }
  })()`
  for (const [route, sels] of [['/pricing', ['.zp-name', '.cs-chip']], ['/themes', ['.zt-tag', '.zt-dot']], ['/', ['.tag', '.name']]]) {
    await p.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(2500)
    for (const s of sels) console.log(route, JSON.stringify(await p.evaluate(probe(s))))
  }
  await b.close()
})()
