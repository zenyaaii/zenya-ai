'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, LayoutDashboard, Eye, EyeOff } from 'lucide-react'

/**
 * Compact, hideable preview toolbar shared by every hosted-site preview.
 *
 * Replaces the old top-of-screen bar that crowded the design on mobile.
 * Now it's a small black pill pinned to the BOTTOM-center, and the user can
 * collapse it to a single eye button to view the theme unobstructed — then
 * tap to bring it back. One component so all 7 preview pages stay in sync.
 */
export default function PreviewToolbar({
  name,
  editHref,
  dashboardHref = '/dashboard',
}: {
  name: string
  editHref: string
  dashboardHref?: string
}) {
  const [hidden, setHidden] = useState(false)
  const EASE = [0.22, 1, 0.36, 1] as const

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait" initial={false}>
        {hidden ? (
          <motion.button
            key="reveal"
            type="button"
            onClick={() => setHidden(false)}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.9 }}
            transition={{ duration: 0.2, ease: EASE }}
            aria-label="إظهار أدوات المعاينة"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black"
          >
            <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
          </motion.button>
        ) : (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full bg-black/85 p-1.5 pr-3 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md"
          >
            {/* live dot + name */}
            <span className="flex min-w-0 items-center gap-2 ps-1 pe-1">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="hidden max-w-[140px] truncate text-[12px] font-medium text-white/85 sm:block">
                {name}
              </span>
            </span>

            <Link
              href={editHref}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-black transition hover:bg-white/90"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
              المحرّر
            </Link>

            <Link
              href={dashboardHref}
              aria-label="لوحة التحكم"
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:bg-white/20"
            >
              <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>

            <button
              type="button"
              onClick={() => setHidden(true)}
              aria-label="إخفاء الأدوات"
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <EyeOff className="h-4 w-4" strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
