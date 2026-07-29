'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import type { Row } from './types'

/* ─── motion ──────────────────────────────────────────────────────────────── */

export const rise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
}

export function Section({
  title, hint, action, children, className = '',
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={'mt-8 ' + className}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        {action ?? (hint && <span className="text-[11.5px] text-muted">{hint}</span>)}
      </div>
      {children}
    </section>
  )
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={'rounded-2xl border border-token bg-white ' + className}>{children}</div>
  )
}

/* ─── delta badge ─────────────────────────────────────────────────────────── */

/**
 * A percentage change against the previous period.
 *
 * `invert` is for metrics where down is good (bounce rate) — the arrow still
 * points the way the number moved, but the colour reflects whether that
 * movement is good for the owner. `null` renders as an em dash: when there is
 * no baseline, "+100%" would be a lie.
 */
export function Delta({
  value, invert = false, className = '',
}: {
  value: number | null | undefined
  invert?: boolean
  className?: string
}) {
  if (value == null) {
    return (
      <span className={'inline-flex items-center gap-0.5 text-[11.5px] text-muted/70 ' + className}>
        <Minus className="h-3 w-3" strokeWidth={2} /> جديد
      </span>
    )
  }
  if (value === 0) {
    return (
      <span className={'inline-flex items-center gap-0.5 text-[11.5px] text-muted ' + className}>
        <Minus className="h-3 w-3" strokeWidth={2} /> 0%
      </span>
    )
  }
  const up = value > 0
  const good = invert ? !up : up
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={
        'inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums ' +
        (good ? 'text-[#15803d] ' : 'text-[#b91c1c] ') + className
      }
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {up ? '+' : ''}{value}%
    </span>
  )
}

/* ─── stat tile ───────────────────────────────────────────────────────────── */

export function Tile({
  label, value, sub, icon: Icon, accent, delta, invertDelta, spark, active, onClick,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  accent: string
  delta?: number | null
  invertDelta?: boolean
  spark?: number[]
  active?: boolean
  onClick?: () => void
}) {
  const interactive = !!onClick
  return (
    <motion.button
      type="button"
      {...rise}
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? !!active : undefined}
      className={
        'group w-full rounded-2xl border bg-white p-4 text-start transition sm:p-5 ' +
        (active ? 'border-primary shadow-[0_0_0_1px_var(--primary)] ' : 'border-token ') +
        (interactive ? 'cursor-pointer hover:border-primary/40 ' : 'cursor-default ')
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${accent}1a` }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} style={{ color: accent }} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[22px] font-bold tracking-tight tabular-nums text-foreground sm:text-[24px]">
          {value}
        </span>
        {delta !== undefined && <Delta value={delta} invert={invertDelta} />}
      </div>
      {spark && spark.length > 1 && <Sparkline values={spark} accent={accent} />}
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
    </motion.button>
  )
}

export function Sparkline({ values, accent }: { values: number[]; accent: string }) {
  const max = Math.max(1, ...values)
  const W = 100
  const H = 22
  const step = values.length > 1 ? W / (values.length - 1) : W
  const d = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)},${(H - (v / max) * (H - 2) - 1).toFixed(2)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 block h-5 w-full" aria-hidden>
      <path d={d} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.75} />
    </svg>
  )
}

/* ─── ranked bar list ─────────────────────────────────────────────────────── */

export function BarList({
  rows, metric = 'views', renderName, emptyLabel = 'لا بيانات بعد', max: maxRows = 100,
}: {
  rows: Row[]
  metric?: 'views' | 'visitors' | 'sessions'
  renderName?: (r: Row) => React.ReactNode
  emptyLabel?: string
  max?: number
}) {
  const shown = rows.slice(0, maxRows)
  if (shown.length === 0) {
    return <div className="px-4 py-8 text-center text-[12.5px] text-muted">{emptyLabel}</div>
  }
  const total = shown.reduce((s, r) => s + r[metric], 0) || 1
  const max = Math.max(1, ...shown.map((r) => r[metric]))
  return (
    <ul className="divide-y divide-[color:var(--border)]">
      {shown.map((r) => {
        const v = r[metric]
        return (
          <li key={r.name} className="relative px-4 py-2.5">
            {/* The bar is a background wash, not a separate row — keeps long
                Arabic labels readable instead of squeezing them into a column. */}
            <div
              className="absolute inset-y-0 start-0 bg-[rgba(94,106,210,0.08)] transition-[width] duration-500"
              style={{ width: `${(v / max) * 100}%` }}
              aria-hidden
            />
            <div className="relative flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
                {renderName ? renderName(r) : r.name}
              </span>
              <span className="shrink-0 whitespace-nowrap text-[12.5px] tabular-nums text-foreground">
                {v.toLocaleString('ar')}
                <span className="ms-1.5 text-[11px] text-muted">
                  {Math.round((v / total) * 100)}%
                </span>
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function PanelWithTitle({
  title, hint, children, footer,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-2 border-b border-token px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        {hint && <span className="text-[10px] uppercase tracking-[0.14em] text-muted/70">{hint}</span>}
      </div>
      {children}
      {footer}
    </Panel>
  )
}

/* ─── table shell ─────────────────────────────────────────────────────────── */

export function Th({ children, align = 'start' }: { children: React.ReactNode; align?: 'start' | 'end' }) {
  return (
    <th
      className={
        'whitespace-nowrap px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted ' +
        (align === 'end' ? 'text-end' : 'text-start')
      }
    >
      {children}
    </th>
  )
}

export function Td({
  children, align = 'start', className = '',
}: {
  children: React.ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  return (
    <td className={'px-4 py-3 ' + (align === 'end' ? 'text-end tabular-nums ' : '') + className}>
      {children}
    </td>
  )
}

/** Horizontal scroll container — wide tables must never make the page scroll. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-start text-[13px]">{children}</table>
      </div>
    </Panel>
  )
}

/* ─── states ──────────────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon, title, body, cta,
}: {
  icon: LucideIcon
  title: string
  body: string
  cta?: { href: string; label: string }
}) {
  return (
    <div className="rounded-2xl border border-dashed border-token bg-white p-8 text-center sm:p-10">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(94,106,210,0.10)]">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-muted">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[var(--primary-600)]"
        >
          {cta.label}
          <ArrowUpRight className="h-3 w-3 rtl-flip" />
        </Link>
      )}
    </div>
  )
}

export function SkeletonTile() {
  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="h-2.5 w-20 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
      <div className="mt-3 h-6 w-24 animate-pulse rounded bg-[rgba(28,28,28,0.06)]" />
      <div className="mt-2 h-2.5 w-28 animate-pulse rounded bg-[rgba(28,28,28,0.04)]" />
    </div>
  )
}

export function SkeletonBlock({ height = 'h-64' }: { height?: string }) {
  return <div className={`animate-pulse rounded-2xl border border-token bg-white ${height}`} />
}

/** A short line that says where a number came from, so nothing looks magic. */
export function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{children}</p>
}
