/**
 * The build wizard's movement data (wizard_events) turned into one table per
 * wizard for the admin «الزوار» tab. Pure, so it can be checked on its own.
 */
export type Ev = { session: string; wizard: string; label: string | null; step_id: string | null; step_title: string | null; step_index: number | null; step_count: number | null; event: string; how: string | null; ms: number | null; note: string | null; at: string }

export type StepRow = { id: string; title: string; i: number; reached: number; avgMs: number | null; skipped: number; back: number; left: number }
export type WizardFunnel = { key: string; label: string; wizard: string; started: number; finished: number; steps: StepRow[] }

/** Time on a step above 30 minutes is a tab left open, not reading. */
const CAP = 30 * 60_000

export function funnels(rows: Ev[]): WizardFunnel[] {
  const by = new Map<string, Ev[]>()
  for (const r of rows) {
    const k = r.wizard + '|' + (r.label ?? '')
    if (!by.has(k)) by.set(k, [])
    by.get(k)!.push(r)
  }
  const out: WizardFunnel[] = []
  for (const [key, evs] of by) {
    const sessions = new Map<string, Ev[]>()
    for (const e of evs) { if (!sessions.has(e.session)) sessions.set(e.session, []); sessions.get(e.session)!.push(e) }
    const steps = new Map<string, { i: number; title: string; reached: Set<string>; ms: number[]; skipped: Set<string>; back: Set<string>; left: number }>()
    const step = (id: string, i: number) => {
      if (!steps.has(id)) steps.set(id, { i, title: '', reached: new Set(), ms: [], skipped: new Set(), back: new Set(), left: 0 })
      const s = steps.get(id)!; s.i = Math.min(s.i, i); return s
    }
    let finished = 0
    for (const [sid, list] of sessions) {
      list.sort((a, b) => a.at.localeCompare(b.at))
      const views = new Map<string, number>()
      let last: Ev | null = null
      for (const e of list) {
        if (!e.step_id) continue
        const s = step(e.step_id, e.step_index ?? 0)
        if (e.event === 'view') { if (e.step_title) s.title = e.step_title; s.reached.add(sid); views.set(e.step_id, (views.get(e.step_id) ?? 0) + 1); last = e }
        if (e.event === 'leave') {
          if (e.ms != null && e.ms > 0) s.ms.push(Math.min(e.ms, CAP))
          if (e.how === 'skip') s.skipped.add(sid)
        }
      }
      for (const [id, c] of views) if (c > 1) steps.get(id)!.back.add(sid)
      if (list.some((e) => e.event === 'finish')) finished++
      else if (last?.step_id) step(last.step_id, last.step_index ?? 0).left++
    }
    const first = evs[0]
    out.push({
      key, wizard: first.wizard, label: first.label || first.wizard,
      started: sessions.size, finished,
      steps: [...steps.entries()].sort((a, b) => a[1].i - b[1].i).map(([id, s]) => ({
        id, title: s.title || id, i: s.i, reached: s.reached.size,
        avgMs: s.ms.length ? Math.round(s.ms.reduce((a, b) => a + b, 0) / s.ms.length) : null,
        skipped: s.skipped.size, back: s.back.size, left: s.left,
      })),
    })
  }
  return out.sort((a, b) => b.started - a.started)
}

