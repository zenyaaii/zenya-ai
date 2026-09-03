'use client'

/**
 * ScrollThread - a scroll-driven line that lives in a section's corner.
 *
 * Replaces the "flowing ribbon" Spline iframe idea with something that costs
 * ~4KB instead of a WebGL scene, reads the site's own tokens, and is driven by
 * the reader's scroll rather than an autonomous loop.
 *
 * Rules it follows:
 *  - Runs top-to-bottom, never left-to-right.
 *  - Hugs one corner. Never crosses the middle of the section.
 *  - Draws itself from the section's own scroll progress, so it advances with
 *    the reader and reverses when they scroll back up.
 *  - Fades out at the top and bottom edges, so it reads as one thread passing
 *    through the page rather than a decal stuck on each section.
 *
 * Placement contract (important):
 *   The host <section> must be `relative`, and its content wrapper must be
 *   `relative z-10`. The thread paints at z-0 inside the section.
 *
 * `side="start" | "end"` uses logical inset, so under dir="rtl" the "start"
 * corner is the right-hand one. The geometry mirrors with it.
 */

import { useId, useRef } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion'

export type ThreadVariant =
  | 'filament'
  | 'ribbon'
  | 'circuit'
  | 'serpent'
  | 'strata'

type Props = {
  variant?: ThreadVariant
  /** Which corner. Logical: under RTL, "start" is the right edge. */
  side?: 'start' | 'end'
  /** Overrides the variant's own accent. Use to lock one accent per page. */
  tone?: string
  className?: string
}

const VIEW_W = 200
const VIEW_H = 1000

/* Accents come straight from globals.css, not invented. */
const TONES: Record<ThreadVariant, string> = {
  filament: '#5e6ad2', // --primary
  ribbon: '#5e6ad2',
  circuit: '#d97706', // --secondary
  serpent: '#27a644', // --accent
  strata: '#5e6ad2',
}

const INK = 'rgba(28,28,28,0.11)'

/* Geometry. Every path spans the full viewBox height so it can stretch to any
 * section height, with vector-effect="non-scaling-stroke" holding the line
 * weight steady no matter how tall the section is. */
const PATHS: Record<Exclude<ThreadVariant, 'strata'>, string> = {
  filament:
    'M 122 0 C 122 118, 34 168, 40 298 C 46 428, 134 470, 128 600 C 122 730, 42 762, 52 900 C 58 962, 76 980, 80 1000',
  ribbon:
    'M 104 0 C 104 120, 40 196, 46 306 C 52 416, 146 476, 138 596 C 130 716, 44 758, 54 886 C 60 960, 84 978, 88 1000',
  circuit:
    'M 152 0 L 152 138 Q 152 158 132 158 L 72 158 Q 52 158 52 178 L 52 418 Q 52 438 72 438 L 142 438 Q 162 438 162 458 L 162 698 Q 162 718 142 718 L 62 718 Q 42 718 42 738 L 42 1000',
  serpent:
    'M 98 0 C 38 92, 158 178, 98 270 C 38 362, 158 448, 98 540 C 38 632, 158 718, 98 810 C 38 902, 148 958, 98 1000',
}

/* Where the circuit variant turns. Solder dots go here. */
const CIRCUIT_JOINTS: Array<[number, number]> = [
  [132, 158],
  [52, 178],
  [72, 438],
  [162, 458],
  [142, 718],
]

/* Strata ticks: a measured column, not a line. Lengths follow a slow wave so
 * the column has rhythm instead of reading as a ruler. */
const TICKS = Array.from({ length: 20 }, (_, i) => {
  const t = i / 19
  return {
    y: 24 + t * (VIEW_H - 48),
    len: 30 + Math.sin(t * Math.PI * 2.2) * 22 + 34,
    at: t,
  }
})

