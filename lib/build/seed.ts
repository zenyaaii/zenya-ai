/**
 * Per-section content seeder.
 *
 * The Shopify "Online Store 2.0" template JSON (`templates/index.json`,
 * `templates/product.json`, etc.) is what the editor actually renders.
 * The `presets` inside `{% schema %}` blocks are ONLY for the editor's
 * "Add section" picker — they're not auto-applied to a template.
 *
 * Earlier versions of this generator wrote `"settings": {}` for every
 * section in the templates, which meant Shopify rendered the schema
 * defaults (generic "Free shipping over $50" copy) and zero blocks for
 * every grid section — so the homepage looked 95 % empty.
 *
 * This module fills in every section: settings + blocks, seeded with
 * the merchant's actual product name, store name, price, images, and
 * description. The result is a theme that looks like a real store on
 * first install, no editor work required.
 *
 * Image handling: Shopify's image_picker setting cannot accept a
 * remote URL inside a template JSON file. We solved this by adding a
 * parallel `image_url` text setting (see sections/*.ts edits) — the
 * seed writes the AliExpress URLs into those, and the liquid renders
 * them when image_picker is empty.
 */
import type { BuildConfig } from './theme-generator'

type Settings = Record<string, unknown>
type Block = { type: string; settings: Settings }
export type SeededSection = { settings: Settings; blocks?: Record<string, Block>; block_order?: string[] }

/* ── helpers ──────────────────────────────────────────────────────── */

function money(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0.00'
  return '$' + n.toFixed(2)
}

function safeDescription(c: BuildConfig, maxChars = 220): string {
  const d = (c.description || '').replace(/\s+/g, ' ').trim()
  if (d.length > maxChars) return d.slice(0, maxChars - 1).trimEnd() + '…'
  if (d.length > 0) return d
  return `${c.productName} — built for everyday use, backed by a 30-day promise.`
}

function pickImage(c: BuildConfig, idx: number): string {
  if (!c.images?.length) return ''
  return c.images[idx % c.images.length] || c.images[0]
}

function imageBlocks(
  c: BuildConfig,
  type: string,
  count: number,
  extra: (img: string, i: number) => Settings,
): { blocks: Record<string, Block>; order: string[] } {
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  for (let i = 0; i < count; i++) {
    const id = `${type}-${i + 1}`
    const img = pickImage(c, i)
    blocks[id] = { type, settings: { image_url: img, ...extra(img, i) } }
    order.push(id)
  }
  return { blocks, order }
}

function indexBlocks<T extends Block>(
  prefix: string,
  items: Array<T>,
): { blocks: Record<string, T>; order: string[] } {
  const blocks: Record<string, T> = {}
  const order: string[] = []
  items.forEach((b, i) => {
    const id = `${prefix}-${i + 1}`
    blocks[id] = b
    order.push(id)
  })
  return { blocks, order }
}

function highlightFromDescription(c: BuildConfig): Array<{ icon: string; heading: string; body: string }> {
  // Map common e-commerce keywords in the description into icons + bullet
  // copy. This is the seam where "AI-generated" content meets the seed —
  // even if the description is short or generic, we still get 6 angles.
  const desc = (c.description || '').toLowerCase()
  const pool = [
    { kw: ['waterproof', 'water-resistant', 'water resistant'], icon: '💧', heading: 'Waterproof build',           body: 'Tested to survive rain, spills, and the occasional dunk.' },
    { kw: ['battery', 'rechargeable', 'usb', 'wireless'],        icon: '🔋', heading: 'All-day battery',            body: 'One charge lasts through your full day — recharge by USB-C overnight.' },
    { kw: ['premium', 'quality', 'durable', 'metal', 'leather'], icon: '🛠️', heading: 'Premium materials',          body: 'Built from materials that age well — not the cheap stuff you replace yearly.' },
    { kw: ['safe', 'safety', 'non-toxic', 'bpa', 'eco'],         icon: '🌱', heading: 'Safe + sustainable',         body: 'Non-toxic, BPA-free, and packaged in fully recyclable materials.' },
    { kw: ['light', 'lightweight', 'compact', 'portable'],       icon: '🪶', heading: 'Light + portable',           body: 'Slips into your bag without weighing you down on the move.' },
    { kw: ['fast', 'quick', 'instant'],                          icon: '⚡', heading: 'Fast results',                body: 'Set up in seconds — designed to work the moment you take it out of the box.' },
    { kw: ['comfortable', 'soft', 'ergonomic'],                  icon: '🤲', heading: 'Comfortable to use',         body: 'Shaped around how your hands actually work, not how a CAD model thinks they do.' },
  ]
  const matches: Array<{ icon: string; heading: string; body: string }> = []
  for (const opt of pool) {
    if (opt.kw.some((k) => desc.includes(k))) matches.push({ icon: opt.icon, heading: opt.heading, body: opt.body })
  }
  // Always include the three defaults, then the keyword-matched ones.
  const defaults = [
    { icon: '⚡', heading: 'Built for daily use',     body: `Engineered to handle whatever ${c.storeName || 'real life'} throws at it.` },
    { icon: '✅', heading: 'Quality you can feel',    body: `Every piece is checked by hand before it leaves the warehouse.` },
    { icon: '🛡️', heading: '12-month warranty',      body: `If it fails, we replace it — no return-shipping argument.` },
  ]
  const all = [...defaults, ...matches]
  // dedupe by heading
  const seen = new Set<string>()
  return all.filter((x) => (seen.has(x.heading) ? false : (seen.add(x.heading), true))).slice(0, 6)
}

/* ── real-review helpers ──────────────────────────────────────────── */

/** Usable scraped reviews: non-empty text, valid rating. */
function realReviews(c: BuildConfig) {
  return (c.reviews || []).filter(
    (r) => r && typeof r.text === 'string' && r.text.trim().length >= 8 && r.rating >= 1 && r.rating <= 5,
  )
}

/** True when we have enough real reviews to seed the social-proof
 *  sections from them instead of invented copy. */
export function hasRealReviews(c: BuildConfig): boolean {
  return realReviews(c).length >= 3
}

/** All photo URLs attached to the scraped reviews, deduped. */
function reviewPhotos(c: BuildConfig): Array<{ url: string; name: string }> {
  const out: Array<{ url: string; name: string }> = []
  const seen = new Set<string>()
  for (const r of realReviews(c)) {
    for (const url of r.photos || []) {
      if (!url || seen.has(url)) continue
      seen.add(url)
      out.push({ url, name: r.name || 'Verified buyer' })
    }
  }
  return out
}

/** Build a short headline out of a review's first phrase. */
function reviewHeadline(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const firstStop = clean.search(/[.!?]/)
  let head = firstStop > 0 && firstStop <= 60 ? clean.slice(0, firstStop) : clean
  if (head.length > 60) head = head.slice(0, 57).trimEnd() + '…'
  return head
}

