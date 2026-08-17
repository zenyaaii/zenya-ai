'use client'

/**
 * PublishingPlan — a small launch checklist that lives in the dashboard aside,
 * right under Quick Actions. Each row links to the page for that step (fast
 * access) and has a circle the owner ticks themselves. Ticking is purely
 * manual — click the circle and it turns into a green check, whether or not the
 * step was "really" done — so the owner stays in control. A small reset button
 * clears the ticks to start over. Progress persists in localStorage.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Check, RotateCcw, Sparkles, Pencil, Rocket, Search, Globe, type LucideIcon,
} from 'lucide-react'

const LS_KEY = 'zenya_launch_plan_v2'

type StepKey = 'create' | 'edit' | 'publish' | 'seo' | 'domain'

const STEPS: { key: StepKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: 'create',  label: 'أنشئ موقعك',   href: '/theme/new',         icon: Sparkles },
  { key: 'edit',    label: 'خصّص محتواك',  href: '/dashboard/sites',   icon: Pencil },
  { key: 'publish', label: 'انشُر موقعك',  href: '/dashboard/sites',   icon: Rocket },
  { key: 'seo',     label: 'هيّئ السيو',   href: '/dashboard/seo',     icon: Search },
  { key: 'domain',  label: 'اربط نطاقك',   href: '/dashboard/domains', icon: Globe },
]

type Done = Partial<Record<StepKey, boolean>>

export default function PublishingPlan() {
  const [done, setDone] = useState<Done>({})
  const [hydrated, setHydrated] = useState(false)

  // localStorage gives an instant paint; the server row is the source of truth
  // so the checklist follows the owner across devices (not per-browser).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY)
      if (raw) setDone(JSON.parse(raw))
    } catch {}
    setHydrated(true)
    ;(async () => {
      try {
        const r = await fetch('/api/onboarding', { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (j && j.launchPlan && typeof j.launchPlan === 'object') {
          setDone(j.launchPlan as Done)
          try { window.localStorage.setItem(LS_KEY, JSON.stringify(j.launchPlan)) } catch {}
        }
      } catch {}
    })()
  }, [])

  function persist(next: Done) {
    setDone(next)
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
    // fire-and-forget server sync so other devices see the same ticks
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ launchPlan: next }),
    }).catch(() => {})
  }

  function toggle(key: StepKey) {
    persist({ ...done, [key]: !done[key] })
  }

  function reset() {
    persist({})
  }

  const doneCount = STEPS.filter((s) => done[s.key]).length
  const total = STEPS.length
  const allDone = doneCount === total

  return (
    <div className="rounded-2xl border border-token bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">خطة الإطلاق</div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold tabular-nums ${allDone ? 'text-[#15803d]' : 'text-primary'}`}
          >
            {hydrated ? `${doneCount}/${total}` : `0/${total}`}
          </span>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-medium text-muted transition hover:bg-black/[0.04] hover:text-foreground"
              title="إعادة التحقق"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2.25} />
              إعادة
            </button>
          )}
        </div>
      </div>

      {/* Thin progress bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[rgba(28,28,28,0.06)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(doneCount / total) * 100}%`, background: allDone ? '#15803d' : '#5e6ad2' }}
        />
      </div>

      <div className="mt-3 space-y-0.5">
        {STEPS.map((s) => {
          const isDone = !!done[s.key]
          return (
            <div key={s.key} className="flex items-center gap-2.5 rounded-md px-1 py-1">
              {/* Manual tick — click to toggle the green check */}
              <button
                type="button"
                onClick={() => toggle(s.key)}
                aria-pressed={isDone}
                aria-label={isDone ? `تراجع عن ${s.label}` : `تحديد ${s.label} كمكتمل`}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  isDone
                    ? 'border-[#15803d] bg-[#15803d] text-white'
                    : 'border-[rgba(28,28,28,0.25)] text-transparent hover:border-primary hover:bg-[rgba(94,106,210,0.08)]'
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </button>

              {/* Label — links straight to the page for that step */}
              <Link
                href={s.href}
                className={`flex flex-1 items-center gap-2 text-[13px] font-medium transition-colors ${
                  isDone ? 'text-muted line-through decoration-[rgba(28,28,28,0.25)]' : 'text-foreground hover:text-primary'
                }`}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} />
                {s.label}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
