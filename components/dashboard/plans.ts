/**
 * What each plan is called, what it costs and what it includes, as the
 * dashboard says it. The feature lists for Entry, Starter and Pro are the
 * pricing page's own (components/zenya/pricing/PricingView.tsx), so billing
 * can never promise something the pricing page does not.
 */

import type { Tone } from '@/components/dashboard/screens/kit'

export type Plan = 'free' | 'entry' | 'pro_onetime' | 'pro_hosting' | 'starter' | 'pro' | 'admin'

export function asPlan(v: unknown): Plan {
  return ['free', 'entry', 'pro_onetime', 'pro_hosting', 'starter', 'pro', 'admin'].includes(String(v))
    ? (v as Plan)
    : 'free'
}

/** The short name on the home screen's pill. */
export const PLAN_LABEL: Record<Plan, string> = {
  free: 'الباقة المجانية',
  entry: 'Entry',
  pro_onetime: 'برو · مدى الحياة',
  pro_hosting: 'برو · استضافة',
  starter: 'Starter',
  pro: 'Pro',
  admin: 'مشرف',
}

export const PLAN_TONE: Record<Plan, Tone> = {
  free: 'quiet',
  entry: 'accent',
  pro_onetime: 'accent',
  pro_hosting: 'ok',
  starter: 'ok',
  pro: 'ok',
  admin: 'ok',
}

/** Plans with a live Stripe subscription. */
export const SUBSCRIBED: Plan[] = ['starter', 'pro', 'pro_hosting']

export const PLAN_BILLING: Record<Plan, { label: string; price: string; includes: string[] }> = {
  pro: {
    label: 'Pro نشط · استضافة مشمولة',
    price: '24.99$ / شهريًا',
    includes: [
      'كل ما في خطة Starter',
      'نطاق مخصّص مجاني لسنة — ‏.store، .site، .online، .shop',
      'خصم 30% على النطاقات الأغلى (.com وأمثالها)',
      'إزالة شارة «صُنع بزينيا»',
      'إدارة كاملة لموقعك ونطاقك',
      'دعم أولوية قصوى',
    ],
  },
  starter: {
    label: 'Starter نشط',
    price: '14.99$ / شهريًا',
    includes: [
      'توليد غير محدود — يشمل تحديثات القوالب',
      'جميع القوالب الثمانية الاحترافية',
      'انشر على نطاقك الخاص',
      'شهادة SSL تلقائية + CDN سريع',
      'الحجوزات وتحليلات الموقع — كاملة',
      'ملف ثيم شوبيفاي جاهز (المتجر + التشكيلة)',
    ],
  },
  entry: {
    label: 'خطة Entry',
    price: '0.50$ لمرة واحدة',
    includes: [
      'توليد قالبين (٢) بالذكاء الاصطناعي',
      'جميع القوالب الثمانية للمعاينة',
      'انشر موقعك على اسمك.zenyaai.co',
      'كل أدوات التحرير والإدارة',
      'شهر تجربة للحجوزات وتحليلات الموقع',
    ],
  },
  pro_hosting: {
    label: 'الاستضافة نشطة (خطة سابقة)',
    price: '19.99$ / شهريًا',
    includes: [
      'توليد غير محدود',
      'تصدير ثيم شوبيفاي جاهز',
      'مباشر على الاسم.zenyaai.co',
      'نطاق مخصّص + SSL تلقائي',
    ],
  },
  pro_onetime: {
    label: 'برو · مدى الحياة (خطة سابقة)',
    price: '9.99$ دُفعت مرة واحدة',
    includes: [
      'توليد غير محدود',
      'تصدير ثيم شوبيفاي جاهز',
      'ملفات المشاريع للقوالب غير الشوبيفاي',
    ],
  },
  admin: {
    label: 'مشرف · كل المزايا',
    price: 'بلا رسوم',
    includes: ['كل المزايا مفتوحة'],
  },
  free: {
    label: 'الباقة المجانية',
    price: '0$',
    includes: ['توليدان مجانيان عند التسجيل', 'جميع القوالب الثمانية للمعاينة'],
  },
}
