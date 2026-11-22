import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { serviceClient } from '@/lib/handover'
import { pdfImages } from '@/lib/pdf-images'
import { createClient } from '@/utils/supabase/server'
import { aiKey } from '@/lib/ai-client'
import { AI_MODEL, AI_MODEL_FAST } from '@/lib/ai'
import { anthropicOutage, noteDown, noteUp } from '@/lib/service-health'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 90

/**
 * POST /api/brand/read — «روابطك أولًا» for the brand-story template.
 *
 * Body: { website?, pdf?, instagram_bio? }. We read the brand's own site
 * (its words, its pictures, its social links, and any catalogue PDF it links
 * to) and the catalogue, and hand back the questions already answered, in
 * Arabic. The owner then checks every answer in the wizard: nothing here is
 * placed on a site without him seeing it.
 *
 * Rules for the reader: only what the material says; translate to Arabic;
 * the owner's own claims (health, quality) are kept as he states them, as
 * features (Anas, 2026-11-20); unknown stays empty, never guessed.
 *
 * Signed in, or the public try page (demo: true), throttled.
 */

const MAX_PER_HOUR = 8
const DEMO_PER_HOUR = 4
const hits = new Map<string, number[]>()
function throttled(who: string, max: number) {
  const now = Date.now()
  const recent = (hits.get(who) || []).filter((t) => now - t < 3_600_000)
  if (recent.length >= max) { hits.set(who, recent); return true }
  recent.push(now); hits.set(who, recent); return false
}

const UA = 'Mozilla/5.0 (compatible; BeynounReader/1.0; +https://beynoun.com)'

