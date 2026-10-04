/**
 * A stock photo for a dish, but only one that shows that dish.
 *
 * A restaurant card is built around a photo, and when the owner uploads none
 * the generator used to hand out four stock pictures in a fixed order: a pizza
 * over whatever the first dish was. A visitor reads a photo under a dish name
 * as that dish. So a stock photo is picked by what the dish IS, from its name,
 * and a dish that matches nothing gets no photo at all rather than a wrong one.
 *
 * Every photo below was looked at and shows what its entry says. Add a kind
 * only with a photo that has been checked the same way.
 *
 * Order matters: the first entry whose word appears in the name wins, so the
 * specific dishes come before the general ones ("شاورما دجاج" is shawarma,
 * not chicken; "آيس كريم" is ice cream, not a cake).
 */

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`

const KINDS: { words: string[]; photo: string }[] = [
  { words: ['شاورما', 'شاورمه', 'شورما', 'دونر', 'shawarma', 'shawerma', 'gyro', 'doner'], photo: u('1529006557810-274b9b2fc783') },
  { words: ['فلافل', 'طعميه', 'falafel'], photo: u('1547058881-aa0edd92aab3') },
  { words: ['حمص', 'hummus', 'houmous'], photo: u('1637949385162-e416fb15b2ce') },
  { words: ['كبسه', 'مندي', 'منسف', 'برياني', 'مقلوبه', 'مظبي', 'مضغوط', 'kabsa', 'mandi', 'mansaf', 'biryani', 'maqluba'], photo: u('1633945274405-b6c8069047b0') },
  { words: ['سوشي', 'sushi', 'maki'], photo: u('1579871494447-9811cf80d66c') },
  { words: ['بيتزا', 'pizza'], photo: u('1565299624946-b28f40a0ae38') },
  { words: ['برجر', 'برغر', 'بيرغر', 'بيرجر', 'burger'], photo: u('1568901346375-23c9450c58cd') },
  { words: ['باستا', 'معكرونه', 'مكرونه', 'سباغيتي', 'سباجيتي', 'فارفالي', 'بيني', 'تالياتيلي', 'فيتوتشيني', 'pasta', 'spaghetti', 'penne', 'farfalle', 'tagliatelle', 'fettuccine'], photo: u('1621996346565-e3dbc646d9a9') },
  { words: ['ايس كريم', 'آيس كريم', 'بوظه', 'جيلاتو', 'ice cream', 'gelato'], photo: u('1551024506-0bccd828d307') },
  { words: ['ميلك شيك', 'ميلكشيك', 'milkshake', 'milk shake'], photo: u('1577805947697-89e18249d767') },
  { words: ['كب كيك', 'cupcake'], photo: u('1563729784474-d77dbb933a9e') },
  { words: ['كيك', 'كعكه', 'تورته', 'cake', 'gateau'], photo: u('1578985545062-69928b1d9587') },
  { words: ['بقلاوه', 'baklava'], photo: u('1598110750624-207050c4f28c') },
  { words: ['كريب', 'crepe'], photo: u('1519676867240-f03562e64548') },
  { words: ['ريش', 'اضلاع', 'ribs'], photo: u('1544025162-d76694265947') },
  { words: ['مشاوي', 'مشويات', 'كباب', 'كفته', 'شيش', 'تكه', 'اوصال', 'kebab', 'kabab', 'kofta', 'shish', 'mixed grill'], photo: u('1555939594-58d7cb561ad1') },
  { words: ['ستيك', 'انتركوت', 'تندرلوين', 'steak', 'ribeye', 'entrecote', 'tenderloin'], photo: u('1600891964092-4316c288032e') },
  { words: ['روبيان', 'جمبري', 'قريدس', 'shrimp', 'prawn'], photo: u('1565680018434-b513d5e5fd47') },
  { words: ['سلمون', 'salmon'], photo: u('1519708227418-c8fd9a32b7a2') },
  { words: ['سمك', 'هامور', 'فيليه', 'fish', 'seabass', 'sea bass'], photo: u('1467003909585-2f8a72700288') },
  { words: ['دجاج مشوي', 'فروج مشوي', 'grilled chicken'], photo: u('1532550907401-a500c9a57435') },
  { words: ['دجاج', 'فراخ', 'فروج', 'chicken'], photo: u('1598103442097-8b74394b95c6') },
  { words: ['شوربه', 'حساء', 'soup'], photo: u('1547592166-23ac45744acd') },
  { words: ['طاجن', 'يخنه', 'tagine', 'stew'], photo: u('1541518763669-27fef04b14ea') },
  { words: ['شكشوكه', 'بيض', 'عجه', 'اومليت', 'egg', 'omelette', 'omelet', 'shakshuka'], photo: u('1525351484163-7529414344d8') },
  { words: ['فطور', 'افطار', 'breakfast'], photo: u('1533089860892-a7c6f0a88666') },
  { words: ['سلطه', 'تبوله', 'فتوش', 'salad', 'tabbouleh', 'fattoush'], photo: u('1512621776951-a57141f2eefd') },
  { words: ['ساندويش', 'سندويش', 'ساندوتش', 'سندوتش', 'توست', 'sandwich', 'toast', 'panini'], photo: u('1528735602780-2552fd46c7af') },
  { words: ['بطاطا مقليه', 'بطاطس مقليه', 'فرايز', 'fries'], photo: u('1665117861973-fffa50c1afec') },
  { words: ['ارز', 'رز', 'rice'], photo: u('1512058564366-18510be2db19') },
  { words: ['عصير برتقال', 'برتقال', 'orange juice'], photo: u('1600271886742-f049cd451bba') },
  { words: ['سموذي', 'عصير', 'smoothie', 'juice'], photo: u('1622597467836-f3285f2131b8') },
  { words: ['قهوه', 'كابتشينو', 'كابوتشينو', 'لاتيه', 'اسبريسو', 'coffee', 'latte', 'cappuccino', 'espresso'], photo: u('1509042239860-f550ce710b93') },
  { words: ['شاي', 'كرك', 'tea', 'karak'], photo: u('1544787219-7f47ccb76574') },
  { words: ['خبز', 'bread', 'sourdough'], photo: u('1509440159596-0249088772ff') },
]

/** Letters that are written several ways fold to one, and marks are dropped,
 *  so "كبسة" and "كبسه", or "طعمية" and "طعميه", are the same word here. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

const FOLDED = KINDS.map((k) => ({ words: k.words.map(fold), photo: k.photo }))

/** Whole words only, so "tea" is not found in "steak" and "رز" (rice) is not
 *  found in "كرز" (cherries). An Arabic word may carry ال, بال, وال, و, ب or
 *  لل in front, so "السلطه" is still سلطه. A phrase of two words is matched
 *  as it stands. */
const PREFIXES = ['', 'ال', 'بال', 'وال', 'و', 'ب', 'لل']
function has(tokens: string[], word: string): boolean {
  if (word.includes(' ')) return (' ' + tokens.join(' ') + ' ').includes(' ' + word + ' ')
  return tokens.some((t) => PREFIXES.some((p) => t === p + word))
}

/** A photo that shows this dish, or undefined when none of ours does. */
export function dishPhoto(name: string | undefined | null): string | undefined {
  if (!name) return undefined
  const tokens = fold(name).split(/[^\p{L}]+/u).filter(Boolean)
  for (const k of FOLDED) if (k.words.some((w) => has(tokens, w))) return k.photo
  return undefined
}

/**
 * The four stock photos the generator used to hand out in order, whatever the
 * dishes were. Sites saved before this file existed still carry them, so the
 * renderer swaps them for a photo that matches, or none. An owner's own upload
 * is never one of these and is always shown as it is.
 */
const OLD_STOCK = [
  '1565299624946-b28f40a0ae38',
  '1544025162-d76694265947',
  '1473093295043-cdd812d0e601',
  '1551024506-0bccd828d307',
]

export function shownDishPhoto(dish: { name?: string; image?: string }): string | undefined {
  const img = dish.image
  if (!img) return undefined
  if (img.includes('images.unsplash.com') && OLD_STOCK.some((id) => img.includes(id))) return dishPhoto(dish.name)
  return img
}
