'use client'

/**
 * /demo/thread - a harness for choosing the scroll line.
 *
 * NOT a page of the site. It exists so the five ScrollThread variants can be
 * compared against real Zenya copy, in RTL, at real section heights, on the
 * real domain. app/(main)/page.tsx is untouched and nothing here is wired into
 * `/`. Once a variant is chosen, the pick is `<ScrollThread />` dropped into
 * three sections of the real page and this route can be deleted.
 *
 * What the harness is proving:
 *   1. The line runs top to bottom and advances with the reader, not on a
 *      timer of its own. Scroll back up and it retreats.
 *   2. It appears three times across six sections, and alternates corners.
 *      Sections 1, 3 and 5 carry nothing, which is what stops it reading as
 *      wallpaper.
 *   3. It sits in a corner. It never crosses the column of text.
 *   4. Its colour is one of the three already in globals.css, and the whole
 *      page (switcher included) takes that colour, so there is never more than
 *      one accent on screen.
 *
 * Below lg the thread is not rendered at all: sections are max-w-6xl, so under
 * 1024px there is no gutter left for it to sit in.
 */

import { useState } from 'react'
import ScrollThread, {
  type ThreadVariant,
} from '@/components/marketing/ScrollThread'

const VARIANTS: Array<{
  id: ThreadVariant
  name: string
  note: string
  tone: string
}> = [
  {
    id: 'filament',
    name: 'الخيط',
    note: 'خط شعري واحد ينساب مع القراءة، ورأس مضيء يسبقه. الأهدأ.',
    tone: '#5e6ad2',
  },
  {
    id: 'ribbon',
    name: 'الشريط',
    note: 'شريط عريض يذوب طرفاه، الأقرب إلى المرجع الذي أرسلته.',
    tone: '#5e6ad2',
  },
  {
    id: 'circuit',
    name: 'الوصلة',
    note: 'مسار بزوايا قائمة ونقاط تضيء عند كل منعطف. لغة تقنية.',
    tone: '#d97706',
  },
  {
    id: 'serpent',
    name: 'الحبل',
    note: 'خصلتان متعاكستان تتمايلان ببطء. هذه التي تتحرّك كالأفعى.',
    tone: '#27a644',
  },
  {
    id: 'strata',
    name: 'الطبقات',
    note: 'ليست خطًا: عمود من الشُّرَط يمتدّ واحدة تلو الأخرى.',
    tone: '#5e6ad2',
  },
]

const STEPS = [
  {
    title: 'اختر قالبك',
    desc: 'ثمانية للاختيار: مطعم، أو لوك بوك، أو صفحة هبوط لتطبيق، أو قصة علامة، أو عافية، أو كتالوج، أو خدمات، أو متجر شوبيفاي بمنتج واحد.',
  },
  {
    title: 'اكتب نبذة أو ألصق رابطًا',
    desc: 'تطلب معظم القوالب نموذجًا قصيرًا: قائمتك، وخدماتك، وساعات عملك. أما مسار شوبيفاي بمنتج واحد فيحتاج فقط رابط المنتج.',
  },
  {
    title: 'انطلق فورًا',
    desc: 'احصل على موقع معاينة مُستضاف يمكنك نشره اليوم، أو نزّل ملف ثيم شوبيفاي كاملًا. كل شيء قابل للتعديل.',
  },
]

const FEATURES = [
  {
    title: 'تصميم متقن',
    desc: 'طباعة تحريرية، وألوان مدروسة، ومسافات فاخرة، تُطبَّق تلقائيًا على كل قسم.',
  },
  {
    title: 'جاهز خلال دقائق',
    desc: 'اختر قالبًا، اكتب نبذتك أو ألصق رابطًا، ويُكتب موقع كامل ويُصمَّم ويُعرَض.',
  },
  {
    title: 'محتوى بذوق رفيع',
    desc: 'عناوين، وأسئلة شائعة، وقوائم، مكتوبة خصيصًا لنشاطك. بلا عبارات مكرّرة ولا حشو.',
  },
]

