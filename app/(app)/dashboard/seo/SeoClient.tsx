'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotify } from '@/components/ui/Notify'
import { SeoScreen } from '@/components/dashboard/screens/seo'
import { GscConnect, type GscSiteState } from '@/components/dashboard/screens/search-console'
import { SEO_DESC_MAX, SEO_TITLE_MAX, type SeoOverrides } from '@/lib/seo'

export type SeoSite = {
  id: string
  productName: string
  isPublished: boolean
  host: string | null
  overrides: SeoOverrides
  resolved: { title: string; description: string; keywords: string[]; ogImage: string | null }
}

/** What the fields show for a site: its own text, or the automatic text. */
function fieldsOf(s: SeoSite) {
  return {
    title: s.overrides.title || s.resolved.title,
    description: s.overrides.description || s.resolved.description,
    keywords: s.overrides.keywords || s.resolved.keywords.join('، '),
  }
}

type GscStatus = { configured: boolean; connected: boolean; email: string | null }

/** What Google said back after the OAuth round trip (?gsc=…). */
const GSC_FLAG: Record<string, { type: 'success' | 'error'; message: string }> = {
  connected: { type: 'success', message: 'تم ربط حساب جوجل' },
  denied: { type: 'error', message: 'لم يتم الربط', },
  error: { type: 'error', message: 'تعذّر ربط حساب جوجل' },
}

/** SEO: the demo's SEO screen, on the owner's real sites. */
export default function SeoClient({ sites: initial }: { sites: SeoSite[] }) {
  const { toast } = useNotify()
  const [sites, setSites] = useState(initial)
  const params = useSearchParams()
  // Back from Google with ?site=…: stay on the site the owner connected from.
  const [selectedId, setSelectedId] = useState(() => {
    const back = params.get('site')
    return initial.some((s) => s.id === back) ? back! : initial[0]?.id ?? ''
  })
  const site = useMemo(() => sites.find((s) => s.id === selectedId) ?? null, [sites, selectedId])
  const [fields, setFields] = useState(() => (site ? fieldsOf(site) : { title: '', description: '', keywords: '' }))
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const [gsc, setGsc] = useState<GscStatus | null>(null)
  const [siteState, setSiteState] = useState<GscSiteState>('checking')
  const [siteError, setSiteError] = useState<string | undefined>()
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
    if (!flag || !GSC_FLAG[flag]) return
    toast({ ...GSC_FLAG[flag], description: flag === 'denied' ? 'ألغيت الموافقة في صفحة جوجل.' : undefined })
    if (flag === 'connected') setAutoSetup(true)
    router.replace('/dashboard/seo', { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Is the selected site already a property in the owner's Search Console?
  useEffect(() => {
    setSiteError(undefined)
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
    setSiteError(undefined)
    try {
      const r = await fetch('/api/gsc/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId: site.id }),
      })
      const j = await r.json()
      if (j?.ok) {
        setSiteState('added')
        toast({ type: 'success', message: 'أُضيف الموقع إلى جوجل', description: 'أرسلنا خريطة الموقع أيضًا.' })
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
          : undefined)
      }
    } catch {
      setSiteState('failed')
    }
  }

  useEffect(() => {
    if (autoSetup && siteState === 'missing') { setAutoSetup(false); setupGsc() }
    else if (autoSetup && siteState !== 'checking') setAutoSetup(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSetup, siteState])

  async function disconnectGsc() {
    await fetch('/api/gsc/disconnect', { method: 'POST' }).catch(() => {})
    await loadGsc()
    toast({ type: 'success', message: 'فُصل حساب جوجل' })
  }

  // Switching sites loads that site's text.
  useEffect(() => {
    if (site) setFields(fieldsOf(site))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  async function save() {
    if (!site) return
    setSaving(true)
    try {
      // Text left identical to the automatic text stays automatic, so it keeps
      // following the site's content instead of freezing today's wording.
      const auto = { title: site.resolved.title, description: site.resolved.description, keywords: site.resolved.keywords.join('، ') }
      const res = await fetch(`/api/themes/${site.id}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fields.title.trim() === auto.title ? '' : fields.title.trim(),
          description: fields.description.trim() === auto.description ? '' : fields.description.trim(),
          keywords: fields.keywords.trim() === auto.keywords ? '' : fields.keywords.trim(),
          ogImage: site.overrides.ogImage ?? '',
          noindex: !!site.overrides.noindex,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.message || j?.error)
      setSites((prev) => prev.map((s) => (s.id === site.id ? {
        ...s,
        overrides: j.overrides,
        resolved: { title: j.resolved.title, description: j.resolved.description, keywords: j.resolved.keywords, ogImage: j.resolved.ogImage ?? null },
      } : s)))
      toast({ type: 'success', message: 'تم حفظ التغييرات' })
    } catch (e: any) {
      toast({ type: 'error', message: 'تعذّر الحفظ', description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SeoScreen
      sites={sites.map((s) => ({ id: s.id, name: s.productName, live: s.isPublished }))}
      selectedId={selectedId}
      onSelect={setSelectedId}
      site={{ name: site?.productName || '', host: site?.host || null }}
      title={fields.title}
      description={fields.description}
      keywords={fields.keywords}
      titleMax={SEO_TITLE_MAX}
      descMax={SEO_DESC_MAX}
      onTitle={(v) => setFields((f) => ({ ...f, title: v }))}
      onDescription={(v) => setFields((f) => ({ ...f, description: v }))}
      onKeywords={(v) => setFields((f) => ({ ...f, keywords: v }))}
      save={{ onClick: save, disabled: saving }}
      saving={saving}
      reset={{ onClick: () => site && setFields(fieldsOf(site)) }}
      searchConsole={gsc && (
        <GscConnect
          status={!gsc.configured ? 'off' : gsc.connected ? 'connected' : 'disconnected'}
          email={gsc.email}
          siteName={site?.productName}
          siteState={siteState}
          siteError={siteError}
          connect={{ href: `/api/gsc/connect${site ? `?site=${encodeURIComponent(site.id)}` : ''}`, document: true }}
          needsReconnect={reconnect}
          setup={reconnect ? { href: '/api/gsc/connect', document: true } : { onClick: setupGsc }}
          disconnect={{ onClick: disconnectGsc }}
          seeNumbers={{ href: '/dashboard/analytics' }}
        />
      )}
    />
  )
}
