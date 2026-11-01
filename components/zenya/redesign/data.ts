/**
 * Content for the five redesign samples (app/demo/styles/*).
 *
 * Every string here is either the live site's own copy or a decision Anas
 * made on 2026-10-31. Nothing is invented:
 *  - prices come from COMPANY, plan text from the live pricing page
 *  - the FAQ is lib/faq-data with «أول منصة عربية بالكامل» in place of the
 *    old sentence, exactly where the old sentence was
 *  - the three reviews are the three rows in the reviews table. They are
 *    still status 'pending' (never approved), so the samples mark them as
 *    such; the live site only ever shows approved rows
 *  - the videos are recordings of the real /demo/dashboard and /demo/editor
 */
import { COMPANY } from '@/lib/company'
import { AR_FAQS } from '@/lib/faq-data'
import { FAQS as PRICING_FAQS_SRC } from '@/lib/pricing-faqs'

export const CLAIM = 'أول منصة عربية بالكامل'

export const HERO = {
  claim: CLAIM,
  words: ['ابنِ', 'أدِر', 'انشر'],
  sub: 'اكتب نبذة قصيرة عن نشاطك، وتبني لك بينون موقعًا عربيًا كاملًا خلال دقائق.',
  primary: { href: '/login?mode=signup', label: 'ابدأ مجانًا' },
  secondary: { href: '/templates', label: 'تصفّح القوالب' },
}

export const NAV = [
  { href: '/pricing', label: 'الأسعار' },
  { href: '/templates', label: 'القوالب' },
  { href: '/contact', label: 'تواصل' },
]

export const AUTH = {
  login: { href: '/login', label: 'دخول' },
  signup: { href: '/login?mode=signup', label: 'إنشاء حساب' },
}

/** The reviews table on 2026-10-31: three rows, all still pending. */
export const REVIEWS = [
  { name: 'mohammed', body: 'البناء كان سريع وفعالا', rating: 5 },
  { name: 'saleh', body: 'لم ار موقع عربي بهذه الحلاوة', rating: 5 },
  { name: 'صالح', body: 'جميل جدا ما تفعلوه ك موقع عربي بالكامل', rating: 5 },
]
export const REVIEWS_NOTE = 'هذه التقييمات الثلاثة من قاعدة البيانات، ولم توافق عليها بعد. الموقع يعرض المعتمد فقط.'

/* Where each feature starts in the real recordings (seconds). Taken from the
   recorder's marks, so a tab can loop exactly its own part of the video. */
export const DASH_D = { src: '/redesign/dash-d.mp4', poster: '/redesign/dash-d.jpg', w: 1440, h: 900 }
export const DASH_M = { src: '/redesign/dash-m.mp4', poster: '/redesign/dash-m.jpg', w: 390, h: 844 }
export const EDIT_D = { src: '/redesign/edit-d.mp4', poster: '/redesign/edit-d.jpg', w: 1440, h: 900 }
export const EDIT_M = { src: '/redesign/edit-m.mp4', poster: '/redesign/edit-m.jpg', w: 390, h: 844 }

export const DASH_FEATURES = [
  { id: 'home', title: 'الرئيسية', body: 'حجوزات اليوم، وعدد الزوار، وما يحتاج انتباهك. أول ما تراه كل صباح.', d: [0, 11], m: [0, 6.9] },
  { id: 'analytics', title: 'التحليلات', body: 'من زار موقعك، ومن أين جاء، وماذا فعل. أرقام واضحة بلا تعقيد.', d: [11, 16.9], m: [13.6, 16.6] },
  { id: 'bookings', title: 'الحجوزات', body: 'كل طلب حجز يصل إليك مرتبًا. تؤكده أو تعدله بضغطة.', d: [16.9, 20.2], m: [6.9, 13.6] },
  { id: 'reviews', title: 'التقييمات', body: 'تقييماتك على Google في مكان واحد، وتختار ما يظهر في موقعك.', d: [20.2, 23.4], m: [16.6, 24.9] },
  { id: 'seo', title: 'الظهور في جوجل', body: 'عدّل كيف يظهر موقعك في نتائج البحث، وتابع ترتيبك.', d: [23.4, 34.7], m: [24.9, 33.2] },
]

