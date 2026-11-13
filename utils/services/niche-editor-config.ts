import { Sparkles, Users, Wrench, CalendarClock, Star, Image as ImageIcon, HelpCircle, MapPin, MessageCircle, FileText, Home, Tag, Dumbbell, Camera, IdCard } from 'lucide-react'
import type { EditorConfig } from '@/utils/theme-editor-types'
import { SERVICES_EDITOR_CONFIG } from './editor-config'
import { KIND, isNicheKind, type NicheKind } from './kinds'
import { DAYS_AR } from './barber'

/**
 * The editor for a services kind page (barber, gym, beauty, clinic, car,
 * photo). It edits the same sections the page draws, in the same order, so
 * «عدّل» on a section opens the fields of that section. The owner-filled
 * facts the build could not know (prices, durations, terms, answers, the
 * people's photos) are here too.
 */
export function nicheEditorConfig(kind: NicheKind): EditorConfig {
  return withPages(kind, baseConfig(kind))
}

/**
 * A kind with its own multi-page theme lists its pages, and each section says
 * which pages draw it, so a click on the site opens the right panel and the
 * page menu shows what each page holds. Ids match lib/site-pages NICHE_PAGES.
 * A panel left out of `on` is on every page (name, links, address, Google).
 */
const KIND_PAGES: Partial<Record<NicheKind, { pages: NonNullable<EditorConfig['pages']>; on: Record<string, string[]> }>> = {
  gym: {
    pages: [
      { id: 'home', label: 'الرئيسية', icon: Home, ic: 'home' },
      { id: 'plans', label: 'الاشتراكات', icon: Tag, ic: 'tag' },
      { id: 'coaches', label: 'المدربون', icon: Users, ic: 'users' },
      { id: 'timetable', label: 'جدول الحصص', icon: CalendarClock, ic: 'cal' },
      { id: 'club', label: 'النادي', icon: Dumbbell, ic: 'store' },
      { id: 'book', label: 'احجز وزُرنا', icon: MapPin, ic: 'pin' },
    ],
    on: {
      hero: ['home'],
      about: ['home', 'plans', 'timetable', 'club'],
      team: ['home', 'coaches'],
      services: ['home', 'plans'],
      reviews: ['home'],
      gallery: ['club'],
      faq: ['home', 'book'],
    },
  },
  photo: {
    pages: [
      { id: 'home', label: 'الرئيسية', icon: Home, ic: 'home' },
      { id: 'work', label: 'الأعمال', icon: Camera, ic: 'gallery' },
      { id: 'packages', label: 'الباقات', icon: Tag, ic: 'tag' },
      { id: 'official', label: 'الصور الرسمية', icon: IdCard, ic: 'tag' },
      { id: 'studio', label: 'الاستوديو', icon: Users, ic: 'users' },
      { id: 'book', label: 'احجز جلستك', icon: MapPin, ic: 'pin' },
    ],
    on: {
      hero: ['home'],
      work: ['home', 'work'],
      about: ['home', 'studio'],
      team: ['studio'],
      services: ['home', 'packages', 'official'],
      reviews: ['home', 'studio'],
      gallery: ['home', 'work'],
      faq: ['home', 'book'],
    },
  },
}

/**
 * Photo studio: the parts only its theme draws (components/theme/services/niche/PhotoFull.tsx).
 * Every one is optional; a part left empty is not drawn, and a page with nothing is dropped.
 */
