"use client"

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { ServiceContent } from '@/utils/services/types'
import { getServicePreset } from '@/utils/services/presets'
import { getTypographyPreset } from '@/utils/theme-editor-typography'
import BookingForm from '@/components/site/BookingForm'
import { useBookingContext } from '@/components/site/BookingContext'

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

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.45, ease: 'easeOut' as const }
}

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
  const colors = useMemo(
    () => ({ ...preset.colors, ...(colorOverrides || {}) }),
    [preset.colors, colorOverrides]
  )
  const typo = typographyPreset ? getTypographyPreset(typographyPreset) : null
  const headingFont = typo?.heading_font ?? preset.heading_font
  const bodyFont    = typo?.body_font    ?? preset.body_font
  const isDark = preset.id === 'graphite'
  const [internalView, setInternalView] = useState<ServiceView>('home')
  const view = (controlledView as ServiceView) || internalView
  const setView = (v: ServiceView) => {
    if (onViewChange) onViewChange(v); else setInternalView(v)
  }

  const cssVars = useMemo(
    () =>
      ({
        '--sv-primary': colors.primary,
        '--sv-accent': colors.accent,
        '--sv-bg': colors.background,
        '--sv-surface': colors.surface,
        '--sv-text': colors.text,
        '--sv-muted': colors.muted,
        '--sv-border': colors.border,
        '--sv-heading-font': headingFont,
        '--sv-body-font': bodyFont,
      }) as React.CSSProperties,
    [colors, headingFont, bodyFont]
  )

  return (
    <div
      className={className}
      style={{
        ...cssVars,
        background: 'var(--sv-bg)',
        color: 'var(--sv-text)',
        fontFamily: 'var(--sv-body-font)',
        minHeight: '100%'
      }}
    >
      <FontPreload />
      <TopBar content={content} isDark={isDark} />
      <NavBar content={content} isDark={isDark} view={view} setView={setView} />

      {view === 'home' && (
        <>
          <Hero content={content} isDark={isDark} />
          <TrustBar content={content} isDark={isDark} />
          <ServicesSection content={content} isDark={isDark} />
          <TestimonialsSection content={content} isDark={isDark} />
          <OfferSection content={content} isDark={isDark} />
        </>
      )}
      {view === 'services' && (
        <>
          <ServicesSection content={content} isDark={isDark} />
          <ProofSection content={content} isDark={isDark} />
          <BeforeAfterSection content={content} isDark={isDark} />
          <GallerySection content={content} isDark={isDark} />
        </>
      )}
      {view === 'about' && (
        <>
          <StorySection content={content} isDark={isDark} />
          <ProofSection content={content} isDark={isDark} />
          <TestimonialsSection content={content} isDark={isDark} />
        </>
      )}
      {view === 'process' && (
        <>
          <ProcessSection content={content} isDark={isDark} />
          <BeforeAfterSection content={content} isDark={isDark} />
        </>
      )}
      {view === 'contact' && (
        <>
          <AreasSection content={content} isDark={isDark} />
          <FaqSection content={content} isDark={isDark} />
          <OfferSection content={content} isDark={isDark} />
        </>
      )}

      <Footer content={content} isDark={isDark} />
    </div>
  )
}

function FontPreload() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Sora:wght@500;600;700;800&display=swap"
    />
  )
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1280px] px-6 md:px-10 lg:px-16 ${className}`}>{children}</div>
}

function Heading({ children, className = '', size = 'lg' }: { children: React.ReactNode; className?: string; size?: 'md' | 'lg' | 'xl' | '2xl' }) {
  const sizes = {
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl',
    '2xl': 'text-5xl md:text-7xl'
  } as const

  return (
    <h2
      className={`${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 1.02, fontWeight: 800 }}
    >
      {children}
    </h2>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.72rem] font-semibold" style={{ color: 'var(--sv-accent)' }}>
      {children}
    </p>
  )
}

function surfaceCard(isDark: boolean) {
  return {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.82)',
    border: '1px solid var(--sv-border)',
    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.28)' : '0 18px 50px rgba(15, 23, 42, 0.08)',
    backdropFilter: 'blur(18px)'
  } as React.CSSProperties
}

