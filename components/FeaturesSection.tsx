'use client'

import { motion } from 'framer-motion'
import {
  Palette,
  Zap,
  PenTool,
  ShoppingBag,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  desc: string
  color: string
}

const FEATURES: Feature[] = [
  {
    icon: Palette,
    title: 'تصميم متقن',
    desc: 'طباعة تحريرية، وألوان مدروسة، ومسافات فاخرة — تُطبَّق تلقائيًا على كل قسم.',
    color: '#5e6ad2',
  },
  {
    icon: Zap,
    title: 'جاهز خلال دقائق',
    desc: 'اختر قالبًا ← اكتب نبذتك أو ألصق رابطًا ← يُكتب موقع كامل ويُصمَّم ويُعرَض. أسرع من استراحة قهوة.',
    color: '#d97706',
  },
  {
    icon: PenTool,
    title: 'محتوى بذوق رفيع',
    desc: 'عناوين، وأسئلة شائعة، وقوائم، وشهادات — مكتوبة خصيصًا لنشاطك. بلا عبارات مكرّرة ولا حشو.',
    color: '#27a644',
  },
  {
    icon: ShoppingBag,
    title: 'شوبيفاي عند الحاجة',
    desc: 'يُصدِّر قالب المتجر ملف ثيم شوبيفاي OS 2.0 كاملًا — أقسام وبلوكات وإعدادات، جاهز للرفع.',
    color: '#5e6ad2',
  },
  {
    icon: ShieldCheck,
    title: 'مبني لتحقيق النتائج',
    desc: 'كل قالب يتضمّن أقسام بناء الثقة، والدليل الاجتماعي، ودعوات واضحة لاتخاذ إجراء — بما يحتاجه نوع النشاط فعلًا.',
    color: '#d97706',
  },
  {
    icon: Layers,
    title: '8 قوالب، والمزيد قادم',
    desc: 'مطعم، ولوك بوك، وصفحة هبوط لتطبيق، وقصة علامة، وعافية، وكتالوج، وخدمات، ومتجر شوبيفاي بمنتج واحد. قوالب جديدة شهريًا.',
    color: '#27a644',
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 max-w-xl"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            لماذا زينيا
          </p>
          <h2 className="text-[40px] font-[590] leading-[1.2] tracking-[-1.2px] text-foreground sm:text-[48px] sm:tracking-[-1.6px]">
            كل ما تحتاجه كي{' '}
            <span className="gradient-text">تنطلق بسرعة.</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-px overflow-hidden rounded-xl border border-token md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group relative bg-white p-6 transition-colors duration-150 hover:bg-[#faf8f3]"
              >
                {/* Icon */}
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                  style={{ background: `${f.color}10`, border: `1px solid ${f.color}20`, color: f.color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>

                <h3 className="mb-1.5 text-[14px] font-[590] text-foreground">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-muted">{f.desc}</p>

                {/* Top accent line on hover */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  style={{ background: f.color }}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
