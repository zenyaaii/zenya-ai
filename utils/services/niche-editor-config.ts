import { Sparkles, Users, Wrench, CalendarClock, Star, Image as ImageIcon, HelpCircle, MapPin, MessageCircle, FileText } from 'lucide-react'
import type { EditorConfig } from '@/utils/theme-editor-types'
import { SERVICES_EDITOR_CONFIG } from './editor-config'
import { KIND, isNicheKind, type NicheKind } from './kinds'

/**
 * The editor for a services kind page (barber, gym, beauty, clinic, car,
 * photo). It edits the same sections the page draws, in the same order, so
 * «عدّل» on a section opens the fields of that section. The owner-filled
 * facts the build could not know (prices, durations, terms, answers, the
 * people's photos) are here too.
 */
export function nicheEditorConfig(kind: NicheKind): EditorConfig {
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