export const EDIT_STEPS = [
  { id: 'select', title: 'اختر', body: 'اضغط على أي جزء من موقعك.', d: 0, m: 0 },
  { id: 'type', title: 'اكتب', body: 'غيّر النص، وموقعك يتغير معك.', d: 5.1, m: 5.2 },
  { id: 'design', title: 'لوّن', body: 'بدّل الألوان والخطوط بلمسة.', d: 11, m: 12.5 },
  { id: 'publish', title: 'انشر', body: 'راجع على الهاتف، ثم انشر.', d: 21.5, m: 22.1 },
]

export const TEMPLATES = [
  { id: 'restaurant', name: 'موقع مطعم', tag: 'مطعم · قائمة · حجوزات', href: '/templates/restaurant' },
  { id: 'services', name: 'موقع خدمات', tag: 'خدمات محلية · حِرف', href: '/templates/services' },
  { id: 'wellness', name: 'موقع مركز عافية', tag: 'سبا · يوغا · عافية', href: '/templates/wellness' },
  { id: 'lookbook', name: 'موقع أزياء ولوك بوك', tag: 'أزياء · ملابس · علامة', href: '/templates/fashion-lookbook' },
  { id: 'atlas', name: 'صفحة هبوط لتطبيق', tag: 'تطبيق · برمجيات · B2B', href: '/templates/app-landing-page' },
  { id: 'studio', name: 'موقع علامة تجارية وقصة', tag: 'قصة علامة · تحرير', href: '/templates/brand-story' },
  { id: 'collective', name: 'متجر بمنتجات متعددة', tag: 'كتالوج · منتجات متعددة', href: '/templates/online-store' },
  { id: 'one_product', name: 'متجر بمنتج واحد', tag: 'متجر · منتج واحد', href: '/templates/one-product-store', soon: true },
] as const

export const phoneShot = (id: string) => (id === 'one_product' ? '/theme-previews/thumb/one_product.webp' : `/theme-previews/phone/${id}.webp`)
export const wideShot = (id: string) => `/theme-previews/thumb/${id}.webp`

const fixClaim = (s: string) => s.replace('أوّل شركة إسلامية لإنشاء المواقع', CLAIM)
export const FAQS = AR_FAQS.slice(0, 6).map((f) => ({ q: f.q, a: fixClaim(f.a) }))
export const PRICING_FAQS = PRICING_FAQS_SRC.map((f) => ({ q: f.q, a: f.a }))

/* The live pricing page's own words (PricingView). */
export const PRICING_HEAD = { l1: 'المعاينة مجانية.', l2: 'وأول قالبين مجانًا أيضًا.', sub: 'باقة مجانية، وخطّتان شهريتان. الاشتراك يُلغى متى شئت.' }

const usd = (n: number) => '$' + n.toFixed(2)

/* Verbatim from components/zenya/pricing/PricingView.tsx (PLANS). */
export const PLANS = [
  {
    id: 'entry', name: 'مجانية', amount: '$0', per: '/بلا دفع',
    sub: 'ابنِ، أدِر، وانشر — جرّب بينون مجانًا.', cta: 'ابدأ مجانًا', href: '/login?mode=signup',
    foot: 'مجانًا — بلا بطاقة ولا اشتراك',
    features: ['توليد قالبين (٢) — مجانًا', 'جميع القوالب الثمانية للمعاينة', 'انشر موقعك على اسمك.beynoun.com', 'كل أدوات التحرير والإدارة', 'شهر تجربة للحجوزات وتحليلات الموقع', 'دعم المجتمع'],
  },
  {
    id: 'starter', name: 'Starter', amount: usd(COMPANY.STARTER_PRICE_USD), per: '/شهريًا',
    sub: 'ابنِ، أدِر، وانشر — بلا حدود، على نطاقك الخاص.', cta: 'اشترك في Starter', href: '/checkout?plan=starter',
    badge: 'الأكثر شيوعًا', foot: 'ألغِ في أي وقت',
    features: ['توليد غير محدود — يشمل تحديثات القوالب', 'جميع القوالب الثمانية الاحترافية', 'انشر على نطاقك الخاص', 'شهادة SSL تلقائية + CDN سريع', 'الحجوزات وتحليلات الموقع — كاملة', 'ملف ثيم شوبيفاي جاهز (المتجر + التشكيلة)', 'وصول مبكر للقوالب الجديدة', 'دعم ذو أولوية'],
  },
  {
    id: 'pro', name: 'Pro', amount: usd(COMPANY.PRO_PRICE_USD), per: '/شهريًا',
    sub: 'ابنِ، أدِر، وانشر — كل شيء مشمول، بنطاق مجاني.', cta: 'اشترك في Pro', href: '/checkout?plan=pro',
    foot: 'ألغِ في أي وقت · يبقى الموقع مباشرًا حتى نهاية الشهر',
    features: ['كل ما في خطة Starter، بالإضافة إلى:', 'نطاق مخصّص مجاني لسنة — ‏.store، .site، .online، .shop', 'خصم 30% على النطاقات الأغلى (.com وأمثالها)', 'إزالة شارة «صُنع ببينون»', 'إدارة كاملة لموقعك ونطاقك', 'دعم أولوية قصوى'],
  },
] as const

