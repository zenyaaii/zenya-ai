/**
 * A made-up barbershop for the barber demo (/demo/barber) and the editor's
 * sample. Every name and review is invented for the demo; a real shop's
 * page is built from its own answers and its own Google reviews.
 * Photos: the barber pack (utils/services/niches.ts), no faces.
 */
import { buildBarberContent } from './barber'
import { unsplash } from './niches'
import type { ServiceContent } from './types'
import type { NicheKind } from './kinds'

export function barberDemoContent(): ServiceContent {
  return buildBarberContent(
    {
      kind: 'barber', terms: [],
      name: 'صالون الأستاذ', latin: 'Al Ustaz Barber', city: 'عمّان', area: 'الصويفية', address: 'شارع الوكالات، الصويفية، عمّان',
      audience: 'رجال وأطفال', phone: '+962 79 000 0000', whatsapp: '+962790000000', maps_url: 'https://maps.google.com/',
      instagram: '@ustaz.barber', links: [],
      barbers: [
        { name: 'سامر', role: 'صاحب الصالون', tags: ['قص كلاسيكي', 'لحية'] },
        { name: 'ليث', role: 'حلاق', tags: ['تدريج', 'عرسان'] },
        { name: 'يزن', role: 'حلاق', tags: ['أطفال', 'بروتين'] },
      ],
      services: [
        { name: 'قص شعر', price: '5', duration: '30 دقيقة' },
        { name: 'تحديد اللحية', price: '3', duration: '15 دقيقة' },
        { name: 'شعر ولحية', price: '7', duration: '45 دقيقة' },
        { name: 'حلاقة أطفال', price: '4', duration: '20 دقيقة' },
        { name: 'بروتين للشعر', price: '25', duration: '90 دقيقة' },
      ],
      currency: 'د.أ',
      booking: { mode: 'both', wait: '10 إلى 20 دقيقة مساء الخميس', busy: 'الخميس والجمعة بعد المغرب' },
      hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, periods: day === 6 ? [{ open: '14:00', close: '23:00' }] : [{ open: '10:00', close: '22:00' }] })),
      photos: {
        hero: unsplash('1585747860715-2ba37e788b70', 2000),
        side: unsplash('1621645582931-d1d3e6564943', 1200),
        gallery: [unsplash('1675599193990-33d71150902b', 1200), unsplash('1638383258375-0d294725071b', 1200), unsplash('1576168056582-0a851a87ab8e', 1200), unsplash('1611313151697-d626e818dddf', 1200)],
      },
      faq: [
        { q: 'هل أحتاج موعدًا، أم أحضر مباشرة؟', a: 'نستقبل بموعد وبدون موعد. الموعد يضمن لك كرسيك فور وصولك.' },
        { q: 'هل السعر المكتوب هو ما أدفعه؟', a: 'نعم. لا إضافات دون أن نسألك.' },
        { q: 'هل تحلقون للأطفال؟', a: 'نعم، ويزن يحب الصغار وصبور معهم.' },
      ],
    },
    {
      rating: 4.9, count: 812, maps_url: 'https://maps.google.com/',
      reviews: [
        { name: 'أبو خالد', rating: 5, when: 'قبل أسبوعين', text: 'من أنظف الصالونات في عمّان. حلقت عند ليث، فهم مني شو بدي من أول كلمة، والتدريج مضبوط.' },
        { name: 'محمد ع.', rating: 5, when: 'قبل شهر', text: 'سامر معلّم باللحية، والتعامل محترم. السعر نفس المكتوب.' },
        { name: 'Omar H.', rating: 5, when: 'قبل شهرين', text: 'أخذت ابني عند يزن، صبور معه وطلع الشكل حلو. رح نرجع.' },
        { name: 'فادي', rating: 5, when: 'قبل 3 أشهر', text: 'حجزت على الواتساب ووصلت على الموعد بدون انتظار.' },
        { name: 'يوسف م.', rating: 4, when: 'قبل 3 أشهر', text: 'شغل ممتاز، بس يوم الخميس زحمة. احجز قبل.' },
      ],
    },
  )
}

const u = (id: string, w = 1400) => unsplash(id, w)
const base = { links: [], booking: { mode: 'both' as const }, faq: [] as { q: string; a: string }[], terms: [] as { label: string; text: string }[], audience: undefined as string | undefined }
const G = (rating: number, count: number, reviews: [string, string, string][]) => ({ rating, count, maps_url: 'https://maps.google.com/', reviews: reviews.map(([name, when, text]) => ({ name, when, text, rating: 5 })) })
const week = (o: string, c: string, fri?: [string, string] | null) => [0, 1, 2, 3, 4, 5, 6].map((day) => (day === 6 && fri === null ? { day, closed: true, periods: [] } : { day, periods: [day === 6 && fri ? { open: fri[0], close: fri[1] } : { open: o, close: c }] }))

