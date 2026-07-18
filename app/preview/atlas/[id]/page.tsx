"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import BuildSuccessOverlay from '@/components/BuildSuccessOverlay'
import PreviewToolbar from '@/components/PreviewToolbar'
import AtlasPreview from '@/components/theme/atlas/AtlasPreview'
import type { AtlasContent } from '@/utils/atlas/types'
import { sectionStylesToCss, type SectionStyles } from '@/utils/theme-editor-types'

export default function AtlasPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<AtlasContent | null>(null)
  const [presetId, setPresetId] = useState<string>('orbit')
  const [typographyPreset, setTypographyPreset] = useState<string | undefined>(undefined)
  const [colorOverrides, setColorOverrides] = useState<Record<string, string> | undefined>(undefined)
  const [sectionStyles, setSectionStyles] = useState<SectionStyles | undefined>(undefined)
  const [name, setName] = useState<string>('تطبيق SaaS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('created') === '1') {
      setCelebrate(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push(`/login?next=/preview/atlas/${params.id}`); return }

      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) { setError('القالب غير موجود أو لا تملك صلاحية الوصول.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'atlas' || !stored?.atlas) {
        setError('هذا القالب ليس قالب Atlas.')
        setLoading(false)
        return
      }

      setContent(stored.atlas as AtlasContent)
      setPresetId(stored.style_preset || 'orbit')
      setTypographyPreset(stored.typography_preset || undefined)
      setColorOverrides(stored.color_overrides || undefined)
      setSectionStyles(stored.section_styles || undefined)
      setName(data.product_name || 'تطبيق SaaS')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm uppercase tracking-[0.25em] text-indigo-300">جارٍ تحميل موقعك…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 text-white">
        <p className="text-lg">{error || 'حدث خطأ ما.'}</p>
        <Link href="https://dashboard.zenyaai.co" className="rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <PreviewToolbar name={name} editHref={`/preview/atlas/${params.id}/edit`} />
      {sectionStyles && Object.keys(sectionStyles).length > 0 && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: sectionStylesToCss(sectionStyles) }}
        />
      )}
      <AtlasPreview
        content={content}
        presetId={presetId}
        colorOverrides={colorOverrides}
        typographyPreset={typographyPreset}
      />
      <BuildSuccessOverlay
        open={celebrate}
        name={name}
        editHref={`/preview/atlas/${params.id}/edit`}
        onPreview={() => setCelebrate(false)}
      />
    </div>
  )
}
