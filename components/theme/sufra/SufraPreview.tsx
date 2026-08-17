'use client'

/**
 * Sufra (سُفرة) — Middle-East restaurant template.
 *
 * Built against the SAME `RestaurantContent` shape as the original restaurant
 * theme, so it drops into the existing wizard, editor, mock content and
 * bookings without a new content pipeline.
 *
 * WHY IT LOOKS DIFFERENT (deliberate — don't "normalise" these back):
 * The stock AI restaurant page is: full-bleed photo hero with centred type →
 * three equal dish cards → tabbed menu → uniform photo grid. Every section here
 * intentionally uses a different layout family from that, and from its own
 * neighbours:
 *   hero      → split screen (type block beside the photo, not floating on it)
 *   ticker    → marquee band
 *   story     → asymmetric editorial, chef card overlapping the image
 *   dishes    → horizontal snap rail (not a 3-card grid)
 *   menu      → printed-menu columns with dotted leaders + a vertical category rail
 *   gallery   → asymmetric bento with mixed cell sizes
 *   visit     → full-width contrast band
 *   reviews   → one large pull quote (not a row of testimonial cards)
 * Section-layout families are never reused twice, and small uppercase eyebrows
 * are rationed (3 on the whole page) instead of sitting above every heading.
 *
 * Regional language is real, not costume: the lattice motif is a mashrabiya
 * khatim (eight-point star) drawn as an SVG pattern, and the display faces are
 * Kufic / Ruqaa / Naskh chosen per palette. No camels, lamps, or "Arabian
 * nights" clichés.
 */

import { useMemo, useRef, useState } from 'react'
import {
  motion, useReducedMotion, useScroll, useTransform, AnimatePresence,
} from 'framer-motion'
import { Phone, MapPin, Clock, ArrowLeft, Plus, Minus } from 'lucide-react'
import type { RestaurantContent } from '@/utils/restaurant/types'
import { getSufraPreset, type SufraPresetId } from '@/utils/sufra/presets'

const EASE = [0.22, 1, 0.36, 1] as const

