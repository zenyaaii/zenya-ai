'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { Check, ChevronDown, ArrowRight, Globe, Gift, CheckCircle2, MessageSquareHeart, Sparkles, Copy } from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'
import { affiliateClickHref } from '@/lib/affiliate'
import { createClient } from '@/utils/supabase/client'

type ViewerProfile = {
  plan?: string | null
  is_pro?: boolean | null
  has_hosting?: boolean | null
}

const REVIEW_UNLOCK_KEY = 'zenya:review-code-unlocked'
const REVIEW_PROMO_CODE = process.env.NEXT_PUBLIC_REVIEW_PROMO_CODE || 'SHUKRAN30'
const REVIEW_URL = '/contact?topic=review'

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
    a: 'موقع مباشر على الاسم-المختصر.zenyaai.co لأي قالب عرض (تطبيق، ستوديو، أزياء، عافية، خدمات، مطعم)، ونطاق مخصّص واحد متصل (مثل mystore.com)، وشهادة SSL تلقائية، وتسليم سريع عبر شبكة CDN، وإزالة تذييل «صُنع بزينيا». أما قوالب التجارة الإلكترونية (المتجر والتشكيلة) فلا تُستضاف على زينيا — بل تذهب إلى شوبيفاي.',
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
    a: 'يُصدَّر قالبا التجارة الإلكترونية — المتجر والتشكيلة — كثيمات شوبيفاي جاهزة ويعملان على شوبيفاي (يتولّى شوبيفاي السلة والدفع والمنتجات والمدفوعات). لا تملك متجر شوبيفاي بعد؟ يمكنك بدء تجربة مجانية عبر رابط الإحالة أدناه. أما القوالب الأخرى — تطبيق، ستوديو، أزياء، عافية، خدمات، مطعم — فهي مواقع عرض يمكن لزينيا استضافتها مباشرة على خطة Pro.',
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
  'توليدان مجانيان بالذكاء الاصطناعي (للتجربة)',
  'جميع القوالب الثمانية للمعاينة',
  'معاينة موقعك على zenya.app',
  'تخصيص أساسي',
  'دعم المجتمع',
]

const STARTER_FEATURES = [
  'توليد غير محدود بالذكاء الاصطناعي',
  'جميع القوالب الثمانية الاحترافية',
  'موقع مباشر على اسمك.zenyaai.co — مجاناً',
  'شهادة SSL تلقائية + CDN سريع',
  'ملف ثيم شوبيفاي جاهز (المتجر + التشكيلة)',
  'أولوية في التوليد بالذكاء الاصطناعي',
  'دعم ذو أولوية',
  'وصول مبكر للقوالب الجديدة',
]

const PRO_FEATURES = [
  'كل ما في خطة Starter، بالإضافة إلى:',
  'نطاق مخصّص مجاني لسنة (اختياري) — .store، .site، .online، .shop، …',
  'خصم 30% على النطاقات الأغلى (.com وأمثالها)',
  'إزالة شارة «صُنع بزينيا»',
  'تحليلات الموقع في لوحة تحكمك',
  'عدّل المحتوى في أي وقت عبر أوامر الذكاء الاصطناعي',
  'دعم أولوية قصوى',
]

