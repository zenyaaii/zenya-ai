'use client'

import { useMemo, useState } from 'react'

const DOW_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DOW_SHORT = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

/**
 * Traffic by hour of the local week.
 *
 * For a restaurant or a salon this is the single most actionable chart on the
 * page: it answers "when should I post" with the owner's own numbers instead
 * of a guess. Bucketed in the owner's timezone server-side, so "الجمعة 8 م"
 * means their Friday evening, not UTC's.
 */
export default function Heatmap({
  cells, tzLabel,
}: {
  cells: Array<{ dow: number; hour: number; views: number }>
  tzLabel: string
}) {
  const [hover, setHover] = useState<{ dow: number; hour: number; views: number } | null>(null)

  const { grid, max, total } = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
    let m = 0
    let t = 0
    for (const c of cells) {
      if (c.dow < 0 || c.dow > 6 || c.hour < 0 || c.hour > 23) continue
      g[c.dow][c.hour] = c.views
      if (c.views > m) m = c.views
      t += c.views
    }
    return { grid: g, max: m, total: t }
  }, [cells])

  if (total === 0) {
    return (
      <div className="px-4 py-10 text-center text-[12.5px] text-muted">
        لا توجد زيارات كافية بعد لرسم خريطة الأوقات.
      </div>
    )
  }

  const peak = cells.reduce((m, c) => (c.views > m.views ? c : m), cells[0])

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* hour ruler */}
          <div className="flex items-center gap-1 ps-12">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[9px] tabular-nums text-muted/70">
                {h % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>

          {grid.map((row, dow) => (
            <div key={dow} className="mt-1 flex items-center gap-1">
              <div className="w-11 shrink-0 text-[11px] text-muted">{DOW_SHORT[dow]}</div>
              {row.map((v, hour) => {
                // sqrt scale: linear washes out everything but the single peak
                const intensity = max === 0 ? 0 : Math.sqrt(v / max)
                return (
                  <button
                    key={hour}
                    type="button"
                    onMouseEnter={() => setHover({ dow, hour, views: v })}
                    onFocus={() => setHover({ dow, hour, views: v })}
                    onMouseLeave={() => setHover(null)}
                    onBlur={() => setHover(null)}
                    aria-label={`${DOW_AR[dow]} ${hour}:00 — ${v} مشاهدة`}
                    className="h-6 flex-1 rounded-[3px] outline-none ring-primary/60 transition focus-visible:ring-2"
                    style={{
                      background:
                        v === 0
                          ? 'rgba(28,28,28,0.04)'
                          : `rgba(94,106,210,${(0.12 + intensity * 0.78).toFixed(3)})`,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted">
        <span>
          {hover
            ? `${DOW_AR[hover.dow]} · ${hover.hour}:00 — ${hover.views.toLocaleString('ar')} مشاهدة`
            : peak && peak.views > 0
              ? `الذروة: ${DOW_AR[peak.dow]} الساعة ${peak.hour}:00`
              : ''}
        </span>
        <span className="flex items-center gap-1.5">
          أقل
          {[0.06, 0.3, 0.55, 0.8, 1].map((o) => (
            <span
              key={o}
              className="h-3 w-3 rounded-[2px]"
              style={{ background: `rgba(94,106,210,${o})` }}
            />
          ))}
          أكثر
          <span className="ms-1.5 opacity-70">· {tzLabel}</span>
        </span>
      </div>
    </div>
  )
}
