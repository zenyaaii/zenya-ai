import {
  Home as HomeIcon, FileText, Image as ImageIcon, MapPin, Type as TypeIcon,
  Star, Sparkles, MessageCircle, Calendar, Mail, Newspaper, HelpCircle,
  AtSign, Phone,
} from 'lucide-react'
import { RESTAURANT_PRESETS } from './presets'
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

export const RESTAURANT_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'restaurant',
  themeName:       'مطعم',
  defaultPresetId: 'onyx',
  brandNamePath:   'brand.name',
  colorPresets:    RESTAURANT_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',    label: 'الرئيسية',    icon: HomeIcon },
    { id: 'menu',    label: 'القائمة',    icon: FileText },
    { id: 'gallery', label: 'المعرض', icon: ImageIcon },
    { id: 'visit',   label: 'زورونا',   icon: MapPin },
    { id: 'about',   label: 'من نحن',   icon: TypeIcon },
    { id: 'reviews', label: 'التقييمات', icon: Star },
  ],

  panels: [
    /* ── Home ─────────────────────────────────────────────────────────── */
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'hero.headline',      label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'العنوان الفرعي', rows: 3 },
        { type: 'text',     path: 'hero.primary_cta',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'hero.secondary_cta', label: 'الزر الثاني' },
        { type: 'image',    path: 'hero.image',         label: 'صورة الواجهة' },
      ],
    },
    {
      id: 'signature_dishes', label: 'أطباقنا المميزة', icon: Star, page: 'home',
      fields: [
        { type: 'textarea', path: 'signature_dishes_heading', label: 'العنوان', rows: 2 },
        {
          type: 'array', path: 'signature_dishes',
          label: 'الأطباق', itemLabel: 'طبق', itemTitle: 'name',
          makeItem: () => ({ name: 'طبق جديد', description: '', price: '', image: '' }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'الاسم' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 2 },
            { type: 'text',     path: 'price',       label: 'السعر' },
            { type: 'image',    path: 'image',       label: 'صورة' },
          ],
        },
      ],
    },
    {
      id: 'press', label: 'في الإعلام', icon: Newspaper, page: 'home',
      fields: [
        { type: 'text', path: 'press.heading', label: 'العنوان' },
        {
          type: 'array', path: 'press.items',
          label: 'الإشادات الإعلامية', itemLabel: 'إشادة', itemTitle: 'outlet',
          makeItem: () => ({ outlet: 'وسيلة إعلامية جديدة', quote: '' }),
          itemFields: [
            { type: 'text',     path: 'outlet', label: 'الوسيلة الإعلامية' },
            { type: 'textarea', path: 'quote',  label: 'الاقتباس', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'newsletter', label: 'النشرة البريدية', icon: Mail, page: 'home',
      fields: [
        { type: 'textarea', path: 'newsletter.heading',      label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'newsletter.subheading',   label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'newsletter.button_label', label: 'نص الزر' },
      ],
    },

    /* ── Menu ─────────────────────────────────────────────────────────── */
    {
      id: 'menu', label: 'القائمة', icon: FileText, page: 'menu',
      fields: [
        { type: 'textarea', path: 'menu.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'menu.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'menu.categories',
          label: 'الفئات', itemLabel: 'فئة', itemTitle: 'name',
          makeItem: () => ({
            id: Math.random().toString(36).slice(2, 9),
            name: 'فئة جديدة',
            description: '',
            items: [],
          }),
          itemFields: [
            { type: 'text',     path: 'name',        label: 'اسم الفئة' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 2 },
            {
              type: 'array', path: 'items',
              label: 'الأصناف', itemLabel: 'صنف', itemTitle: 'name',
              makeItem: () => ({ name: 'صنف جديد', description: '', price: '', badge: '', image: '' }),
              itemFields: [
                { type: 'text',     path: 'name',        label: 'الاسم' },
                { type: 'textarea', path: 'description', label: 'الوصف', rows: 2 },
                { type: 'text',     path: 'price',       label: 'السعر' },
                { type: 'text',     path: 'badge',       label: 'شارة (اختياري)' },
                { type: 'image',    path: 'image',       label: 'صورة (اختياري)' },
              ],
            },
          ],
        },
      ],
    },

    /* ── Gallery ──────────────────────────────────────────────────────── */
    {
      id: 'gallery', label: 'المعرض', icon: ImageIcon, page: 'gallery',
      fields: [
        { type: 'textarea', path: 'gallery.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'gallery.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'gallery.images',
          label: 'الصور', itemLabel: 'صورة', itemTitle: 'alt',
          makeItem: () => ({ url: '', alt: '' }),
          itemFields: [
            { type: 'image', path: 'url', label: 'صورة' },
            { type: 'text',  path: 'alt', label: 'وصف الصورة' },
          ],
        },
        { type: 'note', content: 'مصدر الصور: اكتب "from_venue" لنسبتها إلى المطعم، أو "from_unsplash" لنسبتها إلى Unsplash. اتركه فارغاً لإخفاء السطر.' },
        { type: 'text', path: 'gallery.attribution', label: 'مصدر الصور (from_venue / from_unsplash)' },
      ],
    },

    /* ── Visit ────────────────────────────────────────────────────────── */
    {
      id: 'hours_location', label: 'المواعيد والموقع', icon: MapPin, page: 'visit',
      fields: [
        { type: 'textarea', path: 'hours_location.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'hours_location.subheading', label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'hours_location.address',    label: 'العنوان البريدي' },
        { type: 'text',     path: 'hours_location.phone',      label: 'الهاتف' },
        { type: 'text',     path: 'hours_location.email',      label: 'البريد الإلكتروني' },
        { type: 'text',     path: 'hours_location.map_link',   label: 'رابط خرائط جوجل' },
        {
          type: 'array', path: 'hours_location.hours',
          label: 'ساعات العمل', itemLabel: 'يوم', itemTitle: 'label',
          makeItem: () => ({ day: 'monday', label: 'الاثنين', open: '', close: '', closed: false }),
          itemFields: [
            { type: 'text', path: 'label', label: 'اسم اليوم' },
            { type: 'text', path: 'open',  label: 'يفتح' },
            { type: 'text', path: 'close', label: 'يغلق' },
          ],
        },
      ],
    },
    {
      id: 'reservations', label: 'الحجوزات', icon: Calendar, page: 'visit',
      fields: [
        { type: 'textarea', path: 'reservations.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'reservations.subheading', label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'reservations.cta_label',  label: 'نص الزر' },
        { type: 'textarea', path: 'reservations.note',       label: 'ملاحظة', rows: 2 },
        { type: 'note', content: 'تتم الحجوزات عبر نظام الحجز الخاص بـ Zenya. نوع الحجز إما "form" (يرسل الضيوف طلب الحجز مباشرة إلى صندوق الوارد في لوحة التحكم) أو "phone" (الحجز بالاتصال الهاتفي كبديل للمواقع غير المشتركة في Pro). لا ندعم منصات الحجز الخارجية.' },
        { type: 'text', path: 'reservations.provider.type', label: 'نوع الحجز (form أو phone)' },
        { type: 'text', path: 'reservations.provider.number', label: 'رقم الهاتف (للحجز بالاتصال)' },
      ],
    },

    /* ── About ────────────────────────────────────────────────────────── */
    {
      id: 'story', label: 'قصتنا', icon: TypeIcon, page: 'about',
      fields: [
        { type: 'text',     path: 'story.eyebrow',     label: 'عنوان صغير' },
        { type: 'textarea', path: 'story.heading',     label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'story.body',        label: 'نص القصة', rows: 6 },
        { type: 'text',     path: 'story.chef_name',   label: 'اسم الشيف' },
        { type: 'text',     path: 'story.chef_title',  label: 'لقب الشيف' },
        { type: 'textarea', path: 'story.chef_bio',    label: 'نبذة عن الشيف', rows: 4 },
        { type: 'image',    path: 'story.chef_photo',  label: 'صورة الشيف' },
        { type: 'image',    path: 'story.accent_image', label: 'صورة إضافية' },
      ],
    },

    /* ── Reviews ──────────────────────────────────────────────────────── */
    {
      id: 'reviews', label: 'التقييمات', icon: Star, page: 'reviews',
      fields: [
        { type: 'reviews', path: 'reviews.testimonials' },
        { type: 'textarea', path: 'reviews.heading',        label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'reviews.subheading',     label: 'العنوان الفرعي', rows: 2 },
        { type: 'number',   path: 'reviews.overall_rating', label: 'التقييم العام', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'reviews.review_count',   label: 'عدد التقييمات' },
        {
          type: 'array', path: 'reviews.testimonials',
          label: 'آراء الضيوف', itemLabel: 'تقييم', itemTitle: 'name',
          makeItem: () => ({ name: 'ضيف', text: '', source: '', rating: 5 }),
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
      id: 'faq', label: 'الأسئلة الشائعة', icon: HelpCircle, page: 'reviews',
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
  ],

  globalPanels: [
    {
      id: 'brand_global', label: 'الهوية', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',         label: 'اسم المطعم' },
        { type: 'text', path: 'brand.cuisine',      label: 'نوع المطبخ' },
        { type: 'text', path: 'brand.tagline',      label: 'الشعار النصي' },
        { type: 'text', path: 'brand.city',         label: 'المدينة' },
        { type: 'text', path: 'brand.neighborhood', label: 'الحي' },
      ],
    },
    {
      id: 'social', label: 'التواصل الاجتماعي', icon: AtSign,
      fields: [
        { type: 'text', path: 'social_links.instagram', label: 'رابط إنستغرام' },
        { type: 'text', path: 'social_links.facebook',  label: 'رابط فيسبوك' },
        { type: 'text', path: 'social_links.tiktok',    label: 'رابط تيك توك' },
        { type: 'text', path: 'social_links.whatsapp',  label: 'رابط واتساب' },
        { type: 'text', path: 'social_links.youtube',   label: 'رابط يوتيوب' },
        { type: 'text', path: 'social_links.website',   label: 'رابط الموقع الإلكتروني' },
      ],
    },
    {
      id: 'footer', label: 'تذييل الصفحة', icon: Phone,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'الشعار النصي' },
        { type: 'text', path: 'footer.legal',   label: 'النص القانوني' },
      ],
    },
    {
      id: 'seo', label: 'محركات البحث', icon: MessageCircle,
      fields: [
        { type: 'text',     path: 'seo.title',       label: 'عنوان الصفحة' },
        { type: 'textarea', path: 'seo.description', label: 'الوصف', rows: 3 },
      ],
    },
  ],
}
