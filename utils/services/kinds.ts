/**
 * The kinds of services business that draw their own page (NicheView) and
 * ask their own questions (NicheWizard). The barber is the one Anas approved
 * on 2026-11-10; every other kind reuses its page and changes only the words,
 * the default services, the questions and what the visitor looks for.
 *
 * The eight parts every kind keeps (the "balanced template"): hero, named
 * people, offer + price + duration, booking, Google proof, own photos,
 * fears/FAQ, map + hours. A fact we do not have is left out, never invented.
 */

export type NicheKind = 'barber' | 'gym' | 'beauty' | 'clinic' | 'car' | 'photo'

/**
 * The kinds that ship. Anas kept the barber page and its questions
 * (2026-11-11) and turned down the shared look for the others, so gym,
 * beauty, clinic, car repair and photo studio stay on their templates' own
 * wizards and lead builds until each gets a design of its own.
 */
export const LIVE_KINDS: readonly NicheKind[] = ['barber']
export const isLiveKind = (k: unknown): k is NicheKind => LIVE_KINDS.includes(k as NicheKind)

export type Look = { id: string; name: string; colors: { background: string; surface: string; text: string; muted: string; accent: string; primary: string; border: string } }

const L = (id: string, name: string, background: string, surface: string, text: string, muted: string, accent: string, border: string): Look =>
  ({ id, name, colors: { background, surface, text, muted, accent, primary: accent, border } })

const BRASS = L('brass', 'نحاسي ليلي', '#0d0c0a', '#151310', '#f2ede3', '#958d80', '#c4a35a', '#2a2722')
const OXBLOOD = L('oxblood', 'أحمر عتيق', '#100b0a', '#1a1210', '#f3ebe6', '#a1918a', '#b8483a', '#2e2220')
const PAPER = L('paper', 'ورقي فاتح', '#f3efe7', '#e9e3d8', '#1b1712', '#6c6458', '#1b1712', '#d8d0c2')
const IRON = L('iron', 'حديد وبرتقالي', '#0e0f10', '#17191b', '#f1f1ef', '#8f9396', '#e8622c', '#26292c')
const CHALK = L('chalk', 'طباشيري', '#f2f2ef', '#e6e6e1', '#141414', '#5e5e5a', '#141414', '#d6d6d0')
const ROSE = L('rose', 'وردي هادئ', '#f7f1ee', '#efe5e0', '#2a1d1b', '#7a6863', '#a8545e', '#e3d5cf')
const PLUM = L('plum', 'برقوقي ليلي', '#120d10', '#1c1419', '#f4ecef', '#a3949b', '#c98a9a', '#2e2329')
const MINT = L('mint', 'أبيض طبي', '#f4f7f6', '#e8eeec', '#10201c', '#5a6b66', '#0f766e', '#d5e0dc')
const NAVY = L('navy', 'كحلي هادئ', '#0c1219', '#131c26', '#eef2f6', '#8c99a7', '#5fa8d3', '#22303e')
// Car looks Anas picked from (2026-11-13): three blended sets. The wizard puts the two measured from the shop's photos first.
const AMBER = L('amber', 'غرافيت وكهرمان', '#121416', '#1a1d20', '#eeece7', '#97948d', '#e2a33e', '#2a2d30')
const SERVICE = L('service', 'أبيض الخدمة', '#f3f4f2', '#e8eae7', '#15191c', '#5c6469', '#1f4f7a', '#d7dbd8')
const SAND = L('sand', 'رملي وزيتوني', '#f2efe8', '#e7e2d8', '#1d1c18', '#6b665c', '#2f5a4c', '#dad4c8')
const INK = L('ink', 'حبر أسود', '#0b0b0b', '#141414', '#f2f2f0', '#8f8f8b', '#f2f2f0', '#262626')
// Photo studio (Anas picked «من صوره: نهاري» as the default, 2026-11-13). A built
// studio gets these from its own photos (lib/restaurant-build, light mood); the
// values below are that result for a sample studio, used when none were found.
const STUDIO_DAY = L('studio-day', 'من الصور: نهاري', '#f7f6f5', '#ffffff', '#261f1c', '#6f5b52', '#627140', '#e8e3e0')
const DARKROOM = L('darkroom', 'الغرفة المظلمة', '#0e0d0c', '#181614', '#f0ece4', '#9a948a', '#d8b47a', '#2a2622')
const PRINT = L('print', 'ورق الطباعة', '#f4f1ea', '#ebe6dc', '#1b1a17', '#6b665c', '#7c2d24', '#ddd7cb')
const DAYLIGHT = L('daylight', 'ضوء النهار', '#e7e9e7', '#dde0dd', '#141617', '#5c6266', '#2f4b5c', '#cdd1ce')