function asUrl(v: unknown): URL | null {
  if (typeof v !== 'string' || !v.trim()) return null
  try { const u = new URL(/^https?:\/\//i.test(v.trim()) ? v.trim() : 'https://' + v.trim()); return /^https?:$/.test(u.protocol) ? u : null } catch { return null }
}

/** A Wix original can be 6000px wide; ask Wix for a 1600px copy instead. */
function sized(u: string): string {
  const m = /^(https:\/\/static\.wixstatic\.com\/media\/)([^/?#]+?\.(?:jpe?g|png|webp))$/i.exec(u)
  return m ? `${m[1]}${m[2]}/v1/fit/w_1600,h_1600,q_85/${m[2]}` : u
}

type Img = { url: string; alt: string }
type Site = { title: string; text: string; images: Img[]; pdfs: string[]; socials: Record<string, string>; phones: string[]; emails: string[]; about: string; catalogue: string[]; sells: boolean }
type Listed = { line: string; img?: string }

async function readSite(u: URL): Promise<Site | null> {
  const ctl = AbortSignal.timeout(15000)
  const res = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.8' }, signal: ctl, redirect: 'follow' }).catch(() => null)
  if (!res || !res.ok) return null
  const html = (await res.text()).slice(0, 3_000_000)
  const $ = cheerio.load(html)
  const abs = (h?: string) => { if (!h) return ''; try { return new URL(h, res.url).toString() } catch { return '' } }
  const images: Img[] = []
  const seen = new Set<string>()
  const add = (src: string, alt: string) => {
    if (!src || src.startsWith('data:') || /\.svg(\?|$)/i.test(src) || /(pixel|tracking|spacer|blank)\./i.test(src)) return
    const key = src.replace(/\/v1\/.*$/, '').split('?')[0]
    if (seen.has(key)) return
    seen.add(key); images.push({ url: sized(src), alt: alt.slice(0, 120) })
  }
  const og = $('meta[property="og:image"]').attr('content')
  if (og) add(abs(og), 'og')
  $('img').each((_, el) => {
    const e = $(el)
    const src = abs(e.attr('src') || e.attr('data-src') || '')
    add(src.replace(/(\.(?:jpe?g|png|webp))\/v1\/.*$/i, '$1'), e.attr('alt') || '')
  })
  // Wix and other builders keep pictures in JSON too.
  for (const m of html.matchAll(/https:\/\/static\.wixstatic\.com\/media\/[A-Za-z0-9_~%.-]+?\.(?:jpe?g|png|webp)/gi)) add(m[0].replace('%7E', '~'), '')
  const links = $('a[href]').map((_, el) => abs($(el).attr('href'))).get()
  const pdfs = [...new Set(links.filter((h) => /\.pdf(\?|$)/i.test(h)))].slice(0, 3)
  const socials: Record<string, string> = {}
  for (const h of links) {
    if (/instagram\.com\/[^/?#]+/i.test(h) && !socials.instagram) socials.instagram = h.split('?')[0]
    else if (/tiktok\.com\/@/i.test(h) && !socials.tiktok) socials.tiktok = h.split('?')[0]
    else if (/facebook\.com\//i.test(h) && !/sharer/i.test(h) && !socials.facebook) socials.facebook = h
    else if (/(twitter|x)\.com\/[^/?#]+/i.test(h) && !/intent/i.test(h) && !socials.x) socials.x = h.split('?')[0]
    else if (/youtube\.com\/(@|channel|c\/)/i.test(h) && !socials.youtube) socials.youtube = h
    else if (/(wa\.me|api\.whatsapp\.com)/i.test(h) && !socials.whatsapp) socials.whatsapp = h
  }
  // The story usually lives on its own page («من نحن», «قصتنا», About).
  const ABOUT = /(من نحن|قصتنا|قصة|عن (?:العلامة|الشركة|المتجر)|about|our story)/i
  const aboutHref = $('a[href]').map((_, el) => ({ h: abs($(el).attr('href')), t: `${$(el).text()} ${$(el).attr('aria-label') || ''}` })).get()
    .find((a) => ABOUT.test(a.t) && sameSite(a.h, res.url) && a.h.split('#')[0] !== res.url.split('#')[0])?.h
  const phones = links.filter((h) => h.startsWith('tel:')).map((h) => decodeURIComponent(h.slice(4)))
  const emails = links.filter((h) => h.startsWith('mailto:')).map((h) => h.slice(7).split('?')[0])
  $('script,style,noscript,svg,iframe').remove()
  const text = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim().slice(0, 12000)
  const [about, listed] = await Promise.all([aboutHref ? pageText(aboutHref) : Promise.resolve(''), storeList(new URL(res.url))])
  // The store's own product shots go after the page's first pictures, each named
  // by its product, so the reader can give every product its own picture.
  const shots: Img[] = listed.filter((x) => x.img && !seen.has(x.img.split('?')[0])).slice(0, 12).map((x) => ({ url: x.img!, alt: x.line.split(' — ')[0].slice(0, 120) }))
  const pics = [...images.slice(0, 12), ...shots, ...images.slice(12)].slice(0, 40)
  const sells = listed.length > 0 || /(أضف إلى السلة|أضف للسلة|add to (cart|bag|basket)|checkout|السلة)/i.test(text)
  return { title: $('title').text().trim(), text, images: pics, pdfs, socials, phones, emails, about, catalogue: listed.map((x) => x.line), sells }
}

function sameSite(h: string, base: string) {
  try { return new URL(h).host.replace(/^www\./, '') === new URL(base).host.replace(/^www\./, '') } catch { return false }
}

async function pageText(u: string): Promise<string> {
  const res = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'ar,en;q=0.8' }, signal: AbortSignal.timeout(10000) }).catch(() => null)
  if (!res || !res.ok) return ''
  const $ = cheerio.load((await res.text()).slice(0, 2_000_000))
  $('script,style,noscript,svg,iframe,header,nav,footer').remove()
  return $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim().slice(0, 5000)
}

/**
 * Most brands sell from a Shopify, Salla or Zid store whose product grid is
 * drawn by script, so the home page text holds few products. The store's own
 * product list is read instead: Shopify's products.json, else the sitemap.
 */
async function storeList(u: URL): Promise<Listed[]> {
  const get = (p: string) => fetch(new URL(p, u.origin), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.text() : '')).catch(() => '')
  try {
    const j = JSON.parse(await get('/products.json?limit=60'))
    if (Array.isArray(j.products) && j.products.length) {
      return j.products.slice(0, 60).map((p: any) => {
        const sizes = (p.variants || []).map((v: any) => `${v.title === 'Default Title' ? '' : v.title} ${v.price}`.trim()).slice(0, 6).join(' | ')
        return { line: `${p.title}${p.product_type ? ` (${p.product_type})` : ''}${sizes ? ` — ${sizes}` : ''}`, img: p.images?.[0]?.src ? String(p.images[0].src).split('?')[0] + '?width=1200' : undefined }
      })
    }
  } catch { /* not Shopify */ }
  const lang = /^\/(ar|en)\b/.exec(u.pathname)?.[1] || 'ar'
  const index = await get('/sitemap.xml')
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((l) => /\.xml$/.test(l) && !/blog|page|categor/i.test(l)).slice(0, 4)
  const blocks: string[] = []
  const split = (x: string) => x.split(/<\/url>/).filter((b) => b.includes('<loc>'))
  for (const x of maps) blocks.push(...split(await get(x)))
  if (!maps.length) blocks.push(...split(index))
  const out = new Map<string, Listed>()
  for (const b of blocks) {
    const l = /<loc>([^<]+)<\/loc>/.exec(b)?.[1] || ''
    let path = ''
    try { path = decodeURIComponent(new URL(l).pathname) } catch { continue }
    if (new RegExp(`^/(?!${lang}/)(ar|en)/`).test(path)) continue
    const m = /\/([^/]+)\/p\d+\/?$/.exec(path) || /\/products?\/([^/]+)\/?$/.exec(path)
    if (!m) continue
    const name = m[1].replace(/[-+_]+/g, ' ').trim()
    if (!out.has(name)) out.set(name, { line: name, img: /<image:loc>([^<]+)<\/image:loc>/.exec(b)?.[1] })
    if (out.size >= 60) break
  }
  return [...out.values()]
}

/** One picture from the brand's site, resized, with a small copy for looking at. */
type Pic = { src: string; buf: Buffer; png: Buffer; w: number; h: number; thumb: string; alpha?: boolean; fromPdf?: boolean }
async function fetchPic(u: string): Promise<Pic | null> {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) })
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const raw = Buffer.from(await r.arrayBuffer())
    if (raw.length > 15_000_000) return null
    const base = sharp(raw).rotate()
    const meta = await base.metadata()
    if ((meta.width || 0) < 120 || (meta.height || 0) < 120) return null
    const buf = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
    const png = await base.clone().resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    const thumb = (await base.clone().resize({ width: 320, height: 320, fit: 'inside' }).flatten({ background: '#ffffff' }).jpeg({ quality: 70 }).toBuffer()).toString('base64')
    return { src: u, buf, png, w: meta.width || 0, h: meta.height || 0, thumb }
  } catch { return null }
}

/** The catalogue's own pictures (product packs, the farm, the fruit), read from
    the PDF itself. Cut-outs keep their transparency. */
async function pdfPics(u: URL): Promise<Pic[]> {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
    if (!r.ok) return []
    const pdf = Buffer.from(await r.arrayBuffer())
    if (pdf.length > 40_000_000) return []
    const imgs = await pdfImages(pdf, { min: 300, max: 16 })
    return (await Promise.all(imgs.map(async (m, i): Promise<Pic | null> => {
      try {
        const base = sharp(m.buf)
        const meta = await base.metadata()
        const alpha = !!meta.hasAlpha
        const buf = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer()
        const png = await base.clone().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
        const thumb = (await base.clone().resize({ width: 320, height: 320, fit: 'inside' }).flatten({ background: '#ffffff' }).jpeg({ quality: 70 }).toBuffer()).toString('base64')
        return { src: `${u}#img${i}`, buf, png, w: m.w, h: m.h, thumb, alpha, fromPdf: true }
      } catch { return null }
    }))).filter((p): p is Pic => !!p)
  } catch { return [] }
}

