'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { themePreview, themePreviewFallback } from '@/lib/theme-previews'

/**
 * Inspired by Shopify's "Customizable themes" homepage section —
 * a 3D fan/stack of theme cards that animates in as you scroll to it.
 * Click a card → preview box opens with two CTAs (Build / Live view).
 *
 * The 8 cards are placeholders: a colored gradient + the template name.
 * Drop screenshots into `image` per template when ready and the
 * gradient falls away automatically.
 */

type Template = {
  id: string                    // business_type used by the wizard + demo routes
  name: string
  /** Optional screenshot URL — when set, replaces the gradient placeholder. */
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
    gradient: 'linear-gradient(135deg, #1a1410 0%, #0a0a0c 100%)',
    image: themePreview('restaurant'),
    demoHref: '/demo/restaurant',
    buildHref: '/theme/new?type=restaurant',
  },
  {
    id: 'one_product',
    name: 'متجر',
    gradient: 'linear-gradient(135deg, #5e6ad2 0%, #7170ff 100%)',
    image: themePreview('one_product'),
    demoHref: '/demo',
    buildHref: '/theme/new',
  },
  {
    id: 'atlas',
    name: 'تطبيق',
    gradient: 'linear-gradient(135deg, #4338ca 0%, #818cf8 100%)',
    image: themePreview('atlas'),
    demoHref: '/demo/atlas',
    buildHref: '/theme/new/atlas',
  },
  {
    id: 'services',
    name: 'خدمات',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    image: themePreview('services'),
    demoHref: '/demo/services',
    buildHref: '/theme/new?type=services',
  },
  {
    id: 'collective',
    name: 'تشكيلة',
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    image: themePreview('collective'),
    demoHref: '/demo/collective',
    buildHref: '/theme/new/collective',
  },
  {
    id: 'studio',
    name: 'ستوديو',
    gradient: 'linear-gradient(135deg, #1c1c1c 0%, #4a4a4a 100%)',
    image: themePreview('studio'),
    demoHref: '/demo/studio',
    buildHref: '/theme/new/studio',
  },
  {
    id: 'lookbook',
    name: 'أزياء',
    gradient: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
    image: themePreview('lookbook'),
    demoHref: '/demo/lookbook',
    buildHref: '/theme/new/lookbook',
  },
  {
    id: 'wellness',
    name: 'عافية',
    gradient: 'linear-gradient(135deg, #15803d 0%, #86efac 100%)',
    image: themePreview('wellness'),
    demoHref: '/demo/wellness',
    buildHref: '/theme/new?type=wellness',
  },
]

/** Symmetric fan positions for desktop. 8 cards: 4 left, 4 right of center. */
const FAN_POSITIONS = [
  { x: -360, y: 80,  rotate: -22 },
  { x: -240, y: 38,  rotate: -14 },
  { x: -120, y: 12,  rotate:  -7 },
  { x:  -30, y:  0,  rotate:  -2 },
  { x:   30, y:  0,  rotate:   2 },
  { x:  120, y: 12,  rotate:   7 },
  { x:  240, y: 38,  rotate:  14 },
  { x:  360, y: 80,  rotate:  22 },
] as const

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function TemplateStackSection() {
  const [active, setActive] = useState<Template | null>(null)

  return (
    <section
      aria-labelledby="template-stack-heading"
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* Soft tint behind the stack */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[600px] -translate-y-1/2"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(94,106,210,0.10), transparent 70%)',
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
      </div>

      {/* Desktop fan */}
      <div className="relative mx-auto mt-16 hidden h-[440px] max-w-6xl items-end justify-center px-6 md:flex">
        {TEMPLATES.map((t, i) => {
          const pos = FAN_POSITIONS[i]
          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => setActive(t)}
              aria-label={`معاينة قالب ${t.name}`}
              className="group absolute bottom-0 cursor-pointer focus:outline-none"
              style={{ transformOrigin: 'bottom center' }}
              initial={{ x: 0, y: 30, rotate: 0, opacity: 0, scale: 0.7 }}
              whileInView={{
                x: pos.x,
                y: pos.y,
                rotate: pos.rotate,
                opacity: 1,
                scale: 1,
              }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.85,
                ease: EASE_OUT,
                delay: 0.05 * Math.abs(i - TEMPLATES.length / 2 + 0.5),
              }}
              whileHover={{
                y: pos.y - 18,
                scale: 1.04,
                rotate: pos.rotate * 0.4,
                transition: { duration: 0.25, ease: EASE_OUT },
              }}
            >
              <TemplateCard template={t} size="lg" />
            </motion.button>
          )
        })}
      </div>

      {/* Mobile grid fallback — the fan would just be cramped junk on
          phones. Show a clean 2-col grid instead. */}
      <div className="mx-auto mt-12 grid max-w-md grid-cols-2 gap-4 px-6 md:hidden">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t)}
            className="block focus:outline-none"
          >
            <TemplateCard template={t} size="sm" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <TemplatePreviewModal
            template={active}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* ----------------------------------------------------------------------- */

function TemplateCard({ template, size }: { template: Template; size: 'lg' | 'sm' }) {
  const dims =
    size === 'lg'
      ? { width: 220, height: 290 }
      : { width: '100%', height: 200 }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white"
      style={{
        width: dims.width,
        height: dims.height,
        boxShadow:
          '0 24px 60px -20px rgba(28,28,28,0.32), 0 0 0 1px rgba(28,28,28,0.04)',
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex h-7 items-center gap-1.5 border-b px-3"
        style={{ background: '#f7f4ed', borderColor: 'rgba(28,28,28,0.06)' }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: '#fb7185' }} />
        <span className="h-2 w-2 rounded-full" style={{ background: '#fbbf24' }} />
        <span className="h-2 w-2 rounded-full" style={{ background: '#34d399' }} />
      </div>

      {/* Body — screenshot if provided, gradient placeholder otherwise */}
      {template.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.image}
          alt={template.name}
          className="h-full w-full object-cover"
          style={{ height: 'calc(100% - 28px)' }}
          onError={(e) => {
            const fb = themePreviewFallback(template.id)
            if (e.currentTarget.src !== fb) e.currentTarget.src = fb
          }}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center text-white"
          style={{
            background: template.gradient,
            height: 'calc(100% - 28px)',
          }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] opacity-70">
            زينيا
          </div>
          <div className="mt-1 text-lg font-bold tracking-tight">{template.name}</div>
        </div>
      )}
    </div>
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
