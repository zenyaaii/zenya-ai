'use client'

import {
  Server,
  Globe,
  Wand2,
  BarChart3,
  Languages,
  ShoppingBag,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Reveal, RevealGroup, RevealItem } from '@/components/marketing/Reveal'

/**
 * IncludedSection — "كل ما تحتاجه لتنطلق — مضمّن".
 *
 * A grid of the platform's REAL, shipped capabilities (hosting, custom domain,
 * visual editor, analytics, Arabic RTL, Shopify export, SEO, AI copy). No
 * fabricated numbers or claims — every card maps to something Zenya actually
 * does. Adds professional depth to the home page before the final CTA.
 */

type Feature = { icon: LucideIcon; title: string; desc: string; tint: string }

const FEATURES: Feature[] = [
  {
    icon: Server,
    title: 'استضافة أوروبية سريعة',
    desc: 'موقعك مُستضاف على بنية أوروبية متوافقة مع GDPR — سريع وآمن دون إعداد.',
    tint: '#5e6ad2',
  },
  {
    icon: Globe,
    title: 'نطاق خاص بك',
    desc: 'اربط نطاقك الحالي، أو احصل على نطاق جديد — مع شهرين مجانًا في خطة Pro.',
    tint: '#0ea5e9',
  },
  {
    icon: Wand2,
    title: 'محرّر مرئي بالسحب',
    desc: 'عدّل كل قسم مباشرةً مع تراجع/إعادة وحفظ تلقائي ومعاينة على الجوال.',
    tint: '#a855f7',
  },
  {
    icon: Sparkles,
    title: 'إعادة صياغة بالذكاء الاصطناعي',
    desc: 'لم يعجبك نصّ؟ أعد صياغته بنقرة واحدة داخل المحرّر حتى يناسب صوتك.',
    tint: '#f59e0b',
  },
  {
    icon: BarChart3,
    title: 'تحليلات الزوّار',
    desc: 'تابع زيارات موقعك وأجهزة زوّارك من لوحة تحكّمك — بيانات حقيقية لا تخمين.',
    tint: '#10b981',
  },
  {
    icon: Languages,
    title: 'عربي وRTL أصيل',
    desc: 'كل قالب مبنيّ عربيًا من الأساس — اتجاه صحيح، وخطوط، ونصوص تبدو أصيلة.',
    tint: '#c8a96a',
  },
  {
    icon: ShoppingBag,
    title: 'تصدير ثيم شوبيفاي',
    desc: 'قالب المنتج الواحد يُصدَّر كملف ثيم شوبيفاي جاهز للتثبيت في متجرك.',
    tint: '#95bf47',
  },
  {
    icon: Search,
    title: 'تهيئة لمحرّكات البحث',
    desc: 'عناوين ووصف ووسوم تُولَّد تلقائيًا لكل صفحة كي يجدك عملاؤك على جوجل.',
    tint: '#ef4444',
  },
]

export default function IncludedSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-primary">مضمّن مع كل موقع</p>
          <h2 className="display-ar text-[clamp(30px,5vw,52px)] leading-[1.12] text-foreground">
            كل ما تحتاجه لتنطلق — <span className="gradient-text">مضمّن.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-8 text-muted">
            لا إضافات مبعثرة ولا فواتير مفاجئة. من الاستضافة إلى النطاق إلى المحرّر — كل شيء في مكان واحد.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <RevealItem key={f.title}>
                <article className="group h-full rounded-2xl border border-token bg-surface/70 p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(28,28,28,0.28)]">
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.08]"
                    style={{ background: `${f.tint}12`, border: `1px solid ${f.tint}26`, color: f.tint }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-muted">{f.desc}</p>
                </article>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
