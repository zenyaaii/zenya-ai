import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { scrapeInputSchema } from '@/utils/validators'
import { createClient } from '@/utils/supabase/server'

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

  // 1. Try Direct Scraping FIRST (Free)
  try {
    method = 'direct'
    console.log('Attempting direct scrape...')
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
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

  // 3. If All Failed, Use Demo Data
  if (status === 'failed') {
    method = 'demo'
    console.log('All scraping methods failed. Using demo data.')
    await new Promise(r => setTimeout(r, 1000)) // Simulate work
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

  // Return Demo Data if we failed to get HTML
  if (!html || method === 'demo') {
    return NextResponse.json({
      name: 'Smart Yoga Mat (Demo Product)',
      images: [
        'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544367563-12123d897577?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
      ]
    })
  }

  const $ = cheerio.load(html)
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || $('h1').first().text()
  const imgs = new Set<string>()

  // 1. Standard Scraping (img tags)
  $('img').each((_, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original')
    if (src) {
      if (!src.startsWith('http')) {
        try {
          src = new URL(src, url).toString()
        } catch {
          return
        }
      }
      imgs.add(src)
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

  return NextResponse.json({ name: title?.trim() || 'Product', images: cleanImages })
}