export default function PricingPage() {
  const searchParams = useSearchParams()
  const rawUpgrade = (searchParams.get('upgrade') || '').toLowerCase()
  const targetUpgrade: 'starter' | 'pro' | null =
    rawUpgrade === 'starter' ? 'starter'
    : rawUpgrade === 'pro' || rawUpgrade === 'hosting' ? 'pro'
    : null

  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<ViewerProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (!cancel) setProfileLoaded(true); return }
      const { data } = await supabase
        .from('profiles')
        .select('plan, is_pro, has_hosting')
        .eq('id', user.id)
        .maybeSingle()
      if (cancel) return
      setProfile((data as ViewerProfile) || null)
      setProfileLoaded(true)
    })()
    try { setReviewed(localStorage.getItem(REVIEW_UNLOCK_KEY) === '1') } catch {}
    return () => { cancel = true }
  }, [supabase])

  const plan = String(profile?.plan || '')
  const onStarter = plan === 'starter'
  const onPro = plan === 'pro' || plan === 'pro_hosting' || plan === 'pro_onetime' || plan === 'admin'
  const showReviewPitch = targetUpgrade === 'pro' && onStarter && !reviewed

  // Once the profile is known, scroll the target card into view. Done in a
  // setTimeout so we're after the initial paint / motion enter.
  useEffect(() => {
    if (!profileLoaded || !targetUpgrade) return
    const id = targetUpgrade === 'starter' ? 'plan-starter' : 'plan-pro'
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
    return () => clearTimeout(t)
  }, [profileLoaded, targetUpgrade])

  const onReviewShared = () => {
    try { localStorage.setItem(REVIEW_UNLOCK_KEY, '1') } catch {}
    setReviewed(true)
  }

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
          {profileLoaded && (onStarter || onPro) && (
            <CurrentPlanBanner
              plan={onPro ? 'pro' : 'starter'}
              wantUpgrade={targetUpgrade === 'pro' && onStarter}
            />
          )}
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
              href="/themes"
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
            id="plan-starter"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl bg-white p-7 scroll-mt-24"
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

            {/* Starter promo — matches Pro's badge pattern, delivered by ReviewOffer */}
            <div
              className="mb-5 flex items-center gap-2 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(94,106,210,0.06)', border: '1px solid rgba(94,106,210,0.20)' }}
            >
              <Gift className="h-3.5 w-3.5 flex-shrink-0 text-primary" strokeWidth={2} />
              <span className="text-[12.5px] font-medium text-primary">
                خصم 20% على أول شهر — احصل على الكود بعد المعاينة
              </span>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {STARTER_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13px] font-medium text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <PlanCTA
              kind="starter"
              plan={plan}
              onStarter={onStarter}
              onPro={onPro}
            />
            <p className="mt-2.5 text-center text-[12px] text-muted">
              ألغِ في أي وقت
            </p>
          </motion.div>

          {/* Pro */}
          <motion.div
            id="plan-pro"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative flex flex-col rounded-xl border bg-white p-7 shadow-soft-sm scroll-mt-24',
              targetUpgrade === 'pro' && !onPro ? 'border-primary/40' : 'border-token'
            )}
            style={
              targetUpgrade === 'pro' && !onPro
                ? { boxShadow: '0 0 0 1px rgba(94,106,210,0.35), 0 8px 24px rgba(94,106,210,0.16)' }
                : undefined
            }
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
              className="mb-5 flex flex-col gap-1 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)' }}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" strokeWidth={2} />
                <span className="text-[12.5px] font-medium text-amber-700">
                  نطاق مجاني لسنة على الامتدادات الاقتصادية
                </span>
              </div>
              <span className="ms-6 text-[11.5px] leading-[1.6] text-amber-700/85">
                يشمل عادةً <span dir="ltr">.store .site .online .shop .xyz .club</span> — الأغلى (مثل .com) تحصل على خصم 30%.
              </span>
            </div>

            {/* Review pitch — only for Starter users clicking upgrade→Pro who
                haven't left a review yet. Marketing-shaped, but the reward is
                the same one Pro already includes (free cheap-TLD domain +
                30% off first month via SHUKRAN30) — nothing fake. */}
            {showReviewPitch && (
              <ReviewPitchCard onShared={onReviewShared} />
            )}

            <ul className="mb-7 flex-1 space-y-3">
              {PRO_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13px] text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <PlanCTA
              kind="pro"
              plan={plan}
              onStarter={onStarter}
              onPro={onPro}
            />
            <p className="mt-2.5 text-center text-[12px] text-muted">
              ألغِ في أي وقت · يبقى الموقع مباشرًا حتى نهاية الشهر
            </p>
          </motion.div>
        </div>

        {/* Discount hacks — honest ways to earn a discount (review → code) */}
        <DiscountHacks />

        {/* Discount-code hint — where to use a promo code (e.g. SHUKRAN30) */}
        <div className="mx-auto mb-14 flex justify-center px-6">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-token bg-white px-4 py-2 text-center text-[13px] text-muted shadow-soft-sm">
            <Gift className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2} />
            عندك كود خصم؟ أدخِله في خانة «Promotion code» عند الدفع.
          </span>
        </div>

        {/* Cost calculator — what you'd pay if you built this yourself */}
        <CostCalculator />


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

