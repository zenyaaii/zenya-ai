import { Suspense } from 'react'
import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'

export default function DemoFullPage() {
  return (
    <Suspense fallback={<div>جارٍ التحميل…</div>}>
      <DemoFullContent />
    </Suspense>
  )
}

function DemoFullContent() {
  const mockContent = {
    hero: {
      headline: "آخر مكنسة كهربائية ستحتاج إليها",
      subheadline: "مصمَّمة بقوة شفط احترافية وتقنية هادئة للغاية. اختبر مستقبل التنظيف اليوم.",
      cta: "احصل على خصم 50% الآن"
    },
    features: [
      { title: "هدوء تام", desc: "نظّف منزلك دون إيقاظ الصغار. تعمل بأقل من 40 ديسيبل.", icon: "volume-x" },
      { title: "بطارية طوال اليوم", desc: "شحنة واحدة تدوم حتى 120 دقيقة. تكفي لتنظيف منزلك بالكامل مرتين.", icon: "battery-charging" },
      { title: "ممحاة شعر الحيوانات", desc: "فُرَش متخصّصة لرفع شعر الحيوانات العنيد من أي سطح.", icon: "dog" }
    ],
    problem: {
      headline: "سئمت المكانس الثقيلة والضعيفة؟",
      text: "المكانس التقليدية ثقيلة وصاخبة وتفقد قوة الشفط بعد بضعة أشهر. لا ينبغي أن تصارع أدوات التنظيف لديك."
    },
    solution: {
      headline: "تعرّف على زينيا V2",
      text: "تصميم خفيف كالريشة يلتقي بقوة صناعية. أعدنا تصوّر ما يجب أن تكون عليه المكنسة، لنجعل التنظيف سهلًا بل وممتعًا."
    },
    testimonials: [
      { name: "سارة المنصور", text: "لا أصدّق كمّ الغبار الذي التقطته. سجادي يبدو جديدًا تمامًا!", location: "الرياض", rating: 5 },
      { name: "محمد العتيبي", text: "أخيرًا، مكنسة لا تؤلم ظهري. تستحق كل ريال.", location: "جدة", rating: 5 },
      { name: "ليلى الخالدي", text: "عمر البطارية مذهل. نظّفت منزلي المكوّن من طابقين بشحنة واحدة.", location: "الدمام", rating: 5 }
    ],
    faq: [
      { q: "هل تعمل على الأرضيات الخشبية؟", a: "نعم! رأس الأسطوانة الناعمة مصمّم خصيصًا لتلميع الأرضيات الصلبة أثناء التنظيف." },
      { q: "ما مدة الضمان؟", a: "نقدّم ضمانًا رائدًا في القطاع لمدة 5 سنوات على المحرّك والبطارية." },
      { q: "هل الفلتر قابل للغسل؟", a: "بالتأكيد. اشطفه فقط بالماء البارد مرة شهريًا للحفاظ على أعلى أداء." },
      { q: "ما سياسة الإرجاع؟", a: "جرّبها دون مخاطرة لمدة 30 يومًا. إن لم تعجبك، سنتحمّل تكلفة شحن الإرجاع." }
    ],
    guarantee: {
      title: "ضمان استرداد دون مخاطرة لمدة 30 يومًا",
      text: "نحن واثقون تمامًا أنك ستحب زينيا V2 لدرجة أننا نتيح لك تجربتها في منزلك لمدة 30 يومًا. دون أي شروط.",
      days: 30
    },
    scrolling_text: [
      "شحن مجاني خلال يومين", "ضمان 5 سنوات مشمول", "أكثر من 50,000 عميل سعيد", "الأفضل تقييمًا من مجلة CleanHome"
    ],
    slideshow: [
      {
        heading: "نظّف بذكاء لا بجهد",
        subheading: "أكثر مكنسة لاسلكية تطوّرًا في السوق.",
        cta: "تسوّق الآن",
        image: "https://images.unsplash.com/photo-1558317374-a309d244678e?q=80&w=1920&auto=format&fit=crop"
      },
      {
        heading: "أصحاب الحيوانات يحبّوننا",
        subheading: "ودّع شعر الحيوانات للأبد مع فرشاتنا الحاصلة على براءة اختراع المقاومة للتشابك.",
        cta: "اطّلع على المزايا",
        image: "https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=1920&auto=format&fit=crop"
      }
    ],
    rich_text: {
      title: "مصمّمة للحياة الواقعية",
      text: "لم نكتفِ ببناء مكنسة أخرى. درسنا كيف ينظّف الناس فعليًا. والنتيجة آلة تتوقّع احتياجاتك، وتتكيّف مع نوع أرضيتك، وتُرشّح 99.9% من مسبّبات الحساسية."
    },
    image_text: {
      title: "كشف الغبار بالليزر",
      text: "ليزر بزاوية دقيقة يكشف الغبار غير المرئي على الأرضيات الصلبة، فلا يفوتك شيء. شاهد ما تنظّفه لحظيًا.",
      cta: "تعرّف على التقنية"
    },
    multicolumn: [
      { title: "فلترة HEPA", text: "تحبس 99.99% من الجسيمات المجهرية الصغيرة حتى 0.3 ميكرون." },
      { title: "تشغيل 60 دقيقة", text: "قوة ثابتة دون تراجع للتنظيف هنا وهناك وفي كل مكان." },
      { title: "تفريغ صحّي للحاوية", text: "آلية بضغطة زر تقذف الغبار والأوساخ عميقًا داخل سلّتك." }
    ],
    video_hero: {
      heading: "شاهدها أثناء العمل",
      subheading: "شاهد كيف تتعامل زينيا V2 مع أصعب الفوضى بسهولة.",
      cta: "مشاهدة العرض"
    },
    newsletter: {
      heading: "احصل على خصم 10%",
      text: "انضمّ إلى قائمتنا البريدية ليصلك رمز خصم فورًا إلى بريدك."
    }
  }

  // Using a reliable placeholder image
  const mockImages = [
    "https://images.unsplash.com/photo-1558317374-a309d244678e?q=80&w=1000&auto=format&fit=crop", // Hero
    "https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=1000&auto=format&fit=crop", // Problem
    "https://images.unsplash.com/photo-1585773690161-7b1cd0accfcf?q=80&w=1000&auto=format&fit=crop", // Solution
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"  // Visual Showcase
  ]
  const colors = { primary: "#3b82f6", secondary: "#10b981" }

  return (
    <div className="min-h-screen bg-white">
      <ThemePreview 
        name="Zenya V2"
        images={mockImages}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        content={mockContent}
      />
      <ThemeActions 
        themeId="demo-full"
        isPro={true}
        content={mockContent}
        colors={colors}
        name="Zenya V2"
      />
    </div>
  )
}
