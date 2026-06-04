import { ImageResponse } from 'next/og'

// Dynamic 1200x630 OG image — used by Twitter/LinkedIn/Facebook previews.
export const alt = 'Zenya — AI Website Generator for Every Business'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'radial-gradient(ellipse 80% 100% at 20% 0%, rgba(94,106,210,0.35), transparent 65%), radial-gradient(ellipse 60% 90% at 100% 100%, rgba(217,119,6,0.20), transparent 65%), #0a0a0f',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #5e6ad2 0%, #7c83e8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            Z
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1 }}>
            Zenya
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -3.5,
              maxWidth: 980,
            }}
          >
            AI website generator for every business.
          </div>
          <div
            style={{
              fontSize: 30,
              color: 'rgba(255,255,255,0.72)',
              maxWidth: 880,
              lineHeight: 1.4,
            }}
          >
            8 premium templates — restaurants, lookbooks, SaaS, brand stories,
            and Shopify. Brief in, live site out.
          </div>
        </div>

        {/* Footer pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 22, color: 'rgba(255,255,255,0.65)' }}>
          <div style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}>
            zenyaai.co
          </div>
          <div>·</div>
          <div>$9.99 once · Lifetime Pro</div>
        </div>
      </div>
    ),
    size
  )
}
