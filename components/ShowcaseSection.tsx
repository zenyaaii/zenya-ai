'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, type PanInfo } from 'framer-motion'
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Shirt,
  LayoutDashboard,
  Feather,
  Store,
  Wrench,
  Leaf,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { auroraTints, BUSINESS_TYPE_ORDER } from '@/lib/aurora-tints'
import { Reveal } from '@/components/marketing/Reveal'

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Card content — the arc shows information tiles now, not screenshots.
 *  `pitch` is the one-line hook shown on the card. `article` is the URL
 *  the READ MORE button opens (per-template long-form editorial). */
const TYPE_META: Record<
  string,
  { icon: LucideIcon; pitch: string; article: string }
> = {
  one_product: {
    icon: ShoppingBag,
    pitch: 'صفحة هبوط مبنيّة للتحويل، لمنتج واحد يستحقّ رحلة كاملة.',
    article: '/why/one_product',
  },
  restaurant: {
    icon: Utensils,
    pitch: 'قائمة رقمية، حجوزات فورية، وقصّة الشيف — تجربة تبدأ قبل الطاولة.',
    article: '/why/restaurant',
  },
  atlas: {
    icon: LayoutDashboard,
    pitch: 'صفحة هبوط تشرح تطبيقك في خمس ثوانٍ وتُحوِّل الزائر إلى مستخدم.',
    article: '/why/atlas',
  },
  lookbook: {
    icon: Shirt,
    pitch: 'لوك بوك تحريري يرفع علامتك من «متجر» إلى «قصّة تُشترى».',
    article: '/why/lookbook',
  },
  collective: {
    icon: Store,
    pitch: 'مجموعات منسَّقة تقود العميل بين منتجاتك بدل تركه في متاهة.',
    article: '/why/collective',
  },
  studio: {
    icon: Feather,
    pitch: 'قصّة علامة يقرأها الصحفي قبل الزبون، ويشاركها المؤسّس بفخر.',
    article: '/why/studio',
  },
  services: {
    icon: Wrench,
    pitch: 'واجهة، إثباتات، وطلب عرض سعر — كل ما يحتاجه مقدّم الخدمة ليُختار.',
    article: '/why/services',
  },
  wellness: {
    icon: Leaf,
    pitch: 'موقع هادئ يبدأ الجلسة قبل أن يخطو العميل داخل المركز.',
    article: '/why/wellness',
  },
}

const AUTOPLAY_MS = 7000
const RESUME_MS = 4000

const wrap = (n: number, len: number) => ((n % len) + len) % len