/** "4.8" style average — real stats first, else computed from reviews. */
function reviewAverage(c: BuildConfig): string | null {
  if (c.reviewStats && c.reviewStats.average > 0) return c.reviewStats.average.toFixed(1)
  const rs = realReviews(c)
  if (!rs.length) return null
  return (rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(1)
}

/** Total review count — real stats first, else the scraped sample size. */
function reviewCount(c: BuildConfig): number | null {
  if (c.reviewStats && c.reviewStats.count > 0) return c.reviewStats.count
  const rs = realReviews(c)
  return rs.length || null
}

/* ── per-section seeds ────────────────────────────────────────────── */

function seedAnnouncement(c: BuildConfig): SeededSection {
  const msgs = [
    `Free shipping over ${money(50)} · 30-day returns`,
    `Loved by 12,400+ ${c.storeName ? `${c.storeName} fans` : 'customers'}`,
    `Ships in 24 hours from local warehouses`,
  ]
  const { blocks, order } = indexBlocks('msg', msgs.map((text) => ({ type: 'message', settings: { text } })))
  return { settings: {}, blocks, block_order: order }
}

function seedHero(c: BuildConfig): SeededSection {
  const discount = c.originalPrice > c.salePrice && c.originalPrice > 0
    ? `Save ${Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100)}%`
    : 'Now shipping'
  const avg = reviewAverage(c)
  const count = reviewCount(c)
  const stats = [
    {
      stat: avg ? `${avg}★` : '4.9★',
      label: count ? `${count.toLocaleString('en-US')} reviews` : '2,400+ reviews',
    },
    { stat: '30-day', label: 'Money-back' },
    { stat: 'Free', label: 'Shipping over $50' },
  ]
  const { blocks, order } = indexBlocks('stat', stats.map((s) => ({ type: 'stat', settings: s })))
  return {
    settings: {
      eyebrow: discount,
      headline: c.productName || 'A product worth talking about',
      subhead: safeDescription(c, 180),
      cta_label: `Get your ${c.productName.split(' ')[0] || 'one'} — ${money(c.salePrice)}`,
    },
    blocks,
    block_order: order,
  }
}

function seedFooter(c: BuildConfig): SeededSection {
  return {
    settings: {
      tagline: `${c.storeName} — premium products, fast shipping, and humans behind the support email.`,
    },
    blocks: {
      // Label|URL — every link must land somewhere real. Homepage anchors
      // (#bundle, #faq…) are rendered by the sections themselves; 'mailto:'
      // expands to the store owner's email in liquid.
      'col-shop': { type: 'column', settings: { heading: 'Shop', links: `${c.productName}|/#product\nBundle & save|/#bundle\nAll products|/collections/all` } },
      'col-help': { type: 'column', settings: { heading: 'Help', links: 'FAQ|/#faq\nShipping & delivery|/#faq\nReturns & guarantee|/#guarantee\nContact us|mailto:' } },
      'col-co':   { type: 'column', settings: { heading: 'Company', links: 'Our story|/#our-story\nReviews|/#reviews\nCustomer photos|/#customer-photos\nIn the press|/#press' } },
      'news':     { type: 'newsletter', settings: { heading: 'Get the drop', copy: 'Restock alerts and members-only deals. No spam.' } },
    },
    block_order: ['col-shop', 'col-help', 'col-co', 'news'],
  }
}

function seedProductMain(c: BuildConfig): SeededSection {
  // First image is hero; remaining go into gallery thumbs.
  const thumbs = c.images.slice(0, 6).map((img, i) => ({
    type: 'thumb',
    settings: { image_url: img },
  }))
  const trustPoints = [
    `Free shipping over ${money(50)}`,
    `30-day money-back guarantee`,
    `Tracked delivery in 3-5 days`,
    `12-month warranty`,
  ]
  const trustBlocks = trustPoints.map((text) => ({ type: 'trust', settings: { text } }))
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  thumbs.forEach((b, i) => {
    const id = `thumb-${i + 1}`
    blocks[id] = b
    order.push(id)
  })
  // Bundle tiers inside the buy box — prices render as units × the live
  // product price, the radio sets the add-to-cart quantity.
  const tiers = [
    { label: '1× — Single', units: 1 },
    { label: '2× + 1 free', units: 2, badge: 'Most popular', featured: true },
    { label: '3× + 2 free', units: 3, badge: 'Best deal' },
  ]
  tiers.forEach((t, i) => {
    const id = `tier-${i + 1}`
    blocks[id] = { type: 'tier', settings: t }
    order.push(id)
  })
  trustBlocks.forEach((b, i) => {
    const id = `trust-${i + 1}`
    blocks[id] = b
    order.push(id)
  })
  // Info accordions next to the gallery: shipping/carrier, returns,
  // warranty. The full product description renders as its own accordion
  // automatically once a real product is connected.
  const accordions = [
    { title: 'Shipping & delivery', body: `Orders ship within 24 hours on business days with a tracked carrier (USPS/DHL/local equivalent). Typical delivery is 3-5 business days — you'll get the tracking number by email the moment it leaves the warehouse.` },
    { title: 'Returns & guarantee', body: `30-day money-back guarantee. Return your ${c.productName} for any reason — we send you a prepaid return label and refund the full amount within 3 days of receiving it back.` },
    { title: 'Warranty', body: `Every ${c.productName} is covered by a 12-month manufacturing warranty. If it fails under normal use, we replace it — no return-shipping argument.` },
  ]
  accordions.forEach((a, i) => {
    const id = `acc-${i + 1}`
    blocks[id] = { type: 'accordion', settings: a }
    order.push(id)
  })
  const avg = reviewAverage(c)
  const count = reviewCount(c)
  return {
    settings: {
      fallback_title: c.productName,
      fallback_desc: safeDescription(c, 400),
      fallback_image_url: pickImage(c, 0),
      rating: avg || '4.9',
      review_count: count ? count.toLocaleString('en-US') : '2,431',
    },
    blocks,
    block_order: order,
  }
}

function seedBundle(c: BuildConfig): SeededSection {
  const p = c.salePrice
  const single = p
  const twoFree = p * 2
  const threeFree = p * 3
  const twoSaving = p * 3 - twoFree
  return {
    settings: {
      eyebrow: 'Save more, get more',
      title: `Pick your ${c.productName} bundle`,
      cta: 'Continue to cart',
    },
    blocks: {
      // `units` is what the CTA really adds to the cart (paid units). The
      // "+1 free" fulfilment needs a Buy-X-get-Y automatic discount in
      // admin — flagged in the claims checklist until the merchant sets
      // it up or edits the copy.
      'tier-1': { type: 'tier', settings: { qty: '1×', units: 1, name: 'Single',     price: money(single),    subtext: 'Try it out' } },
      'tier-2': { type: 'tier', settings: { qty: '2× + 1 free', units: 2, name: 'Best value', price: money(twoFree), subtext: `Save ${money(twoSaving)} vs single`, featured: true, ribbon: 'Most popular' } },
      'tier-3': { type: 'tier', settings: { qty: '3× + 2 free', units: 3, name: 'Bulk',       price: money(threeFree), subtext: 'Stock the shelf' } },
    },
    block_order: ['tier-1', 'tier-2', 'tier-3'],
  }
}

function seedFeatures(c: BuildConfig): SeededSection {
  return {
    settings: { title: `Why people pick ${c.storeName || 'us'}` },
    blocks: {
      'f-1': { type: 'feature', settings: { icon: '🚚', heading: 'Free shipping',      body: 'Tracked delivery in 3-5 business days, on us.' } },
      'f-2': { type: 'feature', settings: { icon: '↩️', heading: '30-day returns',     body: "Try it. If it's not for you, send it back." } },
      'f-3': { type: 'feature', settings: { icon: '🔒', heading: 'Secure checkout',    body: 'Stripe-grade payments. Your data stays yours.' } },
      'f-4': { type: 'feature', settings: { icon: '💬', heading: 'Real-human support', body: 'Reply within 6 hours, every weekday.' } },
    },
    block_order: ['f-1', 'f-2', 'f-3', 'f-4'],
  }
}

function seedComparison(c: BuildConfig): SeededSection {
  const rows = [
    { feature: `Premium-grade ${c.productName.toLowerCase()}`, us: true, them: false },
    { feature: 'Free 3-5 day shipping',                     us: true, them: false },
    { feature: '30-day money-back guarantee',                us: true, them: false },
    { feature: '12-month warranty',                          us: true, them: false },
    { feature: 'Real-human support',                         us: true, them: false },
    { feature: 'Honest, no-fee pricing',                     us: true, them: true  },
  ]
  const { blocks, order } = indexBlocks('row', rows.map((r) => ({ type: 'row', settings: r })))
  return {
    settings: {
      title: 'How we compare',
      subtitle: `Quick check vs. the next-cheapest ${c.productName.toLowerCase()} you'll find online.`,
      us_label: c.storeName || 'Us',
      them_label: 'Generic',
    },
    blocks,
    block_order: order,
  }
}

function seedReviews(c: BuildConfig): SeededSection {
  const pn = c.productName

  // Real scraped reviews win: real names, real text, real star ratings.
  if (hasRealReviews(c)) {
    const rs = realReviews(c)
      .slice()
      .sort((a, b) => (b.text.length - a.text.length))
      .slice(0, 6)
    const avg = reviewAverage(c)
    const count = reviewCount(c)
    const { blocks, order } = indexBlocks('review', rs.map((r) => ({
      type: 'review',
      settings: {
        rating: Math.min(5, Math.max(1, Math.round(r.rating))),
        headline: reviewHeadline(r.text),
        body: r.text.replace(/\s+/g, ' ').trim().slice(0, 300),
        author: r.name || 'Verified buyer',
        location: r.country || '',
        verified: true,
      },
    })))
    return {
      settings: {
        title: `What ${pn} owners are saying`,
        average: avg ? `${avg} out of 5` : '',
        count: count ? `${count.toLocaleString('en-US')} reviews on the original listing` : '',
      },
      blocks,
      block_order: order,
    }
  }

  // Fallback: invented copy — every one of these lands in the claims
  // checklist so the merchant replaces them before launch.
  const reviews = [
    { headline: 'Honestly worth every dollar',          body: `I was skeptical given the price, but the ${pn} has been part of my routine for two months and I have zero complaints.`, author: 'Alex P.',   location: 'Austin, TX' },
    { headline: 'Shipped fast and felt premium',         body: `Showed up in three days in a really nice box. Build quality feels like something twice the price.`,                          author: 'Maya R.',   location: 'Brooklyn, NY' },
    { headline: 'Bought one. Came back for the bundle.', body: `The 2-for-1 deal got me. Gave one to my mom for her birthday and she's been raving about it.`,                              author: 'Jordan S.', location: 'Seattle, WA' },
    { headline: 'Replaced three other gadgets',           body: `Was using a janky setup before. The ${pn} replaced three things in one, and the desk finally looks normal.`,                  author: 'Sarah M.',  location: 'Denver, CO' },
    { headline: 'Support actually answered',              body: `Had a shipping question on day 4 and got a real reply in under two hours. Almost unheard of.`,                              author: 'Daniel K.', location: 'Toronto, ON' },
    { headline: 'No more buyer remorse',                  body: `I read every review before pulling the trigger and they were all right. Glad I bought this version.`,                       author: 'Riley T.',  location: 'Chicago, IL' },
  ]
  const { blocks, order } = indexBlocks('review', reviews.map((r) => ({ type: 'review', settings: r })))
  return {
    settings: { title: `What ${pn} owners are saying`, average: '4.9 out of 5', count: '2,431 verified reviews' },
    blocks,
    block_order: order,
  }
}

function seedFaq(c: BuildConfig): SeededSection {
  const pn = c.productName
  const items = [
    { question: `When does my ${pn} ship?`,         answer: `Same-day if you order before 3pm local time, otherwise the next business day. You'll get a tracking number by email.` },
    { question: "What's the return policy?",         answer: `30 days, no questions asked. Send the ${pn} back in any condition for a full refund — we'll even cover the return label.` },
    { question: 'How long is the warranty?',         answer: '12 months against manufacturing defects. If something breaks, email us and we replace it.' },
    { question: 'Can I pay in installments?',         answer: 'Yes — Klarna and Shop Pay are available at checkout. Pick "4 payments" to split the total.' },
    { question: 'Do you ship internationally?',       answer: 'We ship to the US, Canada, UK, EU, and Australia. Other countries on request — email us.' },
    { question: 'How is it different from cheaper alternatives?', answer: `Cheaper versions cut corners on the build. The ${pn} uses premium materials and is QA'd by hand before it leaves our warehouse.` },
    { question: 'What if I have a problem?',          answer: 'Reply to your order email or use the contact form. A real person on our team will answer within 6 hours, weekdays.' },
  ]
  const { blocks, order } = indexBlocks('qa', items.map((qa) => ({ type: 'qa', settings: qa })))
  return { settings: { title: 'Common questions' }, blocks, block_order: order }
}

function seedCta(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: `Get your ${c.productName} before the next restock`,
      subtitle: `Free shipping over ${money(50)} · 30-day returns · Real humans on email.`,
      cta: `Add ${c.productName} to cart — ${money(c.salePrice)}`,
      cta_url: '/#product',
    },
  }
}