export type KindText = {
  id: NicheKind
  /** Three colour looks for the wizard; the first is the default. */
  looks: Look[]
  /** The kind as the owner picks it. */
  label: string
  /** What the place is called in a sentence: «الصالون», «النادي». */
  place: string
  /** Its people, as a heading, one of them, and "any of them". */
  team: string
  one: string
  any: string
  /** Default role for a new person in the wizard. */
  role: string
  /** Role that marks the owner. */
  ownerRole: string
  bookAt: (name: string) => string
  services: string
  /** The main call to action. */
  cta: string
  /** The booking section's line. */
  bookLine: string
  /** Strip from the shop name for the big headline. */
  prefix: RegExp
  suffix: RegExp
  /** The hero line. `named` = people customers name in reviews. */
  lede: (o: { named: string[]; area: string; audience?: string }) => string
  /** Audience choices in the wizard; the first is the default. */
  audiences?: string[]
  /** Chips: what each person is known for. */
  tags: string[]
  /** Starting service list: name, duration, on by default. */
  defaults: { name: string; duration: string; on: boolean }[]
  /** Starting questions. */
  faqs: string[]
  /** Terms the owner can state (gym: freeze/cancel; car: warranty). */
  terms?: { label: string; placeholder: string }[]
  /** Price unit hint in the wizard ("شهريًا" for a gym). */
  priceHint?: string
  /**
   * The kind's own questions (NicheExtra). Each key present adds that
   * question; the lists are the chips offered, the owner can add his own.
   */
  extras?: {
    offers?: string[]
    facilities?: string[]
    story?: { label: string; example: string }
    since?: boolean
    classes?: { names: string[] }
    perks?: { example: string }
    steps?: { title: string; text: string }[]
  }
  /** For the AI visitor and the photo judge. */
  visitor: { who: string; want: string; place: string }
  /** Words in a lead's kind or name that mean this kind. */
  match: RegExp
  /** The SEO noun: «حلاق في …». */
  seo: string
}

