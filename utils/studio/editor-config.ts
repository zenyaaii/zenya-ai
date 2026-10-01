import {
  Sparkles, Mail, Newspaper, Users, Award, Quote, Clock,
  Home as HomeIcon, BookOpen, Workflow, Phone,
  Star,
} from 'lucide-react'
import { STUDIO_PRESETS } from './presets'
import type { EditorConfig } from '@/utils/theme-editor-types'

const TOKENS = [
  { key: 'primary',     label: 'الأساسي' },
  { key: 'accent',      label: 'اللون المميز' },
  { key: 'accentMuted', label: 'اللون المميز الخافت' },
  { key: 'background',  label: 'الخلفية' },
  { key: 'surface',     label: 'الأسطح' },
  { key: 'surfaceAlt',  label: 'الأسطح البديلة' },
  { key: 'text',        label: 'النص' },
  { key: 'muted',       label: 'نص خافت' },
  { key: 'border',      label: 'الحدود' },
]

export const STUDIO_EDITOR_CONFIG: EditorConfig = {
  contentKey:      'studio',
  themeName:       'استوديو',
  defaultPresetId: 'ink',
  brandNamePath:   'brand.name',
  colorPresets:    STUDIO_PRESETS,
  colorTokens:     TOKENS,

  pages: [
    { id: 'home',    label: 'الرئيسية',    icon: HomeIcon },
    { id: 'about',   label: 'قصتنا',   icon: BookOpen },
    { id: 'process', label: 'طريقة العمل', icon: Workflow },
    { id: 'team',    label: 'الفريق',    icon: Users },
    { id: 'contact', label: 'تواصل', icon: Phone },
  ],

  panels: [
    {
      id: 'brand', label: 'العلامة التجارية', icon: Sparkles,
      fields: [
        { type: 'text', path: 'brand.name',     label: 'اسم الاستوديو' },
        { type: 'text', path: 'brand.tagline',  label: 'العبارة التعريفية' },
        { type: 'text', path: 'brand.category', label: 'الفئة' },
        { type: 'text', path: 'brand.founded',  label: 'سنة التأسيس' },
      ],
    },
    {
      id: 'hero', label: 'الواجهة', icon: Sparkles, page: 'home',
      fields: [
        { type: 'text',     path: 'hero.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'hero.manifesto',     label: 'البيان', rows: 4 },
        { type: 'textarea', path: 'hero.subheadline',   label: 'العنوان الفرعي', rows: 3 },
        { type: 'text',     path: 'hero.cta_primary',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'hero.cta_secondary', label: 'الزر الثاني' },
      ],
    },
    {
      id: 'mission', label: 'رسالتنا', icon: Sparkles, page: 'home',
      fields: [
        { type: 'textarea', path: 'mission.statement',   label: 'العبارة الرئيسية', rows: 3 },
        { type: 'textarea', path: 'mission.elaboration', label: 'التفاصيل', rows: 5 },
      ],
    },
    {
      id: 'founder_letter', label: 'رسالة المؤسس', icon: Quote, page: 'about',
      fields: [
        { type: 'text', path: 'founder_letter.eyebrow',         label: 'عنوان صغير' },
        { type: 'text', path: 'founder_letter.heading',         label: 'العنوان' },
        { type: 'text', path: 'founder_letter.signature',       label: 'التوقيع' },
        { type: 'text', path: 'founder_letter.signature_role',  label: 'صفة الموقّع' },
        { type: 'strings', path: 'founder_letter.paragraphs',   label: 'الفقرات', addLabel: 'إضافة فقرة' },
      ],
    },
    {
      id: 'timeline', label: 'مسيرتنا', icon: Clock, page: 'about',
      fields: [
        { type: 'text',     path: 'timeline.eyebrow', label: 'عنوان صغير' },
        { type: 'textarea', path: 'timeline.heading', label: 'العنوان', rows: 2 },
        {
          type: 'array', path: 'timeline.events',
          label: 'الأحداث', itemLabel: 'حدث', itemTitle: 'year',
          makeItem: () => ({ year: 'السنة', title: '', description: '' }),
          itemFields: [
            { type: 'text',     path: 'year',        label: 'السنة' },
            { type: 'text',     path: 'title',       label: 'العنوان' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 2 },
          ],
        },
      ],
    },
    {
      id: 'values', label: 'القيم', icon: Award, page: 'about',
      fields: [
        { type: 'text',     path: 'values.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'values.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'values.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'values.items',
          label: 'القيم', itemLabel: 'قيمة', itemTitle: 'title',
          makeItem: () => ({ number: '01', title: 'قيمة جديدة', body: '' }),
          itemFields: [
            { type: 'text',     path: 'number', label: 'الرقم' },
            { type: 'text',     path: 'title',  label: 'العنوان' },
            { type: 'textarea', path: 'body',   label: 'النص', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'process', label: 'طريقة العمل', icon: Award, page: 'process',
      fields: [
        { type: 'text',     path: 'process.eyebrow', label: 'عنوان صغير' },
        { type: 'textarea', path: 'process.heading', label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'process.body',    label: 'النص', rows: 4 },
        {
          type: 'array', path: 'process.steps',
          label: 'الخطوات', itemLabel: 'خطوة', itemTitle: 'title',
          makeItem: () => ({ title: '', description: '' }),
          itemFields: [
            { type: 'text',     path: 'title',       label: 'العنوان' },
            { type: 'textarea', path: 'description', label: 'الوصف', rows: 3 },
          ],
        },
      ],
    },
    {
      id: 'team', label: 'الفريق', icon: Users, page: 'team',
      fields: [
        { type: 'text',     path: 'team.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'team.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'team.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'team.members',
          label: 'الفريق', itemLabel: 'عضو', itemTitle: 'name',
          makeItem: () => ({ name: 'عضو جديد', role: 'المنصب', bio: '', avatar_letter: 'ع' }),
          itemFields: [
            { type: 'text',     path: 'name',           label: 'الاسم' },
            { type: 'text',     path: 'role',           label: 'المنصب' },
            { type: 'textarea', path: 'bio',            label: 'نبذة', rows: 3 },
            { type: 'text',     path: 'avatar_letter',  label: 'الحرف الأول للصورة الرمزية' },
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
          label: 'التغطيات الإعلامية', itemLabel: 'تغطية', itemTitle: 'publication',
          makeItem: () => ({ publication: 'اسم الجهة', quote: '', year: '' }),
          itemFields: [
            { type: 'text',     path: 'publication', label: 'الجهة الناشرة' },
            { type: 'textarea', path: 'quote',       label: 'الاقتباس', rows: 2 },
            { type: 'text',     path: 'year',        label: 'السنة' },
          ],
        },
      ],
    },
    {
      id: 'community', label: 'المجتمع', icon: Users, page: 'contact',
      fields: [
        { type: 'text',     path: 'community.eyebrow',    label: 'عنوان صغير' },
        { type: 'textarea', path: 'community.heading',    label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'community.subheading', label: 'العنوان الفرعي', rows: 2 },
        {
          type: 'array', path: 'community.stats',
          label: 'الأرقام', itemLabel: 'رقم', itemTitle: 'value',
          makeItem: () => ({ value: '0', label: 'رقم جديد' }),
          itemFields: [
            { type: 'text', path: 'value', label: 'القيمة' },
            { type: 'text', path: 'label', label: 'التسمية' },
          ],
        },
      ],
    },
    {
      id: 'testimonials', label: 'التقييمات', icon: Star, page: 'home',
      fields: [
        { type: 'reviews', path: 'testimonials.items' },
        { type: 'text',     path: 'testimonials.eyebrow',        label: 'عنوان صغير' },
        { type: 'textarea', path: 'testimonials.heading',        label: 'العنوان', rows: 2 },
        { type: 'number',   path: 'testimonials.average_rating', label: 'متوسط التقييم', min: 0, max: 5, step: 0.1 },
        { type: 'text',     path: 'testimonials.review_count',   label: 'نص عدد التقييمات' },
        {
          type: 'array', path: 'testimonials.items',
          label: 'التقييمات', itemLabel: 'تقييم', itemTitle: 'name',
          makeItem: () => ({ name: 'عميل', text: '', detail: '', rating: 5 }),
          itemFields: [
            { type: 'text',     path: 'name',   label: 'الاسم' },
            { type: 'textarea', path: 'text',   label: 'الاقتباس', rows: 3 },
            { type: 'text',     path: 'detail', label: 'التفاصيل (المدينة · المنتج)' },
            { type: 'number',   path: 'rating', label: 'التقييم', min: 1, max: 5 },
          ],
        },
      ],
    },
    {
      id: 'cta', label: 'الدعوة الختامية', icon: Sparkles, page: 'contact',
      fields: [
        { type: 'text',     path: 'cta.eyebrow',       label: 'عنوان صغير' },
        { type: 'textarea', path: 'cta.heading',       label: 'العنوان', rows: 2 },
        { type: 'textarea', path: 'cta.subheading',    label: 'العنوان الفرعي', rows: 2 },
        { type: 'text',     path: 'cta.cta_primary',   label: 'الزر الرئيسي' },
        { type: 'text',     path: 'cta.cta_secondary', label: 'الزر الثاني' },
      ],
    },
  ],
  globalPanels: [
    {
      id: 'footer', label: 'تذييل الصفحة', icon: Mail,
      fields: [
        { type: 'text', path: 'footer.tagline', label: 'العبارة التعريفية' },
        { type: 'text', path: 'footer.legal',   label: 'النص القانوني' },
        { type: 'text', path: 'footer.email',   label: 'البريد الإلكتروني' },
      ],
    },
  ],
}
