'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import PublishSiteModal from '@/components/PublishSiteModal'
import AddDomainModal from '@/components/AddDomainModal'
import { useNotify } from '@/components/ui/Notify'
import { publicSiteHost, publicSiteUrl } from '@/lib/portal-urls'
import { SitesScreen, type SiteCardData, type SiteFilter } from '@/components/dashboard/screens/sites'
import { relTime } from '@/components/dashboard/screens/kit'
import {
  HOSTABLE_TYPES, SHOPIFY_TYPES, businessTypeOf, editUrlFor, templateLabel, type ThemeRow,
} from '@/components/dashboard/site-kinds'

// First 30 days: hosting is free on every plan (kept in sync with the publish API).
const TRIAL_DAYS = 30

type Profile = {
  plan: string | null
  is_pro: boolean
  has_hosting: boolean
  entry_unlocked: boolean
  created_at: string
}

/** Sites: the demo's sites screen, on the owner's real sites. */
export default function SitesPage() {
  const router = useRouter()
  const { toast } = useNotify()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [themes, setThemes] = useState<ThemeRow[] | null>(null)
  const [filter, setFilter] = useState<SiteFilter>('all')
  const [publishing, setPublishing] = useState<ThemeRow | null>(null)
  const [domainFor, setDomainFor] = useState<ThemeRow | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login?next=/dashboard/sites'); return }
    const [{ data: p }, res] = await Promise.all([
      supabase.from('profiles').select('plan, is_pro, has_hosting, entry_unlocked, created_at').eq('id', user.id).maybeSingle(),
      fetch('/api/themes').then((r) => (r.ok ? r.json() : { themes: [] })).catch(() => ({ themes: [] })),
    ])
    setProfile((p as Profile) || null)
    setThemes(res?.themes || [])
  }, [router])

  useEffect(() => { load() }, [load])

  if (!themes) return null

  const plan = profile?.plan || 'free'
  const isPro = !!profile?.is_pro || ['admin', 'pro_onetime', 'pro_hosting', 'starter', 'pro'].includes(plan)
  const hasHosting = ['admin', 'starter', 'pro_hosting', 'pro'].includes(plan) || !!profile?.has_hosting
  const inTrial = !!profile?.created_at &&
    Date.now() < new Date(profile.created_at).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  const canPublish = hasHosting || !!profile?.entry_unlocked || plan === 'entry' || plan === 'free' || inTrial

  const sites: SiteCardData[] = themes.map((t) => {
    const bt = businessTypeOf(t)
    const hostable = HOSTABLE_TYPES.has(bt)
    const live = hostable && !!t.is_published && !!t.slug

    let primary: SiteCardData['primary']
    if (SHOPIFY_TYPES.has(bt)) {
      primary = isPro
        ? { label: 'نزّل ملف شوبيفاي', action: { href: `/api/themes/${t.id}/export-shopify`, external: true } }
        : { label: 'اشترك للتصدير', action: { href: '/pricing?upgrade=starter' } }
    } else if (live) {
      primary = hasHosting
        ? { label: 'أضف نطاقًا', action: { onClick: () => setDomainFor(t) } }
        : { label: 'أضف نطاقًا', action: { href: '/pricing?upgrade=starter' } }
    } else {
      primary = canPublish
        ? { label: 'انشر', action: { onClick: () => setPublishing(t) } }
        : { label: 'انشر', action: { href: '/pricing?upgrade=pro' } }
    }

    return {
      id: t.id,
      name: t.product_name || 'موقع بلا اسم',
      kind: templateLabel(bt),
      host: live ? publicSiteHost(t.slug!) : null,
      live,
      updated: relTime(t.updated_at || t.created_at),
      edit: { href: editUrlFor(t.id, bt) },
      preview: { href: live ? publicSiteUrl(t.slug!) : `/preview/${t.id}`, external: true },
      primary,
    }
  })

  return (
    <>
      <SitesScreen sites={sites} filter={filter} setFilter={setFilter} newSite={{ href: '/theme/new' }} />
      {publishing && (
        <PublishSiteModal
          theme={publishing as any}
          hasHosting={hasHosting}
          trialActive={inTrial}
          isPro={isPro}
          onClose={() => setPublishing(null)}
          onPublished={(slug, url) => {
            setThemes((prev) => (prev || []).map((t) => (t.id === publishing.id ? { ...t, slug, is_published: true } : t)))
            toast({ type: 'success', message: 'موقعك الآن مباشر', description: url })
          }}
        />
      )}
      {domainFor && (
        <AddDomainModal themeId={domainFor.id} onClose={() => setDomainFor(null)} onAdded={() => setDomainFor(null)} />
      )}
    </>
  )
}
