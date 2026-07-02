'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles, Globe, Zap, ShieldCheck, Languages, Layers, ArrowRight, Check,
} from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'

const EASE = [0.22, 1, 0.36, 1] as const

/** Honest differentiators — every one is verifiably true of the product. */
const PILLARS = [
  {
    icon: Layers,
    title: 'ثمانية قوالب لكل نشاط',
    desc: 'مطعم، لوك بوك أزياء، صفحة هبوط لتطبيق، قصة علامة تجارية، مركز عافية، خدمات، متجر بمنتجات متعددة، ومتجر بمنتج واحد. قالب لكل نوع نشاط — لا قالب واحد يحاول أن يناسب الجميع.',
    color: '#5e6ad2',
  },
  {
    icon: Zap,
    title: 'من الفكرة إلى موقع خلال دقائق',
    desc: 'اكتب نبذة قصيرة عن نشاطك، ويتكفّل الذكاء الاصطناعي بكتابة المحتوى واختيار التصميم وترتيب الأقسام. لا حاجة لبرمجة، ولا لمصمّم، ولا لأسابيع من الانتظار.',
    color: '#d97706',
  },
  {
    icon: Languages,
    title: 'عربية أولًا، حقيقية',
    desc: 'زينيا مبنية للسوق العربي — محتوى بلغة عربية سليمة، وتخطيط من اليمين إلى اليسار، وخطوط مصمّمة للعربية. ليست ترجمة لاحقة، بل تصميم عربيّ من الأساس.',
    color: '#27a644',
  },
  {
    icon: ShieldCheck,
    title: 'استضافة أوروبية متوافقة مع GDPR',
    desc: 'تُستضاف مواقعك وبياناتك داخل الاتحاد الأوروبي، مع شهادة SSL تلقائية وحماية للخصوصية. أساس موثوق لعلامتك التجارية.',
    color: '#5e6ad2',
  },
]