/**
 * CostCalculator — itemizes what building a comparable site costs elsewhere:
 * hosting, domain, template, developer, SSL & CDN. Compares the annual total
 * against Zenya's Pro plan for the same year to make the savings concrete.
 * Numbers are conservative market ranges, not fabricated data.
 */
const COST_ROWS = [
  { label: 'استضافة احترافية',            monthly: 15,  yearly: 180, note: 'Vercel Pro / Kinsta / Netlify Business' },
  { label: 'نطاق مخصّص',                   monthly: 1.25, yearly: 15,  note: 'com. / سنويًا حسب الامتداد' },
  { label: 'قالب ووردبريس / Shopify مدفوع', monthly: 0,   yearly: 79,  note: 'دفعة واحدة سنويًا في المتوسط' },
  { label: 'مطوّر أو وكالة (إعداد وتخصيص)',  monthly: 0,   yearly: 800, note: 'حدّ أدنى — الوكالات من 2000$+' },
  { label: 'شهادة SSL + CDN',              monthly: 5,   yearly: 60,  note: 'Cloudflare Pro أو ما يعادلها' },
  { label: 'كتابة المحتوى (نصوص عربية)',    monthly: 0,   yearly: 250, note: 'كاتب مستقل — صفحة رئيسية + 5 صفحات' },
] as const

