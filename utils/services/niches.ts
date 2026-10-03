/**
 * Photo packs for the services generator, one per trade.
 *
 * The services wizard has no niche picker; the owner types the category
 * ("صالون حلاقة رجالي", "غسيل السجاد"...), and the trade is guessed from it the
 * way the wellness generator guesses a niche from a typed type. The pack fills
 * the two images the merge supplies when the owner uploads none: the hero and
 * the story photo. Owner uploads always win.
 *
 * Each trade keeps several photos and each business gets one of them, picked
 * from a hash of its name, so barbers are spread across the pack's pictures
 * and one business always keeps the one it got.
 *
 * Photos are hand-picked Unsplash IDs, each looked at before it went in: the
 * trade, its tools or its place, no readable logos or text. The house rule for
 * every photo here: no women, no visible tattoos; where a person appears it is
 * a man, and tools, places and work without people come first.
 */

import { photoSeed, pickPhoto, unsplash } from '@/utils/wellness/niches'

export { unsplash }

export type ServiceNicheId = 'carpet' | 'pest' | 'barber' | 'ac' | 'carwash' | 'carrepair' | 'cleaning'

export type ServiceNiche = {
  id: ServiceNicheId
  /** Hero candidates and story candidates; one of each per business. */
  photos: { hero: string[]; story: string[] }
  /** Arabic/English keywords matched against the typed category. First niche in list order wins. */
  keywords: string[]
}

// Order matters: "غسيل السجاد" must reach carpet before anything car-related,
// and "غسيل وتلميع سيارات" must reach carwash before carrepair's "سيارات".
export const SERVICE_NICHES: ServiceNiche[] = [
  {
    id: 'carpet',
    photos: {
      // Stack of folded hand-knotted rugs · pile of rugs on a table · vacuum and
      // housekeeping cart on a patterned corridor carpet.
      hero: ['1608724552908-e1c141f631ac', '1726464107536-3b62e6d3d2cb', '1580256081112-e49377338b7f'],
      // Kilims and rugs spread out · red rug, diamond medallion · red Persian rug.
      story: ['1608724553456-89e963624dbb', '1660394585016-508f949df960', '1652634213812-f0deeb1de78e'],
    },
    keywords: ['سجاد', 'موكيت', 'كنب', 'انتريه', 'مفروشات', 'carpet', 'rug', 'upholstery'],
  },
  {
    id: 'pest',
    photos: {
      // Hand misting from a pressure sprayer, dark background · man with a
      // backpack sprayer along a house wall · man in a white suit spraying a street.
      hero: ['1747659629851-a92bd71149f6', '1670989292166-8b20b9530438', '1628267138997-2bd92e89aaf7'],
      // Cockroach on concrete · hands priming a sprayer.
      story: ['1759379077720-b099c6cf2f71', '1747659628682-3aeb5cd52fac'],
    },
    keywords: ['حشرات', 'مكافحة', 'إبادة', 'ابادة', 'قوارض', 'نمل أبيض', 'pest', 'termite', 'fumigation'],
  },
  {
    id: 'barber',
    photos: {
      // Empty shop, three chairs and brick wall · one chrome chair in the dark ·
      // chair against a brick wall · chair on a chequered floor.
      hero: ['1585747860715-2ba37e788b70', '1621645582931-d1d3e6564943', '1675599193990-33d71150902b', '1611313151697-d626e818dddf'],
      // Comb and thinning shears at work, face turned away · open tool roll ·
      // rows of leather barber chairs.
      story: ['1657105052497-f996284ffff8', '1638383258375-0d294725071b', '1576168056582-0a851a87ab8e'],
    },
    keywords: ['حلاق', 'حلاقة', 'باربر', 'barber'],
  },
  {
    id: 'ac',
    photos: {
      // Apartment facade lined with split-unit condensers · two technicians on a
      // rooftop among units and ducting · rooftop condensers from above.
      hero: ['1545649311-24d0ac00ae82', '1642749776312-aa42ce20c9f5', '1698479603408-1a66a6d9e80f'],
      // Outdoor unit by a shop shutter · outdoor unit on a wall ledge · units on a panelled wall.
      story: ['1724488751821-1415f5cf4960', '1718203862467-c33159fdc504', '1667983453881-4992fe86ab1b'],
    },
    keywords: ['تكييف', 'تكييفات', 'تبريد', 'hvac', 'air condition', 'a/c'],
  },
  {
    id: 'carwash',
    photos: {
      // Foam sprayed on a black sports car in a garage · white car under foam ·
      // wet black wheel on a dark bay.
      hero: ['1608506375591-b90e1f955e4b', '1611239179213-d972da54091a', '1708805283017-c662be2c7a44'],
      // Brush on a foamed red rim · gloved hand brushing a tyre · man machine-polishing a black car.
      story: ['1565689876697-e467b6c54da2', '1708805282683-50a060eba80f', '1708805282706-f44730b7e527'],
    },
    keywords: ['غسيل سيارات', 'غسيل وتلميع', 'تلميع', 'مغسلة', 'ديتيلنج', 'car wash', 'detailing'],
  },
  {
    id: 'carrepair',
    photos: {
      // Hands with a ring spanner in an engine bay · mechanic under an open bonnet
      // in a service centre · workshop with a lift, tyres and a welding bench.
      hero: ['1619642751034-765dfdf7c58e', '1625047509168-a7026f36de04', '1676018366904-c083ed678e60'],
      // Open drawer of spanners and sockets · spanners in a ring · spanners on a rack.
      story: ['1637640125496-31852f042a60', '1613206485381-b028e578e791', '1698382318239-2b134ca8fa4c'],
    },
    keywords: ['صيانة سيارات', 'ميكانيك', 'كهرباء سيارات', 'سمكرة', 'مركز خدمة', 'سيارات', 'mechanic', 'auto repair', 'car service'],
  },
  {
    id: 'cleaning',
    photos: {
      // Yellow glove and mop on a foamy floor · caddies of spray bottles · bucket and mop in low sun.
      hero: ['1740657254989-42fe9c3b8cce', '1626379481874-3dc5678fa8ca', '1680479610464-22342f553842'],
      // Yellow gloves on a line · mop and wringer bucket by a wall · buckets and brooms on a deck.
      story: ['1616360072047-70557844db53', '1689127903369-aef916b0c40d', '1787205598829-e945bf8594ce'],
    },
    keywords: ['تنظيف', 'نظافة', 'cleaning'],
  },
]

/** The trade guessed from the typed category, or undefined when nothing matches. */
export function resolveServiceNiche(category?: string | null): ServiceNiche | undefined {
  const text = (category || '').toLowerCase()
  if (!text) return undefined
  return SERVICE_NICHES.find((n) => n.keywords.some((k) => text.includes(k.toLowerCase())))
}

/**
 * This business's two photos from its trade's pack: a hero, and a story photo
 * that is not the hero. The key (the business name) decides which, so the
 * same business always gets the same pair.
 */
export function pickServicePhotos(niche: ServiceNiche, key?: string | null): { hero: string; story: string } {
  const seed = photoSeed(key)
  const hero = pickPhoto(niche.photos.hero, seed)
  // The high bits pick the second photo, so it turns independently of the hero.
  return { hero, story: pickPhoto(niche.photos.story, seed >>> 16, hero) }
}
