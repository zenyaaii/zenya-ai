'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { publicSiteHost } from '@/lib/portal-urls'
import { slugErrorMessage, suggestSlugFrom } from '@/lib/slug'
import { bookingAccess } from '@/lib/booking-entitlement'
import { hasReviews } from '@/lib/reviews-bank'
import { extractImageUrls } from '@/lib/extract-image-urls'
import { bookingsPaused, hasWaField, reviewsHidden, waFloatOn, waNumber, withSwitch } from '@/lib/site-switches'
import { ago } from '@/components/app/v6/pages/kit'
import {
  HOSTABLE_TYPES, SHOPIFY_TYPES, businessTypeOf, editUrlFor, templateLabel, type ThemeRow,
} from '@/components/dashboard/site-kinds'
import V6Sites, { type SwitchKey, type V6Hours, type V6SiteRow } from '@/components/app/v6/pages/Sites'
import { heroImage, hostOf, useSite } from '@/components/app/v6/site'
import { useV6 } from '@/components/app/v6/ui'
import { useDashboardPath } from '@/components/app/useDashboardPath'
import { editContent } from '@/components/app/v6/edit-content'

// First 30 days: hosting is free on every plan (kept in sync with the publish API).
const TRIAL_DAYS = 30
const PHONES = new Set(['restaurant', 'atlas', 'services', 'collective', 'studio', 'lookbook', 'wellness'])
/** Templates whose sites take bookings (they read the booking context). */
const BOOKABLE = new Set(['restaurant', 'services', 'wellness', 'atlas', 'lookbook'])

/** The template's own content: under its key on a saved theme, or the content itself. */
const inner = (bt: string, c: any) => (c?.[bt] && typeof c[bt] === 'object' ? c[bt] : c || {})

function menuOf(c: any): { dishes: number; cats: number } | null {
  const cats = Array.isArray(c?.menu?.categories) ? c.menu.categories : null
  if (!cats) return null
  return { cats: cats.length, dishes: cats.reduce((n: number, x: any) => n + (Array.isArray(x?.items) ? x.items.length : 0), 0) }
}

function hoursOf(c: any): V6Hours[] | null {
  const h = c?.hours_location?.hours
  if (!Array.isArray(h) || !h.length) return null
  return h.map((x: any) => ({ d: String(x.label || x.day || ''), on: !x.closed, from: String(x.open || ''), to: String(x.close || '') }))
}

type Profile = {
  plan: string | null
  is_pro: boolean
  has_hosting: boolean
  entry_unlocked: boolean
  created_at: string
  bookings_trial_started_at: string | null
}