function seedStickyAtc(c: BuildConfig): SeededSection {
  return {
    settings: {
      cta: `Add to cart — ${money(c.salePrice)}`,
      fallback_title: c.productName,
      fallback_image_url: pickImage(c, 0),
    },
  }
}

function seedPromoBar(c: BuildConfig): SeededSection {
  return {
    settings: {
      tag: 'DEAL',
      text: `Buy 2 ${c.productName}s, get 1 free — this week only`,
      cta: 'Claim it',
      cta_url: '#product',
      bg: '#111111',
      fg: '#FFFFFF',
    },
  }
}

function seedMarquee(c: BuildConfig): SeededSection {
  const items = [
    `★ Loved by 12,400+ ${c.storeName || 'customers'}`,
    `Free shipping over ${money(50)}`,
    '30-day money-back guarantee',
    'Ships in 24 hours',
    'Real-human support',
    `Save ${c.originalPrice > c.salePrice ? Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100) + '%' : '40%'} on bundles`,
  ]
  const { blocks, order } = indexBlocks('it', items.map((text) => ({ type: 'item', settings: { text } })))
  return { settings: { bg: '#111111', fg: '#FFFFFF' }, blocks, block_order: order }
}

function seedLogoBar(_c: BuildConfig): SeededSection {
  const labels = ['FORBES', 'WIRED', 'TECHCRUNCH', 'VOGUE', 'GQ', 'BUZZFEED']
  const { blocks, order } = indexBlocks('logo', labels.map((label) => ({ type: 'logo', settings: { label } })))
  return { settings: { title: 'As seen in' }, blocks, block_order: order }
}

function seedStats(c: BuildConfig): SeededSection {
  const avg = reviewAverage(c)
  const count = reviewCount(c)
  const stats = [
    { number: count ? `${count.toLocaleString('en-US')}+` : '12,400+', label: count ? 'Reviews on the original listing' : 'Happy customers' },
    { number: avg ? `${avg}★` : '4.9★', label: 'Average rating' },
    { number: '30 day',  label: 'Money-back guarantee' },
    { number: '24h',     label: 'Ships within' },
  ]
  const { blocks, order } = indexBlocks('s', stats.map((s) => ({ type: 'stat', settings: s })))
  return { settings: {}, blocks, block_order: order }
}

function seedCountdown(c: BuildConfig): SeededSection {
  // 6 days out — gives a real urgency window without baking a specific
  // date into the merchant's editor.
  const end = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
  return {
    settings: {
      eyebrow: 'Limited offer',
      title: `Save ${c.originalPrice > c.salePrice ? Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100) + '%' : 'big'} on ${c.productName}`,
      end_iso: end.toISOString(),
      cta_label: 'Claim deal',
      cta_url: '#product',
    },
  }
}

function seedStockCounter(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: 'Hurry! Only COUNT left in stock',
      count: '23',
      percent: 20,
      subtitle: `Once this batch of ${c.productName}s is gone, the next restock is 2 weeks out.`,
    },
  }
}

function seedHighlights(c: BuildConfig): SeededSection {
  const items = highlightFromDescription(c)
  const { blocks, order } = indexBlocks('h', items.map((h) => ({ type: 'highlight', settings: h })))
  return { settings: { title: `What makes ${c.productName} different` }, blocks, block_order: order }
}

function seedBeforeAfter(c: BuildConfig): SeededSection {
  // Pull two distinct images — if there are 5+ we use #2 and #3.
  return {
    settings: {
      title: `Life before vs. life with ${c.productName}`,
      subtitle: 'Drag the handle to compare.',
      before_url: pickImage(c, 1),
      after_url: pickImage(c, 0),
      before_label: 'Before',
      after_label: 'With ' + c.productName.split(' ')[0],
    },
  }
}

function seedHowItWorks(c: BuildConfig): SeededSection {
  const steps = [
    { heading: `Pick your ${c.productName}`, body: 'Single, bundle of 2 + 1 free, or bulk of 3 + 2 free — the more you buy, the more you save.' },
    { heading: 'Order in seconds',            body: 'Apple Pay, Shop Pay, Klarna, or card — your call. Ships in 24h.' },
    { heading: 'Track it home',               body: 'Real-time tracking by email. Usually arrives in 3-5 business days.' },
    { heading: 'Love it or refund',           body: '30 days to decide. We even pay the return label.' },
  ]
  const { blocks, order } = indexBlocks('step', steps.map((s) => ({ type: 'step', settings: s })))
  return { settings: { title: `How ${c.storeName} works` }, blocks, block_order: order }
}

