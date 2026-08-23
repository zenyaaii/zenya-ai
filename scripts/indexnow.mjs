/**
 * Ping IndexNow with every URL in the public sitemap.
 *
 * Why this exists: after a change to titles, canonicals or copy, Bing and
 * Yandex would otherwise re-crawl on their own schedule — weeks, for a site
 * with little authority. IndexNow is a push: submit the list and the engines
 * fetch it back within hours. It is also the fastest route into the AI answer
 * engines that read Bing's index rather than Google's.
 *
 * Google does NOT participate in IndexNow. For Google the equivalent is
 * "Request indexing" in Search Console, which has no public API for arbitrary
 * URLs and has to be clicked by the property owner.
 *
 * Usage:  node scripts/indexnow.mjs
 *
 * The key must stay reachable at https://zenyaai.co/<key>.txt containing
 * exactly the key — that file is public/<key>.txt and is what proves to the
 * engines that whoever submits the URLs controls the host. Rotating the key
 * means renaming that file and changing KEY below, together.
 */

const HOST = 'zenyaai.co'
const KEY = 'c973d3b4a6329f2a1b5384cba7a15ce5'
const SITEMAP = `https://${HOST}/sitemap.xml`
const ENDPOINT = 'https://api.indexnow.org/IndexNow'

async function main() {
  const res = await fetch(SITEMAP, { headers: { 'user-agent': 'zenya-indexnow' } })
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`)
  const xml = await res.text()

  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    // Only our own host: IndexNow rejects the whole batch if one URL is foreign.
    .filter((u) => {
      try {
        return new URL(u).hostname === HOST
      } catch {
        return false
      }
    })

  if (urls.length === 0) throw new Error('no URLs found in sitemap')

  // The endpoint caps a batch at 10,000 URLs; we are far under, but chunk
  // anyway so this keeps working as the sitemap grows.
  const CHUNK = 10000
  for (let i = 0; i < urls.length; i += CHUNK) {
    const batch = urls.slice(i, i + CHUNK)
    const body = {
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: batch,
    }
    const post = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
    // 200 = accepted, 202 = accepted but key still being validated. Both fine.
    console.log(`submitted ${batch.length} URLs → ${post.status} ${post.statusText}`)
    if (post.status >= 400) {
      console.error(await post.text())
      process.exitCode = 1
    }
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
