import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateContentSchema } from '@/utils/validators'
import { logAiUsage, getUserIdSafe } from '@/lib/ai-usage'
import { ARABIC_OUTPUT_DIRECTIVE } from '@/lib/ai-locale'
import { AI_MODEL, AI_MAX_TOKENS } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ROUTE_BUDGET_MS = 70_000
const ANALYSIS_TIMEOUT_MS = 18_000
const CONTENT_TIMEOUT_MS = 32_000
const REPAIR_TIMEOUT_MS = 12_000

function timeoutError(label: string, ms: number) {
  return new Error(`${label}_timeout_${ms}ms`)
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(timeoutError(label, ms)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const timeLeft = () => ROUTE_BUDGET_MS - (Date.now() - startedAt)
  const body = await req.json()
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const name = parsed.data.name
  const description = parsed.data.description || ''
  const audience = parsed.data.audience || 'dropshippers and one-product store buyers'
  const productUrl = parsed.data.productUrl || ''
  const price = parsed.data.price
  const originalPrice = parsed.data.originalPrice
  const productFacts = parsed.data.productFacts

  const getMockContent = (productName: string) => ({
    hero: {
      headline: `${productName} الأفضل على الإطلاق`,
      subheadline: "اختبر الكمال في كل تفصيلة مع أحدث تصميم في السوق.",
      cta: "احصل على خصم 50% اليوم"
    },
    slideshow: [
      { heading: `مرحبًا بك في مستقبل ${productName}`, subheading: "اكتشف الابتكار الذي يتحدث عنه الجميع.", cta: "تسوّق التشكيلة" },
      { heading: "مصمَّم للتميّز", subheading: "جودة تصمد أمام اختبار الزمن.", cta: "اعرف المزيد" }
    ],
    video_hero: {
      heading: "تميّز سينمائي",
      subheading: "انغمس في القصة وراء العلامة.",
      cta: "شاهد الفيلم"
    },
    features: [
      { title: "خامات صديقة للبيئة", desc: "مصنوعة من مواد مستدامة 100% مصمَّمة لتدوم مدى الحياة.", icon: "leaf" },
      { title: "تصميم مريح", desc: "صُمّم على يد خبراء ليناسب حياتك تمامًا، مع أقصى قدر من الراحة والفائدة.", icon: "design" },
      { title: "إعداد فوري", desc: "جاهز للاستخدام فور إخراجه من العلبة. بلا أدلة معقّدة أو أدوات.", icon: "bolt" }
    ],
    problem: {
      headline: "سئمت من البدائل الرخيصة التي تتعطّل؟",
      text: "معظم المنتجات في السوق مصمَّمة لتتقادم سريعًا. تبدو جيدة لكنها تخذلك حين تحتاجها أكثر، فتترك لك الإحباط وخسارة المال."
    },
    solution: {
      headline: `تعرّف على ${productName}`,
      text: "صمّمناه من الصفر لحلّ كل نقطة ألم. متين وأنيق وفعّال بشكل مذهل — إنه آخر ما ستحتاج لشرائه."
    },
    testimonials: [
      { name: "سارة المطيري", text: "غيّر روتيني اليومي بالكامل. أنصح به بشدة!", location: "الرياض، السعودية", rating: 5 },
      { name: "محمد العتيبي", text: "أفضل استثمار قمت به هذا العام. جودة لا تُضاهى.", location: "دبي، الإمارات", rating: 5 },
      { name: "ليلى حسن", text: "شحن سريع وخدمة عملاء رائعة. 10/10.", location: "القاهرة، مصر", rating: 5 }
    ],
    faq: [
      { q: "هل هو مناسب للمبتدئين؟", a: "بالتأكيد! مصمَّم لجميع المستويات." },
      { q: "كيف أنظّفه؟", a: "امسحه بقطعة قماش مبلّلة بعد الاستخدام." },
      { q: "ما مدة الضمان؟", a: "نقدّم ضمانًا شاملًا لمدة 5 سنوات." },
      { q: "هل تشحنون دوليًا؟", a: "نعم، نشحن إلى أكثر من 50 دولة حول العالم." }
    ],
    guarantee: {
      title: "ضمان 30 يومًا بلا قلق",
      text: "جرّبه دون مخاطرة. إن لم تكن مبهورًا تمامًا، فأعِده واسترد كامل المبلغ. دون أي أسئلة.",
      days: 30
    },
    rich_text: {
      title: "رسالتنا",
      text: "نؤمن بصناعة منتجات تحلّ المشكلات فعلًا، لا مجرد إضافة فوضى إلى حياتك."
    },
    image_text: {
      title: "مصمَّم للحياة الواقعية",
      text: "أمضينا عامين في التجارب لنضمن أن كل منحنى وحافة يخدم غرضًا.",
      cta: "اقرأ قصتنا"
    },
    newsletter: {
      title: "انضمّ إلى الدائرة المقرّبة",
      text: "احصل على وصول حصري للإصدارات الجديدة والعروض السرية."
    },
    timeline: [
      { year: "2020", title: "الفكرة", text: "بدأت برسم بسيط على ورقة." },
      { year: "2021", title: "النماذج الأولية", text: "اختبرنا أكثر من 50 نسخة حتى أتقنّاه." },
      { year: "2023", title: "الإطلاق", text: "شاركنا إبداعنا مع العالم." }
    ],
    scrolling_text: [
      "شحن مجاني حول العالم", "ضمان استرداد المال خلال 30 يومًا", "أكثر من 10,000 عميل سعيد", "تقييم 5 نجوم"
    ],
    comparison: [
      { feature: "خامات فاخرة", us: true, them: false },
      { feature: "دعم على مدار الساعة", us: true, them: false },
      { feature: "ضمان مدى الحياة", us: true, them: false },
      { feature: "صديق للبيئة", us: true, them: false }
    ],
    multicolumn: [
      { title: "شحن سريع", text: "نشحن خلال 24 ساعة من طلبك." },
      { title: "دفع آمن", text: "بياناتك محمية بتشفير 256-بت." },
      { title: "دعم خبير", text: "فريقنا هنا لمساعدتك على مدار الساعة." }
    ],
    contact: {
      heading: "تواصل معنا",
      subheading: "يسعدنا سماع رأيك. فريقنا دائمًا هنا للمساعدة."
    },
    upsell: { heading: "يُشترى عادةً معًا" },
    volume_bundles: {
      heading: "اشترِ أكثر ووفّر",
      label_buy_1: "اشترِ 1 (عادي)",
      label_buy_2: "اشترِ 2 (وفّر 15%)",
      label_buy_3: "اشترِ 3 (وفّر 25%)"
    },
    countdown: { heading: "عرض لوقت محدود", timer_text: "ينتهي العرض خلال:" },
    logo_list: { heading: "ظهرنا في" },
    before_after: { heading: "نتائج حقيقية", label_before: "قبل", label_after: "بعد" },
    stats: [
      { value: "10,000+", label: "عميل سعيد" },
      { value: "4.9/5", label: "متوسط التقييم" },
      { value: "24/7", label: "الدعم" }
    ],
    visual_showcase: { heading: "اختبر الفرق", subheading: "شاهد كل تفصيلة عن قرب." },
    how_it_works: [
      { title: "اطلب عبر الإنترنت", text: "اختر خياراتك المفضّلة وأكمل طلبك بأمان." },
      { title: "نشحن بسرعة", text: "تغادر شحنتك مستودعنا خلال 24 ساعة." },
      { title: "استمتع!", text: "اختبر الجودة والفرق بنفسك." }
    ],
    trust_badges: { heading: "تسوّق بثقة" },
    accordion: [
      { title: "المواصفات", content: "خامات عالية الجودة مصمَّمة لتدوم." },
      { title: "معلومات الشحن", content: "شحن مجاني حول العالم لجميع الطلبات." },
      { title: "تعليمات العناية", content: "نظّفه بمسحة قماش مبلّلة." }
    ],
    tabs: [
      { title: "الوصف", content: "الحل الأمثل لاحتياجاتك." },
      { title: "الشحن", content: "نشحن حول العالم مع خدمة التتبّع." },
      { title: "الإرجاع", content: "ضمان استرداد المال خلال 30 يومًا." }
    ]
  })

  function asString(v: any, fallback = '') {
    return typeof v === 'string' ? v : fallback
  }

  function asNumber(v: any, fallback: number) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(n)))
  }

  function parseModelJson(text: string) {
    let t = typeof text === 'string' ? text.trim() : ''
    if (!t) throw new Error('Empty JSON from model')
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()

    const start = t.indexOf('{')
    const end = t.lastIndexOf('}')
    if (start >= 0 && end >= 0) t = t.slice(start, end + 1)

    try {
      return JSON.parse(t)
    } catch {
      const repaired = t.replace(/,\s*([}\]])/g, '$1')
      return JSON.parse(repaired)
    }
  }

  function limitStringLengths(value: any, maxLen: number): any {
    if (typeof value === 'string') return value.length > maxLen ? value.slice(0, maxLen) : value
    if (Array.isArray(value)) return value.map((v) => limitStringLengths(v, maxLen))
    if (!value || typeof value !== 'object') return value
    const out: any = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = limitStringLengths(v, maxLen)
    }
    return out
  }

  function deepMerge(base: any, incoming: any): any {
    if (Array.isArray(base)) {
      return Array.isArray(incoming) && incoming.length ? incoming : base
    }
    if (base && typeof base === 'object') {
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base
      const out: any = { ...base }
      for (const [k, v] of Object.entries(incoming)) {
        if (v === undefined || v === null) continue
        out[k] = k in base ? deepMerge((base as any)[k], v) : v
      }
      return out
    }
    return incoming === undefined || incoming === null ? base : incoming
  }

  function normalizeGeneratedContent(productName: string, generated: any, analysis: any) {
    const base = getMockContent(productName) as any
    const merged = deepMerge(base, generated || {}) as any

    merged._strategy = merged._strategy && typeof merged._strategy === 'object' ? merged._strategy : {}
    merged._strategy.target_avatar = asString(merged._strategy.target_avatar, asString(analysis?.ideal_customer, ''))
    merged._strategy.core_pain_point = asString(merged._strategy.core_pain_point, asString((analysis?.top_pains || [])[0], ''))
    merged._strategy.unique_mechanism = asString(merged._strategy.unique_mechanism, asString(analysis?.unique_mechanism, ''))
    merged._strategy.competitor_weakness = asString(
      merged._strategy.competitor_weakness,
      asString((analysis?.primary_objections || [])[0], '')
    )

    merged.hero = merged.hero && typeof merged.hero === 'object' ? merged.hero : {}
    merged.hero.headline = asString(merged.hero.headline, base.hero.headline)
    merged.hero.subheadline = asString(merged.hero.subheadline, base.hero.subheadline)
    merged.hero.cta = asString(merged.hero.cta, base.hero.cta)

    const normalizeCards = (arr: any[], minLen: number, fallbackArr: any[], mapper: (v: any, i: number) => any) => {
      const a = Array.isArray(arr) ? arr : []
      const out = a.map(mapper).filter(Boolean)
      if (out.length >= minLen) return out.slice(0, minLen)
      const fill = (Array.isArray(fallbackArr) ? fallbackArr : []).map(mapper).filter(Boolean)
      return [...out, ...fill].slice(0, minLen)
    }

    merged.slideshow = normalizeCards(
      merged.slideshow,
      2,
      base.slideshow,
      (v: any, i: number) => ({
        heading: asString(v?.heading, base.slideshow[i]?.heading || ''),
        subheading: asString(v?.subheading, base.slideshow[i]?.subheading || ''),
        cta: asString(v?.cta, base.slideshow[i]?.cta || ''),
      })
    )

    merged.video_hero = merged.video_hero && typeof merged.video_hero === 'object' ? merged.video_hero : {}
    merged.video_hero.heading = asString(merged.video_hero.heading, base.video_hero.heading)
    merged.video_hero.subheading = asString(merged.video_hero.subheading, base.video_hero.subheading)
    merged.video_hero.cta = asString(merged.video_hero.cta, base.video_hero.cta)

    merged.features = normalizeCards(
      merged.features,
      3,
      base.features,
      (v: any, i: number) => ({
        title: asString(v?.title, base.features[i]?.title || ''),
        desc: asString(v?.desc, base.features[i]?.desc || ''),
        icon: asString(v?.icon, base.features[i]?.icon || 'shield'),
      })
    )

    merged.problem = merged.problem && typeof merged.problem === 'object' ? merged.problem : {}
    merged.problem.headline = asString(merged.problem.headline, base.problem.headline)
    merged.problem.text = asString(merged.problem.text, base.problem.text)

    merged.solution = merged.solution && typeof merged.solution === 'object' ? merged.solution : {}
    merged.solution.headline = asString(merged.solution.headline, base.solution.headline)
    merged.solution.text = asString(merged.solution.text, base.solution.text)

    merged.testimonials = normalizeCards(
      merged.testimonials,
      3,
      base.testimonials,
      (v: any, i: number) => {
        const name = asString(v?.name, base.testimonials[i]?.name || 'Verified Buyer')
        const text = asString(v?.text, base.testimonials[i]?.text || '')
        const location = asString(v?.location, base.testimonials[i]?.location || 'Verified Buyer')
        const rating = clampInt(asNumber(v?.rating, 5), 1, 5)
        return { name, text, location, rating }
      }
    )

    merged.faq = normalizeCards(
      merged.faq,
      4,
      base.faq,
      (v: any, i: number) => ({
        q: asString(v?.q, base.faq[i]?.q || ''),
        a: asString(v?.a, base.faq[i]?.a || ''),
      })
    )

    merged.guarantee = merged.guarantee && typeof merged.guarantee === 'object' ? merged.guarantee : {}
    merged.guarantee.title = asString(merged.guarantee.title, base.guarantee.title)
    merged.guarantee.text = asString(merged.guarantee.text, base.guarantee.text)
    merged.guarantee.days = clampInt(asNumber(merged.guarantee.days, base.guarantee.days), 7, 90)

    merged.rich_text = merged.rich_text && typeof merged.rich_text === 'object' ? merged.rich_text : {}
    merged.rich_text.title = asString(merged.rich_text.title, base.rich_text.title)
    merged.rich_text.text = asString(merged.rich_text.text, base.rich_text.text)

    merged.image_text = merged.image_text && typeof merged.image_text === 'object' ? merged.image_text : {}
    merged.image_text.title = asString(merged.image_text.title, base.image_text.title)
    merged.image_text.text = asString(merged.image_text.text, base.image_text.text)
    merged.image_text.cta = asString(merged.image_text.cta, base.image_text.cta)

    merged.newsletter = merged.newsletter && typeof merged.newsletter === 'object' ? merged.newsletter : {}
    merged.newsletter.title = asString(merged.newsletter.title, base.newsletter.title)
    merged.newsletter.text = asString(merged.newsletter.text, base.newsletter.text)

    merged.timeline = normalizeCards(
      merged.timeline,
      3,
      base.timeline,
      (v: any, i: number) => ({
        year: asString(v?.year, base.timeline[i]?.year || ''),
        title: asString(v?.title, base.timeline[i]?.title || ''),
        text: asString(v?.text, base.timeline[i]?.text || ''),
      })
    )

    merged.scrolling_text = normalizeCards(
      merged.scrolling_text,
      4,
      base.scrolling_text,
      (v: any, i: number) => asString(v, base.scrolling_text[i] || '')
    )

    merged.comparison = normalizeCards(
      merged.comparison,
      4,
      base.comparison,
      (v: any, i: number) => ({
        feature: asString(v?.feature, base.comparison[i]?.feature || ''),
        us: Boolean(v?.us ?? base.comparison[i]?.us),
        them: Boolean(v?.them ?? base.comparison[i]?.them),
      })
    )

    merged.multicolumn = normalizeCards(
      merged.multicolumn,
      3,
      base.multicolumn,
      (v: any, i: number) => ({
        title: asString(v?.title, base.multicolumn[i]?.title || ''),
        text: asString(v?.text, base.multicolumn[i]?.text || ''),
      })
    )

    merged.contact = merged.contact && typeof merged.contact === 'object' ? merged.contact : {}
    merged.contact.heading = asString(merged.contact.heading, base.contact.heading)
    merged.contact.subheading = asString(merged.contact.subheading, base.contact.subheading)

    merged.upsell = merged.upsell && typeof merged.upsell === 'object' ? merged.upsell : {}
    merged.upsell.heading = asString(merged.upsell.heading, base.upsell.heading)

    merged.volume_bundles = merged.volume_bundles && typeof merged.volume_bundles === 'object' ? merged.volume_bundles : {}
    merged.volume_bundles.heading = asString(merged.volume_bundles.heading, base.volume_bundles.heading)
    merged.volume_bundles.label_buy_1 = asString(merged.volume_bundles.label_buy_1, base.volume_bundles.label_buy_1)
    merged.volume_bundles.label_buy_2 = asString(merged.volume_bundles.label_buy_2, base.volume_bundles.label_buy_2)
    merged.volume_bundles.label_buy_3 = asString(merged.volume_bundles.label_buy_3, base.volume_bundles.label_buy_3)

    merged.countdown = merged.countdown && typeof merged.countdown === 'object' ? merged.countdown : {}
    merged.countdown.heading = asString(merged.countdown.heading, base.countdown.heading)
    merged.countdown.timer_text = asString(merged.countdown.timer_text, base.countdown.timer_text)

    merged.announcement_bar = merged.announcement_bar && typeof merged.announcement_bar === 'object' ? merged.announcement_bar : {}
    merged.announcement_bar.text = asString(
      merged.announcement_bar.text,
      asString(merged.countdown.heading, 'شحن مجاني حول العالم')
    )

    merged.logo_list = merged.logo_list && typeof merged.logo_list === 'object' ? merged.logo_list : {}
    merged.logo_list.heading = asString(merged.logo_list.heading, base.logo_list.heading)
    merged.logo_list.logos = normalizeCards(
      merged.logo_list.logos,
      6,
      ['Forbes', 'TechCrunch', 'GQ', 'Vogue', 'Wired', 'Inc.'],
      (v: any, i: number) => asString(v, ['Forbes', 'TechCrunch', 'GQ', 'Vogue', 'Wired', 'Inc.'][i] || '')
    )

    merged.before_after = merged.before_after && typeof merged.before_after === 'object' ? merged.before_after : {}
    merged.before_after.heading = asString(merged.before_after.heading, base.before_after.heading)
    merged.before_after.label_before = asString(merged.before_after.label_before, base.before_after.label_before)
    merged.before_after.label_after = asString(merged.before_after.label_after, base.before_after.label_after)

    merged.stats = normalizeCards(
      merged.stats,
      3,
      base.stats,
      (v: any, i: number) => ({
        value: asString(v?.value, base.stats[i]?.value || ''),
        label: asString(v?.label, base.stats[i]?.label || ''),
      })
    )

    merged.visual_showcase = merged.visual_showcase && typeof merged.visual_showcase === 'object' ? merged.visual_showcase : {}
    merged.visual_showcase.heading = asString(merged.visual_showcase.heading, base.visual_showcase.heading)
    merged.visual_showcase.subheading = asString(merged.visual_showcase.subheading, base.visual_showcase.subheading)
    merged.visual_showcase.cta = asString(merged.visual_showcase.cta, merged.hero.cta)

    merged.how_it_works = normalizeCards(
      merged.how_it_works,
      3,
      base.how_it_works,
      (v: any, i: number) => ({
        title: asString(v?.title, base.how_it_works[i]?.title || ''),
        text: asString(v?.text, base.how_it_works[i]?.text || ''),
      })
    )

    merged.trust_badges = merged.trust_badges && typeof merged.trust_badges === 'object' ? merged.trust_badges : {}
    merged.trust_badges.heading = asString(merged.trust_badges.heading, base.trust_badges.heading)
    merged.trust_badges.badges = normalizeCards(
      merged.trust_badges.badges,
      4,
      [
        { title: 'شحن مجاني', desc: 'على جميع الطلبات' },
        { title: 'إرجاع خلال 30 يومًا', desc: 'إرجاع بلا متاعب' },
        { title: 'دفع آمن', desc: 'مدفوعات مشفّرة' },
        { title: 'دعم', desc: 'مساعدة وقت الحاجة' },
      ],
      (v: any, i: number) => ({
        title: asString(v?.title, ['شحن مجاني', 'إرجاع خلال 30 يومًا', 'دفع آمن', 'دعم'][i] || ''),
        desc: asString(v?.desc, ['على جميع الطلبات', 'إرجاع بلا متاعب', 'مدفوعات مشفّرة', 'مساعدة وقت الحاجة'][i] || ''),
      })
    )

    merged.how_it_works_section = merged.how_it_works_section && typeof merged.how_it_works_section === 'object' ? merged.how_it_works_section : {}
    merged.how_it_works_section.heading = asString(merged.how_it_works_section.heading, 'كيف يعمل')
    merged.how_it_works_section.subheading = asString(merged.how_it_works_section.subheading, 'خطوات بسيطة. نتائج سريعة.')
    merged.how_it_works_section.steps = normalizeCards(
      merged.how_it_works_section.steps,
      3,
      merged.how_it_works,
      (v: any, i: number) => ({
        title: asString(v?.title, merged.how_it_works?.[i]?.title || ''),
        text: asString(v?.text, merged.how_it_works?.[i]?.text || ''),
      })
    )

    merged.accordion = normalizeCards(
      merged.accordion,
      3,
      base.accordion,
      (v: any, i: number) => ({
        title: asString(v?.title, base.accordion[i]?.title || ''),
        content: asString(v?.content, base.accordion[i]?.content || ''),
      })
    )

    merged.tabs = normalizeCards(
      merged.tabs,
      3,
      base.tabs,
      (v: any, i: number) => ({
        title: asString(v?.title, base.tabs[i]?.title || ''),
        content: asString(v?.content, base.tabs[i]?.content || ''),
      })
    )

    merged.collection_page = merged.collection_page && typeof merged.collection_page === 'object' ? merged.collection_page : {}
    merged.collection_page.headline = asString(merged.collection_page.headline, 'تسوّق تشكيلتنا')
    merged.collection_page.subheadline = asString(merged.collection_page.subheadline, 'تصفّح أفضل اختياراتنا ليومك.')
    merged.collection_page.filter_help = asString(merged.collection_page.filter_help, 'نصيحة: اختر بناءً على احتياجك واستخدامك اليومي.')
    merged.collection_page.why_buy_heading = asString(merged.collection_page.why_buy_heading, 'لماذا الشراء منّا')
    merged.collection_page.why_buy_points = normalizeCards(
      merged.collection_page.why_buy_points,
      3,
      ['دعم سريع', 'جودة مفحوصة', 'إرجاع سهل'],
      (v: any, i: number) => asString(v, ['دعم سريع', 'جودة مفحوصة', 'إرجاع سهل'][i] || '')
    )

    merged.cart_drawer = merged.cart_drawer && typeof merged.cart_drawer === 'object' ? merged.cart_drawer : {}
    merged.cart_drawer.headline = asString(merged.cart_drawer.headline, 'سلّتك')
    merged.cart_drawer.free_shipping_before = asString(merged.cart_drawer.free_shipping_before, 'يفصلك {amount} عن الشحن المجاني!')
    merged.cart_drawer.free_shipping_after = asString(merged.cart_drawer.free_shipping_after, 'لقد حصلت على الشحن المجاني!')
    merged.cart_drawer.secure_line = asString(merged.cart_drawer.secure_line, 'دفع آمن — مشفّر بشهادة SSL')
    merged.cart_drawer.reassurance_lines = normalizeCards(
      merged.cart_drawer.reassurance_lines,
      3,
      ['إرجاع خلال 30 يومًا', 'دعم سريع', 'توصيل مع تتبّع'],
      (v: any, i: number) => asString(v, ['إرجاع خلال 30 يومًا', 'دعم سريع', 'توصيل مع تتبّع'][i] || '')
    )
    merged.cart_drawer.checkout_cta = asString(merged.cart_drawer.checkout_cta, 'إتمام الشراء الآن')

    merged.cart_page = merged.cart_page && typeof merged.cart_page === 'object' ? merged.cart_page : {}
    merged.cart_page.headline = asString(merged.cart_page.headline, 'سلّتك')
    merged.cart_page.subheadline = asString(merged.cart_page.subheadline, 'راجع منتجاتك وأكمل الشراء بأمان.')
    merged.cart_page.order_summary_heading = asString(merged.cart_page.order_summary_heading, 'ملخّص الطلب')
    merged.cart_page.checkout_cta = asString(merged.cart_page.checkout_cta, merged.cart_drawer.checkout_cta)
    merged.cart_page.empty_headline = asString(merged.cart_page.empty_headline, 'سلّتك فارغة')
    merged.cart_page.empty_subheadline = asString(merged.cart_page.empty_subheadline, 'يبدو أنك لم تُضِف أي شيء بعد.')

    merged.pages = merged.pages && typeof merged.pages === 'object' ? merged.pages : {}
    merged.pages.about = merged.pages.about && typeof merged.pages.about === 'object' ? merged.pages.about : {}
    merged.pages.about.hero_heading = asString(merged.pages.about.hero_heading, 'قصتنا')
    merged.pages.about.hero_subheading = asString(merged.pages.about.hero_subheading, 'مبنية على الجودة والنتائج الحقيقية.')
    merged.pages.about.mission_title = asString(merged.pages.about.mission_title, 'رسالتنا')
    merged.pages.about.mission_text = asString(merged.pages.about.mission_text, 'نوجد لنصنع منتجات أفضل في الاستخدام كل يوم.')
    merged.pages.about.craftsmanship_heading = asString(merged.pages.about.craftsmanship_heading, 'الحِرفية')
    merged.pages.about.craftsmanship_text = asString(merged.pages.about.craftsmanship_text, 'نركّز على التفاصيل المهمة: الراحة والمتانة والإتقان.')
    merged.pages.about.process_heading = asString(merged.pages.about.process_heading, 'منهجيتنا')
    merged.pages.about.process_subheading = asString(merged.pages.about.process_subheading, 'تصميم مدروس. فحص للجودة. شحن سريع.')

    merged.pages.contact = merged.pages.contact && typeof merged.pages.contact === 'object' ? merged.pages.contact : {}
    merged.pages.contact.faq_heading = asString(merged.pages.contact.faq_heading, 'أسئلة شائعة')
    merged.pages.contact.faq_items = normalizeCards(
      merged.pages.contact.faq_items,
      2,
      [
        { q: 'مدة الشحن؟', a: 'تُشحن معظم الطلبات بسرعة مع تتبّع. تعتمد المدة الدقيقة على موقعك.' },
        { q: 'الإرجاع؟', a: 'إرجاع خلال 30 يومًا. إن لم يناسبك، فسنُصلح الأمر.' },
      ],
      (v: any, i: number) => ({
        q: asString(v?.q, i === 0 ? 'مدة الشحن؟' : 'الإرجاع؟'),
        a: asString(
          v?.a,
          i === 0
            ? 'تُشحن معظم الطلبات بسرعة مع تتبّع. تعتمد المدة الدقيقة على موقعك.'
            : 'إرجاع خلال 30 يومًا. إن لم يناسبك، فسنُصلح الأمر.'
        ),
      })
    )

    merged.pages.faq = merged.pages.faq && typeof merged.pages.faq === 'object' ? merged.pages.faq : {}
    merged.pages.faq.title = asString(merged.pages.faq.title, 'مركز المساعدة')
    merged.pages.faq.intro = asString(merged.pages.faq.intro, 'تجد الإجابات التي تحتاجها أدناه.')
    merged.pages.faq.items = normalizeCards(
      merged.pages.faq.items,
      3,
      [
        { q: 'كيف أتتبّع طلبي؟', a: 'ستصلك رسالة بريد فيها رابط التتبّع فور شحن طلبك.' },
        { q: 'هل يمكنني تعديل طلبي؟', a: 'إن لم يُشحن طلبك بعد، تواصل مع الدعم وسنبذل قصارى جهدنا.' },
        { q: 'هل تشحنون دوليًا؟', a: 'نعم. تختلف مدة التوصيل حسب الموقع.' },
      ],
      (v: any, i: number) => ({
        q: asString(v?.q, ['كيف أتتبّع طلبي؟', 'هل يمكنني تعديل طلبي؟', 'هل تشحنون دوليًا؟'][i] || ''),
        a: asString(
          v?.a,
          [
            'ستصلك رسالة بريد فيها رابط التتبّع فور شحن طلبك.',
            'إن لم يُشحن طلبك بعد، تواصل مع الدعم وسنبذل قصارى جهدنا.',
            'نعم. تختلف مدة التوصيل حسب الموقع.',
          ][i] || ''
        ),
      })
    )

    merged.policies = merged.policies && typeof merged.policies === 'object' ? merged.policies : {}
    merged.policies.shipping = merged.policies.shipping && typeof merged.policies.shipping === 'object' ? merged.policies.shipping : {}
    merged.policies.shipping.title = asString(merged.policies.shipping.title, 'سياسة الشحن')
    merged.policies.shipping.bullets = normalizeCards(
      merged.policies.shipping.bullets,
      3,
      ['معالجة سريعة', 'توصيل مع تتبّع', 'دعم إن حدث أي خطأ'],
      (v: any, i: number) => asString(v, ['معالجة سريعة', 'توصيل مع تتبّع', 'دعم إن حدث أي خطأ'][i] || '')
    )
    merged.policies.returns = merged.policies.returns && typeof merged.policies.returns === 'object' ? merged.policies.returns : {}
    merged.policies.returns.title = asString(merged.policies.returns.title, 'الإرجاع والاسترداد')
    merged.policies.returns.bullets = normalizeCards(
      merged.policies.returns.bullets,
      3,
      ['إرجاع خلال 30 يومًا', 'إجراء بسيط', 'مساعدة سريعة من الدعم'],
      (v: any, i: number) => asString(v, ['إرجاع خلال 30 يومًا', 'إجراء بسيط', 'مساعدة سريعة من الدعم'][i] || '')
    )

    merged.seo = merged.seo && typeof merged.seo === 'object' ? merged.seo : {}
    const normalizeSeo = (obj: any, fallbackTitle: string, fallbackDesc: string) => ({
      title: asString(obj?.title, fallbackTitle),
      description: asString(obj?.description, fallbackDesc),
    })
    merged.seo.homepage = normalizeSeo(merged.seo.homepage, `${productName} | المتجر الرسمي`, 'جودة فاخرة. شحن سريع. دفع آمن.')
    merged.seo.product = normalizeSeo(merged.seo.product, `${productName} | عرض محدود`, 'تصفّح التفاصيل والتقييمات والضمان. اطلب اليوم.')
    merged.seo.collection = normalizeSeo(merged.seo.collection, `تسوّق تشكيلة ${productName}`, 'تصفّح أكثر منتجاتنا مبيعًا وأحدث الوافدين.')
    merged.seo.og = normalizeSeo(merged.seo.og, `${productName}`, 'منتج فاخر مصمَّم للحياة اليومية.')

    return merged
  }

  function hashString(input: string) {
    let h = 2166136261
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  function guessCategory(productName: string) {
    const n = productName.toLowerCase()
    if (/(mat|yoga|gym|fitness|trainer|massage|resistance)/.test(n)) return 'fitness'
    if (/(lamp|light|led|projector|neon)/.test(n)) return 'home lighting'
    if (/(watch|earbud|headphone|speaker|camera|drone|gadget)/.test(n)) return 'electronics'
    if (/(skincare|serum|cream|mask|hair|shampoo|beauty)/.test(n)) return 'beauty'
    if (/(pet|cat|dog|leash|collar)/.test(n)) return 'pet'
    if (/(baby|toddler|stroller|diaper)/.test(n)) return 'baby'
    if (/(kitchen|knife|pan|cook|bottle|cup|mug)/.test(n)) return 'kitchen'
    return 'everyday'
  }

  function formatPrice(n?: number) {
    if (!n || Number.isNaN(n) || n <= 0) return ''
    return `$${n.toFixed(2)}`
  }

  function pick<T>(arr: T[], seed: number, offset: number) {
    return arr[(seed + offset) % arr.length]
  }

  function getFallbackContent(productName: string) {
    const base = getMockContent(productName) as any
    const seed = hashString([productName, productUrl, String(price ?? ''), String(originalPrice ?? ''), audience, description].join('|'))
    const category = guessCategory(productName)
    const priceText = formatPrice(price)
    const originalText = formatPrice(originalPrice)

    const promisesByCategory: Record<string, string[]> = {
      fitness: ['أقوى. أسرع. أكثر انتظامًا.', 'روتين تستمر عليه فعلًا.', 'مقاومة أقل. تقدّم أكبر.'],
      electronics: ['أداء أدق ومتاعب أقل.', 'مزايا ذكية. استخدام بسيط.', 'مصنوع ليعمل، لا ليتعطّل.'],
      'home lighting': ['أجواء فورية بلا أي جهد.', 'اجعل الغرفة تبدو فاخرة.', 'إضاءة تغيّر المزاج.'],
      beauty: ['نتائج ظاهرة وروتين أبسط.', 'الراحة أولًا. ثم الثقة.', 'لطيف. فعّال. يومي.'],
      pet: ['حيوانات أسعد وأيام أهدأ.', 'فوضى أقل ولحظات أكثر.', 'مصنوع لحياة الحيوانات الحقيقية.'],
      baby: ['أيام أأمن وليالٍ أسهل.', 'مصمَّم للوالدين المشغولين.', 'راحة تسافر معك.'],
      kitchen: ['اطبخ أسرع ونظّف أسهل.', 'اجعل كل وجبة أكثر سلاسة.', 'تحديث صغير بمردود كبير.'],
      everyday: ['اجعل يومك أسهل.', 'نسخة أفضل من الأساسي.', 'تحديث بسيط بأثر حقيقي.'],
    }

    const promise = pick(promisesByCategory[category] || promisesByCategory.everyday, seed, 1)
    const mechanism = pick(
      [
        'تصميم دقيق المقاس يزيل الاحتكاك المعتاد.',
        'بنية أذكى تصمد أمام الاستخدام اليومي.',
        'هندسة تضع التفاصيل أولًا حيث يهمّ ذلك فعلًا.',
        'نظام بسيط: جهّزه مرة، واستمتع به كل يوم.',
      ],
      seed,
      3
    )

    base._strategy = {
      target_avatar: `${audience}. أشخاص يبحثون عن تحديثات فاخرة في فئة ${category}.`,
      core_pain_point: `يشترون باستمرار منتجات تبدو جيدة على الإنترنت لكنها مخيّبة في الواقع.`,
      unique_mechanism: mechanism,
      competitor_weakness: `تصنيع رخيص، ووعود عامة، وجودة غير ثابتة.`,
    }

    base.hero.headline = pick([promise, `${productName} أفضل.`, `تعرّف على ${productName} المفضّل الجديد لديك.`], seed, 4)
    base.hero.subheadline = `مصمَّم لـ${audience}. ${mechanism} مصنوع ليمنحك إحساسًا فاخرًا من اليوم الأول.`
    base.hero.cta = priceText ? `احصل عليه بـ${priceText}` : pick(['تسوّق الإصدار', 'احجز عرض اليوم', 'اطلبه الآن'], seed, 5)

    base.problem.headline = pick(
      [`معظم منتجات ${category} مخيّبة.`, 'البدائل الرخيصة تبدو جيدة — حتى تتعطّل.', 'سئمت من شراء الشيء نفسه مرتين؟', 'حين لا يكون "الجيد كفاية" كافيًا.'],
      seed,
      6
    )
    base.problem.text = pick(
      [
        `تطلبه وأنت متحمّس. ثم يصل فيبدو هشًّا أو غير مريح أو مختلفًا عن الصور. تلك هي الكلفة الحقيقية: وقت ومال ضائعان، وإحباط البدء من جديد.`,
        `السوق مليء بالاختصارات — مواد رقيقة ووصلات ضعيفة وتشطيب رديء. يعمل أسبوعًا ثم يبدأ بإزعاجك، فتتوقف عن استخدامه.`,
        `معظم العلامات تُحسّن للنقرات لا للنتائج. تعتمد على وعود عامة بدلًا من تحسين التجربة فعلًا.`,
      ],
      seed,
      7
    )

    base.solution.headline = `لماذا ${productName} أفضل`
    base.solution.text = `صُمّم ${productName} حول فكرة واحدة: أن تكون التجربة سلسة بلا عناء. ${mechanism} ${
      priceText && originalText ? `والآن، سعره ${priceText} (كان ${originalText}).` : ''
    }`

    base.features = (base.features || []).map((f: any, i: number) => ({
      ...f,
      title: pick(['أفضل في الاستخدام', 'مصنوع للحياة اليومية', 'إعداد سريع بلا عناء', 'مظهر فاخر من اليوم الأول'], seed, 10 + i),
      desc: pick(
        [
          `مصمَّم حول طريقة استخدامك الفعلية لـ${productName}. إحراج أقل وانسيابية أكثر.`,
          `الأجزاء التي تتعطّل عادةً مُعزَّزة. والتشطيب يبقى نظيفًا وفاخرًا.`,
          `من العلبة إلى أول استخدام خلال دقائق. بلا خطوات معقّدة.`,
          `خطوط أنيقة وإحساس عصري وتفاصيل تجعله يبدو باهظًا.`,
        ],
        seed,
        20 + i
      ),
      icon: pick(['shield', 'zap', 'check', 'star', 'lock', 'sparkles', 'heart', 'truck'], seed, 30 + i),
    }))

    const shippingLine = pick(['تُشحن الطلبات بسرعة مع تتبّع.', 'إرسال سريع + توصيل مع تتبّع.', 'معالجة سريعة كي لا تنتظر أسابيع.'], seed, 60)
    base.faq = [
      { q: `هل ${productName} سهل الاستخدام؟`, a: `نعم — مصمَّم ليكون بديهيًا من أول استخدام. بلا إعداد معقّد.` },
      { q: 'ما سرعة الشحن؟', a: shippingLine },
      { q: 'ماذا لو لم يعجبني؟', a: `جرّبه دون مخاطرة لمدة 30 يومًا. أعِده واسترد أموالك.` },
      { q: 'هل هو هدية مناسبة؟', a: `بالتأكيد. عملي وأنيق، وشيء يستخدمه الناس فعلًا.` },
    ]
    base.tabs = [
      { title: 'الوصف', content: `${productName} تحديث فاخر مصنوع للاستخدام اليومي. ${mechanism}` },
      { title: 'الشحن', content: shippingLine },
      { title: 'الإرجاع', content: `إرجاع خلال 30 يومًا. إجراء بسيط. بلا توتر.` },
    ]

    base.countdown.heading = priceText ? `لوقت محدود: ${priceText}` : base.countdown.heading
    base.countdown.timer_text = 'ينتهي العرض خلال:'
    return base
  }

  const facts = productFacts || {}
  const title = typeof facts.title === 'string' ? facts.title.trim() : ''
  const highlightsCount = Array.isArray(facts.highlights) ? facts.highlights.length : 0
  const specsCount = facts.specs && typeof facts.specs === 'object' ? Object.keys(facts.specs).length : 0
  const longDescLen = typeof facts.longDescription === 'string' ? facts.longDescription.trim().length : 0
  const metaDescLen = typeof facts.metaDescription === 'string' ? facts.metaDescription.trim().length : 0
  const descLen = description.trim().length

  const score =
    (title ? 1 : 0) +
    (highlightsCount >= 3 ? 2 : highlightsCount >= 1 ? 1 : 0) +
    (specsCount >= 3 ? 2 : specsCount >= 1 ? 1 : 0) +
    (longDescLen >= 200 ? 2 : longDescLen >= 80 ? 1 : 0) +
    (metaDescLen >= 80 ? 1 : 0) +
    (descLen >= 200 ? 1 : 0)

  const factsWeak = !title || score < 4
  const effectiveFacts = {
    ...facts,
    title: title || name,
    metaDescription: (typeof facts.metaDescription === 'string' && facts.metaDescription.trim()) ? facts.metaDescription : undefined,
    longDescription:
      (typeof facts.longDescription === 'string' && facts.longDescription.trim())
        ? facts.longDescription
        : description.trim()
        ? description.trim().slice(0, 1400)
        : undefined,
  } as typeof facts

  function buildFinalResponse(payload: any, metaOverrides?: Record<string, any>) {
    const meta = {
      _meta: {
        source: metaOverrides?.source || 'openai',
        analysis_used: !!metaOverrides?.analysis_used,
        facts_weak: factsWeak,
        facts_score: score,
        facts_counts: {
          highlights: highlightsCount,
          specs: specsCount,
          longDescriptionLen: longDescLen,
          metaDescriptionLen: metaDescLen,
        },
        ...(metaOverrides || {}),
      },
    }

    const limited800 = limitStringLengths(payload, 800)
    let responsePayload: any = { ...limited800, ...meta }
    let json = JSON.stringify(responsePayload)
    if (Buffer.byteLength(json, 'utf8') > 3_800_000) {
      const limited400 = limitStringLengths(payload, 400)
      responsePayload = { ...limited400, ...meta }
      json = JSON.stringify(responsePayload)
    }

    return new NextResponse(json, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  function buildFallbackResponse(reason: string, analysis?: any) {
    const fallback = normalizeGeneratedContent(name, getFallbackContent(name), analysis || null)
    return buildFinalResponse(fallback, {
      source: 'fallback',
      analysis_used: !!analysis,
      fallback_reason: reason.slice(0, 120),
    })
  }

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackResponse('missing_openai_api_key')
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Math.max(20_000, Math.min(55_000, timeLeft())),
    })
    const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const usageUserId = await getUserIdSafe()

    async function runJson(
      model: string,
      messages: { role: 'system' | 'user'; content: string }[],
      opts?: { maxTokens?: number; temperature?: number }
    ) {
      const maxWait = Math.max(8_000, Math.min(ANALYSIS_TIMEOUT_MS, timeLeft() - 5_000))
      if (maxWait <= 0) throw new Error('route_budget_exceeded_before_analysis')
      const resp = await withTimeout(
        openai.chat.completions.create({
          model,
          temperature: typeof opts?.temperature === 'number' ? opts.temperature : 0.5,
          presence_penalty: 0.2,
          frequency_penalty: 0.1,
          max_tokens: typeof opts?.maxTokens === 'number' ? opts.maxTokens : 700,
          messages,
          response_format: { type: 'json_object' as const },
        }),
        maxWait,
        'analysis'
      )
      await logAiUsage({ operation: 'generate-content:analysis', userId: usageUserId, model }, resp.usage)
      const content = resp.choices[0]?.message?.content
      if (!content) throw new Error('No content from OpenAI')
      const finish = resp.choices[0]?.finish_reason
      try {
        return parseModelJson(content)
      } catch (e: any) {
        if (finish === 'length') throw new Error('openai_json_truncated')
        throw e
      }
    }

    const factsBlock = `Product Name: ${name}
Product URL: ${productUrl || 'N/A'}
Price: ${typeof price === 'number' ? formatPrice(price) : 'N/A'}
Original Price: ${typeof originalPrice === 'number' ? formatPrice(originalPrice) : 'N/A'}
Target Audience (user-provided): ${audience}
Context/Description (user-provided): ${description}
Uniqueness Nonce: ${nonce}

Scraped Product Facts (do not invent beyond these; use them to be specific):
Title: ${productFacts?.title || 'N/A'}
Brand: ${productFacts?.brand || 'N/A'}
SKU: ${productFacts?.sku || 'N/A'}
Meta Description: ${productFacts?.metaDescription || 'N/A'}
Currency: ${productFacts?.priceCurrency || 'N/A'}
Availability: ${productFacts?.availability || 'N/A'}
Rating: ${typeof productFacts?.ratingValue === 'number' ? String(productFacts.ratingValue) : 'N/A'} (${
      typeof productFacts?.reviewCount === 'number' ? String(productFacts.reviewCount) : 'N/A'
    } reviews)
Highlights:
${(productFacts?.highlights || []).slice(0, 10).map((h) => `- ${h}`).join('\n') || 'N/A'}
Specs:
${
      productFacts?.specs
        ? Object.entries(productFacts.specs)
            .slice(0, 12)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n')
        : 'N/A'
}
Long Description (if present):
${(productFacts?.longDescription || '').slice(0, 1400) || 'N/A'}`

    let productAnalysis: any = null
    const shouldRunAnalysis = !factsWeak && timeLeft() > 28_000
    if (shouldRunAnalysis) {
      try {
        productAnalysis = await runJson(AI_MODEL, [
          {
            role: 'system',
            content:
              'You are an elite ecommerce product researcher. Your job is to analyze ONLY the provided facts and produce a structured conversion strategy. Never invent materials, measurements, certifications, or features.',
          },
          {
            role: 'user',
            content: `${factsBlock}

Return JSON only with this shape:
{
  "product_summary": "1-2 sentences describing what it is (no hype)",
  "likely_category": "short category guess",
  "ideal_customer": "specific avatar",
  "top_pains": ["3-6 pains the customer feels BEFORE buying (plausible, not factual claims)"],
  "dream_outcomes": ["3-6 outcomes they want AFTER buying (plausible)"],
  "primary_objections": ["3-6 objections (shipping, quality, fit, ease, etc.)"],
  "unique_mechanism": "Describe the mechanism USING ONLY highlights/specs (no invention). If unknown, say 'unknown'.",
  "proof_points": ["3-6 proof points you can honestly claim from provided facts (e.g., spec, included feature, rating if present)"],
  "keywords_to_use": ["8-16 words/phrases grounded in facts (from highlights/specs/title)"],
  "section_specific_angles": {
    "hero": "angle for hero",
    "features": "angle for features",
    "problem_solution": "angle for problem/solution",
    "faq": "angle for FAQ",
    "tabs": "angle for tabs"
  }
}`,
          },
        ], { maxTokens: 650, temperature: 0.35 })
      } catch {
        productAnalysis = null
      }
    }

    const userPrompt = `Product Name: ${name}
          Product URL: ${productUrl || 'N/A'}
          Price: ${typeof price === 'number' ? formatPrice(price) : 'N/A'}
          Original Price: ${typeof originalPrice === 'number' ? formatPrice(originalPrice) : 'N/A'}
          Target Audience: ${audience}
          Context/Description: ${description}
          Uniqueness Nonce: ${nonce}

          Scraped Product Facts (do not invent beyond these; use them to be specific):
          Title: ${effectiveFacts?.title || 'N/A'}
          Brand: ${effectiveFacts?.brand || 'N/A'}
          SKU: ${effectiveFacts?.sku || 'N/A'}
          Meta Description: ${effectiveFacts?.metaDescription || 'N/A'}
          Currency: ${effectiveFacts?.priceCurrency || 'N/A'}
          Availability: ${effectiveFacts?.availability || 'N/A'}
          Rating: ${
            typeof effectiveFacts?.ratingValue === 'number' ? String(effectiveFacts.ratingValue) : 'N/A'
          } (${typeof effectiveFacts?.reviewCount === 'number' ? String(effectiveFacts.reviewCount) : 'N/A'} reviews)
          Highlights:
          ${(effectiveFacts?.highlights || []).slice(0, 10).map((h) => `- ${h}`).join('\n') || 'N/A'}
          Specs:
          ${
            effectiveFacts?.specs
              ? Object.entries(effectiveFacts.specs).slice(0, 12).map(([k, v]) => `- ${k}: ${v}`).join('\n')
              : 'N/A'
          }
          Long Description (if present):
          ${(effectiveFacts?.longDescription || '').slice(0, 1400) || 'N/A'}

          Product Analysis (derived from facts; use this to write more targeted copy):
          ${productAnalysis ? JSON.stringify(productAnalysis) : 'N/A'}
          
          Hard requirements:
          - Every section must be specific to this product. Avoid generic placeholder copy.
          - If Highlights/Specs are present, use them heavily and reference them.
          - If Highlights/Specs are missing or thin, do NOT invent specifications. Instead, write conversion-focused copy using: the product name, category inference, common use cases, common objections, risk reversal, and clear CTAs.
          - Do not reuse the same sentences across sections.
          - Keep copy tight to avoid huge outputs:
            - Headline/title fields: <= 70 chars
            - Subheadlines/paragraph fields: <= 220 chars
            - Bullet items: <= 120 chars
            - Policies bullets: exactly 3 bullets, <= 140 chars each
            - FAQ answers: <= 220 chars
            - Testimonials text: <= 240 chars
          
          Generate content for the following sections. Ensure every word earns its place.

          JSON Structure:
          {
            "_strategy": {
              "target_avatar": "Specific description of the ideal customer",
              "core_pain_point": "The deep, emotional problem they face",
              "unique_mechanism": "The specific feature/tech that solves it",
              "competitor_weakness": "What cheap alternatives get wrong"
            },
            "hero": {
              "headline": "5-7 words. The Big Promise. Use power words.",
              "subheadline": "2 sentences. The 'How' and the 'Why'. Address the primary objection immediately.",
              "cta": "Action-oriented (e.g., 'Claim Offer', 'Shop Now - 50% Off')."
            },
            "slideshow": [
              { "heading": "Brand Statement or Collection Highlight", "subheading": "Evocative, lifestyle-focused copy.", "cta": "Explore Collection" },
              { "heading": "Secondary Value Prop (e.g., Engineering)", "subheading": "Focus on quality and durability.", "cta": "View Details" }
            ],
            "video_hero": {
              "heading": "Cinematic & immersive title.",
              "subheading": "Invitation to witness the product in action.",
              "cta": "Watch the Film"
            },
            "features": [
              { "title": "Benefit 1 (The Outcome)", "desc": "Explain the feature that delivers this outcome. Be specific.", "icon": "shield" },
              { "title": "Benefit 2 (The Experience)", "desc": "How it feels to use. Sensory details.", "icon": "zap" },
              { "title": "Benefit 3 (The Assurance)", "desc": "Durability, safety, or speed.", "icon": "check" }
            ],
            "problem": {
              "headline": "Hook the reader with their #1 complaint about current solutions.",
              "text": "Agitate the pain. Describe the frustration of using inferior products. Make them nod in agreement."
            },
            "solution": {
              "headline": "Introduce ${name} as the only logical solution.",
              "text": "Explain the 'Mechanism of Action'. Why is this different? Use words like 'Precision-engineered', 'Proprietary', 'Verified'."
            },
            "testimonials": [
              { "name": "Full Name", "text": "A specific story of transformation. Mention a skepticism they had and how the product resolved it.", "location": "City, Country", "rating": 5 },
              { "name": "Full Name", "text": "Focus on shipping speed and customer service. Builds trust in the business.", "location": "City, Country", "rating": 5 },
              { "name": "Full Name", "text": "Focus on product quality and durability vs. competitors.", "location": "City, Country", "rating": 5 }
            ],
            "faq": [
              { "q": "High-intent objection 1 (e.g., Will this work for me?)", "a": "Confident, 'yes, because...' answer." },
              { "q": "High-intent objection 2 (e.g., Shipping times?)", "a": "Specifics about processing and delivery speed." },
              { "q": "High-intent objection 3 (e.g., Warranty/Returns?)", "a": "Restate the risk-free guarantee." },
              { "q": "Technical/Usage question?", "a": "Simple, step-by-step clarification." }
            ],
            "guarantee": {
              "title": "Ironclad 30-Day Risk-Free Guarantee",
              "text": "We are so confident in our quality that if you are not 100% satisfied, simply return it for a full refund. We'll even cover the return shipping.",
              "days": 30
            },
            "rich_text": {
              "title": "Our Philosophy",
              "text": "Why we exist. Our commitment to quality/sustainability/innovation."
            },
            "image_text": {
              "title": "Lifestyle/Use Case Highlight",
              "text": "Paint a picture of life with the product.",
              "cta": "Read the Full Story"
            },
            "newsletter": {
              "title": "Join the Inner Circle",
              "text": "Unlock early access to new drops and an instant 10% discount code."
            },
            "timeline": [
              { "year": "Year 1", "title": "Inception", "text": "Identifying the gap in the market." },
              { "year": "Year 2", "title": "R&D", "text": "Rigorous testing and prototyping." },
              { "year": "Year 3", "title": "Global Launch", "text": "Delivering excellence worldwide." }
            ],
            "scrolling_text": [
              "Free Expedited Shipping", "30-Day Money Back Guarantee", "24/7 Priority Support", "Over 50,000 Satisfied Customers"
            ],
            "comparison": [
              { "feature": "Core Benefit 1", "us": true, "them": false },
              { "feature": "Core Benefit 2", "us": true, "them": false },
              { "feature": "Core Benefit 3", "us": true, "them": false },
              { "feature": "Core Benefit 4", "us": true, "them": false }
            ],
            "multicolumn": [
              { "title": "Benefit A", "text": "Detail A" },
              { "title": "Benefit B", "text": "Detail B" },
              { "title": "Benefit C", "text": "Detail C" }
            ],
            "contact": {
              "heading": "We're Here to Help",
              "subheading": "Our expert support team typically replies within 2 hours."
            },
            "upsell": { "heading": "Frequently Bought Together" },
            "volume_bundles": { 
              "heading": "Stock Up & Save",
              "label_buy_1": "Single Pack",
              "label_buy_2": "Double Pack (Save 15%)",
              "label_buy_3": "Family Pack (Save 25%)"
            },
            "countdown": { "heading": "Limited Time Launch Offer", "timer_text": "Offer expires in:" },
            "announcement_bar": { "text": "Free Shipping + Today Only Offer" },
            "logo_list": { "heading": "Featured In", "logos": ["Forbes","GQ","Vogue","Wired","TechCrunch","Inc."] },
            "before_after": { "heading": "Real Results", "label_before": "Before", "label_after": "After" },
            "stats": [
              { "value": "Number", "label": "Metric" },
              { "value": "Number", "label": "Metric" },
              { "value": "Number", "label": "Metric" }
            ],
            "visual_showcase": { "heading": "Precision Engineering", "subheading": "Every detail matters.", "cta": "Get Yours Today" },
            "how_it_works_section": {
              "heading": "How It Works",
              "subheading": "Simple steps. Fast results.",
              "steps": [
                { "title": "Step 1", "text": "Action" },
                { "title": "Step 2", "text": "Action" },
                { "title": "Step 3", "text": "Result" }
              ]
            },
            "how_it_works": [
              { "title": "Step 1", "text": "Action" },
              { "title": "Step 2", "text": "Action" },
              { "title": "Step 3", "text": "Result" }
            ],
            "trust_badges": {
              "heading": "Shop with Confidence",
              "badges": [
                { "title": "Free Shipping", "desc": "On all orders" },
                { "title": "30-Day Returns", "desc": "No stress returns" },
                { "title": "Secure Checkout", "desc": "Encrypted payments" },
                { "title": "Support", "desc": "Help when you need it" }
              ]
            },
            "accordion": [
              { "title": "Detail 1", "content": "Info" },
              { "title": "Detail 2", "content": "Info" },
              { "title": "Detail 3", "content": "Info" }
            ],
            "tabs": [
              { "title": "Description", "content": "Info" },
              { "title": "Shipping", "content": "Info" },
              { "title": "Returns", "content": "Info" }
            ],
            "collection_page": {
              "headline": "Shop Our Collection",
              "subheadline": "Short positioning line that matches the product category and audience.",
              "filter_help": "One sentence that helps shoppers choose (e.g., what to look for).",
              "why_buy_heading": "Why buy from us",
              "why_buy_points": ["Point 1","Point 2","Point 3"]
            },
            "cart_drawer": {
              "headline": "Your Cart",
              "free_shipping_before": "You are {amount} away from Free Shipping!",
              "free_shipping_after": "You’ve unlocked Free Shipping!",
              "secure_line": "Secure checkout — SSL encrypted",
              "reassurance_lines": ["30-day returns","Fast support","Tracked delivery"],
              "checkout_cta": "Checkout Now"
            },
            "cart_page": {
              "headline": "Your Cart",
              "subheadline": "Short line that reduces anxiety and increases conversion.",
              "order_summary_heading": "Order Summary",
              "checkout_cta": "Checkout Now",
              "empty_headline": "Your cart is empty",
              "empty_subheadline": "A friendly line that pushes them back to shopping."
            },
            "pages": {
              "about": {
                "hero_heading": "Our Story",
                "hero_subheading": "Short brand origin line tied to the product category.",
                "mission_title": "Mission",
                "mission_text": "Short mission statement.",
                "craftsmanship_heading": "Craftsmanship",
                "craftsmanship_text": "Quality/process positioning.",
                "process_heading": "Our Process",
                "process_subheading": "How we deliver quality."
              },
              "contact": {
                "faq_heading": "Common Questions",
                "faq_items": [
                  { "q": "Shipping time?", "a": "Answer." },
                  { "q": "Returns?", "a": "Answer." }
                ]
              },
              "faq": {
                "title": "Help Center",
                "intro": "Short intro line.",
                "items": [
                  { "q": "Question?", "a": "Answer." },
                  { "q": "Question?", "a": "Answer." },
                  { "q": "Question?", "a": "Answer." }
                ]
              }
            },
            "policies": {
              "shipping": { "title": "Shipping Policy", "bullets": ["Bullet 1","Bullet 2","Bullet 3"] },
              "returns": { "title": "Returns & Refunds", "bullets": ["Bullet 1","Bullet 2","Bullet 3"] }
            },
            "seo": {
              "homepage": { "title": "Homepage SEO Title", "description": "Homepage meta description." },
              "product": { "title": "Product SEO Title", "description": "Product meta description." },
              "collection": { "title": "Collection SEO Title", "description": "Collection meta description." },
              "og": { "title": "OpenGraph Title", "description": "OpenGraph description." }
            }
          }`

    async function run(model: string, opts?: { maxTokens?: number; temperature?: number }) {
      const maxWait = Math.max(10_000, Math.min(CONTENT_TIMEOUT_MS, timeLeft() - 5_000))
      if (maxWait <= 0) throw new Error('route_budget_exceeded_before_content')
      return withTimeout(
        openai.chat.completions.create({
          model,
          temperature: typeof opts?.temperature === 'number' ? opts.temperature : 0.75,
          presence_penalty: 0.35,
          frequency_penalty: 0.15,
          max_tokens: typeof opts?.maxTokens === 'number' ? opts.maxTokens : 2200,
          messages: [
            { 
              role: 'system', 
              content: `You are an elite Direct Response Copywriter and Brand Strategist for 7-figure e-commerce brands. You specialize in high-ticket dropshipping and premium brand building.

          YOUR GOAL:
          To generate high-converting, trust-building, and emotionally resonant copy for a Shopify store. The copy must feel "expensive", authoritative, and deeply researched.

          CRITICAL RESEARCH PHASE (Internal Monologue):
          Before writing any copy, you must perform a "Deep Dive Simulation" on the product niche:
          1.  Identify the "Bleeding Neck" pain point (the urgent problem).
          2.  Define the "Dream Outcome" (what life looks like after the product).
          3.  Analyze 3 common competitor failures (e.g., "breaks easily", "slow shipping", "poor support").
          4.  Establish the "Mechanism of Action" (how the product actually delivers results).

          TONE & STYLE GUIDELINES:
          -   **NO AI CLICHÉS**: Strictly avoid words like "unleash", "elevate", "unlock", "game-changer", "comprehensive", "landscape", "delve".
          -   **Specifics Build Trust**: Use concrete numbers, specific materials, and tangible benefits (e.g., instead of "high quality", say "aircraft-grade aluminum").
          -   **Ground Every Section**: Each major section must reference at least one concrete product detail (feature/spec/ingredient/material/size/compatibility/warranty/shipping) when available. If scraped facts are thin, be explicit and keep claims modest.
          -   **Authority & Empathy**: Sound like an expert who understands the customer's struggle.
          -   **Short & Punchy**: Use fragments for impact. "Built for speed. Engineered for life."
          -   **Risk Reversal**: Constantly reassure the user (guarantees, support, social proof).

          OUTPUT STRUCTURE:
          Return strictly a JSON object.
          Never return null. Never omit required keys. If you don't know a value, return an empty string.
          Ensure "testimonials" items always include {name,text,location,rating} where name/location are non-empty strings and rating is an integer 1-5.
          For new objects below ("collection_page","cart_drawer","cart_page","pages","policies","seo"), always include them even if some strings are empty.
          You MUST include a "_strategy" object first to prove your research.

${ARABIC_OUTPUT_DIRECTIVE}`
          },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' as const },
        }),
        maxWait,
        'content'
      )
    }

    let resp: any
    try {
      resp = await run(AI_MODEL, { maxTokens: 2200, temperature: 0.7 })
    } catch (e) {
      return buildFallbackResponse(String((e as any)?.message || e), productAnalysis)
    }

    await logAiUsage({ operation: 'generate-content', userId: usageUserId, model: AI_MODEL }, resp?.usage)
    
    const content = resp.choices[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')
    const finish = resp.choices[0]?.finish_reason
    let parsed: any
    try {
      parsed = parseModelJson(content)
    } catch (e: any) {
      const errorMessage = String(e?.message || e)

      async function repairJsonWithModel(input: string) {
        const maxWait = Math.max(5_000, Math.min(REPAIR_TIMEOUT_MS, timeLeft() - 3_000))
        if (maxWait <= 0) throw new Error('route_budget_exceeded_before_repair')
        const repair = await withTimeout(openai.chat.completions.create({
          model: AI_MODEL,
          temperature: 0,
          max_tokens: AI_MAX_TOKENS,
          messages: [
            {
              role: 'system',
              content:
                'You are a strict JSON repair utility. You will be given text that is intended to be a single JSON object but may be invalid (missing commas/quotes/braces, truncated, etc.). Return ONLY a valid JSON object. Preserve keys/values when possible. If a value is incomplete, replace it with an empty string, empty array, or empty object as appropriate. Do not add commentary.',
            },
            { role: 'user', content: input },
          ],
          response_format: { type: 'json_object' as const },
        }), maxWait, 'repair')
        await logAiUsage({ operation: 'generate-content:repair', userId: usageUserId, model: AI_MODEL }, repair.usage)
        const repaired = repair.choices[0]?.message?.content || ''
        return parseModelJson(repaired)
      }

      const shouldRetry =
        finish === 'length' ||
        /unterminated|string|json|unexpected end|expected/i.test(errorMessage)

      if (shouldRetry && timeLeft() > 14_000) {
        const retry = await run(AI_MODEL, { maxTokens: 2400, temperature: 0.2 })
        const retryContent = retry.choices[0]?.message?.content || ''
        try {
          parsed = parseModelJson(retryContent)
        } catch {
          try {
            parsed = await repairJsonWithModel(retryContent || content)
          } catch {
            return buildFallbackResponse('json_repair_failed_after_retry', productAnalysis)
          }
        }
      } else {
        try {
          parsed = await repairJsonWithModel(content)
        } catch {
          return buildFallbackResponse('json_repair_failed', productAnalysis)
        }
      }
    }
    const normalized = normalizeGeneratedContent(name, parsed, productAnalysis)
    return buildFinalResponse(normalized, { source: 'openai', analysis_used: !!productAnalysis })
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : String(error)
    console.error('OpenAI Error:', message)
    return buildFallbackResponse(message)
  }
}
