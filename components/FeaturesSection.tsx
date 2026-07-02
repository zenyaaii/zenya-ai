'use client'

import {
  Palette,
  Zap,
  PenTool,
  ShoppingBag,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from '@/components/marketing/Reveal'

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
    desc: 'يُصدِّر قالب المتجر ملف ثيم شوبيفاي كاملًا — أقسام وبلوكات وإعدادات، جاهز للرفع.',
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
        <Reveal className="mb-14 max-w-xl">
          <p className="kicker mb-4">لماذا زينيا</p>
          <h2 className="heading-ar text-[clamp(32px,5vw,50px)] text-foreground">
            كل ما تحتاجه كي{' '}
            <span className="gradient-text">تنطلق بسرعة.</span>
          </h2>
        </Reveal>

        {/* Grid */}
        <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <RevealItem
                key={f.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-token bg-white p-6 ring-hover card-sheen"
                style={{ boxShadow: '0 1px 2px rgba(28,28,28,0.04)' }}
              >
                {/* corner aurora glow on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `${f.color}33` }}
                />
                {/* Icon tile */}
                <div
                  className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${f.color}1f, ${f.color}0a)`,
                    border: `1px solid ${f.color}28`,
                    color: f.color,
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </div>

                <h3 className="relative mb-2 text-[16px] font-bold text-foreground">{f.title}</h3>
                <p className="relative text-[13.5px] leading-[1.7] text-muted">{f.desc}</p>

                {/* Top accent line on hover */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[2px] origin-right scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }}
                />
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
