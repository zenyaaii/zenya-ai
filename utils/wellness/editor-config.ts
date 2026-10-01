import {
  Sparkles, Leaf, Hand, Users, Star, HelpCircle, Mail, Phone, Image as ImageIcon,
  Calendar, Home as HomeIcon, Info, MessageCircle, CalendarDays,
} from 'lucide-react'
import { WELLNESS_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',    label: 'الأساسي' },
  { key: 'accent',     label: 'اللون المميز' },
  { key: 'background', label: 'الخلفية' },
  { key: 'surface',    label: 'الأسطح' },
  { key: 'text',       label: 'النص' },
  { key: 'muted',      label: 'نص خافت' },
  { key: 'border',     label: 'الحدود' },
  { key: 'overlay',    label: 'طبقة التظليل' },
]

export const WELLNESS_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'wellness',
  themeName:       'العافية',
  defaultPresetId: 'zen',
  brandNamePath:   'brand.name',
  colorPresets:    WELLNESS_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',       label: 'الرئيسية',       icon: HomeIcon },
    { id: 'treatments', label: 'العلاجات', icon: Hand },
    { id: 'team',       label: 'الفريق',       icon: Users },
    { id: 'space',      label: 'المكان',      icon: ImageIcon },
    { id: 'about',      label: 'من نحن',      icon: Info },
    { id: 'contact',    label: 'تواصل',    icon: Phone },
  ],

  panels: [
    {
      id: 'brand', label: 'العلامة التجارية', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',    label: 'اسم العلامة التجارية' },
        { type: 'text', path: 'brand.type',    label: 'النوع (مثل: سبا)' },
        { type: 'text', path: 'brand.city',    label: 'المدينة' },
        { type: 'text', path: 'brand.region',  label: 'المنطقة (اختياري)' },
        { type: 'text', path: 'brand.tagline', label: 'العبارة التعريفية' },
      ],
    },
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'hero.headline',      label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'العنوان الفرعي', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'hero.cta_secondary', label: 'الزر الثاني' },
        { type: 'text',     path: 'hero.badge',         label: 'شارة (اختياري)' },
        { type: 'image',    path: 'hero.image',         label: 'صورة الواجهة' },
      ],
    },
    {
      id: 'trust_bar', label: 'شريط الثقة', icon: Star, page: 'home',
      fields: [
        { type: 'strings', path: 'trust_bar.items', label: 'عناصر الثقة', addLabel: 'إضافة عنصر' },
      ],
    },
    {
      id: 'philosophy', label: 'فلسفتنا', icon: Leaf, pages: ['home', 'about'],
      fields: [
        { type: 'text',     path: 'philosophy.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'philosophy.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'philosophy.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'philosophy.pillars',
          label: 'الركائز', itemLabel: 'ركيزة', itemTitle: 'title',
          makeItem: () => ({ icon: 'leaf', title: 'ركيزة جديدة', text: '' }),
          itemFields: [
            { type: 'text',     path: 'icon',  label: 'اسم الأيقونة' },
            { type: 'text',     path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'text',  label: 'النص', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'treatments', label: 'العلاجات', icon: Hand, page: 'treatments',
      fields: [
        { type: 'textarea', path: 'treatments.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'treatments.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'treatments.items',
          label: 'العلاجات', itemLabel: 'علاج', itemTitle: 'name',
          makeItem: () => ({ name: 'علاج جديد', category: '', duration: '60 دقيقة', price: '$0', description: '', badge: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'الاسم' },
            { type: 'text',     path: 'category',    label: 'الفئة' },
            { type: 'text',     path: 'duration',    label: 'المدة' },
            { type: 'text',     path: 'price',       label: 'السعر' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 3 },
            { type: 'text',     path: 'badge',       label: 'شارة (اختياري)' },
          ],
        },
      ],
    },
    {
      id: 'journey', label: 'رحلة العميل', icon: Sparkles, pages: ['treatments', 'about'],
      fields: [
        { type: 'textarea', path: 'journey.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'journey.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'journey.steps',
          label: 'الخطوات', itemLabel: 'خطوة', itemTitle: 'title',
          makeItem: () => ({ step: '01', title: 'خطوة جديدة', text: '' }),
          itemFields: [
            { type: 'text',     path: 'step',  label: 'رقم الخطوة' },
            { type: 'text',     path: 'title', label: 'العنوان' },
            { type: 'textarea', path: 'text',  label: 'النص', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'team', label: 'الفريق', icon: Users, page: 'team',
      fields: [
        { type: 'textarea', path: 'team.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'team.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'team.members',
          label: 'أعضاء الفريق', itemLabel: 'عضو', itemTitle: 'name',
          makeItem: () => ({ name: 'معالج جديد', title: 'معالج', specialty: '', bio: '', image: '' }),
          itemFields: [
            { type: 'text',     path: 'name',      label: 'الاسم' },
            { type: 'text',     path: 'title',     label: 'المسمى الوظيفي' },
            { type: 'text',     path: 'specialty', label: 'التخصص' },
            { type: 'textarea', path: 'bio',       label: 'نبذة قصيرة', rows: 3 },
            { type: 'image',    path: 'image',     label: 'صورة شخصية' },
          ],
        },
      ],
    },
    {
      id: 'space', label: 'المكان', icon: ImageIcon, page: 'space',
      fields: [
        { type: 'textarea', path: 'space.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'space.subheading', label: 'العنوان الفرعي', rows: 2 },
        { type: 'strings',  path: 'space.amenities',  label: 'المرافق', addLabel: 'إضافة مرفق' },
        {
          type: 'array', path: 'space.images',
          label: 'صور المعرض', itemLabel: 'صورة', itemTitle: 'alt',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'صورة' },
            { type: 'text',  path: 'alt', label: 'وصف الصورة' },
          ],
        },
      ],
    },
    {
      id: 'timetable', label: 'جدول الحصص', icon: CalendarDays, page: 'treatments',
      fields: [
        { type: 'text',     path: 'timetable.heading',    label: 'العنوان' },
        { type: 'textarea', path: 'timetable.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'timetable.slots',
          label: 'الحصص', itemLabel: 'حصة', itemTitle: 'name',
          makeItem: () => ({ day: 'السبت', time: '6:30 ص', name: 'حصة جديدة', teacher: '', level: '' }),
          itemFields: [
            { type: 'text', path: 'day',     label: 'اليوم (مثل: السبت)' },
            { type: 'text', path: 'time',    label: 'الوقت' },
            { type: 'text', path: 'name',    label: 'اسم الحصة' },
            { type: 'text', path: 'teacher', label: 'المدرّب (اختياري)' },
            { type: 'text', path: 'level',   label: 'المستوى (اختياري)' },
          ],
        },
      ],
    },
    {
      id: 'testimonials', label: 'التقييمات', icon: Star, page: 'home',
      fields: [
        { type: 'reviews', path: 'testimonials.items' },
        { type: 'text',     path: 'links.reviews_url',           label: 'رابط التقييمات (جوجل، Trustpilot، فيسبوك)' },
        { type: 'textarea', path: 'testimonials.heading',        label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'testimonials.subheading',     label: 'العنوان الفرعي', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'متوسط التقييم', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'عدد التقييمات' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'التقييمات', itemLabel: 'تقييم', itemTitle: 'name',
          makeItem: () => ({ name: 'عميل', text: '', treatment: '', rating: 5 }),
          itemFields: [
            { type: 'text',     path: 'name',      label: 'الاسم' },
            { type: 'textarea', path: 'text',      label: 'الاقتباس', rows: 3 },
            { type: 'text',     path: 'treatment', label: 'العلاج' },
            { type: 'number',   path: 'rating',    label: 'التقييم', min: 1, max: 5 },
          ],
        },
      ],
    },
    {
      id: 'booking_cta', label: 'دعوة الحجز', icon: Calendar, pages: ['home', 'contact'],
      fields: [
        { type: 'text',     path: 'booking_cta.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'booking_cta.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'booking_cta.subheading', label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'booking_cta.cta_label',  label: 'نص الزر' },
        { type: 'text',     path: 'booking_cta.note',       label: 'ملاحظة' },
        { type: 'image',    path: 'booking_cta.image',      label: 'صورة' },
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
            { type: 'textarea', path: 'a', label: 'الجواب', rows: 3 },
          ],
        },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'links', label: 'واتساب والخريطة', icon: MessageCircle,
      fields: [
        { type: 'text', path: 'links.whatsapp', label: 'رقم واتساب أو رابط wa.me' },
        { type: 'text', path: 'links.map_url',  label: 'رابط خرائط جوجل (اختياري)' },
      ],
    },
    {
      id: 'footer', label: 'تذييل الصفحة', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline',     label: 'العبارة التعريفية' },
        { type: 'text', path: 'footer.legal',       label: 'النص القانوني' },
        { type: 'text', path: 'footer.phone',       label: 'الهاتف' },
        { type: 'text', path: 'footer.email',       label: 'البريد الإلكتروني' },
        { type: 'text', path: 'footer.address',     label: 'عنوان المكان' },
        { type: 'text', path: 'footer.hours',       label: 'ساعات العمل' },
      ],
    },
  ],
}
