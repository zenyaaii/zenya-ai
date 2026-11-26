import { Sparkles, BookOpen, Workflow, Package, Users, Star, Newspaper, Phone, Image as ImageIcon, Heart, Clock, Mail } from 'lucide-react'
import type { EditorConfig } from '@/utils/theme-editor-types'
import { STUDIO_EDITOR_CONFIG } from './editor-config'
import { BRAND_LOOKS } from './brand-looks'

/**
 * The editor for a brand-story site built by the new questions (content.studio
 * with v: 2). Every answer the wizard took has a field here, at the same path
 * the site reads it from. Old studio sites keep STUDIO_EDITOR_CONFIG.
 */
const has = (path: (s: any) => unknown[] | undefined) => (c: any) => !(path(c?.studio) || []).length

export const BRAND_EDITOR_CONFIG: EditorConfig = {
  contentKey: 'studio',
  themeName: 'علامة تجارية وقصة',
  defaultPresetId: 'own',
  brandNamePath: 'brand.name',
  colorPresets: BRAND_LOOKS.map((l) => ({ id: l.id, name: l.name, vibe: '', colors: l.colors })),
  colorTokens: [
    { key: 'background', label: 'الورق' },
    { key: 'surface', label: 'الرفوف والبطاقات' },
    { key: 'text', label: 'النص' },
    { key: 'muted', label: 'نص خافت' },
    { key: 'accent', label: 'لون علامتك' },
    { key: 'primary', label: 'اللون الثاني' },
    { key: 'border', label: 'الخطوط' },
  ],
  phonePath: 'contact.phone',
  panels: [
    {
      id: 'brand', label: 'العلامة والواجهة', icon: Sparkles, ic: 'home',
      fields: [
        { type: 'choice', path: 'design', label: 'شكل الموقع', fallback: 'tropic', options: [{ value: 'tropic', label: 'موسم: الصور أولًا' }, { value: 'shelf', label: 'رفّ: المنتجات أولًا' }], hints: { tropic: 'صورة واجهة تملأ الشاشة وخط عريض. أجمل مع صور كثيرة.', shelf: 'العبوات والأحجام في الأعلى. أوضح للتجار، وجميل حتى بصور قليلة.' } },
        { type: 'text', path: 'brand.name', label: 'اسم العلامة' },
        { type: 'text', path: 'brand.kind', label: 'ماذا تبيع، في كلمات' },
        { type: 'text', path: 'brand.tagline', label: 'جملتك (العنوان الكبير)' },
        { type: 'textarea', path: 'brand.intro', label: 'سطران عنك', rows: 3 },
        { type: 'text', path: 'brand.city', label: 'المدينة' },
        { type: 'image', path: 'brand.logo', label: 'الشعار', optional: true },
        { type: 'image', path: 'hero.photo', label: 'صورة الواجهة', optional: true },
      ],
    },
    {
      id: 'story', label: 'القصة', icon: BookOpen, hideable: true, empty: has((s) => s?.story?.paragraphs),
      fields: [
        { type: 'text', path: 'story.heading', label: 'عنوان القصة' },
        { type: 'strings', path: 'story.paragraphs', label: 'الفقرات', addLabel: 'أضف فقرة' },
        { type: 'textarea', path: 'story.quote', label: 'جملة تلخّص وعدك', rows: 2 },
        { type: 'text', path: 'story.signature', label: 'من يوقّعها' },
        { type: 'text', path: 'story.role', label: 'صفته' },
        { type: 'image', path: 'story.photo', label: 'صورة القصة', optional: true },
      ],
    },
    {
      id: 'values', label: 'ما لا نتنازل عنه', icon: Heart, hideable: true, empty: has((s) => s?.values?.items),
      fields: [
        { type: 'text', path: 'values.heading', label: 'العنوان' },
        { type: 'array', path: 'values.items', label: 'القيم', itemLabel: 'قيمة', itemTitle: 'title', makeItem: () => ({ title: 'قيمة جديدة', text: '' }),
          itemFields: [{ type: 'text', path: 'title', label: 'العنوان' }, { type: 'textarea', path: 'text', label: 'سطر يشرحها', rows: 2 }] },
      ],
    },
    {
      id: 'steps', label: 'كيف نصنع', icon: Workflow, hideable: true, empty: has((s) => s?.steps?.items),
      fields: [
        { type: 'text', path: 'steps.heading', label: 'العنوان' },
        { type: 'array', path: 'steps.items', label: 'الخطوات', itemLabel: 'خطوة', itemTitle: 'title', itemThumb: 'photo', makeItem: () => ({ title: 'خطوة جديدة', text: '' }),
          itemFields: [{ type: 'text', path: 'title', label: 'العنوان' }, { type: 'textarea', path: 'text', label: 'سطر يشرحها', rows: 2 }, { type: 'image', path: 'photo', label: 'صورة', optional: true }] },
      ],
    },
    {
      id: 'benefits', label: 'ما يقدّمه لك', icon: Star, hideable: true, empty: has((s) => s?.benefits?.items),
      fields: [
        { type: 'text', path: 'benefits.heading', label: 'العنوان' },
        { type: 'array', path: 'benefits.items', label: 'الفوائد', itemLabel: 'فائدة', itemTitle: 'title', makeItem: () => ({ title: 'فائدة جديدة', text: '' }),
          itemFields: [{ type: 'text', path: 'title', label: 'العنوان' }, { type: 'textarea', path: 'text', label: 'سطر يشرحها', rows: 2 }] },
      ],
    },
    {
      id: 'products', label: 'المنتجات', icon: Package, empty: has((s) => s?.products?.items),
      fields: [
        { type: 'text', path: 'products.heading', label: 'العنوان' },
        { type: 'array', path: 'products.items', label: 'المنتجات', itemLabel: 'منتج', itemTitle: 'name', itemSub: 'size', itemThumb: 'photo', makeItem: () => ({ name: 'منتج جديد' }),
          itemFields: [
            { type: 'text', path: 'name', label: 'الاسم' }, { type: 'text', path: 'size', label: 'الحجم أو النوع' },
            { type: 'textarea', path: 'text', label: 'سطر عنه', rows: 2 }, { type: 'text', path: 'price', label: 'السعر (اختياري)' },
            { type: 'image', path: 'photo', label: 'الصورة', optional: true },
          ] },
        { type: 'text', path: 'products.note', label: 'ملاحظة تحت المنتجات' },
      ],
    },
    {
      id: 'gallery', label: 'المعرض', icon: ImageIcon, hideable: true, empty: has((s) => s?.gallery?.images),
      fields: [
        { type: 'text', path: 'gallery.heading', label: 'العنوان' },
        { type: 'strings', path: 'gallery.images', label: 'روابط الصور', addLabel: 'أضف صورة' },
      ],
    },
    {
      id: 'timeline', label: 'محطاتنا', icon: Clock, hideable: true, empty: has((s) => s?.timeline?.items),
      fields: [
        { type: 'text', path: 'timeline.heading', label: 'العنوان' },
        { type: 'array', path: 'timeline.items', label: 'المحطات', itemLabel: 'محطة', itemTitle: 'year', makeItem: () => ({ year: '', text: '' }),
          itemFields: [{ type: 'text', path: 'year', label: 'السنة' }, { type: 'text', path: 'text', label: 'ماذا حدث' }] },
      ],
    },
    {
      id: 'team', label: 'من نحن', icon: Users, hideable: true, empty: has((s) => s?.team?.items),
      fields: [
        { type: 'text', path: 'team.heading', label: 'العنوان' },
        { type: 'array', path: 'team.items', label: 'الأشخاص', itemLabel: 'شخص', itemTitle: 'name', itemSub: 'role', itemThumb: 'photo', makeItem: () => ({ name: '' }),
          itemFields: [{ type: 'text', path: 'name', label: 'الاسم' }, { type: 'text', path: 'role', label: 'الدور' }, { type: 'image', path: 'photo', label: 'الصورة', optional: true, round: true }] },
      ],
    },
    {
      id: 'reviews', label: 'قالوا عنّا', icon: Star, hideable: true, empty: has((s) => s?.reviews?.items),
      fields: [
        { type: 'text', path: 'reviews.heading', label: 'العنوان' },
        { type: 'array', path: 'reviews.items', label: 'الآراء', itemLabel: 'رأي', itemTitle: 'name', itemSub: 'from', makeItem: () => ({ name: '', text: '' }),
          itemFields: [{ type: 'text', path: 'name', label: 'الاسم' }, { type: 'text', path: 'from', label: 'من أين' }, { type: 'textarea', path: 'text', label: 'ما قاله', rows: 3 }] },
      ],
    },
    {
      id: 'press', label: 'ذُكرنا في', icon: Newspaper, hideable: true, empty: has((s) => s?.press?.items),
      fields: [
        { type: 'text', path: 'press.heading', label: 'العنوان' },
        { type: 'array', path: 'press.items', label: 'الأخبار', itemLabel: 'خبر', itemTitle: 'name', makeItem: () => ({ name: '', url: '' }),
          itemFields: [{ type: 'text', path: 'name', label: 'اسم الجهة' }, { type: 'url', path: 'url', label: 'رابط الخبر' }] },
      ],
    },
    {
      id: 'contact', label: 'التواصل والشراء', icon: Phone,
      fields: [
        { type: 'text', path: 'contact.heading', label: 'العنوان' },
        { type: 'choice', path: 'buy', label: 'الزر الرئيسي', fallback: 'whatsapp', options: [
          { value: 'whatsapp', label: 'رسالة واتساب' }, { value: 'call', label: 'اتصال' }, { value: 'store', label: 'المتجر' }, { value: 'email', label: 'البريد' }, { value: 'instagram', label: 'رسالة إنستغرام' },
        ] },
        { type: 'tel', path: 'contact.whatsapp', label: 'واتساب', placeholderFrom: 'contact.phone' },
        { type: 'tel', path: 'contact.phone', label: 'الهاتف' },
        { type: 'email', path: 'contact.email', label: 'البريد' },
        { type: 'url', path: 'links.store', label: 'رابط المتجر' },
        { type: 'textarea', path: 'contact.address', label: 'العنوان', rows: 2 },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'social', label: 'الحسابات والتذييل', icon: Mail,
      fields: [
        { type: 'social', path: 'links.instagram', label: 'إنستغرام', net: 'instagram' },
        { type: 'social', path: 'links.tiktok', label: 'تيك توك', net: 'tiktok' },
        { type: 'social', path: 'links.facebook', label: 'فيسبوك', net: 'facebook' },
        { type: 'social', path: 'links.snapchat', label: 'سناب شات', net: 'snapchat' },
        { type: 'social', path: 'links.x', label: 'إكس', net: 'x' },
        { type: 'social', path: 'links.youtube', label: 'يوتيوب', net: 'youtube' },
        { type: 'text', path: 'footer.tagline', label: 'جملة التذييل' },
      ],
    },
  ],
}

/** A v2 brand site gets the brand editor; an old studio site keeps its own. */
export function studioConfigFor(root: any): EditorConfig {
  return root?.studio?.v === 2 ? BRAND_EDITOR_CONFIG : STUDIO_EDITOR_CONFIG
}
