import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'
import { aiFailed, aiUnavailable } from '@/lib/ai-failure'
import { dishPhoto } from '@/lib/dish-photos'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { restaurantInputSchema, type RestaurantInput } from '@/utils/restaurant/input'
import type { RestaurantContent } from '@/utils/restaurant/types'
import { RESTAURANT_MOCK_CONTENT } from '@/utils/restaurant/mock-content'
import { NO_REVIEWS_RULE, cleanOwnerReviews, countOf, ratingBrief, starsOf, unlessRatingClaim } from '@/lib/owner-reviews'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TIMEOUT_MS = 45_000

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1669310097451-826ff0e66b9a?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2000&q=80'
]

const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1428515613728-6b4607e44363?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1770736929333-4fb8cd5a1657?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1602232037779-30b01ac3c457?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=1400&q=80'
]

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

  const reservationsText =
    input.reservations.provider_type === 'phone'
      ? `Phone reservations: ${input.reservations.provider_value || input.location.phone || 'see contact'}`
      : "Reservations captured on-site via the restaurant's own booking form — guests submit a request and the owner receives it directly. No external platform."

  const restaurantType = (input.brand as any).restaurant_type as string | undefined
  const toneByType: Record<string, string> = {
    fine_dining:     'quiet, confident, sensory, editorial — restaurant criticism, not marketing copy. Long sentences are welcome. Mention sourcing, technique and the room only as the brief describes them.',
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
${ratingBrief(input.social_proof?.review_rating, input.social_proof?.review_count)}

WRITING DIRECTION
Tone for this place: ${tone}
Never write generic restaurant marketing copy. Mirror the energy of the type above.

Hard rules:
- Headlines: 4–10 words. Quiet, evocative, specific.
- Subheadlines: one or two sentences. Specific to this restaurant.
- Menu item descriptions: 6–14 words. Sensory and concrete.
- FAQ answers: 1–2 sentences. Direct. No padding.
- Eyebrow labels: 2–5 words. ALL CAPS feel via context, write in normal case.
- Do not invent specific dietary certifications, awards, or Michelin stars unless they are in the brief.
- Do not use words like "delicious," "world-class," "best in the city."
- Name produce, technique or a region only when the menu or the brief names it. Never add an ingredient, farm, supplier or origin of your own.
- NEVER mention any external reservation platform (Resy, OpenTable, SevenRooms, Tock, etc.) in ANY field — not the reservations heading, subheading, cta_label, eyebrow, or note. Reservations run through this site's own booking form. Write reservation copy as if guests book directly with the restaurant.

OUTPUT
Return ONLY valid JSON matching this exact shape. No prose, no markdown.

{
  "hero": {
    "eyebrow": "Short context line built from the brief, e.g. the cuisine and the neighbourhood. No season, menu name or event the brief does not give.",
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
    { "name": "Pick from menu, exact name", "description": "6–14 words, only what the menu says or the dish name makes plain" }
  ],
  "menu_descriptions": [
    { "category_name": "exact category name", "item_name": "exact item name", "description": "6–14 words. Only what the dish name and category make plain — no ingredient, origin or method the menu does not give" }
  ],
  "gallery": {
    "heading": "Gallery section headline (max 8 words)",
    "subheading": "One short sentence.${(input.visuals.gallery_image_urls || []).length === 0 ? ' The owner uploaded no photos, so the gallery shows stock images: do not describe them as this restaurant\'s room, kitchen or dishes.' : ''}"
  },
  "hours_location": {
    "heading": "Visit section headline (max 4 words)",
    "subheading": "One short sentence referencing neighborhood or vibe."
  },
  "reservations": {
    "heading": "Reservations section headline (max 8 words)",
    "subheading": "1–2 sentences on how to book. State a policy, deposit, lead time or group size only if the reservation note gives it.",
    "cta_label": "Short Arabic reservation CTA, e.g. 'احجز طاولتك' or 'اتصل للحجز'. NEVER name an external platform (no Resy/OpenTable/SevenRooms) — reservations run through the site's own booking form."
  },
  "reviews": {
    "heading": "Headline for the owner's guest reviews (max 6 words)",
    "subheading": "One short sentence."
  },
  "newsletter": {
    "heading": "Newsletter section headline (max 4 words)",
    "subheading": "One short sentence."
  },
  "faq": [
    { "q": "Question (max 12 words)", "a": "Direct answer (1–2 sentences)" }
  ],
  "footer": {
    "tagline": "Short closing line about the vibe. Never mention days, hours or opening times — the real hours are shown next to it."
  },
  "seo": {
    "title": "<= 60 chars. Format: '${input.brand.name} · ${input.brand.cuisine} · ${input.brand.city}'",
    "description": "<= 155 chars. Specific summary."
  }
}

Requirements:
- signature_dishes: 0–4 items, each an exact item name from the menu above. Never a dish that is not on the menu. Prices are taken from the menu, do not write them.
- menu_descriptions: write descriptions ONLY for items that currently have none. Cap at the 24 most prominent such items — do NOT list every item on a large menu (items you skip keep a sensible default). Never repeat items that already have a description.
${NO_REVIEWS_RULE}
- Never name a newspaper, magazine, guide, award, star or ranking the brief does not give. The press list is the owner's own, shown as given.
- faq: 0–6 items. Ask only questions the brief can answer (location, how to book, what is on the menu) and answer only from the brief. Return fewer items rather than guess.
- Never state a price, deposit, cancellation policy, dress code, age rule, parking or valet, private room, seat count, opening year, farm or supplier, dietary claim (halal, organic, vegan, gluten-free), award, rating, chef credential, seasonal or tasting menu, delivery or catering that the brief does not give. This applies to every field.
- Use the restaurant's name ("${input.brand.name}") sparingly (max twice across all copy)`
}

