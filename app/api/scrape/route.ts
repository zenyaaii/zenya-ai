import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { scrapeInputSchema } from '@/utils/validators'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeText(s: string) {
  return s.replace(/\s+/g, ' ').trim()
}

function stripHtmlToText(s: string) {
  return normalizeText(String(s || '').replace(/<[^>]+>/g, ' '))
}

function uniqueNonEmpty(items: string[], max: number) {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of items) {
    const t = normalizeText(raw || '')
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function flattenJsonLd(input: any): any[] {
  if (!input) return []
  if (Array.isArray(input)) return input.flatMap(flattenJsonLd)
  if (typeof input !== 'object') return []
  if (Array.isArray((input as any)['@graph'])) return flattenJsonLd((input as any)['@graph'])
  return [input]
}

function isProductJsonLdType(t: any) {
  if (!t) return false
  if (typeof t === 'string') return t.toLowerCase() === 'product'
  if (Array.isArray(t)) return t.some(isProductJsonLdType)
  return false
}

/* ── AliExpress review scraping ──────────────────────────────────────
 * The public feedback endpoint returns structured JSON: real reviewer
 * names, countries, star ratings, review text (with translations), and
 * photo URLs. These seed the theme's review/UGC sections with real
 * social proof instead of invented copy.
 */
type ScrapedReview = {
  name: string
  country?: string
  rating: number
  text: string
  photos?: string[]
  date?: string
}

function aliexpressProductId(url: string): string | null {
  const m =
    url.match(/\/item\/(?:[^/]*\/)?(\d{6,})\.html/) ||
    url.match(/[?&]productId=(\d{6,})/) ||
    url.match(/\/i\/(\d{6,})/)
  return m ? m[1] : null
}

function absolutize(u: string): string {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('//')) return `https:${s}`
  if (s.startsWith('http://')) return s.replace('http://', 'https://')
  return s
}