function seedImageText(c: BuildConfig): SeededSection {
  // Transformation copy: paint the buyer's life AFTER the product, not
  // the product itself. Pulls a benefit phrase from the description
  // when one exists so the copy stays grounded in the listing.
  const pn = c.productName
  const desc = safeDescription(c, 160)
  return {
    settings: {
      image_url: pickImage(c, 1),
      eyebrow: 'Life with it',
      heading: `What actually changes once your ${pn} arrives`,
      body:
        `<p>Day one: you unbox it, set it up in minutes, and wonder why you waited this long. ` +
        `By week two it's just part of the routine — the annoying workaround it replaced is gone and you stop thinking about it.</p>` +
        `<p>${desc} That's the job the ${pn} does quietly, every single day — and if it doesn't earn its spot in your routine within 30 days, send it back on us.</p>`,
      cta: `Get your ${pn}`,
      cta_url: '/#product',
    },
  }
}

function seedUgc(c: BuildConfig): SeededSection {
  // Real review photos with real reviewer names beat product shots with
  // invented handles.
  const photos = reviewPhotos(c)
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  if (photos.length >= 4) {
    photos.slice(0, 12).forEach((p, i) => {
      const id = `p-${i + 1}`
      blocks[id] = { type: 'post', settings: { image_url: p.url, caption: p.name } }
      order.push(id)
    })
    return {
      settings: {
        eyebrow: 'Customer photos',
        title: `Real ${c.productName} buyers, real photos`,
        handle: 'From verified reviews',
      },
      blocks,
      block_order: order,
    }
  }
  const handles = ['@maya', '@alexp', '@jordan', '@sam', '@riley', '@taylor', '@kai', '@morgan', '@quinn', '@emma', '@noah', '@avery']
  for (let i = 0; i < 12; i++) {
    const id = `p-${i + 1}`
    blocks[id] = { type: 'post', settings: { image_url: pickImage(c, i), caption: handles[i % handles.length] } }
    order.push(id)
  }
  return {
    settings: {
      eyebrow: `#${(c.storeName || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      title: `Loved by the ${c.storeName} community`,
      handle: `@${(c.storeName || 'yourbrand').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    },
    blocks,
    block_order: order,
  }
}

function seedPress(c: BuildConfig): SeededSection {
  const pn = c.productName
  const items = [
    { quote: `The kind of one-product brand that actually delivers — and the ${pn} is the proof.`, source: 'FORBES' },
    { quote: `Builds you'd expect at twice the price.`,                                           source: 'WIRED' },
    { quote: `A standout in a crowded category.`,                                                  source: 'TECHCRUNCH' },
  ]
  const { blocks, order } = indexBlocks('q', items.map((p) => ({ type: 'quote', settings: p })))
  return { settings: { title: 'What the press is saying' }, blocks, block_order: order }
}

function seedFounder(c: BuildConfig): SeededSection {
  return {
    settings: {
      image_url: pickImage(c, 2),
      quote: `I started ${c.storeName} because the ${c.productName.toLowerCase()}s on the market were either overpriced or felt cheap. We made the one I'd want to own — and stand behind it.`,
      name: 'Sam Rivers',
      role: `Founder, ${c.storeName}`,
      cta: 'Read our story',
      cta_url: '/pages/about',
    },
  }
}

function seedGuarantee(c: BuildConfig): SeededSection {
  return {
    settings: {
      seal_text: 'Money-back',
      days: '30 days',
      title: `Try ${c.productName} risk-free for 30 days`,
      body: `If you don't love the ${c.productName}, send it back for a full refund — we even cover the return label. Real humans on email, under 6 hours weekdays.`,
    },
    blocks: {
      'p-1': { type: 'point', settings: { point: 'Return for any reason, no questions asked' } },
      'p-2': { type: 'point', settings: { point: 'We cover the return shipping label' } },
      'p-3': { type: 'point', settings: { point: 'Refund hits your card within 3 days' } },
      'p-4': { type: 'point', settings: { point: '12-month manufacturing warranty on top' } },
    },
    block_order: ['p-1', 'p-2', 'p-3', 'p-4'],
  }
}

function seedTrustBadges(_c: BuildConfig): SeededSection {
  return {
    settings: {},
    blocks: {
      'b-1': { type: 'badge', settings: { icon: '🚚', heading: 'Free shipping',     body: 'Tracked delivery in 3-5 days.' } },
      'b-2': { type: 'badge', settings: { icon: '🛡️', heading: '30-day returns',     body: 'We even pay the label.' } },
      'b-3': { type: 'badge', settings: { icon: '🔒', heading: 'Secure checkout',    body: 'Stripe-grade encryption.' } },
      'b-4': { type: 'badge', settings: { icon: '💬', heading: 'Real-human support', body: 'Reply in under 6 hours.' } },
    },
    block_order: ['b-1', 'b-2', 'b-3', 'b-4'],
  }
}

function seedRecentlyBought(c: BuildConfig): SeededSection {
  const buyers = [
    { name: 'Sarah M.',  product: '1× ' + c.productName,           location: 'Austin, TX' },
    { name: 'Jamie L.',  product: '2× pack',                       location: 'Brooklyn, NY' },
    { name: 'Maya R.',   product: 'Bundle of 3',                   location: 'Seattle, WA' },
    { name: 'Daniel K.', product: '1× ' + c.productName,           location: 'Toronto, ON' },
    { name: 'Riley T.',  product: '2× + 1 free',                   location: 'Chicago, IL' },
    { name: 'Quinn B.',  product: '1× ' + c.productName,           location: 'London, UK' },
  ]
  const { blocks, order } = indexBlocks('n', buyers.map((b) => ({ type: 'notification', settings: { ...b, action: 'just bought' } })))
  return { settings: { icon: '🛒', position: 'left' }, blocks, block_order: order }
}

function seedNewsletter(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: `${c.storeName || 'Insiders'} Insiders`,
      title: 'Get the drop first',
      subtitle: `Restock alerts and members-only deals on the ${c.productName}. No spam — unsubscribe in one click.`,
      cta: 'Subscribe',
    },
  }
}

function seedFreeShippingBar(_c: BuildConfig): SeededSection {
  return { settings: { threshold: 50 } }
}

function seedSecureCheckout(_c: BuildConfig): SeededSection {
  // The section renders the store's real enabled payment-type icons —
  // no manual badge blocks to maintain.
  return { settings: { title: 'Secure checkout · 256-bit encrypted' } }
}

function seedShippingInfo(_c: BuildConfig): SeededSection {
  return {
    settings: {},
    blocks: {
      'i-1': { type: 'info', settings: { icon: '🚚', heading: 'Free shipping over $50',   body: 'Tracked delivery in 3-5 business days, on us.' } },
      'i-2': { type: 'info', settings: { icon: '📦', heading: 'Ships from your country',  body: 'Local warehouses in US, UK, EU and AU.' } },
      'i-3': { type: 'info', settings: { icon: '↩️', heading: '30-day returns',            body: "If it's not for you, send it back — refund hits in 3 days." } },
    },
    block_order: ['i-1', 'i-2', 'i-3'],
  }
}

function seedAwards(_c: BuildConfig): SeededSection {
  const items = [
    { icon: '🏆', year: '2025', name: "Editors' Pick" },
    { icon: '🥇', year: '2025', name: 'Best New Brand' },
    { icon: '⭐', year: '2024', name: 'Top Rated' },
    { icon: '✨', year: '2024', name: 'Innovation Award' },
  ]
  const { blocks, order } = indexBlocks('a', items.map((a) => ({ type: 'award', settings: a })))
  return { settings: { title: 'Recognition' }, blocks, block_order: order }
}

function seedFloatingCta(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: 'First-timer? Get 10% off',
      subtitle: `Code WELCOME10 on your first ${c.productName}.`,
      cta: 'Use code',
      cta_url: '/#product',
      image_url: pickImage(c, 0),
    },
  }
}