/** Into theme-uploads. Storage down: the brand's own address still shows it. */
async function store(p: Pic, dir: string, logo: boolean): Promise<string> {
  const asPng = logo || !!p.alpha
  try {
    const path = `${dir}/${createHash('sha1').update(p.src).digest('hex').slice(0, 16)}.${asPng ? 'png' : 'jpg'}`
    const sb = serviceClient().storage.from('theme-uploads')
    const { error } = await sb.upload(path, asPng ? p.png : p.buf, { contentType: asPng ? 'image/png' : 'image/jpeg', upsert: true, cacheControl: '31536000' })
    if (!error) return sb.getPublicUrl(path).data.publicUrl
  } catch { /* fall through */ }
  // No storage on a local dev server (no service key): keep the file under public/ so the whole flow can be tried.
  if (process.env.NODE_ENV === 'development') {
    try {
      const { mkdir, writeFile } = await import('fs/promises')
      const name = `${createHash('sha1').update(p.src).digest('hex').slice(0, 16)}.${asPng ? 'png' : 'jpg'}`
      await mkdir(`${process.cwd()}/public/_dev-uploads`, { recursive: true })
      await writeFile(`${process.cwd()}/public/_dev-uploads/${name}`, asPng ? p.png : p.buf)
      return `/_dev-uploads/${name}`
    } catch { /* fall through */ }
  }
  // Storage down: a site picture still has its own address; a catalogue one has none and is left out
  // (a data: URL would not fit the build's 600-character photo fields).
  return p.fromPdf ? '' : p.src
}