export default function ShowcaseSection() {
  const [index, setIndex] = useState(2)
  const [compact, setCompact] = useState(false)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = BUSINESS_TYPE_ORDER.length

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Auto-advance RTL — cards flow from right to left (natural Arabic reading).
  // The visible "next" card is index+1; wrap at the end.
  useEffect(() => {
    if (paused || reduce) return
    const id = setInterval(() => {
      setIndex((i) => wrap(i + 1, total))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, reduce, total])

  // Any human interaction pauses autoplay for RESUME_MS. Then it resumes on
  // its own — so autoplay never fights the user, and the moment they walk
  // away it takes over again.
  function pokePause() {
    setPaused(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_MS)
  }

  const go = (dir: number) => {
    setIndex((i) => wrap(i + dir, total))
    pokePause()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') go(1)
      else if (e.key === 'ArrowRight') go(-1)
    }
    const el = stageRef.current
    if (!el) return
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Geometry — clean gap (step = card width) so no card overlaps the centre.
  // On mobile the whole rig shrinks so the immediate peekers still fit inside
  // a 375px viewport instead of getting swallowed by overflow-hidden.
  const cardW = compact ? 200 : 320
  const cardH = compact ? 320 : 440
  const stageH = compact ? 420 : 540
  const step = compact ? 180 : 320
  const arcDrop = compact ? 16 : 26
  const tiltDeg = 9

  return (
    <section
      aria-labelledby="showcase-heading"
      // overflow-hidden clips the tilted side-cards so the arc never spills
      // past the viewport — without this the ±440px offsets forced the whole
      // page into horizontal scroll on any screen narrower than ~1200px.
      className="relative overflow-hidden border-b border-token py-24 sm:py-32"
    >
      {/* Radial glow behind the centre */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[560px] -translate-y-1/2"
        style={{
          background:
            'radial-gradient(46% 55% at 50% 50%, rgba(94,106,210,0.10), transparent 72%)',
        }}
      />

      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker mb-4">ثمانية قوالب · لغة تصميم واحدة</p>
            <h2
              id="showcase-heading"
              className="heading-ar text-[clamp(32px,5vw,50px)] text-foreground"
            >
              مبنيّ بـ <span className="gradient-text">زينيا.</span>
            </h2>
          </div>
          <Link
            href="/themes"
            className="group inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted transition-colors hover:text-foreground"
          >
            استكشف كل القوالب
            <ArrowUpRight
              className="h-3.5 w-3.5 rtl-flip transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2.25}
            />
          </Link>
        </Reveal>
      </div>

      {/* Arc stage */}
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="قوالب زينيا"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={pokePause}
        className="relative mx-auto mt-6 w-full max-w-6xl select-none px-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        style={{ height: stageH, perspective: 1500 }}
      >
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragStart={pokePause}
          onDragEnd={(_e, info: PanInfo) => {
            if (info.offset.x < -60) go(1)
            else if (info.offset.x > 60) go(-1)
            else pokePause()
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {BUSINESS_TYPE_ORDER.map((key, i) => {
            // Signed wrap distance to the centred card, so the closest
            // instance of each template is what we position (avoids a card
            // slipping through the middle when we wrap).
            let offset = i - index
            if (offset > total / 2) offset -= total
            if (offset < -total / 2) offset += total

            const abs = Math.abs(offset)
            const sign = Math.sign(offset)
            const isCenter = offset === 0
            const hidden = abs > 2 // only ±2 visible

            const x = offset * step
            const y = abs * arcDrop
            const rot = offset * tiltDeg
            const rotY = -sign * Math.min(abs, 2) * 8
            const scale = 1 - Math.min(abs, 2) * 0.08
            const opacity = hidden ? 0 : abs >= 2 ? 0.5 : abs >= 1 ? 0.85 : 1
            const blur = abs >= 2 ? 4 : abs >= 1 ? 1.5 : 0

            const tint = auroraTints[key]
            const meta = TYPE_META[key]

            return (
              <div
                key={key}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: cardW,
                  height: cardH,
                  marginLeft: -cardW / 2,
                  marginTop: -cardH / 2,
                  zIndex: 30 - abs,
                  pointerEvents: hidden ? 'none' : 'auto',
                  transform: `translate3d(${x}px, ${y}px, ${isCenter ? 50 : 0}px) rotateY(${rotY}deg) rotateZ(${rot}deg) scale(${scale})`,
                  opacity,
                  filter: `blur(${blur}px)`,
                  transition: reduce
                    ? undefined
                    : 'transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, filter 0.5s ease',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity, filter',
                }}
              >
                <InfoCard
                  templateKey={key}
                  templateName={tint.label}
                  tint={tint}
                  meta={meta}
                  active={isCenter}
                  onSelect={() => {
                    if (!isCenter) setIndex(i)
                    pokePause()
                  }}
                />
              </div>
            )
          })}
        </motion.div>

        <ArcArrow side="right" onClick={() => go(-1)} />
        <ArcArrow side="left" onClick={() => go(1)} />
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {BUSINESS_TYPE_ORDER.map((key, i) => (
          <button
            key={key}
            type="button"
            aria-label={`اذهب إلى قالب ${auroraTints[key].label}`}
            onClick={() => {
              setIndex(i)
              pokePause()
            }}
            className="group flex h-6 min-w-[24px] items-center justify-center"
          >
            <span
              className="block h-2 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 24 : 8,
                background:
                  i === index
                    ? auroraTints[key].accent
                    : 'rgba(28,28,28,0.16)',
              }}
            />
          </button>
        ))}
      </div>

      {/* Subtle live-region tells screen readers when the card changes.
          Keeps autoplay accessible. */}
      <p className="sr-only" aria-live="polite">
        القالب المعروض الآن: {auroraTints[BUSINESS_TYPE_ORDER[index]].label}
      </p>
    </section>
  )
}

/* ────────────────────────── card ────────────────────────── */

function InfoCard({
  templateKey,
  templateName,
  tint,
  meta,
  active,
  onSelect,
}: {
  templateKey: string
  templateName: string
  tint: { accent: string; orb1: string; orb2: string; orb3?: string }
  meta: { icon: LucideIcon; pitch: string; article: string }
  active: boolean
  onSelect: () => void
}) {
  const Icon = meta.icon
  return (
    <div
      dir="rtl"
      onClick={onSelect}
      role={active ? undefined : 'button'}
      tabIndex={active ? -1 : 0}
      aria-label={active ? templateName : `اعرض قالب ${templateName} في المنتصف`}
      className="group/card relative block h-full w-full cursor-pointer focus:outline-none"
    >
      {/* Frosted tinted-glass card — information only. No screenshot.
          Matches the reference: icon, title, one-liner, READ MORE. */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-[28px] p-7 text-center"
        style={{
          background: `linear-gradient(160deg, ${tint.orb1} 0%, rgba(255,255,255,0.95) 45%, ${tint.orb2} 100%)`,
          backdropFilter: 'blur(22px) saturate(150%)',
          WebkitBackdropFilter: 'blur(22px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: active
            ? `0 44px 90px -32px ${tint.accent}55, 0 8px 20px rgba(28,28,28,0.10), inset 0 1px 0 rgba(255,255,255,0.95)`
            : '0 22px 50px -28px rgba(28,28,28,0.35), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        {/* Top ornament — the "star" slot in the reference. We use the
            template's icon so the eight cards are visually distinct at
            rest, matching the reference's card differentiation. */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-white"
            style={{
              background: tint.accent,
              boxShadow: `0 12px 24px -10px ${tint.accent}88`,
            }}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
            style={{ background: `${tint.accent}18`, color: tint.accent }}
          >
            <Sparkles className="h-2.5 w-2.5" strokeWidth={2.25} />
            قالب زينيا
          </span>
        </div>

        {/* Title + pitch — the info block */}
        <div className="flex flex-col items-center gap-3 px-1">
          <h3 className="font-brandmark text-[30px] font-extrabold leading-none text-foreground">
            {templateName}
          </h3>
          <p className="text-[14px] leading-[1.75] text-foreground/80">
            {meta.pitch}
          </p>
        </div>

        {/* READ MORE — the reference's key CTA. Opens the /why/[type]
            long-form article we built. Only clickable when card is
            centred; non-centred cards' whole surface just brings that
            card to the middle. */}
        {active ? (
          <Link
            href={meta.article}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[12.5px] font-semibold tracking-[0.14em] text-white transition hover:-translate-y-0.5"
            style={{ letterSpacing: '0.08em' }}
          >
            اقرأ المزيد
            <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" strokeWidth={2.5} />
          </Link>
        ) : (
          <div
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-dashed px-6 py-2.5 text-[12.5px] font-medium text-muted"
            style={{ borderColor: 'rgba(28,28,28,0.18)' }}
          >
            انقر للتمركز
          </div>
        )}
      </div>
    </div>
  )
}

function ArcArrow({
  side,
  onClick,
}: {
  side: 'left' | 'right'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'القالب التالي' : 'القالب السابق'}
      className="absolute top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-token bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white"
      style={{ [side]: 8 } as React.CSSProperties}
    >
      {side === 'left' ? (
        <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
      ) : (
        <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
      )}
    </button>
  )
}
