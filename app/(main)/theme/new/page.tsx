'use client'

/**
 * `/theme/new` — thin redirector.
 *
 * This route used to render a second full template gallery (the
 * "BusinessTypePicker"), which duplicated the canonical /themes page. We
 * collapsed the two: /themes is now the single template picker, and every
 * template card links straight to its own wizard (or /build for the Shopify
 * one-product flow).
 *
 * We keep this route only to honor legacy `?type=` deep links (older marketing
 * CTAs pointed here). Each known type maps to its dedicated wizard; anything
 * else falls through to the /themes gallery.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TYPE_ROUTES: Record<string, string> = {
  restaurant: '/theme/new/restaurant',
  services: '/theme/new/services',
  'local-services': '/theme/new/services',
  local_service: '/theme/new/services',
  wellness: '/theme/new/wellness',
  atlas: '/theme/new/atlas',
  saas: '/theme/new/atlas',
  software: '/theme/new/atlas',
  lookbook: '/theme/new/lookbook',
  fashion: '/theme/new/lookbook',
  apparel: '/theme/new/lookbook',
  collective: '/theme/new/collective',
  catalog: '/theme/new/collective',
  'multi-product': '/theme/new/collective',
  studio: '/theme/new/studio',
  'brand-story': '/theme/new/studio',
  editorial: '/theme/new/studio',
  one_product: '/build',
  'one-product': '/build',
}

export default function NewThemeRedirect() {
  const router = useRouter()

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get('type') || ''
    router.replace(TYPE_ROUTES[type] || '/themes')
  }, [router])

  return (
    <main className="grid min-h-screen place-items-center text-[13px] text-muted">
      جارٍ التحويل…
    </main>
  )
}
