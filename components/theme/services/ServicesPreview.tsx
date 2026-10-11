"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Award, BadgeCheck, Bug, CalendarDays, Camera, Car, ChevronDown, ChevronLeft, CircleCheck, Clock, Droplets,
  Hammer, KeyRound, Mail, MapPin, Menu, Navigation, Paintbrush, PartyPopper, Phone, Quote, Scissors,
  ShieldCheck, Siren, Smile, Snowflake, Sparkles, Star, Stethoscope, Tag, ThumbsUp, Timer, Trees, Truck,
  Wrench, X as Close, Zap, Ghost, type LucideIcon,
} from 'lucide-react'
import type { ServiceContent, ServiceSocialLinks } from '@/utils/services/types'
import { getServicePreset } from '@/utils/services/presets'
import { getTypographyPreset } from '@/utils/theme-editor-typography'
import BookingForm from '@/components/site/BookingForm'
import { useBookingContext } from '@/components/site/BookingContext'
import { FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, YOUTUBE } from '@/components/marketing/BrandMarks'

type Props = {
  content: ServiceContent
  presetId?: string
  className?: string
  colorOverrides?: Record<string, string>
  typographyPreset?: string
  view?: string
  onViewChange?: (v: string) => void
}

type ServiceView = 'home' | 'services' | 'about' | 'process' | 'contact'

/* ─────────────────────────────────────────────────────────── page context */

type Ctx = {
  content: ServiceContent
  isDark: boolean
  view: ServiceView
  go: (v: ServiceView) => void
  /** The owner's WhatsApp chat, or null when there is no usable number. */
  wa: string | null
}
const PageCtx = createContext<Ctx | null>(null)
function usePage(): Ctx {
  const c = useContext(PageCtx)
  if (!c) throw new Error('services page context missing')
  return c
}

const PAGES: { label: string; view: ServiceView }[] = [
  { label: 'الرئيسية', view: 'home' },
  { label: 'خدماتنا', view: 'services' },
  { label: 'من نحن', view: 'about' },
  { label: 'كيف نعمل', view: 'process' },
  { label: 'تواصل', view: 'contact' },
]

/* ─────────────────────────────────────────────────────────── motion */

// Plain functions, not hooks, so they are safe inside .map(). A device that
// asks for less motion gets a fade with no travel.
const EASE = [0.22, 1, 0.36, 1] as const
function rise(rm: boolean, delay = 0) {
  return {
    initial: rm ? { opacity: 0 } : { opacity: 0, y: 18 },
    whileInView: rm ? { opacity: 1 } : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: rm ? 0.3 : 0.55, ease: EASE, delay: rm ? 0 : delay },
  }
}
function enter(rm: boolean, delay = 0) {
  return {
    initial: rm ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: rm ? { opacity: 1 } : { opacity: 1, y: 0 },
    transition: { duration: rm ? 0.3 : 0.6, ease: EASE, delay: rm ? 0 : delay },
  }
}

/* ─────────────────────────────────────────────────────────── root */

// Arabic glyphs take the Arabic face; Latin letters and digits keep the preset's.
const ARABIC_FACE = '"IBM Plex Sans Arabic", system-ui, sans-serif'
const WA_GREEN = '#1fa855'

export default function ServicesPreview({
  content,
  presetId = 'cobalt',
  className,
  colorOverrides,
  typographyPreset,
  view: controlledView,
  onViewChange,
}: Props) {
  const preset = getServicePreset(presetId)
  const colors = useMemo(() => ({ ...preset.colors, ...(colorOverrides || {}) }), [preset.colors, colorOverrides])
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  const headingFont = `${typo?.heading_font ?? preset.heading_font}, ${ARABIC_FACE}`
  const bodyFont = `${typo?.body_font ?? preset.body_font}, ${ARABIC_FACE}`
  const isDark = preset.id === 'graphite'
  const [internalView, setInternalView] = useState<ServiceView>('home')
  const view = ((controlledView as ServiceView) || internalView)
  const go = (v: ServiceView) => {
    if (onViewChange) { onViewChange(v); return }
    setInternalView(v)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  // The colour that carries actions. On the dark preset the primary is near
  // black, so the accent takes its place.
  const brand = isDark ? colors.accent : colors.primary
  const cssVars = useMemo(
    () =>
      ({
        '--sv-primary': colors.primary,
        '--sv-accent': colors.accent,
        '--sv-on-accent': readableOn(colors.accent),
        '--sv-brand': brand,
        '--sv-on-brand': readableOn(brand),
        '--sv-bg': colors.background,
        '--sv-surface': colors.surface,
        '--sv-text': colors.text,
        '--sv-muted': colors.muted,
        '--sv-border': colors.border,
        '--sv-tint': `color-mix(in srgb, ${brand} 11%, transparent)`,
        '--sv-heading-font': headingFont,
        '--sv-body-font': bodyFont,
      }) as React.CSSProperties,
    [colors, brand, headingFont, bodyFont]
  )

  const ctx: Ctx = { content, isDark, view, go, wa: whatsappChat(content) }

  return (
    <PageCtx.Provider value={ctx}>
      <div
        className={className}
        dir="rtl"
        style={{ ...cssVars, background: 'var(--sv-bg)', color: 'var(--sv-text)', fontFamily: 'var(--sv-body-font)', minHeight: '100%' }}
      >
        <FontPreload />
        <Header />

        <main>
          {view === 'home' && (
            <>
              <Hero />
              <ServicesSection />
              <ProofSection />
              <ProcessSection />
              <TestimonialsSection />
              <OfferSection />
            </>
          )}
          {view === 'services' && (
            <>
              <PageBanner title="خدماتنا" />
              <ServicesSection inner />
              <BeforeAfterSection />
              <GallerySection />
              <FinalCta />
            </>
          )}
          {view === 'about' && (
            <>
              <PageBanner title="من نحن" />
              <StorySection />
              <ProofSection />
              <TestimonialsSection />
              <FinalCta />
            </>
          )}
          {view === 'process' && (
            <>
              <PageBanner title="كيف نعمل" />
              <ProcessSection inner />
              <FaqSection />
              <FinalCta />
            </>
          )}
          {view === 'contact' && (
            <>
              <PageBanner title="تواصل معنا" />
              <OfferSection inner />
              <AreasSection />
              <FaqSection />
            </>
          )}
        </main>

        <Footer />
        <WhatsAppFloat />
      </div>
    </PageCtx.Provider>
  )
}

function FontPreload() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Sora:wght@500;600;700;800&display=swap"
    />
  )
}

