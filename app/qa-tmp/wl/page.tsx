"use client"
// TEMP sample route (not committed): the real Wellness theme filled with real gym / spa lead data.
import { useSearchParams } from 'next/navigation'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import type { WellnessContent } from '@/utils/wellness/types'
const I = (f: string) => `/qa-tmp/${f}.jpg`
const SPA: WellnessContent = {
  niche: 'spa',
  links: { whatsapp: '962795151610', map_url: 'https://maps.google.com/?q=حمام+الجامعة+التركي' },
  brand: { name: 'حمام الجامعة التركي', type: 'حمام تركي وسبا', city: 'عمّان', tagline: 'ملتقى الرياضيين' },
  hero: { eyebrow: 'شارع الملكة رانيا · عمّان · مفتوح 24 ساعة', headline: 'ساعة تنسى\nفيها تعبك.', subheadline: 'حمام تركي، ساونا، بخار وجاكوزي، ومساج بيد كابتن يذكره الزبائن بالاسم.', cta_primary: 'احجز موعدك', cta_secondary: 'الخدمات والأسعار', image: I('spa-jacuzzi'), badge: 'مفتوح الآن' },
  trust_bar: { items: ['4.8 من 2,393 تقييم', 'مفتوح 24 ساعة', 'قسم خاص للسيدات', 'المنشفة والصابون علينا'] },
  philosophy: { eyebrow: 'لماذا نحن', heading: 'نظافة يذكرها\nكل من زارنا.', subheading: 'هذا ما يتكرر في تقييمات جوجل: المكان نظيف، والشباب محترفون، والوقت محترم.', pillars: [
    { icon: 'spa', title: 'نظافة كل ساعة', text: '«الحمام التركي نظيف جدًا ومرتب» — أكثر كلمة في التقييمات.' },
    { icon: 'care', title: 'كابتن بخبرة', text: 'طلعت وحمد يعرفهم الزبائن بالاسم.' },
    { icon: 'accessibility', title: 'ليل ونهار', text: 'مفتوح 24 ساعة، بعد التمرين أو بعد العمل.' } ] },
  treatments: { heading: 'الخدمات والأسعار', subheading: 'السعر يشمل المنشفة والصابون والكيس.', items: [
    { name: 'حمام تركي علاجي', category: 'الحمام', duration: '60 دقيقة', price: '17 د.أ', description: 'بخار، تكييس، صابون، وماء ساخن.', badge: 'الأكثر طلبًا' },
    { name: 'مساج كامل', category: 'المساج', duration: '45 دقيقة', price: '20 د.أ', description: 'زيت دافئ للظهر والكتفين والساقين.' },
    { name: 'ساونا وبخار وجاكوزي', category: 'المرافق', duration: 'ساعتان', price: '8 د.أ', description: 'دخول حر للمرافق.' },
    { name: 'باقة الرياضي', category: 'الباقات', duration: '90 دقيقة', price: '32 د.أ', description: 'حمام علاجي ومساج استشفاء بعد التمرين.' } ] },
  journey: { heading: 'زيارتك خطوة بخطوة', subheading: 'من الباب حتى الراحة.', steps: [
    { step: '01', title: 'البخار', text: 'يفتح المسام ويهيئ الجسم.' }, { step: '02', title: 'الساونا', text: 'حرارة جافة تريح العضلات.' },
    { step: '03', title: 'التكييس', text: 'كابتن الحمام يقشّر الجلد بالكيس.' }, { step: '04', title: 'الجاكوزي والمساج', text: 'ماء دافئ، ثم زيت دافئ وراحة كاملة.' } ] },
  team: { heading: 'أسماء يذكرها الزبائن', subheading: 'من تقييمات جوجل الحقيقية.', members: [
    { name: 'طلعت', title: 'كابتن الحمام', specialty: 'الحمام العلاجي', bio: '«محترف جدًا في شغله، تعامله راقٍ ويهتم براحة الزبون.»' },
    { name: 'حمد', title: 'مساج', specialty: 'مساج الاستشفاء', bio: '«الوحيد الي كان خرافي، الشب الي عمل المساج.»' },
    { name: 'فهد وأبو سعد', title: 'الاستقبال والخدمة', specialty: 'الاستقبال', bio: '«شكر خاص للأخ فهد وأبو سعد على احترافيتهم.»' } ] },
  space: { heading: 'المكان', subheading: 'صور الحمام من صفحته على جوجل.', images: ['spa-lounge','spa-mural','spa-lounge2','spa-hall'].map(f=>({ url: I(f), alt: 'حمام الجامعة التركي' })), amenities: ['ساونا', 'بخار', 'جاكوزي', 'مساج', 'قسم للسيدات', 'مشروبات'] },
  testimonials: { heading: 'ماذا قالوا بعد الزيارة', subheading: 'من جوجل كما كُتبت.', average_rating: 4.8, review_count: '2,393', items: [
    { name: 'Yoseef Bdaeear', text: 'تجربة ممتازة من جميع النواحي. الحمام التركي نظيف جدًا ومرتب، والأجواء مريحة والخدمة راقية.', rating: 5, origin: 'google' },
    { name: 'Mohamad Mesleh', text: 'مكان بجنن وبتحس فيه براحة نفسية وجسدية بكل معنى الكلمة. نظافة رائعة، خبرة الشباب فوق الوصف.', rating: 5, origin: 'google' },
    { name: 'Abdelelah Alnaimat', text: 'خدمة احترافية ودقيقة، التزام رائع بالوقت. أجواء متكاملة، كل ما تحتاجه موجود.', rating: 5, origin: 'google' } ] },
  booking_cta: { eyebrow: 'الحجز', heading: 'احجز ساعتك.', subheading: 'يصل طلبك إلى الحمام، ويؤكّد لك الموعد على واتساب.', cta_label: 'احجز الآن', note: 'المرافق بلا موعد · المساج بموعد', image: I('spa-hall') },
  faq: { heading: 'أسئلة الزوار', items: [
    { q: 'هل أحتاج موعدًا؟', a: 'المرافق مفتوحة 24 ساعة بلا موعد. المساج والحمام العلاجي أفضل بموعد.' }, { q: 'هل يوجد قسم للسيدات؟', a: 'نعم، قسم خاص للسيدات بمدخل منفصل.' },
    { q: 'ماذا أحضر معي؟', a: 'لا شيء. المنشفة والصابون والكيس والشبشب عندنا.' }, { q: 'كم أبقى؟', a: 'الحمام العلاجي ساعة تقريبًا. مع المساج ساعة ونصف.' } ] },
  footer: { tagline: 'ملتقى الرياضيين', legal: '© 2026 حمام الجامعة التركي', phone: '079 515 1610', email: '', address: 'شارع الملكة رانيا، عمّان', hours: 'مفتوح 24 ساعة كل يوم' },
  seo: { title: 'حمام الجامعة التركي', description: '' },
}
const GYM: WellnessContent = {
  niche: 'center',
  links: { whatsapp: '962791023335', map_url: 'https://maps.google.com/?q=EPIC+GYM+Sweileh' },
  brand: { name: 'إيبك جيم', type: 'نادٍ رياضي', city: 'عمّان', region: 'صويلح', tagline: 'EPIC GYM' },
  hero: { eyebrow: 'صويلح · عمّان · يوميًا حتى 1:30 بعد منتصف الليل', headline: 'تمرّن مع مدرب\nيعرف اسمك.', subheadline: 'مدربون يتابعون تمرينك جولة بجولة، أجهزة حديثة، وشروط اشتراك مكتوبة قبل أن تدفع.', cta_primary: 'احجز حصة تجربة', cta_secondary: 'الاشتراكات', image: I('gym-hall2'), badge: 'حصة التجربة مجانية' },
  trust_bar: { items: ['5.0 من 248 تقييم', 'قسم وأوقات للسيدات', 'تجميد الاشتراك', 'إلغاء خلال 7 أيام'] },
  philosophy: { eyebrow: 'لماذا إيبك', heading: 'ثلاثة أشياء\nيكتبها المشتركون.', subheading: 'من تقييمات جوجل: المدرب، والنظافة، والأجهزة.', pillars: [
    { icon: 'care', title: 'مدرب يتابعك', text: '«يوقف عندك لين تطبق التمرين بشكل صحيح.»' },
    { icon: 'spa', title: 'نظافة', text: '«أهم إشي النظافة.»' },
    { icon: 'accessibility', title: 'أجهزة حديثة', text: '«الأجهزة حديثة ومتوفرة على اختلافها.»' } ] },
  treatments: { heading: 'الاشتراكات', subheading: 'السعر والتجميد مكتوبان قبل أن تدفع.', items: [
    { name: 'شهر', category: 'اشتراك', duration: 'تجميد 7 أيام', price: '35 د.أ', description: 'دخول كل الأيام، كل الأجهزة والكلاسات.' },
    { name: '3 أشهر', category: 'اشتراك', duration: 'تجميد 15 يومًا', price: '90 د.أ', description: 'دخول كل الأيام، كل الأجهزة والكلاسات.', badge: 'الأكثر طلبًا' },
    { name: 'سنة', category: 'اشتراك', duration: 'تجميد 45 يومًا', price: '300 د.أ', description: 'أوفر سعر للشهر.' },
    { name: 'تدريب شخصي', category: 'مدرب', duration: '8 جلسات', price: '60 د.أ', description: 'مع مدرب باسمه.' } ] },
  timetable: { heading: 'الكلاسات هذا الأسبوع', subheading: 'الوقت والمدربة.', slots: [
    { day: 'السبت', time: '7:00 م', name: 'لياقة', teacher: 'منار' }, { day: 'الإثنين', time: '7:00 م', name: 'لياقة', teacher: 'منار' },
    { day: 'الثلاثاء', time: '10:00 ص', name: 'كلاس سيدات', teacher: 'مها', level: 'سيدات' }, { day: 'الأربعاء', time: '7:00 م', name: 'قوة', teacher: 'فلاح' } ] },
  journey: { heading: 'أول أسبوع لك', subheading: 'كيف تبدأ.', steps: [
    { step: '01', title: 'حصة تجربة', text: 'تعال يومًا مجانًا بموعد.' }, { step: '02', title: 'قياس وخطة', text: 'مدرب يقيس ويكتب لك خطة.' },
    { step: '03', title: 'تختار اشتراكك', text: 'شهر، 3 أشهر، أو سنة.' }, { step: '04', title: 'متابعة', text: 'المدرب يرجع لك كل جولة.' } ] },
  team: { heading: 'المدربون', subheading: 'المشتركون يذكرونهم بالاسم.', members: [
    { name: 'فلاح', title: 'مدرب', specialty: 'قوة · متابعة شخصية', bio: '«أثبت بمعاملته ووده العمل الدؤوب وإخلاصه للعمل.»', image: I('gym-coach') },
    { name: 'منار', title: 'مدرّبة', specialty: 'كلاسات · لياقة', bio: '«خلال شهر بلشت ألاحظ التغيّر.»' },
    { name: 'مها', title: 'مدرّبة', specialty: 'كلاسات', bio: '«من أروع الكوتشات.»' } ] },
  space: { heading: 'النادي', subheading: 'صور النادي من صفحته على جوجل.', images: ['gym-machines','gym-steel','gym-boxes','gym-loft'].map(f=>({ url: I(f), alt: 'إيبك جيم' })), amenities: ['أجهزة حديثة', 'منطقة وظيفية', 'قسم سيدات', 'مدربون', 'مفتوح حتى 1:30 ص'] },
  testimonials: { heading: 'ماذا يقول المشتركون', subheading: 'من جوجل كما كُتبت.', average_rating: 5, review_count: '248', items: [
    { name: 'Malik', text: 'النادي جميل جدًا والمدربين متعاونين بشكل مو طبيعي، يوقف عندك لين تطبق التمرين بشكل صحيح.', rating: 5, origin: 'google' },
    { name: 'Leen Yaseen', text: 'من أفضل الأندية الرياضية. أهم إشي النظافة، والأجهزة حديثة ومتوفرة على اختلافها.', rating: 5, origin: 'google' },
    { name: 'Mohammed Tubasi', text: 'نتوجه بالتحية للكابتن فلاح، أثبت بمعاملته ووده العمل الدؤوب وإخلاصه للعمل.', rating: 5, origin: 'google' } ] },
  booking_cta: { eyebrow: 'حصة تجربة', heading: 'جرّب يومًا\nقبل أن تدفع.', subheading: 'أرسل اسمك ووقتك. يصل الطلب إلى النادي، ويؤكّد لك على واتساب.', cta_label: 'احجز الحصة', note: 'إلغاء خلال 7 أيام باسترداد كامل', image: I('gym-hall') },
  faq: { heading: 'قبل أن تشترك', items: [
    { q: 'كيف ألغي اشتراكي؟', a: 'خلال 7 أيام من الدفع تسترد المبلغ كاملًا. بعدها تستطيع التجميد.' }, { q: 'هل يوجد تدريب للسيدات؟', a: 'نعم، قسم وأوقات خاصة للسيدات مع مدرّبات.' },
    { q: 'هل أستطيع التجربة؟', a: 'نعم، حصة تجربة مجانية واحدة بموعد.' }, { q: 'متى تكون الزحمة؟', a: 'من 6 إلى 9 مساءً.' } ] },
  footer: { tagline: 'EPIC GYM', legal: '© 2026 إيبك جيم', phone: '079 102 3335', email: '', address: 'صويلح، عمّان', hours: 'السبت–الخميس 6:30 ص – 1:30 ص · الجمعة 2–6 م' },
  seo: { title: 'إيبك جيم', description: '' },
}
export default function Page() {
  const q = useSearchParams(); const n = q.get('n') || 'spa'; const p = (q.get('p') || (n === 'gym' ? 'noir' : 'forest')) as any
  const v = q.get('v') as any
  return <WellnessPreview content={n === 'gym' ? GYM : SPA} presetId={p} {...(v ? { view: v, onViewChange: () => {} } : {})} />
}
