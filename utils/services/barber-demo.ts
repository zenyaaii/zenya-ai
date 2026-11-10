/**
 * A made-up barbershop for the barber demo (/demo/barber) and the editor's
 * sample. Every name and review is invented for the demo; a real shop's
 * page is built from its own answers and its own Google reviews.
 * Photos: the barber pack (utils/services/niches.ts), no faces.
 */
import { buildBarberContent } from './barber'
import { unsplash } from './niches'
import type { ServiceContent } from './types'

export function barberDemoContent(): ServiceContent {
  return buildBarberContent(
    {
      name: 'صالون الأستاذ', latin: 'Al Ustaz Barber', city: 'عمّان', area: 'الصويفية', address: 'شارع الوكالات، الصويفية، عمّان',
      audience: 'رجال وأطفال', phone: '+962 79 000 0000', whatsapp: '+962790000000', maps_url: 'https://maps.google.com/',
      instagram: '@ustaz.barber', links: [],
      barbers: [
        { name: 'سامر', role: 'صاحب الصالون', tags: ['قص كلاسيكي', 'لحية'] },
        { name: 'ليث', role: 'حلاق', tags: ['تدريج', 'عرسان'] },
        { name: 'يزن', role: 'حلاق', tags: ['أطفال', 'بروتين'] },
      ],
      services: [
        { name: 'قص شعر', price: '5', duration: '30 د' },
        { name: 'تحديد اللحية', price: '3', duration: '15 د' },
        { name: 'شعر ولحية', price: '7', duration: '45 د' },
        { name: 'حلاقة أطفال', price: '4', duration: '20 د' },
        { name: 'بروتين للشعر', price: '25', duration: '90 د' },
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
