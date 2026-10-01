import {
  Sparkles, Wrench, Star, MapPin, Phone, Award, HelpCircle, Image as ImageIcon,
  Quote, Home as HomeIcon, BookOpen, Workflow,
} from 'lucide-react'
import { SERVICE_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',    label: 'الأساسي' },
  { key: 'accent',     label: 'اللون المميز' },
  { key: 'background', label: 'الخلفية' },
  { key: 'surface',    label: 'الأسطح' },
  { key: 'text',       label: 'النص' },
  { key: 'muted',      label: 'نص خافت' },
  { key: 'border',     label: 'الحدود' },
]

export const SERVICES_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'services',
  themeName:       'خدمات',
  defaultPresetId: 'cobalt',
  brandNamePath:   'brand.name',
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
      id: 'brand', label: 'النشاط التجاري', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',       label: 'اسم النشاط' },
        { type: 'text', path: 'brand.category',   label: 'المجال (مثل: سباكة)' },
        { type: 'text', path: 'brand.city',       label: 'المدينة' },
        { type: 'text', path: 'brand.region',     label: 'المنطقة' },
        { type: 'text', path: 'brand.tagline',    label: 'الشعار النصي' },
        { type: 'text', path: 'brand.owner_name', label: 'اسم المالك (اختياري)' },
      ],
    },
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'hero.headline',      label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'العنوان الفرعي', rows: 3 },
        { type: 'text',     path: 'hero.primary_cta',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'hero.secondary_cta', label: 'الزر الثاني' },
        { type: 'image',    path: 'hero.image',         label: 'صورة الواجهة' },
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
      id: 'trust_bar', label: 'شريط الثقة', icon: Star, page: 'home',
      fields: [
        { type: 'strings', path: 'trust_bar.items', label: 'عناصر الثقة', addLabel: 'إضافة عنصر' },
      ],
    },
    {
      id: 'services', label: 'الخدمات', icon: Wrench, page: 'services',
      fields: [
        { type: 'textarea', path: 'services.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'services.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'services.items',
          label: 'الخدمات', itemLabel: 'خدمة', itemTitle: 'name',
          makeItem: () => ({ name: 'خدمة جديدة', description: '', price_from: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'الاسم' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 3 },
            { type: 'text',     path: 'price_from',  label: 'السعر يبدأ من' },
            { type: 'text',     path: 'badge',       label: 'شارة (اختياري)' },
          ],
        },
      ],
    },
    {
      id: 'story', label: 'قصتنا', icon: Quote, page: 'about',
      fields: [
        { type: 'text',     path: 'story.eyebrow',     label: 'عنوان صغير' },
        { type: 'textarea', path: 'story.heading',     label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'story.body',        label: 'النص', rows: 5 },
        { type: 'text',     path: 'story.owner_name',  label: 'اسم المالك' },
        { type: 'text',     path: 'story.owner_title', label: 'صفة المالك' },
        { type: 'textarea', path: 'story.quote',       label: 'الاقتباس', rows: 2 },
        { type: 'image',    path: 'story.image',       label: 'صورة المالك' },
      ],
    },
    {
      id: 'proof', label: 'لماذا نحن', icon: Award, page: 'services',
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
      id: 'before_after', label: 'قبل / بعد', icon: ImageIcon, page: 'services',
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
      id: 'process', label: 'طريقة العمل', icon: Award, page: 'process',
      fields: [
        { type: 'textarea', path: 'process.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'process.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'process.steps',
          label: 'الخطوات', itemLabel: 'خطوة', itemTitle: 'title',
          makeItem: () => ({ step: '01', title: '', text: '' }),
          itemFields: [
            { type: 'text',     path: 'step',  label: 'رقم الخطوة' },
            { type: 'text',     path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'text',  label: 'النص', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'areas', label: 'مناطق الخدمة', icon: MapPin, page: 'contact',
      fields: [
        { type: 'textarea', path: 'areas.heading',       label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'areas.subheading',    label: 'العنوان الفرعي', rows: 2 },
        { type: 'strings',  path: 'areas.areas_served',  label: 'المناطق', addLabel: 'إضافة منطقة' },
        { type: 'text',     path: 'areas.response_time', label: 'سرعة الاستجابة' },
        { type: 'text',     path: 'areas.availability',  label: 'أوقات التوفر' },
      ],
    },
    {
      id: 'offer', label: 'العرض', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'offer.badge',      label: 'شارة' },
        { type: 'textarea', path: 'offer.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'offer.subheading', label: 'العنوان الفرعي', rows: 2 },
        { type: 'strings',  path: 'offer.points',     label: 'النقاط', addLabel: 'إضافة نقطة' },
        { type: 'text',     path: 'offer.cta_label',  label: 'نص الزر' },
      ],
    },
    {
      id: 'testimonials', label: 'آراء العملاء', icon: Star, page: 'home',
      fields: [
        { type: 'reviews', path: 'testimonials.items' },
        { type: 'textarea', path: 'testimonials.heading',        label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'testimonials.subheading',     label: 'العنوان الفرعي', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'متوسط التقييم', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'عدد التقييمات' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'التقييمات', itemLabel: 'تقييم', itemTitle: 'name',
          makeItem: () => ({ name: 'عميل', text: '', source: '', rating: 5 }),
          itemFields: [
            { type: 'text',     path: 'name',   label: 'الاسم' },
            { type: 'textarea', path: 'text',   label: 'الاقتباس', rows: 3 },
            { type: 'text',     path: 'source', label: 'المصدر (اختياري)' },
            { type: 'number',   path: 'rating', label: 'التقييم', min: 1, max: 5 },
          ],
        },
      ],
    },
    {
      id: 'gallery', label: 'المعرض', icon: ImageIcon, page: 'services',
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
      id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle, page: 'contact',
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
      id: 'final_cta', label: 'الدعوة الختامية', icon: Sparkles, page: 'home',
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
      id: 'footer', label: 'تذييل الصفحة', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'الشعار النصي' },
        { type: 'text', path: 'footer.legal',   label: 'النص القانوني' },
        { type: 'text', path: 'footer.phone',   label: 'الهاتف' },
        { type: 'text', path: 'footer.email',   label: 'البريد الإلكتروني' },
        { type: 'text', path: 'footer.address', label: 'العنوان البريدي' },
      ],
    },
  ],
}
