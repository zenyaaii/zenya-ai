'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import Link from 'next/link'
import { themePreview, themePreviewFallback } from '@/lib/theme-previews'

/**
 * Template carousel — inspired by the reference "Great ideas live here" gallery.
 *
 * A horizontal coverflow: ONE card sits sharp and centered (what the user is
 * meant to look at), the immediate neighbours peek in from the left/right
 * slightly smaller and blurred, and the cards behind those are tucked further
 * back, mostly hidden — the user scrolls / drags / taps to bring them to the
 * centre. Tap the centre card to open its live preview.
 */

type Template = {
  id: string                    // business_type used by the wizard + demo routes
  name: string
  /** Short Arabic descriptor under the name. */
  tagline: string
  /** Pre-built section count — the little stat on the card. */
  sections: number
  /** Screenshot URL — replaces the gradient placeholder when it loads. */
  image?: string
  /** Accent gradient for the placeholder card. */
  gradient: string
  /** Pre-existing public demo route for the "Live view" button. */
  demoHref: string
  /** Where the "Build" button goes — wizard for that template. */
  buildHref: string
}

// All fields below mirror the canonical /themes page (the single source of
// truth for template metadata in the marketing surface). If you rename a
// template, change a demo URL, or swap a cover photo, update /themes first
// and then mirror here — don't drift.
const TEMPLATES: Template[] = [
  {
    id: 'restaurant',
    name: 'مطعم',
    tagline: 'قائمة · حجوزات',
    sections: 13,
    gradient: 'linear-gradient(135deg, #1a1410 0%, #0a0a0c 100%)',
    image: themePreview('restaurant'),
    demoHref: '/demo/restaurant',
    buildHref: '/theme/new?type=restaurant',
  },
  {
    id: 'one_product',
    name: 'متجر',
    tagline: 'مسار شوبيفاي',
    sections: 24,
    gradient: 'linear-gradient(135deg, #5e6ad2 0%, #7170ff 100%)',
    image: themePreview('one_product'),
    demoHref: '/demo',
    buildHref: '/build',
  },
  {
    id: 'atlas',
    name: 'تطبيق',
    tagline: 'صفحة هبوط',
    sections: 12,
    gradient: 'linear-gradient(135deg, #4338ca 0%, #818cf8 100%)',
    image: themePreview('atlas'),
    demoHref: '/demo/atlas',
    buildHref: '/theme/new/atlas',
  },
  {
    id: 'services',
    name: 'خدمات',
    tagline: 'حِرف · صالونات',
    sections: 13,
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    image: themePreview('services'),
    demoHref: '/demo/services',
    buildHref: '/theme/new?type=services',
  },
  {
    id: 'collective',
    name: 'تشكيلة',
    tagline: 'منتجات متعددة',
    sections: 10,
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    image: themePreview('collective'),
    demoHref: '/demo/collective',
    buildHref: '/theme/new/collective',
  },
  {
    id: 'studio',
    name: 'ستوديو',
    tagline: 'قصة علامة',
    sections: 12,
    gradient: 'linear-gradient(135deg, #1c1c1c 0%, #4a4a4a 100%)',
    image: themePreview('studio'),
    demoHref: '/demo/studio',
    buildHref: '/theme/new/studio',
  },
  {
    id: 'lookbook',
    name: 'أزياء',
    tagline: 'لوك بوك',
    sections: 11,
    gradient: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
    image: themePreview('lookbook'),
    demoHref: '/demo/lookbook',
    buildHref: '/theme/new/lookbook',
  },
  {
    id: 'wellness',
    name: 'عافية',
    tagline: 'سبا · يوغا',
    sections: 12,
    gradient: 'linear-gradient(135deg, #15803d 0%, #86efac 100%)',
    image: themePreview('wellness'),
    demoHref: '/demo/wellness',
    buildHref: '/theme/new/wellness',
  },
]

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export default function TemplateStackSection() {
  const [active, setActive] = useState<Template | null>(null)
  // Start near the middle so both sides have neighbours to peek.
  const [index, setIndex] = useState(3)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const go = (dir: number) => setIndex((i) => clamp(i + dir, 0, TEMPLATES.length - 1))

  // Geometry — tuned per breakpoint so the neighbours peek without crowding.
  const cardW = compact ? 230 : 300
  const stageH = compact ? 400 : 460
  const xStep1 = compact ? 168 : 240   // first neighbour offset
  const xStep2 = compact ? 224 : 320   // tucked-behind offset

  return (
    <section
      aria-labelledby="template-stack-heading"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      {/* Faint glow concentrating light behind the centred card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[600px] -translate-y-1/2"
        style={{
          background:
            'radial-gradient(48% 50% at 50% 46%, rgba(94,106,210,0.14), transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.h2
          id="template-stack-heading"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="text-[36px] font-[590] tracking-[-1.2px] text-foreground sm:text-[52px] sm:tracking-[-2px]"
        >
          قوالب قابلة للتخصيص
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.06, ease: EASE_OUT }}
          className="mx-auto mt-4 max-w-xl text-[16px] leading-[1.8] text-muted"
        >
          مرّر يمينًا أو يسارًا لاستكشاف القوالب الثمانية — انقر القالب في المنتصف
          لمعاينته مباشرةً.
        </motion.p>
      </div>

      {/* ── Coverflow stage ── */}
      <div
        className="relative mx-auto mt-14 w-full max-w-5xl select-none px-4"
        style={{ height: stageH }}
      >
        {/* Drag layer carries the whole stack; it snaps back and we change the
            centred index on release. */}
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_e, info: PanInfo) => {
            if (info.offset.x < -60) go(1)
            else if (info.offset.x > 60) go(-1)
          }}
        >
          {TEMPLATES.map((t, i) => {
            const offset = i - index
            const abs = Math.abs(offset)
            const sign = Math.sign(offset)
            const isCenter = offset === 0
            const hidden = abs > 2

            const x = sign * (abs === 1 ? xStep1 : abs === 2 ? xStep2 : xStep2 + 40)
            const scale = isCenter ? 1 : abs === 1 ? 0.82 : 0.66
            const opacity = hidden ? 0 : isCenter ? 1 : abs === 1 ? 0.8 : 0.4
            const blur = isCenter ? 0 : abs === 1 ? 2.5 : 5

            return (
              // Resting position lives in inline style (transform/opacity/blur)
              // so it renders correctly without depending on any JS animation
              // loop; the CSS transition smooths movement when the index changes.
              <div
                key={t.id}
                className="absolute top-0"
                style={{
                  left: '50%',
                  marginLeft: -cardW / 2,
                  width: cardW,
                  zIndex: 20 - abs,
                  pointerEvents: hidden ? 'none' : 'auto',
                  transform: `translateX(${x}px) scale(${scale})`,
                  opacity,
                  filter: `blur(${blur}px)`,
                  transition:
                    'transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease, filter 0.55s ease',
                }}
              >
                <CarouselCard
                  template={t}
                  active={isCenter}
                  height={stageH - (compact ? 40 : 60)}
                  onClick={() => (isCenter ? setActive(t) : setIndex(i))}
                />
              </div>
            )
          })}
        </motion.div>

        {/* Prev / Next arrows */}
        <CarouselArrow side="right" disabled={index === 0} onClick={() => go(-1)} />
        <CarouselArrow
          side="left"
          disabled={index === TEMPLATES.length - 1}
          onClick={() => go(1)}
        />
      </div>

      {/* Dots */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-label={`اذهب إلى قالب ${t.name}`}
            onClick={() => setIndex(i)}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === index ? 22 : 8,
              background: i === index ? 'var(--primary)' : 'rgba(28,28,28,0.18)',
            }}
          />
        ))}
      </div>

      {/* Action buttons (mirror the reference's Create / See all) */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/theme/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          أنشئ قالبك
        </Link>
        <Link
          href="/themes"
          className="inline-flex items-center gap-2 rounded-full border border-token bg-white/70 px-6 py-3 text-[14px] font-semibold text-foreground backdrop-blur transition hover:bg-white"
        >
          شاهد كل القوالب
        </Link>
      </div>

      <AnimatePresence>
        {active && (
          <TemplatePreviewModal template={active} onClose={() => setActive(null)} />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ----------------------------------------------------------------------- */

function CarouselCard({
  template,
  active,
  height,
  onClick,
}: {
  template: Template
  active: boolean
  height: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      dir="rtl"
      onClick={onClick}
      aria-label={active ? `معاينة قالب ${template.name}` : `اعرض قالب ${template.name} في المنتصف`}
      className="group/card block w-full text-right focus:outline-none"
      style={{ height }}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[24px] p-3"
        style={{
          background: active ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: active
            ? '0 40px 90px -30px rgba(40,44,92,0.55), 0 4px 12px rgba(40,44,92,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 20px 50px -28px rgba(40,44,92,0.4), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        {/* Top row — type pill + live dot */}
        <div className="mb-2.5 flex items-center justify-between px-1">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold text-primary"
            style={{ background: 'rgba(94,106,210,0.10)' }}
          >
            {template.sections} قسمًا
          </span>
          <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            مباشر
          </span>
        </div>

        {/* Preview thumbnail */}
        <div
          className="relative w-full flex-1 overflow-hidden rounded-[16px]"
          style={{ boxShadow: '0 0 0 1px rgba(28,28,28,0.06)' }}
        >
          {template.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.image}
              alt={template.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-[1.05]"
              onError={(e) => {
                const fb = themePreviewFallback(template.id)
                if (e.currentTarget.src !== fb) e.currentTarget.src = fb
              }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: template.gradient }}
            >
              <span className="font-brandmark text-2xl text-white">زينيا</span>
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.32), transparent)' }}
          />
        </div>

        {/* Name + tagline */}
        <div className="px-1 pt-3 pb-1 text-center">
          <div className="font-brandmark text-[22px] font-extrabold leading-tight text-foreground">
            {template.name}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">{template.tagline}</div>
        </div>

        {/* Centre card gets a clear call-to-action affordance */}
        {active && (
          <div className="px-1 pb-1 pt-1.5">
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 text-[12.5px] font-semibold text-white">
              عاين القالب
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

function CarouselArrow({
  side,
  disabled,
  onClick,
}: {
  side: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'القالب التالي' : 'القالب السابق'}
      className="absolute top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-token bg-white/85 text-foreground shadow-lg backdrop-blur transition hover:bg-white disabled:cursor-default disabled:opacity-0"
      style={{ [side]: 4 } as React.CSSProperties}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {side === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </button>
  )
}

/* ----------------------------------------------------------------------- */

function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: Template
  onClose: () => void
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${template.name} preview`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(15,15,18,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        style={{
          width: '100%', maxWidth: 720,
          background: 'white',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        }}
      >
        {/* Close (top-right) */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {template.name}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق المعاينة"
            className="rounded-full p-1.5 text-muted hover:bg-black/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* The "box" — a miniaturized live render of the real demo
            landing page, served via a scaled iframe. What the user sees
            here is what they get if they click Full preview. */}
        <ScaledDemoPreview template={template} />


        {/* Two buttons under the box */}
        <div className="mt-5 flex gap-3">
          <Link
            href={template.buildHref}
            className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 active:scale-[0.99]"
          >
            أنشئ
          </Link>
          <Link
            href={template.demoHref}
            target="_blank"
            className="flex-1 rounded-xl border border-token bg-white py-3 text-center text-sm font-semibold text-foreground transition hover:bg-black/5 active:scale-[0.99]"
          >
            معاينة كاملة ←
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ----------------------------------------------------------------------- */

/**
 * Scaled iframe of the real /demo/{template} page.
 *
 * The iframe renders the page at a desktop viewport (1440×900) and the
 * outer wrapper scales it down 50% to fit the modal box. So the user sees
 * exactly what the full landing page looks like, just miniaturized — not
 * a hand-drawn approximation.
 *
 * pointer-events: none on the iframe so we don't trap mouse / scroll
 * inside it. The whole box is wrapped in an anchor that opens the full
 * demo in a new tab — clicking the preview IS clicking "Full preview".
 */
function ScaledDemoPreview({ template }: { template: Template }) {
  const [loaded, setLoaded] = useState(false)

  // Reset the loaded flag when the template changes (modal reopens
  // for a different card).
  useEffect(() => {
    setLoaded(false)
  }, [template.id])

  return (
    <a
      href={template.demoHref}
      target="_blank"
      rel="noreferrer"
      aria-label={`افتح معاينة ${template.name} الكاملة في تبويب جديد`}
      title="انقر لفتح المعاينة الكاملة"
      className="group relative block overflow-hidden rounded-2xl bg-white"
      style={{
        aspectRatio: '16 / 10',
        border: '1px solid rgba(28,28,28,0.08)',
        boxShadow: '0 8px 24px rgba(28,28,28,0.10) inset',
      }}
    >
      {/* The scaled iframe — 2× the box, transform: scale(0.5) brings it
          back. We render at 1440×900 internally so the demo's responsive
          breakpoints all fire at desktop and the page looks like itself. */}
      <iframe
        key={template.id}
        src={template.demoHref}
        title={`معاينة ${template.name} الحية`}
        loading="lazy"
        scrolling="no"
        onLoad={() => setLoaded(true)}
        style={{
          width: '1440px',
          height: '900px',
          border: 'none',
          background: 'white',
          transformOrigin: 'top left',
          transform: 'scale(0.5)',
          pointerEvents: 'none',
          // Sit absolute so the scaled overflow is clipped by the parent.
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Shimmer until the iframe fires onLoad. Most demos pop within
          ~1s on warm cache; first cold click can take 2-3s. */}
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              'linear-gradient(120deg, #f4f1ea 0%, #ffffff 40%, #f4f1ea 80%)',
            backgroundSize: '200% 100%',
            animation: 'zenya-shimmer 1.6s ease-in-out infinite',
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            جارٍ تحميل المعاينة…
          </div>
          <style>{`
            @keyframes zenya-shimmer {
              0%   { background-position: 200% 0%; }
              100% { background-position: -100% 0%; }
            }
          `}</style>
        </div>
      )}

      {/* Subtle hover veil → "click to open full preview" affordance */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(180deg, transparent 60%, rgba(15,15,18,0.55) 100%)',
        }}
      >
        <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-foreground shadow-sm">
          افتح المعاينة الكاملة ↗
        </span>
      </div>
    </a>
  )
}
