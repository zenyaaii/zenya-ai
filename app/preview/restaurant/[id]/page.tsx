"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import BuildSuccessOverlay from '@/components/BuildSuccessOverlay'
import PreviewToolbar from '@/components/PreviewToolbar'
import RestaurantPreview from '@/components/theme/restaurant/RestaurantPreview'
import { sectionStylesToCss } from '@/utils/theme-editor-types'
import type { RestaurantContent } from '@/utils/restaurant/types'

export default function RestaurantPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState<RestaurantContent | null>(null)
  const [presetId, setPresetId] = useState<string>('onyx')
  const [name, setName] = useState<string>('مطعم')
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
        setError('القالب غير موجود أو لا تملك صلاحية الوصول.')
        setLoading(false)
        return
      }
      const c = data.content as any
      if (c?.business_type !== 'restaurant' || !c?.restaurant) {
        setError('هذا القالب ليس قالب مطعم.')
        setLoading(false)
        return
      }
      setContent(c.restaurant as RestaurantContent)
      setPresetId(c.style_preset || 'onyx')
      setName(data.product_name || 'مطعم')
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
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">جارٍ تحميل موقعك…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-black text-white">
        <p className="text-lg">{error || 'حدث خطأ ما.'}</p>
        <Link href="https://dashboard.zenyaai.co" className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-bold text-black">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen" style={{ background: '#0a0a0c' }}>
      <PreviewToolbar name={name} editHref={`/preview/restaurant/${params.id}/edit`} />

      {content.section_styles && Object.keys(content.section_styles).length > 0 && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: sectionStylesToCss(content.section_styles) }}
        />
      )}
      <RestaurantPreview content={content} presetId={presetId} />
      <BuildSuccessOverlay
        open={celebrate}
        name={name}
        editHref={`/preview/restaurant/${params.id}/edit`}
        onPreview={() => setCelebrate(false)}
      />
    </div>
  )
}
