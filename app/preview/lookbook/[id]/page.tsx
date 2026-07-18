"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import BuildSuccessOverlay from '@/components/BuildSuccessOverlay'
import PreviewToolbar from '@/components/PreviewToolbar'
import LookbookPreview from '@/components/theme/lookbook/LookbookPreview'
import type { LookbookContent } from '@/utils/lookbook/types'

export default function LookbookPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<LookbookContent | null>(null)
  const [presetId, setPresetId] = useState<string>('noir')
  const [typographyPreset, setTypographyPreset] = useState<string | undefined>(undefined)
  const [colorOverrides, setColorOverrides] = useState<Record<string, string> | undefined>(undefined)
  const [name, setName] = useState<string>('علامة أزياء')
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
      if (!user) { router.push(`/login?next=/preview/lookbook/${params.id}`); return }

      const { data, error } = await supabase
        .from('themes')
        .select('id, product_name, content')
        .eq('id', params.id)
        .single()
      if (cancelled) return
      if (error || !data) { setError('القالب غير موجود أو لا تملك صلاحية الوصول.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'lookbook' || !stored?.lookbook) {
        setError('هذا القالب ليس قالب دفتر إطلالات.')
        setLoading(false)
        return
      }

      setContent(stored.lookbook as LookbookContent)
      setPresetId(stored.style_preset || 'noir')
      setTypographyPreset(stored.typography_preset || undefined)
      setColorOverrides(stored.color_overrides || undefined)
      setName(data.product_name || 'علامة أزياء')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [params.id, router, supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/80">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">جارٍ تحميل موقعك…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black text-white">
        <p className="text-lg">{error || 'حدث خطأ ما.'}</p>
        <Link href="https://dashboard.zenyaai.co" className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <PreviewToolbar name={name} editHref={`/preview/lookbook/${params.id}/edit`} />
      <LookbookPreview
        content={content}
        presetId={presetId}
        colorOverrides={colorOverrides}
        typographyPreset={typographyPreset}
      />
      <BuildSuccessOverlay
        open={celebrate}
        name={name}
        editHref={`/preview/lookbook/${params.id}/edit`}
        onPreview={() => setCelebrate(false)}
      />
    </div>
  )
}