const LOOK = `Each numbered picture comes from a brand's own website or catalogue. Say what each one is:
"logo" (the brand's mark), "product" (the brand's own packaged product: a bottle, carton, box, jar or bag with its label, shown clearly; raw ingredients or fruit are "photo"), "photo" (a real photograph or rich picture: place, people, nature, ingredients), "text" (a graphic, banner or page that is mostly writing), or "other" (icons, badges, QR codes, maps, decorations, other companies' logos).
Mark a picture that repeats an earlier one (same picture, other size) as "other".
Then pick the best "hero": a wide, sharp photo with a clear subject that would look good at the top of the brand's site (not a blurred or empty background, not a cut-out on plain colour, and with NO words, prices or sale banners written over it: our own headline goes on top), or -1.
Answer with JSON only: {"kinds":["photo","logo",...],"hero":2}`

/** A quick look at the thumbnails, so text graphics and the logo stay out of
    the photo list. Cheap model, small pictures. */
async function lookAt(client: Anthropic, pics: Pic[]): Promise<{ kinds: string[]; hero: number } | null> {
  if (!pics.length) return null
  try {
    const content: Anthropic.ContentBlockParam[] = []
    pics.forEach((p, i) => {
      content.push({ type: 'text', text: `${i}:` })
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.thumb } })
    })
    content.push({ type: 'text', text: LOOK })
    const res = await client.messages.create({ model: AI_MODEL_FAST, max_tokens: 1500, messages: [{ role: 'user', content }] })
    const t = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
    const a = t.indexOf('{'), z = t.lastIndexOf('}')
    if (a < 0 || z < a) { console.error('[brand/read] look said', t.slice(0, 300)); return null }
    const j = JSON.parse(t.slice(a, z + 1))
    console.log('[brand/read] look tokens', res.usage.input_tokens, res.usage.output_tokens)
    return { kinds: Array.isArray(j.kinds) ? j.kinds.map(String) : [], hero: typeof j.hero === 'number' ? j.hero : -1 }
  } catch (e) {
    console.error('[brand/read] look', e instanceof Error ? e.message : e)
    return null
  }
}

/** A stray quote in a long answer breaks JSON.parse; the small model mends it rather than losing the whole read. */
async function parseOrMend(client: Anthropic, t: string): Promise<Record<string, any>> {
  try { return JSON.parse(t) } catch (e) {
    console.error('[brand/read] mending JSON:', e instanceof Error ? e.message : e)
    const r = await client.messages.create({ model: AI_MODEL_FAST, max_tokens: 4000, messages: [{ role: 'user', content: `Fix this so it is valid JSON. Change nothing else. Answer with the JSON only.\n\n${t}` }] })
    const f = r.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
    return JSON.parse(f.slice(f.indexOf('{'), f.lastIndexOf('}') + 1))
  }
}

