/** A schema-valid ServiceInput (see utils/services/input.ts) for exercising
 *  the real /api/generate-services path end-to-end. */
export const validServiceInput = {
  brand: {
    name: 'ورشة النخبة',
    category: 'صيانة سيارات',
    city: 'الرياض',
    region: 'منطقة الرياض',
    owner_name: 'أحمد',
    years_in_business: '10',
  },
  contact: {
    phone: '+966500000000',
    email: 'info@example.com',
    emergency_service: true,
    availability: 'يوميًا 8ص - 10م',
    response_time: 'خلال ساعة',
  },
  services: [
    { name: 'تغيير الزيت', description: 'زيت أصلي وفلتر جديد', price_from: '150 ريال' },
    { name: 'فحص شامل', badge: 'الأكثر طلبًا' },
  ],
  areas_served: ['الرياض', 'الدرعية'],
  differentiators: ['ضمان 6 أشهر', 'قطع أصلية'],
  story: {
    brief: 'بدأنا الورشة قبل عشر سنوات بهدف تقديم خدمة صيانة صادقة وموثوقة لأهل الرياض.',
    owner_title: 'المؤسس',
  },
  visuals: {},
  social_proof: {
    review_rating: 4.9,
    review_count: '200+',
  },
  style_preset: 'cobalt',
}

/** Endpoints that should reject a malformed body with a 4xx. Every generator
 *  validates its input, so an empty object must never 200. */
export const GENERATOR_ENDPOINTS = [
  '/api/generate-services',
  '/api/generate-studio',
  '/api/generate-wellness',
  '/api/generate-atlas',
  '/api/generate-collective',
  '/api/generate-lookbook',
  '/api/generate-restaurant',
  '/api/generate-content',
]
