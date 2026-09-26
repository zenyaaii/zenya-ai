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
 * owner's own uploads always win over these.
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
  photos: { hero: string; booking: string; space: string[] }
  /**
   * Stand-in team for owners who add none: roles, not invented people, and
   * photos that show no one's face in niches whose staff are mostly women.
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
    photos: {
      hero: '1544161515-4ab6ce6db874',
      booking: '1515377905703-c4788e51af15',
      space: ['1519823551278-64ac92734fb1', '1600334129128-685c5582fd35', '1596178060671-7a80dc8059ea', '1620733723572-11c53f73a416'],
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
    photos: {
      hero: '1540555700478-4be289fbecef',
      booking: '1600334089648-b0d9d3028eb2',
      space: ['1507652313519-d4e9174996dd', '1620733723572-11c53f73a416', '1596178060671-7a80dc8059ea', '1600334129128-685c5582fd35'],
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
    photos: {
      hero: '1570172619644-dfd03ed5d881',
      booking: '1512290923902-8a9f81dc236c',
      space: ['1552693673-1bf958298935', '1616394584738-fc6e612e71b9', '1629198688000-71f23e745b6e', '1598440947619-2c35fc9aa908'],
    },
    team: [
      { title: 'أخصائية بشرة', specialty: 'التنظيف العميق · الهيدرافيشيال', photo: '1598440947619-2c35fc9aa908' },
      { title: 'أخصائية علاج حب الشباب', specialty: 'التقشير · العناية المنزلية', photo: '1629198688000-71f23e745b6e' },
      { title: 'استشارية العناية', specialty: 'تحليل البشرة · الخطط الشهرية', photo: '1556228720-195a672e8a03' },
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
    photos: {
      hero: '1544367567-0f2fcb009e0b',
      booking: '1599901860904-17e6ed7083a0',
      space: ['1575052814086-f385e2e2ad1b', '1552196563-55cd4e45efb3', '1603988363607-e1e4a66962c6', '1506126613408-eca07ce68773'],
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
    photos: {
      hero: '1508672019048-805c876b67e2',
      booking: '1506126613408-eca07ce68773',
      space: ['1593811167562-9cef47bfc4d7', '1591343395902-1adcb454c4e2', '1552196563-55cd4e45efb3', '1620733723572-11c53f73a416'],
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
    photos: {
      hero: '1562322140-8baeececf3df',
      booking: '1595476108010-b4d1f102b1b1',
      space: ['1600948836101-f9ffda59d250', '1560066984-138dadb4c035', '1522337360788-8b13dee7a37e', '1487412947147-5cebf100ffc2'],
    },
    team: [
      { title: 'خبيرة صبغة', specialty: 'الصبغة · الهايلايت', photo: '1522337360788-8b13dee7a37e' },
      { title: 'مصففة شعر', specialty: 'القص · التسريحات', photo: '1560066984-138dadb4c035' },
      { title: 'خبيرة مكياج', specialty: 'السهرات · العرائس', photo: '1600948836101-f9ffda59d250' },
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
    photos: {
      hero: '1604654894610-df63bc536371',
      booking: '1610992015732-2449b76344bc',
      space: ['1519415510236-718bdfcd89c8', '1600948836101-f9ffda59d250', '1598440947619-2c35fc9aa908', '1631730359585-38a4935cbec4'],
    },
    team: [
      { title: 'فنية أظافر', specialty: 'الجل · الرسم على الأظافر', photo: '1604654894610-df63bc536371' },
      { title: 'فنية مانيكير وباديكير', specialty: 'العناية · التنظيف', photo: '1610992015732-2449b76344bc' },
      { title: 'فنية تركيب أظافر', specialty: 'الأكريليك · الإطالة', photo: '1519415510236-718bdfcd89c8' },
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
    photos: {
      hero: '1583416750470-965b2707b355',
      booking: '1507652313519-d4e9174996dd',
      space: ['1540206395-68808572332f', '1620733723572-11c53f73a416', '1600334089648-b0d9d3028eb2', '1540555700478-4be289fbecef'],
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
    photos: {
      hero: '1540555700478-4be289fbecef',
      booking: '1600334089648-b0d9d3028eb2',
      space: ['1575052814086-f385e2e2ad1b', '1544161515-4ab6ce6db874', '1552693673-1bf958298935', '1583416750470-965b2707b355'],
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
    photos: {
      hero: '1571019614242-c5c5dee9f50b',
      booking: '1584515933487-779824d29309',
      space: ['1519823551278-64ac92734fb1', '1519494026892-80bbd2d6fd0d', '1551076805-e1869033e561', '1518611012118-696072aa579a'],
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
    photos: {
      hero: '1490645935967-10de6ba17061',
      booking: '1512621776951-a57141f2eefd',
      space: ['1505576399279-565b52d4ac71', '1466637574441-749b8f19452f', '1473093295043-cdd812d0e601', '1576091160550-2173dba999ef'],
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
    photos: {
      hero: '1616394584738-fc6e612e71b9',
      booking: '1631730359585-38a4935cbec4',
      space: ['1551076805-e1869033e561', '1552693673-1bf958298935', '1519494026892-80bbd2d6fd0d', '1629198688000-71f23e745b6e'],
    },
    team: [
      { title: 'طبيبة تجميل', specialty: 'الاستشارة · الحقن', photo: '1631730359585-38a4935cbec4' },
      { title: 'أخصائية ليزر', specialty: 'إزالة الشعر · البشرة', photo: '1551076805-e1869033e561' },
      { title: 'أخصائية بشرة', specialty: 'النضارة · العناية بعد الجلسة', photo: '1629198688000-71f23e745b6e' },
    ],
    icons: ['clinic', 'verified', 'secure', 'vision', 'calendar-check', 'cosmetics', 'users', 'timer'],
    voice:
      'A laser and cosmetic clinic. Clients worry about safety, pain, and looking unnatural. Lead with the doctor, a consultation first, the device used if given, natural results, and honest session counts. Calm and medical-professional, not salesy.',
    avoid: ['miracle', 'painless guaranteed', 'journey', 'transformation', 'flawless'],
    keywords: ['ليزر', 'تجميل', 'فيلر', 'بوتوكس', 'laser', 'aesthetic', 'clinic'],
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