function TopBar({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <div
      className="border-b"
      style={{
        borderColor: 'var(--sv-border)',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.65)'
      }}
    >
      <Container className="flex flex-col gap-2 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3" style={{ color: 'var(--sv-muted)' }}>
          <span>{content.brand.city}{content.brand.region ? `, ${content.brand.region}` : ''}</span>
          {content.areas.availability ? <><span>•</span><span>{content.areas.availability}</span></> : null}
          {content.areas.response_time ? <><span>•</span><span>{content.areas.response_time}</span></> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3" style={{ color: 'var(--sv-muted)' }}>
          <a href={`tel:${content.footer.phone}`} dir="ltr" className="inline-flex min-h-[44px] -my-3 items-center transition hover:opacity-75">{content.footer.phone}</a>
          <span>•</span>
          <a href={`mailto:${content.footer.email}`} className="inline-flex min-h-[44px] -my-3 items-center transition hover:opacity-75">{content.footer.email}</a>
        </div>
      </Container>
    </div>
  )
}

function NavBar({ content, isDark, view, setView }: { content: ServiceContent; isDark: boolean; view: ServiceView; setView: (v: ServiceView) => void }) {
  const links: { label: string; view: ServiceView }[] = [
    { label: 'الخدمات', view: 'services' },
    { label: 'من نحن', view: 'about' },
    { label: 'آلية العمل', view: 'process' },
    { label: 'تواصل', view: 'contact' },
  ]
  const [menuOpen, setMenuOpen] = useState(false)
  // Close the mobile menu whenever the page changes.
  const go = (v: ServiceView) => { setView(v); setMenuOpen(false) }

  return (
    <div
      className="sticky top-0 z-30 border-b backdrop-blur-xl"
      style={{
        background: isDark ? 'rgba(9,12,18,0.78)' : 'rgba(244,248,252,0.78)',
        borderColor: 'var(--sv-border)'
      }}
    >
      <Container className="flex items-center justify-between py-4">
        <button onClick={() => setView('home')} className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-black" style={{ background: 'var(--sv-primary)', color: '#ffffff' }}>
            {content.brand.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p style={{ fontFamily: 'var(--sv-heading-font)', fontWeight: 800 }}>{content.brand.name}</p>
            <p className="text-xs" style={{ color: 'var(--sv-muted)' }}>{content.brand.category}</p>
          </div>
        </button>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <button key={link.view} onClick={() => setView(link.view)} className="text-sm font-medium transition hover:opacity-75" style={{ color: view === link.view ? 'var(--sv-accent)' : 'var(--sv-muted)', fontWeight: view === link.view ? 700 : 500 }}>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setView('contact')}
            className="rounded-full px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
            style={{ background: 'var(--sv-accent)', color: '#08111d' }}
          >
            {content.hero.primary_cta}
          </button>
          {/* Hamburger — only below md, where the inline nav is hidden. */}
          <button
            type="button"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl md:hidden"
            style={{ border: '1px solid var(--sv-border)', color: 'var(--sv-text)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {menuOpen
                ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile dropdown — the page list, unreachable below md without this. */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden border-t md:hidden"
          style={{ borderColor: 'var(--sv-border)' }}
        >
          <Container className="flex flex-col py-2">
            {links.map((link) => (
              <button
                key={link.view}
                onClick={() => go(link.view)}
                className="py-3 text-right text-[0.95rem] font-medium transition"
                style={{ color: view === link.view ? 'var(--sv-accent)' : 'var(--sv-text)', fontWeight: view === link.view ? 700 : 500 }}
              >
                {link.label}
              </button>
            ))}
          </Container>
        </motion.div>
      )}
    </div>
  )
}

