"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import BuildSuccessOverlay from '@/components/BuildSuccessOverlay'
import PreviewToolbar from '@/components/PreviewToolbar'
import CollectivePreview from '@/components/theme/collective/CollectivePreview'
import type { CollectiveContent } from '@/utils/collective/types'

export default function CollectivePreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<CollectiveContent | null>(null)
  const [presetId, setPresetId] = useState<string>('jade')
  const [name, setName] = useState<string>('متجر كتالوج')
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
      if (!user) { router.push(`/login?next=/preview/collective/${params.id}`); return }

      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) { setError('القالب غير موجود أو لا تملك صلاحية الوصول.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'collective' || !stored?.collective) {
        setError('هذا القالب ليس قالب كتالوج.')
        setLoading(false)
        return
      }

      setContent(stored.collective as CollectiveContent)
      setPresetId(stored.style_preset || 'jade')
      setName(data.product_name || 'متجر كتالوج')
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
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-400/50">جارٍ تحميل متجرك…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5" style={{ background: '#060f0c', color: '#ecfdf5' }}>
        <p className="text-lg">{error || 'حدث خطأ ما.'}</p>
        <Link href="/dashboard" className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-black">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <PreviewToolbar name={name} editHref="/theme/new/collective" />
      <CollectivePreview content={content} presetId={presetId} />
      <BuildSuccessOverlay
        open={celebrate}
        name={name}
        onPreview={() => setCelebrate(false)}
      />
    </div>
  )
}