export const FOOTER = {
  claim: `${CLAIM}. اكتب نبذة عن نشاطك، واحصل على موقع مباشر بعنوانه الخاص.`,
  email: COMPANY.SUPPORT_EMAIL,
  phoneRead: '+31 6 1889 2951',
  phoneHref: 'tel:+31618892951',
  columns: [
    { head: 'المنتج', links: [['/templates', 'تصفّح القوالب'], ['/features', 'الميزات'], ['/templates/restaurant', 'موقع مطعم'], ['/pricing', 'الأسعار'], ['/compare', 'المقارنات']] },
    { head: 'الشركة', links: [['/about', 'من نحن'], ['/faq', 'الأسئلة الشائعة'], ['/contact', 'تواصل معنا']] },
    { head: 'قانوني', links: [['/privacy', 'الخصوصية'], ['/terms', 'الشروط'], ['/cookies', 'ملفات الارتباط'], ['/refund', 'الاسترجاع'], ['/subprocessors', 'المعالِجون الفرعيون']] },
  ],
  socials: [
    ['TikTok', 'https://www.tiktok.com/@beynounn'],
    ['Instagram', 'https://www.instagram.com/beynoun'],
    ['X', 'https://x.com/beynounn'],
    ['Facebook', 'https://www.facebook.com/beynoun'],
    ['Threads', 'https://www.threads.com/@beynoun'],
  ],
  year: 2026,
}

/* Second set (2026-11-01). The statement is what the generators do: they
   write the copy, pick photos from the trade's photo pack, order the
   sections and publish. The brief is an example, marked as one, written to
   match the restaurant template's own sample (دار نور, 24 seats). */
export const STATEMENT = 'اكتب سطرين عن نشاطك. بينون تكتب النصوص، وتختار الصور، وترتّب الأقسام، وتنشر موقعك على عنوانه الخاص.'
export const BRIEF = {
  label: 'مثال',
  text: 'مطعم صغير اسمه دار نور. أربعة وعشرون مقعدًا، وقائمة تتغير مع المواسم. نريد موقعًا يستقبل الحجوزات.',
  shot: 'restaurant',
}
export const SECTIONS = {
  reviews: 'ماذا يقول من جرّب بينون',
  dash: 'لوحة تحكم واحدة لكل شيء',
  dashLead: 'الحجوزات، والزوار، والتقييمات، وظهورك في جوجل. كلها في مكان واحد.',
  edit: 'عدّل موقعك كما تكتب رسالة',
  editLead: 'اضغط على أي نص في موقعك واكتب. غيّر الألوان والخطوط، ثم انشر بضغطة.',
  tpl: 'قالب لكل نشاط',
  tplLead: 'ثمانية قوالب جاهزة. اختر قالب نشاطك، وبينون تكتب المحتوى وترتّب الأقسام.',
  faq: 'أسئلة شائعة',
  gen: 'من سطرين إلى موقع كامل',
  genLead: 'تكتب ما تعرفه عن نشاطك بكلماتك. بينون تبني الباقي.',
}
