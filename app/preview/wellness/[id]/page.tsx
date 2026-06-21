"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, Pencil } from 'lucide-react'
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
  const [name, setName] = useState<string>('استوديو عافية')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Celebration overlay shown right after a fresh build (?created=1).
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('created') === '1') {
      setCelebrate(true)
      // Drop the query param so a refresh/back doesn't replay the celebration.
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

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
      if (error || !data) { setError('القالب غير موجود أو لا تملك صلاحية الوصول.'); setLoading(false); return }

      const stored = data.content as any
      if (stored?.business_type !== 'wellness' || !stored?.wellness) {
        setError('هذا القالب ليس قالب استوديو عافية.')
        setLoading(false)
        return
      }

      setContent(stored.wellness as WellnessContent)
      setPresetId(stored.style_preset || 'zen')
      setTypographyPreset(stored.typography_preset || undefined)
      setColorOverrides(stored.color_overrides || undefined)
      setName(data.product_name || 'استوديو عافية')
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
          <p className="text-sm uppercase tracking-[0.25em] text-teal-300">جارٍ تحميل موقعك…</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-stone-950 text-white">
        <p className="text-lg">{error || 'حدث خطأ ما.'}</p>
        <Link href="/dashboard" className="rounded-full bg-teal-400 px-6 py-2.5 text-sm font-bold text-stone-950">
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
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
          <span className="uppercase tracking-[0.2em] text-white/70">معاينة مباشرة ·</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link href={`/preview/wellness/${params.id}/edit`} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black backdrop-blur-md transition hover:scale-105">
            فتح المحرّر
          </Link>
          <Link href="/dashboard" className="rounded-full bg-teal-400 px-4 py-2 text-xs font-bold text-stone-950 transition hover:scale-105">
            لوحة التحكم
          </Link>
        </div>
      </div>
      <WellnessPreview
        content={content}
        presetId={presetId}
        colorOverrides={colorOverrides}
        typographyPreset={typographyPreset}
      />

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,10,14,0.78)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white p-8 text-center shadow-2xl"
            >
              {/* Animated check medallion */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 16 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 30%, #b9b8ff, #5e6ad2 60%, #4f5ab8)', boxShadow: '0 0 40px rgba(94,106,210,0.5)' }}
              >
                <Check className="h-8 w-8 text-white" strokeWidth={3} />
              </motion.div>

              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">
                تم إنشاء موقعك! 🎉
              </h2>
              <p className="mt-2 text-sm text-muted">
                موقع <span className="font-semibold text-foreground">{name}</span> جاهز.
                عاينه كما يراه زوّارك، أو افتح المحرّر لتخصيص كل التفاصيل.
              </p>

              <div className="mt-7 grid gap-2.5">
                <button
                  type="button"
                  onClick={() => setCelebrate(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02]"
                >
                  <Eye className="h-4 w-4" /> معاينة الموقع
                </button>
                <Link
                  href={`/preview/wellness/${params.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-token bg-white px-6 py-3 text-sm font-bold text-foreground transition hover:bg-black/5"
                >
                  <Pencil className="h-4 w-4" /> فتح المحرّر
                </Link>
                <Link
                  href="/dashboard"
                  className="mt-1 text-xs font-medium text-muted transition hover:text-foreground"
                >
                  الذهاب إلى لوحة التحكم
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
