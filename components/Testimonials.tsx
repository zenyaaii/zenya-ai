'use client'

import { Star, Quote } from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from '@/components/marketing/Reveal'

type Testimonial = {
  name: string
  role: string
  text: string
  /** Brand accent for the avatar — matches the relevant business-type tint where possible. */
  color: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'أحمد العلي',
    role: 'علامة بمنتج واحد · الرياض',
    text: "أطلقته في عطلة نهاية أسبوع. تصدير قالب المتجر وصل إلى شوبيفاي نظيفًا — أقسام وبلوكات وإعدادات، كلها موجودة.",
    color: '#5e6ad2',
  },
  {
    name: 'إيلاف منصور',
    role: 'شيف · مطعم لمعة، دبي',
    text: "جعل قالب المطعم قائمتنا أخيرًا تليق بالمكان. ارتفعت الحجوزات في الشهر الأول — دون أي وكالة.",
    color: '#c8a96a',
  },
  {
    name: 'نورة سالم',
    role: 'مؤسِّسة · مستخدمة قالب التطبيق، جدة',
    text: "وفّر علينا قالب التطبيق أسابيع من التطوير. والمحتوى الذي كتبه الذكاء الاصطناعي فهم باقاتنا السعرية فعلًا — وهذا فاجأني.",
    color: '#5e6ad2',
  },
  {
    name: 'مايا خالد',
    role: 'علامة أزياء · عمّان',
    text: "قالب الأزياء مذهل. يسألنا العملاء باستمرار من صمّم موقعنا. استحقّ الاشتراك من أول عملية بيع.",
    color: '#1c1c1c',
  },
  {
    name: 'سارة إبراهيم',
    role: 'مركز عافية · المنامة',
    text: "توقّعت شيئًا بسيطًا، فحصلت على قالب عافية يدير الجلسات والمدرّبين وبطاقات الهدايا جاهزًا. كنا نستقبل الحجوزات خلال يوم.",
    color: '#14b8a6',
  },
  {
    name: 'يوسف حدّاد',
    role: 'خدمات محلية · الدوحة',
    text: "أتقن قالب الخدمات مسار طلب عرض السعر. جرّبت ثلاثة منشئات أخرى قبله — لا شيء يقترب.",
    color: '#f59e0b',
  },
]

export default function Testimonials() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mb-14">
          <p className="kicker mb-4">آراء العملاء</p>
          <h2 className="heading-ar text-[clamp(32px,5vw,50px)] text-foreground">
            موثوق من{' '}
            <span className="gradient-text">أكثر من 2,400 مؤسّس وصاحب عمل.</span>
          </h2>
        </Reveal>

        {/* Cards */}
        <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <RevealItem
              key={t.name}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white p-6 ring-hover card-sheen"
              style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.04)' }}
            >
              {/* watermark quote */}
              <Quote
                aria-hidden
                className="absolute -top-1 left-5 h-12 w-12 rtl-flip opacity-[0.06]"
                style={{ color: t.color }}
                strokeWidth={1.5}
              />
              {/* top accent line on hover */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] origin-right scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ background: `linear-gradient(90deg, ${t.color}, transparent)` }}
              />

              {/* Stars */}
              <div className="relative mb-4 flex gap-0.5">
                {Array(5).fill(0).map((_, si) => (
                  <Star key={si} className="h-3.5 w-3.5" fill="#d97706" stroke="none" />
                ))}
              </div>

              {/* Quote */}
              <p className="relative mb-5 text-[14.5px] leading-[1.8] text-foreground">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="relative mt-auto flex items-center gap-2.5 border-t border-[#f0ede6] pt-4">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)` }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">{t.name}</div>
                  <div className="text-[12px] text-muted">{t.role}</div>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