/* ─────────────────────────────────────────────────────────── building blocks */

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 md:px-8 ${className}`}>{children}</div>
}

function Section({
  children, id, name, tint, className = '',
}: { children: React.ReactNode; id?: string; name: string; tint?: boolean; className?: string }) {
  return (
    <section
      id={id}
      data-section={name}
      className={`py-16 md:py-24 ${className}`}
      style={tint ? { background: 'var(--sv-surface)', borderBlock: '1px solid var(--sv-border)' } : undefined}
    >
      {children}
    </section>
  )
}

function SectionHead({ eyebrow, title, sub, center }: { eyebrow?: string; title: string; sub?: string; center?: boolean }) {
  const rm = !!useReducedMotion()
  return (
    <motion.div {...rise(rm)} className={`mb-10 max-w-2xl md:mb-12 ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow ? (
        <p className={`flex items-center gap-2 text-sm font-semibold ${center ? 'justify-center' : ''}`} style={{ color: 'var(--sv-brand)' }}>
          <span aria-hidden className="h-[2px] w-6 rounded-full" style={{ background: 'var(--sv-brand)' }} />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-balance text-[1.75rem] md:text-[2.4rem]" style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.3, fontWeight: 700 }}>
        {title}
      </h2>
      {sub ? <p className="mt-3 text-base leading-8 md:text-lg" style={{ color: 'var(--sv-muted)' }}>{sub}</p> : null}
    </motion.div>
  )
}

type BtnKind = 'brand' | 'accent' | 'whatsapp' | 'white' | 'outline' | 'outline-light'
function btnStyle(kind: BtnKind): React.CSSProperties {
  switch (kind) {
    case 'brand': return { background: 'var(--sv-brand)', color: 'var(--sv-on-brand)' }
    case 'accent': return { background: 'var(--sv-accent)', color: 'var(--sv-on-accent)' }
    case 'whatsapp': return { background: WA_GREEN, color: '#ffffff' }
    case 'white': return { background: '#ffffff', color: '#0f172a' }
    case 'outline': return { border: '1px solid var(--sv-border)', color: 'var(--sv-text)', background: 'var(--sv-surface)' }
    case 'outline-light': return { border: '1px solid rgba(255,255,255,0.45)', color: '#ffffff', background: 'rgba(255,255,255,0.06)' }
  }
}

/**
 * One button for the whole template: two heights only, never wraps, the icon
 * always on the reading-start side of the label.
 */
function Btn({
  children, kind = 'brand', size = 'lg', href, onClick, external, icon, full, className = '', label,
}: {
  children: React.ReactNode
  kind?: BtnKind
  size?: 'md' | 'lg'
  href?: string
  onClick?: () => void
  external?: boolean
  icon?: React.ReactNode
  full?: boolean
  className?: string
  label?: string
}) {
  const cls =
    `inline-flex max-w-full shrink-0 items-center justify-center gap-2 text-balance text-center leading-snug rounded-xl font-semibold transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-px hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:hover:translate-y-0 ` +
    (size === 'lg' ? 'min-h-[52px] py-2 px-6 text-[0.95rem] ' : 'min-h-11 py-1.5 px-4 text-sm ') +
    (full ? 'w-full ' : '') + className
  const inner = <>{icon ? <span className="shrink-0">{icon}</span> : null}<span className="min-w-0">{children}</span></>
  if (href) {
    return (
      <a href={href} aria-label={label} className={cls} style={btnStyle(kind)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    )
  }
  return <button type="button" aria-label={label} onClick={onClick} className={cls} style={btnStyle(kind)}>{inner}</button>
}

function IconTile({ icon: Icon, size = 'md' }: { icon: LucideIcon; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-12 w-12 rounded-xl'
  return (
    <span className={`grid shrink-0 place-items-center ${box}`} style={{ background: 'var(--sv-tint)', color: 'var(--sv-brand)' }}>
      <Icon className={size === 'lg' ? 'h-7 w-7' : 'h-6 w-6'} strokeWidth={1.8} aria-hidden />
    </span>
  )
}

function card(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--sv-surface)',
    border: '1px solid var(--sv-border)',
    borderRadius: 20,
  }
}

function WaGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox={WHATSAPP.viewBox} fill="currentColor" aria-hidden className={className}>
      <path d={WHATSAPP.path} />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────── header */