function seedStarsSummary(c: BuildConfig): SeededSection {
  // Real distribution computed from the scraped ratings when available.
  if (hasRealReviews(c)) {
    const rs = realReviews(c)
    const dist = [0, 0, 0, 0, 0]
    for (const r of rs) dist[Math.min(5, Math.max(1, Math.round(r.rating))) - 1]++
    const pct = dist.map((n) => Math.round((n / rs.length) * 100))
    const avg = reviewAverage(c) || '5.0'
    const count = reviewCount(c) || rs.length
    return {
      settings: { average: avg, count: `Based on ${count.toLocaleString('en-US')} reviews on the original listing` },
      blocks: {
        'r-5': { type: 'bar', settings: { label: '5★', percent: pct[4] } },
        'r-4': { type: 'bar', settings: { label: '4★', percent: pct[3] } },
        'r-3': { type: 'bar', settings: { label: '3★', percent: pct[2] } },
        'r-2': { type: 'bar', settings: { label: '2★', percent: pct[1] } },
        'r-1': { type: 'bar', settings: { label: '1★', percent: pct[0] } },
      },
      block_order: ['r-5', 'r-4', 'r-3', 'r-2', 'r-1'],
    }
  }
  return {
    settings: { average: '4.9', count: 'Based on 2,431 reviews' },
    blocks: {
      'r-5': { type: 'bar', settings: { label: '5★', percent: 88 } },
      'r-4': { type: 'bar', settings: { label: '4★', percent: 8 } },
      'r-3': { type: 'bar', settings: { label: '3★', percent: 2 } },
      'r-2': { type: 'bar', settings: { label: '2★', percent: 1 } },
      'r-1': { type: 'bar', settings: { label: '1★', percent: 1 } },
    },
    block_order: ['r-5', 'r-4', 'r-3', 'r-2', 'r-1'],
  }
}

function seedTestimonialsVideo(c: BuildConfig): SeededSection {
  const pn = c.productName
  const items = [
    { quote: `Honestly the best thing I bought this year.`,      author: 'Sarah, Austin' },
    { quote: `I use my ${pn} every single day.`,                  author: 'Alex, Brooklyn' },
    { quote: `Worth every penny.`,                                 author: 'Maya, Seattle' },
    { quote: `I bought two more for my parents.`,                  author: 'Jordan, Toronto' },
  ]
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  items.forEach((it, i) => {
    const id = `v-${i + 1}`
    blocks[id] = { type: 'video', settings: { ...it } }
    order.push(id)
  })
  return {
    settings: { title: `Real ${pn} owners, real stories`, subtitle: 'Tap any clip to watch the unedited review.' },
    blocks,
    block_order: order,
  }
}

function seedCustomerPhotos(c: BuildConfig): SeededSection {
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  // Real review photos with the reviewer's real name when we have them.
  const photos = reviewPhotos(c)
  if (photos.length >= 4) {
    photos.slice(0, 8).forEach((p, i) => {
      const id = `p-${i + 1}`
      blocks[id] = { type: 'photo', settings: { author: p.name, note: 'Verified buyer', image_url: p.url } }
      order.push(id)
    })
    return { settings: { title: `Real ${c.productName} owners, real photos` }, blocks, block_order: order }
  }
  const items = [
    { author: 'Sarah M.', note: 'Verified buyer' },
    { author: 'Alex P.',  note: 'Verified buyer' },
    { author: 'Maya R.',  note: 'Verified buyer' },
    { author: 'Jordan S.',note: 'Verified buyer' },
    { author: 'Riley T.', note: 'Verified buyer' },
    { author: 'Quinn B.', note: 'Verified buyer' },
    { author: 'Daniel K.',note: 'Verified buyer' },
    { author: 'Morgan H.',note: 'Verified buyer' },
  ]
  items.forEach((it, i) => {
    const id = `p-${i + 1}`
    blocks[id] = { type: 'photo', settings: { ...it, image_url: pickImage(c, i + 1) } }
    order.push(id)
  })
  return { settings: { title: `Real ${c.productName} owners, real photos` }, blocks, block_order: order }
}

function seedVolumeDiscount(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: `Buy more ${c.productName}, save more`,
      subtitle: 'Stock up — the more you buy, the less each one costs.',
      fallback_price: c.salePrice,
      cta: 'Add to cart',
    },
    blocks: {
      't-1': { type: 'tier', settings: { qty: 1, discount_pct: 0  } },
      't-2': { type: 'tier', settings: { qty: 2, discount_pct: 15 } },
      't-3': { type: 'tier', settings: { qty: 3, discount_pct: 25, featured: true, ribbon: 'Most popular' } },
      't-4': { type: 'tier', settings: { qty: 5, discount_pct: 40 } },
    },
    block_order: ['t-1', 't-2', 't-3', 't-4'],
  }
}

function seedFrequentlyBought(c: BuildConfig): SeededSection {
  const accessory = c.salePrice * 0.4
  const addon = c.salePrice * 0.2
  return {
    settings: {
      title: 'Frequently bought together',
      bundle_total: money(c.salePrice + accessory + addon),
      cta: 'Add all to cart',
    },
    blocks: {
      'fbt-1': { type: 'item', settings: { name: c.productName,            price: money(c.salePrice), preselected: true,  image_url: pickImage(c, 0) } },
      'fbt-2': { type: 'item', settings: { name: 'Travel case',             price: money(accessory),  preselected: true,  image_url: pickImage(c, 1) } },
      'fbt-3': { type: 'item', settings: { name: 'Refill / accessory pack', price: money(addon),      preselected: false, image_url: pickImage(c, 2) } },
    },
    block_order: ['fbt-1', 'fbt-2', 'fbt-3'],
  }
}

function seedProductSpecs(c: BuildConfig): SeededSection {
  // Real specs scraped from the source listing win — no invented
  // dimensions/weights a buyer could return the product over.
  const real = Object.entries(c.specs || {})
    .filter(([k, v]) => k && v && k.length <= 40 && String(v).length <= 120)
    .slice(0, 8)
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  if (real.length >= 2) {
    real.forEach(([label, value], i) => {
      const id = `s-${i + 1}`
      blocks[id] = { type: 'spec', settings: { label, value: String(value) } }
      order.push(id)
    })
    return { settings: { title: `${c.productName} specs` }, blocks, block_order: order }
  }
  // Fallback: only claims we stand behind elsewhere in the theme —
  // no fabricated dimensions or weights.
  const fallback = [
    { label: 'Warranty',   value: '12 months against manufacturing defects' },
    { label: 'Returns',    value: '30-day money-back guarantee' },
    { label: 'Shipping',   value: 'Tracked, typically 3-5 business days' },
    { label: 'In the box', value: `1× ${c.productName}` },
  ]
  fallback.forEach((s, i) => {
    const id = `s-${i + 1}`
    blocks[id] = { type: 'spec', settings: s }
    order.push(id)
  })
  return { settings: { title: `${c.productName} specs` }, blocks, block_order: order }
}

function seedProductVideo(_c: BuildConfig): SeededSection {
  return { settings: { title: 'See it in action', video_url: '' } }
}

function seedSizeChart(_c: BuildConfig): SeededSection {
  return {
    settings: {
      title: 'Size guide',
      note: 'Measurements are in centimetres. When in doubt, size up.',
      headers: 'Chest, Length, Sleeve',
    },
    blocks: {
      'sz-1': { type: 'row', settings: { size: 'S',  col1: '92',  col2: '66', col3: '58' } },
      'sz-2': { type: 'row', settings: { size: 'M',  col1: '98',  col2: '68', col3: '60' } },
      'sz-3': { type: 'row', settings: { size: 'L',  col1: '104', col2: '70', col3: '62' } },
      'sz-4': { type: 'row', settings: { size: 'XL', col1: '112', col2: '72', col3: '64' } },
    },
    block_order: ['sz-1', 'sz-2', 'sz-3', 'sz-4'],
  }
}

function seedShippingEstimator(_c: BuildConfig): SeededSection {
  return { settings: { cutoff: '2h 14m', days_from_now: 4, deliver_label: 'in 3-5 business days' } }
}

function seedRelatedProducts(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'You may also like', count: 4 },
    blocks: {
      'r-1': { type: 'fallback', settings: { name: 'Travel case', price: '$19.99' } },
      'r-2': { type: 'fallback', settings: { name: 'Refill pack', price: '$24.99' } },
      'r-3': { type: 'fallback', settings: { name: 'Companion',   price: '$34.99' } },
      'r-4': { type: 'fallback', settings: { name: 'Bundle save', price: '$59.99' } },
    },
    block_order: ['r-1', 'r-2', 'r-3', 'r-4'],
  }
}

