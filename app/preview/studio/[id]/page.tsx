"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import BuildSuccessOverlay from '@/components/BuildSuccessOverlay'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import type { StudioContent } from '@/utils/studio/types'

export default function StudioPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<StudioContent | null>(null)
  const [presetId, setPresetId] = useState<string>('ink')
  const [typographyPreset, setTypographyPreset] = useState<string | undefined>(undefined)
  const [colorOverrides, setColorOverrides] = useState<Record<string, string> | undefined>(undefined)
  const [name, setName] = useState<string>('قصة علامة تجارية')
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
      if (!user) { router.push(`/login?next=/preview/studio/${params.id}`); return }

      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) { setError('القالب غير موجود أو لا تملك صلاحية الوصول.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'studio' || !stored?.studio) {
        setError('هذا القالب ليس قالب استوديو.')
        setLoading(false)
        return
      }

      setContent(stored.studio as StudioContent)
      setPresetId(stored.style_preset || 'ink')
      setTypographyPreset(stored.typography_preset || undefined)
      setColorOverrides(stored.color_overrides || undefined)
      setName(data.product_name || 'قصة علامة تجارية')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
          <p className="text-sm uppercase tracking-[0.25em] text-stone-400">جارٍ تحميل صفحة علامتك…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white text-stone-900">
        <p className="text-lg">{error || 'حدث خطأ ما.'}</p>
        <Link href="/dashboard" className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-bold text-white">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  const isDark = presetId === 'dusk'

  return (
    <div className="relative min-h-screen">
      {/* Floating preview bar */}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[200] flex items-center justify-between gap-3">
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-xs backdrop-blur-md"
          style={{
            background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
            color: isDark ? 'white' : '#1a1a1a'
          }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.5)' : '#0a0a0a' }} />
          <span className="uppercase tracking-[0.2em] opacity-50">معاينة مباشرة ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href={`/preview/studio/${params.id}/edit`}
            className="rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-md transition hover:scale-105"
            style={{ background: isDark ? 'white' : '#0a0a0a', color: isDark ? '#0a0a0a' : 'white' }}
          >
            فتح المحرّر
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-xs font-bold backdrop-blur-md transition"
            style={{
              background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
              color: isDark ? 'white' : '#1a1a1a'
            }}
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
      <StudioPreview
        content={content}
        presetId={presetId}
        colorOverrides={colorOverrides}
        typographyPreset={typographyPreset}
      />
      <BuildSuccessOverlay
        open={celebrate}
        name={name}
        editHref={`/preview/studio/${params.id}/edit`}
        onPreview={() => setCelebrate(false)}
      />
    </div>
  )
}
