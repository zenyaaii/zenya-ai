/**
 * SEO metadata for the public demo routes (`/demo` and `/demo/[template]`).
 *
 * Why this file exists: every `/demo/*` page is a `"use client"` component,
 * so it cannot export `metadata` itself. Before this, all nine demo URLs were
 * shipped in sitemap.xml while inheriting the ROOT title verbatim — nine
 * different pages telling Google they were the same page. Google resolves that
 * by keeping one and dropping the rest, which is exactly what was happening.
 *
 * Each entry gets a thin sibling `layout.tsx` that spreads `demoMetadata(key)`.
 *
 * Titles deliberately omit the wordmark: the root layout's title template
 * already appends "· زينيا".
 */

import type { Metadata } from 'next'

const SITE = 'https://zenyaai.co'

export type DemoSeo = {
  /** Route segment under /demo (empty string = the /demo index itself). */
  slug: string
  title: string
  description: string
  keywords: string[]
  /** The matching long-form landing page, for the canonical cluster. */
  related: string
}

export const DEMO_SEO: DemoSeo[] = [
  {
    slug: '',
    title: 'معاينة حيّة لقالب متجر المنتج الواحد',
    description:
      'شاهد قالب متجر المنتج الواحد وهو يعمل: صفحة هبوط كاملة بالعربية مع عرض المنتج والمزايا والأسئلة الشائعة ودعوة الشراء. معاينة حقيقية قابلة للتصفّح قبل أن تنشئ متجرك.',
    keywords: ['معاينة قالب متجر', 'قالب متجر منتج واحد', 'صفحة هبوط منتج', 'متجر إلكتروني عربي', 'نموذج متجر جاهز'],
    related: '/websites/one-product-store',
  },
  {
    slug: 'restaurant',
    title: 'معاينة حيّة لقالب موقع مطعم',
    description:
      'قالب موقع المطعم كاملًا: قائمة الطعام والصور وساعات العمل والموقع وحجز الطاولات. تصفّح النموذج بالعربية كما سيراه زبائنك قبل أن تبني موقع مطعمك.',
    keywords: ['قالب موقع مطعم', 'تصميم موقع مطعم', 'موقع مطعم جاهز', 'قائمة طعام إلكترونية', 'حجز طاولات أونلاين'],
    related: '/websites/restaurant',
  },
  {
    slug: 'atlas',
    title: 'معاينة حيّة لقالب صفحة هبوط تطبيق',
    description:
      'قالب صفحة هبوط التطبيقات والبرمجيات: عرض المزايا وخطط الأسعار والتكاملات والوثائق. نموذج عربي حيّ يوضّح كيف ستبدو صفحة إطلاق تطبيقك.',
    keywords: ['صفحة هبوط تطبيق', 'قالب موقع تطبيق', 'صفحة هبوط SaaS', 'موقع برنامج', 'landing page عربي'],
    related: '/websites/app-landing-page',
  },
  {
    slug: 'lookbook',
    title: 'معاينة حيّة لقالب موقع أزياء ولوك بوك',
    description:
      'قالب الأزياء واللوك بوك: عرض المجموعات بالصور الكبيرة، صفحة المتجر، وقصة العلامة. تصفّح النموذج العربي كاملًا قبل أن تنشئ موقع علامتك.',
    keywords: ['قالب موقع أزياء', 'لوك بوك إلكتروني', 'موقع براند ملابس', 'عرض مجموعات أزياء', 'متجر أزياء عربي'],
    related: '/websites/fashion-lookbook',
  },
  {
    slug: 'collective',
    title: 'معاينة حيّة لقالب المتجر الإلكتروني',
    description:
      'قالب المتجر متعدّد المنتجات: عرض الأصناف والتصنيفات وصفحات المنتج ورحلة الشراء. نموذج عربي حيّ للمتاجر التي تبيع أكثر من منتج واحد.',
    keywords: ['قالب متجر إلكتروني', 'تصميم متجر أونلاين', 'موقع بيع منتجات', 'متجر متعدد المنتجات', 'تجارة إلكترونية عربية'],
    related: '/websites/online-store',
  },
  {
    slug: 'studio',
    title: 'معاينة حيّة لقالب قصة العلامة والاستوديو',
    description:
      'قالب الاستوديو وقصة العلامة: صفحة "من نحن"، منهجية العمل، الفريق، والتواصل. مناسب للوكالات والاستوديوهات والعلامات التي تبيع بالسرد لا بالكتالوج.',
    keywords: ['موقع وكالة', 'قالب استوديو تصميم', 'صفحة من نحن', 'موقع قصة علامة تجارية', 'موقع شركة إبداعية'],
    related: '/websites/brand-story',
  },
  {
    slug: 'services',
    title: 'معاينة حيّة لقالب موقع الخدمات',
    description:
      'قالب مقدّمي الخدمات: قائمة الخدمات والأسعار وخطوات العمل ونموذج طلب الخدمة. نموذج عربي حيّ للعيادات والمكاتب والحرفيّين والمستقلّين.',
    keywords: ['موقع خدمات', 'قالب موقع شركة خدمات', 'موقع مكتب استشارات', 'صفحة عرض خدمات', 'موقع مستقل فريلانسر'],
    related: '/websites/services',
  },
  {
    slug: 'wellness',
    title: 'معاينة حيّة لقالب مركز العافية والسبا',
    description:
      'قالب مراكز العافية والسبا واليوغا: الجلسات والمعالجات والفريق والمساحة وحجز المواعيد. تصفّح النموذج العربي قبل أن تبني موقع مركزك.',
    keywords: ['موقع سبا', 'قالب مركز عافية', 'موقع يوغا', 'حجز جلسات أونلاين', 'موقع مركز تجميل'],
    related: '/websites/wellness',
  },
]

const BY_SLUG = new Map(DEMO_SEO.map((d) => [d.slug, d]))

/** Build the Next metadata for one demo route. `slug` '' is the /demo index. */
export function demoMetadata(slug: string): Metadata {
  const d = BY_SLUG.get(slug)
  if (!d) return {}
  const url = d.slug ? `${SITE}/demo/${d.slug}` : `${SITE}/demo`
  return {
    title: d.title,
    description: d.description,
    keywords: d.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: d.title,
      description: d.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: d.title,
      description: d.description,
    },
    robots: { index: true, follow: true },
  }
}
