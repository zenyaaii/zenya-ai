"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
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
        <Link href="/dashboard" className="rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating preview bar */}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-50 flex items-center justify-between gap-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/75 px-4 py-2 text-xs text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          <span className="uppercase tracking-[0.2em] text-white/70">معاينة مباشرة ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href={`/preview/atlas/${params.id}/edit`}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black backdrop-blur-md transition hover:scale-105"
          >
            فتح المحرّر
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition hover:scale-105"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
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
    </div>
  )
}