function seedProductTabs(c: BuildConfig): SeededSection {
  const pn = c.productName
  return {
    settings: {},
    blocks: {
      't-1': { type: 'tab', settings: { label: 'Description', body: `<p>The ${pn} is built for everyday use and backed by a 30-day promise. ${safeDescription(c, 240)}</p>` } },
      't-2': { type: 'tab', settings: { label: 'Shipping',    body: '<p>Ships in 24h from local warehouses. Free over $50. Tracked 3-5 days in the US, 7-12 days internationally.</p>' } },
      't-3': { type: 'tab', settings: { label: 'Returns',     body: "<p>30 days, no questions asked. We pay the return label and your refund hits in 3 days.</p>" } },
      't-4': { type: 'tab', settings: { label: 'Care',        body: `<p>Wipe ${pn.toLowerCase()} with a soft cloth. Avoid harsh detergents and don't submerge unless rated waterproof.</p>` } },
      't-5': { type: 'tab', settings: { label: 'Warranty',    body: '<p>12-month warranty against manufacturing defects. Replace, no return shipping needed.</p>' } },
    },
    block_order: ['t-1', 't-2', 't-3', 't-4', 't-5'],
  }
}

function seedProductQa(c: BuildConfig): SeededSection {
  const pn = c.productName
  return {
    settings: {
      title: `Questions from ${pn} buyers`,
      subtitle: 'Real answers from the team and recent customers.',
    },
    blocks: {
      'q-1': { type: 'qa', settings: { question: 'Is this safe for sensitive skin?',           answer: 'Yes — formulated with hypoallergenic ingredients. Tested by dermatologists.',           answered_by: 'The team' } },
      'q-2': { type: 'qa', settings: { question: 'How long does shipping take?',                answer: 'Tracked 3-5 business days in the US. International 7-12 days.',                       answered_by: 'Sarah, Customer Care' } },
      'q-3': { type: 'qa', settings: { question: 'Will it work on my device?',                  answer: 'Compatible with most modern devices. Check the specs section for exact models.',     answered_by: 'Tech support' } },
      'q-4': { type: 'qa', settings: { question: 'How does the bundle discount work?',           answer: 'Pick a 2- or 3-pack on the product page — the discount applies automatically at checkout.', answered_by: 'The team' } },
      'q-5': { type: 'qa', settings: { question: `How does ${pn} compare to the cheap version?`, answer: 'Cheap versions skip QA and use lower-grade materials. Ours is hand-checked before shipping and backed by a 12-month warranty.', answered_by: 'Alex, Founder' } },
    },
    block_order: ['q-1', 'q-2', 'q-3', 'q-4', 'q-5'],
  }
}

function seedRecentlyViewed(_c: BuildConfig): SeededSection {
  return { settings: { title: 'Recently viewed' } }
}

function seedHeroVideo(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'Now shipping',
      headline: `Meet the ${c.productName}.`,
      subhead: `An honest ${c.productName.toLowerCase()} made by a small team you can email. Loved by 12,400+ customers.`,
      cta: 'Shop the drop',
      cta_url: '#product',
      dim_top: 30,
      dim_bottom: 60,
    },
  }
}

function seedHeroSplit(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'New drop',
      headline: `The ${c.productName} you'll actually use`,
      subhead: `Designed for daily wear. Built to last. Loved by 12,400+ ${c.storeName || 'our'} customers.`,
      cta: 'Shop now',
      cta_url: '#product',
      cta2: 'Read our story',
      cta2_url: '/pages/about',
      image_url: pickImage(c, 1),
      flip: false,
    },
    blocks: {
      'b-1': { type: 'bullet', settings: { point: 'Free shipping over $50' } },
      'b-2': { type: 'bullet', settings: { point: '30-day money-back guarantee' } },
      'b-3': { type: 'bullet', settings: { point: 'Ships in 24 hours' } },
    },
    block_order: ['b-1', 'b-2', 'b-3'],
  }
}

function seedMission(c: BuildConfig): SeededSection {
  return {
    settings: {
      mark: '❝',
      quote: `To make the one ${c.productName.toLowerCase()} worth owning — and stand behind it for life.`,
      by: `${c.storeName || 'Our'} promise`,
    },
  }
}

function seedTimeline(c: BuildConfig): SeededSection {
  return {
    settings: { title: `${c.storeName || 'Our'} story` },
    blocks: {
      'y-1': { type: 'milestone', settings: { year: '2022', heading: 'Founded in a garage',     body: `Two co-founders, one ${c.productName.toLowerCase()} prototype, no money.` } },
      'y-2': { type: 'milestone', settings: { year: '2023', heading: 'First 1,000 customers',   body: 'Sold out our first production run in 14 days.' } },
      'y-3': { type: 'milestone', settings: { year: '2024', heading: '10× growth',              body: 'Doubled the team, opened warehouses in 4 countries.' } },
      'y-4': { type: 'milestone', settings: { year: '2025', heading: '12,400+ happy customers', body: 'And counting.' } },
    },
    block_order: ['y-1', 'y-2', 'y-3', 'y-4'],
  }
}

function seedValues(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'What we believe', subtitle: 'Three principles every product passes through.' },
    blocks: {
      'v-1': { type: 'value', settings: { icon: '🌱', heading: 'Sustainably sourced', body: 'We pay more for materials so the planet pays less.' } },
      'v-2': { type: 'value', settings: { icon: '💛', heading: 'Honest pricing',      body: 'We tell you exactly what each piece costs to make.' } },
      'v-3': { type: 'value', settings: { icon: '🛠️', heading: 'Built to last',       body: 'If it breaks in the first year, we replace it.' } },
    },
    block_order: ['v-1', 'v-2', 'v-3'],
  }
}

function seedTeam(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'The team' },
    blocks: {
      'p-1': { type: 'person', settings: { name: 'Sam',    role: 'Founder & CEO',     bio: 'Spends weekends taking the product apart and putting it back together.' } },
      'p-2': { type: 'person', settings: { name: 'Maya',   role: 'Design lead',       bio: 'Cares more about the box than is healthy.' } },
      'p-3': { type: 'person', settings: { name: 'Alex',   role: 'Operations',        bio: 'Answers your tracking emails — usually within an hour.' } },
      'p-4': { type: 'person', settings: { name: 'Jordan', role: 'Customer care',     bio: 'If your order is late, you hear from Jordan first.' } },
    },
    block_order: ['p-1', 'p-2', 'p-3', 'p-4'],
  }
}

function seedPromoBanner(c: BuildConfig): SeededSection {
  return {
    settings: {
      image_url: pickImage(c, 0),
      eyebrow: 'SALE',
      title: `Up to ${c.originalPrice > c.salePrice ? Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100) : 40}% off the ${c.productName}`,
      subtitle: 'Limited stock — ends Sunday.',
      cta: 'Shop the sale',
      cta_url: '#product',
      dim: 45,
    },
  }
}

function seedFeaturedProduct(c: BuildConfig): SeededSection {
  return {
    settings: {
      image_url: pickImage(c, 0),
      title: c.productName,
      subtitle: safeDescription(c, 160),
      price: money(c.salePrice),
      compare: c.originalPrice > c.salePrice ? money(c.originalPrice) : '',
      reviews: '(2,431 reviews)',
      cta: `Add to cart — ${money(c.salePrice)}`,
      cta_url: '#product',
    },
    blocks: {
      'b-1': { type: 'bullet', settings: { point: 'Free shipping over $50' } },
      'b-2': { type: 'bullet', settings: { point: '30-day money-back guarantee' } },
      'b-3': { type: 'bullet', settings: { point: 'Ships within 24 hours' } },
      'b-4': { type: 'bullet', settings: { point: '12-month warranty' } },
    },
    block_order: ['b-1', 'b-2', 'b-3', 'b-4'],
  }
}

function seedFeaturedCollection(_c: BuildConfig): SeededSection {
  return {
    settings: { eyebrow: 'Shop', title: 'Bestsellers', count: 8, see_all: 'See all', see_all_url: '/collections/all' },
    blocks: {
      'c-1': { type: 'fallback', settings: { name: 'Bestseller', price: '$49.99' } },
      'c-2': { type: 'fallback', settings: { name: 'New',        price: '$39.99' } },
      'c-3': { type: 'fallback', settings: { name: 'Bundle',     price: '$89.99' } },
      'c-4': { type: 'fallback', settings: { name: 'Refill',     price: '$19.99' } },
    },
    block_order: ['c-1', 'c-2', 'c-3', 'c-4'],
  }
}