function Header() {
  const { content, isDark, view, go, wa } = usePage()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const rm = !!useReducedMotion()
  const phone = (content.footer.phone || '').trim()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  // Close the menu whenever the page changes.
  useEffect(() => { setOpen(false) }, [view])

  // The trade's own icon as the mark: an Arabic name's first letter alone
  // (often an alef with hamza) reads as a stray glyph.
  const Mark = serviceIcon(content.brand.category || '', content.brand.name || '')

  return (
    <header
      className="sticky top-0 z-40 border-b transition-shadow duration-300"
      style={{
        background: isDark ? 'rgba(9,12,18,0.9)' : 'color-mix(in srgb, var(--sv-bg) 90%, transparent)',
        borderColor: 'var(--sv-border)',
        backdropFilter: 'saturate(160%) blur(12px)',
        WebkitBackdropFilter: 'saturate(160%) blur(12px)',
        boxShadow: scrolled ? '0 6px 24px rgba(15,23,42,0.08)' : 'none',
      }}
    >
      <Container className="flex min-h-16 items-center justify-between gap-3 py-2 md:min-h-[76px]">
        <button onClick={() => go('home')} className="flex min-w-0 items-center gap-3 text-right" aria-label={`${content.brand.name}، الصفحة الرئيسية`}>
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl md:h-11 md:w-11"
            style={{ background: 'var(--sv-brand)', color: 'var(--sv-on-brand)' }}
          >
            <Mark className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 block break-words text-[1rem] font-bold leading-6 md:text-[1.05rem]" style={{ fontFamily: 'var(--sv-heading-font)' }}>
              {content.brand.name}
            </span>
            {content.brand.category ? (
              <span className="block truncate text-xs leading-5" style={{ color: 'var(--sv-muted)' }}>{content.brand.category}</span>
            ) : null}
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="صفحات الموقع">
          {PAGES.map((p) => {
            const active = view === p.view
            return (
              <button
                key={p.view}
                onClick={() => go(p.view)}
                aria-current={active ? 'page' : undefined}
                className="relative inline-flex h-11 items-center rounded-lg px-3 text-[0.95rem] transition-colors hover:opacity-80"
                style={{ color: active ? 'var(--sv-text)' : 'var(--sv-muted)', fontWeight: active ? 600 : 500 }}
              >
                {p.label}
                {active ? <span aria-hidden className="absolute inset-x-3 bottom-1 h-[2px] rounded-full" style={{ background: 'var(--sv-brand)' }} /> : null}
              </button>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              aria-label={`اتصل بنا ${phone}`}
              className="hidden h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-opacity hover:opacity-80 md:inline-flex"
              style={{ borderColor: 'var(--sv-border)' }}
            >
              <Phone className="h-4 w-4" style={{ color: 'var(--sv-brand)' }} aria-hidden />
              <bdi dir="ltr">{phone}</bdi>
            </a>
          ) : null}
          <span className="hidden md:inline-flex">
            <Btn size="md" kind="brand" onClick={() => go('contact')}>{content.hero.primary_cta || 'تواصل معنا'}</Btn>
          </span>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="راسلنا على واتساب"
              className="grid h-11 w-11 place-items-center rounded-xl text-white md:hidden"
              style={{ background: WA_GREEN }}
            >
              <WaGlyph className="h-5 w-5" />
            </a>
          ) : null}
          <button
            type="button"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center rounded-xl border lg:hidden"
            style={{ borderColor: 'var(--sv-border)' }}
          >
            {open ? <Close className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </Container>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="menu"
            initial={rm ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={rm ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden border-t lg:hidden"
            style={{ borderColor: 'var(--sv-border)', background: 'var(--sv-bg)' }}
          >
            <Container className="py-3">
              <nav className="flex flex-col" aria-label="صفحات الموقع">
                {PAGES.map((p) => (
                  <button
                    key={p.view}
                    onClick={() => go(p.view)}
                    aria-current={view === p.view ? 'page' : undefined}
                    className="flex min-h-[52px] items-center justify-between border-b text-right text-base last:border-b-0"
                    style={{ borderColor: 'var(--sv-border)', fontWeight: view === p.view ? 700 : 500, color: view === p.view ? 'var(--sv-brand)' : 'var(--sv-text)' }}
                  >
                    {p.label}
                    <ChevronLeft className="h-4 w-4 opacity-50" aria-hidden />
                  </button>
                ))}
              </nav>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {phone ? <Btn size="md" kind="outline" href={`tel:${phone}`} icon={<Phone className="h-4 w-4" aria-hidden />} full>اتصل بنا</Btn> : null}
                {wa ? <Btn size="md" kind="whatsapp" href={wa} external icon={<WaGlyph className="h-4 w-4" />} full>واتساب</Btn> : null}
              </div>
              <SocialRow className="mt-4 justify-center" />
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

/* ─────────────────────────────────────────────────────────── hero */

function Hero() {
  const { content, wa } = usePage()
  const rm = !!useReducedMotion()
  const h = content.hero
  const trust = content.trust_bar?.items?.filter(Boolean).slice(0, 4) || []
  const stats = h.stats?.filter((s) => s.value && s.label).slice(0, 3) || []
  return (
    <section id="top" data-section="hero" className="relative isolate overflow-hidden" style={{ background: '#0b1220' }}>
      {h.image ? (
        <motion.img
          src={h.image}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          initial={rm ? { opacity: 0 } : { opacity: 0, scale: 1.06 }}
          animate={rm ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: rm ? 0.4 : 1.4, ease: EASE }}
        />
      ) : null}
      {/* Darkest behind the text (the right, in Arabic), so any photo reads. */}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(to left, rgba(6,10,18,0.9) 0%, rgba(6,10,18,0.72) 50%, rgba(6,10,18,0.42) 100%)' }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40" style={{ background: 'linear-gradient(to top, rgba(6,10,18,0.7), transparent)' }} />

      <Container className="pb-12 pt-16 text-white md:pb-16 md:pt-28">
        <div className="max-w-2xl">
          {h.eyebrow ? (
            <motion.p {...enter(rm, 0.05)} className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium md:text-sm" style={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)' }}>
              <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--sv-accent)' }} aria-hidden />
              <span className="min-w-0 leading-6">{h.eyebrow}</span>
            </motion.p>
          ) : null}
          <motion.h1 {...enter(rm, 0.12)} className="mt-5 whitespace-pre-line text-balance text-[2.1rem] md:text-[3.5rem]" style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.22, fontWeight: 700 }}>
            {h.headline}
          </motion.h1>
          {h.subheadline ? (
            <motion.p {...enter(rm, 0.2)} className="mt-5 max-w-xl text-base leading-8 md:text-lg" style={{ color: 'rgba(255,255,255,0.84)' }}>
              {h.subheadline}
            </motion.p>
          ) : null}
          <motion.div {...enter(rm, 0.28)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Btn kind="accent" href="#quote" icon={<CalendarDays className="h-5 w-5" aria-hidden />}>{h.primary_cta || 'اطلب عرض سعر'}</Btn>
            {wa ? (
              <Btn kind="whatsapp" href={wa} external icon={<WaGlyph />}>تواصل على واتساب</Btn>
            ) : h.secondary_cta ? (
              <Btn kind="outline-light" href="#services">{h.secondary_cta}</Btn>
            ) : null}
          </motion.div>
          {trust.length ? (
            <motion.ul {...enter(rm, 0.36)} data-section="trust_bar" className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.86)' }}>
              {trust.map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <CircleCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--sv-accent)' }} aria-hidden />
                  {t}
                </li>
              ))}
            </motion.ul>
          ) : null}
        </div>

        {stats.length ? (
          <motion.dl {...enter(rm, 0.44)} className="mt-12 grid max-w-3xl grid-cols-3 gap-3 border-t pt-6 md:mt-16 md:gap-6" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
            {stats.map((s) => (
              <div key={s.label} className="flex min-w-0 flex-col-reverse justify-end">
                <dt className="mt-1 text-xs leading-5 md:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</dt>
                <dd className="text-lg font-bold leading-snug md:text-[1.75rem]" style={{ fontFamily: 'var(--sv-heading-font)' }}>{s.value}</dd>
              </div>
            ))}
          </motion.dl>
        ) : null}
      </Container>
    </section>
  )
}

