import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateContentSchema } from '@/utils/validators'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ROUTE_BUDGET_MS = 70_000
const ANALYSIS_TIMEOUT_MS = 18_000
const CONTENT_TIMEOUT_MS = 32_000
const REPAIR_TIMEOUT_MS = 12_000

function timeoutError(label: string, ms: number) {
  return new Error(`${label}_timeout_${ms}ms`)
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(timeoutError(label, ms)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const timeLeft = () => ROUTE_BUDGET_MS - (Date.now() - startedAt)
  const body = await req.json()
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const name = parsed.data.name
  const description = parsed.data.description || ''
  const audience = parsed.data.audience || 'dropshippers and one-product store buyers'
  const productUrl = parsed.data.productUrl || ''
  const price = parsed.data.price
  const originalPrice = parsed.data.originalPrice
  const productFacts = parsed.data.productFacts

  const getMockContent = (productName: string) => ({
    hero: {
      headline: `The Ultimate ${productName}`,
      subheadline: "Experience perfection in every detail with the most advanced design on the market.",
      cta: "Get 50% Off Today"
    },
    slideshow: [
      { heading: `Welcome to the Future of ${productName}`, subheading: "Discover the innovation that everyone is talking about.", cta: "Shop Collection" },
      { heading: "Engineered for Excellence", subheading: "Quality that stands the test of time.", cta: "Learn More" }
    ],
    video_hero: {
      heading: "Cinematic Excellence",
      subheading: "Immerse yourself in the story behind the brand.",
      cta: "Watch Film"
    },
    features: [
      { title: "Eco-Friendly Materials", desc: "Crafted with 100% sustainable materials that are built to last a lifetime.", icon: "leaf" },
      { title: "Ergonomic Design", desc: "Designed by experts to fit perfectly in your life, maximizing comfort and utility.", icon: "design" },
      { title: "Instant Setup", desc: "Ready to use right out of the box. No complicated manuals or tools required.", icon: "bolt" }
    ],
    problem: {
      headline: "Tired of cheap alternatives that break?",
      text: "Most products on the market are built with planned obsolescence in mind. They look good but fail when you need them most, leaving you frustrated and out of pocket."
    },
    solution: {
      headline: `Meet the ${productName}`,
      text: "We engineered this from the ground up to solve every pain point. Durable, stylish, and incredibly effective—it is the last one you will ever need to buy."
    },
    testimonials: [
      { name: "Sarah J.", text: "This changed my daily routine completely. Highly recommended!", location: "New York, USA", rating: 5 },
      { name: "Mike T.", text: "Best investment I've made this year. Quality is unmatched.", location: "London, UK", rating: 5 },
      { name: "Jessica L.", text: "Fast shipping and great customer service. 10/10.", location: "Sydney, AU", rating: 5 }
    ],
    faq: [
      { q: "Is this suitable for beginners?", a: "Absolutely! It is designed for all skill levels." },
      { q: "How do I clean it?", a: "Just wipe it down with a damp cloth after use." },
      { q: "What is the warranty?", a: "We offer a full 5-year comprehensive warranty." },
      { q: "Do you ship internationally?", a: "Yes, we ship to over 50 countries worldwide." }
    ],
    guarantee: {
      title: "Ironclad 30-Day Guarantee",
      text: "Try it risk-free. If you aren't completely blown away, simply return it for a full refund. No questions asked.",
      days: 30
    },
    rich_text: {
      title: "Our Mission",
      text: "We believe in creating products that actually solve problems, not just add clutter to your life."
    },
    image_text: {
      title: "Designed for Real Life",
      text: "We spent 2 years prototyping to ensure every curve and edge serves a purpose.",
      cta: "Read Our Story"
    },
    newsletter: {
      title: "Join the Inner Circle",
      text: "Get exclusive access to new drops and secret sales."
    },
    timeline: [
      { year: "2020", title: "The Idea", text: "It started with a sketch on a napkin." },
      { year: "2021", title: "Prototyping", text: "We tested 50+ iterations to get it right." },
      { year: "2023", title: "Launch", text: "We shared our creation with the world." }
    ],
    scrolling_text: [
      "Free Worldwide Shipping", "30-Day Money Back Guarantee", "Over 10,000 Happy Customers", "Rated 5 Stars"
    ],
    comparison: [
      { feature: "Premium Materials", us: true, them: false },
      { feature: "24/7 Support", us: true, them: false },
      { feature: "Lifetime Warranty", us: true, them: false },
      { feature: "Eco-Friendly", us: true, them: false }
    ],
    multicolumn: [
      { title: "Fast Shipping", text: "We ship within 24 hours of your order." },
      { title: "Secure Payment", text: "Your data is protected by 256-bit encryption." },
      { title: "Expert Support", text: "Our team is here to help you 24/7." }
    ],
    contact: {
      heading: "Get in Touch",
      subheading: "We'd love to hear from you. Our team is always here to help."
    },
    upsell: { heading: "Frequently Bought Together" },
    volume_bundles: { 
      heading: "Stock Up & Save",
      label_buy_1: "Buy 1 (Standard)",
      label_buy_2: "Buy 2 (Save 15%)",
      label_buy_3: "Buy 3 (Save 25%)"
    },
    countdown: { heading: "Limited Time Offer", timer_text: "Offer ends in:" },
    logo_list: { heading: "As Seen In" },
    before_after: { heading: "Real Results", label_before: "Before", label_after: "After" },
    stats: [
      { value: "10,000+", label: "Happy Customers" },
      { value: "4.9/5", label: "Average Rating" },
      { value: "24/7", label: "Support" }
    ],
    visual_showcase: { heading: "Experience the Difference", subheading: "See every detail up close." },
    how_it_works: [
      { title: "Order Online", text: "Choose your favorite options and place your order securely." },
      { title: "We Ship Fast", text: "Your package leaves our warehouse within 24 hours." },
      { title: "Enjoy!", text: "Experience the quality and difference yourself." }
    ],
    trust_badges: { heading: "Shop with Confidence" },
    accordion: [
      { title: "Specifications", content: "High-quality materials designed to last." },
      { title: "Shipping Info", content: "Free worldwide shipping on all orders." },
      { title: "Care Instructions", content: "Wipe clean with a damp cloth." }
    ],
    tabs: [
      { title: "Description", content: "The ultimate solution for your needs." },
      { title: "Shipping", content: "We ship worldwide with tracking." },
      { title: "Returns", content: "30-day money back guarantee." }
    ]
  })

  function asString(v: any, fallback = '') {
    return typeof v === 'string' ? v : fallback
  }

  function asNumber(v: any, fallback: number) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(n)))
  }

  function parseModelJson(text: string) {
    let t = typeof text === 'string' ? text.trim() : ''
    if (!t) throw new Error('Empty JSON from model')
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()

    const start = t.indexOf('{')
    const end = t.lastIndexOf('}')
    if (start >= 0 && end >= 0) t = t.slice(start, end + 1)

    try {
      return JSON.parse(t)
    } catch {
      const repaired = t.replace(/,\s*([}\]])/g, '$1')
      return JSON.parse(repaired)
    }
  }

  function limitStringLengths(value: any, maxLen: number): any {
    if (typeof value === 'string') return value.length > maxLen ? value.slice(0, maxLen) : value
    if (Array.isArray(value)) return value.map((v) => limitStringLengths(v, maxLen))
    if (!value || typeof value !== 'object') return value
    const out: any = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = limitStringLengths(v, maxLen)
    }
    return out
  }

  function deepMerge(base: any, incoming: any): any {
    if (Array.isArray(base)) {
      return Array.isArray(incoming) && incoming.length ? incoming : base
    }
    if (base && typeof base === 'object') {
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base
      const out: any = { ...base }
      for (const [k, v] of Object.entries(incoming)) {
        if (v === undefined || v === null) continue
        out[k] = k in base ? deepMerge((base as any)[k], v) : v
      }
      return out
    }
    return incoming === undefined || incoming === null ? base : incoming
  }

  function normalizeGeneratedContent(productName: string, generated: any, analysis: any) {
    const base = getMockContent(productName) as any
    const merged = deepMerge(base, generated || {}) as any

    merged._strategy = merged._strategy && typeof merged._strategy === 'object' ? merged._strategy : {}
    merged._strategy.target_avatar = asString(merged._strategy.target_avatar, asString(analysis?.ideal_customer, ''))
    merged._strategy.core_pain_point = asString(merged._strategy.core_pain_point, asString((analysis?.top_pains || [])[0], ''))
    merged._strategy.unique_mechanism = asString(merged._strategy.unique_mechanism, asString(analysis?.unique_mechanism, ''))
    merged._strategy.competitor_weakness = asString(
      merged._strategy.competitor_weakness,
      asString((analysis?.primary_objections || [])[0], '')
    )

    merged.hero = merged.hero && typeof merged.hero === 'object' ? merged.hero : {}
    merged.hero.headline = asString(merged.hero.headline, base.hero.headline)
    merged.hero.subheadline = asString(merged.hero.subheadline, base.hero.subheadline)
    merged.hero.cta = asString(merged.hero.cta, base.hero.cta)

    const normalizeCards = (arr: any[], minLen: number, fallbackArr: any[], mapper: (v: any, i: number) => any) => {
      const a = Array.isArray(arr) ? arr : []
      const out = a.map(mapper).filter(Boolean)
      if (out.length >= minLen) return out.slice(0, minLen)
      const fill = (Array.isArray(fallbackArr) ? fallbackArr : []).map(mapper).filter(Boolean)
      return [...out, ...fill].slice(0, minLen)
    }

    merged.slideshow = normalizeCards(
      merged.slideshow,
      2,
      base.slideshow,
      (v: any, i: number) => ({
        heading: asString(v?.heading, base.slideshow[i]?.heading || ''),
        subheading: asString(v?.subheading, base.slideshow[i]?.subheading || ''),
        cta: asString(v?.cta, base.slideshow[i]?.cta || ''),
      })
    )

    merged.video_hero = merged.video_hero && typeof merged.video_hero === 'object' ? merged.video_hero : {}
    merged.video_hero.heading = asString(merged.video_hero.heading, base.video_hero.heading)
    merged.video_hero.subheading = asString(merged.video_hero.subheading, base.video_hero.subheading)
    merged.video_hero.cta = asString(merged.video_hero.cta, base.video_hero.cta)

    merged.features = normalizeCards(
      merged.features,
      3,
      base.features,
      (v: any, i: number) => ({
        title: asString(v?.title, base.features[i]?.title || ''),
        desc: asString(v?.desc, base.features[i]?.desc || ''),
        icon: asString(v?.icon, base.features[i]?.icon || 'shield'),
      })
    )

    merged.problem = merged.problem && typeof merged.problem === 'object' ? merged.problem : {}
    merged.problem.headline = asString(merged.problem.headline, base.problem.headline)
    merged.problem.text = asString(merged.problem.text, base.problem.text)

    merged.solution = merged.solution && typeof merged.solution === 'object' ? merged.solution : {}
    merged.solution.headline = asString(merged.solution.headline, base.solution.headline)
    merged.solution.text = asString(merged.solution.text, base.solution.text)

    merged.testimonials = normalizeCards(
      merged.testimonials,
      3,
      base.testimonials,
      (v: any, i: number) => {
        const name = asString(v?.name, base.testimonials[i]?.name || 'Verified Buyer')
        const text = asString(v?.text, base.testimonials[i]?.text || '')
        const location = asString(v?.location, base.testimonials[i]?.location || 'Verified Buyer')
        const rating = clampInt(asNumber(v?.rating, 5), 1, 5)
        return { name, text, location, rating }
      }
    )

    merged.faq = normalizeCards(
      merged.faq,
      4,
      base.faq,
      (v: any, i: number) => ({
        q: asString(v?.q, base.faq[i]?.q || ''),
        a: asString(v?.a, base.faq[i]?.a || ''),
      })
    )

    merged.guarantee = merged.guarantee && typeof merged.guarantee === 'object' ? merged.guarantee : {}
    merged.guarantee.title = asString(merged.guarantee.title, base.guarantee.title)
    merged.guarantee.text = asString(merged.guarantee.text, base.guarantee.text)
    merged.guarantee.days = clampInt(asNumber(merged.guarantee.days, base.guarantee.days), 7, 90)

    merged.rich_text = merged.rich_text && typeof merged.rich_text === 'object' ? merged.rich_text : {}
    merged.rich_text.title = asString(merged.rich_text.title, base.rich_text.title)
    merged.rich_text.text = asString(merged.rich_text.text, base.rich_text.text)

    merged.image_text = merged.image_text && typeof merged.image_text === 'object' ? merged.image_text : {}
    merged.image_text.title = asString(merged.image_text.title, base.image_text.title)
    merged.image_text.text = asString(merged.image_text.text, base.image_text.text)
    merged.image_text.cta = asString(merged.image_text.cta, base.image_text.cta)

    merged.newsletter = merged.newsletter && typeof merged.newsletter === 'object' ? merged.newsletter : {}
    merged.newsletter.title = asString(merged.newsletter.title, base.newsletter.title)
    merged.newsletter.text = asString(merged.newsletter.text, base.newsletter.text)

    merged.timeline = normalizeCards(
      merged.timeline,
      3,
      base.timeline,
      (v: any, i: number) => ({
        year: asString(v?.year, base.timeline[i]?.year || ''),
        title: asString(v?.title, base.timeline[i]?.title || ''),
        text: asString(v?.text, base.timeline[i]?.text || ''),
      })
    )

    merged.scrolling_text = normalizeCards(
      merged.scrolling_text,
      4,
      base.scrolling_text,
      (v: any, i: number) => asString(v, base.scrolling_text[i] || '')
    )

    merged.comparison = normalizeCards(
      merged.comparison,
      4,
      base.comparison,
      (v: any, i: number) => ({
        feature: asString(v?.feature, base.comparison[i]?.feature || ''),
        us: Boolean(v?.us ?? base.comparison[i]?.us),
        them: Boolean(v?.them ?? base.comparison[i]?.them),
      })
    )

    merged.multicolumn = normalizeCards(
      merged.multicolumn,
      3,
      base.multicolumn,
      (v: any, i: number) => ({
        title: asString(v?.title, base.multicolumn[i]?.title || ''),
        text: asString(v?.text, base.multicolumn[i]?.text || ''),
      })
    )

    merged.contact = merged.contact && typeof merged.contact === 'object' ? merged.contact : {}
    merged.contact.heading = asString(merged.contact.heading, base.contact.heading)
    merged.contact.subheading = asString(merged.contact.subheading, base.contact.subheading)

    merged.upsell = merged.upsell && typeof merged.upsell === 'object' ? merged.upsell : {}
    merged.upsell.heading = asString(merged.upsell.heading, base.upsell.heading)

    merged.volume_bundles = merged.volume_bundles && typeof merged.volume_bundles === 'object' ? merged.volume_bundles : {}
    merged.volume_bundles.heading = asString(merged.volume_bundles.heading, base.volume_bundles.heading)
    merged.volume_bundles.label_buy_1 = asString(merged.volume_bundles.label_buy_1, base.volume_bundles.label_buy_1)
    merged.volume_bundles.label_buy_2 = asString(merged.volume_bundles.label_buy_2, base.volume_bundles.label_buy_2)
    merged.volume_bundles.label_buy_3 = asString(merged.volume_bundles.label_buy_3, base.volume_bundles.label_buy_3)

    merged.countdown = merged.countdown && typeof merged.countdown === 'object' ? merged.countdown : {}
    merged.countdown.heading = asString(merged.countdown.heading, base.countdown.heading)
    merged.countdown.timer_text = asString(merged.countdown.timer_text, base.countdown.timer_text)

    merged.announcement_bar = merged.announcement_bar && typeof merged.announcement_bar === 'object' ? merged.announcement_bar : {}
    merged.announcement_bar.text = asString(
      merged.announcement_bar.text,
      asString(merged.countdown.heading, 'Free Shipping Worldwide')
    )

    merged.logo_list = merged.logo_list && typeof merged.logo_list === 'object' ? merged.logo_list : {}
    merged.logo_list.heading = asString(merged.logo_list.heading, base.logo_list.heading)
    merged.logo_list.logos = normalizeCards(
      merged.logo_list.logos,
      6,
      ['Forbes', 'TechCrunch', 'GQ', 'Vogue', 'Wired', 'Inc.'],
      (v: any, i: number) => asString(v, ['Forbes', 'TechCrunch', 'GQ', 'Vogue', 'Wired', 'Inc.'][i] || '')
    )

    merged.before_after = merged.before_after && typeof merged.before_after === 'object' ? merged.before_after : {}
    merged.before_after.heading = asString(merged.before_after.heading, base.before_after.heading)
    merged.before_after.label_before = asString(merged.before_after.label_before, base.before_after.label_before)
    merged.before_after.label_after = asString(merged.before_after.label_after, base.before_after.label_after)

    merged.stats = normalizeCards(
      merged.stats,
      3,
      base.stats,
      (v: any, i: number) => ({
        value: asString(v?.value, base.stats[i]?.value || ''),
        label: asString(v?.label, base.stats[i]?.label || ''),
      })
    )

    merged.visual_showcase = merged.visual_showcase && typeof merged.visual_showcase === 'object' ? merged.visual_showcase : {}
    merged.visual_showcase.heading = asString(merged.visual_showcase.heading, base.visual_showcase.heading)
    merged.visual_showcase.subheading = asString(merged.visual_showcase.subheading, base.visual_showcase.subheading)
    merged.visual_showcase.cta = asString(merged.visual_showcase.cta, merged.hero.cta)

    merged.how_it_works = normalizeCards(
      merged.how_it_works,
      3,
      base.how_it_works,
      (v: any, i: number) => ({
        title: asString(v?.title, base.how_it_works[i]?.title || ''),
        text: asString(v?.text, base.how_it_works[i]?.text || ''),
      })
    )

    merged.trust_badges = merged.trust_badges && typeof merged.trust_badges === 'object' ? merged.trust_badges : {}
    merged.trust_badges.heading = asString(merged.trust_badges.heading, base.trust_badges.heading)
    merged.trust_badges.badges = normalizeCards(
      merged.trust_badges.badges,
      4,
      [
        { title: 'Free Shipping', desc: 'On all orders' },
        { title: '30-Day Returns', desc: 'Hassle-free returns' },
        { title: 'Secure Checkout', desc: 'Encrypted payments' },
        { title: 'Support', desc: 'Help when you need it' },
      ],
      (v: any, i: number) => ({
        title: asString(v?.title, ['Free Shipping', '30-Day Returns', 'Secure Checkout', 'Support'][i] || ''),
        desc: asString(v?.desc, ['On all orders', 'Hassle-free returns', 'Encrypted payments', 'Help when you need it'][i] || ''),
      })
    )

    merged.how_it_works_section = merged.how_it_works_section && typeof merged.how_it_works_section === 'object' ? merged.how_it_works_section : {}
    merged.how_it_works_section.heading = asString(merged.how_it_works_section.heading, 'How It Works')
    merged.how_it_works_section.subheading = asString(merged.how_it_works_section.subheading, 'Simple steps. Fast results.')
    merged.how_it_works_section.steps = normalizeCards(
      merged.how_it_works_section.steps,
      3,
      merged.how_it_works,
      (v: any, i: number) => ({
        title: asString(v?.title, merged.how_it_works?.[i]?.title || ''),
        text: asString(v?.text, merged.how_it_works?.[i]?.text || ''),
      })
    )

    merged.accordion = normalizeCards(
      merged.accordion,
      3,
      base.accordion,
      (v: any, i: number) => ({
        title: asString(v?.title, base.accordion[i]?.title || ''),
        content: asString(v?.content, base.accordion[i]?.content || ''),
      })
    )

    merged.tabs = normalizeCards(
      merged.tabs,
      3,
      base.tabs,
      (v: any, i: number) => ({
        title: asString(v?.title, base.tabs[i]?.title || ''),
        content: asString(v?.content, base.tabs[i]?.content || ''),
      })
    )

    merged.collection_page = merged.collection_page && typeof merged.collection_page === 'object' ? merged.collection_page : {}
    merged.collection_page.headline = asString(merged.collection_page.headline, 'Shop Our Collection')
    merged.collection_page.subheadline = asString(merged.collection_page.subheadline, 'Browse our best picks for your everyday.')
    merged.collection_page.filter_help = asString(merged.collection_page.filter_help, 'Tip: choose based on your needs and daily use.')
    merged.collection_page.why_buy_heading = asString(merged.collection_page.why_buy_heading, 'Why buy from us')
    merged.collection_page.why_buy_points = normalizeCards(
      merged.collection_page.why_buy_points,
      3,
      ['Fast support', 'Quality checked', 'Easy returns'],
      (v: any, i: number) => asString(v, ['Fast support', 'Quality checked', 'Easy returns'][i] || '')
    )

    merged.cart_drawer = merged.cart_drawer && typeof merged.cart_drawer === 'object' ? merged.cart_drawer : {}
    merged.cart_drawer.headline = asString(merged.cart_drawer.headline, 'Your Cart')
    merged.cart_drawer.free_shipping_before = asString(merged.cart_drawer.free_shipping_before, 'You are {amount} away from Free Shipping!')
    merged.cart_drawer.free_shipping_after = asString(merged.cart_drawer.free_shipping_after, "You’ve unlocked Free Shipping!")
    merged.cart_drawer.secure_line = asString(merged.cart_drawer.secure_line, 'Secure checkout — SSL encrypted')
    merged.cart_drawer.reassurance_lines = normalizeCards(
      merged.cart_drawer.reassurance_lines,
      3,
      ['30-day returns', 'Fast support', 'Tracked delivery'],
      (v: any, i: number) => asString(v, ['30-day returns', 'Fast support', 'Tracked delivery'][i] || '')
    )
    merged.cart_drawer.checkout_cta = asString(merged.cart_drawer.checkout_cta, 'Checkout Now')

    merged.cart_page = merged.cart_page && typeof merged.cart_page === 'object' ? merged.cart_page : {}
    merged.cart_page.headline = asString(merged.cart_page.headline, 'Your Cart')
    merged.cart_page.subheadline = asString(merged.cart_page.subheadline, 'Review your items and check out securely.')
    merged.cart_page.order_summary_heading = asString(merged.cart_page.order_summary_heading, 'Order Summary')
    merged.cart_page.checkout_cta = asString(merged.cart_page.checkout_cta, merged.cart_drawer.checkout_cta)
    merged.cart_page.empty_headline = asString(merged.cart_page.empty_headline, 'Your cart is empty')
    merged.cart_page.empty_subheadline = asString(merged.cart_page.empty_subheadline, "Looks like you haven't added anything yet.")

    merged.pages = merged.pages && typeof merged.pages === 'object' ? merged.pages : {}
    merged.pages.about = merged.pages.about && typeof merged.pages.about === 'object' ? merged.pages.about : {}
    merged.pages.about.hero_heading = asString(merged.pages.about.hero_heading, 'Our Story')
    merged.pages.about.hero_subheading = asString(merged.pages.about.hero_subheading, 'Built around quality and real results.')
    merged.pages.about.mission_title = asString(merged.pages.about.mission_title, 'Mission')
    merged.pages.about.mission_text = asString(merged.pages.about.mission_text, 'We exist to make products that feel better to use every day.')
    merged.pages.about.craftsmanship_heading = asString(merged.pages.about.craftsmanship_heading, 'Craftsmanship')
    merged.pages.about.craftsmanship_text = asString(merged.pages.about.craftsmanship_text, 'We focus on the details that matter: comfort, durability, and finish.')
    merged.pages.about.process_heading = asString(merged.pages.about.process_heading, 'Our Process')
    merged.pages.about.process_subheading = asString(merged.pages.about.process_subheading, 'Thoughtful design. Quality checks. Fast dispatch.')

    merged.pages.contact = merged.pages.contact && typeof merged.pages.contact === 'object' ? merged.pages.contact : {}
    merged.pages.contact.faq_heading = asString(merged.pages.contact.faq_heading, 'Common Questions')
    merged.pages.contact.faq_items = normalizeCards(
      merged.pages.contact.faq_items,
      2,
      [
        { q: 'Shipping time?', a: 'Most orders ship fast with tracking. Exact time depends on location.' },
        { q: 'Returns?', a: '30-day returns. If it’s not right for you, we’ll make it right.' },
      ],
      (v: any, i: number) => ({
        q: asString(v?.q, i === 0 ? 'Shipping time?' : 'Returns?'),
        a: asString(
          v?.a,
          i === 0
            ? 'Most orders ship fast with tracking. Exact time depends on location.'
            : '30-day returns. If it’s not right for you, we’ll make it right.'
        ),
      })
    )

    merged.pages.faq = merged.pages.faq && typeof merged.pages.faq === 'object' ? merged.pages.faq : {}
    merged.pages.faq.title = asString(merged.pages.faq.title, 'Help Center')
    merged.pages.faq.intro = asString(merged.pages.faq.intro, 'Find the answers you need below.')
    merged.pages.faq.items = normalizeCards(
      merged.pages.faq.items,
      3,
      [
        { q: 'How do I track my order?', a: 'You’ll get a tracking link by email once your order ships.' },
        { q: 'Can I change my order?', a: 'If your order hasn’t shipped yet, contact support and we’ll do our best.' },
        { q: 'Do you ship internationally?', a: 'Yes. Delivery times vary by location.' },
      ],
      (v: any, i: number) => ({
        q: asString(v?.q, ['How do I track my order?', 'Can I change my order?', 'Do you ship internationally?'][i] || ''),
        a: asString(
          v?.a,
          [
            'You’ll get a tracking link by email once your order ships.',
            'If your order hasn’t shipped yet, contact support and we’ll do our best.',
            'Yes. Delivery times vary by location.',
          ][i] || ''
        ),
      })
    )

    merged.policies = merged.policies && typeof merged.policies === 'object' ? merged.policies : {}
    merged.policies.shipping = merged.policies.shipping && typeof merged.policies.shipping === 'object' ? merged.policies.shipping : {}
    merged.policies.shipping.title = asString(merged.policies.shipping.title, 'Shipping Policy')
    merged.policies.shipping.bullets = normalizeCards(
      merged.policies.shipping.bullets,
      3,
      ['Fast processing', 'Tracked delivery', 'Support if anything goes wrong'],
      (v: any, i: number) => asString(v, ['Fast processing', 'Tracked delivery', 'Support if anything goes wrong'][i] || '')
    )
    merged.policies.returns = merged.policies.returns && typeof merged.policies.returns === 'object' ? merged.policies.returns : {}
    merged.policies.returns.title = asString(merged.policies.returns.title, 'Returns & Refunds')
    merged.policies.returns.bullets = normalizeCards(
      merged.policies.returns.bullets,
      3,
      ['30-day returns', 'Simple process', 'Fast help from support'],
      (v: any, i: number) => asString(v, ['30-day returns', 'Simple process', 'Fast help from support'][i] || '')
    )

    merged.seo = merged.seo && typeof merged.seo === 'object' ? merged.seo : {}
    const normalizeSeo = (obj: any, fallbackTitle: string, fallbackDesc: string) => ({
      title: asString(obj?.title, fallbackTitle),
      description: asString(obj?.description, fallbackDesc),
    })
    merged.seo.homepage = normalizeSeo(merged.seo.homepage, `${productName} | Official Store`, 'Premium quality. Fast shipping. Secure checkout.')
    merged.seo.product = normalizeSeo(merged.seo.product, `${productName} | Limited Offer`, 'Shop the details, reviews, and guarantee. Order today.')
    merged.seo.collection = normalizeSeo(merged.seo.collection, `Shop ${productName} Collection`, 'Browse our best sellers and newest arrivals.')
    merged.seo.og = normalizeSeo(merged.seo.og, `${productName}`, 'A premium product built for daily life.')

    return merged
  }

  function hashString(input: string) {
    let h = 2166136261
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  function guessCategory(productName: string) {
    const n = productName.toLowerCase()
    if (/(mat|yoga|gym|fitness|trainer|massage|resistance)/.test(n)) return 'fitness'
    if (/(lamp|light|led|projector|neon)/.test(n)) return 'home lighting'
    if (/(watch|earbud|headphone|speaker|camera|drone|gadget)/.test(n)) return 'electronics'
    if (/(skincare|serum|cream|mask|hair|shampoo|beauty)/.test(n)) return 'beauty'
    if (/(pet|cat|dog|leash|collar)/.test(n)) return 'pet'
    if (/(baby|toddler|stroller|diaper)/.test(n)) return 'baby'
    if (/(kitchen|knife|pan|cook|bottle|cup|mug)/.test(n)) return 'kitchen'
    return 'everyday'
  }

  function formatPrice(n?: number) {
    if (!n || Number.isNaN(n) || n <= 0) return ''
    return `$${n.toFixed(2)}`
  }

  function pick<T>(arr: T[], seed: number, offset: number) {
    return arr[(seed + offset) % arr.length]
  }

  function getFallbackContent(productName: string) {
    const base = getMockContent(productName) as any
    const seed = hashString([productName, productUrl, String(price ?? ''), String(originalPrice ?? ''), audience, description].join('|'))
    const category = guessCategory(productName)
    const priceText = formatPrice(price)
    const originalText = formatPrice(originalPrice)

    const promisesByCategory: Record<string, string[]> = {
      fitness: ['Stronger. Faster. More consistent.', 'A routine you actually keep.', 'Less friction. More progress.'],
      electronics: ['Sharper performance, less hassle.', 'Smart features. Simple use.', 'Built to work. Not to glitch.'],
      'home lighting': ['Instant vibe, zero effort.', 'Make the room feel premium.', 'Light that changes the mood.'],
      beauty: ['Visible results, simpler routine.', 'Comfort first. Confidence next.', 'Gentle. Effective. Daily.'],
      pet: ['Happier pets. Calmer days.', 'Less mess, more moments.', 'Made for real pet life.'],
      baby: ['Safer days, easier nights.', 'Designed for busy parents.', 'Comfort that travels.'],
      kitchen: ['Cook quicker. Clean easier.', 'Make every meal smoother.', 'Small upgrade. Big payoff.'],
      everyday: ['Make the day easier.', 'A better version of the basic.', 'Simple upgrade, real impact.'],
    }

    const promise = pick(promisesByCategory[category] || promisesByCategory.everyday, seed, 1)
    const mechanism = pick(
      [
        'Precision-fit design that removes the usual friction.',
        'A smarter build that holds up under daily use.',
        'Details-first engineering where it actually matters.',
        'A simple system: set it up once, enjoy it every day.',
      ],
      seed,
      3
    )

    base._strategy = {
      target_avatar: `${audience}. People shopping for ${category} upgrades that feel premium.`,
      core_pain_point: `They keep buying products that look good online but feel disappointing in real life.`,
      unique_mechanism: mechanism,
      competitor_weakness: `Cheap builds, generic claims, and inconsistent quality control.`,
    }

    base.hero.headline = pick([promise, `A better ${productName}.`, `Meet your new favorite ${productName}.`], seed, 4)
    base.hero.subheadline = `Designed for ${audience}. ${mechanism} Built to feel premium from day one.`
    base.hero.cta = priceText ? `Get it for ${priceText}` : pick(['Shop the Drop', 'Claim Today’s Deal', 'Get Yours Now'], seed, 5)

    base.problem.headline = pick(
      [`Most ${category} products disappoint.`, 'Cheap alternatives look good—until they don’t.', 'Tired of buying the same thing twice?', 'When “good enough” isn’t good enough.'],
      seed,
      6
    )
    base.problem.text = pick(
      [
        `You order it. You’re excited. Then it arrives and feels flimsy, awkward, or just not like the photos. That’s the real cost: wasted time, wasted money, and the frustration of starting over.`,
        `The market is full of shortcuts—thin materials, weak joints, poor finishing. It works for a week, then it starts to annoy you. And you stop using it.`,
        `Most brands optimize for clicks, not outcomes. They rely on generic claims instead of making the experience actually better.`,
      ],
      seed,
      7
    )

    base.solution.headline = `Why ${productName} works better`
    base.solution.text = `${productName} is built around one idea: make the experience feel effortless. ${mechanism} ${
      priceText && originalText ? `And right now, it’s ${priceText} (was ${originalText}).` : ''
    }`

    base.features = (base.features || []).map((f: any, i: number) => ({
      ...f,
      title: pick(['Feels better to use', 'Built for daily life', 'Fast setup, zero fuss', 'Looks premium on day one'], seed, 10 + i),
      desc: pick(
        [
          `Designed around how you actually use ${productName}. Less awkwardness. More flow.`,
          `The parts that usually fail are reinforced. The finish stays clean and premium.`,
          `From box to first use in minutes. No complicated steps.`,
          `Clean lines, modern feel, and details that make it look expensive.`,
        ],
        seed,
        20 + i
      ),
      icon: pick(['shield', 'zap', 'check', 'star', 'lock', 'sparkles', 'heart', 'truck'], seed, 30 + i),
    }))

    const shippingLine = pick(['Orders ship fast with tracking.', 'Quick dispatch + tracked delivery.', 'Fast processing so you’re not waiting weeks.'], seed, 60)
    base.faq = [
      { q: `Is ${productName} easy to use?`, a: `Yes—it's designed to feel intuitive from the first use. No complicated setup.` },
      { q: 'How fast is shipping?', a: shippingLine },
      { q: 'What if I don’t like it?', a: `Try it risk-free for 30 days. Return it for a refund.` },
      { q: 'Is this a good gift?', a: `Absolutely. It’s practical, premium-looking, and something people actually use.` },
    ]
    base.tabs = [
      { title: 'Description', content: `${productName} is a premium upgrade built for daily use. ${mechanism}` },
      { title: 'Shipping', content: shippingLine },
      { title: 'Returns', content: `30-day returns. Simple process. No stress.` },
    ]

    base.countdown.heading = priceText ? `Limited-time: ${priceText}` : base.countdown.heading
    base.countdown.timer_text = 'Deal ends in:'
    return base
  }

  const facts = productFacts || {}
  const title = typeof facts.title === 'string' ? facts.title.trim() : ''
  const highlightsCount = Array.isArray(facts.highlights) ? facts.highlights.length : 0
  const specsCount = facts.specs && typeof facts.specs === 'object' ? Object.keys(facts.specs).length : 0
  const longDescLen = typeof facts.longDescription === 'string' ? facts.longDescription.trim().length : 0
  const metaDescLen = typeof facts.metaDescription === 'string' ? facts.metaDescription.trim().length : 0
  const descLen = description.trim().length

  const score =
    (title ? 1 : 0) +
    (highlightsCount >= 3 ? 2 : highlightsCount >= 1 ? 1 : 0) +
    (specsCount >= 3 ? 2 : specsCount >= 1 ? 1 : 0) +
    (longDescLen >= 200 ? 2 : longDescLen >= 80 ? 1 : 0) +
    (metaDescLen >= 80 ? 1 : 0) +
    (descLen >= 200 ? 1 : 0)

  const factsWeak = !title || score < 4
  const effectiveFacts = {
    ...facts,
    title: title || name,
    metaDescription: (typeof facts.metaDescription === 'string' && facts.metaDescription.trim()) ? facts.metaDescription : undefined,
    longDescription:
      (typeof facts.longDescription === 'string' && facts.longDescription.trim())
        ? facts.longDescription
        : description.trim()
        ? description.trim().slice(0, 1400)
        : undefined,
  } as typeof facts

  function buildFinalResponse(payload: any, metaOverrides?: Record<string, any>) {
    const meta = {
      _meta: {
        source: metaOverrides?.source || 'openai',
        analysis_used: !!metaOverrides?.analysis_used,
        facts_weak: factsWeak,
        facts_score: score,
        facts_counts: {
          highlights: highlightsCount,
          specs: specsCount,
          longDescriptionLen: longDescLen,
          metaDescriptionLen: metaDescLen,
        },
        ...(metaOverrides || {}),
      },
    }

    const limited800 = limitStringLengths(payload, 800)
    let responsePayload: any = { ...limited800, ...meta }
    let json = JSON.stringify(responsePayload)
    if (Buffer.byteLength(json, 'utf8') > 3_800_000) {
      const limited400 = limitStringLengths(payload, 400)
      responsePayload = { ...limited400, ...meta }
      json = JSON.stringify(responsePayload)
    }

    return new NextResponse(json, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  function buildFallbackResponse(reason: string, analysis?: any) {
    const fallback = normalizeGeneratedContent(name, getFallbackContent(name), analysis || null)
    return buildFinalResponse(fallback, {
      source: 'fallback',
      analysis_used: !!analysis,
      fallback_reason: reason.slice(0, 120),
    })
  }

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackResponse('missing_openai_api_key')
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Math.max(20_000, Math.min(55_000, timeLeft())),
    })
    const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`

    async function runJson(
      model: string,
      messages: { role: 'system' | 'user'; content: string }[],
      opts?: { maxTokens?: number; temperature?: number }
    ) {
      const maxWait = Math.max(8_000, Math.min(ANALYSIS_TIMEOUT_MS, timeLeft() - 5_000))
      if (maxWait <= 0) throw new Error('route_budget_exceeded_before_analysis')
      const resp = await withTimeout(
        openai.chat.completions.create({
          model,
          temperature: typeof opts?.temperature === 'number' ? opts.temperature : 0.5,
          presence_penalty: 0.2,
          frequency_penalty: 0.1,
          max_tokens: typeof opts?.maxTokens === 'number' ? opts.maxTokens : 700,
          messages,
          response_format: { type: 'json_object' as const },
        }),
        maxWait,
        'analysis'
      )
      const content = resp.choices[0]?.message?.content
      if (!content) throw new Error('No content from OpenAI')
      const finish = resp.choices[0]?.finish_reason
      try {
        return parseModelJson(content)
      } catch (e: any) {
        if (finish === 'length') throw new Error('openai_json_truncated')
        throw e
      }
    }

    const factsBlock = `Product Name: ${name}
Product URL: ${productUrl || 'N/A'}
Price: ${typeof price === 'number' ? formatPrice(price) : 'N/A'}
Original Price: ${typeof originalPrice === 'number' ? formatPrice(originalPrice) : 'N/A'}
Target Audience (user-provided): ${audience}
Context/Description (user-provided): ${description}
Uniqueness Nonce: ${nonce}

Scraped Product Facts (do not invent beyond these; use them to be specific):
Title: ${productFacts?.title || 'N/A'}
Brand: ${productFacts?.brand || 'N/A'}
SKU: ${productFacts?.sku || 'N/A'}
Meta Description: ${productFacts?.metaDescription || 'N/A'}
Currency: ${productFacts?.priceCurrency || 'N/A'}
Availability: ${productFacts?.availability || 'N/A'}
Rating: ${typeof productFacts?.ratingValue === 'number' ? String(productFacts.ratingValue) : 'N/A'} (${
      typeof productFacts?.reviewCount === 'number' ? String(productFacts.reviewCount) : 'N/A'
    } reviews)
Highlights:
${(productFacts?.highlights || []).slice(0, 10).map((h) => `- ${h}`).join('\n') || 'N/A'}
Specs:
${
      productFacts?.specs
        ? Object.entries(productFacts.specs)
            .slice(0, 12)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n')
        : 'N/A'
}
Long Description (if present):
${(productFacts?.longDescription || '').slice(0, 1400) || 'N/A'}`

    let productAnalysis: any = null
    const shouldRunAnalysis = !factsWeak && timeLeft() > 28_000
    if (shouldRunAnalysis) {
      try {
        productAnalysis = await runJson('gpt-4o-mini', [
          {
            role: 'system',
            content:
              'You are an elite ecommerce product researcher. Your job is to analyze ONLY the provided facts and produce a structured conversion strategy. Never invent materials, measurements, certifications, or features.',
          },
          {
            role: 'user',
            content: `${factsBlock}

Return JSON only with this shape:
{
  "product_summary": "1-2 sentences describing what it is (no hype)",
  "likely_category": "short category guess",
  "ideal_customer": "specific avatar",
  "top_pains": ["3-6 pains the customer feels BEFORE buying (plausible, not factual claims)"],
  "dream_outcomes": ["3-6 outcomes they want AFTER buying (plausible)"],
  "primary_objections": ["3-6 objections (shipping, quality, fit, ease, etc.)"],
  "unique_mechanism": "Describe the mechanism USING ONLY highlights/specs (no invention). If unknown, say 'unknown'.",
  "proof_points": ["3-6 proof points you can honestly claim from provided facts (e.g., spec, included feature, rating if present)"],
  "keywords_to_use": ["8-16 words/phrases grounded in facts (from highlights/specs/title)"],
  "section_specific_angles": {
    "hero": "angle for hero",
    "features": "angle for features",
    "problem_solution": "angle for problem/solution",
    "faq": "angle for FAQ",
    "tabs": "angle for tabs"
  }
}`,
          },
        ], { maxTokens: 650, temperature: 0.35 })
      } catch {
        productAnalysis = null
      }
    }

    const userPrompt = `Product Name: ${name}
          Product URL: ${productUrl || 'N/A'}
          Price: ${typeof price === 'number' ? formatPrice(price) : 'N/A'}
          Original Price: ${typeof originalPrice === 'number' ? formatPrice(originalPrice) : 'N/A'}
          Target Audience: ${audience}
          Context/Description: ${description}
          Uniqueness Nonce: ${nonce}

          Scraped Product Facts (do not invent beyond these; use them to be specific):
          Title: ${effectiveFacts?.title || 'N/A'}
          Brand: ${effectiveFacts?.brand || 'N/A'}
          SKU: ${effectiveFacts?.sku || 'N/A'}
          Meta Description: ${effectiveFacts?.metaDescription || 'N/A'}
          Currency: ${effectiveFacts?.priceCurrency || 'N/A'}
          Availability: ${effectiveFacts?.availability || 'N/A'}
          Rating: ${
            typeof effectiveFacts?.ratingValue === 'number' ? String(effectiveFacts.ratingValue) : 'N/A'
          } (${typeof effectiveFacts?.reviewCount === 'number' ? String(effectiveFacts.reviewCount) : 'N/A'} reviews)
          Highlights:
          ${(effectiveFacts?.highlights || []).slice(0, 10).map((h) => `- ${h}`).join('\n') || 'N/A'}
          Specs:
          ${
            effectiveFacts?.specs
              ? Object.entries(effectiveFacts.specs).slice(0, 12).map(([k, v]) => `- ${k}: ${v}`).join('\n')
              : 'N/A'
          }
          Long Description (if present):
          ${(effectiveFacts?.longDescription || '').slice(0, 1400) || 'N/A'}

          Product Analysis (derived from facts; use this to write more targeted copy):
          ${productAnalysis ? JSON.stringify(productAnalysis) : 'N/A'}
          
          Hard requirements:
          - Every section must be specific to this product. Avoid generic placeholder copy.
          - If Highlights/Specs are present, use them heavily and reference them.
          - If Highlights/Specs are missing or thin, do NOT invent specifications. Instead, write conversion-focused copy using: the product name, category inference, common use cases, common objections, risk reversal, and clear CTAs.
          - Do not reuse the same sentences across sections.
          - Keep copy tight to avoid huge outputs:
            - Headline/title fields: <= 70 chars
            - Subheadlines/paragraph fields: <= 220 chars
            - Bullet items: <= 120 chars
            - Policies bullets: exactly 3 bullets, <= 140 chars each
            - FAQ answers: <= 220 chars
            - Testimonials text: <= 240 chars
          
          Generate content for the following sections. Ensure every word earns its place.

          JSON Structure:
          {
            "_strategy": {
              "target_avatar": "Specific description of the ideal customer",
              "core_pain_point": "The deep, emotional problem they face",
              "unique_mechanism": "The specific feature/tech that solves it",
              "competitor_weakness": "What cheap alternatives get wrong"
            },
            "hero": {
              "headline": "5-7 words. The Big Promise. Use power words.",
              "subheadline": "2 sentences. The 'How' and the 'Why'. Address the primary objection immediately.",
              "cta": "Action-oriented (e.g., 'Claim Offer', 'Shop Now - 50% Off')."
            },
            "slideshow": [
              { "heading": "Brand Statement or Collection Highlight", "subheading": "Evocative, lifestyle-focused copy.", "cta": "Explore Collection" },
              { "heading": "Secondary Value Prop (e.g., Engineering)", "subheading": "Focus on quality and durability.", "cta": "View Details" }
            ],
            "video_hero": {
              "heading": "Cinematic & immersive title.",
              "subheading": "Invitation to witness the product in action.",
              "cta": "Watch the Film"
            },
            "features": [
              { "title": "Benefit 1 (The Outcome)", "desc": "Explain the feature that delivers this outcome. Be specific.", "icon": "shield" },
              { "title": "Benefit 2 (The Experience)", "desc": "How it feels to use. Sensory details.", "icon": "zap" },
              { "title": "Benefit 3 (The Assurance)", "desc": "Durability, safety, or speed.", "icon": "check" }
            ],
            "problem": {
              "headline": "Hook the reader with their #1 complaint about current solutions.",
              "text": "Agitate the pain. Describe the frustration of using inferior products. Make them nod in agreement."
            },
            "solution": {
              "headline": "Introduce ${name} as the only logical solution.",
              "text": "Explain the 'Mechanism of Action'. Why is this different? Use words like 'Precision-engineered', 'Proprietary', 'Verified'."
            },
            "testimonials": [
              { "name": "Full Name", "text": "A specific story of transformation. Mention a skepticism they had and how the product resolved it.", "location": "City, Country", "rating": 5 },
              { "name": "Full Name", "text": "Focus on shipping speed and customer service. Builds trust in the business.", "location": "City, Country", "rating": 5 },
              { "name": "Full Name", "text": "Focus on product quality and durability vs. competitors.", "location": "City, Country", "rating": 5 }
            ],
            "faq": [
              { "q": "High-intent objection 1 (e.g., Will this work for me?)", "a": "Confident, 'yes, because...' answer." },
              { "q": "High-intent objection 2 (e.g., Shipping times?)", "a": "Specifics about processing and delivery speed." },
              { "q": "High-intent objection 3 (e.g., Warranty/Returns?)", "a": "Restate the risk-free guarantee." },
              { "q": "Technical/Usage question?", "a": "Simple, step-by-step clarification." }
            ],
            "guarantee": {
              "title": "Ironclad 30-Day Risk-Free Guarantee",
              "text": "We are so confident in our quality that if you are not 100% satisfied, simply return it for a full refund. We'll even cover the return shipping.",
              "days": 30
            },
            "rich_text": {
              "title": "Our Philosophy",
              "text": "Why we exist. Our commitment to quality/sustainability/innovation."
            },
            "image_text": {
              "title": "Lifestyle/Use Case Highlight",
              "text": "Paint a picture of life with the product.",
              "cta": "Read the Full Story"
            },
            "newsletter": {
              "title": "Join the Inner Circle",
              "text": "Unlock early access to new drops and an instant 10% discount code."
            },
            "timeline": [
              { "year": "Year 1", "title": "Inception", "text": "Identifying the gap in the market." },
              { "year": "Year 2", "title": "R&D", "text": "Rigorous testing and prototyping." },
              { "year": "Year 3", "title": "Global Launch", "text": "Delivering excellence worldwide." }
            ],
            "scrolling_text": [
              "Free Expedited Shipping", "30-Day Money Back Guarantee", "24/7 Priority Support", "Over 50,000 Satisfied Customers"
            ],
            "comparison": [
              { "feature": "Core Benefit 1", "us": true, "them": false },
              { "feature": "Core Benefit 2", "us": true, "them": false },
              { "feature": "Core Benefit 3", "us": true, "them": false },
              { "feature": "Core Benefit 4", "us": true, "them": false }
            ],
            "multicolumn": [
              { "title": "Benefit A", "text": "Detail A" },
              { "title": "Benefit B", "text": "Detail B" },
              { "title": "Benefit C", "text": "Detail C" }
            ],
            "contact": {
              "heading": "We're Here to Help",
              "subheading": "Our expert support team typically replies within 2 hours."
            },
            "upsell": { "heading": "Frequently Bought Together" },
            "volume_bundles": { 
              "heading": "Stock Up & Save",
              "label_buy_1": "Single Pack",
              "label_buy_2": "Double Pack (Save 15%)",
              "label_buy_3": "Family Pack (Save 25%)"
            },
            "countdown": { "heading": "Limited Time Launch Offer", "timer_text": "Offer expires in:" },
            "announcement_bar": { "text": "Free Shipping + Today Only Offer" },
            "logo_list": { "heading": "Featured In", "logos": ["Forbes","GQ","Vogue","Wired","TechCrunch","Inc."] },
            "before_after": { "heading": "Real Results", "label_before": "Before", "label_after": "After" },
            "stats": [
              { "value": "Number", "label": "Metric" },
              { "value": "Number", "label": "Metric" },
              { "value": "Number", "label": "Metric" }
            ],
            "visual_showcase": { "heading": "Precision Engineering", "subheading": "Every detail matters.", "cta": "Get Yours Today" },
            "how_it_works_section": {
              "heading": "How It Works",
              "subheading": "Simple steps. Fast results.",
              "steps": [
                { "title": "Step 1", "text": "Action" },
                { "title": "Step 2", "text": "Action" },
                { "title": "Step 3", "text": "Result" }
              ]
            },
            "how_it_works": [
              { "title": "Step 1", "text": "Action" },
              { "title": "Step 2", "text": "Action" },
              { "title": "Step 3", "text": "Result" }
            ],
            "trust_badges": {
              "heading": "Shop with Confidence",
              "badges": [
                { "title": "Free Shipping", "desc": "On all orders" },
                { "title": "30-Day Returns", "desc": "No stress returns" },
                { "title": "Secure Checkout", "desc": "Encrypted payments" },
                { "title": "Support", "desc": "Help when you need it" }
              ]
            },
            "accordion": [
              { "title": "Detail 1", "content": "Info" },
              { "title": "Detail 2", "content": "Info" },
              { "title": "Detail 3", "content": "Info" }
            ],
            "tabs": [
              { "title": "Description", "content": "Info" },
              { "title": "Shipping", "content": "Info" },
              { "title": "Returns", "content": "Info" }
            ],
            "collection_page": {
              "headline": "Shop Our Collection",
              "subheadline": "Short positioning line that matches the product category and audience.",
              "filter_help": "One sentence that helps shoppers choose (e.g., what to look for).",
              "why_buy_heading": "Why buy from us",
              "why_buy_points": ["Point 1","Point 2","Point 3"]
            },
            "cart_drawer": {
              "headline": "Your Cart",
              "free_shipping_before": "You are {amount} away from Free Shipping!",
              "free_shipping_after": "You’ve unlocked Free Shipping!",
              "secure_line": "Secure checkout — SSL encrypted",
              "reassurance_lines": ["30-day returns","Fast support","Tracked delivery"],
              "checkout_cta": "Checkout Now"
            },
            "cart_page": {
              "headline": "Your Cart",
              "subheadline": "Short line that reduces anxiety and increases conversion.",
              "order_summary_heading": "Order Summary",
              "checkout_cta": "Checkout Now",
              "empty_headline": "Your cart is empty",
              "empty_subheadline": "A friendly line that pushes them back to shopping."
            },
            "pages": {
              "about": {
                "hero_heading": "Our Story",
                "hero_subheading": "Short brand origin line tied to the product category.",
                "mission_title": "Mission",
                "mission_text": "Short mission statement.",
                "craftsmanship_heading": "Craftsmanship",
                "craftsmanship_text": "Quality/process positioning.",
                "process_heading": "Our Process",
                "process_subheading": "How we deliver quality."
              },
              "contact": {
                "faq_heading": "Common Questions",
                "faq_items": [
                  { "q": "Shipping time?", "a": "Answer." },
                  { "q": "Returns?", "a": "Answer." }
                ]
              },
              "faq": {
                "title": "Help Center",
                "intro": "Short intro line.",
                "items": [
                  { "q": "Question?", "a": "Answer." },
                  { "q": "Question?", "a": "Answer." },
                  { "q": "Question?", "a": "Answer." }
                ]
              }
            },
            "policies": {
              "shipping": { "title": "Shipping Policy", "bullets": ["Bullet 1","Bullet 2","Bullet 3"] },
              "returns": { "title": "Returns & Refunds", "bullets": ["Bullet 1","Bullet 2","Bullet 3"] }
            },
            "seo": {
              "homepage": { "title": "Homepage SEO Title", "description": "Homepage meta description." },
              "product": { "title": "Product SEO Title", "description": "Product meta description." },
              "collection": { "title": "Collection SEO Title", "description": "Collection meta description." },
              "og": { "title": "OpenGraph Title", "description": "OpenGraph description." }
            }
          }`

    async function run(model: string, opts?: { maxTokens?: number; temperature?: number }) {
      const maxWait = Math.max(10_000, Math.min(CONTENT_TIMEOUT_MS, timeLeft() - 5_000))
      if (maxWait <= 0) throw new Error('route_budget_exceeded_before_content')
      return withTimeout(
        openai.chat.completions.create({
          model,
          temperature: typeof opts?.temperature === 'number' ? opts.temperature : 0.75,
          presence_penalty: 0.35,
          frequency_penalty: 0.15,
          max_tokens: typeof opts?.maxTokens === 'number' ? opts.maxTokens : 2200,
          messages: [
            { 
              role: 'system', 
              content: `You are an elite Direct Response Copywriter and Brand Strategist for 7-figure e-commerce brands. You specialize in high-ticket dropshipping and premium brand building.

          YOUR GOAL:
          To generate high-converting, trust-building, and emotionally resonant copy for a Shopify store. The copy must feel "expensive", authoritative, and deeply researched.

          CRITICAL RESEARCH PHASE (Internal Monologue):
          Before writing any copy, you must perform a "Deep Dive Simulation" on the product niche:
          1.  Identify the "Bleeding Neck" pain point (the urgent problem).
          2.  Define the "Dream Outcome" (what life looks like after the product).
          3.  Analyze 3 common competitor failures (e.g., "breaks easily", "slow shipping", "poor support").
          4.  Establish the "Mechanism of Action" (how the product actually delivers results).

          TONE & STYLE GUIDELINES:
          -   **NO AI CLICHÉS**: Strictly avoid words like "unleash", "elevate", "unlock", "game-changer", "comprehensive", "landscape", "delve".
          -   **Specifics Build Trust**: Use concrete numbers, specific materials, and tangible benefits (e.g., instead of "high quality", say "aircraft-grade aluminum").
          -   **Ground Every Section**: Each major section must reference at least one concrete product detail (feature/spec/ingredient/material/size/compatibility/warranty/shipping) when available. If scraped facts are thin, be explicit and keep claims modest.
          -   **Authority & Empathy**: Sound like an expert who understands the customer's struggle.
          -   **Short & Punchy**: Use fragments for impact. "Built for speed. Engineered for life."
          -   **Risk Reversal**: Constantly reassure the user (guarantees, support, social proof).

          OUTPUT STRUCTURE:
          Return strictly a JSON object.
          Never return null. Never omit required keys. If you don't know a value, return an empty string.
          Ensure "testimonials" items always include {name,text,location,rating} where name/location are non-empty strings and rating is an integer 1-5.
          For new objects below ("collection_page","cart_drawer","cart_page","pages","policies","seo"), always include them even if some strings are empty.
          You MUST include a "_strategy" object first to prove your research.` 
          },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' as const },
        }),
        maxWait,
        'content'
      )
    }

    let resp: any
    try {
      resp = await run('gpt-4o-mini', { maxTokens: 2200, temperature: 0.7 })
    } catch (e) {
      return buildFallbackResponse(String((e as any)?.message || e), productAnalysis)
    }
    
    const content = resp.choices[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')
    const finish = resp.choices[0]?.finish_reason
    let parsed: any
    try {
      parsed = parseModelJson(content)
    } catch (e: any) {
      const errorMessage = String(e?.message || e)

      async function repairJsonWithModel(input: string) {
        const maxWait = Math.max(5_000, Math.min(REPAIR_TIMEOUT_MS, timeLeft() - 3_000))
        if (maxWait <= 0) throw new Error('route_budget_exceeded_before_repair')
        const repair = await withTimeout(openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 2400,
          messages: [
            {
              role: 'system',
              content:
                'You are a strict JSON repair utility. You will be given text that is intended to be a single JSON object but may be invalid (missing commas/quotes/braces, truncated, etc.). Return ONLY a valid JSON object. Preserve keys/values when possible. If a value is incomplete, replace it with an empty string, empty array, or empty object as appropriate. Do not add commentary.',
            },
            { role: 'user', content: input },
          ],
          response_format: { type: 'json_object' as const },
        }), maxWait, 'repair')
        const repaired = repair.choices[0]?.message?.content || ''
        return parseModelJson(repaired)
      }

      const shouldRetry =
        finish === 'length' ||
        /unterminated|string|json|unexpected end|expected/i.test(errorMessage)

      if (shouldRetry && timeLeft() > 14_000) {
        const retry = await run('gpt-4o-mini', { maxTokens: 2400, temperature: 0.2 })
        const retryContent = retry.choices[0]?.message?.content || ''
        try {
          parsed = parseModelJson(retryContent)
        } catch {
          try {
            parsed = await repairJsonWithModel(retryContent || content)
          } catch {
            return buildFallbackResponse('json_repair_failed_after_retry', productAnalysis)
          }
        }
      } else {
        try {
          parsed = await repairJsonWithModel(content)
        } catch {
          return buildFallbackResponse('json_repair_failed', productAnalysis)
        }
      }
    }
    const normalized = normalizeGeneratedContent(name, parsed, productAnalysis)
    return buildFinalResponse(normalized, { source: 'openai', analysis_used: !!productAnalysis })
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : String(error)
    console.error('OpenAI Error:', message)
    return buildFallbackResponse(message)
  }
}