const PROMPT = `You read a brand's own website text and its catalogue, and fill a website builder's questions for that brand.

Rules:
- Use ONLY what the material says. If something is not there, leave it out (empty string or empty list). Never invent years, numbers, reviews, press, prices, people or places.
- Write every value in clear Modern Standard Arabic (translate from any language). Keep brand and product names as the brand writes them, in Arabic letters if the brand uses an Arabic form, otherwise transliterate naturally (CocoSu → كوكوسو).
- The brand's own claims about its product (health, quality, origin) are kept as the brand states them, written as features. Do not soften or judge them.
- Short and plain. No marketing filler that is not in the source.
- Instagram bio and captions are the owner's own words: products, sizes, prices, scents and how things are made that the captions name count. Ignore hashtags, giveaways and greetings.
- products: what the brand sells, up to 24, the most representative first (use the STORE PRODUCT LIST when given). Different sizes of the same product are ONE item: put the sizes in "size" ("100 مل · 50 مل") and the prices in "price" as written with the currency ("من 690 ر.س"). Never invent a price.
- photo_index: the index in IMAGES whose alt names this product, or -1. Never guess from the file name alone.
- products_note: anything else the brand offers that is not a product (workshops, wholesale, gift boxes, subscriptions), one short line.
- steps: how the product is made or reaches the customer, in order, only if described.
- values: what the brand says it stands for (2–4).
- benefits: what the product does for the customer, if the material lists it.
- story.paragraphs: how the brand began, in 1–3 short paragraphs, only from the source.
- story.quote: one sentence the brand itself says about its promise, if there is one (quote it, translated).
- logo_index: the index (in the IMAGES list) of the brand's logo, or -1.
- hero_index: the index of the best wide photo for the top of the site (a real photo, not a logo, not a page of text), or -1.

Answer with one JSON object:
{"name":"","kind":"","tagline":"","intro":"","city":"","story":{"heading":"","paragraphs":[],"quote":""},
"values":[{"title":"","text":""}],"steps":[{"title":"","text":""}],"benefits":[{"title":"","text":""}],
"products":[{"name":"","text":"","size":"","price":"","photo_index":-1}],"products_note":"",
"contact":{"phone":"","whatsapp":"","email":"","address":""},"logo_index":-1,"hero_index":-1,
"found":{"website":"what you used from the site, in Arabic, one short line","pdf":"what you used from the catalogue, one short line"}}`