function mergeIntoContent(input: RestaurantInput, ai: any): RestaurantContent {
  const mock = RESTAURANT_MOCK_CONTENT
  const rating = input.social_proof?.review_rating
  const owner = { rating, count: input.social_proof?.review_count }
  // Reviews are only ever the owner's own. With none, the section is not drawn.
  const testimonials = cleanOwnerReviews(input.social_proof?.reviews).map((r) => ({
    name: r.name,
    text: r.text,
    source: [r.detail, r.origin === 'google' ? 'Google' : undefined].filter(Boolean).join(' · ') || undefined,
    rating: starsOf(r.rating),
    origin: r.origin,
    when: r.when
  }))

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
          : // No filler line: an empty description is simply not drawn.
            aiDescMap.get(`${cat.name}::${item.name}`) || '',
      price: item.price,
      badge: item.badge,
      // Pass through user-uploaded item image so the renderer can show a thumb.
      image: (item as any).image_url || undefined
    }))
  }))

  // Signature dishes — only real menu items. The AI may pick which ones and
  // word the line; name and price always come from the owner's menu.
  const flatItems = menuCategories.flatMap((c) => c.items)
  const sigImages = input.visuals.signature_dish_image_urls || []
  const picked: { item: (typeof flatItems)[number]; aiDesc: string }[] = []
  if (Array.isArray(ai?.signature_dishes)) {
    for (const d of ai.signature_dishes) {
      const item = flatItems.find((it) => it.name === String(d?.name || '').trim())
      if (item && !picked.some((p) => p.item === item)) {
        picked.push({ item, aiDesc: typeof d?.description === 'string' ? d.description : '' })
      }
      if (picked.length === 4) break
    }
  }
  const sigSource = picked.length > 0 ? picked : flatItems.slice(0, 4).map((item) => ({ item, aiDesc: '' }))
  const signature_dishes = sigSource.map(({ item, aiDesc }, i) => ({
    name: item.name,
    description: item.description || aiDesc,
    price: item.price,
    // The dish's own uploaded photo first, then the owner's signature photos,
    // then a stock photo only if it shows this kind of dish. A dish nothing
    // matches gets no photo: a pizza over "شاورما" tells the visitor a lie.
    image: item.image || sigImages[i] || dishPhoto(item.name)
  }))

  // Provider object — Zenya's own booking form by default; `phone` only as an
  // opt-in call-to-reserve fallback. No external platforms.
  const r = input.reservations
  const provider: RestaurantContent['reservations']['provider'] =
    r.provider_type === 'phone'
      ? { type: 'phone', number: r.provider_value || input.location.phone }
      : { type: 'form' }

  // Press — only the outlets the owner named. Nothing is invented or filled
  // from the demo content: a made-up "Michelin star" on a real restaurant's
  // site is a false claim. With none, the section is not drawn.
  const press_items = (input.press_outlets || []).slice(0, 6).map((o) => ({ outlet: o }))

  // Gallery — user-provided first, fall back to defaults
  const galleryUrls = (input.visuals.gallery_image_urls || []).slice(0, 8)
  const galleryImages =
    galleryUrls.length >= 6
      ? galleryUrls.map((u) => ({ url: u }))
      : [...galleryUrls.map((u) => ({ url: u })), ...FALLBACK_GALLERY.slice(0, 6 - galleryUrls.length).map((u) => ({ url: u }))]

  const hero_image = input.visuals.hero_image_url || FALLBACK_HERO_IMAGES[0]
  const accent_image = input.visuals.accent_image_url || FALLBACK_ACCENT_IMAGE
  // The chef's own photo or none — a stock face would be passed off as them.
  const chef_photo = input.visuals.chef_photo_url || undefined

  // CTA label — reservations go through Zenya's own form; `phone` is the only
  // call-out fallback.
  const defaultCta = r.provider_type === 'phone' ? 'اتصل للحجز' : 'احجز طاولتك'

  // Neutral lines written from the owner's own input, used wherever the AI
  // left a field out. Never the demo restaurant's copy.
  const place = input.brand.neighborhood ? `${input.brand.neighborhood}، ${input.brand.city}` : input.brand.city
  const neutralLine = `${input.brand.cuisine} · ${input.brand.city}`

  const content: RestaurantContent = {
    brand: {
      name: input.brand.name,
      cuisine: input.brand.cuisine,
      tagline: String(ai?.hero?.subheadline || neutralLine),
      city: input.brand.city,
      neighborhood: input.brand.neighborhood
    },
    hero: {
      eyebrow: unlessRatingClaim(String(ai?.hero?.eyebrow || neutralLine), neutralLine, owner),
      headline: String(ai?.hero?.headline || mock.hero.headline),
      subheadline: String(ai?.hero?.subheadline || `${input.brand.cuisine} في ${place}.`),
      primary_cta: String(ai?.hero?.primary_cta || 'احجز طاولة'),
      secondary_cta: String(ai?.hero?.secondary_cta || 'شاهد القائمة'),
      image: hero_image
    },
    story: {
      eyebrow: String(ai?.story?.eyebrow || 'قصتنا'),
      heading: String(ai?.story?.heading || 'حكايتنا.'),
      body: String(ai?.story?.body || input.story.brief),
      chef_name: input.story.chef_name,
      chef_title: input.story.chef_title,
      chef_bio: String(ai?.story?.chef_bio || input.story.chef_bio_brief || ''),
      chef_photo: chef_photo,
      accent_image: accent_image
    },
    signature_dishes,
    signature_dishes_heading: String(ai?.signature_dishes_heading || 'مختارات من قائمتنا'),
    menu: {
      heading: String(ai?.menu?.heading || 'قائمة الطعام'),
      subheading: String(
        ai?.menu?.subheading || `${input.brand.cuisine} في ${place}.`
      ),
      categories: menuCategories
    },
    gallery: {
      heading: String(ai?.gallery?.heading || 'لمحات.'),
      subheading: String(ai?.gallery?.subheading || ''),
      images: galleryImages,
      // Truth-in-photography note for the live site: was the gallery
      // filled from the venue's own uploads, or from Unsplash fallbacks?
      attribution: galleryUrls.length > 0 ? 'from_venue' : 'from_unsplash',
    },
    hours_location: {
      heading: String(ai?.hours_location?.heading || 'تجدنا هنا.'),
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
      heading: String(ai?.reservations?.heading || 'احجز أمسيتك.'),
      subheading: String(
        ai?.reservations?.subheading ||
          (r.provider_type === 'phone'
            ? 'اتصل بنا لحجز طاولتك.'
            : 'أرسل طلب الحجز، ونتواصل معك لتأكيده.')
      ),
      cta_label: String(ai?.reservations?.cta_label || defaultCta),
      provider,
      note: input.reservations.note
    },
    reviews: {
      heading: String(ai?.reviews?.heading || 'في القاعة.'),
      subheading: String(ai?.reviews?.subheading || 'كلماتٌ من ضيوفٍ زارونا مؤخّرًا.'),
      overall_rating: rating,
      review_count: countOf(input.social_proof?.review_count),
      testimonials
    },
    press: {
      heading: String(ai?.press_heading || 'في الصحافة.'),
      items: press_items
    },
    newsletter: {
      heading: String(ai?.newsletter?.heading || 'ابقَ على اطّلاع.'),
      subheading: String(ai?.newsletter?.subheading || 'اشترك لتصلك أخبارنا وجديد قائمتنا.'),
      button_label: String(ai?.newsletter?.button_label || 'اشترك')
    },
    faq: {
      heading: String(ai?.faq_heading || 'قبل أن تأتي.'),
      // The AI's answers from the brief, or none: the demo's FAQ names
      // another restaurant's deposit, dress code and parking.
      items: Array.isArray(ai?.faq)
        ? ai.faq
            .slice(0, 6)
            .map((f: any) => ({ q: String(f?.q || '').trim(), a: String(f?.a || '').trim() }))
            .filter((f: { q: string; a: string }) => f.q && f.a)
        : []
    },
    footer: {
      // Never the demo's line: it names opening days that are not this restaurant's.
      tagline: String(ai?.footer?.tagline || neutralLine),
      legal: `© ${new Date().getFullYear()} ${input.brand.name}. جميع الحقوق محفوظة.`
    },
    seo: {
      title: String(
        ai?.seo?.title || `${input.brand.name} · ${input.brand.cuisine} · ${input.brand.city}`
      ),
      description: String(ai?.seo?.description || `${input.brand.name} — ${input.brand.cuisine} في ${place}.`)
    },
    // Editor fields — start with everything visible + empty social links.
    // The editor populates these later; the renderer treats them as
    // optional and defaults to "all visible".
    hidden_sections: [],
    social_links: {},
    links: { reviews_url: input.social_proof?.reviews_url || undefined },
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
    const off = aiUnavailable()
    if (off) return off
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
        model: AI_MODEL,
        temperature: 0.65,
        max_tokens: AI_MAX_TOKENS,
        response_format: { type: 'json_object' as const },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior restaurant copywriter and food critic. You write quiet, sensory, editorial copy for fine-dining and elevated-casual restaurants. You always return strict JSON in the exact shape requested.\n\n' +
              ARABIC_OUTPUT_DIRECTIVE
          },
          { role: 'user', content: prompt }
        ]
      }),
      TIMEOUT_MS,
      'restaurant_ai'
    )

    await logAiUsage({ operation: 'generate-restaurant', userId: await getUserIdSafe(), model: AI_MODEL }, resp.usage)

    const raw = resp.choices?.[0]?.message?.content || '{}'
    let aiJson: any = {}
    try {
      aiJson = parseJsonSafe(raw)
    } catch (e) {
      return aiFailed('generate-restaurant', e)
    }

    const content = mergeIntoContent(input, aiJson)
    return NextResponse.json({
      content,
      _meta: { source: 'openai', model: AI_MODEL }
    })
  } catch (e: any) {
    return aiFailed('generate-restaurant', e)
  }
}
