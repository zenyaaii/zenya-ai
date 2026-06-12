'use client'

import Image from 'next/image'
import type { Palette, PaletteVibe } from '@/lib/build/palettes'

type Props = {
  palette: Palette
  productName: string
  storeName: string
  price: number
  originalPrice: number
  heroImage?: string
}

/**
 * High-fidelity phone-shaped preview of the generated product page.
 *
 * This is the merchant's first promise: "the .zip you download will
 * render exactly like this." So the layout mirrors the actual section
 * stack we generate — announcement bar → header → hero w/ badges →
 * gallery → title/rating/price → variant pickers → ATC → trust pills
 * → bundle picker → feature strip → fade.
 *
 * Typography is palette-aware: premium/warm vibes get a serif display
 * (Georgia stack) so the product title reads like a brand, not a
 * Material UI demo. Bold/dark vibes stay on the system sans so they
 * feel modern. Numerals are tabular for prices.
 */
export default function PhoneMockup({
  palette: p, productName, storeName, price, originalPrice, heroImage,
}: Props) {
  const w = 360
  const h = 720
  const discount = originalPrice > price && originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0
  const saved = originalPrice > price ? (originalPrice - price) : 0
  const bundle2x = price * 2

  // Display font per vibe — small detail that makes premium/warm
  // palettes read like a brand and bold/dark ones read like a startup.
  const displayFont = headingFontFor(p.vibe)
  const bodyFont    = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

  return (
    <div style={{ width: w, height: h, position: 'relative', flexShrink: 0 }}>
      {/* Phone bezel */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: '#0a0a0a',
          borderRadius: 44,
          padding: 10,
          boxShadow:
            '0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
        }}
      >
        {/* Screen */}
        <div
          style={{
            width: '100%', height: '100%',
            borderRadius: 34,
            overflow: 'hidden',
            background: p.bg,
            position: 'relative',
            color: p.fg,
            fontFamily: bodyFont,
            display: 'flex', flexDirection: 'column',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
              width: 90, height: 22, background: '#0a0a0a',
              borderRadius: 11, zIndex: 5,
            }}
          />

          <div
            style={{
              flex: 1, overflow: 'hidden', position: 'relative',
              paddingTop: 30,
              fontSize: 13,
            }}
          >
            {/* Announcement bar */}
            <div
              style={{
                background: p.fg, color: p.bg,
                fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase',
                padding: '6px 16px', textAlign: 'center', fontWeight: 700,
              }}
            >
              Free shipping · 30-day returns · 4.9 ★
            </div>

            {/* Header */}
            <div
              style={{
                padding: '12px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: p.bg,
                borderBottom: `1px solid ${p.border}`,
              }}
            >
              <div
                style={{
                  fontFamily: displayFont,
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: -0.3,
                  color: p.fg,
                }}
              >
                {storeName || 'Your Store'}
              </div>
              <div
                style={{
                  position: 'relative',
                  width: 30, height: 30, borderRadius: 15,
                  background: p.surface,
                  border: `1px solid ${p.border}`,
                  display: 'grid', placeItems: 'center',
                }}
              >
                <CartIcon color={p.fg} />
                <span
                  style={{
                    position: 'absolute', top: -3, right: -3,
                    minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 8,
                    background: p.primary, color: p.primaryFg,
                    fontSize: 9, fontWeight: 800,
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  2
                </span>
              </div>
            </div>

            {/* Hero image */}
            <div
              style={{
                position: 'relative',
                margin: '14px 16px 0',
                aspectRatio: '1 / 1',
                borderRadius: 18,
                overflow: 'hidden',
                background: p.surface,
                border: `1px solid ${p.border}`,
              }}
            >
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={productName}
                  fill
                  sizes="360px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'grid', placeItems: 'center',
                  color: p.muted, fontSize: 11,
                }}>
                  Hero image
                </div>
              )}
              {discount > 0 && (
                <div
                  style={{
                    position: 'absolute', top: 10, left: 10,
                    background: p.primary, color: p.primaryFg,
                    fontSize: 11, fontWeight: 800,
                    padding: '5px 10px', borderRadius: 999,
                    letterSpacing: 0.3,
                  }}
                >
                  −{discount}%
                </div>
              )}
              <div
                style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(255,255,255,0.92)',
                  color: '#111',
                  fontSize: 10.5, fontWeight: 700,
                  padding: '4px 9px', borderRadius: 999,
                  display: 'flex', alignItems: 'center', gap: 4,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span style={{ color: p.accent }}>★</span>
                4.9
              </div>
            </div>

            {/* Thumb row */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 16px 0' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, aspectRatio: '1 / 1',
                    borderRadius: 8,
                    background: p.surface,
                    border: `1px solid ${i === 0 ? p.primary : p.border}`,
                    opacity: i === 0 ? 1 : 0.7,
                  }}
                />
              ))}
            </div>

            {/* Title + rating */}
            <div style={{ padding: '14px 18px 0' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ color: p.accent, letterSpacing: 1.5, fontSize: 11 }}>★★★★★</span>
                <span style={{ color: p.muted, fontSize: 10.5 }}>2,431 reviews</span>
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontFamily: displayFont,
                  fontSize: 22, fontWeight: 800, lineHeight: 1.1,
                  color: p.fg,
                  letterSpacing: -0.4,
                }}
              >
                {productName || 'Your product name'}
              </div>

              {/* Price stack */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: p.primary, letterSpacing: -0.5 }}>
                  ${price.toFixed(2)}
                </div>
                {originalPrice > price && (
                  <>
                    <div style={{ fontSize: 13, color: p.muted, textDecoration: 'line-through' }}>
                      ${originalPrice.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5, fontWeight: 800,
                        color: p.accent,
                        background: `${p.accent}22`,
                        padding: '3px 8px', borderRadius: 999,
                        letterSpacing: 0.3,
                      }}
                    >
                      Save ${saved.toFixed(2)}
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  marginTop: 10, fontSize: 11, color: p.muted,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span
                  style={{
                    width: 7, height: 7, borderRadius: 4,
                    background: '#22c55e', display: 'inline-block',
                    boxShadow: '0 0 0 2px rgba(34,197,94,.2)',
                  }}
                />
                In stock · ships in 24h
              </div>
            </div>

            {/* ATC */}
            <div style={{ padding: '14px 16px 0' }}>
              <div
                style={{
                  background: p.primary,
                  color: p.primaryFg,
                  borderRadius: 14,
                  padding: '14px 0',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  boxShadow: `0 14px 30px -12px ${p.primary}99`,
                  letterSpacing: 0.2,
                }}
              >
                Add to cart — ${price.toFixed(2)}
              </div>
              <div
                style={{
                  marginTop: 7,
                  textAlign: 'center', fontSize: 10.5,
                  color: p.muted,
                }}
              >
                or 4× ${(price / 4).toFixed(2)} with Klarna
              </div>
            </div>

            {/* Trust pills */}
            <div
              style={{
                display: 'flex', gap: 6, padding: '12px 16px 0', flexWrap: 'wrap',
              }}
            >
              {[
                { icon: '🚚', label: 'Free shipping' },
                { icon: '↩', label: '30-day returns' },
                { icon: '🔒', label: 'Secure checkout' },
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    fontSize: 10, fontWeight: 600,
                    color: p.fg,
                    background: p.surface,
                    border: `1px solid ${p.border}`,
                    padding: '5px 9px', borderRadius: 999,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <span aria-hidden>{t.icon}</span>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Bundle picker (3 tiers, middle featured) */}
            <div style={{ padding: '16px 16px 0' }}>
              <div
                style={{
                  fontSize: 9.5, fontWeight: 800, letterSpacing: 1.6,
                  textTransform: 'uppercase', color: p.accent,
                  textAlign: 'center', marginBottom: 8,
                }}
              >
                Save more, get more
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { qty: '1×', name: 'Single', sub: 'Try it', price: price, featured: false },
                  { qty: '2+1', name: 'Best deal', sub: `Save $${price.toFixed(0)}`, price: bundle2x, featured: true },
                  { qty: '3+2', name: 'Bulk', sub: 'Stock up', price: price * 3, featured: false },
                ].map((t, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, position: 'relative',
                      background: t.featured ? p.surface : p.bg,
                      border: `2px solid ${t.featured ? p.primary : p.border}`,
                      borderRadius: 12,
                      padding: '12px 6px 10px',
                      textAlign: 'center',
                    }}
                  >
                    {t.featured && (
                      <div
                        style={{
                          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                          background: p.primary, color: p.primaryFg,
                          fontSize: 8.5, fontWeight: 800, letterSpacing: 0.8,
                          padding: '3px 8px', borderRadius: 999,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Most popular
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 800, color: p.fg, letterSpacing: -0.2 }}>{t.qty}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: p.muted, marginTop: 2, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: p.primary, marginTop: 5, letterSpacing: -0.2 }}>
                      ${t.price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 8, color: p.muted, marginTop: 2 }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features icon strip */}
            <div
              style={{
                margin: '16px 16px 0',
                padding: '10px 8px',
                background: p.surface,
                border: `1px solid ${p.border}`,
                borderRadius: 12,
                display: 'flex', justifyContent: 'space-around',
              }}
            >
              {[
                { icon: '🚚', label: 'Free ship' },
                { icon: '↩', label: '30-day' },
                { icon: '🔒', label: 'Secure' },
                { icon: '💬', label: 'Support' },
              ].map((f) => (
                <div key={f.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>{f.icon}</div>
                  <div style={{ fontSize: 8, color: p.muted, marginTop: 3, fontWeight: 600, letterSpacing: 0.3 }}>
                    {f.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Fade overlay to imply more content below */}
            <div
              style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: 60,
                background: `linear-gradient(to bottom, ${p.bg}00, ${p.bg})`,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function headingFontFor(vibe: PaletteVibe): string {
  // Premium + warm palettes look more like brands with a soft serif;
  // bold + dark stay on a modern sans. This mirrors what merchants
  // actually pick in the theme editor: warm/premium → serif, bold/dark → sans.
  if (vibe === 'premium' || vibe === 'warm') {
    return 'ui-serif, Georgia, "Iowan Old Style", "Times New Roman", serif'
  }
  return 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", sans-serif'
}

function CartIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  )
}
