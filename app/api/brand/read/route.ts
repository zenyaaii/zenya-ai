import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { serviceClient } from '@/lib/handover'
import { createClient } from '@/utils/supabase/server'
import { aiKey } from '@/lib/ai-client'
import { AI_MODEL } from '@/lib/ai'
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
type Site = { title: string; text: string; images: Img[]; pdfs: string[]; socials: Record<string, string>; phones: string[]; emails: string[] }

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
  const phones = links.filter((h) => h.startsWith('tel:')).map((h) => decodeURIComponent(h.slice(4)))
  const emails = links.filter((h) => h.startsWith('mailto:')).map((h) => h.slice(7).split('?')[0])
  $('script,style,noscript,svg,iframe').remove()
  const text = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim().slice(0, 12000)
  return { title: $('title').text().trim(), text, images: images.slice(0, 40), pdfs, socials, phones, emails }
}

/** One picture from the brand's site into theme-uploads. Logos keep their
    transparency and may be small; photos under 500px wide are dropped. */
async function copyImage(u: string, dir: string, logo: boolean): Promise<string | null> {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) })
    if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) return null
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > 15_000_000) return null
    const img = sharp(buf).rotate().resize({ width: logo ? 800 : 1600, height: logo ? 800 : 1600, fit: 'inside', withoutEnlargement: true })
    const out = logo ? await img.png().toBuffer() : await img.jpeg({ quality: 82 }).toBuffer()
    const meta = await sharp(out).metadata()
    if (!logo && ((meta.width || 0) < 500 || (meta.height || 0) < 400)) return null
    const path = `${dir}/${createHash('sha1').update(u).digest('hex').slice(0, 16)}.${logo ? 'png' : 'jpg'}`
    try {
      const sb = serviceClient().storage.from('theme-uploads')
      const { error } = await sb.upload(path, out, { contentType: logo ? 'image/png' : 'image/jpeg', upsert: true, cacheControl: '31536000' })
      if (!error) return sb.getPublicUrl(path).data.publicUrl
    } catch { /* storage down: the brand's own address still shows the picture */ }
    return u
  } catch { return null }
}

const PROMPT = `You read a brand's own website text and its catalogue, and fill a website builder's questions for that brand.

Rules:
- Use ONLY what the material says. If something is not there, leave it out (empty string or empty list). Never invent years, numbers, reviews, press, prices, people or places.
- Write every value in clear Modern Standard Arabic (translate from any language). Keep brand and product names as the brand writes them, in Arabic letters if the brand uses an Arabic form, otherwise transliterate naturally (CocoSu → كوكوسو).
- The brand's own claims about its product (health, quality, origin) are kept as the brand states them, written as features. Do not soften or judge them.
- Short and plain. No marketing filler that is not in the source.
- products: what the brand sells. Different sizes of the same product are separate items (name the size in "size").
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
"products":[{"name":"","text":"","size":""}],"products_note":"",
"contact":{"phone":"","whatsapp":"","email":"","address":""},"logo_index":-1,"hero_index":-1,
"found":{"website":"what you used from the site, in Arabic, one short line","pdf":"what you used from the catalogue, one short line"}}`

export async function POST(req: NextRequest) {
  let body: { website?: unknown; pdf?: unknown; instagram_bio?: unknown; demo?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const { data: { user } } = await createClient().auth.getUser().catch(() => ({ data: { user: null } }))
  const demo = !user && body.demo === true
  if (!user && !demo) return NextResponse.json({ error: 'sign_in' }, { status: 401 })
  if (!aiKey()) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const site = asUrl(body.website)
  let pdf = asUrl(body.pdf)
  if (!site && !pdf) return NextResponse.json({ error: 'nothing_to_read' }, { status: 400 })
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
      read?.phones.length ? `PHONE LINKS: ${read.phones.join(', ')}` : '',
      read?.emails.length ? `EMAIL LINKS: ${read.emails.join(', ')}` : '',
      bio ? `INSTAGRAM BIO: ${bio}` : '',
      read?.images.length ? `IMAGES:\n${read.images.map((m, i) => `${i}: ${m.url.split('/').pop()?.slice(0, 60)} alt="${m.alt}"`).join('\n')}` : 'IMAGES: none',
      PROMPT,
    ].filter(Boolean).join('\n\n'),
  })

  const client = new Anthropic({ apiKey: aiKey(), maxRetries: 1, timeout: 80_000 })
  let out: Record<string, any> = {}
  try {
    const res = await client.messages.create({ model: AI_MODEL, max_tokens: 4000, messages: [{ role: 'user', content: parts }] })
    void noteUp('anthropic')
    const t = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
    const a = t.indexOf('{'), z = t.lastIndexOf('}')
    out = JSON.parse(t.slice(a, z + 1))
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
  const imgs = read?.images || []
  const logoAt = typeof out.logo_index === 'number' ? out.logo_index : -1
  const dir = `${user ? 'owners/' + user.id : 'demo'}/brand/${(site || pdf)!.host.replace(/[^A-Za-z0-9.-]/g, '')}`
  const copied = await Promise.all(imgs.slice(0, 24).map((m, i) => copyImage(m.url, dir, i === logoAt)))
  const at = (i: unknown) => (typeof i === 'number' && i >= 0 && i < copied.length ? copied[i] || undefined : undefined)
  return NextResponse.json({
    answers: out,
    logo: at(out.logo_index),
    hero: at(out.hero_index),
    images: copied.filter((u, i): u is string => !!u && i !== logoAt),
    socials: read?.socials || {},
    pdf: pdf ? pdf.toString() : undefined,
    pdf_from_site: !!pdfFromSite,
  })
}
