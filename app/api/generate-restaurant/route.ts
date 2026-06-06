import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { restaurantInputSchema, type RestaurantInput } from '@/utils/restaurant/input'
import type { RestaurantContent } from '@/utils/restaurant/types'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEOUT_MS = 45_000

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2000&q=80'
]

const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1428515613728-6b4607e44363?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=1400&q=80'
]

const FALLBACK_DISH_IMAGES = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80'
]

const FALLBACK_CHEF_IMAGE =
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80'

const FALLBACK_ACCENT_IMAGE =
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1600&q=80'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms)
    promise
      .then((v) => {
        clearTimeout(t)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(t)
        reject(e)
      })
  })
}

function parseJsonSafe(raw: string): any {
  try {
    return JSON.parse(raw)
  } catch {
    const cleaned = raw
      .replace(/^```(?:json)?/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    return JSON.parse(cleaned)
  }
}

function buildPrompt(input: RestaurantInput) {
  const menuText = input.menu.categories
    .map(
      (cat) =>
        `${cat.name}${cat.description ? ` — ${cat.description}` : ''}\n` +
        cat.items.map((i) => `  • ${i.name} (${i.price})${i.description ? ` — ${i.description}` : ''}`).join('\n')
    )
    .join('\n\n')

  const reservationsText = (() => {
    const r = input.reservations
    if (r.provider_type === 'phone') return `Phone reservations: ${r.provider_value || 'see contact'}`
    if (r.provider_type === 'form') return 'Contact-form reservations on site'
    return `${r.provider_type.toUpperCase()} reservations${r.provider_value ? `: ${r.provider_value}` : ''}`
  })()

  const restaurantType = (input.brand as any).restaurant_type as string | undefined
  const toneByType: Record<string, string> = {
    fine_dining:     'quiet, confident, sensory, editorial — restaurant criticism, not marketing copy. Long sentences are welcome. Mention sourcing, technique, the room.',
    bistro:          'warm, casual, generous — neighbourhood-bistro voice. Plainspoken, a little playful, full plates and real people.',
    cafe:            'morning-energy, light, welcoming — soft and inviting. Mention the room, the regulars, the smell of coffee.',
    coffee_takeaway: 'direct, modern, energetic — efficiency, good beans, fast. Short sentences. No nostalgia.',
    bakery:          'warm, artisanal, sensory — flour, butter, hands-on craft. Time-honoured but not stuffy.',
    pizzeria:        'honest, family-style, traditional — straightforward and proud. Mention the oven, the dough, the people behind the counter.',
    bar:             'intimate, evocative, atmospheric — dim light, good company, well-made drinks. A little nocturnal.',
    brunch:          'bright, social, easy — leisurely weekends, sunlight, no rush.',
    cafeteria:       'honest, fast, fair — fresh food, no fuss, good prices, real people at the counter.',
    food_truck:      'punchy, direct, fun — street-food authenticity. Short lines. A little attitude.',
    dessert:         'delicate, sweet, indulgent — small pleasures, beautiful plating, careful technique.',
    other:           'quiet, confident, sensory, editorial — never salesy, never generic.',
  }
  const tone = restaurantType ? (toneByType[restaurantType] || toneByType.other) : toneByType.other

  return `RESTAURANT BRIEF
Name: ${input.brand.name}
Cuisine: ${input.brand.cuisine}${restaurantType ? `
Type of place: ${restaurantType.replace(/_/g, ' ')}` : ''}
City: ${input.brand.city}${input.brand.neighborhood ? ` (${input.brand.neighborhood})` : ''}
Address: ${input.location.address}

Story brief (rough notes from owner):
${input.story.brief}

Chef: ${input.story.chef_name || 'N/A'}${input.story.chef_title ? ` (${input.story.chef_title})` : ''}
Chef bio brief: ${input.story.chef_bio_brief || 'N/A'}

Menu:
${menuText}

Reservations: ${reservationsText}
${input.reservations.note ? `Reservation note: ${input.reservations.note}` : ''}

Press outlets mentioned: ${(input.press_outlets || []).join(', ') || 'N/A'}

WRITING DIRECTION
Tone for this place: ${tone}
Never write generic restaurant marketing copy. Mirror the energy of the type above.

Hard rules:
- Headlines: 4–10 words. Quiet, evocative, specific.
- Subheadlines: one or two sentences. Specific to this restaurant.
- Menu item descriptions: 6–14 words. Sensory and concrete.
- Testimonials: 18–40 words. Believable. Specific dish or detail. Reference the restaurant by name at most once.
- FAQ answers: 1–2 sentences. Direct. No padding.
- Eyebrow labels: 2–5 words. ALL CAPS feel via context, write in normal case.
- Do not invent specific dietary certifications, awards, or Michelin stars unless they are in the brief.
- Do not use words like "delicious," "world-class," "best in the city."
- Use specific produce, technique, region names where natural (e.g., "Hudson Valley duck," "brown butter," "fig leaf").

OUTPUT
Return ONLY valid JSON matching this exact shape. No prose, no markdown.

{
  "hero": {
    "eyebrow": "Short context line, e.g. 'Reservations open · Spring tasting menu'",
    "headline": "Two-line poetic headline. Use \\n between lines.",
    "subheadline": "1–2 sentences positioning the restaurant.",
    "primary_cta": "Reserve a Table",
    "secondary_cta": "See the Menu"
  },
  "story": {
    "eyebrow": "Our story",
    "heading": "One-sentence story headline (max 12 words).",
    "body": "Polished 2–3 sentence about. Build on the brief; do not invent facts.",
    "chef_bio": "1–2 sentences if chef name given, else empty string."
  },
  "signature_dishes": [
    { "name": "Pick from menu, exact name", "description": "6–14 words sensory description", "price": "exact price from menu" }
  ],
  "menu_descriptions": [
    { "category_name": "exact category name", "item_name": "exact item name", "description": "6–14 words sensory description if missing/weak, else keep existing" }
  ],
  "gallery": {
    "heading": "Gallery section headline (max 8 words)",
    "subheading": "One short sentence."
  },
  "hours_location": {
    "heading": "Visit section headline (max 4 words)",
    "subheading": "One short sentence referencing neighborhood or vibe."
  },
  "reservations": {
    "heading": "Reservations section headline (max 8 words)",
    "subheading": "1–2 sentences on booking policy, deposits, lead time.",
    "cta_label": "CTA matching the provider (e.g. 'Book on Resy', 'Call to Reserve')"
  },
  "reviews": {
    "heading": "Reviews section headline (max 6 words)",
    "subheading": "One short sentence.",
    "overall_rating": 4.8,
    "review_count": "200+",
    "testimonials": [
      { "name": "Plausible first + last initial", "text": "18–40 words", "source": "Plausible source (e.g. 'Resy · Verified diner', 'OpenTable · Verified diner', 'Eater'). For one of four, you may use a press outlet from the brief if any.", "rating": 5 }
    ]
  },
  "press": [
    { "outlet": "Outlet name from brief or plausible default", "quote": "Optional short pull quote (max 8 words). Empty string if none." }
  ],
  "newsletter": {
    "heading": "Newsletter section headline (max 4 words)",
    "subheading": "One short sentence."
  },
  "faq": [
    { "q": "Question (max 12 words)", "a": "Direct answer (1–2 sentences)" }
  ],
  "footer": {
    "tagline": "Short closing line referencing hours or vibe."
  },
  "seo": {
    "title": "<= 60 chars. Format: '${input.brand.name} · ${input.brand.cuisine} · ${input.brand.city}'",
    "description": "<= 155 chars. Specific summary."
  }
}

Requirements:
- signature_dishes: exactly 4 items chosen from the strongest menu items
- menu_descriptions: cover every menu item; copy existing description when already strong
- testimonials: exactly 4
- press: 4–6 items
- faq: 5–7 items
- Use the restaurant's name ("${input.brand.name}") sparingly (max twice across all copy)`
}

function pickNth<T>(arr: T[], i: number, fallback: T): T {
  if (!Array.isArray(arr) || arr.length === 0) return fallback
  return arr[i % arr.length] ?? fallback
}

function mergeIntoContent(input: RestaurantInput, ai: any): RestaurantContent {
  const mock = RESTAURANT_MOCK_CONTENT

  // Build menu with AI-polished descriptions when missing/weak
  const aiDescMap = new Map<string, string>()
  if (Array.isArray(ai?.menu_descriptions)) {
    for (const m of ai.menu_descriptions) {
      if (m?.category_name && m?.item_name && typeof m?.description === 'string') {
        aiDescMap.set(`${m.category_name}::${m.item_name}`, String(m.description))
      }
    }
  }

  const menuCategories = input.menu.categories.map((cat, ci) => ({
    id: `cat-${ci}-${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
    name: cat.name,
    description: cat.description,
    items: cat.items.map((item) => ({
      name: item.name,
      description:
        item.description && item.description.length > 0
          ? item.description
          : aiDescMap.get(`${cat.name}::${item.name}`) || `${cat.name.toLowerCase()} · ${input.brand.cuisine.toLowerCase()}`,
      price: item.price,
      badge: item.badge,
      // Pass through user-uploaded item image so the renderer can show a thumb.
      image: (item as any).image_url || undefined
    }))
  }))

  // Signature dishes — from AI selection if present, else first 4 from menu
  const signatureFromAi = Array.isArray(ai?.signature_dishes) ? ai.signature_dishes.slice(0, 4) : []
  const flatItems = menuCategories.flatMap((c) => c.items)
  const sigImages = input.visuals.signature_dish_image_urls || []
  const signature_dishes =
    signatureFromAi.length === 4
      ? signatureFromAi.map((d: any, i: number) => {
          const matched = flatItems.find((it) => it.name === d.name) || flatItems[i]
          return {
            name: String(d.name || matched?.name || mock.signature_dishes[i].name),
            description: String(d.description || matched?.description || mock.signature_dishes[i].description),
            price: String(d.price || matched?.price || mock.signature_dishes[i].price),
            image: pickNth(sigImages, i, FALLBACK_DISH_IMAGES[i % FALLBACK_DISH_IMAGES.length])
          }
        })
      : flatItems.slice(0, 4).map((it, i) => ({
          name: it.name,
          description: it.description,
          price: it.price,
          image: pickNth(sigImages, i, FALLBACK_DISH_IMAGES[i % FALLBACK_DISH_IMAGES.length])
        }))

  // Provider object
  const r = input.reservations
  const provider: RestaurantContent['reservations']['provider'] =
    r.provider_type === 'phone'
      ? { type: 'phone', number: r.provider_value || input.location.phone }
      : r.provider_type === 'form'
      ? { type: 'form' }
      : { type: r.provider_type as 'opentable' | 'resy' | 'sevenrooms', url: r.provider_value || '#' }

  // Press
  const pressFromAi = Array.isArray(ai?.press) ? ai.press : []
  const pressFromInput = (input.press_outlets || []).map((o) => ({ outlet: o }))
  const press_items =
    pressFromInput.length >= 4
      ? pressFromInput.slice(0, 6)
      : pressFromAi.length >= 4
      ? pressFromAi.slice(0, 6).map((p: any) => ({
          outlet: String(p?.outlet || ''),
          quote: typeof p?.quote === 'string' && p.quote.length > 0 ? p.quote : undefined
        }))
      : mock.press.items

  // Gallery — user-provided first, fall back to defaults
  const galleryUrls = (input.visuals.gallery_image_urls || []).slice(0, 8)
  const galleryImages =
    galleryUrls.length >= 6
      ? galleryUrls.map((u) => ({ url: u }))
      : [...galleryUrls.map((u) => ({ url: u })), ...FALLBACK_GALLERY.slice(0, 6 - galleryUrls.length).map((u) => ({ url: u }))]

  const hero_image = input.visuals.hero_image_url || FALLBACK_HERO_IMAGES[0]
  const accent_image = input.visuals.accent_image_url || FALLBACK_ACCENT_IMAGE
  const chef_photo = input.visuals.chef_photo_url || (input.story.chef_name ? FALLBACK_CHEF_IMAGE : undefined)

  // CTA label
  const defaultCta =
    r.provider_type === 'opentable'
      ? 'Book on OpenTable'
      : r.provider_type === 'resy'
      ? 'Book on Resy'
      : r.provider_type === 'sevenrooms'
      ? 'Book on SevenRooms'
      : r.provider_type === 'phone'
      ? 'Call to Reserve'
      : 'Request a Booking'

  const content: RestaurantContent = {
    brand: {
      name: input.brand.name,
      cuisine: input.brand.cuisine,
      tagline: String(ai?.hero?.subheadline || mock.brand.tagline),
      city: input.brand.city,
      neighborhood: input.brand.neighborhood
    },
    hero: {
      eyebrow: String(ai?.hero?.eyebrow || mock.hero.eyebrow),
      headline: String(ai?.hero?.headline || mock.hero.headline),
      subheadline: String(ai?.hero?.subheadline || mock.hero.subheadline),
      primary_cta: String(ai?.hero?.primary_cta || 'Reserve a Table'),
      secondary_cta: String(ai?.hero?.secondary_cta || 'See the Menu'),
      image: hero_image
    },
    story: {
      eyebrow: String(ai?.story?.eyebrow || 'Our story'),
      heading: String(ai?.story?.heading || mock.story.heading),
      body: String(ai?.story?.body || input.story.brief || mock.story.body),
      chef_name: input.story.chef_name,
      chef_title: input.story.chef_title,
      chef_bio: String(ai?.story?.chef_bio || input.story.chef_bio_brief || ''),
      chef_photo: chef_photo,
      accent_image: accent_image
    },
    signature_dishes,
    menu: {
      heading: 'À la carte',
      subheading: String(
        ai?.menu?.subheading || `Served at our ${input.brand.neighborhood || input.brand.city} dining room.`
      ),
      categories: menuCategories
    },
    gallery: {
      heading: String(ai?.gallery?.heading || mock.gallery.heading),
      subheading: String(ai?.gallery?.subheading || mock.gallery.subheading),
      images: galleryImages,
      // Truth-in-photography note for the live site: was the gallery
      // filled from the venue's own uploads, or from Unsplash fallbacks?
      attribution: galleryUrls.length > 0 ? 'from_venue' : 'from_unsplash',
    },
    hours_location: {
      heading: String(ai?.hours_location?.heading || 'Find us.'),
      subheading: String(
        ai?.hours_location?.subheading ||
          `${input.location.address}${input.brand.neighborhood ? `, ${input.brand.neighborhood}` : ''}`
      ),
      address: input.location.address,
      phone: input.location.phone,
      email: input.location.email,
      map_link: input.location.map_link,
      hours: input.location.hours
    },
    reservations: {
      heading: String(ai?.reservations?.heading || 'Reserve your evening.'),
      subheading: String(ai?.reservations?.subheading || mock.reservations.subheading),
      cta_label: String(ai?.reservations?.cta_label || defaultCta),
      provider,
      note: input.reservations.note
    },
    reviews: {
      heading: String(ai?.reviews?.heading || 'In the room.'),
      subheading: String(ai?.reviews?.subheading || 'A few words from recent guests.'),
      overall_rating:
        typeof ai?.reviews?.overall_rating === 'number'
          ? Math.max(4.0, Math.min(5.0, ai.reviews.overall_rating))
          : 4.8,
      review_count: String(ai?.reviews?.review_count || '200+'),
      testimonials:
        Array.isArray(ai?.reviews?.testimonials) && ai.reviews.testimonials.length >= 3
          ? ai.reviews.testimonials.slice(0, 4).map((t: any) => ({
              name: String(t?.name || 'Verified guest'),
              text: String(t?.text || ''),
              source: t?.source ? String(t.source) : undefined,
              rating:
                typeof t?.rating === 'number' ? Math.max(1, Math.min(5, Math.round(t.rating))) : 5
            }))
          : mock.reviews.testimonials
    },
    press: {
      heading: 'In the press.',
      items: press_items
    },
    newsletter: {
      heading: String(ai?.newsletter?.heading || 'Seasonal letter.'),
      subheading: String(ai?.newsletter?.subheading || mock.newsletter.subheading),
      button_label: 'Subscribe'
    },
    faq: {
      heading: 'Before you come.',
      items:
        Array.isArray(ai?.faq) && ai.faq.length >= 4
          ? ai.faq.slice(0, 7).map((f: any) => ({ q: String(f?.q || ''), a: String(f?.a || '') }))
          : mock.faq.items
    },
    footer: {
      tagline: String(ai?.footer?.tagline || mock.footer.tagline),
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. All rights reserved.`
    },
    seo: {
      title: String(
        ai?.seo?.title || `${input.brand.name} · ${input.brand.cuisine} · ${input.brand.city}`
      ),
      description: String(ai?.seo?.description || mock.seo.description)
    },
    // Editor fields — start with everything visible + empty social links.
    // The editor populates these later; the renderer treats them as
    // optional and defaults to "all visible".
    hidden_sections: [],
    social_links: {},
  }

  return content
}

function buildFallbackContent(input: RestaurantInput): RestaurantContent {
  return mergeIntoContent(input, {})
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = restaurantInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues.slice(0, 8) },
      { status: 400 }
    )
  }
  const input = parsed.data

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        content: buildFallbackContent(input),
        _meta: { source: 'fallback_no_api_key' }
      },
      { status: 200 }
    )
  }

  try {
    const openai = new OpenAI({ apiKey })
    const prompt = buildPrompt(input)

    const resp = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.65,
        max_tokens: 2400,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior restaurant copywriter and food critic. You write quiet, sensory, editorial copy for fine-dining and elevated-casual restaurants. You always return strict JSON in the exact shape requested.'
          },
          { role: 'user', content: prompt }
        ]
      }),
      TIMEOUT_MS,
      'restaurant_ai'
    )

    const raw = resp.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try {
      aiJson = parseJsonSafe(raw)
    } catch {
      aiJson = {}
    }

    const content = mergeIntoContent(input, aiJson)
    return NextResponse.json({
      content,
      _meta: { source: 'openai', model: 'gpt-4o-mini' }
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        content: buildFallbackContent(input),
        _meta: { source: 'fallback_error', error: String(e?.message || e) }
      },
      { status: 200 }
    )
  }
}