function seedInstagram(c: BuildConfig): SeededSection {
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  for (let i = 0; i < 8; i++) {
    const id = `p-${i + 1}`
    blocks[id] = { type: 'post', settings: { image_url: pickImage(c, i), alt: 'Customer post', post_url: '' } }
    order.push(id)
  }
  return {
    settings: { title: 'Follow along', handle: `@${(c.storeName || 'yourbrand').toLowerCase().replace(/[^a-z0-9]/g, '')}` },
    blocks,
    block_order: order,
  }
}

function seedBlogGrid(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'From the journal', count: 3 },
    blocks: {
      'p-1': { type: 'fallback', settings: { title: 'Why we chose this material',  meta: 'MAR 12 · MAYA',  excerpt: 'It cost us more but lasted twice as long in our testing.' } },
      'p-2': { type: 'fallback', settings: { title: 'Behind the box',               meta: 'MAR 06 · ALEX',  excerpt: 'Our packaging redesign cut waste by 40%.' } },
      'p-3': { type: 'fallback', settings: { title: 'What customers taught us',     meta: 'FEB 28 · SARAH', excerpt: 'Three lessons from 2,400 emails this quarter.' } },
    },
    block_order: ['p-1', 'p-2', 'p-3'],
  }
}

function seedGallery(c: BuildConfig): SeededSection {
  const captions = ['Studio', 'Detail', 'In hand', 'On the go', 'At home', 'Packaging']
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  for (let i = 0; i < 6; i++) {
    const id = `g-${i + 1}`
    blocks[id] = { type: 'image', settings: { image_url: pickImage(c, i), caption: captions[i] || '' } }
    order.push(id)
  }
  return { settings: { title: `${c.storeName} gallery`, columns: 3 }, blocks, block_order: order }
}

function seedQuote(c: BuildConfig): SeededSection {
  return {
    settings: {
      quote: `An honest ${c.productName.toLowerCase()} made by people who care.`,
      author: 'Vogue',
    },
  }
}

function seedRichText(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'About this story',
      heading: `Why we made the ${c.productName}`,
      body: `<p>${safeDescription(c, 320)}</p><p>We obsess over the small stuff — the packaging, the email reply time, the way the product feels on day 30 instead of day 1. ${c.storeName} exists because we wanted a ${c.productName.toLowerCase()} we'd actually keep using.</p>`,
      alignment: 'left',
      cta: 'Shop the ' + c.productName,
      cta_url: '#product',
    },
  }
}

function seedMultiColumn(c: BuildConfig): SeededSection {
  return {
    settings: { title: 'Three ways we win', columns: 3 },
    blocks: {
      'c-1': { type: 'column', settings: { image_url: pickImage(c, 0), heading: 'Materials',  body: '<p>Premium-grade across the board — no plastic shortcuts.</p>',                 cta: 'See details', cta_url: '/#product' } },
      'c-2': { type: 'column', settings: { image_url: pickImage(c, 1), heading: 'Build',      body: '<p>QA’d by hand before it ships. Every single piece.</p>',                 cta: '',           cta_url: '' } },
      'c-3': { type: 'column', settings: { image_url: pickImage(c, 2), heading: 'Support',    body: '<p>Real humans reply within 6 hours — and they actually know the product.</p>',cta: 'Read reviews', cta_url: '/#reviews' } },
    },
    block_order: ['c-1', 'c-2', 'c-3'],
  }
}

function seedIconList(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'Why us' },
    blocks: {
      'i-1': { type: 'row', settings: { icon: '🚚', heading: 'Always free shipping',  body: 'Tracked delivery in 3-5 days, every time.' } },
      'i-2': { type: 'row', settings: { icon: '↩️', heading: 'Return for any reason', body: '30 days, no questions asked, we pay the label.' } },
      'i-3': { type: 'row', settings: { icon: '💬', heading: 'Real humans on email',   body: 'Reply within 6 hours, weekdays.' } },
      'i-4': { type: 'row', settings: { icon: '🛡️', heading: '12-month warranty',     body: 'If it fails, we replace it — no return-shipping argument.' } },
    },
    block_order: ['i-1', 'i-2', 'i-3', 'i-4'],
  }
}

function seedImageSec(c: BuildConfig): SeededSection {
  return {
    settings: { image_url: pickImage(c, 0), caption: `${c.productName} — shot in our studio.`, width: 1000 },
  }
}

function seedDivider(_c: BuildConfig): SeededSection {
  return { settings: { style: 'ornament', ornament: '· · ·', height: 48 } }
}

function seedCartUpsell(_c: BuildConfig): SeededSection {
  // The section now recommends real store products (and hides itself
  // when there's nothing to recommend) — no fake companion items.
  return { settings: { title: 'You may also like' } }
}

function seedContactForm(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'Talk to us',
      title: 'We answer every email',
      subtitle: `No bots, no forms-from-hell. Real humans behind ${c.storeName}.`,
    },
    blocks: {
      'inf-1': { type: 'info', settings: { label: 'Email',    value: `hi@${(c.storeName || 'yourstore').toLowerCase().replace(/[^a-z0-9]/g, '')}.com` } },
      'inf-2': { type: 'info', settings: { label: 'Hours',    value: 'Mon-Fri 9am-6pm' } },
      'inf-3': { type: 'info', settings: { label: 'Reply by', value: 'Within 6 hours' } },
    },
    block_order: ['inf-1', 'inf-2', 'inf-3'],
  }
}

function seedBlogList(_c: BuildConfig): SeededSection {
  return { settings: { per_page: 9 } }
}

function seedNoop(_c: BuildConfig): SeededSection {
  return { settings: {} }
}

/* ── public API ────────────────────────────────────────────────────── */

const SEEDS: Record<string, (c: BuildConfig) => SeededSection> = {
  // Header + footer + announcement
  'ds-announcement':    seedAnnouncement,
  'ds-header':          seedNoop,
  'ds-footer':          seedFooter,
  // Hero / hooks
  'ds-hero':            seedHero,
  'ds-hero-video':      seedHeroVideo,
  'ds-hero-split':      seedHeroSplit,
  'ds-promo-bar':       seedPromoBar,
  'ds-marquee':         seedMarquee,
  'ds-logo-bar':        seedLogoBar,
  'ds-stats':           seedStats,
  // Product core
  'ds-product-main':    seedProductMain,
  'ds-bundle':          seedBundle,
  'ds-volume-discount': seedVolumeDiscount,
  'ds-frequently-bought': seedFrequentlyBought,
  // Product extras
  'ds-product-highlights': seedHighlights,
  'ds-product-specs':   seedProductSpecs,
  'ds-product-video':   seedProductVideo,
  'ds-size-chart':      seedSizeChart,
  'ds-shipping-estimator': seedShippingEstimator,
  'ds-related-products': seedRelatedProducts,
  'ds-product-tabs':    seedProductTabs,
  'ds-product-qa':      seedProductQa,
  'ds-recently-viewed': seedRecentlyViewed,
  // Conversion
  'ds-countdown':       seedCountdown,
  'ds-stock-counter':   seedStockCounter,
  'ds-free-shipping-bar': seedFreeShippingBar,
  'ds-guarantee':       seedGuarantee,
  'ds-secure-checkout': seedSecureCheckout,
  'ds-trust-badges':    seedTrustBadges,
  'ds-floating-cta':    seedFloatingCta,
  'ds-shipping-info':   seedShippingInfo,
  'ds-features':        seedFeatures,
  'ds-comparison':      seedComparison,
  'ds-cta':             seedCta,
  'ds-sticky-atc':      seedStickyAtc,
  // Social proof
  'ds-reviews':         seedReviews,
  'ds-faq':             seedFaq,
  'ds-recently-bought': seedRecentlyBought,
  'ds-ugc-gallery':     seedUgc,
  'ds-press':           seedPress,
  'ds-awards':          seedAwards,
  'ds-stars-summary':   seedStarsSummary,
  'ds-testimonials-video': seedTestimonialsVideo,
  'ds-customer-photos': seedCustomerPhotos,
  // Storytelling
  'ds-founder-story':   seedFounder,
  'ds-mission':         seedMission,
  'ds-timeline':        seedTimeline,
  'ds-values':          seedValues,
  'ds-team':            seedTeam,
  'ds-before-after':    seedBeforeAfter,
  'ds-how-it-works':    seedHowItWorks,
  'ds-image-text':      seedImageText,
  // Marketing
  'ds-promo-banner':    seedPromoBanner,
  'ds-featured-product': seedFeaturedProduct,
  'ds-featured-collection': seedFeaturedCollection,
  'ds-newsletter':      seedNewsletter,
  'ds-instagram':       seedInstagram,
  'ds-blog-grid':       seedBlogGrid,
  'ds-gallery':         seedGallery,
  'ds-video':           seedNoop,
  'ds-rich-text':       seedRichText,
  'ds-quote':           seedQuote,
  'ds-multi-column':    seedMultiColumn,
  'ds-icon-list':       seedIconList,
  'ds-image-sec':       seedImageSec,
  'ds-divider':         seedDivider,
  'ds-cart-upsell':     seedCartUpsell,
  'ds-contact-form':    seedContactForm,
  'ds-blog-list':       seedBlogList,
  'ds-article-main':    seedNoop,
  // Page sections
  'ds-cart':            seedNoop,
  'ds-collection':      seedNoop,
  'ds-page':            seedNoop,
  'ds-search':          seedNoop,
}