function CostCalculator() {
  const total = COST_ROWS.reduce((s, r) => s + r.yearly, 0)
  const zenyaYearly = 24.99 * 12
  const savings = total - zenyaYearly
  const savingsPct = Math.round((savings / total) * 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-24 max-w-4xl"
    >
      <div className="mb-8 text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          احسبها بنفسك
        </p>
        <h2 className="text-[34px] font-[590] tracking-[-1px] text-foreground sm:text-[40px] sm:tracking-[-1.4px]">
          كم كنت ستدفع لو بنيته وحدك؟
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-[1.7] text-muted">
          نطاق، واستضافة، وقالب، ومطوّر، وSSL، ومحتوى — إليك ما يكلّفك عادةً موقع
          احترافي في أول سنة، مقارنةً بزينيا Pro.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-token bg-white shadow-soft-sm">
        <table className="w-full min-w-[520px] text-start">
          <thead>
            <tr className="border-b border-token">
              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                البند
              </th>
              <th className="px-5 py-4 text-end text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                التكلفة السنوية
              </th>
            </tr>
          </thead>
          <tbody>
            {COST_ROWS.map((row, i) => (
              <tr key={row.label} className={i < COST_ROWS.length - 1 ? 'border-b border-[#f0ede6]' : ''}>
                <td className="px-5 py-3.5">
                  <div className="text-[13.5px] font-medium text-foreground">{row.label}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{row.note}</div>
                </td>
                <td className="px-5 py-3.5 text-end text-[13.5px] font-[590] text-foreground">
                  <span className="font-latin" dir="ltr">${row.yearly}</span>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-token bg-[rgba(94,106,210,0.03)]">
              <td className="px-5 py-4 text-[14px] font-bold text-foreground">
                الإجمالي في السنة الأولى
              </td>
              <td className="px-5 py-4 text-end text-[16px] font-bold text-foreground">
                <span className="font-latin" dir="ltr">≈ ${total}</span>
              </td>
            </tr>
            <tr className="border-t border-token">
              <td className="px-5 py-4">
                <div className="text-[14px] font-bold text-primary">مع زينيا Pro</div>
                <div className="mt-0.5 text-[12px] text-muted">
                  <span className="font-latin" dir="ltr">$24.99</span> شهريًا · نطاق مجاني لسنة · استضافة كاملة · محتوى AI
                </div>
              </td>
              <td className="px-5 py-4 text-end">
                <div className="text-[16px] font-bold text-primary">
                  <span className="font-latin" dir="ltr">${zenyaYearly.toFixed(2)}</span>
                </div>
                <div className="mt-0.5 text-[12px] font-semibold text-[#27a644]">
                  توفير <span className="font-latin" dir="ltr">${savings.toFixed(0)}</span> ({savingsPct}%)
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-center text-[12px] text-muted">
        الأرقام تقديرية بحسب أسعار السوق للسنة الأولى — تختلف بحسب مزوّد الاستضافة والامتداد.
      </p>
    </motion.div>
  )
}

/**
 * DiscountHacks — honest, actionable ways to earn a discount. Each "hack" is a
 * simple do-X → get-Y%-off card. For now there's one: leave an honest review
 * and get 30% off your first month (the same SHUKRAN30 code Pro/Starter honor
 * at checkout). Built as a list so more hacks can be added later without
 * touching layout. Nothing here is fake — the reward is a real, working code.
 */
const DISCOUNT_HACKS = [
  {
    pct: 30,
    code: REVIEW_PROMO_CODE,
    title: 'قيّم تجربتك معنا',
    desc: 'شاركنا رأيك الصادق عن زينيا — دقيقة واحدة تكفي — واحصل على خصم على أول شهر.',
    href: REVIEW_URL,
    cta: 'قيّمنا الآن',
    icon: MessageSquareHeart,
  },
] as const

function DiscountHacks() {
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800)
    } catch {}
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-16 max-w-4xl"
    >
      <div className="mb-8 text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(217,119,6,0.22)] bg-[rgba(217,119,6,0.08)] px-3 py-1 text-[12px] font-medium text-amber-700">
          <Gift className="h-3.5 w-3.5" strokeWidth={2.25} />
          طرق تحصل بها على خصم
        </span>
        <h2 className="text-[30px] font-[590] tracking-[-1px] text-foreground sm:text-[36px] sm:tracking-[-1.4px]">
          افعل هذا، ووفّر أكثر
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-[1.7] text-muted">
          نكافئ من يساعدنا على التحسّن. كل خطوة بالأسفل تمنحك كودًا حقيقيًا يعمل عند الدفع.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DISCOUNT_HACKS.map((hack) => {
          const Icon = hack.icon
          const isCopied = copied === hack.code
          return (
            <div
              key={hack.code}
              className="flex flex-col rounded-2xl border border-token bg-white p-5 shadow-soft-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(94,106,210,0.10)', color: '#5e6ad2' }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold text-foreground">{hack.title}</div>
                  <div className="text-[12px] font-semibold text-[#15803d]">خصم {hack.pct}% على أول شهر</div>
                </div>
              </div>

              <p className="mb-4 flex-1 text-[13px] leading-[1.7] text-muted">{hack.desc}</p>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={hack.href}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                >
                  {hack.cta}
                  <ArrowRight className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.5} />
                </Link>
                <button
                  type="button"
                  onClick={() => copy(hack.code)}
                  aria-label="نسخ كود الخصم"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-[13px] font-bold transition hover:bg-[rgba(94,106,210,0.04)]"
                  style={{ borderColor: 'rgba(94,106,210,0.5)', color: '#5e6ad2' }}
                >
                  <span dir="ltr" className="font-latin tracking-[0.10em]">{hack.code}</span>
                  {isCopied ? <Check className="h-3.5 w-3.5 text-[#15803d]" strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5 text-muted" strokeWidth={2} />}
                </button>
              </div>
            </div>
          )
        })}

        {/* Teaser: more hacks coming — keeps the grid balanced and hints at future rewards */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-token bg-[rgba(94,106,210,0.02)] p-5 text-center">
          <Sparkles className="mb-2 h-5 w-5 text-primary" strokeWidth={2} />
          <div className="text-[13.5px] font-semibold text-foreground">والمزيد قريبًا</div>
          <p className="mt-1 text-[12px] leading-[1.6] text-muted">
            نضيف طرقًا جديدة للحصول على خصومات باستمرار — تابعنا.
          </p>
        </div>
      </div>
    </motion.section>
  )
}