export async function POST(req: NextRequest) {
  let body: { website?: unknown; pdf?: unknown; instagram_bio?: unknown; instagram_captions?: unknown; instagram_name?: unknown; demo?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { data: { user } } = await createClient().auth.getUser().catch(() => ({ data: { user: null } }))
  const demo = !user && body.demo === true
  if (!user && !demo) return NextResponse.json({ error: 'sign_in' }, { status: 401 })
  if (!aiKey()) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const site = asUrl(body.website)
  let pdf = asUrl(body.pdf)
  // A brand on Instagram alone: its bio and post captions are the material.
  const caps = (Array.isArray(body.instagram_captions) ? body.instagram_captions : []).filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 600)).slice(0, 12)
  const igName = typeof body.instagram_name === 'string' ? body.instagram_name.slice(0, 80) : ''
  const hasIg = caps.length > 0 || (typeof body.instagram_bio === 'string' && body.instagram_bio.trim().length > 0)
  if (!site && !pdf && !hasIg) return NextResponse.json({ error: 'nothing_to_read' }, { status: 400 })
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  if (throttled(user ? user.id : 'demo:' + ip, demo ? DEMO_PER_HOUR : MAX_PER_HOUR)) return NextResponse.json({ error: 'too_many' }, { status: 429 })

  const read = site ? await readSite(site) : null
  if (site && !read && !pdf) return NextResponse.json({ error: 'site_unreachable' }, { status: 422 })
  // A catalogue the site links to is read too, unless the owner gave one.
  const pdfFromSite = !pdf && read?.pdfs[0] ? read.pdfs[0] : null
  if (pdfFromSite) pdf = asUrl(pdfFromSite)

  const parts: Anthropic.ContentBlockParam[] = []
  if (pdf) parts.push({ type: 'document', source: { type: 'url', url: pdf.toString() }, title: 'Catalogue' })
  const bio = typeof body.instagram_bio === 'string' ? body.instagram_bio.slice(0, 600) : ''
  parts.push({
    type: 'text',
    text: [
      read ? `WEBSITE ${site}\nTITLE: ${read.title}\nTEXT:\n${read.text}` : '',
      read?.about ? `ABOUT PAGE:\n${read.about}` : '',
      read?.catalogue.length ? `STORE PRODUCT LIST (from the brand's own store; name — size price):\n${read.catalogue.join('\n')}` : '',
      read?.phones.length ? `PHONE LINKS: ${read.phones.join(', ')}` : '',
      read?.emails.length ? `EMAIL LINKS: ${read.emails.join(', ')}` : '',
      igName ? `INSTAGRAM NAME: ${igName}` : '',
      bio ? `INSTAGRAM BIO: ${bio}` : '',
      caps.length ? `INSTAGRAM POST CAPTIONS (newest first):\n${caps.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : '',
      read?.images.length ? `IMAGES:\n${read.images.map((m, i) => `${i}: ${m.url.split('/').pop()?.slice(0, 60)} alt="${m.alt}"`).join('\n')}` : 'IMAGES: none',
      PROMPT,
    ].filter(Boolean).join('\n\n'),
  })

  const client = new Anthropic({ apiKey: aiKey(), maxRetries: 1, timeout: 80_000 })
  // The pictures are fetched and looked at while the words are read.
  const picsJob = (async () => {
    const [site, cat] = await Promise.all([
      Promise.all((read?.images || []).slice(0, 24).map((m) => fetchPic(m.url))),
      pdf ? pdfPics(pdf) : Promise.resolve([] as Pic[]),
    ])
    const pics = [...site.filter((p): p is Pic => !!p), ...cat].slice(0, 30)
    return { pics, look: await lookAt(client, pics) }
  })()
  let out: Record<string, any> = {}
  try {
    const res = await client.messages.create({ model: AI_MODEL, max_tokens: 6000, messages: [{ role: 'user', content: parts }] })
    void noteUp('anthropic')
    const t = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
    const a = t.indexOf('{'), z = t.lastIndexOf('}')
    out = await parseOrMend(client, t.slice(a, z + 1))
    console.log('[brand/read] tokens', res.usage.input_tokens, res.usage.output_tokens)
  } catch (e) {
    const o = anthropicOutage(e)
    if (o) { await noteDown(o); return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 }) }
    console.error('[brand/read]', e instanceof Error ? e.message : e)
    // The site's own facts still help without the model.
    if (!read) return NextResponse.json({ error: 'read_failed' }, { status: 502 })
  }

  // The brand's own pictures are copied to our storage: the site keeps working
  // if the old host goes, and the colour reader only measures our own host.
  const { pics, look } = await picsJob
  const kind = (i: number) => look?.kinds[i] || 'photo'
  let logoAt = pics.findIndex((_, i) => kind(i) === 'logo')
  if (logoAt < 0 && !look && typeof out.logo_index === 'number') logoAt = pics.findIndex((p) => p.src === read?.images[out.logo_index]?.url)
  const dir = `${user ? 'owners/' + user.id : 'demo'}/brand/${site || pdf ? (site || pdf)!.host.replace(/[^A-Za-z0-9.-]/g, '') : 'instagram'}`
  const urls = await Promise.all(pics.map((p, i) => store(p, dir, i === logoAt)))
  const kept = (u: string) => !!u
  const productPics = urls.filter((u, i) => kept(u) && i !== logoAt && kind(i) === 'product')
  const photos = urls.filter((u, i) => kept(u) && i !== logoAt && (kind(i) === 'photo' || kind(i) === 'product'))
  const others = urls.filter((u, i) => kept(u) && i !== logoAt && kind(i) === 'text')
  // Each product gets the picture the reader matched to it, when that picture survived.
  const urlOf = (idx: unknown) => {
    const src = typeof idx === 'number' ? read?.images[idx]?.url : undefined
    const k = src ? pics.findIndex((p) => p.src === src) : -1
    return k >= 0 && k !== logoAt ? urls[k] || '' : ''
  }
  if (Array.isArray(out.products)) out.products = out.products.slice(0, 24).map((p: any) => { const { photo_index, ...rest } = p || {}; return { ...rest, photo: urlOf(photo_index) } })
  const heroAt = look && look.hero >= 0 && kind(look.hero) === 'photo' ? look.hero : pics.findIndex((_, i) => kind(i) === 'photo' && pics[i].w >= pics[i].h)
  return NextResponse.json({
    answers: out,
    logo: logoAt >= 0 ? urls[logoAt] || undefined : undefined,
    hero: heroAt >= 0 ? urls[heroAt] || undefined : undefined,
    images: photos,
    other_images: others,
    product_images: productPics,
    socials: read?.socials || {},
    sells: !!read?.sells,
    pdf: pdf ? pdf.toString() : undefined,
    pdf_from_site: !!pdfFromSite,
  })
}
