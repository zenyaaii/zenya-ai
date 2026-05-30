"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import StudioPreview from '@/components/theme/studio/StudioPreview'
import type { StudioContent } from '@/utils/studio/types'

export default function StudioPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<StudioContent | null>(null)
  const [presetId, setPresetId] = useState<string>('ink')
  const [name, setName] = useState<string>('Brand Story')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      if (error || !data) { setError('Theme not found or you do not have access.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'studio' || !stored?.studio) {
        setError('This theme is not a Studio theme.')
        setLoading(false)
        return
      }

      setContent(stored.studio as StudioContent)
      setPresetId(stored.style_preset || 'ink')
      setName(data.product_name || 'Brand Story')
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
          <p className="text-sm uppercase tracking-[0.25em] text-stone-400">Loading your brand page...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white text-stone-900">
        <p className="text-lg">{error || 'Something went wrong.'}</p>
        <Link href="/dashboard" className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-bold text-white">
          Back to dashboard
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
          <span className="uppercase tracking-[0.2em] opacity-50">Live preview ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/theme/new/studio"
            className="rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-md transition"
            style={{
              background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
              color: isDark ? 'white' : '#1a1a1a'
            }}
          >
            Edit details
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-xs font-bold transition hover:scale-105"
            style={{ background: isDark ? 'white' : '#0a0a0a', color: isDark ? '#0a0a0a' : 'white' }}
          >
            Dashboard
          </Link>
        </div>
      </div>
      <StudioPreview content={content} presetId={presetId} />
    </div>
  )
}
