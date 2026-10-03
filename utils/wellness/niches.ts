import type { WellnessStylePresetId } from './types'

/**
 * Niche packs for the wellness generator.
 *
 * One template serves a massage center, a nail bar and a nutrition clinic, so
 * the owner picks their niche first and everything the owner did not supply
 * comes from that niche's pack: the fallback photos, the icon shortlist the AI
 * picks from, the starter sessions in the wizard, the default colour style and
 * the voice the copy is written in.
 *
 * Photos are hand-picked Unsplash IDs, each looked at before it went in. The
 * owner's own uploads always win over these. The house rule for every photo
 * here: no women (no women's hands, nails or legs either), no visible tattoos;
 * where a person appears it is a man, and tools, products and empty rooms come
 * first. Each niche keeps several photos and each business gets its own,
 * picked from a hash of its name, so the same business always keeps the same
 * ones.
 */

export type WellnessNicheId =
  | 'massage'
  | 'spa'
  | 'skincare'
  | 'yoga'
  | 'meditation'
  | 'hair'
  | 'nails'
  | 'sauna'
  | 'center'
  | 'physio'
  | 'nutrition'
  | 'aesthetic'
  | 'gym'

export type WellnessStarterSession = { name: string; category: string; duration: string; description: string }

export type WellnessNiche = {
  id: WellnessNicheId
  /** Arabic label on the picker. */
  label: string
  /** One-line hint under the label. */
  hint: string
  /** Default for the "type" field when the owner has not typed one. */
  type: string
  /** Picker icon (a registry key). */
  icon: string
  preset: WellnessStylePresetId
  categories: string[]
  starters: WellnessStarterSession[]
  /** Hero and booking candidates; each business gets one of each (pickWellnessPhotos). */
  photos: { hero: string[]; booking: string[]; space: string[] }
  /**
   * Stand-in team for owners who add none: roles, not invented people. The
   * photos are the niche's tools and rooms, or a man's portrait, never a woman.
   */
  team: { title: string; specialty: string; photo: string }[]
  /** Icon names the AI should choose from for this niche. */
  icons: string[]
  /** English brief for the copywriter: who the clients are and how to talk to them. */
  voice: string
  /** Words that would read wrong for this niche. */
  avoid: string[]
  /** Arabic/English keywords used to guess the niche from a typed type. */
  keywords: string[]
}