export default function ScrollThread({
  variant = 'filament',
  side = 'start',
  tone,
  className = '',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const accent = tone ?? TONES[variant]

  /* The section's own progress: 0 as its top reaches the bottom of the
   * viewport, 1 as its bottom leaves the top. The thread is therefore always
   * mid-draw while the section is the thing being read. */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  })

  const progress: MotionValue<number> = reduce ? scrollYProgress : smooth

  /* Comet head: a short lit segment riding the tip of the drawn line. */
  const headOffset = useTransform(progress, (v) => Math.max(0, v - 0.055))
  const headOpacity = useTransform(progress, [0, 0.06, 0.94, 1], [0, 1, 1, 0])

  const maskId = `thread-fade-${uid}`
  const gradId = `thread-grad-${uid}`
  const glowId = `thread-glow-${uid}`

  return (
    <div
      ref={ref}
      aria-hidden
      className={[
        /* Corner only. Hidden below lg: marketing sections are max-w-6xl, so
         * under 1024px there is no gutter left and the line would land
         * squarely under the copy. Dropped there rather than shrunk to noise. */
        'pointer-events-none absolute inset-y-0 z-0 hidden w-[120px] lg:block xl:w-[160px] 2xl:w-[210px]',
        className,
      ].join(' ')}
      style={side === 'start' ? { insetInlineStart: 0 } : { insetInlineEnd: 0 }}
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        fill="none"
        style={{ transform: side === 'end' ? 'scaleX(-1)' : undefined }}
      >
        <defs>
          {/* Fades the thread out at the section seams so it reads as one
              continuous thing passing through, not a per-section sticker. */}
          <linearGradient id={maskId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`m-${uid}`}>
            <rect
              x="0"
              y="0"
              width={VIEW_W}
              height={VIEW_H}
              fill={`url(#${maskId})`}
            />
          </mask>

          <linearGradient id={gradId} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0.05" />
            <stop offset="0.35" stopColor={accent} stopOpacity="0.34" />
            <stop offset="0.72" stopColor={accent} stopOpacity="0.20" />
            <stop offset="1" stopColor={accent} stopOpacity="0.04" />
          </linearGradient>

          <filter id={glowId} x="-80%" y="-30%" width="260%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g mask={`url(#m-${uid})`}>
          {variant === 'strata' ? (
            <Strata progress={progress} accent={accent} reduce={!!reduce} />
          ) : (
            <Line
              variant={variant}
              progress={progress}
              headOffset={headOffset}
              headOpacity={headOpacity}
              accent={accent}
              gradId={gradId}
              glowId={glowId}
              reduce={!!reduce}
            />
          )}
        </g>
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Line({
  variant,
  progress,
  headOffset,
  headOpacity,
  accent,
  gradId,
  glowId,
  reduce,
}: {
  variant: Exclude<ThreadVariant, 'strata'>
  progress: MotionValue<number>
  headOffset: MotionValue<number>
  headOpacity: MotionValue<number>
  accent: string
  gradId: string
  glowId: string
  reduce: boolean
}) {
  const d = PATHS[variant]
  const isRibbon = variant === 'ribbon'
  const isCircuit = variant === 'circuit'
  const isSerpent = variant === 'serpent'

  /* The serpent is the only variant with life of its own: a slow lateral
   * drift, so the rope looks like it is under tension rather than printed.
   * Justified because this variant's whole idea is that it moves like a body.
   * The other four move only because the reader moves. */
  const drift =
    reduce || !isSerpent
      ? {}
      : {
          animate: { x: [0, 9, 0, -7, 0] },
          transition: {
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        }

  return (
    <motion.g {...drift}>
      {/* The unlit rail: shows where the thread is going before you get there. */}
      <path
        d={d}
        stroke={INK}
        strokeWidth={isRibbon ? 1 : 1.25}
        strokeLinecap="round"
        strokeDasharray={isCircuit ? '2 7' : undefined}
        vectorEffect="non-scaling-stroke"
        fill="none"
      />

      {isRibbon && (
        /* The wide soft band. Its gradient fades at both ends, which is what
           gives it the tapered look without a second outline path. */
        <motion.path
          d={d}
          stroke={`url(#${gradId})`}
          strokeWidth={24}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          fill="none"
          style={{ pathLength: progress }}
        />
      )}

      {isSerpent && (
        /* Second strand, offset. Two strands crossing read as a rope; one sine
           curve on its own reads as a squiggle. */
        <motion.path
          d={d}
          stroke={accent}
          strokeOpacity={0.22}
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          fill="none"
          transform="translate(15 0)"
          style={{ pathLength: progress }}
        />
      )}

      {/* The drawn line itself. */}
      <motion.path
        d={d}
        stroke={accent}
        strokeOpacity={isRibbon ? 0.62 : 0.46}
        strokeWidth={isRibbon ? 1.5 : isCircuit ? 1.75 : 1.6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
        style={{ pathLength: progress }}
      />

      {isCircuit &&
        CIRCUIT_JOINTS.map(([x, y], i) => (
          <Joint
            key={i}
            x={x}
            y={y}
            at={(i + 0.6) / (CIRCUIT_JOINTS.length + 1)}
            progress={progress}
            accent={accent}
          />
        ))}

      {/* Comet head. Suppressed under reduced motion, where the line simply
          exists at its scroll position with no lit tip. */}
      {!reduce && (
        <motion.path
          d={d}
          stroke={accent}
          strokeWidth={isRibbon ? 3 : 2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          fill="none"
          filter={`url(#${glowId})`}
          style={{
            pathLength: 0.055,
            pathOffset: headOffset,
            opacity: headOpacity,
          }}
        />
      )}
    </motion.g>
  )
}

/* A solder dot on the circuit variant, lighting as the line reaches it. */
function Joint({
  x,
  y,
  at,
  progress,
  accent,
}: {
  x: number
  y: number
  at: number
  progress: MotionValue<number>
  accent: string
}) {
  const opacity = useTransform(progress, [at - 0.06, at], [0, 1])
  const scale = useTransform(progress, [at - 0.06, at], [0.4, 1])
  return (
    <motion.rect
      x={x - 3}
      y={y - 3}
      width={6}
      height={6}
      fill={accent}
      style={{ opacity, scale, transformOrigin: `${x}px ${y}px` }}
    />
  )
}

/* ------------------------------------------------------------------ */

function Strata({
  progress,
  accent,
  reduce,
}: {
  progress: MotionValue<number>
  accent: string
  reduce: boolean
}) {
  return (
    <g>
      {TICKS.map((t, i) => (
        <Tick
          key={i}
          tick={t}
          progress={progress}
          accent={accent}
          reduce={reduce}
        />
      ))}
    </g>
  )
}

function Tick({
  tick,
  progress,
  accent,
  reduce,
}: {
  tick: { y: number; len: number; at: number }
  progress: MotionValue<number>
  accent: string
  reduce: boolean
}) {
  const lit = useTransform(progress, [tick.at - 0.05, tick.at], [0, 1])
  const width = useTransform(lit, (v) => 8 + v * (tick.len - 8))
  const opacity = useTransform(lit, [0, 1], [0.14, 0.62])

  return (
    <>
      {/* Unlit measure, so the column has a shape before you scroll into it. */}
      <rect x={26} y={tick.y} width={tick.len} height={1} fill={INK} />
      <motion.rect
        x={26}
        y={tick.y}
        height={reduce ? 1 : 1.5}
        fill={accent}
        style={{ width, opacity }}
      />
    </>
  )
}
