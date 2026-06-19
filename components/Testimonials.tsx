'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            آراء العملاء
          </p>
          <h2 className="text-[40px] font-[590] leading-[1.2] tracking-[-1.2px] text-foreground sm:text-[48px] sm:tracking-[-1.6px]">
            موثوق من{' '}
            <span className="gradient-text">أكثر من 2,400 مؤسّس وصاحب عمل.</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-24px' }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group rounded-xl border border-token bg-white p-5 transition-colors duration-150',
                'hover:bg-[#faf8f3]'
              )}
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array(5).fill(0).map((_, si) => (
                  <Star key={si} className="h-3.5 w-3.5" fill="#d97706" stroke="none" />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-5 text-[14px] leading-[1.65] text-foreground">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2.5 border-t border-[#f0ede6] pt-4">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: t.color }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-[590] text-foreground">{t.name}</div>
                  <div className="text-[12px] text-muted">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
