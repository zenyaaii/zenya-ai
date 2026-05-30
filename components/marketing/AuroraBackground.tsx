'use client'

import { useReducedMotion } from 'framer-motion'
import { defaultTint, type AuroraTint } from '@/lib/aurora-tints'
import { cn } from '@/lib/utils'

type Props = {
  /** Tint to use. Defaults to the global Zenya aurora. */
  tint?: AuroraTint
  /** Multiplier on orb opacity (0–1). Use 0.6 for quieter sections. */
  intensity?: number
  /** When true, fixes the orbs to the viewport instead of the parent. */
  fixed?: boolean
  /** Optional extra class names on the container. */
  className?: string
}

/**
 * AuroraBackground — slow-drifting orb wash for marketing sections.
 *
 * Place inside any `position: relative` parent. The container is `-z-10` so it
 * sits below content. Animations are pure transform/opacity (cheap) and use
 * existing keyframes from globals.css. Respects `prefers-reduced-motion`:
 * with reduced motion the orbs are visible but static.
 */
export default function AuroraBackground({
  tint = defaultTint,
  intensity = 1,
  fixed = false,
  className,
}: Props) {
  const reduceMotion = useReducedMotion()
  const o = Math.max(0, Math.min(1, intensity))

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none overflow-hidden -z-10',
        fixed ? 'fixed inset-0' : 'absolute inset-0',
        className
      )}
    >
      <div
        className={cn(
          'absolute -top-32 left-1/4 h-[640px] w-[640px] rounded-full blur-3xl will-change-transform',
          !reduceMotion && 'aurora-orb-1'
        )}
        style={{ background: tint.orb1, opacity: o }}
      />
      <div
        className={cn(
          'absolute top-1/3 right-0 h-[560px] w-[560px] translate-x-1/4 rounded-full blur-3xl will-change-transform',
          !reduceMotion && 'aurora-orb-2'
        )}
        style={{ background: tint.orb2, opacity: o }}
      />
      {tint.orb3 && (
        <div
          className={cn(
            'absolute bottom-0 left-0 h-[560px] w-[560px] -translate-x-1/3 translate-y-1/4 rounded-full blur-3xl will-change-transform',
            !reduceMotion && 'aurora-orb-3'
          )}
          style={{ background: tint.orb3, opacity: o }}
        />
      )}
    </div>
  )
}
