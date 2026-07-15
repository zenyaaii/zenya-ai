'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Hammer, Download, ChevronDown, Store, Loader2, Clock } from 'lucide-react'
import { useIsAdmin } from '@/lib/use-is-admin'
import { generateShopifyTheme } from '@/utils/shopify-generator'
import { saveAs } from 'file-saver'

/**
 * Bottom-center action pill for the one-product (Shopify) demo at /demo.
 *
 * The storefront demo used to carry a big white top toolbar ("Download Theme /
 * Upgrade to Export / Back to Dashboard") that made it look like a different,
 * older surface than the other 7 branded demos. This matches their visual
 * language exactly — same black pill, same bottom-center placement, collapsible
 * — so every "شاهد العرض" lands on a consistent preview chrome.
 */
export default function DemoStorefrontToolbar({
  name,
  content,
  colors,
  images = [],
}: {
  name: string
  content: any
  colors: { primary: string; secondary: string }
  images?: string[]
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const EASE = [0.22, 1, 0.36, 1] as const
  // Admin keeps build/download; everyone else sees "coming soon".
  const oneProductLive = useIsAdmin() === true

  async function handleDownload() {
    setLoading(true)
    try {
      const blob = await generateShopifyTheme(name, content, colors, images)
      saveAs(blob, `${name.toLowerCase().replace(/\s+/g, '-')}-zenya-theme.zip`)
    } catch (e) {
      console.error(e)
      alert('تعذّر إنشاء ملفات القالب.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.button
            key="reveal"
            type="button"
            onClick={() => setCollapsed(false)}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.9 }}
            transition={{ duration: 0.2, ease: EASE }}
            aria-label="إظهار الأدوات"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black"
          >
            <Store className="h-[18px] w-[18px]" strokeWidth={2} />
          </motion.button>
        ) : (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full bg-black/85 p-1.5 pe-3 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md"
          >
            <span className="flex min-w-0 items-center gap-2 ps-1 pe-1">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="hidden max-w-[140px] truncate text-[12px] font-medium text-white/85 sm:block">
                متجر شوبيفاي
              </span>
            </span>

            {oneProductLive ? (
              <>
                <Link
                  href="/build"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-black transition hover:bg-white/90"
                >
                  <Hammer className="h-3.5 w-3.5" strokeWidth={2.25} />
                  ابنِ هذا القالب
                </Link>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={loading}
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-white/20 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={2} />}
                  <span className="hidden sm:inline">{loading ? 'جارٍ التحضير…' : 'تحميل'}</span>
                </button>
              </>
            ) : (
              <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-white/80">
                <Clock className="h-3.5 w-3.5" strokeWidth={2.25} />
                نسخة جديدة قريبًا
              </span>
            )}

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="إخفاء الأدوات"
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
