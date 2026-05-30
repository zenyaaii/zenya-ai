"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import type { RestaurantContent } from '@/utils/restaurant/types'

export default function RestaurantPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<RestaurantContent | null>(null)
  const [presetId, setPresetId] = useState<string>('onyx')
  const [name, setName] = useState<string>('Restaurant')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push(`/login?next=/preview/restaurant/${params.id}`)
        return
      }
      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) {
        setError('Theme not found or you do not have access.')
        setLoading(false)
        return
      }
      const c = data.content as any
      if (c?.business_type !== 'restaurant' || !c?.restaurant) {
        setError('This theme is not a restaurant theme.')
        setLoading(false)
        return
      }
      setContent(c.restaurant as RestaurantContent)
      setPresetId(c.style_preset || 'onyx')
      setName(data.product_name || 'Restaurant')
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Loading your site…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black text-white">
        <p className="text-lg">{error || 'Something went wrong.'}</p>
        <Link href="/dashboard" className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-bold text-black">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen" style={{ background: '#0a0a0c' }}>
      {/* Floating action bar */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-xs text-white backdrop-blur-md border border-white/15">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="uppercase tracking-[0.2em] text-white/70">Live preview ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href={`/theme/new/restaurant`}
            className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/80"
          >
            Edit details
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-black backdrop-blur-md transition hover:scale-105"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <RestaurantPreview content={content} presetId={presetId} />
    </div>
  )
}