/** Made-up shops, one per kind, for /demo/<kind>. Names and reviews are invented. */
export function nicheDemoContent(kind: NicheKind): ServiceContent {
  if (kind === 'barber') return barberDemoContent()
  if (kind === 'gym') return buildBarberContent({
    ...base, kind, name: 'نادي القمة', latin: 'Summit Gym', city: 'الرياض', area: 'حي الملقا', address: 'طريق أنس بن مالك، الملقا', audience: 'رجال',
    phone: '+966 50 000 0000', whatsapp: '+966500000000', maps_url: 'https://maps.google.com/', instagram: '@summit.gym',
    barbers: [{ name: 'فيصل', role: 'مدرب رئيسي', tags: ['بناء عضل', 'تغذية'] }, { name: 'ماجد', role: 'مدرب', tags: ['تخسيس', 'كروس فت'] }, { name: 'عبدالله', role: 'مدرب', tags: ['ملاكمة'] }],
    services: [{ name: 'اشتراك شهري', price: '250', duration: 'شهر' }, { name: 'اشتراك 3 أشهر', price: '650', duration: '3 أشهر' }, { name: 'اشتراك سنوي', price: '2,200', duration: 'سنة' }, { name: 'تدريب شخصي', price: '900', duration: '10 حصص' }],
    currency: 'ر.س', booking: { mode: 'both', busy: 'من 6 إلى 9 مساءً' },
    niche_extra: {
      offers: ['أجهزة حديد', 'كارديو', 'كروس فت', 'ملاكمة', 'تدريب شخصي'],
      facilities: ['غرف تبديل', 'دش', 'خزائن', 'ساونا', 'موقف سيارات'],
      story: 'نادٍ في الملقا، كل مشترك فيه له برنامج ومدرب يعرفه بالاسم.',
      since: 2017,
      classes: [{ day: 0, items: [{ time: '18:00', name: 'كروس فت' }, { time: '20:00', name: 'ملاكمة' }] }, { day: 2, items: [{ time: '19:00', name: 'دائري' }] }],
      perks: [{ plan: 'اشتراك سنوي', items: ['دخول كل الأجهزة', 'جلسة قياس جسم شهرية', 'تجميد حتى شهر'] }],
      steps: [{ title: 'زيارة وتجربة', text: 'تعال وجرّب النادي يومًا مجانًا.' }, { title: 'قياس وبرنامج', text: 'يقيس المدرب وزنك ويكتب لك برنامجًا.' }],
    },
    terms: [{ label: 'التجميد', text: 'حتى أسبوعين في الاشتراك الفصلي، وشهر في السنوي' }, { label: 'الإلغاء', text: 'خلال 3 أيام من الدفع، ونعيد المبلغ كاملًا' }, { label: 'رسوم التسجيل', text: 'لا توجد' }],
    hours: week('05:00', '24:00', ['14:00', '24:00']),
    photos: { hero: u('1576678927484-cc907957088c', 2000), side: u('1558611848-73f7eb4001a1'), gallery: [u('1689877020200-403d8542d95d'), u('1623874514711-0f321325f318'), u('1544033527-b192daee1f5b'), u('1597076537061-a6b58163aa45')] },
    faq: [{ q: 'هل أستطيع تجميد الاشتراك؟', a: 'نعم، حتى أسبوعين في الفصلي وشهر في السنوي.' }, { q: 'هل يوجد مدرب يتابعني وأنا مبتدئ؟', a: 'كل مشترك جديد يأخذ جلسة تقييم وبرنامجًا مع مدرب.' }],
  }, G(4.8, 1260, [['خالد', 'قبل أسبوع', 'نادي نظيف والأجهزة جديدة. فيصل ما قصّر معي في البرنامج والتغذية.'], ['سعد ع.', 'قبل شهر', 'ماجد مدرب ممتاز للتخسيس، نزلت 9 كيلو في 3 أشهر.'], ['Turki', 'قبل شهرين', 'الزحمة بعد المغرب، لكن الأجهزة كثيرة.'], ['محمد', 'قبل 3 أشهر', 'السعر واضح وما فيه رسوم مخفية.'], ['ناصر', 'قبل 3 أشهر', 'كلاس الملاكمة مع عبدالله ممتع.']]))
  if (kind === 'beauty') return buildBarberContent({
    ...base, kind, name: 'مركز لمسة', latin: 'Lamsa Beauty', city: 'الكويت', area: 'السالمية', address: 'شارع سالم المبارك، السالمية',
    phone: '+965 5000 0000', whatsapp: '+96550000000', maps_url: 'https://maps.google.com/', instagram: '@lamsa.beauty',
    barbers: [{ name: 'ريم', role: 'صاحبة المركز', tags: ['صبغة', 'عرائس'] }, { name: 'نور', role: 'أخصائية', tags: ['أظافر'] }, { name: 'هبة', role: 'أخصائية', tags: ['بشرة', 'حواجب'] }],
    services: [{ name: 'قص وتصفيف الشعر', price: '12', duration: '45 دقيقة' }, { name: 'صبغة', price: '35', duration: '120 دقيقة' }, { name: 'مناكير وباديكير', price: '15', duration: '60 دقيقة' }, { name: 'تنظيف بشرة', price: '20', duration: '60 دقيقة' }],
    currency: 'د.ك', hours: week('10:00', '22:00', ['16:00', '22:00']),
    photos: { hero: u('1636019411401-82485711b6ba', 2000), side: u('1602585578130-c9076e09330d'), gallery: [u('1636019411480-58321fcb11ce'), u('1663229050017-503dbebdd573'), u('1626379501846-0df4067b8bb9')] },
    faq: [{ q: 'هل يوجد مكان خاص ومغلق للسيدات؟', a: 'نعم، المركز للسيدات فقط، والمدخل خاص.' }],
  }, G(4.9, 540, [['أم سارة', 'قبل أسبوعين', 'ريم فنانة بالصبغة، طلع اللون مثل ما طلبت بالضبط.'], ['دانة', 'قبل شهر', 'نور شغلها بالأظافر نظيف ومرتب.'], ['Fatma', 'قبل شهرين', 'المكان نظيف والأسعار واضحة.'], ['شهد', 'قبل شهرين', 'هبة رسمت حواجبي بشكل طبيعي جدًا.'], ['لولوة', 'قبل 3 أشهر', 'حجزت على الواتساب وما انتظرت.']]))
  if (kind === 'car') return buildBarberContent({
    ...base, kind, name: 'ورشة الخبير', latin: 'Al Khabeer Auto', city: 'دبي', area: 'القوز الصناعية', address: 'القوز الصناعية 3، دبي',
    phone: '+971 50 000 0000', whatsapp: '+971500000000', maps_url: 'https://maps.google.com/', instagram: '@khabeer.auto',
    barbers: [{ name: 'أبو أحمد', role: 'صاحب الورشة', tags: ['ميكانيك', 'قير'] }, { name: 'سليم', role: 'فني', tags: ['كهرباء', 'فحص كمبيوتر'] }],
    services: [{ name: 'تغيير زيت وفلتر', price: '150', duration: '30 دقيقة' }, { name: 'فحص كمبيوتر', price: '100', duration: '30 دقيقة' }, { name: 'صيانة فرامل', price: '350', duration: '60 دقيقة' }, { name: 'تكييف', duration: '' }],
    currency: 'د.إ', terms: [{ label: 'الضمان', text: '3 أشهر على الشغل، وضمان الوكيل على القطع' }, { label: 'السعر', text: 'نعطيك السعر قبل البدء، ولا نزيد دون أن نسألك' }],
    hours: week('08:00', '20:00', null),
    photos: { hero: u('1619642751034-765dfdf7c58e', 2000), side: u('1637640125496-31852f042a60'), gallery: [u('1625047509168-a7026f36de04'), u('1613206485381-b028e578e791'), u('1698382318239-2b134ca8fa4c')] },
    faq: [{ q: 'هل تعطونني السعر قبل البدء؟', a: 'نعم، دائمًا. ولا نغيّر قطعة دون أن نسألك.' }],
  }, G(4.7, 610, [['راشد', 'قبل أسبوعين', 'أبو أحمد صريح، قال لي ما أحتاج أغيّر القير ووفّر علي.'], ['Ali K.', 'قبل شهر', 'سليم عرف مشكلة الكهرباء في ربع ساعة.'], ['مازن', 'قبل شهرين', 'السعر نفس الذي قالوه قبل البدء.'], ['حمد', 'قبل شهرين', 'سريعين ومرتبين.'], ['بدر', 'قبل 3 أشهر', 'ورشة أمينة.']]))
  return buildBarberContent({
    ...base, kind: 'photo', name: 'استوديو ضوء', latin: 'Daw Studio', city: 'الدوحة', area: 'الوكرة', address: 'شارع الوكرة الرئيسي',
    phone: '+974 5000 0000', whatsapp: '+97450000000', maps_url: 'https://maps.google.com/', instagram: '@daw.studio',
    barbers: [{ name: 'جاسم', role: 'صاحب الاستوديو', tags: ['منتجات', 'بورتريه'] }],
    services: [{ name: 'جلسة تصوير شخصية', price: '400', duration: '60 دقيقة' }, { name: 'تصوير منتجات', price: '60', duration: 'للمنتج' }, { name: 'صور جواز وهوية', price: '30', duration: '10 دقيقة' }],
    currency: 'ر.ق', terms: [{ label: 'التسليم', text: 'خلال 7 أيام' }, { label: 'العربون', text: '30% عند الحجز' }],
    hours: week('10:00', '21:00', null), photos: { gallery: [] },
  }, G(4.9, 120, [['Hamad', 'قبل شهر', 'جاسم صوّر منتجاتنا بشكل احترافي، والتسليم كان بوقته.'], ['عبدالرحمن', 'قبل شهرين', 'أسعار واضحة وشغل نظيف.']]))
}
