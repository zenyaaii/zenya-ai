/**
 * Single source of truth for the FAQ page — imported by both the visible
 * accordion (page.tsx) and the FAQPage JSON-LD (layout.tsx) so the rich-result
 * markup can never drift from what users actually see.
 *
 * Every answer must stay factually accurate: pricing, trial count, hosting
 * region, and template list all match the live product. No invented claims.
 */

export type QA = { q: string; a: string }

export const AR_FAQS: QA[] = [
  {
    q: 'ما هي زينيا؟',
    a: 'زينيا أوّل شركة إسلامية لإنشاء المواقع بالذكاء الاصطناعي، ومنصّة عربية لكل نشاط تجاري. تختار قالبًا مناسبًا لنوع نشاطك، وتكتب نبذة قصيرة، ويتكفّل الذكاء الاصطناعي بكتابة المحتوى واختيار التصميم وترتيب الأقسام — لتحصل على موقع احترافي جاهز للنشر خلال دقائق.',
  },
  {
    q: 'كيف تعمل زينيا؟',
    a: 'ثلاث خطوات: (١) اختر واحدًا من ثمانية قوالب حسب نوع نشاطك. (٢) اكتب نبذة قصيرة أو الصق رابط منتجك. (٣) يولّد الذكاء الاصطناعي موقعًا كاملًا بالنصوص والتصميم، يمكنك تعديله ونشره فورًا.',
  },
  {
    q: 'هل أحتاج خبرة في البرمجة أو التصميم؟',
    a: 'لا. زينيا مصمّمة لأصحاب الأنشطة التجارية، لا للمبرمجين. لا حاجة لكتابة أي كود أو التعامل مع مصمّم — كل شيء يتمّ بكتابة نبذة بسيطة، ويمكنك تعديل المحتوى بأوامر بسيطة لاحقًا.',
  },
  {
    q: 'ما القوالب المتاحة؟',
    a: 'ثمانية قوالب، واحد لكل نوع نشاط: مطعم، لوك بوك أزياء، صفحة هبوط لتطبيق، قصة علامة تجارية، مركز عافية، خدمات، متجر بمنتجات متعددة، ومتجر بمنتج واحد. نضيف قوالب جديدة باستمرار.',
  },
  {
    q: 'كم من الوقت يستغرق إنشاء الموقع؟',
    a: 'دقائق. بمجرّد كتابة نبذتك، يولّد الذكاء الاصطناعي الموقع كاملًا. ثم تراجعه وتعدّله وتنشره في نفس الجلسة.',
  },
  {
    q: 'بأي لغة يكون محتوى الموقع؟',
    a: 'زينيا عربية أولًا — المحتوى المُولّد بلغة عربية سليمة، والتخطيط من اليمين إلى اليسار، والخطوط مصمّمة للعربية. ليست ترجمة لاحقة، بل تصميم عربيّ من الأساس.',
  },
  {
    q: 'أين تُستضاف المواقع؟ وماذا عن الخصوصية؟',
    a: 'تُستضاف المواقع والبيانات داخل الاتحاد الأوروبي، مع شهادة SSL تلقائية والتزام كامل باللائحة العامة لحماية البيانات (GDPR). خصوصيتك وبيانات عملائك محميّة ببنية أوروبية موثوقة.',
  },
  {
    q: 'هل يمكنني ربط نطاقي المخصّص؟',
    a: 'نعم، على خطة Pro. تربط نطاقك الخاص (مثل mystore.com)، وتحصل على شهادة SSL تلقائية وإزالة شارة زينيا. كما نقدّم نطاقًا مخصّصًا مجانيًا لسنة كاملة (نطاق قياسي) مع خطة Pro، وخصم 30% على النطاقات الأخرى.',
  },
  {
    q: 'هل يمكنني التصدير إلى شوبيفاي؟',
    a: 'نعم. قالبا التجارة الإلكترونية (المتجر والتشكيلة) يُصدَّران كثيمات شوبيفاي جاهزة تعمل مباشرة على متجرك، حيث يتولّى شوبيفاي السلة والدفع والمنتجات. أما القوالب الأخرى فهي مواقع عرض تستضيفها زينيا.',
  },
  {
    q: 'كم تكلفة زينيا؟',
    a: 'المعاينة مجانية. يفتح التوليد بخطة Entry (0.50$ لمرة واحدة) لقالبين ونشرهما على اسمك.zenyaai.co. ثم خطة Starter بـ 14.99$ شهريًا لتوليد غير محدود ونطاق مخصّص وحجوزات وتحليلات، وخطة Pro بـ 24.99$ شهريًا تضيف نطاقًا مجانيًا لسنة وإزالة شارة زينيا. راجع صفحة الأسعار للتفاصيل.',
  },
  {
    q: 'هل يمكنني الإلغاء في أي وقت؟',
    a: 'نعم. تُلغى الاشتراكات في أي وقت من لوحة التحكم، ويبقى اشتراكك فعّالًا حتى نهاية الفترة المدفوعة الحالية. تبقى القوالب والتصديرات التي أنشأتها محفوظة في حسابك.',
  },
]