export default function ThreadDemo() {
  const [variant, setVariant] = useState<ThreadVariant>('filament')
  const current = VARIANTS.find((v) => v.id === variant)!
  const tone = current.tone

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f7f4ed] text-[#1c1c1c]">
      {/* 1. Opening. No thread here on purpose: the line should not be the
             first thing the page says. */}
      <section className="relative border-b border-[#e5e2d9]">
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-24 md:pt-28">
          <h1 className="text-[clamp(34px,5.4vw,56px)] font-bold leading-[1.24] tracking-normal">
            الخط الذي ينزل مع القارئ
          </h1>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.9] text-[#5f5f5d]">
            خمس صياغات للفكرة نفسها. اختر واحدة من الشريط أسفل الشاشة، ثم مرّر
            الصفحة. الخط يتقدّم بتقدّمك ويتراجع إذا عدت إلى الأعلى، ويظهر في
            ثلاثة أقسام من ستة فقط، مرة عن اليمين ومرة عن اليسار.
          </p>

          <dl className="mt-12 grid gap-x-10 gap-y-5 border-t border-[#e5e2d9] pt-8 sm:grid-cols-2">
            <div>
              <dt className="text-[13px] text-[#5f5f5d]">الاختيار الحالي</dt>
              <dd
                className="mt-1 text-[19px] font-semibold"
                style={{ color: tone }}
              >
                {current.name}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#5f5f5d]">وصفه</dt>
              <dd className="mt-1 text-[15px] leading-[1.8]">{current.note}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 2. Thread, start corner (the right-hand one under RTL). */}
      <section className="relative border-b border-[#e5e2d9]">
        <ScrollThread variant={variant} side="start" tone={tone} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-32">
          <h2 className="text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.35]">
            ثلاث خطوات، ولا سطر برمجي واحد
          </h2>
          <ol className="mt-14 grid gap-14">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid gap-3 sm:grid-cols-[3rem_1fr]">
                <span
                  className="font-mono text-[15px] leading-[1.9]"
                  style={{ color: tone }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-[20px] font-semibold leading-[1.5]">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-[54ch] text-[15px] leading-[1.9] text-[#5f5f5d]">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. Bare. The gap is the point: it is what keeps the line from
             becoming background. */}
      <section className="relative border-b border-[#e5e2d9]">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-40">
          <p className="max-w-[46ch] text-[clamp(21px,2.6vw,30px)] font-medium leading-[1.6]">
            هذا القسم بلا خط. لو ظهر في كل قسم لتحوّل إلى خلفية، ولتوقّف القارئ
            عن رؤيته.
          </p>
        </div>
      </section>

      {/* 4. Thread, opposite corner. */}
      <section className="relative border-b border-[#e5e2d9]">
        <ScrollThread variant={variant} side="end" tone={tone} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-32">
          <h2 className="text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.35]">
            ما الذي يميّزها
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-lg bg-[#e5e2d9] sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={[
                  'bg-[#ffffff] p-8',
                  i === 0 ? 'sm:col-span-2' : '',
                ].join(' ')}
              >
                <h3 className="text-[19px] font-semibold leading-[1.5]">
                  {f.title}
                </h3>
                <p className="mt-2 max-w-[54ch] text-[15px] leading-[1.9] text-[#5f5f5d]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bare. */}
      <section className="relative border-b border-[#e5e2d9]">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-40">
          <p className="max-w-[48ch] text-[15px] leading-[1.9] text-[#5f5f5d]">
            لون الخط ليس جديدًا. هو أحد الثلاثة الموجودة في globals.css أصلًا،
            وتتبعه الصفحة كلها بما فيها الشريط أسفل الشاشة، حتى لا يجتمع لونان
            على شاشة واحدة.
          </p>
        </div>
      </section>

      {/* 6. Thread returns to the start corner, closing the alternation. */}
      <section className="relative">
        <ScrollThread variant={variant} side="start" tone={tone} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-56 pt-32">
          <h2 className="text-[clamp(26px,3.4vw,38px)] font-bold leading-[1.35]">
            ابدأ موقعك اليوم
          </h2>
          <p className="mt-5 max-w-[48ch] text-[16px] leading-[1.9] text-[#5f5f5d]">
            اختر قالبًا، واكتب نبذة قصيرة عن نشاطك، وشاهد الموقع يُبنى أمامك.
          </p>
          <a
            href="/build"
            className="mt-9 inline-flex items-center rounded-lg px-6 py-3 text-[15px] font-semibold text-white transition-transform active:translate-y-[1px]"
            style={{ background: tone }}
          >
            ابدأ الآن
          </a>
        </div>
      </section>

      {/* The picker. Fixed, so a variant can be swapped without losing your
          scroll position and the same stretch of page can be compared. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-5">
        <div className="pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#e5e2d9] bg-white/92 p-1.5 shadow-[0_8px_28px_rgba(28,28,28,0.08)] backdrop-blur">
          {VARIANTS.map((v) => {
            const active = v.id === variant
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariant(v.id)}
                aria-pressed={active}
                className="shrink-0 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors active:translate-y-[1px]"
                style={
                  active
                    ? { background: v.tone, color: '#ffffff' }
                    : { color: '#1c1c1c' }
                }
              >
                {v.name}
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
