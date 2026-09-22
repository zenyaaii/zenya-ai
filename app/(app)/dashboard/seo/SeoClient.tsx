'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNotify } from '@/components/ui/Notify'
import { SeoScreen } from '@/components/dashboard/screens/seo'
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

/** SEO: the demo's SEO screen, on the owner's real sites. */
export default function SeoClient({ sites: initial }: { sites: SeoSite[] }) {
  const { toast } = useNotify()
  const [sites, setSites] = useState(initial)
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? '')
  const site = useMemo(() => sites.find((s) => s.id === selectedId) ?? null, [sites, selectedId])
  const [fields, setFields] = useState(() => (site ? fieldsOf(site) : { title: '', description: '', keywords: '' }))
  const [saving, setSaving] = useState(false)

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
    />
  )
}
