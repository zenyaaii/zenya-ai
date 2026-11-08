import { AiClient, aiKey } from '@/lib/ai-client'
import { AI_MODEL_FAST } from '@/lib/ai'
import { logAiUsage } from '@/lib/ai-usage'
import { apify } from './sources'

/**
 * Step 1b: find the place's own Instagram and Facebook when the lead carries
 * no link. Most leads were saved from Google Maps, which holds no social
 * links, so without this a place with 24k followers was built from Google
 * photos alone.
 *
 *  1. One Google search (through Apify) per network:
 *       site:instagram.com "<name>" <city>   and   site:facebook.com "<name>" <city>
 *  2. The candidate Instagram profiles are opened (bio, followers, site).
 *  3. A small AI call picks the account that is THIS branch, or none. Chains
 *     have family and fan accounts and other cities' branches; a wrong account
 *     would put a stranger's photos on the site, so "none" is always allowed.
 *
 * Never throws. Nothing found is an ordinary outcome.
 */

export type Who = { placeId?: string; name: string; city?: string | null; area?: string | null; address?: string | null; phone?: string | null }
export type Found = { instagram?: string; facebook?: string; why?: string }

const IG_SKIP = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'popular', 'tv', 'accounts', 'direct'])
const FB_SKIP = new Set(['groups', 'events', 'watch', 'marketplace', 'photo', 'photo.php', 'story.php', 'permalink.php', 'hashtag', 'share', 'login', 'profile.php'])

export function igHandle(url: string): string | null {
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(url || '')
  if (!m) return null
  const h = m[1].toLowerCase()
  return IG_SKIP.has(h) ? null : h
}
export function fbPage(url: string): string | null {
  const m = /facebook\.com\/([A-Za-z0-9.\-_]+)/i.exec(url || '')
  if (!m || FB_SKIP.has(m[1].toLowerCase())) return null
  return `https://www.facebook.com/${m[1]}`
}

/** The place's English name and city from Google: most accounts are found by their Latin name. */
async function englishOf(placeId?: string): Promise<{ name?: string; city?: string }> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.google_places_api_key || ''
  if (!placeId || !key) return {}
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,addressComponents' }, cache: 'no-store',
    })
    const d: any = await r.json()
    const city = (d.addressComponents ?? []).find((c: any) => (c.types ?? []).includes('locality'))?.longText
    return { name: d.displayName?.text, city }
  } catch { return {} }
}