/** The photo band that opens every page except the home page. */
function PageBanner({ title }: { title: string }) {
  const { content, go } = usePage()
  const rm = !!useReducedMotion()
  return (
    <section className="relative isolate overflow-hidden" style={{ background: '#0b1220' }}>
      {content.hero.image ? <img src={content.hero.image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" /> : null}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(to left, rgba(6,10,18,0.9), rgba(6,10,18,0.62))' }} />
      <Container className="py-12 text-white md:py-16">
        <motion.nav {...enter(rm)} aria-label="مسار الصفحة" className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <button onClick={() => go('home')} className="-my-3 inline-flex min-h-[44px] items-center hover:text-white">الرئيسية</button>
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          <span className="text-white">{title}</span>
        </motion.nav>
        <motion.h1 {...enter(rm, 0.08)} className="mt-3 text-[2rem] md:text-[2.8rem]" style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.25, fontWeight: 700 }}>
          {title}
        </motion.h1>
        <motion.p {...enter(rm, 0.14)} className="mt-2 text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {[content.brand.category, content.brand.city].filter(Boolean).join(' · ')}
        </motion.p>
      </Container>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── services */

// An icon for a service, from words in its name, else the business's
// category. Order matters: the specific trades before the general verbs.
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/تكييف|تبريد|مكيف|مكيّف|تكيف|hvac|\bac\b|air ?con/i, Snowflake],
  [/سباك|تسريب|مياه|مواسير|سخان|سخّان|صرف|plumb|leak|water/i, Droplets],
  [/كهرب|إنارة|اناره|إضاءة|electri|wiring/i, Zap],
  [/غسيل سيار|سيار|ميكانيك|ورشة|بنشر|car|auto|vehicle|detailing/i, Car],
  [/تنظيف|نظاف|تعقيم|غسيل|جلي|clean|wash/i, Sparkles],
  [/دهان|طلاء|ديكور|paint|decor/i, Paintbrush],
  [/حلاق|حلاقة|شعر|لحية|barber|hair|cut|fade/i, Scissors],
  [/أسنان|اسنان|تبييض|تقويم|dental|teeth/i, Smile],
  [/عيادة|طبي|علاج|clinic|medical/i, Stethoscope],
  [/نقل|شحن|عفش|توصيل|mov|deliver/i, Truck],
  [/حشرات|مكافحة|رش|pest/i, Bug],
  [/حدائق|حديقة|زراعة|تنسيق|نجيل|garden|landscap/i, Trees],
  [/أقفال|اقفال|مفاتيح|lock|key/i, KeyRound],
  [/تصوير|كاميرا|مراقبة|photo|camera|cctv/i, Camera],
  [/قاعة|حفلات|مناسبات|أفراح|افراح|event|wedding|ballroom/i, PartyPopper],
  [/طوارئ|طارئ|عاجل|emergency|urgent/i, Siren],
  [/تركيب|تجهيز|install/i, Hammer],
  [/صيانة|إصلاح|اصلاح|تصليح|فحص|تشخيص|repair|maint|fix/i, Wrench],
]
function serviceIcon(name: string, category: string): LucideIcon {
  for (const [re, icon] of ICON_RULES) if (re.test(name)) return icon
  for (const [re, icon] of ICON_RULES) if (re.test(category)) return icon
  return BadgeCheck
}