export default function AboutPage() {
  return (
    <main className="relative">
      <AuroraBackground fixed intensity={0.7} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-28 pt-20">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center"
        >
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,106,210,0.18)] bg-[rgba(94,106,210,0.08)] px-3 py-1 text-[12px] font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            من نحن
          </span>
          <h1 className="text-[40px] font-[590] leading-[1.15] tracking-[-1.4px] text-foreground sm:text-[54px] sm:tracking-[-2px]">
            نُحوّل فكرتك إلى{' '}
            <span className="gradient-text">موقع احترافي.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-[1.9] text-muted">
            زينيا منصّة عربية لإنشاء المواقع بالذكاء الاصطناعي. نؤمن أن كل نشاط تجاري —
            مهما كان صغيرًا — يستحقّ موقعًا يبدو احترافيًا ويكسب ثقة العملاء، دون أن يدفع
            آلاف الدولارات لوكالة أو ينتظر أسابيع.
          </p>
        </motion.div>

        {/* ── Story ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-16 rounded-2xl border border-token bg-white/70 p-7 backdrop-blur sm:p-9"
        >
          <h2 className="text-[24px] font-[590] tracking-[-0.6px] text-foreground">قصتنا</h2>
          <p className="mt-4 text-[15px] leading-[1.95] text-muted">
            بدأت زينيا من ملاحظة بسيطة: أصحاب الأنشطة التجارية الصغيرة في العالم العربي
            أمام خيارَين سيّئَين — إمّا موقع يبدو مبنيًا بالهواة يُبعد العملاء، أو فاتورة
            وكالة باهظة وأسابيع من التعديلات. أردنا خيارًا ثالثًا: مواقع بجودة الوكالات،
            بسرعة الذكاء الاصطناعي، وبسعر في متناول أي نشاط.
          </p>
          <p className="mt-4 text-[15px] leading-[1.95] text-muted">
            اليوم، لم نعد نصنع قالبًا واحدًا. صرنا نصنع <strong className="font-semibold text-foreground">ثمانية
            قوالب</strong> — واحدًا لكل نوع نشاط تجاري — كلٌّ منها مبنيّ حول ما يحتاجه ذلك
            النشاط فعلًا لتحويل الزائر إلى عميل. تكتب نبذة، ويكتب الذكاء الاصطناعي الباقي.
          </p>
        </motion.section>

        {/* ── Pillars ── */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-[24px] font-[590] tracking-[-0.6px] text-foreground">
            ما الذي يميّزنا
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.06, ease: EASE }}
                className="rounded-2xl border border-token bg-white p-6 shadow-soft-sm"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}20`, color: p.color }}
                >
                  <p.icon className="h-5 w-5" strokeWidth={1.9} />
                </div>
                <h3 className="text-[16px] font-[590] text-foreground">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Values / honesty ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-16 rounded-2xl border border-token bg-white/70 p-7 backdrop-blur sm:p-9"
        >
          <h2 className="text-[24px] font-[590] tracking-[-0.6px] text-foreground">مبادئنا</h2>
          <ul className="mt-5 space-y-3.5">
            {[
              'الصدق قبل كل شيء — لا أرقام وهمية ولا تقييمات مُختلَقة. ما نعرضه حقيقي أو لا نعرضه.',
              'الجودة ليست رفاهية — كل قالب مبنيّ ليبدو احترافيًا ويبيع، لا مجرّد صفحة جميلة.',
              'في متناول الجميع — أدوات بمستوى الوكالات، بسعر يقدر عليه أي نشاط تجاري ناشئ.',
              'خصوصيتك ملكك — استضافة وبيانات داخل الاتحاد الأوروبي، وامتثال كامل للـ GDPR.',
            ].map((v) => (
              <li key={v} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#27a644]/12">
                  <Check className="h-3 w-3 text-[#27a644]" strokeWidth={2.5} />
                </span>
                <span className="text-[14.5px] leading-[1.75] text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* ── Who's behind it ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-8 rounded-2xl border border-token bg-white/70 p-7 backdrop-blur sm:p-9"
        >
          <h2 className="text-[24px] font-[590] tracking-[-0.6px] text-foreground">من يقف خلف زينيا</h2>
          <p className="mt-4 text-[15px] leading-[1.95] text-muted">
            زينيا تُشغّلها <strong className="font-semibold text-foreground">Musannef</strong>، مؤسسة فردية
            مسجّلة في هولندا لدى الغرفة التجارية الهولندية (KvK رقم 42070030). هذا يعني بنية أوروبية
            موثوقة لاستضافة مواقعك وحماية بياناتك، مع التزام كامل بلوائح حماية البيانات الأوروبية.
          </p>
        </motion.section>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-16 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center"
        >
          <Link
            href="/login?mode=signup"
            className={cn(
              'group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[14.5px] font-semibold text-white transition-all duration-200',
              'btn-shadow-primary hover:-translate-y-0.5'
            )}
          >
            ابدأ الإنشاء مجانًا
            <ArrowRight className="h-4 w-4 rtl-flip transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          </Link>
          <Link
            href="/themes"
            className="inline-flex items-center gap-2 rounded-lg border border-token bg-white/60 px-7 py-3.5 text-[14.5px] font-medium text-muted backdrop-blur transition-all duration-200 hover:border-[rgba(94,106,210,0.3)] hover:text-foreground"
          >
            شاهد القوالب الثمانية
          </Link>
        </motion.div>

        {/* ── English version (crawlable LTR content) ── */}
        <section dir="ltr" className="mt-24 border-t border-token pt-14 text-left">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,106,210,0.18)] bg-[rgba(94,106,210,0.08)] px-3 py-1 text-[12px] font-medium text-primary">
            <Globe className="h-3.5 w-3.5" strokeWidth={2.25} />
            About Zenya (English)
          </span>
          <h2 className="text-[30px] font-[590] tracking-[-1px] text-foreground">
            We turn your idea into a professional website.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.9] text-muted">
            Zenya is an AI website builder for the Arab market. We believe every
            business — no matter how small — deserves a site that looks
            professional and earns customer trust, without paying thousands to an
            agency or waiting weeks. You write a short brief; our AI writes the
            copy, picks the design, and lays out the sections.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.9] text-muted">
            Instead of one generic template, Zenya ships <strong className="font-semibold text-foreground">eight
            templates</strong> — one per business type: restaurant, fashion
            lookbook, app landing page, brand story, wellness center, services,
            multi-product store, and single-product storefront. Each is built
            around what that business actually needs to convert visitors into
            customers. Content is Arabic-first and right-to-left by design, and
            every site is hosted in the EU with automatic SSL and full GDPR
            compliance.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-[1.9] text-muted">
            Zenya is operated by <strong className="font-semibold text-foreground">Musannef</strong>, a
            Dutch sole proprietorship registered with the Netherlands Chamber of
            Commerce (KvK no. 42070030).
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white btn-shadow-primary transition hover:-translate-y-0.5"
            >
              Start building free
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-token bg-white/60 px-6 py-3 text-[14px] font-medium text-muted backdrop-blur transition hover:text-foreground"
            >
              See pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