export const EN_FAQS: QA[] = [
  {
    q: 'What is Zenya?',
    a: 'Zenya is the first Muslim company to build AI websites, made for the Arab market. You pick a template that matches your business type, write a short brief, and the AI writes the copy, chooses the design, and lays out the sections — giving you a professional, publish-ready site in minutes.',
  },
  {
    q: 'How does Zenya work?',
    a: 'Three steps: (1) choose one of eight templates by business type; (2) write a short brief or paste your product link; (3) the AI generates a full site — copy and design — that you can edit and publish right away.',
  },
  {
    q: 'Do I need coding or design experience?',
    a: 'No. Zenya is built for business owners, not developers. There is no code to write and no designer to hire — everything happens from a simple brief, and you can edit the content with plain instructions afterward.',
  },
  {
    q: 'Which templates are available?',
    a: 'Eight templates, one per business type: restaurant, fashion lookbook, app landing page, brand story, wellness center, services, multi-product store, and single-product storefront. We add new templates regularly.',
  },
  {
    q: 'How long does it take to build a site?',
    a: 'Minutes. Once you write your brief, the AI generates the full site. You then review, edit, and publish in the same session.',
  },
  {
    q: 'What language is the site content in?',
    a: 'Zenya is Arabic-first — generated content is in proper Arabic, the layout is right-to-left, and the fonts are designed for Arabic. It is Arabic by design, not a bolted-on translation.',
  },
  {
    q: 'Where are sites hosted, and what about privacy?',
    a: 'Sites and data are hosted inside the European Union, with automatic SSL and full GDPR compliance. Your privacy and your customers’ data are protected by trusted EU infrastructure.',
  },
  {
    q: 'Can I connect my own custom domain?',
    a: 'Yes, on the Pro plan. Connect your own domain (like mystore.com) with automatic SSL and no Zenya badge. Pro also includes a free custom domain for a full year (standard domain), and 30% off any other domain.',
  },
  {
    q: 'Can I export to Shopify?',
    a: 'Yes. The two e-commerce templates (Storefront and Collective) export as ready Shopify themes that run directly on your store, where Shopify handles cart, checkout, and products. The other templates are brochure sites that Zenya hosts.',
  },
  {
    q: 'How much does Zenya cost?',
    a: 'Previewing is free. AI generation unlocks with Entry, a one-time $0.50 that gives you two templates and publishing on yourname.zenyaai.co. Then Starter is $14.99/month for unlimited generation, a custom domain, bookings and analytics, and Pro is $24.99/month adding a free domain for a year and no Zenya badge. See the pricing page for details.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Subscriptions can be cancelled anytime from your dashboard and stay active until the end of the current billing period. Themes and exports you have created remain in your account.',
  },
]