/** Sites: the v6 design's sites page, on the owner's real sites. */
export default function SitesPage() {
  const router = useRouter()
  const ctx = useSite()
  const { toast } = useV6()
  const { linkTo } = useDashboardPath()
  const [profile, setProfile] = useState<Profile | null>(null)
  /** Switches and hours changed here, ahead of the shell's list. */
  const [over, setOver] = useState<Record<string, any>>({})
  /** Published here, before the shell's list catches up. */
  const [pub, setPub] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login?next=/dashboard/sites'); return }
    const { data: p } = await supabase
      .from('profiles')
      .select('plan, is_pro, has_hosting, entry_unlocked, created_at, bookings_trial_started_at')
      .eq('id', user.id).maybeSingle()
    setProfile((p as Profile) || ({ plan: 'free', is_pro: false, has_hosting: false, entry_unlocked: false, created_at: user.created_at, bookings_trial_started_at: null }))
  }, [router])

  useEffect(() => { load() }, [load])

  // Back from Stripe after buying a domain.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('domain_purchase')
    if (!q) return
    if (q === 'success') toast('تم الدفع. نسجّل نطاقك الآن، ويظهر في صفحة النطاقات خلال دقائق')
    else toast('لم يكتمل شراء النطاق', { ok: false })
    router.replace(linkTo('/dashboard/sites'), { scroll: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ctx?.themes || !profile) return null

  const plan = profile.plan || 'free'
  const isPro = !!profile.is_pro || ['admin', 'pro_onetime', 'pro_hosting', 'starter', 'pro'].includes(plan)
  const hasHosting = ['admin', 'starter', 'pro_hosting', 'pro'].includes(plan) || !!profile.has_hosting
  const inTrial = !!profile.created_at && Date.now() < new Date(profile.created_at).getTime() + TRIAL_DAYS * 864e5
  const canPublish = hasHosting || !!profile.entry_unlocked || plan === 'entry' || plan === 'free' || inTrial
  const access = bookingAccess(profile)

  const contentOf = (t: ThemeRow) => over[t.id] || t.content

  const rows: V6SiteRow[] = ctx.themes.map((t0: ThemeRow) => {
    const t = pub[t0.id] ? { ...t0, slug: pub[t0.id], is_published: true } : t0
    const bt = businessTypeOf(t)
    const c = contentOf(t)
    const shopify = SHOPIFY_TYPES.has(bt)
    const live = HOSTABLE_TYPES.has(bt) && !!t.is_published && !!t.slug
    const host = live ? hostOf(t, ctx.domains) : null
    const own = inner(bt, c)
    return {
      id: t.id,
      name: t.product_name || 'موقع بلا اسم',
      kind: templateLabel(bt),
      live,
      host,
      url: host ? `https://${host}` : null,
      updated: ago(t.updated_at || t.created_at),
      cover: heroImage(c) || (PHONES.has(bt) ? `/theme-previews/phone/${bt}.webp` : null),
      edit: { href: editUrlFor(t.id, bt) },
      preview: { href: host ? `https://${host}` : `/preview/${t.id}`, external: true },
      shopify: shopify
        ? (isPro ? { href: `/api/themes/${t.id}/export-shopify`, external: true } : { href: '/pricing?upgrade=starter' })
        : undefined,
      photos: extractImageUrls(c).length,
      menu: bt === 'restaurant' ? menuOf(own) : null,
      hours: bt === 'restaurant' ? hoursOf(own) : null,
      sw: {
        bookings: !shopify && BOOKABLE.has(bt) ? access.entitled && !bookingsPaused(c) : null,
        wa: !shopify && hasWaField(bt) ? waFloatOn(bt, c) : null,
        reviews: !shopify && hasReviews(bt) ? !reviewsHidden(c) : null,
      },
      slugHint: t.slug || suggestSlugFrom(t.product_name || '') || 'mysite',
    }
  })

  const themeOf = (id: string) => ctx.themes!.find((t) => t.id === id)

  /** Shows the change at once; puts it back when the save fails. */
  const apply = async (id: string, fn: (c: any) => any): Promise<boolean> => {
    const t = themeOf(id)
    if (!t) return false
    const before = over[id]
    setOver((o) => ({ ...o, [id]: fn(o[id] || t.content) }))
    const saved = await editContent(id, fn)
    if (!saved) { setOver((o) => ({ ...o, [id]: before })); return false }
    setOver((o) => ({ ...o, [id]: saved }))
    return true
  }

  const to = (path: string) => ({ href: linkTo(path) })

  return (
    <V6Sites
      sites={rows}
      current={ctx.siteId}
      onPick={ctx.setSiteId}
      canPublish={canPublish ? true : { href: '/pricing?upgrade=pro' }}
      suffix={publicSiteHost('x').slice(1)}
      links={{
        newSite: { href: '/theme/new' },
        gallery: to('/dashboard/gallery'),
        domains: to('/dashboard/domains'),
      }}
      checkSlug={async (slug) => {
        const r = await fetch(`/api/slug/check?slug=${encodeURIComponent(slug)}`)
        const j = await r.json().catch(() => ({}))
        if (j.available) return true
        return j.reason ? slugErrorMessage(j.reason) || 'غير متاح' : 'هذا الاسم مأخوذ، جرّب اسمًا آخر'
      }}
      publish={async (id, slug) => {
        try {
          const r = await fetch(`/api/themes/${id}/publish`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }),
          })
          const j = await r.json().catch(() => ({}))
          if (r.ok) return { ok: true, slug: j.slug || slug, url: j.url || '' }
          if (r.status === 402) return { ok: false, msg: j.message || 'باقة الاستضافة مطلوبة للنشر.' }
          if (r.status === 409) return { ok: false, msg: 'هذا الاسم مأخوذ، جرّب اسمًا آخر' }
          return { ok: false, msg: j.message || 'تعذّر النشر. حاول مرة أخرى.' }
        } catch {
          return { ok: false, msg: 'تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' }
        }
      }}
      onPublished={(id, slug) => { setPub((x) => ({ ...x, [id]: slug })); ctx.reload() }}
      setSwitch={async (id, key: SwitchKey, on) => {
        const t = themeOf(id)
        if (!t) return 'تعذّر الحفظ. حاول مرة أخرى.'
        const bt = businessTypeOf(t)
        if (key === 'wa' && on && !waNumber(bt, contentOf(t))) return 'أضف رقم واتساب من المحرر أولًا'
        if (key === 'bookings' && on && !access.entitled) {
          if (access.status === 'trial_expired') return 'انتهت التجربة المجانية. اشترك لتفعيل الحجز'
          const r = await fetch('/api/bookings/trial', { method: 'POST' }).catch(() => null)
          if (!r?.ok) return 'تعذّر تفعيل الحجز. حاول مرة أخرى.'
          await load()
        }
        const ok = await apply(id, (c) => key === 'bookings' ? withSwitch(c, 'bookings_off', !on)
          : key === 'wa' ? withSwitch(c, 'wa_float', on)
            : withSwitch(c, 'reviews_off', !on))
        return ok ? null : 'تعذّر الحفظ. حاول مرة أخرى.'
      }}
      saveHours={(id, h) => {
        const t = themeOf(id)
        if (!t) return Promise.resolve(false)
        const bt = businessTypeOf(t)
        return apply(id, (c) => {
          const own = inner(bt, c)
          const hours = (own?.hours_location?.hours || []).map((x: any, i: number) => (h[i] ? { ...x, closed: !h[i].on } : x))
          const next = { ...own, hours_location: { ...(own?.hours_location || {}), hours } }
          return c?.[bt] && typeof c[bt] === 'object' ? { ...c, [bt]: next } : next
        })
      }}
    />
  )
}
