/**
 * Made-up shops for the sample at /demo/niche-lab. Names, prices, reviews and
 * specs are invented for the demo. Photos: the vetted packs (no women, no
 * tattoos, no faces we picked).
 *
 * `fill` mimics how much the owner answered: 'full' (every question), 'low'
 * (Maps link and two services only), 'none' (Maps link only), so the sample
 * shows the page stays whole either way.
 */
import { nicheDemoContent } from '@/utils/services/niche-demo'
import { unsplash } from '@/utils/services/niches'
import type { ServiceContent } from '@/utils/services/types'
import type { NicheExtra } from './kit'

export type LabKind = 'beauty' | 'car' | 'photo' | 'gym'
export type Fill = 'full' | 'low' | 'none'
const u = (id: string, w = 1400) => unsplash(id, w)

function base(kind: LabKind): { c: ServiceContent; x: NicheExtra } {
  const c = nicheDemoContent(kind)
  if (kind === 'beauty') {
    const svc: [string, string, string, string][] = [
      ['قص وتصفيف', 'شعر', '45 دقيقة', '12'], ['صبغة كاملة', 'شعر', '120 دقيقة', '35'], ['بروتين', 'شعر', '150 دقيقة', '45'],
      ['مناكير', 'أظافر', '40 دقيقة', '8'], ['باديكير', 'أظافر', '50 دقيقة', '10'], ['جل', 'أظافر', '75 دقيقة', '18'],
      ['تنظيف بشرة', 'بشرة', '60 دقيقة', '20'], ['رسم حواجب', 'بشرة', '20 دقيقة', '5'],
      ['مساج استرخاء', 'مساج وحمام', '60 دقيقة', '25'], ['حمام مغربي', 'مساج وحمام', '90 دقيقة', '30'],
    ]
    c.services.items = svc.map(([name, , duration, price]) => ({ name, description: '', duration, price_from: `${price} د.ك` }))
    c.hero.image = u('1772378452022-94ee7971fe80', 2000)
    c.gallery.images = [c.hero.image, u('1540555700478-4be289fbecef'), u('1775500835259-d3b3f6d6e2f2'), u('1706795033855-eee02f726868')].map((url) => ({ url }))
    c.hero.subheadline = 'مركز للسيدات في السالمية. شعر وأظافر وبشرة ومساج، في غرف خاصة.'
    c.team!.members[0].quote = 'فنانة بالصبغة، طلع اللون مثل ما طلبت بالضبط.'; c.team!.members[0].quote_by = 'أم سارة'
    c.team!.members[1].quote = 'شغلها بالأظافر نظيف ومرتب.'; c.team!.members[1].quote_by = 'دانة'
    c.team!.members[2].quote = 'رسمت حواجبي بشكل طبيعي جدًا.'; c.team!.members[2].quote_by = 'شهد'
    c.faq.items.push({ q: 'هل أستطيع اختيار الأخصائية؟', a: 'نعم، اكتبي اسمها عند الحجز.' }, { q: 'هل المنتجات أصلية؟', a: 'نعم، ونريك العلبة قبل أن نبدأ.' })
    return {
      c, x: {
        offers: ['شعر', 'أظافر', 'بشرة', 'مساج', 'حمام مغربي'],
        groups: Object.fromEntries(svc.map(([n, g]) => [n, g])),
        packages: [
          { name: 'باقة العروس', includes: ['تسريحة ومكياج', 'مناكير وباديكير', 'حمام مغربي', 'ضيافة لمرافقتين'], duration: '4 ساعات', price: '180 د.ك' },
          { name: 'باقة الاسترخاء', includes: ['حمام مغربي', 'مساج 60 دقيقة', 'تنظيف بشرة'], duration: 'ساعتان ونصف', price: '65 د.ك' },
          { name: 'اليد والقدم', includes: ['مناكير', 'باديكير', 'تقشير وترطيب'], duration: '90 دقيقة', price: '25 د.ك' },
        ],
        blocks: [
          { id: 'hospitality', title: 'الضيافة', text: 'قهوة عربية وتمر بعد كل جلسة.' },
          { id: 'health', title: 'تنبيه صحي', text: 'المساج للاسترخاء، ولا يعالج الأمراض. إن كان عندك حساسية أو حمل أو سكري، أخبرينا قبل الجلسة.' },
          { id: 'late', title: 'التأخير والإلغاء', text: 'نسمح بـ15 دقيقة تأخير. بعدها نعيد جدولة الموعد.' },
        ],
        privacy: 'للسيدات فقط، والمدخل خاص',
        facilities: ['غرف خاصة', 'مصلى', 'مواقف', 'واي فاي'],
        features: ['المدة المكتوبة هي مدة الجلسة كاملة.', 'كل أداة تُعقّم بعد كل زبونة.', 'منتجات أصلية، ونريك العلبة قبل البدء.'],
      },
    }
  }
  if (kind === 'car') {
    c.services.items = [
      { name: 'تغيير زيت وفلتر', description: '', duration: '30 دقيقة', price_from: '150 د.إ' },
      { name: 'فحص كمبيوتر', description: '', duration: '30 دقيقة', price_from: '100 د.إ' },
      { name: 'صيانة فرامل', description: '', duration: 'ساعة', price_from: '350 د.إ' },
      { name: 'كهرباء السيارة', description: '', duration: '' },
      { name: 'تكييف', description: '', duration: '' },
      { name: 'غسيل خارجي', description: '', duration: '20 دقيقة' },
      { name: 'غسيل داخلي وخارجي', description: '', duration: '45 دقيقة' },
      { name: 'تلميع وحماية نانو', description: '', duration: 'يوم واحد' },
    ]
    c.gallery.images = [c.hero.image, u('1608506375591-b90e1f955e4b'), u('1637640125496-31852f042a60'), u('1611239179213-d972da54091a'), u('1625047509168-a7026f36de04')].map((url) => ({ url }))
    c.hero.subheadline = 'صيانة وغسيل وتلميع في القوز. نخبرك بالسعر قبل أن نبدأ.'
    c.team!.members[0].quote = 'صريح، قال لي ما أحتاج أغيّر القير ووفّر علي.'; c.team!.members[0].quote_by = 'راشد'
    c.team!.members[1].quote = 'عرف مشكلة الكهرباء في ربع ساعة.'; c.team!.members[1].quote_by = 'Ali K.'
    c.faq.items.push({ q: 'هل تستلمون السيارة من البيت؟', a: 'نعم داخل دبي. نأخذها ونعيدها بعد الشغل.' }, { q: 'هل القطع أصلية؟', a: 'أنت تختار: أصلية أو تجارية، ونكتب لك سعر الاثنين.' })
    c.faq.items.push({ q: 'كم يأخذ تغيير الزيت؟', a: 'نصف ساعة تقريبًا، وتنتظر في الاستراحة.' })
    return {
      c, x: {
        offers: ['صيانة دورية', 'فحص كمبيوتر', 'فرامل', 'كهرباء', 'تكييف', 'غسيل', 'تلميع'],
        groups: { 'تغيير زيت وفلتر': 'صيانة', 'فحص كمبيوتر': 'صيانة', 'صيانة فرامل': 'صيانة', 'كهرباء السيارة': 'صيانة', 'تكييف': 'صيانة', 'غسيل خارجي': 'غسيل وتلميع', 'غسيل داخلي وخارجي': 'غسيل وتلميع', 'تلميع وحماية نانو': 'غسيل وتلميع' },
        brands: ['تويوتا', 'نيسان', 'لكزس', 'هيونداي', 'كيا', 'مرسيدس', 'بي إم دبليو', 'فورد'],
        sizeNames: ['صغيرة', 'متوسطة', 'جيب'],
        sizes: [
          { name: 'غسيل خارجي', prices: ['25 د.إ', '30 د.إ', '40 د.إ'] },
          { name: 'غسيل داخلي وخارجي', prices: ['50 د.إ', '60 د.إ', '80 د.إ'] },
          { name: 'تلميع وحماية نانو', prices: ['600 د.إ', '750 د.إ', '900 د.إ'] },
        ],
        blocks: [
          { id: 'price_first', title: 'السعر قبل العمل', text: 'نرسل لك السعر مكتوبًا على واتساب قبل أي إصلاح، ولا نغيّر قطعة دون موافقتك.' },
          { id: 'free_check', title: 'الفحص مجاني', text: 'تدفع فقط إن وافقت على الإصلاح.' },
          { id: 'warranty', title: 'الضمان', text: '3 أشهر على الشغل، وضمان الوكيل على القطع.' },
          { id: 'parts', title: 'القطع', text: 'أصلية أو تجارية، أنت تختار. ونعطيك القطعة القديمة.' },
          { id: 'loyalty', title: 'للزبون الدائم', text: 'الغسلة الخامسة مجانًا.' },
        ],
        facilities: ['استراحة مكيفة', 'قهوة وشاي', 'واي فاي', 'استلام السيارة وتوصيلها'],
        story: 'ورشة عائلية في القوز منذ 2011. نقول لك ما تحتاجه سيارتك فعلًا، ولا نبيعك ما لا تحتاجه.',
        since: 2011,
      },
    }
  }
  if (kind === 'photo') {
    const work: [string, string][] = [
      ['1636019411401-82485711b6ba', 'منتجات'], ['1490645935967-10de6ba17061', 'طعام'], ['1749642955698-ebe5e4579034', 'أماكن'],
      ['1631730359585-38a4935cbec4', 'منتجات'], ['1608506375591-b90e1f955e4b', 'سيارات'], ['1512621776951-a57141f2eefd', 'طعام'],
      ['1583416750470-965b2707b355', 'أماكن'], ['1616750819456-5cdee9b85d22', 'منتجات'], ['1758970081655-a9c08d367e68', 'أماكن'],
    ]
    c.hero.subheadline = 'استوديو في الوكرة. نصوّر المنتجات والأطعمة والأماكن، والصور الرسمية في دقائق.'
    c.gallery.images = work.map(([id]) => ({ url: u(id, 1200) }))
    c.testimonials.items.push({ name: 'مطعم ورق عنب', text: 'صوّر قائمتنا كاملة في يوم واحد، والصور رفعت طلبات التوصيل.', rating: 5, origin: 'google' })
    c.faq.items = [{ q: 'هل أستلم الصور الأصلية؟', a: 'نعم، على رابط تحميل مع الصور المعدّلة.' }, { q: 'هل تصوّرون خارج الاستوديو؟', a: 'نعم، في المطعم أو المحل أو المكتب، داخل الدوحة بلا رسوم مواصلات.' }]
    c.terms = []
    c.team!.members[0].quote = 'صوّر منتجاتنا بشكل احترافي، والتسليم كان بوقته.'; c.team!.members[0].quote_by = 'Hamad'
    return {
      c, x: {
        offers: ['منتجات', 'طعام', 'أماكن', 'سيارات', 'صور رسمية'],
        work: work.map(([id, tag]) => ({ url: u(id, 1200), tag })),
        packages: [
          { name: 'صور جواز وإقامة', includes: ['6 نسخ مطبوعة', 'نسخة رقمية على واتساب'], duration: '10 دقائق', price: '30 ر.ق' },
          { name: 'تصوير منتجات', includes: ['3 زوايا لكل منتج', 'خلفية بيضاء أو ملونة', 'تعديل الإضاءة والألوان'], duration: 'للمنتج الواحد', price: '60 ر.ق' },
          { name: 'تصوير قائمة مطعم', includes: ['حتى 25 طبقًا', 'تنسيق الأطباق', 'الصور الأصلية والمعدّلة'], duration: 'يوم واحد', price: '1,800 ر.ق' },
        ],
        delivery: [{ what: 'الصور الرسمية', when: 'فورًا' }, { what: 'المنتجات', when: 'خلال 3 أيام' }, { what: 'القوائم والأماكن', when: 'خلال 7 أيام' }],
        specs: [{ label: 'تأشيرة شنغن', text: '3.5 × 4.5 سم، خلفية فاتحة' }, { label: 'جواز السفر', text: '4 × 6 سم، خلفية بيضاء' }, { label: 'الهوية', text: '3 × 4 سم، خلفية بيضاء' }],
        blocks: [{ id: 'edits', title: 'التعديل', text: 'تعديلان مجانًا لكل صورة.' }, { id: 'outcall', title: 'خارج الاستوديو', text: 'نصوّر عندك داخل الدوحة، والمواصلات مجانية.' }],
        story: 'نصوّر ما تبيعه كما يراه زبونك: ضوء صادق، ولون حقيقي، وتفاصيل واضحة. من صورة جواز في عشر دقائق إلى قائمة مطعم كاملة في يوم.',
        since: 2016,
      },
    }
  }
  // gym
  c.hero.subheadline = 'نادٍ للرجال في الملقا. أجهزة جديدة، ومدرب يتابعك من أول يوم.'
  c.services.items[1].description = 'الأكثر طلبًا'
  c.gallery.images = [u('1558611848-73f7eb4001a1'), u('1689877020200-403d8542d95d'), u('1623874514711-0f321325f318'), u('1544033527-b192daee1f5b'), u('1597076537061-a6b58163aa45')].map((url) => ({ url }))
  c.team!.members[0].quote = 'فيصل ما قصّر معي في البرنامج والتغذية.'; c.team!.members[0].quote_by = 'خالد'
  c.team!.members[1].quote = 'مدرب ممتاز للتخسيس، نزلت 9 كيلو في 3 أشهر.'; c.team!.members[1].quote_by = 'سعد ع.'
  c.team!.members[2].quote = 'كلاس الملاكمة معه ممتع.'; c.team!.members[2].quote_by = 'ناصر'
  c.faq.items.push({ q: 'هل الحصص الجماعية داخل الاشتراك؟', a: 'نعم في اشتراك 3 أشهر والسنوي. في الشهري تدفع الحصة وحدها.' }, { q: 'هل يوجد مكان للسيارة؟', a: 'نعم، مواقف مجانية أمام النادي.' })
  return {
    c, x: {
      offers: ['بناء عضل', 'تخسيس', 'كروس فت', 'ملاكمة', 'تدريب شخصي'],
      classes: [
        { day: 0, items: [{ time: '6:00 ص', name: 'كروس فت' }, { time: '7:30 م', name: 'ملاكمة' }] },
        { day: 1, items: [{ time: '6:00 ص', name: 'لياقة عامة' }, { time: '8:00 م', name: 'كروس فت' }] },
        { day: 2, items: [{ time: '7:30 م', name: 'ملاكمة' }] },
        { day: 3, items: [{ time: '6:00 ص', name: 'كروس فت' }, { time: '8:00 م', name: 'تمارين البطن' }] },
        { day: 4, items: [{ time: '7:30 م', name: 'ملاكمة' }, { time: '9:00 م', name: 'كروس فت' }] },
      ],
      facilities: ['خزائن ودُش', 'ساونا', 'مواقف', 'واي فاي', 'مصلى', 'تكييف في كل الصالات'],
      story: 'بدأنا في الملقا لأننا لم نجد ناديًا يعرف أعضاءه بالاسم. اليوم عندنا أجهزة جديدة ومدرب يتابعك من أول يوم حتى تصل إلى هدفك.',
      since: 2019,
      steps: [
        { title: 'حصة تجربة', text: 'احجز وقتك، وجرّب النادي مجانًا مرة واحدة.' },
        { title: 'جلسة تقييم', text: 'يقيس المدرب لياقتك ووزنك، ويسألك عن هدفك.' },
        { title: 'برنامجك', text: 'تأخذ برنامجًا مكتوبًا، ويتابعك المدرب كل أسبوع.' },
      ],
      perks: {
        'اشتراك شهري': ['دخول الصالة كل الأيام', 'جلسة تقييم', 'خزانة ودُش'],
        'اشتراك 3 أشهر': ['دخول الصالة كل الأيام', 'جلسة تقييم', 'خزانة ودُش', 'كل الحصص الجماعية', 'تجميد أسبوعين'],
        'اشتراك سنوي': ['دخول الصالة كل الأيام', 'جلسة تقييم', 'خزانة ودُش', 'كل الحصص الجماعية', 'تجميد شهر', 'ساونا'],
        'تدريب شخصي': ['10 حصص مع مدرب', 'برنامج تغذية', 'قياس كل أسبوعين'],
      },
    },
  }
}

