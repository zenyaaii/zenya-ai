"use client"

import { useEffect, useMemo, useState } from "react"

type SurfaceStyle = "soft" | "glass" | "minimal"
type View = "home" | "product" | "collection" | "about" | "contact" | "faq" | "cart"

export interface ThemePreviewProps {
  name: string
  images: string[]
  primaryColor: string
  secondaryColor: string
  content: any
  price?: number
  originalPrice?: number
  shopName?: string
  initialView?: View
  lockToProduct?: boolean
}

function normalizeStyle(value: any, fallback: SurfaceStyle): SurfaceStyle {
  return value === "glass" || value === "minimal" || value === "soft" ? value : fallback
}

function surfaceClass(style: SurfaceStyle) {
  if (style === "glass") return "border border-[color:var(--border)] bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl"
  if (style === "minimal") return "border border-[color:var(--border)] bg-transparent shadow-none"
  return "border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_24px_80px_rgba(15,23,42,0.10)]"
}

function getPreviewSectionStyles(content: any) {
  const src = content?.sectionStyles || content?._preview?.sectionStyles || {}
  return {
    heroPanel: normalizeStyle(src.heroPanel ?? src.hero_panel, "soft"),
    marketing: normalizeStyle(src.marketing, "soft"),
    socialProof: normalizeStyle(src.socialProof ?? src.social_proof, "soft"),
    faq: normalizeStyle(src.faq, "soft"),
    productMedia: normalizeStyle(src.productMedia ?? src.product_media, "soft"),
    guaranteeBar: normalizeStyle(src.guaranteeBar ?? src.guarantee_bar, "soft"),
    stickyAtc: normalizeStyle(src.stickyAtc ?? src.sticky_atc, "glass"),
  }
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function PreviewPill({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${muted ? "border-slate-200 bg-slate-50 text-slate-700" : "border-[color:color-mix(in_srgb,var(--primary)_22%,var(--border))] bg-[color:color-mix(in_srgb,var(--primary)_10%,white)] text-slate-900"}`}>
      {children}
    </span>
  )
}

function SectionHeading({ eyebrow, heading, text, align = "left" }: { eyebrow: string; heading: string; text?: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: "var(--primary)" }}>{eyebrow}</p>
      <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">{heading}</h2>
      {text ? <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">{text}</p> : null}
    </div>
  )
}

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "collection", label: "Shop" },
  { id: "product", label: "Product" },
  { id: "about", label: "About" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
  { id: "cart", label: "Cart" },
]

export default function ThemePreview({
  name,
  images,
  primaryColor,
  secondaryColor,
  content,
  price = 49.99,
  originalPrice = 99.99,
  shopName,
  initialView = "home",
  lockToProduct = false,
}: ThemePreviewProps) {
  const [view, setView] = useState<View>(lockToProduct ? "product" : initialView)
  const [scrollY, setScrollY] = useState(0)
  const [activeProductTab, setActiveProductTab] = useState(0)
  const [selectedOffer, setSelectedOffer] = useState(1)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const safeImages = Array.isArray(images) && images.length
    ? images
    : ["https://placehold.co/1200x1200/e2e8f0/1e293b?text=Preview+Image"]

  const styles = useMemo(() => getPreviewSectionStyles(content), [content])
  const productName = name || shopName || "Premium Product"
  const shopBrand = shopName || name || "Zenya Store"

  // Normalize content fields
  const hero = content?.hero || {}
  const heroHeading = hero.headline || hero.heading || `The Ultimate ${productName}`
  const heroSubheading = hero.subheadline || hero.subheading || "Premium quality. Fast shipping. Secure checkout."
  const heroCta = hero.cta || hero.primaryLabel || "Shop Now"

  const features: { title: string; desc: string; icon?: string }[] = Array.isArray(content?.features) ? content.features : []
  const testimonials: { name: string; text: string; location?: string; rating?: number }[] = Array.isArray(content?.testimonials) ? content.testimonials : []
  const faqItems: { q: string; a: string }[] = Array.isArray(content?.faq) ? content.faq : []
  const howItWorks: { title: string; text: string }[] = Array.isArray(content?.how_it_works) ? content.how_it_works : []
  const timeline: { year: string; title: string; text: string }[] = Array.isArray(content?.timeline) ? content.timeline : []
  const stats: { value: string; label: string }[] = Array.isArray(content?.stats) ? content.stats : []
  const comparison: { feature: string; us: boolean; them: boolean }[] = Array.isArray(content?.comparison) ? content.comparison : []
  const multicolumn: { title: string; text: string }[] = Array.isArray(content?.multicolumn) ? content.multicolumn : []
  const scrollingText: string[] = Array.isArray(content?.scrolling_text) ? content.scrolling_text : ["Free Shipping", "30-Day Returns", "Secure Checkout", "5-Star Support"]

  const guarantee = content?.guarantee || { title: "30-Day Guarantee", text: "Try it risk-free. Not happy? Full refund.", days: 30 }
  const newsletter = content?.newsletter || { title: "Join the Inner Circle", text: "Get exclusive deals and early access." }
  const collectionPage = content?.collection_page || { headline: "Shop Our Collection", subheadline: "Browse our premium selection.", why_buy_heading: "Why buy from us", why_buy_points: [] }
  const cartDrawer = content?.cart_drawer || { headline: "Your Cart", free_shipping_before: "You're {amount} away from Free Shipping!", checkout_cta: "Checkout Now", secure_line: "Secure checkout — SSL encrypted" }
  const cartPage = content?.cart_page || { headline: "Your Cart", subheadline: "Review your items and check out securely.", checkout_cta: "Checkout Now" }
  const aboutPage = content?.pages?.about || {}
  const contactPage = content?.pages?.contact || {}
  const faqPage = content?.pages?.faq || {}
  const problem = content?.problem || { headline: "Tired of cheap alternatives?", text: "Most products look good but disappoint in real life." }
  const solution = content?.solution || { headline: `Meet ${productName}`, text: "Built to solve every pain point. Durable, stylish, and effective." }

  const trustBadges: { title: string; desc: string }[] = (content?.trust_badges?.badges || [
    { title: "Free Shipping", desc: "On all orders" },
    { title: "30-Day Returns", desc: "Hassle-free" },
    { title: "Secure Checkout", desc: "SSL encrypted" },
    { title: "24/7 Support", desc: "Always here" },
  ])

  const allFaqItems = [...faqItems, ...(faqPage.items || [])].filter((v, i, arr) => arr.findIndex(x => x.q === v.q) === i).slice(0, 8)

  const showStickyAtc = scrollY > 520
  const bundleRows = [
    { label: content?.volume_bundles?.label_buy_1 || "Buy 1 (Standard)", save: "", highlight: false },
    { label: content?.volume_bundles?.label_buy_2 || "Buy 2 (Save 15%)", save: "15% off", highlight: false },
    { label: content?.volume_bundles?.label_buy_3 || "Buy 3 (Save 25%)", save: "25% off", highlight: true },
  ]

  const detailTabs = [
    { label: "Description", heading: features[0]?.title || "Built for performance", text: features[0]?.desc || "High-quality materials designed to last." },
    { label: "Shipping", heading: "Fast, tracked delivery", text: faqItems.find(f => /ship/i.test(f.q))?.a || "Orders ship within 24 hours with full tracking." },
    { label: "Returns", heading: guarantee.title, text: guarantee.text },
  ]

  const goTo = lockToProduct ? () => {} : setView

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{
        ["--primary" as string]: primaryColor,
        ["--secondary" as string]: secondaryColor,
        ["--bg" as string]: "#f8fafc",
        ["--surface" as string]: "rgba(255,255,255,0.92)",
        ["--text" as string]: "#111827",
        ["--border" as string]: "#dbe4ee",
      }}
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.10),transparent_18%),linear-gradient(180deg,rgba(15,23,42,0.035),transparent_16%),linear-gradient(#f8fafc,#f8fafc)]" />

      {/* Announcement Bar */}
      <div className="border-b border-white/10 bg-[linear-gradient(90deg,#0f172a,#111827)] px-4 py-2.5 text-white">
        <div className="mx-auto flex w-[min(1240px,100%)] items-center justify-center gap-6 text-xs font-semibold overflow-hidden">
          {scrollingText.slice(0, 4).map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="opacity-50">✦</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex w-[min(1240px,calc(100%-2rem))] flex-wrap items-center justify-between gap-4 py-4">
          <button onClick={() => goTo("home")} className="text-lg font-black tracking-[-0.04em] text-slate-950 hover:opacity-80 transition">
            {shopBrand}
          </button>
          <nav className="hidden items-center gap-1 text-sm font-semibold md:flex">
            {NAV_ITEMS.filter(n => !lockToProduct || n.id === "product").map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={`rounded-full px-4 py-2 transition ${view === item.id ? "text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                style={view === item.id ? { backgroundColor: primaryColor } : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => goTo("cart")} className="relative hidden text-sm font-semibold text-slate-500 sm:inline hover:text-slate-900 transition">
              Cart (1)
            </button>
            <button onClick={() => goTo("product")} className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition hover:opacity-90" style={{ backgroundColor: primaryColor }}>
              {heroCta}
            </button>
          </div>
        </div>
      </header>

      {/* ========== HOME PAGE ========== */}
      {view === "home" && (
        <>
          {/* Hero */}
          <section className="px-4 pb-8 pt-8 md:px-6 md:pb-12 md:pt-10">
            <div className="mx-auto grid w-[min(1240px,100%)] gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-[linear-gradient(135deg,#0f172a,#111827)] p-8 text-white shadow-[0_32px_90px_rgba(15,23,42,0.24)] md:p-10">
                <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle_at_top_left, ${primaryColor}40, transparent 38%), linear-gradient(145deg, rgba(15,23,42,0.55), ${secondaryColor}18)` }} />
                <div className="relative z-10 max-w-2xl">
                  <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: "#dbeafe" }}>Limited offer — today only</p>
                  <h1 className="text-4xl font-black leading-none tracking-[-0.05em] text-white md:text-6xl">{heroHeading}</h1>
                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">{heroSubheading}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => goTo("product")} className="rounded-full px-6 py-4 text-sm font-bold text-white shadow-[0_14px_36px_rgba(0,0,0,0.18)] md:text-base" style={{ backgroundColor: primaryColor }}>
                      {heroCta}
                    </button>
                    <button onClick={() => goTo("about")} className="rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur md:text-base">
                      Our Story
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-950 shadow-[0_32px_90px_rgba(15,23,42,0.2)]">
                <img src={safeImages[0]} alt={heroHeading} className="h-full min-h-[480px] w-full object-cover opacity-80" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, rgba(15,23,42,0.56), ${primaryColor}46)` }} />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/15">
                    <p className="text-sm font-bold text-white">{productName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xl font-black text-white">{formatMoney(price)}</span>
                      <span className="text-sm text-white/60 line-through">{formatMoney(originalPrice)}</span>
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">SALE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust strip */}
          <section className="px-4 py-4 md:px-6">
            <div className={`mx-auto grid w-[min(1240px,100%)] gap-4 rounded-[28px] p-5 md:grid-cols-4 ${surfaceClass(styles.marketing)}`}>
              {trustBadges.slice(0, 4).map((b, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[22px] border border-white/60 bg-white/70 p-4 backdrop-blur">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-lg font-bold" style={{ backgroundColor: primaryColor }}>✓</div>
                  <div>
                    <p className="font-extrabold text-slate-950 text-sm">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Problem / Solution */}
          <section className="px-4 py-10 md:px-6 md:py-14">
            <div className="mx-auto grid w-[min(1240px,100%)] gap-6 md:grid-cols-2">
              <div className={`rounded-[32px] p-8 ${surfaceClass(styles.marketing)}`}>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-red-500">The Problem</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{problem.headline}</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">{problem.text}</p>
              </div>
              <div className="rounded-[32px] p-8 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">The Solution</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">{solution.headline}</h2>
                <p className="mt-4 text-base leading-7 text-white/80">{solution.text}</p>
                <button onClick={() => goTo("product")} className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-bold" style={{ color: primaryColor }}>
                  {heroCta}
                </button>
              </div>
            </div>
          </section>

          {/* Features */}
          {features.length > 0 && (
            <section className="px-4 py-10 md:px-6 md:py-14">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Why it works" heading="Built different. By design." align="center" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {features.slice(0, 3).map((f, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.marketing)}`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl text-white mb-4" style={{ backgroundColor: primaryColor }}>★</div>
                      <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">{f.title}</h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">{f.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* How It Works */}
          {howItWorks.length > 0 && (
            <section className="px-4 py-10 md:px-6 md:py-14" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}06)` }}>
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Simple process" heading={content?.how_it_works_section?.heading || "How It Works"} text={content?.how_it_works_section?.subheading || "Three simple steps."} align="center" />
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  {howItWorks.slice(0, 3).map((step, i) => (
                    <div key={i} className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg" style={{ backgroundColor: primaryColor }}>{i + 1}</div>
                      <h3 className="mt-5 text-xl font-black text-slate-950">{step.title}</h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Comparison */}
          {comparison.length > 0 && (
            <section className="px-4 py-10 md:px-6 md:py-14">
              <div className="mx-auto w-[min(1100px,100%)]">
                <SectionHeading eyebrow="The difference" heading="Why we win" align="center" />
                <div className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    <div>Feature</div>
                    <div className="text-center" style={{ color: primaryColor }}>{shopBrand}</div>
                    <div className="text-center">Others</div>
                  </div>
                  {comparison.slice(0, 5).map((row, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0">
                      <div className="font-bold text-slate-950">{row.feature}</div>
                      <div className="text-center font-extrabold" style={{ color: primaryColor }}>{row.us ? "✓" : "✗"}</div>
                      <div className="text-center font-bold text-slate-400">{row.them ? "✓" : "✗"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <section className="px-4 py-10 md:px-6 md:py-14">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Social proof" heading="What customers say" align="center" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {testimonials.slice(0, 3).map((t, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.socialProof)}`}>
                      <p className="text-sm font-black tracking-[0.2em] text-amber-400">{"★".repeat(t.rating || 5)}</p>
                      <p className="mt-4 text-base leading-7 text-slate-600">"{t.text}"</p>
                      <div className="mt-6">
                        <p className="font-extrabold text-slate-950">{t.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{t.location || "Verified buyer"}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <section className="px-4 py-10 md:px-6 md:py-14">
              <div className={`mx-auto grid w-[min(1240px,100%)] gap-6 rounded-[32px] p-8 md:grid-cols-3 text-center ${surfaceClass(styles.marketing)}`}>
                {stats.slice(0, 3).map((s, i) => (
                  <div key={i}>
                    <p className="text-5xl font-black tracking-[-0.06em] text-slate-950">{s.value}</p>
                    <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          {faqItems.length > 0 && (
            <section className="px-4 py-10 md:px-6 md:py-14">
              <div className="mx-auto w-[min(820px,100%)]">
                <SectionHeading eyebrow="Questions" heading="Frequently asked" align="center" />
                <div className="mt-8 space-y-4">
                  {faqItems.slice(0, 4).map((item, i) => (
                    <div key={i} className={`rounded-[24px] p-5 cursor-pointer ${surfaceClass(styles.faq)}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-base font-black text-slate-950">{item.q}</p>
                        <span className="text-slate-400 text-xl font-light">{openFaq === i ? "−" : "+"}</span>
                      </div>
                      {openFaq === i && <p className="mt-4 text-base leading-7 text-slate-600">{item.a}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button onClick={() => goTo("faq")} className="text-sm font-bold underline" style={{ color: primaryColor }}>View all questions →</button>
                </div>
              </div>
            </section>
          )}

          {/* Guarantee */}
          <section className="px-4 py-10 md:px-6 md:py-14">
            <div className="mx-auto w-[min(900px,100%)] rounded-[32px] p-8 text-center border-2" style={{ borderColor: primaryColor, background: `${primaryColor}08` }}>
              <p className="text-5xl mb-4">🛡️</p>
              <h2 className="text-3xl font-black text-slate-950">{guarantee.title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 max-w-xl mx-auto">{guarantee.text}</p>
              <button onClick={() => goTo("product")} className="mt-8 rounded-full px-8 py-4 font-bold text-white text-lg" style={{ backgroundColor: primaryColor }}>{heroCta}</button>
            </div>
          </section>

          {/* Newsletter */}
          <section className="px-4 pb-20 pt-4 md:px-6">
            <div className="mx-auto w-[min(1240px,100%)] rounded-[32px] bg-[linear-gradient(135deg,#0f172a,#111827)] px-8 py-12 text-center text-white">
              <h2 className="text-3xl font-black">{newsletter.title}</h2>
              <p className="mt-3 text-slate-300">{newsletter.text}</p>
              <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <div className="flex-1 rounded-[18px] border border-slate-700 bg-slate-900 px-5 py-4 text-sm text-slate-500">Enter your email</div>
                <button className="rounded-full px-7 py-4 text-sm font-extrabold text-white" style={{ backgroundColor: primaryColor }}>Subscribe</button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========== COLLECTION / SHOP PAGE ========== */}
      {view === "collection" && (
        <>
          <section className="px-4 py-12 md:px-6">
            <div className="mx-auto w-[min(1240px,100%)] rounded-[32px] bg-[linear-gradient(135deg,#0f172a,#111827)] px-8 py-14 text-white text-center">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-white/60">Our Collection</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-6xl">{collectionPage.headline}</h1>
              <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto">{collectionPage.subheadline}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={() => goTo("product")} className="rounded-full px-6 py-3 font-bold text-white" style={{ backgroundColor: primaryColor }}>Shop Now</button>
                <button onClick={() => goTo("home")} className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-bold text-white">Learn More</button>
              </div>
            </div>
          </section>

          <section className="px-4 py-8 md:px-6">
            <div className="mx-auto w-[min(1240px,100%)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-950">All Products</h2>
                <div className={`rounded-[18px] border px-4 py-2 text-sm text-slate-600 ${surfaceClass("soft")}`}>Sort: Featured</div>
              </div>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {[...safeImages, ...safeImages].slice(0, 8).map((img, i) => (
                  <button key={i} onClick={() => goTo("product")} className="group block text-left">
                    <div className="relative aspect-square overflow-hidden rounded-[24px] bg-slate-100 mb-3">
                      <img src={img} alt={productName} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      {i % 3 === 0 && <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full">SALE</div>}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition text-sm">{productName} {i > 0 ? `— Style ${i + 1}` : ""}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-black text-slate-900">{formatMoney(price)}</span>
                      <span className="text-sm text-slate-400 line-through">{formatMoney(originalPrice)}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {"★★★★★".split("").map((s, j) => <span key={j} className="text-amber-400 text-xs">{s}</span>)}
                      <span className="text-xs text-slate-500 ml-1">(4.9)</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Why buy */}
          {(collectionPage.why_buy_points?.length > 0 || multicolumn.length > 0) && (
            <section className="px-4 py-10 md:px-6">
              <div className={`mx-auto w-[min(1240px,100%)] rounded-[28px] p-8 ${surfaceClass(styles.marketing)}`}>
                <h2 className="text-2xl font-black text-slate-950 text-center mb-8">{collectionPage.why_buy_heading || "Why buy from us"}</h2>
                <div className="grid gap-5 md:grid-cols-3">
                  {(collectionPage.why_buy_points?.length > 0 ? collectionPage.why_buy_points.map((p: string, i: number) => ({ title: p, text: "" })) : multicolumn.slice(0, 3)).map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 rounded-[22px] border border-white/60 bg-white/70 p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-black" style={{ backgroundColor: primaryColor }}>{i + 1}</div>
                      <div>
                        <p className="font-bold text-slate-950">{item.title}</p>
                        {item.text && <p className="text-sm text-slate-500 mt-1">{item.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Testimonials strip */}
          {testimonials.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Reviews" heading="Customers love it" align="center" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {testimonials.slice(0, 3).map((t, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.socialProof)}`}>
                      <p className="text-amber-400 font-bold">{"★".repeat(t.rating || 5)}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">"{t.text}"</p>
                      <p className="mt-4 font-bold text-slate-950 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.location || "Verified buyer"}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Newsletter */}
          <section className="px-4 pb-20 pt-6 md:px-6">
            <div className="mx-auto w-[min(900px,100%)] rounded-[32px] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">{newsletter.title}</h2>
              <p className="mt-2 text-slate-500">{newsletter.text}</p>
              <div className="mx-auto mt-6 flex max-w-md gap-3">
                <div className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-sm text-slate-400">Enter your email</div>
                <button className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>Subscribe</button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========== PRODUCT PAGE ========== */}
      {view === "product" && (
        <>
          <section className="px-4 py-8 md:px-6 md:py-10">
            <div className="mx-auto grid w-[min(1240px,100%)] gap-8 lg:grid-cols-[1fr_0.95fr]">
              {/* Images */}
              <div className="space-y-4">
                <div className={`rounded-[32px] p-2 ${surfaceClass(styles.productMedia)}`}>
                  <img src={safeImages[0]} alt={productName} className="aspect-square w-full rounded-[26px] object-cover" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {safeImages.slice(0, 4).map((image, index) => (
                    <img key={index} src={image} alt="product" className="aspect-square rounded-2xl border border-slate-200 object-cover cursor-pointer hover:border-primary transition" />
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className={`rounded-[32px] p-6 md:p-8 lg:sticky lg:top-28 lg:self-start ${surfaceClass(styles.productMedia)}`}>
                <div className="flex flex-wrap gap-2">
                  <PreviewPill>Best seller</PreviewPill>
                  <PreviewPill muted>4.9/5 · 1,200+ reviews</PreviewPill>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">{productName}</h1>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-3xl font-black text-slate-950">{formatMoney(price)}</span>
                  <span className="text-lg font-semibold text-slate-400 line-through">{formatMoney(originalPrice)}</span>
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">SALE</span>
                </div>
                <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>Limited stock — order soon</p>
                <p className="mt-4 text-base leading-7 text-slate-600">{heroSubheading}</p>

                {/* Bundles */}
                <div className="mt-6 space-y-3">
                  {bundleRows.map((bundle, i) => (
                    <button key={i} type="button" onClick={() => setSelectedOffer(i)}
                      className={`w-full rounded-[22px] border p-4 text-left transition ${selectedOffer === i ? "border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_8%,white)]" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-950 text-sm">{bundle.label}</p>
                        {bundle.save && <span className="rounded-full text-xs font-black px-2 py-0.5 text-white" style={{ backgroundColor: primaryColor }}>{bundle.save}</span>}
                      </div>
                    </button>
                  ))}
                </div>

                <button className="mt-5 w-full rounded-full px-6 py-4 text-base font-extrabold text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                  Add to Cart — {formatMoney(price)}
                </button>
                <button className="mt-3 w-full rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-extrabold text-slate-900">
                  Buy it now
                </button>

                {/* Trust */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {trustBadges.slice(0, 4).map((b, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[18px] border border-slate-100 bg-slate-50 p-3">
                      <span className="text-lg">✓</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{b.title}</p>
                        <p className="text-[10px] text-slate-500">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500 text-center">{cartDrawer.secure_line}</p>
              </div>
            </div>
          </section>

          {/* Detail tabs */}
          <section className="px-4 py-10 md:px-6">
            <div className="mx-auto w-[min(1240px,100%)]">
              <div className={`rounded-[32px] p-6 md:p-8 ${surfaceClass(styles.marketing)}`}>
                <div className="flex flex-wrap gap-3 mb-6">
                  {detailTabs.map((tab, i) => (
                    <button key={i} onClick={() => setActiveProductTab(i)}
                      className={`rounded-full border px-5 py-3 text-sm font-extrabold transition ${activeProductTab === i ? "text-white" : "border-slate-200 bg-transparent text-slate-700"}`}
                      style={activeProductTab === i ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <h3 className="text-2xl font-black text-slate-950">{detailTabs[activeProductTab]?.heading}</h3>
                <p className="mt-3 text-base leading-7 text-slate-600">{detailTabs[activeProductTab]?.text}</p>
              </div>
            </div>
          </section>

          {/* Features */}
          {features.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Key benefits" heading="Why customers choose it" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {features.slice(0, 3).map((f, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.marketing)}`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg mb-4" style={{ backgroundColor: primaryColor }}>★</div>
                      <h3 className="text-xl font-black text-slate-950">{f.title}</h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">{f.desc}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* How it works */}
          {howItWorks.length > 0 && (
            <section className="px-4 py-10 md:px-6" style={{ background: `${primaryColor}06` }}>
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Simple setup" heading="How it works" align="center" />
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  {howItWorks.slice(0, 3).map((step, i) => (
                    <div key={i} className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full font-black text-white text-xl shadow-md" style={{ backgroundColor: primaryColor }}>0{i + 1}</div>
                      <h3 className="mt-4 text-xl font-black text-slate-950">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Customer proof" heading="Real reviews. Real results." align="center" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {testimonials.slice(0, 3).map((t, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.socialProof)}`}>
                      <p className="text-amber-400 font-bold tracking-widest">{"★".repeat(t.rating || 5)}</p>
                      <p className="mt-4 text-base leading-7 text-slate-600">"{t.text}"</p>
                      <div className="mt-5">
                        <p className="font-extrabold text-slate-950">{t.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.location || "Verified buyer"}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* FAQ */}
          {faqItems.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto grid w-[min(1240px,100%)] gap-6 lg:grid-cols-2">
                <div>
                  <SectionHeading eyebrow="Questions" heading="Common questions answered" />
                  <div className="mt-6 space-y-3">
                    {faqItems.slice(0, 4).map((item, i) => (
                      <div key={i} className={`rounded-[24px] p-5 cursor-pointer ${surfaceClass(styles.faq)}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-slate-950 text-sm">{item.q}</p>
                          <span className="text-slate-400 font-light text-xl">{openFaq === i ? "−" : "+"}</span>
                        </div>
                        {openFaq === i && <p className="mt-3 text-sm leading-6 text-slate-600">{item.a}</p>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[32px] border-2 p-8" style={{ borderColor: primaryColor, background: `${primaryColor}06` }}>
                  <p className="text-4xl mb-4">🛡️</p>
                  <h3 className="text-2xl font-black text-slate-950">{guarantee.title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{guarantee.text}</p>
                  <button onClick={() => goTo("contact")} className="mt-6 text-sm font-bold underline" style={{ color: primaryColor }}>Have a question? Contact us →</button>
                </div>
              </div>
            </section>
          )}

          {/* Newsletter */}
          <section className="px-4 pb-20 pt-4 md:px-6">
            <div className="mx-auto w-[min(900px,100%)] rounded-[32px] bg-[linear-gradient(135deg,#0f172a,#111827)] px-8 py-10 text-center text-white">
              <h2 className="text-2xl font-black">{newsletter.title}</h2>
              <p className="mt-2 text-slate-300 text-sm">{newsletter.text}</p>
              <div className="mx-auto mt-6 flex max-w-sm gap-3">
                <div className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm text-slate-500">Enter your email</div>
                <button className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>Subscribe</button>
              </div>
            </div>
          </section>

          {/* Sticky ATC */}
          {showStickyAtc && (
            <div className={`fixed bottom-4 left-4 right-4 z-50 rounded-[28px] border border-slate-200 px-4 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.16)] ${surfaceClass(styles.stickyAtc)}`}>
              <div className="mx-auto flex w-[min(1240px,100%)] items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={safeImages[0]} className="h-12 w-12 rounded-2xl object-cover" alt={productName} />
                  <div>
                    <p className="font-extrabold text-slate-950 text-sm">{productName}</p>
                    <p className="text-sm font-semibold text-slate-500">{formatMoney(price)}</p>
                  </div>
                </div>
                <button className="rounded-full px-6 py-3 text-sm font-extrabold text-white" style={{ backgroundColor: primaryColor }}>Add to Cart</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== ABOUT PAGE ========== */}
      {view === "about" && (
        <>
          {/* Hero */}
          <section className="px-4 py-14 md:px-6">
            <div className="mx-auto w-[min(1240px,100%)] rounded-[32px] bg-[linear-gradient(135deg,#0f172a,#111827)] px-8 py-16 text-white text-center">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-white/60">Our Story</p>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] md:text-7xl">{aboutPage.hero_heading || "Our Story"}</h1>
              <p className="mt-5 text-base text-slate-300 max-w-xl mx-auto">{aboutPage.hero_subheading || "Built from passion. Delivered with care."}</p>
            </div>
          </section>

          {/* Mission */}
          <section className="px-4 py-10 md:px-6">
            <div className="mx-auto grid w-[min(1240px,100%)] gap-8 md:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: primaryColor }}>Our Mission</p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">{aboutPage.mission_title || "Mission"}</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">{aboutPage.mission_text || "We exist to make great products accessible to everyone."}</p>
              </div>
              <div className={`rounded-[28px] p-6 ${surfaceClass(styles.marketing)}`}>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: primaryColor }}>{aboutPage.craftsmanship_heading || "Craftsmanship"}</p>
                <p className="mt-3 text-base leading-7 text-slate-600">{aboutPage.craftsmanship_text || "Every detail matters. We obsess over quality."}</p>
              </div>
            </div>
          </section>

          {/* Values */}
          {multicolumn.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="What we stand for" heading="Our values" align="center" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {multicolumn.slice(0, 3).map((m, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.marketing)}`}>
                      <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-black mb-4" style={{ backgroundColor: primaryColor }}>{i + 1}</div>
                      <h3 className="text-xl font-black text-slate-950">{m.title}</h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">{m.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* How it works / Process */}
          {howItWorks.length > 0 && (
            <section className="px-4 py-10 md:px-6" style={{ background: `${primaryColor}06` }}>
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="Our process" heading={aboutPage.process_heading || "How We Work"} text={aboutPage.process_subheading || "Thoughtful design. Quality delivery."} align="center" />
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  {howItWorks.slice(0, 3).map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full text-white font-black text-xl shadow-md" style={{ backgroundColor: primaryColor }}>{i + 1}</div>
                      <h3 className="mt-5 text-xl font-black text-slate-950">{s.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto w-[min(900px,100%)]">
                <SectionHeading eyebrow="Our journey" heading="How we got here" align="center" />
                <div className="mt-10 space-y-6">
                  {timeline.map((t, i) => (
                    <div key={i} className={`flex gap-6 rounded-[24px] p-6 ${surfaceClass(styles.marketing)}`}>
                      <div className="shrink-0 text-center">
                        <p className="text-3xl font-black" style={{ color: primaryColor }}>{t.year}</p>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{t.title}</h3>
                        <p className="mt-2 text-base text-slate-600">{t.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className={`mx-auto grid w-[min(1240px,100%)] gap-6 rounded-[32px] p-8 md:grid-cols-3 text-center ${surfaceClass(styles.marketing)}`}>
                {stats.slice(0, 3).map((s, i) => (
                  <div key={i}>
                    <p className="text-5xl font-black tracking-[-0.06em] text-slate-950">{s.value}</p>
                    <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <section className="px-4 py-10 md:px-6">
              <div className="mx-auto w-[min(1240px,100%)]">
                <SectionHeading eyebrow="What they say" heading="Customer stories" align="center" />
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {testimonials.slice(0, 3).map((t, i) => (
                    <article key={i} className={`rounded-[28px] p-6 ${surfaceClass(styles.socialProof)}`}>
                      <p className="text-amber-400 font-bold">{"★".repeat(t.rating || 5)}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">"{t.text}"</p>
                      <p className="mt-4 font-extrabold text-slate-950 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.location || "Verified buyer"}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="px-4 pb-20 pt-6 md:px-6">
            <div className="mx-auto w-[min(900px,100%)] rounded-[32px] p-10 text-center text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              <h2 className="text-3xl font-black">Ready to experience the difference?</h2>
              <p className="mt-3 text-white/80">{heroSubheading}</p>
              <button onClick={() => goTo("product")} className="mt-8 rounded-full bg-white px-8 py-4 font-black text-lg" style={{ color: primaryColor }}>{heroCta}</button>
            </div>
          </section>
        </>
      )}

      {/* ========== FAQ PAGE ========== */}
      {view === "faq" && (
        <>
          <section className="px-4 py-14 md:px-6">
            <div className="mx-auto w-[min(820px,100%)] text-center">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: primaryColor }}>Help Center</p>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] text-slate-950">{faqPage.title || "FAQ"}</h1>
              <p className="mt-4 text-base text-slate-500">{faqPage.intro || "Find the answers you need below."}</p>
            </div>
          </section>

          <section className="px-4 py-4 pb-10 md:px-6">
            <div className="mx-auto w-[min(820px,100%)] space-y-4">
              {allFaqItems.map((item, i) => (
                <div key={i} className={`rounded-[24px] p-5 cursor-pointer ${surfaceClass(styles.faq)}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-base font-black text-slate-950">{item.q}</p>
                    <span className="text-slate-400 text-xl font-light shrink-0">{openFaq === i ? "−" : "+"}</span>
                  </div>
                  {openFaq === i && <p className="mt-4 text-base leading-7 text-slate-600">{item.a}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="px-4 pb-20 pt-4 md:px-6">
            <div className="mx-auto w-[min(820px,100%)] rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Still have questions?</h2>
              <p className="mt-2 text-slate-500">Our team is here to help. Reach out anytime.</p>
              <button onClick={() => goTo("contact")} className="mt-6 rounded-full px-6 py-3 font-bold text-white" style={{ backgroundColor: primaryColor }}>Contact Us</button>
            </div>
          </section>
        </>
      )}

      {/* ========== CONTACT PAGE ========== */}
      {view === "contact" && (
        <>
          <section className="px-4 py-14 md:px-6">
            <div className="mx-auto w-[min(1100px,100%)]">
              <div className="text-center mb-12">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: primaryColor }}>Get in Touch</p>
                <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] text-slate-950">{content?.contact?.heading || "Contact Us"}</h1>
                <p className="mt-4 text-base text-slate-500 max-w-lg mx-auto">{content?.contact?.subheading || "We'd love to hear from you. Our team replies within 24 hours."}</p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Form */}
                <div className={`rounded-[32px] p-8 ${surfaceClass(styles.marketing)}`}>
                  <h2 className="text-xl font-black text-slate-950 mb-6">Send us a message</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                      <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-400 text-sm">Your full name</div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-400 text-sm">your@email.com</div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Order # (optional)</label>
                      <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-400 text-sm">#1234</div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                      <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-slate-400 text-sm h-28">How can we help?</div>
                    </div>
                    <button className="w-full rounded-full py-4 font-bold text-white" style={{ backgroundColor: primaryColor }}>Send Message</button>
                  </div>
                </div>

                {/* Info + FAQ */}
                <div className="space-y-6">
                  <div className={`rounded-[28px] p-6 ${surfaceClass(styles.marketing)}`}>
                    <h2 className="text-lg font-black text-slate-950 mb-4">{contactPage.faq_heading || "Common Questions"}</h2>
                    <div className="space-y-3">
                      {(contactPage.faq_items || faqItems.slice(0, 3)).map((item: any, i: number) => (
                        <div key={i} className={`rounded-[20px] p-4 cursor-pointer ${surfaceClass(styles.faq)}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-slate-950 text-sm">{item.q}</p>
                            <span className="text-slate-400 shrink-0">{openFaq === i ? "−" : "+"}</span>
                          </div>
                          {openFaq === i && <p className="mt-3 text-sm text-slate-600">{item.a}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-[28px] p-6 ${surfaceClass(styles.guaranteeBar)}`}>
                    <h3 className="font-black text-slate-950 text-lg">{guarantee.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{guarantee.text}</p>
                  </div>

                  <div className={`rounded-[28px] p-6 ${surfaceClass(styles.marketing)}`}>
                    <h3 className="font-bold text-slate-950 mb-4">Contact Info</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-3"><span>✉️</span> support@{(shopBrand || "store").replace(/\s+/g, "").toLowerCase()}.com</div>
                      <div className="flex items-center gap-3"><span>🕐</span> Mon–Fri, 9am–6pm</div>
                      <div className="flex items-center gap-3"><span>📦</span> Free shipping on all orders</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========== CART PAGE ========== */}
      {view === "cart" && (
        <>
          <section className="px-4 py-12 md:px-6">
            <div className="mx-auto w-[min(1100px,100%)]">
              <h1 className="text-4xl font-black text-slate-950">{cartPage.headline || "Your Cart"}</h1>
              <p className="mt-2 text-slate-500">{cartPage.subheadline || "Review your items and check out securely."}</p>

              {/* Free shipping bar */}
              <div className={`mt-6 rounded-[20px] p-4 ${surfaceClass(styles.marketing)}`}>
                <p className="text-sm font-bold text-slate-900">{cartDrawer.free_shipping_before?.replace("{amount}", "$15.00") || "You're $15 away from Free Shipping!"}</p>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full w-3/4 transition-all" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* Cart items */}
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className={`rounded-[28px] p-5 ${surfaceClass(styles.marketing)}`}>
                    <div className="flex gap-5">
                      <img src={safeImages[0]} alt={productName} className="h-24 w-24 rounded-[18px] object-cover shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-black text-slate-950">{productName}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{bundleRows[selectedOffer]?.label || "1 unit"}</p>
                          </div>
                          <button className="text-slate-400 hover:text-red-500 transition text-lg">×</button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                            <button className="font-bold text-slate-600 w-6 text-center">−</button>
                            <span className="font-bold text-slate-950">1</span>
                            <button className="font-bold text-slate-600 w-6 text-center">+</button>
                          </div>
                          <span className="text-xl font-black text-slate-950">{formatMoney(price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upsell nudge */}
                  <div className={`rounded-[28px] p-5 border-2 ${surfaceClass("soft")}`} style={{ borderColor: primaryColor }}>
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Frequently bought together</p>
                    <div className="flex gap-4 items-center">
                      <img src={safeImages[1] || safeImages[0]} alt="upsell" className="h-16 w-16 rounded-[14px] object-cover shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-950 text-sm">{productName} — Bundle Pack</p>
                        <p className="text-xs text-slate-500 mt-0.5">Save 15% when added together</p>
                      </div>
                      <button className="rounded-full px-4 py-2 text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>+ Add</button>
                    </div>
                  </div>

                  {/* Reassurance */}
                  <div className="flex flex-wrap gap-3">
                    {(cartDrawer.reassurance_lines || ["30-day returns", "Fast support", "Tracked delivery"]).map((line: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        <span className="text-green-500">✓</span> {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                <div className={`rounded-[32px] p-6 self-start ${surfaceClass(styles.marketing)}`}>
                  <h2 className="text-xl font-black text-slate-950">{cartPage.order_summary_heading || "Order Summary"}</h2>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-bold">{formatMoney(price)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span className="font-bold text-green-600">FREE</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Discount</span><span className="font-bold text-red-500">−{formatMoney(originalPrice - price)}</span></div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between text-lg"><span className="font-black text-slate-950">Total</span><span className="font-black text-slate-950">{formatMoney(price)}</span></div>
                  </div>
                  <button className="mt-6 w-full rounded-full py-4 font-black text-white text-lg shadow-lg" style={{ backgroundColor: primaryColor }}>
                    {cartPage.checkout_cta || cartDrawer.checkout_cta || "Checkout Now"}
                  </button>
                  <button onClick={() => goTo("collection")} className="mt-3 w-full rounded-full border border-slate-200 bg-white py-3 text-sm font-bold text-slate-900">
                    Continue Shopping
                  </button>
                  <p className="mt-4 text-center text-xs text-slate-500">{cartDrawer.secure_line || "🔒 Secure checkout — SSL encrypted"}</p>
                  <div className="mt-4 flex justify-center gap-2">
                    {["💳", "📱", "🔒"].map((icon, i) => (
                      <div key={i} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">{icon}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900/10 bg-[linear-gradient(135deg,#0f172a,#111827)] px-4 py-14 text-white md:px-6">
        <div className="mx-auto grid w-[min(1240px,100%)] gap-10 md:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
          <div>
            <h2 className="text-2xl font-black">{shopBrand}</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">{content?.rich_text?.text || heroSubheading}</p>
            <div className="mt-5 flex gap-3 text-sm font-semibold text-slate-400">
              <span className="hover:text-white cursor-pointer transition">Instagram</span>
              <span className="hover:text-white cursor-pointer transition">TikTok</span>
              <span className="hover:text-white cursor-pointer transition">Facebook</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.28em] text-slate-400">Shop</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {[["collection", "All Products"], ["product", "Best Seller"], ["collection", "New Arrivals"]].map(([v, label]) => (
                <button key={label} onClick={() => goTo(v as View)} className="block hover:text-white transition">{label}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.28em] text-slate-400">Help</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {[["faq", "FAQ"], ["contact", "Contact Us"], ["faq", "Shipping"], ["faq", "Returns"]].map(([v, label]) => (
                <button key={label} onClick={() => goTo(v as View)} className="block hover:text-white transition">{label}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.28em] text-slate-400">Stay updated</h3>
            <p className="mt-4 text-sm text-slate-300">{newsletter.text}</p>
            <div className="mt-4 flex flex-col gap-2">
              <div className="rounded-[18px] border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-500">Enter your email</div>
              <button className="rounded-full py-3 text-sm font-extrabold text-white" style={{ backgroundColor: primaryColor }}>Subscribe</button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 w-[min(1240px,100%)] border-t border-slate-800 pt-6 flex items-center justify-between text-sm text-slate-400">
          <span>© {new Date().getFullYear()} {shopBrand}. All rights reserved.</span>
          <div className="flex gap-4">
            <button onClick={() => goTo("faq")} className="hover:text-white transition">Privacy</button>
            <button onClick={() => goTo("faq")} className="hover:text-white transition">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