const PHOTO_PANELS: any[] = [
  {
    id: 'work', label: 'الأعمال', icon: Camera, ic: 'gallery', desc: 'صور من جلساتك، ونوع كل جلسة',
    summary: (c: any) => `${(c?.niche_extra?.work || []).filter((w: any) => w?.url).length} صورة`,
    fields: [
      { type: 'note', content: 'هذه صور أعمالك، لا صور المكان. اكتب نوع كل صورة (منتجات، أعراس، أطفال...) فتظهر في الموقع أزرار لكل نوع. بدونها نعرض صور المكان.' },
      {
        type: 'array', path: 'niche_extra.work', label: 'صور الأعمال', itemLabel: 'صورة', itemThumb: 'url', itemTitle: 'tag',
        makeItem: () => ({ url: '', tag: '' }),
        itemFields: [{ type: 'image', path: 'url', label: 'الصورة' }, { type: 'text', path: 'tag', label: 'نوع الجلسة', placeholder: 'منتجات' }],
      },
    ],
  },
  {
    id: 'about', label: 'عن الاستوديو', icon: Sparkles, ic: 'sparkle', desc: 'قصتك في جملتين',
    summary: (c: any) => String(c?.niche_extra?.story || ''),
    fields: [
      { type: 'textarea', path: 'niche_extra.story', label: 'احكِ عن الاستوديو في جملتين', rows: 3, max: 400 },
      { type: 'number', path: 'niche_extra.since', label: 'سنة الافتتاح', min: 1900, max: 2100 },
    ],
  },
]

const PHOTO_PRICE_FIELDS: any[] = [
  {
    type: 'array', path: 'niche_extra.perks', label: 'ماذا تشمل كل باقة', itemLabel: 'باقة', itemTitle: 'plan',
    makeItem: () => ({ plan: '', items: [] }),
    itemFields: [{ type: 'text', path: 'plan', label: 'اسم الباقة كما في قائمة الأسعار' }, { type: 'strings', path: 'items', label: 'ما تشمله', addLabel: 'أضف سطرًا' }],
  },
  { type: 'group', label: 'التسليم' },
  {
    type: 'array', path: 'niche_extra.delivery', label: 'متى يستلم الزبون صوره', itemLabel: 'نوع', itemTitle: 'what', itemSub: 'when',
    makeItem: () => ({ what: '', when: '' }),
    itemFields: [{ type: 'text', path: 'what', label: 'ماذا', placeholder: 'الصور الرسمية' }, { type: 'text', path: 'when', label: 'متى', placeholder: 'فورًا' }],
  },
  { type: 'group', label: 'الصور الرسمية' },
  {
    type: 'array', path: 'niche_extra.specs', label: 'المقاسات التي تصوّرها', itemLabel: 'ورقة', itemTitle: 'label', itemSub: 'text',
    makeItem: () => ({ label: '', text: '' }),
    itemFields: [{ type: 'text', path: 'label', label: 'الورقة', placeholder: 'جواز السفر' }, { type: 'text', path: 'text', label: 'المقاس والخلفية', placeholder: '4 × 6 سم، خلفية بيضاء' }],
  },
  { type: 'group', label: 'قبل أن يحجز' },
  {
    type: 'array', path: 'niche_extra.blocks', label: 'ملاحظات للزبون', itemLabel: 'ملاحظة', itemTitle: 'title', itemSub: 'text',
    makeItem: () => ({ id: `n${Date.now()}`, title: '', text: '' }),
    itemFields: [{ type: 'text', path: 'title', label: 'العنوان', placeholder: 'التعديل' }, { type: 'text', path: 'text', label: 'النص', placeholder: 'تعديلان مجانًا لكل صورة' }],
  },
]

function withPages(kind: NicheKind, c: EditorConfig): EditorConfig {
  const m = KIND_PAGES[kind]
  if (!m) return c
  return { ...c, pages: m.pages, panels: c.panels.map((p) => (m.on[p.id] ? { ...p, pages: m.on[p.id] } : p)) }
}