/* ── motion kit — every animation degrades to nothing under reduced-motion ── */
function useMotionKit() {
  const reduce = !!useReducedMotion()
  return {
    reduce,
    reveal: {
      initial: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: EASE },
      viewport: { once: true, margin: '-80px' },
    },
    stagger: {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 } },
    },
    child: {
      hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 18 },
      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
    },
  }
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1360px] px-6 md:px-10 ${className}`}>{children}</div>
}

/** Mashrabiya lattice — khatim (8-point star) built from a diamond + square. */
function Lattice({ className = '', opacity = 0.14 }: { className?: string; opacity?: number }) {
  const id = useMemo(() => `sf-lat-${Math.random().toString(36).slice(2, 9)}`, [])
  return (
    <svg className={className} aria-hidden style={{ opacity }}>
      <defs>
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M22 1 L43 22 L22 43 L1 22 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="7.5" y="7.5" width="29" height="29" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** Rationed: only 3 of these on the whole page. */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="h-px w-8" style={{ background: 'var(--sf-accent)' }} />
      <span
        className="text-[0.7rem] uppercase"
        style={{ color: 'var(--sf-accent)', letterSpacing: '0.3em', fontWeight: 500 }}
      >
        {children}
      </span>
    </span>
  )
}

function Display({
  children, className = '', style,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <h2
      className={`text-[2.1rem] leading-[1.28] md:text-[3.2rem] ${className}`}
      style={{
        fontFamily: 'var(--sf-display)',
        color: 'var(--sf-text)',
        // Arabic is a connected script: negative tracking fights the cursive
        // joining, and tight leading clips ascenders/diacritics on calligraphic
        // faces (Ruqaa, Naskh). Keep tracking neutral and leading generous.
        letterSpacing: 'normal',
        paddingBlock: '0.06em',
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </h2>
  )
}

/* ───────────────────────────── root ───────────────────────────── */

export default function SufraPreview({
  content, presetId = 'basalt',
}: {
  content: RestaurantContent
  presetId?: SufraPresetId
}) {
  const preset = getSufraPreset(presetId)
  const c = preset.colors
  const hidden = new Set(content.hidden_sections || [])

  return (
    <div
      dir="rtl"
      data-sufra={preset.id}
      style={{
        '--sf-bg': c.background,
        '--sf-surface': c.surface,
        '--sf-text': c.text,
        '--sf-muted': c.muted,
        '--sf-accent': c.accent,
        '--sf-on-accent': c.onAccent,
        '--sf-contrast': c.contrast,
        '--sf-on-contrast': c.onContrast,
        '--sf-border': c.border,
        '--sf-display': preset.heading_font,
        '--sf-body': preset.body_font,
        background: c.background,
        color: c.text,
        fontFamily: preset.body_font,
      } as React.CSSProperties}
    >
      <TopBar content={content} />
      <Nav content={content} />
      {!hidden.has('hero') && <Hero content={content} dark={preset.dark} />}
      <Ticker content={content} />
      {!hidden.has('story') && <Story content={content} />}
      {!hidden.has('signature_dishes') && <Dishes content={content} />}
      {!hidden.has('menu') && <Menu content={content} />}
      {!hidden.has('gallery') && <Gallery content={content} />}
      {!hidden.has('hours_location') && <Visit content={content} />}
      {!hidden.has('reservations') && <Reservations content={content} />}
      {!hidden.has('reviews') && <Reviews content={content} />}
      {!hidden.has('press') && <Press content={content} />}
      {!hidden.has('faq') && <Faq content={content} />}
      <Footer content={content} />
    </div>
  )
}

/* ───────────────────────────── chrome ───────────────────────────── */

function TopBar({ content }: { content: RestaurantContent }) {
  const h = content.hours_location
  return (
    <div className="hidden border-b md:block" style={{ borderColor: 'var(--sf-border)' }}>
      <Container className="flex h-9 items-center justify-between text-[0.72rem]" >
        <div className="flex items-center gap-5" style={{ color: 'var(--sf-muted)' }}>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" strokeWidth={1.75} />{h.address}</span>
        </div>
        <div className="flex items-center gap-5" style={{ color: 'var(--sf-muted)' }}>
          <a href={`tel:${h.phone}`} className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70" dir="ltr">
            <Phone className="h-3 w-3" strokeWidth={1.75} />{h.phone}
          </a>
        </div>
      </Container>
    </div>
  )
}

const NAV_LINKS = [
  { href: '#story', label: 'الحكاية' },
  { href: '#menu', label: 'القائمة' },
  { href: '#gallery', label: 'المعرض' },
  { href: '#visit', label: 'زورونا' },
]

function Nav({ content }: { content: RestaurantContent }) {
  const [open, setOpen] = useState(false)
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ borderColor: 'var(--sf-border)', background: 'color-mix(in srgb, var(--sf-bg) 88%, transparent)' }}
    >
      {/* Single line, 64px — never a two-line or oversized nav. */}
      <Container className="flex h-16 items-center justify-between gap-6">
        <a href="#top" className="shrink-0" style={{ fontFamily: 'var(--sf-display)', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {content.brand.name}
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[0.82rem] transition-opacity hover:opacity-60"
              style={{ color: 'var(--sf-muted)', fontWeight: 500 }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#reservations"
            className="inline-flex items-center px-5 py-2.5 text-[0.72rem] uppercase transition-transform active:scale-[0.98]"
            style={{ background: 'var(--sf-accent)', color: 'var(--sf-on-accent)', letterSpacing: '0.18em', fontWeight: 600 }}
          >
            احجز
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center md:hidden"
            style={{ border: '1px solid var(--sf-border)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
              {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </Container>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden border-t md:hidden"
            style={{ borderColor: 'var(--sf-border)' }}
          >
            <Container className="flex flex-col py-2">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-[0.9rem]" style={{ color: 'var(--sf-text)' }}>
                  {l.label}
                </a>
              ))}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ───────────────────── hero — split screen ───────────────────── */

function Hero({ content, dark }: { content: RestaurantContent; dark: boolean }) {
  const { reduce } = useMotionKit()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '12%'])

  return (
    <section ref={ref} id="top" data-section="hero" className="relative border-b" style={{ borderColor: 'var(--sf-border)' }}>
      {/* Type beside the photo — not floating on top of it. On phones the
          image sits under the copy rather than behind it, so nothing competes
          with the headline. */}
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        <div className="relative flex items-center overflow-hidden">
          <Lattice className="pointer-events-none absolute -left-10 -top-10 h-64 w-64" opacity={0.12} />
          <Container className="relative py-16 md:py-24 lg:py-28">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.09 } } }}
              className="max-w-xl"
            >
              <motion.div variants={{ hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }} className="mb-7">
                <Kicker>{content.hero.eyebrow}</Kicker>
              </motion.div>
              <motion.h1
                variants={{ hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
                className="text-[2.7rem] leading-[1.24] md:text-[4rem] lg:text-[4.5rem]"
                style={{
                  fontFamily: 'var(--sf-display)',
                  // See Display(): no negative tracking on Arabic, and enough
                  // leading + padding that Ruqaa/Naskh diacritics never clip.
                  letterSpacing: 'normal',
                  paddingBlock: '0.08em',
                  fontWeight: 700,
                  whiteSpace: 'pre-line',
                }}
              >
                {content.hero.headline}
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
                className="mt-7 max-w-md text-[1rem] leading-[1.75]"
                style={{ color: 'var(--sf-muted)' }}
              >
                {content.hero.subheadline}
              </motion.p>
              <motion.div
                variants={{ hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <motion.a
                  href="#reservations"
                  className="inline-flex items-center gap-2 px-8 py-4 text-[0.75rem] uppercase"
                  style={{ background: 'var(--sf-accent)', color: 'var(--sf-on-accent)', letterSpacing: '0.2em', fontWeight: 600 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  {content.hero.primary_cta}
                </motion.a>
                <motion.a
                  href="#menu"
                  className="inline-flex items-center gap-2 px-8 py-4 text-[0.75rem] uppercase"
                  style={{ border: '1px solid var(--sf-border)', color: 'var(--sf-text)', letterSpacing: '0.2em', fontWeight: 500 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  {content.hero.secondary_cta}
                </motion.a>
              </motion.div>
            </motion.div>
          </Container>
        </div>

        <div className="relative min-h-[52vh] overflow-hidden lg:min-h-[86vh]">
          <motion.img
            src={content.hero.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ y: imgY, scale: reduce ? 1 : 1.08, filter: dark ? 'brightness(0.82)' : 'none' }}
          />
          {/* Hairline seam between type and photo, in the palette accent. */}
          <div className="absolute inset-y-0 right-0 w-px" style={{ background: 'var(--sf-accent)', opacity: 0.5 }} />
        </div>
      </div>
    </section>
  )
}

/* ───────────────────── ticker band ───────────────────── */

function Ticker({ content }: { content: RestaurantContent }) {
  const { reduce } = useMotionKit()
  const words = [
    content.brand.cuisine,
    content.brand.city,
    'موسمي',
    'على الفحم',
    content.brand.tagline,
    'مطبخ مفتوح',
  ].filter(Boolean)
  const run = [...words, ...words, ...words]

  return (
    <div className="overflow-hidden border-b py-4" style={{ borderColor: 'var(--sf-border)', background: 'var(--sf-surface)' }}>
      <div
        className="flex w-max items-center gap-10 whitespace-nowrap"
        style={reduce ? undefined : { animation: 'sufra-marquee 42s linear infinite' }}
      >
        {run.map((w, i) => (
          <span key={i} className="inline-flex items-center gap-10 text-[0.82rem]" style={{ color: 'var(--sf-muted)', letterSpacing: '0.12em' }}>
            {w}
            <span className="inline-block h-1 w-1 rounded-full" style={{ background: 'var(--sf-accent)' }} />
          </span>
        ))}
      </div>
      <style>{`@keyframes sufra-marquee { from { transform: translateX(0) } to { transform: translateX(33.333%) } }`}</style>
    </div>
  )
}

/* ───────────────────── story — asymmetric editorial ───────────────────── */

function Story({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const s = content.story
  return (
    <section id="story" data-section="story" className="py-24 md:py-36">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.div {...reveal} className="lg:col-span-5 lg:pt-12">
            <Display className="mb-7">{s.heading}</Display>
            <p className="text-[1.02rem] leading-[1.85]" style={{ color: 'var(--sf-muted)' }}>{s.body}</p>
          </motion.div>

          {/* Image offset lower than the text — asymmetry instead of a tidy
              50/50 split, with the chef card breaking the image edge. */}
          <motion.div {...reveal} className="relative lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={s.accent_image || content.hero.image} alt="" className="h-full w-full object-cover" />
            </div>
            {s.chef_name && (
              <div
                className="relative z-10 -mt-16 ms-auto me-6 flex max-w-sm items-center gap-4 p-5 lg:-mt-20"
                style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)' }}
              >
                {s.chef_photo && <img src={s.chef_photo} alt="" className="h-14 w-14 shrink-0 object-cover" />}
                <div className="min-w-0">
                  <p style={{ fontFamily: 'var(--sf-display)', fontSize: '1.05rem', fontWeight: 600 }}>{s.chef_name}</p>
                  {s.chef_title && (
                    <p className="mt-0.5 text-[0.72rem] uppercase" style={{ color: 'var(--sf-accent)', letterSpacing: '0.2em' }}>{s.chef_title}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

/* ───────────────────── dishes — horizontal snap rail ───────────────────── */

function Dishes({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const dishes = content.signature_dishes || []
  if (dishes.length === 0) return null
  return (
    <section data-section="signature_dishes" className="py-24 md:py-32" style={{ background: 'var(--sf-surface)' }}>
      <Container>
        <motion.div {...reveal} className="mb-10 flex items-end justify-between gap-6">
          <Display>{content.signature_dishes_heading || 'أطباق الدار'}</Display>
          <span className="hidden shrink-0 text-[0.75rem] md:inline" style={{ color: 'var(--sf-muted)' }}>
            اسحب للجانب ←
          </span>
        </motion.div>
      </Container>
      {/* Rail, not a grid: it reads as a chef's counter and keeps every dish
          photo large instead of shrinking three into a row. */}
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 md:px-10" style={{ scrollbarWidth: 'thin' }}>
        {dishes.map((d, i) => (
          <motion.article
            key={i}
            {...reveal}
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src={d.image} alt={d.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-5">
              <h3 style={{ fontFamily: 'var(--sf-display)', fontSize: '1.2rem', fontWeight: 600 }}>{d.name}</h3>
              <span className="shrink-0 text-[0.95rem] tabular-nums" style={{ color: 'var(--sf-accent)', fontWeight: 600 }}>{d.price}</span>
            </div>
            <p className="mt-2 text-[0.9rem] leading-[1.7]" style={{ color: 'var(--sf-muted)' }}>{d.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────── menu — printed-menu columns ───────────────────── */

function Menu({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const cats = content.menu.categories || []
  const [active, setActive] = useState(cats[0]?.id || '')
  const cat = cats.find((x) => x.id === active) || cats[0]
  if (!cat) return null

  return (
    <section id="menu" data-section="menu" className="py-24 md:py-36">
      <Container>
        <motion.div {...reveal} className="mb-12">
          <Kicker>{content.menu.subheading}</Kicker>
          <Display className="mt-5">{content.menu.heading}</Display>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-[minmax(160px,200px)_1fr] lg:gap-16">
          {/* Vertical category rail — a menu's index, not a row of pill tabs. */}
          <nav className="flex gap-x-6 gap-y-2 overflow-x-auto lg:flex-col lg:overflow-visible lg:border-e lg:pe-6" style={{ borderColor: 'var(--sf-border)' }}>
            {cats.map((x) => {
              const on = x.id === cat.id
              return (
                <button
                  key={x.id}
                  onClick={() => setActive(x.id)}
                  className="group shrink-0 py-2 text-start transition-opacity"
                  style={{ color: on ? 'var(--sf-text)' : 'var(--sf-muted)', opacity: on ? 1 : 0.75 }}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-px transition-all"
                      style={{ width: on ? 22 : 10, background: on ? 'var(--sf-accent)' : 'var(--sf-border)' }}
                    />
                    <span style={{ fontFamily: 'var(--sf-display)', fontSize: '1.02rem', fontWeight: on ? 600 : 500 }}>{x.name}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Dotted leaders — the one detail that makes a menu read as a menu. */}
          <div>
            {cat.description && (
              <p className="mb-8 max-w-xl text-[0.95rem] leading-[1.8]" style={{ color: 'var(--sf-muted)' }}>{cat.description}</p>
            )}
            <motion.ul
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="grid gap-x-14 gap-y-7 md:grid-cols-2"
            >
              {cat.items.map((it, i) => (
                <li key={i}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="shrink-0" style={{ fontFamily: 'var(--sf-display)', fontSize: '1.05rem', fontWeight: 600 }}>
                      {it.name}
                    </h3>
                    <span
                      className="min-w-6 flex-1 translate-y-[-4px] border-b border-dotted"
                      style={{ borderColor: 'var(--sf-border)' }}
                      aria-hidden
                    />
                    <span className="shrink-0 tabular-nums" style={{ color: 'var(--sf-accent)', fontWeight: 600 }}>{it.price}</span>
                  </div>
                  <p className="mt-1.5 text-[0.88rem] leading-[1.7]" style={{ color: 'var(--sf-muted)' }}>{it.description}</p>
                  {it.badge && (
                    <span className="mt-2 inline-block px-2 py-0.5 text-[0.62rem] uppercase" style={{ border: '1px solid var(--sf-accent)', color: 'var(--sf-accent)', letterSpacing: '0.16em' }}>
                      {it.badge}
                    </span>
                  )}
                </li>
              ))}
            </motion.ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ───────────────────── gallery — asymmetric bento ───────────────────── */

function Gallery({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const imgs = (content.gallery.images || []).slice(0, 5)
  if (imgs.length === 0) return null
  // Exactly as many cells as images, in mixed sizes — never a blank filler tile.
  const spans = [
    'md:col-span-7 md:row-span-2 aspect-[4/3] md:aspect-auto',
    'md:col-span-5 aspect-[4/3]',
    'md:col-span-5 aspect-[4/3]',
    'md:col-span-4 aspect-[4/3]',
    'md:col-span-8 aspect-[16/9]',
  ]
  return (
    <section id="gallery" data-section="gallery" className="py-24 md:py-32" style={{ background: 'var(--sf-surface)' }}>
      <Container>
        <motion.div {...reveal} className="mb-10">
          <Display>{content.gallery.heading}</Display>
        </motion.div>
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-12">
          {imgs.map((im, i) => (
            <motion.figure key={i} {...reveal} className={`group relative overflow-hidden ${spans[i] || 'md:col-span-4 aspect-[4/3]'}`}>
              <img
                src={im.url}
                alt={im.alt || ''}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ───────────────────── visit — contrast band ───────────────────── */

function Visit({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const h = content.hours_location
  return (
    <section
      id="visit"
      data-section="hours_location"
      className="relative overflow-hidden py-24 md:py-32"
      style={{ background: 'var(--sf-contrast)', color: 'var(--sf-on-contrast)' }}
    >
      <Lattice className="pointer-events-none absolute -left-16 -bottom-16 h-80 w-80" opacity={0.1} />
      <Container className="relative">
        <motion.div {...reveal} className="mb-12">
          <Kicker>{h.subheading}</Kicker>
          <Display className="mt-5" style={{ color: 'var(--sf-on-contrast)' }}>{h.heading}</Display>
        </motion.div>

        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          <motion.div {...reveal}>
            <p className="mb-5 inline-flex items-center gap-2 text-[0.7rem] uppercase" style={{ color: 'var(--sf-accent)', letterSpacing: '0.22em' }}>
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} /> ساعات العمل
            </p>
            <ul className="space-y-2.5">
              {h.hours.map((d) => (
                <li key={d.day} className="flex items-baseline justify-between gap-4 text-[0.9rem]">
                  <span style={{ opacity: 0.85 }}>{d.label}</span>
                  <span className="tabular-nums" dir="ltr" style={{ opacity: d.closed ? 0.5 : 1 }}>
                    {d.closed ? 'مغلق' : `${d.open} – ${d.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...reveal}>
            <p className="mb-5 inline-flex items-center gap-2 text-[0.7rem] uppercase" style={{ color: 'var(--sf-accent)', letterSpacing: '0.22em' }}>
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> العنوان
            </p>
            <p className="text-[1rem] leading-[1.8]" style={{ opacity: 0.9 }}>{h.address}</p>
            {h.map_link && (
              <a href={h.map_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[0.85rem] transition-opacity hover:opacity-70" style={{ color: 'var(--sf-accent)' }}>
                افتح الخريطة <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
            )}
          </motion.div>

          <motion.div {...reveal}>
            <p className="mb-5 inline-flex items-center gap-2 text-[0.7rem] uppercase" style={{ color: 'var(--sf-accent)', letterSpacing: '0.22em' }}>
              <Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> تواصل
            </p>
            <a href={`tel:${h.phone}`} dir="ltr" className="block text-[1.05rem] transition-opacity hover:opacity-70">{h.phone}</a>
            <a href={`mailto:${h.email}`} dir="ltr" className="mt-2 block text-[0.9rem] transition-opacity hover:opacity-70" style={{ opacity: 0.8 }}>{h.email}</a>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

/* ───────────────────── reservations ───────────────────── */

function Reservations({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const r = content.reservations
  const isPhone = r.provider?.type === 'phone'
  return (
    <section id="reservations" data-section="reservations" className="py-24 md:py-36">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div {...reveal}>
            <Display className="mb-6">{r.heading}</Display>
            <p className="max-w-md text-[1rem] leading-[1.8]" style={{ color: 'var(--sf-muted)' }}>{r.subheading}</p>
            {r.note && <p className="mt-5 text-[0.85rem]" style={{ color: 'var(--sf-muted)', opacity: 0.8 }}>{r.note}</p>}
          </motion.div>

          <motion.div {...reveal} className="p-8 md:p-10" style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)' }}>
            {isPhone ? (
              <>
                <p className="text-[0.9rem] leading-[1.8]" style={{ color: 'var(--sf-muted)' }}>
                  للحجز، اتصل بنا مباشرة — يسعدنا ترتيب طاولتك.
                </p>
                <a
                  href={`tel:${(r.provider as any).number}`}
                  dir="ltr"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 px-8 py-4 text-[0.8rem]"
                  style={{ background: 'var(--sf-accent)', color: 'var(--sf-on-accent)', letterSpacing: '0.12em', fontWeight: 600 }}
                >
                  {(r.provider as any).number}
                </a>
              </>
            ) : (
              /* Form UI only — on a generated site these fields post to Zenya's
                 own bookings endpoint and land in the owner's dashboard inbox. */
              <form className="grid gap-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="الاسم" id="sf-name" />
                  <Field label="رقم الجوال" id="sf-phone" dir="ltr" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="التاريخ" id="sf-date" type="date" dir="ltr" />
                  <Field label="عدد الضيوف" id="sf-guests" type="number" dir="ltr" />
                </div>
                <button
                  type="submit"
                  className="mt-1 w-full px-8 py-4 text-[0.78rem] uppercase transition-transform active:scale-[0.99]"
                  style={{ background: 'var(--sf-accent)', color: 'var(--sf-on-accent)', letterSpacing: '0.2em', fontWeight: 600 }}
                >
                  {r.cta_label}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

/** Label above input, never placeholder-as-label. */
function Field({ label, id, type = 'text', dir }: { label: string; id: string; type?: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[0.75rem]" style={{ color: 'var(--sf-muted)', letterSpacing: '0.06em' }}>{label}</label>
      <input
        id={id}
        type={type}
        dir={dir}
        className="h-11 px-3 text-[0.92rem] outline-none transition-colors focus:border-current"
        style={{ background: 'transparent', border: '1px solid var(--sf-border)', color: 'var(--sf-text)' }}
      />
    </div>
  )
}

/* ───────────────────── reviews — one pull quote ───────────────────── */

function Reviews({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const items = content.reviews.testimonials || []
  const [i, setI] = useState(0)
  if (items.length === 0) return null
  const t = items[i % items.length]
  return (
    <section data-section="reviews" className="py-24 md:py-32" style={{ background: 'var(--sf-surface)' }}>
      <Container>
        <motion.blockquote {...reveal} className="mx-auto max-w-4xl text-center">
          <p
            className="text-[1.5rem] leading-[1.5] md:text-[2.1rem]"
            style={{ fontFamily: 'var(--sf-display)', letterSpacing: '-0.015em', fontWeight: 500 }}
          >
            {t.text}
          </p>
          <footer className="mt-8">
            <p className="text-[0.9rem]" style={{ color: 'var(--sf-accent)', fontWeight: 600 }}>{t.name}</p>
            {t.source && <p className="mt-1 text-[0.78rem]" style={{ color: 'var(--sf-muted)' }}>{t.source}</p>}
          </footer>
        </motion.blockquote>
        {items.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {items.map((_, n) => (
              <button
                key={n}
                onClick={() => setI(n)}
                aria-label={`رأي ${n + 1}`}
                className="h-1.5 transition-all"
                style={{ width: n === i % items.length ? 26 : 10, background: n === i % items.length ? 'var(--sf-accent)' : 'var(--sf-border)' }}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

/* ───────────────────── press — inline row ───────────────────── */

function Press({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const items = content.press.items || []
  if (items.length === 0) return null
  return (
    <section data-section="press" className="border-y py-14" style={{ borderColor: 'var(--sf-border)' }}>
      <Container>
        <motion.div {...reveal} className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {items.map((p, i) => (
            <span key={i} style={{ fontFamily: 'var(--sf-display)', fontSize: '1.02rem', color: 'var(--sf-muted)', letterSpacing: '0.02em' }}>
              {p.outlet}
            </span>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

/* ───────────────────── faq ───────────────────── */

function Faq({ content }: { content: RestaurantContent }) {
  const { reveal } = useMotionKit()
  const [open, setOpen] = useState<number | null>(0)
  const items = content.faq.items || []
  if (items.length === 0) return null
  return (
    <section data-section="faq" className="py-24 md:py-32">
      <Container className="max-w-3xl">
        <motion.div {...reveal} className="mb-10">
          <Display>{content.faq.heading}</Display>
        </motion.div>
        <div className="border-t" style={{ borderColor: 'var(--sf-border)' }}>
          {items.map((f, i) => {
            const on = open === i
            return (
              <div key={i} className="border-b" style={{ borderColor: 'var(--sf-border)' }}>
                <button
                  onClick={() => setOpen(on ? null : i)}
                  aria-expanded={on}
                  className="flex w-full items-center justify-between gap-6 py-5 text-start"
                >
                  <span style={{ fontFamily: 'var(--sf-display)', fontSize: '1.05rem', fontWeight: 600 }}>{f.q}</span>
                  <span className="shrink-0" style={{ color: 'var(--sf-accent)' }}>
                    {on ? <Minus className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-[0.95rem] leading-[1.85]" style={{ color: 'var(--sf-muted)' }}>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

/* ───────────────────── footer ───────────────────── */

function Footer({ content }: { content: RestaurantContent }) {
  return (
    <footer className="relative overflow-hidden pt-20 pb-10" style={{ background: 'var(--sf-contrast)', color: 'var(--sf-on-contrast)' }}>
      <Container className="relative">
        <p className="mb-3 max-w-lg text-[0.95rem] leading-[1.8]" style={{ opacity: 0.75 }}>{content.footer.tagline}</p>
        {/* Oversized wordmark as the sign-off — the brand is the last thing seen. */}
        <p
          className="mt-10 text-[16vw] leading-[0.86] lg:text-[11rem]"
          style={{ fontFamily: 'var(--sf-display)', fontWeight: 700, letterSpacing: '-0.04em' }}
        >
          {content.brand.name}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-[0.78rem]" style={{ borderColor: 'var(--sf-border)', opacity: 0.7 }}>
          <span>{content.footer.legal}</span>
          <span>{content.brand.city}</span>
        </div>
      </Container>
    </footer>
  )
}
