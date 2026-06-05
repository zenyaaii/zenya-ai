'use client'

import { lazy, Suspense, type ComponentType } from 'react'

// Lazy-load each preview so a /s/[slug] visit only pulls the bundle for the
// template that's actually being shown. Big win for cold-cache page weight.
const RestaurantPreview = lazy(() => import('@/components/theme/restaurant/RestaurantPreview'))
const AtlasPreview      = lazy(() => import('@/components/theme/atlas/AtlasPreview'))
const LookbookPreview   = lazy(() => import('@/components/theme/lookbook/LookbookPreview'))
const WellnessPreview   = lazy(() => import('@/components/theme/wellness/WellnessPreview'))
const StudioPreview     = lazy(() => import('@/components/theme/studio/StudioPreview'))
const ServicesPreview   = lazy(() => import('@/components/theme/services/ServicesPreview'))

type Props = {
  businessType: string
  content: any            // per-template shape; each Preview enforces its own
  presetId?: string
  productName?: string
}

const TEMPLATE_KEY: Record<string, string> = {
  restaurant: 'restaurant',
  atlas: 'atlas',
  lookbook: 'lookbook',
  wellness: 'wellness',
  studio: 'studio',
  services: 'services',
}

export default function PublicSiteRenderer({
  businessType,
  content,
  presetId,
}: Props) {
  const key = TEMPLATE_KEY[businessType]
  if (!key) {
    return <UnsupportedTemplate businessType={businessType} />
  }

  // Each preview takes the same loose Props shape: { content, presetId? }
  const Component: ComponentType<any> = (
    {
      restaurant: RestaurantPreview,
      atlas: AtlasPreview,
      lookbook: LookbookPreview,
      wellness: WellnessPreview,
      studio: StudioPreview,
      services: ServicesPreview,
    } as Record<string, ComponentType<any>>
  )[key]

  return (
    <Suspense fallback={<LoadingShell />}>
      <Component content={content} presetId={presetId} />
    </Suspense>
  )
}

function LoadingShell() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0c',
        color: 'rgba(255,255,255,0.7)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '2px solid rgba(255,255,255,0.15)',
          borderTopColor: '#c8a96a',
          borderRadius: '50%',
          animation: 'zenya-spin 0.9s linear infinite',
        }}
      />
      <style>{`@keyframes zenya-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function UnsupportedTemplate({ businessType }: { businessType: string }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#fff',
        color: '#1c1c1c',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          This template isn’t hostable on Zenya
        </h1>
        <p style={{ color: '#6b6b6b', lineHeight: 1.55 }}>
          The <strong>{businessType}</strong> template runs on Shopify. Use
          the Shopify connect flow or the ZIP export from your dashboard to
          launch it.
        </p>
      </div>
    </main>
  )
}
