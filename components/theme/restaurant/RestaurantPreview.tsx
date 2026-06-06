"use client"

import { useMemo, useState, useRef } from 'react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants
} from 'framer-motion'
import type {
  RestaurantContent,
  RestaurantReservationProvider
} from '@/utils/restaurant/types'
import { getRestaurantPreset } from '@/utils/restaurant/presets'

type Props = {
  content: RestaurantContent
  presetId?: string
  className?: string
}

type RestaurantView = 'home' | 'menu' | 'gallery' | 'visit' | 'about' | 'reviews'

// Motion-Driven design system (per ui-ux-pro-max): ease-out entrances, 300-500ms,
// transform/opacity only, 30-50ms stagger, and full prefers-reduced-motion respect.
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

function useMotionKit() {
  const reduce = useReducedMotion()

  const reveal: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } }
  }

  const staggerParent: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.04 } }
  }

  const staggerChild: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } }
  }

  const viewport = { once: true, amount: 0.2 as const, margin: '0px 0px -10% 0px' }

  return { reduce, reveal, staggerParent, staggerChild, viewport }
}

export default function RestaurantPreview({ content, presetId = 'onyx', className }: Props) {
  const preset = getRestaurantPreset(presetId)
  const c = preset.colors
  const [view, setView] = useState<RestaurantView>('home')

  const cssVars = useMemo(
    () =>
      ({
        '--rb-primary': c.primary,
        '--rb-accent': c.accent,
        '--rb-bg': c.background,
        '--rb-surface': c.surface,
        '--rb-text': c.text,
        '--rb-muted': c.muted,
        '--rb-border': c.border,
        '--rb-heading-font': preset.heading_font,
        '--rb-body-font': preset.body_font
      }) as React.CSSProperties,
    [c, preset]
  )

  const isDark = preset.id === 'onyx'

  return (
    <div
      className={className}
      style={{
        ...cssVars,
        background: 'var(--rb-bg)',
        color: 'var(--rb-text)',
        fontFamily: 'var(--rb-body-font)',
        minHeight: '100%'
      }}
    >
      <FontPreload />
      <TopBar content={content} isDark={isDark} />
      <NavBar content={content} isDark={isDark} view={view} setView={setView} />

      {/* hidden_sections is set by the editor; every toggleable section
          checks the set before rendering. Always-on (brand, footer)
          ignore the list. */}
      {(() => {
        const hidden = new Set(content.hidden_sections || [])
        return (
          <>
            {view === 'home' && (
              <>
                {!hidden.has('hero') && <Hero content={content} isDark={isDark} />}
                {!hidden.has('signature_dishes') && <SignatureDishes content={content} isDark={isDark} />}
                {!hidden.has('press') && <Press content={content} isDark={isDark} />}
                {!hidden.has('newsletter') && <Newsletter content={content} isDark={isDark} />}
              </>
            )}
            {view === 'menu' && !hidden.has('menu') && <Menu content={content} isDark={isDark} />}
            {view === 'gallery' && !hidden.has('gallery') && <Gallery content={content} isDark={isDark} />}
            {view === 'visit' && (
              <>
                {!hidden.has('hours_location') && <HoursLocation content={content} isDark={isDark} />}
                {!hidden.has('reservations') && <Reservations content={content} isDark={isDark} />}
              </>
            )}
            {view === 'about' && !hidden.has('story') && <Story content={content} isDark={isDark} />}
            {view === 'reviews' && (
              <>
                {!hidden.has('reviews') && <Reviews content={content} isDark={isDark} />}
                {!hidden.has('faq') && <FAQ content={content} isDark={isDark} />}
              </>
            )}
          </>
        )
      })()}

      <Footer content={content} isDark={isDark} />
    </div>
  )
}

function FontPreload() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Fraunces:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
    />
  )
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-16 ${className}`}>{children}</div>
}

function Heading({
  children,
  size = 'xl',
  className = ''
}: {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}) {
  const sizes = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl',
    '2xl': 'text-6xl md:text-7xl lg:text-[5.5rem]'
  } as const
  return (
    <h2
      className={`${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--rb-heading-font)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 500 }}
    >
      {children}
    </h2>
  )
}

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`text-[0.7rem] uppercase ${className}`}
      style={{ color: 'var(--rb-accent)', letterSpacing: '0.32em', fontWeight: 500 }}
    >
      {children}
    </p>
  )
}