/**
 * CurrentPlanBanner — reassuring pill under the hero when the logged-in
 * viewer already owns a paid plan. Prevents the "wait, am I on this?"
 * moment when the dashboard's own upgrade CTA lands them here.
 */
function CurrentPlanBanner({
  plan,
  wantUpgrade,
}: {
  plan: 'starter' | 'pro'
  wantUpgrade: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="mx-auto mt-8 inline-flex max-w-md items-center gap-2 rounded-full border px-4 py-2 text-[12.5px]"
      style={{
        background: 'rgba(21,128,61,0.06)',
        borderColor: 'rgba(21,128,61,0.22)',
        color: '#15803d',
      }}
    >
      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
      {plan === 'pro' ? (
        <span className="font-medium">أنت مشترك في Pro — تشمل خطتك كل ما تراه هنا.</span>
      ) : wantUpgrade ? (
        <span className="font-medium">أنت الآن في Starter — إليك ما تضيفه الترقية إلى Pro.</span>
      ) : (
        <span className="font-medium">أنت مشترك في Starter — Pro يضيف الاستضافة والنطاق المجاني.</span>
      )}
    </motion.div>
  )
}

/**
 * PlanCTA — the "Subscribe" button under each paid card, with three states:
 *
 *   - Not signed in / free plan  → normal link to /checkout?plan=X
 *   - Already on this exact plan → disabled "أنت على هذه الخطة" pill
 *   - On a strictly higher plan  → disabled "خطتك تشملها" pill
 *
 * Keeps the two cards visually consistent — otherwise the Starter and Pro
 * buttons would drift apart every time either got tweaked.
 */
function PlanCTA({
  kind,
  plan,
  onStarter,
  onPro,
}: {
  kind: 'starter' | 'pro'
  plan: string
  onStarter: boolean
  onPro: boolean
}) {
  // Highlight = the "primary" state; Starter is highlighted by default
  // (matches the pre-existing design). For Pro we keep it as the softer
  // ghost button unless it's the current upgrade target.
  const primary = kind === 'starter' || onStarter
  const base =
    'group inline-flex w-full items-center justify-center gap-2 rounded-md py-3 text-[14px] font-semibold transition-all duration-150'

  // Gating: you own it, or you own a superset of it.
  if (kind === 'starter' && (onStarter || onPro)) {
    return (
      <div
        className={cn(base, 'cursor-not-allowed border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.06)] text-[#15803d]')}
      >
        <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
        {onPro ? 'خطتك تشمل Starter' : 'أنت على هذه الخطة'}
      </div>
    )
  }
  if (kind === 'pro' && onPro) {
    return (
      <div
        className={cn(base, 'cursor-not-allowed border border-[rgba(21,128,61,0.25)] bg-[rgba(21,128,61,0.06)] text-[#15803d]')}
      >
        <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
        أنت على هذه الخطة
      </div>
    )
  }

  const href = `/checkout?plan=${kind}`
  const label = kind === 'starter' ? 'اشترك في Starter' : (onStarter ? 'الترقية إلى Pro' : 'اشترك في Pro')
  if (primary) {
    return (
      <Link
        href={href}
        className={cn(base, 'bg-primary text-white btn-shadow-primary hover:opacity-90 active:scale-[0.99]')}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5 rtl-flip transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
      </Link>
    )
  }
  return (
    <Link
      href={href}
      className={cn(base, 'border border-token bg-white hover:bg-black/5 active:scale-[0.99]')}
      style={{ borderColor: '#5e6ad2', color: '#5e6ad2' }}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5 rtl-flip transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
    </Link>
  )
}