export function unsplash(id: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`
}

/** A small stable hash (FNV-1a) of a business name: the same name, the same photos. */
export function photoSeed(key?: string | null): number {
  let h = 0x811c9dc5
  for (const ch of (key || '').trim().toLowerCase()) {
    h ^= ch.codePointAt(0) || 0
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/** One photo from a pack for this seed, skipping `avoid` (the hero) when the pack has another. */
export function pickPhoto(pool: string[], seed: number, avoid?: string): string {
  const rest = pool.filter((id) => id !== avoid)
  const from = rest.length ? rest : pool
  return from[seed % from.length]
}

export const WELLNESS_NICHES: WellnessNiche[] = [
  {
    id: 'massage',
    label: 'مركز مساج',
    hint: 'مساج علاجي واسترخاء',
    type: 'مركز مساج',
    icon: 'care',
    preset: 'forest',
    categories: ['علاجي', 'استرخاء', 'رياضي', 'للنساء', 'للثنائي', 'أخرى'],
    starters: [
      { name: 'مساج الرقبة والكتفين', category: 'علاجي', duration: '45 دقيقة', description: '' },
      { name: 'مساج الأنسجة العميقة', category: 'علاجي', duration: '60 دقيقة', description: '' },
      { name: 'مساج سويدي للاسترخاء', category: 'استرخاء', duration: '60 دقيقة', description: '' },
    ],
    // Hero: massage room with orange walls and a wooden table · massage bed by a window.
    // Booking: amber dropper bottle on a turned stand · rolled towels and tea lights.
    photos: {
      hero: ['1772378452022-94ee7971fe80', '1787651343620-8d5303006ecb'],
      booking: ['1608571423539-e951b9b3871e', '1706795033917-dee116e7cba2'],
      space: ['1620733723572-11c53f73a416', '1787651343599-92563927b750', '1787651343496-35b3666dd7d2', '1630226040750-d934f017f0e4'],
    },
    team: [
      { title: 'معالج مساج علاجي', specialty: 'الرقبة والظهر · الأنسجة العميقة', photo: '1560250097-0b93528c311a' },
      { title: 'معالج مساج رياضي', specialty: 'الإصابات · الاستشفاء بعد التمرين', photo: '1472099645785-5658abf4ff4e' },
      { title: 'معالج استرخاء', specialty: 'السويدي · الأحجار الساخنة', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['care', 'heartbeat', 'timer', 'leaf', 'water', 'users', 'calendar-check', 'secure'],
    voice:
      'A massage center. Clients are office workers, drivers, athletes and new mothers with real pain: stiff neck, lower back, tired legs. Talk about the pain and the relief in plain words. Mention pressure the client chooses, a short talk before the session, and privacy (separate rooms for women where relevant).',
    avoid: ['sanctuary', 'journey', 'transformation', 'ملاذ', 'رحلة'],
    keywords: ['مساج', 'تدليك', 'massage'],
  },
  {
    id: 'spa',
    label: 'سبا وحمام مغربي',
    hint: 'حمام، سبا، عناية بالجسم',
    type: 'سبا وحمام مغربي',
    icon: 'spa',
    preset: 'zen',
    categories: ['حمام مغربي', 'مساج', 'عناية بالجسم', 'عناية بالوجه', 'باقات', 'أخرى'],
    starters: [
      { name: 'حمام مغربي كامل', category: 'حمام مغربي', duration: '60 دقيقة', description: '' },
      { name: 'مساج بالزيوت العطرية', category: 'مساج', duration: '60 دقيقة', description: '' },
      { name: 'باقة العروس', category: 'باقات', duration: '3 ساعات', description: '' },
    ],
    // Hero: pump bottle, towel and tulips · rolled towels and a candle under fairy lights.
    // Booking: marble hammam basins and brass taps · rolled towels and tea lights.
    photos: {
      hero: ['1540555700478-4be289fbecef', '1706795033855-eee02f726868'],
      booking: ['1659614536075-2cf8f82cf9db', '1706795033917-dee116e7cba2'],
      space: ['1507652313519-d4e9174996dd', '1620733723572-11c53f73a416', '1760722974657-f64bce2f9cc5', '1523471826770-c437b4636fe6'],
    },
    team: [
      { title: 'مسؤول الحمام المغربي', specialty: 'التقشير بالكيس · الصابون البلدي', photo: '1560250097-0b93528c311a' },
      { title: 'معالج مساج', specialty: 'الزيوت العطرية · الاسترخاء', photo: '1472099645785-5658abf4ff4e' },
      { title: 'أخصائي عناية بالجسم', specialty: 'الماسكات · الترطيب', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['spa', 'water', 'flower', 'leaf', 'care', 'moon', 'sparkles', 'users'],
    voice:
      'A day spa with hammam. Clients come to be looked after for a few hours: before a wedding, after a hard month, as a gift. Describe what happens step by step (steam, scrub with kessa, black soap, rinse, tea after). Warm and generous, never vague.',
    avoid: ['journey', 'transformation', 'life-changing'],
    keywords: ['سبا', 'حمام', 'مغربي', 'spa', 'hammam'],
  },
  {
    id: 'skincare',
    label: 'عناية بالبشرة',
    hint: 'تنظيف بشرة، فيشيال',
    type: 'مركز عناية بالبشرة',
    icon: 'cosmetics',
    preset: 'bloom',
    categories: ['تنظيف', 'فيشيال', 'علاج', 'نضارة', 'أخرى'],
    starters: [
      { name: 'تنظيف بشرة عميق', category: 'تنظيف', duration: '60 دقيقة', description: '' },
      { name: 'هيدرافيشيال', category: 'فيشيال', duration: '60 دقيقة', description: '' },
      { name: 'جلسة لحب الشباب', category: 'علاج', duration: '45 دقيقة', description: '' },
    ],
    // Hero: plain white tube among water drops · amber bottles and tubes on a dark table.
    // Booking: amber dropper bottle on a turned stand · reed diffuser, towel and candles.
    photos: {
      hero: ['1616750819456-5cdee9b85d22', '1631730359585-38a4935cbec4'],
      booking: ['1608571423539-e951b9b3871e', '1620733723572-11c53f73a416'],
      space: ['1786937680099-779e1da6f7f7', '1760722974657-f64bce2f9cc5', '1620733723572-11c53f73a416', '1631730359585-38a4935cbec4'],
    },
    team: [
      { title: 'أخصائية بشرة', specialty: 'التنظيف العميق · الهيدرافيشيال', photo: '1616750819456-5cdee9b85d22' },
      { title: 'أخصائية علاج حب الشباب', specialty: 'التقشير · العناية المنزلية', photo: '1608571423539-e951b9b3871e' },
      { title: 'استشارية العناية', specialty: 'تحليل البشرة · الخطط الشهرية', photo: '1631730359585-38a4935cbec4' },
    ],
    icons: ['cosmetics', 'water', 'vision', 'sun', 'verified', 'calendar-check', 'leaf', 'sparkles'],
    voice:
      'A skin care center. Clients have tried many products and are tired of guessing. Build trust: look at the skin first, say what it needs and what it does not, be honest about how many sessions and how long results take. Specific skin problems (acne, dark spots, dryness) in everyday words.',
    avoid: ['flawless', 'miracle', 'glass skin', 'journey'],
    keywords: ['بشرة', 'فيشيال', 'وجه', 'skin', 'facial'],
  },
  {
    id: 'yoga',
    label: 'يوغا وبيلاتس',
    hint: 'حصص جماعية وخاصة',
    type: 'استوديو يوغا وبيلاتس',
    icon: 'meditation',
    preset: 'zen',
    categories: ['يوغا', 'بيلاتس', 'للمبتدئين', 'حوامل', 'اشتراك', 'أخرى'],
    starters: [
      { name: 'يوغا للمبتدئين', category: 'للمبتدئين', duration: '60 دقيقة', description: '' },
      { name: 'بيلاتس ماط', category: 'بيلاتس', duration: '60 دقيقة', description: '' },
      { name: 'اشتراك شهري مفتوح', category: 'اشتراك', duration: 'شهر', description: '' },
    ],
    // Hero: white studio with three mats and round windows · pilates reformers in a bright studio.
    // Booking: cork blocks on a mat · reformers and a tower by the plants.
    photos: {
      hero: ['1676496962536-d8ef110ff6f0', '1717500252709-05a73fc4f1da'],
      booking: ['1646239646963-b0b9be56d6b5', '1717500252297-b09508db7ceb'],
      space: ['1717500252297-b09508db7ceb', '1646239646963-b0b9be56d6b5', '1676496962536-d8ef110ff6f0', '1717500252709-05a73fc4f1da'],
    },
    team: [
      { title: 'مدرّب يوغا', specialty: 'المبتدئون · فينياسا', photo: '1560250097-0b93528c311a' },
      { title: 'مدرّب بيلاتس', specialty: 'تقوية الظهر · الماط', photo: '1472099645785-5658abf4ff4e' },
      { title: 'مدرّب تنفس واسترخاء', specialty: 'يين · التنفس', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['meditation', 'users', 'calendar-check', 'sun', 'leaf', 'heartbeat', 'timer', 'care'],
    voice:
      'A yoga and pilates studio. Many clients think they are not flexible or fit enough and quit gyms before. Make it feel easy to start: small classes, a teacher who corrects you by hand, beginner classes, a free first class if offered, a timetable that fits a working day. These are classes, not treatments.',
    avoid: ['journey', 'transformation', 'namaste', 'zen vibes'],
    keywords: ['يوغا', 'بيلاتس', 'yoga', 'pilates'],
  },
  {
    id: 'meditation',
    label: 'تأمل وتنفس',
    hint: 'تأمل، تنفس، حمام صوتي',
    type: 'مركز تأمل وتنفس',
    icon: 'mind',
    preset: 'forest',
    categories: ['تأمل', 'تنفس', 'حمام صوتي', 'ورش', 'أخرى'],
    starters: [
      { name: 'جلسة تأمل موجّهة', category: 'تأمل', duration: '45 دقيقة', description: '' },
      { name: 'تمارين تنفس للتوتر', category: 'تنفس', duration: '60 دقيقة', description: '' },
      { name: 'حمام صوتي', category: 'حمام صوتي', duration: '60 دقيقة', description: '' },
    ],
    // Hero: meditation hall with floor cushions and lattice windows · tatami room with a round garden window.
    // Booking: singing bowl on two books · quiet room with low tables.
    photos: {
      hero: ['1749642955698-ebe5e4579034', '1758970081655-a9c08d367e68'],
      booking: ['1746802401350-b99c6e692a05', '1764507887582-6e3f1fc100a6'],
      space: ['1764507887582-6e3f1fc100a6', '1746802401350-b99c6e692a05', '1758970081655-a9c08d367e68', '1620733723572-11c53f73a416'],
    },
    team: [
      { title: 'مرشد تأمل', specialty: 'التأمل الموجّه · النوم', photo: '1560250097-0b93528c311a' },
      { title: 'مدرّب تنفس', specialty: 'التوتر · التنفس الصندوقي', photo: '1472099645785-5658abf4ff4e' },
      { title: 'معالج حمام صوتي', specialty: 'الأوعية · الاسترخاء', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['mind', 'moon', 'leaf', 'waves', 'users', 'timer', 'calendar-check', 'care'],
    voice:
      'A meditation and breathwork center. Clients are stressed, sleep badly, or have busy heads. Speak about real results they notice (falling asleep faster, a calmer morning) without medical claims. Simple instructions, no spiritual jargon.',
    avoid: ['chakra', 'energy healing', 'journey', 'transformation', 'awakening'],
    keywords: ['تأمل', 'تنفس', 'صوتي', 'meditation', 'breath'],
  },
  {
    id: 'hair',
    label: 'صالون تجميل',
    hint: 'شعر، مكياج، عرائس',
    type: 'صالون تجميل نسائي',
    icon: 'salon',
    preset: 'noir',
    categories: ['قص وتصفيف', 'صبغة', 'علاج الشعر', 'مكياج', 'عرائس', 'أخرى'],
    starters: [
      { name: 'قص وتصفيف', category: 'قص وتصفيف', duration: '60 دقيقة', description: '' },
      { name: 'صبغة كاملة', category: 'صبغة', duration: '2 ساعة', description: '' },
      { name: 'مكياج سهرة', category: 'مكياج', duration: '60 دقيقة', description: '' },
    ],
    // Hero: row of wash basins and chairs · styling chair by a white brick wall.
    // Booking: hair dryer, brush and comb · scissors and combs on a towel.
    photos: {
      hero: ['1637777269308-6a072f24e8a4', '1626383120723-2a941488860d'],
      booking: ['1522336284037-91f7da073525', '1549271568-e87e07c5406b'],
      space: ['1626379501846-0df4067b8bb9', '1781450090585-1a511b7066d9', '1637777269327-c4d5c7944d7b', '1626383120723-2a941488860d'],
    },
    team: [
      { title: 'خبيرة صبغة', specialty: 'الصبغة · الهايلايت', photo: '1549271568-e87e07c5406b' },
      { title: 'مصففة شعر', specialty: 'القص · التسريحات', photo: '1522336284037-91f7da073525' },
      { title: 'خبيرة مكياج', specialty: 'السهرات · العرائس', photo: '1626379501846-0df4067b8bb9' },
    ],
    icons: ['salon', 'cosmetics', 'sparkles', 'calendar-check', 'users', 'timer', 'secure', 'verified'],
    voice:
      'A women\'s beauty salon (hair, color, makeup, brides). Clients care about the result looking like the photo they showed, about hygiene, and about not waiting. Talk about consultation before color, brands used if given, bridal trials, and on-time appointments. Friendly and confident, like a stylist talking to a client.',
    avoid: ['sanctuary', 'journey', 'transformation', 'ملاذ'],
    keywords: ['صالون', 'كوافير', 'شعر', 'مكياج', 'salon', 'hair'],
  },
  {
    id: 'nails',
    label: 'أظافر',
    hint: 'مانيكير، باديكير، جل',
    type: 'صالون أظافر',
    icon: 'sparkle',
    preset: 'bloom',
    categories: ['مانيكير', 'باديكير', 'جل وأكريليك', 'رسم أظافر', 'أخرى'],
    starters: [
      { name: 'مانيكير كلاسيك', category: 'مانيكير', duration: '45 دقيقة', description: '' },
      { name: 'باديكير سبا', category: 'باديكير', duration: '60 دقيقة', description: '' },
      { name: 'جل مع رسم', category: 'جل وأكريليك', duration: '75 دقيقة', description: '' },
    ],
    // Hero: manicure tools and file on a towel · six polish bottles on white.
    // Booking: manicure and pedicure tools on a blue towel · open bottle of pink polish.
    photos: {
      hero: ['1775500835259-d3b3f6d6e2f2', '1636019411401-82485711b6ba'],
      booking: ['1779636198585-658170ee0283', '1692881423829-9a2f80d7a84d'],
      space: ['1602585578130-c9076e09330d', '1636019411480-58321fcb11ce', '1663229050017-503dbebdd573', '1631730359585-38a4935cbec4'],
    },
    team: [
      { title: 'فنية أظافر', specialty: 'الجل · الرسم على الأظافر', photo: '1636019411401-82485711b6ba' },
      { title: 'فنية مانيكير وباديكير', specialty: 'العناية · التنظيف', photo: '1779636198585-658170ee0283' },
      { title: 'فنية تركيب أظافر', specialty: 'الأكريليك · الإطالة', photo: '1663229050017-503dbebdd573' },
    ],
    icons: ['sparkle', 'secure', 'timer', 'palette', 'calendar-check', 'verified', 'care', 'sparkles'],
    voice:
      'A nail salon. Clients want neat, long-lasting nails, clean tools and a design that matches their idea. Mention sterilized tools, how many weeks gel lasts, bringing a photo for nail art. Light and friendly, short sentences.',
    avoid: ['sanctuary', 'journey', 'holistic', 'ملاذ'],
    keywords: ['أظافر', 'اظافر', 'مانيكير', 'باديكير', 'nail'],
  },
  {
    id: 'sauna',
    label: 'ساونا وبخار',
    hint: 'ساونا، بخار، حمام بارد',
    type: 'ساونا وغرف بخار',
    icon: 'spa',
    preset: 'noir',
    categories: ['ساونا', 'بخار', 'غطس بارد', 'طفو', 'اشتراك', 'أخرى'],
    starters: [
      { name: 'ساونا فنلندية', category: 'ساونا', duration: '45 دقيقة', description: '' },
      { name: 'غرفة بخار', category: 'بخار', duration: '30 دقيقة', description: '' },
      { name: 'ساونا ثم غطس بارد', category: 'غطس بارد', duration: '60 دقيقة', description: '' },
    ],
    // Hero: empty wooden sauna, benches and stone bowl.
    // Booking: freestanding tub in a stone bathroom.
    photos: {
      hero: ['1583416750470-965b2707b355'],
      booking: ['1507652313519-d4e9174996dd'],
      space: ['1540206395-68808572332f', '1620733723572-11c53f73a416', '1706795033917-dee116e7cba2', '1540555700478-4be289fbecef'],
    },
    team: [
      { title: 'مسؤول الساونا', specialty: 'الحرارة · أوقات الجلسات', photo: '1560250097-0b93528c311a' },
      { title: 'مدرّب استشفاء', specialty: 'الغطس البارد · التنفس', photo: '1472099645785-5658abf4ff4e' },
      { title: 'معالج مساج', specialty: 'ما بعد الساونا', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['spa', 'water', 'snow', 'timer', 'heartbeat', 'users', 'secure', 'calendar-check'],
    voice:
      'A sauna, steam and cold-plunge place. Clients come after training or work to warm up, sweat and reset. Be practical: temperatures, how long to stay in, drinking water, towels provided, separate times for women and men if given. Short, direct, a little energetic.',
    avoid: ['detox', 'journey', 'transformation', 'flush toxins'],
    keywords: ['ساونا', 'بخار', 'غطس', 'sauna', 'steam'],
  },
  {
    id: 'center',
    label: 'مركز عافية شامل',
    hint: 'عدة خدمات في مكان واحد',
    type: 'مركز عافية',
    icon: 'spa',
    preset: 'zen',
    categories: ['مساج', 'عناية بالوجه', 'يوغا', 'ساونا وبخار', 'علاج جسدي', 'باقات', 'أخرى'],
    starters: [
      { name: 'مساج استرخاء', category: 'مساج', duration: '60 دقيقة', description: '' },
      { name: 'عناية بالوجه', category: 'عناية بالوجه', duration: '60 دقيقة', description: '' },
      { name: 'باقة نصف يوم', category: 'باقات', duration: '3 ساعات', description: '' },
    ],
    // Hero: pump bottle, towel and tulips · rolled towels and a candle under fairy lights.
    // Booking: rolled towels and tea lights · amber dropper bottle on a turned stand.
    photos: {
      hero: ['1540555700478-4be289fbecef', '1706795033855-eee02f726868'],
      booking: ['1706795033917-dee116e7cba2', '1608571423539-e951b9b3871e'],
      space: ['1620733723572-11c53f73a416', '1583416750470-965b2707b355', '1772378452022-94ee7971fe80', '1646239646963-b0b9be56d6b5'],
    },
    team: [
      { title: 'معالج مساج', specialty: 'الاسترخاء · العلاجي', photo: '1560250097-0b93528c311a' },
      { title: 'أخصائي عناية', specialty: 'الوجه · الجسم', photo: '1472099645785-5658abf4ff4e' },
      { title: 'مدرّب يوغا', specialty: 'المبتدئون · التنفس', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['spa', 'care', 'mind', 'leaf', 'users', 'calendar-check', 'water', 'sun'],
    voice:
      'A wellness center with several services under one roof. Help the client choose: say who each service is for, suggest combinations, mention packages. Calm and clear, never flowery.',
    avoid: ['journey', 'transformation', 'life-changing', 'ملاذ'],
    keywords: ['عافية', 'wellness'],
  },
  {
    id: 'physio',
    label: 'علاج طبيعي',
    hint: 'تأهيل، إصابات، آلام',
    type: 'مركز علاج طبيعي',
    icon: 'therapy',
    preset: 'zen',
    categories: ['تقييم', 'تأهيل', 'إصابات رياضية', 'آلام الظهر والرقبة', 'أخرى'],
    starters: [
      { name: 'جلسة تقييم أولى', category: 'تقييم', duration: '45 دقيقة', description: '' },
      { name: 'علاج آلام الظهر والرقبة', category: 'آلام الظهر والرقبة', duration: '45 دقيقة', description: '' },
      { name: 'تأهيل بعد الإصابة', category: 'إصابات رياضية', duration: '60 دقيقة', description: '' },
    ],
    // Hero: treatment bench and a skeleton model · treatment room with an adjustable bench.
    // Booking: empty white treatment room · squat rack and dumbbells by a mirror.
    photos: {
      hero: ['1622878179314-0b25f2ad50e4', '1630226040750-d934f017f0e4'],
      booking: ['1551076805-e1869033e561', '1558611848-73f7eb4001a1'],
      space: ['1551076805-e1869033e561', '1630226040750-d934f017f0e4', '1622878179314-0b25f2ad50e4', '1558611848-73f7eb4001a1'],
    },
    team: [
      { title: 'أخصائي علاج طبيعي', specialty: 'الظهر والرقبة · التقييم', photo: '1560250097-0b93528c311a' },
      { title: 'أخصائي تأهيل رياضي', specialty: 'الإصابات · العودة للتمرين', photo: '1472099645785-5658abf4ff4e' },
      { title: 'أخصائي علاج يدوي', specialty: 'المفاصل · الحركة', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['therapy', 'heartbeat', 'clinic', 'verified', 'calendar-check', 'timer', 'users', 'secure'],
    voice:
      'A physiotherapy clinic. Clients are in pain or recovering from an injury or surgery and want to move normally again. Be clear and professional: assessment first, a plan with a number of sessions, exercises for home. Licensed therapists only if the owner says so. No promises of cure.',
    avoid: ['pamper', 'indulge', 'relax and unwind', 'journey', 'miracle'],
    keywords: ['طبيعي', 'تأهيل', 'فيزيو', 'physio', 'rehab'],
  },
  {
    id: 'nutrition',
    label: 'تغذية وحمية',
    hint: 'أخصائي تغذية، خطط أكل',
    type: 'عيادة تغذية',
    icon: 'nutrition',
    preset: 'zen',
    categories: ['استشارة', 'متابعة', 'خطة أكل', 'باقات', 'أخرى'],
    starters: [
      { name: 'استشارة أولى وقياس الجسم', category: 'استشارة', duration: '45 دقيقة', description: '' },
      { name: 'متابعة أسبوعية', category: 'متابعة', duration: '20 دقيقة', description: '' },
      { name: 'باقة 3 أشهر', category: 'باقات', duration: '3 أشهر', description: '' },
    ],
    // Hero: salad bowl with eggs and avocado · vegetable bowl with chickpeas.
    // Booking: vegetable bowl with chickpeas · chopping board of vegetables.
    photos: {
      hero: ['1490645935967-10de6ba17061', '1512621776951-a57141f2eefd'],
      booking: ['1512621776951-a57141f2eefd', '1466637574441-749b8f19452f'],
      space: ['1466637574441-749b8f19452f', '1473093295043-cdd812d0e601', '1490645935967-10de6ba17061', '1512621776951-a57141f2eefd'],
    },
    team: [
      { title: 'أخصائي تغذية', specialty: 'إنقاص الوزن · الخطط العملية', photo: '1560250097-0b93528c311a' },
      { title: 'أخصائي تغذية رياضية', specialty: 'بناء العضل · الأداء', photo: '1472099645785-5658abf4ff4e' },
      { title: 'مسؤول المتابعة', specialty: 'القياسات · المتابعة الأسبوعية', photo: '1568602471122-7832951cc4c5' },
    ],
    icons: ['nutrition', 'greens', 'metrics', 'calendar-check', 'heartbeat', 'users', 'verified', 'timer'],
    voice:
      'A nutritionist or diet clinic. Clients have tried diets that failed and fear being hungry or giving up the food they love. Speak about food they actually eat at home, weekly follow-up, body measurements, eating at family gatherings. No miracle weight loss numbers.',
    avoid: ['detox', 'miracle', 'lose 10 kg in a week', 'journey', 'transformation'],
    keywords: ['تغذية', 'حمية', 'دايت', 'nutrition', 'diet'],
  },
  {
    id: 'aesthetic',
    label: 'عيادة ليزر وتجميل',
    hint: 'ليزر، فيلر، بوتوكس',
    type: 'عيادة ليزر وتجميل',
    icon: 'clinic',
    preset: 'bloom',
    categories: ['ليزر', 'حقن', 'بشرة', 'استشارة', 'أخرى'],
    starters: [
      { name: 'استشارة مع الطبيبة', category: 'استشارة', duration: '30 دقيقة', description: '' },
      { name: 'ليزر إزالة الشعر', category: 'ليزر', duration: '30 دقيقة', description: '' },
      { name: 'نضارة البشرة', category: 'بشرة', duration: '45 دقيقة', description: '' },
    ],
    // Hero: clinic corridor with framed prints and armchairs · empty white treatment room.
    // Booking: amber bottles and tubes on a dark table · plain white tube among water drops.
    photos: {
      hero: ['1787496994867-939269b4d323', '1551076805-e1869033e561'],
      booking: ['1631730359585-38a4935cbec4', '1616750819456-5cdee9b85d22'],
      space: ['1551076805-e1869033e561', '1787496994867-939269b4d323', '1786937680099-779e1da6f7f7', '1620733723572-11c53f73a416'],
    },
    team: [
      { title: 'طبيبة تجميل', specialty: 'الاستشارة · الحقن', photo: '1631730359585-38a4935cbec4' },
      { title: 'أخصائية ليزر', specialty: 'إزالة الشعر · البشرة', photo: '1551076805-e1869033e561' },
      { title: 'أخصائية بشرة', specialty: 'النضارة · العناية بعد الجلسة', photo: '1616750819456-5cdee9b85d22' },
    ],
    icons: ['clinic', 'verified', 'secure', 'vision', 'calendar-check', 'cosmetics', 'users', 'timer'],
    voice:
      'A laser and cosmetic clinic. Clients worry about safety, pain, and looking unnatural. Lead with the doctor, a consultation first, the device used if given, natural results, and honest session counts. Calm and medical-professional, not salesy.',
    avoid: ['miracle', 'painless guaranteed', 'journey', 'transformation', 'flawless'],
    keywords: ['ليزر', 'تجميل', 'فيلر', 'بوتوكس', 'laser', 'aesthetic', 'clinic'],
  },
  {
    id: 'gym',
    label: 'جيم ولياقة',
    hint: 'جيم، EMS، تدريب شخصي',
    type: 'صالة رياضية (جيم)',
    icon: 'gym',
    preset: 'noir',
    categories: ['اشتراكات', 'تدريب شخصي', 'EMS', 'كلاسات', 'أخرى'],
    starters: [
      { name: 'اشتراك شهري', category: 'اشتراكات', duration: 'شهر', description: '' },
      { name: 'حصة تدريب شخصي', category: 'تدريب شخصي', duration: '60 دقيقة', description: '' },
      { name: 'جلسة EMS', category: 'EMS', duration: '20 دقيقة', description: '' },
    ],
    // Hero: dark weights floor, benches and racks · row of dumbbells in a warehouse gym · open industrial weights floor · dumbbell racks in black and white.
    // Booking: hand taking a hex dumbbell off the rack · dumbbells on a rack by a block wall · orange-rimmed dumbbells on a rack.
    photos: {
      hero: ['1689877020200-403d8542d95d', '1576678927484-cc907957088c', '1623874514711-0f321325f318', '1544033527-b192daee1f5b'],
      booking: ['1674834727149-00812f907676', '1597076537061-a6b58163aa45', '1741156229623-da94e6d7977d'],
      space: ['1558611848-73f7eb4001a1', '1778828494354-9b717d36dc99', '1623874514711-0f321325f318', '1576678927484-cc907957088c'],
    },
    team: [
      { title: 'مدرب لياقة', specialty: 'الأوزان · خطة التمرين', photo: '1576678927484-cc907957088c' },
      { title: 'مدرب شخصي', specialty: 'خسارة الوزن · بناء العضلات', photo: '1674834727149-00812f907676' },
      { title: 'مدرب EMS', specialty: 'جلسات EMS · المتابعة', photo: '1623874514711-0f321325f318' },
    ],
    icons: ['gym', 'heartbeat', 'timer', 'calendar-check', 'users', 'target', 'trophy', 'secure'],
    voice:
      'A gym or fitness studio (weights, cardio, personal training, EMS). Clients want to lose weight, get stronger or get back in shape and worry about not knowing the machines, crowded hours and quitting after a month. Talk about a coach who shows them the basics, a plan that fits their schedule, women-only hours if the owner gives them, and steady progress they can measure. No before/after promises, no kilos-in-a-month numbers.',
    avoid: ['beast mode', 'no pain no gain', 'shredded', 'journey', 'transformation', 'miracle'],
    keywords: ['جيم', 'صالة رياضية', 'لياقة', 'كمال أجسام', 'كروس فيت', 'ems', 'gym', 'fitness', 'crossfit'],
  },
]

export const DEFAULT_WELLNESS_NICHE: WellnessNicheId = 'center'

export function getWellnessNiche(id?: string | null): WellnessNiche | undefined {
  return WELLNESS_NICHES.find((n) => n.id === id)
}

/** The niche the owner picked, else a guess from what they typed, else the general center. */
export function resolveWellnessNiche(id?: string | null, typed?: string | null): WellnessNiche {
  const picked = getWellnessNiche(id)
  if (picked) return picked
  const text = (typed || '').toLowerCase()
  if (text) {
    const hit = WELLNESS_NICHES.find((n) => n.id !== 'center' && n.keywords.some((k) => text.includes(k.toLowerCase())))
    if (hit) return hit
  }
  return getWellnessNiche(DEFAULT_WELLNESS_NICHE)!
}

/** This business's hero and booking backdrop from its niche: never the same photo twice on one site. */
export function pickWellnessPhotos(niche: WellnessNiche, key?: string | null): { hero: string; booking: string } {
  const seed = photoSeed(key)
  const hero = pickPhoto(niche.photos.hero, seed)
  // The high bits pick the second photo, so it turns independently of the hero.
  return { hero, booking: pickPhoto(niche.photos.booking, seed >>> 16, hero) }
}
