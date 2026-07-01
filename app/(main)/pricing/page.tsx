'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { Check, ChevronDown, ArrowRight, Globe } from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'
import { affiliateClickHref } from '@/lib/affiliate'

const FAQS = [
  {
    q: 'ما الفرق بين خطة Starter وخطة Pro؟',
    a: 'تفتح خطة Starter (14.99$ شهريًا) توليدًا وتصديرًا غير محدودين بالذكاء الاصطناعي — لقالبَي التجارة الإلكترونية (المتجر والتشكيلة) تربطهما أو ترفعهما إلى متجر شوبيفاي؛ أما القوالب الأخرى فتنزّل ملف المشروع المضغوط وتستضيفه أينما شئت. وتضيف خطة Pro (24.99$ شهريًا) استضافة زينيا الكاملة لقوالب العرض (رابط مباشر، ونطاق مخصّص، وبلا شارة زينيا) إلى جانب كل ما في خطة Starter.',
  },
  {
    q: 'هل يمكنني إلغاء اشتراكي؟',
    a: 'نعم، في أي وقت من لوحة التحكم. يبقى اشتراكك فعّالًا حتى نهاية الفترة المدفوعة الحالية، ثم يتوقف التجديد. تبقى القوالب والتصديرات التي أنشأتها محفوظة في حسابك.',
  },
  {
    q: 'ماذا تشمل استضافة زينيا؟',
    a: 'موقع مباشر على zenya.app/s/الاسم-المختصر لأي قالب عرض (تطبيق، ستوديو، أزياء، عافية، خدمات، مطعم)، ونطاق مخصّص واحد متصل (مثل mystore.com)، وشهادة SSL تلقائية، وتسليم سريع عبر شبكة CDN، وإزالة تذييل «صُنع بزينيا». أما قوالب التجارة الإلكترونية (المتجر والتشكيلة) فلا تُستضاف على زينيا — بل تذهب إلى شوبيفاي.',
  },
  {
    q: 'هل يمكنني الترقية أو التراجع بين الخطتين؟',
    a: 'نعم. الترقية من Starter إلى Pro تبدأ فورًا من لوحة التحكم. للتراجع من Pro إلى Starter، ألغِ اشتراك Pro وابدأ اشتراك Starter — تبقى مواقعك المستضافة تعمل حتى نهاية الفترة المدفوعة الحالية.',
  },
  {
    q: 'هل لديكم سياسة استرداد؟',
    a: 'لا يوجد استرداد تلقائي على الفترة الحالية، لكن يمكنك إلغاء اشتراكك في أي وقت قبل موعد التجديد لتفادي رسوم الشهر التالي. لأي مشكلة في الفوترة، تواصل معنا وسنساعدك.',
  },
  {
    q: 'أي القوالب يعمل وأين؟',
    a: 'يُصدَّر قالبا التجارة الإلكترونية — المتجر والتشكيلة — كثيمات شوبيفاي OS 2.0 ويعملان على شوبيفاي (يتولّى شوبيفاي السلة والدفع والمنتجات والمدفوعات). لا تملك متجر شوبيفاي بعد؟ يمكنك بدء تجربة مجانية عبر رابط الإحالة أدناه. أما القوالب الأخرى — تطبيق، ستوديو، أزياء، عافية، خدمات، مطعم — فهي مواقع عرض يمكن لزينيا استضافتها مباشرة على خطة Pro.',
  },
] as const

const COMPARE = [
  { feature: 'السعر',              zenya: '14.99$ / 24.99$ شهريًا',    other: '+29$ شهريًا', agency: '+2,000$' },
  { feature: 'وقت الإعداد',        zenya: 'أقل من 60 ثانية',           other: 'دقائق',       agency: 'أسابيع' },
  { feature: 'القوالب',            zenya: '8 قوالب',                   other: '1–2',         agency: 'مخصّص' },
  { feature: 'الاستضافة مشمولة',   zenya: 'في خطة Pro',                other: 'في معظمها',   agency: 'تتولّاها بنفسك' },
  { feature: 'نطاق مخصّص',         zenya: 'في خطة Pro',                other: 'في معظمها',   agency: 'نعم' },
  { feature: 'تصدير شوبيفاي',      zenya: 'في الخطتين المدفوعتين',     other: 'نادر',        agency: 'مخصّص' },
  { feature: 'الارتباط بالمنصّة',  zenya: 'لا يوجد',                   other: 'مرتفع',       agency: 'لا يوجد' },
] as const

const FREE_FEATURES = [
  'توليد واحد بالذكاء الاصطناعي (للتجربة)',
  'جميع القوالب الثمانية للمعاينة',
  'معاينة موقعك على zenya.app',
  'تخصيص أساسي',
  'دعم المجتمع',
]