/**
 * ReviewPitchCard — appears on the Pro card only when a Starter user
 * clicks upgrade→Pro AND hasn't already left a review. Two beats:
 *
 *   1. Pitch: "before you upgrade, share your honest feedback and here's
 *      a 30%-off first-month code as a thank-you (on top of the free
 *      domain year Pro already includes)."
 *   2. After click: reveal SHUKRAN30 with copy-to-clipboard, plus a
 *      "متابعة الترقية" reminder.
 *
 * The review link opens in a new tab so the user's Pro upgrade flow is
 * never interrupted. Same UNLOCK_KEY as ReviewOffer, so if the user
 * already unlocked the code during theme generation, this pitch never
 * appears — no re-asking. This is a persuasion element, not a paywall:
 * skipping straight to Pro still works.
 */
function ReviewPitchCard({ onShared }: { onShared: () => void }) {
  const [unlocked, setUnlocked] = useState(false)
  const [copied, setCopied] = useState(false)

  function share() {
    try { window.open(REVIEW_URL, '_blank', 'noopener,noreferrer') } catch {}
    setUnlocked(true)
    onShared()
    // Persist to the account (best-effort) so the code lives in
    // Settings → "أكواد الخصم" and survives navigation.
    try {
      fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: REVIEW_PROMO_CODE }),
        keepalive: true,
      }).catch(() => {})
    } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(REVIEW_PROMO_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="mb-5 rounded-xl border p-3.5"
      style={{
        background: 'rgba(94,106,210,0.05)',
        borderColor: 'rgba(94,106,210,0.25)',
      }}
    >
      {!unlocked ? (
        <>
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
              style={{ background: 'rgba(94,106,210,0.14)', color: '#5e6ad2' }}
            >
              <MessageSquareHeart className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <span className="text-[12.5px] font-semibold text-primary">
              قبل الترقية — لحظة واحدة من فضلك
            </span>
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.75] text-foreground">
            زينيا مشروع صغير يعمل بجدّ. رأيك الصادق يساعدنا فعلًا على التحسّن.
            <br />
            <span className="font-semibold">شاركنا تجربتك،</span> ونشكرك بـ
            <span className="font-semibold gradient-text"> 30% خصم على أول شهر Pro </span>
            على نطاقك المجاني للسنة الأولى.
          </p>
          <button
            type="button"
            onClick={share}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            شاركنا رأيك (يفتح في تبويب جديد)
          </button>
          <p className="mt-2 text-center text-[11px] text-muted">
            بلا شروط — الكود لك مهما كان رأيك.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#15803d]" strokeWidth={2.5} />
            <span className="text-[12.5px] font-semibold text-[#15803d]">شكرًا لك 💛 هذا كودك:</span>
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label="نسخ كود الخصم"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 transition-colors hover:bg-[rgba(94,106,210,0.04)]"
            style={{ borderColor: 'rgba(94,106,210,0.5)' }}
          >
            <span className="font-latin text-[16px] font-extrabold tracking-[0.12em] text-primary" dir="ltr">
              {REVIEW_PROMO_CODE}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#15803d]" strokeWidth={2.5} />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
            )}
          </button>
          <p className="mt-2 text-center text-[11.5px] text-muted">
            أدخِله في خانة «Promotion code» عند الدفع، ثم اضغط زر الترقية أدناه.
          </p>
        </>
      )}
    </motion.div>
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
