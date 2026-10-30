import {
  Sparkles, Wrench, Star, MapPin, Phone, Award, HelpCircle, Image as ImageIcon,
  Quote, Home as HomeIcon, BookOpen, Workflow, MessageCircle,
} from 'lucide-react'
import { SERVICE_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'
import { isTwoLanguageName } from './brand-name'

const TOKENS = [
  { key: 'primary',    label: 'الأساسي' },
  { key: 'accent',     label: 'اللون المميز' },
  { key: 'background', label: 'الخلفية' },
  { key: 'surface',    label: 'الأسطح' },
  { key: 'text',       label: 'النص' },
  { key: 'muted',      label: 'نص خافت' },
  { key: 'border',     label: 'الحدود' },
]

const plural = (n: number, one: string, two: string, few: string, many: string) =>
  n === 0 ? `لا ${many}` : n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`

export const SERVICES_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'services',
  themeName:       'خدمات',
  defaultPresetId: 'cobalt',
  brandNamePath:   'brand.name',
  phonePath:       'footer.phone',
  pinned:          ['footer'],
  colorPresets:    SERVICE_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',     label: 'الرئيسية',     icon: HomeIcon },
    { id: 'services', label: 'الخدمات', icon: Wrench },
    { id: 'about',    label: 'من نحن',    icon: BookOpen },
    { id: 'process',  label: 'طريقة العمل',  icon: Workflow },
    { id: 'contact',  label: 'تواصل',  icon: Phone },
  ],

  panels: [
    {
      id: 'brand', label: 'النشاط التجاري', icon: Sparkles, ic: 'brand',
      desc: 'الاسم والشعار والمجال',
      summary: (c) => String(c?.brand?.name || ''),
      fields: [
        { type: 'text', path: 'brand.name',       label: 'اسم النشاط' },
        {
          type: 'choice', path: 'brand.name_display', label: 'إذا كان الاسم بالعربي والإنجليزي', fallback: 'rotate',
          when: (c: any) => isTwoLanguageName(c?.brand?.name),
          options: [
            { value: 'rotate', label: 'يتبدّل' },
            { value: 'stack', label: 'الاثنان معًا' },
            { value: 'arabic', label: 'العربي فقط' },
            { value: 'latin', label: 'الإنجليزي فقط' },
          ],
          hint: 'الاسم المكتوب بلغة واحدة يظهر كما هو.',
        },
        { type: 'logo' },
        { type: 'toggle', path: 'brand.show_logo', label: 'الشعار بجانب الاسم', fallback: false },
        { type: 'text', path: 'brand.category',   label: 'المجال (مثل: سباكة)' },
        { type: 'text', path: 'brand.city',       label: 'المدينة' },
        { type: 'text', path: 'brand.region',     label: 'المنطقة' },
        { type: 'text', path: 'brand.tagline',    label: 'الشعار النصي' },
        { type: 'text', path: 'brand.owner_name', label: 'اسم المالك (اختياري)' },
      ],
    },
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, ic: 'sparkle', page: 'home',
      desc: 'أول ما يراه الزائر',
      summary: (c) => String(c?.hero?.headline || '').replace(/\n/g, ' '),
      fields: [
        { type: 'group', label: 'النصوص' },
        { type: 'text',     path: 'hero.eyebrow',       label: 'سطر صغير فوق العنوان', max: 45, suggest: true },
        { type: 'textarea', path: 'hero.headline',      label: 'العنوان الكبير', rows: 2, max: 50, suggest: true },
        { type: 'textarea', path: 'hero.subheadline',   label: 'النص تحت العنوان', rows: 3, max: 180, suggest: true },
        { type: 'group', label: 'الأزرار' },
        { type: 'text',     path: 'hero.primary_cta',   label: 'الزر الأول', max: 22 },
        { type: 'text',     path: 'hero.secondary_cta', label: 'الزر الثاني', max: 22 },
        { type: 'group', label: 'الصورة والأرقام' },
        { type: 'image',    path: 'hero.image',         label: 'صورة الخلفية' },
        {
          type: 'array', path: 'hero.stats',
          label: 'الأرقام', itemLabel: 'رقم', itemTitle: 'label',
          makeItem: () => ({ value: '0', label: 'رقم جديد' }),
          itemFields: [
            { type: 'text', path: 'value', label: 'القيمة' },
            { type: 'text', path: 'label', label: 'التسمية' },
          ],
        },
      ],
    },
    {
      id: 'trust_bar', label: 'شريط الثقة', icon: Star, ic: 'shield', page: 'home',
      desc: 'سطر قصير تحت الواجهة',
      summary: (c) => plural((c?.trust_bar?.items || []).length, 'عنصر واحد', 'عنصران', 'عناصر', 'عنصرًا'),
      fields: [
        { type: 'strings', path: 'trust_bar.items', label: 'عناصر الثقة', addLabel: 'إضافة عنصر' },
      ],
    },
    {
      id: 'services', label: 'الخدمات', icon: Wrench, ic: 'wand', pages: ['home', 'services'],
      desc: 'ما تقدّمه لعملائك',
      summary: (c) => plural((c?.services?.items || []).length, 'خدمة واحدة', 'خدمتان', 'خدمات', 'خدمة'),
      fields: [
        { type: 'textarea', path: 'services.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'services.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'services.items',
          label: 'الخدمات', itemLabel: 'خدمة', itemTitle: 'name',
          makeItem: () => ({ name: 'خدمة جديدة', description: '', price_from: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'الاسم' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 3, max: 140, suggest: true },
            { type: 'text',     path: 'price_from',  label: 'السعر يبدأ من' },
            { type: 'text',     path: 'badge',       label: 'شارة (اختياري)' },
          ],
        },
      ],
    },
    {
      id: 'story', label: 'قصتنا', icon: Quote, ic: 'text', page: 'about',
      desc: 'من أنتم وكيف تعملون',
      summary: (c) => String(c?.story?.heading || ''),
      fields: [
        { type: 'text',     path: 'story.eyebrow',     label: 'عنوان صغير' },
        { type: 'textarea', path: 'story.heading',     label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'story.body',        label: 'النص', rows: 5, max: 420, suggest: true },
        { type: 'text',     path: 'story.owner_name',  label: 'اسم المالك' },
        { type: 'text',     path: 'story.owner_title', label: 'صفة المالك' },
        { type: 'textarea', path: 'story.quote',       label: 'الاقتباس', rows: 2 },
        { type: 'image',    path: 'story.image',       label: 'صورة المالك' },
      ],
    },
    {
      id: 'proof', label: 'لماذا نحن', icon: Award, ic: 'shield', pages: ['home', 'about'],
      desc: 'نقاط قوتك',
      summary: (c) => plural((c?.proof?.items || []).length, 'نقطة واحدة', 'نقطتان', 'نقاط', 'نقطة'),
      fields: [
        { type: 'textarea', path: 'proof.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'proof.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'proof.items',
          label: 'نقاط القوة', itemLabel: 'ميزة', itemTitle: 'title',
          makeItem: () => ({ title: 'ميزة جديدة', text: '' }),
          itemFields: [
            { type: 'text',     path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'text',  label: 'النص', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'before_after', label: 'قبل / بعد', icon: ImageIcon, ic: 'gallery', page: 'services',
      desc: 'صورتان تقارنان العمل',
      fields: [
        { type: 'textarea', path: 'before_after.heading',      label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'before_after.subheading',   label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'before_after.before_label', label: 'تسمية "قبل"' },
        { type: 'text',     path: 'before_after.after_label',  label: 'تسمية "بعد"' },
        { type: 'image',    path: 'before_after.before_image', label: 'صورة قبل' },
        { type: 'image',    path: 'before_after.after_image',  label: 'صورة بعد' },
        { type: 'strings',  path: 'before_after.highlights',   label: 'أبرز النقاط', addLabel: 'إضافة نقطة' },
      ],
    },
    {
      id: 'process', label: 'طريقة العمل', icon: Workflow, ic: 'layers', pages: ['home', 'process'],
      desc: 'خطوات العمل',
      summary: (c) => plural((c?.process?.steps || []).length, 'خطوة واحدة', 'خطوتان', 'خطوات', 'خطوة'),
      fields: [
        { type: 'textarea', path: 'process.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'process.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'process.steps',
          label: 'الخطوات', itemLabel: 'خطوة', itemTitle: 'title',
          makeItem: () => ({ step: '', title: '', text: '' }),
          itemFields: [
            { type: 'text',     path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'text',  label: 'النص', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'areas', label: 'مناطق الخدمة', icon: MapPin, ic: 'map', page: 'contact',
      desc: 'أين تقدّم خدماتك',
      summary: (c) => plural((c?.areas?.areas_served || []).length, 'منطقة واحدة', 'منطقتان', 'مناطق', 'منطقة'),
      fields: [
        { type: 'textarea', path: 'areas.heading',       label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'areas.subheading',    label: 'العنوان الفرعي', rows: 2 },
        { type: 'strings',  path: 'areas.areas_served',  label: 'المناطق', addLabel: 'إضافة منطقة' },
        { type: 'text',     path: 'areas.response_time', label: 'سرعة الاستجابة' },
        { type: 'text',     path: 'areas.availability',  label: 'أوقات التوفر' },
      ],
    },
    {
      id: 'offer', label: 'طلب عرض السعر', icon: Sparkles, ic: 'sparkle', pages: ['home', 'contact'],
      desc: 'دعوة لطلب عرض سعر',
      summary: (c) => String(c?.offer?.heading || '').replace(/\n/g, ' '),
      fields: [
        { type: 'text',     path: 'offer.badge',      label: 'شارة' },
        { type: 'textarea', path: 'offer.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'offer.subheading', label: 'العنوان الفرعي', rows: 2 },
        { type: 'strings',  path: 'offer.points',     label: 'النقاط', addLabel: 'إضافة نقطة' },
        { type: 'text',     path: 'offer.cta_label',  label: 'نص الزر' },
      ],
    },
    {
      id: 'testimonials', label: 'آراء العملاء', icon: Star, ic: 'star', pages: ['home', 'about'],
      desc: 'التقييم والآراء',
      summary: (c) => `${(+c?.testimonials?.average_rating || 0).toFixed(1)} · ${plural((c?.testimonials?.items || []).length, 'رأي واحد', 'رأيان', 'آراء', 'رأيًا')}`,
      fields: [
        { type: 'reviews', path: 'testimonials.items' },
        { type: 'textarea', path: 'testimonials.heading',        label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'testimonials.subheading',     label: 'العنوان الفرعي', rows: 2 },
        { type: 'rating',   path: 'testimonials.average_rating', label: 'متوسط التقييم' },
        { type: 'text',     path: 'testimonials.review_count',   label: 'عدد التقييمات' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'التقييمات', itemLabel: 'تقييم', itemTitle: 'name',
          makeItem: () => ({ name: 'عميل', text: '', source: '', rating: 5 }),
          itemFields: [
            { type: 'text',     path: 'name',   label: 'الاسم' },
            { type: 'textarea', path: 'text',   label: 'الاقتباس', rows: 3 },
            { type: 'text',     path: 'source', label: 'المصدر (اختياري)' },
            { type: 'stars',    path: 'rating', label: 'تقييمه' },
          ],
        },
      ],
    },
    {
      id: 'gallery', label: 'المعرض', icon: ImageIcon, ic: 'gallery', page: 'services',
      desc: 'صور أعمالك',
      summary: (c) => plural((c?.gallery?.images || []).length, 'صورة واحدة', 'صورتان', 'صور', 'صورة'),
      fields: [
        { type: 'text', path: 'gallery.heading', label: 'العنوان' },
        {
          type: 'array', path: 'gallery.images',
          label: 'الصور', itemLabel: 'صورة', itemTitle: 'alt',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'صورة' },
            { type: 'text',  path: 'alt', label: 'وصف الصورة' },
          ],
        },
      ],
    },
    {
      id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle, ic: 'faq', pages: ['process', 'contact'],
      desc: 'أسئلة قبل الطلب',
      summary: (c) => plural((c?.faq?.items || []).length, 'سؤال واحد', 'سؤالان', 'أسئلة', 'سؤالًا'),
      fields: [
        { type: 'text', path: 'faq.heading', label: 'العنوان' },
        {
          type: 'array', path: 'faq.items',
          label: 'الأسئلة', itemLabel: 'سؤال', itemTitle: 'q',
          makeItem: () => ({ q: 'سؤال جديد؟', a: '' }),
          itemFields: [
            { type: 'text',     path: 'q', label: 'السؤال' },
            { type: 'textarea', path: 'a', label: 'الإجابة', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'final_cta', label: 'الدعوة الختامية', icon: Sparkles, ic: 'send', pages: ['services', 'about', 'process'],
      desc: 'الدعوة في آخر الصفحة',
      summary: (c) => String(c?.final_cta?.heading || '').replace(/\n/g, ' '),
      fields: [
        { type: 'textarea', path: 'final_cta.heading',        label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'final_cta.subheading',     label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'final_cta.cta_label',      label: 'نص الزر' },
        { type: 'text',     path: 'final_cta.secondary_text', label: 'نص إضافي' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'links', label: 'واتساب والتواصل الاجتماعي', icon: MessageCircle, ic: 'at',
      desc: 'في أسفل كل صفحة',
      fields: [
        { type: 'note', content: 'كل رابط فارغ لا يظهر في الموقع. اكتب الرابط كاملًا أو اسم الحساب فقط.' },
        { type: 'text', path: 'links.whatsapp',         label: 'رقم واتساب (بمفتاح الدولة)', placeholder: '+966 55 555 0187' },
        { type: 'text', path: 'social_links.instagram', label: 'إنستغرام', placeholder: '@yourbusiness' },
        { type: 'text', path: 'social_links.tiktok',    label: 'تيك توك', placeholder: '@yourbusiness' },
        { type: 'text', path: 'social_links.snapchat',  label: 'سناب شات', placeholder: 'yourbusiness' },
        { type: 'text', path: 'social_links.facebook',  label: 'فيسبوك', placeholder: 'facebook.com/yourbusiness' },
        { type: 'text', path: 'social_links.x',         label: 'إكس (تويتر)', placeholder: '@yourbusiness' },
        { type: 'text', path: 'social_links.youtube',   label: 'يوتيوب', placeholder: 'youtube.com/@yourbusiness' },
        { type: 'text', path: 'links.reviews_url',      label: 'رابط تقييماتك على Google' },
      ],
    },
    {
      id: 'footer', label: 'تذييل الصفحة', icon: Phone, ic: 'foot',
      desc: 'في أسفل كل صفحة',
      summary: (c) => String(c?.footer?.tagline || ''),
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'الشعار النصي' },
        { type: 'text', path: 'footer.legal',   label: 'النص القانوني' },
        { type: 'tel',   path: 'footer.phone',   label: 'الهاتف' },
        { type: 'email', path: 'footer.email',   label: 'البريد الإلكتروني' },
        { type: 'text', path: 'footer.address', label: 'العنوان البريدي' },
      ],
    },
  ],
}