async function fetchAliexpressReviews(
  productId: string,
  headers: Record<string, string>,
): Promise<{ reviews: ScrapedReview[]; stats: { average: number; count: number } | null }> {
  const reviews: ScrapedReview[] = []
  let stats: { average: number; count: number } | null = null
  for (let page = 1; page <= 3 && reviews.length < 40; page++) {
    const endpoint =
      `https://feedback.aliexpress.com/pc/searchEvaluation.do?productId=${productId}` +
      `&lang=en_US&country=US&page=${page}&pageSize=20&filter=all&sort=complex_default`
    let json: any = null
    try {
      const res = await fetch(endpoint, { headers, signal: AbortSignal.timeout(8000) })
      if (!res.ok) break
      json = await res.json()
    } catch {
      break
    }
    const data = json?.data
    if (!data) break
    if (!stats) {
      const st = data.productEvaluationStatistic
      const avg = Number(st?.evarageStar ?? st?.averageStar)
      const count = Number(st?.totalNum)
      if (Number.isFinite(avg) && avg > 0 && Number.isFinite(count) && count > 0) {
        stats = { average: Math.min(5, avg), count }
      }
    }
    const list: any[] = Array.isArray(data.evaViewList) ? data.evaViewList : []
    if (!list.length) break
    for (const ev of list) {
      const rawText = normalizeText(ev?.buyerTranslationFeedback || ev?.buyerFeedback || '')
      const rating = Math.round(Number(ev?.buyerEval) / 20) || 0
      if (!rawText || rawText.length < 8 || rating < 1) continue
      const photos = (Array.isArray(ev?.images) ? ev.images : [])
        .map((i: any) => absolutize(String(i)))
        .filter((u: string) => /^https:\/\//.test(u))
        .slice(0, 4)
      reviews.push({
        name: normalizeText(ev?.buyerName || '') || 'AliExpress buyer',
        country: normalizeText(ev?.buyerCountry || '') || undefined,
        rating: Math.min(5, rating),
        text: rawText.slice(0, 600),
        photos: photos.length ? photos : undefined,
        date: normalizeText(ev?.evalDate || '') || undefined,
      })
      if (reviews.length >= 40) break
    }
  }
  return { reviews, stats }
}

function normalizeImageUrl(src: string, baseUrl: string) {
  const s = String(src || '').trim()
  if (!s) return ''
  if (s.startsWith('//')) return `https:${s}`
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  try {
    return new URL(s, baseUrl).toString()
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = scrapeInputSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const url = parsed.data.url
  const key = process.env.SCRAPERAPI_KEY
  let html = ''
  let method = 'direct'
  let status = 'success'
  let errorMsg = ''
  const allowDemo = process.env.ALLOW_DEMO_SCRAPE === 'true'

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  }

  const u = new URL(url)
  const shopifyCandidatePath = u.pathname.replace(/\/$/, '')
  let shopifyProduct: any = null
  if (shopifyCandidatePath.includes('/products/')) {
    const jsUrl = `${u.origin}${shopifyCandidatePath}.js`
    try {
      const res = await fetch(jsUrl, { headers })
      if (res.ok) {
        const json = safeParseJson(await res.text())
        if (json && typeof json === 'object') shopifyProduct = json
      }
    } catch {
      shopifyProduct = null
    }
  }

  // 1. Try Direct Scraping FIRST (Free)
  try {
    method = 'direct'
    console.log('Attempting direct scrape...')
    const res = await fetch(url, {
      headers,
    })
    
    if (!res.ok) throw new Error(`Status ${res.status}`)
    html = await res.text()
    
    // Check for CAPTCHA or empty response
    if (html.includes('captcha') || html.length < 2000) {
      throw new Error('Likely blocked or captcha')
    }
  } catch (directError) {
    // 2. If Direct Fails, Try ScraperAPI (Paid/Reliable)
    if (key) {
      try {
        method = 'scraperapi'
        console.log('Direct scrape failed. Switching to ScraperAPI...')
        const target = `http://api.scraperapi.com?api_key=${key}&url=${encodeURIComponent(url)}`
        const res = await fetch(target)
        if (!res.ok) throw new Error(`ScraperAPI Error: ${res.status}`)
        html = await res.text()
        status = 'success'
        errorMsg = '' // Clear error since we recovered
      } catch (scraperError) {
        // Both failed
        method = 'scraperapi_failed'
        status = 'failed'
        errorMsg = scraperError instanceof Error ? scraperError.message : 'ScraperAPI failed'
      }
    } else {
      // Direct failed and no key available
      method = 'direct_failed'
      status = 'failed'
      errorMsg = directError instanceof Error ? directError.message : 'Direct scrape failed'
    }
  }

  // Save to History (Fire and forget)
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('scrape_history').insert({
        user_id: user.id,
        url: url,
        method: method,
        status: status,
        error_message: errorMsg
      })
    }
  } catch (err) {
    console.error('Failed to save scrape history:', err)
  }

  if (!html) {
    if (shopifyProduct && typeof shopifyProduct === 'object') {
      const productName = normalizeText(shopifyProduct.title || shopifyProduct.name || '') || 'Product'
      const bodyHtml = String(shopifyProduct.body_html || '')
      const body$ = cheerio.load(bodyHtml || '')
      const bodyText = normalizeText(body$.text()).slice(0, 1800)

      const bodyHighlights = uniqueNonEmpty(
        body$('li')
          .toArray()
          .map((el) => normalizeText(body$(el).text()))
          .filter((t) => t.length >= 12 && t.length <= 160),
        10
      )

      const bodySpecs: Record<string, string> = {}
      body$('table tr').each((_, tr) => {
        const cells = body$(tr).find('th,td').toArray().map((c) => normalizeText(body$(c).text()))
        if (cells.length < 2) return
        const key = cells[0]
        const value = cells.slice(1).join(' ')
        if (!key || !value) return
        if (key.length > 40 || value.length > 120) return
        if (Object.keys(bodySpecs).length >= 12) return
        if (!bodySpecs[key]) bodySpecs[key] = value
      })

      const images: string[] = Array.isArray(shopifyProduct.images)
        ? shopifyProduct.images
            .slice(0, 20)
            .map((img: any) => normalizeImageUrl(String(img), url))
            .filter(Boolean)
        : []

      const variantPricesCents: number[] = Array.isArray(shopifyProduct.variants)
        ? shopifyProduct.variants.map((v: any) => Number(v?.price)).filter((n: any) => Number.isFinite(n) && n > 0)
        : []
      const compareAtCents: number[] = Array.isArray(shopifyProduct.variants)
        ? shopifyProduct.variants
            .map((v: any) => Number(v?.compare_at_price))
            .filter((n: any) => Number.isFinite(n) && n > 0)
        : []
      const minPrice = variantPricesCents.length ? Math.min(...variantPricesCents) / 100 : null
      const maxCompareAt = compareAtCents.length ? Math.max(...compareAtCents) / 100 : null

      return NextResponse.json({
        name: productName,
        description: bodyText,
        images,
        price: minPrice,
        originalPrice: maxCompareAt,
        productFacts: {
          title: productName,
          metaDescription: undefined,
          highlights: bodyHighlights.length ? bodyHighlights : undefined,
          specs: Object.keys(bodySpecs).length ? bodySpecs : undefined,
          brand: undefined,
          sku: normalizeText(shopifyProduct.handle || '') || undefined,
          priceCurrency: undefined,
          availability: undefined,
          ratingValue: undefined,
          reviewCount: undefined,
          longDescription: bodyText || undefined,
        },
      })
    }

    if (allowDemo) {
      return NextResponse.json({
        name: 'Smart Yoga Mat (Demo Product)',
        description: 'A smart yoga mat that helps you stay consistent with guided sessions and posture feedback.',
        images: [
          'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1544367563-12123d897577?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        ],
        price: 49.99,
        originalPrice: 99.99,
        productFacts: {
          title: 'Smart Yoga Mat',
          metaDescription: 'Guided sessions, posture feedback, and a premium feel.',
          highlights: ['Non-slip grip with cushioned comfort', 'Guided routines for all levels', 'Easy setup and quick clean'],
          specs: { Material: 'Eco-friendly TPE', Thickness: '6mm', Size: '183cm x 61cm' },
        },
      })
    }

    return NextResponse.json(
      {
        error: 'scrape_failed',
        message: errorMsg || 'Failed to scrape product page. The site may be blocking requests.',
        method,
        url,
      },
      { status: 502 }
    )
  }

  const $ = cheerio.load(html)
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const docTitle = $('title').text() || ''
  const h1Raw = $('h1').first().text() || ''
  const title = ogTitle || docTitle || h1Raw
  const descriptionMeta =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    ''

  const jsonLdScripts = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => $(el).text())
    .map((t) => t.trim())
    .filter(Boolean)
  const jsonLdObjects = jsonLdScripts
    .map((t) => safeParseJson(t))
    .filter(Boolean)
    .flatMap(flattenJsonLd)

  const productLd = jsonLdObjects.find((o) => isProductJsonLdType((o as any)['@type'])) as any | undefined
  const ldName = normalizeText(productLd?.name || '')
  const ldDesc = stripHtmlToText(productLd?.description || '')
  const ldBrand = normalizeText(productLd?.brand?.name || productLd?.brand || '')
  const ldSku = normalizeText(productLd?.sku || '')
  const offers = productLd?.offers
  const offerObj = Array.isArray(offers) ? offers[0] : offers
  const ldPrice = offerObj?.price ? Number(String(offerObj.price).replace(/[^0-9.]/g, '')) : undefined
  const ldCurrency = normalizeText(offerObj?.priceCurrency || '')
  const ldAvailability = normalizeText(offerObj?.availability || '')
  const aggRating = productLd?.aggregateRating
  const ldRatingValue = aggRating?.ratingValue ? Number(String(aggRating.ratingValue).replace(/[^0-9.]/g, '')) : undefined
  const ldReviewCount = aggRating?.reviewCount ? Number(String(aggRating.reviewCount).replace(/[^0-9]/g, '')) : undefined

  const h1 = normalizeText($('h1').first().text())
  const metaDescription = normalizeText(descriptionMeta)
  const pageTitle = normalizeText(ldName || title || '')

  const descSelectors = [
    '[itemprop="description"]',
    '#product-description',
    '#description',
    '.product-description',
    '.product__description',
    '.product-single__description',
    '.product__description.rte',
    '.woocommerce-product-details__short-description',
    '.product-details__description',
  ]
  let longDescription = ''
  for (const sel of descSelectors) {
    const node = $(sel).first()
    if (!node.length) continue
    const t = normalizeText(node.text())
    if (t.length >= 120) {
      longDescription = t.slice(0, 1800)
      break
    }
  }

  const candidateLis: string[] = []
  if (longDescription) {
    for (const sel of descSelectors) {
      const node = $(sel).first()
      if (!node.length) continue
      node.find('li').each((_, el) => {
        const t = normalizeText($(el).text())
        if (!t) return
        if (t.length < 12 || t.length > 160) return
        if (t.includes('©')) return
        candidateLis.push(t)
      })
    }
  }
  if (candidateLis.length < 4) {
    $('li').each((_, el) => {
      const t = normalizeText($(el).text())
      if (!t) return
      if (t.length < 20 || t.length > 160) return
      if (/^(home|shop|about|contact|privacy|terms|returns|shipping)$/i.test(t)) return
      if (t.includes('©')) return
      candidateLis.push(t)
    })
  }
  const highlights = uniqueNonEmpty(candidateLis, 10)

  const specs: Record<string, string> = {}
  $('table tr').each((_, tr) => {
    const cells = $(tr).find('th,td').toArray().map((c) => normalizeText($(c).text()))
    if (cells.length < 2) return
    const key = cells[0]
    const value = cells.slice(1).join(' ')
    if (!key || !value) return
    if (key.length > 40 || value.length > 120) return
    if (Object.keys(specs).length >= 12) return
    if (!specs[key]) specs[key] = value
  })
  const imgs = new Set<string>()
  const extractedPrices: number[] = []

  const ldImagesRaw = productLd?.image
  const ldImages = uniqueNonEmpty(
    (Array.isArray(ldImagesRaw) ? ldImagesRaw : ldImagesRaw ? [ldImagesRaw] : []).map((i: any) =>
      normalizeImageUrl(String(i), url)
    ),
    12
  )
  ldImages.forEach((i) => imgs.add(i))

  const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:url"]').attr('content') || ''
  if (ogImage) {
    const normalized = normalizeImageUrl(ogImage, url)
    if (normalized) imgs.add(normalized)
  }

  if (shopifyProduct?.images && Array.isArray(shopifyProduct.images)) {
    for (const img of shopifyProduct.images.slice(0, 20)) {
      const normalized = normalizeImageUrl(String(img), url)
      if (normalized) imgs.add(normalized)
    }
  }

  if (typeof ldPrice === 'number' && Number.isFinite(ldPrice) && ldPrice > 0) extractedPrices.push(ldPrice)

  const metaPrice =
    $('meta[property="product:price:amount"]').attr('content') ||
    $('meta[property="og:price:amount"]').attr('content') ||
    $('meta[name="twitter:data1"]').attr('content') ||
    $('meta[name="price"]').attr('content')
  if (metaPrice) {
    const n = Number(String(metaPrice).replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(n) && n > 0) extractedPrices.push(n)
  }

  const itempropPrice = $('[itemprop="price"]').attr('content') || $('[itemprop="price"]').first().text()
  if (itempropPrice) {
    const n = Number(String(itempropPrice).replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(n) && n > 0) extractedPrices.push(n)
  }

  if (shopifyProduct?.variants && Array.isArray(shopifyProduct.variants)) {
    const prices = shopifyProduct.variants
      .map((v: any) => Number(v?.price))
      .filter((n: any) => Number.isFinite(n) && n > 0)
    const compareAt = shopifyProduct.variants
      .map((v: any) => Number(v?.compare_at_price))
      .filter((n: any) => Number.isFinite(n) && n > 0)
    const minPrice = prices.length ? Math.min(...prices) / 100 : null
    const maxCompareAt = compareAt.length ? Math.max(...compareAt) / 100 : null
    if (minPrice && minPrice > 0) extractedPrices.push(minPrice)
    if (maxCompareAt && maxCompareAt > 0) extractedPrices.push(maxCompareAt)
  }

  const priceRegexes = [
    /"salePrice"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/gi,
    /"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/gi,
    /"amount"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/gi,
    /\$\s*([0-9]+(?:\.[0-9]+)?)/g,
  ]
  for (const re of priceRegexes) {
    const matches = html.matchAll(re)
    for (const m of matches) {
      const n = Number(m[1])
      if (!Number.isNaN(n) && n > 0 && n < 100000) extractedPrices.push(n)
      if (extractedPrices.length > 10) break
    }
    if (extractedPrices.length > 10) break
  }

  // 1. Standard Scraping (img tags)
  $('img').each((_, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original')
    if (src) {
      const normalized = normalizeImageUrl(src, url)
      if (normalized) imgs.add(normalized)
    }
  })

  // 2. AliExpress Specific Logic (Regex for high-res images)
  if (url.includes('aliexpress')) {
    const aeRegex = /https:\/\/ae01\.alicdn\.com\/kf\/[a-zA-Z0-9]+\.(jpg|png|webp)/g
    const matches = html.match(aeRegex) || []
    matches.forEach(m => imgs.add(m))
  }

  // 3. Shopify/Generic High-Res Logic
  // Look for JSON blobs containing images (common in Shopify/WooCommerce)
  const jsonRegex = /"https?:\/\/[^"]+\.(jpg|png|webp|jpeg)"/gi
  const jsonMatches = html.match(jsonRegex) || []
  jsonMatches.forEach(m => {
    const clean = m.replace(/"/g, '')
    if (!clean.includes('logo') && !clean.includes('icon')) {
      imgs.add(clean)
    }
  })

  // Filter & Clean Images
  const cleanImages = Array.from(imgs)
    .map(img => {
      // Remove AliExpress resizing suffixes (e.g. _50x50.jpg, .jpg_640x640.jpg)
      if (img.includes('alicdn.com')) {
        return img.replace(/_(\d+x\d+|\d+).+$/, '').replace(/\.jpg_.+$/, '.jpg')
      }
      // Remove Shopify resizing (e.g. _100x100.jpg)
      if (img.includes('cdn.shopify.com')) {
        return img.replace(/_\d+x\d+/, '')
      }
      return img
    })
    .filter(img => {
      // Filter out tiny icons, logos, tracking pixels
      const lower = img.toLowerCase()
      if (lower.includes('icon') || lower.includes('logo') || lower.includes('avatar') || lower.includes('svg')) return false
      return true
    })
    // Remove duplicates after cleaning
    .filter((value, index, self) => self.indexOf(value) === index)
    .slice(0, 20)

  const uniquePrices = Array.from(new Set(extractedPrices)).sort((a, b) => a - b)
  const scrapedPrice = uniquePrices.length ? uniquePrices[0] : null
  const scrapedOriginalPrice = uniquePrices.length >= 2 ? uniquePrices[uniquePrices.length - 1] : null

  // Real reviews (AliExpress): never let a review failure sink the
  // product scrape — reviews are a bonus, not a requirement.
  let reviews: ScrapedReview[] = []
  let reviewStats: { average: number; count: number } | null = null
  if (url.includes('aliexpress')) {
    const pid = aliexpressProductId(url)
    if (pid) {
      try {
        const r = await fetchAliexpressReviews(pid, headers)
        reviews = r.reviews
        reviewStats = r.stats
      } catch {
        /* reviews unavailable — theme falls back to placeholder copy */
      }
    }
  }

  return NextResponse.json({
    reviews,
    reviewStats,
    name: pageTitle || h1 || 'Product',
    description: metaDescription || ldDesc || longDescription || '',
    images: cleanImages,
    price: scrapedPrice,
    originalPrice: scrapedOriginalPrice,
    productFacts: {
      title: pageTitle || undefined,
      metaDescription: metaDescription || undefined,
      highlights: highlights.length ? highlights : undefined,
      specs: Object.keys(specs).length ? specs : undefined,
      brand: ldBrand || undefined,
      sku: ldSku || undefined,
      priceCurrency: ldCurrency || undefined,
      availability: ldAvailability || undefined,
      ratingValue: typeof ldRatingValue === 'number' && Number.isFinite(ldRatingValue) ? ldRatingValue : undefined,
      reviewCount: typeof ldReviewCount === 'number' && Number.isFinite(ldReviewCount) ? ldReviewCount : undefined,
      longDescription: longDescription || ldDesc || undefined,
    }
  })
}
