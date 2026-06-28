import type { RestaurantContent } from './types'

export const RESTAURANT_MOCK_CONTENT: RestaurantContent = {
  brand: {
    name: 'دار نُور',
    cuisine: 'مطبخ شرقي عصري',
    tagline: 'حوارٌ من سبعة أطباق بين النار والبحر والفصول.',
    city: 'الرياض',
    neighborhood: 'حي السفارات'
  },
  hero: {
    eyebrow: 'الحجوزات مفتوحة · قائمة تذوّق الربيع',
    headline: 'تميّزٌ\nيسكنه الهدوء.',
    subheadline:
      'طاولةٌ حميمة من أربعة وعشرين مقعدًا، يُجهَّز فيها كل طبق أمامك. يطهو الشيف خالد مرعي قائمة تذوّق واحدة تتغيّر مع مواسم المزارع المحلية.',
    primary_cta: 'احجز طاولة',
    secondary_cta: 'شاهد القائمة',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80'
  },
  story: {
    eyebrow: 'قصتنا',
    heading: 'مبنية على السكينة والنار والفصول.',
    body:
      'افتُتحت «دار نُور» عام 2019 في بيتٍ قديم أُعيد ترميمه. نزرع معظم ما نقدّمه في مزرعتنا العائلية خارج المدينة، ونعمل مع دائرة صغيرة من الصيّادين والمزارعين الذين يشاركوننا شغف الصبر والإتقان.',
    chef_name: 'خالد مرعي',
    chef_title: 'الشيف · المالك',
    chef_bio:
      'تدرّب خالد في باريس وبيروت، وعاد إلى الرياض عام 2017 ليطهو الطعام الذي اشتاق إليه — أهدأ، وأبطأ، وأكثر تجذّرًا في المكان.',
    chef_photo:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    accent_image:
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1600&q=80'
  },
  signature_dishes: [
    {
      name: 'إسكالوب البحر المصطاد يدويًا',
      description: 'زبدة بنّية، وكشمش مخلّل، وغبار الشمر.',
      price: '$36',
      image:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'بطّ الوادي',
      description: 'مُعتَّق أربعين يومًا، ورق التين، ملح مدخّن، خوخ مشوي.',
      price: '$58',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'تالياتيلّي مقطّعة يدويًا',
      description: 'قنفذ البحر، زبدة بنّية، قشر الليمون، فتات العجين المخمّر.',
      price: '$42',
      image:
        'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'كريم بروليه باللافندر',
      description: 'لافندر، حبّة الفانيليا، قشرة سكر الديميرارا.',
      price: '$18',
      image:
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  signature_dishes_heading: 'الأطباق التي يشتهر بها مطبخنا',
  menu: {
    heading: 'قائمة الطعام',
    subheading: 'تُقدَّم من الثلاثاء إلى السبت، من 5:30 إلى 10:00 مساءً. قائمة التذوّق تتغيّر أسبوعيًا.',
    categories: [
      {
        id: 'starters',
        name: 'المقبّلات',
        description: 'لبدايةٍ هادئة.',
        items: [
          { name: 'تارتار اللحم', description: 'سَمَك مُعتَّق، صفار بيض مدخّن، عجين مخمّر.', price: '$24' },
          { name: 'شمندر مشوي', description: 'كريمة مخمّرة، جوز، خلّ الشيري.', price: '$18' },
          { name: 'محار', description: 'نصف دزينة محار طازج، صلصة مينيونيت، ليمون.', price: '$28' },
          { name: 'بوراتا', description: 'طماطم بلدية، زيت الريحان، ملح التقديم.', price: '$22' }
        ]
      },
      {
        id: 'mains',
        name: 'الأطباق الرئيسية',
        description: 'قلب القائمة.',
        items: [
          { name: 'بطّ الوادي', description: 'مُعتَّق أربعين يومًا، ورق التين، ملح مدخّن.', price: '$58', badge: 'طبق التوقيع' },
          { name: 'قاروص بحري بري', description: 'زبدة بنّية، كبر، ليمون مشوي.', price: '$48' },
          { name: 'تالياتيلّي', description: 'قنفذ البحر، زبدة بنّية، قشر الليمون.', price: '$42' },
          { name: 'ريب آي مُعتَّق', description: 'لشخصين. نخاع العظم، جرجير، بطاطس مهروسة.', price: '$120' },
          { name: 'قرنبيط محمّر', description: 'زبدة بنّية، كبر، برالين اللوز.', price: '$32' }
        ]
      },
      {
        id: 'desserts',
        name: 'الحلويات',
        description: 'ختامٌ هادئ.',
        items: [
          { name: 'كريم بروليه باللافندر', description: 'لافندر، فانيليا، قشرة الديميرارا.', price: '$18', badge: 'طبق التوقيع' },
          { name: 'سوفليه الشوكولاتة', description: 'شوكولاتة فالرونا، كريمة إنجليزية.', price: '$20' },
          { name: 'تارت التفّاح المقلوب', description: 'تفّاح، كراميل مملّح، كريمة فريش.', price: '$18' },
          { name: 'تشكيلة أجبان', description: 'ثلاثة أجبان حرفية، شهد العسل، خبز الجوز.', price: '$24' }
        ]
      },
      {
        id: 'drinks',
        name: 'المشروبات',
        description: 'من اختيار خبير المشروبات سامي حدّاد.',
        items: [
          { name: 'تناغم العصائر الموسمية', description: 'ثلاثة أكواب على امتداد الوجبة.', price: '$45' },
          { name: 'تناغم النقائع النباتية', description: 'خمسة أكواب، منسّقة مع قائمة التذوّق.', price: '$65' },
          { name: 'القهوة المختصّة', description: 'تحضير يدوي من حبوب مختارة.', price: '$18' },
          { name: 'شاي وأعشاب فاخرة', description: 'نقائع وتخميرات وعصائر طازجة.', price: '$22' }
        ]
      }
    ]
  },
  gallery: {
    heading: 'مكانٌ، ونار، وفصل.',
    subheading: 'صورٌ من قاعة الطعام والمطبخ.',
    images: [
      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80', alt: 'طاولة على ضوء الشموع' },
      { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80', alt: 'طبق من الأعلى' },
      { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=80', alt: 'طبق التوقيع' },
      { url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=80', alt: 'تفاصيل طبق' },
      { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80', alt: 'قاعة الطعام' },
      { url: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=1400&q=80', alt: 'خضراوات موسمية' }
    ]
  },
  hours_location: {
    heading: 'تجدنا هنا.',
    subheading: 'شارع الأمير، حي السفارات، الرياض',
    address: 'شارع الأمير، حي السفارات، الرياض 12512',
    phone: '+966 11 555 0140',
    email: 'reservations@darnoor.sa',
    map_link: 'https://maps.google.com/?q=Diplomatic+Quarter+Riyadh',
    hours: [
      { day: 'monday', label: 'الإثنين', open: '', close: '', closed: true },
      { day: 'tuesday', label: 'الثلاثاء', open: '5:30 م', close: '10:00 م' },
      { day: 'wednesday', label: 'الأربعاء', open: '5:30 م', close: '10:00 م' },
      { day: 'thursday', label: 'الخميس', open: '5:30 م', close: '10:00 م' },
      { day: 'friday', label: 'الجمعة', open: '5:30 م', close: '11:00 م' },
      { day: 'saturday', label: 'السبت', open: '5:30 م', close: '11:00 م' },
      { day: 'sunday', label: 'الأحد', open: '5:00 م', close: '9:30 م' }
    ]
  },
  reservations: {
    heading: 'احجز أمسيتك.',
    subheading:
      'تُفتح الحجوزات قبل ثلاثين يومًا، كل صباح عند التاسعة. تُتاح طاولة الشيف وقاعة الطعام الخاصة في أول كل شهر.',
    cta_label: 'احجز الآن',
    provider: { type: 'resy', url: 'https://darnoor.sa/reserve' },
    note: 'للمناسبات الخاصة أو الحجوزات لثمانية أشخاص فأكثر، يُرجى المراسلة على events@darnoor.sa.'
  },
  reviews: {
    heading: 'في القاعة.',
    subheading: 'كلماتٌ من ضيوف ونقّاد زارونا مؤخّرًا.',
    overall_rating: 4.9,
    review_count: '+630',
    testimonials: [
      {
        name: 'سعد الدوسري',
        text: 'مطعمٌ بثقةٍ هادئة غير معتادة. يطهو مرعي بصبر من لم يعد لديه ما يثبته.',
        source: 'مجلة المذاق',
        rating: 5
      },
      {
        name: 'ريم النعيمي',
        text: 'العشاء الذي تتذكّره بعد عام. البطّ وحده يستحقّ الرحلة من أي مكان.',
        source: 'ضيفة موثّقة',
        rating: 5
      },
      {
        name: 'يوسف الحربي',
        text: 'خدمة دقيقة دون تكلّف، وتناغم المشروبات استثنائي. احتفلنا بمناسبتنا هنا وسنعود.',
        source: 'ضيف موثّق',
        rating: 5
      },
      {
        name: 'منى الشمري',
        text: 'يستحقّ كل ريال. طاولة المطبخ أفضل مقعد في المدينة إن أردت مشاهدة محترف في عمله.',
        source: 'ضيفة موثّقة',
        rating: 5
      }
    ]
  },
  press: {
    heading: 'في الصحافة.',
    items: [
      { outlet: 'دليل ميشلان', quote: 'نجمة واحدة · 2023، 2024' },
      { outlet: 'مجلة المذاق', quote: '«ثلاث نجوم.»' },
      { outlet: 'دليل المطاعم' },
      { outlet: 'مجلة الذوّاقة', quote: 'أفضل 50 مطعمًا جديدًا' },
      { outlet: 'سفرة' },
      { outlet: 'طعام ونبيذ' }
    ]
  },
  newsletter: {
    heading: 'رسالة الموسم.',
    subheading: 'ثلاث مرّات في العام نشارككم القائمة الجديدة، والمزرعة، وما نقرؤه.',
    button_label: 'اشترك'
  },
  faq: {
    heading: 'قبل أن تأتي.',
    items: [
      {
        q: 'هل هناك قواعد للزيّ؟',
        a: 'نطلب من الضيوف ارتداء زيّ أنيق غير رسمي. السترات والأزياء الراقية شائعة، ولا نشترط ربطة عنق.'
      },
      {
        q: 'هل تراعون القيود الغذائية؟',
        a: 'نعم. أخبرونا عند الحجز وسنُعدّ قائمة تراعي أي حساسية أو تفضيل، بما في ذلك النباتي والخالي من الغلوتين.'
      },
      {
        q: 'هل ترحّبون بالأطفال؟',
        a: 'الأطفال فوق العاشرة مرحّب بهم في جميع الأوقات، والأصغر سنًّا في جلسة الأحد عند الخامسة مساءً.'
      },
      {
        q: 'أين يمكننا ركن السيارة؟',
        a: 'يتوفّر موقف عام قريب على بُعد مبنيين، إضافة إلى خدمة صفّ السيارات في المساء.'
      },
      {
        q: 'هل تقدّمون قاعة طعام خاصة؟',
        a: 'تتّسع قاعتنا الخاصة لعشرين ضيفًا. يُرجى المراسلة على events@darnoor.sa للاستفسار.'
      },
      {
        q: 'ما سياسة الإلغاء؟',
        a: 'نحجز عربونًا قدره 75$ للشخص عند الحجز، قابلًا للاسترداد حتى ثماني وأربعين ساعة قبل موعدك.'
      }
    ]
  },
  footer: {
    tagline: 'مفتوح للعشاء من الثلاثاء إلى الأحد. مغلق الإثنين.',
    legal: '© 2026 دار نُور. جميع الحقوق محفوظة.'
  },
  seo: {
    title: 'دار نُور · قائمة تذوّق شرقية عصرية · الرياض',
    description:
      'طاولةٌ حميمة من أربعة وعشرين مقعدًا في الرياض. يطهو الشيف خالد مرعي قائمة تذوّق موسمية من مزارع محلية.'
  }
}
