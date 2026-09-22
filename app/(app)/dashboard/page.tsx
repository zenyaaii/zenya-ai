'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { publicSiteHost, publicSiteUrl } from '@/lib/portal-urls'
import { HomeScreen, type HomeScreenProps } from '@/components/dashboard/screens/home'
import { PLAN_LABEL, PLAN_TONE, asPlan } from '@/components/dashboard/plans'
import type { ThemeRow } from '@/components/dashboard/site-kinds'

/** The dashboard home: the demo's home screen, on the owner's real account. */
export default function DashboardHomePage() {
  const router = useRouter()
  const [props, setProps] = useState<HomeScreenProps | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?next=/dashboard'); return }

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [{ data: profile }, themesRes, bookingsRes, domainsRes, onboarding] = await Promise.all([
        supabase.from('profiles').select('plan, full_name, email').eq('id', user.id).maybeSingle(),
        fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] })),
        // RLS scopes site_bookings to the owner's own sites.
        supabase
          .from('site_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('is_bot', false)
          .gte('created_at', monthStart.toISOString()),
        fetch('/api/domains').then((r) => (r.ok ? r.json() : { domains: [] })).catch(() => ({ domains: [] })),
        fetch('/api/onboarding', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (cancelled) return

      const themes: ThemeRow[] = themesRes?.themes || []
      const live = themes.filter((t) => t.is_published && t.slug)
      const plan = asPlan((profile as any)?.plan)
      const fullName = (profile as any)?.full_name || user.user_metadata?.full_name || ''
      const name = fullName.split(' ')[0] || (user.email ? user.email.split('@')[0] : '')
      const launchPlan = (onboarding?.launchPlan || {}) as Record<string, boolean>
      const domains: Array<{ status: string }> = domainsRes?.domains || []

      setProps({
        name,
        planLabel: PLAN_LABEL[plan],
        planTone: PLAN_TONE[plan],
        email: (profile as any)?.email || user.email || '',
        stats: {
          sites: themes.length,
          live: live.length,
          views: themes.reduce((a, t) => a + (t.view_count || 0), 0),
          bookings: bookingsRes.count || 0,
        },
        recent: themes.map((t) => {
          const isLive = !!(t.is_published && t.slug)
          return {
            id: t.id,
            name: t.product_name || 'موقع بلا اسم',
            host: isLive ? publicSiteHost(t.slug!) : null,
            live: isLive,
            open: { href: isLive ? publicSiteUrl(t.slug!) : `/preview/${t.id}`, external: true },
          }
        }),
        allSites: { href: '/dashboard/sites' },
        quick: {
          newSite: { href: '/theme/new' },
          domains: { href: '/dashboard/domains' },
          gallery: { href: '/dashboard/gallery' },
          analytics: { href: '/dashboard/analytics' },
        },
        // Three steps read straight off the account; "customise" is the one
        // only the owner can judge, so it is the tick they set themselves.
        launch: [
          { label: 'أنشئ موقعك', done: themes.length > 0 },
          { label: 'خصّص محتواك', done: !!launchPlan.edit },
          { label: 'انشُر موقعك', done: live.length > 0 },
          { label: 'اربط نطاقك', done: domains.some((d) => d.status === 'live') },
        ],
      })
    })()
    return () => { cancelled = true }
  }, [router])

  return props ? <HomeScreen {...props} /> : null
}
