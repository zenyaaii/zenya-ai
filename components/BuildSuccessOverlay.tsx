'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, Pencil } from 'lucide-react'

/**
 * BuildSuccessOverlay — the celebration shown the first time a freshly-built
 * site is opened (the preview page reads `?created=1`). Gives the user the
 * choice the moment the build lands: preview it as visitors see it, open the
 * editor to customize, or jump to the dashboard. Shared across every template
 * preview so the post-build experience is identical.
 *
 * `editHref` is optional — pass undefined for templates without an editor yet
 * and the "open editor" action is omitted.
 */
export default function BuildSuccessOverlay({
  open,
  name,
  editHref,
  onPreview,
  dashboardHref = '/dashboard',
}: {
  open: boolean
  name: string
  editHref?: string
  onPreview: () => void
  dashboardHref?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,14,0.78)', backdropFilter: 'blur(12px)' }}
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white p-8 text-center shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 16 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #b9b8ff, #5e6ad2 60%, #4f5ab8)',
                boxShadow: '0 0 40px rgba(94,106,210,0.5)',
              }}
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
                onClick={onPreview}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.02]"
              >
                <Eye className="h-4 w-4" /> معاينة الموقع
              </button>
              {editHref && (
                <Link
                  href={editHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-token bg-white px-6 py-3 text-sm font-bold text-foreground transition hover:bg-black/5"
                >
                  <Pencil className="h-4 w-4" /> فتح المحرّر
                </Link>
              )}
              <Link
                href={dashboardHref}
                className="mt-1 text-xs font-medium text-muted transition hover:text-foreground"
              >
                الذهاب إلى لوحة التحكم
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