function baseConfig(kind: NicheKind): EditorConfig {
  const k = KIND[kind]
  return {
    ...SERVICES_EDITOR_CONFIG,
    themeName: k.label,
    defaultPresetId: 'graphite',
    pages: [],
    colorPresets: k.looks.map((l) => ({ id: l.id, name: l.name, vibe: '', colors: l.colors })),
    panels: [
      {
        id: 'brand', label: k.place.replace(/^ال/, ''), icon: Sparkles, ic: 'brand', desc: 'الاسم والشعار والمدينة',
        summary: (c) => String(c?.brand?.name || ''),
        fields: [
          { type: 'text', path: 'brand.name', label: 'الاسم' },
          { type: 'text', path: 'brand.latin', label: 'الاسم بالإنجليزية (إن كان على اللافتة)' },
          { type: 'logo' },
          { type: 'toggle', path: 'brand.show_logo', label: 'الشعار بجانب الاسم', fallback: true },
          { type: 'text', path: 'brand.city', label: 'المدينة' },
          { type: 'text', path: 'brand.area', label: 'الحي أو المنطقة' },
        ],
      },
      {
        id: 'hero', label: 'الواجهة', icon: Sparkles, ic: 'sparkle', desc: 'أول ما يراه الزائر',
        summary: (c) => String(c?.hero?.headline || ''),
        fields: [
          { type: 'text', path: 'hero.headline', label: 'الاسم الكبير', max: 24 },
          { type: 'textarea', path: 'hero.subheadline', label: 'السطر تحته', rows: 3, max: 160 },
          { type: 'image', path: 'hero.image', label: 'صورة الواجهة', optional: true, hint: 'صورة حقيقية للمكان. بدونها تظهر الواجهة بالاسم وحده.' },
        ],
      },
      ...(kind === 'photo' ? PHOTO_PANELS : []),
      ...(k.extras ? [{
        id: 'about', label: `عن ${k.place}`, icon: Sparkles, ic: 'sparkle', desc: `ما يقدّمه ${k.place}، مرافقه، وقصته`,
        summary: (c: any) => (c?.niche_extra?.offers || []).join('، ') || String(c?.niche_extra?.story || ''),
        empty: (c: any) => !c?.niche_extra || !Object.values(c.niche_extra).some((v: any) => (Array.isArray(v) ? v.length : !!v)),
        fields: [
          { type: 'note', content: 'كل ما يبقى فارغًا هنا لا يظهر في الموقع.' },
          ...(k.extras.offers ? [{ type: 'strings', path: 'niche_extra.offers', label: `ماذا يقدّم ${k.place}`, addLabel: 'أضف' }] : []),
          ...(k.extras.facilities ? [{ type: 'strings', path: 'niche_extra.facilities', label: 'المرافق', addLabel: 'أضف مرفقًا' }] : []),
          ...(k.extras.story ? [{ type: 'textarea', path: 'niche_extra.story', label: k.extras.story.label, rows: 3, max: 400 }] : []),
          ...(k.extras.since ? [{ type: 'number', path: 'niche_extra.since', label: 'سنة الافتتاح', min: 1900, max: 2100 }] : []),
          ...(k.extras.steps ? [{
            type: 'array', path: 'niche_extra.steps', label: 'كيف يبدأ الزبون الجديد', itemLabel: 'خطوة', itemTitle: 'title', itemSub: 'text',
            makeItem: () => ({ title: '', text: '' }),
            itemFields: [{ type: 'text', path: 'title', label: 'العنوان' }, { type: 'text', path: 'text', label: 'السطر' }],
          }] : []),
          ...(k.extras.perks ? [{
            type: 'array', path: 'niche_extra.perks', label: `ماذا يشمل كل ${k.services === 'الاشتراكات' ? 'اشتراك' : 'خدمة'}`, itemLabel: k.services === 'الاشتراكات' ? 'اشتراك' : 'خدمة', itemTitle: 'plan',
            makeItem: () => ({ plan: '', items: [] }),
            itemFields: [{ type: 'text', path: 'plan', label: 'الاسم كما في قائمة الأسعار' }, { type: 'strings', path: 'items', label: 'ما يشمله', addLabel: 'أضف سطرًا' }],
          }] : []),
          ...(k.extras.classes ? [{
            type: 'array', path: 'niche_extra.classes', label: 'جدول الحصص', itemLabel: 'يوم', itemTitle: 'day',
            makeItem: () => ({ day: 0, items: [] }),
            itemFields: [
              { type: 'choice', path: 'day', label: 'اليوم', fallback: '0', options: DAYS_AR.map((d, i) => ({ value: String(i), label: d })) },
              { type: 'array', path: 'items', label: 'حصص هذا اليوم', itemLabel: 'حصة', itemTitle: 'name', itemSub: 'time', makeItem: () => ({ time: '18:00', name: '' }),
                itemFields: [{ type: 'text', path: 'time', label: 'الوقت (مثل 18:30)' }, { type: 'text', path: 'name', label: 'اسم الحصة' }] },
            ],
          }] : []),
        ],
      }] as EditorConfig['panels'] : []),
      {
        id: 'team', label: k.team, icon: Users, ic: 'users', desc: `${k.team} بالاسم`,
        summary: (c) => (c?.team?.members || []).map((m: any) => m.name).join('، '),
        empty: (c) => !(c?.team?.members || []).length,
        fields: [
          { type: 'note', content: `بدون صورة يظهر الاسم بخط كبير. لا نضع وجهًا غريبًا مكان ${k.one}.` },
          {
            type: 'array', path: 'team.members', label: k.team, itemLabel: k.role, itemTitle: 'name', itemSub: 'role', itemThumb: 'photo',
            makeItem: () => ({ name: '', role: k.role }),
            itemFields: [
              { type: 'text', path: 'name', label: 'الاسم' },
              { type: 'text', path: 'role', label: 'الصفة' },
              { type: 'image', path: 'photo', label: 'الصورة', optional: true },
              { type: 'strings', path: 'tags', label: 'بماذا يشتهر', addLabel: 'أضف' },
              { type: 'textarea', path: 'quote', label: 'كلام زبون عنه (من تقييم حقيقي)', rows: 2 },
              { type: 'text', path: 'quote_by', label: 'اسم صاحب التقييم' },
            ],
          },
        ],
      },
      {
        id: 'services', label: k.services, icon: Wrench, ic: 'tag', desc: 'الأسعار والمدة',
        summary: (c) => `${(c?.services?.items || []).length} · ${(c?.services?.items || []).filter((s: any) => s.price_from).length} بسعر`,
        fields: [
          { type: 'note', content: 'بدون سعر يظهر زر «اسأل عن الأسعار» على واتساب.' },
          {
            type: 'array', path: 'services.items', label: k.services, itemLabel: 'خدمة', itemTitle: 'name', itemSub: 'price_from',
            makeItem: () => ({ name: 'خدمة جديدة', description: '' }),
            itemFields: [
              { type: 'text', path: 'name', label: 'الاسم' },
              { type: 'text', path: 'price_from', label: 'السعر (مع العملة)' },
              { type: 'text', path: 'duration', label: 'المدة' },
              { type: 'text', path: 'description', label: 'ملاحظة قصيرة' },
            ],
          },
          ...(kind === 'photo' ? PHOTO_PRICE_FIELDS : []),
          { type: 'group', label: 'الشروط' },
          {
            type: 'array', path: 'terms', label: 'الشروط', itemLabel: 'شرط', itemTitle: 'label', itemSub: 'text',
            makeItem: () => ({ label: k.terms?.[0]?.label || 'شرط', text: '' }),
            itemFields: [
              { type: 'text', path: 'label', label: 'العنوان' },
              { type: 'text', path: 'text', label: 'النص' },
            ],
          },
        ],
      },
      {
        id: 'booking', label: 'الحجز والأوقات', icon: CalendarClock, ic: 'clock', desc: 'كيف يأتي الزبون ومتى',
        fields: [
          {
            type: 'choice', path: 'booking.mode', label: 'كيف يأتيك الزبون؟', fallback: 'both',
            options: [{ value: 'both', label: 'بموعد وبدونه' }, { value: 'appointment', label: 'بموعد فقط' }, { value: 'walkin', label: 'بدون موعد' }],
          },
          { type: 'text', path: 'booking.wait', label: 'كم ينتظر الزبون عادة؟' },
          { type: 'text', path: 'booking.busy', label: 'متى تكون الزحمة؟' },
          { type: 'group', label: 'أوقات الدوام' },
          { type: 'periods', path: 'hours' },
        ],
      },
      {
        id: 'reviews', label: 'التقييمات', icon: Star, ic: 'star', desc: 'من جوجل، كما كتبها الزبائن',
        fields: [
          { type: 'note', content: 'التقييمات منقولة من جوجل كما هي، باسم كاتبها. لا تُعدّل نصوصها.' },
          { type: 'rating', path: 'google.rating', label: 'التقييم على جوجل' },
          { type: 'number', path: 'google.count', label: 'عدد التقييمات', min: 0 },
          { type: 'url', path: 'google.maps_url', label: 'رابط المكان على خرائط جوجل' },
        ],
      },
      {
        id: 'gallery', label: 'الصور', icon: ImageIcon, ic: 'gallery', desc: 'صور المكان الحقيقية',
        summary: (c) => `${(c?.gallery?.images || []).length} صور`,
        fields: [
          { type: 'note', content: 'تحت كل صورة مصدرها: «من جوجل» أو «من إنستغرام» أخذناها من حساباتك، و«منك» ما رفعته. غيّر أي صورة أو احذفها.' },
          { type: 'image', path: 'story.image', label: 'الصورة بجانب الأسعار', optional: true },
          {
            type: 'array', path: 'gallery.images', label: 'صور المكان', itemLabel: 'صورة', itemThumb: 'url', itemTitle: 'alt', itemSub: 'from',
            makeItem: () => ({ url: '', alt: '', source: 'owner', from: 'منك' }),
            itemFields: [{ type: 'image', path: 'url', label: 'الصورة' }, { type: 'text', path: 'alt', label: 'وصفها' }],
          },
        ],
      },
      {
        id: 'faq', label: 'قبل أن تأتي', icon: HelpCircle, ic: 'faq', desc: 'الأسئلة المُجابة فقط تظهر',
        summary: (c) => `${(c?.faq?.items || []).filter((f: any) => f.a).length} سؤال`,
        fields: [
          {
            type: 'array', path: 'faq.items', label: 'الأسئلة', itemLabel: 'سؤال', itemTitle: 'q',
            makeItem: () => ({ q: k.faqs[0], a: '' }),
            itemFields: [{ type: 'text', path: 'q', label: 'السؤال' }, { type: 'textarea', path: 'a', label: 'الجواب', rows: 3 }],
          },
        ],
      },
    ],
    globalPanels: [
      {
        id: 'links', label: 'واتساب والروابط', icon: MessageCircle, ic: 'at', desc: 'الحجز والسؤال يصلان إلى واتساب',
        fields: [
          { type: 'text', path: 'links.whatsapp', label: 'رقم واتساب (بمفتاح الدولة)', placeholder: '+962 79 000 0000' },
          { type: 'text', path: 'social_links.instagram', label: 'إنستغرام', placeholder: '@yourname' },
          {
            type: 'array', path: 'links.extra', label: 'روابط أخرى', itemLabel: 'رابط', itemTitle: 'label', itemSub: 'url',
            makeItem: () => ({ label: '', url: '' }),
            itemFields: [{ type: 'text', path: 'label', label: 'اسمه' }, { type: 'url', path: 'url', label: 'الرابط' }],
          },
        ],
      },
      {
        id: 'footer', label: 'العنوان والهاتف', icon: MapPin, ic: 'foot', desc: 'في قسم الموقع وأسفل الصفحة',
        fields: [
          { type: 'tel', path: 'footer.phone', label: 'الهاتف' },
          { type: 'text', path: 'footer.address', label: 'العنوان' },
        ],
      },
      {
        id: 'seo', label: 'في جوجل', icon: FileText, ic: 'search', desc: 'كيف يظهر الموقع في البحث',
        fields: [
          { type: 'text', path: 'seo.title', label: 'العنوان', max: 60 },
          { type: 'textarea', path: 'seo.description', label: 'الوصف', rows: 3, max: 160 },
        ],
      },
    ],
  }
}

const CACHE = new Map<NicheKind, EditorConfig>()
/** The services editor for this content: the kind's own when it has one. */
export function servicesConfigFor(root: any): EditorConfig {
  const niche = root?.services?.niche ?? root?.niche
  if (!isNicheKind(niche)) return SERVICES_EDITOR_CONFIG
  if (!CACHE.has(niche)) CACHE.set(niche, nicheEditorConfig(niche))
  return CACHE.get(niche)!
}