function ServicesSection({ inner }: { inner?: boolean }) {
  const { content, isDark, wa, go } = usePage()
  const rm = !!useReducedMotion()
  const s = content.services
  const items = (s.items || []).filter((i) => i.name)
  if (!items.length) return null
  return (
    <Section id="services" name="services">
      <Container>
        <SectionHead eyebrow={inner ? undefined : 'خدماتنا'} title={s.heading} sub={s.subheading} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {items.map((item, i) => {
            const Icon = serviceIcon(item.name, content.brand.category)
            const ask = wa ? withText(wa, `مرحبًا ${content.brand.name}، أريد الاستفسار عن خدمة: ${item.name}`) : null
            return (
              <motion.article
                key={`${item.name}-${i}`}
                {...rise(rm, Math.min(i, 5) * 0.06)}
                className="group flex flex-col p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0 md:p-7"
                style={card(isDark)}
              >
                <div className="flex items-start justify-between gap-3">
                  <IconTile icon={Icon} />
                  {item.badge ? (
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--sv-tint)', color: 'var(--sv-brand)' }}>{item.badge}</span>
                  ) : null}
                </div>
                <h3 className="mt-5 text-[1.2rem] leading-8" style={{ fontFamily: 'var(--sv-heading-font)', fontWeight: 700 }}>{item.name}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-7" style={{ color: 'var(--sv-muted)' }}>{item.description}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--sv-border)' }}>
                  {item.price_from ? (
                    <span className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold" style={{ color: 'var(--sv-brand)' }}>
                      <Tag className="h-4 w-4" aria-hidden />{item.price_from}
                    </span>
                  ) : <span />}
                  {ask ? (
                    <a href={ask} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: WA_GREEN }}>
                      <WaGlyph className="h-4 w-4" /> اطلب الخدمة
                    </a>
                  ) : (
                    <button onClick={() => go('contact')} className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-75" style={{ color: 'var(--sv-brand)' }}>
                      اطلب الخدمة <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── why us */

const PROOF_ICONS: LucideIcon[] = [ShieldCheck, Clock, Award, ThumbsUp]

function ProofSection() {
  const { content, isDark } = usePage()
  const rm = !!useReducedMotion()
  const p = content.proof
  const items = (p?.items || []).filter((i) => i.title || i.text).slice(0, 4)
  if (!items.length) return null
  return (
    <Section id="proof" name="proof" tint>
      <Container>
        <SectionHead eyebrow="لماذا نحن" title={p.heading} sub={p.subheading} />
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 ${items.length === 3 ? 'lg:grid-cols-3' : items.length >= 4 ? 'lg:grid-cols-4' : ''}`}>
          {items.map((item, i) => (
            <motion.div key={`${item.title}-${i}`} {...rise(rm, i * 0.06)} className="p-6" style={{ ...card(isDark), background: 'var(--sv-bg)' }}>
              <IconTile icon={PROOF_ICONS[i % PROOF_ICONS.length]} />
              {item.title ? <h3 className="mt-5 text-lg font-bold leading-7" style={{ fontFamily: 'var(--sv-heading-font)' }}>{item.title}</h3> : null}
              {item.text ? <p className="mt-2 text-[0.95rem] leading-7" style={{ color: 'var(--sv-muted)' }}>{item.text}</p> : null}
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── process */

function ProcessSection({ inner }: { inner?: boolean }) {
  const { content } = usePage()
  const rm = !!useReducedMotion()
  const p = content.process
  const steps = (p?.steps || []).filter((s) => s.title || s.text)
  if (!steps.length) return null
  return (
    <Section name="process">
      <Container>
        <SectionHead eyebrow={inner ? undefined : 'كيف نعمل'} title={p.heading} sub={p.subheading} />
        <ol className={`relative grid gap-8 md:gap-6 ${steps.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {/* The thread that joins the steps: down the side on a phone, across on a laptop. */}
          <span aria-hidden className="absolute bottom-6 right-6 top-6 w-px md:hidden" style={{ background: 'var(--sv-border)' }} />
          <span aria-hidden className="absolute inset-x-[16%] top-6 hidden h-px md:block" style={{ background: 'var(--sv-border)' }} />
          {steps.map((step, i) => (
            <motion.li key={`${step.title}-${i}`} {...rise(rm, i * 0.1)} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
              <span
                className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold"
                style={{ background: 'var(--sv-brand)', color: 'var(--sv-on-brand)', boxShadow: '0 0 0 6px var(--sv-bg)', fontFamily: 'var(--sv-heading-font)' }}
              >
                {i + 1}
              </span>
              <div className="pt-2 md:pt-4">
                <h3 className="text-lg font-bold leading-7" style={{ fontFamily: 'var(--sv-heading-font)' }}>{step.title}</h3>
                {step.text ? <p className="mt-1.5 max-w-xs text-[0.95rem] leading-7" style={{ color: 'var(--sv-muted)' }}>{step.text}</p> : null}
              </div>
            </motion.li>
          ))}
        </ol>
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── reviews */

function TestimonialsSection() {
  // Only the owner's own reviews and rating are ever here. No reviews: no section.
  const { content, isDark } = usePage()
  const rm = !!useReducedMotion()
  const t = content.testimonials
  const items = (t?.items || []).filter((i) => i.text)
  if (!items.length) return null
  const avg = typeof t.average_rating === 'number' && t.average_rating > 0 ? t.average_rating : 0
  const reviewsUrl = content.links?.reviews_url
  return (
    <Section id="reviews" name="testimonials" tint>
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHead eyebrow="آراء العملاء" title={t.heading} sub={t.subheading} />
          {avg ? (
            <motion.div {...rise(rm)} className="mb-10 flex shrink-0 items-center gap-4 rounded-2xl border px-5 py-4 md:mb-12" style={{ borderColor: 'var(--sv-border)', background: 'var(--sv-bg)' }}>
              <span className="text-[2rem] font-bold leading-none" style={{ fontFamily: 'var(--sv-heading-font)' }}>{avg.toFixed(1)}</span>
              <span>
                <Stars rating={avg} />
                <span className="mt-1 block text-sm" style={{ color: 'var(--sv-muted)' }}>
                  من 5{t.review_count ? ` · ${t.review_count}${/^[\d\s.,+٠-٩]+$/.test(t.review_count) ? ' تقييم' : ''}` : ''}
                </span>
              </span>
            </motion.div>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {items.slice(0, 6).map((item, i) => (
            <motion.figure key={`${item.name}-${i}`} {...rise(rm, Math.min(i, 5) * 0.06)} className="flex flex-col p-6" style={{ ...card(isDark), background: 'var(--sv-bg)' }}>
              <div className="flex items-center justify-between">
                <Stars rating={item.rating || 5} />
                <Quote className="h-6 w-6" style={{ color: 'var(--sv-brand)', opacity: 0.35 }} aria-hidden />
              </div>
              <blockquote className="mt-4 text-[0.98rem] leading-8">{item.text}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-5">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold" style={{ background: 'var(--sv-tint)', color: 'var(--sv-brand)' }}>
                  {Array.from(item.name.trim())[0] || '•'}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{item.name}</span>
                  {item.service || item.source ? (
                    <span className="block truncate text-xs" style={{ color: 'var(--sv-muted)' }}>{[item.service, item.source].filter(Boolean).join(' · ')}</span>
                  ) : null}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
        {reviewsUrl ? (
          <div className="mt-8 flex justify-center">
            <Btn kind="outline" size="md" href={reviewsUrl} external icon={<Star className="h-4 w-4" aria-hidden />}>اقرأ كل التقييمات</Btn>
          </div>
        ) : null}
      </Container>
    </Section>
  )
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} من 5`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4" aria-hidden style={{ color: '#f5a524', fill: i < filled ? '#f5a524' : 'transparent', opacity: i < filled ? 1 : 0.45 }} />
      ))}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────── quote / contact */

function OfferSection({ inner }: { inner?: boolean }) {
  const { content, isDark, wa } = usePage()
  const rm = !!useReducedMotion()
  const { enabled, preview } = useBookingContext()
  // The quote form only exists where a request can reach the owner: an
  // entitled live site, or the editor, where a submit is a harmless no-op.
  // Elsewhere the card offers call, WhatsApp and email, and with none of them
  // the card is left out.
  const showForm = enabled || preview
  const o = content.offer
  const phone = (content.footer.phone || '').trim()
  const email = (content.footer.email || '').trim()
  const hasContact = !!phone || !!email || !!wa
  const points = (o.points || []).filter(Boolean).slice(0, 3)
  const hours = content.areas?.availability

  return (
    <Section id="quote" name="offer">
      <Container>
        <motion.div {...rise(rm)} className={`grid grid-cols-1 overflow-hidden ${showForm || hasContact ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]' : ''}`} style={{ ...card(isDark), borderRadius: 28 }}>
          <div className="relative p-6 text-white md:p-10" style={{ background: 'var(--sv-primary)' }}>
            <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full" style={{ background: 'var(--sv-accent)', opacity: 0.18, filter: 'blur(10px)' }} />
            {o.badge ? (
              <span className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'var(--sv-accent)', color: 'var(--sv-on-accent)' }}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden />{o.badge}
              </span>
            ) : null}
            <h2 className="relative mt-4 text-balance text-[1.7rem] md:text-[2.2rem]" style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.3, fontWeight: 700 }}>
              {inner ? (o.heading || 'أخبرنا بما تحتاج') : o.heading}
            </h2>
            {o.subheading ? <p className="relative mt-3 text-base leading-8" style={{ color: 'rgba(255,255,255,0.84)' }}>{o.subheading}</p> : null}
            {points.length ? (
              <ul className="relative mt-6 space-y-3">
                {points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-[0.95rem] leading-7">
                    <CircleCheck className="mt-1 h-4 w-4 shrink-0" style={{ color: 'var(--sv-accent)' }} aria-hidden />{pt}
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="relative mt-8 space-y-1 border-t pt-5 text-[0.95rem]" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
              {phone ? (
                <li><a href={`tel:${phone}`} className="inline-flex min-h-[44px] items-center gap-2.5 hover:opacity-80"><Phone className="h-4 w-4 opacity-80" aria-hidden /><bdi dir="ltr">{phone}</bdi></a></li>
              ) : null}
              {email ? (
                <li><a href={`mailto:${email}`} className="inline-flex min-h-[44px] items-center gap-2.5 break-all hover:opacity-80"><Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />{email}</a></li>
              ) : null}
              {hours ? <li className="flex min-h-[44px] items-center gap-2.5"><Clock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />{hours}</li> : null}
            </ul>
          </div>

          {showForm ? (
            <div className="p-6 md:p-10" style={{ background: 'var(--sv-surface)' }}>
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--sv-heading-font)' }}>{o.cta_label || 'اطلب عرض سعر'}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--sv-muted)' }}>اكتب طلبك وسنعود إليك.</p>
              <div className="mt-6">
                <BookingForm type="quote" palette={servicesPalette(isDark)} />
              </div>
              {wa ? (
                <div className="mt-5 flex items-center gap-3 text-sm" style={{ color: 'var(--sv-muted)' }}>
                  <span className="h-px flex-1" style={{ background: 'var(--sv-border)' }} />أو<span className="h-px flex-1" style={{ background: 'var(--sv-border)' }} />
                </div>
              ) : null}
              {wa ? <div className="mt-5"><Btn kind="whatsapp" href={wa} external icon={<WaGlyph />} full>تواصل على واتساب</Btn></div> : null}
            </div>
          ) : hasContact ? (
            <div className="flex flex-col justify-center p-6 md:p-10" style={{ background: 'var(--sv-surface)' }}>
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--sv-heading-font)' }}>{o.cta_label || 'اطلب عرض سعر'}</p>
              <p className="mt-2 text-base leading-8" style={{ color: 'var(--sv-muted)' }}>
                {wa || phone ? 'تواصل معنا مباشرةً برسالة واتساب أو مكالمة، ونرتّب معك التفاصيل.' : 'راسلنا بتفاصيل ما تحتاجه، ونعود إليك.'}
              </p>
              <div className="mt-6 grid gap-3">
                {wa ? <Btn kind="whatsapp" href={wa} external icon={<WaGlyph />} full>تواصل على واتساب</Btn> : null}
                {phone ? <Btn kind={wa ? 'outline' : 'brand'} href={`tel:${phone}`} icon={<Phone className="h-5 w-5" aria-hidden />} full>اتصل بنا</Btn> : null}
                {!phone && !wa && email ? <Btn kind="brand" href={`mailto:${email}`} icon={<Mail className="h-5 w-5" aria-hidden />} full>راسلنا بالبريد</Btn> : null}
              </div>
            </div>
          ) : null}
        </motion.div>
      </Container>
    </Section>
  )
}

/**
 * wa.me takes the number in international form, digits only. A number with no
 * country code has none to recover, and a guessed one would open a chat with
 * a stranger, so it gets no WhatsApp link.
 */
function whatsappNumber(raw: string, strict: boolean): string | null {
  const v = raw.trim()
  if (!v) return null
  const digits = v.replace(/\D/g, '')
  if (/^(\+|00)/.test(v)) {
    const d = digits.replace(/^00/, '')
    return d.length >= 8 ? d : null
  }
  // A WhatsApp field the owner filled in themselves may carry the country code
  // without the plus. One starting with 0 is a local number.
  if (!strict && digits.length >= 10 && !digits.startsWith('0')) return digits
  return null
}

/** The owner's WhatsApp: the WhatsApp field first, else the phone. */
function whatsappChat(content: ServiceContent): string | null {
  const own = (content.links?.whatsapp || '').trim()
  if (/^https?:\/\//i.test(own)) return own
  const n = whatsappNumber(own, false) || whatsappNumber(content.footer.phone || '', true)
  if (!n) return null
  return withText(`https://wa.me/${n}`, `مرحبًا ${content.brand.name}، أريد الاستفسار عن خدماتكم.`)
}

function withText(href: string, text: string): string {
  const base = href.replace(/\?text=.*$/, '')
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`
}

function servicesPalette(isDark: boolean) {
  return {
    accent: 'var(--sv-brand)',
    accentText: 'var(--sv-on-brand)',
    text: 'var(--sv-text)',
    muted: 'var(--sv-muted)',
    surface: isDark ? 'rgba(255,255,255,0.04)' : 'var(--sv-bg)',
    border: 'var(--sv-border)',
    headingFont: 'var(--sv-heading-font)',
    bodyFont: 'var(--sv-body-font)',
    radius: 12,
  }
}

/* ─────────────────────────────────────────────────────────── about */

function StorySection() {
  const { content } = usePage()
  const rm = !!useReducedMotion()
  const s = content.story
  const image = s.image || content.hero.image
  return (
    <Section name="story">
      <Container className={`grid grid-cols-1 gap-10 md:items-center md:gap-14 ${image ? 'md:grid-cols-2' : ''}`}>
        <motion.div {...rise(rm)} className="order-2 md:order-1">
          {s.eyebrow ? (
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--sv-brand)' }}>
              <span aria-hidden className="h-[2px] w-6 rounded-full" style={{ background: 'var(--sv-brand)' }} />{s.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-balance text-[1.75rem] md:text-[2.4rem]" style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.3, fontWeight: 700 }}>{s.heading}</h2>
          {s.body ? <p className="mt-4 text-base leading-8 md:text-lg" style={{ color: 'var(--sv-muted)' }}>{s.body}</p> : null}
          {s.quote ? (
            <blockquote className="mt-7 rounded-2xl p-5 text-base leading-8" style={{ background: 'var(--sv-tint)' }}>
              <Quote className="mb-2 h-6 w-6" style={{ color: 'var(--sv-brand)' }} aria-hidden />
              {s.quote}
            </blockquote>
          ) : null}
          {s.owner_name || s.owner_title ? (
            <p className="mt-5 text-sm">
              <span className="font-bold">{s.owner_name}</span>
              {s.owner_title ? <span style={{ color: 'var(--sv-muted)' }}> · {s.owner_title}</span> : null}
            </p>
          ) : null}
        </motion.div>
        {image ? (
          <motion.div {...rise(rm, 0.1)} className="relative order-1 md:order-2">
            <div aria-hidden className="absolute -bottom-4 -left-4 hidden h-full w-full rounded-3xl md:block" style={{ background: 'var(--sv-tint)' }} />
            <img src={image} alt="" className="relative aspect-[4/3] w-full rounded-3xl object-cover" />
          </motion.div>
        ) : null}
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── work */

function BeforeAfterSection() {
  // A comparison is only ever the owner's own two photos; without both there is no section.
  const { content } = usePage()
  const rm = !!useReducedMotion()
  const b = content.before_after
  if (!b?.before_image || !b?.after_image) return null
  const highlights = (b.highlights || []).filter(Boolean).slice(0, 3)
  return (
    <Section name="before_after" tint>
      <Container>
        <SectionHead eyebrow="النتائج" title={b.heading} sub={b.subheading} />
        <div className="grid grid-cols-2 gap-3 md:gap-5">
          {[{ src: b.before_image, label: b.before_label || 'قبل', after: false }, { src: b.after_image, label: b.after_label || 'بعد', after: true }].map((x, i) => (
            <motion.figure key={i} {...rise(rm, i * 0.08)} className="relative overflow-hidden rounded-2xl">
              <img src={x.src} alt={x.label} className="aspect-[4/5] w-full object-cover md:aspect-[4/3]" />
              <figcaption
                className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold"
                style={x.after ? { background: 'var(--sv-accent)', color: 'var(--sv-on-accent)' } : { background: 'rgba(0,0,0,0.65)', color: '#fff' }}
              >
                {x.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
        {highlights.length ? (
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-[0.95rem] leading-7"><CircleCheck className="mt-1 h-4 w-4 shrink-0" style={{ color: 'var(--sv-brand)' }} aria-hidden />{h}</li>
            ))}
          </ul>
        ) : null}
      </Container>
    </Section>
  )
}

function GallerySection() {
  // The owner's uploads only. None: no section.
  const { content } = usePage()
  const rm = !!useReducedMotion()
  const images = (content.gallery?.images || []).filter((i) => i.url).slice(0, 8)
  if (!images.length) return null
  return (
    <Section name="gallery">
      <Container>
        <SectionHead eyebrow="من أعمالنا" title={content.gallery.heading} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {images.map((image, i) => (
            <motion.div
              key={`${image.url}-${i}`}
              {...rise(rm, Math.min(i, 5) * 0.05)}
              className={`overflow-hidden rounded-2xl ${i === 0 && images.length >= 3 ? 'col-span-2 row-span-2' : ''}`}
            >
              <img
                src={image.url}
                alt={image.alt || ''}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04] motion-reduce:hover:scale-100"
                style={{ aspectRatio: i === 0 && images.length >= 3 ? 'auto' : '1 / 1', minHeight: i === 0 && images.length >= 3 ? '100%' : undefined }}
              />
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── areas */

function mapsLink(content: ServiceContent): string | null {
  const q = [content.footer.address, content.brand.city].filter(Boolean).join('، ')
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}

function AreasSection() {
  const { content, isDark } = usePage()
  const rm = !!useReducedMotion()
  const a = content.areas
  const areas = (a?.areas_served || []).filter(Boolean)
  const address = content.footer.address
  const maps = mapsLink(content)
  const facts: { icon: LucideIcon; label: string; value: string }[] = [
    ...(a?.availability ? [{ icon: Clock, label: 'أوقات العمل', value: a.availability }] : []),
    ...(a?.response_time ? [{ icon: Timer, label: 'سرعة الاستجابة', value: a.response_time }] : []),
    ...(address ? [{ icon: MapPin, label: 'العنوان', value: address }] : []),
  ]
  if (!areas.length && !facts.length) return null
  return (
    <Section id="areas" name="areas" tint>
      <Container>
        <SectionHead eyebrow="أين نعمل" title={a.heading} sub={a.subheading} />
        <div className={`grid grid-cols-1 gap-6 ${areas.length && facts.length ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]' : ''}`}>
          {areas.length ? (
            <motion.ul {...rise(rm)} className="flex flex-wrap content-start gap-2.5">
              {areas.map((area) => (
                <li key={area} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[0.95rem]" style={{ borderColor: 'var(--sv-border)', background: 'var(--sv-bg)' }}>
                  <MapPin className="h-4 w-4" style={{ color: 'var(--sv-brand)' }} aria-hidden />{area}
                </li>
              ))}
            </motion.ul>
          ) : null}
          {facts.length ? (
            <motion.div {...rise(rm, 0.08)} className="p-5 md:p-6" style={{ ...card(isDark), background: 'var(--sv-bg)' }}>
              <dl className="space-y-4">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <IconTile icon={f.icon} />
                    <div className="min-w-0 pt-0.5">
                      <dt className="text-sm" style={{ color: 'var(--sv-muted)' }}>{f.label}</dt>
                      <dd className="mt-0.5 font-semibold leading-7">{f.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              {maps ? (
                <div className="mt-5">
                  <Btn kind="outline" size="md" href={maps} external icon={<Navigation className="h-4 w-4" aria-hidden />} full>افتح في خرائط Google</Btn>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── faq */

function FaqSection() {
  const { content, isDark, wa } = usePage()
  const rm = !!useReducedMotion()
  const [open, setOpen] = useState(0)
  const items = (content.faq?.items || []).filter((i) => i.q)
  if (!items.length) return null
  return (
    <Section id="faq" name="faq">
      <Container className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
        <div>
          <SectionHead eyebrow="أسئلة شائعة" title={content.faq.heading} />
          {wa ? (
            <motion.div {...rise(rm, 0.1)} className="-mt-4 p-5" style={card(isDark)}>
              <p className="font-bold">لم تجد إجابتك؟</p>
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--sv-muted)' }}>اسألنا مباشرة، ونرد عليك في أقرب وقت.</p>
              <div className="mt-4"><Btn kind="whatsapp" size="md" href={withText(wa, `مرحبًا ${content.brand.name}، عندي سؤال:`)} external icon={<WaGlyph className="h-4 w-4" />}>اسألنا على واتساب</Btn></div>
            </motion.div>
          ) : null}
        </div>
        <motion.div {...rise(rm, 0.05)} className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={`${item.q}-${i}`} className="overflow-hidden transition-colors" style={{ ...card(isDark), borderRadius: 16, borderColor: isOpen ? 'var(--sv-brand)' : 'var(--sv-border)' }}>
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex min-h-[60px] w-full items-center justify-between gap-4 px-5 py-4 text-right"
                  >
                    <span className="text-[1rem] font-semibold leading-7 md:text-[1.05rem]">{item.q}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--sv-brand)' }} aria-hidden />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="a"
                      initial={rm ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={rm ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={rm ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                    >
                      <p className="px-5 pb-5 text-[0.95rem] leading-7" style={{ color: 'var(--sv-muted)' }}>{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </motion.div>
      </Container>
    </Section>
  )
}

/* ─────────────────────────────────────────────────────────── closing call */

function FinalCta() {
  const { content, wa, go } = usePage()
  const rm = !!useReducedMotion()
  const f = content.final_cta
  if (!f?.heading) return null
  return (
    <section data-section="final_cta" className="pb-16 md:pb-24">
      <Container>
        <motion.div
          {...rise(rm)}
          className="relative isolate overflow-hidden rounded-[28px] px-6 py-10 text-white md:px-12 md:py-14"
          style={{ background: 'var(--sv-primary)' }}
        >
          <div aria-hidden className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full" style={{ background: 'var(--sv-accent)', opacity: 0.2, filter: 'blur(12px)' }} />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance text-[1.6rem] md:text-[2.1rem]" style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.3, fontWeight: 700 }}>{f.heading}</h2>
              {f.subheading ? <p className="mt-2 text-base leading-8" style={{ color: 'rgba(255,255,255,0.84)' }}>{f.subheading}</p> : null}
              {f.secondary_text ? <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}><CircleCheck className="h-4 w-4" style={{ color: 'var(--sv-accent)' }} aria-hidden />{f.secondary_text}</p> : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Btn kind="accent" onClick={() => go('contact')}>{f.cta_label || 'تواصل معنا'}</Btn>
              {wa ? <Btn kind="whatsapp" href={wa} external icon={<WaGlyph />}>واتساب</Btn> : null}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── social */

const X_PATH = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'

type SocialKey = keyof ServiceSocialLinks
const SOCIAL: { key: SocialKey; label: string; url: (h: string) => string; path?: string; Icon?: LucideIcon }[] = [
  { key: 'instagram', label: 'إنستغرام', url: (h) => `https://instagram.com/${h}`, path: INSTAGRAM.path },
  { key: 'tiktok', label: 'تيك توك', url: (h) => `https://www.tiktok.com/@${h}`, path: TIKTOK.path },
  { key: 'snapchat', label: 'سناب شات', url: (h) => `https://www.snapchat.com/add/${h}`, Icon: Ghost },
  { key: 'facebook', label: 'فيسبوك', url: (h) => `https://facebook.com/${h}`, path: FACEBOOK.path },
  { key: 'x', label: 'إكس', url: (h) => `https://x.com/${h}`, path: X_PATH },
  { key: 'youtube', label: 'يوتيوب', url: (h) => `https://www.youtube.com/@${h}`, path: YOUTUBE.path },
]

/** A full link as given; "site.com/x" gets https; a bare handle becomes the profile link. */
function socialHref(raw: string, url: (h: string) => string): string | null {
  const v = raw.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (/^[\w.-]+\.[a-z]{2,}\//i.test(v)) return `https://${v}`
  const handle = v.replace(/^@/, '').replace(/\s+/g, '')
  return handle ? url(handle) : null
}

function socialLinks(content: ServiceContent) {
  const s = content.social_links || {}
  return SOCIAL.flatMap((p) => {
    const href = socialHref(s[p.key] || '', p.url)
    return href ? [{ ...p, href }] : []
  })
}

function SocialRow({ className = '', onDark }: { className?: string; onDark?: boolean }) {
  const { content } = usePage()
  const links = socialLinks(content)
  if (!links.length) return null
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="حساباتنا على التواصل الاجتماعي">
      {links.map((l) => (
        <li key={l.key}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            title={l.label}
            className="grid h-11 w-11 place-items-center rounded-xl border transition-[transform,opacity] duration-200 hover:-translate-y-px hover:opacity-80 motion-reduce:hover:translate-y-0"
            style={onDark ? { borderColor: 'rgba(255,255,255,0.18)', color: '#fff' } : { borderColor: 'var(--sv-border)', color: 'var(--sv-text)' }}
          >
            {l.Icon ? <l.Icon className="h-5 w-5" aria-hidden /> : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[18px] w-[18px]"><path d={l.path} /></svg>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}

/* ─────────────────────────────────────────────────────────── footer */

function Footer() {
  const { content, isDark, go, wa } = usePage()
  const f = content.footer
  const hours = content.areas?.availability
  const maps = mapsLink(content)
  const year = new Date().getFullYear()
  return (
    <footer
      data-section="footer"
      className="text-white"
      style={{ background: isDark ? 'var(--sv-surface)' : 'color-mix(in srgb, var(--sv-primary) 18%, #0b1220)' }}
    >
      <Container className="grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <p className="text-xl font-bold" style={{ fontFamily: 'var(--sv-heading-font)' }}>{content.brand.name}</p>
          {f.tagline ? <p className="mt-3 max-w-sm text-[0.95rem] leading-7" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.tagline}</p> : null}
          <SocialRow onDark className="mt-5" />
        </div>
        <nav aria-label="صفحات الموقع">
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>الصفحات</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 md:grid-cols-1">
            {PAGES.map((p) => (
              <li key={p.view}><button onClick={() => go(p.view)} className="flex min-h-[44px] items-center text-[0.95rem] hover:opacity-75" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.label}</button></li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>تواصل معنا</p>
          <ul className="mt-3 space-y-1 text-[0.95rem]" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {f.phone ? <li><a href={`tel:${f.phone}`} className="flex min-h-[40px] items-center gap-2.5 hover:opacity-75"><Phone className="h-4 w-4 opacity-70" aria-hidden /><bdi dir="ltr">{f.phone}</bdi></a></li> : null}
            {wa ? <li><a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-[40px] items-center gap-2.5 hover:opacity-75"><WaGlyph className="h-4 w-4 opacity-70" />واتساب</a></li> : null}
            {f.email ? <li><a href={`mailto:${f.email}`} className="flex min-h-[40px] items-center gap-2.5 break-all hover:opacity-75"><Mail className="h-4 w-4 shrink-0 opacity-70" aria-hidden />{f.email}</a></li> : null}
            {f.address ? (
              <li>
                {maps ? (
                  <a href={maps} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 py-2 leading-7 hover:opacity-75"><MapPin className="mt-1.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />{f.address}</a>
                ) : <span className="flex items-start gap-2.5 py-2 leading-7"><MapPin className="mt-1.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />{f.address}</span>}
              </li>
            ) : null}
            {hours ? <li className="flex items-start gap-2.5 py-2 leading-7"><Clock className="mt-1.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />{hours}</li> : null}
          </ul>
        </div>
      </Container>
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <Container className="py-5 text-xs" >
          <p style={{ color: 'rgba(255,255,255,0.55)' }}>{f.legal || `© ${year} ${content.brand.name}`}</p>
        </Container>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────── floating WhatsApp */

/**
 * A WhatsApp button that stays with the visitor once they scroll past the
 * first screen. Bottom left: the Made with Zenya badge holds bottom right, and
 * the cookie box, which opens bottom left, sits above this until it is closed.
 */
function WhatsAppFloat() {
  const { wa } = usePage()
  const rm = !!useReducedMotion()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > 520)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  if (!wa) return null
  return (
    <AnimatePresence>
      {show ? (
        <motion.a
          key="wa"
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل معنا على واتساب"
          initial={rm ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.92 }}
          animate={rm ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.92 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed left-4 z-50 inline-flex h-[52px] items-center gap-2 rounded-full pe-5 ps-4 text-sm font-bold text-white"
          style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', background: WA_GREEN, boxShadow: '0 10px 28px rgba(0,0,0,0.25)', fontFamily: 'var(--sv-body-font)' }}
        >
          <WaGlyph className="h-6 w-6" />
          <span>واتساب</span>
        </motion.a>
      ) : null}
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────────────────────── colour */

/** Dark ink or white, whichever reads on a solid colour. Anything not hex gets white. */
function readableOn(color: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((color || '').trim())
  if (!m) return '#ffffff'
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // Contrast with white vs with #0b1220 (L≈0.006).
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.056) ? '#ffffff' : '#0b1220'
}
