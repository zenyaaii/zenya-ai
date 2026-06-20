import ThemePreview from '@/components/ThemePreview'
import ThemeActions from '@/components/ThemeActions'
import { Suspense } from 'react'

export default function DemoPage() {
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
    }
  }

  // Using a placeholder image that looks like a product
  const mockImage = "https://images.unsplash.com/photo-1558317374-a354d5f6d40b?q=80&w=1000&auto=format&fit=crop"
  const colors = { primary: "#3b82f6", secondary: "#10b981" }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Header with Paywall Actions */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="font-bold text-xl">عرض قالب زينيا التوضيحي</div>
          <div className="hidden md:block">
            <Suspense fallback={<div>جارٍ التحميل…</div>}>
              <ThemeActions 
                themeId="demo-theme-id" 
                isPro={false} // Force locked state for demo
                content={mockContent}
                colors={colors}
                name="Zenya V2"
              />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Main Theme Preview */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <ThemePreview 
          name="Zenya V2"
          images={[mockImage, mockImage]}
          primaryColor={colors.primary}
          secondaryColor={colors.secondary}
          content={mockContent}
        />
      </div>

      {/* Mobile Sticky Paywall Actions */}
      <div className="md:hidden">
        <Suspense fallback={<div>جارٍ التحميل…</div>}>
          <ThemeActions 
            themeId="demo-theme-id" 
            isPro={false} // Force locked state for demo
            content={mockContent}
            colors={colors}
            name="Zenya V2"
          />
        </Suspense>
      </div>
    </div>
  )
}