function Divider() {
  return <div className="mx-auto h-px w-12" style={{ background: 'var(--rb-accent)', opacity: 0.5 }} />
}

// Reusable scroll-reveal wrapper.
function Reveal({
  children,
  className = '',
  as = 'div',
  delay = 0
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section'
  delay?: number
}) {
  const { reveal, viewport } = useMotionKit()
  const MotionTag = as === 'section' ? motion.section : motion.div
  return (
    <MotionTag
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  )
}

function TopBar({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const todayLabel = useMemo(() => {
    const idx = new Date().getDay()
    const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = content.hours_location.hours.find((h) => h.day === map[idx])
    if (!today) return ''
    if (today.closed) return `Closed today`
    return `Today · ${today.open} – ${today.close}`
  }, [content.hours_location.hours])

  return (
    <div
      className="hidden md:block border-b text-[0.72rem]"
      style={{ borderColor: 'var(--rb-border)', background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.02)' }}
    >
      <Container className="flex items-center justify-between py-2.5" >
        <div className="flex items-center gap-6" style={{ color: 'var(--rb-muted)' }}>
          <span>{todayLabel}</span>
          <span>·</span>
          <span>{content.hours_location.address}</span>
        </div>
        <div className="flex items-center gap-6" style={{ color: 'var(--rb-muted)' }}>
          <a href={`tel:${content.hours_location.phone}`} className="hover:opacity-80 transition">
            {content.hours_location.phone}
          </a>
          <span>·</span>
          <a href={`mailto:${content.hours_location.email}`} className="hover:opacity-80 transition">
            {content.hours_location.email}
          </a>
        </div>
      </Container>
    </div>
  )
}

function NavBar({ content, isDark, view, setView }: { content: RestaurantContent; isDark: boolean; view: RestaurantView; setView: (v: RestaurantView) => void }) {
  const { reduce } = useMotionKit()
  const links: { label: string; view: RestaurantView }[] = [
    { label: 'About', view: 'about' },
    { label: 'Menu', view: 'menu' },
    { label: 'Gallery', view: 'gallery' },
    { label: 'Visit', view: 'visit' },
    { label: 'Reviews', view: 'reviews' },
  ]
  return (
    <motion.div
      className="sticky top-0 z-30 backdrop-blur-md border-b"
      style={{
        background: isDark ? 'rgba(10,10,12,0.78)' : 'rgba(255,255,255,0.85)',
        borderColor: 'var(--rb-border)'
      }}
      initial={{ y: reduce ? 0 : -100, opacity: reduce ? 1 : 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      <Container className="flex items-center justify-between py-5">
        <button onClick={() => setView('home')} className="flex items-baseline gap-2">
          <span
            style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.45rem', fontWeight: 500, letterSpacing: '0.02em' }}
          >
            {content.brand.name}
          </span>
        </button>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.view}
              onClick={() => setView(l.view)}
              className="text-[0.78rem] uppercase transition hover:opacity-100"
              style={{ color: view === l.view ? 'var(--rb-accent)' : 'var(--rb-muted)', letterSpacing: '0.22em', fontWeight: view === l.view ? 600 : 500 }}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <motion.button
          onClick={() => setView('visit')}
          className="inline-flex items-center px-5 py-2.5 text-[0.72rem] uppercase"
          style={{
            background: 'var(--rb-accent)',
            color: isDark ? '#0a0a0c' : '#ffffff',
            letterSpacing: '0.22em',
            fontWeight: 600
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          Reserve
        </motion.button>
      </Container>
    </motion.div>
  )
}

function Hero({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { reduce, staggerParent, staggerChild } = useMotionKit()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%'])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-12%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0])

  return (
    <section ref={ref} id="top" className="relative overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
        <img src={content.hero.image} alt="" className="w-full h-full object-cover" style={{ filter: isDark ? 'brightness(0.55)' : 'brightness(0.78)' }} />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, rgba(10,10,12,0.25) 0%, rgba(10,10,12,0.55) 60%, rgba(10,10,12,0.95) 100%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.55) 100%)'
          }}
        />
      </motion.div>
      <Container className="relative py-32 md:py-48 lg:py-56">
        <motion.div
          className="max-w-3xl"
          style={{ y: contentY, opacity: contentOpacity }}
          variants={staggerParent}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerChild}>
            <Eyebrow className="mb-7">{content.hero.eyebrow}</Eyebrow>
          </motion.div>
          <motion.h1
            variants={staggerChild}
            className="text-5xl md:text-7xl lg:text-[5.5rem] mb-8"
            style={{
              fontFamily: 'var(--rb-heading-font)',
              color: '#ffffff',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              fontWeight: 500,
              whiteSpace: 'pre-line'
            }}
          >
            {content.hero.headline}
          </motion.h1>
          <motion.p
            variants={staggerChild}
            className="text-base md:text-lg max-w-xl mb-10"
            style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 }}
          >
            {content.hero.subheadline}
          </motion.p>
          <motion.div variants={staggerChild} className="flex flex-wrap items-center gap-4">
            <motion.a
              href="#reservations"
              className="inline-flex items-center px-7 py-4 text-[0.78rem] uppercase"
              style={{ background: 'var(--rb-accent)', color: '#0a0a0c', letterSpacing: '0.24em', fontWeight: 600 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {content.hero.primary_cta}
            </motion.a>
            <motion.a
              href="#menu"
              className="inline-flex items-center px-7 py-4 text-[0.78rem] uppercase transition hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.45)', color: '#ffffff', letterSpacing: '0.24em', fontWeight: 500 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {content.hero.secondary_cta}
            </motion.a>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}

function Story({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { reveal, viewport } = useMotionKit()
  return (
    <section id="story" className="py-24 md:py-36">
      <Container>
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <Reveal className="lg:col-span-7 order-2 lg:order-1">
            <Eyebrow className="mb-6">{content.story.eyebrow}</Eyebrow>
            <Heading size="xl" className="mb-8" >
              {content.story.heading}
            </Heading>
            <p style={{ color: 'var(--rb-muted)', lineHeight: 1.75, fontSize: '1.05rem' }} className="mb-8">
              {content.story.body}
            </p>
            {content.story.chef_name && (
              <div className="flex items-center gap-5 pt-6 border-t" style={{ borderColor: 'var(--rb-border)' }}>
                {content.story.chef_photo && (
                  <img
                    src={content.story.chef_photo}
                    alt={content.story.chef_name}
                    className="h-16 w-16 rounded-full object-cover"
                    style={{ border: `1px solid var(--rb-accent)` }}
                  />
                )}
                <div>
                  <p style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.15rem', letterSpacing: '0.01em' }}>
                    {content.story.chef_name}
                  </p>
                  <p className="text-[0.78rem] uppercase mt-0.5" style={{ color: 'var(--rb-accent)', letterSpacing: '0.22em' }}>
                    {content.story.chef_title}
                  </p>
                </div>
              </div>
            )}
            {content.story.chef_bio && (
              <p style={{ color: 'var(--rb-muted)', lineHeight: 1.7, fontSize: '0.95rem' }} className="mt-6 italic">
                {content.story.chef_bio}
              </p>
            )}
          </Reveal>
          <motion.div
            className="lg:col-span-5 order-1 lg:order-2 relative"
            variants={reveal}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={content.story.accent_image || content.hero.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div
              className="hidden lg:block absolute -bottom-8 -left-8 w-44 h-44"
              style={{ border: `1px solid var(--rb-accent)` }}
            />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

function SignatureDishes({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { staggerParent, staggerChild, viewport } = useMotionKit()
  return (
    <section className="py-24 md:py-32" style={{ background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)' }}>
      <Container>
        <Reveal className="text-center max-w-2xl mx-auto mb-16">
          <Eyebrow className="mb-5">Signature</Eyebrow>
          <Heading size="lg" className="mb-5">
            Dishes the kitchen is known for.
          </Heading>
          <Divider />
        </Reveal>
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {content.signature_dishes.slice(0, 4).map((dish, i) => (
            <motion.div key={i} variants={staggerChild} className="group">
              <div className="relative aspect-[3/4] overflow-hidden mb-5">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 transition" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)' }} />
                <p
                  className="absolute bottom-4 right-4 text-[0.78rem]"
                  style={{ color: 'var(--rb-accent)', fontFamily: 'var(--rb-heading-font)', fontSize: '1.1rem' }}
                >
                  {dish.price}
                </p>
              </div>
              <h3
                style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.35rem', letterSpacing: '-0.01em' }}
                className="mb-2"
              >
                {dish.name}
              </h3>
              <p style={{ color: 'var(--rb-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{dish.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

function Menu({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { reduce, staggerParent, staggerChild } = useMotionKit()
  const cats = content.menu.categories
  const [active, setActive] = useState<string>(cats[0]?.id || '')
  const current = cats.find((c) => c.id === active) || cats[0]

  return (
    <section id="menu" className="py-24 md:py-36">
      <Container>
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow className="mb-5">{content.menu.heading}</Eyebrow>
          <Heading size="xl" className="mb-5">
            The full menu.
          </Heading>
          <p style={{ color: 'var(--rb-muted)', lineHeight: 1.6 }}>{content.menu.subheading}</p>
        </Reveal>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-14">
          {cats.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className="relative px-5 py-2.5 text-[0.78rem] uppercase"
              style={{
                letterSpacing: '0.24em',
                fontWeight: 500,
                color: active === cat.id ? (isDark ? '#0a0a0c' : '#ffffff') : 'var(--rb-muted)',
                background: active === cat.id ? 'var(--rb-accent)' : 'transparent',
                border: active === cat.id ? '1px solid var(--rb-accent)' : `1px solid var(--rb-border)`
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {current.description && (
                <p className="text-center italic mb-12" style={{ color: 'var(--rb-muted)' }}>
                  {current.description}
                </p>
              )}
              <motion.div className="space-y-7" variants={staggerParent} initial="hidden" animate="show">
                {current.items.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={staggerChild}
                    className="flex items-start gap-5 pb-7 border-b"
                    style={{ borderColor: 'var(--rb-border)' }}
                  >
                    {/* Optional uploaded item image — square thumb, refined,
                        preserves the existing Maison layout */}
                    {item.image && (
                      <div
                        className="hidden flex-shrink-0 overflow-hidden sm:block"
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: 6,
                          border: `1px solid var(--rb-border)`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1.5">
                        <h4
                          style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.3rem', letterSpacing: '-0.01em' }}
                        >
                          {item.name}
                        </h4>
                        {item.badge && (
                          <span
                            className="text-[0.65rem] uppercase px-2 py-0.5"
                            style={{
                              background: 'transparent',
                              color: 'var(--rb-accent)',
                              border: `1px solid var(--rb-accent)`,
                              letterSpacing: '0.2em'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--rb-muted)', fontSize: '0.95rem', lineHeight: 1.55 }}>{item.description}</p>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--rb-heading-font)',
                        color: 'var(--rb-accent)',
                        fontSize: '1.25rem'
                      }}
                      className="whitespace-nowrap"
                    >
                      {item.price}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  )
}

function Gallery({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { staggerParent, staggerChild, viewport } = useMotionKit()
  const imgs = content.gallery.images.slice(0, 6)
  return (
    <section id="gallery" className="py-24 md:py-32" style={{ background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)' }}>
      <Container>
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow className="mb-5">Gallery</Eyebrow>
          <Heading size="lg" className="mb-5">
            {content.gallery.heading}
          </Heading>
          <p style={{ color: 'var(--rb-muted)' }}>{content.gallery.subheading}</p>
        </Reveal>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {imgs.map((img, i) => {
            const tall = i === 0 || i === 4
            return (
              <motion.div
                key={i}
                variants={staggerChild}
                className={`group relative overflow-hidden ${tall ? 'row-span-2 aspect-[3/4] md:aspect-auto' : 'aspect-[4/3]'}`}
              >
                <img
                  src={img.url}
                  alt={img.alt || ''}
                  className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
              </motion.div>
            )
          })}
        </motion.div>
        {/* Attribution — honest about where the photos came from. */}
        {content.gallery.attribution && (
          <p
            className="mt-8 text-center text-xs uppercase tracking-[0.25em]"
            style={{ color: 'var(--rb-muted)' }}
          >
            {content.gallery.attribution === 'from_venue'
              ? 'Photography by the venue.'
              : 'Photography sourced from Unsplash.'}
          </p>
        )}
      </Container>
    </section>
  )
}

function HoursLocation({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  return (
    <section id="visit" className="py-24 md:py-36">
      <Container>
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <Eyebrow className="mb-5">Visit</Eyebrow>
            <Heading size="lg" className="mb-7">
              {content.hours_location.heading}
            </Heading>
            <p style={{ color: 'var(--rb-muted)', lineHeight: 1.65 }} className="mb-10">
              {content.hours_location.subheading}
            </p>

            <div className="space-y-5 mb-10">
              <div>
                <p className="text-[0.72rem] uppercase mb-1" style={{ color: 'var(--rb-accent)', letterSpacing: '0.24em' }}>
                  Address
                </p>
                <p style={{ color: 'var(--rb-text)' }}>{content.hours_location.address}</p>
              </div>
              <div>
                <p className="text-[0.72rem] uppercase mb-1" style={{ color: 'var(--rb-accent)', letterSpacing: '0.24em' }}>
                  Phone
                </p>
                <a href={`tel:${content.hours_location.phone}`} style={{ color: 'var(--rb-text)' }}>
                  {content.hours_location.phone}
                </a>
              </div>
              <div>
                <p className="text-[0.72rem] uppercase mb-1" style={{ color: 'var(--rb-accent)', letterSpacing: '0.24em' }}>
                  Email
                </p>
                <a href={`mailto:${content.hours_location.email}`} style={{ color: 'var(--rb-text)' }}>
                  {content.hours_location.email}
                </a>
              </div>
            </div>

            {content.hours_location.map_link && (
              <motion.a
                href={content.hours_location.map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 text-[0.78rem] uppercase"
                style={{ border: `1px solid var(--rb-accent)`, color: 'var(--rb-accent)', letterSpacing: '0.24em', fontWeight: 500 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                Open in Maps
              </motion.a>
            )}
          </Reveal>

          <Reveal className="lg:col-span-7" delay={0.08}>
            <div className="p-8 md:p-10" style={{ background: 'var(--rb-surface)', border: `1px solid var(--rb-border)` }}>
              <p className="text-[0.72rem] uppercase mb-6" style={{ color: 'var(--rb-accent)', letterSpacing: '0.24em' }}>
                Hours
              </p>
              <div className="divide-y" style={{ borderColor: 'var(--rb-border)' }}>
                {content.hours_location.hours.map((h) => (
                  <div
                    key={h.day}
                    className="flex items-center justify-between py-3.5"
                    style={{ borderColor: 'var(--rb-border)' }}
                  >
                    <span
                      style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.05rem' }}
                    >
                      {h.label}
                    </span>
                    <span style={{ color: h.closed ? 'var(--rb-muted)' : 'var(--rb-text)' }} className="text-sm">
                      {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

function reservationHref(p: RestaurantReservationProvider) {
  if (p.type === 'phone') return `tel:${p.number}`
  if (p.type === 'form') return '#reservations-form'
  return p.url
}

function Reservations({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const r = content.reservations
  return (
    <section id="reservations" className="py-24 md:py-32 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(200,169,106,0.05) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(200,169,106,0.06) 100%)'
        }}
      />
      <Container className="relative">
        <Reveal className="text-center max-w-2xl mx-auto">
          <Eyebrow className="mb-5">Reservations</Eyebrow>
          <Heading size="xl" className="mb-7">
            {r.heading}
          </Heading>
          <p style={{ color: 'var(--rb-muted)', lineHeight: 1.7, fontSize: '1.05rem' }} className="mb-10">
            {r.subheading}
          </p>
          <motion.a
            href={reservationHref(r.provider)}
            target={r.provider.type === 'phone' || r.provider.type === 'form' ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="inline-flex items-center px-9 py-4 text-[0.78rem] uppercase"
            style={{ background: 'var(--rb-accent)', color: isDark ? '#0a0a0c' : '#ffffff', letterSpacing: '0.26em', fontWeight: 600 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {r.cta_label}
          </motion.a>
          {r.note && (
            <p className="mt-10 italic" style={{ color: 'var(--rb-muted)', fontSize: '0.92rem' }}>
              {r.note}
            </p>
          )}
        </Reveal>
      </Container>
    </section>
  )
}

function Reviews({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { staggerParent, staggerChild, viewport } = useMotionKit()
  const r = content.reviews
  return (
    <section className="py-24 md:py-32" style={{ background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)' }}>
      <Container>
        <Reveal className="text-center max-w-2xl mx-auto mb-16">
          <Eyebrow className="mb-5">Reviews</Eyebrow>
          <Heading size="lg" className="mb-7">
            {r.heading}
          </Heading>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Stars rating={r.overall_rating} />
            <span style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.5rem' }}>
              {r.overall_rating.toFixed(1)}
            </span>
          </div>
          <p style={{ color: 'var(--rb-muted)' }} className="text-sm">
            Based on {r.review_count} verified guest reviews
          </p>
        </Reveal>
        <motion.div
          className="grid md:grid-cols-2 gap-6 md:gap-8"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {r.testimonials.slice(0, 4).map((t, i) => (
            <motion.div
              key={i}
              variants={staggerChild}
              className="p-8 md:p-10"
              style={{ background: 'var(--rb-surface)', border: `1px solid var(--rb-border)` }}
            >
              <Stars rating={t.rating} small />
              <p
                style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.25rem', lineHeight: 1.5, letterSpacing: '-0.01em' }}
                className="mt-5 mb-6 italic"
              >
                “{t.text}”
              </p>
              <div>
                <p style={{ color: 'var(--rb-text)' }} className="text-sm font-medium">
                  {t.name}
                </p>
                {t.source && (
                  <p className="text-[0.72rem] uppercase mt-1" style={{ color: 'var(--rb-accent)', letterSpacing: '0.22em' }}>
                    {t.source}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

function Stars({ rating, small = false }: { rating: number; small?: boolean }) {
  const filled = Math.round(rating)
  return (
    <span className="inline-flex" style={{ color: 'var(--rb-accent)', fontSize: small ? '0.95rem' : '1.15rem', letterSpacing: '0.15em' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < filled ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  )
}

function Press({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { staggerParent, staggerChild, viewport } = useMotionKit()
  return (
    <section className="py-20 md:py-28">
      <Container>
        <Reveal className="text-center mb-12">
          <Eyebrow className="mb-3">As seen in</Eyebrow>
        </Reveal>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6 items-center"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {content.press.items.slice(0, 6).map((item, i) => (
            <motion.div key={i} variants={staggerChild} className="text-center">
              <p
                style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.1rem', letterSpacing: '0.01em' }}
              >
                {item.outlet}
              </p>
              {item.quote && (
                <p className="text-[0.72rem] uppercase mt-1.5" style={{ color: 'var(--rb-accent)', letterSpacing: '0.18em' }}>
                  {item.quote}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

function Newsletter({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  return (
    <section className="py-24 md:py-32" style={{ background: isDark ? 'rgba(200,169,106,0.06)' : 'rgba(0,0,0,0.04)' }}>
      <Container>
        <Reveal className="max-w-2xl mx-auto text-center">
          <Eyebrow className="mb-5">Newsletter</Eyebrow>
          <Heading size="lg" className="mb-5">
            {content.newsletter.heading}
          </Heading>
          <p style={{ color: 'var(--rb-muted)' }} className="mb-9">
            {content.newsletter.subheading}
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 text-sm focus:outline-none"
              style={{
                background: 'var(--rb-surface)',
                color: 'var(--rb-text)',
                border: `1px solid var(--rb-border)`
              }}
            />
            <motion.button
              type="submit"
              className="px-7 py-3.5 text-[0.78rem] uppercase"
              style={{ background: 'var(--rb-accent)', color: isDark ? '#0a0a0c' : '#ffffff', letterSpacing: '0.24em', fontWeight: 600 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {content.newsletter.button_label}
            </motion.button>
          </form>
        </Reveal>
      </Container>
    </section>
  )
}

function FAQ({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  const { reduce } = useMotionKit()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="py-24 md:py-32">
      <Container>
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <Eyebrow className="mb-5">Before you come</Eyebrow>
            <Heading size="lg">{content.faq.heading}</Heading>
          </Reveal>
          <Reveal className="lg:col-span-8" delay={0.08}>
            <div className="divide-y" style={{ borderColor: 'var(--rb-border)' }}>
              {content.faq.items.map((item, i) => {
                const isOpen = open === i
                return (
                  <div key={i} style={{ borderColor: 'var(--rb-border)' }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between py-5 text-left"
                    >
                      <span
                        style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.15rem', letterSpacing: '-0.01em' }}
                      >
                        {item.q}
                      </span>
                      <motion.span
                        style={{ color: 'var(--rb-accent)', fontSize: '1.4rem', display: 'inline-block' }}
                        animate={{ rotate: isOpen && !reduce ? 45 : 0 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                      >
                        +
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: reduce ? 'auto' : 0, opacity: reduce ? 1 : 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: reduce ? 'auto' : 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE_OUT }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p style={{ color: 'var(--rb-muted)', lineHeight: 1.7 }} className="pb-6 pr-8">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/**
 * WhatsApp links: accept either a full https://wa.me/... URL (use as-is)
 * or a raw phone number (auto-wrap into wa.me).
 */
function normaliseWhatsapp(v: string): string {
  const trimmed = v.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : '#'
}

function Footer({ content, isDark }: { content: RestaurantContent; isDark: boolean }) {
  return (
    <footer className="pt-20 pb-10 border-t" style={{ borderColor: 'var(--rb-border)' }}>
      <Container>
        <div className="grid md:grid-cols-3 gap-10 mb-16">
          <div>
            <p
              style={{ fontFamily: 'var(--rb-heading-font)', color: 'var(--rb-text)', fontSize: '1.5rem', letterSpacing: '0.01em' }}
              className="mb-3"
            >
              {content.brand.name}
            </p>
            <p style={{ color: 'var(--rb-muted)', lineHeight: 1.6 }} className="text-sm">
              {content.footer.tagline}
            </p>
          </div>
          <div>
            <p className="text-[0.72rem] uppercase mb-4" style={{ color: 'var(--rb-accent)', letterSpacing: '0.24em' }}>
              Visit
            </p>
            <p style={{ color: 'var(--rb-text)' }} className="text-sm mb-1">
              {content.hours_location.address}
            </p>
            <p style={{ color: 'var(--rb-muted)' }} className="text-sm">
              {content.hours_location.phone}
            </p>
          </div>
          <div>
            <p className="text-[0.72rem] uppercase mb-4" style={{ color: 'var(--rb-accent)', letterSpacing: '0.24em' }}>
              Connect
            </p>
            <div className="space-y-1.5 text-sm">
              {/* Editor-driven social links — only show what the owner
                  actually provided. If they added none, only the press
                  email shows below. */}
              {content.social_links && (
                <>
                  {content.social_links.instagram && (
                    <a href={content.social_links.instagram} target="_blank" rel="noopener noreferrer"
                       className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                      Instagram
                    </a>
                  )}
                  {content.social_links.facebook && (
                    <a href={content.social_links.facebook} target="_blank" rel="noopener noreferrer"
                       className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                      Facebook
                    </a>
                  )}
                  {content.social_links.tiktok && (
                    <a href={content.social_links.tiktok} target="_blank" rel="noopener noreferrer"
                       className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                      TikTok
                    </a>
                  )}
                  {content.social_links.youtube && (
                    <a href={content.social_links.youtube} target="_blank" rel="noopener noreferrer"
                       className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                      YouTube
                    </a>
                  )}
                  {content.social_links.whatsapp && (
                    <a href={normaliseWhatsapp(content.social_links.whatsapp)} target="_blank" rel="noopener noreferrer"
                       className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                      WhatsApp
                    </a>
                  )}
                  {content.social_links.website && (
                    <a href={content.social_links.website} target="_blank" rel="noopener noreferrer"
                       className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                      Website
                    </a>
                  )}
                </>
              )}
              <a href={`mailto:${content.hours_location.email}`} className="block hover:opacity-80 transition" style={{ color: 'var(--rb-text)' }}>
                Press inquiries
              </a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--rb-border)' }}>
          <p className="text-xs" style={{ color: 'var(--rb-muted)' }}>
            {content.footer.legal}
          </p>
          <p className="text-[0.7rem] uppercase" style={{ color: 'var(--rb-muted)', letterSpacing: '0.24em' }}>
            Crafted with Zenya
          </p>
        </div>
      </Container>
    </footer>
  )
}