function Hero({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <section id="top" data-section="hero" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={content.hero.image}
          alt=""
          className="h-full w-full object-cover"
          style={{ filter: isDark ? 'brightness(0.38)' : 'brightness(0.48)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(9,12,18,0.9) 8%, rgba(9,12,18,0.45) 58%, rgba(9,12,18,0.8) 100%)'
              : 'linear-gradient(135deg, rgba(6,14,24,0.72) 0%, rgba(6,14,24,0.3) 56%, rgba(255,255,255,0.15) 100%)'
          }}
        />
      </div>
      <Container className="relative py-24 md:py-32 lg:py-36">
        {/* The stats column is the owner's numbers only. Without any, the grid
            collapses to one track so the copy is not pushed to one side of an
            empty column. */}
        <motion.div {...reveal} className={`grid gap-10 lg:items-end ${content.hero.stats?.length ? 'lg:grid-cols-[1.1fr_0.72fr]' : ''}`}>
          <div className="max-w-3xl text-white">
            <Eyebrow>{content.hero.eyebrow}</Eyebrow>
            <h1
              className="mt-6 whitespace-pre-line text-5xl md:text-7xl"
              style={{ fontFamily: 'var(--sv-heading-font)', lineHeight: 0.96, fontWeight: 800 }}
            >
              {content.hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82">{content.hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#quote" className="rounded-full px-7 py-4 text-sm font-bold transition hover:-translate-y-0.5" style={{ background: 'var(--sv-accent)', color: '#08111d' }}>
                {content.hero.primary_cta}
              </a>
              <a href="#services" className="rounded-full border px-7 py-4 text-sm font-semibold transition hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}>
                {content.hero.secondary_cta}
              </a>
            </div>
          </div>
          {content.hero.stats?.length ? (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {content.hero.stats.slice(0, 3).map((stat) => (
              <div key={stat.label} className="rounded-[28px] p-5" style={{ ...surfaceCard(true), background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-white/72">{stat.label}</p>
              </div>
            ))}
          </div>
          ) : null}
        </motion.div>
      </Container>
    </section>
  )
}

function TrustBar({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  if (!content.trust_bar?.items?.length) return null
  return (
    <section data-section="trust_bar" className="border-y py-5" style={{ borderColor: 'var(--sv-border)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.7)' }}>
      <Container className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
        {content.trust_bar.items.map((item) => (
          <div key={item} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm" style={{ borderColor: 'var(--sv-border)', color: 'var(--sv-text)' }}>
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--sv-accent)' }} />
            {item}
          </div>
        ))}
      </Container>
    </section>
  )
}

function ServicesSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <section id="services" data-section="services" className="py-24 md:py-28">
      <Container>
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>الخدمات</Eyebrow>
          <Heading className="mt-5">{content.services.heading}</Heading>
          <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.services.subheading}</p>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {content.services.items.map((item, index) => (
            <motion.div
              key={`${item.name}-${index}`}
              {...reveal}
              transition={{ ...reveal.transition, delay: 0.04 * index }}
              className="rounded-[30px] p-7"
              style={surfaceCard(isDark)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-black" style={{ background: 'var(--sv-primary)', color: '#ffffff' }}>
                  0{index + 1}
                </div>
                {item.badge && (
                  <span className="rounded-full px-3 py-1 text-[0.7rem] font-bold" style={{ background: `${isDark ? '#ffffff' : 'var(--sv-primary)'}14`, color: 'var(--sv-accent)' }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-7 text-2xl" style={{ fontFamily: 'var(--sv-heading-font)', fontWeight: 800 }}>
                {item.name}
              </h3>
              {item.description ? <p className="mt-3 text-sm leading-7" style={{ color: 'var(--sv-muted)' }}>{item.description}</p> : null}
              {item.price_from && <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--sv-primary)' }}>{item.price_from}</p>}
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function StorySection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <section data-section="story" className="py-24 md:py-28" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)' }}>
      <Container>
        <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[34px]">
            <img src={content.story.image || content.hero.image} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="rounded-[34px] p-8 md:p-10" style={surfaceCard(isDark)}>
            <Eyebrow>{content.story.eyebrow}</Eyebrow>
            <Heading className="mt-5">{content.story.heading}</Heading>
            <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.story.body}</p>
            {content.story.quote && (
              <blockquote className="mt-8 rounded-[26px] border p-6 text-lg leading-8 italic" style={{ borderColor: 'var(--sv-border)', color: 'var(--sv-text)', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)' }}>
                "{content.story.quote}"
              </blockquote>
            )}
            {(content.story.owner_name || content.story.owner_title) && (
              <div className="mt-6">
                <p className="font-bold">{content.story.owner_name}</p>
                <p className="text-sm" style={{ color: 'var(--sv-muted)' }}>{content.story.owner_title}</p>
              </div>
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

function ProofSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  if (!content.proof?.items?.length) return null
  return (
    <section id="proof" data-section="proof" className="py-24 md:py-28">
      <Container>
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>لماذا تختارنا</Eyebrow>
          <Heading className="mt-5">{content.proof.heading}</Heading>
          <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.proof.subheading}</p>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-3">
          {content.proof.items.slice(0, 3).map((item, index) => (
            <motion.div key={item.title} {...reveal} transition={{ ...reveal.transition, delay: 0.05 * index }} className="rounded-[30px] p-7" style={surfaceCard(isDark)}>
              <p className="text-sm font-black uppercase tracking-[0.28em]" style={{ color: 'var(--sv-accent)' }}>0{index + 1}</p>
              <h3 className="mt-5 text-2xl" style={{ fontFamily: 'var(--sv-heading-font)', fontWeight: 800 }}>{item.title}</h3>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--sv-muted)' }}>{item.text}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function BeforeAfterSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  // A comparison is only ever the owner's own two photos. The generator no
  // longer fills a missing one with stock, and a stock pair would present
  // someone else's work as this business's, so without both there is no section.
  if (!content.before_after?.before_image || !content.before_after?.after_image) return null
  return (
    <section data-section="before_after" className="py-24 md:py-28" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.58)' }}>
      <Container>
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>النتائج</Eyebrow>
          <Heading className="mt-5">{content.before_after.heading}</Heading>
          <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.before_after.subheading}</p>
        </motion.div>
        <motion.div {...reveal} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-[30px]" style={surfaceCard(isDark)}>
              <div className="relative">
                <img src={content.before_after.before_image} alt={content.before_after.before_label} className="aspect-[4/5] w-full object-cover" />
                <span className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">{content.before_after.before_label}</span>
              </div>
            </div>
            <div className="overflow-hidden rounded-[30px]" style={surfaceCard(isDark)}>
              <div className="relative">
                <img src={content.before_after.after_image} alt={content.before_after.after_label} className="aspect-[4/5] w-full object-cover" />
                <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'var(--sv-accent)', color: '#08111d' }}>{content.before_after.after_label}</span>
              </div>
            </div>
          </div>
          {content.before_after.highlights?.length ? (
          <div className="rounded-[34px] p-8 md:p-10" style={surfaceCard(isDark)}>
            <p className="text-sm font-semibold" style={{ color: 'var(--sv-accent)' }}>لقطة التحوّل</p>
            <div className="mt-8 space-y-5">
              {content.before_after.highlights.slice(0, 3).map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border p-4" style={{ borderColor: 'var(--sv-border)' }}>
                  <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: 'var(--sv-accent)' }} />
                  <p className="text-sm leading-7" style={{ color: 'var(--sv-muted)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </motion.div>
      </Container>
    </section>
  )
}

function ProcessSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <section data-section="process" className="py-24 md:py-28">
      <Container>
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>آلية العمل</Eyebrow>
          <Heading className="mt-5">{content.process.heading}</Heading>
          <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.process.subheading}</p>
        </motion.div>
        <div className="grid gap-5 lg:grid-cols-3">
          {content.process.steps.map((step, index) => (
            <motion.div key={step.step} {...reveal} transition={{ ...reveal.transition, delay: 0.05 * index }} className="rounded-[30px] p-7" style={surfaceCard(isDark)}>
              <p className="text-4xl font-black" style={{ color: 'var(--sv-primary)' }}>{step.step}</p>
              <h3 className="mt-6 text-2xl" style={{ fontFamily: 'var(--sv-heading-font)', fontWeight: 800 }}>{step.title}</h3>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--sv-muted)' }}>{step.text}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function AreasSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <section id="areas" data-section="areas" className="py-24 md:py-28" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.58)' }}>
      <Container>
        <motion.div {...reveal} className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-[34px] p-8 md:p-10" style={surfaceCard(isDark)}>
            <Eyebrow>منطقة الخدمة</Eyebrow>
            <Heading className="mt-5">{content.areas.heading}</Heading>
            <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.areas.subheading}</p>
            {content.areas.response_time || content.areas.availability ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {content.areas.response_time ? (
              <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--sv-border)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--sv-accent)' }}>الاستجابة</p>
                <p className="mt-3 text-base font-semibold">{content.areas.response_time}</p>
              </div>
              ) : null}
              {content.areas.availability ? (
              <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--sv-border)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--sv-accent)' }}>التوفّر</p>
                <p className="mt-3 text-base font-semibold">{content.areas.availability}</p>
              </div>
              ) : null}
            </div>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.areas.areas_served.map((area, index) => (
              <motion.div key={area} {...reveal} transition={{ ...reveal.transition, delay: 0.03 * index }} className="rounded-[26px] border px-5 py-4 text-sm font-semibold" style={{ ...surfaceCard(isDark), padding: '1rem 1.25rem' }}>
                {area}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

function OfferSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  const { enabled, preview } = useBookingContext()
  // The quote form only exists where a request can reach the owner: an
  // entitled live site, or the editor, where a submit is a harmless no-op. On
  // any other live site it would take a visitor's request and lose it, so the
  // card offers the owner's own phone (call and WhatsApp), else their email,
  // and with neither the card is left out.
  const showForm = enabled || preview
  const phone = (content.footer.phone || '').trim()
  const email = (content.footer.email || '').trim()
  const whatsapp = whatsappLink(phone)
  const hasContact = !!phone || !!email
  return (
    <section id="quote" data-section="offer" className="py-24 md:py-28">
      <Container>
        <motion.div {...reveal} className={`grid gap-6 ${showForm || hasContact ? 'lg:grid-cols-[1fr_0.9fr]' : ''}`}>
          <div className="rounded-[36px] p-8 md:p-10" style={{ ...surfaceCard(isDark), background: isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(255,255,255,0.05))' : 'linear-gradient(135deg, rgba(34,199,242,0.14), rgba(255,255,255,0.95))' }}>
            {content.offer.badge && (
              <span className="inline-flex rounded-full px-3 py-1 text-[0.7rem] font-bold" style={{ background: 'var(--sv-accent)', color: '#08111d' }}>
                {content.offer.badge}
              </span>
            )}
            <Heading className="mt-6">{content.offer.heading}</Heading>
            <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.offer.subheading}</p>
            {content.offer.points?.length ? (
            <div className="mt-7 space-y-3">
              {content.offer.points.slice(0, 3).map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-[22px] border p-4" style={{ borderColor: 'var(--sv-border)', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)' }}>
                  <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: 'var(--sv-accent)' }} />
                  <p className="text-sm leading-7">{point}</p>
                </div>
              ))}
            </div>
            ) : null}
          </div>
          {showForm ? (
            <div className="rounded-[36px] p-8 md:p-10" style={surfaceCard(isDark)}>
              <p className="text-xs font-bold" style={{ color: 'var(--sv-accent)' }}>اطلب عرض سعر</p>
              <div className="mt-6">
                <BookingForm type="quote" palette={servicesPalette(isDark)} />
              </div>
            </div>
          ) : hasContact ? (
            <div className="flex flex-col rounded-[36px] p-8 md:p-10" style={surfaceCard(isDark)}>
              <p className="text-xs font-bold" style={{ color: 'var(--sv-accent)' }}>اطلب عرض سعر</p>
              <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>
                {phone ? 'تواصل معنا مباشرةً بمكالمة أو رسالة واتساب، ونرتّب معك التفاصيل.' : 'راسلنا بتفاصيل ما تحتاجه، ونعود إليك.'}
              </p>
              <div className="mt-8 space-y-3">
                {phone ? (
                  <a href={`tel:${phone}`} className="flex min-h-[52px] w-full items-center flex-wrap justify-center gap-x-2 rounded-full px-6 py-4 text-sm font-bold transition hover:-translate-y-0.5" style={{ background: 'var(--sv-primary)', color: '#ffffff' }}>
                    اتصل بنا
                    <span dir="ltr" className="font-semibold opacity-80">{phone}</span>
                  </a>
                ) : null}
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex min-h-[52px] w-full items-center justify-center rounded-full border px-6 py-4 text-sm font-bold transition hover:-translate-y-0.5" style={{ borderColor: 'var(--sv-border)', color: 'var(--sv-text)' }}>
                    راسلنا على واتساب
                  </a>
                ) : null}
                {!phone && email ? (
                  <a href={`mailto:${email}`} className="flex min-h-[52px] w-full items-center flex-wrap justify-center gap-x-2 rounded-full px-6 py-4 text-sm font-bold transition hover:-translate-y-0.5" style={{ background: 'var(--sv-primary)', color: '#ffffff' }}>
                    راسلنا بالبريد
                    <span dir="ltr" className="break-all font-semibold opacity-80">{email}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </motion.div>
      </Container>
    </section>
  )
}

/**
 * wa.me takes the number in international form, digits only. A number the
 * owner wrote locally (no + or 00 prefix) has no country code to recover, and
 * a guessed one would open a chat with a stranger, so it gets no WhatsApp link
 * and the card keeps the call button alone.
 */
function whatsappLink(phone: string): string | null {
  const raw = phone.trim()
  if (!/^(\+|00)/.test(raw)) return null
  const digits = raw.replace(/\D/g, '').replace(/^00/, '')
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}

function servicesPalette(isDark: boolean) {
  return {
    accent: 'var(--sv-primary)',
    accentText: '#ffffff',
    text: 'var(--sv-text)',
    muted: 'var(--sv-muted)',
    surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    border: 'var(--sv-border)',
    headingFont: 'var(--sv-heading-font)',
    bodyFont: 'var(--sv-body-font)',
    radius: 14,
  }
}

function TestimonialsSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  // Only the owner's own reviews and rating are ever here. No reviews: no section.
  const t = content.testimonials
  if (!t?.items?.length) return null
  const avg = typeof t.average_rating === 'number' && t.average_rating > 0 ? t.average_rating : 0
  return (
    <section id="reviews" data-section="testimonials" className="py-24 md:py-28" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.58)' }}>
      <Container>
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>الآراء</Eyebrow>
          <Heading className="mt-5">{content.testimonials.heading}</Heading>
          <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.testimonials.subheading}</p>
          {avg ? (
            <div className="mt-6 flex items-center gap-3">
              <Stars rating={avg} />
              <span className="text-sm font-semibold" style={{ color: 'var(--sv-muted)' }}>
                {avg.toFixed(1)} من 5{t.review_count ? ` · ${t.review_count}${/^[\d\s.,+٠-٩]+$/.test(t.review_count) ? ' تقييم' : ''}` : ''}
              </span>
            </div>
          ) : null}
        </motion.div>
        <div className="grid gap-5 lg:grid-cols-3">
          {content.testimonials.items.map((item, index) => (
            <motion.div key={`${item.name}-${index}`} {...reveal} transition={{ ...reveal.transition, delay: 0.05 * index }} className="rounded-[30px] p-7" style={surfaceCard(isDark)}>
              <Stars rating={item.rating} />
              <p className="mt-5 text-base leading-8 italic" style={{ color: 'var(--sv-text)' }}>
                "{item.text}"
              </p>
              <div className="mt-6">
                <p className="font-bold">{item.name}</p>
                {item.service || item.source ? (
                  <p className="text-xs" style={{ color: 'var(--sv-accent)' }}>{[item.service, item.source].filter(Boolean).join(' · ')}</p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function FaqSection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  const [open, setOpen] = useState(0)
  if (!content.faq?.items?.length) return null
  return (
    <section id="faq" data-section="faq" className="py-24 md:py-28">
      <Container>
        <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-[34px] p-8 md:p-10" style={surfaceCard(isDark)}>
            <Eyebrow>الأسئلة الشائعة</Eyebrow>
            <Heading className="mt-5">{content.faq.heading}</Heading>
            <p className="mt-5 text-lg leading-8" style={{ color: 'var(--sv-muted)' }}>{content.final_cta.subheading}</p>
            <a href="#quote" className="mt-8 inline-flex rounded-full px-6 py-4 text-sm font-bold transition hover:-translate-y-0.5" style={{ background: 'var(--sv-accent)', color: '#08111d' }}>
              {content.final_cta.cta_label}
            </a>
          </div>
          <div className="rounded-[34px] p-4 md:p-5" style={surfaceCard(isDark)}>
            {content.faq.items.map((item, index) => (
              <div key={item.q} className="border-b last:border-b-0" style={{ borderColor: 'var(--sv-border)' }}>
                <button
                  onClick={() => setOpen(open === index ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left"
                >
                  <span className="text-lg font-semibold" style={{ fontFamily: 'var(--sv-heading-font)' }}>{item.q}</span>
                  <span className="text-2xl" style={{ color: 'var(--sv-accent)' }}>{open === index ? '−' : '+'}</span>
                </button>
                {open === index && <p className="px-4 pb-5 text-sm leading-7" style={{ color: 'var(--sv-muted)' }}>{item.a}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

function GallerySection({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  // The owner's uploads only, as with the before/after pair. None: no section.
  if (!content.gallery?.images?.length) return null
  return (
    <section data-section="gallery" className="py-24 md:py-28" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.58)' }}>
      <Container>
        <motion.div {...reveal} className="mb-12 max-w-2xl">
          <Eyebrow>المعرض</Eyebrow>
          <Heading className="mt-5">{content.gallery.heading}</Heading>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-4">
          {content.gallery.images.slice(0, 4).map((image, index) => (
            <motion.div
              key={`${image.url}-${index}`}
              {...reveal}
              transition={{ ...reveal.transition, delay: 0.04 * index }}
              className={`overflow-hidden rounded-[28px] ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              style={surfaceCard(isDark)}
            >
              <img
                src={image.url}
                alt={image.alt || ''}
                className={`w-full object-cover ${index === 0 ? 'aspect-[16/12] h-full md:aspect-auto md:min-h-[420px]' : 'aspect-[4/5]'}`}
              />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Footer({ content, isDark }: { content: ServiceContent; isDark: boolean }) {
  return (
    <footer className="border-t py-16" style={{ borderColor: 'var(--sv-border)' }}>
      <Container className="grid gap-8 md:grid-cols-3">
        <div>
          <p style={{ fontFamily: 'var(--sv-heading-font)', fontSize: '1.6rem', fontWeight: 800 }}>{content.brand.name}</p>
          <p className="mt-4 text-sm leading-7" style={{ color: 'var(--sv-muted)' }}>{content.footer.tagline}</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--sv-accent)' }}>تواصل</p>
          <div className="mt-2 text-sm">
            {content.footer.phone ? <a href={`tel:${content.footer.phone}`} className="flex min-h-[44px] items-center"><bdi dir="ltr">{content.footer.phone}</bdi></a> : null}
            {content.footer.email ? <a href={`mailto:${content.footer.email}`} className="flex min-h-[44px] items-center">{content.footer.email}</a> : null}
            {content.footer.address && <p className="mt-2" style={{ color: 'var(--sv-muted)' }}>{content.footer.address}</p>}
          </div>
        </div>
        <div className="md:text-right">
          {content.final_cta.secondary_text ? <p className="text-sm font-semibold">{content.final_cta.secondary_text}</p> : null}
          <a href="#quote" className="mt-4 inline-flex rounded-full px-6 py-3 text-sm font-bold" style={{ background: 'var(--sv-primary)', color: '#ffffff' }}>
            {content.final_cta.cta_label}
          </a>
          <p className="mt-5 text-xs" style={{ color: 'var(--sv-muted)' }}>{content.footer.legal}</p>
        </div>
      </Container>
    </footer>
  )
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <div className="inline-flex gap-1" style={{ color: 'var(--sv-accent)' }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} style={{ opacity: index < filled ? 1 : 0.28 }}>★</span>
      ))}
    </div>
  )
}