/** "مطعم سلطان العرب" is searched as "سلطان العرب": the generic word only narrows the match. */
const core = (n: string) => n.split(/\s+[-–|•(]\s*|\s*[|(]/)[0]
  .replace(/^(مطعم|مطاعم|كافيه|كافه|مقهى|مشويات|حلويات|restaurant|cafe|café)\s+/i, '').replace(/\s+(restaurant|restaurants|cafe|café|grill)$/i, '').trim()

async function search(q: string): Promise<{ url: string; title: string; text: string }[]> {
  const out = await apify('apify~google-search-scraper', { queries: q, maxPagesPerQuery: 1, resultsPerPage: 10 }, 60000)
  return out.flatMap((page: any) => (page?.organicResults ?? []).map((r: any) => ({
    url: String(r?.url || ''), title: String(r?.title || ''), text: String(r?.description || '').slice(0, 200),
  })))
}

/** Counts, keeping first-seen order: the handle Google ranks first and names most often leads. */
function tally(xs: (string | null)[]): string[] {
  const n = new Map<string, number>()
  xs.forEach((x) => { if (x) n.set(x, (n.get(x) || 0) + 1) })
  return Array.from(n.keys()).sort((a, b) => (n.get(b)! - n.get(a)!)).slice(0, 4)
}

export async function findSocial(who: Who): Promise<Found> {
  try {
    const en = await englishOf(who.placeId)
    const names = Array.from(new Set([en.name && `"${core(en.name)}" ${en.city || ''}`, `${core(who.name)} ${who.area || who.city || ''}`].filter(Boolean) as string[]))
    // One actor run per network, each with the Latin and the Arabic query.
    const [igHits, fbHits] = await Promise.all([
      search(names.map((n) => `site:instagram.com ${n}`).join('\n')),
      search(names.map((n) => `site:facebook.com ${n}`).join('\n')),
    ])
    // Handles named in the results (a fan page's "@sultanalarab.ae") count too.
    const mentions = (t: string) => Array.from(t.matchAll(/@([A-Za-z0-9._]{3,30})/g)).map((m) => m[1].replace(/\.$/, '').toLowerCase())
    const igCands = tally([...igHits.map((h) => igHandle(h.url)), ...[...igHits, ...fbHits].flatMap((h) => mentions(`${h.title} ${h.text}`))])
    const fbCands = tally(fbHits.map((h) => fbPage(h.url)))
    if (!igCands.length && !fbCands.length) return {}

    const open = (hs: string[]) => hs.length
      ? apify('apify~instagram-scraper', { directUrls: hs.map((h) => `https://www.instagram.com/${h}/`), resultsType: 'details', resultsLimit: 1 }, 45000)
      : Promise.resolve([] as any[])
    const profiles = await open(igCands)
    // A family or fan account usually names the official one in its bio: open that too.
    const named = tally(profiles.flatMap((p: any) => mentions(String(p?.biography || '')))).filter((h) => !igCands.includes(h)).slice(0, 2)
    if (named.length) profiles.push(...(await open(named)))
    const ig: { handle: string; name: string; followers: number | null; bio: string; site: string }[] = profiles.filter((p: any) => p?.username && !p.error).map((p: any) => ({
      handle: String(p.username).toLowerCase(), name: p.fullName || '', followers: p.followersCount ?? null,
      bio: String(p.biography || '').replace(/\s+/g, ' ').slice(0, 300), site: p.externalUrl || '',
    }))
    // An account named by another one but not opened (Instagram refused): still a candidate.
    for (const h of [...igCands, ...named]) if (!ig.some((x) => x.handle === h)) ig.push({ handle: h, name: '', followers: null, bio: '(not opened; named by another account found in the search)', site: '' })
    const fb = fbCands.map((url) => ({ url, seen: fbHits.filter((h) => fbPage(h.url) === url).slice(0, 2).map((h) => `${h.title} — ${h.text}`) }))

    const key = aiKey()
    if (!key) return {}
    const res = await new AiClient({ apiKey: key }).chat.completions.create({
      model: AI_MODEL_FAST, max_tokens: 300, response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: `A restaurant from Google Maps:
name: ${who.name}${en.name ? ` (${en.name})` : ''}
city: ${who.city || ''}  area: ${who.area || ''}
address: ${who.address || ''}
phone: ${who.phone || ''}

Instagram accounts found by search: ${JSON.stringify(ig)}
Facebook pages found by search: ${JSON.stringify(fb)}

Pick the account that is THIS restaurant's own official account: same brand, and this branch or the brand's main account that lists this branch/city. Reject fan, family, food-blogger, delivery-app and other-city accounts. If none clearly fits, use null.
Return JSON: { "instagram": "handle or null", "facebook": "page url or null", "why": "one short reason" }` }],
    })
    await logAiUsage({ operation: 'lead-build-find-social', userId: null, model: AI_MODEL_FAST }, res.usage)
    const a = JSON.parse(res.choices[0]?.message?.content || '{}')
    const pickedIg = typeof a.instagram === 'string' && ig.some((x) => x.handle === a.instagram.toLowerCase().replace(/^@/, '')) ? a.instagram.toLowerCase().replace(/^@/, '') : undefined
    const pickedFb = typeof a.facebook === 'string' && fbCands.includes(a.facebook) ? a.facebook : undefined
    return { instagram: pickedIg, facebook: pickedFb, why: typeof a.why === 'string' ? a.why.slice(0, 200) : undefined }
  } catch {
    return {}
  }
}
