'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Palette, ChevronDown } from 'lucide-react'

/**
 * Shared style/palette switcher for the public demo pages.
 *
 * The old switcher was a `fixed top-4 right-4` pill row that overflowed and
 * wrapped its labels into garbage ("FOREST T / COASTA L") on phones and small
 * tablets. This replaces all 7 copies with one responsive component pinned to
 * the BOTTOM-center — the same place as PreviewToolbar — so it never crowds the
 * design or clips the navbar, and it works identically on mobile, tablet, and
 * desktop. On small screens the chips scroll horizontally inside the pill; the
 * whole thing can be collapsed to a single swatch button to view the theme
 * unobstructed.
 */

type Preset = {
  id: string
  name: string
  description?: string
  colors: Record<string, string>
}

const EASE = [0.22, 1, 0.36, 1] as const

/** Pick black/white text for legibility against an arbitrary swatch colour. */
function readableText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() || '')
  if (!m) return '#ffffff'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  // perceived luminance
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return L > 0.6 ? '#0a0a0c' : '#ffffff'
}

export default function DemoPresetSwitcher<T extends Preset>({
  presets,
  active,
  onChange,
  colorKey = 'primary',
  label = 'النمط',
}: {
  presets: readonly T[]
  active: string
  onChange: (id: T['id']) => void
  /** Which colour in `preset.colors` highlights the active chip. */
  colorKey?: string
  label?: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const activePreset = presets.find((p) => p.id === active) ?? presets[0]
  const activeColor = activePreset?.colors?.[colorKey] || activePreset?.colors?.primary || '#5e6ad2'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.button
            key="swatch"
            type="button"
            onClick={() => setCollapsed(false)}
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.9 }}
            transition={{ duration: 0.2, ease: EASE }}
            aria-label="إظهار خيارات النمط"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black"
          >
            <Palette className="h-[18px] w-[18px]" strokeWidth={2} style={{ color: activeColor }} />
          </motion.button>
        ) : (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full bg-black/85 p-1.5 ps-3 text-white shadow-2xl ring-1 ring-white/15 backdrop-blur-md"
          >
            <span className="flex flex-shrink-0 items-center gap-1.5 pe-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
              <Palette className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">{label}</span>
            </span>

            {/* scrollable chips — never wraps, never overflows the viewport */}
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
              {presets.map((p) => {
                const selected = p.id === active
                const bg = p.colors?.[colorKey] || p.colors?.primary || '#5e6ad2'
                return (
                  <button
                    key={p.id}
                    onClick={() => onChange(p.id)}
                    title={p.description}
                    className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition"
                    style={
                      selected
                        ? { background: bg, color: readableText(bg) }
                        : { background: 'transparent', color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    {p.name}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="إخفاء خيارات النمط"
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
