import {
  Home as HomeIcon, FileText, Image as ImageIcon, MapPin, Type as TypeIcon,
  Star, Sparkles, MessageCircle, Calendar, Mail, Newspaper, HelpCircle,
  AtSign, Phone,
} from 'lucide-react'
import { RESTAURANT_PRESETS } from './presets'
import type { EditorConfig, EditorFieldDef } from '@/utils/theme-editor-types'

/*
 * The restaurant template's editor. Labels, hints, limits and groups are the
 * editor sample's (the v6 editor, components/editor/v6); the paths are the
 * template's content. `ic` names an icon in the v6 sprite, `icon` is the
 * lucide icon older surfaces read.
 */

const TOKENS = [
  { key: 'primary',    label: 'الأساسي' },
  { key: 'accent',     label: 'اللون المميز' },
  { key: 'background', label: 'الخلفية' },
  { key: 'surface',    label: 'البطاقات' },
  { key: 'text',       label: 'النص' },
  { key: 'muted',      label: 'النص الثانوي' },
  { key: 'border',     label: 'الخطوط الفاصلة' },
]

const plural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 0 ? `لا ${many}` : n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`

const T = (path: string, label: string, o: Partial<Extract<EditorFieldDef, { type: 'text' }>> = {}): EditorFieldDef => ({ type: 'text', path, label, ...o })
const A = (path: string, label: string, o: Partial<Extract<EditorFieldDef, { type: 'textarea' }>> = {}): EditorFieldDef => ({ type: 'textarea', path, label, rows: 2, ...o })
const G = (label: string): EditorFieldDef => ({ type: 'group', label })

const NETS: Record<string, string> = { instagram: 'إنستغرام', whatsapp: 'واتساب', tiktok: 'تيك توك', facebook: 'فيسبوك', youtube: 'يوتيوب', website: 'موقع آخر' }

export const RESTAURANT_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'restaurant',
  themeName:       'مطعم',
  defaultPresetId: 'onyx',
  brandNamePath:   'brand.name',
  phonePath:       'hours_location.phone',
  colorPresets:    RESTAURANT_PRESETS,
  colorTokens:     TOKENS,
  colorHints: {
    primary: 'الشريط العلوي وأسفل الصفحة',
    accent: 'الأزرار والأسعار والنجوم',
    background: 'لون الصفحة',
    surface: 'خلف الساعات والآراء',
    text: 'العناوين والنص الأساسي',
    muted: 'الأوصاف والملاحظات',
    border: 'الحدود بين العناصر',
  },
  pinned: ['brand_global', 'footer'],

  pages: [
    { id: 'home',    label: 'الرئيسية', icon: HomeIcon,  ic: 'home' },
    { id: 'menu',    label: 'القائمة',  icon: FileText,  ic: 'book' },
    { id: 'gallery', label: 'المعرض',   icon: ImageIcon, ic: 'gallery' },
    { id: 'visit',   label: 'زورونا',   icon: MapPin,    ic: 'pin' },
    { id: 'about',   label: 'من نحن',   icon: TypeIcon,  ic: 'text' },
    { id: 'reviews', label: 'الآراء',   icon: Star,      ic: 'star' },
  ],

  panels: [
    /* ── Home ─────────────────────────────────────────────────────────── */
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, ic: 'sparkle', page: 'home', hideable: true,
      desc: 'أول ما يراه الزائر',
      summary: (c) => String(c?.hero?.headline || '').replace(/\n/g, ' '),
      fields: [
        G('النصوص'),
        T('hero.eyebrow', 'سطر صغير فوق العنوان', { max: 45, suggest: true }),
        A('hero.headline', 'العنوان الكبير', { max: 40, multi: true, hint: 'اضغط Enter لتبدأ سطرًا جديدًا.', suggest: true }),
        A('hero.subheadline', 'النص تحت العنوان', { rows: 3, max: 180, suggest: true }),
        G('الأزرار'),
        T('hero.primary_cta', 'الزر الأول', { max: 22, hint: 'يأخذ الزائر إلى الحجز.', suggest: true }),
        T('hero.secondary_cta', 'الزر الثاني', { max: 22, hint: 'يأخذ الزائر إلى القائمة.' }),
        G('الصورة'),
        { type: 'image', path: 'hero.image', label: 'صورة الخلفية' },
      ],
    },
    {
      id: 'signature_dishes', label: 'أطباقنا المميزة', icon: Star, ic: 'dish', page: 'home', hideable: true,
      desc: 'أربعة أطباق بالصور',
      summary: (c) => plural((c?.signature_dishes || []).length, 'طبق واحد', 'طبقان', 'أطباق', 'طبقًا'),
      empty: (c) => !(c?.signature_dishes || []).length,
      fields: [
        A('signature_dishes_heading', 'عنوان القسم', { max: 50 }),
        {
          type: 'array', path: 'signature_dishes',
          label: 'الأطباق', itemLabel: 'طبق', itemAcc: 'طبقًا', itemTitle: 'name', itemSub: 'price', itemThumb: 'image', show: 4,
          makeItem: () => ({ name: 'طبق جديد', description: '', price: '', image: '' }),
          itemFields: [
            T('name', 'اسم الطبق', { max: 40, need: true }),
            A('description', 'الوصف', { max: 90 }),
            { type: 'price', path: 'price', label: 'السعر' },
            { type: 'image', path: 'image', label: 'صورة الطبق', optional: true, hint: 'بلا صورة يظهر مكانها لوحٌ بلونك المميز.' },
          ],
        },
      ],
    },
    {
      id: 'press', label: 'في الصحافة', icon: Newspaper, ic: 'news', page: 'home', hideable: true,
      desc: 'ما كُتب عنكم',
      summary: (c) => ((c?.press?.items || []).length ? plural(c.press.items.length, 'ذكر واحد', 'ذكران', 'مرات', 'مرة') : 'فارغ'),
      empty: (c) => !(c?.press?.items || []).some((x: any) => String(x?.outlet || '').trim()),
      fields: [
        { type: 'note', tone: 'info', content: 'أضف فقط ما كُتب عنكم فعلًا. إذا بقيت القائمة فارغة لا يظهر القسم في موقعك.' },
        T('press.heading', 'عنوان القسم'),
        {
          type: 'array', path: 'press.items',
          label: 'الذِّكر في الإعلام', itemLabel: 'ذِكر', itemAcc: 'ذِكرًا', itemTitle: 'outlet', itemSub: 'quote',
          makeItem: () => ({ outlet: '', quote: '' }),
          itemFields: [
            T('outlet', 'اسم الصحيفة أو الموقع'),
            A('quote', 'ماذا قالوا (اختياري)'),
          ],
        },
      ],
    },
    {
      id: 'newsletter', label: 'النشرة البريدية', icon: Mail, ic: 'mail', page: 'home', hideable: true,
      desc: 'اشتراك بالبريد',
      summary: (c) => String(c?.newsletter?.heading || ''),
      fields: [
        { type: 'note', tone: 'info', content: 'كل اشتراك يصلك في صفحة الحجوزات في لوحة التحكم.' },
        A('newsletter.heading', 'العنوان', { max: 40 }),
        A('newsletter.subheading', 'النص', { max: 140 }),
        T('newsletter.button_label', 'نص الزر', { max: 16 }),
      ],
    },

    /* ── Menu ─────────────────────────────────────────────────────────── */
    {
      id: 'menu', label: 'قائمة الطعام', icon: FileText, ic: 'book', page: 'menu', hideable: true,
      desc: 'الفئات والأصناف والأسعار',
      summary: (c) => {
        const cats = c?.menu?.categories || []
        const n = cats.reduce((a: number, x: any) => a + (x?.items || []).length, 0)
        return `${plural(cats.length, 'فئة واحدة', 'فئتان', 'فئات', 'فئة')} · ${plural(n, 'صنف واحد', 'صنفان', 'أصناف', 'صنفًا')}`
      },
      fields: [
        A('menu.heading', 'العنوان', { max: 40 }),
        A('menu.subheading', 'النص تحت العنوان', { max: 160 }),
        {
          type: 'array', path: 'menu.categories',
          label: 'الفئات', itemLabel: 'فئة', itemTitle: 'name',
          itemCount: { path: 'items', one: 'صنف واحد', two: 'صنفان', few: 'أصناف', many: 'صنفًا' },
          makeItem: () => ({ id: 'c' + Math.random().toString(36).slice(2, 8), name: 'فئة جديدة', description: '', items: [] }),
          itemFields: [
            T('name', 'اسم الفئة', { max: 30 }),
            A('description', 'سطر تحت الفئة', { max: 80 }),
            {
              type: 'array', path: 'items',
              label: 'الأصناف', itemLabel: 'صنف', itemAcc: 'صنفًا', itemTitle: 'name', itemSub: 'price', itemThumb: 'image',
              makeItem: () => ({ name: 'صنف جديد', description: '', price: '', badge: '', image: '' }),
              itemFields: [
                T('name', 'اسم الصنف', { max: 40, need: true }),
                A('description', 'الوصف', { max: 90 }),
                { type: 'price', path: 'price', label: 'السعر' },
                { type: 'badge', path: 'badge', label: 'شارة (اختياري)', options: ['طبق التوقيع', 'جديد', 'نباتي', 'حار', 'للمشاركة'] },
                { type: 'image', path: 'image', label: 'صورة (اختياري)', optional: true },
              ],
            },
          ],
        },
      ],
    },

    /* ── Gallery ──────────────────────────────────────────────────────── */
    {
      id: 'gallery', label: 'المعرض', icon: ImageIcon, ic: 'gallery', page: 'gallery', hideable: true,
      desc: 'صور المكان والأطباق',
      summary: (c) => plural((c?.gallery?.images || []).length, 'صورة واحدة', 'صورتان', 'صور', 'صورة'),
      fields: [
        A('gallery.heading', 'العنوان', { max: 40 }),
        A('gallery.subheading', 'النص', { max: 100 }),
        {
          type: 'array', path: 'gallery.images',
          label: 'الصور', itemLabel: 'صورة', itemTitle: 'alt', itemThumb: 'url',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'الصورة' },
            T('alt', 'وصف الصورة', { hint: 'جملة قصيرة تصف الصورة. تساعد من لا يرى الصور، وتساعد Google.', need: { t: (n) => (n === 1 ? 'صورة بلا وصف' : `${n} صور بلا وصف`), d: 'الوصف يساعد من لا يرى الصور، ويساعد Google.' } }),
          ],
        },
        {
          type: 'choice', path: 'gallery.attribution', label: 'سطر مصدر الصور', fallback: '',
          options: [{ value: '', label: 'بلا سطر' }, { value: 'from_venue', label: 'من المطعم' }, { value: 'from_unsplash', label: 'من Unsplash' }],
        },
      ],
    },

    /* ── Visit ────────────────────────────────────────────────────────── */
    {
      id: 'hours_location', label: 'المواعيد والعنوان', icon: MapPin, ic: 'clock', page: 'visit', hideable: true,
      desc: 'الساعات والهاتف والخريطة',
      summary: (c) => {
        const cl = (c?.hours_location?.hours || []).filter((x: any) => x?.closed).map((x: any) => x.label)
        return cl.length ? `مغلق ${cl.join(' و')}` : 'مفتوح كل الأيام'
      },
      fields: [
        A('hours_location.heading', 'العنوان', { max: 40 }),
        A('hours_location.subheading', 'النص', { max: 100 }),
        G('ساعات العمل'),
        { type: 'hours', path: 'hours_location.hours' },
        G('التواصل'),
        T('hours_location.address', 'العنوان البريدي', { need: true }),
        { type: 'tel', path: 'hours_location.phone', label: 'الهاتف', need: { t: 'رقم الهاتف فارغ', d: 'الضيوف يتصلون قبل أن يأتوا.' } },
        { type: 'email', path: 'hours_location.email', label: 'البريد الإلكتروني' },
        { type: 'url', path: 'hours_location.map_link', label: 'رابط الموقع على الخريطة', placeholder: 'https://maps.google.com/…', hint: 'افتح مكانك في خرائط Google واختر «مشاركة» ثم انسخ الرابط.' },
      ],
    },
    {
      id: 'reservations', label: 'الحجوزات', icon: Calendar, ic: 'cal', page: 'visit', hideable: true,
      desc: 'كيف يحجز الضيف',
      summary: (c) => (c?.reservations?.provider?.type === 'phone' ? 'بالاتصال الهاتفي' : 'نموذج حجز يصل إلى لوحتك'),
      fields: [
        A('reservations.heading', 'العنوان', { max: 40 }),
        A('reservations.subheading', 'النص', { rows: 3, max: 180 }),
        {
          type: 'choice', path: 'reservations.provider.type', label: 'طريقة الحجز', fallback: 'form',
          options: [{ value: 'form', label: 'نموذج حجز' }, { value: 'phone', label: 'اتصال هاتفي' }],
          hints: { form: 'يملأ الضيف النموذج، ويصلك الطلب في صفحة الحجوزات.', phone: 'يظهر زر يتصل بك مباشرة.' },
        },
        { type: 'tel', path: 'reservations.provider.number', label: 'رقم الحجز', placeholderFrom: 'hours_location.phone', hint: 'إذا تركته فارغًا نستخدم رقم المطعم.', when: (c) => c?.reservations?.provider?.type === 'phone' },
        T('reservations.cta_label', 'نص زر الاتصال', { max: 22, when: (c) => c?.reservations?.provider?.type === 'phone' }),
        A('reservations.note', 'ملاحظة تحت الحجز', { max: 160 }),
      ],
    },

    /* ── About ────────────────────────────────────────────────────────── */
    {
      id: 'story', label: 'قصتنا', icon: TypeIcon, ic: 'text', page: 'about', hideable: true,
      desc: 'المطعم والشيف',
      summary: (c) => String(c?.story?.heading || ''),
      fields: [
        G('القصة'),
        T('story.eyebrow', 'سطر صغير فوق العنوان', { max: 30 }),
        A('story.heading', 'العنوان', { max: 50, suggest: true }),
        A('story.body', 'نص القصة', { rows: 5, max: 420, suggest: true }),
        { type: 'image', path: 'story.accent_image', label: 'الصورة الكبيرة' },
        G('الشيف'),
        T('story.chef_name', 'الاسم'),
        T('story.chef_title', 'الصفة'),
        A('story.chef_bio', 'نبذة', { rows: 3, max: 240, suggest: true }),
        { type: 'image', path: 'story.chef_photo', label: 'الصورة الدائرية', round: true, optional: true },
      ],
    },

    /* ── Reviews ──────────────────────────────────────────────────────── */
    {
      id: 'reviews', label: 'آراء الضيوف', icon: Star, ic: 'star', page: 'reviews', hideable: true,
      desc: 'التقييم والآراء',
      summary: (c) => `${(+c?.reviews?.overall_rating || 0).toFixed(1)} · ${plural((c?.reviews?.testimonials || []).length, 'رأي واحد', 'رأيان', 'آراء', 'رأيًا')}`,
      empty: (c) => !(c?.reviews?.testimonials || []).length,
      fields: [
        { type: 'reviews', path: 'reviews.testimonials' },
        A('reviews.heading', 'العنوان', { max: 40 }),
        A('reviews.subheading', 'النص', { max: 120 }),
        { type: 'rating', path: 'reviews.overall_rating', label: 'التقييم العام' },
        T('reviews.review_count', 'عدد التقييمات', { hint: 'يظهر هكذا: «بناءً على +630 تقييم من ضيوفنا».' }),
        {
          type: 'array', path: 'reviews.testimonials',
          label: 'الآراء المعروضة', itemLabel: 'رأي', itemAcc: 'رأيًا', itemTitle: 'name', itemSub: 'source', show: 4,
          makeItem: () => ({ name: '', text: '', source: '', rating: 5 }),
          itemFields: [
            T('name', 'اسم الضيف'),
            A('text', 'ماذا قال', { rows: 3, max: 200 }),
            T('source', 'المصدر (اختياري)'),
            { type: 'stars', path: 'rating', label: 'تقييمه' },
          ],
        },
      ],
    },
    {
      id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle, ic: 'faq', page: 'reviews', hideable: true,
      desc: 'أسئلة قبل الزيارة',
      summary: (c) => plural((c?.faq?.items || []).length, 'سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا'),
      empty: (c) => !(c?.faq?.items || []).length,
      fields: [
        T('faq.heading', 'العنوان', { max: 40 }),
        {
          type: 'array', path: 'faq.items',
          label: 'الأسئلة', itemLabel: 'سؤال', itemAcc: 'سؤالًا', itemTitle: 'q',
          makeItem: () => ({ q: 'سؤال جديد؟', a: '' }),
          itemFields: [
            T('q', 'السؤال', { max: 80 }),
            A('a', 'الإجابة', { rows: 3, max: 300 }),
          ],
        },
      ],
    },
  ],

  /* ── Every page ─────────────────────────────────────────────────────── */
  globalPanels: [
    {
      id: 'brand_global', label: 'الاسم والهوية', icon: Sparkles, ic: 'brand',
      desc: 'في أعلى كل صفحة',
      summary: (c) => String(c?.brand?.name || ''),
      fields: [
        { type: 'logo' },
        T('brand.name', 'اسم المطعم', { max: 30, need: { t: 'اسم المطعم فارغ' } }),
        T('brand.cuisine', 'نوع المطبخ'),
        T('brand.tagline', 'جملة تعريفية', { max: 90 }),
        T('brand.city', 'المدينة'),
        T('brand.neighborhood', 'الحي'),
        { type: 'note', tone: 'link', content: 'الشريط العلوي يعرض العنوان والهاتف والبريد من قسم «المواعيد والعنوان».', go: 'hours_location' },
      ],
    },
    {
      id: 'social', label: 'روابط التواصل', icon: AtSign, ic: 'at',
      desc: 'في أسفل كل صفحة',
      summary: (c) => {
        const n = Object.keys(NETS).filter((k) => c?.social_links?.[k])
        return n.length ? n.map((k) => NETS[k]).join('، ') : 'لا روابط بعد'
      },
      fields: [
        { type: 'note', tone: 'info', content: 'اكتب اسم الحساب أو الرابط كما تحب، ونرتّبه نحن. ما تتركه فارغًا لا يظهر.' },
        { type: 'social', path: 'social_links.instagram', label: 'إنستغرام', net: 'instagram' },
        { type: 'social', path: 'social_links.whatsapp', label: 'واتساب', net: 'whatsapp', tip: { t: 'أضف رقم واتساب', d: 'كثير من الضيوف يسألون على واتساب قبل أن يحجزوا.' } },
        { type: 'social', path: 'social_links.tiktok', label: 'تيك توك', net: 'tiktok' },
        { type: 'social', path: 'social_links.facebook', label: 'فيسبوك', net: 'facebook' },
        { type: 'social', path: 'social_links.youtube', label: 'يوتيوب', net: 'youtube' },
        { type: 'social', path: 'social_links.website', label: 'موقع آخر', net: 'website' },
      ],
    },
    {
      id: 'footer', label: 'أسفل الصفحة', icon: Phone, ic: 'foot',
      desc: 'في أسفل كل صفحة',
      summary: (c) => String(c?.footer?.tagline || ''),
      fields: [
        A('footer.tagline', 'الجملة تحت الاسم', { max: 100 }),
        T('footer.legal', 'سطر الحقوق'),
      ],
    },
    {
      id: 'seo', label: 'الظهور في Google', icon: MessageCircle, ic: 'g',
      desc: 'العنوان والوصف في نتائج البحث',
      summary: (c) => String(c?.seo?.title || ''),
      fields: [
        { type: 'snippet', title: 'seo.title', description: 'seo.description', name: 'brand.name' },
        T('seo.title', 'عنوان الصفحة في Google', { max: 60, cut: true, need: { t: 'عنوان Google فارغ' } }),
        A('seo.description', 'الوصف في Google', { rows: 3, max: 160, cut: true, min: 70, need: { t: 'وصف Google فارغ', d: 'هذا ما يقرؤه الناس تحت اسمك في نتائج البحث.' } }),
      ],
    },
  ],
}
