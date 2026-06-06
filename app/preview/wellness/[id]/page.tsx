"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import WellnessPreview from '@/components/theme/wellness/WellnessPreview'
import type { WellnessContent } from '@/utils/wellness/types'

export default function WellnessPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<WellnessContent | null>(null)
  const [presetId, setPresetId] = useState<string>('zen')
  const [typographyPreset, setTypographyPreset] = useState<string | undefined>(undefined)
  const [colorOverrides, setColorOverrides] = useState<Record<string, string> | undefined>(undefined)
  const [name, setName] = useState<string>('Wellness Studio')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push(`/login?next=/preview/wellness/${params.id}`); return }

      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) { setError('Theme not found or you do not have access.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'wellness' || !stored?.wellness) {
        setError('This theme is not a wellness studio theme.')
        setLoading(false)
        return
      }

      setContent(stored.wellness as WellnessContent)
      setPresetId(stored.style_preset || 'zen')
      setTypographyPreset(stored.typography_preset || undefined)
      setColorOverrides(stored.color_overrides || undefined)
      setName(data.product_name || 'Wellness Studio')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-white/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          <p className="text-sm uppercase tracking-[0.25em] text-teal-300">Loading your site...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-stone-950 text-white">
        <p className="text-lg">{error || 'Something went wrong.'}</p>
        <Link href="/dashboard" className="rounded-full bg-teal-400 px-6 py-2.5 text-sm font-bold text-stone-950">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating preview bar */}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-50 flex items-center justify-between gap-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/75 px-4 py-2 text-xs text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
          <span className="uppercase tracking-[0.2em] text-white/70">Live preview ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link href={`/preview/wellness/${params.id}/edit`} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black backdrop-blur-md transition hover:scale-105">
            Open editor
          </Link>
          <Link href="/dashboard" className="rounded-full bg-teal-400 px-4 py-2 text-xs font-bold text-stone-950 transition hover:scale-105">
            Dashboard
          </Link>
        </div>
      </div>
      <WellnessPreview
        content={content}
        presetId={presetId}
        colorOverrides={colorOverrides}
        typographyPreset={typographyPreset}
      />
    </div>
  )
}