export function labContent(kind: LabKind, fill: Fill): { c: ServiceContent; x: NicheExtra } {
  const { c, x } = base(kind)
  if (fill === 'full') return { c, x }
  // What survives when the owner only gave the Maps link (+ two services for 'low').
  const keep = fill === 'low' ? 2 : 0
  const c2: ServiceContent = JSON.parse(JSON.stringify(c))
  c2.services.items = keep ? c.services.items.slice(0, keep).map((s) => ({ ...s, price_from: undefined })) : (kind === 'gym' ? ['اشتراك شهري', 'اشتراك 3 أشهر'] : kind === 'car' ? ['صيانة دورية', 'فحص كمبيوتر', 'غسيل'] : kind === 'photo' ? ['صور رسمية', 'تصوير منتجات'] : ['شعر', 'أظافر', 'بشرة']).map((name) => ({ name, description: '' }))
  c2.team = { members: [] }
  c2.faq.items = []
  c2.terms = []
  c2.testimonials.items = c.testimonials.items.slice(0, fill === 'low' ? 2 : 3)
  c2.hero.subheadline = ''
  c2.gallery.images = kind === 'photo' ? c.gallery.images.slice(0, fill === 'low' ? 4 : 0) : c.gallery.images.slice(0, 1)
  if (kind === 'photo' && fill === 'none') c2.hero.image = ''
  c2.booking = { mode: 'both' }
  const x2: NicheExtra = fill === 'low' ? { offers: x.offers?.slice(0, 2), work: x.work?.slice(0, 4) } : {}
  return { c: c2, x: x2 }
}