export function seedSection(name: string, c: BuildConfig): SeededSection {
  const fn = SEEDS[name]
  if (!fn) return { settings: {} }
  return fn(c)
}

/**
 * Build a `templates/*.json` object: given an ordered list of
 * `{id, type}` section refs, return the fully-seeded JSON document
 * Shopify will render.
 */
/* ── AI-claims manifest ───────────────────────────────────────────── */

/**
 * Everything in the generated theme that the AI invented and the
 * merchant MUST verify or replace before launch — numbers we cannot
 * know (stock counts, buyer names), legal-risk content (press quotes),
 * and promises that must match the store's actual policies.
 *
 * Surfaced post-generation in the build UI and written into the theme
 * README. Entries drop off automatically when real data replaced them
 * (e.g. scraped reviews).
 */
export type ThemeClaim = {
  id: string
  severity: 'high' | 'medium'
  location: string
  claim: string
  why: string
  fix: string
}

export function collectClaims(c: BuildConfig): ThemeClaim[] {
  const claims: ThemeClaim[] = []
  const real = hasRealReviews(c)
  const photosReal = reviewPhotos(c).length >= 4

  claims.push({
    id: 'press-quotes',
    severity: 'high',
    location: 'Homepage → "What the press is saying" + "As seen in" logos',
    claim: 'Quotes attributed to FORBES, WIRED, TECHCRUNCH (and the logo bar)',
    why: 'These outlets never reviewed your product. Publishing invented quotes under real brand names is false advertising and can get the store taken down.',
    fix: 'Theme editor → Press / Logo bar: replace with real coverage, or delete both sections.',
  })
  claims.push({
    id: 'stock-counter',
    severity: 'high',
    location: 'Homepage → stock counter',
    claim: '"Hurry! Only 23 left in stock" (count and bar are static)',
    why: 'The theme cannot know your real inventory — 23 is an invented number.',
    fix: 'Theme editor → Stock counter: set your real count, or delete the section.',
  })
  claims.push({
    id: 'recent-buyers',
    severity: 'high',
    location: 'Homepage + product page → "recently bought" toasts',
    claim: 'Sarah M., Jamie L., Maya R… "just bought" notifications',
    why: 'These buyers are invented. Fake purchase notifications are banned by consumer-protection rules in the EU/UK and risky everywhere.',
    fix: 'Theme editor → Recently bought: replace with real orders once you have them, or delete the section.',
  })
  if (!real) {
    claims.push({
      id: 'reviews-fallback',
      severity: 'high',
      location: 'Reviews, star summary, customer photos, UGC gallery',
      claim: 'All reviews, the 4.9★ average, and "2,431 verified reviews" are invented',
      why: 'No real reviews could be scraped from the source listing, so placeholder reviews were generated.',
      fix: 'Import real reviews (e.g. a reviews app, or re-generate from an AliExpress URL so Zenya can pull the real ones), then replace these.',
    })
  } else {
    claims.push({
      id: 'reviews-imported',
      severity: 'medium',
      location: 'Reviews, star summary' + (photosReal ? ', customer photos, UGC gallery' : ''),
      claim: 'Seeded from real reviews on the source listing (real names, text, ratings' + (photosReal ? ', photos' : '') + ')',
      why: 'These are reviews of the supplier listing, not of your store — review them for tone and remove any that mention the supplier or prices.',
      fix: 'Theme editor → Reviews: prune anything that does not fit your brand.',
    })
  }
  claims.push({
    id: 'bundle-discount',
    severity: 'high',
    location: 'Buy-box tiers + bundle picker ("2× + 1 free") + volume-discount tiers',
    claim: 'Free-unit and percentage-off promises',
    why: 'The bundle button adds the paid units to the cart, but Shopify only honors "+1 free" or "15% off" if you create the discount.',
    fix: 'Shopify admin → Discounts → create automatic "Buy X get Y" / volume discounts that match the tiers, or edit the tier copy.',
  })
  claims.push({
    id: 'social-counts',
    severity: real ? 'medium' : 'high',
    location: 'Hero stats, stats strip, marquee, announcement bar',
    claim: real
      ? 'Counts now use the source listing’s review numbers — "happy customers" style phrasing is still yours to own'
      : '"12,400+ happy customers", "4.9★", "2,400+ reviews"',
    why: 'Customer counts must be true for YOUR store.',
    fix: 'Theme editor → Hero / Stats / Marquee: set real numbers or soften the copy ("Join our first customers").',
  })
  claims.push({
    id: 'founder-persona',
    severity: 'medium',
    location: 'Homepage + about page → founder story',
    claim: '"Sam Rivers, Founder" and the founder quote',
    why: 'Invented persona with a product photo as the portrait.',
    fix: 'Theme editor → Founder story: use your real name, photo, and words — or delete the section.',
  })
  claims.push({
    id: 'policy-promises',
    severity: 'medium',
    location: 'Guarantee, trust badges, FAQ, footer, product trust points',
    claim: '30-day money-back, 12-month warranty, free shipping over $50, 3-5 day delivery, 6-hour support replies',
    why: 'These must match your actual Shopify policies and what your supplier can deliver.',
    fix: 'Set real policies in Shopify admin → Settings → Policies, then align the copy (or keep the promises and honor them).',
  })
  claims.push({
    id: 'countdown',
    severity: 'medium',
    location: 'Homepage → countdown timer',
    claim: `Sale end date auto-set ~6 days from generation`,
    why: 'An evergreen fake deadline that resets is a dark pattern; a real one converts and stays legal.',
    fix: 'Theme editor → Countdown: set a real end date for a real promotion, or delete the section.',
  })
  if (!c.specs || Object.keys(c.specs).length < 2) {
    claims.push({
      id: 'specs',
      severity: 'medium',
      location: 'Product page → specs table',
      claim: 'Generic placeholder spec rows (no real specs could be scraped)',
      why: 'Buyers return products over wrong specs — only you can confirm dimensions, materials, and box contents.',
      fix: 'Theme editor → Product specs: copy the real specs from your supplier listing.',
    })
  }
  claims.push({
    id: 'discount-code',
    severity: 'medium',
    location: 'Floating CTA card',
    claim: '"Code WELCOME10 for 10% off"',
    why: 'The code does not exist until you create it.',
    fix: 'Shopify admin → Discounts → create WELCOME10 (10%), or edit/remove the card.',
  })
  return claims
}

export function buildTemplate(
  refs: Array<{ id: string; type: string }>,
  c: BuildConfig,
): {
  sections: Record<string, { type: string; settings: Settings; blocks?: Record<string, Block>; block_order?: string[] }>
  order: string[]
} {
  const sections: Record<
    string,
    { type: string; settings: Settings; blocks?: Record<string, Block>; block_order?: string[] }
  > = {}
  const order: string[] = []
  for (const ref of refs) {
    const seed = seedSection(ref.type, c)
    const entry: { type: string; settings: Settings; blocks?: Record<string, Block>; block_order?: string[] } = {
      type: ref.type,
      settings: seed.settings,
    }
    if (seed.blocks && Object.keys(seed.blocks).length) {
      entry.blocks = seed.blocks
      entry.block_order = seed.block_order || Object.keys(seed.blocks)
    }
    sections[ref.id] = entry
    order.push(ref.id)
  }
  return { sections, order }
}