export const KIND: Record<NicheKind, KindText> = {
  barber: {
    looks: [BRASS, OXBLOOD, PAPER],
    id: 'barber', label: 'صالون حلاقة', place: 'الصالون', team: 'الحلاقون', one: 'الحلاق', any: 'أي حلاق', role: 'حلاق', ownerRole: 'صاحب الصالون',
    bookAt: (n) => `احجز عند ${n}`, services: 'الخدمات', cta: 'احجز موعدك',
    bookLine: 'اختر الخدمة والحلاق والوقت. يصل طلبك إلى الصالون، ويؤكّد لك الموعد على واتساب.',
    prefix: /^(صالون|محل|حلاق(?:ة)?|باربر)\s+/, suffix: /\s+(للرجال|رجالي|للحلاقة)$/,
    lede: ({ named, area, audience }) => `صالون ${audience === 'رجال وأطفال' ? 'للرجال والأطفال' : 'رجالي'} في ${area}.${named.length >= 2 ? ` زبائننا يطلبون ${named.slice(0, 3).join(' و')} بالاسم.` : ''}`,
    audiences: ['رجال', 'رجال وأطفال'],
    tags: ['قص كلاسيكي', 'تدريج', 'لحية', 'أطفال', 'عرسان', 'بروتين', 'صبغة', 'تنظيف بشرة'],
    defaults: [
      { name: 'قص شعر', duration: '30 دقيقة', on: true }, { name: 'تحديد اللحية', duration: '15 دقيقة', on: true }, { name: 'شعر ولحية', duration: '45 دقيقة', on: true },
      { name: 'حلاقة أطفال', duration: '20 دقيقة', on: false }, { name: 'تنظيف بشرة', duration: '30 دقيقة', on: false }, { name: 'بروتين للشعر', duration: '90 دقيقة', on: false },
      { name: 'صبغة شعر أو لحية', duration: '40 دقيقة', on: false }, { name: 'تجهيز عريس', duration: '', on: false },
    ],
    faqs: ['هل أحتاج موعدًا، أم أحضر مباشرة؟', 'كم أنتظر عادة؟', 'هل السعر المكتوب هو ما أدفعه؟', 'هل تحلقون للأطفال؟', 'هل يوجد موقف سيارات قريب؟'],
    visitor: { who: 'a man', want: 'book a haircut there this week', place: "men's barbershop" },
    match: /حلاق|باربر|barber/i, seo: 'حلاق',
  },
  gym: {
    looks: [IRON, CHALK, NAVY],
    id: 'gym', label: 'نادٍ رياضي', place: 'النادي', team: 'المدربون', one: 'المدرب', any: 'أي مدرب', role: 'مدرب', ownerRole: 'صاحب النادي',
    bookAt: (n) => `تمرّن مع ${n}`, services: 'الاشتراكات', cta: 'احجز حصة تجربة',
    bookLine: 'اختر الاشتراك أو الحصة، والمدرب والوقت. يصل طلبك إلى النادي، ويرد عليك على واتساب.',
    prefix: /^(نادي|نادى|جيم|صالة)\s+/, suffix: /\s+(جيم|الرياضي|للياقة(?: البدنية)?|فتنس)$/,
    lede: ({ named, area, audience }) => `نادٍ رياضي${audience && audience !== 'رجال' ? ` (${audience})` : ''} في ${area}.${named.length >= 2 ? ` أعضاؤنا يذكرون ${named.slice(0, 3).join(' و')} بالاسم.` : ''}`,
    audiences: ['رجال', 'رجال وسيدات بأوقات منفصلة', 'مختلط'],
    tags: ['تخسيس', 'بناء عضل', 'كروس فت', 'ملاكمة', 'تدريب شخصي', 'تغذية', 'إصابات'],
    defaults: [
      { name: 'اشتراك شهري', duration: 'شهر', on: true }, { name: 'اشتراك 3 أشهر', duration: '3 أشهر', on: true }, { name: 'اشتراك سنوي', duration: 'سنة', on: false },
      { name: 'تدريب شخصي', duration: '10 حصص', on: false }, { name: 'حصة يومية', duration: 'يوم', on: false }, { name: 'حصص جماعية', duration: '', on: false },
    ],
    faqs: ['هل أستطيع تجميد الاشتراك؟', 'هل أستطيع إلغاء الاشتراك واسترجاع المبلغ؟', 'متى يكون النادي مزدحمًا؟', 'هل يوجد مدرب يتابعني وأنا مبتدئ؟', 'هل توجد خزائن ودُش؟', 'هل يوجد موقف سيارات؟'],
    terms: [{ label: 'التجميد', placeholder: 'حتى أسبوعين في الاشتراك الفصلي' }, { label: 'الإلغاء', placeholder: 'خلال 3 أيام من الدفع، بدون أسئلة' }, { label: 'رسوم التسجيل', placeholder: 'لا توجد' }],
    priceHint: 'السعر الكامل للاشتراك',
    extras: {
      offers: ['أجهزة حديد', 'كارديو', 'كروس فت', 'ملاكمة', 'فنون قتالية', 'يوغا', 'حصص جماعية', 'تدريب شخصي', 'برامج تغذية', 'تأهيل إصابات'],
      facilities: ['غرف تبديل', 'دش', 'خزائن', 'ساونا', 'بخار', 'مسبح', 'موقف سيارات', 'مكيّف', 'مياه مجانية', 'قسم للسيدات بأوقات منفصلة'],
      story: { label: 'احكِ عن ناديك في جملتين', example: 'نادٍ صغير في الملقا، كل مشترك فيه له برنامج ومدرب يعرفه بالاسم. افتتحناه لأن أغلب الأندية حولنا مزدحمة ولا أحد يتابع المبتدئ.' },
      since: true,
      classes: { names: ['كروس فت', 'ملاكمة', 'سبينينغ', 'يوغا', 'HIIT', 'دائري'] },
      perks: { example: 'دخول كل الأجهزة\nجلسة قياس جسم شهرية\nبرنامج تمارين مكتوب' },
      steps: [
        { title: 'زيارة وتجربة', text: 'تعال وجرّب النادي يومًا مجانًا.' },
        { title: 'قياس وبرنامج', text: 'يقيس المدرب وزنك ويكتب لك برنامجًا يناسب هدفك.' },
        { title: 'متابعة', text: 'نراجع تقدّمك كل شهر ونعدّل البرنامج.' },
      ],
    },
    visitor: { who: 'a person', want: 'sign up at this gym this month', place: 'gym' },
    match: /جيم|نادي|نادى|لياقة|كمال اجسام|كروس|gym|fitness|crossfit/i, seo: 'نادي رياضي',
  },
  beauty: {
    looks: [ROSE, PLUM, PAPER],
    id: 'beauty', label: 'مركز تجميل', place: 'المركز', team: 'فريقنا', one: 'الأخصائية', any: 'أي أخصائية', role: 'أخصائية', ownerRole: 'صاحبة المركز',
    bookAt: (n) => `احجزي عند ${n}`, services: 'الخدمات', cta: 'احجزي موعدك',
    bookLine: 'اختاري الخدمة والأخصائية والوقت. يصل طلبك إلى المركز، ويؤكّد لك الموعد على واتساب.',
    prefix: /^(مركز|صالون|بيوتي|سبا)\s+/, suffix: /\s+(للتجميل|للسيدات|النسائي|بيوتي)$/,
    lede: ({ named, area }) => `مركز تجميل في ${area}.${named.length >= 2 ? ` زبوناتنا يطلبن ${named.slice(0, 3).join(' و')} بالاسم.` : ''}`,
    tags: ['شعر', 'صبغة', 'أظافر', 'بشرة', 'مكياج', 'عرائس', 'ليزر', 'حواجب'],
    defaults: [
      { name: 'قص وتصفيف الشعر', duration: '45 دقيقة', on: true }, { name: 'صبغة', duration: '120 دقيقة', on: true }, { name: 'مناكير وباديكير', duration: '60 دقيقة', on: true },
      { name: 'تنظيف بشرة', duration: '60 دقيقة', on: false }, { name: 'مكياج مناسبات', duration: '60 دقيقة', on: false }, { name: 'تجهيز عروس', duration: '', on: false },
      { name: 'رسم الحواجب', duration: '20 دقيقة', on: false },
    ],
    faqs: ['هل أحتاج موعدًا؟', 'هل المنتجات المستخدمة أصلية؟', 'هل السعر المكتوب هو ما أدفعه؟', 'هل يوجد مكان خاص ومغلق للسيدات؟', 'هل تأتون إلى البيت؟', 'كم تدوم النتيجة؟'],
    visitor: { who: 'a woman', want: 'book an appointment there', place: 'beauty centre' },
    match: /تجميل|بيوتي|اظافر|أظافر|مكياج|beauty|nail|spa|سبا/i, seo: 'مركز تجميل',
  },
  clinic: {
    looks: [MINT, NAVY, CHALK],
    id: 'clinic', label: 'عيادة', place: 'العيادة', team: 'الأطباء', one: 'الطبيب', any: 'أي طبيب', role: 'طبيب', ownerRole: 'صاحب العيادة',
    bookAt: (n) => `احجز عند ${n}`, services: 'العلاجات', cta: 'احجز موعدك',
    bookLine: 'اختر العلاج والطبيب والوقت. يصل طلبك إلى العيادة، وتؤكّد لك الموعد على واتساب.',
    prefix: /^(عيادة|عيادات|مركز)\s+/, suffix: /\s+(لطب الأسنان|للأسنان|الطبية|الطبي)$/,
    lede: ({ named, area }) => `عيادة في ${area}.${named.length >= 1 ? ` مرضانا يذكرون ${named.slice(0, 3).join(' و')} بالاسم.` : ''}`,
    tags: ['تقويم', 'زراعة', 'تجميل', 'أطفال', 'علاج عصب', 'تبييض', 'جراحة'],
    defaults: [
      { name: 'كشف واستشارة', duration: '20 دقيقة', on: true }, { name: 'تنظيف', duration: '30 دقيقة', on: true }, { name: 'حشوة', duration: '45 دقيقة', on: true },
      { name: 'علاج عصب', duration: '', on: false }, { name: 'تبييض', duration: '60 دقيقة', on: false }, { name: 'تقويم', duration: '', on: false }, { name: 'زراعة', duration: '', on: false },
    ],
    faqs: ['هل يؤلم العلاج؟', 'هل تقبلون التأمين؟ وأيّ شركات؟', 'كم سعر الكشف؟', 'هل تعالجون الأطفال؟', 'كم موعدًا أحتاج؟', 'هل يوجد موقف سيارات؟'],
    terms: [{ label: 'التأمين', placeholder: 'نقبل: …' }],
    visitor: { who: 'a patient', want: 'book a visit there', place: 'clinic' },
    match: /عيادة|عيادات|طبيب|دكتور|اسنان|أسنان|clinic|dental|doctor/i, seo: 'عيادة',
  },
  car: {
    looks: [AMBER, SERVICE, SAND],
    id: 'car', label: 'ورشة سيارات', place: 'الورشة', team: 'الفنيون', one: 'الفني', any: 'أي فني', role: 'فني', ownerRole: 'صاحب الورشة',
    bookAt: (n) => `اطلب ${n}`, services: 'الخدمات', cta: 'احجز موعد صيانة',
    bookLine: 'اختر الخدمة والوقت. يصل طلبك إلى الورشة، وترد عليك على واتساب.',
    prefix: /^(ورشة|مركز|كراج|جراج)\s+/, suffix: /\s+(لصيانة السيارات|للسيارات|لخدمة السيارات)$/,
    lede: ({ named, area }) => `ورشة سيارات في ${area}.${named.length >= 1 ? ` زبائننا يذكرون ${named.slice(0, 3).join(' و')} بالاسم.` : ''}`,
    tags: ['ميكانيك', 'كهرباء', 'تكييف', 'فحص كمبيوتر', 'سمكرة', 'دهان', 'قير'],
    defaults: [
      { name: 'تغيير زيت وفلتر', duration: '30 دقيقة', on: true }, { name: 'فحص كمبيوتر', duration: '30 دقيقة', on: true }, { name: 'صيانة فرامل', duration: '60 دقيقة', on: true },
      { name: 'كهرباء سيارات', duration: '', on: false }, { name: 'تكييف', duration: '', on: false }, { name: 'سمكرة ودهان', duration: '', on: false }, { name: 'صيانة قير', duration: '', on: false },
    ],
    faqs: ['هل تعطونني السعر قبل البدء؟', 'هل يوجد ضمان على القطع والشغل؟', 'كم تأخذ الصيانة؟', 'هل القطع أصلية أم تجارية؟', 'هل أنتظر في الورشة أم أترك السيارة؟', 'هل تعملون على كل الماركات؟'],
    terms: [{ label: 'الضمان', placeholder: '3 أشهر على الشغل، وضمان الوكيل على القطع' }, { label: 'السعر', placeholder: 'نعطيك السعر قبل البدء، ولا نزيد دون أن نسألك' }],
    visitor: { who: 'a car owner', want: 'take my car there', place: 'car repair garage' },
    match: /ورشة|سيارات|سيارة|ميكانيك|صيانة سيارات|car|garage|auto/i, seo: 'ورشة سيارات',
  },
  photo: {
    looks: [STUDIO_DAY, DARKROOM, PRINT, DAYLIGHT],
    id: 'photo', label: 'استوديو تصوير', place: 'الاستوديو', team: 'المصورون', one: 'المصور', any: 'أي مصور', role: 'مصور', ownerRole: 'صاحب الاستوديو',
    bookAt: (n) => `احجز مع ${n}`, services: 'الباقات', cta: 'احجز جلستك',
    bookLine: 'اختر الباقة والمصور والوقت. يصل طلبك إلى الاستوديو، ويؤكّد لك الموعد على واتساب.',
    prefix: /^(استوديو|ستوديو|ستديو)\s+/, suffix: /\s+(للتصوير|للتصوير الفوتوغرافي)$/,
    lede: ({ named, area }) => `استوديو تصوير في ${area}.${named.length >= 1 ? ` زبائننا يذكرون ${named.slice(0, 3).join(' و')} بالاسم.` : ''}`,
    tags: ['أعراس', 'أطفال', 'منتجات', 'بورتريه', 'فيديو', 'تخرّج', 'مناسبات'],
    defaults: [
      { name: 'جلسة تصوير شخصية', duration: '60 دقيقة', on: true }, { name: 'تصوير منتجات', duration: '', on: true }, { name: 'تصوير مناسبة', duration: '', on: true },
      { name: 'تصوير أطفال', duration: '45 دقيقة', on: false }, { name: 'صور جواز وهوية', duration: '10 دقيقة', on: false }, { name: 'فيديو', duration: '', on: false },
    ],
    faqs: ['متى أستلم الصور؟', 'كم صورة معدّلة في الباقة؟', 'هل تصوّرون خارج الاستوديو؟', 'هل أستلم الصور الأصلية؟'],
    terms: [{ label: 'التسليم', placeholder: 'خلال 7 أيام' }],
    visitor: { who: 'a customer', want: 'book a shoot there', place: 'photo studio' },
    match: /تصوير|استوديو|ستوديو|مصور|photo|studio/i, seo: 'استوديو تصوير',
  },
}

export const NICHE_KINDS = Object.keys(KIND) as NicheKind[]
export const isNicheKind = (v: unknown): v is NicheKind => typeof v === 'string' && v in KIND

/** The kind of a lead from its typed kind and name, or null for the general page. */
export function kindOfLead(lead: { kind?: string | null; name?: string | null }): NicheKind | null {
  const k = `${lead.kind ?? ''}`
  const all = `${k} ${lead.name ?? ''}`
  // The lead's own kind first: «صالون حلاقة» must not read as beauty because of «صالون».
  for (const id of ['barber', 'gym', 'clinic', 'car', 'photo', 'beauty'] as NicheKind[]) if (KIND[id].match.test(k)) return id
  for (const id of ['barber', 'gym', 'clinic', 'car', 'photo', 'beauty'] as NicheKind[]) if (KIND[id].match.test(all)) return id
  return null
}
