'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SEO_DESC_MAX, SEO_TITLE_MAX, type SeoOverrides } from '@/lib/seo'
import V6Seo, { type GscCard } from '@/components/app/v6/pages/Seo'
import { useSite } from '@/components/app/v6/site'
import { useV6 } from '@/components/app/v6/ui'
import { useDashboardPath } from '@/components/app/useDashboardPath'

export type SeoSite = {
  id: string
  productName: string
  isPublished: boolean
  host: string | null
  /** The address it has, or the one it would get. */
  hostHint: string
  overrides: SeoOverrides
  auto: { title: string; description: string; keywords: string[] }
}

type GscStatus = { configured: boolean; connected: boolean; email: string | null }
type SiteState = 'checking' | 'added' | 'missing' | 'not_published' | 'working' | 'failed'

const split = (k?: string) => (k ? k.split(/[,،]/).map((x) => x.trim()).filter(Boolean) : [])

/** SEO: the v6 design's SEO page, on the owner's real sites and Search Console. */
export default function SeoClient({ sites: initial }: { sites: SeoSite[] }) {
  const { toast } = useV6()
  const ctx = useSite()
  const router = useRouter()
  const { linkTo } = useDashboardPath()
  const params = useSearchParams()
  const [sites, setSites] = useState(initial)
  // Back from Google with ?site=…: stay on the site the owner connected from.
  const [selectedId, setSelectedId] = useState(() => {
    const want = params.get('site') || ctx?.siteId
    return initial.some((s) => s.id === want) ? want! : initial[0]?.id ?? ''
  })
  const site = useMemo(() => sites.find((s) => s.id === selectedId) ?? null, [sites, selectedId])
  const [gsc, setGsc] = useState<GscStatus | null>(null)
  const [siteState, setSiteState] = useState<SiteState>('checking')
  const [siteError, setSiteError] = useState('')
  const [reconnect, setReconnect] = useState(false)
  // One button: connecting from here also adds the site to Google on return.
  const [autoSetup, setAutoSetup] = useState(false)

  const loadGsc = useCallback(async () => {
    try {
      const r = await fetch('/api/gsc/status', { cache: 'no-store' })
      setGsc(r.ok ? await r.json() : null)
    } catch { setGsc(null) }
  }, [])
  useEffect(() => { loadGsc() }, [loadGsc])

  // Google sends the owner back here with ?gsc=connected|denied|error.
  useEffect(() => {
    const flag = params.get('gsc')
    if (!flag) return
    if (flag === 'connected') { toast('تم ربط حساب جوجل'); setAutoSetup(true) }
    else if (flag === 'denied') toast('لم يتم الربط: ألغيت الموافقة في صفحة جوجل', { ok: false })
    else toast('تعذّر ربط حساب جوجل', { ok: false })
    router.replace(linkTo('/dashboard/seo'), { scroll: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Is the selected site already a property in the owner's Search Console?
  useEffect(() => {
    setSiteError('')
    setReconnect(false)
    if (!gsc?.connected || !site) return
    if (!site.isPublished) { setSiteState('not_published'); return }
    let cancelled = false
    setSiteState('checking')
    fetch(`/api/gsc/performance?themeId=${encodeURIComponent(site.id)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((p) => {
        if (cancelled) return
        if (p?.reason === 'property_not_found') setSiteState('missing')
        else if (p?.reason === 'not_published') setSiteState('not_published')
        else if (p?.connected === false) loadGsc()
        else setSiteState('added')
      })
      .catch(() => { if (!cancelled) setSiteState('missing') })
    return () => { cancelled = true }
  }, [gsc?.connected, site?.id, site?.isPublished, loadGsc]) // eslint-disable-line react-hooks/exhaustive-deps

  async function setupGsc() {
    if (!site) return
    setSiteState('working')
    setSiteError('')
    try {
      const r = await fetch('/api/gsc/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ themeId: site.id }),
      })
      const j = await r.json()
      if (j?.ok) {
        setSiteState('added')
        toast('أُضيف الموقع إلى جوجل، وأرسلنا خريطة الموقع أيضًا')
      } else if (j?.reason === 'reconnect_required') {
        setReconnect(true)
        setSiteState('failed')
        setSiteError('نحتاج إذنًا إضافيًا من جوجل لإضافة الموقع. اربط الحساب مرة أخرى ثم أعد المحاولة.')
      } else if (j?.reason === 'not_connected') {
        await loadGsc()
      } else {
        setSiteState('failed')
        setSiteError(j?.reason === 'partial'
          ? 'ثبتت ملكيتك للموقع، لكن إضافته لم تكتمل. حاول مرة أخرى بعد دقيقة.'
          : 'لم تكتمل إضافة الموقع إلى جوجل. حاول مرة أخرى.')
      }
    } catch {
      setSiteState('failed')
      setSiteError('لم تكتمل إضافة الموقع إلى جوجل. حاول مرة أخرى.')
    }
  }

  useEffect(() => {
    if (autoSetup && siteState === 'missing') { setAutoSetup(false); setupGsc() }
    else if (autoSetup && siteState !== 'checking') setAutoSetup(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSetup, siteState])

  /** PATCH the site's SEO; the server answers with the overrides it kept. */
  async function patch(id: string, body: Record<string, unknown>): Promise<string | null> {
    try {
      const res = await fetch(`/api/themes/${id}/seo`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) return j?.message || 'تعذّر الحفظ. حاول مرة أخرى.'
      setSites((prev) => prev.map((s) => (s.id === id ? { ...s, overrides: j.overrides || s.overrides } : s)))
      return null
    } catch {
      return 'تعذّر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.'
    }
  }

  const connectHref = `/api/gsc/connect${site ? `?site=${encodeURIComponent(site.id)}` : ''}`
  const card: GscCard = !gsc || !gsc.configured ? { kind: 'off' }
    : !gsc.connected ? { kind: 'connect', to: { href: connectHref, doc: true } }
      : siteState === 'not_published' ? { kind: 'publish', to: { href: linkTo('/dashboard/sites') } }
        : siteState === 'checking' ? { kind: 'checking' }
          : siteState === 'working' ? { kind: 'working' }
            : siteState === 'missing' ? { kind: 'missing', add: setupGsc }
              : siteState === 'failed' ? { kind: 'failed', msg: siteError, retry: reconnect ? { href: connectHref, doc: true } : { onSelect: setupGsc } }
                : { kind: 'added', email: gsc.email, numbers: { href: linkTo('/dashboard/analytics') + '?tab=search' } }

  return (
    <V6Seo
      sites={sites.map((s) => ({
        id: s.id,
        name: s.productName,
        live: s.isPublished,
        url: 'https://' + (s.host || s.hostHint),
        auto: { title: s.auto.title, desc: s.auto.description, keywords: s.auto.keywords },
        own: { title: s.overrides.title || '', desc: s.overrides.description || '', keywords: split(s.overrides.keywords) },
        logo: s.overrides.logo || null,
      }))}
      siteId={selectedId}
      onSite={(id) => { setSelectedId(id); if (ctx?.themes?.some((t) => t.id === id)) ctx.setSiteId(id) }}
      gsc={card}
      titleMax={SEO_TITLE_MAX}
      descMax={SEO_DESC_MAX}
      save={(id, v) => {
        const s = sites.find((x) => x.id === id)
        return patch(id, {
          title: v.title,
          description: v.desc,
          keywords: v.keywords.join('، '),
          ogImage: s?.overrides.ogImage ?? '',
          noindex: !!s?.overrides.noindex,
        })
      }}
      uploadLogo={async (id, file) => {
        try {
          const form = new FormData()
          form.append('file', file)
          const r = await fetch('/api/upload', { method: 'POST', body: form })
          const j = await r.json().catch(() => ({}))
          if (!r.ok || !j?.url) return { error: 'تعذّر رفع الصورة. حاول مرة أخرى.' }
          const err = await patch(id, { logo: j.url })
          return err ? { error: err } : { url: j.url }
        } catch {
          return { error: 'تعذّر رفع الصورة. حاول مرة أخرى.' }
        }
      }}
      setLogo={async (id, url) => !(await patch(id, { logo: url }))}
    />
  )
}