const STARTER_FEATURES = [
  'توليد غير محدود بالذكاء الاصطناعي',
  'جميع القوالب الثمانية الاحترافية',
  'ملف شوبيفاي OS 2.0 (المتجر + التشكيلة)',
  'ملف تصدير ثابت (القوالب الأخرى)',
  'أولوية في التوليد بالذكاء الاصطناعي',
  'دعم ذو أولوية',
  'وصول مبكر للقوالب الجديدة',
]

const PRO_FEATURES = [
  'كل ما في خطة Starter، بالإضافة إلى:',
  'تستضيف زينيا مواقع العرض الخاصة بك',
  'نطاق مخصّص مجاني لمدة 5 أشهر',
  'شهادة SSL تلقائية + تسليم عبر CDN',
  'إزالة شارة «صُنع بزينيا»',
  'تحليلات الموقع في لوحة تحكمك',
  'عدّل المحتوى في أي وقت عبر أوامر الذكاء الاصطناعي',
]

export default function PricingPage() {
  return (
    <main className="relative">
      <AuroraBackground fixed intensity={0.7} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,106,210,0.18)] bg-[rgba(94,106,210,0.08)] px-3 py-1 text-[12px] font-medium text-primary">
            أسعار بسيطة وشفّافة
          </span>
          <h1 className="text-[46px] font-[590] leading-[1.15] tracking-[-1.6px] text-foreground sm:text-[58px] sm:tracking-[-2px]">
            ابدأ مجانًا.{' '}
            <span className="gradient-text">وتوسّع عند الجاهزية.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-[1.85] text-muted">
            منشئ واحد بالذكاء الاصطناعي، وخطتان مدفوعتان. مجاني للتجربة. اشترك شهريًا في Starter أو Pro، وألغِ في أي وقت.
          </p>
        </motion.div>

        {/* Pricing cards — three plans */}
        <div className="mx-auto mb-24 grid max-w-5xl gap-5 md:grid-cols-3">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl border border-token bg-white p-7 shadow-soft-sm"
          >
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                مجاني
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[42px] font-[590] leading-none tracking-[-1.4px] text-foreground">$0</span>
                <span className="text-[15px] text-muted">/للأبد</span>
              </div>
              <p className="text-[13.5px] text-muted">جرّب زينيا. شاهد ما يبنيه الذكاء الاصطناعي.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {FREE_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5f5f5d" />
                  <span className="text-[13px] text-muted">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login?mode=signup"
              className={cn(
                'block w-full rounded-md border border-token bg-background py-3 text-center text-[14px] font-medium text-muted transition-all duration-150',
                'hover:bg-black/5 active:scale-[0.99]'
              )}
            >
              ابدأ مجانًا
            </Link>
          </motion.div>

          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl bg-white p-7"
            style={{
              border: '1px solid #5e6ad2',
              boxShadow: '0 0 0 1px #5e6ad2, 0 8px 24px rgba(94,106,210,0.16)',
            }}
          >
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
              style={{
                boxShadow:
                  'rgba(255,255,255,0.20) 0px 0.5px 0px inset, rgba(94,106,210,0.50) 0px 0px 0px 0.5px inset',
              }}
            >
              الأكثر شيوعًا
            </div>

            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Starter
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[42px] font-[590] leading-none tracking-[-1.4px] gradient-text">
                  $14.99
                </span>
                <span className="text-[15px] text-muted">/شهريًا</span>
              </div>
              <p className="text-[13.5px] text-muted">منشئ كامل بلا حدود، شهريًا. صدّر أينما شئت.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {STARTER_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13px] font-medium text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout?plan=starter"
              className={cn(
                'group inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-[14px] font-semibold text-white transition-all duration-150',
                'btn-shadow-primary hover:opacity-90 active:scale-[0.99]'
              )}
            >
              اشترك في Starter
              <ArrowRight className="h-3.5 w-3.5 rtl-flip transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <p className="mt-2.5 text-center text-[12px] text-muted">
              ألغِ في أي وقت
            </p>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl border border-token bg-white p-7 shadow-soft-sm"
          >
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Pro
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[42px] font-[590] leading-none tracking-[-1.4px] text-foreground">$24.99</span>
                <span className="text-[15px] text-muted">/شهريًا</span>
              </div>
              <p className="text-[13.5px] text-muted">نحن نستضيف. أنت توجّه نطاقك. وانتهى الأمر.</p>
            </div>

            {/* Free domain offer badge */}
            <div
              className="mb-5 flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)' }}
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" strokeWidth={2} />
              <span className="text-[12.5px] font-medium text-amber-700">
                نطاق مخصّص مجاني 5 أشهر، ثم بسعرنا المخفّض
              </span>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {PRO_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13px] text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout?plan=pro"
              className={cn(
                'group inline-flex w-full items-center justify-center gap-2 rounded-md border border-token bg-white py-3 text-[14px] font-semibold text-foreground transition-all duration-150',
                'hover:bg-black/5 active:scale-[0.99]'
              )}
              style={{ borderColor: '#5e6ad2', color: '#5e6ad2' }}
            >
              اشترك في Pro
              <ArrowRight className="h-3.5 w-3.5 rtl-flip transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <p className="mt-2.5 text-center text-[12px] text-muted">
              ألغِ في أي وقت · يبقى الموقع مباشرًا حتى نهاية الشهر
            </p>
          </motion.div>
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-24 max-w-4xl"
        >
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              قارِن
            </p>
            <h2 className="text-[34px] font-[590] tracking-[-1px] text-foreground sm:text-[40px] sm:tracking-[-1.4px]">
              لماذا زينيا؟
            </h2>
            <p className="mt-2 text-[15px] text-muted">
              كيف نتفوّق على منشئات الذكاء الاصطناعي العامة والوكالات التقليدية.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-token bg-white shadow-soft-sm">
            <table className="w-full min-w-[520px] text-start">
              <thead>
                <tr className="border-b border-token">
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                    الميزة
                  </th>
                  <th
                    className="px-5 py-4 text-center text-[13px] font-[590] text-primary"
                    style={{ background: 'rgba(94,106,210,0.04)' }}
                  >
                    زينيا
                  </th>
                  <th className="px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                    ذكاء اصطناعي آخر
                  </th>
                  <th className="px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                    وكالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i < COMPARE.length - 1 ? 'border-b border-[#f0ede6]' : ''}
                  >
                    <td className="px-5 py-3.5 text-[13.5px] font-medium text-foreground">{row.feature}</td>
                    <td
                      className="px-5 py-3.5 text-center text-[13.5px] font-[590] text-primary"
                      style={{ background: 'rgba(94,106,210,0.03)' }}
                    >
                      {row.zenya}
                    </td>
                    <td className="px-5 py-3.5 text-center text-[13.5px] text-muted">{row.other}</td>
                    <td className="px-5 py-3.5 text-center text-[13.5px] text-muted">{row.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              الأسئلة الشائعة
            </p>
            <h2 className="text-[34px] font-[590] tracking-[-1px] text-foreground sm:text-[40px] sm:tracking-[-1.4px]">
              أسئلة شائعة
            </h2>
          </div>

          <Accordion.Root type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <Accordion.Item
                key={i}
                value={`q-${i}`}
                className={cn(
                  'group overflow-hidden rounded-xl border border-token bg-white transition-all duration-150',
                  'data-[state=open]:border-[rgba(94,106,210,0.30)] data-[state=open]:bg-[rgba(94,106,210,0.04)]'
                )}
              >
                <Accordion.Header className="flex">
                  <Accordion.Trigger
                    className={cn(
                      'flex w-full items-center justify-between px-5 py-4 text-start outline-none',
                      'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2'
                    )}
                  >
                    <span className="pe-4 text-[14px] font-[510] text-foreground">{faq.q}</span>
                    <ChevronDown
                      className="h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
                      strokeWidth={2}
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content
                  className={cn(
                    'overflow-hidden text-[13.5px] leading-[1.7] text-muted',
                    'data-[state=open]:animate-[radix-acc-open_220ms_cubic-bezier(0.22,1,0.36,1)]',
                    'data-[state=closed]:animate-[radix-acc-close_180ms_cubic-bezier(0.22,1,0.36,1)]'
                  )}
                >
                  <div className="px-5 pb-5">{faq.a}</div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>

        {/* Shopify affiliate footer — sits below the FAQ as the natural
            "I just decided I want Storefront / Collective — what do I do
            about Shopify?" exit point. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="rounded-xl border border-token bg-white px-5 py-4 text-center">
            <p className="text-[13.5px] text-foreground">
              تبني موقع متجر أو تشكيلة ولا تملك شوبيفاي بعد؟{' '}
              <a
                href={affiliateClickHref('pricing_faq')}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="font-semibold text-[#008060] underline underline-offset-2 hover:opacity-80"
              >
                ابدأ تجربة شوبيفاي المجانية ←
              </a>
            </p>
            <p className="mt-1 text-[11px] text-muted">
              رابط إحالة — تحصل زينيا على عمولة صغيرة دون أي تكلفة إضافية عليك.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

function CheckChip({ color }: { color: string }) {
  return (
    <div
      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
      style={{ background: `${color}12`, border: `1px solid ${color}20` }}
    >
      <Check className="h-3 w-3" strokeWidth={2.5} style={{ color }} />
    </div>
  )
}
