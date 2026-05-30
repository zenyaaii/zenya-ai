"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CollectivePreview from '@/components/theme/collective/CollectivePreview'
import type { CollectiveContent } from '@/utils/collective/types'

export default function CollectivePreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<CollectiveContent | null>(null)
  const [presetId, setPresetId] = useState<string>('jade')
  const [name, setName] = useState<string>('Catalog Store')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.push(`/login?next=/preview/collective/${params.id}`); return }

      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) { setError('Theme not found or you do not have access.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'collective' || !stored?.collective) {
        setError('This theme is not a Collective theme.')
        setLoading(false)
        return
      }

      setContent(stored.collective as CollectiveContent)
      setPresetId(stored.style_preset || 'jade')
      setName(data.product_name || 'Catalog Store')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#060f0c' }}>
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/40 border-t-emerald-400" />
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-400/50">Loading your store...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5" style={{ background: '#060f0c', color: '#ecfdf5' }}>
        <p className="text-lg">{error || 'Something went wrong.'}</p>
        <Link href="/dashboard" className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-black">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating preview bar */}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[200] flex items-center justify-between gap-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-emerald-400/20 bg-black/75 px-4 py-2 text-xs text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="uppercase tracking-[0.2em] text-white/60">Live preview ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/theme/new/collective"
            className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/80"
          >
            Edit details
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition hover:scale-105"
          >
            Dashboard
          </Link>
        </div>
      </div>
      <CollectivePreview content={content} presetId={presetId} />
    </div>
  )
}
